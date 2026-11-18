import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const MAX_GLB_BYTES = 1.5 * 1024 * 1024; // 1.5 MB por peça (Doc 12 §2)
export const MAX_MISSION_BYTES = 30 * 1024 * 1024; // 30 MB por missão (Doc 12 §2, RNF-02)
export const MAX_SCENE_TRIANGLES = 100_000; // 100 mil triângulos por cena (Doc 12 §1)
export const MAX_TEXTURE_PX = 1024; // 1024x1024 WebP (Doc 12 §2)
export const ALLOWED_LICENSES = new Set(['CC0', 'CC-BY']);

export const TRIANGLE_BUDGET_BY_TIPO: Record<string, number> = {
  bancada: 2000,
  monitor: 3000,
  placa_mae: 15000,
  cpu: 1000,
  cooler: 8000,
  ram: 2000,
  fonte: 5000,
  cabo: 3000,
  ferramenta: 2000,
  gabinete: 25000,
  armazenamento: 4000,
  gpu: 12000,
};

interface GltfAccessor {
  count?: number;
}

interface GltfPrimitive {
  mode?: number;
  indices?: number;
  attributes?: Record<string, number>;
}

interface GltfMesh {
  primitives?: GltfPrimitive[];
}

interface GltfNode {
  name?: string;
}

interface GltfBufferView {
  byteOffset?: number;
  byteLength: number;
}

interface GltfImage {
  mimeType?: string;
  bufferView?: number;
  uri?: string;
}

interface GltfJson {
  asset?: { version?: string };
  nodes?: GltfNode[];
  meshes?: GltfMesh[];
  accessors?: GltfAccessor[];
  bufferViews?: GltfBufferView[];
  images?: GltfImage[];
}

export interface ParsedGlbSummary {
  bytes: number;
  triangles: number;
  nodes: string[];
  snapPoints: string[];
  textures: Array<{
    mimeType: string;
    width: number | null;
    height: number | null;
  }>;
}

export interface PecaJsonEntry {
  id: string;
  tipo: string;
  nome: string;
  modelo3d: string;
  pontosDeEncaixe: string[];
  textoAlternativo: string;
  licenca: {
    tipo: string;
    autor: string;
    origem: string;
  };
}

export interface MissaoJsonEntry {
  id: string;
  pecasDisponiveis: string[];
  estadoInicial?: {
    instaladas?: Record<string, string>;
  };
}

export interface AssetValidationReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  pecasChecked: number;
  glbFilesChecked: number;
  totalGlbBytes: number;
  totalGlbTriangles: number;
  missionBudgets: Array<{
    missaoId: string;
    totalBytes: number;
    estimatedTriangles: number;
  }>;
}

function readWebpDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 30) {
    return null;
  }
  const riff = buf.toString('ascii', 0, 4);
  const webp = buf.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || webp !== 'WEBP') {
    return null;
  }

  const chunkType = buf.toString('ascii', 12, 16);
  if (chunkType === 'VP8X' && buf.length >= 30) {
    const width = 1 + buf.readUIntLE(24, 3);
    const height = 1 + buf.readUIntLE(27, 3);
    return { width, height };
  }
  if (chunkType === 'VP8 ' && buf.length >= 30) {
    const width = buf.readUInt16LE(26) & 0x3fff;
    const height = buf.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }
  if (chunkType === 'VP8L' && buf.length >= 25) {
    const bits = buf.readUInt32LE(21);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }
  return null;
}

