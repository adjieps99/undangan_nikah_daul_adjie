import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  validateRsvpPayload,
  getMaxGuestQuota,
} from './static/js/utils/rsvpContract.js';
import {
  parseGuestListText,
  buildPersonalInviteUrl,
  escapeCsvCell,
} from './server/guestListParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.use(express.json({ limit: '100kb' }));

// Anti-caching headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '-1');
  next();
});

// Serve static assets from /static
app.use('/static', express.static(path.join(__dirname, 'static')));

// ==========================================
// SIMPLE LIGHTWEIGHT JSON PERSISTENCE STORE
// (Zero native/SQLite dependency — starts reliably on Cloud Run PORT=8080)
// ==========================================
type WishVisibility = 'PUBLIC' | 'PRIVATE';
type WishModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface GuestEntry {
  no: number;
  name: string;
}

interface RsvpRecord {
  id: number;
  token_hash: string;
  guest_name: string;
  attending: number;
  guest_count: number;
  invitation_category: 'A' | 'B';
  group_category: string | null;
  invitation_identity: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WishRecord {
  id: number;
  sender_name: string;
  message: string;
  visibility: WishVisibility;
  moderation_status: WishModerationStatus;
  moderated_at: string | null;
  created_at: string;
}

interface BookingRecord {
  id: number;
  booking_code: string;
  rsvp_id: number;
  idempotency_key: string | null;
  payload_hash: string;
  status: 'CONFIRMED' | 'CANCELLED';
  seat_ids: string[];
  created_at: string;
  updated_at: string;
}

interface StoreData {
  nextRsvpId: number;
  nextWishId: number;
  nextBookingId: number;
  guestNameOverrides: Record<string, string>;
  rsvps: RsvpRecord[];
  wishes: WishRecord[];
  bookings: BookingRecord[];
}

const DATA_FILE_PATH = (process.env.STORE_PATH || '').trim() || path.join(__dirname, 'data', 'wedding_store.json');
const SEED_CANDIDATES = [
  path.join(__dirname, 'server', 'seed', 'list_undangan.txt'),
  path.join(__dirname, 'public', 'assets', 'aistudio', 'list_undangan_0e5c6a14.txt'),
];
const SEED_FILE_PATH = SEED_CANDIDATES.find((p) => fs.existsSync(p));

function loadBaseGuests(): GuestEntry[] {
  if (!SEED_FILE_PATH || !fs.existsSync(SEED_FILE_PATH)) return [];
  try {
    return parseGuestListText(fs.readFileSync(SEED_FILE_PATH, 'utf8'));
  } catch (err) {
    console.warn('Could not load guest list seed file:', err);
    return [];
  }
}

const BASE_GUESTS: GuestEntry[] = loadBaseGuests();

function createEmptyStore(): StoreData {
  return {
    nextRsvpId: 1,
    nextWishId: 1,
    nextBookingId: 1,
    guestNameOverrides: {},
    rsvps: [],
    wishes: [],
    bookings: [],
  };
}

function loadStore(): StoreData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf8')) as Partial<StoreData>;
      return {
        nextRsvpId: typeof parsed.nextRsvpId === 'number' ? parsed.nextRsvpId : 1,
        nextWishId: typeof parsed.nextWishId === 'number' ? parsed.nextWishId : 1,
        nextBookingId: typeof parsed.nextBookingId === 'number' ? parsed.nextBookingId : 1,
        guestNameOverrides: parsed.guestNameOverrides && typeof parsed.guestNameOverrides === 'object' ? parsed.guestNameOverrides : {},
        rsvps: Array.isArray(parsed.rsvps) ? parsed.rsvps : [],
        wishes: Array.isArray(parsed.wishes) ? parsed.wishes : [],
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      };
    }
  } catch (err) {
    console.warn('Store load fallback to memory:', err);
  }
  return createEmptyStore();
}

const store: StoreData = loadStore();

