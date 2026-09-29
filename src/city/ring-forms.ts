/**
 * Score a building FOOTPRINT for forms the slot kit cannot express (PLAN.md §Soon.0, docs/LADDER.md §3c).
 *
 * This is the scoring half of `tools/ring-forms.ts`, lifted out unchanged so the BAKE can run it on every
 * building in every city instead of a person running it over one box by hand. The tool still exists and
 * still prints its report; it now imports these functions rather than owning them.
 *
 * The flag's meaning, and it is narrow: **the slot kit cannot express this building's form, so route it up
 * to from-scratch modelling** — treatment 4 or 5 in LADDER §3c. It is NOT a quality score and NOT a claim
 * that the building is interesting.
 *
 * What the scores mean (the semantics are `tools/ring-forms.ts`'s, deliberately unchanged):
 *
 *   ortho   fraction of vertices turning within `orthoDeg` of 0/90/180. The NEGATIVE filter and the most
 *           useful number here: downtown is full of 40-vertex outlines that are pure right-angle jogs —
 *           light wells, rear setbacks, party walls — and every one of those is kit-shaped. **Counting
 *           vertices is worthless**; this is why.
 *   arc     the longest run of >= `arcRun` consecutive vertices all turning the SAME way by
 *           `arcMinDeg`..`arcMaxDeg` ON EDGES UNDER `arcMaxEdge` m, in METRES of perimeter. Both halves
 *           matter: the angle window says "curving", the edge cap says "sampled". Without the cap a
 *           chamfered corner between two long walls (Fugazi Bank: five 1.3 m edges between a 45 m wall and
 *           a 33 m one) scores 52 m of arc.
 *   stair   the longest run of ALTERNATING near-right-angle turns on edges under `stairMaxMean` m that
 *           keeps turning overall (|net| > `stairMinNet` deg) — a curve some mapper digitised as a
 *           staircase. 101 California is a cylinder drawn as a hundred 1 m steps: it has NO arc at all and
 *           `ortho` calls it 0.75 orthogonal. Without this score the most obviously round building downtown
 *           is invisible. The run must be LONG (>= `stairMinRun`): an odd-length rear jog can sum to more
 *           than 60 deg of net turn by accident, and at 49 Stevenson Street one did.
 *   saw     the longest run of ALTERNATING turns > `altMinDeg` made of REGULAR teeth `sawMinMean`..
 *           `sawMaxMean` m across (>= `sawMinRun` of them, edge-length spread under `sawMaxCv`) that does
 *           NOT turn overall. The only footprint signature of per-BAY depth: a row of projecting bays cuts
 *           the outline into a square wave, and the kit varies depth per storey and never per bay.
 *
 * **Two limits, carried over from the sweep that measured this and NOT fixed here:**
 *
 * - **A new city's mapping conventions will differ.** OSM's *representation* of a curve varies far more than
 *   curves do, which is the whole reason `stair` exists. So every number lives in `RingFormThresholds` and
 *   a city can override any of them (`CitySpec.ringForms` in tools/cities.ts) — nothing is a constant
 *   buried in the scorer, and the bake prints the thresholds it used.
 * - **Per-bay depth is badly under-detected.** 555 California is visible only because a mapper happened to
 *   draw its bays; another building's bays are just as real and completely absent from its ring. This is a
 *   cheap first pass that catches the footprint-visible cases and **is not complete**.
 *
 * Nothing here scores twist, taper, a vaulted roof or a temple front. A footprint is one horizontal slice,
 * so a plan that changes with height is by construction not in it, and the other two sit on perfectly
 * ordinary rectangles. Those three need a photograph and this scan does not pretend to find them.
 */

/** A ring in LOCAL METRES, counter-clockwise or not (every score uses |turn| or sign consistency). */
export type MetreRing = { x: number; z: number }[]

