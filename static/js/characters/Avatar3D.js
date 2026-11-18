import * as THREE from 'three';
import { characterTextures } from './CharacterTextures.js';
import { CHARACTER_ANIM_STATES, loadOptionalRiggedCharacter } from './CharacterAnimator.js';
import {
  STYLIZED_V2_PROPORTIONS,
  dampValue,
  resolveWalkingAnimPhase
} from './StylizedMath.js';
import {
  buildStylizedArmGroup,
  buildStylizedHeadGroup,
  buildStylizedLegGroup,
  buildStylizedTorsoGroup
} from './StylizedGeometry.js';
import {
  STYLIZED_V3_PROPORTIONS,
  resolveV3SilhouetteProfile
} from './StylizedMathV3.js';
import {
  buildV3ArmGroup,
  buildV3HeadGroup,
  buildV3LegGroup,
  buildV3TorsoGroup
} from './StylizedGeometryV3.js';

/**
 * Avatar3D - Stylized & Legacy Digital Human Character Generator + Optional Rigged GLB Adapter
 * Supports V1 legacy procedural fallback and V2 Sims-inspired stylized smooth human geometry,
 * smooth delta-time articulated animation, and full GPU resource disposal.
 */
export class Avatar3D {
  constructor(config = {}, options = {}) {
    this.group = new THREE.Group();
    this.rigRoot = new THREE.Group();
    this.group.add(this.rigRoot);
    this.config = config;
    this.role = options.role || 'guest';
    this.proceduralVersion = Avatar3D.resolveProceduralVersion(options);

    // Body parts references required by CharacterController for smooth walking/sitting
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftKnee = null;
    this.rightKnee = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftForearm = null;
    this.rightForearm = null;
    this.torso = null;
    this.head = null;
    this.shadow = null;
    this.proceduralParts = [];

    this.animState = CHARACTER_ANIM_STATES.IDLE;
    this.isSittingPose = false;
    this._lastSeatingPose = null;
    this._animElapsed = 0;
    this._riggedModel = null;
    this._isDisposed = false;
    this._useRealisticStyleCScale = Boolean(options.useRealisticStyleCScale);
    this._v3Profile = null;
    if (this.proceduralVersion === 'v3') {
      this.baseHeadY = STYLIZED_V3_PROPORTIONS.HEAD_PIVOT_Y;
      this.buildStylizedCharacterV3();
    } else if (this.proceduralVersion === 'v2') {
      this.baseHeadY = STYLIZED_V2_PROPORTIONS.HEAD_PIVOT_Y;
      this.buildStylizedCharacterV2();
    } else {
      this.baseHeadY = 2.14;
      this.buildRealisticCharacter();
    }

    if (this.proceduralVersion === 'v1' && options.enableOptionalGlb !== false && typeof window !== 'undefined') {
      this._hydrateOptionalGlb();
    }
  }

  static resolveProceduralVersion(options = {}) {
    if (options && (options.proceduralVersion === 'v1' || options.proceduralVersion === 'v2' || options.proceduralVersion === 'v3')) {
      return options.proceduralVersion;
    }
    if (typeof window !== 'undefined') {
      try {
        const q = new URLSearchParams(window.location.search).get('avatar');
        if (q === 'v3' || q === 'v2' || q === 'v1') return q;
      } catch (_e) {}
    }
    // V3 is the approved head/body baseline for the live wedding world.
    // V1/V2 remain available through an explicit query flag for prototype comparison.
    return 'v3';
  }

  async _hydrateOptionalGlb() {
    const loaded = await loadOptionalRiggedCharacter(this.role, {
      useRealisticStyleCScale: this._useRealisticStyleCScale
    });
    if (!loaded || this._isDisposed) {
      if (loaded) loaded.dispose();
      return;
    }

    this._riggedModel = loaded;
    this.proceduralParts.forEach((part) => {
      if (part) part.visible = false;
    });
    this.rigRoot.add(loaded.sceneRoot);

    if (this.isSittingPose) {
      this.setSitting(true, this._lastSeatingPose);
    } else {
      this.rigRoot.position.y = 0;
      loaded.playState(this.animState);
    }
  }

  getDiagnostics() {
    return {
      mode: this._riggedModel ? 'glb' : 'procedural',
      proceduralVersion: this.proceduralVersion,
      role: this.role,
      animState: this.animState,
      isSitting: this.isSittingPose,
      rig: this._riggedModel ? this._riggedModel.getDiagnostics() : null
    };
  }

  setAnimationState(stateName) {
    const validStates = Object.values(CHARACTER_ANIM_STATES);
    const next = validStates.includes(stateName) ? stateName : CHARACTER_ANIM_STATES.IDLE;
    this.animState = next;
    if (this._riggedModel) {
      this._riggedModel.playState(next);
    }
  }

