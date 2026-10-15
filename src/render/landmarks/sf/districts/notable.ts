/**
 * San Francisco's notable buildings that had no model (docs/sf-batches/NOTABLE-UNMODELLED.md, 2026-10-15): OSM tags them
 * as significant (wikidata, heritage, architect) or a photo pass flagged them model-worthy. One building at a time, each
 * from a full evidence pack (docs/sf-batches/MODEL-<name>.md): OSM outline and parts, LiDAR heights, the Assessor's
 * record, Mapillary and Commons photographs.
 */
import { MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { boxAlong } from '../../parts.ts'
import { classicalColumn } from '../../column.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

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

export const NOTABLE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  templeEmanuEl,
  ritzCarlton_600_Stockton,
}
