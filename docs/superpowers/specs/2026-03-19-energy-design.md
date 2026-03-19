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
  "disabled": false,
  "type": "weekly",
  "serverSave": true
}
```

- `slug` — kebab-case identifier for default tasks. User-created tasks have `slug: null`. Used by seeder to avoid duplicates.
- `energyType` — `"blue"` | `"red"` | `null`. `null` = no energy interaction (existing tasks).
- `tiers` — ordered array of `{ name, energyCost }`. Empty array `[]` for non-energy tasks. Tier names drawn from: Rookie, Bronze, Silver, Gold, Platinum, Diamond, Ultra, Hyper, Master, Grand Master.
- `disabled` — when `true`, task is hidden from all views. Default `false`.
- All energy tasks use `type: "weekly"`, `serverSave: true` — required for `tasks:get` filter (`t.type`) and weekly reset at Monday 7:40 AM BRT.

### Characters — new fields

```json
{
  "favorite": false,
  "blueEnergy": { "current": 85, "max": 100, "regenMin": 30, "lastUpdated": 1711234567000 },
  "redEnergy":  { "current": 52, "max": 100, "regenMin": 60, "lastUpdated": 1711234567000 },
  "runCounts":      { "123456": 2 },
  "preferredTiers": { "123456": 1 }
}
```

- `favorite` — character appears on login card energy display. Default `false`.
- `blueEnergy` / `redEnergy` — user sets `current` manually in the edit panel. Backend sets `lastUpdated: Date.now()` on save. Defaults: `current: 0`, `max: 100`, `regenMin: 30` (blue) / `60` (red), `lastUpdated: Date.now()`.
- `runCounts` — `{ [taskId]: number }`. Times this character ran a blue task this week. Zeroed on weekly reset.
- `preferredTiers` — `{ [taskId]: tierIndex }`. Applies to both blue and red tasks. Missing key = no preference. Clicking ✓ with no preference and >1 tier opens a one-time picker that saves the result here.

### Computed energy (renderer)

Defined once in `src/renderer/app.js` alongside `adjustedDay` and `houseRemaining`:

```js
function computeEnergy(stored, now = Date.now()) {
  if (!stored) return null;
  const { current, max, regenMin, lastUpdated } = stored;
  const gained = Math.floor((now - lastUpdated) / (regenMin * 60000));
  return Math.min(max, Math.max(0, current + gained)); // clamp [0, max]
}
```

Called in renderer only — never stored back automatically. The `Math.max(0, ...)` guard handles clock skew (negative `gained`).

---

## Default Tasks (Seeding)

**New file:** `src/main/defaultTasks.js` — exports `DEFAULT_TASKS` array and `seedDefaultTasks(store, calcNextResetAt)` function.

Each entry in `DEFAULT_TASKS` is a complete task object with all required fields:
```js
{
  slug: 'forest-of-illusions',
  title: 'Forest of Illusions',
  type: 'weekly',
  serverSave: true,
  energyType: 'blue',
  tiers: [
    { name: 'Rookie', energyCost: 20 },
    { name: 'Bronze', energyCost: 20 },
    { name: 'Silver', energyCost: 32 },
    { name: 'Gold',   energyCost: 48 },
  ],
  disabled: false,
  done: false,
  image: null,
}
```

**Seeder function** (called from `src/main/index.js` after `app.whenReady`, before handlers register):

```js
function seedDefaultTasks(store, calcNextResetAt) {
  const tasks = store.get('tasks');
  const existingSlugs = new Set(tasks.map(t => t.slug).filter(Boolean));
  const missing = DEFAULT_TASKS.filter(t => !existingSlugs.has(t.slug));
  if (!missing.length) return;
  const now = Date.now();
  const seeded = missing.map((t, i) => ({
    ...t,
    id: now + i,
    nextResetAt: calcNextResetAt('weekly', true),
  }));
  store.set('tasks', [...tasks, ...seeded]);
}
```

`id: now + i` avoids collisions between seeded tasks. `calcNextResetAt` is imported from `handlers/tasks.js` (extract to a shared module or pass as argument).

### Blue energy tasks

The table below lists titles and tier energy costs in tier order (Rookie first). The full `{ name, energyCost }` objects are defined in `defaultTasks.js` — the table is illustrative. Tier level minimums will be added later.

| Title | Tier costs (Rookie → …) |
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

All red tasks have a single tier for now (more tiers may be added later via the edit UI).

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

**`checkResets` extension** — `checkResets` currently returns `{ tasks, changed, resetIds }`. To zero `runCounts` for blue tasks, the call site in `tasks:get` needs to know which reset tasks are blue. Change `checkResets` to also return the full reset task objects:

```js
// Return { tasks, changed, resetIds, resetTasks }
// resetTasks = array of task objects that were reset this cycle
```

In `tasks:get`, after resetting `taskState`, also zero `runCounts` for any character whose task was a blue reset:

```js
const blueResetIds = new Set(resetTasks.filter(t => t.energyType === 'blue').map(t => t.id));
const updatedChars = chars.map(c => {
  const newState = { ...c.taskState };
  const newRunCounts = { ...c.runCounts };
  resetIds.forEach(id => { if (c.taskIds.includes(id)) newState[String(id)] = false; });
  blueResetIds.forEach(id => { delete newRunCounts[String(id)]; });
  return { ...c, taskState: newState, runCounts: newRunCounts };
});
```

**`tasks:add`** — accept `energyType` (default `null`), `tiers` (default `[]`), `slug` (default `null`), `disabled` (default `false`).

**`tasks:delete`** — extend to also remove `runCounts[id]` and `preferredTiers[id]` from all characters (same loop that removes `taskState[id]`).

**New handler `tasks:setDisabled`** — `(_, id, disabled)` → sets `task.disabled` on the matching task. Returns full updated tasks array (filtered by `t.type` as usual).

### New: `src/main/handlers/energy.js`

All handlers read `store.get('tasks')` to resolve `tiers[tierIndex].energyCost` — the energy cost lives on the task, not the character.

| Handler | Args (after `_event`) | Action |
|---|---|---|
| `energy:runTask` | `characterId, taskId, tierIndex` | Reads task from store → gets `tiers[tierIndex].energyCost`. Checks `blueEnergy.current + regen >= cost` (using server-side regen calc). If insufficient: silent no-op, return unchanged chars. Else: deduct cost, update `blueEnergy.current` and `lastUpdated`, increment `runCounts[taskId]`. Returns updated characters array. |
| `energy:runRedTask` | `characterId, taskId, tierIndex` | Same as above but deducts from `redEnergy`, sets `taskState[String(taskId)] = true`. Returns updated characters. |

Both handlers clamp `current` to `Math.max(0, current - cost)`.

**Server-side regen calc** (in `energy.js`):
```js
function serverComputeEnergy(stored) {
  if (!stored) return 0;
  const { current, max, regenMin, lastUpdated } = stored;
  const gained = Math.floor((Date.now() - lastUpdated) / (regenMin * 60000));
  return Math.min(max, Math.max(0, current + gained));
}
```

`energy:setCharacter` is **removed** — energy fields are saved via `characters:setInfo` only (single write path).

### Modified: `src/main/handlers/characters.js`

**`characters:add`** — include in new character defaults:
```js
favorite: false,
blueEnergy: null,
redEnergy: null,
runCounts: {},
preferredTiers: {},
```

**`characters:setInfo`** — accept and persist `favorite`, `blueEnergy`, `redEnergy`, `preferredTiers`. When `blueEnergy` or `redEnergy` is provided, the backend forcibly overwrites `lastUpdated` regardless of what the renderer sends:

```js
if (data.blueEnergy) patch.blueEnergy = { ...data.blueEnergy, lastUpdated: Date.now() };
if (data.redEnergy)  patch.redEnergy  = { ...data.redEnergy,  lastUpdated: Date.now() };
```

For `preferredTiers`: the renderer sends the complete updated map; the backend stores it as-is (no server-side merge needed). `preferredTiers` is **never auto-cleared by the weekly reset** — tier preferences persist indefinitely until the user changes them.

### Modified: `src/main/preload.js`

```js
setDisabledTask: (id, disabled)              => ipcRenderer.invoke('tasks:setDisabled', id, disabled),
runTask:         (charId, taskId, tierIndex) => ipcRenderer.invoke('energy:runTask', charId, taskId, tierIndex),
runRedTask:      (charId, taskId, tierIndex) => ipcRenderer.invoke('energy:runRedTask', charId, taskId, tierIndex),
```

---

## Renderer — Tasks Page

### Sub-tabs

`index.html` — inside `#page-tasks`, add tab bar above existing content:
```html
<div class="task-tab-bar">
  <button class="task-tab active" data-tab="all"  onclick="switchTaskTab('all')">Todas</button>
  <button class="task-tab"        data-tab="blue" onclick="switchTaskTab('blue')">🔵 Azul</button>
  <button class="task-tab"        data-tab="red"  onclick="switchTaskTab('red')">🔴 Vermelha</button>
</div>
```

