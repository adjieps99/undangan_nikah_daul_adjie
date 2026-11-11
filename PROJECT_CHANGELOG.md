# PROJECT CHANGELOG — THE WEDDING ADVENTURE (HACHI GARDEN 3D)

All notable changes, refactorings, architectural upgrades, and gameplay improvements made to the project are documented in this file.

---

## [Phase 13 / Game Transformation Release] — November 2026

### 1. Environment & Navigation Upgrades
- **Fixed Food Court Collision Seam:** Resolved an invisible wall collision bug in `static/js/world/TerrainManager.js` where the approach corridor between Staircase 3 ($x = -14.5$) and the Food Court dining deck was improperly rejected by boundary checks.
- **Architectural Landing Platform (Bordes):** Added an explicit stone landing platform at the top of Staircase 3 ($x = -15.5, y = 3.2, z = -4.0$) in `static/js/world/HachiGarden3D.js` with continuous stone paving and stone cheek posts.
- **Enriched Food Court Props & Details:** Added customized Indonesian wedding culinary props to the Food Court in `static/js/world/landmarks/FoodCourt.js`:
  - Authentic ceramic bowls of *Mie Ayam Jamur Spesial* with noodle topping.
  - Cups of *Es Kopi Susu Gula Aren*.
  - Plate of *Pisang Goreng Keju Karamel*.
  - Handwritten blackboard menu sign: *"KULINER FAVORIT KAMI"*.
  - Welcoming entrance Torii lanterns flanking the landing approach.

### 2. Camera System & Movement Refinements
- **Camera Look-At Interpolation:** Upgraded `static/js/three/CameraController.js` with smooth look-at target lerping (`this.currentLook.lerp(targetLook, this.damping * 1.5)`) to eliminate rotational micro-jitter during rapid directional turns.
- **Spring-Arm Radius Smoothing:** Added smooth interpolation to the obstacle avoidance spring-arm, preventing abrupt camera snapping when orbiting near large architectural walls.
- **Stair Stepping Curve:** Replaced harsh step-snapping in `static/js/three/CharacterController.js` with an adaptive elevation tracking curve (`diffY * 0.45`) ensuring fluid elevation transitions on multi-tier garden terraces and staircases.
- **Stride Cadence Audio Trigger:** Integrated footstep cadence detection based on sinusoidal stride zero-crossing in `CharacterController.update()`.

### 3. Audio & Atmosphere Engine
- **Procedural Web Audio Engine:** Implemented `static/js/game/AudioSystem.js` leveraging the browser Web Audio API:
  - Generates ambient mountain twilight breeze via lowpass filtered pink noise.
  - Plays gentle Indonesian Pelog scale pentatonic acoustic bell chords periodically in the background.
  - Generates soft footstep stone clicks, jump whoosh sounds, and gold harmonic UI chimes.
  - Completely self-contained with zero external `.mp3`/`.wav` network dependencies.
  - Supports persistent mute/unmute state with a responsive toggle button on the HUD.

### 4. Professional Game UI/UX Transformation
- **In-Game Compass & Navigation Radar:** Integrated a floating gold-accented radar strip (`.hud-radar-strip`) in `MapView3D.js` displaying real-time distance and directional icons to the nearest landmark (e.g. `🍜 Food Court Favorit • 14m`).
- **Interactive Audio Toggle:** Added a dedicated speaker button (`🔊` / `🔇`) in both the outdoor world HUD (`MapView3D.js`) and the reception hall header (`MainHallView.js`).
- **Cover Screen Copywriting:** Fixed legacy "Taman 2D" wording in `CoverView.js` to *"Taman 3D Hachi Garden"*, and added interactive sound chimes on opening the invitation envelope and starting the game.
- **Main Hall Interactive Seating Chimes:** Wired audio feedback to chair sitting (`sitAtSeat`) and standing (`standUp`).

### 5. Backend & Deployment Reliability
- **Express 5 ESM Compatibility:** Cleaned up CommonJS named import syntax in `server.ts` by using `import type { Request, Response, NextFunction } from 'express'`, enabling seamless production deployment on Google Cloud Run with Node 22 native type-stripping.
- **Idempotency & Concurrency:** Maintained full support for rate-limiting, token-authenticated RSVP management, and atomic seat reservation logic.

---

## File Modification Log

| File Path | Action | Description |
|---|---|---|
| `static/js/world/TerrainManager.js` | Modified | Fixed Food Court walkway bounds and Staircase 3 elevation interpolation |
| `static/js/world/HachiGarden3D.js` | Modified | Added landing bordes platform and seamless paving to Food Court |
| `static/js/world/landmarks/FoodCourt.js` | Modified | Added wedding culinary props, menu blackboard, and entrance lanterns |
| `static/js/three/CameraController.js` | Modified | Added smooth look-at interpolation and spring-arm radius smoothing |
| `static/js/three/CharacterController.js` | Modified | Added footstep cadence trigger and adaptive stair elevation curve |
| `static/js/game/AudioSystem.js` | Created | Procedural Web Audio engine for ambient music, SFX, and UI feedback |
| `static/js/views/MapView3D.js` | Modified | Added HUD audio toggle, real-time navigation radar, and modal chime triggers |
| `static/js/views/CoverView.js` | Modified | Updated copy to 3D Hachi Garden and added audio feedback |
| `static/js/views/MainHallView.js` | Modified | Added audio toggle and sound triggers for interactive seating |
| `static/css/style.css` | Modified | Added styles for `.hud-radar-strip`, `.radar-pulse`, and `.hud-audio-btn` |
| `PROJECT_AUDIT_REPORT.md` | Created | Comprehensive architectural and technical audit report |
| `PROJECT_CHANGELOG.md` | Created | Full changelog of Phase 13 transformations |
| `FINAL_TEST_REPORT.md` | Created | Verification test matrix and runtime validation report |
| `README.md` | Modified | Updated instructions, architecture, and deployment guide |

