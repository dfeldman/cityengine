/**
 * MOSCONE SOUTH — THE WEST CLUSTER: the Children's Creativity Museum complex, the LeRoy King Carousel and the
 * South of Market Child Care centre. The three strangest buildings on the block, and the reason this corner
 * got a run of its own. Owner: *"those buildings on the south block are WEIRD. Especially the children's
 * museum complex. Definitely needs custom modeling."*
 *
 * `docs/MOSCONE-SOUTH.md` is the brief; the evidence is the owner's own hand-captured aerials,
 * `docs/shots/refs/aerials/ms-childrens-museum-serpentine.webp`, `ms-childrens-museum-carousel.webp`,
 * `ms-carousel-closeup.webp` and `ms-childcare-brutalist-1..2.webp`. **This is scratch modelling**: nothing
 * here reaches for `facade()` or a preset, because every one of these forms — an inverted truncated cone, an
 * S-plan banded block, a glazed radial dome, a wavy metal roof — is exactly what a preset cannot say. The
 * museum previously carried a `spec()` stucco box with a cornice, which is BUGS.md #140's worked example of a
 * preset standing in for a landmark; that entry and its builder are gone.
 *
 * ---- DATUMS: SHARED, NOT INVENTED
 *
 * `LEVELS` is imported from `./moscone-south.ts`, which derived and documented it for
 * the Howard hall and the ice rink. Street 0, garden 4, mezzanine 6, wall top 8, upper 12. Nothing in this
 * file types a level number of its own.
 *
 *   - the museum and the child care centre stand on GARDEN level (4), over a plinth down to the street;
 *   - the carousel stands on TRUE GROUND (0) — it takes a corner out of Moscone at 4th and Howard, and this
 *     is the one thing about it everybody gets wrong;
 *   - the sunken plaza is 1.5 m BELOW garden, and the fan stair climbs out of it to `LEVELS.wall` (8), which
 *     is the museum's upper terrace — 5.5 m, about the one storey the aerial shows.
 *
 * ---- COMPASS-FREE, and why
 *
 * Every builder here derives its plan from the ring's own longest edge (`planRing` + `edgeAt`), never from
 * world x/z, because the shot tools and the city fit a footprint in different frames and a builder that keys
 * off north dresses whichever side happens to face it. `frameOf` is that frame: `f.d(p)` runs INTO the
 * plan from the longest edge, `f.s(p)` runs ALONG it, and `f.at(s, d)` goes back to a point.
 *
 * ---- HEADINGS
 *
 * `edgeAt().heading` is `atan2(tz, −tx)`, the direction a wall FACES, and `boxAlong` sends its local +x to
 * `(cos h, −sin h)` — which for that heading is `(−tx, −tz)`, i.e. ALONG the edge (reversed, which a
 * symmetric box cannot tell). So `e.heading` is the right argument for a band lying on an edge. For a box
 * lying along any OTHER direction — a roof rib running down the slope, a mullion — the heading is
 * `atan2(−dz, dx)`, which is `headAlong` below. Both were checked against `parts.ts:34` and `:398` rather
 * than assumed: five bugs on this project have come from the other one, and a square part hides it perfectly.
 *
 * ---- WHAT IS EVIDENCED AND WHAT IS INFERRED
 *
 * See the note above each builder. In short: every FORM here is in an aerial. Every HEIGHT is inferred from
 * proportion against the shared datums, because no aerial states a height.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { arcStair, boxAlong, edgeAt, longestEdge, railing, stair } from '../parts.ts'
import { towerRing } from '../tower.ts'
import { LEVELS } from './moscone-south.ts'

type P2 = { x: number; z: number }

const CONC = surfaceTag('concrete')
const METAL = surfaceTag('metal')
const STONE = surfaceTag('ashlar')

/* The museum. Colours read off `ms-childrens-museum-serpentine.webp` and `ms-carousel-closeup.webp`. */
const CONE_DARK: Rgb = [0.35, 0.30, 0.24]
const CONE_RIM: Rgb = [0.27, 0.23, 0.19]
const DARK_GLASS: Rgb = [0.16, 0.18, 0.20]
const MULLION: Rgb = [0.24, 0.25, 0.26]
const ORANGE: Rgb = [0.72, 0.40, 0.20]
const PALE_STONE: Rgb = [0.82, 0.80, 0.76]
const PALE_DK: Rgb = [0.70, 0.68, 0.64]
const PLAZA_PINK: Rgb = [0.78, 0.52, 0.44]
const ROOF_DARK: Rgb = [0.30, 0.31, 0.33]
const RAIL_DARK: Rgb = [0.26, 0.27, 0.28]

/* The carousel. `ms-carousel-closeup.webp`. */
const DOME_GLASS: Rgb = [0.63, 0.75, 0.74]
const DOME_RIB: Rgb = [0.45, 0.53, 0.53]
const BAND_RED: Rgb = [0.62, 0.26, 0.22]
const CREAM: Rgb = [0.87, 0.84, 0.76]

/* The child care centre. `ms-childcare-brutalist-1..2.webp`. */
const SILVER: Rgb = [0.79, 0.80, 0.80]
const SILVER_DK: Rgb = [0.62, 0.64, 0.64]
const BOARD_CONC: Rgb = [0.55, 0.57, 0.58]
const PLINTH: Rgb = [0.48, 0.49, 0.50]
/* The murals, honestly: flat blocks of colour, NOT a picture. See the note on `childCare` below. */
const MURAL: Rgb[] = [[0.72, 0.28, 0.24], [0.24, 0.35, 0.60], [0.83, 0.62, 0.22], [0.30, 0.50, 0.38], [0.58, 0.30, 0.52]]

