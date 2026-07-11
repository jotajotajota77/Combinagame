import { PARTICLE_COUNT, PARTICLE_LIFE, PARTICLE_RADIUS, PARTICLE_SPEED_MAX, PARTICLE_SPEED_MIN } from './constants.js'

// Explosãozinha de partículas na cor do que morreu — puramente visual, não
// afeta a jogabilidade.
export function spawnDeathBurst(state, x, y, color, rng = Math.random) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = rng() * Math.PI * 2
    const speed = PARTICLE_SPEED_MIN + rng() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN)
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: PARTICLE_RADIUS,
      color,
      life: PARTICLE_LIFE,
      maxLife: PARTICLE_LIFE,
    })
  }
}

// Move as partículas e descarta as que já expiraram.
export function updateParticles(state, dt) {
  const alive = []
  for (const p of state.particles) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.life -= dt
    if (p.life > 0) alive.push(p)
  }
  state.particles = alive
}
