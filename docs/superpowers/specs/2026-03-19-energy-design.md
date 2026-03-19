# Energy System — Design Spec

**Date:** 2026-03-19
**Project:** PxG Helper
**Status:** Approved

---

## Overview

Add blue and red energy tracking per character. Tasks of each type deduct energy on completion. Blue tasks track a weekly run count with a bonus-XP indicator (⏫ for first 2 runs). Red tasks lock for the week after one completion. Characters have configurable capacity and regen rate. Energy is displayed on character cards and login account cards (filtered to favorite characters).

---

## Data Model

### Tasks — new fields

```json
{
  "slug": "forest-of-illusions",
  "energyType": "blue",
  "tiers": [
    { "name": "Rookie", "energyCost": 20 },
    { "name": "Bronze", "energyCost": 20 },
    { "name": "Silver", "energyCost": 32 },
    { "name": "Gold",   "energyCost": 48 }
  ],
  "disabled": false
}
```

- `slug` — kebab-case identifier for default tasks. User-created tasks have `slug: null`. Used by seeder to avoid duplicates.
- `energyType` — `"blue"` | `"red"` | `null`. `null` = no energy interaction (existing tasks).
- `tiers` — ordered array of `{ name, energyCost }`. Empty array for non-energy tasks. Tier names drawn from: Rookie, Bronze, Silver, Gold, Platinum, Diamond, Ultra, Hyper, Master, Grand Master.
- `disabled` — when `true`, task is hidden from all views. Default `false`.

Blue tasks keep `type: "weekly"`, `serverSave: true` — the weekly reset zeroes `runCounts`.
Red tasks keep `type: "weekly"`, `serverSave: true` — same reset zeroes `taskState`.

### Characters — new fields

```json
{
  "favorite": false,
  "blueEnergy": { "current": 85, "max": 100, "regenMin": 30, "lastUpdated": 1711234567000 },
  "redEnergy":  { "current": 52, "max": 100, "regenMin": 60, "lastUpdated": 1711234567000 },
  "runCounts":    { "taskId": 2 },
  "preferredTiers": { "taskId": 1 }
}
```

- `favorite` — shown on login card energy display. Default `false`.
- `blueEnergy` / `redEnergy` — user sets `current` and `lastUpdated` is saved as `Date.now()` at that moment. `max` defaults to 100, `regenMin` defaults to 30 (blue) / 60 (red).
- `runCounts` — `{ [taskId]: number }`. How many times this character ran a blue task this week. Zeroed on weekly reset.
- `preferredTiers` — `{ [taskId]: tierIndex }`. Saved preferred tier index per blue task. Missing key = no preference set yet.

### Computed energy (renderer)

```js
function computeEnergy(stored, now = Date.now()) {
  if (!stored) return null;
  const { current, max, regenMin, lastUpdated } = stored;
  const gained = Math.floor((now - lastUpdated) / (regenMin * 60000));
  return Math.min(max, current + gained);
}
```

Called in renderer only — never stored back automatically.

---

## Default Tasks (Seeding)

**New file:** `src/main/defaultTasks.js` — exports `DEFAULT_TASKS` array.

**Seeder:** runs in `src/main/index.js` before handlers register, after `app.whenReady`:

```js
function seedDefaultTasks() {
  const tasks = store.get('tasks');
  const existingSlugs = new Set(tasks.map(t => t.slug).filter(Boolean));
  const toAdd = DEFAULT_TASKS.filter(t => !existingSlugs.has(t.slug));
  if (toAdd.length) store.set('tasks', [...tasks, ...toAdd]);
}
```

Each default task has `id: Date.now() + index` at seed time (to avoid collisions), `done: false`, `nextResetAt` computed via `calcNextResetAt('weekly', true)`.

### Blue energy tasks

| Title | Tiers (Rookie → …) |
|---|---|
| Rocket Hideout | 100 |
| Operation Radio | 92 |
| Mewtwo Strikes Back | 80 |
| Forest of Illusions | 20, 20, 32, 48 |
| Battle Tree House | 20, 24, 20 |
| Music Challenge | 20, 12 |
| Sylvester's Ferfetch'd | 4, 12, 20 |
| Ecruteak Maze | 10 |
| Fishing Competition | 20, 20, 40 |
| Photography Challenge | 36, 20, 20, 20, 20 |
| Sewers Infestation | 20, 24, 28, 32 |
| The Slowpoke Well Showdown | 76, 68, 70, 70 |
| Tour de Alto Mare | 20, 25, 60, 65 |
| Combat Art | 20 |
| The Call of the Megas | 40 |
| Cyber World | 58 |
| Dreams or Nightmares? | 20 |
| Fishing Cruise | 30, 42, 50 |
| Rocket Ambush | 32 |
| The Ultimate Challenge | 12, 16, 20, 24 |
| Whirl Cup | 44 |
| The Iron-Masked Marauder | 46 |

