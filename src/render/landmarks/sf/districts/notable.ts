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

export const NOTABLE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  templeEmanuEl,
  ritzCarlton_600_Stockton,
  pier43FerryArch,
  mallochBuilding_1360_Montgomery,
}
