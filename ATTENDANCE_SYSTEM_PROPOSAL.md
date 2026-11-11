# PROPOSAL SISTEM PRESENSI & MANAJEMEN TAMU (ATTENDANCE SYSTEM)
## Adjie Prasatia Sakti & Daulika Pratiwi — The Garden of Us
**Lokasi Acara:** The Hachi Garden Ampera, Jakarta Selatan  
**Waktu Acara:** Sabtu, 5 Desember 2026 | 08.30 - 13.00 WIB  
**Dokumen Status:** Architectural Proposal & Production Implementation Blueprint  

---

## 1. PENDAHULUAN & LATAR BELAKANG

Pernikahan Adjie & Daulika dirancang sebagai sebuah perayaan intim, hangat, dan personal (*intimate wedding*) di The Hachi Garden Ampera. Mengingat kapasitas venue semi-outdoor dan tata ruang meja resepsi yang dirancang estetik, pengendalian jumlah kehadiran fisik (*headcount*) serta kelancaran proses penyambutan tamu (*guest welcoming experience*) menjadi faktor krusial.

Sistem presensi ini dirancang untuk:
1. **Mencegah Penumpukan Antrean di Meja Penerima Tamu:** Memastikan setiap tamu dapat check-in dalam waktu kurang dari 5 detik.
2. **Penerapan Kuota Kategori Tamu yang Tegas Namun Santun:** Membedakan undangan **Kategori A** (maksimal 2 orang) dan **Kategori B** (berlaku khusus 1 orang).
3. **Mencegah Duplikasi & Pemalsuan Undangan:** Memastikan setiap tautan atau QR token hanya dapat di-check-in sesuai kuota resmi.
4. **Memberikan Visibilitas Real-Time kepada Keluarga & Wedding Organizer (WO):** Menyediakan dashboard monitoring okupansi kursi, konsumsi katering, dan kedatangan tamu VIP secara langsung.

---

## 2. STRUKTUR KATEGORI UNDANGAN & ATURAN KUOTA

Setiap tamu undangan dikelompokkan ke dalam kategori berbasis relasi dan alokasi meja:

| Kategori | Label Tampilan | Alokasi Kuota | Target Tamu | Pengaturan Tempat Duduk |
|:---|:---|:---|:---|:---|
| **Kategori A** | *Berlaku untuk maksimal 2 orang* | 1 s/d 2 Pax (Tamu memilih di RSVP) | Keluarga besar, sesepuh, tamu VIP, sahabat berpasangan | Meja Keluarga VIP (Row A & B) & Meja Sahabat (Row C & D) |
| **Kategori B** | *Berlaku untuk 1 orang* | Tepat 1 Pax (Terkunci otomatis di sistem) | Rekan kerja, sahabat perorangan, kenalan komunitas | Meja Teman / Standing & Banquet Area |

### Mekanisme Personalisasi Link Undangan:
Setiap undangan dibagikan melalui tautan unik:
```text
https://gardenofus.wedding/?to=Bapak+Budi+Santoso&cat=A
https://gardenofus.wedding/?to=Dinda+Rahma&cat=B
```
- **Parameter `to`**: Nama lengkap tamu yang otomatis muncul di amplop interaktif, surat cinta, karakter RPG, dan formulir RSVP.
- **Parameter `cat`**: Menentukan kuota kehadiran (`A` = pilihan 1-2 pax, `B` = terkunci 1 pax dengan badge penjelas santun).

---

## 3. ARSITEKTUR ALIRAN PRESENSI HARI-H (EVENT DAY CHECK-IN)

Kami mengusulkan 3 lapis metode check-in terintegrasi di meja penerima tamu (*Registration Desk*):

```
┌─────────────────────────────────────────────────────────────┐
│                 METODE CHECK-IN TAMU HARI-H                 │
└─────────────────────────────────────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
  [ METODE 1 ]            [ METODE 2 ]            [ METODE 3 ]
  E-Ticket QR Code       4-Digit Quick PIN      Pencarian Nama Tamu
  Scan via Kamera Tablet  Input Cepat oleh Tamu   Manual oleh Penerima Tamu
  (Waktu: 2-3 detik)     (Waktu: 4-5 detik)      (Backup / Tanpa HP)
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
        ┌──────────────────────────────────────────────┐
        │        VALIDASI ATOMIK SERVER (BACKEND)      │
        │ - Verifikasi Token Hash (SHA-256)            │
        │ - Pengecekan Status: Apakah Sudah Check-In?  │
        │ - Validasi Kuota Pax (Kategori A vs B)       │
        └──────────────────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [ CHECK-IN BERHASIL ]           [ PERINGATAN / DUPLIKAT ]
     - Cetak Label / Souvenir Token  - Notifikasi: Sudah check-in pk 09.15
     - Status berubah jadi "ARRIVED"  - Hubungi PIC Tamu / WO
     - Notifikasi Meja Duduk Tamu
```

