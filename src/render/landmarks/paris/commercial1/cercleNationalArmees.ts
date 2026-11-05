/**
 * Cercle National des Armées (Maison des Officiers de France), 8 place Saint-Augustin / boulevard Malesherbes, Paris 8e, OSM way/67725906
 * (Charles Lemaresquier, 1927, Beaux-Arts officers' club; 31 m). No facade photo could be fetched (Commons category empty to the API); built
 * from the one roof photo and the type: a rusticated ground storey of round-headed bays, cream stone floors with pale lintelled windows,
 * iron balcony rails on two floors, balustraded string courses, a cornice and a slate mansard with round-headed stone dormers, and at the
 * place Saint-Augustin end a big oval slate dome on a stone drum with arched windows, corner statue plinths, a balustraded crown and a flag.
 * The dome sits on the longest smooth run of short edges (the curved bay) pulled DOME_IN back from the wall.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
type V = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const CERCLE = {
  GROUND: 5.2, FLOORS: 5, CORNICE: 0.6, EAVE_FRAC: 0.8, INSET: 3.2, // storey heights, metres; mansard foot-to-ridge setback
  BAY: 3.6, MARGIN: 0.9, MIN_WALL: 2.5, WIN_W: 1.3, WIN_BOT: 0.35, WIN_TOP: 2.9, FRAME: 0.18, LINTEL: 0.3,
  RAIL_OUT: 0.35, RAIL_H: 0.9, RAIL_FLOORS: [0, 3], BAND_OUT: 0.12, ARCH_W: 2.2, ARCH_SEG: 5, BAL_H: 0.7, PILASTER: 0.35, PILASTER_OUT: 0.1,
  DORMER_EVERY: 2, DORMER_W: 1.2, DORMER_H: 1.7, DORMER_OUT: 0.9,
  SHORT: 2.5, DOME_IN: 5.5, DOME_R: 5.6, DOME_ELONG: 1.35, DOME_SIDES: 20, DRUM_H: 3.0, DOME_H: 6.6, CROWN_W: 2.6, CROWN_H: 1.5, MAST_H: 7, FLAG_W: 1.8, FLAG_H: 1.1,
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

export const cercleNationalArmees = (out: MeshBuilder, fit: Fit): void => {
  const K = CERCLE, H = fit.height
  const stone = hex('#d8ccb2'), stoneLt = hex('#e7dcc4'), stoneDk = hex('#b5a78c'), glass = hex('#4a5a68'), arcGlass = hex('#2f3b46'), iron = hex('#22262a'), slate = hex('#4b535b'), slateDk = hex('#3b4248'), roofFlat = hex('#6c7377'), blue = hex('#2a3f8f'), white = hex('#f1f1ee'), red = hex('#c8283a')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw // outward normal of a->b is (dz,-dx)
  const n = ring.length
  const FLOOR = (H * K.EAVE_FRAC - K.GROUND - K.CORNICE) / K.FLOORS
  const fl0 = K.GROUND, eave = fl0 + K.FLOORS * FLOOR + K.CORNICE, ridge = H
  const q = (pts: V[], nrm: V, c: Rgb): void => out.quad(pts, nrm, UV, c, 0)
  const tri = (a: V, b: V, c2: V, nrm: V, c: Rgb): void => out.quad([a, b, c2, a], nrm, UV, c, 0)
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

  // the dome stands on the longest smooth run of short edges (the curved bay), pulled back from the wall
  const len = (i: number): number => Math.hypot(ring[(i + 1) % n][0] - ring[i][0], ring[(i + 1) % n][1] - ring[i][1])
  let start = 0
  for (let i = 0; i < n; i++) if (len(i) >= K.SHORT) { start = (i + 1) % n; break }
  let best = { chord: 0, mid: 0 }
  for (let k = 0; k < n;) {
    const i = (start + k) % n
    if (len(i) >= K.SHORT) { k++; continue }
    let m = 0
    while (k + m < n && len((start + k + m) % n) < K.SHORT) m++
    const p0 = ring[i], p1 = ring[(start + k + m) % n], chord = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
    if (chord > best.chord) best = { chord, mid: (start + k + Math.floor(m / 2)) % n }
    k += m
  }
  const dm = ring[best.mid], dn = nrmOf(ring[(best.mid + n - 1) % n], ring[(best.mid + 1) % n]) // outward at the arc's middle
  const dc: P = [dm[0] - dn[0] * K.DOME_IN, dm[1] - dn[1] * K.DOME_IN], dt: P = [-dn[1], dn[0]] // dt is along the facade
  const hasDome = best.chord > 4

  const inset: P[] = ring.map((p, i) => {
    const pa = ring[(i + n - 1) % n], pb = ring[(i + 1) % n], n1 = nrmOf(pa, p), n2 = nrmOf(p, pb)
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml
    const k = Math.min(3, 1 / Math.max(0.35, mx * n1[0] + mz * n1[1]))
    return [p[0] - mx * K.INSET * k, p[1] - mz * K.INSET * k]
  })
  const nearDome = (x: number, z: number): boolean => hasDome && Math.hypot((x - dc[0]) / K.DOME_ELONG, z - dc[1]) < K.DOME_R + 0.5 && Math.hypot(x - dc[0], z - dc[1]) < K.DOME_R * K.DOME_ELONG + 1.2

  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 0.3) continue
    const [nx, nz] = nrmOf(a, b), u: [number, number] = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
    wall(a, b, 0, eave, stone)
    wall(a, b, eave - K.CORNICE, eave, stoneLt, 0.35)
    strip(a, b, eave, 0, 0.35, stoneLt)
    const A2 = inset[i], B2 = inset[(i + 1) % n], rise = ridge - eave, sl: V = [nx * rise, K.INSET, nz * rise], sn = Math.hypot(sl[0], sl[1], sl[2]) || 1
    q([[a[0], eave, a[1]], [b[0], eave, b[1]], [B2[0], ridge, B2[1]], [A2[0], ridge, A2[1]]], [sl[0] / sn, sl[1] / sn, sl[2] / sn], slate)
    if (l < K.MIN_WALL) continue
    const nb = Math.max(1, Math.round((l - 2 * K.MARGIN) / K.BAY)), bw = (l - 2 * K.MARGIN) / nb
    const P3 = (s2: number, v: number, y: number): V => { const p = at(a, u, s2, v); return [p[0], y, p[1]] }
    const N: V = [nx, 0, nz]
    // ground storey: rusticated bands with round-headed bays, string course with balustrade over it
    wall(a, b, 0, fl0 - 0.2, stoneDk, K.BAND_OUT)
    wall(a, b, fl0 - 0.2, fl0 + K.BAL_H * 0.2, stoneLt, 0.3)
    for (let w = 0; w < nb; w++) {
      const c = K.MARGIN + (w + 0.5) * bw, hw = Math.min(K.ARCH_W, bw - 0.9) / 2, y0 = 0.4, ys = fl0 - 1.5 - hw * 0.6, o = K.BAND_OUT + 0.02
      for (const [h2, v, col] of [[hw + 0.2, o, stoneLt], [hw, o + 0.04, arcGlass]] as [number, number, Rgb][]) {
        q([P3(c - h2, v, y0), P3(c + h2, v, y0), P3(c + h2, v, ys), P3(c - h2, v, ys)], N, col)
        for (let k = 0; k < K.ARCH_SEG; k++) {
          const t0 = Math.PI * k / K.ARCH_SEG, t1 = Math.PI * (k + 1) / K.ARCH_SEG
          tri(P3(c, v, ys), P3(c + h2 * Math.cos(t0), v, ys + h2 * 0.8 * Math.sin(t0)), P3(c + h2 * Math.cos(t1), v, ys + h2 * 0.8 * Math.sin(t1)), N, col)
        }
      }
    }
    // upper floors: lintelled windows, iron balcony rails on two floors, balustraded string courses
    for (let f = 0; f < K.FLOORS; f++) {
      const y = fl0 + f * FLOOR, rail = K.RAIL_FLOORS.includes(f)
      for (let w = 0; w < nb; w++) {
        const c = K.MARGIN + (w + 0.5) * bw, hw = K.WIN_W / 2
        wall(at(a, u, c - hw - K.FRAME, 0), at(a, u, c + hw + K.FRAME, 0), y + K.WIN_BOT, y + K.WIN_TOP + K.LINTEL, stoneLt, 0.04)
        wall(at(a, u, c - hw, 0), at(a, u, c + hw, 0), y + K.WIN_BOT + 0.05, y + K.WIN_TOP, glass, 0.08)
        if (rail) {
          wall(at(a, u, c - hw - 0.4, 0), at(a, u, c + hw + 0.4, 0), y + K.WIN_BOT, y + K.WIN_BOT + K.RAIL_H, iron, K.RAIL_OUT)
          strip(at(a, u, c - hw - 0.4, 0), at(a, u, c + hw + 0.4, 0), y + K.WIN_BOT, 0, K.RAIL_OUT, stoneDk)
        }
      }
      if (f > 0) wall(a, b, y - 0.1, y + 0.15, stoneLt, 0.15) // string course
      if (f === K.FLOORS - 1) wall(a, b, eave - K.CORNICE - K.BAL_H, eave - K.CORNICE, stoneLt, 0.12) // attic balustrade under the cornice
      for (let w = 0; w <= nb; w++) {
        const s2 = K.MARGIN + w * bw - K.PILASTER / 2
        wall(at(a, u, Math.max(0, s2), 0), at(a, u, Math.min(l, s2 + K.PILASTER), 0), y, y + FLOOR, stoneLt, K.PILASTER_OUT)
      }
    }
    // mansard dormers: round-headed stone frames, glass, slate cheeks and roof
    const slope = K.INSET / rise
    for (let w = 0; w < nb; w += K.DORMER_EVERY) {
      const c = K.MARGIN + (w + 0.5) * bw, hw = K.DORMER_W / 2, yb = eave + 0.5, yt = yb + K.DORMER_H, o = Math.max(0.1, K.DORMER_OUT - (yb - eave) * slope)
      const cp = at(a, u, c, 0)
      if (nearDome(cp[0] - nx * 1.5, cp[1] - nz * 1.5)) continue
      const on = (yy: number): number => -(yy - eave) * slope // slate surface offset at height yy (negative = inward)
      const f0 = on(yb) + o
      q([P3(c - hw, f0, yb), P3(c + hw, f0, yb), P3(c + hw, f0, yt), P3(c - hw, f0, yt)], N, stoneLt)
      q([P3(c - hw + 0.18, f0 + 0.03, yb + 0.2), P3(c + hw - 0.18, f0 + 0.03, yb + 0.2), P3(c + hw - 0.18, f0 + 0.03, yt - 0.15), P3(c - hw + 0.18, f0 + 0.03, yt - 0.15)], N, glass)
      for (let k = 0; k < 3; k++) {
        const t0 = Math.PI * k / 3, t1 = Math.PI * (k + 1) / 3, ya = yt
        tri(P3(c, f0, ya), P3(c + hw * Math.cos(t0), f0, ya + hw * 0.8 * Math.sin(t0)), P3(c + hw * Math.cos(t1), f0, ya + hw * 0.8 * Math.sin(t1)), N, stoneLt)
      }
      for (const sg of [-1, 1]) { // slate cheeks back to the roof
        const pts: V[] = [P3(c + sg * hw, f0, yb), P3(c + sg * hw, on(yt + hw * 0.8), yb + (yt + hw * 0.8 - yb) * 0.0 + (yt - yb) * 0.0), P3(c + sg * hw, on(yt + hw * 0.8), yt + hw * 0.8), P3(c + sg * hw, f0, yt)]
        if (sg < 0) pts.reverse()
        q(pts, [u[0] * sg, 0, u[1] * sg], slateDk)
      }
    }
  }

  // the dome: stone drum with arched windows and statue plinths, an oval slate dome, a balustraded crown and a flagpole
  if (hasDome) {
    const S = K.DOME_SIDES, R = K.DOME_R, E = K.DOME_ELONG, y0 = eave - 0.5, y1 = ridge + K.DRUM_H
    const pt = (rr: number, k: number): P => { const th = (2 * Math.PI * k) / S; return [dc[0] + dt[0] * rr * E * Math.cos(th) + dn[0] * rr * Math.sin(th), dc[1] + dt[1] * rr * E * Math.cos(th) + dn[1] * rr * Math.sin(th)] }
    const r3 = (rr: number, y: number, k: number): V => { const p = pt(rr, k); return [p[0], y, p[1]] }
    const face = (k: number): V => { const m = (2 * Math.PI * (k + 0.5)) / S, cx = Math.cos(m) / E, sz = Math.sin(m), l = Math.hypot(cx, sz); return [(dt[0] * cx + dn[0] * sz) / l, 0, (dt[1] * cx + dn[1] * sz) / l] }
    for (let k = 0; k < S; k++) {
      const nm = face(k)
      q([r3(R, y0, k), r3(R, y0, k + 1), r3(R, y1, k + 1), r3(R, y1, k)], nm, stone)
      q([r3(R + 0.3, y1 - 0.5, k), r3(R + 0.3, y1 - 0.5, k + 1), r3(R + 0.3, y1, k + 1), r3(R + 0.3, y1, k)], nm, stoneLt) // drum cornice
      q([r3(R + 0.3, y1, k), r3(R + 0.3, y1, k + 1), r3(R, y1 + 0.3, k + 1), r3(R, y1 + 0.3, k)], [nm[0], 0.6, nm[2]], stoneLt)
      if (k % 2 === 0) { // arched window on every other face
        const cm = pt(R + 0.06, k + 0.5), m = (2 * Math.PI * (k + 0.5)) / S
        const tx = (-dt[0] * Math.sin(m) * E + dn[0] * Math.cos(m)), tz = (-dt[1] * Math.sin(m) * E + dn[1] * Math.cos(m)), tl = Math.hypot(tx, tz) || 1
        const px = tx / tl, pz = tz / tl, w2 = 0.55, ya = ridge + 0.3, yh = ya + 1.6
        q([[cm[0] - px * w2, ya, cm[1] - pz * w2], [cm[0] + px * w2, ya, cm[1] + pz * w2], [cm[0] + px * w2, yh, cm[1] + pz * w2], [cm[0] - px * w2, yh, cm[1] - pz * w2]], nm, arcGlass)
        for (let j = 0; j < 3; j++) {
          const t0 = Math.PI * j / 3, t1 = Math.PI * (j + 1) / 3
          tri([cm[0], yh, cm[1]], [cm[0] + px * w2 * Math.cos(t0), yh + w2 * 0.9 * Math.sin(t0), cm[1] + pz * w2 * Math.cos(t0)], [cm[0] + px * w2 * Math.cos(t1), yh + w2 * 0.9 * Math.sin(t1), cm[1] + pz * w2 * Math.cos(t1)], nm, arcGlass)
        }
      }
      // statue plinths on the drum cornice every fifth vertex
      if (k % 5 === 0) {
        const p = pt(R + 0.1, k), sw = 0.4
        for (const [ax, az, bx, bz] of [[-sw, -sw, sw, -sw], [sw, -sw, sw, sw], [sw, sw, -sw, sw], [-sw, sw, -sw, -sw]])
          q([[p[0] + ax, y1, p[1] + az], [p[0] + bx, y1, p[1] + bz], [p[0] + bx, y1 + 1.8, p[1] + bz], [p[0] + ax, y1 + 1.8, p[1] + az]], [(ax + bx) / 2 / sw, 0, (az + bz) / 2 / sw], stoneLt)
      }
      // the slate dome: a swelling oval profile, ribs by alternating tone
      const prof: [number, number][] = [[1, 0.3], [1.02, 1.3], [0.93, 3.0], [0.74, 4.6], [0.5, 5.7], [0.3, 6.3], [CERCLE.CROWN_W / (2 * R * E) + 0.02, K.DOME_H]]
      for (let j = 0; j + 1 < prof.length; j++) {
        const [r0, h0] = prof[j], [r1, h1] = prof[j + 1], dn2: V = [nm[0] * (h1 - h0), (r0 - r1) * R, nm[2] * (h1 - h0)], dl = Math.hypot(dn2[0], dn2[1], dn2[2]) || 1
        q([r3(R * r0, y1 + h0, k), r3(R * r0, y1 + h0, k + 1), r3(R * r1, y1 + h1, k + 1), r3(R * r1, y1 + h1, k)], [dn2[0] / dl, dn2[1] / dl, dn2[2] / dl], k % 2 ? slate : slateDk)
      }
    }
    // balustraded crown: a stone square with corner statues, then the mast and flag
    const yc = y1 + K.DOME_H, cw = K.CROWN_W / 2
    const cp: P[] = [[-cw, -cw], [cw, -cw], [cw, cw], [-cw, cw]]
    for (let j = 0; j < 4; j++) {
      const [x0, z0] = cp[j], [x1, z1] = cp[(j + 1) % 4], nz: V = [(x0 + x1) / 2 / cw, 0, (z0 + z1) / 2 / cw]
      q([[dc[0] + x0, yc, dc[1] + z0], [dc[0] + x1, yc, dc[1] + z1], [dc[0] + x1, yc + K.CROWN_H, dc[1] + z1], [dc[0] + x0, yc + K.CROWN_H, dc[1] + z0]], nz, stoneLt)
      q([[dc[0] + x0 * 0.9, yc + K.CROWN_H, dc[1] + z0 * 0.9], [dc[0] + x1 * 0.9, yc + K.CROWN_H, dc[1] + z1 * 0.9], [dc[0] + x1 * 0.9, yc + K.CROWN_H + 0.2, dc[1] + z1 * 0.9], [dc[0] + x0 * 0.9, yc + K.CROWN_H + 0.2, dc[1] + z0 * 0.9]], nz, stoneDk)
    }
    q([[dc[0] - cw, yc + K.CROWN_H, dc[1] - cw], [dc[0] - cw, yc + K.CROWN_H, dc[1] + cw], [dc[0] + cw, yc + K.CROWN_H, dc[1] + cw], [dc[0] + cw, yc + K.CROWN_H, dc[1] - cw]], [0, 1, 0], stoneDk)
    const mx = 0.07, ym = yc + K.CROWN_H
    for (const [ax, az, bx, bz] of [[-mx, -mx, mx, -mx], [mx, -mx, mx, mx], [mx, mx, -mx, mx], [-mx, mx, -mx, -mx]])
      q([[dc[0] + ax, ym, dc[1] + az], [dc[0] + bx, ym, dc[1] + bz], [dc[0] + bx, ym + K.MAST_H, dc[1] + bz], [dc[0] + ax, ym + K.MAST_H, dc[1] + az]], [(ax + bx) / 2 / mx, 0, (az + bz) / 2 / mx], iron)
    const ft = ym + K.MAST_H, fw = K.FLAG_W / 3, fx = dt[0], fz = dt[1]
    ;([blue, white, red] as Rgb[]).forEach((c, j) => {
      const s0 = j * fw + mx, s1 = (j + 1) * fw + mx
      for (const sg of [1, -1]) {
        const pts: V[] = [[dc[0] + fx * s0, ft - K.FLAG_H, dc[1] + fz * s0], [dc[0] + fx * s1, ft - K.FLAG_H, dc[1] + fz * s1], [dc[0] + fx * s1, ft, dc[1] + fz * s1], [dc[0] + fx * s0, ft, dc[1] + fz * s0]]
        q(sg > 0 ? pts : [...pts].reverse() as V[], [-fz * sg, 0, fx * sg], c)
      }
    })
  }

  // flat zinc roof: ear-clipped inset ring
  const idx = inset.map((_, i) => i), cross = (a: P, b: P, c: P): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  let guard = 0
  const T = (a: P, b: P, c: P): void => q([[c[0], ridge, c[1]], [b[0], ridge, b[1]], [a[0], ridge, a[1]], [c[0], ridge, c[1]]], [0, 1, 0], roofFlat)
  while (idx.length > 3 && guard++ < 600) {
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
