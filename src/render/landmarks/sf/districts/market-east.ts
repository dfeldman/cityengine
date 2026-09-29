/**
 * San Francisco's individually modelled buildings: market-east (SF_PLAN.md §10; the batch list is docs/sf-batches/market-east.md).
 * One builder per building, most of them a tower-grammar spec (render/landmarks/tower.ts) from Street View and
 * photographs; the few that need more, their own geometry here. Registered through render/landmarks/sf/index.ts;
 * placed by public/landmarks/san-francisco/market-east.json.
 *
 * Market Street from the Ferry Building to Kearny and Third: the lower Market of the 1910s office palaces (One
 * Market, the Matson and PG&E buildings, the Hobart), the International Style of 1959 (Crown Zellerbach and its
 * copper-roofed pavilion), the 1960s–80s slabs and granite boxes (Chevron, 555 and 525 Market, 425, 333, One
 * Sansome, 44 Montgomery), the Hyatt's sloping atrium wedge, and the flatiron at 544.
 *
 * The helpers below are for the buildings the grammar alone cannot say: `frame` finds a footprint's own axes (its
 * longest wall), so a part can be drawn square in its own frame and set in place with `placed`; `obox` is a box on
 * those axes; `edgeFace` dresses one wall of a ring, not all of them.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { surfaceTag, type Surface } from '../../../cartoon-material.ts'
import { faceBand, insetRing, tower, towerRing, type Face, type TowerSpec } from '../../tower.ts'
import { beam } from '../../kit.ts'
import { edgeAt } from '../../parts.ts'

type P2 = { x: number; z: number }
type Build = (out: MeshBuilder, fit: Fit) => void

const spec = (s: TowerSpec): Build => (out, fit) => tower(out, fit, s)

// ---------------------------------------------------------------------------------------------------------------
// helpers

const quad = (out: MeshBuilder, p: [number, number, number][], n: [number, number, number], c: Rgb, tag = 0): void =>
  out.quad(p, n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)

/** The shader's surface for a custom part (cartoon-material.ts SURFACES). */
const T = (s: Surface): number => surfaceTag(s)

/** A triangle facing whichever of its two sides is nearer the direction `toward`. */
const triToward = (out: MeshBuilder, a: [number, number, number], b: [number, number, number], c: [number, number, number], col: Rgb,
  toward: [number, number, number], tag = 0): void => {
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  let n: [number, number, number] = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
  const l = Math.hypot(n[0], n[1], n[2]) || 1
  n = [n[0] / l, n[1] / l, n[2] / l]
  if (n[0] * toward[0] + n[1] * toward[1] + n[2] * toward[2] < 0) n = [-n[0], -n[1], -n[2]]
  out.quad([a, b, c, c], n, [[0, 0], [1, 0], [1, 1], [1, 1]], col, tag)
}

/** A ceiling: the ring's underside at y, facing down (a soffit under pilotis, a canopy's underside). Convex rings. */
function soffit(out: MeshBuilder, ring: P2[], y: number, c: Rgb, tag = T('concrete')): void {
  const o = centroid(ring)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    quad(out, [[o.x, y, o.z], [a.x, y, a.z], [b.x, y, b.z], [b.x, y, b.z]], [0, -1, 0], c, tag)
  }
}

function centroid(ring: P2[]): P2 {
  let x = 0
  let z = 0
  for (const p of ring) { x += p.x; z += p.z }
  return { x: x / ring.length, z: z / ring.length }
}

/**
 * A footprint's own axes: `e` along its longest wall, `n` square to it (local +z), the centroid `c`, and the ring
 * in those coordinates (`u` along, `v` across). Build a part square in (u, v) and `place` it.
 */
interface Frame { e: P2; n: P2; c: P2; uv: P2[]; angle: number; edge: number; toWorld: (u: number, v: number) => P2 }
function frame(ring: P2[], axisEdge?: number): Frame {
  let best = 0
  let bi = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L > best) { best = L; bi = i }
  }
  if (axisEdge !== undefined) bi = axisEdge
  const a = ring[bi]
  const b = ring[(bi + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const e = { x: (b.x - a.x) / L, z: (b.z - a.z) / L }
  const n = { x: -e.z, z: e.x }
  const c = centroid(ring)
  const uv = ring.map((p) => ({ x: (p.x - c.x) * e.x + (p.z - c.z) * e.z, z: (p.x - c.x) * n.x + (p.z - c.z) * n.z }))
  // kit's rotation sense: local (1, 0) goes to (cos a, −sin a)
  const angle = Math.atan2(-e.z, e.x)
  return { e, n, c, uv, angle, edge: bi, toWorld: (u, v) => ({ x: c.x + e.x * u + n.x * v, z: c.z + e.z * u + n.z * v }) }
}

/** Append `part` (drawn in the frame's u, v) in place. */
function place(out: MeshBuilder, part: MeshBuilder, f: Frame): void {
  const base = out.positions.length / 3
  for (let i = 0; i < part.positions.length; i += 3) {
    const u = part.positions[i]
    const v = part.positions[i + 2]
    out.positions.push(f.c.x + f.e.x * u + f.n.x * v, part.positions[i + 1], f.c.z + f.e.z * u + f.n.z * v)
    const nu = part.normals[i]
    const nv = part.normals[i + 2]
    out.normals.push(f.e.x * nu + f.n.x * nv, part.normals[i + 1], f.e.z * nu + f.n.z * nv)
  }
  out.uvs.push(...part.uvs)
  out.colors.push(...part.colors)
  for (const idx of part.indices) out.indices.push(base + idx)
}

/** An axis-aligned rectangle ring, anticlockwise. */
const rect = (u0: number, u1: number, v0: number, v1: number): P2[] =>
  [{ x: u0, z: v0 }, { x: u1, z: v0 }, { x: u1, z: v1 }, { x: u0, z: v1 }]

const bounds = (r: P2[]): { u0: number; u1: number; v0: number; v1: number } => ({
  u0: Math.min(...r.map((p) => p.x)), u1: Math.max(...r.map((p) => p.x)),
  v0: Math.min(...r.map((p) => p.z)), v1: Math.max(...r.map((p) => p.z)),
})

/** A box on a frame's axes, in world coordinates: centre (u, v) in the frame, half-sizes along e and n. */
function obox(out: MeshBuilder, f: Frame, u: number, v: number, y0: number, y1: number, hu: number, hv: number, c: Rgb, tag = T('concrete')): void {
  const part = new MeshBuilder()
  box(part, u, (y0 + y1) / 2, v, hu, (y1 - y0) / 2, hv, c, tag)
  place(out, part, f)
}

/** One wall of a ring dressed (a -> b), not all of them: a sliver ring whose other two edges hide in the mass. */
function edgeFace(out: MeshBuilder, a: P2, b: P2, y0: number, y1: number, face: Face): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  // the inward normal of an anticlockwise ring's edge a -> b is (−dz, dx)
  const m = { x: (a.x + b.x) / 2 - ((b.z - a.z) / L) * 0.6, z: (a.z + b.z) / 2 + ((b.x - a.x) / L) * 0.6 }
  faceBand(out, [a, b, m], y0, y1, face)
}


/** The ring with its nearly straight corners removed (OSM draws a long wall as many short segments). */
function simplify(ring: P2[], degrees = 6): P2[] {
  let r = ring.slice()
  let changed = true
  while (changed && r.length > 3) {
    changed = false
    for (let i = 0; i < r.length; i++) {
      const a = r[(i + r.length - 1) % r.length]
      const b = r[i]
      const c = r[(i + 1) % r.length]
      const t1 = Math.atan2(b.z - a.z, b.x - a.x)
      const t2 = Math.atan2(c.z - b.z, c.x - b.x)
      let d = Math.abs(t2 - t1)
      if (d > Math.PI) d = 2 * Math.PI - d
      if (d < (degrees * Math.PI) / 180 || Math.hypot(c.x - b.x, c.z - b.z) < 0.3) { r.splice(i, 1); changed = true; break }
    }
  }
  return r
}

/** The part of the ring where k(p) = dx·x + dz·z + c ≥ 0 (Sutherland–Hodgman against one half-plane). */
function clipHalf(ring: P2[], dx: number, dz: number, c: number): P2[] {
  const k = (p: P2): number => dx * p.x + dz * p.z + c
  const out: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const ka = k(a)
    const kb = k(b)
    if (ka >= 0) out.push(a)
    if ((ka >= 0) !== (kb >= 0)) {
      const t = ka / (ka - kb)
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })
    }
  }
  return out
}

/** A half-plane "distance from the edge a→b, positive inside an anticlockwise ring": [dx, dz, c]. */
function inside(a: P2, b: P2): [number, number, number] {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const nx = -(b.z - a.z) / L
  const nz = (b.x - a.x) / L
  return [nx, nz, -(nx * a.x + nz * a.z)]
}

/** The ring's area (positive anticlockwise). */
const area = (r: P2[]): number => r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p.x * q.z - q.x * p.z }, 0) / 2


/**
 * Stone strips standing proud at every corner of the ring, `w` along each wall either side of the corner, `d` out:
 * the quoins and corner pilasters of the 1900s–20s blocks (the grammar dresses whole walls, not corners).
 */
