# Characters Feature Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Personagens tab where each account's characters are shown as 175×175 hover-interactive cards, each tracking per-character task completion state independently.

**Architecture:** New IPC handler module (`characters.js`) manages all character CRUD; the renderer module (`characters.js`) owns card rendering with CSS hover overlays; cascade operations (task resets, account/task deletes) are added inline to the existing `tasks.js` and `accounts.js` handlers.

**Tech Stack:** Electron IPC (ipcMain.handle / ipcRenderer.invoke), electron-store, vanilla JS/HTML/CSS, no test framework (verify manually via `npm start`)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/main/handlers/characters.js` | All character IPC handlers |
| Create | `src/renderer/modules/characters.js` | Characters page render + interactions |
| Create | `src/renderer/styles/characters.css` | Card, badge, hover overlay, edit panel styles |
| Modify | `src/main/store.js` | Add `characters: []` default |
| Modify | `src/main/index.js` | Register character handlers |
| Modify | `src/main/preload.js` | Expose character API to renderer |
| Modify | `src/main/handlers/tasks.js` | `checkResets` returns `resetIds`; `tasks:get` cascades to characters; `tasks:delete` prunes character taskIds/taskState |
| Modify | `src/main/handlers/accounts.js` | `accounts:delete` cascade-deletes characters |
| Modify | `src/renderer/index.html` | Add nav button, page section, CSS + JS links |
| Modify | `src/renderer/modules/accounts.js` | Replace "+ Adicionar personagem" alert with inline form |
| Modify | `package.json` | Version → 0.0.71 |
| Modify | `CLAUDE.md` | Version → 0.0.71 |

---

### Task 1: Store default + main registration + preload

**Files:**
- Modify: `src/main/store.js`
- Modify: `src/main/index.js`
- Modify: `src/main/preload.js`

- [ ] **Step 1: Add `characters: []` default to store**

In `src/main/store.js`, update the `defaults` object:

```js
const store = new Store({
  defaults: {
    tasks: [],
    gamePath: '',
    accounts: [],
    loginDelay: 3000,
    characters: [],
  }
});
```

- [ ] **Step 2: Register character handlers in index.js**

In `src/main/index.js`, add the require and call:

```js
const registerCharacterHandlers = require('./handlers/characters');
```

And inside `app.whenReady().then(...)`, add:

```js
registerCharacterHandlers();
```

Add the require at the top of the file alongside the other handler requires, then add `registerCharacterHandlers()` in `app.whenReady`. The full requires block and `whenReady` call (only these two areas change — `createWindow()` is unchanged and already calls `registerWindowHandlers(mainWindow)` and `registerLauncherHandlers(mainWindow)` internally):

```js
// requires — add this line alongside the existing ones:
const registerCharacterHandlers = require('./handlers/characters');

// app.whenReady block — add registerCharacterHandlers() here:
app.whenReady().then(() => {
  registerTaskHandlers();
  registerAccountHandlers();
  registerCharacterHandlers();   // ← add this line
  registerAutologinHandlers();
  registerConfigHandlers();
  createWindow();  // createWindow() handles registerWindowHandlers + registerLauncherHandlers internally
});
```

> **Note:** Do NOT remove `registerWindowHandlers` or `registerLauncherHandlers` — they are called inside `createWindow()`, not in `whenReady` directly. Only add `registerCharacterHandlers()` to the `whenReady` block.

- [ ] **Step 3: Expose character API in preload.js**

Append a `// Characters` section to the `contextBridge.exposeInMainWorld('api', { ... })` object in `src/main/preload.js`:

```js
  // Characters
  getCharacters:       ()      => ipcRenderer.invoke('characters:get'),
  addCharacter:        (data)  => ipcRenderer.invoke('characters:add', data),
  deleteCharacter:     (id)    => ipcRenderer.invoke('characters:delete', id),
  setCharacterImage:   (id)    => ipcRenderer.invoke('characters:setImage', id),
  setCharacterTasks:   (data)  => ipcRenderer.invoke('characters:setTasks', data),
  toggleCharacterTask: (data)  => ipcRenderer.invoke('characters:toggleTask', data),
  setCharacterInfo:    (data)  => ipcRenderer.invoke('characters:setInfo', data),
```

