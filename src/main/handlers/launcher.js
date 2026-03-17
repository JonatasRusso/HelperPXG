const { ipcMain, dialog } = require('electron');
const path = require('path');
const store = require('../store');

module.exports = function registerLauncherHandlers(mainWindow) {
  ipcMain.handle('launcher:getPath', () => store.get('gamePath'));

  ipcMain.handle('launcher:browse', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Selecionar executavel do jogo',
      filters: [{ name: 'Executavel', extensions: ['exe'] }],
      properties: ['openFile'],
    });
    if (result.canceled) return null;
    const gamePath = result.filePaths[0];
    store.set('gamePath', gamePath);
    return gamePath;
  });

  ipcMain.handle('launcher:launch', () => {
    const gamePath = store.get('gamePath');
    if (!gamePath) return { success: false, error: 'Caminho do jogo nao configurado.' };

    return new Promise((resolve) => {
      const child = require('child_process').spawn(`"${gamePath}"`, [], {
        cwd: path.dirname(gamePath),
        shell: true,
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      setTimeout(() => resolve({ success: true }), 1000);
      child.on('error', (err) => resolve({ success: false, error: err.message }));
    });
  });
};
