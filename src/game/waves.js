import {
  WAVE_BASE_COUNT,
  WAVE_COUNT_INCREMENT,
  WAVE_BASE_SPAWN_INTERVAL,
  WAVE_SPAWN_INTERVAL_DECAY,
  WAVE_MIN_SPAWN_INTERVAL,
  WAVE_HP_SCALE_PER_WAVE,
  WAVE_SPEED_SCALE_PER_WAVE,
  WAVE_REST_SECONDS,
} from './constants.js'
import { spawnEnemy } from './enemies.js'

// Quantos inimigos a onda N tem, quão rápido eles nascem, e o quanto mais
// fortes/rápidos são — tudo cresce aos poucos a cada onda.
export function waveEnemyCount(wave) {
  return WAVE_BASE_COUNT + (wave - 1) * WAVE_COUNT_INCREMENT
}

export function waveSpawnInterval(wave) {
  return Math.max(WAVE_MIN_SPAWN_INTERVAL, WAVE_BASE_SPAWN_INTERVAL - (wave - 1) * WAVE_SPAWN_INTERVAL_DECAY)
}

export function waveEnemyScale(wave) {
  return {
    hp: 1 + (wave - 1) * WAVE_HP_SCALE_PER_WAVE,
    speed: 1 + (wave - 1) * WAVE_SPEED_SCALE_PER_WAVE,
  }
}

// Estado inicial da progressão de ondas. `timer` em 0 faz o primeiro inimigo
// da onda 1 nascer assim que o jogo começar a rodar.
export function createWaveState(wave = 1) {
  return { number: wave, phase: 'spawning', spawned: 0, total: waveEnemyCount(wave), timer: 0 }
}

// Avança a máquina de estados da onda: nasce inimigos enquanto `spawning`;
// quando todos os da onda já nasceram e o campo está limpo, entra em
// `resting`; depois do descanso, começa a próxima onda (mais forte).
export function updateWaves(state, dt, rng = Math.random) {
  const wave = state.wave
  if (wave.phase === 'spawning') {
    wave.timer -= dt
    if (wave.timer <= 0 && wave.spawned < wave.total) {
      spawnEnemy(state, rng, waveEnemyScale(wave.number))
      wave.spawned++
      wave.timer += waveSpawnInterval(wave.number)
    }
    if (wave.spawned >= wave.total && state.enemies.length === 0) {
      wave.phase = 'resting'
      wave.timer = WAVE_REST_SECONDS
    }
    return
  }

  // resting
  wave.timer -= dt
  if (wave.timer <= 0) {
    wave.number += 1
    wave.phase = 'spawning'
    wave.spawned = 0
    wave.total = waveEnemyCount(wave.number)
    wave.timer = 0
  }
}
