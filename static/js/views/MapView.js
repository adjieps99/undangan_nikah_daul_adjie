import { gameState, PHASES, MODALS } from '../state/GameState.js';
import { MapEngine } from '../game/MapEngine.js';
import { generateAvatarSVG } from '../svg/AvatarSVG.js';

export class MapView {
  constructor() {
    this.mapEngine = null;
    this.promptEl = null;
    this.promptInterval = null;
    this.handleInteractBound = () => this.handleInteraction();
  }

  render() {
    const state = gameState.getState();
    const container = document.createElement('div');
    container.className = 'map-view-container';

    // 1. HUD Top Bar
    const hudBar = document.createElement('div');
    hudBar.className = 'map-hud-bar';
    hudBar.innerHTML = `
      <div class="hud-guest-info">
        <div class="hud-avatar-thumb">${generateAvatarSVG(state.playerConfig, 36)}</div>
        <div class="hud-guest-name">${state.guestName}</div>
      </div>
      <div class="hud-title">WEDDING GARDEN MAP</div>
      <div class="hud-actions" style="display: flex; gap: 6px;">
        <button class="retro-btn retro-btn-secondary hud-share-btn">📲 SHARE</button>
        <button class="retro-btn retro-btn-secondary hud-avatar-btn">✏️ EDIT</button>
      </div>
    `;

    hudBar.querySelector('.hud-avatar-btn').addEventListener('click', () => {
      if (this.mapEngine) this.mapEngine.stop();
      gameState.setPhase(PHASES.AVATAR_CREATOR);
    });

    hudBar.querySelector('.hud-share-btn').addEventListener('click', () => {
      const shareData = {
        title: 'The Wedding Adventure - Adjie & Daul Gembul',
        text: `Undangan Pernikahan 2D RPG Adjie & Daul Gembul!`,
        url: window.location.href
      };

      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
          alert('Link Undangan berhasil disalin ke clipboard!');
        });
      }
    });

    container.appendChild(hudBar);

    // 2. Canvas Container
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'map-canvas-wrapper';

    const canvas = document.createElement('canvas');
    canvas.id = 'rpg-map-canvas';
    canvasWrapper.appendChild(canvas);

    // 3. Floating Interaction Prompt
    this.promptEl = document.createElement('div');
    this.promptEl.className = 'map-interact-prompt hidden';
    canvasWrapper.appendChild(this.promptEl);

    container.appendChild(canvasWrapper);

    // Initialize Map Engine after mount
    setTimeout(() => {
      this.mapEngine = new MapEngine(canvas);
      this.mapEngine.controls.createVirtualJoystick(container);
      this.mapEngine.start();

      // Listen for interact trigger
      window.addEventListener('player-interact', this.handleInteractBound);
    }, 50);

    // Proximity check interval for floating prompt
    this.promptInterval = setInterval(() => {
      if (!this.mapEngine) return;
      const poi = this.mapEngine.nearbyPOI;
      if (poi) {
        this.promptEl.innerHTML = `
          <div class="prompt-icon">${poi.icon}</div>
          <div class="prompt-text">
            <strong>${poi.name}</strong>
            <span>Tekan [E] atau Tap di sini</span>
          </div>
        `;
        this.promptEl.classList.remove('hidden');
        this.promptEl.onclick = () => this.handleInteraction();
      } else {
        this.promptEl.classList.add('hidden');
        this.promptEl.onclick = null;
      }
    }, 100);

    return container;
  }

  handleInteraction() {
    if (!this.mapEngine || !this.mapEngine.nearbyPOI) return;
    const poi = this.mapEngine.nearbyPOI;

    switch (poi.id) {
      case 'profile':
        gameState.setModal(MODALS.PROFILE);
        break;
      case 'location':
        gameState.setModal(MODALS.LOCATION);
        break;
      case 'rsvp':
        gameState.setModal(MODALS.RSVP);
        break;
      case 'wishes':
        gameState.setModal(MODALS.WISHES);
        break;
      case 'gift':
        gameState.setModal(MODALS.GIFT);
        break;
    }
  }

  destroy() {
    window.removeEventListener('player-interact', this.handleInteractBound);
    if (this.promptInterval) clearInterval(this.promptInterval);
    if (this.mapEngine) this.mapEngine.stop();
  }
}
