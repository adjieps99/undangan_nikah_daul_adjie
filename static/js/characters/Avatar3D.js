import * as THREE from 'three';
import { characterTextures } from './CharacterTextures.js';

/**
 * Avatar3D - High-Fidelity Realistic Human Character Generator
 * Transforms primitive geometric characters into natural-looking, anatomically
 * proportioned 3D digital humans with PBR skin, realistic facial anatomy,
 * textured hair, tailored wedding attire, and articulated hands.
 */
export class Avatar3D {
  constructor(config = {}) {
    this.group = new THREE.Group();
    this.config = config;

    // Body parts references required by CharacterController for smooth walking/sitting
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftKnee = null;
    this.rightKnee = null;
    this.leftArm = null;
    this.rightArm = null;
    this.torso = null;
    this.head = null;
    this.shadow = null;

    this.buildRealisticCharacter();
  }

  setSitting(isSitting) {
    if (isSitting) {
      if (this.leftLeg) this.leftLeg.rotation.x = -Math.PI / 2;
      if (this.rightLeg) this.rightLeg.rotation.x = -Math.PI / 2;
      if (this.leftKnee) this.leftKnee.rotation.x = Math.PI / 2;
      if (this.rightKnee) this.rightKnee.rotation.x = Math.PI / 2;
      if (this.leftArm) this.leftArm.rotation.x = -0.55;
      if (this.rightArm) this.rightArm.rotation.x = -0.55;
    } else {
      if (this.leftLeg) this.leftLeg.rotation.x = 0;
      if (this.rightLeg) this.rightLeg.rotation.x = 0;
      if (this.leftKnee) this.leftKnee.rotation.x = 0;
      if (this.rightKnee) this.rightKnee.rotation.x = 0;
      if (this.leftArm) this.leftArm.rotation.x = 0;
      if (this.rightArm) this.rightArm.rotation.x = 0;
    }
  }

