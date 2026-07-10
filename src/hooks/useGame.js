import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createBoard } from '../game/board.js'
import { config, setNumColors } from '../game/constants.js'
import { resolveMove, activateAt } from '../game/engine.js'
import { hasValidMove, reshuffle, findHint } from '../game/moves.js'
import { rowCells, colCells, areaCells } from '../game/specials.js'
import { playMatch, playSpecial } from '../audio.js'
import { FISH_SWIM_MS, FISH_STAGGER_MS } from '../uiTiming.js'

// Durações das animações (ms). Ajuste aqui para deixar mais lento/rápido.
const T = { SWAP: 200, CLEAR: 340, FALL: 300, RESHUFFLE: 420 }
const POP_BUFFER_MS = 620

const delay = (ms) => new Promise((res) => setTimeout(res, ms))
const cellKey = (r, c) => `${r},${c}`

// Células adicionais que um efeito "ancorado" (disparado no ponto de chegada de um
// peixe) também limpa — usadas para propagar o mesmo atraso a essas células.
function cellsForEffect(e) {
  if (e.kind === 'stripe') return e.dir === 'col' ? colCells(e.c) : rowCells(e.r)
  if (e.kind === 'wrap') return areaCells(e.r, e.c, 1)
  if (e.kind === 'bomb') return e.targets || []
  return []
}

// Calcula, para um passo de limpeza, o instante (ms relativo ao início do passo)
// em que cada peixe chega ao seu alvo — e propaga esse atraso para qualquer
// efeito "carregado" por ele (ex.: o feixe da listrada que o peixe ativa ao
// chegar), para que a animação do efeito só ocorra depois do peixe pousar.
function computeFishArrivals(effects) {
  const arrival = new Map()
  for (const e of effects) {
    if (e.kind !== 'fish' && e.kind !== 'fish-combo') continue
    ;(e.targets || []).forEach((t, i) => {
      const at = i * FISH_STAGGER_MS + FISH_SWIM_MS
      const k = cellKey(t.r, t.c)
      const prev = arrival.get(k)
      if (prev == null || at < prev) arrival.set(k, at)
    })
  }
  if (arrival.size === 0) return arrival
  for (const e of effects) {
    if (e.kind === 'fish' || e.kind === 'fish-combo') continue
    if (e.r == null) continue
    const anchor = arrival.get(cellKey(e.r, e.c))
    if (anchor == null) continue
    for (const cell of cellsForEffect(e)) {
      const k = cellKey(cell.r, cell.c)
      const prev = arrival.get(k)
      if (prev == null || anchor < prev) arrival.set(k, anchor)
    }
  }
  return arrival
}

let _effectId = 1

