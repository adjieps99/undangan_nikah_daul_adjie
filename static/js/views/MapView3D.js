import { gameState, PHASES } from '../state/GameState.js';
import { ThreeScene } from '../three/ThreeScene.js';
import { Controls } from '../game/Controls.js';
import { generateAvatarSVG } from '../svg/AvatarSVG.js';

export class MapView3D {
  constructor() {
    this.threeScene = null;
    this.controls = null;
    this.loadingOverlay = null;
    this.promptEl = null;
    this.animFrameId = null;
    this.promptInterval = null;
    this.handleInteractBound = () => this.handleInteraction();
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
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
      <div class="hud-title">HACHI GARDEN 3D</div>
      <div class="hud-actions" style="display: flex; gap: 6px;">
        <button class="retro-btn retro-btn-secondary hud-share-btn">📲 SHARE</button>
        <button class="retro-btn retro-btn-secondary hud-avatar-btn">✏️ EDIT</button>
      </div>
    `;

    hudBar.querySelector('.hud-avatar-btn').addEventListener('click', () => {
      this.destroy();
      gameState.setPhase(PHASES.AVATAR_CREATOR);
    });

    hudBar.querySelector('.hud-share-btn').addEventListener('click', () => {
      const shareUrl = window.location.href;
      const shareData = {
        title: 'The Wedding Adventure - Adjie & Daul Gembul',
        text: 'Undangan Pernikahan 3D Hachi Garden Adjie & Daul Gembul!',
        url: shareUrl
      };

      if (navigator.share && window.isSecureContext) {
        navigator.share(shareData).catch(() => {
          this.copyShareLinkFallback(shareUrl);
        });
      } else {
        this.copyShareLinkFallback(shareUrl);
      }
    });

    container.appendChild(hudBar);

    // 2. WebGL Canvas Container
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'map-canvas-wrapper';
    container.appendChild(canvasWrapper);

    // 3. Floating Interaction Prompt (Adaptive Touch / Keyboard Hint)
    this.promptEl = document.createElement('div');
    this.promptEl.className = 'map-interact-prompt hidden';
    canvasWrapper.appendChild(this.promptEl);

    // 4. WebGL Loading Indicator Overlay
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'webgl-loading-overlay';
    this.loadingOverlay.innerHTML = `
      <div class="pixel-box loading-box">
        <div class="loading-spinner">🌸</div>
        <div class="loading-title">MEMPERSIAPKAN HACHI GARDEN 3D...</div>
        <div class="loading-subtitle">Selamat Datang, ${state.guestName}</div>
      </div>
    `;
    container.appendChild(this.loadingOverlay);

    // Initialize Controls & ThreeScene
    this.controls = new Controls();

    setTimeout(() => {
      this.threeScene = new ThreeScene(canvasWrapper);
      this.controls.createVirtualJoystick(container);
      this.threeScene.start();

      // Start Controls Update Loop
      this.updateControlsLoop();

      // Event listener for action button / key
      window.addEventListener('player-interact', this.handleInteractBound);

      // Fade out loading overlay & Trigger 3-Second Cinematic Reveal
      if (this.loadingOverlay) {
        this.loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          if (this.loadingOverlay && this.loadingOverlay.parentNode) {
            this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
            this.loadingOverlay = null;
          }

          // Trigger Cinematic Camera Sweep
          if (this.threeScene && this.threeScene.cameraController) {
            this.threeScene.cameraController.startCinematicIntro(() => {
              // Welcome Toast Banner on Cinematic Finish
              const toast = document.createElement('div');
              toast.className = 'retro-toast';
              toast.innerHTML = `🌸 Selamat Datang di Hachi Garden 3D, <strong>${state.guestName}</strong>!`;
              document.body.appendChild(toast);
              setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 400);
              }, 3000);
            });
          }
        }, 300);
      }
    }, 100);

    // Proximity check interval for floating prompt
    this.promptInterval = setInterval(() => {
      if (!this.threeScene || !this.threeScene.interactionSystem) return;

      // Pause prompt if a modal is open
      if (gameState.getState().activeModal) {
        this.promptEl.classList.add('hidden');
        return;
      }

      const poi = this.threeScene.interactionSystem.nearbyPOI;
      if (poi) {
        const hintText = this.isMobile ? 'Tap di sini untuk membuka' : 'Tekan [E] atau Tap di sini';
        this.promptEl.innerHTML = `
          <div class="prompt-icon">${poi.icon}</div>
          <div class="prompt-text">
            <strong>${poi.label}</strong>
            <span>${hintText}</span>
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

  updateControlsLoop() {
    const activeModal = gameState.getState().activeModal;

    // Pause character movement input if a modal is currently open
    if (!activeModal && this.threeScene && this.threeScene.character && this.controls) {
      const { dx, dy, jump } = this.controls.getMovementVector();
      this.threeScene.character.move(dx, dy, jump);
    }

    this.animFrameId = requestAnimationFrame(() => this.updateControlsLoop());
  }

  handleInteraction() {
    if (this.threeScene && this.threeScene.interactionSystem) {
      this.threeScene.interactionSystem.triggerInteraction();
    }
  }

  copyShareLinkFallback(shareUrl) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert('📋 Link Undangan berhasil disalin!');
        }).catch(() => {
          prompt('Salin Link Undangan:', shareUrl);
        });
      } else {
        prompt('Salin Link Undangan:', shareUrl);
      }
    } catch (e) {
      prompt('Salin Link Undangan:', shareUrl);
    }
  }

  destroy() {
    window.removeEventListener('player-interact', this.handleInteractBound);
    if (this.promptInterval) clearInterval(this.promptInterval);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.threeScene) {
      this.threeScene.dispose();
      this.threeScene = null;
    }
  }
}
