import * as THREE from 'three';
import type { LanguageCode, NpcDefinition } from '../types';
import type { TrafficLightPhase } from '../world/landmarks';
import { attachOutline, createToonMaterial } from '../world/toonMaterials';
import { NAMED_NPCS, getScheduledSlotForHour } from './npcData';

interface NamedNpcActor {
  def: NpcDefinition;
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  umbrella: THREE.Group;
  x: number;
  z: number;
  yaw: number;
  nameSprite: THREE.Sprite;
}

interface AmbientWalker {
  group: THREE.Group;
  umbrella: THREE.Group;
  axis: 'x' | 'z';
  fixedCoord: number;
  pos: number;
  dir: 1 | -1;
  minLimit: number;
  maxLimit: number;
  speed: number;
  phase: number;
}

function createNameplateSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(29, 24, 19, 0.82)';
  ctx.beginPath();
  ctx.roundRect(14, 12, 228, 40, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(250, 243, 230, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#faf3e6';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 33);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.9, 0.48, 1);
  return sprite;
}

function createUmbrella(colorHex: number): THREE.Group {
  const umb = new THREE.Group();
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.85, 6),
    createToonMaterial({ color: 0x3b2d24 })
  );
  handle.position.y = 0.42;
  umb.add(handle);

  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.68, 0.24, 8),
    createToonMaterial({ color: colorHex })
  );
  canopy.position.y = 0.88;
  umb.add(canopy);
  umb.visible = false;
  return umb;
}

export class NpcManager {
  public group = new THREE.Group();
  private namedActors: NamedNpcActor[] = [];
  private walkers: AmbientWalker[] = [];
  private activeWalkerLimit = 20;
  private texturesToDispose: THREE.Texture[] = [];

  constructor(contactShadowTex: THREE.Texture, lang: LanguageCode = 'zh') {
    this.buildNamedNpcs(contactShadowTex, lang);
    this.buildAmbientWalkers();
  }

  public setAmbientWalkerLimit(limit: number): void {
    this.activeWalkerLimit = Math.max(0, Math.min(this.walkers.length, limit));
    this.walkers.forEach((w, idx) => {
      w.group.visible = idx < this.activeWalkerLimit;
    });
  }

