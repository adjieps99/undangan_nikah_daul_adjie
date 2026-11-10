# DOKUMEN HANDOFF PHASE 11: VISUAL QUALITY, ENVIRONMENT GROUNDING, PATHWAY CONNECTIVITY, LANDMARK SPACING, & GUEST JOURNEY

**The Wedding Adventure — 3D Hachi Garden Wedding Invitation**  
*Mempelai:* Adjie & Daul (Adjie Pangestu & Daulika Putri)  
*Tanggal Acara:* Sabtu, 28 November 2026  
*Status Audit:* Verified Baseline & Gap Analysis Complete (Non-Destructive)  
*Branch Aktif:* `main` (dengan working tree dirty dari fase refactor 8-10)  
*Engine:* Python 3.11 / Flask 3.0+ (Backend) + SQLite 3 WAL + Vanilla JS ES Modules + Three.js v0.160.0  

---

## 1. PROJECT OVERVIEW & ARCHITECTURE SNAPSHOT

### 1.1 Identitas & Konsep Produk
Undangan pernikahan gamified 3D WebGL interaktif di mana tamu dapat memasukkan nama melalui parameter URL (`?to=Nama+Tamu`), mengustomisasi avatar 3D, menjelajahi lingkungan perkebunan teh berundak (terasering) "THE HACHI Garden", mengunjungi landmark, mendengarkan musik, melihat galeri kenangan, melakukan reservasi tempat duduk/RSVP, dan masuk ke resepsi pernikahan di Main Reception Hall.

### 1.2 Eksekusi Alur Aktual (Verified Call Graph)
```
[User Browser]
       │
       ▼
Flask Backend (app.py) ──> templates/index.html (Three.js v0.160.0 via Importmap)
                                   │
                                   ▼
                            static/js/app.js
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
            GameState.js (Central State)     View Routing
            - URL parser (?to, ?phase, ?view)   ├─ CoverView.js (PHASES.COVER)
            - LocalStorage (RSVP/Token)         ├─ AvatarView.js (PHASES.AVATAR_CREATOR)
            - Observer Pattern                  ├─ MapView3D.js (PHASES.EXPLORATION)
                                                │    ├─ ThreeScene.js
                                                │    ├─ CameraController.js
                                                │    ├─ CharacterController.js
                                                │    ├─ TerrainManager.js (Elevation/Physics)
                                                │    ├─ HachiGarden3D.js (6 Landmarks + 480 Tea Bushes)
                                                │    └─ InteractionSystem.js (POIs)
                                                ├─ MainHallView.js (PHASES.MAIN_HALL)
                                                │    ├─ Pelaminan Stage (Adjie & Daul)
                                                │    ├─ Banqueting Tables & Chiavari Chairs
                                                │    └─ Seated Guest NPCs & Interactive Player
                                                └─ ModalsView.js (Active Modal Overlay)
```

### 1.3 Backend & Database Persistence
- **Endpoints (`routes/api.py`):**
  - `POST /api/rsvp` (Membuat RSVP baru, token kriptografis `secrets.token_urlsafe(32)`)
  - `GET /api/rsvp/<id>`, `PUT /api/rsvp/<id>` (Update status kehadiran & pelepasan kursi)
  - `GET /api/seats` (Daftar kursi A1–D2, status ketersediaan)
  - `POST /api/reservations` (Atomic reservation dengan idempotency key & conflict detection 409)
  - `GET /api/wishes`, `POST /api/wishes` (Buku tamu ucapan & doa)
- **Database Engine (`database.py`):** SQLite3 WAL mode, PRAGMA foreign_keys = ON, busy_timeout = 5000ms.
- **Scaffold React/Vite:** `package.json` lama di root adalah artefak scaffold awal yang TIDAK digunakan (tidak ada folder `src/` atau `vite.config.*`).

---

## 2. STATUS AUDIT PHASE 11 BERDASARKAN BUKTI EMPIRIS

