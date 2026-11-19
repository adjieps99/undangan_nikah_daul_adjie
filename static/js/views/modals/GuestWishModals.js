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
 * Formats an ISO timestamp into a compact Indonesian date label (e.g. "19 Nov 2026").
 */
function formatWishDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

/**
 * Opens the "Baca Pesan Teman" lazy-loaded vertical scrollable wish wall triggered near NPCs or Pelaminan.
 */
export function openReadWishesModal({ onOpenSendWish = null, onCloseComplete = null } = {}) {
  closeExistingWishModals();

  const content = document.createElement('div');
  content.className = 'read-wishes-modal-content';
  content.innerHTML = `
    <div class="wish-feed-header" id="wish-feed-header">
      <span class="wish-feed-count" id="wish-feed-count">💌 Memuat pesan teman-teman...</span>
      <span class="wish-feed-scroll-hint" id="wish-feed-scroll-hint" style="display: none;">Geser ke bawah ↓</span>
    </div>
    <div id="wish-feed-list" class="wish-feed-list" role="region" aria-label="Daftar pesan dan doa tamu">
      <div class="wish-feed-empty">
        <div class="wish-card-eyebrow">With Love</div>
        <p class="wish-feed-empty-text">Memuat doa dan ucapan hangat...</p>
      </div>
    </div>
    <div id="wish-feed-footer" class="wish-feed-footer" style="display: none;"></div>
  `;

  const countEl = content.querySelector('#wish-feed-count');
  const scrollHintEl = content.querySelector('#wish-feed-scroll-hint');
  const listEl = content.querySelector('#wish-feed-list');
  const footerEl = content.querySelector('#wish-feed-footer');

  const renderFeed = (wishes) => {
    listEl.innerHTML = '';
    footerEl.innerHTML = '';

    if (!wishes.length) {
      countEl.textContent = '💌 0 Pesan & Doa';
      scrollHintEl.style.display = 'none';
      footerEl.style.display = 'none';

      const emptyWrap = document.createElement('div');
      emptyWrap.className = 'wish-feed-empty';

      const eyebrow = document.createElement('div');
      eyebrow.className = 'wish-card-eyebrow';
      eyebrow.textContent = 'With Love';

      const emptyText = document.createElement('p');
      emptyText.className = 'wish-feed-empty-text';
      emptyText.textContent = 'Belum ada pesan publik saat ini. Yuk jadi yang pertama menitipkan doa untuk Adjie & Daulika!';

      emptyWrap.appendChild(eyebrow);
      emptyWrap.appendChild(emptyText);

      if (typeof onOpenSendWish === 'function') {
        const sendCta = createRetroButton({
          text: '✍️ Kirim Doa Sekarang',
          onClick: () => {
            backdrop._cleanup();
            onOpenSendWish();
          }
        });
        sendCta.classList.add('wish-feed-cta-btn');
        emptyWrap.appendChild(sendCta);
      }

      listEl.appendChild(emptyWrap);
      return;
    }

    countEl.textContent = `💌 ${wishes.length} Pesan & Doa`;
    scrollHintEl.style.display = wishes.length > 2 ? 'inline-block' : 'none';

    const frag = document.createDocumentFragment();
    wishes.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'wish-feed-card';

      const topRow = document.createElement('div');
      topRow.className = 'wish-feed-card-top';

      const eyebrow = document.createElement('span');
      eyebrow.className = 'wish-card-eyebrow';
      eyebrow.textContent = '✦ With Love';
      topRow.appendChild(eyebrow);

      const dateStr = formatWishDate(item.timestamp);
      if (dateStr) {
        const dateEl = document.createElement('span');
        dateEl.className = 'wish-feed-date';
        dateEl.textContent = dateStr;
        topRow.appendChild(dateEl);
      }

      const bodyEl = document.createElement('p');
      bodyEl.className = 'wish-feed-message';
      bodyEl.textContent = `“${String(item.message || '')}”`;

      const senderEl = document.createElement('div');
      senderEl.className = 'wish-feed-sender';
      senderEl.textContent = `— ${String(item.name || 'Tamu Undangan')}`;

      card.appendChild(topRow);
      card.appendChild(bodyEl);
      card.appendChild(senderEl);
      frag.appendChild(card);
    });

    listEl.appendChild(frag);
    listEl.scrollTop = 0;

    if (typeof onOpenSendWish === 'function') {
      const writeBtn = createRetroButton({
        text: '✍️ Titip Doa & Pesanmu',
        onClick: () => {
          backdrop._cleanup();
          onOpenSendWish();
        }
      });
      writeBtn.classList.add('wish-feed-cta-btn');
      footerEl.appendChild(writeBtn);
      footerEl.style.display = 'flex';
    } else {
      footerEl.style.display = 'none';
    }
  };

  const backdrop = createModal({
    id: 'hall-read-wishes-modal',
    title: 'PESAN & DOA TEMAN-TEMAN',
    content,
    onClose: () => {
      backdrop.remove();
      if (typeof onCloseComplete === 'function') onCloseComplete();
    }
  });
  backdrop.dataset.wishOverlay = '1';

  const host = document.getElementById('ui-layer') || document.body;
  host.appendChild(backdrop);

  // Lazy-fetch strictly on modal open from Firestore (newest first for natural vertical scroll)
  fetchPublicWishesFromFirestore({ limitCount: 60, randomize: false })
    .then((items) => {
      renderFeed(Array.isArray(items) ? items : []);
    })
    .catch(() => {
      renderFeed([]);
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
