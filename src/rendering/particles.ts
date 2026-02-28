export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
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

  emitFogEdge(x: number, y: number): void {
    if (ParticleSystem.isSuppressed) {
      return;
    }

    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: -Math.random() * 12,
      life: 0.7,
      color: '#7c3aed',
      size: 2,
    });
  }

  emitSparkle(x: number, y: number): void {
    if (ParticleSystem.isSuppressed) {
      return;
    }

    for (let i = 0; i < 6; i += 1) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 24,
        vy: (Math.random() - 0.5) * 24,
        life: 0.4,
        color: '#22d3ee',
        size: 2,
      });
    }
  }

  update(dt: number): void {
    if (ParticleSystem.isSuppressed) {
      return;
    }

    this.particles = this.particles
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.vx * dt,
        y: particle.y + particle.vy * dt,
        life: particle.life - dt,
      }))
      .filter((particle) => particle.life > 0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (ParticleSystem.isSuppressed) {
      return;
    }

    for (const particle of this.particles) {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  }
}
