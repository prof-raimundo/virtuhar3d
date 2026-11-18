import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  RotateCcw,
} from 'lucide-react';
import insigniasCatalogJson from '../../../content/data/insignias.json';
import {
  ApiError,
  fetchRelatorioDetalhe,
  fetchRelatorios,
  type RelatorioConcluido,
  type RelatorioDetalhado,
  type RelatorioListaItem,
} from '../api/client.js';

interface InsigniaCatalogItem {
  id: string;
  nome: string;
  descricao: string;
  textoAlternativo: string;
}

const INSIGNIAS_MAP: Record<string, InsigniaCatalogItem> = Object.fromEntries(
  (insigniasCatalogJson.insignias as InsigniaCatalogItem[]).map((item) => [item.id, item]),
);

interface RelatorioScreenProps {
  relatorioRecemConcluido: RelatorioConcluido | null;
  sessaoSelecionadaId: string | null;
  onSelectSessao: (sessaoId: string | null) => void;
  onBackToTrail: () => void;
  onRetryMission?: (missaoId: string) => void;
}

export function RelatorioScreen({
  relatorioRecemConcluido,
  sessaoSelecionadaId,
  onSelectSessao,
  onBackToTrail,
  onRetryMission,
}: RelatorioScreenProps) {
  const [lista, setLista] = useState<RelatorioListaItem[]>([]);
  const [detalhe, setDetalhe] = useState<RelatorioDetalhado | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const alvoSessaoId = sessaoSelecionadaId ?? relatorioRecemConcluido?.sessaoId ?? null;

  useEffect(() => {
    let cancelled = false;
    setCarregando(true);
    setErro(null);

    if (alvoSessaoId) {
      fetchRelatorioDetalhe(alvoSessaoId)
        .then((data) => {
          if (!cancelled) {
            setDetalhe(data);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled && !relatorioRecemConcluido) {
            setErro(
              err instanceof ApiError ? err.message : 'Não foi possível carregar o relatório.',
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setCarregando(false);
          }
        });
    } else {
      setDetalhe(null);
      fetchRelatorios()
        .then((rows) => {
          if (!cancelled) {
            setLista(rows);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setErro(
              err instanceof ApiError ? err.message : 'Não foi possível listar os relatórios.',
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setCarregando(false);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [alvoSessaoId, relatorioRecemConcluido]);

  const dadosExibidos = useMemo(() => {
    if (detalhe) {
      const notaTotal = detalhe.notaTotal ?? relatorioRecemConcluido?.pontuacao.notaTotal ?? 0;
      return {
        sessaoId: detalhe.sessaoId,
        missaoId: detalhe.missaoId,
        alunoNome: detalhe.alunoNome,
        modo: detalhe.modo,
        tempoSeg: detalhe.tempoSeg,
        dicasUsadas: detalhe.dicasUsadas,
        notaTotal,
        notaEsd: detalhe.notaEsd ?? relatorioRecemConcluido?.pontuacao.notaEsd ?? 0,
        notaOrdem: detalhe.notaOrdem ?? relatorioRecemConcluido?.pontuacao.notaOrdem ?? 0,
        notaCompatibilidade:
          detalhe.notaCompatibilidade ??
          relatorioRecemConcluido?.pontuacao.notaCompatibilidade ??
          0,
        notaTempo: detalhe.notaTempo ?? relatorioRecemConcluido?.pontuacao.notaTempo ?? 0,
        aprovado: notaTotal >= 70,
        erros: detalhe.erros,
        autoavaliacao: detalhe.autoavaliacao ?? relatorioRecemConcluido?.autoavaliacao ?? null,
        insignias: relatorioRecemConcluido?.insigniasConcedidas ?? [],
        nivelAluno: relatorioRecemConcluido?.nivelAluno ?? null,
        pontosTotalAluno: relatorioRecemConcluido?.pontosTotalAluno ?? null,
      };
    }

    if (relatorioRecemConcluido) {
      return {
        sessaoId: relatorioRecemConcluido.sessaoId,
        missaoId: relatorioRecemConcluido.missaoId,
        alunoNome: null,
        modo: relatorioRecemConcluido.modo,
        tempoSeg: relatorioRecemConcluido.tempoSeg,
        dicasUsadas: relatorioRecemConcluido.dicasUsadas,
        notaTotal: relatorioRecemConcluido.pontuacao.notaTotal,
        notaEsd: relatorioRecemConcluido.pontuacao.notaEsd,
        notaOrdem: relatorioRecemConcluido.pontuacao.notaOrdem,
        notaCompatibilidade: relatorioRecemConcluido.pontuacao.notaCompatibilidade,
        notaTempo: relatorioRecemConcluido.pontuacao.notaTempo,
        aprovado: relatorioRecemConcluido.pontuacao.aprovado,
        erros: [] as Array<{ tipo: string; regra: string; quantidade: number }>,
        autoavaliacao: relatorioRecemConcluido.autoavaliacao ?? null,
        insignias: relatorioRecemConcluido.insigniasConcedidas,
        nivelAluno: relatorioRecemConcluido.nivelAluno,
        pontosTotalAluno: relatorioRecemConcluido.pontosTotalAluno,
      };
    }

    return null;
  }, [detalhe, relatorioRecemConcluido]);

  if (!alvoSessaoId) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">Relatórios de Sessão</h1>
            <p className="mt-1 text-sm text-slate-300">
              Histórico de tentativas concluídas e em andamento com detalhamento por critério.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToTrail}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Ir para Missões</span>
          </button>
        </div>

        {carregando && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-300">
            Carregando histórico de relatórios...
          </div>
        )}

        {erro && (
          <div
            role="alert"
            className="mt-6 flex items-center gap-3 rounded-xl border border-red-800 bg-red-950 p-4 text-sm text-red-100"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
            <span>{erro}</span>
          </div>
        )}

        {!carregando && !erro && lista.length === 0 && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-300">
            Nenhuma sessão registrada ainda. Conclua a missão M00 ou M01 para gerar o primeiro
            relatório.
          </div>
        )}

        {!carregando && !erro && lista.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-4 py-3 font-medium">Missão</th>
                  <th className="px-4 py-3 font-medium">Estudante</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Tempo</th>
                  <th className="px-4 py-3 font-medium">Nota</th>
                  <th className="px-4 py-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {lista.map((item) => (
                  <tr key={item.sessaoId} className="hover:bg-slate-950/60">
                    <td className="px-4 py-3 font-semibold text-slate-100">
                      {item.missaoId} · {item.modo}
                    </td>
                    <td className="px-4 py-3">{item.alunoNome}</td>
                    <td className="px-4 py-3">
                      {item.estado === 'concluida' ? 'Concluída' : 'Em andamento'}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">{item.tempoSeg}s</td>
                    <td className="px-4 py-3 font-mono font-semibold tabular-nums">
                      {item.notaTotal !== null ? `${item.notaTotal}/100` : '--'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectSessao(item.sessaoId)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-medium text-slate-100 hover:bg-slate-700"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        <span>Abrir</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <button
            type="button"
            onClick={() => {
              onSelectSessao(null);
              if (relatorioRecemConcluido) {
                onBackToTrail();
              }
            }}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{relatorioRecemConcluido ? 'Voltar às Missões' : 'Todos os Relatórios'}</span>
          </button>
          <h1 className="mt-2 text-2xl font-bold text-slate-50 sm:text-3xl">
            Relatório da Sessão — {dadosExibidos?.missaoId ?? ''}
          </h1>
          {dadosExibidos?.alunoNome && (
            <p className="mt-1 text-sm text-slate-300">Estudante: {dadosExibidos.alunoNome}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onRetryMission && dadosExibidos && (
            <button
              type="button"
              onClick={() => onRetryMission(dadosExibidos.missaoId)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-semibold text-slate-100 hover:bg-slate-700"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Refazer Missão</span>
            </button>
          )}
          <button
            type="button"
            onClick={onBackToTrail}
            className="min-h-[44px] rounded-lg bg-sky-700 px-5 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Ir para Trilha de Missões
          </button>
        </div>
      </div>

      {carregando && !dadosExibidos && (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-300">
          Carregando detalhes do relatório...
        </div>
      )}

      {erro && !dadosExibidos && (
        <div
          role="alert"
          className="mt-8 flex items-center gap-3 rounded-xl border border-red-800 bg-red-950 p-4 text-sm text-red-100"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
          <span>{erro}</span>
        </div>
      )}

      {dadosExibidos && (
        <div className="mt-8 space-y-6">
          {/* Resultado geral e indicadores */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:col-span-2">
              <p className="text-sm text-slate-400">Nota Final da Prática</p>
              <div className="mt-2 flex items-baseline gap-4">
                <span className="font-mono text-4xl font-bold tabular-nums text-slate-50">
                  {dadosExibidos.notaTotal}/100
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                    dadosExibidos.aprovado ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {dadosExibidos.aprovado ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  )}
                  <span>
                    {dadosExibidos.aprovado
                      ? 'Aprovado (mínimo 70)'
                      : 'Abaixo de 70 — Revisão recomendada'}
                  </span>
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Tempo Registrado</p>
              <p className="mt-2 inline-flex items-center gap-2 font-mono text-2xl font-bold tabular-nums text-slate-50">
                <Clock className="h-5 w-5 text-sky-400" aria-hidden="true" />
                <span>{dadosExibidos.tempoSeg}s</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Dicas Utilizadas</p>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-50">
                {dadosExibidos.dicasUsadas} (-{Math.min(10, dadosExibidos.dicasUsadas * 2)} pts)
              </p>
            </div>
          </section>

          {/* Detalhamento por critério (Documento 7) */}
          <section
            aria-labelledby="titulo-criterios"
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 id="titulo-criterios" className="text-lg font-semibold text-slate-50">
              Pontuação por Critério Técnico
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Segurança ESD</p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-100">
                  {dadosExibidos.notaEsd}/20
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Ordem de Montagem</p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-100">
                  {dadosExibidos.notaOrdem}/30
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Compatibilidade</p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-100">
                  {dadosExibidos.notaCompatibilidade}/30
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">Eficiência de Tempo</p>
                <p className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-100">
                  {dadosExibidos.notaTempo}/20
                </p>
              </div>
            </div>
          </section>

          {/* Insígnias e Nível */}
          {(dadosExibidos.insignias.length > 0 || dadosExibidos.nivelAluno) && (
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-50">Progresso e Insígnias</h2>
                {dadosExibidos.nivelAluno && (
                  <span className="font-mono text-sm tabular-nums text-sky-300">
                    Nível: {dadosExibidos.nivelAluno} · Total: {dadosExibidos.pontosTotalAluno ?? 0}{' '}
                    pts
                  </span>
                )}
              </div>

              {dadosExibidos.insignias.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {dadosExibidos.insignias.map((id) => {
                    const meta = INSIGNIAS_MAP[id];
                    return (
                      <div
                        key={id}
                        className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4"
                      >
                        <Award
                          role="img"
                          className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
                          aria-label={meta?.textoAlternativo ?? id}
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{meta?.nome ?? id}</p>
                          <p className="mt-1 text-sm text-slate-300">{meta?.descricao ?? ''}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  Conclua sem erros ou dentro do tempo de referência para conquistar novas
                  insígnias.
                </p>
              )}
            </section>
          )}

          {/* Erros registrados */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-50">
              Ocorrências Técnicas Registradas
            </h2>
            {dadosExibidos.erros.length === 0 ? (
              <p className="mt-2 text-sm text-emerald-300">
                Nenhum erro técnico registrado nos eventos desta sessão.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {dadosExibidos.erros.map((err) => (
                  <li
                    key={`${err.tipo}-${err.regra}`}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm"
                  >
                    <span className="text-slate-200">
                      {err.tipo.replace('erro_', 'Erro de ')} · Regra {err.regra}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-amber-300">
                      {err.quantidade}x
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Autoavaliação */}
          {dadosExibidos.autoavaliacao && (
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold text-slate-50">Autoavaliação Registrada</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-slate-400">O que consigo explicar</dt>
                  <dd className="mt-1 text-slate-200">{dadosExibidos.autoavaliacao.explica}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-400">O que consigo executar</dt>
                  <dd className="mt-1 text-slate-200">{dadosExibidos.autoavaliacao.executa}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-400">O que preciso revisar</dt>
                  <dd className="mt-1 text-slate-200">{dadosExibidos.autoavaliacao.revisar}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
