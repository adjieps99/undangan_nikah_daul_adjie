"""
API Routes for RSVP and Wishes (Phase 3B)
Provides validated, authenticated endpoints for digital invitations.
"""

import re
import time
import json
import secrets
import hashlib
import sqlite3
from collections import defaultdict
from flask import Blueprint, request, jsonify
import database

api_bp = Blueprint('api', __name__, url_prefix='/api')

# Sliding window rate limiter: key -> list of float timestamps
_rate_limit_records = defaultdict(list)

def clear_rate_limits():
    """Clear in-memory rate limiter records (useful for test isolation)."""
    _rate_limit_records.clear()

def is_rate_limited(key: str, limit: int = 5, window_seconds: int = 60) -> bool:
    """Check if key has exceeded limit requests within window_seconds."""
    now = time.time()
    # Filter out timestamps outside window
    timestamps = [t for t in _rate_limit_records[key] if now - t < window_seconds]
    _rate_limit_records[key] = timestamps
    if len(timestamps) >= limit:
        return True
    _rate_limit_records[key].append(now)
    return False

def clean_text(raw: str, max_length: int = 500) -> str:
    """Strip control characters, trim whitespace, and enforce length bound."""
    if not isinstance(raw, str):
        return ""
    cleaned = re.sub(r'[\u0000-\u001F\u007F-\u009F]', '', raw).strip()
    return cleaned[:max_length]

# ====================================================================
# RSVP ENDPOINTS
# ====================================================================

