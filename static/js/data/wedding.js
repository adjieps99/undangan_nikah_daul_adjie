/**
 * Centralized Wedding Configuration & Data Model
 * Couple: Adjie & Daul Gembul
 */

export const WEDDING_DATA = {
  couple: {
    groom: {
      name: 'Adjie',
      fullName: 'Adjie Prasatia Sakti',
      parents: 'Putra tercinta dari Bpk. Muhammad Saleh & Ibu Sri Ratni',
      bio: 'Pencinta petualangan, secangkir kopi hangat, dan dunia imajinatif yang menemukan rumah sejatinya di senyuman Daulika.',
      avatarConfig: {
        gender: 'male',
        skinColor: '#F1C27D',
        hairStyle: 'short',
        hairColor: '#1A1A24',
        outfit: 'traditional_gold',
        accessory: 'none'
      }
    },
    bride: {
      name: 'Daulika',
      fullName: 'Daulika Pratiwi',
      parents: 'Putri tercinta dari Bpk. Achmad Agussalim & Ibu Ratu Rachmi Utari',
      bio: 'Pencinta bunga, kehangatan cerita kecil, dan kuliner lezat yang siap menapaki setiap lembar masa depan berdampingan dengan Adjie.',
      avatarConfig: {
        gender: 'female',
        skinColor: '#FFDBAC',
        hairStyle: 'bun',
        hairColor: '#1A1A24',
        outfit: 'dress',
        accessory: 'flower'
      }
    },
    quote: '"Sebuah taman kecil yang kami bangun bersama, dari tawa, cerita, dan doa yang ingin kami bagi denganmu."'
  },
  schedule: {
    event: {
      title: 'AKAD NIKAH & RAMAH TAMAH',
      date: 'Sabtu, 5 Desember 2026',
      time: '08.30 - 13.00 WIB',
      location: 'The Hachi Garden Ampera'
    }
  },
  venue: {
    name: 'The Hachi Garden Ampera',
    address: 'Jl. Ampera Raya No. 129, Pasar Minggu, Jakarta Selatan',
    mapsUrl: 'https://maps.app.goo.gl/JgJMgK3bS5mcspb26'
  },
  playlist: [
    { id: 1, title: 'Langit Merah Muda', artist: 'Afgan', duration: '3:45', isDefault: true },
    { id: 2, title: 'Rona Merah Langit', artist: 'Kunto Aji', duration: '4:12' },
    { id: 3, title: 'Ikat Aku Ditulang Belikatmu', artist: 'Sal Priadi', duration: '3:58' },
    { id: 4, title: 'Begini Begitu', artist: "Maliq & D'Essentials", duration: '3:35' },
    { id: 5, title: 'Just You', artist: 'Teddy Adhitya', duration: '3:48' }
  ],
  favorites: [
    { item: 'Mie Ayam Jamur Spesial', note: 'Menu kencan favorit kami yang selalu membawa kehangatan cerita.' },
    { item: 'Es Kopi Susu Gula Aren', note: 'Teman setia ngobrol berjam-jam tentang mimpi dan masa depan.' },
    { item: 'Pisang Goreng Keju Karamel', note: 'Cemilan manis wajib saat menikmati sore santai bersama.' }
  ],
  gift: {
    subtitle: 'Doa restu dari Anda adalah hadiah paling berharga bagi kami. Bagi keluarga dan sahabat yang ingin memberikan tanda kasih secara digital:',
    accounts: [
      { bank: 'Bank Saqu', number: '1098234712', holder: 'Adjie Prasatia Sakti' },
      { bank: 'Bank BCA', number: '8720194812', holder: 'Daulika Pratiwi' }
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
