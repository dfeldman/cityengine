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

const BC_BRICK: Rgb = [0.5, 0.25, 0.185]        // the red-brown brick, a shade under #8e4a36 (it reads darker in shade, mapillary-2)
const BC_BRICK_LT: Rgb = [0.56, 0.29, 0.21]
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
  const rnd = (i: number): number => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

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
    const cell = 0.45
    const nc = Math.floor(l / cell)
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
    for (let layer = 0; layer < 2; layer++) {
      for (let c = 0; c < nc; c++) {
        const u0 = c * cell, u1 = u0 + cell
        const h0 = topAt(u0, layer) + (rnd(c + seed + layer * 5) - 0.5) * 0.5, h1 = topAt(u1, layer) + (rnd(c + 1 + seed + layer * 5) - 0.5) * 0.5
        if (h0 < 0.8 && h1 < 0.8) continue
        const sh = 0.85 + rnd(c * 7 + seed + layer) * 0.3
        const base = layer === 0 ? (rnd(c + seed) < 0.5 ? BC_IVY_DK : BC_IVY_MID) : (rnd(c + seed) < 0.6 ? BC_IVY_LT : BC_IVY_MID)
        const col: Rgb = [base[0] * sh, base[1] * sh, base[2] * sh]
        const pr = 0.1 + layer * 0.05
        m.quad([P(u0, -0.2, pr), P(u1, -0.2, pr), P(u1, Math.max(h1, 0.3), pr), P(u0, Math.max(h0, 0.3), pr)], [nx, 0, nz], uv, col, ST)
      }
    }
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

export const NOTABLE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  templeEmanuEl,
  ritzCarlton_600_Stockton,
  pier43FerryArch,
  mallochBuilding_1360_Montgomery,
  fugaziBank_4_Columbus,
  pacificExchange_301_Pine,
  whittierMansion_2090_Jackson,
  bohemianClub_624_Taylor,
  audiffredBuilding_100_Embarcadero,
  alhambraTheatre_2330_Polk,
  ywcaResidence_940_Powell,
  stJosephsHospital_355_BuenaVista,
}
