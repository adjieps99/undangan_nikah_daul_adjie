import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  STYLIZED_V2_PROPORTIONS,
  computeStylizedFaceTint,
  computeStylizedHeadVertex,
  sampleStylizedCrossSectionPoint
} from './StylizedMath.js';

/**
 * Safely merges an array of BufferGeometries that share a material into one draw call.
 * Converts to non-indexed and ensures uniform attributes (position, normal, uv, and optional color) before merge.
 */
export function mergeSafeGeometries(rawList) {
  const validRaw = rawList.filter(Boolean);
  const needsColor = validRaw.some((r) => Boolean(r.attributes && r.attributes.color));
  const prepared = [];

  for (const raw of validRaw) {
    const g = raw.index ? raw.toNonIndexed() : raw.clone();
    if (!g.attributes.normal) {
      g.computeVertexNormals();
    }
    const count = g.attributes.position.count;
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    if (needsColor && !g.attributes.color) {
      const colors = new Float32Array(count * 3);
      colors.fill(1.0);
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
    // Strip extra custom attributes if any mismatch
    for (const key of Object.keys(g.attributes)) {
      if (key !== 'position' && key !== 'normal' && key !== 'uv' && (!needsColor || key !== 'color')) {
        g.deleteAttribute(key);
      }
    }
    prepared.push(g);
    if (raw !== g && raw.dispose) raw.dispose();
  }
  if (prepared.length === 0) return new THREE.BufferGeometry();
  if (prepared.length === 1) return prepared[0];
  const merged = mergeGeometries(prepared, false);
  prepared.forEach((g) => g.dispose());
  return merged || new THREE.BufferGeometry();
}

/**
 * Builds a smooth parametric lofted BufferGeometry from stacked cross-section rings.
 * Rings must be ordered bottom-to-top (increasing y).
 */
export function createParametricLoftGeometry(rings, radialSegments = 20, {
  capBottom = true,
  capTop = true
} = {}) {
  const ringCount = rings.length;
  const stride = radialSegments + 1;
  const positions = [];
  const uvs = [];
  const indices = [];

  const minY = rings[0].y;
  const maxY = rings[ringCount - 1].y;
  const spanY = Math.max(0.0001, maxY - minY);

  for (let r = 0; r < ringCount; r++) {
    const ring = rings[r];
    const v = (ring.y - minY) / spanY;
    for (let s = 0; s <= radialSegments; s++) {
      const u = s / radialSegments;
      const theta = u * Math.PI * 2;
      const pt = sampleStylizedCrossSectionPoint(ring, theta);
      positions.push(pt.x, pt.y, pt.z);
      uvs.push(u, v);
    }
  }

  for (let r = 0; r < ringCount - 1; r++) {
    const row0 = r * stride;
    const row1 = (r + 1) * stride;
    for (let s = 0; s < radialSegments; s++) {
      const a = row0 + s;
      const b = row0 + s + 1;
      const c = row1 + s;
      const d = row1 + s + 1;
      // Outward CCW winding: (+Y) x (+theta) = outward normal
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  if (capBottom) {
    const bottom = rings[0];
    const centerIdx = positions.length / 3;
    positions.push(bottom.offsetX || 0, bottom.y, bottom.offsetZ || 0);
    uvs.push(0.5, 0);
    for (let s = 0; s < radialSegments; s++) {
      indices.push(centerIdx, s, s + 1);
    }
  }

  if (capTop) {
    const top = rings[ringCount - 1];
    const centerIdx = positions.length / 3;
    positions.push(top.offsetX || 0, top.y, top.offsetZ || 0);
    uvs.push(0.5, 1);
    const topRow = (ringCount - 1) * stride;
    for (let s = 0; s < radialSegments; s++) {
      indices.push(centerIdx, topRow + s + 1, topRow + s);
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
 * Builds stylized smooth adult torso + traditional Indonesian attire details
 * with continuous pelvis -> waist -> chest -> sloped shoulder transitions.
 */
export function buildStylizedTorsoGroup(fabricMat, lowerFabricMat, accentMat, skinMat, outfit) {
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, STYLIZED_V2_PROPORTIONS.HIP_PIVOT_Y, 0);

  const isKebaya = outfit === 'kebaya_putih' || outfit === 'traditional_maroon' || outfit === 'dress';
  const isBeskap = outfit === 'beskap_hitam' || outfit === 'tuxedo';

  // 1. Continuous Lofted Upper Body (waist -> chest -> trapezius/collar base)
  const wRx = isKebaya ? 0.145 : 0.175;
  const wRz = isKebaya ? 0.105 : 0.118;
  const cRx = isKebaya ? 0.195 : 0.228;
  const cRz = isKebaya ? 0.132 : 0.138;

  const upperBodyRings = [
    { y: 0.22, rx: wRx + 0.018, rz: wRz + 0.011, squareness: 0.88 },
    { y: 0.32, rx: wRx, rz: wRz, squareness: 0.90, backIndent: 0.008 },
    { y: 0.44, rx: wRx + 0.026, rz: wRz + 0.014, frontBulge: isKebaya ? 0.018 : 0.010, backIndent: 0.010 },
    { y: 0.58, rx: cRx, rz: cRz, frontBulge: isKebaya ? 0.022 : 0.016, backIndent: 0.008, squareness: 0.86 },
    { y: 0.69, rx: cRx - 0.018, rz: cRz - 0.014, frontBulge: 0.008, squareness: 0.89 },
    { y: 0.78, rx: isKebaya ? 0.126 : 0.140, rz: 0.088, squareness: 0.92 },
    { y: 0.85, rx: 0.068, rz: 0.064, squareness: 0.96 }
  ];

  const fabricGeos = [createParametricLoftGeometry(upperBodyRings, 24)];
  const lowerGeos = [];
  const accentGeos = [];

  // 2. Smooth Pelvis / Lower Garment Skirt/Trousers Overlap (y = -0.04 -> 0.30)
  if (outfit === 'kebaya_putih') {
    // Draped Batik Jarik lower hip wrap + graceful flared white kebaya lace peplum
    const jarikRings = [
      { y: -0.05, rx: 0.194, rz: 0.136, squareness: 0.90 },
      { y: 0.08, rx: 0.200, rz: 0.138, squareness: 0.90 },
      { y: 0.22, rx: 0.168, rz: 0.120, squareness: 0.90 }
    ];
    lowerGeos.push(createParametricLoftGeometry(jarikRings, 24));

    const peplumRings = [
      { y: 0.06, rx: 0.214, rz: 0.148, squareness: 0.88 },
      { y: 0.18, rx: 0.188, rz: 0.132, squareness: 0.88 },
      { y: 0.30, rx: 0.152, rz: 0.110, squareness: 0.90 }
    ];
    fabricGeos.push(createParametricLoftGeometry(peplumRings, 24, { capBottom: false }));
  } else if (outfit === 'beskap_hitam') {
    // Tailored Beskap jacket lower skirt flaring cleanly over trousers (y = 0.08 -> 0.28)
    const jacketHemRings = [
      { y: 0.08, rx: 0.205, rz: 0.140, squareness: 0.88 },
      { y: 0.19, rx: 0.196, rz: 0.134, squareness: 0.88 },
      { y: 0.28, rx: wRx + 0.014, rz: wRz + 0.010, squareness: 0.90 }
    ];
    fabricGeos.push(createParametricLoftGeometry(jacketHemRings, 24));

    const pelvisRings = [
      { y: -0.03, rx: 0.190, rz: 0.128, squareness: 0.89 },
      { y: 0.10, rx: 0.188, rz: 0.126, squareness: 0.89 }
    ];
    lowerGeos.push(createParametricLoftGeometry(pelvisRings, 24));
  } else {
    const pelvisRings = [
      { y: -0.03, rx: isKebaya ? 0.192 : 0.196, rz: 0.132, squareness: 0.88 },
      { y: 0.10, rx: isKebaya ? 0.198 : 0.194, rz: 0.134, squareness: 0.88 },
      { y: 0.25, rx: wRx + 0.022, rz: wRz + 0.013, squareness: 0.89 }
    ];
    lowerGeos.push(createParametricLoftGeometry(pelvisRings, 24));
  }

  // 3. Attire-Specific Sculpted Details (Merged cleanly per material)
  if (outfit === 'beskap_hitam') {
    // High standing Mandarin collar loft
    const collarGeo = createParametricLoftGeometry([
      { y: 0.83, rx: 0.076, rz: 0.072, squareness: 0.96 },
      { y: 0.90, rx: 0.072, rz: 0.068, squareness: 0.96 }
    ], 22);
    fabricGeos.push(collarGeo);

    // Gold collar rim piping
    const rim = new THREE.TorusGeometry(0.070, 0.0055, 8, 24);
    rim.rotateX(Math.PI / 2);
    rim.scale(1.04, 1, 0.96);
    rim.translate(0, 0.90, 0);
    accentGeos.push(rim);

    // Curved diagonal asymmetric beskap front overlap (follows chest curve smoothly!)
    const flapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.045, 0.34, 0.132),
      new THREE.Vector3(-0.015, 0.50, 0.155),
      new THREE.Vector3(0.025, 0.66, 0.154),
      new THREE.Vector3(0.055, 0.80, 0.102)
    ]);
    const flapGeo = new THREE.TubeGeometry(flapCurve, 16, 0.016, 8, false);
    flapGeo.scale(1.8, 1.0, 0.42);
    fabricGeos.push(flapGeo);

    // 4 Diagonal Gold Beskap Buttons along asymmetric placket
    for (let b = 0; b < 4; b++) {
      const t = b / 3;
      const pt = flapCurve.getPoint(0.15 + t * 0.65);
      const btn = new THREE.CylinderGeometry(0.011, 0.011, 0.012, 12);
      btn.rotateX(Math.PI / 2);
      btn.translate(pt.x * 1.1 + 0.01, pt.y, pt.z + 0.009);
      accentGeos.push(btn);
    }

    // Traditional Curved Rantai Beskap (Gold Pocket Chain + Emblem)
    const chainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0.64, 0.156),
      new THREE.Vector3(0.065, 0.56, 0.158),
      new THREE.Vector3(0.115, 0.62, 0.146)
    ]);
    accentGeos.push(new THREE.TubeGeometry(chainCurve, 16, 0.0045, 6, false));

    const emblem = new THREE.OctahedronGeometry(0.019, 1);
    emblem.scale(1.0, 1.2, 0.45);
    emblem.translate(0.118, 0.63, 0.146);
    accentGeos.push(emblem);
  } else if (outfit === 'kebaya_putih') {
    // Sculpted Kutubaru front panel curving smoothly from waist to sternum
    const kutuCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.30, 0.120),
      new THREE.Vector3(0, 0.48, 0.156),
      new THREE.Vector3(0, 0.66, 0.152)
    ]);
    const kutuGeo = new THREE.TubeGeometry(kutuCurve, 12, 0.036, 10, false);
    kutuGeo.scale(1.35, 1.0, 0.30);
    fabricGeos.push(kutuGeo);

    // Delicate Gold V-Collar Trim
    [-1, 1].forEach((side) => {
      const vCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.022, 0.64, 0.150),
        new THREE.Vector3(side * 0.055, 0.74, 0.125),
        new THREE.Vector3(side * 0.068, 0.83, 0.068)
      ]);
      accentGeos.push(new THREE.TubeGeometry(vCurve, 10, 0.006, 6, false));
    });

    // 3-Tier Signature Gold Bros Kutubaru
    for (let k = 0; k < 3; k++) {
      const bros = new THREE.OctahedronGeometry(0.017 - k * 0.0025, 1);
      bros.scale(1.1, 1.1, 0.45);
      bros.translate(0, 0.64 - k * 0.065, 0.162 - k * 0.002);
      accentGeos.push(bros);
    }
  } else if (outfit === 'tuxedo') {
    const shirtGeo = createParametricLoftGeometry([
      { y: 0.48, rx: 0.08, rz: 0.145 },
      { y: 0.80, rx: 0.075, rz: 0.12 }
    ], 12);
    const shirtMesh = new THREE.Mesh(
      shirtGeo,
      new THREE.MeshStandardMaterial({ color: '#f8f8f8', roughness: 0.55 })
    );
    torsoGroup.add(shirtMesh);

    [-1, 1].forEach((side) => {
      const lapelCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.015, 0.48, 0.148),
        new THREE.Vector3(side * 0.065, 0.66, 0.148),
        new THREE.Vector3(side * 0.072, 0.82, 0.085)
      ]);
      accentGeos.push(new THREE.TubeGeometry(lapelCurve, 10, 0.012, 6, false));
    });
  } else {
    // traditional_gold & traditional_maroon: tailored collar + placket + gold sabuk + brooch
    const collarGeo = createParametricLoftGeometry([
      { y: 0.83, rx: 0.075, rz: 0.070 },
      { y: 0.89, rx: 0.072, rz: 0.067 }
    ], 20);
    accentGeos.push(collarGeo);

    const placketCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.30, 0.122),
      new THREE.Vector3(0, 0.56, 0.156),
      new THREE.Vector3(0, 0.81, 0.095)
    ]);
    const placket = new THREE.TubeGeometry(placketCurve, 12, 0.018, 8, false);
    placket.scale(1.1, 1.0, 0.35);
    accentGeos.push(placket);

    for (let b = 0; b < 4; b++) {
      const pt = placketCurve.getPoint(0.2 + b * 0.22);
      const btn = new THREE.SphereGeometry(0.009, 8, 8);
      btn.scale(1, 1, 0.5);
      btn.translate(pt.x, pt.y, pt.z + 0.009);
      accentGeos.push(btn);
    }

    const brooch = new THREE.OctahedronGeometry(0.022, 1);
    brooch.scale(1, 1.15, 0.45);
    brooch.translate(0.088, 0.66, 0.142);
    accentGeos.push(brooch);
  }

  // Contoured Waist Trim / Sabuk (sleek tailored gold seam for beskap_hitam, woven belt for others)
  if (outfit === 'beskap_hitam') {
    const sleekTrim = createParametricLoftGeometry([
      { y: 0.290, rx: wRx + 0.005, rz: wRz + 0.006, squareness: 0.90 },
      { y: 0.312, rx: wRx + 0.004, rz: wRz + 0.005, squareness: 0.90 }
    ], 24, { capBottom: false, capTop: false });
    accentGeos.push(sleekTrim);
  } else if (outfit !== 'kebaya_putih') {
    const beltGeo = createParametricLoftGeometry([
      { y: 0.275, rx: wRx + 0.010, rz: wRz + 0.009, squareness: 0.90 },
      { y: 0.325, rx: wRx + 0.007, rz: wRz + 0.008, squareness: 0.90 }
    ], 24, { capBottom: false, capTop: false });
    accentGeos.push(beltGeo);
  }

  // Add merged meshes (only 1 draw call per material!)
  if (fabricGeos.length > 0) {
    torsoGroup.add(new THREE.Mesh(mergeSafeGeometries(fabricGeos), fabricMat));
  }
  if (lowerGeos.length > 0) {
    torsoGroup.add(new THREE.Mesh(mergeSafeGeometries(lowerGeos), lowerFabricMat));
  }
  if (accentGeos.length > 0) {
    torsoGroup.add(new THREE.Mesh(mergeSafeGeometries(accentGeos), accentMat));
  }

  // 4. Smooth Neck Loft extending cleanly from collarbone into head socket
  const neckGeo = createParametricLoftGeometry([
    { y: 0.82, rx: 0.066, rz: 0.062 },
    { y: 0.91, rx: 0.056, rz: 0.054 },
    { y: 1.01, rx: 0.058, rz: 0.058 }
  ], 20);
  torsoGroup.add(new THREE.Mesh(neckGeo, skinMat));

  return torsoGroup;
}

