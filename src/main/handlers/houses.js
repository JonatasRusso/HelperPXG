const { ipcMain } = require('electron');
const store = require('../store');
const { withImageUrls } = require('../imageStore');

module.exports = function registerHouseHandlers() {
  ipcMain.handle('houses:set', (_, characterId, data) => {
    if (!data || typeof data !== 'object') return withImageUrls(store.get('characters'));
    const { bidDay, value, cpSeparated } = data;
    const safeBidDay = Math.min(28, Math.max(1, Number(bidDay)));
    const updated = store.get('characters').map(c =>
      c.id === characterId
        ? { ...c, house: { bidDay: safeBidDay, value: Number(value), cpSeparated: !!cpSeparated } }
        : c
    );
    store.set('characters', updated);
    return withImageUrls(updated);
  });

  ipcMain.handle('houses:delete', (_, characterId) => {
    const updated = store.get('characters').map(c =>
      c.id === characterId ? { ...c, house: null } : c
    );
    store.set('characters', updated);
    return withImageUrls(updated);
  });

  // Silent no-op if character has no house.
  ipcMain.handle('houses:toggleCp', (_, characterId) => {
    const updated = store.get('characters').map(c => {
      if (c.id !== characterId || !c.house) return c;
      return { ...c, house: { ...c.house, cpSeparated: !c.house.cpSeparated } };
    });
    store.set('characters', updated);
    return withImageUrls(updated);
  });
};
