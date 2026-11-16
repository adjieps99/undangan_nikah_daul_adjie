/**
 * AvatarSVG - Modular Character Design System & SVG Layer Generator
 * Grid Scale: 32x32 Pixel Art Grid
 */

export const AVATAR_OPTIONS = {
  skinColors: [
    { label: 'Kuning Langsat', value: '#F1C27D' },
    { label: 'Sawo Matang', value: '#E0AC69' },
    { label: 'Cerah Natural', value: '#FFDBAC' },
    { label: 'Sawo Gelap', value: '#8D5524' }
  ],
  hairStyles: [
    { id: 'short', label: 'Pendek Rapi' },
    { id: 'long', label: 'Panjang Terurai' },
    { id: 'bun', label: 'Sanggul Simpel' },
    { id: 'wavy', label: 'Berombak' },
    { id: 'hijab', label: 'Hijab Anggun' },
    { id: 'cap', label: 'Peci Hitam' }
  ],
  hairColors: [
    { label: 'Hitam Alami', value: '#1A1A24' },
    { label: 'Cokelat Tua', value: '#3D2314' },
    { label: 'Cokelat Keemasan', value: '#C68B59' },
    { label: 'Merah Anggur', value: '#6B1D2F' },
    { label: 'Perak Lembut', value: '#EAEAEA' }
  ],
  outfits: [
    { id: 'traditional_gold', label: 'Batik Emas' },
    { id: 'traditional_maroon', label: 'Kebaya Marun' },
    { id: 'beskap_hitam', label: 'Beskap Hitam' },
    { id: 'kebaya_putih', label: 'Kebaya Putih' }
  ],
  accessories: [
    { id: 'none', label: 'Tanpa Aksesoris' },
    { id: 'glasses', label: 'Kacamata' },
    { id: 'flower', label: 'Bunga Melati' },
    { id: 'crown', label: 'Mahkota Kecil' }
  ]
};

