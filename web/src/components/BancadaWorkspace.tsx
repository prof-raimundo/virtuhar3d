import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
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
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import {
  calcularPontuacao,
  criarEstadoInicial,
  executarAcaoBancada,
  type AcaoBancada,
  type EstadoBancada,
  type ModoMissao,
  type PecaCatalogo,
  type RegrasParametros,
  type ResultadoRegra,
} from '@virtuhar3d/rules';
import {
  ApiError,
  concluirSessao,
  enviarEventosLote,
  type CartaoPedagogicoItem,
  type EventoSessaoPayload,
  type MissaoCompleta,
  type RelatorioConcluido,
} from '../api/client.js';
import { emitAudioCue } from '../audio/biosAudio.js';
import { registerTestModeBridge } from '../testing/testModeBridge.js';
import {
  BancadaScene,
  SNAP_POINTS_WORLD,
  type BenchmarkMetrics,
  type GlbPrototypeStatus,
} from '../three/BancadaScene.js';

const PONTOS_SELECIONAVEIS = Object.keys(SNAP_POINTS_WORLD).filter(
  (p) => p !== 'ponto_placa_mae' && p !== 'ponto_monitor',
);

interface BancadaWorkspaceProps {
  sessaoId: string;
  missao: MissaoCompleta;
  pecas: PecaCatalogo[];
  regras: RegrasParametros;
  modo: ModoMissao;
  onExitToTrail: () => void;
  onSessionCompleted: (relatorio: RelatorioConcluido) => void;
}

