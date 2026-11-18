import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CatalogoInsigniasSchema,
  CatalogoPecasSchema,
  CatalogoQuestoesSchema,
  MissaoSchema,
  RegrasSchema,
  type Insignia,
  type Missao,
  type Peca,
  type Questao,
  type RegrasConfig,
} from '../../content/src/schemas.js';

export interface LoadedContent {
  pecas: Peca[];
  pecasById: Record<string, Peca>;
  regras: RegrasConfig;
  missoes: Missao[];
  missoesById: Record<string, Missao>;
  questoes: Questao[];
  insignias: Insignia[];
}

export function getDefaultContentDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), '..', '..', 'content', 'data');
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown;
}

export function loadValidatedContent(contentDir = getDefaultContentDir()): LoadedContent {
  const pecasParsed = CatalogoPecasSchema.parse(readJson(path.join(contentDir, 'pecas.json')));
  const regrasParsed = RegrasSchema.parse(readJson(path.join(contentDir, 'regras.json')));
  const questoesParsed = CatalogoQuestoesSchema.parse(
    readJson(path.join(contentDir, 'questoes.json')),
  );
  const insigniasParsed = CatalogoInsigniasSchema.parse(
    readJson(path.join(contentDir, 'insignias.json')),
  );

  const missoesDir = path.join(contentDir, 'missoes');
  const missaoFiles = fs
    .readdirSync(missoesDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  const missoes: Missao[] = missaoFiles.map((file) =>
    MissaoSchema.parse(readJson(path.join(missoesDir, file))),
  );

  const pecasById: Record<string, Peca> = {};
  for (const peca of pecasParsed.pecas) {
    pecasById[peca.id] = peca;
  }

  const missoesById: Record<string, Missao> = {};
  for (const m of missoes) {
    missoesById[m.id] = m;
  }

  return {
    pecas: pecasParsed.pecas,
    pecasById,
    regras: regrasParsed,
    missoes,
    missoesById,
    questoes: questoesParsed.questoes,
    insignias: insigniasParsed.insignias,
  };
}
