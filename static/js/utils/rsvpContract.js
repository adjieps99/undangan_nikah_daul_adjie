/**
 * Shared RSVP Contract & Guest Identity Isolation Helpers
 * Used cleanly across client state/UI and server validation.
 */

export const INVITATION_CATEGORIES = Object.freeze({
  A: 'A', // Maximum 2 guests
  B: 'B'  // Strictly 1 guest ("Berlaku untuk 1 orang")
});

export const GUEST_GROUPS = Object.freeze({
  KELUARGA: 'Keluarga',
  TEMAN: 'Teman'
});

export function sanitizeGuestText(raw, maxLength = 60) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, maxLength);
}

export function normalizeInvitationCategory(raw) {
  if (typeof raw !== 'string') return INVITATION_CATEGORIES.A;
  const val = raw.trim().toUpperCase();
  return val === INVITATION_CATEGORIES.B ? INVITATION_CATEGORIES.B : INVITATION_CATEGORIES.A;
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

export function getMaxGuestQuota(invitationCategory) {
  return normalizeInvitationCategory(invitationCategory) === INVITATION_CATEGORIES.B ? 1 : 2;
}

/**
 * Generates an isolated storage suffix for a specific guest identity so
 * different guests opening links on the same browser never inherit each other's RSVP state.
 */
export function buildGuestStorageKey(guestName, invitationCategory = 'A', inviteCode = '') {
  const cleanName = sanitizeGuestText(guestName || 'Tamu Undangan', 60)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'tamu';
  const cat = normalizeInvitationCategory(invitationCategory);
  const code = sanitizeGuestText(inviteCode || '', 32)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '');
  return code
    ? `wedding_rsvp_${code}_${cat}`
    : `wedding_rsvp_${cleanName}_${cat}`;
}

/**
 * Validates an RSVP payload separating invitation_category ('A' | 'B')
 * from optional guest_group ('Keluarga' | 'Teman').
 */
export function validateRsvpPayload(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, status: 400, error: 'Bad Request', message: 'Invalid JSON payload.' };
  }

  const guestName = sanitizeGuestText(data.guest_name, 60);
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
  const maxQuota = getMaxGuestQuota(invitationCategory);

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
    // Support legacy field only if it actually contains Keluarga/Teman
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
    if (guestCount < 1 || guestCount > maxQuota) {
      return {
        valid: false,
        status: 422,
        error: 'Validation Error',
        message:
          invitationCategory === INVITATION_CATEGORIES.B
            ? 'Undangan kategori B berlaku untuk maksimal 1 orang.'
            : 'Undangan kategori A berlaku untuk maksimal 2 orang.'
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