/**
 * Builds sculpted Sims-inspired stylized adult head with integrated jawline, chin,
 * orbital eye sockets, sculpted hairline, 6 hairstyles, and 4 accessories.
 */
export function buildStylizedHeadGroup(skinMat, lipMat, hairMat, hairStyle, hairCol, accessory, accentMat) {
  const headGroup = new THREE.Group();
  headGroup.position.set(0, STYLIZED_V2_PROPORTIONS.HEAD_PIVOT_Y, 0);

  const { HEAD_RADIUS_X, HEAD_RADIUS_Y, HEAD_RADIUS_Z } = STYLIZED_V2_PROPORTIONS;

  // 1. Custom Anatomically Sculpted Cranium + Jawline + Orbital Sockets + Warm Facial Vertex Tinting
  const baseSphere = new THREE.SphereGeometry(1.0, 32, 26);
  const posAttr = baseSphere.attributes.position;
  const colorArray = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i++) {
    const nx = posAttr.getX(i);
    const ny = posAttr.getY(i);
    const nz = posAttr.getZ(i);
    const pt = computeStylizedHeadVertex(nx, ny, nz, HEAD_RADIUS_X, HEAD_RADIUS_Y, HEAD_RADIUS_Z);
    posAttr.setXYZ(i, pt.x, pt.y, pt.z);
    const tint = computeStylizedFaceTint(nx, ny, nz);
    colorArray[i * 3] = tint.r;
    colorArray[i * 3 + 1] = tint.g;
    colorArray[i * 3 + 2] = tint.b;
  }
  baseSphere.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
  baseSphere.computeVertexNormals();

  // 2. Integrated Stylized Nose & Ears (Merged into single vertex-tinted skin draw call!)
  const noseGeo = createParametricLoftGeometry([
    { y: -0.025, rx: 0.018, rz: 0.016, offsetZ: 0.148 },
    { y: -0.013, rx: 0.0135, rz: 0.019, offsetZ: 0.155 },
    { y: 0.016, rx: 0.009, rz: 0.011, offsetZ: 0.144 },
    { y: 0.038, rx: 0.008, rz: 0.007, offsetZ: 0.137 }
  ], 12);

  const earGeoL = new THREE.SphereGeometry(0.024, 10, 10);
  earGeoL.scale(0.38, 1.35, 0.72);
  earGeoL.rotateZ(0.14);
  earGeoL.rotateY(-0.22);
  earGeoL.translate(-0.132, 0.005, -0.008);

  const earGeoR = new THREE.SphereGeometry(0.024, 10, 10);
  earGeoR.scale(0.38, 1.35, 0.72);
  earGeoR.rotateZ(-0.14);
  earGeoR.rotateY(0.22);
  earGeoR.translate(0.132, 0.005, -0.008);

  // Soft Upper Eyelid Hoods (sculpted curves wrapping top of eyeballs in skin tone)
  const lidL = new THREE.SphereGeometry(0.025, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.44);
  lidL.rotateX(-0.24);
  lidL.translate(-0.043, 0.022, 0.123);

  const lidR = new THREE.SphereGeometry(0.025, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.44);
  lidR.rotateX(-0.24);
  lidR.translate(0.043, 0.022, 0.123);

  const faceSkinMat = skinMat.clone();
  faceSkinMat.vertexColors = true;
  const mergedHeadSkin = mergeSafeGeometries([baseSphere, noseGeo, earGeoL, earGeoR, lidL, lidR]);
  headGroup.add(new THREE.Mesh(mergedHeadSkin, faceSkinMat));

  // 3. Recessed Expressive Almond Eyes with crisp white sclera & catchlight
  const eyeGeos = [];
  [-0.043, 0.043].forEach((ex, idx) => {
    const eye = new THREE.SphereGeometry(0.0235, 16, 14);
    eye.rotateY(-Math.PI / 2 + (idx === 0 ? 0.04 : -0.04));
    eye.translate(ex, 0.021, 0.123);
    eyeGeos.push(eye);
  });
  headGroup.add(new THREE.Mesh(mergeSafeGeometries(eyeGeos), new THREE.MeshStandardMaterial({
    map: skinMat.userData?.irisTex || null,
    roughness: 0.12,
    metalness: 0.02
  })));

  // Delicate Dark Upper Eyelash Accents framing the eyes cleanly
  const lashMat = new THREE.MeshStandardMaterial({ color: '#1b120e', roughness: 0.7 });
  const lashGeos = [];
  [-1, 1].forEach((side) => {
    const lashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.023, 0.024, 0.135),
      new THREE.Vector3(side * 0.043, 0.032, 0.144),
      new THREE.Vector3(side * 0.062, 0.023, 0.132)
    ]);
    lashGeos.push(new THREE.TubeGeometry(lashCurve, 8, 0.0024, 6, false));
  });
  headGroup.add(new THREE.Mesh(mergeSafeGeometries(lashGeos), lashMat));

  // 4. Sculpted Curved Eyebrows
  const browMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(hairCol), roughness: 0.72 });
  const browGeos = [];
  [-1, 1].forEach((side) => {
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.020, 0.048, 0.135),
      new THREE.Vector3(side * 0.043, 0.054, 0.134),
      new THREE.Vector3(side * 0.066, 0.047, 0.120)
    ]);
    const bGeo = new THREE.TubeGeometry(browCurve, 10, 0.0040, 6, false);
    bGeo.scale(1, 0.8, 0.7);
    browGeos.push(bGeo);
  });
  headGroup.add(new THREE.Mesh(mergeSafeGeometries(browGeos), browMat));

  // 5. Soft Stylized Smiling Lips (Upper Cupid's Bow + Fuller Lower Lip)
  const upperLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.026, -0.063, 0.128),
    new THREE.Vector3(-0.009, -0.059, 0.139),
    new THREE.Vector3(0, -0.061, 0.140),
    new THREE.Vector3(0.009, -0.059, 0.139),
    new THREE.Vector3(0.026, -0.063, 0.128)
  ]);
  const lowerLipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.022, -0.065, 0.128),
    new THREE.Vector3(0, -0.074, 0.140),
    new THREE.Vector3(0.022, -0.065, 0.128)
  ]);
  const lipGeo = mergeSafeGeometries([
    new THREE.TubeGeometry(upperLipCurve, 12, 0.0048, 8, false),
    new THREE.TubeGeometry(lowerLipCurve, 12, 0.0062, 8, false)
  ]);
  headGroup.add(new THREE.Mesh(lipGeo, lipMat));

  // 6. Refined 6-Style Hair / Headwear System (Strictly Clears Forehead & Eyes!)
  buildStylizedHair(headGroup, hairStyle, hairMat, accentMat);

  // 7. Accessories (Glasses / Melati Flower / Royal Crown)
  buildStylizedAccessory(headGroup, accessory, hairStyle, accentMat);

  return headGroup;
}

