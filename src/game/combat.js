import { PROJECTILE_RADIUS, PROJECTILE_SPEED } from './constants.js'
import { direction, distance } from './vector.js'

// Encontra o inimigo vivo mais próximo do núcleo, dentro do alcance da torre.
// Ataque/cadência/alcance ficam em state.core — o jogador ajusta na hora (ver
// game/upgrades.js), então não podem ser constantes fixas.
export function findNearestEnemy(state) {
  let nearest = null
  let nearestDist = Infinity
  for (const e of state.enemies) {
    const d = distance(state.core.x, state.core.y, e.x, e.y)
    if (d <= state.core.range && d < nearestDist) {
      nearest = e
      nearestDist = d
    }
  }
  return nearest
}

// O núcleo mira no inimigo mais próximo dentro do alcance e atira um projétil
// reto na direção dele (sem teleguiado — se o alvo desviar, o tiro pode errar).
export function updateCombat(state, dt) {
  state.fireTimer -= dt
  if (state.fireTimer > 0) return
  const target = findNearestEnemy(state)
  if (!target) return

  const dir = direction(state.core.x, state.core.y, target.x, target.y)
  state.projectiles.push({
    x: state.core.x,
    y: state.core.y,
    vx: dir.x * PROJECTILE_SPEED,
    vy: dir.y * PROJECTILE_SPEED,
    radius: PROJECTILE_RADIUS,
    damage: state.core.damage,
  })
  state.fireTimer = state.core.fireInterval
}
