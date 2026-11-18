import crypto from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  calcularNivel,
  calcularPontuacao,
  type EstadoBancada,
  type ModoMissao,
  type RegrasParametros,
} from '../../../rules/src/index.js';
import { resolveAuthenticatedUser, type AuthContext, type UsuarioAutenticado } from '../auth.js';
import type { LoadedContent } from '../contentLoader.js';

const IniciarSessaoSchema = z.object({
  missaoId: z.string().regex(/^M\d{2}$/),
  modo: z.enum(['guiado', 'livre', 'avaliacao']).default('guiado'),
});

const EventoItemSchema = z.object({
  instanteMs: z.number().int().nonnegative(),
  tipo: z.string().min(1).max(64),
  regra: z.string().max(64).optional(),
  detalhe: z.record(z.string(), z.unknown()).optional(),
});

const EventosLoteSchema = z.object({
  eventos: z.array(EventoItemSchema).min(1).max(200),
});

const ConcluirSessaoSchema = z.object({
  tempoSeg: z.number().int().nonnegative(),
  dicasUsadas: z.number().int().nonnegative().default(0),
  violacoesEsd: z.number().int().nonnegative().default(0),
  errosOrdem: z.number().int().nonnegative().default(0),
  pecasRecusadasCompatibilidade: z.array(z.string()).default([]),
  postExibido: z.boolean().default(true),
  autoavaliacao: z
    .object({
      explica: z.string().max(1000),
      executa: z.string().max(1000),
      revisar: z.string().max(1000),
    })
    .optional(),
});

async function requireAuthenticatedActiveUser(
  request: FastifyRequest,
  reply: FastifyReply,
  authCtx: AuthContext,
): Promise<UsuarioAutenticado | null> {
  const user = await resolveAuthenticatedUser(request, reply, authCtx);
  if (!user) {
    reply.status(401).send({ erro: 'Sessão ausente ou expirada.' });
    return null;
  }
  if (user.senhaProvisoria) {
    reply.status(403).send({
      erro: 'Troca obrigatória da senha provisória antes de acessar as missões.',
      codigo: 'TROCA_SENHA_OBRIGATORIA',
    });
    return null;
  }
  return user;
}

async function getMissaoLiberadaParaAluno(
  authCtx: AuthContext,
  alunoId: string,
  missaoId: string,
): Promise<boolean> {
  const libRes = await authCtx.db.query<{ liberada: boolean }>(
    `SELECT l.liberada
     FROM matriculas m
     JOIN liberacoes l ON l.turma_id = m.turma_id
     WHERE m.aluno_id = $1 AND l.missao_id = $2`,
    [alunoId, missaoId],
  );

  if (libRes.rows.length > 0) {
    return libRes.rows.some((r) => r.liberada);
  }
  // No MVP, M00 e M01 vêm liberadas por padrão se não houver bloqueio explícito (Doc 9)
  return missaoId === 'M00' || missaoId === 'M01';
}

