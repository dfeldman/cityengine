/**
 * 7 place Franz-Liszt / 1 rue d'Abbeville, Paris 10e, OSM way/63201609 (listed MH PA75100006, Achille Leclère, facing Saint-Vincent-de-Paul, ~24 m).
 * From the Commons photo: cream ashlar Haussmann-style corner block, shopfronts under a red awning, a continuous iron balcony at the second and
 * fifth floors with single rails between, string courses, pedimented windows over the ground floor, a stacked three-floor glazed bay on the
 * corner, and a dark slate mansard with pedimented dormers and a rail on the roof. Structure adapted from hennebique.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const LISZT7 = {
  GROUND: 4.6, FLOORS: 5, CORNICE: 0.5, MANSARD: 4.2, INSET: 2.4, EAVE_FRAC: 0.83, // storey heights, metres
  BAY: 3.1, MARGIN: 0.9, MIN_WALL: 3, WIN_W: 1.05, WIN_BOT: 0.1, WIN_TOP: 2.4, FRAME: 0.14, LINTEL: 0.3,
  RAIL_OUT: 0.28, RAIL_H: 0.95, PILASTER: 0.3, PILASTER_OUT: 0.06, BAND_OUT: 0.08, AWNING_H: 0.8, AWNING_OUT: 0.9,
  BALCONY_FLOORS: [1, 4], // floors (0 = first above the shops) with a continuous balcony
  DORMER_W: 0.9, DORMER_H: 1.5, DORMER_EVERY: 1,
  TIP_RADIUS: 3.5, NOTCH_CLEAR: 11, // the bay keeps this far from the courtyard notch
  ORIEL_R: 2.0, ORIEL_SIDES: 5, ORIEL_ARC: 2.6, ORIEL_FROM: 1, ORIEL_TO: 4, // the bay rises over floors ORIEL_FROM..ORIEL_TO-1
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

export const liszt7 = (out: MeshBuilder, fit: Fit): void => {
  const K = LISZT7, H = fit.height
  const stone = hex('#e3d7bd'), stoneLt = hex('#efe6d0'), stoneDk = hex('#c4b79c'), glass = hex('#4b5d70'), shopGlass = hex('#2f3a44'), iron = hex('#1d2124'), slate = hex('#4f5560'), slateLt = hex('#5d6470'), awning = hex('#8c2a2a'), roofFlat = hex('#6c7176')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw // outward normal of a->b is (dz,-dx)
  const n = ring.length
  const FLOOR = (H * K.EAVE_FRAC - K.GROUND - K.CORNICE) / K.FLOORS
  const fl0 = K.GROUND
  const eave = fl0 + K.FLOORS * FLOOR + K.CORNICE
  const ridge = eave + K.MANSARD
  const q = (pts: [number, number, number][], nrm: [number, number, number], c: Rgb): void => out.quad(pts, nrm, UV, c, 0)
  const tri = (a: [number, number, number], b: [number, number, number], c2: [number, number, number], nrm: [number, number, number], c: Rgb): void => out.quad([a, b, c2, a], nrm, UV, c, 0)
  const nrmOf = (a: P, b: P): P => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l] }
  const wall = (a: P, b: P, y0: number, y1: number, c: Rgb, off = 0): void => {
    if (y1 - y0 < 0.01) return
    const [nx, nz] = nrmOf(a, b)
    q([[a[0] + nx * off, y0, a[1] + nz * off], [b[0] + nx * off, y0, b[1] + nz * off], [b[0] + nx * off, y1, b[1] + nz * off], [a[0] + nx * off, y1, a[1] + nz * off]], [nx, 0, nz], c)
  }
  const strip = (a: P, b: P, y: number, o0: number, o1: number, c: Rgb): void => {
    const [nx, nz] = nrmOf(a, b)
    q([[a[0] + nx * o0, y, a[1] + nz * o0], [b[0] + nx * o0, y, b[1] + nz * o0], [b[0] + nx * o1, y, b[1] + nz * o1], [a[0] + nx * o1, y, a[1] + nz * o1]], [0, 1, 0], c)
  }
  const at = (a: P, u: [number, number], s: number, v: number): P => { const [nx, nz] = nrmOf(a, [a[0] + u[0], a[1] + u[1]]); return [a[0] + u[0] * s + nx * v, a[1] + u[1] * s + nz * v] }

  // the glazed corner bay stands where the plan turns hardest within TIP_RADIUS
  const turn = (i: number): number => { const a = ring[(i + n - 1) % n], b = ring[i], c = ring[(i + 1) % n]; const d1 = Math.atan2(b[1] - a[1], b[0] - a[0]), d2 = Math.atan2(c[1] - b[1], c[0] - b[0]); let d = d2 - d1; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return Math.max(0, d) } // convex turns only (the ring is counter-clockwise in x,z after the area test)
  let tv = 0, tb = -1
  const reflex = ring.filter((_, j) => turn(j) === 0 && Math.abs(Math.atan2(ring[(j + 1) % n][1] - ring[j][1], ring[(j + 1) % n][0] - ring[j][0]) - Math.atan2(ring[j][1] - ring[(j + n - 1) % n][1], ring[j][0] - ring[(j + n - 1) % n][0])) > 0.5) // courtyard notch corners
  for (let i = 0; i < n; i++) { if (reflex.some((r) => Math.hypot(r[0] - ring[i][0], r[1] - ring[i][1]) < K.NOTCH_CLEAR)) continue; let sum = 0; for (let j = 0; j < n; j++) if (Math.hypot(ring[j][0] - ring[i][0], ring[j][1] - ring[i][1]) < K.TIP_RADIUS) sum += turn(j); if (sum > tb) { tb = sum; tv = i } }
  const tp = ring[tv], clus = ring.filter((p) => Math.hypot(p[0] - tp[0], p[1] - tp[1]) < K.TIP_RADIUS)
  const cen: P = [clus.reduce((s2, p) => s2 + p[0], 0) / clus.length, clus.reduce((s2, p) => s2 + p[1], 0) / clus.length]
  const mid: P = [ring.reduce((s2, p) => s2 + p[0], 0) / n, ring.reduce((s2, p) => s2 + p[1], 0) / n]
  const dl0 = Math.hypot(mid[0] - cen[0], mid[1] - cen[1]) || 1
  const tn: P = [-(mid[0] - cen[0]) / dl0, -(mid[1] - cen[1]) / dl0] // outward at the corner

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
    wall(a, b, fl0 - 0.2, fl0 + 0.25, stoneLt, 0.14) // string course over the shops
    wall(a, b, eave - K.CORNICE, eave, stoneLt, 0.28)
    strip(a, b, eave, 0, 0.28, stoneLt)
    const A2 = inset[i], B2 = inset[(i + 1) % n], rise = ridge - eave, sl: [number, number, number] = [nx * rise, K.INSET, nz * rise]
    const sn = Math.hypot(sl[0], sl[1], sl[2]) || 1
    // mansard: steep lower slope to 75% of the rise, then a flatter upper one
    const k1 = 0.78, k2 = 0.52, mA: P = [a[0] + (A2[0] - a[0]) * k2, a[1] + (A2[1] - a[1]) * k2], mB: P = [b[0] + (B2[0] - b[0]) * k2, b[1] + (B2[1] - b[1]) * k2]
    const ym = eave + rise * k1
    q([[a[0], eave, a[1]], [b[0], eave, b[1]], [mB[0], ym, mB[1]], [mA[0], ym, mA[1]]], [sl[0] / sn, sl[1] / sn * 0.6, sl[2] / sn], slate)
    q([[mA[0], ym, mA[1]], [mB[0], ym, mB[1]], [B2[0], ridge, B2[1]], [A2[0], ridge, A2[1]]], [0, 1, 0], slateLt)
    if (l < K.MIN_WALL) continue
    const nb = Math.max(1, Math.round((l - 2 * K.MARGIN) / K.BAY)), bw = (l - 2 * K.MARGIN) / nb
    const P3 = (s2: number, v: number, y: number): [number, number, number] => { const p = at(a, u, s2, v); return [p[0], y, p[1]] }
    // roof-edge rail
    wall(a, b, ridge, ridge + 0.45, iron, -K.INSET * 0.92)
    // shops: glazed fronts between pilasters, red awning band over them
    wall(a, b, 0, fl0 - 0.2, stoneDk, K.BAND_OUT)
    for (let w = 0; w < nb; w++) {
      const c = K.MARGIN + (w + 0.5) * bw, hw = bw / 2 - 0.35
      q([P3(c - hw, K.BAND_OUT + 0.03, 0.35), P3(c + hw, K.BAND_OUT + 0.03, 0.35), P3(c + hw, K.BAND_OUT + 0.03, fl0 - 1.35), P3(c - hw, K.BAND_OUT + 0.03, fl0 - 1.35)], [nx, 0, nz], shopGlass)
      q([P3(c - hw - 0.1, K.AWNING_OUT, fl0 - 1.1 - K.AWNING_H), P3(c + hw + 0.1, K.AWNING_OUT, fl0 - 1.1 - K.AWNING_H), P3(c + hw + 0.1, K.BAND_OUT + 0.04, fl0 - 1.1), P3(c - hw - 0.1, K.BAND_OUT + 0.04, fl0 - 1.1)], [nx * 0.6, -0.5, nz * 0.6], awning)
    }
    // upper floors: tall windows with rails; continuous balconies on the marked floors; pedimented first-floor windows
    for (let f = 0; f < K.FLOORS; f++) {
      const y = fl0 + f * FLOOR
      if (f === 0 || f === K.FLOORS - 1 || K.BALCONY_FLOORS.includes(f)) wall(a, b, y + K.WIN_BOT, y + 0.02 + FLOOR * 0.02, stoneLt, 0.03) // cheap plinth line
      if (f > 0) strip(a, b, y + 0.01, 0, 0.08, stoneLt)
      if (K.BALCONY_FLOORS.includes(f)) {
        wall(a, b, y + K.WIN_BOT, y + K.WIN_BOT + K.RAIL_H, iron, K.RAIL_OUT)
        strip(a, b, y + K.WIN_BOT, 0, K.RAIL_OUT, stoneDk)
      }
      for (let w = 0; w < nb; w++) {
        const c = K.MARGIN + (w + 0.5) * bw
        const s0 = c - K.WIN_W / 2 - K.FRAME, s1 = c + K.WIN_W / 2 + K.FRAME
        wall(at(a, u, s0, 0), at(a, u, s1, 0), y + K.WIN_BOT, y + K.WIN_TOP + K.LINTEL, stoneLt, 0.04)
        wall(at(a, u, c - K.WIN_W / 2, 0), at(a, u, c + K.WIN_W / 2, 0), y + K.WIN_BOT + 0.05, y + K.WIN_TOP, glass, 0.08)
        if (f === 0) tri(P3(c - K.WIN_W / 2 - 0.25, 0.05, y + K.WIN_TOP + K.LINTEL), P3(c + K.WIN_W / 2 + 0.25, 0.05, y + K.WIN_TOP + K.LINTEL), P3(c, 0.08, y + K.WIN_TOP + K.LINTEL + 0.55), [nx, 0, nz], stoneLt) // pediment
        if (!K.BALCONY_FLOORS.includes(f)) {
          wall(at(a, u, c - K.WIN_W / 2 - 0.2, 0), at(a, u, c + K.WIN_W / 2 + 0.2, 0), y + K.WIN_BOT, y + K.WIN_BOT + K.RAIL_H * 0.9, iron, K.RAIL_OUT * 0.6)
        }
        if (f === K.FLOORS - 1 && w % K.DORMER_EVERY === 0) {
          // a pedimented dormer standing out of the lower mansard slope
          const dv = -K.INSET * k2 * 0.5, y0 = eave + 0.55, y1 = y0 + K.DORMER_H, hd = K.DORMER_W / 2
          q([P3(c - hd - 0.12, dv + 0.02, y0), P3(c + hd + 0.12, dv + 0.02, y0), P3(c + hd + 0.12, dv + 0.02, y1), P3(c - hd - 0.12, dv + 0.02, y1)], [nx, 0, nz], stoneLt)
          q([P3(c - hd, dv + 0.05, y0 + 0.1), P3(c + hd, dv + 0.05, y0 + 0.1), P3(c + hd, dv + 0.05, y1 - 0.1), P3(c - hd, dv + 0.05, y1 - 0.1)], [nx, 0, nz], glass)
          tri(P3(c - hd - 0.18, dv + 0.03, y1), P3(c + hd + 0.18, dv + 0.03, y1), P3(c, dv + 0.03, y1 + 0.5), [nx, 0, nz], stoneLt)
          wall(at(a, u, c - hd, 0), at(a, u, c + hd, 0), y0, y0 + 0.4, iron, dv + 0.2)
        }
      }
      for (let w = 0; w <= nb; w++) {
        const s2 = K.MARGIN + w * bw - K.PILASTER / 2
        wall(at(a, u, Math.max(0, s2), 0), at(a, u, Math.min(l, s2 + K.PILASTER), 0), y, y + FLOOR, stoneLt, K.PILASTER_OUT)
      }
    }
  }

  // the corner bay: a half-polygon prism of glazing over several floors, each with a stone slab and rail
  const S = K.ORIEL_SIDES, R = K.ORIEL_R, a0 = Math.atan2(tn[1], tn[0]) - K.ORIEL_ARC / 2
  const yA = fl0 + K.ORIEL_FROM * FLOOR, yB = fl0 + K.ORIEL_TO * FLOOR
  const pr = (rr: number, k: number): P => [cen[0] + rr * Math.cos(a0 + K.ORIEL_ARC * k / S) - tn[0] * 0.3, cen[1] + rr * Math.sin(a0 + K.ORIEL_ARC * k / S) - tn[1] * 0.3]
  const r3 = (rr: number, y: number, k: number): [number, number, number] => { const p = pr(rr, k); return [p[0], y, p[1]] }
  for (let k = 0; k < S; k++) {
    const m = a0 + K.ORIEL_ARC * (k + 0.5) / S, nm: [number, number, number] = [Math.cos(m), 0, Math.sin(m)]
    q([r3(R, yA - 0.5, k + 1), r3(R, yA - 0.5, k), r3(R, yA, k), r3(R, yA, k + 1)].reverse(), nm, stoneLt) // never mind winding: quads are two-sided in the engine
    for (let f = K.ORIEL_FROM; f < K.ORIEL_TO; f++) {
      const y = fl0 + f * FLOOR
      q([r3(R, y, k), r3(R, y, k + 1), r3(R, y + FLOOR - 0.35, k + 1), r3(R, y + FLOOR - 0.35, k)], nm, glass)
      q([r3(R + 0.12, y + FLOOR - 0.35, k), r3(R + 0.12, y + FLOOR - 0.35, k + 1), r3(R + 0.12, y + FLOOR, k + 1), r3(R + 0.12, y + FLOOR, k)], nm, stoneLt)
      q([r3(R + 0.1, y, k), r3(R + 0.1, y, k + 1), r3(R + 0.1, y + 0.9, k + 1), r3(R + 0.1, y + 0.9, k)], nm, iron)
    }
    q([r3(R + 0.15, yB - 0.1, k), r3(R + 0.15, yB - 0.1, k + 1), r3(R + 0.15, yB + 0.9, k + 1), r3(R + 0.15, yB + 0.9, k)], nm, iron) // rail on top of the bay
  }
  for (let k = 0; k < S; k++) { // the flat tops of the bay (slab) as fans
    const c0: [number, number, number] = [cen[0] - tn[0] * 0.3, yB, cen[1] - tn[1] * 0.3]
    tri(c0, r3(R + 0.12, yB, k), r3(R + 0.12, yB, k + 1), [0, 1, 0], stoneDk)
  }
  for (let f = K.ORIEL_FROM; f < K.ORIEL_TO; f++) for (let k = 0; k < S; k++) {
    const y = fl0 + f * FLOOR
    q([r3(R, y, k), r3(R, y, k + 1), r3(R, y, k + 1), r3(R, y, k)], [0, -1, 0], stoneDk)
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
