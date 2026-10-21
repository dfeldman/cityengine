/**
 * The Aronson Building, 706 Mission Street at Third (Hermann Barth, 1903): ten storeys of buff brick and
 * terracotta on the corner, now the front of the Four Seasons residences / Contemporary Jewish Museum block.
 * From the Mapillary frames in p4/refs/way-112878589 (2026-10-21): 02 and 04 look WNW at the Mission front and the
 * Mission / Third corner, 05 looks south at the Third front and the plain north-west wall.
 *
 * What the photographs show:
 *  - the two street fronts — Mission (the south-east face, 34 m, FIVE bays) and Third (the north-east face, 26 m,
 *    FOUR bays) — are buff brick with sandy terracotta trim, NOT red: wide brick piers rising unbroken from the
 *    base cornice to the arches, broader piers at the corners, a pair of windows a bay a storey between them;
 *  - a three-storey grey-green BASE: tall dark shopfronts between square piers with a slim column in each, two
 *    storeys of big paired windows over them, a belt between, and a projecting BRACKETED cornice on top;
 *  - five storeys of plain paired windows in the shaft, a sill course under each;
 *  - the ninth storey is the ARCADE: a round arch over each bay, its moulded archivolt springing from the piers,
 *    the window under it round-headed with a mullion and a lunette, the spandrels between the arches carved;
 *  - a string course, the attic storey of small paired windows between carved panels, then the heavy cornice:
 *    a dentilled frieze, modillions, a corona projecting ~1.5 m;
 *  - the rear walls (north-west, south-west) are common red-brown brick with small punched windows in pairs and a
 *    plain coping; the cornice stops at the corner, returning only its own projection;
 *  - a flagpole over the Mission / Third corner.
 *
 * The frame: Mission is the edge facing +z (`edgeFacing(ring, 0)`) — the two long edges are both 34.2 m, so the
 * builder cannot tell Mission from the rear wall by itself; the manifest must carry `front` 137 (Mission's bearing).
 * Third is the edge that meets Mission at the corner on its right as one faces it; the other two are plain.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { edgeFacing } from '../../parts.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const T = { brick: surfaceTag('brick'), terra: surfaceTag('terracotta'), granite: surfaceTag('granite'), metal: surfaceTag('metal'), stucco: surfaceTag('stucco') }

// the buff brick and the sandier terracotta of the fronts (frames 02, 04: golden tan in sun)
const BUFF: Rgb = [0.8, 0.64, 0.47]
const PIER: Rgb = [0.83, 0.67, 0.49]
const TRIM: Rgb = [0.84, 0.74, 0.58]
const CARVE: Rgb = [0.66, 0.5, 0.33]
const SHADE: Rgb = [0.5, 0.38, 0.26]
// the grey-green base
const BASE: Rgb = [0.58, 0.6, 0.55]
const BASE_TRIM: Rgb = [0.64, 0.66, 0.61]
const JOINT: Rgb = [0.46, 0.48, 0.44]
// the plain rear walls (frame 05)
const COMMON: Rgb = [0.6, 0.39, 0.28]
const COPING: Rgb = [0.66, 0.5, 0.38]
const GLASS: Rgb = [0.16, 0.18, 0.21]
const SHOP: Rgb = [0.12, 0.13, 0.14]
const SASH: Rgb = [0.84, 0.82, 0.76]
const DOOR: Rgb = [0.2, 0.17, 0.14]
const ROOF: Rgb = [0.5, 0.5, 0.49]

/** The heights, metres over the pavement, for a cornice at ~46.5 m (scaled gently to `fit.height`). */
const Y0 = {
  ground: 5.6,      // top of the shopfront storey (the sign band above the glass)
  s2: 6.1,          // second storey floor
  belt: 9.9,        // belt between storeys 2 and 3
  s3: 10.3,
  bc0: 13.6,        // the base cornice: frieze and brackets
  bc1: 14.7,        // its top, where the brick starts
  shaft: 14.7,      // storey 4's floor
  storey: 4.05,     // the shaft's storey height (5 storeys)
  s9: 34.95,        // the arcade storey's floor
  band0: 40.2,      // the string course over the arches
  band1: 40.75,
  attic0: 41.3,     // attic window sill
  attic1: 43.1,     // attic window head
  frieze: 44.1,     // the cornice's frieze starts
  mod: 44.9,        // modillions
  corona: 45.6,     // the corona
  top: 46.5,        // the cornice's top, the roof
  rear: 46.9,       // the rear walls' parapet
}
let Y = { ...Y0 }

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

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up (`bottom` adds the underside). */
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
/** A round-headed field `w` wide, from `y0` to its crown at `y1`, centred `u` along, `o` proud. */
function archField(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, y1: number, w: number, c: Rgb, seg = 8, tag = FIXED): void {
  const r = w / 2
  const spring = y1 - r
  if (spring > y0) panel(out, f, u - r, u + r, o, y0, spring, c, tag)
  for (let i = 0; i < seg; i += 2) {
    // two segments a quad: centre, three points round the head
    const a = (k: number) => Math.PI - ((i + k) / seg) * Math.PI
    out.quad([P(f, u, o, spring), P(f, u + Math.cos(a(0)) * r, o, spring + Math.sin(a(0)) * r),
      P(f, u + Math.cos(a(1)) * r, o, spring + Math.sin(a(1)) * r), P(f, u + Math.cos(a(2)) * r, o, spring + Math.sin(a(2)) * r)],
    [f.nx, 0, f.nz], UV, c, tag)
  }
}
/** The moulded ring of an arch: radius `r` to `r + w` about (u, spring), its face `o` proud, its soffit back to 0. */
function archivolt(out: MeshBuilder, f: Fr, u: number, spring: number, r: number, w: number, o: number, c: Rgb, seg = 8): void {
  const R = r + w
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI - (i / seg) * Math.PI
    const a1 = Math.PI - ((i + 1) / seg) * Math.PI
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1)
    out.quad([P(f, u + c0 * r, o, spring + s0 * r), P(f, u + c1 * r, o, spring + s1 * r), P(f, u + c1 * R, o, spring + s1 * R), P(f, u + c0 * R, o, spring + s0 * R)],
      [f.nx, 0, f.nz], UV, c, T.terra)
    // the soffit, facing in toward the arch's middle and down
    const am = (a0 + a1) / 2
    out.quad([P(f, u + c0 * r, 0, spring + s0 * r), P(f, u + c1 * r, 0, spring + s1 * r), P(f, u + c1 * r, o, spring + s1 * r), P(f, u + c0 * r, o, spring + s0 * r)],
      [-Math.cos(am) * f.tx, -Math.sin(am), -Math.cos(am) * f.tz], UV, SHADE, T.terra)
  }
}

