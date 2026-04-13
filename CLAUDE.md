# PxG Helper — Contexto do Projeto

## O que é
Aplicativo desktop Windows feito com Electron. Helper para jogadores com:
- Task list diária (marcar feito/não feito, persistida localmente)
- Launcher (abre o jogo pelo caminho do .exe)
- Auto-login (foca janela do jogo via Win32 API + digita credenciais via SendInput)
- Gerenciamento de personagens (clã, level, background, energia azul/vermelha)
- VIP tracking com countdown
- House BID tracking com countdown
- Sistema de energia (blue/red, tiers, run count, regen)

## Versão atual: 0.9

## Stack
- **Electron 41** — framework desktop
- **HTML + CSS + JS vanilla** — sem framework de UI
- **electron-store** — persistência local (JSON no AppData)
- **electron-reload** — hot reload em dev
- **safeStorage (Electron)** — criptografia de senha via DPAPI do Windows
- **koffi** — FFI para chamadas diretas à Win32 API (user32.dll, kernel32.dll)

## Estrutura de arquivos
```
pxg-helper/
├── CLAUDE.md
├── package.json
├── src/
│   ├── main/
│   │   ├── index.js              # app init + createWindow
│   │   ├── preload.js            # ponte segura Main <-> Renderer via contextBridge
│   │   ├── store.js              # instância do electron-store (com schema)
│   │   ├── imageStore.js         # save/delete/toUrl para imagens em userData/images/
│   │   ├── defaultTasks.js       # seed de tasks padrão
│   │   └── handlers/
│   │       ├── window.js         # minimize, maximize, close
│   │       ├── tasks.js          # tasks:get/add/toggle/delete/reorder/setImage/setDisabled
│   │       ├── accounts.js       # accounts:get/add/delete/reorder/setVip
│   │       ├── characters.js     # characters:get/add/delete/setTasks/toggleTask/setInfo/pickImageData
│   │       ├── houses.js         # houses:set/delete/toggleCp
│   │       ├── energy.js         # energy:runTask/runRedTask
│   │       ├── launcher.js       # launcher:getPath/browse/launch
│   │       ├── autologin.js      # autologin:runForAccount (koffi/WinAPI)
│   │       └── config.js         # credentials:getDelay/setDelay, config:getDataPath/openDataFolder
│   └── renderer/
│       ├── index.html            # estrutura da UI, páginas, navegação
│       ├── utils/
│       │   ├── icons.js          # constantes SVG inline (ICON_ENERGY_BLUE, ICON_HIDE, etc.)
│       │   ├── dom.js            # toggleSidebar, navigate, setStatus, escapeHtml, modais
│       │   ├── clan-ui.js        # CLANS, clanDropdownHtml, toggleClanDropdown, selectClan
│       │   ├── char-ui.js        # BG_FILES, LEVEL_TAGS, levelTagsHtml, bgPickerHtml, pickCustomBg
│       │   ├── time.js           # RESET_OFFSET, adjustedDay, houseRemaining
│       │   └── energy.js         # computeEnergy
│       ├── styles/
│       │   ├── variables.css     # :root CSS variables + reset
│       │   ├── layout.css        # titlebar, hamburger, sidebar, content, pages
│       │   ├── components.css    # inputs, buttons, cards, slider, status-msg
│       │   ├── tasks.css         # task list e itens
│       │   ├── accounts.css      # account cards e config rows
│       │   ├── characters.css    # char grid, cards, edit panel
│       │   ├── houses.css        # house list e form
│       │   └── energy.css        # energy tabs, tiers, badges
│       └── modules/
│           ├── tasks.js          # loadTasks, renderTasks, energy tabs, drag-drop
│           ├── accounts.js       # loadAccounts, render login/config, auto-login, energy refresh
│           ├── characters.js     # loadCharacters, render, edit panel, energy dropdown
│           ├── houses.js         # loadHouses, render, add/delete
│           └── config.js         # loadConfig, browseGame, launchGame, updateDelay
└── resources/
    └── icon.ico
```

## Arquitetura Electron

### Dois processos separados
- **Main** (`src/main/`) — Node.js puro, acessa SO, não tem DOM
- **Renderer** (`src/renderer/`) — Chromium, tem DOM, não acessa SO diretamente

### Comunicação entre processos (IPC)
```
Renderer: window.api.addTask('titulo')
    → preload.js: ipcRenderer.invoke('tasks:add', 'titulo')
        → handlers/tasks.js: ipcMain.handle('tasks:add', ...)
            → retorna dados de volta pelo mesmo caminho
```

