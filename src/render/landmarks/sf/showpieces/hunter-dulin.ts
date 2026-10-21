/**
 * The Hunter-Dulin Building, 111 Sutter Street at Montgomery (Schultze & Weaver, 1927): twenty-two storeys of warm
 * buff terracotta in a French-Romanesque / château dress. From the Commons photographs "Hunter-Dulin building from
 * One Montgomery, San Francisco.jpg" (the crown from the south-east, high), "Hunter-Dulin Building (San
 * Francisco).jpg" (looking up a front to its gable), "Hunter–Dulin Building, San Francisco 2023-07-18.jpg" (the
 * corner at the pavement) and the Mapillary frames from Montgomery and Post (2026-10-21).
 *
 * What the photographs show:
 *  - a BASE three storeys high on the two street fronts: two-storey ROUND-ARCHED openings a bay, a storey of paired
 *    windows over them, a corbelled belt course;
 *  - the SHAFT flush with the street to the eighteenth storey: piers a bay apart, a pair of windows a bay a storey,
 *    a round-arched CORBEL TABLE under a parapet at its top, small octagonal TURRETS at the corners;
 *  - over it, set back a little, the CROWN: two PAVILIONS, the big one at the Montgomery corner and a lower one at
 *    the west end of Sutter, their top storeys in tall round-arched windows, each with a steep hipped CHÂTEAU ROOF
 *    of dark red-brown tile (not slate: the roofs are tile, the trim is verdigris copper), a flat top fenced in
 *    green copper CRESTING with tall FINIALS, a gabled WALL DORMER rising out of the wall on each street face,
 *    smaller dormers on the slopes, pinnacles at the corners; between the pavilions a taller flat-roofed LINK, set
 *    further back, fenced in cresting too. Pavilion, link, pavilion is the silhouette seen from Market Street.
 *
 * The frame: the real outline is a rectangle (to 7 cm), axis-aligned in the model frame because the city fits the
 * box to it. The city's manifest front ("street" → the bake's frontage, bearing 351) is the REAR, Bush-side edge at
 * −z, so SUTTER is the +z edge and MONTGOMERY the −x edge; the massing is laid out in (u along Sutter from the west
 * end, d back from Sutter) and each wall is dressed in its own frame (u along it, o out of it, y up).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const FIXED = 0
const T = { terra: surfaceTag('terracotta'), granite: surfaceTag('granite'), tile: surfaceTag('tile'), copper: surfaceTag('copper') }

// the warm, slightly pink buff of the photographs; the spandrels a shade darker, the trim paler
const TERRA: Rgb = [0.8, 0.7, 0.6]
const SPAN: Rgb = [0.7, 0.6, 0.5]
const TRIM: Rgb = [0.86, 0.79, 0.69]
const BASE_C: Rgb = [0.79, 0.7, 0.6]
const JOINT: Rgb = [0.6, 0.53, 0.44]
const SHADE: Rgb = [0.45, 0.39, 0.33]
const GLASS: Rgb = [0.16, 0.18, 0.21]
const DOOR: Rgb = [0.11, 0.11, 0.12]
// the roofs: dark red-brown tile; the cresting, finials and dormer caps verdigris copper
const ROOF: Rgb = [0.28, 0.19, 0.18]
const COPPER: Rgb = [0.36, 0.56, 0.48]
const FLAT: Rgb = [0.5, 0.47, 0.44]

// ------------------------------------------------------------------------------------------------ heights
const ARCH = 8.4                                   // the two arched storeys
const BASE = 12.6                                  // the base's third storey, the belt course over it
const top = (k: number): number => BASE + 3.6 * (k - 3)   // top of storey k (k ≥ 3)
const SHAFT = top(18)                              // 66.6: the shaft's corbel table
const EAVE_E = top(22)                             // 81: the Montgomery pavilion's eaves
const EAVE_W = top(21)                             // 77.4: the west pavilion's
const LINK = top(23)                               // 84.6: the link between them
const RISE_E = 12.4                                // the Montgomery roof to ~93.4 (the manifest's 94)
const RISE_W = 10

// ------------------------------------------------------------------------------------------- a wall's frame

interface Fr { ox: number; oz: number; tx: number; tz: number; nx: number; nz: number; L: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const frame = (a: P2, b: P2, nx: number, nz: number): Fr => {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  return { ox: a.x, oz: a.z, tx: (b.x - a.x) / L, tz: (b.z - a.z) / L, nx, nz, L }
}
const P = (f: Fr, u: number, o: number, y: number): V3 => [f.ox + f.tx * u + f.nx * o, y, f.oz + f.tz * u + f.nz * o]
const pt = (f: Fr, u: number, o: number): P2 => ({ x: f.ox + f.tx * u + f.nx * o, z: f.oz + f.tz * u + f.nz * o })

function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}
/** A block in a frame: its face, ends, optionally lid, back and underside. */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb,
              tag = FIXED, lid = true, back = false, under = false): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], [f.nx, 0, f.nz], UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], [-f.tx, 0, -f.tz], UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], [f.tx, 0, f.tz], UV, c, tag)
  if (lid) out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (back) out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], [-f.nx, 0, -f.nz], UV, c, tag)
  if (under) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}

