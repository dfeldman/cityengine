/**
 * The Yerba Buena Center for the Arts — TWO separate buildings on the Yerba Buena Gardens block, modelled from
 * the OWNER'S OWN STRUCTURAL DESCRIPTION (2026-09-23) rather than from photographs. Every earlier attempt
 * bailed: the Metreon stands across the street and is in every picture, every Mapillary frame shows the rear
 * (BUGS.md #128, YBCA fronts a pedestrian plaza so no vehicle-borne camera can stand on its good side), and
 * `way/24563073` is ONE undifferentiated polygon with no `building:part`s, so neither the photographs nor the
 * footprint describe the massing. The owner researched it and supplied the structure, so the blocker is gone.
 *
 * The owner's words, which are the ground truth here:
 *
 *   "There are several distinct buildings, the galleries and the theater. The mall is across the street and in
 *    all the pictures.  The GALLERIES BUILDING is an L-shaped steel box with 1 tall level and no windows, and
 *    3 'wings' that are half-circles sticking out the front facade. It has a patio cut out of one corner, with
 *    a large 'boat pitched down' glass structure letting light in to the lower level, and a large rectangular
 *    fountain.  The THEATER BUILDING is disconnected on the patio level but connected underground, and consists
 *    of two large rectangles. It has a mostly glass cube on the left, with two smaller rectangles that are light
 *    coloured metal panels on each side. The one on the right is the theater itself, which is a rectangle with
 *    one side sloped steeply down."
 *
 * And the owner's front (street) elevation of the galleries, the good-side view Mapillary structurally cannot
 * get — this one is EVIDENCE, corroborated by two Commons photographs on disk
 * (`docs/shots/refs/sf-commons/24563073/ybcfta-entrance-mission.jpg`, the north/main entrance from Mission
 * Street, and `…/ybcfta-side-yb-gardens.jpg`, the garden side):
 *   - the cladding is CORRUGATED METAL PANEL, pale grey/silver, fine VERTICAL RIBS the full height;
 *   - a DARK STONE BASE BAND along the pavement, waist-to-chest, a clean horizontal break;
 *   - the long frontage is genuinely BLANK — one very tall level, no windows, posters mounted flat on it;
 *   - the THREE HALF-CYLINDERS are clustered at ONE END of the frontage, read as barrel vaults seen END-ON
 *     above the flat roofline, their end faces GLAZED, their tops a smooth curve against the sky;
 *   - the parapet steps: the main blank box is taller, the roof DROPS where the vaults begin.
 * The garden-side Commons photograph shows a different elevation and is modelled as one: smooth white flat
 * panel with a continuous glazed strip at the pavement, no corrugation. Ribs go on the two STREET arms only.
 *
 * NOTHING IS TYPED IN METRES. Both builders derive their whole massing from `towerRing(fit)`, `fit.hx`,
 * `fit.hz` and `fit.height`, by four named rules, so they survive the frame the city happens to fit them in
 * (`fitTo` puts the LONGEST EDGE on local +x, which for 24563073 is the 68.6 m garden wall — the axes mean
 * nothing, and no rule here uses an axis name):
 *
 *   1. `emptyCorner` — the largest axis-aligned rectangle that is empty and anchored at a bounding-box corner,
 *      scored by min(width, depth) so a 3 m sliver never beats a room. Ranked over the four corners this
 *      separates the L's RE-ENTRANT QUADRANT (≈42 × 39 m, where the block's own corner building stands) from
 *      the CUT-OUT PATIO (≈12 × 14 m at the opposite corner) with a factor of three to spare. The L-shape is
 *      not asserted — it falls out of the ring, and the patio is the second-ranked corner.
 *   2. the two bounding-box sides that touch the re-entrant quadrant are the L's two ARMS. An arm's edges are
 *      the ones lying BEYOND the quadrant's own inner boundary, not merely the ones facing that way: the
 *      INNER wall of the quadrant faces exactly as the front does and stands 42 m behind it, and counting it
 *      built the vault bay into the courtyard wall and folded the roof polygon over itself in the first
 *      render. With the filter the FRONT is the longer arm — 48.9 m of Mission Street frontage against 28.6 m
 *      on Third. Both arms get ribs; the other two elevations get white panel.
 *   3. the front is in two segments with a step between them. The VAULT BAY is the segment nearer the
 *      re-entrant quadrant; the ENTRANCE is on the stepped-forward far segment. The bay is carved out of the
 *      mass — its roof DROPS, which is the owner's stepped parapet — as deep as it is wide, or the depth of
 *      the leg where that is shallower. What puts the curves against the SKY is not the depth but the spring
 *      line: `Hbay = min(0.78 H, 1.06 H − r)`, so the crowns clear the main parapet whenever the plan allows
 *      it at all. Three TANGENT half-cylinders fill the bay's front exactly, so their radius is a sixth of it
 *      — the count and the radius are the same fact.
 *   4. the theatre's two large rectangles are split at its WAIST: the station along its long axis, in the
 *      middle third, where the plan is narrowest. The GLASS CUBE is the half with the greater floor area and
 *      the raked AUDITORIUM is the other, which puts the cube toward the galleries and the fly tower toward
 *      Howard Street.
 *
 * `way/24563077` IS the theatre: it shares an edge with the galleries, carries the same `wikidata=Q1884883`,
 * `amenity=arts_centre` and `height=36` (a fly tower), its far end is 31 m off Howard Street and its long side
 * 2 m off the Esplanade footway, and its plan really is two large rectangles about a waist. Checked before use.
 *
 * INFERRED, not evidenced, and flagged as such: which END of the front carries the vaults (the owner says "one
 * end", not which); the form of the boat and the fountain in the patio; and the whole theatre, for which there
 * is no photograph at all — its left/right reading is the owner's, taken from the Esplanade.
 */
import earcut from 'earcut'
import type { MeshBuilder } from '../../buildings.ts'
import { prism, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { towerRing, faceBand } from '../tower.ts'
import { sign, notch } from '../parts.ts'
import { DECK_H } from './yerba-buena.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** corrugated panel on the street arms: pale grey/silver, from the owner's elevation and the entrance photo */
const PANEL: Rgb = [0.79, 0.80, 0.81]
/** the flat panel of the garden elevations, near white in the Commons garden photograph */
const PANEL_WHITE: Rgb = [0.88, 0.88, 0.87]
/** the dark stone base band along the pavement, and the patio's paving and parapets */
const STONE: Rgb = [0.30, 0.30, 0.31]
const GLASS: Rgb = [0.22, 0.29, 0.33]
/** the vault ends and the boat: glazed, and much lighter because they are lit from within and from the sky */
const GLASS_LIGHT: Rgb = [0.60, 0.69, 0.73]
const ROOF: Rgb = [0.30, 0.29, 0.29]
const WATER: Rgb = [0.42, 0.58, 0.63]

const T_METAL = surfaceTag('metal')
const T_GRANITE = surfaceTag('granite')
const T_GLASS = surfaceTag('glass')
const T_STUCCO = surfaceTag('stucco')
const T_CONCRETE = surfaceTag('concrete')

/* ------------------------------------------------------------------ plan geometry, all of it derived */

interface Box { x0: number; x1: number; z0: number; z1: number }

function bounds(ring: P2[]): Box {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  return { x0, x1, z0, z1 }
}

function inRing(x: number, z: number, ring: P2[]): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit
  }
  return hit
}

function polyArea(ring: P2[]): number {
  let t = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i]; const b = ring[(i + 1) % ring.length]; t += a.x * b.z - b.x * a.z }
  return Math.abs(t) / 2
}

/** Does the segment a→b pass through the OPEN rectangle? Slab clipping, so a wall lying on the edge does not. */
function segHitsBox(a: P2, b: P2, r: Box): boolean {
  let t0 = 0
  let t1 = 1
  const slab: [number, number, number, number][] = [[a.x, b.x - a.x, r.x0, r.x1], [a.z, b.z - a.z, r.z0, r.z1]]
  for (const [p, d, lo, hi] of slab) {
    if (Math.abs(d) < 1e-9) { if (p <= lo || p >= hi) return false; continue }
    let ta = (lo - p) / d
    let tb = (hi - p) / d
    if (ta > tb) { const s = ta; ta = tb; tb = s }
    t0 = Math.max(t0, ta)
    t1 = Math.min(t1, tb)
    if (t0 >= t1) return false
  }
  return t1 - t0 > 1e-6
}

/**
 * RULE 1. The biggest EMPTY axis-aligned rectangle anchored at one corner of the footprint's bounding box —
 * the bite taken out of the plan at that corner. Scored by `min(width, depth)` rather than by area, because
 * area picks the wrong thing: at 24563073's patio corner a 63 × 3.3 m sliver along the bounding box beats the
 * 12 × 14 m courtyard on area and loses to it three to one on this score. Candidates are the ring's own
 * coordinates, so nothing is sampled and nothing is typed.
 */
