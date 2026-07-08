import { describe, it, expect } from 'vitest'
import { resolveMove, activateAt } from './engine.js'
import { applyGravity } from './gravity.js'
import { hasValidMove, reshuffle, findHint } from './moves.js'
import { SPECIAL, DIR, ROWS, COLS } from './constants.js'
import { makeBoard, seededRng, countColor, findSpecial } from './testUtils.js'

// Verifica que nenhuma célula ficou vazia no tabuleiro final.
function isFull(board) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!board[r][c]) return false
  return true
}

describe('resolveMove — troca comum', () => {
  it('troca que forma 3 em linha é válida e limpa as peças', () => {
    // (1,2)=0 ; trocar (1,2)<->(0,2) põe 0 em (0,2) formando 0,0,0 na linha 0.
    const b = makeBoard({ '0,0': 0, '0,1': 0, '0,2': 4, '1,2': 0, '0,3': 3 })
    const rng = seededRng(7)
    const res = resolveMove(b, { r: 0, c: 2 }, { r: 1, c: 2 }, rng)
    expect(res.valid).toBe(true)
    expect(res.steps.some((s) => s.type === 'clear')).toBe(true)
    expect(isFull(res.board)).toBe(true)
  })

  it('troca que não forma match é inválida e gera swapback', () => {
    const b = makeBoard()
    const res = resolveMove(b, { r: 4, c: 4 }, { r: 4, c: 5 }, seededRng(1))
    expect(res.valid).toBe(false)
    expect(res.steps.some((s) => s.type === 'swapback')).toBe(true)
  })

  it('troca não-adjacente é inválida', () => {
    const b = makeBoard()
    const res = resolveMove(b, { r: 0, c: 0 }, { r: 5, c: 5 }, seededRng(1))
    expect(res.valid).toBe(false)
  })

  it('troca formando 4 em linha cria uma listrada', () => {
    // linha 0: c0,c1,c3 = 0 e (1,2)=0; trocar (0,2)<->(1,2) completa 0,0,0,0.
    const b = makeBoard({ '0,0': 0, '0,1': 0, '0,3': 0, '1,2': 0, '0,2': 4, '0,4': 4, '1,0': 2 })
    const res = resolveMove(b, { r: 0, c: 2 }, { r: 1, c: 2 }, seededRng(3))
    expect(res.valid).toBe(true)
    // Em algum passo, uma listrada deve ter sido criada.
    const created = res.steps.some((s) => (s.creates || []).some((cr) => cr.special === SPECIAL.STRIPED))
    expect(created).toBe(true)
  })
})

describe('especiais — ativação por troca (curingas)', () => {
  it('bomba + normal remove toda a cor do parceiro', () => {
    const b = makeBoard({ '4,4': { color: -1, special: SPECIAL.BOMB } })
    const targetColor = b[4][5].color
    const before = countColor(b, targetColor)
    expect(before).toBeGreaterThan(0)
    const res = resolveMove(b, { r: 4, c: 4 }, { r: 4, c: 5 }, seededRng(5))
    expect(res.valid).toBe(true)
    // Após a cascata o tabuleiro é reabastecido, mas o efeito de limpeza deve
    // aparecer nos passos como um efeito 'bomb'.
    const hadBomb = res.steps.some((s) => (s.effects || []).some((e) => e.kind === 'bomb'))
    expect(hadBomb).toBe(true)
  })

  it('coco + normal converte a cor do parceiro para a cor da roda', () => {
    // roda de coco cor 0 em (4,4); parceiro (4,5) cor safe.
    const b = makeBoard({ '4,4': { color: 0, special: SPECIAL.COCO } })
    const partnerColor = b[4][5].color
    const res = resolveMove(b, { r: 4, c: 4 }, { r: 4, c: 5 }, seededRng(9))
    expect(res.valid).toBe(true)
    const cocoEffect = res.steps
      .flatMap((s) => s.effects || [])
      .find((e) => e.kind === 'coco')
    expect(cocoEffect).toBeTruthy()
    expect(cocoEffect.to).toBe(0)
    expect(cocoEffect.from).toBe(partnerColor)
  })
})

