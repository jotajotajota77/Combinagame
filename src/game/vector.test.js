import { describe, it, expect } from 'vitest'
import { distance, direction } from './vector.js'

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
