import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import { applyOnHitEffects, tickStatusEffects } from './statusEffects.js'
import {
  FIRE_SPLASH_DAMAGE,
  FIRE_SPLASH_RADIUS,
  ICE_SLOW_DURATION,
  LIGHTNING_CHAIN_COUNT,
  LIGHTNING_CHAIN_DAMAGE_RATIO,
  LIGHTNING_CHAIN_RADIUS,
  POISON_DPS,
  POISON_DURATION,
} from './constants.js'

function addEnemy(state, x, y, hp = 100) {
  const e = { x, y, vx: 0, vy: 0, radius: 12, hp, maxHp: hp, slowTimer: 0, poisonTimer: 0 }
  state.enemies.push(e)
  return e
}

describe('applyOnHitEffects', () => {
  it('sem nenhum efeito ligado, não faz nada', () => {
    const state = createGame(800, 600)
    const hit = addEnemy(state, 0, 0)
    const other = addEnemy(state, 10, 0)
    applyOnHitEffects(state, hit, 20)
    expect(other.hp).toBe(other.maxHp)
    expect(hit.slowTimer).toBe(0)
    expect(hit.poisonTimer).toBe(0)
    expect(state.fireBursts).toHaveLength(0)
  })

  describe('raio', () => {
    it('salta pros inimigos mais próximos dentro do raio, aplicando uma fração do dano', () => {
      const state = createGame(800, 600)
      state.effects.lightning = true
      const hit = addEnemy(state, 0, 0)
      const near = addEnemy(state, 50, 0)
      const far = addEnemy(state, LIGHTNING_CHAIN_RADIUS + 50, 0) // fora do alcance

      applyOnHitEffects(state, hit, 20)

      expect(near.hp).toBe(near.maxHp - 20 * LIGHTNING_CHAIN_DAMAGE_RATIO)
      expect(far.hp).toBe(far.maxHp) // longe demais, não é atingido
    })

    it('respeita o limite de LIGHTNING_CHAIN_COUNT saltos, priorizando os mais próximos', () => {
      const state = createGame(800, 600)
      state.effects.lightning = true
      const hit = addEnemy(state, 0, 0)
      const targets = []
      for (let i = 1; i <= LIGHTNING_CHAIN_COUNT + 2; i++) {
        targets.push(addEnemy(state, i * 10, 0)) // todos dentro do alcance, distâncias crescentes
      }

      applyOnHitEffects(state, hit, 20)

      const hitCount = targets.filter((t) => t.hp < t.maxHp).length
      expect(hitCount).toBe(LIGHTNING_CHAIN_COUNT)
      // os mais próximos (primeiros da lista) são os atingidos
      for (let i = 0; i < LIGHTNING_CHAIN_COUNT; i++) {
        expect(targets[i].hp).toBeLessThan(targets[i].maxHp)
      }
    })

    it('nunca atinge o próprio inimigo alvo de novo', () => {
      const state = createGame(800, 600)
      state.effects.lightning = true
      const hit = addEnemy(state, 0, 0)
      applyOnHitEffects(state, hit, 20)
      expect(hit.hp).toBe(hit.maxHp) // só o dano direto do projétil mexeria nisso, não testado aqui
    })

    it('registra um arco visual em state.lightningBolts pra cada salto', () => {
      const state = createGame(800, 600)
      state.effects.lightning = true
      const hit = addEnemy(state, 0, 0)
      addEnemy(state, 30, 0)
      addEnemy(state, 40, 0)
      applyOnHitEffects(state, hit, 20)
      expect(state.lightningBolts.length).toBeGreaterThan(0)
      expect(state.lightningBolts.length).toBeLessThanOrEqual(LIGHTNING_CHAIN_COUNT)
    })
  })

  describe('gelo', () => {
    it('define o timer de lentidão do inimigo atingido', () => {
      const state = createGame(800, 600)
      state.effects.ice = true
      const hit = addEnemy(state, 0, 0)
      applyOnHitEffects(state, hit, 20)
      expect(hit.slowTimer).toBe(ICE_SLOW_DURATION)
    })

    it('não afeta outros inimigos', () => {
      const state = createGame(800, 600)
      state.effects.ice = true
      const hit = addEnemy(state, 0, 0)
      const other = addEnemy(state, 10, 0)
      applyOnHitEffects(state, hit, 20)
      expect(other.slowTimer).toBe(0)
    })
  })

  describe('veneno', () => {
    it('define o timer de veneno do inimigo atingido', () => {
      const state = createGame(800, 600)
      state.effects.poison = true
      const hit = addEnemy(state, 0, 0)
      applyOnHitEffects(state, hit, 20)
      expect(hit.poisonTimer).toBe(POISON_DURATION)
    })
  })

  describe('fogo', () => {
    it('causa dano de área nos inimigos próximos, mas não no próprio alvo direto', () => {
      const state = createGame(800, 600)
      state.effects.fire = true
      const hit = addEnemy(state, 0, 0)
      const near = addEnemy(state, 30, 0)
      const far = addEnemy(state, FIRE_SPLASH_RADIUS + 50, 0)

      applyOnHitEffects(state, hit, 20)

      expect(hit.hp).toBe(hit.maxHp) // o dano direto já é aplicado em projectiles.js, não aqui
      expect(near.hp).toBe(near.maxHp - FIRE_SPLASH_DAMAGE)
      expect(far.hp).toBe(far.maxHp)
    })

    it('registra uma explosão visual em state.fireBursts', () => {
      const state = createGame(800, 600)
      state.effects.fire = true
      const hit = addEnemy(state, 0, 0)
      applyOnHitEffects(state, hit, 20)
      expect(state.fireBursts).toHaveLength(1)
      expect(state.fireBursts[0]).toMatchObject({ x: 0, y: 0 })
    })
  })
})

