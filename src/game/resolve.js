import { ROWS, COLS, SPECIAL, DIR, BOMB_COLOR } from './constants.js'
import { cloneBoard, key, parseKey, inBounds } from './board.js'
import { findMatchGroups } from './matches.js'
import { applyGravity } from './gravity.js'
import {
  rowCells,
  colCells,
  areaCells,
  colorCells,
  stripedCells,
  randomPresentColor,
  pickFishTargets,
} from './specials.js'

const MAX_ROUNDS = 300

function mapToList(map) {
  return [...map].map(([k, color]) => ({ ...parseKey(k), color }))
}

// ---------------------------------------------------------------------------
// Ativação de um único especial. Adiciona células a `clearSet` (respeitando os
// especiais protegidos, recém-criados) e registra efeitos visuais.
//
// Efeitos nunca se sobrepõem: se a área/linha/cor de um especial pega OUTRO
// especial de raspão, esse outro NÃO é limpo/disparado agora — fica intacto e
// vai para `pendingIds` (o id da gema), para ativar sozinho numa rodada
// seguinte (depois da gravidade repor as peças). A única exceção são os
// combos por troca direta (mistura), que não passam por aqui.
// ---------------------------------------------------------------------------
export function triggerSpecial(board, r, c, ctx, rng, clearSet, recolorMap, effects, protectedSet, pendingIds) {
  const gem = board[r][c]
  const newly = []
  const add = (cell) => {
    if (!inBounds(cell.r, cell.c)) return
    const k = key(cell.r, cell.c)
    if (protectedSet.has(k)) return
    if (clearSet.has(k)) return
    const isSelf = cell.r === r && cell.c === c
    const target = board[cell.r][cell.c]
    if (!isSelf && target && target.special) {
      pendingIds.add(target.id)
      return
    }
    clearSet.add(k)
    newly.push(cell)
  }
  if (!gem || !gem.special) {
    add({ r, c })
    return newly
  }

  switch (gem.special) {
    case SPECIAL.STRIPED: {
      const dir = gem.dir || DIR.ROW
      stripedCells(r, c, dir).forEach(add)
      effects.push({ kind: 'stripe', dir, r, c })
      break
    }
    case SPECIAL.WRAPPED: {
      areaCells(r, c, 1).forEach(add)
      effects.push({ kind: 'wrap', r, c })
      break
    }
    case SPECIAL.BOMB: {
      const target = ctx.bombColor != null ? ctx.bombColor : randomPresentColor(board, null, rng)
      const hits = colorCells(board, target)
      hits.forEach(add)
      add({ r, c })
      // raios saindo da gema em direção a cada peça da cor alvo
      effects.push({ kind: 'bomb', color: target, r, c, targets: hits })
      break
    }
    case SPECIAL.FISH: {
      // Peixe sozinho (cascata/duplo-clique/consumido numa combinação): sempre 2 peixes.
      const count = ctx.fishCount ?? 2
      const targets = pickFishTargets(board, r, c, count, rng, clearSet)
      targets.forEach(add)
      add({ r, c })
      effects.push({ kind: 'fish', from: { r, c }, targets })
      break
    }
    case SPECIAL.COCO: {
      const toColor = gem.color
      const fromColor =
        ctx.convertFrom != null ? ctx.convertFrom : randomPresentColor(board, toColor, rng)
      const painted = []
      for (const cell of colorCells(board, fromColor)) {
        const k = key(cell.r, cell.c)
        if (!clearSet.has(k) && !protectedSet.has(k)) {
          recolorMap.set(k, toColor)
          painted.push(cell)
        }
      }
      add({ r, c })
      // gotas de tinta indo da roda até cada peça convertida
      effects.push({ kind: 'coco', from: fromColor, to: toColor, r, c, targets: painted })
      break
    }
    default:
      add({ r, c })
  }
  return newly
}

// Dispara um conjunto de sementes (especiais já presentes em `clearSet`, mais
// `extraSeeds` explícitas) uma única vez cada — sem recursão automática: se o
// disparo de uma semente pegar OUTRO especial de raspão, ele fica pendente
// (ver `triggerSpecial`) em vez de ativar na mesma passagem. Devolve o Set de
// ids pendentes, para o chamador agendá-los numa rodada seguinte.
export function expandActivations(
  board,
  clearSet,
  recolorMap,
  effects,
  protectedSet,
  rng,
  extraSeeds = [],
) {
  const pendingIds = new Set()
  const processed = new Set()
  const seeds = []
  const addSeed = (r, c, ctx) => {
    const k = key(r, c)
    if (processed.has(k) || protectedSet.has(k)) return
    const g = board[r][c]
    if (g && g.special) {
      processed.add(k)
      seeds.push({ r, c, ctx: ctx || {} })
    }
  }
  for (const k of [...clearSet]) {
    const { r, c } = parseKey(k)
    addSeed(r, c)
  }
  for (const s of extraSeeds) {
    const k = key(s.r, s.c)
    if (!processed.has(k)) {
      processed.add(k)
      seeds.push(s)
    }
  }

  for (const { r, c, ctx } of seeds) {
    triggerSpecial(board, r, c, ctx, rng, clearSet, recolorMap, effects, protectedSet, pendingIds)
  }
  return pendingIds
}

