import * as THREE from 'three';
import { TerrainManager } from '../world/TerrainManager.js';
import { gameState } from '../state/GameState.js';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetPosition = new THREE.Vector3(0, 0, 0);

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
      this.yaw = Math.PI;
      this.targetYaw = Math.PI;
      this.pitch = 0.22;
      this.targetPitch = 0.22;
      this.baseRadius = 8.0;
    } else {
      this.yaw = -0.32;
      this.targetYaw = -0.32;
      this.pitch = 0.48;
      this.targetPitch = 0.48;
      this.baseRadius = 21.5;
    }

    this.minPitch = 0.12; // ~7° low angle vista
    this.maxPitch = 1.25; // ~71° top-down garden view

    this.damping = 0.08; // Smooth dampening factor
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
      const radius = this.baseRadius * this.currentZoom;
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
    this.targetYaw += deltaYaw * this.sensitivity;
    this.targetPitch += deltaPitch * this.sensitivity;

    // Clamp target pitch angle
    this.targetPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.targetPitch));
  }

  zoom(delta) {
    if (this.isCinematic) return;
    // Modify target zoom factor smoothly
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

  update() {
    // Smooth lerp zoom, yaw, and pitch angles
    this.currentZoom += (this.targetZoom - this.currentZoom) * 0.1;
    this.yaw += (this.targetYaw - this.yaw) * 0.12;
    this.pitch += (this.targetPitch - this.pitch) * 0.12;

    const aspect = this.camera.aspect || 1.0;
    let radius = this.baseRadius * this.currentZoom;
    if (aspect < 1.0) {
      // Mobile portrait mode compensation: subtle radius adjustment so character remains heroic
      radius *= (1.0 + (1.0 - aspect) * 0.15);
    }
    const baseOffsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * radius;
    const baseOffsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * radius;

    // Check terrain clearance and obstacle clipping along line-of-sight (spring-arm)
    let safeRadius = radius;
    // Step along the ray from target to desired pos to see if ray intersects solid buildings
    const stepCount = 5;
    for (let i = 1; i <= stepCount; i++) {
      const frac = i / stepCount;
      const testX = this.targetPosition.x + baseOffsetX * frac;
      const testZ = this.targetPosition.z + baseOffsetZ * frac;
      // Building collision box around Hachi Garden exterior (-12 to 12, -30 to -17)
      if (testX >= -12 && testX <= 12 && testZ >= -30 && testZ <= -18) {
        // Obstacle detected, shorten camera distance to prevent clipping through exterior walls
        safeRadius = Math.min(safeRadius, radius * Math.max(0.35, (frac - 0.15)));
        break;
      }
    }

    // Smoothly adapt spring-arm radius to prevent abrupt camera pops near walls
    if (typeof this.currentRadius !== 'number') this.currentRadius = radius;
    this.currentRadius += (safeRadius - this.currentRadius) * 0.18;

    const curOffsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * this.currentRadius;
    const curOffsetY = Math.sin(this.pitch) * this.currentRadius;
    const curOffsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * this.currentRadius;

    // Optical focus target: aim at avatar torso/chest (y + 1.15 on portrait, y + 0.75 on landscape)
    const lookYOffset = aspect < 1.0 ? 1.15 : 0.75;
    const targetLook = new THREE.Vector3(
      this.targetPosition.x,
      this.targetPosition.y + lookYOffset,
      this.targetPosition.z
    );

    const testCamX = this.targetPosition.x + curOffsetX;
    const testCamZ = this.targetPosition.z + curOffsetZ;
    const terrainFloor = TerrainManager.getHeight(testCamX, testCamZ) + 1.25;

    const desiredCameraPos = new THREE.Vector3(
      testCamX,
      Math.max(terrainFloor, targetLook.y + curOffsetY),
      testCamZ
    );

    if (this.isCinematic) {
      this.cinematicProgress += 0.016 / this.cinematicDuration; // ~60fps step
      const t = Math.min(1.0, this.cinematicProgress);
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(this.cinematicStartPos, desiredCameraPos, easeT);

      const cinematicLook = new THREE.Vector3().lerpVectors(this.cinematicTargetLook, targetLook, easeT);
      this.camera.lookAt(cinematicLook);

      if (t >= 1.0) {
        this.isCinematic = false;
        if (this.onCinematicComplete) this.onCinematicComplete();
      }
      return;
    }

    // Smooth lerp follow for position
    if (this.camera.position.lengthSq() < 0.1) {
      this.camera.position.copy(desiredCameraPos);
    } else {
      this.camera.position.lerp(desiredCameraPos, this.damping);
    }

    // Smooth lerp for look-at target to eliminate micro-jitter on rapid turns & stair traversal
    if (!this.currentLook) {
      this.currentLook = targetLook.clone();
    } else {
      this.currentLook.lerp(targetLook, this.damping * 1.5);
    }
    this.camera.lookAt(this.currentLook);
  }
}

