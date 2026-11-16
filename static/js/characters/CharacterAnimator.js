import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ASSET_MANIFEST, fetchAssetStatus } from '../config/assetManifest.js';

export const CHARACTER_ANIM_STATES = Object.freeze({
  IDLE: 'idle',
  WALKING: 'walking',
  TURNING: 'turning',
  SITTING: 'sitting',
  STANDING: 'standing',
  GREETING: 'greeting'
});

const sharedGltfLoader = new GLTFLoader();

function resolveClipForState(clips, stateName) {
  if (!Array.isArray(clips) || clips.length === 0) return null;
  const aliases = ASSET_MANIFEST.models.animationClips[stateName] || [stateName];
  const loweredAliases = aliases.map((a) => String(a).toLowerCase());

  for (const candidate of loweredAliases) {
    const exact = clips.find((c) => c.name && c.name.toLowerCase() === candidate);
    if (exact) return exact;
  }
  for (const candidate of loweredAliases) {
    const partial = clips.find((c) => c.name && c.name.toLowerCase().includes(candidate));
    if (partial) return partial;
  }
  return null;
}

/**
 * CharacterRiggedModel - Wraps an optional uploaded .glb character + THREE.AnimationMixer.
 * Never throws or triggers 404 console spam when .glb assets have not been uploaded yet.
 */
export class CharacterRiggedModel {
  constructor(sceneRoot, animations = [], role = 'guest') {
    this.sceneRoot = sceneRoot;
    this.role = role;
    this.mixer = animations.length > 0 ? new THREE.AnimationMixer(sceneRoot) : null;
    this.actions = new Map();
    this.currentState = null;

    if (this.mixer) {
      Object.values(CHARACTER_ANIM_STATES).forEach((stateName) => {
        const clip = resolveClipForState(animations, stateName);
        if (clip) {
          const action = this.mixer.clipAction(clip);
          if (stateName === CHARACTER_ANIM_STATES.STANDING || stateName === CHARACTER_ANIM_STATES.GREETING) {
            action.setLoop(THREE.LoopRepeat);
          }
          this.actions.set(stateName, action);
        }
      });

      // Fallback if uploaded GLB only contains a single generic clip
      if (this.actions.size === 0 && animations[0]) {
        this.actions.set(CHARACTER_ANIM_STATES.IDLE, this.mixer.clipAction(animations[0]));
      }
    }
  }

  playState(stateName) {
    if (!this.mixer || this.actions.size === 0) return;
    const normalized = this.actions.has(stateName)
      ? stateName
      : (this.actions.has(CHARACTER_ANIM_STATES.IDLE) ? CHARACTER_ANIM_STATES.IDLE : Array.from(this.actions.keys())[0]);

    if (!normalized || this.currentState === normalized) return;
    const nextAction = this.actions.get(normalized);
    if (!nextAction) return;

    const prevAction = this.currentState ? this.actions.get(this.currentState) : null;
    nextAction.reset();
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);
    nextAction.play();

    if (prevAction && prevAction !== nextAction) {
      prevAction.crossFadeTo(nextAction, 0.22, true);
    }
    this.currentState = normalized;
  }

  update(delta = 0.016) {
    if (this.mixer) {
      this.mixer.update(Math.min(0.05, Math.max(0.001, delta)));
    }
  }

  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.sceneRoot);
      this.mixer = null;
    }
    this.actions.clear();
  }
}

/**
 * Safely checks server filesystem manifest before requesting any .glb file.
 * Returns null cleanly when rigged GLB files are not yet uploaded.
 */
export async function loadOptionalRiggedCharacter(role = 'guest') {
  const modelCfg = ASSET_MANIFEST.models.characters[role];
  if (!modelCfg || !modelCfg.url) return null;

  const status = await fetchAssetStatus();
  const isAvailable = Boolean(status && status.models && status.models.characters && status.models.characters[role]);
  if (!isAvailable) {
    return null;
  }

  try {
    const gltf = await sharedGltfLoader.loadAsync(modelCfg.url);
    if (!gltf || !gltf.scene) return null;

    const modelScene = gltf.scene;
    modelScene.updateMatrixWorld(true);

    const bbox = new THREE.Box3().setFromObject(modelScene);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    if (size.y > 0.05) {
      const targetHeight = modelCfg.targetHeightMeters || 2.34;
      const uniformScale = targetHeight / size.y;
      modelScene.scale.multiplyScalar(uniformScale);
    }

    // Recompute bounds and ground sole flush to y = 0
    modelScene.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(modelScene);
    const center = new THREE.Vector3();
    scaledBox.getCenter(center);
    modelScene.position.x -= center.x;
    modelScene.position.z -= center.z;
    modelScene.position.y -= scaledBox.min.y;

    return new CharacterRiggedModel(modelScene, gltf.animations || [], role);
  } catch (err) {
    console.warn(`Optional rigged GLB load skipped for role=${role}:`, err);
    return null;
  }
}
