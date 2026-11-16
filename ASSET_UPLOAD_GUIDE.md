# Panduan Upload Aset — ADJIE & DAULIKA (The Garden of Us)

Dokumen ini adalah panduan lengkap dan resmi untuk mengunggah seluruh file aset (lagu latar, rekaman suara, galeri foto, dan model karakter 3D opsional) ke dalam aplikasi **The Garden of Us**.

Seluruh path pada aplikasi sudah disatukan melalui satu *manifest* terpusat (`static/js/config/assetManifest.js`) dan dilayani oleh server Express pada URL `/static/...`. Aplikasi **tidak pernah** membuat musik palsu atau foto contoh palsu—file yang Anda unggah di bawah ini akan langsung dipakai secara nyata oleh aplikasi.

---

## 1. Tabel Aset Lengkap & Wajib Diperhatikan

| Experience / Landmark | Asset | Exact filename | Project folder | Browser URL | Required? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Opening Experience & Latar Musik + Listening Station (Track 1 / Default) | Langit Merah Muda — Afgan | `01_langit_merah_muda.mp3` | `static/audio/tracks/` | `/static/audio/tracks/01_langit_merah_muda.mp3` | Ya (Wajib untuk BGM utama & Track 1) |
| Listening Station (Track 2) | Rona Merah Langit — Kunto Aji | `02_rona_merah_langit.mp3` | `static/audio/tracks/` | `/static/audio/tracks/02_rona_merah_langit.mp3` | Disarankan |
| Listening Station (Track 3) | Ikat Aku Ditulang Belikatmu — Sal Priadi | `03_ikat_aku_ditulang_belikatmu.mp3` | `static/audio/tracks/` | `/static/audio/tracks/03_ikat_aku_ditulang_belikatmu.mp3` | Disarankan |
| Listening Station (Track 4) | Begini Begitu — Maliq & D'Essentials | `04_begini_begitu.mp3` | `static/audio/tracks/` | `/static/audio/tracks/04_begini_begitu.mp3` | Disarankan |
| Listening Station (Track 5) | Just You — Teddy Aditya | `05_just_you.mp3` | `static/audio/tracks/` | `/static/audio/tracks/05_just_you.mp3` | Disarankan |
| Opening Voice Greeting Modal | Rekaman Suara Sapaan Adjie & Daulika | `couple_voice_greeting.mp3` | `static/audio/` | `/static/audio/couple_voice_greeting.mp3` | Opsional (jika kosong, status jujur ditampilkan) |
| Photo Gallery Landmark & Modal | Koleksi Foto Prewedding / Momen Berdua (format `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`) | Bebas berurut, misal `01_lamaran.jpg`, `02_prewed_taman.jpg`, `03_cincin.webp` | `static/images/gallery/` | `/static/images/gallery/<nama_file>` (otomatis ditemukan oleh `GET /api/gallery`) | Disarankan (untuk menampilkan foto di Galeri) |
| Photo Gallery Captions (Opsional) | Metadata Keterangan Foto | `gallery.json` | `static/images/gallery/` | `/static/images/gallery/gallery.json` (dibaca otomatis oleh `/api/gallery`) | Opsional |
| Couple Profile Pavilion Modal | Foto Potret Mempelai Pria (Adjie) | `adjie.jpg` | `static/images/couple/` | `/static/images/couple/adjie.jpg` | Opsional (fallback ke ilustrasi avatar mempelai) |
| Couple Profile Pavilion Modal | Foto Potret Mempelai Wanita (Daulika) | `daulika.jpg` | `static/images/couple/` | `/static/images/couple/daulika.jpg` | Opsional (fallback ke ilustrasi avatar mempelai) |
| Couple Profile Pavilion Modal | Foto Berdua Adjie & Daulika | `couple.jpg` | `static/images/couple/` | `/static/images/couple/couple.jpg` | Opsional |
| Cover Invitation Screen | Foto Sampul Amplop Undangan | `cover_photo.jpg` | `static/images/invitation/` | `/static/images/invitation/cover_photo.jpg` | Opsional |
| Karakter 3D — Pemain / Tamu (Rigged GLB) | Model 3D Manusia Tamu Undangan | `guest.glb` | `static/models/characters/` | `/static/models/characters/guest.glb` | Opsional (fallback ke karakter 3D semi-realistis bawaan) |
| Karakter 3D — Mempelai Pria Pelaminan (Rigged GLB) | Model 3D Adjie (Beskap Hitam) | `groom.glb` | `static/models/characters/` | `/static/models/characters/groom.glb` | Opsional (fallback ke karakter 3D semi-realistis bawaan) |
| Karakter 3D — Mempelai Wanita Pelaminan (Rigged GLB) | Model 3D Daulika (Kebaya Putih, Rambut Hitam Tanpa Hijab) | `bride.glb` | `static/models/characters/` | `/static/models/characters/bride.glb` | Opsional (fallback ke karakter 3D semi-realistis bawaan) |

> **Catatan Penting Penamaan File**:
> Gunakan **huruf kecil semua** (*lowercase*), tanpa spasi (pakai garis bawah `_`), dan pastikan ekstensi file (`.mp3`, `.jpg`, `.glb`) persis sama seperti tabel di atas.

---

