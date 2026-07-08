import { ROWS, COLS, SPECIAL } from './constants.js'
import { cloneBoard, makeGem, randomColor } from './board.js'
import { findMatchGroups } from './matches.js'

const isWild = (g) => g && (g.special === SPECIAL.BOMB || g.special === SPECIAL.COCO)

// Existe alguma jogada válida no tabuleiro?
export function hasValidMove(board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const g = board[r][c]
      if (!g) continue
      // Curingas (bomba/coco) sempre têm jogada se houver vizinho.
      if (isWild(g)) return true
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
      ]) {
        const nr = r + dr
        const nc = c + dc
        if (nr >= ROWS || nc >= COLS) continue
        const other = board[nr][nc]
        if (!other) continue
        if (isWild(other)) return true
        if (g.special && other.special) return true
        if (wouldMatch(board, r, c, nr, nc)) return true
      }
    }
  }
  return false
}

// Encontra uma jogada válida (para a dica). Devolve {a,b} ou null.
export function findHint(board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const g = board[r][c]
      if (!g) continue
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
      ]) {
        const nr = r + dr
        const nc = c + dc
        if (nr >= ROWS || nc >= COLS) continue
        const other = board[nr][nc]
        if (!other) continue
        if (isWild(g) || isWild(other) || (g.special && other.special)) {
          return { a: { r, c }, b: { r: nr, c: nc } }
        }
        if (wouldMatch(board, r, c, nr, nc)) {
          return { a: { r, c }, b: { r: nr, c: nc } }
        }
      }
    }
  }
  return null
}

function wouldMatch(board, r1, c1, r2, c2) {
  const nb = cloneBoard(board)
  const tmp = nb[r1][c1]
  nb[r1][c1] = nb[r2][c2]
  nb[r2][c2] = tmp
  return findMatchGroups(nb).length > 0
}

// Reembaralha preservando as gemas existentes (inclusive especiais), garantindo
// nenhum match inicial e pelo menos uma jogada válida. Fallback: tabuleiro novo.
export function reshuffle(board, rng = Math.random) {
  const gems = []
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r][c]) gems.push(board[r][c])

  for (let attempt = 0; attempt < 40; attempt++) {
    const pool = [...gems]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const nb = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
    let idx = 0
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) nb[r][c] = pool[idx++]
    if (findMatchGroups(nb).length === 0 && hasValidMove(nb)) return nb
  }

  // Fallback: tabuleiro totalmente novo.
  const nb = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) nb[r][c] = makeGem(randomColor(rng))
  return nb
}
