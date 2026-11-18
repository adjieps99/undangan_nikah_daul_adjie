import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INVITATION_CATEGORIES,
  GUEST_GROUPS,
  sanitizeGuestText,
  normalizeInvitationCategory,
  getMaxGuestQuota,
  buildGuestStorageKey,
  validateRsvpPayload
} from '../static/js/utils/rsvpContract.js';

import {
  AVATAR_RIG_DIMENSIONS,
  computeGlbSeatingAlignment,
  computeSeatingRigPose
} from '../static/js/characters/SeatingAnchor.js';
import {
  ADJIE_PROTOTYPE_POSES,
  ADJIE_PROTOTYPE_VIEWS,
  STYLE_C_STANDARD,
  classifyCharacterMaterialKind,
  computeUniformModelScale,
  isModelAssetAvailable
} from '../static/js/characters/CharacterPipeline.js';
import {
  STYLIZED_V2_PROPORTIONS,
  computeStylizedFaceTint,
  computeStylizedHeadVertex,
  dampValue,
  resolveWalkingAnimPhase,
  sampleStylizedCrossSectionPoint
} from '../static/js/characters/StylizedMath.js';
import {
  STYLIZED_V3_PROPORTIONS,
  computeV3FaceTint,
  computeV3HeadVertex,
  resolveV3SilhouetteProfile,
  sampleHijabAperturePoint,
  sampleHijabHoodPoint,
  sampleScalpHairlinePoint
} from '../static/js/characters/StylizedMathV3.js';

import { TerrainManager } from '../static/js/world/TerrainManager.js';
import { WEDDING_DATA } from '../static/js/data/wedding.js';
import { ASSET_MANIFEST, getTrackFilename } from '../static/js/config/assetManifest.js';
import { shouldPreservePlaybackOnSelect, shouldResumeBgmAfterVoice } from '../static/js/game/AudioSystem.js';
import { isVegetationSpotClear } from '../static/js/world/GardenClearance.js';
import {
  OUTDOOR_EXIT_SPAWN,
  OUTDOOR_EXIT_CAMERA_CONFIG,
  MAIN_HALL_BOUNDS,
  MAIN_HALL_INTRO_CONFIG,
  clampMainHallCameraPosition,
  interpolateSphericalReveal,
  isPointInsideHachiBuilding
} from '../static/js/three/CameraFraming.js';

test('rsvpContract separates invitation_category (A/B) from optional guest_group (Keluarga/Teman)', () => {
  assert.equal(getMaxGuestQuota(INVITATION_CATEGORIES.A), 2);
  assert.equal(getMaxGuestQuota(INVITATION_CATEGORIES.B), 1);
  assert.equal(normalizeInvitationCategory('b'), 'B');
  assert.equal(normalizeInvitationCategory('invalid'), 'A');

  const validCatA = validateRsvpPayload({
    guest_name: 'Raka Pratama',
    attending: 1,
    guest_count: 2,
    invitation_category: 'A'
  });
  assert.equal(validCatA.valid, true);
  if (validCatA.valid) {
    assert.equal(validCatA.normalized.invitation_category, 'A');
    assert.equal(validCatA.normalized.guest_count, 2);
    assert.equal(validCatA.normalized.guest_group, null);
  }

  const validCatB = validateRsvpPayload({
    guest_name: 'Sinta Dewi',
    attending: 1,
    guest_count: 1,
    invitation_category: 'B',
    guest_group: GUEST_GROUPS.TEMAN
  });
  assert.equal(validCatB.valid, true);
  if (validCatB.valid) {
    assert.equal(validCatB.normalized.invitation_category, 'B');
    assert.equal(validCatB.normalized.guest_count, 1);
    assert.equal(validCatB.normalized.guest_group, 'Teman');
  }

  // Category B attempting 2 guests must fail with 422
  const overQuotaB = validateRsvpPayload({
    guest_name: 'Sinta Dewi',
    attending: 1,
    guest_count: 2,
    invitation_category: 'B'
  });
  assert.equal(overQuotaB.valid, false);
  if (!overQuotaB.valid) {
    assert.equal(overQuotaB.status, 422);
  }

  // Category A attempting 3 guests must fail with 422
  const overQuotaA = validateRsvpPayload({
    guest_name: 'Budi Santoso',
    attending: 1,
    guest_count: 3,
    invitation_category: 'A'
  });
  assert.equal(overQuotaA.valid, false);
  if (!overQuotaA.valid) {
    assert.equal(overQuotaA.status, 422);
  }
});

