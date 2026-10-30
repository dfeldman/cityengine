/**
 * TOUR MODE's two pieces of screen (src/game/tour.ts): the PICKER, which is up before the city loads (main.ts) and
 * says which tour — or a free ride — and the STOP CARD, a few lines about the stop the rider is coming up to.
 *
 * The picker works with nothing but Up / Down / Enter, as the pause menu does (ui/menu.ts), and with a mouse or a
 * finger as anyone would expect.
 */
import { difficultyOf, minutesOf, statsOf, type Difficulty, type Tour } from '../game/tour.ts'

export const TOUR_CSS = `
.sr-tours { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 40%, rgba(11,15,36,.82) 0%, rgba(11,15,36,.97) 75%); transition: opacity .4s ease }
.sr-tours.gone { opacity: 0; pointer-events: none }
.sr-tours .sr-card { width: min(680px, calc(100vw - 32px)); max-height: calc(100vh - 32px); display: flex; flex-direction: column;
  padding: 22px 22px 16px; box-sizing: border-box }
.sr-tours h1 { margin: 8px 0 2px; font: 800 34px/1.1 var(--font) }
.sr-tours .lede { margin: 0 0 14px; font: 600 15px/1.4 var(--font); color: var(--muted) }
.sr-tours .list { overflow: auto; display: grid; gap: 8px; padding: 2px; margin: 0 -2px; overscroll-behavior: contain }
.sr-tours button.tour { display: block; width: 100%; text-align: left; padding: 11px 14px; border-radius: var(--radius-sm);
  background: var(--panel-2); border: 2px solid var(--border); color: var(--text); font: inherit; cursor: pointer;
  touch-action: manipulation; -webkit-tap-highlight-color: transparent }
.sr-tours button.tour:hover, .sr-tours button.tour:focus-visible, .sr-tours button.tour.on { border-color: var(--page); outline: none }
.sr-tours .top { display: flex; align-items: baseline; gap: 10px; justify-content: space-between }
.sr-tours .name { font: 800 17px/1.25 var(--font) }
.sr-tours .blurb { margin: 3px 0 6px; font: 14px/1.35 var(--font); color: var(--muted) }
.sr-tours .meta { font: 700 13px/1.2 var(--font); color: var(--text); display: flex; flex-wrap: wrap; gap: 4px 14px }
.sr-tours .meta span { white-space: nowrap }
.sr-tours .free .name::before { content: '🚲 ' }
.sr-tours .keys { margin-top: 12px; font: 12px/1.4 var(--font); color: var(--muted); text-align: center }
.sr-diff { flex: none; font: 800 11px/1 var(--font); letter-spacing: .04em; text-transform: uppercase; padding: 5px 8px; border-radius: 999px }
.sr-diff.easy { background: var(--c-lime); color: var(--on-lime) }
.sr-diff.moderate { background: var(--c-amber); color: var(--on-amber) }
.sr-diff.hard { background: var(--c-magenta); color: var(--on-magenta) }
.sr-diff.extreme { background: var(--c-red); color: var(--on-red) }
@media (max-width: 560px) { .sr-tours h1 { font-size: 26px } .sr-tours .sr-card { padding: 16px 14px 12px } }

.sr-tour-card { position: fixed; left: 16px; bottom: 64px; width: min(380px, calc(100vw - 32px)); padding: 14px 16px; z-index: 6;
  box-sizing: border-box; transition: opacity .4s ease, transform .4s ease }
.sr-tour-card.hidden { opacity: 0; transform: translateY(8px); pointer-events: none }
.sr-tour-card h2 { margin: 8px 0 2px; font: 800 21px/1.2 var(--font) }
.sr-tour-card p { margin: 6px 0 0; font: 15px/1.45 var(--font) }
.sr-tour-card .next { margin-top: 8px; font: 600 13px/1.3 var(--font); color: var(--muted) }
.sr-tour-card .close { position: absolute; top: 8px; right: 10px; background: none; border: none; color: var(--muted);
  font: 20px/1 var(--font); cursor: pointer; padding: 2px 4px }
.sr-tour-card .acts { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap }
.sr-tour-card .acts button { font: 700 14px/1 var(--font); padding: 10px 14px; border-radius: 999px; cursor: pointer;
  border: 2px solid var(--border); background: var(--panel-2); color: var(--text) }
.sr-tour-card .acts button.main { background: var(--page); color: var(--on-page); border-color: var(--page) }
.sr-tour-card .acts button:focus-visible { outline: 3px solid var(--text); outline-offset: 2px }
/* a phone: the bottom is the route's pill and the energy bar, so the card goes up under the speed */
@media (max-width: 560px) { .sr-tour-card { top: 84px; bottom: auto; padding: 12px 14px } .sr-tour-card h2 { font-size: 18px } .sr-tour-card p { font-size: 14px } }
`