function emptyCorner(ring: P2[], cx: number, cz: number, bb: Box): Box & { score: number } {
  const none = { x0: cx, x1: cx, z0: cz, z1: cz, score: 0 }
  if (inRing(cx + (cx === bb.x1 ? -0.2 : 0.2), cz + (cz === bb.z1 ? -0.2 : 0.2), ring)) return none
  const xs = [...new Set(ring.map((p) => p.x).concat(cx === bb.x1 ? bb.x0 : bb.x1))]
  const zs = [...new Set(ring.map((p) => p.z).concat(cz === bb.z1 ? bb.z0 : bb.z1))]
  let best = none
  for (const ox of xs) {
    const w = Math.abs(ox - cx)
    if (w < 0.5) continue
    for (const oz of zs) {
      const h = Math.abs(oz - cz)
      if (h < 0.5) continue
      const score = Math.min(w, h)
      if (score <= best.score) continue
      const eps = 0.05
      const r: Box = {
        x0: Math.min(cx, ox) + eps, x1: Math.max(cx, ox) - eps,
        z0: Math.min(cz, oz) + eps, z1: Math.max(cz, oz) - eps,
      }
      if (r.x1 <= r.x0 || r.z1 <= r.z0) continue
      if (inRing((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, ring)) continue
      let clear = true
      for (let i = 0; i < ring.length && clear; i++) {
        const p = ring[i]
        if (p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1) clear = false
        else if (segHitsBox(p, ring[(i + 1) % ring.length], r)) clear = false
      }
      if (clear) best = { x0: Math.min(cx, ox), x1: Math.max(cx, ox), z0: Math.min(cz, oz), z1: Math.max(cz, oz), score }
    }
  }
  return best
}

/** The outward normal of edge `i` (the `faceBand` convention: the ring from `towerRing` winds anticlockwise). */
function normalAt(ring: P2[], i: number): { tx: number; tz: number; nx: number; nz: number; L: number; a: P2; b: P2 } {
  const a = ring[i]
  const b = ring[(i + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { tx, tz, nx: tz, nz: -tx, L, a, b }
}

/** Which of the four compass sides of the fitted box this edge belongs to, by its dominant outward normal. */
const sideOf = (nx: number, nz: number): number =>
  Math.abs(nx) >= Math.abs(nz) ? (nx > 0 ? 0 : 1) : (nz > 0 ? 2 : 3)

/** How far the mass runs inward from a point on `edge`: the first wall the inward ray meets. */
function depthInward(ring: P2[], from: P2, nx: number, nz: number): number {
  let best = Infinity
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const ex = b.x - a.x
    const ez = b.z - a.z
    const den = nx * ez - nz * ex
    if (Math.abs(den) < 1e-9) continue
    const t = ((a.x - from.x) * ez - (a.z - from.z) * ex) / den
    const u = ((a.x - from.x) * nz - (a.z - from.z) * nx) / den
    if (t > 0.5 && u >= 0 && u <= 1) best = Math.min(best, t)
  }
  return Number.isFinite(best) ? best : 0
}

/** The ring clipped to one side of an axis-aligned line (Sutherland–Hodgman): the theatre's two rectangles. */
function clipHalf(ring: P2[], axis: 'x' | 'z', at: number, keepAbove: boolean): P2[] {
  const val = (p: P2): number => (axis === 'x' ? p.x : p.z)
  const inside = (p: P2): boolean => (keepAbove ? val(p) >= at : val(p) <= at)
  const out: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const ia = inside(a)
    const ib = inside(b)
    if (ia) out.push(a)
    if (ia !== ib) {
      const t = (at - val(a)) / (val(b) - val(a))
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })
    }
  }
  return out
}

/** How much solid plan the line `axis = at` crosses — the width of the building there, used to find the waist. */
function crossExtent(ring: P2[], axis: 'x' | 'z', at: number): number {
  const hits: number[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const va = axis === 'x' ? a.x : a.z
    const vb = axis === 'x' ? b.x : b.z
    if ((va > at) === (vb > at)) continue
    const t = (at - va) / (vb - va)
    hits.push(axis === 'x' ? a.z + (b.z - a.z) * t : a.x + (b.x - a.x) * t)
  }
  hits.sort((p, q) => p - q)
  let total = 0
  for (let i = 0; i + 1 < hits.length; i += 2) total += hits[i + 1] - hits[i]
  return total
}

/* ------------------------------------------------------------------ walls */

/**
 * A CORRUGATED METAL wall, which is most of what a rider sees of the galleries at street level: a sawtooth of
 * vertical ribs (two triangles per rib, so a 250 m perimeter of it costs a few hundred triangles, not
 * thousands of boxes) on a DARK STONE BASE BAND. Both are the owner's evidenced front elevation. The rib
 * pitch is a fraction of the building's own height, so it stays a rib and never becomes a pilaster.
 */
function ribbedWall(out: MeshBuilder, a: P2, b: P2, base: number, top: number, pitch: number, depth: number): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 0.4) return
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const n = Math.max(3, Math.round(L / pitch))
  const at = (u: number, o: number, y: number): V3 => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
  for (let k = 0; k < n; k++) {
    const u0 = (k * L) / n
    const u1 = ((k + 1) * L) / n
    const o0 = k % 2 === 0 ? 0 : depth
    const o1 = (k + 1) % 2 === 0 ? 0 : depth
    const dx = tx * (u1 - u0) + nx * (o1 - o0)
    const dz = tz * (u1 - u0) + nz * (o1 - o0)
    const dl = Math.hypot(dx, dz) || 1
    out.quad([at(u0, o0, base), at(u1, o1, base), at(u1, o1, top), at(u0, o0, top)],
      [dz / dl, 0, -dx / dl], UV, PANEL, T_METAL)
  }
  // the stone base, standing a little proud of the ribs, with its own weathering top
  const o = depth * 1.6
  out.quad([at(0, o, 0), at(L, o, 0), at(L, o, base), at(0, o, base)], [nx, 0, nz], UV, STONE, T_GRANITE)
  out.quad([at(0, o, base), at(L, o, base), at(L, 0, base), at(0, 0, base)], [0, 1, 0], UV, STONE, T_GRANITE)
}

/**
 * The garden elevations: smooth white flat panel over a continuous glazed strip at the pavement, which is what
 * the Commons garden-side photograph shows and is NOT what the street front does. One shadow reveal at the
 * head of the glazing is the whole of the detail, because that is the whole of the detail on the building.
 */
function panelWall(out: MeshBuilder, a: P2, b: P2, y0: number, sill: number, top: number): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 0.4) return
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const at = (u: number, o: number, y: number): V3 => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
  const d = Math.min(0.35, L * 0.02)
  // 0..y0 is the RETAINING face from the street up to the garden deck this building's ground floor stands on
  if (y0 > 0.01) out.quad([at(0, d * 1.5, 0), at(L, d * 1.5, 0), at(L, d * 1.5, y0), at(0, d * 1.5, y0)], [nx, 0, nz], UV, STONE, T_GRANITE)
  out.quad([at(0, 0, y0), at(L, 0, y0), at(L, 0, sill), at(0, 0, sill)], [nx, 0, nz], UV, GLASS, T_GLASS)
  out.quad([at(0, d, sill), at(L, d, sill), at(L, d, top), at(0, d, top)], [nx, 0, nz], UV, PANEL_WHITE, T_STUCCO)
  out.quad([at(0, d, sill), at(L, d, sill), at(L, 0, sill), at(0, 0, sill)], [0, 1, 0], UV, STONE, T_CONCRETE)
}

/** A flat roof over any plan, at one height or on a plane: `earcut`, lifted by `yAt`. */
function cap(out: MeshBuilder, ring: P2[], yAt: (p: P2) => number, colour: Rgb, tag: number, n: V3 = [0, 1, 0]): void {
  if (ring.length < 3) return
  const flat: number[] = []
  for (const p of ring) flat.push(p.x, p.z)
  const tris = earcut(flat)
  for (let i = 0; i + 2 < tris.length; i += 3) {
    const p0 = ring[tris[i]]
    const p1 = ring[tris[i + 1]]
    const p2 = ring[tris[i + 2]]
    out.quad([[p0.x, yAt(p0), p0.z], [p1.x, yAt(p1), p1.z], [p2.x, yAt(p2), p2.z], [p2.x, yAt(p2), p2.z]],
      n, UV, colour, tag)
  }
}

/* ------------------------------------------------------------------ the galleries' own parts */

/**
 * One BARREL VAULT seen end-on: a half-cylinder springing from the bay's roof, its axis running INTO the
 * building, standing a little proud of the facade, its end face glazed. Three of these tangent to each other
 * are the building's silhouette and the thing that makes it recognisable, so this is where the triangles go:
 * sixteen segments round the arc, which at this radius is a smooth curve against the sky.
 */