test('rsvpContract isolates storage keys per guest identity and strips control chars', () => {
  const clean = sanitizeGuestText('  Budi\u0000\u0007 Santoso  ');
  assert.equal(clean, 'Budi Santoso');

  const keyGuest1 = buildGuestStorageKey('Budi Santoso', 'A');
  const keyGuest2 = buildGuestStorageKey('Budi Santoso', 'B');
  const keyGuest3 = buildGuestStorageKey('Sinta Dewi', 'B');
  const keyInviteCode = buildGuestStorageKey('Sinta Dewi', 'B', 'VIP-04');

  assert.notEqual(keyGuest1, keyGuest2);
  assert.notEqual(keyGuest2, keyGuest3);
  assert.notEqual(keyGuest3, keyInviteCode);
});

test('SeatingAnchor places sitting hips flush on chair cushion and soles flush on floor without 40cm floating', () => {
  const chairCushionTopY = 0.475;
  const floorY = 0.0;
  const pose = computeSeatingRigPose({
    cushionTopY: chairCushionTopY,
    supportFloorY: floorY,
    seatCenterX: -3.2,
    seatCenterZ: 1.5,
    faceAngle: Math.PI / 2
  });

  assert.equal(pose.rootPosition.y, floorY);

  const expectedHipY = chairCushionTopY + AVATAR_RIG_DIMENSIONS.THIGH_RADIUS_AT_HIP - 0.015;
  assert.ok(Math.abs(pose.targetHipWorldY - expectedHipY) < 0.0001);

  const thighBottomY = pose.targetHipWorldY - AVATAR_RIG_DIMENSIONS.THIGH_RADIUS_AT_HIP;
  assert.ok(Math.abs(thighBottomY - (chairCushionTopY - 0.015)) < 0.001);

  assert.ok(pose.verticalShoeClearance >= 0 && pose.verticalShoeClearance < 0.03);

  const pelaminanPose = computeSeatingRigPose({
    cushionTopY: 0.74,
    supportFloorY: 0.36,
    seatCenterX: -0.65,
    seatCenterZ: -9.5,
    faceAngle: 0
  });
  assert.equal(pelaminanPose.rootPosition.y, 0.36);
  assert.ok(pelaminanPose.kneeBendX < Math.PI / 2 && pelaminanPose.kneeBendX > 0.4);
});

test('TerrainManager walkability, Staircase 2 continuity, and resolveFilteredGroundHeight', () => {
  assert.equal(TerrainManager.checkCollision(0, 28), false);
  assert.equal(TerrainManager.checkCollision(0, 14), false);
  assert.equal(TerrainManager.checkCollision(0, -14.5), false);

  assert.equal(TerrainManager.getHeight(0, 26), 0.0);
  assert.equal(TerrainManager.getHeight(0, 10), 2.0);
  assert.equal(TerrainManager.getHeight(0, -15), 5.0);

  let prevY = TerrainManager.getHeight(-8.5, 8.0);
  assert.equal(prevY, 2.0);
  for (let x = -8.75; x >= -15.0; x -= 0.25) {
    assert.equal(TerrainManager.checkCollision(x, 8.0), false);
    const curY = TerrainManager.getHeight(x, 8.0);
    assert.ok(curY <= prevY + 1e-6, `Expected monotonic descent at x=${x}, got ${curY} > ${prevY}`);
    assert.ok(curY >= 1.0 - 1e-6 && curY <= 2.0 + 1e-6);
    prevY = curY;
  }
  assert.equal(TerrainManager.getHeight(-14.0, 8.0), 1.0);

  // Filtered raycast resolution: accepts stone paving top (+0.04m) and rejects extreme spikes
  assert.equal(TerrainManager.resolveFilteredGroundHeight(0, 10, 2.04), 2.04);
  assert.equal(TerrainManager.resolveFilteredGroundHeight(0, 10, 5.2), 2.0);
  assert.equal(TerrainManager.resolveFilteredGroundHeight(0, 10, null), 2.0);
});

