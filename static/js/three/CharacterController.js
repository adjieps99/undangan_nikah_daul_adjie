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
        const currentPos = this.mesh ? this.mesh.position.clone() : new THREE.Vector3(0, 0, 5);
        const currentRot = this.mesh ? this.mesh.rotation.y : 0;

        this.scene.remove(this.mesh);
        this.avatar = new Avatar3D(state.playerConfig);
        this.mesh = this.avatar.group;
        this.mesh.position.copy(currentPos);
        this.mesh.rotation.y = currentRot;
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

  isWalkableZone(x, z) {
    // 1. Main Vertical Runway Path (Width: 8 -> Radius: 4.2, Length: -40 to 40)
    if (Math.abs(x) <= 4.2 && z >= -40 && z <= 40) return true;

    // 2. Top Horizontal Cross Path (Width: 6 -> Radius: 3.2, Length: -32 to 32, Z: -15)
    if (z >= -18.2 && z <= -11.8 && x >= -32 && x <= 32) return true;

    // 3. Bottom Horizontal Cross Path (Width: 6 -> Radius: 3.2, Length: -32 to 32, Z: 15)
    if (z >= 11.8 && z <= 18.2 && x >= -32 && x <= 32) return true;

    // 4. Gazebo Plaza Zone (Center: -15, -15, Radius: 6.6)
    if (Math.hypot(x - (-15), z - (-15)) <= 6.6) return true;

    // 5. Reception Plaza Zone (Center: 15, -15, Radius: 5.8)
    if (Math.hypot(x - 15, z - (-15)) <= 5.8) return true;

    // 6. Wishing Tree Plaza Zone (Center: -12, 15, Radius: 5.8)
    if (Math.hypot(x - (-12), z - 15) <= 5.8) return true;

    // 7. Fountain Pond Plaza Zone (Center: 12, 15, Radius: 6.0)
    if (Math.hypot(x - 12, z - 15) <= 6.0) return true;

    // 8. Entrance Archway Runway (Z: 25 to 35, X: -4.2 to 4.2)
    if (z >= 25 && z <= 35 && Math.abs(x) <= 4.2) return true;

    return false;
  }

  check3DCollision(x, z) {
    // 1. Boundary Clamp (-45 to 45)
    if (x < -45 || x > 45 || z < -45 || z > 45) return true;

    // 2. Walkable Path & Plaza Boundary Check (Invisible Walls)
    if (!this.isWalkableZone(x, z)) return true;

    // 3. Solid Obstacle Collisions inside Walkable Plazas:
    // Gazebo Structure Center (Center: -15, -15, Radius: 4.8)
    if (Math.hypot(x - (-15), z - (-15)) < 4.8) return true;

    // Reception Table (Center: 15, -15, Radius: 2.8)
    if (Math.hypot(x - 15, z - (-15)) < 2.8) return true;

    // Wishing Tree Trunk (Center: -12, 15, Radius: 2.0)
    if (Math.hypot(x - (-12), z - 15) < 2.0) return true;

    // Fountain Pond Basin (Center: 12, 15, Radius: 3.8)
    if (Math.hypot(x - 12, z - 15) < 3.8) return true;

    // Archway Pillars (x: -4 to -3.5 or 3.5 to 4 at z: 30)
    if (z > 29.2 && z < 30.8 && (Math.abs(x - (-4)) < 0.6 || Math.abs(x - 4) < 0.6)) return true;

    return false;
  }

  move(dx, dz, intensity = 1.0, jumpInput = false) {
    // Check jump input
    if (jumpInput) {
      this.jump();
    }

    if (dx === 0 && dz === 0) {
      this.isMoving = false;
      return;
    }

    this.isMoving = true;

    // Intensity-based movement speed scaling (cozy walking curve)
    // 20% drag = slow walk, 60% = normal walk, 100% = fast walk
    const clampedIntensity = Math.max(0.1, Math.min(1.0, intensity));
    const currentSpeed = this.speed * (0.35 + 0.65 * clampedIntensity);

    const nextX = this.mesh.position.x + dx * currentSpeed;
    const nextZ = this.mesh.position.z + dz * currentSpeed;

    // Obstacle Collision & Invisible Wall Check on X and Z axis
    if (!this.check3DCollision(nextX, this.mesh.position.z)) {
      this.mesh.position.x = nextX;
    }
    if (!this.check3DCollision(this.mesh.position.x, nextZ)) {
      this.mesh.position.z = nextZ;
    }

    // Smooth Character Rotation (Lerp angle for natural Sims feel)
    const targetRotation = Math.atan2(dx, dz);
    let diff = targetRotation - this.mesh.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.mesh.rotation.y += diff * 0.18;
  }

  update() {
    this.animTime += 0.15;
    if (this.jumpCooldown > 0) this.jumpCooldown--;

    // 1. Process Jump Physics & Dynamic Shadow Scaling
    if (this.isJumping) {
      this.mesh.position.y += this.velocityY;
      this.velocityY += this.gravity;

      // Dynamic Shadow Scaling (Shadow shrinks when jumping higher)
      if (this.shadow) {
        const shadowFactor = Math.max(0.3, 1.0 - (this.mesh.position.y / 2.5));
        this.shadow.scale.set(shadowFactor, shadowFactor, shadowFactor);
        this.shadow.material.opacity = 0.3 * shadowFactor;
      }

      // Ground Touch Down
      if (this.mesh.position.y <= 0) {
        this.mesh.position.y = 0;
        this.isJumping = false;
        this.velocityY = 0;
        if (this.shadow) {
          this.shadow.scale.set(1, 1, 1);
          this.shadow.material.opacity = 0.3;
        }
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
      // Natural Idle Breathing Animation Cycle
      const breath = Math.sin(this.animTime * 0.4) * 0.04;
      if (this.avatar.leftLeg) this.avatar.leftLeg.rotation.x = 0;
      if (this.avatar.rightLeg) this.avatar.rightLeg.rotation.x = 0;
      if (this.avatar.leftArm) this.avatar.leftArm.rotation.x = breath * 0.5;
      if (this.avatar.rightArm) this.avatar.rightArm.rotation.x = -breath * 0.5;
      if (this.avatar.head) this.avatar.head.position.y = 2.35 + breath;
    }
  }

  getPosition() {
    return this.mesh.position;
  }
}
