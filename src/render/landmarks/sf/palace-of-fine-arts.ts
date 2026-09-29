/**
 * Palace of Fine Arts — 3301 Lyon Street (way/288371295), Bernard Maybeck, 1915, rebuilt in concrete
 * 1964–74. The one building in the Marina that is seen from everywhere: a domed Roman rotunda standing in
 * a lagoon, ringed by detached Corinthian column groups, with a curved peristyle running away from it on
 * both sides.
 *
 * WHAT THE OSM FOOTPRINT COVERS — the ROTUNDA ONLY. `way/288371295` is a single closed way of 188
 * vertices, roughly 60 × 72 m, and plotting it (`docs/shots/models/palaceOfFineArts_3301_lyon-osm-footprint.png`) shows a near-circular
 * blob of radius 22–38 m with eight radial LOBES: the rotunda's own octagonal body, plus the plinths of
 * the free-standing column groups that stand off it. The curved peristyle and the crescent exhibition hall
 * behind it (the Exploratorium's old shed) are NOT in this way; they are separate ways with their own
 * footprints, and drawing them here would mean typing their positions in metres and fighting whatever
 * renders them. So this builder is the rotunda, and the peristyle is left to the way that owns it.
 *
 * WHY IT IS FROM SCRATCH. `facade()` and `faceBand()` put flat walls on polygon edges; there is no edge
 * here that is a wall. The building is an ARCADE ON A CIRCLE with a ring of detached columns outside it,
 * and `towerRing()`'s `simplifyRing()` merges anything under 1.5 m — which on a 188-vertex plinth tracing
 * is most of the outline. The raw ring is used instead, and read for three things only:
 *
 *   - a least-squares (Kåsa) CIRCLE through every vertex, which gives the centre the whole composition is
 *     turned about. The ring's centroid is not that centre, and on an eight-lobed outline it drifts;
 *   - the CORE radius (the median vertex radius) — the rotunda's own octagon;
 *   - the eight COLUMN-GROUP angles, found as angular clusters of the vertices that stand out past the
 *     core. Measured on this footprint they come in four pairs about 35° apart, the pairs 90° apart, which
 *     is the rotunda's real arrangement; taking them from the outline rather than from a fixed 45° step is
 *     what gets the building's ROTATION relative to the lagoon right, since a `Fit` on a near-circular plan
 *     has no meaningful long axis to orient from.
 *
 * Modelled from photographs (reference only; nothing traced or sampled) —
 * `docs/shots/refs/sf-commons/288371295/`: `across-lagoon.jpg` (the silhouette that matters, level and
 * daylit), `rotunda-close.jpg` (the arcade, the attic, the coupled columns), `aerial-plan.jpg` (the plan,
 * and the proof that the colonnade is a separate structure), `colonnade-sweep.jpg` (the column groups'
 * proportion and the attic box they carry).
 *
 * What the photographs say the silhouette is, bottom to top: a low plinth; an octagonal arcade of tall
 * round-headed openings, a coupled column pair at every corner of it; a deep entablature; above that a
 * tall sculpted ATTIC, which is nearly a third of the building and is what makes the rotunda read as
 * heavy rather than as a gazebo; then a LOW SAUCER dome, not a hemisphere. Outside all of it, eight
 * free-standing groups of four columns, about half the rotunda's height, each carrying a big square
 * sculpted box. The frieze is not modelled: this is seen across water and reflected.
 *
 * Every dimension is a fraction of `fit.height` or of the radii fitted to the footprint. The only integers
 * are counts (facets, columns per group).
 *
 * Local frame: the fit's, +y up.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { MeshBuilder as Builder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { towerRing } from '../tower.ts'
import { arcade } from '../parts.ts'
import { classicalColumn } from '../column.ts'
import { dome, placed } from '../kit.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type P2 = { x: number; z: number }

/** the warm ochre cast concrete of the 1960s rebuild, which is what is actually there */
const STONE: Rgb = [0.80, 0.73, 0.60]
const STONE_LIT: Rgb = [0.86, 0.79, 0.66]
/** the columns and the rotunda's inner order read distinctly pinker than the walls in every photograph */
const PINK: Rgb = [0.74, 0.60, 0.52]
/* the rotunda is OPEN — what shows through its arches is its own shaded inside, not a hole. A near-black
 * shade read as a punched void in the first render; a warm dark brown reads as shadow. */
const SHADE: Rgb = [0.44, 0.35, 0.29]
/** the dome is pale grey-green lead, the one cool thing on the building */
const DOME: Rgb = [0.72, 0.73, 0.69]

const T_STONE = surfaceTag('ashlar')

