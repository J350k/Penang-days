import * as THREE from 'three';
import type { QualityLevel } from '../types';

const MAX_RAIN_DROPS = 460;

interface DropData {
  ox: number;
  oy: number;
  oz: number;
  speed: number;
}

export class RainSystem {
  public group: THREE.Group;
  private instMesh: THREE.InstancedMesh;
  private material: THREE.MeshBasicMaterial;
  private drops: DropData[] = [];
  private dummy = new THREE.Object3D();

  constructor() {
    this.group = new THREE.Group();
    const geo = new THREE.BoxGeometry(0.025, 0.55, 0.025);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xd4e7f5,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.instMesh = new THREE.InstancedMesh(geo, this.material, MAX_RAIN_DROPS);
    this.instMesh.frustumCulled = false;
    this.group.add(this.instMesh);

    for (let i = 0; i < MAX_RAIN_DROPS; i++) {
      this.drops.push({
        ox: (Math.random() - 0.5) * 26,
        oy: Math.random() * 14,
        oz: (Math.random() - 0.5) * 26,
        speed: 14 + Math.random() * 5,
      });
    }
  }

  public update(
    rainIntensity: number,
    playerX: number,
    playerZ: number,
    dt: number,
    quality: QualityLevel
  ): void {
    if (rainIntensity <= 0.02) {
      this.instMesh.visible = false;
      return;
    }

    this.instMesh.visible = true;
    this.material.opacity = rainIntensity * 0.52;

    const budget =
      quality === 'low' ? 140 : quality === 'medium' ? 280 : MAX_RAIN_DROPS;
    this.instMesh.count = budget;

    for (let i = 0; i < budget; i++) {
      const d = this.drops[i];
      d.oy -= d.speed * dt;
      if (d.oy < 0.2) {
        d.oy = 13.5 + (i % 3) * 0.5;
      }
      this.dummy.position.set(playerX + d.ox, d.oy, playerZ + d.oz);
      this.dummy.rotation.set(0, 0, 0.08);
      this.dummy.updateMatrix();
      this.instMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.instMesh.instanceMatrix.needsUpdate = true;
  }
}
