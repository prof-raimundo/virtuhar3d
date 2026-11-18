import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  RefreshCw,
  ShieldAlert,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  ApiError,
  atualizarLiberacaoMissao,
  criarProfessor,
  criarTurma,
  fetchPainelTurma,
  fetchTurmas,
  importarAlunosLote,
  type PainelTurmaData,
  type TurmaItem,
  type UsuarioSessao,
} from '../api/client.js';

interface ProfessorPanelScreenProps {
  usuario: UsuarioSessao;
  onOpenRelatorio: (sessaoId: string) => void;
}

export function ProfessorPanelScreen({ usuario, onOpenRelatorio }: ProfessorPanelScreenProps) {
  const [turmas, setTurmas] = useState<TurmaItem[]>([]);
  const [turmaAtivaId, setTurmaAtivaId] = useState<string>('');
  const [painel, setPainel] = useState<PainelTurmaData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Criar turma
  const [novaTurmaNome, setNovaTurmaNome] = useState('');
  const [novaTurmaAno, setNovaTurmaAno] = useState(2026);

  // Importação em lote de alunos
  const [listaAlunosTexto, setListaAlunosTexto] = useState('');
  const [importando, setImportando] = useState(false);
  const [alunosCriados, setAlunosCriados] = useState<
    Array<{ id: string; nome: string; usuario: string; senhaProvisoriaTexto: string }>
  >([]);

  // Criar professor (somente admin)
  const [profNome, setProfNome] = useState('');
  const [profUsuario, setProfUsuario] = useState('');
  const [profCriado, setProfCriado] = useState<{
    nome: string;
    usuario: string;
    senhaProvisoriaTexto: string;
  } | null>(null);

  // Estado local dos toggles de liberação de missão na turma selecionada
  const [liberacoes, setLiberacoes] = useState<Record<string, boolean>>({
    M00: true,
    M01: true,
  });

  const carregarTurmas = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await fetchTurmas();
      setTurmas(lista);
      if (lista.length > 0 && !turmaAtivaId) {
        setTurmaAtivaId(lista[0]?.id ?? '');
      }
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar as turmas.');
    } finally {
      setCarregando(false);
    }
  }, [turmaAtivaId]);

  const carregarPainel = useCallback(async (id: string) => {
    if (!id) {
      setPainel(null);
      return;
    }
    try {
      const data = await fetchPainelTurma(id);
      setPainel(data);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Erro ao atualizar o painel da turma.');
    }
  }, []);

  useEffect(() => {
    void carregarTurmas();
  }, [carregarTurmas]);

  useEffect(() => {
    if (!turmaAtivaId) {
      return;
    }
    void carregarPainel(turmaAtivaId);
    const timer = window.setInterval(() => {
      void carregarPainel(turmaAtivaId);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [turmaAtivaId, carregarPainel]);

  const handleCriarTurma = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);
    if (!novaTurmaNome.trim()) {
      setErro('Informe o nome da turma.');
      return;
    }
    try {
      const criada = await criarTurma(novaTurmaNome.trim(), novaTurmaAno);
      setTurmas((prev) => [criada, ...prev]);
      setTurmaAtivaId(criada.id);
      setNovaTurmaNome('');
      setMensagemSucesso(`Turma "${criada.nome}" criada com M00 e M01 liberadas.`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Erro ao criar turma.');
    }
  };

  const handleImportarAlunos = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);

    if (!turmaAtivaId) {
      setErro('Selecione ou crie uma turma antes de importar alunos.');
      return;
    }
    if (!listaAlunosTexto.trim()) {
      setErro('Cole ao menos um nome de aluno (um por linha).');
      return;
    }

    setImportando(true);
    try {
      const res = await importarAlunosLote({
        turmaId: turmaAtivaId,
        textoLista: listaAlunosTexto,
      });
      setAlunosCriados(res.criados);
      setListaAlunosTexto('');
      setMensagemSucesso(`${res.quantidade} conta(s) de aluno criada(s) com senha provisória.`);
      await carregarPainel(turmaAtivaId);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Erro ao importar lista de alunos.');
    } finally {
      setImportando(false);
    }
  };

  const handleCriarProfessor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);
    if (!profNome.trim() || !profUsuario.trim()) {
      setErro('Informe nome completo e usuário para cadastrar o professor.');
      return;
    }
    try {
      const prof = await criarProfessor(profNome.trim(), profUsuario.trim());
      setProfCriado(prof);
      setProfNome('');
      setProfUsuario('');
      setMensagemSucesso(`Conta do professor "${prof.nome}" criada com sucesso.`);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Erro ao cadastrar professor.');
    }
  };

  const handleToggleMissao = async (missaoId: string) => {
    if (!turmaAtivaId) {
      return;
    }
    const proximo = !liberacoes[missaoId];
    setErro(null);
    try {
      await atualizarLiberacaoMissao(turmaAtivaId, missaoId, proximo);
      setLiberacoes((prev) => ({ ...prev, [missaoId]: proximo }));
      setMensagemSucesso(
        `Missão ${missaoId} ${proximo ? 'liberada' : 'bloqueada'} para a turma selecionada.`,
      );
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Erro ao atualizar liberação.');
    }
  };

  const baixarCredenciaisCsv = () => {
    if (alunosCriados.length === 0) {
      return;
    }
    const linhas = [
      'nome;usuario;senha_provisoria',
      ...alunosCriados.map((a) => `${a.nome};${a.usuario};${a.senhaProvisoriaTexto}`),
    ];
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'credenciais-virtuhar3d.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copiarCredenciais = async () => {
    if (alunosCriados.length === 0 || !navigator.clipboard) {
      return;
    }
    const texto = alunosCriados
      .map((a) => `${a.nome} | usuário: ${a.usuario} | senha: ${a.senhaProvisoriaTexto}`)
      .join('\n');
    await navigator.clipboard.writeText(texto);
    setMensagemSucesso('Lista de credenciais copiada para a área de transferência.');
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <p className="text-sm font-medium text-sky-400">Gestão Acadêmica do Laboratório</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-50 sm:text-3xl">
            Contas, Turmas e Painel de Desempenho
          </h1>
          <p className="mt-1.5 text-sm text-slate-300">
            Crie turmas, importe listas de alunos em lote com senha provisória e acompanhe os
            resultados em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {turmas.length > 0 && (
            <select
              aria-label="Selecionar turma ativa"
              value={turmaAtivaId}
              onChange={(e) => setTurmaAtivaId(e.target.value)}
              className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-3.5 text-sm text-slate-100"
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.anoLetivo})
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => {
              if (turmaAtivaId) {
                void carregarPainel(turmaAtivaId);
              }
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-medium text-slate-100 hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="mt-6 flex items-center gap-2.5 rounded-xl border border-red-800 bg-red-950 p-4 text-sm text-red-100"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
          <span>{erro}</span>
        </div>
      )}

      {mensagemSucesso && (
        <div
          role="status"
          className="mt-6 flex items-center gap-2.5 rounded-xl border border-emerald-800 bg-emerald-950/60 p-4 text-sm text-emerald-100"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Coluna esquerda: Criação de turma, importação em lote e admin */}
        <section className="space-y-6 lg:col-span-5">
          {usuario.perfil === 'admin' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-2 text-slate-100">
                <UserPlus className="h-5 w-5 text-sky-400" aria-hidden="true" />
                <h2 className="text-lg font-semibold">Cadastrar Professor (Admin)</h2>
              </div>

              <form onSubmit={handleCriarProfessor} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="prof-nome" className="block text-sm font-medium text-slate-200">
                    Nome completo
                  </label>
                  <input
                    id="prof-nome"
                    type="text"
                    value={profNome}
                    onChange={(e) => setProfNome(e.target.value)}
                    placeholder="Ex.: Prof. Maria Oliveira"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="prof-user" className="block text-sm font-medium text-slate-200">
                    Usuário de login
                  </label>
                  <input
                    id="prof-user"
                    type="text"
                    value={profUsuario}
                    onChange={(e) => setProfUsuario(e.target.value)}
                    placeholder="Ex.: prof.maria"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[44px] w-full rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800"
                >
                  Gerar conta de professor
                </button>
              </form>

              {profCriado && (
                <div className="mt-4 rounded-lg border border-emerald-800 bg-slate-950 p-3.5 text-sm">
                  <p className="font-semibold text-emerald-300">Senha provisória gerada:</p>
                  <p className="mt-1 font-mono text-slate-100">
                    {profCriado.usuario} · {profCriado.senhaProvisoriaTexto}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Nova turma */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-50">Nova Turma</h2>
            <form
              onSubmit={handleCriarTurma}
              className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              <div className="sm:col-span-2">
                <label htmlFor="turma-nome" className="block text-sm font-medium text-slate-200">
                  Nome da turma
                </label>
                <input
                  id="turma-nome"
                  type="text"
                  value={novaTurmaNome}
                  onChange={(e) => setNovaTurmaNome(e.target.value)}
                  placeholder="Ex.: 2º Info B"
                  className="mt-1 min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="turma-ano" className="block text-sm font-medium text-slate-200">
                  Ano letivo
                </label>
                <input
                  id="turma-ano"
                  type="number"
                  min={2024}
                  max={2100}
                  value={novaTurmaAno}
                  onChange={(e) => setNovaTurmaAno(Number(e.target.value))}
                  className="mt-1 min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-sm tabular-nums text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-semibold text-slate-100 hover:bg-slate-700 sm:col-span-3"
              >
                Criar turma (M00 e M01 liberadas)
              </button>
            </form>
          </div>

          {/* Importação de alunos em lote */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-2 text-slate-100">
              <Users className="h-5 w-5 text-sky-400" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Criar Contas de Alunos em Lote</h2>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Cole um nome por linha (ou <span className="font-mono">Nome Completo;usuario</span>).
              O sistema gera usuários únicos e senhas provisórias automaticamente.
            </p>

            <form onSubmit={handleImportarAlunos} className="mt-4 space-y-3">
              <label htmlFor="lote-alunos" className="sr-only">
                Lista de alunos para importação
              </label>
              <textarea
                id="lote-alunos"
                rows={5}
                value={listaAlunosTexto}
                onChange={(e) => setListaAlunosTexto(e.target.value)}
                placeholder={'Ana Beatriz Silva\nCarlos Eduardo Souza;carlos.souza'}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                type="submit"
                disabled={importando || !turmaAtivaId}
                className="min-h-[44px] w-full rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
              >
                {importando ? 'Gerando contas...' : 'Importar alunos para a turma'}
              </button>
            </form>

            {alunosCriados.length > 0 && (
              <div className="mt-5 border-t border-slate-800 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Credenciais geradas ({alunosCriados.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void copiarCredenciais()}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200 hover:bg-slate-700"
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      <span>Copiar</span>
                    </button>
                    <button
                      type="button"
                      onClick={baixarCredenciaisCsv}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200 hover:bg-slate-700"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
                <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="px-3 py-2 font-medium">Nome</th>
                        <th className="px-3 py-2 font-medium">Usuário</th>
                        <th className="px-3 py-2 font-medium">Senha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {alunosCriados.map((a) => (
                        <tr key={a.id}>
                          <td className="px-3 py-2">{a.nome}</td>
                          <td className="px-3 py-2 font-mono text-sky-300">{a.usuario}</td>
                          <td className="px-3 py-2 font-mono">{a.senhaProvisoriaTexto}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Coluna direita: Painel da Turma + Liberação de missões + Erros frequentes */}
        <section className="space-y-6 lg:col-span-7">
          {/* Liberação de Missões */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-50">Liberação de Missões do MVP</h2>
            <p className="mt-1 text-sm text-slate-400">
              Controle quais missões estão visíveis para os alunos da turma selecionada.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {(['M00', 'M01'] as const).map((id) => {
                const ativa = Boolean(liberacoes[id]);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!turmaAtivaId}
                    onClick={() => void handleToggleMissao(id)}
                    aria-pressed={ativa}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${
                      ativa
                        ? 'border-emerald-700 bg-emerald-950/60 text-emerald-100 hover:bg-emerald-900/70'
                        : 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2
                      className={`h-4 w-4 ${ativa ? 'text-emerald-400' : 'text-slate-600'}`}
                      aria-hidden="true"
                    />
                    <span>
                      {id}: {ativa ? 'Liberada' : 'Bloqueada'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Erros frequentes e sinais de alerta */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-2 text-slate-100">
              <ShieldAlert className="h-5 w-5 text-amber-400" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Erros Mais Frequentes da Turma</h2>
            </div>

            {!painel || painel.errosFrequentes.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                Nenhum erro registrado nas sessões desta turma até o momento.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {painel.errosFrequentes.map((err) => (
                  <li
                    key={`${err.tipo}-${err.regra}`}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm"
                  >
                    <span className="text-slate-200">
                      {err.tipo.replace('erro_', 'Erro de ')} · Regra {err.regra}
                      {err.quantidade >= 3 && ' · Reforço coletivo recomendado'}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-amber-300">
                      {err.quantidade}x
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Lista de alunos e sessões */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-50">Acompanhamento dos Estudantes</h2>

            {carregando ? (
              <p className="mt-4 text-sm text-slate-300">Carregando dados da turma...</p>
            ) : !painel || painel.alunos.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">
                Nenhum estudante matriculado nesta turma ainda.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                      <th className="px-4 py-3 font-medium">Aluno</th>
                      <th className="px-4 py-3 font-medium">Nível</th>
                      <th className="px-4 py-3 font-medium">Pontos</th>
                      <th className="px-4 py-3 font-medium">Missões e Relatórios</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {painel.alunos.map((aluno) => (
                      <tr key={aluno.id} className="hover:bg-slate-950/60">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-100">{aluno.nome}</div>
                          <div className="font-mono text-sm text-slate-400">{aluno.usuario}</div>
                        </td>
                        <td className="px-4 py-3">{aluno.nivel}</td>
                        <td className="px-4 py-3 font-mono tabular-nums">{aluno.pontosTotal}</td>
                        <td className="px-4 py-3">
                          {aluno.sessoes.length === 0 ? (
                            <span className="text-slate-400">Sem tentativas</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {aluno.sessoes.map((s) => (
                                <button
                                  key={s.sessaoId}
                                  type="button"
                                  onClick={() => onOpenRelatorio(s.sessaoId)}
                                  className="min-h-[38px] rounded-md border border-slate-700 bg-slate-800 px-3 font-mono text-sm tabular-nums text-slate-100 hover:bg-slate-700"
                                >
                                  {s.missaoId}:{' '}
                                  {s.notaTotal !== null ? `${s.notaTotal}/100` : s.estado}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
