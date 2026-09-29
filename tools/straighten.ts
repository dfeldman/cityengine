/**
 * Straightening the ordinary crossing (BUGS.md #183).
 *
 * The owner, 2026-09-24: *"the majority are 90 degree intersections between two streets though, and OSM
 * messes those up all the time, with weird zigzags on both paths."*
 *
 * A plain crossing of two straight streets SHOULD be four collinear approaches meeting at one point. What
 * OSM gives instead, very often, is a junction node a metre or two off where the two street axes actually
 * cross, with a short jitter vertex either side of it on each approach — each error small, the effect at
 * rider height a visible wiggle entering and leaving every corner. `rideStats().nearDuplicates` counts it
 * directly.
 *
 * So, per junction node, and entirely from measurement:
 *   1. collect the ARMS — the roadway ways running off it (footways do not vote: a marked crossing sits at
 *      every corner of an American grid and would turn each four-way into an eight-arm star);
 *   2. require two axes: arms pairing off at 180°±`OPPOSITE` and the two pairs crossing at 90°±`SQUARE`;
 *   3. fit a line to each arm's STRAIGHT RUN — from `JITTER` out to `RUN` metres — and reject the junction
 *      if any run bends away from its own fit by more than `BEND`. **This is the test that protects a street
 *      that genuinely curves**, and it is the one worth sweeping;
 *   4. intersect the two fitted axes analytically and move the junction there, but only if the move is under
 *      `MOVE` — a larger offset is a real feature of the place, not jitter;
 *   5. delete the jitter vertices within `JITTER` of it, so each approach runs straight into the corner.
 *
 * Anything that fails any of those is LEFT ALONE. Complex junctions — the Market Street diagonal, freeway
 * ramp complexes, a fork, a slip lane — fail at step 2 or 3 and must: forcing them straight would be a lie
 * about the place, and they are the minority.
 *
 * Region-independent by construction: there is not a city name in this file. It runs before the ways are
 * split at their shared nodes (tools/bake.ts), so the straightened geometry reaches the ride graph, the
 * street surfaces and the facades alike.
 */
import type { LatLon, Point } from '../src/city/geo.ts'

export interface StraightenWay {
  id: number
  nodes: number[]
  geometry: LatLon[]
  tags: Record<string, string>
}

export interface StraightenOpts {
  /** how far from 180° two arms may be and still count as one axis, degrees */
  opposite?: number
  /** how far from 90° the two axes may cross, degrees */
  square?: number
  /** the radius the junction's jitter lives in: vertices inside it go, and the straight run starts outside it */
  jitter?: number
  /** how much of each arm, beyond `jitter`, the axis is fitted to, metres */
  run?: number
  /** an arm whose run deviates from its own straight fit by more than this is a real bend: leave the junction */
  bend?: number
  /** the furthest the junction may be moved; beyond this the offset is a feature, not jitter */
  move?: number
}

export const DEFAULTS: Required<StraightenOpts> = {
  opposite: 12, square: 12, jitter: 6, run: 30, bend: 1.0, move: 4,
}

export interface StraightenStats {
  /** junction nodes examined (shared by two or more roadway ways) */
  junctions: number
  /** four-arm crossings straightened, and three-arm tees */
  crossings: number
  tees: number
  /** vertices deleted, and shared vertices projected onto the axis instead */
  removed: number
  projected: number
  /** total junction movement, metres, and the largest single move */
  moved: number
  maxMove: number
  /** why the rest were declined */
  declined: {
    /** not 3 or 4 roadway arms: a star, a fork, a ramp complex */
    arms: number
    /** arms do not pair off into two straight axes crossing near 90° */
    axes: number
    /** an arm's run is too short to fit a line to (another junction within a few metres) */
    short: number
    /** an arm genuinely bends: a curving street, left alone */
    bend: number
    /** the axes cross further than `move` from the mapped node: a real offset, left alone */
    far: number
  }
  /** pairs of junction nodes under 8 m apart on the same ways — "the halves split at different places",
   * which is node MERGING and is not attempted here. Counted so it is known what is left. */
  twinned: number
}

