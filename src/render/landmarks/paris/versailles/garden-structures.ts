/**
 * The structures of the Versailles gardens and park that are architecture, not sculpture (owner, 2026-11-15: "any actual large-scale
 * STRUCTURE that our GLB modeling can't handle needs a custom renderer"; the statues are GLBs and are not here):
 *
 *   * the GROTTO OF THE BAINS D'APOLLON (Hubert Robert, 1778–81; OSM way/224643670, 35 × 23 m): a cliff of artificial rock at the
 *     back of the bosquet's lake, a great arched grotto in the middle for Girardon's Apollo and the nymphs, a lower niche either
 *     side for the horses of the Sun, water falling down the rock into the lake. OSM's three artwork points put the groups in a
 *     line across it; its pond (way/224643711) lies along its north-west side, so −z faces bearing 315.
 *   * the TREILLAGE OF THE BOSQUET DE L'ENCELADE (Hardouin-Mansart, 1676; restored 1998; OSM relation/8420868, a ring 54 m across
 *     and 4.5 m deep round the basin): a gallery of arched trellis bowers painted green, climbers over its vault, a domed cabinet
 *     at each diagonal and an opening on each axis. Drawn on the fit's ring and its hole, so it follows OSM's octagon.
 *   * LA LANTERNE (1787, the Prince de Poix's hunting lodge, now a state residence; OSM way/74630403): two storeys of pale render
 *     under a slate mansard, a U round its court, on its OSM footprint.
 *
 * Tunables are the constants at the top of each.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { dome, hex, shade } from '../../kit.ts'
import { boxAlong } from '../../parts.ts'
import { block } from '../batch2/tag.ts'
import { crag } from '../batch3/parks.ts'
import { extrude, palette, pts, type Storey } from '../palaces/common.ts'

type P2 = { x: number; z: number }
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }
/** boxAlong's heading for a box whose local x runs along (tx, tz) */
const headingOf = (tx: number, tz: number): number => Math.atan2(-tz, tx)

/* ------------------------------------------------------------------------------------------- the Bains d'Apollon */

/** the rock: half its length, its front (at the water) and back, its height in the middle and at the wings, the courses */
const GROTTO = {
  half: 16.5, front: -6.5, back: 8.5, peak: 14, wing: 5, course: 2, step: 2.8,
  /** a crag's half-size, and how much more it may be */
  crag: [2, 1.7, 1.7] as [number, number, number], vary: 0.9,
  rock: '#8b8475', moss: '#6f7458', dark: '#1e1b16',
  /** how far behind the rock's face the grottoes' dark starts */
  recess: 3,
  /** how far the face leans back between the water and the top */
  lean: 4.5,
  /** the great grotto in the middle and the niches either side: centre x, width, height, how deep the dark goes */
  mouth: { x: 0, w: 8.5, h: 8.2, depth: 7 },
  niches: [{ x: -10.5, w: 5.5, h: 6, depth: 5 }, { x: 10.5, w: 5.5, h: 6, depth: 5 }],
  /** the falls: x, the lip's height over the water, the sheet's width */
  falls: [{ x: -5.6, y: 10.5, w: 1.6 }, { x: 5.8, y: 10.2, w: 1.4 }, { x: 14.6, y: 5, w: 1 }, { x: -14.2, y: 4.4, w: 0.8 }],
}

