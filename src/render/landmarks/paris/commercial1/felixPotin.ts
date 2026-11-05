/**
 * Immeuble Félix Potin, 140 rue de Rennes, Paris 6e, OSM way/64306111 (listed MH PA00088620, Paul Auscher 1904, ~28 m).
 * From the Commons photo: a glazed shopfront with a canopy, a mezzanine of arched windows under a carved band, cream stone
 * above with rounded iron balconies in two tiers, a cornice and low attic, and the round corner tower with its balconies,
 * corbelled drum, stone dome and lantern. Adapted from lePigalle.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const POTIN = {
  GROUND: 5.4, MEZZ: 3.6, FLOORS: 4, CORNICE: 0.45, ATTIC: 1.6, INSET: 1.4, EAVE_FRAC: 0.74, // storey heights, metres
  BAY: 3.3, MARGIN: 1.0, MIN_WALL: 3, WIN_W: 1.15, WIN_BOT: 0.1, WIN_TOP: 2.2, FRAME: 0.15, LINTEL: 0.25,
  RAIL_OUT: 0.45, RAIL_H: 0.95, PILASTER: 0.45, PILASTER_OUT: 0.1, BALCONY_FLOORS: [1, 3],
  SHOP_TOP: 4.2, CANOPY_Y: 4.5, CANOPY_OUT: 1.6, CANOPY_H: 0.35, BAND_OUT: 0.08, ARCH_W: 2.0, ARCH_SEG: 5,
  TOWER_R: 4.6, TOWER_SIDES: 12, TOWER_SINK: 1.2, TOWER_RISE: 2.6, DOME_H: 3.0, LANTERN_W: 0.9, LANTERN_H: 1.5, SPIRE_H: 1.0,
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

export const felixPotin = (out: MeshBuilder, fit: Fit): void => {
  const K = POTIN, H = fit.height
  const stone = hex('#dccb9f'), stoneLt = hex('#ebdfbd'), stoneDk = hex('#b8a780'), glass = hex('#3a4652'), shopGlass = hex('#5d6a70'), iron = hex('#22262a'), canopy = hex('#6e6a5a'), zinc = hex('#7d8387'), roofFlat = hex('#7a7f82'), gold = hex('#b08a3e'), blind = hex('#c5d0c0')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw // outward normal of a->b is (dz,-dx)
  const n = ring.length
  const FLOOR = (H * K.EAVE_FRAC - K.GROUND - K.MEZZ - K.CORNICE) / K.FLOORS
  const fl0 = K.GROUND + K.MEZZ
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
  let tv = 0, tb = -1
  for (let i = 0; i < n; i++) { const s = turn((i + n - 1) % n) + turn(i) + turn((i + 1) % n); if (s > tb) { tb = s; tv = i } }
  const tp = ring[tv], e1 = nrmOf(ring[(tv + n - 1) % n], tp), e2 = nrmOf(tp, ring[(tv + 1) % n])
  const tl = Math.hypot(e1[0] + e2[0], e1[1] + e2[1]) || 1, tn: P = [(e1[0] + e2[0]) / tl, (e1[1] + e2[1]) / tl]
  const tc: P = [tp[0] - tn[0] * (K.TOWER_R - K.TOWER_SINK), tp[1] - tn[1] * (K.TOWER_R - K.TOWER_SINK)]

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
    wall(a, b, K.GROUND - 0.5, K.GROUND + 0.2, stoneLt, K.BAND_OUT + 0.1) // carved band over the shopfronts
    wall(a, b, fl0 - 0.2, fl0 + 0.15, stoneLt, 0.2) // string course under the first floor
    wall(a, b, eave - K.CORNICE, eave, stoneLt, 0.25)
    strip(a, b, eave, 0, 0.25, stoneLt)
    const A2 = inset[i], B2 = inset[(i + 1) % n], rise = ridge - eave, sl: [number, number, number] = [nx * rise, K.INSET, nz * rise]
    const sn = Math.hypot(sl[0], sl[1], sl[2]) || 1
    q([[a[0], eave, a[1]], [b[0], eave, b[1]], [B2[0], ridge, B2[1]], [A2[0], ridge, A2[1]]], [sl[0] / sn, sl[1] / sn, sl[2] / sn], zinc)
    if (l < K.MIN_WALL) continue
    const nb = Math.max(1, Math.round((l - 2 * K.MARGIN) / K.BAY)), bw = (l - 2 * K.MARGIN) / nb
    const P3 = (s: number, v: number, y: number): [number, number, number] => { const p = at(a, u, s, v); return [p[0], y, p[1]] }
    // shopfront: tall glazing between stone piers, a canopy over it
    wall(a, b, 0, K.SHOP_TOP, stoneDk, K.BAND_OUT)
    for (let w = 0; w < nb; w++) {
      const c = K.MARGIN + (w + 0.5) * bw, hw = bw / 2 - 0.35
      wall(at(a, u, c - hw, 0), at(a, u, c + hw, 0), 0.3, K.SHOP_TOP - 0.2, shopGlass, K.BAND_OUT + 0.04)
      wall(at(a, u, c - 0.04, 0), at(a, u, c + 0.04, 0), 0.3, K.SHOP_TOP - 0.2, iron, K.BAND_OUT + 0.06)
    }
    const cl = at(a, u, 0.3, 0), cr = at(a, u, l - 0.3, 0)
    wall(cl, cr, K.CANOPY_Y, K.CANOPY_Y + K.CANOPY_H, canopy, K.CANOPY_OUT)
    strip(cl, cr, K.CANOPY_Y + K.CANOPY_H, 0, K.CANOPY_OUT, canopy)
    strip(cl, cr, K.CANOPY_Y, 0, K.CANOPY_OUT, iron)
    // mezzanine: arched windows between stone piers
    for (let w = 0; w < nb; w++) {
      const c = K.MARGIN + (w + 0.5) * bw, hw = Math.min(K.ARCH_W, bw - 0.7) / 2, y0 = K.GROUND + 0.5, ys = K.GROUND + K.MEZZ - 1.0 - hw * 0.5, o = K.BAND_OUT + 0.02
      for (const [h2, v, col] of [[hw + 0.12, o, stoneLt], [hw, o + 0.03, blind]] as [number, number, Rgb][]) {
        q([P3(c - h2, v, y0), P3(c + h2, v, y0), P3(c + h2, v, ys), P3(c - h2, v, ys)], [nx, 0, nz], col)
        for (let k = 0; k < K.ARCH_SEG; k++) {
          const t0 = Math.PI * k / K.ARCH_SEG, t1 = Math.PI * (k + 1) / K.ARCH_SEG
          tri(P3(c, v, ys), P3(c + h2 * Math.cos(t0), v, ys + h2 * 0.8 * Math.sin(t0)), P3(c + h2 * Math.cos(t1), v, ys + h2 * 0.8 * Math.sin(t1)), [nx, 0, nz], col)
        }
      }
    }
    // upper floors
    for (let f = 0; f < K.FLOORS; f++) {
      const y = fl0 + f * FLOOR, bal = K.BALCONY_FLOORS.includes(f)
      for (let w = 0; w < nb; w++) {
        const c = K.MARGIN + (w + 0.5) * bw, s0 = c - K.WIN_W / 2 - K.FRAME, s1 = c + K.WIN_W / 2 + K.FRAME
        wall(at(a, u, s0, 0), at(a, u, s1, 0), y + K.WIN_BOT, y + K.WIN_TOP + K.LINTEL, stoneLt, 0.04)
        wall(at(a, u, c - K.WIN_W / 2, 0), at(a, u, c + K.WIN_W / 2, 0), y + K.WIN_BOT + 0.05, y + K.WIN_TOP, glass, 0.08)
        const rb = bal ? K.RAIL_OUT : 0.15, rl = bal ? 0.9 : 0.15
        wall(at(a, u, c - K.WIN_W / 2 - rl, 0), at(a, u, c + K.WIN_W / 2 + rl, 0), y + K.WIN_BOT, y + K.WIN_BOT + K.RAIL_H, iron, rb)
        if (bal) strip(at(a, u, c - K.WIN_W / 2 - rl, 0), at(a, u, c + K.WIN_W / 2 + rl, 0), y + K.WIN_BOT, 0, rb, stoneDk)
      }
      for (let w = 0; w <= nb; w++) {
        const s = K.MARGIN + w * bw - K.PILASTER / 2
        wall(at(a, u, Math.max(0, s), 0), at(a, u, Math.min(l, s + K.PILASTER), 0), y, y + FLOOR, stoneLt, K.PILASTER_OUT)
      }
    }
  }

  // the corner tower: a corbelled drum with a balcony ring per tier, a stone dome and a lantern
  const S = K.TOWER_SIDES, R = K.TOWER_R, yt = eave + K.TOWER_RISE
  const pt = (rr: number, k: number): P => [tc[0] + rr * Math.cos((2 * Math.PI * k) / S), tc[1] + rr * Math.sin((2 * Math.PI * k) / S)]
  const ring3 = (rr: number, y: number, k: number): [number, number, number] => { const p = pt(rr, k); return [p[0], y, p[1]] }
  const face = (k: number): [number, number, number] => { const m = (2 * Math.PI * (k + 0.5)) / S; return [Math.cos(m), 0, Math.sin(m)] }
  const sideW = 2 * R * Math.sin(Math.PI / S)
  for (let k = 0; k < S; k++) {
    const nm = face(k), mid = (2 * Math.PI * (k + 0.5)) / S
    const onFront = nm[0] * tn[0] + nm[2] * tn[1] > -0.2 // skip the faces buried in the building
    if (!onFront) continue
    q([ring3(R, fl0, k), ring3(R, fl0, k + 1), ring3(R, yt, k + 1), ring3(R, yt, k)], nm, stone)
    q([ring3(R + 0.15, eave - K.CORNICE, k), ring3(R + 0.15, eave - K.CORNICE, k + 1), ring3(R + 0.15, eave, k + 1), ring3(R + 0.15, eave, k)], nm, stoneLt)
    // corbels: a flared ring below the first floor
    q([ring3(R - 0.6, fl0 - 0.8, k), ring3(R - 0.6, fl0 - 0.8, k + 1), ring3(R + 0.2, fl0, k + 1), ring3(R + 0.2, fl0, k)], [nm[0], -0.4, nm[2]], stoneDk)
    const px = Math.cos(mid + Math.PI / 2), pz = Math.sin(mid + Math.PI / 2)
    for (let f = 0; f < K.FLOORS + 1; f++) {
      const y = fl0 + f * FLOOR, top = f === K.FLOORS ? yt - 1.2 : y + FLOOR
      if (top - y < 1.8) continue
      const c = pt(R + 0.08, k + 0.5)
      const w2 = Math.min(0.6, sideW * 0.2)
      q([[c[0] - px * w2, y + 0.4, c[1] - pz * w2], [c[0] + px * w2, y + 0.4, c[1] + pz * w2], [c[0] + px * w2, Math.min(y + 2.3, top - 0.3), c[1] + pz * w2], [c[0] - px * w2, Math.min(y + 2.3, top - 0.3), c[1] - pz * w2]], nm, glass)
      if (f % 2 === 1 || f === K.FLOORS) { // balcony bands round the drum
        const rr = R + 0.5
        q([ring3(rr, y + 0.1, k), ring3(rr, y + 0.1, k + 1), ring3(rr, y + 1.0, k + 1), ring3(rr, y + 1.0, k)], nm, iron)
        q([ring3(R, y + 0.1, k), ring3(rr, y + 0.1, k), ring3(rr, y + 0.1, k + 1), ring3(R, y + 0.1, k + 1)], [0, -1, 0], stoneDk)
      }
    }
    // dome (stone, a flattened bulb), eaves ring at the top of the drum
    q([ring3(R + 0.3, yt, k), ring3(R + 0.3, yt, k + 1), ring3(R * 0.95, yt + 0.5, k + 1), ring3(R * 0.95, yt + 0.5, k)], [nm[0], 0.5, nm[2]], stoneLt)
    const prof: [number, number][] = [[0.95, 0.5], [1.0, 0.45], [0.9, 1.2], [0.65, 2.0], [0.35, 2.6], [0.12, K.DOME_H]]
    for (let j = 0; j + 1 < prof.length; j++) {
      const [r0, h0] = prof[j], [r1, h1] = prof[j + 1], sl = (r0 - r1) * R
      const dn: [number, number, number] = [nm[0] * (h1 - h0), sl, nm[2] * (h1 - h0)], dl = Math.hypot(dn[0], dn[1], dn[2]) || 1
      q([ring3(R * r0, yt + h0, k), ring3(R * r0, yt + h0, k + 1), ring3(R * r1, yt + h1, k + 1), ring3(R * r1, yt + h1, k)], [dn[0] / dl, dn[1] / dl, dn[2] / dl], j % 2 ? stone : stoneLt)
    }
  }
  // lantern and finial on top
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
