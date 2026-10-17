/**
 * FISHERMAN'S WHARF, the land side and its interior courts (owner, 2026-10-17: "The Anchor's Landing and other similar
 * interior areas are full of shops and life"; "every store is trying to get your attention… very loud and unique").
 * Built building by building from Mapillary; each builder names its photograph.
 *
 * Buildings claimed from OSM take a numeric `front` B in the manifest: the ring's edge facing local −z then faces
 * bearing B, and local +x points to bearing B−90 (B = 261 puts +x a little east of due south). Point models face
 * local +z, turned by `rotateDeg`.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, EMIT, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign, type SignSpec, type Face } from '../signage.ts'
import { towerRing, faceBand } from '../tower.ts'
import { edgeAt, boxAlong, offsetRing } from '../parts.ts'
import { tube, ellipse, type V3 } from './wharf-carnival.ts'

type P2 = { x: number; z: number }
type Edge = ReturnType<typeof edgeAt>
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const BT = surfaceTag('brick'), CT = surfaceTag('concrete'), MT = surfaceTag('metal'), GT = surfaceTag('glass')
const WT = surfaceTag('clapboard'), FT = surfaceTag('foliage'), ST = surfaceTag('stucco'), AT = surfaceTag('ashlar')
const WARM: Rgb = [1.0, 0.86, 0.55], WHITE: Rgb = [0.96, 0.96, 0.94]

/** a point `u` along edge `e` from its first corner, `y` up, `o` out from the wall (negative: inside) */
const on = (e: Edge, u: number, y: number, o = 0): V3 => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]

/** a box squared to edge `e`: centred `u` along it and `o` out, from `y0` up `h`, `w` along the wall and `d` across it */
function slab(out: MeshBuilder, e: Edge, u: number, o: number, y0: number, w: number, h: number, d: number, c: Rgb, tag: number): void {
  const p = on(e, u, y0 + h / 2, o)
  boxAlong(out, p[0], p[1], p[2], w / 2, h / 2, d / 2, e.heading, c, tag)
}

/** a single flat quad facing out of edge `e` (two triangles, where a slab is twelve): for detail seen only from the front */
function panel(out: MeshBuilder, e: Edge, u: number, o: number, y0: number, w: number, h: number, c: Rgb, tag: number): void {
  out.quad([on(e, u - w / 2, y0, o), on(e, u + w / 2, y0, o), on(e, u + w / 2, y0 + h, o), on(e, u - w / 2, y0 + h, o)], [e.nx, 0, e.nz], UVQ, c, tag)
}

/** a flat sign on edge `e`, its centre `u` along it, `y` up, `o` out */
function signAt(out: MeshBuilder, e: Edge, u: number, y: number, o: number, spec: SignSpec): void {
  const p = on(e, u, y, o)
  sign(out, spec, { x: p[0], y, z: p[2], heading: e.heading })
}

/** the ring's edge (at least `min` long) whose outward normal is nearest the local direction (nx, nz) */
function edgeToward(ring: P2[], nx: number, nz: number, min = 4): number {
  let best = 0, score = -Infinity
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < min) continue
    const s = e.nx * nx + e.nz * nz + e.L * 1e-4
    if (s > score) { score = s; best = i }
  }
  return best
}

/**
 * The street front as ONE straight edge: edge `index`, run out over every corner that lies on or near its line (OSM
 * draws a long frontage as several pieces with little jogs). Copied from wharf-shops.ts.
 */
function frontEdge(ring: P2[], index: number): Edge {
  const e0 = edgeAt(ring, index)
  let u0 = 0, u1 = e0.L, o = 0
  for (const p of ring) {
    const d = (p.x - e0.a.x) * e0.nx + (p.z - e0.a.z) * e0.nz
    if (d < -2.5) continue
    const u = (p.x - e0.a.x) * e0.tx + (p.z - e0.a.z) * e0.tz
    u0 = Math.min(u0, u); u1 = Math.max(u1, u); o = Math.max(o, d)
  }
  const a = { x: e0.a.x + e0.tx * u0 + e0.nx * o, z: e0.a.z + e0.tz * u0 + e0.nz * o }
  const b = { x: e0.a.x + e0.tx * u1 + e0.nx * o, z: e0.a.z + e0.tz * u1 + e0.nz * o }
  return { ...e0, a, b, L: u1 - u0, mid: { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 } }
}

/** the ground under a point of edge `e` over the model's base (0 where the loader did not measure it) */
function groundOn(fit: Fit, e: Edge, u: number, o = 0.6): number {
  const p = on(e, u, 0, o)
  return fit.groundAt ? fit.groundAt(p[0], p[2]) : 0
}

/** a round-topped canvas awning — a quarter barrel with closed ends — over a window: centred `u`, `w` wide, its top at `y` */
function domeAwning(out: MeshBuilder, e: Edge, u: number, w: number, y: number, d: number, c: Rgb, dark: Rgb): void {
  const N = 6
  const P = (s: number, k: number): V3 => { const t = (k / N) * Math.PI / 2; return on(e, u + s * w / 2, y - d * (1 - Math.cos(t)) * 1.1, 0.05 + d * Math.sin(t)) }
  for (let k = 0; k < N; k++) {
    const t = ((k + 0.5) / N) * Math.PI / 2
    out.quad([P(-1, k), P(1, k), P(1, k + 1), P(-1, k + 1)], [e.nx * Math.sin(t), Math.cos(t), e.nz * Math.sin(t)], UVQ, c, WT)
    for (const s of [-1, 1]) {
      const base = on(e, u + s * w / 2, y - d * 1.1, 0.05)
      out.quad([base, P(s, k), P(s, k + 1), P(s, k + 1)], [e.tx * s, 0, e.tz * s], UVQ, dark, WT)
    }
  }
  slab(out, e, u, 0.05 + d - 0.02, y - d * 1.1 - 0.25, w, 0.25, 0.04, c, WT)
}

/**
 * A SEGMENTAL-ARCHED WAREHOUSE WINDOW on edge `e`: a white sash over dark glass with louvred shutters showing pale
 * behind it, a low arch of brick headers proud over it and a stone sill under it.
 */
function warehouseWindow(out: MeshBuilder, e: Edge, u: number, y0: number, w: number, h: number, arch: Rgb, glass: Rgb, sash: Rgb): void {
  // the white frame, the glass inside it, the meeting rail and the muntin, all flat to the wall
  panel(out, e, u, 0.03, y0, w, h, sash, WT)
  panel(out, e, u, 0.05, y0 + 0.08, w - 0.16, h - 0.16, glass, GT)
  panel(out, e, u, 0.06, y0 + h * 0.55, w - 0.16, 0.06, sash, WT)
  panel(out, e, u, 0.06, y0 + 0.08, 0.05, h - 0.16, sash, WT)
  // the segmental arch of headers: three courses stepped up over the opening, proud of the wall
  const aw = (w + 0.4) / 3
  for (let k = 0; k < 3; k++) panel(out, e, u + (k - 1) * aw, 0.05, y0 + h - 0.02 + (k === 1 ? 0.18 : 0.06), aw + 0.02, 0.3, arch, BT)
  slab(out, e, u, 0.08, y0 - 0.12, w + 0.3, 0.12, 0.16, [0.72, 0.68, 0.62], CT)
}

/**
 * THE ARGONAUT HOTEL, the old HASLETT WAREHOUSE, Hyde and Jefferson (way/25372348): the 1909 fruit cannery's warehouse,
 * four storeys of orange-red brick filling the block's Hyde front from Jefferson up to Beach — pilaster strips dividing
 * it into bays, two low segmental-arched windows to a bay on each floor (white sashes, shutters pale behind them),
 * thin string courses at the floors, rows of black iron tie-rod plates along them, a corbelled cornice and a parapet
 * that steps up over the end bays. On the Jefferson & Hyde corner the hotel's blade: a tall navy box with ARGONAUT in
 * white capitals down it, a white cap and a white HOTEL foot, a little pink figure on top (TRIPO.md); on the Hyde
 * parapet by the corner the angled NATIONAL PARK VISITOR CENTER board with four gooseneck lamps over it; at the corner's
 * foot the BLUE MERMAID's white box sign standing off the wall; along Jefferson navy dome awnings over the ground-floor
 * windows, topiary in black planters, carriage lamps; warm uplights at the foot of the piers after dark (Commons
 * "Argonaut Hotel, San Francisco, California, US", "Argonaut Hotel - San Francisco, California", "San Francisco, CA USA
 * - Argonaut Hotel (Haslett Warehouse) - panoramio"; Mapillary 5656549471127981, 4253030981483855).
 * `front` 261 in the manifest: Hyde is the edge facing local −z, Jefferson the one facing local −x.
 */
