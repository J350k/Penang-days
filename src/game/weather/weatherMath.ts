export interface ShowerWindow {
  startHour: number;
  endHour: number;
}

/**
 * Deterministic hash per dayCount -> generates 0, 1, or 2 tropical rain showers.
 */
export function scheduleDailyShowers(dayCount: number): ShowerWindow[] {
  const seed = Math.abs((dayCount * 2654435761) >>> 0);
  const count = seed % 3; // 0, 1, or 2 showers
  if (count === 0) return [];

  const windows: ShowerWindow[] = [];
  // Morning/early afternoon shower
  const h1 = 9 + ((seed >> 3) % 5); // 09:00..13:00
  const d1 = 1.2 + (((seed >> 7) % 10) / 10) * 0.8; // 1.2h..2.0h
  windows.push({ startHour: h1, endHour: h1 + d1 });

  if (count === 2) {
    const h2 = 15 + ((seed >> 11) % 5); // 15:00..19:00
    const d2 = 1.0 + (((seed >> 15) % 10) / 10) * 1.1;
    windows.push({ startHour: h2, endHour: h2 + d2 });
  }

  return windows;
}

export function evaluateRainAtTime(
  normalizedTime: number,
  dayCount: number,
  windows: ShowerWindow[] = scheduleDailyShowers(dayCount)
): { isRaining: boolean; rainIntensity: number } {
  const hour = (((normalizedTime % 1) + 1) % 1) * 24;
  const fadeHours = 0.25; // ~2.5 real seconds ramp

  let maxIntensity = 0;
  for (const w of windows) {
    if (hour >= w.startHour && hour <= w.endHour) {
      const inFade = Math.min(1, (hour - w.startHour) / fadeHours);
      const outFade = Math.min(1, (w.endHour - hour) / fadeHours);
      const intensity = Math.max(0, Math.min(inFade, outFade));
      if (intensity > maxIntensity) maxIntensity = intensity;
    }
  }

  return {
    isRaining: maxIntensity > 0.05,
    rainIntensity: maxIntensity,
  };
}

export function updateWetFactor(currentWet: number, isRaining: boolean, dt: number): number {
  const target = isRaining ? 1 : 0;
  const rate = isRaining ? 0.22 : 0.04;
  const next = currentWet + (target - currentWet) * Math.min(1, rate * dt);
  return Math.max(0, Math.min(1, next));
}
