import * as THREE from 'three';
import { mergeSafeGeometries, createParametricLoftGeometry } from './StylizedGeometry.js';
import {
  STYLIZED_V3_PROPORTIONS,
  computeV3FaceTint,
  computeV3HeadVertex,
  sampleHijabAperturePoint,
  sampleHijabHoodPoint,
  sampleScalpHairlinePoint
} from './StylizedMathV3.js';

/**
 * Scales a non-origin geometry around its own bounding-box center so world/local offsets remain intact.
 */
function scaleGeometryInPlace(geo, sx, sy, sz) {
  geo.computeBoundingBox();
  const center = new THREE.Vector3();
  geo.boundingBox.getCenter(center);
  geo.translate(-center.x, -center.y, -center.z);
  geo.scale(sx, sy, sz);
  geo.translate(center.x, center.y, center.z);
  return geo;
}

/**
 * Builds a smooth open-face parametric surface mesh from grid evaluations evalFn(uNorm, vNorm).
 */
function createParametricSurfaceGrid(uCount, vCount, evalFn, { flipWinding = false } = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const stride = uCount + 1;

  for (let iv = 0; iv <= vCount; iv++) {
    const v = iv / vCount;
    for (let iu = 0; iu <= uCount; iu++) {
      const u = iu / uCount;
      const pt = evalFn(u, v);
      positions.push(pt.x, pt.y, pt.z);
      uvs.push(u, v);
    }
  }

  for (let iv = 0; iv < vCount; iv++) {
    const row0 = iv * stride;
    const row1 = (iv + 1) * stride;
    for (let iu = 0; iu < uCount; iu++) {
      const a = row0 + iu;
      const b = row0 + iu + 1;
      const c = row1 + iu;
      const d = row1 + iu + 1;
      if (flipWinding) {
        indices.push(a, b, c);
        indices.push(b, d, c);
      } else {
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Projects any (x, y) on the anterior face cleanly onto the sculpted head surface + offsetZ.
 */
function projectOnFrontFace(x, y, isFeminine, offsetZ = 0.004) {
  const rx = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_X * (isFeminine ? 0.96 : 1.0);
  const ry = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Y;
  const nx = Math.max(-0.92, Math.min(0.92, x / rx));
  const ny = Math.max(-0.92, Math.min(0.92, y / ry));
  const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
  const pt = computeV3HeadVertex(nx, ny, nz, isFeminine);
  return new THREE.Vector3(pt.x, pt.y, pt.z + offsetZ);
}

/**
 * Builds the continuous sculpted V3 Torso + Neck with broad anatomical clavicle & trapezius slope.
 */
export function buildV3TorsoGroup(fabricMat, lowerFabricMat, accentMat, skinMat, outfit, profile, hairStyle = 'short') {
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, STYLIZED_V3_PROPORTIONS.HIP_PIVOT_Y, 0);

  const isFem = profile.isFeminine;
  const shoulderLocalY = profile.shoulderPivotY - STYLIZED_V3_PROPORTIONS.HIP_PIVOT_Y;
  const { chestRx, chestRz, waistRx, waistRz, hipRx, hipRz, neckRx, neckRz } = profile;
  const shoulderTorsoRx = Math.max(chestRx, profile.shoulderHalfWidth - 0.016);

  // 1. Continuous Upper Torso Loft (waist -> ribcage -> smooth deltoid shoulder transition -> neck collar)
  const upperRings = [
    { y: 0.22, rx: waistRx + 0.014, rz: waistRz + 0.008, squareness: 0.90 },
    { y: 0.32, rx: waistRx, rz: waistRz, squareness: 0.91, backIndent: 0.008 },
    { y: 0.44, rx: waistRx + (chestRx - waistRx) * 0.56, rz: waistRz + 0.012, frontBulge: isFem ? 0.018 : 0.009, backIndent: 0.010 },
    { y: 0.56, rx: chestRx, rz: chestRz, frontBulge: isFem ? 0.022 : 0.014, backIndent: 0.008, squareness: 0.88 },
    { y: shoulderLocalY + 0.015, rx: shoulderTorsoRx, rz: chestRz * 0.92, frontBulge: 0.007, squareness: 0.89 },
    { y: shoulderLocalY + 0.058, rx: shoulderTorsoRx * 0.82, rz: chestRz * 0.78, squareness: 0.91 },
    { y: shoulderLocalY + 0.11, rx: neckRx + 0.032, rz: neckRz + 0.022, squareness: 0.94 },
    { y: shoulderLocalY + 0.15, rx: neckRx + 0.012, rz: neckRz + 0.010, squareness: 0.96 }
  ];

  const fabricGeos = [createParametricLoftGeometry(upperRings, 22)];
  const lowerGeos = [];
  const accentGeos = [];

  // 2. Pelvis & Lower Garment Overlap (extends cleanly down to y=-0.075 to eliminate puppet-hip ledges)
  if (outfit === 'kebaya_putih') {
    const jarikRings = [
      { y: -0.075, rx: hipRx * 0.92, rz: hipRz * 0.94, squareness: 0.90 },
      { y: 0.05, rx: hipRx + 0.004, rz: hipRz + 0.004, squareness: 0.90 },
      { y: 0.22, rx: waistRx + 0.022, rz: waistRz + 0.014, squareness: 0.90 }
    ];
    lowerGeos.push(createParametricLoftGeometry(jarikRings, 22));

    const peplumRings = [
      { y: -0.01, rx: hipRx + 0.024, rz: hipRz + 0.018, squareness: 0.89 },
      { y: 0.14, rx: hipRx + 0.006, rz: hipRz + 0.006, squareness: 0.89 },
      { y: 0.30, rx: waistRx + 0.008, rz: waistRz + 0.006, squareness: 0.91 }
    ];
    fabricGeos.push(createParametricLoftGeometry(peplumRings, 22, { capBottom: false }));
  } else if (outfit === 'beskap_hitam') {
    const jacketHemRings = [
      { y: 0.06, rx: hipRx + 0.014, rz: hipRz + 0.010, squareness: 0.89 },
      { y: 0.18, rx: hipRx + 0.006, rz: hipRz + 0.005, squareness: 0.89 },
      { y: 0.28, rx: waistRx + 0.012, rz: waistRz + 0.008, squareness: 0.91 }
    ];
    fabricGeos.push(createParametricLoftGeometry(jacketHemRings, 22));

    const pelvisRings = [
      { y: -0.075, rx: hipRx * 0.90, rz: hipRz * 0.92, squareness: 0.90 },
      { y: 0.08, rx: hipRx, rz: hipRz, squareness: 0.90 }
    ];
    lowerGeos.push(createParametricLoftGeometry(pelvisRings, 22));
  } else if (outfit === 'dress') {
    const skirtFlareRings = [
      { y: -0.075, rx: hipRx + 0.048, rz: hipRz + 0.036, squareness: 0.90 },
      { y: 0.10, rx: hipRx + 0.018, rz: hipRz + 0.014, squareness: 0.90 },
      { y: 0.28, rx: waistRx + 0.008, rz: waistRz + 0.006, squareness: 0.91 }
    ];
    fabricGeos.push(createParametricLoftGeometry(skirtFlareRings, 22, { capBottom: false }));

    const pelvisRings = [
      { y: -0.075, rx: hipRx * 0.92, rz: hipRz * 0.92, squareness: 0.90 },
      { y: 0.10, rx: hipRx, rz: hipRz, squareness: 0.90 }
    ];
    lowerGeos.push(createParametricLoftGeometry(pelvisRings, 22));
  } else {
    const pelvisRings = [
      { y: -0.075, rx: hipRx * 0.91, rz: hipRz * 0.92, squareness: 0.90 },
      { y: 0.09, rx: hipRx + 0.004, rz: hipRz + 0.004, squareness: 0.90 },
      { y: 0.25, rx: waistRx + 0.016, rz: waistRz + 0.010, squareness: 0.91 }
    ];
    lowerGeos.push(createParametricLoftGeometry(pelvisRings, 22));
  }

  // 3. Tailored Outfit Details (centered scaling preserves front-surface Z alignment!)
  const collarBaseY = shoulderLocalY + 0.13;
  const chestFrontZ = chestRz + (isFem ? 0.022 : 0.014);

  if (outfit === 'beskap_hitam') {
    const collarGeo = createParametricLoftGeometry([
      { y: collarBaseY, rx: neckRx + 0.015, rz: neckRz + 0.014, squareness: 0.96 },
      { y: collarBaseY + 0.068, rx: neckRx + 0.010, rz: neckRz + 0.009, squareness: 0.96 }
    ], 22, { capTop: false });
    fabricGeos.push(collarGeo);

    const rim = new THREE.TorusGeometry(neckRx + 0.010, 0.0046, 8, 24);
    rim.rotateX(Math.PI / 2);
    rim.scale(1.04, 1, 0.96);
    rim.translate(0, collarBaseY + 0.0685, 0);
    accentGeos.push(rim);

    const flapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.038, 0.32, waistRz + 0.008),
      new THREE.Vector3(-0.012, 0.48, chestFrontZ - 0.001),
      new THREE.Vector3(0.020, 0.61, chestFrontZ - 0.001),
      new THREE.Vector3(0.044, collarBaseY - 0.025, neckRz + 0.022)
    ]);
    const flapGeo = scaleGeometryInPlace(new THREE.TubeGeometry(flapCurve, 14, 0.012, 8, false), 1.4, 1.0, 0.32);
    fabricGeos.push(flapGeo);

    for (let b = 0; b < 4; b++) {
      const pt = flapCurve.getPoint(0.16 + (b / 3) * 0.64);
      const btn = new THREE.CylinderGeometry(0.0082, 0.0082, 0.008, 10);
      btn.rotateX(Math.PI / 2);
      btn.translate(pt.x + 0.008, pt.y, pt.z + 0.006);
      accentGeos.push(btn);
    }

    const chainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.018, 0.60, chestFrontZ + 0.004),
      new THREE.Vector3(0.056, 0.54, chestFrontZ + 0.006),
      new THREE.Vector3(0.102, 0.59, chestFrontZ - 0.006)
    ]);
    accentGeos.push(new THREE.TubeGeometry(chainCurve, 14, 0.0036, 6, false));

    const emblem = new THREE.OctahedronGeometry(0.014, 1);
    emblem.scale(1.0, 1.2, 0.45);
    emblem.translate(0.104, 0.60, chestFrontZ - 0.006);
    accentGeos.push(emblem);
  } else if (outfit === 'kebaya_putih') {
    const kutuCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.30, waistRz + 0.013),
      new THREE.Vector3(0, 0.46, chestFrontZ + 0.003),
      new THREE.Vector3(0, 0.61, chestFrontZ + 0.002)
    ]);
    const kutuGeo = scaleGeometryInPlace(new THREE.TubeGeometry(kutuCurve, 10, 0.028, 8, false), 1.25, 1.0, 0.28);
    fabricGeos.push(kutuGeo);

    if (hairStyle !== 'hijab') {
      [-1, 1].forEach((side) => {
        const vCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.018, 0.61, chestFrontZ + 0.006),
          new THREE.Vector3(side * 0.048, 0.69, chestFrontZ - 0.006),
          new THREE.Vector3(side * 0.058, collarBaseY + 0.008, neckRz + 0.024)
        ]);
        accentGeos.push(new THREE.TubeGeometry(vCurve, 8, 0.0042, 6, false));
      });
    }

    for (let k = 0; k < 3; k++) {
      const bros = new THREE.OctahedronGeometry(0.013 - k * 0.002, 1);
      bros.scale(1.1, 1.1, 0.45);
      bros.translate(0, 0.60 - k * 0.060, chestFrontZ + 0.010 - k * 0.002);
      accentGeos.push(bros);
    }
  } else if (outfit === 'tuxedo') {
    // Crisp white dress shirt V-insert following chest -> clavicle -> collar contour cleanly
    const shirtMesh = new THREE.Mesh(
      createParametricLoftGeometry([
        { y: 0.44, rx: 0.009, rz: 0.012, offsetZ: chestFrontZ - 0.004 },
        { y: 0.56, rx: 0.028, rz: 0.015, offsetZ: chestFrontZ - 0.002 },
        { y: shoulderLocalY + 0.015, rx: 0.042, rz: 0.018, offsetZ: chestRz * 0.92 + 0.001 },
        { y: collarBaseY - 0.01, rx: 0.040, rz: 0.020, offsetZ: neckRz + 0.010 }
      ], 14),
      new THREE.MeshStandardMaterial({ color: '#f7f7f9', roughness: 0.52 })
    );
    torsoGroup.add(shirtMesh);

    const satinMat = new THREE.MeshStandardMaterial({ color: '#14151c', roughness: 0.28, metalness: 0.14 });
    const satinGeos = [];
    [-1, 1].forEach((side) => {
      const lapelCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.008, 0.435, chestFrontZ + 0.008),
        new THREE.Vector3(side * 0.038, 0.585, chestFrontZ + 0.011),
        new THREE.Vector3(side * 0.052, collarBaseY - 0.005, neckRz + 0.025)
      ]);
      satinGeos.push(scaleGeometryInPlace(new THREE.TubeGeometry(lapelCurve, 10, 0.015, 6, false), 1.35, 1.0, 0.34));
    });
    // Bowtie wings + center knot
    [-1, 1].forEach((side) => {
      const wing = new THREE.ConeGeometry(0.014, 0.032, 6);
      wing.rotateZ(side * (Math.PI / 2));
      wing.scale(1.0, 0.85, 0.42);
      wing.translate(side * 0.016, collarBaseY - 0.012, neckRz + 0.030);
      satinGeos.push(wing);
    });
    const knot = new THREE.SphereGeometry(0.0085, 8, 6);
    knot.scale(0.95, 0.90, 0.65);
    knot.translate(0, collarBaseY - 0.012, neckRz + 0.032);
    satinGeos.push(knot);
    torsoGroup.add(new THREE.Mesh(mergeSafeGeometries(satinGeos), satinMat));
  } else if (outfit === 'dress') {
    if (hairStyle !== 'hijab') {
      [-1, 1].forEach((side) => {
        const neckTrim = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.59, chestFrontZ + 0.006),
          new THREE.Vector3(side * 0.046, 0.68, chestFrontZ - 0.006),
          new THREE.Vector3(side * 0.058, collarBaseY + 0.008, neckRz + 0.022)
        ]);
        accentGeos.push(new THREE.TubeGeometry(neckTrim, 9, 0.0042, 6, false));
      });
    }

    const pendant = new THREE.OctahedronGeometry(0.013, 1);
    pendant.scale(1.0, 1.25, 0.42);
    pendant.translate(0, 0.585, chestFrontZ + 0.008);
    accentGeos.push(pendant);
  } else {
    // traditional_gold, traditional_maroon
    if (hairStyle !== 'hijab') {
      const collarGeo = createParametricLoftGeometry([
        { y: collarBaseY, rx: neckRx + 0.014, rz: neckRz + 0.012 },
        { y: collarBaseY + 0.055, rx: neckRx + 0.011, rz: neckRz + 0.010 }
      ], 18);
      accentGeos.push(collarGeo);
    }

    const topPlacketY = hairStyle === 'hijab' ? 0.59 : collarBaseY - 0.01;
    const topPlacketZ = hairStyle === 'hijab' ? chestFrontZ + 0.001 : neckRz + 0.032;
    const placketCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.30, waistRz + 0.012),
      new THREE.Vector3(0, 0.48, chestFrontZ + 0.001),
      new THREE.Vector3(0, topPlacketY, topPlacketZ)
    ]);
    const placket = scaleGeometryInPlace(new THREE.TubeGeometry(placketCurve, 10, 0.013, 7, false), 1.0, 1.0, 0.32);
    accentGeos.push(placket);

    const btnCount = hairStyle === 'hijab' ? 3 : 4;
    for (let b = 0; b < btnCount; b++) {
      const pt = placketCurve.getPoint(0.22 + b * 0.24);
      const btn = new THREE.SphereGeometry(0.0070, 7, 7);
      btn.scale(1, 1, 0.5);
      btn.translate(pt.x, pt.y, pt.z + 0.006);
      accentGeos.push(btn);
    }

    const brooch = new THREE.OctahedronGeometry(0.016, 1);
    brooch.scale(1, 1.15, 0.45);
    brooch.translate(0.075, hairStyle === 'hijab' ? 0.56 : 0.62, chestFrontZ - 0.001);
    accentGeos.push(brooch);
  }

  // Subtle waist seam / sabuk
  if (outfit === 'beskap_hitam') {
    const sleekTrim = createParametricLoftGeometry([
      { y: 0.290, rx: waistRx + 0.005, rz: waistRz + 0.005, squareness: 0.91 },
      { y: 0.312, rx: waistRx + 0.004, rz: waistRz + 0.004, squareness: 0.91 }
    ], 22, { capBottom: false, capTop: false });
    accentGeos.push(sleekTrim);
  } else if (outfit !== 'kebaya_putih') {
    const beltGeo = createParametricLoftGeometry([
      { y: 0.278, rx: waistRx + 0.008, rz: waistRz + 0.007, squareness: 0.91 },
      { y: 0.322, rx: waistRx + 0.006, rz: waistRz + 0.006, squareness: 0.91 }
    ], 22, { capBottom: false, capTop: false });
    accentGeos.push(beltGeo);
  }

  if (fabricGeos.length > 0) {
    torsoGroup.add(new THREE.Mesh(mergeSafeGeometries(fabricGeos), fabricMat));
  }
  if (lowerGeos.length > 0) {
    torsoGroup.add(new THREE.Mesh(mergeSafeGeometries(lowerGeos), lowerFabricMat));
  }
  if (accentGeos.length > 0) {
    torsoGroup.add(new THREE.Mesh(mergeSafeGeometries(accentGeos), accentMat));
  }

  // 4. Anatomical Neck Loft
  const neckGeo = createParametricLoftGeometry([
    { y: collarBaseY - 0.02, rx: neckRx + 0.010, rz: neckRz + 0.008 },
    { y: collarBaseY + 0.07, rx: neckRx, rz: neckRz },
    { y: 0.95, rx: neckRx + 0.002, rz: neckRz + 0.003 }
  ], 18);
  torsoGroup.add(new THREE.Mesh(neckGeo, skinMat));

  return torsoGroup;
}