/** facets the rotunda's round parts are drawn with */
const FACETS = 16
/** columns in one free-standing group — four, in a square, in every photograph */
const GROUP = 4
/** faces of the rotunda's arcade */
const BAYS = 8

/* ---------------------------------------------------------------- reading the plan out of the footprint */

interface Plan {
  cx: number
  cz: number
  /** the rotunda's own body: the median vertex radius */
  core: number
  /** how far the free-standing groups stand out */
  outer: number
  /** the radius the lobes themselves sit at: where the groups stand */
  lobeR: number
  /** where those groups stand, radians, from the outline's own lobes */
  angles: number[]
}

/** Kåsa least-squares circle through the points: the centre the composition is turned about. */
function fitCircle(ring: P2[]): { cx: number; cz: number } {
  let S1 = 0, Sx = 0, Sz = 0, Sxx = 0, Szz = 0, Sxz = 0, Sb = 0, Sbx = 0, Sbz = 0
  for (const q of ring) {
    const b = q.x * q.x + q.z * q.z
    S1++; Sx += q.x; Sz += q.z; Sxx += q.x * q.x; Szz += q.z * q.z; Sxz += q.x * q.z
    Sb += b; Sbx += b * q.x; Sbz += b * q.z
  }
  const M = [[2 * Sxx, 2 * Sxz, Sx, Sbx], [2 * Sxz, 2 * Szz, Sz, Sbz], [2 * Sx, 2 * Sz, S1, Sb]]
  for (let i = 0; i < 3; i++) {
    let m = i
    for (let k = i + 1; k < 3; k++) if (Math.abs(M[k][i]) > Math.abs(M[m][i])) m = k
    const t = M[i]; M[i] = M[m]; M[m] = t
    if (Math.abs(M[i][i]) < 1e-9) return { cx: 0, cz: 0 }
    for (let k = i + 1; k < 3; k++) {
      const f = M[k][i] / M[i][i]
      for (let j = i; j <= 3; j++) M[k][j] -= f * M[i][j]
    }
  }
  const x = [0, 0, 0]
  for (let i = 2; i >= 0; i--) {
    let s = M[i][3]
    for (let j = i + 1; j < 3; j++) s -= M[i][j] * x[j]
    x[i] = s / M[i][i]
  }
  return { cx: x[0], cz: x[1] }
}

/**
 * The eight column-group angles, as ANGULAR CLUSTERS of the vertices that stand out past the core.
 *
 * A lobe is several consecutive vertices at a large radius; two lobes are separated by a gap in angle. A
 * cluster is kept only if it has enough vertices to be a plinth rather than a single stray point. Any
 * count is accepted — the caller falls back to a regular ring if the outline is too plain to read — but on
 * this building it finds six to eight of the eight, which is enough to set the ROTATION, and the rest are
 * filled in from the four-fold symmetry the found ones imply.
 */
function lobeAngles(ring: P2[], cx: number, cz: number, core: number): { a: number; r: number }[] {
  const far = ring
    .map((q) => ({ a: Math.atan2(q.z - cz, q.x - cx), r: Math.hypot(q.x - cx, q.z - cz) }))
    .filter((q) => q.r > core * 1.1)
    .sort((u, v) => u.a - v.a)
  if (far.length < 8) return []
  const gap = 0.31
  const groups: { a: number; r: number; n: number }[] = []
  let sx = 0, sz = 0, sr = 0, n = 0, last = -Infinity
  // a lobe's RADIUS is the mean of its vertices' — the plinth's own stand-off, which is what places the group
  const flush = (): void => { if (n >= 3) groups.push({ a: Math.atan2(sz, sx), r: sr / n, n }); sx = 0; sz = 0; sr = 0; n = 0 }
  for (const q of far) {
    if (n > 0 && q.a - last > gap) flush()
    sx += Math.cos(q.a); sz += Math.sin(q.a); sr += q.r; n++; last = q.a
  }
  flush()
  // the first and last cluster are one lobe when they meet across ±π
  if (groups.length > 1) {
    const first = groups[0]
    const lastG = groups[groups.length - 1]
    let d = Math.abs(first.a - lastG.a)
    if (d > Math.PI) d = Math.PI * 2 - d
    if (d < gap) {
      first.a = Math.atan2(Math.sin(first.a) * first.n + Math.sin(lastG.a) * lastG.n, Math.cos(first.a) * first.n + Math.cos(lastG.a) * lastG.n)
      first.r = (first.r * first.n + lastG.r * lastG.n) / (first.n + lastG.n)
      groups.pop()
    }
  }
  return groups
}

