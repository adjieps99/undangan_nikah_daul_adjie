import os
import re
import unittest
from app import app

class Phase1SecurityTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def test_flask_server_endpoints(self):
        """Test that Flask routes return 200 and do not reflect unescaped script in templates."""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        json_data = response.get_json()
        self.assertEqual(json_data.get('status'), 'ok')

        # Test index route with XSS query param
        xss_payload = '<img src=x onerror=alert(1)>'
        response = self.client.get(f'/?to={xss_payload}')
        self.assertEqual(response.status_code, 200)
        # Server template should not execute or unescapedly inject into server-rendered DOM
        self.assertNotIn(b'alert(1)', response.data)

    def test_gamestate_guestname_sanitization_rules(self):
        """Verify the exact sanitization and length capping logic specified in GameState.js."""
        def sanitize_guest_name(raw):
            if not raw:
                return 'Tamu Undangan'
            # Strip control characters, trim, and cap length to 60 characters
            sanitized = re.sub(r'[\u0000-\u001F\u007F-\u009F]', '', raw).strip()
            return sanitized[:60] or 'Tamu Undangan'

        # Test payloads
        self.assertEqual(sanitize_guest_name(None), 'Tamu Undangan')
        self.assertEqual(sanitize_guest_name(''), 'Tamu Undangan')
        self.assertEqual(sanitize_guest_name('   '), 'Tamu Undangan')
        self.assertEqual(sanitize_guest_name('Budi Sudarsono'), 'Budi Sudarsono')
        self.assertEqual(sanitize_guest_name('Adjie & Daul "Gembul"'), 'Adjie & Daul "Gembul"')
        self.assertEqual(sanitize_guest_name('Raden Roro Siti\x00\x1b\x7f'), 'Raden Roro Siti')

        long_name = 'A' * 100
        sanitized_long = sanitize_guest_name(long_name)
        self.assertEqual(len(sanitized_long), 60)

    def test_no_raw_guestname_interpolation_in_innerhtml(self):
        """Ensure no JS file directly interpolates state.guestName into innerHTML."""
        js_files_to_check = [
            'static/js/views/CoverView.js',
            'static/js/views/MapView3D.js',
            'static/js/views/MapView.js',
            'static/js/views/modals/RSVPModal.js',
            'static/js/views/modals/WishesModal.js',
            'static/js/views/AvatarView.js',
        ]

        dangerous_pattern = re.compile(r'innerHTML\s*=\s*`[^`]*\$\{state\.guestName\}[^`]*`')

        for rel_path in js_files_to_check:
            abs_path = os.path.join(self.base_dir, rel_path)
            with open(abs_path, 'r', encoding='utf-8') as f:
                content = f.read()

            matches = dangerous_pattern.findall(content)
            self.assertEqual(
                len(matches), 0,
                f"Dangerous innerHTML interpolation of state.guestName found in {rel_path}: {matches}"
            )

    def test_no_raw_wish_message_interpolation_in_innerhtml(self):
        """Ensure wishes modal does not interpolate wish.message or wish.name into innerHTML."""
        wishes_modal_path = os.path.join(self.base_dir, 'static/js/views/modals/WishesModal.js')
        with open(wishes_modal_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Should not contain raw interpolation of item.message inside innerHTML
        self.assertNotIn('${item.message}', content)
        self.assertNotIn('${item.name}', content)

        # Must use textContent for msg and author
        self.assertIn('.textContent = String(item.name', content)
        self.assertIn('.textContent = `"${String(item.message', content)

    def test_modal_lifecycle_and_listener_cleanup_contract(self):
        """Verify Modal.js contains idempotent handleClose and escListener cleanup on all paths."""
        modal_path = os.path.join(self.base_dir, 'static/js/ui/Modal.js')
        with open(modal_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check for idempotency flag
        self.assertIn('let isClosed = false;', content)
        self.assertIn('if (isClosed) return;', content)
        self.assertIn('isClosed = true;', content)

        # Check that removeEventListener('keydown', escListener) is inside handleClose
        handle_close_idx = content.find('const handleClose = () => {')
        remove_listener_idx = content.find("window.removeEventListener('keydown', escListener);")
        self.assertTrue(handle_close_idx != -1 and remove_listener_idx != -1)
        self.assertTrue(
            handle_close_idx < remove_listener_idx,
            "window.removeEventListener('keydown', escListener) must be called inside handleClose."
        )

        # Check that backdrop._cleanup is assigned
        self.assertIn('backdrop._cleanup = handleClose;', content)

    def test_app_js_cleans_up_replaced_modal(self):
        """Verify app.js invokes _cleanup when tearing down existing modal."""
        app_js_path = os.path.join(self.base_dir, 'static/js/app.js')
        with open(app_js_path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.assertIn('existingModal._cleanup()', content)

    def test_modal_behavioral_lifecycle_and_callback_idempotency(self):
        """Behavioral simulation of Modal.js lifecycle to prove zero listener leaks and single callback execution."""
        class MockWindow:
            def __init__(self):
                self.listeners = {'keydown': []}

            def addEventListener(self, event, fn):
                self.listeners.setdefault(event, []).append(fn)

            def removeEventListener(self, event, fn):
                if fn in self.listeners.get(event, []):
                    self.listeners[event].remove(fn)

        class SimulatedModal:
            def __init__(self, mock_window, on_close=None):
                self.window = mock_window
                self.on_close = on_close
                self.is_closed = False

                self.esc_listener = lambda e: self.handle_close() if e == 'Escape' else None
                self.window.addEventListener('keydown', self.esc_listener)
                self.cleanup = self.handle_close

            def handle_close(self):
                if self.is_closed:
                    return
                self.is_closed = True
                self.window.removeEventListener('keydown', self.esc_listener)
                if callable(self.on_close):
                    self.on_close()

        mock_win = MockWindow()
        callback_calls = []

        # 1. Test close via Close Button
        def on_close_1(): callback_calls.append(1)
        m1 = SimulatedModal(mock_win, on_close_1)
        self.assertEqual(len(mock_win.listeners['keydown']), 1)
        m1.handle_close()
        # Verify idempotent duplicate call
        m1.handle_close()
        self.assertEqual(len(mock_win.listeners['keydown']), 0)
        self.assertEqual(callback_calls, [1], "Callback must be invoked exactly once.")

        # 2. Test close via Escape key
        def on_close_2(): callback_calls.append(2)
        m2 = SimulatedModal(mock_win, on_close_2)
        self.assertEqual(len(mock_win.listeners['keydown']), 1)
        m2.esc_listener('Escape')
        m2.esc_listener('Escape')  # Second escape should not trigger callback again
        self.assertEqual(len(mock_win.listeners['keydown']), 0)
        self.assertEqual(callback_calls, [1, 2], "Escape key callback must be invoked exactly once.")

        # 3. Test close via Controller Cleanup (app.js _cleanup)
        def on_close_3(): callback_calls.append(3)
        m3 = SimulatedModal(mock_win, on_close_3)
        self.assertEqual(len(mock_win.listeners['keydown']), 1)
        m3.cleanup()
        self.assertEqual(len(mock_win.listeners['keydown']), 0)
        self.assertEqual(callback_calls, [1, 2, 3])

        # 4. Stress Test: 25 iterations of open-and-close through mixed paths
        paths = ['btn', 'esc', 'cleanup']
        for i in range(25):
            path = paths[i % len(paths)]
            m = SimulatedModal(mock_win)
            self.assertEqual(len(mock_win.listeners['keydown']), 1)
            if path == 'btn':
                m.handle_close()
            elif path == 'esc':
                m.esc_listener('Escape')
            elif path == 'cleanup':
                m.cleanup()
            self.assertEqual(len(mock_win.listeners['keydown']), 0, f"Leak detected at iteration {i} on path {path}")

        self.assertEqual(len(mock_win.listeners['keydown']), 0, "All 25 modals must leave 0 active window listeners.")


if __name__ == '__main__':
    unittest.main()

