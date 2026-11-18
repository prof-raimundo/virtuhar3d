import type {
  MissaoDefinicao,
  ModoMissao,
  PecaCatalogo,
  RegrasParametros,
  RelatorioPontuacao,
} from '@virtuhar3d/rules';

export type PerfilUsuario = 'aluno' | 'professor' | 'admin';

export interface UsuarioSessao {
  id: string;
  nome: string;
  usuario: string;
  perfil: PerfilUsuario;
  senhaProvisoria: boolean;
}

export interface MissaoResumo {
  id: string;
  titulo: string;
  trilha: string;
  versao: string;
  etiqueta: {
    modulo: string;
    aulas: number[];
  };
  tempoReferenciaSeg: number;
  liberada: boolean;
  concluida: boolean;
  melhorNota: number | null;
}

export interface ResumoAluno {
  pontosTotal: number;
  nivel: string;
  insignias: string[];
}

export interface ConhecimentoPrevioItem {
  id: string;
  pergunta: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
}

export interface CartaoPedagogicoItem {
  tipo:
    | 'atencao'
    | 'seguranca'
    | 'erros_frequentes'
    | 'dica_profissional'
    | 'conexao_fgb'
    | 'curiosidade'
    | 'desafio';
  gatilhoPassoId?: string;
  titulo: string;
  conteudo: string;
  areaFgb?: string;
}

export interface MissaoCompleta extends MissaoDefinicao {
  trilha: string;
  versao: string;
  etiqueta: {
    modulo: string;
    aulas: number[];
  };
  conhecimentosPrevios: ConhecimentoPrevioItem[];
  microaula: {
    titulo: string;
    topicos: string[];
    glossario: Array<{ termo: string; definicao: string }>;
  };
  pecasDisponiveis: string[];
  cartoes: CartaoPedagogicoItem[];
  questoes: string[];
}

export interface EventoSessaoPayload {
  instanteMs: number;
  tipo: string;
  regra?: string;
  detalhe?: Record<string, unknown>;
}

export interface AutoavaliacaoPayload {
  explica: string;
  executa: string;
  revisar: string;
}

export interface RelatorioConcluido {
  sessaoId: string;
  missaoId: string;
  modo: ModoMissao;
  tempoSeg: number;
  dicasUsadas: number;
  violacoesEsd: number;
  errosOrdem: number;
  errosCompatibilidade: number;
  pontuacao: RelatorioPontuacao;
  pontosTotalAluno: number;
  nivelAluno: string;
  insigniasConcedidas: string[];
  autoavaliacao?: AutoavaliacaoPayload | null;
}

export interface RelatorioListaItem {
  sessaoId: string;
  alunoId: string;
  alunoNome: string;
  missaoId: string;
  modo: ModoMissao;
  estado: string;
  iniciadaEm: string;
  concluidaEm: string | null;
  tempoSeg: number;
  dicasUsadas: number;
  notaTotal: number | null;
  notaEsd: number | null;
  notaOrdem: number | null;
  notaCompatibilidade: number | null;
  notaTempo: number | null;
}

export interface RelatorioDetalhado extends RelatorioListaItem {
  erros: Array<{ tipo: string; regra: string; quantidade: number }>;
  eventos: Array<{
    id: string;
    instante_ms: number;
    tipo: string;
    regra: string | null;
    detalhe: unknown;
  }>;
  autoavaliacao: AutoavaliacaoPayload | null;
}

export interface TurmaItem {
  id: string;
  nome: string;
  anoLetivo: number;
  professorId: string;
}

export interface PainelTurmaData {
  turmaId: string;
  alunos: Array<{
    id: string;
    nome: string;
    usuario: string;
    pontosTotal: number;
    nivel: string;
    sessoes: Array<{
      sessaoId: string;
      missaoId: string;
      estado: string;
      notaTotal: number | null;
      tempoSeg: number;
    }>;
  }>;
  errosFrequentes: Array<{
    tipo: string;
    regra: string;
    quantidade: number;
  }>;
}

export class ApiError extends Error {
  status: number;
  codigo?: string;

  constructor(message: string, status: number, codigo?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const text = await response.text();
  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  }

  if (!response.ok) {
    const msg =
      typeof parsed.erro === 'string' ? parsed.erro : `Erro na requisição (${response.status}).`;
    const codigo = typeof parsed.codigo === 'string' ? parsed.codigo : undefined;
    throw new ApiError(msg, response.status, codigo);
  }

  return parsed as T;
}

export async function fetchMe(): Promise<UsuarioSessao | null> {
  try {
    const data = await apiFetch<{ usuario: UsuarioSessao }>('/auth/me');
    return data.usuario;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null;
    }
    throw err;
  }
}

