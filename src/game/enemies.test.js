import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import { spawnEnemy, updateEnemies } from './enemies.js'
import { distance } from './vector.js'
import { seededRng } from './testUtils.js'
import { ENEMY_DAMAGE, CORE_MAX_HP } from './constants.js'

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
})

describe('updateEnemies', () => {
  it('dano ao núcleo e remove o inimigo quando ele chega perto o bastante', () => {
    const state = createGame(800, 600)
    state.enemies.push({ x: state.core.x + 5, y: state.core.y, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 })
    updateEnemies(state, 0)
    expect(state.core.hp).toBe(CORE_MAX_HP - ENEMY_DAMAGE)
    expect(state.enemies).toHaveLength(0)
  })

  it('não sobe o hp do núcleo abaixo de zero', () => {
    const state = createGame(800, 600)
    state.core.hp = 5
    state.enemies.push({ x: state.core.x, y: state.core.y, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 })
    updateEnemies(state, 0)
    expect(state.core.hp).toBe(0)
  })

  it('inimigo longe do núcleo não causa dano nem some', () => {
    const state = createGame(800, 600)
    state.enemies.push({ x: 0, y: 0, vx: 10, vy: 10, radius: 12, hp: 20, maxHp: 20 })
    updateEnemies(state, 0.1)
    expect(state.core.hp).toBe(CORE_MAX_HP)
    expect(state.enemies).toHaveLength(1)
  })
})
