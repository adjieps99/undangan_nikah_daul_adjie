import { gameState, PHASES } from '../state/GameState.js';
import { createRetroButton } from '../ui/RetroButton.js';
import { WEDDING_DATA } from '../data/wedding.js';

export class CoverView {
  constructor(onStart) {
    this.onStart = onStart;
    this.isOpen = false;
  }

  render() {
    const state = gameState.getState();
    const viewContainer = document.createElement('div');
    viewContainer.className = 'cover-view-container';

    // Ambient floating pixel sparkles
    const sparkles = document.createElement('div');
    sparkles.className = 'pixel-sparkles';
    for (let i = 0; i < 12; i++) {
      const star = document.createElement('div');
      star.className = 'sparkle-star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 2}s`;
      sparkles.appendChild(star);
    }
    viewContainer.appendChild(sparkles);

    // Main Game Title Badge
    const headerTitle = document.createElement('div');
    headerTitle.className = 'cover-header-badge';
    headerTitle.innerHTML = `
      <div class="retro-sub-title">PRESS START TO ENTER</div>
      <h1 class="retro-main-title">THE WEDDING ADVENTURE</h1>
      <div class="wedding-names">${WEDDING_DATA.couple.groom.name} & ${WEDDING_DATA.couple.bride.name}</div>
    `;
    viewContainer.appendChild(headerTitle);

    // Pixel Envelope Card Component
    const envelopeBox = document.createElement('div');
    envelopeBox.className = `pixel-envelope ${this.isOpen ? 'open' : ''}`;

    envelopeBox.innerHTML = `
      <div class="envelope-flap"></div>
      <div class="envelope-seal">💌</div>
      <div class="envelope-letter">
        <div class="letter-header">UNDANGAN PERNIKAHAN</div>
        <div class="letter-guest-label">SPECIAL INVITATION FOR:</div>
        <div class="letter-guest-name">${state.guestName}</div>
        <div class="letter-teaser">Kami mengundang Anda menjelajahi Taman Pernikahan 2D kami!</div>
      </div>
    `;

    // Toggle flap state on click
    envelopeBox.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      envelopeBox.classList.toggle('open', this.isOpen);
    });

    viewContainer.appendChild(envelopeBox);

    // CTA Button
    const startBtn = createRetroButton({
      text: '🎮 CREATE AVATAR & START',
      className: 'cover-start-btn',
      onClick: () => {
        if (typeof this.onStart === 'function') {
          this.onStart();
        } else {
          gameState.setPhase(PHASES.AVATAR_CREATOR);
        }
      }
    });

    viewContainer.appendChild(startBtn);
    return viewContainer;
  }
}
