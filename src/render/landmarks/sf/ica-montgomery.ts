/**
 * The Institute of Contemporary Art San Francisco, 345 Montgomery Street (way/288511103). Hand-modelled: it
 * was wearing `restyle: "chinatown"` from the classifier's `rule 1: chinatown zone`, which put a Chinatown
 * shopfront style on a modernist glass museum because the footprint falls inside the zone polygon
 * (BUGS.md #118). The owner, riding past: "the missing thing is the Institute of Contemporary Art, a highly
 * distinctive modernist glass structure that's just rendered as a low brick building."
 *
 * THE STRUCTURE, from the owner, who knows the building. This is the specification; the ten photographs in
 * `docs/shots/refs/exp1/way-288511103-01.jpg` … `-10.jpg` are reference for proportion, colour and detail
 * only, and where they disagree with this, this wins:
 *
 * - a **black glass box** — a curtain wall, with barely-visible supports, not a punched wall and not a stone
 *   frame with glazing recessed behind it;
 * - **four red columns**, one per corner, each a rectangular prism **pointing diagonally OUT of the box**,
 *   running from the corner to well outside it. These are the building. No previous run has had them;
 * - a **red roof** that overhangs the box but **stops halfway along the columns**, so the outer half of each
 *   column is clear of it;
 * - the **tops of the columns are flush with the top of the roof**;
 * - the roof is **flat**. There is no chimney, no crown, no penthouse — it only looks like there is one from
 *   some angles, because of the projecting columns.
 *
 * In plan the effect is the owner's own diagram: the box, with a stub breaking out past each corner.
 *
 *      \________/
 *       |      |
 *       |______|
 *      /        \
 *
 * Why this is not `facade()`. The columns stand OUTSIDE the footprint, off the corners, on the diagonal.
 * `facade()`'s `frame` slot puts verticals in the plane of a wall, and every slot it has is placed on an
 * edge of `towerRing(fit)` or at the ring's centroid; there is no way to say "beyond the corner, on the
 * bisector". The `frame` slot was built for this building and still cannot reach it. Raw primitives are the
 * right answer here, not a failure.
 *
 * Every dimension is derived from the fit: the ring's principal corners, their distance from the centroid,
 * and `fit.height`. Nothing is typed in metres. The plan OSM carries has SIX corners — each street corner is
 * cut by a small chamfer — so the four the columns stand on are found by merging the vertices that are
 * really one corner (`principalCorners`), never by assuming a rectangle.
 *
 * Local frame: the fit's, +y up. Nothing here depends on which way the building is turned, which matters:
 * the city applies the manifest's `front` and `tools/exp-shots.ts` does not, and an earlier version of this
 * file keyed off `edgeFacing` and therefore dressed different elevations in the two.
 */
