# Agent Consumption Guidelines

## Objective
Define how the implementation agent should retrieve and apply knowledge files while building the game.

## Scope
- In scope: retrieval order, conflict resolution, and update workflow.
- Out of scope: model-specific prompt hacks.

## Hard Constraints
- `Design/GameDesign.md` is the source of truth.
- If a knowledge file conflicts with design requirements, design requirements win.

## Implementation Rules
1. Read in this order: standards -> product -> engineering -> game-design -> art/audio/education/accessibility.
2. Before coding a feature, load only the smallest relevant subset of files.
3. If uncertainty exists, prefer measurable constraints over stylistic guidance.
4. When editing gameplay logic, also load telemetry and acceptance docs.

## API/Data Contracts
- Feature PR/task should cite files used by path.
- Each implementation task should map to at least one acceptance criterion.

## Acceptance Criteria
- Every implemented feature can be traced to one or more knowledge docs.
- No feature ships without matching telemetry and acceptance criteria.

## Telemetry Hooks
- `knowledge_file_loaded`
- `knowledge_conflict_detected`

## Anti-Patterns
- Reading all files every time.
- Implementing from memory without loading relevant docs.

## Handoff Checklist
- [ ] Retrieval order followed
- [ ] Conflicts resolved against source of truth
- [ ] Traceability noted in task artifacts
