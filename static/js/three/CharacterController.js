import * as THREE from 'three';
import { Avatar3D } from '../characters/Avatar3D.js';
import { gameState } from '../state/GameState.js';

export class CharacterController {
  constructor(scene) {
    this.scene = scene;
    this.speed = 0.15;
    this.isMoving = false;
    this.animTime = 0;

    // Jump Physics
    this.velocityY = 0;
    this.gravity = -0.028;
    this.jumpForce = 0.42;
    this.isJumping = false;
    this.jumpCooldown = 0;

    // Load Avatar3D
    const config = gameState.getState().playerConfig;
    this.avatar = new Avatar3D(config);
    this.mesh = this.avatar.group;
    this.mesh.position.set(0, 0, 5); // Initial spawn on central stone path
    this.scene.add(this.mesh);

    this.cachedConfigStr = JSON.stringify(config);

    // Subscribe to avatar changes
    gameState.subscribe((state) => {
      const newConfigStr = JSON.stringify(state.playerConfig);
      if (newConfigStr !== this.cachedConfigStr) {
        this.cachedConfigStr = newConfigStr;
        this.scene.remove(this.mesh);
        this.avatar = new Avatar3D(state.playerConfig);
        this.mesh = this.avatar.group;
        this.scene.add(this.mesh);
      }
    });

    // Listen for jump event
    window.addEventListener('player-jump', () => this.jump());
  }

  jump() {
    // Disable jump if modal is active or already jumping or on cooldown
    if (gameState.getState().activeModal) return;
    if (!this.isJumping && this.jumpCooldown <= 0) {
      this.isJumping = true;
      this.velocityY = this.jumpForce;
      this.jumpCooldown = 15; // Short cooldown frames
    }
  }

  check3DCollision(x, z) {
    // 1. Boundary Clamp (-45 to 45)
    if (x < -45 || x > 45 || z < -45 || z > 45) return true;

    // 2. Gazebo Structure (Center: -15, -15, Radius: 5.2)
    if (Math.hypot(x - (-15), z - (-15)) < 5.2) return true;

    // 3. Reception Table & Cake (Center: 15, -15, Radius: 3.8)
    if (Math.hypot(x - 15, z - (-15)) < 3.8) return true;

    // 4. Wishing Tree Trunk (Center: -12, 15, Radius: 2.2)
    if (Math.hypot(x - (-12), z - 15) < 2.2) return true;

    // 5. Fountain Pond (Center: 12, 15, Radius: 4.6)
    if (Math.hypot(x - 12, z - 15) < 4.6) return true;

    // 6. Archway Pillars (x: -4 to -3.5 or 3.5 to 4 at z: 30)
    if (z > 29.2 && z < 30.8 && (Math.abs(x - (-4)) < 0.6 || Math.abs(x - 4) < 0.6)) return true;

    return false;
  }

  move(dx, dz, jumpInput = false) {
    // Check jump input
    if (jumpInput) {
      this.jump();
    }

    if (dx === 0 && dz === 0) {
      this.isMoving = false;
      return;
    }

    this.isMoving = true;

    const nextX = this.mesh.position.x + dx * this.speed;
    const nextZ = this.mesh.position.z + dz * this.speed;

    // Obstacle Collision Check on X and Z axis
    if (!this.check3DCollision(nextX, this.mesh.position.z)) {
      this.mesh.position.x = nextX;
    }
    if (!this.check3DCollision(this.mesh.position.x, nextZ)) {
      this.mesh.position.z = nextZ;
    }

    // Smooth Rotation towards Movement Angle
    const targetRotation = Math.atan2(dx, dz);
    let diff = targetRotation - this.mesh.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.mesh.rotation.y += diff * 0.2;
  }

  update() {
    this.animTime += 0.15;
    if (this.jumpCooldown > 0) this.jumpCooldown--;

    // 1. Process Jump Physics
    if (this.isJumping) {
      this.mesh.position.y += this.velocityY;
      this.velocityY += this.gravity;

      // Ground Touch Down
      if (this.mesh.position.y <= 0) {
        this.mesh.position.y = 0;
        this.isJumping = false;
        this.velocityY = 0;
      }
    }

    // 2. Process Stride / Idle Animation
    if (this.isMoving) {
      // Walking Stride Animation Cycle
      const legAngle = Math.sin(this.animTime * 1.5) * 0.5;
      const armAngle = Math.sin(this.animTime * 1.5) * 0.4;

      if (this.avatar.leftLeg) this.avatar.leftLeg.rotation.x = legAngle;
      if (this.avatar.rightLeg) this.avatar.rightLeg.rotation.x = -legAngle;
      if (this.avatar.leftArm) this.avatar.leftArm.rotation.x = -armAngle;
      if (this.avatar.rightArm) this.avatar.rightArm.rotation.x = armAngle;
      if (this.avatar.head) this.avatar.head.position.y = 2.35 + Math.abs(Math.sin(this.animTime * 1.5)) * 0.05;
    } else {
      // Idle Breathing Animation Cycle
      if (this.avatar.leftLeg) this.avatar.leftLeg.rotation.x = 0;
      if (this.avatar.rightLeg) this.avatar.rightLeg.rotation.x = 0;
      if (this.avatar.leftArm) this.avatar.leftArm.rotation.x = 0;
      if (this.avatar.rightArm) this.avatar.rightArm.rotation.x = 0;
      if (this.avatar.head) this.avatar.head.position.y = 2.35 + Math.sin(this.animTime * 0.5) * 0.03;
    }
  }

  getPosition() {
    return this.mesh.position;
  }
}
