// ─── Tasks ────────────────────────────────────────────────────────────────────
let tasks = [];
let taskDragSrcIdx = null;

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
    <div class="task-item ${t.done ? 'done' : ''}" id="task-${t.id}"
      draggable="true"
      ondragstart="onTaskDragStart(event, ${idx})"
      ondragover="onTaskDragOver(event, ${idx})"
      ondrop="onTaskDrop(event, ${idx})"
      ondragend="onTaskDragEnd()"
      ondragleave="onTaskDragLeave(event)">
      <span class="task-drag-handle">⠿</span>
      ${t.image
        ? `<img class="task-thumb" src="${t.image}" onclick="pickTaskImage(${t.id})" title="Clique para trocar imagem" />`
        : `<button class="task-img-btn" onclick="pickTaskImage(${t.id})" title="Adicionar imagem">＋🖼</button>`
      }
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

async function pickTaskImage(id) {
  const updated = await window.api.setTaskImage(id);
  if (updated) { tasks = updated; renderTasks(); }
}

// ── Drag-and-drop ──
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
  const reordered = [...tasks];
  const [moved] = reordered.splice(taskDragSrcIdx, 1);
  reordered.splice(idx, 0, moved);
  tasks = await window.api.reorderTasks(reordered.map(t => t.id));
  renderTasks();
}

document.getElementById('task-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});