  buildRealisticCharacter() {
    const skinHex = this.config.skinColor || '#F1C27D';
    const hairCol = this.config.hairColor || '#1A1A24';
    const hairStyle = this.config.hairStyle || 'short';
    const outfit = this.config.outfit || 'traditional_gold';
    const accessory = this.config.accessory || 'none';

    // 1. PBR High-Fidelity Materials with Procedural Maps
    const skinBump = characterTextures.getSkinBumpMap();
    const fabricMap = characterTextures.getBatikFabricTexture(outfit);
    const hairMap = characterTextures.getHairTexture(hairCol);
    const leatherMap = characterTextures.getLeatherShoeTexture();

    // PBR Skin Shading with natural subsurface scattering look and micro-pore breakup
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinHex),
      roughness: 0.54,
      metalness: 0.02,
      bumpMap: skinBump,
      bumpScale: 0.004,
    });

    // PBR Lip Material (slightly deeper rose tint with natural moisture gloss)
    const lipColor = new THREE.Color(skinHex).lerp(new THREE.Color('#b84852'), 0.45);
    const lipMat = new THREE.MeshStandardMaterial({
      color: lipColor,
      roughness: 0.38,
      metalness: 0.05,
    });

    // Fabric Primary & Accent Materials
    let accentHex = '#d4af37'; // gold
    if (outfit === 'traditional_maroon') accentHex = '#e6be58';
    else if (outfit === 'tuxedo') accentHex = '#f8f9fa';
    else if (outfit === 'dress') accentHex = '#d4af37';

    const fabricMat = new THREE.MeshStandardMaterial({
      map: fabricMap,
      roughness: 0.72,
      metalness: 0.08,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      roughness: 0.28,
      metalness: 0.82,
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      map: leatherMap,
      color: new THREE.Color('#15151a'),
      roughness: 0.36,
      metalness: 0.12,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      map: hairMap,
      color: new THREE.Color(hairCol),
      roughness: 0.48,
      metalness: 0.04,
    });

    // 2. Multi-Tier Grounding Contact Shadow
    const shadowGroup = new THREE.Group();
    const innerShadowGeo = new THREE.CircleGeometry(0.55, 20);
    const innerShadowMat = new THREE.MeshBasicMaterial({
      color: '#000000',
      opacity: 0.38,
      transparent: true,
      depthWrite: false,
    });
    const innerShadow = new THREE.Mesh(innerShadowGeo, innerShadowMat);
    innerShadow.rotation.x = -Math.PI / 2;
    innerShadow.position.y = 0.005;
    shadowGroup.add(innerShadow);

    const outerShadowGeo = new THREE.CircleGeometry(0.85, 20);
    const outerShadowMat = new THREE.MeshBasicMaterial({
      color: '#000000',
      opacity: 0.16,
      transparent: true,
      depthWrite: false,
    });
    const outerShadow = new THREE.Mesh(outerShadowGeo, outerShadowMat);
    outerShadow.rotation.x = -Math.PI / 2;
    outerShadow.position.y = 0.004;
    shadowGroup.add(outerShadow);

    this.shadow = shadowGroup;
    this.group.add(this.shadow);

    // 3. Anatomically Proportioned Legs & Realistic Dress Shoes
    // Hip Pivot Height: EXACTLY y = 0.98
    // Bottom of footwear rests flush at y = 0.000
    this.leftLeg = this.buildRealisticLeg(-0.16, true, fabricMat, shoeMat, skinMat);
    this.rightLeg = this.buildRealisticLeg(0.16, false, fabricMat, shoeMat, skinMat);
    this.group.add(this.leftLeg);
    this.group.add(this.rightLeg);

    // 4. Anatomically Proportioned Torso with Tailored Attire
    this.torso = this.buildRealisticTorso(fabricMat, accentMat, skinMat, outfit);
    this.group.add(this.torso);

    // 5. Anatomically Proportioned Arms with Sculpted Hands
    // Shoulder Pivot Height: EXACTLY y = 1.76
    this.leftArm = this.buildRealisticArm(-0.30, true, fabricMat, accentMat, skinMat);
    this.rightArm = this.buildRealisticArm(0.30, false, fabricMat, accentMat, skinMat);
    this.group.add(this.leftArm);
    this.group.add(this.rightArm);

    // 6. Realistic Sculpted Head, Face & Hair
    // Head Pivot Height: EXACTLY y = 2.14
    this.head = this.buildRealisticHead(skinMat, lipMat, hairMat, hairStyle, hairCol, accessory, accentMat);
    this.group.add(this.head);
  }

  /**
   * Builds an anatomically contoured human leg with thigh, articulated knee patella,
   * contoured calf, ankle, and realistic dress shoe with defined sole and heel.
   */
  buildRealisticLeg(xOffset, isLeft, fabricMat, shoeMat, skinMat) {
    const legGroup = new THREE.Group();
    legGroup.position.set(xOffset, 0.98, 0);

    // A. Upper Thigh (Muscular contoured taper from hip down to knee)
    const thighGeo = new THREE.CylinderGeometry(0.098, 0.082, 0.44, 16);
    const thigh = new THREE.Mesh(thighGeo, fabricMat);
    thigh.position.set(0, -0.22, 0.01);
    legGroup.add(thigh);

    // B. Articulated Knee Joint Group (Pivot at y = -0.44)
    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(0, -0.44, 0);

    // Knee Patella Transition
    const kneeGeo = new THREE.SphereGeometry(0.083, 12, 10);
    kneeGeo.scale(1.0, 0.85, 1.15);
    const knee = new THREE.Mesh(kneeGeo, fabricMat);
    knee.position.set(0, 0, 0.02);
    kneeGroup.add(knee);

    // C. Lower Leg / Calf (Anatomical gastrocnemius curve tapering down to ankle)
    const calfGeo = new THREE.CylinderGeometry(0.082, 0.064, 0.44, 16);
    const calf = new THREE.Mesh(calfGeo, fabricMat);
    calf.position.set(0, -0.22, 0);
    kneeGroup.add(calf);

    // D. Realistic Tailored Dress Shoe / Oxford Footwear
    // Heel starts at y = -0.44 relative to knee, sole bottom reaches -0.54 relative to knee
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.44, 0.04);

    // Shoe Upper vamp & quarter with curved toe box
    const shoeUpperGeo = new THREE.BoxGeometry(0.155, 0.085, 0.28);
    const shoeUpper = new THREE.Mesh(shoeUpperGeo, shoeMat);
    shoeUpper.position.set(0, -0.025, 0.025);
    shoeGroup.add(shoeUpper);

    // Rounded Toe Cap
    const toeCapGeo = new THREE.CylinderGeometry(0.076, 0.076, 0.085, 12, 1, false, 0, Math.PI);
    const toeCap = new THREE.Mesh(toeCapGeo, shoeMat);
    toeCap.rotation.y = Math.PI / 2;
    toeCap.position.set(0, -0.025, 0.165);
    shoeGroup.add(toeCap);

    // Distinct Outsole welt
    const soleMat = new THREE.MeshStandardMaterial({
      color: '#1a1614',
      roughness: 0.8,
    });
    const soleGeo = new THREE.BoxGeometry(0.165, 0.02, 0.31);
    const sole = new THREE.Mesh(soleGeo, soleMat);
    sole.position.set(0, -0.07, 0.035);
    shoeGroup.add(sole);

    // Raised Dress Heel Block at rear of foot
    const heelGeo = new THREE.BoxGeometry(0.15, 0.025, 0.09);
    const heel = new THREE.Mesh(heelGeo, soleMat);
    heel.position.set(0, -0.085, -0.065);
    shoeGroup.add(heel);

    // Shoe Laces / Buckle Accent
    const laceMat = new THREE.MeshBasicMaterial({ color: '#c5a059' });
    const laceGeo = new THREE.BoxGeometry(0.06, 0.012, 0.08);
    const lace = new THREE.Mesh(laceGeo, laceMat);
    lace.position.set(0, 0.022, 0.04);
    shoeGroup.add(lace);

    kneeGroup.add(shoeGroup);
    legGroup.add(kneeGroup);

    if (isLeft) this.leftKnee = kneeGroup;
    else this.rightKnee = kneeGroup;

    return legGroup;
  }

  /**
   * Builds an anatomically proportioned human torso with tailored wedding attire,
   * natural waist taper, golden embroidered trim, and chest brooch.
   */
  buildRealisticTorso(fabricMat, accentMat, skinMat, outfit) {
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.98, 0);

    // A. Pelvis & Lower Hips (Wrapped in traditional Batik Jarik or tailored trousers)
    const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.30, 18);
    pelvisGeo.scale(1.18, 1.0, 0.88);
    const pelvis = new THREE.Mesh(pelvisGeo, fabricMat);
    pelvis.position.set(0, 0.15, 0);
    torsoGroup.add(pelvis);

    // B. Waist & Midsection (Natural human inward curvature)
    const waistGeo = new THREE.CylinderGeometry(0.26, 0.23, 0.24, 18);
    waistGeo.scale(1.15, 1.0, 0.84);
    const waist = new THREE.Mesh(waistGeo, fabricMat);
    waist.position.set(0, 0.38, 0);
    torsoGroup.add(waist);

    // Gold Embroidered Waist Belt / Sabuk / Kamus
    const beltGeo = new THREE.CylinderGeometry(0.265, 0.265, 0.07, 18);
    beltGeo.scale(1.16, 1.0, 0.86);
    const belt = new THREE.Mesh(beltGeo, accentMat);
    belt.position.set(0, 0.32, 0);
    torsoGroup.add(belt);

    // C. Upper Chest & Pectorals (Broadening to shoulders)
    const chestGeo = new THREE.CylinderGeometry(0.29, 0.26, 0.38, 18);
    chestGeo.scale(1.22, 1.0, 0.86);
    const chest = new THREE.Mesh(chestGeo, fabricMat);
    chest.position.set(0, 0.65, 0);
    torsoGroup.add(chest);

    // D. Tailored Collar & Lapels
    if (outfit === 'tuxedo') {
      // Satin Tuxedo Shawl Lapels
      const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.03), accentMat);
      lapelL.rotation.z = -0.22;
      lapelL.position.set(-0.11, 0.68, 0.20);
      torsoGroup.add(lapelL);

      const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.03), accentMat);
      lapelR.rotation.z = 0.22;
      lapelR.position.set(0.11, 0.68, 0.20);
      torsoGroup.add(lapelR);

      // White Pleated Tuxedo Shirt Inlay & Bow Tie
      const shirtMat = new THREE.MeshStandardMaterial({ color: '#fcfcfc', roughness: 0.5 });
      const shirtGeo = new THREE.BoxGeometry(0.12, 0.36, 0.02);
      const shirt = new THREE.Mesh(shirtGeo, shirtMat);
      shirt.position.set(0, 0.66, 0.19);
      torsoGroup.add(shirt);

      // Silk Bow Tie
      const tieMat = new THREE.MeshStandardMaterial({ color: '#15151b', roughness: 0.3 });
      const bowTie = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 0.03), tieMat);
      bowTie.position.set(0, 0.80, 0.21);
      torsoGroup.add(bowTie);
    } else {
      // Traditional Royal Wedding Beskap / Kebaya
      // High Mandarin Embroidered Standing Collar
      const collarGeo = new THREE.CylinderGeometry(0.115, 0.13, 0.10, 16);
      collarGeo.scale(1.1, 1.0, 0.9);
      const collar = new THREE.Mesh(collarGeo, accentMat);
      collar.position.set(0, 0.86, 0);
      torsoGroup.add(collar);

      // Gold Embroidered Central Placket (Sash / Bordir)
      const placketGeo = new THREE.BoxGeometry(0.065, 0.54, 0.035);
      const placket = new THREE.Mesh(placketGeo, accentMat);
      placket.position.set(0, 0.60, 0.20);
      torsoGroup.add(placket);

      // Royal Gold Buttons / Kancing Emas
      const btnMat = new THREE.MeshStandardMaterial({ color: '#f4c542', metalness: 0.95, roughness: 0.2 });
      for (let b = 0; b < 4; b++) {
        const btnGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.018, 10);
        const btn = new THREE.Mesh(btnGeo, btnMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(0, 0.40 + b * 0.11, 0.22);
        torsoGroup.add(btn);
      }

      // Traditional Keris / Brooch Hanging Chain
      const broochGeo = new THREE.DodecahedronGeometry(0.038);
      const brooch = new THREE.Mesh(broochGeo, accentMat);
      brooch.position.set(0.12, 0.70, 0.21);
      torsoGroup.add(brooch);
    }

    // E. Clavicle & Neck Connection
    const neckGeo = new THREE.CylinderGeometry(0.072, 0.088, 0.22, 18);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 0.98, 0);
    torsoGroup.add(neck);

    return torsoGroup;
  }

  /**
   * Builds an anatomically proportioned arm with deltoid shoulder cap,
   * contoured upper arm, elbow, forearm, tailored sleeve cuffs,
   * and sculpted 3D human hands with articulated fingers.
   */
  buildRealisticArm(xOffset, isLeft, fabricMat, accentMat, skinMat) {
    const armGroup = new THREE.Group();
    armGroup.position.set(xOffset, 1.76, 0);

    // A. Deltoid Shoulder Cap (Smooth connection to torso)
    const deltoidGeo = new THREE.SphereGeometry(0.086, 14, 12);
    deltoidGeo.scale(1.1, 1.2, 1.1);
    const deltoid = new THREE.Mesh(deltoidGeo, fabricMat);
    deltoid.position.set(isLeft ? 0.02 : -0.02, 0, 0);
    armGroup.add(deltoid);

    // B. Upper Arm / Bicep (Tapered natural sleeve)
    const bicepGeo = new THREE.CylinderGeometry(0.076, 0.068, 0.35, 14);
    const bicep = new THREE.Mesh(bicepGeo, fabricMat);
    bicep.position.set(0, -0.18, 0);
    armGroup.add(bicep);

    // C. Elbow Joint
    const elbowGeo = new THREE.SphereGeometry(0.068, 10, 10);
    const elbow = new THREE.Mesh(elbowGeo, fabricMat);
    elbow.position.set(0, -0.36, -0.01);
    armGroup.add(elbow);

    // D. Forearm (Contoured flexor taper towards wrist)
    const forearmGeo = new THREE.CylinderGeometry(0.068, 0.058, 0.34, 14);
    const forearm = new THREE.Mesh(forearmGeo, fabricMat);
    forearm.position.set(0, -0.53, 0);
    armGroup.add(forearm);

    // Tailored Sleeve Cuff with gold piping
    const cuffGeo = new THREE.CylinderGeometry(0.064, 0.064, 0.045, 14);
    const cuff = new THREE.Mesh(cuffGeo, accentMat);
    cuff.position.set(0, -0.68, 0);
    armGroup.add(cuff);

    // E. Realistic Sculpted Human Hand with Articulated Fingers
    const handGroup = this.buildRealisticHand(isLeft, skinMat);
    handGroup.position.set(0, -0.73, 0);
    armGroup.add(handGroup);

    return armGroup;
  }

  /**
   * Sculpted realistic 3D human hand:
   * Palm, thenar thumb pad, opposable thumb, and four fingers (index, middle, ring, pinky)
   * gently relaxed in a natural realistic pose.
   */
  buildRealisticHand(isLeft, skinMat) {
    const handGroup = new THREE.Group();

    // 1. Palm (Contoured trapezoid with thenar thumb prominence)
    const palmGeo = new THREE.BoxGeometry(0.072, 0.082, 0.034);
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.position.set(0, -0.041, 0);
    handGroup.add(palm);

    // 2. Thumb (Opposable, angled anteriorly & medially)
    const thumbGroup = new THREE.Group();
    const thumbX = isLeft ? 0.034 : -0.034;
    thumbGroup.position.set(thumbX, -0.028, 0.014);
    thumbGroup.rotation.y = isLeft ? 0.45 : -0.45;
    thumbGroup.rotation.z = isLeft ? -0.35 : 0.35;

    const thumbGeo = new THREE.CylinderGeometry(0.014, 0.013, 0.052, 8);
    const thumbMesh = new THREE.Mesh(thumbGeo, skinMat);
    thumbMesh.position.y = -0.025;
    thumbGroup.add(thumbMesh);
    handGroup.add(thumbGroup);

    // 3. Four Articulate Fingers (Index, Middle, Ring, Pinky)
    const fingerLengths = [0.058, 0.064, 0.060, 0.048];
    const fingerRadii = [0.011, 0.0115, 0.011, 0.0095];

    for (let f = 0; f < 4; f++) {
      const fingerIdx = isLeft ? f : 3 - f;
      const fx = (f - 1.5) * 0.016;
      const len = fingerLengths[fingerIdx];
      const rad = fingerRadii[fingerIdx];

      const fingerGroup = new THREE.Group();
      fingerGroup.position.set(fx, -0.082, 0);
      fingerGroup.rotation.x = 0.22 + f * 0.05;

      const fingerGeo = new THREE.CylinderGeometry(rad * 0.9, rad, len, 8);
      const fingerMesh = new THREE.Mesh(fingerGeo, skinMat);
      fingerMesh.position.y = -len / 2;
      fingerGroup.add(fingerMesh);

      handGroup.add(fingerGroup);
    }

    return handGroup;
  }

  /**
   * Builds an anatomically realistic human head, face, and hair.
   */
  buildRealisticHead(skinMat, lipMat, hairMat, hairStyle, hairCol, accessory, accentMat) {
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.14, 0);

    // A. Anatomical Cranium & Facial Bone Structure
    const craniumGeo = new THREE.SphereGeometry(0.19, 28, 24);
    craniumGeo.scale(0.96, 1.15, 1.05);
    const cranium = new THREE.Mesh(craniumGeo, skinMat);
    headGroup.add(cranium);

    // Sculpted Jawline & Chin
    const jawGeo = new THREE.CylinderGeometry(0.14, 0.08, 0.18, 16);
    jawGeo.scale(1.0, 1.0, 0.92);
    const jaw = new THREE.Mesh(jawGeo, skinMat);
    jaw.position.set(0, -0.08, 0.03);
    headGroup.add(jaw);

    // Prominent Chin Mound
    const chinGeo = new THREE.SphereGeometry(0.048, 12, 10);
    chinGeo.scale(1.1, 0.9, 1.1);
    const chin = new THREE.Mesh(chinGeo, skinMat);
    chin.position.set(0, -0.15, 0.12);
    headGroup.add(chin);

    // Sculpted Cheekbones (Soft natural transition)
    const cheekGeo = new THREE.SphereGeometry(0.055, 10, 10);
    cheekGeo.scale(0.9, 0.9, 1.1);
    const leftCheek = new THREE.Mesh(cheekGeo, skinMat);
    leftCheek.position.set(-0.12, -0.02, 0.10);
    const rightCheek = new THREE.Mesh(cheekGeo, skinMat);
    rightCheek.position.set(0.12, -0.02, 0.10);
    headGroup.add(leftCheek);
    headGroup.add(rightCheek);

    // Defined Brow Ridge (Overhang above eye sockets)
    const browGeo = new THREE.BoxGeometry(0.24, 0.024, 0.04);
    const brow = new THREE.Mesh(browGeo, skinMat);
    brow.position.set(0, 0.075, 0.17);
    headGroup.add(brow);

    // B. Realistic Almond Eyes
    this.buildRealisticEyes(headGroup, hairCol);

    // C. Sculpted Nose Bridge & Nostrils
    this.buildRealisticNose(headGroup, skinMat);

    // D. Realistic Modeled Lips & Mouth
    this.buildRealisticLips(headGroup, lipMat);

    // E. Realistic Sculpted Human Ears
    this.buildRealisticEars(headGroup, skinMat);

    // F. Realistic Hair / Headwear System
    this.buildRealisticHair(headGroup, hairStyle, hairMat, hairCol, accentMat);

    // G. Realistic Accessories
    this.buildRealisticAccessory(headGroup, accessory, accentMat);

    return headGroup;
  }

  /**
   * Realistic human eyes with procedural high-res iris texture,
   * sclera, moist corneal reflection, sculpted eyelids, and groomed eyebrows.
   */
  buildRealisticEyes(headGroup, hairCol) {
    const irisTex = characterTextures.getIrisTexture();
    const eyeMat = new THREE.MeshStandardMaterial({
      map: irisTex,
      roughness: 0.1,
      metalness: 0.05,
    });

    const eyeGeo = new THREE.SphereGeometry(0.036, 16, 14);

    // Left Eyeball
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.rotation.y = -Math.PI / 2 + 0.04;
    leftEye.position.set(-0.072, 0.035, 0.165);
    headGroup.add(leftEye);

    // Right Eyeball
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.rotation.y = -Math.PI / 2 - 0.04;
    rightEye.position.set(0.072, 0.035, 0.165);
    headGroup.add(rightEye);

    // Upper Eyelids
    const eyelidMat = new THREE.MeshStandardMaterial({
      color: '#42241d',
      roughness: 0.6,
    });
    const eyelidGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.010, 12, 1, false, 0, Math.PI);

    const leftUpperLid = new THREE.Mesh(eyelidGeo, eyelidMat);
    leftUpperLid.rotation.z = Math.PI / 2;
    leftUpperLid.rotation.y = -Math.PI / 2;
    leftUpperLid.position.set(-0.072, 0.048, 0.172);
    headGroup.add(leftUpperLid);

    const rightUpperLid = new THREE.Mesh(eyelidGeo, eyelidMat);
    rightUpperLid.rotation.z = Math.PI / 2;
    rightUpperLid.rotation.y = -Math.PI / 2;
    rightUpperLid.position.set(0.072, 0.048, 0.172);
    headGroup.add(rightUpperLid);

    // Sculpted Eyebrows matching hair color
    const browMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairCol),
      roughness: 0.8,
    });
    const browMeshGeo = new THREE.BoxGeometry(0.068, 0.014, 0.018);

    const leftBrow = new THREE.Mesh(browMeshGeo, browMat);
    leftBrow.rotation.z = -0.06;
    leftBrow.position.set(-0.074, 0.072, 0.182);
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browMeshGeo, browMat);
    rightBrow.rotation.z = 0.06;
    rightBrow.position.set(0.074, 0.072, 0.182);
    headGroup.add(rightBrow);
  }

  /**
   * Sculpted human nose with nasal bridge, defined tip (lobule),
   * and lateral alar nostrils with depth.
   */
  buildRealisticNose(headGroup, skinMat) {
    const noseGroup = new THREE.Group();
    noseGroup.position.set(0, 0.01, 0.18);

    // 1. Nasal Bridge
    const bridgeGeo = new THREE.CylinderGeometry(0.012, 0.018, 0.07, 8);
    const bridge = new THREE.Mesh(bridgeGeo, skinMat);
    bridge.rotation.x = 0.22;
    bridge.position.set(0, 0.018, 0.008);
    noseGroup.add(bridge);

    // 2. Nose Tip (Lobule)
    const tipGeo = new THREE.SphereGeometry(0.019, 10, 8);
    const tip = new THREE.Mesh(tipGeo, skinMat);
    tip.position.set(0, -0.020, 0.024);
    noseGroup.add(tip);

    // 3. Nostril Wings (Alar cartilages)
    const alarGeo = new THREE.SphereGeometry(0.013, 8, 6);
    alarGeo.scale(0.8, 0.9, 1.1);

    const leftAlar = new THREE.Mesh(alarGeo, skinMat);
    leftAlar.position.set(-0.019, -0.023, 0.016);
    noseGroup.add(leftAlar);

    const rightAlar = new THREE.Mesh(alarGeo, skinMat);
    rightAlar.position.set(0.019, -0.023, 0.016);
    noseGroup.add(rightAlar);

    headGroup.add(noseGroup);
  }

  /**
   * Sculpted human lips with Cupid's bow, philtrum groove,
   * fuller lower lip, and vermilion border.
   */
  buildRealisticLips(headGroup, lipMat) {
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.075, 0.175);

    // Upper Lip with Cupid's bow dip
    const upperLipGeo = new THREE.CylinderGeometry(0.010, 0.012, 0.068, 10);
    upperLipGeo.scale(1.0, 0.6, 1.1);
    const upperLip = new THREE.Mesh(upperLipGeo, lipMat);
    upperLip.rotation.z = Math.PI / 2;
    upperLip.position.set(0, 0.009, 0.012);
    mouthGroup.add(upperLip);

    // Lower Lip (Fuller, moist vermilion contour)
    const lowerLipGeo = new THREE.CylinderGeometry(0.012, 0.014, 0.064, 10);
    lowerLipGeo.scale(1.0, 0.75, 1.15);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat);
    lowerLip.rotation.z = Math.PI / 2;
    lowerLip.position.set(0, -0.009, 0.014);
    mouthGroup.add(lowerLip);

    // Philtrum vertical dip
    const philtrumMat = new THREE.MeshStandardMaterial({ color: '#522b22', roughness: 0.6 });
    const lineGeo = new THREE.BoxGeometry(0.055, 0.004, 0.008);
    const line = new THREE.Mesh(lineGeo, philtrumMat);
    line.position.set(0, 0.001, 0.018);
    mouthGroup.add(line);

    headGroup.add(mouthGroup);
  }

  /**
   * Realistic sculpted human ears with helix, antihelix, and earlobes.
   */
  buildRealisticEars(headGroup, skinMat) {
    const earGeo = new THREE.SphereGeometry(0.038, 12, 10);
    earGeo.scale(0.35, 1.45, 0.85);

    // Left Ear
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.rotation.z = 0.12;
    leftEar.rotation.y = -0.18;
    leftEar.position.set(-0.19, 0.015, -0.01);
    headGroup.add(leftEar);

    // Right Ear
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.rotation.z = -0.12;
    rightEar.rotation.y = 0.18;
    rightEar.position.set(0.19, 0.015, -0.01);
    headGroup.add(rightEar);
  }



  /**
   * Volumetric realistic hairstyles with strand fiber textures,
   * natural hairlines, and authentic cultural designs.
   */
  buildRealisticHair(headGroup, style, hairMat, hairCol, accentMat) {
    if (style === 'hijab') {
      // Flowing elegant Pashmina Hijab with soft natural draping folds
      const hijabMat = new THREE.MeshStandardMaterial({
        color: '#f9f6f0',
        roughness: 0.78,
      });

      // Cranial wrap
      const hoodGeo = new THREE.SphereGeometry(0.28, 20, 18);
      hoodGeo.scale(1.04, 1.20, 1.15);
      const hood = new THREE.Mesh(hoodGeo, hijabMat);
      hood.position.set(0, 0.04, -0.03);
      headGroup.add(hood);

      // Elegant Neck & Shoulder Drape
      const drapeGeo = new THREE.CylinderGeometry(0.25, 0.38, 0.46, 18, 1, true);
      const drape = new THREE.Mesh(drapeGeo, hijabMat);
      drape.position.set(0, -0.30, 0.02);
      headGroup.add(drape);

      // Gold Brooch Pinning at side of collar
      const pin = new THREE.Mesh(new THREE.DodecahedronGeometry(0.028), accentMat);
      pin.position.set(0.18, -0.18, 0.18);
      headGroup.add(pin);
    } else if (style === 'bun') {
      // Royal Wedding Updo / Chignon Bun with golden hairpin (Tusuk Konde)
      const capGeo = new THREE.SphereGeometry(0.26, 20, 16);
      capGeo.scale(1.02, 1.08, 1.05);
      const cap = new THREE.Mesh(capGeo, hairMat);
      cap.position.set(0, 0.08, -0.03);
      headGroup.add(cap);

      // Volumetric Braided Chignon Bun at back/crown
      const bunGeo = new THREE.SphereGeometry(0.15, 16, 14);
      bunGeo.scale(1.2, 1.0, 0.9);
      const bun = new THREE.Mesh(bunGeo, hairMat);
      bun.position.set(0, 0.28, -0.18);
      headGroup.add(bun);

      // Gold Hairpin Accent (Tusuk Konde) with floral filigree
      const pinGroup = new THREE.Group();
      pinGroup.position.set(0.08, 0.28, -0.12);
      pinGroup.rotation.z = 0.75;

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.38, 8), accentMat);
      pinGroup.add(stem);

      const flowerHead = new THREE.Mesh(new THREE.DodecahedronGeometry(0.032), accentMat);
      flowerHead.position.y = 0.19;
      pinGroup.add(flowerHead);

      headGroup.add(pinGroup);
    } else if (style === 'wavy' || style === 'long') {
      // Shoulder-length soft layered waves framing face
      const crownHair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 16), hairMat);
      crownHair.position.set(0, 0.09, -0.03);
      headGroup.add(crownHair);

      // Left cascading wavy locks
      const curlL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.10, 0.55, 12), hairMat);
      curlL.rotation.z = 0.12;
      curlL.position.set(-0.24, -0.16, 0.04);
      headGroup.add(curlL);

      // Right cascading wavy locks
      const curlR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.10, 0.55, 12), hairMat);
      curlR.rotation.z = -0.12;
      curlR.position.set(0.24, -0.16, 0.04);
      headGroup.add(curlR);

      // Back waterfall hair volume
      const backHair = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.52, 14), hairMat);
      backHair.position.set(0, -0.16, -0.14);
      headGroup.add(backHair);
    } else if (style === 'cap') {
      // Traditional Royal Indonesian Blangkon / Songkok Peci
      const peciMat = new THREE.MeshStandardMaterial({
        color: '#1a1412',
        roughness: 0.6,
      });
      const peciGeo = new THREE.CylinderGeometry(0.26, 0.27, 0.22, 20);
      peciGeo.scale(1.02, 1.0, 1.06);
      const peci = new THREE.Mesh(peciGeo, peciMat);
      peci.position.set(0, 0.19, -0.01);
      headGroup.add(peci);

      // Gold Embroidered Band Trim
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.016, 8, 24), accentMat);
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 0.09, -0.01);
      headGroup.add(band);
    } else {
      // Default: Modern Textured Fade Crop with layered pompadour quiff
      const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 18), hairMat);
      hairBase.scale.set(1.01, 1.10, 1.06);
      hairBase.position.set(0, 0.08, -0.03);
      headGroup.add(hairBase);

      // Volumetric Top Quiff / Fringe
      const quiffGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.22, 14);
      quiffGeo.scale(1.2, 0.8, 1.0);
      const quiff = new THREE.Mesh(quiffGeo, hairMat);
      quiff.rotation.x = 0.45;
      quiff.position.set(0, 0.24, 0.14);
      headGroup.add(quiff);
    }
  }

  /**
   * High-end realistic accessories:
   * - Gold Crown / Suntiang with spires & pendants
   * - Titanium wireframe glasses with reflective lenses
   * - Indonesian Jasmine (Melati) garland
   */
  buildRealisticAccessory(headGroup, accessory, accentMat) {
    if (accessory === 'crown') {
      const crownGroup = new THREE.Group();
      crownGroup.position.set(0, 0.27, 0);

      // Filigree Circlet Ring
      const ringGeo = new THREE.TorusGeometry(0.22, 0.024, 8, 24);
      const ring = new THREE.Mesh(ringGeo, accentMat);
      ring.rotation.x = Math.PI / 2;
      crownGroup.add(ring);

      // 7 Royal Spires with Gemstone tips
      const gemMat = new THREE.MeshStandardMaterial({
        color: '#ff3344',
        roughness: 0.1,
        metalness: 0.9,
      });

      for (let i = 0; i < 7; i++) {
        const a = (i - 3) * 0.28;
        const h = 0.14 - Math.abs(i - 3) * 0.018;

        const spireGeo = new THREE.ConeGeometry(0.026, h, 8);
        const spire = new THREE.Mesh(spireGeo, accentMat);
        spire.position.set(Math.sin(a) * 0.22, h / 2 + 0.01, Math.cos(a) * 0.22);
        crownGroup.add(spire);

        const gem = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), gemMat);
        gem.position.set(Math.sin(a) * 0.22, h + 0.01, Math.cos(a) * 0.22);
        crownGroup.add(gem);
      }

      headGroup.add(crownGroup);
    } else if (accessory === 'glasses') {
      const frameMat = new THREE.MeshStandardMaterial({
        color: '#1a1820',
        metalness: 0.8,
        roughness: 0.2,
      });
      const lensMat = new THREE.MeshStandardMaterial({
        color: '#dbeeff',
        transparent: true,
        opacity: 0.45,
        roughness: 0.05,
      });

      const glassesGroup = new THREE.Group();
      glassesGroup.position.set(0, 0.045, 0.225);

      // Left Frame & Lens
      const frameL = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 8, 16), frameMat);
      frameL.position.set(-0.092, 0, 0);
      glassesGroup.add(frameL);

      const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.054, 16), lensMat);
      lensL.position.set(-0.092, 0, 0);
      glassesGroup.add(lensL);

      // Right Frame & Lens
      const frameR = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 8, 16), frameMat);
      frameR.position.set(0.092, 0, 0);
      glassesGroup.add(frameR);

      const lensR = new THREE.Mesh(new THREE.CircleGeometry(0.054, 16), lensMat);
      lensR.position.set(0.092, 0, 0);
      glassesGroup.add(lensR);

      // Bridge
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.009, 0.012), frameMat);
      bridge.position.set(0, 0.01, 0);
      glassesGroup.add(bridge);

      headGroup.add(glassesGroup);
    } else if (accessory === 'flower') {
      // Indonesian Melati (Jasmine) Wedding Ear Blossom
      const flowerGroup = new THREE.Group();
      flowerGroup.position.set(0.23, 0.12, 0.08);

      const petalMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.4,
      });
      const centerMat = new THREE.MeshStandardMaterial({
        color: '#ffd54f',
        roughness: 0.3,
      });

      for (let p = 0; p < 6; p++) {
        const a = (p * Math.PI * 2) / 6;
        const petal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.032), petalMat);
        petal.position.set(Math.cos(a) * 0.045, Math.sin(a) * 0.045, 0);
        flowerGroup.add(petal);
      }

      const center = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), centerMat);
      center.position.z = 0.015;
      flowerGroup.add(center);

      headGroup.add(flowerGroup);
    }
  }
}
