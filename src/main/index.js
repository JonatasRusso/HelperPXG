if (process.argv.includes('--dev')) {
  require('electron-reload')(require('path').join(__dirname, '../'), {
    electron: require('path').join(__dirname, '../../node_modules/.bin/electron')
  });
}

const { app, BrowserWindow } = require('electron');
const path = require('path');

const registerWindowHandlers  = require('./handlers/window');
const registerTaskHandlers     = require('./handlers/tasks');
const registerAccountHandlers  = require('./handlers/accounts');
const registerLauncherHandlers = require('./handlers/launcher');
const registerAutologinHandlers = require('./handlers/autologin');
const registerConfigHandlers   = require('./handlers/config');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 750,
    minWidth: 550,
    minHeight: 650,
    frame: false,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));


  registerWindowHandlers(mainWindow);
  registerLauncherHandlers(mainWindow);
}

app.whenReady().then(() => {
  registerTaskHandlers();
  registerAccountHandlers();
  registerAutologinHandlers();
  registerConfigHandlers();
  createWindow();
});

app.on('window-all-closed', () => app.quit());
