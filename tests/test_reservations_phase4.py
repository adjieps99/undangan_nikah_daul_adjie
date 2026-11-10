"""
Automated Test Suite for Phase 4: Seat Reservation, Idempotency & Concurrency
Tests atomic booking, multi-seat rollback, category validation, parallel concurrency, and cancellation.
"""

import os
import shutil
import tempfile
import unittest
import concurrent.futures
import sqlite3

from app import app
import database
import routes.api

class TestReservationsPhase4(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, 'test_reservations.db')
        
        self.app = app
        app.config['DATABASE'] = self.db_path
        app.config['TESTING'] = True
        self.client = app.test_client()

        # Clear rate limiter state for clean test isolation
        routes.api.clear_rate_limits()

        # Initialize fresh database schema and seats
        database.init_db(app)

    def tearDown(self):
        routes.api.clear_rate_limits()
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _create_test_rsvp(self, name="Test Guest", attending=1, count=2, group="Keluarga"):
        routes.api.clear_rate_limits()
        res = self.client.post('/api/rsvp', json={
            "guest_name": name,
            "attending": attending,
            "guest_count": count,
            "group_category": group
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        return data['rsvp_id'], data['rsvp_token']

    # ====================================================================
    # 1. SEATS AVAILABILITY & BASIC RESERVATION
    # ====================================================================

    def test_get_seats_initial_state(self):
        """Test GET /api/seats returns 8 seats, all available initially."""
        res = self.client.get('/api/seats')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'ok')
        seats = data['seats']
        self.assertEqual(len(seats), 8)
        for s in seats:
            self.assertTrue(s['is_available'])
            self.assertFalse(s['is_reserved'])

    def test_create_valid_reservation(self):
        """Test creating a valid multi-seat reservation for Keluarga."""
        rsvp_id, token = self._create_test_rsvp("Budi", attending=1, count=2, group="Keluarga")

        res = self.client.post('/api/reservations', headers={'X-RSVP-Token': token}, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["A1", "A2"]
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertIn('booking_code', data)
        self.assertEqual(data['reserved_seats'], ["A1", "A2"])

        # Check /api/seats updates availability
        res_seats = self.client.get('/api/seats')
        seats_by_id = {s['id']: s for s in res_seats.get_json()['seats']}
        self.assertTrue(seats_by_id['A1']['is_reserved'])
        self.assertFalse(seats_by_id['A1']['is_available'])
        self.assertTrue(seats_by_id['A2']['is_reserved'])
        self.assertFalse(seats_by_id['A2']['is_available'])
        self.assertTrue(seats_by_id['B1']['is_available'])

    # ====================================================================
    # 2. VALIDATION & INTEGRITY CONSTRAINTS
    # ====================================================================

    def test_reservation_validation_rules(self):
        """Test validation rules: seat count, category mismatch, attending status."""
        rsvp_id, token = self._create_test_rsvp("Teman Tamu", attending=1, count=2, group="Teman")

        # 1. Seat count mismatch (chose 1 seat for 2 guests)
        res1 = self.client.post('/api/reservations', headers={'X-RSVP-Token': token}, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["C1"]
        })
        self.assertEqual(res1.status_code, 422)

        # 2. Group category mismatch (Teman attempting to book Keluarga row A)
        res2 = self.client.post('/api/reservations', headers={'X-RSVP-Token': token}, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["A1", "C1"]
        })
        self.assertEqual(res2.status_code, 422)

        # 3. Non-existent seat ID
        res3 = self.client.post('/api/reservations', headers={'X-RSVP-Token': token}, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["Z9", "C1"]
        })
        self.assertEqual(res3.status_code, 422)

        # 4. Reservation for non-attending guest
        rsvp_not_attending, token_na = self._create_test_rsvp("Absent Guest", attending=0, count=0)
        res4 = self.client.post('/api/reservations', headers={'X-RSVP-Token': token_na}, json={
            "rsvp_id": rsvp_not_attending,
            "seat_ids": ["C1"]
        })
        self.assertEqual(res4.status_code, 422)

        # 5. Invalid / Missing Token (401 / 403)
        res5 = self.client.post('/api/reservations', json={"rsvp_id": rsvp_id, "seat_ids": ["C1", "C2"]})
        self.assertEqual(res5.status_code, 401)

        res6 = self.client.post('/api/reservations', headers={'X-RSVP-Token': 'wrong_token'}, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["C1", "C2"]
        })
        self.assertEqual(res6.status_code, 403)

    # ====================================================================
    # 3. ATOMIC MULTI-SEAT ALL-OR-NOTHING ROLLBACK
    # ====================================================================

    def test_multi_seat_conflict_atomic_rollback(self):
        """Verify that if 1 seat in a batch conflicts, ALL seats in the request roll back (no partial reservation)."""
        # Guest 1 reserves B1
        rsvp1, token1 = self._create_test_rsvp("Guest 1", attending=1, count=1, group="Keluarga")
        res1 = self.client.post('/api/reservations', headers={'X-RSVP-Token': token1}, json={
            "rsvp_id": rsvp1,
            "seat_ids": ["B1"]
        })
        self.assertEqual(res1.status_code, 201)

        # Guest 2 attempts to reserve B1 AND B2 (B1 is conflicted)
        rsvp2, token2 = self._create_test_rsvp("Guest 2", attending=1, count=2, group="Keluarga")
        res2 = self.client.post('/api/reservations', headers={'X-RSVP-Token': token2}, json={
            "rsvp_id": rsvp2,
            "seat_ids": ["B1", "B2"]
        })
        self.assertEqual(res2.status_code, 409)

        # Verify B2 was NOT reserved partially
        res_seats = self.client.get('/api/seats')
        seats_by_id = {s['id']: s for s in res_seats.get_json()['seats']}
        self.assertTrue(seats_by_id['B1']['is_reserved'])
        self.assertFalse(seats_by_id['B2']['is_reserved'], "Seat B2 must remain available after transaction rollback.")

    # ====================================================================
    # 4. PARALLEL CONCURRENCY ANTI-DOUBLE-BOOKING
    # ====================================================================

    def test_parallel_concurrency_same_seat_race_condition(self):
        """Simulate two threads submitting reservations for the exact same seat simultaneously."""
        rsvp_a, token_a = self._create_test_rsvp("Racer A", attending=1, count=1, group="Teman")
        rsvp_b, token_b = self._create_test_rsvp("Racer B", attending=1, count=1, group="Teman")

        target_seat = ["D1"]

        def submit_reservation(rsvp_id, token, key):
            c = app.test_client()
            return c.post('/api/reservations', headers={'X-RSVP-Token': token, 'Idempotency-Key': key}, json={
                "rsvp_id": rsvp_id,
                "seat_ids": target_seat
            })

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            fut_a = executor.submit(submit_reservation, rsvp_a, token_a, "key-race-A")
            fut_b = executor.submit(submit_reservation, rsvp_b, token_b, "key-race-B")
            res_a = fut_a.result()
            res_b = fut_b.result()

        status_codes = sorted([res_a.status_code, res_b.status_code])
        self.assertEqual(status_codes, [201, 409], "Exactly one thread must succeed (201) and one must conflict (409).")

        # Determine winner and loser
        loser_rsvp = rsvp_b if res_a.status_code == 201 else rsvp_a

        # Verify database has exactly 1 active CONFIRMED reservation
        with self.app.app_context():
            conn = database.get_db()
            cur = conn.cursor()
            cur.execute("SELECT count(*) as count FROM reserved_seats WHERE seat_id = 'D1' AND status = 'CONFIRMED'")
            self.assertEqual(cur.fetchone()['count'], 1)

            # Assert loser has NO active parent booking and NO child seats
            cur.execute("SELECT count(*) as count FROM bookings WHERE rsvp_id = ? AND status = 'CONFIRMED'", (loser_rsvp,))
            self.assertEqual(cur.fetchone()['count'], 0)
            cur.execute("""
                SELECT count(*) as count FROM reserved_seats rs
                JOIN bookings b ON rs.booking_id = b.id
                WHERE b.rsvp_id = ?
            """, (loser_rsvp,))
            self.assertEqual(cur.fetchone()['count'], 0, "Losing transaction must rollback completely and leave NO child or parent rows.")

    # ====================================================================
    # 5. IDEMPOTENCY
    # ====================================================================

    def test_idempotency_retry_and_conflict(self):
        """Test idempotency key retry with same payload (200 OK) vs conflicting payload (422)."""
        rsvp_id, token = self._create_test_rsvp("Idempotent Guest", attending=1, count=2, group="Teman")
        idemp_key = "idemp-unique-token-12345"

        # Initial booking
        res1 = self.client.post('/api/reservations', headers={
            'X-RSVP-Token': token,
            'Idempotency-Key': idemp_key
        }, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["C1", "C2"]
        })
        self.assertEqual(res1.status_code, 201)
        booking_code = res1.get_json()['booking_code']

        # Retry identical request with same key
        res_retry = self.client.post('/api/reservations', headers={
            'X-RSVP-Token': token,
            'Idempotency-Key': idemp_key
        }, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["C1", "C2"]
        })
        self.assertEqual(res_retry.status_code, 200)
        self.assertEqual(res_retry.get_json()['booking_code'], booking_code)

        # Retry same key with DIFFERENT payload (D1, D2) -> Must be rejected (422)
        res_conflict = self.client.post('/api/reservations', headers={
            'X-RSVP-Token': token,
            'Idempotency-Key': idemp_key
        }, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["D1", "D2"]
        })
        self.assertEqual(res_conflict.status_code, 422)

    def test_idempotency_cross_rsvp_rejection(self):
        """Idempotency key cannot be reused across different RSVPs."""
        rsvp1, token1 = self._create_test_rsvp("Guest One", attending=1, count=1, group="Teman")
        rsvp2, token2 = self._create_test_rsvp("Guest Two", attending=1, count=1, group="Teman")
        shared_key = "shared-secret-key-xyz"

        # Guest 1 reserves C1
        res1 = self.client.post('/api/reservations', headers={
            'X-RSVP-Token': token1,
            'Idempotency-Key': shared_key
        }, json={
            "rsvp_id": rsvp1,
            "seat_ids": ["C1"]
        })
        self.assertEqual(res1.status_code, 201)

        # Guest 2 attempts to reuse same Idempotency-Key
        res2 = self.client.post('/api/reservations', headers={
            'X-RSVP-Token': token2,
            'Idempotency-Key': shared_key
        }, json={
            "rsvp_id": rsvp2,
            "seat_ids": ["C1"]
        })
        self.assertEqual(res2.status_code, 422)

    # ====================================================================
    # 6. ATOMIC REBOOKING ROLLBACK
    # ====================================================================

    def test_rebooking_atomic_failure_preserves_old_booking(self):
        """When modifying a reservation, if the new booking conflicts, the old booking must NOT be lost."""
        # Guest 1 initially reserves A1
        rsvp1, token1 = self._create_test_rsvp("Rebooker", attending=1, count=1, group="Keluarga")
        res1 = self.client.post('/api/reservations', headers={'X-RSVP-Token': token1}, json={
            "rsvp_id": rsvp1,
            "seat_ids": ["A1"]
        })
        self.assertEqual(res1.status_code, 201)
        old_booking_code = res1.get_json()['booking_code']

        # Guest 2 reserves B1
        rsvp2, token2 = self._create_test_rsvp("Other Guest", attending=1, count=1, group="Keluarga")
        res2 = self.client.post('/api/reservations', headers={'X-RSVP-Token': token2}, json={
            "rsvp_id": rsvp2,
            "seat_ids": ["B1"]
        })
        self.assertEqual(res2.status_code, 201)

        # Guest 1 updates their RSVP guest_count to 2
        res_up = self.client.put(f'/api/rsvp/{rsvp1}', headers={'X-RSVP-Token': token1}, json={
            "guest_count": 2,
            "attending": 1
        })
        self.assertEqual(res_up.status_code, 200)

        # Guest 1 attempts to change seats to ["A1", "B1"] (B1 is taken by Guest 2)
        res_conflict = self.client.post('/api/reservations', headers={'X-RSVP-Token': token1}, json={
            "rsvp_id": rsvp1,
            "seat_ids": ["A1", "B1"]
        })
        self.assertEqual(res_conflict.status_code, 409)

        # Verify Guest 1's previous booking on A1 was NOT released or deleted due to rollback!
        with self.app.app_context():
            conn = database.get_db()
            cur = conn.cursor()
            cur.execute("""
                SELECT b.booking_code, b.status as b_status, rs.seat_id, rs.status as rs_status 
                FROM bookings b
                JOIN reserved_seats rs ON b.id = rs.booking_id
                WHERE b.rsvp_id = ? AND b.status = 'CONFIRMED'
            """, (rsvp1,))
            rows = cur.fetchall()
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]['booking_code'], old_booking_code)
            self.assertEqual(rows[0]['seat_id'], 'A1')
            self.assertEqual(rows[0]['rs_status'], 'CONFIRMED')

    # ====================================================================
    # 7. CANCELLATION & RE-BOOKING
    # ====================================================================

    def test_cancel_reservation_and_rebooking(self):
        """Test cancelling booking atomically frees up seats for other guests."""
        rsvp_id, token = self._create_test_rsvp("Cancelling Guest", attending=1, count=1, group="Keluarga")

        res_book = self.client.post('/api/reservations', headers={'X-RSVP-Token': token}, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["A1"]
        })
        self.assertEqual(res_book.status_code, 201)
        booking_id = res_book.get_json()['booking_id']

        # Cancel reservation
        res_cancel = self.client.delete(f'/api/reservations/{booking_id}', headers={'X-RSVP-Token': token})
        self.assertEqual(res_cancel.status_code, 200)

        # Verify seat A1 is available again
        res_seats = self.client.get('/api/seats')
        seats_by_id = {s['id']: s for s in res_seats.get_json()['seats']}
        self.assertTrue(seats_by_id['A1']['is_available'])

        # Another guest can now book A1
        rsvp2, token2 = self._create_test_rsvp("Second Guest", attending=1, count=1, group="Keluarga")
        res_rebook = self.client.post('/api/reservations', headers={'X-RSVP-Token': token2}, json={
            "rsvp_id": rsvp2,
            "seat_ids": ["A1"]
        })
        self.assertEqual(res_rebook.status_code, 201)

    # ====================================================================
    # 8. RSVP ATTENDANCE TRANSITION REGRESSION
    # ====================================================================

    def test_rsvp_transition_to_not_attending_cancels_active_booking(self):
        """Updating RSVP attending=0 must cancel active bookings and seats atomically."""
        rsvp_id, token = self._create_test_rsvp("Vacillating Guest", attending=1, count=1, group="Teman")
        res_book = self.client.post('/api/reservations', headers={'X-RSVP-Token': token}, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["C1"]
        })
        self.assertEqual(res_book.status_code, 201)

        # Seat C1 is reserved
        res_seats = self.client.get('/api/seats')
        seats_by_id = {s['id']: s for s in res_seats.get_json()['seats']}
        self.assertTrue(seats_by_id['C1']['is_reserved'])

        # Update RSVP to not attending (attending=0)
        res_update = self.client.put(f'/api/rsvp/{rsvp_id}', headers={'X-RSVP-Token': token}, json={
            "attending": 0,
            "guest_count": 0
        })
        self.assertEqual(res_update.status_code, 200)

        # Seat C1 is automatically freed up
        res_seats_after = self.client.get('/api/seats')
        seats_after = {s['id']: s for s in res_seats_after.get_json()['seats']}
        self.assertTrue(seats_after['C1']['is_available'])
        self.assertFalse(seats_after['C1']['is_reserved'])

if __name__ == '__main__':
    unittest.main()

