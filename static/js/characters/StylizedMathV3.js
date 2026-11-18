/**
 * StylizedMathV3 - Phase 16E Natural Stylized Human Anatomy, Craniofacial Sculpting & Open-Face Hairline Math
 * Pure ES module (zero Three.js imports) so all proportions and face-clearance invariants are unit-tested.
 */

export const STYLIZED_V3_PROPORTIONS = Object.freeze({
  TOTAL_STANDING_HEIGHT: 2.24,
  HIP_PIVOT_Y: 0.98,           // Matches SeatingAnchor.js (sole sits flush at y = 0.00)
  THIGH_LENGTH: 0.44,          // Knee at y = 0.54
  CALF_PLUS_SHOE: 0.54,        // Sole at y = 0.00
  SHOULDER_PIVOT_Y_MALE: 1.66,
  SHOULDER_PIVOT_Y_FEMALE: 1.63,
  ELBOW_LOCAL_Y: -0.29,
  WRIST_LOCAL_Y: -0.55,
  HEAD_PIVOT_Y: 1.94,          // ~7.35 heads-tall Sims-inspired adult proportion
  HEAD_RADIUS_X: 0.123,
  HEAD_RADIUS_Y: 0.152,
  HEAD_RADIUS_Z: 0.134,
  EYE_CENTER_Y: 0.014,
  EYE_HALF_SPACING_X: 0.039,
  BROW_CENTER_Y: 0.042,
  HAIRLINE_CENTER_Y: 0.086,    // Forehead hairline strictly above eyebrows (0.042)
  HIJAB_APERTURE_RX: 0.106,    // Clears cheekbones & eyebrows laterally
  HIJAB_APERTURE_TOP_Y: 0.088, // Clears forehead & brows cleanly
  HIJAB_APERTURE_BOT_Y: -0.128 // Tucks cleanly right beneath jawline so chin stays visible
});

const FEMININE_OUTFITS = new Set(['kebaya_putih', 'traditional_maroon', 'dress']);

/**
 * Resolves masculine vs feminine body & facial proportions while preserving all existing Avatar Creator options.
 */
export function resolveV3SilhouetteProfile(config = {}) {
  const gender = config && typeof config.gender === 'string' ? config.gender.toLowerCase() : '';
  let isFeminine = false;
  if (gender === 'female') isFeminine = true;
  else if (gender === 'male') isFeminine = false;
  else isFeminine = FEMININE_OUTFITS.has(config.outfit);

  if (isFeminine) {
    return {
      isFeminine: true,
      shoulderHalfWidth: 0.190,
      shoulderPivotY: STYLIZED_V3_PROPORTIONS.SHOULDER_PIVOT_Y_FEMALE,
      chestRx: 0.172,
      chestRz: 0.118,
      waistRx: 0.126,
      waistRz: 0.094,
      hipRx: 0.184,
      hipRz: 0.126,
      neckRx: 0.047,
      neckRz: 0.046,
      thighOffsetX: 0.094,
      armRestAbductionZ: 0.100,
      elbowRestBendX: -0.16
    };
  }

  return {
    isFeminine: false,
    shoulderHalfWidth: 0.222,
    shoulderPivotY: STYLIZED_V3_PROPORTIONS.SHOULDER_PIVOT_Y_MALE,
    chestRx: 0.208,
    chestRz: 0.126,
    waistRx: 0.158,
    waistRz: 0.108,
    hipRx: 0.178,
    hipRz: 0.122,
    neckRx: 0.055,
    neckRz: 0.053,
    thighOffsetX: 0.102,
    armRestAbductionZ: 0.115,
    elbowRestBendX: -0.15
  };
}

/**
 * Computes clean minimalist stylized human head sculpting from a unit-sphere direction (nx, ny, nz):
 * - Smooth oval cranium and gentle jawline tapering into an approachable chin
 * - Gentle cheek plane & subtle brow contour without dark sunken socket hollows
 */