**Todas tab** — renders only tasks where `energyType === null` (non-energy tasks). The task counter (`X/Y`) is calculated from this filtered subset only, not the full tasks array.

**Azul / Vermelha tabs** (`tasks.js` — `switchTaskTab`, `renderEnergyTab`):
- Character selector dropdown populated from `characters` module-level array. Default selection: first character in the array. Selection persists while the tab is active; resets to first on page reload.
- Lists non-disabled energy tasks of the selected type
- Each row: task title + tier chips:
  ```
  Forest of Illusions
  [ Rookie 20⚡ ]  [ Bronze 20⚡ ]  [ Silver 32⚡ ]  [● Gold 48⚡ ]
  ```
  `●` = character's current `preferredTiers[taskId]`. Clicking a chip updates `preferredTiers` for the selected character via `window.api.setCharacterInfo({ id, preferredTiers: { ...existing, [taskId]: newIndex } })`.

### Task Config — add/disable

Default tasks (with `slug`): replace 🗑 delete button with "Desativar" toggle. Calls `window.api.setDisabledTask(id, true)`.

"Mostrar desativadas" button below list expands a section of disabled tasks with "Reativar" button each. Calls `window.api.setDisabledTask(id, false)`.

Task creation form gains:
- `energyType` select: `Nenhuma / 🔵 Azul / 🔴 Vermelha`
- When energyType ≠ Nenhuma: dynamic tier list (add/remove rows; each row: tier name select + cost number input)

