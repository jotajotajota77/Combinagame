import { CORE_MAX_HP, CORE_RADIUS, TURRET_DAMAGE, TURRET_FIRE_INTERVAL, TURRET_RANGE } from './constants.js'
import { createWaveState } from './waves.js'

// Estado inicial de uma partida. `width`/`height` são o tamanho da arena (px);
// o núcleo fica sempre centralizado. damage/fireInterval/range ficam no core
// (não são constantes fixas) porque o jogador pode ajustá-los na hora — ver
// game/upgrades.js.
export function createGame(width, height) {
  return {
    width,
    height,
    core: {
      x: width / 2,
      y: height / 2,
      radius: CORE_RADIUS,
      hp: CORE_MAX_HP,
      maxHp: CORE_MAX_HP,
      damage: TURRET_DAMAGE,
      fireInterval: TURRET_FIRE_INTERVAL,
      range: TURRET_RANGE,
    },
    enemies: [],
    projectiles: [],
    wave: createWaveState(),
    fireTimer: 0,
    kills: 0,
    time: 0,
    gameOver: false,
  }
}
