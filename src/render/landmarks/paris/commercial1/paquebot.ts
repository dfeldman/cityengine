/**
 * Le Paquebot, 3 boulevard Victor, Paris 15e, OSM way/53557914 (listed MH PA00086654, Pierre Patout 1935, Art Deco, ~24 m): the long narrow wedge
 * shaped like an ocean liner. From the Commons photo and the IGN lidar MNS (flat decks near 25 m, the street run at 21 to 25 m): a dark rough-cast
 * stone base, cream floors where a projecting white balcony slab with a low parapet runs the whole street front at every storey and a ribbon of
 * dark windows sits between the slabs (the decks), the top storeys stepping back in cream blocks that fall away from the prow end, and the prow:
 * a taller square block at the street run's west end with a round porthole window. The entrance (second photo) is a black iron-barred glass door
 * between two round cream columns on dark rough-cast stems. The street edge is the longest edge whose outward normal faces local -z (the entry's
 * `front` is that facade's bearing from the pbf's Boulevard Victor); the other edges are plain ribbon-windowed walls. Structure adapted from hennebique.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const PAQUEBOT = {
  GROUND: 4.0, FLOORS: 5, ATTIC: 3.6, // base height, storeys above it, height of the tallest stepped block, metres
  STREET_NZ: -0.8, MIN_WALL: 3,
  SLAB_OUT: 0.95, SLAB_T: 0.3, PARAPET: 0.95, BAND_OUT: 0.06, // the balcony deck on each storey
  WIN_BOT: 0.15, WIN_TOP: 2.3, MULLION: 3.1, MARGIN: 0.6,
  STEP_SET: 1.2, STEP_DEPTH: 3.0, STEP_H: [1, 0.95, 0.85, 0.75, 0.62, 0.5, 0.4, 0.3], // stepped upper blocks: setback, depth, heights as fractions of ATTIC from the prow end
  TOWER_LEN: 9, TOWER_DEPTH: 4.2, TOWER_UP: 1.4, PORTHOLE_R: 1.5, PORTHOLE_SEG: 14, PORTHOLE_Y: 0.55, // the prow block (fraction of its height)
  DOOR_AT: 0.5, DOOR_W: 2.4, DOOR_H: 3.2, COL_R: 0.5, COL_SEG: 8, BARS: 6, STEM_H: 1.7,
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

export const paquebot = (out: MeshBuilder, fit: Fit): void => {
  const K = PAQUEBOT, H = fit.height
  const cream = hex('#e2d9c6'), white = hex('#f1ede3'), base = hex('#6d6965'), glass = hex('#3d4b58'), iron = hex('#1d1f21'), roofFlat = hex('#7a7f82'), shade = hex('#cbc1ac')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw // outward normal of a->b is (dz,-dx)
  const n = ring.length
  const FLOOR = (H - K.GROUND - K.ATTIC) / K.FLOORS
  const fl0 = K.GROUND, body = fl0 + K.FLOORS * FLOOR
  const q = (pts: V3[], nrm: V3, c: Rgb): void => out.quad(pts, nrm, UV, c, 0)
  const tri = (a: V3, b: V3, c2: V3, nrm: V3, c: Rgb): void => out.quad([a, b, c2, a], nrm, UV, c, 0)
  const nrmOf = (a: P, b: P): P => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l] }
  const wall = (a: P, b: P, y0: number, y1: number, c: Rgb, off = 0): void => {
    if (y1 - y0 < 0.01) return
    const [nx, nz] = nrmOf(a, b)
    q([[a[0] + nx * off, y0, a[1] + nz * off], [b[0] + nx * off, y0, b[1] + nz * off], [b[0] + nx * off, y1, b[1] + nz * off], [a[0] + nx * off, y1, a[1] + nz * off]], [nx, 0, nz], c)
  }
  const strip = (a: P, b: P, y: number, o0: number, o1: number, c: Rgb, up = true): void => {
    const [nx, nz] = nrmOf(a, b)
    const pts: V3[] = [[a[0] + nx * o0, y, a[1] + nz * o0], [b[0] + nx * o0, y, b[1] + nz * o0], [b[0] + nx * o1, y, b[1] + nz * o1], [a[0] + nx * o1, y, a[1] + nz * o1]]
    q(up ? pts : [pts[3], pts[2], pts[1], pts[0]], [0, up ? 1 : -1, 0], c)
  }
  const at = (a: P, u: P, s: number, v: number): P => { const [nx, nz] = nrmOf(a, [a[0] + u[0], a[1] + u[1]]); return [a[0] + u[0] * s + nx * v, a[1] + u[1] * s + nz * v] }

  // the street edge: the longest edge facing local -z
  let si = -1, sl = 0
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]), nm = nrmOf(a, b)
    if (nm[1] < K.STREET_NZ && l > sl) { sl = l; si = i }
  }
  // the prow end: the street edge's end nearer the ring vertex farthest from its middle
  let sa: P = [0, 0], sb: P = [0, 0]
  if (si >= 0) {
    sa = ring[si]; sb = ring[(si + 1) % n]
    const mx = (sa[0] + sb[0]) / 2, mz = (sa[1] + sb[1]) / 2
    let far = ring[0]; for (const p of ring) if (Math.hypot(p[0] - mx, p[1] - mz) > Math.hypot(far[0] - mx, far[1] - mz)) far = p
    if (Math.hypot(sb[0] - far[0], sb[1] - far[1]) < Math.hypot(sa[0] - far[0], sa[1] - far[1])) { const t = sa; sa = sb; sb = t } // sa = prow end
  }
  const sLen = si >= 0 ? sl : 0
  const su: P = si >= 0 ? [(sb[0] - sa[0]) / sLen, (sb[1] - sa[1]) / sLen] : [1, 0] // from the prow along the street run
  const sn = si >= 0 ? nrmOf(sa, sb) : [0, -1] // outward normal of the street run, whichever way the ring runs
  const sAt = (s: number, v: number): P => [sa[0] + su[0] * s + sn[0] * v, sa[1] + su[1] * s + sn[1] * v]
  const S3 = (s: number, v: number, y: number): V3 => { const p = sAt(s, v); return [p[0], y, p[1]] }

  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 0.3) continue
    const [nx, nz] = nrmOf(a, b), ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l, u: P = [ux, uz]
    const street = nz < K.STREET_NZ && l > K.MIN_WALL
    wall(a, b, 0, body, cream)
    wall(a, b, 0, fl0, base, street ? 0.04 : 0.02) // dark rough-cast base
    if (l < K.MIN_WALL) continue
    const P3 = (s: number, v: number, y: number): V3 => { const p = at(a, u, s, v); return [p[0], y, p[1]] }
    const m0 = K.MARGIN, m1 = l - K.MARGIN
    for (let f = 0; f < K.FLOORS; f++) {
      const y = fl0 + f * FLOOR
      // ribbon of windows between the decks, broken by cream mullions
      q([P3(m0, K.BAND_OUT, y + K.WIN_BOT), P3(m1, K.BAND_OUT, y + K.WIN_BOT), P3(m1, K.BAND_OUT, y + K.WIN_TOP), P3(m0, K.BAND_OUT, y + K.WIN_TOP)], [nx, 0, nz], glass)
      const nm = Math.floor((m1 - m0) / K.MULLION)
      for (let k = 1; k <= nm; k++) { const s = m0 + k * (m1 - m0) / (nm + 1); wall(at(a, u, s - 0.07, 0), at(a, u, s + 0.07, 0), y + K.WIN_BOT, y + K.WIN_TOP, cream, K.BAND_OUT + 0.02) }
      if (!street) continue
      // the deck: white slab, edge face, parapet with a dark rail line, all along the street run
      strip(at(a, u, 0, 0), at(a, u, l, 0), y, 0, K.SLAB_OUT, white)
      wall(at(a, u, 0, 0), at(a, u, l, 0), y - K.SLAB_T, y, white, K.SLAB_OUT)
      strip(at(a, u, 0, 0), at(a, u, l, 0), y - K.SLAB_T, 0, K.SLAB_OUT, shade, false)
      wall(at(a, u, 0, 0), at(a, u, l, 0), y, y + K.PARAPET, white, K.SLAB_OUT)
      strip(at(a, u, 0, 0), at(a, u, l, 0), y + K.PARAPET, K.SLAB_OUT - 0.12, K.SLAB_OUT, white)
      wall(at(a, u, 0, 0), at(a, u, l, 0), y + 0.45, y + 0.52, iron, K.SLAB_OUT + 0.01)
    }
    if (street) {
      // ground storey: dark slit windows and the iron door between round columns
      const dc = l * K.DOOR_AT
      for (let k = 0; k < Math.floor(l / 6); k++) {
        const c = 3 + k * 6; if (Math.abs(c - dc) < 3) continue
        wall(at(a, u, c - 0.9, 0), at(a, u, c + 0.9, 0), 1.2, 2.6, glass, 0.08)
      }
      const hd = K.DOOR_W / 2
      wall(at(a, u, dc - hd, 0), at(a, u, dc + hd, 0), 0, K.DOOR_H, glass, 0.1)
      for (let k = 0; k <= K.BARS; k++) { const s = dc - hd + (K.DOOR_W * k) / K.BARS; wall(at(a, u, s - 0.04, 0), at(a, u, s + 0.04, 0), 0, K.DOOR_H, iron, 0.14) }
      for (const y of [1.1, 2.2]) wall(at(a, u, dc - hd, 0), at(a, u, dc + hd, 0), y, y + 0.06, iron, 0.14)
      wall(at(a, u, dc - hd - 1.4, 0), at(a, u, dc + hd + 1.4, 0), K.DOOR_H, K.DOOR_H + 0.25, white, 0.2) // lintel
      for (const sg of [-1, 1]) { // round columns: dark rough-cast stem, cream shaft
        const c0 = at(a, u, dc + sg * (hd + 0.7), 0.45 + K.COL_R * 0.4)
        for (let k = 0; k < K.COL_SEG; k++) {
          const t0 = (2 * Math.PI * k) / K.COL_SEG, t1 = (2 * Math.PI * (k + 1)) / K.COL_SEG, tm = (t0 + t1) / 2
          const nmx = nx * Math.cos(tm) + ux * Math.sin(tm), nmz = nz * Math.cos(tm) + uz * Math.sin(tm)
          const pp = (t: number, y: number): V3 => [c0[0] + K.COL_R * (nx * Math.cos(t) + ux * Math.sin(t)), y, c0[1] + K.COL_R * (nz * Math.cos(t) + uz * Math.sin(t))]
          if (nmx * nx + nmz * nz < -0.3) continue
          q([pp(t0, 0), pp(t1, 0), pp(t1, K.STEM_H), pp(t0, K.STEM_H)], [nmx, 0, nmz], base)
          q([pp(t0, K.STEM_H), pp(t1, K.STEM_H), pp(t1, K.DOOR_H + 0.25), pp(t0, K.DOOR_H + 0.25)], [nmx, 0, nmz], white)
        }
      }
    }
  }

  // the stepped upper blocks along the street run, falling away from the prow end
  if (si >= 0) {
    const nb = K.STEP_H.length, bl = (sLen - K.TOWER_LEN) / nb
    const box = (s0: number, s1: number, v0: number, v1: number, h: number, c: Rgb): void => {
      const y1 = body + h
      q([S3(s0, v0, body), S3(s1, v0, body), S3(s1, v0, y1), S3(s0, v0, y1)], [sn[0], 0, sn[1]], c)
      q([S3(s1, v1, body), S3(s0, v1, body), S3(s0, v1, y1), S3(s1, v1, y1)], [-sn[0], 0, -sn[1]], c)
      q([S3(s0, v1, body), S3(s0, v0, body), S3(s0, v0, y1), S3(s0, v1, y1)], [-su[0], 0, -su[1]], shade)
      q([S3(s1, v0, body), S3(s1, v1, body), S3(s1, v1, y1), S3(s1, v0, y1)], [su[0], 0, su[1]], shade)
      q([S3(s0, v0, y1), S3(s1, v0, y1), S3(s1, v1, y1), S3(s0, v1, y1)], [0, 1, 0], roofFlat)
    }
    for (let k = 0; k < nb; k++) {
      const s0 = K.TOWER_LEN + k * bl, s1 = s0 + bl - 0.15, h = K.ATTIC * K.STEP_H[k]
      box(s0, s1, -K.STEP_SET, -K.STEP_SET - K.STEP_DEPTH, h, cream)
      q([S3(s0 + 0.5, -K.STEP_SET + 0.04, body + 0.5), S3(s1 - 0.5, -K.STEP_SET + 0.04, body + 0.5), S3(s1 - 0.5, -K.STEP_SET + 0.04, body + h - 0.4), S3(s0 + 0.5, -K.STEP_SET + 0.04, body + h - 0.4)], [sn[0], 0, sn[1]], glass)
    }
    // the prow block with its porthole
    const th = K.ATTIC + K.TOWER_UP
    box(0, K.TOWER_LEN, 0, -K.TOWER_DEPTH, th, cream)
    const pc = S3(K.TOWER_LEN / 2, 0.06, body + th * K.PORTHOLE_Y), R = K.PORTHOLE_R
    const pt = (r: number, k: number): V3 => [pc[0] + su[0] * r * Math.cos((2 * Math.PI * k) / K.PORTHOLE_SEG), pc[1] + r * Math.sin((2 * Math.PI * k) / K.PORTHOLE_SEG), pc[2] + su[1] * r * Math.cos((2 * Math.PI * k) / K.PORTHOLE_SEG)]
    for (let k = 0; k < K.PORTHOLE_SEG; k++) {
      tri(pc, pt(R * 0.8, k), pt(R * 0.8, k + 1), [sn[0], 0, sn[1]], glass)
      q([pt(R * 0.8, k), pt(R, k), pt(R, k + 1), pt(R * 0.8, k + 1)], [sn[0], 0, sn[1]], iron)
    }
  }

  // flat roof: ear-clipped ring at the body top
  const idx = ring.map((_, i) => i), cross = (a: P, b: P, c: P): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  let guard = 0
  const T = (a: P, b: P, c: P): void => q([[c[0], body, c[1]], [b[0], body, b[1]], [a[0], body, a[1]], [c[0], body, c[1]]], [0, 1, 0], roofFlat)
  while (idx.length > 3 && guard++ < 400) {
    let cut = false
    for (let i = 0; i < idx.length && !cut; i++) {
      const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length], a = ring[ia], b = ring[ib], c = ring[ic]
      if (cross(a, b, c) <= 1e-9) continue
      if (idx.some((k) => k !== ia && k !== ib && k !== ic && cross(a, b, ring[k]) >= 0 && cross(b, c, ring[k]) >= 0 && cross(c, a, ring[k]) >= 0)) continue
      T(a, b, c); idx.splice(i, 1); cut = true
    }
    if (!cut) break
  }
  if (idx.length === 3) T(ring[idx[0]], ring[idx[1]], ring[idx[2]])
}
