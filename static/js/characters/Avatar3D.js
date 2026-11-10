import * as THREE from 'three';

export class Avatar3D {
  constructor(config = {}) {
    this.group = new THREE.Group();
    this.config = config;

    // Body parts references for smooth Sims-like animation
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftArm = null;
    this.rightArm = null;
    this.torso = null;
    this.head = null;

    this.buildCharacter();
  }

  buildCharacter() {
    const skin = this.config.skinColor || '#F1C27D';
    const hairCol = this.config.hairColor || '#1A1A24';
    const hairStyle = this.config.hairStyle || 'short';
    const outfit = this.config.outfit || 'traditional_gold';
    const accessory = this.config.accessory || 'none';

    // PBR-like Smooth Materials
    const skinMat = new THREE.MeshLambertMaterial({ color: skin });
    const hairMat = new THREE.MeshLambertMaterial({ color: hairCol });

    // Outfit Primary & Accent Palettes
    let outfitCol = '#d4af37'; // gold
    let accentCol = '#8c1d40'; // maroon accent
    if (outfit === 'traditional_maroon') {
      outfitCol = '#800020';
      accentCol = '#d4af37';
    } else if (outfit === 'tuxedo') {
      outfitCol = '#1a1a24';
      accentCol = '#f8f9fa';
    } else if (outfit === 'dress') {
      outfitCol = '#fdfbf7';
      accentCol = '#d4af37';
    }

    const outfitMat = new THREE.MeshLambertMaterial({ color: outfitCol });
    const accentMat = new THREE.MeshLambertMaterial({ color: accentCol });
    const shoeMat = new THREE.MeshLambertMaterial({ color: '#16161a' });

    // 1. Soft Dynamic Shadow Blob Base (rests 5mm above surface)
    const shadowGeo = new THREE.CircleGeometry(0.75, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.35, transparent: true });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.005;
    this.group.add(this.shadow);

    // 2. Legs & Shoes (Calibrated so bottom of shoes is at EXACTLY y = 0.000)
    const legGeo = new THREE.CylinderGeometry(0.10, 0.085, 0.88, 12);
    const shoeGeo = new THREE.BoxGeometry(0.20, 0.10, 0.32);