function saveStore(): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE_PATH), { recursive: true });
    const tmpPath = `${DATA_FILE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
    fs.renameSync(tmpPath, DATA_FILE_PATH);
  } catch (err) {
    // Graceful fallback if container disk is ephemeral/read-only
    console.warn('Store persist skipped (running in-memory):', err);
  }
}

// ==========================================
// SECURITY & HELPER UTILITIES
// ==========================================
const ADMIN_ACCESS_KEY = (process.env.ADMIN_ACCESS_KEY || '').trim() || 'adjie-daulika-2026';
const ADMIN_SESSION_SECRET =
  (process.env.ADMIN_SESSION_SECRET || '').trim() ||
  crypto.createHash('sha256').update(`hachi-garden-admin:${ADMIN_ACCESS_KEY}`).digest('hex');

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

function generateOpaqueToken(byteLength = 24): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(byteLength).toString('base64url');
  return { rawToken, tokenHash: hashToken(rawToken) };
}

function timingSafeMatch(aStr: string, bStr: string): boolean {
  const a = Buffer.from(aStr, 'utf8');
  const b = Buffer.from(bStr, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function issueAdminToken(): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', iat: nowSec, exp: nowSec + 24 * 60 * 60 }),
    'utf8'
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string | null): boolean {
  if (!token) return false;
  const parts = token.trim().split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || !sig) return false;
  const expectedSig = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(payload).digest('base64url');
  if (!timingSafeMatch(sig, expectedSig)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: string; exp?: number };
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

const rateLimitRecords = new Map<string, number[]>();

function isRateLimited(key: string, limit = 15, windowSeconds = 60): boolean {
  const now = Date.now() / 1000;
  const timestamps = (rateLimitRecords.get(key) || []).filter((t) => now - t < windowSeconds);
  rateLimitRecords.set(key, timestamps);
  if (timestamps.length >= limit) return true;
  timestamps.push(now);
  return false;
}

function getHeader(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

function getParam(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] || '' : val || '';
}

function getClientIp(req: Request): string {
  return ((getHeader(req.headers['x-forwarded-for']) || req.socket.remoteAddress || 'unknown')
    .split(',')[0] || 'unknown').trim();
}

function cleanText(raw: unknown, maxLength = 500): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, maxLength);
}

function normalizeGuestKey(name: string): string {
  return cleanText(name, 100).toLowerCase().replace(/\s+/g, ' ');
}

function getPublicBaseUrl(req: Request): string {
  const configured = (process.env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  const proto = getHeader(req.headers['x-forwarded-proto']) || req.protocol || 'http';
  const host = getHeader(req.headers['x-forwarded-host']) || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function extractAdminToken(req: Request): string | null {
  const authHeader = getHeader(req.headers['authorization']);
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const customHeader = getHeader(req.headers['x-admin-token']);
  if (customHeader) return customHeader.trim();
  return null;
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!verifyAdminToken(extractAdminToken(req))) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Akses ditolak. Silakan masuk sebagai administrator.',
    });
    return;
  }
  next();
}

function getResolvedGuestList(baseUrl: string) {
  // Latest RSVP per normalized guest name
  const latestRsvpByName = new Map<string, RsvpRecord>();
  for (const r of store.rsvps) {
    latestRsvpByName.set(normalizeGuestKey(r.guest_name), r);
  }

  return BASE_GUESTS.map((entry) => {
    const currentName = store.guestNameOverrides[String(entry.no)] || entry.name;
    const matchedRsvp = latestRsvpByName.get(normalizeGuestKey(currentName)) || null;
    const rsvpStatus = matchedRsvp
      ? (matchedRsvp.attending === 1 ? 'WILL_ATTEND' : 'DECLINED')
      : 'PENDING';

    return {
      no: entry.no,
      original_name: entry.name,
      guest_name: currentName,
      invitation_url: buildPersonalInviteUrl(baseUrl, currentName),
      rsvp_status: rsvpStatus,
      guest_capacity: 1,
      confirmed_at: matchedRsvp ? matchedRsvp.updated_at : null,
    };
  });
}

// Baseline seats
interface Seat {
  id: string;
  label: string;
  row_label: string;
  seat_number: number;
  group_category: string;
  is_active: number;
}

const BASELINE_SEATS: Seat[] = [
  { id: 'A1', label: 'Seat A1 (Keluarga)', row_label: 'A', seat_number: 1, group_category: 'Keluarga', is_active: 1 },
  { id: 'A2', label: 'Seat A2 (Keluarga)', row_label: 'A', seat_number: 2, group_category: 'Keluarga', is_active: 1 },
  { id: 'B1', label: 'Seat B1 (Keluarga)', row_label: 'B', seat_number: 1, group_category: 'Keluarga', is_active: 1 },
  { id: 'B2', label: 'Seat B2 (Keluarga)', row_label: 'B', seat_number: 2, group_category: 'Keluarga', is_active: 1 },
  { id: 'C1', label: 'Seat C1 (Teman)', row_label: 'C', seat_number: 1, group_category: 'Teman', is_active: 1 },
  { id: 'C2', label: 'Seat C2 (Teman)', row_label: 'C', seat_number: 2, group_category: 'Teman', is_active: 1 },
  { id: 'D1', label: 'Seat D1 (Teman)', row_label: 'D', seat_number: 1, group_category: 'Teman', is_active: 1 },
  { id: 'D2', label: 'Seat D2 (Teman)', row_label: 'D', seat_number: 2, group_category: 'Teman', is_active: 1 },
];

function getActiveBookedSeatIds(): Set<string> {
  const active = new Set<string>();
  for (const b of store.bookings) {
    if (b.status === 'CONFIRMED') {
      for (const s of b.seat_ids) active.add(s);
    }
  }
  return active;
}

function cancelBookingsForRsvp(rsvpId: number, now: string): void {
  for (const b of store.bookings) {
    if (b.rsvp_id === rsvpId && b.status === 'CONFIRMED') {
      b.status = 'CANCELLED';
      b.updated_at = now;
    }
  }
}

// ==========================================
// HEALTH ENDPOINT
// ==========================================
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Hachi Garden 3D Wedding Venue',
    version: '2.2.0',
    guests_loaded: BASE_GUESTS.length,
  });
});

// ==========================================
// ADMIN PAGE & AUTHENTICATION
// ==========================================
app.get('/admin', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'static', 'admin.html'));
});

app.post('/api/admin/auth/login', (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  if (isRateLimited(`admin-login:${clientIp}`, 15, 60)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Terlalu banyak percobaan login. Silakan tunggu sebentar.',
    });
  }

  const candidate = typeof req.body?.access_key === 'string' ? req.body.access_key.trim() : '';
  if (!candidate || !timingSafeMatch(candidate, ADMIN_ACCESS_KEY)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Kode akses administrator tidak valid.',
    });
  }

  return res.json({ status: 'ok', token: issueAdminToken() });
});

app.get('/api/admin/auth/me', requireAdmin, (_req: Request, res: Response) => {
  return res.json({ status: 'ok', role: 'admin' });
});

// ==========================================
// SIMPLE GUEST LIST & LINK GENERATOR ENDPOINTS (/admin)
// ==========================================
app.get('/api/admin/guests', requireAdmin, (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : 'ALL';
  const baseUrl = getPublicBaseUrl(req);
  const all = getResolvedGuestList(baseUrl);

  const summary = {
    total: all.length,
    confirmed: all.filter((g) => g.rsvp_status === 'WILL_ATTEND').length,
    declined: all.filter((g) => g.rsvp_status === 'DECLINED').length,
    pending: all.filter((g) => g.rsvp_status === 'PENDING').length,
  };

  const filtered = all.filter((g) => {
    if (status !== 'ALL' && g.rsvp_status !== status) return false;
    if (search) {
      const hay = `${g.no} ${g.guest_name} ${g.original_name}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  return res.json({ status: 'ok', base_url: baseUrl, summary, guests: filtered });
});

