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
