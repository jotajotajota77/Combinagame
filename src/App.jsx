import Board from './components/Board.jsx'
import Hud from './components/Hud.jsx'
import { useGame } from './hooks/useGame.js'

export default function App() {
  const game = useGame()

  return (
    <div className="app">
      <div className="glow" aria-hidden />
      <main className="stage">
        <Hud
          score={game.score}
          combo={game.combo}
          onNewGame={game.newGame}
          onShuffle={game.shuffle}
          onHint={game.showHint}
        />

        <div className="board-wrap">
          <Board
            board={game.board}
            popping={game.popping}
            effects={game.effects}
            enterIds={game.enterIds}
            hintKeys={game.hintKeys}
            busy={game.busy}
            onSwap={game.trySwap}
            onActivate={game.activate}
          />
          {game.toast && <div className="toast">{game.toast}</div>}
        </div>

        <footer className="hints">
          Arraste ou toque em duas peças vizinhas para trocar. Faça 4, 5, formas em L/T ou
          quadrados 2×2 para criar especiais — e dê <strong>duplo-clique</strong> num especial para
          ativá-lo.
        </footer>
      </main>
    </div>
  )
}
