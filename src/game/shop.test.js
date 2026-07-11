import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import { buyHeal, buyHpUpgrade, canBuyHeal, canBuyHpUpgrade, healCost, hpUpgradeCost } from './shop.js'
import { SHOP_HEAL_AMOUNT, SHOP_HP_UPGRADE_AMOUNT } from './constants.js'

describe('buyHeal', () => {
  it('cura o núcleo e desconta o custo fixo quando há moedas suficientes e hp não está cheio', () => {
    const state = createGame(800, 600)
    state.coins = 50
    state.core.hp = 10
    const cost = healCost()
    buyHeal(state)
    expect(state.core.hp).toBe(10 + SHOP_HEAL_AMOUNT)
    expect(state.coins).toBe(50 - cost)
  })

  it('não cura além do hp máximo', () => {
    const state = createGame(800, 600)
    state.coins = 50
    state.core.hp = state.core.maxHp - 5
    buyHeal(state)
    expect(state.core.hp).toBe(state.core.maxHp)
  })

  it('não faz nada sem moedas suficientes', () => {
    const state = createGame(800, 600)
    state.coins = 0
    state.core.hp = 10
    buyHeal(state)
    expect(state.core.hp).toBe(10)
    expect(state.coins).toBe(0)
  })

  it('não faz nada se o hp já está cheio (não desperdiça moedas)', () => {
    const state = createGame(800, 600)
    state.coins = 50
    buyHeal(state)
    expect(state.coins).toBe(50)
  })

  it('canBuyHeal reflete corretamente as duas condições', () => {
    const state = createGame(800, 600)
    state.core.hp = state.core.maxHp - 10
    state.coins = 0
    expect(canBuyHeal(state)).toBe(false)
    state.coins = 50
    expect(canBuyHeal(state)).toBe(true)
    state.core.hp = state.core.maxHp
    expect(canBuyHeal(state)).toBe(false)
  })
})

describe('buyHpUpgrade', () => {
  it('aumenta hp máximo e hp atual, desconta o custo e conta a compra', () => {
    const state = createGame(800, 600)
    state.coins = 100
    const cost = hpUpgradeCost(state)
    const maxHpBefore = state.core.maxHp
    const hpBefore = state.core.hp
    buyHpUpgrade(state)
    expect(state.core.maxHp).toBe(maxHpBefore + SHOP_HP_UPGRADE_AMOUNT)
    expect(state.core.hp).toBe(hpBefore + SHOP_HP_UPGRADE_AMOUNT)
    expect(state.coins).toBe(100 - cost)
    expect(state.shop.hpUpgradesBought).toBe(1)
  })

  it('cada compra encarece a próxima', () => {
    const state = createGame(800, 600)
    state.coins = 1000
    const firstCost = hpUpgradeCost(state)
    buyHpUpgrade(state)
    const secondCost = hpUpgradeCost(state)
    expect(secondCost).toBeGreaterThan(firstCost)
  })

  it('não faz nada sem moedas suficientes', () => {
    const state = createGame(800, 600)
    state.coins = 0
    buyHpUpgrade(state)
    expect(state.shop.hpUpgradesBought).toBe(0)
    expect(state.coins).toBe(0)
  })

  it('canBuyHpUpgrade reflete o saldo de moedas', () => {
    const state = createGame(800, 600)
    state.coins = 0
    expect(canBuyHpUpgrade(state)).toBe(false)
    state.coins = hpUpgradeCost(state)
    expect(canBuyHpUpgrade(state)).toBe(true)
  })
})
