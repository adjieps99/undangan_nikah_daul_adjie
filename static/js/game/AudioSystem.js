import { ASSET_MANIFEST, getTrackFilename, fetchAssetStatus } from '../config/assetManifest.js';

/**
 * Pure helper to determine whether selecting a track in the shared audio manager
 * should preserve playback seamlessly vs reload the audio source.
 */
export function shouldPreservePlaybackOnSelect({
  currentIndex,
  targetIndex,
  restartIfSame = false,
  hasLoadedSource = false,
  availability = 'unknown'
}) {
  if (restartIfSame) return false;
  if (currentIndex !== targetIndex) return false;
  return hasLoadedSource || availability === 'available';
}

/**
 * AudioSystem — Unified Sound, Ambient & Shared Music Manager
 * - Single shared HTML5 Audio BGM channel for the entire app (Cover -> Avatar -> Opening -> Garden -> Main Hall)
 * - Web Audio API ambient wind/chimes (yields gracefully when BGM track is playing) & UI/footstep SFX
 * - Zero duplicate players inside ListeningStationModal; mute state is global and persistent
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

    // Shared Music Player Channel State
    this.playlist = ASSET_MANIFEST.audio.playlist || [];
    this.availabilityCache = new Map();
    this.bgmAudio = null;
    this._bgmProbeToken = 0;
    this._hasAttemptedOpeningBgm = false;
    this._awaitingGestureResume = false;
    this._userPausedMusic = false;
    this._musicListeners = new Set();

    const defaultIdx = Math.max(0, this.playlist.findIndex((t) => t.isDefault));
    this.musicState = {
      currentTrackIndex: defaultIdx,
      track: this.playlist[defaultIdx] || null,
      isPlaying: false,
      availability: 'unknown', // 'unknown' | 'checking' | 'available' | 'missing'
      missingFilename: '',
      trackAvailability: {},
      currentTime: 0,
      duration: 0,
      volume: 0.78,
      isMuted: false
    };

    if (typeof window !== 'undefined') {
      try {
        this.isMuted = localStorage.getItem('wedding_game_muted') === 'true';
        this.musicState.isMuted = this.isMuted;
      } catch (e) {}

      this._initSharedBgmElement();

      // Auto-unlock Web Audio on first user gesture (and retry paused BGM if browser blocked async play)
      const unlockAudio = () => {
        this.init();
        if (this._awaitingGestureResume && this.bgmAudio && this.bgmAudio.paused && !this._userPausedMusic) {
          this._awaitingGestureResume = false;
          this.bgmAudio.play().catch(() => {});
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };

      const resumeBlockedBgm = () => {
        if (this._awaitingGestureResume && this.bgmAudio && this.bgmAudio.paused && !this._userPausedMusic) {
          this._awaitingGestureResume = false;
          this.bgmAudio.play().catch(() => {
            this._awaitingGestureResume = true;
          });
        }
      };

      window.addEventListener('click', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
      window.addEventListener('keydown', unlockAudio);
      window.addEventListener('pointerdown', resumeBlockedBgm);

      // Global game event listeners
      window.addEventListener('player-step', () => this.playFootstep());
      window.addEventListener('player-jump', () => this.playJump());
      window.addEventListener('player-interact', () => this.playChime(587.33));
      window.addEventListener('modal-open', () => this.playModalChord());
    }
  }

  _initSharedBgmElement() {
    if (typeof Audio === 'undefined') return;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = this.musicState.volume;
    audio.muted = this.isMuted;

    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        this.musicState.duration = audio.duration;
        this.musicState.availability = 'available';
        this.musicState.missingFilename = '';
        this._emitMusicUpdate();
      }
    });

    audio.addEventListener('timeupdate', () => {
      this.musicState.currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        this.musicState.duration = audio.duration;
      }
      this._emitMusicUpdate();
    });

    audio.addEventListener('play', () => {
      this._awaitingGestureResume = false;
      this.musicState.isPlaying = true;
      this.musicState.availability = 'available';
      this._emitMusicUpdate();
    });

    audio.addEventListener('pause', () => {
      this.musicState.isPlaying = false;
      this._emitMusicUpdate();
    });

    audio.addEventListener('ended', () => {
      this.nextTrack({ autoPlay: true });
    });

    audio.addEventListener('error', () => {
      const track = this.musicState.track;
      const missingName = getTrackFilename(track);
      if (track && track.audioUrl) {
        this.availabilityCache.set(track.audioUrl, false);
      }
      if (missingName) {
        this.musicState.trackAvailability = {
          ...this.musicState.trackAvailability,
          [missingName]: false
        };
      }
      this.musicState.isPlaying = false;
      this.musicState.availability = 'missing';
      this.musicState.missingFilename = missingName;
      this._emitMusicUpdate();
    });

    this.bgmAudio = audio;
  }

  _emitMusicUpdate() {
    const snapshot = this.getMusicState();
    this._musicListeners.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (e) {}
    });
  }

  getMusicState() {
    return {
      ...this.musicState,
      isMuted: this.isMuted,
      playlist: this.playlist
    };
  }

  subscribeMusic(cb) {
    if (typeof cb !== 'function') return () => {};
    this._musicListeners.add(cb);
    cb(this.getMusicState());
    return () => {
      this._musicListeners.delete(cb);
    };
  }

  async refreshTrackAvailability({ force = false } = {}) {
    if (typeof fetch !== 'function') return this.musicState.trackAvailability;
    try {
      const status = await fetchAssetStatus(force);
      const tracksMap = status && status.audio && status.audio.tracks ? status.audio.tracks : null;
      if (tracksMap) {
        this.musicState.trackAvailability = { ...tracksMap };
        for (const t of this.playlist) {
          const fname = getTrackFilename(t);
          if (t.audioUrl && fname in tracksMap) {
            this.availabilityCache.set(t.audioUrl, Boolean(tracksMap[fname]));
          }
        }
        this._emitMusicUpdate();
      }
    } catch {}
    return this.musicState.trackAvailability;
  }

  async _probeTrackUrl(url, filename = '', forceRefresh = false) {
    if (!url || typeof fetch !== 'function') return false;
    if (!forceRefresh && this.availabilityCache.get(url) === true) {
      return true;
    }
    try {
      const status = await fetchAssetStatus(forceRefresh);
      const fname = filename || String(url).split('/').pop() || '';
      if (status && status.audio && status.audio.tracks && fname in status.audio.tracks) {
        const ok = Boolean(status.audio.tracks[fname]);
        this.availabilityCache.set(url, ok);
        this.musicState.trackAvailability = {
          ...this.musicState.trackAvailability,
          [fname]: ok
        };
        return ok;
      }
      const resp = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      const ok = Boolean(resp && resp.ok);
      this.availabilityCache.set(url, ok);
      if (fname) {
        this.musicState.trackAvailability = {
          ...this.musicState.trackAvailability,
          [fname]: ok
        };
      }
      return ok;
    } catch {
      this.availabilityCache.set(url, false);
      return false;
    }
  }

  _findPreferredAvailableTrackIndex() {
    const map = this.musicState.trackAvailability || {};
    const defaultIdx = Math.max(0, this.playlist.findIndex((t) => t.isDefault));
    const defaultTrack = this.playlist[defaultIdx];
    if (defaultTrack && map[getTrackFilename(defaultTrack)]) {
      return defaultIdx;
    }
    const firstAvailable = this.playlist.findIndex((t) => Boolean(map[getTrackFilename(t)]));
    return firstAvailable >= 0 ? firstAvailable : defaultIdx;
  }

  /**
   * Called strictly inside a valid user interaction gesture (Cover envelope open / enter CTA).
   * Prefers track 0 (Langit Merah Muda — Afgan), or falls back seamlessly to the first
   * uploaded track (e.g. 02_rona_merah_langit.mp3) if track 0 hasn't been uploaded yet.
   */
  async ensureOpeningTrackPlaying() {
    this.init();
    if (this._userPausedMusic) return;
    if (this.musicState.isPlaying) {
      this._hasAttemptedOpeningBgm = true;
      return;
    }
    if (this._awaitingGestureResume && this.bgmAudio && this.bgmAudio.getAttribute('src')) {
      try {
        await this.bgmAudio.play();
        this._awaitingGestureResume = false;
        this._hasAttemptedOpeningBgm = true;
        return;
      } catch {}
    }

    await this.refreshTrackAvailability({ force: !this._hasAttemptedOpeningBgm });
    const targetIdx = this._findPreferredAvailableTrackIndex();
    const targetTrack = this.playlist[targetIdx];
    const hasUploadedTarget = Boolean(
      targetTrack && this.musicState.trackAvailability[getTrackFilename(targetTrack)]
    );

    if (!hasUploadedTarget) {
      this._hasAttemptedOpeningBgm = true;
      return;
    }

    this._hasAttemptedOpeningBgm = true;
    await this.selectTrack(targetIdx, { autoPlay: true, restartIfSame: false });
  }

  /**
   * Called when Listening Station modal opens.
   * Refreshes file status from server, preserves ongoing playback seamlessly without restarting
   * an active track, and auto-selects the first uploaded track if default track 1 is missing.
   */
  async syncOnListeningStationOpen() {
    await this.refreshTrackAvailability({ force: true });

    const curTrack = this.playlist[this.musicState.currentTrackIndex];
    const curFname = getTrackFilename(curTrack);
    const curAvailable = Boolean(curFname && this.musicState.trackAvailability[curFname]);

    if (this.musicState.isPlaying) {
      this._emitMusicUpdate();
      return;
    }

    if (!curAvailable) {
      const preferredIdx = this._findPreferredAvailableTrackIndex();
      await this.selectTrack(preferredIdx, {
        autoPlay: false,
        restartIfSame: false
      });
      return;
    }

    if (this.musicState.availability === 'unknown' || this.musicState.availability === 'missing') {
      await this.selectTrack(this.musicState.currentTrackIndex, {
        autoPlay: false,
        restartIfSame: false
      });
    } else {
      this._emitMusicUpdate();
    }
  }

  async selectTrack(index, { autoPlay = true, restartIfSame = false } = {}) {
    if (!this.playlist.length) return;
    const targetIdx = ((index % this.playlist.length) + this.playlist.length) % this.playlist.length;
    const track = this.playlist[targetIdx];
    const hasLoadedSource = Boolean(this.bgmAudio && this.bgmAudio.getAttribute('src'));

    if (
      shouldPreservePlaybackOnSelect({
        currentIndex: this.musicState.currentTrackIndex,
        targetIndex: targetIdx,
        restartIfSame,
        hasLoadedSource,
        availability: this.musicState.availability
      })
    ) {
      if (autoPlay && this.bgmAudio && this.bgmAudio.paused && this.musicState.availability === 'available') {
        this._userPausedMusic = false;
        try {
          await this.bgmAudio.play();
        } catch {
          this._awaitingGestureResume = true;
        }
      }
      this._emitMusicUpdate();
      return;
    }

    const token = ++this._bgmProbeToken;
    this.musicState.currentTrackIndex = targetIdx;
    this.musicState.track = track;
    this.musicState.currentTime = 0;
    this.musicState.duration = 0;
    this.musicState.availability = 'checking';
    this.musicState.missingFilename = getTrackFilename(track);

    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
    this.musicState.isPlaying = false;
    this._emitMusicUpdate();

    if (!track || !track.audioUrl) {
      this.musicState.availability = 'missing';
      this._emitMusicUpdate();
      return;
    }

    const available = await this._probeTrackUrl(track.audioUrl, getTrackFilename(track), true);
    if (token !== this._bgmProbeToken) return;

    if (!available) {
      this.musicState.availability = 'missing';
      this.musicState.missingFilename = getTrackFilename(track);
      this._emitMusicUpdate();
      return;
    }

    this.musicState.availability = 'available';
    this.musicState.missingFilename = '';

    if (this.bgmAudio) {
      if (this.bgmAudio.getAttribute('src') !== track.audioUrl) {
        this.bgmAudio.src = track.audioUrl;
      } else if (restartIfSame) {
        this.bgmAudio.currentTime = 0;
      }
      this.bgmAudio.muted = this.isMuted;

      if (autoPlay) {
        this._userPausedMusic = false;
        try {
          await this.bgmAudio.play();
          this._awaitingGestureResume = false;
        } catch {
          // Browser blocked autoplay after async probe; resume on next user interaction
          this._awaitingGestureResume = true;
        }
      }
    }

    this._emitMusicUpdate();
  }

  async togglePlayPause() {
    if (!this.bgmAudio) return false;
    if (this.musicState.availability === 'unknown' || this.musicState.availability === 'missing') {
      await this.selectTrack(this.musicState.currentTrackIndex, { autoPlay: true, restartIfSame: false });
      return this.musicState.isPlaying;
    }
    if (this.musicState.availability !== 'available') {
      return false;
    }

    if (!this.bgmAudio.paused) {
      this._userPausedMusic = true;
      this.bgmAudio.pause();
      return false;
    }

    this._userPausedMusic = false;
    try {
      await this.bgmAudio.play();
      this._awaitingGestureResume = false;
      return true;
    } catch {
      this._awaitingGestureResume = true;
      return false;
    }
  }

  nextTrack({ autoPlay = true } = {}) {
    return this.selectTrack(this.musicState.currentTrackIndex + 1, {
      autoPlay,
      restartIfSame: true
    });
  }

  prevTrack({ autoPlay = true } = {}) {
    return this.selectTrack(this.musicState.currentTrackIndex - 1, {
      autoPlay,
      restartIfSame: true
    });
  }

  seekMusic(seconds) {
    if (!this.bgmAudio || this.musicState.availability !== 'available') return;
    if (!Number.isFinite(this.bgmAudio.duration) || this.bgmAudio.duration <= 0) return;
    const clamped = Math.max(0, Math.min(this.bgmAudio.duration, Number(seconds) || 0));
    this.bgmAudio.currentTime = clamped;
    this.musicState.currentTime = clamped;
    this._emitMusicUpdate();
  }

  setMusicVolume(volume) {
    const clamped = Math.max(0, Math.min(1, Number(volume)));
    this.musicState.volume = Number.isFinite(clamped) ? clamped : 0.78;
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.musicState.volume;
    }
    this._emitMusicUpdate();
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
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
    this.musicState.isMuted = this.isMuted;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('wedding_game_muted', String(this.isMuted));
      } catch (e) {}
    }

    if (this.bgmAudio) {
      this.bgmAudio.muted = this.isMuted;
    }

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.65, now + 0.1);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('audio-mute-changed', { detail: { isMuted: this.isMuted } }));
    }
    this._emitMusicUpdate();
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
      windGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(windGain);
      windGain.connect(this.ambientGain);
      whiteNoise.start();
    } catch (e) {}

    // 2. Soft Twilight Pentatonic Chords (ONLY when real MP3 music track is NOT playing)
    const chords = [
      [329.63, 440.00, 659.25],
      [392.00, 523.25, 783.99],
      [440.00, 523.25, 659.25],
      [329.63, 392.00, 587.33]
    ];

    let chordIdx = 0;
    const playNextChord = () => {
      if (this.isMuted || this.musicState.isPlaying || !this.ctx || this.ctx.state !== 'running') return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.musicState.isPlaying && !this.isMuted) {
            this.playBellTone(freq, 2.8, 0.06);
          }
        }, idx * 220);
      });
    };

    setTimeout(playNextChord, 2200);
    this.ambientInterval = setInterval(playNextChord, 7800);
  }

  playBellTone(freq, duration = 2.0, maxVol = 0.1) {
    if (!this.ctx || !this.ambientGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

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
    if (now - this.lastFootstepTime < 240) return;
    this.lastFootstepTime = now;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

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
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
      } catch {}
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }
}

export const audioSystem = new AudioSystem();
export { AudioSystem };