test('wedding data preserves official couple details, attire rules, 6 favorite restaurants, and exact 5-track playlist', () => {
  assert.equal(WEDDING_DATA.couple.groom.fullName, 'Adjie Prasatia Sakti');
  assert.equal(WEDDING_DATA.couple.groom.avatarConfig.outfit, 'beskap_hitam');
  assert.equal('attireLabel' in WEDDING_DATA.couple.groom, false);
  assert.equal(WEDDING_DATA.couple.bride.fullName, 'Daulika Pratiwi');
  assert.equal(WEDDING_DATA.couple.bride.avatarConfig.outfit, 'kebaya_putih');
  assert.notEqual(WEDDING_DATA.couple.bride.avatarConfig.hairStyle, 'hijab');
  assert.equal('attireLabel' in WEDDING_DATA.couple.bride, false);
  assert.equal(WEDDING_DATA.schedule.event.title, 'Akad Nikah & Ramah Tamah');
  assert.equal(WEDDING_DATA.schedule.event.date, 'Sabtu, 5 Desember 2026');
  assert.equal(WEDDING_DATA.schedule.event.time, '08.30 - 13.00 WIB');
  assert.equal(WEDDING_DATA.venue.name, 'The Hachi Garden Ampera');

  assert.equal(WEDDING_DATA.playlist.length, 5);
  assert.equal(WEDDING_DATA.playlist[0].title, 'Langit Merah Muda');
  assert.equal(WEDDING_DATA.playlist[0].artist, 'Afgan');
  assert.equal(WEDDING_DATA.playlist[0].isDefault, true);
  assert.equal(WEDDING_DATA.playlist[4].title, 'Just You');
  assert.equal(WEDDING_DATA.playlist[4].artist, 'Teddy Aditya');

  assert.equal(Array.isArray(WEDDING_DATA.favoriteRestaurants), true);
  assert.equal(WEDDING_DATA.favoriteRestaurants.length, 6);
  const expectedRestaurants = [
    { name: 'Martabak San Fransisco', url: 'https://share.google/67KGEGQkmw9iKx4Og' },
    { name: 'Sate Rembiga Ibu Sinnaseh', url: 'https://share.google/P6ErOlDmWjit3enqu' },
    { name: 'Spesial Soto Boyolali (SSB) Hj Hesti', url: 'https://share.google/e4QDt7v5I2z7pVBXG' },
    { name: "Scarlett's House", url: 'https://share.google/gzmH8GyjamnXyv1vr' },
    { name: 'Seafood Ayu', url: 'https://share.google/XpDKQXd4eWo4Cg3cm' },
    { name: 'Rumah Makan Karya Bundo', url: 'https://share.google/Wm3DYP8YlqDnqKVzN' }
  ];
  expectedRestaurants.forEach((exp, idx) => {
    const place = WEDDING_DATA.favoriteRestaurants[idx];
    assert.equal(place.name, exp.name);
    assert.equal(place.mapsUrl, exp.url);
    assert.equal(Array.isArray(place.mustTry), true);
    assert.ok(place.mustTry.length >= 2, `${place.name} must have mustTry recommendations`);
    assert.equal(typeof place.note, 'string');
    assert.ok(place.note.length > 20, `${place.name} must have personal recommendation note`);
    assert.equal(/rp\s*\d|harga|murah|mahal|kolesterol|penyakit/i.test(place.note), false);
  });
  const karyaBundo = WEDDING_DATA.favoriteRestaurants[5];
  assert.ok(/SERA/i.test(karyaBundo.note) && /JakLingko/i.test(karyaBundo.note));
});