---

## Renderer — Character Edit Panel (`characters.js`)

New **Energia** section in `openCharEdit`:

```
─── Energia ───────────────────────────
🔵 Azul    Atual [85]  Máx [100]  Regen [30] min
🔴 Vermelha  Atual [52]  Máx [100]  Regen [60] min
───────────────────────────────────────
⭐ Favorito na conta  [ checkbox ]
```

Input IDs: `energy-blue-current-{id}`, `energy-blue-max-{id}`, `energy-blue-regen-{id}` (same pattern for red). `favorite` checkbox: `energy-favorite-{id}`.

Saved via the existing `charSaveAll` function in `characters.js` (already used for level/clan/bg/taskIds). Extend it to also collect energy fields and `favorite`, then call `window.api.setCharacterInfo({ ..., blueEnergy, redEnergy, favorite, preferredTiers })`. Backend sets `lastUpdated` server-side.

---

## Renderer — Character Card (Personagens)

**Energy badge** — always visible on `.char-card` (below name bar or in bottom bar):
```
🔵 85  🔴 52
```
Values from `computeEnergy(c.blueEnergy)` and `computeEnergy(c.redEnergy)`. Hidden individually if `null`. Applies `.energy-full` class (glow) when value equals `c.blueEnergy.max` / `c.redEnergy.max`.

