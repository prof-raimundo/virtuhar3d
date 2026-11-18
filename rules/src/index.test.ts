import { describe, expect, it } from 'vitest';
import { MOTOR_REGRAS_VERSAO } from './index.js';

describe('@virtuhar3d/rules (Fase 1 setup)', () => {
  it('expõe a versão atual do motor de regras isolado', () => {
    expect(MOTOR_REGRAS_VERSAO).toBe('0.2.0');
  });
});
