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
    if (accessory === 'crown') {
      const crownGeo = new THREE.ConeGeometry(0.4, 0.4, 5);
      const crownMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(0, 2.85, 0);
      this.group.add(crown);
    }
  }

  buildHair(style, hairMat) {
    if (style === 'cap') {
      const capGeo = new THREE.BoxGeometry(0.7, 0.2, 0.7);
      const cap = new THREE.Mesh(capGeo, hairMat);
      cap.position.set(0, 2.7, 0);
      this.group.add(cap);
    } else if (style === 'hijab') {
      const hijabGeo = new THREE.BoxGeometry(0.75, 0.8, 0.75);
      const hijabMat = new THREE.MeshLambertMaterial({ color: '#e2e8f0' });
      const hijab = new THREE.Mesh(hijabGeo, hijabMat);
      hijab.position.set(0, 2.35, -0.05);
      this.group.add(hijab);
    } else {
      const hairGeo = new THREE.BoxGeometry(0.7, 0.3, 0.7);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 2.7, -0.02);
      this.group.add(hair);
    }
  }
}
