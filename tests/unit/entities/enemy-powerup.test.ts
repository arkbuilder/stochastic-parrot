import { describe, it, expect } from 'vitest';
import { createEnemy, updateEnemy } from '../../../src/entities/enemy';
import { createPowerup } from '../../../src/entities/powerup';

describe('Burrower enemy', () => {
  it('starts hidden with a timer', () => {
    const burrower = createEnemy('b1', 'burrower', 50, 50, 80, 80, 30);
    expect(burrower.state.kind).toBe('burrower');
    expect(burrower.state.burrowPhase).toBe('hidden');
    expect(burrower.state.burrowTimer).toBeGreaterThan(0);
  });

  it('emerges near player position after hidden timer expires', () => {
    const burrower = createEnemy('b1', 'burrower', 50, 50, 80, 80, 30);
    // Force timer to expire
    burrower.state.burrowTimer = 0.01;
    updateEnemy(burrower, 0.02, { x: 120, y: 200 });
    expect(burrower.state.burrowPhase).toBe('emerging');
    expect(burrower.visible).toBe(true);
  });

  it('transitions through phases: emerging → chasing → lunging', () => {
    const burrower = createEnemy('b1', 'burrower', 50, 50, 80, 80, 30);
    const playerPos = { x: 60, y: 60 };

    // Skip to emerging
    burrower.state.burrowPhase = 'emerging';
    burrower.state.burrowTimer = 0.01;
    updateEnemy(burrower, 0.02, playerPos);
    expect(burrower.state.burrowPhase).toBe('chasing');

    // Chasing: when close to player, should lunge
    burrower.position.x = playerPos.x + 10;
    burrower.position.y = playerPos.y + 5;
    updateEnemy(burrower, 0.1, playerPos);
    expect(burrower.state.burrowPhase).toBe('lunging');
  });

  it('does not move when defeated', () => {
    const burrower = createEnemy('b1', 'burrower', 50, 50, 80, 80, 30);
    burrower.state.defeated = true;
    burrower.state.burrowPhase = 'chasing';
    const startX = burrower.position.x;
    updateEnemy(burrower, 1.0, { x: 120, y: 200 });
    expect(burrower.position.x).toBe(startX);
  });

  it('patrol enemies still work with optional playerPos', () => {
    const crab = createEnemy('c1', 'crab', 10, 10, 100, 10, 40);
    const startX = crab.position.x;
    updateEnemy(crab, 0.5); // no playerPos
    expect(crab.position.x).toBeGreaterThan(startX);
  });
});

// ── New enemy kinds ──────────────────────────────────────────

describe('Fire Crab enemy', () => {
  it('creates with fire_crab kind', () => {
    const enemy = createEnemy('fc1', 'fire_crab', 10, 10, 100, 10, 32);
    expect(enemy.state.kind).toBe('fire_crab');
  });

  it('patrols like a regular crab', () => {
    const enemy = createEnemy('fc1', 'fire_crab', 10, 10, 100, 10, 40);
    const startX = enemy.position.x;
    updateEnemy(enemy, 0.5);
    expect(enemy.position.x).toBeGreaterThan(startX);
  });

  it('does not use burrow phases', () => {
    const enemy = createEnemy('fc1', 'fire_crab', 10, 10, 100, 10, 32);
    expect(enemy.state.burrowPhase).toBe('chasing'); // non-burrower default
  });
});

describe('Shadow Jelly enemy', () => {
  it('creates with shadow_jelly kind', () => {
    const enemy = createEnemy('sj1', 'shadow_jelly', 10, 10, 80, 80, 24);
    expect(enemy.state.kind).toBe('shadow_jelly');
  });

  it('patrols like a regular jellyfish', () => {
    const enemy = createEnemy('sj1', 'shadow_jelly', 10, 10, 100, 10, 20);
    const startX = enemy.position.x;
    updateEnemy(enemy, 0.5);
    expect(enemy.position.x).toBeGreaterThan(startX);
  });
});

