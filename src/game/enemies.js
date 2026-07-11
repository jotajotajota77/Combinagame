import { CORE_FLASH_DURATION } from './constants.js'
import { ENEMY_TYPES } from './enemyTypes.js'
import { spawnDeathBurst } from './particles.js'
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
// `scale` deixa as ondas mais avançadas gerarem inimigos mais fortes/rápidos;
// `typeKey` escolhe a aparência/stats-base (ver enemyTypes.js).
export function spawnEnemy(state, rng = Math.random, scale = { hp: 1, speed: 1 }, typeKey = 'normal') {
  const type = ENEMY_TYPES[typeKey] ?? ENEMY_TYPES.normal
  const { x, y } = randomEdgePoint(state.width, state.height, rng)
  const dir = direction(x, y, state.core.x, state.core.y)
  const speed = type.speed * (scale.speed ?? 1)
  const hp = Math.round(type.hp * (scale.hp ?? 1))
  state.enemies.push({
    x,
    y,
    vx: dir.x * speed,
    vy: dir.y * speed,
    radius: type.radius,
    hp,
    maxHp: hp,
    damage: type.damage,
    color: type.color,
    type: typeKey,
  })
}

// Move os inimigos e aplica dano ao núcleo quando um deles chega perto o
// bastante — esse inimigo é consumido no impacto (não fica empurrando).
// Também cuida do flash de dano na tela (decai a cada frame, reseta no impacto).
export function updateEnemies(state, dt, rng = Math.random) {
  state.core.flashTimer = Math.max(0, state.core.flashTimer - dt)

  const alive = []
  for (const e of state.enemies) {
    e.x += e.vx * dt
    e.y += e.vy * dt
    const d = distance(e.x, e.y, state.core.x, state.core.y)
    if (d <= state.core.radius + e.radius) {
      state.core.hp = Math.max(0, state.core.hp - e.damage)
      state.core.flashTimer = CORE_FLASH_DURATION
      spawnDeathBurst(state, e.x, e.y, e.color, rng)
      continue // inimigo se sacrifica no impacto
    }
    alive.push(e)
  }
  state.enemies = alive
}