function quoins(out: MeshBuilder, ring: P2[], y0: number, y1: number, w: number, d: number, c: Rgb, minEdge = 6, material: Surface = 'ashlar'): void {
  const g = insetRing(ring, -d)
  for (let i = 0; i < ring.length; i++) {
    const a = g[i]
    const b = g[(i + 1) % g.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < minEdge) continue
    const t = { x: (b.x - a.x) / L, z: (b.z - a.z) / L }
    const k = Math.min(w, L / 3)
    for (const [p, q] of [[a, { x: a.x + t.x * k, z: a.z + t.z * k }], [{ x: b.x - t.x * k, z: b.z - t.z * k }, b]] as const) {
      faceBand(out, [p, q], y0, y1, { kind: 'blank', wall: c, material })
    }
  }
}

/** The fit's height when plausible, else the default. */
const heightOf = (fit: Fit, h: number): number => (fit.height > 0.6 * h && fit.height < 1.6 * h ? fit.height : h)

// ---------------------------------------------------------------------------------------------------------------
// palette

const DARK_BRONZE: Rgb = [0.2, 0.18, 0.16]
const GRANITE_LIGHT: Rgb = [0.66, 0.64, 0.61]
const SOFFIT: Rgb = [0.78, 0.78, 0.76]

// ---------------------------------------------------------------------------------------------------------------
// Crown Zellerbach and its pavilion (Bush Plaza, Market at Bush and Battery)

const CZ_GLASS: Rgb = [0.3, 0.46, 0.47]
const CZ_MULLION: Rgb = [0.2, 0.21, 0.21]
const CZ_TILE: Rgb = [0.15, 0.17, 0.2]
const CZ_MARBLE: Rgb = [0.19, 0.24, 0.22]

/**
 * The Crown Zellerbach Building, One Bush Plaza (SOM, 1959): the city's first International Style tower. A
 * twenty-storey slab of sea-green glass between fine bronze mullions, lifted on dark green marble pilotis over a
 * recessed glass lobby; the elevators and stairs in a separate windowless tower toward Market, clad in dark
 * mosaic tile. The footprint says which is which: the slab is the long rectangle, the service tower the block
 * standing out of its Market side. (Commons: "One Bush Plaza.jpg", "OneBushPlaza.JPG", "Onebush.jpg";
 * untappedcities.com on the tile-clad core.)
 */
function crownZellerbach(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const f = frame(ring)
  const H = heightOf(fit, 99)
  const uv = f.uv
  const b = bounds(uv)
  // the long wall is the one the frame was taken from: at v = its v; the slab's other face is the v of the
  // corners at the two ends of it; the service tower is whatever stands beyond that
  const vLong = uv[f.edge].z
  const far = vLong > 0 ? b.v0 : b.v1
  const ends = uv.filter((p) => p.x < b.u0 + 6 || p.x > b.u1 - 6).map((p) => p.z)
  const vSlab = vLong > 0 ? Math.min(...ends) : Math.max(...ends)
  const coreP = uv.filter((p) => Math.abs(p.z - vLong) > Math.abs(vSlab - vLong) + 1.5)
  const slab = rect(b.u0, b.u1, Math.min(vLong, vSlab), Math.max(vLong, vSlab))
  const part = new MeshBuilder()
  const lift = 6.8
  const top = H - 4
  // the slab: glass between thin proud mullions, floor lines, a dark band at the roof
  faceBand(part, slab, lift, top, { kind: 'curtain', wall: CZ_MULLION, glass: CZ_GLASS, pitch: 1.75, floor: 4.1 })
  faceBand(part, slab, top, top + 1.2, { kind: 'blank', wall: CZ_MULLION, material: 'metal' })
  capPolygon(part, slab, top + 1.2, [0.4, 0.4, 0.4], 0)
  soffit(part, slab, lift, SOFFIT)
  // under it: the pilotis round the edge and the glass lobby set well back
  const sb = bounds(slab)
  const bayU = (sb.u1 - sb.u0) / Math.round((sb.u1 - sb.u0) / 8.6)
  for (let u = sb.u0 + 1.2; u <= sb.u1 - 1.1; u += bayU) {
    for (const v of [sb.v0 + 1.4, sb.v1 - 1.4]) box(part, u, lift / 2, v, 0.65, lift / 2, 0.65, CZ_MARBLE, T('granite'))
  }
  const lobby = rect(sb.u0 + 7, sb.u1 - 7, sb.v0 + 4.5, sb.v1 - 4.5)
  faceBand(part, lobby, 0, lift, { kind: 'curtain', wall: DARK_BRONZE, glass: [0.42, 0.47, 0.46], pitch: 3.4, floor: lift })
  // the service tower, dark tile, a little taller than the slab, the whole height
  if (coreP.length >= 2) {
    const cb = bounds(coreP)
    const cr = vLong > 0 ? rect(cb.u0, cb.u1, far, vSlab + 0.5) : rect(cb.u0, cb.u1, vSlab - 0.5, far)
    faceBand(part, cr, 0, top + 3.5, { kind: 'blank', wall: CZ_TILE, material: 'tile' })
    capPolygon(part, cr, top + 3.5, [0.3, 0.3, 0.31], 0)
  }
  place(out, part, f)
}

const PAV_ROOF: Rgb = [0.33, 0.28, 0.25]
const PAV_ROOF_TOP: Rgb = [0.4, 0.34, 0.3]
const CURTAIN: Rgb = [0.9, 0.86, 0.76]
const CURTAIN_FOLD: Rgb = [0.8, 0.75, 0.65]

/**
 * The pavilion on Bush Plaza, 523/532 Market (SOM, 1959, built with Crown Zellerbach for the American Trust
 * Company; later Wells Fargo, E*Trade, the SVB Experience Center): a round single-storey glass drum under a
 * precast folded-plate roof clad in copper, the folds making a zig-zag crown round its rim; pale curtains drawn
 * behind the glass; on a low granite-edged plinth in SOM's sunken garden. OSM maps it as way/93817360 ("svb").
 * (artandarchitecture-sf.com "One Bush Plaza and its environs", DSC_2220.)
 */
function bushPlazaPavilion(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const c = centroid(ring)
  const R = Math.max(6, Math.min(14, ring.reduce((a, p) => a + Math.hypot(p.x - c.x, p.z - c.z), 0) / ring.length))
  const N = 18                                         // the folds of the roof, a bay of glass under each
  const plinth = 1.1
  const eave = plinth + 3.9
  const rg = R - 1.3                                   // the glass, under the roof's overhang
  // the plinth, its granite edge, the step up on the street side (local −z)
  prism(out, c.x, c.z, 0, plinth, R + 0.2, 32, GRANITE_LIGHT, T('granite'))
  prism(out, c.x, c.z, plinth - 0.05, plinth + 0.02, R + 0.35, 32, [0.58, 0.57, 0.55], T('granite'))
  for (let k = 0; k < 3; k++) box(out, c.x, (k + 1) * plinth / 4, c.z - R - 0.5 - (2 - k) * 0.4, 1.6, (k + 1) * plinth / 8, 0.2, GRANITE_LIGHT, T('granite'))
  // the glass: each bay a dark band of glass over curtains drawn in two folds, and a slim bronze mullion
  const at = (a: number, r: number, y: number): [number, number, number] => [c.x + Math.sin(a) * r, y, c.z + Math.cos(a) * r]
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2
    const a1 = ((i + 1) / N) * Math.PI * 2
    const am = (a0 + a1) / 2
    const n: [number, number, number] = [Math.sin(am), 0, Math.cos(am)]
    const panel = (t0: number, t1: number, y0: number, y1: number, col: Rgb, r = rg, tag = T('glass')): void => {
      const A = a0 + (a1 - a0) * t0
      const B = a0 + (a1 - a0) * t1
      quad(out, [at(A, r, y0), at(B, r, y0), at(B, r, y1), at(A, r, y1)], n, col, tag)
    }
    panel(0, 1, plinth, eave, [0.24, 0.29, 0.31])
    // the curtains, just inside the glass: most bays drawn, a few open
    if (i % 6 !== 2) {
      panel(0.06, 0.5, plinth + 0.25, eave - 0.7, CURTAIN, rg + 0.02, T('stucco'))
      panel(0.5, 0.94, plinth + 0.25, eave - 0.7, CURTAIN_FOLD, rg + 0.02, T('stucco'))
    }
    const m = at(a0, rg + 0.08, 0)
    box(out, m[0], (plinth + eave) / 2, m[2], 0.08, (eave - plinth) / 2, 0.08, DARK_BRONZE, T('metal'))
  }
  // the transom band and the roof's soffit
  prism(out, c.x, c.z, eave - 0.35, eave, rg + 0.05, N, DARK_BRONZE, T('metal'), rg + 0.05, false)
  soffit(out, Array.from({ length: N * 2 }, (_, k) => ({ x: c.x + Math.sin((k / (N * 2)) * Math.PI * 2) * R, z: c.z + Math.cos((k / (N * 2)) * Math.PI * 2) * R })), eave, [0.72, 0.7, 0.66], T('concrete'))
  // the folded plates: round the rim, a peak over each mullion and a valley between, each fold running up to a
  // low ridge ring and a flat copper top
  const peak = eave + 2.0
  const ridge = eave + 1.1
  const rr = R * 0.45
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2
    const am = ((i + 0.5) / N) * Math.PI * 2
    const a1 = ((i + 1) / N) * Math.PI * 2
    const P0 = at(a0, R, peak)
    const V = at(am, R, eave)
    const P1 = at(a1, R, peak)
    const Q0 = at(a0, rr, ridge)
    const Q1 = at(a1, rr, ridge)
    const Qm = at(am, rr, ridge - 0.25)
    // the fascia: the fold's two triangles seen from outside, and their slopes up to the ridge
    const outward: [number, number, number] = [Math.sin(am), 0.35, Math.cos(am)]
    triToward(out, P0, V, Qm, PAV_ROOF, [outward[0], 1, outward[2]], T('copper'))
    triToward(out, V, P1, Qm, PAV_ROOF, [outward[0], 1, outward[2]], T('copper'))
    triToward(out, P0, Qm, Q0, PAV_ROOF_TOP, [0, 1, 0], T('copper'))
    triToward(out, P1, Q1, Qm, PAV_ROOF_TOP, [0, 1, 0], T('copper'))
    // the edge seen from below the eave: the vertical fold faces
    triToward(out, P0, V, at(a0, R, eave), PAV_ROOF, outward, T('copper'))
    triToward(out, V, P1, at(a1, R, eave), PAV_ROOF, outward, T('copper'))
    triToward(out, Q0, Qm, [c.x, ridge, c.z], PAV_ROOF_TOP, [0, 1, 0], T('copper'))
    triToward(out, Qm, Q1, [c.x, ridge, c.z], PAV_ROOF_TOP, [0, 1, 0], T('copper'))
  }
  // the fold lines' dark seams would be too fine to see; the flat top instead gets a small skylight
  prism(out, c.x, c.z, ridge, ridge + 0.3, rr * 0.5, 12, [0.3, 0.34, 0.33], T('glass'))
}