export function argonautHotel(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.7, 0.34, 0.21], BRICKD: Rgb = [0.56, 0.24, 0.15], ARCH: Rgb = [0.52, 0.2, 0.13]
  const GLASS: Rgb = [0.17, 0.2, 0.23], NAVY: Rgb = [0.1, 0.14, 0.27], IRON: Rgb = [0.1, 0.1, 0.11], STONE: Rgb = [0.74, 0.7, 0.64]
  const ring = towerRing(fit)
  const G = 4.8, F = 3.6, TOP = G + 3 * F, H = TOP + 1.3
  // the wall, the string courses at the floors, the belt over the ground floor, the corbelled cornice
  faceBand(out, ring, 0, H, { kind: 'blank', wall: BRICK, material: 'brick' })
  faceBand(out, offsetRing(ring, 0.1), G - 0.35, G, { kind: 'blank', wall: BRICKD, material: 'brick' })
  for (let k = 1; k < 3; k++) faceBand(out, offsetRing(ring, 0.05), G + k * F - 0.14, G + k * F, { kind: 'blank', wall: BRICKD, material: 'brick' })
  faceBand(out, offsetRing(ring, 0.08), TOP - 0.2, TOP, { kind: 'blank', wall: BRICKD, material: 'brick' })
  faceBand(out, offsetRing(ring, 0.18), TOP, TOP + 0.2, { kind: 'blank', wall: BRICKD, material: 'brick' })
  faceBand(out, offsetRing(ring, 0.3), TOP + 0.2, TOP + 0.45, { kind: 'blank', wall: BRICKD, material: 'brick' })
  faceBand(out, offsetRing(ring, 0.06), H - 0.15, H, { kind: 'blank', wall: STONE, material: 'concrete' })
  capPolygon(out, ring, H - 0.3, [0.4, 0.38, 0.36], CT)

  const iHyde = edgeToward(ring, 0, -1, 10), iJeff = edgeToward(ring, -1, 0, 8)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 6) continue
    const street = i === iHyde || i === iJeff
    const nb = Math.max(1, Math.round(e.L / 10.4)), bw = e.L / nb
    for (let b = 0; b <= nb; b++) {
      const pu = Math.min(e.L - 0.35, Math.max(0.35, b * bw))
      slab(out, e, pu, 0.08, 0, 0.7, TOP, 0.16, BRICK, BT)                                  // the pilaster strip
      if (b === 0 || b === nb) slab(out, e, pu, 0.08, TOP + 0.45, 0.9, 1.45, 0.2, BRICK, BT) // and the parapet stepping up over the end bays
      if (street) {
        // an uplight at its foot, warm at night
        const g = groundOn(fit, e, pu)
        slab(out, e, pu, 0.3, g, 0.3, 0.18, 0.25, WARM, EMIT)
      }
    }
    for (let b = 0; b < nb; b++) {
      const cu = (b + 0.5) * bw
      if (b === 0 || b === nb - 1) slab(out, e, cu, 0.03, H, bw - 0.7, 0.6, 0.3, BRICK, BT)   // the stepped end parapets
      for (const s of [-1, 1]) {
        const u = cu + s * bw * 0.24
        // the upper floors
        for (let f = 0; f < 3; f++) warehouseWindow(out, e, u, G + f * F + 0.8, 1.15, 2.15, ARCH, GLASS, WHITE)
        // the ground floor: taller openings, the ones up the slope only where the pavement lets them be
        const g = groundOn(fit, e, u)
        if (g < 1.2) warehouseWindow(out, e, u, Math.max(0.9, g + 0.6), 1.3, 2.6 - Math.max(0, g - 0.3), ARCH, GLASS, street ? [0.12, 0.12, 0.13] : WHITE)
        // the tie-rod plates along each floor line, between the pairs and either side
        for (let f = 1; f <= 3; f++) {
          const p = on(e, cu + s * bw * 0.46, G + (f - 1) * F + 0.35, 0.1)
          panel(out, e, cu + s * bw * 0.46, 0.1, p[1] - 0.15, 0.3, 0.3, IRON, MT)
        }
      }
    }
  }

  const hy = edgeAt(ring, iHyde), je = edgeAt(ring, iJeff)
  // the corner both share: Hyde's end nearest Jefferson
  const dA = Math.hypot(hy.a.x - je.mid.x, hy.a.z - je.mid.z), dB = Math.hypot(hy.b.x - je.mid.x, hy.b.z - je.mid.z)
  const cornerU = dA < dB ? 0 : hy.L, dir = dA < dB ? 1 : -1                                  // and which way along Hyde runs up the hill
  const C = on(hy, cornerU, 0, 0)

  // -- THE ARGONAUT BLADE, standing out square from the Hyde wall at the corner, lettered on its north and south faces
  {
    const bu = cornerU + dir * 0.9
    const P = on(hy, bu, 0, 1.55)
    const bx = P[0], bz = P[2], dx = hy.nx, dz = hy.nz
    const faceHd = hy.heading + Math.PI / 2
    const Y0 = 7.6, Y1 = 14.6, ym = (Y0 + 0.6 + Y1) / 2, hh = (Y1 - Y0 - 0.6) / 2
    boxAlong(out, bx, ym, bz, 0.7, hh + 0.05, 0.19, faceHd, WHITE, MT)
    boxAlong(out, bx, ym, bz, 0.62, hh - 0.08, 0.24, faceHd, NAVY, MT)
    boxAlong(out, bx, Y0 + 0.3, bz, 0.95, 0.3, 0.3, faceHd, WHITE, MT)                              // the HOTEL foot
    boxAlong(out, bx, Y1 + 0.35, bz, 1.0, 0.35, 0.4, faceHd, [0.85, 0.86, 0.88], MT)               // the cap
    boxAlong(out, bx, Y1 + 0.78, bz, 1.1, 0.08, 0.5, faceHd, WHITE, MT)
    boxAlong(out, bx, Y1 + 0.95, bz, 0.18, 0.1, 0.18, faceHd, [0.3, 0.3, 0.32], MT)                // the figure's plinth (the figure: TRIPO.md)
    const W0 = on(hy, bu, 0, 0)
    for (const y of [Y0 + 1.2, Y1 - 0.8]) tube(out, [W0[0], y, W0[2]], [bx - dx * 0.7, y, bz - dz * 0.7], 0.05, 5, IRON, MT)
    for (const sd of [1, -1]) {
      const h2 = faceHd + (sd > 0 ? 0 : Math.PI)
      const ox = Math.sin(h2) * 0.25, oz = Math.cos(h2) * 0.25
      'ARGONAUT'.split('').forEach((ch, k) => sign(out, { type: 'flat', text: ch, h: 0.52, w: 0.9, face: 'didone', colour: [0.97, 0.97, 0.95], lit: 'self' },
        { x: bx + ox, y: Y1 - 0.75 - k * 0.74, z: bz + oz, heading: h2 }))
      sign(out, { type: 'flat', text: 'HOTEL', h: 0.3, w: 1.6, face: 'didone', colour: NAVY, lit: 'front', tracking: 0.12 }, { x: bx + ox * 1.25, y: Y0 + 0.3, z: bz + oz * 1.25, heading: h2 })
    }
  }

  // -- THE VISITOR CENTER BOARD, leaning back on the Hyde parapet near the corner, four gooseneck lamps over it
  {
    const vu = cornerU + dir * 11
    for (const d of [-3, 3]) slab(out, hy, vu + d, -0.5, H - 0.3, 0.12, 1.0, 0.12, [0.35, 0.35, 0.37], MT)
    slab(out, hy, vu, -0.25, H + 0.6, 7.2, 1.15, 0.12, [0.9, 0.9, 0.88], MT)
    slab(out, hy, vu, -0.45, H + 0.55, 7.3, 1.25, 0.2, [0.35, 0.35, 0.37], MT)
    signAt(out, hy, vu, H + 1.18, -0.17, { type: 'flat', text: 'National Park Visitor Center', h: 0.36, w: 6.6, face: 'grotesque', weight: 'bold', colour: [0.18, 0.2, 0.22], lit: 'front' })
    for (const d of [-2.7, -0.9, 0.9, 2.7]) {
      const p0 = on(hy, vu + d, H + 1.8, -0.45), p1 = on(hy, vu + d, H + 3.0, -0.45), p2 = on(hy, vu + d, H + 2.9, 0.2)
      tube(out, p0, p1, 0.04, 5, [0.55, 0.57, 0.6], MT)
      tube(out, p1, p2, 0.04, 5, [0.55, 0.57, 0.6], MT)
      box(out, p2[0], p2[1] - 0.12, p2[2], 0.17, 0.09, 0.17, [0.55, 0.57, 0.6], MT)
      box(out, p2[0], p2[1] - 0.23, p2[2], 0.1, 0.02, 0.1, WARM, EMIT)
    }
  }

  // -- THE BLUE MERMAID: a white box sign standing out square from the Hyde wall near the corner, lettered both faces
  {
    const mu = cornerU + dir * 4.0, g = groundOn(fit, hy, mu)
    const p = on(hy, mu, g + 3.6, 1.35)
    const sideHd = hy.heading + Math.PI / 2
    boxAlong(out, p[0], p[1], p[2], 1.3, 0.56, 0.15, sideHd, NAVY, MT)
    boxAlong(out, p[0], p[1], p[2], 1.2, 0.46, 0.2, sideHd, WHITE, MT)
    for (const sd of [1, -1]) {
      const h2 = sideHd + (sd > 0 ? 0 : Math.PI)
      const ox = Math.sin(h2) * 0.21, oz = Math.cos(h2) * 0.21
      sign(out, { type: 'flat', text: 'BLUE MERMAID', h: 0.26, w: 2.2, face: 'roman', weight: 'bold', colour: [0.1, 0.25, 0.55], lit: 'front' }, { x: p[0] + ox, y: p[1] + 0.13, z: p[2] + oz, heading: h2 })
      sign(out, { type: 'flat', text: 'CHOWDER HOUSE & BAR', h: 0.11, w: 2.0, face: 'grotesque', weight: 'bold', colour: [0.12, 0.12, 0.14], lit: 'front' }, { x: p[0] + ox, y: p[1] - 0.25, z: p[2] + oz, heading: h2 })
    }
    tube(out, on(hy, mu, g + 4.3, 0.05), on(hy, mu, g + 4.15, 2.5), 0.04, 5, IRON, MT)
    // the park service's brown plate on the wall beside it
    slab(out, hy, mu + dir * 1.8, 0.05, g + 2.3, 1.6, 0.7, 0.05, [0.36, 0.25, 0.16], MT)
    signAt(out, hy, mu + dir * 1.8, g + 2.65, 0.09, { type: 'flat', text: 'VISITOR CENTER', h: 0.13, w: 1.4, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'front' })
  }

  // -- JEFFERSON: navy dome awnings over the ground-floor windows, carriage lamps, topiary in black planters, the lobby's sign
  {
    const nb = Math.max(1, Math.round(je.L / 10.4)), bw = je.L / nb
    for (let b = 0; b < nb; b++) for (const s of [-1, 1]) {
      const u = (b + 0.5) * bw + s * bw * 0.24, g = groundOn(fit, je, u)
      if (g > 1.0) continue
      domeAwning(out, je, u, 1.9, Math.max(0.9, g + 0.6) + 2.85, 0.75, NAVY, [0.07, 0.1, 0.2])
      if (s > 0 && b < nb - 1) {
        const lp = on(je, u + bw * 0.26, g + 2.9, 0.25)
        box(out, lp[0], lp[1], lp[2], 0.14, 0.22, 0.14, IRON, MT)
        box(out, lp[0], lp[1], lp[2], 0.1, 0.16, 0.1, WARM, EMIT)
        // a spiral topiary in a black box planter against the pier
        const tp = on(je, u + bw * 0.26, g, 0.7)
        boxAlong(out, tp[0], g + 0.35, tp[2], 0.38, 0.35, 0.38, je.heading, [0.08, 0.08, 0.09], WT)
        for (let k = 0; k < 4; k++) box(out, tp[0], g + 0.9 + k * 0.42, tp[2], 0.3 - k * 0.05, 0.16, 0.3 - k * 0.05, [0.17, 0.33, 0.14], FT)
      }
    }
    // the lobby's own sign over its door, out from the wall a bay in from the corner
    const nearA = Math.hypot(je.a.x - C[0], je.a.z - C[2]) < Math.hypot(je.b.x - C[0], je.b.z - C[2])
    const lu = nearA ? bw : je.L - bw, g = groundOn(fit, je, lu)
    const p = on(je, lu, g + 4.1, 1.0), sideHd = je.heading + Math.PI / 2
    boxAlong(out, p[0], p[1], p[2], 0.75, 0.4, 0.1, sideHd, WHITE, MT)
    for (const sd of [1, -1]) {
      const h2 = sideHd + (sd > 0 ? 0 : Math.PI)
      sign(out, { type: 'flat', text: 'ARGONAUT', h: 0.2, w: 1.35, face: 'didone', colour: NAVY, lit: 'front' }, { x: p[0] + Math.sin(h2) * 0.12, y: p[1] + 0.1, z: p[2] + Math.cos(h2) * 0.12, heading: h2 })
      sign(out, { type: 'flat', text: 'HOTEL', h: 0.12, w: 1.0, face: 'didone', colour: NAVY, lit: 'front', tracking: 0.2 }, { x: p[0] + Math.sin(h2) * 0.12, y: p[1] - 0.2, z: p[2] + Math.cos(h2) * 0.12, heading: h2 })
    }
    tube(out, on(je, lu, g + 4.55, 0.05), on(je, lu, g + 4.55, 1.8), 0.035, 5, IRON, MT)
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// THE LOUD SHOPFRONT: every Wharf shop "trying to get your attention" (owner, 2026-10-17) — a glass front in a coloured
// frame, and over it one of the sign kinds the photographs show again and again: a painted fascia board, a lit box,
// neon on a black board, a board ringed with bulbs, a striped awning, script letters on the wall, the eyebrow canopy
// of the renovated Anchor's Landing. Optional: a blade sign hung off the wall, a rack of T-shirts and an A-frame board
// on the pavement. Every lettering has a `w`, so no name can overrun its board.
// ---------------------------------------------------------------------------------------------------------------------

export type SignKind = 'board' | 'box' | 'neon' | 'bulbs' | 'awning' | 'script' | 'eyebrow'
export interface Shop {
  name: string
  sub?: string
  sign: SignKind
  /** the board / awning / neon colour */
  c: Rgb
  /** the letters' colour (for neon and script: ignored, the letters are `c`) */
  ink?: Rgb
  face?: Face
  /** the shopfront frame and bulkhead */
  frame?: Rgb
  /** the awning's second stripe */
  stripe?: Rgb
  /** a blade sign off the wall with this text */
  blade?: string
  /** a rack of goods and an A-frame board out on the pavement */
  goods?: boolean
}

const TEE: Rgb[] = [[0.9, 0.15, 0.15], [0.98, 0.8, 0.2], [0.15, 0.4, 0.8], [0.95, 0.95, 0.95], [0.1, 0.1, 0.12], [0.2, 0.65, 0.35], [0.95, 0.45, 0.65], [0.55, 0.3, 0.7]]

/** one shop on edge `e`, centred `u`, `w` wide, its floor at `y`, its front `H` tall to the top of its sign */
export function loudShop(out: MeshBuilder, e: Edge, u: number, w: number, y: number, H: number, s: Shop, seed = 0): void {
  const frame = s.frame ?? [0.1, 0.1, 0.11], ink = s.ink ?? WHITE
  const gl: Rgb = [0.22, 0.25, 0.27]
  const sy = y + H - 0.95                                                            // the sign band's foot
  // the front: bulkhead, glass, mullions, the door, a warm strip of interior light along the top of the glass
  slab(out, e, u, 0.04, y, w - 0.2, 0.45, 0.1, frame, MT)
  panel(out, e, u, 0.05, y + 0.45, w - 0.3, sy - y - 0.55, gl, GT)
  for (const k of [-0.5, 0.5]) slab(out, e, u + k * (w - 0.3), 0.08, y, 0.12, sy - y - 0.05, 0.08, frame, MT)
  const mid = Math.max(1, Math.round(w / 2.4))
  for (let k = 1; k < mid; k++) panel(out, e, u - (w - 0.3) / 2 + (k * (w - 0.3)) / mid, 0.08, y + 0.45, 0.07, sy - y - 0.5, frame, MT)
  slab(out, e, u, 0.08, sy - 0.12, w - 0.3, 0.1, 0.08, frame, MT)
  const du = u + ((seed % 2) ? 1 : -1) * Math.max(0, w / 2 - 1.0)
  slab(out, e, du, 0.06, y, 1.0, 2.25, 0.05, [0.14, 0.15, 0.16], MT)
  panel(out, e, u, 0.07, sy - 0.32, w - 0.5, 0.06, WARM, EMIT)
  // the merchandise behind the glass, read as colour: a few shelves of bright boxes
  for (let r = 0; r < 2; r++) for (let k = 0; k < Math.floor((w - 1.6) / 0.6); k++) {
    const uu = u - (w - 1.6) / 2 + 0.3 + k * 0.6
    if (Math.abs(uu - du) < 0.7) continue
    panel(out, e, uu, 0.075, y + 0.6 + r * 0.75, 0.42, 0.5, TEE[(k + r * 3 + seed) % TEE.length], MT)
  }
  const bw = w - 0.3, tw = w - 0.9
  const face = s.face ?? 'grotesque'
  switch (s.sign) {
    case 'board':
      slab(out, e, u, 0.1, sy, bw, 0.95, 0.14, s.c, WT)
      signAt(out, e, u, sy + (s.sub ? 0.58 : 0.47), 0.18, { type: 'flat', text: s.name, h: s.sub ? 0.36 : 0.46, w: tw, face, weight: 'bold', colour: ink, lit: 'front' })
      if (s.sub) signAt(out, e, u, sy + 0.2, 0.18, { type: 'flat', text: s.sub, h: 0.15, w: tw, face: 'grotesque', weight: 'bold', colour: ink, lit: 'front' })
      break
    case 'box': {
      slab(out, e, u, 0.25, sy - 0.05, bw, 1.05, 0.45, s.c, MT)
      slab(out, e, u, 0.48, sy + 0.02, bw - 0.12, 0.91, 0.02, s.c, EMIT)
      signAt(out, e, u, sy + (s.sub ? 0.6 : 0.47), 0.5, { type: 'flat', text: s.name, h: s.sub ? 0.38 : 0.5, w: tw, face, weight: 'bold', colour: ink, lit: 'back' })
      if (s.sub) signAt(out, e, u, sy + 0.2, 0.5, { type: 'flat', text: s.sub, h: 0.15, w: tw, face: 'grotesque', weight: 'bold', colour: ink, lit: 'back' })
      break
    }
    case 'neon': {
      slab(out, e, u, 0.1, sy - 0.05, bw, 1.05, 0.12, [0.06, 0.06, 0.08], MT)
      signAt(out, e, u, sy + (s.sub ? 0.6 : 0.47), 0.17, { type: 'flat', text: s.name, h: s.sub ? 0.4 : 0.5, w: tw, face: s.face ?? 'script', colour: s.c, lit: 'self' })
      if (s.sub) signAt(out, e, u, sy + 0.2, 0.17, { type: 'flat', text: s.sub, h: 0.15, w: tw, face: 'grotesque', weight: 'bold', colour: s.c, lit: 'self' })
      // the neon tube round the board
      const n2 = s.stripe ?? s.c
      slab(out, e, u, 0.17, sy - 0.0, bw - 0.12, 0.035, 0.03, n2, EMIT)
      slab(out, e, u, 0.17, sy + 0.92, bw - 0.12, 0.035, 0.03, n2, EMIT)
      for (const k of [-0.5, 0.5]) slab(out, e, u + k * (bw - 0.12), 0.17, sy, 0.035, 0.95, 0.03, n2, EMIT)
      break
    }
    case 'bulbs': {
      slab(out, e, u, 0.12, sy - 0.1, bw, 1.15, 0.18, s.c, MT)
      signAt(out, e, u, sy + (s.sub ? 0.6 : 0.47), 0.23, { type: 'flat', text: s.name, h: s.sub ? 0.36 : 0.44, w: tw - 0.3, face, weight: 'bold', colour: ink, lit: 'front' })
      if (s.sub) signAt(out, e, u, sy + 0.2, 0.23, { type: 'flat', text: s.sub, h: 0.14, w: tw - 0.3, face: 'grotesque', weight: 'bold', colour: ink, lit: 'front' })
      const L0 = u - bw / 2 + 0.1, L1 = u + bw / 2 - 0.1
      bulbRow(out, on(e, L0, sy - 0.02, 0.23), on(e, L1, sy - 0.02, 0.23), 0.22)
      bulbRow(out, on(e, L0, sy + 0.98, 0.23), on(e, L1, sy + 0.98, 0.23), 0.22)
      bulbRow(out, on(e, L0, sy - 0.02, 0.23), on(e, L0, sy + 0.98, 0.23), 0.22)
      bulbRow(out, on(e, L1, sy - 0.02, 0.23), on(e, L1, sy + 0.98, 0.23), 0.22)
      break
    }
    case 'awning': {
      const st = s.stripe ?? WHITE, ay = sy + 0.25, d = 1.3
      const n = Math.max(3, Math.round(bw / 0.5))
      for (let k = 0; k < n; k++) {
        const u0 = u - bw / 2 + (bw * k) / n, u1 = u - bw / 2 + (bw * (k + 1)) / n
        out.quad([on(e, u0, ay + 0.75, 0.05), on(e, u1, ay + 0.75, 0.05), on(e, u1, ay, d), on(e, u0, ay, d)], [e.nx * 0.6, 0.8, e.nz * 0.6], UVQ, k % 2 ? st : s.c, WT)
        slab(out, e, (u0 + u1) / 2, d, ay - 0.35, u1 - u0, 0.35, 0.03, k % 2 ? st : s.c, WT)
      }
      slab(out, e, u, d + 0.03, ay - 0.33, bw * 0.8, 0.3, 0.02, s.c, WT)
      signAt(out, e, u, ay - 0.18, d + 0.06, { type: 'flat', text: s.name, h: 0.18, w: bw * 0.75, face: 'grotesque', weight: 'bold', colour: ink, lit: 'front' })
      // and a board over the awning with the name large
      slab(out, e, u, 0.08, ay + 0.85, bw, 0.75, 0.1, s.c, WT)
      signAt(out, e, u, ay + 1.22, 0.14, { type: 'flat', text: s.name, h: 0.38, w: tw, face, weight: 'bold', colour: ink, lit: 'front' })
      break
    }
    case 'script':
      signAt(out, e, u, sy + 0.5, 0.06, { type: 'flat', text: s.name, h: 0.6, w: tw, face: s.face ?? 'script', colour: s.c, lit: 'self', halo: [0.05, 0.05, 0.06] })
      if (s.sub) signAt(out, e, u, sy + 0.05, 0.06, { type: 'flat', text: s.sub, h: 0.15, w: tw, face: 'grotesque', weight: 'bold', colour: s.c, lit: 'self' })
      break
    case 'eyebrow': {
      // a thin canopy standing out over the door, lettered along its front edge, lit from under
      slab(out, e, u, 0.6, sy + 0.05, bw, 0.3, 1.2, s.c, MT)
      slab(out, e, u, 0.6, sy + 0.03, bw - 0.2, 0.02, 1.1, WARM, EMIT)
      signAt(out, e, u, sy + 0.2, 1.22, { type: 'flat', text: s.name.toUpperCase(), h: 0.17, w: tw, face: 'grotesque', weight: 'bold', colour: ink, lit: 'back' })
      signAt(out, e, u, sy + 0.62, 0.06, { type: 'flat', text: s.name, h: 0.4, w: tw, face, weight: 'bold', colour: s.c, lit: 'self' })
      break
    }
  }
  if (s.blade) {
    // a blade sign on an iron arm, hung square off the wall at the shop's edge
    const bu = u + ((seed % 2) ? -1 : 1) * (w / 2 - 0.4)
    const p = on(e, bu, y + H + 0.2, 0.95), hd = e.heading + Math.PI / 2
    tube(out, on(e, bu, y + H + 0.85, 0.02), on(e, bu, y + H + 0.85, 1.75), 0.03, 4, [0.1, 0.1, 0.1], MT)
    boxAlong(out, p[0], p[1], p[2], 0.75, 0.55, 0.06, hd, s.c, MT)
    for (const sd of [1, -1]) {
      const h2 = hd + (sd > 0 ? 0 : Math.PI)
      sign(out, { type: 'flat', text: s.blade, h: 0.24, w: 1.3, face, weight: 'bold', colour: ink, lit: 'front' }, { x: p[0] + Math.sin(h2) * 0.07, y: p[1], z: p[2] + Math.cos(h2) * 0.07, heading: h2 })
    }
  }
  if (s.goods) {
    // a rolling rack of T-shirts and sweatshirts, and an A-frame board, out on the pavement
    const ru = u + ((seed % 2) ? -1 : 1) * Math.min(w / 2 - 0.9, 1.3)
    for (const k of [-0.6, 0.6]) slab(out, e, ru + k, 0.75, y, 0.05, 1.6, 0.05, [0.6, 0.6, 0.62], MT)
    slab(out, e, ru, 0.75, y + 1.55, 1.25, 0.05, 0.05, [0.6, 0.6, 0.62], MT)
    for (let k = 0; k < 6; k++) slab(out, e, ru - 0.5 + k * 0.2, 0.75, y + 0.75, 0.05, 0.75, 0.6, TEE[(k + seed) % TEE.length], WT)
    const ap = on(e, u - ((seed % 2) ? -1 : 1) * Math.min(w / 2 - 0.6, 1.4), y, 1.1)
    boxAlong(out, ap[0], y + 0.5, ap[2], 0.3, 0.5, 0.18, e.heading, [0.12, 0.12, 0.13], WT)
    boxAlong(out, ap[0] + e.nx * 0.19, y + 0.55, ap[2] + e.nz * 0.19, 0.25, 0.38, 0.01, e.heading, TEE[(seed + 3) % TEE.length], WT)
  }
}

/** a row of lit bulbs from p0 to p1 about `step` apart */
function bulbRow(out: MeshBuilder, p0: V3, p1: V3, step: number, s = 0.05, c: Rgb = WARM): void {
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2])
  const n = Math.max(1, Math.round(L / step))
  for (let k = 0; k <= n; k++) {
    const t = k / n
    box(out, p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t, s, s, s, c, EMIT)
  }
}

/** lay `shops` along edge `e` from `u0` to `u1`, widths in proportion to their `w` weights */
export function shopRow(out: MeshBuilder, e: Edge, u0: number, u1: number, y: number, H: number, shops: (Shop & { w?: number })[], seed = 0): void {
  const tot = shops.reduce((a, s) => a + (s.w ?? 1), 0)
  let u = u0
  shops.forEach((s, k) => {
    const w = ((u1 - u0) * (s.w ?? 1)) / tot
    if (w > 2.2) loudShop(out, e, u + w / 2, w - 0.15, y, H, s, seed + k)
    // a pier between shops
    slab(out, e, u, 0.06, y, 0.3, H + 0.05, 0.14, [0.85, 0.84, 0.8], CT)
    u += w
  })
  slab(out, e, u1, 0.06, y, 0.3, H + 0.05, 0.14, [0.85, 0.84, 0.8], CT)
}

/** the world bearing (degrees) an edge faces, for a claimed building whose manifest `front` is `front` */
function bearingOf(e: Edge, front: number): number {
  return (((front - (Math.atan2(e.nx, -e.nz) * 180) / Math.PI) % 360) + 360) % 360
}
const near = (a: number, b: number, tol = 25): boolean => Math.abs(((a - b + 540) % 360) - 180) < tol