test('ASSET_MANIFEST binds default opening track and exact audio/image/model paths', () => {
  assert.equal(ASSET_MANIFEST.audio.defaultTrackFilename, '01_langit_merah_muda.mp3');
  assert.equal(ASSET_MANIFEST.audio.defaultTrackUrl, '/static/audio/tracks/01_langit_merah_muda.mp3');
  assert.equal(ASSET_MANIFEST.audio.playlist.length, 5);
  assert.equal(getTrackFilename(ASSET_MANIFEST.audio.playlist[0]), '01_langit_merah_muda.mp3');
  assert.equal(ASSET_MANIFEST.models.characters.guest.url, '/static/models/characters/guest.glb');
  assert.equal(ASSET_MANIFEST.models.characters.groom.url, '/static/models/characters/groom.glb');
  assert.equal(ASSET_MANIFEST.models.characters.bride.url, '/static/models/characters/bride.glb');
});

test('shouldPreservePlaybackOnSelect keeps Langit Merah Muda playing seamlessly when Listening Station opens', () => {
  assert.equal(
    shouldPreservePlaybackOnSelect({
      currentIndex: 0,
      targetIndex: 0,
      restartIfSame: false,
      hasLoadedSource: true,
      availability: 'available'
    }),
    true
  );

  assert.equal(
    shouldPreservePlaybackOnSelect({
      currentIndex: 0,
      targetIndex: 1,
      restartIfSame: false,
      hasLoadedSource: true,
      availability: 'available'
    }),
    false
  );

  assert.equal(
    shouldPreservePlaybackOnSelect({
      currentIndex: 0,
      targetIndex: 0,
      restartIfSame: true,
      hasLoadedSource: true,
      availability: 'available'
    }),
    false
  );
});

test('shouldResumeBgmAfterVoice coordinates Voice Recording <-> BGM resume safely without overriding manual user pause', () => {
  // Resumes when voice paused active BGM and guest did not pause music manually
  assert.equal(
    shouldResumeBgmAfterVoice({ pausedByVoice: true, userPausedMusic: false, bgmCurrentlyPaused: true }),
    true
  );

  // Never auto-resumes if guest had manually paused BGM beforehand
  assert.equal(
    shouldResumeBgmAfterVoice({ pausedByVoice: false, userPausedMusic: true, bgmCurrentlyPaused: true }),
    false
  );

  // Never resumes if guest paused BGM during or after voice greeting
  assert.equal(
    shouldResumeBgmAfterVoice({ pausedByVoice: true, userPausedMusic: true, bgmCurrentlyPaused: true }),
    false
  );

  // No-op if BGM is already playing
  assert.equal(
    shouldResumeBgmAfterVoice({ pausedByVoice: true, userPausedMusic: false, bgmCurrentlyPaused: false }),
    false
  );
});

test('GardenClearance keeps pathways, plazas, stairs, and Hachi forecourt clear of bushes while allowing outer slopes', () => {
  assert.equal(isVegetationSpotClear(0, 10, 1.35), false);   // Central spine
  assert.equal(isVegetationSpotClear(-16, 8, 1.35), false); // Music lounge path
  assert.equal(isVegetationSpotClear(-24, 8, 1.35), false); // Music plaza
  assert.equal(isVegetationSpotClear(-20, -10, 1.35), false); // Food court plaza
  assert.equal(isVegetationSpotClear(0, -15, 1.35), false); // Hachi forecourt
  assert.equal(isVegetationSpotClear(18, -6, 1.35), false); // Profile pavilion
  assert.equal(isVegetationSpotClear(18, 8, 1.35), false);  // Photo gallery

  // Outer agricultural tea slopes should be clear
  assert.equal(isVegetationSpotClear(-35, 32, 1.35), true);
  assert.equal(isVegetationSpotClear(33, 14, 1.35), true);
});