app.patch('/api/admin/guests/:no', requireAdmin, (req: Request, res: Response) => {
  const no = Number.parseInt(getParam(req.params.no), 10);
  const baseEntry = BASE_GUESTS.find((g) => g.no === no);
  if (!baseEntry) {
    return res.status(404).json({ error: 'Not Found', message: 'Nomor tamu tidak ditemukan.' });
  }

  const nextName = cleanText(req.body?.guest_name, 100);
  if (!nextName) {
    return res.status(422).json({ error: 'Validation Error', message: 'Nama tamu tidak boleh kosong.' });
  }

  store.guestNameOverrides[String(no)] = nextName;
  saveStore();

  const baseUrl = getPublicBaseUrl(req);
  return res.json({
    status: 'ok',
    guest: {
      no,
      original_name: baseEntry.name,
      guest_name: nextName,
      invitation_url: buildPersonalInviteUrl(baseUrl, nextName),
    },
  });
});

app.get('/api/admin/guests/export.csv', requireAdmin, (req: Request, res: Response) => {
  const baseUrl = getPublicBaseUrl(req);
  const guests = getResolvedGuestList(baseUrl);

  const statusLabel = (s: string): string => {
    if (s === 'WILL_ATTEND') return 'Akan hadir';
    if (s === 'DECLINED') return 'Tidak dapat hadir';
    return 'Belum merespons';
  };

  const lines = [
    ['No', 'Nama Tamu', 'Link Undangan', 'RSVP Status', 'Kapasitas', 'Waktu Konfirmasi'].join(','),
  ];

  for (const g of guests) {
    lines.push(
      [
        escapeCsvCell(g.no),
        escapeCsvCell(g.guest_name),
        escapeCsvCell(g.invitation_url),
        escapeCsvCell(statusLabel(g.rsvp_status)),
        escapeCsvCell(1),
        escapeCsvCell(g.confirmed_at || ''),
      ].join(',')
    );
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="daftar-undangan-adjie-daulika.csv"');
  return res.send(`\uFEFF${lines.join('\r\n')}`);
});

// ==========================================
// GALLERY & ASSET DISCOVERY ENDPOINTS
// ==========================================
const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

app.get('/api/gallery', (_req: Request, res: Response) => {
  const galleryDir = path.join(__dirname, 'static', 'images', 'gallery');
  try {
    if (!fs.existsSync(galleryDir)) {
      return res.json({ status: 'ok', photos: [] });
    }
    let metadataMap: Record<string, { caption?: string; title?: string }> = {};
    const metadataByStem: Record<string, { caption?: string; title?: string }> = {};
    const metadataPath = path.join(galleryDir, 'gallery.json');
    if (fs.existsSync(metadataPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          metadataMap = parsed;
          for (const [key, value] of Object.entries(parsed)) {
            if (value && typeof value === 'object') {
              const stem = path.parse(key).name.toLowerCase();
              if (stem && !metadataByStem[stem]) {
                metadataByStem[stem] = value as { caption?: string; title?: string };
              }
            }
          }
        }
      } catch {}
    }

    const entries = fs.readdirSync(galleryDir, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && ALLOWED_IMAGE_EXTS.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    const photos = files.map((filename, index) => {
      const stem = path.parse(filename).name.toLowerCase();
      const meta = metadataMap[filename] ?? metadataByStem[stem];
      const rawCaption = meta && typeof meta.caption === 'string' ? cleanText(meta.caption, 180) : '';
      const rawTitle = meta && typeof meta.title === 'string' ? cleanText(meta.title, 80) : '';
      return {
        id: index + 1,
        filename,
        url: `/static/images/gallery/${encodeURIComponent(filename)}`,
        ...(rawTitle ? { title: rawTitle } : {}),
        ...(rawCaption ? { caption: rawCaption } : {}),
      };
    });

    return res.json({ status: 'ok', photos });
  } catch (err) {
    console.warn('Could not scan gallery directory:', err);
    return res.json({ status: 'ok', photos: [] });
  }
});

app.get('/api/assets/status', (_req: Request, res: Response) => {
  const tracksDir = path.join(__dirname, 'static', 'audio', 'tracks');
  const audioDir = path.join(__dirname, 'static', 'audio');
  const coupleDir = path.join(__dirname, 'static', 'images', 'couple');
  const invitationDir = path.join(__dirname, 'static', 'images', 'invitation');
  const modelsDir = path.join(__dirname, 'static', 'models', 'characters');

  const checkFile = (dir: string, filename: string) => fs.existsSync(path.join(dir, filename));

  const tracks: Record<string, boolean> = {
    '01_langit_merah_muda.mp3': checkFile(tracksDir, '01_langit_merah_muda.mp3'),
    '02_rona_merah_langit.mp3': checkFile(tracksDir, '02_rona_merah_langit.mp3'),
    '03_ikat_aku_ditulang_belikatmu.mp3': checkFile(tracksDir, '03_ikat_aku_ditulang_belikatmu.mp3'),
    '04_begini_begitu.mp3': checkFile(tracksDir, '04_begini_begitu.mp3'),
    '05_just_you.mp3': checkFile(tracksDir, '05_just_you.mp3'),
  };

  let availableModels: string[] = [];
  try {
    if (fs.existsSync(modelsDir)) {
      availableModels = fs.readdirSync(modelsDir).filter((f) => f.toLowerCase().endsWith('.glb')).sort();
    }
  } catch {
    availableModels = [];
  }

  const extraCharacters: Record<string, boolean> = {};
  for (const fname of availableModels) {
    extraCharacters[fname] = true;
  }

  return res.json({
    status: 'ok',
    audio: {
      tracks,
      voiceGreeting: checkFile(audioDir, 'couple_voice_greeting.mp3'),
    },
    images: {
      couple: {
        'adjie.jpg': checkFile(coupleDir, 'adjie.jpg'),
        'daulika.jpg': checkFile(coupleDir, 'daulika.jpg'),
        'couple.jpg': checkFile(coupleDir, 'couple.jpg'),
      },
      invitation: {
        'cover_photo.jpg': checkFile(invitationDir, 'cover_photo.jpg'),
      },
    },
    models: {
      characters: {
        'guest.glb': checkFile(modelsDir, 'guest.glb'),
        'groom.glb': checkFile(modelsDir, 'groom.glb'),
        'bride.glb': checkFile(modelsDir, 'bride.glb'),
        ...extraCharacters,
      },
      availableFiles: availableModels,
    },
  });
});

// ==========================================
// RSVP ENDPOINTS (STRICT ONE-PERSON POLICY)
// ==========================================
app.post('/api/rsvp', (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  if (isRateLimited(`rsvp:${clientIp}`, 15, 60)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Terlalu banyak permintaan RSVP. Silakan coba beberapa saat lagi.',
    });
  }

  const body = req.body || {};
  const validation = validateRsvpPayload({ ...body, invitation_category: 'B' });
  if (!validation.valid) {
    return res.status(validation.status).json({
      error: validation.error,
      message: validation.message,
    });
  }

  const normalized = validation.normalized;
  const now = new Date().toISOString();
  const { rawToken, tokenHash } = generateOpaqueToken(32);

  const record: RsvpRecord = {
    id: store.nextRsvpId++,
    token_hash: tokenHash,
    guest_name: normalized.guest_name,
    attending: normalized.attending,
    guest_count: normalized.attending === 1 ? 1 : 0,
    invitation_category: 'B',
    group_category: normalized.guest_group,
    invitation_identity: normalized.invitation_identity,
    notes: normalized.notes,
    created_at: now,
    updated_at: now,
  };
  store.rsvps.push(record);
  saveStore();

  return res.status(201).json({
    status: 'ok',
    rsvp_id: record.id,
    rsvp_token: rawToken,
    guest_name: record.guest_name,
    attending: record.attending,
    guest_count: record.guest_count,
    guest_capacity: 1,
    rsvp_status: record.attending === 1 ? 'WILL_ATTEND' : 'DECLINED',
    confirmed_at: record.updated_at,
    invitation_category: record.invitation_category,
    guest_group: record.group_category,
    notes: record.notes,
  });
});