/**
 * Builds sculpted Sims-inspired V3 adult head with natural relaxed gaze, visible eyebrows,
 * refined nose bridge, soft warm lips, and 100% open-face outward-normal hair / hijab.
 */
export function buildV3HeadGroup(skinMat, lipMat, hairMat, hairStyle, hairCol, accessory, accentMat, profile) {
  const headGroup = new THREE.Group();
  headGroup.position.set(0, STYLIZED_V3_PROPORTIONS.HEAD_PIVOT_Y, 0);

  const isFem = profile.isFeminine;
  const rx = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_X * (isFem ? 0.96 : 1.0);

  // 1. Anatomically Sculpted Cranium + Facial Warmth Vertex Tints
  const baseSphere = new THREE.SphereGeometry(1.0, 28, 22);
  const posAttr = baseSphere.attributes.position;
  const colorArray = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i++) {
    const nx = posAttr.getX(i);
    const ny = posAttr.getY(i);
    const nz = posAttr.getZ(i);
    const pt = computeV3HeadVertex(nx, ny, nz, isFem);
    posAttr.setXYZ(i, pt.x, pt.y, pt.z);
    const tint = computeV3FaceTint(nx, ny, nz);
    colorArray[i * 3] = tint.r;
    colorArray[i * 3 + 1] = tint.g;
    colorArray[i * 3 + 2] = tint.b;
  }
  baseSphere.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
  baseSphere.computeVertexNormals();

  // 2. Clean Minimalist Stylized Nose (soft integrated nasal bridge + gentle tip, no loose spheres)
  const noseRoot = projectOnFrontFace(0, 0.022, isFem, 0.001);
  const noseMid = projectOnFrontFace(0, 0.002, isFem, 0.005);
  const noseTip = projectOnFrontFace(0, -0.016, isFem, 0.011);
  const noseCol = projectOnFrontFace(0, -0.025, isFem, 0.002);

  const noseGeo = createParametricLoftGeometry([
    { y: noseCol.y, rx: isFem ? 0.0075 : 0.0088, rz: 0.007, offsetZ: noseCol.z },
    { y: noseTip.y, rx: isFem ? 0.0082 : 0.0094, rz: 0.010, offsetZ: noseTip.z },
    { y: noseMid.y, rx: 0.0058, rz: 0.0068, offsetZ: noseMid.z },
    { y: noseRoot.y, rx: 0.0052, rz: 0.0045, offsetZ: noseRoot.z }
  ], 10);

  // Contoured Ears sitting anatomically along sides of skull
  const earX = rx + 0.002;
  const earGeoL = new THREE.SphereGeometry(0.019, 8, 8);
  earGeoL.scale(0.35, 1.28, 0.65);
  earGeoL.rotateZ(0.14);
  earGeoL.rotateY(-0.22);
  earGeoL.translate(-earX, 0.002, -0.010);

  const earGeoR = new THREE.SphereGeometry(0.019, 8, 8);
  earGeoR.scale(0.35, 1.28, 0.65);
  earGeoR.rotateZ(-0.14);
  earGeoR.rotateY(0.22);
  earGeoR.translate(earX, 0.002, -0.010);

  // Clear Open Stylized Eye Placement (slightly recessed so Side profile stays natural)
  const eyeX = STYLIZED_V3_PROPORTIONS.EYE_HALF_SPACING_X * (isFem ? 0.96 : 1.0);
  const eyeY = STYLIZED_V3_PROPORTIONS.EYE_CENTER_Y;
  const socketSurface = projectOnFrontFace(eyeX, eyeY, isFem, 0);
  const eyeZ = socketSurface.z - 0.0045;

  // Soft natural upper eyelid curve (relaxed, warm, never startled wide-eyed)
  const lidL = new THREE.SphereGeometry(0.0210, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.30);
  lidL.scale(1.04, 0.94, 0.84);
  lidL.rotateX(-0.18);
  lidL.translate(-eyeX, eyeY + 0.002, eyeZ);

  const lidR = new THREE.SphereGeometry(0.0210, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.30);
  lidR.scale(1.04, 0.94, 0.84);
  lidR.rotateX(-0.18);
  lidR.translate(eyeX, eyeY + 0.002, eyeZ);

  const faceSkinMat = skinMat.clone();
  faceSkinMat.vertexColors = true;
  faceSkinMat.roughness = 0.72;
  faceSkinMat.metalness = 0.0;

  const mergedHeadSkin = mergeSafeGeometries([
    baseSphere,
    noseGeo,
    earGeoL,
    earGeoR,
    lidL,
    lidR
  ]);
  headGroup.add(new THREE.Mesh(mergedHeadSkin, faceSkinMat));

  // 3. Clear, Expressive Stylized Eyes (crisp sclera, calm dark iris, bright catchlight)
  const eyeGeos = [];
  [-eyeX, eyeX].forEach((ex, idx) => {
    const eye = new THREE.SphereGeometry(0.0198, 14, 12);
    eye.rotateY(-Math.PI / 2 + (idx === 0 ? 0.02 : -0.02));
    eye.scale(1.04, 0.94, 0.80);
    eye.translate(ex, eyeY, eyeZ);
    eyeGeos.push(eye);
  });
  headGroup.add(new THREE.Mesh(mergeSafeGeometries(eyeGeos), new THREE.MeshStandardMaterial({
    map: skinMat.userData?.irisTex || null,
    roughness: 0.22,
    metalness: 0.0
  })));

  // 4. Clean Thin Upper Lash Outline (defines eye clarity cleanly)
  const lashMat = new THREE.MeshStandardMaterial({ color: '#1b130f', roughness: 0.72 });
  const lashGeos = [];
  [-1, 1].forEach((side) => {
    const lashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * (eyeX - 0.016), eyeY + 0.002, eyeZ + 0.009),
      new THREE.Vector3(side * eyeX, eyeY + 0.010, eyeZ + 0.015),
      new THREE.Vector3(side * (eyeX + 0.017), eyeY + 0.002, eyeZ + 0.008)
    ]);
    lashGeos.push(new THREE.TubeGeometry(lashCurve, 8, isFem ? 0.0020 : 0.0017, 5, false));
  });
  headGroup.add(new THREE.Mesh(mergeSafeGeometries(lashGeos), lashMat));

  // 5. Clear Arched Stylized Eyebrows
  const browMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(hairCol), roughness: 0.76 });
  const browGeos = [];
  const browBaseY = STYLIZED_V3_PROPORTIONS.BROW_CENTER_Y;
  [-1, 1].forEach((side) => {
    const browCurve = new THREE.CatmullRomCurve3([
      projectOnFrontFace(side * (eyeX - 0.018), browBaseY - 0.001, isFem, 0.0026),
      projectOnFrontFace(side * eyeX, browBaseY + (isFem ? 0.0055 : 0.0035), isFem, 0.0030),
      projectOnFrontFace(side * (eyeX + 0.020), browBaseY - 0.003, isFem, 0.0024)
    ]);
    const bGeo = scaleGeometryInPlace(
      new THREE.TubeGeometry(browCurve, 8, isFem ? 0.0026 : 0.0034, 5, false),
      1.0,
      0.72,
      0.60
    );
    browGeos.push(bGeo);
  });
  headGroup.add(new THREE.Mesh(mergeSafeGeometries(browGeos), browMat));

  // 6. Simple Warm Stylized Smile (clean smiling lips without dark outline wire)
  const mouthW = isFem ? 0.019 : 0.021;
  const mouthY = -0.056;
  const upperLipCurve = new THREE.CatmullRomCurve3([
    projectOnFrontFace(-mouthW, mouthY + 0.0015, isFem, 0.0015),
    projectOnFrontFace(-mouthW * 0.35, mouthY + 0.0010, isFem, 0.0030),
    projectOnFrontFace(0, mouthY + 0.0002, isFem, 0.0030),
    projectOnFrontFace(mouthW * 0.35, mouthY + 0.0010, isFem, 0.0030),
    projectOnFrontFace(mouthW, mouthY + 0.0015, isFem, 0.0015)
  ]);
  const lowerLipCurve = new THREE.CatmullRomCurve3([
    projectOnFrontFace(-mouthW * 0.90, mouthY + 0.0008, isFem, 0.0015),
    projectOnFrontFace(0, mouthY - 0.0036, isFem, 0.0036),
    projectOnFrontFace(mouthW * 0.90, mouthY + 0.0008, isFem, 0.0015)
  ]);
  const lipGeo = mergeSafeGeometries([
    new THREE.TubeGeometry(upperLipCurve, 10, isFem ? 0.0030 : 0.0025, 6, false),
    new THREE.TubeGeometry(lowerLipCurve, 10, isFem ? 0.0038 : 0.0032, 6, false)
  ]);
  headGroup.add(new THREE.Mesh(lipGeo, lipMat));

  // 7. V3 Open-Face Hair & Hijab (flipWinding = true keeps ALL outward normals facing outward!)
  buildV3HairAndHeadwear(headGroup, hairStyle, hairMat, accentMat, isFem);

  // 8. Accessories aligned cleanly to V3 facial coordinates
  buildV3Accessory(headGroup, accessory, hairStyle, accentMat, isFem, eyeX, eyeY, eyeZ);

  return headGroup;
}

