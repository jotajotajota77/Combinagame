import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import { stepGame } from './step.js'
import { seededRng } from './testUtils.js'
import { ENEMY_SPAWN_INTERVAL } from './constants.js'

describe('stepGame', () => {
  it('nasce um inimigo quando o timer de spawn zera', () => {
    const state = createGame(800, 600)
    stepGame(state, ENEMY_SPAWN_INTERVAL, seededRng(1))
    expect(state.enemies.length).toBeGreaterThanOrEqual(1)
  })

  it('não nasce inimigo antes da hora', () => {
    const state = createGame(800, 600)
    stepGame(state, ENEMY_SPAWN_INTERVAL / 2, seededRng(1))
    expect(state.enemies).toHaveLength(0)
  })

  it('termina o jogo quando o núcleo perde todo o hp', () => {
    const state = createGame(800, 600)
    state.core.hp = 1
    state.enemies.push({ x: state.core.x, y: state.core.y, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 })
    stepGame(state, 0.016, seededRng(3))
    expect(state.core.hp).toBe(0)
    expect(state.gameOver).toBe(true)
  })

  it('não faz mais nada depois do game over (no-op)', () => {
    const state = createGame(800, 600)
    state.gameOver = true
    state.core.hp = 0
    const before = JSON.stringify(state)
    stepGame(state, 1, seededRng(5))
    expect(JSON.stringify(state)).toBe(before)
  })

  it('uma horda que sobrecarrega a torre eventualmente derruba o núcleo', () => {
    // Um inimigo por vez a torre dá conta tranquilamente (mata mais rápido do
    // que eles chegam) — então pra testar a condição de derrota de verdade,
    // inundamos a arena com muitos inimigos de uma vez, todos já próximos.
    const state = createGame(800, 600)
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2
      state.enemies.push({
        x: state.core.x + Math.cos(angle) * 80,
        y: state.core.y + Math.sin(angle) * 80,
        vx: Math.cos(angle) * -60,
        vy: Math.sin(angle) * -60,
        radius: 12,
        hp: 20,
        maxHp: 20,
      })
    }
    const rng = seededRng(42)
    let ticks = 0
    while (!state.gameOver && ticks < 1000) {
      stepGame(state, 1 / 30, rng)
      ticks++
    }
    expect(state.gameOver).toBe(true)
    expect(state.core.hp).toBe(0)
  })
})
