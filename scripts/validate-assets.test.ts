import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAX_GLB_BYTES, parseGlbBuffer, validateProjectAssets } from './validate-assets.js';

describe('Validador de Assets 3D (Documento 12 e RNF-02/09/14)', () => {
  it('valida catálogo pecas.json, missões M00/M01 e cpu-teste.glb dentro do orçamento', () => {
    const report = validateProjectAssets(process.cwd());
    expect(report.ok).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.pecasChecked).toBe(15);
    expect(report.glbFilesChecked).toBeGreaterThanOrEqual(1);
    expect(report.missionBudgets.length).toBe(2);
    for (const budget of report.missionBudgets) {
      expect(budget.estimatedTriangles).toBeLessThanOrEqual(100_000);
    }
  });

  it('extrai triângulos e ponto_soquete do cpu-teste.glb real', () => {
    const glbPath = path.resolve(process.cwd(), 'public/modelos/teste/cpu-teste.glb');
    const summary = parseGlbBuffer(fs.readFileSync(glbPath));
    expect(summary.bytes).toBeLessThanOrEqual(MAX_GLB_BYTES);
    expect(summary.triangles).toBe(12);
    expect(summary.snapPoints).toContain('ponto_soquete');
  });

  it('rejeita arquivo GLB corrompido ou truncado', () => {
    expect(() => parseGlbBuffer(Buffer.from('NOT_A_GLB_FILE_HEADER_1234'))).toThrow();
  });
});
