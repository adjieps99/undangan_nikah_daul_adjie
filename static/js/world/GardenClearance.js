/**
 * GardenClearance - Rule-driven Spatial Exclusion & Clearance Registry
 * Ensures tea bushes, ornamental shrubs, and trees never overlap paved walkways,
 * staircases, plazas, retaining walls, or landmark footprints.
 */

export const LANDMARK_EXCLUSION_BOXES = Object.freeze([
  // 1. Garden Entrance & Gate Plaza (x in [-7.5, 7.5], z in [24.0, 37.0])
  Object.freeze({ id: 'garden_entrance', minX: -7.5, maxX: 7.5, minZ: 23.5, maxZ: 37.5 }),
  // 2. Central Grand Promenade & Junction Hub
  Object.freeze({ id: 'central_spine', minX: -4.4, maxX: 4.4, minZ: -15.5, maxZ: 24.5 }),
  Object.freeze({ id: 'central_hub', minX: -9.5, maxX: 9.5, minZ: 4.6, maxZ: 11.4 }),
  // 3. West Branch to Music Lounge & Staircase 2
  Object.freeze({ id: 'west_music_corridor', minX: -20.5, maxX: -2.0, minZ: 4.4, maxZ: 11.6 }),
  // 4. West Branch to Food Court & Staircase 3 + Food Court Deck & Promenade
  Object.freeze({ id: 'west_food_stair', minX: -20.0, maxX: -2.0, minZ: -7.4, maxZ: -0.6 }),
  Object.freeze({ id: 'food_court_landmark', minX: -31.8, maxX: -14.2, minZ: -17.5, maxZ: -3.2 }),
  // 5. East Branch to Photo Gallery & Photo Gallery Structure
  Object.freeze({ id: 'east_gallery_corridor', minX: 2.0, maxX: 24.5, minZ: 4.4, maxZ: 11.6 }),
  // 6. East Branch to Couple Profile Pavilion & Pergola Structure
  Object.freeze({ id: 'east_profile_corridor', minX: 2.0, maxX: 24.0, minZ: -11.2, maxZ: -0.8 }),
  // 7. The Hachi Restaurant Forecourt Promenade & Whole Building Footprint
  Object.freeze({ id: 'hachi_forecourt_deck', minX: -22.5, maxX: 22.5, minZ: -18.5, maxZ: -12.6 }),
  Object.freeze({ id: 'hachi_restaurant_building', minX: -16.5, maxX: 16.5, minZ: -34.5, maxZ: -14.0 }),
  // 8. Retaining walls buffer along x = -14 (Food/Music step border) and z = 18 / z = -14
  Object.freeze({ id: 'front_terrace_wall', minX: -14.8, maxX: 28.8, minZ: 16.8, maxZ: 19.2 }),
  Object.freeze({ id: 'hachi_terrace_wall', minX: -30.8, maxX: 30.8, minZ: -15.2, maxZ: -12.8 }),
  Object.freeze({ id: 'west_terrace_wall', minX: -15.2, maxX: -12.8, minZ: -18.5, maxZ: 16.5 })
]);

export const LANDMARK_EXCLUSION_CIRCLES = Object.freeze([
  // Entrance Arrival Plaza (x=0, z=32, r=4.2 + margin)
  Object.freeze({ id: 'entrance_plaza_circle', x: 0, z: 32, radius: 6.2 }),
  // Music Lounge Deck & Plaza (x=-24, z=8, r=6.0 + margin)
  Object.freeze({ id: 'music_plaza_circle', x: -24, z: 8, radius: 7.4 }),
  // Food Court Forecourt & Pavilion (x=-22, z=-10, r=6.5 + margin)
  Object.freeze({ id: 'food_plaza_circle', x: -22, z: -10, radius: 7.5 }),
  // Photo Gallery Plaza (x=18, z=8, r=4.5 + margin)
  Object.freeze({ id: 'gallery_plaza_circle', x: 18, z: 8, radius: 6.2 }),
  // Couple Profile Pavilion Plaza (x=18, z=-4, r=4.5 + margin)
  Object.freeze({ id: 'profile_plaza_circle', x: 18, z: -4, radius: 6.2 })
]);

/**
 * Returns true if placing a bush/shrub/tree at (x, z) with given canopy/footprint radius
 * stays clear of all landmarks, stairs, retaining walls, and paved pathways.
 */
export function isVegetationSpotClear(x, z, clearanceRadius = 1.2) {
  for (const box of LANDMARK_EXCLUSION_BOXES) {
    if (
      x >= box.minX - clearanceRadius &&
      x <= box.maxX + clearanceRadius &&
      z >= box.minZ - clearanceRadius &&
      z <= box.maxZ + clearanceRadius
    ) {
      return false;
    }
  }

  for (const circle of LANDMARK_EXCLUSION_CIRCLES) {
    const dist = Math.hypot(x - circle.x, z - circle.z);
    if (dist < circle.radius + clearanceRadius) {
      return false;
    }
  }

  return true;
}

/**
 * Pathway lantern positions placed strictly on grass margins outside all walkways,
 * staircases, plazas, and landmark decks.
 */
export const PATHWAY_LANTERN_COORDS = Object.freeze([
  // Entrance arrival path flanks
  Object.freeze({ x: -3.6, z: 27.0 }),
  Object.freeze({ x: 3.6, z: 27.0 }),
  // Top of Staircase 1 flanks (grass margins outside Central Spine)
  Object.freeze({ x: -3.6, z: 17.0 }),
  Object.freeze({ x: 3.6, z: 17.0 }),
  // Four grass corners framing the Central Cross Junction (z = 8)
  Object.freeze({ x: -3.6, z: 11.4 }),
  Object.freeze({ x: 3.6, z: 11.4 }),
  Object.freeze({ x: -3.6, z: 4.6 }),
  Object.freeze({ x: 3.6, z: 4.6 }),
  // South grass corners framing the North Cross Junction (z = -4)
  Object.freeze({ x: -3.6, z: -1.1 }),
  Object.freeze({ x: 3.6, z: -1.1 }),
  // Grass margins flanking foot of Staircase 3 (approach to Food Court)
  Object.freeze({ x: -8.2, z: -0.9 }),
  Object.freeze({ x: -8.2, z: -7.1 }),
  // Music Lounge Wing grass margin
  Object.freeze({ x: -16.0, z: 11.4 }),
  // Photo Gallery Wing grass margins
  Object.freeze({ x: 12.8, z: 11.2 }),
  Object.freeze({ x: 12.8, z: 4.8 }),
  // Couple Profile Pavilion approach grass margins (symmetrical around z = -4)
  Object.freeze({ x: 12.8, z: -1.1 }),
  Object.freeze({ x: 12.8, z: -6.9 })
]);

