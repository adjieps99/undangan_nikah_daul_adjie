/**
 * StylizedMath - Pure Anatomical Proportions, Loft Contours, Head Sculpting & Smooth Animation Math
 * Zero Three.js dependencies so every mathematical invariant can be deterministically unit-tested.
 */

export const STYLIZED_V2_PROPORTIONS = Object.freeze({
  TOTAL_STANDING_HEIGHT: 2.26,
  HIP_PIVOT_Y: 0.98,          // Preserves SeatingAnchor.js compatibility (sole at y=0)
  THIGH_LENGTH: 0.44,         // Knee at y=0.54
  CALF_PLUS_SHOE: 0.54,       // Sole at y=0.00
  SHOULDER_PIVOT_Y: 1.69,
  ELBOW_LOCAL_Y: -0.30,
  WRIST_LOCAL_Y: -0.57,
  HEAD_PIVOT_Y: 1.96,         // Stylized adult ~6.4 heads-tall ratio (no oversized puppet sphere)
  HEAD_RADIUS_X: 0.132,
  HEAD_RADIUS_Y: 0.168,
  HEAD_RADIUS_Z: 0.146,
  HAIR_FRONT_Z_CLEARANCE: 0.085 // Hairline stays comfortably behind eye plane (eyes at z ~ 0.125)
});

/**
 * Generates an elliptical/super-elliptical 2D cross-section contour with subtle front/back
 * anatomical shaping (pectorals/bust, spinal recess, natural waist taper).
 */
export function sampleStylizedCrossSectionPoint(ring, theta) {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  // Subtle squircle softening (p=2.15 gives organic human ribcage instead of raw cylinder)
  const signC = Math.sign(cos);
  const signS = Math.sign(sin);
  const absC = Math.abs(cos);
  const absS = Math.abs(sin);
  const exp = typeof ring.squareness === 'number' ? ring.squareness : 0.92;

  let x = signC * Math.pow(absC, exp) * ring.rx + (ring.offsetX || 0);
  let z = signS * Math.pow(absS, exp) * ring.rz + (ring.offsetZ || 0);

  // Anterior chest/sternum vs posterior spinal curve modulation
  if (sin > 0 && ring.frontBulge) {
    z += Math.pow(sin, 1.5) * ring.frontBulge;
  }
  if (sin < 0 && ring.backIndent) {
    // Gentle midline spine indentation on upper/mid back
    const spineFactor = Math.exp(-Math.pow(cos * 3.0, 2));
    z += spineFactor * ring.backIndent;
  }

  return { x, y: ring.y, z };
}

/**
 * Computes organic anatomical displacement on a unit sphere for a Sims-inspired stylized adult head:
 * - Softly tapered jawline and integrated chin (no glued-on spheres)
 * - Recessed orbital eye sockets
 * - Gentle brow ridge and cheekbones
 */
