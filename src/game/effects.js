// Efeitos especiais testáveis via checkbox no botão "Efeitos" da UI. Cada
// entrada aqui só liga/desliga uma flag em `state.effects` — a lógica de
// cada efeito vive nos módulos que já cuidam do que ele afeta (ex:
// "missile" em combat.js/projectiles.js).
export const EFFECTS = [{ key: 'missile', label: 'Míssil (4 mísseis fracos e teleguiados)' }]

export function createEffectsState() {
  const effects = {}
  for (const effect of EFFECTS) effects[effect.key] = false
  return effects
}
