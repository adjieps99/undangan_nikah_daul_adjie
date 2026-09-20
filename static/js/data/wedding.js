/**
 * Centralized Wedding Configuration & Data Model
 * Couple: Adjie & Daul Gembul
 */

export const WEDDING_DATA = {
  couple: {
    groom: {
      name: 'Adjie',
      fullName: 'Adjie S. Prasetyo',
      parents: 'Putra dari Bpk. Bambang & Ibu Sri',
      avatarConfig: {
        gender: 'male',
        skinColor: '#F1C27D',
        hairStyle: 'cap',
        hairColor: '#1A1A24',
        outfit: 'traditional_gold',
        accessory: 'none'
      }
    },
    bride: {
      name: 'Daul Gembul',
      fullName: 'Daul Gembul Permata',
      parents: 'Putri dari Bpk. Rahmat & Ibu Endang',
      avatarConfig: {
        gender: 'female',
        skinColor: '#FFDBAC',
        hairStyle: 'hijab',
        hairColor: '#1A1A24',
        outfit: 'traditional_gold',
        accessory: 'crown'
      }
    },
    quote: '"Dua jiwa, satu takdir. Kami mengundang Anda menjadi saksi dimulainya petualangan hidup baru kami."'
  },
  schedule: {
    akad: {
      title: 'AKAD NIKAH',
      time: 'Sabtu, 10 Oktober 2026 | 08.00 - 10.00 WIB',
      location: 'Gazebo Utama Hachi Garden'
    },
    resepsi: {
      title: 'RESEPSI PERNIKAHAN',
      time: 'Sabtu, 10 Oktober 2026 | 11.00 - 14.00 WIB',
      location: 'Grand Lawn Hachi Garden'
    }
  },
  venue: {
    name: 'Hachi Garden Villa & Lawn',
    address: 'Jl. Garden Paradise No. 8, Jakarta Selatan',
    mapsUrl: 'https://maps.google.com'
  },
  dressCode: {
    title: 'DRESS CODE',
    tags: ['Batik Formal', 'Traditional Gold', 'Earth Tone']
  },
  gift: {
    subtitle: 'Doa restu Anda adalah hadiah terindah. Bagi yang ingin memberikan tanda kasih secara digital:',
    accounts: [
      { bank: 'Bank Saqu', number: '[Nomor Rekening Bank Saqu]', holder: 'Adjie S. Prasetyo' },
      { bank: 'Bank BCA', number: '[Nomor Rekening Bank BCA]', holder: 'Daul Gembul Permata' }
    ],
    qrisText: 'SCAN VIA GOPAY / OVO / DANA / QRIS'
  }
};

/**
 * Seating Grid Layout Definitions
 * Rows A-B: Family (Keluarga)
 * Rows C-H: Friends (Teman / Sahabat)
 */
export const SEAT_GRID = [
  // Family Rows (A-B)
  { id: 'A1', row: 'A', group: 'Keluarga', label: 'Seat A1 (Keluarga)' },
  { id: 'A2', row: 'A', group: 'Keluarga', label: 'Seat A2 (Keluarga)' },
  { id: 'B1', row: 'B', group: 'Keluarga', label: 'Seat B1 (Keluarga)' },
  { id: 'B2', row: 'B', group: 'Keluarga', label: 'Seat B2 (Keluarga)' },
  // Friends Rows (C-H)
  { id: 'C1', row: 'C', group: 'Teman', label: 'Seat C1 (Teman)' },
  { id: 'C2', row: 'C', group: 'Teman', label: 'Seat C2 (Teman)' },
  { id: 'D1', row: 'D', group: 'Teman', label: 'Seat D1 (Teman)' },
  { id: 'D2', row: 'D', group: 'Teman', label: 'Seat D2 (Teman)' }
];

/**
 * Strict Seat Selection Validation Logic
 * @param {string} group - Guest Group ('Keluarga' | 'Teman')
 * @param {object} seat - Seat Object from SEAT_GRID
 * @returns {boolean} - true if valid selection
 */
export function canSelectSeat(group, seat) {
  if (!seat || !group) return false;
  if (group === 'Keluarga') {
    return seat.row === 'A' || seat.row === 'B';
  } else if (group === 'Teman') {
    return seat.row >= 'C' && seat.row <= 'H';
  }
  return false;
}
