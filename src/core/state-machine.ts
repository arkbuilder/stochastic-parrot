import type { GameState, TransitionRecord } from './types';

const ALLOWED_TRANSITIONS: Record<GameState, GameState[]> = {
  boot: ['menu'],
  menu: ['play', 'complete'],
  play: ['pause', 'complete', 'menu'],
  pause: ['play', 'menu'],
  complete: ['menu'],
};

type Listener = (record: TransitionRecord) => void;

export class StateMachine {
  private state: GameState = 'boot';
  private listeners = new Set<Listener>();

  get current(): GameState {
    return this.state;
  }

  canTransition(to: GameState): boolean {
    return ALLOWED_TRANSITIONS[this.state].includes(to);
  }

  transition(to: GameState, reason: string): TransitionRecord {
    if (!this.canTransition(to)) {
      throw new Error(`Invalid state transition: ${this.state} -> ${to}`);
    }

    const record: TransitionRecord = {
      from: this.state,
      to,
      reason,
      ts: Date.now(),
    };

    this.state = to;
    this.listeners.forEach((listener) => listener(record));
    return record;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
