# Frontend Architecture

> **Source of truth:** `ARCHITECTURE.md` (layering rules) · `Design/CoreInteraction.md` (mechanic spec) · `Design/Aesthetic.md` (tokens)

---

## Overview

The frontend is a Canvas 2D game rendered in a single `<canvas>` element, driven by a `requestAnimationFrame` loop. There is no DOM-based UI during gameplay — everything is drawn to canvas. The only HTML outside the canvas is the initial mount point and a hidden accessibility overlay for screen readers.

---

## Rendering Pipeline

```
┌──────────┐     ┌──────────────┐     ┌────────────┐     ┌─────────┐
│ pollInput │ ──→ │ scene.update │ ──→ │ scene.render│ ──→ │ present │
│           │     │  (dt, acts)  │     │  (offCtx)   │     │ (visCtx)│
└──────────┘     └──────────────┘     └────────────┘     └─────────┘
```

### Double Buffering

- **Offscreen canvas** (`offCtx`): All scene rendering targets this buffer.
- **Visible canvas** (`visCtx`): `present()` blits the offscreen buffer in one operation.
- Prevents tearing and partial-frame artifacts.

### Resolution Strategy

- **Game resolution:** 240×400 pixels (portrait, 8-bit scale).
- **Display scaling:** CSS scales the canvas to fill the viewport while preserving aspect ratio.
- **Pixel-perfect:** `imageSmoothingEnabled = false` on both contexts.
- **Responsive:** On PC, the canvas is centered with letterboxing. On mobile, it fills the screen.

```typescript
// Pseudo-code for scaling
const GAME_W = 240;
const GAME_H = 400;
const scale = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
canvas.style.width = `${GAME_W * scale}px`;
canvas.style.height = `${GAME_H * scale}px`;
```

---

## Scene System

Each screen of the game is a **Scene** object implementing:

```typescript
interface Scene {
  enter(context: SceneContext): void;   // Called when scene becomes active
  exit(): void;                         // Called when scene is replaced/popped
  update(dt: number, actions: InputAction[]): void;
  render(ctx: OffscreenCanvasRenderingContext2D): void;
}
```

### Scene Stack

Scenes are managed by `SceneManager` as a stack:

| Operation | Use Case |
|---|---|
| `push(scene)` | Pause overlay on top of gameplay |
| `pop()` | Resume gameplay from pause |
| `replace(scene)` | Navigate from menu to overworld |

Only the **top scene** receives `update()` and `render()` calls.

### Scene Inventory

| Scene | Purpose | Entered From |
|---|---|---|
| `BootScene` | Preload Island 1 assets, show splash | App start |
| `MenuScene` | Title, start button, leaderboard link | Boot complete |
| `OverworldScene` | Sea chart, node selection, sail animation | Menu → Start, Island complete |
| `IslandScene` | Exploration + encode phase | Overworld → select island |
| `EncounterScene` | Recall phase under threat | IslandScene → threat triggered |
| `RewardScene` | Chart fragment award, score summary | Encounter → resolved |
| `LeaderboardScene` | Score display | Menu or Reward |
| `PauseScene` (overlay) | Pause menu, concept journal, settings | Any scene → pause action |

---

## Entity Model (ECS-Lite)

Entities are plain TypeScript objects (no class hierarchy):

```typescript
interface Entity {
  id: string;
  type: EntityType;
  position: { x: number; y: number };
  bounds: { w: number; h: number };
  sprite?: SpriteRef;
  state: Record<string, unknown>;
  visible: boolean;
  interactive: boolean;
}
```

Systems operate on filtered entity lists each tick:

```typescript
// Example: encode-system processes draggable concept cards
function updateEncodeSystem(
  entities: Entity[],
  actions: InputAction[],
  dt: number
): EncodeEvent[] {
  const cards = entities.filter(e => e.type === 'concept-card');
  const landmarks = entities.filter(e => e.type === 'landmark');
  // ... drag logic, snap zones, lock-in detection
  return events; // EncodeEvent[] consumed by scene for telemetry + audio
}
```

### System Execution Order (per tick)

1. `movementSystem` — position updates, avatar walk
2. `encodeSystem` — drag card logic (encode phase only)
3. `recallSystem` — prompt + answer validation (recall phase only)
4. `threatSystem` — fog/storm/enemy advancement
5. `animationSystem` — sprite frame stepping
6. `cameraSystem` — viewport follow, scroll clamp

