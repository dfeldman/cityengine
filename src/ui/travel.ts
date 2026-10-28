/**
 * The travel card (game/stations.ts): at a ferry terminal or a Metro stop, a pill offers the trip ("T, or tap"); opened,
 * "Where do you want to go?" and the line's destinations, numbered, with the fare. Picked, the screen fades to black,
 * the rider is moved, and it fades back. While the card is open its number keys are its own (the junction exits'
 * number keys are held off: capture phase).
 */
import type { Station } from '../game/stations.ts'

const CSS = `
.sr-travel-pill { position: fixed; z-index: 7; left: 50%; bottom: 150px; transform: translateX(-50%);
  padding: 8px 16px; border-radius: 999px; background: rgba(14,20,34,.88); color: #fff; font: 600 14px/1.2 system-ui, sans-serif;
  border: 1px solid rgba(255,255,255,.25); cursor: pointer; }
.sr-travel { position: fixed; z-index: 30; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,.35) }
.sr-travel .card { min-width: 320px; max-width: 92vw; background: #101827; color: #fff; border-radius: 16px; padding: 18px 20px;
  font: 15px/1.35 system-ui, sans-serif; box-shadow: 0 10px 40px rgba(0,0,0,.5) }
.sr-travel h2 { margin: 0 0 4px; font-size: 19px }
.sr-travel .sub { opacity: .7; margin-bottom: 12px; font-size: 13px }
.sr-travel button { display: flex; width: 100%; justify-content: space-between; gap: 12px; margin: 6px 0; padding: 10px 12px;
  border-radius: 10px; border: 1px solid rgba(255,255,255,.18); background: #1b2740; color: #fff; font: inherit; cursor: pointer }
.sr-travel button:hover { background: #24345a }
.sr-travel .k { opacity: .6; margin-right: 8px }
.sr-travel .x { background: transparent; justify-content: center; opacity: .75 }
.sr-fade { position: fixed; z-index: 40; inset: 0; background: #000; opacity: 0; pointer-events: none; transition: opacity .6s }
.sr-fade.on { opacity: 1 }
`

export class TravelCard {
  private pill: HTMLElement | null = null
  private panel: HTMLElement | null = null
  private here: Station | null = null
  private list: Station[] = []
  private fare = 0
  /** picked: where to */
  onGo: ((to: Station, fare: number) => void) | null = null

  constructor() {
    const st = document.createElement('style')
    st.textContent = CSS
    document.head.appendChild(st)
    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return
      if (this.panel) {
        const n = Number(e.key)
        if (e.code === 'Escape' || e.code === 'KeyT') { this.close(); e.stopImmediatePropagation(); e.preventDefault(); return }
        if (Number.isInteger(n) && n >= 1 && n <= this.list.length) { this.pick(this.list[n - 1]); e.stopImmediatePropagation(); e.preventDefault() }
        return
      }
      if (e.code === 'KeyT' && this.here) { this.open(); e.preventDefault() }
    }, { capture: true })
  }

  get isOpen(): boolean { return this.panel !== null }

  /** Each frame: the station the rider is at (null: none), its destinations and fare. */
  at(here: Station | null, list: Station[], fare: number): void {
    if (here === this.here) return
    // (an open card stays open as the rider rolls on past the stop: it is answered or dismissed, never snatched away)
    if (!here && this.panel) return
    this.here = here
    this.list = list
    this.fare = fare
    this.pill?.remove()
    this.pill = null
    if (!here) return
    this.pill = document.createElement('div')
    this.pill.className = 'sr-travel-pill'
    this.pill.textContent = `${here.line === 'ferry' ? '⛴' : 'Ⓜ'} ${here.name} — T (or tap) to travel`
    this.pill.addEventListener('click', () => this.open())
    document.body.appendChild(this.pill)
  }

  open(): void {
    if (!this.here || this.panel) return
    const root = document.createElement('div')
    root.className = 'sr-travel'
    const kind = this.here.line === 'ferry' ? 'Ferry' : 'Muni Metro'
    // a free ride says "free", not "$0.00" (and all travel is free: game/stations.ts FARES)
    const price = this.fare > 0 ? `$${this.fare.toFixed(2)}` : 'free'
    root.innerHTML = `<div class="card"><h2>Where do you want to go?</h2>
      <div class="sub">${kind} from ${this.here.name} · ${price}</div>
      ${this.list.map((s, i) => `<button data-i="${i}"><span><span class="k">${i + 1}</span>${s.name}</span><span>${price}</span></button>`).join('')}
      <button class="x">Stay here (Esc)</button></div>`
    root.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('button')
      if (!b) { if (e.target === root) this.close(); return }
      if (b.classList.contains('x')) this.close()
      else this.pick(this.list[Number(b.dataset.i)])
    })
    document.body.appendChild(root)
    this.panel = root
  }

  close(): void {
    this.panel?.remove()
    this.panel = null
    // (closed away from any stop: the next frame's `at` decides afresh)
    if (!this.pill) this.here = null
  }

  private pick(to: Station): void {
    this.close()
    const fade = document.createElement('div')
    fade.className = 'sr-fade'
    document.body.appendChild(fade)
    requestAnimationFrame(() => fade.classList.add('on'))
    setTimeout(() => {
      this.onGo?.(to, this.fare)
      setTimeout(() => { fade.classList.remove('on'); setTimeout(() => fade.remove(), 700) }, 900)
    }, 650)
  }
}
