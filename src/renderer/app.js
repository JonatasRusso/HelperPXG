// ─── Sidebar ──────────────────────────────────────────────────────────────────
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('collapsed');
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
}

// ─── Status helper ────────────────────────────────────────────────────────────
function setStatus(id, msg, type = 'ok') {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'status-msg ' + type;
  if (type === 'ok') setTimeout(() => el.textContent = '', 3000);
}

// ─── Escape HTML ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── 7:40 AM day-reset helpers ────────────────────────────────────────────────
// A "new day" starts at 7:40 AM (server save time), not midnight.
// Subtracting RESET_OFFSET before dividing into days shifts the boundary.
const RESET_OFFSET = (7 * 60 + 40) * 60 * 1000; // 7h40 in ms

function adjustedDay(ts) {
  return Math.floor((ts - RESET_OFFSET) / 86400000);
}

// Returns days remaining until the next monthly BID date (resets at 7:40 AM).
// house = { bidDay: 1-28, ... }. Returns null if no house.
function houseRemaining(house) {
  if (!house?.bidDay) return null;
  // Before 7:40 AM, now.getMonth()/getFullYear() reflect the prior day — intentional.
  const now = new Date(Date.now() - RESET_OFFSET);
  let next = new Date(now.getFullYear(), now.getMonth(), house.bidDay);
  if (next <= now) {
    next = new Date(now.getFullYear(), now.getMonth() + 1, house.bidDay);
  }
  return Math.ceil((next - now) / 86400000);
}
