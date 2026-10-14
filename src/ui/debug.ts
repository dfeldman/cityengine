/**
 * Debugging a city you can only see from behind a moving bike.
 *
 * Two tools, both reachable from a small panel in the corner and from the keyboard:
 *
 *   P  pause (F too, the old key) — the rider stops where they are (the city keeps living), and the camera flies free:
 *      W/A/S/D move along the view, Q/E go down and up, Shift is four times faster; drag to orbit,
 *      shift- or right-drag to walk the focus across the ground, wheel to zoom. Everything
 *      the chase camera never shows — the far side of a building, a junction from above, the back of a
 *      sign — is a drag away. F again puts the camera back behind the rider and rides on.
 *
 *   C  copy — the latitude and longitude of whatever the camera is looking at (the rider, or the frozen
 *      focus) go on the clipboard as "lat, lon", which pastes straight into Google Maps for comparing the
 *      render with reality. The toast also names the street edge, which is what the shot harness takes
 *      (`--edge=`) to come back to exactly this spot.
 *
 *   J  paths — the ride graph drawn on the ground: every path the rider can take, each junction where there
 *      is a choice, and the exits of the next one (render/pathmap.ts).
 *
 *   G  go to — paste a "lat, lon" (or paste one anywhere on the page) and ride from the nearest street to
 *      it, in whichever baked city it is in (ui/goto.ts).
 */
import { touchScreen } from './touch.ts'

export interface Look {
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
  dist: number
}

export class OrbitLook {
  readonly look: Look = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0.35, dist: 9 }
  active = false
  /** metres above the ground the focus has been flown up (or down) with Q and E */
  lift = 0
  private readonly held = new Set<string>()

  constructor(canvas: HTMLCanvasElement) {
    addEventListener('keydown', (e) => { if (this.active) this.held.add(e.code) })
    addEventListener('keyup', (e) => this.held.delete(e.code))
    addEventListener('blur', () => this.held.clear())
    let lastX = 0
    let lastY = 0
    /*
     * Two fingers on a touch screen: pinch to come in or go out, drag both to walk the focus across the ground — the
     * phone's own gestures for a map (owner, 2026-10-04: "no way to move around the camera when paused").
     */
    const fingers = new Map<number, { x: number; y: number }>()
    let pinch = 0
    let mid = { x: 0, y: 0 }
    const spread = (): { d: number; x: number; y: number } => {
      const [a, b] = [...fingers.values()]
      return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    }
    const lift = (e: PointerEvent): void => { fingers.delete(e.pointerId); pinch = 0 }
    canvas.addEventListener('pointerup', lift)
    canvas.addEventListener('pointercancel', lift)
    canvas.addEventListener('pointerdown', (e) => {
      if (!this.active) return
      lastX = e.clientX
      lastY = e.clientY
      canvas.setPointerCapture(e.pointerId)
      if (e.pointerType === 'touch') {
        fingers.set(e.pointerId, { x: e.clientX, y: e.clientY })
        if (fingers.size === 2) { const s = spread(); pinch = s.d; mid = { x: s.x, y: s.y } }
      }
    })
    canvas.addEventListener('pointermove', (e) => {
      if (!this.active) return
      if (e.pointerType === 'touch' && fingers.has(e.pointerId)) {
        fingers.set(e.pointerId, { x: e.clientX, y: e.clientY })
        if (fingers.size >= 2) {
          const s = spread()
          const l = this.look
          if (pinch > 0 && s.d > 0) l.dist = Math.max(2, Math.min(600, l.dist * (pinch / s.d)))
          const k = l.dist * 0.0022, dx = s.x - mid.x, dy = s.y - mid.y
          l.x += -dx * k * Math.cos(l.yaw) + dy * k * -Math.sin(l.yaw)
          l.z += -dx * k * -Math.sin(l.yaw) + dy * k * -Math.cos(l.yaw)
          pinch = s.d
          mid = { x: s.x, y: s.y }
          return
        }
      }
      if (e.buttons === 0) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      const l = this.look
      if (e.shiftKey || (e.buttons & 2) !== 0) {
        // walk the focus across the ground, in the camera's own frame, faster the further out it is
        const k = l.dist * 0.0022
        const rx = Math.cos(l.yaw)
        const rz = -Math.sin(l.yaw)
        const fx = -Math.sin(l.yaw)
        const fz = -Math.cos(l.yaw)
        l.x += -dx * k * rx + dy * k * fx
        l.z += -dx * k * rz + dy * k * fz
      } else {
        l.yaw -= dx * 0.005
        l.pitch = Math.max(0.02, Math.min(1.5, l.pitch + dy * 0.005))
      }
    })
    canvas.addEventListener('wheel', (e) => {
      if (!this.active) return
      this.look.dist = Math.max(2, Math.min(600, this.look.dist * Math.exp(e.deltaY * 0.0012)))
      e.preventDefault()
    }, { passive: false })
    canvas.addEventListener('contextmenu', (e) => { if (this.active) e.preventDefault() })
  }

  /** Fly the focus with the keyboard: along the view, across it, and up and down. */
  /** a key held from an on-screen button (the touch pad, `LookPad`) */
  press(code: string, down: boolean): void { if (down && this.active) this.held.add(code); else this.held.delete(code) }

  tick(dt: number, shift = this.held.has('ShiftLeft') || this.held.has('ShiftRight')): void {
    if (!this.active || this.held.size === 0) return
    const l = this.look
    // faster the further out the camera is, so crossing a district and nudging past a doorway both work
    const v = (shift ? 4 : 1) * Math.max(6, l.dist * 1.2) * dt
    const fx = -Math.sin(l.yaw)
    const fz = -Math.cos(l.yaw)
    const k = (c: string): number => (this.held.has(c) ? 1 : 0)
    const ahead = k('KeyW') - k('KeyS')
    const right = k('KeyD') - k('KeyA')
    // right of the view is (fz, −fx): x east, z north, so facing north (0, 1) puts east (1, 0) on the right
    l.x += (fx * ahead + fz * right) * v
    l.z += (fz * ahead - fx * right) * v
    this.lift = Math.max(-1, this.lift + (k('KeyE') - k('KeyQ')) * v)
  }

  /** Where the camera sits for the current look. */
  eye(): { x: number; y: number; z: number } {
    const l = this.look
    const c = Math.cos(l.pitch)
    return { x: l.x + l.dist * c * Math.sin(l.yaw), y: l.y + l.dist * Math.sin(l.pitch), z: l.z + l.dist * c * Math.cos(l.yaw) }
  }
}

