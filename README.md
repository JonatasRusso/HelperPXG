# PxG Helper

Helper para jogadores com Tasks, Launcher e Auto-Login.

## Setup

```bash
npm install
npm start          # rodar em dev
npm run build      # gerar .exe instalável
```

## Estrutura

```
src/
  main/
    index.js     # processo principal (Node/Electron) — IPC handlers
    preload.js   # bridge segura main <-> renderer
  renderer/
    index.html   # estrutura da UI
    style.css    # estilos
    app.js       # lógica da UI
```

## Features

- **Tasks** — adicionar, marcar como feita, deletar. Persistido em AppData.
- **Launcher** — selecionar .exe e abrir o jogo.
- **Auto-Login** — digita user → Tab → senha → Enter. Delay configurável.
  - Senha armazenada criptografada via `safeStorage` do Electron.

## Adicionar novas features

Cada feature nova segue o padrão:
1. Handler `ipcMain.handle('feature:action')` em `main/index.js`
2. Expose via `contextBridge` em `preload.js`
3. Chamada `window.api.action()` no renderer

## Dependências principais

- `electron-store` — persistência local
- `@nut-tree/nut-js` — simulação de teclado (auto-login)
- `electron safeStorage` — criptografia de credenciais
