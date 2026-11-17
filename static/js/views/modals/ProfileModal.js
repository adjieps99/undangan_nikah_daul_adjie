import { createModal } from '../../ui/Modal.js';
import { generateAvatarSVG } from '../../svg/AvatarSVG.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createProfileModal() {
  const content = document.createElement('div');
  content.className = 'profile-modal-content';

  const groom = WEDDING_DATA.couple.groom;
  const bride = WEDDING_DATA.couple.bride;

  // Groom in proper black beskap; Bride in elegant white kebaya with black natural hair (no hijab)
  const groomAvatarConfig = groom.avatarConfig || {
    gender: 'male',
    skinColor: '#F1C27D',
    hairStyle: 'short',
    hairColor: '#1A1A24',
    outfit: 'beskap_hitam',
    accessory: 'none'
  };

  const brideAvatarConfig = bride.avatarConfig || {
    gender: 'female',
    skinColor: '#FFDBAC',
    hairStyle: 'long',
    hairColor: '#1A1A24',
    outfit: 'kebaya_putih',
    accessory: 'flower'
  };

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 18px;">
      <p style="font-family: var(--font-sans); font-size: 13px; color: #ffbe97; margin: 0; line-height: 1.55;">
        Dengan rahmat dan ridho Allah SWT, izinkan kami memperkenalkan dua hati di hari bahagia ini.
      </p>
    </div>

    <div class="couple-profiles-grid" style="display: flex; gap: 14px; align-items: stretch; justify-content: center; flex-wrap: wrap;">
      <!-- Groom Profile -->
      <div class="profile-card" style="
        flex: 1;
        min-width: 200px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 10px;
        padding: 18px 14px;
        text-align: center;
      ">
        <div class="profile-avatar" style="margin-bottom: 10px;">
          ${generateAvatarSVG(groomAvatarConfig, 84)}
        </div>
        <div style="font-family: var(--font-sans); font-size: 10.5px; letter-spacing: 1.2px; color: var(--color-gold); font-weight: 700; margin-bottom: 6px;">
          MEMPELAI PRIA
        </div>
        <h4 class="profile-name" style="font-family: var(--font-serif); font-size: 17px; color: #fff; margin-bottom: 8px; line-height: 1.3;">${groom.fullName}</h4>
        <div style="font-family: var(--font-sans); font-size: 12.5px; color: #f5eedc; line-height: 1.55;">
          ${groom.parents}
        </div>
      </div>

      <!-- Bride Profile -->
      <div class="profile-card" style="
        flex: 1;
        min-width: 200px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 10px;
        padding: 18px 14px;
        text-align: center;
      ">
        <div class="profile-avatar" id="bride-avatar-slot" style="margin-bottom: 10px;">
          ${generateAvatarSVG(brideAvatarConfig, 84)}
        </div>
        <div style="font-family: var(--font-sans); font-size: 10.5px; letter-spacing: 1.2px; color: #ffb6c1; font-weight: 700; margin-bottom: 6px;">
          MEMPELAI WANITA
        </div>
        <h4 class="profile-name" style="font-family: var(--font-serif); font-size: 17px; color: #fff; margin-bottom: 8px; line-height: 1.3;">${bride.fullName}</h4>
        <div style="font-family: var(--font-sans); font-size: 12.5px; color: #f5eedc; line-height: 1.55;">
          ${bride.parents}
        </div>
      </div>
    </div>
  `;

  // Hydrate real portraits automatically if uploaded to /static/images/couple/
  import('../../config/assetManifest.js')
    .then(({ ASSET_MANIFEST, fetchAssetStatus }) =>
      fetchAssetStatus().then((status) => ({ ASSET_MANIFEST, status }))
    )
    .then(({ ASSET_MANIFEST, status }) => {
      if (!status || !status.images || !status.images.couple) return;
      const cards = content.querySelectorAll('.profile-avatar');
      if (status.images.couple['adjie.jpg'] && cards[0]) {
        const img = document.createElement('img');
        img.src = ASSET_MANIFEST.images.couple.groomPortrait.url;
        img.alt = groom.fullName;
        img.style.cssText = 'width: 84px; height: 84px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-gold);';
        cards[0].innerHTML = '';
        cards[0].appendChild(img);
      }
      if (status.images.couple['daulika.jpg'] && cards[1]) {
        const img = document.createElement('img');
        img.src = ASSET_MANIFEST.images.couple.bridePortrait.url;
        img.alt = bride.fullName;
        img.style.cssText = 'width: 84px; height: 84px; border-radius: 50%; object-fit: cover; border: 2px solid #ffb6c1;';
        cards[1].innerHTML = '';
        cards[1].appendChild(img);
      }
    })
    .catch(() => {});

  return createModal({
    id: 'profile-modal',
    title: '💍 PROFIL KAMI',
    content
  });
}
