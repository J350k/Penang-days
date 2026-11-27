import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ProceduralSoundEngine } from './audio/soundEngine';
import { DayNightSystem } from './dayNight/DayNightSystem';
import { DEFAULT_TIME_OF_DAY, advanceTimeOfDay, formatGameTime } from './dayNight/dayNightMath';
import { pickLang, t } from './i18n';
import { NpcManager } from './npc/NpcManager';
import { NAMED_NPCS } from './npc/npcData';
import { ThirdPersonCameraRig } from './player/cameraRig';
import { createCharacterRig, type CharacterRig } from './player/characterMesh';
import { getLocationLabel, resolvePlayerMovement } from './player/collision';
import { InputManager } from './player/inputManager';
import {
  DEFAULT_SPAWN_PLAYER,
  createDefaultSaveData,
  loadSaveData,
  writeSaveData,
} from './storage/saveSystem';
import {
  FURNITURE_CATALOG,
  buildFurnitureMesh,
  canPlaceFurniture,
  computeDecorScore,
  gridToWorld,
} from './systems/homeDecoration';
import {
  CAR_PRICE_RM,
  FOOD_CATALOG,
  GAS_STATION_POS,
  MOTORCYCLE_PRICE_RM,
  MOTORCYCLE_SHOP_POS,
  OUTFIT_CATALOG,
  QUEST_DEFINITIONS,
  awardRewards,
  buildTaskDisplayList,
  evaluateAchievements,
  getDailyChallenges,
  updatePlayerStamina,
} from './systems/progression';
import type {
  ActiveVehicleHud,
  BankTransaction,
  CarState,
  DailyChallengeProgress,
  GameMode,
  HudSnapshot,
  MinimapMarker,
  MotorcycleState,
  NearbyPrompt,
  OutfitId,
  PhotoAlbumItem,
  PhotoFilterId,
  PlacedFurnitureItem,
  PlayerState,
  PlayerStats,
  QuestProgressState,
  SaveData,
  SettingsState,
  VehicleKind,
  WardrobeState,
  WorldCollisionData,
} from './types';
import { TrafficManager } from './vehicle/TrafficManager';
import {
  computeVehicleMetrics,
  detectTrafficViolation,
  stepVehicle,
} from './vehicle/motorcyclePhysics';
import { RainSystem } from './weather/RainSystem';
import { evaluateRainAtTime, scheduleDailyShowers, updateWetFactor } from './weather/weatherMath';
import {
  BUS_STOPS,
  FERRY_ISLAND_POS,
  FERRY_MAINLAND_POS,
  JETSKI_DOCK_POS,
  LANDMARK_ZONES,
  TEMPLE_BLESSING_POS,
  TRAM_BOTTOM_POS,
  TRAM_TOP_POS,
  buildExpandedRegions,
  type ExpandedRegionsResult,
} from './world/expandedRegions';
import { FOOD_STALL_SPECS, buildFoodStalls, type FoodStallsResult } from './world/foodStalls';
import { buildGeorgeTownStreets, type WorldChunk } from './world/georgetownStreets';
import { buildGeorgeTownLandmarks, type LandmarksResult } from './world/landmarks';
import {
  createCarGroup,
  createMotorcycleGroup,
  createTrishawGroup,
} from './world/props';
import { buildPlayerShophouse } from './world/shophousePlayerHome';
import { createProceduralTextures, type ProceduralTextureSet } from './world/textures';
import { applyOutlineQualityPolicy } from './world/toonMaterials';

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onPauseToggle: () => void;
  onPhoneToggle: () => void;
  onPhotoToggle: () => void;
  onPromptInteract: (prompt: NearbyPrompt) => void;
  onToast: (message: string) => void;
}

const WALK_SPEED = 3.5;
const RUN_SPEED = 6.0;

