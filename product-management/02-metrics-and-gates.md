# Metrics + Decision Gates (v0)

## North-star metric
7-day concept retention score improvement among users who complete onboarding (baseline vs follow-up encounter performance).

## Activation metrics
- Time to first successful place+recall loop
- Onboarding completion rate
- First-session completion rate

## Engagement metrics
- Session replay rate (D1/D7)
- Avg encounters completed per session
- Concept journal revisit rate

## Quality metrics
- Crash-free session rate
- Recovery success rate after interruption
- E2E pass stability in CI

## Decision gates
### Gate A — Activation
>= 70% of new users complete onboarding and execute at least one successful recall loop.

### Gate B — Retention
>= 35% of activated users return within 7 days and improve recall outcomes.

### Gate C — Reliability
>= 99% crash-free sessions in monitored release window and no blocker regressions.

If a gate fails, pause scope expansion and run focused remediation sprint.
