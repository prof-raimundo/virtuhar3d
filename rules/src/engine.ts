import type {
  AcaoBancada,
  EstadoBancada,
  MissaoDefinicao,
  ModoMissao,
  PecaCabo,
  PecaCatalogo,
  PecaFonte,
  PecaGabinete,
  PecaGpu,
  PecaPlacaMae,
  RelatorioPontuacao,
  RegrasParametros,
  ResultadoRegra,
} from './types.js';

export function criarEstadoInicial(
  missao: MissaoDefinicao,
  modo: ModoMissao = 'guiado',
): EstadoBancada {
  const instaladas: Record<string, string> = {};
  for (const item of missao.estadoInicial.pecasInstaladas) {
    instaladas[item.ponto] = item.pecaId;
  }

  return {
    esdColocada: missao.estadoInicial.esdColocada,
    esdRetiradaDurantePratica: false,
    fonteLigada: missao.estadoInicial.fonteLigada,
    pastaTermicaAplicada: false,
    espacadoresInstalados: false,
    instaladas,
    passosConcluidos: [],
    violacoesEsd: 0,
    errosOrdem: 0,
    pecasRecusadasCompatibilidade: [],
    dicasUsadas: 0,
    modo,
    postExibido: false,
  };
}

function encontrarPecaInstaladaPorTipo<T extends PecaCatalogo['tipo']>(
  estado: EstadoBancada,
  catalogo: Record<string, PecaCatalogo>,
  tipo: T,
): Array<{ ponto: string; peca: Extract<PecaCatalogo, { tipo: T }> }> {
  const encontradas: Array<{ ponto: string; peca: Extract<PecaCatalogo, { tipo: T }> }> = [];
  for (const [ponto, pecaId] of Object.entries(estado.instaladas)) {
    const peca = catalogo[pecaId];
    if (peca && peca.tipo === tipo) {
      encontradas.push({ ponto, peca: peca as Extract<PecaCatalogo, { tipo: T }> });
    }
  }
  return encontradas;
}

function obterPlacaMaeInstalada(
  estado: EstadoBancada,
  catalogo: Record<string, PecaCatalogo>,
): PecaPlacaMae | undefined {
  return encontrarPecaInstaladaPorTipo(estado, catalogo, 'placa_mae')[0]?.peca;
}

function obterGabineteInstalado(
  estado: EstadoBancada,
  catalogo: Record<string, PecaCatalogo>,
): PecaGabinete | undefined {
  return encontrarPecaInstaladaPorTipo(estado, catalogo, 'gabinete')[0]?.peca;
}

function obterFonteInstalada(
  estado: EstadoBancada,
  catalogo: Record<string, PecaCatalogo>,
): PecaFonte | undefined {
  return encontrarPecaInstaladaPorTipo(estado, catalogo, 'fonte')[0]?.peca;
}

function registrarErroCompatibilidade(estado: EstadoBancada, pecaId: string): EstadoBancada {
  if (estado.pecasRecusadasCompatibilidade.includes(pecaId)) {
    return estado;
  }
  return {
    ...estado,
    pecasRecusadasCompatibilidade: [...estado.pecasRecusadasCompatibilidade, pecaId],
  };
}

function registrarErroOrdem(estado: EstadoBancada): EstadoBancada {
  return {
    ...estado,
    errosOrdem: estado.errosOrdem + 1,
  };
}

function registrarViolacaoEsd(estado: EstadoBancada): EstadoBancada {
  return {
    ...estado,
    violacoesEsd: estado.violacoesEsd + 1,
  };
}

function verificarEsdParaPeca(
  peca: PecaCatalogo,
  estado: EstadoBancada,
  regras: RegrasParametros,
): ResultadoRegra | null {
  const sensivel =
    peca.sensivelESD || (regras.esd.tiposSensiveis as ReadonlyArray<string>).includes(peca.tipo);

  if (!sensivel || estado.esdColocada) {
    return null;
  }

  if (estado.esdRetiradaDurantePratica) {
    return {
      permitido: false,
      regraId: 'RN-12',
      tipoErro: 'esd',
      mensagem:
        'Violação ESD: você retirou a pulseira antiestática antes de manusear um componente sensível.',
      comoCorrigir: 'Conecte novamente a pulseira antiestática ao ponto de aterramento da bancada.',
    };
  }

  return {
    permitido: false,
    regraId: 'RN-11',
    tipoErro: 'esd',
    mensagem:
      'Protocolo ESD obrigatório: coloque a pulseira antiestática antes de tocar em CPU, memória, placa-mãe, armazenamento ou GPU.',
    comoCorrigir:
      'Selecione a pulseira antiestática e conecte-a ao ponto de aterramento da bancada.',
  };
}