describe('Sand Wyrm enemy', () => {
  it('starts hidden like a burrower', () => {
    const enemy = createEnemy('sw1', 'sand_wyrm', 50, 50, 80, 80, 38);
    expect(enemy.state.kind).toBe('sand_wyrm');
    expect(enemy.state.burrowPhase).toBe('hidden');
    expect(enemy.state.burrowTimer).toBeGreaterThan(0);
  });

  it('emerges near player when timer expires', () => {
    const enemy = createEnemy('sw1', 'sand_wyrm', 50, 50, 80, 80, 38);
    enemy.state.burrowTimer = 0.01;
    updateEnemy(enemy, 0.02, { x: 120, y: 200 });
    expect(enemy.state.burrowPhase).toBe('emerging');
    expect(enemy.visible).toBe(true);
  });

  it('chases longer than regular burrower', () => {
    const enemy = createEnemy('sw1', 'sand_wyrm', 50, 50, 80, 80, 38);
    enemy.state.burrowPhase = 'emerging';
    enemy.state.burrowTimer = 0.01;
    updateEnemy(enemy, 0.02, { x: 120, y: 200 });
    expect(enemy.state.burrowPhase).toBe('chasing');
    // Sand wyrm gets 4.0s chase (vs 3.0s for burrower)
    expect(enemy.state.burrowTimer).toBeCloseTo(4.0, 0);
  });
});

describe('Reef Urchin enemy', () => {
  it('creates with urchin kind and wider hitbox', () => {
    const enemy = createEnemy('u1', 'urchin', 50, 50, 50, 50, 0);
    expect(enemy.state.kind).toBe('urchin');
    expect(enemy.bounds.w).toBe(18);
    expect(enemy.bounds.h).toBe(18);
  });

  it('starts with spike timer and spikes retracted', () => {
    const enemy = createEnemy('u1', 'urchin', 50, 50, 50, 50, 0);
    expect(enemy.state.spikeTimer).toBeGreaterThan(0);
    expect(enemy.state.spikesOut).toBe(false);
  });

  it('does not move (stationary)', () => {
    const enemy = createEnemy('u1', 'urchin', 50, 50, 50, 50, 0);
    const startX = enemy.position.x;
    const startY = enemy.position.y;
    updateEnemy(enemy, 1.0);
    expect(enemy.position.x).toBe(startX);
    expect(enemy.position.y).toBe(startY);
  });

  it('cycles spikes after timer expires', () => {
    const enemy = createEnemy('u1', 'urchin', 50, 50, 50, 50, 0);
    enemy.state.spikeTimer = 0.01;
    updateEnemy(enemy, 0.02);
    expect(enemy.state.spikesOut).toBe(true);
    expect(enemy.bounds.w).toBe(24); // expanded hitbox
  });

  it('retracts spikes after spike-out timer expires', () => {
    const enemy = createEnemy('u1', 'urchin', 50, 50, 50, 50, 0);
    // Extend spikes
    enemy.state.spikeTimer = 0.01;
    updateEnemy(enemy, 0.02);
    expect(enemy.state.spikesOut).toBe(true);
    // Now retract
    enemy.state.spikeTimer = 0.01;
    updateEnemy(enemy, 0.02);
    expect(enemy.state.spikesOut).toBe(false);
    expect(enemy.bounds.w).toBe(18); // back to normal
  });
});

describe('Phantom Ray enemy', () => {
  it('creates with ray kind', () => {
    const enemy = createEnemy('r1', 'ray', 10, 50, 200, 200, 36);
    expect(enemy.state.kind).toBe('ray');
  });

  it('patrols diagonally between A and B', () => {
    const enemy = createEnemy('r1', 'ray', 10, 50, 200, 200, 60);
    const startX = enemy.position.x;
    const startY = enemy.position.y;
    updateEnemy(enemy, 0.5);
    expect(enemy.position.x).toBeGreaterThan(startX);
    expect(enemy.position.y).toBeGreaterThan(startY);
  });
});

describe('Powerup kinds', () => {
  it('creates freeze powerup with 3s duration', () => {
    const pu = createPowerup('f1', 'freeze', 50, 50);
    expect(pu.state.kind).toBe('freeze');
    expect(pu.state.duration).toBe(3);
    expect(pu.state.collected).toBe(false);
  });

  it('creates reveal powerup with 5s duration', () => {
    const pu = createPowerup('r1', 'reveal', 50, 50);
    expect(pu.state.kind).toBe('reveal');
    expect(pu.state.duration).toBe(5);
  });

  it('speed and shield durations unchanged', () => {
    expect(createPowerup('s1', 'speed', 0, 0).state.duration).toBe(5);
    expect(createPowerup('s2', 'shield', 0, 0).state.duration).toBe(8);
  });
});
