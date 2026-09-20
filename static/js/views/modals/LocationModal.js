import { createModal } from '../../ui/Modal.js';
import { createRetroButton } from '../../ui/RetroButton.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createLocationModal() {
  const content = document.createElement('div');
  content.className = 'location-modal-content';

  const akad = WEDDING_DATA.schedule.akad;
  const resepsi = WEDDING_DATA.schedule.resepsi;
  const venue = WEDDING_DATA.venue;
  const dress = WEDDING_DATA.dressCode;

  content.innerHTML = `
    <div class="schedule-timeline">
      <!-- Akad Nikah -->
      <div class="event-card">
        <div class="event-badge">${akad.title}</div>
        <div class="event-time">⏰ ${akad.time}</div>
        <div class="event-location">📍 ${akad.location}</div>
      </div>

      <!-- Resepsi Pernikahan -->
      <div class="event-card">
        <div class="event-badge">${resepsi.title}</div>
        <div class="event-time">⏰ ${resepsi.time}</div>
        <div class="event-location">📍 ${resepsi.location}</div>
      </div>
    </div>

    <!-- Venue Address -->
    <div class="event-card" style="margin-bottom: 10px; border-color: var(--color-gold);">
      <div class="event-badge" style="color: var(--color-gold-light);">🏢 LOKASI ACARA</div>
      <div class="event-location"><strong>${venue.name}</strong><br>${venue.address}</div>
    </div>

    <!-- Dress Code -->
    <div class="dresscode-box">
      <div class="dresscode-title">👗 ${dress.title}</div>
      <div class="dresscode-tags">
        ${dress.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>
  `;

  const mapBtn = createRetroButton({
    text: '🗺️ BUKA GOOGLE MAPS',
    onClick: () => {
      window.open(venue.mapsUrl, '_blank');
    }
  });
  mapBtn.style.marginTop = '12px';
  mapBtn.style.width = '100%';
  content.appendChild(mapBtn);

  return createModal({
    id: 'location-modal',
    title: '📜 WAKTU & LOKASI ACARA',
    content: content
  });
}