// ---------------------------------------------------------------------------------------------------------------
// the 1900s–20s office palaces of lower Market

const SP_BRICK: Rgb = [0.58, 0.33, 0.26]
const SP_STONE: Rgb = [0.83, 0.79, 0.7]
const PT_BRICK: Rgb = [0.36, 0.19, 0.15]
const PT_TRIM: Rgb = [0.44, 0.25, 0.2]
const WINDOW: Rgb = [0.2, 0.22, 0.25]

/**
 * The Southern Pacific Building, One Market (Bliss & Faville, 1916–17): the railroad's headquarters facing the
 * Ferry Building. A two-storey base of cream stone opened in tall round arches; ten storeys of red-orange brick with
 * windows in pairs; the top two storeys a colonnade of cream columns under a very deep bracketed cream cornice.
 * (Commons: "Southern Pacific Building, San Francisco 2023-07-18.jpg", "1 Market Street, from Market and Spear
 * Street".)
 */
const southernPacificSpec: TowerSpec = {
  height: 60,
  base: { height: 10.5, face: { kind: 'punched', wall: SP_STONE, glass: [0.18, 0.2, 0.22], pitch: 7.2, solid: 0.3, floor: 10.5, arched: true, material: 'ashlar' } },
  tiers: [
    { to: 12, face: { kind: 'blank', wall: SP_STONE, material: 'ashlar' }, cornice: { depth: 0.7, height: 1.2 } },
    { to: 0.83, face: { kind: 'punched', wall: SP_BRICK, glass: WINDOW, pitch: 1.85, solid: 0.5, floor: 3.9, material: 'brick' }, cornice: { depth: 0.35, height: 0.5, colour: SP_STONE } },
    { to: 0.97, face: { kind: 'fins', wall: SP_STONE, glass: [0.24, 0.24, 0.25], pitch: 2.2, solid: 0.42, depth: 0.55, floor: 4, material: 'ashlar' } },
    { to: 1, face: { kind: 'blank', wall: SP_STONE, material: 'ashlar' }, cornice: { depth: 2.3, height: 1.8, colour: SP_STONE } },
  ],
  roof: [0.55, 0.53, 0.5],
  penthouse: 1,
}
function southernPacificBuilding(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, southernPacificSpec)
  const H = heightOf(fit, 60)
  quoins(out, towerRing(fit), 12, H * 0.83, 3.2, 0.3, SP_STONE, 12)
}

/**
 * The Postal Telegraph Building, 22 Battery on the Mechanics Monument plaza (Lewis Hobart, 1908): a chocolate-brown
 * brick block with the windows paired in each bay, a belt cornice two-thirds of the way up, then a two-storey
 * arcade of round-arched windows with dark spandrels, an attic storey and a bracketed cornice. (Commons: "22
 * Battery Street, San Francisco.jpg".)
 */
const postalTelegraphBuilding = spec({
  height: 55,
  base: { height: 8, face: { kind: 'punched', wall: PT_TRIM, glass: [0.16, 0.17, 0.18], pitch: 3.6, solid: 0.3, floor: 8, material: 'terracotta' } },
  tiers: [
    { to: 0.64, face: { kind: 'punched', wall: PT_BRICK, glass: WINDOW, pitch: 2.1, solid: 0.5, floor: 4, material: 'brick' }, cornice: { depth: 0.55, height: 0.8, colour: PT_TRIM } },
    { to: 0.87, face: { kind: 'punched', wall: PT_BRICK, glass: [0.17, 0.18, 0.2], pitch: 4.6, solid: 0.34, floor: 6.2, arched: true, material: 'brick' }, cornice: { depth: 0.4, height: 0.6, colour: PT_TRIM } },
    { to: 1, face: { kind: 'punched', wall: PT_BRICK, glass: WINDOW, pitch: 2.3, solid: 0.55, floor: 4, material: 'brick' }, cornice: { depth: 1.3, height: 1.2, colour: PT_TRIM } },
  ],
  roof: [0.4, 0.38, 0.36],
})



const MATSON_TC: Rgb = [0.84, 0.81, 0.73]
const MATSON_GLASS: Rgb = [0.2, 0.28, 0.27]
const PGE_TC: Rgb = [0.6, 0.6, 0.59]

/**
 * The Matson Building, 215 Market (Bliss & Faville, 1921–24): pale cream glazed terracotta, rusticated all over. A
 * two-storey base of fluted Ionic columns round a great arched entrance, picked out in teal; a mezzanine band with
 * MATSON BUILDING and its anchors; a tall shaft of plain windows in pairs; paired round-arched windows along the top
 * storey under a deep bracketed cornice, and a small arcaded lantern on the roof. (Commons: "Matson Building &
 * Annex (San Francisco).jpg", "Matson Building and Annex (taken on 27Aug2012 ...).jpg".)
 */
const matsonBuilding = spec({
  height: 83,
  base: { height: 11, face: { kind: 'fins', wall: MATSON_TC, glass: MATSON_GLASS, pitch: 4.4, solid: 0.26, depth: 0.7, floor: 11, material: 'terracotta' } },
  tiers: [
    { to: 16, face: { kind: 'punched', wall: MATSON_TC, glass: WINDOW, pitch: 2.4, solid: 0.5, floor: 5, material: 'terracotta' }, cornice: { depth: 0.8, height: 1.1 } },
    { to: 0.8, face: { kind: 'punched', wall: MATSON_TC, glass: WINDOW, pitch: 2, solid: 0.5, floor: 3.9, material: 'terracotta' }, cornice: { depth: 0.4, height: 0.6 } },
    { to: 0.9, face: { kind: 'punched', wall: MATSON_TC, glass: [0.18, 0.21, 0.22], pitch: 2.1, solid: 0.42, floor: 5.4, arched: true, material: 'terracotta' } },
    { to: 0.93, face: { kind: 'punched', wall: MATSON_TC, glass: WINDOW, pitch: 2.1, solid: 0.6, floor: 2.6, material: 'terracotta' }, cornice: { depth: 1.8, height: 1.4 } },
  ],
  roof: [0.5, 0.5, 0.48],
  crown: { kind: 'lantern', height: 5, inset: 24, face: { kind: 'punched', wall: MATSON_TC, glass: [0.18, 0.2, 0.22], pitch: 2, solid: 0.45, floor: 5, arched: true, material: 'terracotta' }, cap: { kind: 'parapet', height: 0.8, colour: MATSON_TC } },
})

/**
 * The PG&E General Office Building, 245 Market (Bakewell & Brown, 1923–25): grey terracotta cut to look like
 * rusticated granite; a two-storey arcade at the street (the arched doorway with PACIFIC GAS AND ELECTRIC COMPANY
 * and its carved figures), a plain shaft, and the top four storeys stepped back in two stages behind a
 * colonnade. (Commons: "Pacific Gas & Electric Co. General Office Building (San Francisco).jpg"; Wikipedia.)
 */
const pgeTiers = (h: number): TowerSpec => ({
  height: h,
  base: { height: 10, face: { kind: 'punched', wall: PGE_TC, glass: [0.2, 0.26, 0.3], pitch: 6.5, solid: 0.32, floor: 10, arched: true, material: 'granite' } },
  tiers: [
    { to: 0.76, face: { kind: 'punched', wall: PGE_TC, glass: WINDOW, pitch: 2.1, solid: 0.5, floor: 3.9, material: 'granite' }, cornice: { depth: 0.9, height: 1 } },
    { to: 0.88, inset: 2.6, face: { kind: 'fins', wall: PGE_TC, glass: [0.2, 0.21, 0.23], pitch: 2.6, solid: 0.4, depth: 0.5, floor: 4, material: 'granite' }, cornice: { depth: 0.8, height: 1 } },
    { to: 0.97, inset: 2.6, face: { kind: 'punched', wall: PGE_TC, glass: WINDOW, pitch: 2.2, solid: 0.5, floor: 3.9, material: 'granite' }, cornice: { depth: 1, height: 1 } },
  ],
  roof: [0.46, 0.46, 0.45],
  crown: { kind: 'parapet', height: 1.2, colour: PGE_TC },
})
const pgeBuilding = spec(pgeTiers(83))
/** The PG&E Annex, 77 Beale (1945): built to match the General Office Building, the same grey terracotta and base. */
const pgeAnnex = spec({ ...pgeTiers(52), tiers: [
  { to: 0.9, face: { kind: 'punched', wall: PGE_TC, glass: WINDOW, pitch: 2.1, solid: 0.5, floor: 3.9, material: 'granite' }, cornice: { depth: 0.9, height: 1 } },
  { to: 1, inset: 2, face: { kind: 'punched', wall: PGE_TC, glass: WINDOW, pitch: 2.2, solid: 0.55, floor: 3.9, material: 'granite' }, cornice: { depth: 0.8, height: 0.9 } },
] })