const DIFF_CLASS: Record<Difficulty, string> = { Easy: 'easy', Moderate: 'moderate', Hard: 'hard', Extreme: 'extreme' }

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** "~45 min", "1 h 10 min" */
export function duration(min: number): string {
  const m = Math.max(5, Math.round(min / 5) * 5)
  return m < 60 ? `~${m} min` : `~${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`
}

/**
 * The picker: resolves with the chosen tour, or null for a free ride. `speedup` is the mode's (modes.ts), for how long
 * each tour takes in the game; `imperial` for miles and feet.
 */
export function pickTour(tours: Tour[], o: { speedup: number; imperial: boolean; touch: boolean; platform: boolean; city?: string }): Promise<Tour | null> {
  return new Promise((resolve) => {
    const root = document.createElement('div')
    root.className = 'sr-tours'
    const card = document.createElement('div')
    card.className = 'sr-card'
    card.innerHTML = '<span class="sr-pill">Dandyhorse</span><h1>Tours of ' + (o.city ?? 'San Francisco') + '</h1>'
      + '<p class="lede">Pick a tour: the route guides you from stop to stop, and you can always turn off and find your own way.</p>'
    const list = document.createElement('div')
    list.className = 'list'
    list.setAttribute('role', 'listbox')
    const buttons: HTMLButtonElement[] = []
    const add = (html: string, pick: Tour | null, cls = ''): void => {
      const b = document.createElement('button')
      b.className = `tour ${cls}`
      b.setAttribute('role', 'option')
      b.innerHTML = html
      b.addEventListener('click', () => done(pick))
      b.addEventListener('focus', () => { for (const q of buttons) q.classList.toggle('on', q === b) })
      buttons.push(b)
      list.appendChild(b)
    }
    for (const t of tours) {
      const s = statsOf(t)
      const announced = t.stops.filter((q) => q.text).length
      const meta = s ? [
        o.imperial ? `${(s.km / 1.609344).toFixed(1)} mi` : `${s.km.toFixed(1)} km`,
        `↗ ${o.imperial ? `${Math.round(s.climb * 3.28084 / 10) * 10} ft` : `${s.climb} m`} climbing`,
        duration(minutesOf(s, o.speedup)),
        `${announced} stops`,
      ] : [`${announced} stops`]
      const diff = s ? difficultyOf(s) : null
      add(`<div class="top"><span class="name">${esc(t.name)}</span>`
        + `${diff ? `<span class="sr-diff ${DIFF_CLASS[diff]}">${diff}</span>` : ''}</div>`
        + `<div class="blurb">${esc(t.blurb)}</div><div class="meta">${meta.map((m) => `<span>${m}</span>`).join('')}</div>`, t)
    }
    add('<div class="top"><span class="name">Free ride</span></div>'
      + '<div class="blurb">No route: ride wherever you like, with a note on each sight as you pass it.</div>', null, 'free')
    card.appendChild(list)
    const keys = document.createElement('div')
    keys.className = 'keys'
    keys.textContent = o.platform ? 'Your bike is the effort · steer from your phone, or ← → at the next junction'
      : o.touch ? 'Touch the left or right of the picture to steer · the slider is your effort'
        : '↑ ↓ choose · Enter to ride · in the ride: ↑ ↓ effort, ← → turn, M map, Esc menu'
    card.appendChild(keys)
    root.appendChild(card)
    document.body.appendChild(root)
    let focus = 0
    const move = (i: number): void => {
      focus = (i + buttons.length) % buttons.length
      buttons[focus].focus()
      buttons[focus].scrollIntoView({ block: 'nearest' })
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === 'ArrowDown' || e.code === 'ArrowRight') { e.preventDefault(); move(buttons.indexOf(document.activeElement as HTMLButtonElement) + 1) }
      else if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') { e.preventDefault(); move(Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement)) - 1) }
      else if ((e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') && buttons.includes(document.activeElement as HTMLButtonElement)) {
        e.preventDefault()
        ;(document.activeElement as HTMLButtonElement).click()
      }
      // (nothing behind the picker hears a key while it is up)
      e.stopPropagation()
    }
    addEventListener('keydown', onKey, true)
    // (not focused on a touch screen: the highlight would only say "this one" before anybody has chosen)
    if (!o.touch) move(focus)
    function done(t: Tour | null): void {
      removeEventListener('keydown', onKey, true)
      root.classList.add('gone')
      setTimeout(() => root.remove(), 500)
      resolve(t)
    }
  })
}

