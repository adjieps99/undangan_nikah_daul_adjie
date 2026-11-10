import { createModal } from '../../ui/Modal.js';
import { gameState, PHASES } from '../../state/GameState.js';
import { createRetroButton } from '../../ui/RetroButton.js';

export function createOpeningVideoModal() {
  const content = document.createElement('div');
  content.className = 'video-modal-content';

  let isPlaying = true;
  let isMuted = true;

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 12px;">
      <span style="font-size: 10px; letter-spacing: 1.5px; color: var(--color-gold); font-weight: bold;">
        OUR JOURNEY TO FOREVER
      </span>
      <h3 style="font-size: 15px; color: #fff; margin: 4px 0;">Sekapur Sirih Adjie & Daul</h3>
    </div>

    <!-- Video Player Simulation Container -->
    <div style="
      position: relative;
      width: 100%;
      height: 200px;
      background: radial-gradient(circle at center, #2b1828 0%, #0d070d 100%);
      border: 1px solid rgba(212, 175, 55, 0.4);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    ">
      <!-- Atmospheric Sunset Video Backdrop Visual -->
      <div style="
        font-size: 48px;
        filter: drop-shadow(0 0 16px rgba(255, 180, 150, 0.6));
        animation: pulse 2.5s infinite ease-in-out;
      ">
        🌅
      </div>

      <div style="
        margin-top: 10px;
        font-family: var(--font-serif);
        font-style: italic;
        color: #ffbe97;
        font-size: 13px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
      ">
        "Two souls, one unforgettable journey..."
      </div>

      <!-- Playback Status Overlay -->
      <div style="
        position: absolute;
        bottom: 8px;
        left: 12px;
        right: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(4px);
        padding: 4px 10px;
        border-radius: 20px;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="video-toggle-btn" style="background: none; border: none; color: #fff; font-size: 14px; cursor: pointer;">⏸</button>
          <button id="video-mute-btn" style="background: none; border: none; color: #fff; font-size: 14px; cursor: pointer;">🔇</button>
          <span style="font-size: 10px; color: #aaa;">0:24 / 1:30</span>
        </div>
        <span style="font-size: 10px; color: #1ed760; font-weight: bold;">● LIVE PREVIEW</span>
      </div>
    </div>

    <!-- Emotional Message -->
    <div style="margin-top: 14px; text-align: center; font-size: 11px; opacity: 0.9; line-height: 1.5;">
      Sebelum melangkah ke dalam kebun Hachi Garden, saksikan sejenak untaian rasa dan doa yang mengawali langkah kami menuju pelaminan.
    </div>
  `;

  const toggleBtn = content.querySelector('#video-toggle-btn');
  const muteBtn = content.querySelector('#video-mute-btn');

  toggleBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    toggleBtn.textContent = isPlaying ? '⏸' : '▶';
  });

  muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
  });

  // Action Buttons: Enter Garden & Skip
  const footerRow = document.createElement('div');
  footerRow.style.display = 'flex';
  footerRow.style.gap = '10px';
  footerRow.style.marginTop = '16px';

  const enterBtn = createRetroButton({
    text: '🌸 MASUK KE HACHI GARDEN',
    className: 'rsvp-btn active',
    onClick: () => {
      gameState.setModal(null);
      gameState.setPhase(PHASES.EXPLORATION);
    }
  });
  enterBtn.style.flex = '1';

  footerRow.appendChild(enterBtn);
  content.appendChild(footerRow);

  return createModal({
    id: 'opening-video-modal',
    title: '🎬 OPENING VIDEO — KISAH KAMI',
    content: content,
    onClose: () => {
      gameState.setPhase(PHASES.EXPLORATION);
    }
  });
}