  updateAnimation(stateName, delta = 0.016, animTime = 0, options = {}) {
    if (this._isDisposed) return;
    const dt = Math.max(0.001, Math.min(0.05, delta || 0.016));
    this._animElapsed += dt;
    this.setAnimationState(stateName);

    if (this._riggedModel) {
      this._riggedModel.update(dt);
      return;
    }

    const baseHeadY = this.baseHeadY;
    const blend = 11.0;

    if (stateName === CHARACTER_ANIM_STATES.SITTING || this.isSittingPose) {
      const breath = Math.sin(this._animElapsed * 2.1) * 0.010;
      if (this.torso) {
        this.torso.rotation.x = dampValue(this.torso.rotation.x, -0.04, 8, dt);
        this.torso.rotation.y = dampValue(this.torso.rotation.y, 0, 8, dt);
      }
      if (this.leftArm) {
        this.leftArm.rotation.x = dampValue(this.leftArm.rotation.x, -0.38, 9, dt);
        this.leftArm.rotation.z = dampValue(this.leftArm.rotation.z, -0.06, 9, dt);
      }
      if (this.rightArm) {
        this.rightArm.rotation.x = dampValue(this.rightArm.rotation.x, -0.38, 9, dt);
        this.rightArm.rotation.z = dampValue(this.rightArm.rotation.z, 0.06, 9, dt);
      }
      if (this.leftForearm) {
        this.leftForearm.rotation.x = dampValue(this.leftForearm.rotation.x, -0.52, 9, dt);
        this.leftForearm.rotation.z = dampValue(this.leftForearm.rotation.z, -0.10, 9, dt);
      }
      if (this.rightForearm) {
        this.rightForearm.rotation.x = dampValue(this.rightForearm.rotation.x, -0.52, 9, dt);
        this.rightForearm.rotation.z = dampValue(this.rightForearm.rotation.z, 0.10, 9, dt);
      }
      if (this.head) {
        this.head.position.y = dampValue(this.head.position.y, baseHeadY + breath, 10, dt);
        this.head.rotation.x = dampValue(this.head.rotation.x, Math.sin(this._animElapsed * 1.1) * 0.025, 6, dt);
        this.head.rotation.y = dampValue(this.head.rotation.y, Math.sin(this._animElapsed * 0.7) * 0.06, 6, dt);
        this.head.rotation.z = dampValue(this.head.rotation.z, 0, 8, dt);
      }
      return;
    }

    if (stateName === CHARACTER_ANIM_STATES.GREETING) {
      const wave = Math.sin(this._animElapsed * 5.0);
      const nod = Math.sin(this._animElapsed * 2.2) * 0.045;
      if (!this.isSittingPose) {
        this.rigRoot.position.y = dampValue(this.rigRoot.position.y, 0, 10, dt);
      }
      if (this.leftLeg) this.leftLeg.rotation.x = dampValue(this.leftLeg.rotation.x, 0, blend, dt);
      if (this.rightLeg) this.rightLeg.rotation.x = dampValue(this.rightLeg.rotation.x, 0, blend, dt);
      if (this.leftKnee) this.leftKnee.rotation.x = dampValue(this.leftKnee.rotation.x, 0, blend, dt);
      if (this.rightKnee) this.rightKnee.rotation.x = dampValue(this.rightKnee.rotation.x, 0, blend, dt);
      if (this.torso) {
        this.torso.rotation.x = dampValue(this.torso.rotation.x, 0.02, 8, dt);
        this.torso.rotation.y = dampValue(this.torso.rotation.y, Math.sin(this._animElapsed * 1.8) * 0.04, 8, dt);
      }
      if (this.rightArm) {
        this.rightArm.rotation.x = dampValue(this.rightArm.rotation.x, this.rightForearm ? -0.95 : -1.25 + wave * 0.14, 10, dt);
        this.rightArm.rotation.z = dampValue(this.rightArm.rotation.z, this.rightForearm ? 0.32 : 0.24 + wave * 0.12, 10, dt);
      }
      if (this.rightForearm) {
        this.rightForearm.rotation.x = dampValue(this.rightForearm.rotation.x, -1.18, 12, dt);
        this.rightForearm.rotation.z = dampValue(this.rightForearm.rotation.z, 0.12 + wave * 0.25, 14, dt);
      }
      if (this.leftArm) {
        this.leftArm.rotation.x = dampValue(this.leftArm.rotation.x, -0.08, 10, dt);
        this.leftArm.rotation.z = dampValue(this.leftArm.rotation.z, this._v3Profile ? -this._v3Profile.armRestAbductionZ : -0.06, 10, dt);
      }
      if (this.leftForearm) {
        this.leftForearm.rotation.x = dampValue(this.leftForearm.rotation.x, -0.18, 10, dt);
        this.leftForearm.rotation.z = dampValue(this.leftForearm.rotation.z, 0, 10, dt);
      }
      if (this.head) {
        this.head.position.y = dampValue(this.head.position.y, baseHeadY + Math.sin(this._animElapsed * 2.2) * 0.012, 10, dt);
        this.head.rotation.x = dampValue(this.head.rotation.x, nod, 8, dt);
        this.head.rotation.y = dampValue(this.head.rotation.y, Math.sin(this._animElapsed * 1.2) * 0.06, 8, dt);
        this.head.rotation.z = dampValue(this.head.rotation.z, -0.04, 8, dt);
      }
      return;
    }

    if (stateName === CHARACTER_ANIM_STATES.WALKING) {
      const tAnim = resolveWalkingAnimPhase(animTime, options);
      const legAngle = Math.sin(tAnim) * 0.44;
      const armAngle = Math.sin(tAnim) * 0.36;
      const leftKneeTarget = Math.max(0, -legAngle * 0.52 + Math.cos(tAnim) * 0.16);
      const rightKneeTarget = Math.max(0, legAngle * 0.52 - Math.cos(tAnim) * 0.16);
      const strideBounce = Math.abs(Math.sin(tAnim)) * 0.020;

      if (!this.isSittingPose) {
        this.rigRoot.position.y = dampValue(this.rigRoot.position.y, strideBounce, 14, dt);
      }
      if (this.leftLeg) this.leftLeg.rotation.x = dampValue(this.leftLeg.rotation.x, legAngle, 14, dt);
      if (this.rightLeg) this.rightLeg.rotation.x = dampValue(this.rightLeg.rotation.x, -legAngle, 14, dt);
      if (this.leftKnee && !this.isSittingPose) {
        this.leftKnee.rotation.x = dampValue(this.leftKnee.rotation.x, leftKneeTarget, 14, dt);
      }
      if (this.rightKnee && !this.isSittingPose) {
        this.rightKnee.rotation.x = dampValue(this.rightKnee.rotation.x, rightKneeTarget, 14, dt);
      }
      if (this.torso) {
        this.torso.rotation.x = dampValue(this.torso.rotation.x, 0.03, 10, dt);
        this.torso.rotation.y = dampValue(this.torso.rotation.y, Math.sin(tAnim) * 0.06, 12, dt);
      }
      if (this.leftArm) {
        this.leftArm.rotation.x = dampValue(this.leftArm.rotation.x, -armAngle, 14, dt);
        this.leftArm.rotation.z = dampValue(this.leftArm.rotation.z, this._v3Profile ? -0.095 : -0.05, 10, dt);
      }
      if (this.rightArm) {
        this.rightArm.rotation.x = dampValue(this.rightArm.rotation.x, armAngle, 14, dt);
        this.rightArm.rotation.z = dampValue(this.rightArm.rotation.z, this._v3Profile ? 0.095 : 0.05, 10, dt);
      }
      if (this.leftForearm) {
        this.leftForearm.rotation.x = dampValue(this.leftForearm.rotation.x, -0.18 - Math.max(0, armAngle) * 0.34, 14, dt);
        this.leftForearm.rotation.z = dampValue(this.leftForearm.rotation.z, 0, 10, dt);
      }
      if (this.rightForearm) {
        this.rightForearm.rotation.x = dampValue(this.rightForearm.rotation.x, -0.18 - Math.max(0, -armAngle) * 0.34, 14, dt);
        this.rightForearm.rotation.z = dampValue(this.rightForearm.rotation.z, 0, 10, dt);
      }
      if (this.head) {
        this.head.position.y = dampValue(this.head.position.y, baseHeadY + strideBounce * 0.6, 14, dt);
        this.head.rotation.x = dampValue(this.head.rotation.x, 0.015, 10, dt);
        this.head.rotation.y = dampValue(this.head.rotation.y, -Math.sin(tAnim) * 0.03, 10, dt);
        this.head.rotation.z = dampValue(this.head.rotation.z, 0, 10, dt);
      }
      return;
    }

    if (stateName === CHARACTER_ANIM_STATES.TURNING) {
      const sway = Math.sin(this._animElapsed * 5.0) * 0.08;
      if (!this.isSittingPose) {
        this.rigRoot.position.y = dampValue(this.rigRoot.position.y, 0, 12, dt);
      }
      if (this.leftLeg) this.leftLeg.rotation.x = dampValue(this.leftLeg.rotation.x, 0, blend, dt);
      if (this.rightLeg) this.rightLeg.rotation.x = dampValue(this.rightLeg.rotation.x, 0, blend, dt);
      if (this.leftKnee) this.leftKnee.rotation.x = dampValue(this.leftKnee.rotation.x, 0, blend, dt);
      if (this.rightKnee) this.rightKnee.rotation.x = dampValue(this.rightKnee.rotation.x, 0, blend, dt);
      if (this.torso) {
        this.torso.rotation.x = dampValue(this.torso.rotation.x, 0, 10, dt);
        this.torso.rotation.y = dampValue(this.torso.rotation.y, (options.turnDir || 0) * 0.35, 10, dt);
      }
      if (this.leftArm) {
        this.leftArm.rotation.x = dampValue(this.leftArm.rotation.x, sway, 10, dt);
        this.leftArm.rotation.z = dampValue(this.leftArm.rotation.z, this._v3Profile ? -this._v3Profile.armRestAbductionZ : -0.05, 10, dt);
      }
      if (this.rightArm) {
        this.rightArm.rotation.x = dampValue(this.rightArm.rotation.x, -sway, 10, dt);
        this.rightArm.rotation.z = dampValue(this.rightArm.rotation.z, this._v3Profile ? this._v3Profile.armRestAbductionZ : 0.05, 10, dt);
      }
      if (this.leftForearm) this.leftForearm.rotation.x = dampValue(this.leftForearm.rotation.x, -0.14, 10, dt);
      if (this.rightForearm) this.rightForearm.rotation.x = dampValue(this.rightForearm.rotation.x, -0.14, 10, dt);
      if (this.head) {
        this.head.position.y = dampValue(this.head.position.y, baseHeadY + Math.sin(this._animElapsed * 2.2) * 0.010, 10, dt);
        this.head.rotation.y = dampValue(this.head.rotation.y, Math.max(-0.18, Math.min(0.18, options.turnDir || 0.08)), 10, dt);
        this.head.rotation.z = dampValue(this.head.rotation.z, 0, 10, dt);
      }
      return;
    }

    // STANDING / Default IDLE smooth breathing & relaxed natural stance
    const breath = Math.sin(this._animElapsed * 1.9) * 0.014;
    const restAbduction = this._v3Profile ? this._v3Profile.armRestAbductionZ : 0.045;
    const restElbow = this._v3Profile ? this._v3Profile.elbowRestBendX : -0.12;
    if (!this.isSittingPose) {
      this.rigRoot.position.y = dampValue(this.rigRoot.position.y, 0, 12, dt);
    }
    if (this.leftLeg) this.leftLeg.rotation.x = dampValue(this.leftLeg.rotation.x, 0, blend, dt);
    if (this.rightLeg) this.rightLeg.rotation.x = dampValue(this.rightLeg.rotation.x, 0, blend, dt);
    if (this.leftKnee) this.leftKnee.rotation.x = dampValue(this.leftKnee.rotation.x, 0, blend, dt);
    if (this.rightKnee) this.rightKnee.rotation.x = dampValue(this.rightKnee.rotation.x, 0, blend, dt);
    if (this.torso) {
      this.torso.rotation.x = dampValue(this.torso.rotation.x, breath * 0.45, 8, dt);
      this.torso.rotation.y = dampValue(this.torso.rotation.y, 0, 8, dt);
    }
    if (this.leftArm) {
      this.leftArm.rotation.x = dampValue(this.leftArm.rotation.x, breath * 0.5, 9, dt);
      this.leftArm.rotation.z = dampValue(this.leftArm.rotation.z, -restAbduction, 9, dt);
    }
    if (this.rightArm) {
      this.rightArm.rotation.x = dampValue(this.rightArm.rotation.x, -breath * 0.5, 9, dt);
      this.rightArm.rotation.z = dampValue(this.rightArm.rotation.z, restAbduction, 9, dt);
    }
    if (this.leftForearm) {
      this.leftForearm.rotation.x = dampValue(this.leftForearm.rotation.x, restElbow, 9, dt);
      this.leftForearm.rotation.z = dampValue(this.leftForearm.rotation.z, 0, 9, dt);
    }
    if (this.rightForearm) {
      this.rightForearm.rotation.x = dampValue(this.rightForearm.rotation.x, restElbow, 9, dt);
      this.rightForearm.rotation.z = dampValue(this.rightForearm.rotation.z, 0, 9, dt);
    }
    if (this.head) {
      this.head.position.y = dampValue(this.head.position.y, baseHeadY + breath * 0.75, 9, dt);
      this.head.rotation.x = dampValue(this.head.rotation.x, Math.sin(this._animElapsed * 0.9) * 0.015, 7, dt);
      this.head.rotation.y = dampValue(this.head.rotation.y, Math.sin(this._animElapsed * 0.55) * 0.035, 7, dt);
      this.head.rotation.z = dampValue(this.head.rotation.z, 0, 8, dt);
    }
  }

