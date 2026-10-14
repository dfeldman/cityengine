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
  /**
   * THE SPEEDOMETER (owner, 2026-10-04: "there is no display of speed and miles traveled (which are only small on the
   * desktop UI, could be more prominent)"): the speed big, its unit, and the distance under it, in the corner the
   * minimap leaves free — bottom right on a desktop, top right on a phone (where there is no minimap). Miles and mph
   * in a region that measures in them (Region `units`).
   */
  private readonly speedoEl: HTMLElement
  private imperial = false
  /** miles and mph (the United States), or kilometres and km/h */
  setUnits(units: 'imperial' | 'metric' | undefined): void { this.imperial = units === 'imperial' }

  constructor(root: HTMLElement, onBack?: () => void) {
    this.root = root
    root.innerHTML = `
      <div class="sr-gps" hidden></div>
      <div class="sr-transit" hidden></div>
      <div class="sr-action" hidden></div>
      <div class="sr-action sr-observe" hidden></div>
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
    this.speedoEl = document.createElement('div')
    this.speedoEl.className = 'sr-speedo'
    this.speedoEl.innerHTML = '<b>0</b><i>km/h</i><span></span><em></em>'
    document.body.appendChild(this.speedoEl)
    this.transitEl = root.querySelector('.sr-transit')!
    // (tappable: on a phone the transit line is the button — board, get off — owner, 2026-10-03)
    this.transitEl.addEventListener('click', () => this.onTransitTap?.())
    this.actionEl = root.querySelector('.sr-action')!
    this.actionEl.addEventListener('click', () => this.actionTap?.())
    this.observeEl = root.querySelector('.sr-observe')!
    this.observeEl.addEventListener('click', () => this.observeTap?.())
    this.exitsEl = root.querySelector('.sr-exits')!
    this.exitsEl.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-edge]')
      if (b && this.onExit) { this.onExit(Number(b.dataset.edge)); b.blur() }
    })
    addEventListener('keydown', (e) => {
      // not while typing somewhere (the go-to box takes coordinates)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
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

  private readonly transitEl: HTMLElement
  /** a tap on the transit line: the same as B */
  onTransitTap: (() => void) | null = null
  private readonly actionEl: HTMLElement
  private readonly observeEl: HTMLElement
  private observeTap: (() => void) | null = null
  /** the "observe from the top" prompt by a tall landmark (game.ts), its own pill beside the action one */
  observe(text: string | null, tap?: () => void): void {
    this.observeEl.hidden = text === null
    this.observeTap = tap ?? null
    if (text !== null && this.observeEl.textContent !== text) this.observeEl.textContent = text
  }
  private actionTap: (() => void) | null = null
  /** A button for what can be done right now that has no other control on a phone (eat the order); null hides it. */
  action(text: string | null, tap?: () => void): void {
    this.actionEl.hidden = text === null
    this.actionTap = tap ?? null
    if (text !== null && this.actionEl.textContent !== text) this.actionEl.textContent = text
  }
  /**
   * The transit line (src/sim/transit.ts): a cable car standing at the stop you are near, or the fact that
   * you are on one. Its own line, above the GPS — it is not a turn and it is not a destination.
   */
  transit(text: string | null): void {
    this.transitEl.hidden = text === null
    if (text !== null && this.transitEl.textContent !== text) this.transitEl.textContent = text
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
    // a runner thinks in pace, minutes a kilometre; a rider in watts
    const pace = stats.speed > 0.5 ? (() => { const t = Math.round(1000 / stats.speed); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')} /km` })() : '—:— /km'
    this.statsEl.textContent =
      `${kmh} km/h   ${stats.device === 'bike' ? power : pace}   ${(stats.distance / 1000).toFixed(2)} km`
    // the speedometer: the speed, its unit, and how far the ride has come
    const v = this.imperial ? stats.speed * 2.23694 : stats.speed * 3.6
    const far = this.imperial ? `${(stats.distance / 1609.344).toFixed(2)} mi` : `${(stats.distance / 1000).toFixed(2)} km`
    const [num, unit, dist, watts] = this.speedoEl.children as unknown as HTMLElement[]
    const vs = v < 10 ? v.toFixed(1) : String(Math.round(v))
    if (num.textContent !== vs) num.textContent = vs
    const us = this.imperial ? 'mph' : 'km/h'
    if (unit.textContent !== us) unit.textContent = us
    if (dist.textContent !== far) dist.textContent = far
    // (its own element: a phone's one-line speedometer shows the watts and not the distance)
    const ws = stats.device === 'bike' && stats.power !== null ? `${Math.round(stats.power)} W` : ''
    if (watts.textContent !== ws) watts.textContent = ws

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
/* couch mode's energy bar (sim/energy.ts), bottom left above the attribution: lime, amber when low, red when spent */
.sr-energy { position: fixed; left: 16px; bottom: 72px; z-index: 6; display: flex; align-items: center; gap: 8px;
  font: 700 12px/1 var(--font); color: var(--text); letter-spacing: .06em; text-transform: uppercase;
  background: var(--panel); border: 1px solid var(--border); border-radius: 999px; padding: 7px 12px; box-shadow: var(--shadow);
  pointer-events: none }
.sr-energy .track { width: 160px; height: 10px; border-radius: 999px; background: rgba(255,255,255,.12); overflow: hidden }
.sr-energy .fill { display: block; height: 100%; width: 100%; background: var(--c-lime); border-radius: 999px; transition: width .2s linear }
.sr-energy.low .fill { background: var(--c-amber) }
.sr-energy.bonk .fill { background: var(--c-red) }
.sr-energy.bonk .label::after { content: ' · spent'; color: var(--c-red) }
/*
 * The bottom of the screen has TWO things in it: this, centred, and the attribution label in the corner.
 * They are both pinned to the same edge, so the stats line and the ODbL credit were drawing on top of one
 * another in every screenshot. The padding here reserves the label's band rather than the two guessing.
 */
