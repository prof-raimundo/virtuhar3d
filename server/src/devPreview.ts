import http from 'node:http';
import 'dotenv/config';
import { newDb } from 'pg-mem';
import { createServer as createViteServer } from 'vite';
import { buildApp } from './app.js';
import { loadValidatedContent } from './contentLoader.js';
import { createPgPool, runMigrations, type DbPool, type QueryResultRow } from './db.js';
import { seedInitialData } from './seed.js';

async function createDevDatabase(): Promise<{ db: DbPool; mode: 'postgres' | 'pg-mem' }> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const db = createPgPool(url);
    await runMigrations(db);
    await seedInitialData(db);
    return { db, mode: 'postgres' };
  }

  const mem = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
  const pgAdapter = mem.adapters.createPg();
  const pool = new pgAdapter.Pool();

  const db: DbPool = {
    query: async <T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) => {
      const result = await pool.query(text, params);
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount,
      };
    },
    end: async () => {
      await pool.end();
    },
  };

  await runMigrations(db);
  await seedInitialData(db);
  return { db, mode: 'pg-mem' };
}

async function main(): Promise<void> {
  const { db, mode } = await createDevDatabase();
  const content = loadValidatedContent();
  const fastify = await buildApp({
    db,
    content,
    sessionTtlMinutes: Number(process.env.SESSION_TTL_MINUTES ?? '30'),
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    corsOrigin: true,
    logger: false,
  });

  await fastify.ready();

  const enableHmr = process.env.ENABLE_HMR === 'true';
  if (!enableHmr) {
    process.env.DISABLE_HMR = 'true';
  }
  const server = http.createServer((req, res) => {
    const url = req.url ?? '/';
    if (url.startsWith('/api')) {
      fastify.routing(req, res);
      return;
    }
    vite.middlewares(req, res);
  });

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: enableHmr,
      ws: { server },
      watch: enableHmr ? {} : null,
    },
  });

  const port = Number(process.env.PORT ?? '3000');
  server.listen(port, '0.0.0.0', () => {
    console.log(
      `VIRTUHAR3D Dev Server ativo em http://0.0.0.0:${port} (API Fastify + Vite, banco: ${mode})`,
    );
  });

  const shutdown = async () => {
    await vite.close();
    await fastify.close();
    await db.end();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });
}

main().catch((err: unknown) => {
  console.error('Erro ao iniciar servidor de desenvolvimento VIRTUHAR3D:', err);
  process.exit(1);
});
