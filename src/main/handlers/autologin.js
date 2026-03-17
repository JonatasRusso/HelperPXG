const { ipcMain, safeStorage } = require('electron');
const store = require('../store');

module.exports = function registerAutologinHandlers() {
  ipcMain.handle('autologin:runForAccount', async (_, id) => {
    const account = store.get('accounts').find(a => a.id === id);
    if (!account) return { success: false, error: 'Conta não encontrada.' };

    const delay = store.get('loginDelay');

    let password = account.password;
    if (password && safeStorage.isEncryptionAvailable()) {
      try {
        password = safeStorage.decryptString(Buffer.from(password, 'base64'));
      } catch (_) {
        return { success: false, error: 'Erro ao descriptografar senha.' };
      }
    }

    function escapePSString(str) { return str.replace(/'/g, "''"); }
    const psUser = escapePSString(account.username);
    const psPass = escapePSString(password);

    const psScript = `
$proc = Get-Process -Name 'pxgme' -ErrorAction SilentlyContinue
if (-not $proc) { exit 1 }
$shell = New-Object -ComObject WScript.Shell
if (-not $shell.AppActivate('PokeXGames')) { exit 2 }
Start-Sleep -Milliseconds ${delay}
Set-Clipboard -Value '${psUser}'
$shell.SendKeys('^v')
Start-Sleep -Milliseconds 200
$shell.SendKeys('{TAB}')
Start-Sleep -Milliseconds 200
Set-Clipboard -Value '${psPass}'
$shell.SendKeys('^v')
Start-Sleep -Milliseconds 200
$shell.SendKeys('{ENTER}')
Set-Clipboard -Value ''
`.trim();

    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

    return new Promise((resolve) => {
      require('child_process').exec(
        `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
        (err) => {
          if (err) {
            if (err.code === 1) resolve({ success: false, error: 'Abra o jogo antes de executar o auto-login.' });
            else if (err.code === 2) resolve({ success: false, error: 'Não foi possível focar a janela do jogo.' });
            else resolve({ success: false, error: err.message });
          } else {
            resolve({ success: true });
          }
        }
      );
    });
  });
};