#hud { position: fixed; left: 0; right: 0; bottom: 0; padding: 18px 22px 46px;
  font: 600 15px/1.4 var(--font); color: var(--text); font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 4px rgba(0,0,0,.8); pointer-events: none; display: flex;
  flex-direction: column; align-items: center; gap: 4px; }
#hud .sr-turns { font-size: 40px; letter-spacing: 16px; line-height: 1; display: flex; gap: 4px }
#hud .sr-arrow { transition: opacity .12s, color .12s, transform .12s; opacity: .22 }
#hud .sr-arrow.on { opacity: .62 }
#hud .sr-arrow.picked { opacity: 1; color: var(--c-amber); transform: translateY(-2px) }
#hud .sr-arrow.locked { color: var(--c-lime) }
#hud .sr-back { position: absolute; left: calc(50% - 150px); top: 18px; pointer-events: auto; cursor: pointer;
  font: 26px/1 var(--font); color: var(--text); opacity: .7;
  background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 11px;
  text-shadow: inherit; transition: opacity .12s }
#hud .sr-back:hover { opacity: 1 }
#hud .sr-next { font-size: 15px; opacity: .9; min-height: 1.4em }
#hud .sr-exits { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; max-width: 760px; pointer-events: auto }
/* (display: flex beats the hidden attribute: a star junction's buttons stayed on screen long after it, all the way
   through the Stockton Tunnel, 2026-09-29) */
#hud .sr-exits[hidden] { display: none }
#hud .sr-exits button { font: 600 14px/1.2 var(--font); color: var(--text); cursor: pointer; min-height: 36px;
  background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 12px; text-shadow: none; box-shadow: var(--shadow) }
#hud .sr-exits button.picked { background: var(--c-amber); color: var(--on-amber); border-color: var(--c-amber) }
#hud .sr-exit-arrow { display: inline-block; font-size: 15px }
#hud .sr-gps { font: 700 15px/1.3 var(--font); color: var(--on-page); background: var(--page); border-radius: 999px; padding: 6px 16px; text-shadow: none; box-shadow: var(--shadow) }
#hud .sr-gps:not([hidden]) + .sr-back { top: 50px }
#hud .sr-transit { align-self: center; font: 700 15px/1.3 var(--font); color: var(--on-amber); background: var(--c-amber);
  border-radius: 999px; padding: 6px 16px; text-shadow: none; box-shadow: var(--shadow); cursor: pointer; pointer-events: auto }
#hud .sr-action { align-self: center; font: 700 15px/1.3 var(--font); color: var(--text); background: var(--panel);
  border: 2px solid var(--c-amber); border-radius: 999px; padding: 6px 16px; text-shadow: none; box-shadow: var(--shadow);
  cursor: pointer; pointer-events: auto }
.sr-banner { position: fixed; top: 226px; left: 50%; transform: translate(-50%, -12px); z-index: 6; opacity: 0;
  pointer-events: none; transition: opacity .35s, transform .35s; text-align: center; color: var(--text);
  background: var(--panel); border: 2px solid var(--page); border-radius: var(--radius); padding: 14px 30px;
  font: 800 24px/1.25 var(--font); box-shadow: var(--shadow); backdrop-filter: blur(8px) }
.sr-banner.on { opacity: 1; transform: translate(-50%, 0) }
.sr-banner-sub { font: 600 15px/1.4 var(--font); color: var(--muted); margin-top: 4px }
#hud .sr-stats { font-size: 13px; opacity: .72; letter-spacing: .4px }
.sr-speedo { position: fixed; right: 18px; bottom: 24px; z-index: 6; pointer-events: none; min-width: 112px; text-align: center;
  color: var(--text); background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 8px 14px 9px;
  box-shadow: var(--shadow); backdrop-filter: blur(6px) }
.sr-speedo b { display: block; font: 800 44px/1 var(--font); font-variant-numeric: tabular-nums; letter-spacing: -1px }
.sr-speedo i { display: block; font: 700 12px/1.2 var(--font); font-style: normal; opacity: .7; letter-spacing: .08em; text-transform: uppercase }
.sr-speedo span, .sr-speedo em { display: inline-block; margin-top: 4px; font: 700 15px/1.2 var(--font); font-style: normal;
  font-variant-numeric: tabular-nums }
.sr-speedo em:not(:empty)::before { content: ' · ' }
/*
 * A phone: one line, top centre, in the band between the 🗺 and ⏸ buttons (owner, 2026-10-14, a screenshot of the
 * job line running under the speedometer): the speed and the watts; the distance is left out.
 */
.sr-compact .sr-speedo { right: auto; left: 50%; transform: translateX(-50%); bottom: auto; top: 14px; min-width: 0;
  padding: 6px 14px; display: flex; align-items: baseline; gap: 5px; white-space: nowrap }
.sr-compact .sr-speedo b { font-size: 28px; letter-spacing: -.5px }
.sr-compact .sr-speedo i { font-size: 11px }
.sr-compact .sr-speedo span { display: none }
.sr-compact .sr-speedo em { margin: 0; font-size: 14px }
/* stopped to look round, a phone has no room for it over the paused note */
.sr-compact.sr-looking .sr-speedo { display: none }
`
