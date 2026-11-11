import { createModal } from '../../ui/Modal.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createLocationModal() {
  const content = document.createElement('div');
  content.className = 'location-modal-content';

  const evt = WEDDING_DATA.schedule.event;
  const venue = WEDDING_DATA.venue;

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 10px; letter-spacing: 2px; color: var(--color-gold); font-weight: bold;">
        WAKTU & TEMPAT
      </span>
      <h3 style="font-size: 16px; color: #fff; margin: 6px 0 2px;">
        ${evt.title}
      </h3>
      <p style="font-size: 11px; color: #ffbe97; margin-top: 4px;">
        Kami sangat menantikan kehadiran Bapak/Ibu/Sahabat sekalian
      </p>
    </div>

    <!-- Event Schedule Card with Generous Vertical Spacing -->
    <div class="event-card" style="
      background: rgba(212, 175, 55, 0.08);
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 10px;
      padding: 18px 16px;
      margin-bottom: 18px;
    ">
      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;">
        <span style="font-size: 24px;">🗓️</span>
        <div>
          <div style="font-size: 10px; color: var(--color-gold); font-weight: bold; letter-spacing: 1px;">HARI & TANGGAL</div>
          <div style="font-size: 13px; font-weight: bold; color: #fff; margin-top: 2px;">${evt.date}</div>
        </div>
      </div>

      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;">
        <span style="font-size: 24px;">⏰</span>
        <div>
          <div style="font-size: 10px; color: var(--color-gold); font-weight: bold; letter-spacing: 1px;">WAKTU ACARA</div>
          <div style="font-size: 13px; font-weight: bold; color: #fff; margin-top: 2px;">${evt.time}</div>
        </div>
      </div>

      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 24px;">📍</span>
        <div>
          <div style="font-size: 10px; color: var(--color-gold); font-weight: bold; letter-spacing: 1px;">LOKASI VENUE</div>
          <div style="font-size: 13px; font-weight: bold; color: #fff; margin-top: 2px;">${venue.name}</div>
          <div style="font-size: 11px; opacity: 0.85; margin-top: 2px; line-height: 1.4;">${venue.address}</div>
        </div>
      </div>
    </div>

    <!-- Clickable Maps Action Link with Generous Margin -->
    <div style="margin-top: 20px; text-align: center;">
      <a href="${venue.mapsUrl}" target="_blank" rel="noopener noreferrer" style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 12px 18px;
        background: linear-gradient(135deg, #d4af37 0%, #b89228 100%);
        color: #121008;
        font-family: var(--font-pixel);
        font-size: 11px;
        font-weight: bold;
        text-decoration: none;
        border: 2px solid #000;
        border-radius: 6px;
        box-shadow: 3px 3px 0 #000;
        transition: transform 0.15s, box-shadow 0.15s;
      ">
        <span>🗺️ BUKA GOOGLE MAPS</span>
        <span style="font-size: 14px;">↗</span>
      </a>
    </div>
  `;

  return createModal({
    id: 'location-modal',
    title: '📜 WAKTU & LOKASI ACARA',
    content: content
  });
}
