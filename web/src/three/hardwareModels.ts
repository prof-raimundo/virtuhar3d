import * as THREE from 'three';

function createEsdMatTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#17375e';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(148, 197, 255, 0.16)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 484, 484);

    ctx.fillStyle = 'rgba(186, 230, 253, 0.72)';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('TAPETE ESD · 1 MΩ ATERRADO', 28, 482);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createPcbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#101c18';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#1d3c31';
    ctx.lineWidth = 2;
    for (let i = 24; i < 490; i += 18) {
      ctx.beginPath();
      ctx.moveTo(30, i);
      ctx.lineTo(220, i);
      ctx.lineTo(240, i + 12);
      ctx.lineTo(480, i + 12);
      ctx.stroke();
    }

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('VH3D-B360M LGA1151 DDR4', 24, 34);
    ctx.font = '11px monospace';
    ctx.fillText('CPU_FAN1', 210, 88);
    ctx.fillText('DIMM_A1  DIMM_B1', 318, 92);
    ctx.fillText('ATX_24P', 418, 250);
    ctx.fillText('PWR_SW', 370, 466);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createMonitorScreenTexture(
  postAtivo: boolean,
  statusMensagem: string,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (!postAtivo) {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 512, 320);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 472, 280);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MONITOR DE BANCADA', 256, 138);
      ctx.fillStyle = '#64748b';
      ctx.font = '15px monospace';
      ctx.fillText(statusMensagem || 'Sem sinal de vídeo (aguardando POST)', 256, 174);
    } else {
      ctx.fillStyle = '#071426';
      ctx.fillRect(0, 0, 512, 320);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 0, 512, 42);
      ctx.fillStyle = '#06101f';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('VIRTUHAR3D BIOS POST v1.0', 18, 27);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '14px monospace';
      const linhas = [
        'Board : VH3D-LGA1151 (ATX / DDR4)',
        'CPU   : Core i3-8100 @ 3.60 GHz [OK]',
        'Fan   : CPU_FAN 1480 RPM [OK]',
        'RAM   : 16384 MB DDR4-2666 Dual-Channel [OK]',
        'Power : Fonte 500W Nominal (+20% Margem) [OK]',
        '',
        'POST Concluído sem erros.',
        'Pressione DEL para BIOS ou conclua a missão.',
      ];
      linhas.forEach((linha, idx) => {
        ctx.fillStyle = linha.includes('[OK]') ? '#4ade80' : '#e2e8f0';
        ctx.fillText(linha, 20, 78 + idx * 28);
      });
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createAnchor(name: string, x: number, y: number, z: number): THREE.Object3D {
  const anchor = new THREE.Object3D();
  anchor.name = name;
  anchor.position.set(x, y, z);
  return anchor;
}

export function buildBancadaGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'bancada-esd';

  const tampo = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.05, 0.95),
    new THREE.MeshStandardMaterial({ color: '#2b3441', roughness: 0.78, metalness: 0.12 }),
  );
  tampo.position.set(0, -0.025, 0);

  const molduraMetal = new THREE.Mesh(
    new THREE.BoxGeometry(1.54, 0.03, 0.99),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.35, metalness: 0.85 }),
  );
  molduraMetal.position.set(0, -0.055, 0);

  const tapeteEsd = new THREE.Mesh(
    new THREE.BoxGeometry(1.06, 0.008, 0.76),
    new THREE.MeshStandardMaterial({
      map: createEsdMatTexture(),
      roughness: 0.88,
      metalness: 0.04,
    }),
  );
  tapeteEsd.position.set(-0.08, 0.004, 0.03);

  const borneAterramento = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.024, 16),
    new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.25, metalness: 0.92 }),
  );
  borneAterramento.position.set(0.39, 0.014, 0.32);

  const pinoAterramento = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.02, 12),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.2, metalness: 0.95 }),
  );
  pinoAterramento.position.set(0.39, 0.028, 0.32);

  group.add(
    tampo,
    molduraMetal,
    tapeteEsd,
    borneAterramento,
    pinoAterramento,
    createAnchor('ponto_placa_mae', -0.08, 0.012, 0.05),
    createAnchor('ponto_fonte', -0.56, 0.005, -0.18),
    createAnchor('ponto_monitor', 0.44, 0.005, -0.26),
    createAnchor('ponto_aterramento', 0.39, 0.034, 0.32),
  );

  return group;
}

