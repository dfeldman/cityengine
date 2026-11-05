/**
 * 5 boulevard Malesherbes, Paris 8e, OSM way/67256472 (Wikidata Q24815267; ~24 m, 360 m2, near the Madeleine). Haussmann-era
 * cream ashlar block: street run on the boulevard edges (front = their outward bearing from the pbf's Boulevard Malesherbes),
 * nine bays with a central arched porte-cochere, arched ground-floor windows, iron balconies (short on the 1st, longer on
 * the 2nd and 3rd, continuous under the top floor), cornice, slate mansard with round oculus dormers. From the Commons photo.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const MALESHERBES5 = {
  FLOORS: [1.5, 1.1, 1.0, 1.0, 0.95], // ground, then four upper floors: relative heights
  CORNICE: 0.5, MANSARD: 3.6, INSET: 2.0, STREET_NZ: -0.8,
  BAYS: 9, ARCH_W: 1.7, ARCH_SEG: 8, DOOR_W: 2.8, DOOR_H: 3.9, SHOP_BAND: 0.35, BAND_OUT: 0.06,
  WIN_W: 1.15, WIN_BOT: 0.1, WIN_TOP: 2.6, FRAME: 0.14, RAIL_H: 0.95, RAIL_OUT: 0.45, SLAB_OUT: 0.5,
  BALC: [[0.3, 0.7], [0.0, 0.62], [0.0, 0.7], [0, 1]], // balcony span as fractions of the front, floors 1..4
  OCULUS_R: 0.55, OCULUS_RING: 0.2, OCULUS_Y: 1.3,
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

export const malesherbes5 = (out: MeshBuilder, fit: Fit): void => {
  const K = MALESHERBES5, H = fit.height
  const warm = hex('#c79a52'), stone = hex('#d9cdb0'), stoneLt = hex('#e2d8bf'), stoneDk = hex('#b3a481'), party = hex('#b0a590'), glass = hex('#5a6a78'), shopGlass = hex('#2f3a44')
  const door = hex('#1d2c48'), iron = hex('#33505e'), slate = hex('#4f5560'), slateLt = hex('#5d6470'), roofFlat = hex('#6c7176')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw // outward normal of a->b is (dz,-dx)
  const n = ring.length
  const sumW = K.FLOORS.reduce((s, v) => s + v, 0)
  const fh = K.FLOORS.map((w) => w * (H - K.MANSARD - K.CORNICE) / sumW)
  const fy = fh.reduce<number[]>((acc, h) => (acc.push(acc[acc.length - 1] + h), acc), [0]) // floor levels, last = eave base
  const ridge = H, eave = H - K.MANSARD, fl0 = fh[0]
  const q = (pts: [number, number, number][], nrm: [number, number, number], c: Rgb): void => out.quad(pts, nrm, UV, c, 0)
  const tri = (a: [number, number, number], b: [number, number, number], c2: [number, number, number], nrm: [number, number, number], c: Rgb): void => out.quad([a, b, c2, a], nrm, UV, c, 0)
  const nrmOf = (a: P, b: P): P => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l] }
  const faces = (i: number): boolean => { const a = ring[i], b = ring[(i + 1) % n]; return Math.hypot(b[0] - a[0], b[1] - a[1]) > 2 && nrmOf(a, b)[1] < K.STREET_NZ }
  // only the longest run of -z-facing edges is the street front (courtyard returns face -z too)
  const elen = (i: number): number => Math.hypot(ring[(i + 1) % n][0] - ring[i][0], ring[(i + 1) % n][1] - ring[i][1])
  const street = new Set<number>()
  { let best = 0; for (let i = 0; i < n; i++) { if (!faces(i) || faces((i + n - 1) % n)) continue; const run = [i]; while (faces((run[run.length - 1] + 1) % n) && run.length < n) run.push((run[run.length - 1] + 1) % n); const t = run.reduce((m, e) => m + elen(e), 0); if (t > best) { best = t; street.clear(); run.forEach((e) => street.add(e)) } } }
  const isStreet = (i: number): boolean => street.has(i)

  // inset only where the mansard stands: vertices on street edges move in along their normals
  const inset: P[] = ring.map((p, i) => {
    const e0 = isStreet((i + n - 1) % n), e1 = isStreet(i)
    const n1 = nrmOf(ring[(i + n - 1) % n], p), n2 = nrmOf(p, ring[(i + 1) % n])
    if (!e0 && !e1) return [p[0], p[1]]
    if (e0 && !e1) return [p[0] - n1[0] * K.INSET, p[1] - n1[1] * K.INSET]
    if (!e0 && e1) return [p[0] - n2[0] * K.INSET, p[1] - n2[1] * K.INSET]
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml
    const k = Math.min(3, 1 / Math.max(0.35, mx * n1[0] + mz * n1[1]))
    return [p[0] - mx * K.INSET * k, p[1] - mz * K.INSET * k]
  })

  for (let i = 0; i < n; i++) {
    if (isStreet(i) && isStreet((i + n - 1) % n)) continue
    let j = i
    if (isStreet(i)) while (isStreet((j + 1) % n) && (j + 1) % n !== i) j++
    const a = ring[i], b = ring[(j + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 0.05) continue
    const [nx, nz] = nrmOf(a, b), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l
    const P3 = (s: number, v: number, y: number): [number, number, number] => [a[0] + ux * s + nx * v, y, a[1] + uz * s + nz * v]
    const wl = (s0: number, s1: number, y0: number, y1: number, c: Rgb, v = 0): void => { if (y1 - y0 > 0.005 && s1 > s0) q([P3(s0, v, y0), P3(s1, v, y0), P3(s1, v, y1), P3(s0, v, y1)], [nx, 0, nz], c) }
    const sl = (s0: number, s1: number, y: number, v0: number, v1: number, c: Rgb): void => q([P3(s0, v0, y), P3(s1, v0, y), P3(s1, v1, y), P3(s0, v1, y)], [0, 1, 0], c)
    if (!isStreet(i)) { wl(0, l, 0, ridge, party); continue }
    wl(0, l, 0, eave, stone)
    wl(0, l, eave - K.CORNICE, eave, stoneLt, 0.26); sl(0, l, eave, 0, 0.26, stoneLt)
    const A2 = inset[i], B2 = inset[(j + 1) % n], rise = ridge - eave, k1 = 0.78, k2 = 0.52
    const mA: P = [a[0] + (A2[0] - a[0]) * k2, a[1] + (A2[1] - a[1]) * k2], mB: P = [b[0] + (B2[0] - b[0]) * k2, b[1] + (B2[1] - b[1]) * k2], ym = eave + rise * k1
    q([[a[0], eave, a[1]], [b[0], eave, b[1]], [mB[0], ym, mB[1]], [mA[0], ym, mA[1]]], [nx, 0.4, nz], slate)
    q([[mA[0], ym, mA[1]], [mB[0], ym, mB[1]], [B2[0], ridge, B2[1]], [A2[0], ridge, A2[1]]], [0, 1, 0], slateLt)
    tri([a[0], eave, a[1]], [a[0], ridge, a[1]], [A2[0], ridge, A2[1]], [-ux, 0, -uz], slate)
    tri([b[0], eave, b[1]], [B2[0], ridge, B2[1]], [b[0], ridge, b[1]], [ux, 0, uz], slate)
    const bw = l / K.BAYS, mid = Math.floor(K.BAYS / 2), cen = (k: number): number => (k + 0.5) * bw
    // ground storey: rusticated base, arched openings (shopfronts), central porte-cochere
    wl(0, l, 0, fl0, stoneDk, K.BAND_OUT)
    wl(0, l, fl0 - 0.15, fl0 + 0.2, stoneLt, 0.1) // string course
    const arch = (c: number, hw: number, y0: number, yr: number, v: number, c1: Rgb, nrm: [number, number, number]): void => {
      wl(c - hw, c + hw, y0, yr, c1, v)
      for (let k = 0; k < K.ARCH_SEG; k++) { const t0 = Math.PI * k / K.ARCH_SEG, t1 = Math.PI * (k + 1) / K.ARCH_SEG
        q([P3(c + Math.cos(t0) * hw, v, yr + Math.sin(t0) * hw * 0.9), P3(c + Math.cos(t1) * hw, v, yr + Math.sin(t1) * hw * 0.9), P3(c, v, yr), P3(c, v, yr)], nrm, c1) }
    }
    for (let k = 0; k < K.BAYS; k++) {
      const c = cen(k)
      if (k === mid) {
        const hw = K.DOOR_W / 2, spr = K.DOOR_H - hw * 0.9
        arch(c, hw + 0.3, 0, spr, 0.1, stoneLt, [nx, 0, nz]); arch(c, hw, 0, spr, 0.14, door, [nx, 0, nz]); wl(c - 0.03, c + 0.03, 0, spr + hw * 0.9, hex('#0e1626'), 0.16)
        wl(c - 0.25, c + 0.25, spr + hw * 0.9 + 0.1, spr + hw * 0.9 + 0.7, stoneLt, 0.2) // keystone
        continue
      }
      const hw = K.ARCH_W / 2, yr = fl0 - 1.5, y0 = 0.35
      arch(c, hw + 0.15, y0 - 0.1, yr, 0.1, stoneLt, [nx, 0, nz]); arch(c, hw, y0, yr, 0.14, shopGlass, [nx, 0, nz])
      wl(c - hw, c + hw, y0 + 0.9, y0 + 0.9 + K.SHOP_BAND, hex('#1c1c20'), 0.17) // shop sign band
      wl(c - hw, c + hw, y0, y0 + 0.9, warm, 0.16) // lit display
    }
    // upper floors
    for (let f = 1; f < K.FLOORS.length; f++) {
      const y = fy[f]
      wl(0, l, y - 0.1, y + 0.1, stoneLt, 0.07)
      const [b0, b1] = K.BALC[f - 1], by = y + K.WIN_BOT
      if (b1 > b0) { sl(b0 * l, b1 * l, by, 0, K.SLAB_OUT, stoneDk); wl(b0 * l, b1 * l, by - 0.2, by, stoneLt, K.SLAB_OUT)
        wl(b0 * l, b1 * l, by, by + K.RAIL_H, iron, K.RAIL_OUT + 0.05); wl(b0 * l, b1 * l, by + K.RAIL_H - 0.07, by + K.RAIL_H, hex('#1d2f38'), K.RAIL_OUT + 0.08) }
      for (let k = 0; k < K.BAYS; k++) {
        const c = cen(k), top = y + K.WIN_TOP, bot = y + K.WIN_BOT, hw = K.WIN_W / 2
        wl(c - hw - K.FRAME, c + hw + K.FRAME, bot, top + 0.3, stoneLt, 0.04); wl(c - hw, c + hw, bot + 0.05, top, glass, 0.08)
        wl(c - 0.03, c + 0.03, bot + 0.05, top, hex('#c9c2ae'), 0.1)
        wl(c - hw - 0.2, c + hw + 0.2, top + 0.3, top + 0.45, stoneLt, 0.1) // lintel cornice
        const sf = c / l; if (!(sf >= b0 - 1e-6 && sf <= b1 + 1e-6)) wl(c - hw - 0.1, c + hw + 0.1, bot, bot + K.RAIL_H * 0.7, iron, 0.22)
      }
    }
    // round oculus dormers on the mansard's steep slope
    for (let k = 0; k < K.BAYS; k++) {
      const c = cen(k), dv = -K.INSET * k2 * 0.5, cy = eave + K.OCULUS_Y + K.OCULUS_R, N = 8
      for (let m = 0; m < N; m++) { const t0 = Math.PI * 2 * m / N, t1 = Math.PI * 2 * (m + 1) / N, r = K.OCULUS_R, ro = r + K.OCULUS_RING
        q([P3(c + Math.cos(t0) * r, dv + 0.06, cy + Math.sin(t0) * r), P3(c + Math.cos(t0) * ro, dv + 0.04, cy + Math.sin(t0) * ro), P3(c + Math.cos(t1) * ro, dv + 0.04, cy + Math.sin(t1) * ro), P3(c + Math.cos(t1) * r, dv + 0.06, cy + Math.sin(t1) * r)], [nx, 0, nz], stoneLt)
        tri(P3(c, dv + 0.08, cy), P3(c + Math.cos(t0) * r, dv + 0.08, cy + Math.sin(t0) * r), P3(c + Math.cos(t1) * r, dv + 0.08, cy + Math.sin(t1) * r), [nx, 0, nz], glass) }
    }
  }

  // flat roof: ear-clipped inset ring
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
}
