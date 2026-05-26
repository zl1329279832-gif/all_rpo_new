let ctx: AudioContext | null = null
let enabled = true

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      ctx = new AC()
    } catch {
      ctx = null
    }
  }
  return ctx
}

function tone(freq: number, duration = 0.12, type: OscillatorType = 'sine', gain = 0.08) {
  if (!enabled) return
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  osc.connect(g)
  g.connect(c.destination)
  const now = c.currentTime
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

export const sfx = {
  setEnabled(v: boolean) {
    enabled = v
  },
  isEnabled() {
    return enabled
  },
  playCard() {
    tone(520, 0.08, 'triangle', 0.07)
    setTimeout(() => tone(720, 0.08, 'triangle', 0.05), 60)
  },
  attack() {
    tone(180, 0.18, 'sawtooth', 0.1)
  },
  heal() {
    tone(660, 0.1, 'sine', 0.08)
    setTimeout(() => tone(880, 0.1, 'sine', 0.06), 80)
  },
  shield() {
    tone(340, 0.14, 'square', 0.06)
  },
  turn() {
    tone(420, 0.12, 'sine', 0.06)
    setTimeout(() => tone(560, 0.12, 'sine', 0.06), 90)
  },
  victory() {
    tone(660, 0.15, 'triangle', 0.08)
    setTimeout(() => tone(880, 0.2, 'triangle', 0.08), 120)
  },
  defeat() {
    tone(220, 0.2, 'sawtooth', 0.08)
    setTimeout(() => tone(140, 0.28, 'sawtooth', 0.08), 160)
  },
  status() {
    tone(300, 0.08, 'square', 0.05)
  }
}
