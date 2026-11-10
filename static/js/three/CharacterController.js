import * as THREE from 'three';
import { Avatar3D } from '../characters/Avatar3D.js';
import { gameState } from '../state/GameState.js';
import { TerrainManager } from '../world/TerrainManager.js';

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
    this.isSitting = false;

    // Load Avatar3D
    const config = gameState.getState().playerConfig;
    this.avatar = new Avatar3D(config);
    this.mesh = this.avatar.group;
    // Initial spawn based on lastOutdoorPosition, URL parameter, or default Pintu Masuk
    const savedOutdoor = gameState.getState().lastOutdoorPosition;
    const initSpawn = savedOutdoor || this.getInitialSpawnFromURL();
    this.mesh.position.set(initSpawn.x, initSpawn.y, initSpawn.z);
    this.mesh.rotation.y = initSpawn.rotY || 0;
    this.scene.add(this.mesh);

    this.cachedConfigStr = JSON.stringify(config);

    // Subscribe to avatar changes
    gameState.subscribe((state) => {
      const newConfigStr = JSON.stringify(state.playerConfig);
      if (newConfigStr !== this.cachedConfigStr) {
        this.cachedConfigStr = newConfigStr;
        const currentPos = this.mesh ? this.mesh.position.clone() : new THREE.Vector3(18, 0.05, 23);
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

  getInitialSpawnFromURL() {
    try {
      const v = new URLSearchParams(window.location.search).get('view');
      if (v === 'overview') return { x: 0, y: 2.0, z: 6, rotY: 0 };
      if (v === 'main_path' || v === 'path') return { x: 0.0, y: 2.0, z: 14.0, rotY: 0 };
      if (v === 'music_path') return { x: -16.0, y: 1.0, z: 8.0, rotY: -Math.PI / 2 };
      if (v === 'food_path') return { x: -16.0, y: 3.2, z: -6.0, rotY: -2.2 };
      if (v === 'path_junctions') return { x: -2.5, y: 2.0, z: 8.0, rotY: -Math.PI / 2 };
      if (v === 'tree_grounding') return { x: 10.0, y: 2.0, z: 14.0, rotY: Math.PI / 4 };
      if (v === 'terrace_transition') return { x: -6.0, y: 2.0, z: 8.0, rotY: -Math.PI / 2 };
      if (v === 'stairs_landing') return { x: 0.0, y: 2.0, z: -5.0, rotY: 0 };
      if (v === 'hachi_wide') return { x: 0.0, y: 2.0, z: 2.0, rotY: 0 };
      if (v === 'hachi_signage') return { x: 0.0, y: 5.0, z: -13.0, rotY: 0 };
      if (v === 'hachi_entrance') return { x: 0.0, y: 5.0, z: -14.5, rotY: 0 };
      if (v === 'hachi_three_quarter') return { x: 10.0, y: 5.0, z: -13.0, rotY: -0.6 };
      if (v === 'hachi_approach') return { x: 0.0, y: 3.5, z: -9.5, rotY: 0 };
      if (v === 'grounding') return { x: 0, y: 2.0, z: 6, rotY: 0 };
      if (v === 'walking') return { x: 0, y: 2.0, z: 10, rotY: 0 };
      if (v === 'stairs') return { x: 0, y: 3.5, z: -10, rotY: 0 };
      if (v === 'transition') return { x: 0, y: 1.0, z: 21, rotY: 0 };
      if (v === 'pavilion' || v === 'profile') return { x: 18, y: 2.0, z: -6, rotY: -Math.PI / 2 };
      if (v === 'gallery') return { x: 18, y: 2.0, z: 8, rotY: -Math.PI / 2 };
      if (v === 'listening') return { x: -22, y: 1.0, z: 8, rotY: -Math.PI / 2 };
      if (v === 'foodcourt') return { x: -20, y: 3.2, z: -10, rotY: -Math.PI / 2 };
      if (v === 'restaurant') return { x: 0, y: 5.0, z: -14.5, rotY: 0 };
      if (v === 'entrance') return { x: 0, y: 0.0, z: 28, rotY: 0 };
    } catch (e) {}
    return { x: 0, y: 0.0, z: 29.5, rotY: 0 };
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

  setCustomHeightChecker(fn) {
    this.customHeightChecker = fn;
  }

  setCustomCollisionChecker(fn) {
    this.customCollisionChecker = fn;
  }

  getGroundHeight(x, z) {
    if (typeof this.customHeightChecker === 'function') {
      return this.customHeightChecker(x, z);
    }
    return TerrainManager.getHeight(x, z);
  }

  isWalkableZone(x, z) {
    return TerrainManager.isWalkable(x, z);
  }

  check3DCollision(x, z) {
    if (typeof this.customCollisionChecker === 'function') {
      return this.customCollisionChecker(x, z);
    }
    return TerrainManager.checkCollision(x, z);
  }

  sitOn(seatPos, faceAngle) {
    this.isSitting = true;
    this.isMoving = false;
    this.velocityY = 0;
    this.isJumping = false;

    // Cushion y is ~0.44m. Avatar hip is at y=0.98.
    // Placing mesh at seatY - 0.56 aligns thighs and seat pad flush.
    const seatY = typeof seatPos.y === 'number' ? seatPos.y : 0.44;
    this.mesh.position.set(seatPos.x, seatY - 0.56, seatPos.z);
    this.mesh.rotation.y = faceAngle;

    if (this.avatar.leftLeg) this.avatar.leftLeg.rotation.x = -Math.PI / 2;
    if (this.avatar.rightLeg) this.avatar.rightLeg.rotation.x = -Math.PI / 2;
    if (this.avatar.leftArm) this.avatar.leftArm.rotation.x = -0.55;
    if (this.avatar.rightArm) this.avatar.rightArm.rotation.x = -0.55;
  }

  standUp(standOffset = null) {
    if (!this.isSitting) return;
    this.isSitting = false;

    if (this.avatar.leftLeg) this.avatar.leftLeg.rotation.x = 0;
    if (this.avatar.rightLeg) this.avatar.rightLeg.rotation.x = 0;
    if (this.avatar.leftArm) this.avatar.leftArm.rotation.x = 0;
    if (this.avatar.rightArm) this.avatar.rightArm.rotation.x = 0;

    if (standOffset) {
      this.mesh.position.add(standOffset);
    }
    const groundY = this.getGroundHeight(this.mesh.position.x, this.mesh.position.z);
    this.mesh.position.y = groundY;
  }

  move(dx, dz, intensity = 1.0, jumpInput = false, camera = null) {
    if (this.isSitting) {
      // Disengage sitting on movement or jump input
      if (Math.abs(dx) > 0.05 || Math.abs(dz) > 0.05 || jumpInput) {
        this.standUp();
      } else {
        return;
      }
    }

    // Check jump input
    if (jumpInput) {
      this.jump();
    }

    if (dx === 0 && dz === 0) {
      this.isMoving = false;
      return;
    }

    this.isMoving = true;

    // Convert input vector to Camera-Relative world motion
    let moveDirX = dx;
    let moveDirZ = dz;

    if (camera) {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() > 0.001) {
        forward.normalize();
        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        // dz is forward/backward (-1 for forward/W/up, +1 for back/S/down)
        // dx is left/right (-1 for left/A, +1 for right/D)
        moveDirX = right.x * dx - forward.x * dz;
        moveDirZ = right.z * dx - forward.z * dz;
      }
    }

    // Intensity-based movement speed scaling (cozy walking curve)
    // 20% drag = slow walk, 60% = normal walk, 100% = fast walk
    const clampedIntensity = Math.max(0.1, Math.min(1.0, intensity));
    const currentSpeed = this.speed * (0.35 + 0.65 * clampedIntensity);

    const nextX = this.mesh.position.x + moveDirX * currentSpeed;
    const nextZ = this.mesh.position.z + moveDirZ * currentSpeed;

    // Obstacle Collision & Invisible Wall Check on X and Z axis
    if (!this.check3DCollision(nextX, this.mesh.position.z)) {
      this.mesh.position.x = nextX;
    }
    if (!this.check3DCollision(this.mesh.position.x, nextZ)) {
      this.mesh.position.z = nextZ;
    }

    // Smooth Character Rotation (Lerp angle towards actual movement direction)
    const targetRotation = Math.atan2(moveDirX, moveDirZ);
    let diff = targetRotation - this.mesh.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.mesh.rotation.y += diff * 0.18;
  }

  update() {
    if (this.isSitting) {
      // Gentle breathing animation while sitting
      this.animTime += 0.05;
      const breath = Math.sin(this.animTime * 0.4) * 0.02;
      if (this.avatar.head) this.avatar.head.position.y = 2.25 + breath;
      return;
    }

    this.animTime += 0.15;
    if (this.jumpCooldown > 0) this.jumpCooldown--;

    const groundY = this.getGroundHeight(this.mesh.position.x, this.mesh.position.z);

    // 1. Process Jump Physics & Dynamic Shadow Scaling
    if (this.isJumping) {
      this.mesh.position.y += this.velocityY;
      this.velocityY += this.gravity;

      // Ground Touch Down
      if (this.mesh.position.y <= groundY) {
        this.mesh.position.y = groundY;
        this.isJumping = false;
        this.velocityY = 0;
      }
    } else {
      // Smoothly adapt elevation when traversing stepped terraces & staircases with precise snap
      const diffY = groundY - this.mesh.position.y;
      if (Math.abs(diffY) < 0.02) {
        this.mesh.position.y = groundY;
      } else {
        this.mesh.position.y += diffY * 0.55;
      }
    }

    const isWalkingView = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'walking';

    // 2. Process Stride / Idle Animation
    if (this.isMoving || isWalkingView) {
      // Walking Stride Animation Cycle
      const tAnim = isWalkingView ? 1.05 : this.animTime * 1.5;
      const legAngle = Math.sin(tAnim) * 0.45;
      const armAngle = Math.sin(tAnim) * 0.38;

      if (this.avatar.leftLeg) this.avatar.leftLeg.rotation.x = legAngle;
      if (this.avatar.rightLeg) this.avatar.rightLeg.rotation.x = -legAngle;
      if (this.avatar.leftArm) this.avatar.leftArm.rotation.x = -armAngle;
      if (this.avatar.rightArm) this.avatar.rightArm.rotation.x = armAngle;
      if (this.avatar.head) this.avatar.head.position.y = 2.25 + Math.abs(Math.sin(tAnim)) * 0.03;
    } else {
      // Natural Idle Breathing Animation Cycle
      const breath = Math.sin(this.animTime * 0.4) * 0.03;
      if (this.avatar.leftLeg) this.avatar.leftLeg.rotation.x = 0;
      if (this.avatar.rightLeg) this.avatar.rightLeg.rotation.x = 0;
      if (this.avatar.leftArm) this.avatar.leftArm.rotation.x = breath * 0.4;
      if (this.avatar.rightArm) this.avatar.rightArm.rotation.x = -breath * 0.4;
      if (this.avatar.head) this.avatar.head.position.y = 2.25 + breath;
    }
  }

  getPosition() {
    return this.mesh.position;
  }
}
