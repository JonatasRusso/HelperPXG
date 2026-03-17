// ─── Config ───────────────────────────────────────────────────────────────────
async function loadConfig() {
  const gamePath = await window.api.getGamePath();
  if (gamePath) document.getElementById('game-path').value = gamePath;

  const delay = await window.api.getDelay();
  document.getElementById('delay-slider').value = delay;
  document.getElementById('delay-label').textContent = delay + 'ms';

  const dataPath = await window.api.getDataPath();
  document.getElementById('data-path').value = dataPath;
}

async function browseGame() {
  const p = await window.api.browseGame();
  if (p) document.getElementById('game-path').value = p;
}

async function launchGame() {
  const res = await window.api.launchGame();
  if (res.success) setStatus('launcher-status', '✓ Jogo iniciado!', 'ok');
  else setStatus('launcher-status', '✗ Erro: ' + res.error, 'err');
}

async function updateDelay(val) {
  document.getElementById('delay-label').textContent = val + 'ms';
  await window.api.setDelay(Number(val));
}

async function openDataFolder() {
  await window.api.openDataFolder();
}