/** The heading `boxAlong` wants so that a box's local +x runs along `(dx, dz)`. See the headings note above. */
const headAlong = (dx: number, dz: number): number => Math.atan2(-dz, dx)

/** The ring a builder should work on: the real footprint when there is one, the simplified box when not. */
function planRing(fit: Fit): P2[] {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring : towerRing(fit)
  let twice = 0
  for (let i = 0; i < raw.length; i++) {
    const j = (i + 1) % raw.length
    twice += raw[i].x * raw[j].z - raw[j].x * raw[i].z
  }
  // anticlockwise, so `edgeAt`'s n = (tz, −tx) points OUT
  return twice >= 0 ? raw.map((p) => ({ x: p.x, z: p.z })) : [...raw].reverse().map((p) => ({ x: p.x, z: p.z }))
}

/** The plan's own frame: `d` into the plan from the longest edge, `s` along it. Compass-free. */
type Frame = { e: ReturnType<typeof edgeAt>; D: number; d: (p: P2) => number; s: (p: P2) => number; at: (s: number, d: number) => P2 }
function frameOf(ring: P2[]): Frame {
  const e = edgeAt(ring, longestEdge(ring))
  const d = (p: P2): number => -((p.x - e.a.x) * e.nx + (p.z - e.a.z) * e.nz)
  const s = (p: P2): number => (p.x - e.a.x) * e.tx + (p.z - e.a.z) * e.tz
  const D = Math.max(...ring.map(d))
  const at = (su: number, dv: number): P2 => ({ x: e.a.x + e.tx * su - e.nx * dv, z: e.a.z + e.tz * su - e.nz * dv })
  return { e, D, d, s, at }
}

/**
 * A wall RIBBON swept along a polyline: two faces, a top cap and two closed ends, as one solid. This is the
 * part the serpentine needed and the kit does not have — `boxAlong` cannot bend, and a run of separate boxes
 * leaves a gap at every kink, which is the failure `stair()`'s own notes describe from underneath.
 */
