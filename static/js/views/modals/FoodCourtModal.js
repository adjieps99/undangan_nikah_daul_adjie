import { createModal } from '../../ui/Modal.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createFoodCourtModal() {
  const content = document.createElement('div');
  content.className = 'foodcourt-modal-content';

  const favorites = WEDDING_DATA.favorites || [];

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 14px;">
      <p style="font-size: 11px; opacity: 0.85;">
        Bagi Adjie & Daul, cinta juga bertumbuh di sela-sela suapan makanan lezat dan obrolan hangat di tempat makan favorit.
      </p>
    </div>

    <!-- Favorite Orders Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
      <!-- Adjie Order -->
      <div style="
        background: rgba(212, 175, 55, 0.08);
        border: 1px solid rgba(212, 175, 55, 0.3);
        border-radius: 8px;
        padding: 10px;
        text-align: center;
      ">
        <div style="font-size: 24px; margin-bottom: 4px;">🍜</div>
        <div style="font-size: 10px; letter-spacing: 1px; color: var(--color-gold); font-weight: bold;">
          FAVORIT ADJIE
        </div>
        <h4 style="font-size: 12px; color: #fff; margin: 4px 0;">Mie Ayam Rica Ekstra Jamur</h4>
        <p style="font-size: 10px; opacity: 0.8; font-style: italic;">"Wajib pedas manis dengan kuah kental hangat!"</p>
      </div>

      <!-- Daul Order -->
      <div style="
        background: rgba(255, 182, 193, 0.08);
        border: 1px solid rgba(255, 182, 193, 0.3);
        border-radius: 8px;
        padding: 10px;
        text-align: center;
      ">
        <div style="font-size: 24px; margin-bottom: 4px;">🧇</div>
        <div style="font-size: 10px; letter-spacing: 1px; color: #ffb6c1; font-weight: bold;">
          FAVORIT DAUL
        </div>
        <h4 style="font-size: 12px; color: #fff; margin: 4px 0;">Waffle Berry & Es Krim Matcha</h4>
        <p style="font-size: 10px; opacity: 0.8; font-style: italic;">"Manis segar penutup hari yang sempurna."</p>
      </div>
    </div>

    <!-- Anecdotes & Food Memories -->
    <div>
      <h5 style="font-size: 11px; letter-spacing: 1px; color: var(--color-gold); margin-bottom: 8px;">
        🍽️ MENU & MOMEN BERKESAN
      </h5>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${favorites.map((fav, i) => `
          <div style="
            background: rgba(255,255,255,0.05);
            border-radius: 6px;
            padding: 8px 10px;
            display: flex;
            align-items: center;
            gap: 10px;
          ">
            <span style="font-size: 20px;">${i === 0 ? '🍲' : i === 1 ? '☕' : '🍌'}</span>
            <div>
              <div style="font-size: 11px; font-weight: bold; color: #fff;">${fav.item}</div>
              <div style="font-size: 10px; opacity: 0.8;">${fav.note}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  return createModal({
    id: 'foodcourt-modal',
    title: '🍲 FOOD COURT FAVORIT ADJIE & DAUL',
    content: content
  });
}
