import * as THREE from 'three';
import { createFerryGroup, createJetSkiGroup } from './props';
import { attachOutline, createToonMaterial } from './toonMaterials';
import type { WorldChunk } from './georgetownStreets';
import type { AABB, StairVolume } from '../types';

export interface BusStopSpec {
  id: string;
  x: number;
  z: number;
  nameZh: string;
  nameEn: string;
  nameMs: string;
}

export interface LandmarkZoneSpec {
  id: string;
  x: number;
  z: number;
  radius: number;
  nameZh: string;
  nameEn: string;
  nameMs: string;
}

export interface PhotoSpotSpec {
  id: string;
  x: number;
  y?: number;
  z: number;
  labelZh: string;
  labelEn: string;
  labelMs: string;
}

export const BUS_STOPS: BusStopSpec[] = [
  { id: 'bus-armenian', x: -16, z: 13.5, nameZh: '打铜仔街巴士站', nameEn: 'Armenian St Stop', nameMs: 'Hentian Lebuh Armenian' },
  { id: 'bus-komtar', x: 56, z: 37, nameZh: '光大广场枢纽', nameEn: 'Komtar Hub', nameMs: 'Hab Komtar' },
  { id: 'bus-gurney', x: -96, z: 62, nameZh: '关仔角海滨', nameEn: 'Gurney Promenade', nameMs: 'Persiaran Gurney' },
  { id: 'bus-kekloksi', x: -116, z: -26, nameZh: '极乐风禅寺', nameEn: 'Kek Lok Temple', nameMs: 'Kuil Kek Lok' },
  { id: 'bus-hill', x: -95, z: -50, nameZh: '升旗山缆车站', nameEn: 'Hill Tram Station', nameMs: 'Stesen Bukit Bendera' },
  { id: 'bus-beach', x: -98, z: 90, nameZh: '峇都丁宜海滩', nameEn: 'Ferringhi Beach', nameMs: 'Pantai Ferringhi' },
];

export const LANDMARK_ZONES: LandmarkZoneSpec[] = [
  { id: 'lm-mural', x: -28, z: -13, radius: 11, nameZh: '壁画街', nameEn: 'Mural Lane', nameMs: 'Lorong Mural' },
  { id: 'lm-park', x: -58, z: 26, radius: 14, nameZh: '乔治市小公园', nameEn: 'Heritage Park', nameMs: 'Taman Warisan' },
  { id: 'lm-pier', x: 10, z: 82, radius: 12, nameZh: '海边码头', nameEn: 'Esplanade Pier', nameMs: 'Jeti Esplanade' },
  { id: 'lm-komtar-mall', x: 114, z: 42, radius: 18, nameZh: '光大购物中心', nameEn: 'Komtar Mall', nameMs: 'Pusat Beli-belah Komtar' },
  { id: 'lm-gurney', x: -118, z: 66, radius: 20, nameZh: '关仔角海滨长廊', nameEn: 'Gurney Promenade', nameMs: 'Persiaran Gurney' },
  { id: 'lm-kekloksi', x: -135, z: -42, radius: 18, nameZh: '极乐禅寺', nameEn: 'Kek Lok Temple', nameMs: 'Kuil Kek Lok' },
  { id: 'lm-penang-hill', x: -150, z: -120, radius: 22, nameZh: '升旗山山顶', nameEn: 'Penang Hill Summit', nameMs: 'Puncak Bukit Bendera' },
  { id: 'lm-ferringhi', x: -126, z: 105, radius: 22, nameZh: '峇都丁宜海滩', nameEn: 'Ferringhi Beach', nameMs: 'Pantai Ferringhi' },
  { id: 'lm-mainland', x: 152, z: 84, radius: 22, nameZh: '北海渡轮对岸', nameEn: 'Butterworth Pier', nameMs: 'Jeti Butterworth' },
];

