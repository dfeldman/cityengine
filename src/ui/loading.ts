/**
 * The loading screen: the game's name, the city being loaded, a progress bar that follows the load's own
 * stages (game.ts `mark`), and a line saying what it is doing — then it fades away once the first frame is
 * drawn and the streets round the rider are built. In the console's look (ui/theme.ts). Inside Dandyhorse the
 * console's own launch screen hands over to this one, so the two share the colours and the type.
 *
 * It is in index.html (`#sr-boot`), so it shows with the page, and this class adopts it (owner, 2026-10-14: "the
 * progress bar takes a moment to show up, and only really has 3 positions"). The bar is WEIGHTED by how long each
 * stage takes — measured on a cold load at 25 Mbps / 80 ms (tools/perf), 16.6 s in all — not one
 * step per stage: fifteen equal steps, fourteen of them in the last second, read as 0, 50, 100. And within a stage
 * it eases on toward the stage's end with a CSS transform transition, which the compositor runs even while the
 * main thread is busy building the city.
 */
import { touchScreen } from './touch.ts'

const STAGES: [name: string, doing: string, seconds: number][] = [
  // (each name is the mark that ENDS the stage; `doing` is what the stage is busy with)
  ['boot', 'Loading the game', 1.1],
  ['assets', 'Fetching the catalogue', 2.0],
  ['opened', 'Fetching the map', 3.0],
  ['fetched', 'Finding the landmarks', 1.5],
  ['rideGraph', 'Laying out the streets', 1.5],
  ['city', 'Raising the buildings', 2.5],
  ['fringe', 'The city beyond', 0.1],
  ['terraces', 'Café terraces', 0.05],
  ['quays', 'The quays', 0.05],
  ['passages', 'Passages and arches', 0.05],
  ['landmarks', 'Monuments', 0.5],
  ['signs', 'Shop signs', 0.05],
  ['crowd', 'People', 0.05],
  ['life', 'Trains and boats', 0.05],
  ['vegetation', 'Trees', 0.05],
  ['pathmap', 'Paths', 0.05],
  ['minimap', 'The map', 0.5],
  ['firstFrame', 'First look', 0.5],
  ['streets', 'Building the streets around you', 3.5],
]
const TOTAL = STAGES.reduce((t, s) => t + s[2], 0)
/** where each stage starts and ends on the bar, 0..1 */
const AT = STAGES.map((_, i) => STAGES.slice(0, i).reduce((t, s) => t + s[2], 0) / TOTAL)

export const LOADING_CSS = `
.sr-loading { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 30%, #1b2460 0%, var(--bg) 70%); transition: opacity .6s ease; }
.sr-loading.gone { opacity: 0; pointer-events: none; }
.sr-loading .sr-card { width: min(520px, 86vw); padding: 30px 34px 28px; text-align: center; }
.sr-loading h1 { margin: 10px 0 2px; font: 800 38px/1.1 var(--font); letter-spacing: -.01em; }
.sr-loading .city { font: 600 18px/1.4 var(--font); color: var(--muted); margin-bottom: 22px; min-height: 1.4em }
.sr-loading .bar { height: 12px; border-radius: 999px; background: var(--panel-2); overflow: hidden; }
.sr-loading .fill { height: 100%; width: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--page), var(--c-blue));
  transform-origin: left; transform: scaleX(0) }
.sr-loading .what { margin-top: 12px; font: 15px/1.4 var(--font); color: var(--muted); min-height: 1.4em; }
`

let current: LoadingScreen | null = null

export class LoadingScreen {
  private readonly root: HTMLElement
  private readonly fill: HTMLElement
  private readonly what: HTMLElement
  private readonly cityEl: HTMLElement
  /** the stage under way (an index into STAGES) */
  private stageAt = 0
  private shown = 0
  private mode = 'by bike'

  /** The one loading screen: the page's own (`#sr-boot`), adopted, or a new one where the page has none. */
  static get(): LoadingScreen {
    current ??= new LoadingScreen()
    return current
  }

  /** Not loading a ride (a showcase, a missing city, a screenshot): the page's screen goes at once. */
  static dismiss(): void {
    if (current) current.hide(true)
    else document.getElementById('sr-boot')?.remove()
  }

  private constructor() {
    const boot = document.getElementById('sr-boot')
    if (boot) this.root = boot
    else {
      this.root = document.createElement('div')
      this.root.className = 'sr-loading'
      this.root.innerHTML = '<div class="sr-card"><span class="sr-pill">Dandyhorse</span><h1>Cycle Dash</h1>'
        + '<div class="city"></div><div class="bar"><div class="fill"></div></div><div class="what"></div></div>'
      document.body.appendChild(this.root)
    }
    this.fill = this.root.querySelector('.fill')!
    this.what = this.root.querySelector('.what')!
    this.cityEl = this.root.querySelector('.city')!
    this.enter(0)
  }

