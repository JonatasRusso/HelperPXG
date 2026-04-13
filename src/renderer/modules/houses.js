// ─── Houses ───────────────────────────────────────────────────────────────────
let houseCharacters = []; // full characters array, refreshed on loadHouses()

async function loadHouses() {
  houseCharacters = await window.api.getCharacters();
  renderHouses();
}

const HOUSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="house-svg-icon"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;

function houseIconHtml(house, charName) {
  const days = houseRemaining(house);
  if (days === null) return '';
  if (days <= 5) {
    const state = house.cpSeparated ? 'green' : 'red';
    return `<span class="house-icon house-icon-${state}" title="${escapeHtml(charName)}">${HOUSE_SVG}</span>`;
  }
  const opacity = Math.max(0.2, 1 - (days / 30));
  return `<span class="house-icon house-icon-gray" style="opacity:${opacity}" title="${escapeHtml(charName)}">${HOUSE_SVG}</span>`;
}

function renderHouses() {
  const list = document.getElementById('house-list');
  const withHouse = houseCharacters.filter(c => c.house);

  if (!withHouse.length) {
    list.innerHTML = '<div class="empty-state">Nenhuma house cadastrada.</div>';
    return;
  }

  list.innerHTML = withHouse.map(c => {
    const days = houseRemaining(c.house);
    const daysCls = days !== null && days <= 3 ? 'house-days-red' : 'house-days-ok';
    const daysLabel = days !== null ? `${days}d` : '—';
    const iconHtml = houseIconHtml(c.house, c.name);

    return `
      <div class="house-list-row">
        <span class="house-name-cell">${iconHtml}<span class="house-char-name">${escapeHtml(c.name)}</span></span>
        <span class="house-value">$${c.house.value}</span>
        <span class="house-days ${daysCls}">${daysLabel}</span>
        <label class="house-cp-toggle" title="Valor separado no CP">
          <input type="checkbox" ${c.house.cpSeparated ? 'checked' : ''}
            onchange="toggleHouseCpRow(${c.id})" />
          CP
        </label>
        <button class="house-delete-btn"
          onclick="deleteHouseRow(${c.id})" title="Remover house">🗑</button>
      </div>`;
  }).join('');
}

function showAddHouseForm() {
  // Populate character select with characters that have no house
  const select = document.getElementById('house-char-select');
  const available = houseCharacters.filter(c => !c.house);
  document.getElementById('add-house-form').style.display = 'block';
  if (!available.length) {
    select.innerHTML = '<option value="">Nenhum personagem disponível</option>';
    setStatus('house-form-status', '✗ Todos os personagens já têm house.', 'err');
    return;
  }
  select.innerHTML = available.map(c =>
    `<option value="${c.id}">${escapeHtml(c.name)}</option>`
  ).join('');
  document.getElementById('house-bid-day').value = '';
  document.getElementById('house-value').value = '';
  document.getElementById('house-cp-checkbox').checked = false;
  document.getElementById('house-form-status').textContent = '';
}

function hideAddHouseForm() {
  document.getElementById('add-house-form').style.display = 'none';
  document.getElementById('house-form-status').textContent = '';
}

async function addHouse() {
  const characterId = Number(document.getElementById('house-char-select').value);
  const bidDay      = parseInt(document.getElementById('house-bid-day').value, 10);
  const value       = parseInt(document.getElementById('house-value').value, 10);
  const cpSeparated = document.getElementById('house-cp-checkbox').checked;

  if (!characterId) {
    setStatus('house-form-status', '✗ Selecione um personagem.', 'err');
    return;
  }
  if (isNaN(bidDay) || bidDay < 1 || bidDay > 28) {
    setStatus('house-form-status', '✗ Dia do BID deve ser entre 1 e 28.', 'err');
    return;
  }
  if (isNaN(value) || value < 0) {
    setStatus('house-form-status', '✗ Valor inválido.', 'err');
    return;
  }

  houseCharacters = await window.api.setHouse(characterId, { bidDay, value, cpSeparated });
  hideAddHouseForm();
  renderHouses();
  // Refresh login icons
  if (typeof loadAccounts === 'function') loadAccounts();
}

async function toggleHouseCpRow(characterId) {
  houseCharacters = await window.api.toggleHouseCp(characterId);
  renderHouses();
  if (typeof loadAccounts === 'function') loadAccounts();
}

async function deleteHouseRow(characterId) {
  houseCharacters = await window.api.deleteHouse(characterId);
  renderHouses();
  if (typeof loadAccounts === 'function') loadAccounts();
}
