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

    // 2. Limbal Ring (Outer dark border of iris — balanced ratio so warm sclera frames the iris)
    const irisRadius = 42;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, irisRadius, 0, Math.PI * 2);
    ctx.clip();

    // Base iris color gradient
    const irisGrad = ctx.createRadialGradient(cx, cy, 12, cx, cy, irisRadius);
    irisGrad.addColorStop(0, '#5a381e');
    irisGrad.addColorStop(0.42, irisColorHex);
    irisGrad.addColorStop(0.85, '#221308');
    irisGrad.addColorStop(1.0, '#0c0703'); // Dark pronounced limbal ring
    ctx.fillStyle = irisGrad;
    ctx.fillRect(cx - irisRadius, cy - irisRadius, irisRadius * 2, irisRadius * 2);

    // 3. Radial Melanin Fibers / Striae
    for (let r = 0; r < 110; r++) {
      const a = (r * Math.PI * 2) / 110;
      const len = 14 + Math.random() * (irisRadius - 15);
      const isHighlight = Math.random() > 0.65;
      ctx.strokeStyle = isHighlight ? 'rgba(210, 160, 110, 0.45)' : 'rgba(15, 8, 3, 0.55)';
      ctx.lineWidth = isHighlight ? 1.0 : 0.8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    }

    // 4. Inner Collarette Ring
    ctx.strokeStyle = 'rgba(215, 170, 110, 0.4)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, 21, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Deep Black Pupil
    const pupilGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);
    pupilGrad.addColorStop(0, '#020202');
    pupilGrad.addColorStop(0.85, '#080808');
    pupilGrad.addColorStop(1.0, '#1a120c');
    ctx.fillStyle = pupilGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();

    // 6. Corneal Specular Reflection (Glint of light giving life to eyes)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy - 10, 4.5, 3.6, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.60)';
    ctx.beginPath();
    ctx.arc(cx + 8, cy + 9, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Minimalist clean stylized eye texture (crisp white sclera, clean dark iris, bright catchlight)
   */
  getStylizedIrisTexture(irisColorHex = '#2c1b10') {
    const key = `stylized_iris_${irisColorHex}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const cx = 128;
    const cy = 128;

    // Clean warm-white sclera (zero capillaries or mottled edges)
    ctx.fillStyle = '#fcfbf8';
    ctx.fillRect(0, 0, 256, 256);

    // Expressive crisp stylized iris (clean sclera framing left & right)
    const irisRadius = 40;
    const irisGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, irisRadius);
    irisGrad.addColorStop(0, irisColorHex);
    irisGrad.addColorStop(0.78, '#23140b');
    irisGrad.addColorStop(1, '#120a05');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, irisRadius, 0, Math.PI * 2);
    ctx.fill();

    // Soft deep pupil
    ctx.fillStyle = '#090604';
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, Math.PI * 2);
    ctx.fill();

    // Clean stylized catchlight glints
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy - 10, 5.5, 4.4, -0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.arc(cx + 8, cy + 9, 2.2, 0, Math.PI * 2);
    ctx.fill();

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

    let baseBg = '#281f14';
    let petalBg = '#523e1e';
    let goldAccent = '#b89446';
    let innerCore = '#3a2b16';

    if (outfitType === 'traditional_maroon') {
      baseBg = '#44121d';
      petalBg = '#5e1c2b';
      goldAccent = '#c29a52';
      innerCore = '#320b14';
    } else if (outfitType === 'beskap_hitam') {
      baseBg = '#141419';
      petalBg = '#1e1e25';
      goldAccent = '#d4af37';
      innerCore = '#0c0c10';
    } else if (outfitType === 'kebaya_putih') {
      baseBg = '#f8f6f0';
      petalBg = '#ece6d8';
      goldAccent = '#e3d5b8';
      innerCore = '#ffffff';
    } else if (outfitType === 'batik_jarik') {
      baseBg = '#3b2416';
      petalBg = '#5c3820';
      goldAccent = '#a97e42';
      innerCore = '#26160c';
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
    ctx.strokeStyle = outfitType === 'kebaya_putih' ? 'rgba(180, 165, 140, 0.14)' : 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 256; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    if (outfitType.startsWith('traditional') || outfitType === 'batik_jarik') {
      // 2. Refined Low-Contrast Indonesian Kawung / Songket Weave (soft elegance, never harsh checkerboard)
      const isSongket = outfitType.startsWith('traditional');
      const step = 64;
      ctx.save();
      if (isSongket) {
        ctx.globalAlpha = 0.42;
      }
      for (let x = 0; x <= 256; x += step) {
        for (let y = 0; y <= 256; y += step) {
          ctx.save();
          ctx.translate(x, y);

          for (let rot = 0; rot < 4; rot++) {
            ctx.save();
            ctx.rotate((rot * Math.PI) / 2);

            ctx.fillStyle = petalBg;
            ctx.beginPath();
            ctx.ellipse(0, 22, 10, 18, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = goldAccent;
            ctx.lineWidth = isSongket ? 1.1 : 1.5;
            ctx.beginPath();
            ctx.ellipse(0, 22, 5, 11, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = innerCore;
            ctx.beginPath();
            ctx.arc(0, 22, 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }

          ctx.fillStyle = goldAccent;
          ctx.beginPath();
          ctx.moveTo(0, -7);
          ctx.lineTo(7, 0);
          ctx.lineTo(0, 7);
          ctx.lineTo(-7, 0);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = innerCore;
          ctx.beginPath();
          ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
      ctx.restore();
    } else if (outfitType === 'beskap_hitam') {
      // Fine jet-black Javanese velvet/silk diagonal sheen weave
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
      ctx.lineWidth = 1;
      for (let x = -256; x < 512; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 128, 256);
        ctx.stroke();
      }
    } else if (outfitType === 'kebaya_putih') {
      // Ivory-white Indonesian Kebaya floral brocade & embroidered lace motifs
      ctx.strokeStyle = 'rgba(210, 198, 174, 0.65)';
      ctx.lineWidth = 1.2;
      for (let x = 24; x < 256; x += 48) {
        for (let y = 24; y < 256; y += 48) {
          for (let p = 0; p < 6; p++) {
            const a = (p * Math.PI * 2) / 6;
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 4.5, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
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
    if (outfitType === 'batik_jarik') {
      texture.repeat.set(1.5, 1.5);
    } else if (outfitType.startsWith('traditional')) {
      texture.repeat.set(2, 2);
    } else {
      texture.repeat.set(3, 3);
    }
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
