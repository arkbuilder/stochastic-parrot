# Deployment

> **Source of truth:** `ARCHITECTURE.md` (tech stack) · `Design/ScopeAndMilestones.md` (milestones)

---

## Build Pipeline

### Development

```bash
npm run dev          # Starts Vite dev server (HMR) + Express API server
                     # Opens http://localhost:5173
                     # API proxied to http://localhost:3001
```

### Production Build

```bash
npm run build        # Vite builds client → dist/client/
                     # tsc builds server → dist/server/
npm run preview      # Serves production build locally for validation
```

### Output Structure

```
dist/
├── client/          # Static files (HTML, JS, CSS, assets)
│   ├── index.html
│   ├── assets/
│   │   ├── main.[hash].js
│   │   └── ...
│   └── sprites/
│       └── ...
└── server/          # Compiled server code
    ├── index.js
    └── db/
        └── migrations/
```

---

## npm Scripts

| Script | Purpose |
|---|---|
| `dev` | Vite dev server + Express (concurrent) |
| `build` | Production client + server build |
| `preview` | Serve production build locally |
| `start` | Start production server (`node dist/server/index.js`) |
| `test` | Run Vitest (unit + integration) |
| `test:e2e` | Run Playwright |
| `test:coverage` | Vitest with coverage report |
| `lint` | ESLint + TypeScript strict check |
| `db:migrate` | Run SQLite migrations |
| `db:seed` | Seed test data |
| `db:reset` | Drop + recreate database (dev only) |
| `generate:tokens` | Parse Aesthetic.md → tokens.ts |

---

## Hosting

### Target Platform

Static hosting (client) + lightweight Node server (API + SQLite).

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| **Railway / Render** | Simple Node deploy, free tier, persistent disk for SQLite | Cold starts on free tier | **Primary choice** |
| **Fly.io** | Persistent volumes, edge deploy | Slightly more config | Good alternative |
| **Vercel + Serverless** | Great for static | No persistent SQLite without external DB | Not ideal |
| **VPS (DigitalOcean)** | Full control | Manual ops | Overkill for competition |

### Environment Variables

```env
NODE_ENV=production
PORT=3001
DATABASE_PATH=./data/deadreckoning.db
CORS_ORIGIN=https://your-domain.com
```

### Persistent Storage

SQLite database file needs persistent disk storage. On Railway/Fly.io, mount a volume:

```
/app/data/deadreckoning.db   ← persistent across deploys
```

---

## CI Pipeline

### GitHub Actions Workflow

```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

### CI Gates (Must Pass)

| Gate | Command | Blocks Merge |
|---|---|---|
| TypeScript compile | `tsc --noEmit` | Yes |
| ESLint | `eslint src/ server/` | Yes |
| Unit tests | `vitest run` | Yes |
| Build success | `vite build` | Yes |
| E2E tests | `playwright test` | Yes |
| Bundle size check | Custom script: `dist/client/assets/*.js` ≤300KB gzip | Warning only (M1), Block (M2+) |

---

## Deploy Process

### Manual Deploy (Competition)

```bash
git push origin main        # Triggers CI
# After CI passes:
railway up                  # Or: fly deploy
```

### Automated Deploy (Post-Competition)

- Push to `main` → CI passes → auto-deploy to staging
- Tag `v*` → CI passes → auto-deploy to production
- Rollback: `railway rollback` or redeploy previous commit

---

## Health Check

The server exposes a health endpoint:

```
GET /api/health → { "status": "ok", "version": "1.0.0", "db": "connected" }
```

Hosting platform configured to hit `/api/health` every 30s.

---

## Domain & SSL

- For competition: use default hosting URL (e.g., `dead-reckoning.up.railway.app`)
- SSL provided by hosting platform (automatic)
- CORS configured to allow the hosting domain only

---

## Asset Caching

| Asset Type | Cache Strategy |
|---|---|
| `*.js` (hashed) | `Cache-Control: public, max-age=31536000, immutable` |
| `*.css` (hashed) | Same |
| `sprites/*.png` | `Cache-Control: public, max-age=86400` |
| `audio/*.ogg` | `Cache-Control: public, max-age=86400` |
| `index.html` | `Cache-Control: no-cache` (always fresh) |
| API responses | `Cache-Control: no-store` |
