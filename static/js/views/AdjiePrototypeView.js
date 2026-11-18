import * as THREE from 'three';
import { Avatar3D } from '../characters/Avatar3D.js';
import { CHARACTER_ANIM_STATES } from '../characters/CharacterAnimator.js';
import { computeSeatingRigPose } from '../characters/SeatingAnchor.js';
import {
  ADJIE_PROTOTYPE_POSES,
  ADJIE_PROTOTYPE_VIEWS,
  STYLE_C_STANDARD
} from '../characters/CharacterPipeline.js';
import { ASSET_MANIFEST, fetchAssetStatus } from '../config/assetManifest.js';
import {
  configurePBRPipeline,
  detectSoftwareWebGL,
  disposeSceneResources,
  scheduleAfterDraw
} from '../three/WebGLUtils.js';

/**
 * AdjiePrototypeView - Stage B Groom Integration & Visual Inspection Studio
 * Only mounted when ?phase=adjie_prototype or ?view=adjie_prototype is explicitly opened.
 * Demonstrates Adjie (beskap_hitam) across Front, Side, Back, Three-Quarter camera angles
 * and Standing, Walking, Sitting poses while validating groom.glb readiness vs fallback.
 */
export class AdjiePrototypeView {
  constructor() {
    this.container = null;
    this.canvasWrap = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.avatar = null;
    this.chairGroup = null;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.isRunning = false;
    this._rafId = null;
    this._afterDrawHandle = null;
    this._lastFrameTime = performance.now();
    this._animElapsed = 0;

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initAngle = params ? params.get('angle') : null;
    const initPose = params ? params.get('pose') : null;
    const initAvatar = params ? params.get('avatar') : null;
    const initOutfit = params ? params.get('outfit') : null;
    const initHair = params ? params.get('hairStyle') : null;
    const initAcc = params ? params.get('accessory') : null;
    const initGender = params ? params.get('gender') : null;

    this.activeAngle = initAngle === 'closeup' || ADJIE_PROTOTYPE_VIEWS[initAngle] ? initAngle : 'three_quarter';
    this.activePose = ADJIE_PROTOTYPE_POSES[initPose] ? initPose : 'standing';
    this.proceduralVersion = initAvatar === 'v1' ? 'v1' : initAvatar === 'v2' ? 'v2' : 'v3';
    this.avatarConfig = {
      skinColor: '#f1c27d',
      hairColor: '#1a1820',
      hairStyle: initHair || 'short',
      outfit: initOutfit || 'beskap_hitam',
      accessory: initAcc || 'none',
      ...(initGender ? { gender: initGender } : {})
    };

    this._camTarget = new THREE.Vector3(0, 1.12, 0);
    this._camDesiredPos = new THREE.Vector3(2.2, 1.7, 2.8);
    this._diagTimer = null;
    this._fpsWindowFrames = 0;
    this._fpsWindowStart = performance.now();
    this._measuredFps = 0;
    this._onResize = () => this.handleResize();
  }

