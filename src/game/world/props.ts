import * as THREE from 'three';
import { attachOutline, createToonMaterial } from './toonMaterials';

/**
 * Low-poly Malaysian kapchai / scooter built from geometric parts with toon shading & vehicle outline.
 * Bottom-center grounded at y = 0.
 */
export function createMotorcycleGroup(
  bodyColorHex: number,
  contactShadowTex: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();

  const bodyMat = createToonMaterial({ color: bodyColorHex });
  const tireMat = createToonMaterial({ color: 0x262626 });
  const metalMat = createToonMaterial({ color: 0xc8ccd0 });
  const seatMat = createToonMaterial({ color: 0x3b2d24 });
  const lampMat = createToonMaterial({
    color: 0xfff3c4,
    emissive: 0xffd584,
    emissiveIntensity: 0.35,
  });

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 16),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(0.7, 1.35, 1);
  shadow.position.y = 0.015;
  group.add(shadow);

  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.13, 10);
  rimGeo.rotateZ(Math.PI / 2);

  for (const zPos of [-0.56, 0.56]) {
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    tire.position.set(0, 0.24, zPos);
    tire.castShadow = true;
    attachOutline(tire, 'vehicle', 1.04);
    group.add(tire);

    const rim = new THREE.Mesh(rimGeo, metalMat);
    rim.position.set(0, 0.24, zPos);
    group.add(rim);
  }

  const rearBody = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.92), bodyMat);
  rearBody.position.set(0, 0.5, -0.22);
  rearBody.castShadow = true;
  attachOutline(rearBody, 'vehicle', 1.03);
  group.add(rearBody);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.64), seatMat);
  seat.position.set(0, 0.71, -0.22);
  seat.castShadow = true;
  group.add(seat);

  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.62, 0.18), bodyMat);
  shield.position.set(0, 0.62, 0.36);
  shield.rotation.x = -0.22;
  shield.castShadow = true;
  attachOutline(shield, 'vehicle', 1.03);
  group.add(shield);

  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.66, 8), metalMat);
  fork.position.set(0, 0.55, 0.48);
  fork.rotation.x = -0.22;
  group.add(fork);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.58, 8), metalMat);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 0.96, 0.34);
  group.add(handlebar);

  const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.1), lampMat);
  headlight.position.set(0, 0.88, 0.44);
  group.add(headlight);

  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.7, 8), metalMat);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(0.2, 0.25, -0.26);
  group.add(exhaust);

  return group;
}

/**
 * Low-poly Penang hatchback/sedan car with toon shading + vehicle outline.
 * Front faces -Z (consistent with player & scooter yaw).
 */
export function createCarGroup(
  bodyColorHex: number,
  contactShadowTex: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = createToonMaterial({ color: bodyColorHex });
  const cabinGlassMat = createToonMaterial({ color: 0x3b4d5e });
  const tireMat = createToonMaterial({ color: 0x262626 });
  const trimMat = createToonMaterial({ color: 0xd8dce0 });
  const lampMat = createToonMaterial({
    color: 0xfff3c4,
    emissive: 0xffd584,
    emissiveIntensity: 0.4,
  });
  const tailMat = createToonMaterial({
    color: 0xff4f5e,
    emissive: 0xff3b30,
    emissiveIntensity: 0.35,
  });

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 4.3),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  // Lower chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.62, 3.85), bodyMat);
  chassis.position.set(0, 0.56, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  attachOutline(chassis, 'vehicle', 1.02);
  group.add(chassis);

  // Cabin upper roof
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.56, 2.05), bodyMat);
  cabin.position.set(0, 1.12, 0.15);
  cabin.castShadow = true;
  attachOutline(cabin, 'vehicle', 1.022);
  group.add(cabin);

  // Windshield & side windows band
  const glassBand = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.38, 1.85), cabinGlassMat);
  glassBand.position.set(0, 1.1, 0.14);
  group.add(glassBand);

  // Bumpers
  for (const bz of [-1.94, 1.94]) {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.18, 0.12), trimMat);
    bumper.position.set(0, 0.34, bz);
    group.add(bumper);
  }

  // Headlights (-Z front) & taillights (+Z rear)
  for (const lx of [-0.62, 0.62]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.06), lampMat);
    hl.position.set(lx, 0.62, -1.94);
    group.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.06), tailMat);
    tl.position.set(lx, 0.64, 1.94);
    group.add(tl);
  }

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.22, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.24, 10);
  hubGeo.rotateZ(Math.PI / 2);
  for (const wx of [-0.84, 0.84]) {
    for (const wz of [-1.18, 1.18]) {
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.position.set(wx, 0.31, wz);
      tire.castShadow = true;
      group.add(tire);

      const hub = new THREE.Mesh(hubGeo, trimMat);
      hub.position.set(wx, 0.31, wz);
      group.add(hub);
    }
  }

  return group;
}