> **Spec note:** The spec lists `characters:setLevel` as a separate channel. This plan consolidates it into `characters:setInfo({ id, level, clan })` because the `clan` field was added to the data model after the spec's handler table was written. `setInfo` covers level + clan in a single round-trip. There is no `setCharacterLevel` — use `setCharacterInfo`.

- [ ] **Step 4: Commit**

```bash
git add src/main/store.js src/main/index.js src/main/preload.js
git commit -m "feat: scaffold characters — store default, registration, preload API"
```

---

### Task 2: characters.js IPC handler (main process)

**Files:**
- Create: `src/main/handlers/characters.js`

- [ ] **Step 1: Create the file with all handlers**

Create `src/main/handlers/characters.js` with the following complete content:

```js
const { ipcMain, dialog } = require('electron');
const fs   = require('fs');
const path = require('path');
const store = require('../store');

module.exports = function registerCharacterHandlers() {
  // Returns all characters including images
  ipcMain.handle('characters:get', () => store.get('characters'));

  // Adds a new character linked to an account
  ipcMain.handle('characters:add', (_, { accountId, name, server, clan, level }) => {
    const chars = store.get('characters');
    const updated = [...chars, {
      id:        Date.now(),
      accountId,
      name,
      server,
      clan:      clan || '',
      level:     Number(level) || 1,
      taskIds:   [],
      taskState: {},
    }];
    store.set('characters', updated);
    return updated;
  });

  // Deletes a character by id
  ipcMain.handle('characters:delete', (_, id) => {
    const updated = store.get('characters').filter(c => c.id !== id);
    store.set('characters', updated);
    return updated;
  });

  // Opens file dialog and saves base64 image to character
  ipcMain.handle('characters:setImage', async (_, id) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
    });
    if (canceled || !filePaths.length) return null;
    const ext    = path.extname(filePaths[0]).slice(1).toLowerCase();
    const mime   = ext === 'jpg' ? 'jpeg' : ext;
    const dataUrl = `data:image/${mime};base64,${fs.readFileSync(filePaths[0]).toString('base64')}`;
    const chars  = store.get('characters');
    const updated = chars.map(c => c.id === id ? { ...c, image: dataUrl } : c);
    store.set('characters', updated);
    return updated;
  });

  // Replaces the full taskIds list; prunes removed ids from taskState
  ipcMain.handle('characters:setTasks', (_, { id, taskIds }) => {
    const chars = store.get('characters');
    const updated = chars.map(c => {
      if (c.id !== id) return c;
      const newIds  = taskIds.map(Number);
      const newState = {};
      newIds.forEach(tid => { newState[String(tid)] = c.taskState[String(tid)] || false; });
      return { ...c, taskIds: newIds, taskState: newState };
    });
    store.set('characters', updated);
    return updated;
  });

  // Flips the done/undone state for one task on one character
  ipcMain.handle('characters:toggleTask', (_, { id, taskId }) => {
    const chars = store.get('characters');
    const updated = chars.map(c => {
      if (c.id !== id) return c;
      const key = String(taskId);
      return { ...c, taskState: { ...c.taskState, [key]: !c.taskState[key] } };
    });
    store.set('characters', updated);
    return updated;
  });

  // Updates level and clan together (edit panel "Salvar").
  // Note: spec lists characters:setLevel but clan was added after the spec was written;
  // setInfo consolidates both into one handler.
  ipcMain.handle('characters:setInfo', (_, { id, level, clan }) => {
    const updated = store.get('characters').map(c =>
      c.id === id ? { ...c, level: Number(level), clan: clan || '' } : c
    );
    store.set('characters', updated);
    return updated;
  });
};
```

- [ ] **Step 2: Start app and verify no crash on startup**

```bash
npm start
```

Expected: app opens without errors, no console exceptions from character handler registration.

- [ ] **Step 3: Commit**

```bash
git add src/main/handlers/characters.js
git commit -m "feat: add characters IPC handler (get/add/delete/setImage/setTasks/toggleTask/setInfo)"
```

---

### Task 3: Cascade operations in tasks.js and accounts.js

**Files:**
- Modify: `src/main/handlers/tasks.js`
- Modify: `src/main/handlers/accounts.js`

- [ ] **Step 1: Update `checkResets` to return `resetIds`**

In `src/main/handlers/tasks.js`, replace the `checkResets` function:

