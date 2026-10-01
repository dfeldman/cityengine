/**
 * The delivery game's screen furniture (src/game/delivery.ts is the logic): the OFFER card — two stops, named by
 * their nearest intersection, with Take it (Y) and No thanks (X) and a bar running down to when it goes away by
 * itself — and, during a job, one line saying where to go next, the compass and the clock. No route: finding the
 * way is the game. Pickup is 1 and amber, drop-off is 2 and green, the same on every screen.
 */
import type { Job } from '../game/delivery.ts'

export const DELIVERY_CSS = `
.sr-offer { position: fixed; left: 16px; top: 50%; transform: translate(-24px, -50%); opacity: 0; z-index: 7;
  pointer-events: none; transition: opacity .3s, transform .3s; width: min(340px, calc(100vw - 32px));
  color: var(--text); background: var(--panel); border: 2px solid var(--page); border-radius: var(--radius);
  box-shadow: var(--shadow); backdrop-filter: blur(8px); padding: 14px 16px 12px; font: 600 14px/1.35 var(--font) }
.sr-offer.on { opacity: 1; transform: translate(0, -50%); pointer-events: auto }
.sr-offer h3 { margin: 0 0 8px; font: 800 18px/1.2 var(--font) }
.sr-offer .stop { display: flex; gap: 10px; align-items: baseline; margin: 6px 0 }
.sr-offer .n { flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
  font: 800 13px/1 var(--font); color: var(--on-amber); background: var(--c-amber) }
.sr-offer .stop + .stop .n { background: #34d27a; color: #111 }
.sr-offer .what { opacity: .7; font-size: 12px }
.sr-offer .far { opacity: .7; margin: 8px 0 10px; font-size: 13px }
/* what it is and where from (the kitchens, game/delivery.ts Source): the dish big, the joke small */
.sr-offer .dish { display: flex; gap: 10px; align-items: center; margin: 2px 0 8px }
.sr-offer .dish .emoji { font-size: 34px; line-height: 1 }
.sr-offer .dish b { display: block; font: 800 16px/1.2 var(--font) }
.sr-offer .dish i { display: block; font: italic 500 12px/1.3 var(--font); opacity: .8 }
.sr-offer .fragile { display: inline-block; margin-left: 6px; padding: 2px 7px; border-radius: 999px; font: 800 10px/1.2 var(--font);
  letter-spacing: .08em; color: #fff; background: var(--c-red); vertical-align: 2px }
.sr-offer .kitchen { font: italic 500 12px/1.3 var(--font); opacity: .75; margin-top: 2px }
.sr-offer .row { display: flex; gap: 8px }
.sr-offer button { flex: 1; font: 800 14px/1 var(--font); padding: 9px 10px; border-radius: 999px; border: 0; cursor: pointer }
.sr-offer .yes { color: var(--on-amber); background: var(--c-amber) }
.sr-offer .no { color: var(--text); background: transparent; border: 2px solid var(--page) }
.sr-offer kbd { font: 800 11px/1 var(--font); opacity: .75; margin-left: 6px }
.sr-offer .clock { height: 3px; margin-top: 10px; border-radius: 3px; background: var(--c-amber); transform-origin: left;
  transition: transform linear }
.sr-job { position: fixed; top: 128px; left: 14px; z-index: 6; display: none; max-width: calc(100vw - 28px);
  font: 700 14px/1.3 var(--font); color: var(--on-amber); background: var(--c-amber); border-radius: 999px;
  padding: 5px 14px; box-shadow: var(--shadow); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.sr-job.on { display: block }
/* the drop-off leg is green everywhere — pill, compass, map pin, beacon — as the pickup leg is amber */
.sr-job.drop { background: #34d27a; color: #111 }
.sr-nav.drop .dial path { fill: #34d27a }
/* up by the top bar, under the buttons on the left (owner: "it needs to be near the top bar") */
.sr-nav { position: fixed; top: 56px; left: 14px; z-index: 6; display: none;
  align-items: center; gap: 14px; padding: 8px 18px 8px 10px; color: var(--text); background: var(--panel);
  border: 2px solid var(--page); border-radius: 999px; box-shadow: var(--shadow); backdrop-filter: blur(8px) }
.sr-nav.on { display: flex }
.sr-nav .dial { width: 54px; height: 54px; border-radius: 50%; background: var(--page); display: grid; place-items: center }
.sr-nav .dial svg { width: 40px; height: 40px; transition: transform .15s linear }
.sr-nav .dist { font: 800 20px/1 var(--font); min-width: 70px }
.sr-nav .dist small { display: block; font: 600 11px/1.2 var(--font); opacity: .7 }
.sr-nav .clock { font: 800 38px/1 var(--font); font-variant-numeric: tabular-nums; letter-spacing: .5px }
`

export class DeliveryCard {
  private readonly card: HTMLElement
  private readonly line: HTMLElement
  private readonly nav: HTMLElement
  private readonly arrow: SVGElement
  private readonly distEl: HTMLElement
  private readonly clockEl: HTMLElement
  private onYes: () => void = () => {}
  private onNo: () => void = () => {}

