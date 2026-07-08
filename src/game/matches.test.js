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

  it('T grande de 6+ células → roda de coco (gema 5)', () => {
    // horizontal r2 c0-2 (3) + vertical c1 r0-3 (4), cruzando em (2,1) → 6 células.
    const b = makeBoard({
      '0,1': 0,
      '1,1': 0,
      '2,1': 0,
      '3,1': 0,
      '2,0': 0,
      '2,2': 0,
      '4,1': 5,
      '2,3': 5,
    })
    expect(specials(b)).toContain(SPECIAL.COCO)
  })

  it('quadrado 2x2 → peixe (gema 1)', () => {
    const b = makeBoard({ '0,0': 0, '0,1': 0, '1,0': 0, '1,1': 0 })
    const groups = findMatchGroups(b)
    expect(groups).toHaveLength(1)
    expect(groups[0].special).toBe(SPECIAL.FISH)
  })
})
