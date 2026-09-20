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
    onClick: (e) => {
      e.preventDefault();
      const text = formBox.querySelector('#wish-input').value.trim();
      if (!text) return;

      const newWish = {
        id: Date.now(),
        name: gameState.getState().guestName,
        message: text,
        timestamp: new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      saveLocalWish(newWish);
      formBox.querySelector('#wish-input').value = '';
      loadWishes(wishesListContainer);
    }
  });

  formBox.appendChild(submitBtn);
  content.appendChild(wishesListContainer);
  content.appendChild(formBox);

  return createModal({
    id: 'wishes-modal',
    title: '🌸 BUKU TAMU & DOA RESTU',
    content: content
  });
}

function loadWishes(container) {
  fetch('/static/data/wishes.json')
    .then(res => res.json())
    .catch(() => [])
    .then(initialWishes => {
      const localWishes = getLocalWishes();
      const allWishes = [...localWishes, ...initialWishes];

      container.innerHTML = '';
      if (allWishes.length === 0) {
        container.innerHTML = `<p style="font-size: 10px; color: #888;">Belum ada ucapan. Jadilah yang pertama!</p>`;
        return;
      }

      allWishes.forEach(item => {
        const card = document.createElement('div');
        card.className = 'wish-card';
        card.innerHTML = `
          <div class="wish-header">
            <strong class="wish-author">${item.name}</strong>
            <span class="wish-time">${item.timestamp}</span>
          </div>
          <div class="wish-message">"${item.message}"</div>
        `;
        container.appendChild(card);
      });
    });
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
