import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { EstadoBancada, PecaCatalogo } from '@virtuhar3d/rules';
import {
  buildBancadaGroup,
  buildCaboGroup,
  buildChaveFendaGroup,
  buildCoolerGroup,
  buildCpuGroup,
  buildFonteGroup,
  buildMonitorGroup,
  buildPastaTermicaGroup,
  buildPlacaMaeGroup,
  buildPulseiraEsdGroup,
  buildRamGroup,
} from './hardwareModels.js';
import {
  TRIANGLE_BUDGET_MAX,
  disposeObject3D,
  loadGlbAsset,
  type LoadedGlbAsset,
} from './gltfLoader.js';
import { detectSoftwareWebGL, isWebGLAvailable } from './webglSupport.js';

export interface BenchmarkMetrics {
  fps: number;
  triangles: number;
  calls: number;
  isSoftwareGl: boolean;
  withinTriangleBudget: boolean;
  meetsFpsTarget: boolean;
}

export interface GlbPrototypeStatus {
  loaded: boolean;
  url: string;
  triangles: number;
  snapPoints: string[];
  error?: string;
}

export const SNAP_POINTS_WORLD: Record<string, [number, number, number]> = {
  ponto_placa_mae: [-0.08, 0.012, 0.05],
  ponto_fonte: [-0.56, 0.005, -0.18],
  ponto_monitor: [0.44, 0.005, -0.26],
  ponto_aterramento: [0.39, 0.034, 0.32],
  ponto_soquete: [-0.12, 0.038, 0.03],
  ponto_ram1: [0.005, 0.042, 0.03],
  ponto_ram2: [0.035, 0.042, 0.03],
  ponto_pcie1: [-0.12, 0.04, 0.16],
  ponto_24pinos: [0.115, 0.046, 0.04],
  ponto_eps: [-0.24, 0.046, -0.105],
  ponto_cpu_fan: [-0.06, 0.032, -0.08],
  ponto_f_panel_power: [0.09, 0.04, 0.205],
  ponto_hdmi_placa: [-0.308, 0.032, -0.045],
};

const SNAP_RADIUS_METERS = 0.16;

// Vetores pré-alocados fora do loop de renderização (Zero GC)
const _offsetVec = new THREE.Vector3();
const _spherical = new THREE.Spherical();
const _dragVec = new THREE.Vector3();

function SceneEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    return () => {
      scene.environment = null;
      envTarget.dispose();
    };
  }, [gl, scene]);

  return null;
}

interface BenchmarkProbeProps {
  isSoftwareGl: boolean;
  onMetrics: (metrics: BenchmarkMetrics) => void;
}

function BenchmarkProbe({ isSoftwareGl, onMetrics }: BenchmarkProbeProps) {
  const { gl } = useThree();
  const framesRef = useRef(0);
  const elapsedRef = useRef(0);
  const onMetricsRef = useRef(onMetrics);
  onMetricsRef.current = onMetrics;

  useFrame((_, delta) => {
    framesRef.current += 1;
    elapsedRef.current += delta;

    if (elapsedRef.current >= 0.35) {
      const fps = Math.round(framesRef.current / elapsedRef.current);
      const triangles = gl.info.render.triangles;
      const calls = gl.info.render.calls;
      onMetricsRef.current({
        fps,
        triangles,
        calls,
        isSoftwareGl,
        withinTriangleBudget: triangles <= TRIANGLE_BUDGET_MAX,
        meetsFpsTarget: fps >= 30,
      });
      framesRef.current = 0;
      elapsedRef.current = 0;
    }
  });

  return null;
}

interface CameraRigProps {
  isSoftwareGl: boolean;
  controlsRef: React.RefObject<ComponentRef<typeof OrbitControls> | null>;
}

function CameraRig({ isSoftwareGl, controlsRef }: CameraRigProps) {
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[0, 0.06, 0.02]}
      enableDamping={!isSoftwareGl}
      dampingFactor={0.07}
      minDistance={0.45}
      maxDistance={2.5}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI * 0.47}
    />
  );
}

interface DisposableGroupProps {
  group: THREE.Group;
  position?: [number, number, number];
  highlighted?: boolean;
  onSelect?: () => void;
  onHover?: (hovered: boolean) => void;
}

