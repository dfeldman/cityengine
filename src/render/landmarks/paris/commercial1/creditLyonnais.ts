/**
 * Ancien Siège du Crédit Lyonnais, 19 boulevard des Italiens, Paris 2e, OSM way/54564626 (William Bouwens van der Boijen, 1883;
 * MH PA00086062). Only this way's footprint (the north block between rue de Choiseul and rue de Gramont); the bank's southern
 * halls are other ways. Street faces are the edges whose outward normal's local z is below STREET_NZ (boulevard, the entry's
 * `front`) plus the Choiseul and Gramont sides (|x| normal); the south edge is a party wall. From the Commons photo: cream
 * ashlar, rusticated ground storey and mezzanine with tall arched openings, two piano-nobile floors under a giant order of
 * pilasters with balustraded windows, a heavy cornice at ~19 m, slate mansard with stone-framed dormers and a cresting rail.
 * The centre pavilion on the boulevard projects, with a great arched portal, paired caryatids flanking a clock, a segmental
 * pediment of sculpture and a tall square slate dome (imperial profile) with cresting. Heights from the IGN lidar MNS:
 * mansard ridge ~25 m, pavilion dome ~36 m, courtyard glass roofs ~21–23 m.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const CREDIT_LYONNAIS = {
  STREET_NZ: -0.6, PARTY_NZ: 0.6, // front edges below STREET_NZ; party walls above PARTY_NZ
  GROUND: 4.6, MEZZ: 2.4, FLOOR: 3.9, FLOORS: 2, ATTIC: 2.6, CORNICE: 1.0, // eave = 19.3
  MANSARD: 5.4, INSET: 3.0, CREST: 0.7, COURT_Y: 21.5, COURT_INSET: 17, SKY_H: 1.6,
  BAY: 4.0, MARGIN: 1.4, WIN_W: 1.6, ARCH_W: 2.4, ARCH_TOP: 6.2, FRAME: 0.25,
  RUST: 0.55, RUST_OUT: 0.06, PIL_W: 0.75, PIL_OUT: 0.22, BAL_OUT: 0.35, BAL_H: 0.9,
  DORMER_W: 1.5, DORMER_H: 1.8, DORMER_OUT: 1.1,
  PAV_T: 0.49, PAV_W: 13, PAV_OUT: 1.6, PAV_TOP: 23.5, PORTAL_W: 4.4, PORTAL_H: 8.5,
  CARY_R: 0.42, CLOCK_R: 1.3, CLOCK_Y: 15.4, PED_H: 3.2, PED_SEG: 10,
  DOME_W: 12, DOME_Y0: 24.5, DOME_H: 10.5, DOME_SEG: 9, LANTERN: 1.4,
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

export const creditLyonnais = (out: MeshBuilder, fit: Fit): void => {
  const K = CREDIT_LYONNAIS
  const stone = hex('#e4dac4'), stoneLt = hex('#f0e8d6'), stoneDk = hex('#c2b79e'), party = hex('#b8ac94'), glass = hex('#2c353d'), door = hex('#3a3026')
  const iron = hex('#22262a'), slate = hex('#4b5260'), slateLt = hex('#5c6372'), roofFlat = hex('#6c7176'), sky = hex('#8fa3b0'), gold = hex('#c9a54a'), clock = hex('#f4f0e2')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw
  const n = ring.length
  const eave = K.GROUND + K.MEZZ + K.FLOORS * K.FLOOR + K.ATTIC + K.CORNICE, ridge = eave + K.MANSARD
  const q = (pts: V3[], nrm: V3, c: Rgb): void => out.quad(pts, nrm, UV, c, 0)
  const tri = (a: V3, b: V3, c2: V3, nrm: V3, c: Rgb): void => out.quad([a, b, c2, a], nrm, UV, c, 0)
  const nrmOf = (a: P, b: P): P => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l] }

  // edge frame: s along a->b, v outward, y up
  type F = { a: P, u: P, nx: number, nz: number, l: number }
  const P3 = (f: F, s: number, v: number, y: number): V3 => [f.a[0] + f.u[0] * s + f.nx * v, y, f.a[1] + f.u[1] * s + f.nz * v]
  const face = (f: F, s0: number, s1: number, y0: number, y1: number, v: number, c: Rgb): void => {
    if (y1 - y0 < 0.01 || s1 - s0 < 0.01) return
    q([P3(f, s0, v, y0), P3(f, s1, v, y0), P3(f, s1, v, y1), P3(f, s0, v, y1)], [f.nx, 0, f.nz], c)
  }
  /** a block standing proud of the wall: front, both cheeks, top */
  const boss = (f: F, s0: number, s1: number, y0: number, y1: number, v: number, c: Rgb, top = true): void => {
    face(f, s0, s1, y0, y1, v, c)
    q([P3(f, s0, 0, y0), P3(f, s0, v, y0), P3(f, s0, v, y1), P3(f, s0, 0, y1)], [-f.u[0], 0, -f.u[1]], c)
    q([P3(f, s1, v, y0), P3(f, s1, 0, y0), P3(f, s1, 0, y1), P3(f, s1, v, y1)], [f.u[0], 0, f.u[1]], c)
    if (top) q([P3(f, s0, v, y1), P3(f, s1, v, y1), P3(f, s1, 0, y1), P3(f, s0, 0, y1)], [0, 1, 0], c)
  }
  /** round-headed opening: rectangle to spring, then a fan of SEG strips */
  const arch = (f: F, c: number, w: number, y0: number, top: number, v: number, col: Rgb, seg = 6): void => {
    const r = w / 2, spring = top - r
    face(f, c - r, c + r, y0, spring, v, col)
    for (let k = 0; k < seg; k++) {
      const t0 = Math.PI * k / seg, t1 = Math.PI * (k + 1) / seg
      tri(P3(f, c, v, spring), P3(f, c + r * Math.cos(t0), v, spring + r * Math.sin(t0)), P3(f, c + r * Math.cos(t1), v, spring + r * Math.sin(t1)), [f.nx, 0, f.nz], col)
    }
  }
  const disc = (f: F, c: number, y: number, r: number, v: number, col: Rgb, seg = 12): void => {
    for (let k = 0; k < seg; k++) {
      const t0 = 2 * Math.PI * k / seg, t1 = 2 * Math.PI * (k + 1) / seg
      tri(P3(f, c, v, y), P3(f, c + r * Math.cos(t0), v, y + r * Math.sin(t0)), P3(f, c + r * Math.cos(t1), v, y + r * Math.sin(t1)), [f.nx, 0, f.nz], col)
    }
  }
  const post = (f: F, c: number, v: number, y0: number, y1: number, r: number, col: Rgb): void => boss({ ...f, a: [f.a[0] + f.nx * (v - r), f.a[1] + f.nz * (v - r)] }, c - r, c + r, y0, y1, 2 * r, col)

  // inset ring for the mansard top
  const inset: P[] = ring.map((p, i) => {
    const pa = ring[(i + n - 1) % n], pb = ring[(i + 1) % n], n1 = nrmOf(pa, p), n2 = nrmOf(p, pb)
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml
    const k = Math.min(3, 1 / Math.max(0.35, mx * n1[0] + mz * n1[1]))
    return [p[0] - mx * K.INSET * k, p[1] - mz * K.INSET * k]
  })

  // the front chord: the longest edge facing -z carries the pavilion
  let fi = -1, fl = 0
  for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (nrmOf(a, b)[1] < K.STREET_NZ && l > fl) { fl = l; fi = i } }

  // the boulevard run: every front edge projected onto the longest one's direction; the pavilion sits at PAV_T along it
  const fa = ring[fi], fb = ring[(fi + 1) % n], fu: P = [(fb[0] - fa[0]) / fl, (fb[1] - fa[1]) / fl], [fnx, fnz] = nrmOf(fa, fb)
  let s0r = Infinity, s1r = -Infinity, vr = -Infinity
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n]
    if (nrmOf(a, b)[1] >= K.STREET_NZ) continue
    for (const p of [a, b]) { const s = (p[0] - fa[0]) * fu[0] + (p[1] - fa[1]) * fu[1], v = (p[0] - fa[0]) * fnx + (p[1] - fa[1]) * fnz; s0r = Math.min(s0r, s); s1r = Math.max(s1r, s); vr = Math.max(vr, v) }
  }
  const runF: F = { a: [fa[0] + fu[0] * s0r + fnx * vr, fa[1] + fu[1] * s0r + fnz * vr], u: fu, nx: fnx, nz: fnz, l: s1r - s0r }
  const pavS = s0r + K.PAV_T * (s1r - s0r) // in the front chord's s
  const inPav = (f: F, s: number): boolean => { if (f.nz >= K.STREET_NZ) return false; const x = f.a[0] + f.u[0] * s - fa[0], z = f.a[1] + f.u[1] * s - fa[1]; return Math.abs(x * fu[0] + z * fu[1] - pavS) < K.PAV_W / 2 + 0.5 }
  const yF = (f: number): number => K.GROUND + K.MEZZ + f * K.FLOOR
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 0.2) continue
    const [nx, nz] = nrmOf(a, b), f: F = { a, u: [(b[0] - a[0]) / l, (b[1] - a[1]) / l], nx, nz, l }
    // mansard slope
    const A2 = inset[i], B2 = inset[(i + 1) % n], rise = K.MANSARD, sn = Math.hypot(nx * rise, K.INSET, nz * rise)
    q([[a[0], eave, a[1]], [b[0], eave, b[1]], [B2[0], ridge, B2[1]], [A2[0], ridge, A2[1]]], [nx * rise / sn, K.INSET / sn, nz * rise / sn], slate)
    if (nz > K.PARTY_NZ || l < 2.5) { face(f, 0, l, 0, eave, 0, l < 2.5 ? stone : party); continue }
    face(f, 0, l, 0, eave, 0, stone)
    // cornice and string courses
    boss(f, 0, l, eave - K.CORNICE, eave, 0.55, stoneLt)
    boss(f, 0, l, yF(0) - 0.3, yF(0), 0.2, stoneLt)
    boss(f, 0, l, yF(K.FLOORS) - 0.25, yF(K.FLOORS), 0.15, stoneLt)
    // crest rail on the mansard ridge
    face({ ...f, a: A2, u: [(B2[0] - A2[0]) / (Math.hypot(B2[0] - A2[0], B2[1] - A2[1]) || 1), (B2[1] - A2[1]) / (Math.hypot(B2[0] - A2[0], B2[1] - A2[1]) || 1)] }, 0, Math.hypot(B2[0] - A2[0], B2[1] - A2[1]), ridge, ridge + K.CREST, 0, iron)
    if (l < K.BAY) continue
    // rusticated ground storey + mezzanine: courses as thin proud bands
    for (let y = K.RUST; y < yF(0) - 0.3; y += K.RUST) boss(f, 0, l, y - 0.06, y, K.RUST_OUT, stoneDk, false)
        const nb = Math.max(1, Math.floor((l - 2 * K.MARGIN) / K.BAY)), bw = (l - 2 * K.MARGIN) / nb
    for (let w = 0; w < nb; w++) {
      const c = K.MARGIN + (w + 0.5) * bw
      if (inPav(f, c)) continue
      arch(f, c, K.ARCH_W, 0, K.ARCH_TOP, 0.08, glass)
      face(f, c - 0.25, c + 0.25, K.ARCH_TOP - 0.7, K.ARCH_TOP + 0.15, 0.12, stoneLt) // keystone
      for (let fl2 = 0; fl2 < K.FLOORS; fl2++) {
        const y = yF(fl2), top = y + 2.9
        face(f, c - K.WIN_W / 2 - K.FRAME, c + K.WIN_W / 2 + K.FRAME, y + 0.3, top + 0.35, 0.05, stoneLt)
        face(f, c - K.WIN_W / 2, c + K.WIN_W / 2, y + 0.4, top, 0.09, glass)
        boss(f, c - K.WIN_W / 2 - 0.4, c + K.WIN_W / 2 + 0.4, top + 0.35, top + 0.6, 0.3, stoneLt) // cornice hood
        if (fl2 === 0) { boss(f, c - K.WIN_W / 2 - 0.2, c + K.WIN_W / 2 + 0.2, y, y + 0.12, K.BAL_OUT, stoneLt); face(f, c - K.WIN_W / 2 - 0.2, c + K.WIN_W / 2 + 0.2, y + 0.12, y + K.BAL_H, K.BAL_OUT, stoneLt) }
        else face(f, c - K.WIN_W / 2, c + K.WIN_W / 2, y + 0.4, y + 1.2, 0.14, iron)
      }
      // attic windows (small, square)
      face(f, c - 0.6, c + 0.6, yF(K.FLOORS) + 0.4, yF(K.FLOORS) + 1.8, 0.07, glass)
      // dormer on the mansard
      const vs = (y: number): number => -K.INSET * (y - eave) / K.MANSARD, yb = eave + 0.9, y1 = yb + K.DORMER_H, hw = K.DORMER_W / 2, vf = vs(yb) + K.DORMER_OUT
      face(f, c - hw - 0.25, c + hw + 0.25, yb - 0.1, y1 + 0.3, vf - 0.05, stoneLt)
      face(f, c - hw, c + hw, yb, y1, vf, glass)
      q([P3(f, c - hw - 0.25, vs(y1), yb), P3(f, c - hw - 0.25, vf - 0.05, yb), P3(f, c - hw - 0.25, vf - 0.05, y1 + 0.3), P3(f, c - hw - 0.25, vs(y1), y1 + 0.3)], [-f.u[0], 0, -f.u[1]], stoneDk)
      q([P3(f, c + hw + 0.25, vf - 0.05, yb), P3(f, c + hw + 0.25, vs(y1), yb), P3(f, c + hw + 0.25, vs(y1), y1 + 0.3), P3(f, c + hw + 0.25, vf - 0.05, y1 + 0.3)], [f.u[0], 0, f.u[1]], stoneDk)
      // segmental dormer head
      tri(P3(f, c - hw - 0.35, vf, y1 + 0.3), P3(f, c + hw + 0.35, vf, y1 + 0.3), P3(f, c, vf, y1 + 0.95), [f.nx, 0, f.nz], stoneLt)
      q([P3(f, c - hw - 0.35, vf, y1 + 0.3), P3(f, c, vf, y1 + 0.95), P3(f, c, vs(y1 + 0.95), y1 + 0.95), P3(f, c - hw - 0.35, vs(y1), y1 + 0.3)], [0, 1, 0], slateLt)
      q([P3(f, c, vf, y1 + 0.95), P3(f, c + hw + 0.35, vf, y1 + 0.3), P3(f, c + hw + 0.35, vs(y1), y1 + 0.3), P3(f, c, vs(y1 + 0.95), y1 + 0.95)], [0, 1, 0], slateLt)
    }
    // giant-order pilasters between bays through the two noble floors + attic
    for (let w = 0; w <= nb; w++) {
      const s = K.MARGIN + w * bw
      if (inPav(f, s)) continue
      boss(f, Math.max(0, s - K.PIL_W / 2), Math.min(l, s + K.PIL_W / 2), yF(0), eave - K.CORNICE, K.PIL_OUT, stoneLt)
      boss(f, Math.max(0, s - K.PIL_W / 2 - 0.1), Math.min(l, s + K.PIL_W / 2 + 0.1), eave - K.CORNICE - 0.6, eave - K.CORNICE, K.PIL_OUT + 0.08, stoneLt, false) // capital
    }
  }
  if (fi >= 0) pavilion(runF, pavS - s0r)

  function pavilion (f: F, pc: number): void {
    const p0 = pc - K.PAV_W / 2, p1 = pc + K.PAV_W / 2, v = K.PAV_OUT, top = K.PAV_TOP
    boss(f, p0, p1, 0, top, v, stone, false)
    for (let y = K.RUST; y < yF(0) - 0.3; y += K.RUST) boss({ ...f, a: [f.a[0] + f.nx * v, f.a[1] + f.nz * v] }, p0, p1, y - 0.06, y, K.RUST_OUT, stoneDk, false)
    const pf: F = { ...f, a: [f.a[0] + f.nx * v, f.a[1] + f.nz * v] }
    // great portal with two side arches
    arch(pf, pc, K.PORTAL_W, 0, K.PORTAL_H, 0.06, door, 8)
    for (const d of [-1, 1]) {
      arch(pf, pc + d * 4.3, 1.8, 0, 5.2, 0.06, glass)
      disc(pf, pc + d * 4.3, 7.6, 0.7, 0.06, glass, 10) // oeil-de-boeuf
      boss(pf, pc + d * 4.3 - 0.5, pc + d * 4.3 + 0.5, 0, top - 0.8, 0.15, stoneLt, false) // ground-to-attic pilaster strips are hidden behind the caryatids above
    }
    boss(pf, p0 - 0.2, p1 + 0.2, yF(0) + 2.3, yF(0) + 2.7, 0.35, stoneLt) // balcony slab over the portal
    face(pf, pc - 3, pc + 3, yF(0) + 2.7, yF(0) + 3.5, 0.45, iron)
    // upper storeys: a tall arched window flanked by caryatid pairs
    arch(pf, pc, 2.6, yF(0) + 2.8, yF(1) + 2.6, 0.06, glass)
    for (const d of [-1, 1]) for (const e of [2.2, 3.1]) {
      const s = pc + d * e
      post(pf, s, 0.6, yF(1) + 0.4, K.CLOCK_Y + 1.6, K.CARY_R, stoneLt) // caryatid
      boss(pf, s - 0.5, s + 0.5, yF(1), yF(1) + 0.4, 1.0, stoneLt) // plinth
      boss(pf, s - 0.55, s + 0.55, K.CLOCK_Y + 1.6, K.CLOCK_Y + 2.1, 1.05, stoneLt) // abacus
      boss(pf, s - 0.3, s + 0.3, K.CLOCK_Y + 1.15, K.CLOCK_Y + 1.6, 0.95, stoneDk, false) // heads
    }
    for (const d of [-1, 1]) arch(pf, pc + d * 5.3, 1.2, yF(0) + 3.0, yF(0) + 6.4, 0.06, glass)
    // clock
    disc(pf, pc, K.CLOCK_Y, K.CLOCK_R + 0.25, 0.1, gold, 14)
    disc(pf, pc, K.CLOCK_Y, K.CLOCK_R, 0.14, clock, 14)
    face(pf, pc - 0.06, pc + 0.06, K.CLOCK_Y, K.CLOCK_Y + K.CLOCK_R * 0.8, 0.17, iron)
    face(pf, pc, pc + K.CLOCK_R * 0.6, K.CLOCK_Y - 0.05, K.CLOCK_Y + 0.05, 0.17, iron)
    // entablature, then a segmental pediment holding a sculpture relief
    boss(pf, p0 - 0.3, p1 + 0.3, top - 1.4, top, 0.6, stoneLt)
    const yP = top, R = (K.PAV_W / 2 + 0.3), segs = K.PED_SEG, vp = 0.3
    for (let k = 0; k < segs; k++) {
      const t0 = Math.PI * k / segs, t1 = Math.PI * (k + 1) / segs
      const A: V3 = P3(pf, pc + R * Math.cos(t0), vp, yP + K.PED_H * Math.sin(t0)), B: V3 = P3(pf, pc + R * Math.cos(t1), vp, yP + K.PED_H * Math.sin(t1))
      tri(P3(pf, pc, vp, yP), A, B, [f.nx, 0, f.nz], stone)
      const A0: V3 = P3(pf, pc + R * Math.cos(t0), -v - 1, yP + K.PED_H * Math.sin(t0)), B0: V3 = P3(pf, pc + R * Math.cos(t1), -v - 1, yP + K.PED_H * Math.sin(t1))
      q([A, B, B0, A0], [0, 1, 0], slateLt)
    }
    // sculpture group in the tympanum
    for (let k = -2; k <= 2; k++) post(pf, pc + k * 1.2, vp + 0.5, yP + 0.2, yP + K.PED_H * 0.75 * Math.cos(k * 0.3) - 0.4, 0.35, stoneLt)
    // square slate dome with an imperial (bell) profile, set back over the pavilion
    const hw0 = K.DOME_W / 2, cv = -K.DOME_W / 2 + v * 0.5, segD = K.DOME_SEG
    const prof = (t: number): number => hw0 * (t < 0.55 ? 1 - 0.25 * Math.pow(t / 0.55, 2) : 0.75 * Math.cos((t - 0.55) / 0.45 * Math.PI / 2) + 0.05)
    const sq = (hw: number, y: number): V3[] => [P3(f, pc - hw, cv - hw, y), P3(f, pc + hw, cv - hw, y), P3(f, pc + hw, cv + hw, y), P3(f, pc - hw, cv + hw, y)]
    const band = (r0: V3[], r1: V3[], c: Rgb): void => { for (let j = 0; j < 4; j++) { const a0 = r0[j], b0 = r0[(j + 1) % 4], mx = (a0[0] + b0[0]) / 2 - (r0[0][0] + r0[2][0]) / 2, mz = (a0[2] + b0[2]) / 2 - (r0[0][2] + r0[2][2]) / 2, ml = Math.hypot(mx, mz) || 1; q([a0, b0, r1[(j + 1) % 4], r1[j]], [mx / ml, 0, mz / ml], c) } }
    band(sq(hw0, K.DOME_Y0 - 1.5), sq(hw0, K.DOME_Y0), stoneLt) // drum plinth
    for (let k = 0; k < segD; k++) {
      const t0 = k / segD, t1 = (k + 1) / segD, y0 = K.DOME_Y0 + t0 * K.DOME_H, y1 = K.DOME_Y0 + t1 * K.DOME_H
      const r0 = sq(prof(t0), y0), r1 = sq(prof(t1), y1)
      for (let j = 0; j < 4; j++) {
        const a0 = r0[j], b0 = r0[(j + 1) % 4], a1 = r1[j], b1 = r1[(j + 1) % 4]
        const mx = (a0[0] + b0[0]) / 2 - (r0[0][0] + r0[2][0]) / 2, mz = (a0[2] + b0[2]) / 2 - (r0[0][2] + r0[2][2]) / 2, ml = Math.hypot(mx, mz) || 1
        q([a0, b0, b1, a1], [mx / ml, 0.5, mz / ml], k % 3 === 2 ? slateLt : slate)
      }
    }
    // lantern + cresting finial, and an oeil-de-boeuf on the dome front
    const yT = K.DOME_Y0 + K.DOME_H
    band(sq(0.6, yT), sq(0.6, yT + K.LANTERN), iron)
    q(sq(0.6, yT + K.LANTERN), [0, 1, 0], iron)
    disc({ ...f, a: P3(f, 0, cv - hw0 * 0.97 + 0.3, 0).filter((_, j) => j !== 1) as P }, pc, K.DOME_Y0 + 2.3, 0.9, 0, stoneLt, 10)
  }

  // flat roof inside the mansard, then a glazed court roof
  const fan = (pts: P[], y: number, c: Rgb): void => {
    const idx = pts.map((_, i) => i), cross = (a: P, b: P, c2: P): number => (b[0] - a[0]) * (c2[1] - a[1]) - (b[1] - a[1]) * (c2[0] - a[0])
    const T = (a: P, b: P, c2: P): void => q([[c2[0], y, c2[1]], [b[0], y, b[1]], [a[0], y, a[1]], [c2[0], y, c2[1]]], [0, 1, 0], c)
    let guard = 0
    while (idx.length > 3 && guard++ < 400) {
      let cut = false
      for (let i = 0; i < idx.length && !cut; i++) {
        const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length], a = pts[ia], b = pts[ib], c2 = pts[ic]
        if (cross(a, b, c2) <= 1e-9) continue
        if (idx.some((k) => k !== ia && k !== ib && k !== ic && cross(a, b, pts[k]) >= 0 && cross(b, c2, pts[k]) >= 0 && cross(c2, a, pts[k]) >= 0)) continue
        T(a, b, c2); idx.splice(i, 1); cut = true
      }
      if (!cut) break
    }
    if (idx.length === 3) T(pts[idx[0]], pts[idx[1]], pts[idx[2]])
  }
  fan(inset, ridge, roofFlat)
  // glazed court lantern: a low hipped skylight over the middle
  const cx = 0, cz = 0, sw = Math.max(3, fit.hx - K.COURT_INSET), sd = Math.max(3, fit.hz - K.COURT_INSET), y0 = ridge + 0.05, y1 = y0 + K.SKY_H
  const S: V3[] = [[cx - sw, y0, cz - sd], [cx + sw, y0, cz - sd], [cx + sw, y0, cz + sd], [cx - sw, y0, cz + sd]]
  const T2: V3[] = [[cx - sw * 0.6, y1, cz], [cx + sw * 0.6, y1, cz]]
  q([S[0], S[1], T2[1], T2[0]], [0, 0.7, -0.7], sky)
  q([S[2], S[3], T2[0], T2[1]], [0, 0.7, 0.7], sky)
  tri(S[3], S[0], T2[0], [-0.7, 0.7, 0], sky)
  tri(S[1], S[2], T2[1], [0.7, 0.7, 0], sky)
}