test('CameraFraming guarantees unobstructed +Z outdoor exit view and ceiling-safe Main Hall intro bounds', () => {
  // Outdoor exit camera at end of reveal sits on +Z side (outside Hachi building box)
  const exitReveal = interpolateSphericalReveal(OUTDOOR_EXIT_CAMERA_CONFIG, 1);
  const camX = OUTDOOR_EXIT_SPAWN.x + Math.sin(exitReveal.yaw) * Math.cos(exitReveal.pitch) * exitReveal.radius;
  const camY = OUTDOOR_EXIT_SPAWN.y + Math.sin(exitReveal.pitch) * exitReveal.radius + 1.6;
  const camZ = OUTDOOR_EXIT_SPAWN.z + Math.cos(exitReveal.yaw) * Math.cos(exitReveal.pitch) * exitReveal.radius;

  assert.ok(camZ > -10, `Expected outdoor exit camera on +Z open garden side, got z=${camZ}`);
  assert.equal(isPointInsideHachiBuilding(camX, camY, camZ), false);

  // Main Hall camera clamping stays cleanly under rafters (y <= 5.10) and within room walls
  const clamped = clampMainHallCameraPosition({ x: 40, y: 12, z: -30 });
  assert.equal(clamped.x, MAIN_HALL_BOUNDS.maxX);
  assert.equal(clamped.y, MAIN_HALL_BOUNDS.maxY);
  assert.equal(clamped.z, MAIN_HALL_BOUNDS.minZ);
  assert.ok(MAIN_HALL_INTRO_CONFIG.duration > 1.0);
});

test('CharacterPipeline resolves /api/assets/status filename keys, scaling, PBR kind, and GLB seating alignment', () => {
  const serverStatusMock = {
    status: 'ok',
    models: {
      characters: {
        'guest.glb': false,
        'groom.glb': true,
        'bride.glb': false
      }
    }
  };

  assert.equal(isModelAssetAvailable(serverStatusMock, 'groom', 'groom.glb'), true);
  assert.equal(isModelAssetAvailable(serverStatusMock, 'groom'), true);
  assert.equal(isModelAssetAvailable(serverStatusMock, 'bride', 'bride.glb'), false);
  assert.equal(isModelAssetAvailable(null, 'groom', 'groom.glb'), false);

  assert.equal(computeUniformModelScale(1.76, 1.76), 1);
  assert.ok(Math.abs(computeUniformModelScale(1.76, 2.34) - 1.329545) < 0.001);
  assert.equal(computeUniformModelScale(0, 1.76), 1);

  assert.equal(classifyCharacterMaterialKind('M_Skin_Head', 'Adjie_Head'), 'skin');
  assert.equal(classifyCharacterMaterialKind('M_Hair_Short', 'Hair'), 'hair');
  assert.equal(classifyCharacterMaterialKind('M_Gold_Buttons', 'Beskap_Chain'), 'metalAccent');
  assert.equal(classifyCharacterMaterialKind('M_Beskap_Velvet', 'Torso'), 'fabric');

  // GLB seating alignment must never inherit procedural -0.44m hip drop
  const banquetGlb = computeGlbSeatingAlignment({ cushionTopY: 0.475, supportFloorY: 0.0 });
  assert.ok(Math.abs(banquetGlb.glbRootOffsetY - 0.025) < 0.001);

  const pelaminanPose = computeSeatingRigPose({
    cushionTopY: 0.74,
    supportFloorY: 0.36,
    seatCenterX: 0.62,
    seatCenterZ: -14.15,
    faceAngle: 0
  });
  assert.ok(pelaminanPose.glbRootOffsetY >= -0.04 && pelaminanPose.glbRootOffsetY <= 0.05);
  assert.ok(pelaminanPose.hipOffsetY < -0.5); // procedural offset unchanged

  assert.equal(STYLE_C_STANDARD.id, 'STYLE_C_SEMI_REALISTIC_CINEMATIC');
  assert.deepEqual(Object.keys(ADJIE_PROTOTYPE_VIEWS), ['front', 'three_quarter', 'side', 'back']);
  assert.deepEqual(Object.keys(ADJIE_PROTOTYPE_POSES), ['standing', 'walking', 'sitting', 'greeting']);
});

