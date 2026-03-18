# Houses Feature — Design Spec

**Date:** 2026-03-18
**Project:** PxG Helper
**Status:** Approved

---

## Overview

Add a **Houses** tab to track monthly rent BID dates per character. Each character can own one house. A countdown icon appears on the Login page per account, reflecting the most urgent house. Both VIP and House counters use **7:40 AM** as the daily reset boundary.

---

## Data Model

Field `house` embedded on each character object in electron-store. Relation is 1 house per character.

```json
{
  "id": 1234,
  "accountId": 5678,
  "name": "Mago Principal",
  "house": {
    "bidDay": 3,
    "value": 9999,
    "cpSeparated": false
  }
}
```

- `bidDay` — integer **1–28** (capped at 28 to avoid month-length edge cases like Feb 29). The "Dia do BID" number input must use `min="1" max="28"`.
- `value` — integer, house value in gold (no decimal)
- `cpSeparated` — boolean, whether the rent value has been set aside in CP
- Character without a house → `house: null` or field absent

---

## Backend (Main Process)

**New file:** `src/main/handlers/houses.js`

Three IPC handlers with explicit signatures:

| Handler | IPC args (after `_event`) | Action |
|---|---|---|
| `houses:set` | `characterId, { bidDay, value, cpSeparated }` | Sets `house` field on character |
| `houses:delete` | `characterId` | Sets `house: null` on character |
| `houses:toggleCp` | `characterId` | Flips `house.cpSeparated` boolean |

All handlers:
- Read/write `store.get('characters')`
- Return the full updated characters array
- **Silent no-op convention:** if `characterId` does not match any character, return the unchanged array unchanged (same pattern as `characters:delete`, `characters:toggleTask`)
- **`houses:set` must clamp `bidDay`** server-side: `const safeBidDay = Math.min(28, Math.max(1, bidDay))`. The `houseRemaining` date arithmetic relies on 1–28 being a hard constraint; values outside this range cause JS `Date` to silently overflow into adjacent months.

Example handler signature:
```js
ipcMain.handle('houses:set', (_, characterId, { bidDay, value, cpSeparated }) => { ... });
```

Register in `src/main/index.js` alongside existing handlers.

**Preload (`src/main/preload.js`)** — expose three new methods:
```js
setHouse:      (id, data) => ipcRenderer.invoke('houses:set', id, data),
deleteHouse:   (id)       => ipcRenderer.invoke('houses:delete', id),
toggleHouseCp: (id)       => ipcRenderer.invoke('houses:toggleCp', id),
```

---

## Renderer — Houses Page

**New files:**
- `src/renderer/modules/houses.js`
- `src/renderer/styles/houses.css`

**CSS link** added to `index.html` (after `characters.css`):
```html
<link rel="stylesheet" href="styles/houses.css" />
```

**Script tag** added to `index.html` (after `characters.js`, before `config.js`):
```html
<script src="modules/houses.js"></script>
```

**Sidebar entry** (between Personagens and Tasks):
```html
<button class="nav-btn" data-page="houses" onclick="navigate('houses'); loadHouses()">
  <span class="nav-icon">🏠</span>
  <span>Houses</span>
</button>
```

**Page section `#page-houses`** in `index.html`:
```html
<section id="page-houses" class="page">
  <div class="page-header">
    <h1>Houses</h1>
    <button class="btn-primary" onclick="showAddHouseForm()">+ Adicionar House</button>
  </div>
  <div id="add-house-form" style="display:none">...</div>
  <div id="house-list"></div>
</section>
```

**Add House form fields:**
- Select of characters without a house (filtered from characters array)
- Number input "Dia do BID" (`min="1" max="28"`)
- Number input "Valor" (integer, `min="0"`)
- Checkbox "Valor separado no CP"
- Buttons: Salvar / Cancelar

**House list row:**
```
🏠  Mago Principal          $9999    27d   [ ] CP    [🗑 on hover]
```

- House icon: colored/opacity per countdown state (see Icon States)
- Character name
- `$valor` — integer, no comma
- `Xd` — days remaining to next BID
- CP checkbox — toggleable inline (`toggleHouseCp`), re-renders row after response
- Hover → delete icon (🗑) appears at far right, calls `deleteHouse`

