export type GameMode = 'title' | 'playing' | 'paused';
export type QualityLevel = 'low' | 'medium' | 'high';
export type LanguageCode = 'zh' | 'en' | 'ms';

export type VehicleKind = 'motorcycle' | 'car' | 'trishaw';
export type PhotoFilterId = 'none' | 'warm' | 'vintage' | 'neon' | 'bw';
export type HairStyleId = 'short' | 'bob' | 'ponytail' | 'curly';
export type HatStyleId = 'none' | 'straw' | 'cap' | 'beanie';

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  moneyRM: number;
}

export type OutfitId = 'linen-teal' | 'nyonya-coral' | 'batik-gold' | 'kopitiam-cream';

export interface WardrobeState {
  hairStyle: HairStyleId;
  hairColorHex: number;
  hatStyle: HatStyleId;
  umbrellaColorHex: number;
}

export interface SettingsState {
  quality: QualityLevel;
  volume: number; // [0, 1]
  sensitivity: number; // [0.4, 2.0]
  language: LanguageCode;
}

export interface MotorcycleState {
  owned: boolean;
  mounted: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number; // m/s
  fuel: number; // [0, 100]
  maxFuel: number;
  condition: number; // [0, 100]
  maxCondition: number;
}

export interface CarState {
  owned: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  fuel: number;
  maxFuel: number;
  condition: number;
  maxCondition: number;
  colorHex: number;
}

export interface ActiveVehicleHud {
  mounted: boolean;
  kind: VehicleKind;
  x: number;
  z: number;
  speed: number; // m/s
  rpm: number; // [800, 6800]
  gear: string; // 'N' | 'R' | '1'..'5' | 'PEDAL'
  fuel: number;
  condition: number;
}

export interface PlacedFurnitureItem {
  instanceId: string;
  itemId: string;
  floor: 1 | 2;
  gridX: number;
  gridZ: number;
  rotationDeg: number; // 0 | 90 | 180 | 270
}

export interface BankTransaction {
  id: string;
  timeText: string;
  labelZh: string;
  labelEn: string;
  labelMs: string;
  amountRM: number; // positive income, negative expense
}

export interface PhotoAlbumItem {
  id: string;
  dataUrl: string;
  filter: PhotoFilterId;
  locationName: string;
  tags: string[];
  takenAt: number;
}

export interface DailyChallengeProgress {
  dayCount: number;
  progressById: Record<string, number>;
  claimedIds: string[];
}

export interface QuestProgressState {
  activeQuestId: string | null;
  trackedQuestId: string | null;
  completedIds: string[];
  acceptedIds: string[];
  flags: Record<string, boolean | number | string>;
  timedDelivery?: {
    active: boolean;
    targetX: number;
    targetZ: number;
    targetName: string;
    remainingSec: number;
  } | null;
}

export interface SaveData {
  version: number;
  player: PlayerState;
  timeOfDay: number;
  dayCount: number;
  stats: PlayerStats;
  quests: QuestProgressState;
  foodPassport: string[];
  ownedOutfits: OutfitId[];
  equippedOutfit: OutfitId;
  wardrobe: WardrobeState;
  motorcycle: Omit<MotorcycleState, 'mounted' | 'speed'>;
  car: CarState;
  npcAffinity: Record<string, number>;
  placedFurniture: PlacedFurnitureItem[];
  ownedFurnitureIds: string[];
  discoveredLandmarks: string[];
  unlockedAchievements: string[];
  dailyChallenge: DailyChallengeProgress;
  bankLedger: BankTransaction[];
  photosTakenCount: number;
  minigamesWon: Record<string, number>;
  tutorialCompleted: boolean;
  settings: SettingsState;
  updatedAt: number;
}

export interface AABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  label?: string;
}

export interface StairVolume {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  startZ: number;
  endZ: number;
  startY: number;
  endY: number;
}

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WorldCollisionData {
  colliders: AABB[];
  stairs: StairVolume[];
  bounds: WorldBounds;
  upperFloorBoxes: Array<{ minX: number; maxX: number; minZ: number; maxZ: number; y: number }>;
}

