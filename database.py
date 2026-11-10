"""
Database Module for Undangan Antigravity
Provides connection lifecycle management, versioned schema migrations,
atomic transaction boundaries, and SQLite Online Backup support.
"""

import os
import hmac
import hashlib
import secrets
import sqlite3
from flask import current_app, g

# Initial seat data seed derived from static/js/data/wedding.js
BASELINE_SEATS = [
    ('A1', 'Seat A1 (Keluarga)', 'A', 1, 'Keluarga', 1),
    ('A2', 'Seat A2 (Keluarga)', 'A', 2, 'Keluarga', 1),
    ('B1', 'Seat B1 (Keluarga)', 'B', 1, 'Keluarga', 1),
    ('B2', 'Seat B2 (Keluarga)', 'B', 2, 'Keluarga', 1),
    ('C1', 'Seat C1 (Teman)', 'C', 1, 'Teman', 1),
    ('C2', 'Seat C2 (Teman)', 'C', 2, 'Teman', 1),
    ('D1', 'Seat D1 (Teman)', 'D', 1, 'Teman', 1),
    ('D2', 'Seat D2 (Teman)', 'D', 2, 'Teman', 1),
]

def get_db_path(app=None):
    """Resolve database path from app config, env, or Flask instance folder."""
    if app and app.config.get('DATABASE'):
        return app.config['DATABASE']
    if current_app and current_app.config.get('DATABASE'):
        return current_app.config['DATABASE']
    if os.environ.get('DATABASE_PATH'):
        return os.environ['DATABASE_PATH']
    
    target_app = app or current_app
    instance_path = target_app.instance_path if target_app else os.path.join(os.path.dirname(__file__), 'instance')
    os.makedirs(instance_path, exist_ok=True)
    return os.path.join(instance_path, 'wedding.db')

def get_db():
    """Get or create connection for current request context."""
    if 'db' not in g:
        db_path = get_db_path()
        conn = sqlite3.connect(db_path, timeout=5.0)
        conn.row_factory = sqlite3.Row
        
        # Enforce foreign keys and concurrency timeout on EVERY connection
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        
        g.db = conn
    return g.db

def close_db(e=None):
    """Close connection at the end of the request context."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def hash_token(raw_token: str) -> str:
    """Hash secret token with SHA-256 for secure database storage."""
    return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

def generate_rsvp_token() -> tuple[str, str]:
    """Generate cryptographically secure RSVP token and its hash."""
    raw_token = secrets.token_urlsafe(32)
    return raw_token, hash_token(raw_token)

def verify_rsvp_token(raw_token: str, stored_hash: str) -> bool:
    """Verify raw token against stored hash using constant-time comparison."""
    if not raw_token or not stored_hash:
        return False
    computed_hash = hash_token(raw_token)
    return hmac.compare_digest(computed_hash, stored_hash)

def run_migrations(conn):
    """Execute idempotent versioned migrations within an immediate transaction."""
    cursor = conn.cursor()
    cursor.execute("BEGIN IMMEDIATE")
    try:
        # 1. Schema Migrations Tracking Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                description TEXT NOT NULL,
                applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            )
        """)

        cursor.execute("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1")
        row = cursor.fetchone()
        current_version = row['version'] if row else 0

        # Migration 1: Core Wedding Schema
        if current_version < 1:
            # Table: rsvps (Stores token_hash, not raw token)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rsvps (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    token_hash TEXT NOT NULL UNIQUE,
                    guest_name TEXT NOT NULL,
                    attending INTEGER NOT NULL CHECK (attending IN (0, 1)),
                    guest_count INTEGER NOT NULL CHECK (
                        (attending = 1 AND guest_count >= 1 AND guest_count <= 4) OR
                        (attending = 0 AND guest_count = 0)
                    ),
                    group_category TEXT CHECK (group_category IN ('Keluarga', 'Teman') OR group_category IS NULL),
                    notes TEXT,
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_rsvps_token_hash ON rsvps(token_hash)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_rsvps_attending ON rsvps(attending)")

            # Table: wishes
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS wishes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sender_name TEXT NOT NULL,
                    message TEXT NOT NULL CHECK (length(message) >= 1 AND length(message) <= 500),
                    is_approved INTEGER NOT NULL DEFAULT 1 CHECK (is_approved IN (0, 1)),
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at DESC)")

            # Table: seats
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS seats (
                    id TEXT PRIMARY KEY,
                    label TEXT NOT NULL,
                    row_label TEXT NOT NULL,
                    seat_number INTEGER NOT NULL,
                    group_category TEXT NOT NULL CHECK (group_category IN ('Keluarga', 'Teman')),
                    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_seats_group ON seats(group_category, is_active)")

            # Table: bookings (Parent reservation entity with idempotency)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    booking_code TEXT NOT NULL UNIQUE,
                    rsvp_id INTEGER NOT NULL,
                    idempotency_key TEXT UNIQUE,
                    payload_hash TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                    FOREIGN KEY (rsvp_id) REFERENCES rsvps(id) ON UPDATE CASCADE ON DELETE RESTRICT
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_rsvp ON bookings(rsvp_id)")

            # Table: reserved_seats (Child seat reservations with active-seat constraint)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reserved_seats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    booking_id INTEGER NOT NULL,
                    seat_id TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON UPDATE CASCADE ON DELETE CASCADE,
                    FOREIGN KEY (seat_id) REFERENCES seats(id) ON UPDATE CASCADE ON DELETE RESTRICT
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_reserved_seats_booking ON reserved_seats(booking_id)")

            # UNIQUE PARTIAL INDEX: Only 1 CONFIRMED reservation per seat
            cursor.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_active_seat_reservation 
                ON reserved_seats(seat_id) 
                WHERE status = 'CONFIRMED'
            """)

            # Idempotent baseline seats seed
            cursor.executemany("""
                INSERT OR IGNORE INTO seats (id, label, row_label, seat_number, group_category, is_active)
                VALUES (?, ?, ?, ?, ?, ?)
            """, BASELINE_SEATS)

            # Record migration
            cursor.execute("""
                INSERT INTO schema_migrations (version, description)
                VALUES (1, 'Initial core schema: rsvps, wishes, seats, bookings, reserved_seats')
            """)

        conn.commit()
    except Exception:
        conn.rollback()
        raise

def init_db(app=None):
    """Initialize database schema and idempotent migrations."""
    db_path = get_db_path(app)
    # Ensure parent directory exists
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    
    conn = sqlite3.connect(db_path, timeout=5.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    
    # Try enabling WAL mode if supported by filesystem
    try:
        conn.execute("PRAGMA journal_mode = WAL;")
    except sqlite3.OperationalError:
        pass
        
    try:
        run_migrations(conn)
    finally:
        conn.close()

def backup_database(dest_path: str, app=None):
    """Create an online, non-blocking hot backup using SQLite Online Backup API."""
    db_path = get_db_path(app)
    os.makedirs(os.path.dirname(os.path.abspath(dest_path)), exist_ok=True)
    
    src_conn = sqlite3.connect(db_path, timeout=10.0)
    dst_conn = sqlite3.connect(dest_path)
    try:
        src_conn.backup(dst_conn, pages=100)
    finally:
        dst_conn.close()
        src_conn.close()

def init_app(app):
    """Register database teardown hook and initialize migrations on Flask startup."""
    app.teardown_appcontext(close_db)
    init_db(app)
