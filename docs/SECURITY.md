# Security

> **Source of truth:** `Knowledge/engineering/security-and-data-integrity.md`

---

## Threat Model

This is a **single-player web game with shared leaderboards**. The primary security concerns are:

1. **Score tampering** — submitting fake highscores.
2. **Leaderboard spam** — flooding with entries.
3. **Data integrity** — corrupted progress or event data.
4. **PII exposure** — accidentally storing personal information.

This is **not** a banking app. Security measures are proportional to the risk: we prevent trivial cheating and protect data integrity without overengineering.

---

## Score Integrity

### Checksum

Every score submission includes a checksum:

```typescript
function computeChecksum(payload: ScorePayload, secret: string): string {
  const data = `${payload.player_id}:${payload.score}:${payload.time_ms}:${payload.session_id}:${secret}`;
  // SHA-256 hash (Web Crypto API)
  return sha256(data);
}
```

- **Secret** is a build-time constant embedded in the client bundle. This is **not** cryptographically secure — a determined attacker can extract it. It prevents casual tampering only.
- Server validates the checksum before accepting a score.
- Invalid checksum → `403 Forbidden` + `score_rejected_integrity` telemetry event.

### Envelope Validation

Server validates that the submitted score is plausible:

| Check | Rule | Action on Fail |
|---|---|---|
| Score range | `0 ≤ score ≤ MAX_POSSIBLE_SCORE` | Reject |
| Time range | `time_ms ≥ MIN_POSSIBLE_TIME` | Reject |
| Accuracy | `0 ≤ accuracy_pct ≤ 100` | Reject |
| Grade consistency | Grade matches score threshold | Reject |
| Session exists | `session_id` exists in sessions table | Reject |
| Session timing | Score submitted within reasonable window of `session.started_at` | Reject |

`MAX_POSSIBLE_SCORE` is computed from game data: sum of all prompts × max multipliers × bonuses.

### Rate Limiting

```typescript
// Per device_fingerprint
const SCORE_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60_000, // 1 minute
};
```

Exceeding the rate limit → `429 Too Many Requests` + `rate_limit_triggered` event.

---

## Input Validation (Server)

All API endpoints validate request bodies using JSON Schema or Zod:

### Score Submission

```typescript
const ScoreSchema = z.object({
  player_id: z.string().uuid(),
  session_id: z.string().uuid(),
  board_type: z.enum(['island', 'total', 'speed', 'accuracy']),
  island_id: z.string().optional(),
  score: z.number().int().min(0).max(100_000),
  time_ms: z.number().int().min(0),
  accuracy_pct: z.number().min(0).max(100),
  grade: z.enum(['S', 'A', 'B', 'C', 'D']),
  checksum: z.string(),
});
```

### Progress Save

```typescript
const ProgressSchema = z.object({
  player_id: z.string().uuid(),
  island_id: z.string(),
  status: z.enum(['locked', 'unlocked', 'in_progress', 'completed']),
  best_grade: z.enum(['S', 'A', 'B', 'C', 'D']).optional(),
  best_score: z.number().int().min(0),
  chart_fragment: z.literal(0).or(z.literal(1)),
  expert_bonus: z.literal(0).or(z.literal(1)),
});
```

### Telemetry Event Batch

```typescript
const EventBatchSchema = z.object({
  session_id: z.string().uuid(),
  events: z.array(z.object({
    event_name: z.string().max(64),
    payload_json: z.string().max(4096),
    ts: z.string().datetime(),
  })).max(50), // Max 50 events per batch
});
```

Invalid payloads → `400 Bad Request`. No partial acceptance.

---

## Data Privacy

### No PII Collected

| Field | PII Risk | Mitigation |
|---|---|---|
| `player_id` | UUID, not PII | Client-generated, no server account |
| `display_name` | Could be real name | Max 12 chars, user-chosen, no validation |
| `device_fingerprint` | Pseudonymous | Hash only, not raw device info |
| IP address | PII | **Not stored.** Not logged. |
| Cookies | None used | No cookies — localStorage only |

### Data Access

- No admin dashboard exposes player data.
- Leaderboard shows `display_name` and `score` only — no IDs or device info.
- Event log is server-side only; never exposed via API reads.

---

## CORS

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Checksum'],
  maxAge: 86400,
}));
```

- Only the game's hosting domain is allowed.
- No wildcard origins in production.

---

## Headers

```typescript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
  next();
});
```

---

## Telemetry Hooks

| Event | Payload |
|---|---|
| `score_rejected_integrity` | `player_id`, `reason`, `submitted_score` |
| `rate_limit_triggered` | `device_fingerprint`, `endpoint` |
| `validation_failed` | `endpoint`, `errors` |

---

## What We Don't Do

- **No authentication system.** No login, no password, no OAuth. Players are identified by a client-generated UUID.
- **No encrypted database.** SQLite is plaintext on disk. This is acceptable for a game competition.
- **No DRM or obfuscation.** The client code is readable. This is a learning game, not a commercial product.
- **No server-side game simulation.** We validate plausibility, not replay accuracy. A determined attacker can fake scores. This is acceptable for the competition scope.