/** The quarter-circle from the springer to the crown of a round arch over `u0..u1`, left half. */
function semi(u0: number, u1: number, spring: number, seg: number): [number, number][] {
  const r = (u1 - u0) / 2
  const pts: [number, number][] = []
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * (Math.PI / 2)
    pts.push([u0 + r - r * Math.cos(a), spring + r * Math.sin(a)])
  }
  return pts
}
/** A round-headed opening as a solid panel: the rectangle to the springing and a fan over it. */
function roundPanel(out: MeshBuilder, f: Fr, u0: number, u1: number, y0: number, spring: number, o: number, c: Rgb, seg = 3, tag = FIXED): void {
  if (spring > y0) panel(out, f, u0, u1, o, y0, spring, c, tag)
  const L = semi(u0, u1, spring, seg)
  const m = (u0 + u1) / 2
  for (const s of [1, -1]) {
    for (let i = 0; i < seg; i++) {
      const A = s > 0 ? L[i][0] : 2 * m - L[i][0]
      const B = s > 0 ? L[i + 1][0] : 2 * m - L[i + 1][0]
      out.quad([P(f, A, o, L[i][1]), P(f, B, o, L[i + 1][1]), P(f, m, o, L[i + 1][1]), P(f, m, o, spring)], [f.nx, 0, f.nz], UV, c, tag)
    }
  }
}
/** The wall over a round arch: what of `u0..u1` × `spring..yTop` lies above it. */
function roundHead(out: MeshBuilder, f: Fr, u0: number, u1: number, spring: number, yTop: number, o: number, c: Rgb, seg = 3): void {
  const L = semi(u0, u1, spring, seg)
  const m = (u0 + u1) / 2
  for (const s of [1, -1]) {
    for (let i = 0; i < seg; i++) {
      const A = s > 0 ? L[i][0] : 2 * m - L[i][0]
      const B = s > 0 ? L[i + 1][0] : 2 * m - L[i + 1][0]
      out.quad([P(f, A, o, L[i][1]), P(f, B, o, L[i + 1][1]), P(f, B, o, yTop), P(f, A, o, yTop)], [f.nx, 0, f.nz], UV, c, T.terra)
    }
  }
}
/** A triangle facing out of the wall (a gable): quad with its apex doubled. */
function tri(out: MeshBuilder, f: Fr, a: [number, number], b: [number, number], c: [number, number], o: number, col: Rgb, tag = FIXED): void {
  out.quad([P(f, a[0], o, a[1]), P(f, b[0], o, b[1]), P(f, c[0], o, c[1]), P(f, c[0], o, c[1])], [f.nx, 0, f.nz], UV, col, tag)
}

