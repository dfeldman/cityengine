/**
 * Aquaboulevard, Paris 15e: the complex on the OSM ways it really stands on (2026-11-05 rework). Owner: "distinctive HUGE glass
 * PYRAMIDS and WATERSLIDES", seen from afar, so shapes, sizes and colours only.
 *  - way/44326514 (commercial, ~330 m long, NE to SW along the Rue du Colonel Pierre Avia): cut across its length into a low
 *    cinema/Palmeraie end, the dark flat-roofed pool hall (glass pyramids standing ON its roof deck) and the tall teal
 *    curved-glass NE block (Decathlon / Gaumont / Forest Hill, 9 storeys) with white sign bands on its street face;
 *  - way/44281431 (the Pathé / Palmeraie wing, SW) with its reddish roof strip, way/44048677 (a low dark annexe);
 *  - the outdoor park's slide towers, coiling tubes and the long blue slide on the NW face.
 * Plans are OSM's, in metres east/north of 48.831323, 2.275402; registered on the three ways' hulls. The fin-faced
 * office slab beside it is `aquaOffice` (way/44281432). Pyramid positions were read off the IGN ortho (0.55 m/px).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { ccwEN, registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'

const MAIN: P2[] = [[140,159.1],[140.3,157.3],[135,149.2],[132.1,151.1],[128.2,145.2],[125,147.3],[72.1,67],[82.8,60.1],[85.6,53.6],[103.1,42.1],[109.4,51.5],[142.8,29.7],[91.5,-48.9],[84,-44.1],[30.2,-127.6],[-10.7,-100.7],[-12.4,-103.3],[-25.6,-94.5],[-22.3,-89.7],[-18.7,-79.7],[-25.1,-75.5],[-28.7,-81],[-40.4,-73.4],[-32.2,-60.5],[-35.5,-58.4],[-16.1,-28.8],[-13.1,-30.7],[-5.1,-18.4],[-10,-13.2],[-4.4,-4.7],[-0.2,1.8],[3,6.9],[-4.3,11.6],[-7.3,13.5],[4.4,31.6],[12.1,43.4],[10.9,47.9],[15.6,48.7],[24.5,62.5],[34,77.1],[27.6,81.5],[25.3,83.1],[34.7,97],[50.4,120.3],[67.4,109.8],[71.3,115.5],[60,122.7],[63.6,128],[56.2,132.7],[93.1,189.3],[110,178.4],[130.9,164.9]]
const PATHE: P2[] = [[-20.7,-172],[-10.3,-180.1],[-5.9,-176.3],[0.7,-170.5],[8.3,-159.7],[22.2,-144],[14.6,-139],[18.8,-135.2],[4.4,-127.9],[-5.1,-126.1],[-12.4,-130.3],[-10.8,-127.8],[-16.7,-124.1],[-14.4,-120.6],[-11.8,-118.3],[-16.3,-115.4],[-19.9,-114.7],[-22.5,-112.6],[-25,-116.6],[-28.1,-114.5],[-47,-143.6],[-36.9,-151.6],[-25.6,-134.3],[-17.5,-137.6],[-5.5,-144.1],[-2.8,-146.6],[-5.4,-151.2],[-8.1,-153.1]]
const ANNEX: P2[] = [[-45.5,-103.6],[-42,-98.9],[-52,-92.5],[-54.5,-96.3],[-57.9,-94],[-70.5,-113.6],[-60.3,-121.5],[-55.6,-114.4],[-40.7,-124],[-33.6,-113.1],[-46.3,-105]]

export const AQUA = {
  AXIS: 22, // bearing (deg from north) of the block's length; zones are cut across it
  // [from s, to s (m along the axis), wall height, wall, roof]: low SW end, the pool hall, the tall teal NE block
  ZONES: [
    [-400, -45, 12, '#7d8183', '#6c6f71'], [-45, 118, 15, '#6d7174', '#55595b'], [118, 400, 32, '#3e9a96', '#8f9a9b'],
  ] as [number, number, number, string, string][],
  FLOOR: 3.5, SIGN_H: [22, 24.6] as [number, number], SIGN2_H: [13.6, 15.6] as [number, number], SIGN_C: '#f1f1ee', SIGN2_C: '#c8322d', SIGN_DARK: '#23262a', BAND_C: '#1f6f73', BAND_H: 1.4,
  PATHE_H: 11, PATHE_C: '#85898b', PATHE_ROOF: '#6f7274', RED_ROOF: '#a85a4a', RED_S: -150, ANNEX_H: 7, ANNEX_C: '#7a7d7f',
  // glass pyramids [east, north, base side m, height/base]; stand on the hall roof, turned to PYR_AXIS
  PYRAMIDS: [[54, 72, 110, 0.4], [24, 22, 92, 0.42], [-1, -28, 92, 0.42], [-20, -64, 64, 0.42]] as [number, number, number, number][],
  M_PX: 0.55, PYR_AXIS: 28.7, PYR_SCALE: 0.82, RIBS: 4, RIM: 1.4, SINK: 0.3,
  GLASS: '#6f93a8', FRAME: '#e9eef1', RIM_C: '#c9c6bd',
  // slide park on the NW face
  TOWERS: [[-27, 8, 3.2, 20], [-38, 30, 2.8, 15], [-24, -18, 2.6, 12]] as [number, number, number, number][], COIL_R: 5, COIL_TURNS: 2.5, COIL_TUBE: 0.9,
  LONG: [[6, 42, 17], [-22, 54, 13], [-52, 58, 8], [-82, 50, 3]] as [number, number, number][], LONG_W: 3.4,
  TUBES: [[[4, 20, 13], [-14, 4, 4], [-30, -2, 1.2]], [[8, 0, 11], [-12, -14, 4], [-24, -34, 1.2]], [[10, 56, 13], [-6, 74, 6], [-18, 88, 1.2]]] as [number, number, number][][],
  TEAL: '#1fa5a8', ORANGE: '#e8741a', BLUE: '#2e86d6', GREY: '#9aa2a8', TOWER_C: '#d9dbdc',
}

/** a ring clipped to the strip s0 <= e·ux + n·uy <= s1 (Sutherland–Hodgman against two half-planes) */
const clipStrip = (ring: P2[], u: P2, s0: number, s1: number): P2[] => {
  const cut = (pts: P2[], sign: number, lim: number): P2[] => {
    const d = (p: P2): number => sign * (p[0] * u[0] + p[1] * u[1] - lim), res: P2[] = []
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], da = d(a), db = d(b)
      if (da >= 0) res.push(a)
      if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); res.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) }
    }
    return res
  }
  return cut(cut(ring, 1, s0), -1, s1)
}