/**
 * The plan: the fitted centre, the two radii, and eight group angles.
 *
 * The groups come in PAIRS — measured on this footprint, two lobes about 35° apart, the pairs 90° apart —
 * so rather than trust that all eight lobes survive the radius test, the found angles are reduced to one
 * ORIENTATION (the circular mean of 4θ, which is the four-fold symmetry's phase) and one HALF-GAP (the
 * mean offset of each lobe from its own quadrant's axis), and all eight are regenerated from those. That
 * is the same move `noseRing` makes on Columbus Tower: fit the form the outline implies, then lay it out
 * cleanly, because a sampled outline is noisier than the thing it samples.
 */
function readPlan(ring: P2[]): Plan {
  const { cx, cz } = fitCircle(ring)
  const rs = ring.map((q) => Math.hypot(q.x - cx, q.z - cz)).sort((a, b) => a - b)
  const core = rs[Math.floor(rs.length * 0.5)]
  const outer = rs[Math.floor(rs.length * 0.97)]
  const found = lobeAngles(ring, cx, cz, core)
  // the four-fold phase: the circular mean of 4θ, which is invariant to which quadrant each lobe is in
  let px = 0, pz = 0
  for (const g of found) { px += Math.cos(g.a * 4); pz += Math.sin(g.a * 4) }
  const phase = found.length > 0 ? Math.atan2(pz, px) / 4 : 0
  // the half-gap: how far each lobe sits from its quadrant's axis, averaged
  let half = 0
  if (found.length > 0) {
    let s = 0
    for (const g of found) {
      let d = g.a - phase
      d -= Math.round(d / (Math.PI / 2)) * (Math.PI / 2)
      s += Math.abs(d)
    }
    half = s / found.length
  }
  // a plain outline (no lobes at all) still gets a sane ring, just without the building's own rotation
  if (half < 0.08 || half > Math.PI / 4 - 0.08) half = Math.PI / 8
  const angles: number[] = []
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) angles.push(phase + (k * Math.PI) / 2 + s * half)
  /*
   * WHERE THE GROUPS STAND comes from the lobes themselves — the mean radius of the vertices that make up
   * a lobe, which is the plinth's own stand-off from the centre. An earlier pass placed them at a typed
   * fraction of the core radius and they crowded the rotunda; the outline says about 33 m, which is the
   * walkway between rotunda and pylons that `aerial-plan.jpg` shows.
   */
  const lobeR = found.length > 0 ? found.reduce((t, g) => t + g.r, 0) / found.length : (core + outer) / 2
  return { cx, cz, core, outer, lobeR, angles }
}

/* ---------------------------------------------------------------- the parts */

/** a ring of `n` points at radius r about the plan's centre, starting at `a0` */
function circleRing(p: Plan, r: number, n: number, a0 = 0): P2[] {
  const out: P2[] = []
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2
    out.push({ x: p.cx + Math.cos(a) * r, z: p.cz + Math.sin(a) * r })
  }
  return out
}

/**
 * ONE free-standing column group, drawn in its own frame with the rotunda behind it at −x: four columns in
 * a square on a plinth, an entablature over them, and the big sculpted box that stands on that. Stamped
 * eight times with `placed()`, so the whole ring costs one group's worth of authoring and eight of
 * triangles.
 */
function columnGroup(part: MeshBuilder, w: number, h: number): void {
  const r = w * 0.17
  const plinth = h * 0.05
  box(part, 0, plinth / 2, 0, w / 2, plinth / 2, w / 2, STONE, T_STONE)
  const top = plinth + h * 0.78
  // GROUP columns set out round the plinth's centre — four, so one at each corner of the square
  for (let i = 0; i < GROUP; i++) {
    const a = (i / GROUP) * Math.PI * 2 + Math.PI / GROUP
    classicalColumn(part, Math.cos(a) * w * 0.28, Math.sin(a) * w * 0.28, plinth, top, r, PINK,
      { order: 'corinthian', tier: 'mid', tag: T_STONE, trim: STONE_LIT })
  }
  // the entablature, and the sculpted attic box on it — tall, and square in plan, which is what makes
  // these read as pylons rather than as a pergola
  const ent = h * 0.07
  box(part, 0, top + ent / 2, 0, w * 0.44, ent / 2, w * 0.44, STONE, T_STONE)
  const atticH = h - (top + ent)
  box(part, 0, top + ent + atticH / 2, 0, w * 0.38, atticH / 2, w * 0.38, STONE_LIT, T_STONE)
  // a shallow cap ledge, so the box does not end flat against the sky
  box(part, 0, h + h * 0.012, 0, w * 0.42, h * 0.012, w * 0.42, STONE, T_STONE)
}

/* ---------------------------------------------------------------- the building */

