const { ipcMain, dialog } = require('electron');
const fs   = require('fs');
const path = require('path');
const store = require('../store');

module.exports = function registerCharacterHandlers() {
  // Returns all characters including images
  ipcMain.handle('characters:get', () => store.get('characters'));

  // Adds a new character linked to an account
  ipcMain.handle('characters:add', (_, { accountId, name, server, clan, level, bg, image }) => {
    const chars = store.get('characters');
    const updated = [...chars, {
      id:        Date.now(),
      accountId,
      name,
      server,
      clan:      clan  || '',
      level:     level || '300-',
      bg:        bg    || 'personagem-bg-01.png',
      image:     image || null,
      taskIds:   [],
      taskState: {},
      house:          null,
      favorite:       false,
      blueEnergy:     null,
      redEnergy:      null,
      runCounts:      {},
      preferredTiers: {},
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

  // Opens file dialog and returns base64 data URI without saving
  ipcMain.handle('characters:pickImageData', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
    });
    if (canceled || !filePaths.length) return null;
    const ext  = path.extname(filePaths[0]).slice(1).toLowerCase();
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return `data:image/${mime};base64,${fs.readFileSync(filePaths[0]).toString('base64')}`;
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
      if (!c.taskIds.includes(Number(taskId))) return c;
      return { ...c, taskState: { ...c.taskState, [key]: !c.taskState[key] } };
    });
    store.set('characters', updated);
    return updated;
  });

  // Updates character info (level, clan, bg, image, name, taskIds)
  ipcMain.handle('characters:setInfo', (_, { id, level, clan, bg, image, name, taskIds, blueEnergy, redEnergy, favorite, preferredTiers }) => {
    console.log('[setInfo] taskIds received:', JSON.stringify(taskIds));
    const updated = store.get('characters').map(c => {
      if (c.id !== id) return c;
      console.log('[setInfo] c.taskIds before patch:', JSON.stringify(c.taskIds));
      const patch = {
        level: level || '300-',
        clan:  clan  || '',
        bg:    bg    || c.bg || 'personagem-bg-01.png',
        image: image || null,
      };
      if (name && name.trim()) patch.name = name.trim();
      if (Array.isArray(taskIds)) {
        const newIds   = taskIds.map(Number);
        const newState = {};
        newIds.forEach(tid => { newState[String(tid)] = c.taskState[String(tid)] || false; });
        patch.taskIds   = newIds;
        patch.taskState = newState;
      }
      if (typeof favorite === 'boolean') patch.favorite = favorite;
      if (blueEnergy !== undefined) patch.blueEnergy = blueEnergy ? { ...blueEnergy, lastUpdated: Date.now() } : null;
      if (redEnergy  !== undefined) patch.redEnergy  = redEnergy  ? { ...redEnergy,  lastUpdated: Date.now() } : null;
      if (preferredTiers !== undefined) patch.preferredTiers = preferredTiers;
      console.log('[setInfo] patch.taskIds after:', JSON.stringify(patch.taskIds));
      return { ...c, ...patch };
    });
    store.set('characters', updated);
    return updated;
  });
};
