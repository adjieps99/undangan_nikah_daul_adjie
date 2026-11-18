# Phase 16F — Head & Hair Refinement

## Goal

Refine only the V3 head presentation while preserving the approved body geometry below the neck, animation rig, seating anchors, outfits, and wedding environment.

## What changed

### 1. Scalp geometry

- Replaced the old scalp interpolation that pulled every U/longitude toward one back-of-head point.
- Scalp rings now interpolate in polar angle while preserving their azimuth, so front, sides, and back remain distinct all the way to the crown.
- Reduced the hairline shell offset and removed the old negative edge blend that could tuck the surface into the head unpredictably.

### 2. Face

- Removed the cheek/chin vertex-colour tint from the V3 head mesh.
- The face now uses the existing single matte skin material directly; no skin texture, pores, bump map, or colour overlay is applied in V3.
- Slightly reduced eye and eyelid size and softened lash thickness.
- Kept the existing jaw, cheek, nose, mouth, and facial placement logic.
- Slimmed the optional glasses frame so it does not dominate the face.

### 3. Hairstyles

- Removed the duplicate spherical crown caps that made hair look like a helmet.
- Short hair now uses a clean scalp shell, a restrained front sweep above the eyebrows, and slim sideburns.
- Long hair now uses a rear hair mass and narrow side locks behind the ears.
- Wavy hair uses a rear mass and a small number of slim rear-facing wave locks.
- Bun hair uses a compact rear bun.
- Songkok remains supported and sits over the scalp shell.

### 4. Hijab

- Rebuilt the hijab from a fitted crown shell, a separate face-opening border, two side pashmina panels, and a neck drape.
- The face opening is projected onto the actual head ellipsoid with a small outward fabric clearance.
- Moved the neck drape below the chin so it cannot cover the lower face.
- Hijab forces the feminine head silhouette locally without changing the approved body profile.

### 5. Live scene integration

- Main Hall player, groom, bride, and seated guest avatars now explicitly use procedural V3.
- `Avatar3D` defaults to V3 when no version is supplied.
- The Adjie Prototype page still allows V1/V2/V3 comparison.

## Files changed

- `static/js/characters/StylizedMathV3.js`
- `static/js/characters/StylizedGeometryV3.js`
- `static/js/characters/Avatar3D.js`
- `static/js/three/CharacterController.js`
- `static/js/views/MainHallView.js`
- `static/js/views/AdjiePrototypeView.js`
- `tests/core.test.ts`
- `package.json`
- `RUN_LOCAL.md`

## Validation performed in the build workspace

- JavaScript syntax checks passed for all modified runtime modules.
- Core tests passed: 13/13 using Node 22 native TypeScript stripping (`node --experimental-strip-types --test tests/core.test.ts`).
- A full `npm install`, `npm run lint`, and browser/WebGL screenshot run could not be completed in this isolated workspace because external package/CDN hosts were not reachable. Run the documented install and checks in the user's Anaconda `undangan` environment.

## Protected areas

No edits were made to V3 torso, arm, leg, animation, `SeatingAnchor`, `CharacterController` movement/seat math, wedding data, venue geometry, RSVP logic, or existing audio files. The compact source archive's audio folder remains empty as supplied.
