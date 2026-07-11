import { createGame } from './game/core.js'
import { stepGame } from './game/step.js'
import { render } from './render.js'

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')
const hpFill = document.getElementById('core-hp-fill')
const killsEl = document.getElementById('kills')
const waveNumberEl = document.getElementById('wave-number')
const waveStatusEl = document.getElementById('wave-status')
const gameOverEl = document.getElementById('game-over')
const finalKillsEl = document.getElementById('final-kills')
const finalWaveEl = document.getElementById('final-wave')
const restartBtn = document.getElementById('restart')

let dpr = Math.max(1, window.devicePixelRatio || 1)
let state = null

function resize() {
  const { innerWidth: w, innerHeight: h } = window
  dpr = Math.max(1, window.devicePixelRatio || 1)
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (state) {
    state.width = w
    state.height = h
    state.core.x = w / 2
    state.core.y = h / 2
  }
}

function newGame() {
  const w = window.innerWidth
  const h = window.innerHeight
  state = createGame(w, h)
  gameOverEl.classList.add('hidden')
}

function updateHud() {
  hpFill.style.width = `${Math.max(0, (state.core.hp / state.core.maxHp) * 100)}%`
  killsEl.textContent = state.kills
  waveNumberEl.textContent = state.wave.number
  waveStatusEl.textContent =
    state.wave.phase === 'resting' ? `próxima em ${Math.ceil(state.wave.timer)}s` : ''
  if (state.gameOver && gameOverEl.classList.contains('hidden')) {
    finalKillsEl.textContent = state.kills
    finalWaveEl.textContent = state.wave.number
    gameOverEl.classList.remove('hidden')
  }
}

let lastTime = performance.now()
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000) // trava dt máx. (evita saltos ao voltar de aba)
  lastTime = now
  stepGame(state, dt)
  render(ctx, state)
  updateHud()
  requestAnimationFrame(loop)
}

window.addEventListener('resize', resize)
restartBtn.addEventListener('click', newGame)

newGame()
resize()
requestAnimationFrame((t) => {
  lastTime = t
  requestAnimationFrame(loop)
})