function HardwareGroupMesh({
  group,
  position = [0, 0, 0],
  highlighted = false,
  onSelect,
  onHover,
}: DisposableGroupProps) {
  useEffect(() => {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        if (highlighted) {
          obj.material.emissive.set('#0ea5e9');
          obj.material.emissiveIntensity = 0.35;
        } else {
          obj.material.emissive.set('#000000');
          obj.material.emissiveIntensity = 0;
        }
      }
    });
  }, [group, highlighted]);

  useEffect(() => {
    return () => {
      disposeObject3D(group);
    };
  }, [group]);

  return (
    <primitive
      object={group}
      position={position}
      onClick={(e: { stopPropagation: () => void }) => {
        if (onSelect) {
          e.stopPropagation();
          onSelect();
        }
      }}
      onPointerOver={(e: { stopPropagation: () => void }) => {
        if (onHover) {
          e.stopPropagation();
          onHover(true);
        }
      }}
      onPointerOut={() => {
        if (onHover) {
          onHover(false);
        }
      }}
    />
  );
}

function buildInstalledGroup(
  pecaId: string,
  estado: EstadoBancada,
  statusMonitor: string,
): THREE.Group | null {
  switch (pecaId) {
    case 'bancada-esd':
      return buildBancadaGroup();
    case 'monitor-virtual':
      return buildMonitorGroup(estado.postExibido, statusMonitor);
    case 'placa-mae-lga1151':
      return buildPlacaMaeGroup();
    case 'cpu-lga1151-i3':
      return buildCpuGroup(false);
    case 'cpu-am4-ryzen':
      return buildCpuGroup(true);
    case 'cooler-lga1151':
      return buildCoolerGroup();
    case 'ram-ddr4-8gb':
      return buildRamGroup(false);
    case 'ram-ddr3-4gb':
      return buildRamGroup(true);
    case 'fonte-500w':
      return buildFonteGroup(estado.fonteLigada);
    case 'cabo-atx-24p':
      return buildCaboGroup('#f59e0b', 0.24);
    case 'cabo-eps-8p':
      return buildCaboGroup('#eab308', 0.2);
    case 'cabo-video-hdmi':
      return buildCaboGroup('#38bdf8', 0.26);
    case 'pulseira-esd':
      return buildPulseiraEsdGroup();
    case 'chave-fenda':
      return buildChaveFendaGroup();
    default:
      return null;
  }
}

export interface BancadaSceneProps {
  estado: EstadoBancada;
  catalogo: Record<string, PecaCatalogo>;
  selectedPecaId: string | null;
  activeSnapPoint: string | null;
  hoveredLabel: string | null;
  statusMonitor: string;
  onHoverChange: (label: string | null) => void;
  onSelectInstalled: (ponto: string, pecaId: string) => void;
  onSnapAttempt: (pecaId: string, ponto: string) => void;
  onCancelSelection: () => void;
  onMetrics: (metrics: BenchmarkMetrics) => void;
  onGlbStatus: (status: GlbPrototypeStatus) => void;
}

