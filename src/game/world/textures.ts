import * as THREE from 'three';

export interface ProceduralTextureSet {
  peranakanTile: THREE.CanvasTexture;
  woodPlank: THREE.CanvasTexture;
  roadAsphalt: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function configureColorTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  maxAniso: number
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = Math.min(4, maxAniso);
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAniso: number): ProceduralTextureSet {
  // 1. Peranakan heritage floral diamond tile
  const [tileCanvas, tCtx] = makeCanvas(256, 256);
  tCtx.fillStyle = '#dfd1b6';
  tCtx.fillRect(0, 0, 256, 256);

  const drawQuarterTile = (ox: number, oy: number) => {
    tCtx.save();
    tCtx.translate(ox, oy);
    // Outer grout border
    tCtx.strokeStyle = '#9c8669';
    tCtx.lineWidth = 4;
    tCtx.strokeRect(2, 2, 124, 124);

    // Heritage Nyonya teal diamond
    tCtx.fillStyle = '#2d6e6a';
    tCtx.beginPath();
    tCtx.moveTo(64, 12);
    tCtx.lineTo(116, 64);
    tCtx.lineTo(64, 116);
    tCtx.lineTo(12, 64);
    tCtx.closePath();
    tCtx.fill();

    // Inner warm cream petal motif
    tCtx.fillStyle = '#efe3cc';
    tCtx.beginPath();
    tCtx.arc(64, 64, 24, 0, Math.PI * 2);
    tCtx.fill();

    // Terracotta center rosette
    tCtx.fillStyle = '#b95238';
    tCtx.beginPath();
    tCtx.moveTo(64, 44);
    tCtx.lineTo(84, 64);
    tCtx.lineTo(64, 84);
    tCtx.lineTo(44, 64);
    tCtx.closePath();
    tCtx.fill();

    // Corner ochre accents
    tCtx.fillStyle = '#c98834';
    for (const [cx, cy] of [
      [16, 16],
      [112, 16],
      [16, 112],
      [112, 112],
    ]) {
      tCtx.beginPath();
      tCtx.arc(cx, cy, 8, 0, Math.PI * 2);
      tCtx.fill();
    }
    tCtx.restore();
  };

  drawQuarterTile(0, 0);
  drawQuarterTile(128, 0);
  drawQuarterTile(0, 128);
  drawQuarterTile(128, 128);
  const peranakanTile = configureColorTexture(tileCanvas, 4, 6, maxAniso);

  // 2. Warm tropical timber planks
  const [woodCanvas, wCtx] = makeCanvas(256, 256);
  wCtx.fillStyle = '#a87449';
  wCtx.fillRect(0, 0, 256, 256);
  const plankColors = ['#a67146', '#9a653c', '#b07b4e', '#9e6a40'];
  for (let i = 0; i < 8; i++) {
    const y = i * 32;
    wCtx.fillStyle = plankColors[i % plankColors.length];
    wCtx.fillRect(0, y, 256, 30);
    wCtx.fillStyle = '#6f4628';
    wCtx.fillRect(0, y + 30, 256, 2);
    // Subtle grain streaks
    wCtx.fillStyle = 'rgba(72, 42, 20, 0.14)';
    wCtx.fillRect((i * 47) % 200, y + 8, 56, 3);
    wCtx.fillRect(((i * 91) % 180) + 12, y + 19, 64, 2);
  }
  const woodPlank = configureColorTexture(woodCanvas, 3, 3, maxAniso);

  // 3. Heritage George Town asphalt road
  const [roadCanvas, rCtx] = makeCanvas(256, 256);
  rCtx.fillStyle = '#5c5854';
  rCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 360; i++) {
    const x = (i * 73) % 256;
    const y = (i * 137) % 256;
    rCtx.fillStyle = i % 2 === 0 ? 'rgba(255,248,235,0.06)' : 'rgba(30,26,22,0.12)';
    rCtx.fillRect(x, y, 3, 3);
  }
  const roadAsphalt = configureColorTexture(roadCanvas, 12, 12, maxAniso);

  // 4. Soft radial contact shadow
  const [shadowCanvas, sCtx] = makeCanvas(128, 128);
  const grad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(20, 14, 10, 0.58)');
  grad.addColorStop(0.55, 'rgba(20, 14, 10, 0.25)');
  grad.addColorStop(1, 'rgba(20, 14, 10, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shadowCanvas);
  contactShadow.colorSpace = THREE.SRGBColorSpace;
  contactShadow.needsUpdate = true;

  return {
    peranakanTile,
    woodPlank,
    roadAsphalt,
    contactShadow,
    dispose: () => {
      peranakanTile.dispose();
      woodPlank.dispose();
      roadAsphalt.dispose();
      contactShadow.dispose();
    },
  };
}
