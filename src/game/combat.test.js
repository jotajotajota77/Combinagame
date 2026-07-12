import { describe, it, expect } from 'vitest'
import { createGame } from './core.js'
import { findNearestEnemy, findNearestVisibleEnemy, updateCombat } from './combat.js'
import {
  MISSILE_COUNT,
  MISSILE_DAMAGE_RATIO,
  MISSILE_SPAWN_RADIUS,
  MISSILE_VIEW_RANGE,
  TURRET_RANGE,
  TURRET_FIRE_INTERVAL,
} from './constants.js'
import { distance } from './vector.js'
import { seededRng } from './testUtils.js'

function addEnemy(state, x, y) {
  const e = { x, y, vx: 0, vy: 0, radius: 12, hp: 20, maxHp: 20 }
  state.enemies.push(e)
  return e
}

describe('findNearestEnemy', () => {
  it('escolhe o inimigo mais próximo dentro do alcance', () => {
    const state = createGame(800, 600)
    const far = addEnemy(state, state.core.x + 200, state.core.y)
    const near = addEnemy(state, state.core.x + 50, state.core.y)
    expect(findNearestEnemy(state)).toBe(near)
    void far
  })

  it('ignora inimigos fora do alcance da torre', () => {
    const state = createGame(2000, 2000)
    addEnemy(state, state.core.x + TURRET_RANGE + 100, state.core.y)
    expect(findNearestEnemy(state)).toBeNull()
  })
})

describe('updateCombat', () => {
  it('atira um projétil mirado no alvo quando há inimigo no alcance', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0
    addEnemy(state, state.core.x + 100, state.core.y)
    updateCombat(state, 0)
    expect(state.projectiles).toHaveLength(1)
    const p = state.projectiles[0]
    expect(p.vx).toBeGreaterThan(0)
    expect(p.vy).toBeCloseTo(0)
    expect(state.fireTimer).toBeCloseTo(TURRET_FIRE_INTERVAL)
  })

  it('não atira antes do cooldown acabar', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0.3
    addEnemy(state, state.core.x + 100, state.core.y)
    updateCombat(state, 0.1)
    expect(state.projectiles).toHaveLength(0)
    expect(state.fireTimer).toBeCloseTo(0.2)
  })

  it('não atira sem nenhum inimigo no alcance', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0
    updateCombat(state, 0)
    expect(state.projectiles).toHaveLength(0)
  })
})

describe('updateCombat com o efeito míssil ligado', () => {
  it('atira MISSILE_COUNT mísseis mais fracos e teleguiados em vez de 1 tiro reto', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0
    state.effects.missile = true
    addEnemy(state, state.core.x + 100, state.core.y)
    updateCombat(state, 0, seededRng(1))

    expect(state.projectiles).toHaveLength(MISSILE_COUNT)
    for (const p of state.projectiles) {
      expect(p.homing).toBe(true)
      expect(p.damage).toBeCloseTo(state.core.damage * MISSILE_DAMAGE_RATIO)
    }
    expect(state.fireTimer).toBeCloseTo(TURRET_FIRE_INTERVAL)
  })

  it('cada míssil nasce a MISSILE_SPAWN_RADIUS de distância do núcleo', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0
    state.effects.missile = true
    addEnemy(state, state.core.x + 100, state.core.y)
    updateCombat(state, 0, seededRng(2))

    for (const p of state.projectiles) {
      expect(distance(state.core.x, state.core.y, p.x, p.y)).toBeCloseTo(MISSILE_SPAWN_RADIUS)
    }
  })

  it('ainda respeita o cooldown normal — não dispara antes da hora', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0.3
    state.effects.missile = true
    addEnemy(state, state.core.x + 100, state.core.y)
    updateCombat(state, 0.1, seededRng(3))
    expect(state.projectiles).toHaveLength(0)
  })

  it('míssil que nasce olhando pro alvo trava nele de cara', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0
    state.effects.missile = true
    const enemy = addEnemy(state, state.core.x + 100, state.core.y) // à direita do núcleo
    const facingTargetRng = () => 0 // ângulo 0 → nasce olhando pra +x, reto pro inimigo

    updateCombat(state, 0, facingTargetRng)

    for (const p of state.projectiles) {
      expect(p.target).toBe(enemy)
    }
  })

  it('míssil que nasce de costas pro alvo (fora do cone de 180°) não trava nele', () => {
    const state = createGame(800, 600)
    state.fireTimer = 0
    state.effects.missile = true
    addEnemy(state, state.core.x + 100, state.core.y) // à direita do núcleo
    const facingAwayRng = () => 0.5 // ângulo PI → nasce olhando pra -x, de costas pro inimigo

    updateCombat(state, 0, facingAwayRng)

    for (const p of state.projectiles) {
      expect(p.target).toBeNull()
    }
  })
})

