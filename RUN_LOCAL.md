# Run Adjie & Daulika Wedding App Locally

This application is a Node.js 22+ (Express + TypeScript + Vanilla ES6 / Three.js) project with zero native database dependencies, ready for local development and Cloud Run (`PORT=8080`).

## 1. Prerequisites

- **Node.js v22+** (supports running `node server.ts` directly)
- **npm**

## 2. Environment Configuration

Copy `.env.example` to `.env` if you want to override defaults:

```bash
cp .env.example .env
```

Key environment variables (all optional with safe defaults):
- `PORT` (default `3000`, Cloud Run sets `8080`)
- `STORE_PATH` (default `./data/wedding_store.json`, falls back gracefully to in-memory if disk is read-only)
- `ADMIN_ACCESS_KEY` (default `adjie-daulika-2026`)
- `ADMIN_SESSION_SECRET` (optional HMAC signing key for `/admin` Bearer tokens)
- `PUBLIC_BASE_URL` (optional canonical base URL for generated `/?to=...` links)

## 3. Install & Start

```bash
npm install
npm run dev
```

Or run the production entry point directly:

```bash
PORT=8080 npm start
```

## 4. Key URLs

- Main invitation cover: `http://localhost:3000/`
- Personalized guest invitation: `http://localhost:3000/?to=Nama%20Tamu`
- Admin Link Generator, 153-Guest List & Wishes Moderation: `http://localhost:3000/admin`
- Direct Main Hall inspection: `http://localhost:3000/?phase=hall&debug=1`

## 5. Verification Commands

```bash
npm test
npm run lint
npm run build
```
