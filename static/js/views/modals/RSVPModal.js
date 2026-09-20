import { createModal } from '../../ui/Modal.js';
import { createRetroButton } from '../../ui/RetroButton.js';
import { gameState } from '../../state/GameState.js';
import { SEAT_GRID, canSelectSeat } from '../../data/wedding.js';

export function createRSVPModal() {
  const state = gameState.getState();
  const currentRSVP = state.rsvpData;
  const content = document.createElement('div');
  content.className = 'rsvp-modal-content';

  let attending = currentRSVP.attending !== false;
  let guestCount = currentRSVP.guestCount || 1;
  let group = currentRSVP.group || 'Keluarga'; // 'Keluarga' | 'Teman'
  let selectedSeats = Array.isArray(currentRSVP.selectedSeats) ? currentRSVP.selectedSeats : [];

  content.innerHTML = `
    <!-- 1. Guest Name Label -->
    <div class="rsvp-field-group">
      <label>Nama Tamu:</label>
      <div style="font-family: var(--font-serif); font-size: 16px; color: var(--color-gold);">${state.guestName}</div>
    </div>

    <!-- 2. Attendance Status -->
    <div class="rsvp-field-group">
      <label>Konfirmasi Kehadiran:</label>
      <div class="rsvp-toggle-row">
        <button type="button" class="rsvp-btn ${attending ? 'active' : ''}" id="rsvp-yes">
          YES, AKAN HADIR 🎉
        </button>
        <button type="button" class="rsvp-btn ${!attending ? 'active' : ''}" id="rsvp-no">
          MAAF, TDK DAPAT HADIR 😔
        </button>
      </div>
    </div>

    <!-- Attendance Details Wrapper -->
    <div id="rsvp-details-wrapper" style="display: ${attending ? 'block' : 'none'};">
      <!-- 3. Guest Count -->
      <div class="rsvp-field-group">
        <label>Jumlah Tamu (termasuk Anda):</label>
        <select id="rsvp-count-select" class="retro-select">
          <option value="1" ${guestCount === 1 ? 'selected' : ''}>1 Orang</option>
          <option value="2" ${guestCount === 2 ? 'selected' : ''}>2 Orang</option>
          <option value="3" ${guestCount === 3 ? 'selected' : ''}>3 Orang</option>
          <option value="4" ${guestCount === 4 ? 'selected' : ''}>4 Orang</option>
        </select>
      </div>

      <!-- 4. Guest Group Category -->
      <div class="rsvp-field-group">
        <label>Kelompok Tamu:</label>
        <div class="rsvp-toggle-row">
          <button type="button" class="group-btn ${group === 'Keluarga' ? 'active' : ''}" id="grp-family">
            👨‍👩‍👧‍👦 KELUARGA (Row A-B)
          </button>
          <button type="button" class="group-btn ${group === 'Teman' ? 'active' : ''}" id="grp-friends">
            🤝 TEMAN (Row C-H)
          </button>
        </div>
      </div>

      <!-- 5. Interactive Seat Selector Grid -->
      <div class="rsvp-field-group">
        <label id="seats-header-label">Pilih Kursi Tempat Duduk (${group}):</label>
        <div class="seating-grid" id="seats-container"></div>
      </div>
    </div>
  `;

  // UI Handlers
  const btnYes = content.querySelector('#rsvp-yes');
  const btnNo = content.querySelector('#rsvp-no');
  const detailsWrapper = content.querySelector('#rsvp-details-wrapper');
  const grpFamily = content.querySelector('#grp-family');
  const grpFriends = content.querySelector('#grp-friends');
  const seatsContainer = content.querySelector('#seats-container');
  const seatsHeaderLabel = content.querySelector('#seats-header-label');
  const countSelect = content.querySelector('#rsvp-count-select');

  const renderSeats = () => {
    seatsContainer.innerHTML = '';
    seatsHeaderLabel.innerText = `Pilih Kursi Tempat Duduk (${group}):`;

    SEAT_GRID.forEach(seat => {
      const isValidForGroup = canSelectSeat(group, seat);
      const isSelected = selectedSeats.includes(seat.id);

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `seat-pill ${isSelected ? 'selected' : ''} ${!isValidForGroup ? 'disabled' : ''}`;
      pill.innerHTML = `🪑 ${seat.label} ${!isValidForGroup ? '(Khusus ' + seat.group + ')' : ''}`;

      if (isValidForGroup) {
        pill.addEventListener('click', () => {
          const maxSeats = parseInt(countSelect.value || '1');
          if (selectedSeats.includes(seat.id)) {
            selectedSeats = selectedSeats.filter(id => id !== seat.id);
          } else {
            if (selectedSeats.length >= maxSeats) {
              selectedSeats.shift();
            }
            selectedSeats.push(seat.id);
          }
          renderSeats();
        });
      } else {
        pill.disabled = true;
        pill.style.opacity = '0.4';
        pill.style.cursor = 'not-allowed';
      }

      seatsContainer.appendChild(pill);
    });
  };

  btnYes.addEventListener('click', () => {
    attending = true;
    btnYes.classList.add('active');
    btnNo.classList.remove('active');
    detailsWrapper.style.display = 'block';
  });

  btnNo.addEventListener('click', () => {
    attending = false;
    btnNo.classList.add('active');
    btnYes.classList.remove('active');
    detailsWrapper.style.display = 'none';
  });

  grpFamily.addEventListener('click', () => {
    group = 'Keluarga';
    grpFamily.classList.add('active');
    grpFriends.classList.remove('active');
    selectedSeats = [];
    renderSeats();
  });

  grpFriends.addEventListener('click', () => {
    group = 'Teman';
    grpFriends.classList.add('active');
    grpFamily.classList.remove('active');
    selectedSeats = [];
    renderSeats();
  });

  countSelect.addEventListener('change', () => {
    selectedSeats = [];
    renderSeats();
  });

  // Initial Seat Render
  renderSeats();

  const submitBtn = createRetroButton({
    text: '💾 SIMPAN RSVPMU',
    onClick: () => {
      const finalCount = parseInt(countSelect ? countSelect.value : '1');

      gameState.saveRSVP({
        guestName: state.guestName,
        attending,
        guestCount: attending ? finalCount : 0,
        group: attending ? group : null,
        selectedSeats: attending ? selectedSeats : [],
        submittedAt: new Date().toISOString()
      });

      alert(`Terima kasih ${state.guestName}! RSVP Anda berhasil disimpan.`);
      gameState.setModal(null);
    }
  });

  submitBtn.style.marginTop = '16px';
  submitBtn.style.width = '100%';
  content.appendChild(submitBtn);

  return createModal({
    id: 'rsvp-modal',
    title: '✉️ KONFIRMASI RSVP & SEATING',
    content: content
  });
}
