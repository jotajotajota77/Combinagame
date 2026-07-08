import { ROWS, COLS, SPECIAL, DIR } from './constants.js'
import { key } from './board.js'

// Um "grupo" é um conjunto conexo de células da mesma cor que forma um match.
// A classificação decide qual gema especial (se alguma) ele cria.

function colorAt(board, r, c) {
  const cell = board[r][c]
  // Cor < 0 (bomba) nunca casa em matches comuns.
  return cell && cell.color >= 0 ? cell.color : null
}

// Coleta runs horizontais e verticais de comprimento >= 3.
function collectRuns(board) {
  const runs = []
  // Horizontais
  for (let r = 0; r < ROWS; r++) {
    let c = 0
    while (c < COLS) {
      const color = colorAt(board, r, c)
      if (color === null) {
        c++
        continue
      }
      let c2 = c
      while (c2 + 1 < COLS && colorAt(board, r, c2 + 1) === color) c2++
      const len = c2 - c + 1
      if (len >= 3) {
        const cells = []
        for (let k = c; k <= c2; k++) cells.push({ r, c: k })
        runs.push({ cells, dir: DIR.ROW, len })
      }
      c = c2 + 1
    }
  }
  // Verticais
  for (let c = 0; c < COLS; c++) {
    let r = 0
    while (r < ROWS) {
      const color = colorAt(board, r, c)
      if (color === null) {
        r++
        continue
      }
      let r2 = r
      while (r2 + 1 < ROWS && colorAt(board, r2 + 1, c) === color) r2++
      const len = r2 - r + 1
      if (len >= 3) {
        const cells = []
        for (let k = r; k <= r2; k++) cells.push({ r: k, c })
        runs.push({ cells, dir: DIR.COL, len })
      }
      r = r2 + 1
    }
  }
  return runs
}

// Detecta quadrados 2x2 de mesma cor (base do peixe / gema 1).
function collectSquares(board) {
  const squares = []
  for (let r = 0; r < ROWS - 1; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      const color = colorAt(board, r, c)
      if (color === null) continue
      if (
        colorAt(board, r, c + 1) === color &&
        colorAt(board, r + 1, c) === color &&
        colorAt(board, r + 1, c + 1) === color
      ) {
        squares.push([
          { r, c },
          { r, c: c + 1 },
          { r: r + 1, c },
          { r: r + 1, c: c + 1 },
        ])
      }
    }
  }
  return squares
}

// Union-find simples sobre chaves de célula.
function makeDSU() {
  const parent = new Map()
  function find(x) {
    if (!parent.has(x)) parent.set(x, x)
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)))
      x = parent.get(x)
    }
    return x
  }
  function union(a, b) {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }
  return { find, union }
}

// Encontra todos os grupos de match no tabuleiro e classifica a forma de cada um.
// preferredOrigins: células (ex.: as trocadas pelo jogador) onde preferimos criar o especial.
export function findMatchGroups(board, preferredOrigins = []) {
  const runs = collectRuns(board)
  const squares = collectSquares(board)
  if (runs.length === 0 && squares.length === 0) return []

  const dsu = makeDSU()
  const allSets = [...runs.map((r) => r.cells), ...squares]
  for (const cells of allSets) {
    const first = key(cells[0].r, cells[0].c)
    for (const cell of cells) dsu.union(first, key(cell.r, cell.c))
  }

  // Agrupa células por raiz.
  const groups = new Map() // root -> { cells: Map<k,{r,c}> }
  for (const cells of allSets) {
    for (const cell of cells) {
      const k = key(cell.r, cell.c)
      const root = dsu.find(k)
      if (!groups.has(root)) groups.set(root, new Map())
      groups.get(root).set(k, cell)
    }
  }

  const prefSet = new Set(preferredOrigins.map((p) => key(p.r, p.c)))
  const result = []
  for (const cellMap of groups.values()) {
    const cells = [...cellMap.values()]
    result.push(classifyGroup(board, cells, prefSet))
  }
  return result
}

// Mede maior run horizontal/vertical e detecta cruzamento (célula em H>=3 e V>=3).
function measure(board, cells) {
  const set = new Set(cells.map((c) => key(c.r, c.c)))
  const color = board[cells[0].r][cells[0].c].color

  let maxH = 1
  let maxV = 1
  let crossCell = null

  for (const { r, c } of cells) {
    // Comprimento horizontal contíguo passando por (r,c) dentro do grupo.
    let left = c
    while (left - 1 >= 0 && set.has(key(r, left - 1))) left--
    let right = c
    while (right + 1 < COLS && set.has(key(r, right + 1))) right++
    const hLen = right - left + 1

    let up = r
    while (up - 1 >= 0 && set.has(key(up - 1, c))) up--
    let down = r
    while (down + 1 < ROWS && set.has(key(down + 1, c))) down++
    const vLen = down - up + 1

    if (hLen > maxH) maxH = hLen
    if (vLen > maxV) maxV = vLen
    if (hLen >= 3 && vLen >= 3 && !crossCell) crossCell = { r, c }
  }

  const isSquare = detectSquare(set)
  return { color, maxH, maxV, cross: crossCell, isSquare, size: cells.length }
}

function detectSquare(set) {
  for (const k of set) {
    const [r, c] = k.split(',').map(Number)
    if (set.has(key(r, c + 1)) && set.has(key(r + 1, c)) && set.has(key(r + 1, c + 1))) {
      return { r, c }
    }
  }
  return null
}

// Classificação da forma → gema especial. Precedência (do mais forte ao mais fraco):
// - roda de coco (5): contém uma linha reta de 5 (1x5/5x1) MAIS pelo menos uma célula
//   extra ao lado (T com pernas). Ou seja: run >= 5 e total > tamanho do run.
// - bomba (4): linha reta de 5+ sem ramificação (o total é o próprio run).
// - peixe (1): qualquer forma que contenha um quadrado 2x2 e não se enquadre acima.
// - embrulhada (3): interseção em L/T (runs H e V >= 3 se cruzando), sem 2x2.
// - listrada (2): linha reta de 4.
// - senão: match normal (3).
function classifyGroup(board, cells, prefSet) {
  const m = measure(board, cells)
  let special = null
  let dir = null
  let origin = null

  const longest = Math.max(m.maxH, m.maxV)
  const hasFive = longest >= 5

  if (hasFive && m.size > longest) {
    // linha de 5 com pelo menos uma célula extra ao lado → roda de coco
    special = SPECIAL.COCO
    origin = m.cross || null
  } else if (hasFive) {
    special = SPECIAL.BOMB
  } else if (m.isSquare) {
    special = SPECIAL.FISH
    origin = m.isSquare
  } else if (m.cross) {
    special = SPECIAL.WRAPPED
    origin = m.cross
  } else if (m.maxH === 4 || m.maxV === 4) {
    special = SPECIAL.STRIPED
    dir = m.maxH === 4 ? DIR.ROW : DIR.COL
  }
  // senão: match normal (sem especial)

  if (!origin) origin = pickOrigin(cells, prefSet, m)

  return {
    cells,
    color: m.color,
    special,
    dir,
    origin,
  }
}

// Escolhe onde nasce o especial: célula preferida (troca do jogador) se estiver no grupo,
// senão a célula do meio.
function pickOrigin(cells, prefSet, m) {
  for (const cell of cells) {
    if (prefSet.has(key(cell.r, cell.c))) return cell
  }
  return cells[Math.floor(cells.length / 2)]
}