app.get('/api/rsvp/:id', (req: Request, res: Response) => {
  const rsvpId = parseInt(getParam(req.params.id), 10);
  const token = getHeader(req.headers['x-rsvp-token']) || (req.query.token as string);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'X-RSVP-Token header or token parameter is required.' });
  }

  const rsvp = store.rsvps.find((r) => r.id === rsvpId);
  if (!rsvp) {
    return res.status(404).json({ error: 'Not Found', message: `RSVP record with id ${rsvpId} does not exist.` });
  }

  if (!timingSafeMatch(hashToken(token), rsvp.token_hash)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Invalid RSVP token.' });
  }

  return res.json({
    status: 'ok',
    rsvp: {
      id: rsvp.id,
      guest_name: rsvp.guest_name,
      attending: rsvp.attending,
      guest_count: rsvp.guest_count,
      guest_capacity: 1,
      invitation_category: rsvp.invitation_category,
      guest_group: rsvp.group_category,
      notes: rsvp.notes,
      created_at: rsvp.created_at,
      updated_at: rsvp.updated_at,
    },
  });
});

app.put('/api/rsvp/:id', (req: Request, res: Response) => {
  const rsvpId = parseInt(getParam(req.params.id), 10);
  const data = req.body || {};
  const token = getHeader(req.headers['x-rsvp-token']) || data.rsvp_token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'X-RSVP-Token is required.' });
  }

  const rsvp = store.rsvps.find((r) => r.id === rsvpId);
  if (!rsvp) {
    return res.status(404).json({ error: 'Not Found', message: `RSVP record with id ${rsvpId} does not exist.` });
  }

  if (!timingSafeMatch(hashToken(token), rsvp.token_hash)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Invalid RSVP token.' });
  }

  const mergedPayload = {
    guest_name: data.guest_name !== undefined ? data.guest_name : rsvp.guest_name,
    attending: data.attending !== undefined ? data.attending : rsvp.attending,
    guest_count: data.guest_count !== undefined
      ? data.guest_count
      : (data.attending === 0 || data.attending === false ? 0 : rsvp.guest_count),
    invitation_category: 'B',
    guest_group: data.guest_group !== undefined ? data.guest_group : rsvp.group_category,
    invitation_identity: data.invitation_identity !== undefined ? data.invitation_identity : rsvp.invitation_identity,
    notes: data.notes !== undefined ? data.notes : rsvp.notes,
  };

  const validation = validateRsvpPayload(mergedPayload);
  if (!validation.valid) {
    return res.status(validation.status).json({
      error: validation.error,
      message: validation.message,
    });
  }

  const normalized = validation.normalized;
  const now = new Date().toISOString();
  rsvp.guest_name = normalized.guest_name;
  rsvp.attending = normalized.attending;
  rsvp.guest_count = normalized.attending === 1 ? 1 : 0;
  rsvp.group_category = normalized.guest_group;
  rsvp.invitation_identity = normalized.invitation_identity;
  rsvp.notes = normalized.notes;
  rsvp.updated_at = now;

  if (rsvp.attending === 0) {
    cancelBookingsForRsvp(rsvp.id, now);
  }
  saveStore();

  return res.json({
    status: 'ok',
    message: 'RSVP updated successfully.',
    rsvp_id: rsvp.id,
    guest_name: rsvp.guest_name,
    attending: rsvp.attending,
    guest_count: rsvp.guest_count,
    guest_capacity: 1,
    rsvp_status: rsvp.attending === 1 ? 'WILL_ATTEND' : 'DECLINED',
    confirmed_at: rsvp.updated_at,
    invitation_category: rsvp.invitation_category,
    guest_group: rsvp.group_category,
  });
});

