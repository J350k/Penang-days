import * as THREE from 'three';
import { createCeilingFanGroup } from './props';
import { attachOutline, createToonMaterial } from './toonMaterials';
import type { ProceduralTextureSet } from './textures';
import type { AABB, StairVolume } from '../types';

export interface PlayerHomeResult {
  group: THREE.Group;
  colliders: AABB[];
  stairs: StairVolume[];
  upperFloorBoxes: Array<{ minX: number; maxX: number; minZ: number; maxZ: number; y: number }>;
  cameraObstacleMeshes: THREE.Object3D[];
  ceilingFan: THREE.Group;
  emissiveMaterials: THREE.MeshToonMaterial[];
}

export function buildPlayerShophouse(textures: ProceduralTextureSet): PlayerHomeResult {
  const group = new THREE.Group();
  const colliders: AABB[] = [];
  const cameraObstacleMeshes: THREE.Object3D[] = [];
  const emissiveMaterials: THREE.MeshToonMaterial[] = [];

  // Part A Warm Toon Penang Palette
  const facadeBlueMat = createToonMaterial({ color: 0xbfd8e8 });
  const interiorWallMat = createToonMaterial({ color: 0xf4e3b8 });
  const trimCreamMat = createToonMaterial({ color: 0xfaf3e6 });
  const shutterGreenMat = createToonMaterial({ color: 0x6baa8e });
  const teakWoodMat = createToonMaterial({ color: 0x7b4f31 });
  const darkWoodMat = createToonMaterial({ color: 0x5a3e36 });
  const tileFloorMat = createToonMaterial({ map: textures.peranakanTile, color: 0xffffff });
  const woodFloorMat = createToonMaterial({ map: textures.woodPlank, color: 0xffffff });
  const terracottaRoofMat = createToonMaterial({ color: 0xc97b6b });
  const cushionSageMat = createToonMaterial({ color: 0xa8d5ba });
  const coralClothMat = createToonMaterial({ color: 0xe8a598 });
  const brassMat = createToonMaterial({ color: 0xffd84d });
  const mintFridgeMat = createToonMaterial({ color: 0xa8d5ba });
  const leafGreenMat = createToonMaterial({ color: 0x7dbe7a });
  const ceramicMat = createToonMaterial({ color: 0xf4efe6 });

  const windowGlowMat = createToonMaterial({
    color: 0xfff3d4,
    emissive: 0xffc857,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.72,
  });
  const lanternGlowMat = createToonMaterial({
    color: 0xff5a5f,
    emissive: 0xff5a5f,
    emissiveIntensity: 0.3,
  });
  emissiveMaterials.push(windowGlowMat, lanternGlowMat);

  const addBox = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
    options?: {
      collide?: boolean;
      label?: string;
      camBlock?: boolean;
      castShadow?: boolean;
      receiveShadow?: boolean;
      outline?: boolean;
    }
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = options?.castShadow ?? true;
    mesh.receiveShadow = options?.receiveShadow ?? true;
    if (options?.outline) {
      attachOutline(mesh, 'building', 1.018);
    }
    group.add(mesh);
    if (options?.collide) {
      colliders.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minY: y - h / 2,
        maxY: y + h / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
        label: options.label,
      });
    }
    if (options?.camBlock) {
      cameraObstacleMeshes.push(mesh);
    }
    return mesh;
  };

  // 1F FLOOR & FIVE-FOOT WAY
  const floor1F = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.16, 16.4), tileFloorMat);
  floor1F.position.set(0, -0.06, -5.8);
  floor1F.receiveShadow = true;
  group.add(floor1F);

  // EXTERIOR SHELL WALLS
  addBox(0.3, 6.8, 14.0, -4.35, 3.4, -7.0, interiorWallMat, {
    collide: true,
    camBlock: true,
    label: 'west-wall',
  });
  addBox(0.08, 6.8, 14.0, -4.52, 3.4, -7.0, facadeBlueMat, { castShadow: false, outline: true });

  addBox(0.3, 6.8, 14.0, 4.35, 3.4, -7.0, interiorWallMat, {
    collide: true,
    camBlock: true,
    label: 'east-wall',
  });
  addBox(0.08, 6.8, 14.0, 4.52, 3.4, -7.0, facadeBlueMat, { castShadow: false, outline: true });

  addBox(9.0, 6.8, 0.3, 0, 3.4, -13.85, interiorWallMat, {
    collide: true,
    camBlock: true,
    label: 'rear-wall',
    outline: true,
  });

  // Front facade 1F (wide doorway gap X: [-1.45, 1.45])
  addBox(3.05, 3.4, 0.3, -2.975, 1.7, 0.0, facadeBlueMat, {
    collide: true,
    camBlock: true,
    label: 'front-wall-left',
    outline: true,
  });
  addBox(3.05, 3.4, 0.3, 2.975, 1.7, 0.0, facadeBlueMat, {
    collide: true,
    camBlock: true,
    label: 'front-wall-right',
    outline: true,
  });
  addBox(2.9, 0.55, 0.3, 0, 3.125, 0.0, trimCreamMat, { camBlock: true });

  // Open wooden double doors
  addBox(0.95, 2.75, 0.08, -1.98, 1.375, -0.2, darkWoodMat);
  addBox(0.95, 2.75, 0.08, 1.98, 1.375, -0.2, darkWoodMat);

  // 1F Front louvered windows
  for (const wx of [-2.85, 2.85]) {
    addBox(1.5, 1.5, 0.34, wx, 1.65, 0.0, trimCreamMat, { castShadow: false });
    addBox(1.25, 1.25, 0.36, wx, 1.65, 0.0, windowGlowMat, { castShadow: false });
    addBox(0.32, 1.35, 0.08, wx - 0.85, 1.65, 0.22, shutterGreenMat);
    addBox(0.32, 1.35, 0.08, wx + 0.85, 1.65, 0.22, shutterGreenMat);
  }

  // Front facade 2F
  addBox(9.0, 3.4, 0.3, 0, 5.1, 0.0, facadeBlueMat, {
    collide: true,
    camBlock: true,
    label: 'front-wall-2f',
    outline: true,
  });
  for (const wx of [-2.75, 0, 2.75]) {
    addBox(1.55, 1.7, 0.34, wx, 5.1, 0.0, trimCreamMat, { castShadow: false });
    addBox(1.25, 1.45, 0.36, wx, 5.1, 0.0, windowGlowMat, { castShadow: false });
    addBox(0.36, 1.5, 0.08, wx - 0.88, 5.1, 0.22, shutterGreenMat);
    addBox(0.36, 1.5, 0.08, wx + 0.88, 5.1, 0.22, shutterGreenMat);
  }
  addBox(9.15, 0.22, 0.42, 0, 3.38, 0.05, trimCreamMat);
  addBox(9.2, 0.24, 0.44, 0, 6.78, 0.05, trimCreamMat);

  // FIVE-FOOT WAY (五脚基)
  for (const px of [-4.2, -1.75, 1.75, 4.2]) {
    addBox(0.42, 3.25, 0.42, px, 1.625, 2.15, trimCreamMat, {
      collide: true,
      label: 'veranda-pillar',
      outline: true,
    });
    addBox(0.52, 0.32, 0.52, px, 0.16, 2.15, facadeBlueMat);
  }
  addBox(9.1, 0.24, 2.5, 0, 3.32, 1.2, trimCreamMat, { camBlock: true });
  const awning = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.14, 2.7), terracottaRoofMat);
  awning.position.set(0, 3.68, 1.3);
  awning.rotation.x = 0.22;
  awning.castShadow = true;
  attachOutline(awning, 'building', 1.02);
  group.add(awning);

  for (const lx of [-1.05, 1.05]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), darkWoodMat);
    cord.position.set(lx, 2.98, 1.6);
    group.add(cord);

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), lanternGlowMat);
    body.scale.set(1, 0.88, 1);
    body.position.set(lx, 2.66, 1.6);
    group.add(body);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 10), brassMat);
    cap.position.set(lx, 2.86, 1.6);
    group.add(cap);
  }

  // 1F LIVING ROOM FURNITURE
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.025, 2.6),
    createToonMaterial({ color: 0xe8a598 })
  );
  rug.position.set(-2.1, 0.035, -2.8);
  rug.receiveShadow = true;
  group.add(rug);

  addBox(0.95, 0.42, 2.3, -3.6, 0.21, -2.8, teakWoodMat, { collide: true, label: 'sofa', outline: true });
  addBox(0.82, 0.16, 2.1, -3.55, 0.48, -2.8, cushionSageMat);
  addBox(0.18, 0.56, 2.1, -3.96, 0.68, -2.8, cushionSageMat);

  addBox(0.75, 0.42, 1.2, -1.9, 0.21, -2.8, teakWoodMat, { collide: true, label: 'coffee-table', outline: true });
  const teapot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.16, 10), ceramicMat);
  teapot.position.set(-1.9, 0.5, -2.75);
  group.add(teapot);
  for (const cz of [-2.98, -2.52]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.07, 8), ceramicMat);
    cup.position.set(-1.82, 0.455, cz);
    group.add(cup);
  }

  const ceilingFan = createCeilingFanGroup();
  ceilingFan.position.set(0, 3.24, -2.8);
  group.add(ceilingFan);

  // AIRWELL
  addBox(1.4, 0.38, 1.3, 0, 0.19, -7.35, terracottaRoofMat, { collide: true, label: 'airwell-planter', outline: true });
  addBox(1.2, 0.1, 1.1, 0, 0.36, -7.35, darkWoodMat);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.2 + (i % 2) * 0.35, 6), leafGreenMat);
    stem.position.set(Math.cos(ang) * 0.22, 0.95, -7.35 + Math.sin(ang) * 0.22);
    stem.rotation.z = -Math.cos(ang) * 0.25;
    stem.rotation.x = Math.sin(ang) * 0.25;
    group.add(stem);

    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 5), leafGreenMat);
    frond.position.set(Math.cos(ang) * 0.42, 1.48 + (i % 2) * 0.2, -7.35 + Math.sin(ang) * 0.42);
    frond.rotation.z = -Math.cos(ang) * 0.65;
    frond.rotation.x = Math.sin(ang) * 0.65;
    group.add(frond);
  }

  // 1F SMALL KITCHEN
  addBox(3.4, 0.88, 0.85, -2.4, 0.44, -13.25, trimCreamMat, { collide: true, label: 'kitchen-counter', outline: true });
  addBox(3.45, 0.08, 0.9, -2.4, 0.9, -13.25, teakWoodMat);
  addBox(0.7, 0.05, 0.5, -3.1, 0.94, -13.22, brassMat);
  const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.18, 10), brassMat);
  kettle.position.set(-1.5, 1.03, -13.22);
  group.add(kettle);

  addBox(0.9, 1.85, 0.82, 0.35, 0.925, -13.25, mintFridgeMat, { collide: true, label: 'fridge', outline: true });

  addBox(1.3, 0.76, 0.95, -2.0, 0.38, -10.8, teakWoodMat, { collide: true, label: 'dining-table', outline: true });
  for (const sx of [-2.9, -1.1]) {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.46, 10), darkWoodMat);
    stool.position.set(sx, 0.23, -10.8);
    stool.castShadow = true;
    group.add(stool);
  }

  // WOODEN STAIRCASE
  const stairs: StairVolume[] = [
    {
      minX: 2.25,
      maxX: 4.1,
      minZ: -11.6,
      maxZ: -5.4,
      startZ: -5.5,
      endZ: -11.5,
      startY: 0,
      endY: 3.4,
    },
  ];

  const stepCount = 15;
  const startZ = -5.5;
  const endZ = -11.5;
  const totalRise = 3.4;
  for (let i = 0; i < stepCount; i++) {
    const t = (i + 0.5) / stepCount;
    const sy = t * totalRise;
    const sz = startZ + t * (endZ - startZ);
    const stepDepth = Math.abs(endZ - startZ) / stepCount + 0.04;
    addBox(1.75, 0.12, stepDepth, 3.18, sy - 0.04, sz, teakWoodMat, { receiveShadow: true });
  }

  addBox(0.14, 4.5, 5.7, 2.2, 2.25, -8.65, darkWoodMat, {
    collide: true,
    camBlock: false,
    label: 'stair-side-partition',
  });

  // 2F FLOOR SLABS & BALUSTRADES
  const upperFloorBoxes = [
    { minX: -4.2, maxX: 4.2, minZ: -5.5, maxZ: 0.0, y: 3.4 },
    { minX: -4.2, maxX: -1.8, minZ: -9.2, maxZ: -5.5, y: 3.4 },
    { minX: -4.2, maxX: 2.25, minZ: -13.6, maxZ: -9.2, y: 3.4 },
    { minX: 2.25, maxX: 4.2, minZ: -13.6, maxZ: -11.5, y: 3.4 },
  ];

  addBox(8.4, 0.22, 5.5, 0, 3.29, -2.75, woodFloorMat, { camBlock: true });
  addBox(2.4, 0.22, 3.7, -3.0, 3.29, -7.35, woodFloorMat, { camBlock: true });
  addBox(6.45, 0.22, 4.4, -0.975, 3.29, -11.4, woodFloorMat, { camBlock: true });
  addBox(1.95, 0.22, 2.1, 3.225, 3.29, -12.55, woodFloorMat, { camBlock: true });

  addBox(3.6, 0.95, 0.14, 0, 3.88, -5.5, darkWoodMat, { collide: true, label: '2f-airwell-front' });
  addBox(3.6, 0.95, 0.14, 0, 3.88, -9.2, darkWoodMat, { collide: true, label: '2f-airwell-rear' });
  addBox(0.14, 0.95, 3.7, -1.8, 3.88, -7.35, darkWoodMat, { collide: true, label: '2f-airwell-left' });
  addBox(0.14, 0.95, 3.7, 1.8, 3.88, -7.35, darkWoodMat, { collide: true, label: '2f-airwell-right' });

  // 2F BEDROOM FURNITURE
  addBox(1.85, 0.45, 2.2, -3.0, 3.625, -3.5, darkWoodMat, { collide: true, label: '2f-bed', outline: true });
  addBox(1.7, 0.2, 2.0, -3.0, 3.92, -3.5, trimCreamMat);
  addBox(1.68, 0.12, 1.25, -3.0, 4.02, -3.85, coralClothMat);
  addBox(0.65, 0.14, 0.38, -3.4, 4.07, -2.75, cushionSageMat);
  addBox(0.65, 0.14, 0.38, -2.6, 4.07, -2.75, cushionSageMat);

  addBox(0.55, 0.56, 0.55, -3.8, 3.68, -1.8, teakWoodMat, { collide: true, label: '2f-nightstand' });
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.24, 10), lanternGlowMat);
  lampShade.position.set(-3.8, 4.18, -1.8);
  group.add(lampShade);

  addBox(1.0, 2.1, 1.4, 3.55, 4.45, -1.4, teakWoodMat, { collide: true, label: '2f-wardrobe', outline: true });
  addBox(1.5, 0.76, 0.72, 0.2, 3.78, -0.75, teakWoodMat, { collide: true, label: '2f-desk', outline: true });
  addBox(0.5, 0.48, 0.5, 0.2, 3.64, -1.45, darkWoodMat);

  // 2F PITCHED ROOF
  addBox(9.2, 0.22, 5.8, 0, 6.9, -2.6, terracottaRoofMat, { castShadow: true, outline: true });
  addBox(9.2, 0.22, 5.0, 0, 6.9, -11.7, terracottaRoofMat, { castShadow: true, outline: true });
  addBox(2.7, 0.22, 3.7, -3.25, 6.9, -7.35, terracottaRoofMat, { castShadow: true });
  addBox(2.7, 0.22, 3.7, 3.25, 6.9, -7.35, terracottaRoofMat, { castShadow: true });

  const roofPeak = new THREE.Mesh(new THREE.CylinderGeometry(0, 4.8, 1.35, 4), terracottaRoofMat);
  roofPeak.rotation.y = Math.PI / 4;
  roofPeak.scale.set(1.35, 1, 0.88);
  roofPeak.position.set(0, 7.65, -2.6);
  roofPeak.castShadow = true;
  attachOutline(roofPeak, 'building', 1.02);
  group.add(roofPeak);

  return {
    group,
    colliders,
    stairs,
    upperFloorBoxes,
    cameraObstacleMeshes,
    ceilingFan,
    emissiveMaterials,
  };
}
