import { useState } from 'react'
import { setSoundEnabled } from '../audio.js'

// Cabeçalho e controles. Nada de tempo ou limite de movimentos — só feedback gentil.
export default function Hud({
  score,
  combo,
  numColors,
  onNewGame,
  onShuffle,
  onHint,
  onColors,
  canInstall,
  onInstall,
}) {
  const [sound, setSound] = useState(true)

  const toggleSound = () => {
    const v = !sound
    setSound(v)
    setSoundEnabled(v)
  }

  return (
    <header className="hud">
      <div className="brand">
        <h1>Combina<span>game</span></h1>
        <p className="tagline">Sem tempo. Sem pressa. Só combinar. 🍬</p>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-label">Peças combinadas</span>
          <span className="stat-value">{score.toLocaleString('pt-BR')}</span>
        </div>
        {combo > 1 && <div className="combo-badge">Combo ×{combo}!</div>}
        {canInstall && (
          <button type="button" className="install-badge" onClick={onInstall} title="Instalar o Combinagame">
            📲 Instalar app
          </button>
        )}
      </div>

      <div className="controls">
        <button type="button" onClick={onHint} title="Mostrar uma jogada">
          💡 Dica
        </button>
        <button type="button" onClick={onShuffle} title="Embaralhar as peças">
          🔀 Embaralhar
        </button>
        <button type="button" onClick={onNewGame} title="Começar um tabuleiro novo">
          🍬 Novo
        </button>
        <label className="colors-picker" title="Quantas cores no jogo (2 a 8)">
          🎨
          <select value={numColors} onChange={(e) => onColors(Number(e.target.value))}>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} cores
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={toggleSound} title="Ligar/desligar som" className="icon">
          {sound ? '🔊' : '🔇'}
        </button>
      </div>
    </header>
  )
}
