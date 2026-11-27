import * as THREE from 'three';
import { createMotorcycleGroup, createStreetlampGroup } from './props';
import { attachOutline, createToonMaterial } from './toonMaterials';
import type { ProceduralTextureSet } from './textures';
import type { AABB } from '../types';

export interface WorldChunk {
  group: THREE.Group;
  centerX: number;
  centerZ: number;
}

export interface GeorgeTownStreetsResult {
  group: THREE.Group;
  colliders: AABB[];
  streetLampBulbMaterials: THREE.MeshToonMaterial[];
  streetLanternMaterial: THREE.MeshToonMaterial;
  windowGlowMaterials: THREE.MeshToonMaterial[];
  roadMaterial: THREE.MeshToonMaterial;
  neonReflectionMats: THREE.MeshBasicMaterial[];
  neonSignMaterials: THREE.MeshBasicMaterial[];
  nightPointLights: THREE.PointLight[];
  chunks: WorldChunk[];
}

// Part A Warm Toon Penang Shophouse Palette
const HERITAGE_PALETTE = [
  0xe8a598, // 粉
  0xf4e3b8, // 奶黄
  0xa8d5ba, // 薄荷绿
  0xbfd8e8, // 浅蓝
];

const NEON_COLORS = [0xff4fa3, 0x3de0ff, 0xffd84d];

interface ShophouseSpec {
  x: number;
  z: number;
  width: number;
  depth: number;
  rotY: number;
  colorHex: number;
}

