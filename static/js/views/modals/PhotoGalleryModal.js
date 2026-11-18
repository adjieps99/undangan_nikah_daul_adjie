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
      grid-template-columns: repeat(auto-fill, minmax(125px, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    "></div>

    <div id="gallery-lightbox" style="
      display: none;
      margin-top: 12px;
      padding: 12px;
      background: linear-gradient(180deg, rgba(42, 27, 17, 0.98) 0%, rgba(28, 17, 10, 0.99) 100%);
      border: 1.5px solid var(--color-gold);
      border-radius: 10px;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.72);
      position: relative;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span id="lb-counter" style="font-size: 11px; color: #f5e6a3; font-weight: bold; letter-spacing: 0.4px;"></span>
        <button type="button" id="lb-close-btn" style="
          background: rgba(212, 175, 55, 0.14);
          border: 1px solid rgba(212, 175, 55, 0.45);
          border-radius: 6px;
          color: #f5eedc;
          font-size: 11px;
          cursor: pointer;
          padding: 4px 10px;
        ">✕ Tutup</button>
      </div>

      <div id="lb-swipe-area" style="
        position: relative;
        min-height: 200px;
        max-height: 310px;
        border-radius: 8px;
        background: #170e08;
        border: 1px solid rgba(212, 175, 55, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: 6px;
        touch-action: pan-y;
      ">
        <img id="lb-photo-img" alt="Foto Adjie & Daulika" style="max-width: 100%; max-height: 294px; width: auto; height: auto; object-fit: contain; display: block; border-radius: 4px;">

        <button type="button" id="lb-prev-btn" aria-label="Foto sebelumnya" style="
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(34, 21, 13, 0.82);
          border: 1px solid var(--color-gold);
          color: #f5e6a3;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        ">‹</button>

        <button type="button" id="lb-next-btn" aria-label="Foto berikutnya" style="
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(34, 21, 13, 0.82);
          border: 1px solid var(--color-gold);
          color: #f5e6a3;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        ">›</button>
      </div>

      <p id="lb-caption" style="
        display: none;
        margin: 10px 4px 2px;
        padding-top: 8px;
        border-top: 1px solid rgba(212, 175, 55, 0.22);
        font-size: 12px;
        color: #f5eedc;
        text-align: center;
        line-height: 1.5;
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
        background: rgba(42, 27, 17, 0.85);
        border: 1px solid rgba(212, 175, 55, 0.35);
        border-radius: 10px;
        padding: 26px 18px;
        font-family: var(--font-sans);
      ">
        <div style="font-size: 30px; margin-bottom: 10px;">🖼️</div>
        <p style="font-size: 13.5px; color: #f5eedc; line-height: 1.6; margin: 0 0 8px;">
          Foto-foto kami akan segera hadir di sini.
        </p>
        <p style="font-size: 11.5px; color: #f5e6a3; line-height: 1.5; margin: 0; opacity: 0.9;">
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
      lbCaption.textContent = '';
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
        display: flex;
        flex-direction: column;
        align-items: stretch;
        text-align: left;
        background: rgba(38, 24, 15, 0.95);
        border: 1px solid rgba(212, 175, 55, 0.42);
        border-radius: 8px;
        overflow: hidden;
        padding: 0;
        color: #f5eedc;
        transition: border-color 0.15s ease, transform 0.15s ease;
      `;

      const thumbWrap = document.createElement('div');
      thumbWrap.style.cssText = `
        width: 100%;
        aspect-ratio: 4 / 3;
        background: #170e08;
        overflow: hidden;
        border-bottom: 1px solid rgba(212, 175, 55, 0.24);
      `;

      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = photo.caption || photo.title || `Galeri foto ${idx + 1}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';
      thumbWrap.appendChild(img);
      card.appendChild(thumbWrap);

      const captionText = photo.caption || photo.title || `Foto ${idx + 1}`;
      const captionEl = document.createElement('p');
      captionEl.className = 'gallery-card-caption';
      captionEl.textContent = captionText;
      captionEl.title = captionText;
      captionEl.style.cssText = `
        margin: 7px 8px 8px;
        padding: 0;
        font-size: 11px;
        line-height: 1.35;
        max-height: calc(11px * 1.35 * 3);
        color: #f5eedc;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        word-break: break-word;
      `;
      card.appendChild(captionEl);

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
      e.preventDefault();
      e.stopImmediatePropagation();
      lightbox.style.display = 'none';
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  let touchStartX = 0;
  let touchStartY = 0;
  lbSwipeArea.addEventListener('touchstart', (e) => {
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    touchStartX = touch.screenX;
    touchStartY = touch.screenY;
  }, { passive: true });

  lbSwipeArea.addEventListener('touchend', (e) => {
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const dx = touch.screenX - touchStartX;
    const dy = touch.screenY - touchStartY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) showPhoto(currentLightboxIdx - 1);
      else showPhoto(currentLightboxIdx + 1);
    }
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
