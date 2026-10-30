/**
 * The STADE JEAN-BOUIN (Rudy Ricciotti, 2013), the Stade Français's rugby ground across the Rue du Commandant-Guilbaud
 * from the Parc des Princes. OSM: relation/6048947 (building=stadium, the outer ring way/403524549 and the pitch's void
 * way/403524546), the pitch way/403524547 (rugby union, 120 × 68 with its in-goals, its axis at bearing 97°).
 *
 * What it is to look at: one continuous SKIN of pale ultra-high-performance concrete lattice — some 3 600 panels, each
 * pierced by irregular openings — wrapping the facades and running on over the roof to the edge above the pitch, so
 * that the whole stadium reads as a single white net thrown over the stands. Inside, a single steep tier on all four
 * sides of the rugby pitch.
 *
 * Measured from OSM (vtools superfit): the outer ring a superellipse 191 × 166 (n 2.8); the void a rounded rectangle
 * 132 × 86. No height in OSM: about 24 m to the roof's crest (it stands lower than its neighbour).
 *
 * Local frame: x along the pitch (the manifest's `front` lays it so), z across.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { band, disc, groundMid, LINE, quadN, supAt, supR, type Sup, type V3 } from './bowl.ts'

const SKIN: Rgb = [0.86, 0.85, 0.81]
const HOLE: Rgb = [0.24, 0.25, 0.26]
const SEAT: Rgb = [0.2, 0.24, 0.32]
const SEAT2: Rgb = [0.24, 0.28, 0.36]
const CONC: Rgb = [0.66, 0.66, 0.64]
const GLASS: Rgb = [0.15, 0.18, 0.2]

/** a cheap repeatable hash, 0–1, for the openings' irregular sizes */
const hash = (i: number, j: number): number => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function jeanBouin(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const A = Math.min(Math.max(fit.hx, 50), 100)
  const B = Math.min(Math.max(fit.hz, 40), 90)
  const kx = A / 95.7
  const kz = B / 82.8
  const S = (a: number, b: number, n: number): Sup => ({ a: a * kx, b: b * kz, n })
  const g = groundMid(fit)
  const y = g + 0.5

  // ---- the pitch: grass to the stands, the rugby lines and the posts
  const voidS = S(65.5, 42.5, 7)
  disc(out, voidS, y - 0.02, [0.24, 0.45, 0.2], 64)
  const L = 50 * Math.min(1, kx)
  const W = 35 * Math.min(1, kz)
  for (let i = 0; i < 10; i++) {
    const x0 = -L + (2 * L * i) / 10
    const x1 = -L + (2 * L * (i + 1)) / 10
    quadN(out, [[x0, y + 0.03, -W], [x1, y + 0.03, -W], [x1, y + 0.03, W], [x0, y + 0.03, W]], [0, 1, 0], i % 2 ? [0.26, 0.49, 0.22] : [0.3, 0.53, 0.25])
  }
  let lift = 0
  const line = (x0: number, z0: number, x1: number, z1: number): void =>
    box(out, (x0 + x1) / 2, y + 0.06 + (lift += 0.004), (z0 + z1) / 2, Math.max(0.07, Math.abs(x1 - x0) / 2), 0.01, Math.max(0.07, Math.abs(z1 - z0) / 2), LINE, 0)
  const G = L + 8 * Math.min(1, kx)
  line(-G, -W, G, -W); line(-G, W, G, W); line(-G, -W, -G, W); line(G, -W, G, W)
  for (const x of [-L, -L + 22, 0, L - 22, L]) line(x, -W, x, W)
  for (const s of [-1, 1]) {
    // the H: two tall posts and the crossbar at 3 m
    for (const zp of [-2.8, 2.8]) box(out, s * L, y + 6, zp, 0.1, 6, 0.1, LINE, 0)
    box(out, s * L, y + 3, 0, 0.08, 0.08, 2.8, LINE, 0)
  }

  // ---- the single steep tier on all four sides, and the walkway at its back
  const t0 = S(66, 43, 7)
  const t1 = S(88, 74, 3.4)
  const rows = 7
  for (let r = 0; r < rows; r++) {
    const f0 = r / rows
    const f1 = (r + 1) / rows
    const lerp = (f: number): Sup => ({ a: t0.a + (t1.a - t0.a) * f, b: t0.b + (t1.b - t0.b) * f, n: t0.n + (t1.n - t0.n) * f })
    band(out, lerp(f0), g + 2 + 16 * f0, lerp(f1), g + 2 + 16 * f1, 'in', () => (r % 2 ? SEAT : SEAT2), { segs: 96 })
  }
  band(out, S(65.8, 42.8, 7), y - 0.4, S(65.8, 42.8, 7), g + 2, 'in', () => CONC, { segs: 96, tag: conc })

  // ---- the skin: the facade rising from a glazed foot, rolling over at the eaves into the roof that runs in to its
  // edge over the front rows; every band of it pierced with irregular openings
  const outer = S(95.7, 82.8, 2.8)
  const crest = S(93, 79.5, 3)
  const edge = S(70, 47, 5)
  const yE = g + 19
  const yC = g + 24
  const yI = g + 21.5
  band(out, S(94.6, 81.6, 2.8), g - 0.5, S(94.6, 81.6, 2.8), g + 4, 'out', () => GLASS, { segs: 120 })
  // the skin as (ring, height) stations from the foot to the roof's inner edge
  const st: [Sup, number][] = [[outer, g + 4], [outer, g + 11], [outer, yE], [S(95, 82, 2.9), yE + 2.8], [crest, yC], [S(84, 66, 3.6), yC - 0.5], [S(77, 57, 4.2), yI + 0.7], [edge, yI]]
  const segs = 120
  for (let k = 0; k + 1 < st.length; k++) {
    const [s0, y0] = st[k]
    const [s1, y1] = st[k + 1]
    const face: 'out' | 'in' = k < 3 ? 'out' : 'in'
    band(out, s0, y0, s1, y1, face, () => SKIN, { segs, tag: conc })
    // the underside of the roof, seen from the stands
    if (k >= 4) band(out, s0, y0 - 0.6, s1, y1 - 0.6, 'down', () => CONC, { segs: 80, tag: conc })
    // the openings: a dark lozenge in each panel, sized irregularly, a hand's breadth proud of the skin
    for (let i = 0; i < segs; i++) {
      const h = hash(i, k)
      if (h < 0.18) continue
      const ta = ((i + 0.5 - 0.3 - 0.15 * h) / segs) * Math.PI * 2
      const tb = ((i + 0.5 + 0.3 + 0.15 * h) / segs) * Math.PI * 2
      const tm = ((i + 0.5) / segs) * Math.PI * 2
      const fy = 0.22 + 0.25 * h
      const at = (th: number, f: number): V3 => {
        const r0 = supR(s0, th)
        const r1 = supR(s1, th)
        const r = r0 + (r1 - r0) * f
        const off = face === 'out' ? 0.08 : 0.06
        return [Math.cos(th) * (r + (face === 'out' ? off : 0)), y0 + (y1 - y0) * f + (face === 'in' ? off : 0), Math.sin(th) * (r + (face === 'out' ? off : 0))]
      }
      const p: V3[] = [at(tm, 0.5 - fy), at(tb, 0.5), at(tm, 0.5 + fy), at(ta, 0.5)]
      const rx = Math.cos(tm)
      const rz = Math.sin(tm)
      quadN(out, p, face === 'out' ? [rx, 0, rz] : [-rx * 0.3, 1, -rz * 0.3], HOLE)
    }
  }
  // the roof's inner lip, a thin fascia with the lights under it
  band(out, edge, yI - 1.4, edge, yI, 'in', () => SKIN, { segs: 96, tag: conc })
  for (let i = 0; i < 72; i++) {
    const p = supAt(S(70.6, 47.6, 5), (i / 72) * Math.PI * 2, yI - 1.55)
    box(out, p[0], p[1], p[2], 0.4, 0.1, 0.4, [1, 0.97, 0.86], 0.5)
  }
}