---

## [Phase 14 / Master Wedding Experience Redesign] — November 2026

### 1. Brand & Narrative Foundation ("The Garden of Us")
- **Updated Creative Identity:** Formalized primary brand title as *"THE GARDEN OF US"*, with subtitle *"A little world, made of our story."* and couple names **Adjie Prasatia Sakti & Daulika Pratiwi**.
- **Centralized Wedding Data (`wedding.js`):**
  - Groom: Adjie Prasatia Sakti (Putra tercinta dari Bpk. Muhammad Saleh & Ibu Sri Ratni).
  - Bride: Daulika Pratiwi (Putri tercinta dari Bpk. Achmad Agussalim & Ibu Ratu Rachmi Utari).
  - Event: Akad Nikah & Ramah Tamah, Sabtu, 5 Desember 2026, 08.30 - 13.00 WIB.
  - Venue: The Hachi Garden Ampera, Jl. Ampera Raya No. 129, Pasar Minggu, Jakarta Selatan.
  - Maps: `https://maps.app.goo.gl/JgJMgK3bS5mcspb26`.
  - Removed dress code.
  - Configured 5 exact playlist tracks with Afgan (*Panah Asmara*) as default.

### 2. Envelope & Storytelling Audio Modal
- **Physically Closed Envelope (`CoverView.js` & `style.css`):**
  - Removed "PRESS START" button and text entirely.
  - Constructed a multi-layer physical envelope with front pocket (`.envelope-front-pocket`) completely concealing the letter before interaction.
  - Clicking flap/seal flips the flap, slides letter smoothly upward with cubic-bezier transition, reveals guest name and personal invitation, and presents *"MASUK KE GARDEN"*.
- **Storytelling Audio Modal (`VoiceRecordingModal.js`):**
  - Replaced opening video with a dedicated audio storytelling component.
  - Features real Web Audio API analyser with animated audio frequency waveform canvas.
  - Scrubbable seek bar, current/duration time readout, and volume slider.
  - Exact copywriting: *"Suara kecil dari kami, khusus untuk kamu."* and *"Rekaman suara kami akan segera hadir di sini."*
  - Single primary CTA: *"Jelajahi Garden"* with no redundant close button.

### 3. Garden Landmarks & Wayfinding Upgrades
- **Landmark 1 (`LocationModal.js`):** Akad Nikah & Ramah Tamah, 5 Des 2026, 08.30 - 13.00 WIB, The Hachi Garden Ampera, direct Maps anchor link, generous vertical spacing, zero dress code.
- **Landmark 2 (`PhotoGalleryModal.js`):** Renamed to *"GALERI FOTO"*, copy *"Beberapa momen kecil yang ingin kami simpan selamanya."*, responsive grid, and interactive lightbox with prev/next and mobile swipe support.
- **Landmark 3 (`ListeningStationModal.js`):** 5 exact songs (Afgan default, Kunto Aji, Sal Priadi, Maliq & D'Essentials, Teddy Adhitya), playback controls, scrubbable progress, volume slider, and procedural synth fallback.
- **Enhanced 3D Pathway to Landmark 3 (`HachiGarden3D.js`):** Added continuous stone curbs along $z = 5.9$ and $z = 10.1$, flowering shrubs (hydrangeas, azaleas, lavender), stepping stones, and a directional carved wooden signpost pointing to the Listening Station.
- **Landmark 4 (`ProfileModal.js`):** Renamed to *"PROFIL KAMI"*, groom in black beskap, bride in white kebaya and natural hair, exact parents, and relationship timeline completely removed.

### 4. Venue Free Camera & Seating Optimization (`MainHallView.js`)
- **Free Camera Controls:** Added mouse wheel zoom (desktop) and two-finger pinch zoom (mobile) clamped between 2.8m and 12.0m with collision safety bounds.
- **Compact Seating Notifications:** Redesigned prompt and status buttons to avoid text wrapping or HUD overlap.
- **Calibrated Sitting Alignment:** Seated avatar thighs rest flush on chair cushions with 90° knee angle and hands on lap.

### 5. Attendance Architecture & RSVP Policy
- **Category A vs Category B Enforcement (`RSVPModal.js`):**
  - Category A: allows selecting 1 or 2 pax with label *"Berlaku untuk maksimal 2 orang"*.
  - Category B: locked to 1 pax with badge *"Berlaku untuk 1 orang"*.
- **Attendance System Proposal (`ATTENDANCE_SYSTEM_PROPOSAL.md`):** Complete production blueprint covering QR code e-ticket check-in, 4-digit PIN fallback, fraud/duplicate prevention, live headcount dashboard, and data privacy.

