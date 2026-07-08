import { describe, it, expect } from 'vitest'
import { findMatchGroups } from './matches.js'
import { createBoard } from './board.js'
import { SPECIAL } from './constants.js'
import { makeBoard, seededRng } from './testUtils.js'

// Retorna os especiais criados pelos grupos detectados.
function specials(board) {
  return findMatchGroups(board)
    .map((g) => g.special)
    .filter(Boolean)
}

describe('createBoard', () => {
  it('não tem matches iniciais', () => {
    const rng = seededRng(1)
    for (let i = 0; i < 20; i++) {
      const board = createBoard(rng)
      expect(findMatchGroups(board)).toHaveLength(0)
    }
  })
})

describe('classificação de formas', () => {
  it('3 em linha → match normal (sem especial)', () => {
    const b = makeBoard({ '0,0': 0, '0,1': 0, '0,2': 0, '0,3': 3, '1,0': 2 })
    const groups = findMatchGroups(b)
    expect(groups).toHaveLength(1)
    expect(groups[0].special).toBeNull()
  })

  it('4 em linha → listrada (gema 2)', () => {
    const b = makeBoard({ '0,0': 0, '0,1': 0, '0,2': 0, '0,3': 0, '0,4': 4, '1,0': 2, '3,3': 1 })
    expect(specials(b)).toContain(SPECIAL.STRIPED)
  })

  it('5 em linha → bomba de cor (gema 4)', () => {
    const b = makeBoard({
      '0,0': 0,
      '0,1': 0,
      '0,2': 0,
      '0,3': 0,
      '0,4': 0,
      '1,0': 2,
      '1,4': 3,
    })
    expect(specials(b)).toContain(SPECIAL.BOMB)
  })

  it('L de 5 células → embrulhada (gema 3)', () => {
    // horizontal r0 c0-2 + vertical c0 r0-2, cruzando em (0,0). (3,0) sobrescrito p/ não estender.
    const b = makeBoard({ '0,0': 0, '0,1': 0, '0,2': 0, '1,0': 0, '2,0': 0, '3,0': 5, '0,3': 5 })
    expect(specials(b)).toContain(SPECIAL.WRAPPED)
  })

  it('T com braço de 5 (linha de 5 + perna) → roda de coco (gema 5)', () => {
    // horizontal r2 c0-4 (5) + perna vertical c2 r3-4, cruzando em (2,2) → 7 células.
    const b = makeBoard({
      '2,0': 0,
      '2,1': 0,
      '2,2': 0,
      '2,3': 0,
      '2,4': 0,
      '3,2': 0,
      '4,2': 0,
      '5,2': 1, // impede que a perna vire uma linha de 5 vertical
    })
    expect(specials(b)).toContain(SPECIAL.COCO)
  })

  it('linha de 5 sem ramificação → bomba (não coco)', () => {
    const b = makeBoard({ '2,0': 0, '2,1': 0, '2,2': 0, '2,3': 0, '2,4': 0, '2,5': 4, '1,0': 2 })
    const s = specials(b)
    expect(s).toContain(SPECIAL.BOMB)
    expect(s).not.toContain(SPECIAL.COCO)
  })

  it('quadrado 2x2 → peixe (gema 1)', () => {
    const b = makeBoard({ '0,0': 0, '0,1': 0, '1,0': 0, '1,1': 0 })
    const groups = findMatchGroups(b)
    expect(groups).toHaveLength(1)
    expect(groups[0].special).toBe(SPECIAL.FISH)
  })

  it('forma que contém um 2x2 (mesmo com linha de 4) → peixe', () => {
    // linha r0 c0-3 (4) + (1,0),(1,1) formam um 2x2 → deve virar peixe, não listrada.
    const b = makeBoard({ '0,0': 0, '0,1': 0, '0,2': 0, '0,3': 0, '1,0': 0, '1,1': 0, '0,4': 4 })
    expect(specials(b)).toContain(SPECIAL.FISH)
  })
})
