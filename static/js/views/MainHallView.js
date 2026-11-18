import * as THREE from 'three';
import { gameState, PHASES } from '../state/GameState.js';
import { TextureFactory } from '../three/TextureFactory.js';
import { CharacterController } from '../three/CharacterController.js';
import { Controls } from '../game/Controls.js';
import { audioSystem } from '../game/AudioSystem.js';
import { Avatar3D } from '../characters/Avatar3D.js';
import { CHARACTER_ANIM_STATES } from '../characters/CharacterAnimator.js';
import { computeSeatingRigPose } from '../characters/SeatingAnchor.js';
import {
  OUTDOOR_EXIT_SPAWN,
  MAIN_HALL_INTRO_CONFIG,
  clampMainHallCameraPosition,
  interpolateSphericalReveal
} from '../three/CameraFraming.js';
import {
  detectSoftwareWebGL,
  configurePBRPipeline,
  scheduleAfterDraw,
  disposeSceneResources
} from '../three/WebGLUtils.js';

export class MainHallView {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;
    this._afterDrawHandle = null;
    this._isDestroyed = false;
    this._lastFrameTime = performance.now();
    this.isSoftwareGl = detectSoftwareWebGL();
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
    this.cameraPitch = 0.25;
    this.cameraRadius = 6.2;
    this.targetYaw = 0.0;
    this.targetPitch = 0.25;
    this.introCamera = null;
    this.interiorOccluders = [];
    this._occlusionRay = new THREE.Raycaster();
    this._rayDir = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();

    this.groomAvatar = null;
    this.brideAvatar = null;
    this.guestAvatars = [];

    this.statusPillEl = null;
    this.statusTextEl = null;
    this.sitButton = null;
    this._lastHudKey = '';
    this._windowCleanups = [];

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
    overlay.innerHTML = `
      <div class="main-hall-brand-card">
        <span class="main-hall-brand-title">ADJIE &amp; DAULIKA — THE HACHI GARDEN</span>
        <div id="hall-guest-label" class="main-hall-guest-label"></div>
      </div>
      <div class="main-hall-header-actions">
        <button id="hall-audio-btn" class="retro-btn retro-btn-secondary main-hall-audio-btn" title="Musik &amp; Suara" aria-label="Musik dan Suara">
          ${audioSystem.isMuted ? '🔇' : '🔊'}
        </button>
        <button id="hall-quick-exit-btn" class="retro-btn retro-btn-secondary main-hall-exit-btn">
          🌿 Keluar ke taman
        </button>
      </div>
    `;

    const guestLabelEl = overlay.querySelector('#hall-guest-label');
    if (guestLabelEl) {
      guestLabelEl.textContent = `Ramah Tamah • ${state.guestName || 'Tamu Undangan'}`;
    }

    const audioBtn = overlay.querySelector('#hall-audio-btn');
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

    overlay.querySelector('#hall-quick-exit-btn').addEventListener('click', () => {
      this.exitToGarden();
    });

    // 3. Single Compact Top-Center Contextual Status Pill (leaves bottom mobile controls 100% clear)
    this.statusPillEl = document.createElement('div');
    this.statusPillEl.className = 'main-hall-status-pill';
    this.statusPillEl.innerHTML = `
      <span id="hall-status-text">Dekati kursi kosong untuk duduk santai.</span>
      <button type="button" id="hall-contextual-btn" class="retro-btn" style="padding: 5px 10px; font-size: 9px; display: none;"></button>
    `;
    this.statusTextEl = this.statusPillEl.querySelector('#hall-status-text');
    this.sitButton = this.statusPillEl.querySelector('#hall-contextual-btn');
    this.sitButton.addEventListener('click', () => this.handleAction());

    this.container.appendChild(overlay);
    this.container.appendChild(this.statusPillEl);

    // 4. Controls: Virtual Joystick for Mobile & Keyboard WASD
    this.controls = new Controls();
    this.controls.createVirtualJoystick(this.container);

    // Listen for Action events from physical keys & virtual ACTION button
    window.addEventListener('player-interact', this.handleInteractBound);

    // Mouse / Touch Camera Orbit Listeners
    this.setupCameraOrbitListeners(canvasContainer);

    // 5. Initialize 3D Interior Environment
    requestAnimationFrame(() => {
      if (!this._isDestroyed) this.init3D(canvasContainer);
    });

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

