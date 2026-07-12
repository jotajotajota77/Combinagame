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

describe('mísseis teleguiados (p.homing)', () => {
  it('reaponta pro inimigo mais próximo a cada frame, mantendo a velocidade', () => {
    const state = createGame(800, 600)
    // inimigo bem abaixo do míssil, mas o míssil começa mirando pra direita.
    state.enemies.push({ x: 100, y: 200, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 })
    state.projectiles.push({ x: 100, y: 100, vx: 100, vy: 0, radius: 4, damage: 3, homing: true })

    updateProjectiles(state, 0.001) // dt bem pequeno pra não colidir, só girar

    const p = state.projectiles[0]
    expect(p.vy).toBeGreaterThan(0) // virou pra baixo, na direção do inimigo
    expect(Math.hypot(p.vx, p.vy)).toBeCloseTo(100) // velocidade preservada
  })

  it('não teleguia (segue reto) quando não há nenhum inimigo vivo', () => {
    const state = createGame(800, 600)
    state.projectiles.push({ x: 100, y: 100, vx: 100, vy: 0, radius: 4, damage: 3, homing: true })
    updateProjectiles(state, 0.1)
    expect(state.projectiles[0].vx).toBe(100)
    expect(state.projectiles[0].vy).toBe(0)
  })

  it('míssil também aplica dano e soma abate normalmente ao acertar', () => {
    const state = createGame(800, 600)
    state.enemies.push({ x: 100, y: 100, vx: 0, vy: 0, radius: 12, hp: 3, maxHp: 20, color: '#fff' })
    state.projectiles.push({ x: 100, y: 100, vx: 100, vy: 0, radius: 4, damage: 3, homing: true })
    updateProjectiles(state, 0.001, seededRng(1))
    expect(state.projectiles).toHaveLength(0)
    expect(state.kills).toBe(1)
  })
})
