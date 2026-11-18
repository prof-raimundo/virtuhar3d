import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CatalogoPecasSchema, MissaoSchema, RegrasSchema } from './schemas.js';
import { validateContentDirectory } from './validate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');

describe('Validação dos arquivos JSON de conteúdo (Documento 11)', () => {
  it('valida todo o catálogo oficial em /content/data incluindo integridade referencial', () => {
    const summary = validateContentDirectory(dataDir);
    expect(summary.pecasCount).toBeGreaterThanOrEqual(12);
    expect(summary.missoesCount).toBeGreaterThanOrEqual(2);
    expect(summary.questoesCount).toBeGreaterThanOrEqual(3);
    expect(summary.insigniasCount).toBeGreaterThanOrEqual(5);
  });

  it('rejeita peça com licença proprietária/inválida ou sem textoAlternativo (RNF-09 / RNF-14)', () => {
    const invalida = CatalogoPecasSchema.safeParse({
      schemaVersion: '1.0.0',
      pecas: [
        {
          id: 'cpu-teste',
          tipo: 'cpu',
          nome: 'CPU Teste',
          modelo3d: 'modelos/cpu/cpu-teste.glb',
          pontosDeEncaixe: ['ponto_soquete'],
          sensivelESD: true,
          consumoW: 65,
          atributos: { soquete: 'LGA1151' },
          descricao: 'Processador de teste',
          textoAlternativo: 'curto',
          licenca: { tipo: 'PROPRIETARY', autor: 'X', origem: 'Y' },
        },
      ],
    });
    expect(invalida.success).toBe(false);
  });

  it('rejeita regras com senha mínima abaixo de 8 caracteres (RN-19)', () => {
    const invalida = RegrasSchema.safeParse({
      schemaVersion: '1.0.0',
      fonte: { margemSegurancaPercentual: 20 },
      esd: {
        pontuacaoMaxima: 20,
        descontoPorViolacao: 10,
        tiposSensiveis: ['cpu'],
      },
      ordem: { pontuacaoMaxima: 30, descontoPorErro: 5 },
      compatibilidade: { pontuacaoMaxima: 30, descontoPorErro: 5 },
      tempo: { pontuacaoMaxima: 20, multiplicadorLimiteZero: 2 },
      modoGuiado: { descontoPorDica: 2, descontoMaximoDicas: 10 },
      aprovacao: { notaMinima: 60 },
      acesso: {
        tentativasMaximas: 5,
        bloqueioMinutos: 5,
        expiracaoSessaoMinutos: 30,
        tamanhoMinimoSenha: 4,
      },
      niveis: [{ nome: 'Aprendiz', pontosMinimos: 0 }],
    });
    expect(invalida.success).toBe(false);
  });

  it('rejeita missão com identificador fora do padrão M00..M99', () => {
    const invalida = MissaoSchema.safeParse({
      schemaVersion: '1.0.0',
      id: 'missao-1',
    });
    expect(invalida.success).toBe(false);
  });
});
