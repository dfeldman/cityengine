/**
 * SOUND EFFECTS (2026-10-01, for the demo): a handful of short cues, synthesised with WebAudio so there is no file to
 * load — the drop-off chime (rising with the stars), the pickup blip, the bump, the spoiled dish, the level-up.
 * Quiet by design: they mark a moment, they do not score the ride. `?sound=0` silences them; a browser that will not
 * make an AudioContext (or not before a gesture) just stays silent.
 */
let ctx: AudioContext | null = null
let muted = new URLSearchParams(typeof location === 'undefined' ? '' : location.search).get('sound') === '0'

export function setMuted(m: boolean): void { muted = m }

function audio(): AudioContext | null {
  if (muted) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

/** one enveloped note: `f` Hz from `at` seconds after now, `len` long */
function note(a: AudioContext, f: number, at: number, len: number, gain: number, type: OscillatorType = 'triangle', slideTo?: number): void {
  const o = a.createOscillator()
  const v = a.createGain()
  o.type = type
  const t = a.currentTime + 0.02 + at
  o.frequency.setValueAtTime(f, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + len)
  v.gain.setValueAtTime(0, t)
  v.gain.linearRampToValueAtTime(gain, t + 0.01)
  v.gain.exponentialRampToValueAtTime(0.0001, t + len)
  o.connect(v).connect(a.destination)
  o.start(t)
  o.stop(t + len + 0.05)
}

/** the drop-off: a little bell, more notes for more stars */
export function chime(stars: number): void {
  const a = audio()
  if (!a) return
  ;[523.25, 659.25, 783.99, 1046.5].slice(0, Math.max(1, Math.min(4, stars - 1)))
    .forEach((f, i) => note(a, f, i * 0.11, 0.6, 0.12))
}

/** the pickup: two quick notes up */
export function pickup(): void {
  const a = audio()
  if (!a) return
  note(a, 587.33, 0, 0.18, 0.1)
  note(a, 880, 0.08, 0.3, 0.1)
}

/** a collision: a low thump */
export function bump(): void {
  const a = audio()
  if (!a) return
  note(a, 150, 0, 0.22, 0.25, 'sine', 55)
}

/** a fragile dish spoiled: a sad slide down */
export function spoiled(): void {
  const a = audio()
  if (!a) return
  note(a, 392, 0, 0.5, 0.1, 'sawtooth', 196)
}

/** a new level: a short fanfare */
export function levelUp(): void {
  const a = audio()
  if (!a) return
  ;[523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => note(a, f, i * 0.09 + (i > 3 ? 0.08 : 0), i === 5 ? 0.7 : 0.25, 0.11))
}
