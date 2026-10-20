/**
 * THE END SCREEN (#303, owner 2026-10-17: "some kind of End screen where it shows how far you've traveled, each of your
 * deliveries and star rating and dollars"). Shown when a Dandyhorse session completes — the workout's time is up, or
 * End was pressed on a bridge — over the city, in the game's own card look (theme.ts `sr-card`, the receipt's stars).
 *
 * The platform keeps the game on screen while it is up (dandyhorse PLAN.md §6.4.1, `capabilities.endScreen`): Done on
 * any bridge closes it, and so does Done here (the button, Enter, Space or Escape), or the platform's timeout. What
 * closes it is src/platform.ts's business; this only draws it and says when the player pressed Done.
 */

/** One job of the session, as the end screen lists it. */
export interface EndDelivery {
  emoji: string
  /** what was carried: "Mission burrito" */
  what: string
  from: string
  to: string
  /** 1–5; 0 for a job that was never delivered */
  stars: number
  /** fee and tip */
  dollars: number
  seconds: number
  outcome: 'delivered' | 'eaten' | 'spoiled' | 'forfeit'
}

export interface EndRecord {
  /** metres ridden in the city this session */
  travelled: number
  /** seconds of riding (pauses not counted) */
  seconds: number
  deliveries: EndDelivery[]
  /** cars and walkers bumped this session (dandyhorse PLAN.md §18.2: the `collisions` stat) */
  collisions?: number
  imperial: boolean
  /** the city's name, for the subtitle */
  place?: string
}

export const END_CSS = `
.sr-standing { margin: 10px 0 0; font-weight: 800; letter-spacing: .01em; }
.sr-end { position: fixed; inset: 0; z-index: 40; display: none; align-items: center; justify-content: center;
  background: rgba(6, 10, 24, .55); backdrop-filter: blur(3px); font: 600 15px/1.35 var(--font); }
.sr-end.on { display: flex; }
.sr-end .sr-card { width: min(640px, calc(100vw - 32px)); max-height: calc(100vh - 48px); overflow: auto; padding: 24px 28px 20px;
  text-align: center; }
.sr-end h1 { margin: 10px 0 2px; font: 800 30px/1.1 var(--font); }
.sr-end .sub { opacity: .75; margin-bottom: 14px; }
.sr-end .totals { display: flex; justify-content: center; gap: 22px; flex-wrap: wrap; margin: 6px 0 16px; }
.sr-end .totals div { display: flex; flex-direction: column; align-items: center; }
.sr-end .totals b { font: 800 26px/1.1 var(--font); font-variant-numeric: tabular-nums; }
.sr-end .totals b.cash { color: #34d27a; }
.sr-end .totals small { font: 700 11px/1.2 var(--font); text-transform: uppercase; letter-spacing: .06em; opacity: .7; margin-top: 4px; }
.sr-end ol { list-style: none; margin: 0 0 14px; padding: 0; text-align: left; display: flex; flex-direction: column; gap: 6px; }
.sr-end li { display: grid; grid-template-columns: 34px 1fr auto auto; gap: 4px 12px; align-items: center; padding: 8px 10px;
  border-radius: var(--radius-sm); background: color-mix(in srgb, var(--text) 6%, transparent); }
.sr-end li .emoji { font-size: 26px; line-height: 1; text-align: center; }
.sr-end li .what b { display: block; font: 800 15px/1.2 var(--font); }
.sr-end li .what span { display: block; font: 500 12px/1.3 var(--font); opacity: .75; }
.sr-end li .stars { color: #ffc93c; letter-spacing: 2px; white-space: nowrap; font-size: 16px; }
.sr-end li .stars i { color: var(--text); opacity: .25; font-style: normal; }
.sr-end li .pay { font: 800 16px/1 var(--font); color: #34d27a; min-width: 64px; text-align: right; font-variant-numeric: tabular-nums; }
.sr-end li.miss .pay { color: var(--muted); }
.sr-end .none { opacity: .7; margin: 4px 0 16px; }
.sr-end .done { font: 800 17px/1 var(--font); color: var(--on-page); background: var(--page); border: 0; border-radius: 999px;
  padding: 13px 34px; min-height: var(--tap); cursor: pointer; }
.sr-end .done:focus-visible { outline: 3px solid var(--text); outline-offset: 3px; }
.sr-end .hint { margin-top: 10px; font-size: 12px; opacity: .65; }
`

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export const distanceWords = (m: number, imperial: boolean): string =>
  imperial ? `${(m / 1609.344).toFixed(2)} mi` : `${(m / 1000).toFixed(2)} km`

