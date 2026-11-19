import * as THREE from 'three';

/**
 * LocationPinLandmark - Iconic sculpted 3D Map Pin beacon placed at the Central Cross Junction
 * (x = 0, y = 2.0, z = 8.0) so guests immediately spot "Waktu & Lokasi Acara" upon climbing into the garden.
 */
export class LocationPinLandmark {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, 2.0, 8.0);

    this.pinRig = null;
    this.pulseRing = null;
    this.shadowDisc = null;
    this.elapsed = 0;

    this.buildLandmark();
  }

  buildLandmark() {
    // Shared PBR materials with distinct roughness / metalness contrast
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: '#4a3828',
      roughness: 0.55,
      metalness: 0.45
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: '#f2c96b',
      emissive: '#7a5410',
      emissiveIntensity: 0.35,
      roughness: 0.22,
      metalness: 0.85
    });

    const crimsonPinMat = new THREE.MeshStandardMaterial({
      color: '#e63946',
      emissive: '#6e1019',
      emissiveIntensity: 0.45,
      roughness: 0.24,
      metalness: 0.12
    });

    // 1. Grounded Floor Compass Medallion (sits cleanly on top of y = +0.04 stone paving)
    const medallionOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.04, 0.05, 32),
      bronzeMat
    );
    medallionOuter.position.y = 0.055;
    this.group.add(medallionOuter);

    const medallionGoldRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.94, 0.032, 10, 36),
      goldMat
    );
    medallionGoldRim.rotation.x = Math.PI / 2;
    medallionGoldRim.position.y = 0.085;
    this.group.add(medallionGoldRim);

    const medallionInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.78, 0.055, 32),
      new THREE.MeshStandardMaterial({
        color: '#2b2019',
        roughness: 0.7,
        metalness: 0.15
      })
    );
    medallionInner.position.y = 0.058;
    this.group.add(medallionInner);

    // 4 Cardinal Compass Ticks pointing North (Hachi), South (Entrance), West (Music), East (Gallery)
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.26), goldMat);
      tick.position.set(Math.sin(ang) * 0.78, 0.09, Math.cos(ang) * 0.78);
      tick.rotation.y = ang;
      this.group.add(tick);
    }

    // Soft contact shadow directly under the floating pin
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const grad = sctx.createRadialGradient(64, 64, 6, 64, 64, 60);
      grad.addColorStop(0, 'rgba(10, 6, 4, 0.65)');
      grad.addColorStop(0.6, 'rgba(10, 6, 4, 0.22)');
      grad.addColorStop(1, 'rgba(10, 6, 4, 0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    this.shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.68, 24), shadowMat);
    this.shadowDisc.rotation.x = -Math.PI / 2;
    this.shadowDisc.position.y = 0.095;
    this.group.add(this.shadowDisc);

    // Animated pulsing golden halo ring around the medallion
    const pulseMat = new THREE.MeshBasicMaterial({
      color: '#ffdf7e',
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    this.pulseRing = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.028, 8, 40), pulseMat);
    this.pulseRing.rotation.x = Math.PI / 2;
    this.pulseRing.position.y = 0.10;
    this.group.add(this.pulseRing);

    // 2. Floating Animated Rig (3D Location Pin + Subtle Gold Inner Rim + Crisp Badge)
    this.pinRig = new THREE.Group();
    this.pinRig.position.y = 1.05;
    this.group.add(this.pinRig);

    // Sculpted Teardrop Location Pin via ExtrudeGeometry with real circular hole
    const pinShape = new THREE.Shape();
    const headY = 1.06;
    const headR = 0.60;
    pinShape.moveTo(0, 0);
    pinShape.bezierCurveTo(0.18, 0.34, headR, 0.68, headR, headY);
    pinShape.absarc(0, headY, headR, 0, Math.PI, false);
    pinShape.bezierCurveTo(-headR, 0.68, -0.18, 0.34, 0, 0);

    const holePath = new THREE.Path();
    holePath.absarc(0, headY, 0.25, 0, Math.PI * 2, true);
    pinShape.holes.push(holePath);

    const pinDepth = 0.24;
    const pinGeo = new THREE.ExtrudeGeometry(pinShape, {
      depth: pinDepth,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.065,
      bevelSegments: 5,
      curveSegments: 28
    });
    pinGeo.translate(0, 0, -pinDepth / 2);

    const pinMesh = new THREE.Mesh(pinGeo, crimsonPinMat);
    this.pinRig.add(pinMesh);

    // Brushed gold collar rings framing the pin's circular center cutout (front & back)
    const innerRingGeo = new THREE.TorusGeometry(0.255, 0.042, 12, 28);
    [-0.145, 0.145].forEach((zOff) => {
      const ring = new THREE.Mesh(innerRingGeo, goldMat);
      ring.position.set(0, headY, zOff);
      this.pinRig.add(ring);
    });

    // Subtle golden tip finial accent at bottom of pin
    const tipCap = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 12), goldMat);
    tipCap.rotation.x = Math.PI;
    tipCap.position.set(0, -0.04, 0);
    this.pinRig.add(tipCap);

    // 3. Double-Sided Floating Signage Plaque above the Pin ("WAKTU & LOKASI")
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1d1410';
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = '#e5be5c';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, 496, 112);

      ctx.fillStyle = '#fff3c4';
      ctx.font = 'bold 38px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WAKTU & LOKASI', 256, 48);

      ctx.fillStyle = '#f2b8a2';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('5 DESEMBER 2026', 256, 92);
    }

    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signFaceMat = new THREE.MeshLambertMaterial({ map: signTex });
    const signPlaque = new THREE.Mesh(
      new THREE.BoxGeometry(1.86, 0.46, 0.08),
      [goldMat, goldMat, goldMat, goldMat, signFaceMat, signFaceMat]
    );
    signPlaque.position.set(0, 2.08, 0);
    this.pinRig.add(signPlaque);
  }

  update(delta = 0.016) {
    this.elapsed += delta;

    if (this.pinRig) {
      // Gentle levitation bob + slow 360-degree beacon spin
      const bob = Math.sin(this.elapsed * 2.2) * 0.12;
      this.pinRig.position.y = 1.05 + bob;
      this.pinRig.rotation.y += delta * 0.85;

      if (this.shadowDisc) {
        const shadowScale = 1.0 - bob * 0.6;
        this.shadowDisc.scale.set(shadowScale, shadowScale, 1);
      }
    }

    if (this.pulseRing) {
      const cycle = (this.elapsed * 0.65) % 1.0;
      const scale = 1.0 + cycle * 0.65;
      this.pulseRing.scale.set(scale, scale, 1);
      this.pulseRing.material.opacity = (1.0 - cycle) * 0.65;
    }
  }
}
