import { Player } from './Player.js';
import { Controls } from './Controls.js';

export const POIS = [
  { id: 'profile', name: 'Gazebo Pengantin (Adjie & Daul)', x: 300, y: 220, radius: 45, icon: '💍', label: 'Profil Pengantin' },
  { id: 'location', name: 'Informasi Acara & Lokasi', x: 600, y: 420, radius: 45, icon: '📜', label: 'Waktu & Lokasi' },
  { id: 'rsvp', name: 'Meja RSVP & Seating', x: 900, y: 220, radius: 45, icon: '✉️', label: 'RSVP & Tempat Duduk' },
  { id: 'wishes', name: 'Wishing Tree & Buku Tamu', x: 450, y: 680, radius: 45, icon: '🌸', label: 'Buku Tamu & Ucapan' },
  { id: 'gift', name: 'Kotak Hadiah & Digital Angpao', x: 750, y: 680, radius: 45, icon: '🎁', label: 'Kirim Hadiah' }
];

export class MapEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // World Dimensions
    this.worldWidth = 1200;
    this.worldHeight = 900;

    // Viewport Camera
    this.camera = { x: 0, y: 0, width: canvas.width, height: canvas.height };

    // Game Entities
    this.player = new Player(600, 550);
    this.controls = new Controls();

    // Floating Petals Animation Particles
    this.petals = [];
    this.initPetals();

    this.isRunning = false;
    this.nearbyPOI = null;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  initPetals() {
    for (let i = 0; i < 25; i++) {
      this.petals.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        size: 3 + Math.random() * 3,
        speedX: -0.5 + Math.random() * 1,
        speedY: 0.8 + Math.random() * 1.2,
        color: Math.random() > 0.5 ? '#ffb703' : '#ff4d6d'
      });
    }
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 600;
    this.camera.width = this.canvas.width;
    this.camera.height = this.canvas.height;
  }

  start() {
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  checkCollision(x, y, size) {
    const half = size / 2;
    // Map Outer Boundaries
    if (x - half < 40 || x + half > this.worldWidth - 40) return true;
    if (y - half < 40 || y + half > this.worldHeight - 40) return true;

    // River Pond Area Collision Box (Top right river pond)
    if (x > 1050 && y < 200) return true;

    return false;
  }

  update() {
    // Process movement vector
    const { dx, dy } = this.controls.getMovementVector();
    this.player.move(dx, dy, (x, y, sz) => this.checkCollision(x, y, sz));

    // Update Camera position centered on Player
    this.camera.x = Math.max(0, Math.min(this.worldWidth - this.camera.width, this.player.x - this.camera.width / 2));
    this.camera.y = Math.max(0, Math.min(this.worldHeight - this.camera.height, this.player.y - this.camera.height / 2));

    // Check POI Proximity
    this.nearbyPOI = null;
    for (const poi of POIS) {
      const dist = Math.hypot(this.player.x - poi.x, this.player.y - poi.y);
      if (dist < poi.radius) {
        this.nearbyPOI = poi;
        break;
      }
    }

    // Update Petals
    for (const petal of this.petals) {
      petal.x += petal.speedX;
      petal.y += petal.speedY;
      if (petal.y > this.worldHeight) petal.y = 0;
      if (petal.x > this.worldWidth) petal.x = 0;
      if (petal.x < 0) petal.x = this.worldWidth;
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();

    // 1. TERRAIN BASE & WEDDING ENVIRONMENT
    this.drawTerrain();
    this.drawWeddingStructures();

    // 2. POI MAP DECORATIONS
    this.drawPOINodes();

    // 3. PLAYER SPRITE
    this.player.draw(this.ctx, this.camera);

    // 4. FLOATING PETALS ATMOSPHERE
    this.drawPetals();

    this.ctx.restore();
  }

  drawTerrain() {
    const camX = this.camera.x;
    const camY = this.camera.y;

    // Grass Fill
    this.ctx.fillStyle = '#2d5a27';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid Checker Pattern
    this.ctx.fillStyle = '#275022';
    const tileSize = 64;
    const startCol = Math.floor(camX / tileSize);
    const endCol = startCol + Math.ceil(this.camera.width / tileSize) + 1;
    const startRow = Math.floor(camY / tileSize);
    const endRow = startRow + Math.ceil(this.camera.height / tileSize) + 1;

    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        if ((r + c) % 2 === 0) {
          const rx = c * tileSize - camX;
          const ry = r * tileSize - camY;
          this.ctx.fillRect(rx, ry, tileSize, tileSize);
        }
      }
    }

    // Paved Stone Paths (Main Garden Crossroads)
    this.ctx.fillStyle = '#d4c5a9';
    // Vertical Main Path
    this.ctx.fillRect(560 - camX, 40 - camY, 80, 820);
    // Horizontal Top Path
    this.ctx.fillRect(40 - camX, 220 - camY, 1120, 60);
    // Horizontal Bottom Path
    this.ctx.fillRect(40 - camX, 680 - camY, 1120, 60);

    // Outer Boundary Fences
    this.ctx.strokeStyle = '#5c4033';
    this.ctx.lineWidth = 6;
    this.ctx.strokeRect(40 - camX, 40 - camY, this.worldWidth - 80, this.worldHeight - 80);
  }

  drawWeddingStructures() {
    const camX = this.camera.x;
    const camY = this.camera.y;

    // Floral Entrance Archway (x: 600, y: 800)
    const archX = 600 - camX;
    const archY = 820 - camY;
    this.ctx.fillStyle = '#8b0000';
    this.ctx.fillRect(archX - 45, archY - 10, 90, 16);
    this.ctx.fillStyle = '#ff4d6d';
    this.ctx.beginPath();
    this.ctx.arc(archX - 40, archY - 10, 10, 0, Math.PI * 2);
    this.ctx.arc(archX + 40, archY - 10, 10, 0, Math.PI * 2);
    this.ctx.arc(archX, archY - 15, 12, 0, Math.PI * 2);
    this.ctx.fill();

    // Gazebo Roof Outline (x: 300, y: 220)
    const gzX = 300 - camX;
    const gzY = 220 - camY;
    this.ctx.fillStyle = '#d4af37';
    this.ctx.beginPath();
    this.ctx.arc(gzX, gzY, 48, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#8b0000';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // Reception Banquet Tables (x: 900, y: 220)
    const tbX = 900 - camX;
    const tbY = 220 - camY;
    this.ctx.fillStyle = '#f8f9fa';
    this.ctx.fillRect(tbX - 40, tbY - 20, 80, 40);
    this.ctx.strokeStyle = '#d4af37';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(tbX - 40, tbY - 20, 80, 40);

    // Wedding Cake on Banquet Table
    this.ctx.fillStyle = '#ffb703';
    this.ctx.fillRect(tbX - 10, tbY - 10, 20, 20);
    this.ctx.fillStyle = '#ff4d6d';
    this.ctx.fillRect(tbX - 6, tbY - 6, 12, 12);
  }

  drawPOINodes() {
    for (const poi of POIS) {
      const rx = poi.x - this.camera.x;
      const ry = poi.y - this.camera.y;

      // Glow Ring
      this.ctx.beginPath();
      this.ctx.arc(rx, ry, 36, 0, Math.PI * 2);
      this.ctx.fillStyle = poi === this.nearbyPOI ? 'rgba(212, 175, 55, 0.45)' : 'rgba(255, 255, 255, 0.2)';
      this.ctx.fill();

      // Inner Base Marker
      this.ctx.beginPath();
      this.ctx.arc(rx, ry, 24, 0, Math.PI * 2);
      this.ctx.fillStyle = '#1e1e28';
      this.ctx.strokeStyle = '#d4af37';
      this.ctx.lineWidth = 3;
      this.ctx.fill();
      this.ctx.stroke();

      // Icon Text
      this.ctx.font = '20px serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(poi.icon, rx, ry);
    }
  }

  drawPetals() {
    for (const petal of this.petals) {
      const rx = petal.x - this.camera.x;
      const ry = petal.y - this.camera.y;

      if (rx >= 0 && rx <= this.camera.width && ry >= 0 && ry <= this.camera.height) {
        this.ctx.fillStyle = petal.color;
        this.ctx.beginPath();
        this.ctx.arc(rx, ry, petal.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  loop() {
    if (!this.isRunning) return;
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }
}
