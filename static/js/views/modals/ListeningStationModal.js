import { createModal } from '../../ui/Modal.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createListeningStationModal() {
  const content = document.createElement('div');
  content.className = 'listening-modal-content';

  const playlist = WEDDING_DATA.playlist || [];
  let currentTrackIdx = 0;
  let isPlaying = false;
  let currentTime = 0;
  let progressTimer = null;
  let audioContext = null;
  let oscillator = null;
  let gainNode = null;

  // Track note frequencies for gentle procedural preview melody
  const trackNotes = [523.25, 440.00, 392.00, 349.23, 329.63];

  content.innerHTML = `
    <!-- Player Card -->
    <div style="
      background: radial-gradient(circle at center, rgba(30, 215, 96, 0.18) 0%, rgba(18, 14, 24, 0.95) 100%);
      border: 1px solid rgba(30, 215, 96, 0.45);
      border-radius: 14px;
      padding: 16px 14px;
      text-align: center;
      margin-bottom: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    ">
      <!-- Spinning Disc / Album Art -->
      <div id="record-disc" style="
        width: 74px;
        height: 74px;
        margin: 0 auto 10px;
        background: radial-gradient(circle, #242424 20%, #111111 60%, #000 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #1ed760;
        box-shadow: 0 0 16px rgba(30, 215, 96, 0.35);
        transition: transform 0.3s;
      ">
        <span style="font-size: 32px;">🎧</span>
      </div>

      <div style="font-size: 10px; letter-spacing: 2px; color: #1ed760; font-weight: bold;">
        PLAYLIST PERJALANAN KAMI
      </div>
      <h3 id="current-track-title" style="font-size: 14px; color: #fff; margin: 4px 0 2px;">
        ${playlist[0]?.title || 'Langit Merah Muda'}
      </h3>
      <div id="current-track-artist" style="font-size: 11px; color: #ffbe97; margin-bottom: 10px;">
        ${playlist[0]?.artist || 'Afgan'}
      </div>

      <!-- Timeline & Scrubbable Seek Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span id="track-time-cur" style="font-size: 10px; color: #ccc; font-family: monospace;">00:00</span>
        <input type="range" id="track-seek-bar" min="0" max="100" value="0" style="
          flex: 1;
          margin: 0 10px;
          accent-color: #1ed760;
          cursor: pointer;
          height: 4px;
        ">
        <span id="track-time-dur" style="font-size: 10px; color: #888; font-family: monospace;">${playlist[0]?.duration || '04:21'}</span>
      </div>

      <!-- Playback Controls -->
      <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 10px 0 6px;">
        <button type="button" id="prev-track-btn" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">⏮️</button>
        <button type="button" id="play-pause-btn" style="
          background: #1ed760;
          border: 2px solid #000;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          color: #000;
          font-size: 18px;
          cursor: pointer;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 2px 2px 0 #000;
        ">▶</button>
        <button type="button" id="next-track-btn" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">⏭️</button>
      </div>

      <!-- Volume & Equalizer Strip -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08);">
        <div id="audio-eq-bars" style="display: flex; align-items: flex-end; gap: 3px; height: 14px; opacity: 0.35;">
          <span style="width: 3px; height: 5px; background: #1ed760; border-radius: 2px;"></span>
          <span style="width: 3px; height: 11px; background: #1ed760; border-radius: 2px;"></span>
          <span style="width: 3px; height: 14px; background: #1ed760; border-radius: 2px;"></span>
          <span style="width: 3px; height: 7px; background: #1ed760; border-radius: 2px;"></span>
          <span style="width: 3px; height: 12px; background: #1ed760; border-radius: 2px;"></span>
        </div>

        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 11px; color: #aaa;">🔊</span>
          <input type="range" id="track-volume-slider" min="0" max="1" step="0.05" value="0.75" style="
            width: 65px;
            accent-color: #1ed760;
            cursor: pointer;
          ">
        </div>
      </div>
    </div>

    <!-- 5 Songs Playlist List -->
    <div>
      <h5 style="font-size: 11px; letter-spacing: 1px; color: var(--color-gold); margin-bottom: 8px;">
        📜 DAFTAR 5 LAGU KESUKAAN KAMI
      </h5>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${playlist.map((track, i) => `
          <div class="playlist-row ${i === 0 ? 'active' : ''}" data-idx="${i}" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 9px 12px;
            background: ${i === 0 ? 'rgba(30, 215, 96, 0.15)' : 'rgba(255,255,255,0.05)'};
            border: 1px solid ${i === 0 ? '#1ed760' : 'transparent'};
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
          ">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 11px; opacity: 0.7; min-width: 16px;">${i + 1}</span>
              <div>
                <div style="font-size: 11.5px; font-weight: bold; color: #fff;">${track.title}</div>
                <div style="font-size: 10px; color: #ffbe97;">${track.artist}</div>
              </div>
            </div>
            <span style="font-size: 10px; color: #aaa;">${track.duration}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Audio Logic
  const titleEl = content.querySelector('#current-track-title');
  const artistEl = content.querySelector('#current-track-artist');
  const durEl = content.querySelector('#track-time-dur');
  const curTimeEl = content.querySelector('#track-time-cur');
  const seekBar = content.querySelector('#track-seek-bar');
  const playBtn = content.querySelector('#play-pause-btn');
  const prevBtn = content.querySelector('#prev-track-btn');
  const nextBtn = content.querySelector('#next-track-btn');
  const eqBars = content.querySelector('#audio-eq-bars');
  const disc = content.querySelector('#record-disc');
  const volumeSlider = content.querySelector('#track-volume-slider');
  const rows = content.querySelectorAll('.playlist-row');

  const initWebAudio = () => {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
        gainNode = audioContext.createGain();
        gainNode.gain.value = parseFloat(volumeSlider.value);
        gainNode.connect(audioContext.destination);
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  };

  const playSynthesizedMelody = () => {
    if (!audioContext) return;
    try {
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }
      oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      const baseFreq = trackNotes[currentTrackIdx % trackNotes.length];
      oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, audioContext.currentTime + 1.5);
      oscillator.connect(gainNode);
      oscillator.start();
    } catch (e) {}
  };

  const stopSynthesizedMelody = () => {
    if (oscillator) {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (e) {}
      oscillator = null;
    }
  };

  const parseDurationSecs = (durStr) => {
    const parts = (durStr || '3:30').split(':').map(Number);
    return parts[0] * 60 + parts[1];
  };

  const formatSecs = (s) => {
    const m = Math.floor(s / 60);
    const rem = Math.floor(s % 60);
    return `${m < 10 ? '0' : ''}${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const updateTrack = (idx) => {
    currentTrackIdx = (idx + playlist.length) % playlist.length;
    const track = playlist[currentTrackIdx];
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
    durEl.textContent = track.duration;
    currentTime = 0;
    seekBar.value = 0;
    curTimeEl.textContent = '00:00';

    rows.forEach((r, i) => {
      if (i === currentTrackIdx) {
        r.style.borderColor = '#1ed760';
        r.style.background = 'rgba(30, 215, 96, 0.15)';
      } else {
        r.style.borderColor = 'transparent';
        r.style.background = 'rgba(255,255,255,0.05)';
      }
    });

    if (isPlaying) {
      playSynthesizedMelody();
    }
  };

  const togglePlayback = () => {
    initWebAudio();
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    eqBars.style.opacity = isPlaying ? '1.0' : '0.35';
    disc.style.boxShadow = isPlaying ? '0 0 24px rgba(30, 215, 96, 0.6)' : '0 0 16px rgba(30, 215, 96, 0.35)';

    if (isPlaying) {
      playSynthesizedMelody();
      const totalSecs = parseDurationSecs(playlist[currentTrackIdx]?.duration);
      progressTimer = setInterval(() => {
        currentTime += 1;
        if (currentTime >= totalSecs) {
          updateTrack(currentTrackIdx + 1);
        } else {
          seekBar.value = (currentTime / totalSecs) * 100;
          curTimeEl.textContent = formatSecs(currentTime);
        }
      }, 1000);
    } else {
      stopSynthesizedMelody();
      clearInterval(progressTimer);
    }
  };

  playBtn.addEventListener('click', togglePlayback);
  prevBtn.addEventListener('click', () => updateTrack(currentTrackIdx - 1));
  nextBtn.addEventListener('click', () => updateTrack(currentTrackIdx + 1));

  rows.forEach(r => {
    r.addEventListener('click', () => {
      const idx = parseInt(r.getAttribute('data-idx'), 10);
      updateTrack(idx);
      if (!isPlaying) togglePlayback();
    });
  });

  seekBar.addEventListener('input', (e) => {
    const totalSecs = parseDurationSecs(playlist[currentTrackIdx]?.duration);
    currentTime = (parseFloat(e.target.value) / 100) * totalSecs;
    curTimeEl.textContent = formatSecs(currentTime);
  });

  volumeSlider.addEventListener('input', (e) => {
    if (gainNode) {
      gainNode.gain.value = parseFloat(e.target.value);
    }
  });

  const cleanup = () => {
    if (progressTimer) clearInterval(progressTimer);
    stopSynthesizedMelody();
    if (audioContext && audioContext.state !== 'closed') {
      try { audioContext.close(); } catch (e) {}
    }
  };

  return createModal({
    id: 'listening-modal',
    title: '🎧 LISTENING STATION — PLAYLIST KAMI',
    content: content,
    onClose: cleanup
  });
}
