/**
 * The de Young (Chronicle) Building, 690 Market Street at Kearny and Geary, facing Lotta's Fountain (Burnham &
 * Root, 1890; two floors and a Kearny annex added 1905; rebuilt by Willis Polk after 1906; its 1962 aluminium skin
 * stripped and the masonry restored in 2004-07, when the Ritz-Carlton Club and Residences tower was raised on it).
 *
 * NO CLOCK TOWER: the 1890 wooden clock tower (to 218 ft = 66 m, which is the OSM `height`) was set alight by
 * fireworks in 1905 and taken down (Wikipedia, "de Young Building"). Every photograph of the building as it stands
 * — the six Mapillary frames in p4/refs/way-32946675 and Commons "Ritz-Carlton Club and Residences, San Francisco
 * 2021.jpg", taken from Lotta's Fountain — shows the corner topped by the beige 2007 tower instead, 24 floors and
 * 95 m to the roof. This is the building as it stands.
 *
 * What the photographs show, from the pavement:
 *  - a base two storeys high of red-brown ROCK-FACED SANDSTONE (big shop windows, a round-arched entrance on the
 *    short canted bay between the corner face and Market), closed by a sandstone string course;
 *  - two floors of red brick with paired windows, a second course;
 *  - the ARCADE: four floors framed by brick piers, the windows of each bay in two or three lights between
 *    spandrel panels, the fourth floor under a ROUND ARCH with a sandstone archivolt — two arches on the corner
 *    face toward the fountain, five along Market, more down Kearny;
 *  - a floor of paired windows under a course, the two 1905 floors of triple windows, and a thin green copper
 *    cornice;
 *  - on the canted bay: a balcony over the entrance and two ornamented sandstone strips with carved panels up to
 *    a small arch;
 *  - over it all the Ritz-Carlton tower in beige render, drawn in a little from the old walls and stepping in
 *    three times, each step under a thin dark projecting cornice, more dark bands between, its windows in bands.
 *
 * The frame: the real outline. Its LONGEST edge is Kearny (35 m); walking anticlockwise from it come the corner
 * face toward the fountain (~14 m), the canted bay (~7 m), Market (~23 m), then the party walls. Each wall is laid
 * out in its own frame: u along it, o out of it, y up.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { offsetRing } from '../../parts.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const T = {
  brick: surfaceTag('brick'), stone: surfaceTag('ashlar'), rock: surfaceTag('ashlar'), glass: surfaceTag('glass'),
  copper: surfaceTag('copper'), stucco: surfaceTag('stucco'), metal: surfaceTag('metal'),
}

// colours from the Commons photograph in sun: orange-red brick, a browner pink sandstone, green copper
const BRICK: Rgb = [0.6, 0.33, 0.27]
const SPANDREL: Rgb = [0.5, 0.27, 0.23]
const PIER: Rgb = [0.63, 0.35, 0.28]
const STONE: Rgb = [0.58, 0.43, 0.37]
const STONE_DARK: Rgb = [0.45, 0.33, 0.29]
const CARVED: Rgb = [0.66, 0.5, 0.42]
const COPPER: Rgb = [0.36, 0.47, 0.42]
const GLASS: Rgb = [0.17, 0.2, 0.22]
const SHOP: Rgb = [0.13, 0.15, 0.17]
const SASH: Rgb = [0.8, 0.77, 0.7]
const DOOR: Rgb = [0.2, 0.15, 0.13]
// the tower: warm beige render, blue-grey glass, near-black cornices
const RENDER: Rgb = [0.88, 0.8, 0.64]
const RENDER_SHADE: Rgb = [0.76, 0.68, 0.54]
const TGLASS: Rgb = [0.27, 0.33, 0.4]
const DARK: Rgb = [0.2, 0.2, 0.22]
const ROOF: Rgb = [0.45, 0.45, 0.46]

/** The old building's heights, metres over the pavement (counted on the Commons photograph). */
const Y = {
  shop: 5.0,       // head of the ground-storey shop windows
  f2: 5.8,         // the second (sandstone) floor's sills
  course1: 9.4,    // the course over the sandstone base
  brick: 10.1,     // where the brick starts
  course2: 17.6,   // the course under the arcade
  arcade: 18.3,    // the arcade's piers start
  spring: 30.0,    // the arches spring
  arcTop: 33.0,    // the course over the arches
  f9: 33.6,
  course4: 37.1,
  f10: 37.6,
  cornice: 44.8,   // the brick frieze ends, the copper cornice starts
  roof: 46.2,      // the old roof line, where the tower starts
}
const TOWER_TOP = 94.6
const TFLOOR = 3.6

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
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up. */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = false): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], [f.nx, 0, f.nz], UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], [-f.tx, 0, -f.tz], UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], [f.tx, 0, f.tz], UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}
/** A flat rectangle facing out of the wall, `o` metres proud of it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}
/** The half-disc of a round arch `r` in radius springing at `spring`, centred `u`, `o` proud. */
function archHead(out: MeshBuilder, f: Fr, u: number, o: number, spring: number, r: number, c: Rgb, tag = FIXED, seg = 6): void {
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI - (i / seg) * Math.PI
    const a1 = Math.PI - ((i + 1) / seg) * Math.PI
    out.quad([P(f, u, o, spring), P(f, u + Math.cos(a0) * r, o, spring + Math.sin(a0) * r), P(f, u + Math.cos(a1) * r, o, spring + Math.sin(a1) * r), P(f, u, o, spring)],
      [f.nx, 0, f.nz], UV, c, tag)
  }
}

