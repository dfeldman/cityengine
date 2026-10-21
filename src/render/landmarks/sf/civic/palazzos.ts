/**
 * Three Renaissance-revival neighbours of City Hall, each from its Mapillary frames (scratchpad audit/refs*):
 *
 *  - `newConservatoryTheatre` — 25 Van Ness, the 1913 Masonic Temple (now the New Conservatory Theatre Center): a white
 *    palazzo on the Van Ness / Market corner. A rusticated base of tall round arches with the carved arched entrance in
 *    the middle of the Van Ness front, a floor of mullioned rectangular windows, the main floor of round-arched
 *    windows, a row of small square attic windows and the deep cornice on long close-set brackets. The figure on the
 *    Market-side corner. The arcade turns both long sides (refs8/way-35174721 -02, -04, -05, -07).
 *  - `californiaHall` — 625 Polk, California Hall (1912): buff-brown brick over a rusticated stone ground storey,
 *    stone quoins and window surrounds, a modillion cornice, the iron canopy over the Polk Street entrance and the
 *    stepped, scrolled Flemish gable over it, gabled dormers along Turk (refs/way-256045018-01).
 *  - `tharpSchool` — the Newton J. Tharp Commercial School: yellow brick on a raised basement, a tall main floor of
 *    round-arched windows, two floors of windows between brick piers, a modillion cornice (refs/relation-3441095-01).
 *
 * The front of each is found from the real outline, by its shape, not from the frame: the manifests say
 * `front: "street"`, which the city and tools/model-shots.ts resolve differently. Along an edge `u` runs from its
 * first corner `a` to `b` and `o` is out from the wall; the ring is anticlockwise, so the edge before a face is the
 * one round the corner to its left as you look at it.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { simplifyRing } from '../../tower.ts'

type P2 = { x: number; z: number }
interface Edge { a: P2; b: P2; tx: number; tz: number; nx: number; nz: number; L: number }

const T = {
  stucco: surfaceTag('stucco'), ashlar: surfaceTag('ashlar'), brick: surfaceTag('brick'), granite: surfaceTag('granite'),
  concrete: surfaceTag('concrete'), metal: surfaceTag('metal'), tile: surfaceTag('tile'), glass: surfaceTag('glass'),
}

// ------------------------------------------------------------------------------------------- the edge frame

function edgeOf(ring: P2[], i: number): Edge {
  const n = ring.length
  const a = ring[((i % n) + n) % n]
  const b = ring[(((i + 1) % n) + n) % n]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { a, b, tx, tz, nx: tz, nz: -tx, L }
}

const area2 = (r: P2[]): number => {
  let s = 0
  for (let i = 0; i < r.length; i++) { const a = r[i]; const b = r[(i + 1) % r.length]; s += a.x * b.z - b.x * a.z }
  return s
}

/** the real outline, anticlockwise (the rectangle when there is none) */
function rawRing(fit: Fit): P2[] {
  const r = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  return area2(r) >= 0 ? r : [...r].reverse()
}

/** the walls: collinear runs merged */
function wallRing(raw: P2[]): P2[] {
  const r = simplifyRing(raw, 1.5, 0.06)
  return area2(r) >= 0 ? r : [...r].reverse()
}

/** the wall of `ring` that an edge of the raw outline lies on */
function matchEdge(ring: P2[], e: Edge): number {
  let best = 0
  let score = Infinity
  const m = { x: (e.a.x + e.b.x) / 2, z: (e.a.z + e.b.z) / 2 }
  for (let j = 0; j < ring.length; j++) {
    const f = edgeOf(ring, j)
    const off = Math.abs((m.x - f.a.x) * f.nx + (m.z - f.a.z) * f.nz)
    const s = off + (1 - (e.nx * f.nx + e.nz * f.nz)) * 40
    if (s < score) { score = s; best = j }
  }
  return best
}

/** the edge facing −z, the longer of near-ties: the fallback front */
function towardMinusZ(ring: P2[]): number {
  let best = 0
  let score = Infinity
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    const s = e.nz - e.L * 0.002
    if (s < score) { score = s; best = i }
  }
  return best
}

/** a point `u` along an edge and `o` out from it */
const P3 = (e: Edge, u: number, o: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]

const quad = (out: MeshBuilder, p: [number, number, number][], n: [number, number, number], c: Rgb, tag: number): void =>
  out.quad(p, n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)

/** a block standing proud of the wall: front, top, cheeks (no back, no underside unless `under`) */
function slab(out: MeshBuilder, e: Edge, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag: number, under = false): void {
  quad(out, [P3(e, u0, o1, y0), P3(e, u1, o1, y0), P3(e, u1, o1, y1), P3(e, u0, o1, y1)], [e.nx, 0, e.nz], c, tag)
  quad(out, [P3(e, u0, o0, y1), P3(e, u0, o1, y1), P3(e, u1, o1, y1), P3(e, u1, o0, y1)], [0, 1, 0], c, tag)
  quad(out, [P3(e, u0, o0, y0), P3(e, u0, o1, y0), P3(e, u0, o1, y1), P3(e, u0, o0, y1)], [-e.tx, 0, -e.tz], c, tag)
  quad(out, [P3(e, u1, o1, y0), P3(e, u1, o0, y0), P3(e, u1, o0, y1), P3(e, u1, o1, y1)], [e.tx, 0, e.tz], c, tag)
  if (under) quad(out, [P3(e, u0, o1, y0), P3(e, u0, o0, y0), P3(e, u1, o0, y0), P3(e, u1, o1, y0)], [0, -1, 0], c, tag)
}

