import * as THREE from 'three';
import type { PlacedFurnitureItem } from '../types';
import { attachOutline, createToonMaterial } from '../world/toonMaterials';

export interface FurnitureCatalogItem {
  id: string;
  nameZh: string;
  nameEn: string;
  nameMs: string;
  priceRM: number;
  decorPoints: number;
  descZh: string;
  descEn: string;
  descMs: string;
  colorHex: number;
}

export const FURNITURE_CATALOG: FurnitureCatalogItem[] = [
  {
    id: 'furn-lantern',
    nameZh: '手绘红丝灯笼',
    nameEn: 'Silk Red Lantern',
    nameMs: 'Tanglung Sutera Merah',
    priceRM: 35,
    decorPoints: 10,
    descZh: '喜庆温暖的南洋纸灯笼，点亮店屋走廊。',
    descEn: 'Warm traditional lantern brightening your heritage room.',
    descMs: 'Tanglung tradisional yang menceriakan rumah.',
    colorHex: 0xff5a5f,
  },
  {
    id: 'furn-rug',
    nameZh: '娘惹花卉地毯',
    nameEn: 'Peranakan Floral Rug',
    nameMs: 'Permaidani Bunga Nyonya',
    priceRM: 55,
    decorPoints: 14,
    descZh: '峇峇娘惹彩色拼花地毯，铺在客厅超好看。',
    descEn: 'Colorful Peranakan pattern woven floor rug.',
    descMs: 'Permaidani corak Peranakan berwarna-warni.',
    colorHex: 0x6baa8e,
  },
  {
    id: 'furn-plant',
    nameZh: '陶盆龟背竹',
    nameEn: 'Potted Monstera',
    nameMs: 'Pokok Hiasan Pasu',
    priceRM: 45,
    decorPoints: 12,
    descZh: '绿意盎然的热带盆栽，带来满满海岛气息。',
    descEn: 'Lush tropical indoor plant in a terracotta pot.',
    descMs: 'Tumbuhan tropika hijau dalam pasu tanah liat.',
    colorHex: 0x7dbe7a,
  },
  {
    id: 'furn-sofa',
    nameZh: '南洋藤编沙发',
    nameEn: 'Rattan Heritage Sofa',
    nameMs: 'Sofa Rotan Warisan',
    priceRM: 110,
    decorPoints: 24,
    descZh: '透气藤编配薄荷绿软垫，坐着乘凉最舒服。',
    descEn: 'Breezy woven rattan sofa with mint cushions.',
    descMs: 'Sofa rotan klasik dengan kusyen pudina.',
    colorHex: 0xa8d5ba,
  },
  {
    id: 'furn-table',
    nameZh: '柚木茶几桌椅',
    nameEn: 'Teak Tea Table',
    nameMs: 'Meja Teh Kayu Jati',
    priceRM: 90,
    decorPoints: 20,
    descZh: '请邻居来家里喝白咖啡、吃娘惹糕的好地方！',
    descEn: 'Polished teak tea table for hosting Penang neighbors.',
    descMs: 'Meja kayu jati untuk melayan jiran tetangga.',
    colorHex: 0x8f623d,
  },
  {
    id: 'furn-catbed',
    nameZh: '橘猫 Tiger 软窝',
    nameEn: 'Cozy Cat Cushion',
    nameMs: 'Tilam Kucing Tiger',
    priceRM: 50,
    decorPoints: 15,
    descZh: '软绵绵的猫咪窝，Tiger 来串门时一定会喜欢。',
    descEn: 'Soft pet cushion that neighborhood cat Tiger loves.',
    descMs: 'Tilam lembut kegemaran si kucing Tiger.',
    colorHex: 0xf4e3b8,
  },
  {
    id: 'furn-bookshelf',
    nameZh: '古董柚木书架',
    nameEn: 'Heritage Bookshelf',
    nameMs: 'Rak Buku Antik',
    priceRM: 95,
    decorPoints: 22,
    descZh: '放满槟城老照片集与娘惹食谱的高书架。',
    descEn: 'Tall wooden bookshelf filled with Penang travelogues.',
    descMs: 'Rak buku tinggi penuh buku sejarah Pulau Pinang.',
    colorHex: 0x6f4b30,
  },
  {
    id: 'furn-neon',
    nameZh: '霓虹「PENANG」灯牌',
    nameEn: 'Neon "PENANG" Wall Sign',
    nameMs: 'Lampu Neon PENANG',
    priceRM: 120,
    decorPoints: 28,
    descZh: '把夜市霓虹氛围带回家里的酷炫发光装饰！',
    descEn: 'Vibrant glowing pink-cyan neon decor piece.',
    descMs: 'Hiasan lampu neon yang bergaya di dalam rumah.',
    colorHex: 0xff4fa3,
  },
];

// Home grid cells: gridX in [-2..2] (5 cols), gridZ in [0..4] (5 rows)
export const HOME_GRID_X_MIN = -2;
export const HOME_GRID_X_MAX = 2;
export const HOME_GRID_Z_MIN = 0;
export const HOME_GRID_Z_MAX = 4;

