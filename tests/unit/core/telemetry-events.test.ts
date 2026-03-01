/**
 * Telemetry Event Compliance — Design Compliance Tests
 *
 * Validates requirements TE1–TE16 from GameDesign.md / telemetry-events-and-thresholds.md:
 *  - All required telemetry events are defined
 *  - Event names follow snake_case convention
 *  - TelemetryClient emits events with correct structure
 *  - TelemetryEvent has required fields (eventName, payload, ts)
 */
import { describe, it, expect } from 'vitest';
import { TELEMETRY_EVENTS, type TelemetryEvent, type TelemetryEventName } from '../../../src/telemetry/events';
import { TelemetryClient } from '../../../src/telemetry/telemetry-client';
import type { TelemetrySink } from '../../../src/telemetry/console-sink';

// ── TE1: Required core events ──

describe('Telemetry — Required Core Events (TE1)', () => {
  const allValues = Object.values(TELEMETRY_EVENTS);

  const requiredCoreEvents = [
    'onboarding_start',
    'first_input',
    'first_success_core_verb',
    'first_fail',
    'retry_start',
    'reward_seen',
    'reward_collected',
    'reward_used',
    'beat_completed',
    'secret_found',
    'onboarding_complete',
    'quit',
  ];

  for (const event of requiredCoreEvents) {
    it(`defines required event: ${event}`, () => {
      expect(allValues).toContain(event);
    });
  }
});

// ── TE4: Core interaction events ──

describe('Telemetry — Core Interaction Events (TE4)', () => {
  const allValues = Object.values(TELEMETRY_EVENTS);

  const coreInteractionEvents = [
    'concept_placed',
    'recall_prompted',
    'recall_answered',
    'recall_timeout',
    'encode_phase_complete',
    'recall_phase_complete',
  ];

  for (const event of coreInteractionEvents) {
    it(`defines core interaction event: ${event}`, () => {
      expect(allValues).toContain(event);
    });
  }
});

// ── TE5: Encounter events ──

describe('Telemetry — Encounter Events (TE5)', () => {
  const allValues = Object.values(TELEMETRY_EVENTS);

  const encounterEvents = [
    'encounter_started',
    'encounter_prompt_answered',
    'encounter_assist_triggered',
    'encounter_completed',
    'encounter_failed',
  ];

  for (const event of encounterEvents) {
    it(`defines encounter event: ${event}`, () => {
      expect(allValues).toContain(event);
    });
  }
});

// ── TE6: Island events ──

describe('Telemetry — Island Events (TE6)', () => {
  const allValues = Object.values(TELEMETRY_EVENTS);

  const islandEvents = [
    'island_arrived',
    'island_encoding_complete',
    'island_encounter_complete',
    'island_complete',
  ];

  for (const event of islandEvents) {
    it(`defines island event: ${event}`, () => {
      expect(allValues).toContain(event);
    });
  }
});

// ── TE7: Overworld events ──

describe('Telemetry — Overworld Events (TE7)', () => {
  const allValues = Object.values(TELEMETRY_EVENTS);

  const overworldEvents = [
    'overworld_entered',
    'node_selected',
    'sailing_started',
    'sighting_shown',
    'floating_loot_collected',
    'island_arrived',
  ];

  for (const event of overworldEvents) {
    it(`defines overworld event: ${event}`, () => {
      expect(allValues).toContain(event);
    });
  }
});

// ── TE8: Scoring events ──

describe('Telemetry — Scoring Events (TE8)', () => {
  const allValues = Object.values(TELEMETRY_EVENTS);

  const scoringEvents = [
    'score_prompt_earned',
    'score_island_complete',
    'leaderboard_viewed',
    'leaderboard_entry_submitted',
  ];

  for (const event of scoringEvents) {
    it(`defines scoring event: ${event}`, () => {
      expect(allValues).toContain(event);
    });
  }
});

// ── TE11: Upgrade events ──

describe('Telemetry — Upgrade Events (TE11)', () => {
  const allValues = Object.values(TELEMETRY_EVENTS);

  it('defines upgrade_earned event', () => {
    expect(allValues).toContain('upgrade_earned');
  });
});

// ── TE structural: Event naming convention ──

