import type { TelemetryEvent, TelemetryEventName } from './events';
import type { TelemetrySink } from './console-sink';

export class TelemetryClient {
  private readonly buffer: TelemetryEvent[] = [];

  constructor(private readonly sink: TelemetrySink, private readonly flushSize = 10) {}

  emit(eventName: TelemetryEventName, payload: Record<string, unknown>): void {
    this.buffer.push({ eventName, payload, ts: new Date().toISOString() });

    if (this.buffer.length >= this.flushSize) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const events = this.buffer.splice(0, this.buffer.length);
    await this.sink.send(events);
  }
}