/** one junction's measurements, for the tolerance table: what it would take to accept it */
export interface JunctionRow {
  arms: number
  /** worst |180° − angle| over the arm pairs, degrees: how far from collinear the two halves are */
  opposite: number
  /** |90° − angle| between the two axes, degrees */
  square: number
  /** how far the mapped node is from where the axes actually cross, metres */
  move: number
  /** worst deviation of any arm's run from its own straight fit, metres */
  bend: number
  /** the LATERAL offset between the two halves of a street — the zigzag itself, metres */
  lateral: number
  /** where it is, in local metres */
  at: Point
}

const DEG = Math.PI / 180

/*
 * What does NOT vote on what a junction's axes are. The footways first — a marked crossing sits at every
 * corner of an American grid and would turn each four-way into an eight-arm star — and the SERVICE ways with
 * them: measured, 1400 of San Francisco's 2200 sub-12-metre junction gaps are a driveway or a parking aisle
 * joining a street a few metres from the corner, and each one both stopped the straight run short and added
 * a fifth arm. Neither is a street; a vertex on one is still MOVED with the junction.
 */
const isFoot = (t: Record<string, string>): boolean =>
  t.highway === 'service' ||
  t.highway === 'footway' || t.highway === 'path' || t.highway === 'pedestrian' || t.highway === 'steps'
  || t.highway === 'track' || t.highway === 'bridleway' || t.highway === 'cycleway'
  || t.footway !== undefined || t.crossing !== undefined

/** a bridge or a tunnel is a different level: the street crossing over one is not a junction with it */
const onGrade = (t: Record<string, string>): boolean =>
  (t.layer === undefined || t.layer === '0') && (!t.bridge || t.bridge === 'no')
  && (!t.tunnel || t.tunnel === 'no' || t.tunnel === 'building_passage')

const angleBetween = (a: number, b: number): number => {
  let d = Math.abs(a - b) % (2 * Math.PI)
  if (d > Math.PI) d = 2 * Math.PI - d
  return d
}

interface Occurrence { way: StraightenWay; idx: number }

/** one arm: where it leaves the junction, its fitted axis direction, and how straight its run was */
interface Arm { bearing: number; dir: Point; at: Point; pts: Point[]; ok: boolean; short: boolean; bent: boolean }

/**
 * Fit a direction to the arm's run: the vertices from `jitter` to `jitter + run` metres out along it,
 * stopping at the next junction node. Returns the unit direction (pointing AWAY from the junction), the last
 * fitted point, and whether the run was long enough and straight enough.
 */
function armAxis(occ: Occurrence, step: 1 | -1, at: Point, isJunction: (id: number) => boolean,
                 pos: (id: number) => Point, o: Required<StraightenOpts>): Arm {
  const pts: Point[] = []
  let d = 0
  let prev = at
  for (let i = occ.idx + step; i >= 0 && i < occ.way.nodes.length; i += step) {
    const p = pos(occ.way.nodes[i])
    d += Math.hypot(p.x - prev.x, p.z - prev.z)
    prev = p
    if (d >= o.jitter) pts.push(p)
    // the run stops at the next junction: past it the street is someone else's problem
    if (d > o.jitter + o.run || (pts.length > 0 && isJunction(occ.way.nodes[i]))) break
    if (pts.length === 0 && isJunction(occ.way.nodes[i])) break
  }
  const bearingOf = (p: Point): number => Math.atan2(p.x - at.x, p.z - at.z)
  if (pts.length === 0) {
    return { bearing: 0, dir: { x: 0, z: 0 }, at, pts, ok: false, short: true, bent: false }
  }
  const far = pts[pts.length - 1]
  const span = Math.hypot(far.x - at.x, far.z - at.z)
  // a run shorter than the jitter radius plus a few metres cannot say what the street's axis is
  if (span < o.jitter + 4) return { bearing: bearingOf(far), dir: { x: 0, z: 0 }, at, pts, ok: false, short: true, bent: false }
  const near = pts[0]
  const dx = far.x - near.x
  const dz = far.z - near.z
  const len = Math.hypot(dx, dz)
  if (len < 1e-6) return { bearing: bearingOf(far), dir: { x: 0, z: 0 }, at, pts, ok: false, short: true, bent: false }
  const dir = { x: dx / len, z: dz / len }
  // does the run itself bend? every fitted vertex's distance from the near→far line
  let worst = 0
  for (const p of pts) {
    const off = Math.abs((p.x - near.x) * dir.z - (p.z - near.z) * dir.x)
    if (off > worst) worst = off
  }
  const bent = worst > o.bend
  return { bearing: Math.atan2(dir.x, dir.z), dir, at: near, pts, ok: !bent, short: false, bent }
}

