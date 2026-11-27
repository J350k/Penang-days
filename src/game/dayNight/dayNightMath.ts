import type { AtmosphereColors, TimeOfDayInfo } from '../types';

/** Full day-night cycle duration in seconds (~4 minutes as requested). */
export const DAY_CYCLE_DURATION_SECONDS = 240;

/** Default starting time: 08:15 AM warm Penang morning. */
export const DEFAULT_TIME_OF_DAY = (8 + 15 / 60) / 24;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = parseHex(hexA);
  const [r2, g2, b2] = parseHex(hexB);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Advances normalized time of day [0, 1) and returns updated time + day increment.
 */
export function advanceTimeOfDay(
  currentNormalizedTime: number,
  currentDayCount: number,
  dtSeconds: number
): { timeOfDay: number; dayCount: number } {
  const safeDt = Math.max(0, dtSeconds);
  const total = currentNormalizedTime + safeDt / DAY_CYCLE_DURATION_SECONDS;
  const wrappedDays = Math.floor(total);
  const nextTime = total - wrappedDays;
  return {
    timeOfDay: nextTime < 0 ? 0 : nextTime,
    dayCount: currentDayCount + wrappedDays,
  };
}

/**
 * Computes smooth streetlamp / red lantern activation factor [0, 1].
 * Turns on smoothly at dusk (17:45 - 18:45) and dims off at dawn (05:45 - 06:45).
 */
export function computeStreetLampFactor(normalizedTime: number): number {
  const hour = ((normalizedTime % 1) + 1) % 1 * 24;
  if (hour >= 18.75 || hour < 5.75) return 1;
  if (hour >= 17.75 && hour < 18.75) {
    return clamp01((hour - 17.75) / 1.0);
  }
  if (hour >= 5.75 && hour < 6.75) {
    return clamp01(1 - (hour - 5.75) / 1.0);
  }
  return 0;
}