/** A window `w` wide from y0 to y1 in `lights` lights: dark glass, the light sash bars between. */
function windowAt(out: MeshBuilder, f: Fr, u: number, w: number, y0: number, y1: number, lights: number, glass = GLASS, sash = SASH): void {
  panel(out, f, u - w / 2, u + w / 2, 0.03, y0, y1, glass, T.glass)
  for (let k = 1; k < lights; k++) {
    const m = u - w / 2 + (w * k) / lights
    panel(out, f, m - 0.06, m + 0.06, 0.05, y0, y1, sash)
  }
}

/** A string course the length of the wall, `o` proud. */
function course(out: MeshBuilder, f: Fr, y0: number, y1: number, o: number, c: Rgb, tag: number): void {
  slab(out, f, -0.05, f.L + 0.05, -0.2, o, y0, y1, c, tag, true)
}

// ------------------------------------------------------------------------------------------- the old building

/** The walls every face shares: the rock-faced base, the brick, the courses, the frieze and copper cornice. */
function shell(out: MeshBuilder, f: Fr, street: boolean): void {
  const L = f.L
  if (street) {
    panel(out, f, 0, L, 0, 0, Y.brick, STONE, T.rock)
    // the rock-faced coursing: darker joints every 0.75 m
    for (let y = 0.75; y < Y.course1 - 0.2; y += 0.75) panel(out, f, 0, L, 0.015, y - 0.05, y + 0.05, STONE_DARK)
    panel(out, f, 0, L, 0, Y.brick, Y.cornice, BRICK, T.brick)
    course(out, f, Y.course1, Y.brick, 0.25, STONE, T.stone)
    course(out, f, Y.course2, Y.arcade, 0.2, STONE, T.stone)
    course(out, f, Y.arcTop, Y.f9, 0.2, STONE, T.stone)
    course(out, f, Y.course4, Y.f10, 0.15, STONE, T.stone)
  } else {
    panel(out, f, 0, L, 0, 0, Y.cornice, BRICK, T.brick)
  }
  // the frieze band and the thin copper cornice on its brackets
  panel(out, f, 0, L, 0.06, Y.cornice - 0.9, Y.cornice - 0.6, SPANDREL)
  slab(out, f, -0.4, L + 0.4, -0.2, street ? 0.75 : 0.45, Y.cornice, Y.cornice + 0.55, COPPER, T.copper, true)
  slab(out, f, -0.2, L + 0.2, -0.2, 0.35, Y.cornice + 0.55, Y.roof, COPPER, T.copper)
}

