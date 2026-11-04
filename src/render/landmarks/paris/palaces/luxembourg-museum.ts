/**
 * THE MUSÉE DU LUXEMBOURG AND THE ORANGERIE DU SÉNAT (owner's photographs, 2026-11-03).
 *
 * MUSÉE DU LUXEMBOURG (OSM way 170226810, 19 × 43 m, its front on the Rue de Vaugirard): a stone pavilion of 1886 —
 * paired pilasters at the corners, a red-brick centre, the great door under a segmental pediment and its cartouche, steps
 * up to it, "MUSÉE DU LUXEMBOURG" on the frieze, a sculpted pediment with a finial on the roof — and behind it the long
 * gallery, its walls dressed in a grey-green frame with white diagonal trellis, under a slate roof. Local −z is the
 * front, bearing ~3.
 *
 * L'ORANGERIE DU SÉNAT (OSM way 62848404, 73 × 15 m, Gisors 1839): red brick on a stone base, tall round-headed windows
 * in stone surrounds toward the garden (−z, south), a bust in a roundel between each pair, a cornice and balustrade
 * sections along the top. In front of it, on that stretch of the garden only, palms and orange trees in green Versailles
 * planters.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, fitted, hipRoof, palette, pedimentOn, rectOn, segmentOn, slabOn, type F } from './common.ts'

const BRICK: Rgb = [0.6, 0.3, 0.24]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const N: Record<F, [number, number, number]> = { '-z': [0, 0, -1], '+z': [0, 0, 1], '-x': [-1, 0, 0], '+x': [1, 0, 0] }
const at = (f: F, plane: number, t: number, y: number, d: number): [number, number, number] =>
  f === '-z' ? [t, y, plane - d] : f === '+z' ? [t, y, plane + d] : f === '-x' ? [plane - d, y, t] : [plane + d, y, t]

/** A diagonal trellis over t0..t1 × y0..y1 on a face: two families of 45° laths, `pitch` apart, `w` wide. */
function trellis(out: MeshBuilder, f: F, plane: number, t0: number, t1: number, y0: number, y1: number, pitch: number, w: number, c: Rgb, tag: number): void {
  for (const s of [1, -1]) {
    // lines y = s·t + k, k stepping so the family covers the rectangle
    const ks = [y0 - s * t0, y0 - s * t1, y1 - s * t0, y1 - s * t1]
    for (let k = Math.min(...ks); k <= Math.max(...ks); k += pitch) {
      // clip to the rectangle
      let ta = (y0 - k) / s, tb = (y1 - k) / s
      if (ta > tb) [ta, tb] = [tb, ta]
      ta = Math.max(ta, t0)
      tb = Math.min(tb, t1)
      if (tb - ta < 0.05) continue
      const ya = s * ta + k, yb = s * tb + k
      const h = w / 2
      out.quad([at(f, plane, Math.max(t0, ta - h), ya, 0.05), at(f, plane, Math.max(t0, tb - h), yb, 0.05),
        at(f, plane, Math.min(t1, tb + h), yb, 0.05), at(f, plane, Math.min(t1, ta + h), ya, 0.05)], N[f], UV, c, tag)
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
const MX = 9.7
const MZ = 21.5
export function luxembourgMuseum(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, MX, MZ, (q) => museum(q))
}

function museum(out: MeshBuilder): void {
  const p = palette('#cfc4a8', '#55606a')
  const brick = surfaceTag('brick')
  const plain = surfaceTag('stucco')
  const zf = -MZ
  const zb = -15.5
  const cornice = 13.4

  // ---- the gallery behind: trellised walls under a slate roof
  const eaves = 9.6
  box(out, 0, eaves / 2, (zb + MZ) / 2, MX - 0.3, eaves / 2, (MZ - zb) / 2, [0.5, 0.55, 0.52], plain)
  hipRoof(out, -MX + 0.3, MX - 0.3, zb, MZ, eaves, 3.4, p.slate, 0.6)
  const frame: Rgb = [0.4, 0.45, 0.42]
  const lath: Rgb = [0.86, 0.88, 0.86]
  const lt = surfaceTag('panel')
  for (const [f, plane] of [['-x', -MX + 0.3], ['+x', MX - 0.3]] as [F, number][]) {
    const bay = 3.3
    for (let t = zb + 0.3; t + bay <= MZ; t += bay) {
      trellis(out, f, plane, t + 0.2, t + bay - 0.2, 0.6, 7.3, 0.6, 0.13, lath, lt)
      trellis(out, f, plane, t + 0.2, t + bay - 0.2, 7.7, eaves - 0.3, 0.5, 0.12, lath, lt)
    }
    rectOn(out, f, plane, zb, MZ, 7.35, 7.65, shade(frame, 0.9), 0.03)
  }
  trellis(out, '+z', MZ, -MX + 0.5, MX - 0.5, 0.6, eaves - 0.3, 0.6, 0.13, lath, lt)

  // ---- the front pavilion
  box(out, 0, cornice / 2, (zf + zb) / 2, MX, cornice / 2, (zb - zf) / 2, p.stone)
  hipRoof(out, -MX, MX, zf + 2.5, zb + 0.5, cornice + 0.6, 3.2, p.slate, 0.3)
  // the brick centre between the stone piers, up to the frieze
  box(out, 0, 5.75, zf - 0.04, 6.0, 5.75, 0.05, BRICK, brick)
  // paired pilasters on the piers, a plinth under them
  for (const s of [-1, 1]) {
    for (const t of [6.9, 8.9]) slabOn(out, '-z', zf, s * t - 0.55, s * t + 0.55, 0.8, 11.5, 0.25, p.trim)
    slabOn(out, '-z', zf, s * 6.1 - (s > 0 ? 0 : 3.6), s * 6.1 + (s > 0 ? 3.6 : 0), 0, 0.8, 0.35, p.deep)
    // the tall slit windows in the piers
    rectOn(out, '-z', zf, s * 7.9 - 0.35, s * 7.9 + 0.35, 1.5, 10.5, p.glass, 0.3)
  }
  // the entablature: architrave, the inscribed frieze, the cornice
  slabOn(out, '-z', zf, -MX - 0.2, MX + 0.2, 11.5, 12.0, 0.4, p.trim)
  rectOn(out, '-z', zf, -5.2, 5.2, 12.0, 12.9, shade(p.stone, 0.9), 0.42)
  slabOn(out, '-z', zf, -MX - 0.4, MX + 0.4, cornice - 0.45, cornice, 0.7, p.trim)
  // the pediment over the middle, its sculpture as a deeper relief in the tympanum
  pedimentOn(out, '-z', zf, -MX + 0.4, MX - 0.4, cornice, 4.6, 0.6, p.trim)
  pedimentOn(out, '-z', zf, -6.5, 6.5, cornice + 0.3, 3.3, 0.75, shade(p.stone, 0.78))
  prism(out, 0, zf + 2.5, cornice + 4.4, cornice + 5.4, 0.7, 8, p.lead)
  prism(out, 0, zf + 2.5, cornice + 5.4, cornice + 7.0, 0.1, 6, p.dark)
  // the door: its stone frame with fluted jambs, the segmental pediment and the RF cartouche, the bronze leaves
  slabOn(out, '-z', zf, -2.8, 2.8, 1.8, 9.2, 0.2, p.stone)
  for (const s of [-1, 1]) slabOn(out, '-z', zf, s * 2.4 - 0.4, s * 2.4 + 0.4, 1.8, 8.5, 0.35, p.trim)
  segmentOn(out, '-z', zf, 0, 9.2, 6.6, 1.4, p.trim, 0.4)
  slabOn(out, '-z', zf, -1.0, 1.0, 9.0, 11.2, 0.55, shade(p.stone, 0.82))
  rectOn(out, '-z', zf, -1.6, 1.6, 1.8, 8.2, [0.3, 0.26, 0.2], 0.25)
  // the steps up from the pavement
  for (let i = 0; i < 9; i++) box(out, 0, 0.1 * (i + 1), zf - (3.4 - i * 0.36) / 2, 3.2, 0.1 * (i + 1), (3.4 - i * 0.36) / 2, p.deep)
}

// ---------------------------------------------------------------------------------------------------------------
const OX = 36.7
const OZ = 7.75
export function luxembourgOrangerie(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, OX, OZ, (q) => orangerie(q))
}

function orangerie(out: MeshBuilder): void {
  const p = palette('#d6c9a6', '#55606a')
  const brick = surfaceTag('brick')
  const top = 8.6
  // the stone base, the brick body, the cornice, the low roof behind the balustrade
  box(out, 0, 0.6, 0, OX + 0.15, 0.6, OZ + 0.15, p.stone)
  box(out, 0, (top + 1.2) / 2, 0, OX, (top - 1.2) / 2, OZ, BRICK, brick)
  for (const s of [-1, 1]) box(out, s * (OX - 0.9), top / 2, 0, 0.95, top / 2, OZ + 0.1, p.stone)        // the stone ends
  box(out, 0, top - 0.35, 0, OX + 0.35, 0.35, OZ + 0.35, p.trim)
  box(out, 0, top - 1.1, 0, OX + 0.12, 0.2, OZ + 0.12, p.stone)                                         // the frieze band
  hipRoof(out, -OX + 0.5, OX - 0.5, -OZ + 0.5, OZ - 0.5, top, 2.2, p.slate, 0)
  // the balustrade in sections along the garden front, plain parapet between
  box(out, 0, top + 0.35, -OZ - 0.1, OX, 0.35, 0.25, p.trim)
  const bays = 12
  const pitch = (2 * OX - 4) / bays
  for (let i = 0; i < bays; i += 2) {
    const x0 = -OX + 2 + i * pitch + pitch * 0.3
    balustrade(out, x0, x0 + pitch * 1.4, -OZ - 0.2, -OZ, top + 0.7, p, { sides: ['-z'], h: 0.9 })
  }
  // the windows toward the garden: a stone surround, the glazing with its bars, a keystone
  for (let i = 0; i < bays; i++) {
    const t = -OX + 2 + (i + 0.5) * pitch
    archOn(out, '-z', -OZ, t, 1.3, 4.3, 6.4, p.trim, 0.06)
    archOn(out, '-z', -OZ, t, 1.5, 3.5, 5.9, [0.55, 0.62, 0.66], 0.1)
    for (const dt of [-0.9, 0, 0.9]) rectOn(out, '-z', -OZ, t + dt - 0.05, t + dt + 0.05, 1.5, 5.6, [0.9, 0.9, 0.88], 0.12)
    for (const y of [2.6, 3.7, 4.8]) rectOn(out, '-z', -OZ, t - 1.75, t + 1.75, y - 0.05, y + 0.05, [0.9, 0.9, 0.88], 0.12)
    slabOn(out, '-z', -OZ, t - 0.3, t + 0.3, 7.2, 7.8, 0.15, p.trim)
    // a bust in a roundel between this window and the next
    if (i < bays - 1) {
      const tm = t + pitch / 2
      prism(out, tm, -OZ, 5.6, 5.62, 0.75, 14, p.trim)
      box(out, tm, 6.1, -OZ - 0.25, 0.32, 0.45, 0.25, shade(p.stone, 0.9))
      box(out, tm, 5.5, -OZ - 0.2, 0.25, 0.2, 0.2, p.trim)
    }
  }
  // the back and the ends: plain brick with a few small windows
  for (let i = 0; i < bays; i += 2) rectOn(out, '+z', OZ, -OX + 3 + i * pitch, -OX + 4.4 + i * pitch, 2.5, 5.5, p.glass)

  // the planters along the garden front: palms, and an orange tree between
  for (let i = 0; i <= bays; i++) {
    const x = -OX + 2 + i * pitch
    planter(out, x, -OZ - 3.2, i % 3 === 1 ? 'orange' : 'palm', i)
  }
}

/** A green Versailles planter with its ball finials, and a palm (or a clipped orange tree) in it. */
function planter(out: MeshBuilder, x: number, z: number, kind: 'palm' | 'orange', seed: number): void {
  const green: Rgb = [0.45, 0.52, 0.38]
  const wood = surfaceTag('planks')
  const leaf = surfaceTag('foliage')
  const h = 1.1
  box(out, x, h / 2, z, 0.6, h / 2, 0.6, green, wood)
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) prism(out, x + dx * 0.6, z + dz * 0.6, h, h + 0.15, 0.08, 6, green, wood)
  if (kind === 'orange') {
    prism(out, x, z, h, h + 0.9, 0.07, 6, [0.36, 0.28, 0.2])
    for (let k = 0; k < 5; k++) {
      const y0 = h + 0.9 + k * 0.28
      const r = 0.75 * Math.sin(((k + 0.5) / 5) * Math.PI) + 0.1
      prism(out, x, z, y0, y0 + 0.28, r, 10, [0.24, 0.38, 0.18], leaf, Math.max(0.1, 0.75 * Math.sin(((k + 1.5) / 5) * Math.PI)))
    }
    return
  }
  // the palm: a short tapering trunk, a crown of drooping fronds, each a strip both ways
  const tall = 1.8 + (seed % 3) * 0.5
  prism(out, x, z, h, h + tall, 0.22, 8, [0.48, 0.4, 0.3], surfaceTag('rock'), 0.17)
  const cy = h + tall
  const frond: Rgb = [0.34, 0.5, 0.22]
  const n = 11
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed
    const ca = Math.cos(a), sa = Math.sin(a)
    const L = 1.9
    // three segments: up and out, then down
    const pts: [number, number][] = [[0, 0], [0.7, 0.45], [1.4, 0.35], [L, -0.25]]
    for (let j = 0; j < 3; j++) {
      const [r0, y0] = pts[j], [r1, y1] = pts[j + 1]
      const w0 = 0.32 * (1 - j / 3), w1 = 0.32 * (1 - (j + 1) / 3) + 0.02
      const P = (r: number, y: number, w: number): [number, number, number] => [x + ca * r - sa * w, cy + y, z + sa * r + ca * w]
      const q: [number, number, number][] = [P(r0, y0, -w0), P(r1, y1, -w1), P(r1, y1, w1), P(r0, y0, w0)]
      out.quad(q, [0, 1, 0], UV, frond, leaf)
      out.quad([q[3], q[2], q[1], q[0]], [0, -1, 0], UV, shade(frond, 0.8), leaf)
    }
  }
}
