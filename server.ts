import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  validateRsvpPayload,
  getMaxGuestQuota,
  normalizeInvitationCategory,
  normalizeGuestGroup,
  sanitizeGuestText,
} from './static/js/utils/rsvpContract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.use(express.json());

// Anti-caching headers matching original Flask backend
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '-1');
  next();
});

// Serve static assets from /static
app.use('/static', express.static(path.join(__dirname, 'static')));

// Rate limiter implementation
const rateLimitRecords = new Map<string, number[]>();

function isRateLimited(key: string, limit = 10, windowSeconds = 60): boolean {
  const now = Date.now() / 1000;
  const timestamps = (rateLimitRecords.get(key) || []).filter((t) => now - t < windowSeconds);
  rateLimitRecords.set(key, timestamps);
  if (timestamps.length >= limit) {
    return true;
  }
  timestamps.push(now);
  return false;
}

function cleanText(raw: unknown, maxLength = 500): string {
  if (typeof raw !== 'string') return '';
  // Strip control characters and trim
  const cleaned = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
  return cleaned.slice(0, maxLength);
}

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

function generateRsvpToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  return { rawToken, tokenHash: hashToken(rawToken) };
}

function verifyRsvpToken(rawToken: string, storedHash: string): boolean {
  if (!rawToken || !storedHash) return false;
  const computedHash = hashToken(rawToken);
  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}

// In-Memory Data Models
interface RSVP {
  id: number;
  token_hash: string;
  guest_name: string;
  attending: number;
  guest_count: number;
  invitation_category: 'A' | 'B';
  group_category?: string | null;
  invitation_identity?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface Wish {
  id: number;
  name: string;
  message: string;
  timestamp: string;
  is_approved: boolean;
}

interface Seat {
  id: string;
  label: string;
  row_label: string;
  seat_number: number;
  group_category: string;
  is_active: number;
}

interface Booking {
  id: number;
  booking_code: string;
  rsvp_id: number;
  idempotency_key?: string | null;
  payload_hash: string;
  status: 'CONFIRMED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

interface ReservedSeat {
  id: number;
  booking_id: number;
  seat_id: string;
  status: 'CONFIRMED' | 'CANCELLED';
  created_at: string;
}

const rsvps = new Map<number, RSVP>();
let nextRsvpId = 1;

const wishes: Wish[] = [];
let nextWishId = 1;

// Seed initial wishes from static/data/wishes.json if available
try {
  const wishesFile = path.join(__dirname, 'static', 'data', 'wishes.json');
  if (fs.existsSync(wishesFile)) {
    const raw = JSON.parse(fs.readFileSync(wishesFile, 'utf8'));
    if (Array.isArray(raw)) {
      for (const item of raw) {
        wishes.push({
          id: nextWishId++,
          name: item.name || 'Tamu Undangan',
          message: item.message || '',
          timestamp: item.timestamp || new Date().toISOString(),
          is_approved: true,
        });
      }
    }
  }
} catch (e) {
  console.warn('Could not load initial wishes:', e);
}

// Baseline seats
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

const bookings = new Map<number, Booking>();
let nextBookingId = 1;

const reservedSeats: ReservedSeat[] = [];
let nextReservedSeatId = 1;

// Health Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Hachi Garden 3D Wedding Venue',
    version: '2.0.2',
    environment: process.env.NODE_ENV || 'production',
  });
});

// ==========================================
// GALLERY ASSET DISCOVERY ENDPOINT
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
      } catch {
        // Ignore malformed optional gallery.json cleanly
      }
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

// ==========================================
// CENTRALIZED ASSET AVAILABILITY ENDPOINT
// ==========================================
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
      availableModels = fs.readdirSync(modelsDir)
        .filter((f) => f.toLowerCase().endsWith('.glb'))
        .sort();
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
// RSVP ENDPOINTS
// ==========================================