  private buildNamedNpcs(contactShadowTex: THREE.Texture, lang: LanguageCode): void {
    const skinMat = createToonMaterial({ color: 0xeac09a });
    const shadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });

    NAMED_NPCS.forEach((def) => {
      const g = new THREE.Group();
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(def.isCat ? 0.28 : 0.42, 12), shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.015;
      g.add(shadow);

      let leftLeg: THREE.Mesh;
      let rightLeg: THREE.Mesh;

      if (def.isCat) {
        const furMat = createToonMaterial({ color: def.shirtHex });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.46), furMat);
        body.position.set(0, 0.22, 0);
        body.castShadow = true;
        attachOutline(body, 'npc', 1.04);
        g.add(body);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.22), furMat);
        head.position.set(0, 0.36, -0.22);
        attachOutline(head, 'npc', 1.04);
        g.add(head);

        for (const ex of [-0.07, 0.07]) {
          const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 4), furMat);
          ear.position.set(ex, 0.5, -0.2);
          g.add(ear);
        }

        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.28), furMat);
        tail.position.set(0, 0.32, 0.3);
        tail.rotation.x = 0.5;
        g.add(tail);

        leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.06), furMat);
        leftLeg.position.set(-0.08, 0.07, -0.14);
        g.add(leftLeg);

        rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.06), furMat);
        rightLeg.position.set(0.08, 0.07, -0.14);
        g.add(rightLeg);
      } else {
        const shirtMat = createToonMaterial({ color: def.shirtHex });
        const pantsMat = createToonMaterial({ color: def.pantsHex });
        const hairMat = createToonMaterial({ color: def.hairHex });

        leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.18), pantsMat);
        leftLeg.position.set(-0.11, 0.31, 0);
        leftLeg.castShadow = true;
        attachOutline(leftLeg, 'npc', 1.04);
        g.add(leftLeg);

        rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.18), pantsMat);
        rightLeg.position.set(0.11, 0.31, 0);
        rightLeg.castShadow = true;
        attachOutline(rightLeg, 'npc', 1.04);
        g.add(rightLeg);

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.56, 0.24), shirtMat);
        torso.position.set(0, 0.92, 0);
        torso.castShadow = true;
        attachOutline(torso, 'npc', 1.03);
        g.add(torso);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), skinMat);
        head.position.set(0, 1.38, 0);
        head.castShadow = true;
        attachOutline(head, 'npc', 1.035);
        g.add(head);

        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.34), hairMat);
        hair.position.set(0, 1.52, 0.01);
        g.add(hair);

        if (def.hatHex !== undefined) {
          const hatMat = createToonMaterial({ color: def.hatHex });
          const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.1, 8), hatMat);
          hat.position.set(0, 1.6, 0);
          g.add(hat);
        }
      }

      const umbrella = createUmbrella(0x6baa8e);
      if (!def.isCat) {
        umbrella.position.set(0.26, 1.15, 0);
        g.add(umbrella);
      }

      const sprite = createNameplateSprite(lang === 'zh' ? def.nameZh : def.nameEn);
      sprite.position.set(0, def.isCat ? 0.95 : 2.15, 0);
      g.add(sprite);
      if (sprite.material.map) this.texturesToDispose.push(sprite.material.map);

      const initSlot = def.schedule[1] ?? def.schedule[0];
      g.position.set(initSlot.x, 0, initSlot.z);
      g.rotation.y = initSlot.yaw;
      this.group.add(g);

      this.namedActors.push({
        def,
        group: g,
        leftLeg,
        rightLeg,
        umbrella,
        x: initSlot.x,
        z: initSlot.z,
        yaw: initSlot.yaw,
        nameSprite: sprite,
      });
    });
  }

  public summonNpcNearHome(npcId: string, x: number, z: number): void {
    const actor = this.namedActors.find((a) => a.def.id === npcId);
    if (actor) {
      actor.x = x;
      actor.z = z;
      actor.yaw = Math.PI;
      actor.group.position.set(x, 0, z);
      actor.group.rotation.y = actor.yaw;
    }
  }

  private buildAmbientWalkers(): void {
    const shirtPalette = [0xbfd8e8, 0xf4e3b8, 0xa8d5ba, 0xe8a598, 0xf4ece1, 0x6baa8e];
    const umbPalette = [0xc97b6b, 0x6baa8e, 0xbfd8e8, 0xf4e3b8, 0xe8a598];
    const pantsMat = createToonMaterial({ color: 0x394452 });
    const skinMat = createToonMaterial({ color: 0xe8bc96 });

    // 20 ambient sidewalk walkers (no outlines for repeated crowd NPCs)
    for (let i = 0; i < 20; i++) {
      const g = new THREE.Group();
      const shirtMat = createToonMaterial({
        color: shirtPalette[i % shirtPalette.length],
      });

      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.65, 0.2), pantsMat);
      legs.position.y = 0.325;
      legs.castShadow = true;
      g.add(legs);

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.54, 0.22), shirtMat);
      torso.position.y = 0.92;
      torso.castShadow = true;
      g.add(torso);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), skinMat);
      head.position.y = 1.35;
      g.add(head);

      const umb = createUmbrella(umbPalette[i % umbPalette.length]);
      umb.position.set(0.22, 1.1, 0);
      g.add(umb);

      const axis: 'x' | 'z' = i % 2 === 0 ? 'x' : 'z';
      const sidewalkYs = [3.6, 13.4, 37.2, 47.0, 61.0];
      const sidewalkXs = [-23.2, -32.8, 23.2, 32.8, 45.2];
      const fixedCoord =
        axis === 'x'
          ? sidewalkYs[(i >> 1) % sidewalkYs.length]
          : sidewalkXs[(i >> 1) % sidewalkXs.length];

      const minLimit = axis === 'x' ? -70 : -50;
      const maxLimit = axis === 'x' ? 70 : 68;
      const pos = minLimit + ((i * 29) % (maxLimit - minLimit));

      g.position.set(axis === 'x' ? pos : fixedCoord, 0, axis === 'x' ? fixedCoord : pos);
      this.group.add(g);

      this.walkers.push({
        group: g,
        umbrella: umb,
        axis,
        fixedCoord,
        pos,
        dir: i % 3 === 0 ? -1 : 1,
        minLimit,
        maxLimit,
        speed: 1.35 + (i % 4) * 0.18,
        phase: i * 0.8,
      });
    }
  }

  public update(
    hour: number,
    rainIntensity: number,
    traffic: TrafficLightPhase,
    dt: number,
    bikeMounted: boolean,
    bikeX: number,
    bikeZ: number
  ): { bumpedPedestrian: boolean } {
    const isRaining = rainIntensity > 0.25;
    let bumpedPedestrian = false;

    // Update 8 named NPCs along their daily schedule
    for (const actor of this.namedActors) {
      const slot = getScheduledSlotForHour(actor.def, hour);
      const dx = slot.x - actor.x;
      const dz = slot.z - actor.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.25) {
        const step = Math.min(dist, 2.2 * dt);
        actor.x += (dx / dist) * step;
        actor.z += (dz / dist) * step;
        actor.yaw = Math.atan2(-dx, -dz);
        const swing = Math.sin(performance.now() * 0.007) * 0.45;
        actor.leftLeg.rotation.x = swing;
        actor.rightLeg.rotation.x = -swing;
      } else {
        actor.leftLeg.rotation.x = 0;
        actor.rightLeg.rotation.x = 0;
        actor.yaw = slot.yaw;
      }

      actor.group.position.set(actor.x, 0, actor.z);
      actor.group.rotation.y = actor.yaw;
      if (!actor.def.isCat) {
        actor.umbrella.visible = isRaining;
      }
    }

    // Update active ambient sidewalk walkers (obeying traffic lights at crosswalks!)
    for (let wi = 0; wi < this.activeWalkerLimit; wi++) {
      const w = this.walkers[wi];
      w.umbrella.visible = isRaining;

      // Check if approaching an intersection crosswalk on red light
      let waitingAtRed = false;
      if (w.axis === 'x') {
        const nearCap =
          Math.abs(w.pos - (28 - 4.8)) < 1.2 ||
          Math.abs(w.pos - (28 + 4.8)) < 1.2 ||
          Math.abs(w.pos - (-28 - 4.8)) < 1.2 ||
          Math.abs(w.pos - (-28 + 4.8)) < 1.2;
        if (nearCap && !traffic.ewGreen) waitingAtRed = true;
      } else {
        const nearCap =
          Math.abs(w.pos - (8.4 - 4.8)) < 1.2 ||
          Math.abs(w.pos - (8.4 + 4.8)) < 1.2 ||
          Math.abs(w.pos - (42 - 4.8)) < 1.2 ||
          Math.abs(w.pos - (42 + 4.8)) < 1.2;
        if (nearCap && !traffic.nsGreen) waitingAtRed = true;
      }

      if (!waitingAtRed) {
        w.pos += w.dir * w.speed * dt;
        if (w.pos >= w.maxLimit) {
          w.pos = w.maxLimit;
          w.dir = -1;
        } else if (w.pos <= w.minLimit) {
          w.pos = w.minLimit;
          w.dir = 1;
        }
        w.phase += dt * 4;
      }

      const wx = w.axis === 'x' ? w.pos : w.fixedCoord;
      const wz = w.axis === 'x' ? w.fixedCoord : w.pos;

      // Gentle non-violent scooter bump avoidance
      if (bikeMounted && Math.hypot(wx - bikeX, wz - bikeZ) < 1.05) {
        bumpedPedestrian = true;
        w.pos -= w.dir * 0.9; // Step aside politely
      }

      w.group.position.set(wx, Math.abs(Math.sin(w.phase)) * 0.03, wz);
      w.group.rotation.y =
        w.axis === 'x' ? (w.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : w.dir > 0 ? Math.PI : 0;
    }

    return { bumpedPedestrian };
  }

  public getNearestNpc(px: number, pz: number, maxDist: number = 2.6): NamedNpcActor | null {
    let best: NamedNpcActor | null = null;
    let bestDist = maxDist;
    for (const actor of this.namedActors) {
      const d = Math.hypot(actor.x - px, actor.z - pz);
      if (d < bestDist) {
        bestDist = d;
        best = actor;
      }
    }
    return best;
  }

  public getNamedNpcPositions(): Array<{ id: string; x: number; z: number; name: string }> {
    return this.namedActors.map((a) => ({
      id: a.def.id,
      x: a.x,
      z: a.z,
      name: a.def.nameZh,
    }));
  }

  public dispose(): void {
    this.texturesToDispose.forEach((t) => t.dispose());
  }
}
