import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export interface TraceabilityEntry {
  storyId: string;
  title: string;
  version: 'MVP' | 'V1';
  criterion: string;
  testFile: string;
  testMatch: string;
}

export const TRACEABILITY_MATRIX: TraceabilityEntry[] = [
  {
    storyId: 'US-01',
    title: 'Entrar no sistema',
    version: 'MVP',
    criterion: 'Login com Argon2id, erro genérico, bloqueio após 5 falhas e expiração em 30 min',
    testFile: 'server/src/api.integration.test.ts',
    testMatch: 'US-01 e RN-20: autenticação Argon2id',
  },
  {
    storyId: 'US-01',
    title: 'Entrar no sistema',
    version: 'MVP',
    criterion: 'Fluxo de entrada e mensagem genérica na UI',
    testFile: 'e2e/virtuhar3d.e2e.spec.ts',
    testMatch: 'US-01 e US-21: Login, erro genérico e auditoria WCAG AA na entrada',
  },
  {
    storyId: 'US-02',
    title: 'Criar contas dos alunos',
    version: 'MVP',
    criterion: 'Importação em lote de 45 alunos e troca obrigatória de senha >= 8 caracteres',
    testFile: 'server/src/api.integration.test.ts',
    testMatch: 'US-02 e RN-19: admin cria professor, professor importa 45 alunos',
  },
  {
    storyId: 'US-02',
    title: 'Criar contas dos alunos',
    version: 'MVP',
    criterion: 'Criação de turma, importação em lote e primeira troca de senha no navegador',
    testFile: 'e2e/virtuhar3d.e2e.spec.ts',
    testMatch: 'US-02, US-15, US-16 e US-21: Painel do professor',
  },
  {
    storyId: 'US-03',
    title: 'Explorar a bancada em 3D',
    version: 'MVP',
    criterion: 'Carregamento GLB dentro do orçamento de triângulos e cena 3D com >= 30 FPS',
    testFile: 'web/src/three/gltfLoader.test.ts',
    testMatch: 'conta triângulos corretamente e extrai pontos de encaixe ponto_*',
  },
  {
    storyId: 'US-04',
    title: 'Encaixar peças',
    version: 'MVP',
    criterion: 'Encaixe em ponto válido e retirada de peça instalada',
    testFile: 'rules/src/engine.test.ts',
    testMatch: 'permite retirar peça instalada, inspecionar com ESD e valida pré-requisitos',
  },
  {
    storyId: 'US-05',
    title: 'Validar compatibilidade',
    version: 'MVP',
    criterion: 'Recusa CPU de soquete incompatível (RN-01)',
    testFile: 'rules/src/engine.test.ts',
    testMatch: 'RN-01: recusa CPU com soquete diferente da placa-mãe',
  },
  {
    storyId: 'US-05',
    title: 'Validar compatibilidade',
    version: 'MVP',
    criterion: 'Recusa memória incompatível ou slot ocupado (RN-02)',
    testFile: 'rules/src/engine.test.ts',
    testMatch: 'RN-02: recusa RAM DDR3 em placa-mãe DDR4',
  },
  {
    storyId: 'US-05',
    title: 'Validar compatibilidade',
    version: 'MVP',
    criterion: 'Recusa fonte sem margem de +20% ou conector ausente (RN-05/RN-06)',
    testFile: 'rules/src/engine.test.ts',
    testMatch: 'RN-05 e RN-06: recusa POST ao ligar se potência da fonte',
  },
  {
    storyId: 'US-06',
    title: 'Respeitar a ordem de montagem',
    version: 'MVP',
    criterion: 'Recusa cooler sem pasta térmica ou pasta sem CPU',
    testFile: 'rules/src/engine.test.ts',
    testMatch: 'Ordem: recusa instalar cooler sem pasta térmica',
  },
  {
    storyId: 'US-07',
    title: 'Cumprir o protocolo ESD',
    version: 'MVP',
    criterion: 'Bloqueia manuseio sensível sem pulseira ESD (RN-11) e penaliza retirada (RN-12/13)',
    testFile: 'rules/src/engine.test.ts',
    testMatch: 'RN-11: impede encaixar peça sensível (CPU/RAM) sem pulseira ESD',
  },
  {
    storyId: 'US-08',
    title: 'Ligar o computador e ver o POST',
    version: 'MVP',
    criterion: 'Jump nos pinos PWR_SW exibe POST e diagnostica componentes ausentes',
    testFile: 'e2e/virtuhar3d.e2e.spec.ts',
    testMatch: 'US-03 a US-11 e US-21: Fluxo completo da missão M01',
  },
  {
    storyId: 'US-09',
    title: 'Seguir o Modo Guiado',
    version: 'MVP',
    criterion: 'Desconta dicas no Modo Guiado e conduz passos com pré-requisitos',
    testFile: 'rules/src/engine.test.ts',
    testMatch: 'desconta dicas no modo guiado (até 10 pts)',
  },
  {
    storyId: 'US-10',
    title: 'Receber feedback imediato',
    version: 'MVP',
    criterion: 'Legenda visual acessível acompanha feedback sonoro (POST, erro, encaixe)',
    testFile: 'web/src/audio/biosAudio.test.ts',
    testMatch: 'retorna legenda visual explícita para POST, erro e encaixe',
  },
  {
    storyId: 'US-11',
    title: 'Ver o relatório da sessão',
    version: 'MVP',
    criterion: 'Cálculo de pontuação, envio em lote de eventos e persistência de relatório',
    testFile: 'server/src/api.integration.test.ts',
    testMatch: 'fluxo completo de missão, ingestão de eventos em lote, pontuação autoritativa',
  },
  {
    storyId: 'US-21',
    title: 'Usar o sistema com acessibilidade',
    version: 'MVP',
    criterion: 'WCAG AA (axe-core), texto alternativo em catálogo e navegação por teclado em M00',
    testFile: 'e2e/virtuhar3d.e2e.spec.ts',
    testMatch: 'US-07, US-09, US-11 e US-21: Fluxo completo da missão M00',
  },
  {
    storyId: 'US-22',
    title: 'Carregar rápido com a turma toda',
    version: 'MVP',
    criterion: 'Pacote GLB por missão <= 30 MB, peças <= 1,5 MB e <= 100k triângulos',
    testFile: 'scripts/validate-assets.test.ts',
    testMatch: 'valida catálogo pecas.json, missões M00/M01 e cpu-teste.glb dentro do orçamento',
  },
];

