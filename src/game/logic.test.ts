import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY_CYCLE_DURATION_SECONDS,
  advanceTimeOfDay,
  computeAtmosphereState,
  computeStreetLampFactor,
  formatGameTime,
} from './dayNight/dayNightMath';
import {
  getLocationLabel,
  resolveFloorHeight,
  resolvePlayerMovement,
} from './player/collision';
import {
  SAVE_STORAGE_KEY,
  createDefaultSaveData,
  loadSaveData,
  sanitizeSaveData,
  writeSaveData,
} from './storage/saveSystem';
import {
  canPlaceFurniture,
  computeDecorScore,
  gridToWorld,
} from './systems/homeDecoration';
import {
  ACHIEVEMENT_CATALOG,
  FOOD_CATALOG,
  awardRewards,
  buildTaskDisplayList,
  evaluateAchievements,
  getDailyChallenges,
  updatePlayerStamina,
} from './systems/progression';
import {
  computeVehicleMetrics,
  detectTrafficViolation,
  getSpeedKmh,
  stepMotorcycle,
  stepVehicle,
} from './vehicle/motorcyclePhysics';
import { evaluateRainAtTime, scheduleDailyShowers, updateWetFactor } from './weather/weatherMath';
import type { MotorcycleState, PlacedFurnitureItem, WorldCollisionData } from './types';

test('dayNightMath advances 240s full day cycle and wraps dayCount', () => {
  assert.equal(DAY_CYCLE_DURATION_SECONDS, 240);
  const start = advanceTimeOfDay(0.5, 1, 120);
  assert.equal(start.dayCount, 2);
  assert.ok(Math.abs(start.timeOfDay - 0.0) < 1e-6);

  const morning = formatGameTime(0.375, 1);
  assert.equal(morning.formattedTime, '09:00');
  assert.equal(morning.isNight, false);
  assert.equal(morning.streetLampFactor, 0);

  const night = formatGameTime(0.9, 1);
  assert.equal(night.isNight, true);
  assert.equal(night.streetLampFactor, 1);
});

test('computeStreetLampFactor ramps smoothly at dusk and dawn', () => {
  assert.equal(computeStreetLampFactor(12 / 24), 0);
  assert.ok(Math.abs(computeStreetLampFactor(18.25 / 24) - 0.5) < 1e-6);
  assert.equal(computeStreetLampFactor(22 / 24), 1);
  assert.ok(Math.abs(computeStreetLampFactor(6.25 / 24) - 0.5) < 1e-6);

  const atmoDay = computeAtmosphereState(12 / 24);
  const atmoNight = computeAtmosphereState(23 / 24);
  assert.ok(atmoDay.sunIntensity > atmoNight.sunIntensity);
});

test('collision solver blocks walls, climbs stairs, resolves Penang Hill y=18 and MS labels', () => {
  const world: WorldCollisionData = {
    bounds: { minX: -192, maxX: 192, minZ: -172, maxZ: 172 },
    colliders: [
      { minX: -4.5, maxX: -4.2, minY: 0, maxY: 7, minZ: -14, maxZ: 0, label: 'west-wall' },
      { minX: 2.1, maxX: 2.25, minY: 0, maxY: 4.5, minZ: -11.5, maxZ: -5.8, label: 'stair-wall' },
      { minX: -1.8, maxX: 1.8, minY: 3.2, maxY: 4.6, minZ: -5.6, maxZ: -5.4, label: 'airwell-rail' },
    ],
    stairs: [
      {
        minX: 2.25,
        maxX: 4.05,
        minZ: -11.6,
        maxZ: -5.4,
        startZ: -5.5,
        endZ: -11.5,
        startY: 0,
        endY: 3.4,
      },
    ],
    upperFloorBoxes: [
      { minX: -4.2, maxX: 4.2, minZ: -5.5, maxZ: 0, y: 3.4 },
      { minX: -4.2, maxX: 4.2, minZ: -13.6, maxZ: -11.5, y: 3.4 },
      { minX: -176, maxX: -120, minZ: -146, maxZ: -94, y: 18 },
    ],
  };

  const hitWall = resolvePlayerMovement(-3.8, 0, -2.0, -1.0, 1.0, world);
  assert.equal(hitWall.collided, true);
  assert.ok(hitWall.x > -4.2 + 0.35);
  assert.ok(Math.abs(hitWall.z - -1.0) < 1e-6);

  const midStair = resolvePlayerMovement(3.1, 0.5, -8.5, 0, 0, world);
  assert.ok(Math.abs(midStair.y - 1.7) < 0.05);

  const topStair = resolvePlayerMovement(3.1, 2.8, -11.5, 0, 0, world);
  assert.ok(Math.abs(topStair.y - 3.4) < 0.05);

  assert.equal(resolveFloorHeight(0, -3.0, 3.4, world), 3.4);
  assert.equal(resolveFloorHeight(-146, -116, 18, world), 18);
  assert.equal(resolvePlayerMovement(0, 3.4, -5.0, 0, -1.0, world).collided, true);
  assert.equal(resolvePlayerMovement(0, 0, -5.0, 0, -1.0, world).collided, false);

  assert.equal(getLocationLabel(0, 0, -2.5), '一楼客厅');
  assert.equal(getLocationLabel(0, 3.4, -2.5), '二楼卧室');
  assert.equal(getLocationLabel(-146, 18, -116, 'ms'), 'Puncak Bukit Bendera');
  assert.equal(getLocationLabel(145, 0, 82, 'en'), 'Butterworth Mainland Pier');
});

