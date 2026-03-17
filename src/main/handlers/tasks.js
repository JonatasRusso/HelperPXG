const { ipcMain } = require('electron');
const store = require('../store');

module.exports = function registerTaskHandlers() {
  ipcMain.handle('tasks:get', () => store.get('tasks'));

  ipcMain.handle('tasks:add', (_, title) => {
    const tasks = store.get('tasks');
    const newTask = { id: Date.now(), title, done: false, createdAt: new Date().toISOString() };
    store.set('tasks', [...tasks, newTask]);
    return newTask;
  });

  ipcMain.handle('tasks:toggle', (_, id) => {
    const tasks = store.get('tasks').map(t => t.id === id ? { ...t, done: !t.done } : t);
    store.set('tasks', tasks);
    return tasks;
  });

  ipcMain.handle('tasks:delete', (_, id) => {
    const tasks = store.get('tasks').filter(t => t.id !== id);
    store.set('tasks', tasks);
    return tasks;
  });
};
