import { createModal } from '../../ui/Modal.js';

export function createPhotoGalleryModal() {
  const content = document.createElement('div');
  content.className = 'gallery-modal-content';

  const galleryItems = [
    {
      id: 1,
      title: 'Awal Pertemuan di Sudut Senja',
      caption: 'Sebuah sapaan sederhana yang membuka lembaran kisah terindah kami.',
      tag: 'AWAL CERITA',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      icon: '☕'
    },
    {
      id: 2,
      title: 'Langkah Santai di Kebun Teh',
      caption: 'Menikmati udara sejuk pegunungan dan hangatnya jemari yang saling bertaut.',
      tag: 'PETUALANGAN',
      gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
      icon: '🍃'
    },
    {
      id: 3,
      title: 'Menatap Jingga Berdua',
      caption: 'Setiap matahari terbenam mengingatkan kami pada rasa syukur telah dipertemukan.',
      tag: 'SENJA',
      gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
      icon: '🌅'
    },
    {
      id: 4,
      title: 'Janji di Bawah Langit Malam',
      caption: '"Bersediakah kamu berjalan berdampingan denganku sampai akhir nanti?"',
      tag: 'LAMARAN',
      gradient: 'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
      icon: '💍'
    },
    {
      id: 5,
      title: 'Balutan Adat & Restu Orang Tua',
      caption: 'Menghormati akar budaya luhur dengan penuh takzim dan doa kebaikan.',
      tag: 'KELUARGA',
      gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      icon: '✨'
    },
    {
      id: 6,
      title: 'The Garden of Us',
      caption: 'Taman kecil yang kami bangun bersama untuk menyambut hari bahagia kita.',
      tag: 'HARI BAHAGIA',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      icon: '🌸'
    }
  ];

  let currentLightboxIdx = 0;

  content.innerHTML = `
    <div style="margin-bottom: 16px; text-align: center;">
      <p style="font-size: 12px; color: #ffbe97; font-style: italic; line-height: 1.4;">
        "Beberapa momen kecil yang ingin kami simpan selamanya."
      </p>
    </div>

    <!-- Responsive Grid of Photo Cards -->
    <div class="gallery-grid" style="
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); 
      gap: 12px;
      margin-bottom: 12px;
    ">
      ${galleryItems.map((item, idx) => `
        <div class="gallery-card" data-idx="${idx}" style="
          cursor: pointer;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(212, 175, 55, 0.35);
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
        ">
          <div style="
            height: 95px;
            background: ${item.gradient};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 38px;
            box-shadow: inset 0 0 16px rgba(0,0,0,0.12);
          ">
            ${item.icon}
          </div>
          <div style="padding: 8px 8px 10px;">
            <span style="font-size: 9px; font-weight: bold; color: var(--color-gold); letter-spacing: 0.5px;">${item.tag}</span>
            <div style="font-size: 11px; font-weight: 600; color: #fff; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${item.title}
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Interactive Lightbox Modal Overlay (Embedded) -->
    <div id="gallery-lightbox" style="
      display: none;
      margin-top: 14px;
      padding: 14px;
      background: rgba(14, 11, 18, 0.95);
      border: 1.5px solid var(--color-gold);
      border-radius: 10px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.7);
      animation: fadeIn 0.25s ease;
      position: relative;
    ">
      <!-- Lightbox Navigation Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span id="lb-counter" style="font-size: 10px; color: var(--color-gold); font-weight: bold;">1 / 6</span>
        <button type="button" id="lb-close-btn" style="
          background: none; 
          border: none; 
          color: #fff; 
          font-size: 14px; 
          cursor: pointer;
          padding: 2px 6px;
        ">✕ TUTUP</button>
      </div>

      <!-- Artwork / Image Container with Touch Swipe support -->
      <div id="lb-swipe-area" style="
        position: relative;
        height: 140px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 52px;
        margin-bottom: 12px;
        box-shadow: inset 0 0 20px rgba(0,0,0,0.25);
        touch-action: pan-y;
      ">
        <span id="lb-art-icon"></span>

        <!-- Prev / Next Overlaid Floating Buttons -->
        <button type="button" id="lb-prev-btn" style="
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.6);
          border: 1px solid var(--color-gold);
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        ">‹</button>

        <button type="button" id="lb-next-btn" style="
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.6);
          border: 1px solid var(--color-gold);
          color: #fff;
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

      <h4 id="lb-title" style="font-size: 13px; color: var(--color-gold); margin-bottom: 4px; text-align: center;"></h4>
      <p id="lb-caption" style="font-size: 11px; line-height: 1.5; color: #f5eedc; font-style: italic; text-align: center;"></p>
      
      <div style="font-size: 9px; color: #888; text-align: center; margin-top: 8px;">
        💡 Geser layar (swipe) atau klik panah untuk berpindah foto
      </div>
    </div>
  `;

  // Elements
  const cards = content.querySelectorAll('.gallery-card');
  const lightbox = content.querySelector('#gallery-lightbox');
  const lbCloseBtn = content.querySelector('#lb-close-btn');
  const lbPrevBtn = content.querySelector('#lb-prev-btn');
  const lbNextBtn = content.querySelector('#lb-next-btn');
  const lbSwipeArea = content.querySelector('#lb-swipe-area');
  const lbArtIcon = content.querySelector('#lb-art-icon');
  const lbTitle = content.querySelector('#lb-title');
  const lbCaption = content.querySelector('#lb-caption');
  const lbCounter = content.querySelector('#lb-counter');

  const showPhoto = (idx) => {
    currentLightboxIdx = (idx + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentLightboxIdx];
    lightbox.style.display = 'block';
    lbSwipeArea.style.background = item.gradient;
    lbArtIcon.textContent = item.icon;
    lbTitle.textContent = item.title;
    lbCaption.textContent = `"${item.caption}"`;
    lbCounter.textContent = `${currentLightboxIdx + 1} / ${galleryItems.length}`;
    lightbox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-3px)';
      card.style.borderColor = 'var(--color-gold)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.borderColor = 'rgba(212, 175, 55, 0.35)';
    });
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-idx'), 10);
      showPhoto(idx);
    });
  });

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

  // Touch swipe support for mobile
  let touchStartX = 0;
  lbSwipeArea.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lbSwipeArea.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (diff > 45) {
      showPhoto(currentLightboxIdx - 1); // Swipe right -> prev
    } else if (diff < -45) {
      showPhoto(currentLightboxIdx + 1); // Swipe left -> next
    }
  }, { passive: true });

  return createModal({
    id: 'gallery-modal',
    title: '📸 GALERI FOTO',
    content: content
  });
}