/** The card about a stop, bottom left (where the landmark card is in the delivery game: it is not made in tour mode). */
export class TourCard {
  private readonly el: HTMLElement
  private timer = 0

  constructor() {
    this.el = document.createElement('div')
    this.el.className = 'sr-card sr-tour-card hidden'
    document.body.appendChild(this.el)
  }

  /** `pill` says which stop ("Stop 3 of 7", "Sight"); `next` what comes after */
  show(pill: string, name: string, text: string, next?: string): void {
    this.fill(pill, name, text, next)
    this.hideIn(16000)
  }

  /**
   * The end: how far and how long, and what now (owner, 2026-10-28: "prompt the user to possibly end the session when
   * the tour is complete"). The first of `acts` is the main button, focused for a keyboard (`focus`): Enter takes it.
   * Every button hides the card; `note` is a line under them.
   */
  complete(name: string, summary: string, acts: { label: string; run: () => void }[], o: { note?: string; focus?: boolean } = {}): void {
    this.fill('Tour complete', name, summary, o.note)
    const row = document.createElement('div')
    row.className = 'acts'
    const buttons = acts.map((a, i) => {
      const b = document.createElement('button')
      if (i === 0) b.className = 'main'
      b.textContent = a.label
      b.addEventListener('click', () => { this.hide(); a.run() })
      return b
    })
    row.append(...buttons)
    // (the note, if any, after the buttons)
    this.el.insertBefore(row, this.el.querySelector('.next'))
    clearTimeout(this.timer)
    if (o.focus) buttons[0]?.focus({ preventScroll: true })
  }

  /** the card is up */
  get isOpen(): boolean { return !this.el.classList.contains('hidden') }

  hide(): void {
    clearTimeout(this.timer)
    this.el.classList.add('hidden')
    // (a focused button would take the next Enter or Space, card or no card)
    if (this.el.contains(document.activeElement)) (document.activeElement as HTMLElement).blur()
  }

  private hideIn(ms: number): void {
    clearTimeout(this.timer)
    this.timer = window.setTimeout(() => this.hide(), ms)
  }

  private fill(pill: string, name: string, text: string, next?: string): void {
    this.el.innerHTML = ''
    const close = document.createElement('button')
    close.className = 'close'
    close.textContent = '×'
    close.title = 'Hide'
    close.addEventListener('click', () => this.hide())
    const p = document.createElement('span')
    p.className = 'sr-pill'
    p.textContent = pill
    const h = document.createElement('h2')
    h.textContent = name
    const t = document.createElement('p')
    t.textContent = text
    this.el.append(close, p, h, t)
    if (next) {
      const n = document.createElement('div')
      n.className = 'next'
      n.textContent = next
      this.el.appendChild(n)
    }
    this.el.classList.remove('hidden')
  }
}
