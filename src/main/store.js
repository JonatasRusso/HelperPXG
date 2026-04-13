const Store = require('electron-store');

const store = new Store({
  schema: {
    tasks:      { type: 'array',  default: [] },
    gamePath:   { type: 'string', default: '' },
    accounts:   { type: 'array',  default: [] },
    loginDelay: { type: 'number', minimum: 10, maximum: 10000, default: 1000 },
    characters: { type: 'array',  default: [] },
  },
});

module.exports = store;
