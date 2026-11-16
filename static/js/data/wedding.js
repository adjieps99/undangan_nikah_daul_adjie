import { ASSET_MANIFEST } from '../config/assetManifest.js';

/**
 * Centralized Wedding Configuration & Data Model
 * Couple: Adjie & Daulika — The Garden of Us
 */

export const WEDDING_DATA = {
  couple: {
    groom: {
      name: 'Adjie',
      fullName: 'Adjie Prasatia Sakti',
      parents: 'Putra dari Bapak Muhammad Saleh & Ibu Sri Ratni',
      attireLabel: 'Beskap Hitam Klasik',
      avatarConfig: {
        gender: 'male',
        skinColor: '#F1C27D',
        hairStyle: 'short',
        hairColor: '#1A1A24',
        outfit: 'beskap_hitam',
        accessory: 'none'
      }
    },
    bride: {
      name: 'Daulika',
      fullName: 'Daulika Pratiwi',
      parents: 'Putri dari Bapak Achmad Agussalim & Ibu Ratu Rachmi Utari',
      attireLabel: 'Kebaya Putih Anggun',
      avatarConfig: {
        gender: 'female',
        skinColor: '#FFDBAC',
        hairStyle: 'long',
        hairColor: '#1A1A24',
        outfit: 'kebaya_putih',
        accessory: 'flower'
      }
    }
  },
  schedule: {
    event: {
      title: 'Akad Nikah & Ramah Tamah',
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
  playlist: ASSET_MANIFEST.audio.playlist,
  favorites: [
    { item: 'Mie Ayam Jamur Spesial', note: 'Hidangan hangat yang selalu jadi pilihan favorit saat makan bersama.' },
    { item: 'Es Kopi Susu Gula Aren', note: 'Teman setia saat mengobrol santai berjam-jam.' },
    { item: 'Pisang Goreng Keju Karamel', note: 'Cemilan manis kesukaan kami di sore hari.' }
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

export const SEAT_GRID = [
  { id: 'A1', row: 'A', group: 'Keluarga', label: 'Seat A1 (Keluarga)' },
  { id: 'A2', row: 'A', group: 'Keluarga', label: 'Seat A2 (Keluarga)' },
  { id: 'B1', row: 'B', group: 'Keluarga', label: 'Seat B1 (Keluarga)' },
  { id: 'B2', row: 'B', group: 'Keluarga', label: 'Seat B2 (Keluarga)' },
  { id: 'C1', row: 'C', group: 'Teman', label: 'Seat C1 (Teman)' },
  { id: 'C2', row: 'C', group: 'Teman', label: 'Seat C2 (Teman)' },
  { id: 'D1', row: 'D', group: 'Teman', label: 'Seat D1 (Teman)' },
  { id: 'D2', row: 'D', group: 'Teman', label: 'Seat D2 (Teman)' }
];

export function canSelectSeat(group, seat) {
  if (!seat || !group) return false;
  if (group === 'Keluarga') {
    return seat.row === 'A' || seat.row === 'B';
  }
  if (group === 'Teman') {
    return seat.row >= 'C' && seat.row <= 'H';
  }
  return false;
}
