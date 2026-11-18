import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer/decoder';

export const TRIANGLE_BUDGET_MAX = 100_000;

let sharedLoaderPromise: Promise<GLTFLoader> | null = null;

export async function getConfiguredGltfLoader(): Promise<GLTFLoader> {
  if (!sharedLoaderPromise) {
    sharedLoaderPromise = (async () => {
      THREE.Cache.enabled = true;
      await MeshoptDecoder.ready;
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      return loader;
    })();
  }
  return sharedLoaderPromise;
}

export function countTriangles(root: THREE.Object3D): number {
  let triangles = 0;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const geo = obj.geometry;
      if (geo.index) {
        triangles += Math.floor(geo.index.count / 3);
      } else {
        const pos = geo.getAttribute('position');
        if (pos) {
          triangles += Math.floor(pos.count / 3);
        }
      }
    }
  });
  return triangles;
}

export function extractSnapPoints(root: THREE.Object3D): Record<string, THREE.Object3D> {
  const pontos: Record<string, THREE.Object3D> = {};
  root.traverse((obj) => {
    if (obj.name.startsWith('ponto_')) {
      pontos[obj.name] = obj;
    }
  });
  return pontos;
}

export interface LoadedGlbAsset {
  scene: THREE.Group;
  triangles: number;
  snapPoints: string[];
  withinBudget: boolean;
}

export async function loadGlbAsset(url: string): Promise<LoadedGlbAsset> {
  const loader = await getConfiguredGltfLoader();
  const gltf = await loader.loadAsync(url);
  const triangles = countTriangles(gltf.scene);
  const snapPoints = Object.keys(extractSnapPoints(gltf.scene));

  return {
    scene: gltf.scene,
    triangles,
    snapPoints,
    withinBudget: triangles <= TRIANGLE_BUDGET_MAX,
  };
}

export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of materials) {
        if (mat) {
          if ('map' in mat && mat.map instanceof THREE.Texture) {
            mat.map.dispose();
          }
          mat.dispose();
        }
      }
    }
  });
}
