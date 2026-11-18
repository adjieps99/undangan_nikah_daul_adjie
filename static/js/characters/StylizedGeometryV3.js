import * as THREE from 'three';
import { mergeSafeGeometries, createParametricLoftGeometry } from './StylizedGeometry.js';
import {
  STYLIZED_V3_PROPORTIONS,
  computeV3HeadVertex,
  sampleHijabAperturePoint,
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

  // A hijab preset must use the feminine head silhouette even if the current body preset is male.
  // This is intentionally local to the head; the approved body profile remains untouched.
  const isFem = Boolean(profile.isFeminine || hairStyle === 'hijab');
  const rx = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_X * (isFem ? 0.96 : 1.0);

  // 1. Smooth, single-colour cranium. No vertex tint, skin texture, bump map, or pore overlay.
  const baseSphere = new THREE.SphereGeometry(1.0, 28, 22);
  const posAttr = baseSphere.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const nx = posAttr.getX(i);
    const ny = posAttr.getY(i);
    const nz = posAttr.getZ(i);
    const pt = computeV3HeadVertex(nx, ny, nz, isFem);
    posAttr.setXYZ(i, pt.x, pt.y, pt.z);
  }
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
  const lidL = new THREE.SphereGeometry(0.0190, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.30);
  lidL.scale(1.04, 0.94, 0.84);
  lidL.rotateX(-0.18);
  lidL.translate(-eyeX, eyeY + 0.002, eyeZ);

  const lidR = new THREE.SphereGeometry(0.0190, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.30);
  lidR.scale(1.04, 0.94, 0.84);
  lidR.rotateX(-0.18);
  lidR.translate(eyeX, eyeY + 0.002, eyeZ);

  const mergedHeadSkin = mergeSafeGeometries([
    baseSphere,
    noseGeo,
    earGeoL,
    earGeoR,
    lidL,
    lidR
  ]);
  headGroup.add(new THREE.Mesh(mergedHeadSkin, skinMat));

  // 3. Clear, Expressive Stylized Eyes (crisp sclera, calm dark iris, bright catchlight)
  const eyeGeos = [];
  [-eyeX, eyeX].forEach((ex, idx) => {
    const eye = new THREE.SphereGeometry(0.0175, 14, 12);
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
    lashGeos.push(new THREE.TubeGeometry(lashCurve, 8, isFem ? 0.0016 : 0.0014, 5, false));
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
function createOpenFaceScalpShell(thickness, isFem, crownLift = 0.005) {
  return createParametricSurfaceGrid(40, 20, (uNorm, t) => {
    const u = (uNorm - 0.5) * Math.PI * 2;
    const point = sampleScalpHairlinePoint(u, t, thickness, isFem);
    const crownBulge = Math.sin(Math.PI * t) * crownLift;
    return {
      x: point.x,
      y: point.y + crownBulge,
      z: point.z
    };
  }, { flipWinding: true });
}

function createV3HairLock(points, radius = 0.011, tubularSegments = 18) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'centripetal'
  );
  return new THREE.TubeGeometry(curve, tubularSegments, radius, 7, false);
}

function createV3BackHairMass(wavy = false) {
  const rings = wavy
    ? [
        { y: -0.275, rx: 0.132, rz: 0.058, offsetZ: -0.205, squareness: 0.84 },
        { y: -0.180, rx: 0.146, rz: 0.064, offsetZ: -0.205, squareness: 0.86 },
        { y: -0.065, rx: 0.141, rz: 0.062, offsetZ: -0.195, squareness: 0.88 },
        { y: 0.075, rx: 0.126, rz: 0.058, offsetZ: -0.178, squareness: 0.90 }
      ]
    : [
        { y: -0.280, rx: 0.132, rz: 0.058, offsetZ: -0.205, squareness: 0.86 },
        { y: -0.175, rx: 0.145, rz: 0.064, offsetZ: -0.205, squareness: 0.88 },
        { y: -0.045, rx: 0.139, rz: 0.062, offsetZ: -0.194, squareness: 0.90 },
        { y: 0.075, rx: 0.122, rz: 0.056, offsetZ: -0.180, squareness: 0.92 }
      ];
  return createParametricLoftGeometry(rings, 18);
}

