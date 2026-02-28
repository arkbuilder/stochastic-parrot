# Reliability

> **Source of truth:** `Knowledge/engineering/sync-conflict-and-offline-policy.md` · `Knowledge/engineering/performance-budget-mobile.md`

---

## Principles

1. **The game must be playable offline.** Server is for persistence, not gameplay.
2. **No data loss.** If the server is down, progress is queued and synced later.
3. **Graceful degradation.** Missing assets → placeholder. Missing audio → silence. Missing server → local mode.
4. **Never crash.** Unhandled errors are caught, logged, and recovered from.

---

## Error Handling Strategy

### Error Boundaries

| Layer | Handling |
|---|---|
| **Game loop** | `try/catch` around `update()` and `render()`. On error: log, skip frame, continue. Never kill the loop. |
| **Scene transitions** | Invalid transition → log warning, stay on current scene. |
| **Input** | Bad event → ignore silently. Never throw from input handlers. |
| **Rendering** | Missing sprite → draw placeholder rectangle with entity color. |
| **Audio** | Missing audio / Web Audio blocked → `audioManager.muted = true`, continue. |
| **Network** | Fetch fails → queue for retry, return cached/default data. |
| **SQLite** | Migration fail → log, start with empty DB. Query fail → return empty result set. |

### Global Error Handler

```typescript
window.addEventListener('error', (event) => {
  telemetry.emit('client_error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
  });
  // Do NOT re-throw — keep the game running
});

window.addEventListener('unhandledrejection', (event) => {
  telemetry.emit('client_error', {
    message: event.reason?.message ?? 'unhandled rejection',
  });
  event.preventDefault();
});
```

---

## Offline Strategy

### Detection

```typescript
function isOnline(): boolean {
  return navigator.onLine;
}

window.addEventListener('online', () => drainOfflineQueue());
window.addEventListener('offline', () => { /* no-op, writes go to queue */ });
```

### Offline Queue

When the server is unreachable, all persistence writes go to `localStorage`:

```typescript
interface OfflineEntry {
  type: 'score' | 'progress' | 'event';
  payload: unknown;
  ts: string; // ISO8601
  retries: number;
}

const QUEUE_KEY = 'dr_offline_queue';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;
```

### Queue Drain

On reconnect or app start (if online):

1. Read queue from localStorage.
2. Send entries oldest-first via API client.
3. On success: remove from queue.
4. On failure: increment retry count. Drop entries exceeding `MAX_RETRIES`.
5. On conflict (score): server keeps the higher score.
6. On conflict (progress): client state wins (most recent timestamp).

### What Works Offline

| Feature | Offline Behavior |
|---|---|
| Gameplay (all islands) | Fully playable |
| Score display | Shows locally cached scores |
| Leaderboard | Shows last cached leaderboard |
| Progress save | Queued to localStorage |
| Score submit | Queued to localStorage |
| Telemetry | Queued (up to MAX_QUEUE_SIZE, then dropped) |

### What Requires Online

| Feature | Online Requirement |
|---|---|
| Leaderboard refresh | Fetch from server |
| Score submission (official) | Sync from queue |
| Cross-device progress | Not supported (single-device model) |

---

## State Recovery

### Crash Recovery

On app load, check for incomplete session state in localStorage:

```typescript
const SAVE_KEY = 'dr_session_state';

interface SessionSave {
  island_id: string;
  phase: 'encode' | 'recall' | 'resolved';
  concepts_placed: ConceptPlacement[];
  timestamp: string;
}
```

- If a save exists and is <1 hour old: offer "Resume" on the menu screen.
- If a save exists and is >1 hour old: discard silently.
- Save is written at phase transitions only (not every frame).

### State Machine Recovery

If the state machine reaches an undefined state:

1. Log `state_machine_error` telemetry event.
2. Transition to `MENU` state.
3. Show a brief "Something went wrong" toast (disappears in 3s).
4. Do NOT lose the player's progress (session save is preserved).

---

## Asset Loading Resilience

### Progressive Loading

```
BootScene:
  1. Load critical assets (menu sprites, UI) — REQUIRED
  2. Load Island 1 assets — REQUIRED for play
  3. Preload Island 2 assets — OPTIONAL (background, cancellable)
```

### Missing Asset Fallback

| Asset Type | Fallback |
|---|---|
| Sprite | Solid-color rectangle matching entity's faction color |
| Tile | Checkerboard pattern (debug-visible) |
| Audio | Silence (no error, no crash) |
| Layout JSON | Hardcoded minimal layout (3 landmarks in triangle) |
| Font | System monospace |

### Loading Timeout

- Asset load timeout: **10 seconds** per asset.
- On timeout: use fallback, log `asset_load_timeout` event, continue.

---

## Memory Management

- Sprite atlases are shared (one Image per island, not per entity).
- Audio buffers are released when leaving an island (`audioManager.unloadIsland(id)`).
- Entity pools are cleared on scene exit.
- Event log queue has a cap (100 entries in localStorage, oldest dropped).

---

## Performance Degradation

If frame time exceeds budget:

| Condition | Response |
|---|---|
| Single long frame (>33ms) | Skip particle effects for that frame |
| Sustained (>5 frames at >33ms) | Disable particles entirely until next scene |
| Critical (>100ms frame) | Log `perf_critical` event, skip render (update-only) |

**Never skip input polling or state updates.** Only rendering is degradable.

---

## Telemetry Hooks

| Event | Payload |
|---|---|
| `client_error` | `message`, `filename`, `lineno` |
| `state_machine_error` | `from_state`, `attempted_transition` |
| `offline_queue_drain` | `entries_sent`, `entries_failed` |
| `asset_load_timeout` | `asset_path`, `timeout_ms` |
| `perf_critical` | `frame_time_ms`, `scene` |
| `session_resumed` | `save_age_ms`, `island_id`, `phase` |
