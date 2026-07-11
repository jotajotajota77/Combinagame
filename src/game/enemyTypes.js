// Tipos de inimigo: aparência e stats-base (antes da escala por onda, ver
// waveEnemyScale em waves.js). `unlockWave` = a partir de qual onda esse tipo
// passa a poder nascer; `weight` pondera o sorteio entre os já desbloqueados.
// `coinValue` = moedas ganhas ao abater (mais difícil de matar, mais rende).
export const ENEMY_TYPES = {
  normal: { radius: 12, hp: 20, speed: 60, damage: 10, color: '#ff5470', unlockWave: 1, weight: 3, coinValue: 5 },
  fast: { radius: 9, hp: 10, speed: 130, damage: 8, color: '#ffcf4d', unlockWave: 2, weight: 2, coinValue: 4 },
  tanky: { radius: 18, hp: 55, speed: 38, damage: 18, color: '#9b5de5', unlockWave: 3, weight: 1, coinValue: 12 },
}

// Sorteia um tipo entre os desbloqueados na onda atual, ponderado por peso.
export function pickEnemyType(wave, rng = Math.random) {
  const available = Object.entries(ENEMY_TYPES).filter(([, t]) => wave >= t.unlockWave)
  const totalWeight = available.reduce((sum, [, t]) => sum + t.weight, 0)
  let roll = rng() * totalWeight
  for (const [key, t] of available) {
    if (roll < t.weight) return key
    roll -= t.weight
  }
  return available[available.length - 1][0]
}
