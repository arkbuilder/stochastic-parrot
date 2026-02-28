export type InputAction =
  | { type: 'primary'; x: number; y: number }
  | { type: 'primary_end'; x: number; y: number }
  | { type: 'move'; dx: number; dy: number }
  | { type: 'secondary'; x: number; y: number }
  | { type: 'drag'; x: number; y: number }
  | { type: 'pause' };

export type RawInputAction =
  | { type: 'primary'; screenX: number; screenY: number }
  | { type: 'primary_end'; screenX: number; screenY: number }
  | { type: 'secondary'; screenX: number; screenY: number }
  | { type: 'drag'; screenX: number; screenY: number }
  | { type: 'move'; dx: number; dy: number }
  | { type: 'pause' };

export interface InputProvider {
  poll(): RawInputAction[];
}