export function computeV3HeadVertex(nx, ny, nz, isFeminine = false) {
  const rx = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_X * (isFeminine ? 0.96 : 1.0);
  const ry = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Y;
  const rz = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Z * (isFeminine ? 0.97 : 1.0);

  let x = nx * rx;
  let y = ny * ry;
  let z = nz * rz;

  // 1. Occipital cranium fullness behind ears & clean forehead temples
  if (ny > 0.05) {
    const crownT = Math.sin(Math.min(1, (ny - 0.05) / 0.95) * Math.PI);
    if (nz < 0) {
      z -= crownT * 0.012;
      x *= 1 + crownT * 0.035;
    } else {
      const templeMask = Math.exp(-Math.pow((Math.abs(nx) - 0.72) * 3.0, 2)) * Math.min(1, ny * 1.4);
      x *= 1 - templeMask * 0.045;
    }
  }

  // 2. Clean approachable jawline & soft integrated chin
  if (ny < -0.08) {
    const jawT = Math.min(1, (-ny - 0.08) / 0.92);
    const taperStrength = isFeminine ? 0.40 : 0.31;
    const jawAngleCurve = Math.pow(jawT, 1.35);
    x *= 1 - jawAngleCurve * taperStrength;

    if (nz > 0) {
      const chinMask = Math.exp(-Math.pow(nx * 2.5, 2)) * Math.exp(-Math.pow((ny + 0.78) * 3.4, 2));
      z += chinMask * (isFeminine ? 0.013 : 0.017);
      z -= Math.max(0, jawT - 0.66) * 0.018;
    } else {
      z *= 1 - jawT * 0.30;
    }
  }

  // 3. Soft anterior facial planes (clean stylized warmth, no harsh socket hollows)
  if (nz > 0.15) {
    const front = Math.min(1, (nz - 0.15) / 0.85);

    const cheekMask =
      Math.exp(-Math.pow((Math.abs(nx) - 0.48) * 3.5, 2)) *
      Math.exp(-Math.pow((ny + 0.16) * 4.4, 2));
    z += cheekMask * front * 0.007;
    x += Math.sign(nx) * cheekMask * front * 0.004;

    const socketMask =
      Math.exp(-Math.pow((Math.abs(nx) - 0.33) * 4.8, 2)) *
      Math.exp(-Math.pow((ny - 0.09) * 5.4, 2));
    z -= socketMask * front * 0.006;

    const browMask =
      Math.exp(-Math.pow((Math.abs(nx) - 0.31) * 3.8, 2)) *
      Math.exp(-Math.pow((ny - 0.28) * 5.4, 2));
    z += browMask * front * 0.006;
  }

  return { x, y, z };
}

/**
 * Computes clean minimalist skin tint (subtle healthy cheek warmth, zero dark orbital shadows).
 */
export function computeV3FaceTint(nx, ny, nz) {
  let r = 1.0;
  let g = 1.0;
  let b = 1.0;

  if (nz > 0.18) {
    const front = Math.min(1, (nz - 0.18) / 0.82);
    // Subtle clean peachy blush on cheeks only
    const cheek =
      Math.exp(-Math.pow((Math.abs(nx) - 0.45) * 3.4, 2)) *
      Math.exp(-Math.pow((ny + 0.14) * 3.8, 2));
    r += cheek * front * 0.032;
    g -= cheek * front * 0.016;
    b -= cheek * front * 0.020;
  }

  // Ultra-subtle chin grounding (never muddy brown)
  if (ny < -0.62) {
    const jawAo = Math.min(1, (-ny - 0.62) / 0.38) * 0.025;
    r -= jawAo;
    g -= jawAo * 1.04;
    b -= jawAo * 1.06;
  }

  return {
    r: Math.max(0.92, Math.min(1.05, r)),
    g: Math.max(0.90, Math.min(1.03, g)),
    b: Math.max(0.88, Math.min(1.02, b))
  };
}

/**
 * Evaluates a point on the open-face hijab frame boundary (angle u in [0, 2*PI]).
 * Carefully curves slightly backward around temples/cheeks so eyes, nose, lips & chin
 * are 100% clearly visible from Front, Three-Quarter, AND Side views.
 */
export function sampleHijabAperturePoint(u, isFeminine = true) {
  const rx = STYLIZED_V3_PROPORTIONS.HIJAB_APERTURE_RX * (isFeminine ? 0.98 : 1.0);
  const topY = STYLIZED_V3_PROPORTIONS.HIJAB_APERTURE_TOP_Y;
  const botY = STYLIZED_V3_PROPORTIONS.HIJAB_APERTURE_BOT_Y;
  const centerY = (topY + botY) * 0.5;
  const ry = (topY - botY) * 0.5;

  const sinU = Math.sin(u);
  const cosU = Math.cos(u);

  const x = sinU * rx;
  const y = centerY + cosU * ry;

  // Hug facial contour while pulling temples/cheeks cleanly back so side profile stays clear
  const nx = Math.max(-0.96, Math.min(0.96, x / STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_X));
  const ny = Math.max(-0.96, Math.min(0.96, y / STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Y));
  const nz = Math.sqrt(Math.max(0.04, 1 - nx * nx * 0.72 - ny * ny * 0.72));
  const surface = computeV3HeadVertex(nx, ny, nz, isFeminine);

  const sideRecess = Math.abs(sinU) * 0.012;
  const chinRecess = cosU < 0 ? (-cosU) * 0.008 : 0;

  return {
    x: surface.x + sinU * 0.004,
    y: surface.y + (cosU > 0 ? 0.005 : -0.004),
    z: surface.z + 0.004 - sideRecess - chinRecess
  };
}

/**
 * Evaluates a point on the V3 snug sculpted hijab frame (u in [0, 2*PI], t in [0, 1]).
 * Uses sleek ~8–15mm fabric clearance so hijab frames the head naturally without ballooning into a ball.
 */