// Localiza a posição atual de uma gema por id (a gravidade pode ter deslocado
// uma gema pendente antes de ela finalmente disparar).
function findById(board, id) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] && board[r][c].id === id) return { r, c }
    }
  }
  return null
}

// Dispara os especiais pendentes de uma rodada anterior (cada um numa gema já
// assentada pela gravidade). Devolve null se nenhum ainda existir no tabuleiro.
function fireDeferred(board, ids, rng) {
  const clearSet = new Set()
  const recolorMap = new Map()
  const effects = []
  const protectedSet = new Set()
  const pendingIds = new Set()
  for (const id of ids) {
    const pos = findById(board, id)
    if (!pos) continue
    const k = key(pos.r, pos.c)
    if (clearSet.has(k)) continue
    triggerSpecial(board, pos.r, pos.c, {}, rng, clearSet, recolorMap, effects, protectedSet, pendingIds)
  }
  if (clearSet.size === 0 && recolorMap.size === 0) return null
  return { clearSet, recolorMap, effects, pending: pendingIds }
}

// Constrói o novo tabuleiro após uma limpeza: cria especiais, aplica recolorações,
// e remove as células limpas.
export function applyClear(board, clearSet, recolorMap, createList) {
  const nb = cloneBoard(board)
  for (const cr of createList) {
    const g = nb[cr.r][cr.c]
    if (g) {
      g.special = cr.special
      g.dir = cr.dir
      g.color = cr.color
    }
  }
  for (const [k, color] of recolorMap) {
    if (clearSet.has(k)) continue
    const { r, c } = parseKey(k)
    if (nb[r][c]) nb[r][c].color = color
  }
  for (const k of clearSet) {
    const { r, c } = parseKey(k)
    nb[r][c] = null
  }
  return nb
}

// Detecta matches e monta a resolução de uma rodada (sem aplicar).
export function computeMatchResolution(board, preferredOrigins, rng) {
  const groups = findMatchGroups(board, preferredOrigins)
  if (groups.length === 0) return null

  const clearSet = new Set()
  const createList = []
  const recolorMap = new Map()
  const effects = []
  const protectedSet = new Set()

  for (const g of groups) {
    if (g.special) protectedSet.add(key(g.origin.r, g.origin.c))
  }
  for (const g of groups) {
    if (g.special) {
      const ok = key(g.origin.r, g.origin.c)
      createList.push({
        r: g.origin.r,
        c: g.origin.c,
        special: g.special,
        dir: g.dir,
        color: g.special === SPECIAL.BOMB ? BOMB_COLOR : g.color,
      })
      for (const cell of g.cells) {
        const k = key(cell.r, cell.c)
        if (k !== ok) clearSet.add(k)
      }
    } else {
      for (const cell of g.cells) clearSet.add(key(cell.r, cell.c))
    }
  }

  const pending = expandActivations(board, clearSet, recolorMap, effects, protectedSet, rng)
  return { clearSet, createList, recolorMap, effects, pending }
}

// Loop de cascata após uma limpeza inicial: gravidade → match → repete.
// `initialPending` são ids de especiais pegos de raspão (não deste round) que
// ainda precisam disparar sozinhos, cada um na sua própria rodada (gravidade
// entre eles) — nunca sobrepostos ao efeito que os pegou.
export function cascade(startBoard, steps, rng, initialPending = new Set()) {
  let cur = startBoard
  let rounds = 0
  let pending = initialPending
  while (rounds++ < MAX_ROUNDS) {
    const gb = cloneBoard(cur)
    const { moves, spawns } = applyGravity(gb, rng)
    if (moves.length || spawns.length) {
      steps.push({ type: 'fall', board: cloneBoard(gb), moves, spawns })
    }
    cur = gb

    if (pending.size) {
      const res = fireDeferred(cur, pending, rng)
      pending = new Set()
      if (!res) continue
      const nb = applyClear(cur, res.clearSet, res.recolorMap, [])
      steps.push({
        type: 'clear',
        board: cloneBoard(nb),
        cleared: [...res.clearSet].map(parseKey),
        creates: [],
        effects: res.effects,
        recolors: mapToList(res.recolorMap),
      })
      cur = nb
      pending = res.pending
      continue
    }

    const res = computeMatchResolution(cur, [], rng)
    if (!res) break
    const nb = applyClear(cur, res.clearSet, res.recolorMap, res.createList)
    steps.push({
      type: 'clear',
      board: cloneBoard(nb),
      cleared: [...res.clearSet].map(parseKey),
      creates: res.createList,
      effects: res.effects,
      recolors: mapToList(res.recolorMap),
    })
    cur = nb
    pending = res.pending || new Set()
  }
  return cur
}