app.post('/api/rsvp', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  if (isRateLimited(`rsvp:${clientIp}`, 10, 60)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Terlalu banyak permintaan RSVP. Silakan coba beberapa saat lagi.',
    });
  }

  const validation = validateRsvpPayload(req.body);
  if (!validation.valid) {
    return res.status(validation.status).json({
      error: validation.error,
      message: validation.message,
    });
  }

  const normalized = validation.normalized;
  const { rawToken, tokenHash } = generateRsvpToken();
  const now = new Date().toISOString();
  const rsvpId = nextRsvpId++;

  const newRsvp: RSVP = {
    id: rsvpId,
    token_hash: tokenHash,
    guest_name: normalized.guest_name,
    attending: normalized.attending,
    guest_count: normalized.guest_count,
    invitation_category: normalized.invitation_category,
    group_category: normalized.guest_group,
    invitation_identity: normalized.invitation_identity,
    notes: normalized.notes,
    created_at: now,
    updated_at: now,
  };

  rsvps.set(rsvpId, newRsvp);

  return res.status(201).json({
    status: 'ok',
    rsvp_id: rsvpId,
    rsvp_token: rawToken,
    guest_name: newRsvp.guest_name,
    attending: newRsvp.attending,
    guest_count: newRsvp.guest_count,
    invitation_category: newRsvp.invitation_category,
    guest_group: newRsvp.group_category,
    group_category: newRsvp.group_category,
    notes: newRsvp.notes,
  });
});

function getHeader(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val;
}

function getParam(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || '';
  return val || '';
}

app.get('/api/rsvp/:id', (req: Request, res: Response) => {
  const rsvpId = parseInt(getParam(req.params.id), 10);
  const token = getHeader(req.headers['x-rsvp-token']) || (req.query.token as string);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'X-RSVP-Token header or token parameter is required.' });
  }

  const rsvp = rsvps.get(rsvpId);
  if (!rsvp) {
    return res.status(404).json({ error: 'Not Found', message: `RSVP record with id ${rsvpId} does not exist.` });
  }

  if (!verifyRsvpToken(token, rsvp.token_hash)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Invalid RSVP token.' });
  }

  return res.json({
    status: 'ok',
    rsvp: {
      id: rsvp.id,
      guest_name: rsvp.guest_name,
      attending: rsvp.attending,
      guest_count: rsvp.guest_count,
      invitation_category: rsvp.invitation_category,
      guest_group: rsvp.group_category,
      group_category: rsvp.group_category,
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
    return res.status(401).json({ error: 'Unauthorized', message: 'X-RSVP-Token header or rsvp_token body field is required.' });
  }

  const rsvp = rsvps.get(rsvpId);
  if (!rsvp) {
    return res.status(404).json({ error: 'Not Found', message: `RSVP record with id ${rsvpId} does not exist.` });
  }

  if (!verifyRsvpToken(token, rsvp.token_hash)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Invalid RSVP token.' });
  }

  const mergedPayload = {
    guest_name: data.guest_name !== undefined ? data.guest_name : rsvp.guest_name,
    attending: data.attending !== undefined ? data.attending : rsvp.attending,
    guest_count: data.guest_count !== undefined
      ? data.guest_count
      : (data.attending === 0 || data.attending === false ? 0 : rsvp.guest_count),
    invitation_category: data.invitation_category !== undefined
      ? data.invitation_category
      : rsvp.invitation_category,
    guest_group: data.guest_group !== undefined
      ? data.guest_group
      : (data.group_category !== undefined ? data.group_category : rsvp.group_category),
    invitation_identity: data.invitation_identity !== undefined
      ? data.invitation_identity
      : rsvp.invitation_identity,
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

  // If transitioning to attending = 0, cancel active bookings and seats
  if (normalized.attending === 0) {
    for (const [_, booking] of bookings.entries()) {
      if (booking.rsvp_id === rsvpId && booking.status === 'CONFIRMED') {
        booking.status = 'CANCELLED';
        booking.updated_at = new Date().toISOString();
        for (const rs of reservedSeats) {
          if (rs.booking_id === booking.id) {
            rs.status = 'CANCELLED';
          }
        }
      }
    }
  }

  rsvp.guest_name = normalized.guest_name;
  rsvp.attending = normalized.attending;
  rsvp.guest_count = normalized.guest_count;
  rsvp.invitation_category = normalized.invitation_category;
  rsvp.group_category = normalized.guest_group;
  rsvp.invitation_identity = normalized.invitation_identity;
  rsvp.notes = normalized.notes;
  rsvp.updated_at = new Date().toISOString();

  return res.json({
    status: 'ok',
    message: 'RSVP updated successfully.',
    rsvp_id: rsvpId,
    guest_name: rsvp.guest_name,
    attending: rsvp.attending,
    guest_count: rsvp.guest_count,
    invitation_category: rsvp.invitation_category,
    guest_group: rsvp.group_category,
  });
});

// ==========================================
// WISHES ENDPOINTS
// ==========================================

app.get('/api/wishes', (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '10', 10) || 10));

  const approvedWishes = wishes.filter((w) => w.is_approved).reverse();
  const total = approvedWishes.length;
  const offset = (page - 1) * limit;
  const paginated = approvedWishes.slice(offset, offset + limit);

  return res.json({
    status: 'ok',
    wishes: paginated.map((w) => ({
      id: w.id,
      name: w.name,
      message: w.message,
      timestamp: w.timestamp,
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: total > 0 ? Math.ceil(total / limit) : 1,
    },
  });
});

