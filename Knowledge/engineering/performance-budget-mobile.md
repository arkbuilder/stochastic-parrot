# Performance Budget (Mobile)

## Objective
Set minimum performance budgets so onboarding remains readable and responsive on mobile devices.

## Scope
- In scope: frame pacing, asset budgets, startup latency, memory.
- Out of scope: deep engine-level optimization.

## Hard Constraints
- Spawn to first meaningful decision <=3s.
- Fail-to-control retry <=5s.

## Implementation Rules
- Target stable frame pacing at 60fps where possible; degrade gracefully.
- Preload only assets for current + next beat.
- Use texture/audio compression appropriate for mobile web delivery.
- Avoid synchronous heavy work during active beats.

## API/Data Contracts
- Perf sample schema: `fps_avg`, `long_frame_count`, `memory_mb`, `load_ms`.

## Acceptance Criteria
- Time to interactive onboarding <=3s on target baseline device.
- No sustained long-frame spikes during `B1` and `B3`.

## Telemetry Hooks
- `perf_sample`
- `asset_bundle_loaded`

## Anti-Patterns
- Monolithic first-load asset bundles.
- Shader/effect complexity that obscures gameplay readability.

## Handoff Checklist
- [ ] Device baseline defined
- [ ] Perf thresholds instrumented