function validarCaboNoPonto(cabo: PecaCabo, ponto: string): ResultadoRegra {
  const mapaCategoriaParaPontos: Record<PecaCabo['atributos']['categoria'], string[]> = {
    energia_atx24: ['ponto_24pinos'],
    energia_eps: ['ponto_eps'],
    energia_pcie: ['ponto_pcie_energia'],
    video: ['ponto_hdmi_placa', 'ponto_hdmi_monitor'],
    sata: ['ponto_sata1', 'ponto_sata2', 'ponto_sata'],
    esd: ['ponto_aterramento'],
  };

  const pontosValidos = mapaCategoriaParaPontos[cabo.atributos.categoria] ?? [];
  if (!pontosValidos.includes(ponto)) {
    return {
      permitido: false,
      regraId: 'RN-09',
      tipoErro: 'compatibilidade',
      mensagem: `O cabo "${cabo.nome}" não corresponde ao conector "${ponto}".`,
      comoCorrigir: 'Conecte o cabo no encaixe específico de mesma pinagem e orientação.',
    };
  }

  return {
    permitido: true,
    mensagem: `Cabo "${cabo.nome}" conectado corretamente.`,
  };
}

export function validarCompatibilidadePeca(
  peca: PecaCatalogo,
  ponto: string,
  estado: EstadoBancada,
  catalogo: Record<string, PecaCatalogo>,
): ResultadoRegra {
  if (peca.tipo === 'cabo') {
    return validarCaboNoPonto(peca, ponto);
  }

  // Verificar se o ponto já está ocupado (exceto quando cooler é instalado sobre CPU no ponto_soquete)
  const pecaAtualNoPonto = estado.instaladas[ponto];
  if (pecaAtualNoPonto && !(peca.tipo === 'cooler' && ponto === 'ponto_soquete')) {
    const atual = catalogo[pecaAtualNoPonto];
    // Permite substituir fonte se o aluno estiver trocando a fonte da bancada
    if (!(peca.tipo === 'fonte' && atual?.tipo === 'fonte')) {
      return {
        permitido: false,
        regraId: peca.tipo === 'ram' ? 'RN-02' : 'RN-08',
        tipoErro: 'compatibilidade',
        mensagem: `O ponto "${ponto}" já está ocupado por "${atual?.nome ?? pecaAtualNoPonto}".`,
        comoCorrigir: 'Retire a peça instalada ou escolha um slot livre compatível.',
      };
    }
  }

  const permitePontoPlacaMae = peca.tipo === 'placa_mae' && ponto === 'ponto_placa_mae';
  const permitePontoPcie = peca.tipo === 'gpu' && ponto.startsWith('ponto_pcie');
  if (
    !permitePontoPlacaMae &&
    !permitePontoPcie &&
    !peca.pontosDeEncaixe.includes(ponto) &&
    peca.tipo !== 'cooler'
  ) {
    return {
      permitido: false,
      regraId: 'RN-09',
      tipoErro: 'compatibilidade',
      mensagem: `A peça "${peca.nome}" não pode ser encaixada em "${ponto}".`,
      comoCorrigir: 'Posicione a peça no encaixe correspondente ao seu formato.',
    };
  }

  const placaMae = obterPlacaMaeInstalada(estado, catalogo);
  const gabinete = obterGabineteInstalado(estado, catalogo);

  switch (peca.tipo) {
    case 'cpu': {
      if (placaMae && peca.atributos.soquete !== placaMae.atributos.soquete) {
        return {
          permitido: false,
          regraId: 'RN-01',
          tipoErro: 'compatibilidade',
          mensagem: `CPU incompatível: o processador usa soquete ${peca.atributos.soquete}, mas a placa-mãe exige ${placaMae.atributos.soquete}.`,
          comoCorrigir: `Escolha um processador com soquete ${placaMae.atributos.soquete}.`,
        };
      }
      return { permitido: true, mensagem: `CPU "${peca.nome}" encaixada no soquete.` };
    }

    case 'ram': {
      if (placaMae) {
        if (peca.atributos.tipo !== placaMae.atributos.tipoRam) {
          return {
            permitido: false,
            regraId: 'RN-02',
            tipoErro: 'compatibilidade',
            mensagem: `Memória incompatível: o módulo é ${peca.atributos.tipo}, mas a placa-mãe suporta apenas ${placaMae.atributos.tipoRam}.`,
            comoCorrigir: `Selecione um módulo de memória do padrão ${placaMae.atributos.tipoRam}.`,
          };
        }
        const ramsInstaladas = encontrarPecaInstaladaPorTipo(estado, catalogo, 'ram');
        if (ramsInstaladas.length >= placaMae.atributos.slotsRam) {
          return {
            permitido: false,
            regraId: 'RN-02',
            tipoErro: 'compatibilidade',
            mensagem: 'Todos os slots de memória RAM da placa-mãe já estão ocupados.',
            comoCorrigir: 'Retire um módulo existente antes de instalar outro.',
          };
        }
      }
      return { permitido: true, mensagem: `Memória "${peca.nome}" instalada em ${ponto}.` };
    }

    case 'placa_mae': {
      if (gabinete && !gabinete.atributos.formatosAceitos.includes(peca.atributos.formato)) {
        return {
          permitido: false,
          regraId: 'RN-03',
          tipoErro: 'compatibilidade',
          mensagem: `Formato incompatível: a placa-mãe é ${peca.atributos.formato}, e o gabinete aceita apenas ${gabinete.atributos.formatosAceitos.join(', ')}.`,
          comoCorrigir: 'Selecione uma placa-mãe menor ou um gabinete compatível com o formato.',
        };
      }
      return { permitido: true, mensagem: `Placa-mãe "${peca.nome}" posicionada.` };
    }

    case 'cooler': {
      const cpu = encontrarPecaInstaladaPorTipo(estado, catalogo, 'cpu')[0]?.peca;
      const soqueteAlvo = cpu?.atributos.soquete ?? placaMae?.atributos.soquete;
      if (soqueteAlvo && !peca.atributos.soquetesCompativeis.includes(soqueteAlvo)) {
        return {
          permitido: false,
          regraId: 'RN-04',
          tipoErro: 'compatibilidade',
          mensagem: `Cooler incompatível com o soquete ${soqueteAlvo}. Suportados: ${peca.atributos.soquetesCompativeis.join(', ')}.`,
          comoCorrigir: `Utilize um cooler compatível com o soquete ${soqueteAlvo}.`,
        };
      }
      if (gabinete && peca.atributos.alturaMm > gabinete.atributos.alturaMaxCoolerMm) {
        return {
          permitido: false,
          regraId: 'RN-04',
          tipoErro: 'compatibilidade',
          mensagem: `O cooler possui ${peca.atributos.alturaMm} mm de altura, ultrapassando o limite de ${gabinete.atributos.alturaMaxCoolerMm} mm do gabinete.`,
          comoCorrigir: 'Escolha um cooler mais baixo para caber na tampa lateral do gabinete.',
        };
      }
      return {
        permitido: true,
        mensagem: `Cooler "${peca.nome}" fixado e conectado ao CPU_FAN.`,
      };
    }

    case 'armazenamento': {
      if (
        placaMae &&
        !placaMae.atributos.interfacesArmazenamento.includes(peca.atributos.interface)
      ) {
        return {
          permitido: false,
          regraId: 'RN-07',
          tipoErro: 'compatibilidade',
          mensagem: `Interface incompatível: o armazenamento exige ${peca.atributos.interface}, ausente nesta placa-mãe.`,
          comoCorrigir: `Use uma unidade com interface ${placaMae.atributos.interfacesArmazenamento.join(' ou ')}.`,
        };
      }
      return { permitido: true, mensagem: `Armazenamento "${peca.nome}" instalado.` };
    }

    case 'gpu': {
      if (placaMae) {
        const gpusInstaladas = encontrarPecaInstaladaPorTipo(estado, catalogo, 'gpu');
        if (gpusInstaladas.length >= placaMae.atributos.slotsPcie) {
          return {
            permitido: false,
            regraId: 'RN-08',
            tipoErro: 'compatibilidade',
            mensagem: 'Não há slot PCIe x16 livre disponível na placa-mãe.',
            comoCorrigir: 'Remova a placa de vídeo instalada ou use uma placa-mãe com mais slots.',
          };
        }
      }
      return { permitido: true, mensagem: `Placa de vídeo "${peca.nome}" encaixada no slot PCIe.` };
    }

    default:
      return { permitido: true, mensagem: `Peça "${peca.nome}" encaixada em ${ponto}.` };
  }
}