/**
 * Builds the open-face parametric scalp shell with OUTWARD normals (flipWinding: true)
 * covering temples, crown, sides, and entire back occiput while leaving forehead & face clear.
 */
function createOpenFaceScalpShell(thickness, isFem, crownLift = 0.012) {
  return createParametricSurfaceGrid(30, 12, (uNorm, t) => {
    const u = (uNorm - 0.5) * Math.PI * 2;
    const edgeBlend = t < 0.14 ? (-0.003 + (t / 0.14) * (thickness + 0.003)) : thickness;
    const crownBoost = Math.sin(t * Math.PI) * crownLift * Math.max(0, 1 - Math.abs(u) / Math.PI);
    return sampleScalpHairlinePoint(u, t, edgeBlend + crownBoost, isFem);
  }, { flipWinding: true });
}

/**
 * Builds all 6 hair/headwear variations:
 * Clean, smooth, stylized volume strictly behind/above hairline — NEVER helmet-like and NEVER covering the face.
 */
function buildV3HairAndHeadwear(headGroup, style, hairMat, accentMat, isFem) {
  if (style === 'hijab') {
    const hijabMat = new THREE.MeshStandardMaterial({
      color: '#f3ede2',
      roughness: 0.86,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const ciputMat = new THREE.MeshStandardMaterial({
      color: '#dfd3c2',
      roughness: 0.88,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    // A. Thin Snug Inner Ciput Edge along top forehead hairline (keeps forehead, brows, eyes & cheeks 100% open)
    const ciputGeo = createParametricSurfaceGrid(24, 4, (uNorm, vNorm) => {
      const u = (uNorm - 0.5) * Math.PI * 0.96;
      const pt = sampleHijabHoodPoint(u, vNorm * 0.16, isFem);
      return {
        x: pt.x * 0.988,
        y: pt.y - (1 - vNorm) * 0.004,
        z: pt.z - 0.003
      };
    }, { flipWinding: true });
    headGroup.add(new THREE.Mesh(ciputGeo, ciputMat));

    // B. Sculpted Snug Hijab Head Frame (hugs head contour behind cheeks/jawline, never a bloated ball)
    const hoodGeo = createParametricSurfaceGrid(34, 14, (uNorm, vNorm) => {
      const u = uNorm * Math.PI * 2;
      if (vNorm < 0.06) {
        const rim = sampleHijabAperturePoint(u, isFem);
        const tuck = 1 - vNorm / 0.06;
        return {
          x: rim.x * (1 - tuck * 0.012),
          y: rim.y,
          z: rim.z - tuck * 0.005
        };
      }
      const t = (vNorm - 0.06) / 0.94;
      return sampleHijabHoodPoint(u, t, isFem);
    }, { flipWinding: true });

    // C. Sleek Contoured Neck & Collarbone Shawl (hugs neck cleanly and drapes into chest without stiff back flare)
    const neckDrapeGeo = createParametricLoftGeometry([
      { y: -0.225, rx: 0.122, rz: 0.088, offsetZ: 0.012, squareness: 0.90 },
      { y: -0.175, rx: 0.094, rz: 0.078, offsetZ: 0.006, squareness: 0.92 },
      { y: -0.145, rx: 0.072, rz: 0.070, offsetZ: -0.001, squareness: 0.94 },
      { y: -0.124, rx: 0.068, rz: 0.066, offsetZ: -0.005, squareness: 0.95 }
    ], 24, { capBottom: true, capTop: false });

    headGroup.add(new THREE.Mesh(mergeSafeGeometries([hoodGeo, neckDrapeGeo]), hijabMat));

    const pin = new THREE.OctahedronGeometry(0.0085, 1);
    pin.scale(1.0, 1.0, 0.5);
    pin.translate(0.048, -0.168, 0.084);
    headGroup.add(new THREE.Mesh(pin, accentMat));
    return;
  }

  const hairGeos = [];
  const scalpThickness = style === 'short' ? 0.010 : style === 'cap' ? 0.006 : 0.010;
  const crownLift = style === 'short' ? 0.014 : style === 'cap' ? 0.002 : 0.011;
  hairGeos.push(createOpenFaceScalpShell(scalpThickness, isFem, crownLift));

  if (style === 'cap') {
    const peciMat = new THREE.MeshStandardMaterial({ color: '#171413', roughness: 0.78, metalness: 0.02 });
    const peciGeo = createParametricLoftGeometry([
      { y: 0.095, rx: 0.126, rz: 0.134, offsetZ: -0.014, squareness: 0.85 },
      { y: 0.150, rx: 0.122, rz: 0.130, offsetZ: -0.016, squareness: 0.83 },
      { y: 0.198, rx: 0.114, rz: 0.122, offsetZ: -0.018, squareness: 0.80 }
    ], 22);
    peciGeo.rotateX(-0.08);
    headGroup.add(new THREE.Mesh(peciGeo, peciMat));

    const band = new THREE.TorusGeometry(0.125, 0.004, 8, 24);
    band.rotateX(Math.PI / 2 - 0.08);
    band.scale(1.0, 1.06, 1.0);
    band.translate(0, 0.100, -0.014);
    headGroup.add(new THREE.Mesh(band, accentMat));

    headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
    return;
  }

  if (style === 'bun') {
    const bun = new THREE.SphereGeometry(0.066, 16, 12);
    bun.scale(1.10, 0.92, 0.86);
    bun.translate(0, 0.048, -0.146);
    hairGeos.push(bun);

    const coil = new THREE.TorusGeometry(0.048, 0.012, 8, 18);
    coil.translate(0, 0.048, -0.126);
    hairGeos.push(coil);

    // Swept-back hairline locks hugging temples above ears (zero facial coverage)
    [-1, 1].forEach((side) => {
      const sweep = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.014, 0.144, 0.018),
        new THREE.Vector3(side * 0.092, 0.102, 0.012),
        new THREE.Vector3(side * 0.110, 0.035, -0.046),
        new THREE.Vector3(side * 0.062, 0.042, -0.124)
      ]);
      const lock = scaleGeometryInPlace(new THREE.TubeGeometry(sweep, 12, 0.014, 7, false), 0.9, 1.0, 0.72);
      hairGeos.push(lock);
    });

    headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));

    const stem = new THREE.CylinderGeometry(0.0032, 0.0032, 0.19, 7);
    stem.rotateZ(0.65);
    stem.translate(0.036, 0.068, -0.142);
    const tip = new THREE.OctahedronGeometry(0.013, 1);
    tip.translate(0.094, 0.140, -0.142);
    headGroup.add(new THREE.Mesh(mergeSafeGeometries([stem, tip]), accentMat));
    return;
  }

  if (style === 'long') {
    // Smooth top crown loft + sleek behind-ear drapes so center crown has zero notch
    const topCap = new THREE.SphereGeometry(0.118, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.42);
    topCap.scale(1.02, 0.46, 1.05);
    topCap.translate(0, 0.106, -0.014);
    hairGeos.push(topCap);

    [-1, 1].forEach((side) => {
      const tressCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.012, 0.148, 0.010),
        new THREE.Vector3(side * 0.102, 0.100, -0.010),
        new THREE.Vector3(side * 0.122, -0.020, -0.046),
        new THREE.Vector3(side * 0.132, -0.145, -0.068),
        new THREE.Vector3(side * 0.142, -0.255, -0.082)
      ]);
      const tGeo = scaleGeometryInPlace(new THREE.TubeGeometry(tressCurve, 14, 0.024, 8, false), 0.85, 1.0, 1.02);
      hairGeos.push(tGeo);
    });

    const backCascade = createParametricLoftGeometry([
      { y: -0.265, rx: 0.148, rz: 0.056, offsetZ: -0.102, squareness: 0.86 },
      { y: -0.125, rx: 0.138, rz: 0.062, offsetZ: -0.094, squareness: 0.88 },
      { y: 0.035, rx: 0.126, rz: 0.070, offsetZ: -0.070, squareness: 0.90 }
    ], 16);
    hairGeos.push(backCascade);

    headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
    return;
  }

  if (style === 'wavy') {
    const topCap = new THREE.SphereGeometry(0.118, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.42);
    topCap.scale(1.02, 0.46, 1.05);
    topCap.translate(0, 0.106, -0.014);
    hairGeos.push(topCap);

    // Soft sculpted layered wave clumps sweeping cleanly behind temples/ears (zero helmet sphere)
    const clumpOffsets = [
      { xScale: 0.92, zOff: -0.025, phase: 0.0 },
      { xScale: 1.05, zOff: -0.058, phase: 0.6 },
      { xScale: 0.82, zOff: -0.088, phase: 1.2 }
    ];
    [-1, 1].forEach((side) => {
      clumpOffsets.forEach((c) => {
        const waveCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.018, 0.146, 0.008 + c.zOff * 0.25),
          new THREE.Vector3(side * (0.104 * c.xScale), 0.095, -0.012 + c.zOff * 0.5),
          new THREE.Vector3(side * (0.128 * c.xScale + Math.sin(c.phase) * 0.010), -0.025, c.zOff - 0.015),
          new THREE.Vector3(side * (0.122 * c.xScale - Math.cos(c.phase) * 0.012), -0.140, c.zOff - 0.028),
          new THREE.Vector3(side * (0.136 * c.xScale + Math.sin(c.phase) * 0.014), -0.245, c.zOff - 0.034)
        ]);
        const wGeo = scaleGeometryInPlace(new THREE.TubeGeometry(waveCurve, 12, 0.020, 7, false), 0.90, 1.0, 0.90);
        hairGeos.push(wGeo);
      });
    });

    const backWave = createParametricLoftGeometry([
      { y: -0.250, rx: 0.142, rz: 0.056, offsetZ: -0.104, squareness: 0.85 },
      { y: -0.115, rx: 0.134, rz: 0.062, offsetZ: -0.094, squareness: 0.87 },
      { y: 0.040, rx: 0.124, rz: 0.068, offsetZ: -0.070, squareness: 0.90 }
    ], 16);
    hairGeos.push(backWave);

    headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
    return;
  }

  // Default: 'short' — Clean stylized textured top volume (rounded dome + gentle side sweep, zero horn ridges)
  [-1, 1].forEach((side) => {
    const sideBurn = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.114, 0.086, 0.012),
      new THREE.Vector3(side * 0.118, 0.044, 0.008),
      new THREE.Vector3(side * 0.115, 0.008, 0.004)
    ]);
    const sGeo = scaleGeometryInPlace(new THREE.TubeGeometry(sideBurn, 6, 0.008, 5, false), 0.45, 1.0, 1.05);
    hairGeos.push(sGeo);
  });

  const crownCap = new THREE.SphereGeometry(0.116, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.46);
  crownCap.scale(1.04, 0.50, 1.10);
  crownCap.translate(0.004, 0.104, -0.004);
  hairGeos.push(crownCap);

  const sweepCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.072, 0.118, 0.036),
    new THREE.Vector3(-0.008, 0.144, 0.052),
    new THREE.Vector3(0.064, 0.134, 0.038),
    new THREE.Vector3(0.104, 0.098, 0.006)
  ]);
  hairGeos.push(scaleGeometryInPlace(new THREE.TubeGeometry(sweepCurve, 12, 0.021, 7, false), 1.10, 0.62, 1.0));

  headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
}

