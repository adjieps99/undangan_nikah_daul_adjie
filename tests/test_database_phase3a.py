"""
Automated Test Suite for Phase 3A: Database Module & Safe Migration
Tests schema integrity, constraints, idempotency, token hashing, and backup/restore.
"""

import os
import shutil
import sqlite3
import tempfile
import unittest
from flask import Flask

import database

class TestDatabasePhase3A(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, 'test_wedding.db')
        
        self.app = Flask(__name__)
        self.app.config['DATABASE'] = self.db_path
        self.app.config['TESTING'] = True

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_database_initialization_and_migration_idempotency(self):
        """Verify init_db initializes the database and can be repeated idempotently."""
        # Run 1st initialization
        database.init_db(self.app)
        self.assertTrue(os.path.exists(self.db_path))

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Check migrations table
        cursor.execute("SELECT version, description FROM schema_migrations")
        migrations = cursor.fetchall()
        self.assertEqual(len(migrations), 1)
        self.assertEqual(migrations[0]['version'], 1)

        # Check baseline seats count
        cursor.execute("SELECT count(*) as count FROM seats")
        self.assertEqual(cursor.fetchone()['count'], 8)
        conn.close()

        # Run 2nd initialization on same database (Simulating app restart / second worker)
        database.init_db(self.app)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Verify no duplicate migration records and no duplicate seats
        cursor.execute("SELECT count(*) as count FROM schema_migrations")
        self.assertEqual(cursor.fetchone()['count'], 1)

        cursor.execute("SELECT count(*) as count FROM seats")
        self.assertEqual(cursor.fetchone()['count'], 8)
        conn.close()

    def test_pragma_settings_enforced_on_connection(self):
        """Verify foreign_keys and busy_timeout are enforced on connections."""
        database.init_db(self.app)

        with self.app.app_context():
            conn = database.get_db()
            cursor = conn.cursor()

            cursor.execute("PRAGMA foreign_keys")
            fk_status = cursor.fetchone()[0]
            self.assertEqual(fk_status, 1, "PRAGMA foreign_keys must be ON.")

            cursor.execute("PRAGMA busy_timeout")
            timeout = cursor.fetchone()[0]
            self.assertEqual(timeout, 5000, "PRAGMA busy_timeout must be 5000ms.")

    def test_foreign_key_constraint_enforcement(self):
        """Verify foreign keys prevent orphaned bookings or reservations."""
        database.init_db(self.app)

        with self.app.app_context():
            conn = database.get_db()
            cursor = conn.cursor()

            # Attempt to insert booking with non-existent rsvp_id (999)
            with self.assertRaises(sqlite3.IntegrityError):
                cursor.execute("""
                    INSERT INTO bookings (booking_code, rsvp_id, idempotency_key, payload_hash, status)
                    VALUES ('BKG-TEST', 999, 'key-1', 'hash-1', 'CONFIRMED')
                """)
                conn.commit()

    def test_rsvp_check_constraints(self):
        """Verify CHECK constraints on attending and guest_count in rsvps table."""
        database.init_db(self.app)

        with self.app.app_context():
            conn = database.get_db()
            cursor = conn.cursor()

            _, token_hash = database.generate_rsvp_token()

            # 1. Invalid attending value (must be 0 or 1)
            with self.assertRaises(sqlite3.IntegrityError):
                cursor.execute("""
                    INSERT INTO rsvps (token_hash, guest_name, attending, guest_count)
                    VALUES (?, 'Budi', 2, 1)
                """, (token_hash,))
                conn.commit()

            # 2. Attending = 1 with guest_count = 0 (Violates guest_count >= 1)
            with self.assertRaises(sqlite3.IntegrityError):
                cursor.execute("""
                    INSERT INTO rsvps (token_hash, guest_name, attending, guest_count)
                    VALUES (?, 'Budi', 1, 0)
                """, (token_hash,))
                conn.commit()

            # 3. Attending = 0 with guest_count = 2 (Violates guest_count = 0 when not attending)
            with self.assertRaises(sqlite3.IntegrityError):
                cursor.execute("""
                    INSERT INTO rsvps (token_hash, guest_name, attending, guest_count)
                    VALUES (?, 'Budi', 0, 2)
                """, (token_hash,))
                conn.commit()

            # 4. Valid attending RSVP (attending=1, count=2)
            cursor.execute("""
                INSERT INTO rsvps (token_hash, guest_name, attending, guest_count, group_category)
                VALUES (?, 'Budi', 1, 2, 'Keluarga')
            """, (token_hash,))
            conn.commit()
            self.assertEqual(cursor.rowcount, 1)

    def test_unique_partial_index_anti_double_booking(self):
        """Verify uq_active_seat_reservation strictly blocks duplicate CONFIRMED bookings on the same seat."""
        database.init_db(self.app)

        with self.app.app_context():
            conn = database.get_db()
            cursor = conn.cursor()

            # Insert RSVP
            _, token_hash = database.generate_rsvp_token()
            cursor.execute("""
                INSERT INTO rsvps (token_hash, guest_name, attending, guest_count, group_category)
                VALUES (?, 'Guest 1', 1, 1, 'Keluarga')
            """, (token_hash,))
            rsvp1_id = cursor.lastrowid

            # Booking 1: Reserve seat A1 as CONFIRMED
            cursor.execute("""
                INSERT INTO bookings (booking_code, rsvp_id, idempotency_key, payload_hash, status)
                VALUES ('BKG-001', ?, 'key-001', 'hash-A1', 'CONFIRMED')
            """, (rsvp1_id,))
            bkg1_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO reserved_seats (booking_id, seat_id, status)
                VALUES (?, 'A1', 'CONFIRMED')
            """, (bkg1_id,))
            conn.commit()

            # Booking 2: Second guest attempts to reserve seat A1 as CONFIRMED
            _, token_hash2 = database.generate_rsvp_token()
            cursor.execute("""
                INSERT INTO rsvps (token_hash, guest_name, attending, guest_count, group_category)
                VALUES (?, 'Guest 2', 1, 1, 'Keluarga')
            """, (token_hash2,))
            rsvp2_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO bookings (booking_code, rsvp_id, idempotency_key, payload_hash, status)
                VALUES ('BKG-002', ?, 'key-002', 'hash-A1', 'CONFIRMED')
            """, (rsvp2_id,))
            bkg2_id = cursor.lastrowid
            conn.commit()

            # Must raise IntegrityError due to uq_active_seat_reservation
            with self.assertRaises(sqlite3.IntegrityError):
                cursor.execute("""
                    INSERT INTO reserved_seats (booking_id, seat_id, status)
                    VALUES (?, 'A1', 'CONFIRMED')
                """, (bkg2_id,))
                conn.commit()

            conn.rollback()

            # Now cancel Booking 1
            cursor.execute("UPDATE reserved_seats SET status = 'CANCELLED' WHERE booking_id = ?", (bkg1_id,))
            cursor.execute("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", (bkg1_id,))
            conn.commit()

            # Now Booking 2 should succeed since seat A1 has no active CONFIRMED reservation
            cursor.execute("""
                INSERT INTO reserved_seats (booking_id, seat_id, status)
                VALUES (?, 'A1', 'CONFIRMED')
            """, (bkg2_id,))
            conn.commit()
            self.assertEqual(cursor.rowcount, 1)

    def test_token_hashing_and_verification(self):
        """Verify token generation, hashing, and constant-time verification."""
        raw_token, token_hash = database.generate_rsvp_token()
        self.assertTrue(len(raw_token) >= 32)
        self.assertEqual(len(token_hash), 64)  # SHA-256 hex digest length

        # Verification tests
        self.assertTrue(database.verify_rsvp_token(raw_token, token_hash))
        self.assertFalse(database.verify_rsvp_token('tampered_token', token_hash))
        self.assertFalse(database.verify_rsvp_token('', token_hash))
        self.assertFalse(database.verify_rsvp_token(raw_token, ''))

    def test_online_backup_api(self):
        """Verify SQLite Online Backup API creates a consistent, readable backup copy."""
        database.init_db(self.app)

        # Insert some test data
        with self.app.app_context():
            conn = database.get_db()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO wishes (sender_name, message)
                VALUES ('Test Sender', 'Selamat menempuh hidup baru!')
            """)
            conn.commit()

        # Perform online backup
        backup_path = os.path.join(self.temp_dir, 'backup_test.db')
        database.backup_database(backup_path, self.app)

        self.assertTrue(os.path.exists(backup_path))

        # Inspect backup database directly
        b_conn = sqlite3.connect(backup_path)
        b_conn.row_factory = sqlite3.Row
        b_cur = b_conn.cursor()

        b_cur.execute("SELECT count(*) as count FROM seats")
        self.assertEqual(b_cur.fetchone()['count'], 8)

        b_cur.execute("SELECT sender_name, message FROM wishes")
        wish = b_cur.fetchone()
        self.assertEqual(wish['sender_name'], 'Test Sender')
        self.assertEqual(wish['message'], 'Selamat menempuh hidup baru!')

        b_conn.close()

    def test_concurrent_multi_worker_initialization(self):
        """Simulate Gunicorn starting multiple workers simultaneously, verifying zero migration conflicts."""
        import concurrent.futures
        concurrent_db_path = os.path.join(self.temp_dir, 'concurrent_test.db')
        worker_app = Flask(__name__)
        worker_app.config['DATABASE'] = concurrent_db_path
        worker_app.config['TESTING'] = True

        def worker_startup():
            database.init_db(worker_app)
            return True

        # Spawn 4 workers simultaneously calling init_db on the exact same database file
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(worker_startup) for _ in range(4)]
            results = [f.result() for f in futures]

        self.assertEqual(results, [True, True, True, True])

        # Verify database consistency after 4 simultaneous inits
        conn = sqlite3.connect(concurrent_db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT count(*) as count FROM schema_migrations")
        self.assertEqual(cur.fetchone()['count'], 1)

        cur.execute("SELECT count(*) as count FROM seats")
        self.assertEqual(cur.fetchone()['count'], 8)
        conn.close()

    def test_database_restore_procedure(self):
        """Verify the full backup-and-restore cycle: backup from active DB, restore to clean target, verify writeability."""
        database.init_db(self.app)

        with self.app.app_context():
            conn = database.get_db()
            cur = conn.cursor()
            cur.execute("INSERT INTO wishes (sender_name, message) VALUES ('Backup Donor', 'Doa terbaik!')")
            conn.commit()

        backup_file = os.path.join(self.temp_dir, 'snapshot.bak')
        database.backup_database(backup_file, self.app)
        self.assertTrue(os.path.exists(backup_file))

        # Perform Restore Procedure to a brand new database path
        restored_db_path = os.path.join(self.temp_dir, 'restored.db')
        restored_app = Flask(__name__)
        restored_app.config['DATABASE'] = restored_db_path
        restored_app.config['TESTING'] = True

        # Restore using SQLite Online Backup API in reverse (from backup to restored destination)
        src = sqlite3.connect(backup_file)
        dst = sqlite3.connect(restored_db_path)
        src.backup(dst)
        dst.close()
        src.close()

        # Connect to restored database via Flask context and verify
        with restored_app.app_context():
            r_conn = database.get_db()
            r_cur = r_conn.cursor()
            r_cur.execute("SELECT sender_name, message FROM wishes WHERE sender_name = 'Backup Donor'")
            row = r_cur.fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row['message'], 'Doa terbaik!')

            # Verify that restored database is fully writable and constraints work
            r_cur.execute("INSERT INTO wishes (sender_name, message) VALUES ('Post Restore', 'Sukses!')")
            r_conn.commit()
            r_cur.execute("SELECT count(*) as count FROM wishes")
            self.assertEqual(r_cur.fetchone()['count'], 2)

if __name__ == '__main__':
    unittest.main()

