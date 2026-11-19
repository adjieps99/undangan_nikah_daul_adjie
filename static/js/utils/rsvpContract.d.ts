export declare const INVITATION_CATEGORIES: Readonly<{
  A: 'A';
  B: 'B';
}>;

export declare const STRICT_ONE_PERSON_CAPACITY: 1;

export declare const GUEST_GROUPS: Readonly<{
  KELUARGA: 'Keluarga';
  TEMAN: 'Teman';
}>;

export declare function sanitizeGuestText(raw: unknown, maxLength?: number): string;
export declare function normalizeInvitationCategory(raw: unknown): 'A' | 'B';
export declare function normalizeGuestGroup(raw: unknown): 'Keluarga' | 'Teman' | null;
export declare function getMaxGuestQuota(invitationCategory?: unknown): 1;
export declare function buildGuestStorageKey(
  guestName?: string,
  invitationCategory?: string,
  inviteCode?: string
): string;

export interface NormalizedRsvpPayload {
  guest_name: string;
  attending: 0 | 1;
  guest_count: 0 | 1;
  invitation_category: 'A' | 'B';
  guest_group: 'Keluarga' | 'Teman' | null;
  invitation_identity: string | null;
  notes: string | null;
}

export type RsvpValidationResult =
  | { valid: true; normalized: NormalizedRsvpPayload }
  | { valid: false; status: number; error: string; message: string };

export declare function validateRsvpPayload(data: unknown): RsvpValidationResult;