// ------------------------------------------------------------------------------------------------ the pieces

/** A window `w` wide from `y0` to `y1`: dark glass, a white sash bar across, a sill (on the fronts). */
function windowAt(out: MeshBuilder, f: Fr, u: number, w: number, y0: number, y1: number, sill: boolean): void {
  panel(out, f, u - w / 2, u + w / 2, 0.03, y0, y1, GLASS)
  const m = y0 + (y1 - y0) * 0.55
  panel(out, f, u - w / 2, u + w / 2, 0.05, m - 0.05, m + 0.05, SASH)
  if (sill) slab(out, f, u - w / 2 - 0.1, u + w / 2 + 0.1, 0, 0.12, y0 - 0.14, y0, TRIM, T.terra)
}

/** A pair of windows centred on `u` across a bay opening `bw` wide, with the brick mullion between. */
function pairAt(out: MeshBuilder, f: Fr, u: number, bw: number, y0: number, y1: number, sill: boolean): void {
  const gap = 0.45
  const w = Math.min(1.9, (bw - 0.7 - gap) / 2)
  windowAt(out, f, u - gap / 2 - w / 2, w, y0, y1, false)
  windowAt(out, f, u + gap / 2 + w / 2, w, y0, y1, false)
  if (sill) slab(out, f, u - gap / 2 - w - 0.12, u + gap / 2 + w + 0.12, 0, 0.12, y0 - 0.14, y0, TRIM, T.terra)
}

/** The bays of a front: corner piers `cp`, inner piers `ip`, n openings. Returns the opening centres and width. */
function layout(L: number): { cs: number[]; bw: number; cp: number; ip: number } {
  const cp = Math.min(2.4, L * 0.08)
  const ip = 1.7
  const n = Math.max(1, Math.round((L - 2 * cp + ip) / 6.3))
  const bw = (L - 2 * cp - (n - 1) * ip) / n
  const cs: number[] = []
  for (let k = 0; k < n; k++) cs.push(cp + bw / 2 + k * (bw + ip))
  return { cs, bw, cp, ip }
}