// ---------------------------------------------------------------------------------------------------------------
// the Hyatt Regency (5 Embarcadero Center)

/**
 * The Hyatt's own footprint, in metres east and north of 37.794477, −122.395814 (OSM way/28319370). The bake
 * drops an outline that its parts supersede, and the Hyatt's twenty parts do supersede it, so the entry is placed
 * at a point instead of on a building — and then nothing hands the builder a ring. This is that ring.
 */
const HYATT_RING: P2[] = [{ x: -0.6, z: -62.7 }, { x: -1.7, z: -55.9 }, { x: 12.7, z: -42.0 }, { x: 66.9, z: 10.3 }, { x: 60.0, z: 17.4 }, { x: 50.5, z: 27.1 }, { x: 46.4, z: 26.5 }, { x: 42.5, z: 25.9 }, { x: 38.2, z: 25.2 }, { x: 34.3, z: 24.6 }, { x: 30.1, z: 24.0 }, { x: 26.3, z: 23.4 }, { x: 21.7, z: 22.6 }, { x: 18.2, z: 22.1 }, { x: 13.8, z: 21.4 }, { x: 9.4, z: 20.8 }, { x: 5.5, z: 20.2 }, { x: 2.0, z: 19.6 }, { x: -2.8, z: 18.9 }, { x: -6.3, z: 18.3 }, { x: -10.7, z: 17.7 }, { x: -18.8, z: 16.4 }, { x: -40.4, z: 13.1 }, { x: -44.8, z: 12.4 }, { x: -50.6, z: 11.5 }, { x: -49.0, z: 1.4 }, { x: -53.2, z: 0.8 }, { x: -51.7, z: -8.8 }, { x: -47.7, z: -8.2 }, { x: -38.4, z: -68.5 }, { x: -31.7, z: -67.4 }, { x: -28.4, z: -66.9 }]

const HY_CONCRETE: Rgb = [0.75, 0.73, 0.68]
const HY_TREAD: Rgb = [0.66, 0.64, 0.6]
const HY_GLASS: Rgb = [0.2, 0.22, 0.24]

/**
 * The Hyatt Regency San Francisco (John Portman, 1973) at the foot of Market: a wedge of beige concrete round the
 * seventeen-storey atrium. Two slabs of rooms, one along Drumm Street and one along the Market Street diagonal,
 * stand full height; between them the atrium's roof comes down to the Embarcadero Center plaza in fifteen steps,
 * each a storey of dark glass between vertical concrete ribs; the steps run square to the Drumm slab at its end
 * and parallel to the Market slab beside it (OSM's parts 944095691–707, 3 to 18 storeys, say so). At the south
 * tip the service tower rises clear of the slabs and carries the Equinox, the revolving restaurant, under its two
 * overhanging square frames. The wedge's long wall is the plaza front, the low end of the steps. (Commons:
 * "Hyatt Regency San Francisco (110103874).jpg" from Justin Herman Plaza, "Hyatt Regency San Francisco 01.JPG",
 * "Five Embarcardero Center.jpg".)
 */
function hyattRegency(out: MeshBuilder, fit: Fit): void {
  const ring = simplify(fit.ring && fit.ring.length >= 3 ? towerRing(fit) : HYATT_RING)
  const H = heightOf(fit, 83)
  const fl = (H * 0.78) / 19
  const edges = ring.map((a, i) => { const b = ring[(i + 1) % ring.length]; return { a, b, L: Math.hypot(b.x - a.x, b.z - a.z), t: Math.atan2(b.z - a.z, b.x - a.x) } })
  const byLen = [...edges].sort((p, q) => q.L - p.L)
  const north = byLen[0]
  const off = (e: { t: number }): number => { let d = Math.abs(e.t - north.t) % Math.PI; if (d > Math.PI / 2) d = Math.PI - d; return d }
  const se = byLen.find((e) => e !== north && off(e) > 0.26 && off(e) < 1.2) ?? byLen[1]
  const west = byLen.find((e) => e !== north && e !== se && off(e) >= 1.2) ?? byLen[2]
  const [nx, nz, nc] = inside(north.a, north.b)
  const [sx, sz, sc] = inside(se.a, se.b)
  const [wx, wz, wc] = inside(west.a, west.b)
  const dN = (p: P2): number => nx * p.x + nz * p.z + nc
  const dS = (p: P2): number => sx * p.x + sz * p.z + sc
  const dW = (p: P2): number => wx * p.x + wz * p.z + wc
  const depth = Math.max(...ring.map(dN))
  const WW = 11
  const SW = Math.min(21, depth * 0.23)
  const CN = Math.min(48, depth * 0.55)
  const nearer = (lo: boolean, x: number, z: number, c: number, v: number): [number, number, number] => lo ? [-x, -z, v - c] : [x, z, c - v]
  const clip = (r: P2[], ...hs: [number, number, number][]): P2[] => hs.reduce((q, h) => (q.length >= 3 ? clipHalf(q, h[0], h[1], h[2]) : q), r)
  // the slabs and the service tower
  const wing: Face = { kind: 'bands', wall: HY_CONCRETE, glass: [0.33, 0.33, 0.34], floor: fl, solid: 0.58 }
  const hw = fl * 19
  const W = clip(ring, nearer(true, wx, wz, wc, WW))
  const S = clip(ring, nearer(false, wx, wz, wc, WW), nearer(true, sx, sz, sc, SW))
  const Cb = clip(ring, nearer(false, wx, wz, wc, WW), nearer(false, sx, sz, sc, SW), nearer(false, nx, nz, nc, CN))
  for (const r of [W, S]) {
    if (r.length < 3 || Math.abs(area(r)) < 20) continue
    faceBand(out, towerRing({ hx: 0, hz: 0, height: 0, ring: r }), 0, hw, wing)
    faceBand(out, towerRing({ hx: 0, hz: 0, height: 0, ring: r }), hw, hw + 1.2, { kind: 'blank', wall: HY_CONCRETE })
    capPolygon(out, r, hw + 1.2, [0.6, 0.58, 0.54], 0)
  }
  // the atrium's steps: level(p) = max(3 + dN / 3, 18 − (dSE − SW) / 2.6) storeys, in fifteen treads and risers
  const aK = (k: number): number => (CN / 16) * (k - 3)
  const bK = (k: number): number => SW + 2.6 * (depth / 82) * (18 - k)
  const atrium = clip(ring, nearer(false, wx, wz, wc, WW), nearer(false, sx, sz, sc, SW), nearer(true, nx, nz, nc, CN))
  const L = (k: number): P2[] => k >= 19 ? atrium : clip(atrium, nearer(true, nx, nz, nc, aK(k)), nearer(false, sx, sz, sc, bK(k)))
  const on = (p: P2, q: P2, f: (p: P2) => number, v: number): boolean => Math.abs(f(p) - v) < 0.05 && Math.abs(f(q) - v) < 0.05
  const riser: Face = { kind: 'fins', wall: HY_CONCRETE, glass: HY_GLASS, pitch: 3.2, solid: 0.28, depth: 0.6, floor: fl }
  for (let k = 3; k <= 18; k++) {
    const y = k * fl
    const hi = L(k + 1)
    const pieces = [clip(hi, nearer(false, nx, nz, nc, aK(k))), clip(hi, nearer(true, nx, nz, nc, aK(k)), nearer(true, sx, sz, sc, bK(k)))]
    for (const pc of pieces) {
      if (pc.length < 3 || Math.abs(area(pc)) < 1) continue
      capPolygon(out, pc, y, HY_TREAD, 0)
      // its walls on the outline of the building, from the ground
      for (let i = 0; i < pc.length; i++) {
        const p = pc[i]
        const q = pc[(i + 1) % pc.length]
        if (Math.hypot(q.x - p.x, q.z - p.z) < 0.3) continue
        // j starts at 4, not 2: aK(3) is 0, which is dN's value on the ring's own north edge (the plaza/water
        // front, the low end of the steps), so testing j=3 here flagged that real outline edge as an interior
        // atrium cut and skipped its wall — the building's water-facing facade was never drawn (BUGS.md-class:
        // the lowest tread's own outer edge coincided with its interior threshold).
        let interior = false
        for (let j = 4; j <= 19 && !interior; j++) interior = on(p, q, dN, aK(j)) || on(p, q, dS, bK(j))
        interior ||= on(p, q, dW, WW) || on(p, q, dS, SW) || on(p, q, dN, CN)
        if (!interior) faceBand(out, [p, q], 0, y, wing)
      }
    }
    // the riser at the lower edge of this tread: from the step below up to it
    const lo = L(k)
    if (lo.length >= 3 && k > 3) {
      for (let i = 0; i < lo.length; i++) {
        const p = lo[i]
        const q = lo[(i + 1) % lo.length]
        if (Math.hypot(q.x - p.x, q.z - p.z) < 0.3) continue
        if (on(p, q, dN, aK(k)) || on(p, q, dS, bK(k))) faceBand(out, [p, q], y - fl, y, riser)
      }
    }
  }
  // the service tower and the Equinox on it
  if (Cb.length >= 3) {
    const cr = towerRing({ hx: 0, hz: 0, height: 0, ring: Cb })
    const hc = H - 12
    faceBand(out, cr, 0, hc, { kind: 'fins', wall: HY_CONCRETE, glass: [0.3, 0.3, 0.3], pitch: 2.4, solid: 0.55, depth: 0.5, floor: fl })
    capPolygon(out, cr, hc, [0.6, 0.58, 0.54], 0)
    const c = centroid(cr)
    const f = frame(ring, edges.indexOf(north))
    const cu = (c.x - f.c.x) * f.e.x + (c.z - f.c.z) * f.e.z
    const cv = (c.x - f.c.x) * f.n.x + (c.z - f.c.z) * f.n.z
    prism(out, c.x, c.z, hc, hc + 7.5, 8.5, 20, [0.24, 0.26, 0.28], T('glass'))
    prism(out, c.x, c.z, hc + 7.5, hc + 8.3, 9, 20, HY_CONCRETE, T('concrete'))
    // the two square frames round it, the upper one wider and the roof
    const ring4 = (y0: number, y1: number, half: number, w: number): void => {
      obox(out, f, cu, cv - half + w / 2, y0, y1, half, w / 2, [0.88, 0.86, 0.8])
      obox(out, f, cu, cv + half - w / 2, y0, y1, half, w / 2, [0.88, 0.86, 0.8])
      obox(out, f, cu - half + w / 2, cv, y0, y1, w / 2, half - w, [0.88, 0.86, 0.8])
      obox(out, f, cu + half - w / 2, cv, y0, y1, w / 2, half - w, [0.88, 0.86, 0.8])
    }
    ring4(hc + 2.5, hc + 4, 10.5, 1.6)
    ring4(hc + 9, hc + 11, 13, 2.2)
    obox(out, f, cu, cv, hc + 8.3, hc + 9.6, 9.5, 9.5, HY_CONCRETE)
    // the cross-arms carrying the upper frame
    obox(out, f, cu, cv, hc + 9.2, hc + 10.2, 12.5, 0.8, [0.88, 0.86, 0.8])
    obox(out, f, cu, cv, hc + 9.2, hc + 10.2, 0.8, 12.5, [0.88, 0.86, 0.8])
  }
}


