// Todos os números que definem o "feel" do jogo — ajuste aqui.
export const CORE_RADIUS = 26
export const CORE_MAX_HP = 100
export const CORE_FLASH_DURATION = 0.25 // segundos que a tela pisca ao levar dano

export const PARTICLE_COUNT = 8 // partículas por explosão de morte
export const PARTICLE_SPEED_MIN = 60
export const PARTICLE_SPEED_MAX = 160
export const PARTICLE_LIFE = 0.4 // segundos até sumir
export const PARTICLE_RADIUS = 3

export const ARENA_MARGIN = 40 // distância mínima do spawn até a borda da tela

// Stats por tipo de inimigo (radius/hp/speed/damage/cor) ficam em enemyTypes.js.

export const TURRET_RANGE = 320 // alcance de detecção do núcleo
export const TURRET_FIRE_INTERVAL = 0.45 // segundos entre disparos
export const TURRET_DAMAGE = 10

export const PROJECTILE_SPEED = 420 // px/s
export const PROJECTILE_RADIUS = 4

// Efeito "míssil" (testável via botão Efeitos): substitui o tiro normal por
// vários mísseis mais fracos e teleguiados nascendo ao redor do núcleo.
export const MISSILE_COUNT = 4
export const MISSILE_DAMAGE_RATIO = 0.35 // fração do dano de um tiro normal, por míssil
export const MISSILE_SPAWN_RADIUS = 40 // distância do centro do núcleo onde cada míssil nasce
export const MISSILE_SPEED = 300 // px/s — mais lento que o tiro reto, pra dar pra ver a curva
export const MISSILE_TURN_RATE = Math.PI * 1.5 // rad/s — vira rápido, mas não é teleguiado perfeito/instantâneo
export const MISSILE_TRAIL_LENGTH = 6 // pontos guardados pro rastro curto atrás do míssil
export const MISSILE_VIEW_ANGLE = Math.PI // campo de visão de 180°, centrado na direção do voo
export const MISSILE_VIEW_RANGE = 2000 // "bem longo" — maior que qualquer diagonal de tela plausível
export const MISSILE_TARGET_WEIGHT_BIAS = 1 // px somado à distância antes de inverter o peso (evita peso infinito a distância 0)

// Loja entre ondas: gasta moedas em melhorias permanentes/consumíveis do
// núcleo. Só fica disponível durante o descanso (wave.phase === 'resting').
export const SHOP_HEAL_COST = 15 // custo fixo — é consumível, não escala
export const SHOP_HEAL_AMOUNT = 30
export const SHOP_HP_UPGRADE_BASE_COST = 20
export const SHOP_HP_UPGRADE_COST_STEP = 10 // cada compra encarece a próxima
export const SHOP_HP_UPGRADE_AMOUNT = 15

// Ondas: levas de inimigos com uma pausa entre elas (jogo pausado, loja
// aberta até o jogador clicar em "Continuar" — ver startNextWave em
// waves.js). Cada onda tem mais inimigos, nasce mais rápido, e os inimigos
// vêm um pouco mais fortes.
export const WAVE_BASE_COUNT = 4 // inimigos na onda 1
export const WAVE_COUNT_INCREMENT = 2 // inimigos a mais por onda
export const WAVE_BASE_SPAWN_INTERVAL = 1.1 // segundos entre spawns na onda 1
export const WAVE_SPAWN_INTERVAL_DECAY = 0.05 // quanto isso encurta por onda
export const WAVE_MIN_SPAWN_INTERVAL = 0.35 // piso — nunca nasce mais rápido que isso
export const WAVE_HP_SCALE_PER_WAVE = 0.12 // +12% de vida por onda (a partir da 2ª)
export const WAVE_SPEED_SCALE_PER_WAVE = 0.04 // +4% de velocidade por onda
