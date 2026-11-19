import * as THREE from 'three';
import { Avatar3D } from '../characters/Avatar3D.js';
import { CHARACTER_ANIM_STATES } from '../characters/CharacterAnimator.js';
import { computeSeatingRigPose } from '../characters/SeatingAnchor.js';
import { resolveWalkingAnimPhase } from '../characters/StylizedMath.js';
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

    // Filtered downward terrain raycasting
    this.walkableMeshes = [];
    this._groundRaycaster = new THREE.Raycaster();
    this._groundRayOrigin = new THREE.Vector3();
    this._groundRayDown = new THREE.Vector3(0, -1, 0);

    // Animation transition helpers
    this._lastTurnDelta = 0;
    this._lastTurnDir = 0;
    this._standingSettleTimer = 0;

    // Load Avatar3D (procedural + optional rigged GLB)
    const config = gameState.getState().playerConfig;
    this.avatar = new Avatar3D(config, { role: 'guest', proceduralVersion: 'v3' });
    this.mesh = this.avatar.group;
    // Initial spawn based on lastOutdoorPosition, URL parameter, or default Pintu Masuk
    const savedOutdoor = gameState.getState().lastOutdoorPosition;
    const initSpawn = savedOutdoor || this.getInitialSpawnFromURL();
    this.mesh.position.set(initSpawn.x, initSpawn.y, initSpawn.z);
    this.mesh.rotation.y = initSpawn.rotY || 0;
    this.scene.add(this.mesh);

    this.cachedConfigStr = JSON.stringify(config);

    // Subscribe to avatar changes
    this._unsubscribeState = gameState.subscribe((state) => {
      const newConfigStr = JSON.stringify(state.playerConfig);
      if (newConfigStr !== this.cachedConfigStr) {
        this.cachedConfigStr = newConfigStr;
        const currentPos = this.mesh ? this.mesh.position.clone() : new THREE.Vector3(18, 0.05, 23);
        const currentRot = this.mesh ? this.mesh.rotation.y : 0;

        this.scene.remove(this.mesh);
        if (this.avatar && typeof this.avatar.dispose === 'function') {
          this.avatar.dispose();
        }
        this.avatar = new Avatar3D(state.playerConfig, { role: 'guest', proceduralVersion: 'v3' });
        this.mesh = this.avatar.group;
        this.mesh.position.copy(currentPos);
        this.mesh.rotation.y = currentRot;
        if (this.isSitting && typeof this.avatar.setSitting === 'function') {
          this.avatar.setSitting(true);
        }
        this.scene.add(this.mesh);
      }
    });

    // Listen for jump event
    this._onJumpEvent = () => this.jump();
    window.addEventListener('player-jump', this._onJumpEvent);
  }

  destroy() {
    if (this._unsubscribeState) {
      this._unsubscribeState();
      this._unsubscribeState = null;
    }
    if (this._onJumpEvent) {
      window.removeEventListener('player-jump', this._onJumpEvent);
      this._onJumpEvent = null;
    }
    if (this.avatar && typeof this.avatar.dispose === 'function') {
      this.avatar.dispose();
    }
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
      if (v === 'profile_path') return { x: 9.0, y: 2.0, z: -4.0, rotY: Math.PI / 2 };
      if (v === 'pavilion' || v === 'profile') return { x: 15.5, y: 2.0, z: -4.0, rotY: Math.PI / 2 };
      if (v === 'gallery') return { x: 18, y: 2.0, z: 8, rotY: -Math.PI / 2 };
      if (v === 'listening') return { x: -22, y: 1.0, z: 8, rotY: -Math.PI / 2 };
      if (v === 'foodcourt') return { x: -20, y: 3.2, z: -8, rotY: -Math.PI / 2 };
      if (v === 'location' || v === 'junction') return { x: 0, y: 2.0, z: 11.4, rotY: 0 };
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
      this.jumpCooldown = 15;
    }
  }

  setWalkableMeshes(meshes) {
    this.walkableMeshes = Array.isArray(meshes) ? meshes.filter(Boolean) : [];
    if (this.mesh && !this.isSitting && !this.isJumping) {
      this.mesh.position.y = this.getGroundHeight(this.mesh.position.x, this.mesh.position.z);
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

    let hitY = null;
    if (this.walkableMeshes.length > 0) {
      const approxY = this.mesh ? this.mesh.position.y : TerrainManager.getHeight(x, z);
      this._groundRayOrigin.set(x, approxY + 3.2, z);
      this._groundRaycaster.set(this._groundRayOrigin, this._groundRayDown);
      this._groundRaycaster.near = 0.05;
      this._groundRaycaster.far = 14.0;

      const hits = this._groundRaycaster.intersectObjects(this.walkableMeshes, false);
      if (hits.length > 0) {
        const baselineY = TerrainManager.getHeight(x, z);
        for (const hit of hits) {
          if (hit.point.y >= baselineY - 0.35 && hit.point.y <= baselineY + 0.45) {
            hitY = hit.point.y;
            break;
          }
        }
      }
    }

    return TerrainManager.resolveFilteredGroundHeight(x, z, hitY);
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

  sitOn(seatPos, faceAngle, seatingOptions = {}) {
    this.isSitting = true;
    this.isMoving = false;
    this.velocityY = 0;
    this.isJumping = false;

    const cushionTopY = typeof seatingOptions.cushionTopY === 'number'
      ? seatingOptions.cushionTopY
      : (typeof seatPos.y === 'number' ? seatPos.y + 0.035 : 0.475);
    const supportFloorY = typeof seatingOptions.supportFloorY === 'number'
      ? seatingOptions.supportFloorY
      : 0.0;

    const pose = computeSeatingRigPose({
      cushionTopY,
      supportFloorY,
      seatCenterX: seatPos.x,
      seatCenterZ: seatPos.z,
      faceAngle,
      seatDepthForwardOffset: typeof seatingOptions.seatDepthForwardOffset === 'number'
        ? seatingOptions.seatDepthForwardOffset
        : -0.02
    });

    this.mesh.position.set(pose.rootPosition.x, pose.rootPosition.y, pose.rootPosition.z);
    this.mesh.rotation.y = pose.faceAngle;

    if (typeof this.avatar.setSitting === 'function') {
      this.avatar.setSitting(true, pose);
    }
  }

  standUp(standOffset = null) {
    if (!this.isSitting) return;
    this.isSitting = false;
    this._standingSettleTimer = 0.24;

    if (typeof this.avatar.setSitting === 'function') {
      this.avatar.setSitting(false);
    }

    if (standOffset) {
      this.mesh.position.add(standOffset);
    }
    const groundY = this.getGroundHeight(this.mesh.position.x, this.mesh.position.z);
    this.mesh.position.y = groundY;
  }

  move(dx, dz, intensity = 1.0, jumpInput = false, camera = null) {
    if (this.isSitting) {
      if (Math.abs(dx) > 0.05 || Math.abs(dz) > 0.05 || jumpInput) {
        this.standUp();
      } else {
        return;
      }
    }

    if (jumpInput) {
      this.jump();
    }

    if (dx === 0 && dz === 0) {
      this.isMoving = false;
      return;
    }

    this.isMoving = true;

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

        moveDirX = right.x * dx - forward.x * dz;
        moveDirZ = right.z * dx - forward.z * dz;
      }
    }

    const clampedIntensity = Math.max(0.1, Math.min(1.0, intensity));
    const currentSpeed = this.speed * (0.35 + 0.65 * clampedIntensity);

    const moveLen = Math.hypot(moveDirX, moveDirZ);
    if (moveLen > 0.0001) {
      moveDirX /= moveLen;
      moveDirZ /= moveLen;
    }

    const nextX = this.mesh.position.x + moveDirX * currentSpeed;
    const nextZ = this.mesh.position.z + moveDirZ * currentSpeed;

    if (!this.check3DCollision(nextX, this.mesh.position.z)) {
      this.mesh.position.x = nextX;
    }
    if (!this.check3DCollision(this.mesh.position.x, nextZ)) {
      this.mesh.position.z = nextZ;
    }

    // Smooth Character Rotation towards actual movement direction
    const targetRotation = Math.atan2(moveDirX, moveDirZ);
    let diff = targetRotation - this.mesh.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this._lastTurnDelta = Math.abs(diff);
    this._lastTurnDir = Math.sign(diff);
    this.mesh.rotation.y += diff * 0.18;
  }

  update(delta = 0.016) {
    if (this.isSitting) {
      this.animTime += 0.05;
      if (typeof this.avatar.updateAnimation === 'function') {
        this.avatar.updateAnimation(CHARACTER_ANIM_STATES.SITTING, delta, this.animTime);
      }
      return;
    }

    this.animTime += Math.min(0.24, Math.max(0.06, delta * 9.0));
    if (this.jumpCooldown > 0) this.jumpCooldown--;
    if (this._standingSettleTimer > 0) {
      this._standingSettleTimer = Math.max(0, this._standingSettleTimer - delta);
    }

    const groundY = this.getGroundHeight(this.mesh.position.x, this.mesh.position.z);

    // 1. Process Jump Physics & Ground Tracking
    if (this.isJumping) {
      this.mesh.position.y += this.velocityY;
      this.velocityY += this.gravity;

      if (this.mesh.position.y <= groundY) {
        this.mesh.position.y = groundY;
        this.isJumping = false;
        this.velocityY = 0;
      }
    } else {
      const diffY = groundY - this.mesh.position.y;
      if (Math.abs(diffY) < 0.02) {
        this.mesh.position.y = groundY;
      } else {
        this.mesh.position.y += diffY * 0.48;
      }
    }

    const isWalkingView = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'walking';

    // 2. Determine unified animation state
    let nextState = CHARACTER_ANIM_STATES.IDLE;
    if (this._standingSettleTimer > 0) {
      nextState = CHARACTER_ANIM_STATES.STANDING;
    } else if (this.isMoving || isWalkingView) {
      nextState = CHARACTER_ANIM_STATES.WALKING;
    } else if (this._lastTurnDelta > 0.08) {
      nextState = CHARACTER_ANIM_STATES.TURNING;
    }

    // Dispatch footstep audio event on stride zero-crossing while walking grounded
    if (nextState === CHARACTER_ANIM_STATES.WALKING && !this.isJumping) {
      const tAnim = resolveWalkingAnimPhase(this.animTime);
      const curPhase = Math.sin(tAnim);
      if (typeof this.prevStepPhase === 'number') {
        if ((this.prevStepPhase <= 0 && curPhase > 0) || (this.prevStepPhase >= 0 && curPhase < 0)) {
          window.dispatchEvent(new CustomEvent('player-step'));
        }
      }
      this.prevStepPhase = curPhase;
    }

    if (typeof this.avatar.updateAnimation === 'function') {
      this.avatar.updateAnimation(nextState, delta, this.animTime, {
        isWalkingView,
        turnDir: this._lastTurnDir * 0.16
      });
    }

    this._lastTurnDelta *= 0.65;
  }

  getPosition() {
    return this.mesh.position;
  }
}
