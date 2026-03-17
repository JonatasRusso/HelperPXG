# Tasks Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simple task system with a typed (daily/weekly/monthly), auto-resetting task system with move up/down reordering and visible delete.

**Architecture:** Main process handles all reset logic via `calcNextResetAt()` helper. `tasks:get` runs a startup reset check before returning. Renderer gets a new form (name + type dropdown + server save checkbox) and task cards with type badges, server save icon, reorder buttons, and visible delete. No new dependencies — BRT offset is a fixed constant (UTC-3).

**Tech Stack:** Electron IPC, electron-store, vanilla JS/CSS

---

## Files Changed

| File | Change |
|------|--------|
| `src/main/handlers/tasks.js` | Full rewrite: reset logic, updated add/get, new reorder handler |
| `src/main/preload.js` | Add `reorderTasks` |
| `src/renderer/index.html` | Update task form (add type select + server save checkbox) |
| `src/renderer/modules/tasks.js` | Full rewrite: new form read, render with badges + reorder, moveTask |
| `src/renderer/styles/tasks.css` | Add badge, server-save icon, reorder button, task-options-row styles |

---

## Task 1: Backend — reset logic + updated handlers

**Files:**
- Modify: `src/main/handlers/tasks.js`

- [ ] **Step 1: Rewrite `src/main/handlers/tasks.js` in full**

```js
const { ipcMain } = require('electron');
const store = require('../store');

// ─── BRT reset time helper ────────────────────────────────────────────────────
// BRT = UTC-3. Server save resets at 07:40 BRT = 10:40 UTC.
const RESET_HOUR_UTC = 10;
const RESET_MIN_UTC  = 40;

function calcNextResetAt(type, serverSave) {
  const now = Date.now();

  if (!serverSave) {
    const durations = { daily: 86400000, weekly: 7 * 86400000, monthly: 30 * 86400000 };
    return now + durations[type];
  }

  // Current date/time expressed in BRT (UTC-3)
  const brtNow     = new Date(now - 3 * 60 * 60 * 1000);
  const brtYear    = brtNow.getUTCFullYear();
  const brtMonth   = brtNow.getUTCMonth();
  const brtDay     = brtNow.getUTCDate();
  const brtDow     = brtNow.getUTCDay(); // 0=Sun 1=Mon … 6=Sat

  // UTC timestamp for a given BRT calendar date at 07:40 BRT
  function resetOn(y, m, d) {
    return Date.UTC(y, m, d, RESET_HOUR_UTC, RESET_MIN_UTC, 0, 0);
  }

  const todayReset = resetOn(brtYear, brtMonth, brtDay);

  if (type === 'daily') {
    if (now < todayReset) return todayReset;
    const tomorrow = new Date(brtNow);
    tomorrow.setUTCDate(brtDay + 1);
    return resetOn(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate());
  }

  if (type === 'weekly') {
    // Use today if it's Monday and before reset
    if (brtDow === 1 && now < todayReset) return todayReset;
    // Days until next Monday: Sun=1, Mon=7, Tue=6, Wed=5, Thu=4, Fri=3, Sat=2
    const daysUntil = (8 - brtDow) % 7 || 7;
    const nextMon = new Date(brtNow);
    nextMon.setUTCDate(brtDay + daysUntil);
    return resetOn(nextMon.getUTCFullYear(), nextMon.getUTCMonth(), nextMon.getUTCDate());
  }

  // monthly
  if (brtDay === 1 && now < todayReset) return todayReset;
  return Date.UTC(brtYear, brtMonth + 1, 1, RESET_HOUR_UTC, RESET_MIN_UTC, 0, 0);
}

function checkResets(tasks) {
  const now = Date.now();
  let changed = false;
  const updated = tasks.map(t => {
    if (t.nextResetAt && now >= t.nextResetAt) {
      changed = true;
      return { ...t, done: false, nextResetAt: calcNextResetAt(t.type, t.serverSave) };
    }
    return t;
  });
  return { tasks: updated, changed };
}

// ─── Handlers ────────────────────────────────────────────────────────────────
module.exports = function registerTaskHandlers() {
  ipcMain.handle('tasks:get', () => {
    let tasks = store.get('tasks');
    // Discard legacy tasks that lack the new fields
    tasks = tasks.filter(t => t.type);
    const { tasks: reset, changed } = checkResets(tasks);
    if (changed) store.set('tasks', reset);
    return reset;
  });

  ipcMain.handle('tasks:add', (_, { title, type, serverSave }) => {
    const tasks = store.get('tasks').filter(t => t.type);
    const newTask = {
      id: Date.now(),
      title,
      type,
      serverSave: !!serverSave,
      done: false,
      nextResetAt: calcNextResetAt(type, serverSave),
    };
    store.set('tasks', [...tasks, newTask]);
    return newTask;
  });

  ipcMain.handle('tasks:toggle', (_, id) => {
    const tasks = store.get('tasks').map(t => t.id === id ? { ...t, done: !t.done } : t);
    store.set('tasks', tasks);
    return tasks;
  });

  ipcMain.handle('tasks:delete', (_, id) => {
    const tasks = store.get('tasks').filter(t => t.id !== id);
    store.set('tasks', tasks);
    return tasks;
  });

  ipcMain.handle('tasks:reorder', (_, ids) => {
    const tasks = store.get('tasks');
    const reordered = ids.map(id => tasks.find(t => t.id === id)).filter(Boolean);
    store.set('tasks', reordered);
    return reordered;
  });
};
```

- [ ] **Step 2: Verify manually — open app, check console has no errors on Tasks page**

- [ ] **Step 3: Commit**