/** lift everything a builder draws to the street's level at its front (copied from wharf-shops.ts `graded`) */
function graded(build: (out: MeshBuilder, fit: Fit) => void, skirt: Rgb = [0.42, 0.4, 0.38]): (out: MeshBuilder, fit: Fit) => void {
  return (out, fit) => {
    const g = fit.grade ?? 0
    if (Math.abs(g) < 0.1) { build(out, fit); return }
    const v0 = out.positions.length / 3
    build(out, { ...fit, grade: 0, groundAt: fit.groundAt ? (x, z) => fit.groundAt!(x, z) - g : undefined })
    for (let i = v0; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += g
    if (g > 0 && fit.ring) faceBand(out, towerRing(fit), 0, g + 0.05, { kind: 'blank', wall: skirt, material: 'concrete' })
  }
}

/** a string of festoon bulbs sagging from p0 to p1: the wire a thin ribbon, each bulb two crossed quads (cheap: six triangles a bulb) */
function festoon(out: MeshBuilder, p0: V3, p1: V3, sag: number, step = 0.6, c: Rgb = WARM): void {
  const L = Math.hypot(p1[0] - p0[0], p1[2] - p0[2])
  const n = Math.max(2, Math.round(L / step))
  const tx = (p1[0] - p0[0]) / (L || 1), tz = (p1[2] - p0[2]) / (L || 1)
  const P = (t: number): V3 => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t - sag * 4 * t * (1 - t), p0[2] + (p1[2] - p0[2]) * t]
  for (let k = 0; k < n; k++) {
    const a = P(k / n), b = P((k + 1) / n)
    out.quad([a, b, [b[0], b[1] - 0.025, b[2]], [a[0], a[1] - 0.025, a[2]]], [-tz, 0, tx], UVQ, [0.08, 0.08, 0.08], MT)
    const m = b, r = 0.06
    out.quad([[m[0] - tx * r, m[1] - 0.16, m[2] - tz * r], [m[0] + tx * r, m[1] - 0.16, m[2] + tz * r], [m[0] + tx * r, m[1] - 0.04, m[2] + tz * r], [m[0] - tx * r, m[1] - 0.04, m[2] - tz * r]], [-tz, 0, tx], UVQ, c, EMIT)
    out.quad([[m[0] + tz * r, m[1] - 0.16, m[2] - tx * r], [m[0] - tz * r, m[1] - 0.16, m[2] + tx * r], [m[0] - tz * r, m[1] - 0.04, m[2] + tx * r], [m[0] + tz * r, m[1] - 0.04, m[2] - tx * r]], [tx, 0, tz], UVQ, c, EMIT)
  }
}

/** a line of triangular pennants sagging from p0 to p1, in the colours given */
function pennants(out: MeshBuilder, p0: V3, p1: V3, sag: number, cols: Rgb[]): void {
  const L = Math.hypot(p1[0] - p0[0], p1[2] - p0[2])
  const n = Math.max(2, Math.round(L / 0.45))
  const tx = (p1[0] - p0[0]) / L, tz = (p1[2] - p0[2]) / L
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 0.8) / n, tm = (t0 + t1) / 2
    const P = (t: number): V3 => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t - sag * 4 * t * (1 - t), p0[2] + (p1[2] - p0[2]) * t]
    const a = P(t0), b = P(t1), m = P(tm)
    const tip: V3 = [m[0], m[1] - 0.4, m[2]]
    out.quad([a, b, tip, tip], [-tz, 0, tx], UVQ, cols[k % cols.length], WT)
    out.quad([b, a, tip, tip], [tz, 0, -tx], UVQ, cols[k % cols.length], WT)
  }
  for (let k = 0; k < n; k++) {
    const P = (t: number): V3 => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t - sag * 4 * t * (1 - t), p0[2] + (p1[2] - p0[2]) * t]
    tube(out, P(k / n), P((k + 1) / n), 0.01, 3, [0.2, 0.2, 0.2], MT)
  }
}

/** a café table, two chairs and (sometimes) a market umbrella, at (x, z) of the model's own frame */
function cafeSet(out: MeshBuilder, x: number, z: number, y: number, umb: Rgb | null, chair: Rgb = [0.12, 0.12, 0.13]): void {
  prism(out, x, z, y, y + 0.72, 0.035, 6, [0.15, 0.15, 0.15], MT)
  prism(out, x, z, y + 0.72, y + 0.75, 0.4, 10, [0.85, 0.85, 0.83], MT)
  for (const s of [-1, 1]) {
    box(out, x + s * 0.65, y + 0.23, z, 0.2, 0.22, 0.2, chair, MT)
    box(out, x + s * 0.83, y + 0.65, z, 0.03, 0.22, 0.2, chair, MT)
  }
  if (umb) {
    prism(out, x, z, y + 0.75, y + 2.45, 0.025, 5, [0.75, 0.75, 0.75], MT)
    prism(out, x, z, y + 2.05, y + 2.45, 1.25, 8, umb, WT, 0.05)
  }
}

/** a big square planter of shrubs and flowers */
function planter(out: MeshBuilder, x: number, z: number, y: number, r: number, box0: Rgb = [0.3, 0.22, 0.16]): void {
  box(out, x, y + 0.3, z, r, 0.3, r, box0, WT)
  box(out, x, y + 0.75, z, r * 0.85, 0.25, r * 0.85, [0.2, 0.38, 0.16], FT)
  for (let k = 0; k < 5; k++) {
    const a = k * 1.3
    box(out, x + Math.cos(a) * r * 0.5, y + 1.0, z + Math.sin(a) * r * 0.5, 0.12, 0.08, 0.12, TEE[(k * 3) % TEE.length], FT)
  }
}

/**
 * ANCHOR'S LANDING's GARAGE, the "Anchorage Square" block between the court and Jones (way/93422616; the complex was
 * renamed Anchor's Landing after its 2025–26 refit, ConnectCRE 2026-05-12): five parking decks screened in WHITE
 * VERTICAL SLATS with runs of orange, yellow and blue slats among them (Mapillary 745127851719920, 930120291283976,
 * 4083085165281111, 960351189566181), the complex's name in big letters along the top of the Jones face, a yellow stair
 * tower at Jones & Beach, the ANCHORAGE parking entrance with its EXIT sign on Beach; under the decks on Jefferson a row
 * of shops with black frames and an orange eyebrow band (IT'SUGAR, Little Sweet, California City Wear), and down the
 * narrow lane to the court more of them. `front` 351: Jefferson is the edge facing local −z.
 */
export function anchorsLandingGarage(out: MeshBuilder, fit: Fit): void {
  const FRONT = 351
  const ring = towerRing(fit)
  const G = 4.4, DECK = 2.75, ND = 4, H = G + ND * DECK + 0.9
  const SLAT: Rgb = [0.9, 0.91, 0.9], DECKC: Rgb = [0.72, 0.72, 0.7], DARK: Rgb = [0.22, 0.23, 0.24]
  const ACC: Rgb[] = [[0.93, 0.5, 0.18], [0.96, 0.78, 0.22], [0.2, 0.42, 0.75], [0.5, 0.7, 0.88]]
  // the dark decks behind the screen, the deck edges, the roof
  faceBand(out, offsetRing(ring, -0.6), G, H, { kind: 'blank', wall: DARK, material: 'concrete' })
  faceBand(out, ring, 0, G, { kind: 'blank', wall: [0.86, 0.85, 0.82], material: 'stucco' })
  for (let k = 0; k <= ND; k++) faceBand(out, offsetRing(ring, -0.1), G + k * DECK - 0.35, G + k * DECK, { kind: 'blank', wall: DECKC, material: 'concrete' })
  capPolygon(out, offsetRing(ring, -0.6), H - 0.9, [0.45, 0.45, 0.45], CT)
  faceBand(out, ring, H - 0.9, H, { kind: 'blank', wall: SLAT, material: 'metal' })
  // the slats, deck by deck: a run of a colour every so often, seeded by position
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 3) continue
    const n = Math.floor(e.L / 0.42)
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) * (e.L / n)
      const run = Math.floor(k / 5) * 7 + i * 13
      const c = (run * 2654435761 >>> 0) % 7 < 2 ? ACC[(run >>> 3) % ACC.length] : SLAT
      for (let d = 0; d < ND; d++) {
        const c2 = (d + run) % 3 === 0 && c !== SLAT ? SLAT : c
        panel(out, e, u, 0.1, G + d * DECK, 0.16, DECK - 0.35, c2, MT)
      }
      // a strip light under each deck edge, seen through the slats at night
      if (k % 6 === 0) for (let d = 1; d <= ND; d++) panel(out, e, u, -0.45, G + d * DECK - 0.42, 1.6, 0.05, [0.95, 0.97, 1.0], EMIT)
    }
  }
  // which face is which
  let iJeff = -1, iJones = -1, iBeach = -1, iLane = -1
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i), b = bearingOf(e, FRONT)
    if (e.L < 8) continue
    if (near(b, 351) && (iJeff < 0 || e.L > edgeAt(ring, iJeff).L)) iJeff = i
    if (near(b, 81) && (iJones < 0 || e.L > edgeAt(ring, iJones).L)) iJones = i
    if (near(b, 171) && (iBeach < 0 || e.L > edgeAt(ring, iBeach).L)) iBeach = i
    if (near(b, 261) && (iLane < 0 || e.L > edgeAt(ring, iLane).L)) iLane = i
  }
  const ORANGE: Rgb = [0.86, 0.42, 0.14], WOOD: Rgb = [0.62, 0.38, 0.2]
  if (iJeff >= 0) {
    const e = edgeAt(ring, iJeff)
    // the orange eyebrow band the length of the front, then the shops under it
    slab(out, e, e.L / 2, 0.12, G - 0.6, e.L, 0.6, 0.2, ORANGE, WT)
    shopRow(out, e, 0.6, e.L - 0.6, 0, G - 0.6, [
      { name: "IT'SUGAR", sign: 'box', c: [0.85, 0.12, 0.45], ink: WHITE, face: 'grotesque', w: 1.5, goods: false, blade: "IT'SUGAR" },
      { name: 'California City Wear', sub: 'SWEATSHIRTS · HATS · GIFTS', sign: 'board', c: [0.12, 0.3, 0.62], ink: WHITE, w: 1.3, goods: true },
      { name: 'Little Sweet', sub: 'BOBA · TEA · DESSERTS', sign: 'neon', c: [1.0, 0.45, 0.75], stripe: [0.4, 0.9, 1.0], w: 1.0 },
      { name: 'SAN FRANCISCO', sub: '3 T-SHIRTS FOR $20', sign: 'bulbs', c: [0.95, 0.8, 0.15], ink: [0.75, 0.08, 0.08], face: 'block', w: 1.2, goods: true },
    ], 3)
    // the court's name over the lane's mouth at the west end of the front
    slab(out, e, e.L - 1.2, 0.3, G + 0.2, 2.2, 1.0, 0.2, WOOD, WT)
    signAt(out, e, e.L - 1.2, G + 0.7, 0.42, { type: 'flat', text: "ANCHOR'S LANDING", h: 0.2, w: 2.0, face: 'slab', weight: 'bold', colour: WHITE, lit: 'back' })
  }
  if (iLane >= 0) {
    const e = edgeAt(ring, iLane)
    slab(out, e, e.L / 2, 0.12, G - 0.6, e.L, 0.6, 0.2, ORANGE, WT)
    shopRow(out, e, 0.6, Math.min(e.L - 0.6, 46), 0, G - 0.6, [
      { name: 'MAGNETS & GIFTS', sign: 'board', c: [0.95, 0.85, 0.2], ink: [0.1, 0.2, 0.5], face: 'block', goods: true },
      { name: 'Crab Shack', sub: 'CRAB · CHOWDER · SHRIMP', sign: 'awning', c: [0.8, 0.12, 0.1], stripe: WHITE, face: 'slab' },
      { name: 'Fog City Sweats', sign: 'neon', c: [0.3, 0.85, 1.0], face: 'brush' },
      { name: 'CANDY', sub: 'TAFFY · FUDGE', sign: 'bulbs', c: [0.92, 0.3, 0.6], ink: WHITE, face: 'block' },
      { name: 'PHONE CASES', sign: 'box', c: [0.1, 0.1, 0.12], ink: [0.3, 1.0, 0.5] },
      { name: 'Ice Cream', sign: 'script', c: [1.0, 0.55, 0.8] },
    ], 7)
    // festoon lights strung across the lane from the eyebrow
    for (let u = 4; u < Math.min(e.L, 46); u += 5) festoon(out, on(e, u, G + 0.9, 0.05), on(e, u + 2.5, G + 0.9, 5.2), 0.5)
  }
  if (iJones >= 0) {
    const e = edgeAt(ring, iJones)
    // the name along the top
    signAt(out, e, e.L / 2, H - 0.45, 0.1, { type: 'flat', text: "ANCHOR'S LANDING", h: 1.1, w: e.L * 0.75, face: 'slab', weight: 'bold', colour: [0.24, 0.26, 0.3], lit: 'front', tracking: 0.1 })
    shopRow(out, e, 1, e.L * 0.55, 0, G - 0.2, [
      { name: 'The Wharf Store', sign: 'awning', c: [0.1, 0.3, 0.6], stripe: WHITE },
      { name: 'SOUVENIRS', sub: 'SAN FRANCISCO', sign: 'board', c: [0.92, 0.2, 0.15], ink: WHITE, face: 'block', goods: true },
    ], 11)
  }
  if (iBeach >= 0) {
    const e = edgeAt(ring, iBeach)
    // the yellow stair tower at the Jones end, and the parking entrance with its EXIT board
    const jonesEnd = iJones >= 0 ? (Math.hypot(e.a.x - edgeAt(ring, iJones).mid.x, e.a.z - edgeAt(ring, iJones).mid.z) < Math.hypot(e.b.x - edgeAt(ring, iJones).mid.x, e.b.z - edgeAt(ring, iJones).mid.z) ? 1.8 : e.L - 1.8) : 1.8
    slab(out, e, jonesEnd, -2.0, 0, 3.6, H + 1.2, 4.4, [0.93, 0.78, 0.22], ST)
    const pu = e.L * 0.62
    slab(out, e, pu, 0.02, 0, 6.5, 3.2, 0.06, [0.08, 0.08, 0.09], MT)
    slab(out, e, pu, 0.15, 3.2, 6.8, 0.9, 0.2, [0.55, 0.85, 0.4], MT)
    signAt(out, e, pu, 3.65, 0.27, { type: 'flat', text: 'PARKING · EXIT', h: 0.42, w: 6.2, face: 'block', colour: [0.85, 0.1, 0.1], lit: 'back' })
    shopRow(out, e, pu + 4, Math.min(e.L - 4, pu + 18), 0, G - 0.2, [
      { name: 'Avis', sign: 'box', c: [0.85, 0.08, 0.12], ink: WHITE },
      { name: 'Hertz', sign: 'box', c: [0.98, 0.82, 0.1], ink: [0.08, 0.08, 0.08] },
    ], 13)
  }
}

/** the loud court shops — guessed names in the Wharf's own vocabulary where no photograph of the court exists */
const COURT_SHOPS: Shop[] = [
  { name: 'Quickly', sub: 'BOBA · SNACKS', sign: 'neon', c: [0.4, 1.0, 0.55], stripe: [1.0, 0.5, 0.8], face: 'brush' },
  { name: 'SF SWEATSHIRTS', sub: '2 FOR $25', sign: 'bulbs', c: [0.12, 0.35, 0.75], ink: [1.0, 0.9, 0.3], face: 'block', goods: true },
  { name: 'Crêpes & Waffles', sign: 'awning', c: [0.95, 0.75, 0.15], stripe: [0.55, 0.25, 0.1], ink: [0.4, 0.15, 0.05], face: 'slab' },
  { name: 'GOLDEN GATE GIFTS', sign: 'box', c: [0.85, 0.2, 0.1], ink: [1.0, 0.92, 0.6], face: 'condensed', blade: 'GIFTS' },
  { name: 'Henna & Tattoo', sign: 'neon', c: [1.0, 0.3, 0.3], stripe: [0.3, 0.7, 1.0], face: 'script' },
  { name: 'CHOWDER', sub: 'IN A SOURDOUGH BOWL', sign: 'board', c: [0.96, 0.94, 0.85], ink: [0.15, 0.3, 0.55], face: 'slab', blade: 'CHOWDER' },
  { name: 'Fudge Factory', sign: 'awning', c: [0.45, 0.22, 0.12], stripe: [0.95, 0.88, 0.7], ink: [0.98, 0.9, 0.7], face: 'roman' },
  { name: 'HATS · SUNGLASSES', sign: 'box', c: [0.08, 0.08, 0.1], ink: [1.0, 0.85, 0.15], goods: true },
  { name: 'Alcatraz Tours', sub: 'TICKETS HERE', sign: 'board', c: [0.92, 0.45, 0.12], ink: WHITE, face: 'block', blade: 'TOURS' },
  { name: 'Ice Cream', sub: 'SHAKES · CONES', sign: 'script', c: [1.0, 0.6, 0.85] },
  { name: 'ART GALLERY', sign: 'board', c: [0.1, 0.1, 0.11], ink: [0.95, 0.95, 0.92], face: 'didone' },
  { name: 'Magnets 5 for $10', sign: 'bulbs', c: [0.95, 0.85, 0.2], ink: [0.75, 0.1, 0.1], face: 'block', goods: true },
]

/**
 * THE COURTYARD BY MARRIOTT, 580 Beach Street (way/103339440), the U of building round ANCHOR'S LANDING's court: cream
 * stucco, three floors of hotel windows with angled bays over the court and Beach (Mapillary 475579241343342,
 * 1431902814761431), a ground floor of shops. On the Leavenworth & Beach corner FISHERMAN'S PIZZA under red-and-yellow
 * striped awnings ("MOST FAMOUS PIZZA · PASTA · HAMBURGERS", Mapillary 207615915045108) with pink-and-white umbrellas
 * on the pavement, then ANCHORAGE LIQUOR; on Beach the hotel's own door under COURTYARD; and on every face to the court
 * and its lanes a run of loud little shops with festoon lights strung overhead. (No Mapillary or Commons photograph of
 * the court's inside exists: its shops are GUESSED in the Wharf's own vocabulary; the owner: "full of shops and life".)
 * `front` 171: Beach is the edge facing local −z.
 */
