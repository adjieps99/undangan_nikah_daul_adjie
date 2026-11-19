# Production Deployment Guide — Adjie & Daulika

This application runs directly via Node.js 22+ (`"start": "node server.ts"`) with Express and a zero-dependency JSON persistence store (`./data/wedding_store.json`), so Cloud Run containers bind `$PORT` (`8080`) immediately without native module or compilation failures.

---

## 1. Simple Personalized Invitation Links

- Any guest can receive a personalized invitation link simply by passing `?to=Nama%20Tamu`:
  - Example: `https://your-domain.com/?to=Fawwaz%20Nabiel`
- All 153 guests from `server/seed/list_undangan.txt` are loaded automatically at startup and available in `/admin` with one-click **Copy Link**, **WhatsApp**, **Preview**, **Edit**, and **Export CSV**, plus a **Quick Link Generator** for any ad-hoc name.
- Every RSVP enforces the strict 1-person invitation policy (`Undangan ini berlaku untuk 1 orang.`).
- Guest Wishes submitted in the Main Hall default to `PENDING` moderation; public endpoints (`GET /api/wishes`) strictly return only `visibility = 'PUBLIC'` and `moderation_status = 'APPROVED'`.

---

## 2. Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3000` (Cloud Run sets `8080`) | HTTP listen port on `0.0.0.0` |
| `ADMIN_ACCESS_KEY` | `adjie-daulika-2026` | Passcode to sign in at `/admin` |
| `ADMIN_SESSION_SECRET` | Derived from `ADMIN_ACCESS_KEY` | HMAC-SHA256 signing key for Bearer admin tokens |
| `PUBLIC_BASE_URL` | Auto-detected from request host | Canonical base URL for generated `/?to=...` links |
| `STORE_PATH` | `./data/wedding_store.json` | JSON file path for RSVPs, wishes, and guest name edits |

---

## 3. Build & Run Commands

```bash
npm install
npm test
npm run lint
npm run build
PORT=8080 npm start
```

> Note: On default Cloud Run containers without a mounted volume, `./data/wedding_store.json` is stored on ephemeral container disk. Mount a persistent volume and set `STORE_PATH=/data/wedding_store.json` if long-term persistence across container cold restarts is needed.