export function buildPlacaMaeGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'placa-mae-lga1151';

  const pcb = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.012, 0.38),
    new THREE.MeshStandardMaterial({
      map: createPcbTexture(),
      roughness: 0.55,
      metalness: 0.15,
    }),
  );
  pcb.position.set(0, 0.006, 0);

  // Soquete metálico LGA1151
  const soqueteBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.095, 0.01, 0.095),
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.45, metalness: 0.3 }),
  );
  soqueteBase.position.set(-0.04, 0.017, -0.02);

  const soqueteTrava = new THREE.Mesh(
    new THREE.BoxGeometry(0.105, 0.006, 0.105),
    new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.25, metalness: 0.9 }),
  );
  soqueteTrava.position.set(-0.04, 0.022, -0.02);

  // Slots de RAM DDR4
  const ramSlotMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.65,
    metalness: 0.1,
  });
  const ramSlot1 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.018, 0.21), ramSlotMat);
  ramSlot1.position.set(0.085, 0.021, -0.02);
  const ramSlot2 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.018, 0.21), ramSlotMat);
  ramSlot2.position.set(0.115, 0.021, -0.02);

  // Conector ATX 24 pinos
  const atx24 = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.022, 0.09),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7, metalness: 0.08 }),
  );
  atx24.position.set(0.195, 0.023, -0.01);

  // Conector EPS 8 pinos
  const eps8 = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.022, 0.026),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7, metalness: 0.08 }),
  );
  eps8.position.set(-0.16, 0.023, -0.155);

  // Slot PCIe x16
  const pcie = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.016, 0.016),
    new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.3, metalness: 0.8 }),
  );
  pcie.position.set(-0.04, 0.02, 0.11);

  // Dissipador VRM e Chipset
  const vrm = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.028, 0.14),
    new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.3, metalness: 0.88 }),
  );
  vrm.position.set(-0.175, 0.026, -0.02);

  // Bateria CR2032
  const cmos = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.006, 20),
    new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.18, metalness: 0.95 }),
  );
  cmos.position.set(0.08, 0.015, 0.12);

  // Pinos F_PANEL PWR_SW (2 pinos dourados visíveis)
  const pinMat = new THREE.MeshStandardMaterial({
    color: '#facc15',
    roughness: 0.2,
    metalness: 0.95,
  });
  const pino1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.016, 8), pinMat);
  pino1.position.set(0.165, 0.02, 0.155);
  const pino2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.016, 8), pinMat);
  pino2.position.set(0.175, 0.02, 0.155);

  // Saída HDMI traseira
  const hdmi = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.016, 0.036),
    new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.25, metalness: 0.9 }),
  );
  hdmi.position.set(-0.218, 0.02, -0.095);

  group.add(
    pcb,
    soqueteBase,
    soqueteTrava,
    ramSlot1,
    ramSlot2,
    atx24,
    eps8,
    pcie,
    vrm,
    cmos,
    pino1,
    pino2,
    hdmi,
    createAnchor('ponto_soquete', -0.04, 0.026, -0.02),
    createAnchor('ponto_ram1', 0.085, 0.03, -0.02),
    createAnchor('ponto_ram2', 0.115, 0.03, -0.02),
    createAnchor('ponto_pcie1', -0.04, 0.028, 0.11),
    createAnchor('ponto_24pinos', 0.195, 0.034, -0.01),
    createAnchor('ponto_eps', -0.16, 0.034, -0.155),
    createAnchor('ponto_cpu_fan', 0.02, 0.02, -0.13),
    createAnchor('ponto_f_panel_power', 0.17, 0.028, 0.155),
    createAnchor('ponto_hdmi_placa', -0.228, 0.02, -0.095),
  );

  return group;
}