export async function login(usuario: string, senha: string): Promise<UsuarioSessao> {
  const data = await apiFetch<{ usuario: UsuarioSessao }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, senha }),
  });
  return data.usuario;
}

export async function logout(): Promise<void> {
  await apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' });
}

export async function trocarSenha(senhaAtual: string, novaSenha: string): Promise<UsuarioSessao> {
  const data = await apiFetch<{ usuario: UsuarioSessao }>('/auth/trocar-senha', {
    method: 'POST',
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
  return data.usuario;
}

export async function fetchMissoes(): Promise<{
  missoes: MissaoResumo[];
  resumoAluno: ResumoAluno;
}> {
  return apiFetch<{ missoes: MissaoResumo[]; resumoAluno: ResumoAluno }>('/missoes');
}

export async function fetchMissaoDetalhe(missaoId: string): Promise<{
  missao: MissaoCompleta;
  pecas: PecaCatalogo[];
  regras: RegrasParametros;
}> {
  return apiFetch(`/missoes/${encodeURIComponent(missaoId)}`);
}

export async function iniciarSessao(
  missaoId: string,
  modo: ModoMissao,
): Promise<{ id: string; missaoId: string; modo: ModoMissao; estado: string }> {
  const data = await apiFetch<{
    sessao: { id: string; missaoId: string; modo: ModoMissao; estado: string };
  }>('/sessoes', {
    method: 'POST',
    body: JSON.stringify({ missaoId, modo }),
  });
  return data.sessao;
}

export async function enviarEventosLote(
  sessaoId: string,
  eventos: EventoSessaoPayload[],
): Promise<{ recebidos: number }> {
  return apiFetch<{ recebidos: number }>(`/sessoes/${encodeURIComponent(sessaoId)}/eventos`, {
    method: 'POST',
    body: JSON.stringify({ eventos }),
  });
}

export async function concluirSessao(
  sessaoId: string,
  payload: {
    tempoSeg: number;
    dicasUsadas: number;
    violacoesEsd: number;
    errosOrdem: number;
    pecasRecusadasCompatibilidade: string[];
    postExibido: boolean;
    autoavaliacao?: AutoavaliacaoPayload;
  },
): Promise<RelatorioConcluido> {
  const data = await apiFetch<{ relatorio: RelatorioConcluido }>(
    `/sessoes/${encodeURIComponent(sessaoId)}/concluir`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return data.relatorio;
}

export async function fetchRelatorios(): Promise<RelatorioListaItem[]> {
  const data = await apiFetch<{ relatorios: RelatorioListaItem[] }>('/relatorios');
  return data.relatorios;
}

export async function fetchRelatorioDetalhe(sessaoId: string): Promise<RelatorioDetalhado> {
  const data = await apiFetch<{ relatorio: RelatorioDetalhado }>(
    `/relatorios/${encodeURIComponent(sessaoId)}`,
  );
  return data.relatorio;
}

export async function criarProfessor(
  nome: string,
  usuario: string,
): Promise<{
  id: string;
  nome: string;
  usuario: string;
  perfil: 'professor';
  senhaProvisoriaTexto: string;
}> {
  const data = await apiFetch<{
    professor: {
      id: string;
      nome: string;
      usuario: string;
      perfil: 'professor';
      senhaProvisoriaTexto: string;
    };
  }>('/admin/professores', {
    method: 'POST',
    body: JSON.stringify({ nome, usuario }),
  });
  return data.professor;
}

export async function fetchTurmas(): Promise<TurmaItem[]> {
  const data = await apiFetch<{ turmas: TurmaItem[] }>('/professor/turmas');
  return data.turmas;
}

export async function criarTurma(nome: string, anoLetivo: number): Promise<TurmaItem> {
  const data = await apiFetch<{ turma: TurmaItem }>('/professor/turmas', {
    method: 'POST',
    body: JSON.stringify({ nome, anoLetivo }),
  });
  return data.turma;
}

export async function importarAlunosLote(payload: {
  turmaId: string;
  alunos?: Array<{ nome: string; usuario?: string }>;
  textoLista?: string;
}): Promise<{
  turmaId: string;
  quantidade: number;
  criados: Array<{ id: string; nome: string; usuario: string; senhaProvisoriaTexto: string }>;
}> {
  return apiFetch('/professor/alunos/lote', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function atualizarLiberacaoMissao(
  turmaId: string,
  missaoId: string,
  liberada: boolean,
): Promise<void> {
  await apiFetch(
    `/professor/turmas/${encodeURIComponent(turmaId)}/missoes/${encodeURIComponent(missaoId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ liberada }),
    },
  );
}

export async function fetchPainelTurma(turmaId: string): Promise<PainelTurmaData> {
  return apiFetch<PainelTurmaData>(`/professor/turmas/${encodeURIComponent(turmaId)}/painel`);
}