## 2. Cara Upload File di Google AI Studio (Untuk Non-Developer)

Anda tidak perlu mengerti pemrograman untuk mengunggah foto dan lagu:

1. Buka panel daftar file (**File Explorer** / tab **Files**) di sebelah kiri layar Google AI Studio.
2. Cari dan buka folder **`static`**. Di dalamnya sudah tersedia folder-folder yang siap pakai:
   - `static/audio/` (untuk `couple_voice_greeting.mp3`)
   - `static/audio/tracks/` (untuk kelima lagu `.mp3`)
   - `static/images/gallery/` (untuk seluruh foto galeri)
   - `static/images/couple/` (opsional untuk `adjie.jpg`, `daulika.jpg`, `couple.jpg`)
   - `static/images/invitation/` (opsional untuk `cover_photo.jpg`)
   - `static/models/characters/` (opsional untuk model `.glb`)
3. Klik kanan (atau tekan ikon titik tiga `...` / **Upload File**) pada folder tujuan:
   - Contoh untuk lagu utama: arahkan ke `static/audio/tracks/`, pilih **Upload**, lalu unggah file Anda yang sudah dinamai persis **`01_langit_merah_muda.mp3`**.
   - Contoh untuk galeri foto: arahkan ke `static/images/gallery/`, lalu unggah foto-foto `.jpg` / `.png` / `.webp` terbaik Anda.
4. Untuk **Galeri Foto**, Anda **tidak perlu** mengedit kode apa pun: server otomatis memindai isi `static/images/gallery/` berdasarkan urutan abjad/angka (`01_...`, `02_...`, dst.).
5. Jika ingin menambahkan *caption* di bawah setiap foto saat dibuka (*lightbox*), buat/unggah file JSON bernama `gallery.json` di `static/images/gallery/` dengan format seperti berikut:
   ```json
   {
     "01_lamaran.jpg": { "caption": "Momen lamaran hangat bersama keluarga" },
     "02_taman.jpg": { "caption": "Sore indah di The Hachi Garden" }
   }
   ```
6. Setelah upload selesai, muat ulang (refresh) halaman preview dan uji langsung musik & galeri.

---

## 3. Spesifikasi Khusus Format Asset

### A. Audio (`.mp3`)
- Format: MP3 (`audio/mpeg`), CBR/VBR 128–192 kbps direkomendasikan agar cepat dimuat di jaringan seluler tamu.
- **Perilaku pemutaran otomatis (Browser Policy)**: Browser modern memblokir suara otomatis sebelum pengguna menyentuh layar. Karena itu, lagu **`01_langit_merah_muda.mp3`** akan mulai berputar otomatis tepat saat tamu menekan tombol **BUKA** pada amplop undangan (sentuhan pertama) dan terus mengalir halus ke halaman Avatar, Opening, Taman 3D, hingga Main Hall.
- Membuka **Listening Station** tidak akan me-restart lagu utama jika lagu tersebut sudah sedang diputar; menutup Listening Station juga akan membiarkan musik tetap mengalun.

### B. Foto Galeri (`.jpg`, `.png`, `.webp`, `.avif`)
- Rekomendasi ukuran: lebar maksimum 1600–2048 px, ukuran file di bawah 1,5 MB per foto agar tetap ringan di ponsel tamu.
- Semua foto di Galeri menggunakan `object-fit` yang menjaga rasio asli tanpa memaksa distorsi gambar saat *lightbox* dibuka.

### C. Model Karakter 3D Rigged Opsional (`.glb`)
Aplikasi sudah memiliki sistem loader `GLTF/GLB + THREE.AnimationMixer` yang otomatis aktif jika file `.glb` tersedia di `static/models/characters/`, dengan *fallback* mulus ke karakter 3D semi-realistis bawaan jika file belum diunggah.

Jika Anda ingin mengunggah file `.glb` buatan artis 3D / Mixamo / Ready Player Me:
1. Format: biner **`.glb`** (glTF 2.0) dengan seluruh tekstur tertanam di dalam `.glb`.
2. Orientasi & skala standar Three.js:
   - Sumbu atas: **`+Y` (Y-up)**
   - Arah hadap karakter: **`+Z` forward**
   - Titik tumpu asal (*origin* `(0, 0, 0)`): tepat di **bawah kedua telapak sepatu/kaki** di permukaan lantai (`y = 0`).
   - Tinggi total karakter sekitar 1.65m–1.85m (sistem otomatis menyesuaikan tinggi agar serasi dengan skala taman & kursi resepsi).
3. Nama klip animasi (*animation clips*) di dalam `.glb` agar otomatis terbaca oleh state animasi:
   - `idle` (berdiri santai)
   - `walking` (berjalan)
   - `turning` (opsional — transisi berbalik arah)
   - `sitting` (duduk di kursi resepsi / Pelaminan)
   - `standing` (opsional — transisi berdiri dari kursi)
   - `greeting` (opsional — gestur salam / sapaan hangat)
4. Khusus karakter **`bride.glb`** (Daulika): pastikan desain **rambut hitam alami terurai/anggun tanpa hijab**, mengenakan kebaya putih sesuai arahan resmi acara. Khusus **`groom.glb`** (Adjie): mengenakan beskap hitam klasik.