/**
 * Sculpted directional hair caps & clumps — zero oversized sphere-helmet occlusion.
 */
function buildStylizedHair(headGroup, style, hairMat, accentMat) {
  const hairGeos = [];

  if (style === 'hijab') {
    const hijabMat = new THREE.MeshStandardMaterial({ color: '#f5f1e8', roughness: 0.78, metalness: 0.02 });
    // Fitted cranial hood loft positioned cleanly behind forehead & cheekbones
    const pashminaCap = createParametricLoftGeometry([
      { y: -0.08, rx: 0.136, rz: 0.128, offsetZ: -0.032 },
      { y: 0.04, rx: 0.146, rz: 0.138, offsetZ: -0.028 },
      { y: 0.13, rx: 0.122, rz: 0.124, offsetZ: -0.015 },
      { y: 0.185, rx: 0.055, rz: 0.058, offsetZ: -0.012 }
    ], 24);

    // Shoulder shawl drape & chin wrap (never covers face)
    const neckWrap = createParametricLoftGeometry([
      { y: -0.25, rx: 0.175, rz: 0.130, offsetZ: -0.010 },
      { y: -0.15, rx: 0.125, rz: 0.105, offsetZ: -0.008 },
      { y: -0.07, rx: 0.106, rz: 0.095, offsetZ: -0.014 }
    ], 22);

    headGroup.add(new THREE.Mesh(mergeSafeGeometries([pashminaCap, neckWrap]), hijabMat));

    // Gold collar pin
    const pin = new THREE.OctahedronGeometry(0.016, 1);
    pin.translate(0.085, -0.14, 0.095);
    headGroup.add(new THREE.Mesh(pin, accentMat));
    return;
  }

  // Tightly fitted cranial hair base (stays behind z <= 0.068 at forehead so eyes/brows are 100% clear)
  const cap = new THREE.SphereGeometry(0.142, 22, 18);
  cap.scale(0.99, 1.18, 1.02);
  cap.translate(0, 0.036, -0.028);
  hairGeos.push(cap);

  if (style === 'cap') {
    // Traditional Indonesian Velvet Songkok / Peci + tapered side hair underneath
    const peciMat = new THREE.MeshStandardMaterial({ color: '#171312', roughness: 0.65, metalness: 0.05 });
    const peciGeo = createParametricLoftGeometry([
      { y: 0.075, rx: 0.146, rz: 0.154, offsetZ: -0.012, squareness: 0.85 },
      { y: 0.155, rx: 0.140, rz: 0.148, offsetZ: -0.012, squareness: 0.82 },
      { y: 0.215, rx: 0.128, rz: 0.138, offsetZ: -0.012, squareness: 0.78 }
    ], 24);
    headGroup.add(new THREE.Mesh(peciGeo, peciMat));

    const band = new THREE.TorusGeometry(0.144, 0.006, 8, 28);
    band.rotateX(Math.PI / 2);
    band.scale(1.0, 1.05, 1.0);
    band.translate(0, 0.082, -0.012);
    headGroup.add(new THREE.Mesh(band, accentMat));

    // Subtle side/nape hair beneath peci
    headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
    return;
  }

  if (style === 'bun') {
    // Sleek Royal Wedding Sanggul / Chignon Bun + Gold Tusuk Konde
    const bun = new THREE.SphereGeometry(0.082, 18, 14);
    bun.scale(1.15, 0.92, 0.88);
    bun.translate(0, 0.115, -0.155);
    hairGeos.push(bun);

    // Soft side-part sweep framing temples cleanly
    [-1, 1].forEach((side) => {
      const sweep = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.165, 0.035),
        new THREE.Vector3(side * 0.085, 0.135, 0.078),
        new THREE.Vector3(side * 0.122, 0.045, 0.018)
      ]);
      const lock = new THREE.TubeGeometry(sweep, 12, 0.022, 8, false);
      lock.scale(1.0, 1.0, 0.75);
      hairGeos.push(lock);
    });

    headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));

    // Gold Tusuk Konde Hairpin
    const stem = new THREE.CylinderGeometry(0.004, 0.004, 0.24, 8);
    stem.rotateZ(0.68);
    stem.translate(0.045, 0.135, -0.145);
    const tip = new THREE.OctahedronGeometry(0.016, 1);
    tip.translate(0.118, 0.228, -0.145);
    headGroup.add(new THREE.Mesh(mergeSafeGeometries([stem, tip]), accentMat));
    return;
  }

  if (style === 'long' || style === 'wavy') {
    const waveAmp = style === 'wavy' ? 0.022 : 0.008;
    // Left & Right sculpted hair locks curving naturally past cheeks & shoulders
    [-1, 1].forEach((side) => {
      const lockCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.030, 0.170, 0.042),
        new THREE.Vector3(side * 0.118, 0.105, 0.068),
        new THREE.Vector3(side * (0.138 + waveAmp), -0.020, 0.020),
        new THREE.Vector3(side * (0.142 - waveAmp * 0.5), -0.145, -0.025),
        new THREE.Vector3(side * (0.150 + waveAmp), -0.265, -0.045)
      ]);
      const tGeo = new THREE.TubeGeometry(lockCurve, 16, 0.036, 10, false);
      tGeo.scale(0.82, 1.0, 1.12);
      hairGeos.push(tGeo);
    });

    // Flowing layered back waterfall (tapered loft behind neck & upper back)
    const backCascade = createParametricLoftGeometry([
      { y: -0.27, rx: 0.165, rz: 0.068, offsetZ: -0.095, squareness: 0.85 },
      { y: -0.12, rx: 0.155, rz: 0.072, offsetZ: -0.088, squareness: 0.88 },
      { y: 0.04, rx: 0.144, rz: 0.082, offsetZ: -0.065, squareness: 0.90 }
    ], 18);
    hairGeos.push(backCascade);

    headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
    return;
  }

  // Default: 'short' — Clean Indonesian Groom Tapered Cut + Cohesive Sculpted Swept Crown
  [-1, 1].forEach((side) => {
    const sideBurn = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.118, 0.115, 0.028),
      new THREE.Vector3(side * 0.127, 0.045, 0.020),
      new THREE.Vector3(side * 0.122, -0.006, 0.014)
    ]);
    const sGeo = new THREE.TubeGeometry(sideBurn, 8, 0.015, 7, false);
    sGeo.scale(0.52, 1.0, 1.15);
    hairGeos.push(sGeo);
  });

  // Cohesive swept stylized crown loft (clean silhouette without ribbed parallel tubes)
  const sweptCrown = createParametricLoftGeometry([
    { y: 0.105, rx: 0.128, rz: 0.126, offsetZ: -0.018, squareness: 0.90 },
    { y: 0.150, rx: 0.124, rz: 0.128, offsetX: 0.006, offsetZ: -0.006, squareness: 0.86 },
    { y: 0.188, rx: 0.098, rz: 0.112, offsetX: 0.008, offsetZ: -0.004, squareness: 0.84 },
    { y: 0.212, rx: 0.056, rz: 0.072, offsetX: 0.004, offsetZ: -0.012, squareness: 0.88 }
  ], 22);
  hairGeos.push(sweptCrown);

  headGroup.add(new THREE.Mesh(mergeSafeGeometries(hairGeos), hairMat));
}