/** A pinnacle: a square terracotta shaft and a copper spike. */
function pinnacle(out: MeshBuilder, at: P2, y0: number, h: number, w: number): void {
  const r = w * 0.7071
  prism(out, at.x, at.z, y0, y0 + h * 0.45, r, 4, TRIM, T.terra, r, false)
  prism(out, at.x, at.z, y0 + h * 0.45, y0 + h, r * 1.1, 4, COPPER, T.copper, 0, false)
}
/** A small octagonal corner turret with a copper cone, from `y0` (its corbel) up. */
function turret(out: MeshBuilder, at: P2, y0: number, y1: number, r: number): void {
  prism(out, at.x, at.z, y0 - 1.2, y0, r * 0.4, 8, TRIM, T.terra, r, false)
  prism(out, at.x, at.z, y0, y1, r, 8, TERRA, T.terra, r, false)
  prism(out, at.x, at.z, y1, y1 + 0.35, r * 1.15, 8, TRIM, T.terra, r * 1.15, false)
  prism(out, at.x, at.z, y1 + 0.35, y1 + r * 3.6, r * 1.1, 8, COPPER, T.copper, 0, false)
  prism(out, at.x, at.z, y1 + r * 3.6, y1 + r * 3.6 + 1.6, 0.06, 4, COPPER, T.copper, 0.02, false)
}

// ------------------------------------------------------------------------------------------------ a wall

interface Dress {
  y0: number
  y1: number
  /** the street fronts: the arched base, the belt course */
  street?: boolean
  /** a pavilion: its two storeys over the shaft in tall round-arched windows */
  lancets?: boolean
  /** the shaft: the corbel table at its top */
  corbel?: boolean
  /** the bay width wanted */
  bay?: number
}

const R = 0.4                // how deep the glass is set behind the wall line

/** The floor tops a wall crosses: 4.2 and 8.4 in the base storeys off the street, then a storey every 3.6 m. */
function floorTops(y0: number, y1: number): number[] {
  const ys: number[] = [4.2, ARCH, BASE]
  for (let k = 4; top(k) < y1 + 0.1; k++) ys.push(top(k))
  return ys.filter((y) => y > y0 + 0.5 && y < y1 - 0.5)
}

/**
 * One wall: recessed glass, a spandrel a storey, a mullion a bay (a pair of windows), piers proud to the wall
 * line; on the street fronts the rusticated arched base; on a pavilion the round-arched lancets; at the shaft's top
 * the corbel table.
 */
function dress(out: MeshBuilder, f: Fr, d: Dress, drop: number): void {
  const L = f.L
  const street = !!d.street
  const y0 = d.y0 <= 0.01 ? -drop : d.y0
  const wallFrom = street ? BASE : y0
  const n = Math.max(1, Math.round(L / (d.bay ?? 5.5)))
  const b = L / n
  const pw = Math.min(1.3, b * 0.24)
  panel(out, f, 0, L, -R, wallFrom, d.y1, GLASS)
  if (d.y0 > 0.01) slab(out, f, 0, L, -R, 0, y0, y0 + 0.4, SPAN, T.terra, true)   // the sill on a lower roof
  // the lancets: storeys 19 and 20 one tall round-headed window a half-bay, a single spandrel line skipped
  const lanTop = top(20)
  const lancets = !!d.lancets && d.y0 < top(19) && d.y1 > lanTop
  for (const y of floorTops(wallFrom, d.y1)) {
    if (lancets && Math.abs(y - top(19)) < 0.1) continue
    if (lancets && Math.abs(y - lanTop) < 0.1) {
      // the heads of the lancets: a round arch over each window of the pair
      for (let i = 0; i < n; i++) {
        const u0 = i * b + pw / 2
        const u1 = (i + 1) * b - pw / 2
        const m = (u0 + u1) / 2
        roundHead(out, f, u0, m - 0.32, lanTop - 0.45 - (m - 0.32 - u0) / 2, lanTop + 1.05, -0.22, TRIM, 3)
        roundHead(out, f, m + 0.32, u1, lanTop - 0.45 - (u1 - m - 0.32) / 2, lanTop + 1.05, -0.22, TRIM, 3)
      }
      continue
    }
    panel(out, f, 0, L, -0.25, y - 0.75, y + 1.05, SPAN, T.terra)
  }
  for (let i = 0; i < n; i++) {
    const m = (i + 0.5) * b
    panel(out, f, m - 0.32, m + 0.32, -0.2, wallFrom, d.y1, TERRA, T.terra)
  }
  for (let i = 0; i <= n; i++) {
    const end = i === 0 || i === n
    const half = end ? pw * 0.8 : pw / 2
    slab(out, f, Math.max(0, i * b - half), Math.min(L, i * b + half), -R, 0, wallFrom, d.y1, TERRA, T.terra, false)
  }
  if (street) streetBase(out, f, n, b, drop)
  else if (d.y0 <= 0.01) slab(out, f, 0, L, -R, 0.12, y0, 0.9, BASE_C, T.granite, true)
  if (d.corbel) corbelTable(out, f, d.y1)
}

