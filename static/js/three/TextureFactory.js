import * as THREE from 'three';

/**
 * TextureFactory - Generates high-resolution procedural textures for Three.js materials
 * without requiring external image assets.
 */
export class TextureFactory {
  /**
   * Paved flagstone pathway texture with mortar joints and natural rock gradients.
   */
  static createFlagstoneTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base warm stone background
    ctx.fillStyle = '#b5a489';
    ctx.fillRect(0, 0, size, size);

    // Dark mortar groove joints
    ctx.strokeStyle = '#43382c';
    ctx.lineWidth = 5;

    const tileSize = 64;
    for (let x = 0; x < size; x += tileSize) {
      for (let y = 0; y < size; y += tileSize) {
        const jx = Math.sin(x * 0.15 + y) * 8;
        const jy = Math.cos(y * 0.12 + x) * 8;

        // Individual stone slab with natural warm stone gradient
        const grad = ctx.createLinearGradient(x + jx, y + jy, x + jx + tileSize, y + jy + tileSize);
        const toneVar = ((x * 17 + y * 31) % 40) - 20;
        grad.addColorStop(0, `rgb(${190 + toneVar}, ${175 + toneVar}, ${150 + toneVar})`);
        grad.addColorStop(1, `rgb(${155 + toneVar}, ${140 + toneVar}, ${115 + toneVar})`);

        ctx.fillStyle = grad;
        ctx.fillRect(x + jx + 3, y + jy + 3, tileSize - 6, tileSize - 6);
        ctx.strokeRect(x + jx + 3, y + jy + 3, tileSize - 6, tileSize - 6);

        // Subtle flecks and weathering
        ctx.fillStyle = 'rgba(70, 55, 40, 0.15)';
        ctx.fillRect(x + jx + 8, y + jy + 8, tileSize - 16, 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  /**
   * River stone retaining wall texture with interlocking blocks, mortar fissures, and moss.
   */
  static createStoneWallTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#48423b';
    ctx.fillRect(0, 0, size, size);

    const rows = 8;
    const rowH = size / rows;

    for (let r = 0; r <= rows; r++) {
      const y = r * rowH;
      ctx.fillStyle = '#221e1a';
      ctx.fillRect(0, y - 3, size, 6);

      const offset = (r % 2 === 0) ? 0 : rowH * 0.75;
      for (let x = offset; x < size + rowH; x += rowH * 1.5) {
        ctx.fillRect(x - 3, y - rowH, 6, rowH);

        // Radial stone face shading
        const grad = ctx.createRadialGradient(x - rowH * 0.75, y - rowH * 0.5, 4, x - rowH * 0.75, y - rowH * 0.5, rowH * 0.8);
        grad.addColorStop(0, 'rgba(125, 120, 110, 0.45)');
        grad.addColorStop(0.7, 'rgba(75, 70, 65, 0.25)');
        grad.addColorStop(1, 'rgba(30, 26, 22, 0.6)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - rowH * 1.5 + 4, y - rowH + 4, rowH * 1.5 - 8, rowH - 8);

        // Green moss flecks in crevices
        if ((r + x) % 4 === 0) {
          ctx.fillStyle = 'rgba(60, 95, 40, 0.4)';
          ctx.fillRect(x - rowH * 1.5 + 4, y - 8, rowH * 1.5 - 8, 6);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    return texture;
  }

  /**
   * Camellia sinensis tea leaf foliage texture with glossy leaves and lime shoot tips.
   */
  static createTeaFoliageTexture(size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Deep organic tea foliage base
    ctx.fillStyle = '#1c4217';
    ctx.fillRect(0, 0, size, size);

    // Draw individual glossy tea leaves with midrib veins
    const leafCount = 90;
    for (let i = 0; i < leafCount; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const angle = Math.random() * Math.PI * 2;
      const len = 16 + Math.random() * 14;
      const w = 7 + Math.random() * 5;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.ellipse(0, 0, len / 2, w / 2, 0, 0, Math.PI * 2);

      const isTip = Math.random() > 0.65;
      ctx.fillStyle = isTip ? '#58a82d' : '#296b1e';
      ctx.fill();

      // Leaf midrib
      ctx.beginPath();
      ctx.moveTo(-len / 2, 0);
      ctx.lineTo(len / 2, 0);
      ctx.strokeStyle = isTip ? '#7ecc4a' : '#1b4a14';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Teak wood plank texture with subtle wood grain.
   */
  static createWoodTexture(size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#5c381e';
    ctx.fillRect(0, 0, size, size);

    // Grain lines
    ctx.fillStyle = '#482a14';
    for (let y = 0; y < size; y += 4) {
      if (Math.random() > 0.3) {
        ctx.fillRect(0, y, size, 1.5);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * High-resolution architectural gold lettering signage for THE HACHI facade.
   */
  static createHachiSignageTexture(width = 1024, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Dark charcoal-bronze architectural timber background
    ctx.fillStyle = '#1c1613';
    ctx.fillRect(0, 0, width, height);

    // Wood grain undertone
    ctx.fillStyle = 'rgba(15, 10, 8, 0.6)';
    for (let y = 0; y < height; y += 6) {
      ctx.fillRect(0, y, width, 2);
    }

    // Outer and Inner Gold Beveled Frame
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    ctx.strokeStyle = '#8a6d23';
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 22, width - 44, height - 44);

    // Corner decorative rosettes
    const drawCornerRosette = (cx, cy) => {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCornerRosette(22, 22);
    drawCornerRosette(width - 22, 22);
    drawCornerRosette(22, height - 22);
    drawCornerRosette(width - 22, height - 22);

    // Main Title: "THE HACHI"
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    // Metallic gold vertical gradient
    const goldGrad = ctx.createLinearGradient(0, 40, 0, 160);
    goldGrad.addColorStop(0, '#fffbe6');
    goldGrad.addColorStop(0.35, '#f5d77f');
    goldGrad.addColorStop(0.7, '#d4af37');
    goldGrad.addColorStop(1, '#8f6814');

    ctx.font = 'bold 92px "Cinzel", "Georgia", "Times New Roman", serif';
    ctx.fillStyle = goldGrad;
    ctx.letterSpacing = '14px';
    ctx.fillText('THE HACHI', width / 2, 104);

    // Reset shadow for crisp subtitle
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    // Subtitle: "GARDEN WEDDING VENUE"
    ctx.font = 'bold 26px "Cinzel", "Georgia", "Times New Roman", serif';
    ctx.fillStyle = '#e8c97e';
    ctx.letterSpacing = '8px';
    ctx.fillText('GARDEN WEDDING VENUE', width / 2, 186);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
  }
}
