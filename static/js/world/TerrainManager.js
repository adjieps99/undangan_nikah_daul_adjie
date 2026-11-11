/**
 * TerrainManager - Single Source of Truth for World Elevation, Walkability, and Collision Physics.
 * Coordinates are 100% unified with HachiGarden3D, CharacterController, CameraController, and InteractionSystem.
 */
export class TerrainManager {
  /**
   * Get exact ground elevation Y at given (x, z) coordinates.
   */
  static getHeight(x, z) {
    // 1. Top Grand Terrace: The Hachi Garden Restaurant (y = 5.0)
    // Extent: x in [-30, 30], z <= -14
    if (z <= -14.0 && x >= -30 && x <= 30) {
      return 5.0;
    }

    // Grand Central Staircase connecting Central Garden (y=2.0) to The Hachi (y=5.0)
    // Runs from z = -6.0 down to z = -14.0, x in [-3.8, 3.8] (width 7.6m)
    if (z <= -6.0 && z >= -14.0 && x >= -3.8 && x <= 3.8) {
      const t = (-6.0 - z) / 8.0; // 0.0 at z=-6.0, 1.0 at z=-14.0
      return 2.0 + Math.max(0, Math.min(1, t)) * (5.0 - 2.0);
    }

    // 2. Culinary Terrace: Food Court Favorit (y = 3.2, x in [-34, -14], z in [-18, -2])
    if (x <= -14.0 && x >= -34.0 && z >= -18.0 && z <= -2.0) {
      return 3.2;
    }

    // Staircase 3: Connecting Central Terrace (y=2.0, x=-8.0) up to Food Court (y=3.2, x=-14.5)
    // Runs along x in [-14.5, -8.0], z in [-6.8, -1.2]
    if (x <= -8.0 && x >= -14.5 && z >= -6.8 && z <= -1.2) {
      const t = (-8.0 - x) / 6.5; // 0.0 at x=-8.0, 1.0 at x=-14.5
      return 2.0 + Math.max(0, Math.min(1, t)) * (3.2 - 2.0);
    }

    // 3. Music Lounge Terrace: Listening Station (y = 1.0, x in [-34, -14], z in [0, 16])
    if (x <= -14.0 && x >= -34.0 && z >= 0.0 && z <= 16.0) {
      return 1.0;
    }

    // Staircase 2: Connecting Central Terrace (y=2.0, x=-8.0) down to Music Terrace (y=1.0, x=-13.0)
    // Runs along x in [-13.0, -8.0], z in [5.8, 10.2]
    if (x <= -8.0 && x >= -13.0 && z >= 5.8 && z <= 10.2) {
      const t = (-8.0 - x) / 5.0; // 0.0 at x=-8.0, 1.0 at x=-13.0
      return 2.0 - Math.max(0, Math.min(1, t)) * (2.0 - 1.0);
    }

    // 4. Central Garden & East Wing Terrace (y = 2.0, x in [-14, 28], z in [-6, 18])
    if (x >= -14.0 && x <= 28.0 && z >= -6.0 && z <= 18.0) {
      return 2.0;
    }

    // Staircase 1: Connecting Entrance Plaza (y=0.0, z=24.0) up to Central Garden (y=2.0, z=18.0)
    // Runs along z in [18.0, 24.0], x in [-3.2, 3.2]
    if (x >= -3.2 && x <= 3.2 && z >= 18.0 && z <= 24.0) {
      const t = (24.0 - z) / 6.0; // 0.0 at z=24.0, 1.0 at z=18.0
      return Math.max(0, Math.min(1, t)) * 2.0;
    }

    // 5. Entrance Plaza & Arrival Promenade (y = 0.0, z in [24, 38], x in [-16, 16])
    if (z >= 24.0 && z <= 38.0 && x >= -16.0 && x <= 16.0) {
      return 0.0;
    }

    // Lower natural lawn default
    return 0.0;
  }