export function versaillesBainsApollon(out: MeshBuilder, fit: Fit): void {
  const G = GROTTO, y = fit.grade ?? 0, ROCK = hex(G.rock), MOSS = hex(G.moss), DARK = hex(G.dark)
  const H = (x: number): number => G.wing + (G.peak - G.wing) * Math.max(0, 1 - Math.pow(Math.abs(x) / G.half, 1.6))
  const holes = [G.mouth, ...G.niches]
  const holeAt = (x: number): (typeof holes)[number] | undefined => holes.find((o) => Math.abs(x - o.x) < o.w / 2)
  /** the face's z at a height: the cliff leans back as it climbs */
  const faceZ = (yy: number): number => G.front + G.recess * 0.5 + (yy / G.peak) * G.lean
  // the cliff's body, a column to every step along it, solid to its height; over an opening only its lintel, the dark behind
  const n = Math.round((2 * G.half) / G.step)
  for (let i = 0; i < n; i++) {
    const x0 = -G.half + i * G.step, x1 = x0 + G.step, xm = (x0 + x1) / 2, top = H(xm) - 0.8
    const o = holeAt(xm)
    const from = o ? o.h : -0.5
    if (top > from) block(out, x0, x1, faceZ(from) + 0.6, G.back - 1, y + from, y + top, shade(ROCK, 0.62), surfaceTag('rock'))
    if (o) {
      block(out, x0, x1, G.front + G.recess + o.depth, G.back - 1, y - 0.5, y + o.h, shade(ROCK, 0.5), surfaceTag('rock'))
      block(out, x0, x1, G.front + G.recess, G.front + G.recess + o.depth, y - 0.2, y + 0.5, shade(ROCK, 1.1), surfaceTag('rock'))
    }
  }
  // the grottoes' dark: walls either side and a back, so the opening has depth, not a black board
  for (const o of holes) {
    block(out, o.x - o.w / 2, o.x + o.w / 2, G.front + G.recess + o.depth - 0.3, G.front + G.recess + o.depth, y, y + o.h, DARK)
    for (const sx of [-1, 1]) block(out, o.x + sx * o.w / 2 - 0.3, o.x + sx * o.w / 2 + 0.3, G.front + G.recess - 0.5, G.front + G.recess + o.depth, y, y + o.h, shade(DARK, 1.6), surfaceTag('rock'))
    block(out, o.x - o.w / 2, o.x + o.w / 2, G.front + G.recess, G.front + G.recess + o.depth, y + o.h - 0.4, y + o.h, shade(DARK, 1.3))
  }
  // crags draped on the face, course over course, overlapping (a crag is a dome from its foot up); the openings' jambs are crags
  let seed = 0
  for (let c = 0; c * G.course <= G.peak; c++) {
    const yy = c * G.course
    for (let x = -G.half - 0.5; x <= G.half + 0.5; x += G.step * 0.8) {
      const xx = x + (c % 2) * G.step * 0.4 + (hash(c, x) - 0.5) * 0.8
      if (yy > H(xx) + 0.5) continue
      const o = holeAt(xx)
      if (o && yy < o.h - 1.2 && Math.abs(xx - o.x) < o.w / 2 - 0.8) continue
      const up = yy / G.peak, col = up > 0.5 && hash(c + 3, x) > 0.45 ? MOSS : ROCK
      const ry = G.crag[1] + hash(c, xx) * G.vary * 0.7
      crag(out, xx, y + (c === 0 ? -0.3 : yy - ry * 0.45), faceZ(yy) - 0.4 + hash(x, c) * 0.6, G.crag[0] + hash(xx, c) * G.vary, ry, G.crag[2] + hash(xx + 1, c) * G.vary * 0.6, seed++ * 1.37,
        shade(col, 0.86 + hash(seed, 2) * 0.26))
    }
  }
  // boulders at the foot, out in the water
  for (let i = 0; i < 9; i++) {
    const x = -G.half + 2 + (i / 8) * (2 * G.half - 4) + (hash(i, 9) - 0.5) * 2
    if (holeAt(x)) continue
    crag(out, x, y - 0.7, G.front - 0.5 + (hash(9, i) - 0.5) * 1.5, 1.4 + hash(i, 3), 1, 1.2, seed++ * 1.37, shade(ROCK, 0.85))
  }
  // the falls, down the face into the lake
  for (const f of G.falls) {
    const z = faceZ(f.y) - 1.6
    out.water.push({ kind: 'sheet', a: [f.x - f.w / 2, y + f.y, z], b: [f.x + f.w / 2, y + f.y, z], out: 0.35, drop: f.y + 0.4 })
    out.water.push({ kind: 'splash', at: [f.x, y - 0.2, G.front - 0.2], r: 0.6 + f.w * 0.5 })
  }
}

/* ------------------------------------------------------------------------------------------------ the Encelade */

/** the gallery: a bay's length, the trellis walls' height, the vault's rise over them, the lattice's spacing and slat, the cabinets */
const TREILLAGE = {
  bay: 3.2, wall: 3, rise: 2, lattice: 0.9, slat: 0.035, post: 0.11, green: '#3f6b4c', leaves: '#3d5a2e',
  /** the share of each vault bay the climbers cover */
  cover: 0.7,
  cabinet: { half: 2.5, wall: 4, dome: 2.2, green: '#2c4f36' },
  /** the axes open (no lattice) for a doorway this wide, metres */
  door: 3.4,
}

