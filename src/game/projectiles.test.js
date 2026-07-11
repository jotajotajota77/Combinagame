import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import { updateProjectiles } from './projectiles.js'

describe('updateProjectiles', () => {
  it('acerta um inimigo no caminho, aplica dano e consome o projétil', () => {
    const state = createGame(800, 600)
    state.enemies.push({ x: 50, y: 0, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 })
    state.projectiles.push({ x: 0, y: 0, vx: 100, vy: 0, radius: 4, damage: 10 })
    updateProjectiles(state, 0.4) // projétil chega em x=40, dentro do raio de colisão
    expect(state.projectiles).toHaveLength(0)
    expect(state.enemies).toHaveLength(1)
    expect(state.enemies[0].hp).toBe(10)
  })

  it('remove o inimigo e soma abate quando o hp zera', () => {
    const state = createGame(800, 600)
    state.enemies.push({ x: 50, y: 0, vx: 0, vy: 0, radius: 12, hp: 5, maxHp: 20 })
    state.projectiles.push({ x: 0, y: 0, vx: 100, vy: 0, radius: 4, damage: 10 })
    updateProjectiles(state, 0.4)
    expect(state.enemies).toHaveLength(0)
    expect(state.kills).toBe(1)
  })

  it('remove projéteis que saem da tela sem acertar nada', () => {
    const state = createGame(800, 600)
    state.projectiles.push({ x: 790, y: 0, vx: 500, vy: 0, radius: 4, damage: 10 })
    updateProjectiles(state, 1)
    expect(state.projectiles).toHaveLength(0)
  })

  it('projétil que erra continua vivo e se move', () => {
    const state = createGame(800, 600)
    state.enemies.push({ x: 400, y: 400, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 })
    state.projectiles.push({ x: 0, y: 0, vx: 100, vy: 0, radius: 4, damage: 10 })
    updateProjectiles(state, 0.1)
    expect(state.projectiles).toHaveLength(1)
    expect(state.projectiles[0].x).toBeCloseTo(10)
  })
})