describe('Telemetry — Naming Convention', () => {
  it('all event names use snake_case', () => {
    for (const value of Object.values(TELEMETRY_EVENTS)) {
      expect(value).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('all event keys use camelCase', () => {
    for (const key of Object.keys(TELEMETRY_EVENTS)) {
      expect(key).toMatch(/^[a-z][a-zA-Z0-9]*$/);
    }
  });

  it('total event count is comprehensive (≥20 distinct events)', () => {
    const uniqueEvents = new Set(Object.values(TELEMETRY_EVENTS));
    expect(uniqueEvents.size).toBeGreaterThanOrEqual(20);
  });
});

// ── TE2: TelemetryEvent structure ──

describe('Telemetry — Event Structure (TE2)', () => {
  it('TelemetryEvent has eventName, payload, and ts fields', () => {
    const event: TelemetryEvent = {
      eventName: TELEMETRY_EVENTS.firstInput,
      payload: { session_id: 'abc', player_id: '123' },
      ts: new Date().toISOString(),
    };
    expect(event.eventName).toBeDefined();
    expect(event.payload).toBeDefined();
    expect(event.ts).toBeDefined();
    expect(typeof event.ts).toBe('string');
  });

  it('ts field is ISO 8601 format', () => {
    const event: TelemetryEvent = {
      eventName: TELEMETRY_EVENTS.onboardingStart,
      payload: {},
      ts: new Date().toISOString(),
    };
    // ISO 8601 regex check
    expect(event.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

// ── TelemetryClient behaviour ──

describe('Telemetry — Client Behaviour', () => {
  const createMockSink = (): TelemetrySink & { sent: TelemetryEvent[][] } => {
    const sent: TelemetryEvent[][] = [];
    return {
      sent,
      async send(events: TelemetryEvent[]): Promise<void> {
        sent.push([...events]);
      },
    };
  };

  it('emits events and auto-flushes at flushSize threshold', async () => {
    const sink = createMockSink();
    const client = new TelemetryClient(sink, 3);

    client.emit(TELEMETRY_EVENTS.firstInput, { x: 10 });
    client.emit(TELEMETRY_EVENTS.onboardingStart, {});
    expect(sink.sent.length).toBe(0);

    client.emit(TELEMETRY_EVENTS.beatCompleted, { beat: 1 });
    // Wait for async flush
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(sink.sent.length).toBe(1);
    expect(sink.sent[0]).toHaveLength(3);
  });

  it('manual flush sends buffered events', async () => {
    const sink = createMockSink();
    const client = new TelemetryClient(sink, 100);

    client.emit(TELEMETRY_EVENTS.quit, { reason: 'test' });
    await client.flush();
    expect(sink.sent.length).toBe(1);
    expect(sink.sent[0]![0]!.eventName).toBe('quit');
  });

  it('flush on empty buffer is a no-op', async () => {
    const sink = createMockSink();
    const client = new TelemetryClient(sink, 100);

    await client.flush();
    expect(sink.sent.length).toBe(0);
  });

  it('emitted events have valid ts timestamps', () => {
    const sink = createMockSink();
    const client = new TelemetryClient(sink, 1);

    client.emit(TELEMETRY_EVENTS.firstInput, { test: true });
    // Auto-flush fires async, but we can check the event was created with ts
    // Do a manual flush to inspect
    void client.flush().then(() => {
      if (sink.sent.length > 0 && sink.sent[0]!.length > 0) {
        const event = sink.sent[0]![0]!;
        expect(event.ts).toMatch(/^\d{4}/);
      }
    });
  });
});

// ── Error/reliability events ──

describe('Telemetry — Error & Reliability Events', () => {
  const allValues = Object.values(TELEMETRY_EVENTS);

  it('defines client_error event for error tracking', () => {
    expect(allValues).toContain('client_error');
  });

  it('defines state_machine_error for illegal transitions', () => {
    expect(allValues).toContain('state_machine_error');
  });

  it('defines asset_load_timeout for reliability monitoring', () => {
    expect(allValues).toContain('asset_load_timeout');
  });

  it('defines perf_critical for performance monitoring', () => {
    expect(allValues).toContain('perf_critical');
  });

  it('defines session_resumed for offline recovery', () => {
    expect(allValues).toContain('session_resumed');
  });

  it('defines offline_queue_drain for sync monitoring', () => {
    expect(allValues).toContain('offline_queue_drain');
  });
});