export function gridToWorld(floor: 1 | 2, gridX: number, gridZ: number): { x: number; y: number; z: number } {
  const x = gridX * 1.25; // [-2.5 .. +2.5] inside [-4.1 .. +4.1]
  const z = floor === 1 ? -2.2 - gridZ * 1.9 : -1.5 - gridZ * 0.9;
  const y = floor === 1 ? 0 : 3.4;
  return { x, y, z };
}

export function canPlaceFurniture(
  placed: PlacedFurnitureItem[],
  floor: 1 | 2,
  gridX: number,
  gridZ: number,
  ignoreInstanceId?: string
): boolean {
  if (gridX < HOME_GRID_X_MIN || gridX > HOME_GRID_X_MAX) return false;
  if (gridZ < HOME_GRID_Z_MIN || gridZ > HOME_GRID_Z_MAX) return false;
  // Avoid blocking 1F staircase entry at gridX === 2, gridZ >= 2
  if (gridX === 2 && gridZ >= 2) return false;
  return !placed.some(
    (item) =>
      item.instanceId !== ignoreInstanceId &&
      item.floor === floor &&
      item.gridX === gridX &&
      item.gridZ === gridZ
  );
}

export function computeDecorScore(placed: PlacedFurnitureItem[]): number {
  let score = 0;
  for (const p of placed) {
    const def = FURNITURE_CATALOG.find((c) => c.id === p.itemId);
    if (def) score += def.decorPoints;
  }
  return score;
}

export function buildFurnitureMesh(itemId: string): THREE.Group {
  const g = new THREE.Group();
  const woodMat = createToonMaterial({ color: 0x8f623d });
  const creamMat = createToonMaterial({ color: 0xf4e3b8 });
  const mintMat = createToonMaterial({ color: 0xa8d5ba });
  const coralMat = createToonMaterial({ color: 0xe8a598 });
  const leafMat = createToonMaterial({ color: 0x7dbe7a });

  if (itemId === 'furn-lantern') {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 1.4, 8), woodMat);
    stand.position.y = 0.7;
    g.add(stand);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 10, 8),
      createToonMaterial({ color: 0xff5a5f, emissive: 0xff5a5f, emissiveIntensity: 0.65 })
    );
    bulb.position.y = 1.45;
    attachOutline(bulb, 'building', 1.03);
    g.add(bulb);
  } else if (itemId === 'furn-rug') {
    const rug = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.04, 1.45), createToonMaterial({ color: 0x6baa8e }));
    rug.position.y = 0.025;
    g.add(rug);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 1.05), coralMat);
    inner.position.y = 0.028;
    g.add(inner);
  } else if (itemId === 'furn-plant') {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.42, 8), createToonMaterial({ color: 0xc97b6b }));
    pot.position.y = 0.21;
    attachOutline(pot, 'building', 1.03);
    g.add(pot);
    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), leafMat);
      const a = (i * Math.PI) / 2;
      leaf.position.set(Math.cos(a) * 0.18, 0.65 + (i % 2) * 0.14, Math.sin(a) * 0.18);
      g.add(leaf);
    }
  } else if (itemId === 'furn-sofa') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.36, 0.68), woodMat);
    base.position.y = 0.2;
    attachOutline(base, 'building', 1.025);
    g.add(base);
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.16, 0.58), mintMat);
    cushion.position.set(0, 0.44, 0.02);
    g.add(cushion);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.16), woodMat);
    back.position.set(0, 0.56, -0.26);
    g.add(back);
  } else if (itemId === 'furn-table') {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 10), woodMat);
    top.position.y = 0.58;
    attachOutline(top, 'building', 1.025);
    g.add(top);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.56, 8), woodMat);
    leg.position.y = 0.28;
    g.add(leg);
    const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), creamMat);
    teapot.position.y = 0.7;
    g.add(teapot);
  } else if (itemId === 'furn-catbed') {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.16, 12), creamMat);
    ring.position.y = 0.08;
    attachOutline(ring, 'building', 1.03);
    g.add(ring);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 12), coralMat);
    inner.position.y = 0.09;
    g.add(inner);
  } else if (itemId === 'furn-bookshelf') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.55, 0.36), woodMat);
    frame.position.y = 0.78;
    attachOutline(frame, 'building', 1.02);
    g.add(frame);
    for (let s = 0; s < 3; s++) {
      const books = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.22, 0.28),
        s === 0 ? coralMat : s === 1 ? mintMat : creamMat
      );
      books.position.set(0, 0.35 + s * 0.42, 0.04);
      g.add(books);
    }
  } else {
    // furn-neon
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.52, 0.1), createToonMaterial({ color: 0x2b2118 }));
    post.position.y = 1.1;
    g.add(post);
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.12, 0.14), new THREE.MeshBasicMaterial({ color: 0xff4fa3 }));
    bar1.position.y = 1.2;
    g.add(bar1);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.14), new THREE.MeshBasicMaterial({ color: 0x3de0ff }));
    bar2.position.y = 0.98;
    g.add(bar2);
  }

  return g;
}