| Area Fokus | Status | Bukti / Screenshot Baseline | Temuan Kritis & Evaluasi |
| :--- | :---: | :--- | :--- |
| **1. Environment Grounding** | **VERIFIED WITH MINOR GAPS** | `p11_01_world_overview.png`<br>`p11_06_tree_grounding.png`<br>`p11_07_terrace_transition.png` | - 5 tingkatan terasering (y = 0.0, 1.0, 2.0, 3.2, 5.0) tertata rapi.<br>- Pohon Tabebuia memiliki akar buttress 4-arah yang menancap natural.<br>- Retaining wall batu kali memiliki coping stone cap.<br>- **Gap:** Ujung retaining wall barat di dekat food court terputus agak tajam di atas rumput. |
| **2. Pathway Connectivity** | **IMPLEMENTED (HAS CLIPPING BUG)** | `p11_04_favorite_food_path.png`<br>`p11_05_path_junctions.png`<br>`p11_08_stairs_and_landing.png` | - Seluruh landmark terhubung melalui jalur flagstone.<br>- 3 set tangga terhubung matematis dengan `TerrainManager.getHeight()`.<br>- **BUG KRITIS:** Baris kebun teh `addBushRow(-34, -8, -8, -8, ...)` memotong langsung melintang di atas jalan setapak menuju Food Court pada `x = -18, z = -8`. |
| **3. Landmark Spacing & Hierarchy** | **VERIFIED** | `p11_01_world_overview.png`<br>`p11_09_hachi_exterior_wide.png` | - Sumbu tengah (x: -3 hingga 3) 100% bebas hambatan, menghasilkan sightline terbuka langsung dari pintu masuk ke The Hachi Garden.<br>- Jarak antarlandmark luas (14m–20m), tidak ada objek yang saling menutupi. |
| **4. Vegetation & Landscape** | **VERIFIED WITH 1 FIX NEEDED** | `p11_01_world_overview.png`<br>`p11_04_favorite_food_path.png` | - 480 teh instanced (`InstancedMesh`) disusun mengikuti kontur kurva.<br>- Kanopi pohon diangkat hingga y > 6.4m sehingga tidak menghalangi kamera.<br>- Partikel kelopak bunga melayang tertiup angin.<br>- **Fix:** Pindahkan koordinat baris semak yang memotong jalur Food Court. |
| **5. The Hachi & Food Court** | **VERIFIED WITH TEXTURE GAPS** | `p11_04_favorite_food_path.png`<br>`p11_10_the_hachi_signage.png`<br>`p11_12_hachi_three_quarter.png` | - Restoran The Hachi kokoh di y = 5.0 dengan fasad kaca panorama.<br>- Food Court Joglo berada di y = 3.2.<br>- **Gap Visual:** Papan nama/menu Food Court masih berupa balok hitam polos tanpa teks. Plakat nama pada lengkungan pelaminan juga masih berupa bar polos. |
| **6. Main Hall Interior & Seating** | **VERIFIED WITH DESIGN GAPS** | `p11_13_main_hall_wide.png`<br>`p11_14_adjie_daul_pelaminan.png`<br>`p11_16_player_sitting.png` | - Pelaminan dengan sofa, Adjie & Daul tersenyum dalam busana pengantin.<br>- 4 meja perjamuan bundar dengan 16 kursi Chiavari dan tamu NPC.<br>- Fitur duduk interaktif bekerja.<br>- **Gap Desain:** Plafon saat ini berwarna krem/tan coffered beam, belum menerapkan trompe l'œil langit biru berawan khas Hachi Garden.<br>- **Gap Integrasi:** Kursi pemain di-hardcode ke Meja 1 Kursi 0, belum membaca alokasi kursi dinamis dari hasil RSVP database (A1-D2). |
| **7. Avatar, Collision, & Movement** | **VERIFIED (CAMERA TARGET ISSUE)** | `p11_02_main_path_ground_level.png`<br>`p11_23_mobile_portrait_world.png` | - Sistem collision `inclusive walkable zone` mencegah avatar keluar dari jalan/terasering.<br>- Lompat (Jump) dan rotasi lerp berjalan mulus.<br>- **BUG KAMERA MOBILE:** `CameraController.setTarget(character.getPosition())` menargetkan titik kaki (y=ground), sehingga pada mobile portrait (390x844), separuh bawah layar didominasi oleh rumput tanah datar. |
| **8. Guest Journey & Mobile** | **VERIFIED WITH FITUR LENGKAP** | `p11_19_rsvp_present.png`<br>`p11_22_rsvp_declined.png`<br>`p11_25_mobile_interior.png` | - Parameter `?to=...` tersanitasi dan tampil di Cover, HUD, RSVP, dan Main Hall.<br>- Alur RSVP Hadir langsung membawa tamu ke Main Hall.<br>- Alur RSVP Tidak Hadir melepaskan kursi dan menampilkan ucapan terima kasih.<br>- Kontrol mobile (joystick, tombol Jump/Action) tersedia.<br>- **Gap Mobile:** Pada viewport portrait, modal dialog dan card interior agak padat sehingga perlu penyesuaian padding dan scale. |

