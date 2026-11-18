import { describe, expect, it } from 'vitest';
import {
  calcularNivel,
  calcularPontuacao,
  criarEstadoInicial,
  executarAcaoBancada,
} from './engine.js';
import type { EstadoBancada, MissaoDefinicao, PecaCatalogo, RegrasParametros } from './types.js';

const regrasPadrao: RegrasParametros = {
  fonte: { margemSegurancaPercentual: 20 },
  esd: {
    pontuacaoMaxima: 20,
    descontoPorViolacao: 10,
    tiposSensiveis: ['cpu', 'ram', 'placa_mae', 'gpu', 'armazenamento'],
  },
  ordem: { pontuacaoMaxima: 30, descontoPorErro: 5 },
  compatibilidade: { pontuacaoMaxima: 30, descontoPorErro: 5 },
  tempo: { pontuacaoMaxima: 20, multiplicadorLimiteZero: 2 },
  modoGuiado: { descontoPorDica: 2, descontoMaximoDicas: 10 },
  aprovacao: { notaMinima: 60 },
  niveis: [
    { nome: 'Aprendiz', pontosMinimos: 0 },
    { nome: 'Montador', pontosMinimos: 200 },
    { nome: 'Técnico', pontosMinimos: 500 },
    { nome: 'Técnico Sênior', pontosMinimos: 1000 },
    { nome: 'Mestre', pontosMinimos: 1800 },
  ],
};

