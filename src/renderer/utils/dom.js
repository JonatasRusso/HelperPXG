function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('collapsed');
}

function navigate(page) {
  document.getElementById('add-house-form').style.display = 'none';
  document.getElementById('char-edit-area').innerHTML = '';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
}

function setStatus(id, msg, type = 'ok') {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'status-msg ' + type;
  if (type === 'ok') setTimeout(() => el.textContent = '', 3000);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showConfirmModal(msg, onConfirm) {
  document.getElementById('confirm-modal-msg').textContent = msg;
  const okBtn = document.getElementById('confirm-modal-ok');
  okBtn.onclick = () => { hideConfirmModal(); onConfirm(); };
  document.getElementById('confirm-modal').style.display = 'flex';
}

function hideConfirmModal() {
  document.getElementById('confirm-modal').style.display = 'none';
}