export function buildCpuGroup(isAm4: boolean): THREE.Group {
  const group = new THREE.Group();
  group.name = isAm4 ? 'cpu-am4-ryzen' : 'cpu-lga1151-i3';

  const pcbColor = isAm4 ? '#166534' : '#0f766e';
  const substrato = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.004, 0.072),
    new THREE.MeshStandardMaterial({ color: pcbColor, roughness: 0.5, metalness: 0.15 }),
  );
  substrato.position.y = 0.002;

  const ihs = new THREE.Mesh(
    new THREE.BoxGeometry(0.058, 0.005, 0.058),
    new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.22, metalness: 0.92 }),
  );
  ihs.position.y = 0.0065;

  const triangulo = new THREE.Mesh(
    new THREE.ConeGeometry(0.005, 0.002, 3),
    new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.2, metalness: 0.95 }),
  );
  triangulo.position.set(-0.028, 0.005, 0.028);

  group.add(substrato, ihs, triangulo);
  return group;
}

export function buildPastaTermicaGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'pasta-termica';

  const gota = new THREE.Mesh(
    new THREE.SphereGeometry(0.009, 14, 10),
    new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.35, metalness: 0.3 }),
  );
  gota.scale.set(1, 0.45, 1);
  gota.position.y = 0.009;

  const anel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.002, 16),
    new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.4, metalness: 0.2 }),
  );
  anel.position.y = 0.007;

  group.add(gota, anel);
  return group;
}

export function buildCoolerGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'cooler-lga1151';

  const baseCobre = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.008, 20),
    new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.25, metalness: 0.92 }),
  );
  baseCobre.position.y = 0.012;

  const blocoAletas = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.048, 0.038, 24),
    new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.3, metalness: 0.85 }),
  );
  blocoAletas.position.y = 0.035;

  const molduraFan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.054, 0.054, 0.016, 24),
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6, metalness: 0.15 }),
  );
  molduraFan.position.y = 0.062;

  const cuboFan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.018, 16),
    new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.4, metalness: 0.3 }),
  );
  cuboFan.position.y = 0.063;

  group.add(baseCobre, blocoAletas, molduraFan, cuboFan);
  return group;
}

export function buildRamGroup(isDdr3: boolean): THREE.Group {
  const group = new THREE.Group();
  group.name = isDdr3 ? 'ram-ddr3-4gb' : 'ram-ddr4-8gb';

  const pcb = new THREE.Mesh(
    new THREE.BoxGeometry(0.007, 0.046, 0.195),
    new THREE.MeshStandardMaterial({
      color: isDdr3 ? '#15803d' : '#1e293b',
      roughness: 0.55,
      metalness: 0.15,
    }),
  );
  pcb.position.y = 0.023;

  const dissipador = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.036, 0.19),
    new THREE.MeshStandardMaterial({
      color: isDdr3 ? '#64748b' : '#0284c7',
      roughness: 0.28,
      metalness: 0.82,
    }),
  );
  dissipador.position.y = 0.029;

  const contatos = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.008, 0.19),
    new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.2, metalness: 0.95 }),
  );
  contatos.position.y = 0.004;

  group.add(pcb, dissipador, contatos);
  return group;
}