test('weatherMath schedules 0-2 showers and computes wetFactor', () => {
  for (let d = 1; d <= 10; d++) {
    const showers = scheduleDailyShowers(d);
    assert.ok(showers.length >= 0 && showers.length <= 2);
  }
  const active = evaluateRainAtTime(10.5 / 24, 1, [{ startHour: 10, endHour: 12 }]);
  assert.equal(active.isRaining, true);
  assert.ok(active.rainIntensity > 0.9);
  assert.ok(updateWetFactor(0, true, 1.0) > 0);
});

test('progression catalogs (12 foods, 22 achievements, daily challenges) and level-up work', () => {
  const def = createDefaultSaveData();
  assert.equal(def.stats.moneyRM, 500);
  assert.equal(FOOD_CATALOG.length, 12);
  assert.equal(ACHIEVEMENT_CATALOG.length, 22);

  const tired = updatePlayerStamina(def.stats, true, true, 2.0);
  assert.ok(tired.stamina < def.stats.stamina);
  const rested = updatePlayerStamina(tired, false, false, 2.0);
  assert.ok(rested.stamina > tired.stamina);

  const leveled = awardRewards(def.stats, 80, 120);
  assert.equal(leveled.leveledUp, true);
  assert.equal(leveled.stats.level, 2);
  assert.equal(leveled.stats.moneyRM, 580);
  assert.equal(leveled.stats.maxStamina, 115);

  const tasks = buildTaskDisplayList(def.quests, 0, 0, 'ms');
  assert.equal(tasks.length, 10);

  const daily = getDailyChallenges(3);
  assert.equal(daily.length, 3);

  const newly = evaluateAchievements({
    completedQuestCount: 1,
    completedIds: ['main-1-ahkow'],
    foodPassportCount: 1,
    motorcycleOwned: true,
    carOwned: true,
    trishawRidden: true,
    ferryRidden: false,
    hillVisited: false,
    templeBlessed: false,
    discoveredLandmarksCount: 5,
    photosTakenCount: 1,
    placedFurnitureCount: 3,
    decorScore: 105,
    ownedOutfitsCount: 2,
    minigamesWon: { 'ckt-rhythm': 1 },
    moneyRM: 1050,
    unlockedIds: [],
  });
  assert.ok(newly.some((a) => a.id === 'ach-first-quest'));
  assert.ok(newly.some((a) => a.id === 'ach-car'));
  assert.ok(newly.some((a) => a.id === 'ach-rich'));
  assert.ok(newly.some((a) => a.id === 'ach-decor-score'));
});

