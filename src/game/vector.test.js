import { describe, it, expect } from 'vitest'
import { distance, direction, normalizeAngle } from './vector.js'

describe('distance', () => {
  it('calcula a distância euclidiana', () => {
    expect(distance(0, 0, 3, 4)).toBe(5)
    expect(distance(2, 2, 2, 2)).toBe(0)
  })
})

describe('direction', () => {
  it('devolve um vetor unitário apontando de a para b', () => {
    const d = direction(0, 0, 10, 0)
    expect(d.x).toBeCloseTo(1)
    expect(d.y).toBeCloseTo(0)
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1)
  })

  it('devolve {0,0} quando os pontos coincidem', () => {
    expect(direction(5, 5, 5, 5)).toEqual({ x: 0, y: 0 })
  })
})

describe('normalizeAngle', () => {
  it('mantém ângulos já dentro de (-PI, PI]', () => {
    expect(normalizeAngle(1)).toBeCloseTo(1)
    expect(normalizeAngle(-1)).toBeCloseTo(-1)
  })

  it('traz ângulos maiores que PI de volta pro intervalo', () => {
    expect(normalizeAngle(Math.PI * 1.5)).toBeCloseTo(-Math.PI * 0.5)
  })

  it('traz ângulos menores que -PI de volta pro intervalo', () => {
    expect(normalizeAngle(-Math.PI * 1.5)).toBeCloseTo(Math.PI * 0.5)
  })
})