/** The base on a street front: rusticated stone, the arches two storeys high, paired windows over, the belt. */
function streetBase(out: MeshBuilder, f: Fr, n: number, b: number, drop: number): void {
  const L = f.L
  slab(out, f, 0, L, -R, 0.3, -drop, BASE, BASE_C, T.terra, false)
  // the rustication joints
  for (let y = 0.9; y < ARCH; y += 1.05) panel(out, f, 0, L, 0.305, y, y + 0.07, JOINT, T.terra)
  slab(out, f, -0.1, L + 0.1, -R, 0.42, -drop, 0.7, [0.66, 0.62, 0.56], T.granite, true)
  for (let i = 0; i < n; i++) {
    const m = (i + 0.5) * b
    const w = Math.min(4.2, b * 0.62)
    const spring = ARCH - 0.5 - w / 2
    roundPanel(out, f, m - w / 2 - 0.35, m + w / 2 + 0.35, 0, spring, 0.315, TRIM, 4, T.terra)   // the moulded surround
    roundPanel(out, f, m - w / 2, m + w / 2, 0, spring, 0.33, DOOR, 4)
    panel(out, f, m - w / 2, m + w / 2, 0.335, 3.4, 3.65, [0.42, 0.36, 0.26])                     // the transom bar
    // the third storey: a pair of windows a bay
    for (const s of [-1, 1]) panel(out, f, m + s * 0.25, m + s * (0.25 + w * 0.36), 0.31, ARCH + 0.9, BASE - 1.0, GLASS)
  }
  // the belt course over the base, with a shadow line of corbels under it
  slab(out, f, -0.15, L + 0.15, -R, 0.6, BASE - 0.15, BASE + 0.5, TRIM, T.terra, true, false, true)
  panel(out, f, 0, L, 0.31, BASE - 0.55, BASE - 0.15, SHADE)
  slab(out, f, -0.1, L + 0.1, -R, 0.45, ARCH - 0.2, ARCH + 0.15, TRIM, T.terra, true, false, true)
}

/** The corbel table at the shaft's top: a row of little round arches on corbels, the cornice and parapet over. */
function corbelTable(out: MeshBuilder, f: Fr, y: number): void {
  const L = f.L
  const k = Math.max(4, Math.round(L / 1.6))
  const s = L / k
  slab(out, f, 0, L, -R, 0.35, y - 1.6, y, TERRA, T.terra, false, false, true)
  for (let i = 0; i < k; i++) roundPanel(out, f, i * s + 0.25, (i + 1) * s - 0.25, y - 1.5, y - 1.0 - (s - 0.5) / 2, 0.36, SHADE, 2)
  slab(out, f, -0.2, L + 0.2, -R, 0.6, y, y + 0.4, TRIM, T.terra, true, false, true)
  slab(out, f, 0, L, -0.1, 0.3, y + 0.4, y + 1.5, TERRA, T.terra, false, true)
  slab(out, f, -0.1, L + 0.1, -0.2, 0.4, y + 1.5, y + 1.75, TRIM, T.terra, true, false, true)
}

