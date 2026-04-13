let accounts = [];
let dragSrcIdx = null;
let loginCharacters = [];
let _energyRefreshInterval = null;

function vipRemaining(account) {
  if (!account.vipDays || !account.vipAddedAt) return null;
  const elapsed = adjustedDay(Date.now()) - adjustedDay(account.vipAddedAt);
  return Math.max(0, account.vipDays - elapsed);
}

function vipBadge(account) {
  const days = vipRemaining(account);
  if (days === null || days === 0) return `<span class="vip-badge vip-none">Free Acc</span>`;
  const cls = days >= 10 ? 'vip-green' : days >= 3 ? 'vip-yellow' : 'vip-red';
  return `<span class="vip-badge ${cls}">${days}d</span>`;
}

async function loadAccounts() {
  [accounts, loginCharacters] = await Promise.all([
    window.api.getAccounts(),
    window.api.getCharacters(),
  ]);
  renderAccountsLogin();
  renderAccountsConfig();
  startEnergyRefresh();
}

function startEnergyRefresh() {
  if (_energyRefreshInterval) return;
  _energyRefreshInterval = setInterval(() => {
    if (loginCharacters.length) renderAccountsLogin();
  }, 60000);
}

function houseLoginIcon(accountId) {
  const chars = loginCharacters.filter(c => c.accountId === accountId && c.house);
  if (!chars.length) return '';

  let urgent     = chars[0];
  let urgentDays = houseRemaining(urgent.house) ?? Infinity;
  for (const c of chars.slice(1)) {
    const d = houseRemaining(c.house) ?? Infinity;
    if (d < urgentDays) { urgent = c; urgentDays = d; }
  }

  const days = urgentDays === Infinity ? null : urgentDays;
  if (days === null) return '';

  const opacity = Math.max(0.2, 1 - (days / 30));
  const houseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="house-svg-icon"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
  if (days <= 5) {
    const state = urgent.house.cpSeparated ? 'green' : 'red';
    return `<span class="house-login-icon ${state}" title="${escapeHtml(urgent.name)}">${houseSvg}</span>`;
  }
  return `<span class="house-login-icon gray" style="opacity:${opacity}" title="${escapeHtml(urgent.name)}">${houseSvg}</span>`;
}

function energyLoginRows(accountId) {
  const favChars = loginCharacters.filter(c => c.accountId === accountId && c.favorite);
  if (!favChars.length) return '';
  const pills = favChars.map(c => {
    const blue = computeEnergy(c.blueEnergy);
    const red  = computeEnergy(c.redEnergy);
    if (blue === null && red === null) return '';
    return `<div class="energy-char-pill">
      <div class="energy-char-val">
        ${red  !== null ? `<span>${ICON_ENERGY_RED} ${red}/${c.redEnergy.max}</span>`   : ''}
        ${red !== null && blue !== null ? `<span class="energy-sep"></span>` : ''}
        ${blue !== null ? `<span>${ICON_ENERGY_BLUE} ${blue}/${c.blueEnergy.max}</span>` : ''}
      </div>
      <div class="energy-char-name">
        ${c.clan ? `<img src="../assets/cla/${escapeHtml(c.clan)}.png" class="energy-clan-icon" onerror="this.style.display='none'" />` : ''}
        ${escapeHtml(c.name)}
      </div>
    </div>`;
  }).filter(Boolean).join('');
  return pills ? `<div class="energy-login-section">${pills}</div>` : '';
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
        ${houseLoginIcon(a.id)}
      </div>
      <div class="account-card-badges">
        ${vipBadge(a)}
      </div>
      ${energyLoginRows(a.id)}
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
        <div id="pw-section-${a.id}">
          <button class="btn-secondary panel-pw-trigger" onclick="showPwForm(${a.id})">Mudar senha</button>
        </div>
        <div id="pw-form-${a.id}" style="display:none">
          <label class="panel-label">Nova senha</label>
          <div class="panel-pw-field-row">
            <input type="password" class="panel-pw-input" id="pw-input-${a.id}"
              placeholder="••••••••" autocomplete="new-password" />
            <button class="btn-icon panel-pw-eye" onclick="togglePanelPass(${a.id})" title="Mostrar/ocultar">
              <img src="../assets/icons/hide.svg" id="pw-eye-${a.id}" class="pw-eye-icon" />
            </button>
          </div>
          <div class="panel-pw-btns">
            <button class="btn-primary panel-pw-btn" onclick="savePassword(${a.id})">Salvar</button>
            <button class="btn-secondary panel-pw-btn" onclick="hidePwForm(${a.id})">Cancelar</button>
          </div>
          <div class="panel-status" id="pw-status-${a.id}"></div>
        </div>
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

async function runAutoLoginFor(id) {
  setStatus('login-status', '⏳ Procurando jogo...', 'ok');
  const res = await window.api.runAutoLoginFor(id);
  if (res.success) setStatus('login-status', '✓ Login executado!', 'ok');
  else setStatus('login-status', '✗ ' + res.error, 'err');
}

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
  accounts       = await window.api.deleteAccount(id);
  loginCharacters = await window.api.getCharacters();
  renderAccountsLogin();
  renderAccountsConfig();
  if (typeof loadCharacters === 'function') loadCharacters();
}