```js
function checkResets(tasks) {
  const now = Date.now();
  let changed = false;
  const resetIds = new Set();
  const updated = tasks.map(t => {
    if (t.nextResetAt && now >= t.nextResetAt) {
      changed = true;
      resetIds.add(t.id);
      return { ...t, done: false, nextResetAt: calcNextResetAt(t.type, t.serverSave) };
    }
    return t;
  });
  return { tasks: updated, changed, resetIds };
}
```

- [ ] **Step 2: Update `tasks:get` to cascade reset to character taskState**

Replace the `tasks:get` handler:

```js
ipcMain.handle('tasks:get', () => {
  let tasks = store.get('tasks');
  tasks = tasks.filter(t => t.type);
  const { tasks: reset, changed, resetIds } = checkResets(tasks);
  if (changed) {
    store.set('tasks', reset);
    if (resetIds.size > 0) {
      const chars = store.get('characters');
      const updatedChars = chars.map(c => {
        const newState = { ...c.taskState };
        resetIds.forEach(id => {
          if (c.taskIds.includes(id)) newState[String(id)] = false;
        });
        return { ...c, taskState: newState };
      });
      store.set('characters', updatedChars);
    }
  }
  return reset;
});
```

- [ ] **Step 3: Update `tasks:delete` to prune characters**

Replace the `tasks:delete` handler:

```js
ipcMain.handle('tasks:delete', (_, id) => {
  const tasks = store.get('tasks').filter(t => t.id !== id);
  store.set('tasks', tasks);
  // Remove deleted task from all characters
  const chars = store.get('characters');
  const updatedChars = chars.map(c => {
    const newState = { ...c.taskState };
    delete newState[String(id)];
    return { ...c, taskIds: c.taskIds.filter(tid => tid !== id), taskState: newState };
  });
  store.set('characters', updatedChars);
  return tasks;
});
```

- [ ] **Step 4: Update `accounts:delete` to cascade-delete characters**

In `src/main/handlers/accounts.js`, replace the `accounts:delete` handler:

```js
ipcMain.handle('accounts:delete', (_, id) => {
  const updated = store.get('accounts').filter(a => a.id !== id);
  store.set('accounts', updated);
  // Remove all characters linked to this account
  const chars = store.get('characters').filter(c => c.accountId !== id);
  store.set('characters', chars);
  return publicAccounts(updated);
});
```

- [ ] **Step 5: Start app and verify no crash**

```bash
npm start
```

Expected: app opens, existing tasks and accounts load normally.

- [ ] **Step 6: Commit**

```bash
git add src/main/handlers/tasks.js src/main/handlers/accounts.js
git commit -m "feat: cascade character taskState reset on task reset; prune on task/account delete"
```

---

### Task 4: characters.css

**Files:**
- Create: `src/renderer/styles/characters.css`

- [ ] **Step 1: Create the stylesheet**

Create `src/renderer/styles/characters.css` with the full content:

```css
/* ── Card grid ── */
.char-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* ── Card ── */
.char-card {
  width: 175px;
  height: 175px;
  position: relative;
  border-radius: var(--radius);
  background-color: #1a1a23;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  border: 1px solid var(--border);
  transition: border-color 0.15s;
}
.char-card:hover {
  border-color: var(--accent);
}

/* ── Avatar placeholder (no image) ── */
.char-avatar-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -60%);
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: #aaa;
  font-family: 'Rajdhani', sans-serif;
}

/* ── Info overlay (always visible, at bottom) ── */
.char-card-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 10px;
  background: linear-gradient(transparent, rgba(0,0,0,0.88));
}
.char-name {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.char-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 2px;
}
.char-level-badge {
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 10px;
  border: 1px solid;
  line-height: 1.4;
  flex-shrink: 0;
}
.char-clan,
.char-server {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70px;
}

/* ── Hover overlay (hidden by default) ── */
.char-card-hover {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
.char-card:hover .char-card-hover {
  opacity: 1;
  pointer-events: auto;
}

/* ── Task + edit row inside hover ── */
.char-task-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  align-items: center;
  justify-content: center;
  /* keep above the info bar (~44px) */
  margin-bottom: 44px;
}

/* ── Task thumbnail button ── */
.char-task-thumb {
  width: 32px;
  height: 32px;
  position: relative;
  border-radius: 4px;
  border: 2px solid #888;
  background: rgba(0,0,0,0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;
  flex-shrink: 0;
  transition: border-color 0.15s;
}
.char-task-thumb.done {
  border-color: #4caf50;
}
.char-task-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.char-task-thumb-letter {
  font-size: 11px;
  font-weight: 700;
  color: #ccc;
  font-family: 'Rajdhani', sans-serif;
}
.char-task-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(76,175,80,0.65);
  font-size: 13px;
  color: #fff;
  font-weight: 700;
}

/* ── Edit (pencil) button ── */
.char-edit-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 2px solid rgba(255,255,255,0.35);
  background: rgba(0,0,0,0.5);
  cursor: pointer;
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s;
}
.char-edit-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* ── Edit panel (below the grid) ── */
.char-edit-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin-top: 16px;
  animation: slideIn 0.15s ease;
}
.char-edit-header {
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--text-muted);
}
.char-edit-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}
.char-edit-row input[type="number"],
.char-edit-row input[type="text"] {
  width: 120px;
}
.char-tasklist {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 16px;
}
.char-task-check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
  padding: 3px 0;
  user-select: none;
}
.char-task-checklist-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 3px;
  flex-shrink: 0;
}

/* ── Add character form (Config accordion) ── */
.panel-char-form {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
.panel-char-form input {
  width: 100%;
}
.panel-char-btns {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/styles/characters.css
git commit -m "feat: add characters.css — card grid, hover overlay, edit panel, config form"
```