import { capPolygon, type MeshBuilder } from '../../buildings.ts'
import type { Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { towerRing, insetRing, faceBand } from '../tower.ts'
import { edgeAt, faceOn, boxAlong } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type P2 = { x: number; z: number }

/** The columns and the roof: an oxide red, dark enough to sit under a San Francisco sky. */
const RED: Rgb = [0.33, 0.13, 0.1]
/** the same, lit: the roof deck and the columns' caps */
const RED_LIT: Rgb = [0.37, 0.15, 0.11]
/** and for a soffit and a reveal, which never see the sun */
const RED_DARK: Rgb = [0.17, 0.07, 0.06]
/** The curtain wall. Black glass, and it must stay black: this is the one dark mass on the block. */
const GLASS: Rgb = [0.08, 0.09, 0.1]
/** the barely-visible supports the owner describes — a shade off the glass, never a grid of bars */
const MULLION: Rgb = [0.13, 0.14, 0.15]
/** the lobby behind the doors, the one warm thing on the building */
const DOORWAY: Rgb = [0.26, 0.22, 0.18]

const T_RED = surfaceTag('metal')
const T_GLASS = surfaceTag('glass')
const DOWN: [number, number, number] = [0, -1, 0]
const UP: [number, number, number] = [0, 1, 0]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

function centroid(ring: P2[]): P2 {
  let x = 0
  let z = 0
  for (const p of ring) { x += p.x; z += p.z }
  return { x: x / ring.length, z: z / ring.length }
}

/**
 * The four corners a column stands on.
 *
 * OSM traces this plan with six vertices: each street corner is cut by a chamfer a couple of metres across,
 * so two ring vertices there are really one corner of the building. Vertices closer together than `tol` are
 * merged to their midpoint, and the four furthest from the centroid are the corners — which degrades
 * correctly on a plainer plan, where the merge does nothing and the four extremes are the four corners.
 */
function principalCorners(ring: P2[], tol: number): P2[] {
  const merged: { x: number; z: number; n: number }[] = []
  for (const p of ring) {
    const last = merged[merged.length - 1]
    if (last && Math.hypot(p.x - last.x / last.n, p.z - last.z / last.n) < tol) {
      last.x += p.x; last.z += p.z; last.n++
    } else merged.push({ x: p.x, z: p.z, n: 1 })
  }
  // the ring closes, so the last group may be the same corner as the first
  if (merged.length > 1) {
    const a = merged[0]
    const b = merged[merged.length - 1]
    if (Math.hypot(a.x / a.n - b.x / b.n, a.z / a.n - b.z / b.n) < tol) {
      a.x += b.x; a.z += b.z; a.n += b.n
      merged.pop()
    }
  }
  const pts = merged.map((m) => ({ x: m.x / m.n, z: m.z / m.n }))
  const c = centroid(ring)
  const far = [...pts].sort((p, q) => Math.hypot(q.x - c.x, q.z - c.z) - Math.hypot(p.x - c.x, p.z - c.z))
  // back into ring order, so neighbouring columns are neighbours
  return far.slice(0, 4).sort((p, q) => Math.atan2(p.z - c.z, p.x - c.x) - Math.atan2(q.z - c.z, q.x - c.x))
}

export function ica_345_montgomery(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height
  const c = centroid(ring)
  const R = Math.min(fit.hx, fit.hz)

  /** how deep the roof slab is, and therefore where the glass box stops */
  const roofT = H * 0.055
  const boxTop = H - roofT
  /** the columns: a prism this long on the diagonal, this wide across it, embedded this far into the corner */
  const colL = R * 0.44
  const colW = R * 0.14
  const embed = colL * 0.22
  /*
   * The roof stops HALFWAY ALONG the columns, so its corners reach the midpoint of each prism: the prism
   * runs from `embed` inside the corner to `colL - embed` outside it, and its middle is at `colL / 2 -
   * embed`. `insetRing` with a negative distance pushes every vertex out along its own radial, which at a
   * corner IS the diagonal the column runs on — the same line, so the roof meets each column at its middle
   * rather than somewhere near it.
   */
  const over = colL / 2 - embed
  const roofRing = insetRing(ring, -over)
  const kerbRing = insetRing(ring, -colW * 0.08)

  // the elevation the doors are in, needed before the glass goes on: its sheet is drawn with a hole in it
  let doorEdge = 0
  for (let i = 0; i < ring.length; i++) if (edgeAt(ring, i).L > edgeAt(ring, doorEdge).L) doorEdge = i
  const dh = H * 0.2
  const dw = R * 0.14 * 1.3
  const back = R * 0.14 * 0.45

  // ── the black glass box: a curtain wall on every elevation, with the supports barely showing
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (i === doorEdge) {
      /*
       * The sheet with the doorway cut out of it: left of the opening, right of it, and over its head. The
       * first version drew the whole sheet and then put the doors BEHIND it — the glass is opaque geometry,
       * so the entrance was invisible and all that showed was its hood floating on a blank wall.
       */
      const P = (u: number, y: number, o = 0): [number, number, number] =>
        [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
      const n: [number, number, number] = [e.nx, 0, e.nz]
      const d0 = e.L / 2 - dw
      const d1 = e.L / 2 + dw
      out.quad([P(0, 0), P(d0, 0), P(d0, boxTop), P(0, boxTop)], n, UV, GLASS, T_GLASS)
      out.quad([P(d1, 0), P(e.L, 0), P(e.L, boxTop), P(d1, boxTop)], n, UV, GLASS, T_GLASS)
      out.quad([P(d0, dh), P(d1, dh), P(d1, boxTop), P(d0, boxTop)], n, UV, GLASS, T_GLASS)
    } else {
      faceOn(out, ring, i, 0, boxTop, { kind: 'blank', wall: GLASS, material: 'glass' })
    }
    // a chamfer at a street corner is a couple of metres long and mostly buried in the column standing on
    // it: glass, and nothing drawn on it
    if (e.L < colW) continue
    /** a member standing on this edge: `u` along it, `o` out of it, half-sizes w and h, half-depth d */
    const member = (u: number, y: number, o: number, w: number, h: number, d: number, col: Rgb): void =>
      boxAlong(out, e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o, w, h, d, e.heading, col, T_RED)
    // the mullions: shallow, close, and only a shade off the glass, so the wall reads as one dark sheet
    const pitch = H * 0.055
    const d = colW * 0.035
    for (let k = 1; k * pitch < e.L; k++) member(k * pitch, boxTop / 2, d, d * 0.55, boxTop / 2, d, MULLION)
    // and the floor lines behind them, so the sheet has a scale
    const floors = Math.max(2, Math.round(boxTop / (H * 0.24)))
    for (let k = 1; k < floors; k++) member(e.L / 2, (k / floors) * boxTop, d * 0.7, e.L / 2, d * 0.7, d * 0.7, MULLION)
  }

  // ── the roof: a flat red slab over the box, overhanging it, with a lit deck and a dark soffit
  faceBand(out, roofRing, boxTop, H, { kind: 'blank', wall: RED, material: 'metal' })
  capPolygon(out, roofRing, H, RED_LIT, T_RED)
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    const a = ring[i]
    const b = ring[j]
    const A = roofRing[i]
    const B = roofRing[j]
    out.quad([[A.x, boxTop, A.z], [B.x, boxTop, B.z], [b.x, boxTop, b.z], [a.x, boxTop, a.z]], DOWN, UV, RED_DARK, T_RED)
  }

  // ── the four columns: rectangular prisms on the corner bisectors, standing OUTSIDE the box, their tops
  //    flush with the top of the roof and their outer halves clear of it. This is the building.
  for (const p of principalCorners(ring, R * 0.3)) {
    const dx = p.x - c.x
    const dz = p.z - c.z
    const l = Math.hypot(dx, dz) || 1
    const ux = dx / l
    const uz = dz / l
    /*
     * `boxAlong`'s local +z runs along its heading, and the heading of an outward direction (u.x, u.z) is
     * atan2(u.x, u.z) — the convention `edgeAt` sets, where a wall's heading is built from its outward
     * normal. So `hz` is the half-length along the diagonal and `hx` the half-width across it.
     */
    const heading = Math.atan2(ux, uz)
    const mx = p.x + ux * (colL / 2 - embed)
    const mz = p.z + uz * (colL / 2 - embed)
    /*
     * From 0 to H exactly: the prism's own top face lands at H, which is the top of the roof slab, and the
     * owner is specific that the two are FLUSH. A lit cap block on top of this stood a few centimetres
     * proud, and on screen each column read as carrying on past the roof.
     */
    const top = H - roofT * 0.03
    boxAlong(out, mx, top / 2, mz, colW / 2, top / 2, colL / 2, heading, RED, T_RED)
    // and a shallow reveal down the outer end: these prisms are large, and a flat one is a slab
    boxAlong(out, p.x + ux * (colL - embed), H / 2, p.z + uz * (colL - embed), colW * 0.17, H / 2, colW * 0.05,
      heading, RED_DARK, T_RED)
  }

  // ── the entrance, on the longest elevation: doors set back into the curtain wall under a thin red hood.
  //    A rider passes within metres of it, and it is the only thing on the building at eye level.
  {
    const e = edgeAt(ring, doorEdge)
    const P = (u: number, y: number, o: number): [number, number, number] =>
      [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
    const u0 = e.L / 2 - dw
    const u1 = e.L / 2 + dw
    out.quad([P(u0, 0, -back), P(u1, 0, -back), P(u1, dh, -back), P(u0, dh, -back)], [e.nx, 0, e.nz], UV, DOORWAY, T_GLASS)
    for (const [u, sgn] of [[u0, -1], [u1, 1]] as const) {
      out.quad([P(u, 0, -back), P(u, 0, 0), P(u, dh, 0), P(u, dh, -back)], [e.tx * sgn, 0, e.tz * sgn], UV, GLASS, T_GLASS)
    }
    out.quad([P(u0, dh, -back), P(u1, dh, -back), P(u1, dh, 0), P(u0, dh, 0)], DOWN, UV, RED_DARK, T_RED)
    boxAlong(out, ...P(e.L / 2, dh * 1.04, back * 0.7), dw * 1.25, H * 0.007, back * 1.5, e.heading, RED, T_RED)
  }

  // ── a red kerb where the glass meets the pavement: a curtain wall does not sit on the ground, and this is
  //    the part of the building a rider passes at arm's length
  faceBand(out, kerbRing, 0, H * 0.022, { kind: 'blank', wall: RED, material: 'metal' })
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    const a = ring[i]
    const b = ring[j]
    const A = kerbRing[i]
    const B = kerbRing[j]
    out.quad([[a.x, H * 0.022, a.z], [b.x, H * 0.022, b.z], [B.x, H * 0.022, B.z], [A.x, H * 0.022, A.z]], UP, UV, RED, T_RED)
  }
}