describe('findNearestVisibleEnemy', () => {
  it('enxerga um alvo bem na frente (ângulo 0)', () => {
    const state = createGame(800, 600)
    const enemy = addEnemy(state, 100, 0)
    expect(findNearestVisibleEnemy(state, 0, 0, 1, 0)).toBe(enemy)
  })

  it('enxerga um alvo bem na borda do cone (90° de um lado)', () => {
    const state = createGame(800, 600)
    const enemy = addEnemy(state, 0, 100) // 90° em relação ao heading (1,0)
    expect(findNearestVisibleEnemy(state, 0, 0, 1, 0)).toBe(enemy)
  })

  it('não enxerga um alvo atrás (mais de 90° do heading)', () => {
    const state = createGame(800, 600)
    addEnemy(state, -100, 0) // 180° em relação ao heading (1,0) — direto atrás
    expect(findNearestVisibleEnemy(state, 0, 0, 1, 0)).toBeNull()
  })

  it('não enxerga um alvo além do alcance de visão', () => {
    const state = createGame(4000, 4000)
    addEnemy(state, MISSILE_VIEW_RANGE + 100, 0)
    expect(findNearestVisibleEnemy(state, 0, 0, 1, 0)).toBeNull()
  })

  it('com um único candidato visível, não consome o rng (escolha direta)', () => {
    const state = createGame(800, 600)
    const enemy = addEnemy(state, 100, 0)
    const explodingRng = () => {
      throw new Error('não devia ter sorteado nada com um candidato só')
    }
    expect(findNearestVisibleEnemy(state, 0, 0, 1, 0, explodingRng)).toBe(enemy)
  })

  it('entre dois alvos visíveis, escolhe o mais próximo quando o sorteio cai no início do peso', () => {
    const state = createGame(800, 600)
    const near = addEnemy(state, 50, 0)
    addEnemy(state, 90, 0)
    expect(findNearestVisibleEnemy(state, 0, 0, 1, 0, () => 0)).toBe(near)
  })

  it('entre dois alvos visíveis, pode escolher o mais distante quando o sorteio cai no fim do peso', () => {
    const state = createGame(800, 600)
    addEnemy(state, 50, 0)
    const far = addEnemy(state, 90, 0)
    expect(findNearestVisibleEnemy(state, 0, 0, 1, 0, () => 0.999999)).toBe(far)
  })

  it('ao longo de muitas tentativas, o mais próximo é sorteado com mais frequência, mas o mais distante também tem chance', () => {
    const state = createGame(800, 600)
    const near = addEnemy(state, 50, 0)
    const far = addEnemy(state, 400, 0)
    const rng = seededRng(7)
    let nearCount = 0
    let farCount = 0
    for (let i = 0; i < 500; i++) {
      const picked = findNearestVisibleEnemy(state, 0, 0, 1, 0, rng)
      if (picked === near) nearCount++
      else if (picked === far) farCount++
    }
    expect(nearCount + farCount).toBe(500)
    expect(nearCount).toBeGreaterThan(farCount) // tendência pro mais próximo...
    expect(farCount).toBeGreaterThan(0) // ...mas o mais distante também é sorteado às vezes
  })

  it('ignora candidatos fora do cone/alcance na hora de sortear', () => {
    const state = createGame(800, 600)
    const visible = addEnemy(state, 50, 0)
    addEnemy(state, -100, 0) // atrás, fora do cone de 180°
    for (let seed = 1; seed <= 20; seed++) {
      expect(findNearestVisibleEnemy(state, 0, 0, 1, 0, seededRng(seed))).toBe(visible)
    }
  })
})
