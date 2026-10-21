/**
 * The Russ Building, 235 Montgomery Street (George W. Kelham, 1927): buff terracotta Gothic, 31 storeys, the
 * city's tallest building until 1964. From the Commons photographs "RussBuildingWithItsTopInSanFrancisco.jpg" and
 * "Russ Building front 1.JPG" (looking up the Montgomery front), "Russ Building San Francisco May 2014.jpg" (an
 * aerial from the west, the crown and the rear wings), and the Mapillary frames from Montgomery and Kearny
 * (2026-10-21).
 *
 * What the photographs show:
 *  - "a full block of Gothic masonry that ascends in jagged stages from Montgomery Street" (John King): the whole
 *    Montgomery front rises flush from the pavement; its ENDS stop at ~22 storeys, FLANKS either side of the middle
 *    go on to ~26, and the central TOWER, its face still flush with the street, to 31;
 *  - behind the Montgomery bar the plan is an E: three WINGS run back to the rear of the lot with two LIGHT COURTS
 *    between them, open to the west, their floors over a two-storey podium that fills the lot;
 *  - every face is the same grammar: continuous vertical PIERS a bay apart, a pair of windows a bay a storey with a
 *    thin mullion between, recessed SPANDRELS; at the top storey of every stage a POINTED ARCH heads each bay, a
 *    corbelled PARAPET over it, PINNACLES on the piers;
 *  - the tower's CROWN: its top two storeys in tall pointed lancets, a tall parapet in blind Gothic arcading, a
 *    pinnacle on every pier, corner turrets, the flagpole;
 *  - an arcaded Gothic ENTRANCE in the middle of the Montgomery front: three pointed arches, the middle one taller.
 *
 * The frame: the real outline. The Montgomery front is its longest edge; the massing is a height field laid over
 * the outline in that edge's frame (u along the front, d back from it), so the notch OSM draws at the rear simply
 * drops out of the wings, and every wall — street fronts, court walls, setbacks — is found where two cells of
 * different heights meet and dressed by the one grammar.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const T = { terra: surfaceTag('terracotta'), granite: surfaceTag('granite'), metal: surfaceTag('metal') }

// the warm buff terracotta of the photographs; the spandrels a shade darker, the trim a shade paler
const TERRA: Rgb = [0.84, 0.78, 0.66]
const SPAN: Rgb = [0.7, 0.64, 0.54]
const TRIM: Rgb = [0.89, 0.84, 0.73]
const SHADE: Rgb = [0.42, 0.39, 0.34]
const GLASS: Rgb = [0.17, 0.19, 0.22]
const DOOR: Rgb = [0.12, 0.12, 0.13]
const GRANITE: Rgb = [0.64, 0.62, 0.58]
const ROOF: Rgb = [0.55, 0.52, 0.48]

/** Floors: the ground storey 6 m, the rest 3.9 m; `top(k)` is the top of floor k. */
const top = (k: number): number => 6 + 3.9 * (k - 1)
const PODIUM = top(2)   // 9.9: the two storeys that fill the lot, the courts over them
const ENDS = top(22)    // 87.9: the ends of the Montgomery bar and the outer wings
const WING = top(24)    // 95.7: the middle wing
const FLANK = top(26)   // 103.5: the flanks of the tower
const TOWER = top(31)   // 123: the tower's roof
const CROWN = 127.4     // the crown's parapet
const SPIRE = 132.6     // the pinnacles' tips

// ------------------------------------------------------------------------------------------- an edge's frame

interface Fr { ox: number; oz: number; tx: number; tz: number; nx: number; nz: number; L: number }
const frameOf = (a: P2, b: P2): Fr => {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { ox: a.x, oz: a.z, tx, tz, nx: tz, nz: -tx, L }
}
const P = (f: Fr, u: number, o: number, y: number): [number, number, number] =>
  [f.ox + f.tx * u + f.nx * o, y, f.oz + f.tz * u + f.nz * o]
const pt = (f: Fr, u: number, o: number): P2 => ({ x: f.ox + f.tx * u + f.nx * o, z: f.oz + f.tz * u + f.nz * o })
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A flat rectangle facing out of the wall, `o` metres proud of it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}
/** A block in a frame (`top` false leaves its lid off, `back` adds the face into the wall). */
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

