const Store = require('electron-store');

const store = new Store({
  defaults: {
    tasks: [],
    gamePath: '',
    accounts: [],
    loginDelay: 3000,
  }
});

module.exports = store;