function toggleNewPass() {
  const input = document.getElementById('new-acc-pass');
  const img   = document.getElementById('new-acc-eye');
  const hide  = input.type === 'password';
  input.type  = hide ? 'text' : 'password';
  img.src     = hide ? '../assets/icons/show.svg' : '../assets/icons/hide.svg';
}

function toggleAccountPanel(id, btn) {
  const panel = document.getElementById('panel-' + id);
  const open  = panel.style.display === 'block';
  panel.style.display = open ? 'none' : 'block';
  btn.textContent = open ? '▸' : '▾';
  const row = btn.closest('.account-config-row');
  row.style.borderRadius = open ? '' : 'var(--radius) var(--radius) 0 0';
  row.style.marginBottom = open ? '' : '0';
}

function showPwForm(id) {
  document.getElementById('pw-section-' + id).style.display = 'none';
  document.getElementById('pw-form-' + id).style.display = 'block';
  document.getElementById('pw-input-' + id).focus();
}

function hidePwForm(id) {
  document.getElementById('pw-input-' + id).value = '';
  document.getElementById('pw-status-' + id).textContent = '';
  document.getElementById('pw-eye-' + id).src = '../assets/icons/hide.svg';
  const input = document.getElementById('pw-input-' + id);
  input.type = 'password';
  document.getElementById('pw-form-' + id).style.display = 'none';
  document.getElementById('pw-section-' + id).style.display = 'block';
}

function togglePanelPass(id) {
  const input = document.getElementById('pw-input-' + id);
  const img   = document.getElementById('pw-eye-' + id);
  const hide  = input.type === 'password';
  input.type  = hide ? 'text' : 'password';
  img.src     = hide ? '../assets/icons/show.svg' : '../assets/icons/hide.svg';
}

async function savePassword(id) {
  const input = document.getElementById('pw-input-' + id);
  const pw = input.value;
  if (!pw) {
    setStatus('pw-status-' + id, '✗ Digite a nova senha.', 'err');
    return;
  }
  await window.api.setPassword(id, pw);
  hidePwForm(id);
}

async function saveVip(id) {
  const input = document.getElementById('vip-input-' + id);
  const days  = parseInt(input.value, 10);
  if (isNaN(days) || days < 0) {
    setStatus('vip-status-' + id, '✗ Valor inválido.', 'err');
    return;
  }
  accounts = await window.api.setVip(id, days);
  setStatus('vip-status-' + id, '✓ Salvo!', 'ok');
  renderAccountsLogin();
}

function showCharForm(accountId) {
  document.getElementById(`char-form-${accountId}`).style.display = 'block';
}

function hideCharForm(accountId) {
  document.getElementById(`char-form-${accountId}`).style.display = 'none';
  document.getElementById(`char-name-${accountId}`).value   = '';
  document.getElementById(`char-server-${accountId}`).value = '';
  selectClan(`char-clan-${accountId}`, '');
  selectLevelTagIn(`level-tags-${accountId}`, document.querySelector(`#level-tags-${accountId} .level-tag`));
  selectBgIn(`bg-picker-add-${accountId}`, document.querySelector(`#bg-picker-add-${accountId} .bg-thumb`));
}

async function addCharacter(accountId) {
  const name   = document.getElementById(`char-name-${accountId}`).value.trim();
  const server = document.getElementById(`char-server-${accountId}`).value.trim();
  const clan   = document.getElementById(`char-clan-${accountId}`)?.dataset.value ?? '';
  const activeTag = document.querySelector(`#level-tags-${accountId} .level-tag--active`);
  const level  = activeTag ? activeTag.textContent.trim() : '300-';
  const activeBg    = document.querySelector(`#bg-picker-add-${accountId} .bg-thumb--active`);
  const customImage = activeBg?.dataset.image || null;
  const bg          = !customImage && activeBg ? activeBg.dataset.bg : 'personagem-bg-01.png';
  if (!name || !server) {
    setStatus(`char-status-${accountId}`, '✗ Nome e Servidor são obrigatórios.', 'err');
    return;
  }
  await window.api.addCharacter({ accountId, name, server, clan, level, bg, image: customImage });
  hideCharForm(accountId);
  if (typeof loadCharacters === 'function') loadCharacters();
}
