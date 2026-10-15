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
  SessionClient, putSave, menuPrompt, readMenuAnswer,
  type EndInfo, type GameState, type InputAnswer, type Json, type StartPayload, type TickBody,
} from '@dandyhorse/gamekit'
import type { Controls, Measured, Steer } from './controls.ts'

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
  private offering: { take: () => void; skip: () => void } | null = null
  private rev = 1

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
      onPause: (p) => this.log(`paused: ${p.reason} — ${p.message}`),
      onResume: (secs) => this.log(`resumed after ${secs.toFixed(0)} s`),
      onEnded: (e) => { this.endedInfo = e; this.writeSave(true); this.log(`ended: ${e.status} (${e.reason ?? 'no reason'})`) },
      onError: (ctx, err) => this.log(`${ctx}: ${err instanceof Error ? err.message : String(err)}`),
      onTick: (ok) => { if (!ok) this.pending.unshift(...this.sent); this.sent = [] },
      sessionImage: () => this.image,
    })
    if (typeof document === 'undefined') return      // (the tests)
    this.pauseCard = document.createElement('div')
    this.pauseCard.className = 'sr-card sr-pause'
    this.pauseCard.style.cssText = 'position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);z-index:20;'
      + 'padding:22px 28px;font:600 18px/1.4 var(--font);max-width:min(460px,86vw);text-align:center;display:none'
    document.body.appendChild(this.pauseCard)
    addEventListener('pagehide', () => this.writeSave(true))
  }

  // --- what the launch chose --------------------------------------------------------------------

  get city(): string { return option(this.start.options, 'city', ['paris-centre', 'paris-marais', 'brooklyn-heights', 'chicago-loop', 'san-francisco'], 'san-francisco') }
  get traffic(): 'none' | 'some' | 'busy' { return option(this.start.options, 'traffic', ['none', 'some', 'busy'], 'some') as 'none' | 'some' | 'busy' }
  get time(): 'day' | 'dawn' | 'dusk' | 'night' { return option(this.start.options, 'time', ['day', 'dawn', 'dusk', 'night'], 'day') as 'day' }
  get weather(): 'clear' | 'overcast' | 'rain' { return option(this.start.options, 'weather', ['clear', 'overcast', 'rain'], 'clear') as 'clear' }
  get device(): 'bike' | 'treadmill' { return this.start.deviceType }
  /** where to pick up in this city: where the rider was last time */
  resumeAt(city: string): { lat: number; lon: number } | null { return this.save.cities[city]?.at ?? null }

  /** Called once the rider is on the street: the tick and poll loops start, and the steering prompt opens. */
  attach(link: GameLink): void {
    this.link = link
    this.visited = new Set(this.save.cities[link.city]?.visited ?? [])
    this.openSteer()
    this.client.start()
    // a picture for History now and then, so the one sent at the end is recent without waiting for it then
    const snap = (): void => { void link.screenshot().then((img) => { if (img) this.image = img }) }
    setTimeout(snap, 20_000)
    setInterval(snap, 120_000)
  }

  private openSteer(): void {
    this.client.openPrompt({ promptId: PROMPT_ID, prompt: 'Turn', choices: ['left', 'up', 'right', 'down'], persistent: true, layout: 'dpad' })
  }

  /**
   * TRAINER MODE (src/modes.ts): a delivery on offer, on the phone. Only one prompt can be open, so the steering
   * d-pad becomes a MENU for the offer's life — "Take it" and "Skip" as big buttons, the same d-pad beside them,
   * and the seconds until it is taken anyway. `endOffer` puts the plain d-pad back.
   */
  offer(title: string, seconds: number, take: () => void, skip: () => void): void {
    if (!this.link) return
    this.offering = { take, skip }
    this.client.openPrompt(menuPrompt(PROMPT_ID, ++this.rev, {
      title, countdown: seconds, buttons: ['left', 'up', 'right', 'down'],
      items: [{ id: 'take', label: '✅ Take it' }, { id: 'skip', label: '⏭️ Skip' }],
    }))
  }

  endOffer(): void {
    if (!this.offering) return
    this.offering = null
    if (this.link) this.openSteer()
  }

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
    }).then(() => this.client.end('complete'))
  }

  // --- answers, pause -----------------------------------------------------------------------------

  private onAnswer(a: InputAnswer): void {
    if (a.promptId !== PROMPT_ID || this.paused()) return
    // the offer's two items, while it is on (a late tap on a closed offer does nothing)
    const r = readMenuAnswer(a)
    if (r.kind === 'item') {
      const o = this.offering
      if (o && r.id === 'take') o.take()
      else if (o && r.id === 'skip') o.skip()
      return
    }
    const s = DPAD[r.button]
    if (!s) return
    this.queue.push(s)
    if (s === 'left' || s === 'right') this.achievement('first-turn')
  }

  /** the server's own words while paused, as they are (docs/GAME_AUTHORING.md "Paused") */
  private showPause(): void {
    const msg = this.latest?.sessionStatus === 'paused' ? this.latest.pause?.message ?? 'Paused' : null
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
    if (this.pending.length) { this.sent = this.pending.splice(0); body.achievements = this.sent }
    return body
  }
}
