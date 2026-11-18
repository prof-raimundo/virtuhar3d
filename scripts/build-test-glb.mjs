import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * Gera um arquivo glTF 2.0 binário (.glb) válido e compacto (< 4 KB) para o protótipo M1,
 * contendo uma malha de processador de teste e o nó Empty `ponto_soquete`.
 */
function buildMinimalCpuGlb() {
  // Caixa simples 0.04m x 0.004m x 0.04m (CPU em escala real: 40mm x 4mm x 40mm)
  const hx = 0.02;
  const hy = 0.002;
  const hz = 0.02;

  const positions = new Float32Array([
    // Top (+Y)
    -hx,
    hy,
    hz,
    hx,
    hy,
    hz,
    hx,
    hy,
    -hz,
    -hx,
    hy,
    -hz,
    // Bottom (-Y)
    -hx,
    -hy,
    -hz,
    hx,
    -hy,
    -hz,
    hx,
    -hy,
    hz,
    -hx,
    -hy,
    hz,
    // Front (+Z)
    -hx,
    -hy,
    hz,
    hx,
    -hy,
    hz,
    hx,
    hy,
    hz,
    -hx,
    hy,
    hz,
    // Back (-Z)
    hx,
    -hy,
    -hz,
    -hx,
    -hy,
    -hz,
    -hx,
    hy,
    -hz,
    hx,
    hy,
    -hz,
    // Right (+X)
    hx,
    -hy,
    hz,
    hx,
    -hy,
    -hz,
    hx,
    hy,
    -hz,
    hx,
    hy,
    hz,
    // Left (-X)
    -hx,
    -hy,
    -hz,
    -hx,
    -hy,
    hz,
    -hx,
    hy,
    hz,
    -hx,
    hy,
    -hz,
  ]);

  const normals = new Float32Array([
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0,
    0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1,
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  ]);

  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16,
    18, 19, 20, 21, 22, 20, 22, 23,
  ]);

  const posBytes = Buffer.from(positions.buffer);
  const normBytes = Buffer.from(normals.buffer);
  const idxBytes = Buffer.from(indices.buffer);
  const binRaw = Buffer.concat([posBytes, normBytes, idxBytes]);
  const binPad = (4 - (binRaw.length % 4)) % 4;
  const binChunk = Buffer.concat([binRaw, Buffer.alloc(binPad, 0)]);

  const gltfJson = {
    asset: { version: '2.0', generator: 'VIRTUHAR3D-M1-Prototype' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [
      {
        name: 'cpu-teste-root',
        mesh: 0,
        children: [1],
      },
      {
        name: 'ponto_soquete',
        translation: [0, -0.002, 0],
      },
    ],
    materials: [
      {
        name: 'cpu_ihs',
        pbrMetallicRoughness: {
          baseColorFactor: [0.76, 0.78, 0.81, 1],
          metallicFactor: 0.85,
          roughnessFactor: 0.25,
        },
      },
    ],
    meshes: [
      {
        name: 'cpu_mesh',
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 0,
          },
        ],
      },
    ],
    buffers: [{ byteLength: binRaw.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBytes.length, target: 34962 },
      { buffer: 0, byteOffset: posBytes.length, byteLength: normBytes.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: posBytes.length + normBytes.length,
        byteLength: idxBytes.length,
        target: 34963,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 24,
        type: 'VEC3',
        min: [-hx, -hy, -hz],
        max: [hx, hy, hz],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: 24,
        type: 'VEC3',
      },
      {
        bufferView: 2,
        componentType: 5123,
        count: 36,
        type: 'SCALAR',
      },
    ],
  };

  const jsonRaw = Buffer.from(JSON.stringify(gltfJson), 'utf-8');
  const jsonPad = (4 - (jsonRaw.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonRaw, Buffer.alloc(jsonPad, 0x20)]);

  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // 'glTF'
  header.writeUInt32LE(2, 4); // version 2
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

const outDir = path.resolve(process.cwd(), 'public', 'modelos', 'teste');
fs.mkdirSync(outDir, { recursive: true });
const glbBuffer = buildMinimalCpuGlb();
const outPath = path.join(outDir, 'cpu-teste.glb');
fs.writeFileSync(outPath, glbBuffer);
console.log(`Gerado ${outPath} (${glbBuffer.length} bytes)`);