  setSitting(isSitting, pose = null) {
    this.isSittingPose = Boolean(isSitting);
    this._lastSeatingPose = isSitting ? pose : null;
    this.setAnimationState(isSitting ? CHARACTER_ANIM_STATES.SITTING : CHARACTER_ANIM_STATES.IDLE);

    if (this._riggedModel) {
      if (isSitting) {
        const glbRootOffsetY = pose && typeof pose.glbRootOffsetY === 'number' ? pose.glbRootOffsetY : 0;
        this.rigRoot.position.y = glbRootOffsetY;
      } else {
        this.rigRoot.position.y = 0;
      }
      return;
    }

    if (isSitting) {
      const hipOffsetY = pose && typeof pose.hipOffsetY === 'number' ? pose.hipOffsetY : -0.44;
      const thighPitchX = pose && typeof pose.thighPitchX === 'number' ? pose.thighPitchX : -Math.PI / 2;
      const kneeBendX = pose && typeof pose.kneeBendX === 'number' ? pose.kneeBendX : Math.PI / 2;

      this.rigRoot.position.y = hipOffsetY;
      if (this.leftLeg) this.leftLeg.rotation.x = thighPitchX;
      if (this.rightLeg) this.rightLeg.rotation.x = thighPitchX;
      if (this.leftKnee) this.leftKnee.rotation.x = kneeBendX;
      if (this.rightKnee) this.rightKnee.rotation.x = kneeBendX;
      if (this.leftArm) this.leftArm.rotation.x = -0.38;
      if (this.rightArm) this.rightArm.rotation.x = -0.38;
      if (this.leftForearm) this.leftForearm.rotation.x = -0.52;
      if (this.rightForearm) this.rightForearm.rotation.x = -0.52;
    } else {
      this.rigRoot.position.y = 0;
      if (this.leftLeg) this.leftLeg.rotation.x = 0;
      if (this.rightLeg) this.rightLeg.rotation.x = 0;
      if (this.leftKnee) this.leftKnee.rotation.x = 0;
      if (this.rightKnee) this.rightKnee.rotation.x = 0;
      if (this.leftArm) this.leftArm.rotation.x = 0;
      if (this.rightArm) this.rightArm.rotation.x = 0;
      if (this.leftForearm) this.leftForearm.rotation.x = 0;
      if (this.rightForearm) this.rightForearm.rotation.x = 0;
    }
  }

  dispose() {
    if (this._isDisposed) return;
    this._isDisposed = true;

    if (this._riggedModel) {
      this._riggedModel.dispose();
      this._riggedModel = null;
    }

    // Collect shared cached textures so we never destroy shared textures used by other avatars
    const sharedTextures = new Set(characterTextures.cache ? characterTextures.cache.values() : []);
    const disposedGeos = new Set();
    const disposedMats = new Set();

    const disposeMat = (mat) => {
      if (!mat || disposedMats.has(mat)) return;
      disposedMats.add(mat);
      const texKeys = ['map', 'bumpMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap'];
      for (const key of texKeys) {
        const tex = mat[key];
        if (tex && !sharedTextures.has(tex) && typeof tex.dispose === 'function') {
          tex.dispose();
        }
      }
      if (mat.userData && mat.userData.irisTex) {
        delete mat.userData.irisTex;
      }
      if (typeof mat.dispose === 'function') {
        mat.dispose();
      }
    };

    this.group.traverse((child) => {
      if (child.geometry && !disposedGeos.has(child.geometry)) {
        disposedGeos.add(child.geometry);
        child.geometry.dispose();
      }
      if (Array.isArray(child.material)) {
        child.material.forEach(disposeMat);
      } else if (child.material) {
        disposeMat(child.material);
      }
    });

    this.proceduralParts = [];
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftKnee = null;
    this.rightKnee = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftForearm = null;
    this.rightForearm = null;
    this.torso = null;
    this.head = null;
    this.shadow = null;
  }

