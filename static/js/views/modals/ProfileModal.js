import { createModal } from '../../ui/Modal.js';
import { generateAvatarSVG } from '../../svg/AvatarSVG.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createProfileModal() {
  const content = document.createElement('div');
  content.className = 'profile-modal-content';

  const groom = WEDDING_DATA.couple.groom;
  const bride = WEDDING_DATA.couple.bride;
  const storyList = WEDDING_DATA.story || [];

  content.innerHTML = `
    <!-- Wedding Date Banner -->
    <div style="text-align: center; margin-bottom: 14px; padding: 6px 12px; background: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 8px;">
      <span style="font-size: 11px; letter-spacing: 1px; color: var(--color-gold); font-weight: bold;">
        🗓️ THE WEDDING DAY: SABTU, 28 NOVEMBER 2026
      </span>
    </div>

    <!-- Couple Profiles Grid -->
    <div class="couple-profiles-grid">
      <!-- Groom Profile -->
      <div class="profile-card">
        <div class="profile-avatar">${generateAvatarSVG(groom.avatarConfig, 80)}</div>
        <h4 class="profile-name">${groom.fullName}</h4>
        <p class="profile-parent" style="font-size: 11px; margin-bottom: 6px; color: #d4af37;">${groom.parents}</p>
        <p style="font-size: 11px; opacity: 0.85; line-height: 1.4; font-style: italic;">"${groom.bio}"</p>
      </div>

      <div class="couple-heart-divider">❤️</div>

      <!-- Bride Profile -->
      <div class="profile-card">
        <div class="profile-avatar">${generateAvatarSVG(bride.avatarConfig, 80)}</div>
        <h4 class="profile-name">${bride.fullName}</h4>
        <p class="profile-parent" style="font-size: 11px; margin-bottom: 6px; color: #d4af37;">${bride.parents}</p>
        <p style="font-size: 11px; opacity: 0.85; line-height: 1.4; font-style: italic;">"${bride.bio}"</p>
      </div>
    </div>

    <!-- Love Story Timeline -->
    <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
      <h5 style="font-size: 12px; letter-spacing: 1px; color: var(--color-gold); text-align: center; margin-bottom: 10px;">
        ✨ KISAH PERJALANAN KAMI
      </h5>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${storyList.map(item => `
          <div style="display: flex; gap: 10px; align-items: flex-start; background: rgba(0,0,0,0.2); padding: 8px 10px; border-radius: 6px;">
            <span style="font-weight: bold; color: var(--color-gold); font-size: 12px; min-width: 38px;">${item.year}</span>
            <div style="font-size: 11px; line-height: 1.4;">
              <div style="font-weight: 600; color: #fff;">${item.title}</div>
              <div style="opacity: 0.8;">${item.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="love-quote-box" style="margin-top: 14px;">
      <p class="love-quote">${WEDDING_DATA.couple.quote}</p>
    </div>
  `;

  return createModal({
    id: 'profile-modal',
    title: '💍 PROFIL PENGANTIN — ADJIE & DAUL',
    content: content
  });
}
