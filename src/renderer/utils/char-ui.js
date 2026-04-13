let BG_FILES = [
  'personagem-bg-01.png','personagem-bg-02.png',
  'personagem-bg-03.png','personagem-bg-04.png'
];
window.api.getBgFiles().then(files => { if (files?.length) BG_FILES = files; });
const LEVEL_TAGS = ['300-','300+','400+','500+','600+'];

function levelTagsHtml(containerId, selected = '300-') {
  return `<div class="level-tags" id="${containerId}">
    ${LEVEL_TAGS.map(t =>
      `<button class="level-tag${selected === t ? ' level-tag--active' : ''}"
        onclick="selectLevelTagIn('${containerId}', this)">${t}</button>`
    ).join('')}
  </div>`;
}

function bgPickerHtml(pickerId, selected = 'personagem-bg-01.png', customImage = null) {
  const thumbs = BG_FILES.map(f => {
    const active = !customImage && selected === f;
    return `<button type="button" class="bg-thumb${active ? ' bg-thumb--active' : ''}"
      style="background-image:url('../assets/Personagens/${f}')"
      data-bg="${f}"
      onclick="selectBgIn('${pickerId}', this)"></button>`;
  }).join('');

  const customThumb = customImage
    ? `<button type="button" class="bg-thumb bg-thumb--active"
        style="background-image:url('${customImage.replace(/'/g, '')}')"
        data-image="${customImage.replace(/'/g, '')}"
        onclick="selectBgIn('${pickerId}', this)"></button>`
    : '';

  const addBtn = `<button type="button" class="bg-add-btn"
    onclick="pickCustomBg('${pickerId}')" title="Imagem personalizada">+</button>`;

  return `<div class="bg-picker" id="${pickerId}">${thumbs}${customThumb}${addBtn}</div>`;
}

function selectLevelTagIn(containerId, btn) {
  document.getElementById(containerId).querySelectorAll('.level-tag')
    .forEach(b => b.classList.remove('level-tag--active'));
  btn.classList.add('level-tag--active');
}

function selectBgIn(pickerId, btn) {
  document.getElementById(pickerId).querySelectorAll('.bg-thumb')
    .forEach(b => b.classList.remove('bg-thumb--active'));
  btn.classList.add('bg-thumb--active');
}

async function pickCustomBg(pickerId) {
  const result = await window.api.pickImageData();
  if (!result) return;
  const { filename, url } = result;
  const picker = document.getElementById(pickerId);
  const old = picker.querySelector('.bg-thumb[data-image]');
  if (old) old.remove();
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bg-thumb';
  btn.style.backgroundImage = `url('${url.replace(/'/g, '')}')`;
  btn.dataset.image = filename;
  btn.onclick = () => selectBgIn(pickerId, btn);
  picker.querySelector('.bg-add-btn').before(btn);
  selectBgIn(pickerId, btn);
}
