import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { ASSET_MANIFEST, fetchAssetStatus } from '../config/assetManifest.js';
import {
  CALIBRATED_STYLE_C_PBR,
  classifyCharacterMaterialKind,
  computeUniformModelScale,
  isModelAssetAvailable
} from './CharacterPipeline.js';

export const CHARACTER_ANIM_STATES = Object.freeze({
  IDLE: 'idle',
  WALKING: 'walking',
  TURNING: 'turning',
  SITTING: 'sitting',
  STANDING: 'standing',
  GREETING: 'greeting'
});

const sharedGltfLoader = new GLTFLoader();
try {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  sharedGltfLoader.setDRACOLoader(dracoLoader);
} catch {
  // Non-Draco GLBs continue working even if Draco setup is skipped
}

// Caches parsed GLTF responses so SkeletonUtils.clone can instantiate multiple NPCs safely
const gltfAssetCache = new Map();

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

function calibrateCharacterMaterial(material, meshName = '') {
  if (!material || typeof material !== 'object') return;
  const kind = classifyCharacterMaterialKind(material.name || '', meshName);
  const spec = CALIBRATED_STYLE_C_PBR[kind] || CALIBRATED_STYLE_C_PBR.fabric;

  if (typeof material.roughness === 'number') {
    material.roughness = Math.min(spec.roughnessMax, Math.max(spec.roughnessMin, material.roughness));
  }
  if (typeof material.metalness === 'number' && typeof spec.metalnessMax === 'number') {
    material.metalness = Math.min(spec.metalnessMax, material.metalness);
  }
  if (typeof material.envMapIntensity === 'number') {
    material.envMapIntensity = spec.envMapIntensity;
  }
  if (material.map) {
    material.map.colorSpace = THREE.SRGBColorSpace;
  }
  material.needsUpdate = true;
}

function prepareClonedGlbHierarchy(root) {
  let hasSkinnedMesh = false;
  let boneCount = 0;

  root.traverse((node) => {
    if (node.isMesh || node.isSkinnedMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;

      if (node.isSkinnedMesh) {
        hasSkinnedMesh = true;
        if (node.skeleton && Array.isArray(node.skeleton.bones)) {
          boneCount = Math.max(boneCount, node.skeleton.bones.length);
        }
      }

      if (Array.isArray(node.material)) {
        node.material = node.material.map((m) => {
          const clonedMat = m ? m.clone() : m;
          calibrateCharacterMaterial(clonedMat, node.name);
          return clonedMat;
        });
      } else if (node.material) {
        node.material = node.material.clone();
        calibrateCharacterMaterial(node.material, node.name);
      }
    } else if (node.isBone) {
      boneCount += 1;
    }
  });

  return { hasSkinnedMesh, boneCount };
}

/**
 * CharacterRiggedModel - Wraps an optional uploaded .glb character + THREE.AnimationMixer.
 * Never throws or triggers 404 console spam when .glb assets have not been uploaded yet.
 */
export class CharacterRiggedModel {
  constructor(sceneRoot, animations = [], role = 'guest', metadata = {}) {
    this.sceneRoot = sceneRoot;
    this.role = role;
    this.metadata = metadata;
    this.clipNames = animations.map((c) => c && c.name).filter(Boolean);
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

  getDiagnostics() {
    return {
      role: this.role,
      hasSkinnedMesh: Boolean(this.metadata.hasSkinnedMesh),
      boneCount: Number(this.metadata.boneCount || 0),
      boundsHeight: Number(this.metadata.boundsHeight || 0),
      clipNames: [...this.clipNames],
      mappedStates: Array.from(this.actions.keys())
    };
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

    // Dispose per-instance cloned materials (geometries & textures stay safely cached on master GLTF)
    if (this.sceneRoot) {
      this.sceneRoot.traverse((node) => {
        if ((node.isMesh || node.isSkinnedMesh) && node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach((m) => m && m.dispose && m.dispose());
          } else if (node.material.dispose) {
            node.material.dispose();
          }
        }
      });
    }
  }
}

async function fetchCachedGltf(url) {
  if (!gltfAssetCache.has(url)) {
    const promise = sharedGltfLoader.loadAsync(url).catch((err) => {
      gltfAssetCache.delete(url);
      throw err;
    });
    gltfAssetCache.set(url, promise);
  }
  return gltfAssetCache.get(url);
}

/**
 * Safely checks server filesystem manifest before requesting any .glb file.
 * Returns null cleanly when rigged GLB files are not yet uploaded.
 */
export async function loadOptionalRiggedCharacter(role = 'guest', options = {}) {
  const modelCfg = ASSET_MANIFEST.models.characters[role];
  if (!modelCfg || !modelCfg.url) return null;

  const status = await fetchAssetStatus();
  const isAvailable = isModelAssetAvailable(status, role, modelCfg.filename);
  if (!isAvailable) {
    return null;
  }

  try {
    const gltf = await fetchCachedGltf(modelCfg.url);
    if (!gltf || !gltf.scene) return null;

    const modelScene = SkeletonUtils.clone(gltf.scene);
    const { hasSkinnedMesh, boneCount } = prepareClonedGlbHierarchy(modelScene);

    modelScene.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(modelScene);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const targetHeight = options.useRealisticStyleCScale
      ? (modelCfg.styleCRealisticHeightMeters || 1.76)
      : (modelCfg.targetHeightMeters || 2.34);

    if (size.y > 0.05) {
      const uniformScale = computeUniformModelScale(size.y, targetHeight);
      modelScene.scale.multiplyScalar(uniformScale);
    }

    // Recompute bounds and ground sole flush to y = 0
    modelScene.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(modelScene);
    const scaledSize = new THREE.Vector3();
    scaledBox.getSize(scaledSize);
    const center = new THREE.Vector3();
    scaledBox.getCenter(center);

    modelScene.position.x -= center.x;
    modelScene.position.z -= center.z;
    modelScene.position.y -= scaledBox.min.y;

    return new CharacterRiggedModel(modelScene, gltf.animations || [], role, {
      hasSkinnedMesh,
      boneCount,
      boundsHeight: Number(scaledSize.y.toFixed(3))
    });
  } catch (err) {
    console.warn(`Optional rigged GLB load skipped for role=${role}:`, err);
    return null;
  }
}