function ribbon(out: MeshBuilder, line: P2[], half: number, y0: number, y1: number, c: Rgb, tag: number): void {
  const N: P2[] = line.map((_, i) => {
    const a = line[Math.max(0, i - 1)]
    const b = line[Math.min(line.length - 1, i + 1)]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { x: (b.z - a.z) / L, z: -(b.x - a.x) / L }
  })
  const off = (i: number, k: number): P2 => ({ x: line[i].x + N[i].x * half * k, z: line[i].z + N[i].z * half * k })
  for (let i = 0; i < line.length - 1; i++) {
    for (const k of [1, -1]) {
      const a = off(i, k)
      const b = off(i + 1, k)
      out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]],
        [N[i].x * k, 0, N[i].z * k], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
    }
    const p = off(i, 1)
    const q = off(i, -1)
    const r = off(i + 1, -1)
    const s = off(i + 1, 1)
    out.quad([[p.x, y1, p.z], [s.x, y1, s.z], [r.x, y1, r.z], [q.x, y1, q.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
  for (const [i, sg] of [[0, -1], [line.length - 1, 1]] as const) {
    const p = off(i, 1)
    const q = off(i, -1)
    const t = { x: N[i].z * sg, z: -N[i].x * sg }
    out.quad([[p.x, y0, p.z], [q.x, y0, q.z], [q.x, y1, q.z], [p.x, y1, p.z]], [t.x, 0, t.z], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
}

/** An `n`-sided horizontal ring of radius `r` about `at`, with an optional angular phase. */
const circle = (at: P2, r: number, n: number, phase = 0): P2[] =>
  Array.from({ length: n }, (_, k) => {
    const a = phase + (k / n) * Math.PI * 2
    return { x: at.x + Math.cos(a) * r, z: at.z + Math.sin(a) * r }
  })

/**
 * A TRUNCATED CONE between two radii at two heights — the museum's signature form and the one the brief says
 * nothing in the kit can say. `r1 > r0` is the inverted drum: WIDER AT THE TOP. The outward normal is
 * computed from the slope rather than left horizontal, because on a cone leaning out that far a horizontal
 * normal lights the whole thing as a cylinder.
 */
function frustum(out: MeshBuilder, at: P2, y0: number, y1: number, r0: number, r1: number, c: Rgb, tag: number, n = 32): void {
  const a = circle(at, r0, n)
  const b = circle(at, r1, n)
  const dy = y1 - y0
  const dr = r1 - r0
  const nl = Math.hypot(dy, dr) || 1
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const th = ((i + 0.5) / n) * Math.PI * 2
    out.quad([[a[i].x, y0, a[i].z], [a[j].x, y0, a[j].z], [b[j].x, y1, b[j].z], [b[i].x, y1, b[i].z]],
      [(Math.cos(th) * dy) / nl, -dr / nl, (Math.sin(th) * dy) / nl], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
}

/**
 * Fine vertical mullions lying ON a drum or a sloping frustum, lifted along the surface's own normal.
 *
 * The first version took ONE radius and stood 40 boxes at it. On the cylinder of the carousel that is fine;
 * on the museum's cone, which widens by 1.3 m over the height of its glazed drum, every post stood more than
 * a metre proud at the bottom and the cone came back standing on a cage of dark stilts. That is BUGS.md
 * **#134a** exactly — `glazedFront()`'s pale mullions 0.34 m off the glass reading as a picket fence — in the
 * one place this file's own brief warned about it. A strip between the two radii follows the slope by
 * construction and cannot repeat it.
 */
function mullions(out: MeshBuilder, at: P2, r0: number, r1: number, y0: number, y1: number, n: number, c: Rgb): void {
  const dy = y1 - y0
  const dr = r1 - r0
  const nl = Math.hypot(dy, dr) || 1
  // the outward normal of the surface, so the strip stands 0.05 m off it whatever its lean
  const ox = (dy / nl) * 0.05
  const oy = (-dr / nl) * 0.05
  const w = 0.11
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2
    const P = (r: number, y: number, sg: number): [number, number, number] => [
      at.x + Math.cos(a) * (r + ox) - Math.sin(a) * w * sg,
      y + oy,
      at.z + Math.sin(a) * (r + ox) + Math.cos(a) * w * sg,
    ]
    out.quad([P(r0, y0, -1), P(r0, y0, 1), P(r1, y1, 1), P(r1, y1, -1)],
      [Math.cos(a) * (dy / nl), -dr / nl, Math.sin(a) * (dy / nl)], [[0, 0], [1, 0], [1, 1], [0, 1]], c, CONC)
  }
}

/* ------------------------------------------------------------------ A. the Children's Creativity Museum */

/**
 * THE CHILDREN'S CREATIVITY MUSEUM COMPLEX (`way/288716388`, Zeum, 1998, Adele Naude Santos).
 *
 * EVIDENCED, from `ms-childrens-museum-serpentine.webp` and `ms-childrens-museum-carousel.webp`, which show
 * the whole complex from two bearings:
 *   - a large DARK TRUNCATED CONE, plainly wider at the top than the bottom, with a flat top and a small
 *     raised cap at its centre, its lower drum glazed dark behind close vertical ribs;
 *   - a SERPENTINE block curving in a long shallow S from the Creativity Theater round to the cone, banded
 *     ORANGE/TERRACOTTA over dark glazing, with a walkable roof and a rail along it;
 *   - the Creativity Theater at the far end under a dark curved roof;
 *   - a CIRCULAR SUNKEN PLAZA between them, paved pink-red, with a small planted island at its edge;
 *   - a grand curved FAN STAIRCASE in pale stone sweeping up out of that plaza;
 *   - big stairs up into the museum from garden level.
 *
 * INFERRED: every height. The cone is drawn 13 m tall over garden level because the aerial shows it standing
 * about two storeys clear of the serpentine's roof terrace, which is pinned at `LEVELS.wall`. The plaza is
 * sunk 1.5 m — it is plainly a step or two down, not a storey. The fan's rise is then the difference, and its
 * step count is `arcStair`'s own derivation from that rise, not a typed number.
 *
 * DERIVED FROM THE FOOTPRINT, not typed: the 91-corner OSM ring decomposes on its own. The far ~28% of the
 * plan by depth is a near-circular lobe — that is the cone, and its centre and radius are that lobe's
 * centroid and mean radius. The near ~22% is the theater. The long side of the middle band that pulls INWARD
 * is the serpentine's concave face, and the plaza sits in it. Nothing here keys off north.
 */
function childrensCreativityMuseum(out: MeshBuilder, fit: Fit): void {
  const ring = planRing(fit)
  const f = frameOf(ring)
  const G = LEVELS.garden
  /*
   * The serpentine's roof terrace is `LEVELS.upper`, NOT `LEVELS.wall`. The brief is explicit that level 3
   * IS "the Children's Creativity Museum's second floor" and that the level-3 network walks across it, and
   * the first render of this builder put it at 8 — one storey — which made the whole complex read as a
   * single-storey pavilion under an enormous cone. Eight metres over the garden is the two storeys the
   * aerial shows.
   */
  const TERRACE = LEVELS.upper

  // ---- the plinth: the complex stands on garden level, over the Moscone hall, not on the pavement
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 0.6) continue
    boxAlong(out, e.mid.x + e.nx * 0.12, G / 2, e.mid.z + e.nz * 0.12, e.L / 2 + 0.2, G / 2, 0.3, e.heading, PALE_DK, CONC)
  }
  capPolygon(out, ring, G, PALE_STONE, STONE, 4)

  // ---- decompose the plan
  const far = ring.filter((p) => f.d(p) > f.D * 0.72)
  const cone: P2 = far.length >= 3
    ? { x: far.reduce((t, p) => t + p.x, 0) / far.length, z: far.reduce((t, p) => t + p.z, 0) / far.length }
    : f.at(f.e.L / 2, f.D * 0.85)
  const coneR = far.length >= 3
    ? Math.max(6, far.reduce((t, p) => t + Math.hypot(p.x - cone.x, p.z - cone.z), 0) / far.length)
    : 10

  /*
   * Which of the middle band's two flanks is the CONCAVE one — the serpentine's inner face, and the side the
   * plaza lies off. The first version of this took the SMALLEST inset on each flank and got it backwards:
   * the scalloped convex flank touches the bounding extreme, so its smallest inset is zero and the test was
   * decided by noise. The render showed a dead straight orange slab where the S should be. The DEEPEST
   * pull-in is the discriminating measure — on this footprint 11.7 m against 3.4 m — and it is what the word
   * "concave" means.
   */
  const mid = ring.filter((p) => f.d(p) > f.D * 0.22 && f.d(p) < f.D * 0.72)
  const sHi = Math.max(...ring.map(f.s))
  const sLo = Math.min(...ring.map(f.s))
  const inHi = mid.length ? Math.max(...mid.map((p) => sHi - f.s(p))) : 0
  const inLo = mid.length ? Math.max(...mid.map((p) => f.s(p) - sLo)) : 0
  /** +1 if the concave flank is the high-`s` side, −1 if the low one. The plaza lies off it. */
  const side = inHi > inLo ? 1 : -1
  const dMidA = f.D * 0.17
  const dMidB = f.D * 0.70

  /*
   * ---- the SERPENTINE: its centreline is READ OFF THE RING, not drawn as a formula.
   *
   * At each of 22 depths the concave flank's own boundary is sampled, then offset inward by half the block's
   * width and smoothed. The long shallow S is therefore the OSM plan's S, which is the only reason to trust
   * it; a hand-fitted cosine is a guess that happened to come out straight once already.
   */
  const HALF = 6.5
  const STEPS = 22
  const raw: number[] = []
  for (let k = 0; k <= STEPS; k++) {
    const d = dMidA + ((dMidB - dMidA) * k) / STEPS
    const near = ring.filter((p) => Math.abs(f.d(p) - d) < (dMidB - dMidA) / STEPS + 3.5)
    const face = near.length
      ? (side > 0 ? Math.max(...near.map(f.s)) : Math.min(...near.map(f.s)))
      : (side > 0 ? sHi : sLo)
    /*
     * CLAMPED to 2.5 m a step. At the far end the sampling window reaches into the cone's lobe, whose
     * vertices are metres off the serpentine's own line, and the raw centreline hooked outward there. The
     * five-point average then smeared the hook rather than removing it, and the roof rail — offset 5.9 m
     * along a normal that had gone wild — swung right out past the building and up into the sky. That was
     * invisible in every overhead frame and unmistakable at a rider's eye, which is the whole argument for
     * shooting low. The rail is also trimmed to the interior of the run below, for the same reason.
     */
    const want = face - side * HALF
    raw.push(raw.length === 0 ? want : Math.max(raw[raw.length - 1] - 2.5, Math.min(raw[raw.length - 1] + 2.5, want)))
  }
  const line: P2[] = raw.map((_, k) => {
    let t = 0
    let n = 0
    for (let j = Math.max(0, k - 2); j <= Math.min(raw.length - 1, k + 2); j++) { t += raw[j]; n++ }
    return f.at(t / n, dMidA + ((dMidB - dMidA) * k) / STEPS)
  })
  const sInner = raw[Math.floor(raw.length / 2)] + side * HALF
  // dark glazing below, the orange band above it, a pale parapet on top — the banding is the whole building
  ribbon(out, line, HALF - 0.45, G, G + 3.8, DARK_GLASS, METAL)
  ribbon(out, line, HALF, G + 3.8, G + 6.4, ORANGE, CONC)
  ribbon(out, line, HALF + 0.15, G + 6.4, TERRACE, PALE_STONE, CONC)
  ribbon(out, line, HALF - 0.3, TERRACE, TERRACE + 0.9, PALE_DK, CONC)
  /*
   * The roof terrace the level-3 network walks on, and its rail on the plaza side.
   *
   * The offset polyline keeps its normals CONSISTENT by aligning each with the one before it. The first
   * version decided each point's side independently, and one normal flipped mid-run: the rider's-eye render
   * came back with a line of posts swooping up out of the building and off into the sky — invisible from
   * above, and the reason KIT.md insists every railing demo is shot from a low oblique (#134a).
   */
  {
    const inner: P2[] = []
    let prev: P2 | null = null
    for (let i = 0; i < line.length; i++) {
      const a0 = line[Math.max(0, i - 1)]
      const b0 = line[Math.min(line.length - 1, i + 1)]
      const L = Math.hypot(b0.x - a0.x, b0.z - a0.z) || 1
      let nx = (b0.z - a0.z) / L
      let nz = -(b0.x - a0.x) / L
      if (prev) { if (nx * prev.x + nz * prev.z < 0) { nx = -nx; nz = -nz } }
      else if ((f.s({ x: line[i].x + nx, z: line[i].z + nz }) - f.s(line[i])) * side < 0) { nx = -nx; nz = -nz }
      prev = { x: nx, z: nz }
      inner.push({ x: line[i].x + nx * (HALF - 0.6), z: line[i].z + nz * (HALF - 0.6) })
    }
    railing(out, inner.slice(2, -2), TERRACE + 0.9, { kind: 'posts', colour: RAIL_DARK, height: 1.05 })
  }
  // the fine vertical ribs on the dark glazing, read off the aerial's lower band
  for (let k = 0; k < line.length - 1; k++) {
    const a = line[k]
    const b = line[k + 1]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const nx = (b.z - a.z) / L
    const nz = -(b.x - a.x) / L
    for (const sg of [1, -1]) {
      box(out, (a.x + b.x) / 2 + nx * sg * (HALF - 0.4), G + 1.7, (a.z + b.z) / 2 + nz * sg * (HALF - 0.4),
        0.08, 1.6, 0.08, MULLION, CONC)
    }
  }

  // ---- the CONE: the signature. Wider at the top, glazed lower drum, flat top, small raised cap.
  const CONE_H = 13
  const rBase = coneR * 0.86
  const rTop = coneR * 1.18
  const drum = G + 5.2
  const rDrum = rBase + ((rTop - rBase) * (drum - G)) / CONE_H
  frustum(out, cone, G, drum, rBase, rDrum, DARK_GLASS, METAL)
  mullions(out, cone, rBase, rDrum, G + 0.2, drum, 40, MULLION)
  frustum(out, cone, drum, G + CONE_H, rDrum, rTop, CONE_DARK, CONC)
  // the rim band the aerial shows where the dark mass meets the glazing, and again at the top
  frustum(out, cone, drum - 0.35, drum + 0.35, rDrum + 0.25, rDrum + 0.3, CONE_RIM, CONC)
  capPolygon(out, circle(cone, rTop, 32), G + CONE_H, CONE_DARK, CONC, 6)
  frustum(out, cone, G + CONE_H, G + CONE_H + 1.1, rTop * 0.26, rTop * 0.22, PALE_STONE, CONC, 20)
  capPolygon(out, circle(cone, rTop * 0.22, 20), G + CONE_H + 1.1, PALE_STONE, CONC, 2)

  // ---- the CIRCULAR SUNKEN PLAZA, off the serpentine's concave face
  const plazaR = Math.min(10, f.e.L * 0.30)
  const pc = f.at(sInner + side * (plazaR - 1.5), (dMidA + dMidB) / 2)
  const PLAZA = G - 1.5
  capPolygon(out, circle(pc, plazaR, 40), PLAZA, PLAZA_PINK, STONE, 3)
  // the two steps down into it, all round: an arc flight anchored on its own rim
  arcStair(out, pc, plazaR, PLAZA, G, { anchor: 'bottom', climb: 'out', riser: 0.15, colour: PALE_STONE, treadColour: PALE_STONE })
  // the small planted island at its edge (`ms-childrens-museum-serpentine.webp`, bottom left of the plaza)
  {
    const island = circle({ x: pc.x - f.e.tx * plazaR * 0.55 - f.e.nx * plazaR * 0.5, z: pc.z - f.e.tz * plazaR * 0.55 - f.e.nz * plazaR * 0.5 }, 2.8, 14)
    boxAlong(out, island[0].x, PLAZA + 0.2, island[0].z, 0.01, 0.2, 0.01, 0, PALE_STONE, CONC)
    capPolygon(out, island, PLAZA + 0.45, [0.45, 0.48, 0.34], 0, 2)
    out.decks.push({ ring: island, y: PLAZA + 0.45 })
  }

  // ---- the GRAND FAN STAIRCASE: pale stone, sweeping up out of the plaza to the museum's upper terrace.
  // `arcStair` IS this shape; the rise is TERRACE − PLAZA and the step count is its own derivation from it.
  {
    // set on the far side of the plaza from the serpentine, which is where the aerial puts it: between the
    // plaza and the cone. The sweep is found from the direction of the cone, so it cannot face the wrong way.
    const th = Math.atan2(cone.z - pc.z, cone.x - pc.x) / (Math.PI * 2)
    /*
     * The fan lands on `LEVELS.wall` (8) — an intermediate terrace — NOT on the serpentine's own roof at 12.
     * Taken to 12 it was a 9.5 m climb in 10 m of run: a 43-degree flight whose rail swooped up out of the
     * building and off into the sky in the rider's-eye render, while looking perfectly reasonable from
     * above. 5.5 m over 14 m of run is a civic flight. `LEVELS.wall` is a real walkable height on this block
     * (it is where the open skybridge lands), not a number chosen to make the geometry work.
     */
    arcStair(out, pc, plazaR + 0.6, PLAZA, LEVELS.wall, {
      // the sweep and the run are BOTH held down. Left to derive, a 8.5 m rise at a 0.16 m riser gave a
      // 21 m deep flight, and ±0.28 of a turn is 200 degrees: the front render came back with a fan bigger
      // than the building, spreading right off the deck. `arcStair` clips nothing (KIT.md), so the caller
      // fits the flight to the space it has.
      from: th - 0.13, to: th + 0.13, anchor: 'bottom', climb: 'out', riser: 0.16, run: 14,
      rail: 'both', railKind: 'solid', colour: PALE_STONE, treadColour: PALE_STONE,
    })
  }

  // ---- the CREATIVITY THEATER at the near end, under its dark curved roof
  {
    const tw = (sHi - sLo) * 0.42
    const tc = f.at((sHi + sLo) / 2 + (side > 0 ? -1 : 1) * (sHi - sLo) * 0.14, f.D * 0.115)
    const h = headAlong(f.e.tx, f.e.tz)
    boxAlong(out, tc.x, G + 4.1, tc.z, tw / 2, 4.1, f.D * 0.10, h, PALE_STONE, CONC)
    boxAlong(out, tc.x, G + 3.1, tc.z, tw / 2 + 0.25, 1.6, f.D * 0.10 + 0.25, h, ORANGE, CONC)
    // the curved roof: courses of a shallow barrel across the theater's short axis
    const COURSES = 7
    const rise = 2.6
    for (let k = 0; k < COURSES; k++) {
      const u0 = -1 + (2 * k) / COURSES
      const u1 = -1 + (2 * (k + 1)) / COURSES
      const y = (u: number): number => G + 8.2 + rise * Math.sqrt(Math.max(0, 1 - u * u))
      const P = (u: number, v: number): [number, number, number] => {
        const p = {
          x: tc.x + f.e.tx * (u * tw * 0.5) - f.e.nx * (v * f.D * 0.10),
          z: tc.z + f.e.tz * (u * tw * 0.5) - f.e.nz * (v * f.D * 0.10),
        }
        return [p.x, y(u), p.z]
      }
      out.quad([P(u0, -1), P(u1, -1), P(u1, 1), P(u0, 1)], [(u0 + u1) * 0.3, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], ROOF_DARK, METAL)
    }
  }

  // ---- the BIG STAIRS up into the museum from garden level, on the long frontage
  {
    const e = f.e
    stair(out, e.a, e.b, G, G + 2.2, { from: 0.30, to: 0.58, anchor: 'top', splay: 0.35, rail: 'both', railKind: 'solid', colour: PALE_STONE, treadColour: PALE_STONE })
  }
}

/* ------------------------------------------------------------------------------ B. the LeRoy King Carousel */

/**
 * THE LEROY KING CAROUSEL (`way/109141788`, 1906 Looff carousel, housed 1998), 4th and Howard.
 *
 * EVIDENCED, from `ms-carousel-closeup.webp` and `ms-childrens-museum-carousel.webp`:
 *   - a SHALLOW GLAZED DOME with RADIAL RIBS, pale blue-green, and a pale cap and finial at its crown. It is
 *     **not** conical: an earlier note in our own docs said it was, and the close oblique corrects it;
 *   - a low drum under it carrying a decorative painted band;
 *   - a CIRCULAR PLINTH reached by steps ALL ROUND, with the carousel raised on that platform;
 *   - angled BUTTRESS FINS on the retaining walls beside it — NOT built (owner, 2026-10-27: "these stairs at YB
 *     Center make no sense"): placed off a frame edge, the finned wall and its flight up to garden level stood
 *     alone on the lawn by 4th Street, climbing 4 m to nothing. Nothing at garden level meets this corner.
 *
 * **It stands on TRUE GROUND (`LEVELS.street`)** — it takes a corner out of Moscone, and the museum connects
 * DOWN to it. This is the one fact about this corner that the block's level model turns on, and it is why
 * this builder has no plinth to garden level while the other two do.
 *
 * INFERRED: the heights. OSM gives the way `height=5`; the aerial shows the dome standing clear above the
 * drum, so 1.2 m of plinth, 3.6 m of drum and a dome rising 3.6 m over a 19 m span — a shallow dome, which is
 * what "shallow" has to mean at that diameter.
 */
function leRoyKingCarousel(out: MeshBuilder, fit: Fit): void {
  const ring = planRing(fit)
  const c: P2 = { x: ring.reduce((t, p) => t + p.x, 0) / ring.length, z: ring.reduce((t, p) => t + p.z, 0) / ring.length }
  const R = ring.reduce((t, p) => t + Math.hypot(p.x - c.x, p.z - c.z), 0) / ring.length
  const S = LEVELS.street
  const PLINTH_H = 1.2
  const DRUM_H = 3.6

  // ---- the circular plinth, and the steps ALL ROUND it. `anchor: 'top'` puts the baseline at the head, so
  // the flight comes DOWN and outward off the platform edge — which is what steps round a plinth are.
  arcStair(out, c, R + 0.4, S, S + PLINTH_H, { anchor: 'top', climb: 'out', riser: 0.15, colour: PALE_STONE, treadColour: PALE_STONE })
  capPolygon(out, circle(c, R + 0.4, 36), S + PLINTH_H, PALE_STONE, STONE, 4)

  // ---- the drum: glazed, with the painted band above it
  const rD = R * 0.92
  frustum(out, c, S + PLINTH_H, S + PLINTH_H + DRUM_H * 0.72, rD, rD, DARK_GLASS, METAL, 36)
  mullions(out, c, rD, rD, S + PLINTH_H, S + PLINTH_H + DRUM_H * 0.72, 36, CREAM)
  frustum(out, c, S + PLINTH_H + DRUM_H * 0.72, S + PLINTH_H + DRUM_H, rD + 0.25, rD + 0.25, BAND_RED, CONC, 36)
  // the cornice the dome sits back from
  frustum(out, c, S + PLINTH_H + DRUM_H, S + PLINTH_H + DRUM_H + 0.5, rD + 0.55, rD + 0.35, CREAM, CONC, 36)
  capPolygon(out, circle(c, rD + 0.35, 36), S + PLINTH_H + DRUM_H + 0.5, CREAM, CONC, 3)

  // ---- the SHALLOW GLAZED DOME: courses of a flattened hemisphere, pale blue-green
  const y0 = S + PLINTH_H + DRUM_H + 0.5
  const rDome = rD + 0.1
  const RISE = 3.4
  const N = 36
  const COURSES = 6
  const yAt = (k: number): number => y0 + RISE * Math.sin((k / COURSES) * (Math.PI / 2))
  const rAt = (k: number): number => rDome * Math.cos((k / COURSES) * (Math.PI / 2))
  for (let k = 0; k < COURSES; k++) {
    const a = circle(c, rAt(k), N)
    const b = circle(c, rAt(k + 1), N)
    const ya = yAt(k)
    const yb = yAt(k + 1)
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N
      const th = ((i + 0.5) / N) * Math.PI * 2
      out.quad([[a[i].x, ya, a[i].z], [a[j].x, ya, a[j].z], [b[j].x, yb, b[j].z], [b[i].x, yb, b[i].z]],
        [Math.cos(th) * 0.6, 0.6, Math.sin(th) * 0.6], [[0, 0], [1, 0], [1, 1], [0, 1]], DOME_GLASS, METAL)
    }
  }
  /*
   * The RADIAL RIBS: 24 meridians, drawn as narrow strips LYING ON the dome surface and lifted along its own
   * normal. The first version used `boxAlong` per segment, and a horizontal box on a curved surface cannot
   * follow it: the street render came back with a spiky black halo standing out all round the dome, which is
   * BUGS.md #134a's lesson (a fine repeated element, invisible in code, unmistakable on screen) in a new
   * shape. Lifted 0.07 m, and dark against the pale glazing.
   */
  for (let m = 0; m < 24; m++) {
    const a = (m / 24) * Math.PI * 2
    const w = 0.13
    for (let k = 0; k < COURSES; k++) {
      const P = (kk: number, sg: number): [number, number, number] => {
        const r = rAt(kk)
        const y = yAt(kk)
        // the surface normal of a flattened hemisphere at this course, so the strip sits just proud of it
        const th = (kk / COURSES) * (Math.PI / 2)
        const nr = Math.cos(th) * (RISE / rDome)
        const ny = Math.sin(th)
        const nl = Math.hypot(nr, ny) || 1
        return [
          c.x + Math.cos(a) * (r + (nr / nl) * 0.07) - Math.sin(a) * w * sg,
          y + (ny / nl) * 0.07,
          c.z + Math.sin(a) * (r + (nr / nl) * 0.07) + Math.cos(a) * w * sg,
        ]
      }
      out.quad([P(k, -1), P(k, 1), P(k + 1, 1), P(k + 1, -1)],
        [Math.cos(a) * 0.5, 0.8, Math.sin(a) * 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]], DOME_RIB, METAL)
    }
  }
  // the crown: a pale cap and the finial the aerial shows at the apex
  capPolygon(out, circle(c, rAt(COURSES - 1), N), yAt(COURSES - 1) + 0.02, CREAM, CONC, 2)
  box(out, c.x, y0 + RISE + 0.7, c.z, 0.16, 0.8, 0.16, CREAM, CONC)
}

