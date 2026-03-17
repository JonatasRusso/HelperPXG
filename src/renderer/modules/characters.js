// ─── Characters ────────────────────────────────────────────────────────────────
let characters = [];
let allTasks   = [];

async function loadCharacters() {
  [characters, allTasks] = await Promise.all([
    window.api.getCharacters(),
    window.api.getTasks(),
  ]);
  renderCharacters();
}

function levelBadgeStyle(level) {
  if (level >= 600) return '#e85d5d';
  if (level >= 500) return '#ff9800';
  if (level >= 400) return '#2196f3';
  if (level >= 300) return '#4caf50';
  return '#888';
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
    const bgStyle   = c.image ? `background-image:url('${c.image}');` : '';
    const placeholder = !c.image
      ? `<div class="char-avatar-placeholder">${escapeHtml(c.name.charAt(0).toUpperCase())}</div>`
      : '';

    const color = levelBadgeStyle(c.level);
    const levelBadge = `<span class="char-level-badge" style="color:${color};border-color:${color}">${c.level}</span>`;
    const clanHtml   = c.clan ? `<span class="char-clan">${escapeHtml(c.clan)}</span>` : '';
    const serverHtml = `<span class="char-server">${escapeHtml(c.server)}</span>`;

    // Task thumbnails (up to 7)
    const assignedTasks = c.taskIds
      .map(tid => allTasks.find(t => t.id === tid))
      .filter(Boolean)
      .slice(0, 7);

    const thumbsHtml = assignedTasks.map(t => {
      const done = !!c.taskState[String(t.id)];
      const inner = t.image
        ? `<img class="char-task-thumb-img" src="${t.image}" />`
        : `<span class="char-task-thumb-letter">${escapeHtml(t.title.charAt(0))}</span>`;
      const check = done ? `<span class="char-task-check">✓</span>` : '';
      return `<button class="char-task-thumb ${done ? 'done' : ''}"
        onclick="event.stopPropagation(); charToggleTask(${c.id}, ${t.id})"
        title="${escapeHtml(t.title)}">${inner}${check}</button>`;
    }).join('');

    return `
      <div class="char-card" style="${bgStyle}"
           onclick="pickCharacterImage(${c.id})">
        ${placeholder}
        <div class="char-card-info">
          <div class="char-name">${escapeHtml(c.name)}</div>
          <div class="char-meta">${levelBadge}${clanHtml}${serverHtml}</div>
        </div>
        <div class="char-card-hover">
          <div class="char-task-row">
            ${thumbsHtml}
            <button class="char-edit-btn"
              onclick="event.stopPropagation(); openCharEdit(${c.id})"
              title="Editar">✏</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

async function charToggleTask(charId, taskId) {
  characters = await window.api.toggleCharacterTask({ id: charId, taskId });
  renderCharacters();
}

async function pickCharacterImage(id) {
  const updated = await window.api.setCharacterImage(id);
  if (updated) { characters = updated; renderCharacters(); }
}

function openCharEdit(id) {
  const c = characters.find(ch => ch.id === id);
  if (!c) return;
  const area = document.getElementById('char-edit-area');

  const taskChecklist = allTasks.length
    ? allTasks.map(t => {
        const checked = c.taskIds.includes(t.id);
        const img = t.image
          ? `<img class="char-task-checklist-img" src="${t.image}" />`
          : '';
        return `<label class="char-task-check-label">
          <input type="checkbox" value="${t.id}" ${checked ? 'checked' : ''}
            onchange="charSetTasks(${id})" />
          ${img}
          <span>${escapeHtml(t.title)}</span>
        </label>`;
      }).join('')
    : '<div style="font-size:13px;color:var(--text-muted)">Nenhuma task criada.</div>';

  area.innerHTML = `
    <div class="char-edit-panel">
      <div class="char-edit-header">Editando: <strong>${escapeHtml(c.name)}</strong></div>

      <div class="char-edit-row">
        <input type="number" id="char-level-${id}" value="${c.level}" min="1" max="9999" />
        <input type="text"   id="char-clan-${id}"  value="${escapeHtml(c.clan || '')}"
          placeholder="Clã (opcional)" maxlength="60" />
        <button class="btn-primary" onclick="charSaveInfo(${id})">Salvar</button>
      </div>

      <label class="field-label">Tasks</label>
      <div class="char-tasklist">${taskChecklist}</div>

      <button class="btn-danger" onclick="charDelete(${id})">Excluir personagem</button>
    </div>`;
}

async function charSetTasks(charId) {
  const checkboxes = document.querySelectorAll('#char-edit-area input[type="checkbox"]');
  const taskIds    = Array.from(checkboxes).filter(cb => cb.checked).map(cb => Number(cb.value));
  characters = await window.api.setCharacterTasks({ id: charId, taskIds });
  allTasks   = await window.api.getTasks(); // refresh in case tasks changed
  renderCharacters();
  openCharEdit(charId);
}

async function charSaveInfo(id) {
  const level = parseInt(document.getElementById(`char-level-${id}`).value, 10);
  const clan  = document.getElementById(`char-clan-${id}`).value.trim();
  if (isNaN(level) || level < 1) return;
  characters = await window.api.setCharacterInfo({ id, level, clan });
  renderCharacters();
  openCharEdit(id);
}

async function charDelete(id) {
  characters = await window.api.deleteCharacter(id);
  document.getElementById('char-edit-area').innerHTML = '';
  renderCharacters();
}
