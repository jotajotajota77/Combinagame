import { updateEnemies } from './enemies.js'
import { updateCombat } from './combat.js'
import { updateProjectiles } from './projectiles.js'
import { updateParticles } from './particles.js'
import { updateWaves } from './waves.js'

// Avança o jogo em `dt` segundos. Muta `state` in-place (é chamado a cada
// frame do loop principal, então evitar realocar tudo importa).
export function stepGame(state, dt, rng = Math.random) {
  if (state.gameOver) return state

  state.time += dt

  updateEnemies(state, dt, rng)
  updateCombat(state, dt)
  updateProjectiles(state, dt, rng)
  updateWaves(state, dt, rng)
  updateParticles(state, dt)

  if (state.core.hp <= 0) {
    state.core.hp = 0
    state.gameOver = true
  }

  return state
}
