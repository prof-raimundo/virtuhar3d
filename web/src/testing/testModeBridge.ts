import type { EstadoBancada, RelatorioPontuacao, ResultadoRegra } from '@virtuhar3d/rules';
import type { BenchmarkMetrics, GlbPrototypeStatus } from '../three/BancadaScene.js';

export interface VirtuharTestBridge {
  enabled: boolean;
  getState: () => {
    missaoId: string;
    sessaoId?: string;
    estado: EstadoBancada;
    pontuacao: RelatorioPontuacao;
    ultimoResultado: ResultadoRegra | null;
    benchmark: BenchmarkMetrics | null;
    glbStatus: GlbPrototypeStatus | null;
  };
  equipEsd: () => ResultadoRegra;
  removeEsd: () => ResultadoRegra;
  snapPart: (pecaId: string, pontoId: string) => ResultadoRegra;
  inspectPart: (pecaId: string, pontoId: string) => ResultadoRegra;
  removePart: (pontoId: string) => ResultadoRegra;
  applyThermalPaste: () => ResultadoRegra;
  toggleFonte: (ligada: boolean) => ResultadoRegra;
  triggerJumpPower: () => ResultadoRegra;
  resetMission: () => void;
}

declare global {
  interface Window {
    __VIRTUHAR3D_TEST__?: VirtuharTestBridge;
  }
}

export function isTestModeEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_TEST_MODE !== 'false';
}

export function registerTestModeBridge(bridge: VirtuharTestBridge | null): void {
  if (!isTestModeEnabled() || !bridge) {
    delete window.__VIRTUHAR3D_TEST__;
    return;
  }
  window.__VIRTUHAR3D_TEST__ = bridge;
}