function buildV3Accessory(headGroup, accessory, hairStyle, accentMat, isFem, eyeX, eyeY, eyeZ) {
  if (!accessory || accessory === 'none') return;

  if (accessory === 'glasses') {
    const frameMat = new THREE.MeshStandardMaterial({ color: '#1b1820', metalness: 0.75, roughness: 0.25 });
    const lensMat = new THREE.MeshStandardMaterial({ color: '#dff0ff', transparent: true, opacity: 0.32, roughness: 0.08 });

    const frameGeos = [];
    const lensGeos = [];
    const lensZ = eyeZ + 0.024;
    [-eyeX - 0.001, eyeX + 0.001].forEach((gx) => {
      const rim = new THREE.TorusGeometry(0.0235, 0.0026, 8, 18);
      rim.translate(gx, eyeY, lensZ);
      frameGeos.push(rim);

      const lens = new THREE.CircleGeometry(0.022, 14);
      lens.translate(gx, eyeY, lensZ - 0.001);
      lensGeos.push(lens);

      const sideSign = Math.sign(gx);
      const temple = new THREE.BoxGeometry(0.0028, 0.0028, 0.120);
      temple.translate(sideSign * (eyeX + 0.0245), eyeY + 0.002, lensZ - 0.060);
      frameGeos.push(temple);
    });

    const bridge = new THREE.BoxGeometry(0.028, 0.0035, 0.004);
    bridge.translate(0, eyeY + 0.003, lensZ + 0.001);
    frameGeos.push(bridge);

    headGroup.add(new THREE.Mesh(mergeSafeGeometries(frameGeos), frameMat));
    headGroup.add(new THREE.Mesh(mergeSafeGeometries(lensGeos), lensMat));
  } else if (accessory === 'flower') {
    const fx = hairStyle === 'cap' ? 0.120 : 0.126;
    const fy = hairStyle === 'cap' ? 0.024 : 0.048;
    const fz = hairStyle === 'hijab' ? 0.044 : 0.046;

    const petalMat = new THREE.MeshStandardMaterial({ color: '#fffdf9', roughness: 0.42 });
    const centerMat = new THREE.MeshStandardMaterial({ color: '#ffd54f', roughness: 0.30 });

    const petalGeos = [];
    for (let p = 0; p < 5; p++) {
      const a = (p * Math.PI * 2) / 5;
      const petal = new THREE.SphereGeometry(0.013, 7, 7);
      petal.scale(1.1, 1.35, 0.45);
      petal.translate(fx + Math.cos(a) * 0.014, fy + Math.sin(a) * 0.014, fz + 0.010);
      petalGeos.push(petal);
    }
    const center = new THREE.SphereGeometry(0.008, 7, 7);
    center.translate(fx, fy, fz + 0.014);

    headGroup.add(new THREE.Mesh(mergeSafeGeometries(petalGeos), petalMat));
    headGroup.add(new THREE.Mesh(center, centerMat));
  } else if (accessory === 'crown') {
    const crownY = hairStyle === 'cap' ? 0.205 : 0.156;
    const crownGeos = [];
    const band = new THREE.TorusGeometry(0.094, 0.008, 8, 24);
    band.rotateX(Math.PI / 2);
    band.translate(0, crownY, -0.012);
    crownGeos.push(band);

    for (let i = 0; i < 5; i++) {
      const a = (i - 2) * 0.34;
      const h = 0.048 - Math.abs(i - 2) * 0.009;
      const spire = new THREE.ConeGeometry(0.0095, h, 7);
      spire.translate(Math.sin(a) * 0.092, crownY + h / 2, Math.cos(a) * 0.092 - 0.012);
      crownGeos.push(spire);
    }
    headGroup.add(new THREE.Mesh(mergeSafeGeometries(crownGeos), accentMat));
  }
}