function barrelVault(out: MeshBuilder, mid: P2, tx: number, tz: number, nx: number, nz: number,
                     spring: number, r: number, depth: number, proud: number): void {
  const N = 16
  const at = (theta: number, s: number): V3 => [
    mid.x + tx * Math.cos(theta) * r + nx * s,
    spring + Math.sin(theta) * r,
    mid.z + tz * Math.cos(theta) * r + nz * s,
  ]
  for (let i = 0; i < N; i++) {
    const t0 = (i / N) * Math.PI
    const t1 = ((i + 1) / N) * Math.PI
    const tm = (t0 + t1) / 2
    out.quad([at(t0, proud), at(t1, proud), at(t1, -depth), at(t0, -depth)],
      [tx * Math.cos(tm), Math.sin(tm), tz * Math.cos(tm)], UV, PANEL, T_METAL)
  }
  // the plain end where it dies into the back wall
  for (let i = 0; i < N; i += 2) {
    out.quad([[mid.x - nx * depth, spring, mid.z - nz * depth], at((i / N) * Math.PI, -depth),
      at(((i + 1) / N) * Math.PI, -depth), at(((i + 2) / N) * Math.PI, -depth)],
      [-nx, 0, -nz], UV, PANEL, T_METAL)
  }
  /*
   * The GLAZED end face, which is what the owner's elevation says these are. A plain fan of glass read as a
   * black hole punched in the parapet in the first render — glass takes almost nothing from a sky it faces
   * edge-on — so the lunette is framed: a metal rim round it and two radial mullions across it, both of them
   * catching the light, which is what tells the eye it is a window and not an opening.
   */
  const gr = r * 0.9
  const g = (theta: number): V3 => [mid.x + tx * Math.cos(theta) * gr + nx * proud,
    spring + Math.sin(theta) * gr, mid.z + tz * Math.cos(theta) * gr + nz * proud]
  for (let i = 0; i < N; i += 2) {
    out.quad([[mid.x + nx * proud, spring, mid.z + nz * proud], g((i / N) * Math.PI),
      g(((i + 1) / N) * Math.PI), g(((i + 2) / N) * Math.PI)], [nx, 0, nz], UV, GLASS_LIGHT, T_GLASS)
  }
  const rim = proud + r * 0.06
  for (let i = 0; i < N; i++) {
    const t0 = (i / N) * Math.PI
    const t1 = ((i + 1) / N) * Math.PI
    const p = (theta: number, rr: number): V3 => [mid.x + tx * Math.cos(theta) * rr + nx * rim,
      spring + Math.sin(theta) * rr, mid.z + tz * Math.cos(theta) * rr + nz * rim]
    out.quad([p(t0, gr), p(t1, gr), p(t1, r), p(t0, r)], [nx, 0, nz], UV, PANEL, T_METAL)
  }
  for (const theta of [Math.PI / 3, (2 * Math.PI) / 3]) {
    const w = r * 0.035
    const ux = -tx * Math.sin(theta)
    const uz = -tz * Math.sin(theta)
    const uy = Math.cos(theta)
    const c = (k: number, e: number): V3 => [mid.x + tx * Math.cos(theta) * gr * k + ux * w * e + nx * rim,
      spring + Math.sin(theta) * gr * k + uy * w * e, mid.z + tz * Math.cos(theta) * gr * k + uz * w * e]
    out.quad([c(0, -1), c(1, -1), c(1, 1), c(0, 1)], [nx, 0, nz], UV, PANEL, T_METAL)
  }
}

/**
 * The entrance, from `ybcfta-entrance-mission.jpg`: the wall recessed to a full-height glazed front, a pale
 * metal canopy slab out over the pavement with a lit soffit, one fat round column standing under its outer
 * corner, and the broad granite steps up to it. This is the only opening in the long blank frontage.
 */
function entrance(out: MeshBuilder, a: P2, b: P2, H: number, rib: number, floor: number): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const w = L * 0.5
  const u0 = (L - w) / 2
  const head = floor + (H - floor) * 0.42
  const at = (u: number, o: number, y: number): V3 => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
  /*
   * The glazed front stands PROUD of the ribs rather than recessed behind them. A recess was drawn first and
   * was invisible: the ribbed wall is built across the whole edge, so the glazing sat inside the solid and all
   * that showed was a canopy hanging over nothing — the same fault as the church portal behind a wall in
   * docs/RENDERING.md. Nothing here subtracts from a wall, so nothing here may pretend to.
   */
  const g = rib * 2.2
  out.quad([at(u0, g, floor), at(u0 + w, g, floor), at(u0 + w, g, head), at(u0, g, head)], [nx, 0, nz], UV, GLASS_LIGHT, T_GLASS)
  for (let k = 0; k <= 4; k++) {
    const u = u0 + (w * k) / 4
    const m = w * 0.014
    out.quad([at(u - m, g * 1.3, floor), at(u + m, g * 1.3, floor), at(u + m, g * 1.3, head), at(u - m, g * 1.3, head)],
      [nx, 0, nz], UV, PANEL_WHITE, T_METAL)
  }
  out.quad([at(u0 - m0(w), g * 1.3, head), at(u0 + w + m0(w), g * 1.3, head), at(u0 + w + m0(w), g * 1.3, head * 1.05),
    at(u0 - m0(w), g * 1.3, head * 1.05)], [nx, 0, nz], UV, PANEL_WHITE, T_METAL)
  // the canopy: a pale slab out over the pavement, its soffit the brightest thing in the photograph
  const proj = L * 0.17
  const th = H * 0.04
  const y0 = head * 1.05
  out.quad([at(u0 - th, proj, y0), at(u0 + w + th, proj, y0), at(u0 + w + th, proj, y0 + th), at(u0 - th, proj, y0 + th)],
    [nx, 0, nz], UV, PANEL_WHITE, T_STUCCO)
  for (const [uu, sgn] of [[u0 - th, -1], [u0 + w + th, 1]] as [number, number][]) {
    out.quad([at(uu, 0, y0), at(uu, proj, y0), at(uu, proj, y0 + th), at(uu, 0, y0 + th)], [tx * sgn, 0, tz * sgn], UV, PANEL_WHITE, T_STUCCO)
  }
  out.quad([at(u0 - th, proj, y0 + th), at(u0 + w + th, proj, y0 + th), at(u0 + w + th, 0, y0 + th), at(u0 - th, 0, y0 + th)],
    [0, 1, 0], UV, PANEL_WHITE, T_STUCCO)
  out.quad([at(u0 - th, proj, y0), at(u0 + w + th, proj, y0), at(u0 + w + th, 0, y0), at(u0 - th, 0, y0)],
    [0, -1, 0], UV, [0.86, 0.84, 0.80], T_STUCCO)
  // the two round columns under it, and the broad granite steps up to the doors
  for (const f of [0.28, 0.74]) {
    const c = at(u0 + w * f, proj * 0.7, 0)
    prism(out, c[0], c[2], floor, y0, th * 0.7, 10, PANEL_WHITE, T_STUCCO)
  }
  const steps = Math.max(3, Math.round(floor / (H * 0.022)))
  const rise = floor / steps
  for (let s = 0; s < steps; s++) {
    const o = proj * 0.45 + s * rise * 1.8
    const y = (steps - s) * rise
    out.quad([at(u0 - th, o, 0), at(u0 + w + th, o, 0), at(u0 + w + th, o, y), at(u0 - th, o, y)], [nx, 0, nz], UV, STONE, T_GRANITE)
    out.quad([at(u0 - th, o, y), at(u0 + w + th, o, y), at(u0 + w + th, o - rise * 1.8, y), at(u0 - th, o - rise * 1.8, y)],
      [0, 1, 0], UV, STONE, T_GRANITE)
  }
}

/** the mullion half-width, so the head bar over the doors lines up with the ones beside them */
const m0 = (w: number): number => w * 0.014

/**
 * The PATIO cut out of the corner, which is part of the building and sits at the level a rider passes:
 * the paved court, a parapet on the two sides open to the street, the LARGE RECTANGULAR FOUNTAIN, and the
 * "BOAT PITCHED DOWN" — a glazed hull over the light well down to the lower level, its ridge high at the
 * building end and running down to nothing at the open end, which is what "pitched down" describes.
 * The court is rule 1's second-ranked corner; the boat and the fountain are INFERRED from the owner's words,
 * placed in the two halves of it and sized from it, not typed.
 */