/**
 * The points of a pointed (two-centred) arch over `u0..u1` springing at `spring`, `rise` high: each half an arc of
 * radius equal to the span (equilateral), scaled to the rise. Left half, springer to apex.
 */
function archHalf(u0: number, u1: number, spring: number, rise: number, seg: number): [number, number][] {
  const w = u1 - u0
  const th = Math.acos(0.5)
  const k = rise / (w * Math.sin(th))
  const pts: [number, number][] = []
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * th
    pts.push([u0 + w - w * Math.cos(a), spring + w * Math.sin(a) * k])
  }
  return pts
}

/** The wall over a pointed arch: what of the rectangle `u0..u1` × `spring..yTop` lies above the arch. */
function archHead(out: MeshBuilder, f: Fr, u0: number, u1: number, spring: number, rise: number, yTop: number, o: number, c: Rgb, seg = 3): void {
  const L = archHalf(u0, u1, spring, rise, seg)
  const m = (u0 + u1) / 2
  for (const side of [1, -1]) {
    for (let i = 0; i < seg; i++) {
      const [ua, ya] = L[i]
      const [ub, yb] = L[i + 1]
      const A = side > 0 ? ua : 2 * m - ua
      const B = side > 0 ? ub : 2 * m - ub
      out.quad([P(f, A, o, ya), P(f, B, o, yb), P(f, B, o, yTop), P(f, A, o, yTop)], [f.nx, 0, f.nz], UV, c, FIXED)
    }
  }
}

/** A pointed opening as a solid panel: the rectangle to the springing, the arch over it (a fan from its middle). */
function pointedPanel(out: MeshBuilder, f: Fr, u0: number, u1: number, y0: number, spring: number, rise: number, o: number, c: Rgb, seg = 3): void {
  if (spring > y0) panel(out, f, u0, u1, o, y0, spring, c)
  const L = archHalf(u0, u1, spring, rise, seg)
  const m = (u0 + u1) / 2
  for (const side of [1, -1]) {
    for (let i = 0; i < seg; i++) {
      const [ua, ya] = L[i]
      const [ub, yb] = L[i + 1]
      const A = side > 0 ? ua : 2 * m - ua
      const B = side > 0 ? ub : 2 * m - ub
      out.quad([P(f, A, o, ya), P(f, B, o, yb), P(f, m, o, yb), P(f, m, o, spring)], [f.nx, 0, f.nz], UV, c, FIXED)
    }
  }
}

/** A Gothic pinnacle at `at`: a square shaft and a tall four-sided spirelet (16 triangles). */
function pinnacle(out: MeshBuilder, at: P2, y0: number, h: number, w: number, c: Rgb): void {
  const r = w * 0.7071
  prism(out, at.x, at.z, y0, y0 + h * 0.4, r, 4, c, T.terra, r, false)
  prism(out, at.x, at.z, y0 + h * 0.4, y0 + h, r * 1.15, 4, c, T.terra, 0, false)
}

// ------------------------------------------------------------------------------------------------ a wall

interface Wall { f: Fr; y0: number; y1: number; front: boolean }

/** The bays of a wall `L` long: `n` of them between piers. */
const baysOf = (L: number): number => Math.max(1, Math.round(L / 4.3))

/**
 * One wall of the height field, dressed: the recessed glass, a spandrel a floor, the piers proud to the wall line,
 * a mullion a bay, the pointed arch heads of the top storey, the corbel course and the parapet, pinnacles. A wall
 * that reaches the street gets the granite plinth and the belt course over the podium storeys; the tower's walls
 * get the crown.
 */
