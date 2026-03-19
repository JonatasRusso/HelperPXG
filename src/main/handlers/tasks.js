const { ipcMain, dialog } = require('electron');
const fs   = require('fs');
const path = require('path');
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
  const brtNow  = new Date(now - 3 * 60 * 60 * 1000);
  const brtYear = brtNow.getUTCFullYear();
  const brtMonth= brtNow.getUTCMonth();
  const brtDay  = brtNow.getUTCDate();
  const brtDow  = brtNow.getUTCDay(); // 0=Sun 1=Mon … 6=Sat

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
    if (brtDow === 1 && now < todayReset) return todayReset;
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
  const resetIds = new Set();
  const resetTasks = [];
  const updated = tasks.map(t => {
    if (t.nextResetAt && now >= t.nextResetAt) {
      changed = true;
      resetIds.add(t.id);
      resetTasks.push(t);
      return { ...t, done: false, nextResetAt: calcNextResetAt(t.type, t.serverSave) };
    }
    return t;
  });
  return { tasks: updated, changed, resetIds, resetTasks };
}

// ─── Handlers ────────────────────────────────────────────────────────────────
function registerTaskHandlers() {
  ipcMain.handle('tasks:get', () => {
    let tasks = store.get('tasks');
    tasks = tasks.filter(t => t.type);
    const { tasks: reset, changed, resetIds, resetTasks } = checkResets(tasks);
    if (changed) {
      store.set('tasks', reset);
      const blueResetIds = new Set(
        resetTasks.filter(t => t.energyType === 'blue').map(t => String(t.id))
      );
      const chars = store.get('characters');
      const updatedChars = chars.map(c => {
        const newState     = { ...c.taskState };
        const newRunCounts = { ...(c.runCounts || {}) };
        resetIds.forEach(id => { if (c.taskIds.includes(id)) newState[String(id)] = false; });
        blueResetIds.forEach(id => { delete newRunCounts[id]; });
        return { ...c, taskState: newState, runCounts: newRunCounts };
      });
      store.set('characters', updatedChars);
    }
    return reset;
  });

  ipcMain.handle('tasks:add', (_, { title, type, serverSave, energyType, tiers, slug }) => {
    const tasks = store.get('tasks').filter(t => t.type);
    const newTask = {
      id: Date.now(),
      title,
      type,
      serverSave: !!serverSave,
      energyType: energyType || null,
      tiers: Array.isArray(tiers) ? tiers : [],
      slug: slug || null,
      disabled: false,
      done: false,
      nextResetAt: calcNextResetAt(type, serverSave),
      image: null,
    };
    store.set('tasks', [...tasks, newTask]);
    // Auto-assign non-energy tasks to all characters
    if (!newTask.energyType) {
      const chars = store.get('characters');
      store.set('characters', chars.map(c => ({
        ...c,
        taskIds:   [...(c.taskIds || []), newTask.id],
        taskState: { ...(c.taskState || {}), [String(newTask.id)]: false },
      })));
    }
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
    // Remove deleted task from all characters
    const chars = store.get('characters');
    const updatedChars = chars.map(c => {
      const newState     = { ...c.taskState };
      const newRunCounts = { ...(c.runCounts || {}) };
      const newPreferred = { ...(c.preferredTiers || {}) };
      delete newState[String(id)];
      delete newRunCounts[String(id)];
      delete newPreferred[String(id)];
      return {
        ...c,
        taskIds: c.taskIds.filter(tid => tid !== id),
        taskState: newState,
        runCounts: newRunCounts,
        preferredTiers: newPreferred,
      };
    });
    store.set('characters', updatedChars);
    return tasks;
  });

  ipcMain.handle('tasks:reorder', (_, ids) => {
    const tasks = store.get('tasks');
    const reordered = ids.map(id => tasks.find(t => t.id === id)).filter(Boolean);
    store.set('tasks', reordered);
    return reordered;
  });

  ipcMain.handle('tasks:setImage', async (_, id) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
    });
    if (canceled || !filePaths.length) return null;
    const ext     = path.extname(filePaths[0]).slice(1).toLowerCase();
    const mime    = ext === 'jpg' ? 'jpeg' : ext;
    const dataUrl = `data:image/${mime};base64,${fs.readFileSync(filePaths[0]).toString('base64')}`;
    const tasks   = store.get('tasks');
    const updated = tasks.map(t => t.id === id ? { ...t, image: dataUrl } : t);
    store.set('tasks', updated);
    return updated.filter(t => t.type);
  });

  ipcMain.handle('tasks:setDisabled', (_, id, disabled) => {
    const tasks = store.get('tasks').map(t => t.id === id ? { ...t, disabled } : t);
    store.set('tasks', tasks);
    return tasks.filter(t => t.type);
  });

}

registerTaskHandlers.calcNextResetAt = calcNextResetAt;
module.exports = registerTaskHandlers;