export function palaceOfFineArts_3301_lyon(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring : towerRing(fit)
  const p = readPlan(raw)
  const H = fit.height > 12 ? fit.height : Math.max(fit.hx, fit.hz) * 1.5

  /* ---- the plinth the whole thing stands on: the rotunda's own octagon, one step proud */
  const plinthH = H * 0.045
  /*
   * The rotunda's OWN octagon is a good deal smaller than the footprint's core radius, because the way
   * traces the plinths of the free-standing groups as well: the first render made it the full core radius
   * and the building came out as wide as it is tall, which is not what `across-lagoon.jpg` shows — the
   * rotunda there is distinctly taller than it is wide. `rot` is the fraction of the core that leaves the
   * groups standing clear of it, which is what the aerial shows in plan.
   */
  const rot = p.core * 0.70
  prism(out, p.cx, p.cz, 0, plinthH, rot * 1.10, BAYS, STONE, T_STONE)

  /* ---- the arcade: eight round-headed openings on the octagon's faces.
   * `arcade()` is the kit part written for exactly this (its own comment names this building), and a
   * curved arcade is eight straight runs on the octagon's chords — the plan really is an octagon, so no
   * chord here is an approximation of a curve. */
  const arcH = H * 0.46
  const oct = circleRing(p, rot, BAYS, p.angles[0])
  for (let i = 0; i < BAYS; i++) {
    const a = oct[i]
    const b = oct[(i + 1) % BAYS]
    arcade(out, a, b, plinthH, arcH, 1, { depth: rot * 0.16, colour: STONE, shade: SHADE, piers: true })
  }
  /* ---- the coupled columns at every corner of the octagon, standing proud of it. The rotunda's inner
   * order: two columns per corner, so sixteen round the building, which is what the arcade reads as. */
  for (let i = 0; i < BAYS; i++) {
    const a0 = p.angles[0] + (i / BAYS) * Math.PI * 2
    for (const s of [-1, 1]) {
      const a = a0 + s * 0.11
      classicalColumn(out, p.cx + Math.cos(a) * rot * 1.06, p.cz + Math.sin(a) * rot * 1.06,
        plinthH, plinthH + arcH * 0.96, rot * 0.085, PINK,
        { order: 'corinthian', tier: 'mid', tag: T_STONE, trim: STONE_LIT, heading: Math.atan2(Math.cos(a), Math.sin(a)) })
    }
  }

  /* ---- the entablature over the arcade, and the deep sculpted ATTIC above it. The attic is close to a
   * third of the building and is most of why the rotunda reads as heavy from across the lagoon. */
  let y = plinthH + arcH
  const entH = H * 0.055
  prism(out, p.cx, p.cz, y, y + entH, rot * 1.16, BAYS, STONE_LIT, T_STONE)
  y += entH
  const atticH = H * 0.20
  prism(out, p.cx, p.cz, y, y + atticH, rot * 1.04, BAYS, STONE, T_STONE)
  // the attic's own cornice: the ledge the dome sits behind
  prism(out, p.cx, p.cz, y + atticH, y + atticH + H * 0.03, rot * 1.10, BAYS, STONE_LIT, T_STONE)
  y += atticH + H * 0.03

  /* ---- the drum and the SAUCER dome. Low, not hemispherical: the profile in `across-lagoon.jpg` is
   * barely more than a quarter of its own radius high. */
  const drumR = rot * 0.86
  prism(out, p.cx, p.cz, y, y + H * 0.04, drumR, FACETS, STONE_LIT, T_STONE)
  y += H * 0.04
  /*
   * A SAUCER, not a hemisphere. The first render gave the dome all the height left over above the attic and
   * it came out as a ball on a box; in `across-lagoon.jpg` the dome's rise is about half its own radius, and
   * its top is where the building's height ends, so the rise is taken from the RADIUS and the drum is
   * lengthened to make up the difference.
   */
  const rise = drumR * 0.52
  const stilt = Math.max(0, H - rise - y)
  if (stilt > 0.01) prism(out, p.cx, p.cz, y, y + stilt, drumR, FACETS, STONE_LIT, T_STONE)
  dome(out, p.cx, p.cz, y + stilt, drumR, rise, DOME, FACETS)

  /* ---- the eight free-standing column groups, at the angles the outline itself gave. */
  const groupW = p.core * 0.26
  const groupH = H * 0.52
  const part = new Builder()
  columnGroup(part, groupW, groupH)
  for (const a of p.angles) {
    const r = p.lobeR - groupW * 0.10
    // `placed` turns about +z in Babylon's sense; the group faces outward when its heading is the radius
    placed(out, part, Math.atan2(Math.cos(a), Math.sin(a)), p.cx + Math.cos(a) * r, p.cz + Math.sin(a) * r)
  }
}
