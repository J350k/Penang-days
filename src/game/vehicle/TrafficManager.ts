import * as THREE from 'three';
import { createBusGroup, createCarGroup, createMotorcycleGroup } from '../world/props';
import type { TrafficLightPhase } from '../world/landmarks';

interface TrafficAgent {
  group: THREE.Group;
  kind: 'car' | 'scooter' | 'bus';
  axis: 'x' | 'z';
  laneCoord: number; // fixed Z when axis==='x', fixed X when axis==='z'
  pos: number;
  dir: 1 | -1;
  minLimit: number;
  maxLimit: number;
  baseSpeed: number;
  collisionRadius: number;
}

const CAR_COLORS = [0xbfd8e8, 0xe8a598, 0xf4e3b8, 0xa8d5ba, 0xd8b8e8];

/**
 * Manages ambient NPC sedans, motorbikes, and Pearl Transit buses circulating
 * George Town roads while obeying traffic lights and avoiding the player's home.
 */
export class TrafficManager {
  public group = new THREE.Group();
  private agents: TrafficAgent[] = [];
  private activeLimit = 8;

  constructor(contactShadowTex: THREE.Texture) {
    const specs: Array<Omit<TrafficAgent, 'group'>> = [
      // Lebuh Armenian E-W (Z=8.4)
      { kind: 'car', axis: 'x', laneCoord: 10.3, pos: -52, dir: 1, minLimit: -82, maxLimit: 82, baseSpeed: 8.5, collisionRadius: 1.6 },
      { kind: 'scooter', axis: 'x', laneCoord: 6.5, pos: 50, dir: -1, minLimit: -82, maxLimit: 82, baseSpeed: 7.4, collisionRadius: 0.9 },
      { kind: 'car', axis: 'x', laneCoord: 10.2, pos: 18, dir: 1, minLimit: -82, maxLimit: 82, baseSpeed: 8.0, collisionRadius: 1.6 },
      // Komtar Blvd E-W (Z=42)
      { kind: 'bus', axis: 'x', laneCoord: 43.9, pos: -45, dir: 1, minLimit: -85, maxLimit: 85, baseSpeed: 7.0, collisionRadius: 2.3 },
      { kind: 'car', axis: 'x', laneCoord: 40.1, pos: 45, dir: -1, minLimit: -85, maxLimit: 85, baseSpeed: 9.2, collisionRadius: 1.6 },
      { kind: 'scooter', axis: 'x', laneCoord: 43.8, pos: 20, dir: 1, minLimit: -85, maxLimit: 85, baseSpeed: 7.8, collisionRadius: 0.9 },
      // Esplanade Rd E-W (Z=66)
      { kind: 'car', axis: 'x', laneCoord: 64.2, pos: -32, dir: -1, minLimit: -88, maxLimit: 88, baseSpeed: 8.2, collisionRadius: 1.6 },
      { kind: 'bus', axis: 'x', laneCoord: 67.8, pos: 25, dir: 1, minLimit: -88, maxLimit: 88, baseSpeed: 6.8, collisionRadius: 2.3 },
      // Mural Lane N-S (X=-28)
      { kind: 'car', axis: 'z', laneCoord: -29.8, pos: -22, dir: 1, minLimit: -58, maxLimit: 64, baseSpeed: 8.0, collisionRadius: 1.6 },
      { kind: 'scooter', axis: 'z', laneCoord: -26.2, pos: 26, dir: -1, minLimit: -58, maxLimit: 64, baseSpeed: 7.6, collisionRadius: 0.9 },
      // Jalan Kapitan N-S (X=28)
      { kind: 'car', axis: 'z', laneCoord: 26.2, pos: -18, dir: 1, minLimit: -58, maxLimit: 64, baseSpeed: 8.4, collisionRadius: 1.6 },
      { kind: 'scooter', axis: 'z', laneCoord: 29.8, pos: 30, dir: -1, minLimit: -58, maxLimit: 64, baseSpeed: 7.2, collisionRadius: 0.9 },
    ];

    specs.forEach((s, i) => {
      let meshGroup: THREE.Group;
      if (s.kind === 'bus') {
        meshGroup = createBusGroup(contactShadowTex);
      } else if (s.kind === 'scooter') {
        meshGroup = createMotorcycleGroup(CAR_COLORS[i % CAR_COLORS.length], contactShadowTex);
      } else {
        meshGroup = createCarGroup(CAR_COLORS[i % CAR_COLORS.length], contactShadowTex);
      }

      const agent: TrafficAgent = { ...s, group: meshGroup };
      this.positionAgent(agent);
      this.group.add(meshGroup);
      this.agents.push(agent);
    });
  }

  public setTrafficLimit(limit: number): void {
    this.activeLimit = Math.max(0, Math.min(this.agents.length, limit));
    this.agents.forEach((a, i) => {
      a.group.visible = i < this.activeLimit;
    });
  }

  private positionAgent(a: TrafficAgent): void {
    if (a.axis === 'x') {
      a.group.position.set(a.pos, 0, a.laneCoord);
      // Vehicle meshes face -Z when yaw=0; +X travel requires yaw = -Math.PI/2
      a.group.rotation.y = a.dir === 1 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      a.group.position.set(a.laneCoord, 0, a.pos);
      a.group.rotation.y = a.dir === 1 ? Math.PI : 0;
    }
  }

  public update(
    dt: number,
    traffic: TrafficLightPhase,
    playerX: number,
    playerZ: number,
    playerMounted: boolean
  ): { bumpedTraffic: boolean } {
    let bumpedTraffic = false;

    for (let i = 0; i < this.activeLimit; i++) {
      const a = this.agents[i];
      let stopped = false;

      // Obey traffic lights before entering intersections
      if (a.axis === 'x' && !traffic.ewGreen) {
        for (const ix of [-28, 28]) {
          const distAhead = (ix - a.pos) * a.dir;
          if (distAhead > 4.2 && distAhead < 8.6) {
            stopped = true;
            break;
          }
        }
      } else if (a.axis === 'z' && !traffic.nsGreen) {
        for (const iz of [8.4, 42]) {
          const distAhead = (iz - a.pos) * a.dir;
          if (distAhead > 4.2 && distAhead < 8.6) {
            stopped = true;
            break;
          }
        }
      }

      // Pause gently if player is standing right in front of the NPC vehicle
      const wx = a.axis === 'x' ? a.pos : a.laneCoord;
      const wz = a.axis === 'x' ? a.laneCoord : a.pos;
      const distPlayer = Math.hypot(wx - playerX, wz - playerZ);
      if (distPlayer < a.collisionRadius + 1.1) {
        stopped = true;
        if (playerMounted) {
          bumpedTraffic = true;
        }
      }

      if (!stopped) {
        a.pos += a.dir * a.baseSpeed * dt;
        if (a.pos > a.maxLimit) a.pos = a.minLimit;
        if (a.pos < a.minLimit) a.pos = a.maxLimit;
      }

      this.positionAgent(a);
    }

    return { bumpedTraffic };
  }
}
