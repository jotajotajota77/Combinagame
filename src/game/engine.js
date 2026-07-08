import { cloneBoard, key, parseKey } from './board.js'
import {
  computeMatchResolution,
  applyClear,
  cascade,
  expandActivations,
  handleSwapActivation,
  mapToList,
} from './resolve.js'

function areAdjacent(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1
}

function clearStep(board, clearSet, recolorMap, createList, effects) {
  return {
    type: 'clear',
    board: cloneBoard(board),
    cleared: [...clearSet].map(parseKey),
    creates: createList,
    effects,
    recolors: mapToList(recolorMap),
  }
}

// Resolve uma troca entre duas células adjacentes. Devolve os passos de animação
// e o tabuleiro final. valid=false → troca inválida (a UI faz o bounce-back).
export function resolveMove(board, a, b, rng = Math.random) {
  if (!board[a.r][a.c] || !board[b.r][b.c] || !areAdjacent(a, b)) {
    return { valid: false, steps: [], board }
  }

  const board2 = cloneBoard(board)
  const tmp = board2[a.r][a.c]
  board2[a.r][a.c] = board2[b.r][b.c]
  board2[b.r][b.c] = tmp

  const steps = [{ type: 'swap', board: cloneBoard(board2), a, b }]
  const g1 = board2[a.r][a.c]
  const g2 = board2[b.r][b.c]

  const seed = handleSwapActivation(board2, a, b, rng)
  if (seed) {
    // Troca de especial (combo / curinga).
    for (const u of seed.upgrades) {
      const g = board2[u.r][u.c]
      if (g) {
        g.special = u.special
        g.dir = u.dir
        g.color = u.color
      }
    }
    const extraSeeds = [...seed.extraSeeds, ...seed.upgrades.map((u) => ({ r: u.r, c: u.c, ctx: {} }))]
    expandActivations(board2, seed.clearSet, seed.recolorMap, seed.effects, new Set(), rng, extraSeeds)
    const nb = applyClear(board2, seed.clearSet, seed.recolorMap, [])
    steps.push(clearStep(nb, seed.clearSet, seed.recolorMap, [], seed.effects))
    const finalBoard = cascade(nb, steps, rng)
    return { valid: true, steps, board: finalBoard }
  }

  // Troca comum: só vale se formar match.
  const res = computeMatchResolution(board2, [a, b], rng)
  if (!res) {
    steps.push({ type: 'swapback', board: cloneBoard(board), a, b })
    return { valid: false, steps, board }
  }
  const nb = applyClear(board2, res.clearSet, res.recolorMap, res.createList)
  steps.push(clearStep(nb, res.clearSet, res.recolorMap, res.createList, res.effects))
  const finalBoard = cascade(nb, steps, rng)
  return { valid: true, steps, board: finalBoard }
}

// Ativa um especial por duplo-clique (sem troca). Bomba/coco usam cor aleatória.
export function activateAt(board, r, c, rng = Math.random) {
  const g = board[r][c]
  if (!g || !g.special) return { valid: false, steps: [], board }

  const board2 = cloneBoard(board)
  const clearSet = new Set()
  const recolorMap = new Map()
  const effects = []
  expandActivations(board2, clearSet, recolorMap, effects, new Set(), rng, [{ r, c, ctx: {} }])
  const nb = applyClear(board2, clearSet, recolorMap, [])
  const steps = [clearStep(nb, clearSet, recolorMap, [], effects)]
  const finalBoard = cascade(nb, steps, rng)
  return { valid: true, steps, board: finalBoard }
}

export { key, parseKey }
