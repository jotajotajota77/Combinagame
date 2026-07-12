import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import { findNearestEnemy, updateCombat } from './combat.js'
import { MISSILE_COUNT, MISSILE_DAMAGE_RATIO, MISSILE_SPAWN_RADIUS, TURRET_RANGE, TURRET_FIRE_INTERVAL } from './constants.js'
import { distance } from './vector.js'
import { seededRng } from './testUtils.js'

function addEnemy(state, x, y) {
  const e = { x, y, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 }
  state.enemies.push(e)
  return e
}

describe('findNearestEnemy', () => {
  it('escolhe o inimigo mais próximo dentro do alcance', () => {
    const state = createGame(800, 600)
    const far = addEnemy(state, state.core.x + 200, state.core.y)
    const near = addEnemy(state, state.core.x + 50, state.core.y)
    expect(findNearestEnemy(state)).toBe(near)
    void far
  })

  it('ignora inimigos fora do alcance da torre', () => {
    const state = createGame(2000, 2000)
    addEnemy(state, state.core.x + TURRET_RANGE + 100, state.core.y)
    expect(findNearestEnemy(state)).toBeNull()
  })
})

describe('updateCombat', () => {
  it('atira um projétil mirado no alvo quando há inimigo no alcance', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0
    addEnemy(state, state.core.x + 100, state.core.y)
    updateCombat(state, 0)
    expect(state.projectiles).toHaveLength(1)
    const p = state.projectiles[0]
    expect(p.vx).toBeGreaterThan(0)
    expect(p.vy).toBeCloseTo(0)
    expect(state.fireTimer).toBeCloseTo(TURRET_FIRE_INTERVAL)
  })

  it('não atira antes do cooldown acabar', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0.3
    addEnemy(state, state.core.x + 100, state.core.y)
    updateCombat(state, 0.1)
    expect(state.projectiles).toHaveLength(0)
    expect(state.fireTimer).toBeCloseTo(0.2)
  })

  it('não atira sem nenhum inimigo no alcance', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0
    updateCombat(state, 0)
    expect(state.projectiles).toHaveLength(0)
  })
})

describe('updateCombat com o efeito míssil ligado', () => {
  it('atira MISSILE_COUNT mísseis mais fracos e teleguiados em vez de 1 tiro reto', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0
    state.effects.missile = true
    addEnemy(state, state.core.x + 100, state.core.y)
    updateCombat(state, 0, seededRng(1))

    expect(state.projectiles).toHaveLength(MISSILE_COUNT)
    for (const p of state.projectiles) {
      expect(p.homing).toBe(true)
      expect(p.damage).toBeCloseTo(state.core.damage * MISSILE_DAMAGE_RATIO)
    }
    expect(state.fireTimer).toBeCloseTo(TURRET_FIRE_INTERVAL)
  })

  it('cada míssil nasce a MISSILE_SPAWN_RADIUS de distância do núcleo', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0
    state.effects.missile = true
    addEnemy(state, state.core.x + 100, state.core.y)
    updateCombat(state, 0, seededRng(2))

    for (const p of state.projectiles) {
      expect(distance(state.core.x, state.core.y, p.x, p.y)).toBeCloseTo(MISSILE_SPAWN_RADIUS)
    }
  })

  it('ainda respeita o cooldown normal — não dispara antes da hora', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0.3
    state.effects.missile = true
    addEnemy(state, state.core.x + 100, state.core.y)
    updateCombat(state, 0.1, seededRng(3))
    expect(state.projectiles).toHaveLength(0)
  })
})
