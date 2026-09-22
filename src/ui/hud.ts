/**
 * The HUD, whose one job beyond the numbers is **the turn indicator**.
 *
 * Because steering is a declared intention rather than a twitch (see `src/sim/navigate.ts`), the rider needs
 * to know three things at a glance and know them early: which turns the junction ahead actually offers, which
 * one they have asked for, and whether it is still changeable. Without the third they cannot tell a press
 * that worked from one that arrived too late, and the steering feels broken even when it is correct.
 *
 *      ← ↑ →     an arrow is dim when the junction does not offer it, bright when it is the choice,
 *                and the whole row goes solid once the choice has committed
 */
import type { Junction } from '../sim/navigate.ts'
import type { Turn } from '../city/graph.ts'

const ARROW: Record<Turn, string> = { left: '←', straight: '↑', right: '→' }

export class Hud {
  private readonly root: HTMLElement
  private readonly turnsEl: HTMLElement
  private readonly nextEl: HTMLElement
  private readonly statsEl: HTMLElement
  private readonly gpsEl: HTMLElement

  constructor(root: HTMLElement, onBack?: () => void) {
    this.root = root
    root.innerHTML = `
      <div class="sr-gps" hidden></div>
      <button class="sr-back" title="Turn around here (U)">↩</button>
      <div class="sr-turns"></div>
      <div class="sr-exits" hidden></div>
      <div class="sr-next"></div>
      <div class="sr-stats"></div>`
    // its own element, outside the arrows, which are rewritten every frame and would swallow the click
    const back = root.querySelector<HTMLButtonElement>('.sr-back')!
    if (onBack) back.addEventListener('click', () => { onBack(); back.blur() })
    else back.remove()
    this.turnsEl = root.querySelector('.sr-turns')!
    this.nextEl = root.querySelector('.sr-next')!
    this.statsEl = root.querySelector('.sr-stats')!
    this.gpsEl = root.querySelector('.sr-gps')!
    this.exitsEl = root.querySelector('.sr-exits')!
    this.exitsEl.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-edge]')
      if (b && this.onExit) { this.onExit(Number(b.dataset.edge)); b.blur() }
    })
    addEventListener('keydown', (e) => {
      const n = Number(e.key)
      if (!this.exitList.length || !Number.isInteger(n) || n < 1 || n > this.exitList.length || !this.onExit) return
      this.onExit(this.exitList[n - 1])
    })
  }

  private readonly exitsEl: HTMLElement
  private exitList: number[] = []
  private exitKey = ''
  /** a star junction's exit picked (by click, or its number key) */
  onExit: ((edgeId: number) => void) | null = null
  /**
   * Star junctions (BUGS.md #40): every exit by name, as a row of buttons — an arrow pointing its way and the
   * street — numbered 1…n for the keys. Hidden where left/straight/right already says it all.
   */
  exits(list: { edgeId: number; angle: number; name?: string }[] | null, picked: number | null): void {
    const show = !!list && list.length >= 4
    this.exitsEl.hidden = !show
    if (!show) { this.exitList = []; this.exitKey = ''; return }
    const key = list!.map((x) => x.edgeId).join(',') + '|' + picked
    if (key === this.exitKey) return
    this.exitKey = key
    // left to right as they leave the junction
    const sorted = [...list!].sort((a, b) => a.angle - b.angle)
    this.exitList = sorted.map((x) => x.edgeId)
    this.exitsEl.innerHTML = ''
    sorted.forEach((x, i) => {
      const b = document.createElement('button')
      b.dataset.edge = String(x.edgeId)
      b.className = x.edgeId === picked ? 'picked' : ''
      const deg = (x.angle * 180) / Math.PI
      const arrow = document.createElement('span')
      arrow.className = 'sr-exit-arrow'
      arrow.textContent = '↑'
      arrow.style.transform = `rotate(${deg.toFixed(0)}deg)`
      b.append(`${i + 1} `, arrow, ` ${x.name ?? 'on'}`)
      this.exitsEl.appendChild(b)
    })
  }

  private bannerEl: HTMLElement | null = null
  private bannerTimer = 0
  /**
   * A card across the top of the screen for the GPS's moments — a destination set, a stop reached, arrival:
   * a big title and a line under it, gone after a few seconds.
   */
  banner(title: string, sub = '', ms = 4500): void {
    if (!this.bannerEl) {
      this.bannerEl = document.createElement('div')
      this.bannerEl.className = 'sr-banner'
      document.body.appendChild(this.bannerEl)
    }
    const el = this.bannerEl
    el.innerHTML = ''
    const t = document.createElement('div')
    t.className = 'sr-banner-title'
    t.textContent = title
    el.appendChild(t)
    if (sub) {
      const u = document.createElement('div')
      u.className = 'sr-banner-sub'
      u.textContent = sub
      el.appendChild(u)
    }
    el.classList.add('on')
    clearTimeout(this.bannerTimer)
    this.bannerTimer = window.setTimeout(() => el.classList.remove('on'), ms)
  }

  /** The GPS line (PARIS_EXPAND §6 item 11): distance to the destination and the next turn; null hides it. */
  gps(text: string | null): void {
    this.gpsEl.hidden = text === null
    if (text !== null && this.gpsEl.textContent !== text) this.gpsEl.textContent = text
  }

  private landmark: string | null = null
  private noteText = ''
  private noteUntil = 0

  /** A short-lived line — "← nudge" — that says what the last press did. */
  note(text: string): void {
    this.noteText = text
    this.noteUntil = performance.now() + 1200
  }

  /** A landmark the rider is passing, named on the second line when no junction needs it (item K). */
  landmarkNear(name: string | null, side: 'left' | 'right' = 'right'): void {
    this.landmark = name ? (side === 'left' ? `← ${name}` : `${name} →`) : null
  }

  update(j: Junction | null, requested: Turn, committed: boolean, stats: {
    speed: number; power: number | null; distance: number; street?: string; device: string
  }): void {
    const kmh = (stats.speed * 3.6).toFixed(1)
    const power = stats.power === null ? '—' : `${Math.round(stats.power)} W`
    this.statsEl.textContent =
      `${kmh} km/h   ${stats.device === 'bike' ? power : ''}   ${(stats.distance / 1000).toFixed(2)} km`

    this.turnsEl.innerHTML = (['left', 'straight', 'right'] as Turn[]).map((t) => {
      const offered = j?.turns.has(t) ?? false
      const chosen = requested === t
      const cls = ['sr-arrow', offered ? 'on' : 'off', chosen ? 'picked' : '', committed && chosen ? 'locked' : '']
      return `<span class="${cls.filter(Boolean).join(' ')}">${ARROW[t]}</span>`
    }).join('')

    if (performance.now() < this.noteUntil) {
      this.nextEl.textContent = this.noteText
      return
    }
    // nothing to announce: no junction, or only the street going on under another name — or it is still a
    // way off, in which case a landmark being passed is the more useful thing to say
    if (!j || j.passThrough || (this.landmark && j.ahead > 60 && !committed)) {
      this.nextEl.textContent = this.landmark ?? ''
      this.root.classList.remove('committed')
      return
    }
    if (j.deadEnd) {
      // Say it early. A rider who is told "dead end in 40 m" can ease off; one who is spun round without
      // warning just thinks the game is broken.
      this.nextEl.textContent = `dead end · ${Math.round(j.ahead)} m · turning round`
      this.turnsEl.innerHTML = '<span class="sr-arrow on picked">↻</span>'
      this.root.classList.add('committed')
      return
    }
    const where = j.names[requested] ?? j.names.straight
    this.nextEl.textContent = committed
      ? `${ARROW[requested]} ${where ?? 'ahead'}`
      : `${Math.round(j.ahead)} m${where ? ` · ${where}` : ''}`
    this.root.classList.toggle('committed', committed)
  }
}