/** a flat rectangle on the wall, `o` proud of it */
function panel(out: MeshBuilder, e: Edge, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag: number): void {
  quad(out, [P3(e, u0, o, y0), P3(e, u1, o, y0), P3(e, u1, o, y1), P3(e, u0, o, y1)], [e.nx, 0, e.nz], c, tag)
}

/** the underside of an overhang */
function soffit(out: MeshBuilder, e: Edge, u0: number, u1: number, o0: number, o1: number, y: number, c: Rgb, tag: number): void {
  quad(out, [P3(e, u0, o1, y), P3(e, u0, o0, y), P3(e, u1, o0, y), P3(e, u1, o1, y)], [0, -1, 0], c, tag)
}

/** a moulding run along a whole wall, its ends carried round the corners by its own projection */
function course(out: MeshBuilder, e: Edge, y0: number, y1: number, o: number, c: Rgb, tag: number, under = false): void {
  slab(out, e, -o, e.L + o, 0, o, y0, y1, c, tag, under)
}

/** a round-headed opening: a rectangle up to the springing and the head filled, in the plane `o` */
function archOpening(out: MeshBuilder, e: Edge, uc: number, w: number, y0: number, spring: number, o: number, c: Rgb, tag = 0, seg = 6): void {
  const r = w / 2
  panel(out, e, uc - r, uc + r, o, y0, spring, c, tag)
  for (let k = 0; k < seg; k++) {
    const a0 = Math.PI * (k / seg)
    const a1 = Math.PI * ((k + 1) / seg)
    const u0 = uc - r * Math.cos(a0)
    const u1 = uc - r * Math.cos(a1)
    quad(out, [P3(e, u0, o, spring), P3(e, u1, o, spring), P3(e, u1, o, spring + r * Math.sin(a1)), P3(e, u0, o, spring + r * Math.sin(a0))],
      [e.nx, 0, e.nz], c, tag)
  }
}

/** the archivolt: a flat band of voussoirs round an arch head, from radius r0 to r1, `o` proud */
function archivolt(out: MeshBuilder, e: Edge, uc: number, r0: number, r1: number, spring: number, o: number, c: Rgb, tag: number, seg = 6): void {
  for (let k = 0; k < seg; k++) {
    const a0 = Math.PI * (k / seg)
    const a1 = Math.PI * ((k + 1) / seg)
    const p = (r: number, a: number): [number, number, number] => P3(e, uc - r * Math.cos(a), o, spring + r * Math.sin(a))
    quad(out, [p(r0, a0), p(r1, a0), p(r1, a1), p(r0, a1)], [e.nx, 0, e.nz], c, tag)
  }
}

/** a triangle on the wall plane (a gable's face): base u0..u1 at y0, apex at y1 */
function gableFace(out: MeshBuilder, e: Edge, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag: number): void {
  const um = (u0 + u1) / 2
  quad(out, [P3(e, u0, o, y0), P3(e, u1, o, y0), P3(e, um, o, y1), P3(e, um, o, y1)], [e.nx, 0, e.nz], c, tag)
}

/** a little pitched roof over a gable: its two slopes from the face `o1` back to `o0` */
function gableRoof(out: MeshBuilder, e: Edge, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag: number): void {
  const um = (u0 + u1) / 2
  quad(out, [P3(e, u0, o1, y0), P3(e, u0, o0, y0), P3(e, um, o0, y1), P3(e, um, o1, y1)], [-e.tx * 0.6, 0.8, -e.tz * 0.6], c, tag)
  quad(out, [P3(e, um, o1, y1), P3(e, um, o0, y1), P3(e, u1, o0, y0), P3(e, u1, o1, y0)], [e.tx * 0.6, 0.8, e.tz * 0.6], c, tag)
}

/** bay centres along a wall: corner piers `cp` wide, the rest in `n` bays near `pitch` */
function bays(L: number, cp: number, pitch: number): number[] {
  const span = L - 2 * cp
  if (span < pitch * 0.7) return [L / 2]
  const n = Math.max(1, Math.round(span / pitch))
  const p = span / n
  return Array.from({ length: n }, (_, i) => cp + p * (i + 0.5))
}

/** plain walls round the ring between y0 and y1, and the roof over them */
function walls(out: MeshBuilder, ring: P2[], y0: number, y1: number, c: Rgb, tag: number): void {
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    panel(out, e, 0, e.L, 0, y0, y1, c, tag)
  }
}

