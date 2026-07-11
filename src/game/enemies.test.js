import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import { spawnEnemy, updateEnemies } from './enemies.js'
import { distance } from './vector.js'
import { seededRng } from './testUtils.js'
import { CORE_FLASH_DURATION, CORE_MAX_HP, PARTICLE_COUNT } from './constants.js'
import { ENEMY_TYPES } from './enemyTypes.js'

describe('spawnEnemy', () => {
  it('nasce sempre em cima de alguma borda da arena', () => {
    const state = createGame(800, 600)
    const rng = seededRng(1)
    for (let i = 0; i < 30; i++) {
      spawnEnemy(state, rng)
    }
    for (const e of state.enemies) {
      const onEdge = e.x === 0 || e.x === 800 || e.y === 0 || e.y === 600
      expect(onEdge).toBe(true)
    }
  })

  it('já nasce mirando o núcleo (se aproxima dele com o tempo)', () => {
    const state = createGame(800, 600)
    spawnEnemy(state, seededRng(7))
    const enemy = state.enemies[0]
    const before = distance(enemy.x, enemy.y, state.core.x, state.core.y)
    updateEnemies(state, 1)
    const after = distance(enemy.x, enemy.y, state.core.x, state.core.y)
    expect(after).toBeLessThan(before)
  })

  it('sem tipo explícito, nasce como "normal"', () => {
    const state = createGame(800, 600)
    spawnEnemy(state, seededRng(9))
    expect(state.enemies[0].type).toBe('normal')
    expect(state.enemies[0].radius).toBe(ENEMY_TYPES.normal.radius)
  })

  it('com um tipo explícito, usa os stats daquele tipo', () => {
    const state = createGame(800, 600)
    spawnEnemy(state, seededRng(9), { hp: 1, speed: 1 }, 'tanky')
    const e = state.enemies[0]
    expect(e.type).toBe('tanky')
    expect(e.hp).toBe(ENEMY_TYPES.tanky.hp)
    expect(e.radius).toBe(ENEMY_TYPES.tanky.radius)
    expect(e.damage).toBe(ENEMY_TYPES.tanky.damage)
    expect(e.color).toBe(ENEMY_TYPES.tanky.color)
    expect(e.coinValue).toBe(ENEMY_TYPES.tanky.coinValue)
  })
})

describe('updateEnemies', () => {
  it('dano ao núcleo (do próprio inimigo) e remove o inimigo quando ele chega perto o bastante', () => {
    const state = createGame(800, 600)
    state.enemies.push({
      x: state.core.x + 5,
      y: state.core.y,
      vx: 0,
      vy: 0,
      radius: 12,
      hp: 20,
      maxHp: 20,
      damage: 10,
    })
    updateEnemies(state, 0)
    expect(state.core.hp).toBe(CORE_MAX_HP - 10)
    expect(state.enemies).toHaveLength(0)
  })

  it('não sobe o hp do núcleo abaixo de zero', () => {
    const state = createGame(800, 600)
    state.core.hp = 5
    state.enemies.push({
      x: state.core.x,
      y: state.core.y,
      vx: 0,
      vy: 0,
      radius: 12,
      hp: 20,
      maxHp: 20,
      damage: 10,
    })
    updateEnemies(state, 0)
    expect(state.core.hp).toBe(0)
  })

  it('inimigo longe do núcleo não causa dano nem some', () => {
    const state = createGame(800, 600)
    state.enemies.push({ x: 0, y: 0, vx: 10, vy: 10, radius: 12, hp: 20, maxHp: 20, damage: 10 })
    updateEnemies(state, 0.1)
    expect(state.core.hp).toBe(CORE_MAX_HP)
    expect(state.enemies).toHaveLength(1)
  })

  it('um tipo com mais dano (tanky) tira mais vida do núcleo ao chegar', () => {
    const state = createGame(800, 600)
    spawnEnemy(state, seededRng(1), { hp: 1, speed: 1 }, 'tanky')
    const e = state.enemies[0]
    e.x = state.core.x
    e.y = state.core.y
    updateEnemies(state, 0)
    expect(state.core.hp).toBe(CORE_MAX_HP - ENEMY_TYPES.tanky.damage)
  })

  it('impacto no núcleo dispara o flash de dano e uma explosão de partículas', () => {
    const state = createGame(800, 600)
    state.enemies.push({
      x: state.core.x,
      y: state.core.y,
      vx: 0,
      vy: 0,
      radius: 12,
      hp: 20,
      maxHp: 20,
      damage: 10,
      color: '#ff0000',
    })
    updateEnemies(state, 0, seededRng(1))
    expect(state.core.flashTimer).toBe(CORE_FLASH_DURATION)
    expect(state.particles).toHaveLength(PARTICLE_COUNT)
  })

  it('o flash de dano decai com o tempo até chegar a zero', () => {
    const state = createGame(800, 600)
    state.core.flashTimer = CORE_FLASH_DURATION
    updateEnemies(state, CORE_FLASH_DURATION / 2)
    expect(state.core.flashTimer).toBeCloseTo(CORE_FLASH_DURATION / 2)
    updateEnemies(state, 10)
    expect(state.core.flashTimer).toBe(0)
  })
})