/** A parapet with coping and copper cresting (the link and the pavilions' flat tops). */
function cresting(out: MeshBuilder, f: Fr, y: number, h: number): void {
  const L = f.L
  slab(out, f, -0.05, L + 0.05, -0.08, 0.08, y + h - 0.12, y + h, COPPER, T.copper, true, true)
  const k = Math.max(2, Math.round(L / 1.4))
  for (let i = 0; i <= k; i++) {
    const u = (i / k) * L
    slab(out, f, u - 0.05, u + 0.05, -0.05, 0.05, y, y + h + (i % 2 ? 0 : 0.45), COPPER, T.copper, true)
  }
}

// ------------------------------------------------------------------------------------------- the roofs

/**
 * A château roof over a rectangle given by its four eave corners (anticlockwise from above is not needed): steep
 * hips to a small flat top, the flat fenced in cresting, a finial at each corner of it.
 */
function chateau(out: MeshBuilder, c: P2[], y0: number, rise: number, flat: number): void {
  const cx = (c[0].x + c[2].x) / 2
  const cz = (c[0].z + c[2].z) / 2
  const a = Math.hypot(c[1].x - c[0].x, c[1].z - c[0].z)
  const bb = Math.hypot(c[2].x - c[1].x, c[2].z - c[1].z)
  const inset = Math.min(a, bb) / 2 - flat
  const inner = c.map((p): P2 => {
    // move each corner in by `inset` along both edges at it (the box is a rectangle)
    const dx = cx - p.x
    const dz = cz - p.z
    const ex = (c[1].x - c[0].x) / a
    const ez = (c[1].z - c[0].z) / a
    const fx = (c[2].x - c[1].x) / bb
    const fz = (c[2].z - c[1].z) / bb
    const s1 = Math.sign(dx * ex + dz * ez)
    const s2 = Math.sign(dx * fx + dz * fz)
    return { x: p.x + ex * inset * s1 + fx * inset * s2, z: p.z + ez * inset * s1 + fz * inset * s2 }
  })
  const y1 = y0 + rise
  for (let i = 0; i < 4; i++) {
    const p = c[i]
    const q = c[(i + 1) % 4]
    const mx = (p.x + q.x) / 2 - cx
    const mz = (p.z + q.z) / 2 - cz
    // outward horizontal normal of the edge, tilted up by the pitch
    const ex = q.x - p.x
    const ez = q.z - p.z
    let nx = ez
    let nz = -ex
    if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz }
    const nl = Math.hypot(nx, nz)
    const h = Math.hypot(rise, inset)
    const n: V3 = [(nx / nl) * (rise / h), inset / h, (nz / nl) * (rise / h)]
    out.quad([[p.x, y0, p.z], [q.x, y0, q.z], [inner[(i + 1) % 4].x, y1, inner[(i + 1) % 4].z], [inner[i].x, y1, inner[i].z]], n, UV, ROOF, T.tile)
  }
  out.quad(inner.map((p): V3 => [p.x, y1, p.z]), [0, 1, 0], UV, FLAT, T.tile)
  // the cresting round the flat and the finials at its corners
  for (let i = 0; i < 4; i++) {
    const p = inner[i]
    const q = inner[(i + 1) % 4]
    const mx = (p.x + q.x) / 2 - cx
    const mz = (p.z + q.z) / 2 - cz
    const L = Math.hypot(q.x - p.x, q.z - p.z) || 1
    let nx = (q.z - p.z) / L
    let nz = -(q.x - p.x) / L
    if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz }
    cresting(out, frame(p, q, nx, nz), y1, 1.1)
    prism(out, p.x, p.z, y1, y1 + 1.6, 0.32, 4, COPPER, T.copper, 0.22, true)
    prism(out, p.x, p.z, y1 + 1.6, y1 + 4.8, 0.24, 4, COPPER, T.copper, 0, false)
  }
}

/**
 * A gabled wall dormer: the wall carried up `h` past the eaves, `w` wide, with a window, then a steep gable with
 * a coping and a copper finial. Drawn on the wall frame `f`, centred at `m`.
 */
