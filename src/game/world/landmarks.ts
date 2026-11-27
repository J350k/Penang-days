import * as THREE from 'three';
import { attachOutline, createToonMaterial } from './toonMaterials';
import type { AABB } from '../types';

export interface TrafficLightPhase {
  ewGreen: boolean; // True when E-W roads have green light (N-S red)
  nsGreen: boolean; // True when N-S roads have green light (E-W red)
}

export interface LandmarksResult {
  group: THREE.Group;
  colliders: AABB[];
  photoSpots: Array<{ id: string; x: number; z: number; labelZh: string; labelEn: string }>;
  neonSignMaterials: THREE.MeshBasicMaterial[];
  updateLandmarks: (elapsedSec: number) => TrafficLightPhase;
  dispose: () => void;
}

function createMuralTexture(variant: 'bicycle' | 'cat' | 'boy'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#efe5d2';
  ctx.fillRect(0, 0, 256, 192);
  ctx.fillStyle = 'rgba(180, 155, 120, 0.18)';
  ctx.fillRect(0, 148, 256, 44);

  if (variant === 'bicycle') {
    ctx.strokeStyle = '#2d3a4b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(82, 138, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(174, 138, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(82, 138);
    ctx.lineTo(124, 102);
    ctx.lineTo(164, 102);
    ctx.lineTo(174, 138);
    ctx.moveTo(124, 102);
    ctx.lineTo(128, 138);
    ctx.stroke();

    ctx.fillStyle = '#d96b4e';
    ctx.fillRect(108, 62, 24, 38);
    ctx.fillStyle = '#4c8c88';
    ctx.fillRect(142, 72, 20, 30);
    ctx.fillStyle = '#f2c197';
    ctx.beginPath();
    ctx.arc(120, 48, 13, 0, Math.PI * 2);
    ctx.arc(152, 59, 11, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant === 'cat') {
    ctx.fillStyle = '#e0843c';
    ctx.beginPath();
    ctx.arc(128, 116, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(128, 68, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(104, 48);
    ctx.lineTo(114, 24);
    ctx.lineTo(124, 44);
    ctx.moveTo(132, 44);
    ctx.lineTo(142, 24);
    ctx.lineTo(152, 48);
    ctx.fill();
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.arc(116, 66, 4, 0, Math.PI * 2);
    ctx.arc(140, 66, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4c8c88';
    ctx.fillRect(46, 152, 164, 10);
  } else {
    ctx.fillStyle = '#3d7a75';
    ctx.fillRect(24, 28, 208, 120);
    ctx.fillStyle = '#f3d98b';
    ctx.beginPath();
    ctx.arc(82, 76, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d95d47';
    ctx.beginPath();
    ctx.arc(166, 102, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#faf3e6';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GEORGE TOWN', 128, 174);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createRoadSignTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1f5e4b';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#faf3e6';
  ctx.lineWidth = 4;
  ctx.strokeRect(3, 3, 250, 58);
  ctx.fillStyle = '#faf3e6';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 128, 40);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function buildGeorgeTownLandmarks(): LandmarksResult {
  const group = new THREE.Group();
  const colliders: AABB[] = [];
  const textures: THREE.CanvasTexture[] = [];
  const neonSignMaterials: THREE.MeshBasicMaterial[] = [];

  const addBox = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
    collide = false,
    label?: string,
    outline = false
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (outline) {
      attachOutline(mesh, 'building', 1.016);
    }
    group.add(mesh);
    if (collide) {
      colliders.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minY: y - h / 2,
        maxY: y + h / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
        label,
      });
    }
    return mesh;
  };

  // 1. MURAL LANE STREET ART
  const murals: Array<{ x: number; y: number; z: number; rotY: number; type: 'bicycle' | 'cat' | 'boy' }> = [
    { x: -34.35, y: 2.3, z: -12.5, rotY: Math.PI / 2, type: 'bicycle' },
    { x: -34.35, y: 2.3, z: -22.0, rotY: Math.PI / 2, type: 'cat' },
    { x: -21.65, y: 2.3, z: -12.5, rotY: -Math.PI / 2, type: 'boy' },
  ];
  murals.forEach((m) => {
    const tex = createMuralTexture(m.type);
    textures.push(tex);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 3.4),
      createToonMaterial({ map: tex })
    );
    plane.position.set(m.x, m.y, m.z);
    plane.rotation.y = m.rotY;
    group.add(plane);
  });

  // 2. HERITAGE PARK
  const grassMat = createToonMaterial({ color: 0x7dbe7a });
  const stonePathMat = createToonMaterial({ color: 0xf4e3b8 });
  const woodMat = createToonMaterial({ color: 0x7b4f31 });
  const roofMat = createToonMaterial({ color: 0xc97b6b });

  const lawn = new THREE.Mesh(new THREE.BoxGeometry(28, 0.04, 16), grassMat);
  lawn.position.set(-58, 0.015, 26);
  lawn.receiveShadow = true;
  group.add(lawn);

  const parkPath = new THREE.Mesh(new THREE.BoxGeometry(28, 0.02, 3.2), stonePathMat);
  parkPath.position.set(-58, 0.035, 26);
  parkPath.receiveShadow = true;
  group.add(parkPath);

  const gazeboRoof = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.5, 6), roofMat);
  gazeboRoof.position.set(-58, 3.6, 22.5);
  gazeboRoof.castShadow = true;
  attachOutline(gazeboRoof, 'building', 1.02);
  group.add(gazeboRoof);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const gx = -58 + Math.cos(ang) * 2.1;
    const gz = 22.5 + Math.sin(ang) * 2.1;
    addBox(0.18, 2.8, 0.18, gx, 1.4, gz, woodMat, true, 'park-pillar');
  }
  for (const bx of [-65, -51]) {
    addBox(2.2, 0.48, 0.65, bx, 0.24, 29.5, woodMat, true, 'park-bench', true);
  }

  // 3. ESPLANADE PIER & SEA (expanded ocean for Gurney, Ferry, Batu Ferringhi)
  const seaMat = createToonMaterial({ color: 0x5aaec4 });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(580, 260), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.32, 200);
  group.add(sea);

  const seawallMat = createToonMaterial({ color: 0xf4e3b8 });
  addBox(188, 0.9, 1.2, 0, 0.25, 75.5, seawallMat, false);
  colliders.push({ minX: -94, maxX: 6, minY: 0, maxY: 2, minZ: 74.9, maxZ: 76.2, label: 'seawall-w' });
  colliders.push({ minX: 14, maxX: 94, minY: 0, maxY: 2, minZ: 74.9, maxZ: 76.2, label: 'seawall-e' });

  const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.26, 20.5), woodMat);
  pierDeck.position.set(10, 0.04, 82.0);
  pierDeck.receiveShadow = true;
  pierDeck.castShadow = true;
  attachOutline(pierDeck, 'building', 1.012);
  group.add(pierDeck);

  colliders.push({ minX: 5.5, maxX: 6.0, minY: 0, maxY: 2, minZ: 75, maxZ: 92.5, label: 'pier-w' });
  colliders.push({ minX: 14.0, maxX: 14.5, minY: 0, maxY: 2, minZ: 75, maxZ: 92.5, label: 'pier-e' });
  colliders.push({ minX: 5.5, maxX: 14.5, minY: 0, maxY: 2, minZ: 92.0, maxZ: 92.8, label: 'pier-end' });

  for (let pz = 77; pz <= 91; pz += 3.5) {
    addBox(0.22, 0.85, 0.22, 6.1, 0.55, pz, woodMat);
    addBox(0.22, 0.85, 0.22, 13.9, 0.55, pz, woodMat);
  }

  const boats: THREE.Group[] = [];
  for (const [bx, bz, rot] of [
    [-6, 86, 0.2],
    [22, 89, -0.3],
    [-24, 92, 0.1],
  ]) {
    const boat = new THREE.Group();
    boat.position.set(bx, -0.18, bz);
    boat.rotation.y = rot;
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 4.4), woodMat);
    attachOutline(hull, 'vehicle', 1.025);
    boat.add(hull);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.65, 1.4),
      createToonMaterial({ color: 0xf4ece1 })
    );
    cabin.position.set(0, 0.55, -0.4);
    boat.add(cabin);
    group.add(boat);
    boats.push(boat);
  }

  // 4. PETROL STATION & REPAIR BAY
  const stationCanopyMat = createToonMaterial({ color: 0xfaf3e6 });
  const stationTealMat = createToonMaterial({ color: 0x6baa8e });
  const pumpMat = createToonMaterial({ color: 0xe8a598 });

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.04, 14),
    createToonMaterial({ color: 0x8f8c8c })
  );
  pad.position.set(54, 0.015, -11);
  pad.receiveShadow = true;
  group.add(pad);

  addBox(11.5, 0.45, 7.5, 54, 4.3, -11, stationCanopyMat, false, undefined, true);
  addBox(11.7, 0.35, 7.7, 54, 4.65, -11, stationTealMat);
  for (const [px, pz] of [
    [49.5, -8.5],
    [58.5, -8.5],
    [49.5, -13.5],
    [58.5, -13.5],
  ]) {
    addBox(0.35, 4.2, 0.35, px, 2.1, pz, stationCanopyMat, true, 'gas-pillar');
  }
  for (const px of [52.2, 55.8]) {
    addBox(0.8, 1.5, 0.55, px, 0.75, -11, pumpMat, true, 'gas-pump', true);
  }
  const gasTex = createRoadSignTexture('油站修车 PETROL');
  textures.push(gasTex);
  const gasSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.85),
    new THREE.MeshBasicMaterial({ map: gasTex })
  );
  gasSign.position.set(54, 4.65, -7.12);
  group.add(gasSign);

  const neonGas = new THREE.MeshBasicMaterial({ color: 0x3de0ff, transparent: true, opacity: 0.85 });
  neonSignMaterials.push(neonGas);
  const gasNeonBar = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.08, 0.08), neonGas);
  gasNeonBar.position.set(54, 4.15, -7.12);
  group.add(gasNeonBar);

  // 5. KOMTAR-STYLE HIGHRISE & SHOPS (Fictional "Komtar Plaza" & "Pearl Motors")
  const glassTowerMat = createToonMaterial({ color: 0xbfd8e8 });
  const concreteMat = createToonMaterial({ color: 0xf4e3b8 });

  addBox(20, 7.5, 16, 74, 3.75, 44, concreteMat, true, 'komtar-podium', true);
  const komtarMain = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 6.8, 34, 12), glassTowerMat);
  komtarMain.position.set(74, 24.5, 44);
  komtarMain.castShadow = true;
  attachOutline(komtarMain, 'building', 1.012);
  group.add(komtarMain);

  const komtarCrown = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 6.6, 5.5, 12), concreteMat);
  komtarCrown.position.set(74, 44, 44);
  attachOutline(komtarCrown, 'building', 1.015);
  group.add(komtarCrown);

  // Pearl Motors Dealership (Scooters + Cars)
  const dealerColor = createToonMaterial({ color: 0xe8a598 });
  addBox(6.5, 3.6, 5.2, 64, 1.8, 31.2, concreteMat, true, 'scooter-shop', true);
  addBox(6.7, 0.45, 5.4, 64, 3.8, 31.2, dealerColor);
  const dealerTex = createRoadSignTexture('明珠车行 MOTORS');
  textures.push(dealerTex);
  const dealerSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.9),
    new THREE.MeshBasicMaterial({ map: dealerTex })
  );
  dealerSign.position.set(64, 3.8, 33.95);
  group.add(dealerSign);

  const neonDealer = new THREE.MeshBasicMaterial({ color: 0xff4fa3, transparent: true, opacity: 0.85 });
  neonSignMaterials.push(neonDealer);
  const dealerNeonBar = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.08, 0.08), neonDealer);
  dealerNeonBar.position.set(64, 3.55, 33.95);
  group.add(dealerNeonBar);

  // Outfit Boutique Shop
  const boutiqueMat = createToonMaterial({ color: 0x6baa8e });
  addBox(6.2, 3.6, 5.0, 57, 1.8, 19.2, concreteMat, true, 'outfit-shop', true);
  addBox(6.4, 0.45, 5.2, 57, 3.8, 19.2, boutiqueMat);
  const outfitTex = createRoadSignTexture('娘惹服饰 BOUTIQUE');
  textures.push(outfitTex);
  const outfitSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.9),
    new THREE.MeshBasicMaterial({ map: outfitTex })
  );
  outfitSign.position.set(57, 3.8, 21.85);
  group.add(outfitSign);

  const neonBoutique = new THREE.MeshBasicMaterial({ color: 0xffd84d, transparent: true, opacity: 0.85 });
  neonSignMaterials.push(neonBoutique);
  const boutiqueNeonBar = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.08, 0.08), neonBoutique);
  boutiqueNeonBar.position.set(57, 3.55, 21.85);
  group.add(boutiqueNeonBar);

  // 6. TRAFFIC LIGHTS, CROSSWALKS & ROAD SIGNS
  const poleMat = createToonMaterial({ color: 0x2f3438 });
  const housingMat = createToonMaterial({ color: 0x1e2124 });
  const ewRedMat = createToonMaterial({ color: 0x441111, emissive: 0xff3b30, emissiveIntensity: 0 });
  const ewGreenMat = createToonMaterial({ color: 0x114422, emissive: 0x34c759, emissiveIntensity: 1.4 });
  const nsRedMat = createToonMaterial({ color: 0x441111, emissive: 0xff3b30, emissiveIntensity: 1.4 });
  const nsGreenMat = createToonMaterial({ color: 0x114422, emissive: 0x34c759, emissiveIntensity: 0 });

  const intersections: Array<[number, number]> = [
    [28, 8.4],
    [-28, 8.4],
    [28, 42],
    [-28, 42],
  ];

  const stripeGeo = new THREE.BoxGeometry(0.45, 0.015, 2.2);
  const stripeMat = createToonMaterial({ color: 0xf7f2e6 });
  const stripeTransforms: Array<{ x: number; z: number; rotY: number }> = [];
  intersections.forEach(([ix, iz]) => {
    for (let s = -2.4; s <= 2.4; s += 1.2) {
      stripeTransforms.push({ x: ix + s, z: iz + 5.0, rotY: 0 });
      stripeTransforms.push({ x: ix + s, z: iz - 5.0, rotY: 0 });
      stripeTransforms.push({ x: ix + 5.0, z: iz + s, rotY: Math.PI / 2 });
      stripeTransforms.push({ x: ix - 5.0, z: iz + s, rotY: Math.PI / 2 });
    }

    // Place 2 traffic light poles per intersection (diagonal corners)
    for (const [ox, oz, isEW] of [
      [-4.6, -4.6, true],
      [4.6, 4.6, false],
    ] as Array<[number, number, boolean]>) {
      const px = ix + ox;
      const pz = iz + oz;
      addBox(0.16, 4.2, 0.16, px, 2.1, pz, poleMat, true, 'traffic-pole');
      addBox(0.32, 0.9, 0.32, px, 3.9, pz, housingMat);

      const rBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 8, 8),
        isEW ? ewRedMat : nsRedMat
      );
      rBulb.position.set(px, 4.15, pz + (oz > 0 ? -0.16 : 0.16));
      group.add(rBulb);

      const gBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 8, 8),
        isEW ? ewGreenMat : nsGreenMat
      );
      gBulb.position.set(px, 3.7, pz + (oz > 0 ? -0.16 : 0.16));
      group.add(gBulb);
    }
  });

  const stripeInst = new THREE.InstancedMesh(stripeGeo, stripeMat, stripeTransforms.length);
  const dummy = new THREE.Object3D();
  stripeTransforms.forEach((st, i) => {
    dummy.position.set(st.x, 0.028, st.z);
    dummy.rotation.set(0, st.rotY, 0);
    dummy.updateMatrix();
    stripeInst.setMatrixAt(i, dummy.matrix);
  });
  stripeInst.instanceMatrix.needsUpdate = true;
  stripeInst.computeBoundingSphere();
  group.add(stripeInst);

  // Heritage Street Signs
  const streetSigns: Array<{ label: string; x: number; z: number; rotY: number }> = [
    { label: 'Lebuh Armenian', x: 5.5, z: 3.9, rotY: 0 },
    { label: 'Mural Lane 壁画街', x: -22.8, z: 3.9, rotY: 0 },
    { label: 'Jalan Kapitan', x: 22.8, z: 3.9, rotY: 0 },
    { label: 'Komtar 光大商圈', x: 47.0, z: 37.0, rotY: 0 },
    { label: 'Esplanade 海边码头', x: 5.0, z: 71.0, rotY: 0 },
  ];
  streetSigns.forEach((s) => {
    const tex = createRoadSignTexture(s.label);
    textures.push(tex);
    addBox(0.08, 2.5, 0.08, s.x, 1.25, s.z, poleMat);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.45, 0.08),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    board.position.set(s.x, 2.45, s.z);
    board.rotation.y = s.rotY;
    group.add(board);
  });

  // Photo Check-In Spots (Mural Lane & Esplanade Pier)
  const photoSpots = [
    { id: 'photo-mural', x: -28, z: -13, labelZh: '壁画街打卡点', labelEn: 'Mural Lane Photo Spot' },
    { id: 'photo-pier', x: 10, z: 88, labelZh: '海边码头观景点', labelEn: 'Esplanade Pier Viewpoint' },
  ];

  // Subtle glowing rings on photo check-in spots
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf3d98b,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  photoSpots.forEach((p) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.95, 20), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.x, 0.05, p.z);
    group.add(ring);
  });

  const updateLandmarks = (elapsedSec: number): TrafficLightPhase => {
    // Gentle harbor boat bobbing
    boats.forEach((b, i) => {
      b.position.y = -0.18 + Math.sin(elapsedSec * 1.4 + i * 1.7) * 0.08;
      b.rotation.z = Math.sin(elapsedSec * 1.1 + i) * 0.035;
    });

    // 16s traffic light cycle (8s EW green, 8s NS green)
    const cycle = elapsedSec % 16;
    const ewGreen = cycle < 8;
    ewGreenMat.emissiveIntensity = ewGreen ? 1.5 : 0;
    ewRedMat.emissiveIntensity = ewGreen ? 0 : 1.5;
    nsGreenMat.emissiveIntensity = ewGreen ? 0 : 1.5;
    nsRedMat.emissiveIntensity = ewGreen ? 1.5 : 0;

    return { ewGreen, nsGreen: !ewGreen };
  };

  return {
    group,
    colliders,
    photoSpots,
    neonSignMaterials,
    updateLandmarks,
    dispose: () => {
      textures.forEach((t) => t.dispose());
    },
  };
}
