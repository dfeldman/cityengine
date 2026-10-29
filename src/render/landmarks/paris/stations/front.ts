/**
 * The termini's stone fronts: the pieces every one of them is made of, in the kit's frame (the front faces local −z,
 * x along it, y up). The body of a station is its OSM outline raised and dressed (`body`); the composition along
 * the forecourt — a pavilion, an arch, a colonnade, the statues on the skyline — is laid on the front plane by the
 * station's own builder with these.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { capPolygon } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { faceBand, type Face } from '../../tower.ts'
import { sign } from '../../parts.ts'
import { archedPane, beam, block, column, pane, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const ASHLAR = surfaceTag('ashlar')

/** The fit's ring, or its box where there is none (the model showcase): anticlockwise. */
export function ringOf(fit: Fit): P2[] {
  if (fit.ring && fit.ring.length >= 3) return fit.ring
  return [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
}

/**
 * The station's body: the whole outline raised to `eaves`, every wall dressed with `face`, and a roof over it
 * (flat zinc at `eaves`, or with `roof` a low hip of that colour). What stands proud of it on the front is the
 * builder's.
 */
export function body(out: MeshBuilder, ring: P2[], eaves: number, face: Face, roofC: Rgb,
  opts: { roofRise?: number; plainFront?: boolean } = {}): void {
  // the walls facing −z are left plain when the builder dresses its own front over them (two sets of windows
  // a few centimetres apart read as clutter, and fight)
  const front: number[] = [], rest: number[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    ;(opts.plainFront && (b.x - a.x) / L > 0.9 ? front : rest).push(i)
  }
  faceBand(out, ring, 0, eaves, face, rest)
  if (front.length) faceBand(out, ring, 0, eaves, { kind: 'blank', wall: face.wall, material: face.material ?? 'ashlar' }, front)
  capPolygon(out, ring, eaves, roofC, surfaceTag('metal'))
  if (opts.roofRise) {
    // (a parapet's cornice round the top, which is what a stone station's eaves read as from the street)
    faceBand(out, ring, eaves, eaves + opts.roofRise, { kind: 'blank', wall: shade(face.wall, 0.9), material: 'ashlar' })
    capPolygon(out, ring, eaves + opts.roofRise, roofC, surfaceTag('metal'))
  }
}

/** The z of the front wall at x: the frontmost (least z) of the ring's edges facing −z that span x. */
export function frontAt(ring: P2[], x: number): number {
  let best = Infinity
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.5 || (b.x - a.x) / L < 0.8) continue   // an edge facing −z runs +x in an anticlockwise ring
    if (x < Math.min(a.x, b.x) - 0.01 || x > Math.max(a.x, b.x) + 0.01) continue
    const z = a.z + ((x - a.x) * (b.z - a.z)) / (b.x - a.x)
    best = Math.min(best, z)
  }
  return best
}

/** A standing figure on a pedestal — the cities on the Gare du Nord, the allegories on the Gare de Lyon. */
export function statue(out: MeshBuilder, x: number, y: number, z: number, h: number, c: Rgb, pedestal = true): void {
  let y0 = y
  if (pedestal) { box(out, x, y + h * 0.09, z, h * 0.17, h * 0.09, h * 0.17, shade(c, 0.92), FIXED); y0 += h * 0.18 }
  // the robe, wider at the hem; the shoulders; the head; an arm holding up an attribute (a shield, a mural crown)
  prism(out, x, z, y0, y0 + h * 0.6, h * 0.17, 8, c, ASHLAR, h * 0.12)
  prism(out, x, z, y0 + h * 0.6, y0 + h * 0.78, h * 0.13, 8, c, ASHLAR, h * 0.1)
  prism(out, x, z, y0 + h * 0.78, y0 + h * 0.8, h * 0.05, 6, c, ASHLAR, h * 0.05)
  prism(out, x, z, y0 + h * 0.8, y0 + h * 0.96, h * 0.075, 7, c, ASHLAR, h * 0.06)
  prism(out, x, z, y0 + h * 0.96, y0 + h, h * 0.065, 7, shade(c, 0.95), ASHLAR, h * 0.05)
  box(out, x + h * 0.17, y0 + h * 0.4, z - h * 0.06, h * 0.035, h * 0.16, h * 0.13, shade(c, 0.95), FIXED)
}

