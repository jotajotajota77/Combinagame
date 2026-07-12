import {
  FIRE_BURST_LIFE,
  FIRE_SPLASH_DAMAGE,
  FIRE_SPLASH_RADIUS,
  ICE_SLOW_DURATION,
  LIGHTNING_BOLT_LIFE,
  LIGHTNING_CHAIN_COUNT,
  LIGHTNING_CHAIN_DAMAGE_RATIO,
  LIGHTNING_CHAIN_RADIUS,
  POISON_DPS,
  POISON_DURATION,
} from './constants.js'
import { distance } from './vector.js'

// Raio: salta do inimigo atingido pros LIGHTNING_CHAIN_COUNT mais próximos
// dentro de LIGHTNING_CHAIN_RADIUS, aplicando uma fração do dano original.
// Guarda os arcos em state.lightningBolts só pra desenhar (ver render.js).
function applyLightning(state, hitEnemy, hitDamage) {
  const chained = state.enemies
    .filter((e) => e !== hitEnemy)
    .map((e) => ({ enemy: e, dist: distance(hitEnemy.x, hitEnemy.y, e.x, e.y) }))
    .filter((c) => c.dist <= LIGHTNING_CHAIN_RADIUS)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, LIGHTNING_CHAIN_COUNT)

  for (const { enemy } of chained) {
    enemy.hp -= hitDamage * LIGHTNING_CHAIN_DAMAGE_RATIO
    state.lightningBolts.push({
      x1: hitEnemy.x,
      y1: hitEnemy.y,
      x2: enemy.x,
      y2: enemy.y,
      life: LIGHTNING_BOLT_LIFE,
      maxLife: LIGHTNING_BOLT_LIFE,
    })
  }
}

// Gelo: retarda o inimigo atingido por um tempo — o efeito na velocidade em
// si é aplicado em enemies.js (updateEnemies lê e.slowTimer).
function applyIce(enemy) {
  enemy.slowTimer = ICE_SLOW_DURATION
}

// Veneno: dano contínuo no inimigo atingido — o tique em si acontece em
// tickStatusEffects, chamado uma vez por frame.
function applyPoison(enemy) {
  enemy.poisonTimer = POISON_DURATION
}

// Fogo: explosão no ponto de impacto, atingindo outros inimigos por perto
// (o alvo direto já levou o dano do próprio projétil). Guarda a explosão em
// state.fireBursts só pra desenhar.
function applyFire(state, hitEnemy) {
  for (const e of state.enemies) {
    if (e === hitEnemy) continue
    if (distance(hitEnemy.x, hitEnemy.y, e.x, e.y) <= FIRE_SPLASH_RADIUS) {
      e.hp -= FIRE_SPLASH_DAMAGE
    }
  }
  state.fireBursts.push({ x: hitEnemy.x, y: hitEnemy.y, life: FIRE_BURST_LIFE, maxLife: FIRE_BURST_LIFE })
}

// Chamado por updateProjectiles no momento do impacto — aplica qualquer
// combinação de efeitos elementares ligados (ver game/effects.js). Funciona
// igual pro tiro normal e pro míssil, já que os dois passam pelo mesmo ponto
// de colisão.
export function applyOnHitEffects(state, hitEnemy, hitDamage) {
  if (state.effects?.lightning) applyLightning(state, hitEnemy, hitDamage)
  if (state.effects?.ice) applyIce(hitEnemy)
  if (state.effects?.poison) applyPoison(hitEnemy)
  if (state.effects?.fire) applyFire(state, hitEnemy)
}

function updateEphemeralEffects(list, dt) {
  const alive = []
  for (const item of list) {
    item.life -= dt
    if (item.life > 0) alive.push(item)
  }
  return alive
}

// Chamado uma vez por frame: aplica o tique de dano do veneno, decai os
// timers de status (lentidão/veneno) e apaga aos poucos os efeitos visuais
// efêmeros (raios, explosões de fogo).
export function tickStatusEffects(state, dt) {
  for (const e of state.enemies) {
    if (e.poisonTimer > 0) {
      e.hp -= POISON_DPS * dt
      e.poisonTimer = Math.max(0, e.poisonTimer - dt)
    }
    if (e.slowTimer > 0) {
      e.slowTimer = Math.max(0, e.slowTimer - dt)
    }
  }

  state.lightningBolts = updateEphemeralEffects(state.lightningBolts, dt)
  state.fireBursts = updateEphemeralEffects(state.fireBursts, dt)
}
