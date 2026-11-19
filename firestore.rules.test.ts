import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RULES_PATH = path.resolve(process.cwd(), 'firestore.rules');
const BLUEPRINT_PATH = path.resolve(process.cwd(), 'firebase-blueprint.json');

const rulesText = fs.readFileSync(RULES_PATH, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, 'utf8'));

interface MockAuth {
  uid: string;
  email?: string;
  email_verified?: boolean;
}

const REQUEST_TIME = 'SERVER_TIMESTAMP';

function isValidId(id: unknown): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(id);
}

function isValidNumericId(id: unknown): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 4 && /^[0-9]+$/.test(id);
}

function isHighEntropyId(id: unknown): boolean {
  return typeof id === 'string' && id.length >= 24 && id.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(id);
}

function isAdmin(auth: MockAuth | null): boolean {
  return Boolean(auth && auth.email === 'adjieprasatia@gmail.com' && auth.email_verified === true);
}

function hasExactKeys(data: Record<string, unknown>, allowed: string[]): boolean {
  const keys = Object.keys(data);
  return allowed.every((k) => keys.includes(k)) && keys.every((k) => allowed.includes(k));
}

function canCreateWish(wishId: string, data: Record<string, unknown>): boolean {
  if (!isValidId(wishId)) return false;
  if (!hasExactKeys(data, ['sender_name', 'message', 'visibility', 'moderation_status', 'createdAt'])) return false;
  if (typeof data.sender_name !== 'string' || data.sender_name.length < 1 || data.sender_name.length > 80) return false;
  if (typeof data.message !== 'string' || data.message.length < 1 || data.message.length > 500) return false;
  if (data.createdAt !== REQUEST_TIME) return false;
  return (
    (data.visibility === 'PUBLIC' && data.moderation_status === 'APPROVED') ||
    (data.visibility === 'PRIVATE' && data.moderation_status === 'PENDING')
  );
}

function canListWish(auth: MockAuth | null, existing: Record<string, unknown>): boolean {
  return (existing.visibility === 'PUBLIC' && existing.moderation_status === 'APPROVED') || isAdmin(auth);
}

function canCreateRsvp(rsvpId: string, data: Record<string, unknown>): boolean {
  if (!isHighEntropyId(rsvpId)) return false;
  if (!hasExactKeys(data, ['guest_name', 'attending', 'guest_count', 'rsvp_status', 'invitation_category', 'createdAt', 'updatedAt'])) {
    return false;
  }
  if (typeof data.guest_name !== 'string' || data.guest_name.length < 1 || data.guest_name.length > 100) return false;
  if (typeof data.attending !== 'boolean' || !Number.isInteger(data.guest_count)) return false;
  if (data.invitation_category !== 'B') return false;
  if (data.createdAt !== REQUEST_TIME || data.updatedAt !== REQUEST_TIME) return false;
  return (
    (data.attending === true && data.guest_count === 1 && data.rsvp_status === 'WILL_ATTEND') ||
    (data.attending === false && data.guest_count === 0 && data.rsvp_status === 'DECLINED')
  );
}

function canWriteGuestOverride(auth: MockAuth | null, guestNo: string, data: Record<string, unknown>): boolean {
  if (!isAdmin(auth) || !isValidNumericId(guestNo)) return false;
  if (!hasExactKeys(data, ['no', 'guest_name', 'updatedAt'])) return false;
  if (!Number.isInteger(data.no) || (data.no as number) < 1 || (data.no as number) > 500) return false;
  if (Number(guestNo) !== data.no) return false;
  if (typeof data.guest_name !== 'string' || data.guest_name.length < 1 || data.guest_name.length > 100) return false;
  return data.updatedAt === REQUEST_TIME;
}

test('firestore.rules structural guards match firebase-blueprint.json verbatim', () => {
  assert.match(rulesText, /rules_version = '2';/);
  assert.match(rulesText, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
  assert.match(rulesText, /request\.auth\.token\.email == 'adjieprasatia@gmail\.com'/);
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);

  for (const colPath of Object.keys(blueprint.firestore)) {
    assert.ok(rulesText.includes(`match ${colPath}`), `Missing match block for ${colPath}`);
  }

  assert.equal(blueprint.entities.Wish.properties.sender_name.maxLength, 80);
  assert.equal(blueprint.entities.Wish.properties.message.maxLength, 500);
  assert.equal(blueprint.entities.Rsvp.properties.guest_name.maxLength, 100);
  assert.match(rulesText, /data\.sender_name\.size\(\) <= 80/);
  assert.match(rulesText, /data\.message\.size\(\) <= 500/);
  assert.match(rulesText, /data\.guest_name\.size\(\) <= 100/);
});