const catalogoFixture: Record<string, PecaCatalogo> = {
  'placa-mae-lga1151': {
    id: 'placa-mae-lga1151',
    tipo: 'placa_mae',
    nome: 'Placa-Mãe ATX LGA1151 DDR4',
    modelo3d: 'modelos/placa_mae/placa-mae-lga1151.glb',
    pontosDeEncaixe: [
      'ponto_soquete',
      'ponto_ram1',
      'ponto_ram2',
      'ponto_pcie1',
      'ponto_24pinos',
      'ponto_eps',
      'ponto_hdmi_placa',
      'ponto_sata1',
    ],
    sensivelESD: true,
    consumoW: 35,
    descricao: 'Placa-mãe ATX',
    textoAlternativo: 'Placa-mãe escura ATX',
    atributos: {
      soquete: 'LGA1151',
      formato: 'ATX',
      tipoRam: 'DDR4',
      slotsRam: 2,
      slotsPcie: 1,
      interfacesArmazenamento: ['SATA'],
      saidaVideo: true,
      conectoresEnergia: ['ATX_24P', 'EPS_8P'],
    },
  },
  'gabinete-mini-itx': {
    id: 'gabinete-mini-itx',
    tipo: 'gabinete',
    nome: 'Gabinete Mini-ITX Compacto',
    modelo3d: 'modelos/gabinete/mini-itx.glb',
    pontosDeEncaixe: ['ponto_placa_mae'],
    sensivelESD: false,
    consumoW: 0,
    descricao: 'Gabinete pequeno',
    textoAlternativo: 'Gabinete Mini-ITX',
    atributos: {
      formatosAceitos: ['Mini-ITX'],
      alturaMaxCoolerMm: 65,
    },
  },
  'gabinete-atx': {
    id: 'gabinete-atx',
    tipo: 'gabinete',
    nome: 'Gabinete Torre ATX',
    modelo3d: 'modelos/gabinete/atx.glb',
    pontosDeEncaixe: ['ponto_placa_mae'],
    sensivelESD: false,
    consumoW: 0,
    descricao: 'Gabinete ATX',
    textoAlternativo: 'Gabinete ATX padrão',
    atributos: {
      formatosAceitos: ['ATX', 'Micro-ATX', 'Mini-ITX'],
      alturaMaxCoolerMm: 160,
    },
  },
  'cpu-lga1151': {
    id: 'cpu-lga1151',
    tipo: 'cpu',
    nome: 'Core i3 LGA1151',
    modelo3d: 'modelos/cpu/i3.glb',
    pontosDeEncaixe: ['ponto_soquete'],
    sensivelESD: true,
    consumoW: 65,
    descricao: 'CPU LGA1151',
    textoAlternativo: 'Processador LGA1151',
    atributos: { soquete: 'LGA1151' },
  },
  'cpu-am4': {
    id: 'cpu-am4',
    tipo: 'cpu',
    nome: 'Ryzen 5 AM4',
    modelo3d: 'modelos/cpu/ryzen.glb',
    pontosDeEncaixe: ['ponto_soquete'],
    sensivelESD: true,
    consumoW: 65,
    descricao: 'CPU AM4',
    textoAlternativo: 'Processador AM4',
    atributos: { soquete: 'AM4' },
  },
  'cooler-1151': {
    id: 'cooler-1151',
    tipo: 'cooler',
    nome: 'Cooler Torre 70mm',
    modelo3d: 'modelos/cooler/cooler.glb',
    pontosDeEncaixe: ['ponto_soquete'],
    sensivelESD: false,
    consumoW: 5,
    descricao: 'Cooler LGA1151',
    textoAlternativo: 'Cooler com dissipador',
    atributos: { soquetesCompativeis: ['LGA1151'], alturaMm: 70, potenciaTermicaW: 95 },
  },
  'cooler-am4': {
    id: 'cooler-am4',
    tipo: 'cooler',
    nome: 'Cooler AM4',
    modelo3d: 'modelos/cooler/cooler-am4.glb',
    pontosDeEncaixe: ['ponto_soquete'],
    sensivelESD: false,
    consumoW: 5,
    descricao: 'Cooler apenas AM4',
    textoAlternativo: 'Cooler AM4',
    atributos: { soquetesCompativeis: ['AM4'], alturaMm: 60, potenciaTermicaW: 95 },
  },
  'ram-ddr4': {
    id: 'ram-ddr4',
    tipo: 'ram',
    nome: 'RAM DDR4 8GB',
    modelo3d: 'modelos/ram/ddr4.glb',
    pontosDeEncaixe: ['ponto_ram1', 'ponto_ram2'],
    sensivelESD: true,
    consumoW: 4,
    descricao: 'DDR4',
    textoAlternativo: 'Módulo DDR4',
    atributos: { tipo: 'DDR4', capacidadeGB: 8 },
  },
  'ram-ddr3': {
    id: 'ram-ddr3',
    tipo: 'ram',
    nome: 'RAM DDR3 4GB',
    modelo3d: 'modelos/ram/ddr3.glb',
    pontosDeEncaixe: ['ponto_ram1', 'ponto_ram2'],
    sensivelESD: true,
    consumoW: 5,
    descricao: 'DDR3',
    textoAlternativo: 'Módulo DDR3',
    atributos: { tipo: 'DDR3', capacidadeGB: 4 },
  },
  'ssd-nvme': {
    id: 'ssd-nvme',
    tipo: 'armazenamento',
    nome: 'SSD M.2 NVMe',
    modelo3d: 'modelos/armazenamento/m2.glb',
    pontosDeEncaixe: ['ponto_m2'],
    sensivelESD: true,
    consumoW: 5,
    descricao: 'SSD M.2',
    textoAlternativo: 'SSD M.2 compacto',
    atributos: { interface: 'M.2' },
  },
  'ssd-sata': {
    id: 'ssd-sata',
    tipo: 'armazenamento',
    nome: 'SSD SATA 2.5',
    modelo3d: 'modelos/armazenamento/sata.glb',
    pontosDeEncaixe: ['ponto_sata1'],
    sensivelESD: true,
    consumoW: 4,
    descricao: 'SSD SATA',
    textoAlternativo: 'SSD SATA',
    atributos: { interface: 'SATA' },
  },
  'gpu-dedicada': {
    id: 'gpu-dedicada',
    tipo: 'gpu',
    nome: 'GPU PCIe x16 150W',
    modelo3d: 'modelos/gpu/gpu.glb',
    pontosDeEncaixe: ['ponto_pcie1'],
    sensivelESD: true,
    consumoW: 150,
    descricao: 'Placa de vídeo dedicada',
    textoAlternativo: 'Placa de vídeo PCIe',
    atributos: { exigeEnergiaPcie: true, conectorEnergiaPcie: 'PCIE_6P', slot: 'PCIe_x16' },
  },
  'fonte-500w': {
    id: 'fonte-500w',
    tipo: 'fonte',
    nome: 'Fonte 500W',
    modelo3d: 'modelos/fonte/500w.glb',
    pontosDeEncaixe: ['ponto_fonte'],
    sensivelESD: false,
    consumoW: 0,
    descricao: 'Fonte 500W completa',
    textoAlternativo: 'Fonte 500W',
    atributos: { potenciaW: 500, conectores: ['ATX_24P', 'EPS_8P', 'PCIE_6P', 'SATA'] },
  },
  'fonte-fraca-120w': {
    id: 'fonte-fraca-120w',
    tipo: 'fonte',
    nome: 'Fonte 120W sem EPS',
    modelo3d: 'modelos/fonte/120w.glb',
    pontosDeEncaixe: ['ponto_fonte'],
    sensivelESD: false,
    consumoW: 0,
    descricao: 'Fonte fraca',
    textoAlternativo: 'Fonte 120W básica',
    atributos: { potenciaW: 120, conectores: ['ATX_24P'] },
  },
  'fonte-sem-eps-300w': {
    id: 'fonte-sem-eps-300w',
    tipo: 'fonte',
    nome: 'Fonte 300W sem EPS',
    modelo3d: 'modelos/fonte/300w.glb',
    pontosDeEncaixe: ['ponto_fonte'],
    sensivelESD: false,
    consumoW: 0,
    descricao: 'Fonte sem conector EPS',
    textoAlternativo: 'Fonte 300W sem EPS',
    atributos: { potenciaW: 300, conectores: ['ATX_24P'] },
  },
  'cabo-24p': {
    id: 'cabo-24p',
    tipo: 'cabo',
    nome: 'Cabo ATX 24 pinos',
    modelo3d: 'modelos/cabos/24p.glb',
    pontosDeEncaixe: ['ponto_24pinos'],
    sensivelESD: false,
    consumoW: 0,
    descricao: 'Cabo 24p',
    textoAlternativo: 'Cabo 24 pinos',
    atributos: { categoria: 'energia_atx24', interface: 'ATX_24P' },
  },
  'cabo-eps': {
    id: 'cabo-eps',
    tipo: 'cabo',
    nome: 'Cabo EPS 8 pinos',
    modelo3d: 'modelos/cabos/eps.glb',
    pontosDeEncaixe: ['ponto_eps'],
    sensivelESD: false,
    consumoW: 0,
    descricao: 'Cabo EPS',
    textoAlternativo: 'Cabo EPS 8 pinos',
    atributos: { categoria: 'energia_eps', interface: 'EPS_8P' },
  },
  'cabo-hdmi': {
    id: 'cabo-hdmi',
    tipo: 'cabo',
    nome: 'Cabo HDMI',
    modelo3d: 'modelos/cabos/hdmi.glb',
    pontosDeEncaixe: ['ponto_hdmi_placa'],
    sensivelESD: false,
    consumoW: 0,
    descricao: 'Cabo HDMI',
    textoAlternativo: 'Cabo de vídeo HDMI',
    atributos: { categoria: 'video', interface: 'HDMI' },
  },
};