// ---------------------------------------------------------------------------------------------------------------
// the post-war towers of lower Market

const BRONZE_GLASS: Rgb = [0.21, 0.2, 0.19]
const SKY_GLASS: Rgb = [0.3, 0.42, 0.48]
const ALUMINIUM: Rgb = [0.84, 0.84, 0.82]

/**
 * 333 Market (1979): a 33-storey shaft of bronze glass between close beige precast piers, its corners cut into
 * fine steps so the tower reads as a fluted column. Two storeys of dark glass at the street.
 * (Commons: "333 Market Street 2021.jpg".)
 */
const market333 = spec({
  height: 149,
  base: { height: 8.5, face: { kind: 'curtain', wall: [0.3, 0.29, 0.27], glass: [0.24, 0.26, 0.28], pitch: 3.4, floor: 8.5 } },
  tiers: [
    { to: 0.97, face: { kind: 'fins', wall: [0.74, 0.69, 0.58], glass: BRONZE_GLASS, pitch: 2.9, solid: 0.38, depth: 0.5, floor: 4, material: 'concrete' } },
    { to: 1, face: { kind: 'blank', wall: [0.74, 0.69, 0.58], material: 'concrete' } },
  ],
  roof: [0.45, 0.44, 0.42],
  penthouse: 1,
})

/**
 * 388 Market (SOM, 1987): the flatiron on the Market–Pine–Front triangle, its prow a full cylinder. Ribbons of
 * polished red granite and dark glass wrap it, floor by floor, and the top storeys step back at the back of the
 * wedge. (Commons: "388 Market Street, San Francisco 2023-07-18.jpg".)
 */
const market388 = spec({
  height: 118,
  base: { height: 9, face: { kind: 'bands', wall: [0.4, 0.24, 0.22], glass: [0.2, 0.22, 0.24], floor: 4.5, solid: 0.5, material: 'granite' } },
  tiers: [
    { to: 0.93, face: { kind: 'bands', wall: [0.44, 0.26, 0.24], glass: [0.22, 0.24, 0.26], floor: 4.2, solid: 0.5, material: 'granite' } },
    { to: 1, inset: 1.5, face: { kind: 'bands', wall: [0.44, 0.26, 0.24], glass: [0.22, 0.24, 0.26], floor: 4.2, solid: 0.5, material: 'granite' } },
  ],
  roof: [0.4, 0.34, 0.32],
})

/**
 * 425 Market (SOM, 1973): a white aluminium grid of deep-set windows, thirty-eight storeys, the corners clipped,
 * with two blank storeys of plant at the top. (Commons: "425 Market Street 2021.jpg".)
 */
const market425 = spec({
  height: 156,
  base: { height: 7.5, face: { kind: 'curtain', wall: [0.35, 0.35, 0.36], glass: [0.26, 0.28, 0.3], pitch: 3.2, floor: 7.5 } },
  tiers: [
    { to: 0.94, face: { kind: 'punched', wall: ALUMINIUM, glass: [0.24, 0.27, 0.3], pitch: 3.1, solid: 0.34, floor: 3.9, material: 'metal' } },
    { to: 1, face: { kind: 'blank', wall: ALUMINIUM, material: 'metal' } },
  ],
  roof: [0.5, 0.5, 0.5],
})

/**
 * First Market Tower, 525 Market (1973): thirty-nine storeys of close cream-white precast mullions, so fine that
 * the tower reads as corduroy, over a dark glass lobby. (Commons: "First Market Tower.jpg", "Looking up, 525
 * Market, SF.jpg".)
 */
const firstMarketTower = spec({
  height: 169,
  base: { height: 9, face: { kind: 'curtain', wall: [0.3, 0.3, 0.3], glass: [0.25, 0.27, 0.29], pitch: 3.4, floor: 9 } },
  tiers: [
    { to: 0.96, face: { kind: 'fins', wall: [0.83, 0.8, 0.73], glass: [0.27, 0.28, 0.3], pitch: 1.7, solid: 0.45, depth: 0.35, floor: 4, material: 'concrete' } },
    { to: 1, face: { kind: 'blank', wall: [0.83, 0.8, 0.73], material: 'concrete' } },
  ],
  roof: [0.46, 0.45, 0.43],
})

/**
 * 555 Market (SOM, 1964, the first of Standard Oil's three towers): a plain grey-white concrete grid, one square
 * window a bay, twenty-five storeys, standing back from Market behind its plaza. (Commons: "555-575 Market
 * Street.jpg".)
 */
const market555 = spec({
  height: 104,
  base: { height: 7, face: { kind: 'curtain', wall: [0.34, 0.34, 0.34], glass: [0.26, 0.28, 0.3], pitch: 3.2, floor: 7 } },
  tiers: [
    { to: 1, face: { kind: 'punched', wall: [0.73, 0.72, 0.69], glass: [0.25, 0.27, 0.29], pitch: 3.1, solid: 0.42, floor: 3.9, material: 'concrete' } },
  ],
  roof: [0.48, 0.48, 0.47],
})

/**
 * The Chevron Tower, 575 Market (1975), the tallest of the Market Center pair: the same grid as 555 but forty
 * storeys and warmer, its windows set deep in a pale precast frame. (Commons: "575 Market Street 2021.jpg".)
 */
const chevronTower = spec({
  height: 175,
  base: { height: 8, face: { kind: 'curtain', wall: [0.34, 0.34, 0.34], glass: [0.26, 0.28, 0.3], pitch: 3.2, floor: 8 } },
  tiers: [
    { to: 0.97, face: { kind: 'punched', wall: [0.79, 0.77, 0.72], glass: [0.25, 0.27, 0.29], pitch: 2.9, solid: 0.44, floor: 3.9, material: 'concrete' } },
    { to: 1, face: { kind: 'blank', wall: [0.79, 0.77, 0.72], material: 'concrete' } },
  ],
  roof: [0.48, 0.47, 0.45],
})

/**
 * One Front Street (SOM, 1979): white aluminium bands and dark glass, floor by floor, round a tower whose Market
 * Street corner is cut into a flight of steps — the notches in its footprint are those steps. (Commons: "One
 * Front Street.jpg".)
 */
const oneFrontStreet = spec({
  height: 171,
  base: { height: 8, face: { kind: 'curtain', wall: [0.32, 0.32, 0.33], glass: [0.26, 0.28, 0.3], pitch: 3.4, floor: 8 } },
  tiers: [
    { to: 0.97, face: { kind: 'bands', wall: [0.88, 0.88, 0.86], glass: [0.22, 0.26, 0.29], floor: 3.9, solid: 0.42, material: 'metal' } },
    { to: 1, face: { kind: 'blank', wall: [0.88, 0.88, 0.86], material: 'metal' } },
  ],
  roof: [0.5, 0.5, 0.5],
})

/**
 * One Sansome, the Citicorp Center tower (1984): forty-one storeys of pale grey granite with teal glass in
 * ribbon windows, the corners chamfered, on the block where Sansome meets Market. (Commons: "One Sansome
 * Street, San Francisco.jpg".)
 */
const oneSansomeTower = spec({
  height: 171,
  base: { height: 10, face: { kind: 'punched', wall: [0.76, 0.74, 0.71], glass: [0.24, 0.3, 0.32], pitch: 3.2, solid: 0.45, floor: 5, material: 'granite' } },
  tiers: [
    { to: 0.97, face: { kind: 'punched', wall: [0.79, 0.77, 0.74], glass: SKY_GLASS, pitch: 3, solid: 0.38, floor: 3.9, material: 'granite' } },
    { to: 1, face: { kind: 'blank', wall: [0.79, 0.77, 0.74], material: 'granite' } },
  ],
  roof: [0.5, 0.5, 0.49],
})

