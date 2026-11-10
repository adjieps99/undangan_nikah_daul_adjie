import { createModal } from '../../ui/Modal.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createListeningStationModal() {
  const content = document.createElement('div');
  content.className = 'listening-modal-content';

  const playlist = WEDDING_DATA.playlist || [];
  let currentTrackIdx = 0;
  let isPlaying = false;

  content.innerHTML = `
    <!-- Player Header / Album Art -->
    <div style="
      background: linear-gradient(135deg, rgba(30, 215, 96, 0.15) 0%, rgba(20, 20, 30, 0.6) 100%);
      border: 1px solid rgba(30, 215, 96, 0.4);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin-bottom: 14px;
    ">
      <div style="
        width: 72px;
        height: 72px;
        margin: 0 auto 10px;
        background: #121212;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #1ed760;
        box-shadow: 0 0 15px rgba(30, 215, 96, 0.3);
      ">
        <span style="font-size: 32px;">🎧</span>
      </div>

      <div style="font-size: 10px; letter-spacing: 1.5px; color: #1ed760; font-weight: bold;">
        SPOTIFY WEDDING PLAYLIST
      </div>
      <h3 id="current-track-title" style="font-size: 14px; color: #fff; margin: 4px 0 2px;">
        ${playlist[0]?.title || 'Semenjak Ada Dirimu'}
      </h3>
      <div id="current-track-artist" style="font-size: 11px; opacity: 0.8; margin-bottom: 10px;">
        ${playlist[0]?.artist || 'Yovie & Nuno'}
      </div>

      <!-- Playback Controls -->
      <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 8px;">
        <button id="prev-track-btn" style="background: none; border: none; color: #fff; font-size: 18px; cursor: pointer;">⏮️</button>
        <button id="play-pause-btn" style="
          background: #1ed760;
          border: none;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          color: #000;
          font-size: 16px;
          cursor: pointer;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        ">▶</button>
        <button id="next-track-btn" style="background: none; border: none; color: #fff; font-size: 18px; cursor: pointer;">⏭️</button>
      </div>

      <!-- Equalizer Visualizer Bars -->
      <div id="audio-visualizer" style="display: flex; justify-content: center; align-items: flex-end; gap: 4px; height: 16px; margin-top: 12px; opacity: 0.4;">
        <span style="width: 3px; height: 6px; background: #1ed760; border-radius: 2px;"></span>
        <span style="width: 3px; height: 12px; background: #1ed760; border-radius: 2px;"></span>
        <span style="width: 3px; height: 16px; background: #1ed760; border-radius: 2px;"></span>
        <span style="width: 3px; height: 8px; background: #1ed760; border-radius: 2px;"></span>
        <span style="width: 3px; height: 14px; background: #1ed760; border-radius: 2px;"></span>
      </div>
    </div>

    <!-- Track List -->
    <div style="margin-top: 10px;">
      <h5 style="font-size: 11px; letter-spacing: 1px; color: var(--color-gold); margin-bottom: 8px;">
        📜 LAGU-LAGU SPESIAL PERJALANAN KAMI
      </h5>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${playlist.map((track, i) => `
          <div class="playlist-row" data-idx="${i}" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 10px;
            background: rgba(255,255,255,0.05);
            border-radius: 6px;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.2s;
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; opacity: 0.6; min-width: 14px;">${i + 1}</span>
              <div>
                <div style="font-size: 11px; font-weight: 600; color: #fff;">${track.title}</div>
                <div style="font-size: 10px; opacity: 0.7;">${track.artist}</div>
              </div>
            </div>
            <span style="font-size: 10px; opacity: 0.6;">${track.duration}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Spotify Link / Fallback -->
    <div style="margin-top: 14px; text-align: center;">
      <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #1ed760;
        color: #000;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: bold;
        text-decoration: none;
      ">
        <span>Buka di Spotify</span> ↗
      </a>
    </div>
  `;

  // Audio Logic Simulation
  const titleEl = content.querySelector('#current-track-title');
  const artistEl = content.querySelector('#current-track-artist');
  const playBtn = content.querySelector('#play-pause-btn');
  const prevBtn = content.querySelector('#prev-track-btn');
  const nextBtn = content.querySelector('#next-track-btn');
  const visualizer = content.querySelector('#audio-visualizer');
  const rows = content.querySelectorAll('.playlist-row');

  const updateTrack = (idx) => {
    currentTrackIdx = (idx + playlist.length) % playlist.length;
    const track = playlist[currentTrackIdx];
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
    rows.forEach((r, i) => {
      if (i === currentTrackIdx) {
        r.style.borderColor = '#1ed760';
        r.style.background = 'rgba(30, 215, 96, 0.15)';
      } else {
        r.style.borderColor = 'transparent';
        r.style.background = 'rgba(255,255,255,0.05)';
      }
    });
  };

  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    visualizer.style.opacity = isPlaying ? '1.0' : '0.4';
  });

  prevBtn.addEventListener('click', () => updateTrack(currentTrackIdx - 1));
  nextBtn.addEventListener('click', () => updateTrack(currentTrackIdx + 1));

  rows.forEach(r => {
    r.addEventListener('click', () => {
      const idx = parseInt(r.getAttribute('data-idx'));
      updateTrack(idx);
      isPlaying = true;
      playBtn.textContent = '⏸';
      visualizer.style.opacity = '1.0';
    });
  });

  updateTrack(0);

  return createModal({
    id: 'listening-modal',
    title: '🎧 LISTENING STATION — PLAYLIST KAMI',
    content: content
  });
}
