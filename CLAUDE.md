# PxG Helper — Contexto do Projeto

## O que é
Aplicativo desktop Windows feito com Electron. Helper para jogadores com:
- Task list diária (marcar feito/não feito, persistida localmente)
- Launcher (abre o jogo pelo caminho do .exe)
- Auto-login (foca janela do jogo via WScript.Shell.AppActivate + cola credenciais via clipboard + SendKeys)

## Versão atual: 0.0.72

## Stack
- **Electron 41** — framework desktop
- **HTML + CSS + JS vanilla** — sem framework de UI
- **electron-store** — persistência local (JSON no AppData)
- **electron-reload** — hot reload em dev
- **safeStorage (Electron)** — criptografia de senha via DPAPI do Windows
- **PowerShell WScript.Shell** — foco de janela (AppActivate) + input (Set-Clipboard + SendKeys)

## Estrutura de arquivos
```
pxg-helper/
├── CLAUDE.md
├── package.json
├── src/
│   ├── main/
│   │   ├── index.js              # app init + createWindow
│   │   ├── preload.js            # ponte segura Main <-> Renderer via contextBridge
│   │   ├── store.js              # instância do electron-store (compartilhada)
│   │   └── handlers/
│   │       ├── window.js         # minimize, maximize, close
│   │       ├── tasks.js          # tasks:get/add/toggle/delete
│   │       ├── accounts.js       # accounts:get/add/delete/reorder
│   │       ├── launcher.js       # launcher:getPath/browse/launch
│   │       ├── autologin.js      # autologin:runForAccount
│   │       └── config.js         # credentials:getDelay/setDelay, config:getDataPath/openDataFolder
│   └── renderer/
│       ├── index.html            # estrutura da UI, páginas, navegação
│       ├── app.js                # utils globais: toggleSidebar, navigate, setStatus, escapeHtml
│       ├── styles/
│       │   ├── variables.css     # :root CSS variables + reset
│       │   ├── layout.css        # titlebar, hamburger, sidebar, content, pages
│       │   ├── components.css    # inputs, buttons, cards, slider, status-msg
│       │   ├── tasks.css         # task list e itens
│       │   └── accounts.css      # account cards e config rows
│       └── modules/
│           ├── tasks.js          # loadTasks, renderTasks, addTask, toggleTask, deleteTask
│           ├── accounts.js       # loadAccounts, render, drag-drop, runAutoLoginFor, form
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
- Para expor uma função nova ao Renderer → registra no `preload.js`

## Persistência de dados
Usa `electron-store` (`src/main/store.js`). Arquivo em:
```
C:\Users\<usuario>\AppData\Roaming\pxg-helper\config.json
```

Estrutura do store:
```json
{
  "tasks": [
    { "id": 1234567890, "title": "Fazer dungeon", "done": false, "createdAt": "..." }
  ],
  "gamePath": "C:\\Games\\PxG\\game.exe",
  "accounts": [
    { "id": 1234567890, "name": "Main", "username": "user@email.com", "password": "<base64 DPAPI>" }
  ],
  "loginDelay": 3000
}
```

## Como o Auto-Login funciona
1. Usuário abre o jogo e deixa a tela de login visível com o campo de usuário focado
2. Clica na conta desejada no Helper
3. O Main executa um script PowerShell via `child_process.exec`:
   - `Get-Process -Name 'pxgme'` — verifica se o jogo está aberto (exit 1 se não)
   - `WScript.Shell.AppActivate('PokeXGames')` — foca a janela do jogo (exit 2 se falhar)
   - `Set-Clipboard` + `SendKeys('^v')` — cola username via Ctrl+V
   - `SendKeys('{TAB}')` — vai pro campo de senha
   - `Set-Clipboard` + `SendKeys('^v')` — cola senha via Ctrl+V
   - `SendKeys('{ENTER}')` — confirma login
4. O delay configurável define quanto tempo aguardar antes de começar

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
4. Atualizar HTML/CSS se precisar de nova UI

## Convenções do projeto
- IPC handlers nomeados como `dominio:acao` (ex: `tasks:add`, `launcher:launch`)
- Renderer nunca acessa Node.js diretamente — sempre via `window.api.*`
- Status messages: `setStatus('element-id', 'mensagem', 'ok' | 'err')` — definido em `app.js`
- Escape HTML sempre que renderizar dados do usuário: `escapeHtml()` em `app.js`
- Scripts do renderer carregados na ordem: `app.js` → `modules/*.js` → init inline no HTML

## Próximas features planejadas
- (a definir)