### Red energy tasks

All red tasks have a single tier (more tiers may be added later). All cost values are fixed.

| Title | Cost |
|---|---|
| The Red Gyarados | 52 |
| Battle: ??? | 52 |
| Battle: Alpha Ursaluna | 52 |
| Muchmoney and the runaway Precious | 40 |
| Below Zero | 40 |
| Dorabelle's Wrath | 52 |
| The Celestial Serpent | 52 |
| The Darkness | 40 |
| The Magma Insurgency | 40 |
| Defeat The Darkness | 52 |
| Johto Pokémon League | 100 |
| Battle: Alpha Hisuian Arcanine | 52 |
| Battle: Alpha Hisuian Electrode | 52 |
| Battle: Alpha Hisuian Typhlosion | 52 |
| Battle: Alpha Kleavor | 52 |
| Battle: Alpha Overqwill | 52 |
| Battle: Dark Celebi | 52 |
| Battle: Alpha Sneasler | 52 |
| Battle: Mecha Iron-Masked Marauder | 52 |

---

## Backend (Main Process)

### Modified: `src/main/handlers/tasks.js`

- `checkResets` already resets `taskState` on characters for weekly tasks. Extend it to also zero `runCounts` entries for any blue task that resets.
- `tasks:add` — accept `energyType`, `tiers`, `slug` (null for user-created).
- `tasks:toggle` — existing handler, unchanged (used only for red tasks via character task state).
- New handler `tasks:setDisabled` — `(_, id, disabled)` → sets `task.disabled` on the task, returns updated tasks.

### New: `src/main/handlers/energy.js`

Three handlers:

| Handler | Args | Action |
|---|---|---|
| `energy:setCharacter` | `characterId, { blueEnergy, redEnergy }` | Saves energy fields (current, max, regenMin) with `lastUpdated: Date.now()` |
| `energy:runTask` | `characterId, taskId, tierIndex` | Deducts `tiers[tierIndex].energyCost` from character's blue energy, increments `runCounts[taskId]`, saves `lastUpdated`. Silent no-op if character/task not found or energy insufficient (returns unchanged chars). Returns updated characters array. |
| `energy:runRedTask` | `characterId, taskId, tierIndex` | Deducts from red energy, sets `taskState[taskId] = true`. Returns updated characters. |

Both `energy:runTask` and `energy:runRedTask` clamp `current` at 0 (never negative).

`energy:setCharacter` merges partial updates — only fields provided are updated, existing fields preserved.

### Modified: `src/main/handlers/characters.js`

- `characters:add` — include `favorite: false`, `blueEnergy: null`, `redEnergy: null`, `runCounts: {}`, `preferredTiers: {}` in new character defaults.
- `characters:setInfo` — accept and persist `favorite`, `blueEnergy`, `redEnergy`. Energy patch: if provided, sets `lastUpdated: Date.now()`.

### Modified: `src/main/preload.js`

Expose new API methods:
```js
setDisabledTask:  (id, disabled) => ipcRenderer.invoke('tasks:setDisabled', id, disabled),
setCharacterEnergy: (id, data)   => ipcRenderer.invoke('energy:setCharacter', id, data),
runTask:          (charId, taskId, tierIndex) => ipcRenderer.invoke('energy:runTask', charId, taskId, tierIndex),
runRedTask:       (charId, taskId, tierIndex) => ipcRenderer.invoke('energy:runRedTask', charId, taskId, tierIndex),
```

---

## Renderer — Tasks Page

### Sub-tabs

`index.html` — inside `#page-tasks`, add a tab bar above the task list:
```html
<div class="task-tab-bar">
  <button class="task-tab active" data-tab="all"  onclick="switchTaskTab('all')">Todas</button>
  <button class="task-tab"        data-tab="blue" onclick="switchTaskTab('blue')">🔵 Azul</button>
  <button class="task-tab"        data-tab="red"  onclick="switchTaskTab('red')">🔴 Vermelha</button>
</div>
```

