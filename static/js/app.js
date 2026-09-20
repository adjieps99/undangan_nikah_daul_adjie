import { gameState, PHASES } from './state/GameState.js';
import { CoverView } from './views/CoverView.js';
import { AvatarView } from './views/AvatarView.js';
import { MapView } from './views/MapView.js';
import { ModalsView } from './views/ModalsView.js';

class App {
  constructor() {
    this.uiLayer = document.getElementById('ui-layer');
    this.coverView = new CoverView(() => gameState.setPhase(PHASES.AVATAR_CREATOR));
    this.avatarView = new AvatarView(() => gameState.setPhase(PHASES.EXPLORATION));
    this.mapView = null;
    this.modalsView = new ModalsView();

    this.renderedPhase = null;
    this.renderedModal = null;

    this.init();
  }

  init() {
    console.log('Bootstrapping Wedding Invitation Application...');
    gameState.subscribe((state) => this.render(state));
    this.render(gameState.getState());
  }

  render(state) {
    if (!this.uiLayer) return;

    const phaseChanged = this.renderedPhase !== state.gamePhase;
    const modalChanged = this.renderedModal !== state.activeModal;

    // Only update DOM if phase or active modal changed
    if (!phaseChanged && !modalChanged) {
      return;
    }

    this.renderedPhase = state.gamePhase;
    this.renderedModal = state.activeModal;

    // Destroy existing map engine if leaving EXPLORATION phase
    if (phaseChanged && state.gamePhase !== PHASES.EXPLORATION && this.mapView) {
      this.mapView.destroy();
      this.mapView = null;
    }

    if (phaseChanged) {
      this.uiLayer.innerHTML = '';
      switch (state.gamePhase) {
        case PHASES.COVER:
          this.uiLayer.appendChild(this.coverView.render());
          break;

        case PHASES.AVATAR_CREATOR:
          this.uiLayer.appendChild(this.avatarView.render());
          break;

        case PHASES.EXPLORATION:
          if (!this.mapView) {
            this.mapView = new MapView();
          }
          this.uiLayer.appendChild(this.mapView.render());
          break;

        default:
          this.uiLayer.appendChild(this.coverView.render());
          break;
      }
    }

    // Render Overlay Modal if Active
    if (modalChanged) {
      const existingModal = document.querySelector('.modal-backdrop');
      if (existingModal) existingModal.remove();

      if (state.activeModal) {
        const modalEl = this.modalsView.render(state.activeModal);
        if (modalEl) {
          this.uiLayer.appendChild(modalEl);
        }
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
