import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { hashPassword } from './auth.js';
import { createPgPool, runMigrations, type DbPool } from './db.js';

export interface SeedOptions {
  adminUsuario?: string;
  adminSenha?: string;
  professorUsuario?: string;
  professorSenha?: string;
  alunoUsuario?: string;
  alunoSenha?: string;
}

export async function seedInitialData(
  db: DbPool,
  options: SeedOptions = {},
): Promise<{
  adminId: string;
  professorId: string;
  turmaId: string;
  alunoId: string;
}> {
  const adminUser = (options.adminUsuario ?? process.env.SEED_ADMIN_USER ?? 'admin').toLowerCase();
  const adminPass = options.adminSenha ?? process.env.SEED_ADMIN_PASSWORD ?? 'Admin@Virtuhar2026';

  const profUser = (
    options.professorUsuario ??
    process.env.SEED_PROF_USER ??
    'prof.raimundo'
  ).toLowerCase();
  const profPass = options.professorSenha ?? process.env.SEED_PROF_PASSWORD ?? 'Prof@Virtuhar2026';

  const alunoUser = (
    options.alunoUsuario ??
    process.env.SEED_ALUNO_USER ??
    'aluno.teste'
  ).toLowerCase();
  const alunoPass = options.alunoSenha ?? process.env.SEED_ALUNO_PASSWORD ?? 'Aluno@Virtuhar2026';

  const adminId = await upsertSeedUser(db, {
    nome: 'Administrador do Laboratório',
    usuario: adminUser,
    senha: adminPass,
    perfil: 'admin',
  });

  const professorId = await upsertSeedUser(db, {
    nome: 'Prof. Raimundo Nonato',
    usuario: profUser,
    senha: profPass,
    perfil: 'professor',
  });

  const turmaExistente = await db.query<{ id: string }>(
    `SELECT id FROM turmas WHERE nome = $1 AND ano_letivo = $2 AND professor_id = $3`,
    ['2º Info A', 2026, professorId],
  );

  let turmaId = turmaExistente.rows[0]?.id;
  if (!turmaId) {
    turmaId = crypto.randomUUID();
    await db.query(
      `INSERT INTO turmas (id, nome, ano_letivo, professor_id) VALUES ($1, $2, $3, $4)`,
      [turmaId, '2º Info A', 2026, professorId],
    );
  }

  for (const missaoId of ['M00', 'M01']) {
    await db.query(
      `INSERT INTO liberacoes (turma_id, missao_id, liberada)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (turma_id, missao_id)
       DO UPDATE SET liberada = EXCLUDED.liberada`,
      [turmaId, missaoId],
    );
  }

  const alunoId = await upsertSeedUser(db, {
    nome: 'Estudante Demonstração',
    usuario: alunoUser,
    senha: alunoPass,
    perfil: 'aluno',
  });

  await db.query(
    `INSERT INTO matriculas (turma_id, aluno_id)
     VALUES ($1, $2)
     ON CONFLICT (turma_id, aluno_id) DO NOTHING`,
    [turmaId, alunoId],
  );

  await db.query(
    `INSERT INTO pontuacao_aluno (aluno_id, pontos_total, nivel)
     VALUES ($1, 0, 'Aprendiz')
     ON CONFLICT (aluno_id) DO NOTHING`,
    [alunoId],
  );

  return { adminId, professorId, turmaId, alunoId };
}

async function upsertSeedUser(
  db: DbPool,
  input: {
    nome: string;
    usuario: string;
    senha: string;
    perfil: 'admin' | 'professor' | 'aluno';
  },
): Promise<string> {
  const existing = await db.query<{ id: string }>('SELECT id FROM usuarios WHERE usuario = $1', [
    input.usuario,
  ]);
  if (existing.rows[0]?.id) {
    return existing.rows[0].id;
  }

  const id = crypto.randomUUID();
  const hash = await hashPassword(input.senha);
  await db.query(
    `INSERT INTO usuarios (id, nome, usuario, hash_senha, perfil, senha_provisoria, ativo)
     VALUES ($1, $2, $3, $4, $5, FALSE, TRUE)`,
    [id, input.nome, input.usuario, hash, input.perfil],
  );
  return id;
}

const currentFilePath = fileURLToPath(import.meta.url);
const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (executedFilePath === currentFilePath) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Erro: defina DATABASE_URL antes de executar o seed.');
    process.exit(1);
  }

  const db = createPgPool(databaseUrl);
  runMigrations(db)
    .then(() => seedInitialData(db))
    .then((result) => {
      console.log('Seed VIRTUHAR3D concluído com sucesso:', result);
      return db.end();
    })
    .catch((err: unknown) => {
      console.error('Erro ao executar seed VIRTUHAR3D:', err);
      void db.end();
      process.exit(1);
    });
}
