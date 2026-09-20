# NevaCloud Production Deployment Guide - Hachi Garden 3D v2.0.0

This guide documents the step-by-step procedure for deploying the **Hachi Garden 3D Interactive Wedding Venue** (`v2.0.0`) to NevaCloud.

---

## 1. System Requirements & Tech Stack

- **Runtime**: Python 3.9+
- **WSGI Application Server**: Gunicorn 21.2+
- **Framework**: Flask 3.0+
- **Frontend Architecture**: Vanilla ES6 + Three.js v0.160 WebGL (Loaded over HTTPS CDN)
- **Target OS**: Linux (Ubuntu 22.04 LTS / Debian 11 / NevaCloud App Service)

---

## 2. Environment Variables (.env)

Configure the following environment variables in NevaCloud Dashboard (App Settings / Environment Variables):

| Variable Name | Recommended Value | Purpose |
| :--- | :--- | :--- |
| `FLASK_ENV` | `production` | Disables debug mode and enables production routing |
| `SECRET_KEY` | `[generate-random-secret-key]` | Used for session signing and Flask security |
| `PORT` | `5000` | Port assigned dynamically by NevaCloud container |

You can generate a strong secret key using Python:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 3. Build & Deployment Commands

### A. Install Command (Build Step)
```bash
pip install --upgrade pip && pip install -r requirements.txt
```

### B. Production Start Command
```bash
gunicorn --workers 2 --threads 4 --bind 0.0.0.0:$PORT app:app
```
> **Note for Mobile WebGL Efficiency**: Do NOT allocate excessive Gunicorn workers. Since WebGL rendering is executed 100% client-side in the visitor's browser, Flask only handles static file serving and light JSON endpoints. 2 workers + 4 threads provide optimal CPU & RAM efficiency on NevaCloud.

---

## 4. Health Check Endpoint

NevaCloud load balancers can monitor container health via:

- **Endpoint**: `GET /health`
- **Expected Status**: `200 OK`
- **Response Format**:
```json
{
  "status": "ok",
  "app": "Hachi Garden 3D Wedding Venue",
  "version": "2.0.0",
  "environment": "production"
}
```

---

## 5. HTTPS & WhatsApp Shareable Domain Setup

1. **Enforce HTTPS**:
   - Mobile browsers (iOS Safari, Chrome, WhatsApp in-app browser) require HTTPS for WebGL canvas context, device pixel ratio scaling, and touch API support.
   - Ensure SSL/TLS is enabled in NevaCloud or Cloudflare proxy.

2. **Custom Domain Setup**:
   - Point your CNAME record (e.g., `invite.adjie-daul.com`) to your NevaCloud app URL.

3. **WhatsApp Link Personalization**:
   - Share personalized links with guests via WhatsApp:
   ```text
   https://invite.adjie-daul.com/?to=Budi+Sudarsono
   ```

---

## 6. Git Release & Branch Merge Checklist

### Pre-Deployment Checklist
- [x] WebGL scene operates at < 40 draw calls and < 25,000 total triangles.
- [x] All 5 custom 3D landmarks (Gazebo, RSVP Desk, Wishes Tree, Location Signboard, Gift Fountain) verified.
- [x] Thumb-friendly mobile D-Pad (56px) and Jump button (54px) verified.
- [x] Health check endpoint `/health` returns 200 OK.
- [x] Three.js importmap URLs use secure HTTPS CDN (`https://unpkg.com/three@0.160.0/...`).

### Release Commands
To merge feature branch into `main` and tag version `v2.0.0`:

```bash
# 1. Switch to main and pull latest
git checkout main
git pull origin main

# 2. Merge feature branch cleanly
git merge feature/hachi-garden-3d --no-ff -m "release: v2.0.0 Hachi Garden 3D Wedding Venue"

# 3. Tag release version
git tag -a v2.0.0 -m "Hachi Garden 2.0 3D Mobile-First Release"

# 4. Push release to GitHub
git push origin main --tags
```

---

## 7. Troubleshooting Guide

- **Issue: WebGL canvas appears blank on mobile**
  - *Cause*: Mixed content blocking HTTP resources on an HTTPS site.
  - *Fix*: Ensure all CDN fonts and Three.js imports use `https://`.
- **Issue: Gunicorn fails to bind to port**
  - *Fix*: Verify start command uses `--bind 0.0.0.0:$PORT` instead of hardcoded `127.0.0.1`.
- **Issue: RSVP or Wishes data reset**
  - *Fix*: Ensure `static/data/` directory has write permissions if using local JSON file persistence.
