import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { z } from 'zod';
import { buildApp } from './app.js';
import { loadValidatedContent } from './contentLoader.js';
import { createPgPool, runMigrations } from './db.js';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  API_HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(16).optional(),
  SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  CORS_ORIGIN: z.string().default('https://localhost'),
});

export type ServerEnv = z.infer<typeof EnvSchema>;

export function parseServerEnv(rawEnv: Record<string, string | undefined>): ServerEnv {
  return EnvSchema.parse(rawEnv);
}

export interface HealthStatus {
  status: 'ok';
  service: 'virtuhar3d-api';
  version: string;
}

export function getHealthStatus(): HealthStatus {
  return {
    status: 'ok',
    service: 'virtuhar3d-api',
    version: '0.1.0',
  };
}

export async function startServer(): Promise<void> {
  const env = parseServerEnv(process.env);
  if (!env.DATABASE_URL) {
    throw new Error('Variável DATABASE_URL é obrigatória para iniciar a API.');
  }

  const db = createPgPool(env.DATABASE_URL);
  await runMigrations(db);
  const content = loadValidatedContent();

  const cookieSecure =
    env.COOKIE_SECURE !== undefined ? env.COOKIE_SECURE === 'true' : env.NODE_ENV === 'production';

  const app = await buildApp({
    db,
    content,
    sessionTtlMinutes: env.SESSION_TTL_MINUTES,
    cookieSecure,
    corsOrigin: env.CORS_ORIGIN,
    logger: env.NODE_ENV !== 'test',
  });

  const shutdown = async () => {
    await app.close();
    await db.end();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });

  await app.listen({ port: env.API_PORT, host: env.API_HOST });
}

const currentFilePath = fileURLToPath(import.meta.url);
const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (executedFilePath === currentFilePath) {
  startServer().catch((err: unknown) => {
    console.error('Falha ao iniciar servidor VIRTUHAR3D:', err);
    process.exit(1);
  });
}
