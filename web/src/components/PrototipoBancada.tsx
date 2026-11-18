import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  HelpCircle,
  Info,
  Power,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react';
import {
  calcularPontuacao,
  criarEstadoInicial,
  executarAcaoBancada,
  type AcaoBancada,
  type EstadoBancada,
  type MissaoDefinicao,
  type ModoMissao,
  type PecaCatalogo,
  type RegrasParametros,
  type ResultadoRegra,
} from '@virtuhar3d/rules';
import pecasCatalogJson from '../../../content/data/pecas.json';
import regrasJson from '../../../content/data/regras.json';
import missaoM00Json from '../../../content/data/missoes/m00-tutorial-esd.json';
import missaoM01Json from '../../../content/data/missoes/m01-bancada-post.json';
import {
  BancadaScene,
  SNAP_POINTS_WORLD,
  type BenchmarkMetrics,
  type GlbPrototypeStatus,
} from '../three/BancadaScene.js';
import { registerTestModeBridge } from '../testing/testModeBridge.js';

const MISSOES: Record<string, MissaoDefinicao> = {
  M00: missaoM00Json as MissaoDefinicao,
  M01: missaoM01Json as MissaoDefinicao,
};

const REGRAS = regrasJson as RegrasParametros;

function buildCatalogoMap(): Record<string, PecaCatalogo> {
  const mapa: Record<string, PecaCatalogo> = {};
  for (const peca of pecasCatalogJson.pecas) {
    mapa[peca.id] = peca as PecaCatalogo;
  }
  return mapa;
}

const CATALOGO = buildCatalogoMap();

const PONTOS_SELECIONAVEIS = Object.keys(SNAP_POINTS_WORLD).filter(
  (p) => p !== 'ponto_placa_mae' && p !== 'ponto_monitor',
);