// -------------------------------------------------------------------- New Conservatory Theatre Center

const N_WALL: Rgb = [0.89, 0.88, 0.84]       // the white-painted stone (Mapillary -02, -04: cream-white in sun)
const N_BASE: Rgb = [0.85, 0.84, 0.8]        // the rusticated base, a shade down
const N_TRIM: Rgb = [0.93, 0.92, 0.88]       // archivolts, sills, mouldings catching the light
const N_GROOVE: Rgb = [0.66, 0.65, 0.62]     // the rustication joints
const N_SHADE: Rgb = [0.55, 0.55, 0.53]      // the frieze behind the brackets, the soffits
const N_CARVED: Rgb = [0.78, 0.76, 0.7]      // the carved entrance surround and lunette, a little darker and warmer
const N_GLASS: Rgb = [0.13, 0.15, 0.18]
const N_PLINTH: Rgb = [0.6, 0.6, 0.58]
const N_ROOF: Rgb = [0.52, 0.52, 0.5]

function newConservatoryTheatre(out: MeshBuilder, fit: Fit): void {
  const ring = wallRing(rawRing(fit))
  /*
   * The Van Ness front is the straight 37 m wall between the two long sides: the one edge of middling length whose
   * BOTH neighbours are long. The west wall is the same length but broken by a 6 m step, so it never wins.
   */
  let main = -1
  let best = 0
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L < 22 || e.L > 48) continue
    const s = Math.min(edgeOf(ring, i - 1).L, edgeOf(ring, i + 1).L)
    if (s > best) { best = s; main = i }
  }
  if (main < 0 || best < 30) main = towardMinusZ(ring)

  const baseTop = 12.3        // the rusticated base, its arches 10.5 m to the crown (-02: a third of the height)
  const roof = 35.2           // the top of the parapet over the cornice (≈ 36 m with the roof plant; OSM says 37)
  const spring = 8.4
  walls(out, ring, 0, baseTop, N_BASE, T.ashlar)
  walls(out, ring, baseTop, roof, N_WALL, T.stucco)
  capPolygon(out, ring, roof, N_ROOF, T.concrete)

  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    const isMain = i === main
    const dressed = isMain || e.L >= 30
    // the granite plinth, the base's crowning band, the string course under the main floor
    course(out, e, 0, 0.9, 0.1, N_PLINTH, T.granite)
    course(out, e, baseTop - 0.2, baseTop + 0.7, 0.32, N_TRIM, T.stucco, true)
    course(out, e, 18.7, 19.0, 0.18, N_TRIM, T.stucco)
    if (e.L < 6) continue
    const cs = dressed ? bays(e.L, 3.4, 6.3) : bays(e.L, 2.5, 6.3)
    const mid = Math.floor(cs.length / 2)
    if (dressed) {
      // rustication: the joints run the base's length, the arches drawn over them
      for (let y = 1.6; y < baseTop - 0.6; y += 0.85) panel(out, e, 0, e.L, 0.015, y, y + 0.08, N_GROOVE, T.ashlar)
      // the impost band across each pier, at the springing
      const edges: [number, number][] = []
      let prev = 0
      cs.forEach((u, k) => {
        const w = isMain && k === mid && cs.length % 2 === 1 ? 7.6 : 4.3
        edges.push([prev, u - w / 2])
        prev = u + w / 2
      })
      edges.push([prev, e.L])
      for (const [u0, u1] of edges) if (u1 - u0 > 0.3) slab(out, e, u0, u1, 0, 0.16, spring - 0.45, spring, N_TRIM, T.stucco)
    }
    cs.forEach((u, k) => {
      const entrance = isMain && k === mid && cs.length % 2 === 1
      if (dressed && entrance) {
        // the carved entrance: a wider, lower arch in a heavy moulded surround, the lunette carved, doors below
        const w = 5.6
        const sp = 8.0
        archOpening(out, e, u, w, 0.35, sp, 0.04, N_CARVED, T.ashlar, 8)
        panel(out, e, u - 1.7, u + 1.7, 0.06, 0.35, 4.9, N_GLASS, T.glass)              // the doors
        panel(out, e, u - 2.3, u + 2.3, 0.07, 5.0, 6.1, N_TRIM, T.stucco)               // the inscribed lintel
        panel(out, e, u - 2.3, u + 2.3, 0.06, 6.2, sp, N_GLASS, T.glass)
        archivolt(out, e, u, 2.8, 3.5, sp, 0.22, N_CARVED, T.ashlar, 8)
        archivolt(out, e, u, 3.5, 3.75, sp, 0.3, N_TRIM, T.stucco, 8)
        for (const s of [-1, 1]) {
          slab(out, e, u + s * 2.8 - 0.4, u + s * 2.8 + 0.4, 0, 0.3, 0.35, sp, N_CARVED, T.ashlar)       // the jambs
          slab(out, e, u + s * 3.35 - 0.25, u + s * 3.35 + 0.25, 0, 0.2, 0.9, sp + 0.3, N_TRIM, T.stucco)  // the colonnettes
        }
        slab(out, e, u - 0.6, u + 0.6, 0, 0.45, sp + 2.7, sp + 3.9, N_CARVED, T.ashlar)   // the cartouche keystone
        // three broad granite steps up to the doors
        for (let s = 0; s < 3; s++) slab(out, e, u - 3.2 + s * 0.3, u + 3.2 - s * 0.3, 0, 1.4 - s * 0.45, 0, 0.17 * (s + 1), N_PLINTH, T.granite)
        // the main floor over it: three small windows, then the arched window as elsewhere
        for (const d of [-1.25, 0, 1.25]) panel(out, e, u + d - 0.42, u + d + 0.42, 0.05, 14.8, 16.2, N_GLASS, T.glass)
      } else if (dressed) {
        // a ground arch: the glazed opening, its transom, its voussoirs and keystone
        const w = 4.2
        archOpening(out, e, u, w, 0.35, spring, 0.04, N_GLASS, T.glass)
        panel(out, e, u - w / 2, u + w / 2, 0.06, 6.1, 6.3, N_BASE, T.stucco)
        archivolt(out, e, u, w / 2, w / 2 + 0.5, spring, 0.1, N_TRIM, T.stucco)
        slab(out, e, u - 0.32, u + 0.32, 0, 0.24, spring + w / 2 - 0.2, spring + w / 2 + 0.75, N_TRIM, T.stucco)
        // the mullioned window of the first floor: three lights
        panel(out, e, u - 1.85, u + 1.85, 0.03, 14.0, 17.1, N_TRIM, T.stucco)
        panel(out, e, u - 1.65, u + 1.65, 0.05, 14.2, 16.9, N_GLASS, T.glass)
        for (const d of [-0.55, 0.55]) panel(out, e, u + d - 0.07, u + d + 0.07, 0.07, 14.2, 16.9, N_TRIM, T.stucco)
        slab(out, e, u - 1.95, u + 1.95, 0, 0.22, 13.75, 14.0, N_TRIM, T.stucco)
      } else {
        // the plain west wall: a window to a floor
        panel(out, e, u - 1.2, u + 1.2, 0.04, 3.0, 6.5, N_GLASS, T.glass)
        panel(out, e, u - 1.2, u + 1.2, 0.04, 14.2, 16.9, N_GLASS, T.glass)
        panel(out, e, u - 1.2, u + 1.2, 0.04, 19.6, 23.4, N_GLASS, T.glass)
        return
      }
      // the main floor: a tall round-arched window with its tracery mullion, archivolt and sill
      const ww = 3.0
      const ws = 22.9
      archOpening(out, e, u, ww, 19.3, ws, 0.05, N_GLASS, T.glass)
      panel(out, e, u - 0.07, u + 0.07, 0.07, 19.3, ws + 1.1, N_TRIM, T.stucco)
      panel(out, e, u - ww / 2, u + ww / 2, 0.07, ws - 0.12, ws, N_TRIM, T.stucco)
      archivolt(out, e, u, ww / 2, ww / 2 + 0.32, ws, 0.1, N_TRIM, T.stucco)
      slab(out, e, u - 1.85, u + 1.85, 0, 0.25, 19.0, 19.3, N_TRIM, T.stucco)
    })
    // the attic: a row of small square windows under the cornice, closer set than the bays
    const nAttic = Math.max(1, Math.round((e.L - 2) / 3.9))
    for (let k = 0; k < nAttic; k++) {
      const u = 1 + ((e.L - 2) * (k + 0.5)) / nAttic
      panel(out, e, u - 0.42, u + 0.42, 0.04, 26.9, 27.75, N_GLASS, T.glass)
    }
    /*
     * The cornice: a moulding, then the frieze in shadow with the long brackets standing out of it close-set
     * (-02, -05: one about every metre, two storeys of shadow at the top of the building), the deep corona over
     * them with its soffit, the cymatium, the parapet.
     */
    course(out, e, 28.6, 28.95, 0.16, N_TRIM, T.stucco)
    panel(out, e, -0.02, e.L + 0.02, 0.02, 29.4, 32.5, N_SHADE, T.stucco)
    const nb = Math.max(2, Math.round(e.L / 1.05))
    for (let k = 0; k <= nb; k++) {
      const u = 0.3 + ((e.L - 0.6) * k) / nb
      slab(out, e, u - 0.2, u + 0.2, 0, 0.45, 29.5, 31.0, N_WALL, T.stucco, true)
      slab(out, e, u - 0.2, u + 0.2, 0, 1.15, 31.0, 32.5, N_WALL, T.stucco, true)
    }
    slab(out, e, -1.3, e.L + 1.3, 0, 1.3, 32.5, 33.8, N_TRIM, T.stucco)
    soffit(out, e, -1.3, e.L + 1.3, 0, 1.3, 32.5, N_SHADE, T.stucco)
    course(out, e, 33.8, 34.4, 1.5, N_WALL, T.stucco, true)
    course(out, e, roof - 0.15, roof + 0.05, 0.12, N_TRIM, T.stucco)
  }

  // the carved figure on the Market-side corner, on a corbel at the first floor (-02, -04, -05)
  {
    const e = edgeOf(ring, main)
    const p = edgeOf(ring, main - 1)
    let dx = e.nx + p.nx
    let dz = e.nz + p.nz
    const dl = Math.hypot(dx, dz) || 1
    dx /= dl
    dz /= dl
    const cx = e.a.x + dx * 0.9
    const cz = e.a.z + dz * 0.9
    prism(out, cx, cz, 12.9, 14.4, 0.45, 8, N_CARVED, T.ashlar, 1.15)        // the corbel
    prism(out, cx, cz, 14.4, 15.4, 1.05, 8, N_CARVED, T.ashlar, 0.9)         // the figures' base
    prism(out, cx, cz, 15.4, 19.6, 0.85, 8, N_CARVED, T.ashlar, 0.6)         // the group itself
    prism(out, cx, cz, 19.6, 20.2, 0.5, 8, N_CARVED, T.ashlar, 0.3)
    prism(out, cx, cz, 20.2, 21.0, 0.55, 8, N_TRIM, T.stucco, 1.0)           // the canopy over it
  }
}

