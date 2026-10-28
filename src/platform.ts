/**
 * Street Runner on Dandyhorse (INTEGRATION.md): the platform side of `Controls`. One instance per page, made in
 * main.ts only when the URL carries `?session=` (so the standalone game never loads the gamekit at all).
 *
 *   machine ─► getstate (1 Hz) ─► measured()         = power.actual / speed.actual, never what was asked
 *   d-pad on the phone ─► getstate.inputs ─► steering()   (a persistent prompt, open the whole session)
 *   game ─► setstate (1 Hz): grade (bike) or incline (treadmill), speed, x/y/z, score, custom
 *   game ─► putsave: { cities: { <id>: { at, travelled, visited } } }, every 5 s and on pagehide
 *
 * What the page gives back is a `GameLink` (game.ts calls `attach` once the rider is on the street): where the
 * rider is, how far they have come, the grade under them, and a picture for History.
 */
import {
  SessionClient, getStanding, putSave, menuPrompt, readMenuAnswer,
  type EndInfo, type GameState, type InputAnswer, type Json, type StartPayload, type TickBody,
} from '@dandyhorse/gamekit'
import type { Controls, Measured, Steer } from './controls.ts'
import { soloMessage, startRival, type RideNow, type RivalHud } from './rival.ts'
import { EndScreen, type EndRecord } from './ui/end-screen.ts'

/** the game's id on the platform (dandyhorse games/citydash/metadata.json) */
export const GAME_ID = 'citydash'
const PROMPT_ID = 'steer'
/** The d-pad's buttons and the turns they are (INTEGRATION.md §3): up is straight, down is turn round. */
const DPAD: Record<string, Steer> = { left: 'left', right: 'right', up: 'straight', down: 'back' }
const BUTTON: Record<Steer, string> = { left: 'left', right: 'right', straight: 'up', back: 'down' }
/** A reading older than this is no reading (the server pauses at 5 s; the ride should not coast on a ghost). */
const STALE_MS = 3000
/** Seconds of smoothing on the grade sent to the machine, at the 1 Hz tick. */
const GRADE_TAU = 2
const SAVE_EVERY_MS = 5000
/** How often the actions on offer are looked at, for the phone's buttons (a vehicle passing changes them). */
const ACTIONS_EVERY_MS = 500
/** the d-pad's own buttons; an action is never named like one (its label is its answer) */
const PAD = ['left', 'up', 'right', 'down']
/** what the server takes as one of a d-pad prompt's choices (dandyhorse lifecycle.py `_validate_prompt`): ≤ 40, ≤ 10 in all */
const LABEL_MAX = 40
const ACTIONS_MAX = 6

/** One thing the rider can do right now beyond steering (#304): offered as a button on the phone. */
export interface GameAction { id: string; label: string }

/** at most `max` characters, counted as the server counts them (code points: an emoji is never cut in half) */
export const clip = (s: string, max = LABEL_MAX): string => {
  const chars = Array.from(s)
  return chars.length <= max ? s : chars.slice(0, max - 1).join('') + '…'
}

/** What game.ts hands the platform. */
export interface GameLink {
  /** the city being ridden (a launch option; the save is kept per city) */
  city: string
  /** every frame's position: local metres (y up), lat/lon, the map edge under the rider, the street's name */
  where(): { x: number; y: number; z: number; lat: number; lon: number; edge: number; street?: string }
  /** the street's grade under the rider, rise over run */
  grade(): number
  /** the rider's speed, m/s (the bike's virtual speed; the belt on a treadmill) */
  speed(): number
  /** metres this session */
  travelled(): number
  /** how many streets the city has, for "every street" */
  streets: number
  /** a picture for History, 640×360 — asked for now and then, the latest one kept */
  screenshot(): Promise<string | null>
  /** what the rider can do right now besides steer — board or leave the transit, observe, eat the order (#304) */
  actions?(): GameAction[]
  /** …and do one of them (an id from `actions`) */
  act?(id: string): void
  /** open (true) or shut the big map; says whether it changed anything (#304: the map while paused) */
  showMap?(on: boolean): boolean
  /** the session's ride and deliveries, for the end screen (#303) */
  record?(): Omit<EndRecord, 'seconds'>
}

