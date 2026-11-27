import { resolvePlayerMovement } from '../player/collision';
import type { MotorcycleState, VehicleKind, WorldCollisionData } from '../types';
import type { TrafficLightPhase } from '../world/landmarks';

export const MOTORCYCLE_MAX_SPEED = 16.5; // ~59 km/h
export const MOTORCYCLE_REVERSE_SPEED = -4.2;
export const MOTORCYCLE_ACCEL = 11.0;
export const MOTORCYCLE_BRAKE_DECEL = 18.0;
export const MOTORCYCLE_DRAG = 3.2;

export const CAR_MAX_SPEED = 24.0; // ~86 km/h
export const CAR_REVERSE_SPEED = -6.5;
export const CAR_ACCEL = 14.2;

export const TRISHAW_MAX_SPEED = 6.8; // ~24 km/h
export const TRISHAW_REVERSE_SPEED = -2.2;
export const TRISHAW_ACCEL = 6.5;

export interface VehicleDynamicState {
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  fuel: number;
  condition: number;
}

export interface VehicleMetrics {
  rpm: number;
  gear: string;
}

export function computeVehicleMetrics(kind: VehicleKind, speed: number): VehicleMetrics {
  if (kind === 'trishaw') {
    const pedalRpm = Math.round(60 + Math.abs(speed) * 45);
    return {
      rpm: pedalRpm,
      gear: speed < -0.15 ? 'R' : Math.abs(speed) < 0.15 ? 'N' : 'PEDAL',
    };
  }

  const maxSpd = kind === 'car' ? CAR_MAX_SPEED : MOTORCYCLE_MAX_SPEED;
  if (Math.abs(speed) < 0.15) {
    return { rpm: 850, gear: 'N' };
  }
  if (speed < -0.15) {
    return { rpm: Math.min(4800, 1200 + Math.round(Math.abs(speed) * 520)), gear: 'R' };
  }

  const ratio = Math.min(1, speed / maxSpd);
  if (ratio < 0.2) {
    return { rpm: Math.round(1400 + (ratio / 0.2) * 4600), gear: '1' };
  }
  if (ratio < 0.42) {
    return { rpm: Math.round(2100 + ((ratio - 0.2) / 0.22) * 4100), gear: '2' };
  }
  if (ratio < 0.65) {
    return { rpm: Math.round(2400 + ((ratio - 0.42) / 0.23) * 3900), gear: '3' };
  }
  if (ratio < 0.84) {
    return { rpm: Math.round(2600 + ((ratio - 0.65) / 0.19) * 3800), gear: '4' };
  }
  return { rpm: Math.round(3100 + ((ratio - 0.84) / 0.16) * 3500), gear: '5' };
}