export class DebugPanel {
  private readonly toastEl: HTMLDivElement
  private readonly freezeBtn: HTMLButtonElement
  private timer = 0

  constructor(onFreeze: () => void, onCopy: () => void, onGo?: () => void, onPaths?: () => void) {
    const panel = document.createElement('div')
    panel.style.cssText = 'position:fixed;left:14px;top:14px;display:flex;gap:6px;z-index:5;'
      + 'font:600 13px var(--font)'
    const button = (text: string, title: string, act: () => void): HTMLButtonElement => {
      const b = document.createElement('button')
      b.textContent = text
      b.title = title
      b.style.cssText = 'background:var(--panel);color:var(--text);border:1px solid var(--border);'
        + 'border-radius:var(--radius-sm);padding:7px 12px;cursor:pointer;font:inherit;box-shadow:var(--shadow)'
      b.addEventListener('click', (e) => { act(); (e.currentTarget as HTMLElement).blur() })
      panel.appendChild(b)
      return b
    }
    this.freezeBtn = button('⏸ pause (P)', 'Stop the rider and look around', onFreeze)
    button('⧉ copy location (C)', 'Copy lat, lon of what the camera is looking at', onCopy)
    if (onGo) button('⌖ go to (G)', 'Ride from a "lat, lon" — or just paste one anywhere', onGo)
    if (onPaths) button('⌇ paths (J)', 'Show the paths the rider can take and the junctions where there is a choice', onPaths)
    // keyboard commands for the advanced (owner, 2026-10-01): F C G J; the buttons only with `?buttons=1`
    if (new URLSearchParams(location.search).get('buttons') === '1') document.body.appendChild(panel)
    // a phone has no P: looking round (Menu → Look around) shows a ▶ to ride on again, beside the ☰ (ui/menu.ts)
    if (touchScreen()) {
      const pause = document.createElement('button')
      pause.textContent = '▶'
      pause.title = 'Ride on'
      pause.hidden = true
      pause.style.cssText = 'position:fixed;right:72px;top:14px;z-index:9;width:48px;height:48px;border-radius:999px;'
        + 'background:var(--panel);color:var(--text);border:1px solid var(--border);font:600 20px var(--font);box-shadow:var(--shadow)'
      pause.addEventListener('click', () => { onFreeze(); pause.blur() })
      document.body.appendChild(pause)
      this.pauseBtn = pause
    }

    this.toastEl = document.createElement('div')
    this.toastEl.style.cssText = 'position:fixed;left:14px;top:66px;max-width:calc(100vw - 28px);z-index:5;padding:6px 10px;border-radius:6px;'
      + 'background:var(--panel);color:var(--text);font:600 13px var(--font);border:1px solid var(--border);'
      + 'opacity:0;transition:opacity .2s;pointer-events:none;white-space:pre-wrap'
    document.body.appendChild(this.toastEl)

    addEventListener('keydown', (e) => {
      if (e.repeat) return
      if (e.code === 'KeyP' || e.code === 'KeyF') onFreeze()
      if (e.code === 'KeyC') onCopy()
      if (e.code === 'KeyG' && onGo) onGo()
      if (e.code === 'KeyJ' && onPaths) onPaths()
    })
  }

