import { useRef, useState } from 'react'
import { ROWS, COLS } from '../game/constants.js'
import Gem from './Gem.jsx'

const adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1
const pct = (n) => `${n * 100}%`
const rowTop = (r) => `${(r / ROWS) * 100}%`
const colLeft = (c) => `${(c / COLS) * 100}%`
// Centro de uma célula em % da camada (que cobre o tabuleiro).
const cx = (c) => `${((c + 0.5) / COLS) * 100}%`
const cy = (r) => `${((r + 0.5) / ROWS) * 100}%`

// Uma peça viajando de uma célula a outra (peixe nadando / gota de tinta).
function TravelSprite({ from, to, className, delay = 0, children }) {
  const style = {
    '--fl': cx(from.c),
    '--ft': cy(from.r),
    '--tl': cx(to.c),
    '--tt': cy(to.r),
    animationDelay: `${delay}ms`,
  }
  return (
    <div className={`travel ${className}`} style={style} aria-hidden>
      <span className="travel-inner">{children}</span>
    </div>
  )
}

// Um raio reto da origem até um alvo (bomba de cor).
function Ray({ from, to, delay = 0 }) {
  // Coordenadas em % (a camada é quadrada, então dx% e dy% são comparáveis).
  const x1 = ((from.c + 0.5) / COLS) * 100
  const y1 = ((from.r + 0.5) / ROWS) * 100
  const x2 = ((to.c + 0.5) / COLS) * 100
  const y2 = ((to.r + 0.5) / ROWS) * 100
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  const style = {
    left: `${x1}%`,
    top: `${y1}%`,
    width: `${len}%`,
    '--rot': `${angle}deg`,
    animationDelay: `${delay}ms`,
  }
  return <div className="ray" style={style} aria-hidden />
}

// Efeitos visuais posicionados sobre o tabuleiro.
function EffectLayer({ effects }) {
  return (
    <div className="fx-layer" aria-hidden>
      {effects.map((e) => {
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
        // Bomba: flash na origem + raios para cada alvo da cor.
        if (e.kind === 'bomb' || e.kind === 'bomb-upgrade') {
          const targets = e.targets || []
          return (
            <div key={e._id}>
              <div
                className="fx fx-bomb"
                style={{ transform: `translate(${pct(e.c ?? 0)}, ${pct(e.r ?? 0)})` }}
              />
              {targets.map((t, i) => (
                <Ray key={i} from={{ r: e.r, c: e.c }} to={t} delay={Math.min(i * 12, 160)} />
              ))}
            </div>
          )
        }
        // Roda de coco: gotas de tinta (na cor destino) até cada peça convertida.
        if (e.kind === 'coco') {
          const targets = e.targets || []
          return (
            <div key={e._id}>
              <div
                className="fx fx-coco"
                style={{ transform: `translate(${pct(e.c ?? 0)}, ${pct(e.r ?? 0)})` }}
              />
              {targets.map((t, i) => (
                <TravelSprite
                  key={i}
                  from={{ r: e.r, c: e.c }}
                  to={t}
                  className="drop"
                  delay={Math.min(i * 10, 140)}
                >
                  <span className={`drop-dot gem-${e.to}`} />
                </TravelSprite>
              ))}
            </div>
          )
        }
        // Peixe: nadam da origem até cada alvo.
        if (e.kind === 'fish' || e.kind === 'fish-combo') {
          const from = e.from || { r: e.r, c: e.c }
          const targets = e.targets || []
          return (
            <div key={e._id}>
              {targets.map((t, i) => {
                const flip = t.c < from.c
                return (
                  <TravelSprite key={i} from={from} to={t} className="fish-swim" delay={i * 60}>
                    <span className="fish-body" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
                      🐟
                    </span>
                  </TravelSprite>
                )
              })}
            </div>
          )
        }
        // Explosões pontuais (embrulhada / combos).
        const kindClass =
          {
            wrap: 'fx-wrap',
            bigwrap: 'fx-wrap big',
            'bomb-board': 'fx-bomb huge',
            spark: 'fx-spark',
          }[e.kind] || 'fx-wrap'
        return (
          <div
            key={e._id}
            className={`fx ${kindClass}`}
            style={{ transform: `translate(${pct(e.c ?? 0)}, ${pct(e.r ?? 0)})` }}
          />
        )
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
  const boardRef = useRef(null)
  const drag = useRef(null) // { cell, x, y, done }

  function cellPx() {
    const el = boardRef.current
    if (!el) return 40
    return el.getBoundingClientRect().width / COLS
  }

  const handleDown = (cell, e) => {
    if (busy) return
    drag.current = { cell, x: e.clientX, y: e.clientY, done: false }
  }

  // Swipe: assim que o arraste passa do limiar numa direção, troca com o vizinho.
  const handleMove = (e) => {
    const d = drag.current
    if (busy || !d || d.done) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    const threshold = Math.max(12, cellPx() * 0.33)
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return
    let nr = d.cell.r
    let nc = d.cell.c
    if (Math.abs(dx) > Math.abs(dy)) nc += dx > 0 ? 1 : -1
    else nr += dy > 0 ? 1 : -1
    d.done = true
    setSelected(null)
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      onSwap(d.cell, { r: nr, c: nc })
    }
  }

  const handleUp = (cell) => {
    const d = drag.current
    drag.current = null
    if (busy || !d || d.done) return
    // Foi um toque simples: seleção por clique (alternativa ao swipe).
    if (!selected) setSelected(cell)
    else if (selected.r === cell.r && selected.c === cell.c) setSelected(null)
    else if (adjacent(selected, cell)) {
      onSwap(selected, cell)
      setSelected(null)
    } else setSelected(cell)
  }

  const handleDouble = (cell, gem) => {
    if (busy) return
    setSelected(null)
    drag.current = null
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
          onPointerDown={(e) => handleDown({ r, c }, e)}
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
      ref={boardRef}
      style={{ '--rows': ROWS, '--cols': COLS }}
      onPointerMove={handleMove}
      onPointerLeave={() => {
        drag.current = null
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
