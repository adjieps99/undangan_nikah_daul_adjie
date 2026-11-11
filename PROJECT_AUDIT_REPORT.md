# PROJECT AUDIT REPORT
## Adjie & Daulika — The Garden of Us (Complete Experience Redesign)
**Date:** November 10, 2026  
**Auditor:** Senior Multidisciplinary Engineering & Wedding Experience Design Team  
**System Architecture:** Node.js 22, Express 5, TypeScript, Three.js r160, Web Audio API, Responsive HTML5/CSS3  

---

## 1. Executive Summary

A comprehensive architectural and UX audit of the wedding application was performed to assess its visual identity, interactive flow, 3D world stability, and narrative design. While the application possesses a stable Three.js rendering engine and recent realistic character upgrades, its narrative presentation was hindered by game-like jargon, stiff formal language, an incorrectly exposed envelope letter, an empty pathway to Landmark 3, restrictive venue camera controls, and outdated wedding data.

This report establishes the baseline status across all application layers and outlines the surgical refactoring path to transform the project into **"The Garden of Us"** — an intimate, romantic, and immersive interactive world created by **Adjie & Daulika**.

---

## 2. Component-by-Component Audit & Gap Analysis

### 2.1 Opening Screen & Envelope (`CoverView.js`)
- **Current State:**
  - Displays `"PRESS START TO ENTER"` and `"THE WEDDING ADVENTURE"`.
  - The envelope container rendered the letter card (`.envelope-letter`) in a partially visible state before any user interaction, ruining the physical surprise of opening an envelope.
  - Has an external "BUAT AVATAR & MULAI PETUALANGAN" button that distracts from the envelope.
- **Required Transformation:**
  - Update branding to **THE GARDEN OF US** with subtitle *"A little world, made of our story"* and couple **ADJIE & DAULIKA**.
  - Remove all "PRESS START" and arcade-like terminology.
  - Physically enclose the letter completely within the envelope using a multi-flap pocket structure.
  - Make clicking/tapping the wax seal / envelope flap the primary interaction: flap opens, letter smoothly rises, reveals personal message, and transitions forward seamlessly.

### 2.2 Journey Flow & Copywriting Tone
- **Current State:**
  - System copy used robotic, administrative Indonesian (`"Sesuaikan Avatar RPG Pernikahan Anda"`, `"Konfirmasi interaksi pengguna"`, `"Masuk ke area virtual"`).
  - An opening video was slated, but has been cancelled by the couple.
  - Redundant close buttons existed on journey modals where the main action button already navigated.
- **Required Transformation:**
  - Rewrite all copywriting into warm, conversational, welcoming Indonesian from the perspective of Adjie and Daulika (`"Desain avatar kamu dulu, yuk!"`, `"Yuk, jelajahi garden!"`, `"Sudah siap?"`).
  - Replace opening video with an **Audio Storytelling Component (Couple Voice Recording)** featuring real-time Web Audio API waveform analysis, scrubbable progress, volume control, and clean placeholder copy (`"Suara kecil dari kami, khusus untuk kamu"`).
  - Remove redundant close button at the garden entrance modal.

### 2.3 3D Outdoor Garden & Landmark Pathway (`HachiGarden3D.js`)
- **Current State:**
  - Main north-south walkway has tea plantation terraces and central lanterns.
  - The lateral pathway branching west toward Landmark 3 (Listening Station, $x = -2.5$ to $x = -24.0$) was visually bare, with minimal floral borders, lacking decorative lanterns, and feeling disconnected from the rest of the lush landscape.
- **Required Transformation:**
  - Add sculpted stone borders, lush hydrangeas and flowering lavender bushes along both edges of the west pathway.
  - Add warm wooden pathway lanterns, ornamental stepping stones, and a directional wooden signpost pointing toward the Listening Station.
  - Preserve collision geometry so walking remains completely unobstructed.

### 2.4 Garden Landmarks & Modals
1. **Landmark 1 — Waktu & Lokasi Acara (`LocationModal.js`):**
   - *Current Issues:* Contained a "Dress Code" section; date was outdated (28 Nov 2026); text line-height was tightly packed.
   - *Fix:* Remove dress code completely. Display exact details: **Akad Nikah & Ramah Tamah**, **Sabtu, 5 Desember 2026**, **08.30 - 13.00 WIB**, **The Hachi Garden Ampera**, with a direct clickable Google Maps link (`https://maps.app.goo.gl/JgJMgK3bS5mcspb26`). Increase vertical padding and typographic hierarchy.
