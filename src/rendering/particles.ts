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
  private particles: Particle[] = [];

  emitFogEdge(x: number, y: number): void {
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
    for (const particle of this.particles) {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  }
}