    // Left Leg Group (pivot at hip y = 0.98)
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.18, 0.98, 0);

    const leftLegMesh = new THREE.Mesh(legGeo, outfitMat);
    leftLegMesh.position.y = -0.44;
    this.leftLeg.add(leftLegMesh);

    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.93, 0.05); // Bottom of shoe is at 0.98 - 0.93 - 0.05 = 0.000
    this.leftLeg.add(leftShoe);

    this.group.add(this.leftLeg);

    // Right Leg Group (pivot at hip y = 0.98)
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.18, 0.98, 0);

    const rightLegMesh = new THREE.Mesh(legGeo, outfitMat);
    rightLegMesh.position.y = -0.44;
    this.rightLeg.add(rightLegMesh);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.93, 0.05);
    this.rightLeg.add(rightShoe);

    this.group.add(this.rightLeg);

    // 3. Torso / Pelvis (Sculpted human proportions)
    this.torso = new THREE.Group();
    this.torso.position.set(0, 0.98, 0);

    // Hips / Lower waist with Batik Jarik wrap
    const hipGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.32, 14);
    const hip = new THREE.Mesh(hipGeo, outfitMat);
    hip.position.y = 0.16;
    this.torso.add(hip);

    // Chest & Shoulders (tapered)
    const chestGeo = new THREE.CylinderGeometry(0.28, 0.23, 0.65, 14);
    const chest = new THREE.Mesh(chestGeo, outfitMat);
    chest.position.y = 0.58;
    chest.scale.set(1.15, 1.0, 0.75);
    this.torso.add(chest);

    // Gold Embroidered Trim down center of Beskap / Kebaya
    const sashGeo = new THREE.BoxGeometry(0.06, 0.65, 0.04);
    const sash = new THREE.Mesh(sashGeo, accentMat);
    sash.position.set(0, 0.58, 0.22);
    this.torso.add(sash);

    // Gold brooch / buttons down chest
    const btnMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });
    for (let b = 0; b < 3; b++) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.02, 8), btnMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, 0.42 + b * 0.14, 0.24);
      this.torso.add(btn);
    }

    this.group.add(this.torso);

    // 4. Arms (Pivoting at shoulders y = 1.78)
    const armGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.72, 10);
    const handGeo = new THREE.SphereGeometry(0.075, 8, 8);

    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.35, 1.78, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, outfitMat);
    leftArmMesh.position.y = -0.34;
    this.leftArm.add(leftArmMesh);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.72;
    this.leftArm.add(leftHand);
    this.group.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.35, 1.78, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, outfitMat);
    rightArmMesh.position.y = -0.34;
    this.rightArm.add(rightArmMesh);
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.72;
    this.rightArm.add(rightHand);
    this.group.add(this.rightArm);

    // 5. Neck
    const neckGeo = new THREE.CylinderGeometry(0.085, 0.10, 0.18, 12);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 1.92, 0);
    this.group.add(neck);

    // 6. Sculpted Head & Face
    this.head = new THREE.Group();
    this.head.position.set(0, 2.26, 0);

    const headGeo = new THREE.SphereGeometry(0.27, 16, 14);
    headGeo.scale(1.0, 1.15, 1.05);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    this.head.add(headMesh);

    // Contoured Nose Bridge
    const noseGeo = new THREE.ConeGeometry(0.024, 0.08, 6);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.rotation.x = Math.PI / 2.2;
    nose.position.set(0, 0.01, 0.28);
    this.head.add(nose);

    // Contoured Ears
    const earGeo = new THREE.SphereGeometry(0.045, 8, 8);
    earGeo.scale(0.4, 1.2, 0.7);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.28, 0.02, 0);
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.28, 0.02, 0);
    this.head.add(leftEar);
    this.head.add(rightEar);

    // Expressive Facial Features: Eyes with specular shine
    const eyeWhiteGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const pupilGeo = new THREE.SphereGeometry(0.026, 8, 8);
    const whiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const pupilMat = new THREE.MeshBasicMaterial({ color: '#1a1008' });

    // Left Eye
    const leftEyeW = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    leftEyeW.position.set(-0.095, 0.04, 0.25);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.095, 0.04, 0.28);
    this.head.add(leftEyeW);
    this.head.add(leftPupil);

    // Right Eye
    const rightEyeW = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    rightEyeW.position.set(0.095, 0.04, 0.25);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.095, 0.04, 0.28);
    this.head.add(rightEyeW);
    this.head.add(rightPupil);

    // Smiling Mouth
    const smileGeo = new THREE.TorusGeometry(0.042, 0.011, 6, 10, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: '#a04238' });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.rotation.x = Math.PI;
    smile.position.set(0, -0.11, 0.26);
    this.head.add(smile);

    // 7. Hair / Headdress
    this.buildStyledHair(hairStyle, hairMat);

    // 8. Accessories
    this.buildAccessory(accessory);

    this.group.add(this.head);
  }

  buildStyledHair(style, hairMat) {
    if (style === 'hijab') {
      // Flowing elegant Pashmina Hijab with gentle draping folds
      const hijabMat = new THREE.MeshLambertMaterial({ color: '#f8f4eb' });
      const hoodGeo = new THREE.SphereGeometry(0.35, 16, 14);
      hoodGeo.scale(1.05, 1.25, 1.15);
      const hood = new THREE.Mesh(hoodGeo, hijabMat);
      hood.position.set(0, 0.02, -0.04);
      this.head.add(hood);

      // Chest Drape
      const drapeGeo = new THREE.CylinderGeometry(0.26, 0.36, 0.45, 12, 1, true);
      const drape = new THREE.Mesh(drapeGeo, hijabMat);
      drape.position.set(0, -0.32, 0.02);
      this.head.add(drape);
    } else if (style === 'bun') {
      // Sleek updo with floral chignon bun
      const capGeo = new THREE.SphereGeometry(0.31, 16, 12);
      capGeo.scale(1.02, 1.05, 1.05);
      const cap = new THREE.Mesh(capGeo, hairMat);
      cap.position.set(0, 0.06, -0.02);
      this.head.add(cap);

      // Top bun
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), hairMat);
      bun.position.set(0, 0.36, -0.1);
      this.head.add(bun);

      // Gold Hairpin Accent (Tusuk Konde)
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35), new THREE.MeshLambertMaterial({ color: '#d4af37' }));
      pin.rotation.z = 0.8;
      pin.position.set(0.08, 0.36, -0.05);
      this.head.add(pin);
    } else if (style === 'wavy') {
      // Shoulder-length soft wavy hair
      const topHair = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), hairMat);
      topHair.position.set(0, 0.08, -0.02);
      this.head.add(topHair);

      // Side flowing curls
      const curlL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.5, 8), hairMat);
      curlL.position.set(-0.25, -0.15, 0.05);
      this.head.add(curlL);

      const curlR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.5, 8), hairMat);
      curlR.position.set(0.25, -0.15, 0.05);
      this.head.add(curlR);
    } else if (style === 'cap') {
      // Traditional Blangkon / Songkok Peci
      const peciMat = new THREE.MeshLambertMaterial({ color: '#2a1a12' });
      const peci = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.28, 16), peciMat);
      peci.position.set(0, 0.22, 0);
      this.head.add(peci);

      // Gold band trim
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.02, 6, 16), new THREE.MeshLambertMaterial({ color: '#d4af37' }));
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 0.1, 0);
      this.head.add(band);
    } else {
      // Modern textured fade crop (default short)
      const hairGeo = new THREE.SphereGeometry(0.31, 16, 14);
      hairGeo.scale(1.02, 1.08, 1.06);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 0.06, -0.02);
      this.head.add(hair);

      // Front sweep fringe
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.14), hairMat);
      fringe.position.set(0, 0.24, 0.22);
      fringe.rotation.x = 0.2;
      this.head.add(fringe);
    }
  }

  buildAccessory(accessory) {
    if (accessory === 'crown') {
      const crownMat = new THREE.MeshLambertMaterial({ color: '#d4af37', emissive: 0x443300 });
      const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 6, 16), crownMat);
      crownRing.rotation.x = Math.PI / 2;
      crownRing.position.set(0, 0.32, 0);
      this.head.add(crownRing);

      // Spikes
      for (let i = 0; i < 5; i++) {
        const angle = (i - 2) * 0.35;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 6), crownMat);
        spike.position.set(Math.sin(angle) * 0.24, 0.4, Math.cos(angle) * 0.24);
        this.head.add(spike);
      }
    } else if (accessory === 'glasses') {
      const frameMat = new THREE.MeshBasicMaterial({ color: '#1a1a24' });
      const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12), frameMat);
      lensL.position.set(-0.1, 0.04, 0.28);
      const lensR = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12), frameMat);
      lensR.position.set(0.1, 0.04, 0.28);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), frameMat);
      bridge.position.set(0, 0.04, 0.28);

      this.head.add(lensL);
      this.head.add(lensR);
      this.head.add(bridge);
    } else if (accessory === 'flower') {
      // Jasmine / Frangipani bloom
      const flowerGroup = new THREE.Group();
      flowerGroup.position.set(0.28, 0.16, 0.12);
      const petalMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
      const centerMat = new THREE.MeshLambertMaterial({ color: '#ffd54f' });

      for (let p = 0; p < 5; p++) {
        const a = (p * Math.PI * 2) / 5;
        const pet = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05), petalMat);
        pet.position.set(Math.cos(a) * 0.06, Math.sin(a) * 0.06, 0);
        flowerGroup.add(pet);
      }
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), centerMat);
      center.position.z = 0.02;
      flowerGroup.add(center);

      this.head.add(flowerGroup);
    }
  }
}