/**
 * Builds articulated V3 Arm + Forearm + Merged 5-Finger Hand tucked into sloped clavicle.
 */
export function buildV3ArmGroup(xOffset, isLeft, fabricMat, accentMat, skinMat, profile) {
  const armGroup = new THREE.Group();
  armGroup.position.set(xOffset, profile.shoulderPivotY, 0);

  const isFem = profile.isFeminine;
  const rScale = isFem ? 0.88 : 1.0;
  const dir = isLeft ? 1 : -1;

  const upperArmGeo = createParametricLoftGeometry([
    { y: -0.295, rx: 0.042 * rScale, rz: 0.042 * rScale },
    { y: -0.155, rx: 0.048 * rScale, rz: 0.049 * rScale },
    { y: -0.035, rx: 0.051 * rScale, rz: 0.052 * rScale, offsetX: dir * 0.007 },
    { y: 0.006, rx: 0.047 * rScale, rz: 0.048 * rScale, offsetX: dir * 0.015 },
    { y: 0.026, rx: 0.032 * rScale, rz: 0.034 * rScale, offsetX: dir * 0.024 }
  ], 14);
  armGroup.add(new THREE.Mesh(upperArmGeo, fabricMat));

  const forearmGroup = new THREE.Group();
  forearmGroup.position.set(0, STYLIZED_V3_PROPORTIONS.ELBOW_LOCAL_Y, 0);

  const elbowSphere = new THREE.SphereGeometry(0.041 * rScale, 10, 8);
  const forearmLoft = createParametricLoftGeometry([
    { y: -0.245, rx: 0.032 * rScale, rz: 0.031 * rScale },
    { y: -0.125, rx: 0.040 * rScale, rz: 0.040 * rScale },
    { y: 0.0, rx: 0.041 * rScale, rz: 0.041 * rScale }
  ], 14, { capTop: false });
  forearmGroup.add(new THREE.Mesh(mergeSafeGeometries([elbowSphere, forearmLoft]), fabricMat));

  const cuffGeo = createParametricLoftGeometry([
    { y: -0.250, rx: 0.035 * rScale, rz: 0.034 * rScale },
    { y: -0.226, rx: 0.036 * rScale, rz: 0.035 * rScale }
  ], 14);
  forearmGroup.add(new THREE.Mesh(cuffGeo, accentMat));

  // Stylized Smooth Hand (1 draw call!)
  const handGeos = [];
  const palm = createParametricLoftGeometry([
    { y: -0.325, rx: 0.028 * rScale, rz: 0.013 * rScale },
    { y: -0.288, rx: 0.032 * rScale, rz: 0.016 * rScale },
    { y: -0.250, rx: 0.025 * rScale, rz: 0.018 * rScale }
  ], 12);
  handGeos.push(palm);

  const thumbX = (isLeft ? 0.024 : -0.024) * rScale;
  const thumbCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(thumbX * 0.65, -0.270, 0.007),
    new THREE.Vector3(thumbX, -0.296, 0.016),
    new THREE.Vector3(thumbX * 0.85, -0.320, 0.020)
  ]);
  handGeos.push(new THREE.TubeGeometry(thumbCurve, 5, 0.0072 * rScale, 6, false));

  const fingerLens = [0.042, 0.047, 0.043, 0.034];
  const fingerRads = [0.0065, 0.0068, 0.0065, 0.0056];
  for (let f = 0; f < 4; f++) {
    const idx = isLeft ? f : 3 - f;
    const fx = (f - 1.5) * 0.013 * rScale;
    const len = fingerLens[idx] * (0.94 + rScale * 0.06);
    const r = fingerRads[idx] * rScale;
    const fCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(fx, -0.322, 0.002),
      new THREE.Vector3(fx, -0.322 - len * 0.52, 0.010),
      new THREE.Vector3(fx, -0.322 - len, 0.015)
    ]);
    handGeos.push(new THREE.TubeGeometry(fCurve, 5, r, 6, false));
  }

  forearmGroup.add(new THREE.Mesh(mergeSafeGeometries(handGeos), skinMat));
  armGroup.add(forearmGroup);

  return { armGroup, forearmGroup };
}