/**
 * 44 Montgomery (1967), for thirty years the city's second tallest: a dark glass shaft behind close white
 * aluminium fins, forty-three storeys, set back from the Hobart Building beside it. (Commons: "44 Montgomery
 * Street, San Francisco.jpg", "44 Montgomery Street and Hobart Building".)
 */
const montgomery44 = spec({
  height: 172,
  base: { height: 9, face: { kind: 'curtain', wall: [0.3, 0.3, 0.31], glass: [0.24, 0.26, 0.28], pitch: 3.4, floor: 9 } },
  tiers: [
    { to: 0.98, face: { kind: 'fins', wall: [0.86, 0.86, 0.85], glass: [0.2, 0.22, 0.25], pitch: 1.55, solid: 0.4, depth: 0.45, floor: 3.9, material: 'metal' } },
    { to: 1, face: { kind: 'blank', wall: [0.86, 0.86, 0.85], material: 'metal' } },
  ],
  roof: [0.5, 0.5, 0.5],
})

/**
 * The Flatiron Building, 544 Market (Havens & Toepke, 1913): a small ten-storey wedge of cream brick on the
 * triangle where Market, Sutter and Sansome meet, with a two-storey shopfront base, plain paired windows and a
 * bracketed cornice. (Commons: "544 Market Street" in the Market/Sansome street views.)
 */
const flatiron544 = spec({
  height: 38,
  base: { height: 7.5, face: { kind: 'curtain', wall: [0.28, 0.26, 0.24], glass: [0.26, 0.28, 0.3], pitch: 3, floor: 7.5 } },
  tiers: [
    { to: 0.9, face: { kind: 'punched', wall: [0.82, 0.78, 0.7], glass: WINDOW, pitch: 2.2, solid: 0.45, floor: 3.4, material: 'terracotta' }, cornice: { depth: 0.4, height: 0.5 } },
    { to: 1, face: { kind: 'punched', wall: [0.82, 0.78, 0.7], glass: WINDOW, pitch: 2.2, solid: 0.5, floor: 3.2, material: 'terracotta' }, cornice: { depth: 1.2, height: 1.1 } },
  ],
  roof: [0.45, 0.43, 0.4],
})


const HOBART_TC: Rgb = [0.82, 0.77, 0.72]

/**
 * The Hobart Building, 582 Market (Willis Polk, 1914): the most ornate thing on this stretch. A wide nine-storey
 * block along Market, and standing on its Montgomery end a slender tower whose prow is an oval bay, ringed with
 * arched windows and colonnettes, under a very deep bracketed cornice and a low tiled cap. Its two long side
 * walls are blank party walls — the building beside it was never built — so the model dresses only the ring's
 * ends and leaves the long walls plain. The tower stands over the end of the footprint farthest from its middle.
 * (Commons: "Hobart Building 2016.jpg", "44 Montgomery Street and Hobart Building".)
 */
function hobartBuilding(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = heightOf(fit, 86)
  const c = centroid(ring)
  // the prow: the vertex farthest from the middle; the tower is what lies within 24 m of it
  let far = ring[0]
  for (const p of ring) if (Math.hypot(p.x - c.x, p.z - c.z) > Math.hypot(far.x - c.x, far.z - c.z)) far = p
  const L = Math.hypot(c.x - far.x, c.z - far.z) || 1
  const dx = (c.x - far.x) / L
  const dz = (c.z - far.z) / L
  const towerRingTop = clipHalf(ring, -dx, -dz, dx * far.x + dz * far.z + 25)
  const block: Face = { kind: 'punched', wall: HOBART_TC, glass: WINDOW, pitch: 2.3, solid: 0.45, floor: 3.9, material: 'terracotta' }
  const shop: Face = { kind: 'curtain', wall: [0.3, 0.27, 0.25], glass: [0.26, 0.28, 0.3], pitch: 3, floor: 8 }
  tower(out, fit, {
    height: H,
    base: { height: 8, face: shop },
    tiers: [
      { to: 0.42, face: block, cornice: { depth: 1.1, height: 1 } },
    ],
    roof: [0.5, 0.48, 0.46],
  })
  // the tower over the prow: plain storeys, then the arcaded ones, the cornice and the tiled cap
  if (towerRingTop.length >= 3) {
    const t = towerRing({ hx: 0, hz: 0, height: 0, ring: towerRingTop })
    const y0 = H * 0.42
    const arcade = H * 0.86
    faceBand(out, t, y0, arcade, { kind: 'punched', wall: HOBART_TC, glass: WINDOW, pitch: 2.2, solid: 0.44, floor: 3.9, material: 'terracotta' })
    faceBand(out, t, arcade, H - 3.5, { kind: 'punched', wall: HOBART_TC, glass: [0.2, 0.22, 0.24], pitch: 2.2, solid: 0.4, floor: 4.2, arched: true, material: 'terracotta' })
    quoins(out, t, y0, H - 3.5, 1.6, 0.35, HOBART_TC, 4, 'terracotta')
    tower(out, { hx: 0, hz: 0, height: H - 3.4, ring: towerRingTop }, {
      height: H - 3.4,
      tiers: [{ to: 1, face: { kind: 'blank', wall: HOBART_TC, material: 'terracotta' }, cornice: { depth: 1.9, height: 1.6, colour: HOBART_TC } }],
      roof: [0.55, 0.55, 0.5],
      crown: { kind: 'hip', height: 3.4, inset: 2.6, colour: [0.62, 0.64, 0.58] },
    })
  }
}


/**
 * The Federal Reserve Bank of San Francisco, 101 Market (Skidmore, Owings & Merrill, 1983): a long pink-grey
 * granite block of banded windows above a monumental open arcade — square piers and barrel vaults two storeys
 * high along the whole Market front — with planted terraces set back on top of it. (Commons: "Fed Reserve Bank
 * of SF, 101 Market St.JPG" and its arcade.)
 */
const FED_GRANITE: Rgb = [0.76, 0.69, 0.66]
const federalReserve = spec({
  height: 66,
  base: { height: 11, face: { kind: 'punched', wall: [0.82, 0.79, 0.77], glass: [0.16, 0.16, 0.17], pitch: 6.4, solid: 0.38, floor: 11, arched: true, material: 'granite' } },
  tiers: [
    { to: 14, inset: 1.6, face: { kind: 'blank', wall: [0.5, 0.55, 0.45], material: 'concrete' } },
    { to: 0.96, inset: 1.2, face: { kind: 'bands', wall: FED_GRANITE, glass: [0.28, 0.34, 0.36], floor: 4, solid: 0.58, material: 'granite' } },
    { to: 1, face: { kind: 'blank', wall: FED_GRANITE, material: 'granite' } },
  ],
  roof: [0.5, 0.48, 0.47],
  penthouse: 2,
})

/**
 * One California Street (1969): white precast piers the full height of the shaft with dark blue glass between
 * them, the corners cut off, a setback attic storey, and a two-storey podium with a heavy cornice at the
 * street. (Commons: "One California 2021 Corner.jpg", "One California Street, San Francisco.jpg".)
 */
const oneCalifornia = spec({
  height: 140,
  base: { height: 10, face: { kind: 'punched', wall: [0.84, 0.82, 0.78], glass: [0.22, 0.24, 0.27], pitch: 4.5, solid: 0.35, floor: 5, material: 'concrete' }, canopy: { depth: 0.9, colour: [0.84, 0.82, 0.78] } },
  tiers: [
    { to: 0.94, face: { kind: 'fins', wall: [0.87, 0.85, 0.81], glass: [0.23, 0.31, 0.4], pitch: 2.6, solid: 0.42, depth: 0.55, floor: 3.8, material: 'concrete' } },
    { to: 1, inset: 1.4, face: { kind: 'bands', wall: [0.87, 0.85, 0.81], glass: [0.23, 0.31, 0.4], floor: 3.8, solid: 0.55, material: 'concrete' } },
  ],
  roof: [0.5, 0.5, 0.49],
})

/**
 * The banking hall at One Sansome (the Anglo & London Paris National Bank, Albert Pissis, 1910): when the tower
 * was built in 1984 only the hall's classical shell was kept, and its inside became a glass-roofed court. The
 * model is that shell: a screen of tall stone columns under an entablature, with the glass roof behind it.
 * (Commons: "One Sansome Street, San Francisco.jpg", where it stands at the tower's foot.)
 */
function oneSansomeHall(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = heightOf(fit, 14)
  faceBand(out, ring, 0, H - 3.4, { kind: 'fins', wall: [0.84, 0.82, 0.76], glass: [0.22, 0.24, 0.25], pitch: 4.2, solid: 0.34, depth: 0.85, floor: H - 3.4, material: 'ashlar' })
  faceBand(out, ring, H - 3.4, H - 0.8, { kind: 'blank', wall: [0.84, 0.82, 0.76], material: 'ashlar' })
  faceBand(out, insetRing(ring, -0.5), H - 0.8, H, { kind: 'blank', wall: [0.86, 0.84, 0.78], material: 'ashlar' })
  // the glass court roof, a little below the parapet
  const inner = insetRing(ring, 2.6)
  capPolygon(out, inner, H - 1.6, [0.3, 0.42, 0.45], T('glass'))
  // the parapet's own top, as a ring of strips round the court (not a lid over it)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const A = inner[i]
    const B = inner[(i + 1) % inner.length]
    quad(out, [[a.x, H, a.z], [b.x, H, b.z], [B.x, H, B.z], [A.x, H, A.z]], [0, 1, 0], [0.6, 0.58, 0.55], T('ashlar'))
  }
}


