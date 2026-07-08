import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createBoard } from '../game/board.js'
import { config, setNumColors } from '../game/constants.js'
import { resolveMove, activateAt } from '../game/engine.js'
import { hasValidMove, reshuffle, findHint } from '../game/moves.js'
import { playMatch, playSpecial } from '../audio.js'

// Durações das animações (ms). Ajuste aqui para deixar mais lento/rápido.
const T = { SWAP: 200, CLEAR: 340, FALL: 300, RESHUFFLE: 420 }

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

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
          const ghosts = step.cleared
            .map(({ r, c }) => (prev[r] && prev[r][c] ? { gem: prev[r][c], r, c } : null))
            .filter(Boolean)
          setPopping(ghosts)
          setEffects(step.effects.map((e) => ({ ...e, _id: _effectId++ })))
          commit(step.board)
          setScore((s) => s + ghosts.length)
          const hasSpecial = (step.creates || []).length > 0 || step.effects.length > 0
          if (hasSpecial) playSpecial()
          else playMatch(clears - 1)
          if (clears >= 2) setCombo(clears)
          // Efeitos com animação de viagem (peixe/raios/gotas) precisam de mais tempo.
          const slow = step.effects.some((e) =>
            ['fish', 'fish-combo', 'bomb', 'bomb-upgrade', 'bomb-board', 'coco'].includes(e.kind),
          )
          await delay(slow ? T.CLEAR + 320 : T.CLEAR)
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
