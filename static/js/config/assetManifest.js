/**
 * Centralized Asset Manifest — Single Source of Truth
 * Couple: ADJIE & DAULIKA — THE GARDEN OF US
 * Venue: The Hachi Garden Ampera (5 Desember 2026)
 *
 * Every runtime audio track, voice greeting, photo gallery folder,
 * couple/cover optional photo, and rigged 3D character GLB model
 * resolves its URL and exact filename from this manifest.
 */

export const ASSET_MANIFEST = Object.freeze({
  audio: Object.freeze({
    defaultTrackId: 1,
    defaultTrackFilename: '01_langit_merah_muda.mp3',
    defaultTrackUrl: '/static/audio/tracks/01_langit_merah_muda.mp3',
    tracksFolder: 'static/audio/tracks',
    voiceGreeting: Object.freeze({
      filename: 'couple_voice_greeting.mp3',
      folder: 'static/audio',
      url: '/static/audio/couple_voice_greeting.mp3',
      title: 'Pesan Suara Adjie & Daulika'
    }),
    playlist: Object.freeze([
      Object.freeze({
        id: 1,
        title: 'Langit Merah Muda',
        artist: 'Afgan',
        filename: '01_langit_merah_muda.mp3',
        audioUrl: '/static/audio/tracks/01_langit_merah_muda.mp3',
        isDefault: true
      }),
      Object.freeze({
        id: 2,
        title: 'Rona Merah Langit',
        artist: 'Kunto Aji',
        filename: '02_rona_merah_langit.mp3',
        audioUrl: '/static/audio/tracks/02_rona_merah_langit.mp3',
        isDefault: false
      }),
      Object.freeze({
        id: 3,
        title: 'Ikat Aku Ditulang Belikatmu',
        artist: 'Sal Priadi',
        filename: '03_ikat_aku_ditulang_belikatmu.mp3',
        audioUrl: '/static/audio/tracks/03_ikat_aku_ditulang_belikatmu.mp3',
        isDefault: false
      }),
      Object.freeze({
        id: 4,
        title: 'Begini Begitu',
        artist: "Maliq & D'Essentials",
        filename: '04_begini_begitu.mp3',
        audioUrl: '/static/audio/tracks/04_begini_begitu.mp3',
        isDefault: false
      }),
      Object.freeze({
        id: 5,
        title: 'Just You',
        artist: 'Teddy Aditya',
        filename: '05_just_you.mp3',
        audioUrl: '/static/audio/tracks/05_just_you.mp3',
        isDefault: false
      })
    ])
  }),

  images: Object.freeze({
    gallery: Object.freeze({
      apiEndpoint: '/api/gallery',
      folder: 'static/images/gallery',
      publicBaseUrl: '/static/images/gallery/',
      metadataFilename: 'gallery.json',
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif']
    }),
    couple: Object.freeze({
      folder: 'static/images/couple',
      groomPortrait: Object.freeze({
        filename: 'adjie.jpg',
        url: '/static/images/couple/adjie.jpg'
      }),
      bridePortrait: Object.freeze({
        filename: 'daulika.jpg',
        url: '/static/images/couple/daulika.jpg'
      }),
      couplePhoto: Object.freeze({
        filename: 'couple.jpg',
        url: '/static/images/couple/couple.jpg'
      })
    }),
    invitation: Object.freeze({
      folder: 'static/images/invitation',
      coverPhoto: Object.freeze({
        filename: 'cover_photo.jpg',
        url: '/static/images/invitation/cover_photo.jpg'
      })
    })
  }),

  models: Object.freeze({
    styleDirection: 'STYLE_C_SEMI_REALISTIC_CINEMATIC',
    charactersFolder: 'static/models/characters',
    characters: Object.freeze({
      guest: Object.freeze({
        filename: 'guest.glb',
        url: '/static/models/characters/guest.glb',
        targetHeightMeters: 2.34,
        styleCRealisticHeightMeters: 1.72,
        canonicalGlbSitHeightMeters: 0.45
      }),
      groom: Object.freeze({
        filename: 'groom.glb',
        url: '/static/models/characters/groom.glb',
        targetHeightMeters: 2.34,
        styleCRealisticHeightMeters: 1.76,
        canonicalGlbSitHeightMeters: 0.45,
        identity: 'Adjie Prasatia Sakti',
        attire: 'beskap_hitam'
      }),
      bride: Object.freeze({
        filename: 'bride.glb',
        url: '/static/models/characters/bride.glb',
        targetHeightMeters: 2.28,
        styleCRealisticHeightMeters: 1.65,
        canonicalGlbSitHeightMeters: 0.45,
        identity: 'Daulika Pratiwi',
        attire: 'kebaya_putih',
        hijab: false
      })
    }),
    npcArchetypes: Object.freeze([
      Object.freeze({ id: 'npc_01', filename: 'guest_male_beskap.glb', roleLabel: 'Keluarga VIP Pria', heightMeters: 1.75 }),
      Object.freeze({ id: 'npc_02', filename: 'guest_female_hijab_kebaya.glb', roleLabel: 'Keluarga VIP Wanita (Hijab)', heightMeters: 1.63 }),
      Object.freeze({ id: 'npc_03', filename: 'guest_male_suit.glb', roleLabel: 'Sahabat Pria (Setelan Jas)', heightMeters: 1.77 }),
      Object.freeze({ id: 'npc_04', filename: 'guest_female_dress.glb', roleLabel: 'Sahabat Wanita (Gaun)', heightMeters: 1.66 }),
      Object.freeze({ id: 'npc_05', filename: 'guest_male_batik_peci.glb', roleLabel: 'Tamu Pria (Batik & Peci)', heightMeters: 1.73 }),
      Object.freeze({ id: 'npc_06', filename: 'guest_female_kebaya_bun.glb', roleLabel: 'Tamu Wanita (Kebaya Sanggul)', heightMeters: 1.64 })
    ]),
    animationClips: Object.freeze({
      idle: ['idle', 'Idle', 'standing_idle'],
      walking: ['walking', 'walk', 'Walk', 'Walking'],
      turning: ['turning', 'turn', 'Turn'],
      sitting: ['sitting', 'sit', 'Sit', 'Sitting'],
      standing: ['standing', 'stand', 'StandUp'],
      greeting: ['greeting', 'greet', 'wave', 'Wave', 'Greeting']
    })
  })
});

export function getTrackFilename(track) {
  if (!track) return '';
  if (track.filename) return track.filename;
  if (track.audioUrl) {
    const parts = String(track.audioUrl).split('/');
    return parts[parts.length - 1] || '';
  }
  return '';
}

let cachedAssetStatusPromise = null;

/**
 * Fetches server-verified filesystem availability for audio, couple photos, and GLB models.
 * Returns null gracefully in offline / test contexts.
 */
export async function fetchAssetStatus(forceRefresh = false) {
  if (typeof fetch !== 'function') return null;
  if (!cachedAssetStatusPromise || forceRefresh) {
    cachedAssetStatusPromise = fetch('/api/assets/status', { cache: 'no-store' })
      .then((res) => (res && res.ok ? res.json() : null))
      .catch(() => null);
  }
  return cachedAssetStatusPromise;
}

