// Sons suaves gerados via WebAudio — nada de arquivos externos. Tudo opcional.
let ctx = null
let enabled = true

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (AC) ctx = new AC()
  }
  return ctx
}

export function setSoundEnabled(v) {
  enabled = v
}

export function isSoundEnabled() {
  return enabled
}

// Um tom curto e macio.
function blip(freq, when, dur, gain = 0.08, type = 'sine') {
  const c = ac()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, when)
  g.gain.linearRampToValueAtTime(gain, when + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
  osc.connect(g).connect(c.destination)
  osc.start(when)
  osc.stop(when + dur)
}

// Som de match: uma pequena subida de acordo com o tamanho do combo.
export function playMatch(comboLevel = 0) {
  if (!enabled) return
  const c = ac()
  if (!c) return
  if (c.state === 'suspended') c.resume()
  const base = 440 * Math.pow(2, Math.min(comboLevel, 8) / 12)
  const t = c.currentTime
  blip(base, t, 0.18, 0.06)
  blip(base * 1.5, t + 0.05, 0.16, 0.045)
}

// Som de especial: mais encorpado.
export function playSpecial() {
  if (!enabled) return
  const c = ac()
  if (!c) return
  if (c.state === 'suspended') c.resume()
  const t = c.currentTime
  blip(330, t, 0.28, 0.07, 'triangle')
  blip(660, t + 0.06, 0.24, 0.05, 'sine')
  blip(990, t + 0.12, 0.2, 0.035, 'sine')
}

// Clique/seleção discreto.
export function playSwap() {
  if (!enabled) return
  const c = ac()
  if (!c) return
  if (c.state === 'suspended') c.resume()
  blip(520, c.currentTime, 0.08, 0.04, 'sine')
}
