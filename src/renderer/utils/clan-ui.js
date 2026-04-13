const CLANS = [
  'gardestrike','ironhard','malefic','naturia','orebound',
  'psycraft','raibolt','seavell','volcanic','wingeon'
];

function clanDropdownHtml(selectId, selected = '') {
  const label    = selected ? selected.charAt(0).toUpperCase() + selected.slice(1) : '— Sem clã —';
  const iconHtml = selected
    ? `<img class="clan-dd-icon" src="../assets/cla/${selected}.png" onerror="this.style.display='none'" />`
    : '';
  return `
    <div class="clan-dd" id="${selectId}" data-value="${selected}">
      <button type="button" class="clan-dd-btn" onclick="toggleClanDropdown('${selectId}')">
        ${iconHtml}<span class="clan-dd-label">${label}</span>
        <span class="clan-dd-arrow">▾</span>
      </button>
      <div class="clan-dd-list" style="display:none">
        <div class="clan-dd-option" data-value="" onclick="selectClan('${selectId}','')">
          <span class="clan-dd-label">— Sem clã —</span>
        </div>
        ${CLANS.map(c => {
          const lbl = c.charAt(0).toUpperCase() + c.slice(1);
          return `<div class="clan-dd-option${selected === c ? ' active' : ''}" data-value="${c}" onclick="selectClan('${selectId}','${c}')">
            <img class="clan-dd-icon" src="../assets/cla/${c}.png" onerror="this.style.display='none'" />
            <span class="clan-dd-label">${lbl}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

document.addEventListener('click', e => {
  if (!e.target.closest('.clan-dd')) {
    document.querySelectorAll('.clan-dd-list').forEach(l => l.style.display = 'none');
  }
});

function toggleClanDropdown(id) {
  const dd   = document.getElementById(id);
  const list = dd.querySelector('.clan-dd-list');
  const open = list.style.display !== 'none';
  document.querySelectorAll('.clan-dd-list').forEach(l => l.style.display = 'none');
  if (!open) list.style.display = 'block';
}

function selectClan(id, value) {
  const dd       = document.getElementById(id);
  dd.dataset.value = value;
  const label    = value ? value.charAt(0).toUpperCase() + value.slice(1) : '— Sem clã —';
  const iconHtml = value
    ? `<img class="clan-dd-icon" src="../assets/cla/${value}.png" onerror="this.style.display='none'" />`
    : '';
  dd.querySelector('.clan-dd-btn').innerHTML =
    `${iconHtml}<span class="clan-dd-label">${label}</span><span class="clan-dd-arrow">▾</span>`;
  dd.querySelectorAll('.clan-dd-option').forEach(o => o.classList.toggle('active', o.dataset.value === value));
  dd.querySelector('.clan-dd-list').style.display = 'none';

  if (typeof onClanSelectForEdit === 'function') onClanSelectForEdit(id, value);
}
