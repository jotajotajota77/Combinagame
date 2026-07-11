// Desenho puro em canvas: recebe o estado do jogo e desenha o frame atual.
// Não muda `state` — só lê.

function healthBar(ctx, x, y, width, ratio, color) {
  const height = 5
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(x - width / 2, y, width, height)
  ctx.fillStyle = color
  ctx.fillRect(x - width / 2, y, width * Math.max(0, ratio), height)
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

function drawProjectile(ctx, p) {
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
  ctx.fillStyle = '#fff7c2'
  ctx.shadowColor = '#ffe98a'
  ctx.shadowBlur = 8
  ctx.fill()
  ctx.shadowBlur = 0
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, state.width, state.height)

  ctx.fillStyle = 'rgba(10,14,26,1)'
  ctx.fillRect(0, 0, state.width, state.height)

  for (const p of state.projectiles) drawProjectile(ctx, p)
  for (const e of state.enemies) drawEnemy(ctx, e)
  drawCore(ctx, state.core)
}
