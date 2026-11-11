import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

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
  group_category?: string | null;
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

  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid JSON payload' });
  }

  const guestName = cleanText(data.guest_name, 60);
  if (!guestName) {
    return res.status(422).json({ error: 'Validation Error', message: "Field 'guest_name' is required and cannot be empty." });
  }

  let attendingVal = data.attending;
  if (attendingVal !== 0 && attendingVal !== 1 && attendingVal !== true && attendingVal !== false) {
    return res.status(422).json({ error: 'Validation Error', message: "Field 'attending' must be 0 (No) or 1 (Yes)." });
  }
  const attending = (attendingVal === 1 || attendingVal === true) ? 1 : 0;

  let guestCount = parseInt(data.guest_count ?? (attending ? 1 : 0), 10);
  if (isNaN(guestCount)) {
    return res.status(422).json({ error: 'Validation Error', message: "Field 'guest_count' must be an integer." });
  }

  if (attending === 1) {
    if (guestCount < 1 || guestCount > 4) {
      return res.status(422).json({ error: 'Validation Error', message: "When attending, 'guest_count' must be between 1 and 4." });
    }
  } else {
    guestCount = 0;
  }

  const groupCategory = data.group_category;
  if (groupCategory && groupCategory !== 'Keluarga' && groupCategory !== 'Teman') {
    return res.status(422).json({ error: 'Validation Error', message: "Field 'group_category' must be 'Keluarga' or 'Teman'." });
  }

  const notes = data.notes ? cleanText(data.notes, 500) : null;
  const { rawToken, tokenHash } = generateRsvpToken();
  const now = new Date().toISOString();
  const rsvpId = nextRsvpId++;

  const newRsvp: RSVP = {
    id: rsvpId,
    token_hash: tokenHash,
    guest_name: guestName,
    attending,
    guest_count: guestCount,
    group_category: groupCategory || null,
    notes,
    created_at: now,
    updated_at: now,
  };

  rsvps.set(rsvpId, newRsvp);

  return res.status(201).json({
    status: 'ok',
    rsvp_id: rsvpId,
    rsvp_token: rawToken,
    guest_name: guestName,
    attending,
    guest_count: guestCount,
    group_category: groupCategory,
    notes,
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

  let attending = rsvp.attending;
  if (data.attending !== undefined) {
    if (data.attending !== 0 && data.attending !== 1 && data.attending !== true && data.attending !== false) {
      return res.status(422).json({ error: 'Validation Error', message: "Field 'attending' must be 0 or 1." });
    }
    attending = (data.attending === 1 || data.attending === true) ? 1 : 0;
  }

  let guestCount = rsvp.guest_count;
  if (data.guest_count !== undefined) {
    const parsed = parseInt(data.guest_count, 10);
    if (isNaN(parsed)) {
      return res.status(422).json({ error: 'Validation Error', message: "Field 'guest_count' must be an integer." });
    }
    guestCount = parsed;
  } else if (attending === 0) {
    guestCount = 0;
  }

  if (attending === 1) {
    if (guestCount < 1 || guestCount > 4) {
      return res.status(422).json({ error: 'Validation Error', message: "When attending, 'guest_count' must be between 1 and 4." });
    }
  } else {
    guestCount = 0;
  }

  let groupCategory = rsvp.group_category;
  if (data.group_category !== undefined) {
    if (data.group_category && data.group_category !== 'Keluarga' && data.group_category !== 'Teman') {
      return res.status(422).json({ error: 'Validation Error', message: "Field 'group_category' must be 'Keluarga' or 'Teman'." });
    }
    groupCategory = data.group_category;
  }

  let notes = rsvp.notes;
  if (data.notes !== undefined) {
    notes = data.notes ? cleanText(data.notes, 500) : null;
  }

  // If transitioning to attending = 0, cancel active bookings and seats
  if (attending === 0) {
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

  rsvp.attending = attending;
  rsvp.guest_count = guestCount;
  rsvp.group_category = groupCategory;
  rsvp.notes = notes;
  rsvp.updated_at = new Date().toISOString();

  return res.json({
    status: 'ok',
    message: 'RSVP updated successfully.',
    rsvp_id: rsvpId,
    attending,
    guest_count: guestCount,
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

// Fallback: Serve index.html or 404 for API
app.use((req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not Found', message: `API endpoint '${req.path}' not found.` });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Wedding Invitation Server running at http://${HOST}:${PORT}`);
});