/** What is saved, per city. `at` rather than an edge id: a rebaked city renumbers its edges. */
interface CitySave { at: { lat: number; lon: number } | null; travelled: number; visited: number[] }
interface Save { cities: Record<string, CitySave> }

function parseSave(v: Json | null): Save {
  const cities = (v as { cities?: unknown } | null)?.cities
  const out: Record<string, CitySave> = {}
  if (cities && typeof cities === 'object') {
    for (const [id, c] of Object.entries(cities as Record<string, unknown>)) {
      const o = (c ?? {}) as Record<string, unknown>
      const at = o.at as { lat?: unknown; lon?: unknown } | undefined
      out[id] = {
        at: at && typeof at.lat === 'number' && typeof at.lon === 'number' ? { lat: at.lat, lon: at.lon } : null,
        travelled: typeof o.travelled === 'number' && Number.isFinite(o.travelled) ? o.travelled : 0,
        visited: Array.isArray(o.visited) ? o.visited.filter((n): n is number => typeof n === 'number') : [],
      }
    }
  }
  return { cities: out }
}

const option = (options: Json, key: string, allowed: readonly string[], fallback: string): string => {
  const v = (options as Record<string, unknown> | null)?.[key]
  return typeof v === 'string' && allowed.includes(v) ? v : fallback
}

export class Platform implements Controls {
  readonly start: StartPayload
  private readonly client: SessionClient
  private readonly log: (line: string) => void
  private latest: GameState | null = null
  private receivedAt = 0
  private endedInfo: EndInfo | null = null
  private link: GameLink | null = null
  private readonly queue: Steer[] = []
  private requested = 0
  private smoothGrade = 0
  private image: string | null = null
  private finishing = false
  /** a delivery on offer, shown on the phone as a menu beside the d-pad (`offer`), and what its two items do */
  private offering: { title: string; until: number; take: () => void; skip: () => void } | null = null
  private rev = 1
  /** the actions on the phone's buttons now, and when they were last looked at (#304) */
  private actions: GameAction[] = []
  private actionsAt = 0
  /** the map was opened because of a pause, so the end of the pause shuts it (#304) */
  private mapForPause = false
  /** somebody to ride against, and the voice that calls things out (dandyhorse PLAN.md §18.3) */
  private rival: RivalHud | null = null
  /** what this ride has counted so far, for the stats and the end-of-session line (§18.2) */
  private counted: RideNow = { elapsed: 0, distance: 0, deliveries: 0, earned: 0 }
  /** the end screen (#303), made before the game so its keys come first */
  private readonly endScreen: EndScreen | null = null
  private endWatch: { close: () => Promise<void>; stop: () => void } | null = null

  // achievements
  private readonly earned = new Set<string>()
  private readonly pending: string[] = []
  private sent: string[] = []

  // save
  private readonly save: Save
  private visited = new Set<number>()
  private lastSave = 0
  private readonly pauseCard: HTMLElement | null = null

  constructor(start: StartPayload, log: (line: string) => void) {
    this.start = start
    this.log = log
    this.save = parseSave(start.saveState)
    const mine = `${GAME_ID}:`
    for (const id of Object.keys(start.achievements ?? {})) if (id.startsWith(mine)) this.earned.add(id.slice(mine.length))
    this.client = new SessionClient({
      sessionId: start.sessionId,
      buildTick: () => this.buildTick(),
      onState: (s) => { this.latest = s; this.receivedAt = Date.now(); this.showPause() },
      onInput: (a) => this.onAnswer(a),
      onPause: (p) => { this.log(`paused: ${p.reason} — ${p.message}`); this.mapOnPause(true) },
      onResume: (secs) => { this.log(`resumed after ${secs.toFixed(0)} s`); this.mapOnPause(false) },
      onEnded: (e) => {
        this.endedInfo = e
        this.writeSave(true)
        this.log(`ended: ${e.status} (${e.reason ?? 'no reason'})`)
        this.showPause()
        if (e.status === 'complete') this.showEnd()
      },
      onError: (ctx, err) => this.log(`${ctx}: ${err instanceof Error ? err.message : String(err)}`),
      onTick: (ok) => { if (!ok) this.pending.unshift(...this.sent); this.sent = [] },
      sessionImage: () => this.image,
    })
    if (typeof document === 'undefined') return      // (the tests)
    this.pauseCard = document.createElement('div')
    this.pauseCard.className = 'sr-card sr-pause'
    // (high up: the map opens under it while paused, #304)
    this.pauseCard.style.cssText = 'position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:20;'
      + 'padding:22px 28px;font:600 18px/1.4 var(--font);max-width:min(460px,86vw);text-align:center;display:none'
    document.body.appendChild(this.pauseCard)
    this.endScreen = new EndScreen()
    addEventListener('pagehide', () => this.writeSave(true))
    addEventListener('keydown', (e) => this.key(e))
  }

