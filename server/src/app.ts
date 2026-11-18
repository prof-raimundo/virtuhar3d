import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import type { AuthContext } from './auth.js';
import type { LoadedContent } from './contentLoader.js';
import type { DbPool } from './db.js';
import { registerAdminProfessorRoutes } from './routes/adminProfessorRoutes.js';
import { registerAuthRoutes } from './routes/authRoutes.js';
import { registerMissoesSessoesRoutes } from './routes/missoesSessoesRoutes.js';

export interface BuildAppOptions {
  db: DbPool;
  content: LoadedContent;
  sessionTtlMinutes?: number;
  cookieSecure?: boolean;
  corsOrigin?: string | string[] | boolean;
  nowProvider?: () => Date;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
  });

  await app.register(cookie);
  await app.register(cors, {
    origin: options.corsOrigin ?? 'https://localhost',
    credentials: true,
  });

  const authCtx: AuthContext = {
    db: options.db,
    sessionTtlMinutes: options.sessionTtlMinutes ?? 30,
    cookieSecure: options.cookieSecure ?? process.env.NODE_ENV === 'production',
    nowProvider: options.nowProvider,
  };

  app.get('/api/health', async (_request, reply) => {
    try {
      await options.db.query('SELECT 1 AS ok');
      return reply.send({
        status: 'ok',
        service: 'virtuhar3d-api',
        version: '0.1.0',
        db: 'up',
      });
    } catch {
      return reply.status(503).send({
        status: 'error',
        service: 'virtuhar3d-api',
        version: '0.1.0',
        db: 'down',
      });
    }
  });

  registerAuthRoutes(app, authCtx);
  registerAdminProfessorRoutes(app, authCtx);
  registerMissoesSessoesRoutes(app, authCtx, options.content);

  return app;
}
