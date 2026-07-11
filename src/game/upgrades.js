// Ajustes manuais dos 3 parâmetros da torre do núcleo — o jogador aumenta ou
// reduz na hora, direto pelos botões da UI (sem custo, sem espera).
export const UPGRADE_STEP = {
  damage: 5,
  fireInterval: 0.05, // "cadência" pro jogador — internamente é o intervalo entre tiros
  range: 30,
}

export const UPGRADE_LIMITS = {
  damage: { min: 5, max: 60 },
  fireInterval: { min: 0.05, max: 1.2 }, // 0.05s = 20 tiros/s, o teto pedido
  range: { min: 120, max: 700 },
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export function increaseDamage(state) {
  state.core.damage = clamp(state.core.damage + UPGRADE_STEP.damage, UPGRADE_LIMITS.damage.min, UPGRADE_LIMITS.damage.max)
}
export function decreaseDamage(state) {
  state.core.damage = clamp(state.core.damage - UPGRADE_STEP.damage, UPGRADE_LIMITS.damage.min, UPGRADE_LIMITS.damage.max)
}

// Cadência maior = atira mais rápido = fireInterval MENOR.
export function increaseFireRate(state) {
  state.core.fireInterval = clamp(
    state.core.fireInterval - UPGRADE_STEP.fireInterval,
    UPGRADE_LIMITS.fireInterval.min,
    UPGRADE_LIMITS.fireInterval.max,
  )
}
export function decreaseFireRate(state) {
  state.core.fireInterval = clamp(
    state.core.fireInterval + UPGRADE_STEP.fireInterval,
    UPGRADE_LIMITS.fireInterval.min,
    UPGRADE_LIMITS.fireInterval.max,
  )
}

export function increaseRange(state) {
  state.core.range = clamp(state.core.range + UPGRADE_STEP.range, UPGRADE_LIMITS.range.min, UPGRADE_LIMITS.range.max)
}
export function decreaseRange(state) {
  state.core.range = clamp(state.core.range - UPGRADE_STEP.range, UPGRADE_LIMITS.range.min, UPGRADE_LIMITS.range.max)
}
