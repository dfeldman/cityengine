/**
 * The PARTERRE DE L'ORANGERIE at Versailles (Le Nôtre, Mansart, 1680s): the sunken garden south of the Orangerie, six lawn
 * compartments of broderie and gazon coupé round a great round basin (its jet is versailles-fountains.py's). OSM maps every lawn
 * and scroll of it (the parterre multipolygon's holes, orangerie-data.ts), so the ground is the bake's; this builder adds what
 * stands on it:
 *   - the box edging of the broderie: a low dark-green strip along every lawn and scroll outline;
 *   - the caisses de Versailles: in summer hundreds of orange, lemon and palm trees in green square wooden tubs with a finial at
 *     each corner, set in double rows along the Orangerie's front, a row round the basin and one inside the parterre's walls.
 * Tunables are the constants below.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { prism } from '../../../models.ts'
import { boxAlong } from '../../parts.ts'
import { registerRing } from '../museums/enframe.ts'
import { CENT_FLIGHTS, PARTERRE_BASIN, PARTERRE_BEDS, PARTERRE_RING, type EN } from './orangerie-data.ts'

const FOLIAGE = surfaceTag('foliage')
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }
const headingOf = (tx: number, tz: number): number => Math.atan2(-tz, tx)

/** the box edging of the broderie: strip width and height, the shortest edge drawn, the smallest bed edged (m²) */
export const BRODERIE = { w: 0.32, h: 0.3, minEdge: 0.3, minArea: 6, colour: '#33502b' }
/**
 * the tubs: the caisse's side and height, its corner finials' height, the trunk's height above the tub and its radius, the crown's
 * radius and height, the spacing along a row, the rows' insets from the parterre's wall (the first two along the Orangerie's front,
 * the third everywhere), the basin's row (metres off its rim), the margin kept off the beds and the flights, and the cap on the count
 */
export const TUBS = {
  side: 1.3, h: 1.2, finial: 0.3, trunk: 1.0, trunkR: 0.1, crownR: 0.85, crownH: 1.5, spacing: 5.2,
  front: [2.4, 5.6], wall: 2.6, basin: 4.2, bedGap: 1.0, stairGap: 6, max: 420,
  wood: '#3f6b3a', finialCol: '#e8e0cc', trunkCol: '#5a4630', crown: ['#3f6f2e', '#4a7a30', '#366a38'],
}

type V3 = [number, number, number]

const areaOf = (r: EN[]): number => r.reduce((s, a, i) => { const b = r[(i + 1) % r.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2
const inside = (p: EN, r: EN[]): boolean => {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i][1] > p[1]) !== (r[j][1] > p[1]) && p[0] < ((r[j][0] - r[i][0]) * (p[1] - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c
  }
  return c
}
const distSeg = (p: EN, a: EN, b: EN): number => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}
const distRing = (p: EN, r: EN[]): number => r.reduce((m, a, i) => Math.min(m, distSeg(p, a, r[(i + 1) % r.length])), 1e9)

/** points every `step` metres along a polyline, offset `d` to its left (anticlockwise ring: inward), with the edge's bearing */
function along(line: EN[], step: number, d: number, closed: boolean): { p: EN; t: EN }[] {
  const res: { p: EN; t: EN }[] = []
  const n = line.length
  let carry = step / 2
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = line[i], b = line[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 1e-6) continue
    const t: EN = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
    let s = carry
    for (; s < l; s += step) res.push({ p: [a[0] + t[0] * s - t[1] * d, a[1] + t[1] * s + t[0] * d], t })
    carry = s - l
  }
  return res
}

/** a closed strip of dark box along a ring's edges: top and both sides */
function edging(out: MeshBuilder, ring: EN[], F: ReturnType<typeof registerRing>, fit: Fit): void {
  const col = hex(BRODERIE.colour), top = shade(col, 1.12), h = BRODERIE.h, hw = BRODERIE.w / 2
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let i = 0; i < ring.length; i++) {
    const a = F.xz(ring[i][0], ring[i][1]), b = F.xz(ring[(i + 1) % ring.length][0], ring[(i + 1) % ring.length][1])
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz)
    if (l < BRODERIE.minEdge) continue
    const nx = -dz / l * hw, nz = dx / l * hw
    const y0 = Math.max(0, fit.groundAt?.((a.x + b.x) / 2, (a.z + b.z) / 2) ?? 0) - 0.02, y1 = y0 + h
    const A: V3 = [a.x + nx, y0, a.z + nz], B: V3 = [b.x + nx, y0, b.z + nz], C: V3 = [b.x - nx, y0, b.z - nz], D: V3 = [a.x - nx, y0, a.z - nz]
    const up = (v: V3): V3 => [v[0], y1, v[2]]
    out.quad([up(D), up(C), up(B), up(A)].reverse() as V3[], [0, 1, 0], uv, top, FOLIAGE)
    out.quad([A, B, up(B), up(A)], [nx, 0, nz], uv, col, FOLIAGE)
    out.quad([C, D, up(D), up(C)], [-nx, 0, -nz], uv, col, FOLIAGE)
  }
}

