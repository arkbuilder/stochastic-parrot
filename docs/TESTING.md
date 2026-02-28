# Testing Strategy

> **Source of truth:** `Knowledge/product/playtest-and-acceptance-protocol.md` · `Design/GameDesign.md` §7–8

---

## Test Pyramid

```
        ┌─────────┐
        │  E2E    │  ← Playwright (browser, real canvas)
        │ (few)   │
       ─┴─────────┴─
      ┌──────────────┐
      │ Integration  │  ← Vitest (multi-module, mock canvas)
      │ (moderate)   │
     ─┴──────────────┴─
    ┌────────────────────┐
    │    Unit Tests      │  ← Vitest (pure functions, fast)
    │    (many)          │
    └────────────────────┘
```

---

## Unit Tests (Vitest)

### What to Unit Test

| Module | Test Focus |
|---|---|
| `core/state-machine.ts` | All transitions valid, no undefined states, guard conditions |
| `core/clock.ts` | Delta time, pause/resume, no drift |
| `input/input-manager.ts` | Action normalization, coordinate transform |
| `systems/encode-system.ts` | Snap zone detection, lock-in validation, max concepts |
| `systems/recall-system.ts` | Correct/incorrect answer logic, timer expiry, retry count |
| `systems/threat-system.ts` | Advancement rate, health reduction, resolution |
| `data/concepts.ts` | All 15 concepts defined, unique IDs, valid prerequisite chains |
| `data/islands.ts` | All islands reference valid concepts and landmarks |
| `persistence/api-client.ts` | Request formatting, error handling (mock fetch) |
| `telemetry/events.ts` | All event names match spec, payload types valid |
| `utils/*` | Clamp, lerp, distance, seeded RNG |

### Conventions

- Test files: `src/**/*.test.ts` (co-located) or `tests/unit/**/*.test.ts`
- One `describe` per function or behavior group
- Use `it('should ...')` naming
- No side effects — mock all I/O
- Target: **≥80% line coverage** for `core/`, `systems/`, `data/`

### Example

```typescript
// tests/unit/systems/recall-system.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateRecall } from '../../../src/systems/recall-system';

describe('evaluateRecall', () => {
  it('should return correct when landmark matches prompt answer', () => {
    const result = evaluateRecall({
      promptId: 'fog_1',
      expectedLandmarkId: 'dock_crates',
      selectedLandmarkId: 'dock_crates',
      responseMs: 3000,
    });
    expect(result.correct).toBe(true);
    expect(result.speedMultiplier).toBe(2.0); // ≤3s = 2.0x
  });

  it('should return incorrect when landmark does not match', () => {
    const result = evaluateRecall({
      promptId: 'fog_1',
      expectedLandmarkId: 'dock_crates',
      selectedLandmarkId: 'chart_table',
      responseMs: 4000,
    });
    expect(result.correct).toBe(false);
  });
});
```

---

## Integration Tests (Vitest)

### What to Integration Test

| Scenario | Modules Involved |
|---|---|
| Full encode sequence | `encode-system` + `entities` + `data/concepts` |
| Full recall sequence (correct) | `recall-system` + `threat-system` + `entities` |
| Full recall sequence (fail + retry) | `recall-system` + state machine retry path |
| Island completion flow | Scene transitions: `island-scene` → `encounter-scene` → `reward-scene` |
| Score calculation | `recall-system` events → scoring formula → grade |
| Offline queue drain | `local-store` → `api-client` (mock server) |

### Approach

- Use mock canvas context (`OffscreenCanvas` or `jest-canvas-mock`)
- Mock audio (no actual Web Audio in Node)
- Real state machine, real data modules
- Target: **≥5 integration tests** by M1

---

## E2E Tests (Playwright)

### What to E2E Test

| Scenario | Validates |
|---|---|
| Boot → Menu → Start → Island 1 appears | Full scene flow, canvas renders |
| Place 3 concepts on Island 1 | Drag interaction, snap zones, lock-in |
| Complete Cursed Fog recall (all correct) | Recall flow, reward scene, score |
| Complete Cursed Fog recall (fail + retry) | Retry latency ≤5s, novice assist |
| Leaderboard shows score after completion | Persistence round-trip |
| Touch input on mobile viewport | Touch events produce correct actions |
| Keyboard input on desktop viewport | Keyboard events produce correct actions |

### Approach

- Playwright launches real browser with canvas
- Use `page.evaluate()` to inject test hooks (e.g., skip boot timer, auto-place concepts)
- Screenshot comparison for visual regression (optional, M3+)
- Target: **≥3 E2E tests** by M1, **≥10** by M3

### Test Hooks

The game exposes a `window.__DR_TEST` object in dev mode:

```typescript
if (import.meta.env.DEV) {
  (window as any).__DR_TEST = {
    getState: () => stateMachine.current,
    transitionTo: (state: string) => stateMachine.transition(state),
    getEntities: () => activeScene.entities,
    skipBoot: () => sceneManager.replace(new MenuScene()),
  };
}
```

---

## Simulated Agent Testing

Per `Design/Research.md`, simulate a "dumbest possible player" to validate fail-safety:

| Agent Behavior | Test Validates |
|---|---|
| Random taps only | Game never crashes; always reachable retry |
| Never acts (idle) | Timeout triggers, game handles gracefully |
| Always wrong answer | Novice assist triggers after 2 fails per prompt |
| Perfect play (all correct, fastest) | Expert bonus triggers, max score achievable |

Simulated agents are implemented as Playwright scripts that inject input actions programmatically:

```typescript
// tests/e2e/simulated-random-agent.ts
for (let i = 0; i < 1000; i++) {
  const x = Math.random() * 240;
  const y = Math.random() * 400;
  await page.mouse.click(x * scale, y * scale);
  await page.waitForTimeout(100);
}
// Assert: no console errors, game still responsive
```

---

## Acceptance Test Protocol

From `Design/GameDesign.md` §8:

| Test | Method | Pass Threshold |
|---|---|---|
| **No-text comprehension** | 5 testers, no tutorial text | ≥80% complete Island 1 |
| **Dual-input parity** | 10 touch, 10 PC | Completion time ±20% |
| **Cognitive load** | Count concepts introduced | ≤3 in onboarding |
| **Retry latency** | Measure fail-to-control time | ≤5s median |
| **Quit rate** | Telemetry at each beat | <10% in onboarding |

Acceptance tests are run **at the end of each milestone** using real playtesters + telemetry analysis.

---

## npm Scripts

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed"
}
```

---

## CI Integration

See `docs/DEPLOYMENT.md` for CI pipeline. Tests run on every PR:

1. `npm run lint` — TypeScript strict + ESLint
2. `npm test` — Vitest unit + integration
3. `npm run test:e2e` — Playwright (headless Chromium)
4. All must pass before merge.
