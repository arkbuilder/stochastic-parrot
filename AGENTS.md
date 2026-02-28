# AGENTS.md — Dead Reckoning: Memory Sea

> **Purpose:** Entry point for coding agents working in this repository.
> This is a **table of contents**, not an encyclopedia. Follow the links.

---

## What This Project Is

An 8-bit pirate adventure that teaches AI/ML through spatial memory (Method of Loci).
Players place concepts in landmarks, then recall them under threat pressure.
**Read:** `Design/GameHook.md`

## Architecture

Monorepo: TypeScript + Vite + Canvas 2D (client) + Express + SQLite (server).
Layered domains with strict downward-only dependency flow.
**Read:** `ARCHITECTURE.md`

## Source of Truth Hierarchy

1. `Design/GameDesign.md` — Framework rules (non-negotiable principles, telemetry spec)
2. `Design/` files — What to build (see `Design/README.md` for reading order)
3. `Knowledge/` files — How to build (see `Knowledge/README.md` for retrieval order)
4. `docs/` files — Engineering bridge (schema, frontend, plans, quality)
5. `ARCHITECTURE.md` — Domain map, folder structure, layering rules

If any file contradicts `Design/GameDesign.md`, the design doc wins.

## Before You Write Code

1. Read `ARCHITECTURE.md` — understand folder structure and layering rules
2. Read the relevant `Design/` file for the feature you're building
3. Read the relevant `Knowledge/` file for implementation guidance
4. Check `docs/PLANS.md` — understand current milestone and priorities
5. Check `docs/QUALITY_SCORE.md` — know the quality bar for your domain

## Key Constraints

- **No upward imports.** See dependency rules in `ARCHITECTURE.md`.
- **No text in gameplay.** Teaching is environmental (signposting, spatial, icon-based).
- **Retry ≤5s.** Fail-to-control must be under 5 seconds everywhere.
- **Portrait-first.** Primary action in lower 1/3, hazards in upper 1/3.
- **Dual-input parity.** Every interaction works on touch AND PC (±20% time).
- **One concept per beat.** Never introduce more than one new thing at once.

## Where to Find Things

| I need to... | Read |
|---|---|
| Understand the game | `Design/GameHook.md` → `Design/CoreInteraction.md` |
| See all 15 concepts | `Design/ConceptCurriculum.md` |
| Know the database schema | `docs/DATABASE.md` |
| Understand the frontend pipeline | `docs/FRONTEND.md` |
| Know what to build next | `docs/PLANS.md` |
| Check quality grades | `docs/QUALITY_SCORE.md` |
| Write tests | `docs/TESTING.md` |
| Deploy | `docs/DEPLOYMENT.md` |
| Handle errors/offline | `docs/RELIABILITY.md` |
| Validate scores/security | `docs/SECURITY.md` |
| See design tokens (colors, sizes) | `Design/Aesthetic.md` |
| Understand encounter mechanics | `Design/EncounterDesign.md` |
| See the island sequence | `Design/IslandProgression.md` |
| Check coverage gaps | `Knowledge/standards/coverage-matrix.md` |

## Commit Conventions

- Prefix: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- One logical change per commit
- Reference the Design doc that drives the change (e.g., `feat: encode system per CoreInteraction.md §2`)

## File Naming

- Code: `kebab-case.ts`
- Types: `PascalCase`
- Assets: `snake_case.ext`
- Migrations: `NNN_description.sql`
- Tests: `*.test.ts` mirroring `src/` structure

## When You're Stuck

1. Search `Knowledge/` for domain guidance
2. Check `Design/` for the canonical spec
3. Look at `docs/RELIABILITY.md` for error handling patterns
4. If a constraint seems wrong, do not override it — flag it for human review
