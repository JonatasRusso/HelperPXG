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
  setPassword:     (id, pw)   => ipcRenderer.invoke('accounts:setPassword', id, pw),

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
  getBgFiles:     () => ipcRenderer.invoke('config:getBgFiles'),

  // Characters
  getCharacters:       ()      => ipcRenderer.invoke('characters:get'),
  addCharacter:        (data)  => ipcRenderer.invoke('characters:add', data),
  deleteCharacter:     (id)    => ipcRenderer.invoke('characters:delete', id),
  pickImageData:       ()      => ipcRenderer.invoke('characters:pickImageData'),
  setCharacterTasks:   (data)  => ipcRenderer.invoke('characters:setTasks', data),
  toggleCharacterTask: (data)  => ipcRenderer.invoke('characters:toggleTask', data),
  setCharacterInfo:    (data)  => ipcRenderer.invoke('characters:setInfo', data),

  // Houses
  setHouse:      (id, data) => ipcRenderer.invoke('houses:set', id, data),
  deleteHouse:   (id)       => ipcRenderer.invoke('houses:delete', id),
  toggleHouseCp: (id)       => ipcRenderer.invoke('houses:toggleCp', id),

  // Events
  onTasksReset: (cb) => ipcRenderer.on('tasks:didReset', cb),

  // Energy
  runTask:         (charId, taskId, tierIdx) => ipcRenderer.invoke('energy:runTask', charId, taskId, tierIdx),
  runRedTask:      (charId, taskId, tierIdx) => ipcRenderer.invoke('energy:runRedTask', charId, taskId, tierIdx),
  setDisabledTask: (id, disabled)            => ipcRenderer.invoke('tasks:setDisabled', id, disabled),
});