export interface TimeOfDayInfo {
  normalizedTime: number;
  dayCount: number;
  hours: number;
  minutes: number;
  formattedTime: string;
  periodName: string;
  isNight: boolean;
  streetLampFactor: number;
}

export interface AtmosphereColors {
  skyHex: string;
  fogHex: string;
  sunHex: string;
  sunIntensity: number;
  sunElevationRad: number;
  sunAzimuthRad: number;
  hemiSkyHex: string;
  hemiGroundHex: string;
  hemiIntensity: number;
  indoorFillIntensity: number;
  streetLampFactor: number;
}

export interface WeatherSnapshot {
  isRaining: boolean;
  rainIntensity: number; // [0, 1]
  wetFactor: number; // [0, 1]
}

export type MinimapMarkerType = 'quest' | 'food' | 'shop' | 'gas' | 'npc' | 'bus' | 'ferry' | 'landmark';

export interface MinimapMarker {
  id: string;
  type: MinimapMarkerType;
  x: number;
  z: number;
  label: string;
}

export type NearbyPromptType =
  | 'npc'
  | 'stall'
  | 'shop'
  | 'motorcycle'
  | 'car'
  | 'trishaw'
  | 'gas'
  | 'photo'
  | 'ferry'
  | 'bus'
  | 'tram'
  | 'temple'
  | 'jetski'
  | 'decor'
  | 'wardrobe'
  | 'minigame';

export interface NearbyPrompt {
  type: NearbyPromptType;
  id: string;
  label: string;
  actionText: string;
}

export interface TaskDisplayItem {
  id: string;
  isMain: boolean;
  title: string;
  description: string;
  completed: boolean;
  accepted: boolean;
  distanceMeters: number | null;
  targetX?: number;
  targetZ?: number;
}

export interface HudSnapshot {
  timeInfo: TimeOfDayInfo;
  weather: WeatherSnapshot;
  locationName: string;
  isIndoors: boolean;
  isRunning: boolean;
  floorLevel: 1 | 2;
  stats: PlayerStats;
  playerPos: PlayerState;
  motorcycle: MotorcycleState;
  carOwned: boolean;
  activeVehicle: ActiveVehicleHud;
  trackedQuestId: string | null;
  trackedTarget: { x: number; z: number; label: string; distance: number } | null;
  tasks: TaskDisplayItem[];
  nearbyPrompt: NearbyPrompt | null;
  minimapMarkers: MinimapMarker[];
  foodPassportCount: number;
  discoveredLandmarksCount: number;
  unlockedAchievementsCount: number;
  timedDeliveryRemaining: number | null;
}

export interface FoodItem {
  id: string;
  nameZh: string;
  nameEn: string;
  nameMs: string;
  priceRM: number;
  hpRestore: number;
  staminaRestore: number;
  descZh: string;
  descEn: string;
  descMs: string;
  stallId: string;
}

export interface OutfitItem {
  id: OutfitId;
  nameZh: string;
  nameEn: string;
  nameMs: string;
  priceRM: number;
  shirtHex: number;
  vestHex: number;
  pantsHex: number;
}

export interface DialogueChoice {
  labelZh: string;
  labelEn: string;
  labelMs?: string;
  action: 'next' | 'accept_quest' | 'complete_quest' | 'open_shop' | 'open_minigame' | 'chat_affinity' | 'close';
  nextNodeId?: string;
  questId?: string;
  shopId?: string;
  minigameId?: 'ckt-rhythm' | 'mural-puzzle';
  affinityDelta?: number;
}

export interface DialogueNode {
  id: string;
  speakerZh: string;
  speakerEn: string;
  speakerMs?: string;
  textZh: string;
  textEn: string;
  textMs?: string;
  choices: DialogueChoice[];
}

export interface NpcScheduleSlot {
  startHour: number;
  endHour: number;
  x: number;
  z: number;
  yaw: number;
  activityZh: string;
  activityEn: string;
  activityMs?: string;
}

export interface NpcDefinition {
  id: string;
  nameZh: string;
  nameEn: string;
  nameMs?: string;
  roleZh: string;
  roleEn: string;
  roleMs?: string;
  shirtHex: number;
  pantsHex: number;
  hairHex: number;
  hatHex?: number;
  isCat?: boolean;
  schedule: NpcScheduleSlot[];
}
