/**
 * 3 place Franz-Liszt / 108 rue La Fayette, Paris 10e, OSM way/63201688 (listed MH PA75100003, Achille Leclere; 235 m2, ~21 m, 6 levels).
 * Street faces (from the pbf: rue La Fayette runs along the north side, the place Franz-Liszt road to the north-east) are the edges whose outward
 * normal's local z is below STREET_NZ (the entry's `front` = the bearing of their bisector); the run of such edges splits into one facade per
 * straight chord, meeting at the street corner. The south edges are party walls with 7 place Franz-Liszt. From the Commons photo: warm limestone
 * ashlar, rusticated quoins at the corner, tall shopfront with a big arched window and a glazed door, shop signs, a mezzanine of small shuttered
 * windows under a frieze, a continuous iron balcony over it with pedimented windows, small rails on the next floor, a second continuous
 * balcony at the top floor, cream louvred shutters throughout, cornice, slate mansard with roof lights, stone chimney stacks.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const LISZT3 = {
  FLOORS: [4.0, 2.3, 3.3, 3.1, 3.0], // ground shop, mezzanine, balcony floor, rail floor, top balcony floor: relative heights
  CORNICE: 0.55, MANSARD: 4.2, INSET: 2.2, EAVE_FRAC: 0.78,
  STREET_NZ: -0.6, // an edge is street front when its outward normal's local z is below this
  SPLIT: 0.2, // radians of turn that start a new facade chord
  BAY: 2.7, MARGIN: 1.0, WIN_W: 1.0, FRAME: 0.13, LINTEL: 0.28,
  SHUT_W: 0.46, SHUT_OUT: 0.08, // louvred shutters either side of each window
  WIN_BOT: 0.12, WIN_TOP: [0, 1.75, 2.55, 2.45, 2.35], // window head above each floor level
  MEZZ_BOT: 0.35, // mezzanine sill
  RAIL_H: 0.95, RAIL_OUT: 0.5, SLAB_T: 0.16, BAR_GAP: 0.28, SMALL_RAIL_OUT: 0.2, SMALL_RAIL_H: 0.8,
  BALCONY_FLOORS: [2, 4], // floor indices whose base carries the continuous balcony
  BAND_OUT: 0.08, QUOIN_W: 0.55, QUOIN_OUT: 0.07, QUOIN_COURSE: 0.55,
  SHOP_FASCIA: 0.9, PIER: 0.55, ARCH_BAY_FROM_CORNER: 1, ARCH_SEG: 8, DOOR_BAY: 0, // the arch bay counts from the corner end on the first chord; the glazed door is bay 0 of that chord
  SKY_W: 0.9, SKY_F0: 0.3, SKY_F1: 0.78, SKY_EVERY: 1,
  CHIMNEY: 0.85, CHIMNEY_H: 2.6,
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

export const liszt3 = (out: MeshBuilder, fit: Fit): void => {
  const K = LISZT3, H = fit.height
  const stone = hex('#d9caa8'), stoneLt = hex('#e6dcc2'), stoneDk = hex('#b9a982'), party = hex('#b8ac94'), glass = hex('#62788a'), shopGlass = hex('#2f3a44')
  const iron = hex('#1d2124'), slate = hex('#4f5560'), slateLt = hex('#5d6470'), roofFlat = hex('#6c7176'), shutter = hex('#f6f3ea'), shutterDk = hex('#8a8574'), sign = hex('#16181c'), signLt = hex('#e8e4d4'), sky = hex('#9cb4c6'), quoin = hex('#cdbd98')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw // outward normal of a->b is (dz,-dx)
  const n = ring.length
  const sumW = K.FLOORS.reduce((s, v) => s + v, 0)
  const fh = K.FLOORS.map((w) => w * (H * K.EAVE_FRAC - K.CORNICE) / sumW)
  const fy = fh.reduce<number[]>((acc, h) => (acc.push(acc[acc.length - 1] + h), acc), [0]) // floor levels
  const eave = fy[fy.length - 1] + K.CORNICE, ridge = eave + K.MANSARD, fl0 = fh[0]
  const q = (pts: V3[], nrm: V3, c: Rgb): void => out.quad(pts, nrm, UV, c, 0)
  const tri = (a: V3, b: V3, c2: V3, nrm: V3, c: Rgb): void => out.quad([a, b, c2, a], nrm, UV, c, 0)
  const nrmOf = (a: P, b: P): P => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l] }
  const elen = (i: number): number => Math.hypot(ring[(i + 1) % n][0] - ring[i][0], ring[(i + 1) % n][1] - ring[i][1])
  const faces = (i: number): boolean => elen(i) > 1.2 && nrmOf(ring[i], ring[(i + 1) % n])[1] < K.STREET_NZ
  // the longest run of consecutive street edges, split into straight chords at real turns
  let run: number[] = []
  for (let i = 0; i < n; i++) {
    if (!faces(i) || faces((i + n - 1) % n)) continue
    const r = [i]; while (faces((r[r.length - 1] + 1) % n) && r.length < n) r.push((r[r.length - 1] + 1) % n)
    if (r.length > run.length || (r.length === run.length && r.reduce((m, e) => m + elen(e), 0) > run.reduce((m, e) => m + elen(e), 0))) run = r
  }
  const chords: { i0: number; i1: number }[] = [] // ring vertex indices of each chord's ends
  if (run.length) {
    let start = run[0]
    for (let k = 1; k < run.length; k++) {
      const e0 = run[k - 1], e1 = run[k], d0 = Math.atan2(ring[(e0 + 1) % n][1] - ring[e0][1], ring[(e0 + 1) % n][0] - ring[e0][0]), d1 = Math.atan2(ring[(e1 + 1) % n][1] - ring[e1][1], ring[(e1 + 1) % n][0] - ring[e1][0])
      let d = Math.abs(d1 - d0); if (d > Math.PI) d = 2 * Math.PI - d
      if (d > K.SPLIT) { chords.push({ i0: start, i1: e1 }); start = e1 }
    }
    chords.push({ i0: start, i1: (run[run.length - 1] + 1) % n })
  }
  const inChord = new Set<number>() // vertices strictly inside a chord
  for (const c of chords) for (let v = (c.i0 + 1) % n; v !== c.i1; v = (v + 1) % n) inChord.add(v)
  const edgeInRun = new Set(run)

  // inset vertices of the mansard: shared corners mitre, chord ends move in along their own normal
  const insetOf = (v: number): P => {
    const p = ring[v], ca = chords.find((c) => c.i1 === v), cb = chords.find((c) => c.i0 === v)
    const nA = ca ? nrmOf(ring[ca.i0], p) : null, nB = cb ? nrmOf(p, ring[cb.i1]) : null
    if (nA && nB) { let mx = nA[0] + nB[0], mz = nA[1] + nB[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml; const k = Math.min(3, 1 / Math.max(0.35, mx * nA[0] + mz * nA[1])); return [p[0] - mx * K.INSET * k, p[1] - mz * K.INSET * k] }
    const nn = (nA ?? nB) as P
    return [p[0] - nn[0] * K.INSET, p[1] - nn[1] * K.INSET]
  }

  // party walls and side returns: plain, to the roof line
  for (let i = 0; i < n; i++) {
    if (edgeInRun.has(i)) continue
    const a = ring[i], b = ring[(i + 1) % n], l = elen(i)
    if (l < 0.05) continue
    const [nx, nz] = nrmOf(a, b)
    q([[a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], ridge, b[1]], [a[0], ridge, a[1]]], [nx, 0, nz], party)
  }

  chords.forEach((ch, ci) => {
    const a = ring[ch.i0], b = ring[ch.i1], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    const [nx, nz] = nrmOf(a, b), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l
    const P3 = (s: number, v: number, y: number): V3 => [a[0] + ux * s + nx * v, y, a[1] + uz * s + nz * v]
    const wl = (s0: number, s1: number, y0: number, y1: number, c: Rgb, v = 0): void => { if (y1 - y0 > 0.005 && s1 > s0) q([P3(s0, v, y0), P3(s1, v, y0), P3(s1, v, y1), P3(s0, v, y1)], [nx, 0, nz], c) }
    const sl = (s0: number, s1: number, y: number, v0: number, v1: number, c: Rgb): void => q([P3(s0, v0, y), P3(s1, v0, y), P3(s1, v1, y), P3(s0, v1, y)], [0, 1, 0], c)
    const cornerAtEnd = chords.some((o) => o.i0 === ch.i1) // shared corner at the chord's end
    const cornerAtStart = chords.some((o) => o.i1 === ch.i0)

    wl(0, l, 0, eave, stone)
    wl(0, l, eave - K.CORNICE, eave, stoneLt, 0.28); sl(0, l, eave, 0, 0.28, stoneLt)
    wl(0, l, eave - K.CORNICE - 0.35, eave - K.CORNICE, stoneDk, 0.06) // carved frieze under the cornice
    // string courses with a ledge over the shops and at each balcony floor
    wl(0, l, fl0 - 0.3, fl0 + 0.12, stoneLt, 0.12); sl(0, l, fl0 + 0.12, 0, 0.12, stoneLt)
    wl(0, l, fl0 - 0.05, fl0 + 0.05, stoneDk, 0.16)

    // mansard, closed against the party walls
    const A2 = insetOf(ch.i0), B2 = insetOf(ch.i1), rise = ridge - eave, k1 = 0.78, k2 = 0.52
    const mA: P = [a[0] + (A2[0] - a[0]) * k2, a[1] + (A2[1] - a[1]) * k2], mB: P = [b[0] + (B2[0] - b[0]) * k2, b[1] + (B2[1] - b[1]) * k2], ym = eave + rise * k1
    q([[a[0], eave, a[1]], [b[0], eave, b[1]], [mB[0], ym, mB[1]], [mA[0], ym, mA[1]]], [nx, 0.4, nz], slate)
    q([[mA[0], ym, mA[1]], [mB[0], ym, mB[1]], [B2[0], ridge, B2[1]], [A2[0], ridge, A2[1]]], [0, 1, 0], slateLt)
    if (!cornerAtStart) tri([a[0], eave, a[1]], [a[0], ridge, a[1]], [A2[0], ridge, A2[1]], [-ux, 0, -uz], slate)
    if (!cornerAtEnd) tri([b[0], eave, b[1]], [B2[0], ridge, B2[1]], [b[0], ridge, b[1]], [ux, 0, uz], slate)
    wl(0, l, ridge, ridge + 0.4, iron, -K.INSET * 0.9)

    const nb = Math.max(1, Math.round((l - 2 * K.MARGIN) / K.BAY)), bw = (l - 2 * K.MARGIN) / nb
    const bc = (w: number): number => K.MARGIN + (w + 0.5) * bw // bay centres
    // rusticated quoins on the corner side(s)
    const quoins = (atEnd: boolean): void => {
      for (let y = 0.6, k = 0; y < eave - K.CORNICE - 0.4; y += K.QUOIN_COURSE, k++) {
        const w = K.QUOIN_W * (k % 2 ? 1 : 0.65), s0 = atEnd ? l - w : 0, s1 = atEnd ? l : w
        wl(s0, s1, y, y + K.QUOIN_COURSE - 0.06, quoin, K.QUOIN_OUT)
      }
    }
    if (cornerAtEnd) quoins(true)
    if (cornerAtStart) quoins(false)

    // ground floor: shopfronts between stone piers, dark signs, an arched window and a glazed door on the first chord
    wl(0, l, 0, fl0 - 0.3, stoneDk, K.BAND_OUT)
    for (let w = 0; w < nb; w++) {
      const c = bc(w), hw = bw / 2 - K.PIER / 2
      const fromCorner = cornerAtEnd ? nb - 1 - w : w
      const arch = ci === 0 && fromCorner === K.ARCH_BAY_FROM_CORNER && cornerAtEnd
      const isDoor = ci === 0 && ((cornerAtEnd && w === 0) || (!cornerAtEnd && w === K.DOOR_BAY)) && !arch
      if (arch) {
        const r = hw, spr = fl0 - 0.5 - r * 0.7
        wl(c - hw, c + hw, 0.85, spr, shopGlass, K.BAND_OUT + 0.04)
        wl(c - hw, c + hw, 0, 0.85, stoneDk, K.BAND_OUT + 0.06)
        for (let k = 0; k < K.ARCH_SEG; k++) {
          const t0 = Math.PI * k / K.ARCH_SEG, t1 = Math.PI * (k + 1) / K.ARCH_SEG
          q([P3(c + Math.cos(t0) * r, K.BAND_OUT + 0.04, spr + Math.sin(t0) * r * 0.7), P3(c + Math.cos(t1) * r, K.BAND_OUT + 0.04, spr + Math.sin(t1) * r * 0.7), P3(c, K.BAND_OUT + 0.04, spr), P3(c, K.BAND_OUT + 0.04, spr)], [nx, 0, nz], iron)
          q([P3(c + Math.cos(t0) * (r + 0.2), K.BAND_OUT + 0.02, spr + Math.sin(t0) * (r + 0.2) * 0.7), P3(c + Math.cos(t1) * (r + 0.2), K.BAND_OUT + 0.02, spr + Math.sin(t1) * (r + 0.2) * 0.7), P3(c + Math.cos(t1) * r, K.BAND_OUT + 0.03, spr + Math.sin(t1) * r * 0.7), P3(c + Math.cos(t0) * r, K.BAND_OUT + 0.03, spr + Math.sin(t0) * r * 0.7)], [nx, 0, nz], stoneLt)
        }
        wl(c - hw - 0.2, c - hw, 0.6, spr, stoneLt, K.BAND_OUT + 0.03); wl(c + hw, c + hw + 0.2, 0.6, spr, stoneLt, K.BAND_OUT + 0.03)
        wl(c - hw * 0.8, c + hw * 0.8, 1.7, 3.0, signLt, K.BAND_OUT + 0.06) // window-vinyl panel
        wl(c - hw * 0.8, c + hw * 0.8, 1.9, 2.05, sign, K.BAND_OUT + 0.07)
        continue
      }
      wl(c - hw, c + hw, isDoor ? 0.1 : 0.35, fl0 - K.SHOP_FASCIA - 0.25, isDoor ? glass : shopGlass, K.BAND_OUT + 0.04)
      if (isDoor) { wl(c - 0.03, c + 0.03, 0.1, fl0 - K.SHOP_FASCIA - 0.25, iron, K.BAND_OUT + 0.07); wl(c - hw, c + hw, fl0 - K.SHOP_FASCIA - 0.35, fl0 - K.SHOP_FASCIA - 0.25, iron, K.BAND_OUT + 0.07) }
      else wl(c - hw, c + hw, 0, 0.35, stoneDk, K.BAND_OUT + 0.06)
      wl(c - hw, c + hw, fl0 - K.SHOP_FASCIA - 0.25, fl0 - 0.3, sign, K.BAND_OUT + 0.07) // fascia board
      if (!isDoor) wl(c - hw * 0.75, c + hw * 0.75, fl0 - K.SHOP_FASCIA - 0.05, fl0 - 0.5, signLt, K.BAND_OUT + 0.08) // lettering strip
    }

    // upper floors
    for (let f = 1; f < fh.length; f++) {
      const y = fy[f], top = fy[f + 1] ?? eave - K.CORNICE
      if (f > 1) { wl(0, l, y - 0.06, y + 0.06, stoneLt, 0.06); sl(0, l, y + 0.06, 0, 0.06, stoneLt) } // string course between floors
      const bal = K.BALCONY_FLOORS.includes(f)
      if (bal) { // continuous balcony slab on corbels with an iron rail
        sl(0, l, y + 0.01, 0, K.RAIL_OUT, stoneDk)
        wl(0, l, y - K.SLAB_T, y + 0.01, stoneLt, K.RAIL_OUT)
        const vr = K.RAIL_OUT - 0.03 // open balustrade: a low band, a top rail and thin bars
        wl(0, l, y + 0.02, y + 0.2, iron, vr); wl(0, l, y + K.RAIL_H - 0.07, y + K.RAIL_H, iron, vr)
        for (let s = 0.15; s < l - 0.1; s += K.BAR_GAP) wl(s, s + 0.04, y + 0.2, y + K.RAIL_H - 0.07, iron, vr)
        for (let w = 0; w <= nb; w++) { const s = K.MARGIN + w * bw; wl(s - 0.28, s + 0.28, y - K.SLAB_T - 0.3, y - K.SLAB_T, stoneLt, K.RAIL_OUT * 0.7) } // corbels
      }
      for (let w = 0; w < nb; w++) {
        const c = bc(w)
        const bot = f === 1 ? K.MEZZ_BOT : K.WIN_BOT, hd = f === 1 ? K.MEZZ_BOT + K.WIN_TOP[1] - 0.2 : K.WIN_TOP[f]
        const hw = K.WIN_W / 2
        wl(c - hw - K.FRAME, c + hw + K.FRAME, y + bot - 0.04, y + hd + K.LINTEL, stoneLt, 0.04) // surround
        wl(c - hw, c + hw, y + bot, y + hd, glass, 0.07)
        wl(c - 0.025, c + 0.025, y + bot, y + hd, iron, 0.09) // mullion
        wl(c - hw, c + hw, y + (bot + hd) * 0.5 - 0.025 + 0.35, y + (bot + hd) * 0.5 + 0.025 + 0.35, iron, 0.09) // transom
        for (const sg of [-1, 1]) { // louvred shutters folded back against the wall
          const s0 = sg < 0 ? c - hw - K.FRAME - K.SHUT_W : c + hw + K.FRAME, s1 = s0 + K.SHUT_W
          wl(s0 - 0.03, s1 + 0.03, y + bot - 0.02, y + hd + 0.02, shutterDk, K.SHUT_OUT - 0.015) // shadow edge behind the leaf
          wl(s0, s1, y + bot, y + hd, shutter, K.SHUT_OUT + 0.02)
          for (let ly = y + bot + 0.2; ly < y + hd - 0.1; ly += 0.24) wl(s0 + 0.03, s1 - 0.03, ly, ly + 0.025, shutterDk, K.SHUT_OUT + 0.03) // louvre lines
        }
        if (f === 2) { // pedimented windows over the mezzanine
          tri(P3(c - hw - 0.3, 0.06, y + hd + K.LINTEL), P3(c + hw + 0.3, 0.06, y + hd + K.LINTEL), P3(c, 0.1, y + hd + K.LINTEL + 0.5), [nx, 0, nz], stoneLt)
          wl(c - hw - 0.3, c + hw + 0.3, y + hd + K.LINTEL - 0.06, y + hd + K.LINTEL, stoneDk, 0.08)
        } else if (f === 1) { // small rail under each mezzanine window
          wl(c - hw - 0.1, c + hw + 0.1, y + bot, y + bot + 0.7, iron, K.SMALL_RAIL_OUT * 0.6)
          sl(c - hw - 0.1, c + hw + 0.1, y + bot, 0, K.SMALL_RAIL_OUT * 0.6, stoneDk)
        } else if (!bal) { // small balcony rail with its slab
          wl(c - hw - 0.15, c + hw + 0.15, y + bot, y + bot + K.SMALL_RAIL_H, iron, K.SMALL_RAIL_OUT)
          sl(c - hw - 0.15, c + hw + 0.15, y + bot, 0, K.SMALL_RAIL_OUT, stoneDk)
        }
        if (f === fh.length - 1 && w % K.SKY_EVERY === 0) { // a roof light on the lower mansard slope
          const f0 = K.SKY_F0, f1 = K.SKY_F1, pt = (s: number, f2: number): V3 => P3(s, -K.INSET * k2 * f2 + 0.04, eave + rise * k1 * f2)
          q([pt(c - K.SKY_W / 2, f0), pt(c + K.SKY_W / 2, f0), pt(c + K.SKY_W / 2, f1), pt(c - K.SKY_W / 2, f1)], [nx * 0.7, 0.7, nz * 0.7], sky)
        }
      }
      void top
    }
  })

  // flat roof: ear-clipped inset ring (chord interiors dropped, chord ends inset)
  const poly: P[] = []
  for (let v = 0; v < n; v++) {
    if (inChord.has(v)) continue
    poly.push(chords.some((c) => c.i0 === v || c.i1 === v) ? insetOf(v) : ring[v])
  }
  const idx = poly.map((_, i) => i), cross = (a: P, b: P, c: P): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  let guard = 0
  const T = (a: P, b: P, c: P): void => q([[c[0], ridge, c[1]], [b[0], ridge, b[1]], [a[0], ridge, a[1]], [c[0], ridge, c[1]]], [0, 1, 0], roofFlat)
  while (idx.length > 3 && guard++ < 400) {
    let cut = false
    for (let i = 0; i < idx.length && !cut; i++) {
      const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length], a = poly[ia], b = poly[ib], c = poly[ic]
      if (cross(a, b, c) <= 1e-9) continue
      if (idx.some((k) => k !== ia && k !== ib && k !== ic && cross(a, b, poly[k]) >= 0 && cross(b, c, poly[k]) >= 0 && cross(c, a, poly[k]) >= 0)) continue
      T(a, b, c); idx.splice(i, 1); cut = true
    }
    if (!cut) break
  }
  if (idx.length === 3) T(poly[idx[0]], poly[idx[1]], poly[idx[2]])

  // two stone chimney stacks standing out of the roof, set back from the street corner
  const mid: P = [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length]
  const stack = (cx: number, cz: number): void => {
    const h = K.CHIMNEY / 2, y1 = ridge + K.CHIMNEY_H
    const f = (x0: number, z0: number, x1: number, z1: number, nn: V3): void => q([[x0, ridge, z0], [x1, ridge, z1], [x1, y1, z1], [x0, y1, z0]], nn, stoneLt)
    f(cx - h, cz - h, cx + h, cz - h, [0, 0, -1]); f(cx + h, cz - h, cx + h, cz + h, [1, 0, 0]); f(cx + h, cz + h, cx - h, cz + h, [0, 0, 1]); f(cx - h, cz + h, cx - h, cz - h, [-1, 0, 0])
    q([[cx - h - 0.08, y1, cz - h - 0.08], [cx + h + 0.08, y1, cz - h - 0.08], [cx + h + 0.08, y1, cz + h + 0.08], [cx - h - 0.08, y1, cz + h + 0.08]], [0, 1, 0], stoneDk)
  }
  const sd: P = [0, 0]
  void sd
  stack(mid[0] + 1.5, mid[1] + 0.5); stack(mid[0] - 2.2, mid[1] - 0.8)
}
