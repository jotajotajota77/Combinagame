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

// Ondas: levas de inimigos com uma pausa entre elas. Cada onda tem mais
// inimigos, nasce mais rápido, e os inimigos vêm um pouco mais fortes.
export const WAVE_REST_SECONDS = 3 // descanso entre uma onda e a próxima
export const WAVE_BASE_COUNT = 4 // inimigos na onda 1
export const WAVE_COUNT_INCREMENT = 2 // inimigos a mais por onda
export const WAVE_BASE_SPAWN_INTERVAL = 1.1 // segundos entre spawns na onda 1
export const WAVE_SPAWN_INTERVAL_DECAY = 0.05 // quanto isso encurta por onda
export const WAVE_MIN_SPAWN_INTERVAL = 0.35 // piso — nunca nasce mais rápido que isso
export const WAVE_HP_SCALE_PER_WAVE = 0.12 // +12% de vida por onda (a partir da 2ª)
export const WAVE_SPEED_SCALE_PER_WAVE = 0.04 // +4% de velocidade por onda
