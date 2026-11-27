import { DEFAULT_TIME_OF_DAY } from '../dayNight/dayNightMath';
import type {
  BankTransaction,
  HairStyleId,
  HatStyleId,
  LanguageCode,
  OutfitId,
  PlacedFurnitureItem,
  PlayerState,
  QualityLevel,
  SaveData,
} from '../types';

export const SAVE_STORAGE_KEY = 'penang_days_save_v3';
export const LEGACY_SAVE_STORAGE_KEY = 'penang_days_save_v2';

export const DEFAULT_SPAWN_PLAYER: PlayerState = {
  x: 0.0,
  y: 0,
  z: -3.2,
  yaw: 0,
};

export function detectRecommendedQuality(): QualityLevel {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'medium';
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const isTouch =
    (window.matchMedia?.('(pointer: coarse)')?.matches ?? false) || 'ontouchstart' in window;

  if (cores <= 2 || mem <= 2) return 'low';
  if (isTouch) return 'medium';
  return 'high';
}

export function createDefaultSaveData(): SaveData {
  return {
    version: 3,
    player: { ...DEFAULT_SPAWN_PLAYER },
    timeOfDay: DEFAULT_TIME_OF_DAY,
    dayCount: 1,
    stats: {
      level: 1,
      xp: 0,
      xpToNext: 100,
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      moneyRM: 500,
    },
    quests: {
      activeQuestId: 'main-1-ahkow',
      trackedQuestId: 'main-1-ahkow',
      completedIds: [],
      acceptedIds: ['main-1-ahkow'],
      flags: {},
      timedDelivery: null,
    },
    foodPassport: [],
    ownedOutfits: ['linen-teal'],
    equippedOutfit: 'linen-teal',
    wardrobe: {
      hairStyle: 'short',
      hairColorHex: 0x2c221e,
      hatStyle: 'none',
      umbrellaColorHex: 0xe8a598,
    },
    motorcycle: {
      owned: false,
      x: 2.6,
      y: 0,
      z: 3.5,
      yaw: 1.5,
      fuel: 100,
      maxFuel: 100,
      condition: 100,
      maxCondition: 100,
    },
    car: {
      owned: false,
      x: -4.2,
      y: 0,
      z: 3.7,
      yaw: 1.57,
      fuel: 100,
      maxFuel: 100,
      condition: 100,
      maxCondition: 100,
      colorHex: 0xbfd8e8,
    },
    npcAffinity: {},
    placedFurniture: [],
    ownedFurnitureIds: [],
    discoveredLandmarks: [],
    unlockedAchievements: [],
    dailyChallenge: {
      dayCount: 1,
      progressById: {},
      claimedIds: [],
    },
    bankLedger: [
      {
        id: 'init-savings',
        timeText: 'Day 1',
        labelZh: '乔治市新居安家金',
        labelEn: 'George Town Starter Savings',
        labelMs: 'Simpanan Awal George Town',
        amountRM: 500,
      },
    ],
    photosTakenCount: 0,
    minigamesWon: {},
    tutorialCompleted: false,
    settings: {
      quality: detectRecommendedQuality(),
      volume: 0.65,
      sensitivity: 1.0,
      language: 'zh',
    },
    updatedAt: Date.now(),
  };
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

const VALID_HAIRS: HairStyleId[] = ['short', 'bob', 'ponytail', 'curly'];
const VALID_HATS: HatStyleId[] = ['none', 'straw', 'cap', 'beanie'];
const VALID_LANGS: LanguageCode[] = ['zh', 'en', 'ms'];

export function sanitizeSaveData(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const player = obj.player as Record<string, unknown> | undefined;
  if (!player || typeof player !== 'object') return null;

  if (
    !isFiniteNumber(player.x) ||
    !isFiniteNumber(player.y) ||
    !isFiniteNumber(player.z) ||
    !isFiniteNumber(player.yaw) ||
    !isFiniteNumber(obj.timeOfDay) ||
    !isFiniteNumber(obj.dayCount)
  ) {
    return null;
  }

  const def = createDefaultSaveData();
  const s = (obj.stats as Record<string, unknown>) || {};
  const q = (obj.quests as Record<string, unknown>) || {};
  const m = (obj.motorcycle as Record<string, unknown>) || {};
  const c = (obj.car as Record<string, unknown>) || {};
  const w = (obj.wardrobe as Record<string, unknown>) || {};
  const dc = (obj.dailyChallenge as Record<string, unknown>) || {};
  const cfg = (obj.settings as Record<string, unknown>) || {};

  const quality =
    cfg.quality === 'low' || cfg.quality === 'medium' || cfg.quality === 'high'
      ? cfg.quality
      : def.settings.quality;
  const language: LanguageCode = VALID_LANGS.includes(cfg.language as LanguageCode)
    ? (cfg.language as LanguageCode)
    : def.settings.language;

  const placedFurniture: PlacedFurnitureItem[] = Array.isArray(obj.placedFurniture)
    ? obj.placedFurniture
        .filter((f): f is PlacedFurnitureItem => {
          if (!f || typeof f !== 'object') return false;
          const item = f as Record<string, unknown>;
          return (
            typeof item.instanceId === 'string' &&
            typeof item.itemId === 'string' &&
            (item.floor === 1 || item.floor === 2) &&
            isFiniteNumber(item.gridX) &&
            isFiniteNumber(item.gridZ) &&
            isFiniteNumber(item.rotationDeg)
          );
        })
        .slice(0, 40)
    : [];

  const bankLedger: BankTransaction[] = Array.isArray(obj.bankLedger)
    ? obj.bankLedger
        .filter((b): b is BankTransaction => {
          if (!b || typeof b !== 'object') return false;
          const t = b as Record<string, unknown>;
          return (
            typeof t.id === 'string' &&
            typeof t.timeText === 'string' &&
            typeof t.labelZh === 'string' &&
            typeof t.labelEn === 'string' &&
            typeof t.labelMs === 'string' &&
            isFiniteNumber(t.amountRM)
          );
        })
        .slice(0, 30)
    : def.bankLedger;

  return {
    version: 3,
    player: {
      x: Math.max(-192, Math.min(192, player.x)),
      y: Math.max(0, Math.min(24, player.y)),
      z: Math.max(-172, Math.min(172, player.z)),
      yaw: player.yaw,
    },
    timeOfDay: ((obj.timeOfDay % 1) + 1) % 1,
    dayCount: Math.max(1, Math.floor(obj.dayCount)),
    stats: {
      level: isFiniteNumber(s.level) ? Math.max(1, Math.floor(s.level)) : def.stats.level,
      xp: isFiniteNumber(s.xp) ? Math.max(0, s.xp) : def.stats.xp,
      xpToNext: isFiniteNumber(s.xpToNext) ? Math.max(50, s.xpToNext) : def.stats.xpToNext,
      hp: isFiniteNumber(s.hp) ? Math.max(0, s.hp) : def.stats.hp,
      maxHp: isFiniteNumber(s.maxHp) ? Math.max(50, s.maxHp) : def.stats.maxHp,
      stamina: isFiniteNumber(s.stamina) ? Math.max(0, s.stamina) : def.stats.stamina,
      maxStamina: isFiniteNumber(s.maxStamina) ? Math.max(50, s.maxStamina) : def.stats.maxStamina,
      moneyRM: isFiniteNumber(s.moneyRM) ? Math.max(0, s.moneyRM) : def.stats.moneyRM,
    },
    quests: {
      activeQuestId: typeof q.activeQuestId === 'string' ? q.activeQuestId : def.quests.activeQuestId,
      trackedQuestId: typeof q.trackedQuestId === 'string' ? q.trackedQuestId : def.quests.trackedQuestId,
      completedIds: Array.isArray(q.completedIds) ? (q.completedIds.filter((x) => typeof x === 'string') as string[]) : [],
      acceptedIds: Array.isArray(q.acceptedIds) ? (q.acceptedIds.filter((x) => typeof x === 'string') as string[]) : ['main-1-ahkow'],
      flags: q.flags && typeof q.flags === 'object' ? (q.flags as Record<string, boolean | number | string>) : {},
      timedDelivery: null,
    },
    foodPassport: Array.isArray(obj.foodPassport)
      ? (obj.foodPassport.filter((x) => typeof x === 'string') as string[])
      : [],
    ownedOutfits: Array.isArray(obj.ownedOutfits)
      ? (obj.ownedOutfits.filter((x) => typeof x === 'string') as OutfitId[])
      : ['linen-teal'],
    equippedOutfit: typeof obj.equippedOutfit === 'string' ? (obj.equippedOutfit as OutfitId) : 'linen-teal',
    wardrobe: {
      hairStyle: VALID_HAIRS.includes(w.hairStyle as HairStyleId)
        ? (w.hairStyle as HairStyleId)
        : def.wardrobe.hairStyle,
      hairColorHex: isFiniteNumber(w.hairColorHex) ? w.hairColorHex : def.wardrobe.hairColorHex,
      hatStyle: VALID_HATS.includes(w.hatStyle as HatStyleId)
        ? (w.hatStyle as HatStyleId)
        : def.wardrobe.hatStyle,
      umbrellaColorHex: isFiniteNumber(w.umbrellaColorHex)
        ? w.umbrellaColorHex
        : def.wardrobe.umbrellaColorHex,
    },
    motorcycle: {
      owned: Boolean(m.owned),
      x: isFiniteNumber(m.x) ? m.x : def.motorcycle.x,
      y: 0,
      z: isFiniteNumber(m.z) ? m.z : def.motorcycle.z,
      yaw: isFiniteNumber(m.yaw) ? m.yaw : def.motorcycle.yaw,
      fuel: isFiniteNumber(m.fuel) ? Math.max(0, Math.min(100, m.fuel)) : 100,
      maxFuel: 100,
      condition: isFiniteNumber(m.condition) ? Math.max(0, Math.min(100, m.condition)) : 100,
      maxCondition: 100,
    },
    car: {
      owned: Boolean(c.owned),
      x: isFiniteNumber(c.x) ? c.x : def.car.x,
      y: 0,
      z: isFiniteNumber(c.z) ? c.z : def.car.z,
      yaw: isFiniteNumber(c.yaw) ? c.yaw : def.car.yaw,
      fuel: isFiniteNumber(c.fuel) ? Math.max(0, Math.min(100, c.fuel)) : 100,
      maxFuel: 100,
      condition: isFiniteNumber(c.condition) ? Math.max(0, Math.min(100, c.condition)) : 100,
      maxCondition: 100,
      colorHex: isFiniteNumber(c.colorHex) ? c.colorHex : def.car.colorHex,
    },
    npcAffinity:
      obj.npcAffinity && typeof obj.npcAffinity === 'object'
        ? (obj.npcAffinity as Record<string, number>)
        : {},
    placedFurniture,
    ownedFurnitureIds: Array.isArray(obj.ownedFurnitureIds)
      ? (obj.ownedFurnitureIds.filter((x) => typeof x === 'string') as string[])
      : [],
    discoveredLandmarks: Array.isArray(obj.discoveredLandmarks)
      ? (obj.discoveredLandmarks.filter((x) => typeof x === 'string') as string[])
      : [],
    unlockedAchievements: Array.isArray(obj.unlockedAchievements)
      ? (obj.unlockedAchievements.filter((x) => typeof x === 'string') as string[])
      : [],
    dailyChallenge: {
      dayCount: isFiniteNumber(dc.dayCount) ? Math.max(1, Math.floor(dc.dayCount)) : Math.max(1, Math.floor(obj.dayCount)),
      progressById:
        dc.progressById && typeof dc.progressById === 'object'
          ? (dc.progressById as Record<string, number>)
          : {},
      claimedIds: Array.isArray(dc.claimedIds)
        ? (dc.claimedIds.filter((x) => typeof x === 'string') as string[])
        : [],
    },
    bankLedger,
    photosTakenCount: isFiniteNumber(obj.photosTakenCount)
      ? Math.max(0, Math.floor(obj.photosTakenCount))
      : 0,
    minigamesWon:
      obj.minigamesWon && typeof obj.minigamesWon === 'object'
        ? (obj.minigamesWon as Record<string, number>)
        : {},
    tutorialCompleted: Boolean(obj.tutorialCompleted),
    settings: {
      quality,
      volume: isFiniteNumber(cfg.volume) ? Math.max(0, Math.min(1, cfg.volume)) : def.settings.volume,
      sensitivity: isFiniteNumber(cfg.sensitivity)
        ? Math.max(0.4, Math.min(2.0, cfg.sensitivity))
        : def.settings.sensitivity,
      language,
    },
    updatedAt: isFiniteNumber(obj.updatedAt) ? obj.updatedAt : Date.now(),
  };
}

export function loadSaveData(
  storage: Pick<Storage, 'getItem'> | null = getBrowserStorage()
): SaveData | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SAVE_STORAGE_KEY) ?? storage.getItem(LEGACY_SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return sanitizeSaveData(parsed);
  } catch {
    return null;
  }
}

export function writeSaveData(
  data: SaveData,
  storage: Pick<Storage, 'setItem'> | null = getBrowserStorage()
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearSaveData(storage: Pick<Storage, 'removeItem'> | null = getBrowserStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(SAVE_STORAGE_KEY);
    storage.removeItem(LEGACY_SAVE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

function getBrowserStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}
