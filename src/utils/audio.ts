/**
 * Procedural Web Audio API sound synthesizer for realistic book page turns,
 * paper rustling, hardcover opening, and closing thud effects.
 * 100% zero-dependency, zero-404 audio synthesis.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.7;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Realistic page flip sound:
   * Combines high-pass filtered white noise for paper friction and a gentle pitch swoosh.
   */
  public playPageFlip(speed: 'slow' | 'normal' | 'fast' = 'normal') {
    if (!this.enabled || this.volume <= 0) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const duration = speed === 'fast' ? 0.22 : speed === 'slow' ? 0.45 : 0.32;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Procedural paper friction noise with flutter envelope
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown/pink noise filter
        const brown = (lastOut + (0.02 * white)) / 1.02;
        lastOut = brown;
        // Flutter modulation
        const progress = i / bufferSize;
        const flutter = Math.sin(progress * Math.PI * 8) * 0.15;
        data[i] = (white * 0.5 + brown * 0.5 + flutter);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter to simulate paper frequency
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + duration);
      filter.Q.setValueAtTime(2.2, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, ctx.currentTime + duration * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  /**
   * Realistic book opening sound:
   * Heavy cover lifting with spine flex & soft page flutter
   */
  public playBookOpen() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Low spine stretch creak (sine sweep through high Q resonant filter)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.4);

      oscGain.gain.setValueAtTime(0.001, now);
      oscGain.gain.linearRampToValueAtTime(0.22 * this.volume, now + 0.08);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);

      // 2. Delayed page fanning flutter
      setTimeout(() => {
        this.playPageFlip('slow');
      }, 90);
    } catch {}
  }

  /**
   * Realistic hardcover book closing thud:
   * Deep acoustic impact of thick leather/cardboard closing shut.
   */
  public playBookClose() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Deep thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

      gain.gain.setValueAtTime(0.4 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);

      // Paper snap slap
      const snapDur = 0.08;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * snapDur, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
      }
      const snapSource = ctx.createBufferSource();
      snapSource.buffer = buffer;
      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = 'lowpass';
      snapFilter.frequency.setValueAtTime(1200, now);
      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.25 * this.volume, now);
      snapGain.gain.linearRampToValueAtTime(0.001, now + snapDur);

      snapSource.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapSource.start(now);
    } catch {}
  }

  /**
   * Bookmark ribbon toggle or click sound
   */
  public playBookmark() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
      gain.gain.setValueAtTime(0.08 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
