import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

export interface QueryResultRow {
  [column: string]: unknown;
}

export interface DbQueryResult<T extends QueryResultRow = QueryResultRow> {
  rows: T[];
  rowCount: number | null;
}

export interface DbPool {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<DbQueryResult<T>>;
  end: () => Promise<void>;
}

export function createPgPool(connectionString: string): DbPool {
  const pool = new pg.Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  return {
    query: <T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) =>
      pool.query<T>(text, params),
    end: () => pool.end(),
  };
}

export function getDefaultMigrationsDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), '..', 'migrations');
}

export async function runMigrations(
  pool: DbPool,
  migrationsDir = getDefaultMigrationsDir(),
): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      versao TEXT PRIMARY KEY,
      aplicada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const appliedRes = await pool.query<{ versao: string }>('SELECT versao FROM schema_migrations');
  const appliedSet = new Set(appliedRes.rows.map((r) => r.versao));

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const newlyApplied: string[] = [];

  for (const file of files) {
    if (appliedSet.has(file)) {
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (versao) VALUES ($1)', [file]);
    newlyApplied.push(file);
  }

  return newlyApplied;
}
