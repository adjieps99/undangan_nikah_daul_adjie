import { createModal } from '../../ui/Modal.js';
import { createRetroButton } from '../../ui/RetroButton.js';
import { gameState } from '../../state/GameState.js';

export function createWishesModal() {
  const content = document.createElement('div');
  content.className = 'wishes-modal-content';

  const wishesListContainer = document.createElement('div');
  wishesListContainer.className = 'wishes-stream-container';
  wishesListContainer.innerHTML = `<div class="loading-text">Memuat doa & ucapan...</div>`;

  // Fetch mock wishes + load local submissions
  loadWishes(wishesListContainer);

  // Form Submission
  const formBox = document.createElement('form');
  formBox.className = 'wish-form-box';
  formBox.innerHTML = `
    <h4 style="font-size: 11px; color: var(--color-gold-light); margin-bottom: 8px;">KIRIM UCAPAN & DOA</h4>
    <textarea id="wish-input" class="retro-textarea" rows="3" placeholder="Tuliskan ucapan & doa restu Anda di sini..." required></textarea>
  `;

  const submitBtn = createRetroButton({
    text: '💌 KIRIM UCAPAN',
    onClick: async (e) => {
      e.preventDefault();
      const rawText = formBox.querySelector('#wish-input').value.trim();
      const text = rawText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').slice(0, 500).trim();
      if (!text) return;

      submitBtn.disabled = true;
      submitBtn.innerText = '⏳ MENGIRIM...';

      const payload = {
        sender_name: gameState.getState().guestName,
        message: text
      };

      try {
        const response = await fetch('/api/wishes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (response.ok && resData.status === 'ok') {
          saveLocalWish(resData.wish);
          formBox.querySelector('#wish-input').value = '';
          errorBanner.style.display = 'none';
          loadWishes(wishesListContainer);
        } else {
          errorBanner.textContent = `Gagal mengirim ucapan: ${resData.message || 'Terjadi kesalahan.'}`;
          errorBanner.style.display = 'block';
        }
      } catch (err) {
        errorBanner.textContent = 'Koneksi terputus saat mengirim ucapan. Silakan coba lagi.';
        errorBanner.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = '💌 KIRIM UCAPAN';
      }
    }
  });

  const errorBanner = document.createElement('div');
  errorBanner.style.cssText = 'display: none; margin-top: 8px; font-size: 11px; color: #ff8888; text-align: center;';
  formBox.appendChild(errorBanner);
  formBox.appendChild(submitBtn);
  content.appendChild(wishesListContainer);
  content.appendChild(formBox);

  return createModal({
    id: 'wishes-modal',
    title: '🌸 BUKU TAMU & DOA RESTU',
    content: content
  });
}

async function loadWishes(container) {
  let wishes = [];
  try {
    const res = await fetch('/api/wishes?page=1&limit=25');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.wishes) && data.wishes.length > 0) {
        wishes = data.wishes;
      }
    }
  } catch (e) {
    console.warn('API wishes offline, fallback to cache');
  }

  // Graceful fallback to local cache + seed if server empty
  if (wishes.length === 0) {
    const localWishes = getLocalWishes();
    try {
      const seedRes = await fetch('/static/data/wishes.json');
      const seedWishes = await seedRes.json();
      wishes = [...localWishes, ...seedWishes];
    } catch (e) {
      wishes = localWishes;
    }
  }

  container.innerHTML = '';
  if (wishes.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.style.cssText = 'font-size: 10px; color: #888;';
    emptyMsg.textContent = 'Belum ada ucapan. Jadilah yang pertama!';
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
    author.textContent = String(item.name || 'Anonim');

    const time = document.createElement('span');
    time.className = 'wish-time';
    time.textContent = String(item.timestamp || '');

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

function getLocalWishes() {
  try {
    const saved = localStorage.getItem('wedding_wishes');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalWish(wish) {
  const wishes = getLocalWishes();
  wishes.unshift(wish);
  try {
    localStorage.setItem('wedding_wishes', JSON.stringify(wishes));
  } catch (e) {
    console.warn('LocalStorage unavailable');
  }
}
