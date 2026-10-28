/**
 * TOUR MODE (owner, 2026-10-27): no deliveries — a guided ride round the city. `?tour=1` (or Dandyhorse's `tour`
 * variant) opens the picker (ui/tour-picker.ts) before the city loads; the chosen tour starts the rider at its first
 * stop, and the GPS takes them to each stop in turn. The rider can still turn where they like — their own turn always
 * wins over the GPS's at a junction (game.ts `ownChoiceAt`), and the route is planned again from wherever they are.
 * As they near an announced stop its card comes up (ui/tour-card.ts). FREE RIDE is the same with no route: every
 * announced stop of every tour is a point of interest, and its card comes up as the rider passes.
 *
 * The tours are in src/city/sf/tours.ts; their lengths and climbs, measured on the baked graph by
 * tools/check-tours.ts, in src/city/sf/tour-stats.json (the picker is up before there is a graph to route on).
 */
import { SF_TOURS, type Tour, type TourStop } from '../city/sf/tours.ts'
import STATS from '../city/sf/tour-stats.json'

export type { Tour, TourStop }

/** the tours of a city, by its id (only San Francisco has any) */
export function toursFor(city: string): Tour[] {
  return city === 'san-francisco' ? SF_TOURS : []
}

export interface TourStats { km: number; climb: number; descent: number; steepest: number }
export const statsOf = (t: Tour): TourStats | null => (STATS as Record<string, TourStats>)[t.id] ?? null

export type Difficulty = 'Easy' | 'Moderate' | 'Hard' | 'Extreme'
/**
 * From the climb per kilometre (the Wharf 3 m/km, Golden Gate Park 8, the waterfront to Sausalito 11, the hills of
 * North Beach 26, Twin Peaks 34); a single steep leg (6 % or more, Hayes Street Hill) makes even a flat tour Moderate.
 */
export function difficultyOf(s: TourStats): Difficulty {
  const perKm = s.climb / Math.max(0.1, s.km)
  const d: Difficulty = perKm < 10 ? 'Easy' : perKm < 16 ? 'Moderate' : perKm < 30 ? 'Hard' : 'Extreme'
  return d === 'Easy' && s.steepest >= 6 ? 'Moderate' : d
}

/**
 * Minutes it takes in the game: a steady 18 km/h on the flat plus 10 minutes for every 100 m climbed, which is about
 * what a rider at 150-200 W does on the real streets — divided by the mode's speedup (modes.ts), which scales the
 * ground covered.
 */
export function minutesOf(s: TourStats, speedup: number): number {
  return (s.km / 18 * 60 + s.climb / 10) / Math.max(1, speedup)
}

type P = { x: number; z: number }
/** `n` its number among the announced stops (null: unannounced); `revisit` it is where an earlier stop was (a loop's end) */
export type StopAt = TourStop & P & { i: number; n: number | null; revisit: boolean }

export type GuideEvent =
  /** an announced stop is coming up: its card */
  | { kind: 'approach'; stop: StopAt }
  /** reached a stop: route on to `next` (null: that was the last) */
  | { kind: 'arrive'; stop: StopAt; next: StopAt | null; skipped: number }

/** within this many metres of the route's end, a stop is reached */
const ARRIVE = 30
/** an announced stop's card comes up this far out, along the route or as the crow flies */
const APPROACH_ROUTE = 140
const APPROACH_NEAR = 90

/**
 * One tour under way: which stop is next, and when its card comes up. The GPS's route to `target` is game.ts's; this
 * is told how far along it is left (`routeLeft`) and where the rider is, and says what happened.
 */
export class TourGuide {
  readonly stops: StopAt[]
  /** the stop being ridden to */
  next = 0
  private announced = -1
  readonly started = performance.now()

  constructor(readonly tour: Tour, toLocal: (ll: { lat: number; lon: number }) => P) {
    let n = 0
    const at = tour.stops.map((s) => toLocal(s))
    this.stops = tour.stops.map((s, i) => ({ ...s, ...at[i], i, n: s.text ? ++n : null,
      revisit: at.slice(0, i).some((q) => Math.hypot(q.x - at[i].x, q.z - at[i].z) < 150) }))
  }

