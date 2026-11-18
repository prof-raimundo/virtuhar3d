import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  atualizarLiberacaoMissao,
  concluirSessao,
  criarProfessor,
  criarTurma,
  enviarEventosLote,
  fetchMe,
  fetchMissaoDetalhe,
  fetchMissoes,
  fetchPainelTurma,
  fetchRelatorioDetalhe,
  fetchRelatorios,
  fetchTurmas,
  importarAlunosLote,
  iniciarSessao,
  login,
  logout,
  trocarSenha,
} from './client.js';

function mockJsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Cliente HTTP da API VIRTUHAR3D', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('trata fetchMe 401 como sessão nula e propaga erros reais via ApiError', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockJsonResponse(401, { erro: 'Não autenticado' }))
      .mockResolvedValueOnce(
        mockJsonResponse(500, { erro: 'Falha interna', codigo: 'ERR_INTERNO' }),
      );

    await expect(fetchMe()).resolves.toBeNull();
    await expect(fetchMe()).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      codigo: 'ERR_INTERNO',
      message: 'Falha interna',
    });
    expect(new ApiError('Teste', 400, 'BAD').status).toBe(400);
  });

  it('executa chamadas de autenticação, missões, sessões, relatórios e professor com credentials=include', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          usuario: {
            id: '1',
            nome: 'Aluno',
            usuario: 'a',
            perfil: 'aluno',
            senhaProvisoria: false,
          },
        }),
      )
      .mockResolvedValueOnce(mockJsonResponse(200, { ok: true }))
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          usuario: {
            id: '1',
            nome: 'Aluno',
            usuario: 'a',
            perfil: 'aluno',
            senhaProvisoria: false,
          },
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse(200, {
          missoes: [],
          resumoAluno: { pontosTotal: 0, nivel: 'Aprendiz', insignias: [] },
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse(200, { missao: { id: 'M00' }, pecas: [], regras: {} }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse(201, {
          sessao: { id: 's1', missaoId: 'M00', modo: 'guiado', estado: 'em_andamento' },
        }),
      )
      .mockResolvedValueOnce(mockJsonResponse(200, { recebidos: 1 }))
      .mockResolvedValueOnce(mockJsonResponse(200, { relatorio: { sessaoId: 's1' } }))
      .mockResolvedValueOnce(mockJsonResponse(200, { relatorios: [] }))
      .mockResolvedValueOnce(mockJsonResponse(200, { relatorio: { sessaoId: 's1' } }))
      .mockResolvedValueOnce(mockJsonResponse(201, { professor: { id: 'p1', usuario: 'prof' } }))
      .mockResolvedValueOnce(mockJsonResponse(200, { turmas: [] }))
      .mockResolvedValueOnce(
        mockJsonResponse(201, { turma: { id: 't1', nome: '1A', anoLetivo: 2026 } }),
      )
      .mockResolvedValueOnce(mockJsonResponse(201, { turmaId: 't1', quantidade: 1, criados: [] }))
      .mockResolvedValueOnce(mockJsonResponse(200, { ok: true }))
      .mockResolvedValueOnce(
        mockJsonResponse(200, { turmaId: 't1', alunos: [], errosFrequentes: [] }),
      );

    await login('a', '12345678');
    await logout();
    await trocarSenha('12345678', '87654321');
    await fetchMissoes();
    await fetchMissaoDetalhe('M00');
    await iniciarSessao('M00', 'guiado');
    await enviarEventosLote('s1', [{ instanteMs: 100, tipo: 'esd_pulseira_colocada' }]);
    await concluirSessao('s1', {
      tempoSeg: 120,
      dicasUsadas: 0,
      violacoesEsd: 0,
      errosOrdem: 0,
      pecasRecusadasCompatibilidade: [],
      postExibido: true,
    });
    await fetchRelatorios();
    await fetchRelatorioDetalhe('s1');
    await criarProfessor('Prof', 'prof');
    await fetchTurmas();
    await criarTurma('1A', 2026);
    await importarAlunosLote({ turmaId: 't1', textoLista: 'Ana' });
    await atualizarLiberacaoMissao('t1', 'M00', true);
    await fetchPainelTurma('t1');

    expect(fetchMock).toHaveBeenCalledTimes(16);
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe('include');
  });
});