/**
 * A street wall in `n` bays: sandstone piers in the base, brick piers through the arcade, and in each bay the
 * shop window, the second-floor pair, two brick floors, three arcade floors and the arched fourth, the paired
 * floor, the two 1905 floors.
 */
function bays(out: MeshBuilder, f: Fr, n: number, skipGround = false): void {
  const e = 0.55
  const pw = 0.9
  const step = (f.L - 2 * e) / n
  for (let k = 0; k <= n; k++) {
    const u = e + k * step
    // a sandstone pier through the base, a brick pier through the arcade with a stone capital
    slab(out, f, u - pw / 2, u + pw / 2, 0, 0.18, 0, Y.course1, STONE, T.rock)
    slab(out, f, u - pw / 2, u + pw / 2, 0, 0.25, Y.arcade, Y.spring, PIER, T.brick)
    slab(out, f, u - pw / 2 - 0.1, u + pw / 2 + 0.1, 0, 0.32, Y.spring, Y.spring + 0.35, STONE, T.stone, true)
  }
  for (let k = 0; k < n; k++) {
    const u = e + (k + 0.5) * step
    const cw = step - pw
    const lights = cw > 4.6 ? 3 : 2
    // the ground storey's shop window and the second floor's pair
    if (!skipGround) {
      windowAt(out, f, u, cw - 0.5, 0.6, Y.shop, lights, SHOP)
      panel(out, f, u - cw / 2 + 0.25, u + cw / 2 - 0.25, 0.04, Y.shop - 0.12, Y.shop, STONE_DARK)
    }
    const pair = Math.min(1.5, (cw - 0.9) / 2)
    for (const s of [-1, 1]) windowAt(out, f, u + s * (pair / 2 + 0.25), pair, Y.f2, Y.course1 - 0.6, 2)
    // the two brick floors
    for (const y0 of [Y.brick + 1.0, Y.brick + 4.7]) for (const s of [-1, 1]) windowAt(out, f, u + s * (pair / 2 + 0.25), pair, y0, y0 + 2.3, 2)
    // the arcade: a recessed field of spandrels, the lights of three floors and the arched fourth
    const aw = cw - 0.3
    panel(out, f, u - aw / 2, u + aw / 2, 0.01, Y.arcade, Y.spring, SPANDREL, T.brick)
    for (let fl = 0; fl < 3; fl++) {
      const y0 = Y.arcade + 0.6 + fl * 2.9
      windowAt(out, f, u, aw - 0.4, y0, y0 + 2.1, lights)
    }
    const r = aw / 2
    // the archivolt in sandstone, the glass under it
    archHead(out, f, u, 0.02, Y.spring + 0.35, r + 0.05, STONE, T.stone, 7)
    windowAt(out, f, u, aw - 0.4, Y.arcade + 9.3, Y.spring + 0.35, lights)
    archHead(out, f, u, 0.04, Y.spring + 0.35, r - 0.35, GLASS, T.glass, 7)
    // the brick spandrels over the arch: the field above the archivolt to the course is the plain wall
    // the paired floor (with a small pilaster between), the two 1905 floors in triples
    for (const s of [-1, 1]) windowAt(out, f, u + s * (pair / 2 + 0.3), pair, Y.f9 + 0.7, Y.course4 - 0.5, 2)
    slab(out, f, u - 0.17, u + 0.17, 0, 0.14, Y.f9 + 0.4, Y.course4 - 0.2, PIER, T.brick)
    const tw = Math.min(cw - 0.8, 3.6)
    for (const y0 of [Y.f10 + 0.7, Y.f10 + 4.2]) windowAt(out, f, u, tw, y0, y0 + 2.1, 3)
  }
}

/**
 * The canted bay between the corner face and Market: the round-arched entrance in rock-faced sandstone, the
 * balcony over it, the ornamented sandstone strips with carved panels up to a small arch, single windows between.
 */
