# Tasks Redesign — Spec

## Goal

Replace the current simple task system (title + done/undone) with a typed, auto-resetting task system. Tasks have a type (daily/weekly/monthly), an optional "server save" reset schedule, and auto-reset based on `nextResetAt` checked at startup.

---

## Data Model

Each task stored in electron-store:

```json
{
  "id": 1234567890,
  "title": "Fazer dungeon",
  "type": "daily",
  "serverSave": true,
  "done": false,
  "nextResetAt": 1710744000000
}
```

Old tasks (without `type`/`serverSave`/`nextResetAt`) are **discarded** on first load — full replacement, no migration.

---

## Reset Logic

### `nextResetAt` calculation

Timezone: BRT (UTC-3). Reset time: **07:40**.

**serverSave = true** — next fixed schedule from now:
- `daily` → next 07:40 BRT (if now is before 07:40 today → today at 07:40; else → tomorrow at 07:40)
- `weekly` → next Monday at 07:40 BRT (if today is Monday and now is before 07:40 → today at 07:40)
- `monthly` → next 1st of month at 07:40 BRT (if today is the 1st and now is before 07:40 → today at 07:40)

**serverSave = false** — relative duration from now:
- `daily` → now + 24h
- `weekly` → now + 7 days
- `monthly` → now + 30 days

`nextResetAt` is set when a task is **created** and **recalculated after each reset**.

### Startup reset check

In `tasks:get` handler (Main process), before returning tasks:
1. Load tasks from store
2. For each task: if `Date.now() >= task.nextResetAt` → set `done: false`, recalculate `nextResetAt`
3. If any task was reset, persist to store
4. Return updated tasks

---

## IPC Handlers

| Channel | Change |
|---|---|
| `tasks:get` | Runs reset check before returning |
| `tasks:add` | Accepts `{ title, type, serverSave }`, computes `nextResetAt` |
| `tasks:toggle` | Unchanged |
| `tasks:delete` | Unchanged |
| `tasks:reorder` | Accepts `ids[]`, persists new order, returns updated tasks |

---

## UI

### Task creation form (Tasks page)

- Text input: task name
- Dropdown: `Diária` / `Semanal` / `Mensal`
- Checkbox: `Reseta no Server Save`
- Button: `+ Adicionar`

### Task card (list item)

- `▲` / `▼` buttons to move task up/down in the list
- Checkbox (done toggle)
- Task title (strikethrough when done)
- Type badge: `D` (daily, blue) / `S` (weekly, purple) / `M` (monthly, orange)
- Server save icon (🕐 or similar) shown when `serverSave: true`
- Delete button (always visible, not hover-only)

### Counter

Existing `done/total` counter remains.

---

## Out of Scope

- Character linking (future feature)
- Thumbnail images (future feature)
- In-app periodic reset check (startup-only is sufficient)
- Task editing (delete + recreate)
- Drag-and-drop reorder (buttons ▲/▼ only)
