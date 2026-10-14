/**
 * A basic TOUCH UI for phones and tablets (owner, 2026-10-01: "we need a basic touch UI for ios").
 *
 * Big buttons over the corners of the picture, and nothing behind them but the keyboard: each button sends the key it
 * stands for (a synthetic `keydown` on press, `keyup` on release), so every mode keeps its own meaning for it with no
 * second code path —
 *
 *   ◀ ▶   ArrowLeft / ArrowRight: held to steer (fast input), or a turn declared at the next corner (slow input)
 *   ▮     the EFFORT SLIDER (couch, trainer debug): drag for watts, top harder, the bottom a little below zero is
 *         reverse (owner, 2026-10-14: "on iOS speed should be a slider", replacing ▲ harder / ▼ easier). It sets the
 *         watts directly (`sr-watts`, controls.ts) rather than sending keys.
 *   ⏸     Pause: pause (not P, which photo mode answers too)
 *   🗺     M: the big map
 *
 * The delivery card's buttons, the ↩ turn-round, the welcome screen and the map already answer a tap. Shown on a
 * touch screen (`?touch=1` forces it on, `?touch=0` off). On Dandyhorse (trainer) the trainer is the effort, so there
 * is no slider, only ▲ "straight" (ArrowUp: it cancels a declared turn, slow input).
 */
import { REVERSE_WATTS } from '../sim/ride.ts'

/** the slider's top: a strong rider's sustained effort; the keyboard still goes to 700 */
const SLIDER_MAX_WATTS = 400
export const TOUCH_CSS = `
.sr-touch { position: fixed; z-index: 8; display: flex; gap: 12px; pointer-events: none;
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none }
.sr-touch button { pointer-events: auto; touch-action: none; -webkit-tap-highlight-color: transparent;
  width: 72px; height: 72px; border-radius: 50%; border: 2px solid var(--border); background: var(--panel);
  color: var(--text); font: 800 30px/1 var(--font); box-shadow: var(--shadow); backdrop-filter: blur(6px);
  display: grid; place-items: center; padding: 0 }
.sr-touch button small { display: block; font: 700 10px/1 var(--font); opacity: .75; margin-top: 2px; letter-spacing: .04em }
.sr-touch button.held { background: var(--page); color: var(--on-page); border-color: var(--page) }
.sr-touch.steer { left: 16px; bottom: 150px }
.sr-touch.effort { right: 16px; bottom: 150px; flex-direction: column }
.sr-touch.small { left: 14px; top: 14px }
.sr-slider { pointer-events: auto; display: flex; flex-direction: column; align-items: center; gap: 6px;
  font: 700 10px/1 var(--font); color: var(--text); text-shadow: 0 1px 3px rgba(0,0,0,.7); letter-spacing: .04em }
.sr-slider .track { position: relative; width: 64px; height: 210px; border-radius: 32px; touch-action: none;
  border: 2px solid var(--border); background: var(--panel); box-shadow: var(--shadow); backdrop-filter: blur(6px); overflow: hidden }
.sr-slider .fill { position: absolute; left: 0; right: 0; bottom: 0; background: var(--page); opacity: .45 }
.sr-slider .thumb { position: absolute; left: 3px; right: 3px; height: 40px; border-radius: 20px; background: var(--page);
  color: var(--on-page); display: grid; place-items: center; font: 800 13px/1 var(--font); text-shadow: none;
  font-variant-numeric: tabular-nums }
.sr-slider.held .thumb { box-shadow: 0 0 0 3px var(--text) }
.sr-touch.small button { width: 48px; height: 48px; font-size: 22px }
/* looking round a paused scene: the riding pads give way to the look pad (ui/debug.ts LookPad) */
.sr-looking .sr-touch.steer, .sr-looking .sr-touch.effort { display: none }
`