  render() {
    const root = document.createElement('div');
    root.className = 'adjie-prototype-shell';
    root.style.cssText = 'position:relative;width:100vw;height:100vh;overflow:hidden;background:#1e1918;font-family:var(--font-sans, sans-serif);';
    this.container = root;

    const canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    root.appendChild(canvasWrap);
    this.canvasWrap = canvasWrap;

    // Studio HUD (solid/alpha dark fill — zero backdrop-filter over WebGL)
    const hud = document.createElement('div');
    hud.style.cssText = 'position:absolute;top:16px;left:16px;right:16px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:12px;pointer-events:none;z-index:10;';
    hud.innerHTML = `
      <div style="pointer-events:auto;background:rgba(24,20,19,0.92);border:1px solid rgba(212,175,55,0.45);border-radius:10px;padding:12px 16px;color:#f7f2ea;max-width:460px;">
        <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#d4af37;font-weight:700;">Phase 16F — Clean Head & Hair Studio</div>
        <div style="font-size:17px;font-weight:700;margin-top:3px;">Adjie &amp; Daulika — Avatar Character Inspector</div>
        <div id="adjie-proto-status" style="font-size:12px;color:#e4dacb;margin-top:6px;line-height:1.45;">Menyiapkan karakter...</div>
        <div id="adjie-proto-telemetry" style="font-size:11px;color:#d4af37;margin-top:6px;font-family:monospace;">Calls: - | Tris: - | Geos: - | Tex: - | FPS: -</div>
      </div>
      <div style="pointer-events:auto;display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
        <div style="background:rgba(24,20,19,0.92);border:1px solid rgba(212,175,55,0.4);border-radius:10px;padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;" role="group" aria-label="Procedural Version">
          <span style="font-size:11px;color:#d4af37;font-weight:700;margin-right:4px;">MODEL:</span>
          <button type="button" data-proto-version="v1" style="padding:6px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(212,175,55,0.45);background:#2b2320;color:#f7f2ea;cursor:pointer;font-weight:600;">V1 Legacy</button>
          <button type="button" data-proto-version="v2" style="padding:6px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(212,175,55,0.45);background:#2b2320;color:#f7f2ea;cursor:pointer;font-weight:600;">V2 Smooth</button>
          <button type="button" data-proto-version="v3" style="padding:6px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(212,175,55,0.45);background:#2b2320;color:#f7f2ea;cursor:pointer;font-weight:600;">V3 Natural</button>
          <span style="width:1px;height:18px;background:rgba(212,175,55,0.3);margin:0 2px;"></span>
          <button type="button" data-proto-preset="male" style="padding:6px 9px;font-size:11px;border-radius:6px;border:1px solid rgba(212,175,55,0.45);background:#2b2320;color:#f7f2ea;cursor:pointer;font-weight:600;">Male</button>
          <button type="button" data-proto-preset="female" style="padding:6px 9px;font-size:11px;border-radius:6px;border:1px solid rgba(212,175,55,0.45);background:#2b2320;color:#f7f2ea;cursor:pointer;font-weight:600;">Female</button>
        </div>
        <div style="background:rgba(24,20,19,0.92);border:1px solid rgba(212,175,55,0.4);border-radius:10px;padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;" role="group" aria-label="Camera Angles">
          <span style="font-size:11px;color:#d4af37;font-weight:700;margin-right:4px;">VIEW:</span>
          <button type="button" data-proto-angle="closeup" style="padding:6px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(212,175,55,0.45);background:#2b2320;color:#f7f2ea;cursor:pointer;font-weight:600;">Face Close-Up</button>
          ${Object.values(ADJIE_PROTOTYPE_VIEWS).map((v) => `
            <button type="button" data-proto-angle="${v.id}" style="padding:6px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(212,175,55,0.45);background:#2b2320;color:#f7f2ea;cursor:pointer;font-weight:600;">${v.label}</button>
          `).join('')}
        </div>
        <div style="background:rgba(24,20,19,0.92);border:1px solid rgba(212,175,55,0.4);border-radius:10px;padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;" role="group" aria-label="Character Poses">
          <span style="font-size:11px;color:#d4af37;font-weight:700;margin-right:4px;">POSE:</span>
          ${Object.values(ADJIE_PROTOTYPE_POSES).map((p) => `
            <button type="button" data-proto-pose="${p.id}" style="padding:6px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(212,175,55,0.45);background:#2b2320;color:#f7f2ea;cursor:pointer;font-weight:600;">${p.label}</button>
          `).join('')}
        </div>
        <div style="background:rgba(24,20,19,0.92);border:1px solid rgba(212,175,55,0.4);border-radius:10px;padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
          <label style="font-size:11px;color:#d4af37;font-weight:700;">OUTFIT
            <select id="proto-outfit" aria-label="Outfit" style="margin-left:4px;background:#2b2320;color:#f7f2ea;border:1px solid rgba(212,175,55,0.4);border-radius:4px;padding:4px 6px;font-size:11px;">
              <option value="beskap_hitam">Beskap Hitam</option>
              <option value="kebaya_putih">Kebaya Putih</option>
              <option value="traditional_gold">Royal Gold</option>
              <option value="traditional_maroon">Royal Maroon</option>
              <option value="tuxedo">Tuxedo</option>
              <option value="dress">Bridal Dress</option>
            </select>
          </label>
          <label style="font-size:11px;color:#d4af37;font-weight:700;">HAIR
            <select id="proto-hair" aria-label="Hair Style" style="margin-left:4px;background:#2b2320;color:#f7f2ea;border:1px solid rgba(212,175,55,0.4);border-radius:4px;padding:4px 6px;font-size:11px;">
              <option value="short">Short</option>
              <option value="long">Long</option>
              <option value="wavy">Wavy</option>
              <option value="bun">Bun</option>
              <option value="hijab">Hijab</option>
              <option value="cap">Songkok</option>
            </select>
          </label>
          <label style="font-size:11px;color:#d4af37;font-weight:700;">ACC
            <select id="proto-acc" aria-label="Accessory" style="margin-left:4px;background:#2b2320;color:#f7f2ea;border:1px solid rgba(212,175,55,0.4);border-radius:4px;padding:4px 6px;font-size:11px;">
              <option value="none">None</option>
              <option value="glasses">Glasses</option>
              <option value="flower">Melati</option>
              <option value="crown">Crown</option>
            </select>
          </label>
        </div>
      </div>
    `;
    root.appendChild(hud);

    hud.querySelectorAll('[data-proto-version]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setProceduralVersion(btn.getAttribute('data-proto-version'));
      });
    });
    hud.querySelectorAll('[data-proto-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isFemale = btn.getAttribute('data-proto-preset') === 'female';
        this.updateAvatarConfig(isFemale
          ? { gender: 'female', outfit: 'kebaya_putih', hairStyle: 'long', accessory: 'flower' }
          : { gender: 'male', outfit: 'beskap_hitam', hairStyle: 'short', accessory: 'none' }
        );
      });
    });
    hud.querySelectorAll('[data-proto-angle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setAngle(btn.getAttribute('data-proto-angle'));
      });
    });
    hud.querySelectorAll('[data-proto-pose]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setPose(btn.getAttribute('data-proto-pose'));
      });
    });

    const outfitSel = hud.querySelector('#proto-outfit');
    const hairSel = hud.querySelector('#proto-hair');
    const accSel = hud.querySelector('#proto-acc');
    outfitSel.value = this.avatarConfig.outfit;
    hairSel.value = this.avatarConfig.hairStyle;
    accSel.value = this.avatarConfig.accessory;

    outfitSel.addEventListener('change', () => this.updateAvatarConfig({ outfit: outfitSel.value }));
    hairSel.addEventListener('change', () => this.updateAvatarConfig({ hairStyle: hairSel.value }));
    accSel.addEventListener('change', () => this.updateAvatarConfig({ accessory: accSel.value }));

    this.initScene();
    this._syncButtonHighlight();
    this.setAngle(this.activeAngle, true);
    this.setPose(this.activePose);
    this.start();
    this._refreshDiagnostics();
    this._diagTimer = setInterval(() => this._refreshDiagnostics(), 500);

    if (typeof window !== 'undefined') {
      window.__ADJIE_PROTO_DEBUG__ = {
        getStats: () => this._getRendererTelemetry(),
        setVersion: (v) => this.setProceduralVersion(v),
        setPose: (p) => this.setPose(p),
        setAngle: (a, snap = true) => this.setAngle(a, snap),
        setConfig: (partial) => this.updateAvatarConfig(partial),
        runDisposeStressTest: (iterations = 10) => this.runDisposeStressTest(iterations)
      };
    }

    return root;
  }

  initScene() {
    const width = this.canvasWrap.clientWidth || window.innerWidth;
    const height = this.canvasWrap.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isSoftwareGl, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.domElement.dataset.testid = 'adjie-prototype-canvas';
    this.canvasWrap.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#2a2321');
    this.scene.fog = new THREE.Fog('#2a2321', 10, 26);

    configurePBRPipeline(this.renderer, this.scene, this.isSoftwareGl);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    window.addEventListener('resize', this._onResize);

    // Golden-Hour Portrait Lighting
    const hemi = new THREE.HemisphereLight('#fff0de', '#3d2e27', 1.15);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight('#ffe4c4', 1.55);
    keyLight.position.set(2.8, 4.2, 3.5);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#ffd79a', 0.65);
    rimLight.position.set(-2.5, 3.0, -3.2);
    this.scene.add(rimLight);

    // Architectural Studio Pedestal & Floor Reference (0.05m vertical separation eliminates Z-fighting)
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(7.0, 48),
      new THREE.MeshStandardMaterial({ color: '#3b302b', roughness: 0.88, metalness: 0.04 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const dais = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.52, 0.05, 48),
      new THREE.MeshStandardMaterial({ color: '#c99a5e', roughness: 0.78, metalness: 0.05 })
    );
    dais.position.y = -0.025;
    dais.receiveShadow = true;
    this.scene.add(dais);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.48, 0.018, 12, 64),
      new THREE.MeshStandardMaterial({ color: '#d4af37', roughness: 0.3, metalness: 0.8 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.008;
    this.scene.add(ring);

    // Banquet/Pelaminan Reference Chair (cushionTopY = 0.475m over supportFloorY = 0)
    const chair = new THREE.Group();
    const cushionMat = new THREE.MeshStandardMaterial({ color: '#f3ebd8', roughness: 0.8 });
    const frameMat = new THREE.MeshStandardMaterial({ color: '#c49a38', roughness: 0.35, metalness: 0.75 });

    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.07, 0.50), cushionMat);
    cushion.position.set(0, 0.44, -0.02);
    chair.add(cushion);

    [[-0.22, -0.20], [0.22, -0.20], [-0.22, 0.20], [0.22, 0.20]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.016, 0.44, 8), frameMat);
      leg.position.set(lx, 0.22, lz);
      chair.add(leg);
    });
    const backL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.54, 8), frameMat);
    backL.position.set(-0.22, 0.71, -0.24);
    chair.add(backL);
    const backR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.54, 8), frameMat);
    backR.position.set(0.22, 0.71, -0.24);
    chair.add(backR);
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.04), frameMat);
    topRail.position.set(0, 0.96, -0.24);
    chair.add(topRail);

    chair.visible = false;
    this.chairGroup = chair;
    this.scene.add(chair);

    this._rebuildAvatar();
  }

  _rebuildAvatar() {
    if (!this.scene) return;
    if (this.avatar) {
      this.scene.remove(this.avatar.group);
      this.avatar.dispose();
      this.avatar = null;
    }

    this.avatar = new Avatar3D(this.avatarConfig, {
      role: 'groom',
      proceduralVersion: this.proceduralVersion,
      enableOptionalGlb: false
    });
    this.scene.add(this.avatar.group);
    this.setPose(this.activePose);
    this._syncButtonHighlight();
  }

  setProceduralVersion(version) {
    const next = version === 'v1' ? 'v1' : version === 'v2' ? 'v2' : 'v3';
    if (next === this.proceduralVersion && this.avatar) return;
    this.proceduralVersion = next;
    this._rebuildAvatar();
    this._refreshDiagnostics();
  }

  updateAvatarConfig(partial = {}) {
    this.avatarConfig = { ...this.avatarConfig, ...partial };
    if (this.container) {
      const outfitSel = this.container.querySelector('#proto-outfit');
      const hairSel = this.container.querySelector('#proto-hair');
      const accSel = this.container.querySelector('#proto-acc');
      if (outfitSel) outfitSel.value = this.avatarConfig.outfit;
      if (hairSel) hairSel.value = this.avatarConfig.hairStyle;
      if (accSel) accSel.value = this.avatarConfig.accessory;
    }
    this._rebuildAvatar();
    this._refreshDiagnostics();
  }

  runDisposeStressTest(iterations = 10) {
    if (!this.scene || !this.renderer) return null;
    this.renderer.render(this.scene, this.camera);
    const before = this._getRendererTelemetry();
    for (let i = 0; i < iterations; i++) {
      const temp = new Avatar3D(this.avatarConfig, {
        role: 'groom',
        proceduralVersion: this.proceduralVersion,
        enableOptionalGlb: false
      });
      this.scene.add(temp.group);
      this.renderer.render(this.scene, this.camera);
      this.scene.remove(temp.group);
      temp.dispose();
    }
    this.renderer.render(this.scene, this.camera);
    const after = this._getRendererTelemetry();
    return {
      iterations,
      geometriesBefore: before.geometries,
      geometriesAfter: after.geometries,
      texturesBefore: before.textures,
      texturesAfter: after.textures,
      leakedGeometries: after.geometries - before.geometries,
      leakedTextures: after.textures - before.textures
    };
  }

  setAngle(angleId, snap = false) {
    if (angleId === 'closeup') {
      this.activeAngle = 'closeup';
      const headY = this.avatar ? this.avatar.baseHeadY : 1.94;
      const sitDrop = this.activePose === 'sitting' ? -0.44 : 0;
      const targetY = headY + sitDrop - 0.02;
      this._camTarget.set(0, targetY, 0);
      this._camDesiredPos.set(0.16, targetY + 0.06, 1.15);
      if (snap && this.camera) {
        this.camera.position.copy(this._camDesiredPos);
        this.camera.lookAt(this._camTarget);
      }
      this._syncButtonHighlight();
      return;
    }

    const preset = ADJIE_PROTOTYPE_VIEWS[angleId] || ADJIE_PROTOTYPE_VIEWS.three_quarter;
    this.activeAngle = preset.id;
    const isCompact = this.proceduralVersion === 'v2' || this.proceduralVersion === 'v3';
    const lookY = this.activePose === 'sitting' ? 0.92 : (isCompact ? 1.12 : 1.18);
    const distScale = this.activePose === 'sitting' ? 0.78 : (isCompact ? 0.92 : 1.0);
    const dist = preset.distance * distScale;
    const horiz = Math.cos(preset.polarElevationRad) * dist;
    const x = Math.sin(preset.azimuthRad) * horiz;
    const z = Math.cos(preset.azimuthRad) * horiz;
    const y = lookY + Math.sin(preset.polarElevationRad) * dist;

    this._camTarget.set(0, lookY, 0);
    this._camDesiredPos.set(x, y, z);

    if (snap && this.camera) {
      this.camera.position.copy(this._camDesiredPos);
      this.camera.lookAt(this._camTarget);
    }
    this._syncButtonHighlight();
  }

  setPose(poseId) {
    const preset = ADJIE_PROTOTYPE_POSES[poseId] || ADJIE_PROTOTYPE_POSES.standing;
    this.activePose = preset.id;
    if (!this.avatar) return;

    if (preset.isSitting) {
      if (this.chairGroup) this.chairGroup.visible = true;
      const pose = computeSeatingRigPose({
        cushionTopY: 0.475,
        supportFloorY: 0.0,
        seatCenterX: 0,
        seatCenterZ: 0,
        faceAngle: 0
      });
      this.avatar.group.position.set(pose.rootPosition.x, pose.rootPosition.y, pose.rootPosition.z);
      this.avatar.setSitting(true, pose);
      if (this.avatar.shadow) this.avatar.shadow.visible = false;
    } else {
      if (this.chairGroup) this.chairGroup.visible = false;
      this.avatar.setSitting(false);
      this.avatar.group.position.set(0, 0, 0);
      this.avatar.setAnimationState(preset.animState || CHARACTER_ANIM_STATES.IDLE);
      if (this.avatar.shadow) this.avatar.shadow.visible = true;
    }

    this.setAngle(this.activeAngle, false);
    this._syncButtonHighlight();
  }

  _syncButtonHighlight() {
    if (!this.container) return;
    this.container.querySelectorAll('[data-proto-version]').forEach((btn) => {
      const active = btn.getAttribute('data-proto-version') === this.proceduralVersion;
      btn.style.background = active ? '#d4af37' : '#2b2320';
      btn.style.color = active ? '#1b1514' : '#f7f2ea';
    });
    this.container.querySelectorAll('[data-proto-angle]').forEach((btn) => {
      const active = btn.getAttribute('data-proto-angle') === this.activeAngle;
      btn.style.background = active ? '#d4af37' : '#2b2320';
      btn.style.color = active ? '#1b1514' : '#f7f2ea';
    });
    this.container.querySelectorAll('[data-proto-pose]').forEach((btn) => {
      const active = btn.getAttribute('data-proto-pose') === this.activePose;
      btn.style.background = active ? '#d4af37' : '#2b2320';
      btn.style.color = active ? '#1b1514' : '#f7f2ea';
    });
  }

  _getRendererTelemetry() {
    if (!this.renderer) {
      return { calls: 0, triangles: 0, geometries: 0, textures: 0, fps: 0, proceduralVersion: this.proceduralVersion };
    }
    return {
      proceduralVersion: this.proceduralVersion,
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      fps: this._measuredFps
    };
  }

  async _refreshDiagnostics() {
    if (!this.container || !this.avatar) return;
    const el = this.container.querySelector('#adjie-proto-status');
    const telEl = this.container.querySelector('#adjie-proto-telemetry');
    const diag = this.avatar.getDiagnostics();

    if (el) {
      const label =
        this.proceduralVersion === 'v3'
          ? 'V3 Natural Human (No GLB)'
          : this.proceduralVersion === 'v2'
            ? 'V2 Smooth Procedural (No GLB)'
            : 'V1 Legacy Procedural (Baseline)';
      el.textContent = `${label} | Outfit: ${this.avatarConfig.outfit} | Hair: ${this.avatarConfig.hairStyle} | Pose: ${this.activePose} | View: ${this.activeAngle}`;
    }
    if (telEl && this.renderer) {
      const t = this._getRendererTelemetry();
      telEl.textContent = `Calls: ${t.calls} | Tris: ${t.triangles.toLocaleString()} | Geos: ${t.geometries} | Tex: ${t.textures} | FPS: ${t.fps}`;
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._lastFrameTime = performance.now();
    this._fpsWindowStart = this._lastFrameTime;
    this._fpsWindowFrames = 0;
    this.loop();
  }

  loop() {
    if (!this.isRunning) return;
    const now = performance.now();
    const rawDelta = (now - this._lastFrameTime) / 1000;
    this._lastFrameTime = now;
    const delta = Math.max(0.001, Math.min(0.05, rawDelta || 0.016));
    this._animElapsed += delta * 4.5;

    this._fpsWindowFrames += 1;
    const fpsElapsed = now - this._fpsWindowStart;
    if (fpsElapsed >= 500) {
      this._measuredFps = Math.round((this._fpsWindowFrames * 1000) / fpsElapsed);
      this._fpsWindowFrames = 0;
      this._fpsWindowStart = now;
    }

    if (this.avatar) {
      const posePreset = ADJIE_PROTOTYPE_POSES[this.activePose] || ADJIE_PROTOTYPE_POSES.standing;
      this.avatar.updateAnimation(posePreset.animState, delta, this._animElapsed);
    }

    if (this.camera) {
      const alpha = 1 - Math.exp(-8 * delta);
      this.camera.position.lerp(this._camDesiredPos, alpha);
      this.camera.lookAt(this._camTarget);
      this.renderer.render(this.scene, this.camera);
    }

    if (this.isSoftwareGl) {
      scheduleAfterDraw(this.renderer, () => this.loop(), (id) => {
        this._afterDrawHandle = id;
      });
    } else {
      this._rafId = requestAnimationFrame(() => this.loop());
    }
  }

  handleResize() {
    if (!this.canvasWrap || !this.camera || !this.renderer) return;
    const w = this.canvasWrap.clientWidth || window.innerWidth;
    const h = this.canvasWrap.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  destroy() {
    this.isRunning = false;
    window.removeEventListener('resize', this._onResize);
    if (typeof window !== 'undefined' && window.__ADJIE_PROTO_DEBUG__) {
      delete window.__ADJIE_PROTO_DEBUG__;
    }
    if (this._diagTimer) {
      clearInterval(this._diagTimer);
      this._diagTimer = null;
    }
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._afterDrawHandle !== null) {
      clearTimeout(this._afterDrawHandle);
      this._afterDrawHandle = null;
    }
    if (this.avatar) {
      this.avatar.dispose();
      this.avatar = null;
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
