import { createModal } from '../../ui/Modal.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createGiftModal() {
  const content = document.createElement('div');
  content.className = 'gift-modal-content';

  const giftData = WEDDING_DATA.gift;

  content.innerHTML = `
    <p class="gift-subtitle">${giftData.subtitle}</p>

    <div class="gift-bank-grid">
      ${giftData.accounts.map(acc => `
        <div class="bank-card">
          <div class="bank-header">
            <span class="bank-title">${acc.bank}</span>
            <span class="bank-name">a.n ${acc.holder}</span>
          </div>
          <div class="bank-acc-row">
            <span class="bank-number">${acc.number}</span>
            <button type="button" class="retro-btn copy-acc-btn" data-acc="${acc.number}">📋 COPY</button>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="qris-card">
      <div class="qris-title">📱 QRIS DIGITAL ANGPAO</div>
      <div class="qris-box">
        <div class="qris-fake-code">
          <div style="font-size: 32px;">📷</div>
          <div style="font-size: 8px; margin-top: 4px; opacity: 0.8;">${giftData.qrisText}</div>
        </div>
      </div>
    </div>
  `;

  content.querySelectorAll('.copy-acc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const num = btn.getAttribute('data-acc');
      navigator.clipboard.writeText(num).then(() => {
        const orig = btn.innerText;
        btn.innerText = '✅ COPIED!';
        setTimeout(() => { btn.innerText = orig; }, 2000);
      });
    });
  });

  return createModal({
    id: 'gift-modal',
    title: '🎁 DIGITAL GIFT & ANGPAO',
    content: content
  });
}