```bash
git add src/main/handlers/tasks.js
git commit -m "feat: tasks reset logic — calcNextResetAt, startup check, reorder handler"
```

---

## Task 2: Expose `reorderTasks` in preload

**Files:**
- Modify: `src/main/preload.js`

- [ ] **Step 1: Add `reorderTasks` and update `addTask` signature in preload**

Find the Tasks section and replace:
```js
// Tasks
getTasks:    () => ipcRenderer.invoke('tasks:get'),
addTask:     (title) => ipcRenderer.invoke('tasks:add', title),
toggleTask:  (id)    => ipcRenderer.invoke('tasks:toggle', id),
deleteTask:  (id)    => ipcRenderer.invoke('tasks:delete', id),
```
With:
```js
// Tasks
getTasks:     ()               => ipcRenderer.invoke('tasks:get'),
addTask:      (data)           => ipcRenderer.invoke('tasks:add', data),
toggleTask:   (id)             => ipcRenderer.invoke('tasks:toggle', id),
deleteTask:   (id)             => ipcRenderer.invoke('tasks:delete', id),
reorderTasks: (ids)            => ipcRenderer.invoke('tasks:reorder', ids),
```

- [ ] **Step 2: Commit**

```bash
git add src/main/preload.js
git commit -m "feat: expose reorderTasks in preload, update addTask to accept object"
```

---

## Task 3: Update task form in HTML

**Files:**
- Modify: `src/renderer/index.html`

- [ ] **Step 1: Replace the task form section**

Find:
```html
<div class="task-input-row">
  <input type="text" id="task-input" placeholder="Nova task..." maxlength="120" />
  <button class="btn-primary" onclick="addTask()">+ Adicionar</button>
</div>
```
Replace with:
```html
<div class="task-form">
  <div class="task-input-row">
    <input type="text" id="task-input" placeholder="Nova task..." maxlength="120" />
    <button class="btn-primary" onclick="addTask()">+ Adicionar</button>
  </div>
  <div class="task-options-row">
    <select id="task-type" class="task-type-select">
      <option value="daily">Diária</option>
      <option value="weekly">Semanal</option>
      <option value="monthly">Mensal</option>
    </select>
    <label class="task-server-save-label">
      <input type="checkbox" id="task-server-save" />
      Reseta no Server Save
    </label>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/index.html
git commit -m "feat: add type dropdown and server save checkbox to task form"
```

---

## Task 4: Rewrite renderer tasks module

**Files:**
- Modify: `src/renderer/modules/tasks.js`

- [ ] **Step 1: Rewrite `src/renderer/modules/tasks.js` in full**

```js
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
  input.value    = '';
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
```

- [ ] **Step 2: Manual test**

Run `npm start` → Tasks page → Add a task with type "Semanal" + Server Save checked → card shows `S` badge + ⏰ icon → ▲/▼ move it → ✕ deletes it.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/modules/tasks.js
git commit -m "feat: rewrite tasks renderer — badges, server save icon, reorder, delete"
```

---

## Task 5: Update task styles

**Files:**
- Modify: `src/renderer/styles/tasks.css`

- [ ] **Step 1: Rewrite `src/renderer/styles/tasks.css` in full**

```css
/* ── Task form ── */
.task-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}
.task-input-row {
  display: flex;
  gap: 10px;
}
.task-input-row input {
  flex: 1;
}
.task-options-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.task-type-select {
  padding: 6px 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  cursor: pointer;
}
.task-type-select:focus {
  outline: none;
  border-color: var(--accent);
}
.task-server-save-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
}

/* ── Task list ── */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color 0.15s;
  animation: slideIn 0.15s ease;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: none; }
}
.task-item.done {
  opacity: 0.5;
}

/* ── Reorder buttons ── */
.task-reorder {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex-shrink: 0;
}
.task-move {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 10px;
  padding: 1px 3px;
  line-height: 1;
  border-radius: 3px;
  transition: color 0.1s;
}
.task-move:hover:not(:disabled) {
  color: var(--accent);
}
.task-move:disabled {
  opacity: 0.2;
  cursor: default;
}

/* ── Checkbox ── */
.task-checkbox {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
  appearance: none;
  border: 2px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  transition: all 0.15s;
  position: relative;
}
.task-checkbox:checked {
  background: var(--accent);
  border-color: var(--accent);
}
.task-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  color: #0f0f13;
  font-weight: 700;
}

/* ── Title ── */
.task-title {
  flex: 1;
  font-size: 14px;
}
.task-item.done .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* ── Type badge ── */
.task-badge {
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
.badge-daily   { background: rgba(33, 150, 243, 0.15); color: #2196f3; border: 1px solid rgba(33, 150, 243, 0.3); }
.badge-weekly  { background: rgba(156, 39, 176, 0.15); color: #9c27b0; border: 1px solid rgba(156, 39, 176, 0.3); }
.badge-monthly { background: rgba(255, 152, 0, 0.15);  color: #ff9800; border: 1px solid rgba(255, 152, 0, 0.3); }

/* ── Server save icon ── */
.task-ss-icon {
  font-size: 13px;
  flex-shrink: 0;
  opacity: 0.7;
}

/* ── Delete ── */
.task-delete {
  background: transparent;
  border: none;
  color: var(--danger);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  transition: color 0.15s;
}
.task-delete:hover {
  color: #ff6b6b;
}
```

- [ ] **Step 2: Manual test**

Run `npm start` → Tasks → visually confirm: form has dropdown + checkbox, cards show badges with correct colors (`D`=blue, `S`=purple, `M`=orange), ⏰ appears when server save checked, ▲/▼ work, ✕ deletes.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/styles/tasks.css
git commit -m "feat: tasks styles — form options row, type badges, reorder buttons"
```
