import { z } from 'zod';

/**
 * Schemas de validação (Documento 11 e Documento 12)
 * Todo arquivo JSON de conteúdo traz `schemaVersion` e é validado em build/CI e runtime.
 */

export const SchemaVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'schemaVersion deve seguir SemVer (ex.: 1.0.0)');

export const LicencaSchema = z.object({
  tipo: z.enum(['CC0', 'CC-BY']),
  autor: z.string().min(2, 'Autor da licença obrigatório'),
  origem: z.string().min(2, 'Origem do modelo obrigatória'),
  url: z.string().optional(),
});

const PecaBaseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'id da peça deve conter apenas minúsculas, números e hífen'),
  nome: z.string().min(3),
  modelo3d: z
    .string()
    .regex(/^modelos\/[a-z0-9/_-]+\.glb$/, 'modelo3d deve apontar para modelos/.../*.glb'),
  pontosDeEncaixe: z.array(z.string().min(1)),
  sensivelESD: z.boolean(),
  consumoW: z.number().nonnegative(),
  descricao: z.string().min(5),
  textoAlternativo: z.string().min(10, 'textoAlternativo obrigatório para acessibilidade (RNF-09)'),
  licenca: LicencaSchema,
});

export const TipoRamSchema = z.enum(['DDR3', 'DDR4', 'DDR5']);
export const FormatoPlacaMaeSchema = z.enum(['ATX', 'Micro-ATX', 'Mini-ITX']);
export const ConectorFonteSchema = z.enum([
  'ATX_24P',
  'EPS_4P',
  'EPS_8P',
  'PCIE_6P',
  'PCIE_8P',
  'SATA',
]);

export const PecaCpuSchema = PecaBaseSchema.extend({
  tipo: z.literal('cpu'),
  atributos: z.object({
    soquete: z.string().min(2),
    frequenciaGhz: z.number().positive().optional(),
    nucleos: z.number().int().positive().optional(),
  }),
});

export const PecaCoolerSchema = PecaBaseSchema.extend({
  tipo: z.literal('cooler'),
  atributos: z.object({
    soquetesCompativeis: z.array(z.string().min(2)).min(1),
    alturaMm: z.number().positive(),
    potenciaTermicaW: z.number().positive(),
    conector: z.string().min(2).default('CPU_FAN'),
  }),
});

export const PecaRamSchema = PecaBaseSchema.extend({
  tipo: z.literal('ram'),
  atributos: z.object({
    tipo: TipoRamSchema,
    capacidadeGB: z.number().int().positive(),
    frequenciaMhz: z.number().int().positive().optional(),
  }),
});

export const PecaPlacaMaeSchema = PecaBaseSchema.extend({
  tipo: z.literal('placa_mae'),
  atributos: z.object({
    soquete: z.string().min(2),
    formato: FormatoPlacaMaeSchema,
    tipoRam: TipoRamSchema,
    slotsRam: z.number().int().positive(),
    slotsPcie: z.number().int().nonnegative(),
    interfacesArmazenamento: z.array(z.enum(['SATA', 'M.2'])).min(1),
    saidaVideo: z.boolean(),
    conectoresEnergia: z.array(z.enum(['ATX_24P', 'EPS_4P', 'EPS_8P'])).min(1),
  }),
});

export const PecaFonteSchema = PecaBaseSchema.extend({
  tipo: z.literal('fonte'),
  atributos: z.object({
    potenciaW: z.number().int().positive(),
    conectores: z.array(ConectorFonteSchema).min(1),
  }),
});

export const PecaGabineteSchema = PecaBaseSchema.extend({
  tipo: z.literal('gabinete'),
  atributos: z.object({
    formatosAceitos: z.array(FormatoPlacaMaeSchema).min(1),
    alturaMaxCoolerMm: z.number().positive(),
  }),
});

export const PecaArmazenamentoSchema = PecaBaseSchema.extend({
  tipo: z.literal('armazenamento'),
  atributos: z.object({
    interface: z.enum(['SATA', 'M.2']),
    capacidadeGB: z.number().int().positive().optional(),
  }),
});