export interface RingFormThresholds {
  /** a vertex is "orthogonal" if its turn is within this many degrees of 0, 90 or 180 */
  orthoDeg: number
  /** arc: the turn window that reads as "curving", in degrees */
  arcMinDeg: number
  arcMaxDeg: number
  /** arc: the edge-length cap that reads as "sampled", in metres (a chamfer is not a curve) */
  arcMaxEdge: number
  /** arc: how many consecutive same-way vertices it takes */
  arcRun: number
  /** every alternating run: the turn below which the run ends, in degrees */
  altMinDeg: number
  /** every alternating run: the shortest run worth measuring */
  altMinRun: number
  /** stair: mean edge length below this, in metres */
  stairMaxMean: number
  /** stair: at least this many steps */
  stairMinRun: number
  /** stair: |net turn| above this, in degrees — it has to go round something */
  stairMinNet: number
  /** stair: mean |turn| above this, in degrees — near-right-angle steps */
  stairMinSharp: number
  /** saw: tooth size window, in metres */
  sawMinMean: number
  sawMaxMean: number
  /** saw: at least this many teeth */
  sawMinRun: number
  /** saw: edge-length coefficient of variation below this — REGULAR teeth, not a rear light well */
  sawMaxCv: number
  /** saw: |net turn| below this, in degrees — a square wave, not a staircased curve */
  sawMaxNet: number
  /** the flag: `arc + stair` at or over this many metres is a curved plan */
  curvedM: number
  /** the flag: `saw` at or over this many metres is per-bay depth */
  sawM: number
  /** nothing shorter than this is scored at all, in metres of height */
  minHeight: number
  /** nothing with a shorter perimeter than this is scored at all, in metres */
  minPerimeter: number
}

/** The numbers the sweep of 621 downtown San Francisco buildings was run with. Do not retune casually. */
export const RING_FORMS: RingFormThresholds = {
  orthoDeg: 12,
  arcMinDeg: 6, arcMaxDeg: 45, arcMaxEdge: 8, arcRun: 4,
  altMinDeg: 30, altMinRun: 6,
  stairMaxMean: 2.5, stairMinRun: 16, stairMinNet: 60, stairMinSharp: 60,
  sawMinMean: 2, sawMaxMean: 6, sawMinRun: 10, sawMaxCv: 0.35, sawMaxNet: 60,
  curvedM: 8, sawM: 12,
  minHeight: 10, minPerimeter: 30,
}

export const thresholds = (over?: Partial<RingFormThresholds>): RingFormThresholds => ({ ...RING_FORMS, ...over })

export interface RingScores {
  /** how many vertices were scored (the closing vertex and zero-length edges are dropped) */
  n: number
  perimeter: number
  ortho: number
  /** metres of perimeter in the longest smooth curving run, and how many vertices that was */
  arc: number
  arcN: number
  /** metres of perimeter in the longest staircased curve, and how many steps */
  stair: number
  stairN: number
  /** metres of perimeter in the longest regular sawtooth, and how many teeth */
  saw: number
  sawN: number
}

/** Which score fired, if any. `arc + stair >= curvedM`, or `saw >= sawM`. */
export type RingFormScore = 'arc' | 'stair' | 'saw'

/**
 * What the bake writes onto the building: which score fired, and ALL of the values.
 *
 * Not a boolean, and not only the firing score: `arc + stair >= curvedM` can fire with neither alone over
 * the cut, so a single number would be ambiguous, and `arc`, `stair` and `saw` mean genuinely different
 * things — a later reader needs to know which one to trust. Carrying all four (`ortho` included, because it
 * is the negative filter) means the flag can be re-read against different thresholds without a re-bake.
 */
export interface RingForm {
  /** the largest contributor among the scores that fired */
  fired: RingFormScore
  arc: number
  stair: number
  saw: number
  /** 0–100 */
  ortho: number
}

/** signed turn at each vertex, in degrees, and the length of the edge arriving at it */
export function turns(ring: MetreRing): { turn: number; len: number }[] {
  const p = ring.slice()
  if (p.length > 1 && p[0].x === p.at(-1)!.x && p[0].z === p.at(-1)!.z) p.pop()
  const out: { turn: number; len: number }[] = []
  for (let i = 0; i < p.length; i++) {
    const a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length]
    const u = [b.x - a.x, b.z - a.z], v = [c.x - b.x, c.z - b.z]
    const lu = Math.hypot(u[0], u[1]), lv = Math.hypot(v[0], v[1])
    if (lu < 0.05 || lv < 0.05) continue
    const cross = u[0] * v[1] - u[1] * v[0], dot = u[0] * v[0] + u[1] * v[1]
    out.push({ turn: (Math.atan2(cross, dot) * 180) / Math.PI, len: lu })
  }
  return out
}