const centroid = (r: P2[]): P2 => ({ x: r.reduce((s, p) => s + p.x, 0) / r.length, z: r.reduce((s, p) => s + p.z, 0) / r.length })
/** how far from c along angle a the ring's edge is (the nearest crossing) */
function rayHit(r: P2[], c: P2, a: number): number {
  const dx = Math.cos(a), dz = Math.sin(a)
  let best = Infinity
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length], ex = q.x - p.x, ez = q.z - p.z
    const den = dx * ez - dz * ex
    if (Math.abs(den) < 1e-9) continue
    const t = ((p.x - c.x) * ez - (p.z - c.z) * ex) / den, u = ((p.x - c.x) * dz - (p.z - c.z) * dx) / den
    if (t > 0 && u >= 0 && u <= 1 && t < best) best = t
  }
  return best
}

export function versaillesEnceladeTreillage(out: MeshBuilder, fit: Fit): void {
  const T = TREILLAGE, y = fit.grade ?? 0, GREEN = hex(T.green), LEAVES = hex(T.leaves)
  const outer = fit.ring && fit.ring.length > 2 ? fit.ring : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const c = centroid(outer)
  const inner = fit.holes?.[0] ?? outer.map((p) => ({ x: c.x + (p.x - c.x) * 0.83, z: c.z + (p.z - c.z) * 0.83 }))
  const rMean = outer.reduce((s, p) => s + Math.hypot(p.x - c.x, p.z - c.z), 0) / outer.length
  const n = Math.max(16, Math.round((2 * Math.PI * rMean * 0.92) / T.bay))
  const ring = Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2
    const ro = rayHit(outer, c, a), ri = rayHit(inner, c, a)
    return { a, ro: Number.isFinite(ro) ? ro - 0.15 : rMean, ri: Number.isFinite(ri) ? ri + 0.15 : rMean * 0.83 }
  })
  const at = (k: number, r: number): P2 => { const s = ring[((k % n) + n) % n]; return { x: c.x + Math.cos(s.a) * r, z: c.z + Math.sin(s.a) * r } }
  // which bays are doorways (the four axes) and which hold a cabinet (the diagonals)
  const nearest = (deg: number): number => Math.round((deg / 360) * n) % n
  const doors = new Set([0, 90, 180, 270].map(nearest))
  const cabinets = new Set([45, 135, 225, 315].map(nearest))
  /** a point across the gallery at bay k: s 0 the inner wall, 1 the outer */
  const across = (k: number, s: number): P2 => { const g = ring[((k % n) + n) % n]; return at(k, g.ri + (g.ro - g.ri) * s) }
  const SEG = 6
  const prof = (j: number): [number, number] => { const t = (j / SEG) * Math.PI; return [(1 - Math.cos(t)) / 2, Math.sin(t)] }
  for (let k = 0; k < n; k++) {
    // the rib: posts both sides, the arch over
    for (const s of [0, 1]) { const p = across(k, s); boxAlong(out, p.x, y + T.wall / 2, p.z, T.post, T.wall / 2, T.post, 0, GREEN) }
    for (let j = 0; j < SEG; j++) {
      const [s0, h0] = prof(j), [s1, h1] = prof(j + 1), p = across(k, s0), q = across(k, s1)
      const L = Math.hypot(q.x - p.x, q.z - p.z) || 0.01, yy = y + T.wall + (h0 + h1) / 2 * T.rise
      boxAlong(out, (p.x + q.x) / 2, yy, (p.z + q.z) / 2, L / 2 + 0.05, 0.08 + Math.abs(h1 - h0) * T.rise / 2, T.post * 0.8, headingOf((q.x - p.x) / L, (q.z - p.z) / L), GREEN)
    }
    // the vault to the next rib: the climbers over most of it
    const k1 = k + 1
    for (let j = 0; j < SEG; j++) {
      if (hash(k, j) > T.cover) continue
      const [s0, h0] = prof(j), [s1, h1] = prof(j + 1)
      const a0 = across(k, s0), b0 = across(k, s1), a1 = across(k1, s0), b1 = across(k1, s1)
      const y0 = y + T.wall + h0 * T.rise + 0.12, y1 = y + T.wall + h1 * T.rise + 0.12
      out.quad([[a0.x, y0, a0.z], [a1.x, y0, a1.z], [b1.x, y1, b1.z], [b0.x, y1, b0.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(LEAVES, 0.85 + hash(j, k) * 0.3), surfaceTag('foliage'))
    }
    if (cabinets.has(k)) continue
    // the trellis walls along the bay, inner and outer, a diamond lattice; a doorway on each axis
    for (const s of [0, 1]) {
      if (doors.has(k)) continue
      const p = across(k, s), q = across(k1, s), L = Math.hypot(q.x - p.x, q.z - p.z)
      const tx = (q.x - p.x) / L, tz = (q.z - p.z) / L, hd = headingOf(tx, tz)
      // the rails top and bottom
      boxAlong(out, (p.x + q.x) / 2, y + 0.3, (p.z + q.z) / 2, L / 2, 0.05, T.slat * 2, hd, GREEN)
      boxAlong(out, (p.x + q.x) / 2, y + T.wall - 0.05, (p.z + q.z) / 2, L / 2, 0.05, T.slat * 2, hd, GREEN)
      // diagonals both ways: a slat from (u, 0.3) at 45°, clipped to the panel
      const h = T.wall - 0.4
      for (const dir of [1, -1]) for (let u = -h; u < L; u += T.lattice) {
        const u0 = Math.max(0, u), u1 = Math.min(L, u + h)
        if (u1 - u0 < 0.2) continue
        const v0 = u0 - u, v1 = u1 - u
        const ua = dir > 0 ? u0 : L - u0, ub = dir > 0 ? u1 : L - u1
        const ax = p.x + tx * ua, az = p.z + tz * ua, bx = p.x + tx * ub, bz = p.z + tz * ub
        const ya = y + 0.3 + v0, yb = y + 0.3 + v1, len = Math.hypot(bx - ax, bz - az, yb - ya)
        // a slat is a thin box along its own diagonal: drawn as a flat quad either face (light enough for hundreds)
        const ox = -tz * T.slat, oz = tx * T.slat
        for (const sgn of [1, -1]) {
          out.quad([[ax + ox * sgn, ya - T.slat, az + oz * sgn], [bx + ox * sgn, yb - T.slat, bz + oz * sgn], [bx + ox * sgn, yb + T.slat, bz + oz * sgn], [ax + ox * sgn, ya + T.slat, az + oz * sgn]],
            [-tz * sgn, 0, tx * sgn], [[0, 0], [len, 0], [len, 1], [0, 1]], GREEN, 0)
        }
      }
    }
  }
  // the cabinets: a square pavilion of trellis across the gallery, a green dome over
  for (const k of cabinets) {
    const m0 = across(k, 0.5), m1 = across(k + 1, 0.5), m = { x: (m0.x + m1.x) / 2, z: (m0.z + m1.z) / 2 }, g = ring[k], C = T.cabinet, half = Math.max(C.half, (g.ro - g.ri) / 2 + 0.3)
    const a = ring[k].a + Math.PI / n, ux = Math.cos(a), uz = Math.sin(a)
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const px = m.x + (ux * sx - uz * sz) * half, pz = m.z + (uz * sx + ux * sz) * half
      boxAlong(out, px, y + C.wall / 2, pz, 0.18, C.wall / 2, 0.18, 0, GREEN)
    }
    boxAlong(out, m.x, y + C.wall + 0.15, m.z, half + 0.2, 0.15, half + 0.2, headingOf(ux, uz), GREEN)
    dome(out, m.x, m.z, y + C.wall + 0.3, half, C.dome, hex(C.green), 12)
  }
}

