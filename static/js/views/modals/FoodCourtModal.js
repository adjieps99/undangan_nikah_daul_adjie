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
  listWrap.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

  restaurants.forEach((place) => {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(212, 175, 55, 0.32);
      border-radius: 10px;
      padding: 14px 15px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-family: var(--font-sans);
    `;

    const headerRow = document.createElement('div');
    headerRow.style.cssText = 'display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;';

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
        margin-bottom: 3px;
      `;
      tag.textContent = tagParts.join(' • ');
      meta.appendChild(tag);
    }

    const title = document.createElement('div');
    title.style.cssText = 'font-family: var(--font-serif); font-size: 15.5px; font-weight: 600; color: #ffffff; line-height: 1.35;';
    title.textContent = place.name;
    meta.appendChild(title);
    headerRow.appendChild(meta);

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
        padding: 6px 10px;
        background: rgba(212, 175, 55, 0.14);
        border: 1px solid rgba(212, 175, 55, 0.48);
        border-radius: 6px;
        color: var(--color-gold-light);
        font-family: var(--font-sans);
        font-size: 11px;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
      `;
      link.textContent = 'Lihat di Maps →';
      headerRow.appendChild(link);
    }

    card.appendChild(headerRow);

    if (Array.isArray(place.mustTry) && place.mustTry.length > 0) {
      const mustTryEl = document.createElement('div');
      mustTryEl.style.cssText = 'font-size: 12px; color: #f5e6a3; line-height: 1.45;';
      const label = document.createElement('span');
      label.style.cssText = 'font-weight: 700; color: var(--color-gold);';
      label.textContent = 'Must try: ';
      const items = document.createElement('span');
      items.textContent = place.mustTry.join(' • ');
      mustTryEl.appendChild(label);
      mustTryEl.appendChild(items);
      card.appendChild(mustTryEl);
    }

    if (place.note) {
      const noteEl = document.createElement('p');
      noteEl.style.cssText = 'font-size: 12.5px; color: #e8e0d4; line-height: 1.55; margin: 0;';
      noteEl.textContent = place.note;
      card.appendChild(noteEl);
    }

    listWrap.appendChild(card);
  });

  content.appendChild(listWrap);

  const closingNote = document.createElement('p');
  closingNote.className = 'foodcourt-closing-note';
  closingNote.style.cssText = `
    margin: 16px 0 2px;
    padding-top: 12px;
    border-top: 1px solid rgba(212, 175, 55, 0.24);
    text-align: center;
    font-family: var(--font-sans);
    font-size: 12.5px;
    font-style: italic;
    color: #ffbe97;
    line-height: 1.55;
  `;
  closingNote.textContent = 'Kalau kebetulan ketemu kami di salah satu tempat ini, jangan sungkan sapa-sapa ya!';
  content.appendChild(closingNote);

  return createModal({
    id: 'foodcourt-modal',
    title: '🍽️ Cita Rasa Favorit Adjie & Daulika',
    content
  });
}
