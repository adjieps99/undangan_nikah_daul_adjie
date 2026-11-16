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
    this.transitionCurtain = this._ensureTransitionCurtain();
    this._curtainTimer = null;

    this.renderedPhase = null;
    this.renderedModal = null;
    this.phaseGeneration = 0;
    this.modalGeneration = 0;

    this.init();
  }

  _ensureTransitionCurtain() {
    let curtain = document.getElementById('scene-transition-curtain');
    if (!curtain && document.body) {
      curtain = document.createElement('div');
      curtain.id = 'scene-transition-curtain';
      curtain.className = 'scene-transition-curtain';
      curtain.setAttribute('aria-hidden', 'true');
      const appRoot = document.getElementById('app') || document.body;
      appRoot.appendChild(curtain);
    }
    return curtain;
  }

  _pulseSceneCurtain() {
    if (!this.transitionCurtain) return;
    if (this._curtainTimer) {
      clearTimeout(this._curtainTimer);
      this._curtainTimer = null;
    }
    this.transitionCurtain.classList.add('active');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._curtainTimer = setTimeout(() => {
          if (this.transitionCurtain) {
            this.transitionCurtain.classList.remove('active');
          }
          this._curtainTimer = null;
        }, 180);
      });
    });
  }

  init() {
    console.log('Bootstrapping Wedding Invitation Application (Hachi Garden 3D)...');
    gameState.subscribe((state) => this.render(state));
    this.render(gameState.getState());
  }

  cleanupActiveModal() {
    const existingModals = document.querySelectorAll('.modal-backdrop');
    existingModals.forEach((existingModal) => {
      if (typeof existingModal._cleanup === 'function') {
        existingModal._cleanup();
      }
      existingModal.remove();
    });
  }

  render(state) {
    if (!this.uiLayer) return;

    const prevPhase = this.renderedPhase;
    const phaseChanged = prevPhase !== state.gamePhase;
    const modalChanged = this.renderedModal !== state.activeModal;

    // Only update DOM if phase or active modal changed
    if (!phaseChanged && !modalChanged) {
      return;
    }

    this.renderedPhase = state.gamePhase;
    this.renderedModal = state.activeModal;

    const is3DSceneSwap =
      phaseChanged &&
      prevPhase !== null &&
      (state.gamePhase === PHASES.MAIN_HALL || prevPhase === PHASES.MAIN_HALL);
    if (is3DSceneSwap) {
      this._pulseSceneCurtain();
    }

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
      this.phaseGeneration += 1;
      const gen = this.phaseGeneration;
      this.cleanupActiveModal();
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
            if (gen !== this.phaseGeneration || gameState.getState().gamePhase !== PHASES.OPENING_VIDEO) return;
            if (!this.mapView) {
              this.mapView = new MapView3D();
            }
            this.uiLayer.appendChild(this.mapView.render());
            import('./views/modals/VoiceRecordingModal.js').then(({ createVoiceRecordingModal }) => {
              if (gen !== this.phaseGeneration || gameState.getState().gamePhase !== PHASES.OPENING_VIDEO) return;
              const modal = createVoiceRecordingModal();
              if (modal) this.uiLayer.appendChild(modal);
            });
          });
          break;

        case PHASES.EXPLORATION:
          import('./views/MapView3D.js').then(({ MapView3D }) => {
            if (gen !== this.phaseGeneration || gameState.getState().gamePhase !== PHASES.EXPLORATION) return;
            if (!this.mapView) {
              this.mapView = new MapView3D();
            }
            this.uiLayer.appendChild(this.mapView.render());
          });
          break;

        case PHASES.MAIN_HALL:
          import('./views/MainHallView.js').then(({ MainHallView }) => {
            if (gen !== this.phaseGeneration || gameState.getState().gamePhase !== PHASES.MAIN_HALL) return;
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
      this.modalGeneration += 1;
      const modalGen = this.modalGeneration;
      this.cleanupActiveModal();

      if (state.activeModal) {
        import('./views/ModalsView.js').then(({ ModalsView }) => {
          if (modalGen !== this.modalGeneration || gameState.getState().activeModal !== state.activeModal) return;
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
