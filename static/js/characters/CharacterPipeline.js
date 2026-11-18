/**
 * CharacterPipeline - Pure Calculation & Asset Validation Helpers for Style C Characters
 * Decoupled from Three.js runtime objects so all rules can be deterministically unit-tested.
 */

export const STYLE_C_STANDARD = Object.freeze({
  id: 'STYLE_C_SEMI_REALISTIC_CINEMATIC',
  label: 'Semi-Realistic Cinematic 3D',
  targetAdultHeightRangeMeters: Object.freeze({ min: 1.60, max: 1.84 }),
  targetHeadToBodyRatio: Object.freeze({ min: 7.2, max: 7.8 }),
  canonicalGlbSitHeightMeters: 0.45
});

export const CALIBRATED_STYLE_C_PBR = Object.freeze({
  skin: Object.freeze({ roughnessMin: 0.46, roughnessMax: 0.68, metalnessMax: 0.04, envMapIntensity: 0.55 }),
  fabric: Object.freeze({ roughnessMin: 0.62, roughnessMax: 0.90, metalnessMax: 0.14, envMapIntensity: 0.45 }),
  hair: Object.freeze({ roughnessMin: 0.48, roughnessMax: 0.76, metalnessMax: 0.06, envMapIntensity: 0.45 }),
  metalAccent: Object.freeze({ roughnessMin: 0.22, roughnessMax: 0.42, envMapIntensity: 0.90 })
});

export const ADJIE_PROTOTYPE_VIEWS = Object.freeze({
  front: Object.freeze({ id: 'front', label: 'Front', azimuthRad: 0, polarElevationRad: 0.10, distance: 4.6 }),
  three_quarter: Object.freeze({ id: 'three_quarter', label: 'Three-Quarter', azimuthRad: 0.62, polarElevationRad: 0.14, distance: 4.7 }),
  side: Object.freeze({ id: 'side', label: 'Side', azimuthRad: Math.PI / 2, polarElevationRad: 0.10, distance: 4.6 }),
  back: Object.freeze({ id: 'back', label: 'Back', azimuthRad: Math.PI, polarElevationRad: 0.12, distance: 4.6 })
});

export const ADJIE_PROTOTYPE_POSES = Object.freeze({
  standing: Object.freeze({ id: 'standing', label: 'Standing', animState: 'idle', isSitting: false }),
  walking: Object.freeze({ id: 'walking', label: 'Walking', animState: 'walking', isSitting: false }),
  sitting: Object.freeze({ id: 'sitting', label: 'Sitting', animState: 'sitting', isSitting: true }),
  greeting: Object.freeze({ id: 'greeting', label: 'Greeting', animState: 'greeting', isSitting: false })
});

/**
 * Resolves whether a character .glb model is present from /api/assets/status.
 * Handles both filename keys ('groom.glb', used by server.ts) and role keys ('groom').
 */
export function isModelAssetAvailable(statusPayload, role, filename = '') {
  const chars = statusPayload && statusPayload.models && statusPayload.models.characters;
  if (!chars || typeof chars !== 'object') return false;
  if (filename && typeof chars[filename] === 'boolean') return chars[filename];
  if (role && typeof chars[role] === 'boolean') return chars[role];
  if (role && typeof chars[`${role}.glb`] === 'boolean') return chars[`${role}.glb`];
  return false;
}

/**
 * Computes safe uniform scale factor from measured bounding box height to target world meters.
 */
export function computeUniformModelScale(measuredHeightMeters, targetHeightMeters = 2.34) {
  if (typeof measuredHeightMeters !== 'number' || !Number.isFinite(measuredHeightMeters) || measuredHeightMeters <= 0.05) {
    return 1;
  }
  if (typeof targetHeightMeters !== 'number' || !Number.isFinite(targetHeightMeters) || targetHeightMeters <= 0.05) {
    return 1;
  }
  return targetHeightMeters / measuredHeightMeters;
}

/**
 * Infers semantic PBR category from material/mesh naming conventions in exported Blender GLBs.
 */
export function classifyCharacterMaterialKind(materialName = '', meshName = '') {
  const token = `${materialName} ${meshName}`.toLowerCase();
  if (/skin|face|head|neck|hand|arm_skin|ear|lip/.test(token)) return 'skin';
  if (/hair|brow|lash|beard|mustache/.test(token)) return 'hair';
  if (/gold|brass|button|brooch|chain|emblem|metal|ring|crown/.test(token)) return 'metalAccent';
  return 'fabric';
}
