import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import {
  waveEnemyCount,
  waveSpawnInterval,
  waveEnemyScale,
  createWaveState,
  updateWaves,
} from './waves.js'
import { WAVE_MIN_SPAWN_INTERVAL, WAVE_REST_SECONDS } from './constants.js'
import { seededRng } from './testUtils.js'

describe('progressão de dificuldade', () => {
  it('cada onda tem mais inimigos que a anterior', () => {
    expect(waveEnemyCount(2)).toBeGreaterThan(waveEnemyCount(1))
    expect(waveEnemyCount(10)).toBeGreaterThan(waveEnemyCount(5))
  })

  it('o intervalo de spawn encurta com a onda, mas nunca abaixo do piso', () => {
    expect(waveSpawnInterval(5)).toBeLessThan(waveSpawnInterval(1))
    expect(waveSpawnInterval(1000)).toBeGreaterThanOrEqual(WAVE_MIN_SPAWN_INTERVAL)
  })

  it('a onda 1 não tem bônus de força; ondas depois sim', () => {
    const scale1 = waveEnemyScale(1)
    expect(scale1.hp).toBe(1)
    expect(scale1.speed).toBe(1)
    const scale5 = waveEnemyScale(5)
    expect(scale5.hp).toBeGreaterThan(1)
    expect(scale5.speed).toBeGreaterThan(1)
  })
})

describe('updateWaves', () => {
  it('começa na onda 1, fase spawning', () => {
    const state = createGame(800, 600)
    expect(state.wave.number).toBe(1)
    expect(state.wave.phase).toBe('spawning')
    expect(state.wave.total).toBe(waveEnemyCount(1))
  })

  it('nasce o primeiro inimigo da onda imediatamente', () => {
    const state = createGame(800, 600)
    updateWaves(state, 1 / 60, seededRng(1))
    expect(state.enemies).toHaveLength(1)
    expect(state.wave.spawned).toBe(1)
  })

  it('continua em spawning até nascer todos os inimigos da onda', () => {
    const state = createGame(800, 600)
    state.wave = createWaveState(1)
    const total = state.wave.total
    const rng = seededRng(2)
    for (let i = 0; i < total; i++) {
      updateWaves(state, waveSpawnInterval(1) + 0.001, rng)
    }
    expect(state.wave.spawned).toBe(total)
    expect(state.enemies).toHaveLength(total)
  })

  it('só entra em descanso quando o campo está limpo (não só quando acabou de nascer)', () => {
    const state = createGame(800, 600)
    state.wave = createWaveState(1)
    const total = state.wave.total
    const rng = seededRng(3)
    for (let i = 0; i < total; i++) {
      updateWaves(state, waveSpawnInterval(1) + 0.001, rng)
    }
    // todos nasceram, mas ainda estão vivos no campo — não deve descansar ainda.
    expect(state.wave.phase).toBe('spawning')

    state.enemies = [] // simula o campo limpo (todos mortos/chegaram no núcleo)
    updateWaves(state, 0.001, rng)
    expect(state.wave.phase).toBe('resting')
    expect(state.wave.timer).toBeCloseTo(WAVE_REST_SECONDS)
  })

  it('depois do descanso, começa a onda seguinte (mais forte)', () => {
    const state = createGame(800, 600)
    state.wave = { number: 1, phase: 'resting', spawned: 4, total: 4, timer: 0.01 }
    updateWaves(state, 0.02, seededRng(4))
    expect(state.wave.number).toBe(2)
    expect(state.wave.phase).toBe('spawning')
    expect(state.wave.spawned).toBe(0)
    expect(state.wave.total).toBe(waveEnemyCount(2))
  })
})
