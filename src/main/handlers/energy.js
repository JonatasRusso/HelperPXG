const { ipcMain } = require('electron');
const store = require('../store');

function serverComputeEnergy(stored) {
  if (!stored) return 0;
  const { current, max, regenMin, lastUpdated } = stored;
  if (!regenMin) return Math.min(max, Math.max(0, current));
  const gained = Math.floor((Date.now() - lastUpdated) / (regenMin * 60000));
  return Math.min(max, Math.max(0, current + gained));
}

module.exports = function registerEnergyHandlers() {
  ipcMain.handle('energy:runTask', (_, characterId, taskId, tierIndex) => {
    const chars = store.get('characters');
    const task = store.get('tasks').find(t => t.id === taskId);
    if (!task || !task.tiers || !task.tiers[tierIndex]) return chars;
    const cost = task.tiers[tierIndex].energyCost;
    const updated = chars.map(c => {
      if (c.id !== characterId) return c;
      const available = serverComputeEnergy(c.blueEnergy);
      if (available < cost) return c;
      const rc = c.runCounts || {};
      return {
        ...c,
        blueEnergy: { ...c.blueEnergy, current: Math.max(0, available - cost), lastUpdated: Date.now() },
        runCounts: { ...rc, [String(taskId)]: (rc[String(taskId)] || 0) + 1 },
      };
    });
    store.set('characters', updated);
    return updated;
  });

  ipcMain.handle('energy:runRedTask', (_, characterId, taskId, tierIndex) => {
    const chars = store.get('characters');
    const task = store.get('tasks').find(t => t.id === taskId);
    if (!task || !task.tiers || !task.tiers[tierIndex]) return chars;
    const cost = task.tiers[tierIndex].energyCost;
    const updated = chars.map(c => {
      if (c.id !== characterId) return c;
      const available = serverComputeEnergy(c.redEnergy);
      if (available < cost) return c;
      return {
        ...c,
        redEnergy: { ...c.redEnergy, current: Math.max(0, available - cost), lastUpdated: Date.now() },
        taskState: { ...c.taskState, [String(taskId)]: true },
      };
    });
    store.set('characters', updated);
    return updated;
  });
};
