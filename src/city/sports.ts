/**
 * THE SPORTS-PITCH KIT — the fitting half (BUGS.md #214).
 *
 * The owner: *"we should have renderers for pickleball courts, tennis courts, basketball courts… they're all
 * essentially identical and geometric so that's an easy win"*. #214 counts 1,421 sports areas in the box and
 * makes the point that most of them are ONE object: a flat rectangle with painted lines. This file decides
 * WHERE that rectangle goes; `render/sports.ts` draws it.
 *
 * Two decisions live here and both come out of #214's cautions.
 *
 * **1. A court is fitted INSIDE the polygon, never stretched to it.** OSM traces are approximate and a
 * tennis court with the wrong aspect ratio reads worse than a plain green rectangle. So every sport has a
 * ladder of REAL, published dimensions; the fit picks the largest rung that fits the polygon's oriented
 * box, and if no rung fits it scales the smallest rung UNIFORMLY down. Proportion is never traded for size.
 *
 * **2. Orientation comes from the polygon's longest edge, not from north.** Measured on the San Francisco
 * cut, the court polygons are true rectangles — the 10th percentile of (polygon area / oriented-box area) is
 * 0.99 for basketball, tennis, pickleball and four-square — so the longest edge IS the court's long axis and
 * no minimum-area search is needed.
 *
 * **What the measurement changed about the plan.** Over the 660 `leisure=pitch` ways in the San Francisco
 * cut, oriented-box dimensions in metres (p10 / p50 / p90):
 *
 * | sport | n | length | width |
 * |---|---|---|---|
 * | basketball | 185 | 9.3 / **18.4** / 26.0 | 7.7 / **12.0** / 15.3 |
 * | four_square | 164 | 3.5 / **4.8** / 5.1 | 3.1 / **4.6** / 4.9 |
 * | tennis | 124 | 23.5 / **23.6** / 23.8 | 10.8 / **10.9** / 11.0 |
 * | pickleball | 25 | 13.3 / **13.4** / 13.5 | 6.0 / **6.0** / 6.2 |
 *
 * Tennis and pickleball are traced to the LINES, not to the fenced enclosure (23.77 x 10.97 and
 * 13.41 x 6.10 are the published courts, and those are the numbers in the data to a decimetre), so the kit
 * must NOT inset a run-off — it would draw a court visibly smaller than the asphalt it stands on. Basketball
 * is the opposite: park courts are every size from a driveway hoop to a full 28 x 15, the median is nothing
 * standard at all, and the uniform-scale path is the normal case for it rather than the fallback.
 *
 * Also measured: the p90 WIDTH of the tennis polygons is 11.0 m, i.e. one court each. There is no bank of
 * four courts in one polygon here, so nothing tiles courts inside a polygon and nothing should.
 *
 * Strip-safe on purpose: `tools/bake.ts` imports this under `node --experimental-strip-types`, so no
 * parameter properties, no enums, no decorators.
 */

/** The sports the `court` part draws. Everything else is left as the flat `pitch` area it is today. */
export type CourtSport = 'tennis' | 'pickleball' | 'padel' | 'american_football' | 'basketball' | 'four_square' | 'volleyball' | 'playground' | 'soccer' | 'rugby' | 'handball'

export interface CourtFit {
  sport: CourtSport
  /** centre, in local metres */
  x: number
  z: number
  /** the LONG axis: the court's length runs along (cos h, sin h) in (x, z) */
  heading: number
  /** the fitted court's own dimensions — already inside the polygon */
  len: number
  wid: number
  /** a half-court: one hoop, one key, and no centre line (basketball only) */
  half?: boolean
  /** a red clay (terre battue) surface instead of the hard court's green */
  clay?: boolean
}

/** A rung of the ladder: a real, published court. */
interface Size { len: number; wid: number; half?: boolean }

/**
 * The published dimensions, largest first. A sport's ladder is tried in order and the first rung that fits
 * the oriented box wins; the LAST rung is the one that gets scaled down when none fits, so it is always the
 * smallest sensible court for that sport.
 */