export function PrototipoBancada() {
  const [missaoId, setMissaoId] = useState<'M00' | 'M01'>('M01');
  const [modo, setModo] = useState<ModoMissao>('guiado');
  const missaoAtual = MISSOES[missaoId] ?? (missaoM01Json as MissaoDefinicao);

  const [estado, setEstado] = useState<EstadoBancada>(() =>
    criarEstadoInicial(missaoAtual, 'guiado'),
  );
  const [selectedPecaId, setSelectedPecaId] = useState<string | null>(null);
  const [selectedInstalledPonto, setSelectedInstalledPonto] = useState<string | null>(null);
  const [activeSnapPoint, setActiveSnapPoint] = useState<string | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoRegra | null>(null);
  const [dicaAtual, setDicaAtual] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkMetrics | null>(null);
  const [glbStatus, setGlbStatus] = useState<GlbPrototypeStatus | null>(null);
  const [elapsedSeg, setElapsedSeg] = useState(0);

  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeg((prev) => (estadoRef.current.postExibido ? prev : prev + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const trocarMissao = useCallback((novoId: 'M00' | 'M01', novoModo: ModoMissao) => {
    const alvo = MISSOES[novoId] ?? (missaoM01Json as MissaoDefinicao);
    setMissaoId(novoId);
    setModo(novoModo);
    setEstado(criarEstadoInicial(alvo, novoModo));
    setSelectedPecaId(null);
    setSelectedInstalledPonto(null);
    setActiveSnapPoint(null);
    setUltimoResultado(null);
    setDicaAtual(null);
    setElapsedSeg(0);
  }, []);

  const aplicarAcao = useCallback(
    (acao: AcaoBancada): ResultadoRegra => {
      const { novoEstado, resultado } = executarAcaoBancada(
        acao,
        estadoRef.current,
        CATALOGO,
        REGRAS,
        missaoAtual,
      );
      estadoRef.current = novoEstado;
      setEstado(novoEstado);
      setUltimoResultado(resultado);
      if (resultado.permitido) {
        setSelectedPecaId(null);
        setActiveSnapPoint(null);
      }
      return resultado;
    },
    [missaoAtual],
  );

  const handleSnapAttempt = useCallback(
    (pecaId: string, ponto: string): ResultadoRegra => {
      const peca = CATALOGO[pecaId];
      if (!peca) {
        return { permitido: false, mensagem: `Peça ${pecaId} não encontrada.` };
      }

      if (pecaId === 'pulseira-esd') {
        return aplicarAcao({ tipo: 'vestir_esd' });
      }
      if (pecaId === 'pasta-termica') {
        return aplicarAcao({ tipo: 'aplicar_pasta' });
      }
      if (pecaId === 'chave-fenda') {
        return aplicarAcao({ tipo: 'jump_power' });
      }
      if (peca.tipo === 'cabo') {
        return aplicarAcao({ tipo: 'conectar_cabo', pecaId, ponto });
      }
      return aplicarAcao({ tipo: 'encaixar', pecaId, ponto });
    },
    [aplicarAcao],
  );

  const handleSelectTrayPart = (pecaId: string) => {
    setSelectedInstalledPonto(null);
    setSelectedPecaId(pecaId);
    const peca = CATALOGO[pecaId];
    const primeiroPonto = peca?.pontosDeEncaixe[0] ?? PONTOS_SELECIONAVEIS[0] ?? null;
    setActiveSnapPoint(primeiroPonto);
  };

  const handleSelectInstalled = useCallback((ponto: string, pecaId: string) => {
    setSelectedPecaId(null);
    setSelectedInstalledPonto(ponto);
    const peca = CATALOGO[pecaId];
    if (peca) {
      setUltimoResultado({
        permitido: true,
        mensagem: `Selecionado: ${peca.nome} (${ponto}). Pressione Delete para retirar se necessário.`,
      });
    }
  }, []);

  const handleDeleteSelectedInstalled = useCallback(() => {
    if (!selectedInstalledPonto) {
      return;
    }
    if (selectedInstalledPonto === 'ponto_aterramento') {
      aplicarAcao({ tipo: 'retirar_esd' });
    } else {
      aplicarAcao({ tipo: 'retirar', ponto: selectedInstalledPonto });
    }
    setSelectedInstalledPonto(null);
  }, [selectedInstalledPonto, aplicarAcao]);

  // Suporte global a Delete quando peça instalada está selecionada
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedInstalledPonto) {
        e.preventDefault();
        handleDeleteSelectedInstalled();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedInstalledPonto, handleDeleteSelectedInstalled]);

  const pontuacao = useMemo(
    () => calcularPontuacao(estado, elapsedSeg, missaoAtual.tempoReferenciaSeg, REGRAS),
    [estado, elapsedSeg, missaoAtual.tempoReferenciaSeg],
  );

  // Registro do Modo de Teste 3D (Documento 14, Seção 4)
  useEffect(() => {
    registerTestModeBridge({
      enabled: true,
      getState: () => ({
        missaoId,
        estado: estadoRef.current,
        pontuacao,
        ultimoResultado,
        benchmark,
        glbStatus,
      }),
      equipEsd: () => aplicarAcao({ tipo: 'vestir_esd' }),
      removeEsd: () => aplicarAcao({ tipo: 'retirar_esd' }),
      snapPart: (pecaId, pontoId) => handleSnapAttempt(pecaId, pontoId),
      inspectPart: (pecaId, pontoId) =>
        aplicarAcao({ tipo: 'inspecionar', pecaId, ponto: pontoId }),
      removePart: (pontoId) => aplicarAcao({ tipo: 'retirar', ponto: pontoId }),
      applyThermalPaste: () => aplicarAcao({ tipo: 'aplicar_pasta' }),
      toggleFonte: (ligada) => aplicarAcao({ tipo: 'alternar_fonte', ligada }),
      triggerJumpPower: () => aplicarAcao({ tipo: 'jump_power' }),
      resetMission: () => trocarMissao(missaoId, modo),
    });

    return () => registerTestModeBridge(null);
  }, [
    missaoId,
    modo,
    pontuacao,
    ultimoResultado,
    benchmark,
    glbStatus,
    aplicarAcao,
    handleSnapAttempt,
    trocarMissao,
  ]);

  const pecasDisponiveis = useMemo(() => {
    const raw =
      missaoId === 'M00'
        ? (missaoM00Json.pecasDisponiveis as string[])
        : (missaoM01Json.pecasDisponiveis as string[]);
    return raw.map((id) => CATALOGO[id]).filter((p): p is PecaCatalogo => Boolean(p));
  }, [missaoId]);

  const pecaSelecionada = selectedPecaId ? CATALOGO[selectedPecaId] : undefined;

  const proximoPasso = useMemo(
    () => missaoAtual.passos.find((p) => !estado.passosConcluidos.includes(p.id)) ?? null,
    [missaoAtual.passos, estado.passosConcluidos],
  );

  const pedirDica = () => {
    if (modo !== 'guiado' || !proximoPasso) {
      return;
    }
    aplicarAcao({ tipo: 'usar_dica' });
    setDicaAtual(proximoPasso.dica ?? `Próxima etapa recomendada: ${proximoPasso.descricao}`);
  };

  const pontosParaPecaSelecionada = useMemo(() => {
    if (!pecaSelecionada) {
      return [];
    }
    const base = new Set([...pecaSelecionada.pontosDeEncaixe, ...PONTOS_SELECIONAVEIS]);
    return Array.from(base).filter((p) => p !== 'ponto_placa_mae' && p !== 'ponto_monitor');
  }, [pecaSelecionada]);

  const statusMonitorTexto = estado.postExibido
    ? 'POST OK'
    : !estado.instaladas['ponto_fonte']
      ? 'Sem energia (fonte ausente)'
      : !estado.fonteLigada
        ? 'Fonte desligada (chave em 0)'
        : 'Aguardando jump PWR_SW';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Barra superior (Documento 9, Seção 4) */}
      <header className="z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-5 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-sky-400" aria-hidden="true" />
            <span className="text-base font-bold tracking-tight text-white">VIRTUHAR3D</span>
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-300 md:flex">
            <span>{missaoAtual.id}</span>
            <span aria-hidden="true">·</span>
            <span className="max-w-xs truncate text-slate-200">{missaoAtual.titulo}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seleção rápida de missão e modo para validação do protótipo */}
          <div
            role="group"
            aria-label="Selecionar missão do protótipo"
            className="flex items-center rounded-lg border border-slate-700 bg-slate-950 p-0.5"
          >
            {(['M00', 'M01'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => trocarMissao(id, modo)}
                className={`min-h-[36px] rounded-md px-3 text-xs font-semibold transition-colors ${
                  missaoId === id
                    ? 'bg-sky-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {id}
              </button>
            ))}
          </div>

          {/* Estado ESD (nunca só cor: ícone + texto explícito) */}
          <button
            type="button"
            onClick={() => aplicarAcao({ tipo: estado.esdColocada ? 'retirar_esd' : 'vestir_esd' })}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors ${
              estado.esdColocada
                ? 'border-emerald-600 bg-emerald-950 text-emerald-200 hover:bg-emerald-900'
                : 'border-amber-500 bg-amber-950 text-amber-200 hover:bg-amber-900'
            }`}
          >
            {estado.esdColocada ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-amber-400" aria-hidden="true" />
            )}
            <span>
              {estado.esdColocada ? 'Pulseira ESD: Conectada' : 'Pulseira ESD: Desconectada'}
            </span>
          </button>

          {/* Chave da fonte ATX */}
          <button
            type="button"
            disabled={!estado.instaladas['ponto_fonte']}
            onClick={() => aplicarAcao({ tipo: 'alternar_fonte', ligada: !estado.fonteLigada })}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
              estado.fonteLigada
                ? 'border-emerald-600 bg-emerald-950 text-emerald-200 hover:bg-emerald-900'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Power className="h-4 w-4" aria-hidden="true" />
            <span>Fonte: {estado.fonteLigada ? 'Ligada (I)' : 'Desligada (0)'}</span>
          </button>

          {/* Dica (Modo Guiado) */}
          {modo === 'guiado' && (
            <button
              type="button"
              onClick={pedirDica}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-100 hover:bg-slate-700"
            >
              <HelpCircle className="h-4 w-4 text-sky-400" aria-hidden="true" />
              <span>Dica (-2 pts)</span>
            </button>
          )}

          {/* Benchmark leve FPS / Triângulos */}
          <div
            aria-label="Benchmark de desempenho da cena 3D"
            className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs tabular-nums text-slate-200"
          >
            <Gauge
              className={`h-4 w-4 ${
                benchmark && !benchmark.meetsFpsTarget ? 'text-amber-400' : 'text-emerald-400'
              }`}
              aria-hidden="true"
            />
            <span>{benchmark ? `${benchmark.fps} FPS` : '-- FPS'}</span>
            <span aria-hidden="true" className="text-slate-600">
              /
            </span>
            <span>
              {benchmark ? `${benchmark.triangles.toLocaleString('pt-BR')} tri` : '-- tri'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => trocarMissao(missaoId, modo)}
            aria-label="Reiniciar bancada"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reiniciar</span>
          </button>
        </div>
      </header>

      {/* Área principal em 3 colunas (Documento 9, Seção 4) */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[290px_1fr_320px]">
        {/* Coluna esquerda: Bandeja de peças e ferramentas */}
        <aside
          aria-label="Peças e ferramentas disponíveis"
          className="flex flex-col border-r border-slate-800 bg-slate-900"
        >
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Peças e Ferramentas</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Clique ou use Tab + Enter para selecionar e encaixar na bancada.
            </p>
          </div>
          <ul className="flex-1 space-y-2 overflow-y-auto p-3">
            {pecasDisponiveis.map((peca) => {
              const isSelected = selectedPecaId === peca.id;
              const isInstalled =
                Object.values(estado.instaladas).includes(peca.id) ||
                (peca.id === 'pulseira-esd' && estado.esdColocada) ||
                (peca.id === 'pasta-termica' && estado.pastaTermicaAplicada);

              return (
                <li key={peca.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectTrayPart(peca.id)}
                    aria-pressed={isSelected}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-sky-400 bg-sky-950 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-white">{peca.nome}</span>
                      {isInstalled && (
                        <CheckCircle2
                          role="img"
                          className="h-4 w-4 shrink-0 text-emerald-400"
                          aria-label="Instalada"
                        />
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="uppercase">{peca.tipo}</span>
                      {peca.sensivelESD && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-300">Sensível ESD</span>
                        </>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Centro: Cena 3D + Controles acessíveis sobre o canvas */}
        <main className="relative min-h-[380px] flex-1 bg-slate-950">
          <BancadaScene
            estado={estado}
            catalogo={CATALOGO}
            selectedPecaId={selectedPecaId}
            activeSnapPoint={activeSnapPoint}
            hoveredLabel={hoveredLabel}
            statusMonitor={statusMonitorTexto}
            onHoverChange={setHoveredLabel}
            onSelectInstalled={handleSelectInstalled}
            onSnapAttempt={handleSnapAttempt}
            onCancelSelection={() => {
              setSelectedPecaId(null);
              setActiveSnapPoint(null);
            }}
            onMetrics={setBenchmark}
            onGlbStatus={setGlbStatus}
          />

          {/* Rótulo de peça sob o cursor (US-03) */}
          {hoveredLabel && (
            <div
              role="status"
              className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-1.5 text-xs font-medium text-white"
            >
              {hoveredLabel}
            </div>
          )}

          {/* Status do carregador GLB + Meshopt (Marco M1) */}
          {glbStatus && (
            <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-lg border border-slate-800 bg-slate-900/95 px-3 py-1.5 text-xs text-slate-300">
              {glbStatus.loaded
                ? `GLB Meshopt OK · ${glbStatus.triangles} tri · pontos: ${glbStatus.snapPoints.join(', ') || 'nenhum'}`
                : `GLB: ${glbStatus.error ?? 'carregando'}`}
            </div>
          )}

          {/* Barra inferior do canvas para encaixe acessível por teclado ou retirada */}
          {(pecaSelecionada || selectedInstalledPonto) && (
            <div className="absolute bottom-4 left-1/2 z-10 flex w-[min(680px,94%)] -translate-x-1/2 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3">
              {pecaSelecionada ? (
                <>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">
                      Encaixar: {pecaSelecionada.nome}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Clique no anel 3D destacado ou selecione o ponto e confirme com Espaço:
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Selecionar ponto de encaixe"
                      value={activeSnapPoint ?? ''}
                      onChange={(e) => setActiveSnapPoint(e.target.value)}
                      className="min-h-[38px] rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-white"
                    >
                      {pontosParaPecaSelecionada.map((ponto) => (
                        <option key={ponto} value={ponto}>
                          {ponto}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeSnapPoint) {
                          handleSnapAttempt(pecaSelecionada.id, activeSnapPoint);
                        }
                      }}
                      className="min-h-[38px] rounded-lg bg-sky-700 px-3.5 text-xs font-semibold text-white hover:bg-sky-800"
                    >
                      Encaixar (Espaço)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPecaId(null);
                        setActiveSnapPoint(null);
                      }}
                      className="min-h-[38px] rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs text-slate-200 hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-slate-200">
                    Ponto selecionado: <span className="font-mono">{selectedInstalledPonto}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteSelectedInstalled}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-red-700 bg-red-950 px-3 text-xs font-semibold text-red-200 hover:bg-red-900"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span>Retirar peça (Delete)</span>
                  </button>
                </>
              )}
            </div>
          )}
        </main>

        {/* Coluna direita: Passos, Ordem de Serviço e Pontuação */}
        <aside
          aria-label="Guia de passos e pontuação"
          className="flex flex-col border-l border-slate-800 bg-slate-900"
        >
          <div className="border-b border-slate-800 p-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold text-white">Progresso da Missão</span>
              <span className="font-mono tabular-nums">
                {estado.passosConcluidos.length}/{missaoAtual.passos.length} passos
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300">{missaoAtual.ordemServico?.relato ?? ''}</p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2.5 text-xs font-mono tabular-nums text-slate-300">
              <span>Nota prévia: {pontuacao.notaTotal}/100</span>
              <span>Tempo: {elapsedSeg}s</span>
            </div>
          </div>

          {dicaAtual && (
            <div
              role="note"
              className="mx-3 mt-3 rounded-lg border border-sky-700 bg-sky-950/70 p-3 text-xs text-sky-100"
            >
              <div className="flex items-center gap-1.5 font-semibold text-sky-300">
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Dica do Modo Guiado</span>
              </div>
              <p className="mt-1">{dicaAtual}</p>
            </div>
          )}

          <ol className="flex-1 space-y-2 overflow-y-auto p-3">
            {missaoAtual.passos.map((passo, idx) => {
              const concluido = estado.passosConcluidos.includes(passo.id);
              const ehAtual = proximoPasso?.id === passo.id;
              return (
                <li
                  key={passo.id}
                  className={`rounded-lg border p-2.5 text-xs ${
                    concluido
                      ? 'border-emerald-800 bg-emerald-950/40 text-emerald-200'
                      : ehAtual
                        ? 'border-sky-600 bg-slate-950 text-white'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {concluido ? (
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <Wrench
                        className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                        aria-hidden="true"
                      />
                    )}
                    <span>
                      <strong className="font-mono tabular-nums">{idx + 1}.</strong>{' '}
                      {passo.descricao}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      {/* Barra inferior: Feedback imediato acessível (< 1s, US-10) */}
      <footer
        role="status"
        aria-live="polite"
        className={`z-20 flex min-h-[52px] items-center justify-between gap-4 border-t px-5 py-2.5 text-sm ${
          ultimoResultado === null
            ? 'border-slate-800 bg-slate-900 text-slate-300'
            : ultimoResultado.permitido
              ? 'border-emerald-800 bg-emerald-950 text-emerald-100'
              : 'border-red-800 bg-red-950 text-red-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {ultimoResultado === null ? (
            <Info className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
          ) : ultimoResultado.permitido ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          )}
          <div>
            <span className="font-medium">
              {ultimoResultado
                ? ultimoResultado.mensagem
                : 'Pronto na bancada. Conecte a pulseira ESD para iniciar a montagem segura.'}
            </span>
            {ultimoResultado?.comoCorrigir && (
              <span className="ml-2 text-xs opacity-90">
                Como corrigir: {ultimoResultado.comoCorrigir}
              </span>
            )}
          </div>
        </div>
        <span className="hidden font-mono text-xs tabular-nums text-slate-400 sm:inline">
          Erros ESD: {estado.violacoesEsd} · Ordem: {estado.errosOrdem} · Compat:{' '}
          {estado.pecasRecusadasCompatibilidade.length}
        </span>
      </footer>
    </div>
  );
}