/** where two lines (point + unit direction) cross, or null if they are near parallel */
function cross(a: { at: Point; dir: Point }, b: { at: Point; dir: Point }): Point | null {
  const det = a.dir.x * -b.dir.z - -b.dir.x * a.dir.z
  if (Math.abs(det) < 1e-6) return null
  const rx = b.at.x - a.at.x
  const rz = b.at.z - a.at.z
  const t = (rx * -b.dir.z - -b.dir.x * rz) / det
  return { x: a.at.x + a.dir.x * t, z: a.at.z + a.dir.z * t }
}

/**
 * Straighten the ordinary crossings, in place (unless `dryRun`). Returns what it did — or, dry, what it
 * WOULD do, which is how the tolerance table in BUGS.md #183 was counted before anything was changed.
 */
export function straightenJunctions(
  ways: StraightenWay[],
  proj: { toLocal: (g: LatLon) => Point; toLatLon: (p: Point) => LatLon },
  opts: StraightenOpts & { dryRun?: boolean; record?: (r: JunctionRow) => void } = {},
): StraightenStats {
  const o = { ...DEFAULTS, ...opts }
  const st: StraightenStats = {
    junctions: 0, crossings: 0, tees: 0, removed: 0, projected: 0, moved: 0, maxMove: 0,
    declined: { arms: 0, axes: 0, short: 0, bend: 0, far: 0 }, twinned: 0,
  }
  const usable = ways.filter((w) => w.nodes.length >= 2 && w.geometry.length === w.nodes.length)
  // one position per node id, however many ways carry it: OSM duplicates the coordinates per way
  const pos = new Map<number, Point>()
  const where = new Map<number, Occurrence[]>()
  const roadUse = new Map<number, number>()
  for (const w of usable) {
    const road = !isFoot(w.tags) && onGrade(w.tags)
    for (let i = 0; i < w.nodes.length; i++) {
      const id = w.nodes[i]
      if (!pos.has(id)) pos.set(id, proj.toLocal(w.geometry[i]))
      const list = where.get(id)
      if (list) list.push({ way: w, idx: i })
      else where.set(id, [{ way: w, idx: i }])
      if (road) roadUse.set(id, (roadUse.get(id) ?? 0) + 1)
    }
  }
  const at = (id: number): Point => pos.get(id)!
  // a junction, for the purpose of where an arm's run must stop: any node two roadway ways share, or that a
  // roadway way passes through twice
  const isJunction = (id: number): boolean => (roadUse.get(id) ?? 0) > 1
  const roadway = (w: StraightenWay): boolean => !isFoot(w.tags) && onGrade(w.tags)

  for (const [id, occs] of where) {
    if (!isJunction(id)) continue
    st.junctions++
    const here = at(id)
    // the arms: two from a way passing through, one from a way ending here
    const arms: Arm[] = []
    let overCount = false
    for (const occ of occs) {
      if (!roadway(occ.way)) continue
      for (const step of [1, -1] as const) {
        const j = occ.idx + step
        if (j < 0 || j >= occ.way.nodes.length) continue
        if (arms.length >= 5) { overCount = true; break }
        arms.push(armAxis(occ, step, here, isJunction, at, o))
      }
      if (overCount) break
    }
    if (overCount || arms.length < 3 || arms.length > 4) { st.declined.arms++; continue }
    if (arms.some((a) => a.short)) { st.declined.short++; continue }
    if (opts.record) opts.record(diagnose(arms, here))
    if (arms.some((a) => a.bent)) { st.declined.bend++; continue }

    // pair the arms into axes: near-opposite bearings
    const OPP = o.opposite * DEG
    const SQ = o.square * DEG
    const pairs: Arm[][] = []
    const used = new Set<number>()
    for (let i = 0; i < arms.length; i++) {
      if (used.has(i)) continue
      let best = -1
      let bestErr = OPP
      for (let j = i + 1; j < arms.length; j++) {
        if (used.has(j)) continue
        const err = Math.abs(Math.PI - angleBetween(arms[i].bearing, arms[j].bearing))
        if (err < bestErr) { bestErr = err; best = j }
      }
      if (best >= 0) { pairs.push([arms[i], arms[best]]); used.add(i); used.add(best) }
    }
    const singles = arms.filter((_, i) => !used.has(i))
    // a four-arm crossing is two axes; a tee is one axis plus a stem
    let axisA: { at: Point; dir: Point } | null = null
    let axisB: { at: Point; dir: Point } | null = null
    let tee = false
    if (arms.length === 4 && pairs.length === 2 && singles.length === 0) {
      axisA = fit(pairs[0])
      axisB = fit(pairs[1])
    } else if (arms.length === 3 && pairs.length === 1 && singles.length === 1) {
      axisA = fit(pairs[0])
      axisB = fit([singles[0]])
      tee = true
    } else { st.declined.axes++; continue }
    if (!axisA || !axisB) { st.declined.axes++; continue }
    // …crossing near a right angle, or it is a skewed junction (Market Street) and not this algorithm's
    const between = angleBetween(Math.atan2(axisA.dir.x, axisA.dir.z), Math.atan2(axisB.dir.x, axisB.dir.z))
    const off90 = Math.abs(Math.PI / 2 - Math.min(between, Math.PI - between))
    if (off90 > SQ) { st.declined.axes++; continue }

    const hit = cross(axisA, axisB)
    if (!hit) { st.declined.axes++; continue }
    const move = Math.hypot(hit.x - here.x, hit.z - here.z)
    if (move > o.move) { st.declined.far++; continue }

    if (tee) st.tees++
    else st.crossings++
    st.moved += move
    st.maxMove = Math.max(st.maxMove, move)
    if (opts.dryRun) continue

    // ---- move the junction, in every way that carries it
    pos.set(id, hit)
    const ll = proj.toLatLon(hit)
    for (const occ of where.get(id)!) occ.way.geometry[occ.idx] = ll

    // ---- and the jitter either side of it: an unshared vertex within `jitter` goes; a SHARED one (a marked
    // crossing's node, a driveway) is projected onto the axis instead, so nothing is disconnected
    for (const occ of occs) {
      if (!roadway(occ.way)) continue
      for (const step of [1, -1] as const) {
        // walk out from the junction; the arm's axis is whichever of the two this direction belongs to
        const first = occ.idx + step
        if (first < 0 || first >= occ.way.nodes.length) continue
        const p0 = at(occ.way.nodes[first])
        const axis = pickAxis(hit, p0, axisA, axisB)
        const doomed: number[] = []
        let d = 0
        let prev = hit
        for (let i = first; i >= 0 && i < occ.way.nodes.length; i += step) {
          const nid = occ.way.nodes[i]
          const p = at(nid)
          d += Math.hypot(p.x - prev.x, p.z - prev.z)
          prev = p
          if (d > o.jitter) break
          // never the way's own last vertex — a way must keep its ends — and never another junction
          if (i === 0 || i === occ.way.nodes.length - 1) continue
          if (isJunction(nid)) {
            // shared: keep the node, put it on the axis
            const t = (p.x - hit.x) * axis.dir.x + (p.z - hit.z) * axis.dir.z
            const q = { x: hit.x + axis.dir.x * t, z: hit.z + axis.dir.z * t }
            if (Math.hypot(q.x - p.x, q.z - p.z) > 1e-3) {
              pos.set(nid, q)
              const qll = proj.toLatLon(q)
              for (const oc of where.get(nid)!) oc.way.geometry[oc.idx] = qll
              st.projected++
            }
            continue
          }
          if ((where.get(nid) ?? []).length > 1) continue
          doomed.push(i)
        }
        if (doomed.length && occ.way.nodes.length - doomed.length >= 2) {
          // descending, so the surviving indices do not shift under us; and `nodes` and `geometry` together,
          // because the bake's street filter requires them the same length
          const gone: number[] = []
          for (const i of doomed.sort((a, b) => b - a)) {
            gone.push(occ.way.nodes[i])
            occ.way.nodes.splice(i, 1)
            occ.way.geometry.splice(i, 1)
            st.removed++
          }
          // every occurrence index past a deletion is now wrong: rebuild this way's entries
          reindex(occ.way, where, gone)
        }
      }
    }
  }

  // what is LEFT: two junction nodes a few metres apart on the same way — the halves of a street split at
  // slightly different places. That is node merging, not node moving, and is not attempted here.
  const junctions = [...where.keys()].filter(isJunction)
  const cell = new Map<string, number[]>()
  const key = (p: Point): string => `${Math.floor(p.x / 8)},${Math.floor(p.z / 8)}`
  for (const id of junctions) {
    const k = key(at(id))
    const list = cell.get(k)
    if (list) list.push(id)
    else cell.set(k, [id])
  }
  const seen = new Set<string>()
  for (const id of junctions) {
    const p = at(id)
    for (let gx = -1; gx <= 1; gx++) for (let gz = -1; gz <= 1; gz++) {
      for (const other of cell.get(`${Math.floor(p.x / 8) + gx},${Math.floor(p.z / 8) + gz}`) ?? []) {
        if (other === id) continue
        const q = at(other)
        if (Math.hypot(q.x - p.x, q.z - p.z) > 8) continue
        const pair = id < other ? `${id}:${other}` : `${other}:${id}`
        if (seen.has(pair)) continue
        seen.add(pair)
        st.twinned++
      }
    }
  }
  return st
}