  /** announced stops, for "3 of 7" */
  get count(): number { return this.stops.filter((s) => s.n !== null).length }
  get target(): StopAt | null { return this.stops[this.next] ?? null }
  get done(): boolean { return this.next >= this.stops.length }
  /** the next ANNOUNCED stop (the one the HUD counts towards) */
  get upcoming(): StopAt | null { return this.stops.slice(this.next).find((s) => s.n !== null) ?? null }

  /**
   * Each frame: `at` the rider, `routeLeft` the GPS's route length to the target (null between plans). A stop further
   * on reached first (the rider found their own way) counts, and the ones before it are skipped.
   */
  update(at: P, routeLeft: number | null, onGraph: P | null): GuideEvent[] {
    const out: GuideEvent[] = []
    const t = this.target
    if (!t) return out
    const end = onGraph ?? t
    const crow = Math.hypot(end.x - at.x, end.z - at.z)
    if (t.n !== null && this.announced !== t.i && ((routeLeft !== null && routeLeft < APPROACH_ROUTE) || crow < APPROACH_NEAR)) {
      this.announced = t.i
      out.push({ kind: 'approach', stop: t })
    }
    // (the route's end, not the stop: a monument in a park is reached at the nearest street to it)
    if ((routeLeft !== null && routeLeft < ARRIVE) || crow < ARRIVE * 0.7) {
      out.push(this.arrive(this.next))
      return out
    }
    // a later stop reached first — but not a loop's end, which is where the rider started (Angel Island: Ayala Cove)
    for (let j = this.next + 1; j < this.stops.length; j++) {
      const s = this.stops[j]
      if (!s.revisit && Math.hypot(s.x - at.x, s.z - at.z) < ARRIVE) {
        if (s.n !== null && this.announced !== s.i) { this.announced = s.i; out.push({ kind: 'approach', stop: s }) }
        out.push(this.arrive(j))
        break
      }
    }
    return out
  }

  /** Menu → Skip this stop */
  skip(): GuideEvent | null {
    return this.done ? null : this.arrive(this.next)
  }

  private arrive(j: number): GuideEvent {
    const skipped = j - this.next
    this.next = j + 1
    return { kind: 'arrive', stop: this.stops[j], next: this.target, skipped }
  }
}

/**
 * FREE RIDE's points of interest: every announced stop of every tour, once each by name. A card comes up as the
 * rider passes within `NEAR` of one, and not again until they have been well away from it.
 */
export class Sights {
  private readonly places: (TourStop & P)[] = []
  private readonly shown = new Set<string>()
  // (the farthest announced stop from a street it is ridden past is 108 m: the Palace of Fine Arts, across its lagoon)
  private static readonly NEAR = 130
  private static readonly AWAY = 400

  constructor(tours: Tour[], toLocal: (ll: { lat: number; lon: number }) => P) {
    const seen = new Set<string>()
    for (const t of tours) for (const s of t.stops) {
      if (!s.text || !s.name || seen.has(s.name)) continue
      // (a tour's own end-of-tour lines are not for somebody riding by)
      if (/^(Back at|The finish|Down to)/.test(s.name)) continue
      seen.add(s.name)
      this.places.push({ ...s, ...toLocal(s) })
    }
  }

  /** as if shown: the stop a tour just ended at, whose card is up already */
  seen(name: string | undefined): void { if (name) this.shown.add(name) }

  update(at: P): (TourStop & P) | null {
    let hit: (TourStop & P) | null = null
    for (const p of this.places) {
      const d = Math.hypot(p.x - at.x, p.z - at.z)
      if (d > Sights.AWAY) this.shown.delete(p.name!)
      else if (d < Sights.NEAR && !this.shown.has(p.name!)) { this.shown.add(p.name!); hit ??= p }
    }
    return hit
  }
}
