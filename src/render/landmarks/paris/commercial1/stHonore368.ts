/**
 * 368-370 rue Saint-Honoré, Paris 1er, OSM way/54175244 (listed MH PA00133004; ~17 m of street front, ~15 m high, 913 m2 with courtyard, ground + 3 floors + mansard).
 * Street edges (outward normal toward local -z: the entry's `front` is the street's bearing, from the pbf's Rue Saint-Honoré) get the facade; the others are
 * plain party walls. From the Commons photo: pale grey-cream ashlar, arched carriage door at one end with console-borne scroll balcony over it, small arched
 * ground-floor windows then shopfronts under black awnings, tall arched windows each with its own small iron rail, string courses, cornice, slate mansard.
 * Structure adapted from stHonore352.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const STHONORE368 = {
  FLOORS: [1.15, 1.1, 1.0, 0.9], // ground, piano nobile, two upper floors: relative heights
  CORNICE: 0.45, MANSARD: 3.2, INSET: 2.0, EAVE_FRAC: 0.82,
  STREET_NZ: -0.8, // an edge faces the street when its outward normal's local z is below this
  BAY: 2.75, // window spacing
  DOOR_AT: 0.2, DOOR_W: 2.4, DOOR_H: 3.5, BALC_W: 3.6, // door centre as a fraction of the street front, width and height of the arch's crown
  SHOP_FROM: 0.55, SHOP_W: 3.6, WINDOW_G: 1.15, ARCH_W: 1.8, // shopfronts as fractions of the front: [from, to] (right one starts after the door)
  WIN_W: 1.15, WIN_BOT: 0.1, WIN_TOP: 2.45, FRAME: 0.14, RAIL_H: 0.95, RAIL_OUT: 0.3, SLAB_OUT: 0.45, ARCH_SEG: 8,
  DORMER_W: 0.9, DORMER_H: 1.5, BAND_OUT: 0.06,
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

export const stHonore368 = (out: MeshBuilder, fit: Fit): void => {
  const K = STHONORE368, H = fit.height
  const stone = hex('#d3c5a4'), stoneLt = hex('#e2d8bf'), stoneDk = hex('#b3a481'), party = hex('#b0a590'), glass = hex('#5a6a78'), shopGlass = hex('#2f3a44')
  const door = hex('#1d2c48'), iron = hex('#33505e'), slate = hex('#4f5560'), slateLt = hex('#5d6470'), roofFlat = hex('#6c7176'), awning = hex('#1c1c20'), gold = hex('#d6b04a')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw // outward normal of a->b is (dz,-dx)
  const n = ring.length
  const sumW = K.FLOORS.reduce((s, v) => s + v, 0)
  const fh = K.FLOORS.map((w) => w * (H * K.EAVE_FRAC - K.CORNICE) / sumW)
  const fy = fh.reduce<number[]>((acc, h) => (acc.push(acc[acc.length - 1] + h), acc), [0]) // floor levels, last = eave base
  const eave = fy[fy.length - 1] + K.CORNICE, ridge = eave + K.MANSARD, fl0 = fh[0]
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
    if (isStreet(i) && isStreet((i + n - 1) % n)) continue // a later edge of a run: drawn with the run's first
    let j = i // a run of street edges (the kink at a cadastre vertex is a few centimetres) is one facade along its chord
    if (isStreet(i)) while (isStreet((j + 1) % n) && (j + 1) % n !== i) j++
    const a = ring[i], b = ring[(j + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 0.05) continue
    const [nx, nz] = nrmOf(a, b), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l
    const P3 = (s: number, v: number, y: number): [number, number, number] => [a[0] + ux * s + nx * v, y, a[1] + uz * s + nz * v]
    const wl = (s0: number, s1: number, y0: number, y1: number, c: Rgb, v = 0): void => { if (y1 - y0 > 0.005 && s1 > s0) q([P3(s0, v, y0), P3(s1, v, y0), P3(s1, v, y1), P3(s0, v, y1)], [nx, 0, nz], c) }
    const sl = (s0: number, s1: number, y: number, v0: number, v1: number, c: Rgb): void => q([P3(s0, v0, y), P3(s1, v0, y), P3(s1, v1, y), P3(s0, v1, y)], [0, 1, 0], c)
    if (!isStreet(i)) { // party wall or side return: plain, to the roof line
      wl(0, l, 0, ridge, party)
      continue
    }
    wl(0, l, 0, eave, stone)
    wl(0, l, eave - K.CORNICE, eave, stoneLt, 0.26); sl(0, l, eave, 0, 0.26, stoneLt)
    wl(0, l, fl0 - 0.12, fl0 + 0.2, stoneLt, 0.1) // string course over the shops
    const A2 = inset[i], B2 = inset[(j + 1) % n], rise = ridge - eave, k1 = 0.78, k2 = 0.52
    const mA: P = [a[0] + (A2[0] - a[0]) * k2, a[1] + (A2[1] - a[1]) * k2], mB: P = [b[0] + (B2[0] - b[0]) * k2, b[1] + (B2[1] - b[1]) * k2], ym = eave + rise * k1
    q([[a[0], eave, a[1]], [b[0], eave, b[1]], [mB[0], ym, mB[1]], [mA[0], ym, mA[1]]], [nx, 0.4, nz], slate)
    q([[mA[0], ym, mA[1]], [mB[0], ym, mB[1]], [B2[0], ridge, B2[1]], [A2[0], ridge, A2[1]]], [0, 1, 0], slateLt)
    tri([a[0], eave, a[1]], [a[0], ridge, a[1]], [A2[0], ridge, A2[1]], [-ux, 0, -uz], slate) // close the slope's ends against the party walls
    tri([b[0], eave, b[1]], [B2[0], ridge, B2[1]], [b[0], ridge, b[1]], [ux, 0, uz], slate)
    wl(0, l, ridge, ridge + 0.4, iron, -K.INSET * 0.9)

    // ground floor: arched blue door between two shopfronts
    const dc = l * K.DOOR_AT, dw = K.DOOR_W / 2, spr = K.DOOR_H - dw // arch springs at spr
    wl(0, l, 0, fl0 - 0.12, stoneDk, K.BAND_OUT)
    const shop = (s0: number, s1: number, c: Rgb, withAwning: boolean): void => {
      if (s1 - s0 < 0.5) return
      wl(s0, s1, 0.3, fl0 - 1.1, shopGlass, K.BAND_OUT + 0.04)
      wl(s0 - 0.15, s0, 0, fl0 - 0.2, c, K.BAND_OUT + 0.08); wl(s1, s1 + 0.15, 0, fl0 - 0.2, c, K.BAND_OUT + 0.08) // jambs
      wl(s0 - 0.15, s1 + 0.15, 0, 0.3, c, K.BAND_OUT + 0.08) // stall riser
      wl(s0 - 0.15, s1 + 0.15, fl0 - 1.1, fl0 - 0.2, c, K.BAND_OUT + 0.08) // fascia
      if (withAwning) q([P3(s0 - 0.1, 0.9, fl0 - 1.5), P3(s1 + 0.1, 0.9, fl0 - 1.5), P3(s1 + 0.1, K.BAND_OUT + 0.08, fl0 - 1.1), P3(s0 - 0.1, K.BAND_OUT + 0.08, fl0 - 1.1)], [nx * 0.6, -0.5, nz * 0.6], awning)
    }
    const shopFrom = l * K.SHOP_FROM
    shop(shopFrom, shopFrom + K.SHOP_W, stoneDk, true)
    shop(shopFrom + K.SHOP_W + 0.5, l - 0.25, stoneDk, true)
    // small arched ground-floor windows between the door and the shops, on the bay rhythm
    for (let s = dc + dw + 1.9; s < shopFrom - 1; s += K.BAY * 0.85) {
      const hw = K.ARCH_W / 2, y0 = 0.9, yr = y0 + 1.3
      wl(s - hw - 0.1, s + hw + 0.1, y0 - 0.1, yr, stoneLt, 0.05); wl(s - hw, s + hw, y0, yr, shopGlass, 0.09)
      for (let k = 0; k < 4; k++) { const t0 = Math.PI * k / 4, t1 = Math.PI * (k + 1) / 4
        q([P3(s + Math.cos(t0) * hw, 0.09, yr + Math.sin(t0) * hw * 0.8), P3(s + Math.cos(t1) * hw, 0.09, yr + Math.sin(t1) * hw * 0.8), P3(s, 0.09, yr), P3(s, 0.09, yr)], [nx, 0, nz], glass) }
    }
    // the door: pale surround, arched dark leaves with two roundels
    wl(dc - dw - 0.3, dc - dw, 0, spr, stoneLt, 0.1); wl(dc + dw, dc + dw + 0.3, 0, spr, stoneLt, 0.1)
    const arc = (r: number, v: number, c: Rgb, nrm: [number, number, number], r0 = 0): void => {
      for (let k = 0; k < K.ARCH_SEG; k++) {
        const t0 = Math.PI * k / K.ARCH_SEG, t1 = Math.PI * (k + 1) / K.ARCH_SEG
        q([P3(dc + Math.cos(t0) * r0, v, spr + Math.sin(t0) * r0), P3(dc + Math.cos(t0) * r, v, spr + Math.sin(t0) * r), P3(dc + Math.cos(t1) * r, v, spr + Math.sin(t1) * r), P3(dc + Math.cos(t1) * r0, v, spr + Math.sin(t1) * r0)], nrm, c)
      }
    }
    arc(dw + 0.3, 0.1, stoneLt, [nx, 0, nz], dw)
    wl(dc - dw, dc + dw, 0, spr, door, 0.06); arc(dw, 0.06, door, [nx, 0, nz])
    for (const sx of [-0.5, 0.5]) { // carved roundels, upper panels, lower panels
      const cx = dc + sx * dw * 0.95
      for (let k = 0; k < 8; k++) { const t0 = Math.PI * 2 * k / 8, t1 = Math.PI * 2 * (k + 1) / 8, r = 0.38; tri(P3(cx, 0.09, spr - 0.1), P3(cx + Math.cos(t0) * r, 0.09, spr - 0.1 + Math.sin(t0) * r), P3(cx + Math.cos(t1) * r, 0.09, spr - 0.1 + Math.sin(t1) * r), [nx, 0, nz], hex('#16223a')) }
      wl(cx - 0.4, cx + 0.4, 0.45, 1.5, hex('#243759'), 0.09)
    }
    wl(dc - 0.03, dc + 0.03, 0, spr + dw, hex('#0e1626'), 0.1) // meeting stile
    // mascaron keystone and two consoles carrying the balcony slab
    wl(dc - 0.22, dc + 0.22, fl0 - 0.2, fl0 + 0.45, stoneLt, 0.2); wl(dc - 0.12, dc + 0.12, fl0 - 0.05, fl0 + 0.35, gold, 0.24)
    for (const sx of [-1, 1]) {
      const cx = dc + sx * (dw + 0.55)
      wl(cx - 0.2, cx + 0.2, spr - 0.8, fl0 + 0.05, stoneLt, 0.28)
      wl(cx - 0.14, cx + 0.14, spr - 1.4, spr - 0.8, stoneLt, 0.2)
    }

    // upper floors on the door's axis: bays each side of it
    const bays: number[] = []
    for (let s = dc; s > 0.9; s -= K.BAY) bays.push(s)
    for (let s = dc + K.BAY; s < l - 0.9; s += K.BAY) bays.push(s)
    for (let f = 1; f < K.FLOORS.length; f++) {
      const y = fy[f], tall = f === 1
      wl(0, l, y - 0.1, y + 0.1, stoneLt, 0.07) // string course
      if (tall) { // scroll balcony over the door on its consoles: slab, rail, medallions
        const b0 = Math.max(0, dc - K.BALC_W / 2), b1 = Math.min(l, dc + K.BALC_W / 2), by = y + K.WIN_BOT
        sl(b0, b1, by, 0, K.SLAB_OUT, stoneDk); wl(b0, b1, by - 0.2, by, stoneLt, K.SLAB_OUT)
        wl(b0, b1, by, by + K.RAIL_H, iron, K.RAIL_OUT + 0.1); wl(b0, b1, by + K.RAIL_H - 0.08, by + K.RAIL_H, hex('#1d2f38'), K.RAIL_OUT + 0.12)
        for (let s = b0 + 0.2; s < b1 - 0.4; s += 0.6) wl(s, s + 0.35, by + 0.2, by + 0.6, hex('#1a2a33'), K.RAIL_OUT + 0.12)
      }
      for (const c of bays) {
        const top = y + K.WIN_TOP, bot = y + K.WIN_BOT, hw = K.WIN_W / 2, spr2 = top - hw * 0.9
        wl(c - hw - K.FRAME, c + hw + K.FRAME, bot, spr2, stoneLt, 0.04); wl(c - hw, c + hw, bot + 0.05, spr2, glass, 0.08)
        wl(c - 0.03, c + 0.03, bot + 0.05, top, hex('#c9c2ae'), 0.1) // casement mullion
        wl(c - hw, c + hw, bot + 1.0, bot + 1.06, hex('#c9c2ae'), 0.1) // transom
        for (let k = 0; k < K.ARCH_SEG; k++) { // arched head: surround ring then glass fan
          const t0 = Math.PI * k / K.ARCH_SEG, t1 = Math.PI * (k + 1) / K.ARCH_SEG, ro = hw + K.FRAME
          q([P3(c + Math.cos(t0) * hw, 0.04, spr2 + Math.sin(t0) * hw * 0.9), P3(c + Math.cos(t0) * ro, 0.04, spr2 + Math.sin(t0) * ro * 0.9), P3(c + Math.cos(t1) * ro, 0.04, spr2 + Math.sin(t1) * ro * 0.9), P3(c + Math.cos(t1) * hw, 0.04, spr2 + Math.sin(t1) * hw * 0.9)], [nx, 0, nz], stoneLt)
          tri(P3(c, 0.08, spr2), P3(c + Math.cos(t0) * hw, 0.08, spr2 + Math.sin(t0) * hw * 0.9), P3(c + Math.cos(t1) * hw, 0.08, spr2 + Math.sin(t1) * hw * 0.9), [nx, 0, nz], glass)
        }
        if (!(tall && Math.abs(c - dc) < K.BALC_W / 2)) wl(c - hw - 0.1, c + hw + 0.1, bot, bot + K.RAIL_H * 0.7, iron, 0.22) // small iron rail
      }
    }
    for (const c of bays) { // dormers on the mansard
      const dv = -K.INSET * k2 * 0.5, y0 = eave + 0.55, y1 = y0 + K.DORMER_H, hd = K.DORMER_W / 2
      q([P3(c - hd - 0.12, dv + 0.02, y0), P3(c + hd + 0.12, dv + 0.02, y0), P3(c + hd + 0.12, dv + 0.02, y1), P3(c - hd - 0.12, dv + 0.02, y1)], [nx, 0, nz], stoneLt)
      q([P3(c - hd, dv + 0.05, y0 + 0.1), P3(c + hd, dv + 0.05, y0 + 0.1), P3(c + hd, dv + 0.05, y1 - 0.1), P3(c - hd, dv + 0.05, y1 - 0.1)], [nx, 0, nz], glass)
      tri(P3(c - hd - 0.18, dv + 0.03, y1), P3(c + hd + 0.18, dv + 0.03, y1), P3(c, dv + 0.03, y1 + 0.5), [nx, 0, nz], stoneLt)
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
