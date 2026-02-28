export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'star';
  gravity: number;
  fadeOut: boolean;
}

export class ParticleSystem {
  private static reducedMotion = false;
  private static performanceDisabled = false;
  private static frameSkip = false;

  private particles: Particle[] = [];

  static setReducedMotion(enabled: boolean): void {
    ParticleSystem.reducedMotion = enabled;
  }

  static setPerformanceDisabled(enabled: boolean): void {
    ParticleSystem.performanceDisabled = enabled;
  }

  static setFrameSkip(enabled: boolean): void {
    ParticleSystem.frameSkip = enabled;
  }

  private static get isSuppressed(): boolean {
    return ParticleSystem.reducedMotion || ParticleSystem.performanceDisabled || ParticleSystem.frameSkip;
  }

  private emit(overrides: Partial<Particle> & { x: number; y: number }): void {
    if (ParticleSystem.isSuppressed) return;
    this.particles.push({
      vx: 0, vy: 0, life: 0.5, maxLife: 0.5, color: '#fff',
      size: 2, shape: 'square', gravity: 0, fadeOut: true,
      ...overrides,
    });
  }

  emitFogEdge(x: number, y: number): void {
    if (ParticleSystem.isSuppressed) return;
    for (let i = 0; i < 3; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 10,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 16,
        life: 0.8,
        maxLife: 0.8,
        color: i % 2 === 0 ? '#7c3aed' : '#a78bfa',
        size: 2 + Math.random() * 2,
        shape: 'circle',
        gravity: -8,
      });
    }
  }

  emitSparkle(x: number, y: number): void {
    if (ParticleSystem.isSuppressed) return;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 16 + Math.random() * 20;
      this.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        color: i % 3 === 0 ? '#facc15' : i % 3 === 1 ? '#22d3ee' : '#fde047',
        size: 1.5 + Math.random() * 1.5,
        shape: 'star',
      });
    }
  }

  /** Golden burst when a concept is placed on a landmark */
  emitPlacement(x: number, y: number): void {
    if (ParticleSystem.isSuppressed) return;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 20 + Math.random() * 30;
      this.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.9,
        color: i % 2 === 0 ? '#facc15' : '#fbbf24',
        size: 2 + Math.random() * 2,
        shape: 'star',
        gravity: 15,
      });
    }
  }

  /** Small water splash / ripple */
  emitSplash(x: number, y: number): void {
    if (ParticleSystem.isSuppressed) return;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      this.emit({
        x,
        y,
        vx: Math.cos(angle) * 12,
        vy: Math.sin(angle) * 8 - 10,
        life: 0.4,
        maxLife: 0.4,
        color: i % 2 === 0 ? '#67e8f9' : '#22d3ee',
        size: 1.5,
        shape: 'circle',
        gravity: 40,
      });
    }
  }

  /** Rising smoke wisps */
  emitSmoke(x: number, y: number, count = 4): void {
    if (ParticleSystem.isSuppressed) return;
    for (let i = 0; i < count; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 8,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -12 - Math.random() * 10,
        life: 0.7 + Math.random() * 0.4,
        maxLife: 1.1,
        color: '#94a3b8',
        size: 2.5 + Math.random() * 2,
        shape: 'circle',
        gravity: -4,
      });
    }
  }

  /** Rain droplets falling down */
  emitRain(x: number, y: number, count = 3): void {
    if (ParticleSystem.isSuppressed) return;
    for (let i = 0; i < count; i++) {
      this.emit({
        x: x + Math.random() * 240,
        y: y + Math.random() * 20,
        vx: -8 + Math.random() * 4,
        vy: 80 + Math.random() * 40,
        life: 0.6,
        maxLife: 0.6,
        color: '#67e8f9',
        size: 1,
        shape: 'square',
        gravity: 20,
      });
    }
  }

  update(dt: number): void {
    if (ParticleSystem.isSuppressed) return;

    this.particles = this.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt + p.gravity * dt * dt * 0.5,
        vy: p.vy + p.gravity * dt,
        life: p.life - dt,
      }))
      .filter((p) => p.life > 0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (ParticleSystem.isSuppressed) return;

    for (const p of this.particles) {
      const alpha = p.fadeOut ? Math.max(0, p.life / p.maxLife) : Math.max(0, Math.min(1, p.life));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      switch (p.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'star': {
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x + s * 0.4, p.y - s * 0.3);
          ctx.lineTo(p.x + s, p.y);
          ctx.lineTo(p.x + s * 0.4, p.y + s * 0.3);
          ctx.lineTo(p.x, p.y + s);
          ctx.lineTo(p.x - s * 0.4, p.y + s * 0.3);
          ctx.lineTo(p.x - s, p.y);
          ctx.lineTo(p.x - s * 0.4, p.y - s * 0.3);
          ctx.closePath();
          ctx.fill();
          break;
        }
        default:
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }
}