function cantedBay(out: MeshBuilder, f: Fr): void {
  const m = f.L / 2
  // the entrance: a deep sandstone archivolt, the dark doors
  const r = 1.7
  slab(out, f, m - r - 0.7, m + r + 0.7, 0, 0.3, 0, Y.course1, STONE, T.rock)
  archHead(out, f, m, 0.31, 3.6, r + 0.5, STONE_DARK, T.rock, 8)
  panel(out, f, m - r, m + r, 0.32, 0, 3.6, DOOR)
  archHead(out, f, m, 0.33, 3.6, r, DOOR, FIXED, 8)
  panel(out, f, m - r, m + r, 0.34, 3.0, 3.12, SASH)
  // the balcony on the course
  slab(out, f, m - 2.4, m + 2.4, 0, 1.1, Y.course1 - 0.3, Y.brick, STONE, T.stone, true)
  slab(out, f, m - 2.4, m + 2.4, 0.95, 1.1, Y.brick, Y.brick + 1.0, STONE, T.stone)
  // the two carved strips through the brick and arcade floors
  for (const s of [-1, 1]) {
    const u = m + s * 1.75
    slab(out, f, u - 0.32, u + 0.32, 0, 0.25, Y.brick + 1.0, Y.spring + 0.4, STONE, T.stone)
    for (let y = Y.brick + 3.4; y < Y.spring; y += 3.6) panel(out, f, u - 0.26, u + 0.26, 0.26, y, y + 0.9, CARVED)
  }
  // a single window a floor between them, the small arch over the arcade
  for (let y = Y.brick + 1.3; y < Y.spring - 2; y += 3.7) windowAt(out, f, m, 1.7, y, y + 2.4, 2)
  windowAt(out, f, m, 1.7, Y.spring - 1.4, Y.spring + 0.8, 2)
  archHead(out, f, m, 0.03, Y.spring + 0.8, 0.95, STONE, T.stone, 6)
  archHead(out, f, m, 0.04, Y.spring + 0.8, 0.85, GLASS, T.glass, 6)
  // carved panels under the sills of the upper floors, the pair and the 1905 windows
  panel(out, f, m - 1.2, m + 1.2, 0.03, Y.f9 + 0.1, Y.f9 + 0.55, CARVED)
  for (const s of [-1, 1]) windowAt(out, f, m + s * 0.85, 1.2, Y.f9 + 0.7, Y.course4 - 0.5, 2)
  for (const y0 of [Y.f10 + 0.7, Y.f10 + 4.2]) windowAt(out, f, m, 2.6, y0, y0 + 2.1, 3)
}

/** A party wall seen over its lower neighbours: plain brick, a column of windows in the top floors. */
function partyWall(out: MeshBuilder, f: Fr): void {
  shell(out, f, false)
  if (f.L < 4) return
  const n = Math.max(1, Math.floor(f.L / 3.5))
  const step = f.L / n
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) * step
    for (const y0 of [Y.f9 + 0.7, Y.f10 + 0.7, Y.f10 + 4.2]) windowAt(out, f, u, 1.3, y0, y0 + 2.0, 2)
  }
}

// ------------------------------------------------------------------------------------------- the 2007 tower

/** One tier of the tower on `ring`: the render, banded windows, a thin dark band every three floors. */
function towerTier(out: MeshBuilder, ring: P2[], y0: number, y1: number, last: boolean): void {
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const f = frameOf(ring[i], ring[(i + 1) % n])
    if (f.L < 0.5) continue
    panel(out, f, 0, f.L, 0, y0, y1, RENDER, T.stucco)
    const floors = Math.max(1, Math.round((y1 - y0) / TFLOOR))
    const fh = (y1 - y0) / floors
    const bays = Math.max(1, Math.round(f.L / 4.2))
    const bw = f.L / bays
    if (f.L > 2.5) {
      for (let k = 0; k < bays; k++) {
        const u = (k + 0.5) * bw
        // a shaded pilaster strip at each bay's edge
        if (k > 0) panel(out, f, k * bw - 0.2, k * bw + 0.2, 0.06, y0, y1, RENDER_SHADE, T.stucco)
        for (let fl = 0; fl < floors; fl++) {
          const ya = y0 + fl * fh + 0.85
          windowAt(out, f, u, Math.min(3.3, bw - 0.9), ya - 0.15, ya + 2.0, 3, TGLASS, RENDER)
        }
      }
    }
    // the dark bands between, every third floor, and the cornice at the tier's top
    for (let fl = 3; fl < floors; fl += 3) slab(out, f, -0.1, f.L + 0.1, -0.1, 0.4, y0 + fl * fh - 0.15, y0 + fl * fh + 0.15, DARK, T.metal, true)
    const d = last ? 1.3 : 0.95
    slab(out, f, -d, f.L + d, -0.3, d, y1 - 0.15, y1 + 0.35, DARK, T.metal, true)
  }
}