/**
 * Builds the six headwear choices from one clean scalp base.
 * Hair volume is kept on the crown, behind the ears, and behind the head;
 * no strand is allowed to cross the forehead, eyebrows, eyes, nose, or mouth.
 */
function buildV3HairAndHeadwear(headGroup, style, hairMat, accentMat, isFem) {
  if (style === 'hijab') {
    const hijabMat = new THREE.MeshStandardMaterial({
      color: '#f3ede2',
      roughness: 0.90,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: '#e7dccb',
      roughness: 0.88,
      metalness: 0.0
    });

    // A close-fitting fabric crown. It follows the skull rather than using a large sphere/hood.
    const hoodGeo = createOpenFaceScalpShell(0.009, true, 0.004);
    headGroup.add(new THREE.Mesh(hoodGeo, hijabMat));

    // A clear oval opening around the complete face: forehead, cheeks, jaw, and chin stay visible.
    const framePoints = [];
    for (let i = 0; i < 64; i++) {
      const u = (i / 64) * Math.PI * 2;
      const p = sampleHijabAperturePoint(u, true);
      framePoints.push(new THREE.Vector3(p.x, p.y, p.z));
    }
    const frameCurve = new THREE.CatmullRomCurve3(framePoints, true, 'centripetal');
    const frameGeo = new THREE.TubeGeometry(frameCurve, 64, 0.0034, 6, true);
    headGroup.add(new THREE.Mesh(frameGeo, trimMat));

    // Two separate pashmina panels. Their inner edges sit outside the cheeks;
    // the fabric then falls outward and backward to the shoulders.
    const drapePanels = [];
    [-1, 1].forEach((side) => {
      const panel = createParametricSurfaceGrid(14, 24, (u, v) => {
        const x = side * (0.104 + 0.052 * u + 0.008 * Math.sin(v * Math.PI));
        const y = 0.085 - 0.225 * v + 0.012 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
        const z = 0.074 - 0.165 * u - 0.018 * v + 0.008 * Math.sin(u * Math.PI);
        return { x, y, z };
      }, { flipWinding: side < 0 });
      drapePanels.push(panel);
    });

    // Soft cloth around the neck; kept below the chin and independent from the face mesh.
    const neckDrapeGeo = createParametricLoftGeometry([
      { y: -0.265, rx: 0.126, rz: 0.092, offsetZ: 0.008, squareness: 0.90 },
      { y: -0.220, rx: 0.105, rz: 0.083, offsetZ: 0.006, squareness: 0.92 },
      { y: -0.180, rx: 0.080, rz: 0.071, offsetZ: 0.000, squareness: 0.94 },
      { y: -0.155, rx: 0.070, rz: 0.066, offsetZ: -0.004, squareness: 0.95 }
    ], 24, { capBottom: true, capTop: false });

    headGroup.add(new THREE.Mesh(
      mergeSafeGeometries([...drapePanels, neckDrapeGeo]),
      hijabMat
    ));

    const pin = new THREE.OctahedronGeometry(0.0065, 1);
    pin.scale(1.0, 1.0, 0.55);
    pin.translate(0.112, -0.145, 0.055);
    headGroup.add(new THREE.Mesh(pin, accentMat));
    return;
  }

  const hairGeos = [
    createOpenFaceScalpShell(style === 'cap' ? 0.006 : 0.008, isFem, style === 'cap' ? 0.002 : 0.004)
  ];

  if (style === 'cap') {
    const peciMat = new THREE.MeshStandardMaterial({ color: '#171413', roughness: 0.82, metalness: 0.01 });
    const peciGeo = createParametricLoftGeometry([
      { y: 0.103, rx: 0.125, rz: 0.132, offsetZ: -0.012, squareness: 0.86 },
      { y: 0.153, rx: 0.122, rz: 0.130, offsetZ: -0.014, squareness: 0.84 },
      { y: 0.198, rx: 0.113, rz: 0.121, offsetZ: -0.016, squareness: 0.82 }
    ], 24);
    headGroup.add(new THREE.Mesh(peciGeo, peciMat));

    const band = new THREE.TorusGeometry(0.124, 0.0032, 7, 28);
    band.rotateX(Math.PI / 2 - 0.08);
    band.scale(1.0, 1.05, 1.0);
    band.translate(0, 0.108, -0.012);
    headGroup.add(new THREE.Mesh(band, accentMat));
    headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
    return;
  }

  if (style === 'bun') {
    hairGeos.push(createV3BackHairMass(false));

    const bun = new THREE.SphereGeometry(0.052, 16, 12);
    bun.scale(1.08, 0.90, 0.88);
    bun.translate(0, 0.052, -0.205);
    hairGeos.push(bun);

    const tie = new THREE.TorusGeometry(0.037, 0.005, 7, 18);
    tie.translate(0, 0.052, -0.198);
    hairGeos.push(tie);

    headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
    return;
  }

  if (style === 'long') {
    hairGeos.push(createV3BackHairMass(false));
    [-1, 1].forEach((side) => {
      hairGeos.push(createV3HairLock([
        [side * 0.120, 0.090, -0.030],
        [side * 0.132, 0.018, -0.060],
        [side * 0.140, -0.090, -0.092],
        [side * 0.142, -0.205, -0.125],
        [side * 0.135, -0.275, -0.145]
      ], 0.0125, 20));
    });
    headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
    return;
  }

  if (style === 'wavy') {
    hairGeos.push(createV3BackHairMass(true));
    [-1, 1].forEach((side) => {
      hairGeos.push(createV3HairLock([
        [side * 0.122, 0.085, -0.035],
        [side * 0.139, 0.015, -0.070],
        [side * 0.132, -0.070, -0.100],
        [side * 0.145, -0.155, -0.128],
        [side * 0.137, -0.265, -0.150]
      ], 0.0105, 20));
      hairGeos.push(createV3HairLock([
        [side * 0.132, 0.055, -0.080],
        [side * 0.145, -0.020, -0.105],
        [side * 0.136, -0.115, -0.132],
        [side * 0.148, -0.215, -0.158]
      ], 0.0085, 18));
    });
    headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
    return;
  }

  // Default short hairstyle: clean scalp, one restrained front sweep above the eyebrows,
  // and short sideburns tucked outside the cheeks. No crown sphere or bulky front cap.
  hairGeos.push(createV3HairLock([
    [-0.074, 0.116, 0.086],
    [-0.035, 0.137, 0.105],
    [0.018, 0.132, 0.106],
    [0.064, 0.111, 0.088]
  ], 0.0095, 16));
  [-1, 1].forEach((side) => {
    hairGeos.push(createV3HairLock([
      [side * 0.118, 0.070, 0.010],
      [side * 0.122, 0.026, 0.000],
      [side * 0.119, -0.018, -0.012]
    ], 0.0065, 10));
  });
  headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
}

