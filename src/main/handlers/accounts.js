const { ipcMain, safeStorage } = require('electron');
const store = require('../store');

function publicAccounts(accounts) {
  return accounts.map(({ id, name, username }) => ({ id, name, username }));
}

module.exports = function registerAccountHandlers() {
  ipcMain.handle('accounts:get', () => publicAccounts(store.get('accounts')));

  ipcMain.handle('accounts:add', (_, { name, username, password }) => {
    let encryptedPass = password;
    if (safeStorage.isEncryptionAvailable()) {
      encryptedPass = safeStorage.encryptString(password).toString('base64');
    }
    const accounts = store.get('accounts');
    const updated = [...accounts, { id: Date.now(), name, username, password: encryptedPass }];
    store.set('accounts', updated);
    return publicAccounts(updated);
  });

  ipcMain.handle('accounts:delete', (_, id) => {
    const updated = store.get('accounts').filter(a => a.id !== id);
    store.set('accounts', updated);
    return publicAccounts(updated);
  });

  ipcMain.handle('accounts:reorder', (_, ids) => {
    const accounts = store.get('accounts');
    const reordered = ids.map(id => accounts.find(a => a.id === id)).filter(Boolean);
    store.set('accounts', reordered);
    return publicAccounts(reordered);
  });
};