export const PecaGpuSchema = PecaBaseSchema.extend({
  tipo: z.literal('gpu'),
  atributos: z.object({
    exigeEnergiaPcie: z.boolean(),
    conectorEnergiaPcie: z.enum(['PCIE_6P', 'PCIE_8P']).optional(),
    slot: z.literal('PCIe_x16'),
  }),
});

export const PecaCaboSchema = PecaBaseSchema.extend({
  tipo: z.literal('cabo'),
  atributos: z.object({
    categoria: z.enum(['energia_atx24', 'energia_eps', 'energia_pcie', 'video', 'sata', 'esd']),
    interface: z.string().min(2),
  }),
});

export const PecaFerramentaSchema = PecaBaseSchema.extend({
  tipo: z.literal('ferramenta'),
  atributos: z.object({
    funcao: z.enum(['esd_protecao', 'pasta_termica', 'jump_power', 'parafusar']),
  }),
});

export const PecaInfraBancadaSchema = PecaBaseSchema.extend({
  tipo: z.enum(['bancada', 'monitor']),
  atributos: z.object({
    papel: z.string().min(2),
    entradasVideo: z.array(z.string()).optional(),
  }),
});

export const PecaSchema = z.discriminatedUnion('tipo', [
  PecaCpuSchema,
  PecaCoolerSchema,
  PecaRamSchema,
  PecaPlacaMaeSchema,
  PecaFonteSchema,
  PecaGabineteSchema,
  PecaArmazenamentoSchema,
  PecaGpuSchema,
  PecaCaboSchema,
  PecaFerramentaSchema,
  PecaInfraBancadaSchema,
]);

export const CatalogoPecasSchema = z.object({
  schemaVersion: SchemaVersionSchema,
  pecas: z.array(PecaSchema).min(1),
});

