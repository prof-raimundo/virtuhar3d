import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  LOCKOUT_MINUTES,
  MAX_FAILED_ATTEMPTS,
  PASSWORD_MIN_LENGTH,
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  recordAuditLog,
  resolveAuthenticatedUser,
  setSessionCookie,
  verifyPassword,
  type AuthContext,
  type PerfilUsuario,
} from '../auth.js';

const LoginBodySchema = z.object({
  usuario: z.string().trim().min(1),
  senha: z.string().min(1),
});

const TrocarSenhaBodySchema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(PASSWORD_MIN_LENGTH, 'A nova senha deve ter no mínimo 8 caracteres.'),
});

export function registerAuthRoutes(app: FastifyInstance, authCtx: AuthContext): void {
  const getNow = () => (authCtx.nowProvider ? authCtx.nowProvider() : new Date());

  app.post('/api/auth/login', async (request, reply) => {
    const parsed = LoginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ erro: 'Informe usuário e senha.' });
    }

    const { usuario, senha } = parsed.data;
    const now = getNow();

    const userRes = await authCtx.db.query<{
      id: string;
      nome: string;
      usuario: string;
      hash_senha: string;
      perfil: PerfilUsuario;
      senha_provisoria: boolean;
      ativo: boolean;
      tentativas_falhas: number;
      bloqueado_ate: Date | string | null;
    }>(
      `SELECT id, nome, usuario, hash_senha, perfil, senha_provisoria, ativo, tentativas_falhas, bloqueado_ate
       FROM usuarios
       WHERE usuario = $1`,
      [usuario.toLowerCase()],
    );

    const row = userRes.rows[0];
    if (!row || !row.ativo) {
      await recordAuditLog(authCtx.db, null, 'login_falha', { usuario: usuario.toLowerCase() });
      return reply.status(401).send({ erro: 'Usuário ou senha inválidos.' });
    }

    if (row.bloqueado_ate) {
      const bloqueadoAte =
        row.bloqueado_ate instanceof Date ? row.bloqueado_ate : new Date(row.bloqueado_ate);
      if (bloqueadoAte.getTime() > now.getTime()) {
        await recordAuditLog(authCtx.db, row.id, 'login_bloqueado', {
          bloqueadoAte: bloqueadoAte.toISOString(),
        });
        return reply.status(423).send({
          erro: 'Conta temporariamente bloqueada após múltiplas tentativas falhas. Aguarde alguns minutos.',
        });
      }
    }

    const senhaValida = await verifyPassword(row.hash_senha, senha);
    if (!senhaValida) {
      const novasTentativas = row.tentativas_falhas + 1;
      const deveBloquear = novasTentativas >= MAX_FAILED_ATTEMPTS;
      const bloqueadoAte = deveBloquear ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000) : null;

      await authCtx.db.query(
        `UPDATE usuarios SET tentativas_falhas = $1, bloqueado_ate = $2 WHERE id = $3`,
        [novasTentativas, bloqueadoAte, row.id],
      );
      await recordAuditLog(authCtx.db, row.id, 'login_falha', {
        tentativas: novasTentativas,
        bloqueada: deveBloquear,
      });

      if (deveBloquear) {
        return reply.status(423).send({
          erro: 'Conta temporariamente bloqueada após múltiplas tentativas falhas. Aguarde alguns minutos.',
        });
      }
      return reply.status(401).send({ erro: 'Usuário ou senha inválidos.' });
    }

    // Login bem-sucedido: zera tentativas e cria sessão opaca
    await authCtx.db.query(
      `UPDATE usuarios SET tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = $1`,
      [row.id],
    );

    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiraEm = new Date(now.getTime() + authCtx.sessionTtlMinutes * 60_000);

    await authCtx.db.query(
      `INSERT INTO sessoes_login (id, usuario_id, expira_em, criada_em) VALUES ($1, $2, $3, $4)`,
      [tokenHash, row.id, expiraEm, now],
    );

    setSessionCookie(reply, rawToken, authCtx.cookieSecure, authCtx.sessionTtlMinutes);
    await recordAuditLog(authCtx.db, row.id, 'login_sucesso', { perfil: row.perfil });

    return reply.send({
      usuario: {
        id: row.id,
        nome: row.nome,
        usuario: row.usuario,
        perfil: row.perfil,
        senhaProvisoria: row.senha_provisoria,
      },
    });
  });

  app.post('/api/auth/logout', async (request, reply) => {
    const rawToken = request.cookies[SESSION_COOKIE_NAME];
    if (rawToken) {
      const tokenHash = hashSessionToken(rawToken);
      await authCtx.db.query('DELETE FROM sessoes_login WHERE id = $1', [tokenHash]);
    }
    clearSessionCookie(reply, authCtx.cookieSecure);
    return reply.send({ ok: true });
  });

  app.get('/api/auth/me', async (request, reply) => {
    const user = await resolveAuthenticatedUser(request, reply, authCtx);
    if (!user) {
      return reply.status(401).send({ erro: 'Sessão ausente ou expirada.' });
    }
    return reply.send({ usuario: user });
  });

  app.post('/api/auth/trocar-senha', async (request, reply) => {
    const user = await resolveAuthenticatedUser(request, reply, authCtx);
    if (!user) {
      return reply.status(401).send({ erro: 'Sessão ausente ou expirada.' });
    }

    const parsed = TrocarSenhaBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        erro: parsed.error.issues[0]?.message ?? 'Dados inválidos para troca de senha.',
      });
    }

    const { senhaAtual, novaSenha } = parsed.data;
    if (novaSenha === senhaAtual) {
      return reply.status(400).send({ erro: 'A nova senha deve ser diferente da senha atual.' });
    }

    const dbUser = await authCtx.db.query<{ hash_senha: string }>(
      'SELECT hash_senha FROM usuarios WHERE id = $1',
      [user.id],
    );
    const hashAtual = dbUser.rows[0]?.hash_senha;
    if (!hashAtual || !(await verifyPassword(hashAtual, senhaAtual))) {
      return reply.status(401).send({ erro: 'Senha atual incorreta.' });
    }

    const novoHash = await hashPassword(novaSenha);
    await authCtx.db.query(
      `UPDATE usuarios SET hash_senha = $1, senha_provisoria = FALSE WHERE id = $2`,
      [novoHash, user.id],
    );

    await recordAuditLog(authCtx.db, user.id, 'troca_senha', {
      eraProvisoria: user.senhaProvisoria,
    });

    return reply.send({
      ok: true,
      usuario: {
        ...user,
        senhaProvisoria: false,
      },
    });
  });

  // Mantém import de crypto usado caso seja necessário estender sessões com ID auxiliar
  void crypto;
}