    const onMouseMove = (e) => {
      if (!isMouseDown) return;
      this.introCamera = null;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      this.targetYaw += dx * 0.005;
      this.targetPitch += dy * 0.005;
      this.targetPitch = Math.max(0.10, Math.min(0.65, this.targetPitch));
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    mountEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.introCamera = null;
      const zoomSpeed = 0.0035;
      this.cameraRadius += e.deltaY * zoomSpeed;
      this.cameraRadius = Math.max(2.8, Math.min(12.0, this.cameraRadius));
    }, { passive: false });

    let touchLookId = null;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let initialPinchDist = null;
    let initialPinchRadius = 6.2;

    mountEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        this.introCamera = null;
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

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && initialPinchDist) {
        this.introCamera = null;
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
          this.introCamera = null;
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
    };

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

    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    this._windowCleanups.push(() => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    });
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

    this.character.sitOn(seat, seat.faceAngle, { cushionTopY: 0.475, supportFloorY: 0.0 });
    audioSystem.playChime(440);
    this._syncHudPill(`sit:${seat.id}`);
  }

  standUp() {
    if (!this.character) return;
    this.isSitting = false;
    audioSystem.playChime(523.25);

    const seat = this.currentSeat;
    let offset = null;
    if (seat) {
      const backX = -Math.sin(seat.faceAngle) * 0.35;
      const backZ = -Math.cos(seat.faceAngle) * 0.35;
      offset = new THREE.Vector3(backX, 0, backZ);
    }

    this.character.standUp(offset);
    this.currentSeat = null;
    this._syncHudPill('idle');
  }

  _syncHudPill(key) {
    if (key === this._lastHudKey || !this.statusTextEl || !this.sitButton) return;
    this._lastHudKey = key;

    if (this.isSitting && this.currentSeat) {
      this.statusTextEl.textContent = `Duduk di ${this.currentSeat.label}`;
      this.sitButton.textContent = 'Berdiri kembali';
      this.sitButton.style.display = 'inline-flex';
    } else if (this.isNearExit) {
      this.statusTextEl.textContent = 'Pintu keluar menuju The Hachi Garden';
      this.sitButton.textContent = '🌿 Keluar ke taman';
      this.sitButton.style.display = 'inline-flex';
    } else if (this.nearbySeat) {
      this.statusTextEl.textContent = `Kursi ${this.nearbySeat.id} (${this.nearbySeat.label})`;
      this.sitButton.textContent = 'Yuk, duduk sebentar';
      this.sitButton.style.display = 'inline-flex';
    } else {
      this.statusTextEl.textContent = 'Dekati kursi kosong untuk duduk santai.';
      this.sitButton.style.display = 'none';
    }
  }

  exitToGarden() {
    this.destroy();
    gameState.setState({
      lastOutdoorPosition: { ...OUTDOOR_EXIT_SPAWN },
      gamePhase: PHASES.EXPLORATION
    });
  }

  init3D(mountEl) {
    if (!mountEl || this._isDestroyed) return;
    const width = mountEl.clientWidth || window.innerWidth;
    const height = mountEl.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1f191f');

    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 80);

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const view = params ? params.get('view') : null;

    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isSoftwareGl, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.domElement.dataset.testid = 'mainhall-webgl-canvas';
    mountEl.appendChild(this.renderer.domElement);

    configurePBRPipeline(this.renderer, this.scene, this.isSoftwareGl);

    // Warm Ambient Lighting
    const ambientLight = new THREE.AmbientLight('#fff0db', 1.1);
    this.scene.add(ambientLight);

    // Directional Warm Light simulating interior chandeliers
    const dirLight = new THREE.DirectionalLight('#ffe2b8', 0.9);
    dirLight.position.set(0, 6, 2);
    this.scene.add(dirLight);

    // Dedicated Stage Spotlight illuminating Adjie & Daulika on the Pelaminan
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

    this.character = new CharacterController(this.scene);
    this.character.setCustomHeightChecker(() => 0.0);
    this.character.setCustomCollisionChecker((x, z) => this.checkInteriorCollision(x, z));

    if (view === 'pelaminan') {
      this.character.mesh.position.set(1.45, 0.0, -9.8);
      this.character.mesh.rotation.y = 0.25;
      this.cameraYaw = 0.12;
      this.cameraPitch = 0.16;
      this.cameraRadius = 5.2;
    } else if (view === 'seated_guests') {
      this.character.mesh.position.set(0, 0.0, -3.0);
      this.character.mesh.rotation.y = -Math.PI / 2;
      this.cameraYaw = 1.2;
      this.cameraRadius = 6.2;
    } else if (view === 'player_sitting') {
      const seatA = this.allSeats.find(s => !s.isOccupiedByNPC) || this.allSeats[0];
      if (seatA) {
        this.sitAtSeat(seatA);
      }
      this.cameraYaw = 0.6;
      this.cameraRadius = 5.6;
    } else {
      this.character.mesh.position.set(0, 0.0, 3.2);
      this.character.mesh.rotation.y = 0;
      this.cameraYaw = MAIN_HALL_INTRO_CONFIG.startYaw;
      this.cameraPitch = MAIN_HALL_INTRO_CONFIG.startPitch;
      this.cameraRadius = MAIN_HALL_INTRO_CONFIG.startRadius;
      this.introCamera = {
        elapsed: 0,
        duration: MAIN_HALL_INTRO_CONFIG.duration
      };
    }
    this.targetYaw = this.introCamera ? MAIN_HALL_INTRO_CONFIG.endYaw : this.cameraYaw;
    this.targetPitch = this.introCamera ? MAIN_HALL_INTRO_CONFIG.endPitch : this.cameraPitch;

    // Position initial camera cleanly before first frame to avoid single-frame snap
    if (this.character && this.camera) {
      const charPos = this.character.getPosition();
      const aspect = this.camera.aspect || 1.0;
      const startRad = aspect < 1.0 ? this.cameraRadius * 1.25 : this.cameraRadius;
      const clampedInit = clampMainHallCameraPosition({
        x: charPos.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * startRad,
        y: charPos.y + Math.sin(this.cameraPitch) * startRad + 0.65,
        z: charPos.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * startRad
      });
      this.camera.position.set(clampedInit.x, clampedInit.y, clampedInit.z);
      this.camera.lookAt(charPos.x, charPos.y + 1.15, charPos.z);
    }

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
    this._lastFrameTime = performance.now();

    const step = () => {
      if (this._isDestroyed) return;
      const now = performance.now();
      const rawDelta = (now - this._lastFrameTime) / 1000;
      this._lastFrameTime = now;
      const delta = Math.max(0.001, Math.min(0.05, rawDelta || 0.016));
      const dtScale = Math.min(3.0, Math.max(0.2, delta * 60));

      // 1. Process Player Movement (Camera-Relative)
      if (this.character && this.controls) {
        if (this.isSitting) {
          const { dx, dy, jump } = this.controls.getMovementVector();
          if (Math.abs(dx) > 0.08 || Math.abs(dy) > 0.08 || jump) {
            this.standUp();
          }
        } else {
          const { dx, dy, intensity, jump } = this.controls.getMovementVector();
          if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || jump) {
            this.introCamera = null;
          }
          this.character.move(dx, dy, intensity, jump, this.camera);
        }
        this.character.update(delta);
      }

      // 1b. Update Pelaminan Couple & Seated Guest Animations
      if (this.groomAvatar) {
        this.groomAvatar.updateAnimation(CHARACTER_ANIM_STATES.SITTING, delta, now * 0.001);
      }
      if (this.brideAvatar) {
        this.brideAvatar.updateAnimation(CHARACTER_ANIM_STATES.SITTING, delta, now * 0.001);
      }
      for (const guest of this.guestAvatars) {
        guest.updateAnimation(CHARACTER_ANIM_STATES.SITTING, delta, now * 0.001);
      }

      // 2. Smooth Elevated 3/4 Intro -> Third-Person Follow with Boundary Clamping & Column Avoidance
      if (this.character && this.camera) {
        if (this.introCamera) {
          this.introCamera.elapsed += delta;
          const progress = Math.min(1.0, this.introCamera.elapsed / Math.max(0.1, this.introCamera.duration));
          const reveal = interpolateSphericalReveal(MAIN_HALL_INTRO_CONFIG, progress);
          this.cameraYaw = reveal.yaw;
          this.targetYaw = reveal.yaw;
          this.cameraPitch = reveal.pitch;
          this.targetPitch = reveal.pitch;
          this.cameraRadius = reveal.radius;
          if (progress >= 1.0) {
            this.introCamera = null;
          }
        }

        const lerpAmt = Math.min(1, 0.12 * dtScale);
        this.cameraYaw += (this.targetYaw - this.cameraYaw) * lerpAmt;
        this.cameraPitch += (this.targetPitch - this.cameraPitch) * lerpAmt;

        const charPos = this.character.getPosition();
        const aspect = this.camera.aspect || 1.0;
        const lookHeight = this.introCamera ? 1.25 : 1.05;
        this._lookTarget.set(charPos.x, charPos.y + lookHeight, charPos.z);

        let safeRadius = aspect < 1.0 ? this.cameraRadius * 1.28 : this.cameraRadius;
        const dirX = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch);
        const dirY = Math.sin(this.cameraPitch);
        const dirZ = Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch);

        // Obstruction check against structural columns inside Main Hall
        if (this.interiorOccluders.length > 0) {
          this._rayDir.set(dirX, dirY, dirZ).normalize();
          this._occlusionRay.set(this._lookTarget, this._rayDir);
          this._occlusionRay.near = 0.4;
          this._occlusionRay.far = safeRadius;

          const hits = this._occlusionRay.intersectObjects(this.interiorOccluders, false);
          if (hits.length > 0 && hits[0].distance >= 1.2) {
            safeRadius = Math.min(safeRadius, Math.max(2.2, hits[0].distance - 0.55));
          }
        }

        const clampedCam = clampMainHallCameraPosition({
          x: charPos.x + dirX * safeRadius,
          y: charPos.y + dirY * safeRadius + 0.65,
          z: charPos.z + dirZ * safeRadius
        });

        this.camera.position.lerp(
          this._rayDir.set(clampedCam.x, clampedCam.y, clampedCam.z),
          Math.min(1, 0.18 * dtScale)
        );
        this.camera.lookAt(this._lookTarget);
      }

      // 3. Proximity Detection: Chairs & Exit Door
      this.updateProximity();

      // 4. Render Scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      if (this.isSoftwareGl && this.renderer) {
        scheduleAfterDraw(this.renderer, step, (id) => {
          this._afterDrawHandle = id;
        });
      } else {
        this.animationFrameId = requestAnimationFrame(step);
      }
    };

    step();
  }

  updateProximity() {
    if (!this.character) return;
    const charPos = this.character.getPosition();

    // Check Exit Door proximity (South double doors at x: 0, z: 9.0)
    const distToDoor = Math.hypot(charPos.x - 0.0, charPos.z - 9.0);
    if (distToDoor < 2.5) {
      this.isNearExit = true;
      this.nearbySeat = null;
      this._syncHudPill(this.isSitting ? `sit:${this.currentSeat?.id || ''}` : 'exit');
      return;
    }
    this.isNearExit = false;

    let closestSeat = null;
    let minDist = 1.7;

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
      this._syncHudPill(`sit:${this.currentSeat?.id || ''}`);
    } else if (this.nearbySeat) {
      this._syncHudPill(`near:${this.nearbySeat.id}`);
    } else {
      this._syncHudPill('idle');
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

    // Structural Timber Columns (also registered for interior camera occlusion checks)
    for (let x of [-7.0, 7.0]) {
      for (let z of [-11.0, -2.0, 6.0]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, roomH, 0.55), woodRafterMat);
        col.position.set(x, roomH / 2, z);
        this.hallGroup.add(col);
        this.interiorOccluders.push(col);

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

    // 3. Monogram Plaque: ADJIE & DAULIKA
    const monoCanvas = document.createElement('canvas');
    monoCanvas.width = 512;
    monoCanvas.height = 96;
    const mctx = monoCanvas.getContext('2d');
    mctx.fillStyle = '#1a1820';
    mctx.fillRect(0, 0, 512, 96);
    mctx.strokeStyle = '#d4af37';
    mctx.lineWidth = 4;
    mctx.strokeRect(6, 6, 500, 84);
    mctx.fillStyle = '#f5e6a3';
    mctx.font = 'bold 34px Georgia, serif';
    mctx.textAlign = 'center';
    mctx.textBaseline = 'middle';
    mctx.fillText('ADJIE & DAULIKA', 256, 48);
    const monoTex = new THREE.CanvasTexture(monoCanvas);
    monoTex.colorSpace = THREE.SRGBColorSpace;

    const monoBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.72, 0.08),
      [
        goldTrimMat, goldTrimMat, goldTrimMat, goldTrimMat,
        new THREE.MeshLambertMaterial({ map: monoTex }),
        new THREE.MeshLambertMaterial({ map: monoTex })
      ]
    );
    monoBoard.position.set(0, 4.4, -15.48);
    this.hallGroup.add(monoBoard);

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
    [-3.2, 3.2].forEach(fx => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.30, 2.2, 12), stageRiserMat);
      pillar.position.set(fx, 1.4, -14.2);
      this.hallGroup.add(pillar);

      const bouquet = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55), flowerPinkMat);
      bouquet.position.set(fx, 2.7, -14.2);
      this.hallGroup.add(bouquet);
    });

    // 6. REALISTIC 3D ADJIE & DAULIKA SEATED ON PELAMINAN
    // Pelaminan seat cushion top is at y = 0.74, stage carpet surface at y = 0.36
    const groomPose = computeSeatingRigPose({
      cushionTopY: 0.74,
      supportFloorY: 0.36,
      seatCenterX: 0.62,
      seatCenterZ: -14.15,
      faceAngle: 0
    });
    const groomAvatar = new Avatar3D({
      skinColor: '#f1c27d',
      hairColor: '#1a1820',
      hairStyle: 'short',
      outfit: 'beskap_hitam',
      accessory: 'none'
    }, { role: 'groom', proceduralVersion: 'v3' });
    groomAvatar.shadow.visible = false;
    groomAvatar.setSitting(true, groomPose);
    groomAvatar.group.position.set(groomPose.rootPosition.x, groomPose.rootPosition.y, groomPose.rootPosition.z);
    this.hallGroup.add(groomAvatar.group);
    this.groomAvatar = groomAvatar;

    // Bride (Daulika): Elegant white kebaya with black natural hair (NO hijab)
    const bridePose = computeSeatingRigPose({
      cushionTopY: 0.74,
      supportFloorY: 0.36,
      seatCenterX: -0.62,
      seatCenterZ: -14.15,
      faceAngle: 0
    });
    const brideAvatar = new Avatar3D({
      skinColor: '#ffdbac',
      hairColor: '#1A1A24',
      hairStyle: 'long',
      outfit: 'kebaya_putih',
      accessory: 'flower'
    }, { role: 'bride', proceduralVersion: 'v3' });
    brideAvatar.shadow.visible = false;
    brideAvatar.setSitting(true, bridePose);
    brideAvatar.group.position.set(bridePose.rootPosition.x, bridePose.rootPosition.y, bridePose.rootPosition.z);
    this.hallGroup.add(brideAvatar.group);
    this.brideAvatar = brideAvatar;
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

        // Populate Realistic NPC Guest anchored via computeSeatingRigPose (no 40cm floating)
        if (isOccupiedByNPC) {
          const style = guestStyles[guestIdx % guestStyles.length];
          guestIdx++;
          const guestPose = computeSeatingRigPose({
            cushionTopY: 0.475,
            supportFloorY: 0.0,
            seatCenterX: cx,
            seatCenterZ: cz,
            faceAngle: faceTableAngle
          });
          const guestAvatar = new Avatar3D({
            skinColor: style.skin,
            hairColor: style.hair,
            hairStyle: style.hairStyle,
            outfit: style.outfit,
            accessory: style.accessory
          }, { role: 'guest', enableOptionalGlb: false, proceduralVersion: 'v3' });
          guestAvatar.shadow.visible = false;
          guestAvatar.setSitting(true, guestPose);
          guestAvatar.group.position.set(guestPose.rootPosition.x, guestPose.rootPosition.y, guestPose.rootPosition.z);
          guestAvatar.group.rotation.y = guestPose.faceAngle;
          this.hallGroup.add(guestAvatar.group);
          this.guestAvatars.push(guestAvatar);
        }
      }
    });
  }

  destroy() {
    this._isDestroyed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this._afterDrawHandle !== null) {
      clearTimeout(this._afterDrawHandle);
      this._afterDrawHandle = null;
    }
    window.removeEventListener('player-interact', this.handleInteractBound);
    while (this._windowCleanups.length > 0) {
      const cleanup = this._windowCleanups.pop();
      try { cleanup(); } catch {}
    }
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
      this.handleResize = null;
    }
    if (this.controls && typeof this.controls.destroy === 'function') {
      this.controls.destroy();
      this.controls = null;
    }
    if (this.character && typeof this.character.destroy === 'function') {
      this.character.destroy();
      this.character = null;
    }
    if (this.groomAvatar) {
      this.groomAvatar.dispose();
      this.groomAvatar = null;
    }
    if (this.brideAvatar) {
      this.brideAvatar.dispose();
      this.brideAvatar = null;
    }
    while (this.guestAvatars.length > 0) {
      const g = this.guestAvatars.pop();
      try { g.dispose(); } catch {}
    }
    if (this.scene) {
      disposeSceneResources(this.scene);
      this.scene = null;
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
