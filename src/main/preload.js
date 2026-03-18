const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close:    () => ipcRenderer.send('window:close'),

  // Tasks
  getTasks:     ()      => ipcRenderer.invoke('tasks:get'),
  addTask:      (data)  => ipcRenderer.invoke('tasks:add', data),
  toggleTask:   (id)    => ipcRenderer.invoke('tasks:toggle', id),
  deleteTask:   (id)    => ipcRenderer.invoke('tasks:delete', id),
  reorderTasks: (ids)   => ipcRenderer.invoke('tasks:reorder', ids),
  setTaskImage: (id)    => ipcRenderer.invoke('tasks:setImage', id),

  // Accounts
  getAccounts:     ()     => ipcRenderer.invoke('accounts:get'),
  addAccount:      (a)    => ipcRenderer.invoke('accounts:add', a),
  deleteAccount:   (id)   => ipcRenderer.invoke('accounts:delete', id),
  reorderAccounts: (ids)  => ipcRenderer.invoke('accounts:reorder', ids),
  setVip:          (id, days) => ipcRenderer.invoke('accounts:setVip', id, days),

  // Auto-login
  runAutoLoginFor: (id)  => ipcRenderer.invoke('autologin:runForAccount', id),

  // Launcher
  getGamePath: ()    => ipcRenderer.invoke('launcher:getPath'),
  browseGame:  ()    => ipcRenderer.invoke('launcher:browse'),
  launchGame:  ()    => ipcRenderer.invoke('launcher:launch'),

  // Delay
  getDelay: ()      => ipcRenderer.invoke('credentials:getDelay'),
  setDelay: (d)     => ipcRenderer.invoke('credentials:setDelay', d),

  // Config
  getDataPath:    () => ipcRenderer.invoke('config:getDataPath'),
  openDataFolder: () => ipcRenderer.invoke('config:openDataFolder'),

  // Characters
  getCharacters:       ()      => ipcRenderer.invoke('characters:get'),
  addCharacter:        (data)  => ipcRenderer.invoke('characters:add', data),
  deleteCharacter:     (id)    => ipcRenderer.invoke('characters:delete', id),
  pickImageData:       ()      => ipcRenderer.invoke('characters:pickImageData'),
  setCharacterTasks:   (data)  => ipcRenderer.invoke('characters:setTasks', data),
  toggleCharacterTask: (data)  => ipcRenderer.invoke('characters:toggleTask', data),
  setCharacterInfo:    (data)  => ipcRenderer.invoke('characters:setInfo', data),
});
