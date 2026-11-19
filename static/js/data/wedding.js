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
  favoriteRestaurants: [
    {
      name: 'Martabak San Fransisco',
      ownerLabel: 'Favorit Daulika',
      city: 'Bandung',
      mustTry: ['Martabak Ayam', 'Martabak Sapi Telur Asin'],
      note: 'Kalau lagi pengen yang gurih, Martabak Ayam bisa jadi pilihan. Kuliner legend kota Bandung ini masih jadi Martabak terbaik versi Daul.',
      mapsUrl: 'https://share.google/67KGEGQkmw9iKx4Og'
    },
    {
      name: 'Sate Rembiga Ibu Sinnaseh',
      ownerLabel: 'Favorit Adjie',
      city: 'Lombok',
      mustTry: ['Sate Rembiga', 'Bebalung / Plecing'],
      note: 'Kalau sampai Lombok, yang satu ini jangan dilewatin. Sate Rembiga punya rasa pedas, manis, gurih yang khas banget. Kalau kuat makan pedes bisa coba plecingnya.',
      mapsUrl: 'https://share.google/P6ErOlDmWjit3enqu'
    },
    {
      name: 'Spesial Soto Boyolali (SSB) Hj Hesti',
      ownerLabel: 'Favorit Bersama',
      city: '',
      mustTry: ['Soto Ayam Kampung', 'Soto Daging', 'Gorengan sebagai pendamping'],
      note: 'Comfort food kami sepulang kantor. Dua mangkuk soto dan berbagai macam gorengan yang bikin kami selalu balik kesini.',
      mapsUrl: 'https://share.google/e4QDt7v5I2z7pVBXG'
    },
    {
      name: "Scarlett's House",
      ownerLabel: 'Tempat Favorit Lainnya',
      city: '',
      mustTry: ['Original Poured Tiramisu', 'Doenjang Carbonara'],
      note: 'Masih jadi favorite kami untuk makan sambil ngobrol lama. Interior dan brandingnya masih juara. Cuma sabar buat antri ya :)',
      mapsUrl: 'https://share.google/gzmH8GyjamnXyv1vr'
    },
    {
      name: 'Seafood Ayu',
      ownerLabel: 'Tempat Favorit Lainnya',
      city: '',
      mustTry: ['Ikan Kuwe Bakar', 'Cumi Goreng Tepung', 'Cumi Saus Padang'],
      note: 'Kalau pengen makan kenyang kami suka dateng kesini. Rekomendasi juga kalau mau makan bareng keluarga. Kami selalu order repeat ikan bakar & cumi tepungnya!',
      mapsUrl: 'https://share.google/XpDKQXd4eWo4Cg3cm'
    },
    {
      name: 'Rumah Makan Karya Bundo',
      ownerLabel: 'Khusus Buat Teman-Teman SERA',
      city: '',
      mustTry: ['Ayam Pop', 'Rendang', 'Sambal Ijo'],
      note: 'Kalau ini khusus buat teman-teman SERA. Habis jumatan, kalau bingung makan dimana, ya udah gas kesini aja. Biasanya jalan bareng naik JakLingko dari Grha SERA terus makan rame-rame.',
      mapsUrl: 'https://share.google/Wm3DYP8YlqDnqKVzN'
    }
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
