import { spawnDeathBurst } from './particles.js'
import { distance } from './vector.js'

const OFFSCREEN_MARGIN = 40

// Move os projéteis, aplica dano no primeiro inimigo que encostarem e remove
// tanto o projétil (some no impacto) quanto inimigos cujo hp zerou. Incrementa
// `state.kills` a cada inimigo abatido e dispara uma explosão de partículas na
// morte.
export function updateProjectiles(state, dt, rng = Math.random) {
  const aliveProjectiles = []

  for (const p of state.projectiles) {
    p.x += p.vx * dt
    p.y += p.vy * dt

    let hit = null
    for (const e of state.enemies) {
      if (distance(p.x, p.y, e.x, e.y) <= p.radius + e.radius) {
        hit = e
        break
      }
    }

    if (hit) {
      hit.hp -= p.damage
      continue // o projétil se consome no impacto, acerte ou não mate
    }

    const outOfBounds =
      p.x < -OFFSCREEN_MARGIN ||
      p.y < -OFFSCREEN_MARGIN ||
      p.x > state.width + OFFSCREEN_MARGIN ||
      p.y > state.height + OFFSCREEN_MARGIN
    if (!outOfBounds) aliveProjectiles.push(p)
  }

  state.projectiles = aliveProjectiles

  const alive = []
  for (const e of state.enemies) {
    if (e.hp <= 0) {
      state.kills++
      state.coins += e.coinValue ?? 0
      spawnDeathBurst(state, e.x, e.y, e.color, rng)
    } else {
      alive.push(e)
    }
  }
  state.enemies = alive
}
