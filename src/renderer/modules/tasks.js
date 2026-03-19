// ─── Tasks ────────────────────────────────────────────────────────────────────
let tasks = [];
let taskDragSrcIdx = null;
let energyCharacters = []; // loaded on demand when switching to energy tab
let disabledVisible = false;

async function loadTasks() {
  tasks = await window.api.getTasks();
  energyCharacters = await window.api.getCharacters();
  populateTaskCharSelect();
  const activeTab = document.querySelector('.task-tab.active')?.dataset.tab || 'all';
  if (activeTab === 'all') renderTasks();
}

function populateTaskCharSelect() {
  const select = document.getElementById('task-char-select');
  if (!select) return;
  const current = select.value;
  select.innerHTML = energyCharacters.map(c =>
    `<option value="${c.id}" ${String(c.id) === current ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
  ).join('');
}

// ── "Todas" tab ──────────────────────────────────────────────────────────────

function taskTypeBadge(type) {
  const map = { daily: ['D', 'badge-daily'], weekly: ['S', 'badge-weekly'], monthly: ['M', 'badge-monthly'] };
  const [label, cls] = map[type] || ['?', ''];
  return `<span class="task-badge ${cls}">${label}</span>`;
}

function renderTasks() {
  const nonEnergy = tasks.filter(t => !t.energyType && !t.disabled);
  const list    = document.getElementById('task-list');
  const counter = document.getElementById('tasks-counter');
  const done    = nonEnergy.filter(t => t.done).length;
  counter.textContent = `${done}/${nonEnergy.length}`;

  const charId = Number(document.getElementById('task-char-select')?.value);
  const c      = energyCharacters.find(ch => ch.id === charId);
  const hidden = c?.hiddenMDs || {};

  if (!nonEnergy.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">☑</div><div>Nenhuma task. Adicione uma acima.</div></div>';
  } else {
    list.innerHTML = nonEnergy.map((t, idx) => {
      const isDefault = !!t.slug;
      const deleteBtn = isDefault
        ? `<button class="task-delete" onclick="setTaskDisabled(${t.id}, true)" title="Desativar">🚫</button>`
        : `<button class="task-delete" onclick="deleteTask(${t.id})" title="Remover">✕</button>`;
      const isHidden = !!hidden[String(t.id)];
      const visBtn = c
        ? `<button class="energy-vis-btn" onclick="toggleRegularTaskHidden(${charId},${t.id},${isHidden})" title="${isHidden ? 'Mostrar' : 'Ocultar'} no card">
             ${isHidden ? ICON_SHOW : ICON_HIDE}
           </button>`
        : '';
      return `
        <div class="task-item ${t.done ? 'done' : ''}${isHidden ? ' task-hidden-char' : ''}" id="task-${t.id}"
          draggable="true"
          ondragstart="onTaskDragStart(event, ${idx})"
          ondragover="onTaskDragOver(event, ${idx})"
          ondrop="onTaskDrop(event, ${idx})"
          ondragend="onTaskDragEnd()"
          ondragleave="onTaskDragLeave(event)">
          <span class="task-drag-handle">⠿</span>
          ${visBtn}
          ${t.image
            ? `<img class="task-thumb" src="${t.image}" onclick="pickTaskImage(${t.id})" title="Clique para trocar imagem" />`
            : `<button class="task-img-btn" onclick="pickTaskImage(${t.id})" title="Adicionar imagem">＋🖼</button>`
          }
          <input type="checkbox" class="task-checkbox" ${t.done ? 'checked' : ''}
            onchange="toggleTask(${t.id})" />
          <span class="task-title">${escapeHtml(t.title)}</span>
          ${taskTypeBadge(t.type)}
          ${t.serverSave ? '<span class="task-ss-icon" title="Reseta no Server Save">⏰</span>' : ''}
          ${deleteBtn}
        </div>`;
    }).join('');
  }

  if (disabledVisible) renderDisabledList();
}

function renderDisabledList() {
  const disabled = tasks.filter(t => t.disabled);
  const list = document.getElementById('task-disabled-list');
  if (!disabled.length) {
    list.innerHTML = '<div style="font-size:13px;color:var(--text-muted);padding:8px 0">Nenhuma task desativada.</div>';
    return;
  }
  list.innerHTML = disabled.map(t => `
    <div class="task-disabled-row">
      <span class="task-disabled-title">${escapeHtml(t.title)}</span>
      <button class="btn-secondary" style="font-size:12px;padding:3px 10px"
        onclick="setTaskDisabled(${t.id}, false)">Reativar</button>
    </div>`).join('');
}

function toggleDisabledSection() {
  disabledVisible = !disabledVisible;
  const section = document.getElementById('task-disabled-section');
  const btn = document.querySelector('.task-show-disabled');
  section.style.display = disabledVisible ? 'block' : 'none';
  btn.textContent = disabledVisible ? 'Ocultar desativadas' : 'Mostrar desativadas';
  if (disabledVisible) renderDisabledList();
}

async function setTaskDisabled(id, disabled) {
  tasks = await window.api.setDisabledTask(id, disabled);
  renderTasks();
  if (disabledVisible) renderDisabledList();
}

// ── Energy tabs ───────────────────────────────────────────────────────────────

async function switchTaskTab(tab) {
  document.querySelectorAll('.task-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.task-tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`task-tab-${tab}`).classList.remove('hidden');

  if (tab === 'blue' || tab === 'red') {
    energyCharacters = await window.api.getCharacters();
    populateEnergyCharSelect(tab);
    renderEnergyTab(tab);
  }
}

function populateEnergyCharSelect(type) {
  const select = document.getElementById(`energy-char-select-${type}`);
  const current = select.value;
  select.innerHTML = energyCharacters.map(c =>
    `<option value="${c.id}" ${String(c.id) === current ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
  ).join('');
}

function renderEnergyTab(type) {
  const select = document.getElementById(`energy-char-select-${type}`);
  const list   = document.getElementById(`energy-list-${type}`);
  const charId = Number(select.value);
  const c      = energyCharacters.find(ch => ch.id === charId);
  const energyTasks = tasks.filter(t => t.energyType === type && !t.disabled);

  if (!c) {
    list.innerHTML = '<div class="empty-state">Selecione um personagem.</div>';
    return;
  }
  if (!energyTasks.length) {
    list.innerHTML = '<div class="empty-state">Nenhuma task de energia cadastrada.</div>';
    return;
  }

  const order    = (c.mdOrder || {})[type] || [];
  const hiddenMDs = c.hiddenMDs || {};
  const sorted = [...energyTasks].sort((a, b) => {
    const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  list.innerHTML = sorted.map((t, idx) => {
    const isHidden = !!hiddenMDs[String(t.id)];
    const hiddenClass = isHidden ? ' energy-task-hidden' : '';
    const visBtn = `<button class="energy-vis-btn" title="${isHidden ? 'Mostrar' : 'Esconder'}"
      onclick="toggleTaskHidden(${c.id}, ${t.id}, ${isHidden})">${isHidden ? ICON_HIDE : ICON_SHOW}</button>`;

    const dragAttrs = `draggable="true"
      ondragstart="onEnergyDragStart(event,${idx})"
      ondragover="onEnergyDragOver(event,${idx})"
      ondrop="onEnergyDrop(event,${idx},'${type}',${c.id})"
      ondragend="onEnergyDragEnd()"
      ondragleave="onEnergyDragLeave(event)"`;

    if (type === 'red' || t.tiers.length === 1) {
      const cost = t.tiers[0]?.energyCost ?? 0;
      const icon = type === 'red' ? ICON_ENERGY_RED : ICON_ENERGY_BLUE;
      return `
        <div class="energy-task-row energy-task-row--inline${hiddenClass}" data-id="${t.id}" ${dragAttrs}>
          <span class="energy-drag-handle">⠿</span>${visBtn}
          <span class="energy-task-title">${escapeHtml(t.title)}</span>
          <span class="energy-task-cost">${icon} ${cost}</span>
        </div>`;
    }
    const preferred = (c.preferredTiers || {})[String(t.id)];
    const chips = t.tiers.map((tier, i) =>
      `<button class="tier-chip ${preferred === i ? 'tier-chip--active' : ''}"
        onclick="setPreferredTier(${c.id}, ${t.id}, ${i})">${escapeHtml(tier.name)} ${ICON_ENERGY_BLUE} ${tier.energyCost}</button>`
    ).join('');
    return `
      <div class="energy-task-row${hiddenClass}" data-id="${t.id}" ${dragAttrs}>
        <div class="energy-task-row-top">
          <span class="energy-drag-handle">⠿</span>${visBtn}
          <span class="energy-task-title">${escapeHtml(t.title)}</span>
        </div>
        <div class="energy-task-tiers">${chips}</div>
      </div>`;
  }).join('');
}

async function setPreferredTier(charId, taskId, tierIndex) {
  const c = energyCharacters.find(ch => ch.id === charId);
  if (!c) return;
  const preferredTiers = { ...(c.preferredTiers || {}), [String(taskId)]: tierIndex };
  const updated = await window.api.setCharacterInfo({
    id: charId, level: c.level, clan: c.clan, bg: c.bg, image: c.image, preferredTiers,
  });
  energyCharacters = updated;
  const activeTab = document.querySelector('.task-tab.active')?.dataset.tab;
  if (activeTab === 'blue' || activeTab === 'red') renderEnergyTab(activeTab);
}

// ── Regular task hide/show (per character) ────────────────────────────────────
async function toggleRegularTaskHidden(charId, taskId, currentlyHidden) {
  const c = energyCharacters.find(ch => ch.id === charId);
  if (!c) return;
  const hiddenMDs = { ...(c.hiddenMDs || {}), [String(taskId)]: !currentlyHidden };
  const updated = await window.api.setCharacterInfo({ id: charId, hiddenMDs, level: c.level, clan: c.clan, bg: c.bg, image: c.image });
  energyCharacters = updated;
  renderTasks();
}

// ── Energy task hide/show (per character) ─────────────────────────────────────
async function toggleTaskHidden(charId, taskId, currentlyHidden) {
  const c = energyCharacters.find(ch => ch.id === charId);
  if (!c) return;
  const hiddenMDs = { ...(c.hiddenMDs || {}), [String(taskId)]: !currentlyHidden };
  const updated = await window.api.setCharacterInfo({
    id: charId, level: c.level, clan: c.clan, bg: c.bg, image: c.image, hiddenMDs,
  });
  energyCharacters = updated;
  const activeTab = document.querySelector('.task-tab.active')?.dataset.tab;
  if (activeTab === 'blue' || activeTab === 'red') renderEnergyTab(activeTab);
}

// ── Energy task drag-and-drop (per character) ─────────────────────────────────
let energyDragSrcIdx = null;

function onEnergyDragStart(e, idx) {
  energyDragSrcIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}

function onEnergyDragOver(e, idx) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.energy-task-row').forEach((r, i) => {
    r.classList.toggle('drag-over', i === idx && idx !== energyDragSrcIdx);
  });
}

function onEnergyDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onEnergyDragEnd() {
  document.querySelectorAll('.energy-task-row').forEach(r => r.classList.remove('drag-over', 'dragging'));
}

async function onEnergyDrop(e, idx, type, charId) {
  e.preventDefault();
  onEnergyDragEnd();
  if (energyDragSrcIdx === null || energyDragSrcIdx === idx) return;
  const c = energyCharacters.find(ch => ch.id === charId);
  if (!c) return;

  const order = (c.mdOrder || {})[type] || [];
  const energyTasks = tasks.filter(t => t.energyType === type && !t.disabled);
  const sorted = [...energyTasks].sort((a, b) => {
    const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const reordered = [...sorted];
  const [moved] = reordered.splice(energyDragSrcIdx, 1);
  reordered.splice(idx, 0, moved);

  const mdOrder = { ...(c.mdOrder || {}), [type]: reordered.map(t => t.id) };
  const updated = await window.api.setCharacterInfo({
    id: charId, level: c.level, clan: c.clan, bg: c.bg, image: c.image, mdOrder,
  });
  energyCharacters = updated;
  renderEnergyTab(type);
}

// ── Task CRUD ─────────────────────────────────────────────────────────────────

async function addTask() {
  const input      = document.getElementById('task-input');
  const typeSelect = document.getElementById('task-type');
  const ssCheck    = document.getElementById('task-server-save');
  const title      = input.value.trim();
  if (!title) return;
  await window.api.addTask({ title, type: typeSelect.value, serverSave: ssCheck.checked });
  input.value     = '';
  ssCheck.checked = false;
  await loadTasks();
}

async function toggleTask(id) {
  tasks = await window.api.toggleTask(id);
  renderTasks();
}

async function deleteTask(id) {
  tasks = await window.api.deleteTask(id);
  renderTasks();
}

async function pickTaskImage(id) {
  const updated = await window.api.setTaskImage(id);
  if (updated) { tasks = updated; renderTasks(); }
}

// ── Drag-and-drop ─────────────────────────────────────────────────────────────

function onTaskDragStart(e, idx) {
  taskDragSrcIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}

function onTaskDragOver(e, idx) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.task-item').forEach((el, i) => {
    el.classList.toggle('drag-over', i === idx && idx !== taskDragSrcIdx);
  });
}

function onTaskDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onTaskDragEnd() {
  document.querySelectorAll('.task-item').forEach(el => {
    el.classList.remove('drag-over', 'dragging');
  });
}

async function onTaskDrop(e, idx) {
  e.preventDefault();
  onTaskDragEnd();
  if (taskDragSrcIdx === null || taskDragSrcIdx === idx) return;
  const nonEnergy = tasks.filter(t => !t.energyType && !t.disabled);
  const reordered = [...nonEnergy];
  const [moved] = reordered.splice(taskDragSrcIdx, 1);
  reordered.splice(idx, 0, moved);
  tasks = await window.api.reorderTasks(reordered.map(t => t.id));
  renderTasks();
}

document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});