function patioCourt(out: MeshBuilder, r: Box, ring: P2[], H: number, deck: number): void {
  const w = r.x1 - r.x0
  const d = r.z1 - r.z0
  const corner: P2[] = [{ x: r.x0, z: r.z0 }, { x: r.x1, z: r.z0 }, { x: r.x1, z: r.z1 }, { x: r.x0, z: r.z1 }]
  cap(out, corner, () => deck, [0.66, 0.66, 0.64], T_GRANITE)
  // a parapet on the sides that are open (the ones the building is NOT behind)
  const par = H * 0.075
  for (let i = 0; i < 4; i++) {
    const a = corner[i]
    const b = corner[(i + 1) % 4]
    const mx = (a.x + b.x) / 2
    const mz = (a.z + b.z) / 2
    const ex = (b.z - a.z) / Math.hypot(b.x - a.x, b.z - a.z)
    const ez = -(b.x - a.x) / Math.hypot(b.x - a.x, b.z - a.z)
    // `ex, ez` is the square's OUTWARD normal: a side with the building beyond it is a wall, not a parapet
    if (inRing(mx + ex * 0.6, mz + ez * 0.6, ring)) continue
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const t: V3 = [(b.x - a.x) / L, 0, (b.z - a.z) / L]
    const th = par * 0.3
    const p = (u: number, y: number): V3 => [a.x + t[0] * u, y, a.z + t[2] * u]
    const q = (u: number, y: number): V3 => [a.x + t[0] * u - ex * th, y, a.z + t[2] * u - ez * th]
    out.quad([p(0, 0), p(L, 0), p(L, par), p(0, par)], [ex, 0, ez], UV, STONE, T_GRANITE)
    out.quad([q(0, 0), q(L, 0), q(L, par), q(0, par)], [-ex, 0, -ez], UV, STONE, T_GRANITE)
    out.quad([p(0, par), p(L, par), q(L, par), q(0, par)], [0, 1, 0], UV, STONE, T_GRANITE)
  }
  // the long axis of the court: the boat runs along it, against the building; the fountain sits beyond it
  const along: 'x' | 'z' = w >= d ? 'x' : 'z'
  const half = (k: 0 | 1): Box => along === 'x'
    ? { x0: r.x0 + (w / 2) * k, x1: r.x0 + (w / 2) * (k + 1), z0: r.z0, z1: r.z1 }
    : { x0: r.x0, x1: r.x1, z0: r.z0 + (d / 2) * k, z1: r.z0 + (d / 2) * (k + 1) }
  // whichever half has the building behind it takes the boat: that is where the lower level is
  const mid = (b: Box): P2 => ({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2 })
  const probe = (b: Box): number => {
    let n = 0
    for (const s of [-1, 1]) {
      if (inRing(mid(b).x + s * w * 0.62, mid(b).z, ring)) n++
      if (inRing(mid(b).x, mid(b).z + s * d * 0.62, ring)) n++
    }
    return n
  }
  const h0 = half(0)
  const h1 = half(1)
  const boatBox = probe(h0) >= probe(h1) ? h0 : h1
  const poolBox = boatBox === h0 ? h1 : h0

  // the fountain: a rectangular granite basin with the water inside it, low, big in its court
  const inset = Math.min(poolBox.x1 - poolBox.x0, poolBox.z1 - poolBox.z0) * 0.18
  const b: Box = { x0: poolBox.x0 + inset, x1: poolBox.x1 - inset, z0: poolBox.z0 + inset, z1: poolBox.z1 - inset }
  const rim = deck + H * 0.05
  const basin: P2[] = [{ x: b.x0, z: b.z0 }, { x: b.x1, z: b.z0 }, { x: b.x1, z: b.z1 }, { x: b.x0, z: b.z1 }]
  for (let i = 0; i < 4; i++) {
    const p = basin[i]
    const q = basin[(i + 1) % 4]
    const L = Math.hypot(q.x - p.x, q.z - p.z)
    const ex = (q.z - p.z) / L
    const ez = -(q.x - p.x) / L
    out.quad([[p.x, deck, p.z], [q.x, deck, q.z], [q.x, rim, q.z], [p.x, rim, p.z]], [ex, 0, ez], UV, STONE, T_GRANITE)
  }
  cap(out, basin, () => rim, STONE, T_GRANITE)
  const wi = inset * 0.5
  cap(out, [{ x: b.x0 + wi, z: b.z0 + wi }, { x: b.x1 - wi, z: b.z0 + wi }, { x: b.x1 - wi, z: b.z1 - wi }, { x: b.x0 + wi, z: b.z1 - wi }],
    () => rim - wi * 0.2, WATER, T_GLASS)

  // the boat: a glazed hull, ridge high against the building and pitched down to nothing at the open end
  const bw = (boatBox.x1 - boatBox.x0)
  const bd = (boatBox.z1 - boatBox.z0)
  const run: 'x' | 'z' = bw >= bd ? 'x' : 'z'
  const halfW = (run === 'x' ? bd : bw) * 0.26
  const cxm = (boatBox.x0 + boatBox.x1) / 2
  const czm = (boatBox.z0 + boatBox.z1) / 2
  const hi = H * 0.34
  const lo = H * 0.05
  // which end is against the building: put the high end there
  const endA: P2 = run === 'x' ? { x: boatBox.x0, z: czm } : { x: cxm, z: boatBox.z0 }
  const endB: P2 = run === 'x' ? { x: boatBox.x1, z: czm } : { x: cxm, z: boatBox.z1 }
  // the ridge is high where the building is and pitches down to the open end
  const reach = Math.max(w, d) * 0.3
  const beyond = (p: P2, s: number): boolean =>
    inRing(p.x + (run === 'x' ? s * reach : 0), p.z + (run === 'x' ? 0 : s * reach), ring)
  const aIsInner = beyond(endA, -1) || !beyond(endB, 1)
  const yA = aIsInner ? hi : lo
  const yB = aIsInner ? lo : hi
  const side = (s: number): V3[] => {
    const ox = run === 'x' ? 0 : halfW * s
    const oz = run === 'x' ? halfW * s : 0
    return [[endA.x + ox, deck, endA.z + oz], [endB.x + ox, deck, endB.z + oz],
      [endB.x, deck + yB, endB.z], [endA.x, deck + yA, endA.z]]
  }
  for (const s of [1, -1]) {
    const q = side(s)
    const nrm: V3 = run === 'x' ? [0, halfW, s * (yA + yB) * 0.5] : [s * (yA + yB) * 0.5, halfW, 0]
    out.quad(q, nrm, UV, GLASS_LIGHT, T_GLASS)
  }
  for (const [end, y, sgn] of [[endA, yA, -1], [endB, yB, 1]] as [P2, number, number][]) {
    const ox = run === 'x' ? 0 : halfW
    const oz = run === 'x' ? halfW : 0
    out.quad([[end.x - ox, deck, end.z - oz], [end.x + ox, deck, end.z + oz], [end.x, deck + y, end.z], [end.x, deck + y, end.z]],
      run === 'x' ? [sgn, 0, 0] : [0, 0, sgn], UV, GLASS_LIGHT, T_GLASS)
  }
}

/* ------------------------------------------------------------------ the galleries */

/**
 * 701 Mission Street, `way/24563073` — the GALLERIES. An L-shaped, one-tall-level, windowless box of
 * corrugated metal on a dark stone base, with three glazed barrel vaults breaking the roofline at one end of
 * the front, an entrance at the far end, and a patio cut out of the far corner holding the boat and the
 * fountain. The L, the arms, the vault bay and the patio are all read off `towerRing(fit)` by the four rules
 * at the top of this file; the heights are fractions of `fit.height`.
 */
export function ybcaGalleries_24563073(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height
  const bb = bounds(ring)
  const span = Math.min(bb.x1 - bb.x0, bb.z1 - bb.z0)

  // RULE 1: rank the four corners of the bounding box by the bite taken out of the plan there
  const corners = ([[bb.x1, bb.z1], [bb.x1, bb.z0], [bb.x0, bb.z1], [bb.x0, bb.z0]] as [number, number][])
    .map(([cx, cz]) => ({ cx, cz, ...emptyCorner(ring, cx, cz, bb) }))
    .sort((p, q) => q.score - p.score)
  const cut = corners[0]
  const patio = corners[1]
  const shaped = cut.score > span * 0.18

  /*
   * RULE 2. The two bounding-box sides that touch the re-entrant quadrant are the L's two ARMS — but an edge
   * facing that way is not necessarily ON that side: the INNER wall of the re-entrant quadrant faces exactly
   * the same way as the front and is 42 m behind it, and counting it made the first pass build the vault bay
   * into the courtyard wall and fold the roof polygon over itself. An arm's edges are the ones lying BEYOND
   * the quadrant: past its inner boundary, in the direction away from the corner it is anchored at. That is
   * exact and needs no tolerance, because the quadrant's own rectangle supplies the boundary.
   */
  const sxSide = cut.cx === bb.x1 ? 0 : 1
  const szSide = cut.cz === bb.z1 ? 2 : 3
  const innerX = cut.cx === bb.x1 ? cut.x0 : cut.x1
  const innerZ = cut.cz === bb.z1 ? cut.z0 : cut.z1
  const beyondZ = (p: P2): boolean => (cut.cz === bb.z1 ? p.z < innerZ : p.z > innerZ)
  const beyondX = (p: P2): boolean => (cut.cx === bb.x1 ? p.x < innerX : p.x > innerX)
  const armOf = (side: number): number[] => {
    const got: number[] = []
    for (let i = 0; i < ring.length; i++) {
      const e = normalAt(ring, i)
      if (sideOf(e.nx, e.nz) !== side) continue
      const mid = { x: (e.a.x + e.b.x) / 2, z: (e.a.z + e.b.z) / 2 }
      if (!shaped || (side === sxSide ? beyondZ(mid) : beyondX(mid))) got.push(i)
    }
    return got
  }
  const total = (ids: number[]): number => ids.reduce((t, i) => t + normalAt(ring, i).L, 0)
  const armA = armOf(sxSide)
  const armB = armOf(szSide)
  const front = total(armA) >= total(armB) ? sxSide : szSide
  const other = front === sxSide ? szSide : sxSide
  const street = new Set([front, other])

  // RULE 3: the vault bay is the front's segment nearest the re-entrant quadrant, the entrance the far one
  const frontEdges = front === sxSide ? armA : armB
  const near = (i: number): number => {
    const e = normalAt(ring, i)
    return Math.hypot((e.a.x + e.b.x) / 2 - cut.cx, (e.a.z + e.b.z) / 2 - cut.cz)
  }
  const vaultEdge = frontEdges.length > 0 ? [...frontEdges].sort((p, q) => near(p) - near(q))[0] : -1
  const entryEdge = frontEdges.filter((i) => i !== vaultEdge).sort((p, q) => normalAt(ring, q).L - normalAt(ring, p).L)[0] ?? -1

  /*
   * The vault bay, carved out of the mass so the roof DROPS where the vaults begin. The bay is as deep as it
   * is wide — a square gallery — or the whole depth of the leg where that is shallower, and the vaults spring
   * low enough that their crowns clear the main parapet, which is the owner's silhouette. Both are fractions
   * of the bay's own width and of `fit.height`; the clamp keeps the crown from vanishing behind the box when
   * OSM's height is tall for the plan.
   */
  let Hbay = H * 0.78
  let mass = ring
  let bay: P2[] | null = null
  let vault: { mid: P2; e: ReturnType<typeof normalAt>; r: number; depth: number } | null = null
  if (vaultEdge >= 0) {
    const e = normalAt(ring, vaultEdge)
    const r = e.L / 6
    if (r > H * 0.08) {
      Hbay = Math.min(H * 0.78, H * 1.06 - r)
      const mid = { x: (e.a.x + e.b.x) / 2, z: (e.a.z + e.b.z) / 2 }
      const deep = depthInward(ring, mid, -e.nx, -e.nz)
      const depth = Math.max(r * 1.6, Math.min(e.L, deep - r * 0.4))
      /*
       * The bay is held back a little from each end of its edge. A footprint traced from aerial imagery is not
       * exactly square — 24563073's courtyard wall runs 0.3 m out of true over 38 m — so a detour taken at an
       * exact right angle from the edge pokes a few centimetres through the neighbouring wall, the mass
       * polygon self-intersects, and `earcut` answers with a roof folded diagonally across the building. That
       * fold was visible in the first render and invisible in the code. The inset grows until both inner
       * corners are honestly inside the outline.
       */
      let hold = 0
      let inA = e.a
      let inB = e.b
      for (const f of [0.02, 0.05, 0.09, 0.15]) {
        hold = e.L * f
        inA = { x: e.a.x + e.tx * hold - e.nx * depth, z: e.a.z + e.tz * hold - e.nz * depth }
        inB = { x: e.b.x - e.tx * hold - e.nx * depth, z: e.b.z - e.tz * hold - e.nz * depth }
        if (inRing(inA.x, inA.z, ring) && inRing(inB.x, inB.z, ring)) break
      }
      const outA = { x: e.a.x + e.tx * hold, z: e.a.z + e.tz * hold }
      const outB = { x: e.b.x - e.tx * hold, z: e.b.z - e.tz * hold }
      bay = [outA, outB, inB, inA]
      mass = []
      for (let i = 0; i < ring.length; i++) {
        mass.push(ring[i])
        if (i === vaultEdge) { mass.push(outA, inA, inB, outB) }
      }
      // three TANGENT vaults fill the bay's own front exactly, so the radius follows the held-back width
      const bw = Math.hypot(outB.x - outA.x, outB.z - outA.z)
      vault = { mid: { x: (outA.x + outB.x) / 2, z: (outA.z + outB.z) / 2 }, e, r: bw / 6, depth }
    }
  }

  // the mass: ribbed metal on the two street arms, white panel on the two garden elevations
  /*
   * THE DECK. `docs/YERBA-BUENA.md` "THE LEVEL MODEL — authoritative": the YBCA buildings do NOT start at
   * street level. Their first floor IS level 2, the garden level, a storey above the pavement, and the
   * ground-level cut beside the theatre passes beneath it. So the cladding, the glazing and the entrance all
   * begin at `DECK_H` — the gardens builder's own exported constant, shared so the two models cannot drift —
   * and everything from the street up to it is a RETAINING face that the entrance steps climb. The parapet
   * stays where it was, because the photographs that set it were taken from the street.
   */
  const deck = Math.min(DECK_H, H * 0.35)
  const pitch = H * 0.075
  const rib = H * 0.012
  const baseH = deck
  const sill = deck + (H - deck) * 0.22
  const wall = (poly: P2[], top: number): void => {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (L < 0.4) continue
      const nx = (b.z - a.z) / L
      const nz = -(b.x - a.x) / L
      const s = sideOf(nx, nz)
      const mid = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }
      // ribbed only on the two street ARMS: the courtyard's inner wall faces the same way and is not a street
      const onArm = !shaped || (s === sxSide ? beyondZ(mid) : beyondX(mid))
      if (street.has(s) && onArm) ribbedWall(out, a, b, baseH, top, pitch, rib)
      else panelWall(out, a, b, deck, sill, top)
    }
  }
  wall(mass, H)
  cap(out, mass, () => H, ROOF, T_CONCRETE)
  if (bay) {
    wall(bay, Hbay)
    cap(out, bay, () => Hbay, ROOF, T_CONCRETE)
  }

  // RULE 3, the silhouette: three TANGENT half-cylinders filling the segment exactly
  if (vault) {
    const { mid, e, r, depth } = vault
    for (let k = -1; k <= 1; k++) {
      const c = { x: mid.x + e.tx * k * 2 * r, z: mid.z + e.tz * k * 2 * r }
      barrelVault(out, c, e.tx, e.tz, e.nx, e.nz, Hbay, r, depth, r * 0.28)
    }
  }

  if (entryEdge >= 0) {
    const e = normalAt(ring, entryEdge)
    entrance(out, e.a, e.b, H, rib, deck)
  }

  // the patio, and everything in it
  if (patio.score > span * 0.07) patioCourt(out, patio, ring, H, deck)
}

