import { MISSILE_TRAIL_LENGTH, MISSILE_TURN_RATE } from './constants.js'
import { findNearestVisibleEnemy } from './combat.js'
import { spawnDeathBurst } from './particles.js'
import { direction, distance, normalizeAngle } from './vector.js'

const OFFSCREEN_MARGIN = 40

// Mísseis (p.homing) perseguem um alvo travado (p.target), não "o mais
// próximo agora" recalculado do zero a cada frame — isso evita ficar
// quicando entre dois inimigos de distância parecida. Só troca de alvo
// quando o atual morre/sai do campo, e mesmo assim só enxerga um novo alvo
// dentro do próprio cone de visão (ver findNearestVisibleEnemy em
// combat.js) — não vira instantaneamente pra mirar alguém atrás dele. A
// curva em si é limitada por MISSILE_TURN_RATE (não é teleguiado perfeito,
// tem atraso pra virar); sem nenhum alvo visível, tende a se afastar do
// núcleo até se perder de vista.
function updateHoming(p, state, dt) {
  if (!p.target || !state.enemies.includes(p.target)) {
    p.target = findNearestVisibleEnemy(state, p.x, p.y, p.vx, p.vy)
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

// Guarda um rastro curto (últimas MISSILE_TRAIL_LENGTH posições) só pra
// desenhar atrás do míssil — puramente visual, ver drawMissileTrail em render.js.
function updateMissileTrail(p) {
  if (!p.trail) p.trail = []
  p.trail.push({ x: p.x, y: p.y })
  if (p.trail.length > MISSILE_TRAIL_LENGTH) p.trail.shift()
}

// Move os projéteis, aplica dano no primeiro inimigo que encostarem e remove
// tanto o projétil (some no impacto) quanto inimigos cujo hp zerou. Incrementa
// `state.kills` a cada inimigo abatido e dispara uma explosão de partículas na
// morte.
export function updateProjectiles(state, dt, rng = Math.random) {
  const aliveProjectiles = []

  for (const p of state.projectiles) {
    if (p.homing) {
      updateMissileTrail(p)
      updateHoming(p, state, dt)
    }
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
