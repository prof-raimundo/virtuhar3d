import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import type { ModoMissao, PecaCatalogo, RegrasParametros } from '@virtuhar3d/rules';
import { ApiError, fetchMissaoDetalhe, iniciarSessao, type MissaoCompleta } from '../api/client.js';

interface OrdemServicoScreenProps {
  missaoId: string;
  modo: ModoMissao;
  onBack: () => void;
  onStartBancada: (payload: {
    sessaoId: string;
    missao: MissaoCompleta;
    pecas: PecaCatalogo[];
    regras: RegrasParametros;
    modo: ModoMissao;
  }) => void;
}

export function OrdemServicoScreen({
  missaoId,
  modo,
  onBack,
  onStartBancada,
}: OrdemServicoScreenProps) {
  const [missao, setMissao] = useState<MissaoCompleta | null>(null);
  const [pecas, setPecas] = useState<PecaCatalogo[]>([]);
  const [regras, setRegras] = useState<RegrasParametros | null>(null);
  const [etapa, setEtapa] = useState<'os' | 'microaula'>('os');
  const [respostasPrevias, setRespostasPrevias] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCarregando(true);
    setErro(null);

    fetchMissaoDetalhe(missaoId)
      .then((data) => {
        if (!cancelled) {
          setMissao(data.missao);
          setPecas(data.pecas);
          setRegras(data.regras);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setErro(
            err instanceof ApiError
              ? err.message
              : 'Não foi possível carregar os detalhes da missão.',
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
  }, [missaoId]);

  const handleAbrirBancada = async () => {
    if (!missao || !regras) {
      return;
    }
    setIniciando(true);
    setErro(null);
    try {
      const sessao = await iniciarSessao(missao.id, modo);
      onStartBancada({
        sessaoId: sessao.id,
        missao,
        pecas,
        regras,
        modo,
      });
    } catch (err) {
      setErro(
        err instanceof ApiError ? err.message : 'Não foi possível iniciar a sessão na bancada.',
      );
    } finally {
      setIniciando(false);
    }
  };

  if (carregando) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-300">
          Carregando ordem de serviço e micro-aula...
        </div>
      </main>
    );
  }

  if (erro || !missao || !regras) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-800 bg-red-950/70 p-4 text-sm text-red-100"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
          <span>{erro ?? 'Missão não encontrada.'}</span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Voltar às missões</span>
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Voltar para a trilha</span>
          </button>
          <h1 className="mt-2 text-balance text-2xl font-bold text-slate-50 sm:text-3xl">
            {missao.id} — {missao.titulo}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {missao.etiqueta.modulo} · Aulas {missao.etiqueta.aulas.join(', ')} · Modo:{' '}
            {modo === 'guiado' ? 'Guiado' : 'Prática Livre'}
          </p>
        </div>

        {/* Seletor entre Ordem de Serviço e Micro-aula */}
        <div
          role="tablist"
          aria-label="Etapas preparatórias da missão"
          className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={etapa === 'os'}
            onClick={() => setEtapa('os')}
            className={`min-h-[40px] whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors ${
              etapa === 'os' ? 'bg-sky-700 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            1. Ordem de Serviço
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={etapa === 'microaula'}
            onClick={() => setEtapa('microaula')}
            className={`min-h-[40px] whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors ${
              etapa === 'microaula' ? 'bg-sky-700 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            2. Micro-aula e Peças
          </button>
        </div>
      </div>

      {etapa === 'os' ? (
        <div className="mt-8 space-y-8">
          {/* Ficha da Ordem de Serviço */}
          <section
            aria-labelledby="titulo-os"
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <div className="flex items-center gap-2.5 text-sky-400">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
              <h2 id="titulo-os" className="text-lg font-semibold text-slate-50">
                Ordem de Serviço do Atendimento
              </h2>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-800 pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-400">Solicitante / Cliente</dt>
                <dd className="mt-1 text-base font-medium text-slate-100">
                  {missao.ordemServico?.cliente ?? 'Laboratório EEEP'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-400">Equipamento</dt>
                <dd className="mt-1 text-base font-medium text-slate-100">
                  {missao.ordemServico?.equipamento ?? 'Bancada de Teste'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-slate-400">Relato do Problema</dt>
                <dd className="mt-1 text-base leading-relaxed text-slate-200">
                  {missao.ordemServico?.relato ?? ''}
                </dd>
              </div>
            </dl>
          </section>

          {/* Diagnóstico inicial: Conhecimentos prévios */}
          {missao.conhecimentosPrevios.length > 0 && (
            <section
              aria-labelledby="titulo-previos"
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h2 id="titulo-previos" className="text-lg font-semibold text-slate-50">
                Checagem de Conhecimentos Prévios
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Responda antes de iniciar a prática para ativar os conceitos-chave (sem perda de
                pontos).
              </p>

              <div className="mt-6 space-y-6">
                {missao.conhecimentosPrevios.map((item, idx) => {
                  const selecionada = respostasPrevias[item.id];
                  const acertou = selecionada === item.correta;
                  return (
                    <fieldset key={item.id} className="space-y-3">
                      <legend className="text-base font-medium text-slate-100">
                        {idx + 1}. {item.pergunta}
                      </legend>
                      <div className="space-y-2.5">
                        {item.opcoes.map((opcao, optIdx) => {
                          const marcada = selecionada === optIdx;
                          return (
                            <label
                              key={opcao}
                              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                                marcada
                                  ? 'border-sky-500 bg-sky-950/60 text-slate-50'
                                  : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`previo-${item.id}`}
                                checked={marcada}
                                onChange={() =>
                                  setRespostasPrevias((prev) => ({
                                    ...prev,
                                    [item.id]: optIdx,
                                  }))
                                }
                                className="h-4 w-4 accent-sky-500"
                              />
                              <span>{opcao}</span>
                            </label>
                          );
                        })}
                      </div>

                      {selecionada !== undefined && (
                        <div
                          role="status"
                          className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-sm ${
                            acertou
                              ? 'border-emerald-800 bg-emerald-950/50 text-emerald-100'
                              : 'border-amber-800 bg-amber-950/50 text-amber-100'
                          }`}
                        >
                          {acertou ? (
                            <CheckCircle2
                              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                              aria-hidden="true"
                            />
                          ) : (
                            <AlertTriangle
                              className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                              aria-hidden="true"
                            />
                          )}
                          <div>
                            <p className="font-semibold">
                              {acertou ? 'Resposta correta!' : 'Vale revisar este conceito:'}
                            </p>
                            <p className="mt-1 text-slate-200">{item.explicacao}</p>
                          </div>
                        </div>
                      )}
                    </fieldset>
                  );
                })}
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => setEtapa('microaula')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <span>Revisar Micro-aula e Glossário</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={iniciando}
              onClick={handleAbrirBancada}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-sky-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60"
            >
              <span>{iniciando ? 'Abrindo bancada...' : 'Abrir Bancada 3D'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Micro-aula */}
          <section
            aria-labelledby="titulo-microaula"
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <div className="flex items-center gap-2.5 text-sky-400">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              <h2 id="titulo-microaula" className="text-lg font-semibold text-slate-50">
                {missao.microaula.titulo}
              </h2>
            </div>

            <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-slate-200">
              {missao.microaula.topicos.map((topico) => (
                <li key={topico}>{topico}</li>
              ))}
            </ul>

            {missao.microaula.glossario.length > 0 && (
              <div className="mt-6 border-t border-slate-800 pt-5">
                <h3 className="text-base font-semibold text-slate-100">
                  Glossário Técnico (Termos em Inglês)
                </h3>
                <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {missao.microaula.glossario.map((g) => (
                    <div
                      key={g.termo}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                    >
                      <dt className="text-sm font-semibold text-sky-300">{g.termo}</dt>
                      <dd className="mt-1 text-sm text-slate-300">{g.definicao}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>

          {/* Inventário acessível de peças da missão */}
          <section
            aria-labelledby="titulo-pecas-missao"
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <div className="flex items-center gap-2.5 text-slate-100">
              <Cpu className="h-5 w-5 text-sky-400" aria-hidden="true" />
              <h2 id="titulo-pecas-missao" className="text-lg font-semibold">
                Peças e Ferramentas na Bancada
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pecas.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-100">{p.nome}</h3>
                    {p.sensivelESD && (
                      <span className="inline-flex items-center gap-1 text-sm text-amber-300">
                        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                        <span>ESD</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-300">{p.descricao}</p>
                  <p className="mt-1.5 text-sm text-slate-400">
                    Descrição visual: {p.textoAlternativo}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setEtapa('os')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Voltar à Ordem de Serviço</span>
            </button>

            <button
              type="button"
              disabled={iniciando}
              onClick={handleAbrirBancada}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-sky-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60"
            >
              <span>{iniciando ? 'Iniciando sessão...' : 'Abrir Bancada 3D'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
