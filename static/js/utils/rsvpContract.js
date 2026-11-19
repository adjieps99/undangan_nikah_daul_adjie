/**
 * Shared RSVP Contract & Guest Identity Isolation Helpers
 * Phase 17: Strict One-Person Invitation Policy ("Undangan ini berlaku untuk 1 orang.")
 */

export const INVITATION_CATEGORIES = Object.freeze({
  A: 'A',
  B: 'B'
});

export const STRICT_ONE_PERSON_CAPACITY = 1;

export const GUEST_GROUPS = Object.freeze({
  KELUARGA: 'Keluarga',
  TEMAN: 'Teman'
});

export function sanitizeGuestText(raw, maxLength = 80) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, maxLength);
}

export function normalizeInvitationCategory(raw) {
  if (typeof raw !== 'string') return INVITATION_CATEGORIES.B;
  const val = raw.trim().toUpperCase();
  return val === INVITATION_CATEGORIES.A ? INVITATION_CATEGORIES.A : INVITATION_CATEGORIES.B;
}

export function normalizeGuestGroup(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw !== 'string') return null;
  const val = raw.trim();
  if (val === GUEST_GROUPS.KELUARGA || val === GUEST_GROUPS.TEMAN) {
    return val;
  }
  return null;
}

export function getMaxGuestQuota(_invitationCategory) {
  return STRICT_ONE_PERSON_CAPACITY;
}

/**
 * Generates an isolated storage key per invitation token or guest identity so
 * different guests opening links on the same browser never inherit each other's RSVP state.
 */
export function buildGuestStorageKey(guestName, invitationCategory = 'B', inviteCode = '') {
  const cleanName = sanitizeGuestText(guestName || 'Tamu Undangan', 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'tamu';
  const cat = normalizeInvitationCategory(invitationCategory);
  const code = sanitizeGuestText(inviteCode || '', 64)
    .replace(/[^a-zA-Z0-9_-]+/g, '');
  return code
    ? `wedding_rsvp_invite_${code}`
    : `wedding_rsvp_${cleanName}_${cat}`;
}

/**
 * Validates an RSVP payload enforcing the strict one-person invitation rule.
 */
export function validateRsvpPayload(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, status: 400, error: 'Bad Request', message: 'Invalid JSON payload.' };
  }

  const guestName = sanitizeGuestText(data.guest_name, 80);
  if (!guestName) {
    return {
      valid: false,
      status: 422,
      error: 'Validation Error',
      message: "Field 'guest_name' is required and cannot be empty."
    };
  }

  const attendingVal = data.attending;
  if (attendingVal !== 0 && attendingVal !== 1 && attendingVal !== true && attendingVal !== false) {
    return {
      valid: false,
      status: 422,
      error: 'Validation Error',
      message: "Field 'attending' must be 0 (No) or 1 (Yes)."
    };
  }
  const attending = (attendingVal === 1 || attendingVal === true) ? 1 : 0;

  if (data.invitation_category !== undefined && data.invitation_category !== null) {
    const rawCat = String(data.invitation_category).trim().toUpperCase();
    if (rawCat !== INVITATION_CATEGORIES.A && rawCat !== INVITATION_CATEGORIES.B) {
      return {
        valid: false,
        status: 422,
        error: 'Validation Error',
        message: "Field 'invitation_category' must be 'A' or 'B'."
      };
    }
  }
  const invitationCategory = normalizeInvitationCategory(data.invitation_category);

  let guestGroup = null;
  if (data.guest_group !== undefined && data.guest_group !== null && data.guest_group !== '') {
    guestGroup = normalizeGuestGroup(data.guest_group);
    if (!guestGroup) {
      return {
        valid: false,
        status: 422,
        error: 'Validation Error',
        message: "Field 'guest_group' must be 'Keluarga' or 'Teman'."
      };
    }
  } else if (data.group_category !== undefined && data.group_category !== null && data.group_category !== '') {
    guestGroup = normalizeGuestGroup(data.group_category);
    if (!guestGroup) {
      return {
        valid: false,
        status: 422,
        error: 'Validation Error',
        message: "Field 'group_category' must be 'Keluarga' or 'Teman'."
      };
    }
  }

  let guestCount = Number.parseInt(data.guest_count ?? (attending ? 1 : 0), 10);
  if (Number.isNaN(guestCount)) {
    return {
      valid: false,
      status: 422,
      error: 'Validation Error',
      message: "Field 'guest_count' must be an integer."
    };
  }

  if (attending === 1) {
    if (guestCount !== 1) {
      return {
        valid: false,
        status: 422,
        error: 'Validation Error',
        message: 'Undangan ini berlaku untuk 1 orang.'
      };
    }
  } else {
    guestCount = 0;
  }

  const notes = data.notes ? sanitizeGuestText(data.notes, 500) : null;
  const invitationIdentity = data.invitation_identity
    ? sanitizeGuestText(data.invitation_identity, 80)
    : null;

  return {
    valid: true,
    normalized: {
      guest_name: guestName,
      attending,
      guest_count: guestCount,
      invitation_category: invitationCategory,
      guest_group: guestGroup,
      invitation_identity: invitationIdentity,
      notes
    }
  };
}
