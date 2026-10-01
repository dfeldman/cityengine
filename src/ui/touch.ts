/**
 * A basic TOUCH UI for phones and tablets (owner, 2026-10-01: "we need a basic touch UI for ios").
 *
 * Big buttons over the corners of the picture, and nothing behind them but the keyboard: each button sends the key it
 * stands for (a synthetic `keydown` on press, `keyup` on release), so every mode keeps its own meaning for it with no
 * second code path —
 *
 *   ◀ ▶   ArrowLeft / ArrowRight: held to steer (fast input), or a turn declared at the next corner (slow input)
 *   ▲ ▼   ArrowUp / ArrowDown: more or less effort (couch, trainer debug; held, it repeats); ▲ also cancels a
 *         declared turn (slow input), as ↑ does
 *   ⏸     Pause: pause (not P, which photo mode answers too)
 *   🗺     M: the big map
 *
 * The delivery card's buttons, the ↩ turn-round, the welcome screen and the map already answer a tap. Shown on a
 * touch screen (`?touch=1` forces it on, `?touch=0` off). On Dandyhorse (trainer) the trainer is the effort, so ▲ is
 * "straight" only and ▼ is not drawn.
 */
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
.sr-touch.small button { width: 48px; height: 48px; font-size: 22px }
`

/** Is this a touch screen? (`?touch=1|0` decides, else the device does.) */
export function wantsTouch(asked: string | null): boolean {
  if (asked === '1') return true
  if (asked === '0') return false
  return (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0 && /iPhone|iPad|iPod|Android/.test(navigator.userAgent)
}

export function touchControls(opts: { trainer: boolean }): void {
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
  else {
    button(effort, '▲', 'ArrowUp', 'ArrowUp', 'harder', true)
    button(effort, '▼', 'ArrowDown', 'ArrowDown', 'easier', true)
  }
  const small = pad('small')
  button(small, '⏸', 'Pause', 'Pause')
  button(small, '🗺', 'KeyM', 'm')
}
