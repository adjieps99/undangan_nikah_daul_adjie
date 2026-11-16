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
  computeSeatingRigPose
} from '../static/js/characters/SeatingAnchor.js';

import { TerrainManager } from '../static/js/world/TerrainManager.js';
import { WEDDING_DATA } from '../static/js/data/wedding.js';
import { ASSET_MANIFEST, getTrackFilename } from '../static/js/config/assetManifest.js';
import { shouldPreservePlaybackOnSelect } from '../static/js/game/AudioSystem.js';
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

test('wedding data preserves official couple details, attire rules, and exact 5-track playlist', () => {
  assert.equal(WEDDING_DATA.couple.groom.fullName, 'Adjie Prasatia Sakti');
  assert.equal(WEDDING_DATA.couple.groom.avatarConfig.outfit, 'beskap_hitam');
  assert.equal(WEDDING_DATA.couple.bride.fullName, 'Daulika Pratiwi');
  assert.equal(WEDDING_DATA.couple.bride.avatarConfig.outfit, 'kebaya_putih');
  assert.notEqual(WEDDING_DATA.couple.bride.avatarConfig.hairStyle, 'hijab');
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