/**
 * Rideable Penang Heritage Trishaw (三轮车): front passenger hood at -Z, rider pedals at +Z.
 */
export function createTrishawGroup(contactShadowTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const frameMat = createToonMaterial({ color: 0xc84b3e });
  const canopyMat = createToonMaterial({ color: 0xf4e3b8 });
  const seatMat = createToonMaterial({ color: 0x5a3e36 });
  const tireMat = createToonMaterial({ color: 0x262626 });
  const brassMat = createToonMaterial({ color: 0xffd84d });

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 14),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  // Passenger carriage (-Z)
  const tub = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.56, 0.95), frameMat);
  tub.position.set(0, 0.54, -0.35);
  tub.castShadow = true;
  attachOutline(tub, 'vehicle', 1.03);
  group.add(tub);

  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.14, 0.72), seatMat);
  cushion.position.set(0, 0.76, -0.32);
  group.add(cushion);

  // Canopy posts + bright hood
  for (const px of [-0.48, 0.48]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.05, 6), brassMat);
    post.position.set(px, 1.25, -0.05);
    group.add(post);
  }
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.16, 1.08), canopyMat);
  hood.position.set(0, 1.78, -0.32);
  hood.castShadow = true;
  attachOutline(hood, 'vehicle', 1.03);
  group.add(hood);

  // Rear bicycle section (+Z)
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 1.1), frameMat);
  bar.position.set(0, 0.46, 0.45);
  group.add(bar);

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.32), seatMat);
  saddle.position.set(0, 0.88, 0.65);
  group.add(saddle);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.54, 8), brassMat);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 1.05, 0.25);
  group.add(handlebar);

  // Front two wheels + one rear wheel
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const [wx, wz] of [
    [-0.62, -0.35],
    [0.62, -0.35],
    [0, 0.82],
  ]) {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(wx, 0.32, wz);
    w.castShadow = true;
    attachOutline(w, 'vehicle', 1.04);
    group.add(w);
  }

  return group;
}

/**
 * Low-poly Rapid Penang-style city bus (fictional "Pearl Transit").
 */
export function createBusGroup(contactShadowTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = createToonMaterial({ color: 0xf4e3b8 });
  const stripeMat = createToonMaterial({ color: 0x3b8c6e });
  const glassMat = createToonMaterial({ color: 0x34495e });
  const tireMat = createToonMaterial({ color: 0x242424 });

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 7.0),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.25, 6.4), bodyMat);
  hull.position.set(0, 1.48, 0);
  hull.castShadow = true;
  attachOutline(hull, 'vehicle', 1.018);
  group.add(hull);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.45, 6.42), stripeMat);
  stripe.position.set(0, 0.92, 0);
  group.add(stripe);

  const windows = new THREE.Mesh(new THREE.BoxGeometry(2.23, 0.72, 5.7), glassMat);
  windows.position.set(0, 1.85, -0.1);
  group.add(windows);

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.28, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const wx of [-1.02, 1.02]) {
    for (const wz of [-1.95, 1.95]) {
      const w = new THREE.Mesh(wheelGeo, tireMat);
      w.position.set(wx, 0.42, wz);
      group.add(w);
    }
  }

  return group;
}

/**
 * Low-poly iconic double-deck Penang Ferry ("Pearl Ferry").
 */
