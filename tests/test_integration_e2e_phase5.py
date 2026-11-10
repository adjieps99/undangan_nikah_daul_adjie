"""
Phase 5: End-to-End Integration & Failure Recovery Test Suite
Validates complete user journey: Cover, XSS safety, RSVP, Seating concurrency,
Idempotency retry, Atomic rebooking, Wishes guestbook, and Failure handling.
"""

import os
import shutil
import tempfile
import unittest
import concurrent.futures

from app import app
import database
import routes.api

class TestIntegrationE2EPhase5(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, 'test_e2e.db')
        
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

    # ====================================================================
    # SCENARIOS 1 & 2: XSS DEFENSE & SAFE GUEST NAME RENDERING
    # ====================================================================

    def test_e2e_01_and_02_xss_query_parameter_and_dom_safety(self):
        """Scenarios 1 & 2: Opening with ?to= XSS payload renders safe text, no HTML injection."""
        xss_payload = '<img src=x onerror=window.__xss_triggered=true>'
        res = self.client.get(f'/?to={xss_payload}')
        self.assertEqual(res.status_code, 200)
        # Server HTML must not evaluate or inject raw unescaped script in templates
        self.assertNotIn(b'window.__xss_triggered=true', res.data)

    # ====================================================================
    # SCENARIO 3: CREATE NEW RSVP AND PERSIST IN DATABASE
    # ====================================================================

    def test_e2e_03_create_new_rsvp_flow(self):
        """Scenario 3: Create new RSVP and ensure server persists record with secret token."""
        routes.api.clear_rate_limits()
        res = self.client.post('/api/rsvp', json={
            "guest_name": "Raden Mas Adjie",
            "attending": 1,
            "guest_count": 2,
            "group_category": "Keluarga",
            "notes": "Selamat menempuh hidup baru!"
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['guest_name'], "Raden Mas Adjie")
        self.assertEqual(data['attending'], 1)
        self.assertEqual(data['guest_count'], 2)
        self.assertIn('rsvp_token', data)
        self.assertTrue(len(data['rsvp_token']) >= 32)

        # Verify DB holds token_hash, not raw token
        with self.app.app_context():
            conn = database.get_db()
            cur = conn.cursor()
            cur.execute("SELECT id, token_hash, guest_name FROM rsvps WHERE id = ?", (data['rsvp_id'],))
            row = cur.fetchone()
            self.assertIsNotNone(row)
            self.assertNotEqual(row['token_hash'], data['rsvp_token'])
            self.assertTrue(database.verify_rsvp_token(data['rsvp_token'], row['token_hash']))

    # ====================================================================
    # SCENARIO 4: RELOAD PAGE AND RECOVER RSVP IDENTITY
    # ====================================================================

    def test_e2e_04_recover_rsvp_identity(self):
        """Scenario 4: Retrieve RSVP details using private token to verify identity restoration."""
        routes.api.clear_rate_limits()
        res_create = self.client.post('/api/rsvp', json={
            "guest_name": "Daul Gembul",
            "attending": 1,
            "guest_count": 1,
            "group_category": "Teman"
        })
        rsvp_id = res_create.get_json()['rsvp_id']
        token = res_create.get_json()['rsvp_token']

        # Re-fetch private status
        res_get = self.client.get(f'/api/rsvp/{rsvp_id}', headers={'X-RSVP-Token': token})
        self.assertEqual(res_get.status_code, 200)
        data = res_get.get_json()
        self.assertEqual(data['rsvp']['guest_name'], "Daul Gembul")
        self.assertEqual(data['rsvp']['group_category'], "Teman")

        # Cross-access without token or wrong token must be blocked (401 / 403)
        res_no_token = self.client.get(f'/api/rsvp/{rsvp_id}')
        self.assertEqual(res_no_token.status_code, 401)
        res_wrong_token = self.client.get(f'/api/rsvp/{rsvp_id}', headers={'X-RSVP-Token': 'bogus-token'})
        self.assertEqual(res_wrong_token.status_code, 403)

    # ====================================================================
    # SCENARIO 5: SEAT SELECTION & STATUS UPDATE FROM SERVER
    # ====================================================================

    def test_e2e_05_seat_selection_and_availability_update(self):
        """Scenario 5: Select seats matching guest count and ensure server status reflects reservation."""
        routes.api.clear_rate_limits()
        res_create = self.client.post('/api/rsvp', json={
            "guest_name": "Keluarga Budi",
            "attending": 1,
            "guest_count": 2,
            "group_category": "Keluarga"
        })
        rsvp_id = res_create.get_json()['rsvp_id']
        token = res_create.get_json()['rsvp_token']

        # 1. Fetch available seats
        res_seats1 = self.client.get('/api/seats')
        self.assertEqual(res_seats1.status_code, 200)
        seats1 = {s['id']: s for s in res_seats1.get_json()['seats']}
        self.assertTrue(seats1['A1']['is_available'])
        self.assertTrue(seats1['A2']['is_available'])

        # 2. Book seats A1, A2
        res_book = self.client.post('/api/reservations', headers={'X-RSVP-Token': token}, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["A1", "A2"]
        })
        self.assertEqual(res_book.status_code, 201)

        # 3. Refresh seats: A1 and A2 must now be reserved
        res_seats2 = self.client.get('/api/seats')
        seats2 = {s['id']: s for s in res_seats2.get_json()['seats']}
        self.assertTrue(seats2['A1']['is_reserved'])
        self.assertFalse(seats2['A1']['is_available'])
        self.assertTrue(seats2['A2']['is_reserved'])
        self.assertFalse(seats2['A2']['is_available'])

    # ====================================================================
    # SCENARIO 6: PARALLEL RACE CONDITION ON SAME SEAT
    # ====================================================================

    def test_e2e_06_parallel_race_condition_single_winner(self):
        """Scenario 6: Two concurrent sessions contesting seat C1; exactly one succeeds."""
        routes.api.clear_rate_limits()
        res1 = self.client.post('/api/rsvp', json={"guest_name": "Racer 1", "attending": 1, "guest_count": 1, "group_category": "Teman"})
        res2 = self.client.post('/api/rsvp', json={"guest_name": "Racer 2", "attending": 1, "guest_count": 1, "group_category": "Teman"})
        rsvp1, token1 = res1.get_json()['rsvp_id'], res1.get_json()['rsvp_token']
        rsvp2, token2 = res2.get_json()['rsvp_id'], res2.get_json()['rsvp_token']

        def submit_booking(r_id, tok):
            c = app.test_client()
            return c.post('/api/reservations', headers={'X-RSVP-Token': tok}, json={
                "rsvp_id": r_id,
                "seat_ids": ["C1"]
            })

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            fut1 = executor.submit(submit_booking, rsvp1, token1)
            fut2 = executor.submit(submit_booking, rsvp2, token2)
            res_a = fut1.result()
            res_b = fut2.result()

        status_codes = sorted([res_a.status_code, res_b.status_code])
        self.assertEqual(status_codes, [201, 409], "Exactly one thread must succeed (201) and one conflict (409).")

    # ====================================================================
    # SCENARIO 7: IDEMPOTENCY RETRY SIMULATION
    # ====================================================================

    def test_e2e_07_idempotency_retry_network_timeout_simulation(self):
        """Scenario 7: Network retry with same idempotency key returns exact same booking without duplicate rows."""
        routes.api.clear_rate_limits()
        res_r = self.client.post('/api/rsvp', json={"guest_name": "Retry User", "attending": 1, "guest_count": 1, "group_category": "Teman"})
        rsvp_id, token = res_r.get_json()['rsvp_id'], res_r.get_json()['rsvp_token']
        idemp_key = "e2e-uuid-key-retry-101"

        # Attempt 1: succeeds on server
        res_first = self.client.post('/api/reservations', headers={'X-RSVP-Token': token, 'Idempotency-Key': idemp_key}, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["D1"]
        })
        self.assertEqual(res_first.status_code, 201)
        booking_code = res_first.get_json()['booking_code']

        # Attempt 2: Client timed out, repeats identical request with same key
        res_retry = self.client.post('/api/reservations', headers={'X-RSVP-Token': token, 'Idempotency-Key': idemp_key}, json={
            "rsvp_id": rsvp_id,
            "seat_ids": ["D1"]
        })
        self.assertEqual(res_retry.status_code, 200)
        self.assertEqual(res_retry.get_json()['booking_code'], booking_code)

        # Verify only 1 row exists in bookings for D1
        with self.app.app_context():
            conn = database.get_db()
            cur = conn.cursor()
            cur.execute("SELECT count(*) as count FROM bookings WHERE rsvp_id = ? AND status = 'CONFIRMED'", (rsvp_id,))
            self.assertEqual(cur.fetchone()['count'], 1)

    # ====================================================================
    # SCENARIO 8: REBOOKING ATOMIC ROLLBACK ON CONFLICT
    # ====================================================================

    def test_e2e_08_rebooking_atomic_rollback_on_conflict(self):
        """Scenario 8: Rebooking with one conflicting seat rolls back and restores initial booking."""
        routes.api.clear_rate_limits()
        # Guest A books B1
        res_a = self.client.post('/api/rsvp', json={"guest_name": "Guest A", "attending": 1, "guest_count": 1, "group_category": "Keluarga"})
        r_a, tok_a = res_a.get_json()['rsvp_id'], res_a.get_json()['rsvp_token']
        self.client.post('/api/reservations', headers={'X-RSVP-Token': tok_a}, json={"rsvp_id": r_a, "seat_ids": ["B1"]})

        # Guest B books B2
        res_b = self.client.post('/api/rsvp', json={"guest_name": "Guest B", "attending": 1, "guest_count": 1, "group_category": "Keluarga"})
        r_b, tok_b = res_b.get_json()['rsvp_id'], res_b.get_json()['rsvp_token']
        res_b_init = self.client.post('/api/reservations', headers={'X-RSVP-Token': tok_b}, json={"rsvp_id": r_b, "seat_ids": ["B2"]})
        b_code = res_b_init.get_json()['booking_code']

        # Guest B tries to change seat to B1 (already taken by Guest A)
        res_b_fail = self.client.post('/api/reservations', headers={'X-RSVP-Token': tok_b}, json={"rsvp_id": r_b, "seat_ids": ["B1"]})
        self.assertEqual(res_b_fail.status_code, 409)

        # Guest B's original booking on B2 must be intact
        with self.app.app_context():
            conn = database.get_db()
            cur = conn.cursor()
            cur.execute("""
                SELECT b.booking_code, rs.seat_id 
                FROM bookings b JOIN reserved_seats rs ON b.id = rs.booking_id
                WHERE b.rsvp_id = ? AND b.status = 'CONFIRMED'
            """, (r_b,))
            row = cur.fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row['booking_code'], b_code)
            self.assertEqual(row['seat_id'], 'B2')

    # ====================================================================
    # SCENARIO 9: RSVP TRANSITION TO NOT ATTENDING FREES SEATS
    # ====================================================================

    def test_e2e_09_not_attending_transition_frees_seats(self):
        """Scenario 9: Switching RSVP to attending=0 atomically cancels active reservation."""
        routes.api.clear_rate_limits()
        res_r = self.client.post('/api/rsvp', json={"guest_name": "Cancelling User", "attending": 1, "guest_count": 1, "group_category": "Teman"})
        rsvp_id, token = res_r.get_json()['rsvp_id'], res_r.get_json()['rsvp_token']
        self.client.post('/api/reservations', headers={'X-RSVP-Token': token}, json={"rsvp_id": rsvp_id, "seat_ids": ["C2"]})

        # Seat C2 is reserved
        res_s1 = self.client.get('/api/seats')
        self.assertTrue({s['id']: s for s in res_s1.get_json()['seats']}['C2']['is_reserved'])

        # Update attending to 0
        res_cancel = self.client.put(f'/api/rsvp/{rsvp_id}', headers={'X-RSVP-Token': token}, json={"attending": 0, "guest_count": 0})
        self.assertEqual(res_cancel.status_code, 200)

        # Seat C2 is freed
        res_s2 = self.client.get('/api/seats')
        self.assertTrue({s['id']: s for s in res_s2.get_json()['seats']}['C2']['is_available'])

    # ====================================================================
    # SCENARIO 10: WISHES SUBMISSION & SAFE RENDERING
    # ====================================================================

    def test_e2e_10_wishes_submission_and_pagination(self):
        """Scenario 10: Submit wishes, retrieve list, verify plain text safety and pagination."""
        routes.api.clear_rate_limits()
        xss_wish = '<script>alert("hack")</script> Happy wedding!'
        res_wish = self.client.post('/api/wishes', json={
            "sender_name": "Sahabat Karib",
            "message": xss_wish
        })
        self.assertEqual(res_wish.status_code, 201)
        data = res_wish.get_json()
        self.assertEqual(data['wish']['name'], "Sahabat Karib")
        self.assertEqual(data['wish']['message'], xss_wish)

        # Fetch wishes list
        res_list = self.client.get('/api/wishes?page=1&limit=5')
        self.assertEqual(res_list.status_code, 200)
        wishes = res_list.get_json()['wishes']
        self.assertTrue(len(wishes) >= 1)
        self.assertEqual(wishes[0]['message'], xss_wish)

if __name__ == '__main__':
    unittest.main()