// ==========================================
// WISHES ENDPOINTS (PUBLIC APPROVED READ + PENDING SUBMISSION + ADMIN MODERATION)
// ==========================================
app.get('/api/wishes', (req: Request, res: Response) => {
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '10', 10) || 10));
  const order = typeof req.query.order === 'string' ? req.query.order.toLowerCase() : 'latest';

  // STRICT: Only PUBLIC + APPROVED wishes are returned publicly
  const publicApproved = store.wishes
    .filter((w) => w.visibility === 'PUBLIC' && w.moderation_status === 'APPROVED')
    .sort((a, b) => b.id - a.id);

  const total = publicApproved.length;
  const offset = (page - 1) * limit;
  let sliced = publicApproved.slice(offset, offset + limit).map((w) => ({
    id: w.id,
    name: w.sender_name,
    message: w.message,
    timestamp: w.created_at,
  }));

  if (order === 'random') {
    sliced = [...sliced].sort(() => Math.random() - 0.5);
  }

  return res.json({
    status: 'ok',
    wishes: sliced,
    pagination: {
      page,
      limit,
      total,
      total_pages: total > 0 ? Math.ceil(total / limit) : 1,
    },
  });
});

app.post('/api/wishes', (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  if (isRateLimited(`wish:${clientIp}`, 12, 60)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Terlalu banyak pengiriman pesan. Silakan coba beberapa saat lagi.',
    });
  }

  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid JSON payload' });
  }

  const senderName = cleanText(data.sender_name || data.name, 80) || 'Tamu Undangan';
  const message = cleanText(data.message, 500);
  if (!message) {
    return res.status(422).json({ error: 'Validation Error', message: "Field 'message' cannot be empty." });
  }

  const rawVisibility = typeof data.visibility === 'string' ? data.visibility.trim().toUpperCase() : 'PUBLIC';
  if (rawVisibility !== 'PUBLIC' && rawVisibility !== 'PRIVATE') {
    return res.status(422).json({
      error: 'Validation Error',
      message: "Field 'visibility' must be 'PUBLIC' or 'PRIVATE'.",
    });
  }

  const created: WishRecord = {
    id: store.nextWishId++,
    sender_name: senderName,
    message,
    visibility: rawVisibility as WishVisibility,
    moderation_status: 'PENDING',
    moderated_at: null,
    created_at: new Date().toISOString(),
  };

  store.wishes.push(created);
  saveStore();

  return res.status(201).json({
    status: 'ok',
    wish: {
      id: created.id,
      name: created.sender_name,
      message: created.message,
      visibility: created.visibility,
      moderation_status: created.moderation_status,
      timestamp: created.created_at,
    },
  });
});