/**
 * A street front. `ext0` / `ext1` carry the corner pier on past its end (to close the street corner with the
 * neighbouring front's pier); `door` puts the arched entrance in that bay (index) instead of a shopfront.
 */
function front(out: MeshBuilder, f: Fr, ext0: number, ext1: number, door: number): void {
  const L = f.L
  const { cs, bw, cp } = layout(L)
  const below = -1.2
  // ---- the walls: grey base, buff brick above
  panel(out, f, 0, L, 0, below, Y.bc1, BASE, T.granite)
  panel(out, f, 0, L, 0, Y.bc1, Y.frieze, BUFF, T.brick)
  // the piers, proud of the wall: grey through the base, brick from the base cornice to the string course
  const piers: [number, number][] = [[-ext0, cp]]
  for (let k = 0; k < cs.length - 1; k++) piers.push([cs[k] + bw / 2, cs[k + 1] - bw / 2])
  piers.push([L - cp, L + ext1])
  for (const [u0, u1] of piers) {
    slab(out, f, u0, u1, 0, 0.25, below, Y.bc0, BASE, T.granite)
    // the base's horizontal joints on the pier faces
    for (let y = 1.2; y < Y.bc0 - 0.3; y += 1.1) panel(out, f, u0, u1, 0.26, y - 0.03, y + 0.03, JOINT)
    slab(out, f, u0, u1, 0, 0.2, Y.bc1, Y.band0, PIER, T.brick)
    // the impost block where the arch springs
    const r = bw / 2
    const spring = Y.band0 - 0.35 - r - 0.4
    slab(out, f, u0 - 0.05, u1 + 0.05, 0, 0.3, spring - 0.35, spring, TRIM, T.terra)
  }
  // ---- the base: the plinth, shopfronts, the two storeys of big windows, the belt and the bracketed cornice
  slab(out, f, -ext0, L + ext1, 0, 0.32, below, 0.45, JOINT, T.granite)
  cs.forEach((u, k) => {
    if (k === door) {
      // the entrance: a round-arched doorway in a moulded surround with a keystone
      archField(out, f, u, 0.02, 0.3, Y.ground - 0.1, Math.min(3.4, bw - 0.4), BASE_TRIM, 8, T.granite)
      archField(out, f, u, 0.04, 0.3, Y.ground - 0.5, Math.min(2.6, bw - 1.2), DOOR, 8)
      panel(out, f, u - 1.3, u + 1.3, 0.06, 3.3, 3.42, BASE_TRIM)
      slab(out, f, u - 0.3, u + 0.3, 0, 0.2, Y.ground - 0.6, Y.ground + 0.1, BASE_TRIM, T.granite)
    } else {
      panel(out, f, u - bw / 2, u + bw / 2, 0.02, 0.45, Y.ground - 0.6, SHOP)
      panel(out, f, u - bw / 2, u + bw / 2, 0.04, Y.ground - 1.6, Y.ground - 1.5, BASE_TRIM)
      // the slim column in the middle of the shopfront
      const c = pt(f, u, 0.15)
      prism(out, c.x, c.z, 0.45, Y.ground - 0.6, 0.2, 8, BASE_TRIM, T.granite, 0.2, false)
    }
    // the sign band over the shopfront, then storeys two and three
    pairAt(out, f, u, bw, Y.s2 + 0.5, Y.belt - 0.35, false)
    pairAt(out, f, u, bw, Y.s3 + 0.35, Y.bc0 - 0.35, false)
  })
  slab(out, f, -ext0, L + ext1, 0, 0.35, Y.ground - 0.15, Y.s2, BASE_TRIM, T.granite)
  slab(out, f, -ext0, L + ext1, 0, 0.32, Y.belt, Y.s3, BASE_TRIM, T.granite)
  // the base cornice: frieze, consoles at ~1.4 m, the corona
  slab(out, f, -ext0 - 0.1, L + ext1 + 0.1, 0, 0.35, Y.bc0, Y.bc0 + 0.5, BASE_TRIM, T.granite)
  for (let u = 0.6; u < L - 0.3; u += 1.4) slab(out, f, u - 0.14, u + 0.14, 0.35, 0.8, Y.bc0 + 0.1, Y.bc0 + 0.6, BASE_TRIM, T.granite, true)
  slab(out, f, -ext0 - 0.9, L + ext1 + 0.9, 0, 0.95, Y.bc0 + 0.6, Y.bc1, BASE_TRIM, T.granite, true)

  // ---- the shaft: five storeys of paired windows, a sill course under each
  for (let s = 0; s < 5; s++) {
    const y = Y.shaft + s * Y.storey
    for (const u of cs) pairAt(out, f, u, bw, y + 0.95, y + Y.storey - 0.55, true)
  }
  // ---- the arcade: the arch over each bay, the round-headed window under it, the carved spandrels
  const r = bw / 2
  const crown = Y.band0 - 0.35
  const spring = crown - r - 0.4
  for (const u of cs) {
    // the field within the arch, a shade darker for the reveal, then the window
    archField(out, f, u, 0.01, Y.s9 + 0.4, crown - 0.4, bw, CARVE, 8, T.terra)
    archField(out, f, u, 0.03, Y.s9 + 0.75, spring + r - 0.2, bw - 0.5, GLASS, 8)
    panel(out, f, u - 0.06, u + 0.06, 0.05, Y.s9 + 0.75, spring + r - 0.2, SASH)
    panel(out, f, u - r + 0.25, u + r - 0.25, 0.05, spring - 0.06, spring + 0.06, SASH)
    slab(out, f, u - r - 0.05, u + r + 0.05, 0, 0.14, Y.s9 + 0.6, Y.s9 + 0.75, TRIM, T.terra)
    archivolt(out, f, u, spring, r, 0.45, 0.24, TRIM)
    // the keystone
    slab(out, f, u - 0.25, u + 0.25, 0, 0.3, spring + r - 0.05, crown + 0.35, TRIM, T.terra)
  }
  // the carved spandrels over the piers, between the arches: a sunk field and a roundel
  for (let k = 0; k <= cs.length; k++) {
    const u = k === 0 ? cs[0] - r - 0.9 : k === cs.length ? cs[k - 1] + r + 0.9 : (cs[k - 1] + cs[k]) / 2
    panel(out, f, u - 0.75, u + 0.75, 0.21, spring + 0.6, crown - 0.1, CARVE, T.terra)
    panel(out, f, u - 0.4, u + 0.4, 0.22, (spring + crown) / 2 + 0.05, (spring + crown) / 2 + 0.85, TRIM, T.terra)
  }
  // ---- the string course, the attic, the cornice
  slab(out, f, -ext0 - 0.1, L + ext1 + 0.1, 0, 0.35, Y.band0, Y.band1, TRIM, T.terra)
  cs.forEach((u) => pairAt(out, f, u, Math.min(bw, 3.6), Y.attic0, Y.attic1, true))
  // carved panels on the attic between the window pairs
  for (let k = 0; k <= cs.length; k++) {
    const u = k === 0 ? cp / 2 : k === cs.length ? L - cp / 2 : (cs[k - 1] + cs[k]) / 2
    panel(out, f, u - 0.8, u + 0.8, 0.04, Y.attic0 - 0.1, Y.attic1 + 0.1, TRIM, T.terra)
    panel(out, f, u - 0.55, u + 0.55, 0.05, Y.attic0 + 0.2, Y.attic1 - 0.2, CARVE, T.terra)
  }
  // the frieze with its dentil course, the modillions, the corona and its cymatium
  slab(out, f, -ext0 - 0.25, L + ext1 + 0.25, 0, 0.3, Y.frieze, Y.mod, TRIM, T.terra)
  panel(out, f, -ext0 - 0.25, L + ext1 + 0.25, 0.31, Y.mod - 0.35, Y.mod - 0.1, SHADE)
  for (let u = 0.15; u < L + ext1 + 0.1; u += 0.32) panel(out, f, u, u + 0.16, 0.32, Y.mod - 0.35, Y.mod - 0.1, TRIM)
  slab(out, f, -ext0 - 0.4, L + ext1 + 0.4, 0, 0.45, Y.mod, Y.corona, SHADE, T.terra)
  for (let u = 0.3; u < L + ext1; u += 0.85) slab(out, f, u - 0.15, u + 0.15, 0.45, 1.45, Y.mod + 0.15, Y.corona, TRIM, T.terra, true)
  slab(out, f, -ext0 - 1.55, L + ext1 + 1.55, 0, 1.55, Y.corona, Y.top - 0.25, TRIM, T.terra, true)
  slab(out, f, -ext0 - 1.65, L + ext1 + 1.65, -0.3, 1.65, Y.top - 0.25, Y.top, TRIM, T.terra, true)
}

