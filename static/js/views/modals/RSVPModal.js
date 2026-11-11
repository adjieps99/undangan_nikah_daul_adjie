import { createModal } from '../../ui/Modal.js';
import { createRetroButton } from '../../ui/RetroButton.js';
import { gameState, PHASES } from '../../state/GameState.js';

export function createRSVPModal() {
  const state = gameState.getState();
  const currentRSVP = state.rsvpData || {};
  const content = document.createElement('div');
  content.className = 'rsvp-modal-content';

  const category = state.guestCategory || 'A';
  const isCategoryB = category === 'B';

  const choiceParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('choice') : null;
  let attending = choiceParam === 'declined' ? false : (currentRSVP.attending !== false);
  let guestCount = isCategoryB ? 1 : (currentRSVP.guestCount || 1);

  content.innerHTML = `
    <!-- 1. Guest Name Welcome Banner -->
    <div class="rsvp-field-group" style="margin-bottom: 16px; text-align: center;">
      <span style="font-size: 10px; letter-spacing: 2px; color: var(--color-gold); font-weight: bold;">
        KONFIRMASI KEHADIRAN (RSVP)
      </span>
      <div id="rsvp-guest-name-display" style="
        font-family: var(--font-serif);
        font-size: 18px;
        font-weight: bold;
        color: #ffffff;
        margin-top: 4px;
      ">${state.guestName || 'Tamu Undangan'}</div>
      
      <!-- Invitation Category Badge -->
      <div style="
        display: inline-block;
        margin-top: 6px;
        padding: 4px 12px;
        background: ${isCategoryB ? 'rgba(255, 180, 100, 0.15)' : 'rgba(212, 175, 55, 0.18)'};
        border: 1px solid ${isCategoryB ? '#ffb464' : 'var(--color-gold)'};
        border-radius: 20px;
        font-size: 10.5px;
        font-weight: bold;
        color: ${isCategoryB ? '#ffd29d' : 'var(--color-gold-light)'};
      ">
        ${isCategoryB ? '🔖 Berlaku untuk 1 orang' : '🔖 Berlaku untuk maksimal 2 orang'}
      </div>

      <p style="font-size: 11px; color: #ffbe97; margin: 8px 0 0; line-height: 1.4;">
        Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Sahabat dapat hadir memberikan doa restu.
      </p>
    </div>

    <!-- 2. Attendance Status: HADIR / TIDAK HADIR -->
    <div class="rsvp-field-group" style="margin-bottom: 16px;">
      <label style="display: block; font-size: 12px; font-weight: bold; color: #f5eedc; margin-bottom: 8px; text-align: center;">
        Apakah Anda berkenan hadir?
      </label>
      <div class="rsvp-toggle-row" style="display: flex; gap: 10px;">
        <button type="button" class="rsvp-btn ${attending ? 'active' : ''}" id="rsvp-yes" style="
          flex: 1;
          padding: 12px 10px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          🎉 HADIR
        </button>
        <button type="button" class="rsvp-btn ${!attending ? 'active' : ''}" id="rsvp-no" style="
          flex: 1;
          padding: 12px 10px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          🕊️ BELUM BISA HADIR
        </button>
      </div>
    </div>

    <!-- Attendance Details Box for HADIR -->
    <div id="rsvp-details-yes" style="
      display: ${attending ? 'block' : 'none'};
      background: rgba(212, 175, 55, 0.08);
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
    ">
      <div class="rsvp-field-group" style="margin-bottom: 6px;">
        <label style="display: block; font-size: 11px; color: #ffe4a0; margin-bottom: 6px; font-weight: bold;">
          Jumlah Kehadiran:
        </label>
        ${isCategoryB ? `
          <div style="
            padding: 9px 12px;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(212, 175, 55, 0.4);
            border-radius: 6px;
            font-size: 12px;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <span>👤 1 Orang</span>
            <span style="font-size: 10px; color: #ffbe97; font-style: italic;">Berlaku untuk 1 orang</span>
          </div>
        ` : `
          <select id="rsvp-count-select" class="retro-select" style="
            width: 100%;
            padding: 8px 12px;
            border-radius: 6px;
            background: #251d28;
            color: #fff;
            border: 1px solid var(--color-gold);
            font-size: 12px;
          ">
            <option value="1" ${guestCount === 1 ? 'selected' : ''}>👤 1 Orang</option>
            <option value="2" ${guestCount === 2 ? 'selected' : ''}>👥 2 Orang</option>
          </select>
        `}
      </div>
      <p style="font-size: 10.5px; color: #e0d0c0; margin: 8px 0 0; line-height: 1.45;">
        ✨ Meja dan jamuan resepsi Anda di The Hachi Garden akan kami persiapkan dengan penuh sukacita.
      </p>
    </div>

    <!-- Notice Box for TIDAK HADIR -->
    <div id="rsvp-details-no" style="
      display: ${!attending ? 'block' : 'none'};
      background: rgba(255, 140, 140, 0.08);
      border: 1px solid rgba(255, 140, 140, 0.35);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
    ">
      <p style="font-size: 11.5px; color: #ffbebe; margin: 0; line-height: 1.45;">
        🕊️ Terima kasih atas doa restunya dari kejauhan. Kehangatan doa Anda tetap menyertai langkah baru kami.
      </p>
    </div>

    <!-- Result Confirmation Feedback Box -->
    <div id="rsvp-result-box" style="display: none; padding: 12px; border-radius: 8px; margin-bottom: 14px; text-align: center; font-size: 11.5px; line-height: 1.4;"></div>
  `;

  const btnYes = content.querySelector('#rsvp-yes');
  const btnNo = content.querySelector('#rsvp-no');
  const detailsYes = content.querySelector('#rsvp-details-yes');
  const detailsNo = content.querySelector('#rsvp-details-no');
  const countSelect = content.querySelector('#rsvp-count-select');
  const resultBox = content.querySelector('#rsvp-result-box');

  btnYes.addEventListener('click', () => {
    attending = true;
    btnYes.classList.add('active');
    btnNo.classList.remove('active');
    detailsYes.style.display = 'block';
    detailsNo.style.display = 'none';
  });

  btnNo.addEventListener('click', () => {
    attending = false;
    btnNo.classList.add('active');
    btnYes.classList.remove('active');
    detailsYes.style.display = 'none';
    detailsNo.style.display = 'block';
  });

  // Action Submit Button
  const submitBtn = createRetroButton({
    text: '💾 SIMPAN KONFIRMASI RSVP',
    onClick: async () => {
      let finalCount = 0;
      if (attending) {
        finalCount = isCategoryB ? 1 : parseInt(countSelect ? countSelect.value : '1', 10);
      }

      submitBtn.disabled = true;
      submitBtn.innerText = '⏳ MENYIMPAN KONFIRMASI...';

      const payload = {
        guest_name: state.guestName,
        attending: attending ? 1 : 0,
        guest_count: finalCount,
        group_category: category
      };

      try {
        let rsvpResponse;
        if (currentRSVP && currentRSVP.rsvp_id && currentRSVP.rsvp_token) {
          rsvpResponse = await fetch(`/api/rsvp/${currentRSVP.rsvp_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-RSVP-Token': currentRSVP.rsvp_token
            },
            body: JSON.stringify(payload)
          });
        } else {
          rsvpResponse = await fetch('/api/rsvp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        const rsvpData = await rsvpResponse.json();

        if (!rsvpResponse.ok || rsvpData.status !== 'ok') {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(255, 60, 60, 0.2)';
          resultBox.style.border = '1px solid #ff4444';
          resultBox.style.color = '#ff9999';
          resultBox.innerText = `Gagal menyimpan RSVP: ${rsvpData.message || 'Terjadi gangguan koneksi.'}`;
          submitBtn.disabled = false;
          submitBtn.innerText = '💾 SIMPAN KONFIRMASI RSVP';
          return;
        }

        const activeRsvpId = rsvpData.rsvp_id || currentRSVP.rsvp_id;
        const activeRsvpToken = rsvpData.rsvp_token || currentRSVP.rsvp_token;

        // Persist confirmed status in game state
        gameState.saveRSVP({
          rsvp_id: activeRsvpId,
          rsvp_token: activeRsvpToken,
          guestName: state.guestName,
          category,
          attending,
          guestCount: finalCount,
          submittedAt: new Date().toISOString()
        });

        if (attending) {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(50, 180, 80, 0.2)';
          resultBox.style.border = '1px solid #44ff66';
          resultBox.style.color = '#aaffaa';
          resultBox.innerHTML = '🎉 <strong>Konfirmasi Berhasil!</strong><br>Terima kasih banyak. Membawa Anda masuk ke Main Reception Hall...';

          setTimeout(() => {
            gameState.setState({
              lastOutdoorPosition: { x: 0.0, y: 5.0, z: -14.0, rotY: Math.PI }
            });
            gameState.setModal(null);
            gameState.setPhase(PHASES.MAIN_HALL);
          }, 1200);
        } else {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(212, 175, 55, 0.2)';
          resultBox.style.border = '1px solid var(--color-gold)';
          resultBox.style.color = '#ffe4a0';
          resultBox.innerHTML = '🕊️ <strong>Terima Kasih Banyak!</strong><br>Doa dan restu Anda telah tersimpan dengan hangat.';

          submitBtn.innerText = '🌿 KEMBALI JELAJAHI KEBUN';
          submitBtn.disabled = false;
          submitBtn.onclick = () => {
            gameState.setModal(null);
          };
        }
      } catch (err) {
        resultBox.style.display = 'block';
        resultBox.style.background = 'rgba(255, 60, 60, 0.2)';
        resultBox.style.border = '1px solid #ff4444';
        resultBox.style.color = '#ff9999';
        resultBox.innerText = 'Koneksi terputus. Pastikan perangkat Anda terhubung ke internet dan coba lagi.';
        submitBtn.disabled = false;
        submitBtn.innerText = '💾 SIMPAN KONFIRMASI RSVP';
      }
    }
  });

  submitBtn.style.marginTop = '10px';
  submitBtn.style.width = '100%';
  content.appendChild(submitBtn);

  return createModal({
    id: 'rsvp-modal',
    title: '✉️ KONFIRMASI KEHADIRAN (RSVP)',
    content: content
  });
}
