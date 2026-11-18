import { newDb } from 'pg-mem';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { loadValidatedContent } from './contentLoader.js';
import { createPgPool, runMigrations, type DbPool, type QueryResultRow } from './db.js';
import { seedInitialData } from './seed.js';

function extractCookieValue(setCookieHeader: string | string[] | undefined, name: string): string {
  const list = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  for (const raw of list) {
    const firstPart = raw.split(';')[0] ?? '';
    const eqIndex = firstPart.indexOf('=');
    if (eqIndex > 0) {
      const k = firstPart.slice(0, eqIndex).trim();
      const v = firstPart.slice(eqIndex + 1).trim();
      if (k === name) {
        return v;
      }
    }
  }
  return '';
}

function findSetCookieString(
  setCookieHeader: string | string[] | undefined,
  name: string,
): string | undefined {
  const list = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  return list.find((c) => c.startsWith(`${name}=`));
}

async function createTestDatabase(): Promise<DbPool> {
  const realUrl = process.env.TEST_DATABASE_URL;
  if (realUrl) {
    const pool = createPgPool(realUrl);
    await runMigrations(pool);
    return pool;
  }

  const mem = newDb({ autoCreateForeignKeyIndices: true, noAstCoverageCheck: true });
  const pgAdapter = mem.adapters.createPg();
  const pool = new pgAdapter.Pool();

  const wrappedPool: DbPool = {
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

  await runMigrations(wrappedPool);
  return wrappedPool;
}

describe('API VIRTUHAR3D — Integração, Autenticação, Persistência e RBAC', () => {
  const cleanupPools: DbPool[] = [];

  afterEach(async () => {
    while (cleanupPools.length > 0) {
      const db = cleanupPools.pop();
      if (db) {
        await db.end();
      }
    }
  });

  async function setupApp(initialNow = new Date('2026-04-10T10:00:00.000Z')) {
    let currentTime = initialNow;
    const db = await createTestDatabase();
    cleanupPools.push(db);
    await seedInitialData(db);
    const content = loadValidatedContent();
    const app = await buildApp({
      db,
      content,
      sessionTtlMinutes: 30,
      cookieSecure: true,
      nowProvider: () => currentTime,
    });
    return {
      db,
      app,
      advanceMinutes: (minutes: number) => {
        currentTime = new Date(currentTime.getTime() + minutes * 60_000);
      },
    };
  }

  it('responde /api/health e mantém migrações e seed idempotentes', async () => {
    const { db, app } = await setupApp();
    const secondMigrationRun = await runMigrations(db);
    expect(secondMigrationRun).toEqual([]);

    const secondSeed = await seedInitialData(db);
    expect(secondSeed.adminId).toBeTruthy();

    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      status: 'ok',
      service: 'virtuhar3d-api',
      version: '0.1.0',
      db: 'up',
    });
  });

  it('US-01 e RN-20: autenticação Argon2id, cookie HttpOnly/Secure/SameSite=Lax, bloqueio 5 falhas e expiração em 30 min', async () => {
    const { app, advanceMinutes } = await setupApp();

    // Erro genérico (usuário inexistente e senha incorreta retornam mesma mensagem)
    const missingUserRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { usuario: 'nao.existe', senha: '123' },
    });
    expect(missingUserRes.statusCode).toBe(401);

    const wrongPassRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { usuario: 'aluno.teste', senha: 'errada' },
    });
    expect(wrongPassRes.statusCode).toBe(401);
    expect(missingUserRes.json()).toEqual(wrongPassRes.json());

    // Mais 4 tentativas falhas -> 5ª bloqueia (423 Locked)
    for (let i = 0; i < 3; i++) {
      const r = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { usuario: 'aluno.teste', senha: 'errada' },
      });
      expect(r.statusCode).toBe(401);
    }

    const fifthFailRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { usuario: 'aluno.teste', senha: 'errada' },
    });
    expect(fifthFailRes.statusCode).toBe(423);

    // Mesmo com senha correta durante bloqueio continua 423
    const blockedRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { usuario: 'aluno.teste', senha: 'Aluno@Virtuhar2026' },
    });
    expect(blockedRes.statusCode).toBe(423);

    // Após 6 minutos o bloqueio expira e o login funciona com cookie seguro
    advanceMinutes(6);
    const loginOkRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { usuario: 'aluno.teste', senha: 'Aluno@Virtuhar2026' },
    });
    expect(loginOkRes.statusCode).toBe(200);

    const rawSetCookie = findSetCookieString(loginOkRes.headers['set-cookie'], 'vh3d_sessao');
    expect(rawSetCookie).toBeDefined();
    expect(rawSetCookie).toContain('HttpOnly');
    expect(rawSetCookie).toContain('Secure');
    expect(rawSetCookie?.toLowerCase()).toContain('samesite=lax');

    const token = extractCookieValue(loginOkRes.headers['set-cookie'], 'vh3d_sessao');
    expect(token.length).toBeGreaterThanOrEqual(32);

    // Após 20 min a sessão ainda é válida e renova de forma deslizante
    advanceMinutes(20);
    const meAliveRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: { vh3d_sessao: token },
    });
    expect(meAliveRes.statusCode).toBe(200);
    expect(meAliveRes.json<{ usuario: { usuario: string } }>().usuario.usuario).toBe('aluno.teste');

    // Após 31 min de inatividade a sessão expira
    advanceMinutes(31);
    const meExpiredRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: { vh3d_sessao: token },
    });
    expect(meExpiredRes.statusCode).toBe(401);

    // Novo login + logout explícito invalida o token imediatamente
    const secondLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { usuario: 'aluno.teste', senha: 'Aluno@Virtuhar2026' },
    });
    const token2 = extractCookieValue(secondLogin.headers['set-cookie'], 'vh3d_sessao');

    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      cookies: { vh3d_sessao: token2 },
    });
    expect(logoutRes.statusCode).toBe(200);

    const afterLogoutMe = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: { vh3d_sessao: token2 },
    });
    expect(afterLogoutMe.statusCode).toBe(401);
  });

  it('US-02 e RN-19: admin cria professor, professor importa 45 alunos em lote e exige troca de senha >= 8 caracteres', async () => {
    const { app } = await setupApp();

    // Admin faz login
    const adminLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { usuario: 'admin', senha: 'Admin@Virtuhar2026' },
    });
    const adminCookie = extractCookieValue(adminLogin.headers['set-cookie'], 'vh3d_sessao');

    // Admin cria novo professor com senha provisória
    const criarProfRes = await app.inject({
      method: 'POST',
      url: '/api/admin/professores',
      cookies: { vh3d_sessao: adminCookie },
      payload: { nome: 'Prof. Carla Silva', usuario: 'prof.carla' },
    });
    expect(criarProfRes.statusCode).toBe(201);
    const profBody = criarProfRes.json<{
      professor: { usuario: string; senhaProvisoriaTexto: string };
    }>();

    // Professor faz primeiro login -> bloqueado em rotas operacionais até trocar senha
    const profLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        usuario: profBody.professor.usuario,
        senha: profBody.professor.senhaProvisoriaTexto,
      },
    });
    expect(profLogin.statusCode).toBe(200);
    const profCookie = extractCookieValue(profLogin.headers['set-cookie'], 'vh3d_sessao');

    const bloqueadoTroca = await app.inject({
      method: 'POST',
      url: '/api/professor/turmas',
      cookies: { vh3d_sessao: profCookie },
      payload: { nome: '1º Info B', anoLetivo: 2026 },
    });
    expect(bloqueadoTroca.statusCode).toBe(403);
    expect(bloqueadoTroca.json<{ codigo: string }>().codigo).toBe('TROCA_SENHA_OBRIGATORIA');

    // Senha < 8 caracteres rejeitada (RN-19)
    const senhaCurtaRes = await app.inject({
      method: 'POST',
      url: '/api/auth/trocar-senha',
      cookies: { vh3d_sessao: profCookie },
      payload: {
        senhaAtual: profBody.professor.senhaProvisoriaTexto,
        novaSenha: 'curta',
      },
    });
    expect(senhaCurtaRes.statusCode).toBe(400);

    // Troca válida >= 8 caracteres
    const trocaOkRes = await app.inject({
      method: 'POST',
      url: '/api/auth/trocar-senha',
      cookies: { vh3d_sessao: profCookie },
      payload: {
        senhaAtual: profBody.professor.senhaProvisoriaTexto,
        novaSenha: 'NovaSenha@Prof2026',
      },
    });
    expect(trocaOkRes.statusCode).toBe(200);

    // Professor cria turma
    const turmaRes = await app.inject({
      method: 'POST',
      url: '/api/professor/turmas',
      cookies: { vh3d_sessao: profCookie },
      payload: { nome: '1º Info B', anoLetivo: 2026 },
    });
    expect(turmaRes.statusCode).toBe(201);
    const turmaId = turmaRes.json<{ turma: { id: string } }>().turma.id;

    // Importação em lote de 45 alunos (tamanho máximo de turma escolar)
    const linhas45 = Array.from({ length: 45 }, (_, idx) => `Estudante Numero ${idx + 1}`).join(
      '\n',
    );
    const loteRes = await app.inject({
      method: 'POST',
      url: '/api/professor/alunos/lote',
      cookies: { vh3d_sessao: profCookie },
      payload: { turmaId, textoLista: linhas45 },
    });
    expect(loteRes.statusCode).toBe(201);
    const loteBody = loteRes.json<{
      quantidade: number;
      criados: Array<{ usuario: string; senhaProvisoriaTexto: string }>;
    }>();
    expect(loteBody.quantidade).toBe(45);
    expect(loteBody.criados).toHaveLength(45);

    // Primeiro aluno importado loga com senha provisória, troca senha e acessa M00/M01
    const primeiroAluno = loteBody.criados[0];
    expect(primeiroAluno).toBeDefined();
    if (!primeiroAluno) {
      throw new Error('Primeiro aluno não retornado');
    }

    const alunoLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        usuario: primeiroAluno.usuario,
        senha: primeiroAluno.senhaProvisoriaTexto,
      },
    });
    expect(alunoLogin.statusCode).toBe(200);
    const alunoCookie = extractCookieValue(alunoLogin.headers['set-cookie'], 'vh3d_sessao');

    const missoesBloqueadas = await app.inject({
      method: 'GET',
      url: '/api/missoes',
      cookies: { vh3d_sessao: alunoCookie },
    });
    expect(missoesBloqueadas.statusCode).toBe(403);

    const alunoTroca = await app.inject({
      method: 'POST',
      url: '/api/auth/trocar-senha',
      cookies: { vh3d_sessao: alunoCookie },
      payload: {
        senhaAtual: primeiroAluno.senhaProvisoriaTexto,
        novaSenha: 'MinhaSenha@Aluno26',
      },
    });
    expect(alunoTroca.statusCode).toBe(200);

    const missoesLiberadas = await app.inject({
      method: 'GET',
      url: '/api/missoes',
      cookies: { vh3d_sessao: alunoCookie },
    });
    expect(missoesLiberadas.statusCode).toBe(200);
    const missoesJson = missoesLiberadas.json<{
      missoes: Array<{ id: string; liberada: boolean }>;
    }>();
    expect(missoesJson.missoes.find((m) => m.id === 'M00')?.liberada).toBe(true);
    expect(missoesJson.missoes.find((m) => m.id === 'M01')?.liberada).toBe(true);
  }, 15_000);

  it('fluxo completo de missão, ingestão de eventos em lote, pontuação autoritativa e RBAC entre turmas', async () => {
    const { app } = await setupApp();

    // Login como aluno.teste (já matriculado em 2º Info A do prof.raimundo)
    const aluno1Login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { usuario: 'aluno.teste', senha: 'Aluno@Virtuhar2026' },
    });
    const aluno1Cookie = extractCookieValue(aluno1Login.headers['set-cookie'], 'vh3d_sessao');

    // Aluno não pode acessar rotas de admin ou professor (RN-21)
    const alunoTentaAdmin = await app.inject({
      method: 'POST',
      url: '/api/admin/professores',
      cookies: { vh3d_sessao: aluno1Cookie },
      payload: { nome: 'Invasor', usuario: 'invasor' },
    });
    expect(alunoTentaAdmin.statusCode).toBe(403);

    const alunoTentaTurma = await app.inject({
      method: 'GET',
      url: '/api/professor/turmas',
      cookies: { vh3d_sessao: aluno1Cookie },
    });
    expect(alunoTentaTurma.statusCode).toBe(403);

    // Consulta detalhe da missão M01
    const m01Res = await app.inject({
      method: 'GET',
      url: '/api/missoes/M01',
      cookies: { vh3d_sessao: aluno1Cookie },
    });
    expect(m01Res.statusCode).toBe(200);
    expect(m01Res.json<{ missao: { id: string } }>().missao.id).toBe('M01');

    // Inicia sessão de M01
    const iniciarRes = await app.inject({
      method: 'POST',
      url: '/api/sessoes',
      cookies: { vh3d_sessao: aluno1Cookie },
      payload: { missaoId: 'M01', modo: 'guiado' },
    });
    expect(iniciarRes.statusCode).toBe(201);
    const sessaoId = iniciarRes.json<{ sessao: { id: string } }>().sessao.id;

    // Envia lote de eventos (a cada 5s na Bancada 3D)
    const lote1Res = await app.inject({
      method: 'POST',
      url: `/api/sessoes/${sessaoId}/eventos`,
      cookies: { vh3d_sessao: aluno1Cookie },
      payload: {
        eventos: [
          { instanteMs: 1200, tipo: 'esd_pulseira_colocada' },
          { instanteMs: 3400, tipo: 'erro_ordem', regra: 'RN-04', detalhe: { passo: 'cooler' } },
          {
            instanteMs: 5000,
            tipo: 'erro_compatibilidade',
            regra: 'RN-02',
            detalhe: { pecaId: 'ram-ddr5-16g' },
          },
          { instanteMs: 9200, tipo: 'peca_encaixada', detalhe: { pecaId: 'cpu-lga1700-i5' } },
        ],
      },
    });
    expect(lote1Res.statusCode).toBe(202);
    expect(lote1Res.json<{ recebidos: number }>().recebidos).toBe(4);

    // Conclui sessão com autoavaliação
    const concluirRes = await app.inject({
      method: 'POST',
      url: `/api/sessoes/${sessaoId}/concluir`,
      cookies: { vh3d_sessao: aluno1Cookie },
      payload: {
        tempoSeg: 240,
        dicasUsadas: 1,
        violacoesEsd: 0,
        errosOrdem: 1,
        pecasRecusadasCompatibilidade: ['ram-ddr5-16g'],
        postExibido: true,
        autoavaliacao: {
          explica: 'A memória DDR5 não encaixa no slot DDR4.',
          executa: 'Montei CPU, pasta térmica, cooler, 2x RAM DDR4 e fonte.',
          revisar: 'Conferir a ordem da pasta térmica antes do cooler.',
        },
      },
    });
    expect(concluirRes.statusCode).toBe(200);
    const relatorioConcluido = concluirRes.json<{
      relatorio: {
        pontuacao: { notaTotal: number; notaEsd: number; notaOrdem: number };
        insigniasConcedidas: string[];
      };
    }>().relatorio;
    expect(relatorioConcluido.pontuacao.notaEsd).toBe(20);
    expect(relatorioConcluido.pontuacao.notaOrdem).toBe(25);
    expect(relatorioConcluido.pontuacao.notaTotal).toBe(88);
    expect(relatorioConcluido.insigniasConcedidas).toContain('primeira-missao');
    expect(relatorioConcluido.insigniasConcedidas).toContain('agil');

    // Prof. Raimundo (dono da turma 2º Info A) acessa painel e relatório do aluno
    const raimundoLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { usuario: 'prof.raimundo', senha: 'Prof@Virtuhar2026' },
    });
    const raimundoCookie = extractCookieValue(raimundoLogin.headers['set-cookie'], 'vh3d_sessao');

    const turmasRaimundo = await app.inject({
      method: 'GET',
      url: '/api/professor/turmas',
      cookies: { vh3d_sessao: raimundoCookie },
    });
    expect(turmasRaimundo.statusCode).toBe(200);
    const turmaRaimundoId = turmasRaimundo.json<{ turmas: Array<{ id: string }> }>().turmas[0]?.id;
    expect(turmaRaimundoId).toBeDefined();

    const painelRes = await app.inject({
      method: 'GET',
      url: `/api/professor/turmas/${turmaRaimundoId}/painel`,
      cookies: { vh3d_sessao: raimundoCookie },
    });
    expect(painelRes.statusCode).toBe(200);
    const painelJson = painelRes.json<{
      alunos: Array<{ usuario: string; pontosTotal: number }>;
      errosFrequentes: Array<{ tipo: string; regra: string; quantidade: number }>;
    }>();
    expect(painelJson.alunos[0]?.usuario).toBe('aluno.teste');
    expect(painelJson.alunos[0]?.pontosTotal).toBe(88);
    expect(painelJson.errosFrequentes.length).toBeGreaterThanOrEqual(2);

    // Prof. Raimundo bloqueia M01 na turma -> aluno.teste recebe 403 ao iniciar sessão de M01
    const bloquearM01 = await app.inject({
      method: 'PATCH',
      url: `/api/professor/turmas/${turmaRaimundoId}/missoes/M01`,
      cookies: { vh3d_sessao: raimundoCookie },
      payload: { liberada: false },
    });
    expect(bloquearM01.statusCode).toBe(200);

    const iniciarBloqueada = await app.inject({
      method: 'POST',
      url: '/api/sessoes',
      cookies: { vh3d_sessao: aluno1Cookie },
      payload: { missaoId: 'M01', modo: 'guiado' },
    });
    expect(iniciarBloqueada.statusCode).toBe(403);

    // Admin cria Professor B (sem acesso à turma do Prof. Raimundo nem ao relatório do aluno.teste)
    const adminLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { usuario: 'admin', senha: 'Admin@Virtuhar2026' },
    });
    const adminCookie = extractCookieValue(adminLogin.headers['set-cookie'], 'vh3d_sessao');
    const profBCreate = await app.inject({
      method: 'POST',
      url: '/api/admin/professores',
      cookies: { vh3d_sessao: adminCookie },
      payload: { nome: 'Prof. Outro', usuario: 'prof.outro' },
    });
    const profBSenha = profBCreate.json<{ professor: { senhaProvisoriaTexto: string } }>().professor
      .senhaProvisoriaTexto;

    const profBLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { usuario: 'prof.outro', senha: profBSenha },
    });
    const profBCookie = extractCookieValue(profBLogin.headers['set-cookie'], 'vh3d_sessao');
    await app.inject({
      method: 'POST',
      url: '/api/auth/trocar-senha',
      cookies: { vh3d_sessao: profBCookie },
      payload: { senhaAtual: profBSenha, novaSenha: 'Senha@ProfB2026' },
    });

    // Professor B não pode acessar painel da turma A, nem alterar liberação da turma A, nem ler relatório do aluno da turma A
    const profBPainelA = await app.inject({
      method: 'GET',
      url: `/api/professor/turmas/${turmaRaimundoId}/painel`,
      cookies: { vh3d_sessao: profBCookie },
    });
    expect(profBPainelA.statusCode).toBe(403);

    const profBRelatorioA = await app.inject({
      method: 'GET',
      url: `/api/relatorios/${sessaoId}`,
      cookies: { vh3d_sessao: profBCookie },
    });
    expect(profBRelatorioA.statusCode).toBe(403);

    // Professor B não pode criar outro professor (apenas admin)
    const profBCriaProf = await app.inject({
      method: 'POST',
      url: '/api/admin/professores',
      cookies: { vh3d_sessao: profBCookie },
      payload: { nome: 'Prof. Sem Permissão', usuario: 'prof.nao' },
    });
    expect(profBCriaProf.statusCode).toBe(403);
  });
});
