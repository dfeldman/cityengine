import type { MeshBuilder } from '../../buildings.ts'
import { beam, hex, type Rgb } from '../kit.ts'
import { FIXED } from '../../models.ts'
import type { Fit } from '../fit.ts'

// tunables, read off the owner's street photograph (2026-11-04); local −z is the Place de la Bastille side
const GROUND_H = 4.4        // the glazed ground storey behind the W piers
const SOFFIT = 1.0          // the dark faceted band the upper block sits on
const STOREY = 2.9
const STOREYS = 7
const RECESS = 0.9          // the ground-storey glass stands back from the upper block
const PIER_W = 0.55         // the white V-piers
const V_SPAN = 4.2          // street length per V
const GLASS_FACING = -0.2   // an edge whose outward normal has z below this is mirrored glass (faces the plaza)
const LOUVRE = 0.9         // spacing of the sunshade slats over the glass
const MULLION = 2.4
const WIN_BAY = 3.0       // one window column per this much wall
const WIN_W = 1.1, WIN_H = 1.6, WIN_SILL = 0.7
const SPIKE_H = 5.5         // the white blade over the prow corner
const TAG_GLASS = 6, TAG_PANEL = 15

type P = { x: number; z: number }

/**
 * Le Bis (ENSCI annexe), 2 bd de la Bastille / rue de Lyon corner (way 118754152). An eight-storey corner block:
 * a glazed ground storey behind a row of white concrete V-piers, a dark faceted soffit, then a bronze-grey panel
 * block punched with small windows over orange and pink spandrels, and a prow of mirrored glass with sunshade
 * louvres turned to the Place de la Bastille, topped by a white blade.
 */
export function leBisEnsci(out: MeshBuilder, fit: Fit): void {
  const panel = hex('#6e6a64'), glassC = hex('#9fb6cc'), frame = hex('#7d7468'), pier = hex('#dcdcd6')
  const soffit = hex('#2e2c2a'), dark = hex('#2a3138'), orange = hex('#e8742a'), pink = hex('#cf5468'), white = hex('#f2f2ee')
  const ring: P[] = fit.ring && fit.ring.length >= 3 ? fit.ring : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length, cz = ring.reduce((s, p) => s + p.z, 0) / ring.length
  const inner = ring.map(p => shrink(p, cx, cz, RECESS))
  const y1 = GROUND_H + SOFFIT, top = y1 + STOREY * STOREYS

  cap(out, inner, 0.05, soffit)                 // ground-storey ceiling seen through the glass is skipped; floor
  cap(out, ring, top, panel)
  edges(ring, (a, b, n, len) => {
    const glass = n[2] < GLASS_FACING
    // the ground storey: glass behind, W piers on the street line, then the soffit band
    const ia = shrink(a, cx, cz, RECESS), ib = shrink(b, cx, cz, RECESS)
    wall(out, ia, ib, 0, GROUND_H, n, dark, TAG_GLASS)
    wall(out, a, b, GROUND_H, y1, n, soffit, FIXED)
    under(out, a, b, ia, ib, GROUND_H, soffit)
    const vs = Math.max(1, Math.round(len / V_SPAN))
    for (let i = 0; i < vs; i++) {
      const p0 = lerp(a, b, i / vs), pm = lerp(a, b, (i + 0.5) / vs), p1 = lerp(a, b, (i + 1) / vs)
      beam(out, [p0.x, GROUND_H, p0.z], [pm.x, 0, pm.z], PIER_W / 2, pier)
      beam(out, [pm.x, 0, pm.z], [p1.x, GROUND_H, p1.z], PIER_W / 2, pier)
    }
    if (glass) {
      // the mirrored prow: glass, a bronze frame grid and sunshade slats
      wall(out, a, b, y1, top, n, glassC, FIXED)   // flat sky-blue: the GLASS surface's lit rooms read as tiles
      const o = (p: P, d: number): P => ({ x: p.x + n[0] * d, z: p.z + n[2] * d })
      const m = Math.max(1, Math.round(len / MULLION))
      for (let i = 0; i <= m; i++) { const p = o(lerp(a, b, i / m), 0.08); beam(out, [p.x, y1, p.z], [p.x, top, p.z], 0.07, frame) }
      for (let s = 0; s <= STOREYS; s += 2) { const y = y1 + s * STOREY; const pa = o(a, 0.1), pb = o(b, 0.1); beam(out, [pa.x, y, pa.z], [pb.x, y, pb.z], 0.09, frame) }
      for (let y = y1 + LOUVRE; y < top; y += LOUVRE) {
        const pa = o(a, 0.2), pb = o(b, 0.2)
        beam(out, [pa.x, y, pa.z], [pb.x, y, pb.z], 0.02, frame, 0.07)
      }
    } else {
      wall(out, a, b, y1, top, n, panel, TAG_PANEL)
      // small windows over orange and pink spandrels, staggered storey to storey
      const per = Math.max(1, Math.floor(len / WIN_BAY))
      for (let s = 0; s < STOREYS; s++) for (let i = 0; i < per; i++) {
        if ((s * 5 + i * 3) % 7 === 3) continue   // the odd blank bay
        const t = (i + 0.5) / per, p = lerp(a, b, t)
        const y = y1 + s * STOREY + WIN_SILL, ux = (b.x - a.x) / len, uz = (b.z - a.z) / len
        const l = { x: p.x - ux * WIN_W / 2 + n[0] * 0.04, z: p.z - uz * WIN_W / 2 + n[2] * 0.04 }
        const r = { x: p.x + ux * WIN_W / 2 + n[0] * 0.04, z: p.z + uz * WIN_W / 2 + n[2] * 0.04 }
        wall(out, l, r, y, y + WIN_H * 0.68, n, dark, TAG_GLASS)
        wall(out, l, r, y + WIN_H * 0.68, y + WIN_H, n, (s + i) % 3 === 0 ? pink : orange, FIXED)
        // the folding shutter leaf beside each window
        const f = { x: r.x + n[0] * 0.25, z: r.z + n[2] * 0.25 }
        beam(out, [f.x, y, f.z], [f.x, y + WIN_H, f.z], 0.06, panel, 0.3)
      }
    }
  })
  // the white blade over the prow: at the vertex furthest toward the plaza
  let k = 0
  for (let i = 1; i < ring.length; i++) if (ring[i].z < ring[k].z) k = i
  const v = ring[k], w = shrink(v, cx, cz, 3.5)
  out.quad([[v.x, top, v.z], [w.x, top, w.z], [v.x, top + SPIKE_H, v.z], [v.x, top + SPIKE_H, v.z]],
    side(v, w), [[0, 0], [1, 0], [1, 1], [0, 1]], white, FIXED)
  out.quad([[w.x, top, w.z], [v.x, top, v.z], [v.x, top + SPIKE_H, v.z], [v.x, top + SPIKE_H, v.z]],
    neg(side(v, w)), [[0, 0], [1, 0], [1, 1], [0, 1]], white, FIXED)
}

