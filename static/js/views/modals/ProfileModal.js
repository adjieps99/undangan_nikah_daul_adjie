import { createModal } from '../../ui/Modal.js';
import { generateAvatarSVG } from '../../svg/AvatarSVG.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createProfileModal() {
  const content = document.createElement('div');
  content.className = 'profile-modal-content';

  const groom = WEDDING_DATA.couple.groom;
  const bride = WEDDING_DATA.couple.bride;

  // Custom configurations for avatar previews matching wedding attire
  // Groom in black beskap, Bride in white kebaya with natural hair
  const groomAvatarConfig = {
    gender: 'male',
    skinColor: '#F1C27D',
    hairStyle: 'short',
    hairColor: '#1A1A24',
    outfit: 'tuxedo', // Rendered with black beskap styling
    accessory: 'none'
  };

  const brideAvatarConfig = {
    gender: 'female',
    skinColor: '#FFDBAC',
    hairStyle: 'long', // Natural hair
    hairColor: '#1A1A24',
    outfit: 'dress', // White kebaya & dress
    accessory: 'flower'
  };

  content.innerHTML = `
    <!-- Top Date Banner -->
    <div style="text-align: center; margin-bottom: 16px; padding: 8px 14px; background: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 8px;">
      <span style="font-size: 11px; letter-spacing: 1.5px; color: var(--color-gold); font-weight: bold;">
        🗓️ HARI BAHAGIA KAMI: SABTU, 5 DESEMBER 2026
      </span>
    </div>

    <!-- Couple Profiles Grid (Groom in Black Beskap, Bride in White Kebaya) -->
    <div class="couple-profiles-grid" style="display: flex; gap: 14px; align-items: stretch; justify-content: center; flex-wrap: wrap;">
      <!-- Groom Profile -->
      <div class="profile-card" style="
        flex: 1;
        min-width: 200px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(212, 175, 55, 0.3);
        border-radius: 10px;
        padding: 16px 12px;
        text-align: center;
      ">
        <div class="profile-avatar" style="margin-bottom: 8px;">
          ${generateAvatarSVG(groomAvatarConfig, 80)}
        </div>
        <div style="font-size: 9px; letter-spacing: 1px; color: var(--color-gold); font-weight: bold; margin-bottom: 2px;">
          MEMPELAI PRIA
        </div>
        <h4 class="profile-name" style="font-size: 14px; color: #fff; margin-bottom: 4px;">${groom.fullName}</h4>
        <div style="font-size: 10px; color: #ffbe97; font-weight: 600; margin-bottom: 8px; line-height: 1.35;">
          ${groom.parents}
        </div>
        <div style="font-size: 9px; color: #aaa; margin-bottom: 6px;">
          👔 Balutan Beskap Hitam Klasik
        </div>
        <p style="font-size: 11px; color: #e8e0d5; line-height: 1.45; font-style: italic;">
          "${groom.bio}"
        </p>
      </div>

      <!-- Bride Profile -->
      <div class="profile-card" style="
        flex: 1;
        min-width: 200px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(212, 175, 55, 0.3);
        border-radius: 10px;
        padding: 16px 12px;
        text-align: center;
      ">
        <div class="profile-avatar" style="margin-bottom: 8px;">
          ${generateAvatarSVG(brideAvatarConfig, 80)}
        </div>
        <div style="font-size: 9px; letter-spacing: 1px; color: #ffb6c1; font-weight: bold; margin-bottom: 2px;">
          MEMPELAI WANITA
        </div>
        <h4 class="profile-name" style="font-size: 14px; color: #fff; margin-bottom: 4px;">${bride.fullName}</h4>
        <div style="font-size: 10px; color: #ffbe97; font-weight: 600; margin-bottom: 8px; line-height: 1.35;">
          ${bride.parents}
        </div>
        <div style="font-size: 9px; color: #aaa; margin-bottom: 6px;">
          👗 Kebaya Putih Anggun & Rambut Terurai
        </div>
        <p style="font-size: 11px; color: #e8e0d5; line-height: 1.45; font-style: italic;">
          "${bride.bio}"
        </p>
      </div>
    </div>

    <!-- Personal Quote Box -->
    <div class="love-quote-box" style="
      margin-top: 16px;
      padding: 12px 14px;
      background: rgba(212, 175, 55, 0.08);
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 8px;
      text-align: center;
    ">
      <p class="love-quote" style="font-family: var(--font-serif); font-size: 12px; font-style: italic; color: #ffecd2; margin: 0; line-height: 1.5;">
        ${WEDDING_DATA.couple.quote}
      </p>
    </div>
  `;

  return createModal({
    id: 'profile-modal',
    title: '💍 PROFIL KAMI',
    content: content
  });
}
