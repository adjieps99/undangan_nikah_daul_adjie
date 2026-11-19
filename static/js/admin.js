const TOKEN_KEY = 'hachi_admin_session_token';

const loginSection = document.getElementById('admin-login-section');
const dashboardSection = document.getElementById('admin-dashboard-section');
const loginForm = document.getElementById('admin-login-form');
const accessKeyInput = document.getElementById('admin-access-key');
const loginError = document.getElementById('admin-login-error');
const logoutBtn = document.getElementById('admin-logout-btn');

const tabInvBtn = document.getElementById('tab-invitations');
const tabWishBtn = document.getElementById('tab-wishes');
const panelInv = document.getElementById('panel-invitations');
const panelWish = document.getElementById('panel-wishes');

const quickGuestNameInput = document.getElementById('quick-guest-name');
const quickLinkPreview = document.getElementById('quick-link-preview');
const quickCopyBtn = document.getElementById('quick-copy-btn');
const quickWaBtn = document.getElementById('quick-wa-btn');
const quickPreviewBtn = document.getElementById('quick-preview-btn');

const invStatsGrid = document.getElementById('inv-stats-grid');
const invSearch = document.getElementById('inv-search');
const invStatusFilter = document.getElementById('inv-status-filter');
const invExportBtn = document.getElementById('inv-export-btn');
const invTableBody = document.getElementById('inv-table-body');

const wishStatsGrid = document.getElementById('wish-stats-grid');
const wishSearch = document.getElementById('wish-search');
const wishStatusFilter = document.getElementById('wish-status-filter');
const wishVisFilter = document.getElementById('wish-vis-filter');
const wishRefreshBtn = document.getElementById('wish-refresh-btn');
const wishTableBody = document.getElementById('wish-table-body');

const editModal = document.getElementById('edit-guest-modal');
const editForm = document.getElementById('edit-guest-form');
const editNoInput = document.getElementById('edit-guest-no');
const editOriginalEl = document.getElementById('edit-guest-original');
const editNameInput = document.getElementById('edit-guest-name-input');
const editCancelBtn = document.getElementById('edit-guest-cancel');

const toastEl = document.getElementById('admin-toast');
let toastTimer = null;
let currentBaseUrl = window.location.origin;

function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 3000);
}

async function copyText(text, successMsg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg);
  } catch {
    showToast('Gagal menyalin otomatis. Salin link secara manual.');
  }
}

async function adminFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    setToken('');
    showLoginScreen('Sesi berakhir. Silakan masuk kembali.');
    throw new Error('Unauthorized');
  }
  return res;
}

function showLoginScreen(errMsg = '') {
  dashboardSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  if (errMsg) {
    loginError.textContent = errMsg;
    loginError.classList.remove('hidden');
  } else {
    loginError.classList.add('hidden');
  }
}

function showDashboard() {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  updateQuickLinkPreview();
  loadGuests();
  loadWishes();
}

function formatDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    return iso;
  }
}

function buildPersonalLink(baseUrl, guestName) {
  const cleanBase = (baseUrl || window.location.origin).replace(/\/+$/, '');
  const trimmed = (guestName || '').trim();
  if (!trimmed) return `${cleanBase}/`;
  return `${cleanBase}/?to=${encodeURIComponent(trimmed)}`;
}