// ---------------------------------------------------------------------------------------------------------------
// the towers a block back from Market (California, Pine, Bush, Fremont)

/**
 * 50 California Street (1972): thirty-seven storeys of close cream precast fins, the corners cut at 45°, flat
 * top, nothing else — a fluted cream shaft. (Commons: "50 California Street 2021.jpg".)
 */
const california50 = spec({
  height: 159,
  base: { height: 9, face: { kind: 'curtain', wall: [0.3, 0.3, 0.3], glass: [0.25, 0.27, 0.29], pitch: 3.4, floor: 9 } },
  tiers: [{ to: 1, face: { kind: 'fins', wall: [0.85, 0.83, 0.77], glass: [0.26, 0.28, 0.3], pitch: 1.9, solid: 0.46, depth: 0.45, floor: 3.9, material: 'concrete' } }],
  roof: [0.5, 0.49, 0.47],
})

/**
 * 45 Fremont Center (1978): a white tower of deep horizontal bands, its long sides broken by shallow bays, with
 * a plain parapet. (Commons: "45 Fremont Center.jpg".)
 */
const fremont45 = spec({
  height: 149,
  base: { height: 9, face: { kind: 'curtain', wall: [0.32, 0.32, 0.33], glass: [0.25, 0.27, 0.29], pitch: 3.4, floor: 9 } },
  tiers: [
    { to: 0.97, face: { kind: 'bands', wall: [0.86, 0.85, 0.82], glass: [0.24, 0.27, 0.3], floor: 3.9, solid: 0.5, material: 'concrete' } },
    { to: 1, face: { kind: 'blank', wall: [0.86, 0.85, 0.82], material: 'concrete' } },
  ],
  roof: [0.5, 0.5, 0.49],
})

/**
 * 100 Pine Center (1972): bronze-tan bands of glass and spandrel round a tower whose corners are notched, the top
 * storeys stepping in once. (Commons: "100 Pine Center 2021.jpg".)
 */
const pine100 = spec({
  height: 145,
  base: { height: 8, face: { kind: 'curtain', wall: [0.3, 0.28, 0.26], glass: [0.24, 0.25, 0.26], pitch: 3.4, floor: 8 } },
  tiers: [
    { to: 0.95, face: { kind: 'bands', wall: [0.74, 0.69, 0.58], glass: [0.22, 0.22, 0.22], floor: 3.8, solid: 0.45, material: 'concrete' } },
    { to: 1, inset: 1.5, face: { kind: 'bands', wall: [0.74, 0.69, 0.58], glass: [0.22, 0.22, 0.22], floor: 3.8, solid: 0.5, material: 'concrete' } },
  ],
  roof: [0.45, 0.43, 0.4],
})

/**
 * 225 Bush Street, the old Standard Oil Building (George Kelham, 1922): grey granite, Renaissance palazzo — a
 * two-storey arcade of round arches at the street, a plain shaft, a colonnaded top storey and a heavy cornice.
 * (Commons: "225 Bush Street 2021.jpg".)
 */
const bush225 = spec({
  height: 100,
  base: { height: 11, face: { kind: 'punched', wall: [0.78, 0.77, 0.74], glass: [0.18, 0.2, 0.22], pitch: 5.4, solid: 0.34, floor: 11, arched: true, material: 'granite' } },
  tiers: [
    { to: 14, face: { kind: 'blank', wall: [0.78, 0.77, 0.74], material: 'granite' }, cornice: { depth: 0.7, height: 1 } },
    { to: 0.86, face: { kind: 'punched', wall: [0.8, 0.79, 0.76], glass: WINDOW, pitch: 2.2, solid: 0.5, floor: 3.9, material: 'granite' }, cornice: { depth: 0.4, height: 0.6 } },
    { to: 0.95, face: { kind: 'fins', wall: [0.8, 0.79, 0.76], glass: [0.22, 0.23, 0.24], pitch: 2.4, solid: 0.42, depth: 0.5, floor: 4.2, material: 'granite' } },
    { to: 1, face: { kind: 'blank', wall: [0.8, 0.79, 0.76], material: 'granite' }, cornice: { depth: 2, height: 1.5 } },
  ],
  roof: [0.5, 0.5, 0.48],
})

/**
 * 201 California, the Providian Financial Building (1985): cream precast with a rounded corner tower facing the
 * junction, horizontal bands of dark glass, and a stepped, curved crown. (Commons: "Providian Financial
 * Building.jpg".)
 */
const california201 = spec({
  height: 69,
  base: { height: 8, face: { kind: 'punched', wall: [0.84, 0.82, 0.77], glass: [0.24, 0.27, 0.3], pitch: 4, solid: 0.35, floor: 8, material: 'concrete' } },
  tiers: [
    { to: 0.93, face: { kind: 'bands', wall: [0.86, 0.84, 0.79], glass: [0.24, 0.27, 0.31], floor: 3.8, solid: 0.48, material: 'concrete' } },
    { to: 1, inset: 1.2, face: { kind: 'bands', wall: [0.86, 0.84, 0.79], glass: [0.24, 0.27, 0.31], floor: 3.8, solid: 0.55, material: 'concrete' } },
  ],
  roof: [0.5, 0.5, 0.48],
})


/**
 * 235 Pine Street (1990): a narrow postmodern shaft of grey-brown granite whose middle bays are chevrons —
 * window heads and sills stepped to a point — with slit windows in the flanking piers and a stepped crown.
 * (Commons: "235 Pine Street.jpg".)
 */
const pine235 = spec({
  height: 95,
  base: { height: 12, face: { kind: 'punched', wall: [0.62, 0.58, 0.54], glass: [0.2, 0.22, 0.25], pitch: 3.6, solid: 0.55, floor: 6, material: 'granite' }, canopy: { depth: 0.8, colour: [0.25, 0.25, 0.26] } },
  tiers: [
    { to: 0.93, face: { kind: 'fins', wall: [0.64, 0.6, 0.56], glass: [0.22, 0.3, 0.42], pitch: 2.8, solid: 0.35, depth: 0.5, floor: 3.9, material: 'granite' } },
    { to: 1, inset: 1.2, face: { kind: 'fins', wall: [0.64, 0.6, 0.56], glass: [0.22, 0.3, 0.42], pitch: 2.8, solid: 0.4, depth: 0.5, floor: 3.9, material: 'granite' } },
  ],
  roof: [0.45, 0.43, 0.41],
})

/**
 * The Adam Grant Building, 114 Sansome (Meyer & O'Brien, 1908; four storeys added 1926): a white terracotta
 * Classical Revival block — a two-storey base, a plain shaft with the windows in pairs, a corniced top.
 */
const adamGrant = spec({
  height: 58,
  base: { height: 9, face: { kind: 'punched', wall: [0.84, 0.82, 0.77], glass: [0.2, 0.22, 0.24], pitch: 4.4, solid: 0.35, floor: 9, arched: true, material: 'terracotta' } },
  tiers: [
    { to: 0.88, face: { kind: 'punched', wall: [0.85, 0.83, 0.78], glass: WINDOW, pitch: 2.2, solid: 0.48, floor: 3.8, material: 'terracotta' }, cornice: { depth: 0.4, height: 0.6 } },
    { to: 1, face: { kind: 'punched', wall: [0.85, 0.83, 0.78], glass: WINDOW, pitch: 2.2, solid: 0.5, floor: 3.8, material: 'terracotta' }, cornice: { depth: 1.5, height: 1.3 } },
  ],
  roof: [0.48, 0.46, 0.44],
})

/**
 * The Heineman Building, 130 Bush (MacDonald & Applegarth, 1910): six metres wide and ten storeys tall, the
 * narrowest building downtown, wedged between its neighbours. A Gothic front of grey terracotta with a bay
 * window running the whole height in gold-green metal, and a crocketed gable over it. The model dresses only
 * the street front (the local −z side, which the manifest's `front` turns to the street) and leaves the long
 * party walls plain.
 * (Commons: "Heineman Building, 130 Bush Street, San Francisco 2023-07-18.jpg".)
 */
