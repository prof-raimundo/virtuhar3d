import { describe, expect, it } from 'vitest';
import { renderTraceabilityMarkdown, verifyTraceabilityMatrix } from './traceability-report.js';

describe('Matriz de Rastreabilidade MVP (Documento 14, Seção 3)', () => {
  it('garante cobertura automatizada verificável para todas as histórias US-01 a US-11, US-21 e US-22', () => {
    const result = verifyTraceabilityMatrix(process.cwd());
    expect(result.missingMatches).toEqual([]);
    expect(result.uncoveredMvpStories).toEqual([]);
    expect(result.ok).toBe(true);

    const md = renderTraceabilityMarkdown();
    expect(md).toContain('# Matriz de Rastreabilidade MVP — VIRTUHAR3D');
    expect(md).toContain('US-22');
  });
});