app.get('/api/admin/wishes', requireAdmin, (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : 'ALL';
  const visibility = typeof req.query.visibility === 'string' ? req.query.visibility.trim().toUpperCase() : 'ALL';

  const all = [...store.wishes].sort((a, b) => b.id - a.id);
  const summary = {
    total: all.length,
    pending: all.filter((w) => w.moderation_status === 'PENDING').length,
    approved: all.filter((w) => w.moderation_status === 'APPROVED').length,
    rejected: all.filter((w) => w.moderation_status === 'REJECTED').length,
    private_count: all.filter((w) => w.visibility === 'PRIVATE').length,
  };

  const filtered = all.filter((w) => {
    if (status !== 'ALL' && w.moderation_status !== status) return false;
    if (visibility !== 'ALL' && w.visibility !== visibility) return false;
    if (search) {
      const hay = `${w.sender_name} ${w.message}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  return res.json({ status: 'ok', summary, wishes: filtered });
});

app.patch('/api/admin/wishes/:id', requireAdmin, (req: Request, res: Response) => {
  const id = Number.parseInt(getParam(req.params.id), 10);
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Bad Request', message: 'ID pesan tidak valid.' });
  }

  const rawAction = typeof req.body?.action === 'string' ? req.body.action.trim().toUpperCase() : '';
  if (rawAction !== 'APPROVE' && rawAction !== 'REJECT') {
    return res.status(422).json({
      error: 'Validation Error',
      message: "Field 'action' harus 'APPROVE' atau 'REJECT'.",
    });
  }

  const wish = store.wishes.find((w) => w.id === id);
  if (!wish) {
    return res.status(404).json({ error: 'Not Found', message: 'Pesan tidak ditemukan.' });
  }

  wish.moderation_status = rawAction === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  wish.moderated_at = new Date().toISOString();
  saveStore();

  return res.json({ status: 'ok', wish });
});

// ==========================================
// SEAT RESERVATION ENDPOINTS
// ==========================================
app.get('/api/seats', (_req: Request, res: Response) => {
  const activeBookedSeatIds = getActiveBookedSeatIds();
  const seatsList = BASELINE_SEATS.map((s) => {
    const isReserved = activeBookedSeatIds.has(s.id);
    return {
      id: s.id,
      label: s.label,
      row: s.row_label,
      number: s.seat_number,
      group: s.group_category,
      is_available: !isReserved,
      is_reserved: isReserved,
    };
  });
  return res.json({ status: 'ok', seats: seatsList });
});

app.post('/api/reservations', (req: Request, res: Response) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid JSON payload' });
  }

  const rsvpId = Number(data.rsvp_id);
  const rawToken = getHeader(req.headers['x-rsvp-token']) || data.rsvp_token;
  const idempotencyKey = getHeader(req.headers['idempotency-key']) || data.idempotency_key || null;
  const seatIds = data.seat_ids;

  if (!rsvpId || !rawToken) {
    return res.status(401).json({ error: 'Unauthorized', message: "Fields 'rsvp_id' and 'X-RSVP-Token' header are required." });
  }

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(422).json({ error: 'Validation Error', message: "Field 'seat_ids' must be a non-empty array of seat identifiers." });
  }

  if (seatIds.length > 1) {
    return res.status(422).json({ error: 'Validation Error', message: 'Undangan berlaku untuk 1 orang (maksimal 1 kursi).' });
  }

  const normalizedSeats = seatIds.map((s: unknown) => String(s).trim()).sort();
  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(normalizedSeats)).digest('hex');

  const rsvp = store.rsvps.find((r) => r.id === rsvpId);
  if (!rsvp) {
    return res.status(404).json({ error: 'Not Found', message: `RSVP record with id ${rsvpId} does not exist.` });
  }

  if (!timingSafeMatch(hashToken(rawToken), rsvp.token_hash)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Invalid RSVP token.' });
  }

  if (rsvp.attending !== 1) {
    return res.status(422).json({ error: 'Validation Error', message: 'Reservations can only be made for attending guests (attending=1).' });
  }

  const maxQuota = getMaxGuestQuota(rsvp.invitation_category);
  if (normalizedSeats.length > maxQuota || normalizedSeats.length !== rsvp.guest_count) {
    return res.status(422).json({ error: 'Validation Error', message: 'Undangan berlaku untuk maksimal 1 kursi.' });
  }

  if (idempotencyKey) {
    const existing = store.bookings.find((b) => b.idempotency_key === idempotencyKey);
    if (existing) {
      if (existing.rsvp_id === rsvpId && existing.payload_hash === payloadHash && existing.status === 'CONFIRMED') {
        return res.json({
          status: 'ok',
          message: 'Existing reservation returned (Idempotent).',
          booking_id: existing.id,
          booking_code: existing.booking_code,
          reserved_seats: existing.seat_ids,
        });
      }
      return res.status(422).json({ error: 'Unprocessable Entity', message: 'Idempotency key reuse conflict.' });
    }
  }

  const seatMap = new Map(BASELINE_SEATS.map((s) => [s.id, s]));
  for (const seatId of normalizedSeats) {
    const seat = seatMap.get(seatId);
    if (!seat || !seat.is_active) {
      return res.status(422).json({ error: 'Validation Error', message: `Kursi '${seatId}' tidak valid atau tidak aktif.` });
    }
  }

  const now = new Date().toISOString();
  cancelBookingsForRsvp(rsvpId, now);

  const activeSeats = getActiveBookedSeatIds();
  for (const seatId of normalizedSeats) {
    if (activeSeats.has(seatId)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Kursi yang Anda pilih baru saja dipesan oleh tamu lain. Silakan pilih kursi lain.',
      });
    }
  }

  const booking: BookingRecord = {
    id: store.nextBookingId++,
    booking_code: `BKG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    rsvp_id: rsvpId,
    idempotency_key: idempotencyKey,
    payload_hash: payloadHash,
    status: 'CONFIRMED',
    seat_ids: normalizedSeats,
    created_at: now,
    updated_at: now,
  };
  store.bookings.push(booking);
  saveStore();

  return res.status(201).json({
    status: 'ok',
    message: 'Reservation created successfully.',
    booking_id: booking.id,
    booking_code: booking.booking_code,
    rsvp_id: rsvpId,
    reserved_seats: normalizedSeats,
  });
});

app.delete('/api/reservations/:id', (req: Request, res: Response) => {
  const bookingId = parseInt(getParam(req.params.id), 10);
  const rawToken = getHeader(req.headers['x-rsvp-token']) || (req.query.rsvp_token as string);
  if (!rawToken) {
    return res.status(401).json({ error: 'Unauthorized', message: 'X-RSVP-Token header or rsvp_token is required.' });
  }

  const booking = store.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Not Found', message: `Booking with id ${bookingId} does not exist.` });
  }

  const rsvp = store.rsvps.find((r) => r.id === booking.rsvp_id);
  if (!rsvp || !timingSafeMatch(hashToken(rawToken), rsvp.token_hash)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Invalid RSVP token for this booking.' });
  }

  booking.status = 'CANCELLED';
  booking.updated_at = new Date().toISOString();
  saveStore();

  return res.json({ status: 'ok', message: `Booking ${bookingId} cancelled.` });
});

// Fallback: 404 for missing /api/* or /static/*; serve index.html for SPA routes
app.use((req: Request, res: Response) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/static/')) {
    return res.status(404).json({ error: 'Not Found', path: req.path });
  }
  return res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Hachi Garden 3D Wedding App server listening on http://${HOST}:${PORT}`);
});

export default app;
