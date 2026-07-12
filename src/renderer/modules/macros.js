let macros     = [];
let openId     = null;
let buf        = null; // deep clone of macro being edited
let stepDragSrc = null;

const runningIds = new Set();

// ── State change from main process ──

window.api.onMacroStateChanged((_, { id, state }) => {
  if (state === 'running') runningIds.add(id);
  else runningIds.delete(id);
  const dot = document.getElementById('macro-dot-' + id);
  const btn = document.getElementById('macro-run-btn-' + id);
  if (dot) dot.style.display = state === 'running' ? 'inline' : 'none';
  if (btn) { btn.textContent = state === 'running' ? '■' : '▶'; btn.title = state === 'running' ? 'Parar' : 'Executar'; }
});

// ── Load ──

async function loadMacros() {
  macros = await window.api.getMacros();
  renderMacroList();
}

// ── Render ──

function renderMacroList() {
  const el = document.getElementById('macro-list');
  if (!macros.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⌨</div><div>Nenhum macro criado.</div></div>`;
    return;
  }
  el.innerHTML = macros.map(m => `
    <div class="macro-card" id="macro-card-${m.id}">
      <div class="macro-row">
        <span class="macro-name">${escapeHtml(m.name)}</span>
        ${m.hotkey ? `<span class="macro-hotkey-tag">${escapeHtml(m.hotkey)}</span>` : ''}
        <span class="macro-running-dot" id="macro-dot-${m.id}" title="Rodando"
          style="display:${runningIds.has(m.id) ? 'inline' : 'none'}">●</span>
        <button class="macro-run-btn" id="macro-run-btn-${m.id}"
          onclick="doRunMacro(${m.id})"
          title="${runningIds.has(m.id) ? 'Parar' : 'Executar'}">
          ${runningIds.has(m.id) ? '■' : '▶'}
        </button>
        <label class="toggle-switch" title="${m.enabled ? 'Ativo' : 'Inativo'}">
          <input type="checkbox" ${m.enabled ? 'checked' : ''} onchange="doToggleMacro(${m.id}, this)">
          <span class="toggle-knob"></span>
        </label>
        <button class="btn-chevron" id="chevron-${m.id}" onclick="toggleMacroEditor(${m.id})">▸</button>
      </div>
      <div class="macro-editor-panel" id="macro-editor-${m.id}" style="display:none"></div>
    </div>
  `).join('');
}

function toggleMacroEditor(id) {
  if (openId && openId !== id) {
    document.getElementById('macro-editor-' + openId).style.display = 'none';
    document.getElementById('chevron-' + openId).textContent = '▸';
    document.getElementById('macro-card-' + openId).style.borderRadius = '';
  }

  const panel   = document.getElementById('macro-editor-' + id);
  const chevron = document.getElementById('chevron-' + id);
  const card    = document.getElementById('macro-card-' + id);
  const isOpen  = panel.style.display === 'block';

  if (isOpen) {
    panel.style.display = 'none';
    chevron.textContent = '▸';
    card.style.borderRadius = '';
    openId = null;
    buf    = null;
  } else {
    buf    = JSON.parse(JSON.stringify(macros.find(m => m.id === id)));
    openId = id;
    panel.style.display = 'block';
    panel.innerHTML = renderEditorContent();
    chevron.textContent = '▾';
    card.style.borderRadius = 'var(--radius) var(--radius) 0 0';
  }
}

// ── Editor ──

function renderEditorContent() {
  return `
    <div class="macro-editor-inner">
      <div class="macro-field-row">
        <label class="panel-label">Nome</label>
        <input class="macro-text-input" value="${escapeHtml(buf.name)}" maxlength="40"
          oninput="buf.name=this.value" />
      </div>

      <div class="macro-field-row">
        <label class="panel-label">Hotkey</label>
        <div class="macro-hotkey-row">
          <span class="macro-hotkey-display" id="buf-hotkey-display">
            ${buf.hotkey || '<span class="muted">—</span>'}
          </span>
          <button class="btn-secondary macro-sm-btn" id="buf-hotkey-btn"
            onclick="startCaptureHotkey()">Capturar</button>
          ${buf.hotkey ? `<button class="btn-step-del" onclick="buf.hotkey='';document.getElementById('buf-hotkey-display').innerHTML='<span class=\\'muted\\'>—</span>'">×</button>` : ''}
        </div>
      </div>

      <div class="macro-field-row">
        <label class="panel-label">Loop</label>
        <div class="macro-loop-row">
          ${['count','time','infinite'].map(t => `
            <label class="macro-loop-opt">
              <input type="radio" name="buf-loop" value="${t}" ${buf.loop.type===t?'checked':''}
                onchange="buf.loop.type='${t}';reRenderLoopValue()">
              ${t==='count'?'Vezes':t==='time'?'Tempo (s)':'Indefinido'}
            </label>
          `).join('')}
        </div>
        <div id="buf-loop-val">${renderLoopValueInput()}</div>
      </div>

      <label class="panel-label">Steps</label>
      <div class="macro-steps-list" id="buf-steps">
        ${buf.steps.length ? buf.steps.map(renderStep).join('') : '<div class="muted" style="font-size:12px;padding:4px 0">Nenhum step. Adicione abaixo.</div>'}
      </div>

      <div class="macro-add-row">
        <button class="btn-secondary macro-sm-btn" onclick="startAddKeyStep()">+ Tecla</button>
        <button class="btn-secondary macro-sm-btn" onclick="startAddWaitStep()">+ Esperar</button>
      </div>
      <div id="macro-step-input" style="display:none"></div>

      <div class="macro-actions">
        <button class="btn-primary" onclick="saveMacro()">Salvar</button>
        <button class="btn-danger"  onclick="showConfirmModal('Excluir macro?', () => doDeleteMacro(${buf.id}))">Excluir</button>
      </div>
    </div>
  `;
}

function renderStep(s, i) {
  const label = s.type === 'key' ? escapeHtml(s.key) : `${s.ms}ms`;
  const badge = s.type === 'key' ? 'KEY' : 'WAIT';
  return `
    <div class="macro-step-row" draggable="true"
      ondragstart="stepDragStart(event,${i})"
      ondragover="stepDragOver(event,${i})"
      ondrop="stepDrop(event,${i})"
      ondragend="stepDragEnd()"
      ondragleave="this.classList.remove('drag-over')">
      <span class="drag-handle">⠿</span>
      <span class="step-badge step-${s.type}">${badge}</span>
      <span class="step-value">${label}</span>
      <button class="btn-step-del" onclick="removeStep(${i})">×</button>
    </div>
  `;
}

function renderLoopValueInput() {
  if (buf.loop.type === 'infinite') return '';
  const unit = buf.loop.type === 'time' ? 's' : 'x';
  return `<input type="number" class="macro-num-input" min="1" max="9999"
    value="${buf.loop.value || 1}" oninput="buf.loop.value=+this.value"> ${unit}`;
}

function reRenderLoopValue() {
  document.getElementById('buf-loop-val').innerHTML = renderLoopValueInput();
}

function refreshSteps() {
  const el = document.getElementById('buf-steps');
  if (el) el.innerHTML = buf.steps.length
    ? buf.steps.map(renderStep).join('')
    : '<div class="muted" style="font-size:12px;padding:4px 0">Nenhum step. Adicione abaixo.</div>';
}

// ── Key capture ──

let _captureTarget = null; // 'hotkey' | 'step'

function startCaptureHotkey() {
  _captureTarget = 'hotkey';
  const btn = document.getElementById('buf-hotkey-btn');
  if (btn) { btn.textContent = '⌨ Pressione...'; btn.disabled = true; }
  document.addEventListener('keydown', onCaptureKey, true);
}

function startAddKeyStep() {
  const el = document.getElementById('macro-step-input');
  el.style.display = 'block';
  el.innerHTML = `<button class="btn-capture-key" id="capture-step-btn" onclick="beginStepCapture()">⌨ Pressione uma tecla...</button>`;
}

function beginStepCapture() {
  _captureTarget = 'step';
  const btn = document.getElementById('capture-step-btn');
  if (btn) { btn.textContent = '⌨ Aguardando...'; btn.disabled = true; }
  document.addEventListener('keydown', onCaptureKey, true);
}

function startAddWaitStep() {
  const el = document.getElementById('macro-step-input');
  el.style.display = 'block';
  el.innerHTML = `
    <div class="macro-wait-row">
      <input type="number" id="wait-ms" class="macro-num-input" min="1" max="60000" value="500" placeholder="ms" />
      <span class="muted" style="font-size:12px">ms</span>
      <button class="btn-primary macro-sm-btn" onclick="confirmAddWait()">Adicionar</button>
      <button class="btn-secondary macro-sm-btn" onclick="cancelAddStep()">Cancelar</button>
    </div>
  `;
}

function confirmAddWait() {
  const ms = parseInt(document.getElementById('wait-ms').value, 10);
  if (!ms || ms < 1) return;
  buf.steps.push({ type: 'wait', ms });
  cancelAddStep();
  refreshSteps();
}

function cancelAddStep() {
  _captureTarget = null;
  document.removeEventListener('keydown', onCaptureKey, true);
  const el = document.getElementById('macro-step-input');
  if (el) { el.style.display = 'none'; el.innerHTML = ''; }
}

function onCaptureKey(e) {
  e.preventDefault();
  e.stopPropagation();
  const ignored = ['Control','Shift','Alt','Meta','CapsLock','NumLock','ScrollLock','Unidentified'];
  if (ignored.includes(e.key)) return;

  let key = e.key;
  if (key === ' ')             key = 'Space';
  else if (key === 'ArrowUp')    key = 'Up';
  else if (key === 'ArrowDown')  key = 'Down';
  else if (key === 'ArrowLeft')  key = 'Left';
  else if (key === 'ArrowRight') key = 'Right';
  else if (key.length === 1)     key = key.toUpperCase();

  document.removeEventListener('keydown', onCaptureKey, true);

  if (_captureTarget === 'hotkey') {
    buf.hotkey = key;
    const display = document.getElementById('buf-hotkey-display');
    const btn     = document.getElementById('buf-hotkey-btn');
    if (display) display.textContent = key;
    if (btn)     { btn.textContent = 'Capturar'; btn.disabled = false; }
    refreshConflict();
  } else if (_captureTarget === 'step') {
    buf.steps.push({ type: 'key', key });
    cancelAddStep();
    refreshSteps();
  }
  _captureTarget = null;
}

// ── Step drag and drop ──

function stepDragStart(e, i) {
  stepDragSrc = i;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}

function stepDragOver(e, i) {
  e.preventDefault();
  document.querySelectorAll('.macro-step-row').forEach((r, idx) => {
    r.classList.toggle('drag-over', idx === i && i !== stepDragSrc);
  });
}

function stepDrop(e, i) {
  e.preventDefault();
  stepDragEnd();
  if (stepDragSrc === null || stepDragSrc === i) return;
  const [moved] = buf.steps.splice(stepDragSrc, 1);
  buf.steps.splice(i, 0, moved);
  refreshSteps();
}

function stepDragEnd() {
  document.querySelectorAll('.macro-step-row').forEach(r =>
    r.classList.remove('drag-over', 'dragging')
  );
  stepDragSrc = null;
}

function removeStep(i) {
  buf.steps.splice(i, 1);
  refreshSteps();
}

// ── Actions ──

async function addNewMacro() {
  macros = await window.api.addMacro({
    name: 'Novo Macro',
    hotkey: '',
    loop: { type: 'count', value: 1 },
    steps: [],
  });
  renderMacroList();
  toggleMacroEditor(macros[macros.length - 1].id);
}

async function saveMacro() {
  macros = await window.api.updateMacro(buf);
  const prevOpen = openId;
  openId = null;
  buf    = null;
  renderMacroList();
  toggleMacroEditor(prevOpen);
}

async function doToggleMacro(id, checkbox) {
  macros = await window.api.toggleMacro(id);
  // sync checkbox if re-render happens later
}

async function doDeleteMacro(id) {
  macros = await window.api.deleteMacro(id);
  openId = null;
  buf    = null;
  renderMacroList();
}

async function doRunMacro(id) {
  await window.api.runMacro(id);
}
