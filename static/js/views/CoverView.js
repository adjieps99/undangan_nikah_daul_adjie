import { gameState, PHASES } from '../state/GameState.js';
import { audioSystem } from '../game/AudioSystem.js';

export class CoverView {
  constructor(onStart) {
    this.onStart = onStart;
    this.isOpen = false;
  }

  render() {
    const state = gameState.getState();
    const viewContainer = document.createElement('div');
    viewContainer.className = 'cover-view-container';

    // Ambient subtle sparkles
    const sparkles = document.createElement('div');
    sparkles.className = 'pixel-sparkles';
    for (let i = 0; i < 12; i++) {
      const star = document.createElement('div');
      star.className = 'sparkle-star';
      star.style.left = `${(i * 19 + 7) % 94}%`;
      star.style.top = `${(i * 29 + 11) % 92}%`;
      star.style.animationDelay = `${(i * 0.23).toFixed(2)}s`;
      sparkles.appendChild(star);
    }
    viewContainer.appendChild(sparkles);

    // Single Romantic Welcoming Heading
    const headerTitle = document.createElement('div');
    headerTitle.className = 'cover-header-badge';
    headerTitle.innerHTML = `
      <h1 class="cover-welcome-heading">Selamat datang di hari bahagia Adjie &amp; Daulika</h1>
    `;
    viewContainer.appendChild(headerTitle);

    // Single Interactive Envelope Component
    const envelopeWrapper = document.createElement('div');
    envelopeWrapper.className = 'envelope-wrapper';

    const envelopeBox = document.createElement('div');
    envelopeBox.className = `envelope-interactive ${this.isOpen ? 'open' : ''}`;

    envelopeBox.innerHTML = `
      <!-- Letter Clipping Sleeve keeps letter physically inside closed envelope -->
      <div class="envelope-pocket-clip">
        <div class="envelope-letter-sheet">
          <div class="letter-top-ornament">✦ ✦ ✦</div>
          <div class="letter-guest-to">Untukmu,</div>
          <div class="letter-guest-recipient"></div>
          <p class="letter-body-text">
            Kami membuat taman kecil ini untuk berbagi cerita, tawa, dan hari bahagia kami bersama orang-orang tersayang.
          </p>
          <button type="button" class="letter-open-cta-btn" id="letter-start-btn">
            🌿 Yuk, masuk ke taman kami
          </button>
        </div>
      </div>

      <!-- Front Bottom Pocket -->
      <div class="envelope-front-pocket"></div>
      <div class="envelope-pocket-crease-left"></div>
      <div class="envelope-pocket-crease-right"></div>

      <!-- Top Flap & Wax Seal -->
      <div class="envelope-top-flap"></div>
      <button type="button" class="envelope-wax-seal" id="envelope-open-btn" aria-label="Buka amplop undangan pernikahan Adjie & Daulika">
        <span class="wax-seal-icon" aria-hidden="true">♥</span>
        <span class="wax-seal-text">BUKA</span>
      </button>
    `;

    // Safe textContent assignment to prevent XSS from ?to= URL parameter
    const recipientEl = envelopeBox.querySelector('.letter-guest-recipient');
    if (recipientEl) {
      recipientEl.textContent = state.guestName || 'Tamu Undangan';
    }

    // Clear conversational hint beneath envelope (declared before openEnvelope for clean toggle)
    const hintText = document.createElement('div');
    hintText.className = `envelope-instruction-hint${this.isOpen ? ' is-hidden' : ''}`;
    hintText.textContent = 'Ketuk amplop untuk membuka undangan.';

    const openTriggerBtn = envelopeBox.querySelector('#envelope-open-btn');
    const openEnvelope = () => {
      if (!this.isOpen) {
        this.isOpen = true;
        envelopeBox.classList.add('open');
        hintText.classList.add('is-hidden');
        if (openTriggerBtn) {
          openTriggerBtn.setAttribute('aria-hidden', 'true');
          openTriggerBtn.setAttribute('tabindex', '-1');
        }
        try {
          audioSystem.playChime(587.33);
          audioSystem.ensureOpeningTrackPlaying();
        } catch (e) {}
      }
    };

    envelopeBox.addEventListener('click', (e) => {
      if (e.target && e.target.closest && e.target.closest('#letter-start-btn')) {
        e.stopPropagation();
        this.triggerStart();
        return;
      }
      openEnvelope();
    });

    if (openTriggerBtn) {
      openTriggerBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEnvelope();
        }
      });
    }

    envelopeWrapper.appendChild(envelopeBox);
    viewContainer.appendChild(envelopeWrapper);
    viewContainer.appendChild(hintText);

    return viewContainer;
  }

  triggerStart() {
    try {
      audioSystem.playChime(659.25);
      audioSystem.ensureOpeningTrackPlaying();
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('player-interact'));
    if (typeof this.onStart === 'function') {
      this.onStart();
    } else {
      gameState.setPhase(PHASES.AVATAR_CREATOR);
    }
  }
}