export function createFerryGroup(): THREE.Group {
  const group = new THREE.Group();
  const hullMat = createToonMaterial({ color: 0xe8a598 });
  const deckMat = createToonMaterial({ color: 0xf4e3b8 });
  const cabinMat = createToonMaterial({ color: 0xbfd8e8 });
  const roofMat = createToonMaterial({ color: 0xc97b6b });
  const glassMat = createToonMaterial({ color: 0x2f4550 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.5, 14.2), hullMat);
  hull.position.set(0, 0.4, 0);
  hull.castShadow = true;
  attachOutline(hull, 'vehicle', 1.015);
  group.add(hull);

  const mainDeck = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.6, 10.6), deckMat);
  mainDeck.position.set(0, 1.9, 0);
  attachOutline(mainDeck, 'vehicle', 1.015);
  group.add(mainDeck);

  const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.5, 8.2), cabinMat);
  upperDeck.position.set(0, 3.4, 0);
  attachOutline(upperDeck, 'vehicle', 1.015);
  group.add(upperDeck);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 3.0), glassMat);
  bridge.position.set(0, 4.55, 0);
  group.add(bridge);

  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.3, 8), roofMat);
  funnel.position.set(0, 5.1, 2.2);
  group.add(funnel);

  return group;
}

/**
 * Low-poly Batu Ferringhi Jet Ski for beach minigame.
 */
export function createJetSkiGroup(): THREE.Group {
  const group = new THREE.Group();
  const hullMat = createToonMaterial({ color: 0x3de0ff });
  const trimMat = createToonMaterial({ color: 0xffd84d });
  const seatMat = createToonMaterial({ color: 0x262626 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 2.35), hullMat);
  hull.position.set(0, 0.22, 0);
  attachOutline(hull, 'vehicle', 1.03);
  group.add(hull);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.75, 4), trimMat);
  nose.rotation.x = -Math.PI / 2;
  nose.rotation.z = Math.PI / 4;
  nose.position.set(0, 0.24, -1.45);
  group.add(nose);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 1.05), seatMat);
  seat.position.set(0, 0.5, 0.2);
  group.add(seat);

  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.08), trimMat);
  bar.position.set(0, 0.75, -0.55);
  group.add(bar);

  return group;
}

/**
 * Heritage Penang streetlamp (toon materials, no outline for repeated props).
 */
export function createStreetlampGroup(): {
  group: THREE.Group;
  bulbMaterial: THREE.MeshToonMaterial;
} {
  const group = new THREE.Group();

  const ironMat = createToonMaterial({ color: 0x2b3634 });
  const brassMat = createToonMaterial({ color: 0xc29b52 });
  const bulbMaterial = createToonMaterial({
    color: 0xfff5d6,
    emissive: 0xffc857,
    emissiveIntensity: 0.08,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.55, 8), ironMat);
  base.position.y = 0.275;
  base.castShadow = true;
  group.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 3.6, 8), ironMat);
  pole.position.y = 2.35;
  pole.castShadow = true;
  group.add(pole);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 8), brassMat);
  collar.position.y = 4.1;
  group.add(collar);

  const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.38, 6), bulbMaterial);
  cage.position.y = 4.35;
  group.add(cage);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 6), ironMat);
  cap.position.y = 4.64;
  group.add(cap);

  return { group, bulbMaterial };
}

/**
 * Heritage ceiling fan for the 1F shophouse living room.
 */
export function createCeilingFanGroup(): THREE.Group {
  const fan = new THREE.Group();
  const brassMat = createToonMaterial({ color: 0xb9924c });
  const bladeMat = createToonMaterial({ color: 0x6f472b });

  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 8), brassMat);
  rod.position.y = -0.19;
  fan.add(rod);

  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.14, 12), brassMat);
  motor.position.y = -0.4;
  fan.add(motor);

  const bladeGeo = new THREE.BoxGeometry(0.68, 0.025, 0.14);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    const angle = (i * Math.PI) / 2;
    blade.position.set(Math.cos(angle) * 0.44, -0.4, Math.sin(angle) * 0.44);
    blade.rotation.y = -angle;
    fan.add(blade);
  }

  return fan;
}
