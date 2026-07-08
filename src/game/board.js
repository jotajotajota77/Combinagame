import { ROWS, COLS, config } from './constants.js'

// Contador global de ids estáveis — usados como chave de animação (FLIP) na UI.
let _nextId = 1
export function nextId() {
  return _nextId++
}
export function resetIds(n = 1) {
  _nextId = n
}

// Fábrica de gema. `special` e `dir` só existem para gemas especiais.
export function makeGem(color, special = null, dir = null) {
  return { id: nextId(), color, special, dir }
}

export function inBounds(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS
}

export function key(r, c) {
  return `${r},${c}`
}

export function parseKey(k) {
  const [r, c] = k.split(',').map(Number)
  return { r, c }
}

export function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)))
}

export function randomColor(rng = Math.random) {
  return Math.floor(rng() * config.numColors)
}

// Cria um tabuleiro cheio sem nenhum match inicial (nem linhas de 3, nem quadrados 2x2).
export function createBoard(rng = Math.random) {
  const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let color
      let guard = 0
      do {
        color = randomColor(rng)
        guard++
      } while (guard < 50 && createsImmediateMatch(board, r, c, color))
      board[r][c] = makeGem(color)
    }
  }
  return board
}

// Verifica se colocar `color` em (r,c) já formaria uma linha de 3 ou um quadrado 2x2
// com as peças já posicionadas acima/à esquerda.
function createsImmediateMatch(board, r, c, color) {
  if (c >= 2 && board[r][c - 1]?.color === color && board[r][c - 2]?.color === color) return true
  if (r >= 2 && board[r - 1][c]?.color === color && board[r - 2][c]?.color === color) return true
  if (
    r >= 1 &&
    c >= 1 &&
    board[r - 1][c]?.color === color &&
    board[r][c - 1]?.color === color &&
    board[r - 1][c - 1]?.color === color
  ) {
    return true
  }
  return false
}