/**
 * The axis through a pair of opposite arms: a TOTAL least-squares line through both arms' run points
 * together. Not the line joining the two arms' nearest points — that one passes within centimetres of the
 * mapped node by construction and so can never say the node is in the wrong place. Pooling the runs is what
 * exposes the lateral zigzag: if the two halves of the street are offset, the fitted axis splits the
 * difference and the junction moves onto it.
 */
function fit(arms: Arm[]): { at: Point; dir: Point } | null {
  const pts: Point[] = []
  for (const a of arms) pts.push(...a.pts)
  if (pts.length < 2) return null
  let cx = 0
  let cz = 0
  for (const p of pts) { cx += p.x; cz += p.z }
  cx /= pts.length
  cz /= pts.length
  let sxx = 0
  let szz = 0
  let sxz = 0
  for (const p of pts) {
    const dx = p.x - cx
    const dz = p.z - cz
    sxx += dx * dx
    szz += dz * dz
    sxz += dx * dz
  }
  // principal direction of the scatter
  const theta = 0.5 * Math.atan2(2 * sxz, sxx - szz)
  const dir = { x: Math.cos(theta), z: Math.sin(theta) }
  if (Math.hypot(dir.x, dir.z) < 1e-6) return null
  return { at: { x: cx, z: cz }, dir }
}