function lerp(a: P, b: P, t: number): P { return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t } }
function shrink(p: P, cx: number, cz: number, d: number): P {
  const dx = cx - p.x, dz = cz - p.z, l = Math.hypot(dx, dz) || 1
  return { x: p.x + dx / l * Math.min(d, l * 0.5), z: p.z + dz / l * Math.min(d, l * 0.5) }
}
function side(a: P, b: P): [number, number, number] { const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; return [dz / l, 0, -dx / l] }
function neg(n: [number, number, number]): [number, number, number] { return [-n[0], -n[1], -n[2]] }

/** Each footprint edge with its outward normal. */
function edges(ring: P[], f: (a: P, b: P, n: [number, number, number], len: number) => void): void {
  const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length, cz = ring.reduce((s, p) => s + p.z, 0) / ring.length
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], len = Math.hypot(b.x - a.x, b.z - a.z)
    if (len < 0.3) continue
    let n = side(a, b)
    if (n[0] * ((a.x + b.x) / 2 - cx) + n[2] * ((a.z + b.z) / 2 - cz) < 0) n = neg(n)
    f(a, b, n, len)
  }
}

function wall(out: MeshBuilder, a: P, b: P, y0: number, y1: number, n: [number, number, number], c: Rgb, tag: number): void {
  const w = Math.hypot(b.x - a.x, b.z - a.z), h = y1 - y0
  out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], n, [[0, 0], [w, 0], [w, h], [0, h]], c, tag)
}
/** The soffit strip between the street line and the recessed glass. */
function under(out: MeshBuilder, a: P, b: P, ia: P, ib: P, y: number, c: Rgb): void {
  out.quad([[a.x, y, a.z], [b.x, y, b.z], [ib.x, y, ib.z], [ia.x, y, ia.z]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
}
/** A flat fan over the (near-convex) footprint. */
function cap(out: MeshBuilder, ring: P[], y: number, c: Rgb): void {
  const o = ring[0]
  for (let i = 1; i + 1 < ring.length; i++) {
    const p = ring[i], q = ring[i + 1]
    out.quad([[o.x, y, o.z], [p.x, y, p.z], [q.x, y, q.z], [q.x, y, q.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
}