/**
 * A PHONE'S SCREEN (owner, 2026-10-02: "on mobile, the screen needs to display less info - there just isn't enough
 * room. maybe 1 line advertising the order. no minimap. no arrows other than the touch buttons."). Everything here
 * hangs off one class on <html>, `sr-compact`, set by `compactScreen` — a touch screen whose short side is a phone's,
 * or `?compact=1|0`. The big map (the 🗺 button) still opens; only the corner minimap goes.
 */
export const COMPACT_CSS = `
.sr-compact #minimap:not(.large) { display: none }
.sr-compact #hud .sr-back, .sr-compact #hud .sr-turns, .sr-compact #hud .sr-exits,
.sr-compact #hud .sr-next, .sr-compact #hud .sr-stats, .sr-compact #hud .sr-gps { display: none }
.sr-compact #label { font-size: 9px; line-height: 1.2; bottom: 4px; left: 8px; max-width: 70vw; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; opacity: .7 }
/* the order, one line across the top: what, where to, how far, and the two buttons */
.sr-compact .sr-offer { left: 8px; right: 8px; top: 70px; transform: translateY(-8px); padding: 8px 10px; max-width: none;
  width: auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap }
.sr-compact .sr-offer.on { transform: none }
.sr-compact .sr-offer h3, .sr-compact .sr-offer .dish, .sr-compact .sr-offer .stop, .sr-compact .sr-offer .far { display: none }
.sr-compact .sr-offer .one { display: block; flex: 1 1 60%; min-width: 0; font: 700 14px/1.25 var(--font);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.sr-compact .sr-offer .row { flex: 0 0 auto }
.sr-compact .sr-offer button { padding: 8px 12px; font-size: 13px; white-space: nowrap }
.sr-compact .sr-offer kbd { display: none }
.sr-compact .sr-offer .clock { flex: 1 0 100%; margin-top: 4px }
.sr-offer .one { display: none }
/* during a job: the compass and the clock smaller, the pill under them */
.sr-compact .sr-nav { top: 70px; left: 8px; gap: 8px; padding: 4px 12px 4px 4px }
.sr-compact .sr-nav .dial { width: 34px; height: 34px }
.sr-compact .sr-nav .dial svg { width: 26px; height: 26px }
.sr-compact .sr-nav .dist { font-size: 15px; min-width: 52px }
.sr-compact .sr-nav .clock { font-size: 24px }
.sr-compact .sr-job { top: 118px; left: 8px; font-size: 13px; padding: 4px 12px }
/*
 * The bottom, from the edge up (owner, 2026-10-14, a screenshot of "Eat the bagel dozen" over the energy bar): the
 * credit line, the one tappable chip (hop on, eat the order: #hud's only child left on a phone), the energy bar,
 * the cash. Each its own band.
 */
.sr-compact #hud { padding-bottom: 24px }
.sr-compact .sr-energy { bottom: 66px }
.sr-compact .sr-cash { bottom: 104px }
`

/** Is this a phone's screen? (`?compact=1|0` decides, else a touch screen whose short side is under 600 px.) */
export function compactScreen(asked: string | null): boolean {
  if (asked === '1') return true
  if (asked === '0') return false
  return wantsTouch(null) && Math.min(innerWidth, innerHeight) < 600
}

