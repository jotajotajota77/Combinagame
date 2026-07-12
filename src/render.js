import { CORE_FLASH_DURATION } from './game/constants.js'

// Desenho puro em canvas: recebe o estado do jogo e desenha o frame atual.
// Não muda `state` — só lê.

function healthBar(ctx, x, y, width, ratio, color) {
  const height = 5
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(x - width / 2, y, width, height)
  ctx.fillStyle = color
  ctx.fillRect(x - width / 2, y, width * Math.max(0, ratio), height)
}

// Círculo sutil marcando o alcance atual da torre — só uma referência
// discreta, não deve competir visualmente com o núcleo/inimigos/tiros.
function drawRange(ctx, core) {
  ctx.beginPath()
  ctx.arc(core.x, core.y, core.range, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(120, 190, 255, 0.16)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawCore(ctx, core) {
  const pulse = 1 + Math.sin(Date.now() / 300) * 0.04
  const gradient = ctx.createRadialGradient(core.x, core.y, 2, core.x, core.y, core.radius * pulse)
  gradient.addColorStop(0, '#bfe7ff')
  gradient.addColorStop(0.6, '#4da3ff')
  gradient.addColorStop(1, '#12335e')
  ctx.beginPath()
  ctx.arc(core.x, core.y, core.radius * pulse, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.shadowColor = '#4da3ff'
  ctx.shadowBlur = 24
  ctx.fill()
  ctx.shadowBlur = 0

  healthBar(ctx, core.x, core.y + core.radius + 10, 64, core.hp / core.maxHp, '#5ce39a')
}

function drawEnemy(ctx, e) {
  ctx.beginPath()
  ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
  ctx.fillStyle = e.color
  ctx.shadowColor = e.color
  ctx.shadowBlur = 10
  ctx.fill()
  ctx.shadowBlur = 0

  healthBar(ctx, e.x, e.y - e.radius - 10, e.radius * 2.2, e.hp / e.maxHp, '#ff9f5a')
}

// Rastro curto atrás do míssil: segmentos entre as últimas posições
// guardadas (p.trail), ficando mais transparentes quanto mais antigos.
function drawMissileTrail(ctx, p) {
  if (!p.trail || p.trail.length === 0) return
  const points = [...p.trail, { x: p.x, y: p.y }]
  for (let i = 0; i < points.length - 1; i++) {
    const age = (i + 1) / points.length // 0..1, mais velho = mais apagado
    ctx.beginPath()
    ctx.moveTo(points[i].x, points[i].y)
    ctx.lineTo(points[i + 1].x, points[i + 1].y)
    ctx.strokeStyle = `rgba(255, 138, 77, ${age * 0.5})`
    ctx.lineWidth = p.radius * 0.9
    ctx.lineCap = 'round'
    ctx.stroke()
  }
}

// Míssil: um dardo orientado na direção do voo (não um círculo), pra ficar
// claro visualmente que é um projétil diferente do tiro normal.
function drawMissile(ctx, p) {
  const angle = Math.atan2(p.vy, p.vx)
  const length = p.radius * 2.6
  const width = p.radius * 1.4
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(length * 0.6, 0)
  ctx.lineTo(-length * 0.4, width * 0.5)
  ctx.lineTo(-length * 0.4, -width * 0.5)
  ctx.closePath()
  ctx.fillStyle = '#ff8a4d'
  ctx.shadowColor = '#ff8a4d'
  ctx.shadowBlur = 8
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.restore()
}

function drawProjectile(ctx, p) {
  if (p.homing) {
    drawMissileTrail(ctx, p)
    drawMissile(ctx, p)
    return
  }
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
  ctx.fillStyle = '#fff7c2'
  ctx.shadowColor = '#ffe98a'
  ctx.shadowBlur = 8
  ctx.fill()
  ctx.shadowBlur = 0
}

// Partículas somem gradualmente (alpha cai com a vida restante).
function drawParticles(ctx, particles) {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife)
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

// Flash vermelho na tela inteira quando o núcleo toma dano — desenhado por
// cima de tudo, mas discreto o bastante pra não atrapalhar a visão do jogo.
function drawCoreFlash(ctx, state) {
  if (state.core.flashTimer <= 0) return
  const ratio = state.core.flashTimer / CORE_FLASH_DURATION
  ctx.fillStyle = `rgba(255, 40, 60, ${ratio * 0.35})`
  ctx.fillRect(0, 0, state.width, state.height)
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, state.width, state.height)

  ctx.fillStyle = 'rgba(10,14,26,1)'
  ctx.fillRect(0, 0, state.width, state.height)

  drawRange(ctx, state.core)
  for (const p of state.projectiles) drawProjectile(ctx, p)
  for (const e of state.enemies) drawEnemy(ctx, e)
  drawParticles(ctx, state.particles)
  drawCore(ctx, state.core)
  drawCoreFlash(ctx, state)
}