function heinemanBuilding(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = heightOf(fit, 34)
  const stone: Rgb = [0.78, 0.76, 0.72]
  const bay: Rgb = [0.55, 0.47, 0.25]
  faceBand(out, ring, 0, H, { kind: 'blank', wall: stone, material: 'terracotta' })
  capPolygon(out, ring, H, [0.45, 0.44, 0.42], 0)
  // the front: the short wall whose middle is farthest toward −z
  let front = 0
  let best = Infinity
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const m = (a.z + b.z) / 2
    if (L > 14) continue
    if (m < best) { best = m; front = i }
  }
  const a = ring[front]
  const b = ring[(front + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  // the shopfront, the tall bay window standing 0.8 m proud, and the gable over it
  edgeFace(out, a, b, 0, 6, { kind: 'curtain', wall: [0.3, 0.28, 0.24], glass: [0.24, 0.26, 0.28], pitch: 2.4, floor: 6 })
  edgeFace(out, a, b, 6, H, { kind: 'punched', wall: stone, glass: WINDOW, pitch: 2.4, solid: 0.5, floor: 3.3, material: 'terracotta' })
  const P = (u: number, o: number): P2 => ({ x: a.x + tx * u + nx * o, z: a.z + tz * u + nz * o })
  const bayRing = [P(L * 0.18, 0.05), P(L * 0.82, 0.05), P(L * 0.78, 0.85), P(L * 0.22, 0.85)]
  faceBand(out, towerRing({ hx: 0, hz: 0, height: 0, ring: bayRing }), 6.2, H - 4.5,
    { kind: 'punched', wall: bay, glass: [0.26, 0.3, 0.3], pitch: 1.5, solid: 0.22, floor: 3.3, arched: false, material: 'metal' })
  capPolygon(out, bayRing, H - 4.5, bay, T('metal'))
  // the gable: a stone hood over the bay, with pinnacles either side
  const g0 = P(L * 0.12, 0.6)
  const g1 = P(L * 0.88, 0.6)
  const gm = P(L * 0.5, 0.6)
  triToward(out, [g0.x, H - 4.5, g0.z], [g1.x, H - 4.5, g1.z], [gm.x, H + 1.2, gm.z], stone, [nx, 0, nz], T('terracotta'))
  for (const u of [L * 0.1, L * 0.9]) {
    const p = P(u, 0.35)
    box(out, p.x, H - 2, p.z, 0.5, 3.4, 0.5, stone, T('terracotta'))
    box(out, p.x, H + 1.6, p.z, 0.25, 1.2, 0.25, stone, T('terracotta'))
  }
}


/**
 * The glass kiosk in the sunken plaza at 525 Market (OSM way/1313339504, `building:material=glass`,
 * `roof:shape=skillion`): a small single-storey pavilion of glass under a shallow one-way roof with a deep metal
 * fascia — the plaza's café. Modelled from its OSM shape and tags; it is not the SVB pavilion, which is across
 * Market on Bush Plaza.
 */
function plazaKiosk(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const f = frame(ring)
  const b = bounds(f.uv)
  const h0 = 3.2
  const h1 = 4.4
  const part = new MeshBuilder()
  // the glass walls, the low side toward the frame's −v
  const wall = (u0: number, u1: number, v: number, y1a: number, y1b: number, n: [number, number, number]): void => {
    quad(part, [[u0, 0, v], [u1, 0, v], [u1, y1a, v], [u0, y1b, v]], n, [0.28, 0.4, 0.42], T('glass'))
  }
  wall(b.u0, b.u1, b.v0, h0, h0, [0, 0, -1])
  wall(b.u1, b.u0, b.v1, h1, h1, [0, 0, 1])
  quad(part, [[b.u0, 0, b.v1], [b.u0, 0, b.v0], [b.u0, h0, b.v0], [b.u0, h1, b.v1]], [-1, 0, 0], [0.28, 0.4, 0.42], T('glass'))
  quad(part, [[b.u1, 0, b.v0], [b.u1, 0, b.v1], [b.u1, h1, b.v1], [b.u1, h0, b.v0]], [1, 0, 0], [0.28, 0.4, 0.42], T('glass'))
  // the roof slab, sloping, with its fascia
  const R: Rgb = [0.35, 0.36, 0.37]
  quad(part, [[b.u0 - 0.4, h0 + 0.5, b.v0 - 0.4], [b.u1 + 0.4, h0 + 0.5, b.v0 - 0.4], [b.u1 + 0.4, h1 + 0.5, b.v1 + 0.4], [b.u0 - 0.4, h1 + 0.5, b.v1 + 0.4]], [0, 1, 0], R, T('metal'))
  quad(part, [[b.u1 + 0.4, h0, b.v0 - 0.4], [b.u0 - 0.4, h0, b.v0 - 0.4], [b.u0 - 0.4, h0 + 0.5, b.v0 - 0.4], [b.u1 + 0.4, h0 + 0.5, b.v0 - 0.4]], [0, 0, -1], R, T('metal'))
  quad(part, [[b.u0 - 0.4, h1, b.v1 + 0.4], [b.u1 + 0.4, h1, b.v1 + 0.4], [b.u1 + 0.4, h1 + 0.5, b.v1 + 0.4], [b.u0 - 0.4, h1 + 0.5, b.v1 + 0.4]], [0, 0, 1], R, T('metal'))
  place(out, part, f)
}

// ---------------------------------------------------------------------------------------------------------------
// One Maritime Plaza (300 Clay Street)

const OMP_STEEL: Rgb = [0.16, 0.14, 0.12]
const OMP_GLASS: Rgb = [0.47, 0.54, 0.62]
const OMP_SPANDREL: Rgb = [0.3, 0.31, 0.33]

/**
 * One Maritime Plaza, the Alcoa Building (SOM, 1967), 27 storeys and 121 m over the Golden Gateway garage deck.
 * The one thing anybody names about it is that its seismic frame is OUTSIDE the curtain wall: dark steel belts
 * every few floors, and between each pair of belts a row of great X-braces, so the long faces read as a lattice
 * of diamonds rather than as glass. Without the braces it is an anonymous 1960s slab, which is what the generic
 * `grid` preset made of it (BUGS.md #82).
 *
 * The model is the footprint (a ~64 × 33 m rectangle, the long faces to Battery and Front) raised as a dark
 * curtain wall, with the exoskeleton drawn on top of it in `beam` members standing 0.75 m proud: a column at
 * each corner and at each brace node, a belt at each band boundary, and a full X in every module. Five bands of
 * braces over the braced height — that is what the photographs show; the usual description of "eight storeys per
 * X" would give four. Three X's on each long face, two on each end, from a single module width so the lattice
 * carries round the corners.
 *
 * The garage podium under it is separately mapped (OSM way/1177704958) and covers the whole superblock, so it is
 * not this entry's to draw; the bracing starts at 9 m, clear of it.
 *
 * (Mapillary street views of way/28240176 from Clay Street, fetched by tools/sf-photos.ts: the lattice against
 * dark blue-grey glass, near black in shade and warm bronze in the sun.)
 */
function oneMaritimePlaza(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = heightOf(fit, 121)
  const PODIUM = 9          // the plaza deck over the garage: the braces start clear of it
  const PARAPET = 2.4
  // the top belt runs just under the parapet, so the frame reaches the top of the glass rather than stopping
  // short of it
  const top = H - 0.9

  // the glass box: a dark curtain wall on a recessed lobby storey, flat parapet
  tower(out, fit, {
    height: 121,
    base: { height: PODIUM, face: { kind: 'blank', wall: [0.22, 0.21, 0.2], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'curtain', wall: OMP_SPANDREL, glass: OMP_GLASS, floor: 4.1, pitch: 3.4, material: 'metal' } }],
    roof: [0.3, 0.3, 0.31],
    crown: { kind: 'parapet', height: PARAPET, colour: OMP_STEEL, material: 'metal' },
  })

  // the mechanical penthouse, drawn here rather than by the grammar's `penthouse`, whose box is a hard-coded
  // pale grey (tower.ts) and read as a white lid on a near-black tower
  let cx = 0
  let cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= ring.length
  cz /= ring.length
  box(out, cx, top + 2.4, cz, 7, 2.4, 5, [0.26, 0.25, 0.25], T('metal'))

  // the module: set by the long face, three X's wide, and reused on the ends so the lattice reads as one frame
  let longest = 0
  for (let i = 0; i < ring.length; i++) longest = Math.max(longest, edgeAt(ring, i).L)
  const module = longest / 3
  const BANDS = 5
  const span = (top - PODIUM) / BANDS
  const OUT = 0.75         // how far the frame stands off the glass
  const DEEP = 0.45        // out-of-plane half-thickness of a member
  const WIDE = 0.55        // in-plane half-width of a diagonal

  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 6) continue
    const n = Math.max(1, Math.round(e.L / module))
    const bw = e.L / n
    // a point on this wall, u metres along it from a, y up, standing OUT proud of the glass
    const P = (u: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * OUT, y, e.a.z + e.tz * u + e.nz * OUT]
    // the belts, one at each band boundary and one on top: they carry the braces' thrust and draw the storeys
    for (let k = 0; k <= BANDS; k++) {
      const y = PODIUM + k * span
      beam(out, P(0, y), P(e.L, y), DEEP, OMP_STEEL, k === 0 || k === BANDS ? 0.75 : 0.5)
    }
    // a column at every brace node, the corner ones heavier
    for (let k = 0; k <= n; k++) {
      const r = k === 0 || k === n ? 0.6 : 0.38
      beam(out, P(k * bw, PODIUM), P(k * bw, top), r, OMP_STEEL)
    }
    // and the X in each module of each band
    for (let b = 0; b < BANDS; b++) {
      const y0 = PODIUM + b * span
      const y1 = y0 + span
      for (let k = 0; k < n; k++) {
        const u0 = k * bw
        const u1 = u0 + bw
        beam(out, P(u0, y0), P(u1, y1), DEEP, OMP_STEEL, WIDE)
        beam(out, P(u1, y0), P(u0, y1), DEEP, OMP_STEEL, WIDE)
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------

export const MARKET_EAST: Record<string, Build> = {
  oneMaritimePlaza,
  crownZellerbach,
  bushPlazaPavilion,
  southernPacificBuilding,
  postalTelegraphBuilding,
  hyattRegency,
  matsonBuilding,
  pgeBuilding,
  pgeAnnex,
  market333,
  market388,
  market425,
  firstMarketTower,
  market555,
  chevronTower,
  oneFrontStreet,
  oneSansomeTower,
  montgomery44,
  flatiron544,
  hobartBuilding,
  federalReserve,
  oneCalifornia,
  oneSansomeHall,
  california50,
  fremont45,
  pine100,
  bush225,
  california201,
  pine235,
  adamGrant,
  heinemanBuilding,
  plazaKiosk,
}

void edgeFace
void obox
void soffit