/* ------------------------------------------------------------------- C. the South of Market Child Care */

/**
 * THE SOUTH OF MARKET CHILD CARE / Child Development Center (`relation/3832310`, 790 Folsom) — the block's
 * "unusual Brutalist building", a 116-corner organic plan that was never queued until today.
 *
 * DELIBERATELY CHEAP, on the owner's own correction mid-run: *"The 'weird Brutalist building' has zany edges,
 * it doesn't matter so much, it's not prominent."* So the undulating parapet is **approximated by straight
 * segments stepping in and out**, not swept — the curve is suggested, not chased — and the tensile canopies
 * are dropped. What is kept is what actually reads from the decks above, which is how this building is seen.
 *
 * EVIDENCED, from `ms-childcare-brutalist-1.webp` and `-2.webp`:
 *   - several OFFSET WINGS, low, one to two storeys, sprawling across the Folsom frontage;
 *   - pale STANDING-SEAM METAL ROOFS with a strong fine rib;
 *   - ROUND SKYLIGHT DRUMS set into them — four or five pale cylinders with pale caps;
 *   - board-formed concrete walls along Folsom carrying large MURALS;
 *   - a long planted bank along Folsom with ONE BIG STRAIGHT STAIRCASE cutting up through it.
 *
 * **MURALS ARE NOT SUPPORTED AND ARE NOT FAKED HERE.** `SignSource {kind:'image', url}` is declared but is
 * dead code — `SignSpec.text` is a bare string and `paint()` only lays out glyphs — so no image can be
 * placed. What is drawn instead is flat blocks of strong colour on the board-formed wall, which is honest
 * about being colour and not a picture. Elaborating them into figures with geometry would be a lie told
 * expensively.
 */