export function validarEnergiaEPost(
  estado: EstadoBancada,
  catalogo: Record<string, PecaCatalogo>,
  regras: RegrasParametros,
): ResultadoRegra {
  const placaMae = obterPlacaMaeInstalada(estado, catalogo);
  const cpu = encontrarPecaInstaladaPorTipo(estado, catalogo, 'cpu')[0]?.peca;
  const cooler = encontrarPecaInstaladaPorTipo(estado, catalogo, 'cooler')[0]?.peca;
  const rams = encontrarPecaInstaladaPorTipo(estado, catalogo, 'ram');
  const gpus = encontrarPecaInstaladaPorTipo(estado, catalogo, 'gpu');
  const fonte = obterFonteInstalada(estado, catalogo);
  const cabos = encontrarPecaInstaladaPorTipo(estado, catalogo, 'cabo');

  if (!fonte) {
    return {
      permitido: false,
      regraId: 'RN-10',
      tipoErro: 'energia',
      mensagem: 'Nenhuma fonte de alimentação conectada à bancada.',
      comoCorrigir: 'Posicione a fonte ATX e conecte os cabos 24 pinos e EPS.',
    };
  }

  if (!estado.fonteLigada) {
    return {
      permitido: false,
      regraId: 'RN-10',
      tipoErro: 'ordem',
      mensagem: 'A chave traseira da fonte de alimentação está desligada (0).',
      comoCorrigir:
        'Ligue a chave da fonte para a posição (I) antes de fazer o jump nos pinos de Power.',
    };
  }

  const tem24P = cabos.some((c) => c.peca.atributos.categoria === 'energia_atx24');
  const temEps = cabos.some((c) => c.peca.atributos.categoria === 'energia_eps');
  const temVideoCabo = cabos.some((c) => c.peca.atributos.categoria === 'video');

  if (!tem24P || !temEps) {
    return {
      permitido: false,
      regraId: 'RN-06',
      tipoErro: 'energia',
      mensagem: 'Cabos de energia obrigatórios desconectados (ATX 24 pinos e/ou EPS da CPU).',
      comoCorrigir:
        'Desligue a fonte e conecte tanto o cabo ATX 24 pinos quanto o cabo EPS 8 pinos.',
    };
  }

  // RN-05: Margem de segurança de +20% sobre a soma dos consumos
  let consumoTotalW = 0;
  for (const pecaId of Object.values(estado.instaladas)) {
    const peca = catalogo[pecaId];
    if (peca) {
      consumoTotalW += peca.consumoW;
    }
  }
  const fatorMargem = 1 + regras.fonte.margemSegurancaPercentual / 100;
  const potenciaMinimaRecomendadaW = Math.ceil(consumoTotalW * fatorMargem);

  if (fonte.atributos.potenciaW < potenciaMinimaRecomendadaW) {
    return {
      permitido: false,
      regraId: 'RN-05',
      tipoErro: 'energia',
      mensagem: `Potência insuficiente: consumo estimado de ${consumoTotalW} W exige fonte de pelo menos ${potenciaMinimaRecomendadaW} W (margem de +${regras.fonte.margemSegurancaPercentual}%), mas a fonte fornece ${fonte.atributos.potenciaW} W.`,
      comoCorrigir: `Instale uma fonte com pelo menos ${potenciaMinimaRecomendadaW} W reais.`,
    };
  }

  // RN-06: Conectores físicos disponíveis na fonte
  if (placaMae) {
    for (const conectorExigido of placaMae.atributos.conectoresEnergia) {
      if (!fonte.atributos.conectores.includes(conectorExigido)) {
        return {
          permitido: false,
          regraId: 'RN-06',
          tipoErro: 'energia',
          mensagem: `A fonte "${fonte.nome}" não possui o conector ${conectorExigido} exigido pela placa-mãe.`,
          comoCorrigir: `Substitua por uma fonte equipada com conector ${conectorExigido}.`,
        };
      }
    }
  }

  for (const { peca: gpu } of gpus) {
    const gpuTipada = gpu as PecaGpu;
    if (gpuTipada.atributos.exigeEnergiaPcie) {
      const conectorPcie = gpuTipada.atributos.conectorEnergiaPcie ?? 'PCIE_6P';
      if (!fonte.atributos.conectores.includes(conectorPcie)) {
        return {
          permitido: false,
          regraId: 'RN-08',
          tipoErro: 'energia',
          mensagem: `A placa de vídeo "${gpuTipada.nome}" exige conector auxiliar ${conectorPcie} ausente na fonte.`,
          comoCorrigir: `Escolha uma fonte que forneça conector ${conectorPcie}.`,
        };
      }
    }
  }

  // RN-10: Conjunto mínimo para exibir POST
  if (!placaMae || !cpu || rams.length === 0) {
    return {
      permitido: false,
      regraId: 'RN-10',
      tipoErro: 'montagem',
      mensagem:
        'Monitor sem imagem: faltam componentes essenciais para o POST (placa-mãe, CPU ou memória RAM).',
      comoCorrigir:
        'Verifique se CPU e ao menos um pente de memória estão encaixados corretamente.',
    };
  }

  if (!cooler) {
    return {
      permitido: false,
      regraId: 'ordem',
      tipoErro: 'ordem',
      mensagem: 'Operação bloqueada por segurança térmica: o cooler sobre a CPU não foi instalado.',
      comoCorrigir: 'Aplique a pasta térmica e instale o cooler antes de energizar o equipamento.',
    };
  }

  const temSaidaVideo = placaMae.atributos.saidaVideo || gpus.length > 0;
  if (!temSaidaVideo || !temVideoCabo) {
    return {
      permitido: false,
      regraId: 'RN-10',
      tipoErro: 'montagem',
      mensagem: 'Equipamento ligou, mas o monitor permaneceu sem sinal de vídeo.',
      comoCorrigir: 'Conecte o cabo HDMI da saída de vídeo até o monitor virtual de bancada.',
    };
  }

  return {
    permitido: true,
    postExibido: true,
    mensagem:
      'POST concluído com sucesso! BIOS inicializada e hardware detectado no monitor virtual.',
  };
}

