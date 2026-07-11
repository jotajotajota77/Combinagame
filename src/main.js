import { createGame } from './game/core.js'
import { stepGame } from './game/step.js'
import { render } from './render.js'
import {
  increaseDamage,
  decreaseDamage,
  increaseFireRate,
  decreaseFireRate,
  increaseRange,
  decreaseRange,
  UPGRADE_LIMITS,
} from './game/upgrades.js'

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

const statDamageEl = document.getElementById('stat-damage')
const statFireRateEl = document.getElementById('stat-firerate')
const statRangeEl = document.getElementById('stat-range')
const btnDamageMinus = document.getElementById('btn-damage-minus')
const btnDamagePlus = document.getElementById('btn-damage-plus')
const btnFireRateMinus = document.getElementById('btn-firerate-minus')
const btnFireRatePlus = document.getElementById('btn-firerate-plus')
const btnRangeMinus = document.getElementById('btn-range-minus')
const btnRangePlus = document.getElementById('btn-range-plus')

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
  updateUpgradePanel()
}

// Reflete os valores atuais nos chips e desabilita o botão que já bateu no limite.
function updateUpgradePanel() {
  const { core } = state
  statDamageEl.textContent = Math.round(core.damage)
  statFireRateEl.textContent = `${(1 / core.fireInterval).toFixed(1)}/s`
  statRangeEl.textContent = Math.round(core.range)

  btnDamageMinus.disabled = core.damage <= UPGRADE_LIMITS.damage.min
  btnDamagePlus.disabled = core.damage >= UPGRADE_LIMITS.damage.max
  btnFireRateMinus.disabled = core.fireInterval >= UPGRADE_LIMITS.fireInterval.max
  btnFireRatePlus.disabled = core.fireInterval <= UPGRADE_LIMITS.fireInterval.min
  btnRangeMinus.disabled = core.range <= UPGRADE_LIMITS.range.min
  btnRangePlus.disabled = core.range >= UPGRADE_LIMITS.range.max
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

btnDamageMinus.addEventListener('click', () => {
  decreaseDamage(state)
  updateUpgradePanel()
})
btnDamagePlus.addEventListener('click', () => {
  increaseDamage(state)
  updateUpgradePanel()
})
btnFireRateMinus.addEventListener('click', () => {
  decreaseFireRate(state)
  updateUpgradePanel()
})
btnFireRatePlus.addEventListener('click', () => {
  increaseFireRate(state)
  updateUpgradePanel()
})
btnRangeMinus.addEventListener('click', () => {
  decreaseRange(state)
  updateUpgradePanel()
})
btnRangePlus.addEventListener('click', () => {
  increaseRange(state)
  updateUpgradePanel()
})

newGame()
resize()
requestAnimationFrame((t) => {
  lastTime = t
  requestAnimationFrame(loop)
})
