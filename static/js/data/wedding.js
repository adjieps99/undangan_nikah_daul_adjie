/**
 * Centralized Wedding Configuration & Data Model
 * Couple: Adjie & Daul Gembul
 */

export const WEDDING_DATA = {
  couple: {
    groom: {
      name: 'Adjie',
      fullName: 'Adjie S. Prasetyo',
      parents: 'Putra tercinta dari Bpk. Bambang & Ibu Sri',
      bio: 'Pencinta teknologi, kopi senja, dan petualangan alam yang kini menemukan pelabuhan hatinya.',
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
      name: 'Daul',
      fullName: 'Daul Gembul Permata',
      parents: 'Putri tercinta dari Bpk. Rahmat & Ibu Endang',
      bio: 'Penyuka seni, kebun bunga, dan kuliner lezat yang siap menapaki babak baru bersama Adjie.',
      avatarConfig: {
        gender: 'female',
        skinColor: '#FFDBAC',
        hairStyle: 'hijab',
        hairColor: '#1A1A24',
        outfit: 'traditional_gold',
        accessory: 'flower'
      }
    },
    quote: '"Dua jiwa, satu takdir. Di bawah langit senja Hachi Garden, kami memulai kisah abadi kami."'
  },
  schedule: {
    akad: {
      title: 'AKAD NIKAH',
      time: 'Sabtu, 28 November 2026 | 08.00 - 10.00 WIB',
      location: 'The Hachi Garden Pergola'
    },
    resepsi: {
      title: 'RESEPSI PERNIKAHAN',
      time: 'Sabtu, 28 November 2026 | 11.00 - 14.00 WIB',
      location: 'The Hachi Garden Restaurant'
    }
  },
  venue: {
    name: 'The Hachi Garden Restaurant',
    address: 'Jl. Kaliurang Km 9, Sleman, Yogyakarta',
    mapsUrl: 'https://maps.google.com'
  },
  story: [
    { year: '2022', title: 'Pertemuan Pertama', desc: 'Pertama kali bertegur sapa di sebuah kafe sederhana saat senja.' },
    { year: '2024', title: 'Perjalanan & Cerita', desc: 'Menjelajahi kebun teh, menikmati mie ayam favorit, dan saling menguatkan mimpi.' },
    { year: '2026', title: 'Menuju Pelaminan', desc: 'Mengikat janji suci di hadapan keluarga dan sahabat tercinta di Hachi Garden.' }
  ],
  playlist: [
    { title: 'Semenjak Ada Dirimu', artist: 'Yovie & Nuno', duration: '4:12' },
    { title: 'Teman Hidup', artist: 'Tulus', duration: '3:45' },
    { title: 'Hingga Tua Bersama', artist: 'Rizky Febian', duration: '4:02' },
    { title: 'Kisah Romantis', artist: 'Glenn Fredly', duration: '3:50' },
    { title: 'Janji Suci', artist: 'Yovie & Nuno', duration: '3:20' }
  ],
  favorites: [
    { item: 'Mie Ayam Jamur Spesial', note: 'Menu kencan pertama kami yang tak pernah gagal membawa senyum.' },
    { item: 'Es Kopi Susu Gula Aren', note: 'Teman setia ngobrol berjam-jam tentang masa depan.' },
    { item: 'Pisang Goreng Keju Karamel', note: 'Cemilan wajib saat menikmati udara sejuk kebun teh.' }
  ],
  dressCode: {
    title: 'DRESS CODE',
    tags: ['Batik Modern', 'Traditional Gold', 'Earth Tone & Pastel']
  },
  gift: {
    subtitle: 'Doa restu Anda adalah hadiah terindah. Bagi yang ingin memberikan tanda kasih secara digital:',
    accounts: [
      { bank: 'Bank Saqu', number: '1098234712', holder: 'Adjie S. Prasetyo' },
      { bank: 'Bank BCA', number: '8720194812', holder: 'Daul Gembul Permata' }
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
