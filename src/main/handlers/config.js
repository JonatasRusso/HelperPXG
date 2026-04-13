const { ipcMain, app, shell } = require('electron');
const store = require('../store');
const fs   = require('fs');
const path = require('path');

module.exports = function registerConfigHandlers() {
  ipcMain.handle('credentials:getDelay', () => store.get('loginDelay'));
  ipcMain.handle('credentials:setDelay', (_, delay) => { store.set('loginDelay', delay); return delay; });

  ipcMain.handle('config:getDataPath', () => app.getPath('userData'));
  ipcMain.handle('config:openDataFolder', () => shell.openPath(app.getPath('userData')));

  ipcMain.handle('config:getBgFiles', () => {
    const dir = path.join(__dirname, '../../assets/Personagens');
    return fs.readdirSync(dir)
      .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort();
  });
};
