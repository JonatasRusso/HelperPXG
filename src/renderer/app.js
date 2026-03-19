// ─── Energy icons (inline SVG with color) ─────────────────────────────────────
const _ENERGY_PATH = `M11.24,24a2.262,2.262,0,0,1-.948-.212,2.18,2.18,0,0,1-1.2-2.622L10.653,16H6.975A3,3,0,0,1,4.1,12.131l3.024-10A2.983,2.983,0,0,1,10,0h3.693a2.6,2.6,0,0,1,2.433,3.511L14.443,8H17a3,3,0,0,1,2.483,4.684l-6.4,10.3A2.2,2.2,0,0,1,11.24,24Z`;
const ICON_ENERGY_BLUE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="energy-icon" fill="#2196f3"><path d="${_ENERGY_PATH}"/></svg>`;
const ICON_ENERGY_RED  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="energy-icon" fill="#e85d5d"><path d="${_ENERGY_PATH}"/></svg>`;

const _HIDE_PATH = `M23.821,11.181v0a15.736,15.736,0,0,0-4.145-5.44l3.032-3.032L21.293,1.293,18,4.583A11.783,11.783,0,0,0,12,3C4.5,3,1.057,9.261.179,11.181a1.969,1.969,0,0,0,0,1.64,15.736,15.736,0,0,0,4.145,5.44L1.293,21.293l1.414,1.414L6,19.417A11.783,11.783,0,0,0,12,21c7.5,0,10.943-6.261,11.821-8.181A1.968,1.968,0,0,0,23.821,11.181ZM2,12.011C2.75,10.366,5.693,5,12,5a9.847,9.847,0,0,1,4.518,1.068L14.753,7.833a4.992,4.992,0,0,0-6.92,6.92L5.754,16.832A13.647,13.647,0,0,1,2,12.011ZM15,12a3,3,0,0,1-3,3,2.951,2.951,0,0,1-1.285-.3L14.7,10.715A2.951,2.951,0,0,1,15,12ZM9,12a3,3,0,0,1,3-3,2.951,2.951,0,0,1,1.285.3L9.3,13.285A2.951,2.951,0,0,1,9,12Zm3,7a9.847,9.847,0,0,1-4.518-1.068l1.765-1.765a4.992,4.992,0,0,0,6.92-6.92l2.078-2.078A13.584,13.584,0,0,1,22,12C21.236,13.657,18.292,19,12,19Z`;
const _SHOW_PATH = `M23.271,9.419C21.72,6.893,18.192,2.655,12,2.655S2.28,6.893.729,9.419a4.908,4.908,0,0,0,0,5.162C2.28,17.107,5.808,21.345,12,21.345s9.72-4.238,11.271-6.764A4.908,4.908,0,0,0,23.271,9.419Zm-1.705,4.115C20.234,15.7,17.219,19.345,12,19.345S3.766,15.7,2.434,13.534a2.918,2.918,0,0,1,0-3.068C3.766,8.3,6.781,4.655,12,4.655s8.234,3.641,9.566,5.811A2.918,2.918,0,0,1,21.566,13.534Z M12,7a5,5,0,1,0,5,5A5.006,5.006,0,0,0,12,7Zm0,8a3,3,0,1,1,3-3A3,3,0,0,1,12,15Z`;
const ICON_HIDE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="visibility-icon" fill="currentColor"><path d="${_HIDE_PATH}"/></svg>`;
const ICON_SHOW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="visibility-icon" fill="currentColor"><path d="${_SHOW_PATH}"/></svg>`;

