import { gameState, PHASES } from './state/GameState.js';
import { CoverView } from './views/CoverView.js';
import { AvatarView } from './views/AvatarView.js';

class App {
  constructor() {
    this.uiLayer = document.getElementById('ui-layer');
    this.coverView = new CoverView(() => gameState.setPhase(PHASES.AVATAR_CREATOR));
    this.avatarView = new AvatarView(() => gameState.setPhase(PHASES.OPENING_VIDEO));
    this.mapView = null;
    this.mainHallView = null;
    this.modalsView = null;

    this.renderedPhase = null;
    this.renderedModal = null;

    this.init();
  }

  init() {
    console.log('Bootstrapping Wedding Invitation Application (Hachi Garden 3D)...');
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

    // Destroy existing map engine if leaving EXPLORATION / OPENING_VIDEO phase
    if (phaseChanged && state.gamePhase !== PHASES.EXPLORATION && state.gamePhase !== PHASES.OPENING_VIDEO && this.mapView) {
      this.mapView.destroy();
      this.mapView = null;
    }

    // Destroy main hall if leaving MAIN_HALL
    if (phaseChanged && state.gamePhase !== PHASES.MAIN_HALL && this.mainHallView) {
      this.mainHallView.destroy();
      this.mainHallView = null;
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

        case PHASES.OPENING_VIDEO:
          import('./views/MapView3D.js').then(({ MapView3D }) => {
            if (!this.mapView) {
              this.mapView = new MapView3D();
            }
            this.uiLayer.appendChild(this.mapView.render());
            // Show opening video modal over 3D world
            import('./views/modals/OpeningVideoModal.js').then(({ createOpeningVideoModal }) => {
              const modal = createOpeningVideoModal();
              if (modal) this.uiLayer.appendChild(modal);
            });
          });
          break;

        case PHASES.EXPLORATION:
          import('./views/MapView3D.js').then(({ MapView3D }) => {
            if (!this.mapView) {
              this.mapView = new MapView3D();
            }
            this.uiLayer.appendChild(this.mapView.render());
          });
          break;

        case PHASES.MAIN_HALL:
          import('./views/MainHallView.js').then(({ MainHallView }) => {
            if (!this.mainHallView) {
              this.mainHallView = new MainHallView();
            }
            this.uiLayer.appendChild(this.mainHallView.render());
          });
          break;

        default:
          this.uiLayer.appendChild(this.coverView.render());
          break;
      }
    }

    // Render Overlay Modal if Active
    if (modalChanged) {
      const existingModal = document.querySelector('.modal-backdrop');
      if (existingModal) {
        if (typeof existingModal._cleanup === 'function') {
          existingModal._cleanup();
        }
        existingModal.remove();
      }

      if (state.activeModal) {
        import('./views/ModalsView.js').then(({ ModalsView }) => {
          if (!this.modalsView) {
            this.modalsView = new ModalsView();
          }
          const modalEl = this.modalsView.render(state.activeModal);
          if (modalEl) {
            this.uiLayer.appendChild(modalEl);
          }
        });
      }
    }
  }
}

function bootstrap() {
  try {
    window.app = new App();
  } catch (err) {
    console.error('Failed to initialize Wedding Application:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
