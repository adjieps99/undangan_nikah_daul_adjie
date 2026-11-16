import { createModal } from '../../ui/Modal.js';
import { audioSystem } from '../../game/AudioSystem.js';
import { ASSET_MANIFEST, getTrackFilename } from '../../config/assetManifest.js';
import { gameState, MODALS } from '../../state/GameState.js';

export function createListeningStationModal() {
  const content = document.createElement('div');
  content.className = 'listening-modal-content';

  const playlist = ASSET_MANIFEST.audio.playlist || [];

  content.innerHTML = `
    <div style="
      background: radial-gradient(circle at center, rgba(30, 215, 96, 0.16) 0%, rgba(18, 14, 24, 0.95) 100%);
      border: 1px solid rgba(30, 215, 96, 0.45);
      border-radius: 14px;
      padding: 16px 14px;
      text-align: center;
      margin-bottom: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    ">
      <div id="record-disc" style="
        width: 68px;
        height: 68px;
        margin: 0 auto 10px;
        background: radial-gradient(circle, #242424 20%, #111111 60%, #000 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #1ed760;
        box-shadow: 0 0 16px rgba(30, 215, 96, 0.35);
      ">
        <span style="font-size: 28px;">🎧</span>
      </div>

      <div style="font-size: 10px; letter-spacing: 2px; color: #1ed760; font-weight: bold;">
        PLAYLIST ADJIE &amp; DAULIKA
      </div>
      <h3 id="current-track-title" style="font-size: 14px; color: #fff; margin: 4px 0 2px;"></h3>
      <div id="current-track-artist" style="font-size: 11px; color: #ffbe97; margin-bottom: 8px;"></div>

      <p id="track-availability-note" style="
        font-size: 10.5px;
        color: #f5eedc;
        opacity: 0.92;
        margin: 0 0 10px;
        line-height: 1.45;
      ">Memeriksa file audio...</p>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span id="track-time-cur" style="font-size: 10px; color: #ccc; font-family: monospace;">--:--</span>
        <input type="range" id="track-seek-bar" min="0" max="100" value="0" disabled style="
          flex: 1;
          margin: 0 10px;
          accent-color: #1ed760;
          cursor: not-allowed;
          height: 4px;
          opacity: 0.45;
        ">
        <span id="track-time-dur" style="font-size: 10px; color: #888; font-family: monospace;">--:--</span>
      </div>

      <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 10px 0 6px;">
        <button type="button" id="prev-track-btn" aria-label="Lagu sebelumnya" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">⏮️</button>
        <button type="button" id="play-pause-btn" disabled style="
          background: #1ed760;
          border: 2px solid #000;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          color: #000;
          font-size: 18px;
          cursor: not-allowed;
          opacity: 0.45;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 2px 2px 0 #000;
        ">▶</button>
        <button type="button" id="next-track-btn" aria-label="Lagu berikutnya" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">⏭️</button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08);">
        <button type="button" id="station-mute-btn" style="
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          color: #f5eedc;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 10px;
          cursor: pointer;
        "></button>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 11px; color: #aaa;">🔊</span>
          <input type="range" id="track-volume-slider" min="0" max="1" step="0.05" value="0.78" style="
            width: 70px;
            accent-color: #1ed760;
            cursor: pointer;
          ">
        </div>
      </div>
    </div>

    <div>
      <h5 style="font-size: 11px; letter-spacing: 1px; color: var(--color-gold); margin-bottom: 8px;">
        📜 DAFTAR LAGU PILIHAN KAMI
      </h5>
      <div id="playlist-rows" style="display: flex; flex-direction: column; gap: 6px;"></div>
    </div>
  `;

  const titleEl = content.querySelector('#current-track-title');
  const artistEl = content.querySelector('#current-track-artist');
  const noteEl = content.querySelector('#track-availability-note');
  const durEl = content.querySelector('#track-time-dur');
  const curTimeEl = content.querySelector('#track-time-cur');
  const seekBar = content.querySelector('#track-seek-bar');
  const playBtn = content.querySelector('#play-pause-btn');
  const prevBtn = content.querySelector('#prev-track-btn');
  const nextBtn = content.querySelector('#next-track-btn');
  const muteBtn = content.querySelector('#station-mute-btn');
  const disc = content.querySelector('#record-disc');
  const volumeSlider = content.querySelector('#track-volume-slider');
  const rowsContainer = content.querySelector('#playlist-rows');

  const formatSecs = (s) => {
    if (!Number.isFinite(s) || s < 0) return '--:--';
    const m = Math.floor(s / 60);
    const rem = Math.floor(s % 60);
    return `${m < 10 ? '0' : ''}${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  // Build track rows safely with textContent
  const rowEls = [];
  playlist.forEach((track, i) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'playlist-row';
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
      width: 100%;
      padding: 9px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    `;

    const left = document.createElement('div');
    left.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    const num = document.createElement('span');
    num.style.cssText = 'font-size: 11px; opacity: 0.7; min-width: 16px; color: #f5eedc;';
    num.textContent = String(i + 1);

    const meta = document.createElement('div');
    const title = document.createElement('div');
    title.style.cssText = 'font-size: 11.5px; font-weight: bold; color: #fff;';
    title.textContent = track.title;

    const artist = document.createElement('div');
    artist.style.cssText = 'font-size: 10px; color: #ffbe97;';
    artist.textContent = track.artist;

    meta.appendChild(title);
    meta.appendChild(artist);
    left.appendChild(num);
    left.appendChild(meta);
    row.appendChild(left);

    const badge = document.createElement('span');
    badge.style.cssText = 'font-size: 9px; color: #1ed760;';
    badge.textContent = track.isDefault ? 'Utama' : '';
    row.appendChild(badge);

    row.addEventListener('click', () => {
      audioSystem.selectTrack(i, { autoPlay: true, restartIfSame: false });
    });

    rowsContainer.appendChild(row);
    rowEls.push({ row, badge, track });
  });

  const renderMusicState = (ms) => {
    const track = ms.track || playlist[ms.currentTrackIndex] || { title: '', artist: '' };
    const filename = ms.missingFilename || getTrackFilename(track);
    const availabilityMap = ms.trackAvailability || {};

    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;

    rowEls.forEach(({ row: r, badge, track: t }, i) => {
      const tFname = getTrackFilename(t);
      const isAvail = tFname in availabilityMap ? Boolean(availabilityMap[tFname]) : null;
      if (isAvail === true) {
        badge.textContent = i === ms.currentTrackIndex && ms.isPlaying ? '♪ Diputar' : (t.isDefault ? 'Utama • Siap' : 'Siap Putar');
        badge.style.color = '#1ed760';
        badge.style.opacity = '1';
      } else if (isAvail === false) {
        badge.textContent = t.isDefault ? 'Utama • Belum ada' : 'Belum diunggah';
        badge.style.color = '#aaa';
        badge.style.opacity = '0.75';
      } else {
        badge.textContent = t.isDefault ? 'Utama' : '';
        badge.style.color = '#1ed760';
      }

      if (i === ms.currentTrackIndex) {
        r.style.border = '1px solid #1ed760';
        r.style.background = 'rgba(30, 215, 96, 0.15)';
      } else {
        r.style.border = '1px solid transparent';
        r.style.background = 'rgba(255,255,255,0.05)';
      }
    });

    muteBtn.textContent = ms.isMuted ? '🔇 Audio Dibisukan' : '🔊 Audio Aktif';
    volumeSlider.value = String(ms.volume ?? 0.78);

    if (ms.availability === 'available') {
      playBtn.disabled = false;
      playBtn.style.cursor = 'pointer';
      playBtn.style.opacity = '1';
      seekBar.disabled = false;
      seekBar.style.cursor = 'pointer';
      seekBar.style.opacity = '1';
      playBtn.textContent = ms.isPlaying ? '⏸' : '▶';
      curTimeEl.textContent = formatSecs(ms.currentTime);
      durEl.textContent = formatSecs(ms.duration);
      seekBar.value = ms.duration > 0 ? String((ms.currentTime / ms.duration) * 100) : '0';
      disc.style.boxShadow = ms.isPlaying
        ? '0 0 24px rgba(30, 215, 96, 0.65)'
        : '0 0 16px rgba(30, 215, 96, 0.35)';
      noteEl.textContent = ms.isPlaying
        ? (ms.isMuted ? 'Sedang diputar (suara dibisukan sementara).' : 'Sedang diputar sebagai musik latar perjalanan Anda.')
        : 'Ketuk putar untuk mendengarkan lagu pilihan kami.';
    } else if (ms.availability === 'checking' || ms.availability === 'unknown') {
      playBtn.disabled = true;
      playBtn.style.cursor = 'not-allowed';
      playBtn.style.opacity = '0.45';
      playBtn.textContent = '▶';
      seekBar.disabled = true;
      seekBar.value = '0';
      seekBar.style.cursor = 'not-allowed';
      seekBar.style.opacity = '0.45';
      curTimeEl.textContent = '--:--';
      durEl.textContent = '--:--';
      disc.style.boxShadow = '0 0 16px rgba(30, 215, 96, 0.25)';
      noteEl.textContent = 'Memeriksa file audio...';
    } else {
      playBtn.disabled = true;
      playBtn.style.cursor = 'not-allowed';
      playBtn.style.opacity = '0.45';
      playBtn.textContent = '▶';
      seekBar.disabled = true;
      seekBar.value = '0';
      seekBar.style.cursor = 'not-allowed';
      seekBar.style.opacity = '0.45';
      curTimeEl.textContent = '--:--';
      durEl.textContent = '--:--';
      disc.style.boxShadow = '0 0 16px rgba(30, 215, 96, 0.2)';
      noteEl.textContent = `File audio belum tersedia (${filename} di /static/audio/tracks/).`;
    }
  };

  const unsubscribe = audioSystem.subscribeMusic(renderMusicState);
  audioSystem.syncOnListeningStationOpen();

  playBtn.addEventListener('click', () => {
    audioSystem.togglePlayPause();
  });

  prevBtn.addEventListener('click', () => {
    const ms = audioSystem.getMusicState();
    audioSystem.prevTrack({ autoPlay: ms.isPlaying || ms.availability !== 'available' });
  });

  nextBtn.addEventListener('click', () => {
    const ms = audioSystem.getMusicState();
    audioSystem.nextTrack({ autoPlay: ms.isPlaying || ms.availability !== 'available' });
  });

  muteBtn.addEventListener('click', () => {
    audioSystem.toggleMute();
  });

  seekBar.addEventListener('input', (e) => {
    const ms = audioSystem.getMusicState();
    if (ms.availability !== 'available' || !Number.isFinite(ms.duration) || ms.duration <= 0) return;
    audioSystem.seekMusic((parseFloat(e.target.value) / 100) * ms.duration);
  });

  volumeSlider.addEventListener('input', (e) => {
    audioSystem.setMusicVolume(parseFloat(e.target.value));
  });

  // Closing the modal MUST keep music playing seamlessly across the world!
  const cleanup = () => {
    unsubscribe();
    if (gameState.getState().activeModal === MODALS.LISTENING) {
      gameState.setModal(MODALS.NONE);
    }
  };

  return createModal({
    id: 'listening-modal',
    title: '🎧 LISTENING STATION',
    content,
    onClose: cleanup
  });
}
