import { gameState, PHASES } from '../state/GameState.js';
import { ThreeScene } from '../three/ThreeScene.js';
import { Controls } from '../game/Controls.js';
import { generateAvatarSVG } from '../svg/AvatarSVG.js';
import { audioSystem } from '../game/AudioSystem.js';
import { POI_REGISTRY_3D } from '../three/InteractionSystem.js';

export class MapView3D {
  constructor() {
    this.threeScene = null;
    this.controls = null;
    this.loadingOverlay = null;
    this.promptEl = null;
    this.animFrameId = null;
    this.promptInterval = null;
    this._timeouts = new Set();
    this._activeToasts = new Set();
    this._windowCleanups = [];
    this._isDestroyed = false;
    this._lastRadarText = '';
    this._lastPromptId = null;
    this.handleInteractBound = () => this.handleInteraction();
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  _setTimer(fn, ms) {
    const id = setTimeout(() => {
      this._timeouts.delete(id);
      if (!this._isDestroyed) fn();
    }, ms);
    this._timeouts.add(id);
    return id;
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
        <div class="hud-guest-name"></div>
      </div>
      <div class="hud-title desktop-only">ADJIE &amp; DAULIKA — THE GARDEN OF US</div>
      <div class="hud-actions">
        <button type="button" class="retro-btn retro-btn-secondary hud-audio-btn" title="Musik &amp; Efek Suara" aria-label="Musik dan Efek Suara">
          ${audioSystem.isMuted ? '🔇' : '🔊'}
        </button>
        <button type="button" class="retro-btn retro-btn-secondary hud-avatar-btn">✏️ <span>Edit<span class="hud-avatar-btn-extra"> Avatar</span></span></button>
      </div>
    `;

    const hudNameEl = hudBar.querySelector('.hud-guest-name');
    if (hudNameEl) {
      hudNameEl.textContent = state.guestName;
    }

    const audioBtn = hudBar.querySelector('.hud-audio-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = audioSystem.toggleMute();
        audioBtn.textContent = isMuted ? '🔇' : '🔊';
      });
      const onMuteSync = (ev) => {
        const muted = ev && ev.detail ? Boolean(ev.detail.isMuted) : audioSystem.isMuted;
        audioBtn.textContent = muted ? '🔇' : '🔊';
      };
      window.addEventListener('audio-mute-changed', onMuteSync);
      this._windowCleanups.push(() => window.removeEventListener('audio-mute-changed', onMuteSync));
    }

    hudBar.querySelector('.hud-avatar-btn').addEventListener('click', () => {
      this.destroy();
      gameState.setPhase(PHASES.AVATAR_CREATOR);
    });

    container.appendChild(hudBar);

    // 1b. In-Game Navigation Radar / Compass Bar
    this.radarBar = document.createElement('div');
    this.radarBar.className = 'hud-radar-strip';
    this.radarBar.innerHTML = `
      <span class="radar-pulse">🧭</span>
      <span class="radar-label">Mencari petunjuk arah...</span>
    `;
    container.appendChild(this.radarBar);

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
        <div class="loading-title">MEMPERSIAPKAN TAMAN KAMI...</div>
        <div class="loading-subtitle"></div>
      </div>
    `;
    const loadingSubEl = this.loadingOverlay.querySelector('.loading-subtitle');
    if (loadingSubEl) {
      loadingSubEl.textContent = `Selamat Datang, ${state.guestName}`;
    }
    container.appendChild(this.loadingOverlay);

    // Initialize Controls & ThreeScene
    this.controls = new Controls();

    this._setTimer(() => {
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
        this._setTimer(() => {
          if (this.loadingOverlay && this.loadingOverlay.parentNode) {
            this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
            this.loadingOverlay = null;
          }

          const viewParam = new URLSearchParams(window.location.search).get('view');
          if (viewParam && this.threeScene && this.threeScene.character) {
            this.threeScene.cameraController.setTarget(this.threeScene.character.getPosition());
          }

          if (!viewParam && this.threeScene && this.threeScene.cameraController) {
            this.threeScene.cameraController.startCinematicIntro(() => {
              if (this._isDestroyed) return;
              const toast = document.createElement('div');
              toast.className = 'retro-toast';
              toast.textContent = '🌸 Selamat Datang, ';
              const strongName = document.createElement('strong');
              strongName.textContent = state.guestName;
              toast.appendChild(strongName);
              toast.appendChild(document.createTextNode('!'));
              document.body.appendChild(toast);
              this._activeToasts.add(toast);
              this._setTimer(() => {
                toast.style.opacity = '0';
                this._setTimer(() => {
                  this._activeToasts.delete(toast);
                  toast.remove();
                }, 400);
              }, 2500);

              this._setTimer(() => {
                const hintToast = document.createElement('div');
                hintToast.className = 'retro-toast tutorial-hint-toast';
                hintToast.innerHTML = `
                  <div style="font-size: 11px; font-weight: bold; margin-bottom: 5px; color: #ffe082;">🌸 PANDUAN JELAJAH TAMAN 🌸</div>
                  <div style="font-size: 9px; line-height: 1.6; color: #fff;">
                    🕹️ <strong>Gerak:</strong> Gunakan Joystick (Kiri) / Tombol WASD<br>
                    👆 <strong>Putar:</strong> Geser 1 jari / Drag mouse untuk putar sudut pandang<br>
                    🔍 <strong>Zoom:</strong> Cubit 2 jari (Pinch) / Scroll mouse untuk zoom<br>
                    💌 <strong>Buka:</strong> Dekati &amp; Ketuk titik acara untuk melihat detail
                  </div>
                `;
                document.body.appendChild(hintToast);
                this._activeToasts.add(hintToast);

                this._setTimer(() => {
                  hintToast.style.opacity = '0';
                  this._setTimer(() => {
                    this._activeToasts.delete(hintToast);
                    hintToast.remove();
                  }, 500);
                }, 5500);
              }, 1000);
            });
          }
        }, 300);
      }
    }, 60);

    // Proximity check interval for floating prompt (only mutates DOM on change)
    this.promptInterval = setInterval(() => {
      if (!this.threeScene || !this.threeScene.interactionSystem) return;

      if (gameState.getState().activeModal) {
        if (this._lastPromptId !== null) {
          this._lastPromptId = null;
          this.promptEl.classList.add('hidden');
        }
        return;
      }

      if (this.radarBar && this.threeScene && this.threeScene.character) {
        const charPos = this.threeScene.character.getPosition();
        let closestPOI = null;
        let minDistance = Infinity;

        for (const p of POI_REGISTRY_3D) {
          const dist = Math.hypot(charPos.x - p.x, charPos.z - p.z);
          if (dist < minDistance) {
            minDistance = dist;
            closestPOI = p;
          }
        }

        if (closestPOI) {
          const distInt = Math.round(minDistance);
          const radarKey = `${closestPOI.id}:${distInt}`;
          if (radarKey !== this._lastRadarText) {
            this._lastRadarText = radarKey;
            const radarLabel = this.radarBar.querySelector('.radar-label');
            if (radarLabel) {
              radarLabel.innerHTML = `${closestPOI.icon} <strong>${closestPOI.name}</strong> • ${distInt}m`;
            }
          }
        }
      }

      const poi = this.threeScene.interactionSystem.nearbyPOI;
      const nextPromptId = poi ? poi.id : null;
      if (nextPromptId !== this._lastPromptId) {
        this._lastPromptId = nextPromptId;
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

    const onMouseMove = (e) => {
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
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    this._windowCleanups.push(() => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    });
  }

  updateControlsLoop() {
    if (this._isDestroyed) return;
    const activeModal = gameState.getState().activeModal;

    if (!activeModal && this.threeScene && this.threeScene.character && this.controls) {
      const { dx, dy, intensity, jump } = this.controls.getMovementVector();
      this.threeScene.character.move(dx, dy, intensity, jump, this.threeScene.camera);
    }

    this.animFrameId = requestAnimationFrame(() => this.updateControlsLoop());
  }

  handleInteraction() {
    window.dispatchEvent(new CustomEvent('modal-open'));
    if (this.threeScene && this.threeScene.interactionSystem) {
      this.threeScene.interactionSystem.triggerInteraction();
    }
  }

  destroy() {
    this._isDestroyed = true;
    window.removeEventListener('player-interact', this.handleInteractBound);
    while (this._windowCleanups.length > 0) {
      const cleanup = this._windowCleanups.pop();
      try { cleanup(); } catch {}
    }
    this._timeouts.forEach((id) => clearTimeout(id));
    this._timeouts.clear();
    this._activeToasts.forEach((t) => {
      try { t.remove(); } catch {}
    });
    this._activeToasts.clear();
    if (this.promptInterval) {
      clearInterval(this.promptInterval);
      this.promptInterval = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.controls && typeof this.controls.destroy === 'function') {
      this.controls.destroy();
      this.controls = null;
    }
    if (this.threeScene) {
      this.threeScene.dispose();
      this.threeScene = null;
    }
  }
}
