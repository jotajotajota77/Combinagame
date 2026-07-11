import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import {
  increaseDamage,
  decreaseDamage,
  increaseFireRate,
  decreaseFireRate,
  increaseRange,
  decreaseRange,
  UPGRADE_LIMITS,
} from './upgrades.js'

describe('upgrades — ataque', () => {
  it('aumenta e diminui o dano', () => {
    const state = createGame(800, 600)
    const before = state.core.damage
    increaseDamage(state)
    expect(state.core.damage).toBeGreaterThan(before)
    decreaseDamage(state)
    expect(state.core.damage).toBe(before)
  })

  it('nunca passa do teto nem cai abaixo do piso', () => {
    const state = createGame(800, 600)
    for (let i = 0; i < 100; i++) increaseDamage(state)
    expect(state.core.damage).toBe(UPGRADE_LIMITS.damage.max)
    for (let i = 0; i < 100; i++) decreaseDamage(state)
    expect(state.core.damage).toBe(UPGRADE_LIMITS.damage.min)
  })
})

describe('upgrades — cadência', () => {
  it('aumentar a cadência ATIRA MAIS RÁPIDO (fireInterval menor)', () => {
    const state = createGame(800, 600)
    const before = state.core.fireInterval
    increaseFireRate(state)
    expect(state.core.fireInterval).toBeLessThan(before)
  })

  it('diminuir a cadência atira mais devagar (fireInterval maior)', () => {
    const state = createGame(800, 600)
    const before = state.core.fireInterval
    decreaseFireRate(state)
    expect(state.core.fireInterval).toBeGreaterThan(before)
  })

  it('respeita os limites', () => {
    const state = createGame(800, 600)
    for (let i = 0; i < 100; i++) increaseFireRate(state)
    expect(state.core.fireInterval).toBe(UPGRADE_LIMITS.fireInterval.min)
    for (let i = 0; i < 100; i++) decreaseFireRate(state)
    expect(state.core.fireInterval).toBe(UPGRADE_LIMITS.fireInterval.max)
  })
})

describe('upgrades — alcance', () => {
  it('aumenta e diminui o alcance', () => {
    const state = createGame(800, 600)
    const before = state.core.range
    increaseRange(state)
    expect(state.core.range).toBeGreaterThan(before)
    decreaseRange(state)
    expect(state.core.range).toBe(before)
  })

  it('respeita os limites', () => {
    const state = createGame(800, 600)
    for (let i = 0; i < 100; i++) increaseRange(state)
    expect(state.core.range).toBe(UPGRADE_LIMITS.range.max)
    for (let i = 0; i < 100; i++) decreaseRange(state)
    expect(state.core.range).toBe(UPGRADE_LIMITS.range.min)
  })
})