export function registerMissoesSessoesRoutes(
  app: FastifyInstance,
  authCtx: AuthContext,
  content: LoadedContent,
): void {
  app.get('/api/missoes', async (request, reply) => {
    const user = await requireAuthenticatedActiveUser(request, reply, authCtx);
    if (!user) {
      return;
    }

    const historicoRes = await authCtx.db.query<{
      missao_id: string;
      estado: string;
      nota_total: number | null;
    }>(`SELECT missao_id, estado, nota_total FROM sessoes_missao WHERE aluno_id = $1`, [user.id]);

    const lista = await Promise.all(
      content.missoes.map(async (m) => {
        const liberada =
          user.perfil === 'aluno' ? await getMissaoLiberadaParaAluno(authCtx, user.id, m.id) : true;

        const tentativas = historicoRes.rows.filter((h) => h.missao_id === m.id);
        const concluidas = tentativas.filter((t) => t.estado === 'concluida');
        const melhorNota =
          concluidas.length > 0 ? Math.max(...concluidas.map((c) => c.nota_total ?? 0)) : null;

        return {
          id: m.id,
          titulo: m.titulo,
          trilha: m.trilha,
          versao: m.versao,
          etiqueta: m.etiqueta,
          tempoReferenciaSeg: m.tempoReferenciaSeg,
          liberada,
          concluida: concluidas.length > 0,
          melhorNota,
        };
      }),
    );

    const pontuacaoRes = await authCtx.db.query<{ pontos_total: number; nivel: string }>(
      'SELECT pontos_total, nivel FROM pontuacao_aluno WHERE aluno_id = $1',
      [user.id],
    );
    const insigniasRes = await authCtx.db.query<{ insignia_id: string }>(
      'SELECT insignia_id FROM insignias_aluno WHERE aluno_id = $1',
      [user.id],
    );

    return reply.send({
      missoes: lista,
      resumoAluno: {
        pontosTotal: pontuacaoRes.rows[0]?.pontos_total ?? 0,
        nivel: pontuacaoRes.rows[0]?.nivel ?? 'Aprendiz',
        insignias: insigniasRes.rows.map((r) => r.insignia_id),
      },
    });
  });

  app.get('/api/missoes/:id', async (request, reply) => {
    const user = await requireAuthenticatedActiveUser(request, reply, authCtx);
    if (!user) {
      return;
    }

    const params = request.params as { id: string };
    const missao = content.missoesById[params.id];
    if (!missao) {
      return reply.status(404).send({ erro: 'Missão não encontrada.' });
    }

    if (user.perfil === 'aluno') {
      const liberada = await getMissaoLiberadaParaAluno(authCtx, user.id, missao.id);
      if (!liberada) {
        return reply.status(403).send({ erro: 'Missão ainda não liberada pelo professor.' });
      }
    }

    const pecasNecessariasIds = new Set<string>([
      ...missao.pecasDisponiveis,
      ...missao.estadoInicial.pecasInstaladas.map((p) => p.pecaId),
    ]);
    const pecas = Array.from(pecasNecessariasIds)
      .map((id) => content.pecasById[id])
      .filter(Boolean);

    return reply.send({
      missao,
      pecas,
      regras: content.regras,
    });
  });

  app.post('/api/sessoes', async (request, reply) => {
    const user = await requireAuthenticatedActiveUser(request, reply, authCtx);
    if (!user) {
      return;
    }

    const parsed = IniciarSessaoSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ erro: 'Parâmetros inválidos para iniciar sessão.' });
    }

    const { missaoId, modo } = parsed.data;
    const missao = content.missoesById[missaoId];
    if (!missao) {
      return reply.status(404).send({ erro: 'Missão não encontrada.' });
    }

    if (user.perfil === 'aluno') {
      const liberada = await getMissaoLiberadaParaAluno(authCtx, user.id, missaoId);
      if (!liberada) {
        return reply.status(403).send({ erro: 'Missão não liberada para esta turma.' });
      }
    }

    const sessaoId = crypto.randomUUID();
    await authCtx.db.query(
      `INSERT INTO sessoes_missao (id, aluno_id, missao_id, modo, estado)
       VALUES ($1, $2, $3, $4, 'em_andamento')`,
      [sessaoId, user.id, missaoId, modo],
    );

    return reply.status(201).send({
      sessao: {
        id: sessaoId,
        missaoId,
        modo,
        estado: 'em_andamento',
      },
    });
  });

  app.post('/api/sessoes/:id/eventos', async (request, reply) => {
    const user = await requireAuthenticatedActiveUser(request, reply, authCtx);
    if (!user) {
      return;
    }

    const params = request.params as { id: string };
    const parsed = EventosLoteSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ erro: 'Lote de eventos inválido.' });
    }

    const sessaoRes = await authCtx.db.query<{ aluno_id: string; estado: string }>(
      'SELECT aluno_id, estado FROM sessoes_missao WHERE id = $1',
      [params.id],
    );
    const sessao = sessaoRes.rows[0];
    if (!sessao) {
      return reply.status(404).send({ erro: 'Sessão não encontrada.' });
    }
    if (sessao.aluno_id !== user.id) {
      return reply.status(403).send({ erro: 'Sem permissão para gravar eventos nesta sessão.' });
    }
    if (sessao.estado !== 'em_andamento') {
      return reply.status(409).send({ erro: 'A sessão já foi encerrada.' });
    }

    for (const ev of parsed.data.eventos) {
      await authCtx.db.query(
        `INSERT INTO eventos_sessao (id, sessao_id, instante_ms, tipo, regra, detalhe)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          params.id,
          ev.instanteMs,
          ev.tipo,
          ev.regra ?? null,
          JSON.stringify(ev.detalhe ?? {}),
        ],
      );
    }

    return reply.status(202).send({
      recebidos: parsed.data.eventos.length,
    });
  });

  app.post('/api/sessoes/:id/concluir', async (request, reply) => {
    const user = await requireAuthenticatedActiveUser(request, reply, authCtx);
    if (!user) {
      return;
    }

    const params = request.params as { id: string };
    const parsed = ConcluirSessaoSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ erro: 'Dados inválidos ao concluir sessão.' });
    }

    const sessaoRes = await authCtx.db.query<{
      id: string;
      aluno_id: string;
      missao_id: string;
      modo: ModoMissao;
      estado: string;
    }>('SELECT id, aluno_id, missao_id, modo, estado FROM sessoes_missao WHERE id = $1', [
      params.id,
    ]);
    const sessao = sessaoRes.rows[0];
    if (!sessao) {
      return reply.status(404).send({ erro: 'Sessão não encontrada.' });
    }
    if (sessao.aluno_id !== user.id) {
      return reply.status(403).send({ erro: 'Sem permissão para concluir esta sessão.' });
    }
    if (sessao.estado === 'concluida') {
      return reply.status(409).send({ erro: 'Sessão já concluída anteriormente.' });
    }

    const missao = content.missoesById[sessao.missao_id];
    if (!missao) {
      return reply.status(404).send({ erro: 'Missão associada não encontrada.' });
    }

    const payload = parsed.data;
    const estadoSimulado: EstadoBancada = {
      esdColocada: true,
      fonteLigada: true,
      pastaTermicaAplicada: true,
      espacadoresInstalados: true,
      instaladas: {},
      passosConcluidos: missao.passos.map((p) => p.id),
      violacoesEsd: payload.violacoesEsd,
      errosOrdem: payload.errosOrdem,
      pecasRecusadasCompatibilidade: Array.from(new Set(payload.pecasRecusadasCompatibilidade)),
      dicasUsadas: payload.dicasUsadas,
      modo: sessao.modo,
      postExibido: payload.postExibido,
    };

    const pontuacao = calcularPontuacao(
      estadoSimulado,
      payload.tempoSeg,
      missao.tempoReferenciaSeg,
      content.regras as RegrasParametros,
    );

    await authCtx.db.query(
      `UPDATE sessoes_missao
       SET estado = 'concluida',
           concluida_em = NOW(),
           tempo_seg = $1,
           dicas_usadas = $2,
           nota_total = $3,
           nota_esd = $4,
           nota_ordem = $5,
           nota_compat = $6,
           nota_tempo = $7
       WHERE id = $8`,
      [
        payload.tempoSeg,
        payload.dicasUsadas,
        pontuacao.notaTotal,
        pontuacao.notaEsd,
        pontuacao.notaOrdem,
        pontuacao.notaCompatibilidade,
        pontuacao.notaTempo,
        sessao.id,
      ],
    );

    // Resumo de erros da sessão a partir dos eventos persistidos (para consulta rápida do painel)
    const eventosErroRes = await authCtx.db.query<{
      tipo: string;
      regra: string | null;
      qtd: number | string;
    }>(
      `SELECT tipo, COALESCE(regra, 'GERAL') AS regra, COUNT(*) AS qtd
       FROM eventos_sessao
       WHERE sessao_id = $1 AND tipo LIKE 'erro_%'
       GROUP BY tipo, COALESCE(regra, 'GERAL')`,
      [sessao.id],
    );

    for (const errRow of eventosErroRes.rows) {
      await authCtx.db.query(
        `INSERT INTO erros_sessao (sessao_id, tipo, regra, quantidade)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (sessao_id, tipo, regra)
         DO UPDATE SET quantidade = EXCLUDED.quantidade`,
        [sessao.id, errRow.tipo, errRow.regra ?? 'GERAL', Number(errRow.qtd)],
      );
    }

    if (payload.autoavaliacao) {
      await authCtx.db.query(
        `INSERT INTO autoavaliacoes (sessao_id, explica, executa, revisar)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (sessao_id)
         DO UPDATE SET explica = EXCLUDED.explica, executa = EXCLUDED.executa, revisar = EXCLUDED.revisar`,
        [
          sessao.id,
          payload.autoavaliacao.explica,
          payload.autoavaliacao.executa,
          payload.autoavaliacao.revisar,
        ],
      );
    }

    // Recalcular pontuação total (melhor nota por missão) e nível do aluno
    const melhoresRes = await authCtx.db.query<{
      missao_id: string;
      melhor: number | null;
    }>(
      `SELECT missao_id, MAX(nota_total) AS melhor
       FROM sessoes_missao
       WHERE aluno_id = $1 AND estado = 'concluida'
       GROUP BY missao_id`,
      [user.id],
    );

    const pontosTotal = melhoresRes.rows.reduce((acc, r) => acc + Number(r.melhor ?? 0), 0);
    const nivel = calcularNivel(pontosTotal, content.regras as RegrasParametros);

    await authCtx.db.query(
      `INSERT INTO pontuacao_aluno (aluno_id, pontos_total, nivel)
       VALUES ($1, $2, $3)
       ON CONFLICT (aluno_id)
       DO UPDATE SET pontos_total = EXCLUDED.pontos_total, nivel = EXCLUDED.nivel`,
      [user.id, pontosTotal, nivel],
    );

    // Concessão automática de insígnias elegíveis
    const insigniasConcedidas: string[] = [];
    const candidatas: string[] = ['primeira-missao'];
    if (payload.errosOrdem === 0 && payload.pecasRecusadasCompatibilidade.length === 0) {
      candidatas.push('montador-preciso');
    }
    if (payload.tempoSeg <= missao.tempoReferenciaSeg && pontuacao.aprovado) {
      candidatas.push('agil');
    }

    for (const insigniaId of candidatas) {
      const existe = await authCtx.db.query<{ insignia_id: string }>(
        'SELECT insignia_id FROM insignias_aluno WHERE aluno_id = $1 AND insignia_id = $2',
        [user.id, insigniaId],
      );
      if (existe.rows.length === 0) {
        await authCtx.db.query(
          `INSERT INTO insignias_aluno (aluno_id, insignia_id, sessao_id) VALUES ($1, $2, $3)`,
          [user.id, insigniaId, sessao.id],
        );
        insigniasConcedidas.push(insigniaId);
      }
    }

    return reply.send({
      relatorio: {
        sessaoId: sessao.id,
        missaoId: sessao.missao_id,
        modo: sessao.modo,
        tempoSeg: payload.tempoSeg,
        dicasUsadas: payload.dicasUsadas,
        violacoesEsd: payload.violacoesEsd,
        errosOrdem: payload.errosOrdem,
        errosCompatibilidade: estadoSimulado.pecasRecusadasCompatibilidade.length,
        pontuacao,
        pontosTotalAluno: pontosTotal,
        nivelAluno: nivel,
        insigniasConcedidas,
      },
    });
  });

  app.get('/api/relatorios', async (request, reply) => {
    const user = await requireAuthenticatedActiveUser(request, reply, authCtx);
    if (!user) {
      return;
    }

    let rows: Array<{
      id: string;
      aluno_id: string;
      aluno_nome: string;
      missao_id: string;
      modo: string;
      estado: string;
      iniciada_em: Date | string;
      concluida_em: Date | string | null;
      tempo_seg: number;
      dicas_usadas: number;
      nota_total: number | null;
      nota_esd: number | null;
      nota_ordem: number | null;
      nota_compat: number | null;
      nota_tempo: number | null;
    }>;

    if (user.perfil === 'aluno') {
      rows = (
        await authCtx.db.query<(typeof rows)[number]>(
          `SELECT sm.id, sm.aluno_id, u.nome AS aluno_nome, sm.missao_id, sm.modo, sm.estado,
                  sm.iniciada_em, sm.concluida_em, sm.tempo_seg, sm.dicas_usadas,
                  sm.nota_total, sm.nota_esd, sm.nota_ordem, sm.nota_compat, sm.nota_tempo
           FROM sessoes_missao sm
           JOIN usuarios u ON u.id = sm.aluno_id
           WHERE sm.aluno_id = $1
           ORDER BY sm.iniciada_em DESC`,
          [user.id],
        )
      ).rows;
    } else if (user.perfil === 'professor') {
      rows = (
        await authCtx.db.query<(typeof rows)[number]>(
          `SELECT DISTINCT sm.id, sm.aluno_id, u.nome AS aluno_nome, sm.missao_id, sm.modo, sm.estado,
                  sm.iniciada_em, sm.concluida_em, sm.tempo_seg, sm.dicas_usadas,
                  sm.nota_total, sm.nota_esd, sm.nota_ordem, sm.nota_compat, sm.nota_tempo
           FROM sessoes_missao sm
           JOIN usuarios u ON u.id = sm.aluno_id
           JOIN matriculas m ON m.aluno_id = sm.aluno_id
           JOIN turmas t ON t.id = m.turma_id
           WHERE t.professor_id = $1
           ORDER BY sm.iniciada_em DESC`,
          [user.id],
        )
      ).rows;
    } else {
      rows = (
        await authCtx.db.query<(typeof rows)[number]>(
          `SELECT sm.id, sm.aluno_id, u.nome AS aluno_nome, sm.missao_id, sm.modo, sm.estado,
                  sm.iniciada_em, sm.concluida_em, sm.tempo_seg, sm.dicas_usadas,
                  sm.nota_total, sm.nota_esd, sm.nota_ordem, sm.nota_compat, sm.nota_tempo
           FROM sessoes_missao sm
           JOIN usuarios u ON u.id = sm.aluno_id
           ORDER BY sm.iniciada_em DESC`,
        )
      ).rows;
    }

    return reply.send({
      relatorios: rows.map((r) => ({
        sessaoId: r.id,
        alunoId: r.aluno_id,
        alunoNome: r.aluno_nome,
        missaoId: r.missao_id,
        modo: r.modo,
        estado: r.estado,
        iniciadaEm: r.iniciada_em,
        concluidaEm: r.concluida_em,
        tempoSeg: r.tempo_seg,
        dicasUsadas: r.dicas_usadas,
        notaTotal: r.nota_total,
        notaEsd: r.nota_esd,
        notaOrdem: r.nota_ordem,
        notaCompatibilidade: r.nota_compat,
        notaTempo: r.nota_tempo,
      })),
    });
  });

  app.get('/api/relatorios/:sessaoId', async (request, reply) => {
    const user = await requireAuthenticatedActiveUser(request, reply, authCtx);
    if (!user) {
      return;
    }

    const params = request.params as { sessaoId: string };
    const sessaoRes = await authCtx.db.query<{
      id: string;
      aluno_id: string;
      aluno_nome: string;
      missao_id: string;
      modo: string;
      estado: string;
      iniciada_em: Date | string;
      concluida_em: Date | string | null;
      tempo_seg: number;
      dicas_usadas: number;
      nota_total: number | null;
      nota_esd: number | null;
      nota_ordem: number | null;
      nota_compat: number | null;
      nota_tempo: number | null;
    }>(
      `SELECT sm.id, sm.aluno_id, u.nome AS aluno_nome, sm.missao_id, sm.modo, sm.estado,
              sm.iniciada_em, sm.concluida_em, sm.tempo_seg, sm.dicas_usadas,
              sm.nota_total, sm.nota_esd, sm.nota_ordem, sm.nota_compat, sm.nota_tempo
       FROM sessoes_missao sm
       JOIN usuarios u ON u.id = sm.aluno_id
       WHERE sm.id = $1`,
      [params.sessaoId],
    );

    const sessao = sessaoRes.rows[0];
    if (!sessao) {
      return reply.status(404).send({ erro: 'Relatório não encontrado.' });
    }

    if (user.perfil === 'aluno' && sessao.aluno_id !== user.id) {
      return reply.status(403).send({ erro: 'Acesso negado a relatório de outro aluno.' });
    }
    if (user.perfil === 'professor') {
      const checkTurma = await authCtx.db.query<{ turma_id: string }>(
        `SELECT m.turma_id
         FROM matriculas m
         JOIN turmas t ON t.id = m.turma_id
         WHERE m.aluno_id = $1 AND t.professor_id = $2`,
        [sessao.aluno_id, user.id],
      );
      if (checkTurma.rows.length === 0) {
        return reply.status(403).send({ erro: 'Aluno não pertence às suas turmas.' });
      }
    }

    const errosRes = await authCtx.db.query<{ tipo: string; regra: string; quantidade: number }>(
      'SELECT tipo, regra, quantidade FROM erros_sessao WHERE sessao_id = $1',
      [sessao.id],
    );
    const eventosRes = await authCtx.db.query<{
      id: string;
      instante_ms: number;
      tipo: string;
      regra: string | null;
      detalhe: unknown;
    }>(
      'SELECT id, instante_ms, tipo, regra, detalhe FROM eventos_sessao WHERE sessao_id = $1 ORDER BY instante_ms ASC',
      [sessao.id],
    );

    const autoRes = await authCtx.db.query<{
      explica: string;
      executa: string;
      revisar: string;
    }>('SELECT explica, executa, revisar FROM autoavaliacoes WHERE sessao_id = $1', [sessao.id]);

    return reply.send({
      relatorio: {
        sessaoId: sessao.id,
        alunoId: sessao.aluno_id,
        alunoNome: sessao.aluno_nome,
        missaoId: sessao.missao_id,
        modo: sessao.modo,
        estado: sessao.estado,
        iniciadaEm: sessao.iniciada_em,
        concluidaEm: sessao.concluida_em,
        tempoSeg: sessao.tempo_seg,
        dicasUsadas: sessao.dicas_usadas,
        notaTotal: sessao.nota_total,
        notaEsd: sessao.nota_esd,
        notaOrdem: sessao.nota_ordem,
        notaCompatibilidade: sessao.nota_compat,
        notaTempo: sessao.nota_tempo,
        erros: errosRes.rows,
        eventos: eventosRes.rows,
        autoavaliacao: autoRes.rows[0] ?? null,
      },
    });
  });
}