function southOfMarketChildCare(out: MeshBuilder, fit: Fit): void {
  const ring = planRing(fit)
  const f = frameOf(ring)
  const G = LEVELS.garden
  const sLo = Math.min(...ring.map(f.s))
  const sHi = Math.max(...ring.map(f.s))
  const W = sHi - sLo

  // ---- the plinth up to garden level, and the deck it stands on
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 0.8) continue
    boxAlong(out, e.mid.x + e.nx * 0.1, G / 2, e.mid.z + e.nz * 0.1, e.L / 2 + 0.2, G / 2, 0.25, e.heading, PLINTH, CONC)
  }
  capPolygon(out, ring, G, BOARD_CONC, CONC, 4)

  // ---- the WINGS: four offset masses across the frontage, stepping in depth and height
  const WINGS: { s0: number; s1: number; d0: number; d1: number; h: number }[] = [
    { s0: 0.02, s1: 0.30, d0: 0.30, d1: 0.94, h: 4.6 },
    { s0: 0.26, s1: 0.56, d0: 0.12, d1: 0.78, h: 6.8 },
    { s0: 0.52, s1: 0.80, d0: 0.26, d1: 0.92, h: 4.6 },
    { s0: 0.76, s1: 0.98, d0: 0.10, d1: 0.74, h: 6.8 },
  ]
  for (const w of WINGS) {
    const su = (t: number): number => sLo + W * t
    const c = f.at((su(w.s0) + su(w.s1)) / 2, f.D * (w.d0 + w.d1) / 2)
    const hx = (su(w.s1) - su(w.s0)) / 2
    const hz = (f.D * (w.d1 - w.d0)) / 2
    const h = headAlong(f.e.tx, f.e.tz)
    boxAlong(out, c.x, G + w.h / 2, c.z, hx, w.h / 2, hz, h, BOARD_CONC, CONC)

    // the roof: a shallow pale ribbed plane, with the parapet stepping in and out to SUGGEST the undulation
    const rc: P2[] = [
      f.at(su(w.s0), f.D * w.d0), f.at(su(w.s1), f.D * w.d0), f.at(su(w.s1), f.D * w.d1), f.at(su(w.s0), f.D * w.d1),
    ]
    capPolygon(out, rc, G + w.h + 0.5, SILVER, METAL, 4)
    const ribs = Math.max(6, Math.round((hx * 2) / 1.4))
    for (let k = 0; k < ribs; k++) {
      const t = su(w.s0) + ((su(w.s1) - su(w.s0)) * (k + 0.5)) / ribs
      const p = f.at(t, (f.D * (w.d0 + w.d1)) / 2)
      boxAlong(out, p.x, G + w.h + 0.6, p.z, hz - 0.2, 0.09, 0.1, headAlong(-f.e.nx, -f.e.nz), SILVER_DK, METAL)
    }
    // the WAVY parapet, cheaply: 8 straight segments whose outstand rises and falls along the edge
    for (const dEdge of [w.d0, w.d1]) {
      const segs = 8
      for (let k = 0; k < segs; k++) {
        const t0 = su(w.s0) + ((su(w.s1) - su(w.s0)) * k) / segs
        const t1 = su(w.s0) + ((su(w.s1) - su(w.s0)) * (k + 1)) / segs
        const bulge = 0.45 * Math.sin(((k + 0.5) / segs) * Math.PI * 2)
        const p = f.at((t0 + t1) / 2, f.D * dEdge + (dEdge > 0.5 ? bulge : -bulge))
        boxAlong(out, p.x, G + w.h + 0.75, p.z, (t1 - t0) / 2, 0.35, 0.3, headAlong(f.e.tx, f.e.tz), SILVER, METAL)
      }
    }
    // the ROUND SKYLIGHT DRUMS: one or two a wing, pale, with a pale cap. Cheap and unmistakable from above.
    for (const t of [0.35, 0.68]) {
      const p = f.at(su(w.s0) + (su(w.s1) - su(w.s0)) * t, f.D * (w.d0 + (w.d1 - w.d0) * 0.45))
      frustum(out, p, G + w.h + 0.5, G + w.h + 1.9, 2.1, 1.8, PALE_STONE, CONC, 16)
      capPolygon(out, circle(p, 1.8, 16), G + w.h + 1.9, CREAM, CONC, 2)
    }
  }

  // ---- the MURAL WALL along the frontage: board-formed concrete carrying flat blocks of strong colour.
  // NOT a picture — see the note above. The panels are the honest statement of "there is painting here".
  {
    const e = f.e
    const n = 9
    for (let k = 0; k < n; k++) {
      const t = (e.L * (k + 0.5)) / n
      const p = { x: e.a.x + e.tx * t + e.nx * 0.35, z: e.a.z + e.tz * t + e.nz * 0.35 }
      boxAlong(out, p.x, G + 2.4, p.z, e.L / n / 2 - 0.15, 2.4, 0.35, e.heading, BOARD_CONC, CONC)
      if (k % 3 === 1) continue
      /*
       * PROUD of the wall face, not inside it. The first version put the panel at 0.2 m off the edge and the
       * wall itself at 0.35 with a 0.35 half-depth — so every mural was buried inside its own wall and the
       * street render came back a uniform grey. 0.78 clears the wall's face at 0.70.
       */
      boxAlong(out, p.x + e.nx * 0.78, G + 2.6, p.z + e.nz * 0.78, e.L / n / 2 - 0.9, 1.5, 0.1, e.heading, MURAL[k % MURAL.length], CONC)
    }
  }

  // ---- the long planted bank along Folsom, and the ONE BIG STRAIGHT STAIRCASE cutting up through it.
  // The bank is `stair`'s `terrace` preset, which pushes its deep treads to `out.decks` so they get planted.
  {
    const e = f.e
    // ON the frontage, not 9 m off it: `anchor: 'top'` puts the baseline at the HEAD and the bank descends
    // outward from it. Offset 9 m, the first render left the bank and its staircase floating as a separate
    // island in the road, with nothing connecting them to the building.
    const a = { x: e.a.x + e.nx * 1.0, z: e.a.z + e.nz * 1.0 }
    const b = { x: e.b.x + e.nx * 1.0, z: e.b.z + e.nz * 1.0 }
    stair(out, a, b, LEVELS.street, G, { anchor: 'top', preset: 'terrace', to: 0.42, colour: PLINTH })
    stair(out, a, b, LEVELS.street, G, { anchor: 'top', preset: 'terrace', from: 0.58, colour: PLINTH })
    stair(out, a, b, LEVELS.street, G, { anchor: 'top', from: 0.43, to: 0.57, rail: 'both', railKind: 'solid', colour: PALE_STONE, treadColour: PALE_STONE })
  }
}

export const MS_WEST: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  childrensCreativityMuseum,
  leRoyKingCarousel,
  southOfMarketChildCare,
}
