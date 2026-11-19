import { createModal } from '../../ui/Modal.js';
import { createRetroButton } from '../../ui/RetroButton.js';
import { gameState } from '../../state/GameState.js';
import {
  submitWishToFirestore,
  fetchPublicWishesFromFirestore
} from '../../firebase/firebaseClient.bundle.js';

/**
 * Opens the "Kirim Doa & Ucapan" modal triggered by approaching Adjie & Daulika.
 */
export function openSendWishModal({ onCloseComplete = null } = {}) {
  closeExistingWishModals();

  const state = gameState.getState();
  const content = document.createElement('div');
  content.className = 'send-wish-modal-content';

  let visibility = 'PUBLIC';

  content.innerHTML = `
    <p style="font-size: 12.5px; color: #f5e6a3; margin: 0 0 12px; line-height: 1.5; text-align: center;">
      Makasih banget sudah mampir di hari bahagia kami! Titipkan doa dan pesan hangat untuk Adjie &amp; Daulika di sini ya.
    </p>
    <div class="wish-form-group">
      <label class="wish-field-label" for="guest-wish-sender">Nama Pengirim</label>
      <input id="guest-wish-sender" class="wish-input" type="text" maxlength="80" />
    </div>
    <div class="wish-form-group">
      <label class="wish-field-label" for="guest-wish-message">Doa &amp; Pesan (maks. 500 karakter)</label>
      <textarea id="guest-wish-message" class="wish-textarea" rows="4" maxlength="500" placeholder="Tuliskan doa dan pesan terbaik Anda untuk Adjie &amp; Daulika..."></textarea>
      <div id="guest-wish-counter" class="wish-char-counter">0 / 500</div>
    </div>
    <div class="wish-form-group">
      <label class="wish-field-label">Privasi Pesan</label>
      <div class="wish-vis-row">
        <button type="button" class="wish-vis-pill active" id="wish-vis-public" data-vis="PUBLIC">
          Tampilkan untuk Tamu (Public)
        </button>
        <button type="button" class="wish-vis-pill" id="wish-vis-private" data-vis="PRIVATE">
          Khusus Pengantin (Private)
        </button>
      </div>
    </div>
    <div id="guest-wish-feedback" style="display: none; padding: 10px 12px; border-radius: 6px; font-size: 12.5px; text-align: center; margin-bottom: 12px; line-height: 1.45;"></div>
  `;

  const senderInput = content.querySelector('#guest-wish-sender');
  const messageInput = content.querySelector('#guest-wish-message');
  const counterEl = content.querySelector('#guest-wish-counter');
  const visPublicBtn = content.querySelector('#wish-vis-public');
  const visPrivateBtn = content.querySelector('#wish-vis-private');
  const feedbackEl = content.querySelector('#guest-wish-feedback');

  senderInput.value = state.guestName || 'Tamu Undangan';
  if (state.isPersonalizedInvite) {
    senderInput.setAttribute('readonly', 'readonly');
  }

  messageInput.addEventListener('input', () => {
    const len = messageInput.value.length;
    counterEl.textContent = `${len} / 500`;
  });

  const syncVisibility = (nextVis) => {
    visibility = nextVis;
    visPublicBtn.classList.toggle('active', visibility === 'PUBLIC');
    visPrivateBtn.classList.toggle('active', visibility === 'PRIVATE');
  };
  visPublicBtn.addEventListener('click', () => syncVisibility('PUBLIC'));
  visPrivateBtn.addEventListener('click', () => syncVisibility('PRIVATE'));

  let isSubmitted = false;
  const submitBtn = createRetroButton({
    text: 'Kirim Doa',
    onClick: async () => {
      if (isSubmitted) {
        backdrop._cleanup();
        return;
      }

      const senderName = senderInput.value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, 80);
      const message = messageInput.value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().slice(0, 500);

      if (!message) {
        feedbackEl.style.display = 'block';
        feedbackEl.style.background = 'rgba(255, 70, 70, 0.16)';
        feedbackEl.style.border = '1px solid #ff6666';
        feedbackEl.style.color = '#ffb3b3';
        feedbackEl.textContent = 'Mohon tuliskan doa atau pesan terlebih dahulu ya.';
        messageInput.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = 'Mengirim...';

      try {
        await submitWishToFirestore({
          sender_name: senderName || state.guestName || 'Tamu Undangan',
          message,
          visibility
        });

        isSubmitted = true;
        feedbackEl.style.display = 'block';
        feedbackEl.style.background = 'rgba(60, 190, 100, 0.18)';
        feedbackEl.style.border = '1px solid #5ee085';
        feedbackEl.style.color = '#cbffda';
        feedbackEl.textContent = visibility === 'PRIVATE'
          ? 'Terima kasih banyak sudah menitipkan doa untuk kami! Pesan pribadimu tersimpan khusus untuk Adjie & Daulika. ❤️'
          : 'Terima kasih banyak sudah menitipkan doa dan pesan untuk kami! Doamu sekarang sudah tampil di Pesan Teman. ❤️';

        messageInput.value = '';
        counterEl.textContent = '0 / 500';
        submitBtn.innerText = 'Tutup';
        submitBtn.disabled = false;

        if (visibility === 'PUBLIC' && !content.querySelector('#after-wish-read-btn')) {
          const readAfterBtn = createRetroButton({
            text: 'Baca Pesan Teman',
            variant: 'secondary',
            onClick: () => {
              backdrop._cleanup();
              openReadWishesModal({ onOpenSendWish: () => openSendWishModal() });
            }
          });
          readAfterBtn.id = 'after-wish-read-btn';
          readAfterBtn.style.width = '100%';
          readAfterBtn.style.marginTop = '8px';
          content.appendChild(readAfterBtn);
        }
      } catch (err) {
        feedbackEl.style.display = 'block';
        feedbackEl.style.background = 'rgba(255, 70, 70, 0.16)';
        feedbackEl.style.border = '1px solid #ff6666';
        feedbackEl.style.color = '#ffb3b3';
        const rawMsg = err instanceof Error ? err.message : '';
        feedbackEl.textContent = rawMsg.includes('Quota exceeded')
          ? 'Batas harian penyimpanan tercapai. Silakan coba lagi besok ya.'
          : 'Gagal mengirim doa ke server. Pastikan koneksi internet stabil lalu coba lagi.';
        submitBtn.disabled = false;
        submitBtn.innerText = 'Kirim Doa';
      }
    }
  });
  submitBtn.style.width = '100%';
  content.appendChild(submitBtn);

  const backdrop = createModal({
    id: 'hall-send-wish-modal',
    title: 'KIRIM DOA & PESAN',
    content,
    onClose: () => {
      backdrop.remove();
      if (typeof onCloseComplete === 'function') onCloseComplete();
    }
  });
  backdrop.dataset.wishOverlay = '1';

  const host = document.getElementById('ui-layer') || document.body;
  host.appendChild(backdrop);
  setTimeout(() => messageInput.focus(), 40);
  return backdrop;
}