  /**
   * Builds Phase 16D Stylized V2 Digital Human (Sims-inspired proportions, smooth loft anatomy,
   * sculpted jawline & facial sockets, merged draw calls, articulated elbows).
   */
  buildStylizedCharacterV2() {
    const skinHex = this.config.skinColor || '#F1C27D';
    const hairCol = this.config.hairColor || '#1A1A24';
    const hairStyle = this.config.hairStyle || 'short';
    const outfit = this.config.outfit || 'traditional_gold';
    const accessory = this.config.accessory || 'none';

    const skinBump = characterTextures.getSkinBumpMap();
    const irisTex = characterTextures.getIrisTexture();
    const fabricMap = characterTextures.getBatikFabricTexture(outfit);
    const hairMap = characterTextures.getHairTexture(hairCol);
    const leatherMap = characterTextures.getLeatherShoeTexture();

    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinHex),
      roughness: 0.56,
      metalness: 0.01,
      bumpMap: skinBump,
      bumpScale: 0.0025
    });
    skinMat.userData = { irisTex };

    const lipColor = new THREE.Color(skinHex).lerp(new THREE.Color('#b64e58'), 0.42);
    const lipMat = new THREE.MeshStandardMaterial({
      color: lipColor,
      roughness: 0.40,
      metalness: 0.04
    });

    let accentHex = '#d4af37';
    if (outfit === 'traditional_maroon') accentHex = '#e6be58';
    else if (outfit === 'beskap_hitam') accentHex = '#d4af37';
    else if (outfit === 'kebaya_putih') accentHex = '#e5cf8e';
    else if (outfit === 'tuxedo') accentHex = '#f8f9fa';

    const fabricMat = new THREE.MeshStandardMaterial({
      map: fabricMap,
      roughness: outfit === 'kebaya_putih' ? 0.64 : 0.72,
      metalness: outfit === 'beskap_hitam' ? 0.08 : 0.05
    });

    const lowerFabricMat = outfit === 'kebaya_putih'
      ? new THREE.MeshStandardMaterial({
          map: characterTextures.getBatikFabricTexture('batik_jarik'),
          roughness: 0.74,
          metalness: 0.04
        })
      : fabricMat;

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      roughness: 0.30,
      metalness: 0.78
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      map: leatherMap,
      color: new THREE.Color('#16161b'),
      roughness: 0.38,
      metalness: 0.10
    });

    const hairMat = new THREE.MeshStandardMaterial({
      map: hairMap,
      color: new THREE.Color(hairCol),
      roughness: 0.54,
      metalness: 0.03
    });

    // Grounding Contact Shadow scaled cleanly to V2 footprint
    const shadowGroup = new THREE.Group();
    const innerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 20),
      new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.36, transparent: true, depthWrite: false })
    );
    innerShadow.rotation.x = -Math.PI / 2;
    innerShadow.position.y = 0.005;
    shadowGroup.add(innerShadow);

    const outerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.68, 20),
      new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.14, transparent: true, depthWrite: false })
    );
    outerShadow.rotation.x = -Math.PI / 2;
    outerShadow.position.y = 0.004;
    shadowGroup.add(outerShadow);
    this.shadow = shadowGroup;
    this.group.add(this.shadow);

    // Legs (natural hip stance ±0.102m, sole flush at y = 0)
    const leftLegBuilt = buildStylizedLegGroup(-0.102, true, lowerFabricMat, shoeMat, accentMat);
    const rightLegBuilt = buildStylizedLegGroup(0.102, false, lowerFabricMat, shoeMat, accentMat);
    this.leftLeg = leftLegBuilt.legGroup;
    this.leftKnee = leftLegBuilt.kneeGroup;
    this.rightLeg = rightLegBuilt.legGroup;
    this.rightKnee = rightLegBuilt.kneeGroup;
    this.rigRoot.add(this.leftLeg);
    this.rigRoot.add(this.rightLeg);

    // Continuous Lofted Torso + Neck
    this.torso = buildStylizedTorsoGroup(fabricMat, lowerFabricMat, accentMat, skinMat, outfit);
    this.rigRoot.add(this.torso);

    // Tapered Articulated Arms + 5-Finger Hands (tucked cleanly into sloped clavicle)
    const isSlimSilhouette = outfit === 'kebaya_putih' || outfit === 'traditional_maroon' || outfit === 'dress';
    const shoulderX = isSlimSilhouette ? 0.194 : 0.220;
    const leftArmBuilt = buildStylizedArmGroup(-shoulderX, true, fabricMat, accentMat, skinMat);
    const rightArmBuilt = buildStylizedArmGroup(shoulderX, false, fabricMat, accentMat, skinMat);
    this.leftArm = leftArmBuilt.armGroup;
    this.leftForearm = leftArmBuilt.forearmGroup;
    this.rightArm = rightArmBuilt.armGroup;
    this.rightForearm = rightArmBuilt.forearmGroup;
    this.rigRoot.add(this.leftArm);
    this.rigRoot.add(this.rightArm);

    // Sculpted Stylized Head + Face + Hair + Accessories
    this.head = buildStylizedHeadGroup(skinMat, lipMat, hairMat, hairStyle, hairCol, accessory, accentMat);
    this.rigRoot.add(this.head);

    this.proceduralParts = [this.leftLeg, this.rightLeg, this.torso, this.leftArm, this.rightArm, this.head];
  }

  /**
   * Builds Phase 16E Stylized V3 Natural Human (Sims-inspired 7.18-heads proportions,
   * sculpted craniofacial anatomy, open-face hairline hair & open-face pashmina hijab,
   * dimorphic silhouette & relaxed natural stance).
   */
  buildStylizedCharacterV3() {
    const skinHex = this.config.skinColor || '#F1C27D';
    const hairCol = this.config.hairColor || '#1A1A24';
    const hairStyle = this.config.hairStyle || 'short';
    const outfit = this.config.outfit || 'traditional_gold';
    const accessory = this.config.accessory || 'none';

    const profile = resolveV3SilhouetteProfile(this.config);
    this._v3Profile = profile;

    const irisTex = characterTextures.getStylizedIrisTexture();
    const fabricMap = characterTextures.getBatikFabricTexture(outfit);
    const leatherMap = characterTextures.getLeatherShoeTexture();

    // Smooth matte/semi-matte skin without noisy pores or bump maps
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinHex),
      roughness: 0.72,
      metalness: 0.0
    });
    skinMat.userData = { irisTex };

    const lipColor = new THREE.Color(skinHex).lerp(new THREE.Color('#b65d58'), 0.42);
    const lipMat = new THREE.MeshStandardMaterial({
      color: lipColor,
      roughness: 0.56,
      metalness: 0.0
    });

    let accentHex = '#d4af37';
    if (outfit === 'traditional_maroon') accentHex = '#e6be58';
    else if (outfit === 'beskap_hitam') accentHex = '#d4af37';
    else if (outfit === 'kebaya_putih') accentHex = '#e5cf8e';
    else if (outfit === 'tuxedo') accentHex = '#f8f9fa';

    const fabricMat = new THREE.MeshStandardMaterial({
      map: fabricMap,
      roughness: outfit === 'kebaya_putih' ? 0.70 : 0.76,
      metalness: outfit === 'beskap_hitam' ? 0.05 : 0.03
    });

    const lowerFabricMat = outfit === 'kebaya_putih'
      ? new THREE.MeshStandardMaterial({
          map: characterTextures.getBatikFabricTexture('batik_jarik'),
          roughness: 0.78,
          metalness: 0.02
        })
      : fabricMat;

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      roughness: 0.34,
      metalness: 0.72
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      map: leatherMap,
      color: new THREE.Color('#16161b'),
      roughness: 0.44,
      metalness: 0.06
    });

    // Clean matte stylized hair (no plastic/streaked specular band)
    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairCol),
      roughness: 0.78,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    // Grounding Contact Shadow
    const shadowGroup = new THREE.Group();
    const innerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.40, 20),
      new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.34, transparent: true, depthWrite: false })
    );
    innerShadow.rotation.x = -Math.PI / 2;
    innerShadow.position.y = 0.005;
    shadowGroup.add(innerShadow);

    const outerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.64, 20),
      new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.13, transparent: true, depthWrite: false })
    );
    outerShadow.rotation.x = -Math.PI / 2;
    outerShadow.position.y = 0.004;
    shadowGroup.add(outerShadow);
    this.shadow = shadowGroup;
    this.group.add(this.shadow);

    // Legs
    const leftLegBuilt = buildV3LegGroup(-profile.thighOffsetX, lowerFabricMat, shoeMat, accentMat, profile);
    const rightLegBuilt = buildV3LegGroup(profile.thighOffsetX, lowerFabricMat, shoeMat, accentMat, profile);
    this.leftLeg = leftLegBuilt.legGroup;
    this.leftKnee = leftLegBuilt.kneeGroup;
    this.rightLeg = rightLegBuilt.legGroup;
    this.rightKnee = rightLegBuilt.kneeGroup;
    this.rigRoot.add(this.leftLeg);
    this.rigRoot.add(this.rightLeg);

    // Torso
    this.torso = buildV3TorsoGroup(fabricMat, lowerFabricMat, accentMat, skinMat, outfit, profile, hairStyle);
    this.rigRoot.add(this.torso);

    // Arms with initial relaxed Sims resting stance
    const leftArmBuilt = buildV3ArmGroup(-profile.shoulderHalfWidth, true, fabricMat, accentMat, skinMat, profile);
    const rightArmBuilt = buildV3ArmGroup(profile.shoulderHalfWidth, false, fabricMat, accentMat, skinMat, profile);
    this.leftArm = leftArmBuilt.armGroup;
    this.leftForearm = leftArmBuilt.forearmGroup;
    this.rightArm = rightArmBuilt.armGroup;
    this.rightForearm = rightArmBuilt.forearmGroup;
    this.leftArm.rotation.z = -profile.armRestAbductionZ;
    this.rightArm.rotation.z = profile.armRestAbductionZ;
    this.leftForearm.rotation.x = profile.elbowRestBendX;
    this.rightForearm.rotation.x = profile.elbowRestBendX;
    this.rigRoot.add(this.leftArm);
    this.rigRoot.add(this.rightArm);

    // Head + Face + Open-Face Hair / Hijab
    this.head = buildV3HeadGroup(skinMat, lipMat, hairMat, hairStyle, hairCol, accessory, accentMat, profile);
    this.rigRoot.add(this.head);

    this.proceduralParts = [this.leftLeg, this.rightLeg, this.torso, this.leftArm, this.rightArm, this.head];
  }

  buildRealisticCharacter() {
    const skinHex = this.config.skinColor || '#F1C27D';
    const hairCol = this.config.hairColor || '#1A1A24';
    const hairStyle = this.config.hairStyle || 'short';
    const outfit = this.config.outfit || 'traditional_gold';
    const accessory = this.config.accessory || 'none';

    // 1. PBR High-Fidelity Materials with Procedural Maps
    const skinBump = characterTextures.getSkinBumpMap();
    const fabricMap = characterTextures.getBatikFabricTexture(outfit);
    const hairMap = characterTextures.getHairTexture(hairCol);
    const leatherMap = characterTextures.getLeatherShoeTexture();

    // PBR Skin Shading with natural subsurface scattering look and micro-pore breakup
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinHex),
      roughness: 0.54,
      metalness: 0.02,
      bumpMap: skinBump,
      bumpScale: 0.004,
    });

    // PBR Lip Material (slightly deeper rose tint with natural moisture gloss)
    const lipColor = new THREE.Color(skinHex).lerp(new THREE.Color('#b84852'), 0.45);
    const lipMat = new THREE.MeshStandardMaterial({
      color: lipColor,
      roughness: 0.38,
      metalness: 0.05,
    });

    // Fabric Primary & Accent Materials
    let accentHex = '#d4af37'; // gold
    if (outfit === 'traditional_maroon') accentHex = '#e6be58';
    else if (outfit === 'beskap_hitam') accentHex = '#d4af37';
    else if (outfit === 'kebaya_putih') accentHex = '#e5cf8e';
    else if (outfit === 'tuxedo') accentHex = '#f8f9fa';
    else if (outfit === 'dress') accentHex = '#d4af37';

    const fabricMat = new THREE.MeshStandardMaterial({
      map: fabricMap,
      roughness: outfit === 'kebaya_putih' ? 0.62 : 0.72,
      metalness: outfit === 'beskap_hitam' ? 0.12 : 0.08,
    });

    // Lower garment material: classic batik jarik for kebaya_putih, matching fabric otherwise
    const lowerFabricMat = outfit === 'kebaya_putih'
      ? new THREE.MeshStandardMaterial({
          map: characterTextures.getBatikFabricTexture('batik_jarik'),
          roughness: 0.74,
          metalness: 0.06,
        })
      : fabricMat;

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      roughness: 0.28,
      metalness: 0.82,
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      map: leatherMap,
      color: new THREE.Color('#15151a'),
      roughness: 0.36,
      metalness: 0.12,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      map: hairMap,
      color: new THREE.Color(hairCol),
      roughness: 0.48,
      metalness: 0.04,
    });

    // 2. Multi-Tier Grounding Contact Shadow (remains directly on group at y=0)
    const shadowGroup = new THREE.Group();
    const innerShadowGeo = new THREE.CircleGeometry(0.55, 20);
    const innerShadowMat = new THREE.MeshBasicMaterial({
      color: '#000000',
      opacity: 0.38,
      transparent: true,
      depthWrite: false,
    });
    const innerShadow = new THREE.Mesh(innerShadowGeo, innerShadowMat);
    innerShadow.rotation.x = -Math.PI / 2;
    innerShadow.position.y = 0.005;
    shadowGroup.add(innerShadow);

    const outerShadowGeo = new THREE.CircleGeometry(0.85, 20);
    const outerShadowMat = new THREE.MeshBasicMaterial({
      color: '#000000',
      opacity: 0.16,
      transparent: true,
      depthWrite: false,
    });
    const outerShadow = new THREE.Mesh(outerShadowGeo, outerShadowMat);
    outerShadow.rotation.x = -Math.PI / 2;
    outerShadow.position.y = 0.004;
    shadowGroup.add(outerShadow);

    this.shadow = shadowGroup;
    this.group.add(this.shadow);

    // 3. Anatomically Proportioned Legs & Realistic Dress Shoes inside rigRoot
    this.leftLeg = this.buildRealisticLeg(-0.16, true, lowerFabricMat, shoeMat, skinMat);
    this.rightLeg = this.buildRealisticLeg(0.16, false, lowerFabricMat, shoeMat, skinMat);
    this.rigRoot.add(this.leftLeg);
    this.rigRoot.add(this.rightLeg);

    // 4. Anatomically Proportioned Torso with Tailored Attire inside rigRoot
    this.torso = this.buildRealisticTorso(fabricMat, lowerFabricMat, accentMat, skinMat, outfit);
    this.rigRoot.add(this.torso);

    // 5. Anatomically Proportioned Arms with Sculpted Hands inside rigRoot
    this.leftArm = this.buildRealisticArm(-0.30, true, fabricMat, accentMat, skinMat);
    this.rightArm = this.buildRealisticArm(0.30, false, fabricMat, accentMat, skinMat);
    this.rigRoot.add(this.leftArm);
    this.rigRoot.add(this.rightArm);

    // 6. Realistic Sculpted Head, Face & Hair inside rigRoot
    this.head = this.buildRealisticHead(skinMat, lipMat, hairMat, hairStyle, hairCol, accessory, accentMat);
    this.rigRoot.add(this.head);

    this.proceduralParts = [this.leftLeg, this.rightLeg, this.torso, this.leftArm, this.rightArm, this.head];
  }

  /**
   * Builds an anatomically contoured human leg with thigh, articulated knee patella,
   * contoured calf, ankle, and realistic dress shoe with defined sole and heel.
   */
  buildRealisticLeg(xOffset, isLeft, fabricMat, shoeMat, skinMat) {
    const legGroup = new THREE.Group();
    legGroup.position.set(xOffset, 0.98, 0);

    // A. Upper Thigh (Muscular contoured taper from hip down to knee)
    const thighGeo = new THREE.CylinderGeometry(0.098, 0.082, 0.44, 16);
    const thigh = new THREE.Mesh(thighGeo, fabricMat);
    thigh.position.set(0, -0.22, 0.01);
    legGroup.add(thigh);

    // B. Articulated Knee Joint Group (Pivot at y = -0.44)
    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(0, -0.44, 0);

    // Knee Patella Transition
    const kneeGeo = new THREE.SphereGeometry(0.083, 12, 10);
    kneeGeo.scale(1.0, 0.85, 1.15);
    const knee = new THREE.Mesh(kneeGeo, fabricMat);
    knee.position.set(0, 0, 0.02);
    kneeGroup.add(knee);

    // C. Lower Leg / Calf (Anatomical gastrocnemius curve tapering down to ankle)
    const calfGeo = new THREE.CylinderGeometry(0.082, 0.064, 0.44, 16);
    const calf = new THREE.Mesh(calfGeo, fabricMat);
    calf.position.set(0, -0.22, 0);
    kneeGroup.add(calf);

    // D. Realistic Tailored Dress Shoe / Oxford Footwear
    // Heel starts at y = -0.44 relative to knee, sole bottom reaches -0.54 relative to knee
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.44, 0.04);

    // Shoe Upper vamp & quarter with curved toe box
    const shoeUpperGeo = new THREE.BoxGeometry(0.155, 0.085, 0.28);
    const shoeUpper = new THREE.Mesh(shoeUpperGeo, shoeMat);
    shoeUpper.position.set(0, -0.025, 0.025);
    shoeGroup.add(shoeUpper);

    // Rounded Toe Cap
    const toeCapGeo = new THREE.CylinderGeometry(0.076, 0.076, 0.085, 12, 1, false, 0, Math.PI);
    const toeCap = new THREE.Mesh(toeCapGeo, shoeMat);
    toeCap.rotation.y = Math.PI / 2;
    toeCap.position.set(0, -0.025, 0.165);
    shoeGroup.add(toeCap);

    // Distinct Outsole welt
    const soleMat = new THREE.MeshStandardMaterial({
      color: '#1a1614',
      roughness: 0.8,
    });
    const soleGeo = new THREE.BoxGeometry(0.165, 0.02, 0.31);
    const sole = new THREE.Mesh(soleGeo, soleMat);
    sole.position.set(0, -0.07, 0.035);
    shoeGroup.add(sole);

    // Raised Dress Heel Block at rear of foot
    const heelGeo = new THREE.BoxGeometry(0.15, 0.025, 0.09);
    const heel = new THREE.Mesh(heelGeo, soleMat);
    heel.position.set(0, -0.085, -0.065);
    shoeGroup.add(heel);

    // Shoe Laces / Buckle Accent
    const laceMat = new THREE.MeshBasicMaterial({ color: '#c5a059' });
    const laceGeo = new THREE.BoxGeometry(0.06, 0.012, 0.08);
    const lace = new THREE.Mesh(laceGeo, laceMat);
    lace.position.set(0, 0.022, 0.04);
    shoeGroup.add(lace);

    kneeGroup.add(shoeGroup);
    legGroup.add(kneeGroup);

    if (isLeft) this.leftKnee = kneeGroup;
    else this.rightKnee = kneeGroup;

    return legGroup;
  }

  /**
   * Builds an anatomically proportioned human torso with tailored wedding attire,
   * natural waist taper, beskap asymmetric placket / kebaya kutubaru panel, and chest brooch.
   */
  buildRealisticTorso(fabricMat, lowerFabricMat, accentMat, skinMat, outfit) {
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.98, 0);

    // A. Pelvis & Lower Hips (Wrapped in traditional Batik Jarik or tailored trousers)
    const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.30, 18);
    pelvisGeo.scale(1.18, 1.0, 0.88);
    const pelvis = new THREE.Mesh(pelvisGeo, lowerFabricMat);
    pelvis.position.set(0, 0.15, 0);
    torsoGroup.add(pelvis);

    // B. Waist & Midsection (Natural human inward curvature)
    const waistGeo = new THREE.CylinderGeometry(0.26, 0.23, 0.24, 18);
    waistGeo.scale(1.15, 1.0, 0.84);
    const waist = new THREE.Mesh(waistGeo, fabricMat);
    waist.position.set(0, 0.38, 0);
    torsoGroup.add(waist);

    // Gold Embroidered Waist Belt / Sabuk / Kamus / Selendang trim
    const beltGeo = new THREE.CylinderGeometry(0.265, 0.265, 0.065, 18);
    beltGeo.scale(1.16, 1.0, 0.86);
    const belt = new THREE.Mesh(beltGeo, accentMat);
    belt.position.set(0, 0.32, 0);
    torsoGroup.add(belt);

    // C. Upper Chest & Pectorals (Broadening to shoulders)
    const chestGeo = new THREE.CylinderGeometry(0.29, 0.26, 0.38, 18);
    chestGeo.scale(1.22, 1.0, 0.86);
    const chest = new THREE.Mesh(chestGeo, fabricMat);
    chest.position.set(0, 0.65, 0);
    torsoGroup.add(chest);

    // D. Tailored Collar & Lapels
    if (outfit === 'tuxedo') {
      const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.03), accentMat);
      lapelL.rotation.z = -0.22;
      lapelL.position.set(-0.11, 0.68, 0.20);
      torsoGroup.add(lapelL);

      const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.03), accentMat);
      lapelR.rotation.z = 0.22;
      lapelR.position.set(0.11, 0.68, 0.20);
      torsoGroup.add(lapelR);

      const shirtMat = new THREE.MeshStandardMaterial({ color: '#fcfcfc', roughness: 0.5 });
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.02), shirtMat);
      shirt.position.set(0, 0.66, 0.19);
      torsoGroup.add(shirt);

      const tieMat = new THREE.MeshStandardMaterial({ color: '#15151b', roughness: 0.3 });
      const bowTie = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 0.03), tieMat);
      bowTie.position.set(0, 0.80, 0.21);
      torsoGroup.add(bowTie);
    } else if (outfit === 'beskap_hitam') {
      // Proper Black Traditional Beskap: High standing Mandarin collar + asymmetric diagonal closed flap + gold chain
      const beskapBlackTrimMat = new THREE.MeshStandardMaterial({ color: '#101014', roughness: 0.55, metalness: 0.1 });
      const collarGeo = new THREE.CylinderGeometry(0.116, 0.132, 0.11, 16);
      collarGeo.scale(1.1, 1.0, 0.9);
      const collar = new THREE.Mesh(collarGeo, beskapBlackTrimMat);
      collar.position.set(0, 0.86, 0);
      torsoGroup.add(collar);

      // Thin gold collar piping rim
      const collarPiping = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.008, 8, 20), accentMat);
      collarPiping.rotation.x = Math.PI / 2;
      collarPiping.position.set(0, 0.91, 0);
      torsoGroup.add(collarPiping);

      // Signature diagonal Beskap front overlapping flap (Tutup Beskap Miring)
      const diagFlap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.50, 0.03), beskapBlackTrimMat);
      diagFlap.rotation.z = -0.22;
      diagFlap.position.set(0.02, 0.59, 0.205);
      torsoGroup.add(diagFlap);

      // Diagonal Gold Buttons along asymmetric lapel edge
      const btnMat = new THREE.MeshStandardMaterial({ color: '#f4c542', metalness: 0.95, roughness: 0.2 });
      for (let b = 0; b < 4; b++) {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.018, 10), btnMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(-0.04 + b * 0.032, 0.42 + b * 0.11, 0.225);
        torsoGroup.add(btn);
      }

      // Traditional Rantai Beskap (Curved gold watch chain & pocket emblem)
      const chainArc = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.007, 6, 16, Math.PI), accentMat);
      chainArc.rotation.z = Math.PI;
      chainArc.position.set(0.09, 0.61, 0.222);
      torsoGroup.add(chainArc);

      const emblem = new THREE.Mesh(new THREE.DodecahedronGeometry(0.028), accentMat);
      emblem.position.set(0.14, 0.67, 0.222);
      torsoGroup.add(emblem);
    } else if (outfit === 'kebaya_putih') {
      // Elegant White Kebaya with Kutubaru center lace panel, delicate V neckline & gold brooch
      const whiteLaceMat = new THREE.MeshStandardMaterial({ color: '#fcfaf4', roughness: 0.58 });
      const kutubaruPanel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.50, 0.032), whiteLaceMat);
      kutubaruPanel.position.set(0, 0.58, 0.202);
      torsoGroup.add(kutubaruPanel);

      // Scalloped kebaya lower flare hem over batik jarik
      const kebayaHem = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.30, 0.18, 18), whiteLaceMat);
      kebayaHem.scale.set(1.18, 1.0, 0.88);
      kebayaHem.position.set(0, 0.24, 0);
      torsoGroup.add(kebayaHem);

      // Delicate V-collar framing
      const vTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.30, 0.028), accentMat);
      vTrimL.rotation.z = -0.28;
      vTrimL.position.set(-0.08, 0.72, 0.205);
      torsoGroup.add(vTrimL);

      const vTrimR = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.30, 0.028), accentMat);
      vTrimR.rotation.z = 0.28;
      vTrimR.position.set(0.08, 0.72, 0.205);
      torsoGroup.add(vTrimR);

      // Signature Gold Bros Kutubaru (3-tier chest brooch)
      for (let k = 0; k < 3; k++) {
        const bros = new THREE.Mesh(new THREE.DodecahedronGeometry(0.026 - k * 0.004), accentMat);
        bros.position.set(0, 0.68 - k * 0.08, 0.226);
        torsoGroup.add(bros);
      }
    } else {
      // Traditional Royal Wedding Beskap / Kebaya
      const collarGeo = new THREE.CylinderGeometry(0.115, 0.13, 0.10, 16);
      collarGeo.scale(1.1, 1.0, 0.9);
      const collar = new THREE.Mesh(collarGeo, accentMat);
      collar.position.set(0, 0.86, 0);
      torsoGroup.add(collar);

      const placketGeo = new THREE.BoxGeometry(0.065, 0.54, 0.035);
      const placket = new THREE.Mesh(placketGeo, accentMat);
      placket.position.set(0, 0.60, 0.20);
      torsoGroup.add(placket);

      const btnMat = new THREE.MeshStandardMaterial({ color: '#f4c542', metalness: 0.95, roughness: 0.2 });
      for (let b = 0; b < 4; b++) {
        const btnGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.018, 10);
        const btn = new THREE.Mesh(btnGeo, btnMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(0, 0.40 + b * 0.11, 0.22);
        torsoGroup.add(btn);
      }

      const broochGeo = new THREE.DodecahedronGeometry(0.038);
      const brooch = new THREE.Mesh(broochGeo, accentMat);
      brooch.position.set(0.12, 0.70, 0.21);
      torsoGroup.add(brooch);
    }

    // E. Clavicle, Trapezius Slope & Neck Connection
    const trapGeo = new THREE.SphereGeometry(0.16, 14, 10);
    trapGeo.scale(1.85, 0.42, 0.95);
    const trapezius = new THREE.Mesh(trapGeo, fabricMat);
    trapezius.position.set(0, 0.83, -0.01);
    torsoGroup.add(trapezius);

    const neckGeo = new THREE.CylinderGeometry(0.072, 0.088, 0.22, 18);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 0.98, 0);
    torsoGroup.add(neck);

    return torsoGroup;
  }

  /**
   * Builds an anatomically proportioned arm with deltoid shoulder cap,
   * contoured upper arm, elbow, forearm, tailored sleeve cuffs,
   * and sculpted 3D human hands with articulated fingers.
   */
  buildRealisticArm(xOffset, isLeft, fabricMat, accentMat, skinMat) {
    const armGroup = new THREE.Group();
    armGroup.position.set(xOffset, 1.76, 0);

    // A. Deltoid Shoulder Cap (Smooth connection to torso)
    const deltoidGeo = new THREE.SphereGeometry(0.086, 14, 12);
    deltoidGeo.scale(1.1, 1.2, 1.1);
    const deltoid = new THREE.Mesh(deltoidGeo, fabricMat);
    deltoid.position.set(isLeft ? 0.02 : -0.02, 0, 0);
    armGroup.add(deltoid);

    // B. Upper Arm / Bicep (Tapered natural sleeve)
    const bicepGeo = new THREE.CylinderGeometry(0.076, 0.068, 0.35, 14);
    const bicep = new THREE.Mesh(bicepGeo, fabricMat);
    bicep.position.set(0, -0.18, 0);
    armGroup.add(bicep);

    // C. Elbow Joint
    const elbowGeo = new THREE.SphereGeometry(0.068, 10, 10);
    const elbow = new THREE.Mesh(elbowGeo, fabricMat);
    elbow.position.set(0, -0.36, -0.01);
    armGroup.add(elbow);

    // D. Forearm (Contoured flexor taper towards wrist)
    const forearmGeo = new THREE.CylinderGeometry(0.068, 0.058, 0.34, 14);
    const forearm = new THREE.Mesh(forearmGeo, fabricMat);
    forearm.position.set(0, -0.53, 0);
    armGroup.add(forearm);

    // Tailored Sleeve Cuff with gold piping
    const cuffGeo = new THREE.CylinderGeometry(0.064, 0.064, 0.045, 14);
    const cuff = new THREE.Mesh(cuffGeo, accentMat);
    cuff.position.set(0, -0.68, 0);
    armGroup.add(cuff);

    // E. Realistic Sculpted Human Hand with Articulated Fingers
    const handGroup = this.buildRealisticHand(isLeft, skinMat);
    handGroup.position.set(0, -0.73, 0);
    armGroup.add(handGroup);

    return armGroup;
  }

  /**
   * Sculpted realistic 3D human hand:
   * Palm, thenar thumb pad, opposable thumb, and four fingers (index, middle, ring, pinky)
   * gently relaxed in a natural realistic pose.
   */
  buildRealisticHand(isLeft, skinMat) {
    const handGroup = new THREE.Group();

    // 1. Palm (Organic contoured ellipsoid with natural metacarpal fullness)
    const palmGeo = new THREE.SphereGeometry(0.044, 14, 12);
    palmGeo.scale(0.92, 1.05, 0.42);
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.position.set(0, -0.041, 0);
    handGroup.add(palm);

    // 2. Thumb (Opposable, angled anteriorly & medially)
    const thumbGroup = new THREE.Group();
    const thumbX = isLeft ? 0.032 : -0.032;
    thumbGroup.position.set(thumbX, -0.028, 0.013);
    thumbGroup.rotation.y = isLeft ? 0.45 : -0.45;
    thumbGroup.rotation.z = isLeft ? -0.35 : 0.35;

    const thumbGeo = new THREE.CylinderGeometry(0.0135, 0.0115, 0.052, 8);
    const thumbMesh = new THREE.Mesh(thumbGeo, skinMat);
    thumbMesh.position.y = -0.025;
    thumbGroup.add(thumbMesh);
    handGroup.add(thumbGroup);

    // 3. Four Articulate Fingers + Knuckles (Index, Middle, Ring, Pinky)
    const fingerLengths = [0.058, 0.064, 0.060, 0.048];
    const fingerRadii = [0.011, 0.0115, 0.011, 0.0095];
    const knuckleGeo = new THREE.SphereGeometry(0.0115, 8, 6);

    for (let f = 0; f < 4; f++) {
      const fingerIdx = isLeft ? f : 3 - f;
      const fx = (f - 1.5) * 0.016;
      const len = fingerLengths[fingerIdx];
      const rad = fingerRadii[fingerIdx];

      const knuckle = new THREE.Mesh(knuckleGeo, skinMat);
      knuckle.position.set(fx, -0.078, 0.002);
      handGroup.add(knuckle);

      const fingerGroup = new THREE.Group();
      fingerGroup.position.set(fx, -0.080, 0);
      fingerGroup.rotation.x = 0.22 + f * 0.05;

      const fingerGeo = new THREE.CylinderGeometry(rad * 0.85, rad, len, 8);
      const fingerMesh = new THREE.Mesh(fingerGeo, skinMat);
      fingerMesh.position.y = -len / 2;
      fingerGroup.add(fingerMesh);

      handGroup.add(fingerGroup);
    }

    return handGroup;
  }

  /**
   * Builds an anatomically realistic human head, face, and hair.
   */
  buildRealisticHead(skinMat, lipMat, hairMat, hairStyle, hairCol, accessory, accentMat) {
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.14, 0);

    // A. Anatomical Cranium & Facial Bone Structure
    const craniumGeo = new THREE.SphereGeometry(0.19, 28, 24);
    craniumGeo.scale(0.96, 1.15, 1.05);
    const cranium = new THREE.Mesh(craniumGeo, skinMat);
    headGroup.add(cranium);

    // Sculpted Jawline & Chin
    const jawGeo = new THREE.CylinderGeometry(0.14, 0.08, 0.18, 16);
    jawGeo.scale(1.0, 1.0, 0.92);
    const jaw = new THREE.Mesh(jawGeo, skinMat);
    jaw.position.set(0, -0.08, 0.03);
    headGroup.add(jaw);

    // Prominent Chin Mound
    const chinGeo = new THREE.SphereGeometry(0.048, 12, 10);
    chinGeo.scale(1.1, 0.9, 1.1);
    const chin = new THREE.Mesh(chinGeo, skinMat);
    chin.position.set(0, -0.15, 0.12);
    headGroup.add(chin);

    // Sculpted Cheekbones (Soft natural transition)
    const cheekGeo = new THREE.SphereGeometry(0.055, 10, 10);
    cheekGeo.scale(0.9, 0.9, 1.1);
    const leftCheek = new THREE.Mesh(cheekGeo, skinMat);
    leftCheek.position.set(-0.12, -0.02, 0.10);
    const rightCheek = new THREE.Mesh(cheekGeo, skinMat);
    rightCheek.position.set(0.12, -0.02, 0.10);
    headGroup.add(leftCheek);
    headGroup.add(rightCheek);

    // Sculpted Arched Brow Ridges (Smooth anatomical supraorbital curve)
    const browRidgeGeo = new THREE.SphereGeometry(0.042, 10, 8);
    browRidgeGeo.scale(1.35, 0.32, 0.55);
    const leftBrowRidge = new THREE.Mesh(browRidgeGeo, skinMat);
    leftBrowRidge.rotation.z = -0.08;
    leftBrowRidge.position.set(-0.068, 0.074, 0.168);
    const rightBrowRidge = new THREE.Mesh(browRidgeGeo, skinMat);
    rightBrowRidge.rotation.z = 0.08;
    rightBrowRidge.position.set(0.068, 0.074, 0.168);
    headGroup.add(leftBrowRidge);
    headGroup.add(rightBrowRidge);

    // B. Realistic Almond Eyes
    this.buildRealisticEyes(headGroup, hairCol);

    // C. Sculpted Nose Bridge & Nostrils
    this.buildRealisticNose(headGroup, skinMat);

    // D. Realistic Modeled Lips & Mouth
    this.buildRealisticLips(headGroup, lipMat);

    // E. Realistic Sculpted Human Ears
    this.buildRealisticEars(headGroup, skinMat);

    // F. Realistic Hair / Headwear System
    this.buildRealisticHair(headGroup, hairStyle, hairMat, hairCol, accentMat);

    // G. Realistic Accessories
    this.buildRealisticAccessory(headGroup, accessory, accentMat);

    return headGroup;
  }

  /**
   * Realistic human eyes with procedural high-res iris texture,
   * sclera, moist corneal reflection, sculpted eyelids, and groomed eyebrows.
   */
  buildRealisticEyes(headGroup, hairCol) {
    const irisTex = characterTextures.getIrisTexture();
    const eyeMat = new THREE.MeshStandardMaterial({
      map: irisTex,
      roughness: 0.1,
      metalness: 0.05,
    });

    const eyeGeo = new THREE.SphereGeometry(0.036, 16, 14);

    // Left Eyeball
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.rotation.y = -Math.PI / 2 + 0.04;
    leftEye.position.set(-0.072, 0.035, 0.165);
    headGroup.add(leftEye);

    // Right Eyeball
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.rotation.y = -Math.PI / 2 - 0.04;
    rightEye.position.set(0.072, 0.035, 0.165);
    headGroup.add(rightEye);

    // Upper Eyelids
    const eyelidMat = new THREE.MeshStandardMaterial({
      color: '#42241d',
      roughness: 0.6,
    });
    const eyelidGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.010, 12, 1, false, 0, Math.PI);

    const leftUpperLid = new THREE.Mesh(eyelidGeo, eyelidMat);
    leftUpperLid.rotation.z = Math.PI / 2;
    leftUpperLid.rotation.y = -Math.PI / 2;
    leftUpperLid.position.set(-0.072, 0.048, 0.172);
    headGroup.add(leftUpperLid);

    const rightUpperLid = new THREE.Mesh(eyelidGeo, eyelidMat);
    rightUpperLid.rotation.z = Math.PI / 2;
    rightUpperLid.rotation.y = -Math.PI / 2;
    rightUpperLid.position.set(0.072, 0.048, 0.172);
    headGroup.add(rightUpperLid);

    // Sculpted Arched Eyebrows matching hair color
    const browMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairCol),
      roughness: 0.78,
    });
    const browMeshGeo = new THREE.CapsuleGeometry(0.007, 0.050, 4, 8);

    const leftBrow = new THREE.Mesh(browMeshGeo, browMat);
    leftBrow.rotation.z = Math.PI / 2 - 0.08;
    leftBrow.position.set(-0.074, 0.072, 0.180);
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browMeshGeo, browMat);
    rightBrow.rotation.z = Math.PI / 2 + 0.08;
    rightBrow.position.set(0.074, 0.072, 0.180);
    headGroup.add(rightBrow);
  }

  /**
   * Sculpted human nose with nasal bridge, defined tip (lobule),
   * and lateral alar nostrils with depth.
   */
  buildRealisticNose(headGroup, skinMat) {
    const noseGroup = new THREE.Group();
    noseGroup.position.set(0, 0.01, 0.18);

    // 1. Nasal Bridge
    const bridgeGeo = new THREE.CylinderGeometry(0.012, 0.018, 0.07, 8);
    const bridge = new THREE.Mesh(bridgeGeo, skinMat);
    bridge.rotation.x = 0.22;
    bridge.position.set(0, 0.018, 0.008);
    noseGroup.add(bridge);

    // 2. Nose Tip (Lobule)
    const tipGeo = new THREE.SphereGeometry(0.019, 10, 8);
    const tip = new THREE.Mesh(tipGeo, skinMat);
    tip.position.set(0, -0.020, 0.024);
    noseGroup.add(tip);

    // 3. Nostril Wings (Alar cartilages)
    const alarGeo = new THREE.SphereGeometry(0.013, 8, 6);
    alarGeo.scale(0.8, 0.9, 1.1);

    const leftAlar = new THREE.Mesh(alarGeo, skinMat);
    leftAlar.position.set(-0.019, -0.023, 0.016);
    noseGroup.add(leftAlar);

    const rightAlar = new THREE.Mesh(alarGeo, skinMat);
    rightAlar.position.set(0.019, -0.023, 0.016);
    noseGroup.add(rightAlar);

    headGroup.add(noseGroup);
  }

  /**
   * Sculpted human lips with Cupid's bow, philtrum groove,
   * fuller lower lip, and vermilion border.
   */
  buildRealisticLips(headGroup, lipMat) {
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.075, 0.175);

    // Upper Lip with Cupid's bow dip
    const upperLipGeo = new THREE.CylinderGeometry(0.010, 0.012, 0.068, 10);
    upperLipGeo.scale(1.0, 0.6, 1.1);
    const upperLip = new THREE.Mesh(upperLipGeo, lipMat);
    upperLip.rotation.z = Math.PI / 2;
    upperLip.position.set(0, 0.009, 0.012);
    mouthGroup.add(upperLip);

    // Lower Lip (Fuller, moist vermilion contour)
    const lowerLipGeo = new THREE.CylinderGeometry(0.012, 0.014, 0.064, 10);
    lowerLipGeo.scale(1.0, 0.75, 1.15);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat);
    lowerLip.rotation.z = Math.PI / 2;
    lowerLip.position.set(0, -0.009, 0.014);
    mouthGroup.add(lowerLip);

    // Philtrum vertical dip
    const philtrumMat = new THREE.MeshStandardMaterial({ color: '#522b22', roughness: 0.6 });
    const lineGeo = new THREE.BoxGeometry(0.055, 0.004, 0.008);
    const line = new THREE.Mesh(lineGeo, philtrumMat);
    line.position.set(0, 0.001, 0.018);
    mouthGroup.add(line);

    headGroup.add(mouthGroup);
  }

  /**
   * Realistic sculpted human ears with helix, antihelix, and earlobes.
   */
  buildRealisticEars(headGroup, skinMat) {
    const earGeo = new THREE.SphereGeometry(0.038, 12, 10);
    earGeo.scale(0.35, 1.45, 0.85);

    // Left Ear
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.rotation.z = 0.12;
    leftEar.rotation.y = -0.18;
    leftEar.position.set(-0.19, 0.015, -0.01);
    headGroup.add(leftEar);

    // Right Ear
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.rotation.z = -0.12;
    rightEar.rotation.y = 0.18;
    rightEar.position.set(0.19, 0.015, -0.01);
    headGroup.add(rightEar);
  }



  /**
   * Volumetric realistic hairstyles with strand fiber textures,
   * natural hairlines, and authentic cultural designs.
   */
  buildRealisticHair(headGroup, style, hairMat, hairCol, accentMat) {
    if (style === 'hijab') {
      // Flowing elegant Pashmina Hijab with soft natural draping folds
      const hijabMat = new THREE.MeshStandardMaterial({
        color: '#f9f6f0',
        roughness: 0.78,
      });

      // Cranial wrap
      const hoodGeo = new THREE.SphereGeometry(0.28, 20, 18);
      hoodGeo.scale(1.04, 1.20, 1.15);
      const hood = new THREE.Mesh(hoodGeo, hijabMat);
      hood.position.set(0, 0.04, -0.03);
      headGroup.add(hood);

      // Elegant Neck & Shoulder Drape
      const drapeGeo = new THREE.CylinderGeometry(0.25, 0.38, 0.46, 18, 1, true);
      const drape = new THREE.Mesh(drapeGeo, hijabMat);
      drape.position.set(0, -0.30, 0.02);
      headGroup.add(drape);

      // Gold Brooch Pinning at side of collar
      const pin = new THREE.Mesh(new THREE.DodecahedronGeometry(0.028), accentMat);
      pin.position.set(0.18, -0.18, 0.18);
      headGroup.add(pin);
    } else if (style === 'bun') {
      // Royal Wedding Updo / Chignon Bun with golden hairpin (Tusuk Konde)
      const capGeo = new THREE.SphereGeometry(0.26, 20, 16);
      capGeo.scale(1.02, 1.08, 1.05);
      const cap = new THREE.Mesh(capGeo, hairMat);
      cap.position.set(0, 0.08, -0.03);
      headGroup.add(cap);

      // Volumetric Braided Chignon Bun at back/crown
      const bunGeo = new THREE.SphereGeometry(0.15, 16, 14);
      bunGeo.scale(1.2, 1.0, 0.9);
      const bun = new THREE.Mesh(bunGeo, hairMat);
      bun.position.set(0, 0.28, -0.18);
      headGroup.add(bun);

      // Gold Hairpin Accent (Tusuk Konde) with floral filigree
      const pinGroup = new THREE.Group();
      pinGroup.position.set(0.08, 0.28, -0.12);
      pinGroup.rotation.z = 0.75;

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.38, 8), accentMat);
      pinGroup.add(stem);

      const flowerHead = new THREE.Mesh(new THREE.DodecahedronGeometry(0.032), accentMat);
      flowerHead.position.y = 0.19;
      pinGroup.add(flowerHead);

      headGroup.add(pinGroup);
    } else if (style === 'wavy' || style === 'long') {
      // Shoulder-length soft layered waves framing face
      const crownHair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 16), hairMat);
      crownHair.position.set(0, 0.09, -0.03);
      headGroup.add(crownHair);

      // Left cascading wavy locks
      const curlL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.10, 0.55, 12), hairMat);
      curlL.rotation.z = 0.12;
      curlL.position.set(-0.24, -0.16, 0.04);
      headGroup.add(curlL);

      // Right cascading wavy locks
      const curlR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.10, 0.55, 12), hairMat);
      curlR.rotation.z = -0.12;
      curlR.position.set(0.24, -0.16, 0.04);
      headGroup.add(curlR);

      // Back waterfall hair volume
      const backHair = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.52, 14), hairMat);
      backHair.position.set(0, -0.16, -0.14);
      headGroup.add(backHair);
    } else if (style === 'cap') {
      // Traditional Royal Indonesian Blangkon / Songkok Peci
      const peciMat = new THREE.MeshStandardMaterial({
        color: '#1a1412',
        roughness: 0.6,
      });
      const peciGeo = new THREE.CylinderGeometry(0.26, 0.27, 0.22, 20);
      peciGeo.scale(1.02, 1.0, 1.06);
      const peci = new THREE.Mesh(peciGeo, peciMat);
      peci.position.set(0, 0.19, -0.01);
      headGroup.add(peci);

      // Gold Embroidered Band Trim
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.016, 8, 24), accentMat);
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 0.09, -0.01);
      headGroup.add(band);
    } else {
      // Default: Modern Textured Fade Crop with layered pompadour quiff
      const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 18), hairMat);
      hairBase.scale.set(1.01, 1.10, 1.06);
      hairBase.position.set(0, 0.08, -0.03);
      headGroup.add(hairBase);

      // Volumetric Top Quiff / Fringe
      const quiffGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.22, 14);
      quiffGeo.scale(1.2, 0.8, 1.0);
      const quiff = new THREE.Mesh(quiffGeo, hairMat);
      quiff.rotation.x = 0.45;
      quiff.position.set(0, 0.24, 0.14);
      headGroup.add(quiff);
    }
  }

  /**
   * High-end realistic accessories:
   * - Gold Crown / Suntiang with spires & pendants
   * - Titanium wireframe glasses with reflective lenses
   * - Indonesian Jasmine (Melati) garland
   */
  buildRealisticAccessory(headGroup, accessory, accentMat) {
    if (accessory === 'crown') {
      const crownGroup = new THREE.Group();
      crownGroup.position.set(0, 0.27, 0);

      // Filigree Circlet Ring
      const ringGeo = new THREE.TorusGeometry(0.22, 0.024, 8, 24);
      const ring = new THREE.Mesh(ringGeo, accentMat);
      ring.rotation.x = Math.PI / 2;
      crownGroup.add(ring);

      // 7 Royal Spires with Gemstone tips
      const gemMat = new THREE.MeshStandardMaterial({
        color: '#ff3344',
        roughness: 0.1,
        metalness: 0.9,
      });

      for (let i = 0; i < 7; i++) {
        const a = (i - 3) * 0.28;
        const h = 0.14 - Math.abs(i - 3) * 0.018;

        const spireGeo = new THREE.ConeGeometry(0.026, h, 8);
        const spire = new THREE.Mesh(spireGeo, accentMat);
        spire.position.set(Math.sin(a) * 0.22, h / 2 + 0.01, Math.cos(a) * 0.22);
        crownGroup.add(spire);

        const gem = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), gemMat);
        gem.position.set(Math.sin(a) * 0.22, h + 0.01, Math.cos(a) * 0.22);
        crownGroup.add(gem);
      }

      headGroup.add(crownGroup);
    } else if (accessory === 'glasses') {
      const frameMat = new THREE.MeshStandardMaterial({
        color: '#1a1820',
        metalness: 0.8,
        roughness: 0.2,
      });
      const lensMat = new THREE.MeshStandardMaterial({
        color: '#dbeeff',
        transparent: true,
        opacity: 0.45,
        roughness: 0.05,
      });

      const glassesGroup = new THREE.Group();
      glassesGroup.position.set(0, 0.045, 0.225);

      // Left Frame & Lens
      const frameL = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 8, 16), frameMat);
      frameL.position.set(-0.092, 0, 0);
      glassesGroup.add(frameL);

      const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.054, 16), lensMat);
      lensL.position.set(-0.092, 0, 0);
      glassesGroup.add(lensL);

      // Right Frame & Lens
      const frameR = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 8, 16), frameMat);
      frameR.position.set(0.092, 0, 0);
      glassesGroup.add(frameR);

      const lensR = new THREE.Mesh(new THREE.CircleGeometry(0.054, 16), lensMat);
      lensR.position.set(0.092, 0, 0);
      glassesGroup.add(lensR);

      // Bridge
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.009, 0.012), frameMat);
      bridge.position.set(0, 0.01, 0);
      glassesGroup.add(bridge);

      headGroup.add(glassesGroup);
    } else if (accessory === 'flower') {
      // Indonesian Melati (Jasmine) Wedding Ear Blossom
      const flowerGroup = new THREE.Group();
      flowerGroup.position.set(0.23, 0.12, 0.08);

      const petalMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.4,
      });
      const centerMat = new THREE.MeshStandardMaterial({
        color: '#ffd54f',
        roughness: 0.3,
      });

      for (let p = 0; p < 6; p++) {
        const a = (p * Math.PI * 2) / 6;
        const petal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.032), petalMat);
        petal.position.set(Math.cos(a) * 0.045, Math.sin(a) * 0.045, 0);
        flowerGroup.add(petal);
      }

      const center = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), centerMat);
      center.position.z = 0.015;
      flowerGroup.add(center);

      headGroup.add(flowerGroup);
    }
  }
}
