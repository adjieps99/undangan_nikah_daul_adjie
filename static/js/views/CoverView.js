import { gameState, PHASES } from '../state/GameState.js';
import { createRetroButton } from '../ui/RetroButton.js';
import { WEDDING_DATA } from '../data/wedding.js';
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

    // Ambient floating subtle sparkles
    const sparkles = document.createElement('div');
    sparkles.className = 'pixel-sparkles';
    for (let i = 0; i < 14; i++) {
      const star = document.createElement('div');
      star.className = 'sparkle-star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 2.5}s`;
      sparkles.appendChild(star);
    }
    viewContainer.appendChild(sparkles);

    // Main Wedding Brand Header Badge
    const headerTitle = document.createElement('div');
    headerTitle.className = 'cover-header-badge';
    headerTitle.innerHTML = `
      <div class="wedding-names-banner" style="font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #fff;">ADJIE &amp; DAULIKA</div>
      <div class="garden-brand-tagline" style="font-size: 13px; color: var(--color-gold); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;">A Celebration of Love</div>
      <div class="garden-brand-venue" style="font-size: 11px; color: #e0d0cc; letter-spacing: 1px; margin-top: 2px;">THE HACHI GARDEN • 5 DECEMBER 2026</div>
    `;
    viewContainer.appendChild(headerTitle);

    // Physically Closed Interactive Envelope Component
    const envelopeWrapper = document.createElement('div');
    envelopeWrapper.className = 'envelope-wrapper';

    const envelopeBox = document.createElement('div');
    envelopeBox.className = `envelope-interactive ${this.isOpen ? 'open' : ''}`;

    envelopeBox.innerHTML = `
      <div class="envelope-back-plate"></div>
      
      <!-- Letter (Concealed inside pocket when closed, slides upward when opened) -->
      <div class="envelope-letter-sheet">
        <div class="letter-top-ornament">✦ ✦ ✦</div>
        <div class="letter-badge">UNDANGAN PERNIKAHAN</div>
        <div class="letter-guest-to">Khusus Untuk:</div>
        <div class="letter-guest-recipient">${state.guestName || 'Tamu Terhormat'}</div>
        <p class="letter-body-text">
          Di balik setiap sudut kebun ini, ada kenangan manis dan doa hangat. 
          Kami mengundangmu melangkah ke dalam dunia kecil kami.
        </p>
        <button type="button" class="letter-open-cta-btn" id="letter-start-btn">
          🌸 MASUK KE GARDEN
        </button>
      </div>

      <!-- Front Bottom Pocket (Physically hides the letter before click) -->
      <div class="envelope-front-pocket"></div>
      <div class="envelope-pocket-crease-left"></div>
      <div class="envelope-pocket-crease-right"></div>

      <!-- Top Flap & Golden Seal -->
      <div class="envelope-top-flap"></div>
      <div class="envelope-wax-seal">
        <span class="wax-seal-icon">💌</span>
        <span class="wax-seal-text">TAP TO OPEN</span>
      </div>
    `;

    // Handle envelope click/tap to toggle open state
    const openEnvelope = () => {
      if (!this.isOpen) {
        this.isOpen = true;
        envelopeBox.classList.add('open');
        try {
          audioSystem.playChime(587.33); // D5 pleasant chime
        } catch (e) {
          // Audio context might be restricted before interaction
        }
      }
    };

    envelopeBox.addEventListener('click', (e) => {
      // If clicking the action button inside letter, trigger start
      if (e.target && e.target.id === 'letter-start-btn') {
        e.stopPropagation();
        this.triggerStart();
        return;
      }
      openEnvelope();
    });

    envelopeWrapper.appendChild(envelopeBox);
    viewContainer.appendChild(envelopeWrapper);

    // Hint beneath envelope
    const hintText = document.createElement('div');
    hintText.className = 'envelope-instruction-hint';
    hintText.innerText = 'Ketuk amplop untuk membuka undangan.';
    viewContainer.appendChild(hintText);

    return viewContainer;
  }

  triggerStart() {
    try {
      audioSystem.playChime(659.25); // E5 chord
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('player-interact'));
    if (typeof this.onStart === 'function') {
      this.onStart();
    } else {
      gameState.setPhase(PHASES.AVATAR_CREATOR);
    }
  }
}