---

### Task 5: characters.js renderer module

**Files:**
- Create: `src/renderer/modules/characters.js`

- [ ] **Step 1: Create the renderer module**

Create `src/renderer/modules/characters.js` with the full content:

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/modules/characters.js
git commit -m "feat: add characters renderer module (card grid, hover tasks, edit panel)"
```

---

### Task 6: index.html — nav button, page section, CSS + JS links

**Files:**
- Modify: `src/renderer/index.html`

- [ ] **Step 1: Add CSS link for characters.css**

After the `accounts.css` link (line 14), add:

```html
  <link rel="stylesheet" href="styles/characters.css" />
```

- [ ] **Step 2: Add Personagens nav button**

In the sidebar's `.nav-items` div, insert a new button between Login and Tasks:

```html
        <button class="nav-btn" data-page="personagens"
          onclick="navigate('personagens'); loadCharacters()">
          <span class="nav-icon">🧙</span>
          <span>Personagens</span>
        </button>
```

The nav-items block should read (in order): Login → Personagens → Tasks → Config.

- [ ] **Step 3: Add page-personagens section**

After the `<!-- TASKS PAGE -->` section (before `<!-- CONFIG PAGE -->`), insert:

```html
      <!-- PERSONAGENS PAGE -->
      <section id="page-personagens" class="page">
        <div class="page-header">
          <h1>Personagens</h1>
        </div>
        <div id="char-grid" class="char-grid"></div>
        <div id="char-edit-area"></div>
      </section>
```

- [ ] **Step 4: Add characters.js script**

After `<script src="modules/accounts.js"></script>`, add:

```html
  <script src="modules/characters.js"></script>
```

- [ ] **Step 5: Start app and verify**

```bash
npm start
```

Expected:
- Sidebar shows 🧙 Personagens between Login and Tasks
- Clicking Personagens navigates to the page and shows the empty state: "Nenhum personagem cadastrado. Adicione em Config."
- No console errors

- [ ] **Step 6: Commit**

```bash
git add src/renderer/index.html
git commit -m "feat: add Personagens nav, page section, CSS/JS wiring in index.html"
```

---

### Task 7: accounts.js — inline add-character form

**Files:**
- Modify: `src/renderer/modules/accounts.js`

- [ ] **Step 1: Replace the "+ Adicionar personagem" button with a form in `renderAccountsConfig`**

In `src/renderer/modules/accounts.js`, inside `renderAccountsConfig`, replace:

```js
          <button class="btn-secondary" onclick="alert('Em breve')">+ Adicionar personagem</button>
```

With:

```js
          <button class="btn-secondary" onclick="showCharForm(${a.id})">+ Adicionar personagem</button>
          <div class="panel-char-form" id="char-form-${a.id}" style="display:none">
            <input type="text"   id="char-name-${a.id}"   placeholder="Nome"          maxlength="60" />
            <input type="text"   id="char-server-${a.id}" placeholder="Servidor"      maxlength="60" />
            <input type="text"   id="char-clan-${a.id}"   placeholder="Clã (opcional)" maxlength="60" />
            <input type="number" id="char-level-${a.id}"  placeholder="Level" min="1" max="9999" />
            <div class="panel-char-btns">
              <button class="btn-primary"   onclick="addCharacter(${a.id})">Salvar</button>
              <button class="btn-secondary" onclick="hideCharForm(${a.id})">Cancelar</button>
            </div>
          </div>
