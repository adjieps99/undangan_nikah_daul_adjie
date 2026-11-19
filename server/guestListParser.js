/**
 * Pure ESM guest list parser & simple personalized ?to= link builder.
 * Runs natively in `node server.ts` and `tsx` without requiring a TypeScript emit step.
 */

export function parseGuestListText(rawContent) {
  if (typeof rawContent !== 'string') return [];
  const lines = rawContent.split(/\r?\n/);
  const entries = [];

  for (const rawLine of lines) {
    if (!rawLine || !rawLine.trim()) continue;
    const parts = rawLine.split('\t');
    if (parts.length < 2) continue;

    const firstCell = parts[0].trim();
    if (!/^\d+$/.test(firstCell)) continue;

    const no = Number.parseInt(firstCell, 10);
    const name = parts.slice(1).join('\t').replace(/\r$/, '').trim();
    if (!name) continue;

    entries.push({ no, name });
  }

  return entries;
}

export function buildPersonalInviteUrl(baseUrl, guestName) {
  const cleanBase = String(baseUrl || '').replace(/\/+$/, '');
  const cleanName = String(guestName || '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
  if (!cleanName) return `${cleanBase}/`;
  return `${cleanBase}/?to=${encodeURIComponent(cleanName)}`;
}

export function escapeCsvCell(value) {
  let str = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