  /** the machine, for the line under the title */
  device(device: 'bike' | 'treadmill'): void { this.mode = device === 'treadmill' ? 'on foot' : 'by bike' }

  /** a name for the city, once the index has it */
  city(name: string): void { this.cityEl.textContent = `${name} · ${this.mode}` }

  /** a load stage finished (main.ts, game.ts `mark`) */
  stage(name: string): void {
    const i = STAGES.findIndex(([n]) => n === name)
    if (i < 0 || i < this.stageAt) return
    this.enter(i + 1)
  }

  /**
   * Stage `i` begins: the bar goes straight to where it starts (a quick catch-up), then eases toward 85% of the way
   * to where it ends, over a little longer than the stage should take. A stage that runs long leaves the bar
   * nearly there rather than jumping past it; one that ends early is caught up by the next.
   */
  private enter(i: number): void {
    this.stageAt = i
    if (i >= STAGES.length) { this.to(1, 0.3); return }
    const [, doing, sec] = STAGES[i]
    this.what.textContent = `${doing}…`
    const start = AT[i]
    const end = i + 1 < AT.length ? AT[i + 1] : 1
    if (start > this.shown + 0.005) this.to(start, 0.25)
    // (two frames: the catch-up's transform has to be committed before the long ease is set over it)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (this.stageAt === i) this.to(start + (end - start) * 0.85, sec * 1.6, 'cubic-bezier(.2,.7,.4,1)')
    }))
  }

  private to(f: number, seconds: number, ease = 'ease-out'): void {
    this.shown = f
    this.fill.style.transition = `transform ${seconds}s ${ease}`
    this.fill.style.transform = `scaleX(${f.toFixed(4)})`
  }

  /** everything in: fill up, fade out, and leave the page */
  hide(now = false): void {
    if (current === this) current = null
    this.stageAt = STAGES.length
    if (now) { this.root.remove(); return }
    this.to(1, 0.3)
    this.root.classList.add('gone')
    setTimeout(() => this.root.remove(), 800)
  }
}

/**
 * The welcome screen (BUGS.md #165). The game used to drop the player straight into a city with no title, no
 * controls and nothing to do next — fine for an agent taking screenshots, hopeless for anyone shown the game
 * for the first time. So: the name, one line of what this is, and the handful of keys worth knowing, over the
 * city itself, gone at the first key or click.
 *
 * Deliberately NOT a state of `LoadingScreen`: holding the loading screen open until a keypress would spoil
 * the load timings being measured against it. This is its own overlay, shown once the loading screen goes.
 */
const CONTROLS: [string, string][] = [
  ['↑ ↓', 'effort — paid from the energy bar; ↓ below 0 W backs up'],
  ['← →', 'hold to steer; hold into a corner to turn there'],
  ['Y  X', 'take or skip a delivery'],
  ['U', 'turn round'],
  ['M', 'the map — click to go'],
  ['/', 'search the landmarks and go there'],
]
/** on Dandyhorse the legs are the effort and the phone is the controller (2026-10-17: the card said "↑ ↓ effort — energy bar") */
const PLATFORM_CONTROLS: [string, string][] = [
  ['🚲', 'your bike or treadmill is the effort — no energy bar'],
  ['📱', 'steer, pause, board and take jobs from the bridge on your phone'],
  ['← →', 'or the keys: turn at the next junction'],
  ['B  M', 'board a cable car · the map'],
]
/** what the game IS, before what the keys do (2026-10-01, for the demo) */
const HIGHLIGHTS: [string, string, string][] = [
  ['🥡', 'Deliver', 'take a job, find the kitchen, beat the clock for stars and tips'],
  ['🚋', 'Hop aboard', 'ride a cable car or a streetcar and get your breath back'],
  ['🌉', 'Explore', 'Nob Hill, Chinatown, the waterfront, both bridges'],
]