const missaoBancadaFixture: MissaoDefinicao = {
  id: 'M01',
  titulo: 'Teste de bancada',
  tempoReferenciaSeg: 900,
  estadoInicial: {
    esdColocada: false,
    fonteLigada: false,
    pecasInstaladas: [{ pecaId: 'placa-mae-lga1151', ponto: 'ponto_placa_mae' }],
  },
  passos: [
    {
      id: 'vestir-esd',
      descricao: 'Vestir pulseira ESD',
      preRequisitos: [],
      acaoEsperada: { tipo: 'vestir_esd', peca: 'pulseira-esd', em: 'ponto_aterramento' },
    },
    {
      id: 'instalar-cpu',
      descricao: 'Instalar CPU',
      preRequisitos: ['vestir-esd'],
      acaoEsperada: { tipo: 'encaixar', peca: 'cpu-lga1151', em: 'ponto_soquete' },
    },
    {
      id: 'aplicar-pasta',
      descricao: 'Aplicar pasta térmica',
      preRequisitos: ['instalar-cpu'],
      acaoEsperada: { tipo: 'aplicar_pasta', peca: 'pasta-termica', em: 'ponto_soquete' },
    },
    {
      id: 'instalar-cooler',
      descricao: 'Instalar cooler',
      preRequisitos: ['instalar-cpu', 'aplicar-pasta'],
      acaoEsperada: { tipo: 'encaixar', peca: 'cooler-1151', em: 'ponto_soquete' },
    },
  ],
};

function estadoBaseComEsd(): EstadoBancada {
  const estado = criarEstadoInicial(missaoBancadaFixture, 'avaliacao');
  return executarAcaoBancada({ tipo: 'vestir_esd' }, estado, catalogoFixture, regrasPadrao)
    .novoEstado;
}