export function useGame() {
  const [board, setBoard] = useState(() => createBoard())
  const [popping, setPopping] = useState([])
  const [effects, setEffects] = useState([])
  const [enterIds, setEnterIds] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [hint, setHint] = useState(null)
  const [toast, setToast] = useState(null)
  const [numColors, setNumColorsState] = useState(config.numColors)

  const boardRef = useRef(board)
  const busyRef = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    boardRef.current = board
  }, [board])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const commit = useCallback((b) => {
    boardRef.current = b
    setBoard(b)
  }, [])

  const flashToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => mounted.current && setToast(null), 1400)
  }, [])

  // Reproduz a timeline de passos do motor com delays entre cada beat.
  const playSteps = useCallback(
    async (steps) => {
      setBusy(true)
      busyRef.current = true
      setHint(null)
      let clears = 0

      for (const step of steps) {
        if (!mounted.current) return
        if (step.type === 'swap' || step.type === 'swapback') {
          commit(step.board)
          await delay(T.SWAP)
        } else if (step.type === 'clear') {
          clears++
          const prev = boardRef.current
          // Peixe: o alvo só "estoura" (e qualquer efeito que ele carregue, tipo o
          // feixe de uma listrada) quando o peixe chega lá nadando — não junto do resto.
          const arrival = computeFishArrivals(step.effects)
          const ghosts = step.cleared
            .map(({ r, c }) =>
              prev[r] && prev[r][c]
                ? { gem: prev[r][c], r, c, delayMs: arrival.get(cellKey(r, c)) || 0 }
                : null,
            )
            .filter(Boolean)
          setPopping(ghosts)
          setEffects(
            step.effects.map((e) => ({
              ...e,
              _id: _effectId++,
              delayMs: e.kind === 'fish' || e.kind === 'fish-combo' ? 0 : arrival.get(cellKey(e.r, e.c)) || 0,
            })),
          )
          commit(step.board)
          setScore((s) => s + ghosts.length)
          const hasSpecial = (step.creates || []).length > 0 || step.effects.length > 0
          if (hasSpecial) playSpecial()
          else playMatch(clears - 1)
          if (clears >= 2) setCombo(clears)
          // Efeitos com animação de viagem (raios/gotas) precisam de mais tempo; peixe
          // precisa esperar o último nadador chegar + o tempo do estouro no alvo.
          const slow = step.effects.some((e) =>
            ['bomb', 'bomb-upgrade', 'bomb-board', 'coco'].includes(e.kind),
          )
          const maxArrival = arrival.size ? Math.max(...arrival.values()) : 0
          let waitMs = slow ? T.CLEAR + 320 : T.CLEAR
          if (maxArrival > 0) waitMs = Math.max(waitMs, maxArrival + POP_BUFFER_MS)
          await delay(waitMs)
          if (!mounted.current) return
          setPopping([])
          setEffects([])
        } else if (step.type === 'fall') {
          setEnterIds(new Set(step.spawns.map((s) => s.id)))
          commit(step.board)
          await delay(T.FALL)
          if (!mounted.current) return
          setEnterIds(new Set())
        }
      }

      setBusy(false)
      busyRef.current = false
      setCombo(0)

      // Sem jogadas válidas? Reembaralha gentilmente.
      if (!hasValidMove(boardRef.current)) {
        flashToast('Sem jogadas — reembaralhando ✨')
        await delay(500)
        if (!mounted.current) return
        commit(reshuffle(boardRef.current))
      }
    },
    [commit, flashToast],
  )

  const trySwap = useCallback(
    (a, b) => {
      if (busyRef.current) return
      const res = resolveMove(boardRef.current, a, b)
      playSteps(res.steps)
    },
    [playSteps],
  )

  const activate = useCallback(
    (r, c) => {
      if (busyRef.current) return
      const res = activateAt(boardRef.current, r, c)
      if (res.valid) playSteps(res.steps)
    },
    [playSteps],
  )

  const newGame = useCallback(() => {
    if (busyRef.current) return
    commit(createBoard())
    setScore(0)
    setCombo(0)
    flashToast('Tabuleiro novo 🍬')
  }, [commit, flashToast])

  // Troca o número de cores (2..8) e começa um tabuleiro novo com elas.
  const changeColors = useCallback(
    (n) => {
      if (busyRef.current) return
      const applied = setNumColors(n)
      setNumColorsState(applied)
      commit(createBoard())
      setScore(0)
      setCombo(0)
      flashToast(`${applied} cores 🎨`)
    },
    [commit, flashToast],
  )

  const shuffle = useCallback(() => {
    if (busyRef.current) return
    commit(reshuffle(boardRef.current))
    flashToast('Embaralhado 🔀')
  }, [commit, flashToast])

  const showHint = useCallback(() => {
    if (busyRef.current) return
    const h = findHint(boardRef.current)
    if (h) {
      setHint(h)
      setTimeout(() => mounted.current && setHint(null), 1800)
    } else {
      flashToast('Sem jogadas — tente embaralhar')
    }
  }, [flashToast])

  // Dica automática após ociosidade.
  useEffect(() => {
    if (busy) return
    const id = setTimeout(() => {
      if (!busyRef.current) {
        const h = findHint(boardRef.current)
        if (h) setHint(h)
      }
    }, 6000)
    return () => clearTimeout(id)
  }, [busy, board])

  const hintKeys = useMemo(() => {
    if (!hint) return new Set()
    return new Set([`${hint.a.r},${hint.a.c}`, `${hint.b.r},${hint.b.c}`])
  }, [hint])

  return {
    board,
    popping,
    effects,
    enterIds,
    busy,
    score,
    combo,
    toast,
    hintKeys,
    numColors,
    trySwap,
    activate,
    newGame,
    shuffle,
    showHint,
    changeColors,
  }
}
