import { ENEMY_DAMAGE, ENEMY_HP, ENEMY_RADIUS, ENEMY_SPEED } from './constants.js'
import { direction, distance } from './vector.js'

// Escolhe um ponto aleatório no perímetro do retângulo width x height —
// os inimigos sempre nascem vindo de alguma borda da tela.
function randomEdgePoint(width, height, rng) {
  const perimeter = 2 * (width + height)
  let t = rng() * perimeter
  if (t < width) return { x: t, y: 0 }
  t -= width
  if (t < height) return { x: width, y: t }
  t -= height
  if (t < width) return { x: width - t, y: height }
  t -= width
  return { x: 0, y: height - t }
}

// Cria um inimigo numa borda aleatória, já mirando o núcleo (a direção é fixada
// no nascimento — o núcleo nunca se move, então isso equivale a persegui-lo).
export function spawnEnemy(state, rng = Math.random) {
  const { x, y } = randomEdgePoint(state.width, state.height, rng)
  const dir = direction(x, y, state.core.x, state.core.y)
  state.enemies.push({
    x,
    y,
    vx: dir.x * ENEMY_SPEED,
    vy: dir.y * ENEMY_SPEED,
    radius: ENEMY_RADIUS,
    hp: ENEMY_HP,
    maxHp: ENEMY_HP,
  })
}

// Move os inimigos e aplica dano ao núcleo quando um deles chega perto o
// bastante — esse inimigo é consumido no impacto (não fica empurrando).
export function updateEnemies(state, dt) {
  const alive = []
  for (const e of state.enemies) {
    e.x += e.vx * dt
    e.y += e.vy * dt
    const d = distance(e.x, e.y, state.core.x, state.core.y)
    if (d <= state.core.radius + e.radius) {
      state.core.hp = Math.max(0, state.core.hp - ENEMY_DAMAGE)
      continue // inimigo se sacrifica no impacto
    }
    alive.push(e)
  }
  state.enemies = alive
}
