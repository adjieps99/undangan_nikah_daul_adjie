export interface GuestListEntry {
  no: number;
  name: string;
}

export function parseGuestListText(rawContent: string): GuestListEntry[];
export function buildPersonalInviteUrl(baseUrl: string, guestName: string): string;
export function escapeCsvCell(value: string | number | boolean | null | undefined): string;
