# Content Pipeline

> **Source of truth:** `Design/GameHook.md` (AI generation advantage) · `Knowledge/product/playtest-and-acceptance-protocol.md` (quality gates)  
> **Status:** Canonical asset strategy, authoring vs. generation boundaries, and quality gates.

---

## Overview

Dead Reckoning uses a **hybrid content pipeline** — human-authored design decisions with AI-assisted asset generation. The key insight from `Design/GameHook.md` is: *"Your competitive edge is not technical difficulty. It is design coherence."*

The pipeline must ensure that AI-generated content **passes the same acceptance criteria** as hand-authored content.

---

## Authoring vs. Generation Boundaries

| Content Type | Authored By | Validated By | Notes |
|---|---|---|---|
| **Game design docs** (this folder) | Human | Human review | Source of truth — never AI-generated |
| **Island layouts** (tile maps) | AI-generated from templates | Simulated agent + human QA | Must satisfy signposting, accessibility, and pacing rules |
| **Concept-to-metaphor mappings** | Human-authored (`ConceptCurriculum.md`) | Human review | Metaphors must be intuitive — AI cannot judge this reliably |
| **Recall prompts** | Human-authored per concept | Playtest validation | Icon-based riddles require craft |
| **Sprites (characters, landmarks, items)** | AI-generated (image gen) | Human art direction review | Must match `Aesthetic.md` token constraints |
| **Tile sets (island terrain, ocean)** | AI-generated | Automated contrast/readability checks + human review | Must pass portrait legibility test |
| **Music tracks** | AI-generated (chiptune generators) | Human listening test + adaptive layer validation | Must fit per-island spec from `AudioDirection.md` |
| **SFX** | AI-generated or library-sourced | Duration and distinctiveness check | Must meet ≤200ms/≤500ms rules |
| **Encounter tuning (timing, difficulty)** | Human-authored initial values | Telemetry-driven iteration | Tuning knobs defined in `EncounterDesign.md` |
| **Dialogue / lore fragments** | AI-generated drafts | Human editing pass | Pictographic/icon-based — minimal text |
| **Telemetry dashboards** | AI-generated scaffolding | Human threshold validation | Events must match `product/telemetry-events-and-thresholds.md` |

---

## Asset Naming Conventions

```
{category}/{island_id}/{asset_name}_{variant}.{ext}

Examples:
sprites/island_01/dock_crates_idle.png
sprites/island_01/dock_crates_glow.png
tiles/island_01/ground_sand_01.png
audio/island_01/music_base.ogg
audio/sfx/concept_placed.wav
layouts/island_01/layout_v3.json
```

### Rules

- Snake_case for all asset names.
- Island assets prefixed with `island_NN`.
- Global assets (UI, SFX, shared sprites) use category root: `sprites/ui/`, `audio/sfx/`.
- Version variants use `_vN` suffix for iteration.

---

## Quality Gates

### Gate 1 — Design Review (Before Generation)

- [ ] Design doc for the content exists and is approved.
- [ ] Acceptance criteria are defined and measurable.
- [ ] Template/constraints provided for AI generation prompt.

### Gate 2 — Generation Output Review

- [ ] Generated asset matches `Aesthetic.md` token constraints (colors, sizes, borders).
- [ ] Sprite silhouettes are distinguishable at target size (16×16 or 32×32).
- [ ] Audio meets duration rules (SFX ≤200ms/≤500ms, music layers loop cleanly).
- [ ] Layouts satisfy signposting minimum (≥3 patterns), safe start, and threat pacing.

### Gate 3 — Integration Test

- [ ] Asset loads within performance budget (island bundle ≤500KB audio, ≤200KB sprites).
- [ ] Asset renders correctly in portrait and PC layouts.
- [ ] Telemetry events fire correctly when asset is interacted with.

### Gate 4 — Playtest Validation

- [ ] No-text comprehension test passed (for layouts and visual assets).
- [ ] Dual-input parity test passed (touch and PC).
- [ ] Acceptance criteria thresholds met (from design doc).
- [ ] No aesthetic regression (new asset doesn't clash with existing visual language).

---

## AI Generation Prompting Strategy

When using AI to generate assets, prompts must include:

1. **Design constraints** — exact values from the relevant design doc.
2. **Token references** — specific color codes, sizes, and spacing from `Aesthetic.md`.
3. **Negative constraints** — what to avoid (e.g., "no blur, no rounded corners >4px, no glassmorphism").
4. **Reference examples** — link to existing approved assets in the same category.
5. **Validation method** — how the output will be tested.

### Example prompt template (sprites)

```
Generate an 8-bit pixel art sprite for [ASSET_NAME] at [SIZE]px.
Color palette: [LIST EXACT HEX VALUES FROM AESTHETIC.MD].
Style constraints: hard edges, no anti-aliasing, no blur shadows.
Silhouette must be recognizable at 16×16.
Background: transparent.
Provide idle animation as 2-frame sprite strip.
Reference: [LINK TO APPROVED SIMILAR ASSET].
```

---

## Iteration Workflow

```
Design Doc → AI Prompt → Generate → Gate 2 Review → Integrate → Gate 3 Test → Playtest → Gate 4
                ↑                                                                    ↓
                └──────────────── Iterate if gates fail ──────────────────────────────┘
```

- **Max iterations per asset:** 3 before human manual creation.
- **Telemetry-driven iteration:** After launch, encounter tuning values are adjusted based on telemetry data (per `GameDesign.md` §9).

---

## Telemetry Hooks

| Event | Payload |
|---|---|
| `asset_loaded` | `asset_path`, `load_ms`, `bundle_size_kb` |
| `asset_generation_iteration` | `asset_type`, `iteration`, `gate_pass` |
| `content_gate_result` | `gate_number`, `asset_id`, `passed`, `notes` |

---

## Acceptance Criteria

| Criterion | Target |
|---|---|
| AI-generated sprites pass Gate 2 within 2 iterations | ≥80% of sprites |
| AI-generated music loops cleanly | 100% — no audible seam |
| All assets conform to naming convention | 100% — automated lint check |
| No asset exceeds performance budget | 100% — automated size check |
| Content pipeline documented enough for new contributor to follow | New contributor produces conforming asset within 1 hour |
