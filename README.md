# 🎮 The Wedding Adventure - Digital RPG Invitation
### Wedding of Adjie & Daul Gembul

A retro 2D RPG digital wedding invitation built with a **Flask** backend and a **Vanilla ES6 Modular JavaScript** engine featuring dynamic SVG avatar customization, 60fps Canvas 2D Garden Map exploration, dual Desktop/Mobile Virtual Joystick controls, and interactive wedding modals.

---

## 🚀 Quick Start (Anaconda / Python Environment)

### Prerequisites
- Python 3.8 or higher (Anaconda / Standard Python)

### 1. Installation
Clone or open the repository folder in your terminal:
```bash
cd d:\Antigravity\Project\Random\undangan_antigravity
pip install -r requirements.txt
```

### 2. Running the Server
Launch the Flask development server:
```bash
python app.py
```

Open your browser and navigate to:
- **Default View**: `http://localhost:5000`
- **Personalized Guest Link**: `http://localhost:5000?to=Nama+Tamu`  
  *(Example: `http://localhost:5000?to=Budi+%26+Keluarga`)*

---

## 🛠️ Customization Guide (`static/js/data/wedding.js`)

All wedding couple details, event schedules, venue location, dress code, bank accounts, and seating rules are centralized inside `static/js/data/wedding.js`.

### Updating Couple Info & Names
Open `static/js/data/wedding.js` and edit:
```javascript
export const WEDDING_DATA = {
  couple: {
    groom: {
      name: 'Adjie',
      fullName: 'Adjie S. Prasetyo',
      parents: 'Putra dari Bpk. Bambang & Ibu Sri'
    },
    bride: {
      name: 'Daul Gembul',
      fullName: 'Daul Gembul Permata',
      parents: 'Putri dari Bpk. Rahmat & Ibu Endang'
    }
  }
};
```

### Updating Bank Accounts for Digital Gifts
Update the `gift` object inside `wedding.js`:
```javascript
gift: {
  subtitle: 'Doa restu Anda adalah hadiah terindah...',
  accounts: [
    { bank: 'Bank Saqu', number: '1234 5678 9012', holder: 'Adjie S. Prasetyo' },
    { bank: 'Bank BCA', number: '9876 5432 10', holder: 'Daul Gembul Permata' }
  ]
}
```

### Updating Schedule & Venue Map
```javascript
schedule: {
  akad: { time: 'Sabtu, 10 Oktober 2026 | 08.00 - 10.00 WIB', location: 'Gazebo Utama' },
  resepsi: { time: 'Sabtu, 10 Oktober 2026 | 11.00 - 14.00 WIB', location: 'Grand Lawn' }
},
venue: {
  name: 'Hachi Garden Villa & Lawn',
  address: 'Jl. Garden Paradise No. 8, Jakarta Selatan',
  mapsUrl: 'https://maps.google.com'
}
```

---

## 📁 Project Architecture

```
undangan_antigravity/
├── app.py                      # Single-origin Flask server
├── requirements.txt            # Python dependencies (Flask)
├── README.md                   # Setup & Customization Guide
├── templates/
│   └── index.html              # HTML5 entry with Google Font preloads & ES6 module mount
└── static/
    ├── css/
    │   └── style.css           # Retro pixel theme, animations & responsive rules
    ├── js/
    │   ├── app.js              # Application bootstrapper & phase router
    │   ├── data/
    │   │   └── wedding.js      # Centralized wedding data & seating validation rules
    │   ├── state/
    │   │   └── GameState.js    # Observable state manager & LocalStorage handler
    │   ├── game/
    │   │   ├── MapEngine.js    # 60fps Canvas render loop, camera, collision bounds
    │   │   ├── Player.js       # Player entity, movement vector & SVG avatar sprite
    │   │   └── Controls.js     # Keyboard WASD + Mobile Virtual Touch D-Pad
    │   ├── svg/
    │   │   ├── AvatarSVG.js    # Layered SVG character design system
    │   │   └── EnvironmentSVG.js # Reusable SVG environment props
    │   ├── ui/
    │   │   ├── PixelBox.js     # DOM pixel container frame
    │   │   ├── RetroButton.js  # DOM retro pixel button
    │   │   └── Modal.js        # Reusable modal container with blur backdrop
    │   └── views/
    │       ├── CoverView.js    # Game opening cover with interactive envelope
    │       ├── AvatarView.js   # Character creator UI with idle bounce animation
    │       ├── MapView.js      # 2D Map container with HUD & POI prompts
    │       ├── ModalsView.js   # Modal dispatcher
    │       └── modals/
    │           ├── ProfileModal.js
    │           ├── LocationModal.js
    │           ├── RSVPModal.js
    │           ├── WishesModal.js
    │           └── GiftModal.js
    └── data/
        └── wishes.json         # Initial guestbook wishes seed data
```

---

## 🎮 Key Features & Guest Journey

1. **Cover Screen**: Retro game opening feel with clickable pixel envelope flap animation and guest greeting derived from `?to=GuestName`.
2. **Avatar Creator**: Live 2D SVG pixel character customizer with skin tone palette, hair styles/colors, traditional Batik/Kebaya outfits, accessories, and randomize preset button.
3. **2D RPG Garden Map**: 60fps Canvas exploration map featuring camera tracking, boundary collision, Hachi Garden wedding landmarks, and floating flower petals.
4. **Interactive POIs & Modals**:
   - **Gazebo**: Couple Profile (*Adjie & Daul Gembul*)
   - **Info Board**: Akad & Resepsi schedule timeline and Google Maps link
   - **RSVP Desk**: Attendance confirmation, party count, and `canSelectSeat()` seat validation
   - **Wishing Tree**: Guestbook wishes feed and instant submission
   - **Gift Chest**: Bank account copy-to-clipboard buttons and QRIS digital angpao
