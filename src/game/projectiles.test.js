import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import { updateProjectiles } from './projectiles.js'
import { seededRng } from './testUtils.js'
import { MISSILE_SPEED, MISSILE_TRAIL_LENGTH, MISSILE_TURN_RATE, PARTICLE_COUNT } from './constants.js'

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
  it('vira em direção ao alvo travado, mas com um limite de velocidade angular (não instantâneo)', () => {
    const state = createGame(800, 600)
    const enemy = { x: 100, y: 300, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 } // reto abaixo do míssil
    state.enemies.push(enemy)
    const missile = { x: 100, y: 100, vx: -MISSILE_SPEED, vy: 0, radius: 4, damage: 3, homing: true, target: enemy }
    state.projectiles.push(missile)

    const dt = 0.01
    updateProjectiles(state, dt)

    const maxTurn = MISSILE_TURN_RATE * dt
    const expectedAngle = Math.PI - maxTurn // vindo de 180°, girando o máximo permitido rumo aos 90° (alvo abaixo)
    expect(Math.atan2(missile.vy, missile.vx)).toBeCloseTo(expectedAngle, 4)
    expect(Math.hypot(missile.vx, missile.vy)).toBeCloseTo(MISSILE_SPEED, 1) // velocidade preservada
  })

  it('depois de tempo suficiente, alinha totalmente com o alvo travado', () => {
    const state = createGame(800, 600)
    const enemy = { x: 100, y: 300, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 }
    state.enemies.push(enemy)
    const missile = { x: 100, y: 250, vx: -MISSILE_SPEED, vy: 0, radius: 4, damage: 3, homing: true, target: enemy }
    state.projectiles.push(missile)

    updateProjectiles(state, 1) // MISSILE_TURN_RATE * 1s é bem mais que meia-volta — dá pra alinhar total

    expect(missile.vx).toBeCloseTo(0, 1)
    expect(missile.vy).toBeCloseTo(MISSILE_SPEED, 0)
  })

  it('sem nenhum alvo no mapa, tende a se afastar do núcleo até se perder', () => {
    const state = createGame(800, 600)
    const missile = {
      x: state.core.x + 50,
      y: state.core.y,
      vx: 0,
      vy: -MISSILE_SPEED,
      radius: 4,
      damage: 3,
      homing: true,
      target: null,
    }
    state.projectiles.push(missile)

    updateProjectiles(state, 1) // tempo suficiente pra completar o giro

    // "se afastar do núcleo" == apontar no sentido núcleo→míssil (aqui, direto pra direita).
    expect(missile.vx).toBeCloseTo(MISSILE_SPEED, 0)
    expect(missile.vy).toBeCloseTo(0, 1)
  })

  it('quando o alvo travado morre/some, troca pro mais próximo — mas ainda vira aos poucos, sem teleportar direção', () => {
    const state = createGame(800, 600)
    const deadTarget = { x: 100, y: 100, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 } // não está em state.enemies
    const newTarget = { x: 100, y: 300, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 }
    state.enemies.push(newTarget)
    const missile = { x: 100, y: 200, vx: MISSILE_SPEED, vy: 0, radius: 4, damage: 3, homing: true, target: deadTarget }
    state.projectiles.push(missile)

    const dt = 0.01
    updateProjectiles(state, dt)

    expect(missile.target).toBe(newTarget)
    const maxTurn = MISSILE_TURN_RATE * dt
    expect(missile.vx).toBeCloseTo(Math.cos(maxTurn) * MISSILE_SPEED, 4)
    expect(missile.vy).toBeCloseTo(Math.sin(maxTurn) * MISSILE_SPEED, 4)
  })

  it('não troca de alvo só porque outro ficou mais perto — só troca quando o atual morre/some (evita quicar)', () => {
    const state = createGame(800, 600)
    const original = { x: 100, y: 300, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 }
    const closer = { x: 100, y: 110, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 } // bem mais perto do míssil
    state.enemies.push(original, closer)
    const missile = { x: 100, y: 100, vx: MISSILE_SPEED, vy: 0, radius: 4, damage: 3, homing: true, target: original }
    state.projectiles.push(missile)

    updateProjectiles(state, 0.01)

    expect(missile.target).toBe(original) // continua travado no alvo original
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

describe('rastro do míssil (p.trail)', () => {
  it('guarda as posições recentes, até o limite de MISSILE_TRAIL_LENGTH', () => {
    const state = createGame(800, 600)
    const missile = { x: 0, y: 0, vx: 100, vy: 0, radius: 4, damage: 3, homing: true, target: null }
    state.projectiles.push(missile)

    for (let i = 0; i < MISSILE_TRAIL_LENGTH + 3; i++) {
      updateProjectiles(state, 0.01)
    }

    expect(missile.trail.length).toBeLessThanOrEqual(MISSILE_TRAIL_LENGTH)
    expect(missile.trail.length).toBeGreaterThan(0)
  })

  it('não deixa rastro em projéteis normais (não-homing)', () => {
    const state = createGame(800, 600)
    const shot = { x: 0, y: 0, vx: 100, vy: 0, radius: 4, damage: 3 }
    state.projectiles.push(shot)
    updateProjectiles(state, 0.01)
    expect(shot.trail).toBeUndefined()
  })
})