/* ------------------------------------------------------------------ the theatre */

/** near-black matt panelling: the middle mass, and the one material the group has nothing else like */
const DARK_PANEL: Rgb = [0.13, 0.13, 0.145]
/** the canopy over the theatre entrance — the only saturated colour on the block, and the thing that finds it */
const CANOPY_RED: Rgb = [0.70, 0.11, 0.10]

/**
 * The EAST FACE, from the owner's photograph taken inside the pedestrian passage between the theatre and
 * Moscone: a sheer, unbroken, flat face of pale metal panels in a regular LARGE grid, no windows, no
 * openings, no setback, running the full height to a plain dark base course, and meeting the street on a
 * crisp vertical arris. Evidence, not inference. The grid is the only modelling here: shallow joint lines at
 * a pitch taken from the wall's own height, which is what makes a blank panelled wall read as panelled
 * rather than as a slab.
 */
function gridPanelWall(out: MeshBuilder, a: P2, b: P2, y1: number, base: number, colour: Rgb): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 0.4) return
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const at = (u: number, o: number, y: number): V3 => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
  out.quad([at(0, 0, base), at(L, 0, base), at(L, 0, y1), at(0, 0, y1)], [nx, 0, nz], UV, colour, T_STUCCO)
  out.quad([at(0, 0.12, 0), at(L, 0.12, 0), at(L, 0.12, base), at(0, 0.12, base)], [nx, 0, nz], UV, STONE, T_GRANITE)
  out.quad([at(0, 0.12, base), at(L, 0.12, base), at(L, 0, base), at(0, 0, base)], [0, 1, 0], UV, STONE, T_GRANITE)
  // the joint lines: a large regular grid, a hair proud so it catches an edge of light
  const pitch = Math.max(1.5, (y1 - base) / 5)
  const j = Math.min(0.1, pitch * 0.05)
  const cols = Math.max(1, Math.round(L / pitch))
  for (let k = 1; k < cols; k++) {
    const u = (L * k) / cols
    out.quad([at(u - j, 0.05, base), at(u + j, 0.05, base), at(u + j, 0.05, y1), at(u - j, 0.05, y1)],
      [nx, 0, nz], UV, [colour[0] * 0.82, colour[1] * 0.82, colour[2] * 0.83], T_STUCCO)
  }
  const rows = Math.max(1, Math.round((y1 - base) / pitch))
  for (let k = 1; k < rows; k++) {
    const y = base + ((y1 - base) * k) / rows
    out.quad([at(0, 0.05, y - j), at(L, 0.05, y - j), at(L, 0.05, y + j), at(0, 0.05, y + j)],
      [nx, 0, nz], UV, [colour[0] * 0.82, colour[1] * 0.82, colour[2] * 0.83], T_STUCCO)
  }
}


/**
 * The far side of the SOLID nearest the street, at one station along the building. Used to give the two
 * middle masses clean rectangular blocks: the footprint is ragged where they stand — a slot in the plan made
 * the dark mass render as two thin fins with a gap, where the owner's photograph shows one proper block —
 * so they are drawn as a rectangle that reaches back only as far as the SHALLOWEST station allows. Taking the
 * minimum over stations is what guarantees the block never pushes past the real outline on the east side,
 * where the pedestrian passage runs and another model has to sit against this one.
 */
function firstSlab(ring: P2[], axis: 'x' | 'z', at: number, from: number, sgn: number): number {
  const hits: number[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const va = axis === 'x' ? a.x : a.z
    const vb = axis === 'x' ? b.x : b.z
    if ((va > at) === (vb > at)) continue
    const t = (at - va) / (vb - va)
    hits.push(axis === 'x' ? a.z + (b.z - a.z) * t : a.x + (b.x - a.x) * t)
  }
  if (hits.length < 2) return from
  hits.sort((p, q) => (sgn > 0 ? q - p : p - q))
  return hits[1]
}

/**
 * The hexagonal YBCA mark, by hand. `signage.ts` can only make LETTERS today — its `SignSource` has an
 * `{ kind: 'image' }` member that is documented NOT IMPLEMENTED, and another agent confirmed the path is dead
 * code — so a logo has to be geometry. A hexagon is six triangles and costs nothing, which is the whole
 * reason it is worth doing rather than waiting for the image path.
 */
function hexLogo(out: MeshBuilder, cx: number, cy: number, cz: number, nx: number, nz: number,
                 r: number, colour: Rgb): void {
  const tx = nz
  const tz = -nx
  const p = (i: number): V3 => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6
    return [cx + tx * Math.cos(a) * r, cy + Math.sin(a) * r, cz + tz * Math.cos(a) * r]
  }
  for (let i = 0; i < 6; i += 2) {
    out.quad([[cx, cy, cz], p(i), p(i + 1), p(i + 2)], [nx, 0, nz], UV, colour, T_STUCCO)
  }
}

