// ─── Tasks ────────────────────────────────────────────────────────────────────
let tasks = [];

async function loadTasks() {
  tasks = await window.api.getTasks();
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById('task-list');
  const counter = document.getElementById('tasks-counter');
  const done = tasks.filter(t => t.done).length;
  counter.textContent = `${done}/${tasks.length}`;

  if (!tasks.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">☑</div><div>Nenhuma task. Adicione uma acima.</div></div>';
    return;
  }

  list.innerHTML = tasks.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}" id="task-${t.id}">
      <input type="checkbox" class="task-checkbox" ${t.done ? 'checked' : ''}
        onchange="toggleTask(${t.id})" />
      <span class="task-title">${escapeHtml(t.title)}</span>
      <button class="task-delete" onclick="deleteTask(${t.id})" title="Remover">✕</button>
    </div>
  `).join('');
}

async function addTask() {
  const input = document.getElementById('task-input');
  const title = input.value.trim();
  if (!title) return;
  await window.api.addTask(title);
  input.value = '';
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

document.getElementById('task-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});