function buildStylizedAccessory(headGroup, accessory, hairStyle, accentMat) {
  if (!accessory || accessory === 'none') return;

  if (accessory === 'glasses') {
    const frameMat = new THREE.MeshStandardMaterial({ color: '#1b1820', metalness: 0.75, roughness: 0.25 });
    const lensMat = new THREE.MeshStandardMaterial({ color: '#dff0ff', transparent: true, opacity: 0.35, roughness: 0.08 });

    const frameGeos = [];
    const lensGeos = [];
    [-0.044, 0.044].forEach((gx) => {
      const rim = new THREE.TorusGeometry(0.027, 0.0038, 8, 20);
      rim.translate(gx, 0.022, 0.146);
      frameGeos.push(rim);

      const lens = new THREE.CircleGeometry(0.025, 16);
      lens.translate(gx, 0.022, 0.145);
      lensGeos.push(lens);

      const sideSign = Math.sign(gx);
      const temple = new THREE.BoxGeometry(0.004, 0.004, 0.135);
      temple.translate(sideSign * 0.072, 0.024, 0.078);
      frameGeos.push(temple);
    });

    const bridge = new THREE.BoxGeometry(0.032, 0.004, 0.005);
    bridge.translate(0, 0.025, 0.148);
    frameGeos.push(bridge);

    headGroup.add(new THREE.Mesh(mergeSafeGeometries(frameGeos), frameMat));
    headGroup.add(new THREE.Mesh(mergeSafeGeometries(lensGeos), lensMat));
  } else if (accessory === 'flower') {
    // Indonesian Melati (Jasmine) Wedding Blossom positioned safely based on hairStyle
    const fx = hairStyle === 'cap' ? 0.132 : 0.145;
    const fy = hairStyle === 'cap' ? 0.025 : 0.055;
    const fz = hairStyle === 'hijab' ? 0.045 : 0.025;

    const petalMat = new THREE.MeshStandardMaterial({ color: '#fffdf9', roughness: 0.42 });
    const centerMat = new THREE.MeshStandardMaterial({ color: '#ffd54f', roughness: 0.3 });

    const petalGeos = [];
    for (let p = 0; p < 5; p++) {
      const a = (p * Math.PI * 2) / 5;
      const petal = new THREE.SphereGeometry(0.015, 8, 8);
      petal.scale(1.1, 1.35, 0.45);
      petal.translate(fx + Math.cos(a) * 0.016, fy + Math.sin(a) * 0.016, fz + 0.012);
      petalGeos.push(petal);
    }
    const center = new THREE.SphereGeometry(0.009, 8, 8);
    center.translate(fx, fy, fz + 0.016);

    headGroup.add(new THREE.Mesh(mergeSafeGeometries(petalGeos), petalMat));
    headGroup.add(new THREE.Mesh(center, centerMat));
  } else if (accessory === 'crown') {
    const crownY = hairStyle === 'cap' ? 0.222 : 0.168;
    const crownGeos = [];
    const band = new THREE.TorusGeometry(0.105, 0.009, 8, 28);
    band.rotateX(Math.PI / 2);
    band.translate(0, crownY, -0.01);
    crownGeos.push(band);

    for (let i = 0; i < 5; i++) {
      const a = (i - 2) * 0.34;
      const h = 0.055 - Math.abs(i - 2) * 0.010;
      const spire = new THREE.ConeGeometry(0.011, h, 8);
      spire.translate(Math.sin(a) * 0.102, crownY + h / 2, Math.cos(a) * 0.102 - 0.01);
      crownGeos.push(spire);
    }
    headGroup.add(new THREE.Mesh(mergeSafeGeometries(crownGeos), accentMat));
  }
}

