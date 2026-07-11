import { describe, it, expect } from 'vitest'
import { spawnDeathBurst, updateParticles } from './particles.js'
import { seededRng } from './testUtils.js'
import { PARTICLE_COUNT, PARTICLE_LIFE } from './constants.js'

describe('spawnDeathBurst', () => {
  it('adiciona PARTICLE_COUNT partículas na posição/cor dadas', () => {
    const state = { particles: [] }
    spawnDeathBurst(state, 100, 200, '#abcdef', seededRng(1))
    expect(state.particles).toHaveLength(PARTICLE_COUNT)
    for (const p of state.particles) {
      expect(p.x).toBe(100)
      expect(p.y).toBe(200)
      expect(p.color).toBe('#abcdef')
      expect(p.life).toBe(PARTICLE_LIFE)
    }
  })

  it('empilha em cima de partículas já existentes', () => {
    const state = { particles: [{ x: 0, y: 0, vx: 0, vy: 0, radius: 1, color: '#fff', life: 0.1, maxLife: 0.1 }] }
    spawnDeathBurst(state, 5, 5, '#000', seededRng(2))
    expect(state.particles).toHaveLength(1 + PARTICLE_COUNT)
  })
})

describe('updateParticles', () => {
  it('move as partículas conforme a velocidade e o dt', () => {
    const state = { particles: [{ x: 0, y: 0, vx: 100, vy: -50, radius: 3, color: '#fff', life: 1, maxLife: 1 }] }
    updateParticles(state, 0.1)
    expect(state.particles[0].x).toBeCloseTo(10)
    expect(state.particles[0].y).toBeCloseTo(-5)
  })

  it('descarta partículas cuja vida chegou a zero', () => {
    const state = {
      particles: [
        { x: 0, y: 0, vx: 0, vy: 0, radius: 3, color: '#fff', life: 0.05, maxLife: 0.4 },
        { x: 0, y: 0, vx: 0, vy: 0, radius: 3, color: '#fff', life: 0.4, maxLife: 0.4 },
      ],
    }
    updateParticles(state, 0.1)
    expect(state.particles).toHaveLength(1)
  })
})
