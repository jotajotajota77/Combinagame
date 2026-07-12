import {
  MISSILE_COUNT,
  MISSILE_DAMAGE_RATIO,
  MISSILE_SPAWN_RADIUS,
  MISSILE_SPEED,
  PROJECTILE_RADIUS,
  PROJECTILE_SPEED,
} from './constants.js'
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

// Encontra o inimigo vivo mais próximo de um ponto qualquer — usado pelos
// mísseis, que perseguem o alvo mais próximo de si mesmos (não do núcleo).
export function findNearestEnemyTo(state, x, y) {
  let nearest = null
  let nearestDist = Infinity
  for (const e of state.enemies) {
    const d = distance(x, y, e.x, e.y)
    if (d < nearestDist) {
      nearest = e
      nearestDist = d
    }
  }
  return nearest
}

function fireProjectile(state, target) {
  const dir = direction(state.core.x, state.core.y, target.x, target.y)
  state.projectiles.push({
    x: state.core.x,
    y: state.core.y,
    vx: dir.x * PROJECTILE_SPEED,
    vy: dir.y * PROJECTILE_SPEED,
    radius: PROJECTILE_RADIUS,
    damage: state.core.damage,
  })
}

// Efeito "míssil": em vez de um tiro reto só, nascem MISSILE_COUNT mísseis
// mais fracos em pontos aleatórios ao redor do núcleo — cada um persegue o
// inimigo mais próximo de si (podem mirar alvos diferentes entre si). O
// teleguiamento em si acontece em updateProjectiles (projectiles.js).
function fireMissiles(state, rng) {
  for (let i = 0; i < MISSILE_COUNT; i++) {
    const angle = rng() * Math.PI * 2
    const x = state.core.x + Math.cos(angle) * MISSILE_SPAWN_RADIUS
    const y = state.core.y + Math.sin(angle) * MISSILE_SPAWN_RADIUS
    const target = findNearestEnemyTo(state, x, y)
    const dir = target ? direction(x, y, target.x, target.y) : { x: Math.cos(angle), y: Math.sin(angle) }
    state.projectiles.push({
      x,
      y,
      vx: dir.x * MISSILE_SPEED,
      vy: dir.y * MISSILE_SPEED,
      radius: PROJECTILE_RADIUS,
      damage: state.core.damage * MISSILE_DAMAGE_RATIO,
      homing: true,
    })
  }
}

// O núcleo mira no inimigo mais próximo dentro do alcance e atira. Sem o
// efeito míssil, é um projétil reto (sem teleguiado — se o alvo desviar, o
// tiro pode errar); com o efeito ligado, vira uma saraivada de mísseis
// teleguiados (ver fireMissiles).
export function updateCombat(state, dt, rng = Math.random) {
  state.fireTimer -= dt
  if (state.fireTimer > 0) return
  const target = findNearestEnemy(state)
  if (!target) return

  if (state.effects?.missile) {
    fireMissiles(state, rng)
  } else {
    fireProjectile(state, target)
  }
  state.fireTimer = state.core.fireInterval
}