```

- [ ] **Step 2: Update `deleteAccount` to refresh characters module state**

In `src/renderer/modules/accounts.js`, replace the existing `deleteAccount` function:

```js
async function deleteAccount(id) {
  accounts = await window.api.deleteAccount(id);
  renderAccountsLogin();
  renderAccountsConfig();
  // Refresh characters page state if the module is loaded
  // (loadCharacters is defined in characters.js, loaded after accounts.js)
  if (typeof loadCharacters === 'function') loadCharacters();
}
```

This prevents the Personagens page from showing stale characters after an account is deleted from Config.

- [ ] **Step 3: Add form helper functions at the bottom of accounts.js**

Append after the `saveVip` function:

```js
// ── Add character (inline form in Config accordion) ──
function showCharForm(accountId) {
  document.getElementById(`char-form-${accountId}`).style.display = 'block';
}

function hideCharForm(accountId) {
  document.getElementById(`char-form-${accountId}`).style.display = 'none';
  document.getElementById(`char-name-${accountId}`).value   = '';
  document.getElementById(`char-server-${accountId}`).value = '';
  document.getElementById(`char-clan-${accountId}`).value   = '';
  document.getElementById(`char-level-${accountId}`).value  = '';
}

async function addCharacter(accountId) {
  const name   = document.getElementById(`char-name-${accountId}`).value.trim();
  const server = document.getElementById(`char-server-${accountId}`).value.trim();
  const clan   = document.getElementById(`char-clan-${accountId}`).value.trim();
  const level  = parseInt(document.getElementById(`char-level-${accountId}`).value, 10) || 1;
  if (!name || !server) return;
  await window.api.addCharacter({ accountId, name, server, clan, level });
  hideCharForm(accountId);
  // Keep characters module in sync if it has been loaded
  if (typeof loadCharacters === 'function') loadCharacters();
}
```

- [ ] **Step 4: Start app and verify end-to-end**

```bash
npm start
```

Expected workflow:
1. Go to Config → open accordion for an account
2. Click "+ Adicionar personagem" → inline form appears
3. Fill in Nome + Servidor (Clã and Level optional) → click Salvar
4. Form hides and clears
5. Go to Personagens tab → character card appears with name, level badge, server
6. Hover over card → task row and ✏ button appear
7. Click ✏ → edit panel opens below; can change level/clan + assign tasks
8. Click card background → file picker opens to set image
9. Task thumbnails on hover show done/undone state; clicking toggles
10. Go to Config, delete an account → navigate to Personagens → characters for that account are gone

- [ ] **Step 5: Commit**

```bash
git add src/renderer/modules/accounts.js
git commit -m "feat: replace add-character alert with inline form; sync characters on account delete"
```

---

### Task 8: Version bump to 0.0.71

**Files:**
- Modify: `package.json`
- Modify: `CLAUDE.md`
- Modify: `src/renderer/index.html` (sidebar footer label)

- [ ] **Step 1: Update package.json**

Change `"version"` field to `"0.0.71"`.

- [ ] **Step 2: Update CLAUDE.md**

Change `## Versão atual: 0.0.7` to `## Versão atual: 0.0.71`.

- [ ] **Step 3: Update sidebar version label in index.html**

Change:

```html
      <div class="sidebar-footer">v0.0.7</div>
```

to:

```html
      <div class="sidebar-footer">v0.0.71</div>
```

- [ ] **Step 4: Final check**

```bash
npm start
```

Expected: sidebar footer shows `v0.0.71`.

- [ ] **Step 5: Commit**

```bash
git add package.json CLAUDE.md src/renderer/index.html
git commit -m "chore: bump version to 0.0.71"
```

---

## Done

All 8 tasks complete. The characters feature is fully implemented:
- Store persists characters with taskState per character
- Cascade deletes/resets wired in tasks and accounts handlers
- 175×175 cards with hover overlay (tasks + edit)
- Inline add-character form in Config accordion
- Version 0.0.71