/** A plain rear wall: common brick, small punched windows in pairs, a coping; nothing on the ground storey. */
function rear(out: MeshBuilder, f: Fr): void {
  const L = f.L
  panel(out, f, 0, L, 0, -1.2, Y.rear, COMMON, T.brick)
  slab(out, f, -0.1, L + 0.1, -0.3, 0.12, Y.rear, Y.rear + 0.3, COPING, T.stucco)
  slab(out, f, 0, L, 0, 0.15, -1.2, 0.6, JOINT, T.granite)
  const n = Math.max(1, Math.round(L / 7.5))
  const step = L / n
  const floors = [Y.s2, Y.s3, ...[0, 1, 2, 3, 4].map((s) => Y.shaft + s * Y.storey), Y.s9, Y.attic0 - 0.6]
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) * step
    for (const y of floors) {
      for (const s of [-0.75, 0.75]) panel(out, f, u + s - 0.5, u + s + 0.5, 0.02, y + 0.8, y + 2.9, GLASS)
    }
  }
}

// ------------------------------------------------------------------------------------------- the building

function aronson(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const ring = simplifyRing(area >= 0 ? raw : [...raw].reverse(), 0.6)
  const n = ring.length
  // the heights, scaled gently toward the manifest's (55 m is to the roof structures; the cornice is ~46.5 m)
  const k = Math.max(0.9, Math.min(1.08, (fit.height || 55) / 55))
  Y = Object.fromEntries(Object.entries(Y0).map(([key, v]) => [key, v * k])) as typeof Y0

  const mi = edgeFacing(ring, 0)
  const ti = (mi + THIRD + n) % n
  const v0 = out.positions.length
  // the street corner, where the two fronts meet: each front's pier is carried round it to close the corner
  const cornerAtEnd = ti === (mi + 1) % n   // Mission's end vertex is Third's start
  for (let i = 0; i < n; i++) {
    const f = frameOf(ring[i], ring[(i + 1) % n])
    if (i === mi) {
      front(out, f, cornerAtEnd ? 0 : 0.25, cornerAtEnd ? 0.25 : 0, -1)
    } else if (i === ti) {
      // the entrance in Third's bay furthest from Mission
      const bays = layout(f.L).cs.length
      front(out, f, cornerAtEnd ? 0.25 : 0, cornerAtEnd ? 0 : 0.25, cornerAtEnd ? bays - 1 : 0)
    } else rear(out, f)
  }
  capPolygon(out, ring, Y.top - 0.3, ROOF, T.metal)

  // the penthouse at the back of the roof, and the flagpole over the street corner
  let cx = 0
  let cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= n
  cz /= n
  const M = frameOf(ring[mi], ring[(mi + 1) % n])
  const cu = (cx - M.ox) * M.tx + (cz - M.oz) * M.tz
  const co = (cx - M.ox) * M.nx + (cz - M.oz) * M.nz
  const back = cornerAtEnd ? -1 : 1
  slab(out, M, cu + back * 6 - 4, cu + back * 6 + 4, co - 9, co - 3, Y.top - 0.3, Y.top + 3.2, COMMON, T.brick)
  slab(out, M, cu + back * 6 - 4.1, cu + back * 6 + 4.1, co - 9.1, co - 2.9, Y.top + 3.2, Y.top + 3.4, COPING, T.stucco)
  const fp = pt(M, cornerAtEnd ? M.L - 2.2 : 2.2, -2.2)
  prism(out, fp.x, fp.z, Y.top, Y.top + 9, 0.07, 6, [0.86, 0.86, 0.84], T.metal, 0.05)
  prism(out, fp.x, fp.z, Y.top + 9, Y.top + 9.25, 0.13, 6, [0.82, 0.66, 0.3], FIXED, 0.05)
  // onto the street datum at the corner (the city sinks a model to its lowest ground)
  const g = pt(M, cornerAtEnd ? M.L - 1 : 1, 2)
  const drop = fit.groundAt ? Math.max(0, Math.min(3, fit.groundAt(g.x, g.z))) : 0
  if (drop > 0) for (let q = v0 + 1; q < out.positions.length; q += 3) out.positions[q] += drop
}

/** Third Street's edge, counted from Mission's in the ring (1: the next edge, n-1: the previous). */
const THIRD = 1

export const ARONSON: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/112878589 — the Aronson Building, 706 Mission Street at Third. */
  b2_prewarOffice_112878589: aronson,
}