test('StylizedMath defines Sims-inspired adult proportions, SeatingAnchor leg compatibility, sculpted face clearances, and smooth animation math', () => {
  // Sole reaches y=0 cleanly so SeatingAnchor floor alignment works seamlessly
  const soleY = STYLIZED_V2_PROPORTIONS.HIP_PIVOT_Y - STYLIZED_V2_PROPORTIONS.THIGH_LENGTH - STYLIZED_V2_PROPORTIONS.CALF_PLUS_SHOE;
  assert.ok(Math.abs(soleY) < 1e-6);

  // Stylized adult head-to-body ratio ~6.4-6.8 heads tall (not oversized 5.0 puppet sphere)
  const headFullHeight = STYLIZED_V2_PROPORTIONS.HEAD_RADIUS_Y * 2;
  const headsTall = STYLIZED_V2_PROPORTIONS.TOTAL_STANDING_HEIGHT / headFullHeight;
  assert.ok(headsTall >= 6.2 && headsTall <= 7.2, `Expected stylized adult ratio 6.2-7.2, got ${headsTall}`);

  // Hairline clearance stays comfortably behind front face plane
  assert.ok(STYLIZED_V2_PROPORTIONS.HAIR_FRONT_Z_CLEARANCE < 0.11);

  // Sculpted head tapers jaw cleanly below cheek level and recesses eye sockets relative to brow ridge
  const templePt = computeStylizedHeadVertex(1, 0.25, 0);
  const jawPt = computeStylizedHeadVertex(1, -0.75, 0);
  assert.ok(Math.abs(jawPt.x) < Math.abs(templePt.x), 'Jawline must taper inward relative to upper cranium');

  const socketPt = computeStylizedHeadVertex(0.33, 0.12, 0.93);
  const browPt = computeStylizedHeadVertex(0.31, 0.29, 0.90);
  assert.ok(socketPt.z < browPt.z, 'Orbital eye socket should be slightly recessed beneath brow ridge');

  // Cross-section front bulge & back spine indentation work properly
  const frontChest = sampleStylizedCrossSectionPoint({ y: 0.58, rx: 0.22, rz: 0.13, frontBulge: 0.02, backIndent: 0.01 }, Math.PI / 2);
  const backSpine = sampleStylizedCrossSectionPoint({ y: 0.58, rx: 0.22, rz: 0.13, frontBulge: 0.02, backIndent: 0.01 }, -Math.PI / 2);
  assert.ok(frontChest.z > 0.14);
  assert.ok(backSpine.z > -0.13);

  // Walking phase advances monotonically with animTime even when isWalkingView is true (fixes frozen 1.05 bug)
  const p1 = resolveWalkingAnimPhase(1.0, { isWalkingView: true });
  const p2 = resolveWalkingAnimPhase(2.5, { isWalkingView: true });
  assert.ok(p2 > p1);

  // Exponential smoothing moves monotonically toward target and never overshoots
  const d1 = dampValue(0, 1.0, 10, 0.016);
  const d2 = dampValue(d1, 1.0, 10, 0.016);
  assert.ok(d1 > 0 && d1 < d2 && d2 < 1.0);

  // Face tint adds subtle rosy warmth on cheeks and subtle shadow beneath jaw
  const cheekTint = computeStylizedFaceTint(0.45, -0.15, 0.88);
  const chinTint = computeStylizedFaceTint(0, -0.95, 0.25);
  assert.ok(cheekTint.r > cheekTint.g && cheekTint.r > 1.0);
  assert.ok(chinTint.r < 1.0 && chinTint.b < 1.0);
});

