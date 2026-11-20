import {
  ADMIN_EMAILS,
  isVerifiedAdminUser,
  signInAdminWithGoogle,
  signOutAdmin,
  subscribeAdminAuth,
  subscribeAdminWishes,
  subscribeAdminRsvps,
  subscribeAdminGuestOverrides,
  moderateWishInFirestore,
  deleteWishInFirestore,
  saveGuestOverrideInFirestore
} from './firebase/firebaseClient.bundle.js';

const loginSection = document.getElementById('admin-login-section');
const dashboardSection = document.getElementById('admin-dashboard-section');
const googleLoginBtn = document.getElementById('admin-google-login-btn');
const loginError = document.getElementById('admin-login-error');
const adminUserEmailEl = document.getElementById('admin-user-email');
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

let baseGuests = [];
let guestOverrides = {};
let allRsvps = [];
let allWishes = [];
let activeUnsubscribers = [];
let pendingDeleteWishId = null;

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 3200);
}

async function copyText(text, successMsg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg);
  } catch {
    showToast('Gagal menyalin otomatis. Salin link secara manual.');
  }
}

function cleanupListeners() {
  for (const unsub of activeUnsubscribers) {
    try {
      if (typeof unsub === 'function') unsub();
    } catch {}
  }
  activeUnsubscribers = [];
}