/**
 * Builds smooth tapered arm (shoulder -> bicep -> elbow forearm pivot -> wrist -> stylized 5-finger hand).
 * Returns { armGroup, forearmGroup } so walking, sitting, and greeting bend naturally at the elbow.
 */
export function buildStylizedArmGroup(xOffset, isLeft, fabricMat, accentMat, skinMat) {
  const armGroup = new THREE.Group();
  armGroup.position.set(xOffset, STYLIZED_V2_PROPORTIONS.SHOULDER_PIVOT_Y, 0);

  // Upper arm tapered loft with rounded deltoid dome tucked cleanly into sloped shoulder
  const dir = isLeft ? 1 : -1;
  const upperArmGeo = createParametricLoftGeometry([
    { y: -0.31, rx: 0.046, rz: 0.046 },
    { y: -0.16, rx: 0.052, rz: 0.053 },
    { y: -0.04, rx: 0.054, rz: 0.055, offsetX: dir * 0.008 },
    { y: 0.005, rx: 0.046, rz: 0.048, offsetX: dir * 0.016 },
    { y: 0.028, rx: 0.022, rz: 0.024, offsetX: dir * 0.028 }
  ], 16);
  armGroup.add(new THREE.Mesh(upperArmGeo, fabricMat));

  // Elbow Forearm Group (pivots cleanly inside smooth sleeve continuity!)
  const forearmGroup = new THREE.Group();
  forearmGroup.position.set(0, STYLIZED_V2_PROPORTIONS.ELBOW_LOCAL_Y, 0);

  const elbowSphere = new THREE.SphereGeometry(0.045, 12, 10);
  const forearmLoft = createParametricLoftGeometry([
    { y: -0.25, rx: 0.036, rz: 0.035 },
    { y: -0.13, rx: 0.044, rz: 0.044 },
    { y: 0.0, rx: 0.045, rz: 0.045 }
  ], 16, { capTop: false });
  forearmGroup.add(new THREE.Mesh(mergeSafeGeometries([elbowSphere, forearmLoft]), fabricMat));

  // Subtle Gold Sleeve Cuff
  const cuffGeo = createParametricLoftGeometry([
    { y: -0.255, rx: 0.039, rz: 0.038 },
    { y: -0.230, rx: 0.040, rz: 0.039 }
  ], 16);
  forearmGroup.add(new THREE.Mesh(cuffGeo, accentMat));

  // Stylized Smooth Hand (merged palm + thumb + 4 gently curled fingers = 1 draw call!)
  const handGeos = [];
  const palm = createParametricLoftGeometry([
    { y: -0.335, rx: 0.030, rz: 0.014 },
    { y: -0.295, rx: 0.035, rz: 0.017 },
    { y: -0.255, rx: 0.027, rz: 0.019 }
  ], 14);
  handGeos.push(palm);

  // Opposable Thumb
  const thumbX = isLeft ? 0.026 : -0.026;
  const thumbCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(thumbX * 0.65, -0.275, 0.008),
    new THREE.Vector3(thumbX, -0.302, 0.018),
    new THREE.Vector3(thumbX * 0.85, -0.328, 0.022)
  ]);
  handGeos.push(new THREE.TubeGeometry(thumbCurve, 6, 0.008, 7, false));

  // 4 Natural Gently Curled Fingers
  const fingerLens = [0.045, 0.050, 0.046, 0.036];
  const fingerRads = [0.0070, 0.0073, 0.0070, 0.0060];
  for (let f = 0; f < 4; f++) {
    const idx = isLeft ? f : 3 - f;
    const fx = (f - 1.5) * 0.014;
    const len = fingerLens[idx];
    const r = fingerRads[idx];
    const fCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(fx, -0.330, 0.002),
      new THREE.Vector3(fx, -0.330 - len * 0.52, 0.011),
      new THREE.Vector3(fx, -0.330 - len, 0.017)
    ]);
    handGeos.push(new THREE.TubeGeometry(fCurve, 6, r, 7, false));
  }

  forearmGroup.add(new THREE.Mesh(mergeSafeGeometries(handGeos), skinMat));
  armGroup.add(forearmGroup);

  return { armGroup, forearmGroup };
}

