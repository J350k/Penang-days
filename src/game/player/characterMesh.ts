import * as THREE from 'three';
import { attachOutline, createToonMaterial } from '../world/toonMaterials';

export type HairStyleId = 'short' | 'bob' | 'ponytail' | 'curly';
export type HatStyleId = 'none' | 'straw' | 'cap' | 'beanie';

export interface WardrobeAppearance {
  hairStyle: HairStyleId;
  hairColorHex: number;
  shirtHex: number;
  vestHex: number;
  pantsHex: number;
  hatStyle: HatStyleId;
  umbrellaColorHex: number;
}

export interface CharacterRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  applyOutfit: (shirtHex: number, vestHex: number, pantsHex: number) => void;
  applyWardrobe: (appearance: WardrobeAppearance) => void;
  setRainUmbrella: (visible: boolean) => void;
  setMountedPose: (mounted: boolean) => void;
  updateAnimation: (moveSpeed: number, dt: number, isRunning: boolean) => void;
}

export function createCharacterRig(contactShadowTex: THREE.Texture): CharacterRig {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const skinMat = createToonMaterial({ color: 0xefc09b });
  const hairMat = createToonMaterial({ color: 0x2c221e });
  const shirtMat = createToonMaterial({ color: 0xf4ece1 });
  const vestMat = createToonMaterial({ color: 0x6baa8e });
  const pantsMat = createToonMaterial({ color: 0x3b4d5e });
  const shoeMat = createToonMaterial({ color: 0x5d402b });
  const eyeMat = createToonMaterial({ color: 0x1c1917 });
  const hatMat = createToonMaterial({ color: 0xf4e3b8 });
  const umbrellaMat = createToonMaterial({ color: 0xe8a598 });

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 16),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.016;
  group.add(shadow);

  const makeLeg = (xOffset: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(xOffset, 0.72, 0);

    const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.2), pantsMat);
    legMesh.position.y = -0.3;
    legMesh.castShadow = true;
    attachOutline(legMesh, 'character', 1.04);
    pivot.add(legMesh);

    const shoeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.28), shoeMat);
    shoeMesh.position.set(0, -0.66, -0.04);
    shoeMesh.castShadow = true;
    pivot.add(shoeMesh);

    bodyGroup.add(pivot);
    return pivot;
  };

  const leftLeg = makeLeg(-0.12);
  const rightLeg = makeLeg(0.12);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.26), shirtMat);
  torso.position.y = 1.0;
  torso.castShadow = true;
  attachOutline(torso, 'character', 1.03);
  bodyGroup.add(torso);

  const overshirt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.22), vestMat);
  overshirt.position.set(0, 1.01, 0.03);
  overshirt.castShadow = true;
  attachOutline(overshirt, 'character', 1.03);
  bodyGroup.add(overshirt);

  const makeArm = (xOffset: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(xOffset, 1.24, 0);

    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.16), shirtMat);
    sleeve.position.y = -0.14;
    sleeve.castShadow = true;
    attachOutline(sleeve, 'character', 1.04);
    pivot.add(sleeve);

    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.13), skinMat);
    forearm.position.y = -0.4;
    forearm.castShadow = true;
    pivot.add(forearm);

    bodyGroup.add(pivot);
    return pivot;
  };

  const leftArm = makeArm(-0.31);
  const rightArm = makeArm(0.31);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), skinMat);
  head.position.set(0, 1.47, 0);
  head.castShadow = true;
  attachOutline(head, 'character', 1.035);
  bodyGroup.add(head);

  // Hair variations
  const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.14, 0.37), hairMat);
  hairTop.position.set(0, 1.62, 0.01);
  hairTop.castShadow = true;
  bodyGroup.add(hairTop);

  const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.12), hairMat);
  hairBack.position.set(0, 1.48, 0.13);
  bodyGroup.add(hairBack);

  const hairBobSides = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.24), hairMat);
  hairBobSides.position.set(0, 1.45, 0.05);
  hairBobSides.visible = false;
  bodyGroup.add(hairBobSides);

  const hairPonytail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.34, 8), hairMat);
  hairPonytail.position.set(0, 1.44, 0.23);
  hairPonytail.rotation.x = 0.35;
  hairPonytail.visible = false;
  bodyGroup.add(hairPonytail);

  const hairCurly = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), hairMat);
  hairCurly.position.set(0, 1.62, 0.02);
  hairCurly.scale.set(1.05, 0.72, 1.05);
  hairCurly.visible = false;
  bodyGroup.add(hairCurly);

  // Hat variations
  const hatStraw = new THREE.Group();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.04, 12), hatMat);
  brim.position.set(0, 1.66, 0);
  hatStraw.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.14, 10), hatMat);
  crown.position.set(0, 1.74, 0);
  hatStraw.add(crown);
  hatStraw.visible = false;
  bodyGroup.add(hatStraw);

  const hatCap = new THREE.Group();
  const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.36), hatMat);
  capTop.position.set(0, 1.68, 0);
  hatCap.add(capTop);
  const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.18), hatMat);
  capVisor.position.set(0, 1.64, -0.22);
  hatCap.add(capVisor);
  hatCap.visible = false;
  bodyGroup.add(hatCap);

  const hatBeanie = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), hatMat);
  hatBeanie.position.set(0, 1.66, 0);
  hatBeanie.scale.set(1, 0.72, 1);
  hatBeanie.visible = false;
  bodyGroup.add(hatBeanie);

  for (const ex of [-0.08, 0.08]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.03), eyeMat);
    eye.position.set(ex, 1.48, -0.17);
    bodyGroup.add(eye);
  }

  // Player Umbrella (shown automatically when raining outdoors!)
  const playerUmbrella = new THREE.Group();
  const uHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.85, 6),
    createToonMaterial({ color: 0x5a3e36 })
  );
  uHandle.position.y = 0.42;
  playerUmbrella.add(uHandle);
  const uCanopy = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.25, 8), umbrellaMat);
  uCanopy.position.y = 0.88;
  playerUmbrella.add(uCanopy);
  playerUmbrella.position.set(0.28, 1.2, 0);
  playerUmbrella.visible = false;
  bodyGroup.add(playerUmbrella);

  let walkPhase = 0;
  let idleTime = 0;
  let isMounted = false;

  const applyOutfit = (shirtHex: number, vestHex: number, pantsHex: number) => {
    shirtMat.color.setHex(shirtHex);
    vestMat.color.setHex(vestHex);
    pantsMat.color.setHex(pantsHex);
  };

  const applyWardrobe = (app: WardrobeAppearance) => {
    shirtMat.color.setHex(app.shirtHex);
    vestMat.color.setHex(app.vestHex);
    pantsMat.color.setHex(app.pantsHex);
    hairMat.color.setHex(app.hairColorHex);
    umbrellaMat.color.setHex(app.umbrellaColorHex);

    hairTop.visible = app.hairStyle !== 'curly';
    hairBack.visible = app.hairStyle === 'short' || app.hairStyle === 'ponytail';
    hairBobSides.visible = app.hairStyle === 'bob';
    hairPonytail.visible = app.hairStyle === 'ponytail';
    hairCurly.visible = app.hairStyle === 'curly';

    hatStraw.visible = app.hatStyle === 'straw';
    hatCap.visible = app.hatStyle === 'cap';
    hatBeanie.visible = app.hatStyle === 'beanie';
    if (app.hatStyle === 'straw') hatMat.color.setHex(0xf4e3b8);
    else if (app.hatStyle === 'cap') hatMat.color.setHex(0x6baa8e);
    else if (app.hatStyle === 'beanie') hatMat.color.setHex(0xe8a598);
  };

  const setRainUmbrella = (visible: boolean) => {
    playerUmbrella.visible = visible && !isMounted;
  };

  const setMountedPose = (mounted: boolean) => {
    isMounted = mounted;
    shadow.visible = !mounted;
    if (mounted) playerUmbrella.visible = false;
  };

  const updateAnimation = (moveSpeed: number, dt: number, isRunning: boolean) => {
    idleTime += dt;
    if (isMounted) {
      bodyGroup.position.y = 0.08;
      bodyGroup.rotation.x = -0.14;
      leftLeg.rotation.x = 1.05;
      rightLeg.rotation.x = 1.05;
      leftArm.rotation.x = 0.85;
      rightArm.rotation.x = 0.85;
      return;
    }

    if (moveSpeed > 0.15) {
      walkPhase += moveSpeed * dt * 2.8;
      const swingAmp = isRunning ? 0.85 : 0.56;
      const swing = Math.sin(walkPhase) * swingAmp;

      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.78;
      rightArm.rotation.x = swing * 0.78;
      bodyGroup.position.y = Math.abs(Math.sin(walkPhase)) * (isRunning ? 0.075 : 0.045);
      bodyGroup.rotation.x = isRunning ? -0.1 : -0.04;
    } else {
      const damp = 1 - Math.exp(-12 * dt);
      leftLeg.rotation.x += (0 - leftLeg.rotation.x) * damp;
      rightLeg.rotation.x += (0 - rightLeg.rotation.x) * damp;
      leftArm.rotation.x += (0 - leftArm.rotation.x) * damp;
      rightArm.rotation.x += (0 - rightArm.rotation.x) * damp;
      bodyGroup.rotation.x += (0 - bodyGroup.rotation.x) * damp;
      bodyGroup.position.y += (Math.sin(idleTime * 2.2) * 0.012 - bodyGroup.position.y) * damp;
    }
  };

  return {
    group,
    bodyGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    applyOutfit,
    applyWardrobe,
    setRainUmbrella,
    setMountedPose,
    updateAnimation,
  };
}