function registrarPassoSeAplicavel(
  estado: EstadoBancada,
  missao: MissaoDefinicao | undefined,
  tipoAcao: string,
  pecaId?: string,
  ponto?: string,
): EstadoBancada {
  if (!missao) {
    return estado;
  }
  const passoCorrespondente = missao.passos.find(
    (p) =>
      p.acaoEsperada.tipo === tipoAcao &&
      (!pecaId || p.acaoEsperada.peca === pecaId) &&
      (!ponto || p.acaoEsperada.em === ponto) &&
      !estado.passosConcluidos.includes(p.id),
  );
  if (!passoCorrespondente) {
    return estado;
  }
  return {
    ...estado,
    passosConcluidos: [...estado.passosConcluidos, passoCorrespondente.id],
  };
}

function validarPreRequisitosMissao(
  estado: EstadoBancada,
  missao: MissaoDefinicao | undefined,
  tipoAcao: string,
  pecaId?: string,
  ponto?: string,
): ResultadoRegra | null {
  if (!missao) {
    return null;
  }
  const passo = missao.passos.find(
    (p) =>
      p.acaoEsperada.tipo === tipoAcao &&
      (!pecaId || p.acaoEsperada.peca === pecaId) &&
      (!ponto || p.acaoEsperada.em === ponto),
  );
  if (!passo) {
    return null;
  }
  const faltando = passo.preRequisitos.filter((req) => !estado.passosConcluidos.includes(req));
  if (faltando.length === 0) {
    return null;
  }
  const descricoesFaltando = faltando
    .map((id) => missao.passos.find((p) => p.id === id)?.descricao ?? id)
    .join('; ');
  return {
    permitido: false,
    regraId: 'ORDEM',
    tipoErro: 'ordem',
    mensagem: `Etapa fora de ordem antes de "${passo.descricao}".`,
    comoCorrigir: `Conclua primeiro: ${descricoesFaltando}.`,
  };
}

