/**
 * Le Pigalle / Bouillon Pigalle, 22 boulevard de Clichy on Place Pigalle, Paris 9e, OSM relation/1528993 (listed MH PA00086738, ~21 m).
 * From the Commons photo of the corner: a tall dark navy ground band with a row of arched, gold-framed openings (terrace behind a
 * green planter band, wooden shopfront glazing below), cream stone above with a railing at every window, a cornice and a low zinc
 * attic. Adapted from hotelFauchon.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const PIGALLE = {
  GROUND: 6.2, FLOOR: 2.7, FLOORS: 5, CORNICE: 0.4, ATTIC: 0.9, INSET: 1.2, // storey heights, metres
  BAY: 3.6, MARGIN: 1.0, MIN_WALL: 3, WIN_W: 1.1, WIN_BOT: 0.1, WIN_TOP: 2.3, FRAME: 0.15, LINTEL: 0.25,
  RAIL_OUT: 0.3, RAIL_H: 0.9, PILASTER: 0.5, PILASTER_OUT: 0.12,
  SHOP_TOP: 2.9, ARCH_SPRING: 4.2, ARCH_W: 3.0, ARCH_SEG: 6, PLANTER_H: 0.55, PLANTER_OUT: 0.3, BAND_OUT: 0.08,
  CHIMNEYS: 3, CHIMNEY_W: 0.8, CHIMNEY_H: 1.8, SEED: 9,
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2
const hash = (a: number, b: number): number => { let h = (a * 374761393 + b * 668265263 + PIGALLE.SEED * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }

export const lePigalle = (out: MeshBuilder, fit: Fit): void => {
  const K = PIGALLE, H = fit.height
  const stone = hex('#e8dfc9'), stoneLt = hex('#f2ebd9'), stoneDk = hex('#bdb299'), glass = hex('#35404a'), navy = hex('#1b2230'), gold = hex('#c98f3c'), warm = hex('#4a3626'), shopGlass = hex('#6b4a2c'), iron = hex('#1d2124'), zinc = hex('#6b7176'), brick = hex('#a8624a'), green = hex('#4f7a3a'), shutter = hex('#d9d2bd'), roofFlat = hex('#7a7f82')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw // outward normal of a->b is (dz,-dx)
  const n = ring.length
  const eave = K.GROUND + K.FLOORS * K.FLOOR + K.CORNICE
  const ridge = Math.max(eave + K.ATTIC, H)
  const q = (pts: [number, number, number][], nrm: [number, number, number], c: Rgb): void => out.quad(pts, nrm, UV, c, 0)
  const tri = (a: [number, number, number], b: [number, number, number], c2: [number, number, number], nrm: [number, number, number], c: Rgb): void => out.quad([a, b, c2, a], nrm, UV, c, 0)
  const nrmOf = (a: P, b: P): P => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l] }
  const wall = (a: P, b: P, y0: number, y1: number, c: Rgb, off = 0): void => {
    if (y1 - y0 < 0.01) return
    const [nx, nz] = nrmOf(a, b)
    q([[a[0] + nx * off, y0, a[1] + nz * off], [b[0] + nx * off, y0, b[1] + nz * off], [b[0] + nx * off, y1, b[1] + nz * off], [a[0] + nx * off, y1, a[1] + nz * off]], [nx, 0, nz], c)
  }
  /** horizontal strip along a->b between offsets o0..o1, facing up */
  const strip = (a: P, b: P, y: number, o0: number, o1: number, c: Rgb): void => {
    const [nx, nz] = nrmOf(a, b)
    q([[a[0] + nx * o0, y, a[1] + nz * o0], [b[0] + nx * o0, y, b[1] + nz * o0], [b[0] + nx * o1, y, b[1] + nz * o1], [a[0] + nx * o1, y, a[1] + nz * o1]], [0, 1, 0], c)
  }
  const at = (a: P, u: [number, number], s: number, v: number): P => { const [nx, nz] = nrmOf(a, [a[0] + u[0], a[1] + u[1]]); return [a[0] + u[0] * s + nx * v, a[1] + u[1] * s + nz * v] }

  // inset ring (miter) for the mansard's top edge
  const inset: P[] = ring.map((p, i) => {
    const pa = ring[(i + n - 1) % n], pb = ring[(i + 1) % n], n1 = nrmOf(pa, p), n2 = nrmOf(p, pb)
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml
    const k = Math.min(3, 1 / Math.max(0.35, mx * n1[0] + mz * n1[1]))
    return [p[0] - mx * K.INSET * k, p[1] - mz * K.INSET * k]
  })

  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 0.3) continue
    const [nx, nz] = nrmOf(a, b), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l, u: [number, number] = [ux, uz]
    wall(a, b, 0, eave, stone)
    wall(a, b, 0, K.GROUND, navy, K.BAND_OUT)
    wall(a, b, K.GROUND - 0.2, K.GROUND, gold, K.BAND_OUT + 0.04) // gold cornice line over the dark band
    wall(a, b, eave - K.CORNICE, eave, stoneLt, 0.2) // cornice
    strip(a, b, eave, 0, 0.2, stoneLt)
    // low zinc attic slope
    const A2 = inset[i], B2 = inset[(i + 1) % n], rise = ridge - eave, sl: [number, number, number] = [nx * rise, K.INSET, nz * rise]
    const sn = Math.hypot(sl[0], sl[1], sl[2]) || 1
    q([[a[0], eave, a[1]], [b[0], eave, b[1]], [B2[0], ridge, B2[1]], [A2[0], ridge, A2[1]]], [sl[0] / sn, sl[1] / sn, sl[2] / sn], zinc)
    if (l < K.MIN_WALL) continue
    const nb = Math.max(1, Math.round((l - 2 * K.MARGIN) / K.BAY)), bw = (l - 2 * K.MARGIN) / nb
    const P3 = (s: number, v: number, y: number): [number, number, number] => { const p = at(a, u, s, v); return [p[0], y, p[1]] }
    // arched openings: gold surround, warm interior, planter and railing below
    for (let w = 0; w < nb; w++) {
      const c = K.MARGIN + (w + 0.5) * bw, hw = Math.min(K.ARCH_W, bw - 0.8) / 2, ys = K.ARCH_SPRING, o = K.BAND_OUT
      const arch = (hw2: number, v: number, col: Rgb): void => {
        q([P3(c - hw2, v, K.SHOP_TOP + K.PLANTER_H), P3(c + hw2, v, K.SHOP_TOP + K.PLANTER_H), P3(c + hw2, v, ys), P3(c - hw2, v, ys)], [nx, 0, nz], col)
        for (let k = 0; k < K.ARCH_SEG; k++) {
          const t0 = Math.PI * k / K.ARCH_SEG, t1 = Math.PI * (k + 1) / K.ARCH_SEG
          tri(P3(c, v, ys), P3(c + hw2 * Math.cos(t0), v, ys + hw2 * Math.sin(t0)), P3(c + hw2 * Math.cos(t1), v, ys + hw2 * Math.sin(t1)), [nx, 0, nz], col)
        }
      }
      arch(hw + 0.12, o + 0.01, gold); arch(hw, o + 0.03, warm)
      // wooden shopfront glazing with gold mullions below
      q([P3(c - hw, o + 0.02, 0.4), P3(c + hw, o + 0.02, 0.4), P3(c + hw, o + 0.02, K.SHOP_TOP), P3(c - hw, o + 0.02, K.SHOP_TOP)], [nx, 0, nz], shopGlass)
      for (const m of [-hw, 0, hw]) q([P3(c + m - 0.05, o + 0.04, 0.4), P3(c + m + 0.05, o + 0.04, 0.4), P3(c + m + 0.05, o + 0.04, K.SHOP_TOP), P3(c + m - 0.05, o + 0.04, K.SHOP_TOP)], [nx, 0, nz], gold)
      // green planter band and terrace railing
      wall(at(a, u, c - hw - 0.3, 0), at(a, u, c + hw + 0.3, 0), K.SHOP_TOP, K.SHOP_TOP + K.PLANTER_H, green, K.PLANTER_OUT)
      wall(at(a, u, c - hw, 0), at(a, u, c + hw, 0), K.SHOP_TOP + K.PLANTER_H, K.SHOP_TOP + K.PLANTER_H + 0.7, iron, 0.15)
    }
    // upper floors: a railing at every window
    for (let f = 0; f < K.FLOORS; f++) {
      const y = K.GROUND + f * K.FLOOR
      for (let w = 0; w < nb; w++) {
        const c = K.MARGIN + (w + 0.5) * bw, s0 = c - K.WIN_W / 2 - K.FRAME, s1 = c + K.WIN_W / 2 + K.FRAME
        wall(at(a, u, s0, 0), at(a, u, s1, 0), y + K.WIN_BOT, y + K.WIN_TOP + K.LINTEL, stoneLt, 0.04) // frame
        wall(at(a, u, c - K.WIN_W / 2, 0), at(a, u, c + K.WIN_W / 2, 0), y + K.WIN_BOT + 0.05, y + K.WIN_TOP, glass, 0.08)
        if ((w + f) % 2 === 0) wall(at(a, u, c - K.WIN_W / 2, 0), at(a, u, c - K.WIN_W / 2 + 0.3, 0), y + K.WIN_BOT + 0.05, y + K.WIN_TOP, shutter, 0.1)
        wall(at(a, u, c - K.WIN_W / 2 - 0.15, 0), at(a, u, c + K.WIN_W / 2 + 0.15, 0), y + K.WIN_BOT, y + K.WIN_BOT + K.RAIL_H, iron, K.RAIL_OUT)
      }
      for (let w = 0; w <= nb; w++) { // pilaster strips between windows
        const s = K.MARGIN + w * bw - K.PILASTER / 2
        wall(at(a, u, Math.max(0, s), 0), at(a, u, Math.min(l, s + K.PILASTER), 0), y, y + K.FLOOR, stoneLt, K.PILASTER_OUT)
      }
    }
  }

  // flat zinc roof: ear-clipped inset ring
  const idx = inset.map((_, i) => i), cross = (a: P, b: P, c: P): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  let guard = 0
  const T = (a: P, b: P, c: P): void => q([[c[0], ridge, c[1]], [b[0], ridge, b[1]], [a[0], ridge, a[1]], [c[0], ridge, c[1]]], [0, 1, 0], roofFlat)
  while (idx.length > 3 && guard++ < 400) {
    let cut = false
    for (let i = 0; i < idx.length && !cut; i++) {
      const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length], a = inset[ia], b = inset[ib], c = inset[ic]
      if (cross(a, b, c) <= 1e-9) continue
      if (idx.some((k) => k !== ia && k !== ib && k !== ic && cross(a, b, inset[k]) >= 0 && cross(b, c, inset[k]) >= 0 && cross(c, a, inset[k]) >= 0)) continue
      T(a, b, c); idx.splice(i, 1); cut = true
    }
    if (!cut) break
  }
  if (idx.length === 3) T(inset[idx[0]], inset[idx[1]], inset[idx[2]])

  // brick chimney stacks on the roof, hashed along the longest inset edges
  const edges = inset.map((p, i) => ({ p, q: inset[(i + 1) % n], l: Math.hypot(inset[(i + 1) % n][0] - p[0], inset[(i + 1) % n][1] - p[1]) })).sort((x, y) => y.l - x.l)
  for (let k = 0; k < K.CHIMNEYS; k++) {
    const e = edges[k % Math.min(4, edges.length)]
    if (e.l < 4) continue
    const t = 0.15 + 0.7 * hash(k, 3), cx = e.p[0] + (e.q[0] - e.p[0]) * t, cz = e.p[1] + (e.q[1] - e.p[1]) * t
    const nn = nrmOf(e.p, e.q), px = cx - nn[0] * 0.6, pz = cz - nn[1] * 0.6, w = K.CHIMNEY_W / 2, y1 = ridge + K.CHIMNEY_H
    const fx: [number, number][] = [[-w, -w], [w, -w], [w, w], [-w, w]]
    for (let j = 0; j < 4; j++) {
      const [x0, z0] = fx[j], [x1, z1] = fx[(j + 1) % 4], mx = (x0 + x1) / 2, mz = (z0 + z1) / 2
      q([[px + x0, ridge, pz + z0], [px + x1, ridge, pz + z1], [px + x1, y1, pz + z1], [px + x0, y1, pz + z0]], [mx / w, 0, mz / w], brick)
    }
    q([[px - w, y1, pz - w], [px + w, y1, pz - w], [px + w, y1, pz + w], [px - w, y1, pz + w]], [0, 1, 0], stoneDk)
  }
}
