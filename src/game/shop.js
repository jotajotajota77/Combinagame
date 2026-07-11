import {
  SHOP_HEAL_AMOUNT,
  SHOP_HEAL_COST,
  SHOP_HP_UPGRADE_AMOUNT,
  SHOP_HP_UPGRADE_BASE_COST,
  SHOP_HP_UPGRADE_COST_STEP,
} from './constants.js'

// Loja entre ondas: melhorias compradas com as moedas ganhas por abate.
// Reparar é consumível (custo fixo); reforçar é permanente e encarece a
// cada compra.
export function healCost() {
  return SHOP_HEAL_COST
}

export function hpUpgradeCost(state) {
  return SHOP_HP_UPGRADE_BASE_COST + state.shop.hpUpgradesBought * SHOP_HP_UPGRADE_COST_STEP
}

export function canBuyHeal(state) {
  return state.coins >= healCost() && state.core.hp < state.core.maxHp
}

export function canBuyHpUpgrade(state) {
  return state.coins >= hpUpgradeCost(state)
}

export function buyHeal(state) {
  if (!canBuyHeal(state)) return
  state.coins -= healCost()
  state.core.hp = Math.min(state.core.maxHp, state.core.hp + SHOP_HEAL_AMOUNT)
}

export function buyHpUpgrade(state) {
  if (!canBuyHpUpgrade(state)) return
  state.coins -= hpUpgradeCost(state)
  state.core.maxHp += SHOP_HP_UPGRADE_AMOUNT
  state.core.hp += SHOP_HP_UPGRADE_AMOUNT
  state.shop.hpUpgradesBought += 1
}