function showLoginScreen(errMsg = '') {
  cleanupListeners();
  dashboardSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  if (errMsg) {
    loginError.textContent = errMsg;
    loginError.classList.remove('hidden');
  } else {
    loginError.classList.add('hidden');
  }
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

function normalizeGuestKey(name) {
  return String(name || '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
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

function escapeCsvCell(value) {
  let str = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function updateQuickLinkPreview() {
  const name = quickGuestNameInput.value.trim();
  const url = buildPersonalLink(currentBaseUrl, name);
  quickLinkPreview.textContent = url;
  quickWaBtn.href = buildWhatsAppShareUrl(name, url);
  quickPreviewBtn.href = name ? `/?to=${encodeURIComponent(name)}` : '/';
}

function createBadge(text, cls) {
  const span = document.createElement('span');
  span.className = `badge ${cls}`;
  span.textContent = text;
  return span;
}

function computeMergedGuests() {
  const latestRsvpByName = new Map();
  for (const r of allRsvps) {
    latestRsvpByName.set(normalizeGuestKey(r.guest_name), r);
  }

  const matchedKeys = new Set();
  const rows = baseGuests.map((entry) => {
    const currentName = guestOverrides[String(entry.no)] || entry.name;
    const key = normalizeGuestKey(currentName);
    const matchedRsvp = latestRsvpByName.get(key) || latestRsvpByName.get(normalizeGuestKey(entry.name)) || null;
    if (matchedRsvp) {
      matchedKeys.add(normalizeGuestKey(matchedRsvp.guest_name));
    }
    const rsvpStatus = matchedRsvp ? matchedRsvp.rsvp_status : 'PENDING';
    return {
      no: entry.no,
      is_extra: false,
      original_name: entry.name,
      guest_name: currentName,
      invitation_url: buildPersonalLink(currentBaseUrl, currentName),
      rsvp_status: rsvpStatus,
      guest_capacity: 1,
      confirmed_at: matchedRsvp ? (matchedRsvp.updated_at || matchedRsvp.created_at) : null
    };
  });

  let extraCounter = 1;
  for (const [key, rsvp] of latestRsvpByName.entries()) {
    if (matchedKeys.has(key)) continue;
    rows.push({
      no: `E${extraCounter++}`,
      is_extra: true,
      original_name: rsvp.guest_name,
      guest_name: rsvp.guest_name,
      invitation_url: buildPersonalLink(currentBaseUrl, rsvp.guest_name),
      rsvp_status: rsvp.rsvp_status,
      guest_capacity: 1,
      confirmed_at: rsvp.updated_at || rsvp.created_at
    });
  }

  return rows;
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

function renderGuestsView() {
  const all = computeMergedGuests();
  const summary = {
    total: all.length,
    confirmed: all.filter((g) => g.rsvp_status === 'WILL_ATTEND').length,
    declined: all.filter((g) => g.rsvp_status === 'DECLINED').length,
    pending: all.filter((g) => g.rsvp_status === 'PENDING').length
  };
  renderGuestStats(summary);

  const search = invSearch.value.trim().toLowerCase();
  const status = invStatusFilter.value;
  const filtered = all.filter((g) => {
    if (status !== 'ALL' && g.rsvp_status !== status) return false;
    if (search) {
      const hay = `${g.no} ${g.guest_name} ${g.original_name}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  invTableBody.innerHTML = '';
  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'muted';
    td.textContent = 'Tidak ada tamu yang cocok dengan filter.';
    tr.appendChild(td);
    invTableBody.appendChild(tr);
    return;
  }

  for (const guest of filtered) {
    const tr = document.createElement('tr');

    const tdNo = document.createElement('td');
    tdNo.textContent = String(guest.no);
    tr.appendChild(tdNo);

    const tdName = document.createElement('td');
    const nameStrong = document.createElement('div');
    nameStrong.style.fontWeight = '600';
    nameStrong.style.color = '#fff';
    nameStrong.textContent = guest.guest_name;
    tdName.appendChild(nameStrong);

    if (guest.is_extra) {
      const extraTag = document.createElement('div');
      extraTag.style.marginTop = '4px';
      extraTag.appendChild(createBadge('Link Cepat / Tambahan', 'badge-review'));
      tdName.appendChild(extraTag);
    } else if (guest.guest_name !== guest.original_name) {
      const origNote = document.createElement('div');
      origNote.className = 'muted';
      origNote.style.fontSize = '11px';
      origNote.textContent = `Asli: ${guest.original_name}`;
      tdName.appendChild(origNote);
    }
    tr.appendChild(tdName);

    const tdLink = document.createElement('td');
    const linkBox = document.createElement('div');
    linkBox.className = 'link-box';
    linkBox.textContent = guest.invitation_url;
    tdLink.appendChild(linkBox);
    tr.appendChild(tdLink);

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

    actRow.appendChild(copyBtn);
    actRow.appendChild(waLink);
    actRow.appendChild(previewLink);

    if (!guest.is_extra) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-secondary btn-sm';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', `Edit nama ${guest.guest_name}`);
      editBtn.addEventListener('click', () => openEditGuestModal(guest));
      actRow.appendChild(editBtn);
    }

    tdAct.appendChild(actRow);
    tr.appendChild(tdAct);
    invTableBody.appendChild(tr);
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

function renderWishesView() {
  const summary = {
    total: allWishes.length,
    pending: allWishes.filter((w) => w.moderation_status === 'PENDING').length,
    approved: allWishes.filter((w) => w.moderation_status === 'APPROVED').length,
    rejected: allWishes.filter((w) => w.moderation_status === 'REJECTED').length,
    private_count: allWishes.filter((w) => w.visibility === 'PRIVATE').length
  };
  renderWishStats(summary);

  const search = wishSearch.value.trim().toLowerCase();
  const status = wishStatusFilter.value;
  const visibility = wishVisFilter.value;

  const filtered = allWishes.filter((w) => {
    if (status !== 'ALL' && w.moderation_status !== status) return false;
    if (visibility !== 'ALL' && w.visibility !== visibility) return false;
    if (search) {
      const hay = `${w.sender_name} ${w.message}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  wishTableBody.innerHTML = '';
  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = 'muted';
    td.textContent = 'Belum ada ucapan & doa yang masuk sesuai filter.';
    tr.appendChild(td);
    wishTableBody.appendChild(tr);
    return;
  }

  for (const wish of filtered) {
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

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-secondary btn-sm';
    const isConfirming = pendingDeleteWishId === wish.id;
    deleteBtn.textContent = isConfirming ? 'Yakin Hapus?' : 'Hapus';
    if (isConfirming) {
      deleteBtn.style.borderColor = '#e05a5a';
      deleteBtn.style.color = '#ffb2b2';
    }
    deleteBtn.addEventListener('click', () => handleDeleteWish(wish.id));

    row.appendChild(approveBtn);
    row.appendChild(rejectBtn);
    row.appendChild(deleteBtn);
    tdAct.appendChild(row);
    tr.appendChild(tdAct);

    wishTableBody.appendChild(tr);
  }
}

async function handleModerateWish(id, action) {
  try {
    await moderateWishInFirestore(id, action);
    showToast(action === 'APPROVE' ? 'Ucapan disetujui.' : 'Ucapan disembunyikan.');
  } catch {
    showToast('Gagal memperbarui status ucapan.');
  }
}

async function handleDeleteWish(id) {
  if (pendingDeleteWishId !== id) {
    pendingDeleteWishId = id;
    renderWishesView();
    return;
  }
  pendingDeleteWishId = null;
  try {
    await deleteWishInFirestore(id);
    showToast('Ucapan dihapus permanen.');
  } catch {
    showToast('Gagal menghapus ucapan.');
  }
}

async function fetchBaseGuestsList(user) {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/admin/base-guests', {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.status === 'ok' && Array.isArray(data.guests)) {
      baseGuests = data.guests;
      if (data.base_url) {
        currentBaseUrl = data.base_url;
        updateQuickLinkPreview();
      }
      renderGuestsView();
    }
  } catch (err) {
    console.warn('Gagal memuat daftar dasar 153 tamu:', err);
  }
}

function startAdminDashboard(user) {
  cleanupListeners();
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  if (adminUserEmailEl) {
    adminUserEmailEl.textContent = `Masuk sebagai ${user.email} • Terhubung ke Firebase Firestore`;
  }
  updateQuickLinkPreview();

  void fetchBaseGuestsList(user);

  const onFirestoreErr = () => {
    showToast('Terjadi kendala membaca data Firestore. Coba muat ulang halaman.');
  };

  activeUnsubscribers.push(
    subscribeAdminGuestOverrides((overrides) => {
      guestOverrides = overrides;
      renderGuestsView();
    }, onFirestoreErr)
  );

  activeUnsubscribers.push(
    subscribeAdminRsvps((rsvps) => {
      allRsvps = rsvps;
      renderGuestsView();
    }, onFirestoreErr)
  );

  activeUnsubscribers.push(
    subscribeAdminWishes((wishes) => {
      allWishes = wishes;
      renderWishesView();
    }, onFirestoreErr)
  );
}

googleLoginBtn.addEventListener('click', async () => {
  loginError.classList.add('hidden');
  googleLoginBtn.disabled = true;
  try {
    const user = await signInAdminWithGoogle();
    if (!isVerifiedAdminUser(user)) {
      await signOutAdmin();
      showLoginScreen(`Akun ${user?.email || ''} tidak memiliki akses administrator. Silakan masuk dengan akun ${ADMIN_EMAILS.join(' atau ')}.`);
    }
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
    if (code === 'auth/popup-closed-by-user') {
      showLoginScreen('Login dibatalkan.');
    } else if (code === 'auth/popup-blocked') {
      showLoginScreen('Popup login diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.');
    } else {
      showLoginScreen('Gagal masuk dengan Google. Pastikan koneksi internet stabil lalu coba lagi.');
    }
  } finally {
    googleLoginBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  cleanupListeners();
  await signOutAdmin();
  showLoginScreen();
});

tabInvBtn.addEventListener('click', () => {
  tabInvBtn.classList.add('active');
  tabWishBtn.classList.remove('active');
  panelInv.classList.remove('hidden');
  panelWish.classList.add('hidden');
  renderGuestsView();
});

tabWishBtn.addEventListener('click', () => {
  tabWishBtn.classList.add('active');
  tabInvBtn.classList.remove('active');
  panelWish.classList.remove('hidden');
  panelInv.classList.add('hidden');
  renderWishesView();
});

quickGuestNameInput.addEventListener('input', updateQuickLinkPreview);
quickCopyBtn.addEventListener('click', () => {
  const name = quickGuestNameInput.value.trim();
  const url = buildPersonalLink(currentBaseUrl, name);
  copyText(url, name ? `Link untuk ${name} disalin.` : 'Link undangan utama disalin.');
});

invSearch.addEventListener('input', () => renderGuestsView());
invStatusFilter.addEventListener('change', () => renderGuestsView());

invExportBtn.addEventListener('click', () => {
  const guests = computeMergedGuests();
  const statusLabel = (s) => {
    if (s === 'WILL_ATTEND') return 'Akan hadir';
    if (s === 'DECLINED') return 'Tidak dapat hadir';
    return 'Belum merespons';
  };

  const lines = [
    ['No', 'Nama Tamu', 'Link Undangan', 'RSVP Status', 'Kapasitas', 'Waktu Konfirmasi'].join(',')
  ];

  for (const g of guests) {
    lines.push(
      [
        escapeCsvCell(g.no),
        escapeCsvCell(g.guest_name),
        escapeCsvCell(g.invitation_url),
        escapeCsvCell(statusLabel(g.rsvp_status)),
        escapeCsvCell(1),
        escapeCsvCell(g.confirmed_at || '')
      ].join(',')
    );
  }

  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daftar-undangan-adjie-daulika.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('File CSV daftar undangan berhasil diunduh.');
});

editCancelBtn.addEventListener('click', closeEditGuestModal);
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const no = Number.parseInt(editNoInput.value, 10);
  const nextName = editNameInput.value.trim();
  if (!nextName || Number.isNaN(no)) return;
  try {
    await saveGuestOverrideInFirestore(no, nextName);
    closeEditGuestModal();
    showToast('Nama tamu disimpan ke Firestore.');
  } catch {
    showToast('Gagal menyimpan perubahan nama tamu.');
  }
});

wishSearch.addEventListener('input', () => renderWishesView());
wishStatusFilter.addEventListener('change', () => renderWishesView());
wishVisFilter.addEventListener('change', () => renderWishesView());
wishRefreshBtn.addEventListener('click', () => {
  renderWishesView();
  showToast('Data ucapan sudah tersinkron real-time dengan Firestore.');
});

subscribeAdminAuth(async (user) => {
  if (!user) {
    showLoginScreen();
    return;
  }
  if (!isVerifiedAdminUser(user)) {
    const email = user.email || 'akun ini';
    await signOutAdmin();
    showLoginScreen(`Akun ${email} tidak memiliki akses administrator. Silakan masuk dengan akun ${ADMIN_EMAILS.join(' atau ')}.`);
    return;
  }
  startAdminDashboard(user);
});