### Regra de ouro
- Qualquer coisa que acessa o sistema (arquivos, processos, teclado) → **Main**
- Qualquer coisa visual → **Renderer**
- Para expor uma função nova ao Renderer → registra no `src/main/preload.js`

## Persistência de dados
Usa `electron-store` (`src/main/store.js`). Arquivo em:
```
C:\Users\<usuario>\AppData\Roaming\pxg-helper\config.json
```

Imagens personalizadas (tasks e personagens) são salvas como arquivos em:
```
C:\Users\<usuario>\AppData\Roaming\pxg-helper\images\
```
O store guarda apenas o filename (ex: `1234567890.png`). Handlers convertem para `file:///` URL antes de retornar ao Renderer. Valores legados `data:image/...` são aceitos transparentemente.

Estrutura do store:
```json
{
  "tasks": [
    {
      "id": 1234567890, "title": "Fazer dungeon", "type": "daily",
      "serverSave": false, "energyType": null, "tiers": [],
      "slug": null, "disabled": false, "done": false,
      "nextResetAt": 1234567890, "image": "1234567890.png"
    }
  ],
  "gamePath": "C:\\Games\\PxG\\game.exe",
  "accounts": [
    { "id": 1234567890, "name": "Main", "username": "user@email.com",
      "password": "<base64 DPAPI>", "vipDays": 30, "vipAddedAt": 1234567890 }
  ],
  "loginDelay": 3000,
  "characters": [
    {
      "id": 1234567890, "accountId": 1234567890, "name": "Char", "server": "Guilda",
      "clan": "volcanic", "level": "300+", "bg": "personagem-bg-01.png", "image": null,
      "taskIds": [], "taskState": {}, "house": { "bidDay": 15, "value": 5000, "cpSeparated": false },
      "favorite": false, "blueEnergy": null, "redEnergy": null,
      "runCounts": {}, "preferredTiers": {}, "hiddenMDs": {},
      "mdOrder": { "blue": [], "red": [] }, "nwLevel": null
    }
  ]
}
```

## Como o Auto-Login funciona
1. Usuário abre o jogo e deixa a tela de login visível com o campo de usuário focado
2. Clica na conta desejada no Helper
3. O Main usa koffi para chamar Win32 diretamente:
   - `FindWindowW('PokeXGames')` — localiza a janela do jogo
   - `ShowWindow(hwnd, 9)` — restaura se minimizada
   - `AttachThreadInput` + `tap(VK_MENU)` + `SetForegroundWindow` — foca a janela contornando restrições do Windows
   - `SendInput` com `KEYEVENTF_UNICODE` — digita username caractere a caractere
   - `SendInput` com scan code TAB — troca de campo
   - `SendInput` com `KEYEVENTF_UNICODE` — digita senha
   - `SendInput` com scan code ENTER — confirma login
4. O delay configurável define quanto tempo aguardar antes de começar a digitar

## Segurança de credenciais
- Senha nunca exibida de volta na UI após salvar
- Criptografada com `safeStorage.encryptString()` antes de gravar no JSON
- `safeStorage` usa DPAPI do Windows — só descriptografa na mesma máquina e usuário Windows

## Scripts disponíveis
```bash
npm start        # roda em dev (com --dev flag, ativa hot reload)
npm run build    # gera instalador .exe em dist/
```

## Hot reload (dev)
Mudanças em qualquer arquivo de `src/renderer/` → recarrega a janela automaticamente.
Mudanças em `src/main/` → reinicia o processo inteiro.

## Como adicionar uma nova feature
1. Criar handler em `src/main/handlers/<dominio>.js` e registrar em `src/main/index.js`
2. Expor no `src/main/preload.js`
3. Implementar lógica em `src/renderer/modules/<modulo>.js`
4. Utilitários de UI compartilhados → `src/renderer/utils/`
5. Atualizar HTML/CSS se precisar de nova UI

## Convenções do projeto
- IPC handlers nomeados como `dominio:acao` (ex: `tasks:add`, `launcher:launch`)
- Renderer nunca acessa Node.js diretamente — sempre via `window.api.*`
- Status messages: `setStatus('element-id', 'mensagem', 'ok' | 'err')` — em `utils/dom.js`
- Escape HTML sempre que renderizar dados do usuário: `escapeHtml()` em `utils/dom.js`
- Handlers que retornam personagens usam `withImageUrls()` de `imageStore.js`
- Scripts do renderer carregados na ordem: `utils/*.js` → `modules/*.js` → init inline no HTML

## Próximas features planejadas
- (a definir)