/** which of the junction's two axes this direction runs along */
function pickAxis(hit: Point, out: Point, a: { at: Point; dir: Point }, b: { at: Point; dir: Point }):
  { at: Point; dir: Point } {
  const dx = out.x - hit.x
  const dz = out.z - hit.z
  const len = Math.max(1e-6, Math.hypot(dx, dz))
  const ux = dx / len
  const uz = dz / len
  const along = (ax: { dir: Point }): number => Math.abs(ux * ax.dir.x + uz * ax.dir.z)
  // the axis is a line, so the sign does not matter; and the direction used for projection must point the
  // way this arm leaves, or the jitter vertex lands on the wrong side of the junction
  const pickA = along(a) >= along(b)
  const chosen = pickA ? a : b
  const sign = ux * chosen.dir.x + uz * chosen.dir.z >= 0 ? 1 : -1
  return { at: hit, dir: { x: chosen.dir.x * sign, z: chosen.dir.z * sign } }
}

/** a way's vertices have moved along: drop the deleted occurrences and rewrite this way's indices */
function reindex(w: StraightenWay, where: Map<number, Occurrence[]>, gone: number[]): void {
  for (const id of gone) {
    const list = where.get(id)
    if (list) where.set(id, list.filter((occ) => occ.way !== w))
  }
  for (let i = 0; i < w.nodes.length; i++) {
    for (const occ of where.get(w.nodes[i]) ?? []) if (occ.way === w) occ.idx = i
  }
}


