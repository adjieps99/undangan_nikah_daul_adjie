import { createModal } from '../../ui/Modal.js';
import { ASSET_MANIFEST } from '../../config/assetManifest.js';
import { gameState, MODALS } from '../../state/GameState.js';

export function createPhotoGalleryModal() {
  const content = document.createElement('div');
  content.className = 'gallery-modal-content';

  let photos = [];
  let currentLightboxIdx = 0;

  content.innerHTML = `
    <div id="gallery-status-area" style="padding: 26px 14px; text-align: center;">
      <div style="font-size: 28px; margin-bottom: 8px;">📸</div>
      <p style="font-size: 12px; color: #f5eedc; line-height: 1.5; margin: 0;">Memuat galeri foto...</p>
    </div>

    <div id="gallery-grid" class="gallery-grid" style="
      display: none;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    "></div>

    <div id="gallery-lightbox" style="
      display: none;
      margin-top: 12px;
      padding: 12px;
      background: rgba(14, 11, 18, 0.96);
      border: 1.5px solid var(--color-gold);
      border-radius: 10px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.7);
      position: relative;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span id="lb-counter" style="font-size: 10px; color: var(--color-gold); font-weight: bold;"></span>
        <button type="button" id="lb-close-btn" style="
          background: none;
          border: none;
          color: #fff;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
        ">✕ Tutup</button>
      </div>

      <div id="lb-swipe-area" style="
        position: relative;
        min-height: 180px;
        max-height: 300px;
        border-radius: 8px;
        background: #0d0a10;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        touch-action: pan-y;
      ">
        <img id="lb-photo-img" alt="Foto Adjie & Daulika" style="max-width: 100%; max-height: 285px; width: auto; height: auto; object-fit: contain; display: block;">

        <button type="button" id="lb-prev-btn" aria-label="Foto sebelumnya" style="
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.65);
          border: 1px solid var(--color-gold);
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
        ">‹</button>

        <button type="button" id="lb-next-btn" aria-label="Foto berikutnya" style="
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.65);
          border: 1px solid var(--color-gold);
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
        ">›</button>
      </div>

      <p id="lb-caption" style="
        display: none;
        margin: 10px 4px 2px;
        font-size: 11px;
        color: #f5eedc;
        text-align: center;
        line-height: 1.45;
      "></p>
    </div>
  `;

  const statusArea = content.querySelector('#gallery-status-area');
  const grid = content.querySelector('#gallery-grid');
  const lightbox = content.querySelector('#gallery-lightbox');
  const lbCloseBtn = content.querySelector('#lb-close-btn');
  const lbPrevBtn = content.querySelector('#lb-prev-btn');
  const lbNextBtn = content.querySelector('#lb-next-btn');
  const lbSwipeArea = content.querySelector('#lb-swipe-area');
  const lbPhotoImg = content.querySelector('#lb-photo-img');
  const lbCounter = content.querySelector('#lb-counter');
  const lbCaption = content.querySelector('#lb-caption');

  const renderEmptyState = () => {
    grid.style.display = 'none';
    lightbox.style.display = 'none';
    statusArea.style.display = 'block';
    statusArea.innerHTML = `
      <div style="
        background: rgba(212, 175, 55, 0.08);
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 10px;
        padding: 26px 18px;
        font-family: var(--font-sans);
      ">
        <div style="font-size: 30px; margin-bottom: 10px;">🖼️</div>
        <p style="font-size: 13.5px; color: #f5eedc; line-height: 1.6; margin: 0 0 8px;">
          Foto-foto kami akan segera hadir di sini.
        </p>
        <p style="font-size: 11.5px; color: #ffbe97; line-height: 1.5; margin: 0; opacity: 0.9;">
          Unggah foto ke folder <code>static/images/gallery/</code> untuk menampilkannya secara otomatis.
        </p>
      </div>
    `;
  };

  const showPhoto = (idx) => {
    if (!photos.length) return;
    currentLightboxIdx = (idx + photos.length) % photos.length;
    const photo = photos[currentLightboxIdx];
    lightbox.style.display = 'block';
    lbPhotoImg.src = photo.url;
    lbPhotoImg.alt = photo.caption || photo.title || `Foto Adjie & Daulika ${currentLightboxIdx + 1}`;
    lbCounter.textContent = `${currentLightboxIdx + 1} / ${photos.length}`;

    const captionText = photo.caption || photo.title || '';
    if (captionText) {
      lbCaption.textContent = captionText;
      lbCaption.style.display = 'block';
    } else {
      lbCaption.style.display = 'none';
    }
    lightbox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const renderGrid = () => {
    statusArea.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';

    photos.forEach((photo, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'gallery-card';
      card.style.cssText = `
        cursor: pointer;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 8px;
        overflow: hidden;
        padding: 0;
        aspect-ratio: 4 / 3;
      `;

      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = photo.caption || photo.title || `Galeri foto ${idx + 1}`;
      img.loading = 'lazy';
      img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';
      card.appendChild(img);

      card.addEventListener('click', () => showPhoto(idx));
      grid.appendChild(card);
    });
  };

  lbCloseBtn.addEventListener('click', () => {
    lightbox.style.display = 'none';
  });

  lbPrevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showPhoto(currentLightboxIdx - 1);
  });

  lbNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showPhoto(currentLightboxIdx + 1);
  });

  const handleKeyDown = (e) => {
    if (lightbox.style.display !== 'block' || !photos.length) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showPhoto(currentLightboxIdx - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      showPhoto(currentLightboxIdx + 1);
    } else if (e.key === 'Escape') {
      lightbox.style.display = 'none';
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  let touchStartX = 0;
  lbSwipeArea.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lbSwipeArea.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (diff > 45) showPhoto(currentLightboxIdx - 1);
    else if (diff < -45) showPhoto(currentLightboxIdx + 1);
  }, { passive: true });

  fetch(ASSET_MANIFEST.images.gallery.apiEndpoint)
    .then((r) => (r.ok ? r.json() : { photos: [] }))
    .then((data) => {
      photos = Array.isArray(data.photos) ? data.photos : [];
      if (photos.length === 0) {
        renderEmptyState();
      } else {
        renderGrid();
      }
    })
    .catch(() => {
      renderEmptyState();
    });

  return createModal({
    id: 'gallery-modal',
    title: '📸 GALERI FOTO',
    content,
    onClose: () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameState.getState().activeModal === MODALS.GALLERY) {
        gameState.setModal(MODALS.NONE);
      }
    }
  });
}