/** one caisse de Versailles with its tree: the tub, its corner finials, a bare trunk and a round clipped crown */
function tub(out: MeshBuilder, x: number, y: number, z: number, heading: number, seed: number): void {
  const T = TUBS, s = T.side / 2
  const wood = hex(T.wood), fin = hex(T.finialCol)
  boxAlong(out, x, y + T.h / 2, z, s, T.h / 2, s, heading, wood)
  const c = Math.cos(heading), sn = Math.sin(heading)
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const px = x + (dx * s * 0.86) * c + (dz * s * 0.86) * sn, pz = z - (dx * s * 0.86) * sn + (dz * s * 0.86) * c
    prism(out, px, pz, y + T.h, y + T.h + T.finial, 0.09, 4, fin, 0, 0.02, false, Math.PI / 4)
  }
  const y0 = y + T.h, ty = y0 + T.trunk
  prism(out, x, z, y0, ty, T.trunkR, 5, hex(T.trunkCol), 0, T.trunkR * 0.8, false)
  const r = T.crownR * (0.85 + hash(seed, 3) * 0.3), ch = T.crownH * (0.85 + hash(seed, 5) * 0.3)
  const col = shade(hex(T.crown[Math.floor(hash(seed, 7) * T.crown.length)]), 0.9 + hash(seed, 9) * 0.2)
  const cy = ty - 0.1
  prism(out, x, z, cy, cy + ch * 0.4, r * 0.7, 6, col, FOLIAGE, r, false)
  prism(out, x, z, cy + ch * 0.4, cy + ch * 0.75, r, 6, col, FOLIAGE, r * 0.8, false)
  prism(out, x, z, cy + ch * 0.75, cy + ch, r * 0.8, 6, shade(col, 1.08), FOLIAGE, 0.05, true)
}

export function versaillesOrangerieParterre(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(PARTERRE_RING, fit)
  for (const b of PARTERRE_BEDS) if (Math.abs(areaOf(b)) >= BRODERIE.minArea) edging(out, b, F, fit)

  // the tubs: candidates along the rows, kept where they stand on gravel
  const ring = areaOf(PARTERRE_RING) > 0 ? PARTERRE_RING : [...PARTERRE_RING].reverse()
  const bc: EN = [PARTERRE_BASIN.reduce((s, p) => s + p[0], 0) / PARTERRE_BASIN.length, PARTERRE_BASIN.reduce((s, p) => s + p[1], 0) / PARTERRE_BASIN.length]
  const br = PARTERRE_BASIN.reduce((s, p) => s + Math.hypot(p[0] - bc[0], p[1] - bc[1]), 0) / PARTERRE_BASIN.length
  const cand: { p: EN; t: EN }[] = []
  const T = TUBS
  // the wall's row everywhere, and two more along the Orangerie's front (the walls whose inward normal looks south, in the north half)
  cand.push(...along(ring, T.spacing, T.wall, true))
  const front = ring.map((a, i) => ({ a, b: ring[(i + 1) % ring.length] })).filter(({ a, b }) => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    return (b[0] - a[0]) / l < -0.6 && (a[1] + b[1]) / 2 > 15 && l > 3
  })
  for (const { a, b } of front) for (const d of T.front) cand.push(...along([a, b], T.spacing, d, false))
  const n = Math.max(8, Math.round((2 * Math.PI * (br + T.basin)) / T.spacing))
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    cand.push({ p: [bc[0] + Math.cos(a) * (br + T.basin), bc[1] + Math.sin(a) * (br + T.basin)], t: [-Math.sin(a), Math.cos(a)] })
  }
  const beds = PARTERRE_BEDS.filter((b) => Math.abs(areaOf(b)) >= BRODERIE.minArea)
  const placed: EN[] = []
  let count = 0
  for (const { p, t } of cand) {
    if (count >= T.max) break
    if (!inside(p, ring) || inside(p, PARTERRE_BASIN) || distRing(p, PARTERRE_BASIN) < T.basin * 0.5) continue
    if (beds.some((b) => inside(p, b) || distRing(p, b) < T.bedGap)) continue
    const rr = CENT_FLIGHTS.some((f) => {
      const r = (f.up * Math.PI) / 180, u = (p[0] - f.c[0]) * Math.sin(r) + (p[1] - f.c[1]) * Math.cos(r), v = (p[0] - f.c[0]) * Math.cos(r) - (p[1] - f.c[1]) * Math.sin(r)
      return Math.abs(u) < 33 + T.stairGap && Math.abs(v) < 10.8 + T.stairGap
    })
    if (rr || placed.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < T.side * 1.4)) continue
    placed.push(p)
    const q = F.xz(p[0], p[1]), t2 = F.xz(p[0] + t[0], p[1] + t[1])
    tub(out, q.x, Math.max(0, fit.groundAt?.(q.x, q.z) ?? 0), q.z, headingOf(t2.x - q.x, t2.z - q.z), count++)
  }
}

export const VERSAILLES_ORANGERIE_PARTERRE = { versaillesOrangerieParterre }