export const aquaboulevard = (out: MeshBuilder, fit: Fit): void => {
  const K = AQUA, F = registerRing([...MAIN, ...PATHE, ...ANNEX], fit), T = tools(out, F)
  const ar = (K.AXIS * Math.PI) / 180, u: P2 = [Math.sin(ar), Math.cos(ar)]
  const main = ccwEN(MAIN)
  const zoneH = (s: number): number => { for (const z of K.ZONES) if (s >= z[0] && s < z[1]) return z[2]; return K.ZONES[K.ZONES.length - 1][2] }
  // the main block, zone by zone
  for (const [s0, s1, h, wc, rc] of K.ZONES) {
    const r = clipStrip(main, u, s0, s1)
    if (r.length < 3) continue
    const tall = h > 20
    T.prism(r, 0, h, hex(wc), hex(rc), tall ? 3.5 : 10, tall ? 0.05 : 0.03)
    if (tall) {
      // dark glazing band at each floor and white / red sign bands on the street (south-east) face
      const rr = ccwEN(r), se: P2 = [u[1], -u[0]]
      for (let i = 0; i < rr.length; i++) {
        const a = rr[i], b = rr[(i + 1) % rr.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
        if (l < 5) continue
        const nx = (b[1] - a[1]) / l, ny = -(b[0] - a[0]) / l
        if (nx * se[0] + ny * se[1] < 0.8) continue
        const o = 0.15, A: P2 = [a[0] + nx * o, a[1] + ny * o], B: P2 = [b[0] + nx * o, b[1] + ny * o]
        for (let y = K.FLOOR + 1; y + K.BAND_H < h - 1; y += K.FLOOR) T.wall(A, B, y, y + K.BAND_H, hex(K.BAND_C))
        const o2 = 0.3, A2: P2 = [a[0] + nx * o2, a[1] + ny * o2], B2: P2 = [b[0] + nx * o2, b[1] + ny * o2]
        T.wall(A2, B2, K.SIGN_H[0], K.SIGN_H[1], hex(K.SIGN_C))
        T.wall(A2, B2, K.SIGN2_H[0], K.SIGN2_H[1], hex(K.SIGN2_C))
        T.wall(A2, B2, 0.5, 5, hex(K.SIGN_DARK))
      }
    }
  }
  // the Pathé / Palmeraie wing: grey, with a reddish roof over its south-west end
  const pr = ccwEN(PATHE), red = clipStrip(pr, u, -400, K.RED_S)
  T.prism(pr, 0, K.PATHE_H, hex(K.PATHE_C), hex(K.PATHE_ROOF), 10)
  if (red.length >= 3) T.cap(ccwEN(red), K.PATHE_H + 0.06, hex(K.RED_ROOF))
  T.prism(ANNEX, 0, K.ANNEX_H, hex(K.ANNEX_C), hex(K.PATHE_ROOF), 8)
  // glass pyramids standing on the roof deck of the zone they are in
  const glass = hex(K.GLASS), frameC = hex(K.FRAME), pa = (K.PYR_AXIS * Math.PI) / 180, ux = Math.sin(pa), uy = Math.cos(pa)
  for (const [e, n, b0, hf] of K.PYRAMIDS) {
    const c: P2 = [e, n], b = b0 * K.PYR_SCALE, s = (b * K.M_PX) / 2, h = b * K.M_PX * hf
    const base = zoneH(e * u[0] + n * u[1]) - K.SINK
    const cs: P2[] = [0, 1, 2, 3].map((i) => {
      const sx = i === 0 || i === 3 ? -1 : 1, sy = i < 2 ? -1 : 1
      return [c[0] + ux * sy * s + uy * sx * s, c[1] + uy * sy * s - ux * sx * s] as P2
    })
    T.prism(cs.map(([x, y]) => [c[0] + (x - c[0]) * 1.03, c[1] + (y - c[1]) * 1.03] as P2), base, base + K.RIM + K.SINK, hex(K.RIM_C), null)
    const apex: V3 = [c[0], c[1], base + K.RIM + h]
    for (let i = 0; i < 4; i++) {
      const a = cs[i], d = cs[(i + 1) % 4], z0 = base + K.RIM
      T.poly([[a[0], a[1], z0], [d[0], d[1], z0], apex], glass, [(a[0] + d[0]) / 2 - c[0], (a[1] + d[1]) / 2 - c[1], 0.6])
      T.beam([a[0], a[1], z0], apex, 0.25, frameC)
      for (let r = 1; r <= K.RIBS; r++) {
        const t = r / (K.RIBS + 1), q = (p: P2): V3 => [p[0] + (c[0] - p[0]) * t, p[1] + (c[1] - p[1]) * t, z0 + h * t]
        T.beam(q(a), q(d), 0.12, frameC)
      }
    }
  }
  // slide towers with coiling tubes
  const cols = [K.TEAL, K.ORANGE, K.BLUE]
  K.TOWERS.forEach(([e, n, r, h], k) => {
    const oct = Array.from({ length: 8 }, (_, i) => [e + Math.cos((i * Math.PI) / 4) * r, n + Math.sin((i * Math.PI) / 4) * r] as P2)
    T.prism(oct, 0, h, hex(K.TOWER_C), hex(K.GREY))
    for (const [phase, col] of [[0, cols[k % 3]], [Math.PI, cols[(k + 1) % 3]]] as [number, string][]) {
      const steps = Math.round(K.COIL_TURNS * 14)
      let prev: V3 | null = null
      for (let i = 0; i <= steps; i++) {
        const t = i / steps, a = phase + t * K.COIL_TURNS * Math.PI * 2, z = h - 1 - t * (h - 2.5)
        const p: V3 = [e + Math.cos(a) * (r + K.COIL_R - 2), n + Math.sin(a) * (r + K.COIL_R - 2), z]
        if (prev) T.beam(prev, p, K.COIL_TUBE / 2, hex(col))
        prev = p
      }
    }
  })
  // the long blue slide and the grey tubes off the building, on posts
  const chain = (pts: V3[], w: number, col: string): void => {
    for (let i = 0; i + 1 < pts.length; i++) T.beam(pts[i], pts[i + 1], w / 2, hex(col))
    for (const p of pts.slice(1, -1)) T.beam([p[0], p[1], 0], [p[0], p[1], p[2]], 0.3, frameC)
  }
  chain(K.LONG, K.LONG_W, K.BLUE)
  K.TUBES.forEach((t, i) => chain(t, 1.6, i % 2 ? K.GREY : K.TEAL))
}
