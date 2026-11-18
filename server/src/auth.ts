import crypto from 'node:crypto';
import argon2 from 'argon2';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DbPool } from './db.js';

export type PerfilUsuario = 'aluno' | 'professor' | 'admin';

export interface UsuarioAutenticado {
  id: string;
  nome: string;
  usuario: string;
  perfil: PerfilUsuario;
  senhaProvisoria: boolean;
}

export const SESSION_COOKIE_NAME = 'vh3d_sessao';
export const PASSWORD_MIN_LENGTH = 8;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 5;
export const DEFAULT_SESSION_TTL_MINUTES = 30;

export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    return false;
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateTemporaryPassword(length = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    const byte = bytes[i] ?? 0;
    result += alphabet[byte % alphabet.length] ?? 'A';
  }
  return result;
}

export async function recordAuditLog(
  db: DbPool,
  usuarioId: string | null,
  acao: string,
  detalhe: Record<string, unknown> = {},
): Promise<void> {
  await db.query(`INSERT INTO auditoria (id, usuario_id, acao, detalhe) VALUES ($1, $2, $3, $4)`, [
    crypto.randomUUID(),
    usuarioId,
    acao,
    JSON.stringify(detalhe),
  ]);
}

export function setSessionCookie(
  reply: FastifyReply,
  rawToken: string,
  cookieSecure: boolean,
  ttlMinutes: number,
): void {
  reply.setCookie(SESSION_COOKIE_NAME, rawToken, {
    path: '/',
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax',
    maxAge: ttlMinutes * 60,
  });
}

export function clearSessionCookie(reply: FastifyReply, cookieSecure: boolean): void {
  reply.clearCookie(SESSION_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax',
  });
}

export interface AuthContext {
  db: DbPool;
  sessionTtlMinutes: number;
  cookieSecure: boolean;
  nowProvider?: () => Date;
}

export async function resolveAuthenticatedUser(
  request: FastifyRequest,
  reply: FastifyReply,
  ctx: AuthContext,
): Promise<UsuarioAutenticado | null> {
  const rawToken = request.cookies[SESSION_COOKIE_NAME];
  if (!rawToken) {
    return null;
  }

  const tokenHash = hashSessionToken(rawToken);
  const now = ctx.nowProvider ? ctx.nowProvider() : new Date();

  const res = await ctx.db.query<{
    sessao_id: string;
    expira_em: Date | string;
    usuario_id: string;
    nome: string;
    usuario: string;
    perfil: PerfilUsuario;
    senha_provisoria: boolean;
    ativo: boolean;
  }>(
    `SELECT s.id AS sessao_id, s.expira_em, u.id AS usuario_id, u.nome, u.usuario, u.perfil, u.senha_provisoria, u.ativo
     FROM sessoes_login s
     JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.id = $1`,
    [tokenHash],
  );

  const row = res.rows[0];
  if (!row || !row.ativo) {
    clearSessionCookie(reply, ctx.cookieSecure);
    return null;
  }

  const expiraEm = row.expira_em instanceof Date ? row.expira_em : new Date(row.expira_em);
  if (expiraEm.getTime() <= now.getTime()) {
    await ctx.db.query('DELETE FROM sessoes_login WHERE id = $1', [tokenHash]);
    clearSessionCookie(reply, ctx.cookieSecure);
    return null;
  }

  // Renovação deslizante (RN-20: 30 min de inatividade)
  const novaExpiracao = new Date(now.getTime() + ctx.sessionTtlMinutes * 60_000);
  await ctx.db.query('UPDATE sessoes_login SET expira_em = $1 WHERE id = $2', [
    novaExpiracao,
    tokenHash,
  ]);
  setSessionCookie(reply, rawToken, ctx.cookieSecure, ctx.sessionTtlMinutes);

  return {
    id: row.usuario_id,
    nome: row.nome,
    usuario: row.usuario,
    perfil: row.perfil,
    senhaProvisoria: row.senha_provisoria,
  };
}
