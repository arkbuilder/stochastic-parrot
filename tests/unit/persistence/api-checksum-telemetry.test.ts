/**
 * API Client, Checksum, and Telemetry — Unit Tests
 *
 * ApiClient:
 * - submitScore POST to /api/scores
 * - getLeaderboard GET with query params
 * - error handling (non-ok response)
 * - x-device-id header present
 *
 * computeScoreChecksum:
 * - returns a 64-char hex string (SHA-256)
 * - same input → same output (deterministic)
 * - different input → different output
 *
 * TelemetryClient:
 * - emit buffers events
 * - auto-flush at flushSize
 * - flush sends to sink and clears buffer
 * - flush empty buffer is no-op
 *
 * ConsoleSink:
 * - send logs to console (no error)
 * - send empty array is no-op
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../../../src/persistence/api-client';
import { computeScoreChecksum } from '../../../src/persistence/checksum';
import { TelemetryClient } from '../../../src/telemetry/telemetry-client';
import { ConsoleSink } from '../../../src/telemetry/console-sink';
import type { TelemetryEventName } from '../../../src/telemetry/events';

// ── ApiClient Tests ─────────────────────────────────────────

describe('ApiClient', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalLocalStorage: typeof globalThis.localStorage;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    originalLocalStorage = globalThis.localStorage;

    // Mock localStorage
    const store: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      key: () => null,
      length: 0,
    } as Storage;

    // Mock crypto.randomUUID
    if (!globalThis.crypto) {
      (globalThis as any).crypto = {};
    }
    (globalThis.crypto as any).randomUUID = () => 'test-uuid-1234';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
  });

  it('submitScore sends POST to /api/scores', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true } as Response),
    );
    const client = new ApiClient();
    await client.submitScore({
      playerId: 'p1',
      boardType: 'island',
      islandId: 'island_01',
      score: 1000,
      timeMs: 5000,
      accuracyPct: 0.85,
      grade: 'A',
      checksum: 'abc123',
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/scores', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('getLeaderboard sends GET with query params', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ top10: [], playerRank: null }),
      } as unknown as Response),
    );
    const client = new ApiClient();
    await client.getLeaderboard('island', 'island_01', 'p1');

    const url = (globalThis.fetch as any).mock.calls[0][0] as string;
    expect(url).toContain('/api/scores?');
    expect(url).toContain('boardType=island');
    expect(url).toContain('islandId=island_01');
    expect(url).toContain('playerId=p1');
  });

  it('throws on non-ok response', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 500 } as Response),
    );
    const client = new ApiClient();
    await expect(client.submitScore({
      playerId: 'p1', boardType: 'island', score: 0, timeMs: 0,
      accuracyPct: 0, grade: 'D', checksum: '',
    })).rejects.toThrow('API request failed');
  });

  it('includes x-device-id header', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true } as Response),
    );
    const client = new ApiClient();
    await client.submitScore({
      playerId: 'p1', boardType: 'island', score: 0, timeMs: 0,
      accuracyPct: 0, grade: 'D', checksum: '',
    });

    const headers = (globalThis.fetch as any).mock.calls[0][1].headers;
    expect(headers['x-device-id']).toBeDefined();
    expect(headers['x-device-id'].length).toBeGreaterThan(0);
  });

  it('reuses device ID from localStorage', async () => {
    localStorage.setItem('dr_device_id', 'stored-id');
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true } as Response),
    );
    const client = new ApiClient();
    await client.submitScore({
      playerId: 'p1', boardType: 'island', score: 0, timeMs: 0,
      accuracyPct: 0, grade: 'D', checksum: '',
    });

    const headers = (globalThis.fetch as any).mock.calls[0][1].headers;
    expect(headers['x-device-id']).toBe('stored-id');
  });
});

// ── computeScoreChecksum Tests ──────────────────────────────

describe('computeScoreChecksum', () => {
  const basePayload = {
    playerId: 'player1',
    boardType: 'island',
    islandId: 'island_01',
    score: 1500,
    timeMs: 12000,
    accuracyPct: 0.92,
    grade: 'A',
  };

  it('returns a 64-character hex string (SHA-256)', async () => {
    const hash = await computeScoreChecksum(basePayload);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('same input produces same output (deterministic)', async () => {
    const a = await computeScoreChecksum(basePayload);
    const b = await computeScoreChecksum(basePayload);
    expect(a).toBe(b);
  });

  it('different score produces different hash', async () => {
    const a = await computeScoreChecksum(basePayload);
    const b = await computeScoreChecksum({ ...basePayload, score: 999 });
    expect(a).not.toBe(b);
  });

  it('different playerId produces different hash', async () => {
    const a = await computeScoreChecksum(basePayload);
    const b = await computeScoreChecksum({ ...basePayload, playerId: 'player2' });
    expect(a).not.toBe(b);
  });

  it('handles missing islandId gracefully', async () => {
    const payload = { ...basePayload, islandId: undefined };
    const hash = await computeScoreChecksum(payload);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ── TelemetryClient Tests ───────────────────────────────────

describe('TelemetryClient', () => {
  let mockSink: { send: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockSink = { send: vi.fn(() => Promise.resolve()) };
  });

  it('emit buffers events', () => {
    const client = new TelemetryClient(mockSink, 10);
    client.emit('encounter_started' as TelemetryEventName, { foo: 'bar' });
    // Not flushed yet (under threshold)
    expect(mockSink.send).not.toHaveBeenCalled();
  });

  it('auto-flushes at flushSize', () => {
    const client = new TelemetryClient(mockSink, 3);
    client.emit('encounter_started' as TelemetryEventName, {});
    client.emit('encounter_started' as TelemetryEventName, {});
    client.emit('encounter_started' as TelemetryEventName, {}); // triggers flush
    expect(mockSink.send).toHaveBeenCalledTimes(1);
    expect(mockSink.send.mock.calls[0][0]).toHaveLength(3);
  });

  it('flush sends buffered events to sink', async () => {
    const client = new TelemetryClient(mockSink, 100);
    client.emit('encounter_started' as TelemetryEventName, { a: 1 });
    client.emit('encounter_started' as TelemetryEventName, { b: 2 });
    await client.flush();
    expect(mockSink.send).toHaveBeenCalledTimes(1);
    expect(mockSink.send.mock.calls[0][0]).toHaveLength(2);
  });

  it('flush on empty buffer is no-op', async () => {
    const client = new TelemetryClient(mockSink, 10);
    await client.flush();
    expect(mockSink.send).not.toHaveBeenCalled();
  });

  it('events contain eventName, payload, and ts', () => {
    const client = new TelemetryClient(mockSink, 1);
    client.emit('encounter_started' as TelemetryEventName, { test: true });
    const events = mockSink.send.mock.calls[0][0];
    expect(events[0]).toMatchObject({
      eventName: 'encounter_started',
      payload: { test: true },
    });
    expect(events[0].ts).toBeTruthy();
  });

  it('buffer is cleared after flush', async () => {
    const client = new TelemetryClient(mockSink, 100);
    client.emit('encounter_started' as TelemetryEventName, {});
    await client.flush();
    await client.flush(); // second flush should be no-op
    expect(mockSink.send).toHaveBeenCalledTimes(1);
  });
});

// ── ConsoleSink Tests ───────────────────────────────────────

describe('ConsoleSink', () => {
  it('send does not throw', async () => {
    const sink = new ConsoleSink();
    await expect(sink.send([
      { eventName: 'test' as any, payload: {}, ts: new Date().toISOString() },
    ])).resolves.not.toThrow();
  });

  it('send empty array does not throw', async () => {
    const sink = new ConsoleSink();
    await expect(sink.send([])).resolves.not.toThrow();
  });
});
