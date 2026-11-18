import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';

const loadAsyncMock = vi.hoisted(() => vi.fn());

vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    setMeshoptDecoder = vi.fn();
    loadAsync = loadAsyncMock;
  },
}));

vi.mock('meshoptimizer/decoder', () => ({
  MeshoptDecoder: {
    ready: Promise.resolve(),
  },
}));

import {
  TRIANGLE_BUDGET_MAX,
  countTriangles,
  disposeObject3D,
  extractSnapPoints,
  loadGlbAsset,
} from './gltfLoader.js';

describe('Utilitários de GLB / Orçamento Gráfico (Documento 12)', () => {
  it('conta triângulos corretamente e extrai pontos de encaixe ponto_*', () => {
    const group = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); // 12 triângulos
    const pontoSoquete = new THREE.Object3D();
    pontoSoquete.name = 'ponto_soquete';
    const pontoRam = new THREE.Object3D();
    pontoRam.name = 'ponto_ram1';
    const ignorado = new THREE.Object3D();
    ignorado.name = 'malha_decorativa';

    group.add(box, pontoSoquete, pontoRam, ignorado);

    expect(countTriangles(group)).toBe(12);
    expect(countTriangles(group)).toBeLessThanOrEqual(TRIANGLE_BUDGET_MAX);

    const pontos = extractSnapPoints(group);
    expect(Object.keys(pontos)).toEqual(['ponto_soquete', 'ponto_ram1']);
  });

  it('carrega GLB via MeshoptDecoder e verifica orçamento de 100k triângulos', async () => {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    const ponto = new THREE.Object3D();
    ponto.name = 'ponto_soquete';
    group.add(mesh, ponto);

    loadAsyncMock.mockResolvedValueOnce({ scene: group });
    const asset = await loadGlbAsset('/modelos/teste/cpu-teste.glb');
    expect(asset.triangles).toBe(12);
    expect(asset.snapPoints).toEqual(['ponto_soquete']);
    expect(asset.withinBudget).toBe(true);

    // Malha não indexada que excede 100 mil triângulos
    const heavyGeo = new THREE.BufferGeometry();
    heavyGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array((TRIANGLE_BUDGET_MAX + 5) * 9), 3),
    );
    const heavyGroup = new THREE.Group();
    heavyGroup.add(new THREE.Mesh(heavyGeo));
    loadAsyncMock.mockResolvedValueOnce({ scene: heavyGroup });
    const heavyAsset = await loadGlbAsset('/modelos/teste/pesado.glb');
    expect(heavyAsset.withinBudget).toBe(false);
  });

  it('descarta geometria, materiais e texturas via disposeObject3D', () => {
    const geoDispose = vi.fn();
    const matDispose = vi.fn();
    const texDispose = vi.fn();

    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.dispose = geoDispose;

    const tex = new THREE.Texture();
    tex.dispose = texDispose;

    const mat = new THREE.MeshStandardMaterial({ map: tex });
    mat.dispose = matDispose;

    const mesh = new THREE.Mesh(geo, [mat]);
    disposeObject3D(mesh);

    expect(geoDispose).toHaveBeenCalledTimes(1);
    expect(matDispose).toHaveBeenCalledTimes(1);
    expect(texDispose).toHaveBeenCalledTimes(1);
  });
});
