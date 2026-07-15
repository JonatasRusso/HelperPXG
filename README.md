# PxG Helper

Helper desktop para jogadores de PokeXGames. Gerencia tasks diárias, personagens, contas e muito mais — tudo salvo localmente, sem servidor.

## Download

Baixe o instalador na página de [Releases](../../releases/latest).

---

## Changelog

### v1.3
- **Seletor de tema** — escolha entre 5 temas visuais diretamente no Config (Amethyst Gold, Original, Darcula, Midnight Blue, Crimson Dark). A preferência é salva e aplicada automaticamente
- **Toggle "Pressionar Enter após login"** — opção na tela de Login para controlar se o auto-login pressiona Enter ao final. Desligado por padrão para evitar envio acidental de credenciais no chat

### v1.2
- **Sistema de macros** — crie macros com sequências de teclas e esperas, ative via hotkey global, configure loop por contagem, tempo ou infinito, e reordene steps com drag-and-drop

### v1.1
- **Auto-login sem Enter automático** — o login preenche usuário e senha sem pressionar Enter por padrão
- **Renomear conta inline** — clique no ícone de caneta ao lado do nome da conta, edite e pressione Enter para salvar

### v1.0
- Lançamento inicial

---

## Funcionalidades

### Tasks Diárias
- Lista de tasks com reset diário automático (baseado no server save)
- Marcar como feita/não feita, adicionar imagem personalizada por task
- Reordenação por drag-and-drop
- Tasks desabilitáveis por personagem

### Personagens
- Cadastro com clã, level, imagem e background personalizados
- Atribuição individual de tasks por personagem
- Rastreamento de energia azul e vermelha com tiers e contadores de run
- Favoritar personagens

### Login / Auto-Login
- Cadastro de múltiplas contas com renomeação inline
- Auto-login: foca a janela do jogo e digita usuário + senha automaticamente via Win32 (sem pressionar Enter — evita envio acidental de credenciais no chat caso o jogo já esteja logado)
- Credenciais armazenadas criptografadas (DPAPI do Windows)
- Badge de VIP com countdown de dias restantes por conta

### Houses
- Rastreamento de bid de houses com countdown até o próximo server save
- Marcação de CP separado

### Macros
- Crie sequências de teclas e esperas com nome e hotkey global
- Ative/pause via hotkey, controle de loop (vezes, tempo ou infinito)
- Reordenação de steps por drag-and-drop

### Configurações
- Seletor de tema visual (5 opções)
- Toggle para pressionar Enter após o auto-login
- Caminho do executável do jogo com botão de launch
- Delay configurável antes do auto-login

---

## Instalação

1. Baixe o arquivo `PxG Helper Setup 1.3.0.exe` em [Releases](../../releases/latest)
2. Execute o instalador
3. Abra o PxG Helper

> Requer Windows 10 ou superior.

---

## Segurança

Senhas nunca são exibidas após salvas. A criptografia usa `safeStorage` do Electron (DPAPI do Windows) — os dados só podem ser descriptografados na mesma máquina e usuário Windows onde foram salvos.

### Verificação de malware

O instalador de cada release é verificado pelo VirusTotal antes da publicação. O link com o resultado completo está disponível na descrição de cada release.

O código-fonte está público neste repositório para quem quiser auditar.

---

## Licença

[CC BY-NC-ND 4.0](LICENSE) — Você pode visualizar e compartilhar, mas **não pode modificar nem redistribuir** versões alteradas do programa.
