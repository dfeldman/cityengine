/**
 * The delivery game's screen furniture (src/game/delivery.ts is the logic): the OFFER card — two stops, named by
 * their nearest intersection, with Take it (Y) and No thanks (X) and a bar running down to when it goes away by
 * itself — and, during a job, one line saying where to go next. No route and no pointer: finding the way is the
 * game (a compass comes later).
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
.sr-offer .what { opacity: .7; font-size: 12px }
.sr-offer .far { opacity: .7; margin: 8px 0 10px; font-size: 13px }
.sr-offer .row { display: flex; gap: 8px }
.sr-offer button { flex: 1; font: 800 14px/1 var(--font); padding: 9px 10px; border-radius: 999px; border: 0; cursor: pointer }
.sr-offer .yes { color: var(--on-amber); background: var(--c-amber) }
.sr-offer .no { color: var(--text); background: transparent; border: 2px solid var(--page) }
.sr-offer kbd { font: 800 11px/1 var(--font); opacity: .75; margin-left: 6px }
.sr-offer .clock { height: 3px; margin-top: 10px; border-radius: 3px; background: var(--c-amber); transform-origin: left;
  transition: transform linear }
.sr-job { position: fixed; top: 120px; left: 50%; transform: translateX(-50%); z-index: 6; display: none;
  font: 700 15px/1.3 var(--font); color: var(--on-amber); background: var(--c-amber); border-radius: 999px;
  padding: 6px 16px; box-shadow: var(--shadow); white-space: nowrap }
.sr-job.on { display: block }
`

export class DeliveryCard {
  private readonly card: HTMLElement
  private readonly line: HTMLElement
  private onYes: () => void = () => {}
  private onNo: () => void = () => {}

  constructor() {
    this.card = document.createElement('div')
    this.card.className = 'sr-offer'
    document.body.appendChild(this.card)
    this.line = document.createElement('div')
    this.line.className = 'sr-job'
    document.body.appendChild(this.line)
  }

  /** Show an offer; `lasts` seconds before it goes away by itself. */
  offer(job: Job, lasts: number, yes: () => void, no: () => void): void {
    this.onYes = yes
    this.onNo = no
    const km = job.metres >= 950 ? `${(job.metres / 1000).toFixed(1)} km` : `${Math.round(job.metres / 50) * 50} m`
    this.card.innerHTML = `
      <h3>New delivery</h3>
      <div class="stop"><span class="n">1</span><div><div class="what">Pick up near</div>${esc(job.pickup.label)}</div></div>
      <div class="stop"><span class="n">2</span><div><div class="what">Deliver near</div>${esc(job.dropoff.label)}</div></div>
      <div class="far">about ${km} as the crow flies · find your own way</div>
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