function wallDormer(out: MeshBuilder, f: Fr, m: number, w: number, eave: number, h: number, g: number): void {
  const u0 = m - w / 2
  const u1 = m + w / 2
  slab(out, f, u0, u1, -3.2, 0.15, eave - 0.3, eave + h, TERRA, T.terra, false, false)
  // the gable, front and back, and its two sloping copings
  tri(out, f, [u0, eave + h], [u1, eave + h], [m, eave + h + g], 0.15, TERRA, T.terra)
  const back = { ...f, nx: -f.nx, nz: -f.nz }
  out.quad([P(f, u0, -3.2, eave + h), P(f, u1, -3.2, eave + h), P(f, m, -3.2, eave + h + g), P(f, m, -3.2, eave + h + g)],
    [back.nx, 0, back.nz], UV, TERRA, T.terra)
  for (const s of [-1, 1]) {
    const ue = s < 0 ? u0 - 0.25 : u1 + 0.25
    const nh = Math.hypot(g, w / 2)
    const n: V3 = [0, (w / 2) / nh, 0]
    const tilt = (g / nh) * s
    n[0] = f.tx * tilt
    n[2] = f.tz * tilt
    out.quad([P(f, ue, 0.35, eave + h - 0.15), P(f, m, 0.35, eave + h + g + 0.2), P(f, m, -3.4, eave + h + g + 0.2), P(f, ue, -3.4, eave + h - 0.15)],
      n, UV, ROOF, T.tile)
  }
  // the windows: a round-headed pair in the dormer's storey, a small one in the gable
  const ww = Math.min(1.5, w * 0.24)
  roundPanel(out, f, m - 0.2 - ww, m - 0.2, eave + 0.6, eave + h - 0.9 - ww / 2, 0.17, GLASS, 2)
  roundPanel(out, f, m + 0.2, m + 0.2 + ww, eave + 0.6, eave + h - 0.9 - ww / 2, 0.17, GLASS, 2)
  roundPanel(out, f, m - 0.5, m + 0.5, eave + h + 0.6, eave + h + g * 0.45, 0.17, GLASS, 2)
  slab(out, f, u0 - 0.15, u1 + 0.15, -0.1, 0.35, eave + h - 0.35, eave + h, TRIM, T.terra, true, false, true)
  const tip = pt(f, m, 0)
  prism(out, tip.x, tip.z, eave + h + g, eave + h + g + 2.6, 0.2, 4, COPPER, T.copper, 0, false)
  pinnacle(out, pt(f, u0 - 0.1, 0.1), eave + h - 0.2, 2.6, 0.5)
  pinnacle(out, pt(f, u1 + 0.1, 0.1), eave + h - 0.2, 2.6, 0.5)
}

/** A small gabled dormer on a roof slope: the eave line's frame `f`, `inset` the roof's horizontal run. */
function slopeDormer(out: MeshBuilder, f: Fr, m: number, eave: number, rise: number, inset: number): void {
  const k = rise / inset
  const o0 = -1.2                  // the dormer's face, behind the eaves
  const yb = eave + 1.2 * k
  const w = 1.0
  const h = 2.0
  const back = -1.2 - Math.min(3, (h + 0.8) / k + 0.5)
  slab(out, f, m - w, m + w, back, o0, yb - 0.5, yb + h, COPPER, T.copper, false)
  panel(out, f, m - w + 0.3, m + w - 0.3, o0 + 0.01, yb, yb + h - 0.3, GLASS)
  tri(out, f, [m - w - 0.15, yb + h], [m + w + 0.15, yb + h], [m, yb + h + 1.3], o0, COPPER, T.copper)
  for (const s of [-1, 1]) {
    const ue = m + s * (w + 0.15)
    const nh = Math.hypot(1.3, w)
    const n: V3 = [f.tx * (1.3 / nh) * s, w / nh, f.tz * (1.3 / nh) * s]
    out.quad([P(f, ue, o0 + 0.1, yb + h), P(f, m, o0 + 0.1, yb + h + 1.3), P(f, m, back, yb + h + 1.3), P(f, ue, back, yb + h)], n, UV, COPPER, T.copper)
  }
}

