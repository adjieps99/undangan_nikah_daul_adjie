import { createModal } from '../../ui/Modal.js';
import { generateAvatarSVG } from '../../svg/AvatarSVG.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createProfileModal() {
  const content = document.createElement('div');
  content.className = 'profile-modal-content';

  const groom = WEDDING_DATA.couple.groom;
  const bride = WEDDING_DATA.couple.bride;

  content.innerHTML = `
    <div class="couple-profiles-grid">
      <!-- Groom Profile -->
      <div class="profile-card">
        <div class="profile-avatar">${generateAvatarSVG(groom.avatarConfig, 80)}</div>
        <h4 class="profile-name">${groom.fullName}</h4>
        <p class="profile-parent">${groom.parents}</p>
      </div>

      <div class="couple-heart-divider">❤️</div>

      <!-- Bride Profile -->
      <div class="profile-card">
        <div class="profile-avatar">${generateAvatarSVG(bride.avatarConfig, 80)}</div>
        <h4 class="profile-name">${bride.fullName}</h4>
        <p class="profile-parent">${bride.parents}</p>
      </div>
    </div>

    <div class="love-quote-box">
      <p class="love-quote">${WEDDING_DATA.couple.quote}</p>
    </div>
  `;

  return createModal({
    id: 'profile-modal',
    title: '💍 PROFIL PENGANTIN',
    content: content
  });
}