export function formatGameTime(normalizedTime: number, dayCount: number): TimeOfDayInfo {
  const norm = ((normalizedTime % 1) + 1) % 1;
  const totalMinutes = Math.floor(norm * 24 * 60) % (24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  let periodName = '夜晚';
  if (hours >= 5 && hours < 7) periodName = '清晨';
  else if (hours >= 7 && hours < 11) periodName = '早晨';
  else if (hours >= 11 && hours < 14) periodName = '正午';
  else if (hours >= 14 && hours < 17) periodName = '午后';
  else if (hours >= 17 && hours < 19) periodName = '黄昏';
  else if (hours >= 19 && hours < 23) periodName = '入夜';
  else periodName = '深夜';

  const streetLampFactor = computeStreetLampFactor(norm);
  const isNight = hours >= 19 || hours < 6;

  return {
    normalizedTime: norm,
    dayCount,
    hours,
    minutes,
    formattedTime,
    periodName,
    isNight,
    streetLampFactor,
  };
}

interface SkyKeyframe {
  hour: number;
  skyHex: string;
  fogHex: string;
  sunHex: string;
  sunIntensity: number;
  hemiSkyHex: string;
  hemiGroundHex: string;
  hemiIntensity: number;
  indoorFillIntensity: number;
}

const KEYFRAMES: SkyKeyframe[] = [
  {
    hour: 0,
    skyHex: '#181a38',
    fogHex: '#1e2144',
    sunHex: '#92aee8',
    sunIntensity: 0.34,
    hemiSkyHex: '#373e73',
    hemiGroundHex: '#252028',
    hemiIntensity: 0.56,
    indoorFillIntensity: 0.6,
  },
  {
    hour: 5.5,
    skyHex: '#2a2d57',
    fogHex: '#433d63',
    sunHex: '#dba082',
    sunIntensity: 0.42,
    hemiSkyHex: '#63689c',
    hemiGroundHex: '#423632',
    hemiIntensity: 0.62,
    indoorFillIntensity: 0.55,
  },
  {
    hour: 6.75,
    skyHex: '#f6b88e',
    fogHex: '#f8d0ad',
    sunHex: '#ffc48a',
    sunIntensity: 1.32,
    hemiSkyHex: '#ffe0bd',
    hemiGroundHex: '#87684e',
    hemiIntensity: 0.82,
    indoorFillIntensity: 0.45,
  },
  {
    hour: 9.0,
    skyHex: '#9bd4ee',
    fogHex: '#d4ebf2',
    sunHex: '#fff3d9',
    sunIntensity: 1.75,
    hemiSkyHex: '#cdecf7',
    hemiGroundHex: '#9b7f5e',
    hemiIntensity: 0.92,
    indoorFillIntensity: 0.38,
  },
  {
    hour: 12.5,
    skyHex: '#85c9ed',
    fogHex: '#cde7f2',
    sunHex: '#fff8e8',
    sunIntensity: 1.95,
    hemiSkyHex: '#daf1fa',
    hemiGroundHex: '#a38562',
    hemiIntensity: 0.96,
    indoorFillIntensity: 0.35,
  },
  {
    hour: 16.5,
    skyHex: '#9dcce3',
    fogHex: '#e6dfd0',
    sunHex: '#ffe4b3',
    sunIntensity: 1.65,
    hemiSkyHex: '#e6eef2',
    hemiGroundHex: '#917456',
    hemiIntensity: 0.88,
    indoorFillIntensity: 0.42,
  },
  {
    hour: 18.15,
    skyHex: '#ef9378',
    fogHex: '#eb9e84',
    sunHex: '#ff9d66',
    sunIntensity: 1.12,
    hemiSkyHex: '#f5ae8c',
    hemiGroundHex: '#684c44',
    hemiIntensity: 0.72,
    indoorFillIntensity: 0.52,
  },
  {
    hour: 19.5,
    skyHex: '#25264f',
    fogHex: '#2c2e5c',
    sunHex: '#96b2eb',
    sunIntensity: 0.36,
    hemiSkyHex: '#3f457a',
    hemiGroundHex: '#29222b',
    hemiIntensity: 0.58,
    indoorFillIntensity: 0.58,
  },
  {
    hour: 24,
    skyHex: '#181a38',
    fogHex: '#1e2144',
    sunHex: '#92aee8',
    sunIntensity: 0.34,
    hemiSkyHex: '#373e73',
    hemiGroundHex: '#252028',
    hemiIntensity: 0.56,
    indoorFillIntensity: 0.6,
  },
];

export function computeAtmosphereState(normalizedTime: number): AtmosphereColors {
  const norm = ((normalizedTime % 1) + 1) % 1;
  const hour = norm * 24;

  let prev = KEYFRAMES[0];
  let next = KEYFRAMES[KEYFRAMES.length - 1];
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (hour >= KEYFRAMES[i].hour && hour <= KEYFRAMES[i + 1].hour) {
      prev = KEYFRAMES[i];
      next = KEYFRAMES[i + 1];
      break;
    }
  }

  const span = Math.max(0.0001, next.hour - prev.hour);
  const t = clamp01((hour - prev.hour) / span);

  // Sun arc from 06:00 (0 rad) -> 12:00 (PI/2) -> 18:00 (PI); at night keep moon high enough for soft shadows/depth
  const isDaylight = hour >= 6 && hour <= 18;
  const sunElevationRad = isDaylight
    ? Math.max(0.18, Math.sin(((hour - 6) / 12) * Math.PI) * 1.15)
    : 0.65;
  const sunAzimuthRad = isDaylight
    ? lerp(-1.25, 1.25, (hour - 6) / 12)
    : 0.7;

  return {
    skyHex: lerpHex(prev.skyHex, next.skyHex, t),
    fogHex: lerpHex(prev.fogHex, next.fogHex, t),
    sunHex: lerpHex(prev.sunHex, next.sunHex, t),
    sunIntensity: lerp(prev.sunIntensity, next.sunIntensity, t),
    sunElevationRad,
    sunAzimuthRad,
    hemiSkyHex: lerpHex(prev.hemiSkyHex, next.hemiSkyHex, t),
    hemiGroundHex: lerpHex(prev.hemiGroundHex, next.hemiGroundHex, t),
    hemiIntensity: lerp(prev.hemiIntensity, next.hemiIntensity, t),
    indoorFillIntensity: lerp(prev.indoorFillIntensity, next.indoorFillIntensity, t),
    streetLampFactor: computeStreetLampFactor(norm),
  };
}