export const HUD_CSS = `
/*
 * The bottom of the screen has TWO things in it: this, centred, and the attribution label in the corner.
 * They are both pinned to the same edge, so the stats line and the ODbL credit were drawing on top of one
 * another in every screenshot. The padding here reserves the label's band rather than the two guessing.
 */
#hud { position: fixed; left: 0; right: 0; bottom: 0; padding: 18px 22px 46px;
  font: 14px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color: #f2efe9;
  text-shadow: 0 1px 4px rgba(0,0,0,.8); pointer-events: none; display: flex;
  flex-direction: column; align-items: center; gap: 4px; }
#hud .sr-turns { font-size: 40px; letter-spacing: 16px; line-height: 1; display: flex; gap: 4px }
#hud .sr-arrow { transition: opacity .12s, color .12s, transform .12s; opacity: .22 }
#hud .sr-arrow.on { opacity: .62 }
#hud .sr-arrow.picked { opacity: 1; color: #ffd479; transform: translateY(-2px) }
#hud .sr-arrow.locked { color: #8ef2a0 }
#hud .sr-back { position: absolute; left: calc(50% - 150px); top: 18px; pointer-events: auto; cursor: pointer;
  font: 26px/1 ui-monospace, SFMono-Regular, Menlo, monospace; color: #f2efe9; opacity: .55;
  background: rgba(18,20,24,.45); border: 1px solid rgba(255,255,255,.18); border-radius: 8px; padding: 4px 9px;
  text-shadow: inherit; transition: opacity .12s }
#hud .sr-back:hover { opacity: 1 }
#hud .sr-next { font-size: 15px; opacity: .9; min-height: 1.4em }
#hud .sr-exits { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; max-width: 760px; pointer-events: auto }
#hud .sr-exits button { font: 13px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; color: #f2efe9; cursor: pointer;
  background: rgba(18,20,24,.6); border: 1px solid rgba(255,255,255,.2); border-radius: 8px; padding: 4px 9px; text-shadow: inherit }
#hud .sr-exits button.picked { color: #ffd479; border-color: #ffd479 }
#hud .sr-exit-arrow { display: inline-block; font-size: 15px }
#hud .sr-gps { font-size: 14px; color: #ffc68a; background: rgba(18,20,24,.5); border-radius: 8px; padding: 2px 10px }
#hud .sr-gps:not([hidden]) + .sr-back { top: 50px }
.sr-banner { position: fixed; top: 132px; left: 50%; transform: translate(-50%, -12px); z-index: 6; opacity: 0;
  pointer-events: none; transition: opacity .35s, transform .35s; text-align: center; color: #f7f3ea;
  background: rgba(18,20,24,.78); border: 1px solid rgba(255,198,138,.45); border-radius: 14px; padding: 12px 26px;
  font: 600 22px/1.25 ui-sans-serif, Helvetica, Arial, sans-serif; box-shadow: 0 8px 30px rgba(0,0,0,.35) }
.sr-banner.on { opacity: 1; transform: translate(-50%, 0) }
.sr-banner-sub { font: 14px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color: #ffc68a; margin-top: 4px }
#hud .sr-stats { font-size: 13px; opacity: .72; letter-spacing: .4px }
`