**`houses.js` module structure:**
```js
let houseCharacters = []; // full characters array, refreshed on loadHouses()

async function loadHouses() { ... }
function renderHouses() { ... }
function showAddHouseForm() { ... }
function hideAddHouseForm() { ... }
async function addHouse() { ... }
async function deleteHouse(characterId) { ... }
async function toggleHouseCp(characterId) { ... }
```

---

## Login Page — House Icon

Modified in `src/renderer/modules/accounts.js`.

**Character cache:** add a module-level `let loginCharacters = []` in `accounts.js`. Populate it in `loadAccounts` via `window.api.getCharacters()` — a single async fetch alongside `getAccounts`. This avoids making `renderAccountsLogin` async and prevents stale renders on rapid re-calls (drag-drop, saveVip, etc.).

```js
async function loadAccounts() {
  [accounts, loginCharacters] = await Promise.all([
    window.api.getAccounts(),
    window.api.getCharacters(),
  ]);
  renderAccountsLogin();
  renderAccountsConfig();
}
```

`renderAccountsLogin` remains synchronous — reads from `loginCharacters` cache. When `houses.js` mutates characters (add/delete/toggle), it calls `loadAccounts()` to refresh both caches. `loadAccounts` is always defined at this call site because `accounts.js` is loaded before `houses.js` in `index.html` — this load-order dependency must be preserved.

**Per account:** filter `loginCharacters` by `accountId`, keep those with `house`, compute `houseRemaining` for each, pick the one with the lowest days (most urgent).

**Icon states:**

| Condition | Display |
|---|---|
| No house on account's characters | Icon hidden |
| days > 3 | 🏠 gray, opacity proportional |
| days ≤ 3, `cpSeparated: false` | 🏠 red background |
| days ≤ 3, `cpSeparated: true` | 🏠 green background |

**Opacity formula:** `opacity = Math.max(0.2, 1 - (days / 30))`
(20% at d30, 100% at d0)

**Tooltip:** `title` attribute set to the character name of the most urgent house.

---

## 7:40 AM Reset Logic

Both VIP and House countdown calculations use a shared helper so that a "new day" begins at 7:40 AM instead of midnight. Define `RESET_OFFSET` and `adjustedDay` once in `app.js` (global utils) or at the top of each module where used.

```js
const RESET_OFFSET = (7 * 60 + 40) * 60 * 1000; // 7h40 in ms

function adjustedDay(ts) {
  return Math.floor((ts - RESET_OFFSET) / 86400000);
}
```

**VIP** — replace current elapsed calculation in `vipRemaining` (`accounts.js`):
```js
// Before:
const elapsed = Math.floor((Date.now() - account.vipAddedAt) / 86400000);
// After:
const elapsed = adjustedDay(Date.now()) - adjustedDay(account.vipAddedAt);
```

**House countdown** (`houses.js` and `accounts.js`):
```js
function houseRemaining(house) {
  if (!house?.bidDay) return null;
  // Subtract RESET_OFFSET so "now" treats 7:40 AM as the day boundary.
  // Before 7:40 AM, now.getMonth()/getFullYear() reflect the prior day — intentional.
  const now = new Date(Date.now() - RESET_OFFSET);
  let next = new Date(now.getFullYear(), now.getMonth(), house.bidDay);
  if (next <= now) {
    next = new Date(now.getFullYear(), now.getMonth() + 1, house.bidDay);
  }
  return Math.ceil((next - now) / 86400000);
}
```

After BID day passes (at 7:40 AM), `houseRemaining` automatically returns ~30 — no explicit reset needed.

**Known caveat — `cpSeparated` persistence:** After the BID day passes, `cpSeparated` remains `true` in the store until the user manually unchecks it. The icon reverts to gray at ~d30 and only shows green/red again near d3 — at which point the user should re-evaluate whether CP is actually separated. This is accepted behavior; no auto-reset is implemented.

---

## Files Changed

| File | Change |
|---|---|
| `src/main/handlers/houses.js` | New — `houses:set`, `houses:delete`, `houses:toggleCp` |
| `src/main/index.js` | Register houses handler |
| `src/main/preload.js` | Expose `setHouse`, `deleteHouse`, `toggleHouseCp` |
| `src/renderer/modules/houses.js` | New — Houses page logic |
| `src/renderer/styles/houses.css` | New — Houses page styles |
| `src/renderer/modules/accounts.js` | `loginCharacters` cache, house icon on login cards, 7:40 fix for VIP |
| `src/renderer/index.html` | Houses page section, sidebar nav, `<script>` tag, `<link>` tag for houses.css |
