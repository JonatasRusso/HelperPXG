// ─── Accounts ─────────────────────────────────────────────────────────────────
let accounts = [];
let dragSrcIdx = null;

function vipRemaining(account) {
  if (!account.vipDays || !account.vipAddedAt) return null;
  const elapsed = Math.floor((Date.now() - account.vipAddedAt) / 86400000);
  return Math.max(0, account.vipDays - elapsed);
}

function vipBadge(account) {
  const days = vipRemaining(account);
  if (days === null || days === 0) {
    return `<span class="vip-badge vip-none">Free Acc</span>`;
  }
  const cls = days >= 10 ? 'vip-green' : days >= 3 ? 'vip-yellow' : 'vip-red';
  return `<span class="vip-badge ${cls}">${days}d</span>`;
}

async function loadAccounts() {
  accounts = await window.api.getAccounts();
  renderAccountsLogin();
  renderAccountsConfig();
}

function renderAccountsLogin() {
  const list = document.getElementById('account-list');
  if (!accounts.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔑</div>
        <div>Nenhuma conta cadastrada.<br>Adicione em Config.</div>
      </div>`;
    return;
  }
  list.innerHTML = accounts.map(a => `
    <div class="account-card" onclick="runAutoLoginFor(${a.id})">
      <div class="account-card-main">
        <div class="account-card-name">${escapeHtml(a.name)}</div>
      </div>
      ${vipBadge(a)}
    </div>
  `).join('');
}

function renderAccountsConfig() {
  const list = document.getElementById('accounts-config-list');
  if (!accounts.length) {
    list.innerHTML = '<div class="empty-state" style="padding:16px 0 4px">Nenhuma conta cadastrada.</div>';
    return;
  }
  list.innerHTML = accounts.map((a, idx) => `
    <div class="account-config-row" draggable="true"
      ondragstart="onDragStart(event,${idx})"
      ondragover="onDragOver(event,${idx})"
      ondrop="onDrop(event,${idx})"
      ondragend="onDragEnd()"
      ondragleave="onDragLeave(event)">
      <span class="drag-handle">⠿</span>
      <span class="account-config-name">${escapeHtml(a.name)}</span>
      <span class="account-config-user">${escapeHtml(a.username)}</span>
      <button class="btn-chevron" draggable="false"
        onclick="toggleAccountPanel(${a.id}, this)" title="Configurações">▸</button>
    </div>
    <div class="account-panel" id="panel-${a.id}" style="display:none">
      <div class="account-panel-inner">
        <label class="panel-label">Dias de VIP</label>
        <div class="panel-vip-row">
          <input type="number" min="0" max="999"
            class="panel-vip-input" id="vip-input-${a.id}"
            value="${vipRemaining(a) !== null ? vipRemaining(a) : ''}"
            placeholder="0" />
          <button class="btn-primary panel-vip-save"
            onclick="saveVip(${a.id})">Salvar</button>
        </div>
        <div class="panel-status" id="vip-status-${a.id}"></div>
        <div class="panel-actions">
          <button class="btn-secondary" onclick="showCharForm(${a.id})">+ Adicionar personagem</button>
          <button class="btn-danger" onclick="deleteAccount(${a.id})">Remover conta</button>
        </div>
        <div class="panel-char-form" id="char-form-${a.id}" style="display:none">
          <input type="text" id="char-name-${a.id}"   placeholder="Nome"     maxlength="60" />
          <input type="text" id="char-server-${a.id}" placeholder="Servidor" maxlength="60" />
          ${clanDropdownHtml(`char-clan-${a.id}`, '')}
          ${levelTagsHtml(`level-tags-${a.id}`, '300-')}
          <span class="panel-label">Background</span>
          ${bgPickerHtml(`bg-picker-add-${a.id}`, 'personagem-bg-01.png')}
          <div class="panel-char-btns">
            <button class="btn-primary"   onclick="addCharacter(${a.id})">Salvar</button>
            <button class="btn-secondary" onclick="hideCharForm(${a.id})">Cancelar</button>
          </div>
          <div class="panel-status" id="char-status-${a.id}"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Drag-and-drop ──
function onDragStart(e, idx) {
  dragSrcIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}

function onDragOver(e, idx) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.account-config-row').forEach((r, i) => {
    r.classList.toggle('drag-over', i === idx && idx !== dragSrcIdx);
  });
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onDragEnd() {
  document.querySelectorAll('.account-config-row').forEach(r => {
    r.classList.remove('drag-over', 'dragging');
  });
}

