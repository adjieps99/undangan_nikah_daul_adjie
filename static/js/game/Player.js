import { generateAvatarSVG } from '../svg/AvatarSVG.js';
import { gameState } from '../state/GameState.js';

export class Player {
  constructor(x = 600, y = 550) {
    this.x = x;
    this.y = y;
    this.size = 32;
    this.speed = 3.5;
    this.direction = 'down'; // 'up' | 'down' | 'left' | 'right'
    this.isMoving = false;

    this.avatarImg = new Image();
    this.cachedConfigJSON = '';
    this.currentBlobUrl = null;

    this.updateAvatarImage();

    // Subscribe to state changes and ONLY update sprite if playerConfig changed
    gameState.subscribe((state) => {
      const newConfigJSON = JSON.stringify(state.playerConfig);
      if (newConfigJSON !== this.cachedConfigJSON) {
        this.updateAvatarImage();
      }
    });
  }

  updateAvatarImage() {
    const config = gameState.getState().playerConfig;
    this.cachedConfigJSON = JSON.stringify(config);

    const svgString = generateAvatarSVG(config, 64);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }

    this.currentBlobUrl = URL.createObjectURL(blob);
    this.avatarImg.src = this.currentBlobUrl;
  }

  move(dx, dy, collisionCheck) {
    if (dx === 0 && dy === 0) {
      this.isMoving = false;
      return;
    }

    this.isMoving = true;

    if (dx < 0) this.direction = 'left';
    else if (dx > 0) this.direction = 'right';
    else if (dy < 0) this.direction = 'up';
    else if (dy > 0) this.direction = 'down';

    const nextX = this.x + dx * this.speed;
    const nextY = this.y + dy * this.speed;

    // Boundary & Collision check
    if (!collisionCheck(nextX, this.y, this.size)) {
      this.x = nextX;
    }
    if (!collisionCheck(this.x, nextY, this.size)) {
      this.y = nextY;
    }
  }

  draw(ctx, camera) {
    const renderX = Math.floor(this.x - camera.x);
    const renderY = Math.floor(this.y - camera.y);

    if (this.avatarImg.complete && this.avatarImg.naturalWidth !== 0) {
      ctx.drawImage(this.avatarImg, renderX - 24, renderY - 32, 48, 48);
    } else {
      // Fallback rect while image loads
      ctx.fillStyle = '#f1c27d';
      ctx.fillRect(renderX - 12, renderY - 16, 24, 32);
    }
  }
}