/**
 * 700 Howard Street, `way/24563077` — the THEATRE, rebuilt 2026-09-23 against the owner's own STREET
 * PHOTOGRAPH, which arrived after the first pass and contradicted it. The first pass split the plan at its
 * single waist and made TWO masses, on the owner's earlier written description. The photograph shows THREE,
 * and the middle one is what makes the group read:
 *
 *   left to right along the street frontage —
 *   - a GLASS CUBE, two or three storeys, fully glazed in a fine mullion grid, carrying `Blue Shield of
 *     California Theater` and the hexagonal YBCA mark, with a BRIGHT RED CANOPY over its entrance: a flat
 *     awning on slender supports, and the only saturated colour anywhere on the block;
 *   - a DARK MASS immediately right of it — near-black matt panelling, no glazing, a completely different
 *     material from everything either side;
 *   - a SMALL PALE BLOCK;
 *   - a TALL PALE BLOCK, smooth white metal panel, considerably taller than the cube and the tallest thing in
 *     the group: the FLY TOWER, with the wordmark and the hexagon again, set high;
 *   - BROAD SHALLOW STEPS across the whole frontage, a small esplanade of wide treads with handrails;
 *   - at the left end, a WALKWAY rising to garden level under a canopy — the link up to the deck. The deck
 *     itself is another agent's and is deliberately NOT built here; only the ramp and its canopy are.
 *
 * EVIDENCED: the street frontage, which is the face the photograph shows — the three masses and their order,
 * their materials, the relative heights, the red canopy, the lettering and the logos, the steps, the ramp.
 * INFERRED: every other face, the depths of the masses (taken from the footprint, which is real, but the
 * photograph cannot confirm where one mass ends behind the frontage), and the RAKE. The owner earlier called
 * the theatre "a rectangle with one side sloped steeply down"; no slope is visible in this street view, so if
 * it exists it is on a face this photograph does not see. The fly tower's roof therefore falls only slightly,
 * and away from the street — a modest rake, held deliberately small because the evidence does not support it.
 *
 * RULE 4, revised, and still derived from the ring alone: sample the plan's WIDTH along its long axis and cut
 * it at its two NARROWEST stations (24563077 pinches to 25 m at one and 31 m at the next, against 51 m at its
 * widest), which are the joints between the three masses. The FLY TOWER is the end band with the greater
 * floor area — a theatre's bulk is its house and stage, not its lobby — and the GLASS CUBE is the smaller.
 * That puts the lobby at the HOWARD STREET end the building is addressed from, and reads left to right from
 * the Esplanade exactly as the photograph does. (The first pass had this backwards and came out mirrored.)
 * The middle band splits in half: the dark mass takes the half against the cube and the small pale block the
 * half against the tower, which is the order in the photograph. The STREET FRONTAGE is the long side whose
 * outward-facing ring edges total more (61.9 m against 47.7 m) — the Esplanade side, 2 m off the footway,
 * which is where the photograph was taken from.
 */