function dress(out: MeshBuilder, w: Wall, drop: number): void {
  const { f, y1 } = w
  const L = f.L
  const street = w.y0 <= 0.01
  const y0 = street ? -drop : w.y0
  const crown = y1 >= TOWER - 0.1
  const R = 0.45                                       // how deep the glass is set behind the wall line
  if (L < 2.5) { panel(out, f, 0, L, 0, y0, y1, TERRA, T.terra); parapet(out, f, 0, L, y1, 1.3); return }
  panel(out, f, 0, L, -R, y0, y1, GLASS)
  // the sill that closes the recess where the wall stands on a lower roof
  if (!street) slab(out, f, 0, L, -R, 0, y0, y0 + 0.35, SPAN, T.terra, true, false)
  const n = baysOf(L)
  const b = L / n
  const pw = Math.min(1.15, b * 0.27)
  // the top storey's arch heads: over the top floor, or the top two on the tower (its tall lancets)
  const headTop = y1
  const rise = crown ? Math.min(2.6, (b - pw) * 0.75) : Math.min(1.4, (b - pw) * 0.45)
  const spring = crown ? y1 - 0.7 - rise : y1 - 0.4 - rise
  // the spandrels a floor, a band across the whole wall behind the piers (none inside the crown's lancets)
  for (let k = 1; k <= 31; k++) {
    const y = top(k)
    if (y <= y0 + 0.5 || y >= y1 - 0.5) continue
    if (crown && y > y1 - 3.9 * 2 - 0.1) continue
    panel(out, f, 0, L, -0.28, y - 0.25, y + 1.45, SPAN, T.terra)
  }
  for (let i = 0; i < n; i++) {
    const u0 = i * b + pw / 2
    const u1 = (i + 1) * b - pw / 2
    const m = (u0 + u1) / 2
    // the mullion between the pair of windows
    panel(out, f, m - 0.3, m + 0.3, -0.18, street ? 6 : y0, spring + rise * 0.9, TERRA, T.terra)
    archHead(out, f, u0, u1, spring, rise, headTop, -0.2, TRIM, crown ? 3 : 2)
  }
  // the piers: proud to the wall line, the corners broader
  for (let i = 0; i <= n; i++) {
    const end = i === 0 || i === n
    const half = end ? pw * 0.75 : pw / 2
    const u0 = Math.max(0, i * b - half)
    const u1 = Math.min(L, i * b + half)
    slab(out, f, u0, u1, -R, 0, y0, y1, TERRA, T.terra, false)
  }
  if (street) {
    // the granite plinth and the belt course over the podium storeys
    slab(out, f, 0, L, -R, 0.15, -drop, 0.9, GRANITE, T.granite, true)
    slab(out, f, -0.1, L + 0.1, -R, 0.25, PODIUM, PODIUM + 0.55, TRIM, T.terra, true, false, true)
  }
  // the corbel course, the parapet, the pinnacles
  slab(out, f, -0.1, L + 0.1, -R, 0.22, y1 - 0.45, y1, TRIM, T.terra, false, false, true)
  if (crown) {
    crownParapet(out, f, n, b, pw)
  } else {
    parapet(out, f, 0, L, y1, 1.3)
    for (let i = 0; i < n; i += 2) pinnacle(out, pt(f, i * b + (i === 0 ? 0.3 : 0), -0.1), y1 + 1.3, 3.2, 0.7, TRIM)
  }
}

/** A plain parapet with its coping, its back showing to the roof. */
function parapet(out: MeshBuilder, f: Fr, u0: number, u1: number, y: number, h: number): void {
  slab(out, f, u0, u1, -0.45, 0.05, y, y + h, TERRA, T.terra, false, true)
  slab(out, f, u0 - 0.1, u1 + 0.1, -0.55, 0.15, y + h, y + h + 0.2, TRIM, T.terra, true, false, true)
}

/** The tower's crown parapet: blind pointed arcading a bay, a pinnacle on every pier, a turret at each corner. */
function crownParapet(out: MeshBuilder, f: Fr, n: number, b: number, pw: number): void {
  const L = f.L
  const h = CROWN - TOWER
  slab(out, f, 0, L, -0.45, 0.05, TOWER, CROWN, TERRA, T.terra, false, true)
  slab(out, f, -0.1, L + 0.1, -0.55, 0.15, CROWN, CROWN + 0.25, TRIM, T.terra, true, false, true)
  for (let i = 0; i < n; i++) {
    const u0 = i * b + pw / 2 + 0.25
    const u1 = (i + 1) * b - pw / 2 - 0.25
    pointedPanel(out, f, u0, u1, TOWER + 0.7, TOWER + h * 0.45, Math.min(1.8, (u1 - u0) * 0.8), 0.07, SHADE, 2)
  }
  for (let i = 1; i < n; i++) pinnacle(out, pt(f, i * b, -0.05), CROWN + 0.25, SPIRE - CROWN - 0.25, 0.75, TRIM)
  // the corner turret (the other corner is the next wall's)
  const c = pt(f, 0.5, -0.5)
  prism(out, c.x, c.z, TOWER, CROWN + 1.6, 1.1, 8, TERRA, T.terra, 1.1, false)
  prism(out, c.x, c.z, CROWN + 1.6, CROWN + 1.9, 1.3, 8, TRIM, T.terra, 1.3, true)
  prism(out, c.x, c.z, CROWN + 1.9, SPIRE + 1.2, 1.05, 8, TRIM, T.terra, 0, false)
}

