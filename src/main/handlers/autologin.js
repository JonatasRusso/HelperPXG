const { ipcMain, safeStorage } = require('electron');
const store = require('../store');
const koffi = require('koffi');

// ─── Windows API via koffi ────────────────────────────────────────────────────
const user32   = koffi.load('user32.dll');
const kernel32 = koffi.load('kernel32.dll');

const FindWindowW              = user32.func('FindWindowW',              'void *', ['void *', 'str16']);
const IsIconic                 = user32.func('IsIconic',                 'bool',   ['void *']);
const ShowWindow               = user32.func('ShowWindow',               'bool',   ['void *', 'int32']);
const GetForegroundWindow      = user32.func('GetForegroundWindow',      'void *', []);
const SetForegroundWindow      = user32.func('SetForegroundWindow',      'bool',   ['void *']);
const BringWindowToTop         = user32.func('BringWindowToTop',         'bool',   ['void *']);
const GetWindowThreadProcessId = user32.func('GetWindowThreadProcessId', 'uint32', ['void *', 'void *']);
const AttachThreadInput        = user32.func('AttachThreadInput',        'bool',   ['uint32', 'uint32', 'bool']);
const SendInputFn              = user32.func('SendInput',                'uint32', ['uint32', 'void *', 'int32']);
const GetCurrentThreadId       = kernel32.func('GetCurrentThreadId',     'uint32', []);

// ─── INPUT struct layout (64-bit Windows) ────────────────────────────────────
// Offset  0: type     (uint32) = 1 (INPUT_KEYBOARD)
// Offset  4: padding  (4 bytes)
// Offset  8: wVk      (uint16)
// Offset 10: wScan    (uint16)
// Offset 12: dwFlags  (uint32)
// Offset 16: time     (uint32) = 0
// Offset 20: padding  (4 bytes)
// Offset 24: dwExtraInfo (uint64) = 0
// Offset 32: padding  (8 bytes, union = 32 bytes = MOUSEINPUT size)
// Total: 40 bytes
const INPUT_SIZE         = 40;
const KEYEVENTF_KEYUP    = 0x0002;
const KEYEVENTF_UNICODE  = 0x0004;
const KEYEVENTF_SCANCODE = 0x0008;
const VK_MENU            = 0xA4;  // Alt
const SC_TAB             = 0x0F;  // scan code TAB
const SC_RETURN          = 0x1C;  // scan code ENTER

function makeKeyInput(wVk, wScan, dwFlags) {
  const buf = Buffer.alloc(INPUT_SIZE, 0);
  buf.writeUInt32LE(1,       0);   // type = INPUT_KEYBOARD
  buf.writeUInt16LE(wVk,     8);   // wVk
  buf.writeUInt16LE(wScan,   10);  // wScan
  buf.writeUInt32LE(dwFlags, 12);  // dwFlags
  return buf;
}

function tapScan(sc) {
  const buf = Buffer.concat([
    makeKeyInput(0, sc, KEYEVENTF_SCANCODE),
    makeKeyInput(0, sc, KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP),
  ]);
  return SendInputFn(2, buf, INPUT_SIZE);
}

function tap(vk) {
  const buf = Buffer.concat([
    makeKeyInput(vk, 0, 0),
    makeKeyInput(vk, 0, KEYEVENTF_KEYUP),
  ]);
  return SendInputFn(2, buf, INPUT_SIZE);
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function typeText(text) {
  for (const char of text) {
    const code = char.charCodeAt(0);
    const buf = Buffer.concat([
      makeKeyInput(0, code, KEYEVENTF_UNICODE),
      makeKeyInput(0, code, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP),
    ]);
    SendInputFn(2, buf, INPUT_SIZE);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
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

    // 1. Find game window
    const hwnd = FindWindowW(null, 'PokeXGames');
    if (!hwnd) return { success: false, error: 'Abra o jogo antes de executar o auto-login.' };

    // 2. Restore if minimized
    if (IsIconic(hwnd)) ShowWindow(hwnd, 9);

    // 3. Focus: attach to foreground thread + Alt trick + SetForegroundWindow
    const fg       = GetForegroundWindow();
    const fgThread = GetWindowThreadProcessId(fg, null);
    const myThread = GetCurrentThreadId();

    if (fgThread !== myThread) AttachThreadInput(fgThread, myThread, true);
    tap(VK_MENU);
    BringWindowToTop(hwnd);
    SetForegroundWindow(hwnd);
    if (fgThread !== myThread) AttachThreadInput(fgThread, myThread, false);

    // 4. Aguarda foco transferir + delay configurado
    await sleep(Math.max(delay, 200));

    if (koffi.address(GetForegroundWindow()) !== koffi.address(hwnd)) {
      return { success: false, error: 'Não foi possível focar a janela do jogo.' };
    }

    // 5. Digita credenciais via SendInput
    typeText(account.username);
    await sleep(80);
    tapScan(SC_TAB);
    await sleep(80);
    typeText(password);
    await sleep(80);
    tapScan(SC_RETURN);

    return { success: true };
  });
};
