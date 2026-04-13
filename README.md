# PxG Helper

Helper desktop para jogadores de PokeXGames. Gerencia tasks diárias, personagens, contas e muito mais — tudo salvo localmente, sem servidor.

## Download

Baixe o instalador na página de [Releases](../../releases/latest).

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
- Cadastro de múltiplas contas
- Auto-login: foca a janela do jogo e digita usuário + senha automaticamente via Win32
- Credenciais armazenadas criptografadas (DPAPI do Windows)
- Badge de VIP com countdown de dias restantes por conta

### Houses
- Rastreamento de bid de houses com countdown até o próximo server save
- Marcação de CP separado

### Configurações
- Caminho do executável do jogo com botão de launch
- Delay configurável antes do auto-login

---

## Instalação

1. Baixe o arquivo `PxG Helper Setup 1.0.0.exe` em [Releases](../../releases/latest)
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
