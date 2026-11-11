/**
 * Procedural Web Audio Sound & Atmosphere Engine for The Wedding Adventure (3D Hachi Garden).
 * Uses pure Web Audio API with zero external asset dependencies or network latency.
 * Provides ambient mountain twilight garden soundscapes, Indonesian gamelan acoustic chimes,
 * footstep strides, jump effects, and interactive UI chimes.
 */
class AudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.ambientGain = null;
    this.sfxGain = null;
    this.isInitialized = false;
    this.ambientInterval = null;
    this.lastFootstepTime = 0;

    // Load persisted mute preference
    try {
      this.isMuted = localStorage.getItem('wedding_game_muted') === 'true';
    } catch (e) {}

    // Auto-unlock Web Audio on first user gesture
    const unlockAudio = () => {
      this.init();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // Global game event listeners
    window.addEventListener('player-step', () => this.playFootstep());
    window.addEventListener('player-jump', () => this.playJump());
    window.addEventListener('player-interact', () => this.playChime(587.33));
    window.addEventListener('modal-open', () => this.playModalChord());
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Ambient channel
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // SFX channel
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.startAmbientGarden();
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioSystem initialization failed:', e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('wedding_game_muted', String(this.isMuted));
    } catch (e) {}

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.65, now + 0.1);
    }
    return this.isMuted;
  }

  startAmbientGarden() {
    if (!this.ctx || !this.ambientGain) return;

    // 1. Soft Mountain Wind Noise
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);

      const windGain = this.ctx.createGain();
      windGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(windGain);
      windGain.connect(this.ambientGain);
      whiteNoise.start();
    } catch (e) {}

    // 2. Periodic Soft Indonesian Twilight Pentatonic Chords (Pelog Scale)
    // Frequencies: 329.63Hz (E4), 392.00Hz (G4), 440.00Hz (A4), 523.25Hz (C5), 659.25Hz (E5)
    const chords = [
      [329.63, 440.00, 659.25], // E - A - E
      [392.00, 523.25, 783.99], // G - C - G
      [440.00, 523.25, 659.25], // A - C - E
      [329.63, 392.00, 587.33]  // E - G - D
    ];

    let chordIdx = 0;
    const playNextChord = () => {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playBellTone(freq, 2.8, 0.08);
        }, idx * 220);
      });
    };

    // Play first chord after 1.5s, then every 7 seconds
    setTimeout(playNextChord, 1500);
    this.ambientInterval = setInterval(playNextChord, 7200);
  }

  playBellTone(freq, duration = 2.0, maxVol = 0.1) {
    if (!this.ctx || !this.ambientGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Bell envelope (quick attack, gentle exponential decay)
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(maxVol, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  playFootstep() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const now = performance.now();
    if (now - this.lastFootstepTime < 240) return; // Stride debounce
    this.lastFootstepTime = now;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft stone foot tap
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 + Math.random() * 25, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, t);

      gain.gain.setValueAtTime(0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.07);
    } catch (e) {}
  }

  playJump() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(360, t + 0.18);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }

  playChime(freq = 523.25) {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }

  playModalChord() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      setTimeout(() => this.playChime(f), i * 90);
    });
  }

  destroy() {
    if (this.ambientInterval) clearInterval(this.ambientInterval);
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }
}

export const audioSystem = new AudioSystem();
