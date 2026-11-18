import crypto from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  generateTemporaryPassword,
  hashPassword,
  recordAuditLog,
  resolveAuthenticatedUser,
  type AuthContext,
  type UsuarioAutenticado,
} from '../auth.js';

const CriarProfessorSchema = z.object({
  nome: z.string().trim().min(3),
  usuario: z
    .string()
    .trim()
    .min(3)
    .regex(/^[a-zA-Z0-9._-]+$/),
});

const CriarTurmaSchema = z.object({
  nome: z.string().trim().min(2),
  anoLetivo: z.number().int().min(2024).max(2100),
  professorId: z.string().optional(),
});

const AlunoLoteItemSchema = z.object({
  nome: z.string().trim().min(2),
  usuario: z
    .string()
    .trim()
    .min(3)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional(),
});

const CriarAlunosLoteSchema = z.object({
  turmaId: z.string().min(1),
  alunos: z.array(AlunoLoteItemSchema).min(1).max(100).optional(),
  textoLista: z.string().min(2).optional(),
});

const AtualizarLiberacaoSchema = z.object({
  liberada: z.boolean(),
});

function slugifyUsername(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 28);
}

function parseTextoLista(textoLista: string): Array<{ nome: string; usuario?: string }> {
  const linhas = textoLista
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return linhas.map((linha) => {
    const partes = linha.split(/[;,]/).map((p) => p.trim());
    const nome = partes[0] ?? linha;
    const usuario = partes[1] && partes[1].length >= 3 ? partes[1] : undefined;
    return usuario ? { nome, usuario } : { nome };
  });
}

async function requireProfessorOrAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
  authCtx: AuthContext,
  allowedRoles: Array<'professor' | 'admin'> = ['professor', 'admin'],
): Promise<UsuarioAutenticado | null> {
  const user = await resolveAuthenticatedUser(request, reply, authCtx);
  if (!user) {
    reply.status(401).send({ erro: 'Sessão ausente ou expirada.' });
    return null;
  }
  if (user.senhaProvisoria) {
    reply.status(403).send({
      erro: 'Troca obrigatória da senha provisória antes de acessar o sistema.',
      codigo: 'TROCA_SENHA_OBRIGATORIA',
    });
    return null;
  }
  if (!allowedRoles.includes(user.perfil as 'professor' | 'admin')) {
    reply.status(403).send({ erro: 'Acesso restrito ao perfil autorizado.' });
    return null;
  }
  return user;
}

async function verifyTurmaOwnership(
  authCtx: AuthContext,
  turmaId: string,
  user: UsuarioAutenticado,
): Promise<boolean> {
  if (user.perfil === 'admin') {
    const res = await authCtx.db.query<{ id: string }>('SELECT id FROM turmas WHERE id = $1', [
      turmaId,
    ]);
    return res.rows.length > 0;
  }
  const res = await authCtx.db.query<{ id: string }>(
    'SELECT id FROM turmas WHERE id = $1 AND professor_id = $2',
    [turmaId, user.id],
  );
  return res.rows.length > 0;
}