/** An arch's moulded band on a −z face: the voussoirs between radii r0 and r1 round (cx, yc). */
export function archBand(out: MeshBuilder, plane: number, cx: number, yc: number, r0: number, r1: number, c: Rgb, n = 16): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI
    out.quad([[cx + Math.cos(a0) * r0, yc + Math.sin(a0) * r0, plane], [cx + Math.cos(a1) * r0, yc + Math.sin(a1) * r0, plane],
      [cx + Math.cos(a1) * r1, yc + Math.sin(a1) * r1, plane], [cx + Math.cos(a0) * r1, yc + Math.sin(a0) * r1, plane]],
    [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], c, ASHLAR)
  }
  // the keystone
  box(out, cx, yc + (r0 + r1) / 2, plane - 0.15, (r1 - r0) * 0.35, (r1 - r0) * 0.6, 0.15, shade(c, 1.04), FIXED)
}

/**
 * A great glazed arch on a −z face — the Gare du Nord's, the Gare de l'Est's rose — with its iron glazing bars:
 * mullions every `pitch`, transoms at each of `transoms` (heights), clipped to the arch.
 */
export function glazedArch(out: MeshBuilder, plane: number, cx: number, y0: number, w: number, h: number,
  glass: Rgb, bars: Rgb, opts: { pitch?: number; transoms?: number[]; fan?: boolean } = {}): void {
  archedPane(out, plane, cx, y0, w, h, glass)
  const r = w / 2, yc = y0 + h - r
  const top = (x: number): number => yc + Math.sqrt(Math.max(0, r * r - (x - cx) ** 2))
  const pitch = opts.pitch ?? 2.4
  const n = Math.max(2, Math.round(w / pitch))
  if (opts.fan) {
    // a rose: bars radiating from the springing's middle
    for (let k = 1; k < n; k++) {
      const a = (k / n) * Math.PI
      beam(out, [cx, yc, plane - 0.1], [cx + Math.cos(a) * r, yc + Math.sin(a) * r, plane - 0.1], 0.09, bars)
    }
    if (yc - y0 > 0.5) for (let k = 1; k < n; k++) { const x = cx - r + (w * k) / n; beam(out, [x, y0, plane - 0.1], [x, yc, plane - 0.1], 0.09, bars) }
  } else {
    for (let k = 1; k < n; k++) {
      const x = cx - r + (w * k) / n
      beam(out, [x, y0, plane - 0.1], [x, top(x) - 0.1, plane - 0.1], k % 2 ? 0.07 : 0.12, bars)
    }
  }
  for (const y of opts.transoms ?? [yc]) {
    const half = y <= yc ? r : Math.sqrt(Math.max(0, r * r - (y - yc) ** 2))
    beam(out, [cx - half, y, plane - 0.12], [cx + half, y, plane - 0.12], 0.11, bars)
  }
}

/** A giant pilaster on a −z face: the shaft (fluted, as three strips), its base and an Ionic capital. */
export function pilaster(out: MeshBuilder, x: number, z: number, y0: number, y1: number, w: number, c: Rgb): void {
  block(out, x - w / 2, x + w / 2, z - 0.45, z, y0, y1, c)
  for (const f of [-0.28, 0, 0.28]) pane(out, '-z', z - 0.45, x + f * w, y0 + 1.2, w * 0.08, y1 - y0 - 2.6, shade(c, 0.86), 0.02)
  block(out, x - w / 2 - 0.25, x + w / 2 + 0.25, z - 0.65, z, y0, y0 + 0.9, shade(c, 0.95))
  block(out, x - w / 2 - 0.35, x + w / 2 + 0.35, z - 0.75, z, y1 - 1.1, y1, shade(c, 1.03))
  // the volutes, either side of the capital
  for (const s of [-1, 1]) prism(out, x + s * (w / 2 + 0.1), z - 0.8, y1 - 0.95, y1 - 0.25, 0.32, 8, shade(c, 0.98), FIXED)
}

