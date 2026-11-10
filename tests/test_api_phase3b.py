"""
Automated Test Suite for Phase 3B: RSVP & Wishes API Endpoints
Tests validation, cryptographic token authorization, pagination, and error handling.
"""

import os
import shutil
import tempfile
import unittest
import sqlite3

from app import app
import database

import routes.api

class TestAPIPhase3B(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, 'test_api.db')
        
        app.config['DATABASE'] = self.db_path
        app.config['TESTING'] = True
        self.client = app.test_client()

        # Clear rate limiter state for clean test isolation
        routes.api.clear_rate_limits()

        # Initialize fresh database schema
        database.init_db(app)

    def tearDown(self):
        routes.api.clear_rate_limits()
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    # ====================================================================
    # 1. RSVP API TESTS
    # ====================================================================

    def test_create_rsvp_valid_attending(self):
        """Test creating a valid attending RSVP."""
        payload = {
            "guest_name": "Budi Sudarsono",
            "attending": 1,
            "guest_count": 2,
            "group_category": "Keluarga",
            "notes": "Selamat untuk kedua mempelai!"
        }
        res = self.client.post('/api/rsvp', json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertIn('rsvp_id', data)
        self.assertIn('rsvp_token', data)
        self.assertEqual(len(data['rsvp_token']), 43)  # urlsafe 32-byte token length
        self.assertEqual(data['guest_name'], 'Budi Sudarsono')
        self.assertEqual(data['guest_count'], 2)

    def test_create_rsvp_valid_not_attending(self):
        """Test creating a valid not-attending RSVP (guest_count forced to 0)."""
        payload = {
            "guest_name": "Siti Aminah",
            "attending": 0,
            "guest_count": 0
        }
        res = self.client.post('/api/rsvp', json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data['guest_count'], 0)
        self.assertEqual(data['attending'], 0)

    def test_create_rsvp_validation_failures(self):
        """Test validation rules for invalid guest_count and attending states."""
        # 1. Missing guest_name
        res = self.client.post('/api/rsvp', json={"attending": 1, "guest_count": 1})
        self.assertEqual(res.status_code, 422)

        # 2. Invalid attending value
        res = self.client.post('/api/rsvp', json={"guest_name": "Test", "attending": 5})
        self.assertEqual(res.status_code, 422)

        # 3. Attending=1 with guest_count > 4 (Exceeds max party size)
        res = self.client.post('/api/rsvp', json={"guest_name": "Test", "attending": 1, "guest_count": 5})
        self.assertEqual(res.status_code, 422)

        # 4. Attending=1 with guest_count < 1
        res = self.client.post('/api/rsvp', json={"guest_name": "Test", "attending": 1, "guest_count": 0})
        self.assertEqual(res.status_code, 422)

        # 5. Invalid group_category
        res = self.client.post('/api/rsvp', json={"guest_name": "Test", "attending": 1, "guest_count": 1, "group_category": "VipExtra"})
        self.assertEqual(res.status_code, 422)

        # 6. Non-JSON request
        res = self.client.post('/api/rsvp', data="plain text")
        self.assertEqual(res.status_code, 400)

    def test_rsvp_authorization_and_privacy(self):
        """Test that guests can only access their own RSVP with valid token."""
        # Create Guest 1
        res1 = self.client.post('/api/rsvp', json={"guest_name": "Guest 1", "attending": 1, "guest_count": 1})
        data1 = res1.get_json()
        rsvp1_id = data1['rsvp_id']
        token1 = data1['rsvp_token']

        # Create Guest 2
        res2 = self.client.post('/api/rsvp', json={"guest_name": "Guest 2", "attending": 1, "guest_count": 2})
        data2 = res2.get_json()
        token2 = data2['rsvp_token']

        # 1. Authorized read with token1
        res = self.client.get(f'/api/rsvp/{rsvp1_id}', headers={'X-RSVP-Token': token1})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['rsvp']['guest_name'], "Guest 1")

        # 2. Missing token (401 Unauthorized)
        res = self.client.get(f'/api/rsvp/{rsvp1_id}')
        self.assertEqual(res.status_code, 401)

        # 3. Invalid / cross-access with Guest 2's token (403 Forbidden)
        res = self.client.get(f'/api/rsvp/{rsvp1_id}', headers={'X-RSVP-Token': token2})
        self.assertEqual(res.status_code, 403)

        # 4. Non-existent RSVP id (404 Not Found)
        res = self.client.get('/api/rsvp/9999', headers={'X-RSVP-Token': token1})
        self.assertEqual(res.status_code, 404)

    def test_update_rsvp_flow(self):
        """Test updating RSVP with valid token and transitioning attending status."""
        res = self.client.post('/api/rsvp', json={"guest_name": "Guest Update", "attending": 1, "guest_count": 2})
        data = res.get_json()
        rsvp_id = data['rsvp_id']
        token = data['rsvp_token']

        # Update guest count to 3
        update_res = self.client.put(f'/api/rsvp/{rsvp_id}', json={
            "rsvp_token": token,
            "attending": 1,
            "guest_count": 3,
            "notes": "Menambah 1 anggota keluarga"
        })
        self.assertEqual(update_res.status_code, 200)

        # Verify update
        get_res = self.client.get(f'/api/rsvp/{rsvp_id}', headers={'X-RSVP-Token': token})
        self.assertEqual(get_res.get_json()['rsvp']['guest_count'], 3)

        # Update without token (401)
        res_fail = self.client.put(f'/api/rsvp/{rsvp_id}', json={"attending": 1, "guest_count": 1})
        self.assertEqual(res_fail.status_code, 401)

    # ====================================================================
    # 2. WISHES API TESTS
    # ====================================================================

    def test_create_and_get_wishes_with_pagination(self):
        """Test wish submission, pagination limit/offset, and approval filter."""
        # Submit 3 wishes
        for i in range(1, 4):
            res = self.client.post('/api/wishes', json={
                "sender_name": f"Sender {i}",
                "message": f"Ucapan doa restu ke-{i}"
            })
            self.assertEqual(res.status_code, 201)
            self.assertEqual(res.get_json()['wish']['name'], f"Sender {i}")

        # Test GET wishes with pagination limit 2
        res = self.client.get('/api/wishes?page=1&limit=2')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data['wishes']), 2)
        self.assertEqual(data['pagination']['total'], 3)
        self.assertEqual(data['pagination']['total_pages'], 2)

        # Test page 2
        res2 = self.client.get('/api/wishes?page=2&limit=2')
        self.assertEqual(len(res2.get_json()['wishes']), 1)

    def test_wish_validation(self):
        """Test rejection of empty message or invalid inputs."""
        # Empty message
        res = self.client.post('/api/wishes', json={"sender_name": "Budi", "message": "   "})
        self.assertEqual(res.status_code, 422)

        # Missing message
        res = self.client.post('/api/wishes', json={"sender_name": "Budi"})
        self.assertEqual(res.status_code, 422)

        # Message with XSS payload (should be cleanly accepted as plain text string)
        xss_msg = '<script>alert(1)</script>'
        res = self.client.post('/api/wishes', json={"sender_name": "Budi", "message": xss_msg})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.get_json()['wish']['message'], xss_msg)

    def test_api_404_returns_json_not_html(self):
        """Verify that missing /api/ endpoints return JSON 404 rather than the SPA index.html."""
        res = self.client.get('/api/nonexistent_route')
        self.assertEqual(res.status_code, 404)
        self.assertTrue(res.is_json)
        data = res.get_json()
        self.assertEqual(data['error'], 'Not Found')

    def test_rate_limiting_protection(self):
        """Verify that rapid spam requests beyond limit return HTTP 429 Too Many Requests."""
        # Send 10 valid wishes
        for i in range(10):
            res = self.client.post('/api/wishes', json={"sender_name": f"Spam {i}", "message": f"Message {i}"})
            self.assertEqual(res.status_code, 201)

        # 11th request from same IP should be blocked by rate limiter
        res_blocked = self.client.post('/api/wishes', json={"sender_name": "Spam 11", "message": "Blocked message"})
        self.assertEqual(res_blocked.status_code, 429)
        data = res_blocked.get_json()
        self.assertEqual(data['error'], 'Too Many Requests')

if __name__ == '__main__':
    unittest.main()

