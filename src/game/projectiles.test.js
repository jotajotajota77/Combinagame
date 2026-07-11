import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import { updateProjectiles } from './projectiles.js'
import { seededRng } from './testUtils.js'
import { PARTICLE_COUNT } from './constants.js'

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
    state.enemies.push({ x: 50, y: 0, vx: 0, vy: 0, radius: 12, hp: 5, maxHp: 20, color: '#00ff00' })
    state.projectiles.push({ x: 0, y: 0, vx: 100, vy: 0, radius: 4, damage: 10 })
    updateProjectiles(state, 0.4, seededRng(3))
    expect(state.enemies).toHaveLength(0)
    expect(state.kills).toBe(1)
  })

  it('morte do inimigo dispara uma explosão de partículas na cor dele', () => {
    const state = createGame(800, 600)
    state.enemies.push({ x: 50, y: 0, vx: 0, vy: 0, radius: 12, hp: 5, maxHp: 20, color: '#00ff00' })
    state.projectiles.push({ x: 0, y: 0, vx: 100, vy: 0, radius: 4, damage: 10 })
    updateProjectiles(state, 0.4, seededRng(3))
    expect(state.particles).toHaveLength(PARTICLE_COUNT)
    expect(state.particles[0].color).toBe('#00ff00')
  })

  it('abate rende moedas conforme o coinValue do inimigo', () => {
    const state = createGame(800, 600)
    state.enemies.push({ x: 50, y: 0, vx: 0, vy: 0, radius: 12, hp: 5, maxHp: 20, color: '#00ff00', coinValue: 7 })
    state.projectiles.push({ x: 0, y: 0, vx: 100, vy: 0, radius: 4, damage: 10 })
    updateProjectiles(state, 0.4, seededRng(3))
    expect(state.coins).toBe(7)
  })

  it('abate de inimigo sem coinValue não quebra e não soma moedas', () => {
    const state = createGame(800, 600)
    state.enemies.push({ x: 50, y: 0, vx: 0, vy: 0, radius: 12, hp: 5, maxHp: 20, color: '#00ff00' })
    state.projectiles.push({ x: 0, y: 0, vx: 100, vy: 0, radius: 4, damage: 10 })
    updateProjectiles(state, 0.4, seededRng(3))
    expect(state.coins).toBe(0)
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
