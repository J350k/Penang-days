import * as THREE from 'three';
import { computeAtmosphereState } from './dayNightMath';

const _skyColor = new THREE.Color();
const _fogColor = new THREE.Color();
const _rainDarkColor = new THREE.Color(0x4c5d75);
const _sunColor = new THREE.Color();
const _hemiSky = new THREE.Color();
const _hemiGround = new THREE.Color();
const _roadDayColor = new THREE.Color(0x8f8c8c);
const _roadNightColor = new THREE.Color(0x3a3b4f);
const _roadColor = new THREE.Color();

export interface DayNightTargets {
  scene: THREE.Scene;
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  indoorFillLight: THREE.PointLight;
  streetLampBulbs: THREE.MeshToonMaterial[];
  streetLanternMat: THREE.MeshToonMaterial;
  stallLanternMats: THREE.MeshToonMaterial[];
  windowGlowMats: THREE.MeshToonMaterial[];
  homeEmissiveMaterials: THREE.MeshToonMaterial[];
  nightPointLights: THREE.PointLight[];
  roadMaterial: THREE.MeshToonMaterial;
  neonReflectionMats: THREE.MeshBasicMaterial[];
  neonSignMaterials: THREE.MeshBasicMaterial[];
}

export class DayNightSystem {
  private targets: DayNightTargets;

  constructor(targets: DayNightTargets) {
    this.targets = targets;
  }

  public update(
    normalizedTime: number,
    playerX: number,
    playerZ: number,
    rainIntensity: number = 0,
    wetFactor: number = 0
  ): void {
    const atmo = computeAtmosphereState(normalizedTime);

    _skyColor.set(atmo.skyHex);
    _fogColor.set(atmo.fogHex);
    if (rainIntensity > 0.01) {
      _skyColor.lerp(_rainDarkColor, rainIntensity * 0.55);
      _fogColor.lerp(_rainDarkColor, rainIntensity * 0.58);
    }

    _sunColor.set(atmo.sunHex);
    _hemiSky.set(atmo.hemiSkyHex);
    _hemiGround.set(atmo.hemiGroundHex);

    this.targets.scene.background = _skyColor.clone();
    if (this.targets.scene.fog instanceof THREE.FogExp2) {
      this.targets.scene.fog.color.copy(_fogColor);
    }

    const sunRadius = 42;
    const cosEl = Math.cos(atmo.sunElevationRad);
    const sx = Math.sin(atmo.sunAzimuthRad) * cosEl * sunRadius;
    const sy = Math.sin(atmo.sunElevationRad) * sunRadius;
    const sz = Math.cos(atmo.sunAzimuthRad) * cosEl * sunRadius;

    this.targets.sunLight.position.set(playerX + sx, sy, playerZ + sz);
    this.targets.sunLight.target.position.set(playerX, 0, playerZ);
    this.targets.sunLight.target.updateMatrixWorld();
    this.targets.sunLight.color.copy(_sunColor);
    this.targets.sunLight.intensity = atmo.sunIntensity * (1 - rainIntensity * 0.42);

    this.targets.hemiLight.color.copy(_hemiSky);
    this.targets.hemiLight.groundColor.copy(_hemiGround);
    this.targets.hemiLight.intensity = atmo.hemiIntensity * (1 - rainIntensity * 0.22);

    this.targets.indoorFillLight.intensity = atmo.indoorFillIntensity;

    const lampFactor = Math.max(atmo.streetLampFactor, rainIntensity * 0.6);

    // Night road darkens & wet rain deepens the surface for neon reflections
    const roadDarken = Math.min(1, lampFactor * 0.82 + wetFactor * 0.35);
    _roadColor.copy(_roadDayColor).lerp(_roadNightColor, roadDarken);
    this.targets.roadMaterial.color.copy(_roadColor);

    // Neon wet-road vertical reflection strips
    const reflectionOpacity = Math.min(0.88, lampFactor * (0.28 + wetFactor * 0.55) + wetFactor * lampFactor * 0.12);
    for (const rMat of this.targets.neonReflectionMats) {
      rMat.opacity = reflectionOpacity;
    }

    // Neon shop sign accents brighten at dusk/night while remaining crisp during day
    for (const nMat of this.targets.neonSignMaterials) {
      nMat.opacity = 0.72 + lampFactor * 0.28;
    }

    for (const bulb of this.targets.streetLampBulbs) {
      bulb.emissiveIntensity = 0.08 + lampFactor * 1.45;
    }
    this.targets.streetLanternMat.emissiveIntensity = 0.14 + lampFactor * 1.15;
    for (const mat of this.targets.stallLanternMats) {
      mat.emissiveIntensity = 0.2 + lampFactor * 1.15;
    }
    for (const wMat of this.targets.windowGlowMats) {
      wMat.emissiveIntensity = 0.04 + lampFactor * 0.95;
    }
    for (const mat of this.targets.homeEmissiveMaterials) {
      mat.emissiveIntensity = 0.1 + lampFactor * 0.9;
    }
    for (const pt of this.targets.nightPointLights) {
      pt.intensity = lampFactor * 5.2;
    }
  }
}