/** Is this a touch screen? (`?touch=1|0` decides, else the device does.) */
export function wantsTouch(asked: string | null): boolean {
  if (asked === '1') return true
  if (asked === '0') return false
  return (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0 && /iPhone|iPad|iPod|Android/.test(navigator.userAgent)
}

/** The effort slider: the finger's height on the track is the watts, sent as `sr-watts` (controls.ts listens). */
function slider(parent: HTMLElement, start: number): void {
  const el = document.createElement('div')
  el.className = 'sr-slider'
  el.innerHTML = '<span>harder</span><div class="track"><div class="fill"></div><div class="thumb"></div></div><span>easier</span>'
  const track = el.querySelector('.track') as HTMLElement
  const fill = el.querySelector('.fill') as HTMLElement
  const thumb = el.querySelector('.thumb') as HTMLElement
  const span = SLIDER_MAX_WATTS - REVERSE_WATTS
  let watts = start
  const show = (): void => {
    const f = (watts - REVERSE_WATTS) / span
    fill.style.height = `${f * 100}%`
    // the thumb's centre on the value, kept inside the track
    thumb.style.bottom = `calc(${f} * (100% - 46px) + 3px)`
    thumb.textContent = watts < 0 ? 'back' : `${watts} W`
  }
  const at = (e: PointerEvent): void => {
    const r = track.getBoundingClientRect()
    const f = Math.max(0, Math.min(1, (r.bottom - 23 - e.clientY) / (r.height - 46)))
    const w = Math.round((REVERSE_WATTS + f * span) / 5) * 5
    if (w === watts) return
    watts = w
    show()
    dispatchEvent(new CustomEvent('sr-watts', { detail: watts }))
  }
  track.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    track.setPointerCapture(e.pointerId)
    el.classList.add('held')
    at(e)
  })
  track.addEventListener('pointermove', (e) => { if (track.hasPointerCapture(e.pointerId)) at(e) })
  const up = (): void => { el.classList.remove('held') }
  track.addEventListener('pointerup', up)
  track.addEventListener('lostpointercapture', up)
  track.addEventListener('contextmenu', (e) => e.preventDefault())
  show()
  parent.appendChild(el)
}

export function touchControls(opts: { trainer: boolean; watts?: number }): void {
  const send = (type: 'keydown' | 'keyup', code: string, key: string): void => {
    dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true, cancelable: true }))
  }
  const pad = (cls: string): HTMLElement => {
    const el = document.createElement('div')
    el.className = `sr-touch ${cls}`
    document.body.appendChild(el)
    return el
  }
  /** a button for a key: down while the finger is on it, and repeated while held if `repeat` */
  const button = (parent: HTMLElement, label: string, code: string, key: string, sub = '', repeat = false): void => {
    const b = document.createElement('button')
    b.innerHTML = sub ? `<span>${label}<small>${sub}</small></span>` : label
    b.setAttribute('aria-label', sub || label)
    let timer: ReturnType<typeof setTimeout> | null = null
    const up = (): void => {
      if (!b.classList.contains('held')) return
      b.classList.remove('held')
      if (timer) clearTimeout(timer)
      timer = null
      send('keyup', code, key)
    }
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      b.setPointerCapture(e.pointerId)
      b.classList.add('held')
      send('keydown', code, key)
      if (repeat) {
        const again = (): void => { send('keydown', code, key); timer = setTimeout(again, 120) }
        timer = setTimeout(again, 380)
      }
    })
    b.addEventListener('pointerup', up)
    b.addEventListener('pointercancel', up)
    b.addEventListener('lostpointercapture', up)
    b.addEventListener('contextmenu', (e) => e.preventDefault())
    parent.appendChild(b)
  }
  const steer = pad('steer')
  button(steer, '◀', 'ArrowLeft', 'ArrowLeft')
  button(steer, '▶', 'ArrowRight', 'ArrowRight')
  const effort = pad('effort')
  if (opts.trainer) button(effort, '▲', 'ArrowUp', 'ArrowUp', 'straight')
  else slider(effort, opts.watts ?? 180)
  const small = pad('small')
  // (no ⏸ here: the one at the top right — ui/debug.ts — pauses AND opens the look-around camera; two pause buttons,
  // one of which only stopped the clock, is how the owner found "no way to move around the camera when paused")
  button(small, '🗺', 'KeyM', 'm')
}

/**
 * What a prompt should ask for (owner, 2026-10-03: "many of the messages say 'press X key' which is frustrating on
 * mobile"): a touch screen has no keyboard, so there the prompt names the tap, and the thing it names is a button on
 * the screen. The same rule as the controls (`wantsTouch`, `?touch=` decides).
 */
export const touchScreen = (): boolean => wantsTouch(new URLSearchParams(globalThis.location?.search ?? '').get('touch'))

/** "B to get off", or on a touch screen "tap to get off" */
export const keyed = (key: string, action: string): string => (touchScreen() ? `tap to ${action}` : `${key} to ${action}`)