export const RegrasSchema = z.object({
  schemaVersion: SchemaVersionSchema,
  fonte: z.object({
    margemSegurancaPercentual: z.number().min(0).max(100),
  }),
  esd: z.object({
    pontuacaoMaxima: z.number().int().positive(),
    descontoPorViolacao: z.number().int().positive(),
    tiposSensiveis: z.array(z.enum(['cpu', 'ram', 'placa_mae', 'gpu', 'armazenamento'])).min(1),
  }),
  ordem: z.object({
    pontuacaoMaxima: z.number().int().positive(),
    descontoPorErro: z.number().int().positive(),
  }),
  compatibilidade: z.object({
    pontuacaoMaxima: z.number().int().positive(),
    descontoPorErro: z.number().int().positive(),
  }),
  tempo: z.object({
    pontuacaoMaxima: z.number().int().positive(),
    multiplicadorLimiteZero: z.number().positive(),
  }),
  modoGuiado: z.object({
    descontoPorDica: z.number().int().nonnegative(),
    descontoMaximoDicas: z.number().int().nonnegative(),
  }),
  aprovacao: z.object({
    notaMinima: z.number().int().min(0).max(100),
  }),
  acesso: z.object({
    tentativasMaximas: z.number().int().positive(),
    bloqueioMinutos: z.number().int().positive(),
    expiracaoSessaoMinutos: z.number().int().positive(),
    tamanhoMinimoSenha: z.number().int().min(8),
  }),
  niveis: z
    .array(
      z.object({
        nome: z.string().min(2),
        pontosMinimos: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

export const PassoMissaoSchema = z.object({
  id: z.string().min(2),
  descricao: z.string().min(5),
  preRequisitos: z.array(z.string()),
  acaoEsperada: z.object({
    tipo: z.enum([
      'vestir_esd',
      'encaixar',
      'aplicar_pasta',
      'conectar_cabo',
      'desligar_fonte',
      'ligar_fonte',
      'jump_power',
      'inspecionar',
    ]),
    peca: z.string().min(1),
    em: z.string().min(1),
  }),
  dica: z.string().min(5).optional(),
});

export const CartaoPedagogicoSchema = z.object({
  tipo: z.enum([
    'atencao',
    'seguranca',
    'erros_frequentes',
    'dica_profissional',
    'conexao_fgb',
    'curiosidade',
    'desafio',
  ]),
  gatilhoPassoId: z.string().min(1),
  titulo: z.string().min(3),
  conteudo: z.string().min(10),
  areaFgb: z.enum(['Fisica', 'Matematica', 'Lingua Portuguesa', 'Ingles Tecnico']).optional(),
});

export const MissaoSchema = z.object({
  schemaVersion: SchemaVersionSchema,
  id: z.string().regex(/^M\d{2}$/, 'id da missão deve seguir o padrão M00, M01...'),
  titulo: z.string().min(5),
  trilha: z.enum([
    'montagem_hardware',
    'instalacao_software',
    'instalacao_so',
    'configuracao',
    'diagnostico',
    'reparo_hardware',
  ]),
  versao: z.enum(['MVP', 'V1', 'V2', 'V3', 'V4', 'V5']),
  etiqueta: z.object({
    modulo: z.string().min(2),
    aulas: z.array(z.number().int().positive()).min(1),
  }),
  ordemServico: z.object({
    cliente: z.string().min(3),
    equipamento: z.string().min(3),
    relato: z.string().min(10),
  }),
  conhecimentosPrevios: z
    .array(
      z.object({
        id: z.string().min(2),
        pergunta: z.string().min(5),
        opcoes: z.array(z.string().min(1)).min(2),
        correta: z.number().int().nonnegative(),
        explicacao: z.string().min(5),
      }),
    )
    .min(1),
  microaula: z.object({
    titulo: z.string().min(5),
    topicos: z.array(z.string().min(5)).min(1),
    glossario: z
      .array(
        z.object({
          termo: z.string().min(2),
          definicao: z.string().min(5),
        }),
      )
      .min(1),
  }),
  pecasDisponiveis: z.array(z.string().min(1)).min(1),
  estadoInicial: z.object({
    esdColocada: z.boolean(),
    fonteLigada: z.boolean(),
    pecasInstaladas: z.array(
      z.object({
        pecaId: z.string().min(1),
        ponto: z.string().min(1),
      }),
    ),
  }),
  passos: z.array(PassoMissaoSchema).min(1),
  tempoReferenciaSeg: z.number().int().positive(),
  cartoes: z.array(CartaoPedagogicoSchema),
  questoes: z.array(z.string().min(1)),
});

export const QuestaoSchema = z.object({
  id: z.string().min(3),
  missao: z.string().regex(/^M\d{2}$/),
  nivel: z.enum(['fixacao', 'compreensao', 'aplicacao', 'analise', 'projeto', 'integracao']),
  enunciado: z.string().min(10),
  opcoes: z.array(z.string().min(1)).min(2),
  correta: z.number().int().nonnegative(),
  explicacao: z.string().min(5),
  tags: z.array(z.string().min(2)).min(1),
});

export const CatalogoQuestoesSchema = z.object({
  schemaVersion: SchemaVersionSchema,
  questoes: z.array(QuestaoSchema).min(1),
});

export const InsigniaSchema = z.object({
  id: z.string().min(3),
  nome: z.string().min(3),
  descricao: z.string().min(10),
  criterio: z.string().min(5),
  textoAlternativo: z.string().min(10),
});

export const CatalogoInsigniasSchema = z.object({
  schemaVersion: SchemaVersionSchema,
  insignias: z.array(InsigniaSchema).min(1),
});

export type Peca = z.infer<typeof PecaSchema>;
export type CatalogoPecas = z.infer<typeof CatalogoPecasSchema>;
export type RegrasConfig = z.infer<typeof RegrasSchema>;
export type Missao = z.infer<typeof MissaoSchema>;
export type Questao = z.infer<typeof QuestaoSchema>;
export type Insignia = z.infer<typeof InsigniaSchema>;