export function sampleHijabHoodPoint(u, t, isFeminine = true) {
  const rim = sampleHijabAperturePoint(u, isFeminine);
  const sinU = Math.sin(u);
  const cosU = Math.cos(u);

  if (t <= 0) {
    return rim;
  }

  const rx = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_X * (isFeminine ? 0.96 : 1.0);
  const ry = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Y;
  const rz = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Z * (isFeminine ? 0.97 : 1.0);
  let rnx = rim.x / rx;
  let rny = rim.y / ry;
  let rnz = rim.z / rz;
  const rLen = Math.hypot(rnx, rny, rnz) || 1;
  rnx /= rLen;
  rny /= rLen;
  rnz /= rLen;

  const bnx = 0;
  const bny = 0.12;
  const bnz = -0.99;

  const ease = Math.sin(t * (Math.PI / 2));
  let nx = rnx + (bnx - rnx) * ease;
  let ny = rny + (bny - rny) * ease;
  let nz = rnz + (bnz - rnz) * ease;
  const len = Math.hypot(nx, ny, nz) || 1;
  nx /= len;
  ny /= len;
  nz /= len;

  const skullPt = computeV3HeadVertex(nx, ny, nz, isFeminine);
  // Sleek snug scarf thickness (7mm at rim -> 15mm at crown/back occiput — no bloated white sphere)
  const drapeClearance = 0.007 + Math.sin(t * Math.PI) * 0.006 + t * 0.007;
  const sideBias = Math.abs(sinU) * Math.sin(t * Math.PI) * 0.002;
  const topBias = cosU > 0 ? cosU * Math.sin(t * Math.PI) * 0.003 : 0;

  const rawX = skullPt.x + nx * (drapeClearance + sideBias);
  const rawY = skullPt.y + ny * (drapeClearance + topBias);
  const rawZ = skullPt.z + nz * drapeClearance;
  const blend = Math.min(1, t * 4.0);

  return {
    x: rim.x + (rawX - rim.x) * blend,
    y: rim.y + (rawY - rim.y) * blend,
    z: rim.z + (rawZ - rim.z) * blend
  };
}

/**
 * Evaluates a point on the open-face scalp hairline shell (angle u in [-PI, PI], t in [0, 1] from hairline to occiput).
 * u = 0 is center forehead hairline; u = ±PI is center nape of neck.
 * Strictly keeps the entire forehead, eyes, brows, nose, and cheeks clear!
 */
export function sampleScalpHairlinePoint(u, t, thickness = 0.011, isFeminine = false) {
  // Hairline boundary along front -> temples -> behind ears -> nape
  const absU = Math.abs(u);
  let startNy;
  if (absU < Math.PI * 0.42) {
    // Smooth rounded forehead hairline clearing eyebrows comfortably (ny >= 0.54 -> y >= 0.082m)
    const fT = absU / (Math.PI * 0.42);
    startNy = 0.54 - Math.pow(fT, 1.45) * 0.21; // rounded arch tapering smoothly toward temples (ny ~ 0.33)
  } else if (absU < Math.PI * 0.72) {
    // Sideburn / behind ear sweep
    const eT = (absU - Math.PI * 0.42) / (Math.PI * 0.30);
    startNy = 0.34 - eT * 0.72; // sweeps down to behind ear/jawline (ny ~ -0.38)
  } else {
    // Nape of neck
    const nT = (absU - Math.PI * 0.72) / (Math.PI * 0.28);
    startNy = -0.38 - nT * 0.34; // reaches low nape cleanly (ny ~ -0.72)
  }

  // Interpolate toward back crown / occiput (nx ~ 0, ny ~ 0.34, nz ~ -0.94)
  const targetNx = 0;
  const targetNy = 0.34;
  const targetNz = -0.94;

  // Start unit normal at hairline angle u
  const startHoriz = Math.sqrt(Math.max(0.05, 1 - startNy * startNy));
  const startNx = Math.sin(u) * startHoriz;
  const startNz = Math.cos(u) * startHoriz;

  let nx = startNx + (targetNx - startNx) * t;
  let ny = startNy + (targetNy - startNy) * t;
  let nz = startNz + (targetNz - startNz) * t;
  const len = Math.hypot(nx, ny, nz) || 1;
  nx /= len;
  ny /= len;
  nz /= len;

  const base = computeV3HeadVertex(nx, ny, nz, isFeminine);
  // Taper thickness smoothly near hairline edge (t ~ 0) so transition into forehead skin looks natural
  const edgeTaper = Math.sin(Math.min(1, t * 2.5) * (Math.PI / 2));
  const offset = thickness * (0.35 + 0.65 * edgeTaper);

  return {
    x: base.x + nx * offset,
    y: base.y + ny * offset,
    z: base.z + nz * offset
  };
}