// ------------------------------------------------------------------------------------------- the building

function hunterDulinBuilding(out: MeshBuilder, fit: Fit): void {
  const ring = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const xs = ring.map((p) => p.x)
  const zs = ring.map((p) => p.z)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const z0 = Math.min(...zs)
  const z1 = Math.max(...zs)
  // (u, d): u along Sutter from its west end (+x) to Montgomery (−x), d back from Sutter (+z) towards Bush
  const W = x1 - x0
  const D = z1 - z0
  const at = (u: number, d: number): P2 => ({ x: x1 - u, z: z1 - d })
  /** The four walls of the box [u0,u1]×[d0,d1], each framed u along it with its normal out. */
  const walls = (u0: number, u1: number, d0: number, d1: number) => ({
    sutter: frame(at(u0, d0), at(u1, d0), 0, 1),
    east: frame(at(u1, d0), at(u1, d1), -1, 0),
    north: frame(at(u1, d1), at(u0, d1), 0, -1),
    west: frame(at(u0, d1), at(u0, d0), 1, 0),
  })
  const corners = (u0: number, u1: number, d0: number, d1: number): P2[] => [at(u0, d0), at(u1, d0), at(u1, d1), at(u0, d1)]

  // the street datum: the city sinks a model to its lowest ground; the Sutter pavement at the door
  const door = at(W * 0.45, -2)
  const drop = fit.groundAt ? Math.max(0, Math.min(6, fit.groundAt(door.x, door.z))) : 0
  const v0 = out.positions.length

  // the shaft: the whole lot to the eighteenth storey
  const S = walls(0, W, 0, D)
  dress(out, S.sutter, { y0: 0, y1: SHAFT, street: true, corbel: true }, drop)
  dress(out, S.east, { y0: 0, y1: SHAFT, street: true, corbel: true }, drop)
  dress(out, S.north, { y0: 0, y1: SHAFT, corbel: true }, drop)
  dress(out, S.west, { y0: 0, y1: SHAFT, corbel: true }, drop)
  out.quad(corners(0, W, 0, D).map((p): V3 => [p.x, SHAFT + 0.4, p.z]), [0, 1, 0], UV, FLAT, T.terra)
  for (const [u, d] of [[0, 0], [W, 0], [W, D], [0, D]] as const) {
    turret(out, at(u + (u ? -0.2 : 0.2), d + (d ? -0.2 : 0.2)), SHAFT - 2.2, SHAFT + 2.2, 0.85)
  }

  // the crown, set back from the shaft's faces
  const sb = 1.6
  const PE = Math.min(18, W * 0.36)                    // the Montgomery pavilion's width along Sutter
  const PW = Math.min(14, W * 0.28)                    // the west pavilion's
  const eu0 = W - sb - PE
  const eu1 = W - sb
  const E = walls(eu0, eu1, sb, D - sb)
  const wu0 = sb
  const wu1 = sb + PW
  const wd0 = sb + 1.4
  const wd1 = D - sb - 1.4
  const Wp = walls(wu0, wu1, wd0, wd1)
  const lu0 = wu1
  const lu1 = eu0
  const ld0 = sb + 3.4
  const ld1 = D - sb - 3.4
  const Lk = walls(lu0, lu1, ld0, ld1)

  // the Montgomery pavilion: its two street faces with lancets, the rear plainer; its west face shows over the link
  for (const [f, lan] of [[E.sutter, true], [E.east, true], [E.north, false], [E.west, false]] as const) {
    dress(out, f, { y0: SHAFT, y1: EAVE_E, lancets: lan, bay: 4.6 }, drop)
    slab(out, f, -0.2, f.L + 0.2, -R, 0.55, EAVE_E - 0.6, EAVE_E, TRIM, T.terra, false, false, true)
  }
  chateau(out, corners(eu0 - 0.6, eu1 + 0.6, sb - 0.6, D - sb + 0.6), EAVE_E, RISE_E, 1.6)
  wallDormer(out, E.sutter, E.sutter.L / 2, Math.min(8, E.sutter.L * 0.46), EAVE_E, 4, 6.5)
  wallDormer(out, E.east, E.east.L / 2, 8.5, EAVE_E, 4, 6.5)
  const inE = Math.min(PE, D - 2 * sb) / 2 + 0.6 - 1.6
  for (const m of [0.3, 0.7]) slopeDormer(out, E.north, E.north.L * m, EAVE_E, RISE_E, inE)
  for (const m of [0.22, 0.78]) slopeDormer(out, E.east, E.east.L * m, EAVE_E, RISE_E, inE)
  for (const [u, d] of [[eu0, sb], [eu1, sb], [eu1, D - sb], [eu0, D - sb]] as const) pinnacle(out, at(u, d), EAVE_E, 4.2, 0.9)

  // the west pavilion, a storey lower
  for (const [f, lan] of [[Wp.sutter, true], [Wp.east, false], [Wp.north, false], [Wp.west, true]] as const) {
    dress(out, f, { y0: SHAFT, y1: EAVE_W, lancets: lan, bay: 4.6 }, drop)
    slab(out, f, -0.2, f.L + 0.2, -R, 0.55, EAVE_W - 0.6, EAVE_W, TRIM, T.terra, false, false, true)
  }
  chateau(out, corners(wu0 - 0.6, wu1 + 0.6, wd0 - 0.6, wd1 + 0.6), EAVE_W, RISE_W, 1.4)
  wallDormer(out, Wp.sutter, Wp.sutter.L / 2, Math.min(7, Wp.sutter.L * 0.5), EAVE_W, 3.6, 5)
  wallDormer(out, Wp.west, Wp.west.L / 2, 7.5, EAVE_W, 3.6, 5)
  const inW = Math.min(PW, wd1 - wd0) / 2 + 0.6 - 1.4
  for (const m of [0.3, 0.7]) slopeDormer(out, Wp.north, Wp.north.L * m, EAVE_W, RISE_W, inW)
  for (const [u, d] of [[wu0, wd0], [wu1, wd0], [wu1, wd1], [wu0, wd1]] as const) pinnacle(out, at(u, d), EAVE_W, 3.8, 0.85)

  // the link between them: taller than the pavilions' eaves, flat-roofed, fenced in cresting
  for (const f of [Lk.sutter, Lk.north]) {
    dress(out, f, { y0: SHAFT, y1: LINK, bay: 4.4 }, drop)
    slab(out, f, -0.2, f.L + 0.2, -R, 0.45, LINK - 0.5, LINK, TRIM, T.terra, false, false, true)
    slab(out, f, 0, f.L, -0.3, 0.1, LINK, LINK + 0.9, TERRA, T.terra, true, true)
    cresting(out, f, LINK + 0.9, 1.0)
  }
  for (const f of [Lk.east, Lk.west]) {
    // the link's ends show only above the pavilions' eaves
    panel(out, f, 0, f.L, 0, SHAFT, LINK + 0.9, TERRA, T.terra)
  }
  out.quad(corners(lu0, lu1, ld0, ld1).map((p): V3 => [p.x, LINK + 0.1, p.z]), [0, 1, 0], UV, FLAT, T.terra)
  // the water tank / penthouse on the link's roof, the flagpole
  const pc = at((lu0 + lu1) / 2, (ld0 + ld1) / 2)
  prism(out, pc.x, pc.z, LINK, LINK + 3.2, 2.2, 4, TERRA, T.terra, 2.2, true)
  prism(out, pc.x, pc.z, LINK + 3.2, LINK + 13, 0.08, 6, [0.86, 0.86, 0.84], FIXED, 0.05, false)

  if (drop > 0) for (let k = v0 + 1; k < out.positions.length; k += 3) out.positions[k] += drop
}

export const HUNTER_DULIN: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/942664247 — the Hunter-Dulin Building, 111 Sutter Street. */
  hunterDulinBuilding,
}