  private pauseBtn: HTMLButtonElement | null = null

  frozen(on: boolean): void {
    this.freezeBtn.textContent = on ? '▶ ride on (P)' : '⏸ pause (P)'
    if (this.pauseBtn) this.pauseBtn.hidden = !on
    this.toast(on
      ? (touchScreen() ? 'paused — arrows to move, drag to turn, pinch to zoom; ▶ to ride on'
        : 'paused — look around with W A S D, Q/E down and up, drag to orbit, wheel to zoom, shift = fast; P to ride on')
      : 'riding')
  }

  toast(text: string): void {
    this.toastEl.textContent = text
    this.toastEl.style.opacity = '1'
    clearTimeout(this.timer)
    this.timer = window.setTimeout(() => { this.toastEl.style.opacity = '0' }, 3200)
  }
}

/** The clipboard, with the old-fashioned fallback for a page that is not allowed the modern one. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const t = document.createElement('textarea')
    t.value = text
    document.body.appendChild(t)
    t.select()
    const ok = document.execCommand('copy')
    t.remove()
    return ok
  }
}

/**
 * The look-around arrows on a touch screen (owner, 2026-10-03: "show arrow buttons (on mobile) to look around"): held,
 * they are W A S D and Q/E for the paused camera (`OrbitLook`).
 */
export class LookPad {
  private readonly el: HTMLDivElement
  constructor(orbit: OrbitLook) {
    this.el = document.createElement('div')
    this.el.style.cssText = 'position:fixed;left:12px;bottom:150px;z-index:9;display:grid;grid-template-columns:repeat(3,56px);'
      + 'grid-template-rows:repeat(3,56px);gap:8px;touch-action:none'
    const keys: [string, string, string][] = [['', '', ''], ['▲', 'KeyW', '2/1'], ['', '', ''], ['◀', 'KeyA', '1/2'], ['', '', ''], ['▶', 'KeyD', '3/2'],
      ['⤓', 'KeyQ', '1/3'], ['▼', 'KeyS', '2/3'], ['⤒', 'KeyE', '3/3']]
    for (const [label, code, at] of keys) {
      if (!code) continue
      const b = document.createElement('button')
      b.textContent = label
      const [c, r] = at.split('/')
      b.style.cssText = `grid-column:${c};grid-row:${r};border-radius:12px;background:var(--panel);color:var(--text);`
        + 'border:1px solid var(--border);font:600 20px var(--font);box-shadow:var(--shadow);touch-action:none'
      const down = (e: Event): void => { e.preventDefault(); orbit.press(code, true) }
      const up = (): void => orbit.press(code, false)
      b.addEventListener('pointerdown', down)
      b.addEventListener('pointerup', up)
      b.addEventListener('pointerleave', up)
      b.addEventListener('pointercancel', up)
      this.el.appendChild(b)
    }
    // (`display`, not `hidden`: the inline display:grid overrode the attribute, and the pad stood over the steering
    // buttons all the time — the owner's "4-way keypad and left/right overlapping", 2026-10-04)
    this.el.style.display = 'none'
    document.body.appendChild(this.el)
  }
  show(on: boolean): void {
    this.el.style.display = on ? 'grid' : 'none'
    // the riding pads give way to it: they stood in the same corner, on top, and took its taps (owner, 2026-10-04:
    // "it displays both 4-way keypad and left/right overlapping … no way to move around the camera when paused")
    document.documentElement.classList.toggle('sr-looking', on)
  }
}
