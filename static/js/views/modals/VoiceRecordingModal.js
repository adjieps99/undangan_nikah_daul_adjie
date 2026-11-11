import { createModal } from '../../ui/Modal.js';
import { gameState, PHASES } from '../../state/GameState.js';
import { createRetroButton } from '../../ui/RetroButton.js';
import { audioSystem } from '../../game/AudioSystem.js';

export function createVoiceRecordingModal() {
  const content = document.createElement('div');
  content.className = 'voice-modal-content';

  let isPlaying = false;
  let audioContext = null;
  let analyser = null;
  let animationId = null;
  let duration = 48.0; // Simulated seconds duration for voice greeting
  let currentTime = 0.0;
  let progressInterval = null;
  let oscillator = null;
  let gainNode = null;

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 12px;">
      <span style="font-size: 10px; letter-spacing: 2px; color: var(--color-gold); font-weight: bold;">
        SEKAPUR SIRIH ADJIE &amp; DAULIKA
      </span>
      <h3 style="font-size: 15px; color: #fff; margin: 4px 0 2px;">
        Ada pesan kecil dari kami buat kamu.
      </h3>
      <p style="font-size: 11px; color: #ffbe97; font-style: italic; margin-top: 2px;">
        "Pesan suara kami sedang disiapkan."
      </p>
    </div>

    <!-- Audio Player Glassmorphic Card -->
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

      <!-- Timeline & Time readout -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span id="voice-current-time" style="font-size: 10px; color: #f5eedc; font-family: monospace;">00:00</span>
        <input type="range" id="voice-seek-bar" min="0" max="100" value="0" style="
          flex: 1;
          margin: 0 10px;
          accent-color: var(--color-gold);
          cursor: pointer;
          height: 4px;
        ">
        <span id="voice-total-time" style="font-size: 10px; color: #a0a0b0; font-family: monospace;">00:48</span>
      </div>

      <!-- Playback & Volume Control Strip -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <button type="button" id="voice-play-pause-btn" style="
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d4af37 0%, #b89228 100%);
            border: 2px solid #000;
            color: #000;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 2px 2px 0 #000;
            transition: transform 0.1s;
          ">▶</button>
          <span id="voice-status-pill" style="font-size: 9px; letter-spacing: 1px; color: var(--color-gold-light); font-weight: bold;">
            SIAP DIDENGARKAN
          </span>
        </div>

        <!-- Volume Slider -->
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 12px; color: #aaa;">🔊</span>
          <input type="range" id="voice-volume-slider" min="0" max="1" step="0.05" value="0.8" style="
            width: 65px;
            accent-color: var(--color-gold);
            cursor: pointer;
          ">
        </div>
      </div>
    </div>

    <!-- Personal message text -->
    <div style="text-align: center; font-size: 11px; opacity: 0.9; line-height: 1.5; margin-bottom: 16px;">
      Terima kasih sudah meluangkan waktu berharga untuk membuka undangan kami. 
      Langkah demi langkah di taman ini adalah cerminan rasa syukur kami atas kehadiranmu.
    </div>
  `;

  const canvas = content.querySelector('#voice-waveform-canvas');
  const ctx = canvas.getContext('2d');
  const playBtn = content.querySelector('#voice-play-pause-btn');
  const seekBar = content.querySelector('#voice-seek-bar');
  const currentTimeEl = content.querySelector('#voice-current-time');
  const volumeSlider = content.querySelector('#voice-volume-slider');
  const statusPill = content.querySelector('#voice-status-pill');

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Web Audio Context setup
  const initAudio = () => {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        gainNode = audioContext.createGain();
        gainNode.gain.value = parseFloat(volumeSlider.value);
        gainNode.connect(analyser);
        analyser.connect(audioContext.destination);
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  };

  const playSynthesizedVoiceTone = () => {
    if (!audioContext) return;
    try {
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }
      oscillator = audioContext.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime); // E4 warm note
      // Modulate frequency gently like speech inflection
      oscillator.frequency.linearRampToValueAtTime(392.00, audioContext.currentTime + 1.2);
      oscillator.frequency.linearRampToValueAtTime(329.63, audioContext.currentTime + 2.5);
      oscillator.connect(gainNode);
      oscillator.start();
    } catch (e) {}
  };

  const stopSynthesizedVoiceTone = () => {
    if (oscillator) {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (e) {}
      oscillator = null;
    }
  };

  // Waveform drawing loop
  const renderWaveform = () => {
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
      if (isPlaying) {
        barHeight = (dataArray[i] / 255) * (height * 0.8) + 6;
      } else {
        // Subtle resting idle wave
        barHeight = Math.sin(Date.now() * 0.003 + i * 0.3) * 6 + 10;
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

  // Play / Pause toggle
  const togglePlay = () => {
    initAudio();
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    statusPill.textContent = isPlaying ? 'MEMUTAR REKAMAN...' : 'DIJEDA';
    statusPill.style.color = isPlaying ? '#44ff88' : 'var(--color-gold-light)';

    if (isPlaying) {
      playSynthesizedVoiceTone();
      progressInterval = setInterval(() => {
        currentTime += 0.5;
        if (currentTime >= duration) {
          currentTime = 0;
          togglePlay();
        }
        seekBar.value = (currentTime / duration) * 100;
        currentTimeEl.textContent = formatTime(currentTime);
      }, 500);
    } else {
      stopSynthesizedVoiceTone();
      clearInterval(progressInterval);
    }
  };

  playBtn.addEventListener('click', togglePlay);

  seekBar.addEventListener('input', (e) => {
    currentTime = (parseFloat(e.target.value) / 100) * duration;
    currentTimeEl.textContent = formatTime(currentTime);
  });

  volumeSlider.addEventListener('input', (e) => {
    if (gainNode) {
      gainNode.gain.value = parseFloat(e.target.value);
    }
  });

  // Action Button: Single prominent CTA "Jelajahi Taman"
  const ctaBtn = createRetroButton({
    text: '🌿 JELAJAHI TAMAN',
    className: 'rsvp-btn active',
    onClick: () => {
      cleanup();
      gameState.setModal(null);
      gameState.setPhase(PHASES.EXPLORATION);
    }
  });
  ctaBtn.style.width = '100%';
  content.appendChild(ctaBtn);

  const cleanup = () => {
    if (animationId) cancelAnimationFrame(animationId);
    if (progressInterval) clearInterval(progressInterval);
    stopSynthesizedVoiceTone();
    if (audioContext && audioContext.state !== 'closed') {
      try { audioContext.close(); } catch (e) {}
    }
  };

  return createModal({
    id: 'voice-recording-modal',
    title: '🎙️ REKAMAN SUARA ADJIE & DAULIKA',
    content: content,
    hideCloseBtn: true, // No redundant close button!
    onClose: () => {
      cleanup();
      gameState.setPhase(PHASES.EXPLORATION);
    }
  });
}