export const clockWords = (s: number): string => {
  const t = Math.max(0, Math.round(s))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const ss = String(t % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

const MISSED: Record<EndDelivery['outcome'], string> = { delivered: '', eaten: 'eaten on the way', spoiled: 'did not survive', forfeit: 'forfeit' }

/** The totals and the list, as HTML (exported for the tests). */
export function endScreenHtml(r: EndRecord): string {
  const done = r.deliveries.filter((d) => d.outcome === 'delivered')
  const earned = r.deliveries.reduce((a, d) => a + d.dollars, 0)
  const rated = done.filter((d) => d.stars > 0)
  const avg = rated.length ? rated.reduce((a, d) => a + d.stars, 0) / rated.length : 0
  const stars = (n: number): string => `${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i>`
  const rows = r.deliveries.map((d) => `<li class="${d.outcome === 'delivered' ? '' : 'miss'}">
      <span class="emoji">${esc(d.emoji)}</span>
      <span class="what"><b>${esc(d.what.charAt(0).toUpperCase() + d.what.slice(1))}</b><span>${esc(d.from)} → ${esc(d.to)}${d.outcome === 'delivered' ? '' : ` · ${MISSED[d.outcome]}`}</span></span>
      <span class="stars">${d.stars > 0 ? stars(d.stars) : ''}</span>
      <span class="pay">$${d.dollars.toFixed(2)}</span></li>`).join('')
  return `<span class="sr-pill">Session complete</span>
    <h1>Ride over</h1>
    <div class="sub">Cycle Dash${r.place ? ` · ${esc(r.place)}` : ''}</div>
    <div class="totals">
      <div><b>${distanceWords(r.travelled, r.imperial)}</b><small>ridden</small></div>
      <div><b>${clockWords(r.seconds)}</b><small>riding time</small></div>
      <div><b>${done.length}</b><small>${done.length === 1 ? 'delivery' : 'deliveries'}</small></div>
      ${rated.length ? `<div><b>${avg.toFixed(1)} ★</b><small>average</small></div>` : ''}
      <div><b class="cash">$${earned.toFixed(2)}</b><small>earned</small></div>
    </div>
    ${r.deliveries.length ? `<ol>${rows}</ol>` : '<div class="none">No deliveries this time — just the ride.</div>'}
    <button class="done" type="button">✓ Done</button>
    <div class="hint"><span class="keys">Enter or Esc · </span>or Done on your phone<span class="left"></span></div>`
}

export class EndScreen {
  private readonly root: HTMLElement
  private readonly card: HTMLElement
  private onDone: (() => void) | null = null
  private until = 0
  private ticker: ReturnType<typeof setInterval> | null = null

  constructor() {
    if (!document.getElementById('sr-end-css')) {
      const style = document.createElement('style')
      style.id = 'sr-end-css'
      style.textContent = END_CSS
      document.head.appendChild(style)
    }
    this.root = document.createElement('div')
    this.root.className = 'sr-end'
    this.root.setAttribute('role', 'dialog')
    this.root.setAttribute('aria-label', 'Session complete')
    this.card = document.createElement('div')
    this.card.className = 'sr-card'
    this.root.appendChild(this.card)
    document.body.appendChild(this.root)
    /*
     * Made before the game (src/platform.ts's constructor), so this listener runs before the game's own: while the end
     * screen is up, Enter, Space and Escape are Done, and nothing else reaches the ride (Escape would open its menu).
     */
    addEventListener('keydown', (e) => {
      if (!this.isOpen) return
      e.stopImmediatePropagation()
      e.preventDefault()
      if (!e.repeat && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space' || e.code === 'Escape')) this.done()
    }, true)
  }

  get isOpen(): boolean { return this.root.classList.contains('on') }

  /** Show it. `onDone`: the player pressed Done here. `seconds`: how long the platform will hold it, for the hint. */
  show(r: EndRecord, onDone: () => void, seconds?: number): void {
    this.card.innerHTML = endScreenHtml(r)
    this.onDone = onDone
    this.card.querySelector('.done')?.addEventListener('click', () => this.done())
    this.root.classList.add('on')
    this.setSeconds(seconds ?? null)
    ;(this.card.querySelector('.done') as HTMLButtonElement | null)?.focus({ preventScroll: true })
  }

  /**
   * Where this ride stands among recent rides by people at the same level (dandyhorse PLAN.md §18.3).
   * It arrives after the card is already up — the platform has to work it out — so it is added rather than
   * rendered with the rest, and a ride with nobody to compare against simply never gets it.
   */
  addStanding(rank: number, of: number, beaten: number): void {
    if (of < 2 || !this.root.classList.contains('on')) return
    if (this.card.querySelector('.sr-standing')) return
    const p = document.createElement('p')
    p.className = 'sr-standing'
    const ordinal = (n: number): string => {
      const rem = n % 100
      if (rem >= 11 && rem <= 13) return `${n}th`
      return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
    }
    p.textContent = `${ordinal(rank)} of ${of} recent rides at your level`
      + (beaten > 0 ? `, ahead of ${beaten} of them.` : '.')
    const done = this.card.querySelector('.done')
    if (done?.parentElement) done.parentElement.insertBefore(p, done)
    else this.card.appendChild(p)
  }

  /** the platform's own countdown, as it learns it */
  setSeconds(seconds: number | null): void {
    if (this.ticker) clearInterval(this.ticker)
    this.ticker = null
    const left = this.card.querySelector('.left')
    if (seconds === null || !left) { if (left) left.textContent = ''; return }
    this.until = Date.now() + seconds * 1000
    const tick = (): void => { left.textContent = ` · closes in ${Math.max(0, Math.ceil((this.until - Date.now()) / 1000))} s` }
    tick()
    this.ticker = setInterval(tick, 1000)
  }

  hide(): void {
    this.root.classList.remove('on')
    this.onDone = null
    if (this.ticker) clearInterval(this.ticker)
    this.ticker = null
  }

  private done(): void {
    const f = this.onDone
    this.hide()
    f?.()
  }
}
