/**
 * Immeuble Hennebique, 1 rue Danton at place Saint-Michel, Paris 6e, OSM relation/610944 (listed MH PA00088580, Edouard Arnaud 1900,
 * first reinforced-concrete apartment block in Paris, ~28 m). From the Commons photo: a ground storey of big arches on bulbous
 * flared piers, then cream stone floors where bays alternate between a flat window with an iron rail and a stacked three-faced bow
 * window, a balustraded string course, a cornice and a low zinc attic, and the ornate corner turret: a round drum of arched
 * windows carried on corbels, a cornice, a ring of arched lantern windows and a bulb dome with finial. Adapted from hennebique.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const HENNEBIQUE = {
  GROUND: 5.2, FLOORS: 6, CORNICE: 0.55, ATTIC: 1.8, INSET: 1.4, EAVE_FRAC: 0.8, // storey heights, metres
  BAY: 3.6, MARGIN: 1.0, MIN_WALL: 3, WIN_W: 1.2, WIN_BOT: 0.15, WIN_TOP: 2.3, FRAME: 0.15, LINTEL: 0.25,
  RAIL_OUT: 0.3, RAIL_H: 0.95, PILASTER: 0.4, PILASTER_OUT: 0.12, BAND_OUT: 0.1,
  ARCH_W: 2.8, ARCH_SEG: 6, PIER_FLARE: 0.45, BALUSTRADE_Y: 0.5,
  BOW_W: 2.0, BOW_OUT: 0.85, BOW_FROM: 1, BOW_EVERY: 2, // bow windows on every other bay from this floor up
  TOWER_R: 3.3, TOWER_SIDES: 10, TOWER_IN: 1.2, TIP_RADIUS: 4.5, DRUM_RISE: 3.2, DOME_H: 3.2, LANTERN_W: 0.7, LANTERN_H: 1.0, SPIRE_H: 1.4,
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

export const hennebique = (out: MeshBuilder, fit: Fit): void => {
  const K = HENNEBIQUE, H = fit.height
  const stone = hex('#d6c7ab'), stoneLt = hex('#e6dbc3'), stoneDk = hex('#b3a38a'), glass = hex('#46586a'), shopGlass = hex('#2f3a44'), iron = hex('#1f2326'), tile = hex('#6f9a8c'), zinc = hex('#7d8387'), roofFlat = hex('#7a7f82'), gold = hex('#b08a3e')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw // outward normal of a->b is (dz,-dx)
  const n = ring.length
  const FLOOR = (H * K.EAVE_FRAC - K.GROUND - K.CORNICE) / K.FLOORS
  const fl0 = K.GROUND
  const eave = fl0 + K.FLOORS * FLOOR + K.CORNICE
  const ridge = eave + K.ATTIC
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

  // the corner tower stands on the edge that turns hardest at both ends (the chamfer)
  const turn = (i: number): number => { const a = ring[(i + n - 1) % n], b = ring[i], c = ring[(i + 1) % n]; const d1 = Math.atan2(b[1] - a[1], b[0] - a[0]), d2 = Math.atan2(c[1] - b[1], c[0] - b[0]); let d = Math.abs(d2 - d1); if (d > Math.PI) d = 2 * Math.PI - d; return d }
  let tv = 0, tb = -1 // the tip = the vertex whose neighbourhood (TIP_RADIUS) turns most in total
  for (let i = 0; i < n; i++) { let sum = 0; for (let j = 0; j < n; j++) if (Math.hypot(ring[j][0] - ring[i][0], ring[j][1] - ring[i][1]) < K.TIP_RADIUS) sum += turn(j); if (sum > tb) { tb = sum; tv = i } }
  // the turret rounds the acute tip: centre = the tip cluster's centroid pulled TOWER_IN towards the plan's middle
  const tp = ring[tv], clus = ring.filter((p) => Math.hypot(p[0] - tp[0], p[1] - tp[1]) < K.TIP_RADIUS)
  const cen: P = [clus.reduce((s2, p) => s2 + p[0], 0) / clus.length, clus.reduce((s2, p) => s2 + p[1], 0) / clus.length]
  const mid: P = [ring.reduce((s2, p) => s2 + p[0], 0) / n, ring.reduce((s2, p) => s2 + p[1], 0) / n]
  const dl0 = Math.hypot(mid[0] - cen[0], mid[1] - cen[1]) || 1
  const tn: P = [-(mid[0] - cen[0]) / dl0, -(mid[1] - cen[1]) / dl0]
  const tc: P = [cen[0] - tn[0] * K.TOWER_IN, cen[1] - tn[1] * K.TOWER_IN]

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
    wall(a, b, fl0 - 0.35, fl0 + 0.2, stoneLt, 0.3) // balustraded string course over the arches
    wall(a, b, eave - K.CORNICE, eave, stoneLt, 0.3)
    strip(a, b, eave, 0, 0.3, stoneLt)
    const A2 = inset[i], B2 = inset[(i + 1) % n], rise = ridge - eave, sl: [number, number, number] = [nx * rise, K.INSET, nz * rise]
    const sn = Math.hypot(sl[0], sl[1], sl[2]) || 1
    q([[a[0], eave, a[1]], [b[0], eave, b[1]], [B2[0], ridge, B2[1]], [A2[0], ridge, A2[1]]], [sl[0] / sn, sl[1] / sn, sl[2] / sn], zinc)
    if (l < K.MIN_WALL) continue
    const nb = Math.max(1, Math.round((l - 2 * K.MARGIN) / K.BAY)), bw = (l - 2 * K.MARGIN) / nb
    const P3 = (s2: number, v: number, y: number): [number, number, number] => { const p = at(a, u, s2, v); return [p[0], y, p[1]] }
    // ground storey: big arches between bulbous flared piers
    wall(a, b, 0, fl0 - 0.35, stoneDk, K.BAND_OUT)
    for (let w = 0; w < nb; w++) {
      const c = K.MARGIN + (w + 0.5) * bw, hw = Math.min(K.ARCH_W, bw - 1.0) / 2, y0 = 0.5, ys = fl0 - 1.4 - hw * 0.6, o = K.BAND_OUT + 0.02
      for (const [h2, v, col] of [[hw + 0.2, o, stoneLt], [hw, o + 0.04, shopGlass]] as [number, number, Rgb][]) {
        q([P3(c - h2, v, y0), P3(c + h2, v, y0), P3(c + h2, v, ys), P3(c - h2, v, ys)], [nx, 0, nz], col)
        for (let k = 0; k < K.ARCH_SEG; k++) {
          const t0 = Math.PI * k / K.ARCH_SEG, t1 = Math.PI * (k + 1) / K.ARCH_SEG
          tri(P3(c, v, ys), P3(c + h2 * Math.cos(t0), v, ys + h2 * 0.65 * Math.sin(t0)), P3(c + h2 * Math.cos(t1), v, ys + h2 * 0.65 * Math.sin(t1)), [nx, 0, nz], col)
        }
      }
      q([P3(c - 0.05, o + 0.06, y0), P3(c + 0.05, o + 0.06, y0), P3(c + 0.05, o + 0.06, ys), P3(c - 0.05, o + 0.06, ys)], [nx, 0, nz], iron)
      // the pier beside it flares out under the string course
      const pc = c + bw / 2
      if (w < nb) q([P3(pc - 0.5, 0.0, fl0 - 2.2), P3(pc + 0.5, 0.0, fl0 - 2.2), P3(pc + 0.8, K.PIER_FLARE, fl0 - 0.35), P3(pc - 0.8, K.PIER_FLARE, fl0 - 0.35)], [nx, -0.3, nz], stoneLt)
    }
    // upper floors: bays alternate flat window + iron rail / stacked bow window
    for (let f = 0; f < K.FLOORS; f++) {
      const y = fl0 + f * FLOOR
      for (let w = 0; w < nb; w++) {
        const c = K.MARGIN + (w + 0.5) * bw
        const bow = f >= K.BOW_FROM && w % K.BOW_EVERY === 0 && bw > K.BOW_W + 0.9
        if (bow) {
          const hb = K.BOW_W / 2, ob = K.BOW_OUT, y0 = y + 0.05, y1 = y + FLOOR - 0.05
          // three faces: a square front and two splayed cheeks
          q([P3(c - hb, ob, y0), P3(c + hb, ob, y0), P3(c + hb, ob, y1), P3(c - hb, ob, y1)], [nx, 0, nz], stoneLt)
          q([P3(c - hb + 0.2, ob + 0.03, y + 0.35), P3(c + hb - 0.2, ob + 0.03, y + 0.35), P3(c + hb - 0.2, ob + 0.03, y + FLOOR - 0.45), P3(c - hb + 0.2, ob + 0.03, y + FLOOR - 0.45)], [nx, 0, nz], glass)
          for (const sgn of [-1, 1]) {
            const e0 = c + sgn * (hb + 0.5), e1 = c + sgn * hb
            const sn2: [number, number, number] = [nx * 0.7 + ux * sgn * 0.7, 0, nz * 0.7 + uz * sgn * 0.7]
            const pts: [number, number, number][] = sgn > 0 ? [P3(e1, ob, y0), P3(e0, 0.02, y0), P3(e0, 0.02, y1), P3(e1, ob, y1)] : [P3(e0, 0.02, y0), P3(e1, ob, y0), P3(e1, ob, y1), P3(e0, 0.02, y1)]
            q(pts, sn2, stoneLt)
          }
          q([P3(c - hb - 0.5, 0, y1 - 0.05), P3(c + hb + 0.5, 0, y1 - 0.05), P3(c + hb, ob + 0.1, y1 - 0.05), P3(c - hb, ob + 0.1, y1 - 0.05)], [0, 1, 0], stoneDk) // flat roof slab of each bow
          q([P3(c - hb, ob, y + 0.35), P3(c + hb, ob, y + 0.35), P3(c + hb, ob + 0.06, y + 1.2), P3(c - hb, ob + 0.06, y + 1.2)], [nx, 0, nz], iron) // rail on the bow front
        } else {
          const s0 = c - K.WIN_W / 2 - K.FRAME, s1 = c + K.WIN_W / 2 + K.FRAME
          wall(at(a, u, s0, 0), at(a, u, s1, 0), y + K.WIN_BOT, y + K.WIN_TOP + K.LINTEL, stoneLt, 0.04)
          wall(at(a, u, c - K.WIN_W / 2, 0), at(a, u, c + K.WIN_W / 2, 0), y + K.WIN_BOT + 0.05, y + K.WIN_TOP, glass, 0.08)
          wall(at(a, u, c - K.WIN_W / 2 - 0.3, 0), at(a, u, c + K.WIN_W / 2 + 0.3, 0), y + K.WIN_BOT, y + K.WIN_BOT + K.RAIL_H, iron, K.RAIL_OUT)
          strip(at(a, u, c - K.WIN_W / 2 - 0.3, 0), at(a, u, c + K.WIN_W / 2 + 0.3, 0), y + K.WIN_BOT, 0, K.RAIL_OUT, stoneDk)
        }
        if (f === K.FLOORS - 1) wall(at(a, u, c - 0.5, 0), at(a, u, c + 0.5, 0), eave - 1.5, eave - 0.7, tile, 0.12) // tiled panel under the cornice
      }
      for (let w = 0; w <= nb; w++) {
        const s2 = K.MARGIN + w * bw - K.PILASTER / 2
        wall(at(a, u, Math.max(0, s2), 0), at(a, u, Math.min(l, s2 + K.PILASTER), 0), y, y + FLOOR, stoneLt, K.PILASTER_OUT)
      }
    }
  }

  // the corner turret: a round drum on corbels, windows in arches, a cornice, a lantern ring and a bulb dome
  const S = K.TOWER_SIDES, R = K.TOWER_R, yt = eave + K.DRUM_RISE
  const pt = (rr: number, k: number): P => [tc[0] + rr * Math.cos((2 * Math.PI * k) / S), tc[1] + rr * Math.sin((2 * Math.PI * k) / S)]
  const ring3 = (rr: number, y: number, k: number): [number, number, number] => { const p = pt(rr, k); return [p[0], y, p[1]] }
  const face = (k: number): [number, number, number] => { const m = (2 * Math.PI * (k + 0.5)) / S; return [Math.cos(m), 0, Math.sin(m)] }
  const sideW = 2 * R * Math.sin(Math.PI / S)
  for (let k = 0; k < S; k++) {
    const nm = face(k), mid = (2 * Math.PI * (k + 0.5)) / S
    if (nm[0] * tn[0] + nm[2] * tn[1] <= -0.2) continue // faces buried in the building
    q([ring3(R, fl0 + 1.5, k), ring3(R, fl0 + 1.5, k + 1), ring3(R, yt, k + 1), ring3(R, yt, k)], nm, stone)
    q([ring3(R - 0.9, fl0 - 1.4, k), ring3(R - 0.9, fl0 - 1.4, k + 1), ring3(R, fl0 + 1.5, k + 1), ring3(R, fl0 + 1.5, k)], [nm[0], -0.5, nm[2]], stoneLt) // the corbelled swell under the drum
    q([ring3(R + 0.3, eave - K.CORNICE, k), ring3(R + 0.3, eave - K.CORNICE, k + 1), ring3(R + 0.3, eave, k + 1), ring3(R + 0.3, eave, k)], nm, stoneLt)
    const px = Math.cos(mid + Math.PI / 2), pz = Math.sin(mid + Math.PI / 2)
    const c = pt(R + 0.08, k + 0.5), w2 = Math.min(0.5, sideW * 0.18)
    for (let f = 0; f < K.FLOORS; f++) {
      const y = fl0 + f * FLOOR
      if (y + 2.4 > eave - K.CORNICE) break
      q([[c[0] - px * w2, y + 0.5, c[1] - pz * w2], [c[0] + px * w2, y + 0.5, c[1] + pz * w2], [c[0] + px * w2, y + 2.3, c[1] + pz * w2], [c[0] - px * w2, y + 2.3, c[1] - pz * w2]], nm, glass)
      if (f % 2 === 1) q([ring3(R + 0.45, y + 0.2, k), ring3(R + 0.45, y + 0.2, k + 1), ring3(R + 0.45, y + 1.0, k + 1), ring3(R + 0.45, y + 1.0, k)], nm, iron)
    }
    // lantern storey above the cornice: arched openings
    const ya = eave + 0.3
    q([[c[0] - px * w2, ya, c[1] - pz * w2], [c[0] + px * w2, ya, c[1] + pz * w2], [c[0] + px * w2, ya + 1.6, c[1] + pz * w2], [c[0] - px * w2, ya + 1.6, c[1] - pz * w2]], nm, glass)
    for (let j = 0; j < 3; j++) {
      const t0 = Math.PI * j / 3, t1 = Math.PI * (j + 1) / 3
      const A: [number, number, number] = [c[0], ya + 1.6, c[1]]
      const B: [number, number, number] = [c[0] + px * w2 * Math.cos(t0), ya + 1.6 + w2 * 0.9 * Math.sin(t0), c[1] + pz * w2 * Math.cos(t0)]
      const C: [number, number, number] = [c[0] + px * w2 * Math.cos(t1), ya + 1.6 + w2 * 0.9 * Math.sin(t1), c[1] + pz * w2 * Math.cos(t1)]
      tri(A, B, C, nm, glass)
    }
    q([ring3(R + 0.3, yt, k), ring3(R + 0.3, yt, k + 1), ring3(R * 0.95, yt + 0.4, k + 1), ring3(R * 0.95, yt + 0.4, k)], [nm[0], 0.5, nm[2]], stoneLt)
    const prof: [number, number][] = [[0.95, 0.4], [1.05, 0.9], [0.95, 1.7], [0.7, 2.4], [0.35, 2.9], [0.1, K.DOME_H]]
    for (let j = 0; j + 1 < prof.length; j++) {
      const [r0, h0] = prof[j], [r1, h1] = prof[j + 1], sl = (r0 - r1) * R
      const dn: [number, number, number] = [nm[0] * (h1 - h0), sl, nm[2] * (h1 - h0)], dl = Math.hypot(dn[0], dn[1], dn[2]) || 1
      q([ring3(R * r0, yt + h0, k), ring3(R * r0, yt + h0, k + 1), ring3(R * r1, yt + h1, k + 1), ring3(R * r1, yt + h1, k)], [dn[0] / dl, dn[1] / dl, dn[2] / dl], j % 2 ? zinc : stoneLt)
    }
  }
  // finial on top of the dome
  const yd = yt + K.DOME_H, lw = K.LANTERN_W / 2
  const lp: P[] = [[-lw, -lw], [lw, -lw], [lw, lw], [-lw, lw]]
  for (let j = 0; j < 4; j++) {
    const [x0, z0] = lp[j], [x1, z1] = lp[(j + 1) % 4]
    q([[tc[0] + x0, yd, tc[1] + z0], [tc[0] + x1, yd, tc[1] + z1], [tc[0] + x1, yd + K.LANTERN_H, tc[1] + z1], [tc[0] + x0, yd + K.LANTERN_H, tc[1] + z0]], [(x0 + x1) / 2 / lw, 0, (z0 + z1) / 2 / lw], j % 2 ? gold : stoneLt)
    tri([tc[0] + x0, yd + K.LANTERN_H, tc[1] + z0], [tc[0] + x1, yd + K.LANTERN_H, tc[1] + z1], [tc[0], yd + K.LANTERN_H + K.SPIRE_H, tc[1]], [(x0 + x1) / 2 / lw, 0.6, (z0 + z1) / 2 / lw], stoneDk)
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
}
