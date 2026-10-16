/**
 * San Francisco's notable buildings that had no model (docs/sf-batches/NOTABLE-UNMODELLED.md, 2026-10-15): OSM tags them
 * as significant (wikidata, heritage, architect) or a photo pass flagged them model-worthy. One building at a time, each
 * from a full evidence pack (docs/sf-batches/MODEL-<name>.md): OSM outline and parts, LiDAR heights, the Assessor's
 * record, Mapillary and Commons photographs.
 */
import { MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { boxAlong, marquee, bladeSign, signText } from '../../parts.ts'
import { classicalColumn } from '../../column.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { ivyWall } from '../../ivy.ts'
import { inset as ecInset, walls as ecWalls, soffit as ecSoffit, piers as ecPiers, onEdge as ecOnEdge } from '../ec4-podium.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]

// ---------------------------------------------------------------------------------------------------------------
// Temple Emanu-El
// ---------------------------------------------------------------------------------------------------------------

/**
 * The plan of Temple Emanu-El in the model's DESIGN frame: OSM relation/3654752's outer ring (way/274565593) as the shot
 * tool fits it, i.e. the pack's plan (docs/sf-batches/MODEL-EMANU-EL.md) turned −3.1° so Lake Street runs along x, and
 * recentred. x is east (Arguello Boulevard at +x), z north (Lake Street at −z). Every part below is placed in this frame
 * and the whole model is then carried onto the city's own `fit.ring` (see `emanuElPlace`).
 */
const EMANU_RING: P2[] = [[8.2, 41.5], [0.3, 41.6], [0.3, 34.0], [0.0, 34.0], [0.0, -2.1], [0.4, -2.1], [0.4, -17.1],
  [-26.6, -17.1], [-26.6, -16.3], [-36.2, -16.3], [-36.2, -17.0], [-36.7, -17.0], [-36.6, -36.6], [-36.1, -37.2],
  [-36.1, -43.9], [36.3, -43.9], [36.2, -2.3], [36.6, -2.3], [36.7, 4.1], [36.3, 4.2], [36.4, 41.3], [27.9, 41.4],
  [27.9, 43.8], [8.2, 43.9]].map(([x, z]) => ({ x, z }))

/**
 * The rotation + translation carrying the design frame onto `ring`: a 2-D Procrustes fit of EMANU_RING's 24 vertices
 * against the ring's, over both orders and every starting vertex, keeping the smallest RMS residual. If the city's ring
 * has another vertex count (a bake that dropped one of the outline's 0.3 m jogs), `emanuElPlaceLoose` matches it by
 * edges instead. Null when there is no ring or nothing fits within 2 m — the caller then keeps the design frame.
 */
function emanuElPlace(ring: P2[] | undefined): { c: number; s: number; tx: number; tz: number; res: number } | null {
  if (!ring) return null
  let R = ring
  if (R.length === 25 && Math.hypot(R[0].x - R[24].x, R[0].z - R[24].z) < 0.3) R = R.slice(0, 24)
  const n = EMANU_RING.length
  if (R.length !== n) return emanuElPlaceLoose(R)
  const cb = { x: R.reduce((t, p) => t + p.x, 0) / n, z: R.reduce((t, p) => t + p.z, 0) / n }
  const ca = { x: EMANU_RING.reduce((t, p) => t + p.x, 0) / n, z: EMANU_RING.reduce((t, p) => t + p.z, 0) / n }
  let best: { c: number; s: number; tx: number; tz: number; res: number } | null = null
  for (const rev of [false, true]) {
    const Q = rev ? [...EMANU_RING].reverse() : EMANU_RING
    for (let o = 0; o < n; o++) {
      let sn = 0
      let cs = 0
      for (let i = 0; i < n; i++) {
        const a = Q[(i + o) % n]
        const ax = a.x - ca.x, az = a.z - ca.z, bx = R[i].x - cb.x, bz = R[i].z - cb.z
        cs += ax * bx + az * bz
        sn += ax * bz - az * bx
      }
      const th = Math.atan2(sn, cs)
      const c = Math.cos(th), s = Math.sin(th)
      let e = 0
      for (let i = 0; i < n; i++) {
        const a = Q[(i + o) % n]
        const x = (a.x - ca.x) * c - (a.z - ca.z) * s + cb.x
        const z = (a.x - ca.x) * s + (a.z - ca.z) * c + cb.z
        e += (x - R[i].x) ** 2 + (z - R[i].z) ** 2
      }
      const res = Math.sqrt(e / n)
      if (!best || res < best.res) {
        best = { c, s, tx: cb.x - (ca.x * c - ca.z * s), tz: cb.z - (ca.x * s + ca.z * c), res }
      }
    }
  }
  return best && best.res <= 2 ? best : emanuElPlaceLoose(R)
}

/** Twice a ring's signed area and its area centroid. */
function emanuElCentroid(r: P2[]): { x: number; z: number } {
  let a = 0, x = 0, z = 0
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length]
    const k = p.x * q.z - q.x * p.z
    a += k
    x += (p.x + q.x) * k
    z += (p.z + q.z) * k
  }
  return { x: x / (3 * a), z: z / (3 * a) }
}

/**
 * The vertex-count-agnostic fit: every rotation that lays one of the plan's long edges along one of the ring's (lengths
 * within 20%), the area centroids made to coincide, scored by the RMS distance of the ring's vertices to the turned plan
 * outline. Null over 2 m.
 */
function emanuElPlaceLoose(R: P2[]): { c: number; s: number; tx: number; tz: number; res: number } | null {
  if (R.length < 4) return null
  const ca = emanuElCentroid(EMANU_RING), cb = emanuElCentroid(R)
  const edges = (r: P2[]): { L: number; a: number }[] => r.map((p, i) => {
    const q = r[(i + 1) % r.length]
    return { L: Math.hypot(q.x - p.x, q.z - p.z), a: Math.atan2(q.z - p.z, q.x - p.x) }
  })
  const ea = edges(EMANU_RING).filter((e) => e.L > 15), eb = edges(R).filter((e) => e.L > 15)
  let best: { c: number; s: number; tx: number; tz: number; res: number } | null = null
  for (const a of ea) {
    for (const b of eb) {
      if (Math.abs(a.L - b.L) > 0.2 * a.L) continue
      const th = b.a - a.a, c = Math.cos(th), s = Math.sin(th)
      const tx = cb.x - (ca.x * c - ca.z * s), tz = cb.z - (ca.x * s + ca.z * c)
      const T = EMANU_RING.map((p) => ({ x: p.x * c - p.z * s + tx, z: p.x * s + p.z * c + tz }))
      let e = 0
      for (const v of R) {
        let d = Infinity
        for (let i = 0; i < T.length; i++) {
          const p = T[i], q = T[(i + 1) % T.length]
          const dx = q.x - p.x, dz = q.z - p.z
          const t = Math.max(0, Math.min(1, ((v.x - p.x) * dx + (v.z - p.z) * dz) / (dx * dx + dz * dz || 1)))
          d = Math.min(d, Math.hypot(v.x - p.x - dx * t, v.z - p.z - dz * t))
        }
        e += d * d
      }
      const res = Math.sqrt(e / R.length)
      if (!best || res < best.res) best = { c, s, tx, tz, res }
    }
  }
  return best && best.res <= 2 ? best : null
}

/** Copy `m` (drawn in the design frame) into `out`, turned by (c, s) and moved by (tx, tz). */
function emanuElCopy(out: MeshBuilder, m: MeshBuilder, c: number, s: number, tx: number, tz: number): void {
  const base = out.positions.length / 3
  for (let i = 0; i < m.positions.length; i += 3) {
    const x = m.positions[i], z = m.positions[i + 2]
    out.positions.push(x * c - z * s + tx, m.positions[i + 1], x * s + z * c + tz)
    const nx = m.normals[i], nz = m.normals[i + 2]
    out.normals.push(nx * c - nz * s, m.normals[i + 1], nx * s + nz * c)
  }
  out.uvs.push(...m.uvs)
  out.colors.push(...m.colors)
  for (const idx of m.indices) out.indices.push(base + idx)
}

const EM_WALL: Rgb = [0.91, 0.86, 0.776]       // #e8dcc6, the warm cream stucco
const EM_TRIM: Rgb = [0.84, 0.78, 0.68]        // cornices and corbel tables, a shade deeper
const EM_RECESS: Rgb = [0.7, 0.64, 0.56]       // the inside of a deep arch
const EM_DOME: Rgb = [0.663, 0.376, 0.247]     // #a9603f, the dome's terracotta tile
const EM_RIB: Rgb = [0.8, 0.55, 0.42]          // its lighter ribs
const EM_TILE: Rgb = [0.612, 0.322, 0.212]     // #9c5236, the gable and range roofs
const EM_GLASS: Rgb = [0.15, 0.16, 0.19]
const EM_DOOR: Rgb = [0.12, 0.11, 0.1]

const ST = surfaceTag('stucco')
const TL = surfaceTag('tile')
const GL = surfaceTag('glass')
const TC = surfaceTag('terracotta')

/** A box by its extents. */
function emBlock(m: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, c: Rgb, tag = ST): void {
  box(m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, Math.abs(z1 - z0) / 2, c, tag)
}

/** A tiled hip roof over a rectangle, eaves at y0, rising h to a ridge (ix/iz the top's insets, as kit `roof`). */
function emHip(m: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, h: number, ix: number, iz: number,
               c: Rgb = EM_TILE): void {
  const y1 = y0 + h
  const a = x0 + ix, b = x1 - ix, p = z0 + iz, q = z1 - iz
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  m.quad([[x0, y0, z0], [x1, y0, z0], [b, y1, p], [a, y1, p]], [0, iz / Math.max(h, 0.01), -1], uv, c, TL)
  m.quad([[x1, y0, z1], [x0, y0, z1], [a, y1, q], [b, y1, q]], [0, iz / Math.max(h, 0.01), 1], uv, c, TL)
  m.quad([[x0, y0, z1], [x0, y0, z0], [a, y1, p], [a, y1, q]], [-1, ix / Math.max(h, 0.01), 0], uv, c, TL)
  m.quad([[x1, y0, z0], [x1, y0, z1], [b, y1, q], [b, y1, p]], [1, ix / Math.max(h, 0.01), 0], uv, c, TL)
  if (b - a > 0.01 && q - p > 0.01) m.quad([[a, y1, p], [b, y1, p], [b, y1, q], [a, y1, q]], [0, 1, 0], uv, c, TL)
}

/**
 * One opening painted on a wall: a rectangle up to `spring`, then a round (or segmental, `rise` < halfW) head. Centre
 * (cx, cz) on the wall plane, (tx, tz) along the wall, (nx, nz) out of it; drawn `proud` off it.
 */
function emOpening(m: MeshBuilder, cx: number, cz: number, tx: number, tz: number, nx: number, nz: number,
                   y0: number, spring: number, halfW: number, rise: number, c: Rgb, tag: number, proud = 0.06, seg = 6): void {
  const P = (u: number, y: number): V3 => [cx + tx * u + nx * proud, y, cz + tz * u + nz * proud]
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const n: V3 = [nx, 0, nz]
  if (spring > y0) m.quad([P(-halfW, y0), P(halfW, y0), P(halfW, spring), P(-halfW, spring)], n, uv, c, tag)
  if (rise <= 0) return
  for (let k = 0; k < seg; k++) {
    const a0 = Math.PI * (k / seg), a1 = Math.PI * ((k + 1) / seg)
    m.quad([P(-halfW * Math.cos(a0), spring), P(-halfW * Math.cos(a1), spring),
      P(-halfW * Math.cos(a1), spring + rise * Math.sin(a1)), P(-halfW * Math.cos(a0), spring + rise * Math.sin(a0))], n, uv, c, tag)
  }
}

/** A row of openings along a wall from a to b (outward normal n), one per `bay`. */
function emRow(m: MeshBuilder, a: P2, b: P2, nx: number, nz: number, y0: number, spring: number, halfW: number, rise: number,
               bay: number, c: Rgb = EM_GLASS, tag = GL): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
  const k = Math.max(1, Math.floor(L / bay))
  for (let i = 0; i < k; i++) {
    const u = (L * (i + 0.5)) / k
    emOpening(m, a.x + tx * u, a.z + tz * u, tx, tz, nx, nz, y0, spring, halfW, rise, c, tag)
  }
}

/** A cornice round a rectangle's top: a projecting course and (unless `blocks` is false) a corbel table under it. */
function emCornice(m: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, blocks = true): void {
  emBlock(m, x0 - 0.35, x1 + 0.35, z0 - 0.35, z1 + 0.35, y - 0.45, y, EM_TRIM)
  if (!blocks) return
  const edges: [P2, P2, number, number][] = [
    [{ x: x0, z: z0 }, { x: x1, z: z0 }, 0, -1], [{ x: x1, z: z0 }, { x: x1, z: z1 }, 1, 0],
    [{ x: x1, z: z1 }, { x: x0, z: z1 }, 0, 1], [{ x: x0, z: z1 }, { x: x0, z: z0 }, -1, 0],
  ]
  // the corbel table: small darker blocks under the course (the photographs: every eave has one)
  for (const [a, b, nx, nz] of edges) {
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
    const k = Math.max(2, Math.round(L / 1.6))
    for (let i = 0; i < k; i++) {
      const u = (L * (i + 0.5)) / k
      emOpening(m, a.x + tx * u, a.z + tz * u, tx, tz, nx, nz, y - 1.05, y - 0.45, 0.28, 0, EM_RECESS, TC, 0.18)
    }
  }
}

/**
 * One gabled arm of the cross-in-square sanctuary, drawn in a frame about the dome's centre O: (nx, nz) is the arm's
 * outward direction, it runs from O out to `L`, 11 m either side. Walls to 18 m, a tiled gable to 25 m with the stepped
 * corbel table up both rakes, and in the gable wall the giant round-arched recess — a tracery window (N, E, W) or the
 * great portal (S, on the courtyard).
 */
function emArm(m: MeshBuilder, O: P2, nx: number, nz: number, L: number, portal: boolean): void {
  const hw = 11, eave = 18, ridge = 25
  const tx = -nz, tz = nx
  const P = (u: number, v: number, y: number): V3 => [O.x + tx * u + nx * v, y, O.z + tz * u + nz * v]
  const N = (nu: number, ny: number, nv: number): V3 => [tx * nu + nx * nv, ny, tz * nu + nz * nv]
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const lbox = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, c: Rgb, tag = ST): void => {
    const a = P(u0, v0, y0), b = P(u1, v1, y1)
    emBlock(m, Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[2], b[2]), Math.max(a[2], b[2]), y0, y1, c, tag)
  }
  /** a box centred at local (u, v, y), half-sizes along the wall (hu), out of it (hv) and up (hy) */
  const cbox = (u: number, v: number, y: number, hu: number, hv: number, hy: number, c: Rgb, tag = ST): void => {
    const p = P(u, v, y)
    box(m, p[0], p[1], p[2], Math.abs(tx) * hu + Math.abs(nx) * hv, hy, Math.abs(tz) * hu + Math.abs(nz) * hv, c, tag)
  }
  lbox(-hw, hw, 0, L, 0, eave, EM_WALL)
  lbox(-hw - 0.3, hw + 0.3, 0, L + 0.3, eave - 0.5, eave + 0.1, EM_TRIM)
  // the gable wall and the tiled roof, overhanging a little
  const g = L + 0.05
  m.quad([P(-hw, g, eave), P(hw, g, eave), P(0, g, ridge - 0.3), P(0, g, ridge - 0.3)], N(0, 0, 1), uv, EM_WALL, ST)
  const ov = 0.6, e0 = eave - 0.25
  const slope = (ridge - e0) / (hw + ov)
  for (const sd of [-1, 1]) {
    m.quad([P(sd * (hw + ov), 0, e0), P(sd * (hw + ov), L + ov, e0), P(0, L + ov, ridge), P(0, 0, ridge)],
      N(sd * slope, 1, 0), uv, EM_TILE, TL)
    // the fascia under the roof's edge, on the gable end
    m.quad([P(sd * (hw + ov), L + ov, e0 - 0.45), P(0, L + ov, ridge - 0.45), P(0, L + ov, ridge), P(sd * (hw + ov), L + ov, e0)],
      N(0, 0, 1), uv, EM_TRIM, ST)
    // the stepped corbel table up the rake
    for (let i = 0; i < 7; i++) {
      const f = (i + 0.5) / 7
      cbox(sd * hw * (1 - f), L + 0.25, eave + (ridge - 0.9 - eave) * f - 0.5, 0.32, 0.32, 0.32, EM_TRIM, TC)
    }
  }
  // the giant recessed arch in the gable wall
  const pl = L + 0.06
  const F = P(0, pl, 0)
  if (!portal) {
    emOpening(m, F[0], F[2], tx, tz, nx, nz, 4.5, 11, 6.2, 6.2, EM_RECESS, ST, 0, 12)
    emOpening(m, F[0], F[2], tx, tz, nx, nz, 5.6, 11.2, 5.1, 5.1, EM_GLASS, GL, 0.08, 12)
    // the tracery: mullions and transoms over the glass
    for (const u of [-2.6, 0, 2.6]) cbox(u, pl + 0.12, 10.2, 0.16, 0.08, 4.6, EM_WALL)
    for (const y of [8.2, 11.2, 14]) cbox(0, pl + 0.12, y, y < 11.5 ? 5.1 : 4.2, 0.08, 0.13, EM_WALL)
    // the door and the two small windows either side
    emOpening(m, F[0], F[2], tx, tz, nx, nz, 0, 2.6, 1.2, 1.2, EM_DOOR, ST)
    for (const u of [-7.5, 7.5]) {
      const c = P(u, pl, 0)
      emOpening(m, c[0], c[2], tx, tz, nx, nz, 3.0, 5.0, 0.55, 0, EM_GLASS, GL)
    }
  } else {
    // the great portal (the courtyard frame): a tall round arch down to the steps, the carved entrance standing in it
    emOpening(m, F[0], F[2], tx, tz, nx, nz, 0, 10.6, 7.2, 7.0, EM_RECESS, ST, 0, 12)
    emOpening(m, F[0], F[2], tx, tz, nx, nz, 9.6, 12.2, 4.8, 3.6, EM_GLASS, GL, 0.08, 10)   // the grille window
    for (const u of [-2.4, 0, 2.4]) cbox(u, pl + 0.14, 13.1, 0.13, 0.08, u === 0 ? 2.6 : 1.9, EM_WALL)
    cbox(0, pl - 0.4, 4.6, 4.4, 0.9, 4.6, EM_WALL)
    // its little gable over the doors
    const gl = pl + 0.55
    m.quad([P(-4.6, gl, 9.2), P(4.6, gl, 9.2), P(0, gl, 11), P(0, gl, 11)], N(0, 0, 1), uv, EM_TRIM, ST)
    for (const u of [-2.9, 0, 2.9]) {
      const d = P(u, pl + 0.5, 0)
      emOpening(m, d[0], d[2], tx, tz, nx, nz, 0.4, u === 0 ? 4.6 : 3.8, u === 0 ? 1.3 : 0.9, u === 0 ? 1.3 : 0.9, EM_DOOR, GL)
    }
    // the steps
    lbox(-6.5, 6.5, L, L + 1.6, 0, 0.45, EM_TRIM)
  }
}

/**
 * Temple Emanu-El, 2 Lake Street at Arguello (1926; Arthur Brown Jr. of Bakewell & Brown, with Sylvain Schnaittacher):
 * the Byzantine/Mediterranean Revival synagogue whose terracotta dome is the skyline object of Presidio Heights.
 *
 * Reference photographs: docs/shots/refs/notable/emanu-el/ — the Commons views from Arguello and Lake (the dome on its
 * drum, the stepped blocks, the gable arms), the courtyard portal (the "dedicated in 1926" frame), the dome from
 * Julius Kahn Park and Presidio Terrace (its proportions), and the 2023–25 Mapillary frames (the Lake Street screen,
 * the corbel tables, the cream stucco). Own geometry throughout, drawn in the plan's frame and carried onto the fit:
 *
 * - the SANCTUARY, a cross-in-square round the dome (OSM's dome part, way/1153003006, centred at design (18.7, 15.6)):
 *   an 18 m square block, four gabled arms to 25 m with stepped corbel tables up the rakes, the giant round-arched
 *   tracery window in the N, E and W gables, the great portal arch in the S gable on the courtyard;
 * - the stepped buttress blocks on the diagonals, the round base, a 16-sided DRUM with 16 piers and 16 round-arched
 *   windows over a terracotta grille band, and the shallow tiled DOME with lighter ribs, to 45 m (LiDAR 44.1);
 * - the COURTYARD left open (OSM's inner ring), with low cloisters east and west, the two small lanterns flanking the
 *   portal, and on Lake Street an open screen of three round arches (Mapillary 2: the portal is seen through it);
 * - the FRONT RANGES either side of the courtyard (12 m, tile hip roofs), the tall arched entrance pavilion at the
 *   Lake Street end of the west range (Commons from Lake, Mapillary 5), and the 15 m WEST WING with its tile hip,
 *   chimney and arched ground-floor windows.
 *
 * Where the photographs overruled the numbers: the dome is shallow (rise ≈ 0.38 of its width in the Julius Kahn and
 * Presidio Terrace frames), not the hemisphere a 45 m figure suggests; the drum is round with sixteen bays, not
 * octagonal; the courtyard's Lake side is an open arcaded screen although OSM's footprint closes it.
 */
function templeEmanuEl(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const O: P2 = { x: 18.7, z: 15.6 }               // the dome's centre
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

  // ---- the sanctuary: the square block, its four arms, the north annexe -------------------------------------------
  emBlock(m, 0.4, 36.4, -2.1, 33.4, 0, 18, EM_WALL)
  emCornice(m, 0.4, 36.4, -2.1, 33.4, 18, false)
  emArm(m, O, 0, -1, O.z + 13.9, true)              // S: the portal gable on the courtyard
  emArm(m, O, 1, 0, 36.4 - O.x, false)              // E: on Arguello
  emArm(m, O, -1, 0, O.x - 0.3, false)              // W: over Presidio Terrace
  emArm(m, O, 0, 1, 41.4 - O.z, false)              // N
  // the lower corners either side of the north arm, and the shallow projection behind it
  for (const [x0, x1] of [[0.3, 7.7], [29.7, 36.4]]) {
    emBlock(m, x0, x1, 33.4, 41.4, 0, 14, EM_WALL)
    emCornice(m, x0, x1, 33.4, 41.4, 14)
  }
  emBlock(m, 8.2, 27.9, 41.4, 43.9, 0, 10, EM_WALL)
  emHip(m, 7.9, 28.2, 41.2, 44.2, 10, 1.2, 1.5, 1.5)
  // the walls of the square between the arms: a few tall windows low down
  emRow(m, { x: 0.4, z: -2.1 }, { x: 7.7, z: -2.1 }, 0, -1, 3, 7, 0.6, 0.6, 3.6)
  emRow(m, { x: 29.7, z: -2.1 }, { x: 36.4, z: -2.1 }, 0, -1, 3, 7, 0.6, 0.6, 3.4)
  emRow(m, { x: 36.4, z: -2.1 }, { x: 36.4, z: 4.6 }, 1, 0, 3, 7, 0.6, 0.6, 3.4)
  emRow(m, { x: 36.4, z: 26.6 }, { x: 36.4, z: 33.4 }, 1, 0, 3, 7, 0.6, 0.6, 3.4)

  // ---- the stepped buttress blocks on the diagonals, each with a little tiled pent --------------------------------
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const a = { x: O.x + sx * 14.3, z: O.z + sz * 14.3 }
      emBlock(m, a.x - 3.2, a.x + 3.2, a.z - 3.2, a.z + 3.2, 17, 22.5, EM_WALL)
      emHip(m, a.x - 3.5, a.x + 3.5, a.z - 3.5, a.z + 3.5, 22.5, 1.1, 3.5, 3.5)
      const b = { x: O.x + sx * 11.2, z: O.z + sz * 11.2 }
      emBlock(m, b.x - 2.6, b.x + 2.6, b.z - 2.6, b.z + 2.6, 18, 27.2, EM_WALL)
      emHip(m, b.x - 2.85, b.x + 2.85, b.z - 2.85, b.z + 2.85, 27.2, 0.9, 2.85, 2.85)
    }
  }

  // ---- the round base, the drum, the dome ------------------------------------------------------------------------
  prism(m, O.x, O.z, 18, 29.4, 15, 16, EM_WALL, ST)
  prism(m, O.x, O.z, 29.0, 29.6, 15.35, 16, EM_TRIM, ST)
  prism(m, O.x, O.z, 29.6, 35.6, 12.4, 16, EM_WALL, ST)
  for (let i = 0; i < 16; i++) {
    // the piers between the windows, standing proud and a little above the drum's cornice
    const a = ((i + 0.5) / 16) * Math.PI * 2
    boxAlong(m, O.x + Math.sin(a) * 12.9, 33.0, O.z + Math.cos(a) * 12.9, 0.6, 3.4, 0.85, a, EM_WALL, ST)
    // the round-arched window, its terracotta grille balcony under it
    const w = (i / 16) * Math.PI * 2
    const r = 12.4 * Math.cos(Math.PI / 16)
    const cx = O.x + Math.sin(w) * r, cz = O.z + Math.cos(w) * r
    const tx = Math.cos(w), tz = -Math.sin(w)
    emOpening(m, cx, cz, tx, tz, Math.sin(w), Math.cos(w), 31.0, 33.4, 1.6, 1.6, EM_GLASS, GL)
    emOpening(m, cx, cz, tx, tz, Math.sin(w), Math.cos(w), 29.9, 30.9, 1.6, 0, EM_TILE, TC, 0.12)
  }
  prism(m, O.x, O.z, 35.6, 36.1, 13.2, 16, EM_TRIM, ST)
  // the dome: shallow, terracotta tile, 24 lighter ribs; springs at 36.1 and rises 8.9 to 45 m
  const R = 12.6, H = 8.9, y0 = 36.1, courses = 7, sides = 24
  for (let k = 0; k < courses; k++) {
    const a0 = (k / courses) * (Math.PI / 2), a1 = ((k + 1) / courses) * (Math.PI / 2)
    prism(m, O.x, O.z, y0 + H * Math.sin(a0), y0 + H * Math.sin(a1), R * Math.cos(a0), sides, EM_DOME, TL,
      Math.max(0.01, R * Math.cos(a1)), k === courses - 1)
  }
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2
    for (let k = 0; k < courses - 1; k++) {
      const p0 = (k / courses) * (Math.PI / 2), p1 = ((k + 1) / courses) * (Math.PI / 2)
      const at = (da: number, p: number): V3 => {
        const rr = R * 1.012 * Math.cos(p)
        return [O.x + Math.sin(a + da) * rr, y0 + H * 1.012 * Math.sin(p), O.z + Math.cos(a + da) * rr]
      }
      const w0 = 0.22 / Math.max(0.2, R * Math.cos(p0)), w1 = 0.22 / Math.max(0.2, R * Math.cos(p1))
      m.quad([at(-w0, p0), at(w0, p0), at(w1, p1), at(-w1, p1)], [Math.sin(a), 0.6, Math.cos(a)], uv, EM_RIB, TL)
    }
  }
  prism(m, O.x, O.z, y0 + H - 0.1, y0 + H + 0.15, 1.0, 8, EM_TRIM, ST)

  // ---- the front ranges round the courtyard ----------------------------------------------------------------------
  // the west range (x 0.4…9.6) and its tall arched entrance pavilion on Lake Street
  emBlock(m, 0.4, 9.6, -34, -2.1, 0, 12, EM_WALL)
  emCornice(m, 0.4, 9.6, -34, -2.1, 12)
  emHip(m, 0.05, 9.95, -34.35, -1.9, 12, 2.6, 4.6, 4.6)
  emRow(m, { x: 0.4, z: -2.1 }, { x: 0.4, z: -17.1 }, -1, 0, 6.5, 9.0, 0.6, 0, 3.2)
  emBlock(m, 0.4, 11.4, -43.9, -34, 0, 17, EM_WALL)
  emCornice(m, 0.4, 11.4, -43.9, -34, 17)
  emHip(m, 0.05, 11.75, -44.25, -33.65, 17, 2.2, 5.85, 3.4)
  emOpening(m, 5.9, -43.9, 1, 0, 0, -1, 0, 9.4, 4.5, 4.5, EM_TRIM, ST, 0, 10)       // the moulded archivolt
  emOpening(m, 5.9, -43.9, 1, 0, 0, -1, 0, 9.4, 3.8, 3.8, EM_RECESS, ST, 0.08, 10)
  emOpening(m, 5.9, -43.9, 1, 0, 0, -1, 0, 6.0, 1.8, 1.8, EM_DOOR, GL, 0.12, 8)
  // the east range on Arguello (x 26.8…36.3): arcaded at the ground on Lake, two rows of windows
  emBlock(m, 26.8, 36.3, -43.9, -2.1, 0, 12.5, EM_WALL)
  emCornice(m, 26.8, 36.3, -43.9, -2.1, 12.5)
  emHip(m, 26.45, 36.65, -44.25, -1.75, 12.5, 2.6, 5.1, 5.1)
  emRow(m, { x: 26.8, z: -43.9 }, { x: 36.3, z: -43.9 }, 0, -1, 0, 3.4, 1.4, 1.4, 3.1, EM_RECESS, ST)
  emRow(m, { x: 26.8, z: -43.9 }, { x: 36.3, z: -43.9 }, 0, -1, 7.5, 10, 0.55, 0, 3.1)
  emRow(m, { x: 36.3, z: -43.9 }, { x: 36.3, z: -2.1 }, 1, 0, 1.4, 4.2, 0.55, 0.55, 7)
  emRow(m, { x: 36.3, z: -43.9 }, { x: 36.3, z: -2.1 }, 1, 0, 7.5, 10, 0.55, 0, 7)

  // ---- the courtyard: cloisters east and west, the lanterns at the portal, the Lake Street screen ------------------
  for (const [x0, x1, nx] of [[9.6, 12.6, 1], [23.8, 26.8, -1]] as const) {
    emBlock(m, x0, x1, -34.3, -13.9, 0, 5.2, EM_WALL)
    emHip(m, x0 - 0.2, x1 + 0.2, -34.5, -13.7, 5.2, 0.9, 1.6, 0)
    const xf = nx > 0 ? x1 : x0
    emRow(m, { x: xf, z: -34.3 }, { x: xf, z: -13.9 }, nx, 0, 0, 2.9, 1.25, 1.25, 4.0, EM_RECESS, ST)
  }
  for (const x of [11.1, 26.3]) {
    emBlock(m, x - 1.4, x + 1.4, -16.3, -13.4, 0, 7.6, EM_WALL)
    prism(m, x, -14.9, 7.6, 9.6, 1.1, 8, EM_TRIM, ST)
    prism(m, x, -14.9, 9.6, 10.8, 1.25, 8, EM_TRIM, ST, 0.15)
  }
  {
    // the open screen on Lake Street: three round arches through a stucco wall, plain piers and top
    const z0 = -43.9, z1 = -43.1, x0 = 11.4, x1 = 26.8, top = 8.6, spring = 5.4
    const bays = 3, pier = 1.1
    const bay = (x1 - x0 - pier) / bays
    const hw = (bay - pier) / 2
    const crown = spring + hw
    for (let i = 0; i <= bays; i++) {
      const px = x0 + pier / 2 + i * bay
      emBlock(m, px - pier / 2, px + pier / 2, z0, z1, 0, spring, EM_WALL)
    }
    emBlock(m, x0, x1, z0, z1, crown, top, EM_WALL)
    emBlock(m, x0 - 0.15, x1 + 0.15, z0 - 0.15, z1 + 0.15, top, top + 0.3, EM_TRIM)
    const seg = 6
    for (let i = 0; i < bays; i++) {
      const cx = x0 + pier / 2 + (i + 0.5) * bay
      for (let k = 0; k < seg; k++) {
        const a0 = Math.PI * (k / seg), a1 = Math.PI * ((k + 1) / seg)
        const xa = cx - hw * Math.cos(a0), xb = cx - hw * Math.cos(a1)
        const ya = spring + hw * Math.sin(a0), yb = spring + hw * Math.sin(a1)
        // the spandrel above each segment, front and back, then the arch's soffit
        m.quad([[xa, ya, z0], [xb, yb, z0], [xb, crown, z0], [xa, crown, z0]], [0, 0, -1], uv, EM_WALL, ST)
        m.quad([[xa, ya, z1], [xb, yb, z1], [xb, crown, z1], [xa, crown, z1]], [0, 0, 1], uv, EM_WALL, ST)
        const am = (a0 + a1) / 2
        m.quad([[xa, ya, z0], [xb, yb, z0], [xb, yb, z1], [xa, ya, z1]], [Math.cos(am), -Math.sin(am), 0], uv, EM_TRIM, ST)
      }
    }
  }

  // ---- the west wing (x −36.6…0.4, z −43.9…−17.1): school and offices ---------------------------------------------
  emBlock(m, -36.6, 0.4, -43.9, -17.1, 0, 15, EM_WALL)
  emCornice(m, -36.6, 0.4, -43.9, -17.1, 15)
  emHip(m, -37.0, 0.75, -44.3, -16.7, 15, 3.6, 13.5, 13.5)
  emBlock(m, -13.6, -12.0, -20.6, -18.6, 15, 21.8, EM_WALL)
  emBlock(m, -13.8, -11.8, -20.8, -18.4, 21.8, 22.2, EM_TRIM)
  for (const [a, b, nx, nz] of [
    [{ x: -36.6, z: -43.9 }, { x: 0.4, z: -43.9 }, 0, -1], [{ x: -36.6, z: -17.1 }, { x: -36.6, z: -43.9 }, -1, 0],
    [{ x: 0.4, z: -17.1 }, { x: -36.6, z: -17.1 }, 0, 1]] as [P2, P2, number, number][]) {
    emRow(m, a, b, nx, nz, 1.2, 4.6, 1.2, 1.2, 5.3)         // tall round-arched ground-floor windows
    emRow(m, a, b, nx, nz, 7.4, 12.2, 0.45, 0, 2.65)        // the upper storey: tall slender lights in pairs
  }

  const t = emanuElPlace(fit.ring)
  if (t) emanuElCopy(out, m, t.c, t.s, t.tx, t.tz)
  else emanuElCopy(out, m, 1, 0, 0, 0)
}

// ---------------------------------------------------------------------------------------------------------------
// The Ritz-Carlton, 600 Stockton Street
// ---------------------------------------------------------------------------------------------------------------

/**
 * OSM relation/14543549's outer ring (docs/shots/refs/notable/ritz-carlton/EVIDENCE.md), anticlockwise, in the evidence
 * frame: x east, z north, metres. Stockton Street is the west side. Everything below is drawn in this frame and carried
 * onto the city's `fit.ring` by `rzFit`.
 */
const RZ_OUT: P2[] = [[-46.6, 1.1], [-44.7, -10.1], [-42.4, -9.7], [-38.4, -9.1], [-37.7, -13.2], [-35.3, -12.8], [-30.4, -42.7],
  [-2.6, -38.2], [-2.0, -41.3], [42.2, -34.1], [40.9, -26.2], [40.3, -23.1], [39.1, -15.5], [38.0, -8.9], [43.6, -8.0], [40.8, 9.2],
  [34.6, 8.1], [31.0, 29.8], [38.6, 30.9], [41.2, 31.3], [41.8, 31.4], [38.6, 49.9], [25.6, 47.7], [-44.1, 36.4], [-39.2, 6.3],
  [-41.3, 5.9], [-40.6, 2.1], [-44.3, 1.5]].map(([x, z]) => ({ x, z }))
/** The garden courtyard (the OSM hole), clockwise, so that every wall's outward normal looks into it. */
const RZ_HOLE: P2[] = [[-17.4, 18.5], [28.0, 25.1], [33.2, -10.5], [-10.4, -16.9], [-11.2, -11.1], [-6.6, -10.4], [-9.9, 11.8],
  [-16.3, 10.9]].map(([x, z]) => ({ x, z }))

/**
 * The rotation + translation carrying the evidence frame onto `ring`: a 2-D Procrustes fit of RZ_OUT's 28 vertices
 * against the ring's, over both orders and every start vertex, smallest RMS residual kept; if the ring has another
 * vertex count the edge-matching fit (`emanuElPlaceLoose`'s method) is used. Null when nothing fits within 2 m.
 */
function rzFit(ring: P2[] | undefined): { c: number; s: number; tx: number; tz: number; res: number } | null {
  if (!ring) return null
  type T = { c: number; s: number; tx: number; tz: number; res: number }
  let R = ring
  if (R.length === RZ_OUT.length + 1 && Math.hypot(R[0].x - R[R.length - 1].x, R[0].z - R[R.length - 1].z) < 0.3) R = R.slice(0, -1)
  const n = RZ_OUT.length
  const loose = (): T | null => {
    if (R.length < 4) return null
    const ca = emanuElCentroid(RZ_OUT), cb = emanuElCentroid(R)
    const edges = (r: P2[]): { L: number; a: number }[] => r.map((p, i) => {
      const q = r[(i + 1) % r.length]
      return { L: Math.hypot(q.x - p.x, q.z - p.z), a: Math.atan2(q.z - p.z, q.x - p.x) }
    })
    const ea = edges(RZ_OUT).filter((e) => e.L > 15), eb = edges(R).filter((e) => e.L > 15)
    let best: T | null = null
    for (const a of ea) for (const b of eb) {
      if (Math.abs(a.L - b.L) > 0.2 * a.L) continue
      const th = b.a - a.a, c = Math.cos(th), s = Math.sin(th)
      const tx = cb.x - (ca.x * c - ca.z * s), tz = cb.z - (ca.x * s + ca.z * c)
      const Tp = RZ_OUT.map((p) => ({ x: p.x * c - p.z * s + tx, z: p.x * s + p.z * c + tz }))
      let e = 0
      for (const v of R) {
        let d = Infinity
        for (let i = 0; i < Tp.length; i++) {
          const p = Tp[i], q = Tp[(i + 1) % Tp.length]
          const dx = q.x - p.x, dz = q.z - p.z
          const u = Math.max(0, Math.min(1, ((v.x - p.x) * dx + (v.z - p.z) * dz) / (dx * dx + dz * dz || 1)))
          d = Math.min(d, Math.hypot(v.x - p.x - dx * u, v.z - p.z - dz * u))
        }
        e += d * d
      }
      const res = Math.sqrt(e / R.length)
      if (!best || res < best.res) best = { c, s, tx, tz, res }
    }
    return best && (best as T).res <= 2 ? best : null
  }
  if (R.length !== n) return loose()
  const cb = { x: R.reduce((t, p) => t + p.x, 0) / n, z: R.reduce((t, p) => t + p.z, 0) / n }
  const ca = { x: RZ_OUT.reduce((t, p) => t + p.x, 0) / n, z: RZ_OUT.reduce((t, p) => t + p.z, 0) / n }
  let best: T | null = null
  for (const rev of [false, true]) {
    const Q = rev ? [...RZ_OUT].reverse() : RZ_OUT
    for (let o = 0; o < n; o++) {
      let sn = 0, cs = 0
      for (let i = 0; i < n; i++) {
        const a = Q[(i + o) % n]
        const ax = a.x - ca.x, az = a.z - ca.z, bx = R[i].x - cb.x, bz = R[i].z - cb.z
        cs += ax * bx + az * bz
        sn += ax * bz - az * bx
      }
      const th = Math.atan2(sn, cs), c = Math.cos(th), s = Math.sin(th)
      let e = 0
      for (let i = 0; i < n; i++) {
        const a = Q[(i + o) % n]
        const x = (a.x - ca.x) * c - (a.z - ca.z) * s + cb.x
        const z = (a.x - ca.x) * s + (a.z - ca.z) * c + cb.z
        e += (x - R[i].x) ** 2 + (z - R[i].z) ** 2
      }
      const res = Math.sqrt(e / n)
      if (!best || res < best.res) best = { c, s, tx: cb.x - (ca.x * c - ca.z * s), tz: cb.z - (ca.x * s + ca.z * c), res }
    }
  }
  return best && best.res <= 2 ? best : loose()
}

const RZ_WALL: Rgb = [0.985, 0.975, 0.945]       // #ece8de, white glazed terra cotta
const RZ_TRIM: Rgb = [0.96, 0.95, 0.92]       // cornices, sills, balustrades
const RZ_LINE: Rgb = [0.88, 0.87, 0.84]         // the channels between the courses
const RZ_GLASS: Rgb = [0.13, 0.15, 0.19]
const RZ_DARK: Rgb = [0.07, 0.07, 0.08]
const RZ_ROOF: Rgb = [0.5, 0.5, 0.52]
const RZ_GREEN: Rgb = [0.42, 0.6, 0.5]
const RZ_CN = surfaceTag('concrete')
const RZ_TC = surfaceTag('stucco')       // the lightest wall page: terracotta and ashlar read grey

/**
 * The Ritz-Carlton, 600 Stockton Street at California, Nob Hill: the former Metropolitan Life Insurance Building
 * (1909, Napoleon LeBrun & Sons; extended to the 1950s). White glazed terra cotta, neoclassical.
 *
 * Reference photographs: docs/shots/refs/notable/ritz-carlton/ — the Commons front from the south-west (the Ionic
 * portico on its balustraded terrace, the wing receding to the north), the pediment close-up (sculpted tympanum, frieze
 * with two roundels, Ionic capitals), Mapillary 0, 1, 3, 6, 7 (the channelled wall, paired punched windows, barred
 * rusticated ground storey, heavy cornice) and 4 (the terrace over the drive, the pilastered upper storeys).
 *
 * - the WHITE BLOCK: OSM's outer ring extruded to a heavy cornice (30.5 m) and parapet, round the garden courtyard
 *   (the hole left open, its walls drawn), channelled courses, a rusticated barred ground storey, seven rows of paired
 *   punched windows; the Stockton wings carry tall pilasters over the lower storeys;
 * - the STOCKTON PORTICO: on the west front the plan juts 6.3 m between its two 11.4 m faces; there stands a podium
 *   with the drive opening, the terrace with a pierced balustrade, five Ionic columns on the front and two on each side
 *   (13 m, fluted), an entablature with the roundelled frieze, and a pediment with a sculpted tympanum, up to ≈26 m.
 *
 * Placement: the evidence plan is carried onto `fit.ring` by a 2-D Procrustes fit (`rzFit`, residual well under 2 m); the
 * colonnade is on the ring's west edge in the evidence frame, i.e. the Stockton edge, wherever the ring is turned.
 *
 * Where the photographs overrode the numbers: the pediment spans the whole 11.4 m front with five columns (a count of the
 * Commons frame), not a narrow porch; the portico rises from a ≈7 m terrace over the drive, so the columns run through
 * ≈3 storeys (≈13 m) and the pediment peaks below the wing cornice, as in the photograph; OSM's 8 levels / 30 m read as
 * eight storeys plus a deep cornice in the Mapillary frames (ground storey 5.5 m, then seven 3.3 m rows).
 */
function ritzCarlton_600_Stockton(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const place = rzFit(fit.ring)
  /** the ground above the model's base at an evidence-frame point (the street, where it was measured) */
  const gAt = (x: number, z: number): number => {
    const g = fit.groundAt
    if (!g) return fit.grade ?? 0
    const p = place ? { x: x * place.c - z * place.s + place.tx, z: x * place.s + z * place.c + place.tz } : { x, z }
    return Math.max(0, g(p.x, p.z))
  }
  const FLOOR0 = 5.5, STOREY = 3.3, ROWS = 7, CORN = 28.9, TOP = 30.5

  // ---- the portico's frame: the plan's west front (vertices 0 and 1) --------------------------------------------------
  const F1 = RZ_OUT[1], F2 = RZ_OUT[0]
  const fl = Math.hypot(F2.x - F1.x, F2.z - F1.z)
  const T = { x: (F2.x - F1.x) / fl, z: (F2.z - F1.z) / fl }
  const N = { x: -T.z, z: T.x }                         // out of the building, towards Stockton
  const M = { x: (F1.x + F2.x) / 2, z: (F1.z + F2.z) / 2 }
  const loc = (p: P2): { u: number; v: number } => ({ u: (p.x - M.x) * T.x + (p.z - M.z) * T.z, v: (p.x - M.x) * N.x + (p.z - M.z) * N.z })
  const HW = fl / 2                                      // half the front, 5.7 m
  const D = -(loc(RZ_OUT[3]).v + loc(RZ_OUT[26]).v) / 2   // the porch's depth to the main wall, ≈ 6.3 m
  const W3 = (u: number, v: number, y: number): V3 => [M.x + T.x * u + N.x * v, y, M.z + T.z * u + N.z * v]
  const head = Math.atan2(N.x, N.z)
  /** a box in the portico's frame: centre (u, v, y), half sizes along the front (hu), out of it (hv), up (hy) */
  const lbox = (u: number, v: number, y: number, hu: number, hv: number, hy: number, c: Rgb, tag = RZ_TC): void => {
    const p = W3(u, v, y)
    boxAlong(m, p[0], p[1], p[2], hu, hy, hv, head, c, tag)
  }
  /** a rectangle on a plane of the portico frame facing out (+v), at depth v */
  const lface = (u0: number, u1: number, v: number, y0: number, y1: number, c: Rgb, tag = RZ_TC): void => {
    m.quad([W3(u0, v, y0), W3(u1, v, y0), W3(u1, v, y1), W3(u0, v, y1)], [N.x, 0, N.z], uv, c, tag)
  }

  const gP = Math.min(3.5, gAt(M.x, M.z))               // the street at the portico's foot
  const TER = gP + 7.0                                  // the terrace, over the drive
  const COL0 = TER + 0.2, COL1 = TER + 13.4             // the columns' foot and the top of their capitals
  const ENT = COL1 + 3.6                                // top of the cornice: the pediment's base
  const APEX = ENT + 4.2

  // ---- the block's walls, edge by edge ---------------------------------------------------------------------------------
  const PORT = new Set([26, 27, 0, 1, 2])               // edges of the ring that bound the portico (start vertex)
  const wallRun = (a: P2, b: P2, top: number, o: { windows: boolean; lines: boolean; west: boolean; portico: boolean }): void => {
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.2) return
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = tz, nz = -tx
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    panel(0, L, 0, top, 0, RZ_WALL, RZ_TC)
    // the channelled courses
    const cut = o.portico ? top : TOP
    for (let y = 1.1; y < Math.min(FLOOR0, cut); y += 1.1) panel(0, L, y, y + 0.07, 0.02, RZ_LINE, RZ_TC)
    if (o.lines) for (let y = FLOOR0 + 1.1; y < CORN - 1; y += 1.65) panel(0, L, y, y + 0.07, 0.02, RZ_LINE, RZ_TC)
    if (!o.windows) return
    const mid = { x: a.x + tx * L / 2, z: a.z + tz * L / 2 }
    const gE = Math.min(3.0, gAt(mid.x, mid.z))
    // the ground storey: tall barred openings, set in rusticated piers
    const k0 = Math.floor((L - 1.2) / 3.3)
    for (let i = 0; i < k0; i++) {
      const u = 0.6 + ((L - 1.2) * (i + 0.5)) / k0
      const y0 = gE + 0.9, y1 = Math.min(gE + 4.6, FLOOR0 - 0.5)
      if (y1 - y0 > 1.4) panel(u - 0.75, u + 0.75, y0, y1, 0.05, RZ_GLASS, GL)
      if (o.west && i % 2 === 0 && y1 - y0 > 1.4) {
        // the dark awnings over the Stockton shopfronts and doors
        boxAlong(m, a.x + tx * u + nx * 0.5, y1 + 0.35, a.z + tz * u + nz * 0.5, 0.95, 0.09, 0.55, Math.atan2(nx, nz), RZ_DARK, RZ_TC)
      }
    }
    // the upper storeys: paired punched windows with sills
    const k = Math.floor((L - 1.2) / 2.5)
    for (let i = 0; i < k; i++) {
      const u = 0.6 + ((L - 1.2) * (i + 0.5)) / k
      for (let r = 0; r < ROWS; r++) {
        const y0 = FLOOR0 + r * STOREY + 0.75
        if (y0 + 2.1 > CORN) continue
        panel(u - 0.55, u + 0.55, y0, y0 + 2.1, 0.05, RZ_GLASS, GL)
        panel(u - 0.7, u + 0.7, y0 - 0.12, y0, 0.1, RZ_TRIM, RZ_TC)
      }
    }
    // the Stockton wings: tall pilasters between the bays, through the lower storeys
    if (o.west && k >= 1) {
      for (let i = 0; i <= k; i += 2) {
        const u = 0.6 + ((L - 1.2) * i) / k
        if (u < 0.5 || u > L - 0.5) continue
        { const hh = Math.atan2(nx, nz), px = a.x + tx * u + nx * 0.25, pz = a.z + tz * u + nz * 0.25
          boxAlong(m, px, (FLOOR0 + 20.2) / 2, pz, 0.55, (20.2 - FLOOR0) / 2, 0.25, hh, RZ_WALL, RZ_TC)
          boxAlong(m, px + nx * 0.1, 20.55, pz + nz * 0.1, 0.8, 0.35, 0.35, hh, RZ_TRIM, RZ_TC)
          boxAlong(m, px + nx * 0.05, FLOOR0 + 0.3, pz + nz * 0.05, 0.7, 0.3, 0.3, hh, RZ_TRIM, RZ_TC) }
      }
      boxAlong(m, a.x + tx * L / 2 + nx * 0.3, 21.2, a.z + tz * L / 2 + nz * 0.3, L / 2, 0.6, 0.45, Math.atan2(nx, nz), RZ_TRIM, RZ_TC)
    }
  }
  const cornice = (a: P2, b: P2): void => {
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.2) return
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = tz, nz = -tx, h = Math.atan2(nx, nz)
    const cx = a.x + tx * L / 2, cz = a.z + tz * L / 2
    boxAlong(m, cx + nx * 0.5, CORN + 0.8, cz + nz * 0.5, L / 2 + 0.3, 0.8, 0.55, h, RZ_TRIM, RZ_TC)             // the cornice
    boxAlong(m, cx + nx * 0.05, CORN - 0.35, cz + nz * 0.05, L / 2, 0.35, 0.1, h, RZ_LINE, RZ_TC)                // its frieze
    boxAlong(m, cx + nx * 0.25, TOP + 0.5, cz + nz * 0.25, L / 2 + 0.2, 0.5, 0.2, h, RZ_WALL, RZ_TC)             // the parapet
  }
  const ring = RZ_OUT
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const nx = (b.z - a.z) / L
    if (PORT.has(i)) {
      wallRun(a, b, TER, { windows: false, lines: false, west: false, portico: true })       // the podium under the terrace
      continue
    }
    wallRun(a, b, TOP, { windows: true, lines: true, west: nx < -0.6, portico: false })
    cornice(a, b)
  }
  for (let i = 0; i < RZ_HOLE.length; i++) {
    const a = RZ_HOLE[i], b = RZ_HOLE[(i + 1) % RZ_HOLE.length]
    wallRun(a, b, TOP, { windows: true, lines: true, west: false, portico: false })
    cornice(a, b)
  }
  // the flat grey roof, round the courtyard and without the porch's footprint
  const roofRing = ring.filter((_, i) => ![0, 1, 2, 27].includes(i))
  capPolygonWithHoles(m, [roofRing, RZ_HOLE], TOP, RZ_ROOF, RZ_CN)
  // the terrace, over the podium
  capPolygonWithHoles(m, [[26, 27, 0, 1, 2, 3].map((i) => ring[i])], TER, RZ_TRIM, RZ_TC)

  // ---- the Stockton portico ------------------------------------------------------------------------------------------
  // the podium's front: the drive opening under the terrace, flanked by piers, a lion on a pedestal at each
  lface(-2.4, 2.4, 0.05, gP, gP + 4.8, RZ_DARK, GL)
  lface(-2.9, 2.9, 0.04, gP + 4.8, gP + 5.2, RZ_TRIM, RZ_TC)
  for (const s of [-1, 1]) lbox(s * 3.9, 0.45, gP + 0.7, 0.55, 0.45, 0.7, RZ_TRIM, RZ_TC)
  // the terrace edge and the pierced balustrade across the front and down both sides
  lbox(0, -D / 2 + 0.1, TER - 0.2, HW + 0.25, D / 2 + 0.35, 0.2, RZ_TRIM, RZ_TC)
  const bal = (u0: number, v0: number, u1: number, v1: number): void => {
    const L = Math.hypot(u1 - u0, v1 - v0)
    const du = (u1 - u0) / L, dv = (v1 - v0) / L
    const c = W3((u0 + u1) / 2, (v0 + v1) / 2, TER + 0.55)
    // the rail runs along (du, dv) and faces the local normal (dv, −du)
    const fu = dv, fv = -du
    const fx = T.x * fu + N.x * fv, fz = T.z * fu + N.z * fv
    boxAlong(m, c[0], c[1], c[2], L / 2, 0.55, 0.14, Math.atan2(fx, fz), RZ_TRIM, RZ_TC)
    boxAlong(m, c[0], TER + 1.15, c[2], L / 2 + 0.08, 0.1, 0.22, Math.atan2(fx, fz), RZ_WALL, RZ_TC)
    const k = Math.max(2, Math.round(L / 0.9))
    for (let i = 0; i < k; i++) {
      const w = (i + 0.5) / k
      const uu = u0 + (u1 - u0) * w, vv = v0 + (v1 - v0) * w
      for (const sg of [1, -1]) {
        const p0 = W3(uu - du * 0.28 + fu * sg * 0.15, vv - dv * 0.28 + fv * sg * 0.15, 0)
        const p1 = W3(uu + du * 0.28 + fu * sg * 0.15, vv + dv * 0.28 + fv * sg * 0.15, 0)
        m.quad([[p0[0], TER + 0.3, p0[2]], [p1[0], TER + 0.3, p1[2]], [p1[0], TER + 0.8, p1[2]], [p0[0], TER + 0.8, p0[2]]],
          [fx * sg, 0, fz * sg], uv, RZ_LINE, RZ_TC)
      }
    }
  }
  bal(-HW + 0.1, -0.35, HW - 0.1, -0.35)
  bal(-HW + 0.35, -0.35, -HW + 0.35, -D + 0.3)
  bal(HW - 0.35, -D + 0.3, HW - 0.35, -0.35)
  // the porch's back wall, up to the cornice, with the two tiers of tall windows between the columns
  lface(-HW, HW, -D + 0.02, TER, TOP, RZ_WALL, RZ_TC)
  for (const u of [-4.1, -1.4, 1.4, 4.1]) {
    lface(u - 0.85, u + 0.85, -D + 0.07, TER + 1.4, TER + 6.4, RZ_GLASS, GL)
    lface(u - 0.85, u + 0.85, -D + 0.07, TER + 7.2, TER + 12.4, RZ_GLASS, GL)
    lface(u - 1.0, u + 1.0, -D + 0.05, TER + 6.4, TER + 6.8, RZ_TRIM, RZ_TC)
  }
  for (const u of [-5.4, -2.75, 0, 2.75, 5.4]) lbox(u, -D + 0.3, (TER + COL1) / 2, 0.3, 0.3, (COL1 - TER) / 2, RZ_TRIM, RZ_TC)
  // the Ionic columns: five across the front, two more down each side
  const colAt = (u: number, v: number): void => {
    const p = W3(u, v, 0)
    classicalColumn(m, p[0], p[2], COL0, COL1, 1.0, RZ_WALL, { order: 'ionic', tag: RZ_TC, heading: head, flutes: true, trim: RZ_TRIM })
  }
  for (const u of [-4.7, -2.35, 0, 2.35, 4.7]) colAt(u, -1.3)
  for (const s of [-1, 1]) for (const v of [-4.0]) colAt(s * 4.7, v)
  // the entablature: architrave, the frieze with its two green roundels, the projecting cornice
  lbox(0, -D / 2 - 0.3, COL1 + 0.5, HW + 0.2, D / 2 - 0.1, 0.5, RZ_TRIM, RZ_TC)
  lbox(0, -D / 2 - 0.3, COL1 + 1.5, HW + 0.2, D / 2 - 0.1, 0.5, RZ_WALL, RZ_TC)
  for (const u of [-3.4, 3.4]) lbox(u, 0.0, COL1 + 1.5, 0.4, 0.07, 0.4, RZ_GREEN, GL)
  for (const u of [-4.8, -2.0, 0, 2.0, 4.8]) lbox(u, 0.0, COL1 + 1.5, 0.3, 0.06, 0.4, RZ_LINE, RZ_TC)
  lbox(0, -D / 2 + 0.1, COL1 + 2.6, HW + 0.7, D / 2 + 0.4, 0.4, RZ_TRIM, RZ_TC)
  // the pediment: raking cornice, the tympanum with its sculpted figures, the roof behind
  const hb = HW + 0.7
  const slope = (APEX - ENT) / hb
  for (const s of [-1, 1]) {
    m.quad([W3(s * hb, 0.45, ENT), W3(0, 0.45, APEX), W3(0, -D, APEX), W3(s * hb, -D, ENT)], [T.x * s * slope, 1, T.z * s * slope], uv, RZ_ROOF, RZ_CN)
    // the raking cornice band on the front
    m.quad([W3(s * hb, 0.5, ENT), W3(0, 0.5, APEX), W3(0, 0.5, APEX - 0.6), W3(s * (hb - 0.5), 0.5, ENT)],
      [N.x, 0, N.z], uv, RZ_TRIM, RZ_TC)
  }
  // the tympanum field, a shade deeper than the cornice round it
  m.quad([W3(-(hb - 0.7), 0.0, ENT), W3(hb - 0.7, 0.0, ENT), W3(0, 0.0, APEX - 0.75), W3(0, 0.0, APEX - 0.75)], [N.x, 0, N.z], uv, [0.8, 0.78, 0.73], RZ_TC)
  for (const [u, y, hu, hy] of [[-3.4, 0.45, 1.0, 0.28], [-1.8, 0.7, 0.45, 0.5], [0, 0.9, 0.5, 0.65], [1.6, 0.7, 0.45, 0.5],
    [3.2, 0.5, 0.9, 0.3]] as const) lbox(u, 0.12, ENT + y, hu, 0.12, hy, RZ_WALL, RZ_TC)
  lbox(0, 0.1, APEX + 0.3, 0.5, 0.2, 0.3, RZ_TRIM, RZ_TC)                    // the acroterion
  lbox(0, -D / 2 - 0.3, ENT - 0.05, HW + 0.3, D / 2, 0.05, RZ_TRIM, RZ_TC)

  if (place) emanuElCopy(out, m, place.c, place.s, place.tx, place.tz)
  else emanuElCopy(out, m, 1, 0, 0, 0)
}

// ---------------------------------------------------------------------------------------------------------------
// Pier 43 Ferry Arch
// ---------------------------------------------------------------------------------------------------------------

/** OSM way/288472570 (docs/sf-batches/MODEL-PIER43-ARCH.md), used only when the loader gives no `fit.ring`. */
const P43_RING: P2[] = [[-5.5, -4.6], [0.1, -7.3], [1.4, -4.7], [2.3, -5.2], [11.6, 13.2], [4.5, 16.8], [-4.8, -1.6],
  [-4.1, -1.9]].map(([x, z]) => ({ x, z }))
const P43_WALL: Rgb = [0.925, 0.92, 0.9]       // #ecebe6, white-painted board
const P43_TRIM: Rgb = [0.84, 0.84, 0.82]       // cornice, archivolt: light grey
const P43_LINE: Rgb = [0.72, 0.72, 0.7]        // the channelled rustication, a shade down
const P43_SHADE: Rgb = [0.6, 0.58, 0.54]       // the soffit inside the arch, in the shade
const P43_ROOF: Rgb = [0.6, 0.6, 0.6]
const P43_GLASS: Rgb = [0.3, 0.36, 0.42]

/**
 * The Pier 43 Ferry Arch (1914 headhouse of the Belt Railroad's car-ferry slip, rebuilt 2002–03): a white boarded
 * triumphal-arch pavilion on the end of a pier, the rails running through it. Photographs: docs/shots/refs/notable/
 * pier43-arch/ commons-1 and -5 (the face square on: one great round arch, half the face wide, rising to two-thirds of
 * the height; outer piers channelled by horizontal rustication; a dentilled cornice; a shallow pediment over it), -2
 * and -4 (the oblique: the opening goes THROUGH the thin dimension, the soffit shaded, a low plain annex at one end),
 * -3 (the arch from the water).
 *
 * The plan (OSM, 25 × 8 m) is a 20.6 × 8 m block whose LONG edge is the arch's face, plus a 3 × 6 m annex off one short
 * end. The model is drawn in a frame on that long edge — u along the face, v through the thickness — found from
 * `fit.ring`'s longest edge, so it follows whatever turn the fit gave the footprint. The annex goes at whichever end
 * the ring bulges. Own geometry: round arch 9.6 m wide to 9.3 m, 1.2 m archivolt to the ground, 11 m to the cornice,
 * the pediment to 14.8 m (LiDAR median 14.6, max 16.1 with the pigeons), annex 4.9 m.
 *
 * Where the photographs overruled the numbers: the long side is the face (the pack says so too, but its "opening
 * through the SHORT side" is the same thing seen from the pier); the annex measured from the plan is 3 m long, and
 * the photographs agree (a sixth of the face).
 */
function pier43FerryArch(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const ring = fit.ring && fit.ring.length >= 4 ? fit.ring : P43_RING
  // the longest edge is the face
  let ei = 0, el = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const l = Math.hypot(b.x - a.x, b.z - a.z)
    if (l > el + 0.05) { el = l; ei = i }
  }
  const a = ring[ei], b = ring[(ei + 1) % ring.length]
  const L = el
  const t = { x: (b.x - a.x) / L, z: (b.z - a.z) / L }
  let n = { x: -t.z, z: t.x }
  const cen = { x: ring.reduce((s, p) => s + p.x, 0) / ring.length, z: ring.reduce((s, p) => s + p.z, 0) / ring.length }
  if ((cen.x - a.x) * n.x + (cen.z - a.z) * n.z < 0) n = { x: -n.x, z: -n.z }
  const loc = ring.map((p) => ({ u: (p.x - a.x) * t.x + (p.z - a.z) * t.z, v: (p.x - a.x) * n.x + (p.z - a.z) * n.z }))
  let D = 0
  for (const p of loc) if (p.u > -0.3 && p.u < L + 0.3) D = Math.max(D, p.v)
  D = Math.max(5, Math.min(D, 12))
  // the annex: which end the ring bulges past, how far, and across what depth
  const umin = Math.min(...loc.map((p) => p.u)), umax = Math.max(...loc.map((p) => p.u))
  let su = 0, annexLen = 0
  if (umin < -0.8 && -umin >= umax - L) { su = -1; annexLen = -umin } else if (umax > L + 0.8) { su = 1; annexLen = umax - L }
  const beyond = loc.filter((p) => (su < 0 ? p.u < -0.3 : p.u > L + 0.3))
  const av0 = beyond.length ? Math.min(...beyond.map((p) => p.v)) : 0, av1 = beyond.length ? Math.max(...beyond.map((p) => p.v)) : 0

  // the frame: centre of the block, u along the face, v through it
  const M = { x: a.x + t.x * L / 2 + n.x * D / 2, z: a.z + t.z * L / 2 + n.z * D / 2 }
  const W = (u: number, v: number, y: number): V3 => [M.x + t.x * u + n.x * v, y, M.z + t.z * u + n.z * v]
  const head = Math.atan2(n.x, n.z)
  const q = (p: V3[], nu: number, nv: number, ny: number, c: Rgb, tag = ST): void => {
    m.quad(p, [t.x * nu + n.x * nv, ny, t.z * nu + n.z * nv], uv, c, tag)
  }
  /** a box in the frame: centre (u, v, y), half sizes along the face, through it, up */
  const bx = (u: number, v: number, y: number, hu: number, hv: number, hy: number, c: Rgb, tag = ST): void => {
    const p = W(u, v, y)
    boxAlong(m, p[0], p[1], p[2], hu, hy, hv, head, c, tag)
  }

  const HW = L / 2 - 0.5, BD = D / 2 - 0.4           // the body inside the cornice's overhang
  const TOP = 11.0, CORN = 11.7, APEX = Math.max(13.5, Math.min(15.2, fit.height || 14.8))
  const R = 4.8, YS = 4.5, N = 14, BAND = 1.2         // the arch: half-width, springing, segments, archivolt width
  const arc = (k: number, r: number): [number, number] => {
    const th = Math.PI - (k / N) * Math.PI
    return [r * Math.cos(th), YS + r * Math.sin(th)]
  }

  for (const f of [-1, 1]) {
    const vf = f * BD
    // the piers either side of the arch
    for (const s of [-1, 1]) {
      q([W(s * HW, vf, 0), W(s * R, vf, 0), W(s * R, vf, TOP), W(s * HW, vf, TOP)], 0, f, 0, P43_WALL)
    }
    // the spandrel over the arch, in strips from the curve up to the cornice
    for (let k = 0; k < N; k++) {
      const [u0, y0] = arc(k, R), [u1, y1] = arc(k + 1, R)
      q([W(u0, vf, y0), W(u1, vf, y1), W(u1, vf, TOP), W(u0, vf, TOP)], 0, f, 0, P43_WALL)
    }
    // the archivolt: a moulded band round the opening, down the jambs to the ground
    const pv = vf + f * 0.18
    for (let k = 0; k < N; k++) {
      const [u0, y0] = arc(k, R), [u1, y1] = arc(k + 1, R)
      const [w0, z0] = arc(k, R + BAND), [w1, z1] = arc(k + 1, R + BAND)
      q([W(u0, pv, y0), W(u1, pv, y1), W(w1, pv, z1), W(w0, pv, z0)], 0, f, 0, P43_TRIM)
    }
    for (const s of [-1, 1]) {
      q([W(s * R, pv, 0), W(s * (R + BAND), pv, 0), W(s * (R + BAND), pv, YS), W(s * R, pv, YS)], 0, f, 0, P43_TRIM)
      // the band's outer edge, so it stands off the wall
      q([W(s * (R + BAND), vf, 0), W(s * (R + BAND), pv, 0), W(s * (R + BAND), pv, YS), W(s * (R + BAND), vf, YS)], s, 0, 0, P43_LINE)
    }
    // the channelled rustication on the outer piers, and a shield panel high on each
    for (const s of [-1, 1]) {
      for (let y = 0.9; y < TOP - 0.4; y += 0.9) {
        q([W(s * (HW - 2.3), vf + f * 0.03, y), W(s * HW, vf + f * 0.03, y), W(s * HW, vf + f * 0.03, y + 0.09), W(s * (HW - 2.3), vf + f * 0.03, y + 0.09)], 0, f, 0, P43_LINE)
      }
      q([W(s * (HW - 1.2) - 0.5, vf + f * 0.03, 8.0), W(s * (HW - 1.2) + 0.5, vf + f * 0.03, 8.0), W(s * (HW - 1.2) + 0.5, vf + f * 0.03, 9.8), W(s * (HW - 1.2) - 0.5, vf + f * 0.03, 9.8)], 0, f, 0, P43_LINE)
    }
    // the frieze band and its dentils under the cornice
    q([W(-HW, vf + f * 0.04, TOP - 0.55), W(HW, vf + f * 0.04, TOP - 0.55), W(HW, vf + f * 0.04, TOP), W(-HW, vf + f * 0.04, TOP)], 0, f, 0, P43_LINE)
    for (let u = -HW + 0.4; u < HW; u += 0.8) bx(u, f * (BD + 0.1), TOP + 0.05, 0.22, 0.12, 0.2, P43_TRIM)
    // the raking cornice of the pediment on the face, and the tympanum inside it
    const E = L / 2 - 0.2, cv = f * (D / 2)
    q([W(-E, cv, CORN), W(E, cv, CORN), W(0, cv, APEX), W(0, cv, APEX)], 0, f, 0, P43_WALL)
    for (const s of [-1, 1]) {
      const cv2 = cv + f * 0.12
      q([W(s * E, cv2, CORN), W(0, cv2, APEX), W(0, cv2, APEX - 0.75), W(s * (E - 0.1), cv2, CORN + 0.0 + 0.0)], 0, f, 0, P43_TRIM)
      q([W(s * E, cv2, CORN), W(s * E, cv2, CORN + 0.5), W(0, cv2, APEX), W(0, cv2, APEX - 0.7)], s * 0.3, f, 0.9, P43_TRIM)
    }
  }
  // the end faces of the body: channelled like the piers
  for (const s of [-1, 1]) {
    q([W(s * HW, -BD, 0), W(s * HW, BD, 0), W(s * HW, BD, TOP), W(s * HW, -BD, TOP)], s, 0, 0, P43_WALL)
    for (let y = 0.9; y < TOP - 0.4; y += 0.9) {
      q([W(s * (HW + 0.03), -BD, y), W(s * (HW + 0.03), BD, y), W(s * (HW + 0.03), BD, y + 0.09), W(s * (HW + 0.03), -BD, y + 0.09)], s, 0, 0, P43_LINE)
    }
  }
  // the tunnel: soffit, jambs, and the dark rail floor edge
  for (let k = 0; k < N; k++) {
    const [u0, y0] = arc(k, R), [u1, y1] = arc(k + 1, R)
    const th = Math.PI - ((k + 0.5) / N) * Math.PI
    q([W(u0, -BD, y0), W(u1, -BD, y1), W(u1, BD, y1), W(u0, BD, y0)], -Math.cos(th), 0, -Math.sin(th), P43_SHADE)
  }
  for (const s of [-1, 1]) q([W(s * R, -BD, 0), W(s * R, BD, 0), W(s * R, BD, YS), W(s * R, -BD, YS)], -s, 0, 0, P43_SHADE)
  // the cornice, and the roof of the pediment
  bx(0, 0, TOP + 0.35, L / 2, D / 2, 0.35, P43_TRIM)
  bx(0, 0, CORN + 0.04, L / 2 - 0.05, D / 2 - 0.05, 0.05, P43_LINE)
  const E = L / 2 - 0.2, RV = D / 2 - 0.1
  for (const s of [-1, 1]) {
    const nu = s * (APEX - CORN), nyy = E
    const nl = Math.hypot(nu, nyy)
    q([W(s * E, -RV, CORN), W(s * E, RV, CORN), W(0, RV, APEX), W(0, -RV, APEX)], nu / nl, 0, nyy / nl, P43_ROOF, RZ_CN)
  }
  // the low plain annex at one end of the face, with a cap and a window
  if (su !== 0 && annexLen > 0.8) {
    const AH = 4.9
    const u0 = su < 0 ? -L / 2 - annexLen : L / 2, u1 = su < 0 ? -L / 2 : L / 2 + annexLen
    const vA0 = av0 - D / 2, vA1 = av1 - D / 2
    const cu = (u0 + u1) / 2, cv = (vA0 + vA1) / 2, hu = (u1 - u0) / 2, hv = (vA1 - vA0) / 2
    bx(cu, cv, AH / 2, hu - 0.05, hv - 0.05, AH / 2, P43_WALL)
    bx(cu, cv, AH + 0.17, hu + 0.15, hv + 0.15, 0.17, P43_TRIM)
    bx(cu, cv, AH + 0.38, hu + 0.05, hv + 0.05, 0.05, P43_LINE)
    // a window on each long side
    const wu = cu + su * 0, wv0 = vA0 - 0.03, wv1 = vA1 + 0.03
    q([W(wu - 0.6, wv0, 1.6), W(wu + 0.6, wv0, 1.6), W(wu + 0.6, wv0, 3.5), W(wu - 0.6, wv0, 3.5)], 0, -1, 0, P43_GLASS, GL)
    q([W(wu - 0.6, wv1, 1.6), W(wu + 0.6, wv1, 1.6), W(wu + 0.6, wv1, 3.5), W(wu - 0.6, wv1, 3.5)], 0, 1, 0, P43_GLASS, GL)
  }
  emanuElCopy(out, m, 1, 0, 0, 0)
}

// ---------------------------------------------------------------------------------------------------------------
// Malloch Building, 1360 Montgomery Street
// ---------------------------------------------------------------------------------------------------------------

/**
 * OSM way/262076706's 13 vertices (docs/shots/refs/notable/malloch/EVIDENCE.md), anticlockwise, TURNED so the 22 m edge
 * that runs along Montgomery Street (vertices 0 to 1, the longest straight edge parallel to the street grid, with the
 * Montgomery-side neighbours across it) lies along z at the west, and recentred: the model's design frame, x east,
 * z north. Everything below is drawn in this frame and carried onto the city's `fit.ring` by `mbPlace`.
 */
const MB_PLAN: P2[] = [[-15.7, 9.2], [-15.7, -12.8], [10.8, -12.8], [10.8, -7.4], [10.8, -5.6], [1.0, -5.5], [1.0, -1.5], [2.7, -1.5],
  [2.7, -1.4], [2.7, 9.2], [2.7, 10.4], [-6.9, 10.5], [-6.9, 9.2]].map(([x, z]) => ({ x, z }))
/** The same outline with its 0.1 m jitters squared off and the collinear vertices dropped: ten corners. */
const MB_D: P2[] = [[-15.7, 9.2], [-15.7, -12.8], [10.8, -12.8], [10.8, -5.5], [1.0, -5.5], [1.0, -1.5], [2.7, -1.5], [2.7, 10.4],
  [-6.9, 10.4], [-6.9, 9.2]].map(([x, z]) => ({ x, z }))
/** Corner radii of MB_D: the north-west and south-east/north-east corners are the Streamline rounds (photo commons-3). */
const MB_RAD = [2.2, 0.7, 2.2, 1.6, 0, 0, 0, 2.0, 0, 0]
/** The tall block is west of x = −3.2 (north of the wing) and of x = 1.0 (south of z = −5.5); the rest is a storey lower. */
const mbTall = (x: number, z: number): boolean => (z < -5.49 ? x < 1.01 : x < -3.19)

const MB_WALL: Rgb = [0.945, 0.94, 0.918]     // #f2f1ec, the white paint
const MB_WALL2: Rgb = [0.8, 0.8, 0.78]        // soffits and the undersides of the bands
const MB_FOUND: Rgb = [0.56, 0.55, 0.53]      // the concrete under the garage floors
const MB_FRAME: Rgb = [0.86, 0.86, 0.84]      // thin pale window frames
const MB_GLASS: Rgb = [0.4, 0.45, 0.51]
const MB_BLOCK: Rgb = [0.7, 0.8, 0.82]        // glass block
const MB_SILVER: Rgb = [0.7, 0.72, 0.74]      // the ribbed aluminium band at the entrance
const MB_MURAL: Rgb = [0.76, 0.775, 0.79]    // #b9bcbf, the silver-grey sgraffito ground
const MB_MURAL_D: Rgb = [0.6, 0.62, 0.65]
const MB_MURAL_L: Rgb = [0.9, 0.915, 0.93]
const MB_BLUE: Rgb = [0.72, 0.82, 0.93]
const MB_RAIL: Rgb = [0.92, 0.92, 0.9]
const MB_ROOF: Rgb = [0.76, 0.76, 0.74]
const MB_DARK: Rgb = [0.1, 0.1, 0.11]
const MB_MT = surfaceTag('metal')
const MB_CN = surfaceTag('concrete')

/**
 * The rotation + translation carrying MB_PLAN's frame onto `ring`: a 2-D Procrustes fit of the plan's 13 vertices against
 * the ring's (both orders, every start vertex, smallest RMS kept); with another vertex count, the long edges are laid
 * on each other (centroids coincident) and the best RMS wins. Null when nothing fits within 2.5 m.
 */
function mbPlace(ring: P2[] | undefined): { c: number; s: number; tx: number; tz: number; res: number } | null {
  type T = { c: number; s: number; tx: number; tz: number; res: number }
  if (!ring || ring.length < 4) return null
  let R = ring
  const n = MB_PLAN.length
  if (R.length === n + 1 && Math.hypot(R[0].x - R[n].x, R[0].z - R[n].z) < 0.3) R = R.slice(0, n)
  let best: T | null = null
  if (R.length === n) {
    const cb = { x: R.reduce((t, p) => t + p.x, 0) / n, z: R.reduce((t, p) => t + p.z, 0) / n }
    const ca = { x: MB_PLAN.reduce((t, p) => t + p.x, 0) / n, z: MB_PLAN.reduce((t, p) => t + p.z, 0) / n }
    for (const rev of [false, true]) {
      const Q = rev ? [...MB_PLAN].reverse() : MB_PLAN
      for (let o = 0; o < n; o++) {
        let sn = 0, cs = 0
        for (let i = 0; i < n; i++) {
          const a = Q[(i + o) % n]
          const ax = a.x - ca.x, az = a.z - ca.z, bx = R[i].x - cb.x, bz = R[i].z - cb.z
          cs += ax * bx + az * bz
          sn += ax * bz - az * bx
        }
        const th = Math.atan2(sn, cs), c = Math.cos(th), s = Math.sin(th)
        let e = 0
        for (let i = 0; i < n; i++) {
          const a = Q[(i + o) % n]
          const x = (a.x - ca.x) * c - (a.z - ca.z) * s + cb.x, z = (a.x - ca.x) * s + (a.z - ca.z) * c + cb.z
          e += (x - R[i].x) ** 2 + (z - R[i].z) ** 2
        }
        const res = Math.sqrt(e / n)
        if (!best || res < best.res) best = { c, s, tx: cb.x - (ca.x * c - ca.z * s), tz: cb.z - (ca.x * s + ca.z * c), res }
      }
    }
    if (best && best.res <= 2.5) return best
  }
  const ca = emanuElCentroid(MB_PLAN), cb = emanuElCentroid(R)
  const edges = (r: P2[]): { L: number; a: number }[] => r.map((p, i) => {
    const q = r[(i + 1) % r.length]
    return { L: Math.hypot(q.x - p.x, q.z - p.z), a: Math.atan2(q.z - p.z, q.x - p.x) }
  })
  best = null
  for (const a of edges(MB_PLAN).filter((e) => e.L > 15)) {
    for (const b of edges(R).filter((e) => e.L > 15)) {
      if (Math.abs(a.L - b.L) > 0.2 * a.L) continue
      const th = b.a - a.a, c = Math.cos(th), s = Math.sin(th)
      const tx = cb.x - (ca.x * c - ca.z * s), tz = cb.z - (ca.x * s + ca.z * c)
      const T = MB_PLAN.map((p) => ({ x: p.x * c - p.z * s + tx, z: p.x * s + p.z * c + tz }))
      let e = 0
      for (const v of R) {
        let d = Infinity
        for (let i = 0; i < T.length; i++) {
          const p = T[i], q = T[(i + 1) % T.length]
          const dx = q.x - p.x, dz = q.z - p.z
          const u = Math.max(0, Math.min(1, ((v.x - p.x) * dx + (v.z - p.z) * dz) / (dx * dx + dz * dz || 1)))
          d = Math.min(d, Math.hypot(v.x - p.x - dx * u, v.z - p.z - dz * u))
        }
        e += d * d
      }
      const res = Math.sqrt(e / R.length)
      if (!best || res < best.res) best = { c, s, tx, tz, res }
    }
  }
  return best && best.res <= 2.5 ? best : null
}

/** A closed polygon with the chosen corners rounded by a quarter circle of the given radius (anticlockwise in, out). */
function mbRound(pts: P2[], rad: number[], N = 4): { p: P2; e: number; arc: boolean }[] {
  const n = pts.length, res: { p: P2; e: number; arc: boolean }[] = []
  for (let i = 0; i < n; i++) {
    const v = pts[i], pv = pts[(i + n - 1) % n], nx = pts[(i + 1) % n]
    const lin = Math.hypot(v.x - pv.x, v.z - pv.z), lout = Math.hypot(nx.x - v.x, nx.z - v.z)
    const r = Math.min(rad[i] ?? 0, lin / 2, lout / 2)
    if (r < 0.05) { res.push({ p: v, e: i, arc: false }); continue }
    const tin = { x: (v.x - pv.x) / lin, z: (v.z - pv.z) / lin }
    const nin = { x: tin.z, z: -tin.x }
    const c = { x: v.x - tin.x * r - nin.x * r, z: v.z - tin.z * r - nin.z * r }
    const a0 = Math.atan2(nin.z, nin.x)
    for (let k = 0; k <= N; k++) {
      const ang = a0 + (k / N) * (Math.PI / 2)
      res.push({ p: { x: c.x + r * Math.cos(ang), z: c.z + r * Math.sin(ang) }, e: k < N ? (i + n - 1) % n : i, arc: k < N })
    }
  }
  return res
}

/**
 * The Malloch Building (Malloch Apartments, 1936-37, Irvin Goldstine; 1360 Montgomery Street, Telegraph Hill): the
 * "ocean-liner house", Streamline Moderne. Photographs: docs/shots/refs/notable/malloch/ commons-3 (the whole house from
 * the corner of Filbert: WHITE walls, rounded corners, balcony bands with pipe rails wrapping them, ribbon windows, a
 * roof terrace with railings, a slim stair tower above the roof, the tall silver mural on the west wall), commons-1 (the
 * explorer mural, the white returns), commons-2 (the entrance under the 2nd-floor balcony: a horizontally ribbed silver
 * band lettered 1360 MONTGOMERY ST., glass block, an open stair), mapillary-1 (the house from the street, white, 4-5
 * storeys).
 *
 * Plan: OSM way/262076706 (13 vertices, 469 m²) in MB_PLAN's frame, with the corners squared and then the Streamline
 * rounds put back (the OSM corners are square, the building's are not). The WEST edge is not assumed from the fit's "front": the
 * plan is laid on `fit.ring` by `mbPlace` (Procrustes over the 13 vertices), and the plan's 22 m vertex-0-to-1 edge, parallel
 * to the street grid with the 1321 Montgomery houses across it, is Montgomery. The north face is the 9 m + 10 m pair with
 * the 1.2 m jog, Filbert beyond it.
 *
 * Massing (photos over numbers): four storeys of 3.15 m from Montgomery's pavement (LiDAR median 13.8, max 16.8 with
 * the tower; roof 12.6 m + coping, tower 3.4 m more), plus two floors below that stand only on the downhill (east,
 * south) side. West of x = −3.2 (and of 1.0 on the south strip) the block is full height; the east end, the notch's
 * far side and the wing are a storey lower with a roof terrace and railing, which is what commons-3 shows left of the
 * tall block. The 3 floors of balcony bands (slab 0.3 m, 1.0 m out, thin pipe rails) wrap the low part.
 *
 * Slope: `G`, the pavement on Montgomery, is `fit.groundAt` at the west edge's middle (just outside it) above the model's
 * base, else `fit.grade`, else a floor and a half (4.7 m, so the shot tool shows the garage floor below the street). Every wall's foot
 * follows `groundAt` along it (concrete below the sub-basement floor G − 6.3), windows are not cut below the ground, and
 * the bands are not drawn where the ground is above them. The ground floor, the entrance recess and the murals are set
 * from G; without groundAt the ground is the base (flat), and the house stands on it as the downhill corner would.
 */
function mallochBuilding_1360_Montgomery(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const place = mbPlace(fit.ring)
  const toRing = (x: number, z: number): P2 => place ? { x: x * place.c - z * place.s + place.tx, z: x * place.s + place.c * z + place.tz } : { x, z }
  /** the ground above the model's base at a design-frame point */
  const gnd = (x: number, z: number): number => {
    if (!fit.groundAt) return 0
    const p = toRing(x, z)
    return Math.max(0, fit.groundAt(p.x, p.z))
  }
  const S = 3.15
  const G = Math.max(0, Math.min(14, fit.groundAt ? gnd(-16.7, -1.8) : (fit.grade ?? 1.5 * S)))
  const R = G + 4 * S, RL = G + 3 * S, YF = G - 2 * S, YW = Math.max(YF, 0)
  const roofAt = (x: number, z: number): number => (mbTall(x, z) ? R : RL)
  const foot = (x: number, z: number): number => Math.max(0, gnd(x, z) - 0.3)

  const nrm = (x: number, z: number): V3 => [x, 0, z]
  const up: V3 = [0, 1, 0], down: V3 = [0, -1, 0]
  const Q = (p: V3[], n: V3, c: Rgb, tag = ST): void => m.quad(p, n, uv, c, tag)

  // ---- the walls, edge by edge ---------------------------------------------------------------------------------------
  const E = MB_D.map((a, i) => {
    const b = MB_D[(i + 1) % MB_D.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const t = { x: (b.x - a.x) / L, z: (b.z - a.z) / L }
    return { a, b, L, t, n: { x: t.z, z: -t.x } }
  })
  type Seg = { a: P2; b: P2; e: number; arc: boolean }
  const segs: Seg[] = []
  {
    const path = mbRound(MB_D, MB_RAD)
    for (let j = 0; j < path.length; j++) {
      const a = path[j], b = path[(j + 1) % path.length]
      const horiz = Math.abs(a.p.z - b.p.z) < 1e-6 && !a.arc
      const X = horiz ? (a.p.z > -5.4 ? -3.2 : a.p.z < -5.6 ? 1.0 : NaN) : NaN
      if (horiz && Number.isFinite(X) && Math.min(a.p.x, b.p.x) < X - 1e-6 && Math.max(a.p.x, b.p.x) > X + 1e-6) {
        const mid = { x: X, z: a.p.z }
        segs.push({ a: a.p, b: mid, e: a.e, arc: false }, { a: mid, b: b.p, e: a.e, arc: false })
      } else segs.push({ a: a.p, b: b.p, e: a.e, arc: a.arc })
    }
  }
  const NS = segs.length
  const nrmOf = segs.map((s) => {
    const L = Math.hypot(s.b.x - s.a.x, s.b.z - s.a.z)
    return { x: (s.b.z - s.a.z) / L, z: -(s.b.x - s.a.x) / L, L }
  })
  /** the point i of the path pushed d outward along the mitre (the join of segments i−1 and i) */
  const off = (i: number, d: number, y: number): V3 => {
    const j = i % NS, k = (j + NS - 1) % NS
    const n1 = nrmOf[k], n2 = nrmOf[j]
    const den = 1 + n1.x * n2.x + n1.z * n2.z
    return [segs[j].a.x + ((n1.x + n2.x) / den) * d, y, segs[j].a.z + ((n1.z + n2.z) / den) * d]
  }
  const segMid = (s: Seg): P2 => ({ x: (s.a.x + s.b.x) / 2, z: (s.a.z + s.b.z) / 2 })

  /** the segments of the north-west round */
  const NW = (q: Seg): boolean => q.arc && q.a.x < -13.4 && q.a.z > 6.9
  // the entrance recess in the west wall (edge 0, measured from the north end): 5.2 m wide, three floors tall
  const RC0 = 8.2, RC1 = 13.4
  const yRc = G + 3 * S - 0.3
  for (let j = 0; j < NS; j++) {
    const s = segs[j], { x: nx, z: nz, L } = nrmOf[j]
    const mid = segMid(s)
    const top = roofAt(mid.x, mid.z)
    const t = { x: (s.b.x - s.a.x) / L, z: (s.b.z - s.a.z) / L }
    const ya = foot(s.a.x, s.a.z), yb = foot(s.b.x, s.b.z)
    const piece = (u0: number, u1: number, y0: number, y1: number, c: Rgb, tag = ST): void => {
      const A: V3 = [s.a.x + t.x * u0, y0, s.a.z + t.z * u0], B: V3 = [s.a.x + t.x * u1, y0, s.a.z + t.z * u1]
      Q([A, B, [B[0], y1, B[2]], [A[0], y1, A[2]]], nrm(nx, nz), c, tag)
    }
    const found = (u0: number, u1: number): void => {
      const f0 = ya + (yb - ya) * (u0 / L), f1 = ya + (yb - ya) * (u1 / L)
      if (Math.min(f0, YF) >= YF - 0.02 && Math.min(f1, YF) >= YF - 0.02) return
      const A: V3 = [s.a.x + t.x * u0, Math.min(f0, YF), s.a.z + t.z * u0], B: V3 = [s.a.x + t.x * u1, Math.min(f1, YF), s.a.z + t.z * u1]
      Q([A, B, [B[0], YF, B[2]], [A[0], YF, A[2]]], nrm(nx, nz), MB_FOUND, MB_CN)
    }
    if (s.e === 0 && !s.arc) {
      const u0 = RC0 - 2.2, u1 = RC1 - 2.2          // the recess along this segment (it starts 2.2 m down, after the north-west round)
      found(0, u0); piece(0, u0, YW, top, MB_WALL)
      found(u1, L); piece(u1, L, YW, top, MB_WALL)
      piece(u0, u1, yRc, top, MB_WALL)
      found(u0, u1); piece(u0, u1, YW, G, MB_FOUND, MB_CN)
      continue
    }
    found(0, L)
    if (NW(s)) {
      // the north-west corner is SQUARE up to the top floor (commons-3); only the top storey is the rounded glass-block bay
      piece(0, L, G + 3 * S, top, MB_WALL)
      if (s.a.x > -13.6) {
        const sq = (a: P2, b: P2, n: V3): void => Q([[a.x, YW, a.z], [b.x, YW, b.z], [b.x, G + 3 * S, b.z], [a.x, G + 3 * S, a.z]], n, MB_WALL)
        sq({ x: -13.5, z: 9.2 }, { x: -15.7, z: 9.2 }, nrm(0, 1))
        sq({ x: -15.7, z: 9.2 }, { x: -15.7, z: 7.0 }, nrm(-1, 0))
        // the ledge the corner leaves outside the bay
        const cp: P2[] = segs.filter(NW).map((q) => q.a).concat([{ x: -15.7, z: 7.0 }])
        for (let i = 0; i + 1 < cp.length; i++) Q([[-15.7, G + 3 * S, 9.2], [cp[i].x, G + 3 * S, cp[i].z], [cp[i + 1].x, G + 3 * S, cp[i + 1].z], [-15.7, G + 3 * S, 9.2]], up, MB_ROOF, MB_CN)
      }
      continue
    }
    piece(0, L, YW, top, MB_WALL)
  }

  // ---- the entrance recess: back wall, jambs, ceiling, glass-block pillar, stair, the ribbed band -----------------------
  {
    const x0 = -15.7, x1 = x0 + 1.8, v0 = 9.2 - RC1, v1 = 9.2 - RC0
    Q([[x1, G, v1], [x1, G, v0], [x1, yRc, v0], [x1, yRc, v1]], nrm(-1, 0), MB_DARK)
    Q([[x0, G, v1], [x1, G, v1], [x1, yRc, v1], [x0, yRc, v1]], nrm(0, -1), MB_WALL2)
    Q([[x1, G, v0], [x0, G, v0], [x0, yRc, v0], [x1, yRc, v0]], nrm(0, 1), MB_WALL2)
    Q([[x0, yRc, v1], [x1, yRc, v1], [x1, yRc, v0], [x0, yRc, v0]], down, MB_WALL2)
    Q([[x0, G + 0.02, v1], [x1, G + 0.02, v1], [x1, G + 0.02, v0], [x0, G + 0.02, v0]], up, [0.3, 0.3, 0.3], MB_CN)
    prism(m, x0 + 0.9, v1 - 1.3, G, G + 2 * S - 0.3, 0.3, 8, MB_BLOCK, GL)              // the glass-block pillar
    // the open stair climbing along the back wall, with its white string and rail
    const sx = x1 - 0.55
    Q([[sx, G, v0 + 0.3], [sx, G, v1 - 1.9], [sx, G + S, v1 - 0.4], [sx, G + S, v0 + 1.8]], nrm(-1, 0), MB_WALL)
    Q([[sx, G + 0.02, v0 + 0.3], [sx + 0.9, G + 0.02, v0 + 0.3], [sx + 0.9, G + S, v0 + 1.8], [sx, G + S, v0 + 1.8]], up, MB_WALL2)
    // the aluminium balcony band over the stair: horizontally ribbed, lettered, with a glass rail above
    const yb0 = G + 2 * S - 0.25, yb1 = yb0 + 1.2, px = x0 - 0.55
    Q([[px, yb0, v1 + 0.15], [px, yb0, v0 - 0.15], [px, yb1, v0 - 0.15], [px, yb1, v1 + 0.15]], nrm(-1, 0), MB_SILVER, MB_MT)
    for (let k = 1; k < 8; k++) {
      const y = yb0 + (k * (yb1 - yb0)) / 8
      Q([[px - 0.03, y, v1 + 0.15], [px - 0.03, y, v0 - 0.15], [px - 0.03, y + 0.045, v0 - 0.15], [px - 0.03, y + 0.045, v1 + 0.15]], nrm(-1, 0), [0.45, 0.47, 0.5], MB_MT)
    }
    Q([[px, yb1, v1 + 0.15], [x0, yb1, v1 + 0.15], [x0, yb1, v0 - 0.15], [px, yb1, v0 - 0.15]], up, MB_SILVER, MB_MT)
    Q([[px, yb0, v1 + 0.15], [px, yb0, v0 - 0.15], [x0, yb0, v0 - 0.15], [x0, yb0, v1 + 0.15]], down, MB_WALL2)
    Q([[px, yb0, v1 + 0.15], [x0, yb0, v1 + 0.15], [x0, yb1, v1 + 0.15], [px, yb1, v1 + 0.15]], nrm(0, 1), MB_SILVER, MB_MT)
    Q([[x0, yb0, v0 - 0.15], [px, yb0, v0 - 0.15], [px, yb1, v0 - 0.15], [x0, yb1, v0 - 0.15]], nrm(0, -1), MB_SILVER, MB_MT)
    // "1360" tall, "MONTGOMERY ST." low, in white letters on the lowest ribs
    Q([[px - 0.05, yb0 + 0.1, v1 + 1.0], [px - 0.05, yb0 + 0.1, v1 + 2.35], [px - 0.05, yb0 + 0.55, v1 + 2.35], [px - 0.05, yb0 + 0.55, v1 + 1.0]], nrm(-1, 0), MB_WALL)
    Q([[px - 0.05, yb0 + 0.1, v1 + 2.55], [px - 0.05, yb0 + 0.1, v0 - 1.0], [px - 0.05, yb0 + 0.34, v0 - 1.0], [px - 0.05, yb0 + 0.34, v1 + 2.55]], nrm(-1, 0), MB_WALL)
    Q([[px - 0.06, yb1, v1 + 0.15], [px - 0.06, yb1, v0 - 0.15], [px - 0.06, yb1 + 1.0, v0 - 0.15], [px - 0.06, yb1 + 1.0, v1 + 0.15]], nrm(-1, 0), [0.74, 0.82, 0.84], GL)
    Q([[px - 0.07, yb1 + 1.0, v1 + 0.15], [px - 0.07, yb1 + 1.0, v0 - 0.15], [px - 0.07, yb1 + 1.06, v0 - 0.15], [px - 0.07, yb1 + 1.06, v1 + 0.15]], nrm(-1, 0), MB_RAIL, MB_MT)
  }

  // ---- the three zones' roofs and the walls between them ------------------------------------------------------------------
  const roundRing = (pts: [number, number][], rad: number[]): P2[] => mbRound(pts.map(([x, z]) => ({ x, z })), rad).map((q) => q.p)
  const ROOFTAG = MB_CN
  capPolygonWithHoles(m, [roundRing([[-15.7, 9.2], [-15.7, -12.8], [1.0, -12.8], [1.0, -5.5], [-3.2, -5.5], [-3.2, 10.4], [-6.9, 10.4], [-6.9, 9.2]],
    [2.2, 0.7, 0, 0, 0, 0, 0, 0])], R, MB_ROOF, ROOFTAG)
  capPolygonWithHoles(m, [roundRing([[-3.2, -5.5], [1.0, -5.5], [1.0, -1.5], [2.7, -1.5], [2.7, 10.4], [-3.2, 10.4]], [0, 0, 0, 0, 2.0, 0])], RL, MB_ROOF, ROOFTAG)
  capPolygonWithHoles(m, [roundRing([[1.0, -12.8], [10.8, -12.8], [10.8, -5.5], [1.0, -5.5]], [0, 2.2, 1.6, 0])], RL, MB_ROOF, ROOFTAG)
  // the faces the tall block shows over the low roofs
  Q([[-3.2, RL, -5.5], [-3.2, RL, 10.4], [-3.2, R, 10.4], [-3.2, R, -5.5]], nrm(1, 0), MB_WALL)
  Q([[-3.2, RL, -5.5], [1.0, RL, -5.5], [1.0, R, -5.5], [-3.2, R, -5.5]], nrm(0, 1), MB_WALL)
  Q([[1.0, RL, -12.8], [1.0, RL, -5.5], [1.0, R, -5.5], [1.0, R, -12.8]], nrm(1, 0), MB_WALL)

  // ---- coping and pipe rails round every roof edge ------------------------------------------------------------------------
  const rail = (a: V3, b: V3, nx: number, nz: number, y: number, hh: number): void => {
    Q([[a[0], y, a[2]], [b[0], y, b[2]], [b[0], y + hh, b[2]], [a[0], y + hh, a[2]]], nrm(nx, nz), MB_RAIL, MB_MT)
  }
  /** posts (two crossed slivers) every ~2.4 m along a->b, from y, 1 m high */
  const posts = (a: V3, b: V3, y: number): void => {
    const L = Math.hypot(b[0] - a[0], b[2] - a[2])
    const k = Math.max(1, Math.round(L / 2.4))
    const tx = (b[0] - a[0]) / (L || 1), tz = (b[2] - a[2]) / (L || 1)
    for (let i = 0; i < k; i++) {
      const x = a[0] + (b[0] - a[0]) * (i / k), z = a[2] + (b[2] - a[2]) * (i / k)
      Q([[x - tx * 0.04, y, z - tz * 0.04], [x + tx * 0.04, y, z + tz * 0.04], [x + tx * 0.04, y + 1, z + tz * 0.04], [x - tx * 0.04, y + 1, z - tz * 0.04]], nrm(tz, -tx), MB_RAIL, MB_MT)
      Q([[x - tz * 0.04, y, z + tx * 0.04], [x + tz * 0.04, y, z - tx * 0.04], [x + tz * 0.04, y + 1, z - tx * 0.04], [x - tz * 0.04, y + 1, z + tx * 0.04]], nrm(tx, tz), MB_RAIL, MB_MT)
    }
  }
  for (let j = 0; j < NS; j++) {
    const s = segs[j], { x: nx, z: nz } = nrmOf[j]
    const mid = segMid(s)
    const y = roofAt(mid.x, mid.z)
    const o0 = off(j, 0.14, y), o1 = off(j + 1, 0.14, y), i0 = off(j, -0.12, y), i1 = off(j + 1, -0.12, y)
    const h = 0.42
    Q([[o0[0], y - 0.04, o0[2]], [o1[0], y - 0.04, o1[2]], [o1[0], y + h, o1[2]], [o0[0], y + h, o0[2]]], nrm(nx, nz), MB_WALL)
    Q([[i0[0], y + h, i0[2]], [i1[0], y + h, i1[2]], [o1[0], y + h, o1[2]], [o0[0], y + h, o0[2]]], up, MB_WALL)
    Q([[i1[0], y, i1[2]], [i0[0], y, i0[2]], [i0[0], y + h, i0[2]], [i1[0], y + h, i1[2]]], nrm(-nx, -nz), MB_WALL2)
    // the pipe rail, set in from the coping
    const r0 = off(j, -0.3, y + h), r1 = off(j + 1, -0.3, y + h)
    rail(r0, r1, nx, nz, y + h + 0.95, 0.07)
    rail(r0, r1, nx, nz, y + h + 0.5, 0.05)
    posts(r0, r1, y + h)
  }

  // ---- the balcony bands: slab, rail, wrapping the low part -------------------------------------------------------------
  const BD = 1.1, BT = 0.42
  const lowSeg = segs.map((s) => { const q = segMid(s); return !mbTall(q.x, q.z) })
  for (const k of [0, 1, 2]) {
    const y = G + k * S
    for (let j = 0; j < NS; j++) {
      if (!lowSeg[j]) continue
      const s = segs[j], { x: nx, z: nz } = nrmOf[j]
      if (foot(s.a.x, s.a.z) > y - 0.15 && foot(s.b.x, s.b.z) > y - 0.15) continue
      const a0 = off(j, 0, y), b0 = off(j + 1, 0, y), a1 = off(j, BD, y), b1 = off(j + 1, BD, y)
      const lo = (p: V3, yy: number): V3 => [p[0], yy, p[2]]
      Q([lo(a1, y - BT), lo(b1, y - BT), b1, a1], nrm(nx, nz), MB_WALL)
      Q([a0, b0, b1, a1], up, MB_WALL)
      Q([lo(a0, y - BT), lo(b0, y - BT), lo(b1, y - BT), lo(a1, y - BT)], down, MB_WALL2)
      const r0 = off(j, BD - 0.1, y), r1 = off(j + 1, BD - 0.1, y)
      rail(r0, r1, nx, nz, y + 0.95, 0.06)
      rail(r0, r1, nx, nz, y + 0.5, 0.045)
      posts(r0, r1, y)
      // the slab's end where the band stops against the tall block
      if (!lowSeg[(j + NS - 1) % NS]) Q([lo(a0, y - BT), lo(a1, y - BT), a1, a0], nrm(-nrmOf[j].z, nrmOf[j].x), MB_WALL)
      if (!lowSeg[(j + 1) % NS]) Q([lo(b1, y - BT), lo(b0, y - BT), b0, b1], nrm(nrmOf[j].z, -nrmOf[j].x), MB_WALL)
    }
  }

  // ---- windows ----------------------------------------------------------------------------------------------------------
  const winAt = (cx: number, cz: number, n: P2, y0: number, w: number, h: number, mull = true): void => {
    const t = { x: -n.z, z: n.x }
    const P = (u: number, y: number, pr: number): V3 => [cx + t.x * u + n.x * pr, y, cz + t.z * u + n.z * pr]
    const nn = nrm(n.x, n.z)
    Q([P(-w / 2 - 0.1, y0 - 0.1, 0.03), P(w / 2 + 0.1, y0 - 0.1, 0.03), P(w / 2 + 0.1, y0 + h + 0.1, 0.03), P(-w / 2 - 0.1, y0 + h + 0.1, 0.03)], nn, MB_FRAME)
    Q([P(-w / 2, y0, 0.06), P(w / 2, y0, 0.06), P(w / 2, y0 + h, 0.06), P(-w / 2, y0 + h, 0.06)], nn, MB_GLASS, GL)
    if (mull && w > 0.95) Q([P(-0.035, y0, 0.09), P(0.035, y0, 0.09), P(0.035, y0 + h, 0.09), P(-0.035, y0 + h, 0.09)], nn, MB_FRAME)
  }
  /** a window on design edge ei, s metres along it, on floor k above the pavement (negative: the garage floors) */
  const win = (ei: number, s: number, w: number, k: number, h = 1.45): void => {
    const e = E[ei]
    const cx = e.a.x + e.t.x * s, cz = e.a.z + e.t.z * s
    const y0 = G + k * S + 0.85
    if (y0 < 0.3 || y0 + h > roofAt(cx, cz) - 0.35) return
    if (y0 < gnd(cx + e.n.x * 0.4, cz + e.n.z * 0.4) + 0.25) return
    winAt(cx, cz, e.n, y0, w, h, ei !== 0 || w > 1.3)
  }
  const col = (ei: number, s: number, ks: number[], w = 1.1, h = 1.45): void => { for (const k of ks) win(ei, s, w, k, h) }
  const ALL = [-2, -1, 0, 1, 2, 3], LOW = [-2, -1, 0, 1, 2]
  // west (Montgomery): the top-floor ribbon runs over the entrance, single windows between the murals
  col(0, 7.2, [0, 1, 2])
  for (const s of [6.9, 9.3, 11.7, 14.1, 16.5]) win(0, s, 2.1, 3, 1.3)
  for (const s of [14.6, 16.2]) col(0, s, [0, 1, 2], 1.3)
  // south
  for (const s of [2.6, 5.4, 8.2, 11.0, 13.8]) col(1, s, ALL)
  for (const s of [18.6, 21.4]) col(1, s, LOW)
  col(2, 3.9, LOW)
  for (const s of [3.4, 5.8, 8.2]) col(3, s, LOW)
  col(4, 2.0, LOW, 1.0)
  // east face of the main block, with the glass-block stair strip
  for (const s of [2.4, 5.0]) col(6, s, LOW)
  // north: the low end, then the tall block either side of the jog, the woman mural between
  col(7, 4.0, LOW)
  for (const s of [7.0, 8.7]) col(7, s, ALL)
  col(9, 1.2, ALL, 0.8)
  col(9, 2.4, LOW, 0.8)
  win(9, 4.4, 1.1, 3)
  col(9, 6.9, [0, 1, 2], 1.5)
  // the faces the tall block shows above the low roofs: one ribbon floor
  for (const v of [-3.8, -1.0, 1.8, 4.6, 7.4]) winAt(-3.2, v, { x: 1, z: 0 }, RL + 0.85, 1.6, 1.3)
  winAt(-1.1, -5.5, { x: 0, z: 1 }, RL + 0.85, 1.6, 1.3)
  for (const v of [-7.4, -9.6, -11.8]) winAt(1.0, v, { x: 1, z: 0 }, RL + 0.85, 1.4, 1.3)

  const strip = (ei: number, s: number, w: number, y0: number, y1: number): void => {
    const e = E[ei], nn = nrm(e.n.x, e.n.z)
    const P = (u: number, y: number, pr: number): V3 => [e.a.x + e.t.x * (s + u) + e.n.x * pr, y, e.a.z + e.t.z * (s + u) + e.n.z * pr]
    Q([P(0, y0, 0.05), P(w, y0, 0.05), P(w, y1, 0.05), P(0, y1, 0.05)], nn, MB_BLOCK, GL)
    for (let k = 1; k < 6; k++) { const y = y0 + ((y1 - y0) * k) / 6; Q([P(0, y, 0.07), P(w, y, 0.07), P(w, y + 0.05, 0.07), P(0, y + 0.05, 0.07)], nn, MB_FRAME) }
    for (let k = 1; k < 2; k++) Q([P(w / 2 - 0.025, y0, 0.07), P(w / 2 + 0.025, y0, 0.07), P(w / 2 + 0.025, y1, 0.07), P(w / 2 - 0.025, y1, 0.07)], nn, MB_FRAME)
  }
  strip(6, 7.6, 0.9, G + 0.4, G + 3 * S - 0.5)
  strip(1, 16.1, 0.9, G + 0.4, G + 4 * S - 0.7)
  // the glass-block bay that turns the north-west corner on the top floor
  for (const s of segs) {
    if (!NW(s)) continue
    const { x: nx, z: nz, L } = nrmOf[segs.indexOf(s)]
    const n = nrm(nx, nz)
    const P = (p: P2, y: number): V3 => [p.x + nx * 0.05, y, p.z + nz * 0.05]
    Q([P(s.a, G + 3 * S + 0.55), P(s.b, G + 3 * S + 0.55), P(s.b, G + 3 * S + 2.5), P(s.a, G + 3 * S + 2.5)], n, MB_BLOCK, GL)
    for (let k = 1; k < 5; k++) { const y = G + 3 * S + 0.55 + (1.95 * k) / 5; Q([P(s.a, y), P(s.b, y), P(s.b, y + 0.04), P(s.a, y + 0.04)], n, MB_FRAME) }
    void L
  }

  // ---- the sgraffito murals: silver-grey panels with the figures in relief tones --------------------------------------
  const mural = (ei: number, s0: number, w: number, y0: number, h: number, kind: 'worker' | 'explorer' | 'woman'): void => {
    const e = E[ei], nn = nrm(e.n.x, e.n.z)
    const P = (u: number, y: number, pr: number): V3 => [e.a.x + e.t.x * (s0 + u) + e.n.x * pr, y, e.a.z + e.t.z * (s0 + u) + e.n.z * pr]
    const rect = (u0: number, u1: number, a: number, b: number, c: Rgb, pr = 0.06): void => Q([P(u0, y0 + a, pr), P(u1, y0 + a, pr), P(u1, y0 + b, pr), P(u0, y0 + b, pr)], nn, c)
    const poly = (pts: [number, number][], c: Rgb, pr = 0.07): void => {
      for (let i = 1; i + 1 < pts.length; i += 2) {
        const q = pts[Math.min(i + 2, pts.length - 1)]
        Q([P(pts[0][0], y0 + pts[0][1], pr), P(pts[i][0], y0 + pts[i][1], pr), P(pts[i + 1][0], y0 + pts[i + 1][1], pr), P(q[0], y0 + q[1], pr)], nn, c)
      }
    }
    const disc = (cx: number, cy: number, r: number, c: Rgb, pr = 0.07): void => {
      const pts: [number, number][] = []
      for (let k = 0; k < 8; k++) pts.push([cx + r * Math.cos((k / 8) * Math.PI * 2), cy + r * Math.sin((k / 8) * Math.PI * 2)])
      poly(pts, c, pr)
    }
    const D = MB_MURAL_D, Lt = MB_MURAL_L
    rect(0, w, 0, h, MB_MURAL, 0.04)
    if (kind === 'worker') {
      for (const y of [0.9, 1.4, 1.9]) rect(0, w, y, y + 0.14, Lt)
      rect(0, w, 2.3, 2.55, D)
      rect(0.7, 0.85, 2.3, 3.9, D); rect(2.3, 2.45, 2.3, 3.9, D)
      rect(1.2, 1.6, 2.7, 6.2, D, 0.08); rect(1.7, 2.1, 2.7, 6.2, D, 0.08)
      poly([[1.1, 6.2], [2.2, 6.2], [2.35, 8.9], [0.95, 8.9]], D, 0.08)
      disc(1.65, 9.5, 0.38, D, 0.08)
      disc(0.7, 7.4, 0.7, D, 0.08); disc(0.7, 7.4, 0.55, Lt, 0.09)
      poly([[0.95, 8.3], [1.15, 8.75], [0.55, 7.95], [0.45, 7.6]], D, 0.09)
      rect(0, w, h - 0.8, h - 0.65, Lt)
    } else if (kind === 'explorer') {
      for (const y of [0.4, 0.7]) rect(0, w, y, y + 0.1, Lt)
      poly([[0.8, 0.9], [2.4, 0.9], [2.2, 1.6], [1.0, 1.6]], D)
      rect(1.55, 1.62, 1.6, 3.4, D); poly([[1.0, 1.8], [1.5, 1.8], [1.5, 3.3], [1.0, 2.9]], Lt, 0.08); poly([[1.7, 1.8], [2.3, 1.8], [2.3, 2.9], [1.7, 3.3]], Lt, 0.08)
      disc(1.9, 4.7, 0.95, D); disc(1.9, 4.7, 0.8, Lt, 0.08)
      poly([[1.9, 4.0], [2.05, 4.7], [1.9, 5.4], [1.75, 4.7]], D, 0.09); poly([[1.2, 4.7], [1.9, 4.55], [2.6, 4.7], [1.9, 4.85]], D, 0.09)
      rect(0.9, 1.3, 5.8, 8.0, D, 0.08); rect(1.4, 1.8, 5.8, 8.0, D, 0.08)
      poly([[0.85, 8.0], [1.85, 8.0], [2.0, 9.6], [0.7, 9.6]], D, 0.08)
      poly([[1.85, 8.1], [2.7, 6.9], [2.8, 9.2], [2.0, 9.6]], D, 0.08)
      disc(1.35, 10.1, 0.38, D, 0.08)
      poly([[0.7, 9.4], [0.85, 9.6], [0.2, 10.7], [0.05, 10.55]], D, 0.09)
      rect(0.15, 0.7, 5.8, 6.9, D, 0.08)
    } else {
      rect(0, w, 0.3, 0.42, Lt); rect(0, w, 0.7, 0.8, Lt)
      disc(w / 2, h - 2.2, 0.95, MB_BLUE); disc(w / 2, h - 2.2, 0.78, MB_MURAL, 0.08)
      rect(0, w, h - 0.5, h - 0.32, MB_BLUE); rect(0.15, w - 0.15, h - 0.9, h - 0.76, MB_BLUE)
      poly([[0.75, 1.2], [1.45, 1.2], [1.8, 5.2], [0.4, 5.2]], D, 0.08)
      disc(1.1, 5.6, 0.28, D, 0.08)
      poly([[1.35, 3.0], [2.05, 3.0], [2.05, 4.3], [1.35, 4.3]], Lt, 0.09)
    }
  }
  mural(0, 2.4, 3.1, G + 0.5, 3 * S + 1.7, 'worker')
  mural(0, 18.0, 3.0, G + 0.5, 3 * S + 1.7, 'explorer')
  mural(9, 3.4, 2.0, G + 0.9, 3 * S - 0.5, 'woman')

  // ---- the stair tower, chimney, vents --------------------------------------------------------------------------------------
  box(m, -13.1, R + 1.9, -1.7, 1.9, 1.9, 2.3, MB_WALL, ST)
  box(m, -13.1, R + 3.92, -1.7, 2.1, 0.12, 2.5, MB_WALL2, ST)
  box(m, -13.1, R + 4.1, -1.7, 1.2, 0.07, 1.6, MB_WALL, ST)
  Q([[-15.0 - 0.03, R + 0.9, -0.5], [-15.0 - 0.03, R + 0.9, -2.9], [-15.0 - 0.03, R + 3.0, -2.9], [-15.0 - 0.03, R + 3.0, -0.5]], nrm(-1, 0), MB_GLASS, GL)
  Q([[-11.2 + 0.03, R + 0.9, -2.9], [-11.2 + 0.03, R + 0.9, -0.5], [-11.2 + 0.03, R + 3.0, -0.5], [-11.2 + 0.03, R + 3.0, -2.9]], nrm(1, 0), MB_GLASS, GL)
  prism(m, -9.0, 4.0, R + 0.4, R + 2.1, 0.28, 8, MB_WALL2, ST)
  prism(m, -9.0, 4.0, R + 2.1, R + 2.3, 0.42, 8, MB_WALL, ST)

  if (place) emanuElCopy(out, m, place.c, place.s, place.tx, place.tz)
  else emanuElCopy(out, m, 1, 0, 0, 0)
}

// ---------------------------------------------------------------------------------------------------------------
// Fugazi Bank Building
// ---------------------------------------------------------------------------------------------------------------

/**
 * OSM way/32946083's eight distinct vertices (docs/shots/refs/notable/fugazi-bank/EVIDENCE.md) in OSM's own local frame
 * (x east, z north, metres), anticlockwise: the NW back corner, the long south-west edge down Columbus Avenue to the
 * prow's first vertex, the OSM prow (four short facets round the south end), then the long east edge up Montgomery
 * Street and the 33 m back wall on the neighbours. This is the model's DESIGN frame; `fgPlace` carries it onto `fit.ring`.
 */
const FG_PLAN: P2[] = [[-28.2, 19.3], [6.0, -10.3], [7.5, -11.3], [8.7, -11.7], [9.7, -11.2], [10.2, -10.2], [10.2, -8.8], [4.3, 24.8]]
  .map(([x, z]) => ({ x, z }))
/** Radius of the prow's round (m) and the number of facets it is drawn with. */
const FG_R = 2.0, FG_N = 12
/** Heights: plinth, ground storey, second storey, main cornice, third storey, upper cornice, roof (balustrade on top). */
const FG_YB = 1.2, FG_Y1 = 6.0, FG_Y2 = 10.6, FG_YC = 11.9, FG_Y3 = 14.6, FG_YR = 15.6, FG_YT = 16.8

const FG_WALL: Rgb = [0.925, 0.905, 0.862]     // #ece7dc, the white glazed terra cotta
const FG_TRIM: Rgb = [0.885, 0.862, 0.81]
const FG_DEEP: Rgb = [0.74, 0.715, 0.665]      // arch reveals, the shadow of a cornice
const FG_BASE: Rgb = [0.82, 0.80, 0.755]       // the rusticated base
const FG_GLASS: Rgb = [0.13, 0.15, 0.18]
const FG_FRAME: Rgb = [0.15, 0.14, 0.13]
const FG_BRONZE: Rgb = [0.2, 0.15, 0.1]
const FG_COL: Rgb = [0.08, 0.08, 0.09]         // the polished dark columns of the entrance
const FG_GOLD: Rgb = [0.5, 0.4, 0.2]           // brass: lettering, capitals, the medallions
const FG_ROOF: Rgb = [0.6, 0.58, 0.55]
const FG_MT = surfaceTag('metal')
const FG_CN = surfaceTag('concrete')

/** The rotation + translation carrying FG_PLAN's frame onto `ring` (as `mbPlace`: Procrustes, else long edges). */
function fgPlace(ring: P2[] | undefined): { c: number; s: number; tx: number; tz: number; res: number } | null {
  type T = { c: number; s: number; tx: number; tz: number; res: number }
  if (!ring || ring.length < 4) return null
  let R = ring
  const n = FG_PLAN.length
  if (R.length === n + 1 && Math.hypot(R[0].x - R[n].x, R[0].z - R[n].z) < 0.3) R = R.slice(0, n)
  let best: T | null = null
  if (R.length === n) {
    const cb = { x: R.reduce((t, p) => t + p.x, 0) / n, z: R.reduce((t, p) => t + p.z, 0) / n }
    const ca = { x: FG_PLAN.reduce((t, p) => t + p.x, 0) / n, z: FG_PLAN.reduce((t, p) => t + p.z, 0) / n }
    for (const rev of [false, true]) {
      const Q = rev ? [...FG_PLAN].reverse() : FG_PLAN
      for (let o = 0; o < n; o++) {
        let sn = 0, cs = 0
        for (let i = 0; i < n; i++) {
          const a = Q[(i + o) % n]
          const ax = a.x - ca.x, az = a.z - ca.z, bx = R[i].x - cb.x, bz = R[i].z - cb.z
          cs += ax * bx + az * bz
          sn += ax * bz - az * bx
        }
        const th = Math.atan2(sn, cs), c = Math.cos(th), s = Math.sin(th)
        let e = 0
        for (let i = 0; i < n; i++) {
          const a = Q[(i + o) % n]
          const x = (a.x - ca.x) * c - (a.z - ca.z) * s + cb.x, z = (a.x - ca.x) * s + (a.z - ca.z) * c + cb.z
          e += (x - R[i].x) ** 2 + (z - R[i].z) ** 2
        }
        const res = Math.sqrt(e / n)
        if (!best || res < best.res) best = { c, s, tx: cb.x - (ca.x * c - ca.z * s), tz: cb.z - (ca.x * s + ca.z * c), res }
      }
    }
    if (best && best.res <= 2.5) return best
  }
  const ca = emanuElCentroid(FG_PLAN), cb = emanuElCentroid(R)
  const edges = (r: P2[]): { L: number; a: number }[] => r.map((p, i) => {
    const q = r[(i + 1) % r.length]
    return { L: Math.hypot(q.x - p.x, q.z - p.z), a: Math.atan2(q.z - p.z, q.x - p.x) }
  })
  best = null
  for (const a of edges(FG_PLAN).filter((e) => e.L > 15)) {
    for (const b of edges(R).filter((e) => e.L > 15)) {
      if (Math.abs(a.L - b.L) > 0.2 * a.L) continue
      const th = b.a - a.a, c = Math.cos(th), s = Math.sin(th)
      const tx = cb.x - (ca.x * c - ca.z * s), tz = cb.z - (ca.x * s + ca.z * c)
      const T = FG_PLAN.map((p) => ({ x: p.x * c - p.z * s + tx, z: p.x * s + p.z * c + tz }))
      let e = 0
      for (const v of R) {
        let d = Infinity
        for (let i = 0; i < T.length; i++) {
          const p = T[i], q = T[(i + 1) % T.length]
          const dx = q.x - p.x, dz = q.z - p.z
          const u = Math.max(0, Math.min(1, ((v.x - p.x) * dx + (v.z - p.z) * dz) / (dx * dx + dz * dz || 1)))
          d = Math.min(d, Math.hypot(v.x - p.x - dx * u, v.z - p.z - dz * u))
        }
        e += d * d
      }
      const res = Math.sqrt(e / R.length)
      if (!best || res < best.res) best = { c, s, tx, tz, res }
    }
  }
  return best && best.res <= 2.5 ? best : null
}

/**
 * The wedge's outline with a true round at the sharp end. The prow is found from the plan itself: the two long edges
 * (vertex 0 to 1 along Columbus, vertex 6 to 7 along Montgomery) are extended to meet at the apex of the flatiron (a 39
 * degree angle, 4.5 m past the OSM prow's tip); the vertex with the smallest interior angle is that apex, and the prow is
 * the circle of radius FG_R tangent to both edges, drawn as FG_N facets (OSM's own prow is four flats round the same
 * point). Returns the outline (anticlockwise: P0, the arc T1..T2, P7), the circle's centre and the arc's mid angle/sweep.
 */
function fgOutline(): { pts: P2[]; c: P2; tip: number; sweep: number } {
  const P = FG_PLAN
  const nz = (x: number, z: number): P2 => { const l = Math.hypot(x, z); return { x: x / l, z: z / l } }
  const d1 = nz(P[1].x - P[0].x, P[1].z - P[0].z), d2 = nz(P[7].x - P[6].x, P[7].z - P[6].z)
  const det = -d1.x * d2.z + d1.z * d2.x
  const t = (-(P[6].x - P[1].x) * d2.z + (P[6].z - P[1].z) * d2.x) / det
  const A = { x: P[1].x + t * d1.x, z: P[1].z + t * d1.z }
  const b = nz(-d1.x + d2.x, -d1.z + d2.z)
  const h = Math.acos(-d1.x * d2.x - d1.z * d2.z) / 2
  const k = FG_R / Math.sin(h), td = FG_R / Math.tan(h)
  const c = { x: A.x + b.x * k, z: A.z + b.z * k }
  const T1 = { x: A.x - d1.x * td, z: A.z - d1.z * td }, T2 = { x: A.x + d2.x * td, z: A.z + d2.z * td }
  const a1 = Math.atan2(T1.z - c.z, T1.x - c.x), a2 = Math.atan2(T2.z - c.z, T2.x - c.x)
  const tip = Math.atan2(-b.z, -b.x)
  let sweep = (a2 - a1 + 4 * Math.PI) % (2 * Math.PI)
  const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a))
  if (Math.abs(wrap(a1 + sweep / 2 - tip)) > 1) sweep -= 2 * Math.PI
  const pts: P2[] = [P[0]]
  for (let i = 0; i <= FG_N; i++) {
    const a = a1 + (sweep * i) / FG_N
    pts.push({ x: c.x + FG_R * Math.cos(a), z: c.z + FG_R * Math.sin(a) })
  }
  pts.push(P[7])
  return { pts, c, tip, sweep }
}

/**
 * The Fugazi Bank Building (Banca Popolare Operaia Italiana, 1909, Charles Peter Paff; 4 Columbus Avenue, later the first
 * Transamerica headquarters): a WHITE glazed terra-cotta flatiron between Columbus Avenue and Montgomery Street, its
 * sharp end rounded into a curved prow. NOT Club Fugazi (Green Street). Photographs: docs/shots/refs/notable/fugazi-bank/
 * wiki-image (the prow: a round tower, three storeys, the entrance in dark polished columns at its foot, a cross
 * medallion over it, bracketed cornice, two paired bay windows a floor with iron balconettes, a heavy corbelled cornice,
 * smaller windows above, a flagpole), mapillary-1 (the Columbus side: a rusticated base, tall ROUND-ARCHED ground
 * windows between piers, tall square windows with ornate brackets and balconettes on floor 2, a heavy dentilled cornice,
 * small windows in the attic storey, a second cornice and a balustrade), mapillary-0 (the same side running up Columbus
 * under the Pyramid). mapillary-2/3/4 are the neighbours' walls and not used.
 *
 * Plan: OSM way/32946083 in its own frame (FG_PLAN), carried onto `fit.ring` by `fgPlace`; the sharp end is re-drawn as
 * a true round (`fgOutline`). The back wall (33 m, on the neighbours) is plain. Storeys, from the photographs over the
 * numbers: plinth to 1.2, ground storey (arches) to 6.0, string course, second storey to 10.6, the heavy cornice
 * to 11.9, the attic storey to 14.6, upper cornice to 15.6 (LiDAR median 15.9 m), balustrade to 16.8. The assessor's
 * "four storeys" counts a mezzanine; OSM's "2 levels" is out of date (the third storey was added; the cupola is gone).
 */
function fugaziBank_4_Columbus(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const place = fgPlace(fit.ring)
  const { pts, c, tip } = fgOutline()
  const NS = pts.length, up: V3 = [0, 1, 0], down: V3 = [0, -1, 0]
  const nrm = (x: number, z: number): V3 => [x, 0, z]
  const Q = (p: V3[], n: V3, col: Rgb, tag = TC): void => m.quad(p, n, uv, col, tag)
  type Seg = { a: P2; b: P2; L: number; t: P2; n: P2 }
  const segs: Seg[] = pts.map((a, i) => {
    const b = pts[(i + 1) % NS]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const t = { x: (b.x - a.x) / L, z: (b.z - a.z) / L }
    return { a, b, L, t, n: { x: t.z, z: -t.x } }
  })
  const COL = 0, MONT = FG_N + 1, BACK = NS - 1
  const isArc = (j: number): boolean => j >= 1 && j <= FG_N
  /** vertex i of the outline pushed d outward along the mitre of the two walls that meet there */
  const off = (i: number, d: number, y: number): V3 => {
    const j = i % NS, k = (j + NS - 1) % NS
    const n1 = segs[k].n, n2 = segs[j].n
    const den = 1 + n1.x * n2.x + n1.z * n2.z
    return [segs[j].a.x + ((n1.x + n2.x) / den) * d, y, segs[j].a.z + ((n1.z + n2.z) / den) * d]
  }
  /** a course round the building (not on the party wall unless `bk`): outer face at d, top and soffit; din starts the top inside */
  const band = (y0: number, y1: number, d: number, col: Rgb, bk = false, din = 0, tag = TC): void => {
    for (let j = 0; j < NS; j++) {
      if (j === BACK && !bk) continue
      const n = nrm(segs[j].n.x, segs[j].n.z)
      Q([off(j, d, y0), off(j + 1, d, y0), off(j + 1, d, y1), off(j, d, y1)], n, col, tag)
      Q([off(j, din, y1), off(j + 1, din, y1), off(j + 1, d, y1), off(j, d, y1)], up, col, tag)
      if (d > 0.2) Q([off(j, 0, y0), off(j + 1, 0, y0), off(j + 1, d, y0), off(j, d, y0)], down, FG_DEEP, tag)
    }
  }
  /** dark slits (dentils / balusters' gaps) every `sp` m along a wall at offset d */
  const slits = (j: number, y0: number, y1: number, d: number, sp: number, w: number, col: Rgb): void => {
    const s = segs[j]
    const k = Math.max(1, Math.floor(s.L / sp))
    for (let i = 0; i < k; i++) {
      const u = (s.L * (i + 0.5)) / k
      const P = (uu: number, y: number): V3 => [s.a.x + s.t.x * uu + s.n.x * d, y, s.a.z + s.t.z * uu + s.n.z * d]
      Q([P(u - w / 2, y0), P(u + w / 2, y0), P(u + w / 2, y1), P(u - w / 2, y1)], nrm(s.n.x, s.n.z), col)
    }
  }
  /** a block on wall j from u0 to u1, standing d proud, y0 to y1 */
  const slab = (j: number, u0: number, u1: number, d: number, y0: number, y1: number, col: Rgb, tag = TC): void => {
    const s = segs[j]
    const P = (u: number, dd: number, y: number): V3 => [s.a.x + s.t.x * u + s.n.x * dd, y, s.a.z + s.t.z * u + s.n.z * dd]
    Q([P(u0, d, y0), P(u1, d, y0), P(u1, d, y1), P(u0, d, y1)], nrm(s.n.x, s.n.z), col, tag)
    Q([P(u0, 0, y1), P(u1, 0, y1), P(u1, d, y1), P(u0, d, y1)], up, col, tag)
    Q([P(u0, 0, y0), P(u0, d, y0), P(u0, d, y1), P(u0, 0, y1)], nrm(-s.t.x, -s.t.z), col, tag)
    Q([P(u1, d, y0), P(u1, 0, y0), P(u1, 0, y1), P(u1, d, y1)], nrm(s.t.x, s.t.z), col, tag)
  }
  /** an opening painted on wall j at u: a rectangle or (rise > 0) a round-headed one */
  const opening = (j: number, u: number, y0: number, spring: number, halfW: number, rise: number, col: Rgb, tag: number, proud: number, seg = 8): void => {
    const s = segs[j]
    emOpening(m, s.a.x + s.t.x * u, s.a.z + s.t.z * u, s.t.x, s.t.z, s.n.x, s.n.z, y0, spring, halfW, rise, col, tag, proud, seg)
  }

  // ---- the walls: one face per segment from the ground to the roof, the plinth and its courses, the string course -------
  for (let j = 0; j < NS; j++) {
    Q([off(j, 0, 0), off(j + 1, 0, 0), off(j + 1, 0, FG_YR), off(j, 0, FG_YR)], nrm(segs[j].n.x, segs[j].n.z), FG_WALL)
  }
  band(0, FG_YB, 0.12, FG_BASE)
  for (const y of [0.4, 0.8]) band(y, y + 0.04, 0.135, FG_DEEP)
  band(FG_Y1, FG_Y1 + 0.5, 0.3, FG_TRIM)
  // the heavy cornice (a corbel table with dark slits under a deep, flat-topped course) and the upper one
  band(FG_Y2, FG_Y2 + 0.4, 0.5, FG_TRIM)
  band(FG_Y2 + 0.4, FG_YC, 0.9, FG_TRIM)
  band(FG_Y3, FG_Y3 + 0.4, 0.28, FG_TRIM)
  band(FG_Y3 + 0.4, FG_YR, 0.5, FG_TRIM)
  for (let j = 0; j < NS; j++) {
    if (j === BACK || (isArc(j) && j % 2 === 0)) continue
    slits(j, FG_Y2 + 0.04, FG_Y2 + 0.36, 0.52, 0.7, 0.2, FG_DEEP)
    slits(j, FG_Y3 + 0.04, FG_Y3 + 0.36, 0.3, 0.7, 0.2, FG_DEEP)
  }

  // ---- the balustrade: plinth, pale balusters with dark gaps, a top rail, a plain inner face -----------------------------
  band(FG_YR, FG_YR + 0.35, 0.34, FG_TRIM, true)
  for (let j = 0; j < NS; j++) {
    const s = segs[j], n = nrm(s.n.x, s.n.z)
    Q([off(j, 0.2, FG_YR + 0.35), off(j + 1, 0.2, FG_YR + 0.35), off(j + 1, 0.2, FG_YT - 0.25), off(j, 0.2, FG_YT - 0.25)], n, FG_BASE)
    Q([off(j + 1, -0.15, FG_YR), off(j, -0.15, FG_YR), off(j, -0.15, FG_YT), off(j + 1, -0.15, FG_YT)], nrm(-s.n.x, -s.n.z), FG_TRIM)
    if (!isArc(j) || j % 2 === 1) slits(j, FG_YR + 0.4, FG_YT - 0.3, 0.215, isArc(j) ? 0.5 : 0.46, 0.17, FG_FRAME)
  }
  band(FG_YT - 0.25, FG_YT, 0.36, FG_TRIM, true, -0.15)

  // ---- the roof ---------------------------------------------------------------------------------------------------------
  capPolygonWithHoles(m, [pts], FG_YR, FG_ROOF, FG_CN)

  // ---- the long sides: bays of arched ground windows, bracketed windows above, piers between -----------------------------
  const bays = (j: number, u0: number, u1: number): void => {
    const s = segs[j]
    const k = Math.max(1, Math.round((u1 - u0) / 4.4)), pitch = (u1 - u0) / k
    for (let i = 0; i <= k; i++) {
      const u = u0 + pitch * i
      // the pier: rusticated up the ground storey, a plain pilaster above, a capital under the cornice
      slab(j, u - 0.55, u + 0.55, 0.22, FG_YB, FG_Y2 - 0.7, FG_WALL)
      slab(j, u - 0.7, u + 0.7, 0.36, FG_Y2 - 0.7, FG_Y2, FG_TRIM)
      for (let y = FG_YB + 0.75; y < FG_Y1 - 0.1; y += 0.75) {
        const P = (uu: number): V3 => [s.a.x + s.t.x * uu + s.n.x * 0.235, y, s.a.z + s.t.z * uu + s.n.z * 0.235]
        const Pu = (uu: number): V3 => [P(uu)[0], y + 0.04, P(uu)[2]]
        Q([P(u - 0.55), P(u + 0.55), Pu(u + 0.55), Pu(u - 0.55)], nrm(s.n.x, s.n.z), FG_DEEP)
      }
      slab(j, u - 0.28, u + 0.28, 0.5, FG_YR + 0.35, FG_YT - 0.05, FG_TRIM)
      if (i === k) continue
      const uc = u + pitch / 2
      // ground storey: the round-arched window in its reveal, a transom and a mullion, a keystone
      opening(j, uc, FG_YB + 0.1, 4.1, 1.42, 1.42, FG_DEEP, TC, 0.05)
      opening(j, uc, FG_YB + 0.4, 4.1, 1.15, 1.15, FG_GLASS, GL, 0.1)
      opening(j, uc, 3.35, 3.47, 1.15, 0, FG_FRAME, TC, 0.13)
      opening(j, uc, FG_YB + 0.4, 3.35, 0.035, 0, FG_FRAME, TC, 0.13)
      opening(j, uc, 5.1, 5.85, 0.17, 0, FG_TRIM, TC, 0.09)
      // second storey: a tall window in a surround, an iron balconette, bracketed sill, hood
      slab(j, uc - 0.85, uc + 0.85, 0.26, 6.6, 7.2, FG_TRIM)
      opening(j, uc, 7.2, 10.3, 0.98, 0, FG_TRIM, TC, 0.06)
      opening(j, uc, 7.4, 10.05, 0.74, 0, FG_GLASS, GL, 0.1)
      opening(j, uc, 7.4, 10.05, 0.03, 0, FG_FRAME, TC, 0.12)
      slab(j, uc - 0.95, uc + 0.95, 0.3, 7.35, 7.95, FG_FRAME, FG_MT)
      slab(j, uc - 1.05, uc + 1.05, 0.3, 10.25, 10.5, FG_TRIM)
      // attic storey: a small window in a surround
      opening(j, uc, 12.4, 14.3, 0.7, 0, FG_TRIM, TC, 0.06)
      opening(j, uc, 12.6, 14.1, 0.5, 0, FG_GLASS, GL, 0.1)
      slab(j, uc - 0.8, uc + 0.8, 0.2, 14.3, 14.45, FG_TRIM)
    }
  }
  bays(COL, 1.0, segs[COL].L - 0.9)
  bays(MONT, 0.9, segs[MONT].L - 1.0)

  // ---- the prow: the round tower with its portal, medallions, paired bay windows ---------------------------------------
  const AP = (phi: number, rr: number, y: number): V3 => [c.x + Math.cos(tip + phi) * rr, y, c.z + Math.sin(tip + phi) * rr]
  const dg = (phi: number): V3 => nrm(Math.cos(tip + phi), Math.sin(tip + phi))
  const arcRect = (p0: number, p1: number, rr: number, y0: number, y1: number, col: Rgb, tag = TC): void => {
    const k = Math.max(1, Math.ceil(Math.abs(p1 - p0) / 0.11))
    for (let i = 0; i < k; i++) {
      const a = p0 + ((p1 - p0) * i) / k, b = p0 + ((p1 - p0) * (i + 1)) / k
      Q([AP(a, rr, y0), AP(b, rr, y0), AP(b, rr, y1), AP(a, rr, y1)], dg((a + b) / 2), col, tag)
    }
  }
  const arcBand = (p0: number, p1: number, d: number, y0: number, y1: number, col: Rgb, tag = TC): void => {
    const k = Math.max(1, Math.ceil(Math.abs(p1 - p0) / 0.11))
    for (let i = 0; i < k; i++) {
      const a = p0 + ((p1 - p0) * i) / k, b = p0 + ((p1 - p0) * (i + 1)) / k
      Q([AP(a, FG_R + d, y0), AP(b, FG_R + d, y0), AP(b, FG_R + d, y1), AP(a, FG_R + d, y1)], dg((a + b) / 2), col, tag)
      Q([AP(a, FG_R, y1), AP(b, FG_R, y1), AP(b, FG_R + d, y1), AP(a, FG_R + d, y1)], up, col, tag)
      if (d > 0.2) Q([AP(a, FG_R, y0), AP(b, FG_R, y0), AP(b, FG_R + d, y0), AP(a, FG_R + d, y0)], down, FG_DEEP, tag)
    }
  }
  const D = Math.PI / 180
  // the portal: dark bronze doors, glazed, between four dark polished columns carrying a lintel with lettering
  arcRect(-30 * D, 30 * D, FG_R + 0.05, 0.3, 4.4, FG_BRONZE)
  arcRect(-20 * D, -4 * D, FG_R + 0.09, 0.9, 3.7, FG_GLASS, GL)
  arcRect(4 * D, 20 * D, FG_R + 0.09, 0.9, 3.7, FG_GLASS, GL)
  arcRect(-24 * D, 24 * D, FG_R + 0.09, 3.8, 4.35, FG_GLASS, GL)
  for (const ph of [-40, -14, 14, 40]) {
    const x = AP(ph * D, FG_R + 0.85, 0)
    prism(m, x[0], x[2], 0.3, 4.5, 0.27, 8, FG_COL, FG_MT)
    prism(m, x[0], x[2], 0.3, 0.55, 0.36, 8, FG_TRIM, TC)
    prism(m, x[0], x[2], 4.2, 4.5, 0.36, 8, FG_GOLD, FG_MT)
  }
  arcBand(-52 * D, 52 * D, 1.15, 4.5, 5.25, FG_TRIM)
  arcRect(-40 * D, 40 * D, FG_R + 1.17, 4.75, 4.98, FG_GOLD, FG_MT)
  // the cross medallion over the portal and a plaque either side
  for (const [ph, r] of [[0, 0.3], [-27, 0.2], [27, 0.2]] as [number, number][]) {
    const O = AP(ph * D, FG_R + 0.06, 5.62), tg = [-Math.sin(tip + ph * D), Math.cos(tip + ph * D)]
    const ring: V3[] = []
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      ring.push([O[0] + tg[0] * r * Math.cos(a), O[1] + r * Math.sin(a), O[2] + tg[1] * r * Math.cos(a)])
    }
    for (let k = 0; k < 8; k += 2) Q([O, ring[k], ring[k + 1], ring[(k + 2) % 8]], dg(ph * D), FG_GOLD, FG_MT)
  }
  // the pilaster-like side bays of the prow's ground storey: a narrow dark window each side
  for (const ph of [-56, 56]) {
    arcRect((ph - 5) * D, (ph + 5) * D, FG_R + 0.06, 1.6, 4.4, FG_DEEP)
    arcRect((ph - 3.5) * D, (ph + 3.5) * D, FG_R + 0.1, 1.9, 4.2, FG_GLASS, GL)
  }
  // floors 2 and 3: two windows either side of the centre pier, and one each side near the flanks
  for (const ph of [-21, 21, -50, 50]) {
    const w = 10.5
    arcBand((ph - w - 3) * D, (ph + w + 3) * D, 0.2, 6.6, 7.2, FG_TRIM)
    arcRect((ph - w - 2) * D, (ph + w + 2) * D, FG_R + 0.06, 7.2, 10.3, FG_TRIM)
    arcRect((ph - w) * D, (ph + w) * D, FG_R + 0.1, 7.4, 10.05, FG_GLASS, GL)
    arcBand((ph - w - 1) * D, (ph + w + 1) * D, 0.3, 7.35, 7.95, FG_FRAME, FG_MT)
    arcRect((ph - w + 1) * D, (ph + w - 1) * D, FG_R + 0.06, 12.4, 14.3, FG_TRIM)
    arcRect((ph - w + 3) * D, (ph + w - 3) * D, FG_R + 0.1, 12.6, 14.1, FG_GLASS, GL)
  }
  // the flagpole on the prow
  prism(m, c.x, c.z, FG_YR, FG_YT + 7.5, 0.05, 4, [0.8, 0.8, 0.8], FG_MT)
  prism(m, c.x, c.z, FG_YT + 7.5, FG_YT + 7.7, 0.1, 6, FG_GOLD, FG_MT)

  if (place) emanuElCopy(out, m, place.c, place.s, place.tx, place.tz)
  else emanuElCopy(out, m, 1, 0, 0, 0)
}

// ---------------------------------------------------------------------------------------------------------------
// Pacific Exchange, 301 Pine Street
// ---------------------------------------------------------------------------------------------------------------

const PX_STONE: Rgb = [0.725, 0.722, 0.698]    // #b9b8b2, the Yosemite granite
const PX_LIGHT: Rgb = [0.784, 0.776, 0.749]    // #c8c6bf, the sculptures a shade lighter
const PX_LINE: Rgb = [0.62, 0.615, 0.6]        // the courses between the blocks
const PX_DEEP: Rgb = [0.5, 0.495, 0.485]       // the recess behind the columns
const PX_GLASS: Rgb = [0.12, 0.13, 0.15]
const PX_ROOF: Rgb = [0.5, 0.5, 0.52]
const PX_FRONT_Z = -1                          // the fit's front is local -z (fitFront: -z faces the manifest bearing; grade is measured at (0, -hz))
const PX_GR = surfaceTag('granite')
const PX_CN = surfaceTag('concrete')

/**
 * The Pacific Exchange (the Pacific Coast Stock Exchange), 301 Pine Street at Sansome: the 1915 U.S. Treasury
 * subtreasury (Milton Dyer) remodelled in 1930 by Miller & Pflueger, with Ralph Stackpole's two granite groups.
 * ONLY the low granite temple, not the 1930 Stock Exchange Tower behind it (155 Sansome, its own model).
 * Photographs: docs/shots/refs/notable/pacific-exchange/ — wiki-image (the Pine front: ten giant unfluted columns
 * in a deep recess between two plain end pylons, a plain entablature and attic over them, wide steps, a Stackpole
 * group against each pylon), mapillary-0 (the colonnade from up Pine), -3 (a group close up), -1 (the Sansome wall).
 * mapillary-2 is the tower's door and is ignored.
 *
 * OSM's outline is a 40 x 25 m parallelogram with Pine Street on its NORTH long side (the tower, Mills Tower and Bush
 * Street are all south of it; the pack's "south" is wrong, and the photographs agree: Sansome's wall is on the right of
 * the Pine front). The manifest gives front 351.4 (Pine's outward bearing), so the fit's FRONT (local -z, the ring edge
 * whose outward normal faces -z) is Pine; nothing depends on the ring's vertex order. Everything is built on that edge.
 *
 * Where the photographs overruled the numbers: the columns are ~1.4 m through the shaft (the pack says ~1 m; against a
 * 1.75 m passer-by they are one-seventh of their height), the groups are ~4.7 m tall, standing on a low step against the
 * pylons (not "tall plinths"), and the recess is deep (mapillary-0 shows a second dark rank of openings behind).
 */
function pacificExchange_301_Pine(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  const n = ring.length
  const len = (i: number): number => Math.hypot(ring[(i + 1) % n].x - ring[i].x, ring[(i + 1) % n].z - ring[i].z)
  // the Pine edge is the fit's FRONT (the manifest says front 351.4, Pine's outward bearing): the ring edge whose
  // outward normal best faces PX_FRONT_Z in the fit frame (edgeFacing's rule), never OSM's vertex order
  const pi = ((): number => {
    let best = 0, sc = -Infinity
    for (let i = 0; i < n; i++) {
      const a = ring[i], b = ring[(i + 1) % n], l = len(i) || 1
      const s = ((-(b.x - a.x)) / l) * PX_FRONT_Z + l * 0.002
      if (s > sc) { sc = s; best = i }
    }
    return best
  })()
  const A = ring[pi], B = ring[(pi + 1) % n]
  const L = len(pi)
  const t = { x: (B.x - A.x) / L, z: (B.z - A.z) / L }       // along the front, to the WEST (Pine runs east to west here)
  const N = { x: t.z, z: -t.x }                               // out of the building, over the street
  const head = Math.atan2(N.x, N.z)
  const Mx = (A.x + B.x) / 2, Mz = (A.z + B.z) / 2
  const EL = L / 2
  /** (e, v, y): e east along the front from its middle, v out of the building from the front plane, y up */
  const W = (e: number, v: number, y: number): V3 => [Mx - t.x * e + N.x * v, y, Mz - t.z * e + N.z * v]
  const gAt = (e: number, v: number): number => {
    const g = fit.groundAt
    if (!g) return fit.grade ?? 0
    const p = W(e, v, 0)
    return Math.max(0, g(p[0], p[2]))
  }
  /** a box by its extents in the front frame (e0..e1 east, v0..v1 out, y0..y1) */
  const bx = (e0: number, e1: number, v0: number, v1: number, y0: number, y1: number, c: Rgb, tag = PX_GR): void => {
    const p = W((e0 + e1) / 2, (v0 + v1) / 2, (y0 + y1) / 2)
    boxAlong(m, p[0], p[1], p[2], (e1 - e0) / 2, (y1 - y0) / 2, (v1 - v0) / 2, head, c, tag)
  }
  /** a rectangle facing out (+v) at depth v, e0 < e1 east; wound left-to-right as the street sees it */
  const fOut = (e0: number, e1: number, v: number, y0: number, y1: number, c: Rgb, tag = PX_GR): void => {
    m.quad([W(e1, v, y0), W(e0, v, y0), W(e0, v, y1), W(e1, v, y1)], [N.x, 0, N.z], uv, c, tag)
  }
  /** a rectangle at e facing east (dir +1) or west (dir -1), from v0 to v1 */
  const fSide = (e: number, v0: number, v1: number, y0: number, y1: number, dir: 1 | -1, c: Rgb, tag = PX_GR): void => {
    const nrm: V3 = [-t.x * dir, 0, -t.z * dir]
    if (dir === 1) m.quad([W(e, v1, y0), W(e, v0, y0), W(e, v0, y1), W(e, v1, y1)], nrm, uv, c, tag)
    else m.quad([W(e, v0, y0), W(e, v1, y0), W(e, v1, y1), W(e, v0, y1)], nrm, uv, c, tag)
  }

  const gP = Math.min(4, gAt(0, 2))                       // the Pine Street pavement at the steps
  const TOP = gP + 16, PLAT = gP + 1.6
  const COL1 = TOP - 3.9                                  // the capitals' top = the entablature's foot
  const DEP = 6.2                                         // the recess, from the front plane to its back wall
  const WE = 5.5, EE = 6.5                                // the west and east pylons' widths on the front
  const eW = -EL + WE, eE = EL - EE                       // their inner faces
  const CE = (eW + eE) / 2, CS = 2.85                     // ten columns about the opening's middle

  // ---- the three other walls and the roof --------------------------------------------------------------------------
  for (let i = 0; i < n; i++) {
    if (i === pi) continue
    const a = ring[i], b = ring[(i + 1) % n]
    const l = Math.hypot(b.x - a.x, b.z - a.z)
    if (l < 0.5) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l, nx = tz, nz = -tx
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    panel(0, l, 0, TOP, 0, PX_STONE, PX_GR)
    for (let y = gP + 1.1; y < TOP - 2; y += 1.1) panel(0, l, y, y + 0.07, 0.02, PX_LINE, PX_GR)   // the ashlar courses
    // tall punched windows high in the wall, each in a lighter surround on a sill
    const k = Math.floor((l - 3) / 4.2)
    for (let j = 0; j < k; j++) {
      const u = 1.5 + ((l - 3) * (j + 0.5)) / k
      const y0 = gP + 4.6, y1 = gP + 11.2
      panel(u - 0.95, u + 0.95, y0 - 0.25, y1 + 0.35, 0.03, PX_LIGHT, PX_GR)
      panel(u - 0.7, u + 0.7, y0, y1, 0.07, PX_GLASS, GL)
      boxAlong(m, a.x + tx * u + nx * 0.15, y0 - 0.35, a.z + tz * u + nz * 0.15, 1.1, 0.1, 0.18, Math.atan2(nx, nz), PX_LIGHT, PX_GR)
    }
    const cx = a.x + tx * l / 2, cz = a.z + tz * l / 2, h = Math.atan2(nx, nz)
    boxAlong(m, cx + nx * 0.35, COL1 + 1.0, cz + nz * 0.35, l / 2 + 0.3, 0.9, 0.35, h, PX_LIGHT, PX_GR)          // frieze and cornice
    boxAlong(m, cx + nx * 0.7, COL1 + 2.5, cz + nz * 0.7, l / 2 + 0.5, 0.4, 0.7, h, PX_STONE, PX_GR)
    boxAlong(m, cx + nx * 0.1, COL1 + 3.4, cz + nz * 0.1, l / 2, 0.5, 0.2, h, PX_STONE, PX_GR)                  // the attic
  }
  capPolygonWithHoles(m, [ring], TOP, PX_ROOF, PX_CN)

  // ---- the Pine front: pylons, recess, ten columns, entablature, attic -----------------------------------------------
  bx(-EL + 0.03, eW, -DEP, 0, 0, COL1, PX_STONE)                       // the west pylon (its outer face is the side wall)
  bx(eE, EL - 0.03, -DEP, 0, 0, COL1, PX_STONE)                        // the east pylon
  for (let y = gP + 1.1; y < COL1; y += 1.1) {                         // the courses on the pylons' fronts
    fOut(-EL + 0.1, eW - 0.1, 0.02, y, y + 0.07, PX_LINE)
    fOut(eE + 0.1, EL - 0.1, 0.02, y, y + 0.07, PX_LINE)
  }
  // the recess: floor, back wall, dark openings, and the soffit under the entablature
  bx(eW, eE, -DEP, 0.5, 0, PLAT, PX_STONE)
  fOut(eW, eE, -DEP + 0.02, PLAT, COL1, PX_DEEP)
  for (const j of [1, 3, 5, 7]) {
    const e = CE + (j - 4) * CS
    fOut(e - 0.85, e + 0.85, -DEP + 0.06, PLAT + 0.3, PLAT + 8.2, PX_GLASS, GL)
    bx(e - 1.0, e + 1.0, -DEP + 0.02, -DEP + 0.2, PLAT + 8.2, PLAT + 8.6, PX_STONE)
  }
  m.quad([W(eW, -DEP, COL1), W(eE, -DEP, COL1), W(eE, 0, COL1), W(eW, 0, COL1)], [0, -1, 0], uv, PX_DEEP, PX_GR)
  fSide(eW, -DEP, 0, PLAT, COL1, 1, PX_DEEP)                           // the pylons' inner faces
  fSide(eE, -DEP, 0, PLAT, COL1, -1, PX_DEEP)
  // the wide steps across the opening, eight risers, the top one the recess floor
  for (let j = 1; j < 8; j++) bx(eW, eE, 0, 0.5 * (9 - j), 0, gP + (PLAT - gP) * (j / 8), PX_STONE)
  for (let j = 1; j < 8; j++) { const y = gP + (PLAT - gP) * (j / 8); fOut(eW, eE, 0.5 * (9 - j) + 0.01, y - 0.2, y, PX_LINE) }
  // the ten unfluted Doric columns, ≈ 1.4 m through the shaft and ten times that tall
  for (let i = 0; i < 10; i++) {
    const p = W(CE + (i - 4.5) * CS, -1.8, 0)
    classicalColumn(m, p[0], p[2], PLAT, COL1, 0.72, PX_STONE, { order: 'doric', tag: PX_GR, heading: head, trim: PX_LIGHT })
  }
  // architrave, the frieze (the lettering's band, a shade paler), the projecting cornice, the plain attic over it
  bx(-EL, EL, -DEP, -0.1, COL1, COL1 + 1.0, PX_STONE)
  bx(-EL, EL, -DEP, 0, COL1 + 1.0, COL1 + 2.1, PX_LIGHT)
  fOut(-EL + 3, EL - 3, 0.02, COL1 + 1.35, COL1 + 1.75, PX_LINE)
  bx(-EL - 0.2, EL + 0.2, -DEP, 0.8, COL1 + 2.1, COL1 + 2.9, PX_STONE)
  bx(-EL + 0.3, EL - 0.3, -1.2, -0.3, COL1 + 2.9, TOP + 0.3, PX_STONE)

  // ---- Stackpole's two groups, one against each pylon: a stele, a low step, two standing figures and a child --------------
  const group = (ec: number): void => {
    const g = Math.max(gP, gAt(ec, 1.2))
    bx(ec - 2.1, ec + 2.1, 0.05, 2.5, g, g + 0.5, PX_STONE)           // the step
    const y0 = g + 0.5
    bx(ec - 1.6, ec + 1.6, 0.05, 1.3, y0, y0 + 4.2, PX_STONE)         // the carved block the figures stand against
    bx(ec - 1.4, ec + 1.4, 0.05, 1.5, y0 + 4.2, y0 + 4.5, PX_STONE)
    const head = (e: number, y: number, r: number): void => {
      const p = W(e, 1.62, 0)
      prism(m, p[0], p[2], y, y + r * 2.3, r, 8, PX_LIGHT, PX_GR, r * 0.8)
    }
    // the man on the left, hand to his chest: a long skirt, broad chest, forearm across it, a head
    bx(ec - 1.5, ec - 0.35, 1.3, 2.1, y0, y0 + 1.9, PX_LIGHT)
    bx(ec - 1.45, ec - 0.4, 1.3, 2.05, y0 + 1.9, y0 + 3.4, PX_LIGHT)
    bx(ec - 1.15, ec - 0.35, 1.9, 2.3, y0 + 2.5, y0 + 2.9, PX_LIGHT)
    head(ec - 0.95, y0 + 3.4, 0.3)
    // the man on the right, a shade taller, arm folded, the boy at his knee
    bx(ec + 0.0, ec + 1.15, 1.3, 2.1, y0, y0 + 2.1, PX_LIGHT)
    bx(ec - 0.05, ec + 1.15, 1.3, 2.05, y0 + 2.1, y0 + 3.7, PX_LIGHT)
    bx(ec + 0.1, ec + 1.1, 2.0, 2.3, y0 + 2.6, y0 + 3.1, PX_LIGHT)
    head(ec + 0.55, y0 + 3.7, 0.32)
    bx(ec + 1.0, ec + 1.55, 1.5, 2.3, y0, y0 + 1.1, PX_LIGHT)
    bx(ec + 1.0, ec + 1.55, 1.55, 2.2, y0 + 1.1, y0 + 1.75, PX_LIGHT)
    head(ec + 1.28, y0 + 1.75, 0.2)
    fOut(ec - 0.3, ec - 0.05, 2.06, y0 + 0.1, y0 + 3.9, PX_DEEP)         // the shadow cut between the two men
  }
  group(-EL + 2.7)
  group(EL - 3.1)

  // the model is already in the fit's own frame
  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  out.uvs.push(...m.uvs)
  out.colors.push(...m.colors)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// Whittier Mansion, 2090 Jackson Street
// ---------------------------------------------------------------------------------------------------------------

const WH_WALL: Rgb = [0.847, 0.749, 0.431]     // #d8bf6e, the yellow-ochre paint over the walls today (mapillary-0)
const WH_TRIM: Rgb = [0.9, 0.82, 0.58]         // cornices, pilasters, window surrounds, a shade paler
const WH_STONE: Rgb = [0.541, 0.29, 0.227]     // #8a4a3a, the bare Arizona sandstone of the corner turret
const WH_STONE_LT: Rgb = [0.63, 0.37, 0.3]     // the turret's belt courses
const WH_BASE: Rgb = [0.8, 0.74, 0.63]         // the pale raised basement
const WH_ROOF: Rgb = [0.58, 0.28, 0.2]        // #a2513a, terracotta tile
const WH_BRICK: Rgb = [0.5, 0.3, 0.24]
const WH_CAP: Rgb = [0.36, 0.47, 0.42]         // the weathered copper chimney caps
const WH_GLASS: Rgb = [0.14, 0.16, 0.19]
const WH_FRAME: Rgb = [0.93, 0.88, 0.72]
const WH_DEEP: Rgb = [0.2, 0.15, 0.11]         // the porch recess and the door

/**
 * The Whittier Mansion (1896, Edward R. Swain; OSM calls it "California Historical Society" after a former occupant),
 * 2090 Jackson Street at Laguna: Arizona red sandstone behind yellow-ochre paint, three storeys on a raised basement, a
 * hipped terracotta-tile roof with dormers and tall chimneys, TWO round corner turrets with tiled caps (the south-west one
 * left bare, red-brown, in the photographs of today), and a gabled centre over a columned porch with a balustraded
 * balcony. Photographs: docs/shots/refs/notable/whittier/ (mapillary-0 for today's colours, commons-1/2/3 for the massing).
 *
 * Orientation: the front is Jackson Street, to the south: the manifest says front 180 and everything is placed from the
 * fit's own ring, never from OSM's vertex order. The OSM plan is a rectangle turned 8.7 degrees; the model is drawn square
 * to the house (u along the front, v into it) and turned onto the fit's frame, centred on the ring's bounding box. In the
 * fit frame -z is the front, the big turret at the west corner and the small one at the east.
 *
 * Where the photographs overruled the numbers: the pack's plan has no turrets, only bulges - both are true round
 * drums of ~3 m radius; the porch is four columns (a pair at each end, a third behind the west pair) round an open
 * middle; the eaves are the LiDAR median 13.8 m, the chimneys the 21.6 m maximum.
 */
function whittierMansion_2090_Jackson(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const AS = surfaceTag('ashlar'), BK = surfaceTag('brick')
  const Q = (p: V3[], n: V3, c: Rgb, tag = ST): void => m.quad(p, n, uv, c, tag)
  const bx = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, c: Rgb, tag = ST): void => emBlock(m, u0, u1, v0, v1, y0, y1, c, tag)
  const yE = 13.85                                // the eaves (a cornice course sits just under it)
  const ROOF_H = 5.4
  const head = (nx: number, nz: number): number => Math.atan2(nx, nz)

  /** a window on a wall at (px, pz) facing (nx, nz): rectangular y0..y1, or round-headed (y1 the spring, rise = hw) */
  const win = (px: number, pz: number, nx: number, nz: number, y0: number, y1: number, hw: number, arch = false, sill = true): void => {
    const tx = -nz, tz = nx
    const rise = arch ? hw : 0
    emOpening(m, px, pz, tx, tz, nx, nz, y0 - 0.12, y1 + (arch ? 0 : 0.12), hw + 0.16, rise ? rise + 0.16 : 0, WH_TRIM, ST, 0.04, 6)
    emOpening(m, px, pz, tx, tz, nx, nz, y0, y1, hw, rise, WH_GLASS, GL, 0.08, 6)
    emOpening(m, px, pz, tx, tz, nx, nz, y0, y1 + rise * 0.9, 0.035, 0, WH_FRAME, ST, 0.11)
    const yt = y0 + (y1 - y0) * 0.66
    emOpening(m, px, pz, tx, tz, nx, nz, yt, yt + 0.07, hw, 0, WH_FRAME, ST, 0.11)
    if (sill) boxAlong(m, px + nx * 0.12, y0 - 0.22, pz + nz * 0.12, hw + 0.3, 0.09, 0.12, head(nx, nz), WH_TRIM, ST)
  }

  // ---- the walls: raised basement, three storeys, the frieze and the cornice ----------------------------------------
  const U0 = -8.6, U1 = 8.8, VF = -9.6, VB = 10.3, VR = 12.3, UN = -4.5      // the block, its rear wing (UN..U1 to VR)
  bx(U0 - 0.15, U1 + 0.15, VF - 0.15, VB + 0.15, -3, 3.0, WH_BASE)
  bx(UN - 0.15, U1 + 0.15, VB, VR + 0.15, -3, 3.0, WH_BASE)
  bx(U0 - 0.15, U1 + 0.15, VF - 0.2, VB + 0.2, 2.9, 3.15, WH_TRIM)           // the sill course on the basement
  bx(U0, U1, VF, VB, 3.0, yE, WH_WALL)
  bx(UN, U1, VB, VR, 3.0, yE, WH_WALL)
  for (const [y0, y1, d] of [[7.2, 7.55, 0.2], [12.55, 13.2, 0.14], [13.2, 13.85, 0.5]] as [number, number, number][]) {
    bx(-3.7, 4.6, VF - d, VF, y0, y1, y1 > 13 && y0 < 13.3 ? WH_TRIM : WH_TRIM)                       // front, between the turrets
    bx(U0 - d, U0, -5.3, VB, y0, y1, WH_TRIM)                                                            // west
    bx(U1, U1 + d, -5.5, VR, y0, y1, WH_TRIM)                                                            // east
    bx(UN, U1 + d, VR, VR + d, y0, y1, WH_TRIM)                                                          // rear
    bx(U0 - d, UN, VB, VB + d, y0, y1, WH_TRIM)                                                          // the rear wing's shoulder
  }
  // the frieze's dark slits under the cornice on the long sides
  for (let v = -4.8; v < 10; v += 0.7) Q([[U0 - 0.145, 13.0, v], [U0 - 0.145, 13.0, v + 0.18], [U0 - 0.145, 13.5, v + 0.18], [U0 - 0.145, 13.5, v]], [-1, 0, 0], WH_DEEP)
  for (let v = -5; v < 12; v += 0.7) Q([[U1 + 0.145, 13.0, v], [U1 + 0.145, 13.0, v + 0.18], [U1 + 0.145, 13.5, v + 0.18], [U1 + 0.145, 13.5, v]], [1, 0, 0], WH_DEEP)

  /** a side facade run from A along t: ground-floor windows, arched second-floor windows between pilasters, basement slits */
  const facade = (ax: number, az: number, tx: number, tz: number, u0: number, u1: number, gPitch: number, sPitch: number): void => {
    const nx = tz, nz = -tx
    const hd = head(nx, nz)
    const kg = Math.max(1, Math.floor((u1 - u0) / gPitch)), ks = Math.max(1, Math.floor((u1 - u0) / sPitch))
    for (let i = 0; i < kg; i++) {
      const u = u0 + ((u1 - u0) * (i + 0.5)) / kg
      const px = ax + tx * u, pz = az + tz * u
      win(px, pz, nx, nz, 3.9, 6.5, 0.55)
      boxAlong(m, px + nx * 0.2, 6.85, pz + nz * 0.2, 0.9, 0.12, 0.2, hd, WH_TRIM, ST)                  // the hood
      emOpening(m, px, pz, tx, tz, nx, nz, 0.7, 2.2, 0.5, 0, WH_GLASS, GL, 0.2)
    }
    for (let i = 0; i < ks; i++) {
      const u = u0 + ((u1 - u0) * (i + 0.5)) / ks
      win(ax + tx * u, az + tz * u, nx, nz, 8.4, 10.3, 0.46, true, false)
    }
    for (let i = 0; i <= ks; i++) {
      const u = u0 + ((u1 - u0) * i) / ks
      boxAlong(m, ax + tx * u + nx * 0.08, 10.1, az + tz * u + nz * 0.08, 0.17, 2.5, 0.08, hd, WH_TRIM, ST)
    }
  }
  facade(U0, VB, 0, -1, 0.9, 15.0, 3.7, 2.15)                  // west
  facade(U1, -5.5, 0, 1, 0.9, 17.3, 3.7, 2.4)                  // east
  facade(U1, VR, -1, 0, 0.7, 12.7, 4.2, 2.6)                   // rear
  facade(UN, VB, -1, 0, 0.5, 3.6, 3.5, 3.5)                    // the rear wing's shoulder

  // ---- the two round turrets: sandstone drums on the pale basement, belt courses, ranks of windows, tiled caps --------
  const tower = (cx: number, cz: number, r: number, k: number, angles: number[]): void => {
    prism(m, cx, cz, -3, 3.0, r + 0.15, 20, WH_BASE, ST, r + 0.15, false)
    prism(m, cx, cz, 2.9, 3.2, r + 0.28, 20, WH_STONE_LT, AS)
    prism(m, cx, cz, 3.2, 13.4, r, 20, WH_STONE, AS, r, false)
    for (const [y0, y1] of [[7.0, 7.4], [11.1, 11.5]]) prism(m, cx, cz, y0, y1, r + 0.17, 20, WH_STONE_LT, AS)
    prism(m, cx, cz, 13.0, 13.4, r + 0.14, 20, WH_STONE_LT, AS, r + 0.14, false)
    prism(m, cx, cz, 13.4, 13.9, r + 0.4, 20, WH_STONE_LT, AS)
    const rings: [number, number, number][] = [[13.9, 14.55, 0.95], [14.55, 15.2, 0.7], [15.2, 15.8, 0.38], [15.8, 16.25, 0.07]]
    let rr = r + 0.15
    for (const [y0, y1, f] of rings) {
      const y0k = 13.9 + (y0 - 13.9) * k, y1k = 13.9 + (y1 - 13.9) * k
      prism(m, cx, cz, y0k, y1k, rr, 20, WH_ROOF, TL, r * f, false)
      rr = r * f
    }
    prism(m, cx, cz, 13.9 + 2.35 * k, 13.9 + 3.25 * k, 0.08, 4, WH_CAP, surfaceTag('copper'))
    for (const a of angles) {
      const rad = (a * Math.PI) / 180
      const px = cx + Math.cos(rad) * (r + 0.06), pz = cz + Math.sin(rad) * (r + 0.06)
      const nx = Math.cos(rad), nz = Math.sin(rad)
      win(px, pz, nx, nz, 3.9, 6.5, 0.46)
      win(px, pz, nx, nz, 8.1, 10.6, 0.46)
      win(px, pz, nx, nz, 11.9, 13.0, 0.34, false, false)
    }
  }
  tower(-6.2, -8.0, 3.0, 1.0, [-165, -135, -105, -75])          // the big south-west turret
  tower(6.6, -8.0, 2.7, 0.9, [-100, -72, -44, -16])             // the smaller south-east one

  // ---- the front between the turrets: pilasters, three arched windows over the porch, the gable ---------------------
  const UC = 0.4
  for (const u of [-2.95, -0.7, 1.5, 3.75]) boxAlong(m, u, 10.1, VF - 0.08, 0.17, 2.5, 0.08, Math.PI, WH_TRIM, ST)
  for (const u of [-1.8, UC, 2.6]) win(u, VF, 0, -1, 8.4, 10.3, 0.5, true, false)
  Q([[-3.0, 3.1, VF - 0.04], [3.6, 3.1, VF - 0.04], [3.6, 7.0, VF - 0.04], [-3.0, 7.0, VF - 0.04]], [0, 0, -1], WH_DEEP)
  emOpening(m, UC, VF - 0.05, 1, 0, 0, -1, 3.1, 5.2, 1.0, 1.0, WH_TRIM, ST, 0.02, 8)
  emOpening(m, UC, VF - 0.05, 1, 0, 0, -1, 3.1, 5.2, 0.8, 0.8, WH_GLASS, GL, 0.05, 8)
  for (const u of [-1.7, 2.5]) emOpening(m, u, VF - 0.05, 1, 0, 0, -1, 3.9, 6.2, 0.5, 0, WH_GLASS, GL, 0.05)
  // the gable: tympanum with three windows, raking cornice, the tiled roof behind it
  const GL0 = UC - 4.3, GL1 = UC + 4.3, YR = yE + 3.7, VG = VF - 0.15
  Q([[GL0, yE, VG], [GL1, yE, VG], [UC, YR, VG], [UC, YR, VG]], [0, 0, -1], WH_WALL)
  for (const s of [-1, 1]) {
    const ue = UC + s * 4.45, ux = UC + s * 0.05
    Q([[ue, yE - 0.1, VF - 0.55], [ux, YR + 0.12, VF - 0.55], [ux, YR + 0.62, VF - 0.55], [ue + s * 0.15, yE + 0.45, VF - 0.55]], [0, 0, -1], WH_TRIM)
    // the roof slope
    Q([[UC + s * 4.55, yE - 0.1, VF - 0.55], [UC, YR + 0.45, VF - 0.55], [UC, YR + 0.45, VF + 6.5], [UC + s * 4.55, yE - 0.1, VF + 6.5]], [s * 0.63, 0.78, 0], WH_ROOF, TL)
  }
  Q([[UC - 4.55, yE - 0.1, VF - 0.55], [UC + 4.55, yE - 0.1, VF - 0.55], [UC + 4.55, yE + 0.35, VF - 0.55], [UC - 4.55, yE + 0.35, VF - 0.55]], [0, 0, -1], WH_TRIM)
  for (const du of [-1.7, 0, 1.7]) win(UC + du, VG, 0, -1, 14.35, du === 0 ? 16.1 : 15.5, 0.36, false, false)
  bx(UC - 4.4, UC + 4.4, VF - 0.55, VF, yE - 0.05, yE + 0.4, WH_TRIM)

  // ---- the porch: four columns, the entablature, the balustraded balcony, the steps ---------------------------------------
  bx(-3.2, 3.6, -13.4, VF, -3, 3.1, WH_BASE)
  bx(-1.2, 2.0, -14.5, -13.4, -3, 2.1, WH_BASE)
  bx(-1.2, 2.0, -13.95, -13.4, -3, 2.6, WH_BASE)
  for (const [u, v, tier] of [[-2.65, -12.7, 'mid'], [-1.55, -12.7, 'mid'], [2.2, -12.7, 'mid'], [3.1, -12.7, 'mid'], [-2.65, -11.0, 'far'], [3.1, -11.0, 'far']] as [number, number, 'mid' | 'far'][]) {
    classicalColumn(m, u, v, 3.1, 7.0, 0.32, WH_TRIM, { order: 'ionic', tier, tag: ST, heading: Math.PI, trim: WH_FRAME })
  }
  bx(-3.4, 3.8, -13.7, VF, 7.0, 7.9, WH_TRIM)
  bx(-3.5, 3.9, -13.85, VF, 7.9, 8.1, WH_TRIM)
  const balu = (u0: number, u1: number, v0: number, v1: number, nx: number, nz: number): void => {
    bx(u0, u1, v0, v1, 8.1, 8.3, WH_TRIM)
    bx(u0, u1, v0, v1, 8.3, 8.9, WH_FRAME)
    bx(u0 - (nx ? 0 : 0.03), u1 + (nx ? 0 : 0.03), v0 - (nx ? 0.03 : 0), v1 + (nx ? 0.03 : 0), 8.9, 9.1, WH_TRIM)
    const L = nx ? v1 - v0 : u1 - u0, k = Math.floor(L / 0.34)
    for (let i = 0; i < k; i++) {
      const t = ((i + 0.5) / k) * L
      if (nx) Q([[(nx > 0 ? u1 : u0) + nx * 0.01, 8.3, v0 + t - 0.06], [(nx > 0 ? u1 : u0) + nx * 0.01, 8.3, v0 + t + 0.06], [(nx > 0 ? u1 : u0) + nx * 0.01, 8.9, v0 + t + 0.06], [(nx > 0 ? u1 : u0) + nx * 0.01, 8.9, v0 + t - 0.06]], [nx, 0, 0], WH_DEEP)
      else Q([[u0 + t - 0.06, 8.3, v0 - 0.01], [u0 + t + 0.06, 8.3, v0 - 0.01], [u0 + t + 0.06, 8.9, v0 - 0.01], [u0 + t - 0.06, 8.9, v0 - 0.01]], [0, 0, -1], WH_DEEP)
    }
  }
  balu(-3.4, 3.8, -13.75, -13.6, 0, -1)
  balu(-3.4, -3.25, -13.6, VF, -1, 0)
  balu(3.65, 3.8, -13.6, VF, 1, 0)

  // ---- the hipped tile roof, dormers and chimneys ------------------------------------------------------------------------
  emHip(m, U0 - 0.5, U1 + 0.5, VF - 0.5, VR + 0.5, yE, ROOF_H, 7.4, 7.0, WH_ROOF)
  const slopeY = (d: number): number => yE + (d * ROOF_H) / 7.4
  const dormer = (px: number, pz: number, nx: number, nz: number, yb: number): void => {
    const tx = -nz, tz = nx
    const P = (t: number, d: number, y: number): V3 => [px + tx * t - nx * d, y, pz + tz * t - nz * d]
    boxAlong(m, px - nx * 0.8, yb + 0.85, pz - nz * 0.8, 0.9, 0.85, 0.8, head(nx, nz), WH_WALL, ST)
    emOpening(m, px, pz, tx, tz, nx, nz, yb + 0.35, yb + 1.45, 0.45, 0, WH_GLASS, GL, 0.04)
    const yt = yb + 1.7
    for (const s of [-1, 1]) Q([P(s * 1.05, -0.15, yt), P(0, -0.15, yt + 0.8), P(0, 1.7, yt + 0.8), P(s * 1.05, 1.7, yt)], [tx * s * -0.6, 0.8, tz * s * -0.6], WH_ROOF, TL)
    Q([P(-0.9, 0, yt), P(0.9, 0, yt), P(0, 0, yt + 0.75), P(0, 0, yt + 0.75)], [nx, 0, nz], WH_WALL)
  }
  for (const v of [-3, 1.5, 6]) {
    dormer(U0 + 2.7, v, -1, 0, slopeY(U0 + 2.7 - (U0 - 0.5)) - 0.05)
    dormer(U1 - 2.7, v, 1, 0, slopeY(U1 + 0.5 - (U1 - 2.7)) - 0.05)
  }
  for (const [u, v, top] of [[-6.6, -4.2, 21.0], [3.9, -3.6, 21.6], [-2.8, 7.6, 20.6], [5.9, 9.6, 20.2], [0.4, 2.4, 21.0]] as [number, number, number][]) {
    bx(u - 0.65, u + 0.65, v - 0.5, v + 0.5, 14.4, top, WH_BRICK, BK)
    bx(u - 0.8, u + 0.8, v - 0.65, v + 0.65, top, top + 0.25, WH_TRIM)
    bx(u - 0.6, u + 0.6, v - 0.45, v + 0.45, top + 0.25, top + 0.55, WH_CAP, surfaceTag('copper'))
  }

  // onto the fit's frame: the house drawn square, turned 8.7 degrees, centred on the ring's bounding box
  const th = (8.7 * Math.PI) / 180
  let tx = 0, tz = 0
  if (fit.ring && fit.ring.length >= 3) {
    tx = (Math.max(...fit.ring.map((p) => p.x)) + Math.min(...fit.ring.map((p) => p.x))) / 2
    tz = (Math.max(...fit.ring.map((p) => p.z)) + Math.min(...fit.ring.map((p) => p.z))) / 2
  }
  emanuElCopy(out, m, Math.cos(th), Math.sin(th), tx, tz)
}

// ---------------------------------------------------------------------------------------------------------------
// Bohemian Club, 624 Taylor Street at Post
// ---------------------------------------------------------------------------------------------------------------

const BC_BRICK: Rgb = [0.36, 0.19, 0.14]        // the red-brown brick, a shade under #8e4a36 (it reads darker in shade, mapillary-2)
const BC_BRICK_LT: Rgb = [0.41, 0.22, 0.16]
const BC_STONE: Rgb = [0.78, 0.74, 0.66]        // #d8cdb8 trim, weathered
const BC_IVY_DK: Rgb = [0.27, 0.43, 0.2]        // #4f7a3a, dimmed
const BC_IVY_MID: Rgb = [0.33, 0.5, 0.23]
const BC_IVY_LT: Rgb = [0.435, 0.6, 0.29]       // #6f9a4a
const BC_GLASS: Rgb = [0.15, 0.17, 0.19]
const BC_FRAME: Rgb = [0.3, 0.38, 0.34]         // the green-grey window frames of mapillary-3
const BC_DOOR: Rgb = [0.1, 0.09, 0.08]
const BC_ROOF: Rgb = [0.42, 0.4, 0.38]

/**
 * The Bohemian Club's clubhouse, 624 Taylor Street at Post (1934, Lewis P. Hobart): a six-storey masonry block of red-brown
 * brick, a stone base course, tall regular windows with stone sills, a stone belt over the sixth floor and a darker top storey
 * of narrow paired windows under a cornice; ivy mantles the lower three or four storeys of the Taylor and Post fronts in large
 * ragged patches; flags fly from the roof at the Post/Taylor corner; the entrance is a tall round arch on Taylor near Post.
 * Photographs: docs/shots/refs/notable/bohemian/ — mapillary-3 (brick, stone trim, the ivy mantle, the window proportions),
 * -2 (the block from down Post: flags on the roof corner, belt course, darker top storey), -5 (an arched doorway in a brick
 * front), -0 (ivy and stone plinth at the base). -4 is the Dakota Hotel and -1 the Emperor Norton Inn, both ignored.
 *
 * Orientation: the manifest says front 180, so Post (the south edge) is the fit's front: the ring edge whose outward normal
 * faces local -z; Taylor is the ring edge whose normal faces local -x (the west). Both are found from the ring's geometry in the
 * fit frame, never from OSM's vertex order; every other edge (the neighbours' party walls) gets plain brick without ivy.
 *
 * Where the photographs overruled the numbers: the Assessor says four storeys but the photographs and LiDAR (26.8 m median)
 * show six storeys plus a top storey; the ivy is not a band but big irregular patches that stop short of the upper storeys and
 * leave the windows clear; the stone is a base plinth under the brick, not rustication.
 */
function bohemianClub_624_Taylor(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const BK = surfaceTag('brick')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  // wind it so (tz, -tx) is the outward normal
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const TOP = 27, ROOF = 26.6

  // the edges' roles: the front (Post) faces -z, Taylor faces -x
  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  const best = (fn: (e: typeof info[number]) => number): number => info.reduce((bi, e) => (fn(e) + e.l * 0.002 > fn(info[bi]) + info[bi].l * 0.002 ? e.i : bi), 0)
  const pi = best((e) => -e.nz), ti = best((e) => -e.nx)

  const win = (a: P2, tx: number, tz: number, nx: number, nz: number, u: number, y0: number, y1: number, hw: number, sill: boolean): void => {
    const cx = a.x + tx * u, cz = a.z + tz * u
    emOpening(m, cx, cz, tx, tz, nx, nz, y0 - 0.15, y1 + 0.2, hw + 0.2, 0, BC_STONE, BK, 0.2)       // the stone surround
    emOpening(m, cx, cz, tx, tz, nx, nz, y0, y1, hw, 0, BC_GLASS, GL, 0.25)
    emOpening(m, cx, cz, tx, tz, nx, nz, y0, y1, 0.04, 0, BC_FRAME, ST, 0.28)                    // the mullion
    const yt = y0 + (y1 - y0) * 0.7
    emOpening(m, cx, cz, tx, tz, nx, nz, yt, yt + 0.07, hw, 0, BC_FRAME, ST, 0.28)                // the transom
    if (sill) emOpening(m, cx, cz, tx, tz, nx, nz, y0 - 0.32, y0 - 0.15, hw + 0.3, 0, BC_STONE, BK, 0.3)
  }

  for (const e of info) {
    const { a, b, l, nx, nz } = e
    if (l < 0.5) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const street = e.i === pi || e.i === ti
    panel(0, l, -3, TOP, 0, BC_BRICK, BK)
    for (let y = 1.6; y < 23; y += 2.4) panel(0, l, y, y + 0.05, 0.015, BC_BRICK_LT, BK)             // a few courses, so the brick reads as brick
    panel(0, l, -3, 1.3, 0.07, BC_STONE, BK)                                                         // the stone base course
    panel(0, l, 1.3, 1.5, 0.12, BC_STONE, BK)
    panel(0, l, 22.95, 23.55, 0.12, BC_STONE, BK)                                                    // the belt under the top storey
    panel(0, l, 23.55, 26.0, 0.02, [0.42, 0.2, 0.15], BK)                                            // the top storey, darker
    const cx = a.x + tx * l / 2, cz = a.z + tz * l / 2, h = Math.atan2(nx, nz)
    boxAlong(m, cx + nx * 0.4, 26.25, cz + nz * 0.4, l / 2 + 0.3, 0.4, 0.4, h, BC_STONE, BK)         // the cornice
    boxAlong(m, cx + nx * 0.05, 25.6, cz + nz * 0.05, l / 2, 0.2, 0.15, h, BC_STONE, BK)
    if (!street && e.l < 8) continue

    // regular windows: six tall rows over the base, narrow pairs in the top storey
    const k = Math.max(1, Math.floor((l - 3) / 3.3))
    const door = e.i === ti ? ((): number => (a.z > b.z ? l - 8.5 : 8.5))() : -99
    for (let j = 0; j < k; j++) {
      const u = 1.5 + ((l - 3) * (j + 0.5)) / k
      for (let r = 0; r < 6; r++) {
        const y0 = 2.35 + 3.55 * r
        if (r === 0 && Math.abs(u - door) < 2.2) continue
        win(a, tx, tz, nx, nz, u, y0, y0 + 2.45, 0.72, true)
      }
      for (const du of [-0.45, 0.45]) win(a, tx, tz, nx, nz, u + du, 23.95, 25.45, 0.27, false)
    }
    for (let j = 0; j <= k; j++) {                                                                  // brick piers swell to stone caps at the belt
      const u = 1.5 + ((l - 3) * j) / k
      panel(u - 0.3, u + 0.3, 23.55, 26.0, 0.07, BC_BRICK_LT, BK)
    }

    if (e.i === ti) {                                                                                 // the arched entrance on Taylor
      const cx0 = a.x + tx * door, cz0 = a.z + tz * door
      emOpening(m, cx0, cz0, tx, tz, nx, nz, 0, 3.4, 1.9, 1.9, BC_STONE, BK, 0.22, 8)
      emOpening(m, cx0, cz0, tx, tz, nx, nz, 0.05, 3.3, 1.5, 1.5, BC_DOOR, GL, 0.3, 8)
      emOpening(m, cx0, cz0, tx, tz, nx, nz, 0.05, 3.3, 0.04, 1.5, BC_FRAME, ST, 0.33, 8)
      boxAlong(m, cx0 + nx * 0.3, 0.12, cz0 + nz * 0.3, 2.0, 0.12, 0.6, h, BC_STONE, BK)          // the step
      boxAlong(m, cx0 + nx * 0.3, 5.5, cz0 + nz * 0.3, 2.3, 0.15, 0.3, h, BC_STONE, BK)           // the hood over it
    }

    // the ivy: big ragged patches on the lower storeys of Post and Taylor, thick on Taylor, half-height on Post
    if (!street) continue
    const seed = e.i * 31 + 7
    // a continuous ragged top edge per layer (sums of sines + a little noise), cut off where the doorway or the hedge is
    const topAt = (u: number, layer: number): number => {
      const ph = seed * 1.7 + layer * 4.1
      let hgt = (e.i === ti ? 12.5 : 7.5) + Math.sin(u * 0.19 + ph) * 3.4 + Math.sin(u * 0.47 + ph * 2) * 2.2 + Math.sin(u * 1.3 + ph * 3) * 1.1
      if (e.i === pi && u > l * 0.62) hgt = -1                                  // Post's eastern half stays brick over a hedge
      if (e.i === ti && u > l - 4) hgt *= 0.5
      if (layer === 1) hgt = hgt * 0.7 - 1
      if (Math.abs(u - door) < 1.9) hgt = -1                                      // the doorway stays clear
      return hgt
    }
    // the mantle itself — two layers, leaves in the shader — from render/landmarks/ivy.ts; its outline is the one above
    ivyWall(m, a, b, { x: nx, z: nz }, { from: 'ground', y: -0.2, reach: 0, extent: (u) => topAt(u, 0), taper: 0, seed })
  }

  // roof, and the flags on the Post/Taylor corner
  capPolygonWithHoles(m, [ring], ROOF, BC_ROOF, surfaceTag('concrete'))
  const cA = info[pi].a                                           // the corner shared by the front edge and Taylor
  const cn = { x: info[pi].nx + info[ti].nx, z: info[pi].nz + info[ti].nz }
  const cl = Math.hypot(cn.x, cn.z) || 1
  const inx = -cn.x / cl, inz = -cn.z / cl
  const flagCols: Rgb[] = [[0.78, 0.12, 0.14], [0.95, 0.95, 0.95], [0.85, 0.7, 0.18]]
  const poles: [number, number, number][] = [[1.7, 1.2, 8.5], [3.4, 0.6, 6.8], [2.4, 2.8, 6.0]]
  const tdx = info[pi].b.x - info[pi].a.x, tdz = info[pi].b.z - info[pi].a.z, tl = Math.hypot(tdx, tdz) || 1
  poles.forEach(([di, dt, ph], k) => {
    const px = cA.x + inx * di + (tdx / tl) * dt, pz = cA.z + inz * di + (tdz / tl) * dt
    prism(m, px, pz, ROOF, ROOF + ph, 0.05, 4, [0.85, 0.85, 0.85], ST)
    const fx = tdx / tl, fz = tdz / tl
    const fw = 1.6, fh = 1.0, y1 = ROOF + ph - 0.1, y0 = y1 - fh
    const Q: V3[] = [[px, y0, pz], [px + fx * fw, y0 + 0.05, pz + fz * fw], [px + fx * fw, y1 - 0.1, pz + fz * fw], [px, y1, pz]]
    m.quad(Q, [fz, 0, -fx], uv, flagCols[k], ST)
    m.quad([Q[1], Q[0], Q[3], Q[2]], [-fz, 0, fx], uv, flagCols[k], ST)
  })

  // the model is already in the fit's own frame
  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// The Audiffred Building, 100 The Embarcadero at Mission Street
// ---------------------------------------------------------------------------------------------------------------

const AU_BRICK: Rgb = [0.55, 0.245, 0.18]       // #8f3f2e red brick
const AU_BRICK_LT: Rgb = [0.6, 0.28, 0.2]
const AU_TRIM: Rgb = [0.85, 0.8, 0.72]          // #ece6d8 white stone, weathered
const AU_SLATE: Rgb = [0.34, 0.38, 0.43]        // #5d6670 grey-blue slate
const AU_SLATE_DK: Rgb = [0.27, 0.3, 0.35]
const AU_SKY: Rgb = [0.52, 0.6, 0.62]           // the pale metal/glass of the mansard's crown
const AU_SHOP: Rgb = [0.17, 0.17, 0.18]         // #2a2c2e the dark storefront band
const AU_GLASS: Rgb = [0.12, 0.15, 0.18]
const AU_PANEL: Rgb = [0.8, 0.77, 0.7]

/**
 * The Audiffred Building, 100 The Embarcadero at Mission (1889, SF Landmark 7): two floors of red brick over a dark
 * storefront band with an ornate lettered frieze, white quoins up the corner and white arched window surrounds, a white
 * cornice, then a steep grey slate mansard with a row of pedimented dormers (brick stacks between them) and a pale flat
 * crown. Photographs: docs/shots/refs/notable/audiffred/ wiki-image.jpg (the two street fronts, the key reference),
 * mapillary-2 and -3 (today, from the corners); -0 and -1 are trees.
 *
 * Orientation: the manifest says front 45, the Embarcadero side (the short front, ~14 m) is the ring edge whose outward
 * normal faces local -z; the long Mission front is the adjacent edge facing -x. Both are found from the ring's geometry in
 * the fit frame, never from OSM's vertex order. The other two edges (neighbours' party walls) get plain brick.
 *
 * Where the photographs overruled the numbers: LiDAR's 15.4 m median agrees, but the Assessor's four storeys are really two
 * brick floors and the mansard; OSM's "mansard" is a double-pitched slate roof with a flat crown, not a full mansard cap.
 */
function audiffredBuilding_100_Embarcadero(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const BK = surfaceTag('brick')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const Y_SHOP = 4.3, Y_FR = 5.1, Y_COR = 9.5, Y_EAVE = 10.2, Y_BREAK = 13.8, Y_TOP = 15.0
  const D_BREAK = 1.8, D_TOP = 4.2

  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  const best = (fn: (e: typeof info[number]) => number): number => info.reduce((bi, e) => (fn(e) + e.l * 0.002 > fn(info[bi]) + info[bi].l * 0.002 ? e.i : bi), 0)
  const fi = best((e) => -e.nz), si = best((e) => -e.nx)       // Embarcadero front (-z), Mission front (-x)

  /** the ring offset inward by d (mitred) */
  const inset = (d: number): P2[] => info.map((e, i) => {
    const p = info[(i + n - 1) % n]
    const k = 1 + (p.nx * e.nx + p.nz * e.nz)
    return { x: e.a.x - ((p.nx + e.nx) / k) * d, z: e.a.z - ((p.nz + e.nz) / k) * d }
  })
  const r1 = inset(D_BREAK), r2 = inset(D_TOP)
  const rise1 = Y_BREAK - Y_EAVE, rise2 = Y_TOP - Y_BREAK

  for (const e of info) {
    const { a, b, l, nx, nz } = e
    if (l < 0.5) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    const h = Math.atan2(nx, nz)
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const slab = (u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb, tag = ST): void => {
      boxAlong(m, a.x + tx * (u0 + u1) / 2 + nx * (pr0 + pr1) / 2, (y0 + y1) / 2, a.z + tz * (u0 + u1) / 2 + nz * (pr0 + pr1) / 2,
        (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, tag)
    }
    const street = e.i === fi || e.i === si
    // the wall: brick over the dark storefront band
    panel(0, l, -3, Y_COR, 0, AU_BRICK, BK)
    if (street) for (let y = 5.6; y < 9.3; y += 0.9) panel(0, l, y, y + 0.05, 0.015, AU_BRICK_LT, BK)
    // the cornice: a plain course, a dentil row, the projecting cap
    slab(-0.1, l + 0.1, Y_COR - 0.35, Y_COR + 0.05, 0, 0.2, AU_TRIM)
    slab(-0.2, l + 0.2, Y_COR + 0.05, Y_EAVE, 0, 0.55, AU_TRIM)
    if (street) for (let u = 0.3; u < l - 0.2; u += 0.5) slab(u, u + 0.25, Y_COR - 0.7, Y_COR - 0.35, 0, 0.14, AU_TRIM)
    // the mansard's steep slope up to the break, then the shallow crown slope
    const A0 = a, B0 = b, A1 = r1[e.i], B1 = r1[(e.i + 1) % n], A2 = r2[e.i], B2 = r2[(e.i + 1) % n]
    const sl = Math.hypot(D_BREAK, rise1), sn: V3 = [nx * rise1 / sl, D_BREAK / sl, nz * rise1 / sl]
    m.quad([[A0.x, Y_EAVE, A0.z], [B0.x, Y_EAVE, B0.z], [B1.x, Y_BREAK, B1.z], [A1.x, Y_BREAK, A1.z]], sn, uv, AU_SLATE, TL)
    const cl2 = Math.hypot(D_TOP - D_BREAK, rise2), cn: V3 = [nx * rise2 / cl2, (D_TOP - D_BREAK) / cl2, nz * rise2 / cl2]
    m.quad([[A1.x, Y_BREAK, A1.z], [B1.x, Y_BREAK, B1.z], [B2.x, Y_TOP, B2.z], [A2.x, Y_TOP, A2.z]], cn, uv, AU_SKY, ST)
    // the light cresting round the crown's top
    if (street) slab(D_TOP, l - D_TOP, Y_TOP, Y_TOP + 0.4, -D_TOP + 0.05, -D_TOP + 0.2, AU_TRIM)
    if (!street) continue

    // ---- the storefront band: pale base panels, dark piers, dark glazing, the lettered frieze --------------------------
    panel(0, l, -3, Y_SHOP, 0.04, AU_SHOP, ST)
    panel(0, l, 0, 1.0, 0.1, AU_PANEL, ST)
    const kb = Math.max(2, Math.round(l / 3.1))
    for (let j = 0; j < kb; j++) {
      const u0 = (l * j) / kb, u1 = (l * (j + 1)) / kb
      panel(u0 + 0.35, u1 - 0.35, 1.2, 3.9, 0.12, AU_GLASS, GL)
      panel(u0 + 0.35, u1 - 0.35, 0.05, 0.95, 0.12, AU_TRIM, ST)       // the panelled stall riser
      panel(u0 + 0.5, u1 - 0.5, 0.2, 0.8, 0.14, AU_PANEL, ST)
      panel(u0 + 0.35, u1 - 0.35, 3.0, 3.1, 0.15, AU_SHOP, ST)         // the transom bar
    }
    for (let j = 0; j <= kb; j++) slab(Math.min(l - 0.22, Math.max(0.22, (l * j) / kb)) - 0.22, Math.min(l - 0.22, Math.max(0.22, (l * j) / kb)) + 0.22, 0, Y_SHOP, 0, 0.3, AU_SHOP)
    slab(-0.05, l + 0.05, Y_SHOP, Y_FR, 0, 0.35, AU_TRIM)                                // the frieze
    panel(0.8, l - 0.8, Y_SHOP + 0.12, Y_FR - 0.12, 0.4, [0.72, 0.68, 0.6], ST)
    panel(l * 0.12, l * 0.62, Y_SHOP + 0.2, Y_FR - 0.2, 0.42, [0.32, 0.32, 0.32], ST)   // the dark sign band: "The Audiffred Building"
    for (let u = 0.9; u < l - 0.9; u += 1.1) slab(u, u + 0.45, Y_SHOP + 0.12, Y_FR - 0.1, 0.35, 0.5, AU_TRIM)   // ornament blocks
    slab(-0.1, l + 0.1, Y_FR, Y_FR + 0.15, 0, 0.45, AU_TRIM)

    // ---- the second floor: segmental-arched windows in white surrounds; dormers above each --------------------------
    const k = Math.max(2, Math.floor((l - 2.6) / 2.7))
    for (let j = 0; j < k; j++) {
      const u = 1.3 + ((l - 2.6) * (j + 0.5)) / k
      const cx = a.x + tx * u, cz = a.z + tz * u
      emOpening(m, cx, cz, tx, tz, nx, nz, 5.8, 7.9, 0.78, 0.5, AU_TRIM, BK, 0.06, 6)         // the surround
      emOpening(m, cx, cz, tx, tz, nx, nz, 5.95, 7.9, 0.58, 0.4, AU_GLASS, GL, 0.1, 6)
      emOpening(m, cx, cz, tx, tz, nx, nz, 5.95, 8.2, 0.03, 0, AU_TRIM, ST, 0.12)             // the mullion
      slab(u - 0.9, u + 0.9, 5.55, 5.8, 0, 0.18, AU_TRIM)                                       // the sill
      // the dormer: white frame, dark window, a pediment, slate cheeks
      const pr = -0.15
      const dc = (d: number): V3 => P(u + d, 0, pr)
      void dc
      slab(u - 0.7, u + 0.7, 10.75, 13.1, -1.5, pr, AU_SLATE_DK)
      emOpening(m, cx + nx * pr, cz + nz * pr, tx, tz, nx, nz, 10.85, 13.0, 0.66, 0, AU_TRIM, ST, 0.03)
      emOpening(m, cx + nx * pr, cz + nz * pr, tx, tz, nx, nz, 11.05, 12.8, 0.45, 0, AU_GLASS, GL, 0.06)
      emOpening(m, cx + nx * pr, cz + nz * pr, tx, tz, nx, nz, 11.05, 12.8, 0.03, 0, AU_TRIM, ST, 0.08)
      const q = (uu: number, y: number, p: number): V3 => P(u + uu, y, p)
      m.quad([q(-0.85, 13.05, pr + 0.05), q(0.85, 13.05, pr + 0.05), q(0, 13.85, pr + 0.05), q(0, 13.85, pr + 0.05)], [nx, 0, nz], uv, AU_TRIM, ST)
      m.quad([q(-0.55, 13.15, pr + 0.08), q(0.55, 13.15, pr + 0.08), q(0, 13.65, pr + 0.08), q(0, 13.65, pr + 0.08)], [nx, 0, nz], uv, AU_SLATE_DK, ST)
      for (const s of [-1, 1]) m.quad([q(s * 0.85, 13.05, pr), q(s * 0.85, 13.05, -1.6), q(0, 13.85, -1.6), q(0, 13.85, pr)],
        [-s * tx * 0.5 + nx * 0.3, 0.8, -s * tz * 0.5 + nz * 0.3], uv, AU_SLATE, TL)
      // a brick stack on the eave line between this dormer and the next (every second bay)
      if (j % 2 === 0 && j < k - 1) {
        const us = 1.3 + ((l - 2.6) * (j + 1)) / k
        slab(us - 0.3, us + 0.3, Y_EAVE, 14.0, -0.75, -0.15, AU_BRICK, BK)
        slab(us - 0.38, us + 0.38, 13.5, 13.65, -0.83, -0.07, AU_TRIM)
        slab(us - 0.38, us + 0.38, 14.0, 14.2, -0.83, -0.07, AU_TRIM)
      }
    }
    // white pilasters ending the front at each end
    slab(0, 0.35, 5.15, Y_COR - 0.35, 0, 0.14, AU_TRIM)
    slab(l - 0.35, l, 5.15, Y_COR - 0.35, 0, 0.14, AU_TRIM)
  }

  // ---- the corner shared by the two fronts: quoins up the second floor, a corner dormer ---------------------------------
  const E = info[fi], S = info[si]
  const shared = [E.a, E.b].find((p) => Math.hypot(p.x - S.a.x, p.z - S.a.z) < 0.5 || Math.hypot(p.x - S.b.x, p.z - S.b.z) < 0.5)
  if (shared) {
    for (const e of [E, S]) {
      const atA = Math.hypot(e.a.x - shared.x, e.a.z - shared.z) < 0.5
      const tx = (e.b.x - e.a.x) / e.l, tz = (e.b.z - e.a.z) / e.l
      const h = Math.atan2(e.nx, e.nz), sgn = atA ? 1 : -1
      let alt = e === E ? 0 : 1
      for (let y = 5.2; y < Y_COR - 0.2; y += 0.55, alt++) {
        const w = alt % 2 === 0 ? 0.95 : 0.55
        const u = atA ? w / 2 - 0.05 : e.l - w / 2 + 0.05
        boxAlong(m, e.a.x + tx * u + e.nx * 0.07, y + 0.25, e.a.z + tz * u + e.nz * 0.07, w / 2, 0.24, 0.1, h, AU_TRIM, ST)
      }
      void sgn
    }
    // the corner dormer, on the diagonal, a taller pediment than its neighbours
    const bx = E.nx + S.nx, bz = E.nz + S.nz, bl = Math.hypot(bx, bz) || 1
    const dn = { x: bx / bl, z: bz / bl }, hh = Math.atan2(dn.x, dn.z)
    const cxp = shared.x - dn.x * 0.5, czp = shared.z - dn.z * 0.5
    boxAlong(m, cxp - dn.x * 0.7, 11.75, czp - dn.z * 0.7, 0.8, 1.25, 0.85, hh, AU_SLATE_DK, ST)
    boxAlong(m, cxp + dn.x * 0.1, 12.0, czp + dn.z * 0.1, 0.72, 1.2, 0.07, hh, AU_GLASS, GL)
    boxAlong(m, cxp + dn.x * 0.05, 14.0, czp + dn.z * 0.05, 0.95, 0.55, 0.1, hh, AU_TRIM, ST)
    boxAlong(m, cxp + dn.x * 0.05, 13.35, czp + dn.z * 0.05, 0.95, 0.12, 0.2, hh, AU_TRIM, ST)
  }

  // the roof's crown, and the plan's floor
  capPolygonWithHoles(m, [r2], Y_TOP, AU_SKY, surfaceTag('concrete'))

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// The Alhambra Theatre, 2330 Polk Street
// ---------------------------------------------------------------------------------------------------------------

const AL_WALL: Rgb = [0.9, 0.83, 0.71]          // #e6d4b6 cream stucco
const AL_TRIM: Rgb = [0.85, 0.76, 0.63]         // #d9c3a0 carved cast stone, the minaret caps
const AL_RIB: Rgb = [0.7, 0.6, 0.48]            // darker relief and ribs
const AL_TILE: Rgb = [0.6, 0.353, 0.235]        // #9a5a3c the eave's clay tile
const AL_TEAL: Rgb = [0.29, 0.56, 0.54]         // #4a8f8a
const AL_RED: Rgb = [0.69, 0.25, 0.227]         // #b0403a
const AL_NAVY: Rgb = [0.1, 0.1, 0.24]
const AL_GOLD: Rgb = [0.93, 0.7, 0.2]
const AL_SHOP: Rgb = [0.13, 0.13, 0.15]
const AL_GLASS_C: Rgb = [0.1, 0.13, 0.17]

/**
 * The Alhambra Theatre, 2330 Polk Street (1926, Miller & Pflueger, SF Landmark 1996; Crunch Fitness now): a Moorish Revival
 * movie palace. A cream stucco street front under a deep clay-tile eave on a row of carved brackets, a frieze of navy star
 * panels between the brackets, three pointed-arched windows over a carved ledge, two slender minarets at the front corners
 * (square carved shaft, a lattice balcony drum with a flared lip, a teal-tiled round shaft, a tiled cap), the marquee with
 * its scalloped crest and the tall blade sign "ALHAMBRA". The auditorium behind is a plain stucco box.
 * Photographs: docs/shots/refs/notable/alhambra/ wiki-image.jpg (the key reference), mapillary-0 (marquee, star frieze) and
 * mapillary-2 (blade sign, eave).
 *
 * Orientation: the front is found from the ring in the fit frame (the long straight edge facing local -z), never from OSM's
 * vertex order. Where the pack and the geometry disagreed: the pack says "west side of Polk, front 90"; the plan's only
 * long straight edge (29.5 m, the width the two minarets stand apart in wiki-image) is the one nearest Polk, so the manifest
 * front is whichever bearing puts that edge at -z.
 */
function alhambraTheatre_2330_Polk(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const Y_EAVE = 11.8, Y_ROOF = 13.6
  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  // the front: the longest edge whose outward normal is within 50 degrees of -z
  let fi = 0, bestScore = -1
  for (const e of info) if (-e.nz > 0.64 && e.l > bestScore) { bestScore = e.l; fi = e.i }
  if (bestScore < 0) fi = info.reduce((bi, e) => (-e.nz > -info[bi].nz ? e.i : bi), 0)

  const wallEdge = (e: typeof info[number], top: number): void => {
    const { a, b, nx, nz } = e
    const P = (u: number, y: number, pr = 0): V3 => [a.x + (b.x - a.x) * u / e.l + nx * pr, y, a.z + (b.z - a.z) * u / e.l + nz * pr]
    m.quad([P(0, -3), P(e.l, -3), P(e.l, top), P(0, top)], [nx, 0, nz], uv, AL_WALL, ST)
  }

  for (const e of info) {
    if (e.i === fi) continue
    wallEdge(e, Y_ROOF)
    const h = Math.atan2(e.nx, e.nz), tx = (e.b.x - e.a.x) / e.l, tz = (e.b.z - e.a.z) / e.l
    boxAlong(m, e.a.x + tx * e.l / 2 + e.nx * 0.15, Y_ROOF + 0.1, e.a.z + tz * e.l / 2 + e.nz * 0.15, e.l / 2 + 0.1, 0.15, 0.2, h, AL_TRIM, ST)
    // blind pointed windows along the side street walls
    if (e.l > 6) {
      const k = Math.floor(e.l / 3.4)
      for (let j = 0; j < k; j++) {
        const u = (e.l * (j + 0.5)) / k, cx = e.a.x + tx * u, cz = e.a.z + tz * u
        emOpening(m, cx, cz, tx, tz, e.nx, e.nz, 6.0, 8.0, 0.5, 0.45, AL_RIB, ST, 0.03, 4)
      }
    }
  }

  // ---- the front --------------------------------------------------------------------------------------------------
  const F = info[fi], { a, b, l: L, nx, nz } = F
  const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
  const h = Math.atan2(nx, nz)
  const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
  const W = (u: number, pr = 0): { x: number; z: number } => ({ x: a.x + tx * u + nx * pr, z: a.z + tz * u + nz * pr })
  const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
    m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
  }
  const slab = (u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb, tag = ST): void => {
    const w = W((u0 + u1) / 2, (pr0 + pr1) / 2)
    boxAlong(m, w.x, (y0 + y1) / 2, w.z, (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, tag)
  }
  const open = (u: number, y0: number, spring: number, hw: number, rise: number, c: Rgb, tag: number, proud: number, seg = 6): void => {
    const w = W(u)
    emOpening(m, w.x, w.z, tx, tz, nx, nz, y0, spring, hw, rise, c, tag, proud, seg)
  }
  // which end the marquee and sign stand at: measured from the end the viewer sees on the left (see the render)
  const flip = false
  const U = (f: number): number => (flip ? 1 - f : f) * L

  panel(0, L, -3, Y_EAVE, 0, AL_WALL, ST)
  // the ground floor: dark glazing and the shop sign band, under the marquee
  panel(0, L, -3, 4.1, 0.05, AL_SHOP, ST)
  const kg = Math.floor(L / 2.6)
  for (let j = 0; j < kg; j++) {
    const u0 = (L * j) / kg + 0.12, u1 = (L * (j + 1)) / kg - 0.12
    panel(u0, u1, 0.5, 3.8, 0.1, AL_GLASS_C, GL)
  }
  slab(0, L, 0, 0.5, 0, 0.18, AL_RIB)
  slab(0, L, 4.1, 4.75, 0, 0.35, [0.3, 0.3, 0.32], ST)                     // the shop-sign band
  slab(-0.05, L + 0.05, 4.75, 5.4, 0, 0.8, AL_WALL)                         // the carved ledge across the front
  slab(-0.05, L + 0.05, 5.4, 5.55, 0, 0.85, AL_TRIM)
  // the carved panel band over the ledge, and the three pointed windows (a small one at the sign end)
  panel(0.8, L - 0.8, 5.7, 9.2, 0.04, AL_WALL, ST)
  for (const f of [0.52, 0.67, 0.83]) {
    const u = U(f)
    open(u, 5.7, 9.0, 1.05, 0.9, AL_TRIM, ST, 0.08)                         // the carved surround
    open(u, 5.9, 7.7, 0.55, 0.0, AL_GLASS_C, GL, 0.12)
    open(u, 7.7, 7.7, 0.55, 0.7, AL_GLASS_C, GL, 0.12, 5)
    open(u, 5.9, 7.9, 0.03, 0.0, AL_RIB, ST, 0.15)
    slab(u - 0.85, u + 0.85, 5.55, 5.9, 0, 0.45, AL_TRIM)
  }
  for (const f of [0.045, 0.3]) {
    const u = U(f)
    open(u, 6.6, 7.9, 0.4, 0.35, AL_GLASS_C, GL, 0.08, 4)
  }
  // the bracketed eave: star panels between carved brackets, the fascia, and the clay-tile slope
  const nb = Math.round((L - 1.0) / 1.3)
  for (let j = 0; j <= nb; j++) {
    const u = 0.5 + ((L - 1.0) * j) / nb
    slab(u - 0.12, u + 0.12, 10.4, 11.8, 0, 0.8, AL_TRIM)                     // the bracket, under the tile
    if (j < nb) {
      const un = (u + (0.5 + ((L - 1.0) * (j + 1)) / nb)) / 2, hwp = (L - 1.0) / nb / 2 - 0.14
      panel(un - hwp, un + hwp, 10.0, 11.3, 0.06, AL_NAVY, ST)
      const c = P(un, 10.65, 0.1)
      for (const [sx, sy] of [[0.12, 0.5], [0.5, 0.12]] as [number, number][]) {
        const dx = tx * sx, dz = tz * sx
        m.quad([[c[0] - dx, c[1], c[2] - dz], [c[0], c[1] - sy, c[2]], [c[0] + dx, c[1], c[2] + dz], [c[0], c[1] + sy, c[2]]], [nx, 0, nz], uv, AL_GOLD, ST)
      }
    }
  }
  slab(-0.3, L + 0.3, 11.3, 11.9, 0.7, 1.25, AL_TILE, surfaceTag('tile'))      // the tile eave's thick edge
  const rise = Y_ROOF - 11.9, run = 1.25 + 4.0, sl = Math.hypot(rise, run)
  const sn: V3 = [nx * rise / sl, run / sl, nz * rise / sl]
  const Q = (u: number, y: number, pr: number): V3 => P(u, y, pr)
  m.quad([Q(-0.3, 11.9, 1.25), Q(L + 0.3, 11.9, 1.25), Q(L + 0.3, Y_ROOF, -4), Q(-0.3, Y_ROOF, -4)], sn, uv, AL_TILE, TL)
  // the roof over the rest, inside the tile slope
  const cap = ring.map((p, i) => (i === fi || i === (fi + 1) % n) ? { x: p.x - nx * 4, z: p.z - nz * 4 } : p)
  capPolygonWithHoles(m, [cap], Y_ROOF, [0.6, 0.58, 0.55], surfaceTag('concrete'))

  // ---- the minarets: one at each front corner, rising from the ground to 19 m --------------------------------------------
  const ngon = (cx: number, cz: number, r0: number, r1: number, y0: number, y1: number, k: number, c: Rgb, tag: number, rot = 0.3927): void => {
    for (let i = 0; i < k; i++) {
      const t0 = rot + (Math.PI * 2 * i) / k, t1 = rot + (Math.PI * 2 * (i + 1)) / k, tm = (t0 + t1) / 2
      const p = (t: number, r: number, y: number): V3 => [cx + Math.cos(t) * r, y, cz + Math.sin(t) * r]
      const rs = Math.hypot(r0 - r1, y1 - y0)
      m.quad([p(t0, r0, y0), p(t1, r0, y0), p(t1, r1, y1), p(t0, r1, y1)],
        [Math.cos(tm) * (y1 - y0) / rs, (r0 - r1) / rs, Math.sin(tm) * (y1 - y0) / rs], uv, c, tag)
    }
  }
  const disc = (cx: number, cz: number, r: number, y: number, k: number, c: Rgb, rot = 0.3927): void => {
    for (let i = 0; i + 2 <= k; i += 2) {
      const p = (j: number): V3 => [cx + Math.cos(rot + (Math.PI * 2 * j) / k) * r, y, cz + Math.sin(rot + (Math.PI * 2 * j) / k) * r]
      m.quad([[cx, y, cz], p(i), p(i + 1), p(i + 2)], [0, 1, 0], uv, c, ST)
    }
  }
  const minaret = (u: number): void => {
    const C = W(u, -0.35), hw = 1.05
    // the carved square shaft, with its relief bands and corner ribs
    boxAlong(m, C.x, 4.5, C.z, hw, 7.5, hw, h, AL_TRIM, ST)
    boxAlong(m, C.x + nx * 0.06, 8.7, C.z + nz * 0.06, hw + 0.06, 0.2, hw + 0.06, h, AL_TRIM, ST)
    for (const y of [1.6, 3.4, 5.2, 7.0, 8.8]) boxAlong(m, C.x + nx * (hw + 0.03), y, C.z + nz * (hw + 0.03), hw * 0.7, 0.7, 0.04, h, AL_RIB, ST)
    for (const sx of [-1, 1]) boxAlong(m, C.x + tx * sx * (hw + 0.02), 6.5, C.z + tz * sx * (hw + 0.02), 0.04, 2.2, hw * 0.6, h, AL_RIB, ST)
    // the swelling collar of carved cast stone up to the balcony
    boxAlong(m, C.x, 11.0, C.z, hw + 0.1, 0.9, hw + 0.1, h, AL_TRIM, ST)
    ngon(C.x, C.z, 1.0, 1.15, 11.9, 12.7, 8, AL_TRIM, ST)
    ngon(C.x, C.z, 1.15, 1.35, 12.7, 13.0, 8, AL_RIB, ST)
    disc(C.x, C.z, 1.35, 13.0, 8, AL_TRIM)
    // the open lattice balcony drum: dark openwork between eight light posts
    ngon(C.x, C.z, 0.95, 0.95, 13.0, 14.5, 8, [0.45, 0.38, 0.3], ST)
    for (let i = 0; i < 8; i++) {
      const t = 0.3927 + (Math.PI * 2 * (i + 0.5)) / 8
      boxAlong(m, C.x + Math.cos(t) * 1.0, 13.75, C.z + Math.sin(t) * 1.0, 0.07, 0.75, 0.07, 0, AL_TRIM, ST)
    }
    for (let i = 0; i < 8; i++) {                                              // the pierced lattice panels, pale on dark
      const t = 0.3927 + (Math.PI * 2 * i) / 8
      boxAlong(m, C.x + Math.cos(t) * 1.0, 13.45, C.z + Math.sin(t) * 1.0, 0.3, 0.14, 0.04, -t + Math.PI / 2, AL_TRIM, ST)
    }
    ngon(C.x, C.z, 1.05, 1.28, 14.5, 14.95, 8, AL_TRIM, TC)                      // the flared, scalloped lip
    disc(C.x, C.z, 1.28, 14.95, 8, AL_TRIM)
    // the teal-tiled round shaft and its tiled cap
    ngon(C.x, C.z, 0.62, 0.62, 14.95, 17.9, 8, AL_TEAL, TL, 0)
    for (const y of [15.6, 16.5]) ngon(C.x, C.z, 0.64, 0.64, y, y + 0.14, 8, AL_TRIM, TL, 0)
    ngon(C.x, C.z, 0.68, 0.68, 17.9, 18.1, 8, AL_TRIM, TL, 0)
    ngon(C.x, C.z, 0.68, 0.1, 18.1, 18.85, 8, AL_TEAL, TL, 0)
    boxAlong(m, C.x, 19.0, C.z, 0.05, 0.2, 0.05, 0, AL_GOLD, ST)
  }
  minaret(1.3)
  minaret(L - 1.3)

  // ---- the marquee and the blade sign ------------------------------------------------------------------------------------
  const mw = 5.6, mu = U(0.3), mo = 2.6, my = 4.9
  const mp = W(mu)
  marquee(m, mp.x, my, mp.z, mw, mo, '', { heading: h, body: [0.72, 0.84, 0.85], band: [0.95, 0.93, 0.88], letters: [0.1, 0.1, 0.14], height: 1.7 })
  const put = (u: number, y: number, o: number, hu: number, hv: number, ho: number, c: Rgb): void => {
    const w = W(mu + u, o)
    boxAlong(m, w.x, y, w.z, hu, hv, ho, h, c, 0)
  }
  put(0, my - 0.7, mo + 0.05, mw, 0.1, 0.05, AL_RED)                            // the red and teal trim bands along the lower edge
  put(0, my - 0.55, mo + 0.05, mw, 0.07, 0.06, AL_TEAL)
  // the scalloped crest over the marquee's front, in teal with a red lettered name
  put(0, my + 1.05, mo / 2, mw, 0.14, mo / 2, AL_TEAL)
  for (let i = 0; i < 9; i++) {
    const u = -mw + 0.6 + (i * (2 * mw - 1.2)) / 8
    const r = 0.45 + 0.25 * (i === 4 ? 1 : 0.3 + 0.7 * Math.abs(Math.sin(i * 1.7)))
    put(u, my + 1.3 + r / 2, mo - 0.15, 0.6, r / 2 + 0.05, 0.08, i % 2 ? AL_RED : AL_TEAL)
  }
  const crest = W(mu, mo - 0.05)
  signText(m, 'ALHAMBRA', crest.x, my + 1.55, crest.z, 0.6, AL_RED, { heading: h, lit: true })
  // the blade sign: tall, teal with cream letters, standing on the marquee's near end and rising above the eave
  const sp = W(mu - mw + 1.0)
  bladeSign(m, sp.x, 14.6, sp.z, 9.0, 'ALHAMBRA', { body: AL_TEAL, letters: [0.95, 0.92, 0.82], width: 1.3, out: 1.5, heading: h })

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// The YWCA Residence Hall, 940 Powell Street
// ---------------------------------------------------------------------------------------------------------------

const YW_BRICK: Rgb = [0.52, 0.265, 0.2]         // #8c4a37 red-brown brick, a shade down (it reads dark in shade)
const YW_STONE: Rgb = [0.74, 0.66, 0.52]         // #c9b79a the stone ground storey and trim
const YW_STONE_DK: Rgb = [0.6, 0.53, 0.42]
const YW_GLASS: Rgb = [0.1, 0.12, 0.14]          // the dark steel-sash windows
const YW_TILE: Rgb = [0.56, 0.3, 0.2]            // the clay-tile eaves

/**
 * The YWCA Residence Hall, 940 Powell Street (Julia Morgan, 1932): an eight-storey red-brick tower on a stone-faced ground
 * storey with round-arched windows and "YWCA" lettered along the belt course above it; seven storeys of regular punched
 * windows with two stone-quoined piers up the front, a stone-coloured top storey of arched windows under a shaped, tiled
 * gable in the middle of the front, and lower tile-eaved wings either side. Photographs: docs/shots/refs/notable/ywca/
 * mapillary-2 (the Powell front, the key reference), -0 and -1 (from up and down the hill: the stepped top and the piers);
 * -3 (a corner shop) and -4 (foliage) are not this building.
 *
 * Orientation: the manifest says front 270 (Powell is west of the building), so the front is the longest ring edge whose
 * outward normal is within 50 degrees of local -z, found from the ring's geometry in the fit frame. Edges facing the back
 * (+z) are party walls with plain brick.
 *
 * Where the photographs overruled the numbers: LiDAR's 41.6 m maximum is not a tall roof feature; the photographs show only
 * the shallow central gable stage one storey over the wings (about 27.5 m), so the ground storey, seven brick storeys and
 * that stage make the eight the Assessor counts.
 */
function ywcaResidence_940_Powell(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const BK = surfaceTag('brick')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  // the front: the street-most (lowest z) wide edge facing -z, not just the longest
  let fi = -1, bestZ = Infinity
  for (const e of info) if (-e.nz > 0.64 && e.l > 8 && (e.a.z + e.b.z) / 2 < bestZ) { bestZ = (e.a.z + e.b.z) / 2; fi = e.i }
  if (fi < 0) fi = info.reduce((bi, e) => (-e.nz > -info[bi].nz ? e.i : bi), 0)
  // the street level at the front (Powell is steep): every storey height is measured from here
  const F0 = info[fi]
  const G = Math.max(0, fit.groundAt ? fit.groundAt((F0.a.x + F0.b.x) / 2 + F0.nx * 1.5, (F0.a.z + F0.b.z) / 2 + F0.nz * 1.5) : (fit.grade ?? 0))
  const Y_BELT = G + 5.4, Y_WING = G + 24.6, Y_TOP = G + 27.6, STOREY = 2.65

  for (const e of info) {
    const { a, b, l, nx, nz } = e
    if (l < 0.5) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l, h = Math.atan2(nx, nz)
    const front = e.i === fi
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const W = (u: number, pr = 0): { x: number; z: number } => ({ x: a.x + tx * u + nx * pr, z: a.z + tz * u + nz * pr })
    const slab = (u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb, tag: number): void => {
      const w = W((u0 + u1) / 2, (pr0 + pr1) / 2)
      boxAlong(m, w.x, (y0 + y1) / 2, w.z, (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, tag)
    }
    const open = (u: number, y0: number, spring: number, hw: number, rise: number, c: Rgb, tag: number, proud: number, seg = 6): void => {
      const w = W(u)
      emOpening(m, w.x, w.z, tx, tz, nx, nz, y0, spring, hw, rise, c, tag, proud, seg)
    }
    const back = nz > 0.5
    const wall = front || !back
    
    // brick shaft, stone ground storey with rustication courses, belt
    panel(0, l, G + 5.4, Y_WING, 0, YW_BRICK, BK)
    panel(0, l, -4, G + 5.4, 0.04, YW_STONE, ST)
    for (let y = G + 0.9; y < Y_BELT - 0.2; y += 1.5) panel(0, l, y, y + 0.05, 0.07, YW_STONE_DK, ST)
        slab(0, l, Y_BELT, Y_BELT + 0.85, 0, 0.35, YW_STONE, ST)                              // the belt course (YWCA lettering band)
    slab(0, l, Y_BELT + 0.85, Y_BELT + 1.0, 0, 0.45, YW_STONE, ST)
    if (front && l > 6) {                                                                  // "YWCA", four light letters on the belt
      for (let k = 0; k < 4; k++) panel(l * 0.5 - 1.5 + k * 1.0, l * 0.5 - 1.5 + k * 1.0 + 0.5, Y_BELT + 0.2, Y_BELT + 0.8, 0.4, [0.88, 0.86, 0.8], ST)
    }
    // the tiled eave and shallow cornice of the wings
    slab(-0.1, l + 0.1, Y_WING - 0.35, Y_WING + 0.1, 0, 0.45, YW_STONE, ST)
    slab(-0.15, l + 0.15, Y_WING + 0.1, Y_WING + 0.38, 0, 0.8, YW_TILE, TL)
    if (!wall || l < 3) {
      if (!(l >= 3)) continue
    }
    if (back && !front) {
      // party/back wall: a few plain windows so it is not blank
      const k = Math.max(1, Math.floor((l - 2) / 3.5))
      for (let j = 0; j < k; j++) for (let r = 0; r < 7; r++) {
        const u = 1 + ((l - 2) * (j + 0.5)) / k
        open(u, G + 6.9 + STOREY * r, G + 8.6 + STOREY * r, 0.5, 0, YW_GLASS, GL, 0.04)
      }
      continue
    }

    // ground storey: round-arched windows in stone surrounds, a doorway on the front
    const kg = Math.max(1, Math.floor((l - 1) / 3.4))
    for (let j = 0; j < kg; j++) {
      const u = 0.5 + ((l - 1) * (j + 0.5)) / kg
      const door = front && j === 0
      if (door) {
        open(u, G, G + 3.2, 1.3, 1.3, YW_STONE_DK, ST, 0.12, 8)
        open(u, G, G + 3.1, 1.0, 1.0, [0.07, 0.06, 0.05], GL, 0.16, 8)
        continue
      }
      open(u, G + 1.1, G + 3.6, 1.2, 1.2, YW_STONE, ST, 0.1, 8)                             // the stone surround
      open(u, G + 1.3, G + 3.55, 0.95, 0.95, YW_GLASS, GL, 0.14, 8)
      open(u, G + 1.3, G + 4.5, 0.03, 0, YW_STONE_DK, ST, 0.17)
      open(u, G + 0.3, G + 0.7, 0.3, 0, YW_GLASS, GL, 0.1, 4)                              // the small vent grille below
    }

    // seven storeys of punched windows, a pair of narrower ones in the middle bay of the top
    const kw = Math.max(1, Math.floor((l - 1) / 2.4))
    for (let j = 0; j < kw; j++) {
      const u = 0.5 + ((l - 1) * (j + 0.5)) / kw
      for (let r = 0; r < 7; r++) {
        const y0 = G + 6.9 + STOREY * r
        if (front && (u < l * 0.1 + 0.9 && u > l * 0.1 - 0.9 || u > l * 0.9 - 0.9 && u < l * 0.9 + 0.9)) continue
        open(u, y0, y0 + 1.75, 0.58, 0, YW_STONE, ST, 0.05)                                 // the surround
        open(u, y0 + 0.05, y0 + 1.7, 0.5, 0, YW_GLASS, GL, 0.1)
      }
    }

    if (front && l > 6) {
      // the two stone-quoined piers up the front, swelling to the wing cornice
      for (const uc of [l * 0.1, l * 0.9]) {
        slab(uc - 0.55, uc + 0.55, Y_BELT + 1.0, Y_WING, 0, 0.18, YW_STONE, ST)
        for (let y = Y_BELT + 1.6; y < Y_WING - 0.2; y += 2.1) slab(uc - 0.6, uc + 0.6, y, y + 0.08, 0.18, 0.24, YW_STONE_DK, ST)
      }
      // the central top stage: a stone-coloured storey of arched windows under a tiled gable, one storey over the wings
      const sw0 = l * 0.12, sw1 = l * 0.88
      slab(sw0, sw1, Y_WING - 0.2, Y_TOP - 0.1, 0.0, 0.3, YW_STONE, ST)
      const ku = 4
      for (let j = 0; j < ku; j++) {
        const u = sw0 + ((sw1 - sw0) * (j + 0.5)) / ku
        open(u, Y_WING + 0.7, Y_WING + 1.9, 0.5, 0.5, YW_STONE_DK, ST, 0.36, 8)
        open(u, Y_WING + 0.8, Y_WING + 1.85, 0.4, 0.4, YW_GLASS, GL, 0.4, 8)
        slab(u - 0.55, u + 0.55, Y_WING + 0.45, Y_WING + 0.7, 0.3, 0.55, YW_STONE_DK, ST)   // the little balcony
      }
      // the shaped parapet: stepped gable ends and the broad tiled eave with its brackets
      slab(sw0 - 0.4, sw1 + 0.4, Y_TOP - 0.2, Y_TOP + 0.15, 0, 1.3, YW_TILE, TL)
      for (let j = 0; j <= 4; j++) slab(sw0 + ((sw1 - sw0) * j) / 4 - 0.1, sw0 + ((sw1 - sw0) * j) / 4 + 0.1, Y_TOP - 1.4, Y_TOP - 0.2, 0.3, 1.0, YW_STONE_DK, ST)
      const run = 2.8, rise = 1.4, sl = Math.hypot(rise, run)
      m.quad([P(sw0 - 0.4, Y_TOP + 0.15, 1.3), P(sw1 + 0.4, Y_TOP + 0.15, 1.3), P(sw1 + 0.4, Y_TOP + rise + 0.15, 1.3 - run), P(sw0 - 0.4, Y_TOP + rise + 0.15, 1.3 - run)],
        [nx * rise / sl, run / sl, nz * rise / sl], uv, YW_TILE, TL)
    }
  }

  // roof, with the central stage's block
  capPolygonWithHoles(m, [ring], Y_WING + 0.3, [0.45, 0.43, 0.4], surfaceTag('concrete'))
  const fa = info[fi]
  const ftx = (fa.b.x - fa.a.x) / fa.l, ftz = (fa.b.z - fa.a.z) / fa.l
  const bcx = fa.a.x + ftx * fa.l / 2 - fa.nx * 3.2, bcz = fa.a.z + ftz * fa.l / 2 - fa.nz * 3.2
  boxAlong(m, bcx, (Y_WING + Y_TOP) / 2, bcz, fa.l * 0.38, (Y_TOP - Y_WING) / 2, 3.2, Math.atan2(fa.nx, fa.nz), YW_STONE, ST)

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// St. Joseph's Hospital, 355 Buena Vista Avenue East
// ---------------------------------------------------------------------------------------------------------------

const SJ_WALL: Rgb = [0.85, 0.75, 0.69]       // #dcc6b4 the pink-beige stucco
const SJ_WALL_LO: Rgb = [0.8, 0.71, 0.64]         // the base storey, a shade deeper
const SJ_TRIM: Rgb = [0.937, 0.902, 0.855]       // #efe6da cornices, surrounds
const SJ_TILE: Rgb = [0.6, 0.3, 0.21]       // #a5523a the clay-tile hips
const SJ_GLASS: Rgb = [0.13, 0.14, 0.16]
const SJ_TAR: Rgb = [0.42, 0.4, 0.38]

/** OSM way/247760730's plan, local metres (x east, z north), the pack's vertex order without the closing repeat. */
const SJ_RING: P2[] = [[-30.6, -23.2], [-27.6, -23.6], [-27.7, -25.6], [-26.1, -27.6], [-21.5, -28.2], [-19.5, -26.9], [-19.2, -25.4],
  [-16.1, -25.8], [-14.5, -17.1], [-11.0, -17.7], [-11.5, -20.6], [-7.1, -21.4], [-7.4, -23.2], [3.6, -25.2], [3.3, -26.9], [8.9, -27.8],
  [9.5, -23.5], [10.8, -23.3], [11.8, -22.7], [12.8, -21.8], [13.9, -20.5], [14.3, -19.8], [14.3, -18.7], [14.3, -17.7], [14.0, -16.9],
  [13.6, -15.4], [12.7, -14.8], [11.4, -14.0], [12.0, -9.7], [6.6, -8.8], [6.3, -10.4], [-4.7, -8.4], [-4.6, -8.0], [-8.9, -7.2], [-9.4, -10.1],
  [-13.1, -9.4], [-4.5, 37.6], [2.7, 48.2], [20.0, 59.1], [19.0, 60.9], [21.0, 62.2], [22.0, 64.4], [19.7, 68.0], [17.0, 68.2], [15.3, 67.3],
  [12.4, 72.3], [-7.5, 60.0], [-19.9, 42.4]].map(([x, z]) => ({ x, z }))

/** The rotation + translation carrying SJ_RING onto the fit's ring (a 2-D Procrustes over both orders and every start). */
function sjPlace(ring: P2[] | undefined): { c: number; s: number; tx: number; tz: number } {
  if (!ring) return { c: 1, s: 0, tx: 0, tz: 0 }
  let R = ring
  if (R.length > 1 && Math.hypot(R[0].x - R[R.length - 1].x, R[0].z - R[R.length - 1].z) < 0.3) R = R.slice(0, -1)
  const n = SJ_RING.length
  if (R.length !== n) {
    // a bake that re-cut the outline: match the long axis only, centred on the bounding boxes
    const cx = (Math.max(...R.map((p) => p.x)) + Math.min(...R.map((p) => p.x))) / 2, cz = (Math.max(...R.map((p) => p.z)) + Math.min(...R.map((p) => p.z))) / 2
    return { c: 1, s: 0, tx: cx, tz: cz }
  }
  const cb = { x: R.reduce((t, p) => t + p.x, 0) / n, z: R.reduce((t, p) => t + p.z, 0) / n }
  const ca = { x: SJ_RING.reduce((t, p) => t + p.x, 0) / n, z: SJ_RING.reduce((t, p) => t + p.z, 0) / n }
  let best = { c: 1, s: 0, tx: cb.x - ca.x, tz: cb.z - ca.z, res: Infinity }
  for (const rev of [false, true]) {
    const Q = rev ? [...SJ_RING].reverse() : SJ_RING
    for (let o = 0; o < n; o++) {
      let sn = 0, cs = 0
      for (let i = 0; i < n; i++) {
        const a = Q[(i + o) % n]
        const ax = a.x - ca.x, az = a.z - ca.z, bx = R[i].x - cb.x, bz = R[i].z - cb.z
        cs += ax * bx + az * bz
        sn += ax * bz - az * bx
      }
      const th = Math.atan2(sn, cs), c = Math.cos(th), s = Math.sin(th)
      let e = 0
      for (let i = 0; i < n; i++) {
        const a = Q[(i + o) % n]
        const ax = a.x - ca.x, az = a.z - ca.z
        e += (ax * c - az * s - (R[i].x - cb.x)) ** 2 + (ax * s + az * c - (R[i].z - cb.z)) ** 2
      }
      if (e < best.res) best = { c, s, tx: cb.x - (ca.x * c - ca.z * s), tz: cb.z - (ca.x * s + ca.z * c), res: e }
    }
  }
  return best
}

/**
 * St. Joseph's Hospital, 355 Buena Vista Avenue East (1928, Bakewell & Brown; now condominiums): a long six-storey block of
 * pale pink-beige stucco in stepped wings round a courtyard-less spine, red clay-tile hipped roofs with deep eaves over each
 * wing, a base storey of tall round-arched windows under a belt course, regular punched windows above, a cornice under the
 * eaves, and a taller pavilion at the street end with its own hip. Photographs: docs/shots/refs/notable/st-josephs/
 * wiki-image (the park side, the key reference), mapillary-0 and -2 (the arched base storey and the cornice); -1 and -3 are
 * neighbouring houses and -4 is trees.
 *
 * Orientation: the plan is drawn in OSM's own frame and carried onto the fit's ring by a Procrustes fit (as Temple Emanu-El),
 * so nothing depends on vertex order. The storeys are counted up from the ground beside each wall (`fit.groundAt`), the
 * eaves held at one level: the street side is shorter and the downhill side shows extra storeys.
 *
 * Where the photographs overruled the numbers: LiDAR's single footprint covers only the south-west part, so the eaves come
 * from the pack's 24-27 m and the photographs' six storeys over the arched base.
 */
function stJosephsHospital_355_BuenaVista(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const T = sjPlace(fit.ring)
  const gAt = (x: number, z: number): number =>
    Math.max(0, fit.groundAt ? fit.groundAt(x * T.c - z * T.s + T.tx, x * T.s + z * T.c + T.tz) : (fit.grade ?? 0))
  const ring = SJ_RING
  const n = ring.length
  const Y_E = 21.6 + Math.min(4, fit.grade ?? 0)                       // the eaves: six floors over the street-side base
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n]
    const l = Math.hypot(b.x - a.x, b.z - a.z)
    if (l < 0.3) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l, nx = tz, nz = -tx, h = Math.atan2(nx, nz)
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2
    const gE = Math.min(Y_E - 9, gAt(mx + nx * 1.5, mz + nz * 1.5))      // the ground beside this wall
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void =>
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    const slab = (u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb, tag: number): void => {
      const w = P((u0 + u1) / 2, (y0 + y1) / 2, (pr0 + pr1) / 2)
      boxAlong(m, w[0], w[1], w[2], (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, tag)
    }
    const open = (u: number, y0: number, spring: number, hw: number, rise: number, c: Rgb, tag: number, proud: number, seg = 5): void => {
      const w = P(u, 0)
      emOpening(m, w[0], w[2], tx, tz, nx, nz, y0, spring, hw, rise, c, tag, proud, seg)
    }
    const yB = gE + 4.9                                                   // the belt course over the arched base storey
    panel(0, l, -3, gE + 1.0, 0.03, SJ_WALL_LO, ST)
    panel(0, l, gE + 1.0, yB, 0, SJ_WALL, ST)
    panel(0, l, yB, Y_E, 0, SJ_WALL, ST)
    if (l < 1.2) continue
    slab(-0.05, l + 0.05, yB, yB + 0.4, 0, 0.3, SJ_TRIM, ST)              // the belt
    slab(-0.1, l + 0.1, Y_E - 0.7, Y_E, 0, 0.55, SJ_TRIM, ST)             // the cornice
    slab(-0.1, l + 0.1, Y_E - 1.05, Y_E - 0.7, 0, 0.3, SJ_WALL_LO, ST)
    if (l < 2.6) continue
    const k = Math.max(1, Math.floor((l - 1.4) / 3.5))
    const nF = Math.max(1, Math.floor((Y_E - 1.4 - (yB + 0.9)) / 3.15))
    const pitch = (Y_E - 1.4 - (yB + 0.9)) / nF
    for (let j = 0; j < k; j++) {
      const u = 0.7 + ((l - 1.4) * (j + 0.5)) / k
      // the arched base storey: a surround, then the glazing with its mullions
      open(u, gE + 0.9, gE + 3.2, 1.05, 1.05, SJ_TRIM, ST, 0.07)
      open(u, gE + 0.95, gE + 3.2, 0.9, 0.9, SJ_GLASS, GL, 0.1)
      open(u, gE + 0.95, gE + 4.1, 0.03, 0, SJ_TRIM, ST, 0.13)
      for (let r = 0; r < nF; r++) {
        const y0 = yB + 0.9 + pitch * r
        open(u, y0, y0 + 1.85, 0.6, 0, SJ_TRIM, ST, 0.05)
        open(u, y0 + 0.07, y0 + 1.8, 0.5, 0, SJ_GLASS, GL, 0.09)
      }
    }
  }

  // flat links under and between the hips
  capPolygonWithHoles(m, [ring.slice().reverse()], Y_E, SJ_TAR, surfaceTag('concrete'))

  /** a hipped tile roof over an oriented rectangle: centre, direction of the long axis, half length and half width */
  const wingRoof = (cx: number, cz: number, dx: number, dz: number, hl: number, hw: number, y0: number, rise: number, over = 1.1): void => {
    const sub = new MeshBuilder()
    const iz = hw + over - 0.3
    emHip(sub, -hl - over, hl + over, -hw - over, hw + over, y0, rise, iz, iz, SJ_TILE)
    emanuElCopy(m, sub, dx, dz, cx, cz)
  }
  /** the taller end pavilion: a stage over the eaves with its own windows, then a steeper hip */
  const pavilion = (cx: number, cz: number, dx: number, dz: number, hl: number, hw: number, hStage: number): void => {
    const sub = new MeshBuilder()
    emBlock(sub, -hl, hl, -hw, hw, Y_E - 0.05, Y_E + hStage, SJ_WALL)
    emBlock(sub, -hl - 0.3, hl + 0.3, -hw - 0.3, hw + 0.3, Y_E + hStage - 0.5, Y_E + hStage, SJ_TRIM)
    const cs: [P2, P2, number, number][] = [
      [{ x: -hl, z: -hw }, { x: hl, z: -hw }, 0, -1], [{ x: hl, z: -hw }, { x: hl, z: hw }, 1, 0],
      [{ x: hl, z: hw }, { x: -hl, z: hw }, 0, 1], [{ x: -hl, z: hw }, { x: -hl, z: -hw }, -1, 0]]
    for (const [p, q, nx, nz] of cs) emRow(sub, p, q, nx, nz, Y_E + 0.7, Y_E + 2.4, 0.5, 0.5, 3.4, SJ_GLASS, GL)
    emHip(sub, -hl - 1.0, hl + 1.0, -hw - 1.0, hw + 1.0, Y_E + hStage, 4.6, hw + 0.7, hw + 0.7, SJ_TILE)
    emanuElCopy(m, sub, dx, dz, cx, cz)
  }
  const dB = { x: 0.182, z: 0.983 }, dD = { x: 0.846, z: 0.533 }, dA = { x: 0.985, z: -0.174 }
  const rise = 4.2
  wingRoof(-0.2, -16.9, dA.x, dA.z, 14.2, 7.4, Y_E + 0.1, rise)                // the south arm
  wingRoof(-16.08, 20.64, dB.x, dB.z, 27.0, 6.9, Y_E + 0.1, rise)              // the long spine
  wingRoof(5.16, 58.84, dD.x, dD.z, 15.7, 7.6, Y_E + 0.1, rise)                // the north-east wing
  pavilion(-22.75, -15.34, dB.x, dB.z, 9.4, 6.6, 3.0)                         // the taller street-end block

  // chimneys and little roof stacks
  for (const [x, z, top] of [[-14, 12, 4.8], [-10.5, 30, 4.4], [4, 60, 4.2], [-2, -18, 4.6]] as [number, number, number][]) {
    emBlock(m, x - 0.6, x + 0.6, z - 0.5, z + 0.5, Y_E + 2, Y_E + 2 + top, SJ_WALL_LO)
    emBlock(m, x - 0.75, x + 0.75, z - 0.65, z + 0.65, Y_E + 2 + top, Y_E + 2.3 + top, SJ_TRIM)
  }

  emanuElCopy(out, m, T.c, T.s, T.tx, T.tz)
}

// ---------------------------------------------------------------------------------------------------------------
// Rialto Building, 116 New Montgomery Street at Mission
// ---------------------------------------------------------------------------------------------------------------

const RB_BRICK: Rgb = [0.69, 0.53, 0.38]        // buff tan brick (wiki-image.jpg; was too orange)
const RB_BRICK_LT: Rgb = [0.74, 0.58, 0.42]
const RB_BRICK_DK: Rgb = [0.62, 0.47, 0.34]      // the court and party walls
const RB_STONE: Rgb = [0.74, 0.69, 0.6]         // #c9bba3 stone base and trim, weathered
const RB_CORN: Rgb = [0.78, 0.72, 0.62]         // #cfc2a8 cornice
const RB_GLASS: Rgb = [0.13, 0.16, 0.19]
const RB_SHOP: Rgb = [0.1, 0.13, 0.15]
const RB_FRAME: Rgb = [0.72, 0.68, 0.6]
const RB_ROOF: Rgb = [0.4, 0.38, 0.36]

/**
 * The Rialto Building, 116 New Montgomery Street at Mission (1902, Meyer & O'Brien with Walter Danforth Bliss, Renaissance
 * Revival): a nine-storey buff-brick office block with a two-storey rusticated stone base (big shop windows between
 * rusticated piers, an ornate round-arched entrance with a smaller arch beside it), a stone belt, seven brick storeys of
 * stone-framed window groups between brick piers, then a frieze storey of small paired windows under a deep projecting
 * dentilled cornice. A light court cuts into the back of the plan, so the brick "U" has two New Montgomery fronts either
 * side of it. Photographs: docs/shots/refs/notable/rialto/ wiki-image.jpg (the whole block: brick shaft, stone base,
 * cornice), mapillary-3 (the arched entrance, MDCCCCI lettering, cartouche), -2 (the shaft and base head-on: groups of three
 * windows in stone surrounds, brick piers, shop windows with a spandrel), -0 (the Mission front). -1 is a neighbour, ignored.
 *
 * Orientation: the manifest says front 46 (New Montgomery), so the fronts are the long ring edges whose outward normal faces
 * local -z; Mission is the long edge facing +x (bearing 315, measured). Both are found from the ring's geometry in the fit
 * frame, never from OSM's vertex order; the court and the party walls get plain brick.
 *
 * Where the photographs overruled the numbers: OSM's flat 34 m and the Assessor's nine storeys agree with the photographs,
 * but the photographs show the ninth storey is the frieze under the cornice, so the brick shaft is seven storeys over the
 * two-storey base; the base is stone with rustication on its piers, not brick.
 */
function rialtoBuilding_116_NewMontgomery(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const BK = surfaceTag('brick')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const TOP = 34, Y_BASE = 7.6, Y_FR = 30.6, Y_FRT = 32.4

  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  // the front edges (-z) and the Mission edge (+x); the entrance goes on the longest front edge
  const isFront = (e: typeof info[number]): boolean => e.l > 12 && e.nz < -0.85
  const isMission = (e: typeof info[number]): boolean => e.l > 12 && e.nx > 0.85
  const fronts = info.filter(isFront)
  const entr = fronts.length ? fronts.reduce((p, c) => (c.l > p.l ? c : p)).i : -1

  for (const e of info) {
    const { a, b, l, nx, nz } = e
    if (l < 0.5) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    const h = Math.atan2(nx, nz)
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const slab = (u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb): void => {
      boxAlong(m, a.x + tx * (u0 + u1) / 2 + nx * (pr0 + pr1) / 2, (y0 + y1) / 2, a.z + tz * (u0 + u1) / 2 + nz * (pr0 + pr1) / 2,
        (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, ST)
    }
    const op = (u: number, y0: number, y1: number, hw: number, rise: number, c: Rgb, tag: number, proud: number, seg = 6): void => {
      emOpening(m, a.x + tx * u, a.z + tz * u, tx, tz, nx, nz, y0, y1, hw, rise, c, tag, proud, seg)
    }
    const street = isFront(e) || isMission(e)

    if (!street) {
      // the court and party walls: plain darker brick, a few punched windows, a modest cornice
      panel(0, l, -3, TOP, 0, RB_BRICK_DK, BK)
      for (let y = 2; y < TOP - 1; y += 3.2) panel(0, l, y, y + 0.06, 0.015, RB_BRICK, BK)
      if (l > 4) {
        const k = Math.floor((l - 1.5) / 3.4)
        for (let j = 0; j < k; j++) {
          const u = 0.75 + ((l - 1.5) * (j + 0.5)) / k
          for (let r = 0; r < 8; r++) {
            const y0 = 3.2 + 3.35 * r
            panel(u - 0.55, u + 0.55, y0, y0 + 1.7, 0.06, RB_GLASS, GL)
          }
        }
      }
      slab(-0.1, l + 0.1, TOP - 1.0, TOP, 0, 0.45, RB_CORN)
      continue
    }

    // ---- the wall and the stone base ------------------------------------------------------------------------------------
    panel(0, l, -3, TOP, 0, RB_BRICK, BK)
    for (let y = 8.2; y < Y_FR; y += 1.6) panel(0, l, y, y + 0.05, 0.015, RB_BRICK_LT, BK)       // brick courses
    panel(0, l, -3, Y_BASE, 0.1, RB_STONE, BK)                                                   // the stone base
    slab(-0.1, l + 0.1, Y_BASE, Y_BASE + 0.55, 0, 0.4, RB_STONE)                                  // the belt course over it
    slab(-0.1, l + 0.1, 0, 0.5, 0, 0.3, RB_STONE)                                                  // the plinth

    const kb = Math.max(2, Math.round(l / 5.0))
    const w = l / kb
    const door = e.i === entr ? Math.floor(kb / 2) : -1
    for (let j = 0; j <= kb; j++) {                                                               // rusticated piers
      const u = w * j
      const u0 = Math.max(0, u - 0.62), u1 = Math.min(l, u + 0.62)
      slab(u0, u1, 0.5, Y_BASE, 0, 0.28, RB_STONE)
      for (let y = 1.4; y < Y_BASE; y += 0.95) panel(u0, u1, y, y + 0.07, 0.29, RB_FRAME, ST)   // the rustication joints
    }
    for (let j = 0; j < kb; j++) {
      const uc = w * (j + 0.5), hw = w / 2 - 0.85
      if (j === door) {
        // the ornate round-arched entrance: a stone surround, dark doorway, keystone cartouche, the lettered frieze above
        op(uc, 0, 3.6, hw + 0.2, hw + 0.2, RB_STONE, BK, 0.34, 10)
        op(uc, 0, 3.4, hw - 0.25, hw - 0.25, RB_SHOP, GL, 0.4, 10)
        op(uc, 0, 3.4, 0.05, hw - 0.25, RB_FRAME, ST, 0.44, 10)
        slab(uc - hw - 0.5, uc + hw + 0.5, 0.5, 0.75, 0, 0.7, RB_STONE)                           // the step
        slab(uc - 0.45, uc + 0.45, 3.4 + hw + 0.1, 3.4 + hw + 1.1, 0.34, 0.6, RB_STONE)          // the keystone cartouche
        slab(uc - hw - 0.3, uc + hw + 0.3, 6.0, 7.0, 0.28, 0.5, RB_CORN)                          // the lettered frieze block
        panel(uc - hw, uc + hw, 6.25, 6.7, 0.51, [0.42, 0.38, 0.33], ST)
        continue
      }
      // shop window and mezzanine window, a stone spandrel panel between
      op(uc, 0.9, 3.3, hw, 0, RB_SHOP, GL, 0.16)
      op(uc, 0.9, 3.3, 0.05, 0, RB_FRAME, ST, 0.2)
      op(uc, 4.0, 6.6, hw, 0, RB_SHOP, GL, 0.16)
      op(uc, 4.0, 6.6, 0.05, 0, RB_FRAME, ST, 0.2)
      slab(uc - hw - 0.15, uc + hw + 0.15, 3.3, 4.0, 0.08, 0.3, RB_STONE)                         // the spandrel
      slab(uc - hw - 0.15, uc + hw + 0.15, 6.6, 6.9, 0.08, 0.32, RB_STONE)                        // the lintel
    }

    // ---- the brick shaft: groups of three windows in stone surrounds between brick piers -----------------------------------
    for (let j = 0; j < kb; j++) {
      const uc = w * (j + 0.5), hw = Math.min(w / 2 - 0.75, 2.0)
      for (let r = 0; r < 7; r++) {
        const y0 = 8.8 + 3.2 * r, y1 = y0 + 2.0
        op(uc, y0 - 0.2, y1 + 0.25, hw + 0.18, 0, RB_STONE, BK, 0.1)                              // the stone surround
        op(uc, y0, y1, hw, 0, RB_GLASS, GL, 0.18)
        for (const s of [-1, 1]) op(uc + s * hw / 3, y0, y1, 0.06, 0, RB_FRAME, ST, 0.22)         // the two mullions
        slab(uc - hw - 0.3, uc + hw + 0.3, y0 - 0.38, y0 - 0.2, 0, 0.26, RB_STONE)               // the sill
      }
    }
    panel(0, l, Y_FR, Y_FRT, 0.05, RB_CORN, ST)                                                    // the stone frieze ground
    for (let j = 0; j < kb; j++) {                                                                  // windows cut through it
      const uc = w * (j + 0.5)
      for (const s of [-1, 1]) {
        op(uc + s * 0.85, 30.95, 32.05, 0.4, 0, RB_STONE, BK, 0.12)
        op(uc + s * 0.85, 31.05, 31.95, 0.3, 0, RB_GLASS, GL, 0.18)
      }
      slab(uc - 0.3, uc + 0.3, Y_FR + 0.1, Y_FRT - 0.1, 0.05, 0.2, RB_STONE)                      // the carved boss between them
    }
    slab(-0.1, l + 0.1, Y_FR - 0.35, Y_FR, 0, 0.5, RB_STONE)                                        // the belt under the frieze
    slab(-0.2, l + 0.2, Y_FRT, Y_FRT + 0.4, 0, 0.7, RB_CORN)                                       // the architrave
    for (let u = 0.2; u < l - 0.2; u += 1.0) slab(u, u + 0.5, Y_FRT + 0.4, Y_FRT + 0.8, 0.3, 0.75, RB_CORN)   // the dentils
    slab(-0.4, l + 0.4, Y_FRT + 0.8, TOP - 0.35, 0, 1.45, RB_CORN)                                 // the deep projecting cornice
    slab(-0.5, l + 0.5, TOP - 0.35, TOP, 0, 1.6, RB_STONE)                                         // the cap
  }

  capPolygonWithHoles(m, [ring], TOP - 0.2, RB_ROOF, surfaceTag('concrete'))

  // the model is already in the fit's own frame
  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// Fourth Church of Christ, Scientist (now the Internet Archive), 300 Funston Avenue
// ---------------------------------------------------------------------------------------------------------------

const FC_IV: Rgb = [0.937, 0.925, 0.894]       // #efece4, the white/ivory stone
const FC_SH: Rgb = [0.784, 0.776, 0.753]       // #c8c6c0, the shadowed recess
const FC_LINE: Rgb = [0.84, 0.83, 0.8]
const FC_DOOR: Rgb = [0.24, 0.15, 0.13]
const FC_GLASS: Rgb = [0.16, 0.18, 0.22]
const FC_ROOF: Rgb = [0.8, 0.8, 0.78]
const FC_CN = surfaceTag('concrete')

/**
 * The Fourth Church of Christ, Scientist (1923), now the Internet Archive, 300 Funston Avenue: a white Greek temple. The
 * Funston (west) front has SIX giant fluted Ionic columns standing in front of a recessed wall with three tall arched doors,
 * between two solid end bays, under a deep plain entablature (inscribed frieze, projecting cornice) and a raised attic with
 * urns at its corners; wide steps climb to the portico. The Clement (north) side and the rear are plain white walls with
 * pilasters and tall arched windows. Photographs: docs/shots/refs/notable/fourth-church/ (wiki-image from the corner,
 * mapillary-0 the portico's end and steps, -1 the Clement side, -2 the front across Funston).
 *
 * Orientation: the manifest gives front 267 (Funston, measured), so the fit's FRONT is local -z. The portico is placed on the
 * ring's front-facing edges (outward normal toward -z) and nothing depends on OSM's vertex order.
 * Photographs overruled the pack: the side wall is plain ashlar with pilasters and high arched windows, not a second colonnade.
 */
function fourthChurchScientist_300_Funston(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  const n = ring.length
  // front-facing edges (outward normal toward -z) within 3.5 m of the frontmost ring z, grouped by x; the longest group is the
  // main front, and the edges within 1.5 m of its frontmost z are the portico's line (the end bays stand a little behind it)
  let zmin0 = Infinity
  for (const p of ring) zmin0 = Math.min(zmin0, p.z)
  type Fe = { i: number; x0: number; x1: number; z: number }
  const fe: Fe[] = []
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    if ((b.x - a.x) / l > 0.9 && l > 2 && (a.z + b.z) / 2 < zmin0 + 3.5) fe.push({ i, x0: a.x, x1: b.x, z: (a.z + b.z) / 2 })
  }
  fe.sort((p, q) => p.x0 - q.x0)
  const groups: Fe[][] = []
  for (const e of fe) {
    const g = groups[groups.length - 1]
    if (g && e.x0 - g[g.length - 1].x1 < 3) g.push(e); else groups.push([e])
  }
  const span = (g: Fe[]): number => g[g.length - 1].x1 - g[0].x0
  const grp = groups.sort((p, q) => span(q) - span(p))[0] ?? [{ i: -1, x0: -fit.hx, x1: fit.hx, z: -fit.hz }]
  const zf = Math.min(...grp.map((e) => e.z))
  const porch = grp.filter((e) => e.z < zf + 1.5)
  const isFront: boolean[] = ring.map((_, i) => porch.some((e) => e.i === i))
  const px0 = Math.min(...porch.map((e) => e.x0)), px1 = Math.max(...porch.map((e) => e.x1))
  const gx0 = grp[0].x0, gx1 = grp[grp.length - 1].x1                 // the whole main front, end bays included
  const c0 = (px0 + px1) / 2
  const PW = px1 - px0
  const gP = Math.min(4, Math.max(0, fit.groundAt ? fit.groundAt(c0, zf - 2) : fit.grade ?? 0))
  const H1 = gP + 14.4, TOP = gP + 16.4, PLAT = gP + 1.7, COL1 = gP + 11.6
  const DEP = Math.min(5.6, Math.max(2.6, (grp.find((e) => e.z >= zf + 1.5)?.z ?? zf + 3.1) - zf)), PIER = Math.min(3.4, PW / 6)
  const bx = (x0: number, x1: number, d0: number, d1: number, y0: number, y1: number, c: Rgb, tag = FC_CN): void =>
    boxAlong(m, (x0 + x1) / 2, (y0 + y1) / 2, zf + (d0 + d1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (d1 - d0) / 2, 0, c, tag)
  const xa = c0 - PW / 2, xb = c0 + PW / 2
  /** a face looking out of the front (toward -z) at depth d (d<0 = in front of the front plane) */
  const fF = (x0: number, x1: number, d: number, y0: number, y1: number, c: Rgb, tag = FC_CN): void => {
    m.quad([[x1, y0, zf + d], [x0, y0, zf + d], [x0, y1, zf + d], [x1, y1, zf + d]], [0, 0, -1], uv, c, tag)
  }

  // ---- the walls: ring edges, pilasters, tall arched windows, a cornice ----------------------------------------------
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n]
    const l = Math.hypot(b.x - a.x, b.z - a.z)
    if (l < 0.5 || isFront[i]) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l, nx = tz, nz = -tx
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag = FC_CN): void => {
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const h = Math.atan2(nx, nz)
    panel(0, l, 0, H1, 0, FC_IV)
    if (l > 5) {
      // pilasters every ~6 m, tall arched windows between them
      const k = Math.max(1, Math.round((l - 1.2) / 6.2))
      for (let j = 0; j <= k; j++) {
        const u = 0.6 + ((l - 1.2) * j) / k
        const p = P(u, 0, 0.2)
        boxAlong(m, p[0], (gP + 0.4 + H1 - 0.3) / 2, p[2], 0.45, (H1 - 0.7 - gP - 0.4) / 2, 0.2, h, FC_IV, FC_CN)
      }
      for (let j = 0; j < k; j++) {
        const u = 0.6 + ((l - 1.2) * (j + 0.5)) / k
        panel(u - 0.9, u + 0.9, gP + 4.8, gP + 11.2, 0.04, FC_SH)
        panel(u - 0.7, u + 0.7, gP + 5.0, gP + 10.6, 0.08, FC_GLASS, GL)
        panel(u - 0.45, u + 0.45, gP + 10.6, gP + 11.0, 0.08, FC_GLASS, GL)
      }
    }
    const cx = a.x + tx * l / 2, cz = a.z + tz * l / 2
    boxAlong(m, cx + nx * 0.4, H1 - 0.55, cz + nz * 0.4, l / 2 + 0.3, 0.55, 0.4, h, FC_IV, FC_CN)         // frieze and cornice
    boxAlong(m, cx + nx * 0.7, H1 + 0.2, cz + nz * 0.7, l / 2 + 0.5, 0.2, 0.7, h, FC_IV, FC_CN)
  }
  capPolygonWithHoles(m, [ring], H1 + 0.4, FC_ROOF, FC_CN)
  // the raised attic block over the nave, set back from the walls
  let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity
  for (const p of ring) { xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x); zmin = Math.min(zmin, p.z); zmax = Math.max(zmax, p.z) }
  bx(gx0 + 1.0, gx1 - 1.0, 0.6, zmax - zf - 6, H1 + 0.4, TOP, FC_IV)
  bx(gx0 + 0.7, gx1 - 0.7, 0.3, zmax - zf - 5.7, TOP, TOP + 0.35, FC_LINE)

  // ---- the Funston front: end bays, recessed wall with doors, six columns, entablature, attic, steps ------------------
  const xi0 = xa + PIER, xi1 = xb - PIER
  bx(xa, xi0, 1.9, DEP, 0, COL1, FC_IV)                              // the two solid end bays, behind the end columns
  bx(xi1, xb, 1.9, DEP, 0, COL1, FC_IV)
  bx(xa, xi0, 0.3, 1.9, 0, PLAT, FC_IV)                              // the podium the end columns stand on
  bx(xi1, xb, 0.3, 1.9, 0, PLAT, FC_IV)
  for (const xm of [xa + PIER / 2, xb - PIER / 2]) {                  // a round medallion on each bay (mapillary-0)
    fF(xm - 0.6, xm + 0.6, 1.88, gP + 7.9, gP + 9.1, FC_SH)
    fF(xm - 0.35, xm + 0.35, 1.86, gP + 8.15, gP + 8.85, FC_LINE)
    fF(xm - 0.45, xm + 0.45, 1.88, gP + 3.6, gP + 6.0, FC_GLASS, GL)  // the pierced panel low on the bay
  }
  bx(xi0, xi1, 0.5, DEP, 0, PLAT, FC_IV)                              // the portico floor
  fF(xi0, xi1, DEP - 0.02, PLAT, COL1, FC_SH)                         // the recessed wall
  const doorW = 2.3, dxs = [-1, 0, 1].map((j) => c0 + j * ((xi1 - xi0) / 3.2))
  for (const x of dxs) {
    fF(x - doorW / 2 - 0.25, x + doorW / 2 + 0.25, DEP - 0.05, PLAT, PLAT + 7.0, FC_IV)
    fF(x - doorW / 2, x + doorW / 2, DEP - 0.1, PLAT, PLAT + 5.2, FC_DOOR)
    fF(x - doorW / 2 + 0.1, x + doorW / 2 - 0.1, DEP - 0.12, PLAT + 5.2, PLAT + 6.0, FC_SH)
    fF(x - 0.55, x + 0.55, DEP - 0.1, PLAT + 8.4, PLAT + 9.4, FC_GLASS, GL)         // the small windows above the doors
  }
  m.quad([[xi0, COL1, zf + DEP], [xi1, COL1, zf + DEP], [xi1, COL1, zf], [xi0, COL1, zf]], [0, -1, 0], uv, FC_SH, FC_CN)   // soffit
  // wide steps across the whole portico, seven risers
  for (let j = 1; j <= 7; j++) bx(xa - 0.3, xb + 0.3, -0.6 * (8 - j), 0.5, 0, gP + (PLAT - gP) * (j / 7), FC_IV)
  bx(xa - 0.6, xa + 0.7, -4.8, 0.5, 0, PLAT + 0.7, FC_IV)             // the cheek blocks at the foot, each with an urn
  bx(xb - 0.7, xb + 0.6, -4.8, 0.5, 0, PLAT + 0.7, FC_IV)
  for (const x of [xa + 0.05, xb - 0.05]) {
    prism(m, x, zf - 4.2, PLAT + 0.7, PLAT + 1.2, 0.45, 8, FC_IV, FC_CN)
    prism(m, x, zf - 4.2, PLAT + 1.2, PLAT + 2.3, 0.4, 8, FC_IV, FC_CN, 0.2)
  }
  // the six giant fluted Ionic columns, evenly across the front
  const S = (PW - 4) / 5
  for (let i = 0; i < 6; i++) {
    const x = c0 + (i - 2.5) * S
    classicalColumn(m, x, zf + 0.9, PLAT, COL1, 0.78, FC_IV, { order: 'ionic', tag: FC_CN, heading: Math.PI, trim: FC_IV, flutes: true })
  }
  // second row of columns behind each end column, as the photographs show the corner pairs
  for (const x of [c0 - 2.5 * S, c0 + 2.5 * S]) {
    classicalColumn(m, x, zf + 4.1, PLAT, COL1, 0.7, FC_IV, { order: 'ionic', tag: FC_CN, heading: Math.PI, trim: FC_IV, flutes: true })
  }
  // architrave, frieze (the inscription band), the deep projecting cornice, the attic with urns at its corners
  bx(xa, xb, 0.1, 0.0 + DEP, COL1, COL1 + 1.0, FC_IV)
  bx(xa - 0.1, xb + 0.1, -0.15, DEP, COL1 + 1.0, COL1 + 2.2, FC_IV)
  fF(xa + 2.5, xb - 2.5, -0.17, COL1 + 1.4, COL1 + 1.9, FC_SH)
  bx(xa - 0.4, xb + 0.4, -0.9, DEP, COL1 + 2.2, COL1 + 3.0, FC_IV)
  bx(xa + 0.2, xb - 0.2, -0.1, 3.4, COL1 + 3.0, TOP + 0.3, FC_IV)
  fF(xa + 3.5, xb - 3.5, -0.12, TOP - 1.4, TOP - 0.7, FC_SH)         // the cut lettering, FOURTH CHURCH OF CHRIST, SCIENTIST
  bx(xa + 0.2, xb - 0.2, -0.3, 3.4, TOP + 0.3, TOP + 0.55, FC_LINE)
  for (const [x, d] of [[xa + 0.9, -0.1], [xb - 0.9, -0.1], [xa + 0.9, 2.6], [xb - 0.9, 2.6], [c0 - 5, -0.1], [c0 + 5, -0.1]] as [number, number][]) {
    const y = TOP + 0.55
    prism(m, x, zf + d, y, y + 0.4, 0.5, 8, FC_IV, FC_CN)
    prism(m, x, zf + d, y + 0.4, y + 1.5, 0.38, 8, FC_IV, FC_CN, 0.52)
    prism(m, x, zf + d, y + 1.5, y + 1.8, 0.2, 8, FC_IV, FC_CN)
  }

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  out.uvs.push(...m.uvs)
  out.colors.push(...m.colors)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// Paige Motor Car Company Building, 1699 Van Ness Avenue at Sacramento
// ---------------------------------------------------------------------------------------------------------------

const PG_TC: Rgb = [0.85, 0.79, 0.64]          // #d9c9a4 terra cotta
const PG_TC_LT: Rgb = [0.9, 0.84, 0.7]
const PG_TC_DK: Rgb = [0.74, 0.68, 0.54]       // party walls, shadowed mouldings
const PG_WHITE: Rgb = [0.94, 0.94, 0.91]       // #efefe8 window frames
const PG_GLASS: Rgb = [0.13, 0.15, 0.18]
const PG_INFILL: Rgb = [0.17, 0.18, 0.2]       // #2c2f33 the dark arch infill
const PG_ROOF: Rgb = [0.4, 0.38, 0.36]

/**
 * The Paige Motor Car Company Building, 1699 Van Ness Avenue at Sacramento (1919, auto showroom): a cream terra-cotta corner
 * block. Ground storey: a giant arcade of round arches (dark infill, shopfront glass low in each, a moulded surround, round
 * medallions in the spandrels). Above a belt course, two storeys of big white-framed divided-light windows (three panes
 * across, three rows per storey) in wide bays between slim piers, then a deep bracketed cornice with a dentil band. Flat roof.
 * Photographs: docs/shots/refs/notable/paige/ wiki-image (the corner, ground truth), mapillary-0/1 (the arcade close up,
 * medallions, window grids), -2 (the corner from across Van Ness).
 *
 * Orientation: the manifest gives front 81 (Van Ness, measured), so the fit's front is local -z and Van Ness is the long ring
 * edge facing -z; Sacramento (bearing 351) is the long edge facing +x. Both are found from ring geometry in the fit frame and
 * dressed alike; the other two sides are plain party walls with a cornice.
 * Photographs vs numbers: OSM's 16 m and the pack's "two storeys over the arcade" agree; the Assessor's four storeys is the
 * arcade plus two window storeys plus the cornice storey, so the model shows the three the photographs show.
 */
function paigeMotorCar_1699_VanNess(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const CN = surfaceTag('concrete')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const TOP = 16, Y_SP = 4.3, Y_BELT = 7.2, Y_W0 = 8.1, Y_W1 = 14.0, Y_FR = 14.2

  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  const isStreet = (e: typeof info[number]): boolean => e.l > 12 && (e.nz < -0.85 || e.nx > 0.85)

  for (const e of info) {
    const { a, b, l, nx, nz } = e
    if (l < 0.5) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    const h = Math.atan2(nx, nz)
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const slab = (u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb): void => {
      boxAlong(m, a.x + tx * (u0 + u1) / 2 + nx * (pr0 + pr1) / 2, (y0 + y1) / 2, a.z + tz * (u0 + u1) / 2 + nz * (pr0 + pr1) / 2,
        (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, CN)
    }
    const op = (u: number, y0: number, y1: number, hw: number, rise: number, c: Rgb, tag: number, proud: number, seg = 8): void => {
      emOpening(m, a.x + tx * u, a.z + tz * u, tx, tz, nx, nz, y0, y1, hw, rise, c, tag, proud, seg)
    }

    if (!isStreet(e)) {
      panel(0, l, -3, TOP, 0, PG_TC_DK, CN)
      slab(-0.1, l + 0.1, TOP - 1.4, TOP, 0, 0.9, PG_TC)
      continue
    }

    panel(0, l, -3, TOP, 0, PG_TC, CN)
    slab(-0.1, l + 0.1, 0, 0.45, 0, 0.3, PG_TC_DK)                                                    // the plinth
    const kb = Math.max(3, Math.round(l / 5.2))
    const w = l / kb
    const hw = w / 2 - 0.62

    // ---- the ground arcade: piers, round arches with moulded surrounds, dark infill, shopfront glass --------------------
    for (let j = 0; j <= kb; j++) {
      const u = w * j, u0 = Math.max(0, u - 0.62), u1 = Math.min(l, u + 0.62)
      slab(u0, u1, 0.45, Y_SP, 0, 0.3, PG_TC)                                                         // the arcade piers
      slab(u0 - 0.06, u1 + 0.06, Y_SP, Y_SP + 0.22, 0, 0.36, PG_TC_LT)                                // impost blocks
    }
    for (let j = 0; j < kb; j++) {
      const uc = w * (j + 0.5)
      op(uc, 0.45, Y_SP, hw + 0.32, hw + 0.32, PG_TC_LT, CN, 0.12, 10)                                 // the moulded arch surround
      op(uc, 0.45, Y_SP, hw, hw, PG_INFILL, GL, 0.22, 10)                                              // the dark infill
      op(uc, 0.7, 2.4, hw - 0.1, 0, PG_GLASS, GL, 0.26)                                                 // the shopfront glass
      op(uc, 2.9, Y_SP + 0.8, hw - 0.3, 0, PG_GLASS, GL, 0.26)
      for (const s of [-1, 0, 1]) op(uc + s * hw * 0.55, 0.7, Y_SP + 0.8, 0.04, 0, [0.3, 0.31, 0.33], ST, 0.3)   // shopfront mullions
      slab(uc - 0.14, uc + 0.14, Y_SP + hw + 0.3, Y_SP + hw + 0.85, 0.08, 0.3, PG_TC_LT)               // the keystone
      // a round medallion over each pier between the arches
      if (j > 0) {
        const um = w * j, yc = Y_SP + 2.35
        for (let k = 0; k < 8; k++) {
          const a0 = (k / 8) * Math.PI * 2, a1 = ((k + 1) / 8) * Math.PI * 2, r = 0.38
          m.quad([P(um + Math.cos(a0) * r, yc + Math.sin(a0) * r, 0.2), P(um + Math.cos(a1) * r, yc + Math.sin(a1) * r, 0.2),
            P(um + Math.cos(a1) * r * 0.55, yc + Math.sin(a1) * r * 0.55, 0.2), P(um + Math.cos(a0) * r * 0.55, yc + Math.sin(a0) * r * 0.55, 0.2)],
          [nx, 0, nz], uv, PG_TC_DK, CN)
        }
        slab(um - 0.22, um + 0.22, yc - 0.22, yc + 0.22, 0.04, 0.2, PG_TC_LT)
      }
    }
    slab(-0.1, l + 0.1, Y_BELT - 0.5, Y_BELT + 0.15, 0, 0.5, PG_TC_LT)                               // the belt course over the arcade
    slab(-0.1, l + 0.1, Y_BELT + 0.15, Y_BELT + 0.4, 0, 0.35, PG_TC)

    // ---- two storeys of big divided-light windows between slim piers ---------------------------------------------------
    for (let j = 0; j <= kb; j++) {
      const u = w * j, u0 = Math.max(0, u - 0.5), u1 = Math.min(l, u + 0.5)
      slab(u0, u1, Y_BELT + 0.4, Y_FR, 0, 0.3, PG_TC_LT)                                               // the pier strips
      slab(u0 - 0.06, u1 + 0.06, Y_FR - 0.35, Y_FR, 0, 0.36, PG_TC)                                    // capitals under the cornice
      slab(u0 - 0.06, u1 + 0.06, Y_BELT + 0.4, Y_BELT + 0.6, 0, 0.36, PG_TC)                           // bases
    }
    const whw = w / 2 - 0.55
    for (let j = 0; j < kb; j++) {
      const uc = w * (j + 0.5)
      op(uc, Y_W0, Y_W1, whw + 0.1, 0, PG_TC_DK, CN, 0.06)                                              // the recess
      op(uc, Y_W0, Y_W1, whw, 0, PG_GLASS, GL, 0.14)                                                    // the glass, both storeys
      for (const s of [-1, 1]) op(uc + s * whw / 3, Y_W0, Y_W1, 0.04, 0, PG_WHITE, ST, 0.2)            // the mullions, 3 panes across
      for (const y of [Y_W0, 9.1, 10.1, 11.0, 11.5, 12.5, 13.5, Y_W1 - 0.08]) panel(uc - whw, uc + whw, y, y + 0.08, 0.2, PG_WHITE, ST)  // transoms: 3 rows per storey, a deeper bar between storeys
      for (const s of [-1, 1]) panel(uc + s * whw - 0.04, uc + s * whw + 0.04, Y_W0, Y_W1, 0.2, PG_WHITE, ST)
    }

    // ---- the bracketed cornice with its dentil band -----------------------------------------------------------------------
    panel(0, l, Y_FR, TOP - 1.0, 0.06, PG_TC, CN)                                                      // the frieze
    slab(-0.15, l + 0.15, Y_FR, Y_FR + 0.25, 0, 0.5, PG_TC_LT)                                          // the architrave
    for (let u = 0.15; u < l - 0.15; u += 0.55) slab(u, u + 0.28, Y_FR + 0.25, Y_FR + 0.6, 0.3, 0.55, PG_TC_DK)   // the dentil band
    for (let u = 0.3; u < l - 0.3; u += 1.5) slab(u, u + 0.4, Y_FR + 0.6, TOP - 0.45, 0.4, 0.95, PG_TC_LT)       // the brackets
    slab(-0.4, l + 0.4, TOP - 0.55, TOP, 0, 1.2, PG_TC)                                                  // the deep cornice
  }

  capPolygonWithHoles(m, [ring], TOP - 0.2, PG_ROOF, CN)

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// The Olympic Club, 524 Post Street
// ---------------------------------------------------------------------------------------------------------------

const OC_WHITE: Rgb = [0.85, 0.85, 0.83]         // #ecebe6 the white stone/stucco base and trim, a shade down for sun
const OC_WHITE_SH: Rgb = [0.72, 0.71, 0.68]      // its grooves and the shadow under the cornice
const OC_FRONT = -1                             // the front faces local -z in the fit frame (sign of nz); the city turns -z to the manifest bearing
// the brown brick of wiki-image (the shared BC_ red-brown rendered orange in the city), and no ivy: the photos
// disagree on which end carries it, and the wedge it drew read worse than none (review 2026-10-15)
const OC_BRICK: Rgb = [0.3, 0.17, 0.13]
const OC_BRICK_LT: Rgb = [0.34, 0.2, 0.15]
const OC_IVY = false
const OC_PINK: Rgb = [0.68, 0.42, 0.42]          // the faded pink iron balconettes (wiki-image)

/**
 * The Olympic Club, 524 Post Street (1912): a deep six-storey plot whose Post Street front is a white rusticated two-storey
 * base with a four-column portico (the columns in two pairs) and a balustraded ledge over it; above that, red-brown brick
 * with a row of tall ROUND-ARCHED windows on the third floor (cartouches between them), two rows of paired rectangular
 * windows (pink iron balconettes at the west end), a shorter top row, and a deep white modillioned cornice; flags on poles
 * over the entrance; ivy mantling the east end of the base (mapillary-2/-3).
 *
 * Photographs: docs/shots/refs/notable/olympic-club/ wiki-image.jpg (the key reference: the whole front along Post),
 * mapillary-0 (base/brick junction, arches, balustrade, portico), -1 (the west end: plain white base, lamp post, balconette),
 * -2 and -3 (the ivy). A delivery truck in -0 and -2 is ignored.
 *
 * Orientation: the manifest says front 171 (measured, Post Street), so the Post front is the ring's edges whose outward
 * normal faces local -z (the fit frame, as bohemianClub_624_Taylor does); there are two (a long one and a short one at a
 * slight angle). Edges are found from the ring's geometry, never OSM's vertex order. Every other edge is a party wall.
 *
 * Where the photographs overruled the numbers: the brief says the TOP windows are arched, but in wiki-image the arches are on
 * the floor just above the base and the top storey is rectangular pairs under the cornice; the Assessor's five storeys and
 * OSM's six agree with the photographs only if the base counts as two (it does: two window rows in white stone).
 */
function olympicClub_524_Post(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const BK = surfaceTag('brick')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const TOP = 27, ROOF = 26.6
  const Y_BASE = 9.5, Y_LEDGE = 10.4, Y_CORN = 24.8
  const rnd = (i: number): number => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  let main = 0
  main = info.reduce((bi, e) => (OC_FRONT * e.nz > 0.8 && (OC_FRONT * info[bi].nz <= 0.8 || e.l > info[bi].l) ? e.i : bi), 0)

  for (const e of info) {
    const { a, b, l, nx, nz } = e
    if (l < 0.5) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const h = Math.atan2(nx, nz)
    const cx = a.x + tx * l / 2, cz = a.z + tz * l / 2
    const front = OC_FRONT * nz > 0.8 && l > 2.5
    panel(0, l, -3, TOP, 0, OC_BRICK, BK)
    for (let y = 1.2; y < Y_CORN; y += 1.2) panel(0, l, y, y + 0.05, 0.015, OC_BRICK_LT, BK)       // brick courses
    if (!front) {                                                                                   // a party wall: plain brick, a stone cap
      boxAlong(m, cx + nx * 0.3, 26.5, cz + nz * 0.3, l / 2 + 0.2, 0.5, 0.3, h, OC_WHITE, BK)
      continue
    }

    // ---- the white rusticated base, two storeys
    panel(0, l, -3, Y_BASE, 0.08, OC_WHITE, ST)
    for (let y = 1.1; y < Y_BASE - 0.3; y += 1.1) panel(0, l, y, y + 0.07, 0.1, OC_WHITE_SH, ST)  // the rustication grooves
    panel(0, l, Y_BASE - 0.5, Y_BASE + 0.05, 0.3, OC_WHITE, ST)                                    // string course
    boxAlong(m, cx + nx * 0.45, Y_BASE + 0.25, cz + nz * 0.45, l / 2 + 0.05, 0.28, 0.45, h, OC_WHITE, ST) // the ledge
    // the balustrade: a white rail, dark gaps between the balusters, a coping
    boxAlong(m, cx + nx * 0.4, Y_LEDGE + 0.9, cz + nz * 0.4, l / 2 + 0.05, 0.07, 0.17, h, OC_WHITE, ST)
    panel(0, l, Y_LEDGE, Y_LEDGE + 0.85, 0.5, OC_WHITE, ST)
    for (let u = 0.25; u < l - 0.1; u += 0.5) panel(u, u + 0.22, Y_LEDGE + 0.1, Y_LEDGE + 0.8, 0.52, OC_WHITE_SH, ST)

    // ---- bays: nine on the long front, the short one gets what fits
    const k = Math.max(1, Math.floor((l - 2) / 3.6))
    const bay = (j: number): number => 1 + ((l - 2) * (j + 0.5)) / k
    const isMain = e.i === main
    let porticoBay = -1
    if (isMain) {
      let best = 1e9
      for (let j = 0; j < k; j++) { const d = Math.abs(bay(j) - l * 0.66); if (d < best) { best = d; porticoBay = j } }
    }
    const win = (u: number, y0: number, y1: number, hw: number, arch: boolean, pair: boolean): void => {
      const c0x = a.x + tx * u, c0z = a.z + tz * u
      const rise = arch ? hw : 0
      emOpening(m, c0x, c0z, tx, tz, nx, nz, y0 - 0.15, y1 - rise + 0.15, hw + 0.25, rise > 0 ? rise + 0.25 : 0, OC_WHITE, ST, 0.1, 8)
      emOpening(m, c0x, c0z, tx, tz, nx, nz, y0, y1 - rise, hw, rise, BC_GLASS, GL, 0.16, 8)
      emOpening(m, c0x, c0z, tx, tz, nx, nz, y0, y1 - rise, 0.05, rise, OC_WHITE, ST, 0.2, 2)       // the mullion
      if (!arch) {
        const yt = y0 + (y1 - y0) * 0.72
        emOpening(m, c0x, c0z, tx, tz, nx, nz, yt, yt + 0.08, hw, 0, OC_WHITE, ST, 0.2)
        emOpening(m, c0x, c0z, tx, tz, nx, nz, y0 - 0.32, y0 - 0.12, hw + 0.35, 0, OC_WHITE, ST, 0.3)  // the sill
      } else {
        const yt = y0 + (y1 - rise - y0) * 0.78
        emOpening(m, c0x, c0z, tx, tz, nx, nz, yt, yt + 0.08, hw, 0, OC_WHITE, ST, 0.2)
      }
      void pair
    }
    for (let j = 0; j < k; j++) {
      const u = bay(j)
      const atPortico = j === porticoBay
      // base: a low window and a tall one per bay (the portico bay and the west door excepted)
      if (!atPortico) {
        if (!(isMain && j === 0)) win(u, 2.0, 4.1, 0.6, false, false)
        win(u, 5.6, 8.0, 0.65, false, false)
      }
      // third floor: tall round-arched windows, a carved cartouche between them
      win(u, 10.7, 14.2, 0.95, true, false)
      if (j < k - 1) panel(bay(j) + (bay(j + 1) - bay(j)) / 2 - 0.3, bay(j) + (bay(j + 1) - bay(j)) / 2 + 0.3, 14.3, 15.3, 0.14, OC_WHITE, ST)
      // fourth and fifth floors: paired rectangular windows, then the shorter top row under the cornice
      for (const du of [-0.62, 0.62]) {
        win(u + du, 14.9, 17.1, 0.4, false, false)
        win(u + du, 18.4, 20.6, 0.4, false, false)
        win(u + du, 21.8, 23.9, 0.36, false, false)
      }
      panel(u - 1.05, u + 1.05, 20.9, 21.15, 0.12, OC_WHITE, ST)                                  // stone string between floors
    }
    if (isMain) {                                                                                   // the west door of the base and the balconettes
      const u0 = bay(0)
      emOpening(m, a.x + tx * u0, a.z + tz * u0, tx, tz, nx, nz, 0, 3.2, 1.1, 0, BC_DOOR, GL, 0.14)
      emOpening(m, a.x + tx * u0, a.z + tz * u0, tx, tz, nx, nz, 3.2, 3.5, 1.25, 0, OC_WHITE, ST, 0.16)
      for (const [by, bu] of [[14.0, bay(0) - 0.62], [17.6, bay(0) - 0.62]] as [number, number][]) {
        boxAlong(m, a.x + tx * bu + nx * 0.5, by, a.z + tz * bu + nz * 0.5, 0.75, 0.35, 0.45, h, OC_PINK, ST)
      }
    }

    // ---- the white cornice: frieze, modillion row, deep crown, parapet
    panel(0, l, Y_CORN - 0.2, Y_CORN + 0.9, 0.12, OC_WHITE, ST)
    boxAlong(m, cx + nx * 0.5, Y_CORN + 0.55, cz + nz * 0.5, l / 2 + 0.2, 0.3, 0.5, h, OC_WHITE_SH, ST)
    for (let u = 0.5; u < l - 0.3; u += 0.9) {
      boxAlong(m, a.x + tx * u + nx * 0.55, Y_CORN + 0.95, a.z + tz * u + nz * 0.55, 0.17, 0.2, 0.3, h, OC_WHITE, ST)
    }
    boxAlong(m, cx + nx * 0.75, Y_CORN + 1.65, cz + nz * 0.75, l / 2 + 0.4, 0.4, 0.75, h, OC_WHITE, ST)
    boxAlong(m, cx + nx * 0.3, TOP - 0.3, cz + nz * 0.3, l / 2 + 0.2, 0.3, 0.3, h, OC_WHITE, ST)

    // ---- the portico: four columns in two pairs, an entablature, side walls, the door, a flight of steps
    if (isMain) {
      const u0 = bay(porticoBay)
      const px = a.x + tx * u0, pz = a.z + tz * u0
      const D = 2.4
      for (const du of [-2.15, -1.05, 1.05, 2.15]) {
        classicalColumn(m, px + tx * du + nx * (D - 0.5), pz + tz * du + nz * (D - 0.5), 0.2, Y_BASE - 0.7, 0.42, OC_WHITE, { order: 'tuscan' })
      }
      boxAlong(m, px + nx * (D / 2 + 0.1), Y_BASE - 0.4, pz + nz * (D / 2 + 0.1), 3.3, 0.3, D / 2 + 0.1, h, OC_WHITE, ST)   // the entablature
      for (const s of [-1, 1]) boxAlong(m, px + tx * s * 3.0 + nx * (D / 2), 4.3, pz + tz * s * 3.0 + nz * (D / 2), 0.35, 4.3, D / 2, h, OC_WHITE, ST)
      emOpening(m, px, pz, tx, tz, nx, nz, 0.2, 4.4, 1.15, 0, BC_DOOR, GL, 0.3)
      emOpening(m, px, pz, tx, tz, nx, nz, 4.4, 5.2, 1.5, 0, OC_WHITE_SH, ST, 0.28)
      boxAlong(m, px + nx * (D + 0.3), 0.1, pz + nz * (D + 0.3), 3.2, 0.1, 0.5, h, OC_WHITE, ST)
      boxAlong(m, px + nx * (D + 0.8), 0.04, pz + nz * (D + 0.8), 3.2, 0.04, 0.4, h, OC_WHITE, ST)
      // two flags on poles raked out from the fourth floor over the entrance (the stars-and-stripes and the club's own)
      const flags: [number, number, Rgb, boolean][] = [[-1.2, 0.6, [0.78, 0.13, 0.15], true], [1.9, -0.4, [0.92, 0.9, 0.9], false]]
      for (const [fu, dir, col, usa] of flags) {
        const bx = px + tx * fu + nx * 0.6, bz = pz + tz * fu + nz * 0.6
        const ex = bx + (tx * dir * 1.2 + nx * 2.3), ez = bz + (tz * dir * 1.2 + nz * 2.3), by = 15.4, ey = 17.6
        for (const w of [[0.03, 0], [0, 0.03]]) {
          m.quad([[bx - w[0], by, bz - w[1]], [bx + w[0], by, bz + w[1]], [ex + w[0], ey, ez + w[1]], [ex - w[0], ey, ez - w[1]]],
            [0, 1, 0], uv, [0.8, 0.8, 0.8], ST)
        }
        const ux = (ex - bx), uz = (ez - bz), ul = Math.hypot(ux, uz) || 1
        const fx = ux / ul, fz = uz / ul
        const mx = bx + ux * 0.45, mz = bz + uz * 0.45
        const FQ: V3[] = [[mx, by + 1.7, mz], [mx + fx * 2.4 + tx * dir * 0.4, by + 0.9, mz + fz * 2.4 + tz * dir * 0.4],
          [mx + fx * 2.3 + tx * dir * 0.4, by - 0.2, mz + fz * 2.3 + tz * dir * 0.4], [mx, by + 0.4, mz]]
        const fn: V3 = [fz, 0, -fx]
        m.quad(FQ, fn, uv, col, ST)
        m.quad([FQ[1], FQ[0], FQ[3], FQ[2]], [-fn[0], 0, -fn[2]], uv, col, ST)
        if (usa) m.quad([FQ[0], [mx + fx * 0.9, by + 1.5, mz + fz * 0.9], [mx + fx * 0.9, by + 0.6, mz + fz * 0.9], FQ[3]], fn, uv, [0.15, 0.2, 0.5], ST)
      }
    }

    // ---- ivy on the east (right) end of the front: ragged patches climbing the base, thicker at the corner
    const topAt = (u: number, layer: number): number => {
      const ph = e.i * 5 + layer * 4.1
      let hgt = 8.5 + Math.sin(u * 0.9 + ph) * 3.2 + Math.sin(u * 2.3 + ph * 2) * 1.6
      if (layer === 1) hgt = hgt * 0.65 - 0.5
      return hgt
    }
    const ivyFrom = isMain ? l - 7 : 0, cell = 0.45
    if (!isMain && l < 6) { /* the short front stays plain */ } else if (isMain && OC_IVY) {
      for (let layer = 0; layer < 2; layer++) {
        for (let u0 = ivyFrom; u0 + cell <= l + 1e-6; u0 += cell) {
          const lean = Math.min(1, (u0 - ivyFrom) / 1.2)                                            // thin at the west edge of the patch
          const h0 = (topAt(u0, layer) + (rnd(u0 * 9 + layer) - 0.5) * 0.6) * lean
          const h1 = (topAt(u0 + cell, layer) + (rnd((u0 + cell) * 9 + layer) - 0.5) * 0.6) * Math.min(1, (u0 + cell - ivyFrom) / 1.2)
          if (h0 < 0.8 && h1 < 0.8) continue
          const sh = 0.7 + rnd(u0 * 7 + layer) * 0.3
          const base = layer === 0 ? (rnd(u0) < 0.6 ? BC_IVY_DK : BC_IVY_MID) : (rnd(u0) < 0.35 ? BC_IVY_LT : BC_IVY_MID)
          const col: Rgb = [base[0] * sh, base[1] * sh, base[2] * sh]
          const pr = 0.2 + layer * 0.05
          m.quad([P(u0, -0.2, pr), P(u0 + cell, -0.2, pr), P(u0 + cell, Math.max(h1, 0.3), pr), P(u0, Math.max(h0, 0.3), pr)], [nx, 0, nz], uv, col, ST)
        }
      }
    }
  }

  capPolygonWithHoles(m, [ring], ROOF, BC_ROOF, surfaceTag('concrete'))

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// The Victoria Theatre, 2961 16th Street
// ---------------------------------------------------------------------------------------------------------------

const VT_RED: Rgb = [0.5, 0.125, 0.135]          // #9e2a2b, a shade down: it renders bright in the city
const VT_RED_DK: Rgb = [0.4, 0.1, 0.11]
const VT_CREAM: Rgb = [0.925, 0.89, 0.83]        // #ece4d4 trim
const VT_TEAL: Rgb = [0.1, 0.22, 0.22]           // the dark green-teal coping and window frames
const VT_TILE: Rgb = [0.3, 0.17, 0.12]           // the brown tile hood
const VT_GLASS: Rgb = [0.09, 0.1, 0.13]
const VT_MURAL: Rgb = [0.85, 0.83, 0.8]          // #d8d4cc
const VT_GREY: Rgb = [0.62, 0.62, 0.64]
const VT_LIT = 0.5                               // the emissive surface tag (models.ts EMIT)

/**
 * The Victoria Theatre, 2961 16th Street (1908, San Francisco's oldest operating theatre): a small Mission-Revival front
 * in deep red stucco with cream trim. The parapet is STEPPED and rises toward the west (photographs, not the pack's
 * "peak at the centre"): a low left step with a scalloped cap, a middle run, and a tall right step with a scalloped
 * cap. A brown tile hood runs across the middle of the front, a cream-framed marquee shelters the doors, the vertical
 * blade sign "VICTORIA" stands at the left third, three quatrefoil medallions sit over the marquee, and arched and
 * square windows stack up the left and right ends. The long Capp Street (east) side is red with a big off-white mural
 * panel (a grey face) over a colourful graffiti band; the plain auditorium runs back to 13.2 m.
 * Photographs: docs/shots/refs/notable/victoria/ mapillary-review and -0 (the front), -2 (corner: mural, sign), -1 (side).
 *
 * Orientation: front 356 (16th Street, measured). The front plane is the ring's frontmost edge in the fit frame, spread
 * across the whole width (OSM jogs the wings back 3.5 m; the photographs show one flat front). The Capp wall is the long
 * edge facing -x (east, the viewer's left from the street).
 */
function victoriaTheatre_2961_16th(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const Y_ROOF = 13.2
  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  // the front: the edge facing -z that sticks out furthest (the central bay)
  let fi = 0, fbest = -1e9
  for (const e of info) {
    if (-e.nz < 0.64) continue
    const score = -(e.a.z + e.b.z) / 2 + e.l * 0.01
    if (score > fbest) { fbest = score; fi = e.i }
  }
  const F = info[fi], { a, nx, nz } = F
  const tx = (F.b.x - F.a.x) / F.l, tz = (F.b.z - F.a.z) / F.l
  const h = Math.atan2(nx, nz)
  // the front span: every ring vertex within 8 m of the front line, in (u along, pr out) coordinates
  let u0 = 1e9, u1 = -1e9, back = 0
  for (const p of ring) {
    const u = (p.x - a.x) * tx + (p.z - a.z) * tz, pr = (p.x - a.x) * nx + (p.z - a.z) * nz
    if (pr > -8) { u0 = Math.min(u0, u); u1 = Math.max(u1, u) }
    back = Math.min(back, pr)
  }
  const L = u1 - u0
  const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
  const W = (u: number, pr = 0): { x: number; z: number } => ({ x: a.x + tx * u + nx * pr, z: a.z + tz * u + nz * pr })
  // f is the fraction across the front from the viewer's LEFT (the east end, Capp Street)
  const leftIsLow = true
  const U = (f: number): number => u0 + (leftIsLow ? f : 1 - f) * L
  const panel = (f0: number, f1: number, y0: number, y1: number, pr: number, c: Rgb, tag = ST): void => {
    const ua = U(f0), ub = U(f1)
    const lo = Math.min(ua, ub), hi = Math.max(ua, ub)
    m.quad([P(lo, y0, pr), P(hi, y0, pr), P(hi, y1, pr), P(lo, y1, pr)], [nx, 0, nz], uv, c, tag)
  }
  const slab = (f0: number, f1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb, tag = ST): void => {
    const ua = U(f0), ub = U(f1)
    const w = W((ua + ub) / 2, (pr0 + pr1) / 2)
    boxAlong(m, w.x, (y0 + y1) / 2, w.z, Math.abs(ub - ua) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, tag)
  }
  // a convex polygon painted on the front plane: points are (metres along, y) about a centre
  const poly = (f: number, cy: number, pts: [number, number][], pr: number, c: Rgb, tag = ST): void => {
    const sgn = leftIsLow ? 1 : -1
    const pp = (p: [number, number]): V3 => P(U(f) + sgn * p[0], cy + p[1], pr)
    for (let i = 1; i + 1 < pts.length; i += 2) m.quad([pp(pts[0]), pp(pts[i]), pp(pts[i + 1]), pp(pts[Math.min(i + 2, pts.length - 1)])], [nx, 0, nz], uv, c, tag)
  }
  const disc = (f: number, cy: number, r: number, k: number, pr: number, c: Rgb, tag = ST): void => {
    const pts: [number, number][] = [[0, 0]]
    for (let i = 0; i <= k; i++) pts.push([Math.cos((Math.PI * 2 * i) / k) * r, Math.sin((Math.PI * 2 * i) / k) * r])
    poly(f, cy, pts, pr, c, tag)
  }
  const cap = (f: number, cy: number, r: number, pr: number, c: Rgb): void => {
    const pts: [number, number][] = [[0, 0]]
    for (let i = 0; i <= 6; i++) pts.push([Math.cos(Math.PI * i / 6) * r, Math.sin(Math.PI * i / 6) * r])
    poly(f, cy, pts, pr, c, ST)
  }
  const wallAt = (f: number, y0: number, y1: number, hw: number, pr: number, c: Rgb, tag = ST): void => panel(f - hw / L, f + hw / L, y0, y1, pr, c, tag)
  const arch = (f: number, y0: number, spring: number, hw: number, pr: number, c: Rgb, tag: number): void => {
    wallAt(f, y0, spring, hw, pr, c, tag)
    const pts: [number, number][] = [[0, 0]]
    for (let i = 0; i <= 6; i++) pts.push([Math.cos(Math.PI * i / 6) * hw, Math.sin(Math.PI * i / 6) * hw])
    poly(f, spring, pts, pr, c, tag)
  }
  const stepY = [14.4, 15.0, 16.2]                // left step, middle run, tall right step
  const fL = 0.16, fR = 0.62                      // where the steps change (fraction from the left)

  // ---- the walls: all red to 13.2 m ----
  for (const e of info) {
    m.quad([[e.a.x, -3, e.a.z], [e.b.x, -3, e.b.z], [e.b.x, Y_ROOF, e.b.z], [e.a.x, Y_ROOF, e.a.z]], [e.nx, 0, e.nz], uv, VT_RED, ST)
  }
  capPolygonWithHoles(m, [ring], Y_ROOF, [0.45, 0.43, 0.42], surfaceTag('concrete'))

  // ---- the front block: one flat red front across the full width, stepped parapet ----
  const dep = Math.min(4.2, -back - 0.5)
  slab(0, fL, -3, stepY[0], -dep, 0, VT_RED)
  slab(fL, fR, -3, stepY[1], -dep, 0, VT_RED)
  slab(fR, 1, -3, stepY[2], -dep, 0, VT_RED)
  slab(-0.005, fL, stepY[0], stepY[0] + 0.25, -0.5, 0.18, VT_TEAL)
  slab(fL, fR, stepY[1], stepY[1] + 0.25, -0.5, 0.18, VT_TEAL)
  slab(fR, 1.005, stepY[2], stepY[2] + 0.25, -0.5, 0.18, VT_TEAL)
  slab(fL - 0.002, fL + 0.002, stepY[0], stepY[1], -0.5, 0.15, VT_CREAM)
  slab(fR - 0.002, fR + 0.002, stepY[1], stepY[2], -0.5, 0.15, VT_CREAM)
  // the scalloped caps, outlined in teal and cream
  cap(0.08, stepY[0] + 0.25, 0.95, 0.06, VT_TEAL)
  cap(0.08, stepY[0] + 0.25, 0.78, 0.08, VT_CREAM)
  cap(0.08, stepY[0] + 0.25, 0.6, 0.1, VT_RED)
  cap(0.8, stepY[2] + 0.25, 1.5, 0.06, VT_TEAL)
  cap(0.8, stepY[2] + 0.25, 1.28, 0.08, VT_CREAM)
  cap(0.8, stepY[2] + 0.25, 1.05, 0.1, VT_RED)
  slab(0.02, 0.98, 12.3, 12.55, -0.1, 0.12, VT_CREAM)
  slab(0.02, 0.98, 10.0, 10.2, -0.1, 0.1, VT_CREAM)

  // ---- the brown tile hood across the middle of the front, on cream brackets ----
  slab(0.14, 0.64, 10.6, 11.4, -0.1, 0.5, VT_RED_DK)
  const nb = 9
  for (let j = 0; j <= nb; j++) slab(0.16 + (0.46 * j) / nb - 0.004, 0.16 + (0.46 * j) / nb + 0.004, 10.7, 11.5, 0.1, 0.8, VT_CREAM)
  {
    const lo = Math.min(U(0.13), U(0.65)), hi = Math.max(U(0.13), U(0.65))
    const rise = 0.9, run = 1.6, sl = Math.hypot(rise, run)
    m.quad([P(lo, 11.5, 0.9), P(hi, 11.5, 0.9), P(hi, 12.4, -0.1), P(lo, 12.4, -0.1)], [nx * rise / sl, run / sl, nz * rise / sl], uv, VT_TILE, TL)
    slab(0.13, 0.65, 11.2, 11.6, 0.5, 0.95, VT_TILE, TL)
  }

  // ---- windows ----
  arch(0.075, 7.9, 8.9, 0.42, 0.04, VT_CREAM, ST)
  arch(0.075, 8.05, 8.9, 0.28, 0.07, VT_GLASS, GL)
  wallAt(0.075, 5.3, 6.9, 0.45, 0.04, VT_TEAL)
  wallAt(0.075, 5.45, 6.75, 0.3, 0.07, VT_CREAM)
  arch(0.865, 10.0, 11.0, 0.5, 0.04, VT_CREAM, ST)
  arch(0.865, 10.15, 11.0, 0.33, 0.07, VT_GLASS, GL)
  wallAt(0.88, 7.1, 8.9, 0.62, 0.04, VT_TEAL)
  wallAt(0.88, 7.3, 8.7, 0.46, 0.07, VT_CREAM)
  disc(0.9, 4.9, 0.55, 8, 0.04, VT_TEAL)
  disc(0.9, 4.9, 0.36, 8, 0.07, VT_CREAM)
  wallAt(0.9, 0.0, 3.1, 0.55, 0.04, VT_RED_DK)
  for (const f of [0.255, 0.4, 0.555]) {                                    // the quatrefoil medallions over the marquee
    disc(f, 6.7, 0.78, 8, 0.04, VT_TEAL)
    disc(f, 6.7, 0.52, 8, 0.07, VT_CREAM)
    disc(f, 6.7, 0.25, 8, 0.1, VT_TEAL)
  }

  // ---- the ground floor and the marquee ----
  panel(0.1, 0.66, 0, 3.7, 0.05, [0.07, 0.06, 0.07], ST)
  for (const f of [0.21, 0.255, 0.4, 0.45, 0.545]) wallAt(f, 0.4, 2.8, 0.2, 0.1, [0.85, 0.65, 0.3], VT_LIT)
  wallAt(0.125, 0.4, 3.0, 0.38, 0.1, [0.75, 0.18, 0.15], VT_LIT)
  wallAt(0.635, 0.4, 3.0, 0.38, 0.1, [0.75, 0.18, 0.15], VT_LIT)
  const mw = L * 0.31, mu = U(0.34), mo = 2.2, my = 4.0
  const mp = W(mu)
  marquee(m, mp.x, my, mp.z, mw, mo, '', { heading: h, body: [0.93, 0.91, 0.85], band: [0.55, 0.55, 0.55], letters: [0.1, 0.1, 0.12], height: 1.7 })
  const sp = W(U(0.3))
  bladeSign(m, sp.x, 14.2, sp.z, 8.0, 'VICTORIA', { body: [0.62, 0.62, 0.62], letters: [0.94, 0.92, 0.85], width: 1.0, out: 1.1, heading: h })

  // ---- Capp Street: the long east wall ----
  let ci = -1, cbest = 0
  for (const e of info) {
    if (e.i === fi) continue
    const d = e.nx * tx + e.nz * tz
    if (d < -0.7 && e.l > cbest) { cbest = e.l; ci = e.i }
  }
  if (ci >= 0) {
    const e = info[ci]
    const etx = (e.b.x - e.a.x) / e.l, etz = (e.b.z - e.a.z) / e.l
    const dEnd = (e.b.x - a.x) * nx + (e.b.z - a.z) * nz, dStart = (e.a.x - a.x) * nx + (e.a.z - a.z) * nz
    const fromB = dEnd > dStart                                   // b is the front end
    const at = (d: number, y: number, pr = 0.05): V3 => {
      const s = fromB ? e.l - d : d
      return [e.a.x + etx * s + e.nx * pr, y, e.a.z + etz * s + e.nz * pr]
    }
    const sp2 = (d0: number, d1: number, y0: number, y1: number, pr: number, c: Rgb, tag = ST): void => {
      m.quad(fromB ? [at(d1, y0, pr), at(d0, y0, pr), at(d0, y1, pr), at(d1, y1, pr)] : [at(d0, y0, pr), at(d1, y0, pr), at(d1, y1, pr), at(d0, y1, pr)],
        [e.nx, 0, e.nz], uv, c, tag)
    }
    const D = Math.min(e.l, 26)
    sp2(15.5, D, 3.4, Y_ROOF, 0.03, VT_GREY)
    sp2(2.2, 15.0, 3.6, 11.8, 0.04, VT_CREAM)
    sp2(2.5, 14.7, 3.9, 11.5, 0.07, VT_MURAL)
    sp2(6.0, 9.4, 6.6, 10.2, 0.1, [0.78, 0.76, 0.73])
    sp2(6.6, 8.8, 7.4, 9.6, 0.12, [0.9, 0.87, 0.82])
    sp2(6.3, 9.1, 9.0, 10.4, 0.12, [0.5, 0.48, 0.46])
    sp2(4.8, 10.6, 3.9, 6.2, 0.1, [0.62, 0.6, 0.58])
    sp2(3.0, 5.6, 5.2, 7.2, 0.1, [0.3, 0.3, 0.32])
    sp2(9.8, 13.6, 4.6, 6.0, 0.1, [0.35, 0.35, 0.4])
    const cols: Rgb[] = [[0.93, 0.78, 0.15], [0.2, 0.45, 0.75], [0.7, 0.25, 0.55], [0.95, 0.5, 0.15], [0.25, 0.65, 0.6], [0.55, 0.3, 0.7]]
    let d = 0.3, k = 0
    while (d < D - 0.5) {
      const w = 1.4 + ((k * 7) % 5) * 0.55
      sp2(d, Math.min(d + w, D), 0.3, 1.7 + ((k * 3) % 4) * 0.5, 0.06, cols[k % cols.length])
      sp2(d + 0.3, Math.min(d + w - 0.1, D), 1.2, 2.2 + ((k * 5) % 3) * 0.4, 0.09, cols[(k + 2) % cols.length])
      sp2(d, Math.min(d + w, D), 2.6, 3.4, 0.05, [0.82, 0.84, 0.88])
      d += w + 0.2; k++
    }
  }

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// Swedish American Hall, 2174 Market Street
// ---------------------------------------------------------------------------------------------------------------

const SW_SHINGLE: Rgb = [0.29, 0.205, 0.157]      // #4a3428, the dark brown shingles
const SW_SHINGLE2: Rgb = [0.235, 0.165, 0.125]    // the courses, a shade down
const SW_WHITE: Rgb = [0.99, 0.98, 0.945]         // #ece8de, the rendered panels
const SW_BOARD: Rgb = [1, 0.995, 0.965]        // the bargeboards, whiter than the render
const SW_TIMBER: Rgb = [0.165, 0.19, 0.17]        // #2a312c, half-timbering and window frames
const SW_SLATE: Rgb = [0.3, 0.34, 0.31]           // #4c5650, the grey-green roofs
const SW_BRICK: Rgb = [0.42, 0.2, 0.15]
const SW_GLASS: Rgb = [0.2, 0.25, 0.27]
const SW_AMBER: Rgb = [0.4, 0.28, 0.18]           // the shuttered shopfront panes
const SW_DOOR: Rgb = [0.3, 0.17, 0.1]
const SW_TILE: Rgb = [0.1, 0.14, 0.14]

/**
 * The Swedish American Hall (1907, August Nordin; OSM calls it "Cafe du Nord" after the basement tenant), 2174 Market Street:
 * an Arts-and-Crafts / Scandinavian half-timbered front on a dark-shingled body. Two tall steep white gables stand side by
 * side (an "M" in elevation) over a white rendered face cut by dark timbers, a four-pane window group and a balcony rail;
 * each has a deep scalloped bargeboard and a dark arched opening under its peak. Smaller white-trimmed dormer gables sit
 * either side in a steep grey-green roof. Below: a hooded entrance canopy at the left (SWEDISH AMERICAN HALL), a shingled
 * oriel, iron fire balconies across the centre, a tall pointed-arched window bay at the right, brown arched double doors and
 * two dark-framed shopfront windows. Photographs: docs/shots/refs/notable/swedish-hall/commons-1.jpg (the Market Street front,
 * head-on, the reference for everything); the mapillary frames are tree-blocked and show only the green and red neighbours.
 *
 * Orientation: front 137 (Market Street, measured): the front is the ring's edge that faces the street, found from the ring
 * in the fit frame, never from OSM's vertex order. f runs 0..1 across it from the viewer's left; y is metres; pr is out
 * from the front.
 *
 * Where the photographs overruled the numbers: the lot is ~16 m wide, so the front is one flat plane and the M of the
 * gables spans the middle three quarters of it; the pack's 17.2 m LiDAR maximum is the gable peaks and the eaves are ~10 m.
 */
function swedishAmericanHall_2174_Market(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const CL = surfaceTag('clapboard'), BK = surfaceTag('brick')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  // the front: the edge facing the street (the city puts the manifest front on local -z: the frontmost edge whose outward normal is nearest -z)
  let fi = 0, fbest = -1e9
  for (const e of info) {
    if (-e.nz < 0.64) continue
    const score = -(e.a.z + e.b.z) / 2 + e.l * 0.01
    if (score > fbest) { fbest = score; fi = e.i }
  }
  const F = info[fi], { a, nx, nz } = F
  const tx = (F.b.x - F.a.x) / F.l, tz = (F.b.z - F.a.z) / F.l
  const h = Math.atan2(nx, nz)
  let u0 = 1e9, u1 = -1e9, back = 0
  for (const p of ring) {
    const u = (p.x - a.x) * tx + (p.z - a.z) * tz, pr = (p.x - a.x) * nx + (p.z - a.z) * nz
    if (pr > -3) { u0 = Math.min(u0, u); u1 = Math.max(u1, u) }
    back = Math.min(back, pr)
  }
  const L = u1 - u0
  const YE = 10.0, RIDGE = 15.0
  const P = (f: number, y: number, pr = 0): V3 => { const u = u0 + f * L; return [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr] }
  const mf = (mm: number): number => mm / L
  /** a polygon painted on the front plane, convex, (f, y) points */
  const fq = (pts: [number, number][], pr: number, c: Rgb, tag = ST): void => {
    for (let i = 1; i + 1 < pts.length; i++) m.quad([P(pts[0][0], pts[0][1], pr), P(pts[i][0], pts[i][1], pr), P(pts[i + 1][0], pts[i + 1][1], pr), P(pts[i + 1][0], pts[i + 1][1], pr)], [nx, 0, nz], uv, c, tag)
  }
  const rect = (f0: number, f1: number, y0: number, y1: number, pr: number, c: Rgb, tag = ST): void => fq([[f0, y0], [f1, y0], [f1, y1], [f0, y1]], pr, c, tag)
  const slab = (f0: number, f1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb, tag = ST): void => {
    const u = u0 + ((f0 + f1) / 2) * L, pr = (pr0 + pr1) / 2
    boxAlong(m, a.x + tx * u + nx * pr, (y0 + y1) / 2, a.z + tz * u + nz * pr, ((f1 - f0) * L) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, tag)
  }
  /** a half disc about (f, y): pointing up (an arch) or down (a scallop) */
  const semi = (f: number, y: number, r: number, pr: number, c: Rgb, up = true, tag = ST, k = 6): void => {
    const pts: [number, number][] = [[f, y]]
    for (let i = 0; i <= k; i++) { const t = (Math.PI * i) / k; pts.push([f + mf(Math.cos(t) * r), y + (up ? 1 : -1) * Math.sin(t) * r]) }
    fq(pts, pr, c, tag)
  }
  const plane = (pts: V3[], c: Rgb, tag = TL): void => {
    const e1 = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1], pts[1][2] - pts[0][2]]
    const e2 = [pts[2][0] - pts[0][0], pts[2][1] - pts[0][1], pts[2][2] - pts[0][2]]
    let nn: V3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
    const len = Math.hypot(...nn) || 1
    nn = [nn[0] / len, nn[1] / len, nn[2] / len]
    const cen = pts.reduce((t, p) => [t[0] + p[0] / pts.length, t[1] + p[1] / pts.length, t[2] + p[2] / pts.length], [0, 0, 0])
    const ins = P(0.5, 5, -8)
    if ((cen[0] - ins[0]) * nn[0] + (cen[1] - ins[1]) * nn[1] + (cen[2] - ins[2]) * nn[2] < 0) nn = [-nn[0], -nn[1], -nn[2]]
    m.quad(pts.length === 3 ? [pts[0], pts[1], pts[2], pts[2]] : pts, nn, uv, c, tag)
  }
  /** a bargeboard along (f0,y0)-(f1,y1): a band w metres deep (vertically), with scallops hanging under it */
  const board = (f0: number, y0: number, f1: number, y1: number, w: number, pr: number, scal: number): void => {
    fq([[f0, y0 - w], [f1, y1 - w], [f1, y1], [f0, y0]], pr, SW_BOARD)
    fq([[f0, y0 - w - 0.13], [f1, y1 - w - 0.13], [f1, y1 - w], [f0, y0 - w]], pr - 0.02, SW_TIMBER)
    if (scal > 0) {
      const len = Math.hypot((f1 - f0) * L, y1 - y0), k = Math.max(1, Math.round(len / scal))
      for (let i = 0; i < k; i++) {
        const t = (i + 0.5) / k
        semi(f0 + (f1 - f0) * t, y0 + (y1 - y0) * t - w - 0.05, scal * 0.38, pr, SW_BOARD, false)
      }
    }
  }

  // ---- the body: shingled walls to the eaves, courses on the front -----------------------------------------------------
  for (const e of info) {
    m.quad([[e.a.x, -3, e.a.z], [e.b.x, -3, e.b.z], [e.b.x, YE, e.b.z], [e.a.x, YE, e.a.z]], [e.nx, 0, e.nz], uv, SW_SHINGLE, CL)
  }
  capPolygonWithHoles(m, [ring], YE - 0.02, SW_SLATE, surfaceTag('concrete'))
  for (let y = 0.5; y < 9.8; y += 0.46) rect(-0.002, 1.002, y, y + 0.15, 0.015, SW_SHINGLE2, CL)

  // ---- the hipped grey-green roof: ridge along the depth, steep ---------------------------------------------------------
  const pe = 0.8, bk = back - 0.3, rf = 0.5
  const run = (L / 2 + 0.3)
  const rs = pe - run, re = bk + run                                     // ridge from rs (front) to re (rear)
  const eaveL = -0.3 / L, eaveR = 1 + 0.3 / L
  plane([P(eaveL, YE, pe), P(eaveR, YE, pe), P(rf, RIDGE, rs)], SW_SLATE)
  plane([P(eaveR, YE, pe), P(eaveR, YE, bk), P(rf, RIDGE, re), P(rf, RIDGE, rs)], SW_SLATE)
  plane([P(eaveL, YE, pe), P(rf, RIDGE, rs), P(rf, RIDGE, re), P(eaveL, YE, bk)], SW_SLATE)
  plane([P(eaveL, YE, bk), P(rf, RIDGE, re), P(eaveR, YE, bk)], SW_SLATE)
  const roofY = (f: number, pr: number): number => Math.min(YE + (pe - pr) * ((RIDGE - YE) / run), YE + (Math.min(f, 1 - f) * L + 0.3) * ((RIDGE - YE) / run))

  // ---- the twin gables: the white face, an "M" in elevation --------------------------------------------------------------
  const GP = 0.5                                                          // the face stands this far proud of the shingles
  const fA = 0.123, fB = 0.422, fC = 0.5, fD = 0.578, fE = 0.877, yA = 9.6, yB = 17.7, yC = 15.4
  const fl = (y: number): number => fA + ((y - yA) / (yB - yA)) * (fB - fA)       // the left edge at height y
  fq([[fA, yA], [fE, yA], [fC, yC]], GP, SW_WHITE)
  fq([[fA, yA], [fC, yC], [fB, yB]], GP, SW_WHITE)
  fq([[fC, yC], [fE, yA], [fD, yB]], GP, SW_WHITE)
  // the dark timbers: horizontals, verticals, braces
  const hbar = (y: number, t: number, f0: number, f1: number): void => slab(f0, f1, y, y + t, GP - 0.02, GP + 0.1, SW_TIMBER)
  const vbar = (f: number, y0: number, y1: number, wm = 0.26): void => slab(f - mf(wm) / 2, f + mf(wm) / 2, y0, y1, GP - 0.02, GP + 0.1, SW_TIMBER)
  slab(fA, fE, 9.45, 9.75, 0, GP + 0.15, SW_BOARD)                        // the soffit under the face
  hbar(11.55, 0.2, fl(11.55) + 0.003, 1 - fl(11.55) - 0.003)
  hbar(14.3, 0.2, fl(14.3) + 0.003, 1 - fl(14.3) - 0.003)
  hbar(9.75, 0.2, fA, fE)
  for (const f of [0.25, 0.37, 0.5, 0.63, 0.75]) vbar(f, 9.75, 11.55)
  for (const f of [0.43, 0.57]) vbar(f, 14.3, 15.3, 0.12)
  for (const f of [0.31, 0.69]) vbar(f, 14.3, 15.0, 0.12)
  for (const f of [0.36, 0.5, 0.64]) vbar(f, 11.55, 14.3)
  for (const f of [0.36, 0.5, 0.64]) vbar(f, 14.3, 15.3)
  for (const f of [fB, fD]) vbar(f, 14.5, 16.4, 0.2)
  vbar(0.31, 11.55, 14.3); vbar(0.69, 11.55, 14.3)
  for (const f of [fB, fD]) { semi(f, 15.85, 0.62, GP + 0.04, SW_TIMBER); semi(f, 15.9, 0.34, GP + 0.07, SW_WHITE, false) }   // the dark arch under each peak
  // the window group and the balcony rail
  rect(0.372, 0.628, 12.0, 14.12, GP + 0.04, SW_TIMBER)
  for (let i = 0; i < 4; i++) rect(0.378 + i * 0.0625, 0.378 + i * 0.0625 + 0.054, 12.12, 14.0, GP + 0.07, SW_GLASS, GL)
  slab(0.36, 0.64, 12.0, 12.1, GP, GP + 0.75, SW_TIMBER)
  slab(0.36, 0.64, 12.85, 12.95, GP + 0.7, GP + 0.78, [0.75, 0.75, 0.72], surfaceTag('metal'))
  for (let i = 0; i <= 16; i++) rect(0.36 + (0.28 * i) / 16 - 0.002, 0.36 + (0.28 * i) / 16 + 0.002, 12.1, 12.85, GP + 0.78, [0.75, 0.75, 0.72], surfaceTag('metal'))
  // the white render piers running down the middle of the shingles, behind the fire escape
  rect(0.29, 0.318, 5.7, 9.6, GP, SW_WHITE); rect(0.7, 0.728, 5.7, 9.6, GP, SW_WHITE)
  // the scalloped bargeboards: deep on the outer slopes, lighter in the valley
  board(fA, yA, fB, yB, 1.35, GP + 0.25, 1.1)
  board(fD, yB, fE, yA, 1.35, GP + 0.25, 1.1)
  board(fB, yB, fC, yC, 0.9, GP + 0.25, 0.8)
  board(fC, yC, fD, yB, 0.9, GP + 0.25, 0.8)
  // the gable roofs behind the boards, running back into the hip
  const dp = -5.5
  for (const [fa, ya, fb, yb] of [[fA, yA, fB, yB], [fB, yB, fC, yC], [fC, yC, fD, yB], [fD, yB, fE, yA]] as [number, number, number, number][]) {
    plane([P(fa, ya, GP + 0.2), P(fb, yb, GP + 0.2), P(fb, yb, dp), P(fa, ya, dp)], SW_SLATE)
  }
  fq([[fA, yA], [fE, yA], [fC, yC]], dp, SW_SLATE)
  fq([[fA, yA], [fC, yC], [fB, yB]], dp, SW_SLATE)
  fq([[fC, yC], [fE, yA], [fD, yB]], dp, SW_SLATE)

  // ---- the two dormer gables in the roof either side -----------------------------------------------------------------------
  const dormer = (fc: number): void => {
    const hw = mf(1.2), dpr = -1.2, by = roofY(fc, dpr) - 0.25
    slab(fc - hw, fc + hw, by, 13.0, dpr - 2.0, dpr, SW_SHINGLE, CL)
    rect(fc - hw, fc + hw, by, 13.0, dpr + 0.02, SW_SHINGLE2, CL)
    rect(fc - mf(0.42), fc + mf(0.42), 12.0, 13.4, dpr + 0.06, SW_TIMBER)
    rect(fc - mf(0.34), fc + mf(0.34), 12.1, 13.3, dpr + 0.09, SW_GLASS, GL)
    rect(fc - mf(0.02), fc + mf(0.02), 12.1, 13.3, dpr + 0.11, SW_BOARD)
    fq([[fc - hw, 13.0], [fc + hw, 13.0], [fc, 15.0]], dpr + 0.02, SW_WHITE)
    board(fc - hw - mf(0.1), 12.95, fc, 15.15, 0.7, dpr + 0.14, 0.7)
    board(fc, 15.15, fc + hw + mf(0.1), 12.95, 0.7, dpr + 0.14, 0.7)
    for (const s of [-1, 1]) plane([P(fc + s * (hw + mf(0.1)), 12.95, dpr + 0.15), P(fc, 15.15, dpr + 0.15), P(fc, 15.15, dpr - 2.6), P(fc + s * (hw + mf(0.1)), 12.95, dpr - 2.6)], SW_SLATE)
  }
  dormer(0.136); dormer(0.864)
  // the chimneys at either end, shingled
  slab(0.01, 0.065, 11.3, 15.2, -2.3, -1.0, SW_SHINGLE, CL); slab(0.005, 0.07, 15.2, 15.45, -2.4, -0.9, SW_SHINGLE2, CL)
  slab(0.935, 0.99, 11.3, 15.9, -2.3, -1.0, SW_SHINGLE, CL); slab(0.93, 0.995, 15.9, 16.15, -2.4, -0.9, SW_SHINGLE2, CL)

  // ---- the front below the gables ----------------------------------------------------------------------------------------
  // upper windows: the small one over the oriel, the oriel itself, the tall pointed-arched bay
  rect(0.09, 0.17, 7.9, 9.5, 0.03, SW_TIMBER); rect(0.104, 0.156, 8.1, 9.3, 0.07, SW_GLASS, GL)
  slab(0.07, 0.215, 5.35, 7.75, 0, 0.7, SW_TIMBER)
  rect(0.085, 0.2, 5.65, 7.45, 0.72, SW_GLASS, GL)
  for (const f of [0.123, 0.162]) rect(f - 0.002, f + 0.002, 5.65, 7.45, 0.74, SW_TIMBER)
  plane([P(0.06, 7.75, 0.85), P(0.225, 7.75, 0.85), P(0.225, 8.6, 0.1), P(0.06, 8.6, 0.1)], SW_SLATE)
  plane([P(0.06, 7.75, 0.85), P(0.06, 8.6, 0.1), P(0.06, 7.75, 0.1)], SW_SLATE)
  plane([P(0.225, 7.75, 0.85), P(0.225, 8.6, 0.1), P(0.225, 7.75, 0.1)], SW_SLATE)
  fq([[0.8, 5.4], [0.94, 5.4], [0.94, 8.0], [0.87, 9.15], [0.8, 8.0]], 0.04, SW_TIMBER)
  fq([[0.812, 5.55], [0.928, 5.55], [0.928, 7.95], [0.87, 8.95], [0.812, 7.95]], 0.08, SW_GLASS, GL)
  for (const f of [0.84, 0.87, 0.9]) rect(f - 0.002, f + 0.002, 5.55, f === 0.87 ? 8.9 : 8.1, 0.11, SW_TIMBER)
  for (const y of [6.3, 7.0, 7.7]) rect(0.812, 0.928, y, y + 0.08, 0.11, SW_TIMBER)
  // the iron fire balcony
  slab(0.295, 0.72, 5.6, 5.75, 0.1, 0.95, SW_TIMBER, surfaceTag('metal'))
  slab(0.295, 0.72, 6.6, 6.7, 0.9, 0.97, SW_TIMBER, surfaceTag('metal'))
  for (let i = 0; i <= 22; i++) { const f = 0.295 + (0.425 * i) / 22; rect(f - 0.0015, f + 0.0015, 5.75, 6.6, 0.96, SW_TIMBER, surfaceTag('metal')) }
  // ground floor: brick piers, the dark tile base, the lintel, the shopfront windows and the doors
  slab(0, 0.045, 0, 4.4, 0, 0.12, SW_BRICK, BK); slab(0.225, 0.272, 0, 4.4, 0, 0.12, SW_BRICK, BK); slab(0.975, 1.0, 0, 4.4, 0, 0.12, SW_BRICK, BK)
  rect(0.272, 0.98, 0, 0.75, 0.05, SW_TILE, surfaceTag('tile'))
  slab(0.265, 0.985, 3.4, 3.95, 0, 0.22, SW_TIMBER)
  for (const [f0, f1] of [[0.275, 0.535], [0.715, 0.975]] as [number, number][]) {
    slab(f0, f1, 0.75, 3.4, 0, 0.12, SW_TIMBER)
    const w = (f1 - f0 - 0.03) / 3
    for (let i = 0; i < 3; i++) rect(f0 + 0.01 + i * (w + 0.005), f0 + 0.01 + i * (w + 0.005) + w, 0.95, 3.15, 0.14, f0 > 0.5 && i === 1 ? SW_GLASS : SW_AMBER, GL)
  }
  rect(0.585, 0.67, 0, 3.0, 0.1, SW_DOOR); semi(0.6275, 3.0, L * 0.0425, 0.1, SW_DOOR)
  rect(0.62, 0.635, 0, 3.0, 0.12, SW_TIMBER); slab(0.575, 0.68, 3.35, 3.5, 0, 0.5, SW_TIMBER)
  // the entrance: the dark recess, doors, and the hooded canopy with its sign band
  rect(0.06, 0.215, 0, 3.9, 0.06, [0.08, 0.075, 0.07]); rect(0.09, 0.19, 0, 2.7, 0.1, [0.17, 0.1, 0.07])
  const cf0 = -0.015, cf1 = 0.26, ch = 1.4
  fq([[cf0, 3.95], [cf1, 3.95], [(cf0 + cf1) / 2, 5.3]], ch, SW_WHITE)
  board(cf0 - 0.01, 3.95, (cf0 + cf1) / 2, 5.4, 0.45, ch + 0.05, 0)
  board((cf0 + cf1) / 2, 5.4, cf1 + 0.01, 3.95, 0.45, ch + 0.05, 0)
  slab(cf0 + 0.01, cf1 - 0.01, 3.4, 3.95, ch - 0.12, ch, SW_BOARD)
  for (const [s0, s1] of [[0.03, 0.095], [0.105, 0.205], [0.215, 0.25]] as [number, number][]) slab(s0, s1, 3.58, 3.78, ch, ch + 0.04, SW_TIMBER)
  for (const s of [-1, 1]) plane([P((cf0 + cf1) / 2 + s * (cf1 - cf0) / 2 * 1.04, 3.95, ch + 0.06), P((cf0 + cf1) / 2, 5.4, ch + 0.06), P((cf0 + cf1) / 2, 5.4, 0.1), P((cf0 + cf1) / 2 + s * (cf1 - cf0) / 2 * 1.04, 3.95, 0.1)], SW_SLATE)
  for (const f of [0.0, 0.245]) slab(f, f + 0.02, 0, 3.4, ch - 0.15, ch, SW_BOARD)

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// 650 Townsend Street, the former Zynga headquarters (docs/sf-batches/MODEL-ZYNGA.md, 2026-10-15)
// ---------------------------------------------------------------------------------------------------------------

const ZY_BRICK: Rgb = [0.38, 0.17, 0.14]
const ZY_BRICK_D: Rgb = [0.3, 0.13, 0.11]
const ZY_STONE: Rgb = [0.6, 0.52, 0.47]
const ZY_STONE_L: Rgb = [0.68, 0.64, 0.6]
const ZY_GLASS: Rgb = [0.3, 0.39, 0.47]
const ZY_SPAN: Rgb = [0.4, 0.5, 0.58]
const ZY_FRAME: Rgb = [0.2, 0.22, 0.25]
const ZY_DARK: Rgb = [0.07, 0.08, 0.1]
const ZY_RED: Rgb = [0.62, 0.13, 0.15]
const ZY_WHITE: Rgb = [1, 1, 1]
const ZY_DECK: Rgb = [0.6, 0.6, 0.58]
const ZY_TEAL: Rgb = [0.2, 0.42, 0.45]
const ZY_ROOF: Rgb = [0.5, 0.5, 0.49]
const ZY_BK = surfaceTag('brick')
const ZY_CN = surfaceTag('concrete')

/** the bulldog in profile, head right, on a 10 x 10 grid: convex pieces (u, y) */
const ZY_DOG: [number, number][][] = [
  [[1.3, 4.2], [6.2, 4.2], [6.2, 7.0], [1.0, 6.4]],
  [[5.4, 3.9], [7.2, 3.9], [7.4, 7.6], [5.4, 7.4]],
  [[6.4, 6.2], [9.4, 6.2], [9.6, 8.6], [6.8, 9.0]],
  [[8.8, 6.0], [9.9, 6.4], [9.9, 7.8], [8.8, 7.8]],
  [[6.8, 9.0], [7.6, 9.9], [8.3, 8.9], [8.3, 8.9]],
  [[8.0, 8.9], [8.9, 9.7], [9.2, 8.7], [9.2, 8.7]],
  [[5.6, 0], [6.9, 0], [6.9, 4.3], [5.6, 4.3]],
  [[4.6, 0], [5.5, 0], [5.5, 4.3], [4.6, 4.3]],
  [[1.4, 0], [2.7, 0], [2.9, 4.3], [1.4, 4.3]],
  [[2.9, 0], [3.8, 0], [3.8, 4.2], [2.9, 4.2]],
  [[0.5, 6.3], [1.3, 6.3], [0.9, 8.0], [0.2, 8.2]],
]

/**
 * 650 Townsend's plan: the four long edges of the fit ring, intersected into corners and each rounded with a tangent
 * arc (the kit's walls are flat). The south corner (the −x end of the −z Townsend front, towards 8th Street) is the big
 * drum that carries the bulldog; the west corner is the arch-logo corner; the other two are tight roundings.
 */
function zyPlan(ring?: P2[]): { pts: P2[]; kind: number[]; drum: { c: P2; r: number; phi: number; i0: number; i1: number } } {
  let R = ring && ring.length >= 4 ? ring : [{ x: -73, z: -47 }, { x: 67, z: -48 }, { x: 67, z: 35 }, { x: -73, z: 35 }]
  const n = R.length
  let area = 0
  for (let i = 0; i < n; i++) { const a = R[i], b = R[(i + 1) % n]; area += a.x * b.z - b.x * a.z }
  if (area < 0) R = [...R].reverse()
  const es = R.map((a, i) => ({ a, b: R[(i + 1) % n], L: Math.hypot(R[(i + 1) % n].x - a.x, R[(i + 1) % n].z - a.z) })).filter((e) => e.L > 15)
  let corners: P2[]
  if (es.length === 4) {
    corners = es.map((e, i) => {
      const f = es[(i + 1) % 4]
      const d1 = { x: e.b.x - e.a.x, z: e.b.z - e.a.z }, d2 = { x: f.b.x - f.a.x, z: f.b.z - f.a.z }
      const den = d1.x * d2.z - d1.z * d2.x
      const s = ((f.a.x - e.a.x) * d2.z - (f.a.z - e.a.z) * d2.x) / (Math.abs(den) < 1e-6 ? 1e-6 : den)
      return { x: e.a.x + d1.x * s, z: e.a.z + d1.z * s }
    })
  } else {
    const xs = R.map((p) => p.x), zs = R.map((p) => p.z)
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs)
    corners = [{ x: x0, z: z0 }, { x: x1, z: z0 }, { x: x1, z: z1 }, { x: x0, z: z1 }]
  }
  let B = 0
  corners.forEach((p, i) => { if (p.x + p.z < corners[B].x + corners[B].z) B = i })
  let A = -1
  corners.forEach((p, i) => { if (i !== B && (A < 0 || p.x < corners[A].x)) A = i })
  const pts: P2[] = []
  const kind: number[] = []
  let drum = { c: { x: 0, z: 0 }, r: 1, phi: 0, i0: 0, i1: 0 }
  for (let k = 0; k < 4; k++) {
    const C = corners[k], P = corners[(k + 3) % 4], Qn = corners[(k + 1) % 4]
    const r = k === B ? 15 : k === A ? 7 : 4
    const l1 = Math.hypot(P.x - C.x, P.z - C.z), l2 = Math.hypot(Qn.x - C.x, Qn.z - C.z)
    const v1 = { x: (P.x - C.x) / l1, z: (P.z - C.z) / l1 }, v2 = { x: (Qn.x - C.x) / l2, z: (Qn.z - C.z) / l2 }
    const th = Math.acos(Math.max(-1, Math.min(1, v1.x * v2.x + v1.z * v2.z)))
    const d = r / Math.tan(th / 2)
    const bis = { x: v1.x + v2.x, z: v1.z + v2.z }
    const bl = Math.hypot(bis.x, bis.z)
    const dist = r / Math.sin(th / 2)
    const c = { x: C.x + (bis.x / bl) * dist, z: C.z + (bis.z / bl) * dist }
    const t1 = { x: C.x + v1.x * d, z: C.z + v1.z * d }, t2 = { x: C.x + v2.x * d, z: C.z + v2.z * d }
    const a1 = Math.atan2(t1.z - c.z, t1.x - c.x)
    let dl = Math.atan2(t2.z - c.z, t2.x - c.x) - a1
    while (dl > Math.PI) dl -= 2 * Math.PI
    while (dl < -Math.PI) dl += 2 * Math.PI
    const ns = Math.max(2, Math.ceil(Math.abs(dl) / (k === B ? 0.1 : 0.2)))
    const i0 = pts.length
    for (let s = 0; s <= ns; s++) {
      pts.push({ x: c.x + Math.cos(a1 + (dl * s) / ns) * r, z: c.z + Math.sin(a1 + (dl * s) / ns) * r })
      kind.push(s === ns ? 0 : k === B ? 2 : k === A ? 3 : 1)
    }
    if (k === B) drum = { c, r, phi: Math.atan2(C.z - c.z, C.x - c.x), i0, i1: i0 + ns }
  }
  return { pts, kind, drum }
}

function zyngaHQ_650_Townsend(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const { pts, kind, drum } = zyPlan(fit.ring)
  const NS = pts.length
  const H = 20, HD = 24, Y0 = -1
  const up: V3 = [0, 1, 0]
  const nrm = (x: number, z: number): V3 => [x, 0, z]
  const Q = (p: V3[], nv: V3, col: Rgb, tag = ZY_BK): void => m.quad(p, nv, uv, col, tag)
  type Seg = { a: P2; b: P2; L: number; t: P2; n: P2; k: number }
  const S: Seg[] = pts.map((a, i) => {
    const b = pts[(i + 1) % NS]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const t = { x: (b.x - a.x) / L, z: (b.z - a.z) / L }
    return { a, b, L, t, n: { x: t.z, z: -t.x }, k: kind[i] }
  })
  const P3 = (s: Seg, u: number, d: number, y: number): V3 => [s.a.x + s.t.x * u + s.n.x * d, y, s.a.z + s.t.z * u + s.n.z * d]
  const rect = (s: Seg, u0: number, u1: number, d: number, y0: number, y1: number, col: Rgb, tag = ZY_BK): void =>
    Q([P3(s, u0, d, y0), P3(s, u1, d, y0), P3(s, u1, d, y1), P3(s, u0, d, y1)], nrm(s.n.x, s.n.z), col, tag)
  /** a block standing d proud on wall s */
  const slab = (s: Seg, u0: number, u1: number, d: number, y0: number, y1: number, col: Rgb, tag = ZY_CN): void => {
    rect(s, u0, u1, d, y0, y1, col, tag)
    Q([P3(s, u0, 0, y1), P3(s, u1, 0, y1), P3(s, u1, d, y1), P3(s, u0, d, y1)], up, col, tag)
    Q([P3(s, u0, 0, y0), P3(s, u0, d, y0), P3(s, u0, d, y1), P3(s, u0, 0, y1)], nrm(-s.t.x, -s.t.z), col, tag)
    Q([P3(s, u1, d, y0), P3(s, u1, 0, y0), P3(s, u1, 0, y1), P3(s, u1, d, y1)], nrm(s.t.x, s.t.z), col, tag)
  }

  // ---- the garage: open grey decks on the 8th Street (−x) wall, beside the drum -------------------------------------------
  let gj = -1
  S.forEach((s, j) => { if (s.k === 0 && s.L > 15 && (gj < 0 || s.n.x < S[gj].n.x)) gj = j })
  const G0z = drum.c.z + drum.r + 3, G1z = G0z + 40
  const gu = (z: number): number => (z - S[gj].a.z) / S[gj].t.z
  const gA = Math.max(0, Math.min(gu(G0z), gu(G1z))), gB = Math.min(S[gj].L, Math.max(gu(G0z), gu(G1z)))

  // ---- the walls ----------------------------------------------------------------------------------------------------------
  const wall = (j: number, u0: number, u1: number, top: number): void => {
    const s = S[j]
    if (u1 - u0 < 0.05) return
    rect(s, u0, u1, 0, Y0, top, ZY_BRICK)
    // brick courses read as a darker plinth
    rect(s, u0, u1, 0.05, Y0, 0.9, ZY_BRICK_D)
    slab(s, u0, u1, 0.18, 4.5, 5.3, ZY_STONE)
    slab(s, u0, u1, 0.4, top - 1.0, top, ZY_STONE_L)
    if (s.k === 3) {
      // the arch-logo corner: a dark arched recess and white outline strokes
      rect(s, u0, u1, 0.1, 7.5, 16.5, ZY_DARK, ZY_CN)
      rect(s, u0, u1, 0.14, 11.8, 12.1, ZY_WHITE, ZY_CN)
      rect(s, u0, u1, 0.14, 7.5, 7.8, ZY_WHITE, ZY_CN)
      rect(s, u0, u1, 0.14, 16.2, 16.5, ZY_WHITE, ZY_CN)
      return
    }
    if (s.k !== 0 || s.L < 4) return
    // ground storey: dark storefront glass between brick piers
    for (let u = u0 + 1.0; u + 3.2 < u1; u += 4.6) rect(s, u, u + 3.2, 0.1, 0.9, 4.2, ZY_DARK, surfaceTag('glass'))
    // upper storeys: blue glass bands between red-brick piers, a pale strip in each pier
    const pitch = 9, pier = 3.2, gw = pitch - pier
    for (let u = u0 + pier / 2 + 0.3; u + gw + pier / 2 < u1; u += pitch) {
      const y0 = 5.9, y1 = top - 1.4
      rect(s, u, u + gw, 0.1, y0, y1, ZY_GLASS, GL)
      for (let q = 1; q < 4; q++) rect(s, u + (gw * q) / 4 - 0.04, u + (gw * q) / 4 + 0.04, 0.14, y0, y1, ZY_FRAME, ZY_CN)
      for (let y = y0 + 3.2; y < y1 - 0.5; y += 3.2) rect(s, u, u + gw, 0.14, y - 0.25, y + 0.25, ZY_SPAN, ZY_CN)
      rect(s, u + gw + pier / 2 - 0.25, u + gw + pier / 2 + 0.25, 0.1, 5.6, top - 1.0, ZY_STONE_L)
    }
  }
  for (let j = 0; j < NS; j++) {
    const s = S[j]
    if (s.k === 2) continue
    if (j === gj) { wall(j, 0, gA, H); wall(j, gB, s.L, H) } else wall(j, 0, s.L, H)
  }
  // the teal-glass canopy over the "650" entrance, on the Townsend front
  let fj = 0
  S.forEach((s, j) => { if (s.k === 0 && s.L > 15 && s.n.z < S[fj].n.z) fj = j })
  {
    const s = S[fj], u = s.L * 0.5
    slab(s, u, u + 12, 3.2, 4.9, 5.3, ZY_TEAL, GL)
    rect(s, u, u + 12, 0.12, 0.9, 4.6, ZY_DARK, GL)
    rect(s, u, u + 12, 0.12, 5.9, 12, [0.25, 0.4, 0.55], GL)
  }

  // garage decks
  if (gj >= 0 && gB - gA > 6) {
    const s = S[gj]
    const DEP = 5
    rect(s, gA, gB, -DEP, Y0, H, ZY_DARK, ZY_CN)
    for (let y = 0; y < H; y += 4) {
      Q([P3(s, gA, -DEP, y + 0.45), P3(s, gB, -DEP, y + 0.45), P3(s, gB, 0, y + 0.45), P3(s, gA, 0, y + 0.45)], up, ZY_DECK, ZY_CN)
      slab(s, gA, gB, 0.15, y, y + 1.0, ZY_DECK, ZY_CN)
    }
    for (let u = gA; u <= gB + 0.01; u += (gB - gA) / Math.round((gB - gA) / 6)) {
      Q([P3(s, u - 0.3, 0.05, 0), P3(s, u + 0.3, 0.05, 0), P3(s, u + 0.3, 0.05, H), P3(s, u - 0.3, 0.05, H)], nrm(s.n.x, s.n.z), ZY_DECK, ZY_CN)
    }
    for (const [u, sg] of [[gA, -1], [gB, 1]] as [number, number][]) {
      Q([P3(s, u, 0, Y0), P3(s, u, -DEP, Y0), P3(s, u, -DEP, H), P3(s, u, 0, H)], nrm(s.t.x * sg, s.t.z * sg), ZY_BRICK)
    }
  }

  // ---- the drum --------------------------------------------------------------------------------------------------------------
  const { c, r, phi } = drum
  const AP = (a: number, rr: number, y: number): V3 => [c.x + Math.cos(a) * rr, y, c.z + Math.sin(a) * rr]
  const ring3 = (a0: number, a1: number, rr: number, y0: number, y1: number, col: Rgb, tag = ZY_BK, step = 0.09): void => {
    const k = Math.max(1, Math.ceil(Math.abs(a1 - a0) / step))
    for (let i = 0; i < k; i++) {
      const a = a0 + ((a1 - a0) * i) / k, b = a0 + ((a1 - a0) * (i + 1)) / k
      Q([AP(a, rr, y0), AP(b, rr, y0), AP(b, rr, y1), AP(a, rr, y1)], nrm(Math.cos((a + b) / 2), Math.sin((a + b) / 2)), col, tag)
    }
  }
  const SP = Math.PI / 4
  const a0 = phi - SP, a1 = phi + SP
  ring3(a0, a1, r, Y0, HD, ZY_BRICK)
  ring3(a0, a1, r + 0.05, Y0, 0.9, ZY_BRICK_D)
  // stone courses and cornice
  ring3(a0, a1, r + 0.2, 6.0, 6.7, ZY_STONE)
  ring3(a0, a1, r + 0.15, 7.4, 7.6, ZY_STONE_L)
  ring3(a0, a1, r + 0.15, 19.6, 19.8, ZY_STONE_L)
  ring3(a0, a1, r + 0.4, HD - 1.4, HD, ZY_STONE_L)
  // perforated brick bands above and below the red panel: dark red ground with dark slits
  for (const [y0, y1] of [[7.9, 9.3], [19.9, 21.3]] as [number, number][]) {
    ring3(phi - 0.62, phi + 0.62, r + 0.12, y0, y1, ZY_BRICK_D)
    for (let a = phi - 0.6; a < phi + 0.6; a += 0.045) ring3(a, a + 0.02, r + 0.16, y0 + 0.2, y1 - 0.2, ZY_DARK, ZY_CN)
  }
  // the red panel
  ring3(phi - 0.39, phi + 0.39, r + 0.2, 9.4, 19.7, ZY_RED, ZY_CN, 0.06)
  // the bulldog: convex pieces mapped onto the curve (head to the viewer's right = increasing angle here, as the plan runs)
  const rp = r + 0.3, sc = 0.98
  const dy = (y: number): number => (y <= 4.3 ? y * 0.7 : 3.0 + (y - 4.3) * 0.95) // a stocky dog: short legs
  for (const piece of ZY_DOG) {
    const pp: V3[] = piece.map(([u, y]) => AP(phi + ((u - 5) * sc) / rp, rp, 10.6 + dy(y) * sc))
    const am = phi + ((piece.reduce((t, q) => t + q[0], 0) / piece.length - 5) * sc) / rp
    Q(pp, nrm(Math.cos(am), Math.sin(am)), ZY_WHITE, ZY_CN)
  }
  // the pale-stone portal ("Townsend Center") at the foot of the curve, and the tall glass slits either side
  ring3(phi - 0.2, phi + 0.2, r + 0.3, 0, 6.0, ZY_STONE_L)
  ring3(phi - 0.1, phi + 0.1, r + 0.34, 0, 4.4, ZY_DARK, ZY_CN, 0.1)
  for (const sg of [-1, 1]) {
    for (const [o0, o1] of [[0.52, 0.6], [0.66, 0.74]]) ring3(phi + sg * o0, phi + sg * o1, r + 0.1, 8.5, 19.4, ZY_GLASS, GL, 0.04)
  }
  // the drum's roof, a step up from the 20 m block
  const roofPts: P2[] = []
  for (let i = drum.i0; i <= drum.i1; i++) roofPts.push(pts[i])
  roofPts.push(c)
  capPolygonWithHoles(m, [roofPts], HD, ZY_ROOF, ZY_CN)
  for (const [e, sg] of [[pts[drum.i0], -1], [pts[drum.i1], 1]] as [P2, number][]) {
    const dx = c.x - e.x, dz = c.z - e.z, l = Math.hypot(dx, dz)
    Q([[e.x, H, e.z], [c.x, H, c.z], [c.x, HD, c.z], [e.x, HD, e.z]], nrm((sg * dz) / l, (-sg * dx) / l), ZY_BRICK)
  }
  // ---- the main roof -----------------------------------------------------------------------------------------------------------
  capPolygonWithHoles(m, [pts], H, ZY_ROOF, ZY_CN)

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// The Pacific, 2121 Webster Street
// ---------------------------------------------------------------------------------------------------------------

/**
 * OSM way/32965108's outline (docs/shots/refs/notable/the-pacific/EVIDENCE.md), anticlockwise, in the evidence frame: x east,
 * z north, metres. Sacramento Street is the south side (bearing 171°), Webster Street the east side (81°).
 */
const PAC_RING: P2[] = [[-40.8, 19.0], [-39.5, 11.0], [-34.8, -17.8], [-34.7, -18.5], [-25.3, -17.0], [-17.8, -15.8], [15.7, -10.5],
  [15.6, -10.1], [33.0, -7.3], [34.2, -7.1], [34.1, -6.4], [37.1, 0.1], [32.1, 30.7], [31.9, 30.7]].map(([x, z]) => ({ x, z }))
const pacPoly = (a: number[][]): P2[] => a.map(([x, z]) => ({ x, z }))
// The pack gives each building:part's area, height and centre but not its polygon, so the parts are cut from the outline to
// their areas: the 124 m² west strip (10 m), the 760 m² north wing (8 m), the 1 878 m² main block (36 m: 1 902 here, the
// 23 m² porch being drawn on top), and the two set-back storeys (1 046 m² to 39.5 m; the top one pulled in a further 2 m).
const PAC_MAIN = pacPoly([[-31.55, -18.00], [-25.30, -17.00], [-17.80, -15.80], [15.70, -10.50], [15.60, -10.10], [33.00, -7.30],
  [34.20, -7.10], [34.10, -6.40], [37.10, 0.10], [33.85, 20.01], [-35.82, 8.97]])
const PAC_WING = pacPoly([[33.85, 20.01], [32.10, 30.70], [31.90, 30.70], [-37.49, 19.53], [-35.82, 8.97]])
const PAC_STRIP = pacPoly([[-40.80, 19.00], [-39.50, 11.00], [-34.80, -17.80], [-34.70, -18.50], [-31.55, -18.00], [-37.49, 19.53]])
const PAC_UP1 = pacPoly([[-28.71, -11.30], [29.73, -1.90], [31.04, 0.92], [28.69, 15.29], [-31.42, 5.77]])
const PAC_UP2 = pacPoly([[-27.05, -9.01], [28.36, -0.09], [28.96, 1.21], [27.04, 13.00], [-29.13, 4.11]])

const PAC_PANEL: Rgb = [0.66, 0.65, 0.62]        // the grey-beige wall panels (a touch darker than the pack's #d6d2c8: the photos' shade)
const PAC_FRAME: Rgb = [0.82, 0.81, 0.78]       // the paler surround each window sits in: the grid
const PAC_WHITE: Rgb = [0.945, 0.94, 0.925]      // #f1f0ec, window-box frames and hoods
const PAC_GLASS: Rgb = [0.427, 0.529, 0.588]     // #6d8796
const PAC_GLASS_B: Rgb = [0.36, 0.5, 0.56]       // the second facet of a window box, in shade
const PAC_MULL: Rgb = [0.2, 0.27, 0.31]          // dark mullions and the shop glazing
const PAC_STONE: Rgb = [0.784, 0.761, 0.706]     // #c8c2b4, the podium stone
const PAC_PIER: Rgb = [0.52, 0.48, 0.43]         // the bronze-taupe corner piers
const PAC_ROOF: Rgb = [0.6, 0.6, 0.58]
const PAC_HEDGE: Rgb = [0.3, 0.42, 0.24]
const CN = surfaceTag('concrete')
const AS = surfaceTag('ashlar')
const MT = surfaceTag('metal')

type PacFace = { a: P2; tx: number; tz: number; nx: number; nz: number; L: number }
/** An edge's frame: along it (t), out of the wall (n = (tz, −tx), the outward side of an anticlockwise ring). */
function pacFace(a: P2, b: P2): PacFace {
  const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz)
  return { a, tx: dx / L, tz: dz / L, nx: dz / L, nz: -dx / L, L }
}
const pacAt = (F: PacFace, s: number, y: number, o: number): V3 => [F.a.x + F.tx * s + F.nx * o, y, F.a.z + F.tz * s + F.nz * o]
const PAC_UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** One triangle wound to face `n`. */
function pacTri(m: MeshBuilder, p: V3[], n: V3, c: Rgb, tag: number): void {
  const base = m.positions.length / 3
  for (let i = 0; i < 3; i++) {
    m.positions.push(p[i][0], p[i][1], p[i][2])
    m.normals.push(n[0], n[1], n[2])
    m.uvs.push(PAC_UV[i][0], PAC_UV[i][1])
    m.colors.push(c[0], c[1], c[2], tag)
  }
  const e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]]
  const e2 = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]]
  const facing = (e1[1] * e2[2] - e1[2] * e2[1]) * n[0] + (e1[2] * e2[0] - e1[0] * e2[2]) * n[1] + (e1[0] * e2[1] - e1[1] * e2[0]) * n[2]
  if (facing > 0) m.indices.push(base, base + 2, base + 1)
  else m.indices.push(base, base + 1, base + 2)
}

function pacInside(p: P2, poly: P2[]): boolean {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]
    if ((a.z > p.z) !== (b.z > p.z) && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) c = !c
  }
  return c
}

/** A flat window: the pale surround on the wall, the glass in it, one dark mullion. s = centre along the edge. */
function pacWindow(m: MeshBuilder, F: PacFace, s: number, y0: number, w: number, h: number, mull = true): void {
  const n: V3 = [F.nx, 0, F.nz]
  const sq = (s0: number, s1: number, a: number, b: number, o: number, c: Rgb, tag: number): void =>
    m.quad([pacAt(F, s0, a, o), pacAt(F, s1, a, o), pacAt(F, s1, b, o), pacAt(F, s0, b, o)], n, PAC_UV, c, tag)
  sq(s - w / 2 - 0.2, s + w / 2 + 0.2, y0 - 0.2, y0 + h + 0.2, 0.06, PAC_FRAME, CN)
  sq(s - w / 2, s + w / 2, y0, y0 + h, 0.1, PAC_GLASS, GL)
  if (mull) sq(s + w * 0.16 - 0.04, s + w * 0.16 + 0.04, y0, y0 + h, 0.13, PAC_MULL, MT)
}

/** A window box: a shallow bay folded out of the wall, two glass facets meeting at a ridge `dep` out, a white sill and hood. */
function pacBox(m: MeshBuilder, F: PacFace, s: number, y0: number, w: number, h: number, dep: number): void {
  const n: V3 = [F.nx, 0, F.nz]
  const y1 = y0 + h, hw = w / 2
  m.quad([pacAt(F, s - hw - 0.2, y0 - 0.2, 0.06), pacAt(F, s + hw + 0.2, y0 - 0.2, 0.06), pacAt(F, s + hw + 0.2, y1 + 0.2, 0.06),
    pacAt(F, s - hw - 0.2, y1 + 0.2, 0.06)], n, PAC_UV, PAC_FRAME, CN)
  const A = (y: number, o = 0.1): V3 => pacAt(F, s - hw, y, o), B = (y: number, o = 0.1): V3 => pacAt(F, s + hw, y, o), C = (y: number, o = dep): V3 => pacAt(F, s, y, o)
  const dd = dep - 0.1, k = Math.hypot(dd, hw)
  const nl: V3 = [(-F.tx * dd + F.nx * hw) / k, 0, (-F.tz * dd + F.nz * hw) / k]
  const nr: V3 = [(F.tx * dd + F.nx * hw) / k, 0, (F.tz * dd + F.nz * hw) / k]
  m.quad([A(y0), C(y0), C(y1), A(y1)], nl, PAC_UV, PAC_GLASS, GL)
  m.quad([C(y0), B(y0), B(y1), C(y1)], nr, PAC_UV, PAC_GLASS_B, GL)
  // the white sill plate (a wedge 0.2 thick) and the hood over it
  const sill = 0.22, ce = dep + 0.12
  pacTri(m, [A(y0, 0.06), B(y0, 0.06), C(y0, ce)], [0, 1, 0], PAC_WHITE, MT)
  pacTri(m, [A(y0 - sill, 0.06), B(y0 - sill, 0.06), C(y0 - sill, ce)], [0, -1, 0], PAC_WHITE, MT)
  m.quad([A(y0 - sill, 0.06), C(y0 - sill, ce), C(y0, ce), A(y0, 0.06)], nl, PAC_UV, PAC_WHITE, MT)
  m.quad([C(y0 - sill, ce), B(y0 - sill, 0.06), B(y0, 0.06), C(y0, ce)], nr, PAC_UV, PAC_WHITE, MT)
  pacTri(m, [A(y1, 0.06), B(y1, 0.06), C(y1, ce)], [0, -1, 0], PAC_WHITE, MT)
  pacTri(m, [A(y1 + 0.04, 0.06), B(y1 + 0.04, 0.06), C(y1 + 0.04, ce)], [0, 1, 0], PAC_WHITE, MT)
}

/**
 * The Pacific (2121 Webster Street, 2016 — the former Pacific Medical Center site, Pacific Heights). Photographs:
 * docs/shots/refs/notable/the-pacific/ — the Sacramento/Webster corner (Mapillary 0, 2 and the photo pass's frames from
 * the slope), the Webster face (Mapillary 3) and the Sacramento podium door (Mapillary 1). Own geometry, drawn in the
 * evidence plan's frame and carried onto `fit.ring`:
 *
 * - the STEPPED MASSING from the OSM parts: the 36 m main block, the set-back storey to 39.5 m and the top glazed storey
 *   (pulled in again) to 43 m, the low 8 m north wing and the 10 m west strip (a stone podium either side of the garden);
 * - a stone PODIUM 5.6 m high round the main block with a dark-glazed ground floor on Sacramento and Webster and clipped
 *   hedges along the street, the white ledge at its head, bronze-taupe corner piers, and the little 6 m porch (way/1315764833);
 * - above it eight floors of pale grey-beige panel wall, each window in a paler surround — the grid — and on a diagonal
 *   third of the bays a projecting WINDOW BOX: two glass facets folded out to a ridge 0.55 m off the wall, a white wedge
 *   sill under, a white hood over (Mapillary 0 and 2 show exactly this, the sill a triangle in plan).
 *
 * Where the photographs overruled the numbers: the pack's panel #d6d2c8 reads a shade darker and the corner piers are
 * bronze-taupe, not panel; the part polygons are cut from the outline to the pack's areas, since only centres were given
 * (those centres do not tile the outline, so they were not used); the top storey is a set-back glass pavilion.
 */
function thePacific_2121_Webster(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const POD = 5.6, FL = (36 - POD) / 8
  type Part = { poly: P2[]; y0: number; y1: number }
  const parts: Part[] = [
    { poly: PAC_MAIN, y0: 0, y1: 36 }, { poly: PAC_WING, y0: 0, y1: 8 }, { poly: PAC_STRIP, y0: 0, y1: 10 },
    { poly: PAC_UP1, y0: 36, y1: 39.5 }, { poly: PAC_UP2, y0: 39.5, y1: 43 },
  ]
  const covered = (x: number, z: number, y: number, self: Part): boolean =>
    parts.some((p) => p !== self && y > p.y0 && y < p.y1 && pacInside({ x, z }, p.poly))
  const edges = (poly: P2[]): PacFace[] => poly.map((a, i) => pacFace(a, poly[(i + 1) % poly.length]))
  /** Windows along a part's edges for the band y0…y1: boxes on a diagonal third when `boxes`. */
  const row = (P: Part, F: PacFace, k: number, y0: number, w: number, h: number, bay: number, boxes: boolean): void => {
    const n = Math.max(1, Math.round((F.L - 2.2) / bay))
    for (let i = 0; i < n; i++) {
      const s = 1.1 + ((i + 0.5) * (F.L - 2.2)) / n
      if (covered(F.a.x + F.tx * s + F.nx * 0.4, F.a.z + F.tz * s + F.nz * 0.4, y0 + h / 2, P)) continue
      if (boxes && (i + 2 * k) % 3 === 0) pacBox(m, F, s, y0 - 0.1, w + 0.45, h + 0.2, 0.8)
      else pacWindow(m, F, s, y0, w, h)
    }
  }

  for (const P of parts) {
    const stone = P.y1 <= 10
    const glassTop = P.y0 === 39.5
    for (const F of edges(P.poly)) {
      const n: V3 = [F.nx, 0, F.nz]
      const col = glassTop ? PAC_GLASS : stone ? PAC_STONE : PAC_PANEL
      m.quad([pacAt(F, 0, P.y0, 0), pacAt(F, F.L, P.y0, 0), pacAt(F, F.L, P.y1, 0), pacAt(F, 0, P.y1, 0)], n, PAC_UV, col,
        glassTop ? GL : stone ? AS : CN)
      if (F.L < 3.5) continue
      if (glassTop) {
        // the set-back glass pavilion: pale mullions every 2.8 m
        const k = Math.max(1, Math.round(F.L / 2.8))
        for (let i = 0; i <= k; i++) {
          const s = (i * F.L) / k
          m.quad([pacAt(F, s - 0.07, 39.5, 0.05), pacAt(F, s + 0.07, 39.5, 0.05), pacAt(F, s + 0.07, 43, 0.05), pacAt(F, s - 0.07, 43, 0.05)], n,
            PAC_UV, PAC_FRAME, MT)
        }
        continue
      }
      if (P.y1 === 36) {
        // the podium: the dark-glazed ground floor on the street faces, the white ledge at its head, then the grid
        const street = F.nz < -0.3 || F.nx > 0.3
        if (street) {
          const k = Math.max(1, Math.round((F.L - 2) / 4.2))
          for (let i = 0; i < k; i++) {
            const s = 1 + ((i + 0.5) * (F.L - 2)) / k
            if (!covered(F.a.x + F.tx * s + F.nx * 0.4, F.a.z + F.tz * s + F.nz * 0.4, 2, P) && i % 4 !== 2) {
              m.quad([pacAt(F, s - 1.6, 0.9, 0.08), pacAt(F, s + 1.6, 0.9, 0.08), pacAt(F, s + 1.6, 4.3, 0.08), pacAt(F, s - 1.6, 4.3, 0.08)], n,
                PAC_UV, PAC_MULL, GL)
            }
          }
          // clipped hedges along the pavement, and the ledge
          m.quad([pacAt(F, 0.6, 0, 1.3), pacAt(F, F.L - 0.6, 0, 1.3), pacAt(F, F.L - 0.6, 0.8, 1.3), pacAt(F, 0.6, 0.8, 1.3)], n, PAC_UV, PAC_HEDGE, ST)
          m.quad([pacAt(F, 0.6, 0.8, 1.3), pacAt(F, F.L - 0.6, 0.8, 1.3), pacAt(F, F.L - 0.6, 0.8, 0.5), pacAt(F, 0.6, 0.8, 0.5)], [0, 1, 0], PAC_UV,
            PAC_HEDGE, ST)
        }
        m.quad([pacAt(F, 0, POD - 0.3, 0.22), pacAt(F, F.L, POD - 0.3, 0.22), pacAt(F, F.L, POD + 0.25, 0.22), pacAt(F, 0, POD + 0.25, 0.22)], n,
          PAC_UV, PAC_WHITE, CN)
        m.quad([pacAt(F, 0, POD + 0.25, 0.22), pacAt(F, F.L, POD + 0.25, 0.22), pacAt(F, F.L, POD + 0.25, 0), pacAt(F, 0, POD + 0.25, 0)], [0, 1, 0],
          PAC_UV, PAC_WHITE, CN)
        for (let k = 0; k < 8; k++) row(P, F, k, POD + k * FL + 0.8, 1.95, 2.55, 3.0, true)
      } else if (P.y1 === 39.5) {
        row(P, F, 0, 36.7, 1.95, 2.3, 3.0, false)
      } else {
        // the stone wings: two rows of plain windows
        row(P, F, 0, 1.0, 2.2, 2.6, 3.6, false)
        if (P.y1 > 9) row(P, F, 1, 4.9, 2.2, 2.6, 3.6, false)
      }
    }
    capPolygonWithHoles(m, [P.poly], P.y1, PAC_ROOF, CN)
  }
  // the parapet's white coping where the main roof meets the set-back storey is the ledge on UP1's foot
  for (const F of edges(PAC_UP1)) {
    const n: V3 = [F.nx, 0, F.nz]
    m.quad([pacAt(F, 0, 36, 0.12), pacAt(F, F.L, 36, 0.12), pacAt(F, F.L, 36.4, 0.12), pacAt(F, 0, 36.4, 0.12)], n, PAC_UV, PAC_WHITE, CN)
  }
  // the bronze-taupe corner piers of the main block, full height, where the plan turns by more than 30°
  const M = PAC_MAIN
  for (let i = 0; i < M.length; i++) {
    const p = M[(i + M.length - 1) % M.length], q = M[i], r = M[(i + 1) % M.length]
    const F1 = pacFace(p, q), F2 = pacFace(q, r)
    if (F1.L < 3.5 || F2.L < 3.5) continue
    if (Math.abs(F1.tx * F2.tz - F1.tz * F2.tx) < 0.5 || covered(q.x, q.z, 20, parts[0])) continue
    const w = 0.7
    m.quad([pacAt(F1, F1.L - w, 0, 0.1), pacAt(F1, F1.L, 0, 0.1), pacAt(F1, F1.L, 36, 0.1), pacAt(F1, F1.L - w, 36, 0.1)], [F1.nx, 0, F1.nz],
      PAC_UV, PAC_PIER, MT)
    m.quad([pacAt(F2, 0, 0, 0.1), pacAt(F2, w, 0, 0.1), pacAt(F2, w, 36, 0.1), pacAt(F2, 0, 36, 0.1)], [F2.nx, 0, F2.nz], PAC_UV, PAC_PIER, MT)
  }
  // the 6 m porch on Sacramento (way/1315764833, centre (−17.1, −15.4)): a stone block standing 0.5 m proud of the podium
  {
    const F = pacFace(PAC_MAIN[1], PAC_MAIN[2])
    const s0 = 0.6, s1 = 5.4
    const lo = (s: number, y: number, o: number): V3 => pacAt(F, s, y, o)
    const n: V3 = [F.nx, 0, F.nz]
    m.quad([lo(s0, 0, 0.5), lo(s1, 0, 0.5), lo(s1, 6, 0.5), lo(s0, 6, 0.5)], n, PAC_UV, PAC_STONE, AS)
    m.quad([lo(s0, 6, 0.5), lo(s1, 6, 0.5), lo(s1, 6, 0), lo(s0, 6, 0)], [0, 1, 0], PAC_UV, PAC_STONE, AS)
    m.quad([lo(s0, 0, 0), lo(s0, 0, 0.5), lo(s0, 6, 0.5), lo(s0, 6, 0)], [-F.tx, 0, -F.tz], PAC_UV, PAC_STONE, AS)
    m.quad([lo(s1, 0, 0.5), lo(s1, 0, 0), lo(s1, 6, 0), lo(s1, 6, 0.5)], [F.tx, 0, F.tz], PAC_UV, PAC_STONE, AS)
  }

  // ---- onto the city's ring: the evidence frame turned by the entry's front (171°) as the loader turns the ring ------
  const th = ((171 + 180) * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th)
  const ca = emanuElCentroid(PAC_RING.map((p) => ({ x: p.x * c - p.z * s, z: p.x * s + p.z * c })))
  const cb = fit.ring && fit.ring.length >= 4 ? emanuElCentroid(fit.ring) : { x: 0, z: 0 }
  emanuElCopy(out, m, c, s, cb.x - ca.x, cb.z - ca.z)
}

// ---------------------------------------------------------------------------------------------------------------
// Arched-crown red-brick office, King Street between 2nd and 3rd (OSM way/149167950)
// ---------------------------------------------------------------------------------------------------------------

const AC_BRICK: Rgb = [0.36, 0.17, 0.14]       // #8a3a30 coded ~30 % down: it renders orange in the city
const AC_BRICK_DK: Rgb = [0.3, 0.14, 0.115]   // the plainer rear and flank walls
const AC_CREAM: Rgb = [0.66, 0.6, 0.5]         // the string course and cornice
const AC_GLASS: Rgb = [0.3, 0.38, 0.44]        // blue-grey upper glass
const AC_DARK: Rgb = [0.1, 0.1, 0.11]          // the dark storefront and the lower floors' dark panes
const AC_FRAME: Rgb = [0.78, 0.79, 0.78]       // pale window frames and mullions
const AC_STEEL: Rgb = [0.79, 0.8, 0.82]        // the arch frame, #c9ccd0
const AC_WHITE: Rgb = [0.95, 0.95, 0.94]
const AC_ROOF: Rgb = [0.4, 0.4, 0.4]

/**
 * The 2002 red-brick office on King Street between 2nd and 3rd (OSM way/149167950, nine storeys): a dark storefront storey,
 * two floors of dark arched windows, a cream string course, five floors of large blue-grey windows in pale frames, a cream
 * cornice, then a set-back glass top floor on the King front with a shallow lens-shaped steel canopy over its terrace and,
 * behind it, a curved brick crown wall carrying a round white emblem. Photographs: docs/shots/refs/notable/w149167950/
 * way-149167950-02 (the King front: the crown, the canopy, the window rows), -01 (the flank from King: arched upper rows,
 * string course), mapillary-0/1 (the dark arched base floors and the cream course up close), mapillary-2 (the rear wall).
 *
 * Orientation: manifest front 134 (King), the fit's FRONT is local -z; the arch goes on the longest ring edge whose outward
 * normal faces -z, found from geometry. Photographs overruled the pack: the crown wall peaks near 35 m (the pack's ~36 m is
 * the LiDAR max), and the steel canopy is a low lens over the terrace in front of the crown, not the crown itself.
 */
function archCrownOffice_King_149167950(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const BK = surfaceTag('brick')
  const MT = surfaceTag('metal')
  const CN = surfaceTag('concrete')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const TOP = 32, Y_CORN = 28.4, SET = 2.6, PAR = 29.5

  const edgesOf = (r: P2[]) => r.map((a, i) => {
    const b = r[(i + 1) % r.length], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  const info = edgesOf(ring)
  const fronts = info.filter((e) => e.l > 12 && e.nz < -0.85)
  const front = fronts.length ? fronts.reduce((p, c) => (c.l > p.l ? c : p)) : info.reduce((p, c) => (c.nz < p.nz ? c : p))

  // the upper ring: the King front's top floor stands back from the edge
  const ring2: P2[] = ring.map((p, i) => {
    const onFront = i === front.i || i === (front.i + 1) % n
    return onFront ? { x: p.x - front.nx * SET, z: p.z - front.nz * SET } : p
  })
  const info2 = edgesOf(ring2)

  /** a quad whose winding is fixed from its outward normal */
  const qd = (pts: V3[], nrm: V3, c: Rgb, tag: number): void => {
    const e1: V3 = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1], pts[1][2] - pts[0][2]]
    const e2: V3 = [pts[3][0] - pts[0][0], pts[3][1] - pts[0][1], pts[3][2] - pts[0][2]]
    const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0]
    const ok = cx * nrm[0] + cy * nrm[1] + cz * nrm[2] < 0
    m.quad(ok ? pts : [pts[0], pts[3], pts[2], pts[1]], nrm, uv, c, tag)
  }
  /** a square-section beam from p to q */
  const beam = (p: V3, q: V3, r: number, c: Rgb): void => {
    const d: V3 = [q[0] - p[0], q[1] - p[1], q[2] - p[2]]
    const dl = Math.hypot(d[0], d[1], d[2]) || 1
    d[0] /= dl; d[1] /= dl; d[2] /= dl
    let s: V3 = [d[2], 0, -d[0]]                      // d x up, horizontal
    let sl = Math.hypot(s[0], s[2])
    if (sl < 1e-3) { s = [1, 0, 0]; sl = 1 }
    s = [s[0] / sl, 0, s[2] / sl]
    const u: V3 = [s[1] * d[2] - s[2] * d[1], s[2] * d[0] - s[0] * d[2], s[0] * d[1] - s[1] * d[0]]
    const c4 = (a: V3, sa: number, ua: number): V3 => [a[0] + s[0] * sa * r + u[0] * ua * r, a[1] + s[1] * sa * r + u[1] * ua * r, a[2] + s[2] * sa * r + u[2] * ua * r]
    const faces: [number, number, V3][] = [[1, 0, s], [-1, 0, [-s[0], -s[1], -s[2]]], [0, 1, u], [0, -1, [-u[0], -u[1], -u[2]]]]
    for (const [a, b, nrm] of faces) {
      const t1 = a !== 0 ? [a, -1] : [-1, b], t2 = a !== 0 ? [a, 1] : [1, b]
      qd([c4(p, t1[0], t1[1]), c4(q, t1[0], t1[1]), c4(q, t2[0], t2[1]), c4(p, t2[0], t2[1])], nrm, c, MT)
    }
  }

  const doEdge = (e: ReturnType<typeof edgesOf>[number], y0: number, y1: number, upper: boolean): void => {
    const { a, b, l, nx, nz } = e
    if (l < 0.5) return
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    const h = Math.atan2(nx, nz)
    const isFront = e.a === front.a || (upper && Math.abs(e.nx - front.nx) < 0.02 && Math.abs(e.nz - front.nz) < 0.02 && e.l > 12)
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, ya: number, yb: number, pr: number, c: Rgb, tag: number): void => {
      qd([P(u0, ya, pr), P(u1, ya, pr), P(u1, yb, pr), P(u0, yb, pr)], [nx, 0, nz], c, tag)
    }
    const slab = (u0: number, u1: number, ya: number, yb: number, pr0: number, pr1: number, c: Rgb): void => {
      boxAlong(m, a.x + tx * (u0 + u1) / 2 + nx * (pr0 + pr1) / 2, (ya + yb) / 2, a.z + tz * (u0 + u1) / 2 + nz * (pr0 + pr1) / 2,
        (u1 - u0) / 2, (yb - ya) / 2, (pr1 - pr0) / 2, h, c, CN)
    }
    const arched = (u: number, ya: number, yb: number, hw: number, rise: number, pr: number, c: Rgb, tag: number): void => {
      emOpening(m, a.x + tx * u, a.z + tz * u, tx, tz, nx, nz, ya, yb, hw, rise, c, tag, pr, 4)
    }
    const kb = Math.max(1, Math.round(l / 4.6))
    const w = l / kb
    const hw = Math.min(1.7, w * 0.37)
    const wall = isFront ? AC_BRICK : (l > 12 ? AC_BRICK : AC_BRICK_DK)

    if (!upper) {
      panel(0, l, -3, y1, 0, wall, BK)
      // the dark storefront storey: tall dark panes between brick piers, a dark band over them
      panel(0, l, 0.5, 4.6, 0.04, AC_DARK, GL)
      for (let j = 0; j <= kb; j++) {
        const u = w * j
        slab(Math.max(0, u - 0.55), Math.min(l, u + 0.55), 0.5, 4.6, 0, 0.2, AC_BRICK)
      }
      slab(-0.05, l + 0.05, 4.6, 5.0, 0, 0.45, AC_DARK)
      if (isFront) {
        for (let j = 0; j < kb; j++) {
          const uc = w * (j + 0.5)
          panel(uc - hw, uc + hw, 0.8, 3.6, 0.08, [0.2, 0.2, 0.22], GL)
        }
      }
      // two floors of dark arched windows (the lower row segmental-headed), brick sills
      for (let j = 0; j < kb; j++) {
        const uc = w * (j + 0.5)
        arched(uc, 5.9, 7.8, hw, 0.45, 0.07, AC_DARK, GL)
        if (isFront) panel(uc - 0.05, uc + 0.05, 5.9, 8.25, 0.1, [0.25, 0.25, 0.27], GL)
        panel(uc - hw, uc + hw, 9.0, 11.0, 0.07, AC_DARK, GL)
        if (isFront) panel(uc - 0.05, uc + 0.05, 9.0, 11.0, 0.1, [0.25, 0.25, 0.27], GL)
        if (isFront) panel(uc - hw - 0.1, uc + hw + 0.1, 5.65, 5.85, 0.14, AC_BRICK, BK)
        if (isFront) panel(uc - hw - 0.1, uc + hw + 0.1, 8.75, 8.95, 0.14, AC_BRICK, BK)
      }
      slab(-0.1, l + 0.1, 11.5, 12.1, 0, 0.4, AC_CREAM)                                    // the cream string course
      // five floors of big blue-grey windows in pale frames; the top one arched
      for (let j = 0; j < kb; j++) {
        const uc = w * (j + 0.5)
        for (let r = 0; r < 5; r++) {
          const ya = 12.9 + 3.2 * r, yb = ya + 1.95
          if (r === 4) {
            arched(uc, ya - 0.1, yb, hw + 0.1, 0.5, 0.06, AC_FRAME, ST)
            arched(uc, ya, yb, hw, 0.42, 0.1, AC_GLASS, GL)
          } else {
            if (isFront) panel(uc - hw - 0.1, uc + hw + 0.1, ya - 0.1, yb + 0.1, 0.06, AC_FRAME, ST)
            panel(uc - hw, uc + hw, ya, yb, isFront ? 0.1 : 0.07, AC_GLASS, GL)
          }
          if (isFront) {
            panel(uc - 0.04, uc + 0.04, ya, yb + (r === 4 ? 0.4 : 0), 0.13, AC_FRAME, ST)
            if (r !== 4) panel(uc - hw, uc + hw, ya + 1.1, ya + 1.17, 0.13, AC_FRAME, ST)
          }
          if (isFront) panel(uc - hw - 0.15, uc + hw + 0.15, ya - 0.28, ya - 0.1, 0.16, AC_CREAM, ST)
        }
      }
      slab(-0.3, l + 0.3, Y_CORN - 0.5, Y_CORN, 0, 0.55, AC_CREAM)                          // the cornice
      if (isFront) slab(-0.3, l + 0.3, Y_CORN, PAR, 0, 0.35, AC_BRICK)                      // the parapet round the terrace
    } else {
      // the top floor
      const yb = isFront ? TOP : TOP
      if (isFront) {
        panel(0, l, y0, yb, 0, AC_DARK, GL)                                                 // continuous glazing, dark piers
        const k2 = Math.max(2, Math.round(l / 2.3))
        for (let j = 0; j <= k2; j++) {
          const u = (l * j) / k2
          panel(Math.max(0, u - 0.07), Math.min(l, u + 0.07), y0, yb, 0.05, AC_FRAME, ST)
        }
        panel(0, l, y0 + 1.4, y0 + 1.5, 0.05, AC_FRAME, ST)
        slab(-0.05, l + 0.05, yb - 0.5, yb, 0, 0.35, AC_BRICK)                              // brick fascia over the glazing
        slab(-0.2, l + 0.2, yb, yb + 0.25, 0, 0.5, AC_CREAM)
      } else {
        panel(0, l, y0, yb, 0, wall, BK)
        for (let j = 0; j < kb; j++) {
          const uc = w * (j + 0.5)
          panel(uc - hw, uc + hw, y0 + 0.6, y0 + 2.5, 0.07, AC_GLASS, GL)
          panel(uc - hw - 0.15, uc + hw + 0.15, y0 + 0.35, y0 + 0.55, 0.12, AC_CREAM, ST)
        }
        slab(-0.3, l + 0.3, yb - 0.5, yb, 0, 0.55, AC_CREAM)
      }
    }
  }
  for (const e of info) doEdge(e, 0, Y_CORN, false)
  for (const e of info2) doEdge(e, Y_CORN, TOP, true)

  // the terrace in front of the set-back floor
  {
    const { a, b, nx, nz } = front
    qd([[a.x, Y_CORN, a.z], [b.x, Y_CORN, b.z], [b.x - nx * SET, Y_CORN, b.z - nz * SET], [a.x - nx * SET, Y_CORN, a.z - nz * SET]], [0, 1, 0], AC_ROOF, CN)
  }
  capPolygonWithHoles(m, [ring2], TOP, AC_ROOF, CN)

  // ---- the crown: a curved brick wall on the setback line and the round emblem; the lens-shaped steel canopy before it ------
  {
    const { a, b, l, nx, nz } = front
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    // the setback line: a point on it at u along the front, pr out of it
    const Q = (u: number, y: number, pr: number): V3 => [a.x + tx * u - nx * SET + nx * pr, y, a.z + tz * u - nz * SET + nz * pr]
    const uc = l / 2, HW = Math.min(9.6, l * 0.28), DEPTH = 0.7
    const Y0 = TOP + 0.2, YE = TOP + 0.9, RISE = 2.3
    const prof = (x: number): number => YE + RISE * (1 - (x / HW) * (x / HW))
    const K = 10
    for (let k = 0; k < K; k++) {
      const x0 = -HW + (2 * HW * k) / K, x1 = -HW + (2 * HW * (k + 1)) / K
      qd([Q(uc + x0, Y0, 0), Q(uc + x1, Y0, 0), Q(uc + x1, prof(x1), 0), Q(uc + x0, prof(x0), 0)], [nx, 0, nz], AC_BRICK, BK)
      qd([Q(uc + x0, prof(x0), 0), Q(uc + x1, prof(x1), 0), Q(uc + x1, prof(x1), DEPTH), Q(uc + x0, prof(x0), DEPTH)], [0, 1, 0], AC_CREAM, ST)
      qd([Q(uc + x0, prof(x0) - 0.35, 0.05), Q(uc + x1, prof(x1) - 0.35, 0.05), Q(uc + x1, prof(x1) - 0.05, 0.05), Q(uc + x0, prof(x0) - 0.05, 0.05)], [nx, 0, nz], AC_CREAM, ST)
    }
    for (const sgn of [-1, 1]) {                                                          // the two ends of the crown wall
      const x = sgn * HW
      qd([Q(uc + x, Y0, 0), Q(uc + x, YE, 0), Q(uc + x, YE, DEPTH), Q(uc + x, Y0, DEPTH)], [tx * sgn, 0, tz * sgn], AC_BRICK, BK)
    }
    // the round emblem: a dark ring and a white disc
    const ey = YE + RISE - 1.3, ER = 1.0
    const disc = (r: number, pr: number, c: Rgb): void => {
      const N = 14
      for (let k = 0; k < N; k++) {
        const t0 = (2 * Math.PI * k) / N, t1 = (2 * Math.PI * (k + 1)) / N
        qd([Q(uc, ey, pr), Q(uc + r * Math.cos(t0), ey + r * Math.sin(t0), pr), Q(uc + r * Math.cos(t1), ey + r * Math.sin(t1), pr),
          Q(uc + r * Math.cos(t1), ey + r * Math.sin(t1), pr)], [nx, 0, nz], c, MT)
      }
    }
    disc(ER + 0.2, 0.06, AC_DARK)
    disc(ER - 0.1, 0.1, AC_WHITE)
    // the canopy: two arched steel ribs (one nearer the glass, one out over the terrace) joined by purlins, open beneath
    const CW = Math.min(8.2, l * 0.24), CY = PAR + 0.3, CR = 2.0
    const arc = (x: number): number => CY + CR * (1 - (x / CW) * (x / CW))
    const KR = 12
    const ribPr = [0.5, SET - 0.3]
    for (const pr of ribPr) {
      for (let k = 0; k < KR; k++) {
        const x0 = -CW + (2 * CW * k) / KR, x1 = -CW + (2 * CW * (k + 1)) / KR
        beam(Q(uc + x0, arc(x0), pr), Q(uc + x1, arc(x1), pr), 0.09, AC_STEEL)
      }
    }
    for (let k = 0; k <= KR; k += 2) {
      const x = -CW + (2 * CW * k) / KR
      beam(Q(uc + x, arc(x), ribPr[0]), Q(uc + x, arc(x), ribPr[1]), 0.07, AC_STEEL)           // ties across the terrace
      if (k > 0 && k < KR) beam(Q(uc + x, PAR, ribPr[1]), Q(uc + x, arc(x), ribPr[1]), 0.06, AC_STEEL)   // hangers
    }
    for (const sgn of [-1, 1]) for (const pr of ribPr) beam(Q(uc + sgn * CW, PAR, pr), Q(uc + sgn * CW, arc(sgn * CW), pr), 0.1, AC_STEEL)
  }

  // the model is already in the fit's own frame
  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

const SP_BRICK: Rgb = [0.36, 0.16, 0.13]        // #8b3b2f coded ~30 % down: brick renders orange in the city
const SP_BRICK_DK: Rgb = [0.27, 0.115, 0.095]   // the reveals: deep shadow inside the recesses
const SP_DARK: Rgb = [0.145, 0.16, 0.176]       // #25292d frames, top storey, roof
const SP_ROOF: Rgb = [0.06, 0.065, 0.075]       // the dark sloping roof edge
const SP_GLASS: Rgb = [0.25, 0.31, 0.37]        // window panes (#4c5a64, darker in the recess)
const SP_GLASS_GR: Rgb = [0.34, 0.45, 0.47]     // the pale teal ground-floor glazing

/**
 * 510 Townsend (Stripe HQ, 2019; OSM way/496374691, seven levels): six storeys of red brick, about 24 m, in a deep grid of
 * tall windows set 0.55 m behind proud brick piers; a glazed ground floor between the piers with a dark canopy at the
 * entrance; and a seventh storey of dark glass stepped back ~3 m, under a dark roof slab that overhangs the glass and
 * slopes up to a flat top near 30 m. Photographs: docs/shots/refs/notable/w496374691/way-496374691-02 and -03 (the whole
 * block from Townsend: brick grid, dark top, sloping roof edge), mapillary-0 (brick and deep windows up close),
 * mapillary-2 (the glazed ground floor). The 2010 LiDAR measured the demolished buildings and is ignored.
 *
 * Orientation: manifest front 135 (Townsend), the fit's front is local -z; the dark entrance canopy goes on the longest
 * ring edge facing -z. The window grid is the same on every side.
 */
function stripeHQ_510_Townsend(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const BK = surfaceTag('brick')
  const MT = surfaceTag('metal')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  const signedArea = (r: P2[]): number => {
    let a = 0
    for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
    return a
  }
  if (signedArea(ring) < 0) ring.reverse()
  const edgesOf = (r: P2[]) => r.map((a, i) => {
    const b = r[(i + 1) % r.length], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  /** inward mitre offset by d (negative grows the ring) */
  const inset = (r: P2[], d: number): P2[] => {
    const e = edgesOf(r), n = r.length
    return r.map((p, i) => {
      const e0 = e[(i + n - 1) % n], e1 = e[i]
      const k = 1 + e0.nx * e1.nx + e0.nz * e1.nz
      return { x: p.x - ((e0.nx + e1.nx) / k) * d, z: p.z - ((e0.nz + e1.nz) / k) * d }
    })
  }
  // the top storey's plan: the outline with its small jogs ironed out
  let simple = ring.slice()
  for (;;) {
    const e = edgesOf(simple)
    let k = -1, best = 6
    for (let i = 0; i < e.length; i++) if (e[i].l < best) { best = e[i].l; k = i }
    if (k < 0 || simple.length <= 4) break
    simple.splice((k + 1) % simple.length, 1)
  }
  const info = edgesOf(ring)
  const fronts = info.filter((e) => e.l > 12 && e.nz < -0.85)
  const front = fronts.length ? fronts.reduce((p, c) => (c.l > p.l ? c : p)) : info.reduce((p, c) => (c.nz < p.nz ? c : p))

  const Y1 = 4.6, FL = 3.9, NF = 5, YT = Y1 + FL * NF          // ground floor, five brick floors, top storey base 24.1
  const YG = YT + 4.0, YR = YT + 6.0                            // glass top, roof high point
  const RECESS = 0.55

  const qd = (pts: V3[], nrm: V3, c: Rgb, tag: number): void => {
    const e1: V3 = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1], pts[1][2] - pts[0][2]]
    const e2: V3 = [pts[3][0] - pts[0][0], pts[3][1] - pts[0][1], pts[3][2] - pts[0][2]]
    const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0]
    const ok = cx * nrm[0] + cy * nrm[1] + cz * nrm[2] < 0
    m.quad(ok ? pts : [pts[0], pts[3], pts[2], pts[1]], nrm, uv, c, tag)
  }

  for (const e of info) {
    const { a, b, l, nx, nz } = e
    if (l < 0.4) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const face = (u0: number, u1: number, ya: number, yb: number, pr: number, c: Rgb, tag: number): void =>
      qd([P(u0, ya, pr), P(u1, ya, pr), P(u1, yb, pr), P(u0, yb, pr)], [nx, 0, nz], c, tag)
    // a quad running into the wall (a reveal): from the face at u0..u1/ya..yb to pr = -RECESS
    const sideL = (u: number, ya: number, yb: number, c: Rgb): void =>
      qd([P(u, ya, 0), P(u, ya, -RECESS), P(u, yb, -RECESS), P(u, yb, 0)], [tx, 0, tz], c, BK)
    const sideR = (u: number, ya: number, yb: number, c: Rgb): void =>
      qd([P(u, ya, 0), P(u, ya, -RECESS), P(u, yb, -RECESS), P(u, yb, 0)], [-tx, 0, -tz], c, BK)
    const head = (u0: number, u1: number, y: number, c: Rgb): void =>
      qd([P(u0, y, 0), P(u1, y, 0), P(u1, y, -RECESS), P(u0, y, -RECESS)], [0, -1, 0], c, BK)
    const sill = (u0: number, u1: number, y: number, c: Rgb): void =>
      qd([P(u0, y, 0), P(u1, y, 0), P(u1, y, -RECESS), P(u0, y, -RECESS)], [0, 1, 0], c, BK)

    // the brick wall as a whole, from below the street up to the top storey
    if (l < 3.4) { face(0, l, -3, YT, 0, SP_BRICK, BK); continue }
    const kb = Math.max(1, Math.round(l / 5.0)), w = l / kb
    const pw = w * 0.22                                       // pier width
    const isFront = e === info[front.i]
    for (let j = 0; j < kb; j++) {
      const ua = w * j + (j === 0 ? 0 : pw / 2), ub = w * (j + 1) - (j === kb - 1 ? 0 : pw / 2)   // the opening between piers
      const ua2 = j === 0 ? pw / 2 : ua, ub2 = j === kb - 1 ? l - pw / 2 : ub
      // pier (left side of the bay)
      if (j === 0) face(0, ua2, -3, YT, 0, SP_BRICK, BK)
      face(ub2, j === kb - 1 ? l : ub2 + pw, -3, YT, 0, SP_BRICK, BK)
      // ground floor: pale glazing behind the piers, dark band over it
      sideL(ua2, 0, Y1 - 0.5, SP_BRICK_DK); sideR(ub2, 0, Y1 - 0.5, SP_BRICK_DK)
      face(ua2, ub2, 0.15, Y1 - 0.5, -RECESS, SP_GLASS_GR, GL)
      face(ua2, ub2, 0, 0.15, -RECESS, SP_DARK, MT)
      face(ua2, ub2, Y1 - 0.5, Y1 + 0.9, 0, SP_BRICK, BK)       // brick lintel band over the ground floor
      head(ua2, ub2, Y1 - 0.5, SP_BRICK_DK)
      for (let r = 0; r < NF; r++) {
        const f = Y1 + FL * r, ya = f + 0.9, yb = f + 3.4
        sideL(ua2, ya, yb, SP_BRICK_DK); sideR(ub2, ya, yb, SP_BRICK_DK)
        head(ua2, ub2, yb, SP_BRICK_DK); sill(ua2, ub2, ya, SP_BRICK_DK)
        face(ua2, ub2, ya, yb, -RECESS, SP_GLASS, GL)
        const um = (ua2 + ub2) / 2
        face(um - 0.05, um + 0.05, ya, yb, -RECESS + 0.04, SP_DARK, MT)       // the central mullion
        if (r < NF - 1) face(ua2, ub2, yb, f + FL + 0.9, 0, SP_BRICK, BK)   // spandrel up to the next sill
      }
      face(ua2, ub2, Y1 + FL * (NF - 1) + 3.4, YT, 0, SP_BRICK, BK)           // top spandrel up to the parapet
    }
    // the entrance on the Townsend front: a dark canopy over the ground floor, centred on the long edge
    if (isFront) {
      const uc = l * 0.55
      boxAlong(m, a.x + tx * uc + nx * 1.1, Y1 - 0.2, a.z + tz * uc + nz * 1.1, 4.2, 0.18, 1.2, Math.atan2(nx, nz), SP_DARK, MT)
      face(uc - 3.5, uc + 3.5, 0.2, Y1 - 0.5, -RECESS + 0.02, [0.06, 0.07, 0.08], GL)
    }
  }
  // brick parapet cap: the terrace round the top storey
  const ring2 = inset(simple, 3.0)
  capPolygonWithHoles(m, [ring, ring2], YT, [0.16, 0.17, 0.18], BK)

  // the seventh storey: dark glass between thin frames, set back
  const info2 = edgesOf(ring2)
  for (const e of info2) {
    const { a, b, l, nx, nz } = e
    if (l < 0.5) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const face = (u0: number, u1: number, ya: number, yb: number, pr: number, c: Rgb, tag: number): void =>
      qd([P(u0, ya, pr), P(u1, ya, pr), P(u1, yb, pr), P(u0, yb, pr)], [nx, 0, nz], c, tag)
    face(0, l, YT, YG, 0, [0.13, 0.17, 0.21], GL)
    const k = Math.max(2, Math.round(l / 2.4))
    for (let j = 0; j <= k; j++) {
      const u = (l * j) / k
      face(Math.max(0, u - 0.07), Math.min(l, u + 0.07), YT, YG, 0.05, SP_DARK, MT)
    }
    face(0, l, YT + 1.9, YT + 2.0, 0.05, SP_DARK, MT)
  }
  // the dark roof: a vertical fascia overhanging the glass, then a slope rising to the flat top
  const ringO = inset(ring2, -0.7), ring3 = inset(ring2, 3.2)
  const eO = edgesOf(ringO)
  const n2 = ring2.length
  for (let i = 0; i < n2; i++) {
    const a = ringO[i], b = ringO[(i + 1) % n2], a3 = ring3[i], b3 = ring3[(i + 1) % n2]
    const { nx, nz } = eO[i]
    qd([[a.x, YG - 0.3, a.z], [b.x, YG - 0.3, b.z], [b.x, YG + 0.4, b.z], [a.x, YG + 0.4, a.z]], [nx, 0, nz], SP_ROOF, MT)
    const sl = Math.hypot(YR - YG - 0.4, 3.9) || 1
    const sn: V3 = [nx * (YR - YG - 0.4) / sl, 3.9 / sl, nz * (YR - YG - 0.4) / sl]
    qd([[a.x, YG + 0.4, a.z], [b.x, YG + 0.4, b.z], [b3.x, YR, b3.z], [a3.x, YR, a3.z]], sn, SP_ROOF, MT)
    // underside of the overhang
    qd([[a.x, YG - 0.3, a.z], [b.x, YG - 0.3, b.z], [ring2[(i + 1) % n2].x, YG - 0.3, ring2[(i + 1) % n2].z], [ring2[i].x, YG - 0.3, ring2[i].z]], [0, -1, 0], SP_ROOF, MT)
  }
  capPolygonWithHoles(m, [ring3], YR, SP_ROOF, MT)

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

const CB_FRAME: Rgb = [0.62, 0.63, 0.64]        // #d9dbdc coded down: pale grey-white concrete frame
const CB_WHITE: Rgb = [0.72, 0.73, 0.73]        // #e9eaea the pavilions
const CB_GLASS: Rgb = [0.2, 0.28, 0.34]         // #6d8392 blue-grey glazing, darker in the recesses
const CB_BLUE: Rgb = [0.27, 0.38, 0.5]          // the bluer upper-floor glass
const CB_MULL: Rgb = [0.66, 0.67, 0.68]         // fine white mullions
const CB_GLASS0: Rgb = [0.15, 0.21, 0.25]
const CB_DARK: Rgb = [0.14, 0.16, 0.18]         // dark spandrel bands, the door
const CB_PLINTH: Rgb = [0.44, 0.45, 0.47]       // the concrete plinth under the glass

/**
 * China Basin Landing, 185 Berry Street (OSM way/46264110 Berry Street Building, 25 m; way/46264108 Wharfside Building,
 * 23 m): two ~250 m converted-warehouse office blocks that are ONE design, so both manifest entries use this builder on
 * their own footprints. Photographs: docs/shots/refs/notable/china-basin/way-46264110-02 (the Berry Street front: a pale
 * concrete frame of piers and floor bands round big gridded blue-grey glass, an arched entrance pavilion with square
 * openings and steps, a railing on the plinth), -01 and way-46264108-01/02 (the pavilion again; the upper two storeys
 * are bluer glass stepped back behind a projecting band, which the pack's "five storeys of grid" does not say),
 * mapillary-0 (the stepped upper glass and the railed plinth). The grid runs round all four sides; the arched white
 * pavilions, ~8 m wide, ~2 m above the roof, stand every ~60 m on the front only.
 *
 * Orientation: front on local -z (manifest front 315 Berry Street Building, 135 Wharfside Building); the pavilions go on
 * the longest ring edge facing -z.
 */
function chinaBasinLanding_185_Berry(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const CC = surfaceTag('concrete')
  const MT = surfaceTag('metal')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  const signedArea = (r: P2[]): number => {
    let a = 0
    for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
    return a
  }
  if (signedArea(ring) < 0) ring.reverse()
  const edgesOf = (r: P2[]) => r.map((a, i) => {
    const b = r[(i + 1) % r.length], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  const inset = (r: P2[], d: number): P2[] => {
    const e = edgesOf(r), n = r.length
    return r.map((p, i) => {
      const e0 = e[(i + n - 1) % n], e1 = e[i]
      const k = 1 + e0.nx * e1.nx + e0.nz * e1.nz
      return { x: p.x - ((e0.nx + e1.nx) / k) * d, z: p.z - ((e0.nz + e1.nz) / k) * d }
    })
  }
  let simple = ring.slice()
  for (;;) {
    const e = edgesOf(simple)
    let k = -1, best = 6
    for (let i = 0; i < e.length; i++) if (e[i].l < best) { best = e[i].l; k = i }
    if (k < 0 || simple.length <= 4) break
    simple.splice((k + 1) % simple.length, 1)
  }
  const info = edgesOf(ring)
  const fronts = info.filter((e) => e.l > 40 && e.nz < -0.85)
  const front = fronts.length ? fronts.reduce((p, c) => (c.l > p.l ? c : p)) : info.reduce((p, c) => (c.nz < p.nz ? c : p))

  const H = fit.height > 10 ? fit.height : 25
  const PL = 1.1                                   // plinth
  const FL = (H - PL - 0.4) / 5                    // storey
  const YB = PL + FL * 3                           // the break: three frame storeys, then two set back
  const STEP = 2.6
  const qd = (pts: V3[], nrm: V3, c: Rgb, tag: number): void => {
    const e1: V3 = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1], pts[1][2] - pts[0][2]]
    const e2: V3 = [pts[3][0] - pts[0][0], pts[3][1] - pts[0][1], pts[3][2] - pts[0][2]]
    const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0]
    const ok = cx * nrm[0] + cy * nrm[1] + cz * nrm[2] < 0
    m.quad(ok ? pts : [pts[0], pts[3], pts[2], pts[1]], nrm, uv, c, tag)
  }
  /** A wall's frame: P(u, y, pr) in metres along, up and out of the edge */
  const wall = (a: P2, b: P2, nx: number, nz: number, l: number) => {
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const face = (u0: number, u1: number, ya: number, yb: number, pr: number, c: Rgb, tag: number): void =>
      qd([P(u0, ya, pr), P(u1, ya, pr), P(u1, yb, pr), P(u0, yb, pr)], [nx, 0, nz], c, tag)
    return { tx, tz, P, face }
  }

  for (const e of info) {
    const { a, b, l, nx, nz } = e
    if (l < 0.4) continue
    const { tx, tz, P, face } = wall(a, b, nx, nz, l)
    const isFront = e === info[front.i]
    face(0, l, -3, PL, 0, CB_PLINTH, CC)
    face(0, l, PL, YB, 0, CB_FRAME, CC)
    if (l < 3.4) continue
    // railing along the plinth: a top rail, a foot rail and posts every 6 m
    face(0, l, PL + 0.85, PL + 0.95, 0.3, CB_MULL, MT)
    face(0, l, PL + 0.05, PL + 0.12, 0.3, CB_MULL, MT)
    for (let u = 3; u < l - 1; u += 6) face(u - 0.04, u + 0.04, PL, PL + 0.95, 0.3, CB_MULL, MT)
    const kb = Math.max(1, Math.round(l / 5.5)), w = l / kb
    for (let s = 0; s < 3; s++) {
      const f = PL + FL * s
      face(0, l, f + 0.7, f + FL - 0.5, 0.05, s === 0 ? CB_GLASS0 : CB_GLASS, GL)          // glazing, ground storey a little darker
      face(0, l, f + FL * 0.5 + 0.05, f + FL * 0.5 + 0.13, 0.1, CB_MULL, MT)             // transom
      face(0, l, f + FL - 0.5, f + FL + 0.12, 0.2, CB_FRAME, CC)                         // floor band
      qd([P(0, f + FL - 0.5, 0.2), P(l, f + FL - 0.5, 0.2), P(l, f + FL - 0.5, 0), P(0, f + FL - 0.5, 0)], [0, -1, 0], CB_FRAME, CC)
    }
    for (let j = 0; j <= kb; j++) {
      const u = w * j
      const u0 = Math.max(0, u - 0.28), u1 = Math.min(l, u + 0.28)
      face(u0, u1, PL, YB, 0.16, CB_FRAME, CC)                                            // pier
      if (u0 > 0) qd([P(u0, PL, 0), P(u0, PL, 0.16), P(u0, YB, 0.16), P(u0, YB, 0)], [-tx, 0, -tz], CB_FRAME, CC)
      if (u1 < l) qd([P(u1, PL, 0), P(u1, PL, 0.16), P(u1, YB, 0.16), P(u1, YB, 0)], [tx, 0, tz], CB_FRAME, CC)
      if (j < kb) for (const t of [1 / 3, 2 / 3]) face(u + w * t - 0.03, u + w * t + 0.03, PL + 0.7, YB, 0.12, CB_MULL, MT) // the mullions
    }
    // the projecting band at the break
    face(0, l, YB - 0.9, YB + 0.2, 0.35, CB_FRAME, CC)
    qd([P(0, YB + 0.2, 0.35), P(l, YB + 0.2, 0.35), P(l, YB + 0.2, 0), P(0, YB + 0.2, 0)], [0, 1, 0], CB_FRAME, CC)

    if (isFront) {
      const k = Math.max(1, Math.round(l / 60))
      for (let q = 0; q < k; q++) {
        const uc = (l * (q + 0.5)) / k
        const hd = Math.atan2(nx, nz)
        const D = 1.3, PW = 5.0
        const top = H + 2.2
        const cx = a.x + tx * uc + nx * (0.7 - D / 2), cz = a.z + tz * uc + nz * (0.7 - D / 2)
        boxAlong(m, cx, (top - 2) / 2, cz, PW, (top + 2) / 2, D / 2, hd, CB_WHITE, CC)
        const pf = 0.74
        const sq = (uOff: number, y: number): void => face(uc + uOff - 0.6, uc + uOff + 0.6, y, y + 1.2, pf + 0.03, CB_DARK, GL)
        for (const sgn of [-1, 1]) { sq(sgn * 4.1, PL + 2.6); sq(sgn * 4.1, PL + 2.6 + FL * 1.3); sq(sgn * 4.1, PL + 2.6 + FL * 2.6) }
        // the arch window at the top, a dark spandrel band under it, the wide window, a band, the door
        const sp = H - 3.4
        emOpening(m, a.x + tx * uc + nx * 0, a.z + tz * uc + nz * 0, tx, tz, nx, nz, H - 6.4, sp, 3.0, 3.0, CB_GLASS, GL, pf + 0.03, 10)
        face(uc - 0.04, uc + 0.04, H - 6.4, sp + 3.0, pf + 0.06, CB_MULL, MT)
        face(uc - 3.0, uc + 3.0, sp - 0.04, sp + 0.04, pf + 0.06, CB_MULL, MT)
        face(uc - 3.6, uc + 3.6, H - 8.2, H - 6.6, pf + 0.25, CB_DARK, MT)
        qd([P(uc - 3.6, H - 6.6, pf + 0.25), P(uc + 3.6, H - 6.6, pf + 0.25), P(uc + 3.6, H - 6.6, pf), P(uc - 3.6, H - 6.6, pf)], [0, 1, 0], CB_DARK, MT)
        face(uc - 3.3, uc + 3.3, H - 13.0, H - 8.5, pf + 0.03, CB_GLASS, GL)
        face(uc - 3.3, uc + 3.3, H - 11.2, H - 11.1, pf + 0.06, CB_MULL, MT)
        for (let g = -2; g <= 2; g++) face(uc + g * 1.3 - 0.03, uc + g * 1.3 + 0.03, H - 13.0, H - 8.5, pf + 0.06, CB_MULL, MT)
        face(uc - 3.6, uc + 3.6, H - 14.6, H - 13.3, pf + 0.25, CB_DARK, MT)
        face(uc - 2.8, uc + 2.8, PL, PL + 4.2, pf + 0.03, CB_DARK, GL)
        // steps up to the door
        for (let s = 0; s < 3; s++) {
          boxAlong(m, a.x + tx * uc + nx * (0.7 + 0.3 * (s + 0.5)), PL * (0.34 * (3 - s)) / 2 + 0.0, a.z + tz * uc + nz * (0.7 + 0.3 * (s + 0.5)),
            3.0, PL * 0.17 * (3 - s), 0.15, hd, CB_PLINTH, CC)
        }
      }
    }
  }

  // the stepped-back upper storeys: bluer glass in fine frames
  const ring2 = inset(simple, STEP)
  capPolygonWithHoles(m, [ring, ring2], YB + 0.2, CB_FRAME, CC)
  const info2 = edgesOf(ring2)
  for (const e of info2) {
    const { a, b, l, nx, nz } = e
    if (l < 0.5) continue
    const { face } = wall(a, b, nx, nz, l)
    face(0, l, YB + 0.2, H, 0, CB_BLUE, GL)
    for (let s = 0; s < 2; s++) {
      const f = YB + 0.2 + (H - YB - 0.2) * s / 2
      face(0, l, f + (H - YB - 0.2) / 2 - 0.12, f + (H - YB - 0.2) / 2 + 0.02, 0.1, CB_FRAME, MT)
    }
    const k = Math.max(1, Math.round(l / 3.0))
    for (let j = 0; j <= k; j++) {
      const u = (l * j) / k
      face(Math.max(0, u - 0.05), Math.min(l, u + 0.05), YB + 0.2, H, 0.08, CB_MULL, MT)
    }
    face(0, l, H - 0.1, H + 0.3, 0.12, CB_FRAME, CC)
  }
  capPolygonWithHoles(m, [ring2], H + 0.3, CB_FRAME, CC)
  capPolygonWithHoles(m, [ring], YB - 0.9, CB_FRAME, CC)

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// Zinc-and-timber apartments, 8th & Brannan
// ---------------------------------------------------------------------------------------------------------------

/**
 * OSM relation/7814535's outer ring (docs/shots/refs/notable/w15629071/EVIDENCE.md), anticlockwise, in the evidence frame
 * (x east, z north). Brannan Street is the long NW face (bearing 315), 8th Street the SW one (225, the faceted run with
 * the undulating bays), Townsend the SE one; the rounded zinc corner is the W corner where 8th meets Brannan.
 */
const ZA_OUT: P2[] = [[-53.1, -11.6], [-47.2, -17.4], [-44.2, -14.5], [-41.8, -16.8], [-43.1, -18.1], [-40.8, -20.4], [-42.6, -22.2],
  [-34.6, -30.0], [-31.9, -34.1], [-25.6, -39.2], [-23.9, -42.1], [-19.8, -44.6], [-8.6, -57.3], [-5.9, -59.0], [-2.3, -59.0],
  [-0.0, -58.0], [40.8, -15.5], [50.0, -5.9], [49.1, -5.0], [51.6, -2.4], [50.1, -0.3], [14.4, 35.2], [21.2, 42.0], [18.7, 44.5],
  [36.6, 62.2], [45.8, 72.5], [47.7, 74.3], [39.9, 82.0], [3.1, 45.1], [5.1, 43.2], [-2.6, 35.5], [35.6, -2.3], [31.7, -6.1],
  [27.7, -10.2], [-9.9, 27.0], [-18.1, 18.9], [-20.3, 21.1]].map(([x, z]) => ({ x, z }))
/** The courtyard (the OSM hole), clockwise so that every wall's normal looks into it. */
const ZA_HOLE: P2[] = [[-29.2, -3.8], [-19.0, 6.6], [6.7, -19.2], [-3.8, -29.4]].map(([x, z]) => ({ x, z }))

/**
 * The rotation + translation carrying the evidence frame onto `ring` (a 2-D Procrustes fit of ZA_OUT's 37 vertices over
 * both orders and every start vertex; the edge-matching fit when the ring has another vertex count). Null when nothing
 * fits within 2 m — the caller then keeps the evidence frame.
 */
function zaFit(ring: P2[] | undefined): { c: number; s: number; tx: number; tz: number; res: number } | null {
  if (!ring) return null
  type T = { c: number; s: number; tx: number; tz: number; res: number }
  const plan = ZA_OUT
  let R = ring
  if (R.length === plan.length + 1 && Math.hypot(R[0].x - R[R.length - 1].x, R[0].z - R[R.length - 1].z) < 0.3) R = R.slice(0, -1)
  const n = plan.length
  const loose = (): T | null => {
    if (R.length < 4) return null
    const ca = emanuElCentroid(plan), cb = emanuElCentroid(R)
    const edges = (r: P2[]): { L: number; a: number }[] => r.map((p, i) => {
      const q = r[(i + 1) % r.length]
      return { L: Math.hypot(q.x - p.x, q.z - p.z), a: Math.atan2(q.z - p.z, q.x - p.x) }
    })
    const ea = edges(plan).filter((e) => e.L > 15), eb = edges(R).filter((e) => e.L > 15)
    let best: T | null = null
    for (const a of ea) for (const b of eb) {
      if (Math.abs(a.L - b.L) > 0.2 * a.L) continue
      const th = b.a - a.a, c = Math.cos(th), s = Math.sin(th)
      const tx = cb.x - (ca.x * c - ca.z * s), tz = cb.z - (ca.x * s + ca.z * c)
      const Tp = plan.map((p) => ({ x: p.x * c - p.z * s + tx, z: p.x * s + p.z * c + tz }))
      let e = 0
      for (const v of R) {
        let d = Infinity
        for (let i = 0; i < Tp.length; i++) {
          const p = Tp[i], q = Tp[(i + 1) % Tp.length]
          const dx = q.x - p.x, dz = q.z - p.z
          const u = Math.max(0, Math.min(1, ((v.x - p.x) * dx + (v.z - p.z) * dz) / (dx * dx + dz * dz || 1)))
          d = Math.min(d, Math.hypot(v.x - p.x - dx * u, v.z - p.z - dz * u))
        }
        e += d * d
      }
      const res = Math.sqrt(e / R.length)
      if (!best || res < best.res) best = { c, s, tx, tz, res }
    }
    return best && (best as T).res <= 2 ? best : null
  }
  if (R.length !== n) return loose()
  const cb = { x: R.reduce((t, p) => t + p.x, 0) / n, z: R.reduce((t, p) => t + p.z, 0) / n }
  const ca = { x: plan.reduce((t, p) => t + p.x, 0) / n, z: plan.reduce((t, p) => t + p.z, 0) / n }
  let best: T | null = null
  for (const rev of [false, true]) {
    const Q = rev ? [...plan].reverse() : plan
    for (let o = 0; o < n; o++) {
      let sn = 0, cs = 0
      for (let i = 0; i < n; i++) {
        const a = Q[(i + o) % n]
        const ax = a.x - ca.x, az = a.z - ca.z, bx = R[i].x - cb.x, bz = R[i].z - cb.z
        cs += ax * bx + az * bz
        sn += ax * bz - az * bx
      }
      const th = Math.atan2(sn, cs), c = Math.cos(th), s = Math.sin(th)
      let e = 0
      for (let i = 0; i < n; i++) {
        const a = Q[(i + o) % n]
        const x = (a.x - ca.x) * c - (a.z - ca.z) * s + cb.x
        const z = (a.x - ca.x) * s + (a.z - ca.z) * c + cb.z
        e += (x - R[i].x) ** 2 + (z - R[i].z) ** 2
      }
      const res = Math.sqrt(e / n)
      if (!best || res < best.res) best = { c, s, tx: cb.x - (ca.x * c - ca.z * s), tz: cb.z - (ca.x * s + ca.z * c), res }
    }
  }
  return best && best.res <= 2 ? best : loose()
}

const ZA_ZINC_A: Rgb = [0.52, 0.56, 0.57]
const ZA_ZINC_B: Rgb = [0.45, 0.49, 0.5]
const ZA_ZINC_C: Rgb = [0.57, 0.61, 0.62]
const ZA_CAP: Rgb = [0.3, 0.32, 0.34]
const ZA_BROWN: Rgb = [0.15, 0.085, 0.065]
const ZA_FIN_A: Rgb = [0.24, 0.13, 0.095]
const ZA_FIN_B: Rgb = [0.2, 0.105, 0.08]
const ZA_GLASS: Rgb = [0.17, 0.19, 0.22]
const ZA_FRAME: Rgb = [0.88, 0.89, 0.9]
const ZA_SHOP: Rgb = [0.34, 0.43, 0.48]
const ZA_LINTEL: Rgb = [0.12, 0.13, 0.14]
const ZA_CONC: Rgb = [0.6, 0.6, 0.58]
const ZA_SOFFIT: Rgb = [0.17, 0.18, 0.19]
const ZA_GREY: Rgb = [0.62, 0.62, 0.6]
const ZA_ROOF: Rgb = [0.36, 0.36, 0.37]

/**
 * What a ring edge is dressed with, in the ring's anticlockwise order: z = bowed zinc (wall swells out in shallow
 * arcs, ~9.5 m bays), b = brown timber fins on a flat wall, p = flat zinc, g = plain grey (slot and courtyard walls).
 * Lengths are proportions of the edge. Edges not listed are flat zinc; the corner arc (`a`) and the faceted 8th Street
 * run (`c`, whose plan already undulates) are zinc panels without a further bow.
 */
const ZA_SECS: Record<number, [string, number][]> = {
  36: [['b', 9.3], ['z', 29.5]], 34: [['z', 1]], 29: [['z', 1]], 27: [['z', 13.5], ['b', 12], ['z', 13.5], ['b', 13]],
  26: [['b', 1]], 20: [['b', 20], ['z', 15], ['b', 15.3]], 15: [['z', 12], ['b', 28], ['z', 18.9]], 16: [['b', 1]],
  6: [['z', 1]], 7: [['c', 1]], 8: [['c', 1]], 9: [['c', 1]], 10: [['c', 1]], 11: [['c', 1]], 12: [['c', 1]], 13: [['c', 1]], 14: [['c', 1]],
  30: [['g', 1]], 31: [['g', 1]], 32: [['g', 1]], 33: [['g', 1]],
}

/**
 * Zinc-and-timber apartments, 8th & Brannan (OSM relation/7814535, six storeys round a courtyard; the 2010s block with
 * Peet's, Trek and Wells Fargo at the ground). Own geometry from docs/shots/refs/notable/w15629071 (Mapillary 1–3 and the
 * Commons frames; mapillary-0 is the white neighbour with the Trek shop, ignored):
 *
 * - the plan, drawn in the evidence frame and carried onto `fit.ring` by `zaFit` (Procrustes); the courtyard hole (not in
 *   the ring) goes through the same transform and is capped out of the roof with `capPolygonWithHoles`;
 * - a glazed shop storey (dark teal glass between grey piers, a dark lintel) set back 2.2 m under the upper floors;
 * - the street fronts in alternating long sections: BOWED ZINC — custom polygon strips of ~1.15 m standing-seam panels
 *   whose wall swells out up to 1.3 m in shallow bays, each bay with a white-framed ribbon of three tall windows and
 *   a balcony — and BROWN TIMBER: a flat dark wall faced in thin vertical fins (3 quads each) with deep punched windows;
 * - the big ROUNDED ZINC CORNER where 8th meets Brannan: an 8 m radius arc, ten facets, rebuilt over OSM's square corner
 *   (the photographs, not the outline, show it); the south tip is already a round in the plan;
 * - plain grey walls to the courtyard and the slot between the wings.
 */
function zincApartments_8th_Brannan(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const MTL = surfaceTag('metal'), CON = surfaceTag('concrete')
  const H = 22, G = 4.8, FL = 3.4, B = 0.9, GI = 2.2, NF = 5
  const Q = (p: V3[], n: V3, col: Rgb, tag = 0): void => m.quad(p, n, uv, col, tag)

  // ---- the ring with the 8th/Brannan corner turned into an arc ---------------------------------------------------------
  const nO = ZA_OUT.length
  const R0 = 7.5, NA = 10
  const ring: P2[] = [], kind: number[] = []
  for (let i = 1; i < nO; i++) { ring.push(ZA_OUT[i]); kind.push(i) }   // edge i starts at vertex i
  {
    const P0 = ZA_OUT[0], Pm = ZA_OUT[nO - 1], P1 = ZA_OUT[1]
    const l1 = Math.hypot(P0.x - Pm.x, P0.z - Pm.z), l2 = Math.hypot(P1.x - P0.x, P1.z - P0.z)
    const d1 = { x: (P0.x - Pm.x) / l1, z: (P0.z - Pm.z) / l1 }, d2 = { x: (P1.x - P0.x) / l2, z: (P1.z - P0.z) / l2 }
    const n1 = { x: d1.z, z: -d1.x }, n2 = { x: d2.z, z: -d2.x }
    const T1 = { x: P0.x - d1.x * R0, z: P0.z - d1.z * R0 }
    const C = { x: T1.x - n1.x * R0, z: T1.z - n1.z * R0 }
    const a1 = Math.atan2(n1.z, n1.x)
    let da = Math.atan2(n2.z, n2.x) - a1
    da = ((da + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI
    // edge 36 now ends at T1 (the arc's first point); the arc's edges are 'a'; the last arc point T2 starts the rest of edge 0
    for (let k = 0; k <= NA; k++) {
      const a = a1 + (da * k) / NA
      ring.push({ x: C.x + Math.cos(a) * R0, z: C.z + Math.sin(a) * R0 })
      kind.push(k === NA ? 0 : 100 + k)
    }
  }
  const roofOuter: P2[] = []

  /** One wall ring (outer or the courtyard): walls, shop storey, soffits, windows, balconies; returns the roof line. */
  const buildRing = (rp: P2[], kinds: number[], hole: boolean, top: P2[]): void => {
    const N = rp.length
    const nrm = rp.map((a, i) => {
      const b = rp[(i + 1) % N]
      const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
      return { L, tx: (b.x - a.x) / L, tz: (b.z - a.z) / L, nx: (b.z - a.z) / L, nz: -(b.x - a.x) / L }
    })
    /** vertex i pushed d into the material along the mitre of its two walls */
    const off = (i: number, d: number): P2 => {
      const a = nrm[(i + N - 1) % N], b = nrm[i % N]
      const den = Math.max(0.25, 1 + a.nx * b.nx + a.nz * b.nz)
      return { x: rp[i % N].x - ((a.nx + b.nx) / den) * d, z: rp[i % N].z - ((a.nz + b.nz) / den) * d }
    }
    const bIn = hole ? 0 : B
    const gIn = hole ? 0.35 : GI
    const at = (i: number, s: number, d: number, b = 0): P2 => {
      const p = off(i, d), q = off(i + 1, d), e = nrm[i]
      return { x: p.x + (q.x - p.x) * s + e.nx * b, z: p.z + (q.z - p.z) * s + e.nz * b }
    }
    const P3 = (p: P2, y: number): V3 => [p.x, y, p.z]
    /** a wall frame at fraction s: centre, tangent, normal, with the bay bow `bf` */
    const frame = (i: number, s: number, bf: (s: number) => number): { p: P2; tx: number; tz: number; nx: number; nz: number } => {
      const e = 0.003
      const a = at(i, Math.max(0, s - e), bIn, bf(Math.max(0, s - e))), b = at(i, Math.min(1, s + e), bIn, bf(Math.min(1, s + e)))
      const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
      const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
      return { p: at(i, s, bIn, bf(s)), tx, tz, nx: tz, nz: -tx }
    }
    const win = (f: { p: P2; tx: number; tz: number; nx: number; nz: number }, y0: number, y1: number, hw: number, col: Rgb, tag: number, proud: number): void => {
      const cx = f.p.x + f.nx * proud, cz = f.p.z + f.nz * proud
      Q([[cx - f.tx * hw, y0, cz - f.tz * hw], [cx + f.tx * hw, y0, cz + f.tz * hw], [cx + f.tx * hw, y1, cz + f.tz * hw],
        [cx - f.tx * hw, y1, cz - f.tz * hw]], [f.nx, 0, f.nz], col, tag)
    }
    const flat = (_s: number): number => 0

    for (let i = 0; i < N; i++) {
      const e = nrm[i]
      const k = kinds[i]
      const L = e.L
      const arcK = typeof k === 'number' && k >= 100 ? k - 100 : -1
      const secs: [string, number][] = arcK >= 0 ? [['a', 1]] : (hole ? [['g', 1]] : (ZA_SECS[k] ?? [['p', 1]]))
      const tot = secs.reduce((t, x) => t + x[1], 0)

      // ---- the shop storey: plinth, glass between piers, a dark lintel; soffit handled with the upper wall ----
      const gl = (a: number, b: number): void => {
        const bays = Math.max(1, Math.round((b - a) * L / 5.5))
        for (let j = 0; j < bays; j++) {
          const s0 = a + ((b - a) * j) / bays, s1 = a + ((b - a) * (j + 1)) / bays
          const p0 = at(i, s0, gIn), p1 = at(i, s1, gIn)
          const n3: V3 = [e.nx, 0, e.nz]
          Q([P3(p0, 0), P3(p1, 0), P3(p1, 0.35), P3(p0, 0.35)], n3, ZA_CONC, CON)
          Q([P3(p0, 0.35), P3(p1, 0.35), P3(p1, G - 0.7), P3(p0, G - 0.7)], n3, ZA_SHOP, GL)
          Q([P3(at(i, s0, gIn - 0.08), G - 0.7), P3(at(i, s1, gIn - 0.08), G - 0.7), P3(at(i, s1, gIn - 0.08), G), P3(at(i, s0, gIn - 0.08), G)], n3, ZA_LINTEL, CON)
          if (j > 0 && L * (b - a) > 6 && bays > 1) {
            // a grey pier between the shop bays (front and both cheeks)
            const hw = 0.28 / L, pf = 0.3
            const pa = at(i, s0 - hw, gIn, pf), pb = at(i, s0 + hw, gIn, pf), qa = at(i, s0 - hw, gIn), qb = at(i, s0 + hw, gIn)
            Q([P3(pa, 0), P3(pb, 0), P3(pb, G - 0.7), P3(pa, G - 0.7)], n3, ZA_CONC, CON)
            Q([P3(qa, 0), P3(pa, 0), P3(pa, G - 0.7), P3(qa, G - 0.7)], [-e.tx, 0, -e.tz], ZA_CONC, CON)
            Q([P3(pb, 0), P3(qb, 0), P3(qb, G - 0.7), P3(pb, G - 0.7)], [e.tx, 0, e.tz], ZA_CONC, CON)
          }
        }
      }
      if (L > 0.6) gl(0, 1)
      else Q([P3(at(i, 0, gIn), 0), P3(at(i, 1, gIn), 0), P3(at(i, 1, gIn), G), P3(at(i, 0, gIn), G)], [e.nx, 0, e.nz], ZA_CONC, CON)

      // ---- the upper walls, section by section ----
      let acc = 0
      let secIdx = 0
      for (const [sk, w] of secs) {
        const s0 = acc / tot, s1 = (acc + w) / tot
        acc += w
        const Ls = (s1 - s0) * L
        const nBay = Math.max(1, Math.round(Ls / 8.5))
        const seed = (typeof k === 'number' ? k : 40) * 3 + secIdx
        secIdx++
        const bowOf = (s: number): number => {
          if (sk !== 'z') return 0
          const loc = ((s - s0) / (s1 - s0)) * nBay
          const bay = Math.min(nBay - 1, Math.floor(loc + 1e-9))
          const amp = 1.2 + 0.45 * (((bay + seed) * 7) % 3) / 2
          return amp * Math.abs(Math.sin(Math.PI * loc))
        }
        const soffit = (sa: number, sb: number, ba: number, bb: number): void => {
          if (hole) return
          Q([P3(at(i, sa, gIn), G), P3(at(i, sb, gIn), G), P3(at(i, sb, bIn, bb), G), P3(at(i, sa, bIn, ba), G)], [0, -1, 0], ZA_SOFFIT, CON)
        }
        if (sk === 'b') {
          // flat dark wall with the fins
          const p0 = at(i, s0, bIn), p1 = at(i, s1, bIn)
          const n3: V3 = [e.nx, 0, e.nz]
          Q([P3(p0, G), P3(p1, G), P3(p1, H - 0.7), P3(p0, H - 0.7)], n3, ZA_BROWN)
          Q([P3(p0, H - 0.7), P3(p1, H - 0.7), P3(p1, H), P3(p0, H)], n3, ZA_CAP, MTL)
          soffit(s0, s1, 0, 0)
          top.push(p0)
          const nf = Math.max(1, Math.floor(Ls / 0.72))
          for (let j = 0; j < nf; j++) {
            const s = s0 + ((s1 - s0) * (j + 0.5)) / nf
            const hw = 0.13 / L
            const col = j % 2 ? ZA_FIN_A : ZA_FIN_B
            const wa = at(i, s - hw, bIn), wb = at(i, s + hw, bIn)
            const fa = at(i, s - hw, bIn, 0.22), fb = at(i, s + hw, bIn, 0.22)
            Q([P3(fa, G), P3(fb, G), P3(fb, H - 0.75), P3(fa, H - 0.75)], n3, col)
            Q([P3(wa, G), P3(fa, G), P3(fa, H - 0.75), P3(wa, H - 0.75)], [-e.tx, 0, -e.tz], col)
            Q([P3(fb, G), P3(wb, G), P3(wb, H - 0.75), P3(fb, H - 0.75)], [e.tx, 0, e.tz], col)
          }
          // deep punched windows, over the fins
          const nw = Math.max(1, Math.floor(Ls / 3.2))
          for (let j = 0; j < nw; j++) {
            const f = frame(i, s0 + ((s1 - s0) * (j + 0.5)) / nw, flat)
            for (let fl = 0; fl < NF; fl++) win(f, G + fl * FL + 0.55, G + fl * FL + 2.85, 0.6, ZA_GLASS, GL, 0.24)
          }
          continue
        }
        // panelled zinc (bowed 'z', facetted 'c'/'a', flat 'p', grey 'g')
        const panW = sk === 'p' ? 2.4 : sk === 'g' ? 3.0 : sk === 'a' ? 5 : 1.15
        const nP = Math.max(1, Math.round(Ls / panW))
        for (let j = 0; j < nP; j++) {
          const sa = s0 + ((s1 - s0) * j) / nP, sb = s0 + ((s1 - s0) * (j + 1)) / nP
          const ba = bowOf(sa), bb = bowOf(sb)
          const pa = at(i, sa, bIn, ba), pb = at(i, sb, bIn, bb)
          const dl = Math.hypot(pb.x - pa.x, pb.z - pa.z) || 1
          const n3: V3 = [(pb.z - pa.z) / dl, 0, -(pb.x - pa.x) / dl]
          const col = sk === 'g' ? ZA_GREY : sk === 'a' ? (arcK % 2 ? ZA_ZINC_A : ZA_ZINC_C) : j % 3 === 0 ? ZA_ZINC_C : j % 2 ? ZA_ZINC_A : ZA_ZINC_B
          Q([P3(pa, G), P3(pb, G), P3(pb, H - 0.7), P3(pa, H - 0.7)], n3, col, sk === 'g' ? CON : MTL)
          Q([P3(pa, H - 0.7), P3(pb, H - 0.7), P3(pb, H), P3(pa, H)], n3, ZA_CAP, MTL)
          soffit(sa, sb, ba, bb)
          top.push(pa)
        }
        // windows and balconies
        if (sk === 'z') {
          for (let bay = 0; bay < nBay; bay++) {
            const sm = s0 + ((s1 - s0) * (bay + 0.5)) / nBay
            for (const dx of [-1.35, 0, 1.35]) {
              const f = frame(i, sm + dx / L, bowOf)
              win(f, G + 0.45, H - 1.0, 0.4, ZA_FRAME, MTL, 0.03)
              for (let fl = 0; fl < NF; fl++) win(f, G + fl * FL + 0.5, G + fl * FL + 2.9, 0.27, ZA_GLASS, GL, 0.07)
            }
            const f = frame(i, sm, bowOf)
            const lv = ((bay + seed) % 2) ? [2, 4] : [1, 3]
            for (const fl of lv) {
              const hd = Math.atan2(f.nx, f.nz)
              boxAlong(m, f.p.x + f.nx * 0.45, G + fl * FL - 0.05, f.p.z + f.nz * 0.45, 1.25, 0.4, 0.45, hd, ZA_ZINC_B, MTL)
              boxAlong(m, f.p.x + f.nx * 0.45, G + fl * FL + 0.38, f.p.z + f.nz * 0.45, 1.3, 0.04, 0.5, hd, ZA_FRAME, MTL)
            }
          }
        } else if (sk === 'a') {
          // the rounded corner: a white-framed window ribbon on every other facet, balconies on the middle ones
          for (let j = 0; j < 1; j++) {
            if (arcK % 2 === 0) continue
            const f = frame(i, 0.5, flat)
            win(f, G + 0.45, H - 1.0, 0.62, ZA_FRAME, MTL, 0.03)
            for (let fl = 0; fl < NF; fl++) win(f, G + fl * FL + 0.5, G + fl * FL + 2.9, 0.45, ZA_GLASS, GL, 0.07)
            if (arcK >= 3 && arcK <= 7) {
              const hd = Math.atan2(f.nx, f.nz)
              for (const fl of (arcK % 4 === 3 ? [1, 3] : [2, 4])) {
                boxAlong(m, f.p.x + f.nx * 0.4, G + fl * FL - 0.05, f.p.z + f.nz * 0.4, 1.05, 0.4, 0.4, hd, ZA_ZINC_B, MTL)
                boxAlong(m, f.p.x + f.nx * 0.4, G + fl * FL + 0.38, f.p.z + f.nz * 0.4, 1.1, 0.04, 0.45, hd, ZA_FRAME, MTL)
              }
            }
          }
        } else if (sk === 'c') {
          const nw = Math.max(1, Math.floor(Ls / 3.4))
          for (let j = 0; j < nw; j++) {
            const f = frame(i, s0 + ((s1 - s0) * (j + 0.5)) / nw, flat)
            win(f, G + 0.45, H - 1.0, 0.5, ZA_FRAME, MTL, 0.03)
            for (let fl = 0; fl < NF; fl++) win(f, G + fl * FL + 0.5, G + fl * FL + 2.9, 0.36, ZA_GLASS, GL, 0.07)
          }
        } else if (Ls > 3.2) {
          const nw = Math.max(1, Math.floor(Ls / 3.0))
          for (let j = 0; j < nw; j++) {
            const f = frame(i, s0 + ((s1 - s0) * (j + 0.5)) / nw, flat)
            for (let fl = 0; fl < NF; fl++) win(f, G + fl * FL + 0.5, G + fl * FL + 2.9, 0.55, ZA_GLASS, GL, 0.06)
          }
        }
      }
    }
  }

  buildRing(ring, kind, false, roofOuter)
  const holeKinds = ZA_HOLE.map(() => 0 as number)
  const roofHole: P2[] = []
  buildRing(ZA_HOLE, holeKinds, true, roofHole)
  capPolygonWithHoles(m, [roofOuter, roofHole], H, ZA_ROOF, CON)

  const t = zaFit(fit.ring)
  if (t) emanuElCopy(out, m, t.c, t.s, t.tx, t.tz)
  else emanuElCopy(out, m, 1, 0, 0, 0)
}

// ---------------------------------------------------------------------------------------------------------------
// 200 Brannan Street apartments (South Beach)
// ---------------------------------------------------------------------------------------------------------------

/** OSM way/113103853's outline (docs/sf-batches/MODEL-200-BRANNAN.md), anticlockwise, in the pack's frame (x east, z north). */
const BA_OUT: P2[] = [[-47.1, -2.3], [-42.2, -7.2], [-37.6, -2.8], [-0.7, -38.4], [-5.9, -43.2], [7.6, -56.3], [56.8, -6.4],
  [65.7, 2.7], [38.6, 30.4], [17.3, 52.2], [-19.7, 15.8], [-15.5, 11.3], [-13.4, 13.4], [-3.7, 4.0], [-1.9, 8.0], [0.1, 7.0],
  [1.7, 11.1], [3.3, 10.1], [5.3, 14.7], [6.9, 13.6], [8.7, 18.1], [10.2, 17.4], [11.9, 22.2], [16.9, 23.8], [18.7, 25.8],
  [21.7, 23.4], [18.7, 20.3], [37.1, 3.5], [16.4, -17.3], [21.8, -22.5], [17.7, -27.1], [12.2, -24.8], [10.6, -19.8],
  [8.6, -20.4], [7.1, -16.1], [5.4, -17.0], [4.0, -13.0], [2.1, -13.5], [1.0, -10.3], [-1.3, -10.9], [-2.3, -7.2], [-4.3, -7.9],
  [-5.6, -4.0], [-7.9, -5.0], [-9.3, -1.1], [-11.3, -1.9], [-12.8, 2.1], [-17.4, 0.2], [-19.2, 4.5], [-20.7, 4.0], [-22.2, 7.8],
  [-25.2, 6.5], [-28.0, 13.0], [-32.2, 11.6]].map(([x, z]) => ({ x, z }))

type BaFit = { c: number; s: number; tx: number; tz: number; res: number }

/**
 * Carries BA_OUT onto `ring`: a 2-D Procrustes fit over both orders and every start vertex (the smallest RMS wins), or,
 * when the city's ring has another vertex count, a match of the long edges. Null when nothing fits within 2 m.
 */
function baFit(ring: P2[] | undefined): BaFit | null {
  if (!ring || ring.length < 4) return null
  let R = ring
  if (R.length === BA_OUT.length + 1 && Math.hypot(R[0].x - R[R.length - 1].x, R[0].z - R[R.length - 1].z) < 0.3) R = R.slice(0, -1)
  const n = BA_OUT.length
  const ca = emanuElCentroid(BA_OUT), cb = emanuElCentroid(R)
  let best: BaFit | null = null
  if (R.length === n) {
    const mean = (r: P2[]): P2 => ({ x: r.reduce((t, p) => t + p.x, 0) / r.length, z: r.reduce((t, p) => t + p.z, 0) / r.length })
    const ma = mean(BA_OUT), mb = mean(R)
    for (const rev of [false, true]) {
      const Q = rev ? [...BA_OUT].reverse() : BA_OUT
      for (let o = 0; o < n; o++) {
        let sn = 0, cs = 0
        for (let i = 0; i < n; i++) {
          const a = Q[(i + o) % n]
          const ax = a.x - ma.x, az = a.z - ma.z, bx = R[i].x - mb.x, bz = R[i].z - mb.z
          cs += ax * bx + az * bz
          sn += ax * bz - az * bx
        }
        const th = Math.atan2(sn, cs), c = Math.cos(th), s = Math.sin(th)
        let e = 0
        for (let i = 0; i < n; i++) {
          const a = Q[(i + o) % n]
          e += ((a.x - ma.x) * c - (a.z - ma.z) * s + mb.x - R[i].x) ** 2 + ((a.x - ma.x) * s + (a.z - ma.z) * c + mb.z - R[i].z) ** 2
        }
        const res = Math.sqrt(e / n)
        if (!best || res < best.res) best = { c, s, tx: mb.x - (ma.x * c - ma.z * s), tz: mb.z - (ma.x * s + ma.z * c), res }
      }
    }
    if (best && best.res <= 2) return best
    best = null
  }
  const edges = (r: P2[]): { L: number; a: number }[] => r.map((p, i) => {
    const q = r[(i + 1) % r.length]
    return { L: Math.hypot(q.x - p.x, q.z - p.z), a: Math.atan2(q.z - p.z, q.x - p.x) }
  })
  for (const a of edges(BA_OUT).filter((e) => e.L > 15)) {
    for (const b of edges(R).filter((e) => e.L > 15)) {
      if (Math.abs(a.L - b.L) > 0.2 * a.L) continue
      const th = b.a - a.a, c = Math.cos(th), s = Math.sin(th)
      const tx = cb.x - (ca.x * c - ca.z * s), tz = cb.z - (ca.x * s + ca.z * c)
      const T = BA_OUT.map((p) => ({ x: p.x * c - p.z * s + tx, z: p.x * s + p.z * c + tz }))
      let e = 0
      for (const v of R) {
        let d = Infinity
        for (let i = 0; i < T.length; i++) {
          const p = T[i], q = T[(i + 1) % T.length]
          const dx = q.x - p.x, dz = q.z - p.z
          const u = Math.max(0, Math.min(1, ((v.x - p.x) * dx + (v.z - p.z) * dz) / (dx * dx + dz * dz || 1)))
          d = Math.min(d, Math.hypot(v.x - p.x - dx * u, v.z - p.z - dz * u))
        }
        e += d * d
      }
      const res = Math.sqrt(e / R.length)
      if (!best || res < best.res) best = { c, s, tx, tz, res }
    }
  }
  return best && (best as BaFit).res <= 2 ? best : null
}

const BA_PANEL: Rgb = [0.64, 0.67, 0.68]
const BA_BRICK: Rgb = [0.37, 0.17, 0.13]
const BA_GLASS: Rgb = [0.24, 0.33, 0.35]
const BA_TGLASS: Rgb = [0.36, 0.47, 0.49]
const BA_FRAME: Rgb = [0.9, 0.91, 0.91]
const BA_STEEL: Rgb = [0.28, 0.3, 0.32]
const BA_BASE: Rgb = [0.34, 0.36, 0.37]
const BA_SPAN: Rgb = [0.6, 0.66, 0.66]
const BA_ROOF: Rgb = [0.36, 0.37, 0.38]

/**
 * What each outline edge (index into BA_OUT, edge i runs to i+1) is dressed with, as [kind, metres] runs from its start:
 * p = pale grey panel (flush to the full 26 m), b = red-brown brick (to 23.3 m with a set-back grey top storey), t = the
 * glass corner tower. Edges not listed are courtyard walls (the saw-tooth bays and the slot's end), plain grey to 23.3 m.
 */
const BA_SECS: Record<number, [string, number][]> = {
  0: [['p', 1]], 1: [['p', 1]], 2: [['p', 12], ['b', 10], ['p', 11], ['b', 8], ['p', 10.3]], 3: [['b', 1]],
  4: [['b', 9], ['p', 9.8]], 5: [['p', 10], ['b', 9], ['p', 12], ['b', 7], ['p', 12.1], ['b', 20]], 6: [['t', 1]],
  7: [['t', 12], ['b', 8], ['p', 10], ['b', 8.8]], 8: [['p', 10], ['b', 10], ['p', 10.5]],
  9: [['b', 8], ['p', 13], ['b', 10], ['p', 12], ['b', 8.9]], 10: [['p', 1]], 53: [['b', 10], ['p', 10.4]],
}

/**
 * 200 Brannan Street, a 2000s apartment block filling the Brannan / Delancey / Federal / 1st block in South Beach (OSM
 * way/113103853; docs/sf-batches/MODEL-200-BRANNAN.md). Own geometry from the photographs in docs/shots/refs/notable/w113103853:
 *
 * - the plan, saw-tooth courtyard and all, drawn in the pack's frame and carried onto `fit.ring` by `baFit` (Procrustes);
 * - nine storeys (a dark glazed ground storey, eight floors) in long runs that alternate PALE GREY PANEL (full 26 m, big
 *   white-framed multi-pane windows with a mullion) and RED-BROWN BRICK (tall paired windows, to 23.3 m with a set-back grey
 *   top storey above) — the photographs' rhythm along Brannan and Delancey;
 * - the GLASS CORNER TOWER where Brannan meets Delancey (the plan's east corner, vertex 7): a 12 m square of green-grey
 *   curtain wall in a mullion grid to 30 m, under a flat glass canopy on steel beams with a row of upstanding steel fins.
 *   The pack describes the crown as radiating blades; the photographs show a pergola of parallel fins over a glass slab.
 */
function brannanApartments_200_Brannan(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const CON = surfaceTag('concrete'), BR = surfaceTag('brick'), GL = surfaceTag('glass'), MTL = surfaceTag('metal'), ST = surfaceTag('stucco')
  const G = 4.4, FL = 2.7, HB = G + 7 * FL, HP = G + 8 * FL, HT = 30
  const N = BA_OUT.length
  const Q = (p: V3[], n: V3, col: Rgb, tag = 0): void => m.quad(p, n, uv, col, tag)
  const lerp = (a: P2, b: P2, s: number): P2 => ({ x: a.x + (b.x - a.x) * s, z: a.z + (b.z - a.z) * s })

  /** a wall strip from a to b (outward = right of a→b), y0..y1, `d` off the wall */
  const wall = (a: P2, b: P2, y0: number, y1: number, col: Rgb, tag: number, d = 0): void => {
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
    Q([[a.x + nx * d, y0, a.z + nz * d], [b.x + nx * d, y0, b.z + nz * d], [b.x + nx * d, y1, b.z + nz * d], [a.x + nx * d, y1, a.z + nz * d]],
      [nx, 0, nz], col, tag)
  }
  /** a window centred at u along a→b, hw wide, y0..y1, with a white frame (and a mullion when `mull`) */
  const win = (a: P2, b: P2, u: number, hw: number, y0: number, y1: number, framed: boolean, mull: boolean): void => {
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
    const c = { x: a.x + tx * u, z: a.z + tz * u }
    const p0 = { x: c.x - tx * hw, z: c.z - tz * hw }, p1 = { x: c.x + tx * hw, z: c.z + tz * hw }
    if (framed) {
      wall(p0, p1, y0 - 0.07, y1 + 0.07, BA_FRAME, MTL, 0.03)
      wall({ x: p0.x + tx * 0.07, z: p0.z + tz * 0.07 }, { x: p1.x - tx * 0.07, z: p1.z - tz * 0.07 }, y0, y1, BA_GLASS, GL, 0.06)
      if (mull) wall({ x: c.x - tx * 0.04, z: c.z - tz * 0.04 }, { x: c.x + tx * 0.04, z: c.z + tz * 0.04 }, y0, y1, BA_FRAME, MTL, 0.09)
    } else wall(p0, p1, y0, y1, BA_GLASS, GL, 0.05)
  }
  /** a box standing on the section a→b, `depth` inward, from y0 to y1: its outer face, two ends and its top */
  const block = (a: P2, b: P2, inset: number, depth: number, y0: number, y1: number, col: Rgb, tag: number): void => {
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
    const at = (p: P2, k: number): P2 => ({ x: p.x - nx * k, z: p.z - nz * k })
    const a0 = at(a, inset), b0 = at(b, inset), a1 = at(a, inset + depth), b1 = at(b, inset + depth)
    wall(a0, b0, y0, y1, col, tag)
    wall(a0, a1, y0, y1, col, tag)
    wall(b1, b0, y0, y1, col, tag)
    Q([[a0.x, y1, a0.z], [b0.x, y1, b0.z], [b1.x, y1, b1.z], [a1.x, y1, a1.z]], [0, 1, 0], BA_ROOF, CON)
  }

  const A7 = BA_OUT[7], A6 = BA_OUT[6], A8 = BA_OUT[8]
  const L7 = Math.hypot(A8.x - A7.x, A8.z - A7.z)
  const towerD = lerp(A7, A8, 12 / L7)

  for (let i = 0; i < N; i++) {
    const a = BA_OUT[i], b = BA_OUT[(i + 1) % N]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const secs = BA_SECS[i]
    if (!secs) {
      // courtyard wall: plain grey with a glazed ground storey and a plain window per floor
      wall(a, b, 0, HB, BA_PANEL, ST)
      const nw = Math.max(1, Math.floor(L / 3.2))
      for (let k = 0; k < nw; k++) {
        const u = (L * (k + 0.5)) / nw
        win(a, b, u, Math.min(0.85, L / nw / 2 - 0.4), 0.5, 3.5, false, false)
        for (let f = 0; f < 7; f++) if (f > 0 || L > 4) win(a, b, u, Math.min(0.85, L / nw / 2 - 0.4), G + f * FL + 0.5, G + f * FL + 2.2, false, false)
      }
      continue
    }
    let s0 = 0
    for (const [kind, len0] of secs) {
      const sec = secs.length === 1 ? L : len0
      const e0 = Math.min(L, s0), e1 = Math.min(L, s0 + sec)
      s0 += sec
      if (e1 - e0 < 0.2) continue
      const pa = lerp(a, b, e0 / L), pb = lerp(a, b, e1 / L)
      const Ls = e1 - e0
      if (kind === 't') {
        const FT = (HT - G) / 9
        wall(pa, pb, G, HT, BA_SPAN, GL)
        wall(pa, pb, 0, G, BA_BASE, CON)
        const nb = Math.max(2, Math.round(Ls / 1.9))
        for (let f = 0; f < 9; f++) {
          wall(pa, pb, G + f * FT, G + f * FT + 0.55, BA_SPAN, MTL, 0.04)
          wall(pa, pb, G + f * FT + 0.6, G + (f + 1) * FT - 0.05, BA_TGLASS, GL, 0.05)
        }
        for (let j = 0; j <= nb; j++) {
          const u = (Ls * j) / nb
          const q0 = lerp(pa, pb, Math.max(0, u - 0.05) / Ls), q1 = lerp(pa, pb, Math.min(Ls, u + 0.05) / Ls)
          wall(q0, q1, G, HT, BA_STEEL, MTL, 0.09)
        }
        // the ground storey: dark glass between pale piers
        const ng = Math.max(2, Math.round(Ls / 3.2))
        for (let j = 0; j < ng; j++) win(pa, pb, (Ls * (j + 0.5)) / ng, Ls / ng / 2 - 0.35, 0.5, G - 0.5, true, true)
        continue
      }
      const high = kind === 'p'
      const H = high ? HP : HB
      const col = high ? BA_PANEL : BA_BRICK, tag = high ? ST : BR
      wall(pa, pb, G, H, col, tag)
      wall(pa, pb, 0, G, BA_BASE, CON)
      wall(pa, pb, G - 0.3, G, BA_SPAN, CON, 0.18)
      // the glazed ground storey in a grid
      const ng = Math.max(1, Math.round(Ls / 5))
      for (let j = 0; j < ng; j++) {
        const u = (Ls * (j + 0.5)) / ng
        win(pa, pb, u, Math.min(1.9, Ls / ng / 2 - 0.8), 0.45, G - 0.7, true, true)
      }
      // upper windows
      const bay = high ? 3.7 : 3.3
      const nw = Math.max(1, Math.round(Ls / bay))
      const hw = high ? 1.3 : 0.82
      const nf = high ? 8 : 7
      for (let j = 0; j < nw; j++) {
        const u = (Ls * (j + 0.5)) / nw
        if (Ls / nw / 2 < hw + 0.3) continue
        for (let f = 0; f < nf; f++) win(pa, pb, u, hw, G + f * FL + 0.35, G + f * FL + 2.35, true, true)
      }
      if (high) block(pa, pb, 0, 4, HB, HP, BA_PANEL, ST)
      else {
        // the set-back grey top storey with its three windows
        block(pa, pb, 2.6, 4, HB, HP, BA_PANEL, ST)
        const rp = lerp(pa, pb, 0), rq = lerp(pa, pb, 1)
        const L2 = Math.hypot(rq.x - rp.x, rq.z - rp.z) || 1
        const nx = (rq.z - rp.z) / L2, nz = -(rq.x - rp.x) / L2
        const ia = { x: pa.x - nx * 2.6, z: pa.z - nz * 2.6 }, ib = { x: pb.x - nx * 2.6, z: pb.z - nz * 2.6 }
        const nt = Math.max(1, Math.round(Ls / 4))
        for (let j = 0; j < nt; j++) win(ia, ib, (Ls * (j + 0.5)) / nt, 0.9, HB + 0.35, HB + 2.2, false, false)
        // the railing line on the roof edge
        wall(pa, pb, HB, HB + 1.0, BA_SPAN, MTL, 0.0)
      }
    }
  }

  // the roof of the whole block, at the brick sections' parapet; the full-height runs stand above it
  capPolygonWithHoles(m, [BA_OUT], HB - 0.3, BA_ROOF, CON)

  // the tower's roof, its two inner faces, and the canopy
  const towerB = { x: A6.x + (towerD.x - A7.x), z: A6.z + (towerD.z - A7.z) }
  wall(towerD, towerB, HB, HT, BA_TGLASS, GL)
  wall(towerB, A6, HB, HT, BA_TGLASS, GL)
  Q([[A6.x, HT, A6.z], [A7.x, HT, A7.z], [towerD.x, HT, towerD.z], [towerB.x, HT, towerB.z]], [0, 1, 0], BA_ROOF, CON)
  // the glass canopy and its steel: a slab a metre above the roof, beams under it, fins standing on it
  const ex = { x: (A7.x - A6.x) / Math.hypot(A7.x - A6.x, A7.z - A6.z), z: (A7.z - A6.z) / Math.hypot(A7.x - A6.x, A7.z - A6.z) }
  const ez = { x: (towerD.x - A7.x) / 12, z: (towerD.z - A7.z) / 12 }
  const cen = { x: (A6.x + A7.x + towerD.x + towerB.x) / 4, z: (A6.z + A7.z + towerD.z + towerB.z) / 4 }
  const hx = Math.hypot(A7.x - A6.x, A7.z - A6.z) / 2 + 1.1, hz = 6 + 1.1
  const CP = (u: number, v: number, y: number): V3 => [cen.x + ex.x * u + ez.x * v, y, cen.z + ex.z * u + ez.z * v]
  Q([CP(-hx, -hz, HT + 1.1), CP(hx, -hz, HT + 1.1), CP(hx, hz, HT + 1.4), CP(-hx, hz, HT + 1.4)], [0, 1, 0], [0.62, 0.74, 0.74], GL)
  Q([CP(-hx, -hz, HT + 1.1), CP(-hx, hz, HT + 1.4), CP(hx, hz, HT + 1.4), CP(hx, -hz, HT + 1.1)], [0, -1, 0], [0.45, 0.52, 0.53], GL)
  const head = Math.atan2(-ez.z, ez.x) // boxAlong's heading for a box whose local x runs along ez
  const NB = 8
  for (let j = 0; j < NB; j++) {
    const u = -hx + 0.4 + ((2 * hx - 0.8) * j) / (NB - 1)
    const c = CP(u, 0, HT + 0.95)
    boxAlong(m, c[0], c[1], c[2], hz, 0.12, 0.08, head, BA_STEEL, MTL)
    const f = CP(u, 0, HT + 1.9)
    boxAlong(m, f[0], f[1], f[2], hz, 0.3, 0.035, head, BA_STEEL, MTL)
  }
  for (let j = 0; j < 3; j++) {
    const v = -hz + 0.6 + ((2 * hz - 1.2) * j) / 2
    const c = CP(0, v, HT + 0.95)
    boxAlong(m, c[0], c[1], c[2], 0.08, 0.12, 0.08, head, BA_STEEL, MTL)
  }

  const t = baFit(fit.ring)
  if (t) emanuElCopy(out, m, t.c, t.s, t.tx, t.tz)
  else emanuElCopy(out, m, 1, 0, 0, 0)
}

const O2_BRICK: Rgb = [0.42, 0.21, 0.15]        // #a2563e coded ~30 % down: brick renders orange in the city
const O2_BRICK_DK: Rgb = [0.3, 0.15, 0.11]      // the lintel courses and spandrels
const O2_STONE: Rgb = [0.58, 0.55, 0.47]        // #d4ccbc the plinth blocks and sills, coded down
const O2_GLASS: Rgb = [0.19, 0.31, 0.29]        // #3d5a55 dark green curtain-wall vision glass
const O2_SPAN: Rgb = [0.1, 0.17, 0.16]          // the dark green spandrels and the lobby glass
const O2_WIN: Rgb = [0.2, 0.28, 0.32]           // the brick walls' window panes
const O2_CANOPY: Rgb = [0.3, 0.31, 0.33]        // #5a5d60 the thin flat canopy slabs
const O2_FRAME: Rgb = [0.07, 0.09, 0.09]        // window frames, mullions

/**
 * 235 Second Street (former CBS Interactive / CNET, 2001; OSM way/80296730, 5 levels, 27 m, LiDAR 26.7 median / 30.8 max):
 * a mixed brick and glass block on a 47 x 84 m plan. Brick blocks (warm red-brown, four floors of square punched windows
 * with stone sills over a stone plinth and an arched loggia at the base) are interlocked with dark-green curtain-wall
 * towers that stand a few storeys clear to 30 m under thin flat canopy slabs projecting ~1.5 m; a recessed dark glass sixth
 * storey sits on the brick under a projecting canopy at 27 m. Photographs docs/shots/refs/notable/w80296730/
 * way-80296730-02 (brick block with arches beside the glass tower under its canopy), -03 (the corner: brick wings, loggia,
 * glass between), -01 and mapillary-0/1/2 (window pattern, stone plinth blocks, the glazed lobby base).
 *
 * Orientation: manifest front 225 (2nd Street) is local -z; the plan is the six-edge ring (jogs ironed out) and each edge is
 * dressed by its place after the front edge in anticlockwise order: the front (loggia + tower + brick), the jog, the notch,
 * the long Folsom-side wall, the back and the long Tehama wall (-x) with the second loggia at its 2nd Street end.
 */
function office_235_Second(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const BK = surfaceTag('brick')
  const MT = surfaceTag('metal')
  const AS = surfaceTag('ashlar')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  const signedArea = (r: P2[]): number => {
    let a = 0
    for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
    return a
  }
  if (signedArea(ring) < 0) ring.reverse()
  const edgesOf = (r: P2[]) => r.map((a, i) => {
    const b = r[(i + 1) % r.length], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, tx: (b.x - a.x) / l, tz: (b.z - a.z) / l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  const inset = (r: P2[], d: number): P2[] => {
    const e = edgesOf(r), n = r.length
    return r.map((p, i) => {
      const e0 = e[(i + n - 1) % n], e1 = e[i]
      const k = 1 + e0.nx * e1.nx + e0.nz * e1.nz
      return { x: p.x - ((e0.nx + e1.nx) / k) * d, z: p.z - ((e0.nz + e1.nz) / k) * d }
    })
  }
  // the plan with its small jogs ironed out
  const S = ring.slice()
  for (;;) {
    const e = edgesOf(S)
    let k = -1, best = 7
    for (let i = 0; i < e.length; i++) if (e[i].l < best) { best = e[i].l; k = i }
    if (k < 0 || S.length <= 4) break
    S.splice((k + 1) % S.length, 1)
  }
  const info = edgesOf(S)
  const nE = info.length
  const fronts = info.filter((e) => e.l > 12 && e.nz < -0.85)
  const front = fronts.length ? fronts.reduce((p, c) => (c.l > p.l ? c : p)) : info.reduce((p, c) => (c.nz < p.nz ? c : p))

  const YP = 1.3, Y1 = 5.0, FL = 4.3, YB = Y1 + FL * 4, YT = YB + 4.8, YTW = 30.0   // plinth, ground floor, brick top 22.2, glass top 27, tower top 30
  const SET = 1.4
  const GND = -2.0

  type Seg = { u0: number; u1: number; k: 'brick' | 'tower' | 'loggia' }
  const plan = (k: number, l: number): Seg[] => {
    const T = (u0: number, w: number): Seg => ({ u0, u1: Math.min(l, u0 + w), k: 'tower' })
    const fill = (spans: Seg[]): Seg[] => {
      const o: Seg[] = []
      let u = 0
      for (const s of spans) { if (s.u0 > u + 0.01) o.push({ u0: u, u1: s.u0, k: 'brick' }); o.push(s); u = s.u1 }
      if (u < l - 0.01) o.push({ u0: u, u1: l, k: 'brick' })
      return o
    }
    if (nE !== 6) return fill(l > 24 ? [T(l * 0.4, 11)] : [])
    if (k === 0) return fill([{ u0: 0, u1: 11.2, k: 'loggia' }, T(l - 11.2 > 11.2 ? 11.2 : l * 0.4, 11)])
    if (k === 3) return fill([T(l * 0.26, 11), T(l * 0.66, 12)])
    if (k === 4) return fill([T(l * 0.31, 13)])
    if (k === 5) return fill([T(l * 0.28, 14), T(l - 25.2, 14), { u0: l - 11.2, u1: l, k: 'loggia' }])
    return fill([])
  }

  const quadE = (a: P2, tx: number, tz: number, nx: number, nz: number, u0: number, u1: number, ya: number, yb: number, pr: number, c: Rgb, tag: number): void => {
    m.quad([[a.x + tx * u0 + nx * pr, ya, a.z + tz * u0 + nz * pr], [a.x + tx * u1 + nx * pr, ya, a.z + tz * u1 + nz * pr],
      [a.x + tx * u1 + nx * pr, yb, a.z + tz * u1 + nz * pr], [a.x + tx * u0 + nx * pr, yb, a.z + tz * u0 + nz * pr]], [nx, 0, nz],
    [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
  /** a box in an edge's frame: u0..u1 along, pr0..pr1 out (pr1 the outer face), y0..y1 */
  const boxE = (a: P2, tx: number, tz: number, nx: number, nz: number, u0: number, u1: number, pr0: number, pr1: number,
    y0: number, y1: number, c: Rgb, tag: number): void => {
    const P = (u: number, y: number, pr: number): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    m.quad([P(u0, y0, pr1), P(u1, y0, pr1), P(u1, y1, pr1), P(u0, y1, pr1)], [nx, 0, nz], uv, c, tag)
    m.quad([P(u1, y0, pr0), P(u0, y0, pr0), P(u0, y1, pr0), P(u1, y1, pr0)], [-nx, 0, -nz], uv, c, tag)
    m.quad([P(u1, y0, pr1), P(u1, y0, pr0), P(u1, y1, pr0), P(u1, y1, pr1)], [tx, 0, tz], uv, c, tag)
    m.quad([P(u0, y0, pr0), P(u0, y0, pr1), P(u0, y1, pr1), P(u0, y1, pr0)], [-tx, 0, -tz], uv, c, tag)
    m.quad([P(u0, y1, pr1), P(u1, y1, pr1), P(u1, y1, pr0), P(u0, y1, pr0)], [0, 1, 0], uv, c, tag)
    m.quad([P(u0, y0, pr0), P(u1, y0, pr0), P(u1, y0, pr1), P(u0, y0, pr1)], [0, -1, 0], uv, c, tag)
  }

  for (const e of info) {
    const { a, l, tx, tz, nx, nz } = e
    if (l < 1) continue
    const kOff = (e.i - front.i + nE) % nE
    const F = (u0: number, u1: number, ya: number, yb: number, pr: number, c: Rgb, tag: number): void =>
      quadE(a, tx, tz, nx, nz, u0, u1, ya, yb, pr, c, tag)
    const B = (u0: number, u1: number, pr0: number, pr1: number, y0: number, y1: number, c: Rgb, tag: number): void =>
      boxE(a, tx, tz, nx, nz, u0, u1, pr0, pr1, y0, y1, c, tag)
    for (const sg of plan(kOff, l)) {
      const { u0, u1 } = sg
      if (u1 - u0 < 0.3) continue
      if (sg.k === 'tower') {
        // the curtain-wall tower: a glass box proud of the brick, to 30 m, banded by dark spandrels and thin mullions
        const T0 = u0 + 0.0, T1 = u1, PR = 0.7
        B(T0, T1, -8, PR, GND, YTW, O2_GLASS, GL)
        F(T0, T1, GND, Y1 - 0.2, PR + 0.04, O2_SPAN, GL)                               // the dark lobby glazing
        F(T0, T1, Y1 - 0.2, Y1 + 0.5, PR + 0.06, O2_STONE, AS)                         // stone transom over the lobby
        for (let f = 0; f < 6; f++) {
          const y = Y1 + FL * f
          F(T0, T1, y + 0.5, y + 1.5, PR + 0.04, O2_SPAN, GL)                          // spandrel
          F(T0, T1, y + 3.3, y + 4.3, PR + 0.04, O2_SPAN, GL)                          // transom band
        }
        const nm = Math.max(2, Math.round((T1 - T0) / 1.9))
        for (let j = 0; j <= nm; j++) {
          const u = T0 + ((T1 - T0) * j) / nm
          F(Math.max(T0, u - 0.04), Math.min(T1, u + 0.04), Y1 + 0.5, YTW, PR + 0.08, O2_FRAME, MT)
        }
        // the canopy: a thin flat slab projecting well past the glass
        B(T0 - 1.6, T1 + 1.6, -8, PR + 1.9, YTW, YTW + 0.6, O2_CANOPY, MT)
        continue
      }
      // brick wall to the top of the fifth level, over the plinth
      F(u0, u1, GND, YB, 0, O2_BRICK, BK)
      F(u0, u1, GND, YP, 0.08, O2_STONE, AS)
      F(u0, u1, Y1 - 0.45, Y1 - 0.1, 0.1, O2_STONE, AS)                                // string course over the ground storey
      F(u0, u1, YB - 0.2, YB + 0.0, 0.16, O2_STONE, AS)                                // cornice course
      F(u0, u1, YB - 1.0, YB - 0.2, 0.03, O2_BRICK_DK, BK)                             // dark brick frieze
      if (sg.k === 'loggia') {
        // the round-arched loggia: dark openings between brick piers, each arch a chord fan with a stone archivolt
        const na = Math.max(2, Math.floor((u1 - u0) / 3.4)), aw = (u1 - u0) / na, ow = aw - 1.0, R = ow / 2, ys = 3.1
        for (let j = 0; j < na; j++) {
          const uc = u0 + aw * (j + 0.5)
          F(uc - R, uc + R, 0.9, ys, 0.08, O2_SPAN, GL)
          const K = 6
          for (let q = 0; q < K; q++) {
            const t0 = Math.PI * q / K, t1 = Math.PI * (q + 1) / K
            const x0 = uc - R * Math.cos(t0), x1 = uc - R * Math.cos(t1), y0 = ys + R * Math.sin(t0), y1 = ys + R * Math.sin(t1)
            const P = (u: number, y: number, pr: number): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
            m.quad([P(x0, ys, 0.08), P(x1, ys, 0.08), P(x1, y1, 0.08), P(x0, y0, 0.08)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], O2_SPAN, GL)
            const R2 = R + 0.35
            const ox0 = uc - R2 * Math.cos(t0), ox1 = uc - R2 * Math.cos(t1), oy0 = ys + R2 * Math.sin(t0), oy1 = ys + R2 * Math.sin(t1)
            m.quad([P(x0, y0, 0.07), P(x1, y1, 0.07), P(ox1, oy1, 0.07), P(ox0, oy0, 0.07)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], O2_STONE, AS)
          }
          F(uc - R - 0.35, uc - R, ys - 0.2, ys, 0.07, O2_STONE, AS)
          F(uc + R, uc + R + 0.35, ys - 0.2, ys, 0.07, O2_STONE, AS)
          F(uc - R, uc + R, 3.9, 4.15, 0.12, O2_FRAME, MT)                              // the balcony rail across the openings
        }
      } else {
        // dark glazed ground storey in bays
        const kb = Math.max(1, Math.round((u1 - u0) / 4.2)), bw = (u1 - u0) / kb
        for (let j = 0; j < kb; j++) F(u0 + bw * j + 0.6, u0 + bw * (j + 1) - 0.6, YP + 0.3, Y1 - 0.8, 0.06, O2_SPAN, GL)
      }
      // four floors of square punched windows with stone sills
      const kw = Math.max(1, Math.round((u1 - u0) / 3.7)), ww = (u1 - u0) / kw
      for (let j = 0; j < kw; j++) {
        const uc = u0 + ww * (j + 0.5), h = Math.min(1.25, ww * 0.34)
        for (let r = 0; r < 4; r++) {
          const ya = Y1 + FL * r + 1.05, yb = ya + 2.3
          F(uc - h - 0.07, uc + h + 0.07, ya - 0.07, yb + 0.07, 0.04, O2_FRAME, MT)
          F(uc - h, uc + h, ya, yb, 0.07, O2_WIN, GL)
          F(uc - 0.04, uc + 0.04, ya, yb, 0.09, O2_FRAME, MT)
          F(uc - h - 0.1, uc + h + 0.1, ya - 0.2, ya - 0.04, 0.14, O2_STONE, AS)
          F(uc - h - 0.1, uc + h + 0.1, yb + 0.07, yb + 0.3, 0.05, O2_BRICK_DK, BK)
        }
      }
    }
  }

  // the roof of the brick storeys and the recessed dark-glass sixth storey
  const ring2 = inset(S, SET)
  capPolygonWithHoles(m, [S, ring2], YB, [0.16, 0.17, 0.18], BK)
  const info2 = edgesOf(ring2)
  for (const e of info2) {
    const { a, l, tx, tz, nx, nz } = e
    if (l < 0.5) continue
    const F = (u0: number, u1: number, ya: number, yb: number, pr: number, c: Rgb, tag: number): void =>
      quadE(a, tx, tz, nx, nz, u0, u1, ya, yb, pr, c, tag)
    F(0, l, YB, YT, 0, O2_GLASS, GL)
    F(0, l, YB, YB + 0.9, 0.04, O2_SPAN, GL)
    const k = Math.max(2, Math.round(l / 2.4))
    for (let j = 0; j <= k; j++) {
      const u = (l * j) / k
      F(Math.max(0, u - 0.04), Math.min(l, u + 0.04), YB + 0.9, YT, 0.06, O2_FRAME, MT)
    }
    F(0, l, YB + 2.7, YB + 2.8, 0.06, O2_FRAME, MT)
  }
  // the canopy over it: a thin flat slab, fascia and soffit
  const ringO = inset(S, -0.8)
  const eO = edgesOf(ringO)
  for (let i = 0; i < nE; i++) {
    const a = ringO[i], b = ringO[(i + 1) % nE], { nx, nz } = eO[i]
    const c = ring2[i], d = ring2[(i + 1) % nE]
    const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    m.quad([[a.x, YT, a.z], [b.x, YT, b.z], [b.x, YT + 0.5, b.z], [a.x, YT + 0.5, a.z]], [nx, 0, nz], uv, O2_CANOPY, MT)
    m.quad([[a.x, YT, a.z], [b.x, YT, b.z], [d.x, YT, d.z], [c.x, YT, c.z]], [0, -1, 0], uv, O2_CANOPY, MT)
  }
  capPolygonWithHoles(m, [ringO], YT + 0.5, O2_CANOPY, MT)

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// 1650 Mission Street (the former SF Planning Department building)
// ---------------------------------------------------------------------------------------------------------------

const PM_ST: Rgb = [1.0, 0.98, 0.93]          // #b9b6ae light stone courses and piers
const PM_WALL: Rgb = [0.92, 0.9, 0.85]        // the wall plane between the courses
const PM_DK: Rgb = [0.7, 0.69, 0.65]          // #8f8c86 darker bands and the dado
const PM_INLAY: Rgb = [0.6, 0.6, 0.57]       // the mottled inlay strip in each course
const PM_WIN: Rgb = [0.3, 0.44, 0.54]         // #3d4f5e ribbon windows
const PM_WIN2: Rgb = [0.42, 0.58, 0.66]        // a paler pane, reflecting sky
const PM_FRAME: Rgb = [0.12, 0.15, 0.18]
const PM_BLUE: Rgb = [0.36, 0.56, 0.76]       // #3e6187 the blue glass top storey
const PM_BLUE2: Rgb = [0.6, 0.78, 0.9]
const PM_BLUE_MUL: Rgb = [0.2, 0.3, 0.42]
const PM_EDGE: Rgb = [0.82, 0.81, 0.78]       // #d6d4cf the thin projecting roof edge
const PM_ROOF: Rgb = [0.32, 0.33, 0.34]
const PM_TOWER: Rgb = [0.27, 0.4, 0.5]        // the dark glass grid section
const PM_TOWER_PIER: Rgb = [0.27, 0.29, 0.31]
const PM_DOOR: Rgb = [0.4, 0.44, 0.47]

/** The plan in the model frame (front 318 on -z), used where no footprint is given. */
const PM_RING: P2[] = [[35.7, -27.7], [44.7, -16.2], [51.0, -8.7], [50.1, -7.0], [28.8, 33.1], [21.1, 28.8], [-3.3, 15.5], [-11.7, 11.4],
  [-51.0, -6.7], [-37.7, -32.2], [-4.0, -31.6], [31.3, -29.4], [33.3, -29.0], [34.5, -28.5]].map(([x, z]) => ({ x, z }))

/**
 * 1650 Mission Street (the former San Francisco Planning Department, c.1990; OSM way/288794276, 22 m, LiDAR 21.8 median /
 * 28.0 max): a five-storey civic block in light and dark grey banded stone. Each floor is a deep stone spandrel with a dark
 * mottled inlay strip, a long ribbon window split into panes between stone piers, and a stone head; a granite dado and two
 * garage doors at the base. The corner at Otis and Gough is a big rounded curve whose courses and ribbon windows follow it,
 * and the top storey there is blue glass wrapping the curve (and 20 m along Otis, all Gough) under a thin pale roof edge.
 * At the far end of the Otis front a dark glass grid section stands proud and rises to 26 m. Photographs
 * docs/shots/refs/notable/1650-mission/mapillary-1 and -2 (the curve and the blue storey), way-288794276-02/-03 (the Otis
 * front, the glass section), -01 (stone courses and dado detail).
 *
 * Orientation: manifest front 318 (Otis) is local -z. The curve is found from the footprint, not placed by number: OSM draws
 * it as a chain of short consecutive edges that turn together (here 4 vertices, ~50 degrees, next to the Otis front); each
 * such chain is replaced by a true arc (radius 15 for the one beside the front, 4.5 for the others), and the Otis front
 * is the long edge facing -z.
 */
function planningBuilding_1650_Mission(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const AS = surfaceTag('ashlar'), GR = surfaceTag('granite'), MT = surfaceTag('metal')
  const uvq: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  let R: P2[] = fit.ring && fit.ring.length >= 4 ? fit.ring.slice() : PM_RING.slice()
  if (R.length > 3 && Math.hypot(R[0].x - R[R.length - 1].x, R[0].z - R[R.length - 1].z) < 0.3) R = R.slice(0, -1)
  let area = 0
  for (let i = 0; i < R.length; i++) { const a = R[i], b = R[(i + 1) % R.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) R.reverse()
  const len = (a: P2, b: P2): number => Math.hypot(b.x - a.x, b.z - a.z)

  // ---- the plan: iron out jogs, find the curved corners (chains of short edges) and replace them with arcs ----------------
  for (let k = 0; k < 40 && R.length > 4; k++) {
    let j = -1
    for (let i = 0; i < R.length; i++) if (len(R[i], R[(i + 1) % R.length]) < 0.8) { j = i; break }
    if (j < 0) break
    R.splice((j + 1) % R.length, 1)
  }
  const n0 = R.length
  const el = R.map((a, i) => len(a, R[(i + 1) % n0]))
  // the Otis front: the longest edge facing -z
  let fe = 0
  for (let i = 0; i < n0; i++) {
    const b = R[(i + 1) % n0], L = el[i]
    const nz = -(b.x - R[i].x) / L
    const fz = -(R[fe + 1 === n0 ? 0 : fe + 1].x - R[fe].x) / el[fe]
    if (nz < -0.85 && (fz >= -0.85 || L > el[fe])) fe = i
  }
  // rotate so vertex 0 starts the front edge
  R = [...R.slice(fe), ...R.slice(0, fe)]
  const el2 = R.map((a, i) => len(a, R[(i + 1) % R.length]))
  const n1 = R.length
  type DP = { x: number; z: number; arc: number }   // arc: -1 none, else arc id; tangent points are arc points
  const D: DP[] = []
  let arcId = 0
  let i = 0
  while (i < n1) {
    // a chain of short edges starting at vertex i?
    let j = i
    while (j < n1 && el2[j % n1] < 4.0 && j - i < 6) j++
    if (j > i && i > 0) {
      const a = R[(i + n1 - 1) % n1], va = R[i], vb = R[j % n1], b = R[(j + 1) % n1]
      const u1 = { x: (va.x - a.x) / len(a, va), z: (va.z - a.z) / len(a, va) }
      const u2 = { x: (b.x - vb.x) / len(vb, b), z: (b.z - vb.z) / len(vb, b) }
      const den = u1.x * u2.z - u1.z * u2.x
      const turn = Math.atan2(den, u1.x * u2.x + u1.z * u2.z)
      if (turn > 0.2) {
        const t = ((vb.x - va.x) * u2.z - (vb.z - va.z) * u2.x) / den
        const C = { x: va.x + u1.x * t, z: va.z + u1.z * t }
        const adjFront = (i - 1 + n1) % n1 === 0 || ((i - 1 + n1) % n1) === 0
        let r = adjFront ? 15 : 4.5
        const dmax = 0.45 * Math.min(len(a, C), len(C, b))
        r = Math.min(r, dmax / Math.tan(turn / 2))
        const d = r * Math.tan(turn / 2)
        const T1 = { x: C.x - u1.x * d, z: C.z - u1.z * d }
        const cen = { x: T1.x - u1.z * r, z: T1.z + u1.x * r }
        const a1 = Math.atan2(T1.z - cen.z, T1.x - cen.x)
        const ns = Math.max(3, Math.ceil((turn * r) / 1.2))
        for (let s = 0; s <= ns; s++) D.push({ x: cen.x + Math.cos(a1 + (turn * s) / ns) * r, z: cen.z + Math.sin(a1 + (turn * s) / ns) * r, arc: arcId })
        arcId++
        i = j + 1
        continue
      }
    }
    D.push({ x: R[i].x, z: R[i].z, arc: -1 })
    i++
  }
  const N = D.length
  type Seg = { a: DP; b: DP; L: number; tx: number; tz: number; nx: number; nz: number; s0: number }
  const S: Seg[] = []
  let tot = 0
  for (let k = 0; k < N; k++) {
    const a = D[k], b = D[(k + 1) % N], L = Math.hypot(b.x - a.x, b.z - a.z) || 1e-6
    S.push({ a, b, L, tx: (b.x - a.x) / L, tz: (b.z - a.z) / L, nx: (b.z - a.z) / L, nz: -(b.x - a.x) / L, s0: tot })
    tot += L
  }
  // miter offset vector at each vertex
  const vo = D.map((_, k) => {
    const e0 = S[(k + N - 1) % N], e1 = S[k]
    const kk = 1 + e0.nx * e1.nx + e0.nz * e1.nz
    return { x: (e0.nx + e1.nx) / kk, z: (e0.nz + e1.nz) / kk }
  })
  const segAt = (s: number): number => {
    let k = 0
    while (k < N - 1 && S[k + 1].s0 <= s + 1e-9) k++
    return k
  }
  /** a point on the plan at arclength s, pushed `off` out (mitered at the vertices) */
  const P = (k: number, t: number, y: number, off: number): V3 => {
    const sg = S[k], v0 = vo[k], v1 = vo[(k + 1) % N]
    return [sg.a.x + (sg.b.x - sg.a.x) * t + (v0.x + (v1.x - v0.x) * t) * off, y, sg.a.z + (sg.b.z - sg.a.z) * t + (v0.z + (v1.z - v0.z) * t) * off]
  }
  const each = (s0: number, s1: number, f: (k: number, ta: number, tb: number) => void): void => {
    if (s1 - s0 < 0.01) return
    for (let k = segAt(s0); k < N && S[k].s0 < s1 - 1e-9; k++) {
      const ta = Math.max(0, (s0 - S[k].s0) / S[k].L), tb = Math.min(1, (s1 - S[k].s0) / S[k].L)
      if (tb - ta > 1e-6) f(k, ta, tb)
    }
  }
  /** a vertical strip of wall from s0 to s1, y0..y1, `off` proud of the plan */
  const strip = (s0: number, s1: number, y0: number, y1: number, off: number, col: Rgb, tag: number): void =>
    each(s0, s1, (k, ta, tb) => m.quad([P(k, ta, y0, off), P(k, tb, y0, off), P(k, tb, y1, off), P(k, ta, y1, off)], [S[k].nx, 0, S[k].nz], uvq, col, tag))
  /** a course standing `off` proud: its face and its top (and underside) */
  const slab = (s0: number, s1: number, y0: number, y1: number, off: number, col: Rgb, tag: number, under = false): void => {
    strip(s0, s1, y0, y1, off, col, tag)
    each(s0, s1, (k, ta, tb) => {
      m.quad([P(k, ta, y1, 0), P(k, tb, y1, 0), P(k, tb, y1, off), P(k, ta, y1, off)], [0, 1, 0], uvq, col, tag)
      if (under) m.quad([P(k, ta, y0, off), P(k, tb, y0, off), P(k, tb, y0, 0), P(k, ta, y0, 0)], [0, -1, 0], uvq, col, tag)
    })
  }
  /** a vertical return at arclength s, from `o0` to `o1` out; dir +1 faces along the plan's direction of travel */
  const cap = (s: number, y0: number, y1: number, o0: number, o1: number, dir: number, col: Rgb, tag: number): void => {
    const k = segAt(Math.min(s, tot - 1e-6)), t = Math.min(1, Math.max(0, (s - S[k].s0) / S[k].L))
    m.quad([P(k, t, y0, o0), P(k, t, y0, o1), P(k, t, y1, o1), P(k, t, y1, o0)], [S[k].tx * dir, 0, S[k].tz * dir], uvq, col, tag)
  }

  // ---- heights ---------------------------------------------------------------------------------------------------------------
  const Y0 = -1.2, YG = 4.4, FL = 4.0, YT = YG + FL * 3, YR = 21.6, YE = 22.0, YTW = 26.0
  // ---- zones along the plan ------------------------------------------------------------------------------------------------------
  const arcs: { s0: number; s1: number }[] = []
  D.forEach((d, k) => {
    if (d.arc < 0) return
    const a = arcs[d.arc] ?? (arcs[d.arc] = { s0: S[k].s0, s1: S[k].s0 })
    a.s1 = S[k].s0
  })
  const fa = arcs[0] ?? { s0: tot * 0.2, s1: tot * 0.24 }
  const ga = arcs[1] ?? { s0: fa.s1 + 22, s1: fa.s1 + 26 }
  // the blue storey: 40 m of the Otis (NW) front before the curve, the curve, and the first 9 m of the wall round it
  const sBlue0 = Math.max(S[0].L * 0.15, fa.s0 - 40)
  const sBlue1 = Math.min(fa.s1 + 9, ga.s0 - 3)
  // the dark glass grid section: the 17 m of the wall after the second (south-west) corner
  const sT0 = ga.s1, sT1 = Math.min(sT0 + 17, tot - 3)
  // run boundaries: every sharp vertex, every arc end, the blue storey's ends, the glass section's ends
  const cuts: number[] = [0, tot, sT0, sT1, sBlue0, sBlue1]
  D.forEach((d, k) => {
    const e0 = S[(k + N - 1) % N], e1 = S[k]
    const sharp = d.arc < 0 && e0.tx * e1.tx + e0.tz * e1.tz < 0.94
    const edge = (d.arc >= 0 && (D[(k + N - 1) % N].arc !== d.arc || D[(k + 1) % N].arc !== d.arc))
    if (sharp || edge) cuts.push(S[k].s0)
  })
  cuts.sort((a, b) => a - b)
  const runs: number[][] = []
  for (let q = 0; q + 1 < cuts.length; q++) if (cuts[q + 1] - cuts[q] > 1.0) runs.push([cuts[q], cuts[q + 1]])
  if (runs.length) runs[runs.length - 1][1] = tot

  const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }
  const PIER = 1.4
  for (const [r0, r1] of runs) {
    const mid = (r0 + r1) / 2, rl = r1 - r0
    const isArc = mid > fa.s0 && mid < fa.s1 || arcs.some((a) => mid > a.s0 && mid < a.s1)
    const tower = mid > sT0 && mid < sT1
    const blue = !tower && mid > sBlue0 && mid < sBlue1
    // the wall plane, dado, plinth, ground course
    strip(r0, r1, Y0, YE, 0, PM_WALL, AS)
    strip(r0, r1, Y0, 3.0, 0.04, PM_DK, GR)
    slab(r0, r1, Y0, 0.4, 0.14, PM_DK, GR)
    for (let u = r0 + 1.1; u < r1 - 0.3; u += 1.9) strip(u - 0.03, u + 0.03, 0.4, 3.0, 0.07, PM_INLAY, GR)
    slab(r0, r1, 3.0, YG, 0.18, PM_ST, AS, true)
    slab(r0, r1, 3.55, 3.85, 0.22, PM_INLAY, GR)
    // bays
    const pitch = isArc ? 6.2 : 8.6
    const nb = Math.max(1, Math.round((rl - PIER + 1.0) / pitch))
    const bw = (rl - PIER - (nb - 1) * PIER) / nb
    const floors: { y0: number; h: number }[] = []
    if (!tower) { for (let f = 0; f < 3; f++) floors.push({ y0: YG + FL * f, h: FL }) }
    else for (let f = 0; f < 3; f++) floors.push({ y0: YG + FL * f, h: FL })
    for (const { y0, h } of floors) {
      slab(r0, r1, y0, y0 + 1.5, 0.22, PM_ST, AS, true)
      slab(r0, r1, y0 + 0.55, y0 + 0.95, 0.27, PM_INLAY, GR)
      slab(r0, r1, y0 + 1.15, y0 + 1.22, 0.3, PM_DK, AS)
      slab(r0, r1, y0 + h - 0.7, y0 + h, 0.2, PM_ST, AS, true)
      for (let b = 0; b < nb; b++) {
        const u0 = r0 + PIER / 2 + b * (bw + PIER), u1 = u0 + bw
        if (rl < 3) continue
        const np = Math.max(1, Math.round(bw / 2.4)), pw = bw / np
        for (let p = 0; p < np; p++) {
          const c = hash(u0 + p, y0) > 0.6 ? PM_WIN2 : PM_WIN
          strip(u0 + pw * p, u0 + pw * (p + 1), y0 + 1.5, y0 + h - 0.7, 0.03, c, GL)
          if (p > 0) strip(u0 + pw * p - 0.05, u0 + pw * p + 0.05, y0 + 1.5, y0 + h - 0.7, 0.07, PM_FRAME, MT)
        }
        strip(u0, u1, y0 + 1.5, y0 + 1.62, 0.08, PM_FRAME, MT)
        // a stone pier after each bay
        if (b < nb - 1) slab(u1, u1 + PIER, y0 + 1.5, y0 + h - 0.7, 0.2, PM_ST, AS)
      }
      // the end piers
      slab(r0, r0 + PIER / 2, y0 + 1.5, y0 + h - 0.7, 0.2, PM_ST, AS)
      slab(r1 - PIER / 2, r1, y0 + 1.5, y0 + h - 0.7, 0.2, PM_ST, AS)
    }
    // ---- the top storey ----
    if (blue) {
      slab(r0, r1, YT, YT + 1.1, 0.24, PM_ST, AS, true)
      slab(r0, r1, YT + 0.4, YT + 0.75, 0.28, PM_INLAY, GR)
      const gy0 = YT + 1.1, gy1 = YR
      const nm = Math.max(2, Math.round(rl / 1.5)), pw = rl / nm
      for (let p = 0; p < nm; p++) {
        const c = hash(r0 + p, 3) > 0.7 ? PM_BLUE2 : PM_BLUE
        strip(r0 + pw * p, r0 + pw * (p + 1), gy0, gy1, 0.1, c, GL)
        strip(r0 + pw * p - 0.04, r0 + pw * p + 0.04, gy0, gy1, 0.14, PM_BLUE_MUL, MT)
      }
      for (const y of [gy0 + 1.0, gy0 + 2.5]) strip(r0, r1, y, y + 0.1, 0.15, PM_BLUE_MUL, MT)
      strip(r0, r1, gy1 - 0.35, gy1, 0.16, PM_BLUE_MUL, MT)
    } else if (!tower) {
      const y0 = YT
      slab(r0, r1, y0, y0 + 1.9, 0.22, PM_ST, AS, true)
      slab(r0, r1, y0 + 0.8, y0 + 1.15, 0.27, PM_INLAY, GR)
      slab(r0, r1, YR - 0.7, YR, 0.2, PM_ST, AS, true)
      const wy0 = y0 + 1.9, wy1 = wy0 + 2.05
      slab(r0, r1, wy1, YR - 0.7, 0.2, PM_ST, AS)
      for (let b = 0; b < nb; b++) {
        const u0 = r0 + PIER / 2 + b * (bw + PIER), u1 = u0 + bw
        const np = Math.max(1, Math.round(bw / 2.4)), pw = bw / np
        for (let p = 0; p < np; p++) {
          strip(u0 + pw * p, u0 + pw * (p + 1), wy0, wy1, 0.03, hash(u0 + p, 9) > 0.6 ? PM_WIN2 : PM_WIN, GL)
          if (p > 0) strip(u0 + pw * p - 0.05, u0 + pw * p + 0.05, wy0, wy1, 0.07, PM_FRAME, MT)
        }
        if (b < nb - 1) slab(u1, u1 + PIER, wy0, wy1, 0.2, PM_ST, AS)
      }
      slab(r0, r0 + PIER / 2, wy0, wy1, 0.2, PM_ST, AS)
      slab(r1 - PIER / 2, r1, wy0, wy1, 0.2, PM_ST, AS)
    } else {
      // the dark glass grid section: a glass box standing 0.6 proud, banded by a piers grid, rising to 26 m
      strip(r0, r1, YT, YR, 0.0, PM_WALL, AS)
      const np = Math.max(2, Math.round(rl / 4.2)), pw = rl / np
      strip(r0, r1, YG, YTW, 0.6, PM_TOWER, GL)
      for (let p = 0; p <= np; p++) {
        const u = r0 + pw * p
        slab(Math.max(r0, u - 0.28), Math.min(r1, u + 0.28), YG, YTW, 0.9, PM_TOWER_PIER, MT)
      }
      for (let y = YG; y < YTW - 1; y += 4.4) slab(r0, r1, y + 0.1, y + 1.1, 0.7, PM_TOWER_PIER, MT)
      cap(r0, YG, YTW, 0, 0.6, -1, PM_TOWER_PIER, MT)
      cap(r1, YG, YTW, 0, 0.6, 1, PM_TOWER_PIER, MT)
      slab(r0, r1, YTW - 0.1, YTW + 0.4, 1.1, PM_EDGE, AS, true)
      // its top, a box running back 7 m with a roof
      const k0 = segAt(r0 + 0.01), k1 = segAt(r1 - 0.01)
      const back = (k: number, t: number, y: number): V3 => P(k, t, y, -7)
      const ta = (r0 - S[k0].s0) / S[k0].L, tb = (r1 - S[k1].s0) / S[k1].L
      m.quad([P(k0, ta, YTW, 0.9), P(k1, tb, YTW, 0.9), back(k1, tb, YTW), back(k0, ta, YTW)], [0, 1, 0], uvq, PM_ROOF, AS)
      m.quad([back(k1, tb, YE), back(k0, ta, YE), back(k0, ta, YTW), back(k1, tb, YTW)], [-S[k0].nx, 0, -S[k0].nz], uvq, PM_WALL, AS)
      for (const [kk, tt, sg] of [[k0, ta, -1], [k1, tb, 1]] as [number, number, number][]) {
        m.quad([P(kk, tt, YE, 0), P(kk, tt, YE, -7), P(kk, tt, YTW, -7), P(kk, tt, YTW, 0)], [S[kk].tx * sg, 0, S[kk].tz * sg], uvq, PM_WALL, AS)
      }
    }
    // the thin projecting roof edge over everything
    if (!tower) slab(r0, r1, YR, YE, 0.55, PM_EDGE, AS, true)
    else slab(r0, r1, YR, YE, 0.2, PM_EDGE, AS, true)
  }

  // ---- doors and louvres on the Otis wall round the curve (photographs -02, -03, mapillary-2) ----------------------------------
  const door = (sc: number, w: number, h: number, col: Rgb): void => {
    strip(sc - w / 2 - 0.12, sc + w / 2 + 0.12, 0.0, h + 0.15, 0.1, PM_DK, GR)
    strip(sc - w / 2, sc + w / 2, 0.0, h, 0.16, col, MT)
    strip(sc - 0.03, sc + 0.03, 0.0, h, 0.2, PM_FRAME, MT)
  }
  const sw = fa.s1, lw = ga.s0 - fa.s1
  if (lw > 14) {
    door(sw + 2.6, 1.3, 2.6, PM_DOOR)
    for (let y = 0.5; y < 3.0; y += 0.28) strip(sw + 4.6, sw + 5.8, y, y + 0.1, 0.18, PM_FRAME, MT)
    door(sw + 9.6, 5.2, 3.6, PM_DOOR)
    if (lw > 22) door(sw + 17, 4.6, 3.6, [0.22, 0.26, 0.3])
  }

  // the roof
  capPolygonWithHoles(m, [D.map((d) => ({ x: d.x, z: d.z }))], YE, PM_ROOF, AS)

  for (let q = 0; q < m.positions.length; q++) out.positions.push(m.positions[q])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// Hotel Metropolis (Found Study), 2-16 Turk Street at Mason
// ---------------------------------------------------------------------------------------------------------------

const HM_WALL: Rgb = [0.72, 0.67, 0.56]       // cream, less saturated (rendered yellow in the city)
const HM_STONE: Rgb = [0.78, 0.74, 0.65]
const HM_TRIM: Rgb = [0.88, 0.83, 0.7]
const HM_GROOVE: Rgb = [0.74, 0.69, 0.56]
const HM_CORN: Rgb = [0.149, 0.188, 0.169]
const HM_CORN2: Rgb = [0.12, 0.18, 0.15]
const HM_BASE: Rgb = [0.165, 0.169, 0.176]
const HM_NAVY: Rgb = [0.12, 0.15, 0.23]
const HM_GLASS: Rgb = [0.2, 0.25, 0.3]
const HM_SHOP: Rgb = [0.3, 0.38, 0.4]
const HM_IRON: Rgb = [0.04, 0.04, 0.045]
const HM_ORANGE: Rgb = [0.78, 0.26, 0.1]

/**
 * Former Hotel Metropolis (now Found Study), 2-16 Turk Street at Mason (1911, ten storeys). Own geometry from
 * docs/shots/refs/notable/metropolis (mapillary-0/1/2, way-260127277-01..03), on the OSM plan from `fit.ring`, Turk
 * (south) the front on local -z and Mason (east) on +x:
 * - a dark storefront storey (glazed, a small canopy, orange piers at the corner), two rusticated lighter storeys over
 *   it and a belt course, then a five-floor cream shaft of paired sash windows with light surrounds and a few shallow
 *   bays stacked up the Turk front, a top storey of small windows between pilasters;
 * - the green-black cornice: a coved soffit flaring 1.6 m out from the wall, a fascia, and a hipped sloping cap;
 * - a black iron fire escape zig-zagging up the north end of the Mason face; the rear (north) wall painted dark navy
 *   with sparse small windows (mapillary-0); the west party wall plain; a small stair penthouse behind the cornice.
 */
function hotelMetropolis_2_Turk(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const ST = surfaceTag('stucco'), AS = surfaceTag('ashlar'), MT = surfaceTag('metal'), GL = surfaceTag('glass')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  // iron out the plan's small jogs
  for (let k = 0; k < 30 && ring.length > 4; k++) {
    let j = -1
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]
      if (Math.hypot(b.x - a.x, b.z - a.z) < 1.8) { j = i; break }
    }
    if (j < 0) break
    ring.splice((j + 1) % ring.length, 1)
  }
  const n = ring.length
  const Y0 = -3, YB = 4.8, YR = 11.7, YS = 12.2, FS = 3.2, YT = 28.2, YC = 30.6, YF = 32.2, YFT = 33.4, YTOP = 35.0
  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1e-6
    return { a, b, l, tx: (b.x - a.x) / l, tz: (b.z - a.z) / l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  const vo = ring.map((_, k) => {
    const e0 = info[(k + n - 1) % n], e1 = info[k]
    const kk = Math.max(0.35, 1 + e0.nx * e1.nx + e0.nz * e1.nz)
    return { x: (e0.nx + e1.nx) / kk, z: (e0.nz + e1.nz) / kk }
  })
  const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

  for (let ei = 0; ei < n; ei++) {
    const { a, b, l, tx, tz, nx, nz } = info[ei]
    const h = Math.atan2(nx, nz)
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      if (u1 - u0 < 0.01) return
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const slab = (u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb, tag = ST): void => {
      boxAlong(m, a.x + tx * (u0 + u1) / 2 + nx * (pr0 + pr1) / 2, (y0 + y1) / 2, a.z + tz * (u0 + u1) / 2 + nz * (pr0 + pr1) / 2,
        (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, tag)
    }
    const front = l > 10 && nz < -0.7, mason = l > 10 && nx > 0.7, rear = l > 10 && nz > 0.7
    const street = front || mason
    // the A/B points of the cornice, mitred at the vertices
    const va = vo[ei], vb = vo[(ei + 1) % n]
    const A = (y: number, off: number): V3 => [a.x + va.x * off, y, a.z + va.z * off]
    const B = (y: number, off: number): V3 => [b.x + vb.x * off, y, b.z + vb.z * off]

    // ---- walls ----
    if (l < 0.5) continue
    panel(0, l, Y0, YC, 0, rear ? HM_NAVY : HM_WALL, ST)
    // ---- the cornice ----
    {
      const ns = nx * 0.72, nzs = nz * 0.72
      m.quad([A(YC, 0), B(YC, 0), B(YF, 1.6), A(YF, 1.6)], [ns, -0.69, nzs], uv, HM_CORN, ST)
      m.quad([A(YF, 1.6), B(YF, 1.6), B(YFT, 1.6), A(YFT, 1.6)], [nx, 0, nz], uv, HM_CORN, ST)
      m.quad([A(YFT, 1.6), B(YFT, 1.6), B(YTOP, -1.4), A(YTOP, -1.4)], [nx * 0.6, 0.8, nz * 0.6], uv, HM_CORN2, ST)
      // the lighter drip band under the fascia and a scalloped tile edge
      if (l > 2) {
        for (let u = 0.4; u < l - 0.3; u += 0.9) {
          const t0 = u / l, t1 = Math.min(1, (u + 0.55) / l)
          const q = (t: number, y: number, off: number): V3 => {
            const p = A(y, off), r = B(y, off)
            return [p[0] + (r[0] - p[0]) * t, y, p[2] + (r[2] - p[2]) * t]
          }
          m.quad([q(t0, YFT, 1.66), q(t1, YFT, 1.66), q(t1, YFT + 0.18, 1.66), q(t0, YFT + 0.18, 1.66)], [nx, 0, nz], uv, HM_CORN2, ST)
        }
      }
    }
    if (l < 3) continue

    if (street || rear) {
      // ---- the dark base ----
      if (street) {
        panel(0, l, Y0, YB, 0.14, HM_BASE, ST)
        panel(0, l, YB - 0.5, YB, 0.2, HM_TRIM, ST)
        const nw = Math.max(2, Math.round((l - 2) / 3.6)), pw = (l - 2) / nw
        for (let k = 0; k < nw; k++) {
          const u0 = 1 + k * pw + 0.2
          panel(u0, u0 + pw - 0.4, 0.5, 3.6, 0.17, HM_SHOP, GL)
          panel(u0 - 0.05, u0 + 0.05, 0.4, 3.7, 0.2, HM_BASE, MT)
        }
        slab(0, l, 3.7, 4.2, 0.14, 0.3, HM_BASE)
        // two ground-floor pieces of identity: a canopy on the Turk front, orange piers at the corner
        if (front) {
          slab(l * 0.4, l * 0.4 + 5, 3.4, 3.7, 0.14, 1.6, [0.12, 0.2, 0.17])
          slab(l - 7.2, l - 6.7, 0, 3.6, 0.16, 0.6, HM_ORANGE)
          slab(l - 2.7, l - 2.2, 0, 3.6, 0.16, 0.6, HM_ORANGE)
        }
      } else {
        panel(0, l, Y0, YB + 0.5, 0.1, HM_BASE, ST)
      }
    } else {
      panel(0, l, Y0, 1.2, 0.05, HM_GROOVE, ST)
    }

    if (street) {
      // ---- rusticated storeys, belt course ----
      panel(0, l, YB, YR, 0.04, HM_STONE, AS)
      for (let y = YB + 0.4; y < YR; y += 0.85) panel(0, l, y, y + 0.07, 0.07, HM_GROOVE, AS)
      slab(0, l, YR, YR + 0.5, 0, 0.35, HM_TRIM)
      slab(0, l, YB, YB + 0.18, 0, 0.22, HM_TRIM)
      slab(0, l, YT - 0.3, YT + 0.1, 0, 0.3, HM_TRIM)
      slab(0, l, YC - 0.35, YC, 0, 0.5, HM_TRIM)
      // ---- windows ----
      const nc = Math.max(2, Math.round((l - 1.6) / 3.3)), pit = (l - 1.6) / nc
      const rows: { y: number; hh: number; rust: boolean }[] = [
        { y: 5.7, hh: 1.9, rust: true }, { y: 9.2, hh: 1.9, rust: true },
      ]
      for (let f = 0; f < 5; f++) rows.push({ y: YS + 0.55 + f * FS + 0.3, hh: 2.05, rust: false })
      const BAYS = [[1, 1], [2, 2], [2, 4], [3, 4], [4, 3]]
      for (let c = 0; c < nc; c++) {
        const uc = 0.8 + pit * (c + 0.5)
        rows.forEach((r, ri) => {
          const w = 1.9
          panel(uc - w / 2 - 0.2, uc + w / 2 + 0.2, r.y - 0.15, r.y + r.hh + 0.25, 0.07, HM_TRIM, ST)
          const bay = front && !r.rust && BAYS.some(([bc, bf]) => bc === c && bf === ri - 2)
          if (bay) {
            const pr = 0.7
            slab(uc - w / 2 - 0.15, uc + w / 2 + 0.15, r.y - 0.55, r.y - 0.1, 0.05, pr + 0.1, HM_TRIM)
            slab(uc - w / 2 - 0.1, uc + w / 2 + 0.1, r.y + r.hh + 0.1, r.y + r.hh + 0.35, 0.05, pr + 0.1, HM_TRIM)
            panel(uc - w / 2, uc + w / 2, r.y, r.y + r.hh, pr, HM_GLASS, GL)
            panel(uc - 0.04, uc + 0.04, r.y, r.y + r.hh, pr + 0.03, HM_TRIM, ST)
            for (const s of [-1, 1]) {
              m.quad([P(uc + s * w / 2, r.y, 0.05), P(uc + s * w / 2, r.y, pr), P(uc + s * w / 2, r.y + r.hh, pr), P(uc + s * w / 2, r.y + r.hh, 0.05)],
                [tx * s, 0, tz * s], uv, HM_TRIM, ST)
            }
          } else {
            panel(uc - w / 2, uc + w / 2, r.y, r.y + r.hh, 0.1, hash(uc, r.y) > 0.8 ? [0.55, 0.6, 0.62] : HM_GLASS, GL)
            panel(uc - 0.04, uc + 0.04, r.y, r.y + r.hh, 0.13, HM_TRIM, ST)
            panel(uc - w / 2, uc + w / 2, r.y + r.hh * 0.5, r.y + r.hh * 0.5 + 0.07, 0.13, HM_TRIM, ST)
            slab(uc - w / 2 - 0.25, uc + w / 2 + 0.25, r.y - 0.25, r.y - 0.1, 0.05, 0.28, HM_TRIM)
          }
        })
        // the top storey: two small windows between pilasters
        for (const s of [-0.55, 0.55]) panel(uc + s - 0.3, uc + s + 0.3, YT + 0.5, YT + 1.6, 0.08, HM_GLASS, GL)
        slab(uc - 1.35, uc - 1.15, YT + 0.1, YC - 0.4, 0, 0.18, HM_TRIM)
        panel(uc - 0.9, uc + 0.9, YC - 0.95, YC - 0.45, 0.08, HM_GROOVE, ST)
      }
    } else {
      // party / rear walls: sparse small windows
      const cols = Math.max(1, Math.round(l / 6))
      for (let c = 0; c < cols; c++) {
        const uc = l * (c + 0.5) / cols
        if (!rear && ei % 2 === 1) continue
        for (let f = 0; f < 8; f++) {
          if (hash(uc + ei, f) > 0.75 && !rear) continue
          const y = 6.5 + f * 3.3
          panel(uc - 0.4, uc + 0.4, y, y + 1.3, 0.05, rear ? [0.65, 0.68, 0.7] : HM_GLASS, GL)
        }
      }
    }

    // ---- the fire escape: the north end of the Mason face ----
    if (mason) {
      const u0 = l - 6.2, u1 = l - 2.0, pr = 0.5, d = 1.1
      const flo = [YS + 0.55 + 0.1 - 0.3]
      for (let f = 1; f < 5; f++) flo.push(YS + 0.55 + f * FS - 0.2)
      const lev = [8.7, ...flo, YT + 0.3]
      for (let i = 0; i < lev.length; i++) {
        const y = lev[i]
        slab(u0, u1, y - 0.05, y + 0.05, pr, pr + d, HM_IRON, MT)
        m.quad([P(u0, y + 0.05, pr + d), P(u1, y + 0.05, pr + d), P(u1, y + 1.0, pr + d), P(u0, y + 1.0, pr + d)], [nx, 0, nz], uv, HM_IRON, MT)
        slab(u0, u1, y + 0.95, y + 1.0, pr + d - 0.04, pr + d, HM_IRON, MT)
        for (const s of [u0, u1]) m.quad([P(s, y + 0.05, pr), P(s, y + 0.05, pr + d), P(s, y + 1.0, pr + d), P(s, y + 1.0, pr)],
          [tx * (s === u0 ? -1 : 1), 0, tz * (s === u0 ? -1 : 1)], uv, HM_IRON, MT)
        if (i + 1 < lev.length) {
          // the stair to the next landing, zig-zag
          const up = i % 2 === 0
          const sa = up ? u0 + 0.2 : u1 - 0.2, sb = up ? u1 - 0.2 : u0 + 0.2
          const y1 = lev[i + 1], w = 0.5
          m.quad([P(sa, y + 0.05, pr + 0.05), P(sb, y1 + 0.05, pr + 0.05), P(sb, y1 + 0.05, pr + 0.05 + w), P(sa, y + 0.05, pr + 0.05 + w)], [0, 1, 0], uv, HM_IRON, MT)
          m.quad([P(sa, y + 0.05, pr + w + 0.05), P(sb, y1 + 0.05, pr + w + 0.05), P(sb, y1 + 0.9, pr + w + 0.05), P(sa, y + 0.9, pr + w + 0.05)], [nx, 0, nz], uv, HM_IRON, MT)
        }
      }
      // the drop ladder to the street
      slab(u0 + 0.2, u0 + 0.5, 4.0, lev[0], pr + 0.2, pr + 0.3, HM_IRON, MT)
    }
  }

  // ---- the roof cap and a small stair penthouse behind the cornice ----
  const top = ring.map((p, k) => ({ x: p.x - vo[k].x * 1.4, z: p.z - vo[k].z * 1.4 }))
  capPolygonWithHoles(m, [top], YTOP, HM_CORN2, ST)
  {
    const cx = ring.reduce((t, p) => t + p.x, 0) / n, cz = ring.reduce((t, p) => t + p.z, 0) / n
    box(m, cx - 4, YTOP + 1.3, cz + 3.5, 2.2, 1.3, 1.8, HM_WALL, ST)
    box(m, cx - 4, YTOP + 2.65, cz + 3.5, 2.4, 0.08, 2.0, HM_CORN, ST)
  }

  for (let q = 0; q < m.positions.length; q++) out.positions.push(m.positions[q])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// The Chateau, 2701 Van Ness Avenue at Greenwich Street
// ---------------------------------------------------------------------------------------------------------------

const CH_WALL: Rgb = [0.85, 0.81, 0.73]        // #e6dcc8 cream stucco
const CH_BASE: Rgb = [0.78, 0.73, 0.65]          // the rusticated base, a shade deeper
const CH_TRIM: Rgb = [0.9, 0.875, 0.83]      // #f1ebdf lighter trim
const CH_SLATE: Rgb = [0.29, 0.306, 0.333]      // #4a4e55 slate
const CH_SLATE_DK: Rgb = [0.22, 0.235, 0.262]
const CH_IRON: Rgb = [0.227, 0.227, 0.227]      // #3a3a3a fire escapes
const CH_GLASS: Rgb = [0.15, 0.18, 0.22]
const CH_DOOR: Rgb = [0.11, 0.1, 0.095]
const CH_CHIM: Rgb = [0.74, 0.7, 0.64]

/**
 * The Chateau, 2701 Van Ness at Greenwich (1929, seven storeys): a French Chateau-style apartment block. Cream stucco over
 * a rusticated base with round-arched garage and entrance doors, six storeys of paired windows in light surrounds, a
 * cornice, then a steep dark slate mansard (two pitches) with a row of pedimented dormers, cream-walled gabled pavilions
 * at the corners (and mid-way on Greenwich), tall chimneys and black fire escapes on the street fronts.
 * Photographs: docs/shots/refs/notable/chateau/ way-69707522-02 (Van Ness front) and -03 (the corner), -01 (the corner
 * gable and chimneys), mapillary-0/1 (the arched base, the escapes), mapillary-2 (the Greenwich wall).
 *
 * Orientation: the manifest says front 81 (Van Ness), the 27.6 m east edge, on local -z; Greenwich is the long edge facing
 * local -x. The plan is a U open to the north (a light court), so those edges are plain wall with windows. Both fronts are
 * found from the ring's geometry in the fit frame, never from OSM's vertex order.
 *
 * Where the photographs overruled the numbers: OSM's eight levels are seven storeys plus the mansard (the Assessor says 7);
 * LiDAR's 26 m median is the mansard's mean height, so the cream wall stops at ~22.8 m and the roof rises to 30 m.
 */
function theChateau_2701_VanNess(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const Y_BASE = 5.2, FH = 2.9, Y_EAVE = Y_BASE + 0.2 + 6 * FH     // 22.8
  const D1 = 2.8, Y1 = Y_EAVE + 5.0, D2 = 6.4, Y2 = Y_EAVE + 6.3  // the steep lower slope, the shallower upper one
  const surf = (d: number): number => (d <= D1 ? Y_EAVE + (d * (Y1 - Y_EAVE)) / D1 : Y1 + ((Math.min(d, D2) - D1) * (Y2 - Y1)) / (D2 - D1))

  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { i, a, b, l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  const best = (fn: (e: typeof info[number]) => number, not = -1): number =>
    info.reduce((bi, e) => (e.i === not ? bi : bi === -1 || fn(e) + e.l * 0.01 > fn(info[bi]) + info[bi].l * 0.01 ? e.i : bi), -1)
  const fi = best((e) => -e.nz), si = best((e) => -e.nx, fi)       // Van Ness front (-z), Greenwich (-x)
  const inset = (d: number): P2[] => info.map((e, i) => {
    const p = info[(i + n - 1) % n]
    const k = 1 + (p.nx * e.nx + p.nz * e.nz)
    return { x: e.a.x - ((p.nx + e.nx) / k) * d, z: e.a.z - ((p.nz + e.nz) / k) * d }
  })
  const r1 = inset(D1), r2 = inset(D2)

  for (const e of info) {
    const { a, b, l, nx, nz } = e
    if (l < 0.5) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    const h = Math.atan2(nx, nz)
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const slab = (u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb, tag = ST): void => {
      boxAlong(m, a.x + tx * (u0 + u1) / 2 + nx * (pr0 + pr1) / 2, (y0 + y1) / 2, a.z + tz * (u0 + u1) / 2 + nz * (pr0 + pr1) / 2,
        (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, tag)
    }
    const street = e.i === fi || e.i === si
    const tri = (p0: V3, p1: V3, p2: V3, c: Rgb, tag: number, nrm: V3): void => { m.quad([p0, p1, p2, p2], nrm, uv, c, tag) }

    // the wall, the rusticated base and its stringcourse, the cornice
    panel(0, l, -3, Y_EAVE, 0, CH_WALL, ST)
    panel(0, l, 0, Y_BASE, 0.05, CH_BASE, ST)
    if (street) for (let y = 0.9; y < Y_BASE - 0.3; y += 0.9) panel(0, l, y, y + 0.07, 0.09, CH_WALL, ST)
    slab(-0.1, l + 0.1, Y_BASE - 0.12, Y_BASE + 0.2, 0, 0.26, CH_TRIM)
    slab(-0.15, l + 0.15, Y_EAVE - 0.55, Y_EAVE + 0.05, 0, 0.55, CH_TRIM)
    slab(-0.1, l + 0.1, Y_EAVE - 1.0, Y_EAVE - 0.55, 0, 0.18, CH_TRIM)
    // the roof's two slopes
    const A1 = r1[e.i], B1 = r1[(e.i + 1) % n], A2 = r2[e.i], B2 = r2[(e.i + 1) % n]
    const sl = Math.hypot(D1, Y1 - Y_EAVE)
    m.quad([[a.x, Y_EAVE, a.z], [b.x, Y_EAVE, b.z], [B1.x, Y1, B1.z], [A1.x, Y1, A1.z]], [nx * (Y1 - Y_EAVE) / sl, D1 / sl, nz * (Y1 - Y_EAVE) / sl], uv, CH_SLATE, TL)
    const s2 = Math.hypot(D2 - D1, Y2 - Y1)
    m.quad([[A1.x, Y1, A1.z], [B1.x, Y1, B1.z], [B2.x, Y2, B2.z], [A2.x, Y2, A2.z]], [nx * (Y2 - Y1) / s2, (D2 - D1) / s2, nz * (Y2 - Y1) / s2], uv, CH_SLATE, TL)

    // ---- the window storeys: paired sashes in a light surround -----------------------------------------------------
    const nb = Math.max(1, Math.round(l / 3.3)), pitch = l / nb
    const bayU = (j: number): number => pitch * (j + 0.5)
    // arched openings at the base: [centre fraction, half width, door?]
    const arches: [number, number, boolean][] = e.i === fi ? [[0.2, 1.65, true], [0.5, 0.6, false], [0.76, 1.65, true]]
      : e.i === si ? [[0.3, 1.65, true], [0.52, 0.6, false], [0.7, 1.65, true], [0.92, 0.6, false]] : []
    for (const [fr, hw, door] of arches) {
      const cx = a.x + tx * l * fr, cz = a.z + tz * l * fr
      const top = door ? 3.5 : 3.0
      emOpening(m, cx, cz, tx, tz, nx, nz, door ? 0.2 : 1.3, top, hw + 0.3, hw + 0.2, CH_TRIM, ST, 0.1, 6)
      emOpening(m, cx, cz, tx, tz, nx, nz, door ? 0.2 : 1.45, top, hw, hw * 0.9, door ? CH_DOOR : CH_GLASS, door ? ST : GL, 0.14, 6)
    }
    for (let f = 0; f < 6; f++) {
      const y0 = Y_BASE + 0.2 + f * FH
      for (let j = 0; j < nb; j++) {
        const u = bayU(j)
        if (f === 0 && arches.some(([fr, hw]) => Math.abs(u - l * fr) < hw + 0.9 && false)) continue
        const hw = Math.min(1.15, pitch * 0.36)
        panel(u - hw - 0.12, u + hw + 0.12, y0 + 0.7, y0 + 2.4, 0.04, CH_TRIM, ST)
        panel(u - hw, u - 0.07, y0 + 0.82, y0 + 2.3, 0.08, CH_GLASS, GL)
        panel(u + 0.07, u + hw, y0 + 0.82, y0 + 2.3, 0.08, CH_GLASS, GL)
        panel(u - 0.07, u + 0.07, y0 + 0.82, y0 + 2.3, 0.09, CH_TRIM, ST)
        if (street) panel(u - hw - 0.22, u + hw + 0.22, y0 + 0.58, y0 + 0.72, 0.1, CH_TRIM, ST)
      }
      if (street && f >= 1) panel(0, l, y0 + 0.5, y0 + 0.56, 0.03, CH_BASE, ST)   // a shallow belt under the sills
    }
    // corner pilasters up both ends of a street front
    if (street) for (const u of [0.28, l - 0.28]) slab(u - 0.28, u + 0.28, Y_BASE + 0.2, Y_EAVE - 0.55, 0, 0.14, CH_TRIM)

    // ---- dormers along the eave: a cream frame, a window, a pediment, slate cheeks -------------------------------------
    const dormer = (u: number, tall = 0): void => {
      const pr = -0.25, hw = 0.95, yb = Y_EAVE + 0.25, yh = Y_EAVE + 3.0 + tall, ya = yh + 0.9
      panel(u - hw, u + hw, yb, yh, pr, CH_TRIM, ST)
      panel(u - hw + 0.28, u - 0.05, yb + 0.25, yh - 0.25, pr + 0.04, CH_GLASS, GL)
      panel(u + 0.05, u + hw - 0.28, yb + 0.25, yh - 0.25, pr + 0.04, CH_GLASS, GL)
      tri(P(u - hw - 0.08, yh, pr + 0.06), P(u + hw + 0.08, yh, pr + 0.06), P(u, ya + 0.1, pr + 0.06), CH_TRIM, ST, [nx, 0, nz])
      tri(P(u - 0.55, yh + 0.1, pr + 0.1), P(u + 0.55, yh + 0.1, pr + 0.1), P(u, ya - 0.2, pr + 0.1), CH_SLATE_DK, ST, [nx, 0, nz])
      const dB = surf(-pr), dR = Math.min(2.6 + tall * 0.6, D2 - 0.4)
      for (const s of [-1, 1]) {
        const sn: V3 = [s * tx * 0.8 + nx * 0.3, 0.6, s * tz * 0.8 + nz * 0.3]
        m.quad([P(u + s * hw, yh, pr), P(u, ya, pr), P(u, ya + 0.15, -dR), P(u + s * hw, Math.max(yh, surf(dR)), -dR)], sn, uv, CH_SLATE, TL)
        tri(P(u + s * hw, dB, pr), P(u + s * hw, yh, pr), P(u + s * hw, Math.max(yh, surf(dR)), -dR), CH_SLATE_DK, TL, [s * tx, 0, s * tz])
      }
    }
    const nd = street ? nb : Math.floor(nb / 2)
    for (let j = 0; j < nd; j++) {
      const u = street ? bayU(j) : pitch * (j * 2 + 1)
      const clear = street && (u < 4.4 || u > l - 4.4 || (e.i === si && Math.abs(u - l / 2) < 2.6))
      if (!clear && u > 1.2 && u < l - 1.2) dormer(u)
    }

    // ---- cream gabled pavilions rising through the mansard: both ends of a front, and mid-way on Greenwich -----------
    if (street) {
      const gus = [3.2, l - 3.2].concat(e.i === si ? [l / 2] : [])
      for (const u of gus) {
        const w = 2.9, yA = Y_EAVE + 6.0, yR = Y_EAVE + 7.0, dR = 3.7
        tri(P(u - w, Y_EAVE, 0.02), P(u + w, Y_EAVE, 0.02), P(u, yA, 0.02), CH_WALL, ST, [nx, 0, nz])
        tri(P(u - w + 0.3, Y_EAVE + 0.1, 0.05), P(u + w - 0.3, Y_EAVE + 0.1, 0.05), P(u, yA - 0.4, 0.05), CH_TRIM, ST, [nx, 0, nz])
        for (const du of [-1.4, 0, 1.4]) {
          const hh = du === 0 ? 0.6 : 0.46
          emOpening(m, a.x + tx * (u + du) + nx * 0.06, a.z + tz * (u + du) + nz * 0.06, tx, tz, nx, nz, Y_EAVE + 0.55, Y_EAVE + (du === 0 ? 2.7 : 2.2), hh + 0.12, hh * 0.9, CH_TRIM, ST, 0.07, 6)
          emOpening(m, a.x + tx * (u + du) + nx * 0.06, a.z + tz * (u + du) + nz * 0.06, tx, tz, nx, nz, Y_EAVE + 0.65, Y_EAVE + (du === 0 ? 2.7 : 2.2), hh, hh * 0.85, CH_GLASS, GL, 0.1, 6)
        }
        for (const s of [-1, 1]) {
          const bk = surf(dR)
          const sn: V3 = [s * tx * 0.85 + nx * 0.2, 0.7, s * tz * 0.85 + nz * 0.2]
          m.quad([P(u + s * w, Y_EAVE, 0.12), P(u, yA, 0.12), P(u, yR, -dR), P(u + s * w, bk, -dR)], sn, uv, CH_SLATE, TL)
          tri(P(u + s * w, Y_EAVE, 0), P(u + s * w, Y_EAVE, -0.01), P(u + s * w, bk, -dR), CH_SLATE_DK, TL, [s * tx, 0, s * tz])
        }
        slab(u - 0.12, u + 0.12, yA - 0.1, yA + 0.35, -0.1, 0.1, CH_TRIM)      // the finial
      }
    }

    // ---- black fire escapes up the street fronts ---------------------------------------------------------------------
    const escape = (u: number): void => {
      for (let f = 0; f < 6; f++) {
        const y = Y_BASE + 0.2 + f * FH + 0.55
        slab(u - 1.05, u + 1.05, y - 0.05, y + 0.05, 0.02, 1.0, CH_IRON, ST)
        slab(u - 1.05, u + 1.05, y + 0.95, y + 1.0, 0.96, 1.0, CH_IRON, ST)
        slab(u - 1.05, u - 1.0, y + 0.05, y + 1.0, 0.02, 1.0, CH_IRON, ST)
        slab(u + 1.0, u + 1.05, y + 0.05, y + 1.0, 0.02, 1.0, CH_IRON, ST)
        if (f > 0) {
          const dir = f % 2 === 0 ? 1 : -1, uc = u + dir * 0.45, p = 1.02
          const q: V3[] = [P(uc - 0.3, y - FH, p), P(uc + 0.3, y - FH, p), P(uc + 0.3 - dir * 0.9, y, p), P(uc - 0.3 - dir * 0.9, y, p)]
          m.quad(q, [nx, 0, nz], uv, CH_IRON, ST)
          m.quad([q[1], q[0], q[3], q[2]], [-nx, 0, -nz], uv, CH_IRON, ST)
        }
      }
    }
    if (e.i === fi) escape(l * 0.72)
    if (e.i === si) { escape(l * 0.4); escape(l * 0.84) }
  }

  // ---- chimneys: tall cream stacks with a cap, along the roof's upper slope ------------------------------------------------
  const chim = (e: typeof info[number], fr: number, d: number): void => {
    const tx = (e.b.x - e.a.x) / e.l, tz = (e.b.z - e.a.z) / e.l
    const cx = e.a.x + tx * e.l * fr - e.nx * d, cz = e.a.z + tz * e.l * fr - e.nz * d
    const h = Math.atan2(e.nx, e.nz), y0 = surf(d) - 0.3
    boxAlong(m, cx, (y0 + 30.1) / 2, cz, 0.55, (30.1 - y0) / 2, 0.45, h, CH_CHIM, ST)
    boxAlong(m, cx, 30.2, cz, 0.7, 0.14, 0.6, h, CH_TRIM, ST)
    boxAlong(m, cx, 30.5, cz, 0.45, 0.16, 0.35, h, CH_SLATE_DK, ST)
  }
  const bigStack = (e: typeof info[number], fr: number, d: number): void => {
    const tx = (e.b.x - e.a.x) / e.l, tz = (e.b.z - e.a.z) / e.l
    const cx = e.a.x + tx * e.l * fr - e.nx * d, cz = e.a.z + tz * e.l * fr - e.nz * d, h = Math.atan2(e.nx, e.nz)
    boxAlong(m, cx, (surf(d) - 0.3 + 30.3) / 2, cz, 1.0, (30.3 - surf(d) + 0.3) / 2, 0.8, h, CH_SLATE_DK, ST)
    boxAlong(m, cx, 30.4, cz, 1.15, 0.1, 0.95, h, CH_TRIM, ST)
  }
  const E = info[fi], S = info[si]
  chim(E, 0.36, 5.2); chim(E, 0.64, 5.6)
  chim(S, 0.22, 5.4); bigStack(S, 0.42, 5.4); chim(S, 0.62, 5.6); chim(S, 0.82, 5.2)

  capPolygonWithHoles(m, [r2], Y2, CH_SLATE, surfaceTag('concrete'))

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// 2400 Pacific Avenue (apartments, Pacific Heights, 1932)
// ---------------------------------------------------------------------------------------------------------------

const AP_WALL: Rgb = [0.91, 0.875, 0.8]        // #e8dfcd cream stucco
const AP_TRIM: Rgb = [0.95, 0.925, 0.88]       // #f2ece0
const AP_SLATE: Rgb = [0.294, 0.31, 0.337]     // #4b4f56
const AP_SLATE_DK: Rgb = [0.22, 0.235, 0.262]
const AP_ESC: Rgb = [0.54, 0.23, 0.17]         // #8a3b2c fire escape
const AP_GLASS: Rgb = [0.14, 0.17, 0.21]
const AP_DOOR: Rgb = [0.1, 0.09, 0.085]
const AP_CHIM: Rgb = [0.8, 0.76, 0.69]

/**
 * 2400 Pacific Avenue at Fillmore (1932, eight storeys): cream stucco, canted bays stacked from the second floor up,
 * a dark slate mansard with pointed cream gables over every bay and a corner tower, a round-arched entrance at the
 * south-east corner under a stone balcony, a red-brown fire escape and the garage door on the Fillmore wall.
 * Photographs: docs/shots/refs/notable/2400-pacific/ way-262128047-01..03 (the corner from down Pacific, the long side)
 * and mapillary-0/1/2 (the corner tower, the Fillmore wall with its escape, the garage).
 *
 * Orientation: manifest front 171 (Pacific, the long edge with the five bays) on local -z; Fillmore is the east edge, local +x,
 * so the entrance corner is (+x, -z). Found from the ring's geometry in the fit frame, never from OSM's vertex order.
 *
 * Where the photographs overruled the numbers: OSM and LiDAR say ~27-30 m with a 26.6 m median; the cream wall stops at 24 m
 * and the mansard (slate and gables, 5.6 m) carries it to 29.6 m, chimneys and gable peaks to 30.5. OSM draws Pacific's bays
 * as rectangular jogs; the photographs show them canted, so the jogs are rebuilt as three-facet bays that start at the
 * second-floor belt (the walls under them are flat). Fillmore is a flat edge in OSM but the photographs show canted bays on it
 * too, so three are added. The last Pacific "bay" in OSM is the corner tower's front facet.
 */
function apartments_2400_Pacific(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const YB = -6, Y_BAY = 6.2, Y_EAVE = 24.0
  const D1 = 2.2, Y1 = Y_EAVE + 4.4, D2 = 6.0, Y2 = Y_EAVE + 5.6
  const surf = (d: number): number => (d <= 0 ? Y_EAVE : d <= D1 ? Y_EAVE + (d * (Y1 - Y_EAVE)) / D1 : Y1 + ((Math.min(d, D2) - D1) * (Y2 - Y1)) / (D2 - D1))
  const gnd = (x: number, z: number): number => (fit.groundAt ? Math.max(0, fit.groundAt(x, z)) : 0)
  // window storeys: basement, second, then five above the belt
  const FLOORS: [number, number][] = [[0.9, 2.5], [3.6, 5.7], [7.0, 9.2], [10.25, 12.45], [13.5, 15.7], [16.75, 18.95], [20.0, 22.2]]

  type Fr = { a: P2; l: number; tx: number; tz: number; nx: number; nz: number }
  const frame = (a: P2, b: P2): Fr => {
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l
    return { a, l, tx, tz, nx: tz, nz: -tx }
  }
  const pt = (f: Fr, u: number, y: number, pr = 0): V3 => [f.a.x + f.tx * u + f.nx * pr, y, f.a.z + f.tz * u + f.nz * pr]
  const pt2 = (f: Fr, u: number, pr = 0): P2 => ({ x: f.a.x + f.tx * u + f.nx * pr, z: f.a.z + f.tz * u + f.nz * pr })
  const panel = (f: Fr, u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
    m.quad([pt(f, u0, y0, pr), pt(f, u1, y0, pr), pt(f, u1, y1, pr), pt(f, u0, y1, pr)], [f.nx, 0, f.nz], uv, c, tag)
  }
  const slab = (f: Fr, u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb, tag = ST): void => {
    boxAlong(m, f.a.x + f.tx * (u0 + u1) / 2 + f.nx * (pr0 + pr1) / 2, (y0 + y1) / 2, f.a.z + f.tz * (u0 + u1) / 2 + f.nz * (pr0 + pr1) / 2,
      (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, Math.atan2(f.nx, f.nz), c, tag)
  }
  const tri = (p0: V3, p1: V3, p2: V3, c: Rgb, tag: number, nrm: V3): void => { m.quad([p0, p1, p2, p2], nrm, uv, c, tag) }
  const win = (f: Fr, u: number, y0: number, y1: number, hw: number, detail: boolean, pr = 0): void => {
    if (detail) {
      panel(f, u - hw - 0.1, u + hw + 0.1, y0 - 0.15, y1 + 0.12, pr + 0.03, AP_TRIM, ST)
      panel(f, u - hw, u + hw, y0, y1, pr + 0.07, AP_GLASS, GL)
      panel(f, u - 0.04, u + 0.04, y0, y1, pr + 0.09, AP_TRIM, ST)
    } else panel(f, u - hw, u + hw, y0, y1, pr + 0.04, AP_GLASS, GL)
  }

  // ---- the plan: edges, front, Fillmore, the bays --------------------------------------------------------------------------
  const info = ring.map((a, i) => ({ i, b: ring[(i + 1) % ring.length], ...frame(a, ring[(i + 1) % ring.length]) }))
  const n = ring.length
  const zMin = Math.min(...ring.map((p) => p.z))
  const isFront = (e: typeof info[number]): boolean => e.nz < -0.6 && e.l > 0.5 && e.a.z < zMin + 7
  const fronts = info.filter(isFront)
  const lastFront = fronts.length ? fronts.reduce((p, e) => (e.b.x > p.b.x ? e : p)) : info[0]
  const C = lastFront.b
  const eastE = info.filter((e) => e.nx > 0.8 && e.l > 10).reduce<typeof info[number] | null>((p, e) => (!p || e.l > p.l ? e : p), null)
  const nF = { x: lastFront.nx, z: lastFront.nz }
  const nS = eastE ? { x: eastE.nx, z: eastE.nz } : { x: 1, z: 0 }

  type Bay = { i: number; p: P2; q: P2; a: P2; b: P2; corner: boolean }
  const bays: Bay[] = []
  const skipV = new Set<number>()
  for (const e of info) {
    if (!isFront(e) || e.l < 2.0 || e.l > 3.6) continue
    const p = info[(e.i + n - 1) % n], q = info[(e.i + 1) % n]
    const o1 = (e.a.x - p.a.x) * e.nx + (e.a.z - p.a.z) * e.nz, o2 = (q.b.x - e.b.x) * e.nx + (q.b.z - e.b.z) * e.nz
    if (p.l < 1 && q.l < 1 && o1 > 0.3 && o2 < -0.3) {
      bays.push({ i: e.i, p: p.a, q: q.b, a: e.a, b: e.b, corner: Math.hypot((e.a.x + e.b.x) / 2 - C.x, (e.a.z + e.b.z) / 2 - C.z) < 4.5 })
      skipV.add(e.i); skipV.add((e.i + 1) % n)
    }
  }
  const wr = ring.filter((_, i) => !skipV.has(i))          // the plan with the bay jogs ironed out
  const wn = wr.length

  // ---- the roof's outline: the convex hull (the bay tips lie on it; the light well is roofed over) ----------------------
  const hull = (() => {
    const pts = ring.slice().sort((p, q) => p.x - q.x || p.z - q.z)
    const cr = (o: P2, a: P2, b: P2): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x)
    const lo: P2[] = [], up: P2[] = []
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p) }
    for (const p of pts.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p) }
    let h = lo.slice(0, -1).concat(up.slice(0, -1))
    for (let again = true; again && h.length > 3;) {
      again = false
      for (let i = 0; i < h.length; i++) {
        const a = h[(i + h.length - 1) % h.length], b = h[i], c = h[(i + 1) % h.length]
        const l1 = Math.hypot(b.x - a.x, b.z - a.z), l2 = Math.hypot(c.x - b.x, c.z - b.z)
        if (Math.abs(cr(a, b, c)) / (l1 * l2) < 0.04 || l2 < 0.8) { h = h.filter((_, k) => k !== i); again = true; break }
      }
    }
    return h
  })()
  const hn = hull.length
  const hinfo = hull.map((a, i) => ({ i, b: hull[(i + 1) % hn], ...frame(a, hull[(i + 1) % hn]) }))
  const inset = (d: number): P2[] => hinfo.map((e, i) => {
    const p = hinfo[(i + hn - 1) % hn]
    const k = 1 + (p.nx * e.nx + p.nz * e.nz)
    return { x: e.a.x - ((p.nx + e.nx) / k) * d, z: e.a.z - ((p.nz + e.nz) / k) * d }
  })
  const r1 = inset(D1), r2 = inset(D2)
  for (const e of hinfo) {
    const A1 = r1[e.i], B1 = r1[(e.i + 1) % hn], A2 = r2[e.i], B2 = r2[(e.i + 1) % hn]
    const sl = Math.hypot(D1, Y1 - Y_EAVE), s2 = Math.hypot(D2 - D1, Y2 - Y1)
    m.quad([[e.a.x, Y_EAVE, e.a.z], [e.b.x, Y_EAVE, e.b.z], [B1.x, Y1, B1.z], [A1.x, Y1, A1.z]],
      [e.nx * (Y1 - Y_EAVE) / sl, D1 / sl, e.nz * (Y1 - Y_EAVE) / sl], uv, AP_SLATE, TL)
    m.quad([[A1.x, Y1, A1.z], [B1.x, Y1, B1.z], [B2.x, Y2, B2.z], [A2.x, Y2, A2.z]],
      [e.nx * (Y2 - Y1) / s2, (D2 - D1) / s2, e.nz * (Y2 - Y1) / s2], uv, AP_SLATE, TL)
    // the cornice: a deep cream course, wide enough to hide the recesses between the bays
    slab(e, -0.1, e.l + 0.1, Y_EAVE - 0.75, Y_EAVE + 0.05, -1.0, 0.3, AP_TRIM)
    slab(e, -0.1, e.l + 0.1, Y_EAVE - 1.2, Y_EAVE - 0.75, -0.9, 0.12, AP_TRIM)
  }
  capPolygonWithHoles(m, [r2], Y2, AP_SLATE, surfaceTag('concrete'))

  // ---- gables, dormers (shared by every wall) ---------------------------------------------------------------------------
  const gable = (f: Fr, u: number, w: number, pr0: number, hp: number): void => {
    const yA = Y_EAVE + 3.7, dR = 3.4, bk = surf(dR), yE = bk + 0.45, pb = hp - dR
    tri(pt(f, u - w, Y_EAVE, pr0), pt(f, u + w, Y_EAVE, pr0), pt(f, u, yA, pr0), AP_TRIM, ST, [f.nx, 0, f.nz])
    tri(pt(f, u - w + 0.3, Y_EAVE + 0.1, pr0 + 0.03), pt(f, u + w - 0.3, Y_EAVE + 0.1, pr0 + 0.03), pt(f, u, yA - 0.62, pr0 + 0.03), AP_WALL, ST, [f.nx, 0, f.nz])
    const nw = w > 1.5 ? 3 : 2
    for (let k = 0; k < nw; k++) {
      const du = nw === 3 ? (k - 1) * 0.95 : (k - 0.5) * 0.9, hh = nw === 3 && k === 1 ? 0.42 : 0.34
      win(f, u + du, Y_EAVE + 0.6, Y_EAVE + (nw === 3 && k === 1 ? 2.35 : 1.95), hh, true, pr0 + 0.02)
    }
    for (const s of [-1, 1]) {
      const sn: V3 = [s * f.tx * 0.85 + f.nx * 0.2, 0.7, s * f.tz * 0.85 + f.nz * 0.2]
      m.quad([pt(f, u + s * w, Y_EAVE, pr0 - 0.04), pt(f, u, yA, pr0 - 0.04), pt(f, u, yE, pb), pt(f, u + s * w, bk, pb)], sn, uv, AP_SLATE, TL)
      tri(pt(f, u + s * w, Y_EAVE, pr0 - 0.04), pt(f, u + s * w, Y_EAVE - 0.01, pr0 - 0.05), pt(f, u + s * w, bk, pb), AP_SLATE_DK, TL, [s * f.tx, 0, s * f.tz])
      slab(f, u + s * w - 0.14, u + s * w + 0.14, Y_EAVE, Y_EAVE + 0.9, pr0 - 0.14, pr0 + 0.14, AP_TRIM)   // the scrolled shoulder's knob
      tri(pt(f, u + s * (w - 0.1), Y_EAVE + 0.05, pr0 + 0.02), pt(f, u + s * (w + 0.55), Y_EAVE + 0.05, pr0 + 0.02), pt(f, u + s * (w - 0.1), Y_EAVE + 1.3, pr0 + 0.02), AP_TRIM, ST, [f.nx, 0, f.nz])   // the scroll's flare
    }
    slab(f, u - 0.09, u + 0.09, yA - 0.1, yA + 0.5, pr0 - 0.09, pr0 + 0.09, AP_TRIM)                         // the finial
  }
  const dormer = (f: Fr, u: number, off: number, tall = 0): void => {
    const pr = off - 0.9, hw = 0.85, yb = Y_EAVE + 0.2, yh = Y_EAVE + 2.7 + tall, ya = yh + 0.8
    panel(f, u - hw, u + hw, yb, yh, pr, AP_TRIM, ST)
    panel(f, u - hw + 0.25, u - 0.05, yb + 0.25, yh - 0.25, pr + 0.04, AP_GLASS, GL)
    panel(f, u + 0.05, u + hw - 0.25, yb + 0.25, yh - 0.25, pr + 0.04, AP_GLASS, GL)
    tri(pt(f, u - hw - 0.08, yh, pr + 0.06), pt(f, u + hw + 0.08, yh, pr + 0.06), pt(f, u, ya + 0.1, pr + 0.06), AP_TRIM, ST, [f.nx, 0, f.nz])
    const dB = surf(0.9), dR = Math.min(2.6 + tall * 0.6, D2 - 0.4)
    for (const s of [-1, 1]) {
      const sn: V3 = [s * f.tx * 0.8 + f.nx * 0.3, 0.6, s * f.tz * 0.8 + f.nz * 0.3]
      m.quad([pt(f, u + s * hw, yh, pr), pt(f, u, ya, pr), pt(f, u, ya + 0.15, off - 0.9 - dR), pt(f, u + s * hw, Math.max(yh, surf(dR + 0.9)), off - 0.9 - dR)], sn, uv, AP_SLATE, TL)
      tri(pt(f, u + s * hw, dB, pr), pt(f, u + s * hw, yh, pr), pt(f, u + s * hw, Math.max(yh, surf(dR + 0.9)), off - 0.9 - dR), AP_SLATE_DK, TL, [s * f.tx, 0, s * f.tz])
    }
  }

  // a canted bay: three facets from the belt to the eave, a window to each facet on each upper floor, a gable above
  const canted = (f: Fr, uc: number, pr0: number, hwC: number, hwO: number, hp: number): void => {
    const Q = [pt2(f, uc - hwO, 0), pt2(f, uc - hwC, pr0), pt2(f, uc + hwC, pr0), pt2(f, uc + hwO, 0)]
    const y0 = Y_BAY - 0.55
    m.quad([[Q[0].x, y0, Q[0].z], [Q[1].x, y0, Q[1].z], [Q[2].x, y0, Q[2].z], [Q[3].x, y0, Q[3].z]], [0, -1, 0], uv, AP_TRIM, ST)
    for (let k = 0; k < 3; k++) {
      const g = frame(Q[k], Q[k + 1])
      panel(g, 0, g.l, y0, Y_EAVE, 0, AP_WALL, ST)
      panel(g, -0.04, g.l + 0.04, y0, y0 + 0.3, 0.04, AP_TRIM, ST)
      panel(g, -0.04, g.l + 0.04, Y_EAVE - 0.45, Y_EAVE - 0.1, 0.04, AP_TRIM, ST)
      for (let fl = 2; fl < 7; fl++) win(g, g.l / 2, FLOORS[fl][0], FLOORS[fl][1], Math.min(0.5, g.l * 0.33), true, 0.0)
    }
    gable(f, uc, hwC + 0.95 + pr0 * 0.4, pr0, hp)
  }

  // ---- the walls --------------------------------------------------------------------------------------------------------
  for (let k = 0; k < wn; k++) {
    const A = wr[k], B = wr[(k + 1) % wn]
    const f = frame(A, B)
    if (f.l < 0.15) continue
    panel(f, 0, f.l, YB, Y_EAVE, 0, AP_WALL, ST)
    const bayHere = bays.find((b) => b.p === A && b.q === B)
    const isFrontW = f.nz < -0.6 && A.z < zMin + 7 && f.l > 0.5
    const isEast = f.nx > 0.8 && f.l > 10
    const street = isFrontW || isEast
    if (street) {
      slab(f, -0.05, f.l + 0.05, Y_BAY - 0.15, Y_BAY + 0.1, 0, 0.14, AP_TRIM)       // the belt over the second floor
      slab(f, 0.0, 0.3, YB, Y_EAVE - 1.2, 0, 0.1, AP_TRIM)
    }
    // bays on this wall: [centre, projection, half-width centre facet, half-width at the wall]
    const wb: [number, number, number, number][] = []
    if (bayHere && !bayHere.corner) {
      const uc = ((bayHere.a.x + bayHere.b.x) / 2 - A.x) * f.tx + ((bayHere.a.z + bayHere.b.z) / 2 - A.z) * f.tz
      wb.push([uc, 0.6, 0.55, 1.3])
    }
    if (isEast) for (const u of [9.0, 18.0, 27.0]) if (u < f.l - 2.5) wb.push([u, 1.0, 0.9, 2.0])
    for (const [uc, pr0, hwC, hwO] of wb) canted(f, uc, pr0, hwC, hwO, isEast ? 0 : 0.6)
    // windows: the lower two storeys everywhere on a street front, the upper five between the bays
    const nbW = Math.max(1, Math.round(f.l / 2.0)), pitch = f.l / nbW
    if (bayHere?.corner) continue
    const detail = street
    for (let j = 0; j < nbW; j++) {
      const u = pitch * (j + 0.5)
      if (isEast && u < 4.6) continue
      if (!street && Math.abs(f.nz) < 0.6 && Math.abs(f.nx) < 0.6) continue
      const x = A.x + f.tx * u, z = A.z + f.tz * u
      const nearBay = wb.some(([uc, , , hwO]) => Math.abs(u - uc) < hwO + 0.5)
      const nearBayBack = !!bayHere
      for (let fl = 0; fl < 7; fl++) {
        if (!street && fl < 3) continue
        if (fl >= 2 && (nearBay || nearBayBack)) continue
        if (fl < 2 && gnd(x, z) > FLOORS[fl][0] - 0.3) continue
        if (isEast && fl === 0 && Math.abs(u - 21.5) < 2.2) continue
        win(f, u, FLOORS[fl][0], FLOORS[fl][1], Math.min(0.62, pitch * 0.3), detail)
      }
    }
    // dormers over the flats of the street fronts
    if (street && f.l > 3.4) {
      const off = isFrontW ? 0.35 : 0
      const nd = isEast ? [13.5, 22.5].filter((u) => u < f.l - 2) : [f.l / 2]
      if (!bayHere) for (const u of nd) dormer(f, u, off)
    }
    // the fire escape and the garage on Fillmore
    if (isEast) {
      const u0 = 21.5
      for (let fl = 1; fl < 7; fl++) {
        const y = FLOORS[fl][0] - 0.55
        m.quad([pt(f, u0 - 1.0, y, 0.02), pt(f, u0 + 1.0, y, 0.02), pt(f, u0 + 1.0, y, 1.0), pt(f, u0 - 1.0, y, 1.0)], [0, 1, 0], uv, AP_ESC, ST)
        for (const [r0, r1] of [[0, 0.07], [0.45, 0.5], [0.88, 0.96]] as [number, number][]) {
          panel(f, u0 - 1.0, u0 + 1.0, y + r0, y + r1, 1.0, AP_ESC, ST)
          m.quad([pt(f, u0 + 1.0, y + r0, 1.0), pt(f, u0 - 1.0, y + r0, 1.0), pt(f, u0 - 1.0, y + r1, 1.0), pt(f, u0 + 1.0, y + r1, 1.0)], [-f.nx, 0, -f.nz], uv, AP_ESC, ST)
        }
        for (const s of [-1, 1]) for (const [r0, r1] of [[0, 0.07], [0.88, 0.96]] as [number, number][]) {
          const q: V3[] = [pt(f, u0 + s * 1.0, y + r0, 0.02), pt(f, u0 + s * 1.0, y + r0, 1.0), pt(f, u0 + s * 1.0, y + r1, 1.0), pt(f, u0 + s * 1.0, y + r1, 0.02)]
          m.quad(q, [s * f.tx, 0, s * f.tz], uv, AP_ESC, ST)
          m.quad([q[1], q[0], q[3], q[2]], [-s * f.tx, 0, -s * f.tz], uv, AP_ESC, ST)
        }
        if (fl > 1) {
          const dir = fl % 2 === 0 ? 1 : -1, uc = u0 + dir * 0.4, yb = FLOORS[fl - 1][0] - 0.55
          const q: V3[] = [pt(f, uc - 0.3, yb, 1.02), pt(f, uc + 0.3, yb, 1.02), pt(f, uc + 0.3 - dir * 0.9, y, 1.02), pt(f, uc - 0.3 - dir * 0.9, y, 1.02)]
          m.quad(q, [f.nx, 0, f.nz], uv, AP_ESC, ST)
          m.quad([q[1], q[0], q[3], q[2]], [-f.nx, 0, -f.nz], uv, AP_ESC, ST)
        }
      }
      const gx = A.x + f.tx * u0, gz = A.z + f.tz * u0, gg = gnd(gx, gz)
      panel(f, u0 - 1.65, u0 + 1.65, gg, gg + 3.0, 0.05, AP_TRIM, ST)
      panel(f, u0 - 1.45, u0 + 1.45, gg, gg + 2.85, 0.09, AP_DOOR, ST)
    }
  }

  // ---- the corner tower: three canted facets, the arched entrance, the balcony, the gable and the hipped slate cap -----------
  {
    const R = 3.1, kx = C.x - nS.x * 1.9 - nF.x * 1.9, kz = C.z - nS.z * 1.9 - nF.z * 1.9
    const TV: P2[] = [-22.5, 22.5, 67.5, 112.5].map((deg) => {
      const al = (deg * Math.PI) / 180, c = Math.cos(al), s = Math.sin(al)
      return { x: kx + R * (c * nF.x + s * nS.x) + 0, z: kz + R * (c * nF.z + s * nS.z) + 0 }
    })
    const fr = [0, 1, 2].map((k) => frame(TV[k], TV[k + 1]))
    const PR = 0.28
    const gC = gnd(C.x, C.z)
    for (let k = 0; k < 3; k++) {
      const g = fr[k]
      panel(g, 0, g.l, YB, Y_EAVE, PR, AP_WALL, ST)
      panel(g, -0.05, g.l + 0.05, Y_BAY - 0.3, Y_BAY + 0.1, PR + 0.06, AP_TRIM, ST)
      panel(g, -0.05, g.l + 0.05, Y_EAVE - 0.55, Y_EAVE - 0.05, PR + 0.08, AP_TRIM, ST)
      slab(g, -0.1, g.l + 0.1, Y_BAY - 0.6, Y_BAY - 0.1, -0.1, PR + 0.55, AP_TRIM)      // the balcony slab
      slab(g, -0.1, g.l + 0.1, Y_BAY + 0.1, Y_BAY + 0.95, PR + 0.4, PR + 0.58, AP_TRIM)   // the balustrade
      slab(g, -0.14, g.l + 0.14, Y_BAY + 0.95, Y_BAY + 1.1, PR + 0.36, PR + 0.62, AP_TRIM)
      for (const u of [0, g.l]) slab(g, u - 0.17, u + 0.17, Y_BAY + 0.1, Y_BAY + 1.3, PR + 0.37, PR + 0.63, AP_TRIM)
      for (let fl = 2; fl < 7; fl++) win(g, g.l / 2, FLOORS[fl][0], FLOORS[fl][1], 0.55, true, PR)
      slab(g, g.l / 2 - 0.9, g.l / 2 + 0.9, FLOORS[3][0] - 0.3, FLOORS[3][0] - 0.12, PR, PR + 0.1, AP_TRIM)
    }
    // the end caps close the tower against the walls
    for (const [P, d, back] of [[TV[0], -1, nF], [TV[3], 1, nS]] as [P2, number, P2][]) {
      const g = fr[d < 0 ? 0 : 2], Q = { x: P.x - back.x * 1.4, z: P.z - back.z * 1.4 }
      m.quad([[P.x, YB, P.z], [Q.x, YB, Q.z], [Q.x, Y_EAVE, Q.z], [P.x, Y_EAVE, P.z]], [d * g.tx, 0, d * g.tz], uv, AP_WALL, ST)
    }
    // the arch on the diagonal facet: a carved surround, a dark door, a medallion over it
    {
      const g = fr[1], u = g.l / 2, cx = g.a.x + g.tx * u + g.nx * PR, cz = g.a.z + g.tz * u + g.nz * PR
      emOpening(m, cx, cz, g.tx, g.tz, g.nx, g.nz, gC, gC + 3.0, 1.15, 1.2, AP_TRIM, ST, 0.07, 8)
      emOpening(m, cx, cz, g.tx, g.tz, g.nx, g.nz, gC, gC + 2.95, 0.88, 1.0, AP_DOOR, ST, 0.12, 8)
      panel(g, u - 0.55, u + 0.55, Y_BAY - 1.5, Y_BAY - 0.85, PR + 0.08, AP_TRIM, ST)
      for (const s of [-1, 1]) slab(g, u + s * 1.25 - 0.14, u + s * 1.25 + 0.14, gC, gC + 3.9, PR, PR + 0.2, AP_TRIM)
      // the pointed cream gable over the corner and its finial
      const w = 1.4, yA = Y_EAVE + 4.6, pr0 = PR + 0.05
      tri(pt(g, u - w, Y_EAVE, pr0), pt(g, u + w, Y_EAVE, pr0), pt(g, u, yA, pr0), AP_TRIM, ST, [g.nx, 0, g.nz])
      tri(pt(g, u - w + 0.28, Y_EAVE + 0.1, pr0 + 0.03), pt(g, u + w - 0.28, Y_EAVE + 0.1, pr0 + 0.03), pt(g, u, yA - 0.6, pr0 + 0.03), AP_WALL, ST, [g.nx, 0, g.nz])
      for (const du of [-0.55, 0.55]) win(g, u + du, Y_EAVE + 0.6, Y_EAVE + 2.2, 0.3, true, pr0 + 0.02)
      slab(g, u - 0.09, u + 0.09, yA - 0.1, yA + 0.7, pr0 - 0.09, pr0 + 0.09, AP_TRIM)
    }
    // the cap: a four-sided hip rising to a point over the middle of the tower
    const apex: V3 = [kx + (nF.x + nS.x) * 0.45, Y_EAVE + 5.4, kz + (nF.z + nS.z) * 0.45]
    for (let k = 0; k < 3; k++) {
      const g = fr[k], p0 = pt(g, 0, Y_EAVE, PR), p1 = pt(g, g.l, Y_EAVE, PR)
      tri(p0, p1, apex, AP_SLATE, TL, [g.nx * 0.6, 0.8, g.nz * 0.6])
    }
    tri(pt(fr[2], fr[2].l, Y_EAVE, PR), pt(fr[0], 0, Y_EAVE, PR), apex, AP_SLATE_DK, TL, [-nF.x - nS.x, 0.2, -nF.z - nS.z])
    boxAlong(m, apex[0], apex[1] + 0.35, apex[2], 0.07, 0.5, 0.07, 0, AP_TRIM, ST)
  }

  // ---- chimneys: cream stacks up the mansard's flat ---------------------------------------------------------------------
  const chim = (e: typeof hinfo[number], fr_: number, d: number, big = false): void => {
    const cx = e.a.x + e.tx * e.l * fr_ - e.nx * d, cz = e.a.z + e.tz * e.l * fr_ - e.nz * d
    const h = Math.atan2(e.nx, e.nz), y0 = surf(d) - 0.3, top = 30.1
    boxAlong(m, cx, (y0 + top) / 2, cz, big ? 0.8 : 0.5, (top - y0) / 2, big ? 0.6 : 0.42, h, AP_CHIM, ST)
    boxAlong(m, cx, top + 0.1, cz, big ? 0.95 : 0.65, 0.12, big ? 0.75 : 0.55, h, AP_TRIM, ST)
  }
  const hFront = hinfo.reduce((p, e) => (e.nz < p.nz ? e : p), hinfo[0])
  const hEast = hinfo.reduce((p, e) => (e.nx > p.nx ? e : p), hinfo[0])
  const hBack = hinfo.reduce((p, e) => (e.nz > p.nz ? e : p), hinfo[0])
  chim(hFront, 0.22, 4.8); chim(hFront, 0.52, 5.3, true); chim(hFront, 0.8, 4.6)
  chim(hEast, 0.4, 4.9); chim(hEast, 0.75, 5.0)
  chim(hBack, 0.4, 4.8)

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// The Marker hotel (former Hotel Californian), 501 Geary Street at Taylor
// ---------------------------------------------------------------------------------------------------------------

const MK_WALL: Rgb = [0.72, 0.67, 0.55]        // the buff brick, greyed (cream renders yellow in the city)
const MK_STONE: Rgb = [0.69, 0.65, 0.56]       // the rusticated base
const MK_GROOVE: Rgb = [0.6, 0.56, 0.47]
const MK_TRIM: Rgb = [0.83, 0.79, 0.69]        // cornice, frames, belt courses
const MK_PLINTH: Rgb = [0.12, 0.115, 0.115]    // the black granite at the foot
const MK_GLASS: Rgb = [0.14, 0.17, 0.2]
const MK_AWN: Rgb = [0.16, 0.18, 0.17]

/**
 * The Marker hotel (former Hotel Californian), 501 Geary Street at Taylor (1910s, nine storeys). Own geometry from
 * docs/shots/refs/notable/w71504453 (way-71504453-01 the corner, -02 the Geary base), on the OSM plan from `fit.ring`:
 * - a black plinth, then a two-storey rusticated stone base of tall round-arched windows (light frames, dark glazing with
 *   a mullion grid) on Geary (front, local -z) and on Taylor, the street edge that meets it; awnings over a few arches;
 * - a belt course and seven floors of buff brick with regular double-sash windows, a top row between the cornice brackets;
 * - a deep cream cornice (coved soffit, bracket blocks, fascia, sloped cap) and a chamfer-like corner pavilion with a
 *   pyramidal crown rising ~3 m higher where Geary meets Taylor;
 * - the light-well and rear walls plain brick with sparse windows.
 * Both street fronts are found from the ring geometry in the fit frame, never from OSM's vertex order.
 * The photographs show seven brick storeys over the base with the cornice at ~28 m, agreeing with OSM's 28 m.
 */
function markerHotel_501_Geary(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const ST = surfaceTag('stucco'), AS = surfaceTag('ashlar'), GL = surfaceTag('glass'), CN = surfaceTag('concrete')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const Y0 = -3, YP = 1.5, YB = 8.6, FS = 2.5, YS = YB + 0.6, YT = YS + 7 * FS, YC = YT + 0.6, YF = YC + 2.0, YFT = YF + 0.9, YTOP = YFT + 0.9
  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1e-6
    return { a, b, l, tx: (b.x - a.x) / l, tz: (b.z - a.z) / l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  const vo = ring.map((_, k) => {
    const e0 = info[(k + n - 1) % n], e1 = info[k]
    const kk = Math.max(0.35, 1 + e0.nx * e1.nx + e0.nz * e1.nz)
    return { x: (e0.nx + e1.nx) / kk, z: (e0.nz + e1.nz) / kk }
  })
  // the Geary front: the longest edge facing -z; Taylor: the long edge sharing a vertex with it, facing across x
  let fi = -1
  info.forEach((e, i) => { if (e.nz < -0.7 && e.l > 10 && (fi < 0 || e.l > info[fi].l)) fi = i })
  let ti = -1
  for (const j of [(fi + 1) % n, (fi + n - 1) % n]) if (fi >= 0 && info[j].l > 10 && Math.abs(info[j].nx) > 0.6) ti = j
  const corner = fi < 0 || ti < 0 ? -1 : (ti === (fi + 1) % n ? ti : fi)   // the vertex where they meet

  for (let ei = 0; ei < n; ei++) {
    const { a, l, tx, tz, nx, nz } = info[ei]
    if (l < 0.5) continue
    const h = Math.atan2(nx, nz)
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      if (u1 - u0 < 0.01) return
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const slab = (u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb, tag = ST): void => {
      boxAlong(m, a.x + tx * (u0 + u1) / 2 + nx * (pr0 + pr1) / 2, (y0 + y1) / 2, a.z + tz * (u0 + u1) / 2 + nz * (pr0 + pr1) / 2,
        (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, tag)
    }
    const street = ei === fi || ei === ti
    const va = vo[ei], vb = vo[(ei + 1) % n]
    const A = (y: number, off: number): V3 => [a.x + va.x * off, y, a.z + va.z * off]
    const B = (y: number, off: number): V3 => [info[ei].b.x + vb.x * off, y, info[ei].b.z + vb.z * off]

    // ---- the wall, the cornice ----
    panel(0, l, Y0, YC, 0, MK_WALL, ST)
    m.quad([A(YC, 0), B(YC, 0), B(YF, 1.5), A(YF, 1.5)], [nx * 0.72, -0.69, nz * 0.72], uv, MK_TRIM, ST)
    m.quad([A(YF, 1.5), B(YF, 1.5), B(YFT, 1.5), A(YFT, 1.5)], [nx, 0, nz], uv, MK_TRIM, ST)
    m.quad([A(YFT, 1.5), B(YFT, 1.5), B(YTOP, -1.0), A(YTOP, -1.0)], [nx * 0.6, 0.8, nz * 0.6], uv, MK_TRIM, ST)
    if (l < 3) continue
    if (street) {
      for (let u = 0.9; u < l - 0.6; u += 1.7) slab(u, u + 0.45, YC - 0.1, YF - 0.45, 0.02, 0.7, MK_TRIM)
      m.quad([A(YF, 1.5), B(YF, 1.5), B(YF, 0.0), A(YF, 0.0)], [0, -1, 0], uv, MK_GROOVE, ST)
    }
    if (!street) {
      // light-well and rear walls: sparse plain windows
      const cols = Math.max(1, Math.round(l / 4.5))
      for (let c = 0; c < cols; c++) {
        const uc = l * (c + 0.5) / cols
        for (let f = 0; f < 8; f++) panel(uc - 0.45, uc + 0.45, 3.4 + f * 3.0, 4.9 + f * 3.0, 0.04, MK_GLASS, GL)
      }
      continue
    }

    // ---- the street fronts: plinth, arched base, belt course, brick shaft ----
    panel(0, l, Y0, YP, 0.1, MK_PLINTH, CN)
    panel(0, l, YP, YB, 0.06, MK_STONE, AS)
    for (let y = YP + 0.5; y < YB - 0.2; y += 0.8) panel(0, l, y, y + 0.07, 0.1, MK_GROOVE, AS)
    slab(0, l, YB - 0.1, YB + 0.5, 0, 0.35, MK_TRIM)
    slab(0, l, YT - 0.2, YT + 0.15, 0, 0.3, MK_TRIM)
    const nc = Math.max(2, Math.round((l - 1.6) / 3.1)), pit = (l - 1.6) / nc
    const ARCH = (uc: number, hw: number, ys: number, yt: number, pr: number, c: Rgb, tag: number): void => {
      const R = hw, spring = yt - R, N = 8
      const x = (i: number): number => uc - hw + (2 * hw * i) / N
      const top = (i: number): number => spring + Math.sqrt(Math.max(0, R * R - (x(i) - uc) * (x(i) - uc)))
      for (let i = 0; i < N; i++) {
        m.quad([P(x(i), ys, pr), P(x(i + 1), ys, pr), P(x(i + 1), top(i + 1), pr), P(x(i), top(i), pr)], [nx, 0, nz], uv, c, tag)
      }
    }
    for (let c = 0; c < nc; c++) {
      const uc = 0.8 + pit * (c + 0.5)
      // the tall round-arched window: light frame, dark glazing, mullion grid
      ARCH(uc, 1.45, YP + 0.35, YB - 0.7, 0.1, MK_TRIM, ST)
      ARCH(uc, 1.2, YP + 0.7, YB - 1.0, 0.13, MK_GLASS, GL)
      panel(uc - 0.04, uc + 0.04, YP + 0.7, YB - 2.2, 0.16, MK_TRIM, ST)
      for (const y of [YP + 2.3, YP + 3.6]) panel(uc - 1.2, uc + 1.2, y, y + 0.07, 0.16, MK_TRIM, ST)
      if (c % 3 === 1) slab(uc - 1.3, uc + 1.3, YP + 2.6, YP + 2.9, 0.1, 1.2, MK_AWN)
      // seven floors of double-sash windows
      for (let f = 0; f < 7; f++) {
        const y = YS + f * FS + 0.45
        panel(uc - 0.98, uc + 0.98, y - 0.15, y + 1.8, 0.05, MK_TRIM, ST)
        panel(uc - 0.84, uc + 0.84, y, y + 1.65, 0.09, MK_GLASS, GL)
        panel(uc - 0.03, uc + 0.03, y, y + 1.65, 0.11, MK_TRIM, ST)
        panel(uc - 0.84, uc + 0.84, y + 0.8, y + 0.86, 0.11, MK_TRIM, ST)
      }
    }
    // pilaster strips at the ends, giving the corner weight
    for (const u0 of [0, l - 0.7]) panel(u0, u0 + 0.7, YB, YC, 0.08, MK_GROOVE, ST)
  }

  // ---- the roof, and the corner pavilion with its crown ----
  const top = ring.map((p, k) => ({ x: p.x - vo[k].x * 1.0, z: p.z - vo[k].z * 1.0 }))
  capPolygonWithHoles(m, [top], YTOP, MK_GROOVE, ST)
  if (corner >= 0) {
    const p = ring[corner], d = vo[corner]
    const cx = p.x - d.x * 1.7, cz = p.z - d.z * 1.7
    const hd = Math.atan2(info[fi].nx, info[fi].nz)
    boxAlong(m, cx, (YTOP + YTOP + 2.6) / 2, cz, 2.5, 1.3, 2.5, hd, MK_WALL, ST)
    boxAlong(m, cx, YTOP + 2.7, cz, 2.9, 0.15, 2.9, hd, MK_TRIM, ST)
    const s = Math.sin(hd), co = Math.cos(hd)
    const C = (dx: number, dz: number, y: number): V3 => [cx + dx * co + dz * s, y, cz - dx * s + dz * co]
    const r = 2.5, y0 = YTOP + 2.8, y1 = YTOP + 5.4
    const cs: [number, number][] = [[-r, r], [r, r], [r, -r], [-r, -r]]
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = cs[i], [x1, z1] = cs[(i + 1) % 4]
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2
      const nrm = [mx * co + mz * s, 0.5, -mx * s + mz * co] as V3
      m.quad([C(x0, z0, y0), C(x1, z1, y0), C(0, 0, y1), C(0, 0, y1)], nrm, uv, MK_TRIM, ST)
    }
  }

  for (let q = 0; q < m.positions.length; q++) out.positions.push(m.positions[q])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}

// ---------------------------------------------------------------------------------------------------------------
// 1015-1035 Van Ness Avenue at Geary (Art Deco-revival block)
// ---------------------------------------------------------------------------------------------------------------

const VN_SAND: Rgb = [0.7, 0.64, 0.52]
const VN_TAN: Rgb = [0.62, 0.5, 0.35]
const VN_SPAN: Rgb = [0.5, 0.44, 0.34]
const VN_GLASS: Rgb = [0.13, 0.15, 0.18]
const VN_STORE: Rgb = [0.23, 0.24, 0.25]

/**
 * 1015-1035 Van Ness Avenue at Geary (2004): an eight-storey sand-coloured block. A darker tan three-storey base (dark
 * storefront storey, two rows of windows), over it five storeys ruled by tall cream piers standing ~0.4 m proud and
 * running the full height, between them recessed bays of dark windows over darker spandrels, and the piers rising above
 * the roof as a sawtooth crown of stepped pier-heads, alternately tall and short.
 *
 * Photographs: docs/shots/refs/notable/1015-vanness/ way-256479475-02 (the Van Ness front head-on, the key reference),
 * -01 and -03 (the corner with Geary and the long side). Neighbouring glass towers are not ours.
 *
 * Orientation: front 81 (Van Ness) on local -z, Geary on the adjacent +x edge; both found from edge normals, never from
 * OSM vertex order. Every other edge is a plainer party/rear wall.
 */
function decoBlock_1015_VanNess(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const CN = surfaceTag('concrete')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const TOP = 25, Y_G = 4.4, Y_B = 10.4, FL = 2.9

  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z)
    if (l < 0.5) continue
    const tx = (b.x - a.x) / l, tz = (b.z - a.z) / l, nx = tz, nz = -tx
    const h = Math.atan2(nx, nz)
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const slab = (u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb): void => {
      boxAlong(m, a.x + tx * (u0 + u1) / 2 + nx * (pr0 + pr1) / 2, (y0 + y1) / 2, a.z + tz * (u0 + u1) / 2 + nz * (pr0 + pr1) / 2,
        (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, CN)
    }
    const street = l > 8 && (nz < -0.7 || nx > 0.7)
    panel(0, l, -3, TOP, 0, street ? VN_SPAN : VN_SAND, CN)
    if (!street) {
      for (let u = 2; u < l - 1.2; u += 3.4) for (let f = 0; f < 8; f++) {
        const y = f === 0 ? 1.2 : Y_G + (f - 1) * FL + 0.7
        panel(u, u + 1.2, y, y + 1.5, 0.05, VN_GLASS, GL)
      }
      slab(-0.1, l + 0.1, TOP - 0.5, TOP, 0, 0.3, VN_TAN)
      continue
    }
    const kb = Math.max(3, Math.round(l / 2.9)), w = l / kb
    // the tan base: storefront storey (dark glass between piers), two rows of windows with lintel bands
    panel(0, l, -3, Y_B, 0.02, VN_TAN, CN)
    panel(0, l, 0.3, Y_G - 0.5, 0.06, VN_STORE, ST)
    for (let j = 0; j < kb; j++) {
      const uc = w * (j + 0.5)
      panel(uc - w * 0.36, uc + w * 0.36, 0.6, Y_G - 0.7, 0.1, VN_GLASS, GL)
      for (let f = 0; f < 2; f++) {
        const y0 = Y_G + f * 3.0 + 0.6
        panel(uc - w * 0.3, uc + w * 0.3, y0, y0 + 1.6, 0.08, VN_GLASS, GL)
        slab(uc - w * 0.33, uc + w * 0.33, y0 + 1.6, y0 + 1.85, 0, 0.18, VN_SAND)
      }
    }
    for (let j = 0; j <= kb; j++) {
      const u = w * j
      slab(Math.max(0, u - 0.35), Math.min(l, u + 0.35), 0, Y_B, 0, 0.22, VN_TAN)
    }
    slab(-0.05, l + 0.05, Y_G - 0.5, Y_G - 0.1, 0, 0.3, VN_SAND)
    slab(-0.05, l + 0.05, Y_B - 0.25, Y_B + 0.15, 0, 0.45, VN_SAND)                                       // the string course
    // five storeys of recessed bays between proud piers
    for (let j = 0; j < kb; j++) {
      const uc = w * (j + 0.5)
      for (let f = 0; f < 5; f++) {
        const y0 = Y_B + 0.15 + f * FL
        panel(uc - w * 0.2, uc + w * 0.2, y0 + 0.85, y0 + 2.35, 0.07, VN_GLASS, GL)
      }
      slab(uc - w * 0.3, uc + w * 0.3, TOP - 0.5, TOP - 0.1, 0, 0.35, VN_SAND)                          // the top balconies
    }
    for (let j = 0; j <= kb; j++) {
      const u = w * j, u0 = Math.max(0, u - 0.8), u1 = Math.min(l, u + 0.8)
      slab(u0, u1, Y_B + 0.15, TOP, 0, 0.4, VN_SAND)                                                    // the proud pier
      const tall = j % 2 === 0, H = TOP + (tall ? 2.6 : 1.6)
      slab(u0 + 0.1, u1 - 0.1, TOP, H - 0.7, 0, 0.4, VN_SAND)                                            // pier-head shaft
      slab(u0 - 0.08, u1 + 0.08, H - 0.7, H, -0.05, 0.48, VN_TAN)                                        // stepped cap
      slab(u0 + 0.12, u1 - 0.12, H, H + 0.25, 0, 0.36, VN_SAND)
    }
  }
  capPolygonWithHoles(m, [ring], TOP - 0.2, [0.45, 0.43, 0.4], CN)

  for (let i = 0; i < m.positions.length; i++) out.positions.push(m.positions[i])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}


// ---------------------------------------------------------------------------------------------------------------
// Marlton Manor, Jones Street at Eddy (Tenderloin)
// ---------------------------------------------------------------------------------------------------------------

const MM_WALL: Rgb = [0.47, 0.52, 0.45]        // #8f9480 sage grey-green stucco
const MM_TRIM: Rgb = [0.82, 0.82, 0.78]        // #d6d6cc window frames, bay bands
const MM_CORN: Rgb = [0.6, 0.63, 0.58]         // #b8b9ae cornice
const MM_BASE: Rgb = [0.185, 0.19, 0.2]        // #2f3133 storefront base
const MM_BAND: Rgb = [0.3, 0.34, 0.31]         // the dark string courses
const MM_GLASS: Rgb = [0.17, 0.21, 0.25]
const MM_SHOP: Rgb = [0.24, 0.3, 0.32]
const MM_AWN: Rgb = [0.2, 0.34, 0.3]

/**
 * Marlton Manor, Jones at Eddy (1925, eight storeys): sage-grey stucco apartment block. A dark storefront base, then seven
 * storeys of paired white-framed windows with vertical strips of stacked shallow bays (a tall one at the corner) up both
 * street fronts, dark string courses, and a deep projecting cornice. Photographs: docs/shots/refs/notable/marlton/
 * way-35176313-02 (the corner from across the street), -01, -03.
 *
 * Orientation: front 351 (Eddy Street, 30 m) on local -z; Jones (31 m) is the neighbouring edge on the corner. Both are
 * found from the ring in the fit frame (the front edge with the lowest mid z; Jones the longer neighbour), not from
 * OSM's vertex order. The plan has a light court notched into the south-east, which gets plain windows.
 */
function marltonManor_Jones_Eddy(out: MeshBuilder, fit: Fit): void {
  const m = new MeshBuilder()
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const ST = surfaceTag('stucco'), MT = surfaceTag('metal'), GL = surfaceTag('glass')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const n = ring.length
  const Y0 = -3, YB = 4.6, FL = 2.8, YT = YB + 7 * FL, YC = YT + 0.2, YF = YC + 1.0, YTOP = YC + 2.3
  const info = ring.map((a, i) => {
    const b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z) || 1e-6
    return { a, b, l, tx: (b.x - a.x) / l, tz: (b.z - a.z) / l, nx: (b.z - a.z) / l, nz: -(b.x - a.x) / l }
  })
  const vo = ring.map((_, k) => {
    const e0 = info[(k + n - 1) % n], e1 = info[k]
    const kk = Math.max(0.35, 1 + e0.nx * e1.nx + e0.nz * e1.nz)
    return { x: (e0.nx + e1.nx) / kk, z: (e0.nz + e1.nz) / kk }
  })
  // the Eddy front and the Jones edge
  let eddy = -1
  for (let i = 0; i < n; i++) {
    const e = info[i]
    if (e.l > 10 && e.nz < -0.7 && (eddy < 0 || (e.a.z + e.b.z) < (info[eddy].a.z + info[eddy].b.z))) eddy = i
  }
  if (eddy < 0) eddy = 0
  const nxt = (eddy + 1) % n, prv = (eddy + n - 1) % n
  const jones = info[nxt].l >= info[prv].l ? nxt : prv
  const cornerAtEnd = jones === nxt   // the shared vertex is Eddy's end (u = l) and Jones's start (u = 0)

  for (let ei = 0; ei < n; ei++) {
    const { a, b, l, tx, tz, nx, nz } = info[ei]
    if (l < 0.5) continue
    const h = Math.atan2(nx, nz)
    const P = (u: number, y: number, pr = 0): V3 => [a.x + tx * u + nx * pr, y, a.z + tz * u + nz * pr]
    const panel = (u0: number, u1: number, y0: number, y1: number, pr: number, c: Rgb, tag: number): void => {
      if (u1 - u0 < 0.01) return
      m.quad([P(u0, y0, pr), P(u1, y0, pr), P(u1, y1, pr), P(u0, y1, pr)], [nx, 0, nz], uv, c, tag)
    }
    const slab = (u0: number, u1: number, y0: number, y1: number, pr0: number, pr1: number, c: Rgb, tag = ST): void => {
      boxAlong(m, a.x + tx * (u0 + u1) / 2 + nx * (pr0 + pr1) / 2, (y0 + y1) / 2, a.z + tz * (u0 + u1) / 2 + nz * (pr0 + pr1) / 2,
        (u1 - u0) / 2, (y1 - y0) / 2, (pr1 - pr0) / 2, h, c, tag)
    }
    const isEddy = ei === eddy, isJones = ei === jones
    const street = isEddy || isJones
    const va = vo[ei], vb = vo[(ei + 1) % n]
    const A = (y: number, off: number): V3 => [a.x + va.x * off, y, a.z + va.z * off]
    const B = (y: number, off: number): V3 => [b.x + vb.x * off, y, b.z + vb.z * off]

    // ---- wall and the deep cornice ----
    panel(0, l, Y0, YC, 0, MM_WALL, ST)
    m.quad([A(YC, 0), B(YC, 0), B(YF, 1.4), A(YF, 1.4)], [nx * 0.72, -0.69, nz * 0.72], uv, MM_CORN, ST)
    m.quad([A(YF, 1.4), B(YF, 1.4), B(YTOP, 1.4), A(YTOP, 1.4)], [nx, 0, nz], uv, MM_CORN, ST)
    m.quad([A(YTOP, 1.4), B(YTOP, 1.4), B(YTOP + 0.35, -0.8), A(YTOP + 0.35, -0.8)], [nx * 0.5, 0.85, nz * 0.5], uv, MM_CORN, ST)
    if (l < 3) continue

    if (!street) {
      // court and party walls: sparse plain windows
      if (info[ei].l < 8 || Math.abs(nx) > 0.7 && nx > 0) continue
      const cols = Math.max(1, Math.round(l / 4.5))
      for (let c = 0; c < cols; c++) {
        const uc = l * (c + 0.5) / cols
        for (let f = 0; f < 7; f++) panel(uc - 0.55, uc + 0.55, YB + f * FL + 0.7, YB + f * FL + 2.1, 0.05, MM_GLASS, GL)
      }
      continue
    }

    // ---- dark storefront base ----
    panel(0, l, Y0, YB, 0.12, MM_BASE, ST)
    const nw = Math.max(2, Math.round((l - 2) / 4)), pw = (l - 2) / nw
    for (let k = 0; k < nw; k++) {
      const u0 = 1 + k * pw + 0.25
      panel(u0, u0 + pw - 0.5, 0.4, 3.5, 0.15, MM_SHOP, GL)
      slab(u0 - 0.3, u0 + 0.0, 0, 3.7, 0.12, 0.3, MM_BAND)
    }
    slab(0, l, 3.7, YB + 0.15, 0.1, 0.32, MM_BAND)
    for (const f of (isEddy ? [0.3, 0.7] : [0.55])) slab(l * f, l * f + 4, 3.0, 3.4, 0.12, 1.3, MM_AWN, MT)
    // ---- string courses ----
    slab(0, l, YB + FL + 0.95, YB + FL + 1.2, 0, 0.22, MM_BAND)
    slab(0, l, YT - 0.45, YT - 0.2, 0, 0.3, MM_TRIM)
    slab(0, l, YC - 0.25, YC + 0.05, 0, 0.45, MM_BAND)

    // ---- bay strips: the corner one, and one or two more along the front ----
    const du = (d: number): number => cornerAtEnd === isEddy ? l - d : d   // distance from the corner -> u
    const bayC = [2.3, 12.0, 20.5].map(du)
    const bw = 4.2, pr = 0.65
    for (const bc of bayC) {
      if (bc - bw / 2 < 0.2 || bc + bw / 2 > l - 0.2) continue
      const y0 = YB + 0.5, y1 = YT - 0.4
      slab(bc - bw / 2, bc + bw / 2, y0, y1, 0.02, pr, MM_WALL)
      for (let f = 0; f < 7; f++) {
        const yf = YB + f * FL
        slab(bc - bw / 2 - 0.1, bc + bw / 2 + 0.1, yf - 0.05, yf + 0.2, 0, pr + 0.1, MM_TRIM)
        for (let w = 0; w < 3; w++) {
          const uc = bc - bw / 2 + bw * (w + 0.5) / 3
          panel(uc - 0.46, uc + 0.46, yf + 0.65, yf + 2.2, pr + 0.02, MM_GLASS, GL)
          panel(uc - 0.55, uc + 0.55, yf + 0.55, yf + 0.65, pr + 0.04, MM_TRIM, ST)
          panel(uc - 0.04, uc + 0.04, yf + 0.65, yf + 2.2, pr + 0.04, MM_TRIM, ST)
        }
      }
      slab(bc - bw / 2 - 0.1, bc + bw / 2 + 0.1, y1 - 0.1, y1 + 0.2, 0, pr + 0.15, MM_TRIM)
    }

    // ---- plain windows between the bays ----
    const nc = Math.max(2, Math.round((l - 1.6) / 3.0)), pit = (l - 1.6) / nc
    for (let c = 0; c < nc; c++) {
      const uc = 0.8 + pit * (c + 0.5)
      if (bayC.some((bc) => Math.abs(uc - bc) < bw / 2 + 0.9)) continue
      for (let f = 0; f < 7; f++) {
        const yf = YB + f * FL
        panel(uc - 0.75, uc + 0.75, yf + 0.55, yf + 2.25, 0.06, MM_TRIM, ST)
        panel(uc - 0.62, uc + 0.62, yf + 0.65, yf + 2.15, 0.09, MM_GLASS, GL)
        panel(uc - 0.04, uc + 0.04, yf + 0.65, yf + 2.15, 0.11, MM_TRIM, ST)
      }
    }
  }

  const top = ring.map((p, k) => ({ x: p.x - vo[k].x * 1.0, z: p.z - vo[k].z * 1.0 }))
  capPolygonWithHoles(m, [top], YTOP + 0.3, MM_CORN, ST)

  for (let q = 0; q < m.positions.length; q++) out.positions.push(m.positions[q])
  const base = (out.positions.length - m.positions.length) / 3
  for (const x of m.normals) out.normals.push(x)
  for (const x of m.uvs) out.uvs.push(x)
  for (const x of m.colors) out.colors.push(x)
  for (const idx of m.indices) out.indices.push(base + idx)
}


// ---------------------------------------------------------------------------------------------------------------
// Embarcadero Center 2 and 3: the podium blocks either side of Davis Street (BUGS.md #271)
// ---------------------------------------------------------------------------------------------------------------

/**
 * The two three-storey podium blocks flanking Davis Street between Sacramento and Clay (OSM ways 132121543, west, and
 * 132121548, east — untagged `building:levels=3`, drawn as tan Edwardian apartments until 2026-10-16). They are the
 * Center's own brutalist concrete: shops recessed behind square piers at the street, a tall blank board-formed wall
 * with ivy trailing over its top, a glazed top storey set back under a deep concrete pergola on slender posts. The
 * owner's Street View down Davis: docs/shots/refs/bugs/271-embarcadero-podium.webp. The same all round, so no front.
 */
function ecPodium_Davis(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete'), glass = surfaceTag('glass')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const CONC: Rgb = [0.78, 0.75, 0.69], CONC_DK: Rgb = [0.62, 0.6, 0.56], SHOP: Rgb = [0.26, 0.3, 0.31]
  const GLZ: Rgb = [0.2, 0.24, 0.27]
  const G = 4.6, W = 10.6, P = 13.4, TOP = 14.2

  // the street storey: shopfronts a metre back behind square piers, a soffit over the recess
  const shop = ecInset(ring, 1.0)
  ecWalls(out, shop, 0, G, SHOP, glass)
  ecSoffit(out, ring, shop, G - 0.25, CONC_DK, conc)
  ecPiers(out, ring, 6.5, 0, G, 0.9, CONC, conc)
  // the blank wall, ivy trailing over its top from the planters (render/landmarks/ivy.ts)
  ecWalls(out, ring, G, W, CONC, conc)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    ivyWall(out, a, b, { x: (b.z - a.z) / L, z: -(b.x - a.x) / L }, { from: 'top', y: W + 0.2, reach: 2.4, vary: 1.3, max: W - G - 0.4, seed: i * 17 + 3 })
  }
  capPolygonWithHoles(out, [ring], W, [0.5, 0.48, 0.45], conc)
  // the top storey, set back, glazed, under the pergola
  const top = ecInset(ring, 2.6)
  ecWalls(out, top, W, P, GLZ, glass)
  capPolygonWithHoles(out, [top], P, [0.45, 0.43, 0.4], conc)
  ecPiers(out, ring, 6.5, W, P, 0.45, CONC, conc)
  // the pergola: a deep edge beam out past the wall, louvres across to the top storey
  const rim = ecInset(ring, -1.2), rimIn = ecInset(ring, 0.2)
  ecSoffit(out, rim, rimIn, P, CONC, conc)
  ecWalls(out, rim, P, TOP, CONC, conc)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    const n = Math.floor(L / 1.6)
    for (let k = 1; k < n; k++) ecOnEdge(out, ring, i, k / n, -1.1, 0.25, 4.6, P + 0.3, TOP, CONC, conc)
  }
}

export const NOTABLE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  templeEmanuEl,
  ritzCarlton_600_Stockton,
  pier43FerryArch,
  mallochBuilding_1360_Montgomery,
  fugaziBank_4_Columbus,
  pacificExchange_301_Pine,
  whittierMansion_2090_Jackson,
  bohemianClub_624_Taylor,
  olympicClub_524_Post,
  audiffredBuilding_100_Embarcadero,
  alhambraTheatre_2330_Polk,
  victoriaTheatre_2961_16th,
  ywcaResidence_940_Powell,
  stJosephsHospital_355_BuenaVista,
  rialtoBuilding_116_NewMontgomery,
  paigeMotorCar_1699_VanNess,
  fourthChurchScientist_300_Funston,
  swedishAmericanHall_2174_Market,
  zyngaHQ_650_Townsend,
  thePacific_2121_Webster,
  archCrownOffice_King_149167950,
  stripeHQ_510_Townsend,
  chinaBasinLanding_185_Berry,
  zincApartments_8th_Brannan,
  brannanApartments_200_Brannan,
  office_235_Second,
  planningBuilding_1650_Mission,
  hotelMetropolis_2_Turk,
  markerHotel_501_Geary,
  theChateau_2701_VanNess,
  apartments_2400_Pacific,
  decoBlock_1015_VanNess,
  marltonManor_Jones_Eddy,
  ecPodium_Davis,
}
