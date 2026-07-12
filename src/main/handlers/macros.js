const { ipcMain, globalShortcut } = require('electron');
const store = require('../store');
const { executeMacro, stopMacro, isRunning } = require('../macroRunner');

// Map our key names to Electron accelerator format
const ACCEL_MAP = {
  'Enter': 'Return', 'Space': 'Space', 'Escape': 'Escape',
  'Up': 'Up', 'Down': 'Down', 'Left': 'Left', 'Right': 'Right',
  'Backspace': 'Backspace', 'Delete': 'Delete', 'Tab': 'Tab',
  'Home': 'Home', 'End': 'End', 'PageUp': 'PageUp', 'PageDown': 'PageDown',
};

function toAccelerator(key) {
  return ACCEL_MAP[key] || key;
}

let win = null;

function notify(id, state) {
  win?.webContents.send('macros:stateChanged', { id, state });
}

function refreshHotkeys() {
  globalShortcut.unregisterAll();
  for (const macro of store.get('macros')) {
    if (!macro.enabled || !macro.hotkey) continue;
    try {
      globalShortcut.register(toAccelerator(macro.hotkey), () => {
        const m = store.get('macros').find(m => m.id === macro.id);
        if (!m?.enabled) return;
        if (isRunning(m.id)) stopMacro(m.id);
        else executeMacro(m, notify);
      });
    } catch (e) {
      console.error('[macro] hotkey register failed:', macro.hotkey, e.message);
    }
  }
}

module.exports = function registerMacroHandlers(mainWindow) {
  win = mainWindow;

  ipcMain.handle('macros:get', () => store.get('macros'));

  ipcMain.handle('macros:add', (_, macro) => {
    const updated = [...store.get('macros'), { ...macro, id: Date.now(), enabled: true }];
    store.set('macros', updated);
    refreshHotkeys();
    return updated;
  });

  ipcMain.handle('macros:update', (_, macro) => {
    const updated = store.get('macros').map(m => m.id === macro.id ? { ...m, ...macro } : m);
    store.set('macros', updated);
    refreshHotkeys();
    return updated;
  });

  ipcMain.handle('macros:delete', (_, id) => {
    stopMacro(id);
    const updated = store.get('macros').filter(m => m.id !== id);
    store.set('macros', updated);
    refreshHotkeys();
    return updated;
  });

  ipcMain.handle('macros:toggle', (_, id) => {
    const updated = store.get('macros').map(m =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    );
    store.set('macros', updated);
    if (!updated.find(m => m.id === id)?.enabled) stopMacro(id);
    refreshHotkeys();
    return updated;
  });

  ipcMain.handle('macros:run', (_, id) => {
    const macro = store.get('macros').find(m => m.id === id);
    if (!macro) return;
    if (isRunning(id)) stopMacro(id);
    else executeMacro(macro, notify);
  });

  refreshHotkeys();
};
