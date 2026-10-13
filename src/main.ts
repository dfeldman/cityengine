/**
 * Entry point.
 *
 *   /                          ride Le Marais
 *   /?city=brooklyn-heights    somewhere else
 *   /?mode=debug               trainer debug (?mode=trainer: on a local Dandyhorse; couch by default; src/modes.ts)
 *   /?running=1&device=treadmill  run it instead (running is off for now)
 *   /?showcase=1               the facade showcase, one building per style
 *   /?showcase=1&style=brick   eight of one style
 *   /?session=<id>             on Dandyhorse: the bridge's session (src/platform.ts; INTEGRATION.md)
 *   /?dandyhorse=bike|run      an ad-hoc debug session on a local Dandyhorse server
 */
import { goTo, parseLatLon, type CityRef } from './ui/goto.ts'
import { HUD_CSS } from './ui/hud.ts'
import { DELIVERY_CSS } from './ui/delivery-card.ts'
import { MINIMAP_CSS } from './ui/minimap.ts'
import { THEME_CSS } from './ui/theme.ts'
import { LOADING_CSS, WELCOME_CSS } from './ui/loading.ts'
import { CARD_CSS } from './ui/landmark-card.ts'
import { detectTier } from './tier.ts'
import { initAssets } from './assets.ts'
import { chooseMode, MODES, type GameMode } from './modes.ts'
import { COMPACT_CSS, TOUCH_CSS, compactScreen, touchControls, wantsTouch } from './ui/touch.ts'

const params = new URLSearchParams(location.search)
const canvas = document.getElementById('view') as HTMLCanvasElement

const style = document.createElement('style')
style.textContent = HUD_CSS + MINIMAP_CSS + THEME_CSS + LOADING_CSS + WELCOME_CSS + CARD_CSS + DELIVERY_CSS + TOUCH_CSS + COMPACT_CSS
document.head.appendChild(style)

// the shared asset bucket's indexes (trees, plants, statues, this game's own): before anything loads a model
await initAssets()