2. **Landmark 2 — Galeri Foto (`PhotoGalleryModal.js`):**
   - *Current Issues:* Titled "Galeri Foto & Cerita Kami"; lacked a dedicated responsive image lightbox and swipe gestures.
   - *Fix:* Rename to **GALERI FOTO** (remove "Cerita Kami"). Implement a responsive grid with image modal lightbox, previous/next buttons, touch swipe, and copy: *"Beberapa momen kecil yang ingin kami simpan selamanya."*
3. **Landmark 3 — Listening Session (`ListeningStationModal.js`):**
   - *Current Issues:* Featured generic pop playlist (Yovie & Nuno, Tulus).
   - *Fix:* Configure exact ordered tracklist: (1) *Langit Merah Muda* — Afgan (default), (2) *Rona Merah Langit* — Kunto Aji, (3) *Ikat Aku Ditulang Belikatmu* — Sal Priadi, (4) *Begini Begitu* — Maliq & D'Essentials, (5) *Just You* — Teddy Aditya. Include audio player with timeline, track selector, and graceful placeholder handling.
4. **Landmark 4 — Profil Kami (`ProfileModal.js`):**
   - *Current Issues:* Displayed relationship timeline ("The Wedding Day", "Kisah Perjalanan") and incorrect parents.
   - *Fix:* Rename to **PROFIL KAMI**. Remove relationship history. Feature **Adjie Prasatia Sakti** (Putra dari Bapak Muhammad Saleh & Ibu Sri Ratni) in black beskap, and **Daulika Pratiwi** (Putri dari Bapak Achmad Agussalim & Ibu Ratu Rachmi Utari) in white kebaya with natural hair.

### 2.5 Wedding Venue — THE HACHI GARDEN (`MainHallView.js`)
- **Current State:**
  - Venue camera was fixed at distance 5.6m; zoom was disabled, limiting visual exploration.
  - In-hall notifications had oversized text and stacked awkwardly.
  - Character sitting pose required fine-tuning against banquet chairs to prevent floating or clipping.
- **Required Transformation:**
  - Standardize title: **THE HACHI GARDEN**.
  - Enable free camera exploration: Mouse drag + scroll wheel zoom (desktop), touch swipe + pinch zoom (mobile) ranging from 2.8m (intimate view) to 12.0m (hall vista) with camera pitch clamping and collision guards.
  - Streamline in-hall notifications with compact typography, refined padding, and non-intrusive HUD placement.
  - Calibrate seated avatar position and knee articulation so thighs rest flush on seat pads and feet rest flat on the floor.

### 2.6 RSVP & Attendance Architecture (`server.ts`, `RSVPModal.js`)
- **Current State:**
  - Backend `/api/rsvp` supports guest count 1 to 4 with seat reservation logic.
  - Did not formally distinguish between **Category A (allowed 2 people)** and **Category B (1 person only: "Berlaku untuk 1 orang")**.
- **Required Transformation:**
  - Update `RSVPModal.js` to recognize invitation categories and display `"Berlaku untuk 1 orang"` for individual guests while capping Category A at 2 attendees.
  - Author `ATTENDANCE_SYSTEM_PROPOSAL.md` to establish the administrative check-in, duplicate prevention, and guest monitoring protocol for user approval before migrating production data.

---

## 3. Implementation Phasing Strategy

| Stage | Scope | Key Deliverables |
|:---|:---|:---|
| **Stage 1** | Project & System Audit | `PROJECT_AUDIT_REPORT.md`, `PENDING_ASSETS_AND_DECISIONS.md` |
| **Stage 2** | Opening Experience & Copywriting | Brand update to "The Garden of Us", closed envelope physics, Voice Recording modal, conversational Indonesian |
| **Stage 3** | Garden Landmarks & 3D Pathway | Location card update, Galeri Foto lightbox, 5-track Listening Session, pathway scenery to Landmark 3, Profil Kami |
| **Stage 4** | The Hachi Garden Reception Venue | Free camera rotation + wheel/pinch zoom, notification styling, refined seating kinematics |
| **Stage 5** | Attendance Architecture & Proposal | `ATTENDANCE_SYSTEM_PROPOSAL.md`, Category A/B RSVP UI updates |
| **Stage 6** | Quality Assurance & Verification | Desktop, mobile, and tablet browser testing; `FINAL_TEST_REPORT.md`, `README.md` |
