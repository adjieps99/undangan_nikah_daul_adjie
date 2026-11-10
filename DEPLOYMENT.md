# NevaCloud & Production Deployment Runbook — The Wedding Adventure (v2.1.0)

Dokumen ini merupakan panduan operasional resmi untuk deployment aplikasi **The Wedding Adventure: 3D Hachi Garden** (`undangan_antigravity`) berbasis Python Flask, Gunicorn, dan SQLite WAL ke lingkungan hosting (NevaCloud / Linux Server).

---

## 1. Arsitektur Runtime & Kebutuhan Sistem

- **Bahasa / Runtime**: Python 3.9+ (disarankan Python 3.11 atau 3.12)
- **WSGI Application Server**: Gunicorn 21.2+
- **Backend Framework**: Flask 3.0+
- **Database Engine**: SQLite 3.35+ (menggunakan WAL mode, PRAGMA foreign_keys = ON, busy_timeout = 5000ms)
- **Frontend Architecture**: Vanilla ES6 + Three.js v0.160 WebGL (Loaded over HTTPS CDN)
- **Target OS**: Linux (Ubuntu 22.04 LTS / Debian 12 / NevaCloud App Engine Container)

---

## 2. Variabel Lingkungan (.env)

Konfigurasikan variabel lingkungan berikut pada Dashboard NevaCloud (App Settings / Environment Variables):

| Nama Variabel | Nilai Contoh | Status | Penjelasan & Dampak Keamanan |
| :--- | :--- | :---: | :--- |
| `FLASK_ENV` | `production` | Wajib | Mematikan debug mode dan mengaktifkan proteksi production |
| `SECRET_KEY` | `[64-karakter-hex]` | Wajib | Kunci rahasia Flask signing (`python -c "import secrets; print(secrets.token_hex(32))"`) |
| `PORT` | `5000` | Wajib | Port dinamis yang dibuka oleh reverse proxy NevaCloud |
| `DATABASE_PATH` | `/data/wedding.db` | **Kritis** | **Path file SQLite di Persistent Volume Mount**. Jangan gunakan path ephemeral! |
| `REDIS_URL` | `redis://...` | Opsional | Koneksi Redis untuk rate limiter terpusat jika menggunakan multi-worker |

---

## 3. Persistent Storage NevaCloud (Aturan P0)

> [!CAUTION]
> **PERINGATAN PERSISTENSI DATABASE**:
> Container rootfs di cloud bersifat **ephemeral**. Jika container di-restart, redeploy, atau crash tanpa persistent volume, seluruh file `.db`, data RSVP, ucapan, dan reservasi tamu akan **musnah**.

### Kriteria Kelulusan Persistent Volume
1. Buat **Persistent Volume** di NevaCloud Storage Console (minimal 1 GB sudah sangat cukup untuk ribuan tamu).
2. Mount volume tersebut ke dalam container pada mount path `/data` atau `/app/instance`.
3. Set environment variable:
   ```bash
   DATABASE_PATH=/data/wedding.db
   ```
4. Pastikan user container memiliki izin baca & tulis (`chmod 755 /data` dan `chown` yang sesuai).
5. Filesystem volume wajib mendukung POSIX file-locking (kompatibel dengan SQLite WAL mode: `wedding.db`, `wedding.db-wal`, `wedding.db-shm`).

### Uji Verifikasi Persistensi oleh Project Owner (Bro Adjie)
Sebelum menyebarkan undangan ke tamu:
1. Jalankan aplikasi di NevaCloud.
2. Buat 1 data uji RSVP dan pilih 1 kursi via UI atau curl.
3. Lakukan **Restart / Rebuild Container** secara manual dari NevaCloud dashboard.
4. Akses kembali aplikasi: Jika data RSVP dan status kursi **tetap ada**, maka persistent storage **LULUS VERIFIKASI**.

---

## 4. Perintah Build & Start Command

### A. Install Command (Build Step)
```bash
pip install --upgrade pip && pip install -r requirements.txt
```

### B. Production Start Command (Gunicorn)
```bash
gunicorn --workers 2 --threads 4 --timeout 60 --bind 0.0.0.0:$PORT app:app
```

> **Catatan Worker**:
> Alokasi 2 worker dan 4 thread adalah konfigurasi optimal untuk efisiensi CPU & memori di NevaCloud. Karena rendering 3D Three.js dijalankan 100% di browser pengunjung (client-side WebGL), server Flask hanya melayani REST API ringan dan file statis.

---

## 5. Strategi Rate Limiting Lintas-Worker

Dengan 2 worker Gunicorn, rate limiter in-memory proses (`_rate_limit_records`) memiliki kuota terpisah pada masing-masing worker:
- **Toleransi**: Batas 10 req/menit per worker dapat memungkinkan hingga 20 req/menit jika request terdistribusi bergantian ke kedua worker.
- **Rekomendasi Produksi**:
  1. **Layer Terdepan (Disarankan)**: Aktifkan Rate Limiting pada Cloudflare WAF / Nginx Reverse Proxy (10 request/menit untuk path `/api/rsvp`, `/api/wishes`, dan `/api/reservations`). Ini memblokir spam sebelum membebani worker Gunicorn.
  2. **Layer Aplikasi (Opsional)**: Pasang instance Redis kecil (`REDIS_URL`) jika ingin pembatasan tepat pada level aplikasi tanpa reverse proxy.

---

## 6. Prosedur Backup & Restore Database (Runbook)

### A. Prosedur Hot Backup (Online Backup API)
Prosedur ini menggunakan SQLite Online Backup API yang tidak memblokir pembaca (*non-blocking*):

```bash
# Jalankan perintah Python one-liner untuk hot backup:
python -c "import database, app; database.backup_database('backups/wedding_backup_$(date +%Y%m%d_%H%M%S).db', app.app); print('Backup completed successfully.')"
```

### B. Prosedur Restore Database (Recovery Runbook)
Jika terjadi kegagalan data atau kebutuhan rollback:
1. Hentikan atau pause service Gunicorn untuk mencegah write race condition:
   ```bash
   # Hentikan proses Gunicorn
   kill -TERM $(pgrep gunicorn)
   ```
2. Salin file backup ke target database aktif:
   ```bash
   cp backups/wedding_backup_[TIMESTAMP].db /data/wedding.db
   ```
3. Hapus file temporary WAL dan SHM lama jika ada:
   ```bash
   rm -f /data/wedding.db-wal /data/wedding.db-shm
   ```
4. Nyalakan kembali Gunicorn:
   ```bash
   gunicorn --workers 2 --threads 4 --timeout 60 --bind 0.0.0.0:$PORT app:app
   ```
5. Verifikasi integritas data:
   ```bash
   python -c "import database, app; conn = database.get_db_connection(app.app); print('Integrity check:', conn.execute('PRAGMA integrity_check;').fetchone()[0])"
   ```

---

## 7. Rencana Rollback Jika Rilis Bermasalah

Jika rilis versi baru mengalami error atau regresi di production:
1. **Rollback Source Code**:
   Checkout commit/tag stabil sebelumnya (`v2.0.2`):
   ```bash
   git checkout tags/v2.0.2
   ```
2. **Rollback Database**:
   Kembalikan file database dari backup yang diambil tepat sebelum deployment menggunakan Prosedur Restore di atas.
3. **Restart Service**:
   Restart container / service Gunicorn.
4. **Verifikasi Health**:
   Panggil endpoint health check:
   ```bash
   curl -I https://[DOMAIN_UNDANGAN]/health
   ```
   Pastikan HTTP status mengembalikan `200 OK`.