export function parseGlbBuffer(buffer: Buffer): ParsedGlbSummary {
  if (buffer.length < 20) {
    throw new Error('Arquivo GLB inválido: cabeçalho menor que 20 bytes.');
  }

  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const declaredLength = buffer.readUInt32LE(8);
  if (magic !== 0x46546c67 || version !== 2) {
    throw new Error(`Cabeçalho GLB inválido (magic=${magic}, version=${version}).`);
  }
  if (declaredLength > buffer.length) {
    throw new Error('Arquivo GLB truncado em relação ao tamanho declarado.');
  }

  let offset = 12;
  let gltfJson: GltfJson | null = null;
  let binBuffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);

  while (offset + 8 <= declaredLength) {
    const chunkLen = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLen;
    if (chunkEnd > declaredLength) {
      throw new Error('Chunk GLB ultrapassa o fim do arquivo.');
    }

    if (chunkType === 0x4e4f534a) {
      const jsonText = buffer.subarray(chunkStart, chunkEnd).toString('utf-8');
      gltfJson = JSON.parse(jsonText) as GltfJson;
    } else if (chunkType === 0x004e4942) {
      binBuffer = buffer.subarray(chunkStart, chunkEnd);
    }

    offset = chunkEnd;
  }

  if (!gltfJson || gltfJson.asset?.version !== '2.0') {
    throw new Error('Chunk JSON glTF 2.0 ausente ou inválido.');
  }

  const accessors = gltfJson.accessors ?? [];
  let triangles = 0;

  for (const mesh of gltfJson.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const mode = primitive.mode ?? 4; // 4 = TRIANGLES
      const count =
        primitive.indices !== undefined
          ? (accessors[primitive.indices]?.count ?? 0)
          : primitive.attributes?.['POSITION'] !== undefined
            ? (accessors[primitive.attributes['POSITION']]?.count ?? 0)
            : 0;

      if (mode === 4) {
        triangles += Math.floor(count / 3);
      } else if ((mode === 5 || mode === 6) && count >= 3) {
        triangles += count - 2;
      }
    }
  }

  const nodes = (gltfJson.nodes ?? [])
    .map((n) => n.name)
    .filter((name): name is string => Boolean(name));
  const snapPoints = nodes.filter((name) => name.startsWith('ponto_'));

  const bufferViews = gltfJson.bufferViews ?? [];
  const textures: ParsedGlbSummary['textures'] = [];

  for (const image of gltfJson.images ?? []) {
    const mimeType = image.mimeType ?? 'application/octet-stream';
    let width: number | null = null;
    let height: number | null = null;
    const bv = image.bufferView !== undefined ? bufferViews[image.bufferView] : undefined;
    if (bv) {
      const start = bv.byteOffset ?? 0;
      const slice = binBuffer.subarray(start, start + bv.byteLength);
      const dims = readWebpDimensions(slice);
      if (dims) {
        width = dims.width;
        height = dims.height;
      }
    }
    textures.push({ mimeType, width, height });
  }

  return {
    bytes: buffer.length,
    triangles,
    nodes,
    snapPoints,
    textures,
  };
}

function collectGlbFiles(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }
  const results: string[] = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.glb')) {
        results.push(fullPath);
      }
    }
  }
  return results.sort();
}

