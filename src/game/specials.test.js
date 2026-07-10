import { describe, it, expect } from 'vitest'
import { pickFishTargets } from './specials.js'
import { key } from './board.js'
import { makeBoard, seededRng } from './testUtils.js'

describe('pickFishTargets', () => {
  it('nunca escolhe uma célula presente em `exclude` (já marcada pra sumir)', () => {
    const b = makeBoard()
    // Marca metade do tabuleiro como já "em clearSet" — o peixe não pode mirar nelas.
    const exclude = new Set()
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) exclude.add(key(r, c))

    for (let seed = 1; seed <= 10; seed++) {
      const targets = pickFishTargets(b, 7, 0, 6, seededRng(seed), exclude)
      for (const t of targets) {
        expect(exclude.has(key(t.r, t.c))).toBe(false)
      }
    }
  })

  it('nunca escolhe a própria célula de origem', () => {
    const b = makeBoard()
    for (let seed = 1; seed <= 10; seed++) {
      const targets = pickFishTargets(b, 3, 3, 8, seededRng(seed))
      expect(targets.some((t) => t.r === 3 && t.c === 3)).toBe(false)
    }
  })
})
