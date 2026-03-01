# Deployment Notes — Stochastic Parrot

## Production Runtime Gotchas (March 2026)

This project hit two deployment issues that are easy to miss:

1. **SQLite runtime compatibility**
   - The app originally used Node's built-in `node:sqlite` module directly.
   - On the production host runtime, that module path was unavailable, causing backend boot failure.
   - Fix implemented: `server/db/connection.ts` now tries `node:sqlite` first, then falls back to `better-sqlite3`.

2. **API proxy path handling**
   - Nginx proxy config for `/api/` can accidentally strip the `/api` prefix depending on `proxy_pass` syntax.
   - If stripped, upstream routes (mounted at `/api`) may 404/fall through to frontend HTML.
   - Ensure proxy preserves expected route shape for backend.

---

## Known-good deployment flow

### 1) Build locally
```bash
npm ci
npm run build
# Ensure SQL migrations are present in built output
mkdir -p dist/server/server/db/migrations
cp server/db/migrations/*.sql dist/server/server/db/migrations/
```

### 2) Sync server app artifacts
- Sync `dist/` to server app directory (example: `/home/azureuser/apps/stochastic-parrot/dist/`)
- Sync `package.json` + `package-lock.json`

### 3) Install prod dependencies on server
```bash
npm ci --omit=dev
```

### 4) Restart process manager
```bash
pm2 restart stochastic-parrot-ericrhea-com
pm2 logs stochastic-parrot-ericrhea-com --lines 50
```

### 5) Verify endpoints
```bash
curl -sS https://stochastic-parrot.ericrhea.com/healthz
curl -sS https://stochastic-parrot.ericrhea.com/api/health
```
Expected:
- `/healthz` -> `ok`
- `/api/health` -> JSON with `status: "ok"` and `db: "connected"`

---

## Quick diagnostics

If frontend loads but `/api/health` fails:
1. Check PM2 logs for SQLite/runtime errors.
2. Check nginx `/api` proxy pass behavior.
3. Confirm server process is listening on expected port.
4. Confirm migration SQL exists under built dist path.

---

## Why this file exists

To avoid repeating a painful class of deployment bug:
- "works locally, fails in prod runtime"
- "frontend is up but API silently misrouted"

Keep this updated when deployment architecture changes.
