import * as THREE from 'three';
import { attachOutline, createToonMaterial } from './toonMaterials';
import type { AABB } from '../types';

export interface FoodStallSpec {
  id: string;
  stallName: string;
  subLabel: string;
  x: number;
  z: number;
  rotY: number;
  awningColor: number;
  accentColor: number;
  neonColor: number;
}

export const FOOD_STALL_SPECS: FoodStallSpec[] = [
  {
    id: 'stall-ckt',
    stallName: '炭火炒粿条',
    subLabel: 'Ah Kow CKT',
    x: 12.0,
    z: 3.1,
    rotY: 0,
    awningColor: 0xc97b6b,
    accentColor: 0xf4e3b8,
    neonColor: 0xff4fa3,
  },
  {
    id: 'stall-cendol',
    stallName: '槟城煎蕊·糕点',
    subLabel: 'Kak Ros Cendol',
    x: 22.0,
    z: 16.5,
    rotY: Math.PI,
    awningColor: 0x6baa8e,
    accentColor: 0xa8d5ba,
    neonColor: 0x3de0ff,
  },
  {
    id: 'stall-peanut',
    stallName: '古早花生汤',
    subLabel: 'Peanut Soup',
    x: -12.0,
    z: 15.8,
    rotY: Math.PI,
    awningColor: 0xe8a598,
    accentColor: 0xf4e3b8,
    neonColor: 0xffd84d,
  },
  {
    id: 'stall-curry',
    stallName: '白咖喱面·咖啡店',
    subLabel: 'Auntie Lim',
    x: 21.0,
    z: -6.5,
    rotY: Math.PI / 2,
    awningColor: 0x6baa8e,
    accentColor: 0xbfd8e8,
    neonColor: 0xff4fa3,
  },
  {
    id: 'stall-gurney',
    stallName: '关仔角亚参叻沙',
    subLabel: 'Gurney Hawker',
    x: -112.0,
    z: 60.0,
    rotY: 0,
    awningColor: 0xe8a598,
    accentColor: 0xa8d5ba,
    neonColor: 0x3de0ff,
  },
  {
    id: 'stall-mainland',
    stallName: '渡口福建面·扁担饭',
    subLabel: 'Harbor Kopitiam',
    x: 146.0,
    z: 80.0,
    rotY: -Math.PI / 2,
    awningColor: 0xbfd8e8,
    accentColor: 0xf4e3b8,
    neonColor: 0xffd84d,
  },
];

function createSignTexture(title: string, subtitle: string, bgHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#faf3e6';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 88);

  ctx.fillStyle = '#faf3e6';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 128, 46);

  ctx.fillStyle = '#f4e3b8';
  ctx.font = '600 18px sans-serif';
  ctx.fillText(subtitle, 128, 74);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export interface FoodStallsResult {
  group: THREE.Group;
  colliders: AABB[];
  lanternMaterials: THREE.MeshToonMaterial[];
  neonSignMaterials: THREE.MeshBasicMaterial[];
  updateSteam: (dt: number, qualityMultiplier: number) => void;
  dispose: () => void;
}

interface SteamParticle {
  stallIndex: number;
  phase: number;
  offsetX: number;
  offsetZ: number;
  speed: number;
}