const DELIVERY_DESTINATIONS = [
  { x: -28, z: -13, nameZh: '壁画街画廊路口', nameEn: 'Mural Lane Junction', nameMs: 'Simpang Lorong Mural' },
  { x: -58, z: 26, nameZh: '乔治市小公园凉亭', nameEn: 'Heritage Park Gazebo', nameMs: 'Pondok Taman Warisan' },
  { x: 10, z: 78, nameZh: '海边码头木栈道', nameEn: 'Esplanade Pier Deck', nameMs: 'Dek Jeti Esplanade' },
  { x: 64, z: 36, nameZh: '光大商圈广场', nameEn: 'Komtar Plaza', nameMs: 'Plaza Komtar' },
  { x: -116, z: 64, nameZh: '关仔角海滨长廊', nameEn: 'Gurney Promenade', nameMs: 'Persiaran Gurney' },
];

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function shortestAngleDiff(from: number, to: number): number {
  let diff = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export class PenangGameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sunLight: THREE.DirectionalLight;
  private isSoftwareGl: boolean;
  private textures: ProceduralTextureSet;
  private character: CharacterRig;
  private cameraRig: ThirdPersonCameraRig;
  private input: InputManager;
  private dayNight: DayNightSystem;
  private worldData: WorldCollisionData;
  private worldChunks: WorldChunk[];
  private cameraObstacleMeshes: THREE.Object3D[];
  private ceilingFan: THREE.Group;
  private foodStalls: FoodStallsResult;
  private landmarks: LandmarksResult;
  private expandedRegions: ExpandedRegionsResult;
  private rainSystem: RainSystem;
  private npcManager: NpcManager;
  private trafficManager: TrafficManager;
  private soundEngine: ProceduralSoundEngine;

  // Player-controlled vehicles
  private ownedBikeMesh: THREE.Group;
  private ownedCarMesh: THREE.Group;
  private trishawMesh: THREE.Group;
  private decorGroup: THREE.Group;
  private navArrowGroup: THREE.Group;

  private mode: GameMode = 'title';
  private uiModalOpen = false;
  private photoModeActive = false;
  private player: PlayerState = { ...DEFAULT_SPAWN_PLAYER };
  private timeOfDay = DEFAULT_TIME_OF_DAY;
  private dayCount = 1;
  private stats: PlayerStats;
  private quests: QuestProgressState;
  private foodPassport: string[];
  private ownedOutfits: OutfitId[];
  private equippedOutfit: OutfitId;
  private wardrobe: WardrobeState;

  private motorcycle: MotorcycleState;
  private car: CarState;
  private activeVehicleKind: VehicleKind | null = null;
  private activeVehicleSpeed = 0;
  private activeVehicleRpm = 850;
  private activeVehicleGear = 'N';
  private trishawPos = { x: -7.2, z: 13.8, yaw: Math.PI / 2 };

  private npcAffinity: Record<string, number>;
  private placedFurniture: PlacedFurnitureItem[];
  private ownedFurnitureIds: string[];
  private discoveredLandmarks: string[];
  private unlockedAchievements: string[];
  private dailyChallenge: DailyChallengeProgress;
  private bankLedger: BankTransaction[];
  private photosTakenCount = 0;
  private minigamesWon: Record<string, number> = {};
  private tutorialCompleted = false;
  private settings: SettingsState;

  private sprintExhausted = false;
  private rainIntensity = 0;
  private isRaining = false;
  private wetFactor = 0;
  private elapsedSec = 0;
  private currentNearbyPrompt: NearbyPrompt | null = null;
  private ticketCooldownSec = 0;
  private lastVisitedHomeDay = 1;

  // FPS auto-downgrade tracking
  private fpsWindowTime = 0;
  private fpsFrameCount = 0;
  private lowFpsStreaks = 0;

  private frameId = 0;
  private lastTimestamp = 0;
  private titleOrbitTime = 0;
  private hudTimer = 0;
  private saveTimer = 0;
  private disposed = false;
  private resizeObserver: ResizeObserver;
  private detachInput: () => void;

  constructor(container: HTMLElement, callbacks: EngineCallbacks, initialSave?: SaveData | null) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    const save = initialSave ?? loadSaveData() ?? createDefaultSaveData();
    if (this.isSoftwareGl && save.settings.quality === 'high') {
      save.settings.quality = 'medium';
    }

    this.player = { ...save.player };
    this.timeOfDay = save.timeOfDay;
    this.dayCount = save.dayCount;
    this.stats = { ...save.stats };
    this.quests = {
      ...save.quests,
      completedIds: [...save.quests.completedIds],
      acceptedIds: [...save.quests.acceptedIds],
      flags: { ...save.quests.flags },
      timedDelivery: save.quests.timedDelivery ? { ...save.quests.timedDelivery } : null,
    };
    this.foodPassport = [...save.foodPassport];
    this.ownedOutfits = [...save.ownedOutfits];
    this.equippedOutfit = save.equippedOutfit;
    this.wardrobe = { ...save.wardrobe };
    this.motorcycle = {
      ...save.motorcycle,
      mounted: false,
      speed: 0,
    };
    this.car = { ...save.car };
    this.npcAffinity = { ...save.npcAffinity };
    this.placedFurniture = [...save.placedFurniture];
    this.ownedFurnitureIds = [...save.ownedFurnitureIds];
    this.discoveredLandmarks = [...save.discoveredLandmarks];
    this.unlockedAchievements = [...save.unlockedAchievements];
    this.dailyChallenge = {
      dayCount: save.dailyChallenge.dayCount,
      progressById: { ...save.dailyChallenge.progressById },
      claimedIds: [...save.dailyChallenge.claimedIds],
    };
    this.bankLedger = [...save.bankLedger];
    this.photosTakenCount = save.photosTakenCount;
    this.minigamesWon = { ...save.minigamesWon };
    this.tutorialCompleted = save.tutorialCompleted;
    this.settings = { ...save.settings };

    // 1. Renderer setup (preserveDrawingBuffer false; photo capture renders synchronously before toDataURL)
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xcbe4ec, 0.0052);

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 290);

    // Optional lightweight bloom composer (for High quality on real GPU)
    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.24,
        0.35,
        0.86
      );
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    }

    // 4. Lighting (Warm Hemisphere + 1 Shadow-Casting Directional Light)
    const hemiLight = new THREE.HemisphereLight(0xbce8f5, 0x9b8265, 0.9);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff0d4, 1.75);
    sunLight.castShadow = !this.isSoftwareGl;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 110;
    const d = 28;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    this.sunLight = sunLight;
    this.scene.add(sunLight);
    this.scene.add(sunLight.target);

    const indoorFillLight = new THREE.PointLight(0xffdfb0, 0.55, 18, 1.4);
    indoorFillLight.position.set(0, 2.8, -4.5);
    this.scene.add(indoorFillLight);

    // 5. Procedural World, Stalls, Landmarks, Expanded Regions, Rain, NPCs, Traffic
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    const home = buildPlayerShophouse(this.textures);
    this.scene.add(home.group);
    this.ceilingFan = home.ceilingFan;
    this.cameraObstacleMeshes = home.cameraObstacleMeshes;

    this.decorGroup = new THREE.Group();
    this.scene.add(this.decorGroup);
    this.rebuildHomeDecorMeshes();

    const streets = buildGeorgeTownStreets(this.textures);
    this.scene.add(streets.group);

    this.foodStalls = buildFoodStalls();
    this.scene.add(this.foodStalls.group);

    this.landmarks = buildGeorgeTownLandmarks();
    this.scene.add(this.landmarks.group);

    this.expandedRegions = buildExpandedRegions(this.textures.contactShadow);
    this.scene.add(this.expandedRegions.group);

    this.worldChunks = [...streets.chunks, ...this.expandedRegions.chunks];

    this.rainSystem = new RainSystem();
    this.scene.add(this.rainSystem.group);

    this.npcManager = new NpcManager(this.textures.contactShadow, this.settings.language);
    this.scene.add(this.npcManager.group);

    this.trafficManager = new TrafficManager(this.textures.contactShadow);
    this.scene.add(this.trafficManager.group);

    this.worldData = {
      colliders: [
        ...home.colliders,
        ...streets.colliders,
        ...this.foodStalls.colliders,
        ...this.landmarks.colliders,
        ...this.expandedRegions.colliders,
      ],
      stairs: [...home.stairs, ...this.expandedRegions.stairs],
      upperFloorBoxes: [...home.upperFloorBoxes, ...this.expandedRegions.upperFloorBoxes],
      bounds: { minX: -192, maxX: 192, minZ: -172, maxZ: 172 },
    };

    // 6. Player Character, Owned Vehicles, Rideable Trishaw, & Nav Arrow
    this.character = createCharacterRig(this.textures.contactShadow);
    this.syncCharacterAppearance();
    this.character.group.position.set(this.player.x, this.player.y, this.player.z);
    this.character.group.rotation.y = this.player.yaw;
    this.scene.add(this.character.group);

    this.ownedBikeMesh = createMotorcycleGroup(0xd94b3d, this.textures.contactShadow);
    this.ownedBikeMesh.visible = this.motorcycle.owned;
    this.ownedBikeMesh.position.set(this.motorcycle.x, 0, this.motorcycle.z);
    this.ownedBikeMesh.rotation.y = this.motorcycle.yaw;
    this.scene.add(this.ownedBikeMesh);

    this.ownedCarMesh = createCarGroup(this.car.colorHex, this.textures.contactShadow);
    this.ownedCarMesh.visible = this.car.owned;
    this.ownedCarMesh.position.set(this.car.x, 0, this.car.z);
    this.ownedCarMesh.rotation.y = this.car.yaw;
    this.scene.add(this.ownedCarMesh);

    this.trishawMesh = createTrishawGroup(this.textures.contactShadow);
    this.trishawMesh.position.set(this.trishawPos.x, 0, this.trishawPos.z);
    this.trishawMesh.rotation.y = this.trishawPos.yaw;
    this.scene.add(this.trishawMesh);

    this.navArrowGroup = this.buildNavigationArrow();
    this.scene.add(this.navArrowGroup);

    this.cameraRig = new ThirdPersonCameraRig();
    this.cameraRig.resetToPlayer(this.player.x, this.player.y, this.player.z, this.player.yaw);

    // 7. Day/Night & Sound Systems
    this.dayNight = new DayNightSystem({
      scene: this.scene,
      sunLight,
      hemiLight,
      indoorFillLight,
      streetLampBulbs: streets.streetLampBulbMaterials,
      streetLanternMat: streets.streetLanternMaterial,
      stallLanternMats: this.foodStalls.lanternMaterials,
      windowGlowMats: streets.windowGlowMaterials,
      homeEmissiveMaterials: home.emissiveMaterials,
      nightPointLights: streets.nightPointLights,
      roadMaterial: streets.roadMaterial,
      neonReflectionMats: streets.neonReflectionMats,
      neonSignMaterials: [
        ...streets.neonSignMaterials,
        ...this.foodStalls.neonSignMaterials,
        ...this.landmarks.neonSignMaterials,
        ...this.expandedRegions.neonSignMaterials,
      ],
    });

    this.soundEngine = new ProceduralSoundEngine();
    this.applySettings(this.settings);
    this.dayNight.update(this.timeOfDay, this.player.x, this.player.z, 0, 0);

    // 8. Input & Resize
    this.input = new InputManager(
      () => this.callbacks.onPauseToggle(),
      () => this.callbacks.onPhoneToggle(),
      () => this.callbacks.onPhotoToggle()
    );
    this.detachInput = this.input.attach(this.renderer.domElement);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.emitHudSnapshot(false);
    this.updateTitleCamera();
    this.renderScene();

    this.lastTimestamp = performance.now();
    this.scheduleNextFrame();
  }

  private renderScene(): void {
    if (this.composer && !this.isSoftwareGl && this.settings.quality === 'high') {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private syncCharacterAppearance(): void {
    const outfitSpec =
      OUTFIT_CATALOG.find((o) => o.id === this.equippedOutfit) ?? OUTFIT_CATALOG[0];
    this.character.applyWardrobe({
      hairStyle: this.wardrobe.hairStyle,
      hairColorHex: this.wardrobe.hairColorHex,
      shirtHex: outfitSpec.shirtHex,
      vestHex: outfitSpec.vestHex,
      pantsHex: outfitSpec.pantsHex,
      hatStyle: this.wardrobe.hatStyle,
      umbrellaColorHex: this.wardrobe.umbrellaColorHex,
    });
  }

  private rebuildHomeDecorMeshes(): void {
    while (this.decorGroup.children.length > 0) {
      const child = this.decorGroup.children[0];
      this.decorGroup.remove(child);
    }
    for (const item of this.placedFurniture) {
      const mesh = buildFurnitureMesh(item.itemId);
      const pos = gridToWorld(item.floor, item.gridX, item.gridZ);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.y = (item.rotationDeg * Math.PI) / 180;
      this.decorGroup.add(mesh);
    }
    applyOutlineQualityPolicy(this.decorGroup, this.settings.quality);
  }

  private buildNavigationArrow(): THREE.Group {
    const g = new THREE.Group();
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffd84d });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8), arrowMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = 0.1;
    g.add(shaft);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 8), arrowMat);
    head.rotation.x = -Math.PI / 2;
    head.position.z = -0.14;
    g.add(head);

    g.visible = false;
    return g;
  }

  private updateTitleCamera(): void {
    const camX = Math.sin(this.titleOrbitTime) * 3.8 + 2.4;
    const camZ = 10.6 + Math.cos(this.titleOrbitTime) * 1.1;
    const camY = 3.8 + Math.sin(this.titleOrbitTime * 0.7) * 0.3;
    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(-0.4, 2.7, 0.5);
  }

  // ==========================
  // Getters & Modal Locks
  // ==========================
  public getInputManager(): InputManager {
    return this.input;
  }

  public getSettings(): SettingsState {
    return { ...this.settings };
  }

  public getQuestState(): QuestProgressState {
    return this.quests;
  }

  public getFoodPassport(): string[] {
    return [...this.foodPassport];
  }

  public getOwnedOutfits(): OutfitId[] {
    return [...this.ownedOutfits];
  }

  public getEquippedOutfit(): OutfitId {
    return this.equippedOutfit;
  }

  public getWardrobeState(): WardrobeState {
    return { ...this.wardrobe };
  }

  public getNpcAffinity(npcId: string): number {
    return this.npcAffinity[npcId] ?? 0;
  }

  public getAllNpcAffinities(): Record<string, number> {
    return { ...this.npcAffinity };
  }

  public getMotorcycleState(): MotorcycleState {
    return { ...this.motorcycle };
  }

  public getCarState(): CarState {
    return { ...this.car };
  }

  public getPlacedFurniture(): PlacedFurnitureItem[] {
    return [...this.placedFurniture];
  }

  public getOwnedFurnitureIds(): string[] {
    return [...this.ownedFurnitureIds];
  }

  public getDecorScore(): number {
    return computeDecorScore(this.placedFurniture);
  }

  public getDiscoveredLandmarks(): string[] {
    return [...this.discoveredLandmarks];
  }

  public getUnlockedAchievements(): string[] {
    return [...this.unlockedAchievements];
  }

  public getDailyChallengeState(): DailyChallengeProgress {
    return {
      dayCount: this.dailyChallenge.dayCount,
      progressById: { ...this.dailyChallenge.progressById },
      claimedIds: [...this.dailyChallenge.claimedIds],
    };
  }

  public getBankLedger(): BankTransaction[] {
    return [...this.bankLedger];
  }

  public getTutorialCompleted(): boolean {
    return this.tutorialCompleted;
  }

  public markTutorialCompleted(): void {
    this.tutorialCompleted = true;
    this.saveProgress();
  }

  public setUiModalOpen(open: boolean): void {
    this.uiModalOpen = open;
    this.input.setEnabled(this.mode === 'playing' && !this.uiModalOpen);
  }

  public unlockAudio(): void {
    this.soundEngine.unlock();
  }

  public setMode(nextMode: GameMode): void {
    const prevMode = this.mode;
    this.mode = nextMode;
    this.input.setEnabled(nextMode === 'playing' && !this.uiModalOpen);
    this.soundEngine.setPaused(nextMode !== 'playing');

    if (nextMode === 'playing' && prevMode === 'title') {
      this.cameraRig.resetToPlayer(this.player.x, this.player.y, this.player.z, this.player.yaw);
      this.cameraRig.update(
        this.camera,
        this.player.x,
        this.player.y,
        this.player.z,
        this.cameraObstacleMeshes,
        0.016,
        true,
        this.activeVehicleKind !== null
      );
      this.renderScene();
    }

    if (nextMode !== 'playing') {
      this.saveProgress();
    }
    this.emitHudSnapshot(false);
  }

  public applySettings(next: SettingsState): void {
    this.settings = { ...next };
    this.soundEngine.setVolume(next.volume);

    const maxPr = next.quality === 'low' ? 1 : 2;
    const pr = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, maxPr);
    this.renderer.setPixelRatio(pr);
    if (this.composer) {
      this.composer.setPixelRatio(pr);
    }

    const shadowsOn = !this.isSoftwareGl && next.quality !== 'low';
    this.renderer.shadowMap.enabled = shadowsOn;
    this.sunLight.castShadow = shadowsOn;

    // Part A Outlines + NPC/Traffic scaling
    applyOutlineQualityPolicy(this.scene, next.quality);
    this.npcManager.setAmbientWalkerLimit(
      next.quality === 'low' ? 8 : next.quality === 'medium' ? 14 : 20
    );
    this.trafficManager.setTrafficLimit(
      next.quality === 'low' ? 4 : next.quality === 'medium' ? 8 : 12
    );

    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  public exportSaveData(): SaveData {
    return {
      version: 3,
      player: { ...this.player },
      timeOfDay: this.timeOfDay,
      dayCount: this.dayCount,
      stats: { ...this.stats },
      quests: {
        ...this.quests,
        completedIds: [...this.quests.completedIds],
        acceptedIds: [...this.quests.acceptedIds],
        flags: { ...this.quests.flags },
        timedDelivery: this.quests.timedDelivery ? { ...this.quests.timedDelivery } : null,
      },
      foodPassport: [...this.foodPassport],
      ownedOutfits: [...this.ownedOutfits],
      equippedOutfit: this.equippedOutfit,
      wardrobe: { ...this.wardrobe },
      motorcycle: {
        owned: this.motorcycle.owned,
        x: this.motorcycle.x,
        y: 0,
        z: this.motorcycle.z,
        yaw: this.motorcycle.yaw,
        fuel: this.motorcycle.fuel,
        maxFuel: this.motorcycle.maxFuel,
        condition: this.motorcycle.condition,
        maxCondition: this.motorcycle.maxCondition,
      },
      car: { ...this.car },
      npcAffinity: { ...this.npcAffinity },
      placedFurniture: [...this.placedFurniture],
      ownedFurnitureIds: [...this.ownedFurnitureIds],
      discoveredLandmarks: [...this.discoveredLandmarks],
      unlockedAchievements: [...this.unlockedAchievements],
      dailyChallenge: {
        dayCount: this.dailyChallenge.dayCount,
        progressById: { ...this.dailyChallenge.progressById },
        claimedIds: [...this.dailyChallenge.claimedIds],
      },
      bankLedger: [...this.bankLedger],
      photosTakenCount: this.photosTakenCount,
      minigamesWon: { ...this.minigamesWon },
      tutorialCompleted: this.tutorialCompleted,
      settings: { ...this.settings },
      updatedAt: Date.now(),
    };
  }

  public loadState(save: SaveData): void {
    this.player = { ...save.player };
    this.timeOfDay = save.timeOfDay;
    this.dayCount = save.dayCount;
    this.stats = { ...save.stats };
    this.quests = {
      ...save.quests,
      completedIds: [...save.quests.completedIds],
      acceptedIds: [...save.quests.acceptedIds],
      flags: { ...save.quests.flags },
      timedDelivery: save.quests.timedDelivery ? { ...save.quests.timedDelivery } : null,
    };
    this.foodPassport = [...save.foodPassport];
    this.ownedOutfits = [...save.ownedOutfits];
    this.equippedOutfit = save.equippedOutfit;
    this.wardrobe = { ...save.wardrobe };
    this.motorcycle = { ...save.motorcycle, mounted: false, speed: 0 };
    this.car = { ...save.car };
    this.activeVehicleKind = null;
    this.activeVehicleSpeed = 0;
    this.npcAffinity = { ...save.npcAffinity };
    this.placedFurniture = [...save.placedFurniture];
    this.ownedFurnitureIds = [...save.ownedFurnitureIds];
    this.discoveredLandmarks = [...save.discoveredLandmarks];
    this.unlockedAchievements = [...save.unlockedAchievements];
    this.dailyChallenge = {
      dayCount: save.dailyChallenge.dayCount,
      progressById: { ...save.dailyChallenge.progressById },
      claimedIds: [...save.dailyChallenge.claimedIds],
    };
    this.bankLedger = [...save.bankLedger];
    this.photosTakenCount = save.photosTakenCount;
    this.minigamesWon = { ...save.minigamesWon };
    this.tutorialCompleted = save.tutorialCompleted;
    this.settings = { ...save.settings };

    this.syncCharacterAppearance();
    this.character.setMountedPose(false);
    this.character.group.position.set(this.player.x, this.player.y, this.player.z);
    this.character.group.rotation.y = this.player.yaw;

    this.ownedBikeMesh.visible = this.motorcycle.owned;
    this.ownedBikeMesh.position.set(this.motorcycle.x, 0, this.motorcycle.z);
    this.ownedBikeMesh.rotation.y = this.motorcycle.yaw;

    this.ownedCarMesh.visible = this.car.owned;
    this.ownedCarMesh.position.set(this.car.x, 0, this.car.z);
    this.ownedCarMesh.rotation.y = this.car.yaw;

    this.rebuildHomeDecorMeshes();
    this.applySettings(this.settings);
    this.cameraRig.resetToPlayer(this.player.x, this.player.y, this.player.z, this.player.yaw);
    this.dayNight.update(this.timeOfDay, this.player.x, this.player.z, this.rainIntensity, this.wetFactor);
    this.emitHudSnapshot(false);
  }

  public resetToHome(): void {
    if (this.activeVehicleKind) {
      this.dismountVehicle();
    }
    this.player = { ...DEFAULT_SPAWN_PLAYER };
    this.character.group.position.set(this.player.x, this.player.y, this.player.z);
    this.character.group.rotation.y = this.player.yaw;
    this.cameraRig.resetToPlayer(this.player.x, this.player.y, this.player.z, this.player.yaw);
    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  public saveProgress(): void {
    writeSaveData(this.exportSaveData());
  }

  // ==========================
  // Ledger, Daily Challenges & Achievements
  // ==========================
  private recordBank(labelZh: string, labelEn: string, labelMs: string, amountRM: number): void {
    const info = formatGameTime(this.timeOfDay, this.dayCount);
    this.bankLedger.unshift({
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      timeText: `D${info.dayCount} ${info.formattedTime}`,
      labelZh,
      labelEn,
      labelMs,
      amountRM,
    });
    if (this.bankLedger.length > 25) {
      this.bankLedger.length = 25;
    }
  }

  private incrementDailyMetric(metric: 'eat' | 'chat' | 'photo' | 'minigame' | 'bus'): void {
    if (this.dailyChallenge.dayCount !== this.dayCount) {
      this.dailyChallenge = {
        dayCount: this.dayCount,
        progressById: {},
        claimedIds: [],
      };
    }
    const todays = getDailyChallenges(this.dayCount);
    for (const ch of todays) {
      if (ch.metric === metric) {
        const cur = this.dailyChallenge.progressById[ch.id] ?? 0;
        this.dailyChallenge.progressById[ch.id] = Math.min(ch.target, cur + 1);
      }
    }
  }

  public claimDailyChallenge(challengeId: string): boolean {
    const todays = getDailyChallenges(this.dayCount);
    const def = todays.find((c) => c.id === challengeId);
    if (!def) return false;
    const progress = this.dailyChallenge.progressById[challengeId] ?? 0;
    if (progress < def.target || this.dailyChallenge.claimedIds.includes(challengeId)) {
      return false;
    }

    this.dailyChallenge.claimedIds.push(challengeId);
    const res = awardRewards(this.stats, def.rewardRM, def.rewardXP);
    this.stats = res.stats;
    this.recordBank(def.titleZh, def.titleEn, def.titleMs, def.rewardRM);
    this.soundEngine.playCashRegister();
    const lang = this.settings.language;
    this.callbacks.onToast(
      pickLang(
        lang,
        `每日挑战完成！+RM ${def.rewardRM} · +${def.rewardXP} XP`,
        `Daily Goal Claimed! +RM ${def.rewardRM} · +${def.rewardXP} XP`,
        `Cabaran Harian Selesai! +RM ${def.rewardRM}`
      )
    );
    this.syncAchievements();
    this.saveProgress();
    this.emitHudSnapshot(false);
    return true;
  }

  private syncAchievements(): void {
    const newly = evaluateAchievements({
      completedQuestCount: this.quests.completedIds.length,
      completedIds: this.quests.completedIds,
      foodPassportCount: this.foodPassport.length,
      motorcycleOwned: this.motorcycle.owned,
      carOwned: this.car.owned,
      trishawRidden: Boolean(this.quests.flags['trishaw_ridden']),
      ferryRidden: Boolean(this.quests.flags['ferry_ridden']),
      hillVisited: Boolean(this.quests.flags['hill_visited']),
      templeBlessed: Boolean(this.quests.flags['temple_blessed']),
      discoveredLandmarksCount: this.discoveredLandmarks.length,
      photosTakenCount: this.photosTakenCount,
      placedFurnitureCount: this.placedFurniture.length,
      decorScore: computeDecorScore(this.placedFurniture),
      ownedOutfitsCount: this.ownedOutfits.length,
      minigamesWon: this.minigamesWon,
      moneyRM: this.stats.moneyRM,
      unlockedIds: this.unlockedAchievements,
    });

    if (newly.length === 0) return;

    const lang = this.settings.language;
    for (const ach of newly) {
      this.unlockedAchievements.push(ach.id);
      const res = awardRewards(this.stats, ach.rewardRM, ach.rewardXP);
      this.stats = res.stats;
      this.recordBank(`成就: ${ach.titleZh}`, `Achievement: ${ach.titleEn}`, `Pencapaian: ${ach.titleMs}`, ach.rewardRM);
      this.soundEngine.playAchievement();
      const title = pickLang(lang, ach.titleZh, ach.titleEn, ach.titleMs);
      this.callbacks.onToast(
        pickLang(
          lang,
          `解锁成就「${title}」+RM ${ach.rewardRM} · +${ach.rewardXP} XP`,
          `Achievement Unlocked: "${title}" +RM ${ach.rewardRM}`,
          `Pencapaian Dibuka: "${title}" +RM ${ach.rewardRM}`
        )
      );
    }
  }

  // ==========================
  // Quests, Food, Outfits, Wardrobe, Decor
  // ==========================
  public setTrackedQuest(questId: string | null): void {
    this.quests.trackedQuestId = this.quests.trackedQuestId === questId ? null : questId;
    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  public addNpcAffinity(npcId: string, delta: number): void {
    this.npcAffinity[npcId] = Math.max(0, Math.min(100, (this.npcAffinity[npcId] ?? 0) + delta));
    this.incrementDailyMetric('chat');
    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  public acceptQuest(questIdOrFlag: string): void {
    const lang = this.settings.language;
    if (questIdOrFlag.startsWith('flag:')) {
      const flagName = questIdOrFlag.slice(5);
      this.quests.flags[flagName] = true;
      if (flagName === 'bought_ingredients') {
        this.callbacks.onToast(
          pickLang(
            lang,
            '已拿好鲜虾与韭菜，回去找 Ah Kow 叔叔吧！',
            'Ingredients packed! Return to Uncle Ah Kow.',
            'Bahan siap dibungkus! Pulang ke Uncle Ah Kow.'
          )
        );
      } else if (flagName === 'found_tiger') {
        this.callbacks.onToast(
          pickLang(
            lang,
            '摸到了橘猫 Tiger！可以回去向 Siew Lan 报告了。',
            'Petted Tiger! Report back to Siew Lan.',
            'Tiger dijumpai! Laporkan kepada Siew Lan.'
          )
        );
      }
      this.saveProgress();
      this.emitHudSnapshot(false);
      return;
    }

    if (!this.quests.acceptedIds.includes(questIdOrFlag)) {
      this.quests.acceptedIds.push(questIdOrFlag);
    }
    this.quests.activeQuestId = questIdOrFlag;
    this.quests.trackedQuestId = questIdOrFlag;

    if (questIdOrFlag === 'side-2-delivery') {
      const dest =
        DELIVERY_DESTINATIONS[Math.floor(Math.random() * DELIVERY_DESTINATIONS.length)];
      const targetName = pickLang(lang, dest.nameZh, dest.nameEn, dest.nameMs);
      this.quests.timedDelivery = {
        active: true,
        targetX: dest.x,
        targetZ: dest.z,
        targetName,
        remainingSec: 110,
      };
      this.callbacks.onToast(
        pickLang(
          lang,
          `接单成功！110秒内送到 ${dest.nameZh}`,
          `Delivery started! Reach ${dest.nameEn} in 110s`,
          `Penghantaran bermula! Tiba di ${dest.nameMs} dalam 110s`
        )
      );
    }

    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  public completeQuest(questId: string): void {
    if (this.quests.completedIds.includes(questId)) return;
    const def = QUEST_DEFINITIONS.find((q) => q.id === questId);
    if (!def) return;

    this.quests.completedIds.push(questId);
    const res = awardRewards(this.stats, def.rewardRM, def.rewardXP);
    this.stats = res.stats;
    this.recordBank(`任务: ${def.titleZh}`, `Quest: ${def.titleEn}`, `Misi: ${def.titleMs}`, def.rewardRM);
    this.soundEngine.playQuestComplete();

    const lang = this.settings.language;
    const title = pickLang(lang, def.titleZh, def.titleEn, def.titleMs);
    this.callbacks.onToast(
      pickLang(
        lang,
        `完成「${title}」+RM ${def.rewardRM} · +${def.rewardXP} XP${res.leveledUp ? ` · 升级 Lv.${this.stats.level}!` : ''}`,
        `Completed "${title}" +RM ${def.rewardRM} · +${def.rewardXP} XP${res.leveledUp ? ` · Level Up Lv.${this.stats.level}!` : ''}`,
        `Selesai "${title}" +RM ${def.rewardRM}${res.leveledUp ? ` · Tahap ${this.stats.level}!` : ''}`
      )
    );

    const mainChainOrder = [
      'main-1-ahkow',
      'main-2-ingredients',
      'main-3-kakros',
      'main-4-mei',
      'main-5-scooter',
      'main-6-passport',
    ];
    const idx = mainChainOrder.indexOf(questId);
    if (idx >= 0 && idx + 1 < mainChainOrder.length) {
      const nextId = mainChainOrder[idx + 1];
      if (!this.quests.acceptedIds.includes(nextId)) {
        this.quests.acceptedIds.push(nextId);
      }
      this.quests.activeQuestId = nextId;
      this.quests.trackedQuestId = nextId;
    } else if (this.quests.trackedQuestId === questId) {
      this.quests.trackedQuestId = null;
    }

    if (this.foodPassport.length >= 5 && !this.quests.completedIds.includes('main-6-passport')) {
      this.completeQuest('main-6-passport');
      return;
    }

    this.syncAchievements();
    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  public buyAndEatFood(foodId: string): { ok: boolean; reason?: string } {
    const item = FOOD_CATALOG.find((f) => f.id === foodId);
    if (!item) return { ok: false };
    const lang = this.settings.language;
    if (this.stats.moneyRM < item.priceRM) {
      return { ok: false, reason: pickLang(lang, '余额不足', 'Not enough RM', 'Baki tidak mencukupi') };
    }

    this.stats.moneyRM -= item.priceRM;
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + item.hpRestore);
    this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + item.staminaRestore);
    this.recordBank(item.nameZh, item.nameEn, item.nameMs, -item.priceRM);
    this.soundEngine.playCoin();
    this.incrementDailyMetric('eat');

    const isNew = !this.foodPassport.includes(item.id);
    if (isNew) {
      this.foodPassport.push(item.id);
    }

    const name = pickLang(lang, item.nameZh, item.nameEn, item.nameMs);
    this.callbacks.onToast(
      pickLang(
        lang,
        `品尝了 ${name}！生命+${item.hpRestore} 体力+${item.staminaRestore}${isNew ? ' · 已收录至美食护照' : ''}`,
        `Ate ${name}! HP+${item.hpRestore} Stamina+${item.staminaRestore}${isNew ? ' · Added to Passport' : ''}`,
        `Makan ${name}! Nyawa+${item.hpRestore} Stamina+${item.staminaRestore}`
      )
    );

    if (this.foodPassport.length >= 5 && !this.quests.completedIds.includes('main-6-passport')) {
      this.completeQuest('main-6-passport');
    } else {
      this.syncAchievements();
      this.saveProgress();
      this.emitHudSnapshot(false);
    }
    return { ok: true };
  }

  public buyOrEquipOutfit(outfitId: OutfitId): { ok: boolean; reason?: string } {
    const outfit = OUTFIT_CATALOG.find((o) => o.id === outfitId);
    if (!outfit) return { ok: false };
    const lang = this.settings.language;

    if (!this.ownedOutfits.includes(outfitId)) {
      if (this.stats.moneyRM < outfit.priceRM) {
        return { ok: false, reason: pickLang(lang, '余额不足', 'Not enough RM', 'Baki tidak mencukupi') };
      }
      this.stats.moneyRM -= outfit.priceRM;
      this.ownedOutfits.push(outfitId);
      this.recordBank(outfit.nameZh, outfit.nameEn, outfit.nameMs, -outfit.priceRM);
      this.soundEngine.playCashRegister();
    }

    this.equippedOutfit = outfitId;
    this.syncCharacterAppearance();
    const name = pickLang(lang, outfit.nameZh, outfit.nameEn, outfit.nameMs);
    this.callbacks.onToast(
      pickLang(lang, `已换上 ${name}`, `Equipped ${name}`, `Memakai ${name}`)
    );
    this.syncAchievements();
    this.saveProgress();
    this.emitHudSnapshot(false);
    return { ok: true };
  }

  public setWardrobe(nextWardrobe: WardrobeState): void {
    this.wardrobe = { ...nextWardrobe };
    this.syncCharacterAppearance();
    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  public buyFurniture(itemId: string): { ok: boolean; reason?: string } {
    const def = FURNITURE_CATALOG.find((f) => f.id === itemId);
    if (!def) return { ok: false };
    const lang = this.settings.language;
    if (this.stats.moneyRM < def.priceRM) {
      return { ok: false, reason: pickLang(lang, '余额不足', 'Not enough RM', 'Baki tidak mencukupi') };
    }
    this.stats.moneyRM -= def.priceRM;
    this.ownedFurnitureIds.push(itemId);
    this.recordBank(`家具: ${def.nameZh}`, `Furniture: ${def.nameEn}`, `Perabot: ${def.nameMs}`, -def.priceRM);
    this.soundEngine.playCashRegister();
    this.saveProgress();
    this.emitHudSnapshot(false);
    return { ok: true };
  }

  public placeFurniture(
    itemId: string,
    floor: 1 | 2,
    gridX: number,
    gridZ: number,
    rotationDeg: number = 0
  ): boolean {
    const ownedIdx = this.ownedFurnitureIds.indexOf(itemId);
    if (ownedIdx < 0) return false;
    if (!canPlaceFurniture(this.placedFurniture, floor, gridX, gridZ)) return false;

    this.ownedFurnitureIds.splice(ownedIdx, 1);
    this.placedFurniture.push({
      instanceId: `f-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      itemId,
      floor,
      gridX,
      gridZ,
      rotationDeg,
    });
    this.rebuildHomeDecorMeshes();
    this.soundEngine.playCoin();
    this.syncAchievements();
    this.saveProgress();
    this.emitHudSnapshot(false);
    return true;
  }

  public rotateOrReclaimFurniture(instanceId: string, action: 'rotate' | 'reclaim'): void {
    const idx = this.placedFurniture.findIndex((p) => p.instanceId === instanceId);
    if (idx < 0) return;
    if (action === 'rotate') {
      this.placedFurniture[idx] = {
        ...this.placedFurniture[idx],
        rotationDeg: (this.placedFurniture[idx].rotationDeg + 90) % 360,
      };
    } else {
      const removed = this.placedFurniture.splice(idx, 1)[0];
      this.ownedFurnitureIds.push(removed.itemId);
    }
    this.rebuildHomeDecorMeshes();
    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  // ==========================
  // Vehicles (Scooter, Sedan Car, Trishaw, Ferry, Bus)
  // ==========================
  public buyMotorcycle(): { ok: boolean; reason?: string } {
    const lang = this.settings.language;
    if (this.motorcycle.owned) return { ok: true };
    if (this.stats.moneyRM < MOTORCYCLE_PRICE_RM) {
      return { ok: false, reason: pickLang(lang, '余额不足', 'Not enough RM', 'Baki tidak mencukupi') };
    }
    this.stats.moneyRM -= MOTORCYCLE_PRICE_RM;
    this.motorcycle.owned = true;
    this.motorcycle.x = 2.6;
    this.motorcycle.z = 3.5;
    this.motorcycle.yaw = 1.5;
    this.motorcycle.fuel = 100;
    this.motorcycle.condition = 100;
    this.ownedBikeMesh.visible = true;
    this.ownedBikeMesh.position.set(this.motorcycle.x, 0, this.motorcycle.z);
    this.ownedBikeMesh.rotation.y = this.motorcycle.yaw;
    this.recordBank('购入槟城小摩托', 'Bought Kapchai Scooter', 'Beli Skuter Kapchai', -MOTORCYCLE_PRICE_RM);
    this.soundEngine.playCashRegister();

    this.callbacks.onToast(
      pickLang(
        lang,
        '购入槟城小摩托成功！已停放在你家门口，按 F 骑行。',
        'Scooter purchased! Parked outside your shophouse (press F to ride).',
        'Skuter dibeli! Diparkir di hadapan rumah anda (tekan F).'
      )
    );

    if (!this.quests.completedIds.includes('main-5-scooter')) {
      this.completeQuest('main-5-scooter');
    } else {
      this.syncAchievements();
      this.saveProgress();
      this.emitHudSnapshot(false);
    }
    return { ok: true };
  }

  public buyCar(): { ok: boolean; reason?: string } {
    const lang = this.settings.language;
    if (this.car.owned) return { ok: true };
    if (this.stats.moneyRM < CAR_PRICE_RM) {
      return { ok: false, reason: pickLang(lang, '余额不足 RM 680', 'Need RM 680', 'Perlu RM 680') };
    }
    this.stats.moneyRM -= CAR_PRICE_RM;
    this.car.owned = true;
    this.car.x = -4.2;
    this.car.z = 3.7;
    this.car.yaw = 1.57;
    this.car.fuel = 100;
    this.car.condition = 100;
    this.ownedCarMesh.visible = true;
    this.ownedCarMesh.position.set(this.car.x, 0, this.car.z);
    this.ownedCarMesh.rotation.y = this.car.yaw;
    this.recordBank('购入珍珠城市轿车', 'Bought Pearl City Sedan', 'Beli Kereta Sedan', -CAR_PRICE_RM);
    this.soundEngine.playCashRegister();
    this.callbacks.onToast(
      pickLang(
        lang,
        '购入城市轿车成功！已停在你家门口，走近按 F 驾驶。',
        'Sedan purchased! Parked outside your shophouse (press F to drive).',
        'Kereta dibeli! Diparkir di luar rumah anda (tekan F).'
      )
    );
    this.syncAchievements();
    this.saveProgress();
    this.emitHudSnapshot(false);
    return { ok: true };
  }

  public mountVehicle(kind: VehicleKind): void {
    if (this.activeVehicleKind) return;
    if (kind === 'motorcycle' && !this.motorcycle.owned) return;
    if (kind === 'car' && !this.car.owned) return;

    this.activeVehicleKind = kind;
    this.activeVehicleSpeed = 0;
    this.activeVehicleRpm = kind === 'trishaw' ? 60 : 850;
    this.activeVehicleGear = 'N';

    if (kind === 'motorcycle') {
      this.motorcycle.mounted = true;
      this.motorcycle.speed = 0;
      this.player.x = this.motorcycle.x;
      this.player.y = 0.28;
      this.player.z = this.motorcycle.z;
      this.player.yaw = this.motorcycle.yaw;
    } else if (kind === 'car') {
      this.player.x = this.car.x;
      this.player.y = 0.35;
      this.player.z = this.car.z;
      this.player.yaw = this.car.yaw;
    } else {
      // Trishaw
      this.quests.flags['trishaw_ridden'] = true;
      this.player.x = this.trishawPos.x;
      this.player.y = 0.32;
      this.player.z = this.trishawPos.z;
      this.player.yaw = this.trishawPos.yaw;
      this.soundEngine.playTrishawBell();
      this.syncAchievements();
    }

    this.character.setMountedPose(true);
    this.character.group.visible = kind !== 'car'; // Driver sits inside sedan
    this.emitHudSnapshot(false);
  }

  public dismountVehicle(): void {
    const kind = this.activeVehicleKind;
    if (!kind) return;

    const vx = kind === 'motorcycle' ? this.motorcycle.x : kind === 'car' ? this.car.x : this.trishawPos.x;
    const vz = kind === 'motorcycle' ? this.motorcycle.z : kind === 'car' ? this.car.z : this.trishawPos.z;
    const vyaw = kind === 'motorcycle' ? this.motorcycle.yaw : kind === 'car' ? this.car.yaw : this.trishawPos.yaw;

    this.activeVehicleKind = null;
    this.activeVehicleSpeed = 0;
    this.activeVehicleGear = 'N';
    this.motorcycle.mounted = false;
    this.motorcycle.speed = 0;

    const sideDist = kind === 'car' ? 1.45 : 0.95;
    const offX = -Math.cos(vyaw) * sideDist;
    const offZ = Math.sin(vyaw) * sideDist;
    const placed = resolvePlayerMovement(vx, 0, vz, offX, offZ, this.worldData);
    this.player.x = placed.x;
    this.player.y = 0;
    this.player.z = placed.z;
    this.character.setMountedPose(false);
    this.character.group.visible = true;
    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  public dismountMotorcycle(): void {
    this.dismountVehicle();
  }

  public toggleMountMotorcycle(): void {
    if (this.activeVehicleKind) {
      this.dismountVehicle();
    } else {
      this.mountVehicle('motorcycle');
    }
  }

  public refuelActiveOrOwned(): boolean {
    const lang = this.settings.language;
    const targetKind: VehicleKind | null =
      this.activeVehicleKind === 'car' || (this.car.owned && Math.hypot(this.car.x - GAS_STATION_POS.x, this.car.z - GAS_STATION_POS.z) < 8)
        ? 'car'
        : this.motorcycle.owned
        ? 'motorcycle'
        : null;
    if (!targetKind) return false;

    if (this.stats.moneyRM < 15) {
      this.callbacks.onToast(pickLang(lang, '余额不足 RM 15', 'Need RM 15 to refuel', 'Perlu RM 15'));
      return false;
    }
    this.stats.moneyRM -= 15;
    if (targetKind === 'car') this.car.fuel = 100;
    else this.motorcycle.fuel = 100;
    this.recordBank('油站加油', 'Petrol Refuel', 'Isi Minyak', -15);
    this.soundEngine.playCoin();
    this.callbacks.onToast(pickLang(lang, '油箱已加满！(RM 15)', 'Tank refueled! (RM 15)', 'Minyak penuh! (RM 15)'));
    this.saveProgress();
    this.emitHudSnapshot(false);
    return true;
  }

  public refuelMotorcycle(): boolean {
    return this.refuelActiveOrOwned();
  }

  public repairMotorcycle(): boolean {
    const lang = this.settings.language;
    const targetKind: VehicleKind | null =
      this.activeVehicleKind === 'car' || (this.car.owned && Math.hypot(this.car.x - GAS_STATION_POS.x, this.car.z - GAS_STATION_POS.z) < 8)
        ? 'car'
        : this.motorcycle.owned
        ? 'motorcycle'
        : null;
    if (!targetKind) return false;

    if (this.stats.moneyRM < 25) {
      this.callbacks.onToast(pickLang(lang, '余额不足 RM 25', 'Need RM 25 to repair', 'Perlu RM 25'));
      return false;
    }
    this.stats.moneyRM -= 25;
    if (targetKind === 'car') this.car.condition = 100;
    else this.motorcycle.condition = 100;
    this.recordBank('修车店检修', 'Vehicle Repair', 'Baiki Kenderaan', -25);
    this.soundEngine.playCoin();
    this.callbacks.onToast(pickLang(lang, '车辆已检修翻新！(RM 25)', 'Vehicle repaired! (RM 25)', 'Kenderaan dibaiki! (RM 25)'));
    this.saveProgress();
    this.emitHudSnapshot(false);
    return true;
  }

  public honkHorn(): void {
    if (this.activeVehicleKind === 'trishaw') {
      this.soundEngine.playTrishawBell();
    } else {
      this.soundEngine.playHorn(this.activeVehicleKind === 'car');
    }
  }

  public rideBusTo(stopId: string): boolean {
    const stop = BUS_STOPS.find((b) => b.id === stopId);
    if (!stop) return false;
    if (this.activeVehicleKind) this.dismountVehicle();
    this.player.x = stop.x;
    this.player.y = 0;
    this.player.z = stop.z + 1.5;
    this.cameraRig.resetToPlayer(this.player.x, 0, this.player.z, this.player.yaw);
    this.incrementDailyMetric('bus');
    this.soundEngine.playCoin();
    const lang = this.settings.language;
    const label = pickLang(lang, stop.nameZh, stop.nameEn, stop.nameMs);
    this.callbacks.onToast(
      pickLang(lang, `搭乘珍珠巴士抵达：${label}`, `Pearl Transit arrived at ${label}`, `Bas tiba di ${label}`)
    );
    this.saveProgress();
    this.emitHudSnapshot(false);
    return true;
  }

  private boardFerry(): void {
    if (this.activeVehicleKind) this.dismountVehicle();
    const toMainland = this.player.x < 85;
    const dest = toMainland ? FERRY_MAINLAND_POS : FERRY_ISLAND_POS;
    this.player.x = dest.x;
    this.player.y = 0;
    this.player.z = dest.z;
    this.quests.flags['ferry_ridden'] = true;
    this.incrementDailyMetric('bus');
    this.cameraRig.resetToPlayer(this.player.x, 0, this.player.z, this.player.yaw);
    this.soundEngine.playHorn(true);
    const lang = this.settings.language;
    this.callbacks.onToast(
      toMainland
        ? pickLang(lang, '乘渡轮抵达北海对岸码头！', 'Arrived at Butterworth Mainland Pier!', 'Tiba di Jeti Butterworth!')
        : pickLang(lang, '乘渡轮返回槟城乔治市码头！', 'Returned to Penang Island Pier!', 'Pulang ke Jeti Pulau Pinang!')
    );
    this.syncAchievements();
    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  private rideHillTram(): void {
    if (this.activeVehicleKind) this.dismountVehicle();
    const goingUp = this.player.y < 8;
    if (goingUp) {
      this.player.x = TRAM_TOP_POS.x;
      this.player.y = TRAM_TOP_POS.y;
      this.player.z = TRAM_TOP_POS.z;
      this.quests.flags['hill_visited'] = true;
    } else {
      this.player.x = TRAM_BOTTOM_POS.x;
      this.player.y = 0;
      this.player.z = TRAM_BOTTOM_POS.z + 2.0;
    }
    this.cameraRig.resetToPlayer(this.player.x, this.player.y, this.player.z, this.player.yaw);
    this.soundEngine.playQuestComplete();
    const lang = this.settings.language;
    this.callbacks.onToast(
      goingUp
        ? pickLang(lang, '乘缆车登上 升旗山山顶观景台！', 'Cable tram reached Penang Hill Summit!', 'Tiba di Puncak Bukit Bendera!')
        : pickLang(lang, '乘缆车安全返回山脚车站。', 'Returned to Lower Tram Station.', 'Kembali ke stesen bawah.')
    );
    this.syncAchievements();
    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  private prayAtTemple(): void {
    const lang = this.settings.language;
    this.stats.hp = this.stats.maxHp;
    this.stats.stamina = this.stats.maxStamina;
    if (!this.quests.flags['temple_blessed']) {
      this.quests.flags['temple_blessed'] = true;
      const res = awardRewards(this.stats, 25, 35);
      this.stats = res.stats;
      this.recordBank('极乐禅寺祈福平安礼', 'Kek Lok Temple Blessing', 'Berkat Kuil Kek Lok', 25);
    }
    this.soundEngine.playQuestComplete();
    this.callbacks.onToast(
      pickLang(
        lang,
        '在极乐禅寺祈福完毕，体力与生命已全满！',
        'Blessed at Kek Lok Temple! HP & Stamina fully restored.',
        'Berkat Kuil Kek Lok diterima! Nyawa & Stamina penuh.'
      )
    );
    this.syncAchievements();
    this.saveProgress();
    this.emitHudSnapshot(false);
  }

  // ==========================
  // Photo Mode & Minigame Results
  // ==========================
  public setPhotoMode(active: boolean, fov?: number): void {
    this.photoModeActive = active;
    if (fov !== undefined) {
      this.camera.fov = Math.max(26, Math.min(76, fov));
      this.camera.updateProjectionMatrix();
    } else if (!active) {
      this.camera.fov = 58;
      this.camera.updateProjectionMatrix();
    }
    this.input.setEnabled(this.mode === 'playing' && !this.uiModalOpen);
  }

  public adjustPhotoCamera(lookDx: number, lookDy: number, fov: number): void {
    this.cameraRig.applyLookDelta(lookDx, lookDy, this.settings.sensitivity);
    this.camera.fov = Math.max(26, Math.min(76, fov));
    this.camera.updateProjectionMatrix();
  }

  public capturePhoto(filter: PhotoFilterId): PhotoAlbumItem | null {
    this.renderScene();
    const srcCanvas = this.renderer.domElement;
    // Downscale cleanly to lightweight thumbnail for memory efficiency
    const out = document.createElement('canvas');
    out.width = 480;
    out.height = 270;
    const ctx = out.getContext('2d');
    if (!ctx) return null;

    if (filter === 'warm') ctx.filter = 'sepia(0.24) saturate(1.25) brightness(1.04)';
    else if (filter === 'vintage') ctx.filter = 'sepia(0.55) contrast(0.92)';
    else if (filter === 'neon') ctx.filter = 'saturate(1.6) contrast(1.14) hue-rotate(-8deg)';
    else if (filter === 'bw') ctx.filter = 'grayscale(1) contrast(1.15)';
    ctx.drawImage(srcCanvas, 0, 0, out.width, out.height);

    const dataUrl = out.toDataURL('image/png');
    this.soundEngine.playCameraShutter();

    // Check which landmarks/spots/NPCs are near or in camera frustum
    const tags: string[] = [];
    const frustum = new THREE.Frustum();
    const proj = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(proj);

    for (const lm of LANDMARK_ZONES) {
      const dist = Math.hypot(lm.x - this.player.x, lm.z - this.player.z);
      if (dist < lm.radius + 14 || frustum.containsPoint(new THREE.Vector3(lm.x, 2, lm.z))) {
        if (dist < 42) {
          tags.push(pickLang(this.settings.language, lm.nameZh, lm.nameEn, lm.nameMs));
        }
      }
    }
    for (const npc of this.npcManager.getNamedNpcPositions()) {
      const dist = Math.hypot(npc.x - this.player.x, npc.z - this.player.z);
      if (dist < 18 && frustum.containsPoint(new THREE.Vector3(npc.x, 1.2, npc.z))) {
        tags.push(npc.name);
      }
    }

    this.photosTakenCount += 1;
    this.quests.flags['took_photo'] = true;
    this.incrementDailyMetric('photo');
    this.syncAchievements();
    this.saveProgress();
    this.emitHudSnapshot(false);

    return {
      id: `pic-${Date.now()}`,
      dataUrl,
      filter,
      locationName: getLocationLabel(this.player.x, this.player.y, this.player.z, this.settings.language),
      tags: tags.slice(0, 4),
      takenAt: Date.now(),
    };
  }

  public recordMinigameResult(
    minigameId: string,
    won: boolean,
    rewardRM: number,
    rewardXP: number
  ): void {
    const lang = this.settings.language;
    if (won) {
      this.minigamesWon[minigameId] = (this.minigamesWon[minigameId] ?? 0) + 1;
      const res = awardRewards(this.stats, rewardRM, rewardXP);
      this.stats = res.stats;
      this.recordBank('街头小游戏获胜', 'Minigame Victory', 'Menang Permainan Mini', rewardRM);
      this.incrementDailyMetric('minigame');
      this.soundEngine.playQuestComplete();
      this.callbacks.onToast(
        pickLang(
          lang,
          `挑战成功！+RM ${rewardRM} · +${rewardXP} XP`,
          `Minigame Won! +RM ${rewardRM} · +${rewardXP} XP`,
          `Menang! +RM ${rewardRM} · +${rewardXP} XP`
        )
      );
      this.syncAchievements();
      this.saveProgress();
      this.emitHudSnapshot(false);
    }
  }

  public playWokSizzleSound(): void {
    this.soundEngine.playWokSizzle();
  }

  // ==========================
  // Proximity Prompts, Landmarks & Minimap
  // ==========================
  private handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    const maxPr = this.settings.quality === 'low' ? 1 : 2;
    const pr = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, maxPr);
    this.renderer.setPixelRatio(pr);
    if (this.composer) {
      this.composer.setSize(width, height);
      this.composer.setPixelRatio(pr);
    }
    this.renderScene();
  }

  private computeTrackedTarget(): { x: number; z: number; label: string; distance: number } | null {
    const lang = this.settings.language;
    if (this.quests.timedDelivery?.active) {
      const td = this.quests.timedDelivery;
      return {
        x: td.targetX,
        z: td.targetZ,
        label: td.targetName,
        distance: Math.round(Math.hypot(td.targetX - this.player.x, td.targetZ - this.player.z)),
      };
    }

    if (!this.quests.trackedQuestId) return null;
    const tasks = buildTaskDisplayList(this.quests, this.player.x, this.player.z, lang);
    const found = tasks.find((tk) => tk.id === this.quests.trackedQuestId && !tk.completed);
    if (!found || found.targetX === undefined || found.targetZ === undefined) return null;
    return {
      x: found.targetX,
      z: found.targetZ,
      label: found.title,
      distance: found.distanceMeters ?? 0,
    };
  }

  private computeNearbyPrompt(): NearbyPrompt | null {
    const lang = this.settings.language;
    const px = this.player.x;
    const py = this.player.y;
    const pz = this.player.z;

    if (this.activeVehicleKind) {
      if (
        this.activeVehicleKind !== 'trishaw' &&
        Math.hypot(px - GAS_STATION_POS.x, pz - GAS_STATION_POS.z) < 5.5
      ) {
        return {
          type: 'gas',
          id: 'petrol-station',
          label: pickLang(lang, '油站加油/检修', 'Petrol Station', 'Stesen Minyak'),
          actionText: t(lang, 'refuel'),
        };
      }
      return {
        type: this.activeVehicleKind,
        id: 'dismount',
        label:
          this.activeVehicleKind === 'car'
            ? pickLang(lang, '城市轿车', 'City Sedan', 'Kereta Sedan')
            : this.activeVehicleKind === 'trishaw'
            ? pickLang(lang, '古早三轮车', 'Heritage Trishaw', 'Beca Warisan')
            : pickLang(lang, '槟城小摩托', 'Scooter', 'Skuter'),
        actionText: t(lang, 'dismountBike'),
      };
    }

    // Indoors home decor / 2F wardrobe prompts
    if (px >= -4.5 && px <= 4.5 && pz >= -14.0 && pz <= 0.0) {
      if (py >= 2.5 && pz >= -5.2) {
        return {
          type: 'wardrobe',
          id: 'home-wardrobe',
          label: pickLang(lang, '二楼衣柜', '2F Wardrobe', 'Almari 2F'),
          actionText: t(lang, 'wardrobe'),
        };
      }
      if (py < 1.2 && pz >= -5.8) {
        return {
          type: 'decor',
          id: 'home-decor',
          label: pickLang(lang, '老店屋布置', 'Home Interior', 'Hiasan Rumah'),
          actionText: t(lang, 'decor'),
        };
      }
    }

    // Penang Hill Cable Tram (Top & Bottom)
    if (py >= 15 && Math.hypot(px - TRAM_TOP_POS.x, pz - TRAM_TOP_POS.z) < 4.5) {
      return {
        type: 'tram',
        id: 'tram-down',
        label: pickLang(lang, '升旗山缆车（下山）', 'Hill Tram (Down)', 'Trem Bukit (Turun)'),
        actionText: t(lang, 'interact'),
      };
    }
    if (py < 2 && Math.hypot(px - TRAM_BOTTOM_POS.x, pz - TRAM_BOTTOM_POS.z) < 4.5) {
      return {
        type: 'tram',
        id: 'tram-up',
        label: pickLang(lang, '升旗山缆车（登顶）', 'Hill Tram (Summit)', 'Trem Bukit (Puncak)'),
        actionText: t(lang, 'interact'),
      };
    }

    // Kek Lok Temple Blessing (y ~ 1.6)
    if (Math.hypot(px - TEMPLE_BLESSING_POS.x, pz - TEMPLE_BLESSING_POS.z) < 4.5 && Math.abs(py - 1.6) < 1.2) {
      return {
        type: 'temple',
        id: 'temple-pray',
        label: pickLang(lang, '极乐禅寺祈福台', 'Temple Prayer Shrine', 'Tempat Doa Kuil'),
        actionText: pickLang(lang, '祈福恢复', 'Pray & Bless', 'Berdoa'),
      };
    }

    if (py >= 1.2 && py < 15) return null;

    // Owned Sedan Car
    if (this.car.owned && Math.hypot(px - this.car.x, pz - this.car.z) < 3.0) {
      return {
        type: 'car',
        id: 'mount-car',
        label: pickLang(lang, '我的轿车', 'My Sedan', 'Kereta Saya'),
        actionText: t(lang, 'mountCar'),
      };
    }

    // Owned Scooter
    if (this.motorcycle.owned && Math.hypot(px - this.motorcycle.x, pz - this.motorcycle.z) < 2.4) {
      return {
        type: 'motorcycle',
        id: 'mount-bike',
        label: pickLang(lang, '我的摩托车', 'My Scooter', 'Skuter Saya'),
        actionText: t(lang, 'mountBike'),
      };
    }

    // Rideable Heritage Trishaw
    if (Math.hypot(px - this.trishawPos.x, pz - this.trishawPos.z) < 2.5) {
      return {
        type: 'trishaw',
        id: 'mount-trishaw',
        label: pickLang(lang, 'Pak Samad 三轮车', 'Heritage Trishaw', 'Beca Warisan'),
        actionText: t(lang, 'mountTrishaw'),
      };
    }

    // Ferry Boarding (Island & Mainland)
    if (
      Math.hypot(px - FERRY_ISLAND_POS.x, pz - FERRY_ISLAND_POS.z) < 4.2 ||
      Math.hypot(px - FERRY_MAINLAND_POS.x, pz - FERRY_MAINLAND_POS.z) < 4.5
    ) {
      return {
        type: 'ferry',
        id: 'pearl-ferry',
        label: pickLang(lang, '珍珠跨海渡轮', 'Pearl Ferry', 'Feri Mutiara'),
        actionText: pickLang(lang, '乘渡轮渡海', 'Board Ferry', 'Naik Feri'),
      };
    }

    // Batu Ferringhi Jet Ski Minigame
    if (Math.hypot(px - JETSKI_DOCK_POS.x, pz - JETSKI_DOCK_POS.z) < 4.2) {
      return {
        type: 'jetski',
        id: 'jetski-slalom',
        label: pickLang(lang, '峇都丁宜水上摩托', 'Ferringhi Jet Ski', 'Jet Ski Ferringhi'),
        actionText: pickLang(lang, '出海竞速', 'Start Race', 'Mula Lumba'),
      };
    }

    // Named NPCs
    const nearestNpc = this.npcManager.getNearestNpc(px, pz, 2.75);
    if (nearestNpc && py < 1.2) {
      return {
        type: 'npc',
        id: nearestNpc.def.id,
        label: pickLang(lang, nearestNpc.def.nameZh, nearestNpc.def.nameEn, nearestNpc.def.nameMs),
        actionText: t(lang, 'interact'),
      };
    }

    // Food Stalls
    for (const stall of FOOD_STALL_SPECS) {
      if (Math.hypot(px - stall.x, pz - stall.z) < 3.2) {
        return {
          type: 'stall',
          id: stall.id,
          label: pickLang(lang, stall.stallName, stall.subLabel, stall.subLabel),
          actionText: pickLang(lang, '点餐', 'Order Food', 'Pesan Makanan'),
        };
      }
    }

    // Shops
    if (Math.hypot(px - 57, pz - 22.2) < 3.4) {
      return {
        type: 'shop',
        id: 'outfit-shop',
        label: pickLang(lang, '娘惹服饰店', 'Heritage Boutique', 'Butik Warisan'),
        actionText: pickLang(lang, '试穿购买', 'Browse Outfits', 'Beli Baju'),
      };
    }

    if (Math.hypot(px - MOTORCYCLE_SHOP_POS.x, pz - MOTORCYCLE_SHOP_POS.z) < 3.8) {
      return {
        type: 'shop',
        id: 'scooter-shop',
        label: pickLang(lang, '明珠车行', 'Pearl Motors', 'Pearl Motors'),
        actionText: pickLang(lang, '看车购买', 'Buy Vehicles', 'Beli Kenderaan'),
      };
    }

    if (
      (this.motorcycle.owned || this.car.owned) &&
      Math.hypot(px - GAS_STATION_POS.x, pz - GAS_STATION_POS.z) < 4.8
    ) {
      return {
        type: 'gas',
        id: 'petrol-station',
        label: pickLang(lang, '加油站', 'Petrol Station', 'Stesen Minyak'),
        actionText: t(lang, 'refuel'),
      };
    }

    // Bus Stops
    for (const bs of BUS_STOPS) {
      if (Math.hypot(px - bs.x, pz - bs.z) < 2.8) {
        return {
          type: 'bus',
          id: bs.id,
          label: pickLang(lang, bs.nameZh, bs.nameEn, bs.nameMs),
          actionText: pickLang(lang, '巴士传送', 'Bus Transit', 'Bas Pantas'),
        };
      }
    }

    // Photo spots (Original + Expanded)
    const allSpots = [
      ...this.landmarks.photoSpots.map((p) => ({ ...p, y: 0, labelMs: p.labelEn })),
      ...this.expandedRegions.photoSpots,
    ];
    for (const spot of allSpots) {
      if (Math.hypot(px - spot.x, pz - spot.z) < 2.9 && Math.abs(py - (spot.y ?? 0)) < 1.5) {
        return {
          type: 'photo',
          id: spot.id,
          label: pickLang(lang, spot.labelZh, spot.labelEn, spot.labelMs),
          actionText: pickLang(lang, '拍照打卡', 'Take Photo', 'Ambil Foto'),
        };
      }
    }

    return null;
  }

  private buildMinimapMarkers(tracked: { x: number; z: number; label: string } | null): MinimapMarker[] {
    const lang = this.settings.language;
    const markers: MinimapMarker[] = [];

    if (tracked) {
      markers.push({ id: 'tracked-target', type: 'quest', x: tracked.x, z: tracked.z, label: tracked.label });
    }

    for (const s of FOOD_STALL_SPECS) {
      markers.push({
        id: s.id,
        type: 'food',
        x: s.x,
        z: s.z,
        label: pickLang(lang, s.stallName, s.subLabel, s.subLabel),
      });
    }

    markers.push({
      id: 'scooter-shop',
      type: 'shop',
      x: MOTORCYCLE_SHOP_POS.x,
      z: MOTORCYCLE_SHOP_POS.z,
      label: 'Pearl Motors',
    });
    markers.push({
      id: 'outfit-shop',
      type: 'shop',
      x: 57,
      z: 22.2,
      label: pickLang(lang, '服饰店', 'Boutique', 'Butik'),
    });
    markers.push({
      id: 'gas-station',
      type: 'gas',
      x: GAS_STATION_POS.x,
      z: GAS_STATION_POS.z,
      label: pickLang(lang, '加油站', 'Gas', 'Minyak'),
    });
    markers.push({
      id: 'ferry-island',
      type: 'ferry',
      x: FERRY_ISLAND_POS.x,
      z: FERRY_ISLAND_POS.z,
      label: 'Pearl Ferry',
    });

    for (const bs of BUS_STOPS) {
      markers.push({
        id: bs.id,
        type: 'bus',
        x: bs.x,
        z: bs.z,
        label: pickLang(lang, bs.nameZh, bs.nameEn, bs.nameMs),
      });
    }

    for (const lm of LANDMARK_ZONES) {
      markers.push({
        id: lm.id,
        type: 'landmark',
        x: lm.x,
        z: lm.z,
        label: pickLang(lang, lm.nameZh, lm.nameEn, lm.nameMs),
      });
    }

    for (const npc of this.npcManager.getNamedNpcPositions()) {
      markers.push({ id: `npc-${npc.id}`, type: 'npc', x: npc.x, z: npc.z, label: npc.name });
    }

    return markers;
  }

  public triggerNearbyPrompt(promptOverride?: NearbyPrompt | null): void {
    const prompt = promptOverride ?? this.currentNearbyPrompt;
    if (!prompt) return;
    const lang = this.settings.language;

    if (prompt.type === 'motorcycle' || prompt.type === 'car' || prompt.type === 'trishaw') {
      if (this.activeVehicleKind) this.dismountVehicle();
      else this.mountVehicle(prompt.type);
      return;
    }

    if (prompt.type === 'ferry') {
      this.boardFerry();
      return;
    }

    if (prompt.type === 'tram') {
      this.rideHillTram();
      return;
    }

    if (prompt.type === 'temple') {
      this.prayAtTemple();
      return;
    }

    if (prompt.type === 'photo') {
      this.quests.flags['took_photo'] = true;
      this.photosTakenCount += 1;
      this.incrementDailyMetric('photo');
      this.soundEngine.playCameraShutter();
      this.callbacks.onToast(
        pickLang(
          lang,
          `咔嚓！已在「${prompt.label}」拍照打卡！也可按 C 打开自由拍照模式。`,
          `Snap! Checked in at ${prompt.label}! Press C for Free Photo Mode.`,
          `Klik! Foto disimpan di ${prompt.label}!`
        )
      );
      this.syncAchievements();
      this.saveProgress();
      this.emitHudSnapshot(false);
      return;
    }

    if (prompt.type === 'gas') {
      this.refuelActiveOrOwned();
      return;
    }

    this.callbacks.onPromptInteract(prompt);
  }

  private getActiveVehicleHud(): ActiveVehicleHud {
    if (!this.activeVehicleKind) {
      return {
        mounted: false,
        kind: 'motorcycle',
        x: this.motorcycle.x,
        z: this.motorcycle.z,
        speed: 0,
        rpm: 850,
        gear: 'N',
        fuel: this.motorcycle.fuel,
        condition: this.motorcycle.condition,
      };
    }

    if (this.activeVehicleKind === 'car') {
      return {
        mounted: true,
        kind: 'car',
        x: this.car.x,
        z: this.car.z,
        speed: this.activeVehicleSpeed,
        rpm: this.activeVehicleRpm,
        gear: this.activeVehicleGear,
        fuel: this.car.fuel,
        condition: this.car.condition,
      };
    }

    if (this.activeVehicleKind === 'trishaw') {
      return {
        mounted: true,
        kind: 'trishaw',
        x: this.trishawPos.x,
        z: this.trishawPos.z,
        speed: this.activeVehicleSpeed,
        rpm: this.activeVehicleRpm,
        gear: this.activeVehicleGear,
        fuel: 100,
        condition: 100,
      };
    }

    return {
      mounted: true,
      kind: 'motorcycle',
      x: this.motorcycle.x,
      z: this.motorcycle.z,
      speed: this.motorcycle.speed,
      rpm: this.activeVehicleRpm,
      gear: this.activeVehicleGear,
      fuel: this.motorcycle.fuel,
      condition: this.motorcycle.condition,
    };
  }

  private emitHudSnapshot(isRunning: boolean): void {
    const lang = this.settings.language;
    const trackedTarget = this.computeTrackedTarget();
    this.currentNearbyPrompt = this.computeNearbyPrompt();
    const tasks = buildTaskDisplayList(this.quests, this.player.x, this.player.z, lang);
    const isIndoors =
      this.player.x >= -4.5 &&
      this.player.x <= 4.5 &&
      this.player.z >= -14.0 &&
      this.player.z <= 0.2;

    this.callbacks.onHudUpdate({
      timeInfo: formatGameTime(this.timeOfDay, this.dayCount),
      weather: {
        isRaining: this.isRaining,
        rainIntensity: this.rainIntensity,
        wetFactor: this.wetFactor,
      },
      locationName: getLocationLabel(this.player.x, this.player.y, this.player.z, lang),
      isIndoors,
      isRunning,
      floorLevel: this.player.y >= 2.2 ? 2 : 1,
      stats: { ...this.stats },
      playerPos: { ...this.player },
      motorcycle: { ...this.motorcycle },
      carOwned: this.car.owned,
      activeVehicle: this.getActiveVehicleHud(),
      trackedQuestId: this.quests.trackedQuestId,
      trackedTarget,
      tasks,
      nearbyPrompt: this.currentNearbyPrompt,
      minimapMarkers: this.buildMinimapMarkers(trackedTarget),
      foodPassportCount: this.foodPassport.length,
      discoveredLandmarksCount: this.discoveredLandmarks.length,
      unlockedAchievementsCount: this.unlockedAchievements.length,
      timedDeliveryRemaining: this.quests.timedDelivery?.active
        ? Math.max(0, Math.ceil(this.quests.timedDelivery.remainingSec))
        : null,
    });
  }

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(() => this.tick());
    } else {
      this.frameId = requestAnimationFrame(() => this.tick());
    }
  }

  private afterDraw(cb: () => void): void {
    if (this.disposed) return;
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private checkLandmarkDiscovery(): void {
    const lang = this.settings.language;
    for (const lm of LANDMARK_ZONES) {
      if (this.discoveredLandmarks.includes(lm.id)) continue;
      if (Math.hypot(this.player.x - lm.x, this.player.z - lm.z) <= lm.radius) {
        this.discoveredLandmarks.push(lm.id);
        const res = awardRewards(this.stats, 35, 40);
        this.stats = res.stats;
        const name = pickLang(lang, lm.nameZh, lm.nameEn, lm.nameMs);
        this.recordBank(`发现地标: ${lm.nameZh}`, `Landmark: ${lm.nameEn}`, `Mercu Tanda: ${lm.nameMs}`, 35);
        this.soundEngine.playQuestComplete();
        this.callbacks.onToast(
          pickLang(
            lang,
            `发现新地标「${name}」+RM 35 · +40 XP`,
            `Discovered "${name}" +RM 35 · +40 XP`,
            `Meneroka "${name}" +RM 35 · +40 XP`
          )
        );
        this.syncAchievements();
      }
    }
  }

  private tick(): void {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    const maxDt = this.isSoftwareGl ? 0.1 : 0.05;
    const dt = Math.min(Math.max(rawDt, 0.001), maxDt);
    this.elapsedSec += dt;

    // Auto FPS downgrade check on real GPU
    if (!this.isSoftwareGl && this.mode === 'playing' && this.settings.quality !== 'low') {
      this.fpsWindowTime += rawDt;
      this.fpsFrameCount += 1;
      if (this.fpsWindowTime >= 2.0) {
        const avgFps = this.fpsFrameCount / this.fpsWindowTime;
        this.fpsWindowTime = 0;
        this.fpsFrameCount = 0;
        if (avgFps < 30) {
          this.lowFpsStreaks += 1;
          if (this.lowFpsStreaks >= 2) {
            this.lowFpsStreaks = 0;
            const downgraded = this.settings.quality === 'high' ? 'medium' : 'low';
            this.applySettings({ ...this.settings, quality: downgraded });
            this.callbacks.onToast(
              pickLang(
                this.settings.language,
                `帧率较低，画质已自动调至「${downgraded}」以保持流畅`,
                `Low FPS detected: graphics auto-adjusted to ${downgraded}`,
                `FPS rendah: kualiti ditukar ke ${downgraded}`
              )
            );
          }
        } else {
          this.lowFpsStreaks = 0;
        }
      }
    }

    this.ceilingFan.rotation.y += dt * 1.8;

    const qualityParticleScale =
      this.settings.quality === 'low' ? 0.35 : this.settings.quality === 'medium' ? 0.65 : 1.0;
    this.foodStalls.updateSteam(dt, qualityParticleScale);
    const traffic = this.landmarks.updateLandmarks(this.elapsedSec);
    this.expandedRegions.updateExpanded(this.elapsedSec);

    let isRunning = false;

    if (this.mode === 'title') {
      this.titleOrbitTime += dt * 0.18;
      this.updateTitleCamera();
      this.dayNight.update(this.timeOfDay, 0, 4, 0, 0);
      this.rainSystem.update(0, 0, 0, dt, this.settings.quality);
      this.npcManager.update(this.timeOfDay * 24, 0, traffic, dt, false, 0, 0);
      this.trafficManager.update(dt, traffic, 0, 0, false);
    } else if (this.mode === 'playing') {
      if (this.ticketCooldownSec > 0) this.ticketCooldownSec -= dt;

      // 1. Time of Day & Weather
      const nextTime = advanceTimeOfDay(this.timeOfDay, this.dayCount, dt);
      this.timeOfDay = nextTime.timeOfDay;
      this.dayCount = nextTime.dayCount;

      const showers = scheduleDailyShowers(this.dayCount);
      const rainEval = evaluateRainAtTime(this.timeOfDay, this.dayCount, showers);
      this.isRaining = rainEval.isRaining;
      this.rainIntensity = rainEval.rainIntensity;
      this.wetFactor = updateWetFactor(this.wetFactor, this.isRaining, dt);

      const isIndoors =
        this.player.x >= -4.5 &&
        this.player.x <= 4.5 &&
        this.player.z >= -14.0 &&
        this.player.z <= 0.2;

      this.character.setRainUmbrella(!isIndoors && this.rainIntensity > 0.25);
      this.rainSystem.update(
        isIndoors ? 0 : this.rainIntensity,
        this.player.x,
        this.player.z,
        dt,
        this.settings.quality
      );
      this.soundEngine.updateRain(isIndoors ? this.rainIntensity * 0.25 : this.rainIntensity);

      // Neighbor home visit event once per day when inside 1F living room
      if (
        isIndoors &&
        this.player.y < 1.0 &&
        this.player.z > -5.5 &&
        this.dayCount > this.lastVisitedHomeDay
      ) {
        this.lastVisitedHomeDay = this.dayCount;
        const visitorId = this.dayCount % 2 === 0 ? 'ah-kow' : 'mei';
        this.npcManager.summonNpcNearHome(visitorId, 1.4, 2.2);
        this.addNpcAffinity(visitorId, 10);
        const decorScore = computeDecorScore(this.placedFurniture);
        this.callbacks.onToast(
          pickLang(
            this.settings.language,
            `邻居来店屋串门了！装潢评分 ${decorScore} · 好感度 +10`,
            `Neighbor visited your shophouse! Decor Score ${decorScore} · Affinity +10`,
            `Jiran melawat rumah anda! Skor Hiasan ${decorScore} · Mesra +10`
          )
        );
      }

      // 2. Timed Delivery countdown & completion check
      if (this.quests.timedDelivery?.active) {
        this.quests.timedDelivery.remainingSec -= dt;
        const td = this.quests.timedDelivery;
        const distToDrop = Math.hypot(this.player.x - td.targetX, this.player.z - td.targetZ);
        if (distToDrop < 3.8) {
          this.quests.timedDelivery = null;
          this.completeQuest('side-2-delivery');
        } else if (td.remainingSec <= 0) {
          this.quests.timedDelivery = null;
          this.callbacks.onToast(
            pickLang(
              this.settings.language,
              '外卖超时了，可以回去找 Raj 重新接单。',
              'Delivery timed out! Visit Raj to try again.',
              'Masa penghantaran tamat! Jumpa Raj semula.'
            )
          );
        }
      }

      // 3. Side 4 Esplanade Pier scout flag & landmark checks
      if (
        this.quests.acceptedIds.includes('side-4-trishaw') &&
        !this.quests.flags['scouted_pier'] &&
        this.player.z >= 75.5 &&
        this.player.x < 40
      ) {
        this.quests.flags['scouted_pier'] = true;
        this.callbacks.onToast(
          pickLang(
            this.settings.language,
            '已确认海边码头有等车游客！回去告诉 Pak Samad 吧。',
            'Found tourists at Esplanade Pier! Report to Pak Samad.',
            'Pelancong dijumpai di Jeti! Laporkan kepada Pak Samad.'
          )
        );
      }
      this.checkLandmarkDiscovery();

      // 4. Input & Player / Vehicle Movement
      const snap = this.input.consumeSnapshot();
      if (snap.lookDeltaX !== 0 || snap.lookDeltaY !== 0) {
        this.cameraRig.applyLookDelta(snap.lookDeltaX, snap.lookDeltaY, this.settings.sensitivity);
      }

      if (snap.hornPressed && this.activeVehicleKind) {
        this.honkHorn();
      }

      if (snap.interactPressed && !this.uiModalOpen && !this.photoModeActive) {
        const prompt = this.computeNearbyPrompt();
        if (prompt) {
          this.triggerNearbyPrompt(prompt);
        }
      }

      let actualSpeed = 0;

      if (this.photoModeActive) {
        // Freeze avatar movement while framing shots
        this.stats = updatePlayerStamina(this.stats, false, false, dt);
      } else if (this.activeVehicleKind && !this.uiModalOpen) {
        const throttle = snap.touchThrottle ? 1 : Math.max(0, snap.moveY);
        const brakeRev = snap.touchBrake ? 1 : Math.max(0, -snap.moveY);
        const steer = snap.moveX;
        const kind = this.activeVehicleKind;

        const curState =
          kind === 'motorcycle'
            ? { ...this.motorcycle, speed: this.activeVehicleSpeed }
            : kind === 'car'
            ? { ...this.car, speed: this.activeVehicleSpeed }
            : { x: this.trishawPos.x, y: 0, z: this.trishawPos.z, yaw: this.trishawPos.yaw, speed: this.activeVehicleSpeed, fuel: 100, condition: 100 };

        const stepped = stepVehicle(curState, kind, throttle, brakeRev, steer, dt, this.worldData);
        this.activeVehicleSpeed = stepped.state.speed;
        this.activeVehicleRpm = stepped.metrics.rpm;
        this.activeVehicleGear = stepped.metrics.gear;

        if (kind === 'motorcycle') {
          this.motorcycle.x = stepped.state.x;
          this.motorcycle.z = stepped.state.z;
          this.motorcycle.yaw = stepped.state.yaw;
          this.motorcycle.speed = stepped.state.speed;
          this.motorcycle.fuel = stepped.state.fuel;
          this.motorcycle.condition = stepped.state.condition;
          this.ownedBikeMesh.position.set(this.motorcycle.x, 0, this.motorcycle.z);
          this.ownedBikeMesh.rotation.y = this.motorcycle.yaw;
          this.player.y = 0.28;
        } else if (kind === 'car') {
          this.car.x = stepped.state.x;
          this.car.z = stepped.state.z;
          this.car.yaw = stepped.state.yaw;
          this.car.fuel = stepped.state.fuel;
          this.car.condition = stepped.state.condition;
          this.ownedCarMesh.position.set(this.car.x, 0, this.car.z);
          this.ownedCarMesh.rotation.y = this.car.yaw;
          this.player.y = 0.35;
        } else {
          this.trishawPos.x = stepped.state.x;
          this.trishawPos.z = stepped.state.z;
          this.trishawPos.yaw = stepped.state.yaw;
          this.trishawMesh.position.set(this.trishawPos.x, 0, this.trishawPos.z);
          this.trishawMesh.rotation.y = this.trishawPos.yaw;
          this.player.y = 0.32;
        }

        this.player.x = stepped.state.x;
        this.player.z = stepped.state.z;
        this.player.yaw = stepped.state.yaw;

        // Gentle traffic rule check (red light / speeding)
        if (this.ticketCooldownSec <= 0) {
          const violation = detectTrafficViolation(
            this.player.x,
            this.player.z,
            this.player.yaw,
            this.activeVehicleSpeed,
            kind,
            traffic
          );
          if (violation) {
            this.ticketCooldownSec = 12;
            const fine = Math.min(this.stats.moneyRM, 30);
            this.stats.moneyRM -= fine;
            if (fine > 0) {
              this.recordBank(
                violation === 'red_light' ? '路口闯红灯罚单' : '超速提醒罚单',
                violation === 'red_light' ? 'Red Light Ticket' : 'Speeding Ticket',
                'Saman Trafik',
                -fine
              );
            }
            this.soundEngine.playGentleAlert();
            this.callbacks.onToast(
              pickLang(
                this.settings.language,
                violation === 'red_light'
                  ? `乔治市交通提醒：闯红灯了！温柔罚款 RM ${fine}`
                  : `小心超速！乔治市限速提醒：温柔罚款 RM ${fine}`,
                violation === 'red_light'
                  ? `Traffic Notice: Red light crossed! Gentle fine RM ${fine}`
                  : `Slow down! Speeding notice: Gentle fine RM ${fine}`,
                `Notis Trafik: Saman ringan RM ${fine}`
              )
            );
          }
        }

        this.stats = updatePlayerStamina(this.stats, false, false, dt);
      } else if (!this.uiModalOpen) {
        const inputMag = Math.hypot(snap.moveX, snap.moveY);
        const isMoving = inputMag > 0.05;

        if (this.stats.stamina <= 1) this.sprintExhausted = true;
        if (this.stats.stamina >= 20) this.sprintExhausted = false;

        isRunning = snap.sprint && isMoving && !this.sprintExhausted;
        this.stats = updatePlayerStamina(this.stats, isRunning, isMoving, dt);

        if (isMoving) {
          const speed = (isRunning ? RUN_SPEED : WALK_SPEED) * Math.min(1, inputMag);
          const yaw = this.cameraRig.yaw;
          const fwdX = -Math.sin(yaw);
          const fwdZ = -Math.cos(yaw);
          const rightX = Math.cos(yaw);
          const rightZ = -Math.sin(yaw);

          const dirX = fwdX * snap.moveY + rightX * snap.moveX;
          const dirZ = fwdZ * snap.moveY + rightZ * snap.moveX;
          const dirLen = Math.hypot(dirX, dirZ) || 1;
          const normX = dirX / dirLen;
          const normZ = dirZ / dirLen;

          const prevX = this.player.x;
          const prevZ = this.player.z;
          const moved = resolvePlayerMovement(
            this.player.x,
            this.player.y,
            this.player.z,
            normX * speed * dt,
            normZ * speed * dt,
            this.worldData
          );
          this.player.x = moved.x;
          this.player.y = moved.y;
          this.player.z = moved.z;

          actualSpeed = Math.hypot(moved.x - prevX, moved.z - prevZ) / dt;
          const targetYaw = Math.atan2(-normX, -normZ);
          const yawDamp = 1 - Math.exp(-14 * dt);
          this.player.yaw += shortestAngleDiff(this.player.yaw, targetYaw) * yawDamp;
        }
      }

      this.character.group.position.set(this.player.x, this.player.y, this.player.z);
      this.character.group.rotation.y = this.player.yaw;
      this.character.updateAnimation(actualSpeed, dt, isRunning);

      // 5. NPCs & Traffic Vehicles
      const isRiding = this.activeVehicleKind !== null;
      const npcUpdate = this.npcManager.update(
        this.timeOfDay * 24,
        isIndoors ? 0 : this.rainIntensity,
        traffic,
        dt,
        isRiding,
        this.player.x,
        this.player.z
      );
      if (npcUpdate.bumpedPedestrian && isRiding) {
        this.activeVehicleSpeed *= 0.4;
        if (this.activeVehicleKind === 'motorcycle') {
          this.motorcycle.condition = Math.max(0, this.motorcycle.condition - 2);
        } else if (this.activeVehicleKind === 'car') {
          this.car.condition = Math.max(0, this.car.condition - 2);
        }
      }

      const trafficUpdate = this.trafficManager.update(
        dt,
        traffic,
        this.player.x,
        this.player.z,
        isRiding
      );
      if (trafficUpdate.bumpedTraffic && isRiding) {
        this.activeVehicleSpeed *= 0.35;
        if (this.activeVehicleKind === 'car') {
          this.car.condition = Math.max(0, this.car.condition - 3);
        } else if (this.activeVehicleKind === 'motorcycle') {
          this.motorcycle.condition = Math.max(0, this.motorcycle.condition - 3);
        }
      }

      // 6. Floating 3D Navigation Arrow toward Tracked Target
      const tracked = this.computeTrackedTarget();
      if (tracked && tracked.distance > 2.5 && !this.photoModeActive) {
        this.navArrowGroup.visible = true;
        this.navArrowGroup.position.set(
          this.player.x,
          this.player.y + 2.05 + Math.sin(this.elapsedSec * 4) * 0.05,
          this.player.z
        );
        const angleToTarget = Math.atan2(-(tracked.x - this.player.x), -(tracked.z - this.player.z));
        this.navArrowGroup.rotation.y = angleToTarget;
      } else {
        this.navArrowGroup.visible = false;
      }

      // 7. Chunk Visibility Culling by Quality Setting
      const cullDist =
        this.settings.quality === 'low' ? 88 : this.settings.quality === 'medium' ? 145 : 260;
      for (const chunk of this.worldChunks) {
        const d = Math.hypot(chunk.centerX - this.player.x, chunk.centerZ - this.player.z);
        chunk.group.visible = d <= cullDist;
      }

      // 8. Camera & Atmosphere
      this.cameraRig.update(
        this.camera,
        this.player.x,
        this.player.y,
        this.player.z,
        this.cameraObstacleMeshes,
        dt,
        isIndoors,
        this.activeVehicleKind !== null
      );

      this.dayNight.update(
        this.timeOfDay,
        this.player.x,
        this.player.z,
        this.rainIntensity,
        this.wetFactor
      );

      // 9. Throttled HUD & Save
      this.hudTimer += dt;
      if (this.hudTimer >= 0.16) {
        this.hudTimer = 0;
        this.emitHudSnapshot(isRunning);
      }

      this.saveTimer += dt;
      if (this.saveTimer >= 3.0) {
        this.saveTimer = 0;
        this.saveProgress();
      }
    }

    this.renderScene();
    this.scheduleNextFrame();
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    this.detachInput();
    this.saveProgress();
    this.soundEngine.dispose();
    this.foodStalls.dispose();
    this.landmarks.dispose();
    this.npcManager.dispose();
    this.textures.dispose();
    this.composer?.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

export function getNpcDefinition(npcId: string) {
  return NAMED_NPCS.find((n) => n.id === npcId) ?? null;
}
