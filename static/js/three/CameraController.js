import * as THREE from 'three';
import { TerrainManager } from '../world/TerrainManager.js';
import { gameState } from '../state/GameState.js';
import {
  OUTDOOR_EXIT_CAMERA_CONFIG,
  interpolateSphericalReveal,
  isPointInsideHachiBuilding
} from './CameraFraming.js';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    this.occluderMeshes = [];
    this.exitReveal = null;

    // Spherical Orbit Camera State (Wide Indonesian Landscape Vista or Landmark Inspection)
    const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null;
    const hasOutdoorPos = gameState.getState().lastOutdoorPosition;
    if (v === 'overview') {
      this.yaw = -0.32; this.targetYaw = -0.32;
      this.pitch = 0.62; this.targetPitch = 0.62;
      this.baseRadius = 78.0;
    } else if (v === 'main_path' || v === 'path') {
      this.yaw = 0.0; this.targetYaw = 0.0;
      this.pitch = 0.20; this.targetPitch = 0.20;
      this.baseRadius = 7.5;
    } else if (v === 'music_path') {
      this.yaw = 1.57; this.targetYaw = 1.57;
      this.pitch = 0.22; this.targetPitch = 0.22;
      this.baseRadius = 8.0;
    } else if (v === 'food_path') {
      this.yaw = 1.25; this.targetYaw = 1.25;
      this.pitch = 0.22; this.targetPitch = 0.22;
      this.baseRadius = 8.5;
    } else if (v === 'path_junctions') {
      this.yaw = -0.45; this.targetYaw = -0.45;
      this.pitch = 0.38; this.targetPitch = 0.38;
      this.baseRadius = 12.0;
    } else if (v === 'tree_grounding') {
      this.yaw = 0.35; this.targetYaw = 0.35;
      this.pitch = 0.16; this.targetPitch = 0.16;
      this.baseRadius = 6.5;
    } else if (v === 'terrace_transition') {
      this.yaw = -1.57; this.targetYaw = -1.57;
      this.pitch = 0.32; this.targetPitch = 0.32;
      this.baseRadius = 11.0;
    } else if (v === 'stairs_landing') {
      this.yaw = 0.0; this.targetYaw = 0.0;
      this.pitch = 0.24; this.targetPitch = 0.24;
      this.baseRadius = 10.5;
    } else if (v === 'hachi_wide') {
      this.yaw = 0.0; this.targetYaw = 0.0;
      this.pitch = 0.28; this.targetPitch = 0.28;
      this.baseRadius = 24.0;
    } else if (v === 'hachi_signage') {
      this.yaw = 0.0; this.targetYaw = 0.0;
      this.pitch = 0.10; this.targetPitch = 0.10;
      this.baseRadius = 9.0;
    } else if (v === 'hachi_entrance') {
      this.yaw = 0.0; this.targetYaw = 0.0;
      this.pitch = 0.20; this.targetPitch = 0.20;
      this.baseRadius = 8.5;
    } else if (v === 'hachi_three_quarter') {
      this.yaw = -0.65; this.targetYaw = -0.65;
      this.pitch = 0.22; this.targetPitch = 0.22;
      this.baseRadius = 16.0;
    } else if (v === 'hachi_approach') {
      this.yaw = 0.0; this.targetYaw = 0.0;
      this.pitch = 0.22; this.targetPitch = 0.22;
      this.baseRadius = 10.0;
    } else if (v === 'grounding') {
      this.yaw = 0.0; this.targetYaw = 0.0;
      this.pitch = 0.12; this.targetPitch = 0.12;
      this.baseRadius = 4.8;
    } else if (v === 'walking') {
      this.yaw = 1.25; this.targetYaw = 1.25;
      this.pitch = 0.20; this.targetPitch = 0.20;
      this.baseRadius = 6.2;
    } else if (v === 'transition') {
      this.yaw = 0.35; this.targetYaw = 0.35;
      this.pitch = 0.28; this.targetPitch = 0.28;
      this.baseRadius = 12.0;
    } else if (v === 'stairs') {
      this.yaw = 0.55; this.targetYaw = 0.55;
      this.pitch = 0.30; this.targetPitch = 0.30;
      this.baseRadius = 12.5;
    } else if (v === 'pavilion' || v === 'profile') {
      this.yaw = 0.20; this.targetYaw = 0.20;
      this.pitch = 0.24; this.targetPitch = 0.24;
      this.baseRadius = 13.0;
    } else if (v === 'tea_closeup') {
      this.yaw = -0.85; this.targetYaw = -0.85;
      this.pitch = 0.22; this.targetPitch = 0.22;
      this.baseRadius = 6.0;
    } else if (v === 'entrance') {
      this.yaw = 0.0; this.targetYaw = 0.0;
      this.pitch = 0.26; this.targetPitch = 0.26;
      this.baseRadius = 14.0;
    } else if (v === 'gallery' || v === 'listening' || v === 'foodcourt') {
      this.yaw = 0.0; this.targetYaw = 0.0;
      this.pitch = 0.28; this.targetPitch = 0.28;
      this.baseRadius = 13.0;
    } else if (v === 'restaurant' || v === 'hachi_exterior') {
      this.yaw = 0.0; this.targetYaw = 0.0;
      this.pitch = 0.24; this.targetPitch = 0.24;
      this.baseRadius = 17.0;
    } else if (hasOutdoorPos) {
      // Unobstructed +Z elevated 3/4 view overlooking Grand Staircase & Hachi facade
      this.yaw = OUTDOOR_EXIT_CAMERA_CONFIG.startYaw;
      this.targetYaw = OUTDOOR_EXIT_CAMERA_CONFIG.endYaw;
      this.pitch = OUTDOOR_EXIT_CAMERA_CONFIG.startPitch;
      this.targetPitch = OUTDOOR_EXIT_CAMERA_CONFIG.endPitch;
      this.baseRadius = OUTDOOR_EXIT_CAMERA_CONFIG.endRadius;
      this.currentRadius = OUTDOOR_EXIT_CAMERA_CONFIG.startRadius;
      this.exitReveal = {
        elapsed: 0,
        duration: OUTDOOR_EXIT_CAMERA_CONFIG.duration
      };
    } else {
      this.yaw = -0.32;
      this.targetYaw = -0.32;
      this.pitch = 0.48;
      this.targetPitch = 0.48;
      this.baseRadius = 21.5;
    }

    this.minPitch = 0.12; // ~7° low angle vista
    this.maxPitch = 1.25; // ~71° top-down garden view

    this.damping = 0.09; // Smooth dampening factor
    this.sensitivity = 0.0035; // Responsive cinematic touch/mouse sensitivity

    // Zoom State
    this.targetZoom = 1.0;
    this.currentZoom = 1.0;
    this.minZoom = 0.55; // Close-up avatar view
    this.maxZoom = 2.10; // Extra wide venue panorama view

    // Cinematic Intro State
    this.isCinematic = false;
    this.cinematicProgress = 0;
    this.cinematicDuration = 3.2; // 3.2 Seconds smooth reveal
    this.cinematicStartPos = new THREE.Vector3(22, 28, 42); // High hill overlook from entrance
    this.cinematicTargetLook = new THREE.Vector3(-10, 6, -18); // Sweeping over tea terraces toward Pendopo & mountains
    this.onCinematicComplete = null;

    // Scratch vectors & reusable raycaster to avoid GC churn on 60Hz loop
    this._targetLook = new THREE.Vector3();
    this._desiredCameraPos = new THREE.Vector3();
    this._cinematicLook = new THREE.Vector3();
    this._rayDir = new THREE.Vector3();
    this._occlusionRay = new THREE.Raycaster();
  }

  setOccluderMeshes(meshes) {
    this.occluderMeshes = Array.isArray(meshes) ? meshes.filter(Boolean) : [];
  }

  setTarget(position) {
    const isFirst = this.targetPosition.lengthSq() === 0;
    const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null;
    const isGrounding = v === 'grounding' || v === 'tree_grounding';
    let targetYOffset = isGrounding ? 0.4 : 1.6;
    if (v === 'hachi_signage') {
      targetYOffset = 4.8;
    }
    this.targetPosition.set(position.x, position.y + targetYOffset, position.z);
    if (isFirst && !this.isCinematic) {
      const radius = (this.currentRadius || this.baseRadius) * this.currentZoom;
      const curOffsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * radius;
      const curOffsetY = Math.sin(this.pitch) * radius;
      const curOffsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * radius;
      this.camera.position.set(
        this.targetPosition.x + curOffsetX,
        this.targetPosition.y + curOffsetY,
        this.targetPosition.z + curOffsetZ
      );
      this.camera.lookAt(this.targetPosition);
    }
  }

  rotate(deltaYaw, deltaPitch) {
    if (this.isCinematic) return;
    if (this.exitReveal) {
      this.exitReveal = null;
    }
    this.targetYaw += deltaYaw * this.sensitivity;
    this.targetPitch += deltaPitch * this.sensitivity;

    // Clamp target pitch angle
    this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch));
  }

  zoom(delta) {
    if (this.isCinematic) return;
    if (this.exitReveal) {
      this.exitReveal = null;
    }
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom + delta));
  }

  startCinematicIntro(onComplete) {
    const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null;
    const hasOutdoorPos = gameState.getState().lastOutdoorPosition;
    if (v || hasOutdoorPos) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }
    this.isCinematic = true;
    this.cinematicProgress = 0;
    this.onCinematicComplete = onComplete;
    this.camera.position.copy(this.cinematicStartPos);
    this.camera.lookAt(this.cinematicTargetLook);
  }

  update(delta = 0.016) {
    const dtScale = Math.min(3.0, Math.max(0.2, delta * 60));

    if (this.exitReveal) {
      this.exitReveal.elapsed += delta;
      const progress = Math.min(1.0, this.exitReveal.elapsed / Math.max(0.1, this.exitReveal.duration));
      const reveal = interpolateSphericalReveal(OUTDOOR_EXIT_CAMERA_CONFIG, progress);
      this.yaw = reveal.yaw;
      this.targetYaw = reveal.yaw;
      this.pitch = reveal.pitch;
      this.targetPitch = reveal.pitch;
      this.baseRadius = reveal.radius;
      if (progress >= 1.0) {
        this.exitReveal = null;
      }
    }

    // Smooth lerp zoom, yaw, and pitch angles
    this.currentZoom += (this.targetZoom - this.currentZoom) * Math.min(1, 0.1 * dtScale);
    this.yaw += (this.targetYaw - this.yaw) * Math.min(1, 0.12 * dtScale);
    this.pitch += (this.targetPitch - this.pitch) * Math.min(1, 0.12 * dtScale);

    const aspect = this.camera.aspect || 1.0;
    let radius = this.baseRadius * this.currentZoom;
    if (aspect < 1.0) {
      radius *= (1.0 + (1.0 - aspect) * 0.15);
    }

    const lookYOffset = aspect < 1.0 ? 1.15 : 0.75;
    this._targetLook.set(
      this.targetPosition.x,
      this.targetPosition.y + lookYOffset,
      this.targetPosition.z
    );

    const unitOffsetX = Math.sin(this.yaw) * Math.cos(this.pitch);
    const unitOffsetY = Math.sin(this.pitch);
    const unitOffsetZ = Math.cos(this.yaw) * Math.cos(this.pitch);

    let safeRadius = radius;

    // 1. Structural Hachi Restaurant envelope check along sightline
    const stepCount = 6;
    for (let i = 1; i <= stepCount; i++) {
      const frac = i / stepCount;
      const testX = this._targetLook.x + unitOffsetX * radius * frac;
      const testY = this._targetLook.y + unitOffsetY * radius * frac;
      const testZ = this._targetLook.z + unitOffsetZ * radius * frac;
      if (isPointInsideHachiBuilding(testX, testY, testZ)) {
        safeRadius = Math.min(safeRadius, Math.max(2.6, radius * Math.max(0.28, frac - 0.16)));
        break;
      }
    }

    // 2. Raycast line-of-sight obstruction check against landmarks/walls
    if (this.occluderMeshes.length > 0 && !this.isCinematic) {
      this._rayDir.set(unitOffsetX, unitOffsetY, unitOffsetZ).normalize();
      this._occlusionRay.set(this._targetLook, this._rayDir);
      this._occlusionRay.near = 0.5;
      this._occlusionRay.far = safeRadius;

      const hits = this._occlusionRay.intersectObjects(this.occluderMeshes, true);
      for (const hit of hits) {
        if (!hit.object || hit.object.visible === false) continue;
        if (hit.distance >= 1.6 && hit.distance < safeRadius) {
          safeRadius = Math.max(2.4, hit.distance - 0.65);
          break;
        }
      }
    }

    if (typeof this.currentRadius !== 'number') this.currentRadius = safeRadius;
    const radiusLerpSpeed = safeRadius < this.currentRadius ? 0.28 : 0.14;
    this.currentRadius += (safeRadius - this.currentRadius) * Math.min(1, radiusLerpSpeed * dtScale);

    const testCamX = this._targetLook.x + unitOffsetX * this.currentRadius;
    const testCamY = this._targetLook.y + unitOffsetY * this.currentRadius;
    const testCamZ = this._targetLook.z + unitOffsetZ * this.currentRadius;
    const terrainFloor = TerrainManager.getHeight(testCamX, testCamZ) + 1.25;

    this._desiredCameraPos.set(
      testCamX,
      Math.max(terrainFloor, testCamY),
      testCamZ
    );

    if (this.isCinematic) {
      this.cinematicProgress += delta / this.cinematicDuration;
      const t = Math.min(1.0, this.cinematicProgress);
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(this.cinematicStartPos, this._desiredCameraPos, easeT);
      this._cinematicLook.lerpVectors(this.cinematicTargetLook, this._targetLook, easeT);
      this.camera.lookAt(this._cinematicLook);

      if (t >= 1.0) {
        this.isCinematic = false;
        if (this.onCinematicComplete) this.onCinematicComplete();
      }
      return;
    }

    if (this.camera.position.lengthSq() < 0.1) {
      this.camera.position.copy(this._desiredCameraPos);
    } else {
      this.camera.position.lerp(this._desiredCameraPos, Math.min(1, this.damping * dtScale));
    }

    if (!this.currentLook) {
      this.currentLook = this._targetLook.clone();
    } else {
      this.currentLook.lerp(this._targetLook, Math.min(1, this.damping * 1.5 * dtScale));
    }
    this.camera.lookAt(this.currentLook);
  }
}