function buildWhatsAppShareUrl(guestName, invitationUrl) {
  const greetingName = (guestName || '').trim() || 'Bapak/Ibu/Sahabat';
  const msg =
    `Kepada Yth. ${greetingName},\n\n` +
    `Dengan penuh sukacita kami mengundang Anda untuk menghadiri hari bahagia pernikahan Adjie & Daulika.\n` +
    `Undangan personal Anda (berlaku untuk 1 orang):\n${invitationUrl}\n\n` +
    `Terima kasih atas doa dan kehadirannya.`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

function updateQuickLinkPreview() {
  const name = quickGuestNameInput.value.trim();
  const url = buildPersonalLink(currentBaseUrl, name);
  quickLinkPreview.textContent = url;
  quickWaBtn.href = buildWhatsAppShareUrl(name, url);
  quickPreviewBtn.href = name ? `/?to=${encodeURIComponent(name)}` : '/';
}

function renderGuestStats(summary) {
  invStatsGrid.innerHTML = '';
  const cards = [
    { label: 'Total Tamu Undangan', value: summary.total },
    { label: 'Akan Hadir (1 Orang)', value: summary.confirmed },
    { label: 'Tidak Dapat Hadir', value: summary.declined },
    { label: 'Belum Merespons', value: summary.pending }
  ];
  for (const c of cards) {
    const el = document.createElement('div');
    el.className = 'stat-card';
    el.innerHTML = `<div class="stat-label"></div><div class="stat-value"></div>`;
    el.querySelector('.stat-label').textContent = c.label;
    el.querySelector('.stat-value').textContent = String(c.value ?? 0);
    invStatsGrid.appendChild(el);
  }
}

function createBadge(text, cls) {
  const span = document.createElement('span');
  span.className = `badge ${cls}`;
  span.textContent = text;
  return span;
}

function renderGuestsTable(guests) {
  invTableBody.innerHTML = '';
  if (!guests || guests.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'muted';
    td.textContent = 'Tidak ada tamu yang cocok dengan filter.';
    tr.appendChild(td);
    invTableBody.appendChild(tr);
    return;
  }

  for (const guest of guests) {
    const tr = document.createElement('tr');

    // 1. No
    const tdNo = document.createElement('td');
    tdNo.textContent = String(guest.no);
    tr.appendChild(tdNo);

    // 2. Nama Tamu
    const tdName = document.createElement('td');
    const nameStrong = document.createElement('div');
    nameStrong.style.fontWeight = '600';
    nameStrong.style.color = '#fff';
    nameStrong.textContent = guest.guest_name;
    tdName.appendChild(nameStrong);

    if (guest.guest_name !== guest.original_name) {
      const origNote = document.createElement('div');
      origNote.className = 'muted';
      origNote.style.fontSize = '11px';
      origNote.textContent = `Asli: ${guest.original_name}`;
      tdName.appendChild(origNote);
    }
    tr.appendChild(tdName);

    // 3. Link Undangan Personal (?to=...)
    const tdLink = document.createElement('td');
    const linkBox = document.createElement('div');
    linkBox.className = 'link-box';
    linkBox.textContent = guest.invitation_url;
    tdLink.appendChild(linkBox);
    tr.appendChild(tdLink);

    // 4. RSVP Status
    const tdStatus = document.createElement('td');
    if (guest.rsvp_status === 'WILL_ATTEND') {
      tdStatus.appendChild(createBadge('Akan hadir (1 orang)', 'badge-attend'));
    } else if (guest.rsvp_status === 'DECLINED') {
      tdStatus.appendChild(createBadge('Tidak dapat hadir', 'badge-declined'));
    } else {
      tdStatus.appendChild(createBadge('Belum merespons', 'badge-pending'));
    }
    if (guest.confirmed_at) {
      const confTime = document.createElement('div');
      confTime.className = 'muted';
      confTime.style.fontSize = '11px';
      confTime.style.marginTop = '4px';
      confTime.textContent = formatDate(guest.confirmed_at);
      tdStatus.appendChild(confTime);
    }
    tr.appendChild(tdStatus);

    // 5. Action
    const tdAct = document.createElement('td');
    const actRow = document.createElement('div');
    actRow.className = 'actions-row';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-secondary btn-sm';
    copyBtn.textContent = 'Copy Link';
    copyBtn.setAttribute('aria-label', `Copy link untuk ${guest.guest_name}`);
    copyBtn.addEventListener('click', () => {
      copyText(guest.invitation_url, `Link untuk ${guest.guest_name} disalin.`);
    });

    const previewLink = document.createElement('a');
    previewLink.className = 'btn btn-secondary btn-sm';
    previewLink.href = `/?to=${encodeURIComponent(guest.guest_name)}`;
    previewLink.target = '_blank';
    previewLink.rel = 'noopener noreferrer';
    previewLink.textContent = 'Preview';

    const waLink = document.createElement('a');
    waLink.className = 'btn btn-green btn-sm';
    waLink.href = buildWhatsAppShareUrl(guest.guest_name, guest.invitation_url);
    waLink.target = '_blank';
    waLink.rel = 'noopener noreferrer';
    waLink.textContent = 'WhatsApp';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit nama ${guest.guest_name}`);
    editBtn.addEventListener('click', () => openEditGuestModal(guest));

    actRow.appendChild(copyBtn);
    actRow.appendChild(waLink);
    actRow.appendChild(previewLink);
    actRow.appendChild(editBtn);
    tdAct.appendChild(actRow);
    tr.appendChild(tdAct);

    invTableBody.appendChild(tr);
  }
}

async function loadGuests() {
  const params = new URLSearchParams({
    search: invSearch.value.trim(),
    status: invStatusFilter.value
  });
  const res = await adminFetch(`/api/admin/guests?${params.toString()}`);
  const data = await res.json();
  if (data.status === 'ok') {
    if (data.base_url) {
      currentBaseUrl = data.base_url;
      updateQuickLinkPreview();
    }
    renderGuestStats(data.summary);
    renderGuestsTable(data.guests);
  }
}

function openEditGuestModal(guest) {
  editNoInput.value = String(guest.no);
  editOriginalEl.textContent = `No. ${guest.no} • Nama asli: "${guest.original_name}"`;
  editNameInput.value = guest.guest_name;
  editModal.classList.remove('hidden');
  editNameInput.focus();
}

function closeEditGuestModal() {
  editModal.classList.add('hidden');
}

function renderWishStats(summary) {
  wishStatsGrid.innerHTML = '';
  const cards = [
    { label: 'Total Ucapan & Doa', value: summary.total },
    { label: 'Menunggu Moderasi', value: summary.pending },
    { label: 'Disetujui (Tampil Publik jika Public)', value: summary.approved },
    { label: 'Ditolak / Disembunyikan', value: summary.rejected },
    { label: 'Pesan Private Pengantin', value: summary.private_count }
  ];
  for (const c of cards) {
    const el = document.createElement('div');
    el.className = 'stat-card';
    el.innerHTML = `<div class="stat-label"></div><div class="stat-value"></div>`;
    el.querySelector('.stat-label').textContent = c.label;
    el.querySelector('.stat-value').textContent = String(c.value ?? 0);
    wishStatsGrid.appendChild(el);
  }
}

function renderWishesTable(wishes) {
  wishTableBody.innerHTML = '';
  if (!wishes || wishes.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = 'muted';
    td.textContent = 'Belum ada ucapan & doa yang masuk sesuai filter.';
    tr.appendChild(td);
    wishTableBody.appendChild(tr);
    return;
  }

  for (const wish of wishes) {
    const tr = document.createElement('tr');

    const tdSender = document.createElement('td');
    tdSender.style.fontWeight = '600';
    tdSender.textContent = wish.sender_name;
    tr.appendChild(tdSender);

    const tdMsg = document.createElement('td');
    tdMsg.style.whiteSpace = 'pre-wrap';
    tdMsg.style.wordBreak = 'break-word';
    tdMsg.textContent = wish.message;
    tr.appendChild(tdMsg);

    const tdVis = document.createElement('td');
    tdVis.appendChild(
      createBadge(
        wish.visibility === 'PRIVATE' ? 'Private (Pengantin)' : 'Public',
        wish.visibility === 'PRIVATE' ? 'badge-private' : 'badge-public'
      )
    );
    tr.appendChild(tdVis);

    const tdStatus = document.createElement('td');
    if (wish.moderation_status === 'APPROVED') {
      tdStatus.appendChild(createBadge('Approved', 'badge-attend'));
    } else if (wish.moderation_status === 'REJECTED') {
      tdStatus.appendChild(createBadge('Rejected', 'badge-declined'));
    } else {
      tdStatus.appendChild(createBadge('Pending', 'badge-pending'));
    }
    tr.appendChild(tdStatus);

    const tdDate = document.createElement('td');
    tdDate.className = 'muted';
    tdDate.style.fontSize = '12px';
    tdDate.textContent = formatDate(wish.created_at);
    tr.appendChild(tdDate);

    const tdAct = document.createElement('td');
    const row = document.createElement('div');
    row.className = 'actions-row';

    const approveBtn = document.createElement('button');
    approveBtn.type = 'button';
    approveBtn.className = 'btn btn-green btn-sm';
    approveBtn.textContent = 'Approve';
    approveBtn.disabled = wish.moderation_status === 'APPROVED';
    approveBtn.addEventListener('click', () => handleModerateWish(wish.id, 'APPROVE'));

    const rejectBtn = document.createElement('button');
    rejectBtn.type = 'button';
    rejectBtn.className = 'btn btn-red btn-sm';
    rejectBtn.textContent = 'Reject';
    rejectBtn.disabled = wish.moderation_status === 'REJECTED';
    rejectBtn.addEventListener('click', () => handleModerateWish(wish.id, 'REJECT'));

    row.appendChild(approveBtn);
    row.appendChild(rejectBtn);
    tdAct.appendChild(row);
    tr.appendChild(tdAct);

    wishTableBody.appendChild(tr);
  }
}

async function handleModerateWish(id, action) {
  const res = await adminFetch(`/api/admin/wishes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  const data = await res.json();
  if (res.ok && data.status === 'ok') {
    showToast(action === 'APPROVE' ? 'Ucapan disetujui.' : 'Ucapan ditolak.');
    loadWishes();
  }
}

async function loadWishes() {
  const params = new URLSearchParams({
    search: wishSearch.value.trim(),
    status: wishStatusFilter.value,
    visibility: wishVisFilter.value
  });
  const res = await adminFetch(`/api/admin/wishes?${params.toString()}`);
  const data = await res.json();
  if (data.status === 'ok') {
    renderWishStats(data.summary);
    renderWishesTable(data.wishes);
  }
}

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const accessKey = accessKeyInput.value;
  try {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_key: accessKey })
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'ok' || !data.token) {
      loginError.textContent = data.message || 'Kode akses tidak valid.';
      loginError.classList.remove('hidden');
      return;
    }
    setToken(data.token);
    accessKeyInput.value = '';
    showDashboard();
  } catch {
    loginError.textContent = 'Gagal terhubung ke server.';
    loginError.classList.remove('hidden');
  }
});