export function BancadaScene({
  estado,
  catalogo,
  selectedPecaId,
  activeSnapPoint,
  statusMonitor,
  onHoverChange,
  onSelectInstalled,
  onSnapAttempt,
  onCancelSelection,
  onMetrics,
  onGlbStatus,
}: BancadaSceneProps) {
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);
  const webglReady = useMemo(() => isWebGLAvailable(), []);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [hoveredInstalledPonto, setHoveredInstalledPonto] = useState<string | null>(null);
  const [nearestSnapPonto, setNearestSnapPonto] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(null);
  const [glbAsset, setGlbAsset] = useState<LoadedGlbAsset | null>(null);

  // Carrega o modelo GLB protótipo com MeshoptDecoder na inicialização (Marco M1)
  useEffect(() => {
    let cancelled = false;
    const url = '/modelos/teste/cpu-teste.glb';

    loadGlbAsset(url)
      .then((loaded) => {
        if (cancelled) {
          disposeObject3D(loaded.scene);
          return;
        }
        setGlbAsset(loaded);
        onGlbStatus({
          loaded: true,
          url,
          triangles: loaded.triangles,
          snapPoints: loaded.snapPoints,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        onGlbStatus({
          loaded: false,
          url,
          triangles: 0,
          snapPoints: [],
          error: err instanceof Error ? err.message : 'Falha ao carregar GLB',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [onGlbStatus]);

  useEffect(() => {
    return () => {
      if (glbAsset) {
        disposeObject3D(glbAsset.scene);
      }
    };
  }, [glbAsset]);

  // Limpa ghost quando nenhuma peça está selecionada
  useEffect(() => {
    if (!selectedPecaId) {
      setGhostPos(null);
      setNearestSnapPonto(null);
    }
  }, [selectedPecaId]);

  const orbitByKeyboard = useCallback((dAzimuth: number, dPolar: number, dZoom: number) => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }
    const camera = controls.object;
    _offsetVec.copy(camera.position).sub(controls.target);
    _spherical.setFromVector3(_offsetVec);

    _spherical.theta += dAzimuth;
    _spherical.phi = Math.max(0.2, Math.min(Math.PI * 0.47, _spherical.phi + dPolar));
    _spherical.radius = Math.max(0.45, Math.min(2.5, _spherical.radius + dZoom));

    _offsetVec.setFromSpherical(_spherical);
    camera.position.copy(controls.target).add(_offsetVec);
    controls.update();
  }, []);

  const handleViewportKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      orbitByKeyboard(0.12, 0, 0);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      orbitByKeyboard(-0.12, 0, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      orbitByKeyboard(0, -0.08, 0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      orbitByKeyboard(0, 0.08, 0);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      orbitByKeyboard(0, 0, -0.14);
    } else if (e.key === '-') {
      e.preventDefault();
      orbitByKeyboard(0, 0, 0.14);
    } else if (e.key === ' ' && selectedPecaId && activeSnapPoint) {
      e.preventDefault();
      onSnapAttempt(selectedPecaId, activeSnapPoint);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelSelection();
    }
  };

  const handlePlanePointerMove = (point: THREE.Vector3) => {
    if (!selectedPecaId) {
      return;
    }
    setGhostPos([point.x, 0.06, point.z]);

    let closestPonto: string | null = null;
    let closestDist = SNAP_RADIUS_METERS;

    for (const [pontoId, coords] of Object.entries(SNAP_POINTS_WORLD)) {
      if (pontoId === 'ponto_placa_mae' || pontoId === 'ponto_monitor') {
        continue;
      }
      _dragVec.set(coords[0], 0.06, coords[2]);
      const dist = _dragVec.distanceTo(point.setY(0.06));
      if (dist < closestDist) {
        closestDist = dist;
        closestPonto = pontoId;
      }
    }
    setNearestSnapPonto(closestPonto);
  };

  const handlePlaneClick = () => {
    if (!selectedPecaId) {
      return;
    }
    if (nearestSnapPonto) {
      onSnapAttempt(selectedPecaId, nearestSnapPonto);
    } else {
      // Soltar fora de qualquer ponto válido retorna sem erro (US-04)
      onCancelSelection();
    }
  };

  const installedEntries = useMemo(() => {
    const entries: Array<{ ponto: string; pecaId: string; group: THREE.Group }> = [];
    for (const [ponto, pecaId] of Object.entries(estado.instaladas)) {
      const group = buildInstalledGroup(pecaId, estado, statusMonitor);
      if (group) {
        entries.push({ ponto, pecaId, group });
      }
    }
    if (estado.esdColocada) {
      const esdGroup = buildPulseiraEsdGroup();
      entries.push({ ponto: 'ponto_aterramento', pecaId: 'pulseira-esd', group: esdGroup });
    }
    if (estado.pastaTermicaAplicada) {
      const pastaGroup = buildPastaTermicaGroup();
      entries.push({ ponto: 'ponto_pasta_visual', pecaId: 'pasta-termica', group: pastaGroup });
    }
    return entries;
  }, [estado, statusMonitor]);

  const snapPointsVisiveis = useMemo(() => {
    const lista: Array<{ pontoId: string; coords: [number, number, number] }> = [];
    const pecaSel = selectedPecaId ? catalogo[selectedPecaId] : undefined;
    for (const [pontoId, coords] of Object.entries(SNAP_POINTS_WORLD)) {
      if (pontoId === 'ponto_placa_mae' || pontoId === 'ponto_monitor') {
        continue;
      }
      if (
        !pecaSel ||
        pecaSel.pontosDeEncaixe.includes(pontoId) ||
        pontoId === activeSnapPoint ||
        pontoId === nearestSnapPonto
      ) {
        lista.push({ pontoId, coords });
      }
    }
    return lista;
  }, [selectedPecaId, catalogo, activeSnapPoint, nearestSnapPonto]);

  if (!webglReady || contextLost) {
    return (
      <div
        role="region"
        aria-label="Visualização alternativa da bancada 3D"
        className="flex h-full w-full flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-200"
      >
        <p className="text-base font-semibold">
          Contexto WebGL indisponível neste navegador ou reiniciando GPU.
        </p>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Você pode continuar a montagem usando a lista de peças e os pontos de encaixe acessíveis
          por teclado.
        </p>
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      role="application"
      aria-label="Cena 3D da bancada de montagem. Use as setas para girar a câmera, + e - para zoom, Tab e Enter para escolher peças, Espaço para encaixar."
      onKeyDown={handleViewportKeyDown}
      className="relative h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <Canvas
        dpr={isSoftwareGl ? 1 : [1, 2]}
        shadows={false}
        camera={{ position: [0.65, 0.72, 0.92], fov: 42, near: 0.05, far: 25 }}
        gl={{
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.domElement.addEventListener('webglcontextlost', (ev) => {
            ev.preventDefault();
            setContextLost(true);
          });
          gl.domElement.addEventListener('webglcontextrestored', () => {
            setContextLost(false);
          });
        }}
      >
        <color attach="background" args={['#0b1120']} />
        <fog attach="fog" args={['#0b1120', 2.4, 6.5]} />

        <SceneEnvironment />
        <BenchmarkProbe isSoftwareGl={isSoftwareGl} onMetrics={onMetrics} />
        <CameraRig isSoftwareGl={isSoftwareGl} controlsRef={controlsRef} />

        {/* Iluminação de estúdio leve (sem shadowMaps dinâmicos, compatível com GT 710) */}
        <hemisphereLight args={['#dbeafe', '#1e293b', 0.85]} />
        <directionalLight position={[1.4, 2.2, 1.5]} intensity={1.7} color="#fff7ed" />
        <directionalLight position={[-1.5, 1.2, -1.2]} intensity={0.65} color="#7dd3fc" />

        {/* Plano de contato e captura de arrasto/proximidade sobre a bancada */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.008, 0]}
          onPointerMove={(e) => handlePlanePointerMove(e.point)}
          onClick={handlePlaneClick}
        >
          <planeGeometry args={[1.6, 1.0]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Peças instaladas na bancada */}
        {installedEntries.map(({ ponto, pecaId, group }) => {
          const coords: [number, number, number] =
            ponto === 'bancada'
              ? [0, 0, 0]
              : ponto === 'ponto_cooler' || ponto === 'ponto_pasta_visual'
                ? (SNAP_POINTS_WORLD['ponto_soquete'] ?? [0, 0.038, 0])
                : (SNAP_POINTS_WORLD[ponto] ?? [0, 0.015, 0]);

          const pecaMeta = catalogo[pecaId];
          const isInfra = pecaId === 'bancada-esd' || pecaId === 'monitor-virtual';
          return (
            <HardwareGroupMesh
              key={`${ponto}-${pecaId}`}
              group={group}
              position={coords}
              highlighted={!isInfra && hoveredInstalledPonto === ponto}
              onSelect={
                isInfra
                  ? undefined
                  : () => {
                      onSelectInstalled(ponto, pecaId);
                    }
              }
              onHover={(hovered) => {
                if (!isInfra) {
                  setHoveredInstalledPonto(hovered ? ponto : null);
                }
                onHoverChange(hovered && pecaMeta ? pecaMeta.nome : null);
              }}
            />
          );
        })}

        {/* Amostra do arquivo .glb carregado via GLTFLoader + MeshoptDecoder (M1) */}
        {glbAsset && (
          <primitive
            object={glbAsset.scene}
            position={[0.56, 0.012, 0.3]}
            scale={[1.4, 1.4, 1.4]}
          />
        )}

        {/* Pontos de encaixe (ponto_*) com realce de proximidade */}
        {selectedPecaId &&
          snapPointsVisiveis.map(({ pontoId, coords }) => {
            const isHighlighted = pontoId === nearestSnapPonto || pontoId === activeSnapPoint;
            return (
              <mesh
                key={pontoId}
                position={[coords[0], coords[1] + 0.012, coords[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={(e) => {
                  e.stopPropagation();
                  onSnapAttempt(selectedPecaId, pontoId);
                }}
              >
                <ringGeometry
                  args={[isHighlighted ? 0.022 : 0.016, isHighlighted ? 0.036 : 0.026, 24]}
                />
                <meshBasicMaterial
                  color={isHighlighted ? '#22d3ee' : '#94a3b8'}
                  transparent
                  opacity={isHighlighted ? 0.95 : 0.55}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          })}

        {/* Indicador visual da peça sendo posicionada por proximidade */}
        {selectedPecaId && ghostPos && (
          <mesh position={nearestSnapPonto ? SNAP_POINTS_WORLD[nearestSnapPonto] : ghostPos}>
            <boxGeometry args={[0.06, 0.016, 0.06]} />
            <meshStandardMaterial
              color={nearestSnapPonto ? '#34d399' : '#38bdf8'}
              transparent
              opacity={0.55}
              roughness={0.3}
            />
          </mesh>
        )}
      </Canvas>
    </div>
  );
}
