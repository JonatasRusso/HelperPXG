const { ipcMain } = require('electron');
const store = require('../store');

module.exports = function registerHouseHandlers() {

  // Sets or updates the house on a character.
  // bidDay is clamped to 1-28 server-side to keep houseRemaining arithmetic safe.
  ipcMain.handle('houses:set', (_, characterId, { bidDay, value, cpSeparated }) => {
    const safeBidDay = Math.min(28, Math.max(1, Number(bidDay)));
    const updated = store.get('characters').map(c =>
      c.id === characterId
        ? { ...c, house: { bidDay: safeBidDay, value: Number(value), cpSeparated: !!cpSeparated } }
        : c
    );
    store.set('characters', updated);
    return updated;
  });

  // Removes the house from a character (sets house: null).
  ipcMain.handle('houses:delete', (_, characterId) => {
    const updated = store.get('characters').map(c =>
      c.id === characterId ? { ...c, house: null } : c
    );
    store.set('characters', updated);
    return updated;
  });

  // Flips the cpSeparated flag on a character's house.
  // Silent no-op if characterId not found or character has no house.
  ipcMain.handle('houses:toggleCp', (_, characterId) => {
    const updated = store.get('characters').map(c => {
      if (c.id !== characterId || !c.house) return c;
      return { ...c, house: { ...c.house, cpSeparated: !c.house.cpSeparated } };
    });
    store.set('characters', updated);
    return updated;
  });

};
