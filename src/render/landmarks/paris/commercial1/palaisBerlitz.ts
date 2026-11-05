/**
 * Palais Berlitz (Palais de Hanovre), 31 boulevard des Italiens / rue Louis-le-Grand, Paris 2e, OSM way/54564592 (Charles
 * Lemaresquier, 1932; Wikidata Q3360827). A whole block: every edge is a street face. From the Commons photo: pale stone
 * Art Deco, an arcade of square piers with dark recesses along the ground storey, six office floors of paired windows in
 * flat bays with thin string courses, twin fluted piers rising the full height at the corners and every few bays and
 * ending in rounded caps above the eave, two set-back attic storeys with round-headed windows, and the short chamfered
 * corners carrying the tall glazed entrance and a raised corner block lettered "Palais de Hanovre".
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

type P = [number, number]
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export const PALAIS_BERLITZ = {
  GROUND: 5.6, FLOOR: 3.2, FLOORS: 6, CORNICE: 0.6, // eave = 25.4
  SET1: 1.6, SET1_H: 3.3, SET2: 3.4, SET2_H: 3.0, PARAPET: 0.6,
  CORNER_L: 9, CORNER_UP: 3.4, // edges shorter than CORNER_L are the chamfered corners, raised CORNER_UP above the top
  BAY: 3.7, MARGIN: 1.0, WIN_W: 2.5, WIN_IN: 0.12,
  PIER_EVERY: 4, PIER_W: 0.9, PIER_OUT: 0.55, PIER_CAP: 1.4, ARC_W: 0.7, ARC_IN: 1.2,
  DOOR_W: 4.2, DOOR_H: 8.5, ARCH_W: 1.6, ARCH_SEG: 5,
}

const area = (p: P[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

export const palaisBerlitz = (out: MeshBuilder, fit: Fit): void => {
  const K = PALAIS_BERLITZ
  const stone = hex('#ddd6c6'), stoneLt = hex('#ece6d8'), stoneDk = hex('#bdb5a3'), glass = hex('#3a4650'), dark = hex('#262c31'), roof = hex('#77797a'), sign = hex('#a69a80')
  const raw: P[] = fit.ring?.length ? fit.ring.map((q) => [q.x, q.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const ring = area(raw) < 0 ? [...raw].reverse() : raw
  const n = ring.length
  const eave = K.GROUND + K.FLOORS * K.FLOOR + K.CORNICE, top1 = eave + K.SET1_H, top2 = top1 + K.SET2_H
  const q = (pts: V3[], nrm: V3, c: Rgb): void => out.quad(pts, nrm, UV, c, 0)
  const tri = (a: V3, b: V3, c2: V3, nrm: V3, c: Rgb): void => out.quad([a, b, c2, a], nrm, UV, c, 0)
  const nrmOf = (a: P, b: P): P => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / l, -(b[0] - a[0]) / l] }
  const insetBy = (d: number): P[] => ring.map((p, i) => {
    const n1 = nrmOf(ring[(i + n - 1) % n], p), n2 = nrmOf(p, ring[(i + 1) % n])
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml
    const k = Math.min(3, 1 / Math.max(0.35, mx * n1[0] + mz * n1[1]))
    return [p[0] - mx * d * k, p[1] - mz * d * k]
  })
  const in1 = insetBy(K.SET1), in2 = insetBy(K.SET2)

  type F = { a: P, u: P, nx: number, nz: number, l: number }
  const frame = (a: P, b: P): F => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, [nx, nz] = nrmOf(a, b); return { a, u: [(b[0] - a[0]) / l, (b[1] - a[1]) / l], nx, nz, l } }
  const P3 = (f: F, s: number, v: number, y: number): V3 => [f.a[0] + f.u[0] * s + f.nx * v, y, f.a[1] + f.u[1] * s + f.nz * v]
  const face = (f: F, s0: number, s1: number, y0: number, y1: number, v: number, c: Rgb): void => {
    if (y1 - y0 < 0.01 || s1 - s0 < 0.01) return
    q([P3(f, s0, v, y0), P3(f, s1, v, y0), P3(f, s1, v, y1), P3(f, s0, v, y1)], [f.nx, 0, f.nz], c)
  }
  const boss = (f: F, s0: number, s1: number, y0: number, y1: number, v: number, c: Rgb, top = true): void => {
    face(f, s0, s1, y0, y1, v, c)
    q([P3(f, s0, 0, y0), P3(f, s0, v, y0), P3(f, s0, v, y1), P3(f, s0, 0, y1)], [-f.u[0], 0, -f.u[1]], c)
    q([P3(f, s1, v, y0), P3(f, s1, 0, y0), P3(f, s1, 0, y1), P3(f, s1, v, y1)], [f.u[0], 0, f.u[1]], c)
    if (top) q([P3(f, s0, v, y1), P3(f, s1, v, y1), P3(f, s1, 0, y1), P3(f, s0, 0, y1)], [0, 1, 0], c)
  }
  const arch = (f: F, c: number, w: number, y0: number, y1: number, v: number, col: Rgb): void => {
    const r = w / 2, spring = y1 - r
    face(f, c - r, c + r, y0, spring, v, col)
    for (let k = 0; k < K.ARCH_SEG; k++) {
      const t0 = Math.PI * k / K.ARCH_SEG, t1 = Math.PI * (k + 1) / K.ARCH_SEG
      tri(P3(f, c, v, spring), P3(f, c + r * Math.cos(t0), v, spring + r * Math.sin(t0)), P3(f, c + r * Math.cos(t1), v, spring + r * Math.sin(t1)), [f.nx, 0, f.nz], col)
    }
  }
  /** fluted pier: a proud shaft with two flute grooves, rounded cap rising above the eave */
  const pier = (f: F, s: number): void => {
    const h = K.PIER_W / 2
    boss(f, s - h, s + h, K.GROUND - 0.4, eave + K.PIER_CAP * 0.5, K.PIER_OUT, stoneLt, false)
    for (const d of [-h / 3, h / 3]) face(f, s + d - 0.06, s + d + 0.06, K.GROUND, eave - 0.4, K.PIER_OUT + 0.01, stoneDk)
    const y0 = eave + K.PIER_CAP * 0.5, seg = 4
    for (let k = 0; k < seg; k++) { // quarter-round cap as stepped segments
      const a0 = Math.PI / 2 * k / seg, a1 = Math.PI / 2 * (k + 1) / seg, r = K.PIER_OUT
      const v0 = r * Math.cos(a0), v1 = r * Math.cos(a1), yA = y0 + K.PIER_CAP * 0.5 * Math.sin(a0), yB = y0 + K.PIER_CAP * 0.5 * Math.sin(a1)
      q([P3(f, s - h, v0, yA), P3(f, s + h, v0, yA), P3(f, s + h, v1, yB), P3(f, s - h, v1, yB)], [f.nx * 0.7, 0.7, f.nz * 0.7], stoneLt)
      q([P3(f, s - h, 0, yA), P3(f, s - h, v0, yA), P3(f, s - h, v1, yB), P3(f, s - h, 0, yB)], [-f.u[0], 0, -f.u[1]], stoneLt)
      q([P3(f, s + h, v0, yA), P3(f, s + h, 0, yA), P3(f, s + h, 0, yB), P3(f, s + h, v1, yB)], [f.u[0], 0, f.u[1]], stoneLt)
    }
  }

  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], f = frame(a, b), l = f.l
    if (l < 0.2) continue
    const corner = l < K.CORNER_L
    // set-back storeys and terraces
    const f1 = frame(in1[i], in1[(i + 1) % n]), f2 = frame(in2[i], in2[(i + 1) % n])
    q([[a[0], eave, a[1]], [b[0], eave, b[1]], [in1[(i + 1) % n][0], eave, in1[(i + 1) % n][1]], [in1[i][0], eave, in1[i][1]]], [0, 1, 0], roof)
    q([[in1[i][0], top1, in1[i][1]], [in1[(i + 1) % n][0], top1, in1[(i + 1) % n][1]], [in2[(i + 1) % n][0], top1, in2[(i + 1) % n][1]], [in2[i][0], top1, in2[i][1]]], [0, 1, 0], roof)
    face(f, 0, l, eave, eave + K.PARAPET, 0, stoneLt)
    face(f1, 0, f1.l, eave, top1, 0, stone); face(f1, 0, f1.l, top1, top1 + K.PARAPET, 0, stoneLt)
    face(f2, 0, f2.l, top1, top2, 0, stone)
    if (corner) { // raised corner block with the lettering band
      boss(f2, 0, f2.l, top2, top2 + K.CORNER_UP, 0, stone)
      face(f2, 0.6, f2.l - 0.6, top2 + 0.8, top2 + 2.0, 0.03, sign)
    }
    for (const [ff, y0, y1] of [[f1, eave + 0.7, top1 - 0.4], [f2, top1 + 0.5, top2 - 0.3]] as [F, number, number][]) {
      const nw = Math.floor(ff.l / K.BAY)
      for (let w = 0; w < nw; w++) arch(ff, (w + 0.5) * ff.l / nw, K.ARCH_W, y0, y1, 0.04, glass)
    }
    // main wall
    face(f, 0, l, K.GROUND, eave, 0, stone)
    boss(f, 0, l, eave - K.CORNICE, eave, 0.35, stoneLt)
    boss(f, 0, l, K.GROUND - 0.4, K.GROUND, 0.25, stoneLt)
    if (corner) {
      face(f, 0, l, 0, K.GROUND, 0, stoneDk)
      const dw = Math.min(K.DOOR_W, l - 2 * K.PIER_W - 0.4)
      face(f, l / 2 - dw / 2, l / 2 + dw / 2, 0, K.DOOR_H, 0.04, dark)
      for (let fl = 0; fl < K.FLOORS; fl++) { const y = K.GROUND + fl * K.FLOOR; if (y + 0.5 > K.DOOR_H) face(f, l / 2 - dw / 2, l / 2 + dw / 2, y + 0.5, y + K.FLOOR - 0.5, K.WIN_IN, glass) }
      pier(f, K.PIER_W / 2 + 0.05); pier(f, l - K.PIER_W / 2 - 0.05)
      continue
    }
    const nb = Math.max(1, Math.round((l - 2 * K.MARGIN) / K.BAY)), bw = (l - 2 * K.MARGIN) / nb
    // ground arcade: piers proud, dark recess between
    face(f, 0, l, 0, K.GROUND - 0.4, -K.ARC_IN, dark)
    for (let w = 0; w <= nb; w++) {
      const s = K.MARGIN + w * bw
      boss(f, Math.max(0, s - K.ARC_W / 2), Math.min(l, s + K.ARC_W / 2), 0, K.GROUND - 0.4, 0, stone, false)
      face({ ...f, a: [f.a[0] - f.nx * K.ARC_IN, f.a[1] - f.nz * K.ARC_IN] }, Math.max(0, s - K.ARC_W / 2), Math.min(l, s + K.ARC_W / 2), 0, K.GROUND - 0.4, K.ARC_IN, stone)
    }
    boss(f, 0, K.MARGIN, 0, K.GROUND, 0.01, stone, false); boss(f, l - K.MARGIN, l, 0, K.GROUND, 0.01, stone, false)
    // window bays: paired lights as one recessed glazed panel per floor, thin string courses
    for (let w = 0; w < nb; w++) {
      const c = K.MARGIN + (w + 0.5) * bw
      for (let fl = 0; fl < K.FLOORS; fl++) {
        const y = K.GROUND + fl * K.FLOOR
        face(f, c - K.WIN_W / 2, c + K.WIN_W / 2, y + 0.75, y + K.FLOOR - 0.35, K.WIN_IN, glass)
        face(f, c - 0.05, c + 0.05, y + 0.75, y + K.FLOOR - 0.35, K.WIN_IN + 0.01, stoneLt)
      }
    }
    for (let fl = 1; fl < K.FLOORS; fl++) boss(f, 0, l, K.GROUND + fl * K.FLOOR + 0.55, K.GROUND + fl * K.FLOOR + 0.7, 0.08, stoneLt, false)
    for (let w = 0; w <= nb; w += K.PIER_EVERY) pier(f, K.MARGIN + w * bw)
    if (nb % K.PIER_EVERY) pier(f, l - K.MARGIN)
  }

  // flat roof: ear-clipped top inset ring
  const idx = in2.map((_, i) => i), cross = (a: P, b: P, c: P): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  const T = (a: P, b: P, c: P): void => q([[c[0], top2, c[1]], [b[0], top2, b[1]], [a[0], top2, a[1]], [c[0], top2, c[1]]], [0, 1, 0], roof)
  let guard = 0
  while (idx.length > 3 && guard++ < 400) {
    let cut = false
    for (let i = 0; i < idx.length && !cut; i++) {
      const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length], a = in2[ia], b = in2[ib], c = in2[ic]
      if (cross(a, b, c) <= 1e-9) continue
      if (idx.some((k) => k !== ia && k !== ib && k !== ic && cross(a, b, in2[k]) >= 0 && cross(b, c, in2[k]) >= 0 && cross(c, a, in2[k]) >= 0)) continue
      T(a, b, c); idx.splice(i, 1); cut = true
    }
    if (!cut) break
  }
  if (idx.length === 3) T(in2[idx[0]], in2[idx[1]], in2[idx[2]])
}
