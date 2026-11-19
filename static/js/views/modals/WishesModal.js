import { createModal } from '../../ui/Modal.js';
import { createRetroButton } from '../../ui/RetroButton.js';
import { gameState } from '../../state/GameState.js';

export function createWishesModal() {
  const state = gameState.getState();
  const content = document.createElement('div');
  content.className = 'wishes-modal-content';

  const wishesListContainer = document.createElement('div');
  wishesListContainer.className = 'wishes-stream-container';
  wishesListContainer.innerHTML = `<div class="loading-text">Memuat doa &amp; ucapan...</div>`;

  loadWishes(wishesListContainer);

  let visibility = 'PUBLIC';

  const formBox = document.createElement('form');
  formBox.className = 'wish-form-box';
  formBox.innerHTML = `
    <h4 style="font-size: 11px; color: var(--color-gold-light); margin-bottom: 8px;">KIRIM DOA &amp; PESAN</h4>
    <textarea id="wish-input" class="wish-textarea" rows="3" maxlength="500" placeholder="Tulis doa atau pesan hangatmu untuk Adjie &amp; Daulika di sini..." required></textarea>
    <div id="wish-modal-counter" class="wish-char-counter">0 / 500</div>
    <div class="wish-vis-row" style="margin: 8px 0 10px;">
      <button type="button" class="wish-vis-pill active" id="wish-modal-vis-public">Tampilkan (Publik)</button>
      <button type="button" class="wish-vis-pill" id="wish-modal-vis-private">Khusus Adjie &amp; Daulika (Privat)</button>
    </div>
  `;

  const wishInput = formBox.querySelector('#wish-input');
  const counterEl = formBox.querySelector('#wish-modal-counter');
  const pubBtn = formBox.querySelector('#wish-modal-vis-public');
  const privBtn = formBox.querySelector('#wish-modal-vis-private');

  wishInput.addEventListener('input', () => {
    counterEl.textContent = `${wishInput.value.length} / 500`;
  });

  pubBtn.addEventListener('click', () => {
    visibility = 'PUBLIC';
    pubBtn.classList.add('active');
    privBtn.classList.remove('active');
  });
  privBtn.addEventListener('click', () => {
    visibility = 'PRIVATE';
    privBtn.classList.add('active');
    pubBtn.classList.remove('active');
  });

  const feedbackBanner = document.createElement('div');
  feedbackBanner.style.cssText = 'display: none; margin: 8px 0; font-size: 12px; text-align: center; padding: 8px 10px; border-radius: 6px;';

  const submitBtn = createRetroButton({
    text: 'Kirim Doa',
    onClick: async (e) => {
      e.preventDefault();
      const rawText = wishInput.value.trim();
      const text = rawText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').slice(0, 500).trim();
      if (!text) return;

      submitBtn.disabled = true;
      submitBtn.innerText = 'Mengirim...';

      const currentState = gameState.getState();
      const payload = {
        sender_name: currentState.guestName || state.guestName || 'Tamu Undangan',
        message: text,
        visibility
      };

      try {
        const response = await fetch('/api/wishes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (response.ok && resData.status === 'ok') {
          wishInput.value = '';
          counterEl.textContent = '0 / 500';
          feedbackBanner.style.display = 'block';
          feedbackBanner.style.background = 'rgba(60, 190, 100, 0.16)';
          feedbackBanner.style.border = '1px solid #5ee085';
          feedbackBanner.style.color = '#cbffda';
          feedbackBanner.textContent = 'Terima kasih sudah menitipkan doa dan pesan untuk kami. ❤️';
          loadWishes(wishesListContainer);
        } else {
          feedbackBanner.style.display = 'block';
          feedbackBanner.style.background = 'rgba(255, 70, 70, 0.16)';
          feedbackBanner.style.border = '1px solid #ff6666';
          feedbackBanner.style.color = '#ffb3b3';
          feedbackBanner.textContent = `Gagal mengirim ucapan: ${resData.message || 'Terjadi kesalahan.'}`;
        }
      } catch {
        feedbackBanner.style.display = 'block';
        feedbackBanner.style.background = 'rgba(255, 70, 70, 0.16)';
        feedbackBanner.style.border = '1px solid #ff6666';
        feedbackBanner.style.color = '#ffb3b3';
        feedbackBanner.textContent = 'Koneksi terputus saat mengirim ucapan. Silakan coba lagi.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Kirim Doa';
      }
    }
  });
  submitBtn.style.width = '100%';

  formBox.appendChild(feedbackBanner);
  formBox.appendChild(submitBtn);
  content.appendChild(wishesListContainer);
  content.appendChild(formBox);

  return createModal({
    id: 'wishes-modal',
    title: 'BUKU TAMU & DOA RESTU',
    content
  });
}

async function loadWishes(container) {
  let wishes = [];
  try {
    const res = await fetch('/api/wishes?page=1&limit=25');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.wishes)) {
        wishes = data.wishes;
      }
    }
  } catch (e) {
    console.warn('API wishes unavailable:', e);
  }

  container.innerHTML = '';
  if (wishes.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.style.cssText = 'font-size: 12px; color: #b5b0a4; text-align: center; padding: 10px 0;';
    emptyMsg.textContent = 'Belum ada ucapan publik yang ditampilkan. Jadilah yang pertama menitipkan doa!';
    container.appendChild(emptyMsg);
    return;
  }

  for (const item of wishes) {
    const card = document.createElement('div');
    card.className = 'wish-card';

    const header = document.createElement('div');
    header.className = 'wish-header';

    const author = document.createElement('strong');
    author.className = 'wish-author';
    author.textContent = String(item.name || 'Tamu Undangan');

    const time = document.createElement('span');
    time.className = 'wish-time';
    try {
      time.textContent = item.timestamp ? new Date(item.timestamp).toLocaleDateString('id-ID') : '';
    } catch {
      time.textContent = '';
    }

    header.appendChild(author);
    header.appendChild(time);

    const msg = document.createElement('div');
    msg.className = 'wish-message';
    msg.textContent = `"${String(item.message || '')}"`;

    card.appendChild(header);
    card.appendChild(msg);
    container.appendChild(card);
  }
}