**Blue task thumbnails** (in `.char-card-hover`):
- ⏫ icon overlaid on thumb when `(c.runCounts?.[taskId] ?? 0) < 2`
- ✓ run button per thumb; disabled (greyed, `title="Energia insuficiente"`) when:
  - `c.blueEnergy === null` (energy not configured for this character), OR
  - computed blue energy < tier cost (insufficient energy)
- On ✓ click:
  1. If `preferredTiers[taskId]` is set → call `window.api.runTask(charId, taskId, tierIndex)` immediately
  2. Else if task has >1 tier → open tier picker modal → on confirm: save preferred via `setCharacterInfo`, then call `runTask`
  3. Else (single tier) → call `runTask(charId, taskId, 0)` directly
- After response: update `characters` array, call `loadAccounts()` to sync login cache, re-render

**Red task thumbnails** — existing checkbox behaviour. On check (false→true):
- If task has >1 tier → tier picker modal (same modal component)
- Calls `window.api.runRedTask(charId, taskId, tierIndex)`
- After response: update `characters` array, call `loadAccounts()`, re-render
- On uncheck → calls existing `characters:toggleTask`. **Energy is not refunded** — this is intentional; energy is spent on the action, not the checkbox state.

---

## Renderer — Login Card (Accounts)

Per favorite character of the account (characters with `favorite: true`), one energy row:
```
🔴 85/100  🔵 52/100
```
On hover: row dims, character name shown (tooltip via `title` attribute or inline label).

Hidden if account has no favorites, or favorites have no energy configured (`blueEnergy === null && redEnergy === null`).

`loginCharacters` cache in `accounts.js` used — same `computeEnergy()` from `app.js`. Cache is refreshed by calling the global `loadAccounts()` (defined in `accounts.js`, available globally because scripts load in order) from `characters.js` after any `runTask` / `runRedTask` / `charSaveAll` — the same pattern already used by `houses.js`. `serverComputeEnergy` in `energy.js` duplicates the renderer's `computeEnergy` math intentionally — main process cannot import renderer code.

---

## New Files

| File | Purpose |
|---|---|
| `src/main/defaultTasks.js` | `DEFAULT_TASKS` array + `seedDefaultTasks(store, calcNextResetAt)` |
| `src/main/handlers/energy.js` | `energy:runTask`, `energy:runRedTask` |
| `src/renderer/styles/energy.css` | Energy badge, tier chips, run button, full-glow, login row styles |

## Modified Files

| File | Change |
|---|---|
| `src/main/index.js` | Call `seedDefaultTasks`; register energy handlers |
| `src/main/handlers/tasks.js` | `checkResets` returns `resetTasks`; zero `runCounts` for blue resets; `tasks:add` accepts energy fields; `tasks:delete` prunes `runCounts`+`preferredTiers`; new `tasks:setDisabled` |
| `src/main/handlers/characters.js` | New defaults on `characters:add`; `characters:setInfo` accepts `favorite`, `blueEnergy`, `redEnergy`, `preferredTiers` |
| `src/main/preload.js` | Expose `setDisabledTask`, `runTask`, `runRedTask` |
| `src/renderer/app.js` | Add `computeEnergy()` helper |
| `src/renderer/index.html` | Task sub-tabs markup; `energy.css` link; `energy.js` script tag (if split) |
| `src/renderer/modules/tasks.js` | Sub-tab switching; `renderEnergyTab`; tier chip preferred-tier logic; disable/reactivate in Config |
| `src/renderer/modules/characters.js` | Energy badge on card; ✓ run button + ⏫ icon on blue thumbs; tier picker modal; energy section in edit panel; `loadAccounts()` call after mutations |
| `src/renderer/modules/accounts.js` | Favorite character energy rows on login card |
