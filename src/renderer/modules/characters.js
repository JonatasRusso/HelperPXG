// ─── Characters ────────────────────────────────────────────────────────────────
let characters = [];
let allTasks   = [];

async function loadCharacters() {
  // getTasks runs checkResets (may write updated taskState to store);
  // getCharacters must run after so it reads the already-reset data.
  allTasks   = await window.api.getTasks();
  characters = await window.api.getCharacters();
  renderCharacters();
}

const LEVEL_COLORS = {
  '300-': { color: '#888',     bg: 'rgba(136,136,136,0.25)' },
  '300+': { color: '#4caf50',  bg: 'rgba(76,175,80,0.25)'   },
  '400+': { color: '#2196f3',  bg: 'rgba(33,150,243,0.25)'  },
  '500+': { color: '#ff9800',  bg: 'rgba(255,152,0,0.25)'   },
  '600+': { color: '#e85d5d',  bg: 'rgba(232,93,93,0.25)'   },
};

function levelBadgeStyle(level) {
  return (LEVEL_COLORS[String(level)] || LEVEL_COLORS['300-']).color;
}

function levelBadgeBg(level) {
  return (LEVEL_COLORS[String(level)] || LEVEL_COLORS['300-']).bg;
}

function renderCharacters() {
  const grid     = document.getElementById('char-grid');
  const editArea = document.getElementById('char-edit-area');

  if (!characters.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🧙</div><div>Nenhum personagem cadastrado. Adicione em Config.</div></div>';
    editArea.innerHTML = '';
    return;
  }

  grid.innerHTML = characters.map(c => {
    const bgSrc = c.image
      ? c.image.replace(/'/g, '')
      : c.bg ? `../assets/Personagens/${c.bg}` : '';
    const bgStyle = bgSrc ? `background-image:url('${bgSrc}');` : '';

    const placeholder = !bgSrc
      ? `<div class="char-avatar-placeholder">${escapeHtml(c.name.charAt(0).toUpperCase())}</div>`
      : '';

    const color      = levelBadgeStyle(c.level);
    const bgColor    = levelBadgeBg(c.level);
    const levelBadge = `<span class="char-level-badge" style="color:${color};border-color:${color};background:${bgColor}">${escapeHtml(String(c.level))}</span>`;
    const clanIcon   = c.clan
      ? `<img class="char-clan-icon" src="../assets/cla/${escapeHtml(c.clan)}.png" onerror="this.style.display='none'" />`
      : '';

    // Task thumbnails — up to 20 (4 cols × 4 rows + scroll)
    const assignedTasks = c.taskIds
      .map(tid => allTasks.find(t => t.id === tid))
      .filter(Boolean)
      .slice(0, 20);

    const thumbsHtml = assignedTasks.map(t => {
      if (t.energyType === 'blue') {
        const runCount  = (c.runCounts || {})[String(t.id)] ?? 0;
        const blueNow   = computeEnergy(c.blueEnergy);
        const prefIdx   = (c.preferredTiers || {})[String(t.id)];
        const cost      = prefIdx !== undefined ? (t.tiers[prefIdx]?.energyCost ?? 0) : (t.tiers[0]?.energyCost ?? 0);
        const canRun    = blueNow !== null && blueNow >= cost && cost > 0;
        const bonusIcon = runCount < 2 ? '<span class="char-task-bonus">⏫</span>' : '';
        const inner     = t.image
          ? `<img class="char-task-thumb-img" src="${t.image}" />`
          : `<span class="char-task-thumb-letter">${escapeHtml(t.title.charAt(0))}</span>`;
        return `<div class="char-task-energy-wrap" title="${escapeHtml(t.title)}">
          ${inner}${bonusIcon}
          <button class="char-task-run-btn" ${!canRun ? 'disabled title="Energia insuficiente"' : ''}
            onclick="event.stopPropagation(); charRunTask(${c.id}, ${t.id})">✓</button>
        </div>`;
      }

      if (t.energyType === 'red') {
        const done    = !!c.taskState?.[String(t.id)];
        const redNow  = computeEnergy(c.redEnergy);
        const cost    = t.tiers[0]?.energyCost ?? 0;
        const canRun  = !done && redNow !== null && redNow >= cost;
        const inner   = t.image
          ? `<img class="char-task-thumb-img" src="${t.image}" />`
          : `<span class="char-task-thumb-letter">${escapeHtml(t.title.charAt(0))}</span>`;
        const check   = done ? `<span class="char-task-check">✓</span>` : '';
        return `<button class="char-task-thumb ${done ? 'done' : ''}"
          onclick="event.stopPropagation(); charRunRedTask(${c.id}, ${t.id})"
          ${done ? 'disabled' : ''} ${!canRun && !done ? 'title="Energia insuficiente"' : ''}
          title="${escapeHtml(t.title)}">${inner}${check}</button>`;
      }

      // Non-energy task — existing behaviour
      const done  = !!c.taskState[String(t.id)];
      const inner = t.image
        ? `<img class="char-task-thumb-img" src="${t.image}" />`
        : `<span class="char-task-thumb-letter">${escapeHtml(t.title.charAt(0))}</span>`;
      const check = done ? `<span class="char-task-check">✓</span>` : '';
      return `<button class="char-task-thumb ${done ? 'done' : ''}"
        onclick="event.stopPropagation(); charToggleTask(${c.id}, ${t.id})"
        title="${escapeHtml(t.title)}">${inner}${check}</button>`;
    }).join('');

    const blueNow = computeEnergy(c.blueEnergy);
    const redNow  = computeEnergy(c.redEnergy);
    const energyBadge = (blueNow !== null || redNow !== null) ? `
      <div class="char-energy-badge">
        ${blueNow !== null ? `<span class="char-energy-blue${blueNow >= c.blueEnergy.max ? ' full' : ''}">🔵${blueNow}</span>` : ''}
        ${redNow  !== null ? `<span class="char-energy-red${redNow   >= c.redEnergy.max  ? ' full' : ''}">🔴${redNow}</span>`  : ''}
      </div>` : '';

    return `
      <div class="char-card" style="${bgStyle}">
        ${placeholder}
        <div class="char-name-bar">
          <span class="char-name">${escapeHtml(c.name)}</span>
        </div>
        <div class="char-bottom-bar">
          <div class="char-bottom-left">${clanIcon}${levelBadge}</div>
          <span class="char-server">${escapeHtml(c.server)}</span>
        </div>
        ${energyBadge}
        <div class="char-card-hover">
          <div class="char-task-col">${thumbsHtml}</div>
          <button class="char-edit-btn"
            onclick="event.stopPropagation(); openCharEdit(${c.id})"
            title="Editar"><span>✏</span></button>
        </div>
      </div>`;
  }).join('');
}

async function charToggleTask(charId, taskId) {
  characters = await window.api.toggleCharacterTask({ id: charId, taskId });
  renderCharacters();
}

async function charRunTask(charId, taskId) {
  const c    = characters.find(ch => ch.id === charId);
  const task = allTasks.find(t => t.id === taskId);
  if (!c || !task) return;

  let tierIndex = (c.preferredTiers || {})[String(taskId)];

  if (tierIndex === undefined) {
    if (task.tiers.length === 1) {
      tierIndex = 0;
    } else {
      tierIndex = await showTierPickerModal(task);
      if (tierIndex === null) return;
      const preferredTiers = { ...(c.preferredTiers || {}), [String(taskId)]: tierIndex };
      characters = await window.api.setCharacterInfo({
        id: charId, level: c.level, clan: c.clan, bg: c.bg, image: c.image, preferredTiers,
      });
    }
  }

  characters = await window.api.runTask(charId, taskId, tierIndex);
  renderCharacters();
  if (typeof loadAccounts === 'function') loadAccounts();
}

async function charRunRedTask(charId, taskId) {
  const c    = characters.find(ch => ch.id === charId);
  const task = allTasks.find(t => t.id === taskId);
  if (!c || !task) return;
  if (c.taskState?.[String(taskId)]) return; // already done this week

  let tierIndex = (c.preferredTiers || {})[String(taskId)];

  if (tierIndex === undefined) {
    if (task.tiers.length === 1) {
      tierIndex = 0;
    } else {
      tierIndex = await showTierPickerModal(task);
      if (tierIndex === null) return;
      const preferredTiers = { ...(c.preferredTiers || {}), [String(taskId)]: tierIndex };
      characters = await window.api.setCharacterInfo({
        id: charId, level: c.level, clan: c.clan, bg: c.bg, image: c.image, preferredTiers,
      });
    }
  }

  characters = await window.api.runRedTask(charId, taskId, tierIndex);
  renderCharacters();
  if (typeof loadAccounts === 'function') loadAccounts();
}


function openCharEdit(id) {
  const c = characters.find(ch => ch.id === id);
  if (!c) return;
  const area = document.getElementById('char-edit-area');

  const blueE = c.blueEnergy || { current: 0, max: 100, regenMin: 30 };
  const redE  = c.redEnergy  || { current: 0, max: 100, regenMin: 60 };

  const taskChecklist = allTasks.length
    ? allTasks.map(t => {
        const checked = c.taskIds.includes(t.id);
        const img = t.image
          ? `<img class="char-task-checklist-img" src="${t.image}" />`
          : '';
        return `<label class="char-task-check-label">
          <input type="checkbox" value="${t.id}" ${checked ? 'checked' : ''} />
          ${img}
          <span>${escapeHtml(t.title)}</span>
        </label>`;
      }).join('')
    : '<div style="font-size:13px;color:var(--text-muted)">Nenhuma task criada.</div>';

  const currentLevel = String(c.level || '300-');
  const currentBg    = c.bg    || 'personagem-bg-01.png';
  const currentImage = c.image || null;

  area.innerHTML = `
    <div class="char-edit-panel">
      <button class="char-close-btn" onclick="closeCharEdit()" title="Fechar">✕</button>

      <div class="char-edit-header">
        <span id="edit-name-display-${id}" class="char-edit-name">${escapeHtml(c.name)}</span>
        <button class="char-rename-btn" onclick="toggleNameEdit(${id})" title="Renomear"><span>✏</span></button>
        <input type="text" id="edit-name-${id}" class="char-name-input"
          value="${escapeHtml(c.name)}" maxlength="60" style="display:none" />
      </div>

      <label class="field-label">Level</label>
      ${levelTagsHtml(`edit-level-tags-${id}`, currentLevel)}

      <label class="field-label" style="margin-top:8px">Clã</label>
      ${clanDropdownHtml(`edit-clan-${id}`, c.clan || '')}

      <label class="field-label" style="margin-top:8px">Background</label>
      ${bgPickerHtml(`edit-bg-${id}`, currentBg, currentImage)}

      <label class="field-label" style="margin-top:8px">Tasks</label>
      <div class="char-tasklist">${taskChecklist}</div>

      <label class="field-label" style="margin-top:8px">Energia</label>
      <div class="energy-edit-section">
        <div class="energy-edit-row">
          <span class="energy-edit-label">🔵 Azul</span>
          <label class="energy-edit-field">Atual <input type="number" id="e-blue-cur-${id}" value="${blueE.current}" min="0" /></label>
          <label class="energy-edit-field">Máx <input type="number" id="e-blue-max-${id}" value="${blueE.max}" min="1" /></label>
          <label class="energy-edit-field">Regen <input type="number" id="e-blue-reg-${id}" value="${blueE.regenMin}" min="1" /> min</label>
        </div>
        <div class="energy-edit-row">
          <span class="energy-edit-label">🔴 Vermelha</span>
          <label class="energy-edit-field">Atual <input type="number" id="e-red-cur-${id}" value="${redE.current}" min="0" /></label>
          <label class="energy-edit-field">Máx <input type="number" id="e-red-max-${id}" value="${redE.max}" min="1" /></label>
          <label class="energy-edit-field">Regen <input type="number" id="e-red-reg-${id}" value="${redE.regenMin}" min="1" /> min</label>
        </div>
      </div>
      <label class="field-label" style="margin-top:8px;display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="checkbox" id="e-favorite-${id}" ${c.favorite ? 'checked' : ''} />
        ⭐ Favorito na conta
      </label>

      <div class="char-edit-actions">
        <button class="btn-primary" onclick="charSaveAll(${id})">Salvar</button>
        <button class="btn-danger"  onclick="showConfirmModal('Você quer mesmo excluir?', () => charDelete(${id}))">Excluir</button>
      </div>
    </div>`;
}

function toggleNameEdit(id) {
  const display = document.getElementById(`edit-name-display-${id}`);
  const input   = document.getElementById(`edit-name-${id}`);
  const opening = input.style.display === 'none';
  display.style.display = opening ? 'none' : '';
  input.style.display   = opening ? ''     : 'none';
  if (opening) input.focus();
}

function closeCharEdit() {
  document.getElementById('char-edit-area').innerHTML = '';
}

async function charSaveAll(id) {
  const nameInput = document.getElementById(`edit-name-${id}`);
  const name = nameInput.style.display !== 'none' ? nameInput.value.trim() : null;

  const activeTag = document.querySelector(`#edit-level-tags-${id} .level-tag--active`);
  const level = activeTag ? activeTag.textContent.trim() : '300-';

  const clan = document.getElementById(`edit-clan-${id}`).value;

  const activeBg    = document.querySelector(`#edit-bg-${id} .bg-thumb--active`);
  const customImage = activeBg?.dataset.image || null;
  const bg          = !customImage && activeBg ? activeBg.dataset.bg : null;
  const image       = customImage;

  const checkboxes = document.querySelectorAll('#char-edit-area .char-tasklist input[type="checkbox"]');
  const taskIds = Array.from(checkboxes).filter(cb => cb.checked).map(cb => Number(cb.value));
  console.log('[charSaveAll] checkboxes total:', checkboxes.length, '| checked taskIds:', JSON.stringify(taskIds));

  const c = characters.find(ch => ch.id === id);

  const blueCur = parseInt(document.getElementById(`e-blue-cur-${id}`)?.value, 10);
  const blueMax = parseInt(document.getElementById(`e-blue-max-${id}`)?.value, 10);
  const blueReg = parseInt(document.getElementById(`e-blue-reg-${id}`)?.value, 10);
  const redCur  = parseInt(document.getElementById(`e-red-cur-${id}`)?.value, 10);
  const redMax  = parseInt(document.getElementById(`e-red-max-${id}`)?.value, 10);
  const redReg  = parseInt(document.getElementById(`e-red-reg-${id}`)?.value, 10);
  const favorite = document.getElementById(`e-favorite-${id}`)?.checked ?? (c?.favorite ?? false);

  const blueEnergy = !isNaN(blueCur)
    ? { current: Math.max(0, blueCur), max: Math.max(1, blueMax || 100), regenMin: Math.max(1, blueReg || 30) }
    : (c?.blueEnergy ?? null);
  const redEnergy = !isNaN(redCur)
    ? { current: Math.max(0, redCur), max: Math.max(1, redMax || 100), regenMin: Math.max(1, redReg || 60) }
    : (c?.redEnergy ?? null);

  allTasks   = await window.api.getTasks();
  characters = await window.api.setCharacterInfo({
    id, level, clan, bg, image, name, taskIds,
    blueEnergy, redEnergy, favorite,
    preferredTiers: c?.preferredTiers || {},
  });
  renderCharacters();
  closeCharEdit();
  if (typeof loadAccounts === 'function') loadAccounts();
}

async function charDelete(id) {
  characters = await window.api.deleteCharacter(id);
  document.getElementById('char-edit-area').innerHTML = '';
  renderCharacters();
}

// ─── Tier picker modal ────────────────────────────────────────────────────────
function showTierPickerModal(task) {
  return new Promise(resolve => {
    document.getElementById('tier-picker-title').textContent = task.title;
    document.getElementById('tier-picker-list').innerHTML = task.tiers.map((tier, i) =>
      `<button class="tier-picker-btn" onclick="resolveTierPicker(${i})">${escapeHtml(tier.name)} — ${tier.energyCost}⚡</button>`
    ).join('');
    window._tierPickerResolve = resolve;
    document.getElementById('tier-picker-modal').style.display = 'flex';
  });
}

function resolveTierPicker(idx) {
  document.getElementById('tier-picker-modal').style.display = 'none';
  if (window._tierPickerResolve) { window._tierPickerResolve(idx); window._tierPickerResolve = null; }
}

function cancelTierPicker() {
  document.getElementById('tier-picker-modal').style.display = 'none';
  if (window._tierPickerResolve) { window._tierPickerResolve(null); window._tierPickerResolve = null; }
}
