/**
 * StylizedMathV3 - Phase 16F clean head, scalp, and open-face hijab math
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
  HIJAB_APERTURE_BOT_Y: -0.138 // Sits just below the chin without covering the jawline
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
 * Evaluates a point on the open-face hijab frame boundary (angle u in [0, 2*PI]).
 * Carefully curves slightly backward around temples/cheeks so eyes, nose, lips & chin
 * are 100% clearly visible from Front, Three-Quarter, AND Side views.
 */
export function sampleHijabAperturePoint(u, isFeminine = true) {
  const headRx = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_X * (isFeminine ? 0.96 : 1.0);
  const headRy = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Y;
  const headRz = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Z * (isFeminine ? 0.97 : 1.0);
  const rx = STYLIZED_V3_PROPORTIONS.HIJAB_APERTURE_RX * (isFeminine ? 0.98 : 1.0);
  const topY = STYLIZED_V3_PROPORTIONS.HIJAB_APERTURE_TOP_Y;
  const botY = STYLIZED_V3_PROPORTIONS.HIJAB_APERTURE_BOT_Y;
  const centerY = (topY + botY) * 0.5;
  const ry = (topY - botY) * 0.5;

  const sinU = Math.sin(u);
  const cosU = Math.cos(u);

  const x = sinU * rx;
  const y = centerY + cosU * ry;

  // Project the opening onto the actual ellipsoid instead of using a loose spherical approximation.
  const nx = Math.max(-0.98, Math.min(0.98, x / headRx));
  const ny = Math.max(-0.98, Math.min(0.98, y / headRy));
  const nz = Math.sqrt(Math.max(0.025, 1 - nx * nx - ny * ny));
  const surface = computeV3HeadVertex(nx, ny, nz, isFeminine);

  // Ellipsoid surface normal gives a small, consistent cloth clearance around the face.
  let normalX = nx / headRx;
  let normalY = ny / headRy;
  let normalZ = nz / headRz;
  const normalLength = Math.hypot(normalX, normalY, normalZ) || 1;
  normalX /= normalLength;
  normalY /= normalLength;
  normalZ /= normalLength;
  const clearance = 0.0055;

  return {
    x: surface.x + normalX * clearance,
    y: surface.y + normalY * clearance,
    z: surface.z + normalZ * clearance
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

  // Interpolate in polar angle, preserving the U/azimuth at every ring.
  // The previous implementation blended every longitude toward one back-of-head point,
  // collapsing the scalp into a twisted cap and producing helmet-like hair silhouettes.
  const clampedT = Math.max(0, Math.min(1, t));
  const easedT = clampedT * clampedT * (3 - 2 * clampedT);
  const startTheta = Math.acos(Math.max(-0.98, Math.min(0.98, startNy)));
  const crownTheta = 0.035;
  const theta = startTheta + (crownTheta - startTheta) * easedT;
  const sinTheta = Math.sin(theta);
  const nx = Math.sin(u) * sinTheta;
  const ny = Math.cos(theta);
  const nz = Math.cos(u) * sinTheta;

  const base = computeV3HeadVertex(nx, ny, nz, isFeminine);
  const rx = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_X * (isFeminine ? 0.96 : 1.0);
  const ry = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Y;
  const rz = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Z * (isFeminine ? 0.97 : 1.0);
  let normalX = nx / rx;
  let normalY = ny / ry;
  let normalZ = nz / rz;
  const normalLength = Math.hypot(normalX, normalY, normalZ) || 1;
  normalX /= normalLength;
  normalY /= normalLength;
  normalZ /= normalLength;

  // Keep a very small, even clearance; only the hairline edge is tucked slightly inward.
  const edgeTaper = 0.35 + 0.65 * easedT;
  const offset = thickness * edgeTaper;

  return {
    x: base.x + normalX * offset,
    y: base.y + normalY * offset,
    z: base.z + normalZ * offset
  };
}
