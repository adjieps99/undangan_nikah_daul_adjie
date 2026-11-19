import { createModal } from '../../ui/Modal.js';
import { createRetroButton } from '../../ui/RetroButton.js';
import { gameState, PHASES } from '../../state/GameState.js';

export function createRSVPModal() {
  const state = gameState.getState();
  const currentRSVP = state.rsvpData || {};
  const content = document.createElement('div');
  content.className = 'rsvp-modal-content';

  const alreadyConfirmed = currentRSVP.attending === true || currentRSVP.attending === false;
  let editMode = !alreadyConfirmed;

  const choiceParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('choice') : null;
  let attending = choiceParam === 'declined' ? false : (currentRSVP.attending === false ? false : true);

  const formatTimestamp = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return '';
    }
  };

  const renderBody = () => {
    content.innerHTML = '';

    // 1. Guest Name & Strict One-Person Policy Banner
    const headerGroup = document.createElement('div');
    headerGroup.className = 'rsvp-field-group';
    headerGroup.style.cssText = 'margin-bottom: 16px; text-align: center; font-family: var(--font-sans);';

    const guestNameEl = document.createElement('div');
    guestNameEl.id = 'rsvp-guest-name-display';
    guestNameEl.style.cssText = 'font-family: var(--font-serif); font-size: 20px; font-weight: bold; color: #ffffff; margin-top: 2px; overflow-wrap: break-word;';
    guestNameEl.textContent = state.guestName || 'Tamu Undangan';

    const policyBadge = document.createElement('div');
    policyBadge.id = 'rsvp-policy-badge';
    policyBadge.style.cssText = 'display: inline-block; margin-top: 8px; padding: 5px 14px; background: rgba(212, 175, 55, 0.16); border: 1px solid var(--color-gold); border-radius: 16px; font-size: 12px; font-weight: 700; color: var(--color-gold-light);';
    policyBadge.textContent = 'Undangan ini berlaku untuk 1 orang.';

    const introText = document.createElement('p');
    introText.style.cssText = 'font-size: 13px; color: #ffbe97; margin: 10px 0 0; line-height: 1.55;';
    introText.textContent = 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Sahabat dapat hadir memberikan doa restu.';

    headerGroup.appendChild(guestNameEl);
    headerGroup.appendChild(policyBadge);
    headerGroup.appendChild(introText);
    content.appendChild(headerGroup);

    // 2. Confirmed Summary State (does not repeatedly ask the same question once confirmed)
    if (!editMode && alreadyConfirmed) {
      const confirmedAttending = currentRSVP.attending === true;
      const statusCard = document.createElement('div');
      statusCard.id = 'rsvp-confirmed-summary';
      statusCard.style.cssText = `
        background: ${confirmedAttending ? 'rgba(50, 180, 80, 0.14)' : 'rgba(212, 175, 55, 0.12)'};
        border: 1px solid ${confirmedAttending ? 'rgba(85, 220, 120, 0.55)' : 'rgba(212, 175, 55, 0.55)'};
        border-radius: 8px;
        padding: 16px 14px;
        margin-bottom: 14px;
        text-align: center;
        font-family: var(--font-sans);
      `;

      const statusTitle = document.createElement('div');
      statusTitle.style.cssText = `font-size: 14px; font-weight: 700; color: ${confirmedAttending ? '#a8f5be' : '#ffe4a0'}; margin-bottom: 6px;`;
      statusTitle.textContent = confirmedAttending
        ? 'Status Konfirmasi: Akan Hadir (1 Orang)'
        : 'Status Konfirmasi: Maaf, Tidak Dapat Hadir';

      const statusDesc = document.createElement('p');
      statusDesc.style.cssText = 'font-size: 12.5px; color: #f0e8dc; margin: 0; line-height: 1.5;';
      statusDesc.textContent = confirmedAttending
        ? 'Kehadiran Anda sudah kami catat. Undangan ini berlaku untuk 1 orang.'
        : 'Terima kasih sudah mengabarkan. Doa dan restu Anda sangat berarti bagi kami.';

      statusCard.appendChild(statusTitle);
      statusCard.appendChild(statusDesc);

      const formattedTime = formatTimestamp(currentRSVP.submittedAt);
      if (formattedTime) {
        const timeEl = document.createElement('div');
        timeEl.style.cssText = 'font-size: 11px; color: #b9b2a4; margin-top: 8px;';
        timeEl.textContent = `Tercatat pada: ${formattedTime}`;
        statusCard.appendChild(timeEl);
      }

      content.appendChild(statusCard);

      if (confirmedAttending) {
        const enterHallBtn = createRetroButton({
          text: 'Masuk ke Ruang Ramah Tamah',
          onClick: () => {
            gameState.setState({
              lastOutdoorPosition: { x: 0.0, y: 5.0, z: -14.0, rotY: Math.PI },
              hallEntranceNotice: true
            });
            gameState.setModal(null);
            gameState.setPhase(PHASES.MAIN_HALL);
          }
        });
        enterHallBtn.style.width = '100%';
        enterHallBtn.style.marginBottom = '8px';
        content.appendChild(enterHallBtn);
      }

      const changeBtn = createRetroButton({
        text: 'Ubah Jawaban Konfirmasi',
        variant: 'secondary',
        onClick: () => {
          editMode = true;
          attending = confirmedAttending;
          renderBody();
        }
      });
      changeBtn.style.width = '100%';
      changeBtn.style.fontSize = '11px';
      content.appendChild(changeBtn);
      return;
    }

    // 3. Single Question: "Apakah Anda akan hadir?" with 2 choices
    const questionWrap = document.createElement('div');
    questionWrap.className = 'rsvp-field-group';
    questionWrap.style.cssText = 'margin-bottom: 14px; font-family: var(--font-sans);';
    questionWrap.innerHTML = `
      <label style="display: block; font-size: 13.5px; font-weight: 700; color: #f5eedc; margin-bottom: 10px; text-align: center;">
        Apakah Anda akan hadir?
      </label>
      <div class="rsvp-toggle-row" style="display: flex; flex-direction: column; gap: 8px;">
        <button type="button" class="wish-vis-pill ${attending ? 'active' : ''}" id="rsvp-yes">
          Ya, saya akan hadir.
        </button>
        <button type="button" class="wish-vis-pill ${!attending ? 'active' : ''}" id="rsvp-no">
          Maaf, saya tidak dapat hadir.
        </button>
      </div>
    `;
    content.appendChild(questionWrap);

    const detailBox = document.createElement('div');
    detailBox.id = 'rsvp-policy-summary';
    detailBox.style.cssText = `
      background: ${attending ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 140, 140, 0.08)'};
      border: 1px solid ${attending ? 'rgba(212, 175, 55, 0.35)' : 'rgba(255, 140, 140, 0.35)'};
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 14px;
      font-family: var(--font-sans);
      font-size: 12.5px;
      line-height: 1.5;
      color: ${attending ? '#f5e6a3' : '#ffbebe'};
      text-align: center;
    `;
    detailBox.textContent = attending
      ? 'Konfirmasi berlaku untuk 1 orang tamu undangan.'
      : 'Terima kasih atas doa restunya dari kejauhan.';
    content.appendChild(detailBox);

    const resultBox = document.createElement('div');
    resultBox.id = 'rsvp-result-box';
    resultBox.style.cssText = 'display: none; font-family: var(--font-sans); padding: 12px; border-radius: 8px; margin-bottom: 14px; text-align: center; font-size: 12.5px; line-height: 1.45;';
    content.appendChild(resultBox);

    const btnYes = questionWrap.querySelector('#rsvp-yes');
    const btnNo = questionWrap.querySelector('#rsvp-no');

    btnYes.addEventListener('click', () => {
      attending = true;
      btnYes.classList.add('active');
      btnNo.classList.remove('active');
      detailBox.style.background = 'rgba(212, 175, 55, 0.08)';
      detailBox.style.borderColor = 'rgba(212, 175, 55, 0.35)';
      detailBox.style.color = '#f5e6a3';
      detailBox.textContent = 'Konfirmasi berlaku untuk 1 orang tamu undangan.';
    });

    btnNo.addEventListener('click', () => {
      attending = false;
      btnNo.classList.add('active');
      btnYes.classList.remove('active');
      detailBox.style.background = 'rgba(255, 140, 140, 0.08)';
      detailBox.style.borderColor = 'rgba(255, 140, 140, 0.35)';
      detailBox.style.color = '#ffbebe';
      detailBox.textContent = 'Terima kasih atas doa restunya dari kejauhan.';
    });

    const submitBtn = createRetroButton({
      text: 'Simpan Konfirmasi',
      onClick: async () => {
        const finalCount = attending ? 1 : 0;
        submitBtn.disabled = true;
        submitBtn.innerText = 'Menyimpan...';

        const latestState = gameState.getState();
        const payload = {
          guest_name: latestState.guestName,
          attending: attending ? 1 : 0,
          guest_count: finalCount,
          invitation_category: 'B'
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
            resultBox.innerText = `Gagal menyimpan konfirmasi: ${rsvpData.message || 'Terjadi gangguan koneksi.'}`;
            submitBtn.disabled = false;
            submitBtn.innerText = 'Simpan Konfirmasi';
            return;
          }

          const activeRsvpId = rsvpData.rsvp_id || currentRSVP.rsvp_id;
          const activeRsvpToken = rsvpData.rsvp_token || currentRSVP.rsvp_token;

          gameState.saveRSVP({
            rsvp_id: activeRsvpId,
            rsvp_token: activeRsvpToken,
            guestName: rsvpData.guest_name || latestState.guestName,
            category: 'B',
            attending,
            guestCount: finalCount,
            rsvp_status: attending ? 'WILL_ATTEND' : 'DECLINED',
            submittedAt: rsvpData.confirmed_at || new Date().toISOString()
          });

          if (attending) {
            resultBox.style.display = 'block';
            resultBox.style.background = 'rgba(50, 180, 80, 0.2)';
            resultBox.style.border = '1px solid #44ff66';
            resultBox.style.color = '#aaffaa';
            resultBox.innerHTML = '<strong>Konfirmasi Berhasil!</strong><br>Undangan ini berlaku untuk 1 orang. Membawa Anda masuk ke Ruang Ramah Tamah...';

            setTimeout(() => {
              gameState.setState({
                lastOutdoorPosition: { x: 0.0, y: 5.0, z: -14.0, rotY: Math.PI },
                hallEntranceNotice: true
              });
              gameState.setModal(null);
              gameState.setPhase(PHASES.MAIN_HALL);
            }, 1100);
          } else {
            resultBox.style.display = 'block';
            resultBox.style.background = 'rgba(212, 175, 55, 0.2)';
            resultBox.style.border = '1px solid var(--color-gold)';
            resultBox.style.color = '#ffe4a0';
            resultBox.innerHTML = '<strong>Terima Kasih Banyak!</strong><br>Konfirmasi Anda telah tersimpan.';

            submitBtn.innerText = 'Kembali Jelajahi Kebun';
            submitBtn.disabled = false;
            submitBtn.onclick = () => {
              gameState.setModal(null);
            };
          }
        } catch {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(255, 60, 60, 0.2)';
          resultBox.style.border = '1px solid #ff4444';
          resultBox.style.color = '#ff9999';
          resultBox.innerText = 'Koneksi terputus. Pastikan perangkat Anda terhubung ke internet dan coba lagi.';
          submitBtn.disabled = false;
          submitBtn.innerText = 'Simpan Konfirmasi';
        }
      }
    });

    submitBtn.style.width = '100%';
    content.appendChild(submitBtn);
  };

  renderBody();

  return createModal({
    id: 'rsvp-modal',
    title: 'KONFIRMASI KEHADIRAN',
    content
  });
}