  /**
   * THE KEYBOARD ON DANDYHORSE (#302, 2026-10-17). Standalone the arrows are LocalControls' (src/controls.ts), which is
   * never made on the platform, so a keyboard at the big screen could not steer at all. The same keys as standalone's
   * slow input, straight onto the queue (not through the server as the HUD's ↩ is: the key is here, not on a phone):
   * ← → turn, ↑ or S straight (cancels a turn asked for), U or Backspace turn round. The game's own keys (B, M, O, P,
   * Esc…) are game.ts's and need nothing here; the game's menu, while open, takes the arrows before this sees them.
   */
  private key(e: KeyboardEvent): void {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || !this.link || this.paused() || this.ended()) return
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return
    const s: Steer | undefined = ({ ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'straight', KeyS: 'straight', KeyU: 'back', Backspace: 'back' } as Record<string, Steer>)[e.code]
    if (!s) return
    if (e.code.startsWith('Arrow') || e.code === 'Backspace') e.preventDefault()
    if (e.repeat) return
    this.queue.push(s)
    if (s === 'left' || s === 'right') this.achievement('first-turn')
  }

  // --- what the launch chose --------------------------------------------------------------------

  get city(): string { return option(this.start.options, 'city', ['paris-centre', 'paris-marais', 'brooklyn-heights', 'chicago-loop', 'san-francisco'], 'san-francisco') }
  get traffic(): 'none' | 'some' | 'busy' { return option(this.start.options, 'traffic', ['none', 'some', 'busy'], 'some') as 'none' | 'some' | 'busy' }
  get time(): 'day' | 'dawn' | 'dusk' | 'night' { return option(this.start.options, 'time', ['day', 'dawn', 'dusk', 'night'], 'day') as 'day' }
  get weather(): 'clear' | 'overcast' | 'rain' { return option(this.start.options, 'weather', ['clear', 'overcast', 'rain'], 'clear') as 'clear' }
  get device(): 'bike' | 'treadmill' { return this.start.deviceType }
  /** which of the game's variants Dandyhorse launched (metadata.json): `bike`, or `tour` for tour mode (src/game/tour.ts) */
  get variant(): string { return this.start.variant }
  /**
   * The tour chosen in Dandyhorse's launch dialog (metadata.json option `tour`: a tour's id, or `free`), so a rider on a
   * trainer with only the phone's d-pad never has to work the in-game picker (src/ui/tour.ts); null: not chosen there.
   */
  get tourChoice(): string | null {
    const v = (this.start.options as Record<string, unknown> | null)?.tour
    return typeof v === 'string' && v ? v : null
  }
  /** where to pick up in this city: where the rider was last time */
  resumeAt(city: string): { lat: number; lon: number } | null { return this.save.cities[city]?.at ?? null }

  /** Called once the rider is on the street: the tick and poll loops start, and the steering prompt opens. */
  attach(link: GameLink): void {
    this.link = link
    this.visited = new Set(this.save.cities[link.city]?.visited ?? [])
    this.actions = this.currentActions()
    this.refreshPrompt()
    this.client.start()
    // A debug session is not recorded, so it is not raced either. Nothing waits on this: the ride begins
    // whether or not the platform has anybody to offer.
    if (!this.start.debug) {
      void startRival(this.start.sessionId, this.start.unitSystem, link.city,
                      this.start.requestedDuration, this.log)
        .then((r) => { this.rival = r })
        .catch((e) => this.log(`competitor: ${String(e)}`))
    }
    // a picture for History now and then, so the one sent at the end is recent without waiting for it then
    const snap = (): void => { void link.screenshot().then((img) => { if (img) this.image = img }) }
    setTimeout(snap, 20_000)
    setInterval(snap, 120_000)
  }

  /**
   * THE ONE PROMPT (dandyhorse: only one can be open), rebuilt whenever what it offers changes:
   * - the steering d-pad, always (INTEGRATION.md §3);
   * - the actions on offer (#304, 2026-10-17: "buttons for optional things like boarding transit or observing when
   *   available — remember this is likely to be the user's main control device"): extra buttons under the cross, a
   *   d-pad prompt's own `choices` (the bridge draws any choice that is not a d-pad button as a big button). The label
   *   is the answer, so `onAnswer` finds the action by it;
   * - a delivery on offer: then a MENU for the offer's life — "Take it" and "Skip" as big buttons, the actions after
   *   them, the d-pad beside, and the seconds until it is taken anyway.
   */
  private refreshPrompt(): void {
    if (!this.link || this.ended()) return
    const o = this.offering
    if (o) {
      this.client.openPrompt(menuPrompt(PROMPT_ID, ++this.rev, {
        title: o.title, countdown: Math.max(0, Math.round((o.until - Date.now()) / 1000)), buttons: ['left', 'up', 'right', 'down'],
        items: [{ id: 'take', label: '✅ Take it' }, { id: 'skip', label: '⏭️ Skip' }, ...this.actions.map((a) => ({ id: `act:${a.id}`, label: a.label }))],
      }))
      return
    }
    this.client.openPrompt({
      promptId: PROMPT_ID, prompt: 'Turn', persistent: true, layout: 'dpad',
      choices: [...PAD, ...this.actions.map((a) => a.label)],
    })
  }

  /** The actions on offer now, made safe for the prompt: short, distinct, never a d-pad button's name, six at most. */
  private currentActions(): GameAction[] {
    const out: GameAction[] = []
    for (const a of this.link?.actions?.() ?? []) {
      const label = clip(a.label)
      if (!label || PAD.includes(label) || out.some((b) => b.label === label || b.id === a.id)) continue
      out.push({ id: a.id, label })
      if (out.length === ACTIONS_MAX) break
    }
    return out
  }

  /**
   * TRAINER MODE (src/modes.ts): a delivery on offer, on the phone (`refreshPrompt`). `endOffer` puts the d-pad back.
   */
  offer(title: string, seconds: number, take: () => void, skip: () => void): void {
    if (!this.link) return
    this.offering = { title, until: Date.now() + seconds * 1000, take, skip }
    this.refreshPrompt()
  }

  endOffer(): void {
    if (!this.offering) return
    this.offering = null
    this.refreshPrompt()
  }

  /** While paused the game shows its map (#304); the pause's end shuts it again, if the pause opened it. */
  private mapOnPause(paused: boolean): void {
    const link = this.link
    if (!link?.showMap || this.ended()) return
    if (paused) this.mapForPause = link.showMap(true) || this.mapForPause
    else if (this.mapForPause) { this.mapForPause = false; link.showMap(false) }
  }

  // --- the end screen (#303) -----------------------------------------------------------------------

  /**
   * The session completed (the workout's time up, or End on a bridge): the summary over the city. The platform keeps
   * the game on screen meanwhile (dandyhorse PLAN.md §6.4.1, `capabilities.endScreen` in games/citydash/metadata.json);
   * Done here tells it so, and Done on a bridge (or its timeout) is heard through `watchEndScreen` and takes it down.
   */
  private showEnd(): void {
    const link = this.link
    const screen = this.endScreen
    if (screen?.isOpen || this.endWatch) return
    if (!link || !screen) {
      // ended before the rider was on the street (still loading): nothing to sum up, so let the bridges have the screen
      this.endWatch = this.client.watchEndScreen(() => {})
      void this.endWatch.close()
      return
    }
    this.client.closePrompt()
    const r = link.record?.() ?? { travelled: link.travelled(), deliveries: [], imperial: this.start.unitSystem !== 'metric' }
    const watch = this.client.watchEndScreen(() => { screen.hide(); this.log('end screen closed') })
    this.endWatch = watch
    screen.show({ ...r, seconds: this.elapsedSeconds() }, () => { void watch.close() })
    this.log(`end screen: ${r.deliveries.length} jobs, ${Math.round(r.travelled)} m`)
    // …and, once the platform has worked it out, where this ride stands among people at the same level
    // (dandyhorse PLAN.md §18.3). It is a line on an already-finished screen; nothing waits for it.
    void getStanding(this.start.sessionId)
      .then((st) => { if (st.rank !== null) screen.addStanding(st.rank, st.of, st.beaten) })
      .catch((e: unknown) => this.log(`standing: ${String(e)}`))
  }

  /** the end screen is up (for the probes) */
  get endScreenOpen(): boolean { return this.endScreen?.isOpen ?? false }

  // --- Controls -----------------------------------------------------------------------------------

  measured(): Measured {
    const s = this.latest
    if (!s || Date.now() - this.receivedAt > STALE_MS) return { power: null, speed: null, cadence: null, heartRate: null }
    return { power: s.power?.actual ?? null, speed: s.speed?.actual ?? null, cadence: s.cadence?.actual ?? null, heartRate: s.heartRate?.actual ?? null }
  }

  paused(): boolean { return this.client.paused }

  /** the platform keeps the clock, so pauses do not count */
  elapsedSeconds(): number {
    const s = this.latest
    if (!s) return 0
    const base = s.activeSeconds ?? Math.max(0, (s.elapsed ?? 0) - (s.pausedSeconds ?? 0))
    return s.sessionStatus === 'active' ? base + Math.max(0, Date.now() - this.receivedAt) / 1000 : base
  }

  request(gradePercent: number): void { this.requested = gradePercent }

  ended(): boolean { return this.endedInfo !== null }

  steering(): Steer[] { return this.queue.splice(0) }

  /** the game's own buttons (the HUD's ↩): answered to the server, so they come back the phone's way */
  press(s: Steer): void {
    if (this.paused()) return
    void this.client.answer(BUTTON[s])
  }

  // --- every frame, from the game -----------------------------------------------------------------

  /** the streets ridden, the achievements, the end of the workout */
  frame(): void {
    const link = this.link
    if (!link || this.finishing) return
    const w = link.where()
    if (!this.visited.has(w.edge)) this.visited.add(w.edge)
    if (link.travelled() >= 10_000) this.achievement('ten-km')
    if (link.streets > 0 && this.visited.size >= link.streets) this.achievement('every-street')
    if (Date.now() - this.lastSave > SAVE_EVERY_MS) this.writeSave(false)
    // the phone's action buttons follow what is on offer (a cable car pulling in, a tower coming near)
    if (Date.now() - this.actionsAt > ACTIONS_EVERY_MS && !this.ended()) {
      this.actionsAt = Date.now()
      const now = this.currentActions()
      if (now.map((a) => a.label).join('\n') !== this.actions.map((a) => a.label).join('\n')) {
        this.actions = now
        this.refreshPrompt()
      }
    }
    // the workout's length is up: a success wherever the rider happens to be (INTEGRATION.md §5)
    const want = this.start.requestedDuration
    if (want && this.elapsedSeconds() >= want && !this.ended()) this.finish()
  }

  private finish(): void {
    this.finishing = true
    this.writeSave(true)
    void (this.link?.screenshot() ?? Promise.resolve(null)).then((img) => {
      if (img) this.image = img
      return this.client.requestTick()
    }).then(() => {
      const message = this.rideMessage()
      this.rival?.remove()
      return this.client.end('complete', undefined, { message })
    })
  }

  // --- answers, pause -----------------------------------------------------------------------------

  private onAnswer(a: InputAnswer): void {
    if (a.promptId !== PROMPT_ID || this.paused()) return
    // the offer's two items, while it is on (a late tap on a closed offer does nothing)
    const r = readMenuAnswer(a)
    if (r.kind === 'item') {
      // (a tap aimed at an older list — an offer since gone, an action since changed — does nothing)
      if (r.rev !== null && r.rev !== this.rev) return
      const o = this.offering
      if (o && r.id === 'take') o.take()
      else if (o && r.id === 'skip') o.skip()
      else if (r.id.startsWith('act:')) this.link?.act?.(r.id.slice(4))
      else {
        // a d-pad prompt's extra button: its label is its answer
        const act = this.actions.find((x) => x.label === r.id)
        if (act) this.link?.act?.(act.id)
      }
      return
    }
    const s = DPAD[r.button]
    if (!s) return
    this.queue.push(s)
    if (s === 'left' || s === 'right') this.achievement('first-turn')
  }

  /** the server's own words while paused, as they are (docs/GAME_AUTHORING.md "Paused") */
  private showPause(): void {
    const msg = this.latest?.sessionStatus === 'paused' && !this.ended() ? this.latest.pause?.message ?? 'Paused' : null
    if (!this.pauseCard) return
    this.pauseCard.style.display = msg ? '' : 'none'
    if (msg && this.pauseCard.textContent !== msg) this.pauseCard.textContent = msg
  }

  // --- save, achievements -------------------------------------------------------------------------

  private writeSave(force: boolean): void {
    const link = this.link
    if (!link || this.start.debug) return
    if (!force && Date.now() - this.lastSave < SAVE_EVERY_MS) return
    this.lastSave = Date.now()
    const w = link.where()
    const before = this.save.cities[link.city]
    this.save.cities[link.city] = {
      at: { lat: Math.round(w.lat * 1e6) / 1e6, lon: Math.round(w.lon * 1e6) / 1e6 },
      travelled: (before?.travelled ?? 0) + link.travelled() - this.savedTravelled,
      visited: [...this.visited],
    }
    this.savedTravelled = link.travelled()
    void putSave(GAME_ID, this.start.variant, this.save as unknown as Json).catch((e: unknown) => this.log(`putsave: ${String(e)}`))
  }
  private savedTravelled = 0

  private achievement(id: string): void {
    if (this.earned.has(id)) return
    this.earned.add(id)
    this.pending.push(id)
  }

  // --- what the ride counted (dandyhorse PLAN.md §18.2) ---------------------------------------------

  /** The session's deliveries, pay, stars and bumps, from the record the game keeps. */
  private tally(): { deliveries: number; earned: number; stars: number; collisions: number } {
    const r = this.link?.record?.()
    const done = (r?.deliveries ?? []).filter((d) => d.outcome === 'delivered')
    const earned = done.reduce((n, d) => n + (d.dollars ?? 0), 0)
    const stars = done.length ? done.reduce((n, d) => n + (d.stars ?? 0), 0) / done.length : 0
    this.counted = {
      elapsed: this.elapsedSeconds(),
      distance: this.link?.travelled() ?? 0,
      deliveries: done.length,
      earned: Math.round(earned * 100) / 100,
    }
    return { deliveries: done.length, earned, stars: Math.round(stars * 10) / 10,
             collisions: r?.collisions ?? 0 }
  }

  /** The line this ride leaves on the player's timeline (dandyhorse PLAN.md §18.2). */
  private rideMessage(): string {
    const done = this.tally()
    const beside = this.rival?.verdict(this.counted, done.collisions)
    if (beside) return beside
    return soloMessage(this.counted, done.collisions, this.visited.size,
                       this.start.unitSystem !== 'metric', this.link?.record?.()?.place ?? null)
  }

  // --- setstate -----------------------------------------------------------------------------------

  private buildTick(): TickBody | null {
    const link = this.link
    if (!link) return null
    const w = link.where()
    // what the machine feels, smoothed; nothing while paused, so a device that reconnects starts still
    const target = this.paused() ? 0 : this.requested
    this.smoothGrade += (target - this.smoothGrade) * (1 - Math.exp(-1 / GRADE_TAU))
    const g = Math.round(this.smoothGrade * 10) / 10
    const body: TickBody = {
      // a bike asks for the grade and says its virtual speed, so the server integrates the distance; a treadmill
      // asks for incline (never below flat: most belts cannot) and never touches the belt's speed
      ...(this.device === 'bike' ? { grade: g, speed: link.speed() } : { incline: Math.max(0, g) }),
      x: w.x, y: w.y, z: w.z,
      score: Math.round(link.travelled()),
      route: link.city,
      custom: { street: w.street ?? null, streets: this.visited.size, of: link.streets },
    }
    // What the ride has counted (dandyhorse PLAN.md §18.2). The progress counters go in `custom` as well:
    // that is what a later rider's competitor box reads.
    const done = this.tally()
    body.custom = { ...body.custom, deliveries: done.deliveries, earned: Math.round(done.earned * 100) / 100 }
    this.client.countStats({
      deliveries: done.deliveries,
      earned: Math.round(done.earned * 100) / 100,
      stars: done.stars,
      collisions: done.collisions,
      streets: this.visited.size,
    })
    // The rival box rides on the 1 Hz tick: somebody else's past ride does not need a frame-rate update.
    this.rival?.update(this.counted)
    if (this.pending.length) { this.sent = this.pending.splice(0); body.achievements = this.sent }
    return body
  }
}