export function registerAdminProfessorRoutes(app: FastifyInstance, authCtx: AuthContext): void {
  app.post('/api/admin/professores', async (request, reply) => {
    const user = await requireProfessorOrAdmin(request, reply, authCtx, ['admin']);
    if (!user) {
      return;
    }

    const parsed = CriarProfessorSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ erro: 'Dados inválidos para criar professor.' });
    }

    const username = parsed.data.usuario.toLowerCase();
    const existente = await authCtx.db.query<{ id: string }>(
      'SELECT id FROM usuarios WHERE usuario = $1',
      [username],
    );
    if (existente.rows.length > 0) {
      return reply.status(409).send({ erro: 'Nome de usuário já cadastrado.' });
    }

    const id = crypto.randomUUID();
    const senhaProvisoriaTexto = generateTemporaryPassword(10);
    const hash = await hashPassword(senhaProvisoriaTexto);

    await authCtx.db.query(
      `INSERT INTO usuarios (id, nome, usuario, hash_senha, perfil, senha_provisoria, ativo)
       VALUES ($1, $2, $3, $4, 'professor', TRUE, TRUE)`,
      [id, parsed.data.nome, username, hash],
    );

    await recordAuditLog(authCtx.db, user.id, 'criar_professor', {
      professorId: id,
      usuario: username,
    });

    return reply.status(201).send({
      professor: {
        id,
        nome: parsed.data.nome,
        usuario: username,
        perfil: 'professor',
        senhaProvisoriaTexto,
      },
    });
  });

  app.post('/api/professor/turmas', async (request, reply) => {
    const user = await requireProfessorOrAdmin(request, reply, authCtx, ['professor', 'admin']);
    if (!user) {
      return;
    }

    const parsed = CriarTurmaSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ erro: 'Dados inválidos para criação de turma.' });
    }

    const professorId =
      user.perfil === 'admin' && parsed.data.professorId ? parsed.data.professorId : user.id;

    const turmaId = crypto.randomUUID();
    await authCtx.db.query(
      `INSERT INTO turmas (id, nome, ano_letivo, professor_id) VALUES ($1, $2, $3, $4)`,
      [turmaId, parsed.data.nome, parsed.data.anoLetivo, professorId],
    );

    // Liberação padrão de MVP para M00 e M01 (Documento 9)
    for (const missaoId of ['M00', 'M01']) {
      await authCtx.db.query(
        `INSERT INTO liberacoes (turma_id, missao_id, liberada) VALUES ($1, $2, TRUE)`,
        [turmaId, missaoId],
      );
    }

    await recordAuditLog(authCtx.db, user.id, 'criar_turma', {
      turmaId,
      nome: parsed.data.nome,
    });

    return reply.status(201).send({
      turma: {
        id: turmaId,
        nome: parsed.data.nome,
        anoLetivo: parsed.data.anoLetivo,
        professorId,
      },
    });
  });

  app.get('/api/professor/turmas', async (request, reply) => {
    const user = await requireProfessorOrAdmin(request, reply, authCtx, ['professor', 'admin']);
    if (!user) {
      return;
    }

    const rows =
      user.perfil === 'admin'
        ? (
            await authCtx.db.query<{
              id: string;
              nome: string;
              ano_letivo: number;
              professor_id: string;
            }>(
              'SELECT id, nome, ano_letivo, professor_id FROM turmas ORDER BY ano_letivo DESC, nome ASC',
            )
          ).rows
        : (
            await authCtx.db.query<{
              id: string;
              nome: string;
              ano_letivo: number;
              professor_id: string;
            }>(
              'SELECT id, nome, ano_letivo, professor_id FROM turmas WHERE professor_id = $1 ORDER BY ano_letivo DESC, nome ASC',
              [user.id],
            )
          ).rows;

    return reply.send({
      turmas: rows.map((t) => ({
        id: t.id,
        nome: t.nome,
        anoLetivo: t.ano_letivo,
        professorId: t.professor_id,
      })),
    });
  });

  app.post('/api/professor/alunos/lote', async (request, reply) => {
    const user = await requireProfessorOrAdmin(request, reply, authCtx, ['professor', 'admin']);
    if (!user) {
      return;
    }

    const parsed = CriarAlunosLoteSchema.safeParse(request.body);
    if (!parsed.success || (!parsed.data.alunos && !parsed.data.textoLista)) {
      return reply.status(400).send({ erro: 'Informe a turma e a lista de alunos.' });
    }

    const { turmaId } = parsed.data;
    const temAcesso = await verifyTurmaOwnership(authCtx, turmaId, user);
    if (!temAcesso) {
      return reply.status(403).send({ erro: 'Turma não encontrada ou sem permissão.' });
    }

    const entradaAlunos = parsed.data.alunos ?? parseTextoLista(parsed.data.textoLista ?? '');
    if (entradaAlunos.length === 0) {
      return reply.status(400).send({ erro: 'Lista de alunos vazia.' });
    }

    const criados: Array<{
      id: string;
      nome: string;
      usuario: string;
      senhaProvisoriaTexto: string;
    }> = [];

    for (const item of entradaAlunos) {
      let baseUsername = (item.usuario ?? slugifyUsername(item.nome)).toLowerCase();
      if (baseUsername.length < 3) {
        baseUsername = `aluno.${crypto.randomBytes(2).toString('hex')}`;
      }

      let candidato = baseUsername;
      let sufixo = 1;
      while (true) {
        const existe = await authCtx.db.query<{ id: string }>(
          'SELECT id FROM usuarios WHERE usuario = $1',
          [candidato],
        );
        if (existe.rows.length === 0) {
          break;
        }
        sufixo += 1;
        candidato = `${baseUsername}${sufixo}`;
      }

      const alunoId = crypto.randomUUID();
      const senhaProvisoriaTexto = generateTemporaryPassword(10);
      const hash = await hashPassword(senhaProvisoriaTexto);

      await authCtx.db.query(
        `INSERT INTO usuarios (id, nome, usuario, hash_senha, perfil, senha_provisoria, ativo)
         VALUES ($1, $2, $3, $4, 'aluno', TRUE, TRUE)`,
        [alunoId, item.nome, candidato, hash],
      );

      await authCtx.db.query(`INSERT INTO matriculas (turma_id, aluno_id) VALUES ($1, $2)`, [
        turmaId,
        alunoId,
      ]);

      await authCtx.db.query(
        `INSERT INTO pontuacao_aluno (aluno_id, pontos_total, nivel) VALUES ($1, 0, 'Aprendiz')`,
        [alunoId],
      );

      criados.push({
        id: alunoId,
        nome: item.nome,
        usuario: candidato,
        senhaProvisoriaTexto,
      });
    }

    await recordAuditLog(authCtx.db, user.id, 'criacao_alunos_lote', {
      turmaId,
      quantidade: criados.length,
    });

    return reply.status(201).send({
      turmaId,
      quantidade: criados.length,
      criados,
    });
  });

  app.patch('/api/professor/turmas/:turmaId/missoes/:missaoId', async (request, reply) => {
    const user = await requireProfessorOrAdmin(request, reply, authCtx, ['professor', 'admin']);
    if (!user) {
      return;
    }

    const params = request.params as { turmaId: string; missaoId: string };
    const temAcesso = await verifyTurmaOwnership(authCtx, params.turmaId, user);
    if (!temAcesso) {
      return reply.status(403).send({ erro: 'Turma não encontrada ou sem permissão.' });
    }

    const parsed = AtualizarLiberacaoSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ erro: 'Informe liberada: true ou false.' });
    }

    await authCtx.db.query(
      `INSERT INTO liberacoes (turma_id, missao_id, liberada, atualizada_em)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (turma_id, missao_id)
       DO UPDATE SET liberada = EXCLUDED.liberada, atualizada_em = NOW()`,
      [params.turmaId, params.missaoId, parsed.data.liberada],
    );

    await recordAuditLog(authCtx.db, user.id, 'atualizar_liberacao_missao', {
      turmaId: params.turmaId,
      missaoId: params.missaoId,
      liberada: parsed.data.liberada,
    });

    return reply.send({
      turmaId: params.turmaId,
      missaoId: params.missaoId,
      liberada: parsed.data.liberada,
    });
  });

  app.get('/api/professor/turmas/:turmaId/painel', async (request, reply) => {
    const user = await requireProfessorOrAdmin(request, reply, authCtx, ['professor', 'admin']);
    if (!user) {
      return;
    }

    const params = request.params as { turmaId: string };
    const temAcesso = await verifyTurmaOwnership(authCtx, params.turmaId, user);
    if (!temAcesso) {
      return reply.status(403).send({ erro: 'Turma não encontrada ou sem permissão.' });
    }

    const alunosRes = await authCtx.db.query<{
      id: string;
      nome: string;
      usuario: string;
      pontos_total: number | null;
      nivel: string | null;
    }>(
      `SELECT u.id, u.nome, u.usuario, p.pontos_total, p.nivel
       FROM matriculas m
       JOIN usuarios u ON u.id = m.aluno_id
       LEFT JOIN pontuacao_aluno p ON p.aluno_id = u.id
       WHERE m.turma_id = $1
       ORDER BY u.nome ASC`,
      [params.turmaId],
    );

    const sessoesRes = await authCtx.db.query<{
      id: string;
      aluno_id: string;
      missao_id: string;
      estado: string;
      nota_total: number | null;
      tempo_seg: number;
    }>(
      `SELECT sm.id, sm.aluno_id, sm.missao_id, sm.estado, sm.nota_total, sm.tempo_seg
       FROM sessoes_missao sm
       JOIN matriculas m ON m.aluno_id = sm.aluno_id
       WHERE m.turma_id = $1`,
      [params.turmaId],
    );

    const errosRes = await authCtx.db.query<{
      tipo: string;
      regra: string;
      total: number | string;
    }>(
      `SELECT es.tipo, es.regra, SUM(es.quantidade) AS total
       FROM erros_sessao es
       JOIN sessoes_missao sm ON sm.id = es.sessao_id
       JOIN matriculas m ON m.aluno_id = sm.aluno_id
       WHERE m.turma_id = $1
       GROUP BY es.tipo, es.regra
       ORDER BY total DESC`,
      [params.turmaId],
    );

    return reply.send({
      turmaId: params.turmaId,
      alunos: alunosRes.rows.map((a) => ({
        id: a.id,
        nome: a.nome,
        usuario: a.usuario,
        pontosTotal: a.pontos_total ?? 0,
        nivel: a.nivel ?? 'Aprendiz',
        sessoes: sessoesRes.rows
          .filter((s) => s.aluno_id === a.id)
          .map((s) => ({
            sessaoId: s.id,
            missaoId: s.missao_id,
            estado: s.estado,
            notaTotal: s.nota_total,
            tempoSeg: s.tempo_seg,
          })),
      })),
      errosFrequentes: errosRes.rows.map((e) => ({
        tipo: e.tipo,
        regra: e.regra,
        quantidade: Number(e.total),
      })),
    });
  });
}
