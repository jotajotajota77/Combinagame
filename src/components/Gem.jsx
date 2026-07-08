import { SPECIAL } from '../game/constants.js'

// Ícone/decoração de cada especial. Listrada/embrulhada/bomba são puro CSS;
// peixe e roda de coco ganham um glifo central para leitura rápida.
function specialContent(special, dir) {
  switch (special) {
    case SPECIAL.STRIPED:
      return <span className={`stripes ${dir === 'col' ? 'v' : 'h'}`} aria-hidden />
    case SPECIAL.WRAPPED:
      return <span className="wrapped-core" aria-hidden />
    case SPECIAL.BOMB:
      return <span className="bomb-core" aria-hidden />
    case SPECIAL.FISH:
      return <span className="glyph" aria-hidden>🐟</span>
    case SPECIAL.COCO:
      return <span className="coco-wheel" aria-hidden />
    default:
      return null
  }
}

export default function Gem({ gem, popping = false, entering = false }) {
  const isBomb = gem.special === SPECIAL.BOMB
  const cls = [
    'gem',
    isBomb ? 'gem-bomb' : `gem-${gem.color}`,
    gem.special ? `sp-${gem.special}` : '',
    popping ? 'pop' : '',
    entering ? 'enter' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls}>
      <span className="facet" aria-hidden />
      {specialContent(gem.special, gem.dir)}
    </div>
  )
}