/**
 * Builds articulated V3 Leg + Knee + Stylized Footwear (sole flush at world y = 0.00).
 */
export function buildV3LegGroup(xOffset, lowerFabricMat, shoeMat, accentMat, profile) {
  const legGroup = new THREE.Group();
  legGroup.position.set(xOffset, STYLIZED_V3_PROPORTIONS.HIP_PIVOT_Y, 0);

  const lScale = profile.isFeminine ? 0.90 : 1.0;

  const thighGeo = createParametricLoftGeometry([
    { y: -0.44, rx: 0.055 * lScale, rz: 0.058 * lScale },
    { y: -0.22, rx: 0.075 * lScale, rz: 0.078 * lScale },
    { y: 0.0, rx: 0.084 * lScale, rz: 0.086 * lScale },
    { y: 0.04, rx: 0.070 * lScale, rz: 0.072 * lScale }
  ], 16, { capBottom: false });
  legGroup.add(new THREE.Mesh(thighGeo, lowerFabricMat));

  const kneeGroup = new THREE.Group();
  kneeGroup.position.set(0, -STYLIZED_V3_PROPORTIONS.THIGH_LENGTH, 0);

  const kneeDome = new THREE.SphereGeometry(0.055 * lScale, 12, 10);
  kneeDome.scale(0.99, 0.96, 1.04);

  const calfGeo = createParametricLoftGeometry([
    { y: -0.445, rx: 0.036 * lScale, rz: 0.038 * lScale },
    { y: -0.30, rx: 0.050 * lScale, rz: 0.054 * lScale, offsetZ: -0.004 },
    { y: -0.14, rx: 0.062 * lScale, rz: 0.066 * lScale, offsetZ: -0.006 },
    { y: 0.0, rx: 0.055 * lScale, rz: 0.057 * lScale }
  ], 16, { capBottom: false, capTop: false });
  kneeGroup.add(new THREE.Mesh(mergeSafeGeometries([kneeDome, calfGeo]), lowerFabricMat));

  const shoeLoft = createParametricLoftGeometry([
    { y: -0.54, rx: 0.052 * lScale, rz: 0.118, offsetZ: 0.050, squareness: 0.80 },
    { y: -0.515, rx: 0.054 * lScale, rz: 0.120, offsetZ: 0.050, squareness: 0.78 },
    { y: -0.480, rx: 0.047 * lScale, rz: 0.098, offsetZ: 0.038, squareness: 0.85 },
    { y: -0.435, rx: 0.042 * lScale, rz: 0.048, offsetZ: 0.004, squareness: 0.92 }
  ], 16);
  kneeGroup.add(new THREE.Mesh(shoeLoft, shoeMat));

  const buckle = new THREE.BoxGeometry(0.038, 0.007, 0.020);
  buckle.translate(0, -0.470, 0.082);
  kneeGroup.add(new THREE.Mesh(buckle, accentMat));

  legGroup.add(kneeGroup);

  return { legGroup, kneeGroup };
}