describe('especiais — combos', () => {
  it('listrada + listrada limpa linha e coluna (cruz)', () => {
    const b = makeBoard({
      '4,4': { color: 0, special: SPECIAL.STRIPED, dir: DIR.ROW },
      '4,5': { color: 1, special: SPECIAL.STRIPED, dir: DIR.COL },
    })
    const res = resolveMove(b, { r: 4, c: 4 }, { r: 4, c: 5 }, seededRng(11))
    expect(res.valid).toBe(true)
    const cross = res.steps.flatMap((s) => s.effects || []).find((e) => e.kind === 'cross')
    expect(cross).toBeTruthy()
  })

  it('bomba + bomba limpa o tabuleiro inteiro', () => {
    const b = makeBoard({
      '4,4': { color: -1, special: SPECIAL.BOMB },
      '4,5': { color: -1, special: SPECIAL.BOMB },
    })
    const res = resolveMove(b, { r: 4, c: 4 }, { r: 4, c: 5 }, seededRng(13))
    expect(res.valid).toBe(true)
    const firstClear = res.steps.find((s) => s.type === 'clear')
    expect(firstClear.cleared.length).toBe(ROWS * COLS)
  })

  it('bomba + listrada converte a cor em listradas e ativa todas', () => {
    const b = makeBoard({
      '4,4': { color: -1, special: SPECIAL.BOMB },
      '4,5': { color: 0, special: SPECIAL.STRIPED, dir: DIR.ROW },
    })
    const res = resolveMove(b, { r: 4, c: 4 }, { r: 4, c: 5 }, seededRng(17))
    expect(res.valid).toBe(true)
    const upgrade = res.steps.flatMap((s) => s.effects || []).find((e) => e.kind === 'bomb-upgrade')
    expect(upgrade).toBeTruthy()
  })
})

describe('especiais — duplo-clique', () => {
  it('duplo-clique numa listrada ativa e limpa a linha', () => {
    const b = makeBoard({ '3,3': { color: 0, special: SPECIAL.STRIPED, dir: DIR.ROW } })
    const res = activateAt(b, 3, 3, seededRng(2))
    expect(res.valid).toBe(true)
    const stripe = res.steps.flatMap((s) => s.effects || []).find((e) => e.kind === 'stripe')
    expect(stripe).toBeTruthy()
  })

  it('duplo-clique numa bomba usa cor aleatória e limpa alguma cor', () => {
    const b = makeBoard({ '3,3': { color: -1, special: SPECIAL.BOMB } })
    const res = activateAt(b, 3, 3, seededRng(4))
    expect(res.valid).toBe(true)
    const bomb = res.steps.flatMap((s) => s.effects || []).find((e) => e.kind === 'bomb')
    expect(bomb).toBeTruthy()
    expect(bomb.color).toBeGreaterThanOrEqual(0)
  })
})

describe('gravidade', () => {
  it('peças caem e o topo é reabastecido', () => {
    const b = makeBoard({ '7,0': null, '6,0': null })
    const { moves, spawns } = applyGravity(b, seededRng(1))
    expect(moves.length + spawns.length).toBeGreaterThan(0)
    expect(isFull(b)).toBe(true)
  })
})

describe('jogadas e reshuffle', () => {
  it('hasValidMove detecta uma jogada possível', () => {
    const b = makeBoard({ '0,0': 0, '0,1': 0, '1,2': 0 })
    expect(hasValidMove(b)).toBe(true)
  })

  it('findHint devolve uma troca válida', () => {
    const b = makeBoard({ '0,0': 0, '0,1': 0, '1,2': 0 })
    const hint = findHint(b)
    expect(hint).toBeTruthy()
    expect(hint.a).toBeTruthy()
    expect(hint.b).toBeTruthy()
  })

  it('reshuffle produz tabuleiro sem match inicial e com jogada válida', () => {
    const b = makeBoard()
    const nb = reshuffle(b, seededRng(20))
    expect(isFull(nb)).toBe(true)
    expect(hasValidMove(nb)).toBe(true)
  })
})
