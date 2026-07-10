import { ROWS, COLS, DIR } from './constants.js'
import { key, inBounds } from './board.js'

// Helpers puros de seleção de células. A lógica de encadeamento fica em resolve.js.

export function rowCells(r) {
  const cells = []
  for (let c = 0; c < COLS; c++) cells.push({ r, c })
  return cells
}

export function colCells(c) {
  const cells = []
  for (let r = 0; r < ROWS; r++) cells.push({ r, c })
  return cells
}

// Bloco quadrado (2*radius+1) centrado em (r,c). radius=1 → 3x3, radius=2 → 5x5.
export function areaCells(r, c, radius = 1) {
  const cells = []
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const nr = r + dr
      const nc = c + dc
      if (inBounds(nr, nc)) cells.push({ r: nr, c: nc })
    }
  }
  return cells
}

// Todas as células cuja gema tem a cor dada.
export function colorCells(board, color) {
  const cells = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const g = board[r][c]
      if (g && g.color === color) cells.push({ r, c })
    }
  }
  return cells
}

// Células da listrada, conforme sua direção.
export function stripedCells(r, c, dir) {
  return dir === DIR.COL ? colCells(c) : rowCells(r)
}

// Cores comuns (>=0) presentes no tabuleiro, distintas.
export function presentColors(board, exclude = null) {
  const seen = new Set()
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const g = board[r][c]
      if (g && g.color >= 0 && g.color !== exclude) seen.add(g.color)
    }
  }
  return [...seen]
}

export function randomPresentColor(board, exclude, rng = Math.random) {
  const colors = presentColors(board, exclude)
  if (colors.length === 0) return exclude ?? 0
  return colors[Math.floor(rng() * colors.length)]
}

// Alvos do peixe (gema 1): prioriza gemas especiais/alvos; completa com aleatórias.
// `exclude` (Set de chaves "r,c") deixa de fora células já marcadas para sumir
// nesta mesma resolução (por outro efeito), pra o peixe nunca nadar até algo
// que já foi destruído/ativado.
export function pickFishTargets(board, r, c, count, rng = Math.random, exclude = null) {
  const self = key(r, c)
  const specials = []
  const normals = []
  for (let rr = 0; rr < ROWS; rr++) {
    for (let cc = 0; cc < COLS; cc++) {
      const k = key(rr, cc)
      if (k === self) continue
      if (exclude && exclude.has(k)) continue
      const g = board[rr][cc]
      if (!g) continue
      if (g.special) specials.push({ r: rr, c: cc })
      else normals.push({ r: rr, c: cc })
    }
  }
  shuffle(specials, rng)
  shuffle(normals, rng)
  const pool = [...specials, ...normals]
  return pool.slice(0, count)
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
