# 🌸 THE GARDEN OF US — 3D WEDDING EXPERIENCE
### Interactive 3D Wedding Invitation & Virtual World
**Couple:** Adjie Prasatia Sakti & Daulika Pratiwi  
**Venue:** The Hachi Garden Ampera, Jakarta Selatan  
**Date:** Sabtu, 5 Desember 2026 | 08.30 - 13.00 WIB  
**Tagline:** *"A little world, made of our story."*

An immersive, romantic interactive 3D digital wedding experience built with **Three.js (WebGL)**, a **Node.js Express TypeScript** backend, and an in-browser **Procedural Web Audio Engine**. Guests can unfold a physically closed envelope to reveal their personal invitation, customize their realistic 3D avatar, listen to a storytelling audio greeting with a real Web Audio frequency waveform, explore terraced tea gardens and landmark pavilions, discover the couple's favorite playlist, confirm RSVP with strict category quota enforcement (Category A vs B), and explore the Grand Reception Hall at The Hachi Garden with interactive Chiavari seating.

---

## 🌟 Key Features

1. **3D Terraced Garden World (`HachiGarden3D.js`):**
   - 5 multi-tier elevation terraces with stone pathways, grand staircases, and traditional Joglo pavilions.
   - Dynamic sunset twilight atmosphere with Indonesian mountain mist and falling flower petals.
   - Comprehensive heightfield terrain and physical collision detection (`TerrainManager.js`).

2. **Camera-Relative Character Movement (`CharacterController.js`):**
   - Smooth camera-relative walking with WASD or analog virtual joystick.
   - Natural stride animation, jumping physics, and adaptive stair elevation climbing.
   - Seamless interactive sitting (`sitOn`) and standing (`standUp`) at Chiavari banquet chairs.

3. **Cinematic Follow Camera (`CameraController.js`):**
   - Spherical orbit third-person follow camera with smooth look-at focus interpolation.
   - Obstacle-avoidance spring-arm preventing clipping through buildings.
   - Touch drag to orbit, 2-finger touch pinch-to-zoom, and mouse wheel zoom.

4. **Procedural Web Audio Engine (`AudioSystem.js`):**
   - Zero-dependency browser Web Audio synthesis: ambient mountain wind, Indonesian Pelog pentatonic acoustic chimes, footsteps on stone, jump effects, and UI feedback.
   - One-tap audio mute/unmute toggle on the HUD.

5. **In-Game Navigation Radar (`MapView3D.js`):**
   - Real-time HUD compass indicator displaying distance in meters to the nearest interactive landmark.

6. **Fully Explorable 3D Main Reception Hall (`MainHallView.js`):**
   - Seamless entrance from outdoor terrace upon RSVP confirmation.
   - Grand Pelaminan stage with Bride & Groom avatars in traditional royal gold attire.
   - 4 banquet tables, 8 seated NPC guests in batik/kebaya, and 8 vacant Chiavari chairs with VIP seat assignment markers.
   - Quick exit back to outdoor porch preserving position and rotation.

7. **Validated REST APIs (`server.ts`):**
   - Cryptographically tokenized RSVP submissions (`POST /api/rsvp`, `PUT /api/rsvp/:id`).
   - Paginated guestbook wishes (`GET /api/wishes`, `POST /api/wishes`).
   - Atomic seat reservation with idempotency protection and anti-double-booking locks (`GET /api/seats`, `POST /api/reservations`, `DELETE /api/reservations/:id`).

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js:** v20.x or v22.x LTS
- **npm:** v9.x or higher

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy the sample environment variables:
```bash
cp .env.example .env
```
Default `.env`:
```
PORT=3000
NODE_ENV=production
```