logoutBtn.addEventListener('click', () => {
  setToken('');
  showLoginScreen();
});

tabInvBtn.addEventListener('click', () => {
  tabInvBtn.classList.add('active');
  tabWishBtn.classList.remove('active');
  panelInv.classList.remove('hidden');
  panelWish.classList.add('hidden');
  loadGuests();
});

tabWishBtn.addEventListener('click', () => {
  tabWishBtn.classList.add('active');
  tabInvBtn.classList.remove('active');
  panelWish.classList.remove('hidden');
  panelInv.classList.add('hidden');
  loadWishes();
});

quickGuestNameInput.addEventListener('input', updateQuickLinkPreview);
quickCopyBtn.addEventListener('click', () => {
  const name = quickGuestNameInput.value.trim();
  const url = buildPersonalLink(currentBaseUrl, name);
  copyText(url, name ? `Link untuk ${name} disalin.` : 'Link undangan utama disalin.');
});

invSearch.addEventListener('input', () => loadGuests());
invStatusFilter.addEventListener('change', () => loadGuests());

invExportBtn.addEventListener('click', async () => {
  invExportBtn.disabled = true;
  try {
    const res = await adminFetch('/api/admin/guests/export.csv');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daftar-undangan-adjie-daulika.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('File CSV daftar undangan berhasil diunduh.');
  } finally {
    invExportBtn.disabled = false;
  }
});

editCancelBtn.addEventListener('click', closeEditGuestModal);
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const no = editNoInput.value;
  const res = await adminFetch(`/api/admin/guests/${no}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guest_name: editNameInput.value.trim()
    })
  });
  const data = await res.json();
  if (res.ok && data.status === 'ok') {
    closeEditGuestModal();
    showToast('Nama tamu diperbarui.');
    loadGuests();
  }
});

wishSearch.addEventListener('input', () => loadWishes());
wishStatusFilter.addEventListener('change', () => loadWishes());
wishVisFilter.addEventListener('change', () => loadWishes());
wishRefreshBtn.addEventListener('click', () => loadWishes());

// Bootstrap session
(async function init() {
  const existing = getToken();
  if (!existing) {
    showLoginScreen();
    return;
  }
  try {
    const res = await adminFetch('/api/admin/auth/me');
    if (res.ok) {
      showDashboard();
    } else {
      showLoginScreen();
    }
  } catch {
    showLoginScreen();
  }
})();
