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

    // 1. HUD Top Bar (Share Button removed for premium invitation aesthetics)
    const hudBar = document.createElement('div');
    hudBar.className = 'map-hud-bar';
    hudBar.innerHTML = `
      <div class="hud-guest-info">
        <div class="hud-avatar-thumb">${generateAvatarSVG(state.playerConfig, 36)}</div>
        <div class="hud-guest-name">${state.guestName}</div>
      </div>
      <div class="hud-title">HACHI GARDEN 3D</div>
      <div class="hud-actions" style="display: flex; gap: 6px;">
        <button class="retro-btn retro-btn-secondary hud-avatar-btn">✏️ EDIT AVATAR</button>
      </div>
    `;

    hudBar.querySelector('.hud-avatar-btn').addEventListener('click', () => {
      this.destroy();
      gameState.setPhase(PHASES.AVATAR_CREATOR);
    });

    container.appendChild(hudBar);

    // 2. WebGL Canvas Container
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'map-canvas-wrapper';
    container.appendChild(canvasWrapper);

    // Setup Desktop Mouse Wheel & Mobile Pinch Zoom Listeners
    this.setupCameraZoomListeners(canvasWrapper);

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
              toast.innerHTML = `🌸 Selamat Datang, <strong>${state.guestName}</strong>!`;
              document.body.appendChild(toast);
              setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 400);
              }, 2500);

              // First-time Exploration Tutorial Hint Toast
              setTimeout(() => {
                const hintToast = document.createElement('div');
                hintToast.className = 'retro-toast tutorial-hint-toast';
                hintToast.innerHTML = `
                  <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px; color: #ffe082;">🎮 PANDUAN NAVIGASI VIRTUAL</div>
                  <div style="font-size: 9px; line-height: 1.5; color: #fff;">
                    🌸 <strong>Kiri:</strong> Drag joystick untuk jalan<br>
                    👆 <strong>Kanan:</strong> Usap layar untuk putar kamera<br>
                    ✨ <strong>Action:</strong> Dekati lokasi & tekan ACTION
                  </div>
                `;
                document.body.appendChild(hintToast);

                setTimeout(() => {
                  hintToast.style.opacity = '0';
                  setTimeout(() => hintToast.remove(), 500);
                }, 4500);
              }, 1000);
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

  setupCameraZoomListeners(wrapper) {
    const isModalActive = () => !!gameState.getState().activeModal;

    // 1. Desktop Mouse Wheel & Trackpad Zoom
    wrapper.addEventListener('wheel', (e) => {
      if (isModalActive()) return;
      if (!this.threeScene || !this.threeScene.cameraController) return;
      const zoomDelta = e.deltaY * 0.0015;
      this.threeScene.cameraController.zoom(zoomDelta);
    }, { passive: true });

    // 2. Touch Orbit Drag (Right 65% screen) & 2-Finger Touch Pinch Zoom
    let lookTouchId = null;
    let lastTouchPos = { x: 0, y: 0 };
    let initialPinchDistance = null;

    wrapper.addEventListener('touchstart', (e) => {
      if (isModalActive()) return;
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        // Only trigger camera look if touch originates on right 65% of screen
        if (touch.clientX > window.innerWidth * 0.35) {
          lookTouchId = touch.identifier;
          lastTouchPos = { x: touch.clientX, y: touch.clientY };
        }
      } else if (e.touches.length === 2) {
        lookTouchId = null;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.hypot(dx, dy);
      }
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      if (isModalActive()) return;
      if (e.touches.length === 1 && lookTouchId !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === lookTouchId) {
            const deltaX = touch.clientX - lastTouchPos.x;
            const deltaY = touch.clientY - lastTouchPos.y;
            lastTouchPos = { x: touch.clientX, y: touch.clientY };

            if (this.threeScene && this.threeScene.cameraController) {
              this.threeScene.cameraController.rotate(deltaX, -deltaY);
            }
            break;
          }
        }
      } else if (e.touches.length === 2 && initialPinchDistance !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentPinchDistance = Math.hypot(dx, dy);

        const diff = initialPinchDistance - currentPinchDistance;
        if (this.threeScene && this.threeScene.cameraController) {
          this.threeScene.cameraController.zoom(diff * 0.005);
        }
        initialPinchDistance = currentPinchDistance;
      }
    }, { passive: true });

    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
          lookTouchId = null;
          break;
        }
      }
      if (e.touches.length < 2) {
        initialPinchDistance = null;
      }
    };

    wrapper.addEventListener('touchend', handleTouchEnd, { passive: true });
    wrapper.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // 3. Desktop Mouse Drag Orbit Look
    let isMouseDown = false;
    let lastMousePos = { x: 0, y: 0 };

    wrapper.addEventListener('mousedown', (e) => {
      if (isModalActive()) return;
      if (e.button === 0 && e.clientX > window.innerWidth * 0.25) {
        isMouseDown = true;
        lastMousePos = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isModalActive()) {
        isMouseDown = false;
        return;
      }
      if (isMouseDown) {
        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;
        lastMousePos = { x: e.clientX, y: e.clientY };

        if (this.threeScene && this.threeScene.cameraController) {
          this.threeScene.cameraController.rotate(deltaX, -deltaY);
        }
      }
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
  }

  updateControlsLoop() {
    const activeModal = gameState.getState().activeModal;

    // Pause character movement input if a modal is currently open
    if (!activeModal && this.threeScene && this.threeScene.character && this.controls) {
      const { dx, dy, intensity, jump } = this.controls.getMovementVector();
      this.threeScene.character.move(dx, dy, intensity, jump);
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