// ------------------------------------------------------------------------------------------- the building

function deYoungBuilding(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const ring0 = area >= 0 ? raw : [...raw].reverse()
  const ring = simplifyRing(ring0, 0.4)
  const n = ring.length
  // Kearny is the longest edge; anticlockwise after it the corner face, the canted bay, Market
  let k0 = 0
  for (let i = 0; i < n; i++) if (frameOf(ring[i], ring[(i + 1) % n]).L > frameOf(ring[k0], ring[(k0 + 1) % n]).L) k0 = i
  const role = (i: number): 'kearny' | 'corner' | 'canted' | 'market' | 'party' => {
    const d = (i - k0 + n) % n
    if (d === 0) return 'kearny'
    const L = frameOf(ring[i], ring[(i + 1) % n]).L
    if (d === 1) return 'corner'
    if (d === 2) return L < 10 ? 'canted' : 'market'
    if (d === 3 && frameOf(ring[(k0 + 2) % n], ring[(k0 + 3) % n]).L < 10) return 'market'
    return 'party'
  }
  for (let i = 0; i < n; i++) {
    const f = frameOf(ring[i], ring[(i + 1) % n])
    const r = role(i)
    if (r === 'party') { partyWall(out, f); continue }
    shell(out, f, true)
    if (r === 'canted') { cantedBay(out, f); continue }
    const nb = r === 'corner' ? 2 : Math.max(1, Math.round((f.L - 1.1) / (r === 'market' ? 4.5 : 5)))
    bays(out, f, nb)
  }
  capPolygon(out, ring, Y.roof, ROOF, T.metal)

  // the tower, on the outline without its small jogs, drawn in from the old walls and stepping in three times
  const base = simplifyRing(ring0, 1.6)
  let cur = offsetRing(base, -0.6)
  const steps = [Y.roof, 64.2, 75.0, 85.8, TOWER_TOP]
  for (let s = 0; s < 4; s++) {
    if (s > 0) {
      const next = offsetRing(cur, -(s === 3 ? 1.6 : 1.1))
      capPolygon(out, cur, steps[s] + 0.35, DARK, T.metal)
      cur = next
    }
    towerTier(out, cur, steps[s], steps[s + 1], s === 3)
  }
  capPolygon(out, cur, TOWER_TOP + 0.35, ROOF, T.metal)
  // the roof plant in render, set back from the parapets, with its dark lid
  const plant = offsetRing(cur, -3.2)
  const pn = plant.length
  for (let i = 0; i < pn; i++) {
    const f = frameOf(plant[i], plant[(i + 1) % pn])
    panel(out, f, 0, f.L, 0, TOWER_TOP + 0.35, TOWER_TOP + 3.4, RENDER_SHADE, T.stucco)
    slab(out, f, -0.4, f.L + 0.4, -0.2, 0.4, TOWER_TOP + 3.4, TOWER_TOP + 3.7, DARK, T.metal)
  }
  capPolygon(out, plant, TOWER_TOP + 3.7, DARK, T.metal)
}

export const DE_YOUNG_BUILDING: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/32946675 — the de Young (Chronicle) Building and the Ritz-Carlton tower on it, 690 Market. */
  deYoungBuilding,
}