const LADDER: Record<CourtSport, Size[]> = {
  // ITF: 23.77 x 10.97 doubles. No singles-only rung — a singles court is the same rectangle with the
  // doubles alley unpainted, and OSM traces the doubles lines.
  tennis: [{ len: 23.77, wid: 10.97 }],
  // USAPA: 13.41 x 6.10, which is what all 25 of them measure.
  pickleball: [{ len: 13.41, wid: 6.10 }],
  // FIP: 20 x 10 inside the walls — and OSM traces padel to the walls, which are the court's edge
  padel: [{ len: 20, wid: 10 }],
  // NFL/NCAA/high school: 120 x 53 1/3 yd, the end zones included
  american_football: [{ len: 109.73, wid: 48.77 }],
  // FIBA 28 x 15, then the American high-school court (84 x 50 ft), then a half court (a full width, half
  // the length, which is how a park half-court is actually painted).
  basketball: [{ len: 28, wid: 15 }, { len: 25.6, wid: 15.24 }, { len: 14, wid: 15.24, half: true }],
  // the painted square is 16 ft on a side
  four_square: [{ len: 4.88, wid: 4.88 }],
  volleyball: [{ len: 18, wid: 9 }],
  // FIELD SPORTS (Cité universitaire, 2026-11-05): drawn only where a region names the pitch (`courtSports`), never
  // from OSM's tag alone — a city's worth of turf rectangles was never asked for. FIFA 105 x 68, then the common
  // 90 x 60 and a youth 64 x 45; a five-a-side 40 x 20 is the smallest rung.
  soccer: [{ len: 105, wid: 68 }, { len: 90, wid: 60 }, { len: 64, wid: 45 }, { len: 40, wid: 20 }],
  // World Rugby: 100 x 70 between the try lines (the in-goals beyond are left as the pitch area), then 94 x 68
  rugby: [{ len: 100, wid: 70 }, { len: 94, wid: 68 }, { len: 60, wid: 40 }],
  // IHF 40 x 20
  handball: [{ len: 40, wid: 20 }],
  // a playground is its own box, furnished to fit (render/playground.ts): no rungs, see `fitCourt`
  playground: [],
}

/**
 * OSM's `sport` is a `;`-separated list and a pitch may carry several. Take the first one the kit knows:
 * a `basketball;tennis` court is painted with both and drawing one of them is right, drawing neither is not.
 * `multi` is deliberately NOT mapped — a multi-use games area is whatever lines its owner painted, and
 * guessing basketball on it would put a hoop on a netball court as often as not.
 */
export function courtSport(sport: string | undefined, told = false): CourtSport | null {
  if (!sport) return null
  for (const raw of sport.split(';')) {
    const s = raw.trim().toLowerCase()
    // the field sports only on a region's word (see LADDER)
    if (told && (s === 'soccer' || s === 'rugby' || s === 'handball')) return s
    if (told && (s === 'rugby_league' || s === 'rugby_union')) return 'rugby'
    if (s === 'tennis' || s === 'pickleball' || s === 'padel' || s === 'american_football' || s === 'basketball' || s === 'four_square' || s === 'volleyball') return s
    // beach volleyball is the same rectangle with the same net; only the sand differs and the area kind
    // already says that
    if (s === 'beachvolleyball' || s === 'beach_volleyball') return 'volleyball'
  }
  return null
}

/** Shoelace, absolute: the polygon's area in square metres. */
export function ringArea(ring: { x: number; z: number }[]): number {
  let a = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    a += p.x * q.z - q.x * p.z
  }
  return Math.abs(a) / 2
}

/**
 * THE EXCLUSION (BUGS.md #214a). The owner: *"be careful since some courts are unique unusual landmarks,
 * like the Oracle Park baseball field of course, or probably the Polo Field."*
 *
 * Measured there: of 1,161 pitch/track/stadium areas only 78 (6%) are named and the median is 219 m², while
 * the Polo Field is 103,557 m² and Kezar Stadium 30,850. A landmark venue is two orders of magnitude bigger
 * than a tennis court, so the rule is a threshold rather than a list:
 *
 * **unnamed, under 5,000 m², and not `leisure=stadium`.**
 *
 * `enclosingName` is the name of a surrounding `leisure=sports_centre`/`stadium` polygon if one covers this
 * pitch — Beach Chalet Soccer Fields is a sports_centre with `courts=4` whose inner pitches are unnamed and
 * would otherwise slip through. Passing `undefined` means "nothing encloses it", NOT "not checked": see the
 * note in tools/bake.ts about the city query, which does not fetch sports_centre today.
 */
export const COURT_MAX_M2 = 5000

export function courtEligible(tags: Record<string, string>, areaM2: number, enclosingName?: string): boolean {
  if (tags.name || tags['name:en']) return false
  if (enclosingName) return false
  if (tags.leisure === 'stadium' || tags.stadium) return false
  if (!(areaM2 > 4) || areaM2 > COURT_MAX_M2) return false
  return true
}

