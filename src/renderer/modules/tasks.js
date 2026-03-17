// ─── Tasks ────────────────────────────────────────────────────────────────────
let tasks = [];

async function loadTasks() {
  tasks = await window.api.getTasks();
  renderTasks();
}

function taskTypeBadge(type) {
  const map = { daily: ['D', 'badge-daily'], weekly: ['S', 'badge-weekly'], monthly: ['M', 'badge-monthly'] };
  const [label, cls] = map[type] || ['?', ''];
  return `<span class="task-badge ${cls}">${label}</span>`;
}

function renderTasks() {
  const list    = document.getElementById('task-list');
  const counter = document.getElementById('tasks-counter');
  const done    = tasks.filter(t => t.done).length;
  counter.textContent = `${done}/${tasks.length}`;

  if (!tasks.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">☑</div><div>Nenhuma task. Adicione uma acima.</div></div>';
    return;
  }

  list.innerHTML = tasks.map((t, idx) => `
    <div class="task-item ${t.done ? 'done' : ''}" id="task-${t.id}">
      <div class="task-reorder">
        <button class="task-move" onclick="moveTask(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="Mover cima">▲</button>
        <button class="task-move" onclick="moveTask(${idx},  1)" ${idx === tasks.length - 1 ? 'disabled' : ''} title="Mover baixo">▼</button>
      </div>
      <input type="checkbox" class="task-checkbox" ${t.done ? 'checked' : ''}
        onchange="toggleTask(${t.id})" />
      <span class="task-title">${escapeHtml(t.title)}</span>
      ${taskTypeBadge(t.type)}
      ${t.serverSave ? '<span class="task-ss-icon" title="Reseta no Server Save">⏰</span>' : ''}
      <button class="task-delete" onclick="deleteTask(${t.id})" title="Remover">✕</button>
    </div>
  `).join('');
}

async function addTask() {
  const input      = document.getElementById('task-input');
  const typeSelect = document.getElementById('task-type');
  const ssCheck    = document.getElementById('task-server-save');
  const title      = input.value.trim();
  if (!title) return;
  await window.api.addTask({
    title,
    type:       typeSelect.value,
    serverSave: ssCheck.checked,
  });
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

async function moveTask(idx, dir) {
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= tasks.length) return;
  const reordered = [...tasks];
  const [moved] = reordered.splice(idx, 1);
  reordered.splice(newIdx, 0, moved);
  tasks = await window.api.reorderTasks(reordered.map(t => t.id));
  renderTasks();
}

document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});
