import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Award, CheckCircle2, Clock, Lock, Wrench } from 'lucide-react';
import type { ModoMissao } from '@virtuhar3d/rules';
import { ApiError, fetchMissoes, type MissaoResumo, type ResumoAluno } from '../api/client.js';

interface TrilhaMissoesScreenProps {
  onSelectMission: (missaoId: string, modo: ModoMissao) => void;
}

export function TrilhaMissoesScreen({ onSelectMission }: TrilhaMissoesScreenProps) {
  const [missoes, setMissoes] = useState<MissaoResumo[]>([]);
  const [resumo, setResumo] = useState<ResumoAluno>({
    pontosTotal: 0,
    nivel: 'Aprendiz',
    insignias: [],
  });
  const [modoSelecionado, setModoSelecionado] = useState<ModoMissao>('guiado');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCarregando(true);
    setErro(null);

    fetchMissoes()
      .then((data) => {
        if (!cancelled) {
          setMissoes(data.missoes);
          setResumo(data.resumoAluno);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setErro(
            err instanceof ApiError
              ? err.message
              : 'Não foi possível carregar a trilha de missões.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCarregando(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const concluidasCount = missoes.filter((m) => m.concluida).length;

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="flex flex-col justify-between gap-6 border-b border-slate-800 pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-sky-400">
            Trilha de Formação · Montagem de Hardware
          </p>
          <h1 className="mt-1.5 text-balance text-3xl font-bold tracking-tight text-slate-50">
            Ordens de Serviço do Laboratório
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Escolha uma missão liberada para revisar o relato do cliente, executar a prática na
            bancada 3D e gerar seu relatório de desempenho.
          </p>
        </div>

        {/* Seletor funcional de modo de uso (Doc 8, Seção 3) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-300">Modo de prática</span>
          <div
            role="group"
            aria-label="Selecionar modo da missão"
            className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1"
          >
            <button
              type="button"
              onClick={() => setModoSelecionado('guiado')}
              className={`min-h-[40px] whitespace-nowrap rounded-md px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                modoSelecionado === 'guiado'
                  ? 'bg-sky-700 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Modo Guiado
            </button>
            <button
              type="button"
              onClick={() => setModoSelecionado('livre')}
              title="Prática sem dicas e sem limite de tempo"
              className={`min-h-[40px] whitespace-nowrap rounded-md px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                modoSelecionado === 'livre'
                  ? 'bg-sky-700 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Prática Livre
            </button>
          </div>
        </div>
      </div>

      {/* Faixa de indicadores do estudante (numeração tabular, sem pílulas decorativas) */}
      <section
        aria-label="Resumo do progresso"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Nível técnico atual</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-50">{resumo.nivel}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Pontuação acumulada</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-50">
            {resumo.pontosTotal} pts
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Missões concluídas e insígnias</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-50">
            {concluidasCount}/{missoes.length} · {resumo.insignias.length} insígnias
          </p>
        </div>
      </section>

      {carregando && (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-300">
          Carregando catálogo de missões...
        </div>
      )}

      {erro && (
        <div
          role="alert"
          className="mt-8 flex items-center gap-3 rounded-xl border border-red-800 bg-red-950/70 p-4 text-sm text-red-100"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
          <span>{erro}</span>
        </div>
      )}

      {!carregando && !erro && (
        <section
          aria-label="Lista de missões"
          className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {missoes.map((missao) => {
            const minutosRef = Math.round(missao.tempoReferenciaSeg / 60);
            return (
              <article
                key={missao.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-6"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
                    <span>
                      {missao.id} · {missao.etiqueta.modulo} · Aulas{' '}
                      {missao.etiqueta.aulas.join(', ')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-slate-300">
                      <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      {minutosRef} min
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-semibold text-slate-50">{missao.titulo}</h2>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                    {missao.concluida ? (
                      <span className="inline-flex items-center gap-2 font-medium text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                        <span>
                          Concluída · Melhor nota:{' '}
                          <strong className="font-mono tabular-nums">
                            {missao.melhorNota ?? 0}/100
                          </strong>
                        </span>
                      </span>
                    ) : missao.liberada ? (
                      <span className="inline-flex items-center gap-2 font-medium text-sky-300">
                        <Wrench className="h-4 w-4 text-sky-400" aria-hidden="true" />
                        <span>Disponível para prática</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 font-medium text-slate-400">
                        <Lock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                        <span>Aguardando liberação do professor</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                    <Award className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    <span>{modoSelecionado === 'guiado' ? 'Com dicas (-2 pts)' : 'Sem dicas'}</span>
                  </span>

                  <button
                    type="button"
                    disabled={!missao.liberada}
                    onClick={() => onSelectMission(missao.id, modoSelecionado)}
                    className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-400"
                  >
                    <span>
                      {missao.concluida ? 'Praticar novamente' : 'Abrir Ordem de Serviço'}
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