function buildV3Accessory(headGroup, accessory, hairStyle, accentMat, isFem, eyeX, eyeY, eyeZ) {
  if (!accessory || accessory === 'none') return;

  if (accessory === 'glasses') {
    const frameMat = new THREE.MeshStandardMaterial({ color: '#27232a', metalness: 0.22, roughness: 0.48 });
    const lensMat = new THREE.MeshStandardMaterial({ color: '#e8f0f4', transparent: true, opacity: 0.16, roughness: 0.24 });

    const frameGeos = [];
    const lensGeos = [];
    const lensZ = eyeZ + 0.024;
    [-eyeX - 0.001, eyeX + 0.001].forEach((gx) => {
      const rim = new THREE.TorusGeometry(0.0195, 0.00155, 7, 20);
      rim.translate(gx, eyeY, lensZ);
      frameGeos.push(rim);

      const lens = new THREE.CircleGeometry(0.0182, 16);
      lens.translate(gx, eyeY, lensZ - 0.001);
      lensGeos.push(lens);

      const sideSign = Math.sign(gx);
      const temple = new THREE.BoxGeometry(0.0018, 0.0020, 0.105);
      temple.translate(sideSign * (eyeX + 0.0205), eyeY + 0.001, lensZ - 0.052);
      frameGeos.push(temple);
    });

    const bridge = new THREE.BoxGeometry(0.022, 0.0022, 0.003);
    bridge.translate(0, eyeY + 0.002, lensZ + 0.001);
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
