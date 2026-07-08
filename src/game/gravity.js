import { ROWS, COLS } from './constants.js'
import { makeGem, randomColor } from './board.js'

// Aplica gravidade: peças caem para preencher vazios; novas gemas surgem no topo.
// Retorna a lista de movimentos (para animação FLIP) e as gemas novas geradas.
export function applyGravity(board, rng = Math.random) {
  const moves = [] // { id, from:{r,c}, to:{r,c} }
  const spawns = [] // { r, c, id }

  for (let c = 0; c < COLS; c++) {
    let writeRow = ROWS - 1
    // Compacta de baixo para cima.
    for (let r = ROWS - 1; r >= 0; r--) {
      const gem = board[r][c]
      if (gem) {
        if (writeRow !== r) {
          board[writeRow][c] = gem
          board[r][c] = null
          moves.push({ id: gem.id, from: { r, c }, to: { r: writeRow, c } })
        }
        writeRow--
      }
    }
    // Preenche o restante (do writeRow para cima) com gemas novas.
    for (let r = writeRow; r >= 0; r--) {
      const gem = makeGem(randomColor(rng))
      board[r][c] = gem
      spawns.push({ r, c, id: gem.id })
    }
  }

  return { moves, spawns }
}
