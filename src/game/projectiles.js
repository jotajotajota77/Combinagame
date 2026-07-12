import { MISSILE_TURN_RATE } from './constants.js'
import { findNearestEnemyTo } from './combat.js'
import { spawnDeathBurst } from './particles.js'
import { direction, distance } from './vector.js'

const OFFSCREEN_MARGIN = 40

// Normaliza um ângulo pro intervalo (-PI, PI] — precisa disso pra saber qual
// é o menor giro entre o rumo atual e o desejado (evita girar pelo caminho
// mais longo quando cruza a marca de ±180°).
function normalizeAngle(angle) {
  let a = angle % (Math.PI * 2)
  if (a > Math.PI) a -= Math.PI * 2
  if (a < -Math.PI) a += Math.PI * 2
  return a
}

// Mísseis (p.homing) perseguem um alvo travado (p.target), não "o mais
// próximo agora" recalculado do zero a cada frame — isso evita ficar
// quicando entre dois inimigos de distância parecida. Só troca de alvo
// quando o atual morre/sai do campo. A curva é limitada por
// MISSILE_TURN_RATE (não é teleguiado perfeito, tem atraso pra virar); sem
// nenhum alvo no mapa, tende a se afastar do núcleo até se perder de vista.
function updateHoming(p, state, dt) {
  if (!p.target || !state.enemies.includes(p.target)) {
    p.target = findNearestEnemyTo(state, p.x, p.y)
  }

  const desired = p.target
    ? direction(p.x, p.y, p.target.x, p.target.y)
    : direction(state.core.x, state.core.y, p.x, p.y)
  if (desired.x === 0 && desired.y === 0) return // sobre o próprio alvo/núcleo — mantém o rumo

  const speed = Math.hypot(p.vx, p.vy)
  const currentAngle = Math.atan2(p.vy, p.vx)
  const desiredAngle = Math.atan2(desired.y, desired.x)
  const maxTurn = MISSILE_TURN_RATE * dt
  const delta = Math.max(-maxTurn, Math.min(maxTurn, normalizeAngle(desiredAngle - currentAngle)))
  const newAngle = currentAngle + delta

  p.vx = Math.cos(newAngle) * speed
  p.vy = Math.sin(newAngle) * speed
}

// Move os projéteis, aplica dano no primeiro inimigo que encostarem e remove
// tanto o projétil (some no impacto) quanto inimigos cujo hp zerou. Incrementa
// `state.kills` a cada inimigo abatido e dispara uma explosão de partículas na
// morte.
export function updateProjectiles(state, dt, rng = Math.random) {
  const aliveProjectiles = []

  for (const p of state.projectiles) {
    if (p.homing) updateHoming(p, state, dt)
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
