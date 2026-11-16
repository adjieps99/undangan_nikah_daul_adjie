/**
 * CameraFraming — Pure Camera Framing & Interior/Exterior Boundary Math
 * Dependency-free so both Three.js runtime controllers and Node unit tests share one source of truth.
 */

export const OUTDOOR_EXIT_SPAWN = Object.freeze({
  x: 0.0,
  y: 5.0,
  z: -13.4,
  rotY: 0.0 // Facing +Z (outward toward Grand Staircase & Central Garden)
});

export const MAIN_HALL_BOUNDS = Object.freeze({
  minX: -11.0,
  maxX: 11.0,
  minY: 0.75,
  maxY: 5.10, // Safely underneath ceiling rafters at y=5.55
  minZ: -15.0,
  maxZ: 9.2
});

export const MAIN_HALL_INTRO_CONFIG = Object.freeze({
  duration: 1.65,
  startYaw: 0.42,
  startPitch: 0.52,
  startRadius: 9.6,
  endYaw: 0.0,
  endPitch: 0.25,
  endRadius: 6.2
});

export const OUTDOOR_EXIT_CAMERA_CONFIG = Object.freeze({
  duration: 1.15,
  startYaw: 0.50,
  startPitch: 0.46,
  startRadius: 14.6,
  endYaw: 0.36,
  endPitch: 0.35,
  endRadius: 11.8
});

export const HACHI_BUILDING_OBSTRUCTION_BOX = Object.freeze({
  minX: -14.5,
  maxX: 14.5,
  minY: 4.8,
  maxY: 13.0,
  minZ: -33.8,
  maxZ: -16.0
});

export function easeOutCubic(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Clamp interior camera position cleanly inside hall walls and below ceiling beams.
 */
export function clampMainHallCameraPosition(pos) {
  return {
    x: Math.max(MAIN_HALL_BOUNDS.minX, Math.min(MAIN_HALL_BOUNDS.maxX, pos.x)),
    y: Math.max(MAIN_HALL_BOUNDS.minY, Math.min(MAIN_HALL_BOUNDS.maxY, pos.y)),
    z: Math.max(MAIN_HALL_BOUNDS.minZ, Math.min(MAIN_HALL_BOUNDS.maxZ, pos.z))
  };
}

/**
 * Interpolates spherical camera coordinates for the Main Hall entrance reveal.
 */
export function interpolateSphericalReveal(config, progress) {
  const e = easeOutCubic(progress);
  return {
    yaw: config.startYaw + (config.endYaw - config.startYaw) * e,
    pitch: config.startPitch + (config.endPitch - config.startPitch) * e,
    radius: config.startRadius + (config.endRadius - config.startRadius) * e
  };
}

/**
 * Checks whether a 3D world point falls inside The Hachi Restaurant opaque building envelope.
 */
export function isPointInsideHachiBuilding(x, y, z) {
  const b = HACHI_BUILDING_OBSTRUCTION_BOX;
  return (
    x >= b.minX &&
    x <= b.maxX &&
    y >= b.minY &&
    y <= b.maxY &&
    z >= b.minZ &&
    z <= b.maxZ
  );
}
