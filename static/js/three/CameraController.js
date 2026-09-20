import * as THREE from 'three';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    this.offset = new THREE.Vector3(0, 9, 11); // Elevated 3rd person angle
    this.damping = 0.08; // Smooth dampening factor

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

  startCinematicIntro(onComplete) {
    this.isCinematic = true;
    this.cinematicProgress = 0;
    this.onCinematicComplete = onComplete;
    this.camera.position.copy(this.cinematicStartPos);
    this.camera.lookAt(this.cinematicTargetLook);
  }

  update() {
    if (this.isCinematic) {
      this.cinematicProgress += 0.016 / this.cinematicDuration; // ~60fps step
      const t = Math.min(1.0, this.cinematicProgress);
      // Smooth easeInOutCubic curve
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const desiredCameraPos = new THREE.Vector3().copy(this.targetPosition).add(this.offset);
      this.camera.position.lerpVectors(this.cinematicStartPos, desiredCameraPos, easeT);

      const currentLook = new THREE.Vector3().lerpVectors(this.cinematicTargetLook, this.targetPosition, easeT);
      this.camera.lookAt(currentLook);

      if (t >= 1.0) {
        this.isCinematic = false;
        if (this.onCinematicComplete) this.onCinematicComplete();
      }
      return;
    }

    const desiredCameraPos = new THREE.Vector3()
      .copy(this.targetPosition)
      .add(this.offset);

    // Smooth lerp follow
    this.camera.position.lerp(desiredCameraPos, this.damping);
    this.camera.lookAt(this.targetPosition);
  }
}