### 3. Running the Development Server
```bash
npm run dev
```
The server will boot at:
- **Default Game:** [http://localhost:3000](http://localhost:3000)
- **Personalized Guest Link:** `http://localhost:3000?to=Nama+Tamu`  
  *(Example: `http://localhost:3000?to=Budi+%26+Keluarga`)*

### 4. Running Production Build
```bash
npm run build
npm start
```

---

## 🕹️ Controls Guide

| Action | Desktop (Keyboard & Mouse) | Mobile (Touchscreen) |
|---|---|---|
| **Move** | `W, A, S, D` or `Arrow Keys` | Left-hand Virtual Analog Joystick |
| **Jump** | `Spacebar` | Right-hand `🦘 JUMP` Button |
| **Interact / Open Modal** | `E` Key or Click Prompt | `✨ ACTION` Button or Tap Prompt |
| **Orbit Camera** | Left Mouse Drag (Right screen area) | 1-Finger Touch Drag (Right 65% screen) |
| **Zoom View** | Mouse Wheel Scroll | 2-Finger Touch Pinch-to-Zoom |
| **Sit / Stand in Hall** | Approach Chair $\rightarrow$ Press `[E]` | Approach Chair $\rightarrow$ Tap Action Button |
| **Mute / Unmute Audio** | Click `🔊` Button on Top HUD | Tap `🔊` Button on Top HUD |

---

## 🏛️ Project Directory Structure

```
.
├── server.ts                       # Express 5 TypeScript REST API server
├── index.html                      # HTML5 entry with metadata, OpenGraph, Three.js importmap
├── package.json                    # Project scripts and dependencies
├── tsconfig.json                   # TypeScript configuration
├── metadata.json                   # AI Studio applet metadata
├── PROJECT_AUDIT_REPORT.md         # Forensic project architecture & audit report
├── PROJECT_CHANGELOG.md            # Detailed changelog of Phase 13 transformations
├── FINAL_TEST_REPORT.md            # Comprehensive test matrix and verification results
├── docs/
│   └── screenshots/                # Runtime gameplay and mobile evidence screenshots
└── static/
    ├── css/
    │   └── style.css               # Responsive styles, HUD radar, retro buttons, pixel envelope
    ├── data/
    │   └── wishes.json             # Baseline guestbook seed data
    └── js/
        ├── app.js                  # Application bootstrapper and phase router
        ├── data/
        │   └── wedding.js          # Wedding story, playlist, couple profiles, and seating data
        ├── game/
        │   ├── AudioSystem.js      # Procedural Web Audio atmosphere & SFX engine
        │   └── Controls.js         # Virtual analog joystick & keyboard input listener
        ├── state/
        │   └── GameState.js        # Observer state manager & localStorage sync
        ├── svg/
        │   └── AvatarSVG.js        # Dynamic avatar SVG renderer for creator & HUD
        ├── three/
        │   ├── CameraController.js # Spherical orbit & smooth follow camera controller
        │   ├── CharacterController.js # Camera-relative physics & animation controller
        │   ├── InteractionSystem.js# 3D proximity POI marker & trigger system
        │   ├── TextureFactory.js   # Procedural wood, batik, and stone canvas textures
        │   └── ThreeScene.js       # Main outdoor WebGL scene manager & lighting
        ├── views/
        │   ├── CoverView.js        # Interactive envelope cover screen
        │   ├── AvatarView.js       # Avatar character creator view
        │   ├── MapView3D.js        # 3D outdoor garden exploration view with HUD radar
        │   ├── MainHallView.js     # Fully explorable 3D reception hall with seated guests
        │   └── ModalsView.js       # Modals router (RSVP, Profile, Gallery, Music, Food Court)
        └── world/
            ├── HachiGarden3D.js    # 3D procedural environment, pavilions, tea rows, pathways
            ├── TerrainManager.js   # Heightfield elevation and unified collision physics
            └── landmarks/          # 3D architectural landmarks (FoodCourt, Pavilion, Gallery, etc.)
```

---

## 🧪 Verification & Testing

Run TypeScript typechecking:
```bash
npm run lint
```

Run production compile verification:
```bash
npm run build
```

Verify backend health:
```bash
curl -s http://localhost:3000/health
```

---

## 🛠️ Troubleshooting

- **Audio does not play immediately on load:**  
  Modern browsers block automatic audio playback until the user interacts with the page. Sound un-mutes automatically upon the first tap, click, or keypress.
- **Camera feels too close or far:**  
  Use the mouse wheel or pinch two fingers to zoom smoothly between close-up ($0.55\times$) and wide panorama ($2.1\times$).
- **Cannot enter the Food Court:**  
  Ensure you take the paved stone path from the Central Promenade west towards Staircase 3. The approach walkway and landing platform (bordes) are fully paved and collision-free.
