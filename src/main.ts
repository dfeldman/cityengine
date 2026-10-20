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
 *   &host=<origin>             …framed by Dandyhorse's shim from another origin: the API through it (src/relay.ts)
 *   /?dandyhorse=bike|run      an ad-hoc debug session on a local Dandyhorse server
 */
import { keepFocus, relayFetch, relayHost } from './relay.ts'
import { goTo, parseLatLon, type CityRef } from './ui/goto.ts'
import { HUD_CSS } from './ui/hud.ts'
import { DELIVERY_CSS } from './ui/delivery-card.ts'
import { MINIMAP_CSS } from './ui/minimap.ts'
import { THEME_CSS } from './ui/theme.ts'
import { LOADING_CSS, LoadingScreen, WELCOME_CSS } from './ui/loading.ts'
import { CARD_CSS } from './ui/landmark-card.ts'
import { detectTier } from './tier.ts'
import { initAssets } from './assets.ts'
import { chooseMode, MODES, type GameMode } from './modes.ts'
import { COMPACT_CSS, TOUCH_CSS, compactScreen, showTouchWhenUsed, touchControls } from './ui/touch.ts'
import { MENU_CSS } from './ui/menu.ts'
import CITIES from './cities.json'
import { settings } from './ui/settings.ts'
import { beginRun, recoverFromCrash } from './ui/crashguard.ts'

const params = new URLSearchParams(location.search)
const canvas = document.getElementById('view') as HTMLCanvasElement

const style = document.createElement('style')
style.textContent = HUD_CSS + MINIMAP_CSS + THEME_CSS + LOADING_CSS + WELCOME_CSS + CARD_CSS + DELIVERY_CSS + TOUCH_CSS + COMPACT_CSS + MENU_CSS
document.head.appendChild(style)

// iOS Safari ignores `user-scalable=no` (index.html): a pinch anywhere zoomed the whole game, HUD and all
for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
// …and two fingers never zoom the page (the big map's pinch is its own, on pointer events, which this leaves alone)
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault() }, { passive: false })
// and if the page is zoomed all the same (owner, 2026-10-14: zoomed and "couldn't un zoom it"), setting the viewport
// again makes Safari snap back to 1×
const viewport = document.querySelector('meta[name=viewport]')
window.visualViewport?.addEventListener('resize', () => {
  if (!viewport || (window.visualViewport?.scale ?? 1) < 1.01) return
  const c = viewport.getAttribute('content') ?? ''
  viewport.setAttribute('content', `${c}, minimum-scale=1`)
  requestAnimationFrame(() => viewport.setAttribute('content', c))
})

// the loading screen (in index.html, ui/loading.ts): a ride follows it; anything else takes it down at once
const showcasing = ['model', 'trees', 'palms', 'showcase'].some((k) => params.get(k))
if (showcasing || params.get('freeze') === '1') LoadingScreen.dismiss()
else {
  LoadingScreen.get().stage('boot')
  // did the last ride crash (a setting too big for this device)? then a step down, before the tier is chosen
  recoverFromCrash()
}

