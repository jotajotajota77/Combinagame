import { ROWS, COLS, NCOLORS } from './constants.js'
import { makeGem, resetIds } from './board.js'

// Padrão diagonal sem matches: cada célula difere das vizinhas horizontais e verticais,
// e nenhum quadrado 2x2 é monocromático.
export function safe(r, c) {
  return (c + 2 * r) % NCOLORS
}

// Constrói um tabuleiro 8x8 preenchido com o padrão seguro, com overrides.
// overrides: { 'r,c': color | {color, special, dir} | null }
export function makeBoard(overrides = {}) {
  resetIds(1)
  const b = []
  for (let r = 0; r < ROWS; r++) {
    const row = []
    for (let c = 0; c < COLS; c++) row.push(makeGem(safe(r, c)))
    b.push(row)
  }
  for (const [k, v] of Object.entries(overrides)) {
    const [r, c] = k.split(',').map(Number)
    if (v === null) b[r][c] = null
    else if (typeof v === 'number') b[r][c] = makeGem(v)
    else b[r][c] = makeGem(v.color, v.special, v.dir)
  }
  return b
}

// RNG determinístico (mulberry32) para testes reproduzíveis.
export function seededRng(seed = 12345) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Conta gemas de uma cor no tabuleiro.
export function countColor(board, color) {
  let n = 0
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r][c]?.color === color) n++
  return n
}

// Encontra a primeira gema com o especial dado.
export function findSpecial(board, special) {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) if (board[r][c]?.special === special) return { r, c, gem: board[r][c] }
  return null
}