/** A row of free-standing columns along a −z face (a portico, a ground-floor colonnade), with dark glazing behind. */
export function colonnade(out: MeshBuilder, x0: number, x1: number, z: number, y0: number, y1: number, n: number, c: Rgb,
  glass: Rgb, r = 0.55): void {
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n
    column(out, x, z - 1.2, y0, y1, r, c)
    if (i < n - 1) {
      const xm = x0 + ((x1 - x0) * (i + 1)) / n
      pane(out, '-z', z, xm, y0, (x1 - x0) / n - r * 2.4, (y1 - y0) * 0.92, glass)
    }
  }
}

/** Engraved capitals on a −z face (the station's name over the door, NORD on a pier). */
export function engraved(out: MeshBuilder, text: string, x: number, y: number, z: number, h: number, w?: number, colour: Rgb = [0.28, 0.25, 0.2]): void {
  sign(out, { type: 'flat', text, h, face: 'roman', colour, tracking: 0.22, lit: 'none', ...(w ? { w } : {}) }, { x, y, z, heading: Math.PI })
}

/** A square frustum, axis-aligned (a `prism` of four sides stands on its corners): a pavilion's dome, a tower stage. */
export function frustum(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number, w0: number, w1: number, c: Rgb, tag = FIXED,
  d0 = w0, d1 = w1): void {
  const lo: [number, number][] = [[-w0, -d0], [w0, -d0], [w0, d0], [-w0, d0]]
  const hi: [number, number][] = [[-w1, -d1], [w1, -d1], [w1, d1], [-w1, d1]]
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    const mx = (lo[i][0] + lo[j][0]) / 2, mz = (lo[i][1] + lo[j][1]) / 2, L = Math.hypot(mx, mz) || 1
    const lean = (w0 - w1) / Math.max(0.01, y1 - y0)
    out.quad([[cx + lo[i][0], y0, cz + lo[i][1]], [cx + lo[j][0], y0, cz + lo[j][1]], [cx + hi[j][0], y1, cz + hi[j][1]], [cx + hi[i][0], y1, cz + hi[i][1]]],
      [mx / L, lean, mz / L], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
  if (w1 > 0.01) out.quad([[cx - w1, y1, cz - d1], [cx + w1, y1, cz - d1], [cx + w1, y1, cz + d1], [cx - w1, y1, cz + d1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
}

/** A ring clipped to the box x0..x1 × z0..z1 (Sutherland–Hodgman): a station's head band or a side range out of its outline. */
export function clipBox(ring: P2[], x0: number, x1: number, z0: number, z1: number): P2[] {
  let r = ring
  const sides: [(p: P2) => boolean, (a: P2, b: P2) => P2][] = [
    [(p) => p.x >= x0, (a, b) => ({ x: x0, z: a.z + ((x0 - a.x) * (b.z - a.z)) / (b.x - a.x) })],
    [(p) => p.x <= x1, (a, b) => ({ x: x1, z: a.z + ((x1 - a.x) * (b.z - a.z)) / (b.x - a.x) })],
    [(p) => p.z >= z0, (a, b) => ({ x: a.x + ((z0 - a.z) * (b.x - a.x)) / (b.z - a.z), z: z0 })],
    [(p) => p.z <= z1, (a, b) => ({ x: a.x + ((z1 - a.z) * (b.x - a.x)) / (b.z - a.z), z: z1 })],
  ]
  for (const [inside, cut] of sides) {
    const o: P2[] = []
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length]
      if (inside(b)) { if (!inside(a)) o.push(cut(a, b)); o.push(b) } else if (inside(a)) o.push(cut(a, b))
    }
    r = o
    if (r.length < 3) return []
  }
  // (the clip leaves points along a cut edge that are collinear: harmless, but drop exact repeats)
  return r.filter((p, i) => { const q = r[(i + 1) % r.length]; return Math.hypot(p.x - q.x, p.z - q.z) > 0.05 })
}

/**
 * A classical station RANGE on the front plane (−z): the ground floor's arcade of great round arches between
 * rusticated piers, the first floor's windows over a balustrade, the attic's oculi, the cornice and its balustrade
 * — the Gare de Lyon's, Saint-Lazare's, the Gare de l'Est's and Austerlitz's fronts all say this. `zAt(x)` is the
 * front wall's z there. `dormers` puts a stone dormer on the mansard over each bay.
 */
export function range(out: MeshBuilder, x0: number, x1: number, zAt: (x: number) => number, o: {
  stone: Rgb; glass: Rgb; pitch?: number; arcade?: number; eaves?: number; dormers?: boolean; paired?: boolean
}): void {
  const { stone, glass } = o
  const deep = shade(stone, 0.85), pale = shade(stone, 1.04)
  const eaves = o.eaves ?? 20.5
  const arc = o.arcade ?? 9.6
  const bays = Math.max(2, Math.round((x1 - x0) / (o.pitch ?? 9.8)))
  const bw = (x1 - x0) / bays
  for (let i = 0; i < bays; i++) {
    const xa = x0 + bw * i, xb = xa + bw, xm = (xa + xb) / 2
    const zf = zAt(xm)
    block(out, xa, xa + 1.4, zf - 0.6, zf, 0, arc, shade(stone, 0.96))
    block(out, xb - 1.4, xb, zf - 0.6, zf, 0, arc, shade(stone, 0.96))
    const aw = Math.min(bw - 3.2, arc * 0.75)
    archedPane(out, zf - 0.05, xm, 0.4, aw, arc - 1, glass)
    archBand(out, zf - 0.08, xm, arc - 0.6 - aw / 2, aw / 2, aw / 2 + 0.6, pale, 12)
    // the band over the arcade
    block(out, xa, xb, zf - 0.9, zf, arc, arc + 1, deep)
    // the first floor (and a second where the range is tall): arched or paired windows with a balustrade
    const storeys = Math.max(1, Math.floor((eaves - arc - 4.5) / 5))
    for (let s = 0; s < storeys; s++) {
      const y = arc + 1.6 + s * 5.2
      for (const f of o.paired === false ? [0] : [-0.22, 0.22]) {
        const w = o.paired === false ? bw * 0.42 : 1.7
        if (s === 0) archedPane(out, zf - 0.06, xm + f * bw, y, w, 4.4, glass)
        else pane(out, '-z', zf - 0.06, xm + f * bw, y, w, 3.6, glass)
        block(out, xm + f * bw - w / 2 - 0.3, xm + f * bw + w / 2 + 0.3, zf - 0.5, zf, y - 0.4, y + 0.2, pale)
      }
    }
    pane(out, '-z', zf - 0.06, xm, eaves - 3.2, 1.3, 1.3, glass)
    // the cornice and its balustrade
    block(out, xa, xb, zf - 1.2, zf, eaves - 1.3, eaves, deep)
    block(out, xa, xb, zf - 0.7, zf + 0.2, eaves, eaves + 1.1, pale)
    if (o.dormers) {
      const zr = zf + 1.2
      block(out, xm - 1.4, xm + 1.4, zr - 0.4, zr + 2.2, eaves, eaves + 3.9, stone)
      archedPane(out, zr - 0.43, xm, eaves + 0.5, 1.6, 2.6, glass)
      prism(out, xm, zr + 0.9, eaves + 3.9, eaves + 4.9, 1.6, 4, deep, FIXED, 0.2)
    }
  }
}

/** The z of a ring's front at x, or `fallback` where no edge facing −z spans it. */
export const frontOr = (ring: P2[], fallback: number) => (x: number): number => {
  const z = frontAt(ring, x)
  return Number.isFinite(z) ? z : fallback
}
