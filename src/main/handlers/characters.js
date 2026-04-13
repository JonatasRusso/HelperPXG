const { ipcMain, dialog } = require('electron');
const store = require('../store');
const { saveImage, deleteImage, toUrl, normalizeForStorage, withImageUrls } = require('../imageStore');

module.exports = function registerCharacterHandlers() {
  ipcMain.handle('characters:get', () => withImageUrls(store.get('characters')));

  ipcMain.handle('characters:add', (_, { accountId, name, server, clan, level, bg, image }) => {
    const chars     = store.get('characters');
    const manualTasks = store.get('tasks').filter(t => t.type && !t.energyType && !t.slug);
    const initTaskIds   = manualTasks.map(t => t.id);
    const initTaskState = Object.fromEntries(manualTasks.map(t => [String(t.id), false]));
    const updated = [...chars, {
      id:             Date.now(),
      accountId,
      name,
      server,
      clan:           clan  || '',
      level:          level || '300-',
      bg:             bg    || 'personagem-bg-01.png',
      image:          normalizeForStorage(image) || null,
      taskIds:        initTaskIds,
      taskState:      initTaskState,
      house:          null,
      favorite:       false,
      blueEnergy:     null,
      redEnergy:      null,
      runCounts:      {},
      preferredTiers: {},
      hiddenMDs:      {},
      mdOrder:        { blue: [], red: [] },
      nwLevel:        null,
    }];
    store.set('characters', updated);
    return withImageUrls(updated);
  });

  ipcMain.handle('characters:delete', (_, id) => {
    const chars = store.get('characters');
    const c     = chars.find(ch => ch.id === id);
    if (c?.image) deleteImage(c.image);
    const updated = chars.filter(c => c.id !== id);
    store.set('characters', updated);
    return withImageUrls(updated);
  });

  ipcMain.handle('characters:pickImageData', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
    });
    if (canceled || !filePaths.length) return null;
    const filename = saveImage(filePaths[0], 'characters');
    return { filename, url: toUrl(filename) };
  });

  ipcMain.handle('characters:setTasks', (_, { id, taskIds }) => {
    const chars   = store.get('characters');
    const updated = chars.map(c => {
      if (c.id !== id) return c;
      const newIds   = taskIds.map(Number);
      const newState = {};
      newIds.forEach(tid => { newState[String(tid)] = c.taskState[String(tid)] || false; });
      return { ...c, taskIds: newIds, taskState: newState };
    });
    store.set('characters', updated);
    return withImageUrls(updated);
  });

  ipcMain.handle('characters:toggleTask', (_, { id, taskId }) => {
    const chars   = store.get('characters');
    const updated = chars.map(c => {
      if (c.id !== id) return c;
      const key = String(taskId);
      return { ...c, taskState: { ...c.taskState, [key]: !c.taskState[key] } };
    });
    store.set('characters', updated);
    return withImageUrls(updated);
  });

  ipcMain.handle('characters:setInfo', (_, {
    id, level, clan, bg, image, name, server, taskIds,
    blueEnergy, redEnergy, favorite, preferredTiers, hiddenMDs, mdOrder, nwLevel,
    clanColorPrimary, clanColorSecondary,
  }) => {
    const updated = store.get('characters').map(c => {
      if (c.id !== id) return c;
      const patch = {};
      if (level !== undefined) patch.level = level || '300-';
      if (clan  !== undefined) patch.clan  = clan  || '';
      if (bg    !== undefined) patch.bg    = bg    || c.bg || 'personagem-bg-01.png';
      if (image !== undefined) patch.image = normalizeForStorage(image) || null;
      if (name   && name.trim())   patch.name   = name.trim();
      if (server && server.trim()) patch.server = server.trim();
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
      if (hiddenMDs      !== undefined) patch.hiddenMDs      = hiddenMDs;
      if (mdOrder        !== undefined) patch.mdOrder        = mdOrder;
      if (nwLevel             !== undefined) patch.nwLevel             = nwLevel;
      if (clanColorPrimary   !== undefined) patch.clanColorPrimary   = clanColorPrimary   || null;
      if (clanColorSecondary !== undefined) patch.clanColorSecondary = clanColorSecondary || null;
      return { ...c, ...patch };
    });
    store.set('characters', updated);
    return withImageUrls(updated);
  });
};
