/**
 * SeatingAnchor - Exact Anatomical Rig Alignment Calculator
 * Computes sitting joint angles and root offsets from real rig & chair dimensions
 * so the avatar never floats above cushions or clips through chair geometry.
 */

export const AVATAR_RIG_DIMENSIONS = Object.freeze({
  HIP_HEIGHT: 0.98,         // Standing distance from ground (y=0) to hip joint pivot
  THIGH_RADIUS_AT_HIP: 0.088, // Radius of upper thigh / glutes resting on cushion
  THIGH_LENGTH: 0.44,       // Distance from hip pivot to knee pivot
  CALF_PLUS_SHOE: 0.54,     // Distance from knee pivot down to shoe sole bottom (0.44 + 0.10)
  PELVIS_DEPTH: 0.14,       // Rear thickness from spine centerline to lower back surface
  GLB_CANONICAL_SIT_HEIGHT: 0.45 // Standard chair cushion height assumed by baked GLB sitting animation clips
});

/**
 * Compute vertical root offset specifically for rigged skeletal GLB models whose
 * 'sitting' clip already lowers hips from standing to cushion height in local space.
 * Prevents applying procedural -0.44m rigRoot shift that would sink GLB models underground.
 */
export function computeGlbSeatingAlignment({
  cushionTopY = 0.475,
  supportFloorY = 0.0,
  canonicalSitHeight = AVATAR_RIG_DIMENSIONS.GLB_CANONICAL_SIT_HEIGHT
} = {}) {
  const localSeatHeight = Math.max(0.2, cushionTopY - supportFloorY);
  const rawDelta = localSeatHeight - canonicalSitHeight;
  // Clamp downward drop slightly so GLB shoe soles remain flush with stage/floor surface
  const glbRootOffsetY = Math.max(-0.04, Math.min(0.12, rawDelta));
  return {
    localSeatHeight,
    glbRootOffsetY
  };
}

/**
 * Compute anatomical sitting pose and exact world vertical placement.
 * Keeps `rootWorldY` equal to `floorY` and calculates internal hip vertical shift
 * plus knee flexion so thighs sit flush on cushionTopY and shoes touch supportFloorY.
 */
export function computeSeatingRigPose({
  cushionTopY = 0.475,
  supportFloorY = 0.0,
  seatCenterX = 0,
  seatCenterZ = 0,
  faceAngle = 0,
  seatDepthForwardOffset = -0.02
} = {}) {
  const {
    HIP_HEIGHT,
    THIGH_RADIUS_AT_HIP,
    CALF_PLUS_SHOE
  } = AVATAR_RIG_DIMENSIONS;

  // Target hip pivot Y so underside of thighs rests flush on top of cushion
  const targetHipWorldY = cushionTopY + THIGH_RADIUS_AT_HIP - 0.015; // ~1.5cm natural cushion compression
  const hipDropFromStanding = targetHipWorldY - (supportFloorY + HIP_HEIGHT);

  // If the knee sits at targetHipWorldY and calf hangs straight down (length CALF_PLUS_SHOE):
  const verticalShoeClearance = (targetHipWorldY - CALF_PLUS_SHOE) - supportFloorY;

  // When sitting on a higher stage sofa (like Pelaminan), verticalShoeClearance < 0
  // so bend knees slightly forward/downward so soles rest flush on supportFloorY without clipping.
  let kneeBendAngle = Math.PI / 2;
  if (verticalShoeClearance < 0) {
    const neededDrop = Math.max(0.15, targetHipWorldY - supportFloorY);
    const cosTheta = Math.min(1, Math.max(-0.5, neededDrop / CALF_PLUS_SHOE));
    const forwardTilt = Math.acos(cosTheta);
    kneeBendAngle = Math.PI / 2 - forwardTilt;
  }

  // Horizontal anchor nudges avatar slightly back toward backrest while keeping thighs centered
  const worldX = seatCenterX + Math.sin(faceAngle) * seatDepthForwardOffset;
  const worldZ = seatCenterZ + Math.cos(faceAngle) * seatDepthForwardOffset;
  const glbAlignment = computeGlbSeatingAlignment({ cushionTopY, supportFloorY });

  return {
    rootPosition: {
      x: worldX,
      y: supportFloorY,
      z: worldZ
    },
    faceAngle,
    hipOffsetY: hipDropFromStanding,
    glbRootOffsetY: glbAlignment.glbRootOffsetY,
    thighPitchX: -Math.PI / 2,
    kneeBendX: kneeBendAngle,
    targetHipWorldY,
    cushionTopY,
    verticalShoeClearance
  };
}