// ------------------------------------------------------------------------------------------- the building

function inside(ring: P2[], p: P2): boolean {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a.z > p.z) !== (b.z > p.z) && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) c = !c
  }
  return c
}

const uniq = (xs: number[]): number[] => {
  const s = [...xs].sort((a, b) => a - b)
  const r: number[] = []
  for (const x of s) if (!r.length || x - r[r.length - 1] > 0.4) r.push(x)
  return r
}

function russBuilding(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const ring = simplifyRing(area >= 0 ? raw : [...raw].reverse(), 0.5)
  // the Montgomery front: the longest edge
  let fi = 0
  let best = 0
  for (let i = 0; i < ring.length; i++) {
    const L = frameOf(ring[i], ring[(i + 1) % ring.length]).L
    if (L > best) { best = L; fi = i }
  }
  const F = frameOf(ring[fi], ring[(fi + 1) % ring.length])
  const W = F.L
  const um = W / 2
  // (u, d) → the model frame: u along the front, d back from it
  const at = (u: number, d: number): P2 => pt(F, u, -d)
  let dMax = 0
  const us: number[] = []
  const ds: number[] = []
  for (const p of ring) {
    const u = (p.x - F.ox) * F.tx + (p.z - F.oz) * F.tz
    const d = -((p.x - F.ox) * F.nx + (p.z - F.oz) * F.nz)
    us.push(u)
    ds.push(d)
    dMax = Math.max(dMax, d)
  }
  // the massing, from the photographs, scaled to the lot
  const tw = Math.max(10, Math.min(16, 0.18 * W))         // the tower's half-width
  const fw = tw + Math.min(7, 0.09 * W)                    // the flanks'
  const cw = Math.min(9.5, 0.11 * W)                      // the middle wing's
  const cc = Math.min(23.5, 0.28 * W)                     // the courts' outer sides
  const barD = Math.min(20, 0.44 * dMax)
  const towerD = Math.min(27, 0.6 * dMax)
  const flankD = towerD - 2.5
  const heightAt = (u: number, d: number): number => {
    const a = Math.abs(u - um)
    if (a <= tw && d <= towerD) return TOWER
    if (a <= fw && d <= flankD) return FLANK
    if (d <= barD) return ENDS
    if (a <= cw) return WING
    if (a >= cc) return ENDS
    return PODIUM
  }
  const ub = uniq([...us, ...[tw, fw, cw, cc].flatMap((x) => [um - x, um + x])])
  const db = uniq([...ds, barD, towerD, flankD])
  const nu = ub.length - 1
  const nd = db.length - 1
  const H: number[][] = []
  for (let i = 0; i < nu; i++) {
    H.push([])
    for (let j = 0; j < nd; j++) {
      const u = (ub[i] + ub[i + 1]) / 2
      const d = (db[j] + db[j + 1]) / 2
      H[i].push(inside(ring, at(u, d)) ? heightAt(u, d) : 0)
    }
  }
  const h = (i: number, j: number): number => (i < 0 || j < 0 || i >= nu || j >= nd ? 0 : H[i][j])

  // the street datum: the city sinks a model to its lowest ground; Montgomery's pavement at the door
  const door = at(um, -2)
  const drop = fit.groundAt ? Math.max(0, Math.min(6, fit.groundAt(door.x, door.z))) : 0
  const v0 = out.positions.length

  // the walls: wherever a cell stands over its neighbour, merged along a line where they run on at one height
  type Seg = { key: string; a: number; b: number; y0: number; y1: number; dir: number; line: number }
  const segs: Seg[] = []
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nd; j++) {
      const y1 = H[i][j]
      if (y1 <= 0) continue
      const nb: [number, number, number, number][] = [
        // [neighbour i, j, direction (0 front −d, 1 back +d, 2 −u, 3 +u), line]
        [i, j - 1, 0, db[j]], [i, j + 1, 1, db[j + 1]], [i - 1, j, 2, ub[i]], [i + 1, j, 3, ub[i + 1]],
      ]
      for (const [ni, nj, dir, line] of nb) {
        const y0 = h(ni, nj)
        if (y0 >= y1) continue
        const along = dir < 2 ? [ub[i], ub[i + 1]] : [db[j], db[j + 1]]
        segs.push({ key: `${dir}:${line.toFixed(2)}:${y0}:${y1}`, a: along[0], b: along[1], y0, y1, dir, line })
      }
    }
  }
  segs.sort((p, q) => (p.key < q.key ? -1 : p.key > q.key ? 1 : p.a - q.a))
  const walls: Seg[] = []
  for (const s of segs) {
    const last = walls[walls.length - 1]
    if (last && last.key === s.key && Math.abs(last.b - s.a) < 0.05) last.b = s.b
    else walls.push({ ...s })
  }
  for (const s of walls) {
    // the wall's two ends in the model frame, ordered so its frame's normal faces out of the taller cell
    let A: P2
    let B: P2
    if (s.dir === 0) { A = at(s.a, s.line); B = at(s.b, s.line) }        // facing the street: along +u
    else if (s.dir === 1) { A = at(s.b, s.line); B = at(s.a, s.line) }
    else if (s.dir === 2) { A = at(s.line, s.b); B = at(s.line, s.a) }
    else { A = at(s.line, s.a); B = at(s.line, s.b) }
    let f = frameOf(A, B)
    const want = s.dir === 0 ? [F.nx, F.nz] : s.dir === 1 ? [-F.nx, -F.nz] : s.dir === 2 ? [-F.tx, -F.tz] : [F.tx, F.tz]
    if (f.nx * want[0] + f.nz * want[1] < 0) f = frameOf(B, A)
    dress(out, { f, y0: s.y0, y1: s.y1, front: s.dir === 0 && s.line < 0.5 }, drop)
  }
  // the roofs, cell by cell
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nd; j++) {
      const y = H[i][j]
      if (y <= 0) continue
      const q = [at(ub[i], db[j]), at(ub[i + 1], db[j]), at(ub[i + 1], db[j + 1]), at(ub[i], db[j + 1])]
      out.quad(q.map((p) => [p.x, y, p.z] as [number, number, number]), [0, 1, 0], UV, ROOF, T.terra)
    }
  }

  // the entrance: an arcaded Gothic frontispiece in the middle of the Montgomery front, three pointed arches
  const E = 7.6
  slab(out, F, um - E, um + E, -0.2, 0.55, -drop, PODIUM + 0.9, TERRA, T.terra, true)
  slab(out, F, um - E - 0.1, um + E + 0.1, -0.2, 0.75, PODIUM + 0.9, PODIUM + 1.4, TRIM, T.terra, true, false, true)
  slab(out, F, um - E - 0.05, um + E + 0.05, -0.2, 0.7, -drop, 0.9, GRANITE, T.granite, true)
  const arches: [number, number, number][] = [[um - 4.9, 2.6, 5.4], [um, 4.4, 6.6], [um + 4.9, 2.6, 5.4]]
  for (const [m, w, spring] of arches) {
    const rise = w * 0.8
    pointedPanel(out, F, m - w / 2 - 0.35, m + w / 2 + 0.35, 0, spring, rise + 0.45, 0.57, TRIM, 3)
    pointedPanel(out, F, m - w / 2, m + w / 2, 0, spring, rise, 0.59, DOOR, 3)
    // the transom bar and the tracery mullion in the arch head
    panel(out, F, m - w / 2, m + w / 2, 0.6, spring - 1.1, spring - 0.9, TRIM)
    panel(out, F, m - 0.07, m + 0.07, 0.6, spring - 0.9, spring + rise * 0.85, TRIM)
  }
  for (const m of [um - E, um - 2.45, um + 2.45, um + E]) {
    pinnacle(out, pt(F, Math.min(um + E - 0.35, Math.max(um - E + 0.35, m)), 0.25), PODIUM + 1.4, 3.4, 0.7, TRIM)
  }

  // the flagpole over the crown
  const fp = at(um, towerD / 2)
  prism(out, fp.x, fp.z, TOWER, SPIRE + 7, 0.09, 6, [0.86, 0.86, 0.84], T.metal, 0.05)

  if (drop > 0) for (let k = v0 + 1; k < out.positions.length; k += 3) out.positions[k] += drop
}

export const RUSS_BUILDING: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/129142347 — the Russ Building, 235 Montgomery Street. */
  russBuilding,
}
