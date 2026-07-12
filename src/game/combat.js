import {
  MISSILE_COUNT,
  MISSILE_DAMAGE_RATIO,
  MISSILE_SPAWN_RADIUS,
  MISSILE_SPEED,
  MISSILE_VIEW_ANGLE,
  MISSILE_VIEW_RANGE,
  PROJECTILE_RADIUS,
  PROJECTILE_SPEED,
} from './constants.js'
import { direction, distance, normalizeAngle } from './vector.js'

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

// Encontra o inimigo vivo mais próximo dentro do campo de visão cônico de um
// míssil: um cone de MISSILE_VIEW_ANGLE (180°) centrado na direção pra onde
// ele está indo (headingX/Y — não precisa ser unitário), até MISSILE_VIEW_RANGE
// de distância. Um míssil não enxerga "pelas costas" — só passa a perseguir
// um inimigo atrás dele se a própria curva (limitada, ver updateHoming em
// projectiles.js) eventualmente virar a cabeça dele o bastante.
export function findNearestVisibleEnemy(state, x, y, headingX, headingY) {
  const heading = Math.atan2(headingY, headingX)
  let nearest = null
  let nearestDist = Infinity
  for (const e of state.enemies) {
    const d = distance(x, y, e.x, e.y)
    if (d >= nearestDist || d > MISSILE_VIEW_RANGE) continue
    if (d > 0) {
      const toEnemy = Math.atan2(e.y - y, e.x - x)
      if (Math.abs(normalizeAngle(toEnemy - heading)) > MISSILE_VIEW_ANGLE / 2) continue
    }
    nearest = e
    nearestDist = d
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
// inimigo mais próximo de si (podem mirar alvos diferentes entre si). Cada
// um nasce "olhando" pra fora do núcleo, então só trava de cara num alvo que
// já esteja dentro do seu cone de visão (ver findNearestVisibleEnemy); senão
// sai voando pra fora sem alvo. O teleguiamento em si acontece em
// updateProjectiles (projectiles.js).
function fireMissiles(state, rng) {
  for (let i = 0; i < MISSILE_COUNT; i++) {
    const angle = rng() * Math.PI * 2
    const headingX = Math.cos(angle)
    const headingY = Math.sin(angle)
    const x = state.core.x + headingX * MISSILE_SPAWN_RADIUS
    const y = state.core.y + headingY * MISSILE_SPAWN_RADIUS
    const target = findNearestVisibleEnemy(state, x, y, headingX, headingY)
    const dir = target ? direction(x, y, target.x, target.y) : { x: headingX, y: headingY }
    state.projectiles.push({
      x,
      y,
      vx: dir.x * MISSILE_SPEED,
      vy: dir.y * MISSILE_SPEED,
      radius: PROJECTILE_RADIUS,
      damage: state.core.damage * MISSILE_DAMAGE_RATIO,
      homing: true,
      target, // trava nesse alvo até ele morrer/sumir — ver updateHoming em projectiles.js
      trail: [],
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
