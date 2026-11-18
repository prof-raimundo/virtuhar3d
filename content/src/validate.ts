import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  CatalogoInsigniasSchema,
  CatalogoPecasSchema,
  CatalogoQuestoesSchema,
  MissaoSchema,
  RegrasSchema,
  type Missao,
} from './schemas.js';

export interface ContentValidationSummary {
  pecasCount: number;
  missoesCount: number;
  questoesCount: number;
  insigniasCount: number;
}

function readJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as unknown;
}

export function validateContentDirectory(dataDir: string): ContentValidationSummary {
  const pecasRaw = readJsonFile(path.join(dataDir, 'pecas.json'));
  const catalogoPecas = CatalogoPecasSchema.parse(pecasRaw);

  const pecaIds = new Set<string>();
  for (const peca of catalogoPecas.pecas) {
    if (pecaIds.has(peca.id)) {
      throw new Error(`ID de peça duplicado em pecas.json: ${peca.id}`);
    }
    pecaIds.add(peca.id);
  }

  const regrasRaw = readJsonFile(path.join(dataDir, 'regras.json'));
  RegrasSchema.parse(regrasRaw);

  const questoesRaw = readJsonFile(path.join(dataDir, 'questoes.json'));
  const catalogoQuestoes = CatalogoQuestoesSchema.parse(questoesRaw);

  const questaoIds = new Set<string>();
  for (const q of catalogoQuestoes.questoes) {
    if (questaoIds.has(q.id)) {
      throw new Error(`ID de questão duplicado em questoes.json: ${q.id}`);
    }
    if (q.correta >= q.opcoes.length) {
      throw new Error(`Questão ${q.id} possui índice 'correta' fora do intervalo de 'opcoes'`);
    }
    questaoIds.add(q.id);
  }

  const insigniasRaw = readJsonFile(path.join(dataDir, 'insignias.json'));
  const catalogoInsignias = CatalogoInsigniasSchema.parse(insigniasRaw);

  const insigniaIds = new Set<string>();
  for (const ins of catalogoInsignias.insignias) {
    if (insigniaIds.has(ins.id)) {
      throw new Error(`ID de insígnia duplicado em insignias.json: ${ins.id}`);
    }
    insigniaIds.add(ins.id);
  }

  const missoesDir = path.join(dataDir, 'missoes');
  const missaoFiles = fs
    .readdirSync(missoesDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  if (missaoFiles.length === 0) {
    throw new Error('Nenhuma missão encontrada em content/data/missoes');
  }

  const missoesValidadas: Missao[] = [];
  const missaoIds = new Set<string>();

  for (const file of missaoFiles) {
    const missaoRaw = readJsonFile(path.join(missoesDir, file));
    const missao = MissaoSchema.parse(missaoRaw);

    if (missaoIds.has(missao.id)) {
      throw new Error(`ID de missão duplicado: ${missao.id} (${file})`);
    }
    missaoIds.add(missao.id);

    for (const cp of missao.conhecimentosPrevios) {
      if (cp.correta >= cp.opcoes.length) {
        throw new Error(`Missão ${missao.id} (${cp.id}): índice 'correta' fora de 'opcoes'`);
      }
    }

    for (const pecaId of missao.pecasDisponiveis) {
      if (!pecaIds.has(pecaId)) {
        throw new Error(
          `Missão ${missao.id}: pecasDisponiveis referencia peça inexistente '${pecaId}'`,
        );
      }
    }

    for (const instalada of missao.estadoInicial.pecasInstaladas) {
      if (!pecaIds.has(instalada.pecaId)) {
        throw new Error(
          `Missão ${missao.id}: estadoInicial referencia peça inexistente '${instalada.pecaId}'`,
        );
      }
    }

    const passoIds = new Set(missao.passos.map((p) => p.id));
    for (const passo of missao.passos) {
      if (!pecaIds.has(passo.acaoEsperada.peca)) {
        throw new Error(
          `Missão ${missao.id}, passo ${passo.id}: peça '${passo.acaoEsperada.peca}' não existe em pecas.json`,
        );
      }
      for (const req of passo.preRequisitos) {
        if (!passoIds.has(req)) {
          throw new Error(
            `Missão ${missao.id}, passo ${passo.id}: pré-requisito '${req}' não existe`,
          );
        }
      }
    }

    for (const qId of missao.questoes) {
      if (!questaoIds.has(qId)) {
        throw new Error(`Missão ${missao.id}: questão '${qId}' não existe em questoes.json`);
      }
    }

    missoesValidadas.push(missao);
  }

  return {
    pecasCount: catalogoPecas.pecas.length,
    missoesCount: missoesValidadas.length,
    questoesCount: catalogoQuestoes.questoes.length,
    insigniasCount: catalogoInsignias.insignias.length,
  };
}

const currentFile = fileURLToPath(import.meta.url);
const executedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (executedFile && pathToFileURL(currentFile).href === pathToFileURL(executedFile).href) {
  const defaultDataDir = path.resolve(path.dirname(currentFile), '..', 'data');
  const summary = validateContentDirectory(defaultDataDir);
  console.log(
    `Conteúdo válido: ${summary.pecasCount} peças, ${summary.missoesCount} missões, ${summary.questoesCount} questões, ${summary.insigniasCount} insígnias.`,
  );
}