export function generateAvatarSVG(config = {}, size = 120) {
  const skin = config.skinColor || '#F1C27D';
  const hairColor = config.hairColor || '#1A1A24';
  const hairStyle = config.hairStyle || 'short';
  const outfit = config.outfit || 'traditional_gold';
  const accessory = config.accessory || 'none';
  const expression = config.expression || 'happy';

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="shape-rendering: crispEdges; image-rendering: pixelated;">
      <!-- 1. BASE SHADOW -->
      <ellipse cx="16" cy="30" rx="10" ry="2" fill="rgba(0,0,0,0.35)" />

      <!-- 2. LEGS & SHOES -->
      <rect x="11" y="24" width="4" height="6" fill="#18181f" />
      <rect x="17" y="24" width="4" height="6" fill="#18181f" />
      <rect x="10" y="28" width="5" height="2" fill="#0d0d11" />
      <rect x="17" y="28" width="5" height="2" fill="#0d0d11" />

      <!-- 3. OUTFIT LAYER -->
      ${renderOutfitLayer(outfit)}

      <!-- 4. SKIN & HEAD LAYER -->
      <!-- Neck -->
      <rect x="14" y="14" width="4" height="3" fill="${skin}" />
      <!-- Head Base -->
      <rect x="9" y="5" width="14" height="10" fill="${skin}" />
      <!-- Ears -->
      <rect x="7" y="9" width="2" height="3" fill="${skin}" />
      <rect x="23" y="9" width="2" height="3" fill="${skin}" />

      <!-- 5. EXPRESSIONS LAYER -->
      ${renderExpressionLayer(expression)}

      <!-- 6. HAIR LAYER -->
      ${renderHairLayer(hairStyle, hairColor, skin)}

      <!-- 7. ACCESSORY LAYER -->
      ${renderAccessoryLayer(accessory)}
    </svg>
  `;
}

function renderOutfitLayer(outfit) {
  switch (outfit) {
    case 'traditional_maroon':
      return `
        <rect x="9" y="15" width="14" height="10" fill="#8B0000" />
        <rect x="11" y="15" width="10" height="10" fill="#D4AF37" />
        <rect x="13" y="15" width="6" height="10" fill="#8B0000" />
        <rect x="7" y="16" width="3" height="7" fill="#8B0000" />
        <rect x="22" y="16" width="3" height="7" fill="#8B0000" />
      `;
    case 'beskap_hitam':
    case 'tuxedo':
      return `
        <rect x="9" y="15" width="14" height="10" fill="#15151B" />
        <rect x="13" y="14" width="6" height="2" fill="#1E1E26" />
        <rect x="15" y="16" width="2" height="8" fill="#23232D" />
        <rect x="15" y="17" width="1" height="1" fill="#D4AF37" />
        <rect x="15" y="20" width="1" height="1" fill="#D4AF37" />
        <rect x="16" y="18" width="4" height="1" fill="#D4AF37" />
        <rect x="19" y="19" width="1" height="2" fill="#D4AF37" />
        <rect x="7" y="16" width="3" height="7" fill="#15151B" />
        <rect x="22" y="16" width="3" height="7" fill="#15151B" />
      `;
    case 'kebaya_putih':
    case 'dress':
      return `
        <rect x="9" y="15" width="14" height="9" fill="#FAF8F3" />
        <rect x="13" y="15" width="6" height="9" fill="#EFEAE0" />
        <rect x="15" y="16" width="2" height="6" fill="#FFFFFF" />
        <rect x="7" y="16" width="3" height="7" fill="#F4F0E8" />
        <rect x="22" y="16" width="3" height="7" fill="#F4F0E8" />
        <rect x="9" y="24" width="14" height="5" fill="#5A3A24" />
        <rect x="11" y="25" width="2" height="3" fill="#C9A255" />
        <rect x="15" y="25" width="2" height="3" fill="#C9A255" />
        <rect x="19" y="25" width="2" height="3" fill="#C9A255" />
      `;
    case 'traditional_gold':
    default:
      return `
        <rect x="9" y="15" width="14" height="10" fill="#D4AF37" />
        <rect x="10" y="17" width="12" height="2" fill="#B8860B" />
        <rect x="10" y="21" width="12" height="2" fill="#B8860B" />
        <rect x="7" y="16" width="3" height="7" fill="#D4AF37" />
        <rect x="22" y="16" width="3" height="7" fill="#D4AF37" />
      `;
  }
}

function renderExpressionLayer(expression) {
  // Eyes
  const eyesNormal = `
    <rect x="12" y="9" width="2" height="2" fill="#000000" />
    <rect x="18" y="9" width="2" height="2" fill="#000000" />
    <rect x="13" y="9" width="1" height="1" fill="#FFFFFF" />
    <rect x="19" y="9" width="1" height="1" fill="#FFFFFF" />
  `;

  const eyesWink = `
    <rect x="12" y="9" width="3" height="1" fill="#000000" />
    <rect x="18" y="9" width="2" height="2" fill="#000000" />
    <rect x="19" y="9" width="1" height="1" fill="#FFFFFF" />
  `;

  // Mouth
  const mouthHappy = `<rect x="14" y="12" width="4" height="1" fill="#9B2226" />`;

  return `
    ${expression === 'wink' ? eyesWink : eyesNormal}
    ${mouthHappy}
    <!-- Blush -->
    <rect x="10" y="11" width="2" height="1" fill="#E56B6F" opacity="0.6" />
    <rect x="20" y="11" width="2" height="1" fill="#E56B6F" opacity="0.6" />
  `;
}

function renderHairLayer(style, color, skin) {
  switch (style) {
    case 'long':
      return `
        <rect x="8" y="3" width="16" height="4" fill="${color}" />
        <rect x="7" y="7" width="3" height="11" fill="${color}" />
        <rect x="22" y="7" width="3" height="11" fill="${color}" />
        <rect x="11" y="4" width="10" height="2" fill="${color}" />
      `;
    case 'bun':
      return `
        <rect x="12" y="1" width="8" height="4" fill="${color}" />
        <rect x="8" y="4" width="16" height="4" fill="${color}" />
        <rect x="7" y="7" width="3" height="4" fill="${color}" />
        <rect x="22" y="7" width="3" height="4" fill="${color}" />
      `;
    case 'wavy':
      return `
        <rect x="8" y="3" width="16" height="4" fill="${color}" />
        <rect x="6" y="6" width="4" height="10" fill="${color}" />
        <rect x="22" y="6" width="3" height="5" fill="${color}" />
      `;
    case 'hijab':
      return `
        <rect x="7" y="3" width="18" height="5" fill="#E2E8F0" />
        <rect x="6" y="7" width="4" height="12" fill="#E2E8F0" />
        <rect x="22" y="7" width="4" height="12" fill="#E2E8F0" />
        <rect x="7" y="15" width="18" height="4" fill="#CBD5E1" />
      `;
    case 'cap':
      return `
        <rect x="8" y="2" width="16" height="4" fill="#1C1C24" />
        <rect x="7" y="5" width="18" height="2" fill="#D4AF37" />
      `;
    case 'short':
    default:
      return `
        <rect x="8" y="3" width="16" height="4" fill="${color}" />
        <rect x="7" y="6" width="3" height="4" fill="${color}" />
        <rect x="22" y="6" width="3" height="4" fill="${color}" />
        <rect x="10" y="4" width="12" height="2" fill="${color}" />
      `;
  }
}

function renderAccessoryLayer(accessory) {
  switch (accessory) {
    case 'glasses':
      return `
        <rect x="11" y="8" width="4" height="3" fill="none" stroke="#000" stroke-width="1" />
        <rect x="17" y="8" width="4" height="3" fill="none" stroke="#000" stroke-width="1" />
        <rect x="15" y="9" width="2" height="1" fill="#000" />
      `;
    case 'flower':
      return `
        <rect x="7" y="4" width="3" height="3" fill="#FFFFFF" />
        <rect x="8" y="5" width="1" height="1" fill="#FFB703" />
      `;
    case 'crown':
      return `
        <polygon points="10,4 12,1 16,3 20,1 22,4" fill="#D4AF37" />
        <rect x="10" y="4" width="12" height="1" fill="#FFD700" />
      `;
    case 'none':
    default:
      return '';
  }
}