/* ------------------------------------------------------------------------------------------------- La Lanterne */

const LANTERNE = {
  render: '#ece5d6', slate: '#4b5359', eaves: 8.4, bay: 3.6, win: 1.35,
  storeys: [{ y: 0, h: 2.7, sill: 0.8 }, { y: 4.3, h: 2.3, sill: 0.6 }] as Storey[],
}

/**
 * OSM's U (way/74630403), metres east and north of the entry's point (48.80419 2.09229): the lodge is outside the modelled regions,
 * so the loader has no footprint for it and the entry stands alone (front 180 makes the frame east/north).
 */
const LANTERNE_U = pts([
  -27.3, -17.6, -19.8, -19.1, -12.7, 12.3, 17.7, 4.8, 10.5, -26.5, 18.1, -28.4, 25.6, 3.1, 21.5, 3.8,
  22.1, 7.1, 13.5, 8.9, 14.0, 12.8, -8.2, 17.7, -9.0, 14.2, -19.9, 16.8, -22.0, 7.5,
])

export function versaillesLanterne(out: MeshBuilder, fit: Fit): void {
  const L = LANTERNE
  const ring = fit.ring && fit.ring.length > 2 ? fit.ring : LANTERNE_U
  const p = palette(L.render, L.slate)
  extrude(out, [ring, ...(fit.holes ?? [])], p, { eaves: L.eaves, storeys: L.storeys, bay: L.bay, win: L.win, rise: 3.2, inset: 1.3, dormers: true })
}

export const VERSAILLES_GARDEN_STRUCTURES = {
  versaillesBainsApollon, versaillesEnceladeTreillage, versaillesLanterne,
}
