import { useRef, useState } from 'react'
import { ROWS, COLS } from '../game/constants.js'
import Gem from './Gem.jsx'

const adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1
const pct = (n) => `${n * 100}%`
const rowTop = (r) => `${(r / ROWS) * 100}%`
const colLeft = (c) => `${(c / COLS) * 100}%`

// Efeitos visuais posicionados sobre o tabuleiro (feixes, explosões, roda, etc.).
function EffectLayer({ effects }) {
  return (
    <div className="fx-layer" aria-hidden>
      {effects.map((e) => {
        const style = { transform: `translate(${pct(e.c ?? 0)}, ${pct(e.r ?? 0)})` }
        if (e.kind === 'stripe') {
          return (
            <div
              key={e._id}
              className={`fx beam ${e.dir === 'col' ? 'beam-v' : 'beam-h'}`}
              style={e.dir === 'col' ? { left: colLeft(e.c) } : { top: rowTop(e.r) }}
            />
          )
        }
        if (e.kind === 'cross' || e.kind === 'bigcross') {
          return (
            <div key={e._id}>
              <div className={`fx beam beam-h ${e.kind}`} style={{ top: rowTop(e.r) }} />
              <div className={`fx beam beam-v ${e.kind}`} style={{ left: colLeft(e.c) }} />
            </div>
          )
        }
        const kindClass =
          {
            wrap: 'fx-wrap',
            bigwrap: 'fx-wrap big',
            bomb: 'fx-bomb',
            'bomb-board': 'fx-bomb huge',
            'bomb-upgrade': 'fx-bomb',
            coco: 'fx-coco',
            fish: 'fx-spark',
            'fish-combo': 'fx-spark',
          }[e.kind] || 'fx-wrap'
        return <div key={e._id} className={`fx ${kindClass}`} style={style} />
      })}
    </div>
  )
}

export default function Board({
  board,
  popping,
  effects,
  enterIds,
  hintKeys,
  busy,
  onSwap,
  onActivate,
}) {
  const [selected, setSelected] = useState(null)
  const pressing = useRef(false)
  const dragStart = useRef(null)
  const swapped = useRef(false)

  const handleDown = (cell) => {
    if (busy) return
    pressing.current = true
    dragStart.current = cell
    swapped.current = false
  }

  const handleEnter = (cell) => {
    if (busy || !pressing.current || !dragStart.current) return
    if (adjacent(dragStart.current, cell)) {
      onSwap(dragStart.current, cell)
      swapped.current = true
      setSelected(null)
      pressing.current = false
      dragStart.current = null
    }
  }

  const handleUp = (cell) => {
    pressing.current = false
    const start = dragStart.current
    dragStart.current = null
    if (busy || swapped.current || !start) return
    // Foi um toque (sem arraste): lógica de seleção por clique.
    if (!selected) {
      setSelected(cell)
    } else if (selected.r === cell.r && selected.c === cell.c) {
      setSelected(null)
    } else if (adjacent(selected, cell)) {
      onSwap(selected, cell)
      setSelected(null)
    } else {
      setSelected(cell)
    }
  }

  const handleDouble = (cell, gem) => {
    if (busy) return
    setSelected(null)
    if (gem && gem.special) onActivate(cell.r, cell.c)
  }

  const tiles = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gem = board[r][c]
      if (!gem) continue
      const isSel = selected && selected.r === r && selected.c === c
      const isHint = hintKeys.has(`${r},${c}`)
      tiles.push(
        <div
          key={gem.id}
          className={`tile ${isSel ? 'selected' : ''} ${isHint ? 'hint' : ''}`}
          style={{ transform: `translate(${pct(c)}, ${pct(r)})` }}
          onPointerDown={() => handleDown({ r, c })}
          onPointerEnter={() => handleEnter({ r, c })}
          onPointerUp={() => handleUp({ r, c })}
          onDoubleClick={() => handleDouble({ r, c }, gem)}
        >
          <Gem gem={gem} entering={enterIds.has(gem.id)} />
        </div>,
      )
    }
  }

  return (
    <div
      className="board"
      style={{ '--rows': ROWS, '--cols': COLS }}
      onPointerLeave={() => {
        pressing.current = false
        dragStart.current = null
      }}
    >
      <div className="cells" aria-hidden>
        {Array.from({ length: ROWS * COLS }).map((_, i) => (
          <div key={i} className="cell" />
        ))}
      </div>
      {tiles}
      {popping.map((p) => (
        <div
          key={`pop-${p.gem.id}`}
          className="tile ghost"
          style={{ transform: `translate(${pct(p.c)}, ${pct(p.r)})` }}
        >
          <Gem gem={p.gem} popping />
        </div>
      ))}
      <EffectLayer effects={effects} />
    </div>
  )
}