/**
 * Opens the "Baca Pesan Teman" lazy-loaded rotating wish card modal triggered near NPCs or Pelaminan.
 */
export function openReadWishesModal({ onOpenSendWish = null, onCloseComplete = null } = {}) {
  closeExistingWishModals();

  const content = document.createElement('div');
  content.className = 'read-wishes-modal-content';
  content.innerHTML = `
    <div id="wish-reader-stage" class="wish-read-card">
      <div class="wish-card-eyebrow">With Love</div>
      <div class="wish-card-body" style="color: #cfc8b8;">Memuat pesan teman-teman...</div>
      <div></div>
    </div>
    <div class="wish-card-nav" id="wish-reader-nav" style="display: none;">
      <button type="button" class="retro-btn retro-btn-secondary" id="wish-prev-btn" style="padding: 8px 14px; font-size: 11px;">◀ Sebelumnya</button>
      <span id="wish-card-counter" style="font-size: 12px; color: #f5e6a3;">1 / 1</span>
      <button type="button" class="retro-btn retro-btn-secondary" id="wish-next-btn" style="padding: 8px 14px; font-size: 11px;">Berikutnya ▶</button>
    </div>
  `;

  const stageEl = content.querySelector('#wish-reader-stage');
  const navEl = content.querySelector('#wish-reader-nav');
  const prevBtn = content.querySelector('#wish-prev-btn');
  const nextBtn = content.querySelector('#wish-next-btn');
  const counterEl = content.querySelector('#wish-card-counter');

  let wishes = [];
  let currentIndex = 0;

  const renderCard = () => {
    stageEl.innerHTML = '';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'wish-card-eyebrow';
    eyebrow.textContent = 'With Love';
    stageEl.appendChild(eyebrow);

    if (wishes.length === 0) {
      const emptyText = document.createElement('div');
      emptyText.className = 'wish-card-body';
      emptyText.style.fontStyle = 'normal';
      emptyText.textContent = 'Belum ada pesan publik saat ini. Yuk jadi yang pertama menitipkan doa untuk Adjie & Daulika!';
      stageEl.appendChild(emptyText);

      if (typeof onOpenSendWish === 'function') {
        const sendCta = createRetroButton({
          text: 'Kirim Doa Sekarang',
          onClick: () => {
            backdrop._cleanup();
            onOpenSendWish();
          }
        });
        sendCta.style.fontSize = '11px';
        sendCta.style.margin = '0 auto';
        stageEl.appendChild(sendCta);
      } else {
        stageEl.appendChild(document.createElement('div'));
      }
      navEl.style.display = 'none';
      return;
    }

    const item = wishes[currentIndex];
    const bodyEl = document.createElement('div');
    bodyEl.className = 'wish-card-body';
    bodyEl.textContent = `“${String(item.message || '')}”`;

    const fromEl = document.createElement('div');
    fromEl.className = 'wish-card-from';
    fromEl.textContent = `From: ${String(item.name || 'Tamu Undangan')}`;

    stageEl.appendChild(bodyEl);
    stageEl.appendChild(fromEl);

    counterEl.textContent = `${currentIndex + 1} / ${wishes.length}`;
    navEl.style.display = wishes.length > 1 ? 'flex' : 'none';
  };

  const stepCard = (delta) => {
    if (wishes.length <= 1) return;
    currentIndex = (currentIndex + delta + wishes.length) % wishes.length;
    renderCard();
  };

  prevBtn.addEventListener('click', () => stepCard(-1));
  nextBtn.addEventListener('click', () => stepCard(1));

  let touchStartX = null;
  stageEl.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
  }, { passive: true });
  stageEl.addEventListener('touchend', (e) => {
    if (touchStartX === null || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) > 40) {
      stepCard(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  const onKeyNav = (e) => {
    if (e.key === 'ArrowLeft') stepCard(-1);
    if (e.key === 'ArrowRight') stepCard(1);
  };
  window.addEventListener('keydown', onKeyNav);

  const backdrop = createModal({
    id: 'hall-read-wishes-modal',
    title: 'PESAN & DOA TEMAN-TEMAN',
    content,
    onClose: () => {
      window.removeEventListener('keydown', onKeyNav);
      backdrop.remove();
      if (typeof onCloseComplete === 'function') onCloseComplete();
    }
  });
  backdrop.dataset.wishOverlay = '1';

  const originalCleanup = backdrop._cleanup;
  backdrop._cleanup = () => {
    window.removeEventListener('keydown', onKeyNav);
    originalCleanup();
  };

  const host = document.getElementById('ui-layer') || document.body;
  host.appendChild(backdrop);

  // Lazy-fetch strictly on modal open from Firestore
  fetchPublicWishesFromFirestore({ limitCount: 50, randomize: true })
    .then((items) => {
      wishes = Array.isArray(items) ? items : [];
      currentIndex = 0;
      renderCard();
    })
    .catch(() => {
      wishes = [];
      renderCard();
    });

  return backdrop;
}

export function closeExistingWishModals() {
  document.querySelectorAll('.modal-backdrop[data-wish-overlay="1"]').forEach((el) => {
    if (typeof el._cleanup === 'function') {
      el._cleanup();
    } else {
      el.remove();
    }
  });
}