const _BONUS_PATH_1 = `M0,11.96A1.492,1.492,0,0,1,.439,10.9L8.111,3.224a5.5,5.5,0,0,1,7.778,0L23.561,10.9a1.5,1.5,0,1,1-2.122,2.121L13.768,5.345a2.5,2.5,0,0,0-3.536,0h0L2.561,13.017A1.5,1.5,0,0,1,0,11.96Z`;
const _BONUS_PATH_2 = `M0,21.5a1.5,1.5,0,0,1,.439-1.061L9.525,11.36a3.505,3.505,0,0,1,4.95,0l9.086,9.081a1.5,1.5,0,0,1-2.122,2.119l-9.085-9.086a.5.5,0,0,0-.707,0h0L2.561,22.56A1.5,1.5,0,0,1,0,21.5Z`;
const ICON_BONUS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="bonus-icon" fill="#00e676"><path d="${_BONUS_PATH_1}"/><path d="${_BONUS_PATH_2}"/></svg>`;

const _FAV_STAR_PATH = `M12,17.77L18.18,21.5L16.54,14.47L22,9.74L14.81,9.13L12,2.5L9.19,9.13L2,9.74L7.46,14.47L5.82,21.5Z`;
const ICON_FAV_STAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="fav-star-icon" fill="currentColor"><path d="${_FAV_STAR_PATH}" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

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

// ─── Shared constants ─────────────────────────────────────────────────────────
const CLANS = [
  'gardestrike','ironhard','malefic','naturia','orebound',
  'psycraft','raibolt','seavell','volcanic','wingeon'
];
const BG_FILES = [
  'personagem-bg-01.png','personagem-bg-02.png',
  'personagem-bg-03.png','personagem-bg-04.png'
];
const LEVEL_TAGS = ['300-','300+','400+','500+','600+'];

// ─── Shared UI helpers ────────────────────────────────────────────────────────
function clanDropdownHtml(selectId, selected = '') {
  const label = selected
    ? selected.charAt(0).toUpperCase() + selected.slice(1)
    : '— Sem clã —';
  const iconHtml = selected
    ? `<img class="clan-dd-icon" src="../assets/cla/${selected}.png" onerror="this.style.display='none'" />`
    : '';
  return `
    <div class="clan-dd" id="${selectId}" data-value="${selected}">
      <button type="button" class="clan-dd-btn" onclick="toggleClanDropdown('${selectId}')">
        ${iconHtml}<span class="clan-dd-label">${label}</span>
        <span class="clan-dd-arrow">▾</span>
      </button>
      <div class="clan-dd-list" style="display:none">
        <div class="clan-dd-option" data-value="" onclick="selectClan('${selectId}','')">
          <span class="clan-dd-label">— Sem clã —</span>
        </div>
        ${CLANS.map(c => {
          const lbl = c.charAt(0).toUpperCase() + c.slice(1);
          return `<div class="clan-dd-option${selected === c ? ' active' : ''}" data-value="${c}" onclick="selectClan('${selectId}','${c}')">
            <img class="clan-dd-icon" src="../assets/cla/${c}.png" onerror="this.style.display='none'" />
            <span class="clan-dd-label">${lbl}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

document.addEventListener('click', e => {
  if (!e.target.closest('.clan-dd')) {
    document.querySelectorAll('.clan-dd-list').forEach(l => l.style.display = 'none');
  }
});

function toggleClanDropdown(id) {
  const dd = document.getElementById(id);
  const list = dd.querySelector('.clan-dd-list');
  const open = list.style.display !== 'none';
  // close all others
  document.querySelectorAll('.clan-dd-list').forEach(l => l.style.display = 'none');
  if (!open) list.style.display = 'block';
}

function selectClan(id, value) {
  const dd = document.getElementById(id);
  dd.dataset.value = value;
  const label = value ? value.charAt(0).toUpperCase() + value.slice(1) : '— Sem clã —';
  const iconHtml = value
    ? `<img class="clan-dd-icon" src="../assets/cla/${value}.png" onerror="this.style.display='none'" />`
    : '';
  dd.querySelector('.clan-dd-btn').innerHTML =
    `${iconHtml}<span class="clan-dd-label">${label}</span><span class="clan-dd-arrow">▾</span>`;
  dd.querySelectorAll('.clan-dd-option').forEach(o => o.classList.toggle('active', o.dataset.value === value));
  dd.querySelector('.clan-dd-list').style.display = 'none';
}

function levelTagsHtml(containerId, selected = '300-') {
  return `<div class="level-tags" id="${containerId}">
    ${LEVEL_TAGS.map(t =>
      `<button class="level-tag${selected === t ? ' level-tag--active' : ''}"
        onclick="selectLevelTagIn('${containerId}', this)">${t}</button>`
    ).join('')}
  </div>`;
}

function bgPickerHtml(pickerId, selected = 'personagem-bg-01.png', customImage = null) {
  const thumbs = BG_FILES.map(f => {
    const active = !customImage && selected === f;
    return `<button type="button" class="bg-thumb${active ? ' bg-thumb--active' : ''}"
      style="background-image:url('../assets/Personagens/${f}')"
      data-bg="${f}"
      onclick="selectBgIn('${pickerId}', this)"></button>`;
  }).join('');

  const customThumb = customImage
    ? `<button type="button" class="bg-thumb bg-thumb--active"
        style="background-image:url('${customImage.replace(/'/g, '')}')"
        data-image="${customImage.replace(/'/g, '')}"
        onclick="selectBgIn('${pickerId}', this)"></button>`
    : '';

  const addBtn = `<button type="button" class="bg-add-btn"
    onclick="pickCustomBg('${pickerId}')" title="Imagem personalizada">+</button>`;

  return `<div class="bg-picker" id="${pickerId}">${thumbs}${customThumb}${addBtn}</div>`;
}

// ─── Confirm modal ───────────────────────────────────────────────────────────
function showConfirmModal(msg, onConfirm) {
  document.getElementById('confirm-modal-msg').textContent = msg;
  const okBtn = document.getElementById('confirm-modal-ok');
  okBtn.onclick = () => { hideConfirmModal(); onConfirm(); };
  document.getElementById('confirm-modal').style.display = 'flex';
}

function hideConfirmModal() {
  document.getElementById('confirm-modal').style.display = 'none';
}

function selectLevelTagIn(containerId, btn) {
  document.getElementById(containerId).querySelectorAll('.level-tag')
    .forEach(b => b.classList.remove('level-tag--active'));
  btn.classList.add('level-tag--active');
}

function selectBgIn(pickerId, btn) {
  document.getElementById(pickerId).querySelectorAll('.bg-thumb')
    .forEach(b => b.classList.remove('bg-thumb--active'));
  btn.classList.add('bg-thumb--active');
}

async function pickCustomBg(pickerId) {
  const dataUrl = await window.api.pickImageData();
  if (!dataUrl) return;
  const picker = document.getElementById(pickerId);
  const old = picker.querySelector('.bg-thumb[data-image]');
  if (old) old.remove();
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bg-thumb';
  btn.style.backgroundImage = `url('${dataUrl.replace(/'/g, '')}')`;
  btn.dataset.image = dataUrl;
  btn.onclick = () => selectBgIn(pickerId, btn);
  picker.querySelector('.bg-add-btn').before(btn);
  selectBgIn(pickerId, btn);
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

// ─── Inject energy icons into tab buttons ─────────────────────────────────────
document.getElementById('tab-btn-blue').insertAdjacentHTML('afterbegin', ICON_ENERGY_BLUE);
document.getElementById('tab-btn-red').insertAdjacentHTML('afterbegin', ICON_ENERGY_RED);

// ─── Energy helpers ───────────────────────────────────────────────────────────
// Computes current energy from stored snapshot + elapsed regen time.
// Returns null if energy not configured. Clamps to [0, max].
function computeEnergy(stored, now = Date.now()) {
  if (!stored) return null;
  const { current, max, regenMin, lastUpdated } = stored;
  if (!regenMin) return Math.min(max, Math.max(0, current));
  const gained = Math.floor((now - lastUpdated) / (regenMin * 60000));
  return Math.min(max, Math.max(0, current + gained));
}