export function anchorCourtHotel(out: MeshBuilder, fit: Fit): void {
  const FRONT = 171
  const ring = towerRing(fit)
  const G = 4.2, H = 12.6
  const CREAM: Rgb = [0.92, 0.88, 0.77], TRIM: Rgb = [0.97, 0.96, 0.92]
  faceBand(out, ring, 0, G, { kind: 'blank', wall: [0.88, 0.84, 0.74], material: 'stucco' })
  faceBand(out, ring, G, H - 0.6, { kind: 'bays', wall: CREAM, glass: [0.2, 0.32, 0.36], floor: (H - 0.6 - G) / 3, pitch: 4.2, bay: { depth: 0.6 }, material: 'stucco' })
  faceBand(out, offsetRing(ring, 0.15), H - 0.6, H, { kind: 'blank', wall: TRIM, material: 'stucco' })
  faceBand(out, offsetRing(ring, 0.12), G - 0.25, G, { kind: 'blank', wall: TRIM, material: 'stucco' })
  capPolygon(out, ring, H, [0.5, 0.48, 0.45], CT)
  // sort the faces: Beach, Leavenworth (the westmost of the west-facing ones), the rest give on to the court and lanes
  let west = -1, westD = -Infinity
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 6 || !near(bearingOf(e, FRONT), 261)) continue
    const d = e.mid.x * e.nx + e.mid.z * e.nz
    if (d > westD) { westD = d; west = i }
  }
  let k = 0
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i), b = bearingOf(e, FRONT)
    if (e.L < 5) continue
    if (near(b, 171)) {
      // BEACH: the hotel door and its sign in the middle of the longest Beach edge; the pizza and the liquor store
      if (e.L > 26) {
        slab(out, e, e.L / 2, 1.3, 3.4, 5.5, 0.35, 2.6, [0.2, 0.36, 0.4], MT)
        slab(out, e, e.L / 2, 0.03, 0, 3.0, 2.8, 0.05, [0.2, 0.24, 0.26], GT)
        signAt(out, e, e.L / 2, 5.0, 0.08, { type: 'flat', text: 'COURTYARD', h: 0.42, w: 5.0, face: 'grotesque', weight: 'bold', colour: [0.2, 0.36, 0.4], lit: 'back', tracking: 0.12 })
        signAt(out, e, e.L / 2, 4.5, 0.08, { type: 'flat', text: 'Marriott', h: 0.26, w: 2.2, face: 'script', colour: [0.25, 0.25, 0.28], lit: 'back' })
        shopRow(out, e, 0.5, e.L / 2 - 3.4, 0, G - 0.3, [{ name: 'Anchorage Liquor', sub: 'BEER · WINE · SNACKS', sign: 'neon', c: [1.0, 0.2, 0.2], stripe: [0.3, 0.6, 1.0], face: 'brush' }], 1)
        shopRow(out, e, e.L / 2 + 3.4, e.L - 0.5, 0, G - 0.3, [{ name: 'TALK Schools', sub: 'ENGLISH LANGUAGE', sign: 'board', c: [0.1, 0.35, 0.55], ink: WHITE }], 2)
      } else {
        shopRow(out, e, 0.4, e.L - 0.4, 0, G - 0.3, [
          { name: "Fisherman's Pizza", sub: 'MOST FAMOUS PIZZA · PASTA · HAMBURGERS', sign: 'awning', c: [0.82, 0.1, 0.08], stripe: [0.98, 0.8, 0.15], ink: WHITE, face: 'slab' },
        ], 4)
        for (let u = 3; u < e.L - 2; u += 4.5) {
          const p = on(e, u, 0, 3.0)
          cafeSet(out, p[0], p[2], 0, [0.96, 0.62, 0.72])
        }
      }
    } else if (i === west) {
      const extra = Math.max(0, Math.round(e.L / 5.5) - 2)
      shopRow(out, e, 0.4, e.L - 0.4, 0, G - 0.3, [
        { name: "Fisherman's Pizza", sub: 'PASTA · HAMBURGERS', sign: 'awning', c: [0.82, 0.1, 0.08], stripe: [0.98, 0.8, 0.15], ink: WHITE, face: 'slab' },
        { name: 'Quickly', sub: 'BOBA TEA', sign: 'box', c: [0.2, 0.7, 0.35], ink: WHITE },
        ...Array.from({ length: extra }, (_, j) => COURT_SHOPS[(j * 7 + 3) % COURT_SHOPS.length]),
      ], 5)
    } else {
      // THE COURT AND ITS LANES: one loud shop every five or six metres, festoons strung out across
      const n = Math.max(1, Math.round(e.L / 5.5))
      const shops = Array.from({ length: n }, () => COURT_SHOPS[(k++ * 5 + i) % COURT_SHOPS.length])
      shopRow(out, e, 0.3, e.L - 0.3, 0, G - 0.2, shops, k)
      for (let u = 2; u < e.L - 1; u += 4) festoon(out, on(e, u, G + 0.6, 0.05), on(e, u + 2, G + 1.2, 4.5), 0.35)
    }
  }
}

/** a run of court shops laid against a wall another builder owns: local +z is the wall's outward face, `w` long */
function courtWall(shops: Shop[], seed: number, flags = false): (out: MeshBuilder, fit: Fit) => void {
  return (out, fit) => {
    const hx = fit.hx
    const e = edgeAt([{ x: hx, z: 0 }, { x: -hx, z: 0 }], 0)
    shopRow(out, e, 0.2, e.L - 0.2, 0, 4.0, shops, seed)
    for (let u = 2; u < e.L - 1; u += 4) festoon(out, on(e, u, 4.6, 0.05), on(e, u + 1.5, 5.2, 4.0), 0.35)
    // the passage's pennants, strung across it in the colours of the Wharf's banners (Mapillary 1110462444382328)
    if (flags) for (let u = 3; u < e.L - 2; u += 5) pennants(out, on(e, u, 6.2, 0.05), on(e, u - 1.5, 6.6, 5.5), 0.4, [[0.85, 0.12, 0.12], WHITE, [0.15, 0.35, 0.75], [0.98, 0.8, 0.2]])
  }
}

/**
 * ANCHOR'S LANDING's COURT ITSELF (the pedestrian way 103339437): a point model at the court's middle, its local +z due
 * north. In the middle a great black ship's ANCHOR on a granite plinth — the court's namesake — and over it festoon
 * lights strung from a mast to the walls all round; café tables under red, teal and yellow umbrellas, big planters of
 * flowers, benches, a striped churro cart, a busker's pitch. GUESSED: no photograph of the court's inside exists on
 * Mapillary or Commons (the passage from Jefferson, Mapillary 1110462444382328, shows pennants strung across it).
 */
export function anchorCourtLife(out: MeshBuilder, _fit: Fit): void {
  const IRON: Rgb = [0.1, 0.1, 0.11], GRANITE: Rgb = [0.6, 0.6, 0.58]
  // the plinth and the anchor (shank, ring, stock, the curved arms and their flukes)
  box(out, 0, 0.4, 0, 1.3, 0.4, 1.3, GRANITE, AT)
  box(out, 0, 0.9, 0, 1.0, 0.1, 1.0, [0.5, 0.5, 0.48], AT)
  tube(out, [0, 1.0, 0], [0, 5.2, 0], 0.16, 8, IRON, MT)
  tube(out, [-1.6, 4.7, 0], [1.6, 4.7, 0], 0.11, 8, IRON, MT)
  for (const s of [-1, 1]) box(out, s * 1.65, 4.7, 0, 0.12, 0.12, 0.12, IRON, MT)
  for (let k = 0; k < 12; k++) {
    const a0 = (k / 12) * Math.PI * 2, a1 = ((k + 1) / 12) * Math.PI * 2
    tube(out, [0, 5.6 + Math.sin(a0) * 0.4, Math.cos(a0) * 0.4], [0, 5.6 + Math.sin(a1) * 0.4, Math.cos(a1) * 0.4], 0.07, 5, IRON, MT)
  }
  for (const s of [-1, 1]) {
    let prev: V3 = [0, 1.15, 0]
    for (let k = 1; k <= 6; k++) {
      const a = (k / 6) * (Math.PI / 2)
      const p: V3 = [s * Math.sin(a) * 1.7, 1.15 + (1 - Math.cos(a)) * 1.7, 0]
      tube(out, prev, p, 0.13, 6, IRON, MT)
      prev = p
    }
    // the fluke: a broad spade at the arm's tip
    out.quad([[s * 1.45, 2.4, 0.06], [s * 2.0, 2.6, 0.06], [s * 1.9, 3.6, 0.06], [s * 1.6, 3.1, 0.06]], [0, 0, 1], UVQ, IRON, MT)
    out.quad([[s * 1.6, 3.1, -0.06], [s * 1.9, 3.6, -0.06], [s * 2.0, 2.6, -0.06], [s * 1.45, 2.4, -0.06]], [0, 0, -1], UVQ, IRON, MT)
  }
  signAt(out, edgeAt([{ x: 1.3, z: 1.31 }, { x: -1.3, z: 1.31 }], 0), 1.3, 0.45, 0.02, { type: 'flat', text: "ANCHOR'S LANDING", h: 0.15, w: 2.2, face: 'roman', weight: 'bold', colour: [0.85, 0.75, 0.45], lit: 'front' })
  // the festoons: from the mast over the anchor out to the court's walls
  tube(out, [0.9, 0, 0.9], [0.9, 7.2, 0.9], 0.07, 6, [0.25, 0.25, 0.27], MT)
  const ends: [number, number][] = [[-10, -12], [0, -12.5], [10, -12], [10.5, 0], [10, 12], [0, 12.5], [-10, 12], [-10.5, 0]]
  for (const [x, z] of ends) festoon(out, [0.9, 7.1, 0.9], [x, 5.0, z], 0.7, 0.55)
  // café sets under umbrellas, planters, benches
  const UMB: Rgb[] = [[0.82, 0.12, 0.12], [0.1, 0.55, 0.55], [0.96, 0.78, 0.15], [0.82, 0.12, 0.12], [0.2, 0.35, 0.7], [0.96, 0.78, 0.15]]
  const tables: [number, number][] = [[-6, -7], [-6, -2], [-6, 4], [6, -7], [6.5, -1.5], [6, 5]]
  tables.forEach(([x, z], k) => cafeSet(out, x, z, 0, UMB[k]))
  for (const [x, z] of [[-3.5, -9.5], [3.5, -9.5], [-3.5, 9.5], [3.5, 9.5]] as [number, number][]) planter(out, x, z, 0, 0.8)
  for (const [x, z] of [[-2.8, 0], [2.8, 0]] as [number, number][]) {
    box(out, x, 0.42, z, 0.25, 0.04, 1.0, [0.55, 0.38, 0.22], WT)
    for (const dz of [-0.8, 0.8]) box(out, x, 0.2, z + dz, 0.22, 0.2, 0.05, IRON, MT)
  }
  // the churro cart: a red box on wheels under a striped canopy
  box(out, -2, 0.7, 8.6, 1.1, 0.45, 0.55, [0.8, 0.1, 0.1], MT)
  for (const s of [-1, 1]) prism(out, -2 + s * 0.8, 8.6, 0, 0.35, 0.3, 8, IRON, MT)
  for (const s of [-1, 1]) tube(out, [-2 + s * 1.0, 1.15, 8.6], [-2 + s * 1.0, 2.2, 8.6], 0.03, 4, [0.7, 0.7, 0.7], MT)
  for (let k = 0; k < 6; k++) box(out, -3.1 + k * 0.44 + 0.22, 2.25, 8.6, 0.22, 0.05, 0.75, k % 2 ? WHITE : [0.95, 0.75, 0.15], WT)
  sign(out, { type: 'flat', text: 'CHURROS', h: 0.18, w: 2.0, face: 'block', colour: [1.0, 0.85, 0.2], lit: 'front' }, { x: -2, y: 0.85, z: 9.17, heading: 0 })
  // the busker's pitch: a round rug, a little amplifier, an open guitar case
  prism(out, 2.5, 8.5, 0, 0.02, 1.0, 12, [0.55, 0.15, 0.2], WT)
  box(out, 2.9, 0.25, 8.2, 0.22, 0.25, 0.18, [0.12, 0.12, 0.12], MT)
  box(out, 2.1, 0.06, 8.9, 0.5, 0.05, 0.2, [0.15, 0.1, 0.08], WT)
}

/** a round-arched opening on edge `e`: dark glass under a half-round head, a ring of brick headers round it */
function roundArch(out: MeshBuilder, e: Edge, u: number, y0: number, w: number, h: number, glass: Rgb, ring: Rgb, frame: Rgb | null = null): void {
  const r = w / 2, ys = y0 + h - r
  panel(out, e, u, 0.04, y0, w, h - r, glass, GT)
  const N = 6
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * Math.PI, a1 = ((k + 1) / N) * Math.PI
    const P = (a: number, rr: number, o: number): V3 => on(e, u + Math.cos(a) * rr, ys + Math.sin(a) * rr, o)
    out.quad([P(a0, 0, 0.04), P(a0, r, 0.04), P(a1, r, 0.04), P(a1, 0, 0.04)], [e.nx, 0, e.nz], UVQ, glass, GT)
    out.quad([P(a0, r, 0.06), P(a0, r + 0.3, 0.06), P(a1, r + 0.3, 0.06), P(a1, r, 0.06)], [e.nx, 0, e.nz], UVQ, ring, BT)
  }
  for (const s of [-1, 1]) panel(out, e, u + s * (r + 0.15), 0.06, y0, 0.3, h - r, ring, BT)
  if (frame) {
    for (const s of [-1, 1]) panel(out, e, u + s * (r - 0.04), 0.07, y0, 0.08, h - r, frame, MT)
    panel(out, e, u, 0.07, ys - 0.04, w, 0.08, frame, MT)
    panel(out, e, u, 0.07, y0, 0.07, h - 0.1, frame, MT)
  }
}

/**
 * THE CANNERY, Del Monte's 1907 fruit cannery made a shopping centre by Joseph Esherick in 1967 (2801 Leavenworth;
 * ways 288391069 north wing, 288391070 south wing): three storeys of rough RED BRICK, tall round-arched windows on the
 * upper floors, big round arches on the ground floor; the north wing's Jefferson & Leavenworth corner carries THE
 * CANNERY in big white capitals along its top under a glazed rooftop canopy, the shops' signs at its foot (a red arched
 * TICKETS & ACTIVITIES board, NICK'S LIGHTHOUSE, gooseneck lamps; Mapillary 3567667476704006, 1514549689982278); red
 * box oriels stand out over Leavenworth (Mapillary 725855557280823, 1899266753982285); at the Jefferson end of the
 * court a tall black-gridded glass atrium (Mapillary 1521799325897619, 1484239412622117). The south wing's Beach front
 * has its great arches open under THE CANNERY in bronze capitals and a roof terrace with a glass rail at the corner
 * (Mapillary 3350093498463803). Faces to the courts carry the walkways on brackets that Esherick threaded round it.
 * `front` 351 for the north wing (Jefferson = local −z), 171 for the south wing (Beach).
 */
