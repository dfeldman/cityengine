/**
 * The loading screen: the game's name, the city being loaded, a progress bar that follows the load's own
 * stages (game.ts `mark`), and a line saying what it is doing — then it fades away once the first frame is
 * drawn and the streets round the rider are built. In the console's look (ui/theme.ts). Inside Dandyhorse the
 * console's own launch screen hands over to this one, so the two share the colours and the type.
 */
const STAGES: [string, string][] = [
  ['fetched', 'Fetching the map'],
  ['rideGraph', 'Laying out the streets'],
  ['city', 'Raising the buildings'],
  ['fringe', 'The city beyond'],
  ['terraces', 'Café terraces'],
  ['quays', 'The quays'],
  ['passages', 'Passages and arches'],
  ['landmarks', 'Monuments'],
  ['signs', 'Shop signs'],
  ['crowd', 'People'],
  ['life', 'Trains and boats'],
  ['vegetation', 'Trees'],
  ['pathmap', 'Paths'],
  ['minimap', 'The map'],
  ['firstFrame', 'Nearly there'],
]

export const LOADING_CSS = `
.sr-loading { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at 50% 30%, #1b2460 0%, var(--bg) 70%); transition: opacity .6s ease; }
.sr-loading.gone { opacity: 0; pointer-events: none; }
.sr-loading .sr-card { width: min(520px, 86vw); padding: 30px 34px 28px; text-align: center; }
.sr-loading h1 { margin: 10px 0 2px; font: 800 38px/1.1 var(--font); letter-spacing: -.01em; }
.sr-loading .city { font: 600 18px/1.4 var(--font); color: var(--muted); margin-bottom: 22px; }
.sr-loading .bar { height: 12px; border-radius: 999px; background: var(--panel-2); overflow: hidden; }
.sr-loading .fill { height: 100%; width: 0; border-radius: 999px; background: linear-gradient(90deg, var(--page), var(--c-blue));
  transition: width .35s ease; }
.sr-loading .what { margin-top: 12px; font: 15px/1.4 var(--font); color: var(--muted); min-height: 1.4em; }
`

export class LoadingScreen {
  private readonly root: HTMLElement
  private readonly fill: HTMLElement
  private readonly what: HTMLElement
  private done = 0

  constructor(cityName: string) {
    this.root = document.createElement('div')
    this.root.className = 'sr-loading'
    this.root.innerHTML = `<div class="sr-card"><span class="sr-pill">Dandyhorse</span><h1>Street Runner</h1>
      <div class="city"></div><div class="bar"><div class="fill"></div></div><div class="what">Starting…</div></div>`
    this.root.querySelector('.city')!.textContent = cityName
    this.fill = this.root.querySelector('.fill')!
    this.what = this.root.querySelector('.what')!
    document.body.appendChild(this.root)
  }

  /** a name for the city, once the index has it */
  city(name: string): void { this.root.querySelector('.city')!.textContent = name }

  /** a load stage finished (game.ts `mark`) */
  stage(name: string): void {
    const i = STAGES.findIndex(([n]) => n === name)
    if (i < 0) return
    this.done = Math.max(this.done, i + 1)
    this.fill.style.width = `${Math.round((this.done / STAGES.length) * 100)}%`
    this.what.textContent = STAGES[Math.min(STAGES.length - 1, i + 1)][1] + '…'
  }

  /** everything in: fade out, and leave the page */
  hide(): void {
    this.fill.style.width = '100%'
    this.root.classList.add('gone')
    setTimeout(() => this.root.remove(), 800)
  }
}