export function stepVehicle(
  state: VehicleDynamicState,
  kind: VehicleKind,
  throttleInput: number,
  brakeReverseInput: number,
  steerInput: number,
  dt: number,
  world: WorldCollisionData
): { state: VehicleDynamicState; hitObstacle: boolean; metrics: VehicleMetrics } {
  let speed = state.speed;
  let fuel = state.fuel;
  let condition = state.condition;
  let yaw = state.yaw;

  const isTrishaw = kind === 'trishaw';
  const maxSpd =
    kind === 'car' ? CAR_MAX_SPEED : isTrishaw ? TRISHAW_MAX_SPEED : MOTORCYCLE_MAX_SPEED;
  const minSpd =
    kind === 'car' ? CAR_REVERSE_SPEED : isTrishaw ? TRISHAW_REVERSE_SPEED : MOTORCYCLE_REVERSE_SPEED;
  const accel = kind === 'car' ? CAR_ACCEL : isTrishaw ? TRISHAW_ACCEL : MOTORCYCLE_ACCEL;
  const fuelRate = kind === 'car' ? 0.85 : isTrishaw ? 0 : 0.65;
  const steerTurnRate = kind === 'car' ? 1.85 : isTrishaw ? 1.95 : 2.35;
  const radius = kind === 'car' ? 1.05 : isTrishaw ? 0.72 : 0.58;

  const hasFuel = isTrishaw || fuel > 0.05;
  const condFactor = condition > 15 ? 1 : 0.55;

  if (throttleInput > 0.05 && hasFuel) {
    speed += throttleInput * accel * condFactor * dt;
    fuel = Math.max(0, fuel - throttleInput * fuelRate * dt);
  } else if (brakeReverseInput > 0.05) {
    if (speed > 0.3) {
      speed -= brakeReverseInput * MOTORCYCLE_BRAKE_DECEL * dt;
    } else if (hasFuel) {
      speed -= brakeReverseInput * (accel * 0.55) * dt;
      fuel = Math.max(0, fuel - brakeReverseInput * (fuelRate * 0.5) * dt);
    }
  } else {
    const dragAmt = MOTORCYCLE_DRAG * dt;
    if (Math.abs(speed) <= dragAmt) {
      speed = 0;
    } else {
      speed -= Math.sign(speed) * dragAmt;
    }
  }

  speed = Math.max(minSpd, Math.min(maxSpd, speed));

  if (Math.abs(speed) > 0.25 && Math.abs(steerInput) > 0.04) {
    const speedRatio = Math.min(1, Math.abs(speed) / (kind === 'car' ? 6.5 : 5.0));
    const dirSign = speed >= 0 ? 1 : -1;
    yaw -= steerInput * steerTurnRate * speedRatio * dirSign * dt;
  }

  const fwdX = -Math.sin(yaw);
  const fwdZ = -Math.cos(yaw);
  const dx = fwdX * speed * dt;
  const dz = fwdZ * speed * dt;

  const vehicleWorld: WorldCollisionData = {
    ...world,
    colliders: [
      ...world.colliders,
      { minX: -1.6, maxX: 1.6, minY: 0, maxY: 3, minZ: -0.6, maxZ: 0.3, label: 'doorway-vehicle-stop' },
    ],
  };

  const moved = resolvePlayerMovement(state.x, 0, state.z, dx, dz, vehicleWorld, radius);
  let hitObstacle = false;
  if (moved.collided && Math.abs(speed) > 1.5) {
    hitObstacle = true;
    speed *= 0.35;
    if (!isTrishaw) {
      condition = Math.max(0, condition - (kind === 'car' ? 3.2 : 2.5));
    }
  }

  const nextState: VehicleDynamicState = {
    x: moved.x,
    y: 0,
    z: moved.z,
    yaw,
    speed,
    fuel,
    condition,
  };

  return {
    state: nextState,
    hitObstacle,
    metrics: computeVehicleMetrics(kind, speed),
  };
}

export function stepMotorcycle(
  bike: MotorcycleState,
  throttleInput: number,
  brakeReverseInput: number,
  steerInput: number,
  dt: number,
  world: WorldCollisionData
): { bike: MotorcycleState; hitObstacle: boolean } {
  const res = stepVehicle(
    {
      x: bike.x,
      y: bike.y,
      z: bike.z,
      yaw: bike.yaw,
      speed: bike.speed,
      fuel: bike.fuel,
      condition: bike.condition,
    },
    'motorcycle',
    throttleInput,
    brakeReverseInput,
    steerInput,
    dt,
    world
  );
  return {
    bike: {
      ...bike,
      ...res.state,
    },
    hitObstacle: res.hitObstacle,
  };
}

export function getSpeedKmh(speedMetersPerSec: number): number {
  return Math.round(Math.abs(speedMetersPerSec) * 3.6);
}

const INTERSECTIONS: Array<[number, number]> = [
  [28, 8.4],
  [-28, 8.4],
  [28, 42],
  [-28, 42],
];

/**
 * Checks whether a motorized vehicle runs a red light at an intersection or exceeds 65 km/h.
 */
export function detectTrafficViolation(
  x: number,
  z: number,
  yaw: number,
  speedMetersPerSec: number,
  kind: VehicleKind,
  traffic: TrafficLightPhase
): 'red_light' | 'speeding' | null {
  if (kind === 'trishaw') return null;
  const kmh = getSpeedKmh(speedMetersPerSec);
  if (kmh > 68) {
    return 'speeding';
  }
  if (kmh < 18) return null;

  const fwdX = Math.abs(-Math.sin(yaw));
  const fwdZ = Math.abs(-Math.cos(yaw));
  const movingEW = fwdX > fwdZ;

  for (const [ix, iz] of INTERSECTIONS) {
    if (Math.abs(x - ix) < 3.6 && Math.abs(z - iz) < 3.6) {
      if (movingEW && !traffic.ewGreen) return 'red_light';
      if (!movingEW && !traffic.nsGreen) return 'red_light';
    }
  }
  return null;
}