export function buildFonteGroup(ligada: boolean): THREE.Group {
  const group = new THREE.Group();
  group.name = 'fonte-500w';

  const chassi = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.12, 0.22),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.45, metalness: 0.65 }),
  );
  chassi.position.y = 0.06;

  const grade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.008, 20),
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.7, metalness: 0.4 }),
  );
  grade.position.set(0, 0.122, 0);

  const etiqueta = new THREE.Mesh(
    new THREE.BoxGeometry(0.004, 0.075, 0.15),
    new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.5, metalness: 0.15 }),
  );
  etiqueta.position.set(0.101, 0.065, 0);

  const chave = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.026, 0.012),
    new THREE.MeshStandardMaterial({
      color: ligada ? '#22c55e' : '#ef4444',
      emissive: ligada ? '#15803d' : '#7f1d1d',
      emissiveIntensity: 0.5,
      roughness: 0.4,
      metalness: 0.1,
    }),
  );
  chave.position.set(0.05, 0.055, 0.114);

  group.add(chassi, grade, etiqueta, chave);
  return group;
}

export function buildMonitorGroup(postAtivo: boolean, statusMensagem: string): THREE.Group {
  const group = new THREE.Group();
  group.name = 'monitor-virtual';

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.016, 0.18),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.45, metalness: 0.5 }),
  );
  base.position.y = 0.008;

  const haste = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.14, 0.03),
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.7 }),
  );
  haste.position.set(0, 0.08, -0.03);

  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.29, 0.024),
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.55, metalness: 0.2 }),
  );
  moldura.position.set(0, 0.23, 0);

  const tela = new THREE.Mesh(
    new THREE.PlaneGeometry(0.43, 0.26),
    new THREE.MeshStandardMaterial({
      map: createMonitorScreenTexture(postAtivo, statusMensagem),
      emissive: postAtivo ? '#0c4a6e' : '#020617',
      emissiveIntensity: postAtivo ? 0.35 : 0.1,
      roughness: 0.25,
      metalness: 0.05,
    }),
  );
  tela.position.set(0, 0.23, 0.013);

  group.add(base, haste, moldura, tela, createAnchor('ponto_hdmi_monitor', -0.08, 0.12, -0.016));
  group.rotation.y = -0.32;
  return group;
}

export function buildCaboGroup(corHex: string, comprimento = 0.22): THREE.Group {
  const group = new THREE.Group();
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.04, 0.06, -0.03),
    new THREE.Vector3(-comprimento * 0.6, 0.08, -0.07),
    new THREE.Vector3(-comprimento, 0.02, -0.1),
  ]);
  const tubo = new THREE.Mesh(
    new THREE.TubeGeometry(curva, 16, 0.008, 8, false),
    new THREE.MeshStandardMaterial({ color: corHex, roughness: 0.65, metalness: 0.1 }),
  );
  const plugue = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.022, 0.032),
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6, metalness: 0.15 }),
  );
  group.add(tubo, plugue);
  return group;
}

export function buildPulseiraEsdGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'pulseira-esd';

  const garra = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.016, 0.036),
    new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.45, metalness: 0.25 }),
  );
  garra.position.y = 0.008;

  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.012, 0.015),
    new THREE.Vector3(0.06, 0.03, 0.07),
    new THREE.Vector3(0.12, 0.015, 0.12),
  ]);
  const fio = new THREE.Mesh(
    new THREE.TubeGeometry(curva, 16, 0.004, 8, false),
    new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.55, metalness: 0.1 }),
  );

  const faixa = new THREE.Mesh(
    new THREE.TorusGeometry(0.034, 0.008, 10, 20),
    new THREE.MeshStandardMaterial({ color: '#0369a1', roughness: 0.75, metalness: 0.05 }),
  );
  faixa.rotation.x = Math.PI / 2;
  faixa.position.set(0.14, 0.01, 0.13);

  group.add(garra, fio, faixa);
  return group;
}

export function buildChaveFendaGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'chave-fenda';

  const ponta = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.003, 0.11, 10),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.2, metalness: 0.95 }),
  );
  ponta.position.y = 0.055;

  const cabo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.013, 0.09, 14),
    new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.55, metalness: 0.08 }),
  );
  cabo.position.y = 0.15;

  group.add(ponta, cabo);
  group.rotation.z = -0.32;
  return group;
}