  constructor() {
    this.card = document.createElement('div')
    this.card.className = 'sr-offer'
    document.body.appendChild(this.card)
    this.line = document.createElement('div')
    this.line.className = 'sr-job'
    document.body.appendChild(this.line)
    // the compass, the distance and the big timer (owner, 2026-09-29) — no route: the arrow is as the crow flies
    this.nav = document.createElement('div')
    this.nav.className = 'sr-nav'
    this.nav.innerHTML = `
      <div class="dial"><svg viewBox="-20 -20 40 40"><path d="M0,-17 L10,12 L0,6 L-10,12 Z" fill="var(--c-amber)"
        stroke="var(--text)" stroke-width="1.5" stroke-linejoin="round"/></svg></div>
      <div class="dist">–<small>to go</small></div>
      <div class="clock">0:00</div>`
    document.body.appendChild(this.nav)
    this.arrow = this.nav.querySelector('svg')!
    this.distEl = this.nav.querySelector('.dist')!
    this.clockEl = this.nav.querySelector('.clock')!
  }

  /**
   * The compass, the distance and the timer, every frame during a job; `target` null hides them. The arrow is the
   * bearing to the target RELATIVE TO THE RIDER'S HEADING — straight up is straight ahead. Headings: 0 is +z (north),
   * clockwise positive, as everywhere in the code.
   */
  navigate(target: { x: number; z: number } | null, rider: { x: number; z: number; heading: number }, elapsed: number | null): void {
    if (!target || elapsed === null) { this.nav.classList.remove('on'); return }
    this.nav.classList.add('on')
    const dx = target.x - rider.x
    const dz = target.z - rider.z
    const rel = Math.atan2(dx, dz) - rider.heading
    this.arrow.style.transform = `rotate(${(rel * 180) / Math.PI}deg)`
    const d = Math.hypot(dx, dz)
    const txt = d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d / 10) * 10} m`
    if (this.distEl.firstChild?.textContent !== txt) this.distEl.firstChild!.textContent = txt
    const m = Math.floor(elapsed / 60)
    const clock = `${m}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}`
    if (this.clockEl.textContent !== clock) this.clockEl.textContent = clock
  }

  /** the leg's colour: amber to the pickup, green to the drop-off (matching the beacon and the map pin) */
  colour(leg: 'pickup' | 'dropoff'): void {
    this.line.classList.toggle('drop', leg === 'dropoff')
    this.nav.classList.toggle('drop', leg === 'dropoff')
  }

  /** Show an offer; `lasts` seconds before it goes away by itself. */
  offer(job: Job, lasts: number, yes: () => void, no: () => void, routed = false, auto = false): void {
    this.onYes = yes
    this.onNo = no
    const km = job.metres >= 950 ? `${(job.metres / 1000).toFixed(1)} km` : `${Math.round(job.metres / 50) * 50} m`
    const it = job.item
    this.card.innerHTML = `
      <h3>New delivery</h3>
      ${it ? `<div class="dish"><span class="emoji">${esc(it.emoji)}</span><div><b>${esc(it.name)}${it.fragile ? '<span class="fragile">FRAGILE</span>' : ''}</b><i>${esc(it.blurb)}</i></div></div>` : ''}
      <div class="stop"><span class="n">1</span><div><div class="what">${job.source ? 'Pick up at' : 'Pick up near'}</div>${esc(job.pickup.label)}${job.source ? `<div class="kitchen">${esc(job.source.blurb)}</div>` : ''}</div></div>
      <div class="stop"><span class="n">2</span><div><div class="what">Deliver near</div>${esc(job.dropoff.label)}</div></div>
      <div class="far">about ${km} as the crow flies · ${routed ? 'we\'ll route you' : 'find your own way'}${auto ? ` · taking it in ${lasts} s` : ''}</div>
      <div class="row"><button class="yes">Take it<kbd>Y</kbd></button><button class="no">No thanks<kbd>X</kbd></button></div>
      <div class="clock"></div>`
    this.card.querySelector('.yes')!.addEventListener('click', () => this.onYes())
    this.card.querySelector('.no')!.addEventListener('click', () => this.onNo())
    this.card.classList.add('on')
    // the bar runs down over the offer's life
    const clock = this.card.querySelector<HTMLElement>('.clock')!
    clock.style.transitionDuration = '0s'
    clock.style.transform = 'scaleX(1)'
    requestAnimationFrame(() => requestAnimationFrame(() => {
      clock.style.transitionDuration = `${lasts}s`
      clock.style.transform = 'scaleX(0)'
    }))
  }

  hideOffer(): void { this.card.classList.remove('on') }

  /** the one line during a job: where to go now; null hides it */
  going(text: string | null): void {
    if (text) { this.line.textContent = text; this.line.classList.add('on') } else this.line.classList.remove('on')
  }

  /** Y and X, while an offer is showing */
  key(code: string): boolean {
    if (!this.card.classList.contains('on')) return false
    if (code === 'KeyY') { this.onYes(); return true }
    if (code === 'KeyX') { this.onNo(); return true }
    return false
  }
}

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