/**
 * What a junction measures, before any tolerance is applied — the raw material of the table in BUGS.md #183.
 * Pairs the arms by their best opposite match regardless of how bad that match is, so the distribution of
 * every tolerance can be read off rather than guessed.
 */
function diagnose(arms: Arm[], here: Point): JunctionRow {
  const row: JunctionRow = { arms: arms.length, opposite: 180, square: 90, move: Infinity, bend: 0, lateral: 0, at: here }
  for (const a of arms) {
    for (const p of a.pts) {
      const off = Math.abs((p.x - a.at.x) * a.dir.z - (p.z - a.at.z) * a.dir.x)
      if (off > row.bend) row.bend = off
    }
  }
  const used = new Set<number>()
  const pairs: Arm[][] = []
  let worstOpp = 0
  for (let i = 0; i < arms.length; i++) {
    if (used.has(i)) continue
    let best = -1
    let bestErr = Infinity
    for (let j = i + 1; j < arms.length; j++) {
      if (used.has(j)) continue
      const err = Math.abs(Math.PI - angleBetween(arms[i].bearing, arms[j].bearing))
      if (err < bestErr) { bestErr = err; best = j }
    }
    if (best >= 0) {
      pairs.push([arms[i], arms[best]])
      used.add(i)
      used.add(best)
      worstOpp = Math.max(worstOpp, bestErr / DEG)
      // the zigzag: how far the far half's line passes from the near half's line at the junction
      const a = arms[i]
      const b = arms[best]
      row.lateral = Math.max(row.lateral, Math.abs((b.at.x - a.at.x) * a.dir.z - (b.at.z - a.at.z) * a.dir.x))
    }
  }
  row.opposite = pairs.length ? worstOpp : 180
  const singles = arms.filter((_, i) => !used.has(i))
  const axisA = pairs.length ? fit(pairs[0]) : null
  const axisB = pairs.length === 2 ? fit(pairs[1]) : singles.length === 1 ? fit([singles[0]]) : null
  if (axisA && axisB) {
    const between = angleBetween(Math.atan2(axisA.dir.x, axisA.dir.z), Math.atan2(axisB.dir.x, axisB.dir.z))
    row.square = Math.abs(Math.PI / 2 - Math.min(between, Math.PI - between)) / DEG
    const hit = cross(axisA, axisB)
    if (hit) row.move = Math.hypot(hit.x - here.x, hit.z - here.z)
  }
  return row
}
