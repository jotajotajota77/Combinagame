import { describe, it, expect } from 'vitest'
import { ENEMY_TYPES, pickEnemyType } from './enemyTypes.js'
import { seededRng } from './testUtils.js'

describe('ENEMY_TYPES', () => {
  it('rápido: menos vida e mais velocidade que o normal', () => {
    expect(ENEMY_TYPES.fast.hp).toBeLessThan(ENEMY_TYPES.normal.hp)
    expect(ENEMY_TYPES.fast.speed).toBeGreaterThan(ENEMY_TYPES.normal.speed)
  })

  it('tanque: mais vida e menos velocidade que o normal', () => {
    expect(ENEMY_TYPES.tanky.hp).toBeGreaterThan(ENEMY_TYPES.normal.hp)
    expect(ENEMY_TYPES.tanky.speed).toBeLessThan(ENEMY_TYPES.normal.speed)
  })

  it('todo tipo tem uma recompensa em moedas positiva', () => {
    for (const type of Object.values(ENEMY_TYPES)) {
      expect(type.coinValue).toBeGreaterThan(0)
    }
  })

  it('tanque (mais difícil de matar) rende mais moedas que o normal', () => {
    expect(ENEMY_TYPES.tanky.coinValue).toBeGreaterThan(ENEMY_TYPES.normal.coinValue)
  })
})

describe('pickEnemyType', () => {
  it('na onda 1, só o tipo normal está desbloqueado', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(pickEnemyType(1, seededRng(seed))).toBe('normal')
    }
  })

  it('a partir da onda de desbloqueio do rápido, ele pode nascer', () => {
    const results = new Set()
    for (let seed = 1; seed <= 50; seed++) {
      results.add(pickEnemyType(ENEMY_TYPES.fast.unlockWave, seededRng(seed)))
    }
    expect(results.has('fast')).toBe(true)
    expect(results.has('tanky')).toBe(false) // ainda não devia estar liberado
  })

  it('a partir da onda de desbloqueio do tanque, ele pode nascer', () => {
    const results = new Set()
    for (let seed = 1; seed <= 50; seed++) {
      results.add(pickEnemyType(ENEMY_TYPES.tanky.unlockWave, seededRng(seed)))
    }
    expect(results.has('tanky')).toBe(true)
  })

  it('sempre devolve um tipo válido, mesmo em ondas bem avançadas', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const type = pickEnemyType(50, seededRng(seed))
      expect(Object.keys(ENEMY_TYPES)).toContain(type)
    }
  })
})
