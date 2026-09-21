import * as THREE from 'three';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetPosition = new THREE.Vector3(0, 0, 0);

    // Spherical Orbit Camera State
    this.yaw = 0; // Horizontal rotation angle (radians)
    this.targetYaw = 0;
    this.pitch = 0.65; // Vertical elevation angle (radians, ~37°)
    this.targetPitch = 0.65;
    this.baseRadius = 14.2; // Base orbit radius

    this.minPitch = 0.22; // ~12° minimum elevation (prevents looking underground)
    this.maxPitch = 1.30; // ~74° maximum top-down view (prevents camera flipping)

    this.damping = 0.08; // Smooth dampening factor
    this.sensitivity = 0.004; // Smooth cinematic touch/mouse sensitivity

    // Zoom State
    this.targetZoom = 1.0;
    this.currentZoom = 1.0;
    this.minZoom = 0.45; // Close-up view
    this.maxZoom = 1.85; // Wide venue panorama view

    // Cinematic Intro State
    this.isCinematic = false;
    this.cinematicProgress = 0;
    this.cinematicDuration = 3.0; // 3 Seconds
    this.cinematicStartPos = new THREE.Vector3(0, 22, 35);
    this.cinematicTargetLook = new THREE.Vector3(-15, 4, -15); // Look at Gazebo initially
    this.onCinematicComplete = null;
  }

  setTarget(position) {
    // Elevate target focus to character chest height (y + 1.6)
    this.targetPosition.set(position.x, position.y + 1.6, position.z);
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

    const radius = this.baseRadius * this.currentZoom;

    // Calculate desired camera position in spherical coordinates around targetPosition
    const offsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * radius;
    const offsetY = Math.sin(this.pitch) * radius;
    const offsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * radius;

    const desiredCameraPos = new THREE.Vector3(
      this.targetPosition.x + offsetX,
      Math.max(0.6, this.targetPosition.y + offsetY), // Ensure camera stays above ground
      this.targetPosition.z + offsetZ
    );

    if (this.isCinematic) {
      this.cinematicProgress += 0.016 / this.cinematicDuration; // ~60fps step
      const t = Math.min(1.0, this.cinematicProgress);
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(this.cinematicStartPos, desiredCameraPos, easeT);

      const currentLook = new THREE.Vector3().lerpVectors(this.cinematicTargetLook, this.targetPosition, easeT);
      this.camera.lookAt(currentLook);

      if (t >= 1.0) {
        this.isCinematic = false;
        if (this.onCinematicComplete) this.onCinematicComplete();
      }
      return;
    }

    // Smooth lerp follow
    this.camera.position.lerp(desiredCameraPos, this.damping);
    this.camera.lookAt(this.targetPosition);
  }
}

