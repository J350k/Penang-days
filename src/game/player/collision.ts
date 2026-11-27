import { pickLang } from '../i18n';
import type { AABB, LanguageCode, StairVolume, WorldCollisionData } from '../types';

export const PLAYER_RADIUS = 0.36;
export const PLAYER_HEIGHT = 1.65;

/**
 * Checks if a cylinder (approximated as circle in XZ + vertical [y, y+height]) intersects an AABB.
 */
export function circleIntersectsAABB(
  x: number,
  y: number,
  z: number,
  radius: number,
  height: number,
  box: AABB
): boolean {
  if (y + height <= box.minY + 0.05 || y + 0.25 >= box.maxY) {
    return false;
  }
  const closestX = Math.max(box.minX, Math.min(x, box.maxX));
  const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
  const dx = x - closestX;
  const dz = z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

function getStairHeightAt(z: number, stair: StairVolume): number {
  const t = Math.max(0, Math.min(1, (z - stair.startZ) / (stair.endZ - stair.startZ)));
  return stair.startY + (stair.endY - stair.startY) * t;
}

/**
 * Resolves vertical floor / stair / temple terrace / summit deck elevation smoothly.
 */
export function resolveFloorHeight(
  x: number,
  z: number,
  currentY: number,
  world: WorldCollisionData
): number {
  for (const stair of world.stairs) {
    if (x >= stair.minX && x <= stair.maxX && z >= stair.minZ && z <= stair.maxZ) {
      const targetStairY = getStairHeightAt(z, stair);
      if (Math.abs(currentY - targetStairY) <= 1.35) {
        return targetStairY;
      }
    }
  }

  // Pick the highest upper floor slab the player is currently standing near in elevation
  let matchedY: number | null = null;
  for (const slab of world.upperFloorBoxes) {
    if (
      x >= slab.minX &&
      x <= slab.maxX &&
      z >= slab.minZ &&
      z <= slab.maxZ &&
      Math.abs(currentY - slab.y) <= 1.3
    ) {
      if (matchedY === null || slab.y > matchedY) {
        matchedY = slab.y;
      }
    }
  }
  if (matchedY !== null) {
    return matchedY;
  }

  return 0;
}

/**
 * Resolves player movement in XZ with sliding along walls, staircase elevation, and world bounds.
 */
export function resolvePlayerMovement(
  currentX: number,
  currentY: number,
  currentZ: number,
  dx: number,
  dz: number,
  world: WorldCollisionData,
  radius: number = PLAYER_RADIUS
): { x: number; y: number; z: number; collided: boolean } {
  const maxStep = Math.max(0.08, radius * 0.4);
  const dist = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(dist / maxStep));
  const stepDx = dx / steps;
  const stepDz = dz / steps;

  let x = currentX;
  let y = currentY;
  let z = currentZ;
  let collided = false;

  for (let s = 0; s < steps; s++) {
    let nextX = Math.max(world.bounds.minX + radius, Math.min(world.bounds.maxX - radius, x + stepDx));
    let nextZ = Math.max(world.bounds.minZ + radius, Math.min(world.bounds.maxZ - radius, z + stepDz));

    let testY = resolveFloorHeight(nextX, z, y, world);
    for (const box of world.colliders) {
      if (circleIntersectsAABB(nextX, testY, z, radius, PLAYER_HEIGHT, box)) {
        nextX = x;
        collided = true;
        break;
      }
    }

    testY = resolveFloorHeight(nextX, nextZ, y, world);
    for (const box of world.colliders) {
      if (circleIntersectsAABB(nextX, testY, nextZ, radius, PLAYER_HEIGHT, box)) {
        nextZ = z;
        collided = true;
        break;
      }
    }

    x = nextX;
    z = nextZ;
    y = resolveFloorHeight(x, z, y, world);
  }

  return { x, y, z, collided };
}

/**
 * Returns a tri-lingual human-readable neighborhood/room location string for the HUD.
 */
