import { createModal } from '../../ui/Modal.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createFoodCourtModal() {
  const content = document.createElement('div');
  content.className = 'foodcourt-modal-content';

  const restaurants = WEDDING_DATA.favoriteRestaurants || [];

  const introWrap = document.createElement('div');
  introWrap.style.cssText = 'text-align: center; margin-bottom: 16px;';

  const introText = document.createElement('p');
  introText.style.cssText = 'font-family: var(--font-sans); font-size: 13px; color: #ffbe97; line-height: 1.55; margin: 0;';
  introText.textContent = 'Beberapa tempat yang punya ruang khusus di hati kami.';
  introWrap.appendChild(introText);
  content.appendChild(introWrap);

  const sectionHeading = document.createElement('h5');
  sectionHeading.style.cssText = 'font-family: var(--font-sans); font-size: 11px; letter-spacing: 1.4px; color: var(--color-gold); font-weight: 700; margin: 0 0 10px;';
  sectionHeading.textContent = 'FAVORIT KAMI';
  content.appendChild(sectionHeading);

  const listWrap = document.createElement('div');
  listWrap.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

  restaurants.forEach((place) => {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(212, 175, 55, 0.32);
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-family: var(--font-sans);
    `;

    const meta = document.createElement('div');
    meta.style.cssText = 'min-width: 0; flex: 1;';

    const tagParts = [place.ownerLabel, place.city].filter(Boolean);
    if (tagParts.length > 0) {
      const tag = document.createElement('div');
      const isDaulika = place.ownerLabel === 'Favorit Daulika';
      const isTogether = place.ownerLabel === 'Favorit Bersama';
      tag.style.cssText = `
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.6px;
        color: ${isDaulika ? '#ffb6c1' : isTogether ? '#f5e6a3' : 'var(--color-gold)'};
        margin-bottom: 4px;
      `;
      tag.textContent = tagParts.join(' • ');
      meta.appendChild(tag);
    }

    const title = document.createElement('div');
    title.style.cssText = 'font-family: var(--font-serif); font-size: 15px; font-weight: 600; color: #ffffff; line-height: 1.35;';
    title.textContent = place.name;
    meta.appendChild(title);
    card.appendChild(meta);

    if (place.mapsUrl) {
      const link = document.createElement('a');
      link.href = place.mapsUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.cssText = `
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 7px 11px;
        background: rgba(212, 175, 55, 0.16);
        border: 1px solid rgba(212, 175, 55, 0.55);
        border-radius: 6px;
        color: var(--color-gold-light);
        font-family: var(--font-sans);
        font-size: 11.5px;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
      `;
      link.textContent = '📍 Lokasi ↗';
      card.appendChild(link);
    }

    listWrap.appendChild(card);
  });

  content.appendChild(listWrap);

  return createModal({
    id: 'foodcourt-modal',
    title: '🍽️ Cita Rasa Favorit Adjie & Daulika',
    content
  });
}