### Metode 1: E-Ticket QR Code Scan (Rekomendasi Utama)
- Tamu yang telah mengisi RSVP menerima tiket digital berisi QR Code unik yang tersimpan di HP mereka.
- Petualang di meja penerima tamu menggunakan tablet / smartphone yang membuka scanner web kustom internal WO.
- Kamera memindai QR Code: verifikasi token berlangsung instan (< 1 detik).
- Layar scanner langsung menampilkan:
  - **Nama Tamu:** Adjie & Daulika's Guest
  - **Kategori:** Kategori A (2 Orang)
  - **Nomor Meja / Kursi:** Meja C (Sahabat) — Kursi C1, C2
  - **Status Souvenir:** Belum Diambil ➔ Otomatis ditandai Diambil

### Metode 2: 4-Digit Quick PIN (Alternatif Mandiri)
- Untuk tamu yang membuka undangan tanpa mengunduh QR Code, tiket digital mereka menampilkan kode 4 digit unik (misal: `AD-72`).
- Petugas mengetikkan 2 digit angka atau nama depan di keypad tablet resepsionis untuk verifikasi cepat.

### Metode 3: Pencarian Cepat Nama Tamu (Fasilitas Khusus & Lansia)
- Untuk tamu sepuh atau tamu yang tidak membawa smartphone, penerima tamu cukup mengetikkan 3 huruf pertama nama tamu pada tablet resepsi untuk menemukan data undangan dan menyelesaikan presensi.

---

## 4. KEAMANAN & PENCEGAHAN DUPLIKASI

1. **Tokenisasi URL Aman & Kriptografi SHA-256:**
   - Token RSVP dihasilkan menggunakan *cryptographic random bytes* (32-bytes base64url).
   - Di database, token disimpan dalam bentuk hash SHA-256, sehingga tidak dapat dipalsukan atau dimanipulasi dari sisi klien.
2. **Pencegahan Double Check-in (Concurrency Control):**
   - Transaksi database bersifat atomik. Begitu status berubah menjadi `CHECKED_IN`, pemindaian kedua pada QR yang sama akan langsung memunculkan pesan peringatan ramah:
     *"Tamu atas nama [Nama] telah melakukan check-in pada pukul [Jam:Menit] WIB. Silakan konfirmasi ke meja koordinator jika ada kesalahan."*
3. **Perlindungan Data Pribadi (Privacy-First):**
   - Tidak ada data nomor telepon atau alamat email sensitif yang ditampilkan secara publik pada klien.
   - Hak akses dashboard admin dilindungi dengan session token khusus panitia.

---

## 5. DASHBOARD MONITORING REAL-TIME UNTUK KELUARGA & WO

Dashboard khusus (*Reception Live Console*) dapat diakses oleh Wedding Organizer dan keluarga inti dari browser manapun tanpa perlu instalasi aplikasi:

### Fitur Utama Dashboard:
1. **Ringkasan Kehadiran Live (Live Headcount Counter):**
   - Total Undangan Tersebar vs Total RSVP Terkonfirmasi.
   - Total Tamu yang Sudah Hadir Fisik di Lokasi (*Arrived Pax*).
   - Tamu yang Masih Dalam Perjalanan / Belum Hadir.
2. **Peta Okupansi Kursi (Seating Plan Live Map):**
   - Visualisasi denah Meja A, B, C, D di The Hachi Garden.
   - Warna kursi berubah secara dinamis:
     - 🟩 **Hijau**: Tamu telah duduk di lokasi.
     - 🟨 **Kuning**: Terkonfirmasi hadir, sedang di area garden/foto.
     - ⬜ **Abu-abu**: Belum tiba.
3. **Pemberitahuan Tamu VIP (VIP Arrival Alerts):**
   - Notifikasi khusus bergetar di tablet penerima tamu saat keluarga inti atau tamu VIP tiba di gerbang masuk.
4. **Manajemen Souvenir:**
   - Penghitung stok souvenir otomatis berkurang setiap kali tamu melakukan check-in fisik.

---

## 6. RENCANA IMPLEMENTASI TEKNIS & LANGKAH SELANJUTNYA

| Tahapan | Deskripsi Teknis | Estimasi Kesiapan | Status |
|:---|:---|:---|:---|
| **Tahap 1** | Implementasi kuota Kategori A (2 pax) vs Kategori B (1 pax) di `RSVPModal.js` dan backend `server.ts` | Tersedia saat ini | **SELESAI** |
| **Tahap 2** | Penerbitan E-Ticket QR Code digital pada modal konfirmasi RSVP tamu | Siap diintegrasikan | **SIAP INTEGRASI** |
| **Tahap 3** | Pembuatan portal scanner QR admin WO (`/admin/checkin`) dengan kamera HTML5 | Siap diintegrasikan | **MENUNGGU KEPUTUSAN** |
| **Tahap 4** | Dashboard statistik kehadiran live keluarga (`/admin/live-headcount`) | Siap diintegrasikan | **MENUNGGU KEPUTUSAN** |

---

## 7. KEPUTUSAN YANG DIBUTUHKAN DARI ADJIE & DAULIKA

Untuk melangkah ke integrasi penuh Tahap 3 & 4 pada sistem presensi hari-H:
1. **Apakah sistem presensi hari-H ingin menggunakan Scanner QR Code via kamera tablet panitia, atau cukup pencarian nama di tablet WO?** (Keduanya didukung).
2. **Apakah souvenir akan dibagikan di meja registrasi depan saat scan QR, atau di meja souvenir terpisah saat tamu pulang?**
3. **Mohon kirimkan draft daftar nama tamu dengan tanda Kategori A atau B saat sudah siap.**
