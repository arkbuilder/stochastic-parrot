import type { TelemetryEvent } from './events';

export interface TelemetrySink {
  send(events: TelemetryEvent[]): Promise<void>;
}

export class ConsoleSink implements TelemetrySink {
  async send(events: TelemetryEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    console.info('[telemetry_batch]', events);
  }
}