export function executarAcaoBancada(
  acao: AcaoBancada,
  estado: EstadoBancada,
  catalogo: Record<string, PecaCatalogo>,
  regras: RegrasParametros,
  missao?: MissaoDefinicao,
): { novoEstado: EstadoBancada; resultado: ResultadoRegra } {
  switch (acao.tipo) {
    case 'vestir_esd': {
      const novoEstado = registrarPassoSeAplicavel(
        {
          ...estado,
          esdColocada: true,
          esdRetiradaDurantePratica: false,
        },
        missao,
        'vestir_esd',
      );
      return {
        novoEstado,
        resultado: {
          permitido: true,
          mensagem: 'Pulseira antiestática conectada ao aterramento. Bancada segura para manuseio.',
        },
      };
    }

    case 'retirar_esd': {
      return {
        novoEstado: {
          ...estado,
          esdColocada: false,
          esdRetiradaDurantePratica: true,
        },
        resultado: {
          permitido: true,
          mensagem:
            'Atenção: pulseira antiestática removida. Não toque em componentes sensíveis sem aterramento.',
        },
      };
    }

    case 'instalar_espacadores': {
      return {
        novoEstado: { ...estado, espacadoresInstalados: true },
        resultado: {
          permitido: true,
          mensagem: 'Espaçadores metálicos fixados no gabinete.',
        },
      };
    }

    case 'aplicar_pasta': {
      const cpuInstalada = encontrarPecaInstaladaPorTipo(estado, catalogo, 'cpu').length > 0;
      if (!cpuInstalada) {
        return {
          novoEstado: registrarErroOrdem(estado),
          resultado: {
            permitido: false,
            regraId: 'ORDEM-PASTA',
            tipoErro: 'ordem',
            mensagem:
              'Não é possível aplicar pasta térmica sem o processador instalado no soquete.',
            comoCorrigir: 'Instale primeiro a CPU compatível no soquete da placa-mãe.',
          },
        };
      }
      const novoEstado = registrarPassoSeAplicavel(
        { ...estado, pastaTermicaAplicada: true },
        missao,
        'aplicar_pasta',
      );
      return {
        novoEstado,
        resultado: {
          permitido: true,
          mensagem: 'Gota central de pasta térmica aplicada sobre a CPU.',
        },
      };
    }

    case 'alternar_fonte': {
      const novoEstado = registrarPassoSeAplicavel(
        { ...estado, fonteLigada: acao.ligada },
        missao,
        acao.ligada ? 'ligar_fonte' : 'desligar_fonte',
      );
      return {
        novoEstado,
        resultado: {
          permitido: true,
          mensagem: acao.ligada
            ? 'Chave da fonte ligada (posição I).'
            : 'Chave da fonte desligada (posição 0).',
        },
      };
    }

    case 'usar_dica': {
      return {
        novoEstado: {
          ...estado,
          dicasUsadas: estado.dicasUsadas + 1,
        },
        resultado: {
          permitido: true,
          mensagem: 'Dica exibida no Modo Guiado.',
        },
      };
    }

    case 'retirar': {
      const pecaId = estado.instaladas[acao.ponto];
      if (!pecaId) {
        return {
          novoEstado: estado,
          resultado: {
            permitido: false,
            tipoErro: 'montagem',
            mensagem: `Não há peça instalada em "${acao.ponto}".`,
          },
        };
      }
      const novasInstaladas = Object.fromEntries(
        Object.entries(estado.instaladas).filter(([chave]) => chave !== acao.ponto),
      );
      return {
        novoEstado: {
          ...estado,
          instaladas: novasInstaladas,
          postExibido: false,
        },
        resultado: {
          permitido: true,
          mensagem: `Peça removida de ${acao.ponto}.`,
        },
      };
    }

    case 'inspecionar': {
      const peca = catalogo[acao.pecaId];
      if (!peca) {
        return {
          novoEstado: estado,
          resultado: {
            permitido: false,
            tipoErro: 'montagem',
            mensagem: `Peça "${acao.pecaId}" não encontrada no catálogo.`,
          },
        };
      }
      const falhaEsd = verificarEsdParaPeca(peca, estado, regras);
      if (falhaEsd) {
        return {
          novoEstado: registrarViolacaoEsd(estado),
          resultado: falhaEsd,
        };
      }
      const novoEstado = registrarPassoSeAplicavel(
        estado,
        missao,
        'inspecionar',
        acao.pecaId,
        acao.ponto,
      );
      return {
        novoEstado,
        resultado: {
          permitido: true,
          mensagem: `Inspeção concluída: ${peca.nome}.`,
        },
      };
    }

    case 'conectar_cabo': {
      const cabo = catalogo[acao.pecaId];
      if (!cabo || cabo.tipo !== 'cabo') {
        return {
          novoEstado: estado,
          resultado: {
            permitido: false,
            tipoErro: 'montagem',
            mensagem: `Item "${acao.pecaId}" não é um cabo válido.`,
          },
        };
      }

      const ehCaboEnergia =
        cabo.atributos.categoria === 'energia_atx24' ||
        cabo.atributos.categoria === 'energia_eps' ||
        cabo.atributos.categoria === 'energia_pcie';

      if (ehCaboEnergia && estado.fonteLigada) {
        return {
          novoEstado: registrarErroOrdem(estado),
          resultado: {
            permitido: false,
            regraId: 'ORDEM-FONTE-DESLIGADA',
            tipoErro: 'ordem',
            mensagem: 'Risco elétrico: não conecte cabos internos com a fonte ligada.',
            comoCorrigir: 'Desligue a chave traseira da fonte (0) antes de plugar o cabo.',
          },
        };
      }

      const compat = validarCompatibilidadePeca(cabo, acao.ponto, estado, catalogo);
      if (!compat.permitido) {
        return {
          novoEstado: registrarErroCompatibilidade(estado, cabo.id),
          resultado: compat,
        };
      }

      const preReq = validarPreRequisitosMissao(
        estado,
        missao,
        'conectar_cabo',
        cabo.id,
        acao.ponto,
      );
      if (preReq) {
        return {
          novoEstado: registrarErroOrdem(estado),
          resultado: preReq,
        };
      }

      const comCabo: EstadoBancada = {
        ...estado,
        instaladas: {
          ...estado.instaladas,
          [acao.ponto]: cabo.id,
        },
      };

      const novoEstado = registrarPassoSeAplicavel(
        comCabo,
        missao,
        'conectar_cabo',
        cabo.id,
        acao.ponto,
      );
      return {
        novoEstado,
        resultado: compat,
      };
    }

    case 'encaixar': {
      const peca = catalogo[acao.pecaId];
      if (!peca) {
        return {
          novoEstado: estado,
          resultado: {
            permitido: false,
            tipoErro: 'montagem',
            mensagem: `Peça "${acao.pecaId}" não encontrada no catálogo.`,
          },
        };
      }

      // 1. Verificar ESD para peças sensíveis (RN-11 / RN-12)
      const falhaEsd = verificarEsdParaPeca(peca, estado, regras);
      if (falhaEsd) {
        return {
          novoEstado: registrarViolacaoEsd(estado),
          resultado: falhaEsd,
        };
      }

      // 2. Verificar regras estruturais de ordem (espaçadores / pasta térmica)
      if (peca.tipo === 'placa_mae') {
        const gabinete = obterGabineteInstalado(estado, catalogo);
        if (gabinete && !estado.espacadoresInstalados) {
          return {
            novoEstado: registrarErroOrdem(estado),
            resultado: {
              permitido: false,
              regraId: 'ORDEM-ESPACADORES',
              tipoErro: 'ordem',
              mensagem:
                'Não é possível fixar a placa-mãe no gabinete antes de instalar os espaçadores metálicos.',
              comoCorrigir:
                'Instale os espaçadores no chassi do gabinete para evitar curto-circuito.',
            },
          };
        }
      }

      if (peca.tipo === 'cooler') {
        const cpuInstalada = encontrarPecaInstaladaPorTipo(estado, catalogo, 'cpu').length > 0;
        if (!cpuInstalada) {
          return {
            novoEstado: registrarErroOrdem(estado),
            resultado: {
              permitido: false,
              regraId: 'ORDEM-COOLER-CPU',
              tipoErro: 'ordem',
              mensagem: 'O cooler não pode ser instalado antes do processador.',
              comoCorrigir: 'Encaixe a CPU e aplique a pasta térmica antes do cooler.',
            },
          };
        }
        if (!estado.pastaTermicaAplicada) {
          return {
            novoEstado: registrarErroOrdem(estado),
            resultado: {
              permitido: false,
              regraId: 'ORDEM-COOLER-PASTA',
              tipoErro: 'ordem',
              mensagem:
                'Etapa ausente: aplique a pasta térmica sobre a CPU antes de instalar o cooler.',
              comoCorrigir: 'Selecione a seringa de pasta térmica e aplique sobre o processador.',
            },
          };
        }
      }

      // 3. Verificar compatibilidade física/elétrica (RN-01..RN-09)
      const compat = validarCompatibilidadePeca(peca, acao.ponto, estado, catalogo);
      if (!compat.permitido) {
        return {
          novoEstado: registrarErroCompatibilidade(estado, peca.id),
          resultado: compat,
        };
      }

      // 4. Verificar pré-requisitos definidos na missão (se houver)
      const preReq = validarPreRequisitosMissao(estado, missao, 'encaixar', peca.id, acao.ponto);
      if (preReq) {
        return {
          novoEstado: registrarErroOrdem(estado),
          resultado: preReq,
        };
      }

      const pontoFinal =
        peca.tipo === 'cooler' && acao.ponto === 'ponto_soquete' ? 'ponto_cooler' : acao.ponto;

      const comPeca: EstadoBancada = {
        ...estado,
        instaladas: {
          ...estado.instaladas,
          [pontoFinal]: peca.id,
        },
      };

      const novoEstado = registrarPassoSeAplicavel(
        comPeca,
        missao,
        'encaixar',
        peca.id,
        acao.ponto,
      );

      return {
        novoEstado,
        resultado: compat,
      };
    }

    case 'jump_power': {
      const preReq = validarPreRequisitosMissao(estado, missao, 'jump_power');
      if (preReq) {
        return {
          novoEstado: registrarErroOrdem(estado),
          resultado: preReq,
        };
      }

      const post = validarEnergiaEPost(estado, catalogo, regras);
      if (!post.permitido) {
        const novoEstadoErro = post.tipoErro === 'ordem' ? registrarErroOrdem(estado) : estado;
        return {
          novoEstado: novoEstadoErro,
          resultado: post,
        };
      }

      const comPost = registrarPassoSeAplicavel(
        {
          ...estado,
          postExibido: true,
        },
        missao,
        'jump_power',
      );
      return {
        novoEstado: comPost,
        resultado: post,
      };
    }
  }
}

