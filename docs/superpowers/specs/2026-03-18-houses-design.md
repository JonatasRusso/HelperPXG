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

- `bidDay` — integer 1–28, day of month the rent renews
- `value` — integer, house value in gold (no decimal)
- `cpSeparated` — boolean, whether the rent value has been set aside in CP
- Character without a house → `house: null` or field absent

---

## Backend (Main Process)

**New file:** `src/main/handlers/houses.js`

Three IPC handlers:

| Handler | Args | Action |
|---|---|---|
| `houses:set` | `{ characterId, bidDay, value, cpSeparated }` | Sets `house` field on character |
| `houses:delete` | `characterId` | Sets `house: null` on character |
| `houses:toggleCp` | `characterId` | Flips `house.cpSeparated` boolean |

All handlers read/write from `store.get('characters')` and return the full updated characters array.

Register in `src/main/index.js` alongside existing handlers.

**Preload (`src/main/preload.js`)** — expose three new methods:
```js
setHouse:     (characterId, data) => ipcRenderer.invoke('houses:set', characterId, data),
deleteHouse:  (characterId)       => ipcRenderer.invoke('houses:delete', characterId),
toggleHouseCp:(characterId)       => ipcRenderer.invoke('houses:toggleCp', characterId),
```

---

## Renderer — Houses Page

**New files:**
- `src/renderer/modules/houses.js`
- `src/renderer/styles/houses.css`

**Sidebar entry** (between Personagens and Tasks in `index.html`):
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
- Select/radio of characters without a house (filtered from characters array)
- Number input "Dia do BID" (1–28)
- Number input "Valor" (integer, no decimal)
- Checkbox "Valor separado no CP"
- Buttons: Salvar / Cancelar

**House list row:**
```
🏠  Mago Principal          $9999    27d   [ ] CP    [🗑 on hover]
```

- House icon: colored/opacity per countdown state (see Icon States below)
- Character name
- `$valor` — integer, no comma
- `Xd` — days remaining to next BID
- CP checkbox — toggleable inline, calls `toggleHouseCp`
- Hover → delete icon (🗑) appears at far right, calls `deleteHouse`

---

## Login Page — House Icon

Modified in `src/renderer/modules/accounts.js`.

`renderAccountsLogin` fetches characters (via `window.api.getCharacters()`) to compute house status per account. For each account, find all characters with a house, compute remaining days for each, pick the most urgent (lowest days).

**Icon states:**

| Condition | Display |
|---|---|
| No house on any character | Icon hidden |
| days > 3 | 🏠 gray, opacity proportional |
| days ≤ 3, `cpSeparated: false` | 🏠 red background |
| days ≤ 3, `cpSeparated: true` | 🏠 green background |

**Opacity formula:** `opacity = Math.max(0.2, 1 - (days / 30))`
(20% at d30, 100% at d0)

**Tooltip:** `title` attribute set to the character name of the most urgent house.

---

## 7:40 AM Reset Logic

Both VIP and House countdown calculations use a shared offset so that a "new day" begins at 7:40 AM instead of midnight.

```js
const RESET_OFFSET = (7 * 60 + 40) * 60 * 1000; // 7h40 in ms

function adjustedDay(ts) {
  return Math.floor((ts - RESET_OFFSET) / 86400000);
}
```

**VIP** — replace current elapsed calculation in `vipRemaining`:
```js
// Before:
const elapsed = Math.floor((Date.now() - account.vipAddedAt) / 86400000);
// After:
const elapsed = adjustedDay(Date.now()) - adjustedDay(account.vipAddedAt);
```

**House countdown:**
```js
function houseRemaining(house) {
  if (!house?.bidDay) return null;
  const RESET_OFFSET = (7 * 60 + 40) * 60 * 1000;
  const now = new Date(Date.now() - RESET_OFFSET);
  let next = new Date(now.getFullYear(), now.getMonth(), house.bidDay);
  if (next <= now) {
    next = new Date(now.getFullYear(), now.getMonth() + 1, house.bidDay);
  }
  return Math.ceil((next - now) / 86400000);
}
```

After BID day passes (at 7:40 AM), `houseRemaining` automatically returns ~30 (days to next month's same day) — no explicit reset needed.

`cpSeparated` resets to `false` automatically when the user re-adds or re-saves the house after a new cycle begins (handled by UI: on each new cycle the user unchecks CP naturally, since the checkbox is inline and persistent in store until changed).

---

## Files Changed

| File | Change |
|---|---|
| `src/main/handlers/houses.js` | New — `houses:set`, `houses:delete`, `houses:toggleCp` |
| `src/main/index.js` | Register houses handler |
| `src/main/preload.js` | Expose `setHouse`, `deleteHouse`, `toggleHouseCp` |
| `src/renderer/modules/houses.js` | New — Houses page logic |
| `src/renderer/styles/houses.css` | New — Houses page styles |
| `src/renderer/modules/accounts.js` | Login icon + 7:40 fix for VIP |
| `src/renderer/index.html` | Houses page section + sidebar nav + script tag + CSS link |