export function buildGeorgeTownStreets(textures: ProceduralTextureSet): GeorgeTownStreetsResult {
  const group = new THREE.Group();
  const colliders: AABB[] = [];
  const streetLampBulbMaterials: THREE.MeshToonMaterial[] = [];
  const nightPointLights: THREE.PointLight[] = [];
  const neonReflectionMats: THREE.MeshBasicMaterial[] = [];
  const neonSignMaterials: THREE.MeshBasicMaterial[] = [];

  // Shared Toon Materials (Part A Palette)
  const groundMat = createToonMaterial({ color: 0xc9b99b });
  const sidewalkMat = createToonMaterial({ color: 0xdfd1b8 });
  const roadMaterial = createToonMaterial({
    map: textures.roadAsphalt,
    color: 0x8f8c8c,
  });
  const laneMarkMat = createToonMaterial({ color: 0xf4e3b8 });
  const trimMat = createToonMaterial({ color: 0xfaf3e6 });
  const shutterMat = createToonMaterial({ color: 0x6baa8e });
  const roofMat = createToonMaterial({ color: 0xc97b6b });

  const windowWarmMat = createToonMaterial({
    color: 0xefe7d6,
    emissive: 0xffc857,
    emissiveIntensity: 0.1,
  });
  const windowCyanMat = createToonMaterial({
    color: 0xdff6fa,
    emissive: 0x3de0ff,
    emissiveIntensity: 0.08,
  });
  const windowGlowMaterials = [windowWarmMat, windowCyanMat];

  const streetLanternMaterial = createToonMaterial({
    color: 0xff5a5f,
    emissive: 0xff5a5f,
    emissiveIntensity: 0.2,
  });

  // 1. Extended Terrain up to seawall (Z <= 75) & expanded outskirts
  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(520, 440), groundMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.set(0, -0.025, -45);
  terrain.receiveShadow = true;
  group.add(terrain);

  // Sidewalk base apron over George Town district (X [-94, 94], Z [-70, 75])
  const neighborhoodPad = new THREE.Mesh(new THREE.BoxGeometry(190, 0.04, 146), sidewalkMat);
  neighborhoodPad.position.set(0, -0.02, 2);
  neighborhoodPad.receiveShadow = true;
  group.add(neighborhoodPad);

  // 2. Seven Intersecting George Town Streets
  const addRoad = (w: number, d: number, x: number, z: number) => {
    const road = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), roadMaterial);
    road.position.set(x, 0.01, z);
    road.receiveShadow = true;
    group.add(road);
  };

  // E-W Streets:
  addRoad(180, 8.4, 0, 8.4);     // 1. Lebuh Armenian
  addRoad(180, 7.6, 0, 42.0);    // 2. Komtar Blvd
  addRoad(148, 7.6, 0, -40.2);   // 3. Market St
  addRoad(180, 7.6, 0, 66.0);    // 4. Esplanade Coastal Rd
  // N-S Streets:
  addRoad(7.6, 134, -28, 3);     // 5. Mural Lane
  addRoad(7.6, 134, 28, 3);      // 6. Jalan Kapitan
  addRoad(7.6, 114, 50, 13);     // 7. Komtar East Ave

  // Dashed lane markings (InstancedMesh)
  const dashGeo = new THREE.BoxGeometry(1.8, 0.01, 0.14);
  const dashPositions: Array<[number, number, number]> = [];
  for (let x = -80; x <= 80; x += 5) {
    const nearNS = Math.abs(x - 28) < 4.5 || Math.abs(x + 28) < 4.5 || Math.abs(x - 50) < 4.5;
    if (!nearNS) {
      dashPositions.push([x, 8.4, 0]);
      dashPositions.push([x, 42.0, 0]);
      dashPositions.push([x, 66.0, 0]);
      if (Math.abs(x) <= 68) dashPositions.push([x, -40.2, 0]);
    }
  }
  for (let z = -56; z <= 64; z += 5) {
    const nearEW =
      Math.abs(z - 8.4) < 4.5 ||
      Math.abs(z - 42) < 4.5 ||
      Math.abs(z + 40.2) < 4.5 ||
      Math.abs(z - 66) < 4.5;
    if (!nearEW) {
      dashPositions.push([28, z, Math.PI / 2]);
      dashPositions.push([-28, z, Math.PI / 2]);
      if (z >= -38) dashPositions.push([50, z, Math.PI / 2]);
    }
  }
  const dashInst = new THREE.InstancedMesh(dashGeo, laneMarkMat, dashPositions.length);
  const dummy = new THREE.Object3D();
  dashPositions.forEach(([dx, dz, rot], idx) => {
    dummy.position.set(dx, 0.03, dz);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    dashInst.setMatrixAt(idx, dummy.matrix);
  });
  dashInst.instanceMatrix.needsUpdate = true;
  dashInst.computeBoundingSphere();
  group.add(dashInst);

  // Night & Rain Neon Wet-Road Reflection Strips (InstancedMesh per color, zero post-process cost)
  const reflGeo = new THREE.PlaneGeometry(0.28, 3.2);
  NEON_COLORS.forEach((hex, cIdx) => {
    const rMat = new THREE.MeshBasicMaterial({
      color: hex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    neonReflectionMats.push(rMat);

    const spots: Array<[number, number, number]> = [];
    for (let x = -56 + cIdx * 7; x <= 56; x += 21) {
      spots.push([x, 6.2 + (cIdx % 2) * 4.2, 0]);
      spots.push([x + 3, 40.2 + (cIdx % 2) * 3.6, 0]);
    }
    for (let z = -28 + cIdx * 8; z <= 58; z += 24) {
      spots.push([26.2 + cIdx * 1.4, z, Math.PI / 2]);
      spots.push([-29.8 + cIdx * 1.4, z, Math.PI / 2]);
    }

    const rInst = new THREE.InstancedMesh(reflGeo, rMat, spots.length);
    spots.forEach(([sx, sz, rotY], idx) => {
      dummy.position.set(sx, 0.028, sz);
      dummy.rotation.set(-Math.PI / 2, rotY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      rInst.setMatrixAt(idx, dummy.matrix);
    });
    rInst.instanceMatrix.needsUpdate = true;
    rInst.computeBoundingSphere();
    group.add(rInst);
  });

  // 3. Spatial Chunks for Outer Shophouses
  const chunkMap = new Map<string, WorldChunk>();
  const getChunk = (x: number, z: number): THREE.Group => {
    const cx = Math.round(x / 60) * 60;
    const cz = Math.round(z / 60) * 60;
    const key = `${cx}_${cz}`;
    let ch = chunkMap.get(key);
    if (!ch) {
      const cg = new THREE.Group();
      group.add(cg);
      ch = { group: cg, centerX: cx, centerZ: cz };
      chunkMap.set(key, ch);
    }
    return ch.group;
  };

  const shophouses: ShophouseSpec[] = [];

  // North side of Armenian St
  [-74, -64, -54, -40, -18.0, -9.2, 9.2, 18.0, 39.5, 62, 72].forEach((x, i) => {
    shophouses.push({
      x,
      z: -7.0,
      width: 8.4,
      depth: 13.6,
      rotY: 0,
      colorHex: HERITAGE_PALETTE[(i + 1) % HERITAGE_PALETTE.length],
    });
  });

  // Central South block between Armenian St & Komtar Blvd
  [-17.0, -8.5, 0, 8.5, 17.0, 39.5].forEach((x, i) => {
    shophouses.push({
      x,
      z: 25.0,
      width: 8.2,
      depth: 14.5,
      rotY: Math.PI,
      colorHex: HERITAGE_PALETTE[(i + 2) % HERITAGE_PALETTE.length],
    });
  });

  // South block between Komtar Blvd & Esplanade Coastal Rd
  [-74, -64, -54, -40, -17.0, -8.5, 0, 8.5, 17.0, 39.5].forEach((x, i) => {
    shophouses.push({
      x,
      z: 53.5,
      width: 8.2,
      depth: 11.5,
      rotY: Math.PI,
      colorHex: HERITAGE_PALETTE[(i + 3) % HERITAGE_PALETTE.length],
    });
  });

  // Mural Lane & Jalan Kapitan shophouses
  [-12.5, -22.0, -31.5].forEach((z, i) => {
    shophouses.push({ x: 15.5, z, width: 9.0, depth: 11.5, rotY: Math.PI / 2, colorHex: HERITAGE_PALETTE[(i + 0) % HERITAGE_PALETTE.length] });
    shophouses.push({ x: 40.2, z, width: 9.0, depth: 11.5, rotY: -Math.PI / 2, colorHex: HERITAGE_PALETTE[(i + 1) % HERITAGE_PALETTE.length] });
    shophouses.push({ x: -40.2, z, width: 9.0, depth: 11.5, rotY: Math.PI / 2, colorHex: HERITAGE_PALETTE[(i + 2) % HERITAGE_PALETTE.length] });
    shophouses.push({ x: -15.5, z, width: 9.0, depth: 11.5, rotY: -Math.PI / 2, colorHex: HERITAGE_PALETTE[(i + 3) % HERITAGE_PALETTE.length] });
  });

  // North side of Market Street
  [-62, -52, -40, -17, -8, 1, 10, 19, 39, 58].forEach((x, i) => {
    shophouses.push({
      x,
      z: -53.0,
      width: 8.4,
      depth: 12.0,
      rotY: 0,
      colorHex: HERITAGE_PALETTE[(i + 2) % HERITAGE_PALETTE.length],
    });
  });

  const lanternPositions: Array<[number, number, number]> = [];
  const buildingMaterials = new Map<number, THREE.MeshToonMaterial>();
  const getBuildingMat = (hex: number) => {
    let mat = buildingMaterials.get(hex);
    if (!mat) {
      mat = createToonMaterial({ color: hex });
      buildingMaterials.set(hex, mat);
    }
    return mat;
  };

  // Pre-build 3 neon thin sign accent materials (#FF4FA3, #3DE0FF, #FFD84D)
  const neonBasicMats = NEON_COLORS.map((hex) => {
    const m = new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.8 });
    neonSignMaterials.push(m);
    return m;
  });
  const signBackMat = createToonMaterial({ color: 0x2b2430 });

  shophouses.forEach((spec, sIdx) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(spec.x, 0, spec.z);
    bGroup.rotation.y = spec.rotY;

    const wallMat = getBuildingMat(spec.colorHex);
    const w = spec.width;
    const d = spec.depth;

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, 6.8, d), wallMat);
    body.position.y = 3.4;
    body.castShadow = true;
    body.receiveShadow = true;
    attachOutline(body, 'building', 1.016);
    bGroup.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.55, d + 0.5), roofMat);
    roof.position.set(0, 7.05, 0.1);
    roof.castShadow = true;
    attachOutline(roof, 'building', 1.018);
    bGroup.add(roof);

    const gable = new THREE.Mesh(new THREE.CylinderGeometry(0, w * 0.58, 1.15, 4), roofMat);
    gable.rotation.y = Math.PI / 4;
    gable.scale.set(1.2, 1, d / w);
    gable.position.set(0, 7.85, 0);
    bGroup.add(gable);

    const frontZ = d / 2;
    const awning = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, 2.2), trimMat);
    awning.position.set(0, 3.25, frontZ + 1.05);
    bGroup.add(awning);

    const awningTile = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, 2.35), roofMat);
    awningTile.position.set(0, 3.55, frontZ + 1.1);
    awningTile.rotation.x = 0.2;
    bGroup.add(awningTile);

    for (const px of [-w * 0.42, w * 0.42]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.36, 3.2, 0.36), trimMat);
      col.position.set(px, 1.6, frontZ + 1.95);
      bGroup.add(col);
    }

    // Alternating #FFC857 & #3DE0FF 2F windows!
    [-w * 0.27, 0, w * 0.27].forEach((wx, wIdx) => {
      const wMat = (sIdx + wIdx) % 2 === 0 ? windowWarmMat : windowCyanMat;
      const win2F = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 0.14), wMat);
      win2F.position.set(wx, 5.05, frontZ + 0.04);
      bGroup.add(win2F);

      const shutterL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.45, 0.08), shutterMat);
      shutterL.position.set(wx - 0.72, 5.05, frontZ + 0.09);
      bGroup.add(shutterL);

      const shutterR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.45, 0.08), shutterMat);
      shutterR.position.set(wx + 0.72, 5.05, frontZ + 0.09);
      bGroup.add(shutterR);
    });

    const door1F = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.4, 0.12), shutterMat);
    door1F.position.set(0, 1.2, frontZ + 0.04);
    bGroup.add(door1F);

    // Neon Night-Market Shop Sign on every second shophouse (thin neon bars + border)
    if (sIdx % 2 === 0) {
      const neonMat = neonBasicMats[sIdx % neonBasicMats.length];
      const signBack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.62, 0.12), signBackMat);
      signBack.position.set(0, 3.85, frontZ + 2.15);
      bGroup.add(signBack);

      // Top & bottom thin neon tubes
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.06, 0.14), neonMat);
      topBar.position.set(0, 4.18, frontZ + 2.17);
      bGroup.add(topBar);
      const botBar = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.06, 0.14), neonMat);
      botBar.position.set(0, 3.52, frontZ + 2.17);
      bGroup.add(botBar);
      // Inner neon lettering strip
      const textStrip = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.06), neonMat);
      textStrip.position.set(0, 3.85, frontZ + 2.22);
      bGroup.add(textStrip);
    }

    getChunk(spec.x, spec.z).add(bGroup);

    const halfX = Math.abs(Math.cos(spec.rotY)) > 0.5 ? w / 2 : d / 2;
    const halfZ = Math.abs(Math.cos(spec.rotY)) > 0.5 ? d / 2 : w / 2;
    colliders.push({
      minX: spec.x - halfX,
      maxX: spec.x + halfX,
      minY: 0,
      maxY: 7.5,
      minZ: spec.z - halfZ,
      maxZ: spec.z + halfZ,
      label: 'shophouse-block',
    });

    const lxLocal = new THREE.Vector3(0, 2.65, frontZ + 1.45);
    lxLocal.applyAxisAngle(new THREE.Vector3(0, 1, 0), spec.rotY);
    lanternPositions.push([spec.x + lxLocal.x, 2.65, spec.z + lxLocal.z]);
  });

  // 4. Overhead Street Red Lantern Strings (#FF5A5F) + Shophouse Veranda Lanterns
  const stringCoords: Array<{ x1: number; z1: number; x2: number; z2: number; y: number }> = [
    { x1: -20, z1: 3.4, x2: -20, z2: 13.4, y: 5.1 },
    { x1: -6, z1: 3.4, x2: -6, z2: 13.4, y: 5.1 },
    { x1: 8, z1: 3.4, x2: 8, z2: 13.4, y: 5.1 },
    { x1: 20, z1: 3.4, x2: 20, z2: 13.4, y: 5.1 },
    { x1: -33, z1: -10, x2: -23, z2: -10, y: 5.0 },
    { x1: -33, z1: -24, x2: -23, z2: -24, y: 5.0 },
    { x1: 23, z1: -10, x2: 33, z2: -10, y: 5.0 },
    { x1: -12, z1: 37.2, x2: -12, z2: 46.8, y: 5.2 },
    { x1: 12, z1: 37.2, x2: 12, z2: 46.8, y: 5.2 },
  ];
  const cordMat = createToonMaterial({ color: 0x3b2d24 });
  stringCoords.forEach((sc) => {
    const dx = sc.x2 - sc.x1;
    const dz = sc.z2 - sc.z1;
    const len = Math.hypot(dx, dz);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 4), cordMat);
    cord.position.set((sc.x1 + sc.x2) / 2, sc.y, (sc.z1 + sc.z2) / 2);
    cord.rotation.z = Math.PI / 2;
    cord.rotation.y = -Math.atan2(dz, dx);
    group.add(cord);

    for (let k = 1; k <= 5; k++) {
      const t = k / 6;
      const sag = Math.sin(t * Math.PI) * 0.45;
      lanternPositions.push([sc.x1 + dx * t, sc.y - 0.22 - sag, sc.z1 + dz * t]);
    }
  });

  if (lanternPositions.length > 0) {
    const lanternGeo = new THREE.SphereGeometry(0.21, 8, 8);
    const lanternInst = new THREE.InstancedMesh(lanternGeo, streetLanternMaterial, lanternPositions.length);
    lanternPositions.forEach(([lx, ly, lz], i) => {
      dummy.position.set(lx, ly, lz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 0.88, 1);
      dummy.updateMatrix();
      lanternInst.setMatrixAt(i, dummy.matrix);
    });
    lanternInst.instanceMatrix.needsUpdate = true;
    lanternInst.computeBoundingSphere();
    group.add(lanternInst);
  }

  // 5. Instanced Tropical Street & Park Trees (#7DBE7A canopy, NO outline)
  const treeCoords: Array<[number, number]> = [
    [-14.5, 3.6], [-6.2, 3.6], [6.2, 3.6], [14.5, 3.6],
    [36.5, 3.6], [-36.5, 3.6], [-56.0, 3.6], [62.0, 3.6],
    [-16.0, 13.4], [0.0, 13.4], [16.0, 13.4],
    [22.9, -6.0], [22.9, -18.0], [22.9, 22.0], [33.1, 22.0],
    [-22.9, -6.0], [-22.9, -18.0], [-22.9, 22.0], [-33.1, 22.0],
    [-14.0, 36.8], [0.0, 36.8], [14.0, 36.8], [-14.0, 47.0], [14.0, 47.0],
    [-68, 20], [-48, 20], [-68, 32], [-48, 32],
    [-40, 72], [-18, 72], [2, 72], [20, 72], [42, 72],
  ];

  const trunkMat = createToonMaterial({ color: 0x73523b });
  const canopyMat = createToonMaterial({ color: 0xffffff });

  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.26, 2.7, 7);
  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCoords.length);
  trunkInst.castShadow = true;

  const canopyGeo = new THREE.DodecahedronGeometry(1.35, 1);
  const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCoords.length * 3);
  canopyInst.castShadow = true;

  const greenPalette = [
    new THREE.Color(0x7dbe7a),
    new THREE.Color(0x88c785),
    new THREE.Color(0x6eb06b),
    new THREE.Color(0x91cc89),
  ];

  treeCoords.forEach(([tx, tz], i) => {
    const scaleVar = 0.88 + ((i * 37) % 24) / 100;
    dummy.position.set(tx, 1.35 * scaleVar, tz);
    dummy.rotation.set(0, (i * 1.1) % Math.PI, 0);
    dummy.scale.set(scaleVar, scaleVar, scaleVar);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);

    const offsets: Array<[number, number, number, number]> = [
      [0, 3.25 * scaleVar, 0, 1.05 * scaleVar],
      [-0.65 * scaleVar, 2.85 * scaleVar, 0.35 * scaleVar, 0.78 * scaleVar],
      [0.62 * scaleVar, 2.9 * scaleVar, -0.35 * scaleVar, 0.74 * scaleVar],
    ];
    offsets.forEach(([ox, oy, oz, cs], j) => {
      dummy.position.set(tx + ox, oy, tz + oz);
      dummy.rotation.set(0.1 * j, i * 0.7 + j, 0);
      dummy.scale.set(cs, cs * 0.8, cs);
      dummy.updateMatrix();
      canopyInst.setMatrixAt(i * 3 + j, dummy.matrix);
      canopyInst.setColorAt(i * 3 + j, greenPalette[(i + j) % greenPalette.length]);
    });

    colliders.push({
      minX: tx - 0.32,
      maxX: tx + 0.32,
      minY: 0,
      maxY: 3.5,
      minZ: tz - 0.32,
      maxZ: tz + 0.32,
      label: 'street-tree',
    });
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  canopyInst.instanceMatrix.needsUpdate = true;
  if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
  canopyInst.computeBoundingSphere();
  group.add(trunkInst);
  group.add(canopyInst);

  // 6. Heritage Streetlamps + 4 Strategic Night PointLights
  const lampCoords: Array<[number, number]> = [
    [-11.0, 3.8], [11.0, 3.8], [22.8, 3.8], [-22.8, 3.8],
    [-10.0, 13.0], [10.0, 13.0], [23.2, -16.0], [-23.2, -16.0],
    [23.2, 28.0], [-23.2, 28.0], [-12.0, 37.5], [12.0, 37.5],
    [54.0, 37.5], [-54.0, 37.5], [0.0, 71.0], [18.0, 71.0],
    [-10.0, -35.8], [18.0, -35.8],
  ];

  lampCoords.forEach(([lx, lz]) => {
    const { group: lampGroup, bulbMaterial } = createStreetlampGroup();
    lampGroup.position.set(lx, 0, lz);
    group.add(lampGroup);
    streetLampBulbMaterials.push(bulbMaterial);
    colliders.push({
      minX: lx - 0.25,
      maxX: lx + 0.25,
      minY: 0,
      maxY: 4.5,
      minZ: lz - 0.25,
      maxZ: lz + 0.25,
      label: 'streetlamp',
    });
  });

  const lightSpots: Array<[number, number, number]> = [
    [0, 3.8, 4.5],
    [26, 4.2, 8.4],
    [-26, 4.2, 8.4],
    [10, 4.2, 68.0],
  ];
  lightSpots.forEach(([px, py, pz]) => {
    const pt = new THREE.PointLight(0xffb55c, 0, 24, 1.5);
    pt.position.set(px, py, pz);
    group.add(pt);
    nightPointLights.push(pt);
  });

  // 7. Parked Decorative Motorcycles along curbs
  const motoSpots: Array<{ x: number; z: number; rotY: number; color: number }> = [
    { x: 5.8, z: 3.4, rotY: 0.4, color: 0xe8a598 },
    { x: -7.4, z: 3.4, rotY: -0.35, color: 0xa8d5ba },
    { x: 16.5, z: 13.3, rotY: 1.4, color: 0xf4e3b8 },
    { x: -12.5, z: 13.3, rotY: 1.7, color: 0xbfd8e8 },
    { x: 23.3, z: -9.5, rotY: 0.1, color: 0x6baa8e },
    { x: 64.0, z: 35.0, rotY: 0.7, color: 0xd94b3d },
  ];

  motoSpots.forEach((m) => {
    const moto = createMotorcycleGroup(m.color, textures.contactShadow);
    moto.position.set(m.x, 0, m.z);
    moto.rotation.y = m.rotY;
    group.add(moto);
    colliders.push({
      minX: m.x - 0.65,
      maxX: m.x + 0.65,
      minY: 0,
      maxY: 1.1,
      minZ: m.z - 0.65,
      maxZ: m.z + 0.65,
      label: 'motorcycle',
    });
  });

  return {
    group,
    colliders,
    streetLampBulbMaterials,
    streetLanternMaterial,
    windowGlowMaterials,
    roadMaterial,
    neonReflectionMats,
    neonSignMaterials,
    nightPointLights,
    chunks: Array.from(chunkMap.values()),
  };
}