function cannery(north: boolean): (out: MeshBuilder, fit: Fit) => void {
  return (out, fit) => {
    const FRONT = north ? 351 : 171
    const ring = towerRing(fit)
    const BRICK: Rgb = [0.5, 0.22, 0.15], BRICKD: Rgb = [0.4, 0.17, 0.12], GL: Rgb = [0.15, 0.17, 0.2], IRON: Rgb = [0.12, 0.12, 0.13]
    const G = 4.6, F = 3.8, TOP = G + 2 * F, H = TOP + 0.9
    faceBand(out, ring, 0, H, { kind: 'blank', wall: BRICK, material: 'brick' })
    faceBand(out, offsetRing(ring, 0.08), G - 0.25, G, { kind: 'blank', wall: BRICKD, material: 'brick' })
    faceBand(out, offsetRing(ring, 0.15), TOP, TOP + 0.3, { kind: 'blank', wall: BRICKD, material: 'brick' })
    faceBand(out, offsetRing(ring, 0.05), H - 0.12, H, { kind: 'blank', wall: [0.5, 0.48, 0.45], material: 'concrete' })
    capPolygon(out, ring, H - 0.3, [0.4, 0.38, 0.36], CT)
    // which faces are streets: the long edges facing Jefferson/Beach (front) and Leavenworth (81); the rest give on courts
    const isFront = (b: number): boolean => near(b, FRONT)
    let iLeav = -1
    for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); if (e.L > 8 && near(bearingOf(e, FRONT), 81) && (iLeav < 0 || e.L > edgeAt(ring, iLeav).L)) iLeav = i }
    let iFront = -1
    for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); if (e.L > 8 && isFront(bearingOf(e, FRONT)) && (iFront < 0 || e.L > edgeAt(ring, iFront).L)) iFront = i }
    let seed = north ? 0 : 50
    for (let i = 0; i < ring.length; i++) {
      const e = edgeAt(ring, i)
      if (e.L < 4) continue
      const b = bearingOf(e, FRONT)
      const street = i === iLeav || (isFront(b) && e.L > 8)
      const n = Math.max(1, Math.round(e.L / 3.6)), pw = e.L / n
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) * pw
        for (let f = 0; f < 2; f++) roundArch(out, e, u, G + f * F + 0.6, Math.min(1.25, pw * 0.4), 2.7, GL, BRICKD, [0.85, 0.85, 0.82])
      }
      // the ground floor: big round arches, every other one a shop with its sign over the springing
      const ng = Math.max(1, Math.round(e.L / 4.8)), gw = e.L / ng
      for (let k = 0; k < ng; k++) {
        const u = (k + 0.5) * gw
        roundArch(out, e, u, 0, Math.min(2.9, gw * 0.62), 3.9, [0.2, 0.2, 0.2], BRICKD, IRON)
        if (street && k % 3 === 1) {
          const lp = on(e, u + gw / 2, 3.9, 0.05), arm = on(e, u + gw / 2, 3.8, 0.8)
          tube(out, lp, arm, 0.03, 4, IRON, MT)
          box(out, arm[0], arm[1] - 0.15, arm[2], 0.22, 0.1, 0.22, [0.2, 0.3, 0.25], MT)
          box(out, arm[0], arm[1] - 0.26, arm[2], 0.15, 0.02, 0.15, WARM, EMIT)
        }
      }
      if (!street && e.L > 6) {
        // a court face: Esherick's walkway at the first floor, on brackets, with a pipe rail; and a stair down at one end
        const yW = G - 0.15
        slab(out, e, e.L / 2, 0.9, yW, e.L - 0.6, 0.18, 1.8, [0.5, 0.48, 0.45], CT)
        for (let u = 1; u < e.L - 0.5; u += 3) slab(out, e, u, 1.75, yW - 0.9, 0.1, 0.9, 0.1, IRON, MT)
        slab(out, e, e.L / 2, 1.78, yW + 1.0, e.L - 0.6, 0.06, 0.06, IRON, MT)
        for (let u = 0.6; u < e.L - 0.4; u += 1.5) slab(out, e, u, 1.78, yW + 0.15, 0.04, 0.85, 0.04, IRON, MT)
        const st = 1.5
        for (let k = 0; k < 10; k++) slab(out, e, st + k * 0.32, 2.4, yW - (k + 1) * (yW / 10), 0.34, 0.08, 1.1, [0.55, 0.52, 0.48], CT)
        // its stringers and rail, so the treads hang on something
        for (const o of [1.85, 2.95]) {
          tube(out, on(e, st - 0.15, yW, o), on(e, st + 3.2, 0, o), 0.06, 4, IRON, MT)
          tube(out, on(e, st - 0.15, yW + 0.95, o), on(e, st + 3.2, 0.95, o), 0.025, 4, IRON, MT)
        }
        // shops on the court too, the Wharf's loud kind
        if (e.L > 9) shopRow(out, e, 4.5, e.L - 0.5, 0, 3.9, Array.from({ length: Math.max(1, Math.round((e.L - 5) / 6)) }, (_, j) => COURT_SHOPS[(seed + j * 5) % COURT_SHOPS.length]), seed)
        seed += 3
      }
    }
    if (iFront >= 0) {
      const e = frontEdge(ring, iFront)
      const L = e.L
      // the corner toward Leavenworth: is it at u = 0 or u = L?
      const lv = iLeav >= 0 ? edgeAt(ring, iLeav) : null
      const atA = lv ? Math.hypot(e.a.x - lv.mid.x, e.a.z - lv.mid.z) < Math.hypot(e.b.x - lv.mid.x, e.b.z - lv.mid.z) : true
      const cu = atA ? 8 : L - 8
      // THE CANNERY along the top, white capitals on a rail, and the glazed canopy over the roof behind it
      slab(out, e, cu, 0.12, H - 0.85, 14, 0.06, 0.18, [0.6, 0.6, 0.62], MT)
      signAt(out, e, cu, H - 0.4, 0.2, { type: 'flat', text: 'THE CANNERY', h: 0.95, w: 14, face: 'didone', colour: north ? [0.94, 0.94, 0.92] : [0.45, 0.55, 0.42], lit: 'front', tracking: 0.35 })
      slab(out, e, cu, -4, H - 0.3, 14, 2.2, 6, [0.25, 0.3, 0.32], GT)
      slab(out, e, cu, -4, H + 1.9, 15, 0.12, 6.6, [0.5, 0.52, 0.55], MT)
      if (north) {
        // the shops at the foot of the corner: TICKETS & ACTIVITIES under a red arched board, NICK'S LIGHTHOUSE
        shopRow(out, e, atA ? 1 : L - 17, atA ? 17 : L - 1, 0, 3.9, [
          { name: 'Tickets & Activities', sign: 'board', c: [0.72, 0.1, 0.12], ink: WHITE, face: 'slab', goods: true },
          { name: "Nick's Lighthouse", sub: 'SEAFOOD · CRAB', sign: 'box', c: [0.96, 0.95, 0.92], ink: [0.75, 0.1, 0.1], blade: "NICK'S", face: 'slab' },
          { name: "Jack's Cannery Bar", sign: 'neon', c: [1.0, 0.75, 0.25], stripe: [1.0, 0.3, 0.2], face: 'brush' },
        ], 31)
        shopRow(out, e, atA ? 19 : 8, atA ? L - 8 : L - 19, 0, 3.9, [
          { name: 'V Boutique', sign: 'script', c: [1.0, 0.85, 0.9] },
          { name: 'SF Bicycle Rentals', sub: 'BIKE THE BRIDGE', sign: 'board', c: [0.98, 0.78, 0.12], ink: [0.1, 0.1, 0.1], face: 'block', blade: 'BIKES' },
          { name: 'Flying Ninja', sub: 'SUSHI · RAMEN', sign: 'neon', c: [1.0, 0.3, 0.3], face: 'brush' },
        ], 35)
        // the glass atrium at the court end: a tall box of black-gridded glass standing a little proud
        const au = atA ? L - 3.5 : 3.5
        gridBox(out, e, au, 0.6, 6.5, H + 1.5, 7, IRON)
      } else {
        // the Beach arches open, a roof terrace with a glass rail over the corner
        shopRow(out, e, atA ? 1 : L - 13, atA ? 13 : L - 1, 0, 3.9, [
          { name: 'Pomegranate', sub: 'CAFE', sign: 'awning', c: [0.65, 0.1, 0.2], stripe: [0.95, 0.9, 0.8], face: 'roman' },
          { name: "Norman's Ice Cream", sign: 'script', c: [0.4, 0.85, 1.0] },
        ], 41)
        slab(out, e, atA ? 6 : L - 6, 0.6, H, 11, 1.1, 1.2, [0.7, 0.85, 0.9], GT)
        slab(out, e, atA ? 6 : L - 6, 0.6, H + 1.1, 11, 0.06, 1.2, [0.4, 0.4, 0.42], MT)
      }
    }
    if (iLeav >= 0) {
      const e = edgeAt(ring, iLeav)
      // the red box oriels over Leavenworth, and black awnings on the ground floor
      for (let u = 4; u < e.L - 3; u += 7) {
        for (let f = 0; f < 2; f++) {
          slab(out, e, u, 0.45, G + f * F + 0.5, 2.6, 2.6, 0.9, [0.72, 0.12, 0.1], MT)
          slab(out, e, u, 0.92, G + f * F + 0.7, 2.2, 2.1, 0.05, [0.2, 0.25, 0.28], GT)
        }
        domeAwning(out, e, u + 2.4, 2.0, 3.6, 0.7, [0.1, 0.1, 0.11], [0.05, 0.05, 0.06])
      }
      signAt(out, e, e.L / 2, H - 0.4, 0.15, { type: 'flat', text: 'THE CANNERY', h: 0.8, w: Math.min(12, e.L * 0.5), face: 'didone', colour: north ? [0.94, 0.94, 0.92] : [0.45, 0.55, 0.42], lit: 'front', tracking: 0.3 })
    }
  }
}

/** a tall box of glass in a black steel grid, standing out `o` from edge `e`, `w` wide and `h` tall, `d` deep */
function gridBox(out: MeshBuilder, e: Edge, u: number, o: number, w: number, h: number, d: number, steel: Rgb): void {
  slab(out, e, u, o - d / 2 + 0.3, 0, w, h, d, [0.24, 0.3, 0.33], GT)
  for (let k = 0; k <= Math.round(w / 1.1); k++) slab(out, e, u - w / 2 + (k * w) / Math.round(w / 1.1), o + 0.32, 0, 0.1, h, 0.08, steel, MT)
  for (let y = 0; y <= h; y += 1.2) slab(out, e, u, o + 0.32, y, w, 0.1, 0.08, steel, MT)
  slab(out, e, u, o - d / 2 + 0.3, h, w + 0.3, 0.25, d + 0.3, steel, MT)
}

/**
 * THE CANNERY's COURT, between the Cannery and the Argonaut, a point model at its middle with local +z due north
 * (along the court): the century-old OLIVE TREES the court is known for (web: aaa.com, starboardcre.com), café tables
 * under umbrellas and festoons (Mapillary 1521799325897619, outdoor dining under trees at the Jefferson end), planters,
 * and at the Jefferson end the GLASS BRIDGE in a black steel grid that spans the court's mouth at the first floor
 * (Mapillary 1521799325897619, 1484239412622117). The olive trees' gnarled trunks are drawn simply; the court's floor
 * plan otherwise GUESSED (no photograph from inside the court).
 */
export function canneryCourt(out: MeshBuilder, fit: Fit): void {
  const hz = fit.hz, hx = fit.hx
  const IRON: Rgb = [0.1, 0.1, 0.11], OLIVE: Rgb = [0.42, 0.5, 0.36], BARK: Rgb = [0.35, 0.3, 0.25]
  // the olive trees down the middle
  for (let z = -hz + 8; z < hz - 10; z += 11) {
    const x = ((z * 7) % 3) - 1
    tube(out, [x, 0, z], [x + 0.4, 1.6, z + 0.2], 0.28, 6, BARK, WT, 0.22)
    tube(out, [x + 0.4, 1.6, z + 0.2], [x - 0.6, 3.0, z - 0.3], 0.18, 5, BARK, WT, 0.12)
    tube(out, [x + 0.4, 1.6, z + 0.2], [x + 1.3, 2.9, z + 0.6], 0.16, 5, BARK, WT, 0.11)
    // the crown: a loose cloud of grey-green clumps, each a little dome
    for (const [dx, dy, dz, r] of [[-0.9, 3.3, -0.4, 1.1], [1.4, 3.2, 0.7, 1.0], [0.3, 4.1, 0.1, 1.3], [-0.2, 3.6, 1.1, 0.9], [0.9, 3.9, -0.9, 0.95], [-1.3, 3.9, 0.6, 0.8]] as [number, number, number, number][]) {
      prism(out, x + dx, z + dz, dy - 0.45, dy, r * 0.7, 8, [OLIVE[0] * 0.85, OLIVE[1] * 0.85, OLIVE[2] * 0.85], FT, r)
      prism(out, x + dx, z + dz, dy, dy + 0.55, r, 8, OLIVE, FT, r * 0.45)
    }
    box(out, x, 0.05, z, 1.4, 0.05, 1.4, [0.35, 0.3, 0.26], CT)
  }
  // café sets either side, under umbrellas
  const UMB: Rgb[] = [[0.12, 0.3, 0.55], [0.9, 0.9, 0.86], [0.7, 0.12, 0.12]]
  let k = 0
  for (let z = -hz + 5; z < hz - 6; z += 6.5) for (const sx of [-1, 1]) {
    const x = sx * (hx - 2.6)
    cafeSet(out, x, z, 0, (k++ % 2) ? UMB[k % UMB.length] : null)
  }
  for (const z of [-hz + 2, hz - 8]) for (const sx of [-1, 1]) planter(out, sx * (hx - 1.5), z, 0, 0.7)
  // festoons zigzagging across the court
  for (let z = -hz + 4; z < hz - 6; z += 7) festoon(out, [-hx + 0.3, 5.0, z], [hx - 0.3, 5.0, z + 3.5], 0.5)
  // the glass bridge at the Jefferson end, from wall to wall at the first floor
  const zb = hz - 3
  box(out, 0, 6.4, zb, hx + 0.6, 1.5, 1.5, [0.26, 0.32, 0.36], GT)
  for (let x = -hx; x <= hx + 0.01; x += 1.2) box(out, x, 6.4, zb + 1.53, 0.05, 1.5, 0.05, IRON, MT)
  for (let x = -hx; x <= hx + 0.01; x += 1.2) box(out, x, 6.4, zb - 1.53, 0.05, 1.5, 0.05, IRON, MT)
  for (const y of [4.9, 6.4, 7.9]) for (const s of [-1, 1]) box(out, 0, y, zb + s * 1.53, hx + 0.6, 0.06, 0.05, IRON, MT)
  box(out, 0, 8.1, zb, hx + 0.8, 0.12, 1.7, IRON, MT)
  // and its name, hung on the bridge's face to the street
  sign(out, { type: 'flat', text: 'THE CANNERY', h: 0.42, w: hx * 1.4, face: 'didone', colour: WHITE, lit: 'front', tracking: 0.3, panel: [0.1, 0.1, 0.11] }, { x: 0, y: 7.3, z: zb + 1.6, heading: 0 })
}

/** the frontage edge of a claimed building: the longest run facing `bearing` (merged over little jogs) */
function frontFacing(ring: P2[], front: number, bearing: number, min = 5): Edge | null {
  let best = -1
  for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); if (e.L >= min && near(bearingOf(e, front), bearing) && (best < 0 || e.L > edgeAt(ring, best).L)) best = i }
  return best < 0 ? null : frontEdge(ring, best)
}

/** a barn gooseneck lamp over a sign, at `u` along `e`, its arm at `y` */
function gooseneck(out: MeshBuilder, e: Edge, u: number, y: number, c: Rgb = [0.1, 0.1, 0.11]): void {
  const a = on(e, u, y, 0.05), m = on(e, u, y + 0.35, 0.35), b = on(e, u, y + 0.3, 0.7)
  tube(out, a, m, 0.025, 4, c, MT)
  tube(out, m, b, 0.025, 4, c, MT)
  prism(out, b[0], b[2], b[1] - 0.18, b[1] - 0.02, 0.2, 8, c, MT, 0.06)
  box(out, b[0], b[1] - 0.19, b[2], 0.12, 0.01, 0.12, WARM, EMIT)
}

/**
 * THE JONES STREET STRIP, Jefferson between Jones and the Supreme Crab building (way/229326463): one storey of shops
 * under a rounded black parapet cap, each shop's fascia painted its own colour with a gooseneck lamp or two over it,
 * roll-up shutters and open fronts: (Jones end) SOCK HARBOR, CLEOPATRA INK tattoo & piercing on black, SUNGLASS SHACK
 * on grey with SHACK in red, BIG BUS San Francisco and PAL ELECTRONICS on blue, CABLE CAR SOUVENIRS in blue script on
 * white, SF PHONE SHOP in red on white, TEXTURES San Francisco Vintage in black on white (Mapillary 1465166564537344,
 * 1941018786676301, 767512889312382, 2025; names and order agree with the OSM nodes). `front` 351.
 */
export function jonesStrip(out: MeshBuilder, fit: Fit): void {
  const FRONT = 351
  const ring = towerRing(fit)
  const H = 5.2
  faceBand(out, ring, 0, H, { kind: 'blank', wall: [0.9, 0.89, 0.86], material: 'stucco' })
  capPolygon(out, ring, H, [0.4, 0.4, 0.4], CT)
  // the rounded black cap along the parapet
  faceBand(out, offsetRing(ring, 0.12), H - 0.35, H + 0.15, { kind: 'blank', wall: [0.08, 0.08, 0.09], material: 'metal' })
  const e = frontFacing(ring, FRONT, 351, 8)
  if (!e) return
  // west → east: the ring runs anticlockwise, so u runs from the east end to the west one along the Jefferson face
  const W2E: (Shop & { w?: number; fascia: Rgb })[] = [
    { name: 'SOCK HARBOR', sign: 'board', c: [0.96, 0.96, 0.94], ink: [0.1, 0.3, 0.6], fascia: [0.96, 0.96, 0.94], goods: true, w: 0.9 },
    { name: 'CLEOPATRA INK', sub: 'TATTOO & PIERCING', sign: 'board', c: [0.06, 0.06, 0.07], ink: [0.95, 0.95, 0.92], face: 'didone', fascia: [0.06, 0.06, 0.07], w: 1.1 },
    { name: 'SUNGLASS SHACK', sign: 'board', c: [0.55, 0.56, 0.58], ink: [0.85, 0.1, 0.1], face: 'block', fascia: [0.55, 0.56, 0.58], goods: true, w: 1.1 },
    { name: 'BIG BUS', sub: 'SAN FRANCISCO', sign: 'board', c: [0.15, 0.25, 0.85], ink: [0.98, 0.78, 0.15], face: 'block', fascia: [0.15, 0.25, 0.85], w: 0.8 },
    { name: 'PAL ELECTRONICS', sign: 'board', c: [0.15, 0.25, 0.85], ink: [0.98, 0.78, 0.15], fascia: [0.15, 0.25, 0.85], goods: true, w: 1.1 },
    { name: 'Cable Car Souvenirs', sign: 'board', c: [0.96, 0.96, 0.94], ink: [0.15, 0.3, 0.7], face: 'script', fascia: [0.96, 0.96, 0.94], goods: true, w: 1.1 },
    { name: 'SF PHONE SHOP', sub: 'PREPAID SIMS · PHONE REPAIR', sign: 'board', c: [0.96, 0.96, 0.94], ink: [0.85, 0.1, 0.1], face: 'condensed', fascia: [0.96, 0.96, 0.94], w: 1.1 },
    { name: 'TEXTURES', sub: 'SAN FRANCISCO VINTAGE', sign: 'board', c: [0.96, 0.96, 0.94], ink: [0.08, 0.08, 0.1], face: 'block', fascia: [0.96, 0.96, 0.94], w: 1.0 },
  ]
  const shops = [...W2E].reverse()
  const tot = shops.reduce((a, x) => a + (x.w ?? 1), 0)
  let u = 0.3
  shops.forEach((sh, k) => {
    const w = ((e.L - 0.6) * (sh.w ?? 1)) / tot
    // the fascia: the shop's colour from the sign band to the cap
    slab(out, e, u + w / 2, 0.06, 3.2, w, H - 3.55, 0.08, sh.fascia, ST)
    // a roll shutter half up over the opening, the opening open below
    slab(out, e, u + w / 2, 0.1, 2.75, w - 0.6, 0.45, 0.06, [0.3, 0.3, 0.32], MT)
    loudShop(out, e, u + w / 2, w - 0.1, 0, 4.15, sh, k)
    gooseneck(out, e, u + w * 0.3, H - 0.6)
    if (w > 6) gooseneck(out, e, u + w * 0.7, H - 0.6)
    u += w
  })
}

/**
 * SUPREME CRAB and the CAMERA HOUSE, 235–245 Jefferson (way/229326460): a white two-storey block with a long band of
 * windows upstairs and SUPREME CRAB in red script along its top, the ground floor a jumble of loud boards — CAMERA HOUSE,
 * PHONE ACCESSORIES on yellow, Ray-Ban, Samsonite, SALE (Mapillary 1131340342176896); at its west end a tall grey
 * clapboard wall with EAT CRAB down it in red capitals, and a little gabled porch under a green-and-white striped awning
 * with the restaurant's retro red sign — SUPREME CRAB · SEAFOOD BUFFET · OPEN (Mapillary 767512889312382). `front` 351.
 */
