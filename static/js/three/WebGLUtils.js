import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let cachedSoftwareGl = null;

/**
 * Detect software WebGL rasterizers (SwiftShader, llvmpipe, WARP) from the WebGL renderer string.
 * Used strictly for rendering cost pacing, pixel ratio, and shadow toggles—never alters scene content.
 */
export function detectSoftwareWebGL() {
  if (cachedSoftwareGl !== null) return cachedSoftwareGl;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    cachedSoftwareGl = false;
  }
  return cachedSoftwareGl;
}

/**
 * Apply standardized ACES Filmic tone mapping, sRGB color space, pixel ratio cap,
 * and procedural RoomEnvironment PBR reflection map on a Three.js renderer + scene.
 */
export function configurePBRPipeline(renderer, scene, isSoftwareGl) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));

  try {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(envScene, 0.04);
    scene.environment = envTarget.texture;
    envScene.dispose?.();
    pmremGenerator.dispose();
  } catch (e) {
    // Graceful fallback if RoomEnvironment unavailable
  }
}

/**
 * Schedule next frame after CPU rasterization completes on software WebGL
 * so the browser UI/input thread and headless screenshots never starve.
 */
export function scheduleAfterDraw(renderer, cb, onHandle = null) {
  try {
    const gl = renderer.getContext();
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          const id = window.setTimeout(poll, 5);
          if (onHandle) onHandle(id);
        } else {
          if (sync) gl.deleteSync(sync);
          const id = window.setTimeout(cb, 80);
          if (onHandle) onHandle(id);
        }
      };
      const id = window.setTimeout(poll, 5);
      if (onHandle) onHandle(id);
      return;
    }
  } catch {
    // Fallback if fenceSync unavailable
  }
  const id = window.setTimeout(cb, 80);
  if (onHandle) onHandle(id);
}

/**
 * Cleanly dispose geometries, materials, and CanvasTextures/Textures in a scene subtree.
 */
export function disposeSceneResources(root) {
  if (!root) return;
  const disposedGeometries = new Set();
  const disposedMaterials = new Set();
  const disposedTextures = new Set();

  const disposeMat = (mat) => {
    if (!mat || disposedMaterials.has(mat)) return;
    disposedMaterials.add(mat);
    const texKeys = ['map', 'bumpMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap'];
    for (const k of texKeys) {
      const tex = mat[k];
      if (tex && !disposedTextures.has(tex)) {
        disposedTextures.add(tex);
        tex.dispose?.();
      }
    }
    mat.dispose?.();
  };

  root.traverse((obj) => {
    if (obj.geometry && !disposedGeometries.has(obj.geometry)) {
      disposedGeometries.add(obj.geometry);
      obj.geometry.dispose?.();
    }
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(disposeMat);
      } else {
        disposeMat(obj.material);
      }
    }
  });
}
