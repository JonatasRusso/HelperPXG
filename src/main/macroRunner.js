const koffi = require('koffi');

const user32      = koffi.load('user32.dll');
const SendInputFn = user32.func('SendInput', 'uint32', ['uint32', 'void *', 'int32']);

const INPUT_SIZE        = 40;
const KEYEVENTF_KEYUP    = 0x0002;
const KEYEVENTF_SCANCODE = 0x0008;
const KEYEVENTF_EXTENDEDKEY = 0x0001;

// Hardware scan codes (Set 1) — jogos leem scan codes, não VK codes
const SCAN_MAP = {
  // Letras
  'Q': 0x10, 'W': 0x11, 'E': 0x12, 'R': 0x13, 'T': 0x14,
  'Y': 0x15, 'U': 0x16, 'I': 0x17, 'O': 0x18, 'P': 0x19,
  'A': 0x1E, 'S': 0x1F, 'D': 0x20, 'F': 0x21, 'G': 0x22,
  'H': 0x23, 'J': 0x24, 'K': 0x25, 'L': 0x26,
  'Z': 0x2C, 'X': 0x2D, 'C': 0x2E, 'V': 0x2F,
  'B': 0x30, 'N': 0x31, 'M': 0x32,
  // Números
  '1': 0x02, '2': 0x03, '3': 0x04, '4': 0x05, '5': 0x06,
  '6': 0x07, '7': 0x08, '8': 0x09, '9': 0x0A, '0': 0x0B,
  // Especiais
  'Space':     0x39, 'Enter':  0x1C, 'Escape': 0x01,
  'Tab':       0x0F, 'Backspace': 0x0E,
  'F1':  0x3B, 'F2': 0x3C, 'F3':  0x3D, 'F4':  0x3E,
  'F5':  0x3F, 'F6': 0x40, 'F7':  0x41, 'F8':  0x42,
  'F9':  0x43, 'F10': 0x44, 'F11': 0x57, 'F12': 0x58,
  // Setas (extended)
  'Up':    0x48, 'Down':  0x50, 'Left': 0x4B, 'Right': 0x4D,
  'Home':  0x47, 'End':   0x4F, 'PageUp': 0x49, 'PageDown': 0x51,
  'Delete': 0x53, 'Insert': 0x52,
  // Numpad
  'Numpad0': 0x52, 'Numpad1': 0x4F, 'Numpad2': 0x50, 'Numpad3': 0x51,
  'Numpad4': 0x4B, 'Numpad5': 0x4C, 'Numpad6': 0x4D,
  'Numpad7': 0x47, 'Numpad8': 0x48, 'Numpad9': 0x49,
};

// Teclas que precisam do flag EXTENDEDKEY
const EXTENDED_KEYS = new Set(['Up','Down','Left','Right','Home','End','PageUp','PageDown','Delete','Insert']);

function makeKeyInput(wVk, wScan, dwFlags) {
  const buf = Buffer.alloc(INPUT_SIZE, 0);
  buf.writeUInt32LE(1, 0);
  buf.writeUInt16LE(wVk, 8);
  buf.writeUInt16LE(wScan, 10);
  buf.writeUInt32LE(dwFlags, 12);
  return buf;
}

function sendKey(keyName) {
  const sc = SCAN_MAP[keyName];
  if (sc === undefined) return;
  const ext = EXTENDED_KEYS.has(keyName) ? KEYEVENTF_EXTENDEDKEY : 0;
  SendInputFn(2, Buffer.concat([
    makeKeyInput(0, sc, KEYEVENTF_SCANCODE | ext),
    makeKeyInput(0, sc, KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP | ext),
  ]), INPUT_SIZE);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const running = new Map(); // id -> cancel()

async function executeMacro(macro, onStateChange) {
  if (running.has(macro.id)) {
    console.log(`[macro] executeMacro ignorado — id=${macro.id} já está no map running`);
    return;
  }

  let cancelled = false;
  const instanceId = Date.now();
  console.log(`[macro] executeMacro START id=${macro.id} instance=${instanceId}`);
  running.set(macro.id, () => {
    console.log(`[macro] cancel() chamado id=${macro.id} instance=${instanceId}`);
    cancelled = true;
  });
  onStateChange?.(macro.id, 'running');

  const runOnce = async () => {
    for (let i = 0; i < macro.steps.length; i++) {
      const step = macro.steps[i];
      if (cancelled) {
        console.log(`[macro] cancelado antes do step[${i}] (${step.type}:${step.key || step.ms+'ms'}) instance=${instanceId}`);
        return false;
      }
      console.log(`[macro] step[${i}] ${step.type}:${step.key || step.ms+'ms'} instance=${instanceId}`);
      if (step.type === 'key')  sendKey(step.key);
      if (step.type === 'wait') await sleep(step.ms);
    }
    return !cancelled;
  };

  try {
    const { type, value } = macro.loop;
    if (type === 'count') {
      for (let i = 0; i < value && !cancelled; i++) await runOnce();
    } else if (type === 'time') {
      const end = Date.now() + value * 1000;
      while (Date.now() < end && !cancelled) await runOnce();
    } else {
      while (!cancelled) await runOnce();
    }
  } finally {
    console.log(`[macro] executeMacro FINALLY id=${macro.id} instance=${instanceId} cancelled=${cancelled}`);
    running.delete(macro.id);
    onStateChange?.(macro.id, 'stopped');
  }
}

function stopMacro(id) {
  console.log(`[macro] stopMacro id=${id} isRunning=${running.has(id)}`);
  running.get(id)?.();
}
function isRunning(id)  { return running.has(id); }

module.exports = { executeMacro, stopMacro, isRunning };