async function onDrop(e, idx) {
  e.preventDefault();
  onDragEnd();
  if (dragSrcIdx === null || dragSrcIdx === idx) return;
  const reordered = [...accounts];
  const [moved] = reordered.splice(dragSrcIdx, 1);
  reordered.splice(idx, 0, moved);
  accounts = reordered;
  await window.api.reorderAccounts(accounts.map(a => a.id));
  renderAccountsLogin();
  renderAccountsConfig();
}

// ── Auto-login ──
async function runAutoLoginFor(id) {
  setStatus('login-status', '⏳ Procurando jogo...', 'ok');
  const res = await window.api.runAutoLoginFor(id);
  if (res.success) setStatus('login-status', '✓ Login executado!', 'ok');
  else setStatus('login-status', '✗ ' + res.error, 'err');
}

// ── Add account form ──
function showAddAccountForm() {
  document.getElementById('add-account-form').style.display = 'block';
  document.getElementById('new-acc-name').focus();
}

function hideAddAccountForm() {
  document.getElementById('add-account-form').style.display = 'none';
  document.getElementById('new-acc-name').value = '';
  document.getElementById('new-acc-user').value = '';
  document.getElementById('new-acc-pass').value = '';
  document.getElementById('add-account-status').textContent = '';
}

async function addAccount() {
  const name     = document.getElementById('new-acc-name').value.trim();
  const username = document.getElementById('new-acc-user').value.trim();
  const password = document.getElementById('new-acc-pass').value;
  if (!name || !username || !password) {
    setStatus('add-account-status', '✗ Preencha todos os campos.', 'err');
    return;
  }
  accounts = await window.api.addAccount({ name, username, password });
  hideAddAccountForm();
  renderAccountsLogin();
  renderAccountsConfig();
}

async function deleteAccount(id) {
  accounts = await window.api.deleteAccount(id);
  renderAccountsLogin();
  renderAccountsConfig();
  // Refresh characters page state if the module is loaded
  // (loadCharacters is defined in characters.js, loaded after accounts.js)
  if (typeof loadCharacters === 'function') loadCharacters();
}

function toggleNewPass() {
  const input = document.getElementById('new-acc-pass');
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ── Accordion + VIP ──
function toggleAccountPanel(id, btn) {
  const panel = document.getElementById('panel-' + id);
  const open = panel.style.display === 'block';
  panel.style.display = open ? 'none' : 'block';
  btn.textContent = open ? '▸' : '▾';
  const row = btn.closest('.account-config-row');
  row.style.borderRadius = open ? '' : 'var(--radius) var(--radius) 0 0';
  row.style.marginBottom = open ? '' : '0';
}

async function saveVip(id) {
  const input = document.getElementById('vip-input-' + id);
  const days = parseInt(input.value, 10);
  if (isNaN(days) || days < 0) {
    setStatus('vip-status-' + id, '✗ Valor inválido.', 'err');
    return;
  }
  accounts = await window.api.setVip(id, days);
  setStatus('vip-status-' + id, '✓ Salvo!', 'ok');
  renderAccountsLogin();
}

// ── Add character (inline form in Config accordion) ──
function showCharForm(accountId) {
  document.getElementById(`char-form-${accountId}`).style.display = 'block';
}

function hideCharForm(accountId) {
  document.getElementById(`char-form-${accountId}`).style.display = 'none';
  document.getElementById(`char-name-${accountId}`).value   = '';
  document.getElementById(`char-server-${accountId}`).value = '';
  document.getElementById(`char-clan-${accountId}`).value   = '';
  selectLevelTagIn(`level-tags-${accountId}`, document.querySelector(`#level-tags-${accountId} .level-tag`));
  selectBgIn(`bg-picker-add-${accountId}`, document.querySelector(`#bg-picker-add-${accountId} .bg-thumb`));
}

async function addCharacter(accountId) {
  const name   = document.getElementById(`char-name-${accountId}`).value.trim();
  const server = document.getElementById(`char-server-${accountId}`).value.trim();
  const clan   = document.getElementById(`char-clan-${accountId}`).value.trim();
  const activeTag = document.querySelector(`#level-tags-${accountId} .level-tag--active`);
  const level  = activeTag ? activeTag.textContent.trim() : '300-';
  const activeBg    = document.querySelector(`#bg-picker-add-${accountId} .bg-thumb--active`);
  const customImage = activeBg?.dataset.image || null;
  const bg          = !customImage && activeBg ? activeBg.dataset.bg : 'personagem-bg-01.png';
  const image       = customImage;
  if (!name || !server) {
    setStatus(`char-status-${accountId}`, '✗ Nome e Servidor são obrigatórios.', 'err');
    return;
  }
  await window.api.addCharacter({ accountId, name, server, clan, level, bg, image });
  hideCharForm(accountId);
  // Keep characters module in sync if it has been loaded
  if (typeof loadCharacters === 'function') loadCharacters();
}
