# 🏴‍☠️ Stochastic Parrot

**Dead Reckoning: Memory Sea** — a browser game with a production-ready web + API deployment path.

Arrr, matey. Ye found the repo where pixel seas, drifting islands, and deterministic chaos meet.

---

## ⚓ What this is

Stochastic Parrot is a TypeScript game project with:

- **Vite client** (served from `dist/client`)
- **Express API backend** (served from `dist/server/server/index.js`)
- **SQLite-backed persistence** for scores/progress/events
- **Production deployment on subdomain** via nginx + PM2

Live host:
- `https://stochastic-parrot.ericrhea.com/`
- `https://stochastic-parrot.ericrhea.com/aboutthegame/`

## 🧠 Project Story & Inspiration

This project was shaped by Spring into AI Week 3 entries and write-ups.

- Story context: `docs/story/spring-into-ai-origins.md`
- Attribution links: `docs/story/inspiration-links.md`
- Narrative bridge: `docs/story/from-week3-to-stochastic-parrot.md`

---

## 🧭 Quick Start (Local)

```bash
npm ci
npm run dev
```

Dev runs:
- Vite frontend
- TSX backend (`server/index.ts`)

---

## 🛠 Scripts

```bash
npm run dev            # client + server dev
npm run build          # build client + server
npm run start          # run compiled server
npm run lint           # eslint + type checks
npm run test           # unit tests
npm run test:coverage  # coverage
npm run test:e2e       # playwright
npm run db:migrate     # run migrations
npm run db:seed        # seed database
npm run db:reset       # reset + seed
```

---

## 🗺 Project Structure

- `src/` — game client source
- `server/` — API + DB + middleware
- `aboutthegame/` — static content section
- `assets/` — static client assets
- `tests/` — unit/e2e tests
- `dist/` — build output (generated)

---

## 🧱 SQLite Runtime Notes

This project supports environments where Node built-in `node:sqlite` may not be available.

DB connection logic:
1. Try `node:sqlite`
2. Fallback to `better-sqlite3`

That keeps local/prod runtime compatibility sane.

---

## 🚀 Deploy Notes

Use:
- [`DEPLOYMENT.md`](./DEPLOYMENT.md)

It includes:
- runtime compatibility gotchas
- nginx API proxy behavior
- known-good deploy sequence
- diagnostics checklist

---

## 🦜 Maintainers

Built under the arkbuilder stack.

If something breaks at sea, check logs first, patch second, panic never.