export function ybcaTheatre_24563077(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height
  const bb = bounds(ring)
  const axis: 'x' | 'z' = bb.x1 - bb.x0 >= bb.z1 - bb.z0 ? 'x' : 'z'
  const cross: 'x' | 'z' = axis === 'x' ? 'z' : 'x'
  const lo = axis === 'x' ? bb.x0 : bb.z0
  const hi = axis === 'x' ? bb.x1 : bb.z1
  const span = hi - lo
  if (span < 1) return

  // the two seams: the narrowest station, then the narrowest one far enough from it to be a different joint
  const N = 64
  const at = (k: number): number => lo + (span * k) / N
  const width = (k: number): number => crossExtent(ring, axis, at(k))
  const usable = (k: number): boolean => k > N * 0.14 && k < N * 0.86 && width(k) > 0
  let k1 = -1
  for (let k = 0; k <= N; k++) if (usable(k) && (k1 < 0 || width(k) < width(k1))) k1 = k
  let k2 = -1
  for (let k = 0; k <= N; k++) {
    if (!usable(k) || k1 < 0 || Math.abs(k - k1) < N * 0.15) continue
    if (k2 < 0 || width(k) < width(k2)) k2 = k
  }
  if (k1 < 0 || k2 < 0) return
  /*
   * The ring's pinch stations LOCATE the two joints, and that part is real geometry. They do not set the
   * widths: taken literally they make the middle group 10 m of a 65 m frontage, and the dark mass — half of
   * that — rendered as a fin barely wider than a column, where the owner's photograph shows a proper block
   * between the cube and the tower. Where the footprint and the photograph disagree about what the street
   * SEES, the photograph wins, so the middle group is widened about its own centre to the share of the
   * frontage the photograph gives it. The joints stay where the plan puts them; only their spacing is
   * photographic, and this comment is where that is admitted.
   */
  const jointC = (at(k1) + at(k2)) / 2
  const halfMid = Math.max(Math.abs(at(k1) - at(k2)) / 2, span * 0.13)
  const sA = Math.max(lo + span * 0.12, jointC - halfMid)
  const sB = Math.min(hi - span * 0.12, jointC + halfMid)

  const endHigh = clipHalf(ring, axis, sB, true)
  const middle = clipHalf(clipHalf(ring, axis, sA, true), axis, sB, false)
  const endLow = clipHalf(ring, axis, sA, false)
  if (endHigh.length < 3 || middle.length < 3 || endLow.length < 3) return
  /*
   * Which end band is which. The first pass made the GLASS CUBE the larger end band and the render came out
   * MIRRORED against the owner's street photograph — cube on the right, fly tower on the left, where the
   * photograph reads cube, dark mass, small pale block, tall tower from left to right. The rule was backwards:
   * a theatre's BULK is its house and stage, not its lobby, so the auditorium-and-fly-tower mass is the larger
   * end band (1510 m² here) and the lobby cube the smaller (940 m²). Two things corroborate the flip: the
   * street photograph's order, and the building's address — 700 HOWARD STREET, so the lobby is at the Howard
   * end, which is the end this rule now picks.
   */
  const cubeUp = polyArea(endHigh) < polyArea(endLow)
  const cubePoly = cubeUp ? endHigh : endLow
  const towerPoly = cubeUp ? endLow : endHigh
  // the dark mass is the larger of the two middle volumes in the photograph; the pale block is the offcut
  const sMid = cubeUp ? sB - (sB - sA) * 0.62 : sA + (sB - sA) * 0.62
  const darkBand = clipHalf(middle, axis, sMid, cubeUp)
  const smallBand = clipHalf(middle, axis, sMid, !cubeUp)

  /*
   * The STREET FRONTAGE: of the two long sides, the one whose outward-facing ring edges total more. That is
   * the side the photograph was taken from, and everything evidenced — the canopy, the steps, the ramp, both
   * signs — goes on it. Nothing here names an axis, so the city may fit this footprint any way it likes.
   */
  let plus = 0
  let minus = 0
  for (let i = 0; i < ring.length; i++) {
    const e = normalAt(ring, i)
    const n = cross === 'x' ? e.nx : e.nz
    if (Math.abs(n) < 0.7) continue
    if (n > 0) plus += e.L
    else minus += e.L
  }
  const sgn = minus >= plus ? -1 : 1
  const nx = cross === 'x' ? sgn : 0
  const nz = cross === 'x' ? 0 : sgn
  const heading = Math.atan2(nx, nz)
  /** the frontage plane of one mass: its outermost coordinate on the street side */
  const faceOf = (poly: P2[]): number => {
    const b = bounds(poly)
    return cross === 'x' ? (sgn < 0 ? b.x0 : b.x1) : (sgn < 0 ? b.z0 : b.z1)
  }
  /** a point in the plan from a distance ALONG the building and a distance ACROSS it */
  const pt = (along: number, across: number): P2 =>
    axis === 'x' ? { x: along, z: across } : { x: across, z: along }
  const alongOf = (p: P2): number => (axis === 'x' ? p.x : p.z)
  const midAlong = (poly: P2[]): number => {
    const b = bounds(poly)
    return axis === 'x' ? (b.x0 + b.x1) / 2 : (b.z0 + b.z1) / 2
  }

  /*
   * THE DECK, exactly as for the galleries and from the same shared constant: the theatre's ground floor IS
   * level 2. The masses themselves are drawn from the street, because their lower storey is real structure —
   * the east wall beside the pedestrian cut runs sheer all the way down to the passage floor and is a
   * retaining face — but every FEATURE the photograph shows (the glazing, the red canopy, the lettering, the
   * head of the ramp, the top of the steps) begins at the deck. The frontage steps climb the whole storey,
   * which is what the photograph shows them doing.
   */
  const deck = Math.min(DECK_H, H * 0.25)
  /*
   * The two MIDDLE masses are drawn as clean rectangular blocks rather than as the ragged band the clip
   * returns. The plan has a slot through it there, so the dark mass came out as two thin fins with daylight
   * between them, and the photograph shows one solid block between the cube and the tower. The block runs
   * from the street face back only as far as the shallowest station in its own band, so it can never reach
   * past the real outline on the east side.
   */
  const blockOf = (poly: P2[]): P2[] => {
    const b = bounds(poly)
    const aLo = axis === 'x' ? b.x0 : b.z0
    const aHi = axis === 'x' ? b.x1 : b.z1
    const front = faceOf(poly)
    let back = front - sgn * 1e6
    for (let k = 0; k <= 8; k++) {
      const st = aLo + (aHi - aLo) * (0.08 + (0.84 * k) / 8)
      const f = firstSlab(ring, axis, st, front, sgn)
      if (sgn < 0 ? f < back : f > back) back = f
    }
    if (!Number.isFinite(back) || Math.abs(back - front) < 0.5) return poly
    return [pt(aLo, front), pt(aHi, front), pt(aHi, back), pt(aLo, back)]
  }
  const darkPoly = blockOf(darkBand)
  const smallPoly = blockOf(smallBand)

  // the four masses, in the photograph's order and its relative heights
  /*
   * Heights are measured ABOVE THE DECK, not from the street. Taken from the street they were wrong twice
   * over: the cube's 0.45 H left only 0.34 H of glazing showing above the garden level, so it read as 40% of
   * the fly tower and the group came out as one blank slab with bits stuck to it. In the photograph the cube
   * is a substantial FOUR-STOREY volume that holds its own against the tower, so it takes 0.55 of the storeys
   * the tower has, and the two middle volumes sit between the two.
   */
  const above = H - deck
  const Hcube = deck + above * 0.63
  const Hdark = deck + above * 0.74
  const Hsmall = deck + above * 0.52
  /*
   * Every wall of a mass. The EAST FACE — the long side away from the street — is the panelled grid over a
   * dark base course the passage photograph shows; everything else is a plain plane. Nothing drawn here goes
   * outside the footprint on that side, so the wall stops clean at the passage edge and the gardens agent's
   * passage, bridge and terrace can sit against it.
   */
  const baseCourse = H * 0.055
  // `y0` lets a mass be walled in TWO vertical tiers (the passage notch below needs an upper tier that
  // starts above the void rather than at the street): the ribbed base course only ever belongs to the
  // tier that actually meets the ground, so it is skipped once `y0` is above street level.
  const wallsOf = (poly: P2[], y1: number, colour: Rgb, tag: number, y0 = 0): void => {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (L < 0.4) continue
      const ex = (b.z - a.z) / L
      const ez = -(b.x - a.x) / L
      const outward = cross === 'x' ? ex : ez
      // the east elevation is UNIFORMLY pale panel in the passage photograph, whatever the mass behind it
      // is faced with on the street, so the dark mass does not carry its own colour round the corner
      if (outward * sgn < -0.7 && y1 > baseCourse * 2 && y0 < 0.01) gridPanelWall(out, a, b, y1, baseCourse, PANEL_WHITE)
      else out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [ex, 0, ez], UV, colour, tag)
    }
  }
  // the dark mass: near-black matt panel, no glazing at all, which is the point of it
  wallsOf(darkPoly, Hdark, DARK_PANEL, T_STUCCO)
  cap(out, darkPoly, () => Hdark, DARK_PANEL, T_STUCCO)
  // the small pale block
  wallsOf(smallPoly, Hsmall, PANEL_WHITE, T_STUCCO)
  cap(out, smallPoly, () => Hsmall, ROOF, T_CONCRETE)
  /*
   * The FLY TOWER: the tallest of the group, and FLAT-TOPPED. The owner first described the theatre as "a
   * rectangle with one side sloped steeply down", and the first pass raked it steeply. Two photographs have
   * since arrived — the street frontage and, from inside the pedestrian passage, the east face — and NEITHER
   * shows a slope: the east wall runs sheer and unbroken to full height. A rake on either long face would now
   * contradict evidence, and a rake on one of the two unphotographed short ends would still cut a visible
   * slope into both long faces, which is the same contradiction seen edge-on. So the rake is not modelled at
   * all, and this comment is the record of that decision rather than a silent omission: if the slope exists
   * it is on a face nothing has photographed, and inventing it would cost the one thing both photographs
   * agree on.
   */
  const tb = bounds(towerPoly)
  /*
   * THE PEDESTRIAN PASSAGE (BUGS.md #134c, "cut a notch" / #144): the ground-level cut between the theatre
   * and Moscone runs beside the fly tower's blank east face, and the tower's own footprint used to run solid
   * across it — the reason #134c was first closed as "cannot be built". `notch()` (parts.ts, 2026-09-23)
   * takes a rectangular bite out of a ring and hands back the removed polygon, so the fix is to bite the
   * GROUND TIER only: from the street to `PASSAGE_H`, a rider's clearance, the tower stands on the notched
   * ring; from there to the roof it stands on the FULL, un-notched footprint, so the upper floors bridge over
   * the void exactly as described — solid above, open below. The terraces, the walkway on top and its mesh
   * canopy are the gardens agent's own work (`yerba-buena.ts`, not touched here) and already sit above this.
   *
   * `deep` is not guessed: `notch`'s `deep` is a FRACTION OF THE EDGE'S OWN LENGTH, so it is sized from the
   * tower's actual depth across the cut (`depthPerp`, with 25% margin) rather than a fixed number, which is
   * what makes the cut reliably tunnel all the way through the mass — a shallow `deep` would leave a hidden
   * back wall and the passage would still read as a dead end.
   */
  let passageEdge = -1
  let passageLen = 0
  for (let i = 0; i < towerPoly.length; i++) {
    const pa = towerPoly[i]
    const pb = towerPoly[(i + 1) % towerPoly.length]
    const L = Math.hypot(pb.x - pa.x, pb.z - pa.z)
    if (L < 0.4) continue
    const ex = (pb.z - pa.z) / L
    const ez = -(pb.x - pa.x) / L
    const outward = cross === 'x' ? ex : ez
    if (outward * sgn < -0.7 && L > passageLen) { passageLen = L; passageEdge = i }
  }
  const PASSAGE_H = deck
  let groundTowerPoly = towerPoly
  let passageCut: P2[] | null = null
  if (passageEdge >= 0) {
    /*
     * The corridor runs ALONGSIDE this wall (the owner's photograph was taken standing IN it, wall to one
     * side), not perpendicular through the building's 50 m bulk — a first pass tried to tunnel the full
     * depth and, correctly clamped by `notch`'s own 0.9 limit, only ever dead-ended in the tower's own far
     * wall. What actually blocks a corridor running the length of this face is the ground floor standing
     * FLUSH with it; a shallow setback (a few metres, not fifty) is all a passage at grade needs, so `wide`
     * takes almost the whole wall and `deep` stays small.
     */
    const bite = notch(towerPoly, { edge: passageEdge, along: 0.5 }, { wide: 0.85, deep: 0.18 })
    groundTowerPoly = bite.ring
    passageCut = bite.cut
  }
  wallsOf(groundTowerPoly, PASSAGE_H, PANEL_WHITE, T_STUCCO)
  wallsOf(towerPoly, H, PANEL_WHITE, T_STUCCO, PASSAGE_H)
  cap(out, towerPoly, () => H, ROOF, T_CONCRETE)
  if (passageCut) {
    // the soffit over the passage — the underside of the bridging mass — and a paved floor at street level
    cap(out, passageCut, () => PASSAGE_H, DARK_PANEL, T_STUCCO, [0, -1, 0])
    cap(out, passageCut, () => 0.02, STONE, T_GRANITE)
  }
  const frontT = faceOf(towerPoly)
  // the glass cube: fully glazed, a fine mullion grid
  wallsOf(cubePoly, deck, STONE, T_GRANITE)
  faceBand(out, cubePoly, deck, Hcube, { kind: 'curtain', wall: PANEL_WHITE, glass: GLASS_LIGHT,
    material: 'metal', pitch: Math.max(2, H * 0.06), floor: Math.max(3.2, H * 0.12) })
  cap(out, cubePoly, () => Hcube, ROOF, T_CONCRETE)

  /*
   * The BROAD SHALLOW STEPS: a small esplanade of wide treads climbing the whole storey from the pavement to
   * the entrance level, with a handrail at each end.
   *
   * The first version of these was wrong in two ways the render showed at once. They were built as a riser
   * quad and a tread quad per step with nothing between or beneath, so daylight came through the flight and
   * they read as floating louvres — a fence lying on its back — and the rise ran the wrong way, tallest at
   * the street. They are a SOLID MASS now: each step's riser covers only the band from the step below to its
   * own top, so the risers stack into one continuous face from the ground up, and each step carries an end
   * wall down to the ground on both sides. Nothing is open under them.
   *
   * They also ran the full length of the building, across the fly tower as well. In the photograph they front
   * the ENTRANCE, so they span the lobby cube and a little of the mass beside it, and stop.
   */
  const cbb0 = bounds(cubePoly)
  const cLo = axis === 'x' ? cbb0.x0 : cbb0.z0
  const cHi = axis === 'x' ? cbb0.x1 : cbb0.z1
  const grow = (cHi - cLo) * 0.22
  const a0 = cubeUp ? cLo - grow : cLo
  const a1 = cubeUp ? cHi : cHi + grow
  const faceAll = faceOf(cubePoly)
  // fewer, deeper treads, and tread and riser cut from the SAME stone: with nine shallow treads and a
  // paler top the flight read as a striped mat, because only the lighting should separate them
  const treads = Math.max(4, Math.round(deck / (H * 0.019)))
  const rise = deck / treads
  const going = rise * 1.9
  for (let s = 0; s < treads; s++) {
    const y0 = s * rise
    const y1 = (s + 1) * rise
    const off = (treads - s) * going
    const c0 = faceAll + sgn * off
    const c1 = faceAll + sgn * (off - going)
    const p0 = pt(a0, c0)
    const p1 = pt(a1, c0)
    const q0 = pt(a0, c1)
    const q1 = pt(a1, c1)
    // the riser: only the band this step adds, so the flight's front face is continuous from the ground up
    out.quad([[p0.x, y0, p0.z], [p1.x, y0, p1.z], [p1.x, y1, p1.z], [p0.x, y1, p0.z]], [nx, 0, nz], UV, STONE, T_GRANITE)
    out.quad([[p0.x, y1, p0.z], [p1.x, y1, p1.z], [q1.x, y1, q1.z], [q0.x, y1, q0.z]], [0, 1, 0], UV, STONE, T_GRANITE)
    // and an end wall each side, all the way to the ground, so no light passes under the flight
    for (const [g, h, sg] of [[p0, q0, -1], [p1, q1, 1]] as [P2, P2, number][]) {
      out.quad([[g.x, 0, g.z], [h.x, 0, h.z], [h.x, y1, h.z], [g.x, y1, g.z]],
        [nz * sg, 0, -nx * sg], UV, STONE, T_GRANITE)
    }
  }
  // the handrails: a slim post at each end of the flight, standing on the ground, and the rail between them
  const railY = deck + H * 0.028
  for (const e of [a0 + (a1 - a0) * 0.04, a0 + (a1 - a0) * 0.96]) {
    const near = pt(e, faceAll + sgn * going * treads)
    const far = pt(e, faceAll + sgn * going * 0.3)
    prism(out, near.x, near.z, 0, railY - deck + rise, H * 0.0035, 6, PANEL_WHITE, T_METAL)
    prism(out, far.x, far.z, deck - rise, railY, H * 0.0035, 6, PANEL_WHITE, T_METAL)
    out.quad([[near.x, railY - deck + rise, near.z], [far.x, railY, far.z], [far.x, railY - H * 0.007, far.z],
      [near.x, railY - deck + rise - H * 0.007, near.z]], [nx, 0, nz], UV, PANEL_WHITE, T_METAL)
  }

  /*
   * The RED CANOPY over the theatre entrance, on the glass cube's frontage: a flat awning on slender supports.
   * It is small, and it is the single strongest colour on the block — the cheapest identifying thing in this
   * whole file.
   */
  const cubeFace = faceOf(cubePoly)
  const cb = bounds(cubePoly)
  const cLen = axis === 'x' ? cb.x1 - cb.x0 : cb.z1 - cb.z0
  const cMid = midAlong(cubePoly)
  const cw = cLen * 0.3
  const cProj = cLen * 0.11
  const cy = deck + (Hcube - deck) * 0.42
  const cth = H * 0.012
  {
    const o0 = cubeFace
    const o1 = cubeFace + sgn * cProj
    const e0 = pt(cMid - cw / 2, o0)
    const e1 = pt(cMid + cw / 2, o0)
    const f0 = pt(cMid - cw / 2, o1)
    const f1 = pt(cMid + cw / 2, o1)
    out.quad([[f0.x, cy, f0.z], [f1.x, cy, f1.z], [f1.x, cy + cth, f1.z], [f0.x, cy + cth, f0.z]], [nx, 0, nz], UV, CANOPY_RED, T_METAL)
    out.quad([[f0.x, cy + cth, f0.z], [f1.x, cy + cth, f1.z], [e1.x, cy + cth, e1.z], [e0.x, cy + cth, e0.z]], [0, 1, 0], UV, CANOPY_RED, T_METAL)
    out.quad([[f0.x, cy, f0.z], [f1.x, cy, f1.z], [e1.x, cy, e1.z], [e0.x, cy, e0.z]], [0, -1, 0], UV, CANOPY_RED, T_METAL)
    for (const [g, sg] of [[e0, -1], [e1, 1]] as [P2, number][]) {
      const h = pt(alongOf(g), o1)
      out.quad([[g.x, cy, g.z], [h.x, cy, h.z], [h.x, cy + cth, h.z], [g.x, cy + cth, g.z]],
        [nz * sg, 0, -nx * sg], UV, CANOPY_RED, T_METAL)
    }
    for (const f of [0.15, 0.85]) {
      const c = pt(cMid - cw / 2 + cw * f, cubeFace + sgn * cProj * 0.85)
      prism(out, c.x, c.z, 0, cy, H * 0.004, 8, PANEL_WHITE, T_METAL)
    }
  }

  /*
   * The WALKWAY at the left end, rising under its canopy to garden level. The DECK it reaches is another
   * agent's building and is not drawn here — only the ramp, its parapet and the canopy over it, which belong
   * to this frontage.
   */
  {
    // the OUTER end of the cube band — the end away from the dark mass, which is where the photograph has it
    const seamNear = cubeUp ? sB : sA
    const far = cubeUp ? (axis === 'x' ? cb.x1 : cb.z1) : (axis === 'x' ? cb.x0 : cb.z0)
    const dir = Math.sign(far - seamNear) || 1
    const rLen = cLen * 0.34
    const rW = cProj * 1.5
    const u0 = far - dir * rLen
    const o0 = cubeFace + sgn * rW
    const steps2 = 6
    /*
     * The ramp is a SOLID slope, not a plank: a parapet down to the ground on the street side, an end wall at
     * the bottom, and the building behind it. The canopy over it rendered as a white board floating on two
     * posts — it is carried on a post at EVERY bay now, on the outer edge where the photograph has them, and
     * it is narrower than the walk it covers so the walk is visible under it.
     */
    const cInset = rW * 0.22
    for (let k = 0; k < steps2; k++) {
      const uA = u0 + dir * rLen * (k / steps2)
      const uB = u0 + dir * rLen * ((k + 1) / steps2)
      const yA = (deck * k) / steps2
      const yB = (deck * (k + 1)) / steps2
      const pA = pt(uA, o0)
      const pB = pt(uB, o0)
      const qA = pt(uA, cubeFace)
      const qB = pt(uB, cubeFace)
      out.quad([[pA.x, yA, pA.z], [pB.x, yB, pB.z], [qB.x, yB, qB.z], [qA.x, yA, qA.z]], [0, 1, 0], UV, STONE, T_GRANITE)
      // the parapet, standing on the ground for its whole length
      out.quad([[pA.x, 0, pA.z], [pB.x, 0, pB.z], [pB.x, yB + H * 0.028, pB.z], [pA.x, yA + H * 0.028, pA.z]],
        [nx, 0, nz], UV, PANEL_WHITE, T_STUCCO)
      out.quad([[pA.x, yA + H * 0.028, pA.z], [pB.x, yB + H * 0.028, pB.z], [qB.x, yB + H * 0.028, qB.z],
        [qA.x, yA + H * 0.028, qA.z]], [0, 1, 0], UV, PANEL_WHITE, T_STUCCO)
      // the canopy: a slab with a fascia, on a post at every bay
      const cyA = yA + H * 0.075
      const cyB = yB + H * 0.075
      const th = H * 0.008
      const gA = pt(uA, o0 - sgn * cInset)
      const gB = pt(uB, o0 - sgn * cInset)
      const hA = pt(uA, cubeFace)
      const hB = pt(uB, cubeFace)
      out.quad([[gA.x, cyA + th, gA.z], [gB.x, cyB + th, gB.z], [hB.x, cyB + th, hB.z], [hA.x, cyA + th, hA.z]],
        [0, 1, 0], UV, PANEL_WHITE, T_STUCCO)
      out.quad([[gA.x, cyA, gA.z], [gB.x, cyB, gB.z], [hB.x, cyB, hB.z], [hA.x, cyA, hA.z]],
        [0, -1, 0], UV, [0.82, 0.82, 0.81], T_STUCCO)
      out.quad([[gA.x, cyA, gA.z], [gB.x, cyB, gB.z], [gB.x, cyB + th, gB.z], [gA.x, cyA + th, gA.z]],
        [nx, 0, nz], UV, PANEL_WHITE, T_STUCCO)
      prism(out, gA.x, gA.z, yA + H * 0.028, cyA, H * 0.0035, 6, PANEL_WHITE, T_METAL)
    }
    // the end wall at the foot of the ramp, so nothing is open under it
    {
      const e0 = pt(u0, o0)
      const e1 = pt(u0, cubeFace)
      out.quad([[e0.x, 0, e0.z], [e1.x, 0, e1.z], [e1.x, H * 0.028, e1.z], [e0.x, H * 0.028, e0.z]],
        [-nz * dir, 0, nx * dir], UV, PANEL_WHITE, T_STUCCO)
    }
  }

  /*
   * The LETTERING, twice: low on the glass cube by the entrance, and high on the fly tower. Both go through
   * the signage system as `flat` signs so they get a real typeface rather than a block font. The hexagonal
   * YBCA mark beside each one is hand geometry, because `signage.ts`'s image source is documented NOT
   * IMPLEMENTED and is dead code.
   */
  const NAME = 'Blue Shield of California Theater'
  {
    const capH = cLen * 0.034
    const p = pt(cMid, cubeFace)
    sign(out, { type: 'flat', text: NAME, h: capH, face: 'grotesque', colour: [0.97, 0.97, 0.98],
      tracking: 0.06, lit: 'front', w: cw * 2.6, standoff: 0.08 },
    { x: p.x, y: deck + (Hcube - deck) * 0.68, z: p.z, heading })
    const hx = pt(cMid + cw * 1.35, cubeFace)
    hexLogo(out, hx.x, deck + (Hcube - deck) * 0.68, hx.z, nx, nz, capH * 1.5, [0.93, 0.94, 0.95])
  }
  {
    const tLen = axis === 'x' ? tb.x1 - tb.x0 : tb.z1 - tb.z0
    const tMid = midAlong(towerPoly)
    const capH = tLen * 0.045
    const p = pt(tMid, frontT)
    sign(out, { type: 'flat', text: NAME, h: capH, face: 'grotesque', colour: [0.42, 0.44, 0.47],
      tracking: 0.06, lit: 'none', w: tLen * 0.62, standoff: 0.08 },
    { x: p.x, y: H * 0.74, z: p.z, heading })
    const hx = pt(tMid - tLen * 0.38, frontT)
    hexLogo(out, hx.x, H * 0.74, hx.z, nx, nz, capH * 1.6, [0.42, 0.44, 0.47])
  }
}

export const YBCA: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  ybcaGalleries_24563073,
  ybcaTheatre_24563077,
}