export const FERRY_ISLAND_POS = { x: 24, z: 76 };
export const FERRY_MAINLAND_POS = { x: 136, z: 82 };
export const TRAM_BOTTOM_POS = { x: -95, z: -53 };
export const TRAM_TOP_POS = { x: -146, z: -116, y: 18 };
export const TEMPLE_BLESSING_POS = { x: -135, z: -46 };
export const JETSKI_DOCK_POS = { x: -124, z: 96 };

export interface ExpandedRegionsResult {
  group: THREE.Group;
  colliders: AABB[];
  stairs: StairVolume[];
  upperFloorBoxes: Array<{ minX: number; maxX: number; minZ: number; maxZ: number; y: number }>;
  chunks: WorldChunk[];
  photoSpots: PhotoSpotSpec[];
  neonSignMaterials: THREE.MeshBasicMaterial[];
  updateExpanded: (elapsedSec: number) => void;
}

export function buildExpandedRegions(contactShadowTex: THREE.Texture): ExpandedRegionsResult {
  const group = new THREE.Group();
  const colliders: AABB[] = [];
  const stairs: StairVolume[] = [];
  const upperFloorBoxes: Array<{ minX: number; maxX: number; minZ: number; maxZ: number; y: number }> = [];
  const chunks: WorldChunk[] = [];
  const neonSignMaterials: THREE.MeshBasicMaterial[] = [];

  const registerChunk = (cx: number, cz: number): THREE.Group => {
    const g = new THREE.Group();
    group.add(g);
    chunks.push({ group: g, centerX: cx, centerZ: cz });
    return g;
  };

  const addBox = (
    target: THREE.Group,
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
  ): THREE.Mesh => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    if (outline) attachOutline(m, 'building', 1.015);
    target.add(m);
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
    return m;
  };

  // Shared materials
  const roadMat = createToonMaterial({ color: 0x8f8c8c });
  const sandMat = createToonMaterial({ color: 0xf4dfad });
  const grassMat = createToonMaterial({ color: 0x8cc784 });
  const darkGrassMat = createToonMaterial({ color: 0x6ba867 });
  const stoneMat = createToonMaterial({ color: 0xd9cbb4 });
  const creamMat = createToonMaterial({ color: 0xf4e3b8 });
  const coralMat = createToonMaterial({ color: 0xe8a598 });
  const mintMat = createToonMaterial({ color: 0xa8d5ba });
  const blueMat = createToonMaterial({ color: 0xbfd8e8 });
  const roofMat = createToonMaterial({ color: 0xc97b6b });
  const goldMat = createToonMaterial({ color: 0xffd84d });
  const woodMat = createToonMaterial({ color: 0x8f623d });
  const greenShutterMat = createToonMaterial({ color: 0x6baa8e });

  // Connector roads linking original 7 streets to new regions
  const roadConnectors: Array<[number, number, number, number]> = [
    [-122, 66, 62, 7.6],     // Esplanade Rd west extension to Gurney
    [-122, 66, 7.6, 54],     // Coastal boulevard south to Batu Ferringhi (X=-122, Z=66..93)
    [-95, -8, 7.6, 98],      // West Heritage Ave linking Gurney (Z=66) -> Temple (Z=-40) -> Hill Station (Z=-53)
    [-108, -40, 26, 7.6],    // Temple spur road
    [88, 42, 24, 8.0],       // Komtar Plaza -> Komtar Mall entrance
  ];
  const roadGroup = registerChunk(0, 0);
  for (const [rx, rz, rw, rd] of roadConnectors) {
    const rMesh = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.04, rd), roadMat);
    rMesh.position.set(rx, 0.015, rz);
    rMesh.receiveShadow = true;
    roadGroup.add(rMesh);
  }

  // 1. KOMTAR MALL INTERIOR (X [98..132], Z [26..58])
  const mallChunk = registerChunk(115, 42);
  addBox(mallChunk, 34, 0.12, 32, 115, 0.04, 42, createToonMaterial({ color: 0xfaf3e6 }));
  // Mall back & side walls (open entrance on West X=98 around Z=42)
  addBox(mallChunk, 0.6, 7.2, 11, 98.2, 3.6, 31.5, creamMat, true, 'mall-wall-w1', true);
  addBox(mallChunk, 0.6, 7.2, 11, 98.2, 3.6, 52.5, creamMat, true, 'mall-wall-w2', true);
  addBox(mallChunk, 0.6, 7.2, 32, 131.8, 3.6, 42, creamMat, true, 'mall-wall-e', true);
  addBox(mallChunk, 34, 7.2, 0.6, 115, 3.6, 26.2, creamMat, true, 'mall-wall-n', true);
  addBox(mallChunk, 34, 7.2, 0.6, 115, 3.6, 57.8, creamMat, true, 'mall-wall-s', true);
  // Overhead Mall entrance arch & neon trim
  addBox(mallChunk, 1.2, 2.2, 10.6, 98.2, 6.1, 42, blueMat);
  const mallNeonMat = new THREE.MeshBasicMaterial({ color: 0x3de0ff, transparent: true, opacity: 0.9 });
  neonSignMaterials.push(mallNeonMat);
  const mallNeonArch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 10.2), mallNeonMat);
  mallNeonArch.position.set(97.5, 5.1, 42);
  mallChunk.add(mallNeonArch);
  // 3 Interior Shopping Booths
  const boothColors = [coralMat, mintMat, blueMat];
  [33, 42, 51].forEach((bz, i) => {
    addBox(mallChunk, 4.4, 2.8, 4.4, 122, 1.4, bz, boothColors[i], true, `mall-booth-${i}`, true);
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.12, 4.2),
      new THREE.MeshBasicMaterial({ color: i === 0 ? 0xff4fa3 : i === 1 ? 0xffd84d : 0x3de0ff })
    );
    strip.position.set(119.7, 2.6, bz);
    mallChunk.add(strip);
  });

  // 2. GURNEY SEASIDE PROMENADE & ANIMATED FERRIS WHEEL (X [-148..-92], Z [52..80])
  const gurneyChunk = registerChunk(-120, 66);
  addBox(gurneyChunk, 56, 0.25, 22, -120, 0.1, 64, stoneMat);
  // Sea wall railing along Z=75
  for (let rx = -146; rx <= -94; rx += 4) {
    addBox(gurneyChunk, 3.6, 0.85, 0.25, rx, 0.6, 74.5, creamMat, true, 'gurney-rail');
  }
  // Animated Ferris Wheel at (-136, 62)
  const wheelTower = new THREE.Group();
  wheelTower.position.set(-136, 0, 62);
  addBox(wheelTower, 0.6, 12, 0.6, -1.8, 6, 0, greenShutterMat, true, 'ferris-leg');
  addBox(wheelTower, 0.6, 12, 0.6, 1.8, 6, 0, greenShutterMat, true, 'ferris-leg');
  const ferrisWheel = new THREE.Group();
  ferrisWheel.position.set(0, 11.5, 0);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(6.8, 0.22, 8, 24),
    createToonMaterial({ color: 0xf4e3b8 })
  );
  ferrisWheel.add(rim);
  const ferrisNeon = new THREE.MeshBasicMaterial({ color: 0xff4fa3, transparent: true, opacity: 0.9 });
  neonSignMaterials.push(ferrisNeon);
  const neonRim = new THREE.Mesh(new THREE.TorusGeometry(6.45, 0.08, 6, 24), ferrisNeon);
  ferrisWheel.add(neonRim);
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 13.6, 6), goldMat);
    spoke.rotation.z = ang;
    ferrisWheel.add(spoke);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      i % 2 === 0 ? coralMat : blueMat
    );
    cabin.position.set(Math.cos(ang) * 6.8, Math.sin(ang) * 6.8, 0);
    ferrisWheel.add(cabin);
  }
  wheelTower.add(ferrisWheel);
  gurneyChunk.add(wheelTower);

  // 3. KEK LOK SI-STYLE TEMPLE (X [-155..-115], Z [-62..-24])
  const templeChunk = registerChunk(-135, -42);
  // Base courtyard
  addBox(templeChunk, 36, 0.3, 36, -135, 0.15, -42, stoneMat);
  // Tier 1 terrace (y = 1.6)
  addBox(templeChunk, 26, 1.6, 24, -135, 0.8, -46, creamMat, true, 'temple-tier-1', true);
  // Front stair from Z=-30 to Z=-34 -> climbs 0 -> 1.6
  stairs.push({
    minX: -138,
    maxX: -132,
    minZ: -35,
    maxZ: -29,
    startZ: -29.5,
    endZ: -34.5,
    startY: 0,
    endY: 1.6,
  });
  for (let s = 0; s < 5; s++) {
    addBox(templeChunk, 5.8, 0.34, 1.0, -135, 0.17 + s * 0.32, -30 - s * 1.0, stoneMat);
  }
  upperFloorBoxes.push({ minX: -148, maxX: -122, minZ: -58, maxZ: -34, y: 1.6 });

  // Golden Pagoda Pavilion at (-135, 1.6, -50)
  const pagodaBase = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 4.0, 8), creamMat);
  pagodaBase.position.set(-135, 3.6, -50);
  attachOutline(pagodaBase, 'building', 1.015);
  templeChunk.add(pagodaBase);
  colliders.push({ minX: -138.4, maxX: -131.6, minY: 1.6, maxY: 8, minZ: -53.4, maxZ: -46.6, label: 'pagoda' });
  for (let tier = 0; tier < 3; tier++) {
    const r = 4.4 - tier * 1.0;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(r, 1.8, 8), tier === 2 ? goldMat : roofMat);
    roof.position.set(-135, 6.2 + tier * 2.1, -50);
    attachOutline(roof, 'building', 1.02);
    templeChunk.add(roof);
  }

  // 4. PENANG HILL & FUNICULAR TRAM (Lower station (-95, -53), Summit (-148, -118, y=18))
  const hillChunk = registerChunk(-135, -100);
  // Lower Funicular Station House
  addBox(hillChunk, 7.2, 3.6, 5.4, -95, 1.8, -56.5, creamMat, true, 'hill-station-low', true);
  addBox(hillChunk, 7.6, 0.8, 5.8, -95, 3.9, -56.5, roofMat);

  // Mountain stepped terrain blocks (pure low-poly green terraces)
  addBox(hillChunk, 56, 7.0, 54, -148, 3.5, -118, darkGrassMat, true, 'penang-hill-base');
  addBox(hillChunk, 42, 6.0, 40, -148, 9.5, -118, grassMat, true, 'penang-hill-mid');
  // Summit observation plateau top at Y = 18
  addBox(hillChunk, 28, 5.5, 26, -148, 15.25, -118, stoneMat, false, 'penang-hill-summit');
  upperFloorBoxes.push({ minX: -162, maxX: -134, minZ: -131, maxZ: -105, y: 18 });

  // Summit safety railings so player can't walk off the mountain cliff
  addBox(hillChunk, 28, 1.2, 0.4, -148, 18.6, -130.8, woodMat, true, 'hill-rail-n');
  addBox(hillChunk, 28, 1.2, 0.4, -148, 18.6, -105.2, woodMat, true, 'hill-rail-s');
  addBox(hillChunk, 0.4, 1.2, 26, -161.8, 18.6, -118, woodMat, true, 'hill-rail-w');
  addBox(hillChunk, 0.4, 1.2, 26, -134.2, 18.6, -118, woodMat, true, 'hill-rail-e');

  // Summit viewing pavilion
  addBox(hillChunk, 6.5, 3.4, 5.5, -154, 19.7, -123, creamMat, true, 'hill-pavilion', true);
  addBox(hillChunk, 7.0, 0.7, 6.0, -154, 21.7, -123, roofMat);

  // Animated Cable Tram sliding along hillside track
  const cableTram = new THREE.Group();
  const tramBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.9, 4.2), coralMat);
  tramBody.position.y = 1.1;
  attachOutline(tramBody, 'vehicle', 1.02);
  cableTram.add(tramBody);
  const tramGlass = new THREE.Mesh(new THREE.BoxGeometry(2.66, 0.7, 3.5), blueMat);
  tramGlass.position.y = 1.35;
  cableTram.add(tramGlass);
  hillChunk.add(cableTram);

  // 5. BATU FERRINGHI-STYLE BEACH & JET SKI (X [-162..-94], Z [82..136])
  const beachChunk = registerChunk(-128, 106);
  addBox(beachChunk, 66, 0.14, 24, -128, 0.05, 86, sandMat);
  // Gentle animated beach wave strip
  const wavesMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(72, 26),
    createToonMaterial({ color: 0x62b6cb, transparent: true, opacity: 0.76 })
  );
  wavesMesh.rotation.x = -Math.PI / 2;
  wavesMesh.position.set(-128, 0.06, 108);
  beachChunk.add(wavesMesh);

  // Wooden Jet Ski Dock
  addBox(beachChunk, 4.5, 0.4, 12, -124, 0.22, 96, woodMat);
  const jetSkiMesh = createJetSkiGroup();
  jetSkiMesh.position.set(-124, 0.1, 104);
  beachChunk.add(jetSkiMesh);

  // Instanced Coconut Palms on Batu Ferringhi beach
  const palmPositions: Array<[number, number]> = [
    [-148, 82], [-138, 84], [-114, 83], [-104, 86], [-152, 92], [-106, 94],
  ];
  const palmTrunkMat = createToonMaterial({ color: 0x855c3c });
  const palmLeafMat = createToonMaterial({ color: 0x7dbe7a });
  const palmTrunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 4.8, 6);
  const palmTrunkInst = new THREE.InstancedMesh(palmTrunkGeo, palmTrunkMat, palmPositions.length);
  const palmCanopyGeo = new THREE.ConeGeometry(1.8, 1.1, 6);
  const palmCanopyInst = new THREE.InstancedMesh(palmCanopyGeo, palmLeafMat, palmPositions.length);
  const dummy = new THREE.Object3D();
  palmPositions.forEach(([px, pz], idx) => {
    dummy.position.set(px, 2.4, pz);
    dummy.rotation.set(0.08, idx * 1.1, 0.06);
    dummy.updateMatrix();
    palmTrunkInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(px + 0.2, 4.9, pz + 0.15);
    dummy.rotation.set(0, idx * 0.7, 0);
    dummy.updateMatrix();
    palmCanopyInst.setMatrixAt(idx, dummy.matrix);

    colliders.push({ minX: px - 0.35, maxX: px + 0.35, minY: 0, maxY: 4, minZ: pz - 0.35, maxZ: pz + 0.35, label: 'palm-tree' });
  });
  palmTrunkInst.instanceMatrix.needsUpdate = true;
  palmCanopyInst.instanceMatrix.needsUpdate = true;
  beachChunk.add(palmTrunkInst);
  beachChunk.add(palmCanopyInst);

  // 6. BUTTERWORTH MAINLAND FERRY PIER (X [128..178], Z [66..104])
  const mainlandChunk = registerChunk(152, 84);
  addBox(mainlandChunk, 48, 0.35, 36, 152, 0.15, 84, stoneMat);
  addBox(mainlandChunk, 12, 0.45, 7, 134, 0.22, 82, woodMat); // Pier ramp
  // Mainland Terminal Cafe
  addBox(mainlandChunk, 8, 3.8, 6, 154, 1.9, 76, mintMat, true, 'mainland-cafe', true);
  addBox(mainlandChunk, 8.4, 0.6, 6.4, 154, 4.1, 76, roofMat);
  // Safety perimeter around Mainland pier
  addBox(mainlandChunk, 48, 1.0, 0.3, 152, 0.7, 66.2, woodMat, true, 'mainland-rail-n');
  addBox(mainlandChunk, 48, 1.0, 0.3, 152, 0.7, 101.8, woodMat, true, 'mainland-rail-s');
  addBox(mainlandChunk, 0.3, 1.0, 36, 175.8, 0.7, 84, woodMat, true, 'mainland-rail-e');

  // Animated Pearl Ferry gliding in the channel between X=26 and X=128
  const ferryBoat = createFerryGroup();
  ferryBoat.position.set(78, 0.1, 86);
  ferryBoat.rotation.y = Math.PI / 2;
  group.add(ferryBoat);

  // Bus Stop Shelters across all 6 stops
  const busChunk = registerChunk(0, 20);
  for (const bs of BUS_STOPS) {
    addBox(busChunk, 2.8, 2.4, 1.1, bs.x, 1.2, bs.z - 1.4, blueMat, true, `bus-stop-${bs.id}`);
    addBox(busChunk, 3.0, 0.2, 1.4, bs.x, 2.5, bs.z - 1.4, greenShutterMat);
  }

  // New Photo Spots across Penang
  const photoSpots: PhotoSpotSpec[] = [
    { id: 'photo-gurney', x: -120, z: 73, labelZh: '关仔角摩天轮', labelEn: 'Gurney Ferris Wheel', labelMs: 'Roda Gurney' },
    { id: 'photo-kekloksi', x: -135, y: 1.6, z: -43, labelZh: '极乐禅寺金塔', labelEn: 'Kek Lok Pagoda', labelMs: 'Pagoda Kek Lok' },
    { id: 'photo-hill', x: -148, y: 18, z: -128, labelZh: '升旗山观景台', labelEn: 'Penang Hill Overlook', labelMs: 'Puncak Bukit Bendera' },
    { id: 'photo-ferringhi', x: -124, z: 92, labelZh: '峇都丁宜海滨', labelEn: 'Ferringhi Shore', labelMs: 'Pantai Ferringhi' },
    { id: 'photo-mainland', x: 152, z: 88, labelZh: '北海对岸海港', labelEn: 'Butterworth Harbor', labelMs: 'Pelabuhan Butterworth' },
  ];

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffd84d,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  });
  for (const p of photoSpots) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.95, 20), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.x, (p.y ?? 0) + 0.06, p.z);
    group.add(ring);
  }

  const updateExpanded = (elapsedSec: number) => {
    ferrisWheel.rotation.z = elapsedSec * 0.24;

    // Gentle Pearl Ferry shuttle along the harbor channel
    const ferryT = (Math.sin(elapsedSec * 0.09) + 1) * 0.5; // [0..1]
    ferryBoat.position.x = 34 + ferryT * 90;
    ferryBoat.position.y = Math.sin(elapsedSec * 1.4) * 0.1;

    // Animated Hill Tram moving between (-95, 1, -56) and (-146, 18.2, -116)
    const tramT = (Math.sin(elapsedSec * 0.22) + 1) * 0.5;
    cableTram.position.set(
      THREE.MathUtils.lerp(-95, -142, tramT),
      THREE.MathUtils.lerp(0.6, 17.6, tramT),
      THREE.MathUtils.lerp(-56, -112, tramT)
    );
    cableTram.rotation.y = Math.PI * 0.23;

    // Gentle ocean wave motion at Batu Ferringhi
    wavesMesh.position.z = 108 + Math.sin(elapsedSec * 1.1) * 1.1;
  };

  return {
    group,
    colliders,
    stairs,
    upperFloorBoxes,
    chunks,
    photoSpots,
    neonSignMaterials,
    updateExpanded,
  };
}