---

## 3. HASIL VERIFIKASI PENGUJIAN REGRESI

### 3.1 Backend Test Suite (Automated)
```powershell
& "C:\Users\aps00007048\AppData\Local\miniconda3\envs\undangan\python.exe" -m unittest discover -s tests -p "test_*.py"
```
**Hasil:**
- Total tes: **44/44 PASS (100% OK)** dalam 3.44s.
- `test_phase1_security.py`: 7 passed (XSS escaping, modal cleanup, rate limiting).
- `test_database_phase3a.py`: 12 passed (SQLite WAL, migrations, constraints).
- `test_api_phase3b.py`: 8 passed (RSVP endpoints, wishes, validation).
- `test_reservations_phase4.py`: 7 passed (Seat concurrency, race conditions, idempotency).
- `test_integration_e2e_phase5.py`: 10 passed (Full guest lifecycle, token recovery, rollback).

### 3.2 Visual Regression Artifacts
- Sebanyak 25 screenshot pengujian otomatis tersimpan di directori `screenshots/phase11/` (`p11_01_*.png` s/d `p11_25_*.png`), membuktikan rendering 3D pada desktop (1440x900) dan mobile (390x844 & 844x390).

---

## 4. STATUS GIT & PERUBAHAN KERJA AKTIF

### 4.1 Git Branch & Status
- **Current Branch:** `main` (Up to date with origin/main commit `b214e87`)
- **Staged:** 0 files.
- **Unstaged Modified:** 28 files (perbaikan ThreeScene, CameraController, CharacterController, TerrainManager, HachiGarden3D, RSVPModal, MainHallView, dsb).
- **Untracked files:** 18 files/direktori (`routes/`, `database.py`, `tests/`, `scratch/`, `screenshots/`, `TerrainManager.js`, `TextureFactory.js`, `MainHallView.js`, modular landmarks, modular modals).

---

## 5. HASIL IMPLEMENTASI SPRINT 1 (CONTROLLED TASKS)

