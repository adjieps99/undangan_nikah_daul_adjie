import { createModal } from '../../ui/Modal.js';
import { createRetroButton } from '../../ui/RetroButton.js';
import { gameState, MODALS, PHASES } from '../../state/GameState.js';

export function createRSVPModal() {
  const state = gameState.getState();
  const currentRSVP = state.rsvpData || {};
  const content = document.createElement('div');
  content.className = 'rsvp-modal-content';

  const choiceParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('choice') : null;
  let attending = choiceParam === 'declined' ? false : (currentRSVP.attending !== false);
  let guestCount = currentRSVP.guestCount || 1;

  content.innerHTML = `
    <!-- 1. Guest Name Welcome Banner -->
    <div class="rsvp-field-group" style="margin-bottom: 16px; text-align: center;">
      <span style="font-size: 11px; letter-spacing: 1.5px; color: var(--color-gold); font-weight: bold;">
        UNDANGAN PERNIKAHAN ADJIE & DAUL
      </span>
      <div id="rsvp-guest-name-display" style="
        font-family: var(--font-serif);
        font-size: 18px;
        font-weight: bold;
        color: #ffffff;
        margin-top: 4px;
      "></div>
      <p style="font-size: 12px; color: #ffbe97; margin: 4px 0 0;">
        Mohon konfirmasikan kehadiran Anda pada resepsi di Restoran The Hachi Garden.
      </p>
    </div>

    <!-- 2. Attendance Status: HADIR / TIDAK HADIR -->
    <div class="rsvp-field-group" style="margin-bottom: 20px;">
      <label style="display: block; font-size: 13px; font-weight: bold; color: #f5eedc; margin-bottom: 8px;">
        Konfirmasi Kehadiran:
      </label>
      <div class="rsvp-toggle-row" style="display: flex; gap: 10px;">
        <button type="button" class="rsvp-btn ${attending ? 'active' : ''}" id="rsvp-yes" style="
          flex: 1;
          padding: 14px 10px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          🎉 HADIR
        </button>
        <button type="button" class="rsvp-btn ${!attending ? 'active' : ''}" id="rsvp-no" style="
          flex: 1;
          padding: 14px 10px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          😔 TIDAK HADIR
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
      margin-bottom: 18px;
    ">
      <div class="rsvp-field-group" style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; color: #ffe4a0; margin-bottom: 6px;">
          Jumlah Tamu yang Hadir:
        </label>
        <select id="rsvp-count-select" class="retro-select" style="
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          background: #251d28;
          color: #fff;
          border: 1px solid var(--color-gold);
          font-size: 13px;
        ">
          <option value="1" ${guestCount === 1 ? 'selected' : ''}>1 Orang</option>
          <option value="2" ${guestCount === 2 ? 'selected' : ''}>2 Orang</option>
        </select>
      </div>
      <p style="font-size: 11px; color: #e0d0c0; margin: 6px 0 0; line-height: 1.4;">
        ✨ Meja dan jamuan resepsi Anda di Main Reception Hall The Hachi akan dipersiapkan dengan penuh sukacita.
      </p>
    </div>

    <!-- Notice Box for TIDAK HADIR -->
    <div id="rsvp-details-no" style="
      display: ${!attending ? 'block' : 'none'};
      background: rgba(255, 120, 120, 0.08);
      border: 1px solid rgba(255, 120, 120, 0.35);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 18px;
    ">
      <p style="font-size: 12px; color: #ffbebe; margin: 0; line-height: 1.4;">
        🕊️ Terima kasih atas doa restunya dari kejauhan. Kehangatan doa Anda tetap menyertai kebahagiaan Adjie & Daul.
      </p>
    </div>

    <!-- Result Confirmation Box (hidden by default) -->
    <div id="rsvp-result-box" style="display: none; padding: 12px; border-radius: 8px; margin-bottom: 14px; text-align: center;"></div>
  `;

  // UI Elements
  const guestNameDisplay = content.querySelector('#rsvp-guest-name-display');
  if (guestNameDisplay) {
    guestNameDisplay.textContent = state.guestName || 'Tamu Undangan';
  }

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
      const finalCount = attending ? parseInt(countSelect ? countSelect.value : '1') : 0;

      submitBtn.disabled = true;
      submitBtn.innerText = '⏳ MENYIMPAN KONFIRMASI...';

      const payload = {
        guest_name: state.guestName,
        attending: attending ? 1 : 0,
        guest_count: finalCount
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
          attending,
          guestCount: finalCount,
          submittedAt: new Date().toISOString()
        });

        if (attending) {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(50, 180, 80, 0.2)';
          resultBox.style.border = '1px solid #44ff66';
          resultBox.style.color = '#aaffaa';
          resultBox.innerHTML = '🎉 <strong>Konfirmasi Berhasil!</strong><br>Selamat datang di pernikahan Adjie & Daul. Membawa Anda masuk ke Main Reception Hall...';

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
          resultBox.innerHTML = '🕊️ <strong>Terima Kasih Banyak!</strong><br>Doa dan restu Anda telah tercatat dengan hangat.';

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

  submitBtn.style.marginTop = '14px';
  submitBtn.style.width = '100%';
  content.appendChild(submitBtn);

  return createModal({
    id: 'rsvp-modal',
    title: '✉️ KONFIRMASI KEHADIRAN (RSVP)',
    content: content
  });
}

