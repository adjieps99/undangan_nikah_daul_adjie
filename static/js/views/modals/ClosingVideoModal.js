import { createModal } from '../../ui/Modal.js';
import { gameState } from '../../state/GameState.js';
import { createRetroButton } from '../../ui/RetroButton.js';

export function createClosingVideoModal() {
  const content = document.createElement('div');
  content.className = 'closing-video-modal-content';

  const state = gameState.getState();

  content.innerHTML = `
    <!-- Thank You Header -->
    <div style="text-align: center; margin-bottom: 12px;">
      <div style="font-size: 36px; margin-bottom: 4px;">💌</div>
      <h3 style="font-size: 15px; color: var(--color-gold); margin: 0 0 6px;">
        Terima Kasih, <span id="closing-guest-name"></span>
      </h3>
      <p style="font-size: 11px; opacity: 0.85; margin: 0;">
        Doa dan restu Anda adalah pelita terindah bagi kami.
      </p>
    </div>

    <!-- Video / Card Presentation Frame -->
    <div style="
      position: relative;
      width: 100%;
      height: 180px;
      background: radial-gradient(circle at center, #351c2f 0%, #100813 100%);
      border: 1px solid rgba(212, 175, 55, 0.4);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
      text-align: center;
      box-shadow: 0 4px 18px rgba(0,0,0,0.6);
    ">
      <div style="font-size: 28px; margin-bottom: 8px;">🕊️✨</div>
      <p style="
        font-family: var(--font-serif);
        font-style: italic;
        color: #ffbe97;
        font-size: 12px;
        line-height: 1.6;
        margin: 0;
      ">
        "Terima kasih sudah mengonfirmasi kehadiran. Walaupun belum bisa hadir bersama kami secara langsung di Hachi Garden, doa dan restu kalian sangat berarti bagi lembaran baru pernikahan kami."
      </p>
      <div style="margin-top: 10px; font-size: 10px; color: var(--color-gold); font-weight: bold; letter-spacing: 1px;">
        — DENGAN KASIH, ADJIE & DAUL —
      </div>
    </div>

    <!-- Give Blessing Button / Close -->
    <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
      <button id="send-wish-cta-btn" class="rsvp-btn active" style="width: 100%; padding: 10px; border-radius: 6px; font-size: 11px; font-weight: bold;">
        ✍️ TULIS UCAPAN & DOA RESTU
      </button>
    </div>
  `;

  const guestNameEl = content.querySelector('#closing-guest-name');
  if (guestNameEl) {
    guestNameEl.textContent = state.guestName;
  }

  const wishBtn = content.querySelector('#send-wish-cta-btn');
  wishBtn.addEventListener('click', () => {
    import('../../state/GameState.js').then(({ MODALS }) => {
      gameState.setModal(MODALS.WISHES);
    });
  });

  return createModal({
    id: 'closing-video-modal',
    title: '✨ TERIMA KASIH DARI KAMI',
    content: content
  });
}