test('Dirty Dozen adversarial payloads are all rejected (PERMISSION_DENIED)', () => {
  assert.equal(
    canCreateWish('wish_test01', {
      sender_name: 'Budi',
      message: 'Selamat!',
      visibility: 'PUBLIC',
      moderation_status: 'APPROVED',
      createdAt: REQUEST_TIME,
      isAdmin: true
    }),
    false
  );
  assert.equal(
    canCreateWish('wish_test02', {
      sender_name: 'Budi',
      message: 'Pesan rahasia',
      visibility: 'PRIVATE',
      moderation_status: 'APPROVED',
      createdAt: REQUEST_TIME
    }),
    false
  );
  assert.equal(
    canCreateWish('wish_test03', {
      sender_name: 'Budi',
      message: 'Selamat!',
      visibility: 'PUBLIC',
      moderation_status: 'APPROVED',
      createdAt: '2020-01-01T00:00:00Z'
    }),
    false
  );
  assert.equal(
    canCreateWish('wish_test04', {
      sender_name: 'Budi',
      message: 'A'.repeat(501),
      visibility: 'PUBLIC',
      moderation_status: 'APPROVED',
      createdAt: REQUEST_TIME
    }),
    false
  );
  assert.equal(canListWish(null, { visibility: 'PRIVATE', moderation_status: 'PENDING' }), false);
  assert.equal(canListWish(null, { visibility: 'PUBLIC', moderation_status: 'REJECTED' }), false);
  assert.equal(canListWish(null, { visibility: 'PUBLIC', moderation_status: 'APPROVED' }), true);
  assert.equal(isAdmin(null), false);
  assert.equal(isAdmin({ uid: 'spoof', email: 'adjieprasatia@gmail.com', email_verified: false }), false);
  assert.equal(isAdmin({ uid: 'admin', email: 'adjieprasatia@gmail.com', email_verified: true }), true);
  assert.match(rulesText, /match \/rsvps\/\{rsvpId\}[\s\S]*allow get: if isAdmin\(\)/);
  assert.match(rulesText, /match \/rsvps\/\{rsvpId\}[\s\S]*allow list: if isAdmin\(\);/);
  assert.equal(
    canCreateRsvp('rsvp_123456789012345678901234', {
      guest_name: 'Sinta Dewi',
      attending: true,
      guest_count: 2,
      rsvp_status: 'WILL_ATTEND',
      invitation_category: 'B',
      createdAt: REQUEST_TIME,
      updatedAt: REQUEST_TIME
    }),
    false
  );
  assert.equal(
    canCreateRsvp('1', {
      guest_name: 'Sinta Dewi',
      attending: true,
      guest_count: 1,
      rsvp_status: 'WILL_ATTEND',
      invitation_category: 'B',
      createdAt: REQUEST_TIME,
      updatedAt: REQUEST_TIME
    }),
    false
  );
  assert.match(rulesText, /match \/admins\/\{uid\}[\s\S]*allow list, create, update, delete: if false;/);
  assert.equal(canWriteGuestOverride(null, '1', { no: 1, guest_name: 'Hacked', updatedAt: REQUEST_TIME }), false);
  assert.equal(
    canWriteGuestOverride(
      { uid: 'admin', email: 'adjieprasatia@gmail.com', email_verified: true },
      '1',
      { no: 1, guest_name: 12345, updatedAt: REQUEST_TIME }
    ),
    false
  );
  assert.equal(
    canWriteGuestOverride(
      { uid: 'admin', email: 'adjieprasatia@gmail.com', email_verified: true },
      '1',
      { no: 2, guest_name: 'Mismatch', updatedAt: REQUEST_TIME }
    ),
    false
  );
  assert.equal(
    canCreateWish('wish_valid_01', {
      sender_name: 'Raka Pratama',
      message: 'Selamat menempuh hidup baru Adjie & Daulika!',
      visibility: 'PUBLIC',
      moderation_status: 'APPROVED',
      createdAt: REQUEST_TIME
    }),
    true
  );
  assert.equal(
    canCreateRsvp('rsvp_a1b2c3d4e5f60718293a4b5c6d7e8f90', {
      guest_name: 'Raka Pratama',
      attending: true,
      guest_count: 1,
      rsvp_status: 'WILL_ATTEND',
      invitation_category: 'B',
      createdAt: REQUEST_TIME,
      updatedAt: REQUEST_TIME
    }),
    true
  );
});