test('vehiclePhysics handles motorcycle, car 5-speed metrics, trishaw pedal mode, and traffic tickets', () => {
  const world: WorldCollisionData = {
    bounds: { minX: -192, maxX: 192, minZ: -172, maxZ: 172 },
    colliders: [{ minX: -2, maxX: 2, minY: 0, maxY: 4, minZ: -2, maxZ: 0 }],
    stairs: [],
    upperFloorBoxes: [],
  };
  let bike: MotorcycleState = {
    owned: true,
    mounted: true,
    x: 0,
    y: 0,
    z: 10,
    yaw: 0,
    speed: 0,
    fuel: 100,
    maxFuel: 100,
    condition: 100,
    maxCondition: 100,
  };
  for (let i = 0; i < 10; i++) {
    bike = stepMotorcycle(bike, 1, 0, 0, 0.1, world).bike;
  }
  assert.ok(bike.speed > 5);
  assert.ok(getSpeedKmh(bike.speed) >= 18);
  assert.ok(bike.fuel < 100);

  let car = { x: 20, y: 0, z: 60, yaw: 0, speed: 0, fuel: 100, condition: 100 };
  for (let i = 0; i < 25; i++) {
    car = stepVehicle(car, 'car', 1, 0, 0, 0.1, world).state;
  }
  assert.ok(car.speed > 18);
  const carMetrics = computeVehicleMetrics('car', car.speed);
  assert.ok(['3', '4', '5'].includes(carMetrics.gear));
  assert.equal(detectTrafficViolation(car.x, car.z, 0, 22, 'car', { ewGreen: true, nsGreen: true }), 'speeding');
  assert.equal(detectTrafficViolation(28, 8.4, 0, 8, 'car', { ewGreen: true, nsGreen: false }), 'red_light');

  const trishawRes = stepVehicle({ x: 20, y: 0, z: 20, yaw: 0, speed: 0, fuel: 100, condition: 100 }, 'trishaw', 1, 0, 0, 0.5, world);
  assert.equal(trishawRes.state.fuel, 100);
  assert.equal(trishawRes.metrics.gear, 'PEDAL');
  assert.equal(detectTrafficViolation(28, 8.4, 0, 8, 'trishaw', { ewGreen: false, nsGreen: false }), null);
});

test('homeDecoration enforces stair clearance, prevents overlap, and computes decor score', () => {
  const placed: PlacedFurnitureItem[] = [
    { instanceId: '1', itemId: 'furn-sofa', floor: 1, gridX: 0, gridZ: 1, rotationDeg: 0 },
    { instanceId: '2', itemId: 'furn-neon', floor: 2, gridX: -1, gridZ: 0, rotationDeg: 90 },
  ];
  assert.equal(canPlaceFurniture(placed, 1, 0, 1), false); // occupied
  assert.equal(canPlaceFurniture(placed, 1, 2, 2), false); // stair clearance
  assert.equal(canPlaceFurniture(placed, 1, -2, 0), true);
  assert.equal(computeDecorScore(placed), 24 + 28);
  const pos2f = gridToWorld(2, 0, 0);
  assert.ok(Math.abs(pos2f.y - 3.4) < 1e-6);
});

test('saveSystem persists v3 state and migrates legacy v2 payloads cleanly', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  const def = createDefaultSaveData();
  def.stats.moneyRM = 777;
  def.foodPassport = ['char-kway-teow'];
  def.car.owned = true;
  def.settings.language = 'ms';
  assert.equal(writeSaveData(def, mockStorage), true);
  assert.ok(store.has(SAVE_STORAGE_KEY));

  const loaded = loadSaveData(mockStorage);
  assert.ok(loaded);
  assert.equal(loaded.stats.moneyRM, 777);
  assert.deepEqual(loaded.foodPassport, ['char-kway-teow']);
  assert.equal(loaded.car.owned, true);
  assert.equal(loaded.settings.language, 'ms');

  // Legacy v2 payload migration
  const migrated = sanitizeSaveData({
    version: 2,
    player: { x: 1, y: 0, z: 2, yaw: 0 },
    timeOfDay: 0.4,
    dayCount: 1,
    stats: { level: 2, xp: 10, xpToNext: 135, hp: 90, maxHp: 110, stamina: 100, maxStamina: 115, moneyRM: 620 },
  });
  assert.ok(migrated);
  assert.equal(migrated.version, 3);
  assert.equal(migrated.stats.moneyRM, 620);
  assert.equal(migrated.car.owned, false);

  store.set(SAVE_STORAGE_KEY, '{bad json');
  assert.equal(loadSaveData(mockStorage), null);
  assert.equal(sanitizeSaveData({ player: { x: 'NaN' } }), null);
});