export function buildFoodStalls(): FoodStallsResult {
  const group = new THREE.Group();
  const colliders: AABB[] = [];
  const lanternMaterials: THREE.MeshToonMaterial[] = [];
  const neonSignMaterials: THREE.MeshBasicMaterial[] = [];
  const signTextures: THREE.CanvasTexture[] = [];

  const steelMat = createToonMaterial({ color: 0xd0d5da });
  const woodMat = createToonMaterial({ color: 0x7b4f31 });
  const potMat = createToonMaterial({ color: 0x3b3b3b });

  const steamOrigins: Array<{ x: number; y: number; z: number }> = [];

  FOOD_STALL_SPECS.forEach((spec) => {
    const stall = new THREE.Group();
    stall.position.set(spec.x, 0, spec.z);
    stall.rotation.y = spec.rotY;

    const awningMat = createToonMaterial({ color: spec.awningColor });
    const accentMat = createToonMaterial({ color: spec.accentColor });
    const lanternMat = createToonMaterial({
      color: 0xff5a5f,
      emissive: 0xff5a5f,
      emissiveIntensity: 0.25,
    });
    lanternMaterials.push(lanternMat);

    const neonMat = new THREE.MeshBasicMaterial({
      color: spec.neonColor,
      transparent: true,
      opacity: 0.85,
    });
    neonSignMaterials.push(neonMat);

    const cart = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.95, 1.05), steelMat);
    cart.position.y = 0.475;
    cart.castShadow = true;
    cart.receiveShadow = true;
    attachOutline(cart, 'building', 1.025);
    stall.add(cart);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 1.15), woodMat);
    counter.position.y = 0.98;
    stall.add(counter);

    for (const px of [-1.1, 1.1]) {
      for (const pz of [-0.45, 0.45]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 6), steelMat);
        pole.position.set(px, 1.7, pz);
        stall.add(pole);
      }
    }

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 1.65), awningMat);
    canopy.position.set(0, 2.48, 0.05);
    canopy.rotation.x = 0.12;
    canopy.castShadow = true;
    attachOutline(canopy, 'building', 1.025);
    stall.add(canopy);

    const valence = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.16, 0.08), accentMat);
    valence.position.set(0, 2.34, 0.85);
    stall.add(valence);

    // Signboard with neon outline bars
    const signTex = createSignTexture(
      spec.stallName,
      spec.subLabel,
      `#${spec.awningColor.toString(16).padStart(6, '0')}`
    );
    signTextures.push(signTex);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.68), signMat);
    signBoard.position.set(0, 2.86, 0.65);
    stall.add(signBoard);
    const signBack = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.72, 0.06), woodMat);
    signBack.position.set(0, 2.86, 0.61);
    stall.add(signBack);

    const neonTop = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.045, 0.08), neonMat);
    neonTop.position.set(0, 3.24, 0.64);
    stall.add(neonTop);
    const neonBot = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.045, 0.08), neonMat);
    neonBot.position.set(0, 2.49, 0.64);
    stall.add(neonBot);

    const wok = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.16, 10), potMat);
    wok.position.set(-0.45, 1.08, 0);
    stall.add(wok);

    for (const lx of [-1.05, 1.05]) {
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), lanternMat);
      lantern.position.set(lx, 2.15, 0.78);
      stall.add(lantern);
    }

    group.add(stall);

    const halfX = Math.abs(Math.cos(spec.rotY)) > 0.5 ? 1.35 : 0.65;
    const halfZ = Math.abs(Math.cos(spec.rotY)) > 0.5 ? 0.65 : 1.35;
    colliders.push({
      minX: spec.x - halfX,
      maxX: spec.x + halfX,
      minY: 0,
      maxY: 2.6,
      minZ: spec.z - halfZ,
      maxZ: spec.z + halfZ,
      label: spec.id,
    });

    const localSteam = new THREE.Vector3(-0.45, 1.22, 0);
    localSteam.applyAxisAngle(new THREE.Vector3(0, 1, 0), spec.rotY);
    steamOrigins.push({
      x: spec.x + localSteam.x,
      y: 1.22,
      z: spec.z + localSteam.z,
    });
  });

  const particlesPerStall = 8;
  const totalParticles = FOOD_STALL_SPECS.length * particlesPerStall;
  const steamGeo = new THREE.SphereGeometry(0.14, 6, 6);
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const steamInst = new THREE.InstancedMesh(steamGeo, steamMat, totalParticles);
  steamInst.frustumCulled = false;
  group.add(steamInst);

  const particles: SteamParticle[] = [];
  for (let s = 0; s < FOOD_STALL_SPECS.length; s++) {
    for (let i = 0; i < particlesPerStall; i++) {
      particles.push({
        stallIndex: s,
        phase: i / particlesPerStall,
        offsetX: Math.sin(i * 2.3) * 0.12,
        offsetZ: Math.cos(i * 1.9) * 0.12,
        speed: 0.55 + (i % 3) * 0.12,
      });
    }
  }

  const dummy = new THREE.Object3D();
  const updateSteam = (dt: number, qualityMultiplier: number) => {
    const activeCount = Math.max(4, Math.floor(totalParticles * qualityMultiplier));
    steamInst.count = activeCount;
    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];
      p.phase = (p.phase + p.speed * dt) % 1;
      const origin = steamOrigins[p.stallIndex];
      const rise = p.phase * 1.15;
      const scale = Math.sin(p.phase * Math.PI) * (0.65 + p.phase * 0.75);
      dummy.position.set(
        origin.x + p.offsetX + Math.sin(p.phase * 5 + i) * 0.06,
        origin.y + rise,
        origin.z + p.offsetZ
      );
      dummy.scale.setScalar(Math.max(0.01, scale));
      dummy.updateMatrix();
      steamInst.setMatrixAt(i, dummy.matrix);
    }
    steamInst.instanceMatrix.needsUpdate = true;
  };

  return {
    group,
    colliders,
    lanternMaterials,
    neonSignMaterials,
    updateSteam,
    dispose: () => {
      signTextures.forEach((t) => t.dispose());
    },
  };
}
