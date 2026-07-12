import { describe, it, expect } from 'vitest'
import { EFFECTS, createEffectsState } from './effects.js'

describe('createEffectsState', () => {
  it('cria uma flag desligada para cada efeito da lista', () => {
    const effects = createEffectsState()
    for (const effect of EFFECTS) {
      expect(effects[effect.key]).toBe(false)
    }
  })

  it('inclui o efeito míssil', () => {
    expect(EFFECTS.some((e) => e.key === 'missile')).toBe(true)
  })
})
