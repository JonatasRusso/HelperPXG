# Characters Feature — Spec

## Goal

Add a "Personagens" tab (2nd in sidebar) where each account's characters are displayed as cards. Each character tracks its own task completion state independently. Characters are created via the existing "+ Adicionar personagem" button in the Config account accordion.

---

## Version

Bumps to **0.0.71**.

---

## Data Model

New store key: `characters: []`

```json
{
  "id": 1234567890,
  "accountId": 9876543210,
  "name": "Gandalf",
  "image": "data:image/png;base64,...",
  "server": "Elysia",
  "clan": "Dragons",
  "level": 350,
  "taskIds": [111, 222, 333],
  "taskState": { "111": false, "222": true }
}
```

- `accountId` — links character to an account
- `taskIds` — IDs of tasks assigned to this character (shown on hover, max 7 displayed)
- `taskState` — per-task done/undone; keys are task IDs as strings
- `image` — base64 data URL (same pattern as task images); optional, may be absent
- `clan` — clan name string; optional, may be absent or empty string
- Missing keys in `taskState` default to `false`
- When `image` is absent, the avatar area renders a gray circle placeholder with the first letter of the character's name
- When `taskIds` is empty, hover reveals only the ✏ edit icon (no task thumbnails)

---

## Level Badge Colors

| Level | Color |
|---|---|
| < 300 | gray `#888` |
| 300–399 | green `#4caf50` |
| 400–499 | blue `#2196f3` |
| 500–599 | orange `#ff9800` |
| 600+ | red `#e85d5d` |

---

## Task Reset Integration

`checkResets` in `src/main/handlers/tasks.js` must be updated to also return the set of task IDs that were reset:

```js
// returns { tasks, changed, resetIds: Set<number> }
function checkResets(tasks) { ... }
```

In `tasks:get`, after calling `checkResets`, if `resetIds` is non-empty, load `store.get('characters')` and for each character set `taskState[id] = false` for every `id` in `resetIds` that is present in `character.taskIds`. Persist updated characters to store.

---

## IPC Handlers (`characters.js`)

| Channel | Description |
|---|---|
| `characters:get` | Returns all characters (image included) |
| `characters:add` | Accepts `{ accountId, name, server, clan, level }`, returns all characters |
| `characters:delete` | Accepts `id`, returns all characters |
| *(accounts:delete modified)* | When an account is deleted, also delete all characters with matching `accountId` |
| *(tasks:delete modified)* | When a task is deleted, remove its ID from `taskIds` and its key from `taskState` in all characters |
| `characters:setImage` | Opens file dialog, saves base64 to character, returns all characters |
| `characters:setTasks` | Accepts `{ id, taskIds[] }`, updates `taskIds`, removes keys from `taskState` not in new `taskIds`, returns all |
| `characters:toggleTask` | Accepts `{ id, taskId }`, flips `taskState[taskId]`, returns all characters |
| `characters:setInfo` | Accepts `{ id, level, clan }`, updates both fields, returns all characters |

---

## UI

### Sidebar

New nav button between Login and Tasks:
```
🧙 Personagens
```

### Characters Page

Header: "Personagens"

Cards are displayed in a responsive grid (wrap as needed). Each card is **175×175 px**.

**Card default state:**
- Full-card background: character image (cover) or dark placeholder if no image
- Clicking the card image/background opens file picker to set/replace avatar
- Bottom overlay (always visible, semi-transparent dark gradient):
  - Name (bold)
  - Level badge (colored per level range)
  - Clan name (muted, if set)
  - Server (muted)

**Card hover state:**
- Background darkens (overlay `rgba(0,0,0,0.55)`)
- Shows up to **7 task thumbnails** (first 7 of `taskIds`), each 32×32 px with a checkbox-style state indicator:
  - Gray border + no check = not done
  - Green border + ✓ = done
  - Clicking a thumbnail toggles `taskState` for that task
- **8th slot** is always a ✏ pencil icon button → opens the edit panel for that character
- If fewer than 7 tasks assigned, remaining slots are empty (no placeholder)

**Edit panel (accordion, opens below card row):**
- Level input (number)
- Clan input (text)
- Task checklist: all existing tasks listed with checkboxes to assign/unassign
- "Excluir personagem" danger button

**Empty state**: "Nenhum personagem cadastrado. Adicione em Config."

### Config Page — Account Accordion

Replace `alert('Em breve')` on "+ Adicionar personagem" button with a real inline form:
- Input: Nome
- Input: Servidor
- Input: Clã (text, optional)
- Input: Level (number)
- Buttons: Salvar / Cancelar

Image is set after creation via the avatar click on the Characters page.

The form captures `accountId` from the surrounding account context — `renderAccountsConfig` already has `a.id` in scope, so `accountId: a.id` is passed to `characters:add`.

---

## New Files

| File | Purpose |
|---|---|
| `src/main/handlers/characters.js` | All character IPC handlers |
| `src/renderer/modules/characters.js` | Characters page render + interactions |
| `src/renderer/styles/characters.css` | Card, badge, task thumbnail overlay styles |

## Modified Files

| File | Change |
|---|---|
| `src/main/index.js` | Register character handlers |
| `src/main/preload.js` | Expose character API |
| `src/main/store.js` | Add `characters: []` default |
| `src/main/handlers/tasks.js` | Reset `taskState` in characters on task reset |
| `src/renderer/index.html` | Add nav button, page section, characters.css link, characters.js script |
| `src/renderer/modules/accounts.js` | Replace "+ Adicionar personagem" alert with inline form; update `accounts:delete` to cascade-delete characters |
| `src/main/handlers/accounts.js` | `accounts:delete` also removes characters with matching `accountId` |
| `src/main/handlers/tasks.js` | `tasks:delete` also prunes `taskIds`/`taskState` in all characters |
| `package.json` + `CLAUDE.md` + sidebar label | Version → 0.0.71 |

---

## Notes

- `loadCharacters()` is called on navigation via the sidebar button `onclick`: `onclick="navigate('personagens'); loadCharacters()"` — consistent with the codebase pattern (no changes to `navigate()` in `app.js` needed).
- Character images are included in `characters:get` (base64 inline). Acceptable for expected scale (< 20 characters per user).

---

## Out of Scope

- Character reordering
- Multiple servers / server list management
- Task completion history
- Character-to-character comparison
- Clan management (adding/listing clans) — clan is a free-text field for now
