// ─── Config ───────────────────────────────────────────────────────────────────
async function loadConfig() {
  const gamePath = await window.api.getGamePath();
  if (gamePath) document.getElementById('game-path').value = gamePath;

  const delay = await window.api.getDelay();
  document.getElementById('delay-slider').value = delay;
  document.getElementById('delay-label').textContent = delay + 'ms';

  const dataPath = await window.api.getDataPath();
  document.getElementById('data-path').value = dataPath;

  const theme = await window.api.getTheme();
  applyTheme(theme);
  renderThemePicker(theme);

  const loginEnter = await window.api.getLoginEnter();
  const tog = document.getElementById('login-enter-toggle');
  if (tog) tog.checked = loginEnter;
}

function renderThemePicker(activeId) {
  const el = document.getElementById('theme-picker');
  if (!el) return;
  el.innerHTML = Object.entries(THEMES).map(([id, t]) => `
    <button class="theme-chip ${id === activeId ? 'active' : ''}" onclick="selectTheme('${id}')" title="${t.label}">
      <span class="theme-chip-dot" style="background:${t.accent};box-shadow:0 0 6px ${t.accent}44"></span>
      <span class="theme-chip-border" style="background:${t.border}"></span>
      <span class="theme-chip-label">${t.label}</span>
    </button>
  `).join('');
}

async function selectTheme(id) {
  applyTheme(id);
  await window.api.setTheme(id);
  renderThemePicker(id);
}

async function setLoginEnterOpt(val) {
  await window.api.setLoginEnter(val);
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
