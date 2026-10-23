/**
 * A GAMEPAD (owner, 2026-10-23: "Moonlight has a gamepad input mode as well" — a phone streaming the desktop can hand
 * the browser a controller). Like the touch buttons (ui/touch.ts), it sends the keys it stands for, as synthetic
 * `keydown` / `keyup`, so every mode and menu keeps its own meaning for them with no second code path. The standard
 * layout (an Xbox pad; the browser maps others onto it):
 *
 *   left stick ◀ ▶ / d-pad ◀ ▶   ArrowLeft / ArrowRight, held: steering (and ← back in a menu)
 *   d-pad ▲ ▼                     ArrowUp / ArrowDown, repeated while held: effort, or a menu's rows
 *   right trigger / left trigger  the effort outright, like the touch slider (`sr-watts`): RT harder, LT backs up;
 *                                 let go and the effort stays where it was
 *   A  Enter   B  Escape          choose / back (B opens the menu while riding, as Esc does)
 *   Y  KeyY    X  KeyX            take or skip a delivery — the keyboard's own letters
 *   LB  KeyU   RB  KeyB           turn round / board a cable car
 *   View  KeyM   Menu  Escape     the map / the menu
 *
 * Polled once a frame while a pad is connected; nothing runs without one.
 */
import { REVERSE_WATTS } from '../sim/ride.ts'

/** the triggers' full travel: the touch slider's top (ui/touch.ts) */
const TRIGGER_MAX_WATTS = 400
const STICK = 0.5
const TRIGGER = 0.06

const BUTTONS: [index: number, code: string, key: string, repeat: boolean][] = [
  [0, 'Enter', 'Enter', false],
  [1, 'Escape', 'Escape', false],
  [2, 'KeyX', 'x', false],
  [3, 'KeyY', 'y', false],
  [4, 'KeyU', 'u', false],
  [5, 'KeyB', 'b', false],
  [8, 'KeyM', 'm', false],
  [9, 'Escape', 'Escape', false],
  [12, 'ArrowUp', 'ArrowUp', true],
  [13, 'ArrowDown', 'ArrowDown', true],
]

export function gamepadControls(): void {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return
  const send = (type: 'keydown' | 'keyup', code: string, key: string, repeat = false): void => {
    dispatchEvent(new KeyboardEvent(type, { code, key, repeat, bubbles: true, cancelable: true }))
  }
  /** what is held, by the code it sends, and when it next repeats */
  const held = new Map<string, number>()
  const hold = (code: string, key: string, on: boolean, repeat: boolean, now: number): void => {
    const was = held.get(code)
    if (on && was === undefined) {
      send('keydown', code, key)
      held.set(code, repeat ? now + 380 : Infinity)
    } else if (on && was !== undefined && now >= was) {
      send('keydown', code, key, true)
      held.set(code, now + 120)
    } else if (!on && was !== undefined) {
      held.delete(code)
      send('keyup', code, key)
    }
  }
  let lastWatts: number | null = null
  let running = false
  const frame = (now: number): void => {
    const pads = [...navigator.getGamepads()].filter((p): p is Gamepad => !!p && p.connected)
    if (!pads.length) {
      for (const [code] of held) send('keyup', code, code)
      held.clear()
      running = false
      return
    }
    const pressed = (i: number): boolean => pads.some((p) => p.buttons[i]?.pressed)
    const axis = (i: number): number => pads.reduce((a, p) => (Math.abs(p.axes[i] ?? 0) > Math.abs(a) ? p.axes[i] : a), 0)
    for (const [i, code, key, repeat] of BUTTONS) hold(code, key, pressed(i), repeat, now)
    const x = axis(0)
    hold('ArrowLeft', 'ArrowLeft', pressed(14) || x < -STICK, false, now)
    hold('ArrowRight', 'ArrowRight', pressed(15) || x > STICK, false, now)
    // the triggers: the effort outright while either is squeezed
    const value = (i: number): number => pads.reduce((a, p) => Math.max(a, p.buttons[i]?.value ?? 0), 0)
    const rt = value(7)
    const lt = value(6)
    if (rt > TRIGGER || lt > TRIGGER) {
      const w = Math.round((rt >= lt ? rt * TRIGGER_MAX_WATTS : lt * REVERSE_WATTS) / 5) * 5
      if (w !== lastWatts) {
        lastWatts = w
        dispatchEvent(new CustomEvent('sr-watts', { detail: w }))
      }
    } else {
      lastWatts = null
    }
    requestAnimationFrame(frame)
  }
  const start = (): void => {
    if (running) return
    running = true
    requestAnimationFrame(frame)
  }
  addEventListener('gamepadconnected', start)
  // (a pad already connected before the page loaded shows itself only once a button is pressed; so does Chrome's
  //  `gamepadconnected`, which then fires — this catches the browsers that list it straight away)
  if ([...navigator.getGamepads()].some((p) => p?.connected)) start()
}
