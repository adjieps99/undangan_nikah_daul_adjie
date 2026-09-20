import * as THREE from 'three';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    this.offset = new THREE.Vector3(0, 9, 11); // Elevated 3rd person angle preventing ground/structure clipping
    this.damping = 0.08; // Smooth dampening factor
  }

  setTarget(position) {
    // Elevate target focus to character chest height (y + 1.6)
    this.targetPosition.set(position.x, position.y + 1.6, position.z);
  }

  update() {
    const desiredCameraPos = new THREE.Vector3()
      .copy(this.targetPosition)
      .add(this.offset);

    // Smooth lerp follow
    this.camera.position.lerp(desiredCameraPos, this.damping);
    this.camera.lookAt(this.targetPosition);
  }
}
