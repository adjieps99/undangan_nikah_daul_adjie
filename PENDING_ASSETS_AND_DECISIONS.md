# PENDING ASSETS & DECISIONS TRACKER
## Adjie & Daulika — The Garden of Us

**Last Updated:** November 10, 2026  
**Status Policy:** Persistent tracker actively maintained across all development phases. Items will be reminded contextually in progress reports.

---

## 1. Status Legend
- `PENDING FROM USER`: Asset or decision needed from user; development continues with clean fallback/placeholder.
- `READY TO INTEGRATE`: Asset received from user and queued for immediate integration.
- `INTEGRATED`: Asset fully incorporated into the codebase and verified in runtime.
- `WAITING FOR DECISION`: Strategic choice or proposal awaiting user confirmation.
- `NOT REQUIRED`: Removed or superseded.

---

## 2. Active Tracking Table

| ID | Item Name | Purpose | Target Location / Component | Current Status | Dependencies / Notes |
|:---|:---|:---|:---|:---|:---|
| **A1** | Couple Voice Recording | Personal audio greeting from Adjie & Daulika replacing the video | `static/audio/couple_voice_greeting.mp3` -> `VoiceRecordingModal.js` | **PENDING FROM USER** | Component implemented with Web Audio API real waveform visualizer. Ready for file drop-in. |
| **A2** | Song 1: Langit Merah Muda — Afgan | Default listening session track | `static/audio/tracks/01_langit_merah_muda.mp3` -> `ListeningStationModal.js` | **PENDING FROM USER** | Player fully configured with title, artist, progress, and controls. |
| **A3** | Song 2: Rona Merah Langit — Kunto Aji | Track 2 in playlist | `static/audio/tracks/02_rona_merah_langit.mp3` -> `ListeningStationModal.js` | **PENDING FROM USER** | Player queue configured in exact order. |
| **A4** | Song 3: Ikat Aku Ditulang Belikatmu — Sal Priadi | Track 3 in playlist | `static/audio/tracks/03_ikat_aku_ditulang_belikatmu.mp3` -> `ListeningStationModal.js` | **PENDING FROM USER** | Player queue configured in exact order. |
| **A5** | Song 4: Begini Begitu — Maliq & D'Essentials | Track 4 in playlist | `static/audio/tracks/04_begini_begitu.mp3` -> `ListeningStationModal.js` | **PENDING FROM USER** | Player queue configured in exact order. |
| **A6** | Song 5: Just You — Teddy Aditya | Track 5 in playlist | `static/audio/tracks/05_just_you.mp3` -> `ListeningStationModal.js` | **PENDING FROM USER** | Player queue configured in exact order. |
| **B1** | Actual Couple Photos (Galeri Foto) | 6+ genuine couple photos for photo gallery grid and lightbox | `static/images/gallery/` -> `PhotoGalleryModal.js` | **PENDING FROM USER** | Responsive grid, lightbox, and swipe navigation fully built with romantic placeholders. |
| **C1** | Complete Guest List with Category Tagging | Guest names with Category A (max 2 pax) vs Category B (1 pax) | Backend database / config | **PENDING FROM USER** | Architecture prepared in `ATTENDANCE_SYSTEM_PROPOSAL.md`. |
| **C2** | Final Attendance Monitoring Decision | Approval of attendance architecture (QR check-in / PIN / staff dashboard) | `ATTENDANCE_SYSTEM_PROPOSAL.md` | **WAITING FOR DECISION** | Proposal drafted; awaiting user review before production migration. |
| **D1** | Additional Venue References / 3D Assets | Any specific venue interior photo references for The Hachi Garden | `MainHallView.js` | **PENDING FROM USER** | Venue scene is fully explorable in 3D. |

---

## 3. Reminders for User ("YANG MASIH DITUNGGU DARI KAMU")
1. **Voice Recording Audio File:** File audio rekaman suara personal Adjie & Daulika (format MP3/M4A/WAV).
2. **5 Song Audio Files for Listening Session:**
   - *Langit Merah Muda* — Afgan
   - *Rona Merah Langit* — Kunto Aji
   - *Ikat Aku Ditulang Belikatmu* — Sal Priadi
   - *Begini Begitu* — Maliq & D'Essentials
   - *Just You* — Teddy Aditya
3. **Foto-foto Asli Pasangan:** Foto-foto kenangan Adjie & Daulika untuk Galeri Foto.
4. **Daftar Tamu & Kategori Undangan:** Data tamu untuk Kategori A (maks 2 orang) dan Kategori B (1 orang).
5. **Review Proposal Presensi:** Konfirmasi mekanisme check-in di `ATTENDANCE_SYSTEM_PROPOSAL.md`.
