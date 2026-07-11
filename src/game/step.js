import { ENEMY_SPAWN_INTERVAL } from './constants.js'
import { spawnEnemy, updateEnemies } from './enemies.js'
import { updateCombat } from './combat.js'
import { updateProjectiles } from './projectiles.js'

// Avança o jogo em `dt` segundos. Muta `state` in-place (é chamado a cada
// frame do loop principal, então evitar realocar tudo importa).
export function stepGame(state, dt, rng = Math.random) {
  if (state.gameOver) return state

  state.time += dt

  state.spawnTimer -= dt
  if (state.spawnTimer <= 0) {
    spawnEnemy(state, rng)
    state.spawnTimer += ENEMY_SPAWN_INTERVAL
  }

  updateEnemies(state, dt)
  updateCombat(state, dt)
  updateProjectiles(state, dt)

  if (state.core.hp <= 0) {
    state.core.hp = 0
    state.gameOver = true
  }

  return state
}