// ------------------------------------------------------------------------------------------- California Hall

const C_BRICK: Rgb = [0.6, 0.52, 0.42]      // the buff-brown brick (-01, overcast)
const C_STONE: Rgb = [0.8, 0.74, 0.62]       // the dressed stone: base, quoins, surrounds, cornice
const C_STONE_D: Rgb = [0.68, 0.63, 0.53]    // the rusticated base's face, a shade under the trim
const C_JOINT: Rgb = [0.5, 0.47, 0.41]
const C_GLASS: Rgb = [0.14, 0.15, 0.17]
const C_IRON: Rgb = [0.12, 0.14, 0.13]       // the canopy's dark painted iron
const C_ROOF: Rgb = [0.36, 0.34, 0.33]
const C_SHADE: Rgb = [0.45, 0.42, 0.37]

function californiaHall(out: MeshBuilder, fit: Fit): void {
  const raw = rawRing(fit)
  const ring = wallRing(raw)
  /*
   * The outline is nearly square, so the shape alone cannot say which wall is Polk Street. What it does say: the
   * Turk Street wall and the Polk Street wall are each ONE unbroken OSM edge (the other two are drawn in pieces),
   * Turk's the longest; Polk is the one after it, round the corner anticlockwise.
   */
  let li = 0
  for (let i = 1; i < raw.length; i++) if (edgeOf(raw, i).L > edgeOf(raw, li).L) li = i
  const next = edgeOf(raw, li + 1)
  const main = next.L > 25 ? matchEdge(ring, next) : towardMinusZ(ring)
  const side = (main - 1 + ring.length) % ring.length

  const ground = 5.8
  const eaves = 20.4
  const top = 22.0
  walls(out, ring, 0, ground, C_STONE_D, T.ashlar)
  walls(out, ring, ground, top, C_BRICK, T.brick)

  // the roof: a slate mansard behind the cornice, flat on top
  {
    const inset = ring.map((p, i) => {
      // a true inward offset of 2.8 m, each corner on the bisector
      const e0 = edgeOf(ring, i - 1)
      const e1 = edgeOf(ring, i)
      const bx = e0.nx + e1.nx
      const bz = e0.nz + e1.nz
      const dot = Math.max(0.3, (bx * e1.nx + bz * e1.nz))
      return { x: p.x - (bx / dot) * 2.8, z: p.z - (bz / dot) * 2.8 }
    })
    for (let i = 0; i < ring.length; i++) {
      const e = edgeOf(ring, i)
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      const ia = inset[i]
      const ib = inset[(i + 1) % ring.length]
      quad(out, [[a.x, top, a.z], [b.x, top, b.z], [ib.x, 25.2, ib.z], [ia.x, 25.2, ia.z]], [e.nx * 0.75, 0.66, e.nz * 0.75], C_ROOF, T.tile)
    }
    capPolygon(out, inset, 25.2, C_ROOF, T.tile)
  }

  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    const street = i === main || i === side
    course(out, e, 0, 0.6, 0.12, C_SHADE, T.granite)
    course(out, e, ground - 0.1, ground + 0.55, 0.3, C_STONE, T.ashlar, true)      // the belt over the stone storey
    course(out, e, 9.75, 9.95, 0.1, C_STONE, T.ashlar)                            // a sill course under the third floor
    // the cornice: frieze, modillions, corona, the balustraded parapet's coping
    course(out, e, eaves - 0.6, eaves, 0.18, C_STONE, T.ashlar)
    course(out, e, eaves + 0.65, eaves + 1.05, 0.95, C_STONE, T.ashlar, true)
    course(out, e, top - 0.2, top + 0.1, 0.2, C_STONE, T.ashlar)
    if (street) {
      const nm = Math.round(e.L / 0.9)
      for (let k = 0; k <= nm; k++) {
        const u = 0.2 + ((e.L - 0.4) * k) / nm
        slab(out, e, u - 0.13, u + 0.13, 0, 0.75, eaves + 0.15, eaves + 0.65, C_STONE, T.ashlar, true)
      }
      panel(out, e, -0.02, e.L + 0.02, 0.02, eaves, eaves + 0.65, C_SHADE, T.ashlar)
    }
    if (e.L < 6) continue
    const cs = bays(e.L, 2.6, 4.2)
    // the rusticated ground storey's joints
    if (street) for (let y = 1.2; y < ground - 0.3; y += 0.75) panel(out, e, 0, e.L, 0.015, y, y + 0.07, C_JOINT, T.ashlar)
    const gableC = e.L * 0.3
    cs.forEach((u) => {
      const underCanopy = i === main && Math.abs(u - gableC) < 6.2
      const door = i === main && u < 5
      if (door) {
        // the arched doorway near the corner
        archOpening(out, e, u, 2.6, 0.6, 3.7, 0.04, C_GLASS, T.glass)
        archivolt(out, e, u, 1.3, 1.85, 3.7, 0.12, C_STONE, T.ashlar)
      } else if (underCanopy) {
        panel(out, e, u - 1.5, u + 1.5, 0.04, 0.6, 4.3, C_GLASS, T.glass)
      } else if (street) {
        panel(out, e, u - 0.95, u + 0.95, 0.04, 1.2, 4.6, C_GLASS, T.glass)
        slab(out, e, u - 1.2, u + 1.2, 0, 0.2, 4.6, 5.0, C_STONE, T.ashlar)
      }
      // the four brick floors: two-light windows in stone surrounds, a cornice head on each
      for (const [y0, h, head] of [[6.7, 2.4, 2], [10.3, 2.3, 1], [13.8, 2.2, 1], [17.2, 2.0, 0]] as const) {
        if (!street) { panel(out, e, u - 0.8, u + 0.8, 0.04, y0, y0 + h, C_GLASS, T.glass); continue }
        panel(out, e, u - 1.2, u + 1.2, 0.03, y0 - 0.25, y0 + h + 0.2, C_STONE, T.ashlar)
        panel(out, e, u - 0.95, u + 0.95, 0.05, y0, y0 + h, C_GLASS, T.glass)
        panel(out, e, u - 0.06, u + 0.06, 0.07, y0, y0 + h, C_STONE, T.ashlar)
        slab(out, e, u - 1.25, u + 1.25, 0, 0.2, y0 - 0.35, y0 - 0.15, C_STONE, T.ashlar)
        if (head) slab(out, e, u - 1.4, u + 1.4, 0, 0.18 + head * 0.08, y0 + h + 0.2, y0 + h + 0.2 + head * 0.25, C_STONE, T.ashlar, true)
      }
    })
    if (!street) continue
    // stone quoins up both corners of each street wall, long and short by turns
    for (const u of [0, e.L]) {
      const s = u === 0 ? 1 : -1
      for (let y = ground + 0.55, k = 0; y < eaves - 0.7; y += 0.8, k++) {
        const w = k % 2 === 0 ? 1.1 : 0.65
        slab(out, e, s > 0 ? 0 : e.L - w, s > 0 ? w : e.L, 0, 0.1, y, y + 0.7, C_STONE, T.ashlar)
      }
    }
    // gabled dormers in the mansard
    const dormers = i === main ? [e.L * 0.85] : [e.L * 0.2, e.L * 0.5, e.L * 0.8]
    for (const u of dormers) {
      slab(out, e, u - 1.25, u + 1.25, -3.2, -1.2, top, 24.4, C_STONE, T.ashlar)
      panel(out, e, u - 0.6, u + 0.6, -1.17, top + 0.3, 23.9, C_GLASS, T.glass)
      gableFace(out, e, u - 1.4, u + 1.4, -1.15, 24.4, 25.6, C_STONE, T.ashlar)
      gableRoof(out, e, u - 1.45, u + 1.45, -3.2, -1.1, 24.4, 25.65, C_ROOF, T.tile)
    }
  }

  // Polk Street: the iron canopy over the entrance and the scrolled Flemish gable over that
  {
    const e = edgeOf(ring, main)
    const c = e.L * 0.3
    // the canopy: a dark iron deck with its deep valance, close over the entrance doors
    slab(out, e, c - 6, c + 6, 0, 3.4, 4.5, 4.75, C_IRON, T.metal, true)
    slab(out, e, c - 6, c + 6, 3.25, 3.45, 3.75, 4.85, C_IRON, T.metal, true)
    // the balconette on the floor over it
    slab(out, e, c - 2.2, c + 2.2, 0, 0.7, 6.35, 6.55, C_STONE, T.ashlar, true)
    panel(out, e, c - 2.2, c + 2.2, 0.68, 6.55, 7.4, C_IRON, T.metal)
    // stone strips (rusticated pilasters) framing the gable's bays, all the way up
    for (const s of [-1, 1]) {
      for (let y = ground + 0.55, k = 0; y < eaves - 0.7; y += 0.8, k++) {
        const w = k % 2 === 0 ? 1.0 : 0.6
        slab(out, e, c + s * 5.7 - w / 2, c + s * 5.7 + w / 2, 0, 0.12, y, y + 0.7, C_STONE, T.ashlar)
      }
    }
    // the gable: three stepped tiers with scrolls at the steps, obelisks on them, a pediment and finial on top
    const tiers: [number, number, number][] = [[5.6, top, 24.6], [3.8, 24.6, 26.9], [2.1, 26.9, 28.7]]
    tiers.forEach(([hw, y0, y1], t) => {
      slab(out, e, c - hw, c + hw, -0.7, 0.05, y0, y1, C_BRICK, T.brick)
      slab(out, e, c - hw - 0.1, c + hw + 0.1, -0.75, 0.2, y1 - 0.25, y1, C_STONE, T.ashlar)        // the tier's coping
      panel(out, e, c - hw, c + hw, 0.07, y0, y0 + 0.3, C_STONE, T.ashlar)
      // the scrolls: a quarter-round of stone against each step
      if (t > 0) {
        const lo = tiers[t - 1][0]
        for (const s of [-1, 1]) {
          const seg = 3
          for (let k = 0; k < seg; k++) {
            const a0 = (Math.PI / 2) * (k / seg)
            const a1 = (Math.PI / 2) * ((k + 1) / seg)
            const r = lo - hw
            const p = (a: number, o: number): [number, number, number] => P3(e, c + s * (hw + r * Math.cos(a)), o, y0 + r * Math.sin(a))
            quad(out, [P3(e, c + s * hw, 0.05, y0), p(a0, 0.05), p(a1, 0.05), P3(e, c + s * hw, 0.05, y0)], [e.nx, 0, e.nz], C_STONE, T.ashlar)
          }
          prism(out, P3(e, c + s * lo * 0.94, 0, 0)[0], P3(e, c + s * lo * 0.94, 0, 0)[2], y0, y0 + 1.3, 0.22, 4, C_STONE, T.ashlar, 0.04)
        }
      }
      const nw = 3 - t
      for (let k = 0; k < nw; k++) {
        const u = c + (k - (nw - 1) / 2) * (hw * 2 / Math.max(nw, 1.6)) * 0.85
        if (t === 2) archOpening(out, e, u, 1.0, y0 + 0.4, y0 + 1.1, 0.07, C_GLASS, T.glass)
        else {
          panel(out, e, u - 0.75, u + 0.75, 0.06, y0 + 0.45, y1 - 0.55, C_STONE, T.ashlar)
          panel(out, e, u - 0.55, u + 0.55, 0.08, y0 + 0.6, y1 - 0.7, C_GLASS, T.glass)
        }
      }
    })
    gableFace(out, e, c - 2.4, c + 2.4, 0.2, 28.7, 30.0, C_STONE, T.ashlar)
    gableRoof(out, e, c - 2.4, c + 2.4, -0.75, 0.2, 28.7, 30.0, C_STONE, T.ashlar)
    const f = P3(e, c, -0.2, 0)
    prism(out, f[0], f[2], 30.0, 31.0, 0.18, 4, C_STONE, T.ashlar, 0.03)
    for (const s of [-1, 1]) {
      const q = P3(e, c + s * 5.6, -0.2, 0)
      prism(out, q[0], q[2], 24.6, 26.2, 0.24, 4, C_STONE, T.ashlar, 0.04)
    }
  }
}