  /**
   * Determine if coordinate (x, z) is a valid, paved walkable path or terrace promenade.
   */
  static isWalkable(x, z) {
    // 1. Entrance Plaza & Arrival Promenade (y = 0.0)
    if (x >= -10 && x <= 10 && z >= 24 && z <= 36) return true;

    // 2. Staircase 1 (Entrance to Central Garden)
    if (x >= -3.5 && x <= 3.5 && z >= 17.5 && z <= 24.5) return true;

    // 3. Central Promenade Spine (x: -3.0 to 3.0, z: -6.0 to 18.0)
    if (x >= -3.0 && x <= 3.0 && z >= -6.0 && z <= 18.0) return true;

    // 4. Central Junction Hub (z: 5.5 to 10.5, x: -9 to 9)
    if (x >= -9.0 && x <= 9.0 && z >= 5.5 && z <= 10.5) return true;

    // 5. West Secondary Path to Music Lounge & Staircase 2
    if (x >= -32.0 && x <= -8.0 && z >= 5.0 && z <= 11.0) return true;
    // Music Lounge Plaza (12m diameter centered at x = -24, z = 8)
    if (Math.hypot(x - (-24), z - 8) <= 6.5) return true;

    // 6. West Secondary Path to Food Court & Staircase 3
    // Main pathway connector & Staircase 3 (x: -15.5 to -3.0, z: -7.0 to -1.0)
    if (x >= -15.5 && x <= -3.0 && z >= -7.0 && z <= -1.0) return true;
    // Food Court Landing Platform / Bordes & Connector Walkway (x: -20.0 to -14.0, z: -9.5 to -1.0)
    if (x >= -20.0 && x <= -14.0 && z >= -9.5 && z <= -1.0) return true;
    // Food Court Walkway & Dining Deck (x: -34 to -14, z: -17 to -4)
    if (x >= -34.0 && x <= -14.0 && z >= -17.0 && z <= -4.0) return true;

    // 7. East Secondary Path to Photo Gallery (x: 2.5 to 24, z: 5.5 to 10.5)
    if (x >= 2.5 && x <= 24.0 && z >= 5.5 && z <= 10.5) return true;

    // 8. East Secondary Path to Couple Profile Pavilion (x: 2.5 to 24, z: -8.5 to -3.5)
    if (x >= 2.5 && x <= 24.0 && z >= -8.5 && z <= -3.5) return true;

    // 9. Grand Central Staircase to Restaurant
    if (x >= -4.0 && x <= 4.0 && z >= -14.5 && z <= -5.5) return true;

    // 10. The Hachi Restaurant Forecourt Deck & Promenade (y = 5.0)
    if (x >= -26.0 && x <= 26.0 && z >= -22.0 && z <= -13.5) return true;

    return false;
  }

  /**
   * Check collision against solid physical obstacles (retaining walls, buildings, furniture).
   */
  static checkCollision(x, z, radius = 0.4) {
    // World Boundaries
    if (x < -42 || x > 42 || z < -38 || z > 38) return true;

    // Must be inside designated walkable zones
    if (!this.isWalkable(x, z)) return true;

    // 1. Listening Station turntable pedestal (centered at x = -24, z = 8)
    if (Math.hypot(x - (-24), z - 8) < 1.2) return true;

    // 2. Couple Profile centerpiece easel (centered at x = 18, z = -6)
    if (Math.hypot(x - 18, z - (-6)) < 1.2) return true;

    // 3. Photo Gallery wall back structure (at x = 22.0, z in [5, 11])
    if (x >= 21.0 && x <= 23.0 && z >= 5.0 && z <= 11.0) return true;

    // 4. Food Court back kitchen serving counter (at x in [-30, -26], z in [-12, -8])
    if (x <= -26.5 && z >= -12.5 && z <= -7.5) return true;

    // 5. The Hachi Garden Restaurant Front Solid Walls (Doors at x in [-2.4, 2.4], z = -16.2)
    if (z < -16.5) {
      if (Math.abs(x) > 2.4) return true; // Solid glass and steel facade
      if (z < -19.5) return true; // Interior reception wall
    }

    return false;
  }
}