export function BancadaWorkspace({
  sessaoId,
  missao,
  pecas,
  regras,
  modo,
  onExitToTrail,
  onSessionCompleted,
}: BancadaWorkspaceProps) {
  const catalogo = useMemo(() => {
    const mapa: Record<string, PecaCatalogo> = {};
    for (const peca of pecas) {
      mapa[peca.id] = peca;
    }
    return mapa;
  }, [pecas]);

  const [estado, setEstado] = useState<EstadoBancada>(() => criarEstadoInicial(missao, modo));
  const [selectedPecaId, setSelectedPecaId] = useState<string | null>(null);
  const [selectedInstalledPonto, setSelectedInstalledPonto] = useState<string | null>(null);
  const [activeSnapPoint, setActiveSnapPoint] = useState<string | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoRegra | null>(null);
  const [legendaAudio, setLegendaAudio] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [dicaAtual, setDicaAtual] = useState<string | null>(null);
  const [cartoesDispensados, setCartoesDispensados] = useState<string[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkMetrics | null>(null);
  const [glbStatus, setGlbStatus] = useState<GlbPrototypeStatus | null>(null);
  const [elapsedSeg, setElapsedSeg] = useState(0);

  // Modal de finalização e autoavaliação (Doc 8, Seção 6)
  const [modalAutoavaliacao, setModalAutoavaliacao] = useState(false);
  const [explica, setExplica] = useState('');
  const [executa, setExecuta] = useState('');
  const [revisar, setRevisar] = useState('');
  const [concluindo, setConcluindo] = useState(false);
  const [erroConclusao, setErroConclusao] = useState<string | null>(null);

  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  const startedAtMsRef = useRef(Date.now());
  const eventQueueRef = useRef<EventoSessaoPayload[]>([]);

  const todosPassosConcluidos = estado.passosConcluidos.length >= missao.passos.length;
  const missaoProntaParaConcluir =
    missao.id === 'M00' ? todosPassosConcluidos : estado.postExibido && todosPassosConcluidos;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeg((prev) => (missaoProntaParaConcluir ? prev : prev + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [missaoProntaParaConcluir]);

  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0) {
      return;
    }
    const lote = eventQueueRef.current.splice(0, eventQueueRef.current.length);
    try {
      await enviarEventosLote(sessaoId, lote);
    } catch {
      // Reenfileira em caso de falha momentânea na rede local sem travar o aluno
      eventQueueRef.current.unshift(...lote);
    }
  }, [sessaoId]);

  // Envio periódico em lote a cada 5 segundos (ADR-10)
  useEffect(() => {
    const interval = window.setInterval(() => {
      void flushEvents();
    }, 5000);
    return () => {
      window.clearInterval(interval);
    };
  }, [flushEvents]);

  const enqueueActionEvent = useCallback((acao: AcaoBancada, resultado: ResultadoRegra) => {
    const instanteMs = Math.max(0, Date.now() - startedAtMsRef.current);
    if (!resultado.permitido) {
      const tipoErro = resultado.tipoErro ? `erro_${resultado.tipoErro}` : 'erro_montagem';
      eventQueueRef.current.push({
        instanteMs,
        tipo: tipoErro,
        regra: resultado.regraId,
        detalhe: { acao: acao.tipo, mensagem: resultado.mensagem },
      });
      return;
    }

    const mapaTipo: Record<AcaoBancada['tipo'], string> = {
      vestir_esd: 'esd_pulseira_colocada',
      retirar_esd: 'esd_pulseira_retirada',
      encaixar: 'peca_encaixada',
      retirar: 'peca_retirada',
      aplicar_pasta: 'pasta_aplicada',
      instalar_espacadores: 'espacadores_instalados',
      conectar_cabo: 'cabo_conectado',
      alternar_fonte: 'fonte_alternada',
      jump_power: 'jump_power_post',
      inspecionar: 'inspecao_peca',
      usar_dica: 'dica_usada',
    };

    eventQueueRef.current.push({
      instanteMs,
      tipo: mapaTipo[acao.tipo],
      detalhe: acao,
    });
  }, []);

  const aplicarAcao = useCallback(
    (acao: AcaoBancada): ResultadoRegra => {
      const { novoEstado, resultado } = executarAcaoBancada(
        acao,
        estadoRef.current,
        catalogo,
        regras,
        missao,
      );
      estadoRef.current = novoEstado;
      setEstado(novoEstado);
      setUltimoResultado(resultado);
      enqueueActionEvent(acao, resultado);

      if (!resultado.permitido) {
        setLegendaAudio(emitAudioCue('erro', audioMuted));
      } else if (resultado.postExibido) {
        setLegendaAudio(emitAudioCue('post_ok', audioMuted));
      } else if (
        acao.tipo === 'encaixar' ||
        acao.tipo === 'conectar_cabo' ||
        acao.tipo === 'vestir_esd' ||
        acao.tipo === 'aplicar_pasta' ||
        acao.tipo === 'inspecionar'
      ) {
        setLegendaAudio(emitAudioCue('encaixe', audioMuted));
      }

      if (resultado.permitido) {
        setSelectedPecaId(null);
        setActiveSnapPoint(null);
      }

      return resultado;
    },
    [catalogo, regras, missao, enqueueActionEvent, audioMuted],
  );

  const reiniciarBancada = useCallback(() => {
    setEstado(criarEstadoInicial(missao, modo));
    setSelectedPecaId(null);
    setSelectedInstalledPonto(null);
    setActiveSnapPoint(null);
    setUltimoResultado(null);
    setLegendaAudio(null);
    setDicaAtual(null);
    setElapsedSeg(0);
    startedAtMsRef.current = Date.now();
  }, [missao, modo]);

  const handleSnapAttempt = useCallback(
    (pecaId: string, ponto: string): ResultadoRegra => {
      const peca = catalogo[pecaId];
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
      if (
        peca.tipo === 'placa_mae' &&
        estadoRef.current.instaladas['ponto_placa_mae'] === pecaId &&
        missao.passos.some(
          (p) => p.acaoEsperada.tipo === 'inspecionar' && p.acaoEsperada.peca === pecaId,
        )
      ) {
        return aplicarAcao({ tipo: 'inspecionar', pecaId, ponto: 'ponto_placa_mae' });
      }
      return aplicarAcao({ tipo: 'encaixar', pecaId, ponto });
    },
    [aplicarAcao, catalogo, missao.passos],
  );

  const handleSelectTrayPart = (pecaId: string) => {
    setSelectedInstalledPonto(null);

    // Em M00, selecionar a placa-mãe já posicionada sobre a bancada permite inspecionar diretamente
    const precisaInspecionar = missao.passos.some(
      (p) =>
        p.acaoEsperada.tipo === 'inspecionar' &&
        p.acaoEsperada.peca === pecaId &&
        !estadoRef.current.passosConcluidos.includes(p.id),
    );
    if (precisaInspecionar && estadoRef.current.instaladas['ponto_placa_mae'] === pecaId) {
      aplicarAcao({ tipo: 'inspecionar', pecaId, ponto: 'ponto_placa_mae' });
      return;
    }

    setSelectedPecaId(pecaId);
    const peca = catalogo[pecaId];
    const primeiroPonto = peca?.pontosDeEncaixe[0] ?? PONTOS_SELECIONAVEIS[0] ?? null;
    setActiveSnapPoint(primeiroPonto);
  };

  const handleSelectInstalled = useCallback(
    (ponto: string, pecaId: string) => {
      setSelectedPecaId(null);

      // Se a missão tem passo de inspeção pendente para essa peça (ex.: M00 Passo 2), executa inspeção ao clicar em 3D
      const passoInspecaoPendente = missao.passos.find(
        (p) =>
          p.acaoEsperada.tipo === 'inspecionar' &&
          p.acaoEsperada.peca === pecaId &&
          !estadoRef.current.passosConcluidos.includes(p.id),
      );
      if (passoInspecaoPendente) {
        aplicarAcao({ tipo: 'inspecionar', pecaId, ponto });
        return;
      }

      setSelectedInstalledPonto(ponto);
      const peca = catalogo[pecaId];
      if (peca) {
        setUltimoResultado({
          permitido: true,
          mensagem: `Selecionado: ${peca.nome} (${ponto}). Pressione Delete para retirar se necessário.`,
        });
      }
    },
    [missao.passos, aplicarAcao, catalogo],
  );

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
    () => calcularPontuacao(estado, elapsedSeg, missao.tempoReferenciaSeg, regras),
    [estado, elapsedSeg, missao.tempoReferenciaSeg, regras],
  );

  useEffect(() => {
    registerTestModeBridge({
      enabled: true,
      getState: () => ({
        missaoId: missao.id,
        sessaoId,
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
      resetMission: () => reiniciarBancada(),
    });

    return () => registerTestModeBridge(null);
  }, [
    missao.id,
    sessaoId,
    pontuacao,
    ultimoResultado,
    benchmark,
    glbStatus,
    aplicarAcao,
    handleSnapAttempt,
    reiniciarBancada,
  ]);

  const pecasDisponiveis = useMemo(
    () =>
      missao.pecasDisponiveis
        .map((id) => catalogo[id])
        .filter((p): p is PecaCatalogo => Boolean(p)),
    [missao.pecasDisponiveis, catalogo],
  );

  const pecaSelecionada = selectedPecaId ? catalogo[selectedPecaId] : undefined;

  const proximoPasso = useMemo(
    () => missao.passos.find((p) => !estado.passosConcluidos.includes(p.id)) ?? null,
    [missao.passos, estado.passosConcluidos],
  );

  const cartaoAtivo: CartaoPedagogicoItem | null = useMemo(() => {
    const passoAlvoId = proximoPasso?.id;
    return (
      missao.cartoes.find(
        (c) =>
          c.gatilhoPassoId &&
          (c.gatilhoPassoId === passoAlvoId ||
            estado.passosConcluidos.includes(c.gatilhoPassoId)) &&
          !cartoesDispensados.includes(`${c.tipo}-${c.titulo}`),
      ) ?? null
    );
  }, [missao.cartoes, proximoPasso, estado.passosConcluidos, cartoesDispensados]);

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
    if (pecaSelecionada.tipo === 'placa_mae') {
      return ['ponto_placa_mae'];
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

  const handleConcluirSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConcluindo(true);
    setErroConclusao(null);

    try {
      await flushEvents();
      const relatorio = await concluirSessao(sessaoId, {
        tempoSeg: elapsedSeg,
        dicasUsadas: estado.dicasUsadas,
        violacoesEsd: estado.violacoesEsd,
        errosOrdem: estado.errosOrdem,
        pecasRecusadasCompatibilidade: estado.pecasRecusadasCompatibilidade,
        postExibido: estado.postExibido || missao.id === 'M00',
        autoavaliacao: {
          explica:
            explica.trim() ||
            'Consigo explicar a sequência de segurança e compatibilidade desta bancada.',
          executa: executa.trim() || 'Executei os procedimentos da ordem de serviço no simulador.',
          revisar: revisar.trim() || 'Revisar pontos de maior atenção para a próxima prática.',
        },
      });
      onSessionCompleted(relatorio);
    } catch (err) {
      setErroConclusao(
        err instanceof ApiError
          ? err.message
          : 'Erro ao finalizar sessão e gravar o relatório. Tente novamente.',
      );
    } finally {
      setConcluindo(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Barra superior (Documento 9, Seção 4) */}
      <header className="z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-900 px-5 py-2.5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onExitToTrail}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-medium text-slate-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Trilha</span>
          </button>

          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-sky-400" aria-hidden="true" />
            <span className="text-base font-bold tracking-tight text-white">VIRTUHAR3D</span>
          </div>

          <div className="hidden items-center gap-2 text-sm text-slate-300 xl:flex">
            <span className="font-semibold text-slate-100">{missao.id}</span>
            <span aria-hidden="true">·</span>
            <span className="max-w-xs truncate text-slate-200">{missao.titulo}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">
              {modo === 'guiado' ? 'Modo Guiado' : 'Prática Livre'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Estado ESD (nunca só cor: ícone + texto explícito) */}
          <button
            type="button"
            onClick={() => aplicarAcao({ tipo: estado.esdColocada ? 'retirar_esd' : 'vestir_esd' })}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              estado.esdColocada
                ? 'border-emerald-600 bg-emerald-950 text-emerald-100 hover:bg-emerald-900'
                : 'border-amber-500 bg-amber-950 text-amber-100 hover:bg-amber-900'
            }`}
          >
            {estado.esdColocada ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-amber-400" aria-hidden="true" />
            )}
            <span>{estado.esdColocada ? 'ESD: Conectada' : 'ESD: Desconectada'}</span>
          </button>

          {/* Chave da fonte ATX (presente quando há fonte na missão) */}
          {missao.pecasDisponiveis.includes('fonte-500w') && (
            <button
              type="button"
              disabled={!estado.instaladas['ponto_fonte']}
              onClick={() => aplicarAcao({ tipo: 'alternar_fonte', ligada: !estado.fonteLigada })}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-45 ${
                estado.fonteLigada
                  ? 'border-emerald-600 bg-emerald-950 text-emerald-100 hover:bg-emerald-900'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Power className="h-4 w-4" aria-hidden="true" />
              <span>Fonte: {estado.fonteLigada ? 'Ligada (I)' : 'Desligada (0)'}</span>
            </button>
          )}

          {/* Dica (Modo Guiado) */}
          {modo === 'guiado' && (
            <button
              type="button"
              onClick={pedirDica}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-semibold text-slate-100 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <HelpCircle className="h-4 w-4 text-sky-400" aria-hidden="true" />
              <span>Dica (-2 pts)</span>
            </button>
          )}

          {/* Alternar som mantendo legendas visuais sempre ativas */}
          <button
            type="button"
            onClick={() => setAudioMuted((m) => !m)}
            aria-label={audioMuted ? 'Mudo: ativar bipes sonoros' : 'Som: silenciar bipes sonoros'}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-medium text-slate-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {audioMuted ? (
              <VolumeX className="h-4 w-4 text-slate-400" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4 text-sky-400" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{audioMuted ? 'Mudo' : 'Som'}</span>
          </button>

          {/* Monitor leve FPS / Triângulos */}
          <div
            role="status"
            aria-label="Desempenho da cena 3D"
            className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm tabular-nums text-slate-200 lg:flex"
          >
            <Gauge
              className={`h-4 w-4 ${
                benchmark && !benchmark.meetsFpsTarget ? 'text-amber-400' : 'text-emerald-400'
              }`}
              aria-hidden="true"
            />
            <span>{benchmark ? `${benchmark.fps} FPS` : '-- FPS'}</span>
          </div>

          <button
            type="button"
            onClick={reiniciarBancada}
            aria-label="Reiniciar bancada"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-medium text-slate-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">Reiniciar</span>
          </button>

          {missaoProntaParaConcluir && (
            <button
              type="button"
              onClick={() => setModalAutoavaliacao(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>Concluir Missão</span>
            </button>
          )}
        </div>
      </header>

      {/* Área principal em 3 colunas (Documento 9, Seção 4) */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_1fr_340px]">
        {/* Coluna esquerda: Bandeja de peças e ferramentas */}
        <aside
          aria-label="Peças e ferramentas disponíveis"
          className="flex flex-col border-r border-slate-800 bg-slate-900"
        >
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Peças e Ferramentas</h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Use o mouse ou Tab + Enter para selecionar.
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
                    className={`min-h-[44px] w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                      isSelected
                        ? 'border-sky-400 bg-sky-950 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{peca.nome}</span>
                      {isInstalled && (
                        <CheckCircle2
                          role="img"
                          className="h-4 w-4 shrink-0 text-emerald-400"
                          aria-label="Instalada"
                        />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                      <span className="capitalize">{peca.tipo.replace('_', ' ')}</span>
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

        {/* Centro: Cena 3D + Controles HTML acessíveis sobre o canvas */}
        <main className="relative min-h-[380px] flex-1 bg-slate-950">
          <BancadaScene
            estado={estado}
            catalogo={catalogo}
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

          {/* Rótulo da peça sob o cursor (US-03) */}
          {hoveredLabel && (
            <div
              role="status"
              className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-slate-700 bg-slate-900/95 px-3.5 py-2 text-sm font-medium text-white"
            >
              {hoveredLabel}
            </div>
          )}

          {/* Banner de conclusão disponível */}
          {missaoProntaParaConcluir && !modalAutoavaliacao && (
            <div className="absolute right-4 top-4 z-10 flex items-center gap-3 rounded-xl border border-emerald-700 bg-slate-900/95 px-4 py-3 text-sm text-emerald-100">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
              <span>Todas as etapas concluídas!</span>
              <button
                type="button"
                onClick={() => setModalAutoavaliacao(true)}
                className="min-h-[40px] rounded-lg bg-emerald-700 px-3.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Gerar Relatório
              </button>
            </div>
          )}

          {/* Barra flutuante inferior do canvas para encaixe por teclado ou retirada */}
          {(pecaSelecionada || selectedInstalledPonto) && (
            <div className="absolute bottom-4 left-1/2 z-10 flex w-[min(700px,94%)] -translate-x-1/2 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3">
              {pecaSelecionada ? (
                <>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      Selecionada: {pecaSelecionada.nome}
                    </p>
                    <p className="text-sm text-slate-300">
                      Clique no anel 3D destacado ou confirme o ponto abaixo com Espaço:
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Selecionar ponto de encaixe"
                      value={activeSnapPoint ?? ''}
                      onChange={(e) => setActiveSnapPoint(e.target.value)}
                      className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
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
                      className="min-h-[44px] rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800"
                    >
                      Encaixar (Espaço)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPecaId(null);
                        setActiveSnapPoint(null);
                      }}
                      className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-800 px-3.5 text-sm text-slate-200 hover:bg-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-200">
                    Ponto selecionado:{' '}
                    <span className="font-mono text-sky-300">{selectedInstalledPonto}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteSelectedInstalled}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-red-700 bg-red-950 px-4 text-sm font-semibold text-red-100 hover:bg-red-900"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span>Retirar peça (Delete)</span>
                  </button>
                </>
              )}
            </div>
          )}
        </main>

        {/* Coluna direita: Ordem de Serviço, Cartões e Lista de Passos */}
        <aside
          aria-label="Ordem de serviço, passos e pontuação"
          className="flex flex-col border-l border-slate-800 bg-slate-900"
        >
          <div className="border-b border-slate-800 p-4">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span className="font-semibold text-white">Ordem de Serviço</span>
              <span className="font-mono tabular-nums">
                {estado.passosConcluidos.length}/{missao.passos.length} passos
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{missao.ordemServico?.relato ?? ''}</p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2.5 font-mono text-sm tabular-nums text-slate-200">
              <span>Prévia: {pontuacao.notaTotal}/100</span>
              <span>Tempo: {elapsedSeg}s</span>
            </div>
          </div>

          {dicaAtual && (
            <div
              role="note"
              className="mx-3 mt-3 rounded-lg border border-sky-700 bg-sky-950/70 p-3 text-sm text-sky-100"
            >
              <div className="flex items-center gap-2 font-semibold text-sky-300">
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Dica do Modo Guiado</span>
              </div>
              <p className="mt-1">{dicaAtual}</p>
            </div>
          )}

          {cartaoAtivo && (
            <div
              role="region"
              aria-label={`Cartão pedagógico: ${cartaoAtivo.titulo}`}
              className="mx-3 mt-3 rounded-lg border border-amber-700 bg-slate-950 p-3 text-sm text-slate-200"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-amber-300">{cartaoAtivo.titulo}</span>
                <button
                  type="button"
                  onClick={() =>
                    setCartoesDispensados((prev) => [
                      ...prev,
                      `${cartaoAtivo.tipo}-${cartaoAtivo.titulo}`,
                    ])
                  }
                  className="text-sm text-slate-400 hover:text-slate-100"
                >
                  Fechar
                </button>
              </div>
              <p className="mt-1 text-slate-300">{cartaoAtivo.conteudo}</p>
            </div>
          )}

          <ol className="flex-1 space-y-2 overflow-y-auto p-3">
            {missao.passos.map((passo, idx) => {
              const concluido = estado.passosConcluidos.includes(passo.id);
              const ehAtual = proximoPasso?.id === passo.id;
              return (
                <li
                  key={passo.id}
                  className={`rounded-lg border p-3 text-sm ${
                    concluido
                      ? 'border-emerald-800 bg-emerald-950/40 text-emerald-100'
                      : ehAtual
                        ? 'border-sky-500 bg-slate-950 text-white'
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

      {/* Barra inferior: Feedback imediato (< 1s) + Legenda visual obrigatória para bipes */}
      <footer
        role="status"
        aria-live="polite"
        className={`z-20 flex min-h-[56px] flex-wrap items-center justify-between gap-4 border-t px-5 py-2.5 text-sm ${
          ultimoResultado === null
            ? 'border-slate-800 bg-slate-900 text-slate-200'
            : ultimoResultado.permitido
              ? 'border-emerald-800 bg-emerald-950 text-emerald-100'
              : 'border-red-800 bg-red-950 text-red-100'
        }`}
      >
        <div className="flex items-start gap-2.5">
          {ultimoResultado === null ? (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
          ) : ultimoResultado.permitido ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          )}
          <div>
            <p className="font-medium">
              {ultimoResultado
                ? ultimoResultado.mensagem
                : 'Bancada pronta. Conecte a pulseira ESD antes de tocar nos componentes sensíveis.'}
            </p>
            {(ultimoResultado?.comoCorrigir || legendaAudio) && (
              <p className="mt-0.5 text-sm opacity-90">
                {ultimoResultado?.comoCorrigir
                  ? `Como corrigir: ${ultimoResultado.comoCorrigir}`
                  : ''}
                {ultimoResultado?.comoCorrigir && legendaAudio ? ' · ' : ''}
                {legendaAudio ?? ''}
              </p>
            )}
          </div>
        </div>

        <span className="font-mono text-sm tabular-nums text-slate-300">
          ESD: {estado.violacoesEsd} · Ordem: {estado.errosOrdem} · Compat:{' '}
          {estado.pecasRecusadasCompatibilidade.length}
        </span>
      </footer>

      {/* Modal de Autoavaliação e Conclusão da Missão (Doc 8, Seção 6) */}
      {modalAutoavaliacao && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-autoavaliacao"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-6"
        >
          <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-100">
            <h2 id="titulo-autoavaliacao" className="text-xl font-bold text-slate-50">
              Concluir Ordem de Serviço e Autoavaliação
            </h2>
            <p className="mt-1.5 text-sm text-slate-300">
              Registre sua autoavaliação antes de gerar o relatório oficial da sessão.
            </p>

            <form onSubmit={handleConcluirSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="auto-explica" className="block text-sm font-medium text-slate-200">
                  O que eu consigo explicar após esta prática?
                </label>
                <textarea
                  id="auto-explica"
                  rows={2}
                  value={explica}
                  onChange={(e) => setExplica(e.target.value)}
                  placeholder="Ex.: Por que precisamos da pulseira ESD e da pasta térmica..."
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label htmlFor="auto-executa" className="block text-sm font-medium text-slate-200">
                  O que eu consigo executar com segurança?
                </label>
                <textarea
                  id="auto-executa"
                  rows={2}
                  value={executa}
                  onChange={(e) => setExecuta(e.target.value)}
                  placeholder="Ex.: Montar CPU, cooler, memórias e fazer o jump nos pinos PWR_SW..."
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div>
                <label htmlFor="auto-revisar" className="block text-sm font-medium text-slate-200">
                  O que preciso revisar na próxima aula?
                </label>
                <textarea
                  id="auto-revisar"
                  rows={2}
                  value={revisar}
                  onChange={(e) => setRevisar(e.target.value)}
                  placeholder="Ex.: Conferir conectores da fonte antes de ligar..."
                  className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {erroConclusao && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950 p-3 text-sm text-red-100"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                  <span>{erroConclusao}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={concluindo}
                  onClick={() => setModalAutoavaliacao(false)}
                  className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm font-medium text-slate-200 hover:bg-slate-700"
                >
                  Voltar à bancada
                </button>
                <button
                  type="submit"
                  disabled={concluindo}
                  className="min-h-[44px] rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {concluindo ? 'Salvando relatório...' : 'Finalizar e ver relatório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