// ------------------------------------------------------------------------------------- the Tharp School

const H_BRICK: Rgb = [0.8, 0.66, 0.43]       // the yellow (golden-tan) brick
const H_BRICK_D: Rgb = [0.68, 0.55, 0.36]    // the arches' voussoir rings and the piers' shadowed returns
const H_STONE: Rgb = [0.82, 0.76, 0.62]      // the stone (or cast-stone) courses and cornice
const H_SHADE: Rgb = [0.5, 0.44, 0.34]
const H_GLASS: Rgb = [0.15, 0.15, 0.16]
const H_BOARD: Rgb = [0.3, 0.25, 0.2]        // the basement's boarded openings
const H_ROOF: Rgb = [0.45, 0.44, 0.42]

function tharpSchool(out: MeshBuilder, fit: Fit): void {
  const raw = rawRing(fit)
  const ring = wallRing(raw)
  /*
   * The Franklin Street front is the one unbroken OSM edge with long walls at BOTH ends (the back wall is drawn in
   * three pieces, the long sides each meet a short piece at one end).
   */
  let ri = -1
  let best = 0
  for (let i = 0; i < raw.length; i++) {
    const e = edgeOf(raw, i)
    if (e.L < 15) continue
    const s = Math.min(edgeOf(raw, i - 1).L, edgeOf(raw, i + 1).L)
    if (s > best) { best = s; ri = i }
  }
  const main = ri >= 0 && best > 20 ? matchEdge(ring, edgeOf(raw, ri)) : towardMinusZ(ring)
  const side = (main + 1) % ring.length   // the south wall, open to the lot (-01, right)

  const base = 3.3       // the raised basement
  const top = 16.9       // the parapet over the cornice
  walls(out, ring, 0, top, H_BRICK, T.brick)
  capPolygon(out, ring, top, H_ROOF, T.concrete)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    const front = i === main
    // the water table, the band course over the main floor, the cornice (modillions on the front only)
    course(out, e, base, base + 0.4, 0.15, H_STONE, T.ashlar)
    course(out, e, 15.1, 15.5, 0.12, H_STONE, T.ashlar)
    course(out, e, 15.9, 16.5, 0.85, H_STONE, T.ashlar, true)
    course(out, e, top - 0.15, top + 0.05, 0.1, H_STONE, T.ashlar)
    if (front || i === side) course(out, e, 8.6, 9.0, 0.14, H_STONE, T.ashlar)
    if (front) {
      panel(out, e, -0.02, e.L + 0.02, 0.02, 15.5, 15.9, H_SHADE, T.ashlar)
      const nm = Math.round(e.L / 0.8)
      for (let k = 0; k <= nm; k++) {
        const u = 0.2 + ((e.L - 0.4) * k) / nm
        slab(out, e, u - 0.11, u + 0.11, 0, 0.7, 15.5, 15.9, H_STONE, T.ashlar, true)
      }
    }
    if (e.L < 6) continue
    if (!front) {
      // the side and back walls: a few plain windows (the south wall's, at its west end, -01)
      const cs = bays(e.L, 2, 4.5)
      cs.forEach((u, k) => {
        if (i !== side && k % 2 === 1) return
        if (i === side && u > 10) return
        for (const [y0, y1] of [[4.6, 7.4], [9.7, 11.8], [12.6, 14.6]]) panel(out, e, u - 0.6, u + 0.6, 0.04, y0, y1, H_GLASS, T.glass)
      })
      continue
    }
    // the front: nine arched bays and the narrow entrance bay at the south end
    const span0 = 1.3
    const span1 = e.L - 4.3
    const n = Math.max(1, Math.round((span1 - span0) / 3.75))
    const p = (span1 - span0) / n
    for (let k = 0; k < n; k++) {
      const u = span0 + p * (k + 0.5)
      // the basement's opening, boarded
      panel(out, e, u - 0.95, u + 0.95, 0.04, 0.9, 2.6, H_BOARD, T.metal)
      // the main floor's round-arched window, its brick voussoirs and stone keystone
      const w = 2.5
      const sp = 6.9
      archOpening(out, e, u, w, 4.1, sp, 0.04, H_GLASS, T.glass)
      archivolt(out, e, u, w / 2, w / 2 + 0.38, sp, 0.07, H_BRICK_D, T.brick)
      slab(out, e, u - 0.22, u + 0.22, 0, 0.18, sp + w / 2 - 0.1, sp + w / 2 + 0.5, H_STONE, T.ashlar)
      slab(out, e, u - 1.45, u + 1.45, 0, 0.16, 3.85, 4.1, H_STONE, T.ashlar)
      // the two upper floors: windows recessed between brick piers that run up to the frieze
      for (const [y0, y1] of [[9.7, 11.9], [12.6, 14.7]]) {
        panel(out, e, u - 0.85, u + 0.85, 0.04, y0, y1, H_GLASS, T.glass)
        panel(out, e, u - 1.0, u + 1.0, 0.05, y0 - 0.15, y0, H_STONE, T.ashlar)
      }
      panel(out, e, u - 0.9, u + 0.9, 0.035, 11.9, 12.6, H_BRICK_D, T.brick)
    }
    for (let k = 0; k <= n; k++) {
      const u = span0 + p * k
      slab(out, e, u - 0.45, u + 0.45, 0, 0.18, 9.0, 15.1, H_BRICK, T.brick)
    }
    // the south end bay: small windows over a doorway under a little pedimented hood
    const ue = e.L - 2.15
    panel(out, e, ue - 0.9, ue + 0.9, 0.04, 0.3, 2.9, H_BOARD, T.metal)
    slab(out, e, ue - 1.2, ue + 1.2, 0, 0.5, 2.9, 3.2, H_STONE, T.ashlar, true)
    gableFace(out, e, ue - 1.25, ue + 1.25, 0.5, 3.2, 3.9, H_STONE, T.ashlar)
    gableRoof(out, e, ue - 1.25, ue + 1.25, 0, 0.5, 3.2, 3.9, H_STONE, T.ashlar)
    for (const [y0, y1] of [[5.0, 6.8], [9.9, 11.5], [12.8, 14.4]]) panel(out, e, ue - 0.5, ue + 0.5, 0.04, y0, y1, H_GLASS, T.glass)
  }
}

export const CIVIC_PALAZZOS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  newConservatoryTheatre, californiaHall, tharpSchool,
}
