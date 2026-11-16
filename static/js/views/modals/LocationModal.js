import { createModal } from '../../ui/Modal.js';
import { WEDDING_DATA } from '../../data/wedding.js';

export function createLocationModal() {
  const content = document.createElement('div');
  content.className = 'location-modal-content';

  const evt = WEDDING_DATA.schedule.event;
  const venue = WEDDING_DATA.venue;

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 22px;">
      <span style="font-size: 10px; letter-spacing: 2px; color: var(--color-gold); font-weight: bold;">
        WAKTU &amp; LOKASI ACARA
      </span>
      <h3 style="font-family: var(--font-serif); font-size: 18px; color: #fff; margin: 8px 0 6px;">
        ${evt.title}
      </h3>
      <p style="font-size: 11px; color: #ffbe97; margin: 0; line-height: 1.5;">
        Merupakan kebahagiaan bagi kami apabila kamu bisa hadir dan berbagi doa di hari spesial ini.
      </p>
    </div>

    <div class="event-card" style="
      background: rgba(212, 175, 55, 0.08);
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 10px;
      padding: 20px 18px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    ">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 22px; line-height: 1;">🗓️</span>
        <div>
          <div style="font-size: 10px; color: var(--color-gold); font-weight: bold; letter-spacing: 1px;">TANGGAL ACARA</div>
          <div style="font-size: 13px; font-weight: bold; color: #fff; margin-top: 4px; line-height: 1.4;">${evt.date}</div>
        </div>
      </div>

      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 22px; line-height: 1;">⏰</span>
        <div>
          <div style="font-size: 10px; color: var(--color-gold); font-weight: bold; letter-spacing: 1px;">WAKTU</div>
          <div style="font-size: 13px; font-weight: bold; color: #fff; margin-top: 4px; line-height: 1.4;">${evt.time}</div>
        </div>
      </div>

      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 22px; line-height: 1;">📍</span>
        <div>
          <div style="font-size: 10px; color: var(--color-gold); font-weight: bold; letter-spacing: 1px;">LOKASI ACARA</div>
          <div style="font-size: 13px; font-weight: bold; color: #fff; margin-top: 4px; line-height: 1.4;">${venue.name}</div>
          <div style="font-size: 11px; color: #e2dad0; margin-top: 4px; line-height: 1.5;">${venue.address}</div>
        </div>
      </div>
    </div>

    <div style="margin-top: 18px; text-align: center;">
      <a href="${venue.mapsUrl}" target="_blank" rel="noopener noreferrer" style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 13px 18px;
        background: linear-gradient(135deg, #d4af37 0%, #b89228 100%);
        color: #121008;
        font-family: var(--font-pixel);
        font-size: 11px;
        font-weight: bold;
        text-decoration: none;
        border: 2px solid #000;
        border-radius: 6px;
        box-shadow: 3px 3px 0 #000;
      ">
        <span>🗺️ Buka di Google Maps</span>
        <span style="font-size: 14px;">↗</span>
      </a>
    </div>
  `;

  return createModal({
    id: 'location-modal',
    title: '📍 LOKASI & JADWAL ACARA',
    content
  });
}
