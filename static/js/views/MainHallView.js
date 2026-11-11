import * as THREE from 'three';
import { gameState, PHASES } from '../state/GameState.js';
import { createRetroButton } from '../ui/RetroButton.js';
import { TextureFactory } from '../three/TextureFactory.js';
import { CharacterController } from '../three/CharacterController.js';
import { Controls } from '../game/Controls.js';
import { audioSystem } from '../game/AudioSystem.js';
import { Avatar3D } from '../characters/Avatar3D.js';

export class MainHallView {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;
    this.hallGroup = null;

    // Interior Gameplay & Controls
    this.character = null;
    this.controls = null;
    this.isSitting = false;
    this.currentSeat = null;
    this.nearbySeat = null;
    this.isNearExit = false;
    this.allSeats = [];

    // Camera Orbit State
    this.cameraYaw = 0.0;
    this.cameraPitch = 0.24;
    this.cameraRadius = 5.6;
    this.targetYaw = 0.0;
    this.targetPitch = 0.24;

    this.sitButton = null;
    this.promptEl = null;
    this.statusEl = null;

    this.handleInteractBound = () => this.handleAction();
  }

  render() {
    const state = gameState.getState();

    this.container = document.createElement('div');
    this.container.className = 'main-hall-view-container';
    this.container.style.position = 'fixed';
    this.container.style.inset = '0';
    this.container.style.zIndex = '50';
    this.container.style.background = '#141218';
    this.container.style.overflow = 'hidden';

    // 1. Three.js Canvas Container
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'main-hall-canvas-container';
    canvasContainer.style.width = '100%';
    canvasContainer.style.height = '100%';
    this.container.appendChild(canvasContainer);

    // 2. Header HUD Overlay
    const overlay = document.createElement('div');
    overlay.className = 'main-hall-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.padding = '12px 18px';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'space-between';
    overlay.style.alignItems = 'center';
    overlay.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)';
    overlay.style.pointerEvents = 'none';

    overlay.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; pointer-events: auto;">
        <div style="
          padding: 6px 14px;
          background: rgba(212, 175, 55, 0.15);
          border: 1px solid var(--color-gold);
          border-radius: 6px;
        ">
          <span style="font-size: 10px; color: var(--color-gold); font-weight: bold; letter-spacing: 1px;">THE HACHI GARDEN</span>
          <div style="font-size: 13px; font-weight: bold; color: #fff;">GRAND WEDDING RECEPTION HALL</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center; pointer-events: auto;">
        <button id="hall-audio-btn" class="retro-btn retro-btn-secondary" title="Musik & Suara" style="font-size: 13px; padding: 6px 10px; min-width: 36px;">
          ${audioSystem.isMuted ? '🔇' : '🔊'}
        </button>
        <button id="hall-quick-exit-btn" class="retro-btn retro-btn-secondary" style="font-size: 11px; padding: 6px 12px;">
          🌿 KELUAR KE KEBUN
        </button>
      </div>
    `;

    const audioBtn = overlay.querySelector('#hall-audio-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = audioSystem.toggleMute();
        audioBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    overlay.querySelector('#hall-quick-exit-btn').addEventListener('click', () => {
      this.exitToGarden();
    });

    // 3. Floating Interaction Prompt
    this.promptEl = document.createElement('div');
    this.promptEl.className = 'map-interact-prompt hidden';
    this.promptEl.style.position = 'absolute';
    this.promptEl.style.bottom = '120px';
    this.promptEl.style.left = '50%';
    this.promptEl.style.transform = 'translateX(-50%)';
    this.promptEl.style.zIndex = '60';
    this.promptEl.style.maxWidth = '90%';
    this.promptEl.style.cursor = 'pointer';
    this.promptEl.addEventListener('click', () => this.handleAction());
    this.container.appendChild(this.promptEl);

    // 4. Bottom Guest Card & Action Controls
    const bannerBox = document.createElement('div');
    bannerBox.style.position = 'absolute';
    bannerBox.style.bottom = '16px';
    bannerBox.style.left = '50%';
    bannerBox.style.transform = 'translateX(-50%)';
    bannerBox.style.background = 'rgba(18, 14, 22, 0.94)';
    bannerBox.style.border = '1px solid var(--color-gold)';
    bannerBox.style.borderRadius = '12px';
    bannerBox.style.padding = '10px 18px';
    bannerBox.style.textAlign = 'center';
    bannerBox.style.backdropFilter = 'blur(8px)';
    bannerBox.style.boxShadow = '0 8px 32px rgba(0,0,0,0.7)';
    bannerBox.style.maxWidth = '92%';
    bannerBox.style.pointerEvents = 'auto';

    bannerBox.innerHTML = `
      <div style="font-size: 10px; letter-spacing: 1.5px; color: var(--color-gold); font-weight: bold;">
        RESEPSI PERNIKAHAN ADJIE & DAUL
      </div>
      <h3 id="hall-guest-welcome" style="font-size: 13px; color: #fff; margin: 2px 0 3px;">
        Selamat Datang, ${state.guestName || 'Tamu Undangan'}!
      </h3>
      <p id="hall-seat-status" style="font-size: 11px; color: #ffbe97; margin: 0 0 8px;">
        Jelajahi Main Hall bebas menggunakan Joystick / WASD. Dekati kursi untuk duduk.
      </p>
      <div id="hall-button-row" style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;"></div>
    `;

    this.statusEl = bannerBox.querySelector('#hall-seat-status');
    const buttonRow = bannerBox.querySelector('#hall-button-row');

    // Contextual Action Button (Sit / Stand / Exit)
    this.sitButton = createRetroButton({
      text: '🪑 DUDUK DI KURSI',
      onClick: () => {
        this.handleAction();
      }
    });
    this.sitButton.style.padding = '8px 16px';
    this.sitButton.style.fontSize = '11px';
    buttonRow.appendChild(this.sitButton);

    // Return to Garden Button
    const returnBtn = createRetroButton({
      text: '🌿 KELUAR KE KEBUN',
      variant: 'secondary',
      onClick: () => {
        this.exitToGarden();
      }
    });
    returnBtn.style.padding = '8px 16px';
    returnBtn.style.fontSize = '11px';
    buttonRow.appendChild(returnBtn);

    this.container.appendChild(overlay);
    this.container.appendChild(bannerBox);

    // 5. Controls: Virtual Joystick for Mobile & Keyboard WASD
    this.controls = new Controls();
    this.controls.createVirtualJoystick(this.container);

    // Listen for Action events from physical keys & virtual ACTION button
    window.addEventListener('player-interact', this.handleInteractBound);

    // Mouse / Touch Camera Orbit Listeners
    this.setupCameraOrbitListeners(canvasContainer);

    // 6. Initialize 3D Interior Environment
    requestAnimationFrame(() => this.init3D(canvasContainer));

    return this.container;
  }

  setupCameraOrbitListeners(mountEl) {
    let isMouseDown = false;
    let lastX = 0;
    let lastY = 0;

    // Desktop Mouse Drag Orbit
    mountEl.addEventListener('mousedown', (e) => {
      if (e.button === 0 && e.clientX > window.innerWidth * 0.25) {
        isMouseDown = true;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      this.targetYaw += dx * 0.005;
      this.targetPitch += dy * 0.005;
      this.targetPitch = Math.max(0.10, Math.min(0.65, this.targetPitch));
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    // Desktop Mouse Wheel Zoom (Min: 2.8m, Max: 12.0m)
    mountEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomSpeed = 0.0035;
      this.cameraRadius += e.deltaY * zoomSpeed;
      this.cameraRadius = Math.max(2.8, Math.min(12.0, this.cameraRadius));
    }, { passive: false });

    // Touch Swipe Orbit & Touch Pinch Zoom (Mobile)
    let touchLookId = null;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let initialPinchDist = null;
    let initialPinchRadius = 5.6;

    mountEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        // Two fingers detected: pinch zoom gesture
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialPinchRadius = this.cameraRadius;
        touchLookId = null;
        return;
      }

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.clientX > window.innerWidth * 0.35 && touchLookId === null) {
          touchLookId = touch.identifier;
          lastTouchX = touch.clientX;
          lastTouchY = touch.clientY;
          break;
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialPinchDist) {
        const currentPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = initialPinchDist / Math.max(10, currentPinchDist);
        this.cameraRadius = Math.max(2.8, Math.min(12.0, initialPinchRadius * scale));
        return;
      }

      if (touchLookId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchLookId) {
          const dx = touch.clientX - lastTouchX;
          const dy = touch.clientY - lastTouchY;
          lastTouchX = touch.clientX;
          lastTouchY = touch.clientY;

          this.targetYaw += dx * 0.007;
          this.targetPitch += dy * 0.006;
          this.targetPitch = Math.max(0.10, Math.min(0.65, this.targetPitch));
          break;
        }
      }
    }, { passive: true });

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialPinchDist = null;
      }
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchLookId) {
          touchLookId = null;
          break;
        }
      }
    };
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  }

  handleAction() {
    if (this.isSitting) {
      this.standUp();
    } else if (this.isNearExit) {
      this.exitToGarden();
    } else if (this.nearbySeat) {
      this.sitAtSeat(this.nearbySeat);
    }
  }

  sitAtSeat(seat) {
    if (!this.character) return;
    this.isSitting = true;
    this.currentSeat = seat;

    this.character.sitOn(seat, seat.faceAngle);
    audioSystem.playChime(440);

    if (this.sitButton) {
      this.sitButton.innerText = '🚶 BERDIRI KEMBALI';
    }
    if (this.statusEl) {
      this.statusEl.textContent = `✨ Anda sedang duduk santai di ${seat.label}.`;
    }
    if (this.promptEl) {
      this.promptEl.innerHTML = `
        <div class="prompt-icon">🚶</div>
        <div class="prompt-text">
          <strong>Sedang Duduk di ${seat.label}</strong>
          <span>Tekan [E] atau Gerakkan Joystick untuk Berdiri</span>
        </div>
      `;
      this.promptEl.classList.remove('hidden');
    }
  }

  standUp() {
    if (!this.character) return;
    this.isSitting = false;
    audioSystem.playChime(523.25);

    // Step slightly to the side/rear of the seat
    const seat = this.currentSeat;
    let offset = null;
    if (seat) {
      const backX = -Math.sin(seat.faceAngle) * 0.35;
      const backZ = -Math.cos(seat.faceAngle) * 0.35;
      offset = new THREE.Vector3(backX, 0, backZ);
    }

    this.character.standUp(offset);
    this.currentSeat = null;

    if (this.sitButton) {
      this.sitButton.innerText = '🪑 DUDUK DI KURSI';
    }
    if (this.statusEl) {
      this.statusEl.textContent = 'Jelajahi Main Hall bebas menggunakan Joystick / WASD. Dekati kursi untuk duduk.';
    }
  }

  exitToGarden() {
    this.destroy();
    // Return to outdoor world right outside the restaurant doors, facing South
    gameState.setState({
      lastOutdoorPosition: { x: 0.0, y: 5.0, z: -14.0, rotY: Math.PI },
      gamePhase: PHASES.EXPLORATION
    });
  }

  init3D(mountEl) {
    if (!mountEl) return;
    const width = mountEl.clientWidth || window.innerWidth;
    const height = mountEl.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1f191f');

    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 80);

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const view = params ? params.get('view') : null;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    mountEl.appendChild(this.renderer.domElement);

    // Warm Ambient Lighting
    const ambientLight = new THREE.AmbientLight('#fff0db', 1.1);
    this.scene.add(ambientLight);

    // Directional Warm Light simulating interior chandeliers
    const dirLight = new THREE.DirectionalLight('#ffe2b8', 0.9);
    dirLight.position.set(0, 6, 2);
    this.scene.add(dirLight);

    // Dedicated Stage Spotlight illuminating Adjie & Daul on the Pelaminan
    const stageSpot = new THREE.SpotLight('#ffe8bf', 2.2, 16, Math.PI / 4, 0.4);
    stageSpot.position.set(0, 5.2, -10.5);
    stageSpot.target.position.set(0, 1.5, -14.2);
    this.scene.add(stageSpot);
    this.scene.add(stageSpot.target);

    this.hallGroup = new THREE.Group();
    this.scene.add(this.hallGroup);

    this.buildMainHallGeometry();
    this.buildBrideAndGroomPelaminan();
    this.buildSeatedWeddingGuests();

    // -------------------------------------------------------------
    // FULLY EXPLORABLE PLAYER CHARACTER CONTROLLER
    // -------------------------------------------------------------
    this.character = new CharacterController(this.scene);
    this.character.setCustomHeightChecker(() => 0.0);
    this.character.setCustomCollisionChecker((x, z) => this.checkInteriorCollision(x, z));

    // Initial character position & camera framing
    if (view === 'pelaminan') {
      this.character.mesh.position.set(0, 0.0, -9.5);
      this.character.mesh.rotation.y = 0;
      this.cameraYaw = 0.0;
      this.cameraPitch = 0.18;
      this.cameraRadius = 5.0;
    } else if (view === 'seated_guests') {
      this.character.mesh.position.set(0, 0.0, -3.0);
      this.character.mesh.rotation.y = -Math.PI / 2;
      this.cameraYaw = 1.2;
    } else if (view === 'player_sitting') {
      const seatA = this.allSeats.find(s => !s.isOccupiedByNPC) || this.allSeats[0];
      if (seatA) {
        this.sitAtSeat(seatA);
      }
      this.cameraYaw = 0.6;
    } else {
      // Grand entrance spawn near South double doors, facing Pelaminan North
      this.character.mesh.position.set(0, 0.0, 3.2);
      this.character.mesh.rotation.y = 0;
      this.cameraYaw = 0.0;
      this.cameraPitch = 0.22;
      this.cameraRadius = 4.8;
    }
    this.targetYaw = this.cameraYaw;
    this.targetPitch = this.cameraPitch;

    // Start Realtime Gameplay & Render Loop
    this.startControlsLoop();

    this.handleResize = () => {
      if (!this.container || !this.renderer || !this.camera) return;
      const w = mountEl.clientWidth || window.innerWidth;
      const h = mountEl.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this.handleResize);
  }

  checkInteriorCollision(x, z) {
    // 1. Perimeter Walls: roomW = 24.0 (x in [-11.2, 11.2]), roomL = 26.0 (z in [-15.0, 9.0])
    if (Math.abs(x) > 11.2) return true;
    if (z < -15.0 || z > 9.0) return true;

    // 2. Pelaminan Stage Riser: x in [-4.4, 4.4], z in [-15.8, -12.4]
    if (Math.abs(x) < 4.4 && z < -12.4) return true;

    // 3. Banquet Tables (4 tables, radius ~1.65m)
    const tables = [
      [-5.0, -6.0], [5.0, -6.0],
      [-5.0, 1.0], [5.0, 1.0]
    ];
    for (const [tx, tz] of tables) {
      if (Math.hypot(x - tx, z - tz) < 1.65) return true;
    }

    // 4. Structural Columns (6 columns at x = +/- 7.0, z = -11.0, -2.0, 6.0)
    for (const cx of [-7.0, 7.0]) {
      for (const cz of [-11.0, -2.0, 6.0]) {
        if (Math.hypot(x - cx, z - cz) < 0.65) return true;
      }
    }

    // 5. Seated NPC Guests (can't walk into someone already sitting)
    for (const s of this.allSeats) {
      if (s.isOccupiedByNPC && Math.hypot(x - s.x, z - s.z) < 0.65) {
        return true;
      }
    }

    return false;
  }

  startControlsLoop() {
    const loop = () => {
      this.animationFrameId = requestAnimationFrame(loop);

      // 1. Process Player Movement (Camera-Relative)
      if (this.character && this.controls) {
        if (this.isSitting) {
          const { dx, dy, jump } = this.controls.getMovementVector();
          if (Math.abs(dx) > 0.08 || Math.abs(dy) > 0.08 || jump) {
            this.standUp();
          }
        } else {
          const { dx, dy, intensity, jump } = this.controls.getMovementVector();
          this.character.move(dx, dy, intensity, jump, this.camera);
        }
        this.character.update();
      }

      // 2. Third-Person Camera Soft-Follow with Interior Boundary Clamping
      if (this.character && this.camera) {
        this.cameraYaw += (this.targetYaw - this.cameraYaw) * 0.12;
        this.cameraPitch += (this.targetPitch - this.cameraPitch) * 0.12;

        const charPos = this.character.getPosition();
        const aspect = this.camera.aspect || 1.0;
        const lookHeight = 1.05;
        const lookTarget = new THREE.Vector3(charPos.x, charPos.y + lookHeight, charPos.z);

        const currentRadius = aspect < 1.0 ? this.cameraRadius * 1.35 : this.cameraRadius;
        const curOffsetX = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * currentRadius;
        const curOffsetY = Math.sin(this.cameraPitch) * currentRadius + 0.65;
        const curOffsetZ = Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * currentRadius;

        let desiredX = charPos.x + curOffsetX;
        let desiredY = charPos.y + curOffsetY;
        let desiredZ = charPos.z + curOffsetZ;

        // Interior wall & ceiling safety clamp (prevent clipping into exterior)
        desiredX = Math.max(-11.2, Math.min(11.2, desiredX));
        desiredY = Math.max(0.7, Math.min(5.2, desiredY));
        desiredZ = Math.max(-15.2, Math.min(9.4, desiredZ));

        this.camera.position.set(desiredX, desiredY, desiredZ);
        this.camera.lookAt(lookTarget);
      }

      // 3. Proximity Detection: Chairs & Exit Door
      this.updateProximity();

      // 4. Render Scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    loop();
  }

  updateProximity() {
    if (!this.character) return;
    const charPos = this.character.getPosition();

    // Check Exit Door proximity (South double doors at x: 0, z: 9.0)
    const distToDoor = Math.hypot(charPos.x - 0.0, charPos.z - 9.0);
    if (distToDoor < 2.5) {
      this.isNearExit = true;
      this.nearbySeat = null;

      if (!this.isSitting) {
        if (this.sitButton) {
          this.sitButton.innerText = '🌿 KELUAR KE KEBUN';
        }
        if (this.promptEl) {
          this.promptEl.innerHTML = `
            <div class="prompt-icon">🌿</div>
            <div class="prompt-text">
              <strong>Pintu Keluar ke Kebun Hachi</strong>
              <span>Tap / Tekan [E] untuk Kembali ke Kebun</span>
            </div>
          `;
          this.promptEl.classList.remove('hidden');
        }
      }
      return;
    }
    this.isNearExit = false;

    // Check Vacant Seats proximity
    let closestSeat = null;
    let minDist = 1.7; // Interactive seat radius

    for (const seat of this.allSeats) {
      if (seat.isOccupiedByNPC) continue;
      const d = Math.hypot(charPos.x - seat.x, charPos.z - seat.z);
      if (d < minDist) {
        minDist = d;
        closestSeat = seat;
      }
    }

    this.nearbySeat = closestSeat;

    if (this.isSitting) {
      if (this.sitButton) this.sitButton.innerText = '🚶 BERDIRI KEMBALI';
    } else if (this.nearbySeat) {
      if (this.sitButton) this.sitButton.innerText = `🪑 DUDUK DI KURSI ${this.nearbySeat.id}`;
      if (this.promptEl) {
        const vipTag = this.nearbySeat.isReservedForPlayer ? ' <span style="color:#ffd700;">★ VIP</span>' : '';
        this.promptEl.innerHTML = `
          <div class="prompt-icon" style="font-size: 16px;">🪑</div>
          <div class="prompt-text" style="font-size: 11px; line-height: 1.3;">
            <div style="font-weight: bold; color: #fff;">Kursi ${this.nearbySeat.id} (${this.nearbySeat.label})${vipTag}</div>
            <div style="font-size: 10px; color: #ffbe97;">Tap atau Tekan [E] untuk Duduk</div>
          </div>
        `;
        this.promptEl.classList.remove('hidden');
      }
    } else {
      if (this.sitButton) this.sitButton.innerText = '🪑 DUDUK DI KURSI';
      if (this.promptEl) {
        this.promptEl.classList.add('hidden');
      }
    }
  }

  buildMainHallGeometry() {
    const woodTexture = TextureFactory.createWoodTexture(512);

    const floorMat = new THREE.MeshLambertMaterial({ map: woodTexture, color: '#6e4425' });
    const ceilingMat = new THREE.MeshLambertMaterial({ color: '#e8dec8' });
    const woodRafterMat = new THREE.MeshLambertMaterial({ map: woodTexture, color: '#362111' });
    const wainscotMat = new THREE.MeshLambertMaterial({ map: woodTexture, color: '#422817' });
    const wallPlasterMat = new THREE.MeshLambertMaterial({ color: '#f0e8dc' });
    const baseboardMat = new THREE.MeshLambertMaterial({ color: '#2b180a' });
    const windowFrameMat = new THREE.MeshLambertMaterial({ color: '#261609' });
    const windowGlassMat = new THREE.MeshLambertMaterial({ color: '#ffe0b2', transparent: true, opacity: 0.65 });

    const roomW = 24.0;
    const roomL = 26.0;
    const roomH = 5.8;

    // 1. Solid Parquet Floor (y = 0.0)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomL), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -3.0);
    this.hallGroup.add(floor);

    // Red Velvet Runner Carpet down center aisle
    const carpetMat = new THREE.MeshLambertMaterial({ color: '#881b28' });
    const runner = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 22.0), carpetMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(0, 0.015, -2.5);
    this.hallGroup.add(runner);

    // Gold braided runner border
    const goldLineMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    [-1.6, 1.6].forEach(gx => {
      const gLine = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 22.0), goldLineMat);
      gLine.rotation.x = -Math.PI / 2;
      gLine.position.set(gx, 0.02, -2.5);
      this.hallGroup.add(gLine);
    });

    // 2. Solid Ceiling (y = 5.8)
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomL), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, roomH, -3.0);
    this.hallGroup.add(ceiling);

    // Timber Rafters & Beams
    for (let x = -10.0; x <= 10.0; x += 4.0) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, roomL), woodRafterMat);
      beam.position.set(x, roomH - 0.22, -3.0);
      this.hallGroup.add(beam);
    }
    for (let z = -14.0; z <= 8.0; z += 4.5) {
      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.45, 0.32), woodRafterMat);
      crossBeam.position.set(0, roomH - 0.22, z);
      this.hallGroup.add(crossBeam);
    }

    // Helper: Build Layered Wall
    const buildEnclosingWall = (x, z, width, length, rotY = 0) => {
      const wallGroup = new THREE.Group();
      wallGroup.position.set(x, 0, z);
      wallGroup.rotation.y = rotY;

      const span = length || width;

      const bb = new THREE.Mesh(new THREE.BoxGeometry(span, 0.20, 0.14), baseboardMat);
      bb.position.set(0, 0.10, 0);
      wallGroup.add(bb);

      const wainscot = new THREE.Mesh(new THREE.BoxGeometry(span, 1.50, 0.10), wainscotMat);
      wainscot.position.set(0, 0.95, 0);
      wallGroup.add(wainscot);

      const chairRail = new THREE.Mesh(new THREE.BoxGeometry(span, 0.10, 0.14), baseboardMat);
      chairRail.position.set(0, 1.75, 0);
      wallGroup.add(chairRail);

      const upperWall = new THREE.Mesh(new THREE.BoxGeometry(span, roomH - 1.80, 0.08), wallPlasterMat);
      upperWall.position.set(0, 1.80 + (roomH - 1.80) / 2, 0);
      wallGroup.add(upperWall);

      const crown = new THREE.Mesh(new THREE.BoxGeometry(span, 0.18, 0.18), baseboardMat);
      crown.position.set(0, roomH - 0.09, 0);
      wallGroup.add(crown);

      this.hallGroup.add(wallGroup);
    };

    // 4 Perimeter Walls
    buildEnclosingWall(0, -16.0, roomW, roomW, 0);
    buildEnclosingWall(0, 10.0, roomW, roomW, Math.PI);
    buildEnclosingWall(-12.0, -3.0, 0, roomL, Math.PI / 2);
    buildEnclosingWall(12.0, -3.0, 0, roomL, -Math.PI / 2);

    // -------------------------------------------------------------
    // SOUTH ENTRANCE / EXIT DOUBLE DOORS (z = 9.85)
    // -------------------------------------------------------------
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 0, 9.85);

    // Arched Timber Frame
    const doorFrameMat = new THREE.MeshLambertMaterial({ color: '#2b180a' });
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.4, 0.25), doorFrameMat);
    doorFrame.position.set(0, 1.7, 0);
    doorGroup.add(doorFrame);

    // Double Mahogany Doors with Carved Panels
    const doorPanelMat = new THREE.MeshLambertMaterial({ color: '#4a2810' });
    [-0.85, 0.85].forEach((dx) => {
      const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.1, 0.12), doorPanelMat);
      doorLeaf.position.set(dx, 1.55, -0.05);
      doorGroup.add(doorLeaf);

      // Gold Brass Door Handle
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), goldLineMat);
      handle.position.set(dx > 0 ? dx - 0.55 : dx + 0.55, 1.45, -0.15);
      doorGroup.add(handle);
    });

    // Exit Signboard above door
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.45, 0.08), new THREE.MeshLambertMaterial({ color: '#16141a' }));
    signBoard.position.set(0, 3.65, -0.12);
    doorGroup.add(signBoard);

    const signText = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.10), goldLineMat);
    signText.position.set(0, 3.65, -0.16);
    doorGroup.add(signText);

    this.hallGroup.add(doorGroup);

    // Arched French Windows
    for (let z = -12.0; z <= 6.0; z += 6.0) {
      [-11.92, 11.92].forEach(wx => {
        const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 2.2), windowFrameMat);
        winFrame.position.set(wx, 3.2, z);
        this.hallGroup.add(winFrame);

        const winGlass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.4, 2.0), windowGlassMat);
        winGlass.position.set(wx, 3.2, z);
        this.hallGroup.add(winGlass);
      });
    }

    // Structural Timber Columns
    for (let x of [-7.0, 7.0]) {
      for (let z of [-11.0, -2.0, 6.0]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, roomH, 0.55), woodRafterMat);
        col.position.set(x, roomH / 2, z);
        this.hallGroup.add(col);

        const base = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.75), baseboardMat);
        base.position.set(x, 0.175, z);
        this.hallGroup.add(base);

        const capital = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.30, 0.75), baseboardMat);
        capital.position.set(x, roomH - 0.15, z);
        this.hallGroup.add(capital);
      }
    }

    // Woven Rattan Basket Chandeliers with Warm Glow
    const rattanMat = new THREE.MeshLambertMaterial({ color: '#c48943', emissive: 0x5a3810 });
    const cordMat = new THREE.MeshBasicMaterial({ color: '#1a1a1a' });
    const lampPositions = [
      [-5.0, -6.0], [5.0, -6.0],
      [-5.0, 1.0], [5.0, 1.0],
      [0.0, -11.0], [0.0, -2.5]
    ];
    lampPositions.forEach(([lx, lz]) => {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8), cordMat);
      cord.position.set(lx, roomH - 0.9, lz);
      this.hallGroup.add(cord);

      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.72, 0.85, 12, 1, true), rattanMat);
      shade.position.set(lx, roomH - 1.8, lz);
      this.hallGroup.add(shade);

      const pLight = new THREE.PointLight('#ffba54', 1.3, 9.0);
      pLight.position.set(lx, roomH - 1.9, lz);
      this.scene.add(pLight);
    });
  }

  buildBrideAndGroomPelaminan() {
    const woodTexture = TextureFactory.createWoodTexture(256);
    const stageRiserMat = new THREE.MeshLambertMaterial({ map: woodTexture, color: '#4a2b16' });
    const stageCarpetMat = new THREE.MeshLambertMaterial({ color: '#c99a5e' });
    const goldTrimMat = new THREE.MeshLambertMaterial({ color: '#d4af37', emissive: 0x332600 });
    const sofaMat = new THREE.MeshLambertMaterial({ color: '#fbf8f2' });

    // 1. Stage Riser (z = -14.2)
    const stageRiser = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.32, 3.4), stageRiserMat);
    stageRiser.position.set(0, 0.16, -14.2);
    this.hallGroup.add(stageRiser);

    const stageCarpet = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.04, 3.1), stageCarpetMat);
    stageCarpet.position.set(0, 0.34, -14.2);
    this.hallGroup.add(stageCarpet);

    // 2. Floral Arch & Backdrop Screen
    const screen = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.4, 0.15), new THREE.MeshLambertMaterial({ color: '#f7f2ea' }));
    screen.position.set(0, 2.0, -15.6);
    this.hallGroup.add(screen);

    const goldArch = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.08, 8, 24, Math.PI), goldTrimMat);
    goldArch.position.set(0, 3.2, -15.5);
    this.hallGroup.add(goldArch);

    // 3. Monogram Plaque: ADJIE & DAUL
    const monoBoard = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.70, 0.08), new THREE.MeshLambertMaterial({ color: '#1a1820' }));
    monoBoard.position.set(0, 4.4, -15.5);
    this.hallGroup.add(monoBoard);

    const monoText = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.28, 0.10), goldTrimMat);
    monoText.position.set(0, 4.4, -15.42);
    this.hallGroup.add(monoText);

    // 4. Cream Velvet Loveseat Sofa
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.42, 0.88), sofaMat);
    sofaBase.position.set(0, 0.53, -14.2);
    this.hallGroup.add(sofaBase);

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.65, 0.22), sofaMat);
    sofaBack.position.set(0, 0.95, -14.52);
    this.hallGroup.add(sofaBack);

    [-1.3, 1.3].forEach(ax => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 0.88), sofaMat);
      arm.position.set(ax, 0.80, -14.2);
      this.hallGroup.add(arm);
    });

    // 5. Floral Pillars & Bouquets
    const flowerPinkMat = new THREE.MeshLambertMaterial({ color: '#f28b9b' });
    const flowerWhiteMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    [-3.2, 3.2].forEach(fx => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.30, 2.2, 12), stageRiserMat);
      pillar.position.set(fx, 1.4, -14.2);
      this.hallGroup.add(pillar);

      const bouquet = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55), flowerPinkMat);
      bouquet.position.set(fx, 2.7, -14.2);
      this.hallGroup.add(bouquet);
    });

    // 6. REALISTIC 3D ADJIE & DAUL SEATED ON PELAMINAN
    // Groom (Adjie): Tailored Royal Beskap, Traditional Peci Cap, Golden Brooch
    const groomAvatar = new Avatar3D({
      skinColor: '#f1c27d',
      hairColor: '#1a1820',
      hairStyle: 'cap',
      outfit: 'traditional_gold',
      accessory: 'none'
    });
    groomAvatar.shadow.visible = false;
    groomAvatar.setSitting(true);
    // Sofa cushion is at y = 0.74, stage at 0.34. Placing mesh at y = 0.28 aligns thighs perfectly on cushion
    groomAvatar.group.position.set(0.62, 0.28, -14.15);
    this.hallGroup.add(groomAvatar.group);

    // Bride (Daul): Royal Bridal Gown / Kebaya with Gold Suntiang Crown & Jasmine Ear Bloom
    const brideAvatar = new Avatar3D({
      skinColor: '#ffdbac',
      hairColor: '#1a1820',
      hairStyle: 'bun',
      outfit: 'dress',
      accessory: 'crown'
    });
    brideAvatar.shadow.visible = false;
    brideAvatar.setSitting(true);
    brideAvatar.group.position.set(-0.62, 0.28, -14.15);
    this.hallGroup.add(brideAvatar.group);
  }

  buildSeatedWeddingGuests() {
    const tableclothMat = new THREE.MeshLambertMaterial({ color: '#fbf9f2' });
    const chairGoldMat = new THREE.MeshLambertMaterial({ color: '#c49a38' });
    const cushionMat = new THREE.MeshLambertMaterial({ color: '#eee5d3' });
    const dishMat = new THREE.MeshLambertMaterial({ color: '#fcfcfc' });
    const gobletMat = new THREE.MeshLambertMaterial({ color: '#dcedf5', transparent: true, opacity: 0.75 });
    const flowerPinkMat = new THREE.MeshLambertMaterial({ color: '#f28b9b' });
    const vipMat = new THREE.MeshLambertMaterial({ color: '#ffd700', emissive: 0x443300 });

    const guestStyles = [
      { outfit: 'traditional_gold', hair: '#141416', hairStyle: 'short', skin: '#f1c27d', accessory: 'none' },
      { outfit: 'traditional_maroon', hair: '#2a1a10', hairStyle: 'hijab', skin: '#ffdbac', accessory: 'none' },
      { outfit: 'tuxedo', hair: '#1a1820', hairStyle: 'short', skin: '#e0ac69', accessory: 'glasses' },
      { outfit: 'dress', hair: '#222228', hairStyle: 'wavy', skin: '#f1c27d', accessory: 'flower' },
      { outfit: 'traditional_gold', hair: '#181210', hairStyle: 'cap', skin: '#8d5524', accessory: 'none' },
      { outfit: 'traditional_maroon', hair: '#1a1820', hairStyle: 'bun', skin: '#ffdbac', accessory: 'flower' },
      { outfit: 'tuxedo', hair: '#281c14', hairStyle: 'short', skin: '#e0ac69', accessory: 'none' },
      { outfit: 'dress', hair: '#141416', hairStyle: 'hijab', skin: '#f1c27d', accessory: 'none' }
    ];

    const tables = [
      { name: 'Meja A (Keluarga VIP)', coords: [-5.0, -6.0], prefix: 'A' },
      { name: 'Meja B (Keluarga VIP)', coords: [5.0, -6.0], prefix: 'B' },
      { name: 'Meja C (Sahabat & Teman)', coords: [-5.0, 1.0], prefix: 'C' },
      { name: 'Meja D (Sahabat & Teman)', coords: [5.0, 1.0], prefix: 'D' }
    ];

    const state = gameState.getState();
    const rsvpSeats = (state.rsvpData && state.rsvpData.seat_ids) || [];

    this.allSeats = [];
    let guestIdx = 0;

    tables.forEach((tInfo, tIndex) => {
      const [tx, tz] = tInfo.coords;

      // Banquet Table
      const table = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.40, 0.76, 20), tableclothMat);
      table.position.set(tx, 0.38, tz);
      this.hallGroup.add(table);

      // Centerpiece Vase
      const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.38, 10), new THREE.MeshLambertMaterial({ color: '#ffffff' }));
      vase.position.set(tx, 0.95, tz);
      this.hallGroup.add(vase);

      const floral = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32), flowerPinkMat);
      floral.position.set(tx, 1.25, tz);
      this.hallGroup.add(floral);

      // Table settings
      for (let p = 0; p < 4; p++) {
        const plateAngle = (p * Math.PI) / 2 + 0.35;
        const px = tx + Math.cos(plateAngle) * 0.95;
        const pz = tz + Math.sin(plateAngle) * 0.95;

        const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 12), dishMat);
        plate.position.set(px, 0.77, pz);
        this.hallGroup.add(plate);

        const goblet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.14, 8), gobletMat);
        goblet.position.set(px + 0.12, 0.83, pz - 0.1);
        this.hallGroup.add(goblet);
      }

      // 4 Chiavari Chairs per table
      for (let c = 0; c < 4; c++) {
        const chairAngle = (c * Math.PI) / 2;
        const cx = tx + Math.cos(chairAngle) * 1.85;
        const cz = tz + Math.sin(chairAngle) * 1.85;
        const faceTableAngle = Math.atan2(tx - cx, tz - cz);

        // Distribute seats: Chairs 0 and 2 have NPC guests; Chairs 1 and 3 are VACANT for players!
        const isOccupiedByNPC = (c === 0 || c === 2);
        const seatId = `${tInfo.prefix}${c + 1}`;
        const isReservedForPlayer = rsvpSeats.includes(seatId);

        const seatRecord = {
          id: seatId,
          tableIndex: tIndex,
          chairIndex: c,
          label: `${tInfo.name} - Kursi ${c + 1}`,
          x: cx,
          y: 0.44,
          z: cz,
          faceAngle: faceTableAngle,
          isOccupiedByNPC: isOccupiedByNPC,
          isReservedForPlayer: isReservedForPlayer
        };
        this.allSeats.push(seatRecord);

        const chairGroup = new THREE.Group();
        chairGroup.position.set(cx, 0, cz);
        chairGroup.rotation.y = faceTableAngle;

        // Seat Cushion
        const padMat = isReservedForPlayer ? vipMat : cushionMat;
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.46), padMat);
        seat.position.y = 0.44;
        chairGroup.add(seat);

        // 4 Spindle Legs
        [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].forEach(([lx, lz]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.016, 0.44, 6), chairGoldMat);
          leg.position.set(lx, 0.22, lz);
          chairGroup.add(leg);
        });

        // Backrest
        const backPostL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.52, 6), chairGoldMat);
        backPostL.position.set(-0.19, 0.70, -0.20);
        chairGroup.add(backPostL);

        const backPostR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.52, 6), chairGoldMat);
        backPostR.position.set(0.19, 0.70, -0.20);
        chairGroup.add(backPostR);

        for (let s = 0; s < 3; s++) {
          const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.38, 6), chairGoldMat);
          spindle.rotation.z = Math.PI / 2;
          spindle.position.set(0, 0.56 + s * 0.14, -0.20);
          chairGroup.add(spindle);
        }

        this.hallGroup.add(chairGroup);

        // Populate Realistic NPC Guest if occupied
        if (isOccupiedByNPC) {
          const style = guestStyles[guestIdx % guestStyles.length];
          guestIdx++;
          const guestAvatar = new Avatar3D({
            skinColor: style.skin,
            hairColor: style.hair,
            hairStyle: style.hairStyle,
            outfit: style.outfit,
            accessory: style.accessory
          });
          guestAvatar.shadow.visible = false;
          guestAvatar.setSitting(true);
          // Chair cushion is at y = 0.44. Align thighs on cushion: 0.44 - 0.46 = -0.02
          guestAvatar.group.position.set(cx, -0.02, cz);
          guestAvatar.group.rotation.y = faceTableAngle;
          this.hallGroup.add(guestAvatar.group);
        }
      }
    });
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('player-interact', this.handleInteractBound);
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
      this.handleResize = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