---

## Sprite System

### Sprite Sheets

All sprites are packed into atlas PNGs with a JSON manifest:

```json
{
  "nemo_walk_down": { "x": 0, "y": 0, "w": 16, "h": 16, "frames": 4, "fps": 8 },
  "nemo_walk_up":   { "x": 0, "y": 16, "w": 16, "h": 16, "frames": 4, "fps": 8 }
}
```

### Sprite Sizes (from `Design/Characters.md`)

| Entity | Sprite Size | Notes |
|---|---|---|
| Nemo (player) | 16×16 | 4-direction walk, place animation |
| Bit (parrot) | 8×8 | Idle, fly, point |
| Landmarks | 16×16 or 32×32 | Idle + glow (placed) + pulse (recall) |
| Concept cards | 16×16 | In tray + dragging + placed states |
| Fog wall | Full width × variable | Animated edge particles |

---

## Input System

### Architecture

```
[Browser Events] → TouchProvider / KeyboardProvider → InputManager → InputAction[]
```

### InputAction Types

```typescript
type InputAction =
  | { type: 'primary'; x: number; y: number }        // tap / left-click
  | { type: 'primary_end'; x: number; y: number }    // release
  | { type: 'move'; dx: number; dy: number }          // swipe / WASD
  | { type: 'secondary'; x: number; y: number }       // long-press / right-click
  | { type: 'drag'; x: number; y: number }            // drag in progress
  | { type: 'pause' }                                  // escape / back button
```

### Coordinate Normalization

All input coordinates are converted from screen space to game space:

```typescript
function screenToGame(screenX: number, screenY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((screenX - rect.left) / rect.width) * GAME_W,
    y: ((screenY - rect.top) / rect.height) * GAME_H,
  };
}
```

---

## Audio Integration

Scenes trigger audio via `AudioManager` — audio is **never** called from systems:

```typescript
// In EncounterScene.update():
const events = recallSystem.update(entities, actions, dt);
for (const event of events) {
  if (event.type === 'recall_correct') {
    audioManager.playSfx('recall_correct');
  }
}
```

### Adaptive Music Layers

`MusicLayer` engine in `audio/music-layer.ts` manages crossfading between layers:

- **Base:** Always playing (island ambient).
- **Rhythm:** Added during exploration.
- **Tension:** Added when threat triggers.
- **Urgency:** Added when timer is low.
- **Resolution:** Brief sting on recall success.

Layer transitions use 500ms crossfade. See `Design/AudioDirection.md` for full spec.

---

## Design Token Integration

`rendering/tokens.ts` exports constants generated from `Design/Aesthetic.md`:

```typescript
export const TOKENS = {
  colorCyan400: '#22d3ee',
  colorRed400: '#f87171',
  colorYellow400: '#facc15',
  colorGray900: '#0a0a0a',
  colorGray800: '#171717',
  spacingUnit: 4,  // 4px base grid
  borderRadius: 0, // hard pixel edges
  shadowHard: { x: 2, y: 2, blur: 0, color: '#000000' },
  // ... all tokens from Aesthetic.md
} as const;
```

Run `npm run generate:tokens` to regenerate from Aesthetic.md.

---

## HUD Rendering

HUD is drawn as the final render pass on top of scene content:

| Phase | Top Zone | Mid Zone | Bottom Zone |
|---|---|---|---|
| Explore | Mini-map | Island view | Concept card tray |
| Recall | Threat advancing | Landmarks (glowing) | Timer + prompt icon |
| Overworld | — | Sea chart | Ship status |
| Menu | — | Title art | Start / Leaderboard buttons |

Thumb-safe: all interactive elements in bottom 50% of screen. Upper zone is read-only.

See `Design/InventoryAndHUD.md` for full zone specs.

---

## File Size Budget

| Category | M1 Limit | Full Game Limit |
|---|---|---|
| JS bundle (gzipped) | ≤150KB | ≤300KB |
| Sprites (Island 1) | ≤100KB | ≤200KB per island |
| Audio (Island 1) | ≤300KB | ≤500KB per island |
| Total initial load | ≤600KB | Island 1 only; lazy-load rest |