/**
 * Builds smooth tapered leg + articulated knee + rounded stylized dress shoe (sole flush at y=0).
 */
export function buildStylizedLegGroup(xOffset, isLeft, lowerFabricMat, shoeMat, accentMat) {
  const legGroup = new THREE.Group();
  legGroup.position.set(xOffset, STYLIZED_V2_PROPORTIONS.HIP_PIVOT_Y, 0);

  // Tapered Organic Thigh (y = -0.44 -> 0.04, un-capped at bottom so knee joins without crease ring)
  const thighGeo = createParametricLoftGeometry([
    { y: -0.44, rx: 0.061, rz: 0.064 },
    { y: -0.22, rx: 0.076, rz: 0.079 },
    { y: 0.0, rx: 0.085, rz: 0.087 },
    { y: 0.04, rx: 0.072, rz: 0.074 }
  ], 18, { capBottom: false });
  legGroup.add(new THREE.Mesh(thighGeo, lowerFabricMat));

  // Knee Pivot Group at y = -0.44 (world y = 0.54)
  const kneeGroup = new THREE.Group();
  kneeGroup.position.set(0, -STYLIZED_V2_PROPORTIONS.THIGH_LENGTH, 0);

  const kneeDome = new THREE.SphereGeometry(0.061, 14, 12);
  kneeDome.scale(0.99, 0.96, 1.04);

  // Smooth Calf Contour tapering down to ankle (un-capped ends eliminate shading bands)
  const calfGeo = createParametricLoftGeometry([
    { y: -0.445, rx: 0.046, rz: 0.048 },
    { y: -0.30, rx: 0.056, rz: 0.058 },
    { y: -0.14, rx: 0.064, rz: 0.065 },
    { y: 0.0, rx: 0.061, rz: 0.063 }
  ], 18, { capBottom: false, capTop: false });
  kneeGroup.add(new THREE.Mesh(mergeSafeGeometries([kneeDome, calfGeo]), lowerFabricMat));

  // Rounded Stylized Dress Shoe / Loafer (sole bottom accurately at y = -0.54 relative to knee)
  const shoeLoft = createParametricLoftGeometry([
    { y: -0.54, rx: 0.058, rz: 0.125, offsetZ: 0.055, squareness: 0.80 },
    { y: -0.515, rx: 0.059, rz: 0.126, offsetZ: 0.055, squareness: 0.78 },
    { y: -0.480, rx: 0.052, rz: 0.105, offsetZ: 0.042, squareness: 0.85 },
    { y: -0.435, rx: 0.045, rz: 0.052, offsetZ: 0.005, squareness: 0.92 }
  ], 18);
  kneeGroup.add(new THREE.Mesh(shoeLoft, shoeMat));

  // Subtle gold shoe buckle/trim accent
  const buckle = new THREE.BoxGeometry(0.042, 0.008, 0.022);
  buckle.translate(0, -0.470, 0.088);
  kneeGroup.add(new THREE.Mesh(buckle, accentMat));

  legGroup.add(kneeGroup);

  return { legGroup, kneeGroup };
}