export function calcularPontuacao(
  estado: EstadoBancada,
  tempoSeg: number,
  tempoReferenciaSeg: number,
  regras: RegrasParametros,
): RelatorioPontuacao {
  const notaEsd = Math.max(
    0,
    regras.esd.pontuacaoMaxima - estado.violacoesEsd * regras.esd.descontoPorViolacao,
  );

  const notaOrdem = Math.max(
    0,
    regras.ordem.pontuacaoMaxima - estado.errosOrdem * regras.ordem.descontoPorErro,
  );

  const notaCompatibilidade = Math.max(
    0,
    regras.compatibilidade.pontuacaoMaxima -
      estado.pecasRecusadasCompatibilidade.length * regras.compatibilidade.descontoPorErro,
  );

  let notaTempo = 0;
  if (tempoSeg <= tempoReferenciaSeg) {
    notaTempo = regras.tempo.pontuacaoMaxima;
  } else {
    const limiteZero = tempoReferenciaSeg * regras.tempo.multiplicadorLimiteZero;
    if (tempoSeg < limiteZero) {
      const fracao = (limiteZero - tempoSeg) / (limiteZero - tempoReferenciaSeg);
      notaTempo = Math.round(regras.tempo.pontuacaoMaxima * fracao);
    }
  }

  const descontoDicas =
    estado.modo === 'guiado'
      ? Math.min(
          regras.modoGuiado.descontoMaximoDicas,
          estado.dicasUsadas * regras.modoGuiado.descontoPorDica,
        )
      : 0;

  const somaBruta = notaEsd + notaOrdem + notaCompatibilidade + notaTempo;
  const notaTotal = Math.max(0, Math.min(100, somaBruta - descontoDicas));

  return {
    notaTotal,
    notaEsd,
    notaOrdem,
    notaCompatibilidade,
    notaTempo,
    descontoDicas,
    aprovado: notaTotal >= regras.aprovacao.notaMinima,
    entraNoRanking: estado.modo === 'avaliacao',
  };
}

export function calcularNivel(pontosTotais: number, regras: RegrasParametros): string {
  const ordenados = [...regras.niveis].sort((a, b) => a.pontosMinimos - b.pontosMinimos);
  let nivelAtual = ordenados[0]?.nome ?? 'Aprendiz';
  for (const faixa of ordenados) {
    if (pontosTotais >= faixa.pontosMinimos) {
      nivelAtual = faixa.nome;
    }
  }
  return nivelAtual;
}