app.post('/api/wishes', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  if (isRateLimited(`wish:${clientIp}`, 10, 60)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Terlalu banyak pengiriman pesan. Silakan coba beberapa saat lagi.',
    });
  }

  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid JSON payload' });
  }

  let senderName = cleanText(data.sender_name || data.name, 60);
  if (!senderName) senderName = 'Tamu Undangan';

  const message = cleanText(data.message, 500);
  if (!message) {
    return res.status(422).json({ error: 'Validation Error', message: "Field 'message' cannot be empty." });
  }

  const newWish: Wish = {
    id: nextWishId++,
    name: senderName,
    message,
    timestamp: new Date().toISOString(),
    is_approved: true,
  };
  wishes.push(newWish);

  return res.status(201).json({
    status: 'ok',
    wish: {
      id: newWish.id,
      name: newWish.name,
      message: newWish.message,
      timestamp: newWish.timestamp,
    },
  });
});

// ==========================================
// SEAT RESERVATION ENDPOINTS
// ==========================================

app.get('/api/seats', (_req: Request, res: Response) => {
  const activeBookedSeatIds = new Set(
    reservedSeats.filter((rs) => rs.status === 'CONFIRMED').map((rs) => rs.seat_id)
  );

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

  const rsvpId = data.rsvp_id;
  const rawToken = getHeader(req.headers['x-rsvp-token']) || data.rsvp_token;
  const idempotencyKey = getHeader(req.headers['idempotency-key']) || data.idempotency_key;
  const seatIds = data.seat_ids;

  if (!rsvpId || !rawToken) {
    return res.status(401).json({ error: 'Unauthorized', message: "Fields 'rsvp_id' and 'X-RSVP-Token' header are required." });
  }

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(422).json({ error: 'Validation Error', message: "Field 'seat_ids' must be a non-empty array of seat identifiers." });
  }

  if (seatIds.length > 4) {
    return res.status(422).json({ error: 'Validation Error', message: 'Maximum 4 seats can be reserved per RSVP.' });
  }

  const uniqueSeats = new Set(seatIds);
  if (uniqueSeats.size !== seatIds.length) {
    return res.status(422).json({ error: 'Validation Error', message: 'Duplicate seats in seat_ids array.' });
  }

  const normalizedSeats = seatIds.map((s: unknown) => String(s).trim()).sort();
  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(normalizedSeats)).digest('hex');

  const rsvp = rsvps.get(rsvpId);
  if (!rsvp) {
    return res.status(404).json({ error: 'Not Found', message: `RSVP record with id ${rsvpId} does not exist.` });
  }

  if (!verifyRsvpToken(rawToken, rsvp.token_hash)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Invalid RSVP token.' });
  }

  if (rsvp.attending !== 1) {
    return res.status(422).json({ error: 'Validation Error', message: 'Reservations can only be made for attending guests (attending=1).' });
  }

  const maxQuota = getMaxGuestQuota(rsvp.invitation_category);
  if (normalizedSeats.length > maxQuota) {
    return res.status(422).json({
      error: 'Validation Error',
      message: `Undangan kategori ${rsvp.invitation_category} maksimal ${maxQuota} kursi.`,
    });
  }

  if (normalizedSeats.length !== rsvp.guest_count) {
    return res.status(422).json({
      error: 'Validation Error',
      message: `Jumlah kursi yang dipilih (${normalizedSeats.length}) harus sama dengan jumlah tamu (${rsvp.guest_count}).`,
    });
  }

  // Check Idempotency key
  if (idempotencyKey) {
    for (const [_, booking] of bookings.entries()) {
      if (booking.idempotency_key === idempotencyKey) {
        if (booking.rsvp_id === rsvpId && booking.payload_hash === payloadHash && booking.status === 'CONFIRMED') {
          const bookedSeats = reservedSeats
            .filter((rs) => rs.booking_id === booking.id && rs.status === 'CONFIRMED')
            .map((rs) => rs.seat_id);
          return res.json({
            status: 'ok',
            message: 'Existing reservation returned (Idempotent).',
            booking_id: booking.id,
            booking_code: booking.booking_code,
            reserved_seats: bookedSeats,
          });
        } else {
          return res.status(422).json({
            error: 'Unprocessable Entity',
            message: 'Idempotency key reuse with conflicting RSVP owner, payload, or status.',
          });
        }
      }
    }
  }

  // Validate seat existence & category
  const seatMap = new Map(BASELINE_SEATS.map((s) => [s.id, s]));
  for (const seatId of normalizedSeats) {
    const seat = seatMap.get(seatId);
    if (!seat || !seat.is_active) {
      return res.status(422).json({ error: 'Validation Error', message: `Kursi '${seatId}' tidak valid atau tidak aktif.` });
    }
    if (rsvp.group_category && seat.group_category !== rsvp.group_category) {
      return res.status(422).json({
        error: 'Validation Error',
        message: `Kursi '${seatId}' khusus untuk kelompok '${seat.group_category}', tetapi kelompok Anda adalah '${rsvp.group_category}'.`,
      });
    }
  }

  // Check if seats already reserved by someone else
  const currentActiveSeats = new Set(
    reservedSeats.filter((rs) => rs.status === 'CONFIRMED').map((rs) => rs.seat_id)
  );

  // If this RSVP already has an active booking, cancel old booking and its seats first
  for (const [_, booking] of bookings.entries()) {
    if (booking.rsvp_id === rsvpId && booking.status === 'CONFIRMED') {
      booking.status = 'CANCELLED';
      booking.updated_at = new Date().toISOString();
      for (const rs of reservedSeats) {
        if (rs.booking_id === booking.id && rs.status === 'CONFIRMED') {
          rs.status = 'CANCELLED';
          currentActiveSeats.delete(rs.seat_id);
        }
      }
    }
  }

  for (const seatId of normalizedSeats) {
    if (currentActiveSeats.has(seatId)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Satu atau lebih kursi yang Anda pilih baru saja dipesan oleh tamu lain. Silakan pilih kursi lain.',
      });
    }
  }

  const bookingCode = `BKG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();
  const bookingId = nextBookingId++;

  const newBooking: Booking = {
    id: bookingId,
    booking_code: bookingCode,
    rsvp_id: rsvpId,
    idempotency_key: idempotencyKey || null,
    payload_hash: payloadHash,
    status: 'CONFIRMED',
    created_at: now,
    updated_at: now,
  };
  bookings.set(bookingId, newBooking);

  for (const seatId of normalizedSeats) {
    reservedSeats.push({
      id: nextReservedSeatId++,
      booking_id: bookingId,
      seat_id: seatId,
      status: 'CONFIRMED',
      created_at: now,
    });
  }

  return res.status(201).json({
    status: 'ok',
    message: 'Reservation created successfully.',
    booking_id: bookingId,
    booking_code: bookingCode,
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

  const booking = bookings.get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Not Found', message: `Booking with id ${bookingId} does not exist.` });
  }

  const rsvp = rsvps.get(booking.rsvp_id);
  if (!rsvp || !verifyRsvpToken(rawToken, rsvp.token_hash)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied. Invalid RSVP token for this booking.' });
  }

  booking.status = 'CANCELLED';
  booking.updated_at = new Date().toISOString();

  for (const rs of reservedSeats) {
    if (rs.booking_id === bookingId) {
      rs.status = 'CANCELLED';
    }
  }

  return res.json({
    status: 'ok',
    message: `Booking ${bookingId} and reserved seats have been cancelled.`,
  });
});

// Fallback: Return 404 for missing /api/* or /static/* assets; serve index.html for SPA routes
app.use((req: Request, res: Response) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/static/')) {
    return res.status(404).json({ error: 'Not Found', message: `Resource '${req.path}' not found.` });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Wedding Invitation Server running at http://${HOST}:${PORT}`);
});