/**
 * Fit a correctly-proportioned court inside `ring`, or `null` if nothing sensible fits.
 *
 * The oriented box is taken in the frame of the longest edge. A rung fits if it is inside that box with 2%
 * of slack (OSM decimetres, and a tennis court traced to 23.6 m must still get the 23.77 m court rather than
 * a scaled one). If no rung fits, the smallest rung is scaled UNIFORMLY — both dimensions by the same
 * factor, which is the whole point — and rejected below 0.3, where what is left is not a court but a
 * marking-shaped smear on a scrap of asphalt.
 */
export function fitCourt(ring: { x: number; z: number }[], sport: CourtSport): CourtFit | null {
  if (ring.length < 3) return null
  let best = -1
  let ang = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    const d = Math.hypot(q.x - p.x, q.z - p.z)
    if (d > best) { best = d; ang = Math.atan2(q.z - p.z, q.x - p.x) }
  }
  const c = Math.cos(-ang)
  const s = Math.sin(-ang)
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
  for (const p of ring) {
    const u = p.x * c - p.z * s
    const v = p.x * s + p.z * c
    if (u < u0) u0 = u
    if (u > u1) u1 = u
    if (v < v0) v0 = v
    if (v > v1) v1 = v
  }
  const du = u1 - u0
  const dv = v1 - v0
  if (!(du > 0.5) || !(dv > 0.5)) return null
  // the long axis of the box, whichever of the two it turned out to be
  const alongU = du >= dv
  const boxLen = alongU ? du : dv
  const boxWid = alongU ? dv : du
  // the box centre, back in local metres
  const mu = (u0 + u1) / 2
  const mv = (v0 + v1) / 2
  const x = mu * c + mv * s
  const z = -mu * s + mv * c
  const heading = alongU ? ang : ang + Math.PI / 2

  /*
   * A HALF COURT is painted at ONE END of the asphalt, under its hoop — never floating in the middle of the
   * slab, which is what centring it in a 18 m polygon (the measured median for basketball) produces. So it
   * is pushed along the long axis until its baseline, which is the end the builder puts the hoop on, meets
   * the end of the polygon's box.
   */
  const place = (len: number, wid: number, half?: boolean): CourtFit => {
    const shift = half ? (boxLen - len) / 2 : 0
    return {
      sport, x: x + shift * Math.cos(heading), z: z + shift * Math.sin(heading),
      heading, len, wid, ...(half ? { half: true } : {}),
    }
  }
  // a playground: the box itself, a metre in from its fence
  if (sport === 'playground') return boxLen > 4 && boxWid > 3 ? place(boxLen - 1, boxWid - 1) : null
  const rungs = LADDER[sport]
  const SLACK = 1.02
  for (const r of rungs) {
    if (r.len <= boxLen * SLACK && r.wid <= boxWid * SLACK) return place(r.len, r.wid, r.half)
  }
  const last = rungs[rungs.length - 1]
  const k = Math.min(boxLen / last.len, boxWid / last.wid)
  if (k < 0.3) return null
  return place(last.len * k, last.wid * k, last.half)
}

/** Gap between neighbouring courts in a bank, and the run-off kept clear at each baseline (m). */
export const BANK_GAP = 6
export const BANK_RUNOFF = 4

/**
 * A BANK of tennis courts traced as one polygon (Boulogne's club by the A13, 48.8479 2.2297: four courts in a
 * 70 x 34 m pitch, owner 2026-11-04). The courts stand side by side across the box's long axis, each court's
 * length along its short one. `null` when fewer than two fit — `fitCourt` keeps that polygon.
 */
export function tileCourts(ring: { x: number; z: number }[], sport: CourtSport): CourtFit[] | null {
  const one = fitCourt(ring, sport)
  if (!one || sport !== 'tennis') return null
  const L = 23.77, W = 10.97
  // the box again, in the fitted frame: its long axis along `one.heading`
  const c = Math.cos(one.heading), s = Math.sin(one.heading)
  let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity
  for (const p of ring) {
    const a = (p.x - one.x) * c + (p.z - one.z) * s
    const b = -(p.x - one.x) * s + (p.z - one.z) * c
    a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b)
  }
  const boxLen = a1 - a0, boxWid = b1 - b0
  if (boxWid < L + BANK_RUNOFF) return null
  const n = Math.floor((boxLen + BANK_GAP) / (W + BANK_GAP))
  if (n < 2) return null
  const step = boxLen / n
  const mb = (b0 + b1) / 2
  const out: CourtFit[] = []
  for (let i = 0; i < n; i++) {
    const a = a0 + step * (i + 0.5)
    out.push({ sport, x: one.x + a * c - mb * s, z: one.z + a * s + mb * c, heading: one.heading + Math.PI / 2, len: L, wid: W })
  }
  return out
}
