import * as THREE from 'three';
import type { QualityLevel } from '../types';

export type OutlineCategory = 'building' | 'character' | 'vehicle' | 'npc';

let sharedGradientMap: THREE.DataTexture | null = null;
let sharedOutlineMat: THREE.MeshBasicMaterial | null = null;

/**
 * 3-step toon gradient texture with NearestFilter for crisp warm cel-shading.
 */
export function getToonGradientMap(): THREE.DataTexture {
  if (sharedGradientMap) return sharedGradientMap;
  const data = new Uint8Array([
    105, 105, 105, 255,
    182, 182, 182, 255,
    255, 255, 255, 255,
  ]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  sharedGradientMap = tex;
  return tex;
}

export function getSharedOutlineMaterial(): THREE.MeshBasicMaterial {
  if (sharedOutlineMat) return sharedOutlineMat;
  sharedOutlineMat = new THREE.MeshBasicMaterial({
    color: 0x5a3e36,
    side: THREE.BackSide,
  });
  return sharedOutlineMat;
}

export interface ToonMatOptions {
  color?: THREE.ColorRepresentation;
  map?: THREE.Texture | null;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  depthWrite?: boolean;
}

export function createToonMaterial(opts: ToonMatOptions = {}): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color: opts.color ?? 0xffffff,
    map: opts.map ?? null,
    gradientMap: getToonGradientMap(),
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true,
  });
}

/**
 * Inverted-hull dark-brown outline (#5A3E36, BackSide, ~1.02x scale).
 * Tagged with outlineCategory so Quality (low/medium/high) can toggle visibility dynamically.
 */
export function attachOutline(
  mesh: THREE.Mesh,
  category: OutlineCategory,
  scaleFactor = 1.025
): THREE.Mesh {
  const outline = new THREE.Mesh(mesh.geometry, getSharedOutlineMaterial());
  outline.scale.setScalar(scaleFactor);
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.userData.isOutline = true;
  outline.userData.outlineCategory = category;
  mesh.add(outline);
  return outline;
}

/**
 * Updates outline visibility across the scene graph according to quality setting:
 * - low: no outlines
 * - medium: buildings + player character only
 * - high: all outlines (buildings, character, vehicles, named NPCs)
 */
export function applyOutlineQualityPolicy(root: THREE.Object3D, quality: QualityLevel): void {
  root.traverse((obj) => {
    if (!obj.userData?.isOutline) return;
    const cat = obj.userData.outlineCategory as OutlineCategory | undefined;
    if (quality === 'low') {
      obj.visible = false;
    } else if (quality === 'medium') {
      obj.visible = cat === 'building' || cat === 'character';
    } else {
      obj.visible = true;
    }
  });
}
