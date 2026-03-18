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
  const options = CLANS.map(c => {
    const label = c.charAt(0).toUpperCase() + c.slice(1);
    return `<option value="${c}"${selected === c ? ' selected' : ''}>${label}</option>`;
  }).join('');
  return `<select id="${selectId}" class="clan-select">
    <option value="">— Sem clã —</option>
    ${options}
  </select>`;
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