export function supremeCrab(out: MeshBuilder, fit: Fit): void {
  const FRONT = 351
  const ring = towerRing(fit)
  const H = 8.6, G = 4.0
  const WH: Rgb = [0.94, 0.93, 0.9], RED: Rgb = [0.85, 0.1, 0.1], GREY: Rgb = [0.62, 0.64, 0.66]
  faceBand(out, ring, 0, G, { kind: 'blank', wall: WH, material: 'stucco' })
  faceBand(out, ring, G, H, { kind: 'bands', wall: WH, glass: [0.22, 0.26, 0.3], floor: H - G, solid: 0.45, material: 'stucco' })
  faceBand(out, offsetRing(ring, 0.1), H - 1.0, H, { kind: 'blank', wall: WH, material: 'stucco' })
  capPolygon(out, ring, H, [0.42, 0.42, 0.42], CT)
  const e = frontFacing(ring, FRONT, 351, 8)
  if (!e) return
  // the ring runs anticlockwise: u = L is the WEST end, where the EAT CRAB tower stands
  const tu = e.L - 2.0
  slab(out, e, tu, -1.0, 0, 4.0, H + 3.2, 2.2, GREY, WT)
  for (let y = 0.3; y < H + 3.1; y += 0.3) slab(out, e, tu, 0.12, y, 4.0, 0.03, 0.04, [0.5, 0.52, 0.54], WT)
  'EAT CRAB'.split('').forEach((ch, k) => { if (ch !== ' ') signAt(out, e, tu + 0.6, H + 2.2 - k * 1.05, 0.16, { type: 'flat', text: ch, h: 0.85, w: 1.2, face: 'condensed', weight: 'bold', colour: RED, lit: 'self' }) })
  // the porch: a little gable on posts under the striped awning, the retro sign standing on its ridge
  const pu = e.L - 5.6
  for (const sd of [-1, 1]) slab(out, e, pu + sd * 1.4, 1.6, 0, 0.14, 2.8, 0.14, WH, WT)
  const n = 8
  for (let k = 0; k < n; k++) {
    const u0 = pu - 1.6 + (3.2 * k) / n, u1 = pu - 1.6 + (3.2 * (k + 1)) / n
    out.quad([on(e, u0, 3.5, 0.05), on(e, u1, 3.5, 0.05), on(e, u1, 2.8, 1.9), on(e, u0, 2.8, 1.9)], [e.nx * 0.6, 0.8, e.nz * 0.6], UVQ, k % 2 ? WH : [0.1, 0.45, 0.25], WT)
  }
  slab(out, e, pu, 0.4, 4.2, 3.4, 2.0, 0.2, RED, MT)
  signAt(out, e, pu, 5.75, 0.56, { type: 'flat', text: 'Supreme Crab', h: 0.34, w: 3.0, face: 'script', colour: WHITE, lit: 'self' })
  slab(out, e, pu, 0.45, 4.62, 3.1, 0.42, 0.2, WH, MT)
  signAt(out, e, pu, 4.83, 0.6, { type: 'flat', text: 'SEAFOOD BUFFET', h: 0.22, w: 2.9, face: 'condensed', weight: 'bold', colour: RED, lit: 'back' })
  signAt(out, e, pu, 4.38, 0.56, { type: 'flat', text: 'OPEN', h: 0.16, w: 1.0, face: 'block', colour: [1.0, 0.3, 0.3], lit: 'self' })
  bulbRow(out, on(e, pu - 1.7, 6.22, 0.52), on(e, pu + 1.7, 6.22, 0.52), 0.25)
  // the name along the top of the white block
  signAt(out, e, e.L * 0.42, H - 0.5, 0.18, { type: 'flat', text: 'Supreme Crab', h: 0.75, w: e.L * 0.6, face: 'script', weight: 'bold', colour: RED, lit: 'self' })
  // the ground floor east of the porch: the camera shop's pile of boards
  shopRow(out, e, 0.3, pu - 2.0, 0, G - 0.05, [
    { name: 'CAMERA HOUSE', sub: 'CANON · SONY · NIKON · OLYMPUS', sign: 'bulbs', c: [0.98, 0.85, 0.15], ink: [0.75, 0.08, 0.08], face: 'block', goods: true, w: 1.4 },
    { name: 'PHONE ACCESSORIES', sub: 'CASES · CHARGERS · SELFIE STICKS', sign: 'board', c: [0.98, 0.9, 0.3], ink: [0.1, 0.1, 0.5], face: 'condensed', w: 1.2 },
    { name: 'SALE', sub: '30% – 70% OFF', sign: 'box', c: [0.9, 0.1, 0.1], ink: WHITE, face: 'block', w: 0.7 },
  ], 61)
}

/**
 * THE GALLERIES at Jefferson & Taylor (way/229326457): a 1980s two-and-a-half-storey block of buff stucco pilasters and
 * grey tile panels with big glazed bays curving round its corners, steel rails round a roof terrace; ZEA GALLERY in
 * steel capitals over its arched door and a red neon FINE ART, FINE ART & DECOR on the next bay, the ZK GALLERY in a
 * glass box at the Taylor corner (Mapillary 2217044922129857, 1526843651633790; OSM nodes Zea Gallery, ZK Gallery, Eden
 * Fine Art). `front` 351.
 */
export function taylorGalleries(out: MeshBuilder, fit: Fit): void {
  const FRONT = 351
  const ring = towerRing(fit)
  const H = 10.5, G = 4.2
  const BUFF: Rgb = [0.86, 0.74, 0.5], TILE: Rgb = [0.72, 0.74, 0.76], STEEL: Rgb = [0.55, 0.57, 0.6]
  faceBand(out, ring, 0, G, { kind: 'curtain', wall: [0.18, 0.18, 0.2], glass: [0.24, 0.28, 0.3], pitch: 2.4, floor: G, material: 'glass' })
  faceBand(out, ring, G, H - 1.2, { kind: 'fins', wall: TILE, glass: [0.22, 0.28, 0.33], floor: (H - 1.2 - G) / 2, pitch: 5.0, solid: 0.35, depth: 0.25, material: 'concrete' })
  faceBand(out, offsetRing(ring, 0.1), H - 1.2, H, { kind: 'blank', wall: BUFF, material: 'stucco' })
  capPolygon(out, ring, H, [0.42, 0.42, 0.42], CT)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 4) continue
    for (let u = 0.4; u < e.L; u += 5.0) slab(out, e, u, 0.15, 0, 1.0, H, 0.3, BUFF, ST)         // the buff pilasters
    slab(out, e, e.L / 2, -0.3, H + 0.1, e.L, 0.05, 0.05, STEEL, MT)                                // the terrace rail
    for (let u = 0.5; u < e.L; u += 1.6) slab(out, e, u, -0.3, H, 0.05, 1.05, 0.05, STEEL, MT)
  }
  const e = frontFacing(ring, FRONT, 351, 6)
  if (!e) return
  // u = 0 is the east (Taylor) end
  signAt(out, e, e.L * 0.62, G + 0.35, 0.3, { type: 'flat', text: 'ZEA GALLERY', h: 0.5, w: Math.min(6, e.L * 0.35), face: 'didone', colour: [0.85, 0.86, 0.88], lit: 'front', tracking: 0.15, panel: [0.15, 0.15, 0.17] })
  signAt(out, e, e.L * 0.85, G - 0.6, 0.3, { type: 'flat', text: 'FINE ART', h: 0.4, w: 3.2, face: 'script', colour: [1.0, 0.18, 0.12], lit: 'self' })
  signAt(out, e, e.L * 0.38, G - 0.6, 0.3, { type: 'flat', text: 'FINE ART & DECOR', h: 0.34, w: 4.0, face: 'didone', colour: WHITE, lit: 'front', panel: [0.1, 0.1, 0.12] })
  signAt(out, e, Math.min(4, e.L * 0.15), G + 0.35, 0.3, { type: 'flat', text: 'ZK GALLERY', h: 0.42, w: 4.5, face: 'grotesque', colour: WHITE, lit: 'front', tracking: 0.2, panel: [0.1, 0.1, 0.12] })
  // the paintings in the windows: bright rectangles behind the glass
  for (let u = 1.2; u < e.L - 1; u += 1.7) slab(out, e, u, 0.12, 1.0, 1.0, 1.3, 0.03, TEE[Math.floor(u * 3) % TEE.length], MT)
}

/**
 * THE TAYLOR STREET ROW, Taylor up from Jefferson to Beach (way/229326474, OSM "Nunzio Alioto"): a long one-storey shed
 * of WHITE SHIPLAP on a row of white posts, a clerestory of BLUE panels along its top under a red-edged cornice, a
 * little gabled lantern on the corner — the Wharf's "shoddy wood" (owner) — and under its eaves DARREN'S CAFÉ BREAKFAST
 * & LUNCH on a white board with a blue rim, ROYAL GALLERY SUNGLASSES, CABLE CAR STATION gifts, R & K JEWELRY, the bike
 * rental's BIKE THE GOLDEN GATE (Mapillary 3002444740125509, 644190428748315, 1304221881295449, 2025; names from OSM
 * nodes on 2711–2731 Taylor). `front` 81: Taylor is the edge facing local −z.
 */
export function taylorRow(out: MeshBuilder, fit: Fit): void {
  const FRONT = 81
  const ring = towerRing(fit)
  const G = 3.6, H = 6.2
  const WH: Rgb = [0.95, 0.95, 0.93], BLUE: Rgb = [0.18, 0.45, 0.7], REDT: Rgb = [0.75, 0.15, 0.15]
  faceBand(out, ring, 0, G, { kind: 'blank', wall: WH, material: 'clapboard' })
  faceBand(out, ring, G, H - 0.5, { kind: 'bands', wall: WH, glass: BLUE, floor: H - 0.5 - G, solid: 0.35, material: 'clapboard' })
  faceBand(out, offsetRing(ring, 0.2), H - 0.5, H, { kind: 'blank', wall: WH, material: 'clapboard' })
  faceBand(out, offsetRing(ring, 0.22), H - 0.12, H, { kind: 'blank', wall: REDT, material: 'clapboard' })
  capPolygon(out, ring, H, [0.45, 0.45, 0.45], CT)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 5) continue
    const b = bearingOf(e, FRONT)
    // the posts along the street faces, an eave over them
    if (near(b, 81) || near(b, 171) || near(b, 351)) {
      slab(out, e, e.L / 2, 0.9, G - 0.2, e.L, 0.25, 1.9, WH, WT)
      for (let u = 0.3; u < e.L; u += 3.2) slab(out, e, u, 1.65, 0, 0.22, G - 0.2, 0.22, WH, WT)
    }
  }
  const e = frontFacing(ring, FRONT, 81, 10)
  if (!e) return
  // the lantern at the Jefferson corner (u = L is the north end on an anticlockwise ring facing east)
  const lp = on(e, e.L - 3, H, -3)
  box(out, lp[0], H + 0.9, lp[2], 1.5, 0.9, 1.5, WH, WT)
  prism(out, lp[0], lp[2], H + 1.8, H + 3.0, 2.1, 4, [0.3, 0.45, 0.6], WT, 0.05)
  shopRow(out, e, 0.4, e.L - 0.4, 0, G - 0.25, [
    { name: 'BIKES', sub: 'BIKE THE GOLDEN GATE', sign: 'board', c: [0.98, 0.65, 0.1], ink: [0.1, 0.1, 0.1], face: 'block', blade: 'BIKE RENTAL' },
    { name: "Darren's Café", sub: 'BREAKFAST & LUNCH', sign: 'board', c: WH, ink: [0.15, 0.3, 0.6], face: 'script' },
    { name: 'Royal Gallery', sub: 'SUNGLASSES', sign: 'box', c: [0.1, 0.1, 0.12], ink: [0.95, 0.8, 0.3], goods: true },
    { name: 'CABLE CAR STATION', sub: 'GIFTS · T-SHIRTS', sign: 'bulbs', c: [0.85, 0.12, 0.12], ink: WHITE, face: 'block', goods: true },
    { name: 'R & K Jewelry', sign: 'neon', c: [0.4, 0.8, 1.0], face: 'script' },
    { name: 'Sushi GoGo', sign: 'board', c: [0.12, 0.12, 0.14], ink: [1.0, 0.4, 0.3], face: 'brush' },
  ].reverse() as Shop[], 71)
  // the Beach end
  const bch = frontFacing(ring, FRONT, 171, 8)
  if (bch) shopRow(out, bch, 0.4, bch.L - 0.4, 0, G - 0.25, [
    { name: 'Chennai Kings', sub: 'SOUTH INDIAN', sign: 'board', c: [0.85, 0.45, 0.1], ink: WHITE, face: 'slab' },
    { name: 'ALCATRAZ COMBO TOURS', sign: 'box', c: [0.1, 0.2, 0.45], ink: [1.0, 0.85, 0.2] },
    { name: 'Go Car Tours', sign: 'board', c: [0.98, 0.8, 0.1], ink: [0.1, 0.1, 0.1], face: 'block' },
  ], 73)
}

/**
 * THE $10 HOODIE STORE, 2699 Mason at Jefferson (way/1162388528): a one-storey box painted TURQUOISE all over, its
 * parapet a billboard of its own — a huge gold "$10" and HOODIES in red, "Don't be Chilly…" — and along Mason "ENTER ↓
 * $5 TEES · $5 HATS" over turquoise roll shutters; on its roof a lit billboard (SAINTLY SIPS · Applebee's) (Mapillary
 * 2158505394634382, 2025). OSM's 12 m is a guess; the store is one tall storey. `front` 81: Mason is local −z.
 */
export function hoodieStore(out: MeshBuilder, fit: Fit): void {
  const FRONT = 81
  const ring = towerRing(fit)
  const H = 6.0, TQ: Rgb = [0.3, 0.78, 0.78], RED: Rgb = [0.8, 0.1, 0.12], GOLD: Rgb = [0.95, 0.72, 0.2]
  faceBand(out, ring, 0, H, { kind: 'blank', wall: TQ, material: 'stucco' })
  faceBand(out, offsetRing(ring, 0.1), H - 0.25, H, { kind: 'blank', wall: [0.95, 0.95, 0.93], material: 'stucco' })
  capPolygon(out, ring, H, [0.45, 0.45, 0.45], CT)
  for (const b of [81, 351]) {
    const e = frontFacing(ring, FRONT, b, 6)
    if (!e) continue
    // the roll shutters and a door or two, all turquoise
    for (let u = 1.5; u < e.L - 1; u += 3.4) {
      slab(out, e, u, 0.05, 0, 2.8, 2.9, 0.06, [0.36, 0.84, 0.84], MT)
      for (let y = 0.2; y < 2.9; y += 0.18) slab(out, e, u, 0.09, y, 2.8, 0.03, 0.02, [0.25, 0.65, 0.65], MT)
    }
    // the white band and the big words
    slab(out, e, e.L / 2, 0.06, 3.0, e.L, 0.75, 0.06, WHITE, ST)
    signAt(out, e, e.L / 2, 3.38, 0.11, { type: 'flat', text: b === 81 ? 'ENTER  ·  $5 TEES  ·  $5 HATS  ·  HOODIES' : 'ENTER  ·  $5 TEES  ·  $5 HATS', h: 0.42, w: e.L - 0.8, face: 'block', colour: RED, lit: 'front' })
    signAt(out, e, Math.min(2.8, e.L * 0.22), 4.75, 0.11, { type: 'flat', text: '$10', h: 1.3, w: Math.min(3.4, e.L * 0.3), face: 'didone', weight: 'bold', colour: GOLD, halo: [0.4, 0.25, 0.05], lit: 'front' })
    signAt(out, e, e.L * 0.62, 5.15, 0.11, { type: 'flat', text: "Don't be Chilly…", h: 0.32, w: e.L * 0.55, face: 'brush', colour: RED, lit: 'front' })
    signAt(out, e, e.L * 0.62, 4.4, 0.11, { type: 'flat', text: 'HOODIES', h: 0.85, w: e.L * 0.62, face: 'didone', weight: 'bold', colour: RED, lit: 'front' })
  }
  // the billboard on the roof, on two legs, lit
  const e = frontFacing(ring, FRONT, 351, 6)
  if (e) {
    const u = e.L * 0.7
    for (const d of [-1.4, 1.4]) slab(out, e, u + d, -3, H, 0.2, 2.2, 0.2, [0.3, 0.3, 0.32], MT)
    slab(out, e, u, -3, H + 2.0, 4.6, 2.4, 0.3, [0.08, 0.08, 0.09], MT)
    slab(out, e, u, -2.83, H + 2.15, 4.3, 2.1, 0.02, [0.35, 0.75, 0.45], EMIT)
    signAt(out, e, u, H + 3.55, -2.8, { type: 'flat', text: 'SAINTLY SIPS', h: 0.42, w: 3.9, face: 'block', colour: WHITE, lit: 'self' })
    signAt(out, e, u, H + 2.6, -2.8, { type: 'flat', text: "Applebee's", h: 0.4, w: 3.0, face: 'grotesque', weight: 'bold', colour: [0.85, 0.1, 0.12], lit: 'self', panel: WHITE })
  }
}

/**
 * THE WHARF INN, 2601 Mason (way/288473103): a 1960s motel — three floors of rooms opening on long balcony walkways with
 * GOLD railings, cream walls, a royal-blue fascia along the roof, the cars parked under the building behind a carport
 * lettered WELCOME TO THE WHARF, and a tall blue blade with red stripes carrying the name down it (Mapillary
 * 650807603353744, 2022). `front` 81: Mason is local −z.
 */
export function wharfInn(out: MeshBuilder, fit: Fit): void {
  const FRONT = 81
  const ring = towerRing(fit)
  const G = 3.2, F = 2.9, H = G + 2 * F + 0.7
  const CREAM: Rgb = [0.94, 0.92, 0.84], GOLD: Rgb = [0.82, 0.68, 0.25], BLUE: Rgb = [0.12, 0.25, 0.65], RED: Rgb = [0.8, 0.15, 0.15]
  faceBand(out, ring, 0, G, { kind: 'blank', wall: [0.9, 0.88, 0.82], material: 'stucco' })
  faceBand(out, ring, G, H - 0.6, { kind: 'punched', wall: CREAM, glass: [0.3, 0.4, 0.55], floor: F, pitch: 3.4, solid: 0.45, material: 'stucco' })
  faceBand(out, offsetRing(ring, 0.5), H - 0.6, H, { kind: 'blank', wall: BLUE, material: 'stucco' })
  capPolygon(out, offsetRing(ring, 0.5), H, [0.45, 0.45, 0.45], CT)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 8) continue
    // the walkways on each upper floor, their gold railings
    for (let f = 0; f < 2; f++) {
      const y = G + f * F
      slab(out, e, e.L / 2, 0.8, y - 0.2, e.L, 0.2, 1.6, [0.85, 0.84, 0.8], CT)
      slab(out, e, e.L / 2, 1.58, y + 0.95, e.L, 0.07, 0.07, GOLD, MT)
      for (let u = 0.2; u < e.L; u += 0.25) slab(out, e, u, 1.58, y, 0.04, 0.95, 0.04, GOLD, MT)
    }
    // the posts under the walkways
    for (let u = 0.3; u < e.L; u += 4.5) slab(out, e, u, 1.5, 0, 0.25, G - 0.2, 0.25, [0.2, 0.2, 0.22], MT)
  }
  const e = frontFacing(ring, FRONT, 81, 10)
  if (!e) return
  // the carport: a dark opening under a lettered beam
  const cu = e.L * 0.35
  slab(out, e, cu, 0.03, 0, 6, G - 0.5, 0.05, [0.08, 0.08, 0.09], MT)
  slab(out, e, cu, 0.3, G - 0.6, 6.4, 0.45, 0.3, [0.2, 0.2, 0.22], MT)
  signAt(out, e, cu, G - 0.38, 0.47, { type: 'flat', text: 'WELCOME TO THE WHARF', h: 0.2, w: 5.8, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'back' })
  // the blade: blue, red stripes either side, the name down it and a lit VACANCY
  const bu = cu - 4.5
  slab(out, e, bu, 1.2, G - 0.3, 1.4, H - G + 2.3, 0.5, BLUE, MT)
  for (const d of [-0.85, 0.85]) slab(out, e, bu + d, 1.2, G - 0.3, 0.25, H - G + 1.8, 0.45, RED, MT)
  'WHARF INN'.split('').forEach((ch, k) => { if (ch !== ' ') signAt(out, e, bu, H + 1.4 - k * 0.68, 1.47, { type: 'flat', text: ch, h: 0.5, w: 1.1, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'self' }) })
  signAt(out, e, bu, G + 0.2, 1.47, { type: 'flat', text: 'VACANCY', h: 0.16, w: 1.2, face: 'grotesque', weight: 'bold', colour: [1.0, 0.25, 0.2], lit: 'self' })
}

