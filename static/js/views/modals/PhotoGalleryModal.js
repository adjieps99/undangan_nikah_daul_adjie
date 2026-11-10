import { createModal } from '../../ui/Modal.js';

export function createPhotoGalleryModal() {
  const content = document.createElement('div');
  content.className = 'gallery-modal-content';

  // Data-driven gallery collection with romantic moments & captions
  const galleryItems = [
    {
      id: 1,
      title: 'Kencan Pertama di Sudut Kota',
      caption: 'Awal dari sebuah cerita indah yang tak pernah kami duga akan sejauh ini.',
      tag: 'MEMORIES',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
      icon: '☕'
    },
    {
      id: 2,
      title: 'Menyusuri Bukit Kebun Teh',
      caption: 'Di antara sejuknya dedaunan teh dan hangatnya genggaman tangan.',
      tag: 'ADVENTURE',
      gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
      icon: '🍃'
    },
    {
      id: 3,
      title: 'Langit Senja Bersama',
      caption: 'Matahari terbenam selalu mengingatkan kami akan rasa syukur saling memiliki.',
      tag: 'SUNSET',
      gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
      icon: '🌅'
    },
    {
      id: 4,
      title: 'Momen Lamaran Penuh Haru',
      caption: '"Ya, aku bersedia menemani setiap langkah masa depanmu."',
      tag: 'ENGAGEMENT',
      gradient: 'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
      icon: '💍'
    },
    {
      id: 5,
      title: 'Pre-Wedding Adat Nusantara',
      caption: 'Menghormati akar budaya luhur Sunda & Lombok dalam balutan modern.',
      tag: 'CULTURE',
      gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      icon: '✨'
    },
    {
      id: 6,
      title: 'Menuju Hari Bahagia Hachi Garden',
      caption: 'Menghitung hari untuk merayakan babak baru bersama kalian semua.',
      tag: 'FOREVER',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      icon: '🌸'
    }
  ];

  content.innerHTML = `
    <div style="margin-bottom: 14px; text-align: center;">
      <p style="font-size: 11px; opacity: 0.85;">Pilih salah satu potret kenangan untuk memperbesar & membaca ceritanya.</p>
    </div>

    <!-- Gallery Grid -->
    <div class="gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px;">
      ${galleryItems.map(item => `
        <div class="gallery-card" data-id="${item.id}" style="
          cursor: pointer;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s, border-color 0.2s;
        ">
          <div style="
            height: 90px;
            background: ${item.gradient};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
          ">
            ${item.icon}
          </div>
          <div style="padding: 8px 6px;">
            <span style="font-size: 9px; font-weight: bold; color: var(--color-gold); letter-spacing: 0.5px;">${item.tag}</span>
            <div style="font-size: 11px; font-weight: 600; color: #fff; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${item.title}
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Expanded Photo View Box (Hidden initially) -->
    <div id="gallery-preview-box" style="
      display: none;
      margin-top: 14px;
      padding: 12px;
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--color-gold);
      border-radius: 8px;
      text-align: center;
      animation: fadeIn 0.3s ease;
    ">
      <div id="preview-art" style="height: 110px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 48px; margin-bottom: 10px;"></div>
      <h4 id="preview-title" style="font-size: 13px; color: var(--color-gold); margin-bottom: 4px;"></h4>
      <p id="preview-caption" style="font-size: 11px; line-height: 1.5; opacity: 0.9; font-style: italic;"></p>
    </div>
  `;

  // Interaction handlers
  const cards = content.querySelectorAll('.gallery-card');
  const previewBox = content.querySelector('#gallery-preview-box');
  const previewArt = content.querySelector('#preview-art');
  const previewTitle = content.querySelector('#preview-title');
  const previewCaption = content.querySelector('#preview-caption');

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.borderColor = 'var(--color-gold)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.borderColor = 'rgba(212, 175, 55, 0.3)';
    });
    card.addEventListener('click', () => {
      const id = parseInt(card.getAttribute('data-id'));
      const item = galleryItems.find(g => g.id === id);
      if (item) {
        previewBox.style.display = 'block';
        previewArt.style.background = item.gradient;
        previewArt.textContent = item.icon;
        previewTitle.textContent = item.title;
        previewCaption.textContent = `"${item.caption}"`;
        previewBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  return createModal({
    id: 'gallery-modal',
    title: '📸 GALERI FOTO & CERITA KAMI',
    content: content
  });
}