@api_bp.route('/rsvp', methods=['POST'])
def create_rsvp():
    """Create a new RSVP submission with cryptographically secure token."""
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or 'unknown').split(',')[0].strip()
    if is_rate_limited(f"rsvp:{client_ip}", limit=10, window_seconds=60):
        return jsonify({"error": "Too Many Requests", "message": "Terlalu banyak permintaan RSVP. Silakan coba beberapa saat lagi."}), 429

    if not request.is_json:
        return jsonify({"error": "Bad Request", "message": "Request content-type must be application/json"}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Bad Request", "message": "Invalid JSON payload"}), 400

    raw_name = data.get('guest_name')
    guest_name = clean_text(raw_name, 60)
    if not guest_name:
        return jsonify({"error": "Validation Error", "message": "Field 'guest_name' is required and cannot be empty."}), 422

    attending = data.get('attending')
    if attending not in (0, 1, True, False):
        return jsonify({"error": "Validation Error", "message": "Field 'attending' must be 0 (No) or 1 (Yes)."}), 422
    attending = 1 if attending in (1, True) else 0

    try:
        guest_count = int(data.get('guest_count', 1 if attending else 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Validation Error", "message": "Field 'guest_count' must be an integer."}), 422

    # Enforce business rules
    if attending == 1:
        if guest_count < 1 or guest_count > 4:
            return jsonify({"error": "Validation Error", "message": "When attending, 'guest_count' must be between 1 and 4."}), 422
    else:
        guest_count = 0

    group_category = data.get('group_category')
    if group_category and group_category not in ('Keluarga', 'Teman'):
        return jsonify({"error": "Validation Error", "message": "Field 'group_category' must be 'Keluarga' or 'Teman'."}), 422

    notes = clean_text(data.get('notes', ''), 500) if data.get('notes') else None

    # Generate cryptographic token and hash
    raw_token, token_hash = database.generate_rsvp_token()

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("BEGIN IMMEDIATE")
    try:
        cursor.execute("""
            INSERT INTO rsvps (token_hash, guest_name, attending, guest_count, group_category, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (token_hash, guest_name, attending, guest_count, group_category, notes))
        
        rsvp_id = cursor.lastrowid
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.rollback()
        return jsonify({"error": "Conflict", "message": "Database constraint violation occurred."}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to save RSVP."}), 500

    return jsonify({
        "status": "ok",
        "rsvp_id": rsvp_id,
        "rsvp_token": raw_token,  # Returned only once to client for secure localStorage storage
        "guest_name": guest_name,
        "attending": attending,
        "guest_count": guest_count,
        "group_category": group_category,
        "notes": notes
    }), 201


@api_bp.route('/rsvp/<int:rsvp_id>', methods=['GET'])
def get_rsvp(rsvp_id):
    """Retrieve private RSVP status with token authorization."""
    token = request.headers.get('X-RSVP-Token') or request.args.get('token')
    if not token:
        return jsonify({"error": "Unauthorized", "message": "X-RSVP-Token header or token parameter is required."}), 401

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, token_hash, guest_name, attending, guest_count, group_category, notes, created_at, updated_at
        FROM rsvps WHERE id = ?
    """, (rsvp_id,))
    row = cursor.fetchone()

    if not row:
        return jsonify({"error": "Not Found", "message": f"RSVP record with id {rsvp_id} does not exist."}), 404

    # Verify authorization
    if not database.verify_rsvp_token(token, row['token_hash']):
        return jsonify({"error": "Forbidden", "message": "Access denied. Invalid RSVP token."}), 403

    return jsonify({
        "status": "ok",
        "rsvp": {
            "id": row['id'],
            "guest_name": row['guest_name'],
            "attending": row['attending'],
            "guest_count": row['guest_count'],
            "group_category": row['group_category'],
            "notes": row['notes'],
            "created_at": row['created_at'],
            "updated_at": row['updated_at']
        }
    }), 200


@api_bp.route('/rsvp/<int:rsvp_id>', methods=['PUT'])
def update_rsvp(rsvp_id):
    """Update RSVP details with token authorization."""
    token = request.headers.get('X-RSVP-Token')
    if not request.is_json:
        return jsonify({"error": "Bad Request", "message": "Request content-type must be application/json"}), 400

    data = request.get_json(silent=True) or {}
    if not token:
        token = data.get('rsvp_token')

    if not token:
        return jsonify({"error": "Unauthorized", "message": "X-RSVP-Token header or rsvp_token body field is required."}), 401

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, token_hash, attending, guest_count, group_category, notes FROM rsvps WHERE id = ?", (rsvp_id,))
    row = cursor.fetchone()

    if not row:
        return jsonify({"error": "Not Found", "message": f"RSVP record with id {rsvp_id} does not exist."}), 404

    # Verify authorization
    if not database.verify_rsvp_token(token, row['token_hash']):
        return jsonify({"error": "Forbidden", "message": "Access denied. Invalid RSVP token."}), 403

    # Validate update fields
    attending = data.get('attending')
    if attending is not None and attending not in (0, 1, True, False):
        return jsonify({"error": "Validation Error", "message": "Field 'attending' must be 0 or 1."}), 422
    attending = (1 if attending in (1, True) else 0) if attending is not None else row['attending']

    if 'guest_count' in data:
        try:
            guest_count = int(data.get('guest_count'))
        except (ValueError, TypeError):
            return jsonify({"error": "Validation Error", "message": "Field 'guest_count' must be an integer."}), 422
    else:
        guest_count = row['guest_count'] if attending == 1 else 0

    if attending == 1:
        if guest_count < 1 or guest_count > 4:
            return jsonify({"error": "Validation Error", "message": "When attending, 'guest_count' must be between 1 and 4."}), 422
    else:
        guest_count = 0

    if 'group_category' in data:
        group_category = data.get('group_category')
        if group_category and group_category not in ('Keluarga', 'Teman'):
            return jsonify({"error": "Validation Error", "message": "Field 'group_category' must be 'Keluarga' or 'Teman'."}), 422
    else:
        group_category = row['group_category']

    if 'notes' in data:
        notes = clean_text(data.get('notes', ''), 500) if data.get('notes') is not None else None
    else:
        notes = row['notes']

    cursor.execute("BEGIN IMMEDIATE")
    try:
        # If transitioning to attending = 0, atomically cancel active bookings and seats
        if attending == 0:
            cursor.execute("""
                UPDATE reserved_seats 
                SET status = 'CANCELLED' 
                WHERE booking_id IN (SELECT id FROM bookings WHERE rsvp_id = ? AND status = 'CONFIRMED')
            """, (rsvp_id,))
            cursor.execute("UPDATE bookings SET status = 'CANCELLED' WHERE rsvp_id = ?", (rsvp_id,))

        cursor.execute("""
            UPDATE rsvps 
            SET attending = ?, guest_count = ?, group_category = ?, notes = ?, updated_at = (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            WHERE id = ?
        """, (attending, guest_count, group_category, notes, rsvp_id))
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to update RSVP."}), 500

    return jsonify({
        "status": "ok",
        "message": "RSVP updated successfully.",
        "rsvp_id": rsvp_id,
        "attending": attending,
        "guest_count": guest_count
    }), 200


# ====================================================================
# WISHES ENDPOINTS
# ====================================================================

@api_bp.route('/wishes', methods=['GET'])
def get_wishes():
    """Retrieve approved wishes with pagination support."""
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(50, max(1, int(request.args.get('limit', 10))))
    except (ValueError, TypeError):
        return jsonify({"error": "Validation Error", "message": "Parameters 'page' and 'limit' must be positive integers."}), 422

    offset = (page - 1) * limit

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT count(*) as total FROM wishes WHERE is_approved = 1")
    total = cursor.fetchone()['total']

    cursor.execute("""
        SELECT id, sender_name, message, created_at
        FROM wishes 
        WHERE is_approved = 1 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    """, (limit, offset))
    rows = cursor.fetchall()

    wishes_list = [
        {
            "id": r['id'],
            "name": r['sender_name'],
            "message": r['message'],
            "timestamp": r['created_at']
        }
        for r in rows
    ]

    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return jsonify({
        "status": "ok",
        "wishes": wishes_list,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        }
    }), 200


@api_bp.route('/wishes', methods=['POST'])
def create_wish():
    """Submit a new guestbook wish."""
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or 'unknown').split(',')[0].strip()
    if is_rate_limited(f"wish:{client_ip}", limit=10, window_seconds=60):
        return jsonify({"error": "Too Many Requests", "message": "Terlalu banyak pengiriman pesan. Silakan coba beberapa saat lagi."}), 429

    if not request.is_json:
        return jsonify({"error": "Bad Request", "message": "Request content-type must be application/json"}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Bad Request", "message": "Invalid JSON payload"}), 400

    raw_sender = data.get('sender_name') or data.get('name')
    sender_name = clean_text(raw_sender, 60)
    if not sender_name:
        sender_name = "Tamu Undangan"

    raw_msg = data.get('message')
    message = clean_text(raw_msg, 500)
    if not message:
        return jsonify({"error": "Validation Error", "message": "Field 'message' cannot be empty."}), 422

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("BEGIN IMMEDIATE")
    try:
        cursor.execute("""
            INSERT INTO wishes (sender_name, message, is_approved)
            VALUES (?, ?, 1)
        """, (sender_name, message))
        wish_id = cursor.lastrowid
        
        cursor.execute("SELECT created_at FROM wishes WHERE id = ?", (wish_id,))
        created_at = cursor.fetchone()['created_at']
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to save wish."}), 500

    return jsonify({
        "status": "ok",
        "wish": {
            "id": wish_id,
            "name": sender_name,
            "message": message,
            "timestamp": created_at
        }
    }), 201


# ====================================================================
# SEAT RESERVATION ENDPOINTS (Phase 4)
# ====================================================================

@api_bp.route('/seats', methods=['GET'])
def get_seats():
    """Retrieve all active seats with server-side availability status."""
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.id, s.label, s.row_label, s.seat_number, s.group_category, s.is_active,
               CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END as is_reserved
        FROM seats s
        LEFT JOIN reserved_seats r ON s.id = r.seat_id AND r.status = 'CONFIRMED'
        WHERE s.is_active = 1
        ORDER BY s.row_label ASC, s.seat_number ASC
    """)
    rows = cursor.fetchall()
    seats_list = [
        {
            "id": r['id'],
            "label": r['label'],
            "row": r['row_label'],
            "number": r['seat_number'],
            "group": r['group_category'],
            "is_available": r['is_reserved'] == 0,
            "is_reserved": r['is_reserved'] == 1
        }
        for r in rows
    ]
    return jsonify({"status": "ok", "seats": seats_list}), 200


@api_bp.route('/reservations', methods=['POST'])
def create_reservation():
    """Create atomic seat reservation for 1 or more seats with transaction and idempotency protection."""
    if not request.is_json:
        return jsonify({"error": "Bad Request", "message": "Request content-type must be application/json"}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Bad Request", "message": "Invalid JSON payload"}), 400

    rsvp_id = data.get('rsvp_id')
    raw_token = request.headers.get('X-RSVP-Token') or data.get('rsvp_token')
    idempotency_key = request.headers.get('Idempotency-Key') or data.get('idempotency_key')
    seat_ids = data.get('seat_ids')

    if not rsvp_id or not raw_token:
        return jsonify({"error": "Unauthorized", "message": "Fields 'rsvp_id' and 'X-RSVP-Token' header are required."}), 401

    if not isinstance(seat_ids, list) or len(seat_ids) == 0:
        return jsonify({"error": "Validation Error", "message": "Field 'seat_ids' must be a non-empty array of seat identifiers."}), 422

    if len(seat_ids) > 4:
        return jsonify({"error": "Validation Error", "message": "Maximum 4 seats can be reserved per RSVP."}), 422

    if len(seat_ids) != len(set(seat_ids)):
        return jsonify({"error": "Validation Error", "message": "Duplicate seats in seat_ids array."}), 422

    normalized_seats = sorted([str(s).strip() for s in seat_ids])
    payload_hash = hashlib.sha256(json.dumps(normalized_seats).encode('utf-8')).hexdigest()

    conn = database.get_db()
    cursor = conn.cursor()

    # 1. Verify RSVP and token authorization
    cursor.execute("""
        SELECT id, token_hash, guest_name, attending, guest_count, group_category 
        FROM rsvps WHERE id = ?
    """, (rsvp_id,))
    rsvp = cursor.fetchone()

    if not rsvp:
        return jsonify({"error": "Not Found", "message": f"RSVP record with id {rsvp_id} does not exist."}), 404

    if not database.verify_rsvp_token(raw_token, rsvp['token_hash']):
        return jsonify({"error": "Forbidden", "message": "Access denied. Invalid RSVP token."}), 403

    if rsvp['attending'] != 1:
        return jsonify({"error": "Validation Error", "message": "Reservations can only be made for attending guests (attending=1)."}), 422

    if len(normalized_seats) != rsvp['guest_count']:
        return jsonify({
            "error": "Validation Error",
            "message": f"Jumlah kursi yang dipilih ({len(normalized_seats)}) harus sama dengan jumlah tamu ({rsvp['guest_count']})."
        }), 422

    # 2. Check Idempotency key if supplied
    if idempotency_key:
        cursor.execute("""
            SELECT id, booking_code, rsvp_id, payload_hash, status 
            FROM bookings 
            WHERE idempotency_key = ?
        """, (idempotency_key,))
        existing_booking = cursor.fetchone()

        if existing_booking:
            if (existing_booking['rsvp_id'] == rsvp_id and 
                existing_booking['payload_hash'] == payload_hash and 
                existing_booking['status'] == 'CONFIRMED'):
                cursor.execute("""
                    SELECT seat_id FROM reserved_seats 
                    WHERE booking_id = ? AND status = 'CONFIRMED'
                """, (existing_booking['id'],))
                booked_seats = [r['seat_id'] for r in cursor.fetchall()]
                return jsonify({
                    "status": "ok",
                    "message": "Existing reservation returned (Idempotent).",
                    "booking_id": existing_booking['id'],
                    "booking_code": existing_booking['booking_code'],
                    "reserved_seats": booked_seats
                }), 200
            else:
                return jsonify({
                    "error": "Unprocessable Entity",
                    "message": "Idempotency key reuse with conflicting RSVP owner, payload, or status."
                }), 422

    # 3. Validate seat existence and group category in server
    for seat_id in normalized_seats:
        cursor.execute("SELECT id, group_category, is_active FROM seats WHERE id = ?", (seat_id,))
        seat = cursor.fetchone()
        if not seat or not seat['is_active']:
            return jsonify({"error": "Validation Error", "message": f"Kursi '{seat_id}' tidak valid atau tidak aktif."}), 422
        if seat['group_category'] != rsvp['group_category']:
            return jsonify({
                "error": "Validation Error",
                "message": f"Kursi '{seat_id}' khusus untuk kelompok '{seat['group_category']}', tetapi kelompok Anda adalah '{rsvp['group_category']}'."
            }), 422

    # 4. Atomic Transaction Execution
    cursor.execute("BEGIN IMMEDIATE")
    try:
        # If this RSVP already has an active booking, cancel old booking and its seats first
        cursor.execute("SELECT id FROM bookings WHERE rsvp_id = ? AND status = 'CONFIRMED'", (rsvp_id,))
        prev_bookings = cursor.fetchall()
        for pb in prev_bookings:
            cursor.execute("UPDATE reserved_seats SET status = 'CANCELLED' WHERE booking_id = ?", (pb['id'],))
            cursor.execute("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", (pb['id'],))

        # Create parent booking
        booking_code = f"BKG-{secrets.token_hex(4).upper()}"
        cursor.execute("""
            INSERT INTO bookings (booking_code, rsvp_id, idempotency_key, payload_hash, status)
            VALUES (?, ?, ?, ?, 'CONFIRMED')
        """, (booking_code, rsvp_id, idempotency_key, payload_hash))
        booking_id = cursor.lastrowid

        # Reserve each child seat
        for seat_id in normalized_seats:
            cursor.execute("""
                INSERT INTO reserved_seats (booking_id, seat_id, status)
                VALUES (?, ?, 'CONFIRMED')
            """, (booking_id, seat_id))

        conn.commit()
    except sqlite3.IntegrityError:
        conn.rollback()
        # Handled strictly as HTTP 409 Conflict (anti double booking)
        return jsonify({
            "error": "Conflict",
            "message": "Satu atau lebih kursi yang Anda pilih baru saja dipesan oleh tamu lain. Silakan pilih kursi lain."
        }), 409
    except Exception:
        conn.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to create reservation."}), 500

    return jsonify({
        "status": "ok",
        "message": "Reservation created successfully.",
        "booking_id": booking_id,
        "booking_code": booking_code,
        "rsvp_id": rsvp_id,
        "reserved_seats": normalized_seats
    }), 201


@api_bp.route('/reservations/<int:booking_id>', methods=['DELETE'])
def cancel_reservation(booking_id):
    """Cancel booking and atomically release its seats."""
    raw_token = request.headers.get('X-RSVP-Token') or request.args.get('rsvp_token')
    if not raw_token:
        return jsonify({"error": "Unauthorized", "message": "X-RSVP-Token header or rsvp_token is required."}), 401

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT b.id, b.status, r.token_hash 
        FROM bookings b
        JOIN rsvps r ON b.rsvp_id = r.id
        WHERE b.id = ?
    """, (booking_id,))
    booking = cursor.fetchone()

    if not booking:
        return jsonify({"error": "Not Found", "message": f"Booking with id {booking_id} does not exist."}), 404

    if not database.verify_rsvp_token(raw_token, booking['token_hash']):
        return jsonify({"error": "Forbidden", "message": "Access denied. Invalid RSVP token for this booking."}), 403

    cursor.execute("BEGIN IMMEDIATE")
    try:
        cursor.execute("UPDATE reserved_seats SET status = 'CANCELLED' WHERE booking_id = ?", (booking_id,))
        cursor.execute("""
            UPDATE bookings 
            SET status = 'CANCELLED', updated_at = (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) 
            WHERE id = ?
        """, (booking_id,))
        conn.commit()
    except Exception:
        conn.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to cancel reservation."}), 500

    return jsonify({
        "status": "ok",
        "message": f"Booking {booking_id} and reserved seats have been cancelled."
    }), 200