// ---------------------------------------------------------------------------
// Ativação por troca (combos + curingas bomba/coco). Devolve as sementes da
// primeira limpeza, ou null se não for uma troca de especial.
// ---------------------------------------------------------------------------
const isWild = (g) => g && (g.special === SPECIAL.BOMB || g.special === SPECIAL.COCO)

export function handleSwapActivation(board, p1, p2, rng) {
  const g1 = board[p1.r][p1.c]
  const g2 = board[p2.r][p2.c]
  if (!g1 || !g2) return null

  const wildcard = isWild(g1) || isWild(g2)
  const bothSpecial = g1.special && g2.special
  if (!wildcard && !bothSpecial) return null

  const clearSet = new Set()
  const recolorMap = new Map()
  const effects = []
  const extraSeeds = []
  const upgrades = []
  const addClear = (cell) => clearSet.add(key(cell.r, cell.c))
  const center = p2

  const t1 = g1.special
  const t2 = g2.special

  // --- bomba + bomba: limpa o tabuleiro inteiro ---
  if (t1 === SPECIAL.BOMB && t2 === SPECIAL.BOMB) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) addClear({ r, c })
    effects.push({ kind: 'bomb-board', r: center.r, c: center.c })
    return { clearSet, recolorMap, effects, extraSeeds, upgrades }
  }

  // --- peixe + peixe: um cardume de 5 peixes ---
  if (t1 === SPECIAL.FISH && t2 === SPECIAL.FISH) {
    addClear(p1)
    addClear(p2)
    const targets = pickFishTargets(board, center.r, center.c, 5, rng, clearSet)
    targets.forEach(addClear)
    effects.push({ kind: 'fish-combo', from: center, targets })
    return { clearSet, recolorMap, effects, extraSeeds, upgrades }
  }

  // --- peixe + qualquer outro especial: só 1 peixe nada até 1 alvo e carrega o
  // efeito do parceiro (ex.: peixe+listrada → 1 peixe que, ao chegar, limpa a
  // linha/coluna do alvo; peixe+bomba → 1 peixe que limpa a cor do alvo). ---
  if (t1 === SPECIAL.FISH || t2 === SPECIAL.FISH) {
    const fish = t1 === SPECIAL.FISH ? g1 : g2
    const fishPos = t1 === SPECIAL.FISH ? p1 : p2
    const partner = t1 === SPECIAL.FISH ? g2 : g1
    const partnerPos = t1 === SPECIAL.FISH ? p2 : p1
    addClear(fishPos)
    addClear(partnerPos)

    const [target] = pickFishTargets(board, fishPos.r, fishPos.c, 1, rng, clearSet)
    if (!target) {
      effects.push({ kind: 'fish', from: fishPos, targets: [] })
      return { clearSet, recolorMap, effects, extraSeeds, upgrades }
    }
    addClear(target)
    effects.push({ kind: 'fish', from: fishPos, targets: [target] })

    switch (partner.special) {
      case SPECIAL.STRIPED: {
        const dir = partner.dir || DIR.ROW
        stripedCells(target.r, target.c, dir).forEach(addClear)
        effects.push({ kind: 'stripe', dir, r: target.r, c: target.c })
        break
      }
      case SPECIAL.WRAPPED: {
        areaCells(target.r, target.c, 1).forEach(addClear)
        effects.push({ kind: 'wrap', r: target.r, c: target.c })
        break
      }
      case SPECIAL.BOMB: {
        const color = fish.color
        const hits = colorCells(board, color).filter(
          (cell) => !(cell.r === target.r && cell.c === target.c),
        )
        hits.forEach(addClear)
        effects.push({ kind: 'bomb', color, r: target.r, c: target.c, targets: hits })
        break
      }
      case SPECIAL.COCO: {
        const toColor = partner.color
        const fromColor = fish.color === toColor ? randomPresentColor(board, toColor, rng) : fish.color
        const painted = []
        for (const cell of colorCells(board, fromColor)) {
          const k = key(cell.r, cell.c)
          if (k !== key(target.r, target.c) && !clearSet.has(k)) {
            recolorMap.set(k, toColor)
            painted.push(cell)
          }
        }
        effects.push({ kind: 'coco', from: fromColor, to: toColor, r: target.r, c: target.c, targets: painted })
        break
      }
      default:
        break
    }
    return { clearSet, recolorMap, effects, extraSeeds, upgrades }
  }

  // --- bomba + X ---
  if (t1 === SPECIAL.BOMB || t2 === SPECIAL.BOMB) {
    const bombPos = t1 === SPECIAL.BOMB ? p1 : p2
    const other = t1 === SPECIAL.BOMB ? g2 : g1
    const otherPos = t1 === SPECIAL.BOMB ? p2 : p1
    addClear(bombPos)
    if (!other.special || other.special === SPECIAL.COCO) {
      // bomba + normal (ou coco): limpa toda a cor do parceiro
      const hits = colorCells(board, other.color)
      hits.forEach(addClear)
      addClear(otherPos)
      effects.push({ kind: 'bomb', color: other.color, r: bombPos.r, c: bombPos.c, targets: hits })
    } else {
      // bomba + especial: converte toda a cor naquele especial e ativa todos
      addClear(otherPos)
      let i = 0
      for (const cell of colorCells(board, other.color)) {
        upgrades.push({
          r: cell.r,
          c: cell.c,
          special: other.special,
          dir: other.dir || (i++ % 2 ? DIR.COL : DIR.ROW),
          color: other.color,
        })
      }
      effects.push({ kind: 'bomb-upgrade', special: other.special, color: other.color })
    }
    return { clearSet, recolorMap, effects, extraSeeds, upgrades }
  }

  // --- coco + X (sem bomba) ---
  if (t1 === SPECIAL.COCO || t2 === SPECIAL.COCO) {
    const coco = t1 === SPECIAL.COCO ? g1 : g2
    const cocoPos = t1 === SPECIAL.COCO ? p1 : p2
    const other = t1 === SPECIAL.COCO ? g2 : g1
    const otherPos = t1 === SPECIAL.COCO ? p2 : p1
    const toColor = coco.color
    const fromColor = other.color
    addClear(cocoPos)
    const painted = []
    for (const cell of colorCells(board, fromColor)) {
      const k = key(cell.r, cell.c)
      if (k !== key(cocoPos.r, cocoPos.c)) {
        recolorMap.set(k, toColor)
        painted.push(cell)
      }
    }
    if (other.special && other.special !== SPECIAL.COCO) {
      // após converter, dispara o especial parceiro
      extraSeeds.push({ r: otherPos.r, c: otherPos.c, ctx: {} })
    } else if (other.special === SPECIAL.COCO) {
      addClear(otherPos)
    }
    effects.push({ kind: 'coco', from: fromColor, to: toColor, r: cocoPos.r, c: cocoPos.c, targets: painted })
    return { clearSet, recolorMap, effects, extraSeeds, upgrades }
  }

  // --- combos entre listrada / embrulhada / peixe ---
  addClear(p1)
  addClear(p2)
  const set = new Set([t1, t2])
  if (t1 === SPECIAL.STRIPED && t2 === SPECIAL.STRIPED) {
    rowCells(center.r).forEach(addClear)
    colCells(center.c).forEach(addClear)
    effects.push({ kind: 'cross', r: center.r, c: center.c })
  } else if (set.has(SPECIAL.STRIPED) && set.has(SPECIAL.WRAPPED)) {
    for (let dr = -1; dr <= 1; dr++) rowCells(center.r + dr).forEach(addClear)
    for (let dc = -1; dc <= 1; dc++) colCells(center.c + dc).forEach(addClear)
    effects.push({ kind: 'bigcross', r: center.r, c: center.c })
  } else if (t1 === SPECIAL.WRAPPED && t2 === SPECIAL.WRAPPED) {
    areaCells(center.r, center.c, 2).forEach(addClear)
    effects.push({ kind: 'bigwrap', r: center.r, c: center.c })
  } else {
    areaCells(center.r, center.c, 1).forEach(addClear)
    effects.push({ kind: 'wrap', r: center.r, c: center.c })
  }
  return { clearSet, recolorMap, effects, extraSeeds, upgrades }
}

export { mapToList }
