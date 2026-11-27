/**
 * Procedural Web Audio synthesizer for rain ambience, scooter/car horn, trishaw bell,
 * coins, cash register, shutter, wok sizzle, and achievement chimes.
 * Zero external audio file dependencies.
 */
export class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private rainStarted = false;
  private volume = 0.6;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : this.volume;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public setPaused(paused: boolean): void {
    this.muted = paused;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        paused ? 0 : this.volume,
        this.ctx.currentTime,
        0.08
      );
    }
  }

  public updateRain(rainIntensity: number): void {
    if (rainIntensity <= 0.02) {
      if (this.rainGain && this.ctx) {
        this.rainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
      }
      return;
    }

    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;

    if (!this.rainStarted) {
      this.rainStarted = true;
      try {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.06 * white) / 1.06;
          data[i] = lastOut * 2.4;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1100;
        filter.Q.value = 0.7;

        this.rainGain = ctx.createGain();
        this.rainGain.gain.value = 0;

        source.connect(filter);
        filter.connect(this.rainGain);
        this.rainGain.connect(this.masterGain);
        source.start();
      } catch {
        this.rainStarted = false;
      }
    }

    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(rainIntensity * 0.28, ctx.currentTime, 0.2);
    }
  }

  public playHorn(isCar: boolean = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    const freqs = isCar ? [311.13, 392.0] : [392, 493.88];
    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isCar ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(isCar ? 0.14 : 0.11, now + 0.02);
      gain.gain.setValueAtTime(isCar ? 0.14 : 0.11, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  }

  public playTrishawBell(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    [1318.5, 1975.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.16, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.24);
    });
  }

  public playCoin(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.14, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.2);
    });
  }

  public playCashRegister(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    [987.77, 1318.51, 1760].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.045);
      gain.gain.setValueAtTime(0.13, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.25);
    });
  }

  public playCameraShutter(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    try {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.07), ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ch.length * 0.28));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.24, now);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start(now);
    } catch {
      // Ignore audio errors
    }
  }

  public playWokSizzle(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    try {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ch.length * 0.45));
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start(now);
    } catch {
      // Ignore
    }
  }

  public playQuestComplete(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.15, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.28);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  }

  public playAchievement(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    [587.33, 739.99, 880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.15, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.32);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.34);
    });
  }

  public playGentleAlert(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;
    [440, 349.23].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.12, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.2);
    });
  }

  public dispose(): void {
    try {
      this.ctx?.close();
    } catch {
      // Ignore close errors
    }
    this.ctx = null;
    this.masterGain = null;
    this.rainGain = null;
    this.rainStarted = false;
  }
}
