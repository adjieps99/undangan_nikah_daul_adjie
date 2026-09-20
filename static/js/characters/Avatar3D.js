import * as THREE from 'three';

export class Avatar3D {
  constructor(config = {}) {
    this.group = new THREE.Group();
    this.config = config;

    // Body parts references for animation
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftArm = null;
    this.rightArm = null;
    this.head = null;

    this.buildCharacter();
  }

  buildCharacter() {
    const skin = this.config.skinColor || '#F1C27D';
    const hairCol = this.config.hairColor || '#1A1A24';
    const hairStyle = this.config.hairStyle || 'short';
    const outfit = this.config.outfit || 'traditional_gold';
    const accessory = this.config.accessory || 'none';

    // Materials
    const skinMat = new THREE.MeshLambertMaterial({ color: skin });
    const hairMat = new THREE.MeshLambertMaterial({ color: hairCol });
    const outfitMat = new THREE.MeshLambertMaterial({
      color: outfit === 'traditional_maroon' ? '#8b0000' : outfit === 'tuxedo' ? '#1c1c24' : outfit === 'dress' ? '#f8f9fa' : '#d4af37'
    });
    const shoeMat = new THREE.MeshLambertMaterial({ color: '#121218' });

    // 1. Shadow Blob Base
    const shadowGeo = new THREE.PlaneGeometry(1.4, 1.4);
    const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.3, transparent: true });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.group.add(shadow);

    // 2. Legs
    const legGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    this.leftLeg = new THREE.Mesh(legGeo, shoeMat);
    this.leftLeg.position.set(-0.22, 0.45, 0);

    this.rightLeg = new THREE.Mesh(legGeo, shoeMat);
    this.rightLeg.position.set(0.22, 0.45, 0);

    this.group.add(this.leftLeg);
    this.group.add(this.rightLeg);

    // 3. Torso / Outfit
    const torsoGeo = new THREE.BoxGeometry(0.85, 1.0, 0.5);
    const torso = new THREE.Mesh(torsoGeo, outfitMat);
    torso.position.set(0, 1.4, 0);
    this.group.add(torso);

    // 4. Arms
    const armGeo = new THREE.BoxGeometry(0.25, 0.85, 0.25);
    this.leftArm = new THREE.Mesh(armGeo, skinMat);
    this.leftArm.position.set(-0.55, 1.35, 0);

    this.rightArm = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.position.set(0.55, 1.35, 0);

    this.group.add(this.leftArm);
    this.group.add(this.rightArm);

    // 5. Head & Neck
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 1.95, 0);
    this.group.add(neck);

    const headGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.set(0, 2.35, 0);
    this.group.add(this.head);

    // 6. Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#000000' });
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15, 2.4, 0.33);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.15, 2.4, 0.33);
    this.group.add(leftEye);
    this.group.add(rightEye);

    // 7. Hair Layer
    this.buildHair(hairStyle, hairMat);

    // 8. Accessory Layer
    this.buildAccessory(accessory);
  }

  buildHair(style, hairMat) {
    if (style === 'cap') {
      const capGeo = new THREE.BoxGeometry(0.72, 0.22, 0.72);
      const cap = new THREE.Mesh(capGeo, hairMat);
      cap.position.set(0, 2.72, 0);
      this.group.add(cap);

      const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.06, 0.3), hairMat);
      capBrim.position.set(0, 2.62, 0.35);
      this.group.add(capBrim);
    } else if (style === 'hijab') {
      const hijabMat = new THREE.MeshLambertMaterial({ color: '#f5f5f7' });
      const hijabGeo = new THREE.BoxGeometry(0.78, 0.85, 0.78);
      const hijab = new THREE.Mesh(hijabGeo, hijabMat);
      hijab.position.set(0, 2.35, -0.04);
      this.group.add(hijab);

      const chestCover = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.4, 0.52), hijabMat);
      chestCover.position.set(0, 1.7, 0.05);
      this.group.add(chestCover);
    } else if (style === 'long') {
      const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.3, 0.72), hairMat);
      hairTop.position.set(0, 2.72, 0);
      this.group.add(hairTop);

      const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.0, 0.2), hairMat);
      hairBack.position.set(0, 2.1, -0.32);
      this.group.add(hairBack);
    } else if (style === 'bun') {
      const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.28, 0.72), hairMat);
      hairTop.position.set(0, 2.72, 0);
      this.group.add(hairTop);

      const bunBun = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25), hairMat);
      bunBun.position.set(0, 2.98, -0.15);
      this.group.add(bunBun);
    } else if (style === 'wavy') {
      const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.35, 0.74), hairMat);
      hairTop.position.set(0, 2.72, 0);
      this.group.add(hairTop);

      const sideSweep = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.5), hairMat);
      sideSweep.position.set(0.35, 2.1, 0.05);
      this.group.add(sideSweep);
    } else {
      // Short hair default
      const hairGeo = new THREE.BoxGeometry(0.72, 0.3, 0.72);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 2.72, -0.02);
      this.group.add(hair);
    }
  }

  buildAccessory(accessory) {
    if (accessory === 'crown') {
      const crownMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
      const crownGeo = new THREE.ConeGeometry(0.35, 0.35, 5);
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(0, 2.92, 0);
      this.group.add(crown);
    } else if (accessory === 'glasses') {
      const glassMat = new THREE.MeshBasicMaterial({ color: '#111111' });
      const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 0.05), glassMat);
      frameLeft.position.set(-0.16, 2.4, 0.35);
      const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 0.05), glassMat);
      frameRight.position.set(0.16, 2.4, 0.35);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.05), glassMat);
      bridge.position.set(0, 2.4, 0.35);

      this.group.add(frameLeft);
      this.group.add(frameRight);
      this.group.add(bridge);
    } else if (accessory === 'flower') {
      const flowerMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
      const flowerCenter = new THREE.MeshLambertMaterial({ color: '#ffd166' });

      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14), flowerMat);
      flower.position.set(0.36, 2.65, 0.2);
      const center = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06), flowerCenter);
      center.position.set(0.38, 2.65, 0.28);

      this.group.add(flower);
      this.group.add(center);
    }
  }
}