test('StylizedMathV3 enforces ~7.18-heads natural human proportions, SeatingAnchor sole=0, dimorphism, and 100% open-face hair/hijab clearances', () => {
  // Sole reaches y=0 cleanly so SeatingAnchor alignment stays intact
  const soleY = STYLIZED_V3_PROPORTIONS.HIP_PIVOT_Y - STYLIZED_V3_PROPORTIONS.THIGH_LENGTH - STYLIZED_V3_PROPORTIONS.CALF_PLUS_SHOE;
  assert.ok(Math.abs(soleY) < 1e-6);

  // ~7.18 heads-tall natural adult ratio
  const headFullHeight = STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Y * 2;
  const headsTall = STYLIZED_V3_PROPORTIONS.TOTAL_STANDING_HEIGHT / headFullHeight;
  assert.ok(headsTall >= 7.0 && headsTall <= 7.4, `Expected ~7.18 heads tall, got ${headsTall}`);

  // Dimorphic silhouette profiles
  const male = resolveV3SilhouetteProfile({ outfit: 'beskap_hitam' });
  const female = resolveV3SilhouetteProfile({ outfit: 'kebaya_putih' });
  assert.equal(male.isFeminine, false);
  assert.equal(female.isFeminine, true);
  assert.ok(male.shoulderHalfWidth > female.shoulderHalfWidth);
  assert.ok(female.waistRx < male.waistRx);
  assert.ok(female.hipRx > male.hipRx);
  assert.ok(male.armRestAbductionZ >= 0.08 && female.armRestAbductionZ >= 0.08);

  // Head jaw taper & orbital recess
  const temple = computeV3HeadVertex(1, 0.20, 0, false);
  const jaw = computeV3HeadVertex(1, -0.78, 0, false);
  assert.ok(Math.abs(jaw.x) < Math.abs(temple.x));

  const socket = computeV3HeadVertex(0.34, 0.10, 0.935, false);
  const brow = computeV3HeadVertex(0.32, 0.29, 0.90, false);
  assert.ok(socket.z < brow.z);

  // Center forehead hairline (u=0, t=0) stays strictly above eyebrows
  const hairlineFront = sampleScalpHairlinePoint(0, 0, 0.011, false);
  assert.ok(
    hairlineFront.y > STYLIZED_V3_PROPORTIONS.BROW_CENTER_Y + 0.03,
    `Hairline (${hairlineFront.y}) must clear eyebrows (${STYLIZED_V3_PROPORTIONS.BROW_CENTER_Y})`
  );

  // Hijab open-face oval aperture clears top forehead, lateral eyes/cheeks, and under-chin
  const hijabTop = sampleHijabAperturePoint(0, true);
  const hijabRight = sampleHijabAperturePoint(Math.PI / 2, true);
  const hijabLeft = sampleHijabAperturePoint((3 * Math.PI) / 2, true);
  const hijabBot = sampleHijabAperturePoint(Math.PI, true);

  assert.ok(hijabTop.y > STYLIZED_V3_PROPORTIONS.BROW_CENTER_Y + 0.03);
  assert.ok(hijabRight.x > STYLIZED_V3_PROPORTIONS.EYE_HALF_SPACING_X + 0.035);
  assert.ok(hijabLeft.x < -(STYLIZED_V3_PROPORTIONS.EYE_HALF_SPACING_X + 0.035));
  assert.ok(hijabBot.y < -0.10);

  // Seam continuity check across u=0 and u=2*PI (no discontinuous slit at forehead center)
  const hijabEnd = sampleHijabAperturePoint(Math.PI * 2, true);
  assert.ok(Math.hypot(hijabTop.x - hijabEnd.x, hijabTop.y - hijabEnd.y, hijabTop.z - hijabEnd.z) < 1e-6);
  const hijabLeftEps = sampleHijabAperturePoint(-1e-4, true);
  const hijabRightEps = sampleHijabAperturePoint(1e-4, true);
  assert.ok(Math.abs(hijabRightEps.x - hijabLeftEps.x) < 1e-4);

  // Spherical hijab hood must strictly wrap outside top crown & back occiput (zero bald skull clipping!)
  const hijabCrown = sampleHijabHoodPoint(0, 0.30, true);
  const hijabBack = sampleHijabHoodPoint(0, 0.95, true);
  assert.ok(hijabCrown.y > STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Y, `Crown hijab y (${hijabCrown.y}) must exceed skull top (${STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Y})`);
  assert.ok(hijabBack.z < -STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Z, `Back hijab z (${hijabBack.z}) must wrap behind occiput`);
  for (const tSample of [0.15, 0.30, 0.50, 0.75]) {
    const pt = sampleHijabHoodPoint(0, tSample, true);
    const normR = Math.hypot(
      pt.x / (STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_X * 0.96),
      pt.y / STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Y,
      pt.z / (STYLIZED_V3_PROPORTIONS.HEAD_RADIUS_Z * 0.97)
    );
    assert.ok(normR > 1.04, `Hijab at t=${tSample} must stay outside skull (normR=${normR})`);
  }

  // Subtle facial warmth tinting
  const cheekTint = computeV3FaceTint(0.44, -0.12, 0.88);
  assert.ok(cheekTint.r > cheekTint.g && cheekTint.r > 1.0);
});