/**
 * POLLO CAMPERO, 155 Jefferson (way/288473106): the low two-storey building between Ripley's and the old Wax Museum —
 * brown stucco under a dark shingled mansard skirt, a railed balcony across the first floor, the chicken place's yellow
 * and black board over a green awning (Mapillary 1458507285470593, 1289359246072032, 2025). `front` 351.
 */
export function polloCampero(out: MeshBuilder, fit: Fit): void {
  const FRONT = 351
  const ring = towerRing(fit)
  const G = 3.4, H = 6.8
  const BROWN: Rgb = [0.5, 0.4, 0.32], SHINGLE: Rgb = [0.18, 0.18, 0.2]
  faceBand(out, ring, 0, H, { kind: 'punched', wall: BROWN, glass: [0.18, 0.2, 0.22], floor: G, pitch: 2.4, solid: 0.35, material: 'stucco' })
  capPolygon(out, ring, H + 0.9, [0.3, 0.3, 0.32], CT)
  // the mansard skirt all round
  const outer = offsetRing(ring, 0.9)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], A = outer[i], B = outer[(i + 1) % ring.length]
    const nx = B.x - b.x + A.x - a.x, nz = B.z - b.z + A.z - a.z, nl = Math.hypot(nx, nz) || 1
    out.quad([[A.x, H - 0.4, A.z], [B.x, H - 0.4, B.z], [b.x, H + 0.9, b.z], [a.x, H + 0.9, a.z]], [nx / nl * 0.7, 0.7, nz / nl * 0.7], UVQ, SHINGLE, surfaceTag('tile'))
  }
  const e = frontFacing(ring, FRONT, 351, 5)
  if (!e) return
  slab(out, e, e.L / 2, 0.6, G, e.L, 0.15, 1.2, [0.4, 0.33, 0.27], CT)
  slab(out, e, e.L / 2, 1.18, G + 1.0, e.L, 0.06, 0.06, [0.15, 0.15, 0.15], MT)
  for (let u = 0.2; u < e.L; u += 0.3) slab(out, e, u, 1.18, G + 0.15, 0.04, 0.85, 0.04, [0.15, 0.15, 0.15], MT)
  shopRow(out, e, 0.3, e.L - 0.3, 0, G - 0.2, [{ name: 'Pollo Campero', sign: 'awning', c: [0.1, 0.45, 0.3], stripe: [0.1, 0.45, 0.3], ink: [1.0, 0.85, 0.15], face: 'brush' }], 81)
  slab(out, e, e.L / 2, 0.25, G + 0.1, Math.min(4.5, e.L - 1), 0.75, 0.2, [0.98, 0.82, 0.12], MT)
  signAt(out, e, e.L / 2, G + 0.48, 0.37, { type: 'flat', text: 'POLLO CAMPERO', h: 0.34, w: Math.min(4.2, e.L - 1.3), face: 'block', colour: [0.1, 0.1, 0.1], lit: 'back' })
}

/** the part of `ring` on one side of the line x = x0 (Sutherland–Hodgman, one half-plane): `less` keeps x < x0 */
function clipX(ring: P2[], x0: number, less: boolean): P2[] {
  const f = (p: P2): number => (less ? x0 - p.x : p.x - x0)
  const out: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length]
    const fp = f(p), fq = f(q)
    if (fp >= 0) out.push(p)
    if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t }) }
  }
  return out
}

/**
 * HOTEL ZEPHYR, 250 Beach Street, and its JEFFERSON FRONT (relation/1358120; a replacement for `hotelZephyr`, whose
 * bounding-box workaround roofed the whole block in one box). From the true outline:
 * - at Powell & Jefferson the separate cream office block with its CURVED GLASS corner and window bands (1 Jefferson,
 *   once CVS, its ground floor now FOR LEASE in red; Mapillary 1729491501056271, 1324237179413856, 2021032585095195);
 * - the hotel, charcoal, its wings reaching north round two deep courtyards;
 * - along Jefferson the row of one-storey boxes clad in black boards with rust-brick piers, white street numbers and
 *   planted roofs, each a shop — A PIECE OF THE CITY, PHONE REPAIR, MADE IN SAN FRANCISCO · ART & GIFT, KARANA Cultural
 *   Gift Shop, LIDS, PEARL FACTORY, MUSEUM OF 3D ILLUSIONS (Mapillary 1580290199612407, 1097001162403781,
 *   1308659187503332, 1508738680289115, 2025) — with the BURGERS & BEST PIES theatre marquee at the Mason end (the
 *   owner's report) and BIG BUS on the Mason corner (Mapillary 3837795086475776); the white light masts with spotlight
 *   arms and shop boards hung from them; the white ZEPHYR pylon at the Powell end; the HOTEL ZEPHYR walk-through;
 * - behind the boxes THE YARD, the hotel's 8,000 sq ft courtyard (theaureview.com, bostonglobe.com 2016): fire pits made
 *   of recycled soda cans, a life-size Connect Four and Jenga, the city's biggest periscope, tube ping-pong, a vintage
 *   food camper, Adirondack chairs, festoons (no photograph from inside: laid out GUESSED).
 * `front` 352: Jefferson faces local −z; local +x is west.
 */
export function zephyrHotel(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const BLACK: Rgb = [0.08, 0.08, 0.09], RUST: Rgb = [0.56, 0.29, 0.17], CHAR: Rgb = [0.34, 0.35, 0.36], GREEN: Rgb = [0.3, 0.45, 0.22]
  let x0 = Infinity, x1 = -Infinity, zN = Infinity, zS = -Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); zN = Math.min(zN, p.z); zS = Math.max(zS, p.z) }
  const CW = 25                                                     // the Powell corner block's width
  // -- the Powell corner block
  const corner = clipX(ring, x0 + CW, true)
  if (corner.length >= 3) {
    const CR: Rgb = [0.9, 0.85, 0.72]
    faceBand(out, corner, 0, 4.3, { kind: 'curtain', wall: CR, glass: [0.7, 0.85, 0.86], pitch: 2.2, floor: 4.3, material: 'glass' })
    faceBand(out, corner, 4.3, 11.6, { kind: 'bands', wall: CR, glass: [0.62, 0.72, 0.74], floor: 3.65, solid: 0.55, material: 'stucco' })
    faceBand(out, offsetRing(corner, 0.2), 11.6, 12.3, { kind: 'blank', wall: [0.75, 0.7, 0.6], material: 'stucco' })
    faceBand(out, offsetRing(corner, 0.9), 4.2, 4.45, { kind: 'blank', wall: [0.7, 0.71, 0.72], material: 'metal' })
    const cj = frontFacing(corner, 352, 352, 6)
    if (cj) {
      slab(out, cj, cj.L / 2, 0.05, 0.5, cj.L - 1, 0.7, 0.04, [0.85, 0.12, 0.2], MT)
      signAt(out, cj, cj.L / 2, 0.85, 0.09, { type: 'flat', text: 'FOR LEASE · ONE JEFFERSON', h: 0.3, w: cj.L - 2, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'none' })
    }
    capPolygon(out, corner, 12.3, [0.45, 0.45, 0.45], CT)
  }
  // -- the hotel
  const hotel = clipX(ring, x0 + CW, false)
  const H = 13
  if (hotel.length >= 3) {
    faceBand(out, hotel, 0, 4.0, { kind: 'curtain', wall: [0.14, 0.14, 0.15], glass: [0.24, 0.28, 0.3], pitch: 3, floor: 4.0, material: 'glass' })
    faceBand(out, hotel, 4.0, H - 0.5, { kind: 'bands', wall: CHAR, glass: [0.42, 0.45, 0.47], floor: (H - 4.5) / 3, solid: 0.5, material: 'stucco' })
    faceBand(out, offsetRing(hotel, 0.3), H - 0.5, H, { kind: 'blank', wall: [0.86, 0.86, 0.84], material: 'stucco' })
    capPolygon(out, hotel, H, [0.4, 0.4, 0.41], CT)
    // the name on the Beach front
    const bch = frontFacing(hotel, 352, 172, 20)
    if (bch) signAt(out, bch, bch.L * 0.6, H - 1.6, 0.08, { type: 'flat', text: 'HOTEL ZEPHYR', h: 0.9, w: 14, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'back', tracking: 0.2 })
  }
  // -- the boxes along Jefferson, from the corner block west to Mason
  const D = 8
  const e = edgeAt([{ x: x0 + CW + 0.5, z: zN }, { x: x1, z: zN }], 0)
  const L = e.L
  const shops: [string, number, number, Shop | null][] = [
    ['MUSEUM OF 3D ILLUSIONS', 9, 5.2, { name: 'MUSEUM', sub: 'OF 3D ILLUSIONS', sign: 'board', c: BLACK, ink: WHITE, face: 'didone' }],
    ['Pearl Factory', 7, 4.8, { name: 'Pearl Factory', sub: 'PICK A PEARL', sign: 'board', c: [0.96, 0.96, 0.94], ink: [0.1, 0.25, 0.5], face: 'roman' }],
    ['Lids', 7, 5.2, { name: 'Lids', sign: 'board', c: BLACK, ink: WHITE, face: 'grotesque' }],
    ['KARANA', 8, 5.0, { name: 'KARANA', sub: 'CULTURAL GIFT SHOP', sign: 'board', c: [0.1, 0.12, 0.2], ink: [0.9, 0.75, 0.4], face: 'didone' }],
    ['', 6, 0, null],
    ['MADE', 9, 5.0, { name: 'MADE in San Francisco', sub: 'ART & GIFT', sign: 'board', c: [0.96, 0.96, 0.94], ink: [0.75, 0.1, 0.3], face: 'roman' }],
    ['The Socialite', 7, 4.6, { name: 'The Socialite', sign: 'neon', c: [1.0, 0.4, 0.7], face: 'script' }],
    ['Aquamassage', 6, 4.4, { name: 'Aquamassage', sign: 'board', c: [0.1, 0.4, 0.6], ink: WHITE }],
    ['PHONE', 7, 4.8, { name: 'PHONE REPAIR', sub: 'APPLE · SAMSUNG', sign: 'box', c: [0.85, 0.1, 0.12], ink: WHITE, face: 'block' }],
    ['A PIECE OF THE CITY', 9, 5.2, { name: 'A Piece of the City', sub: 'SAN FRANCISCO GIFTS', sign: 'board', c: [0.96, 0.96, 0.94], ink: [0.1, 0.1, 0.12], face: 'slab' }],
    ['BURGERS', 9, 5.2, null],
    ['BIG BUS', 8, 5.4, { name: 'BIG BUS', sub: 'SAN FRANCISCO · TICKETS', sign: 'box', c: [0.96, 0.96, 0.94], ink: [0.75, 0.1, 0.25], face: 'block' }],
  ]
  const total = shops.reduce((a, x) => a + x[1], 0)
  const k = (L - 1) / total
  let u0 = 0.5, num = 55
  for (const [name, wRaw, h, shop] of shops) {
    const w = wRaw * k, u = u0 + w / 2
    u0 += w
    if (!name) {
      // the walk-through to The Yard: a black steel frame, HOTEL ZEPHYR on its beam
      for (const sd of [-1, 1]) slab(out, e, u + sd * (w / 2 - 0.2), -0.4, 0, 0.3, 5.2, 0.3, BLACK, MT)
      slab(out, e, u, -0.4, 4.6, w, 0.6, 0.35, BLACK, MT)
      signAt(out, e, u, 4.9, -0.2, { type: 'flat', text: 'HOTEL ZEPHYR', h: 0.32, w: w - 0.6, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'back', tracking: 0.15 })
      continue
    }
    slab(out, e, u, -D / 2 + 0.1, 0, w - 0.25, h, D - 0.2, BLACK, WT)
    for (let x = -w / 2 + 0.4; x < w / 2 - 0.2; x += 0.6) panel(out, e, u + x, 0.02, 3.6, 0.04, h - 3.7, [0.13, 0.13, 0.14], WT)
    slab(out, e, u + w / 2 - 0.1, 0.05, 0, 0.75, 3.2, 0.4, RUST, BT)
    slab(out, e, u, -D / 2, h, w - 1.2, 0.35, D - 1.4, GREEN, FT)
    for (let sIdx = 0; sIdx < 3; sIdx++) {
      const p = on(e, u - w * 0.3 + sIdx * w * 0.3, h + 0.35, -1.4 - sIdx * 1.7)
      prism(out, p[0], p[2], p[1], p[1] + 0.7 + 0.4 * ((sIdx + num) % 3), 0.45 + 0.1 * sIdx, 6, [0.24 + 0.04 * sIdx, 0.4, 0.2], FT, 0.15)
    }
    signAt(out, e, u - w / 2 + 0.8, h - 0.9, 0.06, { type: 'flat', text: String(num), h: 0.32, w: 1.0, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'none' })
    num += 4
    if (name === 'BURGERS') {
      // the theatre marquee (the owner's report; no photograph): red box, chaser bulbs, white letterboard, a crest
      const MO = 2.2
      slab(out, e, u, MO / 2, 3.4, w - 0.6, 1.3, MO, [0.72, 0.1, 0.12], MT)
      slab(out, e, u, MO + 0.02, 3.55, w - 1.2, 1.0, 0.04, [0.97, 0.95, 0.88], MT)
      signAt(out, e, u, 4.3, MO + 0.07, { type: 'flat', text: 'BURGERS & BEST PIES', h: 0.32, w: w - 1.5, face: 'condensed', weight: 'bold', colour: [0.75, 0.08, 0.1], lit: 'back', tracking: 0.08 })
      signAt(out, e, u, 3.82, MO + 0.07, { type: 'flat', text: 'OPEN DAILY · SHAKES · FRIES', h: 0.16, w: w - 1.5, face: 'condensed', colour: [0.15, 0.15, 0.15], lit: 'back' })
      for (const y of [3.42, 4.68]) bulbRow(out, on(e, u - w / 2 + 0.35, y, MO + 0.05), on(e, u + w / 2 - 0.35, y, MO + 0.05), 0.25, 0.04)
      continue
    }
    if (shop) loudShop(out, e, u, w - 0.9, 0, 3.6, shop, num)
    slab(out, e, u, 0.06, h - 1.75, Math.min(w - 1.6, 5.2), 0.8, 0.06, [0.12, 0.13, 0.15], MT)
    if (shop) signAt(out, e, u, h - 1.35, 0.1, { type: 'flat', text: shop.name, h: 0.34, w: Math.min(w - 1.8, 5.0), face: shop.face ?? 'grotesque', weight: 'bold', colour: shop.sign === 'neon' ? shop.c : (shop.ink ?? WHITE), lit: 'back' })
  }
  // the light masts with their spotlight arms, and a white board hung from each with a shop's mark
  let m = 0
  for (let u = 6; u < L - 3; u += 12, m++) {
    const b = on(e, u, 0, 1.3), t = on(e, u, 9.0, 1.3)
    tube(out, b, t, 0.11, 8, WHITE, MT, 0.08)
    for (const sd of [-1, 1]) {
      const arm = on(e, u + sd * 0.7, 8.6, 1.3)
      tube(out, on(e, u, 8.6, 1.3), arm, 0.035, 5, WHITE, MT)
      box(out, arm[0], arm[1] - 0.12, arm[2], 0.1, 0.1, 0.1, [0.85, 0.85, 0.85], MT)
    }
    tube(out, on(e, u, 4.6, 1.3), on(e, u + 0.9, 4.6, 1.3), 0.03, 4, WHITE, MT)
    const bp = on(e, u + 0.75, 4.05, 1.3)
    boxAlong(out, bp[0], bp[1], bp[2], 0.06, 0.45, 0.32, e.heading + Math.PI / 2, WHITE, MT)
    const sh = shops[(m * 5) % shops.length][3]
    if (sh) for (const sd of [1, -1]) {
      const h2 = e.heading + (sd > 0 ? 0 : Math.PI)
      sign(out, { type: 'flat', text: sh.name.split(' ')[0], h: 0.14, w: 0.55, face: 'grotesque', weight: 'bold', colour: [0.1, 0.1, 0.12], lit: 'front' }, { x: bp[0] + Math.sin(h2) * 0.07, y: bp[1], z: bp[2] + Math.cos(h2) * 0.07, heading: h2 })
    }
  }
  // the ZEPHYR pylon at the Powell end of the row
  const pu = 1.5
  for (const sd of [-1, 1]) slab(out, e, pu + sd * 0.75, 1.2, 0, 0.18, 10.5, 0.18, BLACK, MT)
  slab(out, e, pu, 1.2, 4.6, 0.35, 5.6, 1.5, WHITE, MT)
  for (const sd of [1, -1]) {
    const c = on(e, pu, 0, 1.2)
    const hd = e.heading + (sd > 0 ? Math.PI / 2 : -Math.PI / 2)
    const nx = Math.sin(hd), nz = Math.cos(hd)
    sign(out, { type: 'flat', text: 'zephyr', h: 0.45, w: 1.4, face: 'grotesque', colour: [0.25, 0.27, 0.3], lit: 'back', vertical: true }, { x: c[0] + nx * 0.19, y: 6.8, z: c[2] + nz * 0.19, heading: hd })
    sign(out, { type: 'flat', text: 'HOTEL', h: 0.2, w: 1.3, face: 'grotesque', weight: 'bold', colour: [0.25, 0.27, 0.3], lit: 'back' }, { x: c[0] + nx * 0.19, y: 9.3, z: c[2] + nz * 0.19, heading: hd })
    ellipse(out, [c[0] + nx * 0.19, 9.9, c[2] + nz * 0.19], [Math.cos(hd), 0, -Math.sin(hd)], [0, 1, 0], [nx, 0, nz], 0.45, 0.45, 16, [0.25, 0.27, 0.3], MT)
  }
  // -- THE YARD: the hotel's courtyards open north to the boxes; the widest one (the deepest notch) is The Yard, the
  // others get picnic tables and festoons. A notch is found by its bottom: a north-facing wall far back in the ring.
  const bottoms: Edge[] = []
  for (let i = 0; i < hotel.length; i++) {
    const q = edgeAt(hotel, i)
    if (!(q.L > 9 && q.nz < -0.9 && q.mid.z > zN + D + 15)) continue
    // a courtyard has the hotel's walls on BOTH sides of its bottom; the open lot at the Mason end has only one
    const xa = Math.min(q.a.x, q.b.x), xb = Math.max(q.a.x, q.b.x)
    const westWall = hotel.some((p) => p.z < q.mid.z - 5 && p.x < xa + 0.5), eastWall = hotel.some((p) => p.z < q.mid.z - 5 && p.x > xb - 0.5)
    if (westWall && eastWall) bottoms.push(q)
  }
  bottoms.sort((a, b) => b.L - a.L)
  const zOpen = zN + D + 2
  // paving: the strip behind the boxes and the floor of each courtyard, warm pavers a little over the ground
  let wingN = zS
  for (const p of hotel) if (p.z > zN + D + 1) wingN = Math.min(wingN, p.z)
  const pave = (xa: number, xb: number, za: number, zb: number, c: Rgb): void =>
    capPolygon(out, [{ x: xa, z: zb }, { x: xb, z: zb }, { x: xb, z: za }, { x: xa, z: za }], 0.04, c, CT)
  pave(x0 + CW, x1, zN + D, wingN + 0.3, [0.62, 0.55, 0.48])
  for (const q of bottoms) pave(Math.min(q.a.x, q.b.x), Math.max(q.a.x, q.b.x), wingN, q.mid.z, q === bottoms[0] ? [0.55, 0.42, 0.34] : [0.62, 0.55, 0.48])
  for (const q of bottoms.slice(1)) {
    const xa = Math.min(q.a.x, q.b.x) + 1.5, xb = Math.max(q.a.x, q.b.x) - 1.5
    for (let z = zOpen + 3; z < q.mid.z - 3; z += 7) {
      festoon(out, [xa, 4.5, z], [xb, 4.5, z + 3], 0.4)
      cafeSet(out, (xa + xb) / 2, z + 1.5, 0, null, [0.55, 0.38, 0.22])
    }
    planter(out, xa + 1, q.mid.z - 2, 0, 0.8)
    planter(out, xb - 1, q.mid.z - 2, 0, 0.8)
  }
  // the strip between the boxes and the hotel: paving lights and festoons along it
  for (let x = x0 + CW + 4; x < x1 - 4; x += 9) festoon(out, [x, 4.2, zN + D + 0.5], [x + 4.5, 4.2, zN + D + 7], 0.4)
  const yard = bottoms[0]
  if (!yard) return
  const yx0 = Math.min(yard.a.x, yard.b.x) + 2, yx1 = Math.max(yard.a.x, yard.b.x) - 2
  const yz0 = zOpen, yz1 = yard.mid.z - 1.5
  const at = (fx: number, fz: number): [number, number] => [yx0 + (yx1 - yx0) * fx, yz0 + (yz1 - yz0) * fz]
  // fire pits: rings of bright cans
  for (const [fx, fz] of [[0.2, 0.5], [0.45, 0.35], [0.75, 0.55]] as [number, number][]) {
    const [x, z] = at(fx, fz)
    prism(out, x, z, 0, 0.5, 0.9, 12, [0.75, 0.15, 0.12], MT)
    prism(out, x, z, 0.5, 0.52, 0.7, 12, [0.15, 0.15, 0.15], MT)
    box(out, x, 0.65, z, 0.35, 0.12, 0.35, [1.0, 0.55, 0.15], EMIT)
    for (let a = 0; a < 6; a++) {
      const cx = x + Math.cos(a) * 2.1, cz = z + Math.sin(a) * 2.1
      box(out, cx, 0.4, cz, 0.38, 0.4, 0.38, TEE[a % TEE.length], WT)
      box(out, cx + Math.cos(a) * 0.35, 0.85, cz + Math.sin(a) * 0.35, 0.38, 0.45, 0.06, TEE[a % TEE.length], WT)
    }
  }
  // the life-size Connect Four: a blue frame of red and yellow discs
  {
    const [x, z] = at(0.32, 0.15)
    box(out, x, 1.1, z, 1.3, 1.1, 0.08, [0.1, 0.3, 0.75], MT)
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) if ((r * 7 + c) % 3 !== 2) { const dx = x - 1.08 + c * 0.36, dy = 0.25 + r * 0.36; for (const sz of [1, -1]) out.quad([[dx - 0.13, dy - 0.13, z + sz * 0.09], [dx + 0.13, dy - 0.13, z + sz * 0.09], [dx + 0.13, dy + 0.13, z + sz * 0.09], [dx - 0.13, dy + 0.13, z + sz * 0.09]], [0, 0, sz], UVQ, (r + c) % 2 ? [0.9, 0.12, 0.12] : [1.0, 0.85, 0.1], MT) }
    for (const sd of [-1, 1]) box(out, x + sd * 1.35, 0.5, z, 0.06, 0.5, 0.5, [0.1, 0.3, 0.75], MT)
  }
  // the giant Jenga
  { const [x, z] = at(0.6, 0.18); for (let r = 0; r < 10; r++) for (let c = -1; c <= 1; c++) if ((r + c) % 4 !== 0) box(out, x + (r % 2 ? 0 : c * 0.34), 0.08 + r * 0.16, z + (r % 2 ? c * 0.34 : 0), r % 2 ? 0.5 : 0.15, 0.07, r % 2 ? 0.15 : 0.5, [0.85, 0.7, 0.45], WT) }
  // the periscope: a tall grey tube, its hooded head turned to the bay
  { const [x, z] = at(0.88, 0.25); tube(out, [x, 0, z], [x, 7.5, z], 0.25, 10, [0.55, 0.58, 0.6], MT); box(out, x, 7.6, z - 0.3, 0.35, 0.35, 0.6, [0.55, 0.58, 0.6], MT); box(out, x, 7.6, z - 0.92, 0.25, 0.25, 0.02, [0.15, 0.2, 0.25], GT); box(out, x, 1.5, z + 0.3, 0.3, 0.12, 0.25, [0.2, 0.2, 0.22], MT) }
  // tube ping-pong tables, Adirondack chairs, the vintage camper, festoons
  for (const [fx, fz] of [[0.12, 0.8], [0.55, 0.8]] as [number, number][]) {
    const [x, z] = at(fx, fz)
    box(out, x, 0.74, z, 1.37, 0.03, 0.76, [0.1, 0.45, 0.3], MT)
    box(out, x, 0.84, z, 0.02, 0.08, 0.8, WHITE, MT)
    for (const sx of [-1, 1]) box(out, x + sx * 1.1, 0.37, z, 0.05, 0.37, 0.5, [0.2, 0.2, 0.2], MT)
  }
  { const [x, z] = at(0.88, 0.75)
    for (let s = 0; s < 8; s++) { const a = (s / 8) * Math.PI; box(out, x, 1.2 + Math.sin(a) * 1.1, z + Math.cos(a) * 2.6, 1.15, 0.06, 0.4, [0.82, 0.84, 0.86], MT) }
    box(out, x, 1.1, z, 1.15, 0.9, 2.6, [0.82, 0.84, 0.86], MT)
    box(out, x - 1.17, 1.4, z, 0.02, 0.4, 1.2, [0.2, 0.25, 0.3], GT)
    box(out, x - 1.6, 1.0, z, 0.45, 0.04, 1.2, [0.95, 0.75, 0.2], WT)
    for (const sz of [-1.4, 1.4]) prism(out, x, z + sz, 0, 0.35, 0.33, 8, [0.12, 0.12, 0.12], MT)
    sign(out, { type: 'flat', text: 'PIZZA', h: 0.22, w: 1.2, face: 'brush', colour: [0.85, 0.1, 0.1], lit: 'front' }, { x: x - 1.19, y: 1.95, z, heading: -Math.PI / 2 }) }
  for (let a = 0; a < 10; a++) {
    const [x, z] = at(0.1 + (a % 5) * 0.18, a < 5 ? 0.62 : 0.38)
    const c = TEE[(a * 3) % TEE.length]
    box(out, x + 1.1, 0.35, z, 0.3, 0.05, 0.3, c, WT)
    box(out, x + 1.1, 0.7, z + 0.3, 0.3, 0.35, 0.04, c, WT)
  }
  for (let f = 0.1; f < 1; f += 0.2) { const [xa, za] = at(f, 0.02), [xb, zb] = at(f + 0.1, 0.98); festoon(out, [xa, 4.5, za], [xb, 4.5, zb], 0.5, 0.6) }
}