export function getLocationLabel(x: number, y: number, z: number, lang: LanguageCode = 'zh'): string {
  // Inside player's shophouse
  if (x >= -4.5 && x <= 4.5 && z >= -14.0 && z <= 0.0) {
    if (y >= 2.6) {
      if (z >= -5.5) return pickLang(lang, '二楼卧室', '2F Bedroom', 'Bilik Tidur 2F');
      return pickLang(lang, '二楼走廊', '2F Hallway', 'Koridor 2F');
    }
    if (x >= 2.2 && z <= -5.5 && z >= -11.5 && y > 0.25) {
      return pickLang(lang, '木楼梯', 'Wooden Stairs', 'Tangga Kayu');
    }
    if (z >= -5.5) return pickLang(lang, '一楼客厅', '1F Living Room', 'Ruang Tamu 1F');
    if (z >= -9.2) return pickLang(lang, '天井', 'Air Well', 'Telaga Udara');
    return pickLang(lang, '一楼小厨房', '1F Kitchen', 'Dapur 1F');
  }

  if (x >= -4.5 && x <= 4.5 && z > 0.0 && z <= 2.4) {
    return pickLang(lang, '自家五脚基', 'Five-Foot Way', 'Kaki Lima Rumah');
  }

  // Expanded regions (Part C)
  if (x >= 126 && z >= 60) {
    return pickLang(lang, '北海渡轮对岸', 'Butterworth Mainland Pier', 'Jeti Butterworth');
  }
  if (x >= 96 && z >= 22 && z <= 60) {
    return pickLang(lang, '光大购物中心', 'Komtar Mall Interior', 'Pusat Beli-belah Komtar');
  }
  if (x <= -132 && z <= -104 && y >= 15) {
    return pickLang(lang, '升旗山山顶', 'Penang Hill Summit', 'Puncak Bukit Bendera');
  }
  if (x <= -114 && z >= -64 && z <= -22) {
    return pickLang(lang, '极乐禅寺', 'Kek Lok Temple', 'Kuil Kek Lok');
  }
  if (x <= -92 && z >= 50 && z <= 80) {
    return pickLang(lang, '关仔角海滨长廊', 'Gurney Promenade', 'Persiaran Gurney');
  }
  if (x <= -92 && z > 80) {
    return pickLang(lang, '峇都丁宜海滩', 'Ferringhi Beach', 'Pantai Ferringhi');
  }

  if (x >= 44 && x <= 68 && z >= -24 && z <= 0) {
    return pickLang(lang, '加油站 · Petrol Station', 'Petrol Station', 'Stesen Minyak');
  }
  if (x >= 50 && z >= 18 && z <= 62) {
    return pickLang(lang, '光大商圈 · Komtar Plaza', 'Komtar Plaza', 'Plaza Komtar');
  }
  if (x <= -42 && z >= 16 && z <= 40) {
    return pickLang(lang, '乔治市小公园 · Heritage Park', 'Heritage Park', 'Taman Warisan');
  }
  if (z >= 68) {
    return pickLang(lang, '海边码头 · Esplanade Pier', 'Esplanade Pier', 'Jeti Esplanade');
  }
  if (z <= -34) {
    return pickLang(lang, '巴刹早市 · Market Street', 'Market Street', 'Jalan Pasar');
  }
  if (x >= 22 && x <= 34) {
    return pickLang(lang, '椰脚街 · Jalan Kapitan', 'Jalan Kapitan', 'Jalan Kapitan');
  }
  if (x <= -22 && x >= -34) {
    return pickLang(lang, '壁画街 · Mural Lane', 'Mural Lane', 'Lorong Mural');
  }
  if (z >= 36 && z <= 48) {
    return pickLang(lang, '光大大道 · Komtar Blvd', 'Komtar Blvd', 'Lebuh Komtar');
  }

  return pickLang(lang, '打铜仔街 · Armenian St', 'Armenian Street', 'Lebuh Armenian');
}
