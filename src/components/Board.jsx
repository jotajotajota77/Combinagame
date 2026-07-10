import { useRef, useState } from 'react'
import { ROWS, COLS } from '../game/constants.js'
import { FISH_STAGGER_MS } from '../uiTiming.js'
import Gem from './Gem.jsx'

const adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1
const pct = (n) => `${n * 100}%`
const rowTop = (r) => `${(r / ROWS) * 100}%`
const colLeft = (c) => `${(c / COLS) * 100}%`
// Centro de uma célula em % da camada (que cobre o tabuleiro).
const cxNum = (c) => ((c + 0.5) / COLS) * 100
const cyNum = (r) => ((r + 0.5) / ROWS) * 100
const cx = (c) => `${cxNum(c)}%`
const cy = (r) => `${cyNum(r)}%`

// Uma peça viajando em linha reta de uma célula a outra (gota de tinta).
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

// Peixe nadando: caminho ondulado (não em linha reta) até o alvo, com o corpo
// balançando como se estivesse de fato nadando.
function FishSprite({ from, to, delay = 0, seed = 0 }) {
  const x0 = cxNum(from.c)
  const y0 = cyNum(from.r)
  const x1 = cxNum(to.c)
  const y1 = cyNum(to.r)
  const dx = x1 - x0
  const dy = y1 - y0
  const dist = Math.hypot(dx, dy) || 1
  // Vetor perpendicular unitário — usado para desviar o caminho da linha reta.
  const ux = -dy / dist
  const uy = dx / dist
  const amp = Math.min(9, Math.max(3, dist * 0.22))
  const side = seed % 2 === 0 ? 1 : -1
  const stops = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const wobble = Math.sin(t * Math.PI * 2.2) * amp * side * (1 - Math.abs(t - 0.5) * 0.4)
    return { x: x0 + dx * t + ux * wobble, y: y0 + dy * t + uy * wobble }
  })
  const flip = x1 < x0
  const style = { animationDelay: `${delay}ms` }
  stops.forEach((p, i) => {
    style[`--p${i}x`] = `${p.x}%`
    style[`--p${i}y`] = `${p.y}%`
  })
  return (
    <div className="travel fish-swim" style={style} aria-hidden>
      <span className="travel-inner fish-wiggle">
        <span className="fish-body" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
          🐟
        </span>
      </span>
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

// Efeitos visuais posicionados sobre o tabuleiro. `e.delayMs` (calculado no
// useGame) atrasa efeitos "carregados" por um peixe até ele chegar ao alvo —
// tudo aqui só usa esse valor como ponto de partida do próprio delay interno.
function EffectLayer({ effects }) {
  return (
    <div className="fx-layer" aria-hidden>
      {effects.map((e) => {
        const base = e.delayMs || 0
        if (e.kind === 'stripe') {
          return (
            <div
              key={e._id}
              className={`fx beam ${e.dir === 'col' ? 'beam-v' : 'beam-h'}`}
              style={{
                ...(e.dir === 'col' ? { left: colLeft(e.c) } : { top: rowTop(e.r) }),
                animationDelay: `${base}ms`,
              }}
            />
          )
        }
        if (e.kind === 'cross' || e.kind === 'bigcross') {
          return (
            <div key={e._id}>
              <div
                className={`fx beam beam-h ${e.kind}`}
                style={{ top: rowTop(e.r), animationDelay: `${base}ms` }}
              />
              <div
                className={`fx beam beam-v ${e.kind}`}
                style={{ left: colLeft(e.c), animationDelay: `${base}ms` }}
              />
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
                style={{
                  transform: `translate(${pct(e.c ?? 0)}, ${pct(e.r ?? 0)})`,
                  animationDelay: `${base}ms`,
                }}
              />
              {targets.map((t, i) => (
                <Ray key={i} from={{ r: e.r, c: e.c }} to={t} delay={base + Math.min(i * 12, 160)} />
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
                style={{
                  transform: `translate(${pct(e.c ?? 0)}, ${pct(e.r ?? 0)})`,
                  animationDelay: `${base}ms`,
                }}
              />
              {targets.map((t, i) => (
                <TravelSprite
                  key={i}
                  from={{ r: e.r, c: e.c }}
                  to={t}
                  className="drop"
                  delay={base + Math.min(i * 10, 140)}
                >
                  <span className={`drop-dot gem-${e.to}`} />
                </TravelSprite>
              ))}
            </div>
          )
        }
        // Peixe: nada em curva (não em linha reta) da origem até cada alvo; o
        // efeito que ele carrega (se houver) só aparece quando ele chega —
        // isso já é resolvido no useGame via o delayMs anexado a esse efeito.
        if (e.kind === 'fish' || e.kind === 'fish-combo') {
          const from = e.from || { r: e.r, c: e.c }
          const targets = e.targets || []
          return (
            <div key={e._id}>
              {targets.map((t, i) => (
                <FishSprite key={i} from={from} to={t} delay={i * FISH_STAGGER_MS} seed={i} />
              ))}
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
            style={{ transform: `translate(${pct(e.c ?? 0)}, ${pct(e.r ?? 0)})`, animationDelay: `${base}ms` }}
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
          style={{ transform: `translate(${pct(p.c)}, ${pct(p.r)})`, '--pop-delay': `${p.delayMs || 0}ms` }}
        >
          <Gem gem={p.gem} popping />
        </div>
      ))}
      <EffectLayer effects={effects} />
    </div>
  )
}