### 5.1 Task 1: Perbaikan Vegetasi Jalur Food Court
- **File Dimodifikasi:** [static/js/world/HachiGarden3D.js](file:///d:/Antigravity/Project/Random/undangan_antigravity/static/js/world/HachiGarden3D.js)
- **Penyebab:** Row semak teh `addBushRow(-34, -8, -8, -8, 3.2, 16, 0.8)` memotong melintang jalan setapak batu kali dan tangga menuju Food Court di `x = -18, z = -8`.
- **Solusi:** Baris tanaman teh dipisahkan menjadi dua segmen di luar koridor jalan:
  1. Sayap luar barat (lereng bukit belakang Food Court): `x: -36 s/d -30`, `z: -8` dan `z: -12`.
  2. Lereng terasering tengah (antara dinding penahan Food Court dan Grand Staircase): `x: -13.5 s/d -5.5`, `z: -8` dan `z: -12`.
- **Hasil Verifikasi:**
  - Screenshot `p11_04_favorite_food_path.png` membuktikan jalan setapak, bordes tangga, dan lentera 100% bebas dari semak teh.
  - Screenshot `p11_01_world_overview.png` mengonfirmasi lanskap tetap padat, alami, dan tidak memiliki gap/lubang aneh.
  - Status Acceptance: **PASS**.

### 5.2 Task 2: Perbaikan Framing Kamera Mobile Portrait
- **File Dimodifikasi:** [static/js/three/CameraController.js](file:///d:/Antigravity/Project/Random/undangan_antigravity/static/js/three/CameraController.js)
- **Penyebab:** Titik `lookAt` kamera sebelumnya mengarah ke `this.targetPosition` pada level tanah (`y = groundY`), serta radius kamera di-stretch berlebihan (`0.45`), sehingga pada viewport mobile portrait sempit (390 × 844), separuh bawah layar didominasi oleh tanah/rumput hijau dan avatar tampak mengecil.
- **Solusi:** 
  1. Menambahkan offset optik `targetLook` pada level dada/torso (`lookYOffset = aspect < 1.0 ? 1.15 : 0.75`).
  2. Menyesuaikan kalkulasi kamera `desiredCameraPos.y = Math.max(terrainFloor, targetLook.y + curOffsetY)`.
  3. Mengoptimalkan kompensasi radius portrait menjadi `radius *= (1.0 + (1.0 - aspect) * 0.15)`.
- **Hasil Verifikasi:**
  - Screenshot `p11_23_mobile_portrait_world.png` (390 × 844) membuktikan avatar ter-framing gagah dan proporsional di tengah-bawah layar (~33% tinggi viewport), dengan lengkungan landmark headphone dan langit senja membentang megah di bagian atas.
  - Screenshot `p11_02_main_path_ground_level.png` (1440 × 900) membuktikan tampilan desktop sama sekali tidak mengalami regresi.
  - Status Acceptance: **PASS**.

### 5.3 Verifikasi Regresi Backend
- Menjalankan seluruh test suite otomatis: **44/44 Unit & Integration Tests PASS (100% OK)** dalam 2.82s.

---

## 6. SISA TASK PHASE 11 (MENUNGGU SPRINT BERIKUTNYA)
1. **[P1] Tekstur Plafon Trompe l'œil Sky di Main Hall:** Lukisan langit biru berawan di panel kasau kayu interior.
2. **[P1] Signage Textures:** Papan menu nama stand Food Court & plakat monogram *"Adjie & Daul"* pada arch pelaminan.
3. **[P2] Dynamic Seating Connection:** Memetakan kursi pemain di Main Hall berdasarkan hasil booking token (`A1–B2` Keluarga vs `C1–D2` Teman).

---

## 7. CARA MENJALANKAN & MENGULANG AUDIT
1. Jalankan backend server:
   ```powershell
   & "C:\Users\aps00007048\AppData\Local\miniconda3\envs\undangan\python.exe" app.py
   ```
2. Jalankan unit test:
   ```powershell
   & "C:\Users\aps00007048\AppData\Local\miniconda3\envs\undangan\python.exe" -m unittest discover -s tests -p "test_*.py"
   ```
3. Akses URL inspeksi di browser:
   - Alur Tamu Lengkap: `http://localhost:5000/?to=Nama+Tamu`
   - Inspeksi Dunia 3D: `http://localhost:5000/?to=Nama+Tamu&view=overview`
   - Inspeksi Jalur Food Court: `http://localhost:5000/?to=Nama+Tamu&view=food_path`
   - Inspeksi Mobile Portrait: `http://localhost:5000/?to=Nama+Tamu&view=music_path` (viewport 390x844)
   - Inspeksi Main Hall Resepsi: `http://localhost:5000/?to=Nama+Tamu&phase=hall&view=wide`
   - Inspeksi Pelaminan: `http://localhost:5000/?to=Nama+Tamu&phase=hall&view=pelaminan`
   - Inspeksi RSVP Modal: `http://localhost:5000/?to=Nama+Tamu&phase=rsvp`