/**
 * RIPLEY'S BELIEVE IT OR NOT!, 175 Jefferson at Taylor (way/288473102): a scalloped ARCADE of red piers flaring into
 * round arches along both street fronts, the arches' red rings standing above the roof like a row of scallops; in each
 * bay dark glass under the arch and below it a MURAL of San Francisco on sky blue — the Golden Gate's red towers, a
 * cable-car XING sign, the Palace of Fine Arts — with "Ripley's Believe It or Not!" across it in yellow script; on the
 * Taylor bays APPLEBEE'S apple; on the ground floor red columns, glass, the entrance under a silver fan-arch marquee
 * with the name again in yellow, and WHARF CENTRAL's boards (Mapillary 1313734760314896, 195540726374305,
 * 747140704615642, 751491004151776; 2022–25). A replacement for `ripleysBelieveItOrNot` (civic-1.ts), whose pale-blue
 * "mural" band and plain walls read as a blue box. `front` 351.
 */
export function ripleys(out: MeshBuilder, fit: Fit): void {
  const FRONT = 351
  const ring = towerRing(fit)
  const RED: Rgb = [0.78, 0.1, 0.12], REDD: Rgb = [0.6, 0.07, 0.09], SKY: Rgb = [0.55, 0.72, 0.88], YEL: Rgb = [1.0, 0.8, 0.12]
  const G = 4.2, SP = 10.4, H = 13.2
  faceBand(out, ring, 0, H - 0.4, { kind: 'blank', wall: REDD, material: 'stucco' })
  capPolygon(out, ring, H - 0.4, [0.42, 0.42, 0.44], CT)
  let bay = 0
  for (const b of [351, 261]) {
    const e = frontFacing(ring, FRONT, b, 8)
    if (!e) continue
    const n = Math.max(2, Math.round(e.L / 5.4)), bw = e.L / n
    for (let k = 0; k < n; k++, bay++) {
      const u = (k + 0.5) * bw, r = bw / 2 - 0.45
      // the mural panel, the glass in the arch head
      panel(out, e, u, 0.08, G + 0.6, bw - 0.9, SP - G - 0.9, SKY, MT)
      panel(out, e, u, 0.08, SP - 0.3, bw - 0.9, 0.3, [0.16, 0.19, 0.24], GT)
      const N = 8
      for (let j = 0; j < N; j++) {
        const a0 = (j / N) * Math.PI, a1 = ((j + 1) / N) * Math.PI
        const P = (a: number, rr: number, o: number): V3 => on(e, u + Math.cos(a) * rr, SP + Math.sin(a) * rr * 0.85, o)
        out.quad([P(a0, 0, 0.08), P(a0, r, 0.08), P(a1, r, 0.08), P(a1, 0, 0.08)], [e.nx, 0, e.nz], UVQ, [0.16, 0.19, 0.24], GT)
        // the red arch ring, proud of the wall and rising over the roof
        out.quad([P(a0, r, 0.45), P(a0, r + 0.75, 0.45), P(a1, r + 0.75, 0.45), P(a1, r, 0.45)], [e.nx, 0, e.nz], UVQ, RED, ST)
        out.quad([P(a0, r + 0.75, 0.45), P(a0, r + 0.75, 0.0), P(a1, r + 0.75, 0.0), P(a1, r + 0.75, 0.45)], [e.nx * 0.3, 0.9, e.nz * 0.3], UVQ, RED, ST)
      }
      for (let m = 1; m < 3; m++) panel(out, e, u - (bw - 0.9) / 2 + (m * (bw - 0.9)) / 3, 0.1, SP - 0.3, 0.06, r * 0.85 + 0.3, [0.75, 0.75, 0.78], MT)
      // the piers between bays, flaring as they rise
      for (const sd of [-1, 1]) {
        const pu = u + sd * bw / 2
        slab(out, e, pu, 0.2, 0, 0.7, SP, 0.45, RED, ST)
        slab(out, e, pu, 0.25, G, 1.1, SP - G, 0.5, RED, ST)
      }
      // the mural's pictures, one to a bay in turn
      const pic = bay % 4
      if (pic === 0) {
        for (const d of [-0.8, 0.8]) panel(out, e, u + d * bw * 0.3, 0.1, G + 0.6, 0.35, SP - G - 1.3, [0.85, 0.25, 0.15], MT)
        panel(out, e, u, 0.1, G + 2.0, bw - 1.0, 0.25, [0.85, 0.25, 0.15], MT)
      } else if (pic === 1) {
        const c = on(e, u, G + 3.1, 0.11)
        out.quad([[c[0] - e.tx * 1.4, c[1], c[2] - e.tz * 1.4], [c[0], c[1] - 1.4, c[2]], [c[0] + e.tx * 1.4, c[1], c[2] + e.tz * 1.4], [c[0], c[1] + 1.4, c[2]]], [e.nx, 0, e.nz], UVQ, [1.0, 0.85, 0.15], MT)
        signAt(out, e, u, G + 2.9, 0.13, { type: 'flat', text: 'XING', h: 0.35, w: 1.4, face: 'grotesque', weight: 'bold', colour: [0.1, 0.1, 0.1], lit: 'none' })
      } else if (pic === 2) {
        panel(out, e, u, 0.1, G + 0.8, bw - 1.6, 2.0, [0.85, 0.75, 0.6], MT)
        const d = on(e, u, G + 2.8, 0.11)
        ellipse(out, d, [e.tx, 0, e.tz], [0, 1, 0], [e.nx, 0, e.nz], 1.2, 1.0, 12, [0.75, 0.62, 0.48], MT)
      }
    }
    // the ground floor: glass between the piers, WHARF CENTRAL's boards
    panel(out, e, e.L / 2, 0.06, 0.2, e.L - 0.8, G - 0.9, [0.22, 0.25, 0.28], GT)
    if (b === 261) {
      // APPLEBEE'S on the Taylor arches: the red apple and the name in white on red
      const au = e.L * 0.7
      ellipse(out, on(e, au - 1.6, SP + 0.6, 0.12), [e.tx, 0, e.tz], [0, 1, 0], [e.nx, 0, e.nz], 0.55, 0.55, 14, [0.85, 0.1, 0.12], MT)
      signAt(out, e, au + 0.6, SP + 0.6, 0.12, { type: 'flat', text: "Applebee's", h: 0.5, w: 3.6, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'self', halo: [0.6, 0.05, 0.08] })
      shopRow(out, e, 0.6, e.L - 0.6, 0, G - 0.4, [
        { name: 'WHARF CENTRAL', sub: 'T-SHIRTS · HOODIES · GIFTS', sign: 'board', c: WHITE, ink: [0.8, 0.1, 0.12], face: 'block', goods: true },
        { name: 'WHARF CENTRAL', sub: 'SAN FRANCISCO SOUVENIRS', sign: 'board', c: WHITE, ink: [0.8, 0.1, 0.12], face: 'block', goods: true },
      ], 91)
    } else {
      // the name across the Jefferson mural, and the silver fan-arch marquee over the door
      signAt(out, e, e.L * 0.45, SP - 1.6, 0.16, { type: 'flat', text: "Ripley's Believe It or Not!", h: 0.85, w: e.L * 0.85, face: 'brush', colour: YEL, halo: [0.7, 0.08, 0.08], lit: 'self' })
      const mu = e.L * 0.3, MW = 5.0
      const SIL: Rgb = [0.8, 0.81, 0.83]
      for (let j = 0; j < 10; j++) {
        const a0 = (j / 10) * Math.PI, a1 = ((j + 1) / 10) * Math.PI
        const P = (a: number, rr: number): V3 => on(e, mu + Math.cos(a) * rr, G - 0.2 + Math.sin(a) * rr * 0.55, 1.2)
        out.quad([P(a0, 0), P(a0, MW / 2), P(a1, MW / 2), P(a1, 0)], [e.nx, 0, e.nz], UVQ, j % 2 ? SIL : [0.65, 0.66, 0.7], MT)
      }
      slab(out, e, mu, 0.6, G - 0.5, MW + 0.6, 0.35, 1.3, SIL, MT)
      signAt(out, e, mu, G + 0.45, 1.25, { type: 'flat', text: "Ripley's Believe It or Not!", h: 0.36, w: MW - 0.6, face: 'brush', colour: YEL, halo: [0.7, 0.08, 0.08], lit: 'self' })
      bulbRow(out, on(e, mu - MW / 2, G - 0.32, 1.27), on(e, mu + MW / 2, G - 0.32, 1.27), 0.25)
      shopRow(out, e, mu + MW / 2 + 0.6, e.L - 0.6, 0, G - 0.4, [
        { name: 'WHARF CENTRAL', sub: 'GIFTS · APPAREL', sign: 'board', c: WHITE, ink: [0.8, 0.1, 0.12], face: 'block', goods: true },
      ], 93)
    }
  }
}

export const WHARF_LANDSIDE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  argonautHotel,
  anchorsLandingGarage: graded(anchorsLandingGarage),
  anchorCourtHotel: graded(anchorCourtHotel),
  anchorCourtLife: graded(anchorCourtLife),
  canneryNorth: graded(cannery(true)),
  canneryBeach: graded(cannery(false)),
  canneryCourt: graded(canneryCourt),
  jonesStrip: graded(jonesStrip),
  supremeCrab: graded(supremeCrab),
  taylorGalleries: graded(taylorGalleries),
  taylorRow: graded(taylorRow),
  hoodieStore: graded(hoodieStore),
  wharfInn: graded(wharfInn),
  polloCampero: graded(polloCampero),
  zephyrHotel: graded(zephyrHotel),
  ripleys: graded(ripleys),
  anchorCourtWestA: graded(courtWall([COURT_SHOPS[2], COURT_SHOPS[7], COURT_SHOPS[4]], 21)),
  anchorCourtWestB: graded(courtWall([COURT_SHOPS[9], COURT_SHOPS[3]], 23)),
  anchorPassageA: graded(courtWall([COURT_SHOPS[11], COURT_SHOPS[0], COURT_SHOPS[5]], 25, true)),
  anchorPassageB: graded(courtWall([COURT_SHOPS[8], COURT_SHOPS[1]], 27, true)),
}