export function validateProjectAssets(rootDir: string = process.cwd()): AssetValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const pecasPath = path.join(rootDir, 'content', 'data', 'pecas.json');
  const missoesDir = path.join(rootDir, 'content', 'data', 'missoes');
  const modelosDir = path.join(rootDir, 'public', 'modelos');

  const pecasFile = JSON.parse(fs.readFileSync(pecasPath, 'utf-8')) as {
    pecas: PecaJsonEntry[];
  };
  const pecasMap = new Map(pecasFile.pecas.map((p) => [p.id, p]));

  // 1. Validar metadados obrigatórios do catálogo (Documento 12 §§4, 5, 7, 8)
  for (const peca of pecasFile.pecas) {
    if (!/^[a-z0-9-]+$/.test(peca.id)) {
      errors.push(`Peça "${peca.id}": id deve conter apenas minúsculas, números e hífen.`);
    }
    if (!peca.textoAlternativo || peca.textoAlternativo.trim().length < 5) {
      errors.push(`Peça "${peca.id}": textoAlternativo obrigatório ausente (RNF-09).`);
    }
    if (!ALLOWED_LICENSES.has(peca.licenca.tipo)) {
      errors.push(
        `Peça "${peca.id}": licença "${peca.licenca.tipo}" não permitida (use CC0 ou CC-BY, RNF-14).`,
      );
    }
    if (!peca.licenca.autor.trim() || !peca.licenca.origem.trim()) {
      errors.push(`Peça "${peca.id}": autor e origem da licença são obrigatórios.`);
    }
    if (!peca.modelo3d.endsWith('.glb')) {
      errors.push(`Peça "${peca.id}": modelo3d "${peca.modelo3d}" deve apontar para arquivo .glb.`);
    }
  }

  // 2. Validar arquivos GLB presentes em public/modelos/**
  const glbFiles = collectGlbFiles(modelosDir);
  if (glbFiles.length === 0) {
    errors.push('Nenhum arquivo .glb encontrado em public/modelos.');
  }

  let totalGlbBytes = 0;
  let totalGlbTriangles = 0;
  const glbSizeByRelativePath = new Map<string, number>();

  for (const absPath of glbFiles) {
    const relFromPublic = path.relative(path.join(rootDir, 'public'), absPath).replace(/\\/g, '/');
    const raw = fs.readFileSync(absPath);

    try {
      const parsed = parseGlbBuffer(raw);
      totalGlbBytes += parsed.bytes;
      totalGlbTriangles += parsed.triangles;
      glbSizeByRelativePath.set(relFromPublic, parsed.bytes);

      if (parsed.bytes > MAX_GLB_BYTES) {
        errors.push(
          `Asset "${relFromPublic}" excede 1,5 MB (${(parsed.bytes / (1024 * 1024)).toFixed(2)} MB).`,
        );
      }

      if (parsed.snapPoints.length === 0) {
        errors.push(`Asset "${relFromPublic}" não possui nós de encaixe "ponto_*".`);
      }

      for (const tex of parsed.textures) {
        if (tex.mimeType !== 'image/webp') {
          errors.push(
            `Asset "${relFromPublic}" contém textura "${tex.mimeType}" (somente image/webp permitido).`,
          );
        }
        if (
          (tex.width !== null && tex.width > MAX_TEXTURE_PX) ||
          (tex.height !== null && tex.height > MAX_TEXTURE_PX)
        ) {
          errors.push(
            `Asset "${relFromPublic}" excede textura ${MAX_TEXTURE_PX}x${MAX_TEXTURE_PX} (${tex.width}x${tex.height}).`,
          );
        }
      }

      const pecaAssociada = pecasFile.pecas.find((p) => p.modelo3d === relFromPublic);
      if (pecaAssociada) {
        const budget = TRIANGLE_BUDGET_BY_TIPO[pecaAssociada.tipo] ?? 5000;
        if (parsed.triangles > budget) {
          errors.push(
            `Asset "${relFromPublic}" tem ${parsed.triangles} triângulos (limite ${budget} para tipo ${pecaAssociada.tipo}).`,
          );
        }
        for (const ponto of pecaAssociada.pontosDeEncaixe) {
          if (!parsed.snapPoints.includes(ponto)) {
            errors.push(
              `Asset "${relFromPublic}" não contém ponto de encaixe "${ponto}" declarado em pecas.json.`,
            );
          }
        }
      } else if (relFromPublic === 'modelos/teste/cpu-teste.glb') {
        const cpuBudget = TRIANGLE_BUDGET_BY_TIPO['cpu'] ?? 4000;
        if (parsed.triangles > cpuBudget) {
          errors.push(
            `Asset "${relFromPublic}" excede orçamento de CPU (${parsed.triangles} > ${cpuBudget}).`,
          );
        }
      } else {
        warnings.push(`Asset "${relFromPublic}" não está referenciado diretamente em pecas.json.`);
      }
    } catch (err) {
      errors.push(
        `Falha ao validar "${relFromPublic}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 3. Validar orçamento por missão (<= 30 MB e <= 100.000 triângulos)
  const missionFiles = fs
    .readdirSync(missoesDir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const missionBudgets: AssetValidationReport['missionBudgets'] = [];

  for (const file of missionFiles) {
    const missao = JSON.parse(
      fs.readFileSync(path.join(missoesDir, file), 'utf-8'),
    ) as MissaoJsonEntry;

    const ids = new Set<string>([
      ...missao.pecasDisponiveis,
      ...Object.values(missao.estadoInicial?.instaladas ?? {}),
    ]);

    let missionBytes = 0;
    let estimatedTriangles = 0;
    for (const pecaId of ids) {
      const peca = pecasMap.get(pecaId);
      if (!peca) {
        errors.push(`Missão "${missao.id}": peça "${pecaId}" não encontrada em pecas.json.`);
        continue;
      }
      missionBytes += glbSizeByRelativePath.get(peca.modelo3d) ?? 0;
      estimatedTriangles += TRIANGLE_BUDGET_BY_TIPO[peca.tipo] ?? 3000;
    }

    if (missionBytes > MAX_MISSION_BYTES) {
      errors.push(
        `Missão "${missao.id}" excede 30 MB (${(missionBytes / (1024 * 1024)).toFixed(2)} MB).`,
      );
    }
    if (estimatedTriangles > MAX_SCENE_TRIANGLES) {
      errors.push(
        `Missão "${missao.id}" excede orçamento máximo de ${MAX_SCENE_TRIANGLES} triângulos (${estimatedTriangles}).`,
      );
    }

    missionBudgets.push({
      missaoId: missao.id,
      totalBytes: missionBytes,
      estimatedTriangles,
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    pecasChecked: pecasFile.pecas.length,
    glbFilesChecked: glbFiles.length,
    totalGlbBytes,
    totalGlbTriangles,
    missionBudgets,
  };
}

function runCli(): void {
  const report = validateProjectAssets();
  console.log(
    `Validador 3D VIRTUHAR3D: ${report.pecasChecked} peças no catálogo, ${report.glbFilesChecked} GLBs inspecionados (${report.totalGlbTriangles} triângulos reais, ${report.totalGlbBytes} bytes).`,
  );
  for (const m of report.missionBudgets) {
    console.log(
      `  - ${m.missaoId}: teto estimado ${m.estimatedTriangles} triângulos (limite ${MAX_SCENE_TRIANGLES}), pacote GLB ${(m.totalBytes / 1024).toFixed(1)} KB (limite 30 MB).`,
    );
  }
  for (const warning of report.warnings) {
    console.warn(`AVISO: ${warning}`);
  }
  if (!report.ok) {
    for (const error of report.errors) {
      console.error(`ERRO ASSET: ${error}`);
    }
    process.exit(1);
  }
  console.log('Assets e orçamentos 3D validados com sucesso.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
