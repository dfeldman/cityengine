/**
 * Unnamed listed block on Place de l'Opéra / Boulevard des Capucines, Paris 9e, OSM way/54730690 (J. B. Lesueur, 1835,
 * MH inscribed 2006, PA00086051; 6 levels + roof). Haussmann-register stone block: the OSM outline (with its courtyard notch)
 * extruded; a tall ground storey of dark shopfronts between pilasters, an entresol band, five bays a floor with stone-framed
 * French windows, continuous iron balconies on the 2nd and 5th floors, a cornice, and a steep zinc mansard with dormers and
 * brick chimney stacks. Heights from IGN LiDAR MNS (tools/ign-mns.ts, 2026-11-04): roof ridge 24-26 m over the ground, the
 * OSM 21 m being the eave; plan from OSM, the 2024 IGN aerial (tools/ortho.ts: zinc mansard, light-well notch mid-plan).
 * No photograph was found; the fenestration rhythm is the generic Haussmann one of the neighbouring boulevard frontages.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const LESUEUR = {
  GROUND: 4.6, ENTRESOL: 0.9, FLOOR: 3.3, FLOORS: 4, CORNICE: 0.7, // storey heights, metres
  BAY: 3.1, MARGIN: 1.0, MIN_WALL: 3, WIN_W: 1.25, WIN_BOT: 0.1, WIN_TOP: 2.75, FRAME: 0.18, LINTEL: 0.35,
  BALCONY_OUT: 0.55, BALCONY_H: 0.95, BALCONY_FLOORS: [1, 4], PILASTER: 0.7, PILASTER_OUT: 0.18,
  INSET: 2.3, DORMER_EVERY: 2, DORMER_W: 1.2, DORMER_H: 1.5, DORMER_OUT: 0.8, DORMER_ROOF: 0.7,
  CHIMNEYS: 7, CHIMNEY_W: 0.9, CHIMNEY_H: 2.2, SEED: 5,
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2
const hash = (a: number, b: number): number => { let h = (a * 374761393 + b * 668265263 + LESUEUR.SEED * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }

export const lesueurOperaBlock = (out: MeshBuilder, fit: Fit): void => {
  const K = LESUEUR, H = fit.height
  const stone = hex('#d9cfb6'), stoneLt = hex('#e8e0cc'), stoneDk = hex('#bdb299'), glass = hex('#2f3a44'), shop = hex('#23292e'), iron = hex('#1d2124'), zinc = hex('#6b7176'), zincLt = hex('#7d848a'), brick = hex('#a8624a'), roofFlat = hex('#7a7f82')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw // outward normal of a->b is (dz,-dx)
  const n = ring.length
  const eave = K.GROUND + K.ENTRESOL + K.FLOORS * K.FLOOR + K.CORNICE
  const ridge = Math.max(eave + 2, H)
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
    wall(a, b, K.GROUND + K.ENTRESOL - 0.25, K.GROUND + K.ENTRESOL, stoneLt, 0.1) // string course over the entresol
    wall(a, b, eave - K.CORNICE, eave, stoneLt, 0.25) // cornice
    strip(a, b, eave, 0, 0.25, stoneLt)
    // mansard slope, a -> b to the inset ring
    const A2 = inset[i], B2 = inset[(i + 1) % n], rise = ridge - eave, sl: [number, number, number] = [nx * rise, K.INSET, nz * rise]
    const sn = Math.hypot(sl[0], sl[1], sl[2]) || 1
    q([[a[0], eave, a[1]], [b[0], eave, b[1]], [B2[0], ridge, B2[1]], [A2[0], ridge, A2[1]]], [sl[0] / sn, sl[1] / sn, sl[2] / sn], zinc)
    if (l < K.MIN_WALL) continue
    // ground storey: dark shopfronts between pilasters
    const nb = Math.max(1, Math.floor((l - 2 * K.MARGIN) / K.BAY)), bw = (l - 2 * K.MARGIN) / nb
    wall(a, b, 0.3, K.GROUND - 0.7, shop, 0.05)
    wall(a, b, K.GROUND - 0.7, K.GROUND - 0.4, stoneDk, 0.12) // shop fascia
    for (let w = 0; w <= nb; w++) {
      const s = K.MARGIN + w * bw - K.PILASTER / 2, p0 = at(a, u, Math.max(0, s), 0), p1 = at(a, u, Math.min(l, s + K.PILASTER), 0)
      wall(p0, p1, 0, K.GROUND + K.ENTRESOL - 0.25, stoneLt, K.PILASTER_OUT)
    }
    // upper floors
    for (let f = 0; f < K.FLOORS; f++) {
      const y = K.GROUND + K.ENTRESOL + f * K.FLOOR
      const balc = K.BALCONY_FLOORS.includes(f)
      for (let w = 0; w < nb; w++) {
        const c = K.MARGIN + (w + 0.5) * bw, s0 = c - K.WIN_W / 2 - K.FRAME, s1 = c + K.WIN_W / 2 + K.FRAME
        wall(at(a, u, s0, 0), at(a, u, s1, 0), y + K.WIN_BOT, y + K.WIN_TOP + K.LINTEL, stoneLt, 0.04) // frame
        wall(at(a, u, c - K.WIN_W / 2, 0), at(a, u, c + K.WIN_W / 2, 0), y + K.WIN_BOT + 0.05, y + K.WIN_TOP, glass, 0.08)
        if (!balc && f > 0) wall(at(a, u, s0, 0), at(a, u, s1, 0), y + K.WIN_BOT, y + K.WIN_BOT + 0.5, iron, 0.12) // window-rail
      }
      if (balc) { strip(a, b, y, 0, K.BALCONY_OUT, stoneLt); wall(a, b, y, y + K.BALCONY_H, iron, K.BALCONY_OUT) }
    }
    // dormers on the mansard slope
    const nd = Math.floor(nb / K.DORMER_EVERY)
    for (let w = 0; w < nd; w++) {
      const c = K.MARGIN + (w * K.DORMER_EVERY + K.DORMER_EVERY / 2) * bw, yb = eave + 0.8, y1 = yb + K.DORMER_H, y2 = y1 + K.DORMER_ROOF
      const vs = (y: number): number => -K.INSET * (y - eave) / (ridge - eave) // slope surface offset at a height
      const vf = vs(yb) + K.DORMER_OUT, hw = K.DORMER_W / 2
      const P3 = (s: number, v: number, y: number): [number, number, number] => { const p = at(a, u, s, v); return [p[0], y, p[1]] }
      q([P3(c - hw, vf, yb), P3(c + hw, vf, yb), P3(c + hw, vf, y1), P3(c - hw, vf, y1)], [nx, 0, nz], glass)
      tri(P3(c - hw, vf, y1), P3(c + hw, vf, y1), P3(c, vf, y2), [nx, 0, nz], zincLt)
      q([P3(c - hw, vs(y1), yb), P3(c - hw, vf, yb), P3(c - hw, vf, y1), P3(c - hw, vs(y1), y1)], [-ux, 0, -uz], zincLt)
      q([P3(c + hw, vf, yb), P3(c + hw, vs(y1), yb), P3(c + hw, vs(y1), y1), P3(c + hw, vf, y1)], [ux, 0, uz], zincLt)
      const sx = K.DORMER_ROOF / (hw || 1)
      q([P3(c - hw, vf, y1), P3(c, vf, y2), P3(c, vs(y2), y2), P3(c - hw, vs(y1), y1)], [-ux * sx + nx * 0.3, 1, -uz * sx + nz * 0.3], zinc)
      q([P3(c, vf, y2), P3(c + hw, vf, y1), P3(c + hw, vs(y1), y1), P3(c, vs(y2), y2)], [ux * sx + nx * 0.3, 1, uz * sx + nz * 0.3], zinc)
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