export const WELCOME_CSS = `
.sr-welcome { position: fixed; inset: 0; z-index: 40; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 40%, rgba(11,15,36,.25) 0%, rgba(11,15,36,.72) 75%);
  transition: opacity .45s ease; }
.sr-welcome.gone { opacity: 0; pointer-events: none; }
.sr-welcome .sr-card { width: min(600px, 92vw); max-height: 94vh; overflow: auto; padding: 26px 30px 22px; text-align: center;
  background: var(--panel-solid); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow);
  animation: sr-rise .6s cubic-bezier(.2,1.2,.4,1) both }
@keyframes sr-rise { from { opacity: 0; transform: translateY(18px) scale(.97) } }
.sr-welcome h1 { margin: 8px 0 4px; font: 800 42px/1.05 var(--font); letter-spacing: -.01em; }
.sr-welcome .lede { font: 600 16px/1.45 var(--font); color: var(--muted); margin: 0 0 16px; }
.sr-welcome .hl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 0 0 16px; text-align: left }
.sr-welcome .hl > div { background: var(--panel-2); border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px }
.sr-welcome .hl .e { font-size: 26px; line-height: 1 }
.sr-welcome .hl b { display: block; margin: 6px 0 2px; font: 800 15px/1.2 var(--font); color: var(--text) }
.sr-welcome .hl span { font: 13px/1.35 var(--font); color: var(--muted) }
@media (max-width: 560px) { .sr-welcome .hl { grid-template-columns: 1fr } .sr-welcome .hl > div { display: flex; gap: 10px; align-items: center }
  .sr-welcome .hl b { margin: 0 } .sr-welcome h1 { font-size: 34px } }
.sr-welcome table { width: 100%; border-collapse: collapse; text-align: left; }
.sr-welcome td { padding: 4px 0; font: 14px/1.35 var(--font); color: var(--text); vertical-align: baseline; }
.sr-welcome td.k { width: 70px; white-space: nowrap; }
.sr-welcome kbd { font: 700 13px/1 var(--mono); background: var(--panel-2); border: 1px solid var(--border);
  border-radius: 6px; padding: 5px 8px; display: inline-block; color: var(--text); }
.sr-welcome td.d { color: var(--muted); padding-left: 12px; }
.sr-welcome .more { margin-top: 8px; font: 12px/1.4 var(--font); color: var(--muted); opacity: .8 }
.sr-welcome .sr-mode-welcome { position: static; transform: none; margin: 16px auto 0; display: inline-flex; }
.sr-welcome .go { margin-top: 14px; font: 800 16px/1 var(--font); color: var(--page); animation: sr-pulse 1.6s ease-in-out infinite }
@keyframes sr-pulse { 50% { opacity: .45 } }
`

/** Up and not yet dismissed: the ride waits for it (game.ts `hold`), so nobody starts the game mid-descent. */
let welcomeUp = false
export const welcomeOpen = (): boolean => welcomeUp
let dismissWelcome: (() => void) | null = null
/**
 * Take it away without a key or a click (owner, 2026-10-03: a trainer rider "may not have any controls"): game.ts
 * calls this in the trainer modes once the rider has pedalled a couple of seconds, or the card has been up a while.
 */
export const closeWelcome = (): void => { dismissWelcome?.() }

/** Show it, and take it away at the first key or click. */
export function welcomeScreen(cityName: string, slowInput = false, platform = false): void {
  welcomeUp = true
  const root = document.createElement('div')
  root.className = 'sr-welcome'
  // slow input (?input=slow, trainers): a press declares the turn at the next junction, well before it
  const touch = touchScreen()
  const rows = (platform ? PLATFORM_CONTROLS : CONTROLS).map(([k, d]) => (k === '← →' && slowInput ? [k, 'pick your turn at the next junction, before you reach it'] : [k, d])).map(([k, d]) => `<tr><td class="k"><kbd>${k}</kbd></td><td class="d">${d}</td></tr>`).join('')
  const hl = HIGHLIGHTS.map(([e, t, d]) => `<div><span class="e">${e}</span><div><b>${t}</b><span>${d}</span></div></div>`).join('')
  root.innerHTML = `<div class="sr-card"><span class="sr-pill">Dandyhorse</span><h1>Cycle Dash</h1>
    <p class="lede">Ride ${cityName} for real — every street, every building, where they actually are.</p>
    <div class="hl">${hl}</div>
    ${touch ? '<div class="more">Touch the left or right of the picture to steer · the slider is your effort</div>' : `<table>${rows}</table><div class="more">Esc menu &amp; settings · M map · P look around</div>`}
    <div class="go">${touch ? 'tap to ride' : 'press any key to ride'}</div></div>`
  /*
   * The bike/run switch lives here now, and only here (main.ts builds it): choosing the machine is a thing
   * you do once, at the start, not a control that sits over the city for the whole ride.
   */
  const mode = (window as unknown as { __modeSwitch?: HTMLElement }).__modeSwitch
  if (mode) root.querySelector('.go')!.before(mode)
  document.body.appendChild(root)
  const dismiss = (): void => {
    welcomeUp = false
    root.classList.add('gone')
    setTimeout(() => root.remove(), 600)
    removeEventListener('keydown', dismiss)
    removeEventListener('pointerdown', dismiss)
    dismissWelcome = null
  }
  dismissWelcome = dismiss
  // never preventDefault: the paste handler and the trainer's own input must go on working underneath
  addEventListener('keydown', dismiss)
  addEventListener('pointerdown', dismiss)
}