// the shared asset bucket's indexes (trees, plants, statues, this game's own): before anything loads a model
await initAssets()
if (!showcasing && params.get('freeze') !== '1') LoadingScreen.get().stage('assets')

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
   * Which cities exist: src/cities.json, the list the bake writes from the live cities in tools/cities.ts — a file of
   * this repo, bundled, not fetched. A city that is not on it gets a page saying so and naming the real ones.
   */
  const cities = CITIES as CityRef[]
  /*
   * On Dandyhorse the session starts before anything is built: the city, the machine, the options and where
   * the rider left off all come from startsession. The gamekit is loaded only then, so the standalone game
   * never fetches it.
   */
  const sessionId = params.get('session')
  // `?mode=trainer` outside Dandyhorse opens an ad-hoc session on a local Dandyhorse server, as `?dandyhorse=bike` does
  const adHoc = params.get('dandyhorse') ?? (params.get('mode') === 'trainer' ? 'bike' : null)
  let platform: import('./platform.ts').Platform | null = null
  /** The player's own AvatarSpec from Dandyhorse, where they have one (see below). */
  let playerAvatar: Record<string, unknown> | null = null
  if (sessionId || adHoc) {
    const [{ startSession, setFetch }, { Platform, GAME_ID }] = await Promise.all([import('@dandyhorse/gamekit'), import('./platform.ts')])
    // framed by Dandyhorse's shim from another origin: the API is reached through it (src/relay.ts)
    const host = relayHost(params)
    if (host) { setFetch(relayFetch(host)); keepFocus(host) }
    try {
      const start = await startSession(sessionId ? { sessionId }
        : { gameId: GAME_ID, variant: adHoc === 'run' ? 'run' : 'bike', debug: true, options: params.get('city') ? { city: params.get('city') } : undefined })
      platform = new Platform(start, (line) => console.log('citydash:', line))
      // (for the probes that drive it from outside: the platform end-to-end scripts)
      ;(window as unknown as { __platform?: unknown }).__platform = platform
      /*
       * THE RIDER IS THE PLAYER (owner, 2026-10-20: "in Trail trainer and cycle dash, the player avatar
       * should be YOUR specific avatar from dandyhorse, not a random one"). This replaces the random
       * body per load that used to be the gimmick here. Outside Dandyhorse, and for anybody who has
       * never made an avatar, the random rider is still what you get.
       */
      try {
        const who = await (await import('@dandyhorse/gamekit')).me()
        if (who?.avatar) playerAvatar = who.avatar as unknown as Record<string, unknown>
      } catch { /* a rider is decoration: a failure here must not cost somebody their session */ }
    } catch (e) {
      // say so, in the console's look, rather than sit on "loading…" for ever
      LoadingScreen.dismiss()
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
    LoadingScreen.dismiss()
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
  // the touch buttons (ui/touch.ts): made everywhere, shown while touch is the way in (`?touch=1|0` decides)
  if (params.get('touch') !== '0') {
    touchControls({ trainer: mode === 'trainer' })
    showTouchWhenUsed(params.get('touch'))
  }
  document.documentElement.classList.toggle('sr-compact', compactScreen(params.get('compact')))
  // (a URL parameter wins; then Menu → Settings, ui/settings.ts; then the device)
  const tier = detectTier(params.get('tier') ?? (settings().quality === 'auto' ? null : settings().quality))
  if (params.get('freeze') !== '1') beginRun(tier)
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
    // (a Dandyhorse launch first, then the address, then Menu → Settings → Graphics)
    time: platform?.time ?? (params.get('time') as 'dawn' | 'day' | 'dusk' | 'night') ?? (settings().time === 'auto' ? undefined : settings().time),
    weather: platform?.weather ?? (params.get('weather') as 'clear' | 'overcast' | 'rain') ?? (settings().weather === 'auto' ? undefined : settings().weather),
    advance: params.get('advance') ? Number(params.get('advance')) : undefined,
    // road traffic is ON by default since 2026-09-29 (the delivery game's gridlock); ?cars=0 turns it off
    cars: params.get('cars') !== '0' && settings().cars !== 'off',
    // ?input=fast (held arrows steer, the turn is taken at the corner) is the default; ?input=slow declares turns
    // ahead, for trainers — and is the default on Dandyhorse, where the phone's d-pad arrives on a 1 s poll
    // ?route=manual: deliveries are not routed for you (the default routes them, and takes the turns)
    route: params.get('route') === 'manual' ? 'manual' : 'auto',
    // ?tier=phone|desktop: how much the device can hold (src/tier.ts); phones and tablets are guessed
    // (a URL parameter wins; then Menu → Settings, ui/settings.ts; then the device and the mode)
    tier,
    input: params.get('input') === 'slow' || params.get('input') === 'fast' ? params.get('input') as 'fast' | 'slow'
      : settings().steering === 'held' ? 'fast' : settings().steering === 'junctions' ? 'slow' : MODES[mode].input,
    // couch, trainer or trainer debug (src/modes.ts); `?speedup=` overrides the mode's
    mode,
    speedup: params.get('speedup') ? Number(params.get('speedup')) : undefined,
    // ?veg=3 — how many times the baked count a closed wood grows to (render/infill.ts); ?vegmerge=0 turns
    // off the material and far-tier merging of BUGS.md #205, so the two can be measured against each other
    veg: params.get('veg') ? Number(params.get('veg')) : undefined,
    vegMerge: params.get('vegmerge') !== '0',
    turn: (params.get('turn') as 'left' | 'straight' | 'right') ?? undefined,
    platform: platform ?? undefined,
    playerAvatar: playerAvatar ?? undefined,
  })
}