describe('tickStatusEffects', () => {
  it('aplica o dano por segundo do veneno e decai o timer', () => {
    const state = createGame(800, 600)
    const e = addEnemy(state, 0, 0)
    e.poisonTimer = 1
    tickStatusEffects(state, 0.5)
    expect(e.hp).toBe(e.maxHp - POISON_DPS * 0.5)
    expect(e.poisonTimer).toBeCloseTo(0.5)
  })

  it('para de causar dano quando o veneno acaba', () => {
    const state = createGame(800, 600)
    const e = addEnemy(state, 0, 0)
    e.poisonTimer = 0.2
    tickStatusEffects(state, 0.5)
    expect(e.poisonTimer).toBe(0)
    const hpAfterExpire = e.hp
    tickStatusEffects(state, 1)
    expect(e.hp).toBe(hpAfterExpire) // sem veneno ativo, não perde mais vida
  })

  it('decai o timer de lentidão até zero', () => {
    const state = createGame(800, 600)
    const e = addEnemy(state, 0, 0)
    e.slowTimer = 0.3
    tickStatusEffects(state, 1)
    expect(e.slowTimer).toBe(0)
  })

  it('não mexe em inimigos sem status ativo', () => {
    const state = createGame(800, 600)
    const e = addEnemy(state, 0, 0)
    tickStatusEffects(state, 1)
    expect(e.hp).toBe(e.maxHp)
    expect(e.slowTimer).toBe(0)
    expect(e.poisonTimer).toBe(0)
  })

  it('apaga raios e explosões de fogo com o tempo', () => {
    const state = createGame(800, 600)
    state.lightningBolts.push({ x1: 0, y1: 0, x2: 10, y2: 0, life: 0.1, maxLife: 0.1 })
    state.fireBursts.push({ x: 0, y: 0, life: 0.1, maxLife: 0.1 })
    tickStatusEffects(state, 0.2)
    expect(state.lightningBolts).toHaveLength(0)
    expect(state.fireBursts).toHaveLength(0)
  })
})