export interface TraceabilityVerificationResult {
  ok: boolean;
  totalCriteria: number;
  verifiedCriteria: number;
  missingMatches: string[];
  uncoveredMvpStories: string[];
}

const REQUIRED_MVP_STORIES = [
  'US-01',
  'US-02',
  'US-03',
  'US-04',
  'US-05',
  'US-06',
  'US-07',
  'US-08',
  'US-09',
  'US-10',
  'US-11',
  'US-21',
  'US-22',
];

export function verifyTraceabilityMatrix(
  rootDir: string = process.cwd(),
): TraceabilityVerificationResult {
  const missingMatches: string[] = [];
  const fileCache = new Map<string, string>();
  const coveredStories = new Set<string>();
  let verifiedCriteria = 0;

  for (const entry of TRACEABILITY_MATRIX) {
    const absPath = path.join(rootDir, entry.testFile);
    if (!fs.existsSync(absPath)) {
      missingMatches.push(`${entry.storyId}: arquivo de teste não encontrado (${entry.testFile}).`);
      continue;
    }

    let content = fileCache.get(absPath);
    if (content === undefined) {
      content = fs.readFileSync(absPath, 'utf-8');
      fileCache.set(absPath, content);
    }

    if (!content.includes(entry.testMatch)) {
      missingMatches.push(
        `${entry.storyId}: caso de teste "${entry.testMatch}" ausente em ${entry.testFile}.`,
      );
      continue;
    }

    coveredStories.add(entry.storyId);
    verifiedCriteria += 1;
  }

  const uncoveredMvpStories = REQUIRED_MVP_STORIES.filter((id) => !coveredStories.has(id));

  return {
    ok: missingMatches.length === 0 && uncoveredMvpStories.length === 0,
    totalCriteria: TRACEABILITY_MATRIX.length,
    verifiedCriteria,
    missingMatches,
    uncoveredMvpStories,
  };
}

export function renderTraceabilityMarkdown(): string {
  const lines = [
    '# Matriz de Rastreabilidade MVP — VIRTUHAR3D',
    '',
    'Gerado a partir de `scripts/traceability-report.ts` em conformidade com o Documento 14 (Seção 3).',
    '',
    '| História | Critério / Evidência | Arquivo de Teste | Caso Verificado |',
    '| --- | --- | --- | --- |',
  ];

  for (const entry of TRACEABILITY_MATRIX) {
    lines.push(
      `| ${entry.storyId} (${entry.version}) — ${entry.title} | ${entry.criterion} | \`${entry.testFile}\` | \`${entry.testMatch}\` |`,
    );
  }

  lines.push('');
  return lines.join('\n');
}

function runCli(): void {
  const result = verifyTraceabilityMatrix();
  if (process.argv.includes('--write')) {
    const outPath = path.join(process.cwd(), 'docs', 'rastreabilidade-mvp.md');
    fs.writeFileSync(outPath, renderTraceabilityMarkdown(), 'utf-8');
    console.log(`Relatório gravado em ${outPath}`);
  }

  console.log(
    `Rastreabilidade MVP: ${result.verifiedCriteria}/${result.totalCriteria} critérios mapeados e confirmados.`,
  );
  if (!result.ok) {
    for (const msg of result.missingMatches) {
      console.error(`ERRO RASTREABILIDADE: ${msg}`);
    }
    if (result.uncoveredMvpStories.length > 0) {
      console.error(`Histórias MVP sem cobertura: ${result.uncoveredMvpStories.join(', ')}`);
    }
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