if (params.get('model')) {
  const { modelShowcase } = await import('./model-showcase.ts')
  void modelShowcase(canvas, params.get('model')!, Number(params.get('size') ?? 200), (params.get('time') as 'dawn' | 'day' | 'dusk' | 'night') ?? 'day')
} else if (params.get('trees')) {
  const { treeShowcase } = await import('./tree-showcase.ts')
  void treeShowcase(canvas, (Number(params.get('lod') ?? 0) as 0 | 1 | 2))
} else if (params.get('palms')) {
  const { palmShowcase } = await import('./palm-showcase.ts')
  void palmShowcase(canvas, (Number(params.get('lod') ?? 0) as 0 | 1 | 2), params.get('view') === 'close')
} else if (params.get('showcase')) {
  const { showcase } = await import('./showcase.ts')
  void showcase(canvas, params.get('style') ?? undefined)
} else {
  /*
   * Which cities exist, from the list the bake writes. A city that is not on it gets a page saying so and
   * naming the real ones: asking Vite for a package that does not exist returns its index.html with a 200,
   * and the game then died trying to read a web page as a city ("Unexpected token '<'").
   */
  const cities = await fetch(new URL('cities/index.json', document.baseURI).href)
    .then((r) => r.json() as Promise<CityRef[]>)
    .catch(() => [] as CityRef[])
  /*
   * On Dandyhorse the session starts before anything is built: the city, the machine, the options and where
   * the rider left off all come from startsession. The gamekit is loaded only then, so the standalone game
   * never fetches it.
   */
  const sessionId = params.get('session')
  // `?mode=trainer` outside Dandyhorse opens an ad-hoc session on a local Dandyhorse server, as `?dandyhorse=bike` does
  const adHoc = params.get('dandyhorse') ?? (params.get('mode') === 'trainer' ? 'bike' : null)
  let platform: import('./platform.ts').Platform | null = null
  if (sessionId || adHoc) {
    const [{ startSession }, { Platform, GAME_ID }] = await Promise.all([import('@dandyhorse/gamekit'), import('./platform.ts')])
    try {
      const start = await startSession(sessionId ? { sessionId }
        : { gameId: GAME_ID, variant: adHoc === 'run' ? 'run' : 'bike', debug: true, options: params.get('city') ? { city: params.get('city') } : undefined })
      platform = new Platform(start, (line) => console.log('streetrunner:', line))
    } catch (e) {
      // say so, in the console's look, rather than sit on "loading…" for ever
      const box = document.createElement('div')
      box.className = 'sr-loading'
      box.innerHTML = '<div class="sr-card"><span class="sr-pill">Dandyhorse</span><h1>Cycle Dash</h1><div class="city"></div>'
        + '<div class="what"></div></div>'
      box.querySelector('.city')!.textContent = 'Could not start the session'
      box.querySelector('.what')!.textContent = `${e instanceof Error ? e.message : String(e)}. Opened outside Dandyhorse? `
        + 'Without ?session= the game rides on its own.'
      document.body.appendChild(box)
      throw e
    }
  }
  // BUGS.md #166: the default was `paris-marais`, a stale bake the owner reports as no longer existing.
  // San Francisco is the city under active development and the only one kept current.
  const city = platform?.city ?? params.get('city') ?? 'san-francisco'
  const link = (id: string): string => {
    const q = new URLSearchParams(location.search)
    q.set('city', id)
    q.delete('start')
    q.delete('at')
    return `?${q}`
  }
  if (cities.length > 0 && !cities.some((c) => c.id === city)) {
    const box = document.createElement('div')
    box.className = 'sr-nocity'
    box.innerHTML = `<h1>No city called “${city.replace(/[<>&"]/g, '')}”</h1><p>These are baked:</p><ul>`
      + cities.map((c) => `<li><a href="${link(c.id)}">${c.name}</a> <code>${c.id}</code></li>`).join('')
      + '</ul>'
    document.body.appendChild(box)
    document.getElementById('label')!.textContent = ''
    throw new Error(`unknown city ${city}`)
  }
  // the city menu, top centre (on Dandyhorse the launch chose the city)
  // (hidden unless `?citymenu=1`: the city is a URL parameter, `?city=`, owner 2026-10-01)
  if (cities.length > 1 && !platform && params.get('citymenu') === '1') {
    const pick = document.createElement('select')
    pick.className = 'sr-city'
    pick.title = 'city'
    for (const c of cities) pick.add(new Option(c.name, c.id, c.id === city, c.id === city))
    pick.addEventListener('change', () => { location.search = link(pick.value) })
    // the ride's keys must not also drive the menu
    pick.addEventListener('keydown', (e) => e.stopPropagation())
    document.body.appendChild(pick)
  }
  // the game's mode (src/modes.ts): Dandyhorse is the trainer; otherwise couch unless `?mode=` says
  const mode: GameMode = chooseMode(params.get('mode'), !!platform)
  /*
   * RUNNING IS OFF FOR NOW (owner, 2026-10-01: "biking only for simplicity right now"): the bike, whatever the URL
   * says, unless `?running=1` (development) — or Dandyhorse launched a run, which is the platform's choice.
   */
  const running = params.get('running') === '1'
  const device = platform?.device ?? (running && params.get('device') === 'treadmill' ? 'treadmill' : 'bike')
  if (!platform) {
    /*
     * The choice made once, on the welcome screen (ui/loading.ts; owner, 2026-09-24: "just once at the beginning"):
     * which MODE — couch, trainer, trainer debug. Each is a reload keeping the city and the place. With `?running=1`
     * it is the old bike/run switch instead (R switches at any time).
     */
    const box = document.createElement('div')
    box.className = 'sr-mode'
    box.setAttribute('role', 'radiogroup')
    const reload = (set: (q: URLSearchParams) => void): void => {
      const q = new URLSearchParams(location.search)
      set(q)
      q.delete('start')
      const here = (window as unknown as { __here?: () => string | null }).__here?.()
      if (here) q.set('at', here)
      location.search = `?${q}`.replace(/%2C/g, ',')
    }
    const button = (label: string, on: boolean, title: string, go: () => void): void => {
      const b = document.createElement('button')
      b.textContent = label
      b.title = title
      b.setAttribute('role', 'radio')
      b.setAttribute('aria-checked', String(on))
      if (on) b.classList.add('on')
      b.addEventListener('click', () => { if (!on) go() })
      box.appendChild(b)
    }
    if (running) {
      box.title = 'bike or run (R)'
      const go = (d: 'bike' | 'treadmill'): void => {
        if (d !== device) reload((q) => { if (d === 'treadmill') q.set('device', 'treadmill'); else q.delete('device') })
      }
      button('Bike', device === 'bike', 'bike', () => go('bike'))
      button('Run', device === 'treadmill', 'run', () => go('treadmill'))
      addEventListener('keydown', (e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
        if (e.code === 'KeyR') go(device === 'bike' ? 'treadmill' : 'bike')
      })
    } else {
      box.title = 'how you are playing'
      for (const m of ['couch', 'trainer', 'debug'] as const) {
        button(MODES[m].label, m === mode, MODES[m].blurb, () => reload((q) => { if (m === 'couch') q.delete('mode'); else q.set('mode', m) }))
      }
    }
    box.classList.add('sr-mode-welcome')
    ;(window as unknown as { __modeSwitch?: HTMLElement }).__modeSwitch = box
  }
  // the touch buttons on a phone or tablet (ui/touch.ts; `?touch=1|0`)
  if (wantsTouch(params.get('touch'))) touchControls({ trainer: mode === 'trainer' })
  document.documentElement.classList.toggle('sr-compact', compactScreen(params.get('compact')))
  const { game } = await import('./game.ts')
  void game(canvas, {
    city,
    device,
    traffic: platform?.traffic ?? (params.get('traffic') as 'none' | 'some' | 'busy') ?? undefined,
    bodies: params.get('bodies') ? Number(params.get('bodies')) : undefined,
    // ?without=sky,life,trees — for isolating which subsystem is drawing something wrong
    without: new Set((params.get('without') ?? '').split(',').filter(Boolean)),
    startEdge: params.get('start') ? Number(params.get('start')) : undefined,
    at: parseLatLon(params.get('at') ?? '') ?? platform?.resumeAt(city) ?? undefined,
    // the city's own in-place jump (game.ts `__jump`), so going to a place inside it does not reload the page
    goTo: (text: string, here?: boolean) => goTo(text, cities, here ? city : undefined,
      (ll) => (window as unknown as { __jump?: (lat: number, lon: number) => boolean }).__jump?.(ll.lat, ll.lon) ?? false),
    view: params.get('view') === 'high' ? 'high' : 'ride',
    freeze: params.get('freeze') === '1',
    paths: params.get('paths') === '1',
    time: platform?.time ?? (params.get('time') as 'dawn' | 'day' | 'dusk' | 'night') ?? undefined,
    weather: platform?.weather ?? (params.get('weather') as 'clear' | 'overcast' | 'rain') ?? undefined,
    advance: params.get('advance') ? Number(params.get('advance')) : undefined,
    // road traffic is ON by default since 2026-09-29 (the delivery game's gridlock); ?cars=0 turns it off
    cars: params.get('cars') !== '0',
    // ?input=fast (held arrows steer, the turn is taken at the corner) is the default; ?input=slow declares turns
    // ahead, for trainers — and is the default on Dandyhorse, where the phone's d-pad arrives on a 1 s poll
    // ?route=manual: deliveries are not routed for you (the default routes them, and takes the turns)
    route: params.get('route') === 'manual' ? 'manual' : 'auto',
    // ?tier=phone|desktop: how much the device can hold (src/tier.ts); phones and tablets are guessed
    tier: detectTier(params.get('tier')),
    input: params.get('input') === 'slow' || params.get('input') === 'fast' ? params.get('input') as 'fast' | 'slow'
      : MODES[mode].input,
    // couch, trainer or trainer debug (src/modes.ts); `?speedup=` overrides the mode's
    mode,
    speedup: params.get('speedup') ? Number(params.get('speedup')) : undefined,
    // ?veg=3 — how many times the baked count a closed wood grows to (render/infill.ts); ?vegmerge=0 turns
    // off the material and far-tier merging of BUGS.md #205, so the two can be measured against each other
    veg: params.get('veg') ? Number(params.get('veg')) : undefined,
    vegMerge: params.get('vegmerge') !== '0',
    turn: (params.get('turn') as 'left' | 'straight' | 'right') ?? undefined,
    platform: platform ?? undefined,
  })
}
