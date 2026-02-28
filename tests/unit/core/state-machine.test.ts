import { describe, expect, it } from 'vitest';
import { StateMachine } from '../../../src/core/state-machine';

describe('StateMachine', () => {
  it('supports boot -> menu -> play transition chain', () => {
    const machine = new StateMachine();

    const bootToMenu = machine.transition('menu', 'boot_complete');
    const menuToPlay = machine.transition('play', 'start_pressed');

    expect(bootToMenu.from).toBe('boot');
    expect(bootToMenu.to).toBe('menu');
    expect(menuToPlay.from).toBe('menu');
    expect(menuToPlay.to).toBe('play');
    expect(machine.current).toBe('play');
  });

  it('rejects invalid transitions', () => {
    const machine = new StateMachine();

    expect(() => machine.transition('pause', 'illegal')).toThrowError(
      'Invalid state transition: boot -> pause',
    );
  });

  it('notifies transition subscribers', () => {
    const machine = new StateMachine();
    const records: string[] = [];

    machine.subscribe((record) => {
      records.push(`${record.from}->${record.to}:${record.reason}`);
    });

    machine.transition('menu', 'boot_complete');
    machine.transition('play', 'start_pressed');

    expect(records).toEqual(['boot->menu:boot_complete', 'menu->play:start_pressed']);
  });
});
