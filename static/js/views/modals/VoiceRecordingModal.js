import { createModal } from '../../ui/Modal.js';
import { gameState, PHASES } from '../../state/GameState.js';
import { createRetroButton } from '../../ui/RetroButton.js';
import { ASSET_MANIFEST } from '../../config/assetManifest.js';
import { audioSystem } from '../../game/AudioSystem.js';

const VOICE_GREETING_AUDIO_URL = ASSET_MANIFEST.audio.voiceGreeting.url;
let activeVoiceModalCleanup = null;

export function createVoiceRecordingModal() {
  if (typeof activeVoiceModalCleanup === 'function') {
    try { activeVoiceModalCleanup(); } catch {}
    activeVoiceModalCleanup = null;
  }

  const content = document.createElement('div');
  content.className = 'voice-modal-content';

  let isPlaying = false;
  let audioAvailable = false;
  let audioContext = null;
  let analyser = null;
  let mediaSource = null;
  let animationId = null;
  let isDisposed = false;

  const abortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const listenerOpts = abortCtrl ? { signal: abortCtrl.signal } : undefined;

  const audioEl = new Audio();
  audioEl.preload = 'metadata';

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 14px;">
      <h3 style="font-family: var(--font-serif); font-size: 17px; color: #fff; margin: 0; line-height: 1.4;">
        Ada pesan kecil dari kami buat kamu.
      </h3>
    </div>

    <!-- Real Audio Player Card -->
    <div style="
      position: relative;
      background: radial-gradient(circle at center, #2b1828 0%, #110914 100%);
      border: 1px solid rgba(212, 175, 55, 0.45);
      border-radius: 12px;
      padding: 16px 14px 12px;
      margin-bottom: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    ">
      <!-- Waveform Canvas -->
      <div style="
        position: relative;
        width: 100%;
        height: 72px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(212, 175, 55, 0.25);
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <canvas id="voice-waveform-canvas" width="340" height="72" style="width: 100%; height: 100%; display: block;"></canvas>
      </div>

      <!-- Honest Availability Status Notice when MP3 is not yet provided -->
      <p id="voice-availability-note" style="
        font-family: var(--font-sans);
        font-size: 12.5px;
        color: #ffbe97;
        text-align: center;
        line-height: 1.55;
        margin: 0 0 10px;
      ">
        Memeriksa rekaman suara...
      </p>

      <!-- Timeline & Time readout -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span id="voice-current-time" style="font-size: 11px; color: #f5eedc; font-family: monospace;">--:--</span>
        <input type="range" id="voice-seek-bar" min="0" max="100" value="0" disabled style="
          flex: 1;
          margin: 0 10px;
          accent-color: var(--color-gold);
          cursor: not-allowed;
          height: 4px;
          opacity: 0.45;
        ">
        <span id="voice-total-time" style="font-size: 11px; color: #a0a0b0; font-family: monospace;">--:--</span>
      </div>

      <!-- Playback & Volume Control Strip -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <button type="button" id="voice-play-pause-btn" disabled aria-label="Putar atau jeda pesan suara" style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d4af37 0%, #b89228 100%);
            border: 2px solid #000;
            color: #000;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: not-allowed;
            opacity: 0.45;
            box-shadow: 2px 2px 0 #000;
            transition: transform 0.1s, opacity 0.2s;
          ">▶</button>
          <span id="voice-status-pill" style="font-family: var(--font-sans); font-size: 11px; letter-spacing: 0.6px; color: var(--color-gold-light); font-weight: 700;">
            MENYIAPKAN AUDIO...
          </span>
        </div>

        <!-- Volume Slider -->
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 12px; color: #aaa;">🔊</span>
          <input type="range" id="voice-volume-slider" aria-label="Volume pesan suara" min="0" max="1" step="0.05" value="0.85" style="
            width: 65px;
            accent-color: var(--color-gold);
            cursor: pointer;
          ">
        </div>
      </div>
    </div>

    <!-- Personal message text -->
    <div style="text-align: center; font-family: var(--font-sans); font-size: 13px; color: #f5eedc; opacity: 0.92; line-height: 1.6; margin-bottom: 18px;">
      Terima kasih sudah meluangkan waktu untuk membuka undangan kami. 
      Semoga kamu menikmati perjalanan kecil di taman ini.
    </div>
  `;

  const canvas = content.querySelector('#voice-waveform-canvas');
  const ctx = canvas.getContext('2d');
  const playBtn = content.querySelector('#voice-play-pause-btn');
  const seekBar = content.querySelector('#voice-seek-bar');
  const currentTimeEl = content.querySelector('#voice-current-time');
  const totalTimeEl = content.querySelector('#voice-total-time');
  const volumeSlider = content.querySelector('#voice-volume-slider');
  const statusPill = content.querySelector('#voice-status-pill');
  const availabilityNote = content.querySelector('#voice-availability-note');

  const formatTime = (secs) => {
    if (!Number.isFinite(secs) || secs < 0) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const setUnavailableState = () => {
    audioAvailable = false;
    isPlaying = false;
    playBtn.disabled = true;
    playBtn.style.cursor = 'not-allowed';
    playBtn.style.opacity = '0.45';
    seekBar.disabled = true;
    seekBar.style.cursor = 'not-allowed';
    seekBar.style.opacity = '0.45';
    currentTimeEl.textContent = '--:--';
    totalTimeEl.textContent = '--:--';
    statusPill.textContent = 'BELUM TERSEDIA';
    statusPill.style.color = '#ffbe97';
    availabilityNote.textContent =
      'Pesan kecil dari kami sedang disiapkan. Sambil menunggu, yuk lanjut menjelajahi taman kami!';
  };

  const setAvailableState = () => {
    audioAvailable = true;
    playBtn.disabled = false;
    playBtn.style.cursor = 'pointer';
    playBtn.style.opacity = '1';
    seekBar.disabled = false;
    seekBar.style.cursor = 'pointer';
    seekBar.style.opacity = '1';
    currentTimeEl.textContent = formatTime(0);
    totalTimeEl.textContent = formatTime(audioEl.duration);
    statusPill.textContent = 'SIAP DIDENGARKAN';
    statusPill.style.color = 'var(--color-gold-light)';
    availabilityNote.textContent = 'Ketuk tombol putar untuk mendengarkan sapaan hangat dari Adjie & Daulika.';
  };

  const ensureAnalyser = () => {
    if (analyser || !audioAvailable) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioContext = new AudioCtx();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      mediaSource = audioContext.createMediaElementSource(audioEl);
      mediaSource.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch {
      analyser = null;
    }
  };

  audioEl.volume = parseFloat(volumeSlider.value);

  audioEl.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
      setAvailableState();
    }
  }, listenerOpts);

  audioEl.addEventListener('timeupdate', () => {
    if (!audioAvailable || !Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return;
    currentTimeEl.textContent = formatTime(audioEl.currentTime);
    seekBar.value = String((audioEl.currentTime / audioEl.duration) * 100);
  }, listenerOpts);

  audioEl.addEventListener('ended', () => {
    isPlaying = false;
    playBtn.textContent = '▶';
    statusPill.textContent = 'SELESAI DIPUTAR';
    statusPill.style.color = 'var(--color-gold-light)';
    audioSystem.resumeBgmAfterVoiceGreeting();
  }, listenerOpts);

  audioEl.addEventListener('error', () => {
    setUnavailableState();
  }, listenerOpts);

  // Check server manifest availability cleanly (zero 404 noise if file not yet uploaded)
  import('../../config/assetManifest.js')
    .then(({ fetchAssetStatus }) => fetchAssetStatus())
    .then((status) => {
      if (isDisposed) return;
      if (status && status.audio && status.audio.voiceGreeting === true) {
        audioEl.src = VOICE_GREETING_AUDIO_URL;
      } else if (!status) {
        return fetch(VOICE_GREETING_AUDIO_URL, { method: 'HEAD' }).then((resp) => {
          if (isDisposed) return;
          if (resp.ok) audioEl.src = VOICE_GREETING_AUDIO_URL;
          else setUnavailableState();
        });
      } else {
        setUnavailableState();
      }
    })
    .catch(() => {
      if (!isDisposed) setUnavailableState();
    });

  // Waveform drawing loop
  const renderWaveform = () => {
    if (isDisposed) return;
    animationId = requestAnimationFrame(renderWaveform);
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);
    if (isPlaying && analyser) {
      analyser.getByteFrequencyData(dataArray);
    }

    const barWidth = (width / bufferLength) * 1.6;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      let barHeight;
      if (isPlaying && analyser) {
        barHeight = (dataArray[i] / 255) * (height * 0.8) + 6;
      } else if (isPlaying) {
        barHeight = (Math.sin(Date.now() * 0.01 + i * 0.5) * 0.5 + 0.5) * (height * 0.55) + 8;
      } else {
        barHeight = Math.sin(Date.now() * 0.0025 + i * 0.3) * 5 + 10;
      }

      const grad = ctx.createLinearGradient(0, height / 2 - barHeight / 2, 0, height / 2 + barHeight / 2);
      grad.addColorStop(0, '#f5e6a3');
      grad.addColorStop(0.5, '#d4af37');
      grad.addColorStop(1, '#8b2500');

      ctx.fillStyle = grad;
      ctx.fillRect(x, (height - barHeight) / 2, barWidth - 2, barHeight);
      x += barWidth + 2;
    }
  };

  renderWaveform();

  const togglePlay = async () => {
    if (!audioAvailable) return;
    ensureAnalyser();
    if (audioContext && audioContext.state === 'suspended') {
      try { await audioContext.resume(); } catch {}
    }

    if (isPlaying) {
      audioEl.pause();
      isPlaying = false;
      playBtn.textContent = '▶';
      statusPill.textContent = 'DIJEDA';
      statusPill.style.color = 'var(--color-gold-light)';
    } else {
      audioSystem.pauseBgmForVoiceGreeting();
      try {
        await audioEl.play();
        isPlaying = true;
        playBtn.textContent = '⏸';
        statusPill.textContent = 'MEMUTAR PESAN...';
        statusPill.style.color = '#44ff88';
      } catch {
        audioSystem.resumeBgmAfterVoiceGreeting();
        setUnavailableState();
      }
    }
  };

  playBtn.addEventListener('click', togglePlay, listenerOpts);

  seekBar.addEventListener('input', (e) => {
    if (!audioAvailable || !Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return;
    audioEl.currentTime = (parseFloat(e.target.value) / 100) * audioEl.duration;
    currentTimeEl.textContent = formatTime(audioEl.currentTime);
  }, listenerOpts);

  volumeSlider.addEventListener('input', (e) => {
    audioEl.volume = parseFloat(e.target.value);
  }, listenerOpts);

  const cleanup = () => {
    if (isDisposed) return;
    isDisposed = true;
    isPlaying = false;
    if (activeVoiceModalCleanup === cleanup) {
      activeVoiceModalCleanup = null;
    }
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (abortCtrl) {
      try { abortCtrl.abort(); } catch {}
    }
    try {
      audioEl.pause();
      audioEl.removeAttribute('src');
      audioEl.load();
    } catch {}
    if (audioContext && audioContext.state !== 'closed') {
      try { audioContext.close(); } catch {}
    }
    audioSystem.resumeBgmAfterVoiceGreeting();
  };

  activeVoiceModalCleanup = cleanup;

  // Single prominent CTA without redundant top-right close button
  const ctaBtn = createRetroButton({
    text: '🌿 Jelajahi taman kami',
    className: 'rsvp-btn active',
    onClick: () => {
      cleanup();
      gameState.setModal(null);
      gameState.setPhase(PHASES.EXPLORATION);
    }
  });
  ctaBtn.style.width = '100%';
  content.appendChild(ctaBtn);

  return createModal({
    id: 'voice-recording-modal',
    title: '🎙️ PESAN SUARA ADJIE & DAULIKA',
    content,
    hideCloseBtn: true,
    onClose: () => {
      cleanup();
      gameState.setPhase(PHASES.EXPLORATION);
    }
  });
}
