export type TipoPeca =
  | 'cpu'
  | 'cooler'
  | 'ram'
  | 'placa_mae'
  | 'fonte'
  | 'gabinete'
  | 'armazenamento'
  | 'gpu'
  | 'cabo'
  | 'ferramenta'
  | 'bancada'
  | 'monitor';

export type TipoRam = 'DDR3' | 'DDR4' | 'DDR5';
export type FormatoPlacaMae = 'ATX' | 'Micro-ATX' | 'Mini-ITX';
export type ConectorFonte = 'ATX_24P' | 'EPS_4P' | 'EPS_8P' | 'PCIE_6P' | 'PCIE_8P' | 'SATA';
export type ModoMissao = 'guiado' | 'livre' | 'avaliacao';

export interface PecaBase {
  id: string;
  tipo: TipoPeca;
  nome: string;
  modelo3d: string;
  pontosDeEncaixe: string[];
  sensivelESD: boolean;
  consumoW: number;
  descricao: string;
  textoAlternativo: string;
}

export interface PecaCpu extends PecaBase {
  tipo: 'cpu';
  atributos: {
    soquete: string;
    frequenciaGhz?: number;
    nucleos?: number;
  };
}

export interface PecaCooler extends PecaBase {
  tipo: 'cooler';
  atributos: {
    soquetesCompativeis: string[];
    alturaMm: number;
    potenciaTermicaW: number;
    conector?: string;
  };
}

export interface PecaRam extends PecaBase {
  tipo: 'ram';
  atributos: {
    tipo: TipoRam;
    capacidadeGB: number;
    frequenciaMhz?: number;
  };
}

export interface PecaPlacaMae extends PecaBase {
  tipo: 'placa_mae';
  atributos: {
    soquete: string;
    formato: FormatoPlacaMae;
    tipoRam: TipoRam;
    slotsRam: number;
    slotsPcie: number;
    interfacesArmazenamento: Array<'SATA' | 'M.2'>;
    saidaVideo: boolean;
    conectoresEnergia: Array<'ATX_24P' | 'EPS_4P' | 'EPS_8P'>;
  };
}

export interface PecaFonte extends PecaBase {
  tipo: 'fonte';
  atributos: {
    potenciaW: number;
    conectores: ConectorFonte[];
  };
}

export interface PecaGabinete extends PecaBase {
  tipo: 'gabinete';
  atributos: {
    formatosAceitos: FormatoPlacaMae[];
    alturaMaxCoolerMm: number;
  };
}

export interface PecaArmazenamento extends PecaBase {
  tipo: 'armazenamento';
  atributos: {
    interface: 'SATA' | 'M.2';
    capacidadeGB?: number;
  };
}

export interface PecaGpu extends PecaBase {
  tipo: 'gpu';
  atributos: {
    exigeEnergiaPcie: boolean;
    conectorEnergiaPcie?: 'PCIE_6P' | 'PCIE_8P';
    slot: 'PCIe_x16';
  };
}

export interface PecaCabo extends PecaBase {
  tipo: 'cabo';
  atributos: {
    categoria: 'energia_atx24' | 'energia_eps' | 'energia_pcie' | 'video' | 'sata' | 'esd';
    interface: string;
  };
}

export interface PecaFerramenta extends PecaBase {
  tipo: 'ferramenta';
  atributos: {
    funcao: 'esd_protecao' | 'pasta_termica' | 'jump_power' | 'parafusar';
  };
}

export interface PecaInfra extends PecaBase {
  tipo: 'bancada' | 'monitor';
  atributos: {
    papel: string;
    entradasVideo?: string[];
  };
}

export type PecaCatalogo =
  | PecaCpu
  | PecaCooler
  | PecaRam
  | PecaPlacaMae
  | PecaFonte
  | PecaGabinete
  | PecaArmazenamento
  | PecaGpu
  | PecaCabo
  | PecaFerramenta
  | PecaInfra;

export interface RegrasParametros {
  fonte: {
    margemSegurancaPercentual: number;
  };
  esd: {
    pontuacaoMaxima: number;
    descontoPorViolacao: number;
    tiposSensiveis: Array<'cpu' | 'ram' | 'placa_mae' | 'gpu' | 'armazenamento'>;
  };
  ordem: {
    pontuacaoMaxima: number;
    descontoPorErro: number;
  };
  compatibilidade: {
    pontuacaoMaxima: number;
    descontoPorErro: number;
  };
  tempo: {
    pontuacaoMaxima: number;
    multiplicadorLimiteZero: number;
  };
  modoGuiado: {
    descontoPorDica: number;
    descontoMaximoDicas: number;
  };
  aprovacao: {
    notaMinima: number;
  };
  niveis: Array<{
    nome: string;
    pontosMinimos: number;
  }>;
}

export interface PassoMissaoDefinicao {
  id: string;
  descricao: string;
  preRequisitos: string[];
  acaoEsperada: {
    tipo:
      | 'vestir_esd'
      | 'encaixar'
      | 'aplicar_pasta'
      | 'conectar_cabo'
      | 'desligar_fonte'
      | 'ligar_fonte'
      | 'jump_power'
      | 'inspecionar';
    peca: string;
    em: string;
  };
  dica?: string;
}

export interface MissaoDefinicao {
  id: string;
  titulo: string;
  tempoReferenciaSeg: number;
  ordemServico?: {
    cliente: string;
    equipamento: string;
    relato: string;
  };
  estadoInicial: {
    esdColocada: boolean;
    fonteLigada: boolean;
    pecasInstaladas: Array<{ pecaId: string; ponto: string }>;
  };
  passos: PassoMissaoDefinicao[];
}

export interface EstadoBancada {
  esdColocada: boolean;
  esdRetiradaDurantePratica?: boolean;
  fonteLigada: boolean;
  pastaTermicaAplicada: boolean;
  espacadoresInstalados: boolean;
  instaladas: Record<string, string>;
  passosConcluidos: string[];
  violacoesEsd: number;
  errosOrdem: number;
  pecasRecusadasCompatibilidade: string[];
  dicasUsadas: number;
  modo: ModoMissao;
  postExibido: boolean;
}

export type TipoErroRegra = 'compatibilidade' | 'ordem' | 'esd' | 'energia' | 'montagem';

export interface ResultadoRegra {
  permitido: boolean;
  regraId?: string;
  tipoErro?: TipoErroRegra;
  mensagem: string;
  comoCorrigir?: string;
  postExibido?: boolean;
}

export type AcaoBancada =
  | { tipo: 'vestir_esd' }
  | { tipo: 'retirar_esd' }
  | { tipo: 'encaixar'; pecaId: string; ponto: string }
  | { tipo: 'retirar'; ponto: string }
  | { tipo: 'aplicar_pasta' }
  | { tipo: 'instalar_espacadores' }
  | { tipo: 'conectar_cabo'; pecaId: string; ponto: string }
  | { tipo: 'alternar_fonte'; ligada: boolean }
  | { tipo: 'jump_power' }
  | { tipo: 'inspecionar'; pecaId: string; ponto: string }
  | { tipo: 'usar_dica' };

export interface RelatorioPontuacao {
  notaTotal: number;
  notaEsd: number;
  notaOrdem: number;
  notaCompatibilidade: number;
  notaTempo: number;
  descontoDicas: number;
  aprovado: boolean;
  entraNoRanking: boolean;
}