**Todas tab** — existing task list (non-energy tasks). Energy tasks hidden here.

**Azul / Vermelha tabs** (`tasks.js`):
- Character selector dropdown at top (populated from `characters` array)
- List of energy tasks of that type (non-disabled)
- Each task row shows tiers as clickable chips:
  ```
  Forest of Illusions
  [ Rookie 20⚡ ]  [ Bronze 20⚡ ]  [ Silver 32⚡ ]  [● Gold 48⚡ ]
  ```
  `●` marks the character's current `preferredTiers[taskId]`. Clicking a chip saves it as preferred for the selected character (calls `characters:setInfo` with updated `preferredTiers`).

### Task Config — add/disable

In Config, task list rows for default tasks (with `slug`) replace the 🗑 delete button with a toggle button "Desativar" / "Reativar".

"Mostrar desativadas" button below the task list expands a section showing disabled tasks with a "Reativar" button each.

Task creation form gains:
- `energyType` select: `Nenhuma / 🔵 Azul / 🔴 Vermelha`
- When energyType ≠ Nenhuma: dynamic tier list (add/remove rows, each with tier name select + cost input)

---

## Renderer — Character Edit Panel

New **Energia** section in `openCharEdit` (in `characters.js`):

```
─── Energia ──────────────────
🔵 Azul
  Atual [ 85 ]  Máx [ 100 ]  Regen [ 30 ] min
🔴 Vermelha
  Atual [ 52 ]  Máx [ 100 ]  Regen [ 60 ] min
──────────────────────────────
⭐ Favorito na conta  [ toggle ]
```

Saved via `characters:setInfo` along with existing fields. Energy `current` values saved with `lastUpdated = Date.now()` on the backend.

---

## Renderer — Character Card (Personagens)

**Energy display** — inside `.char-card`, always visible:
```
🔵 85  🔴 52
```
Values are `computeEnergy(c.blueEnergy)` and `computeEnergy(c.redEnergy)`. If `null` (not configured), icon hidden. When at max: icon gets a glow/highlight class.

**Blue task thumbnails** (in `.char-card-hover`):
- Each blue task thumb shows ⏫ icon when `runCounts[taskId] < 2`
- ✓ button always visible (disabled + tooltip if energy insufficient)
- Click ✓:
  - If `preferredTiers[taskId]` is set: calls `energy:runTask(charId, taskId, tierIndex)` directly
  - If not set and task has >1 tier: opens tier picker modal → on confirm saves preferred + runs
  - If single tier: runs directly
- After response: update local characters array, re-render card

**Red task thumbnails** — existing checkbox. On check (false→true):
- If task has >1 tier: tier picker modal
- Calls `energy:runRedTask(charId, taskId, tierIndex)`
- On uncheck: calls existing `characters:toggleTask` (no energy returned)

---

## Renderer — Login Card (Accounts)

**Per favorite character** of the account, one energy row:
```
🔴 85/100  🔵 52/100
```
On hover: row darkens, character name appears as tooltip or inline label.

Only characters with `favorite: true` appear. If no favorites or none have energy configured, section hidden.

`loginCharacters` cache (already in `accounts.js`) used — same `computeEnergy()` helper.

---

## New Files

| File | Purpose |
|---|---|
| `src/main/defaultTasks.js` | DEFAULT_TASKS array + seeder function |
| `src/main/handlers/energy.js` | `energy:setCharacter`, `energy:runTask`, `energy:runRedTask` |
| `src/renderer/styles/energy.css` | Energy display styles (character card, login card, tier chips) |

## Modified Files

| File | Change |
|---|---|
| `src/main/index.js` | Call seeder + register energy handlers |
| `src/main/handlers/tasks.js` | Extend checkResets to zero runCounts; tasks:add accepts energy fields; new tasks:setDisabled |
| `src/main/handlers/characters.js` | New defaults on add; setInfo accepts energy + favorite |
| `src/main/preload.js` | Expose new API methods |
| `src/renderer/index.html` | Task sub-tabs; energy.css link; energy.js script tag |
| `src/renderer/modules/tasks.js` | Sub-tab logic; energy tab with char selector + tier chips |
| `src/renderer/modules/characters.js` | Energy display on card; blue task ✓ button; tier picker modal; energy section in edit panel |
| `src/renderer/modules/accounts.js` | Energy rows per favorite character on login card |