describe('Motor de Regras — Protocolo ESD (RN-11 a RN-13)', () => {
  it('RN-11: impede encaixar peça sensível (CPU/RAM) sem pulseira ESD colocada', () => {
    const estado = criarEstadoInicial(missaoBancadaFixture, 'avaliacao');
    const res = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cpu-lga1151', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(res.resultado.permitido).toBe(false);
    expect(res.resultado.regraId).toBe('RN-11');
    expect(res.resultado.tipoErro).toBe('esd');
    expect(res.novoEstado.violacoesEsd).toBe(1);
  });

  it('RN-12 e RN-13: retirar pulseira durante a prática e tocar peça sensível registra violação e desconta na nota', () => {
    let estado = estadoBaseComEsd();
    estado = executarAcaoBancada(
      { tipo: 'retirar_esd' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    const res = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'ram-ddr4', ponto: 'ponto_ram1' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(res.resultado.permitido).toBe(false);
    expect(res.resultado.regraId).toBe('RN-12');
    expect(res.novoEstado.violacoesEsd).toBe(1);

    const nota = calcularPontuacao(res.novoEstado, 300, 900, regrasPadrao);
    expect(nota.notaEsd).toBe(10);
  });
});

describe('Motor de Regras — Compatibilidade (RN-01 a RN-09)', () => {
  it('RN-01: recusa CPU com soquete diferente da placa-mãe (AM4 em LGA1151)', () => {
    const estado = estadoBaseComEsd();
    const res = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cpu-am4', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(res.resultado.permitido).toBe(false);
    expect(res.resultado.regraId).toBe('RN-01');
    expect(res.resultado.tipoErro).toBe('compatibilidade');
    expect(res.novoEstado.pecasRecusadasCompatibilidade).toContain('cpu-am4');
  });

  it('RN-02: recusa RAM DDR3 em placa-mãe DDR4 e recusa slot já ocupado', () => {
    let estado = estadoBaseComEsd();
    const recusaTipo = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'ram-ddr3', ponto: 'ponto_ram1' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(recusaTipo.resultado.permitido).toBe(false);
    expect(recusaTipo.resultado.regraId).toBe('RN-02');

    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'ram-ddr4', ponto: 'ponto_ram1' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;

    const slotOcupado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'ram-ddr4', ponto: 'ponto_ram1' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(slotOcupado.resultado.permitido).toBe(false);
    expect(slotOcupado.resultado.regraId).toBe('RN-02');
  });

  it('RN-03: recusa placa-mãe ATX em gabinete que só aceita Mini-ITX', () => {
    let estado = estadoBaseComEsd();
    estado = {
      ...estado,
      espacadoresInstalados: true,
      instaladas: { ponto_gabinete: 'gabinete-mini-itx' },
    };
    const res = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'placa-mae-lga1151', ponto: 'ponto_placa_mae' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(res.resultado.permitido).toBe(false);
    expect(res.resultado.regraId).toBe('RN-03');
  });

  it('RN-04: recusa cooler incompatível com o soquete e cooler mais alto que o gabinete permite', () => {
    let estado = estadoBaseComEsd();
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cpu-lga1151', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'aplicar_pasta' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;

    const coolerErrado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cooler-am4', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(coolerErrado.resultado.permitido).toBe(false);
    expect(coolerErrado.resultado.regraId).toBe('RN-04');

    const estadoGabineteBaixo: EstadoBancada = {
      ...estado,
      instaladas: {
        ...estado.instaladas,
        ponto_gabinete: 'gabinete-mini-itx',
      },
    };
    const coolerAlto = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cooler-1151', ponto: 'ponto_soquete' },
      estadoGabineteBaixo,
      catalogoFixture,
      regrasPadrao,
    );
    expect(coolerAlto.resultado.permitido).toBe(false);
    expect(coolerAlto.resultado.regraId).toBe('RN-04');
  });

  it('RN-07: recusa armazenamento M.2 em placa-mãe que só possui SATA', () => {
    const estado = estadoBaseComEsd();
    const res = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'ssd-nvme', ponto: 'ponto_m2' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(res.resultado.permitido).toBe(false);
    expect(res.resultado.regraId).toBe('RN-07');
  });

  it('RN-08: recusa segunda GPU quando placa-mãe só possui 1 slot PCIe x16', () => {
    let estado = estadoBaseComEsd();
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'gpu-dedicada', ponto: 'ponto_pcie1' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    const res = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'gpu-dedicada', ponto: 'ponto_pcie2' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(res.resultado.permitido).toBe(false);
    expect(res.resultado.regraId).toBe('RN-08');
  });

  it('RN-09: recusa cabo conectado em ponto incompatível', () => {
    const estado = estadoBaseComEsd();
    const res = executarAcaoBancada(
      { tipo: 'conectar_cabo', pecaId: 'cabo-eps', ponto: 'ponto_24pinos' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(res.resultado.permitido).toBe(false);
    expect(res.resultado.regraId).toBe('RN-09');
  });
});

describe('Motor de Regras — Ordem de montagem, Energia e POST (RN-05, RN-06, RN-10)', () => {
  it('Ordem: recusa instalar cooler sem pasta térmica ou aplicar pasta sem CPU', () => {
    let estado = estadoBaseComEsd();
    const pastaSemCpu = executarAcaoBancada(
      { tipo: 'aplicar_pasta' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(pastaSemCpu.resultado.permitido).toBe(false);
    expect(pastaSemCpu.resultado.tipoErro).toBe('ordem');

    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cpu-lga1151', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;

    const coolerSemPasta = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cooler-1151', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(coolerSemPasta.resultado.permitido).toBe(false);
    expect(coolerSemPasta.resultado.tipoErro).toBe('ordem');
    expect(coolerSemPasta.novoEstado.errosOrdem).toBe(1);
  });

  it('Ordem: exige fonte desligada ao conectar cabos de energia e placa-mãe exige espaçadores no gabinete', () => {
    let estado = estadoBaseComEsd();
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'fonte-500w', ponto: 'ponto_fonte' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'alternar_fonte', ligada: true },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;

    const caboComFonteLigada = executarAcaoBancada(
      { tipo: 'conectar_cabo', pecaId: 'cabo-24p', ponto: 'ponto_24pinos' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(caboComFonteLigada.resultado.permitido).toBe(false);
    expect(caboComFonteLigada.resultado.tipoErro).toBe('ordem');

    const estadoSemEspacadores: EstadoBancada = {
      ...estadoBaseComEsd(),
      espacadoresInstalados: false,
      instaladas: { ponto_gabinete: 'gabinete-atx' },
    };
    const placaSemEspacador = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'placa-mae-lga1151', ponto: 'ponto_placa_mae' },
      estadoSemEspacadores,
      catalogoFixture,
      regrasPadrao,
    );
    expect(placaSemEspacador.resultado.permitido).toBe(false);
    expect(placaSemEspacador.resultado.tipoErro).toBe('ordem');
  });

  it('RN-05 e RN-06: recusa POST ao ligar se potência da fonte não tem +20% de margem ou falta conector EPS', () => {
    let estado = estadoBaseComEsd();
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cpu-lga1151', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'aplicar_pasta' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cooler-1151', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'ram-ddr4', ponto: 'ponto_ram1' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'conectar_cabo', pecaId: 'cabo-hdmi', ponto: 'ponto_hdmi_placa' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;

    // 1. Fonte fraca 120W: consumo = 35 + 65 + 5 + 4 = 109W; com +20% = 130.8W > 120W
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'fonte-fraca-120w', ponto: 'ponto_fonte' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'conectar_cabo', pecaId: 'cabo-24p', ponto: 'ponto_24pinos' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'conectar_cabo', pecaId: 'cabo-eps', ponto: 'ponto_eps' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'alternar_fonte', ligada: true },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;

    const falhaPotencia = executarAcaoBancada(
      { tipo: 'jump_power' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(falhaPotencia.resultado.permitido).toBe(false);
    expect(falhaPotencia.resultado.regraId).toBe('RN-05');

    // 2. Fonte 300W (potência ok), mas sem conector EPS_8P
    estado = executarAcaoBancada(
      { tipo: 'alternar_fonte', ligada: false },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'fonte-sem-eps-300w', ponto: 'ponto_fonte' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'alternar_fonte', ligada: true },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;

    const falhaConector = executarAcaoBancada(
      { tipo: 'jump_power' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(falhaConector.resultado.permitido).toBe(false);
    expect(falhaConector.resultado.regraId).toBe('RN-06');
  });

  it('RN-10: exibe POST com sucesso quando todo o conjunto mínimo está montado e ligado', () => {
    let estado = estadoBaseComEsd();
    const acoes = [
      { tipo: 'encaixar', pecaId: 'cpu-lga1151', ponto: 'ponto_soquete' },
      { tipo: 'aplicar_pasta' },
      { tipo: 'encaixar', pecaId: 'cooler-1151', ponto: 'ponto_soquete' },
      { tipo: 'encaixar', pecaId: 'ram-ddr4', ponto: 'ponto_ram1' },
      { tipo: 'encaixar', pecaId: 'ram-ddr4', ponto: 'ponto_ram2' },
      { tipo: 'encaixar', pecaId: 'fonte-500w', ponto: 'ponto_fonte' },
      { tipo: 'conectar_cabo', pecaId: 'cabo-hdmi', ponto: 'ponto_hdmi_placa' },
      { tipo: 'conectar_cabo', pecaId: 'cabo-24p', ponto: 'ponto_24pinos' },
      { tipo: 'conectar_cabo', pecaId: 'cabo-eps', ponto: 'ponto_eps' },
      { tipo: 'alternar_fonte', ligada: true },
      { tipo: 'jump_power' },
    ] as const;

    let ultimoResultado;
    for (const acao of acoes) {
      const res = executarAcaoBancada(acao, estado, catalogoFixture, regrasPadrao);
      estado = res.novoEstado;
      ultimoResultado = res.resultado;
      expect(res.resultado.permitido).toBe(true);
    }

    expect(ultimoResultado?.postExibido).toBe(true);
    expect(estado.postExibido).toBe(true);
  });
});

describe('Motor de Regras — Pontuação e Níveis (Doc 7 e Doc 8)', () => {
  it('calcula pontuação completa (100 pts) sem erros e dentro do tempo de referência', () => {
    const estado = estadoBaseComEsd();
    const rel = calcularPontuacao(estado, 450, 900, regrasPadrao);
    expect(rel.notaTotal).toBe(100);
    expect(rel.aprovado).toBe(true);
    expect(rel.entraNoRanking).toBe(true);
  });

  it('deduplica erro de compatibilidade repetido na mesma peça e aplica decaimento linear no tempo', () => {
    let estado = estadoBaseComEsd();
    // Tenta a mesma CPU incompatível duas vezes
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cpu-am4', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cpu-am4', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;

    expect(estado.pecasRecusadasCompatibilidade).toHaveLength(1);

    // Tempo = 1.5x referência (1350s de 900s) -> metade dos 20 pontos de tempo = 10
    const rel = calcularPontuacao(estado, 1350, 900, regrasPadrao);
    expect(rel.notaCompatibilidade).toBe(25);
    expect(rel.notaTempo).toBe(10);
    expect(rel.notaTotal).toBe(85);
  });

  it('desconta dicas no modo guiado (até 10 pts) e marca que não entra no ranking', () => {
    let estado = criarEstadoInicial(missaoBancadaFixture, 'guiado');
    for (let i = 0; i < 7; i++) {
      estado = executarAcaoBancada(
        { tipo: 'usar_dica' },
        estado,
        catalogoFixture,
        regrasPadrao,
      ).novoEstado;
    }
    const rel = calcularPontuacao(estado, 500, 900, regrasPadrao);
    expect(rel.descontoDicas).toBe(10);
    expect(rel.notaTotal).toBe(90);
    expect(rel.entraNoRanking).toBe(false);
  });

  it('classifica níveis corretamente pelas faixas do Documento 8', () => {
    expect(calcularNivel(0, regrasPadrao)).toBe('Aprendiz');
    expect(calcularNivel(200, regrasPadrao)).toBe('Montador');
    expect(calcularNivel(750, regrasPadrao)).toBe('Técnico');
    expect(calcularNivel(1200, regrasPadrao)).toBe('Técnico Sênior');
    expect(calcularNivel(1900, regrasPadrao)).toBe('Mestre');
  });

  it('permite retirar peça instalada, inspecionar com ESD e valida pré-requisitos de missão', () => {
    let estado = criarEstadoInicial(missaoBancadaFixture, 'guiado');
    // Tentar aplicar pasta sem concluir passo de instalar CPU na missão
    const foraDeOrdem = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cpu-lga1151', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
      missaoBancadaFixture,
    );
    expect(foraDeOrdem.resultado.permitido).toBe(false);

    estado = executarAcaoBancada(
      { tipo: 'vestir_esd' },
      estado,
      catalogoFixture,
      regrasPadrao,
      missaoBancadaFixture,
    ).novoEstado;

    const inspecao = executarAcaoBancada(
      { tipo: 'inspecionar', pecaId: 'placa-mae-lga1151', ponto: 'ponto_placa_mae' },
      estado,
      catalogoFixture,
      regrasPadrao,
      missaoBancadaFixture,
    );
    expect(inspecao.resultado.permitido).toBe(true);

    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'ram-ddr4', ponto: 'ponto_ram1' },
      inspecao.novoEstado,
      catalogoFixture,
      regrasPadrao,
      missaoBancadaFixture,
    ).novoEstado;
    expect(estado.instaladas['ponto_ram1']).toBe('ram-ddr4');

    const retirada = executarAcaoBancada(
      { tipo: 'retirar', ponto: 'ponto_ram1' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(retirada.resultado.permitido).toBe(true);
    expect(retirada.novoEstado.instaladas['ponto_ram1']).toBeUndefined();

    const retirarVazio = executarAcaoBancada(
      { tipo: 'retirar', ponto: 'ponto_ram1' },
      retirada.novoEstado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(retirarVazio.resultado.permitido).toBe(false);
  });

  it('cobre casos de borda de catálogo ausente, ordem de cooler/espaçadores, slots cheios e pré-requisitos de missão', () => {
    const estadoInicial = criarEstadoInicial(missaoBancadaFixture, 'avaliacao');

    // Peça inexistente em encaixar / inspecionar / conectar_cabo
    expect(
      executarAcaoBancada(
        { tipo: 'encaixar', pecaId: 'nao-existe', ponto: 'ponto_soquete' },
        estadoInicial,
        catalogoFixture,
        regrasPadrao,
      ).resultado.permitido,
    ).toBe(false);

    expect(
      executarAcaoBancada(
        { tipo: 'inspecionar', pecaId: 'nao-existe', ponto: 'ponto_soquete' },
        estadoInicial,
        catalogoFixture,
        regrasPadrao,
      ).resultado.permitido,
    ).toBe(false);

    expect(
      executarAcaoBancada(
        { tipo: 'conectar_cabo', pecaId: 'ram-ddr4', ponto: 'ponto_24pinos' },
        estadoInicial,
        catalogoFixture,
        regrasPadrao,
      ).resultado.permitido,
    ).toBe(false);

    // Inspecionar peça sensível sem pulseira falha ESD
    expect(
      executarAcaoBancada(
        { tipo: 'inspecionar', pecaId: 'cpu-lga1151', ponto: 'ponto_soquete' },
        estadoInicial,
        catalogoFixture,
        regrasPadrao,
      ).resultado.regraId,
    ).toBe('RN-11');

    // Instalar espaçadores funciona e libera passo seguinte
    const comEspacadores = executarAcaoBancada(
      { tipo: 'instalar_espacadores' },
      estadoBaseComEsd(),
      catalogoFixture,
      regrasPadrao,
    );
    expect(comEspacadores.resultado.permitido).toBe(true);
    expect(comEspacadores.novoEstado.espacadoresInstalados).toBe(true);

    // Cooler antes da CPU retorna ORDEM-COOLER-CPU
    const coolerSemCpu = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cooler-1151', ponto: 'ponto_soquete' },
      comEspacadores.novoEstado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(coolerSemCpu.resultado.regraId).toBe('ORDEM-COOLER-CPU');

    // Peça em ponto errado retorna RN-09
    const pontoInvalido = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cpu-lga1151', ponto: 'ponto_ram1' },
      comEspacadores.novoEstado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(pontoInvalido.resultado.regraId).toBe('RN-09');

    // 2º pente de RAM em placa-mãe que só possui 1 slot RAM retorna RN-02
    const placa1Slot: PecaCatalogo = {
      ...(catalogoFixture['placa-mae-lga1151'] as Extract<PecaCatalogo, { tipo: 'placa_mae' }>),
      atributos: {
        ...(catalogoFixture['placa-mae-lga1151'] as Extract<PecaCatalogo, { tipo: 'placa_mae' }>)
          .atributos,
        slotsRam: 1,
      },
    };
    const catalogo1Slot: Record<string, PecaCatalogo> = {
      ...catalogoFixture,
      'placa-mae-lga1151': placa1Slot,
    };
    const estado1Ram = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'ram-ddr4', ponto: 'ponto_ram1' },
      comEspacadores.novoEstado,
      catalogo1Slot,
      regrasPadrao,
    ).novoEstado;
    const ramSemSlot = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'ram-ddr4', ponto: 'ponto_ram2' },
      estado1Ram,
      catalogo1Slot,
      regrasPadrao,
    );
    expect(ramSemSlot.resultado.regraId).toBe('RN-02');

    // Pré-requisitos em missão com conectar_cabo e jump_power
    const missaoComCabos: MissaoDefinicao = {
      ...missaoBancadaFixture,
      passos: [
        ...missaoBancadaFixture.passos,
        {
          id: 'cabo-24',
          descricao: 'Conectar 24 pinos',
          preRequisitos: ['instalar-cooler'],
          acaoEsperada: { tipo: 'conectar_cabo', peca: 'cabo-24p', em: 'ponto_24pinos' },
        },
        {
          id: 'jump',
          descricao: 'Executar jump',
          preRequisitos: ['cabo-24'],
          acaoEsperada: { tipo: 'jump_power', peca: 'painel', em: 'ponto_pwr_sw' },
        },
      ],
    };

    const caboAntes = executarAcaoBancada(
      { tipo: 'conectar_cabo', pecaId: 'cabo-24p', ponto: 'ponto_24pinos' },
      estadoBaseComEsd(),
      catalogoFixture,
      regrasPadrao,
      missaoComCabos,
    );
    expect(caboAntes.resultado.regraId).toBe('ORDEM');

    const jumpAntes = executarAcaoBancada(
      { tipo: 'jump_power' },
      estadoBaseComEsd(),
      catalogoFixture,
      regrasPadrao,
      missaoComCabos,
    );
    expect(jumpAntes.resultado.regraId).toBe('ORDEM');
  });

  it('valida todas as falhas de energia/POST (sem fonte, chave desligada, sem cabos, GPU PCIe, sem RAM, sem cooler, sem HDMI) e tempo zero', () => {
    let estado = estadoBaseComEsd();

    // 1. Sem fonte
    expect(
      executarAcaoBancada({ tipo: 'jump_power' }, estado, catalogoFixture, regrasPadrao).resultado
        .regraId,
    ).toBe('RN-10');

    // 2. Com fonte mas chave desligada
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'fonte-500w', ponto: 'ponto_fonte' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    const fonteDesligada = executarAcaoBancada(
      { tipo: 'jump_power' },
      estado,
      catalogoFixture,
      regrasPadrao,
    );
    expect(fonteDesligada.resultado.regraId).toBe('RN-10');
    expect(fonteDesligada.novoEstado.errosOrdem).toBe(1);

    // 3. Chave ligada, sem cabos 24p/EPS
    estado = executarAcaoBancada(
      { tipo: 'alternar_fonte', ligada: true },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    expect(
      executarAcaoBancada({ tipo: 'jump_power' }, estado, catalogoFixture, regrasPadrao).resultado
        .regraId,
    ).toBe('RN-06');

    // 4. Conectar cabos (desligando fonte antes) -> falha por ausência de CPU/RAM
    estado = executarAcaoBancada(
      { tipo: 'alternar_fonte', ligada: false },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'conectar_cabo', pecaId: 'cabo-24p', ponto: 'ponto_24pinos' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'conectar_cabo', pecaId: 'cabo-eps', ponto: 'ponto_eps' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'alternar_fonte', ligada: true },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    expect(
      executarAcaoBancada({ tipo: 'jump_power' }, estado, catalogoFixture, regrasPadrao).resultado
        .regraId,
    ).toBe('RN-10');

    // 5. Instala CPU e RAM, mas sem cooler -> bloqueio térmico
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cpu-lga1151', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'ram-ddr4', ponto: 'ponto_ram1' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    expect(
      executarAcaoBancada({ tipo: 'jump_power' }, estado, catalogoFixture, regrasPadrao).resultado
        .regraId,
    ).toBe('ordem');

    // 6. Instala pasta e cooler, mas sem cabo HDMI -> monitor sem sinal
    estado = executarAcaoBancada(
      { tipo: 'aplicar_pasta' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    estado = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'cooler-1151', ponto: 'ponto_soquete' },
      estado,
      catalogoFixture,
      regrasPadrao,
    ).novoEstado;
    expect(
      executarAcaoBancada({ tipo: 'jump_power' }, estado, catalogoFixture, regrasPadrao).resultado
        .regraId,
    ).toBe('RN-10');

    // 7. GPU que exige PCIE_6P com fonte sem PCIE_6P -> RN-08
    const catalogoFonteSemPcie: Record<string, PecaCatalogo> = {
      ...catalogoFixture,
      'fonte-sem-pcie': {
        id: 'fonte-sem-pcie',
        tipo: 'fonte',
        nome: 'Fonte 450W sem PCIe',
        modelo3d: 'modelos/fonte/450w.glb',
        pontosDeEncaixe: ['ponto_fonte'],
        sensivelESD: false,
        consumoW: 0,
        descricao: 'Fonte sem PCIe',
        textoAlternativo: 'Fonte 450W',
        atributos: { potenciaW: 450, conectores: ['ATX_24P', 'EPS_8P'] },
      },
    };
    let estadoGpu = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'gpu-dedicada', ponto: 'ponto_pcie1' },
      estado,
      catalogoFonteSemPcie,
      regrasPadrao,
    ).novoEstado;
    estadoGpu = executarAcaoBancada(
      { tipo: 'encaixar', pecaId: 'fonte-sem-pcie', ponto: 'ponto_fonte' },
      estadoGpu,
      catalogoFonteSemPcie,
      regrasPadrao,
    ).novoEstado;
    expect(
      executarAcaoBancada({ tipo: 'jump_power' }, estadoGpu, catalogoFonteSemPcie, regrasPadrao)
        .resultado.regraId,
    ).toBe('RN-08');

    // 8. Tempo >= limiteZero zera nota de tempo
    const notaTempoZero = calcularPontuacao(estado, 2500, 900, regrasPadrao);
    expect(notaTempoZero.notaTempo).toBe(0);
  });
});