export function computeStylizedHeadVertex(nx, ny, nz, rx = 0.132, ry = 0.168, rz = 0.146) {
  let x = nx * rx;
  let y = ny * ry;
  let z = nz * rz;

  // 1. Cranium fullness at upper back (-Z, +Y) vs sleeker temple width
  if (ny > 0.1) {
    const crownExpand = Math.sin(Math.min(1, (ny - 0.1) / 0.9) * Math.PI) * 0.012;
    x *= 1 + crownExpand * 2.2;
    if (nz < 0) z -= crownExpand * 1.4;
  }

  // 2. Jawline & Chin taper below cheek level (ny < -0.15)
  if (ny < -0.05) {
    const jawT = Math.min(1, (-ny - 0.05) / 0.95);
    // Smooth V-oval jawline tapering inward on X
    x *= 1 - jawT * 0.44;
    if (nz > 0) {
      // Integrated chin projection tapering cleanly to bottom tip
      const chinCenterMask = Math.exp(-Math.pow(nx * 2.8, 2));
      const chinHeightMask = Math.exp(-Math.pow((ny + 0.72) * 3.2, 2));
      z += chinCenterMask * chinHeightMask * 0.022;
      z -= Math.max(0, jawT - 0.55) * 0.025;
    } else {
      // Neck/occiput recess under back of skull
      z *= 1 - jawT * 0.30;
    }
  }

  // 3. Subtle cheekbone & brow ridge sculpting on anterior face (nz > 0.25)
  if (nz > 0.25) {
    const frontMask = Math.min(1, (nz - 0.25) / 0.75);

    // Gentle cheek prominence around |nx| ~ 0.45, ny ~ -0.14
    const cheekMask =
      Math.exp(-Math.pow((Math.abs(nx) - 0.46) * 3.4, 2)) *
      Math.exp(-Math.pow((ny + 0.14) * 3.8, 2));
    z += cheekMask * frontMask * 0.011;
    x += Math.sign(nx) * cheekMask * frontMask * 0.005;

    // Recessed orbital eye sockets around |nx| ~ 0.34, ny ~ 0.13
    const eyeSocketMask =
      Math.exp(-Math.pow((Math.abs(nx) - 0.33) * 4.5, 2)) *
      Math.exp(-Math.pow((ny - 0.12) * 5.0, 2));
    z -= eyeSocketMask * frontMask * 0.013;

    // Soft supraorbital brow ridge above sockets (ny ~ 0.29)
    const browMask =
      Math.exp(-Math.pow((Math.abs(nx) - 0.31) * 3.6, 2)) *
      Math.exp(-Math.pow((ny - 0.29) * 5.2, 2));
    z += browMask * frontMask * 0.010;

    // Slight nasal root transition between eyes (|nx| < 0.14, ny ~ 0.10)
    const bridgeMask =
      Math.exp(-Math.pow(nx * 7.5, 2)) *
      Math.exp(-Math.pow((ny - 0.08) * 3.8, 2));
    z += bridgeMask * frontMask * 0.012;
  }

  return { x, y, z };
}

/**
 * Resolves time-advancing walking phase cleanly (fixes constant 1.05 bug in isWalkingView).
 */
export function resolveWalkingAnimPhase(animTime, _options = {}) {
  const safeTime = typeof animTime === 'number' && Number.isFinite(animTime) ? animTime : 0;
  return safeTime * 1.5;
}

/**
 * Computes subtle Sims-style facial warmth & occlusion vertex color multipliers
 * (rosy cheek warmth, subtle under-jaw/orbital depth, soft forehead highlight).
 */
export function computeStylizedFaceTint(nx, ny, nz) {
  let r = 1.0;
  let g = 1.0;
  let b = 1.0;

  if (nz > 0.15) {
    const front = Math.min(1, (nz - 0.15) / 0.85);
    // Soft rosy cheek blush
    const cheek =
      Math.exp(-Math.pow((Math.abs(nx) - 0.45) * 3.4, 2)) *
      Math.exp(-Math.pow((ny + 0.15) * 3.8, 2));
    r += cheek * front * 0.055;
    g -= cheek * front * 0.030;
    b -= cheek * front * 0.035;

    // Gentle orbital socket occlusion
    const socket =
      Math.exp(-Math.pow((Math.abs(nx) - 0.33) * 4.5, 2)) *
      Math.exp(-Math.pow((ny - 0.13) * 5.0, 2));
    const shade = socket * front * 0.065;
    r -= shade;
    g -= shade * 1.1;
    b -= shade * 1.1;
  }

  // Soft under-chin/jaw shadow
  if (ny < -0.45) {
    const jawShade = Math.min(1, (-ny - 0.45) / 0.55) * 0.085;
    r -= jawShade;
    g -= jawShade * 1.08;
    b -= jawShade * 1.12;
  }

  return {
    r: Math.max(0.82, Math.min(1.08, r)),
    g: Math.max(0.80, Math.min(1.06, g)),
    b: Math.max(0.78, Math.min(1.05, b))
  };
}

/**
 * Frame-rate independent exponential smoothing toward a target angle or scalar.
 */
export function dampValue(current, target, lambda, delta) {
  const dt = Math.max(0.0005, Math.min(0.1, delta || 0.016));
  const t = 1 - Math.exp(-Math.max(0.1, lambda) * dt);
  return current + (target - current) * t;
}
