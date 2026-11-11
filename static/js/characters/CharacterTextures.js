import * as THREE from 'three';

/**
 * CharacterTextures - Procedural PBR Canvas Texture Factory
 * Generates realistic micro-skin, iris, fabric weave, batik/songket patterns,
 * hair fibers, and leather shoe textures with zero external asset dependencies.
 */
class CharacterTextureFactory {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Procedural micro-pore skin bump / normal map for realistic skin specular breakup
   */
  getSkinBumpMap() {
    const key = 'skin_bump';
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Neutral gray baseline
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 128, 128);

    // Subtle micro-cellular skin pores & fine wrinkles
    const imgData = ctx.getImageData(0, 0, 128, 128);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Perlin-like pseudo noise for natural skin grain
      const noise = (Math.random() - 0.5) * 22;
      const val = Math.max(0, Math.min(255, 128 + noise));
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    // Add very faint cellular pores
    ctx.fillStyle = 'rgba(70, 70, 70, 0.35)';
    for (let p = 0; p < 80; p++) {
      const px = Math.random() * 128;
      const py = Math.random() * 128;
      const pr = 0.5 + Math.random() * 1.0;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Procedural high-resolution realistic human eye iris texture
   * Features: Sclera gradient, dark limbal ring, radial melanin striae,
   * pupillary zone, deep black pupil, and corneal specular reflection.
   */
  getIrisTexture(irisColorHex = '#3b2413') {
    const key = `iris_${irisColorHex}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const cx = 128;
    const cy = 128;

    // 1. Sclera (White of eye) with subtle soft pinkish/ivory gradient & corner shadows
    const scleraGrad = ctx.createRadialGradient(cx, cy, 70, cx, cy, 128);
    scleraGrad.addColorStop(0, '#faf8f5');
    scleraGrad.addColorStop(0.7, '#f4ece2');
    scleraGrad.addColorStop(1.0, '#e8ded0');
    ctx.fillStyle = scleraGrad;
    ctx.fillRect(0, 0, 256, 256);

    // Faint micro-capillaries at outer edges
    ctx.strokeStyle = 'rgba(210, 110, 100, 0.22)';
    ctx.lineWidth = 0.8;
    for (let c = 0; c < 12; c++) {
      const angle = (c * Math.PI * 2) / 12 + (Math.random() - 0.5) * 0.2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 115, cy + Math.sin(angle) * 115);
      ctx.quadraticCurveTo(
        cx + Math.cos(angle + 0.1) * 95,
        cy + Math.sin(angle + 0.1) * 95,
        cx + Math.cos(angle) * 80,
        cy + Math.sin(angle) * 80
      );
      ctx.stroke();
    }

    // 2. Limbal Ring (Outer dark border of iris)
    const irisRadius = 68;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, irisRadius, 0, Math.PI * 2);
    ctx.clip();

    // Base iris color gradient
    const irisGrad = ctx.createRadialGradient(cx, cy, 18, cx, cy, irisRadius);
    irisGrad.addColorStop(0, '#5a381e');
    irisGrad.addColorStop(0.4, irisColorHex);
    irisGrad.addColorStop(0.85, '#221308');
    irisGrad.addColorStop(1.0, '#0c0703'); // Dark pronounced limbal ring
    ctx.fillStyle = irisGrad;
    ctx.fillRect(cx - irisRadius, cy - irisRadius, irisRadius * 2, irisRadius * 2);

    // 3. Radial Melanin Fibers / Striae
    for (let r = 0; r < 140; r++) {
      const a = (r * Math.PI * 2) / 140;
      const len = 20 + Math.random() * (irisRadius - 22);
      const isHighlight = Math.random() > 0.65;
      ctx.strokeStyle = isHighlight ? 'rgba(210, 160, 110, 0.45)' : 'rgba(15, 8, 3, 0.55)';
      ctx.lineWidth = isHighlight ? 1.0 : 0.8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    }

    // 4. Inner Collarette Ring
    ctx.strokeStyle = 'rgba(215, 170, 110, 0.4)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Deep Black Pupil
    const pupilGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    pupilGrad.addColorStop(0, '#020202');
    pupilGrad.addColorStop(0.85, '#080808');
    pupilGrad.addColorStop(1.0, '#1a120c');
    ctx.fillStyle = pupilGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    // 6. Corneal Specular Reflection (Glint of light giving life to eyes)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath();
    ctx.ellipse(cx - 14, cy - 14, 5, 4, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(cx + 10, cy + 12, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Procedural Indonesian Royal Wedding Batik & Songket fabric texture
   * Beautiful geometric Kawung motif with gold foil thread accents
   */
  getBatikFabricTexture(outfitType = 'traditional_gold') {
    const key = `batik_${outfitType}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    let baseBg = '#1c150c';
    let petalBg = '#a67c1e';
    let goldAccent = '#ffd700';
    let innerCore = '#591624';

    if (outfitType === 'traditional_maroon') {
      baseBg = '#420816';
      petalBg = '#7a1b2d';
      goldAccent = '#e6be58';
      innerCore = '#26040c';
    } else if (outfitType === 'tuxedo') {
      baseBg = '#141419';
      petalBg = '#1f1f26';
      goldAccent = '#32323e';
      innerCore = '#0e0e12';
    } else if (outfitType === 'dress') {
      baseBg = '#faf7f0';
      petalBg = '#f2ecd9';
      goldAccent = '#d9c28a';
      innerCore = '#ffffff';
    }

    // 1. Rich base fabric background with subtle textile weave
    ctx.fillStyle = baseBg;
    ctx.fillRect(0, 0, 256, 256);

    // Micro fabric twill weave lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 256; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    if (outfitType.startsWith('traditional')) {
      // 2. Indonesian Traditional Kawung Pattern Grid (4 interlocking ellipse petals)
      const step = 64;
      for (let x = 0; x <= 256; x += step) {
        for (let y = 0; y <= 256; y += step) {
          ctx.save();
          ctx.translate(x, y);

          // 4 Oval Petals in Kawung formation
          for (let rot = 0; rot < 4; rot++) {
            ctx.save();
            ctx.rotate((rot * Math.PI) / 2);

            // Outer Petal
            ctx.fillStyle = petalBg;
            ctx.beginPath();
            ctx.ellipse(0, 22, 11, 20, 0, 0, Math.PI * 2);
            ctx.fill();

            // Inner Gold Foil Inlay
            ctx.fillStyle = goldAccent;
            ctx.beginPath();
            ctx.ellipse(0, 22, 5, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Core dot
            ctx.fillStyle = innerCore;
            ctx.beginPath();
            ctx.arc(0, 22, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }

          // Center Intersection Gold Diamond
          ctx.fillStyle = goldAccent;
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.lineTo(9, 0);
          ctx.lineTo(0, 9);
          ctx.lineTo(-9, 0);
          ctx.closePath();
          ctx.fill();

          // Center Ruby/Garnet Core
          ctx.fillStyle = innerCore;
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    } else if (outfitType === 'tuxedo') {
      // Elegant subtle pinstripe twill
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 256; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 256);
        ctx.stroke();
      }
    } else if (outfitType === 'dress') {
      // Bridal French Lace & Damask Floral filigree
      ctx.strokeStyle = 'rgba(217, 194, 138, 0.4)';
      ctx.lineWidth = 1.2;
      for (let x = 32; x < 256; x += 64) {
        for (let y = 32; y < 256; y += 64) {
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Procedural anisotropic hair strand flow texture
   * Provides realistic lighting breakup along hair fibers
   */
  getHairTexture(hairColorHex = '#1A1A24') {
    const key = `hair_${hairColorHex}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base tone
    ctx.fillStyle = hairColorHex;
    ctx.fillRect(0, 0, 128, 256);

    // Hair strand vertical fibers
    for (let x = 0; x < 128; x += 2) {
      const isLighter = Math.random() > 0.5;
      const alpha = 0.15 + Math.random() * 0.35;
      ctx.strokeStyle = isLighter ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + (Math.random() - 0.5) * 2, 0);
      ctx.lineTo(x + (Math.random() - 0.5) * 4, 256);
      ctx.stroke();
    }

    // Specular sheen band across center of strands
    const sheenGrad = ctx.createLinearGradient(0, 70, 0, 160);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.22)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(0, 70, 128, 90);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Procedural leather shoe texture with welt stitching
   */
  getLeatherShoeTexture() {
    const key = 'leather_shoe';
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Deep polished black / cordovan leather
    ctx.fillStyle = '#121217';
    ctx.fillRect(0, 0, 128, 128);

    // Subtle leather grain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 150; i++) {
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5);
    }

    // Golden welt stitch row along edge
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(4, 124);
    ctx.lineTo(124, 124);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(key, texture);
    return texture;
  }
}

export const characterTextures = new CharacterTextureFactory();