/** Every score for one ring, or null if it is too small or too simple to say anything about. */
export function scoreRing(ring: MetreRing, t: RingFormThresholds = RING_FORMS): RingScores | null {
  const ts = turns(ring)
  if (ts.length < 4) return null
  const perim = ts.reduce((s, x) => s + x.len, 0)
  if (perim < t.minPerimeter) return null

  const ortho = ts.filter((x) => {
    const a = Math.abs(x.turn)
    return a < t.orthoDeg || Math.abs(a - 90) < t.orthoDeg || Math.abs(a - 180) < t.orthoDeg
  }).length / ts.length

  // arc: longest same-sign run of gentle turns on SHORT edges
  let arcM = 0, arcN = 0
  for (let i = 0; i < ts.length; i++) {
    let j = i, sign = 0, len = 0, cnt = 0
    while (j < i + ts.length) {
      const x = ts[j % ts.length], a = Math.abs(x.turn)
      if (!(a > t.arcMinDeg && a < t.arcMaxDeg) || x.len > t.arcMaxEdge) break
      const s = Math.sign(x.turn)
      if (sign === 0) sign = s
      else if (s !== sign) break
      len += x.len; cnt++; j++
    }
    if (cnt >= t.arcRun && len > arcM) { arcM = len; arcN = cnt }
  }

  /** every maximal run of ALTERNATING turns, with its length, count, mean/spread of edge and net turning */
  const alt: { len: number; cnt: number; net: number; mean: number; cv: number; sharp: number }[] = []
  for (let i = 0; i < ts.length; i++) {
    let j = i, prev = 0, len = 0, net = 0
    const lens: number[] = [], angs: number[] = []
    while (j < i + ts.length) {
      const x = ts[j % ts.length]
      if (Math.abs(x.turn) < t.altMinDeg) break
      const s = Math.sign(x.turn)
      if (prev !== 0 && s === prev) break
      prev = s; len += x.len; net += x.turn; lens.push(x.len); angs.push(Math.abs(x.turn)); j++
    }
    if (lens.length < t.altMinRun) continue
    const mean = len / lens.length
    const cv = Math.sqrt(lens.reduce((s, l) => s + (l - mean) ** 2, 0) / lens.length) / mean
    alt.push({ len, cnt: lens.length, net, mean, cv, sharp: angs.reduce((s, a) => s + a, 0) / angs.length })
  }

  let stairM = 0, stairN = 0
  for (const a of alt) {
    if (a.mean < t.stairMaxMean && a.cnt >= t.stairMinRun && Math.abs(a.net) > t.stairMinNet
      && a.sharp > t.stairMinSharp && a.len > stairM) { stairM = a.len; stairN = a.cnt }
  }

  let sawM = 0, sawN = 0
  for (const a of alt) {
    if (a.mean >= t.sawMinMean && a.mean <= t.sawMaxMean && a.cnt >= t.sawMinRun && a.cv < t.sawMaxCv
      && Math.abs(a.net) < t.sawMaxNet && a.len > sawM) { sawM = a.len; sawN = a.cnt }
  }

  return { n: ts.length, perimeter: perim, ortho, arc: arcM, arcN, stair: stairM, stairN, saw: sawM, sawN }
}

/** Does this ring's scores clear the cuts, and which one fired hardest? */
export function firedBy(s: RingScores, t: RingFormThresholds = RING_FORMS): RingFormScore | null {
  const curved = s.arc + s.stair >= t.curvedM
  const saw = s.saw >= t.sawM
  if (!curved && !saw) return null
  // the largest contributor, scaled by its own cut so `saw` and `arc` are comparable
  const by: [RingFormScore, number][] = []
  if (curved) by.push(['arc', s.arc / t.curvedM], ['stair', s.stair / t.curvedM])
  if (saw) by.push(['saw', s.saw / t.sawM])
  return by.sort((a, b) => b[1] - a[1])[0][0]
}

/**
 * The whole stage, for one building: score the ring and return the flag, or null.
 *
 * `height` is the gate — below `minHeight` nothing is scored, because a curved bike shed is not worth a
 * model. Pass the OWNER's height and the OWNER's ring for a `building:part`, which is what the bake does.
 */
export function ringForm(ring: MetreRing, height: number | undefined, t: RingFormThresholds = RING_FORMS): RingForm | null {
  if (!(height !== undefined && height >= t.minHeight)) return null
  const s = scoreRing(ring, t)
  if (!s) return null
  const fired = firedBy(s, t)
  if (!fired) return null
  return {
    fired,
    arc: Math.round(s.arc), stair: Math.round(s.stair), saw: Math.round(s.saw),
    ortho: Math.round(s.ortho * 100),
  }
}
