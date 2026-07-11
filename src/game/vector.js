// Helpers de vetor 2D puros — sem estado, fáceis de testar.
export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay)
}

// Vetor unitário de (ax,ay) até (bx,by). Se os pontos coincidirem, devolve {x:0,y:0}.
export function direction(ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy)
  if (len === 0) return { x: 0, y: 0 }
  return { x: dx / len, y: dy / len }
}
