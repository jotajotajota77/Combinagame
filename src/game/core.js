import { CORE_MAX_HP, CORE_RADIUS } from './constants.js'
import { createWaveState } from './waves.js'

// Estado inicial de uma partida. `width`/`height` são o tamanho da arena (px);
// o núcleo fica sempre centralizado.
export function createGame(width, height) {
  return {
    width,
    height,
    core: { x: width / 2, y: height / 2, radius: CORE_RADIUS, hp: CORE_MAX_HP, maxHp: CORE_MAX_HP },
    enemies: [],
    projectiles: [],
    wave: createWaveState(),
    fireTimer: 0,
    kills: 0,
    time: 0,
    gameOver: false,
  }
}
