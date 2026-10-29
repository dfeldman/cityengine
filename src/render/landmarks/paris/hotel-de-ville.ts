import type { MeshBuilder } from '../../buildings.ts'
import { prism } from '../../models.ts'
import { block, column, dome, hex, pane, pediment, roof, shade, windows } from '../kit.ts'
import type { Fit } from '../fit.ts'
import { clockFace } from '../parts.ts'

const FIXED = 0

/**
 * The Hôtel de Ville: a long neo-Renaissance palace in cream limestone under very steep, separate slate
 * roofs — a hipped roof over each range and a tall truncated pyramid over each pavilion (the four corners, the
 * middle of the front and of the back) — with the campanile, clock and lantern over the centre of the main
 * (west) front. Bays every 4.5 m between pilasters, the first floor tallest, a balustrade on the cornice.
 */
export function hotelDeVille(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e4d8bf')
  const trim = shade(stone, 1.06)
  const slate = hex('#4e555d')
  const glass = hex('#2c3036')
  const gold = hex('#c9a646')
  const hx = fit.hx
  const hz = fit.hz
  const cornice = 22
  const range = 14                      // depth of each range round the courtyards
  // the body: ranges round four courtyards — the outer four, and a cross of two through the middle —
  // each under a hipped slate roof with its ridge along the range
  const ranges: [number, number, number, number][] = [
    [-hx, hx, -hz, -hz + range], [-hx, hx, hz - range, hz], [-hx, -hx + range, -hz, hz], [hx - range, hx, -hz, hz],
    [-hx + range, hx - range, -range / 2, range / 2], [-range / 2, range / 2, -hz + range, hz - range],
  ]
  block(out, -hx, hx, -hz, hz, 0, 0.6, hex('#b9b2a4'))                 // the courtyards' paving
  for (const [x0, x1, z0, z1] of ranges) {
    block(out, x0, x1, z0, z1, 0, cornice, stone)
    block(out, x0 - 0.4, x1 + 0.4, z0 - 0.4, z1 + 0.4, cornice - 0.8, cornice, trim)
    roof(out, x0, x1, z0, z1, cornice, 8, range / 2, range / 2, slate)
  }
  // the courtyard walls: plain rows of windows, seen only from above
  for (const [x0, x1] of [[-hx + range, -range / 2], [range / 2, hx - range]]) {
    for (const [z0, z1] of [[-hz + range, -range / 2], [range / 2, hz - range]]) {
      for (const y of [2, 7.5, 13.5]) {
        windows(out, '+z', z0, x0 + 1, x1 - 1, y, 1.3, 3, 4.5, glass)
        windows(out, '-z', z1, x0 + 1, x1 - 1, y, 1.3, 3, 4.5, glass)
        windows(out, '+x', x0, z0 + 1, z1 - 1, y, 1.3, 3, 4.5, glass)
        windows(out, '-x', x1, z0 + 1, z1 - 1, y, 1.3, 3, 4.5, glass)
      }
    }
  }

  /** A run of bays on one face: windows in four storeys and a pilaster between each pair. */
  const bays = (face: '-z' | '+z' | '-x' | '+x', plane: number, t0: number, t1: number, top: number): void => {
    const n = Math.max(1, Math.round((t1 - t0) / 4.5))
    const step = (t1 - t0) / n
    const out1 = face === '-z' || face === '-x' ? -1 : 1
    for (let i = 0; i < n; i++) {
      const t = t0 + step * (i + 0.5)
      for (const [y, hh] of [[1.6, 3.6], [7, 5], [13.4, 3.8], [18.4, 2.2]] as const) {
        if (y + hh > top - 0.5) continue
        pane(out, face, plane, t, y - 0.3, 1.9, hh + 0.5, trim, 0.03)    // the surround
        pane(out, face, plane, t, y, 1.4, hh, glass)
      }
      // the pilaster at the bay's left edge
      const a = t - step / 2
      if (face === '-z' || face === '+z') block(out, a - 0.3, a + 0.3, Math.min(plane, plane + out1 * 0.3), Math.max(plane, plane + out1 * 0.3), 0, top - 1, trim)
      else block(out, Math.min(plane, plane + out1 * 0.3), Math.max(plane, plane + out1 * 0.3), a - 0.3, a + 0.3, 0, top - 1, trim)
    }
    // the string course over the ground floor and the cornice with its balustrade
    for (const [y0, y1, d] of [[5.8, 6.3, 0.35], [top - 1, top, 0.6], [top, top + 1.1, 0.15]] as const) {
      if (face === '-z' || face === '+z') block(out, t0, t1, Math.min(plane, plane + out1 * d), Math.max(plane, plane + out1 * d), y0, y1, trim)
      else block(out, Math.min(plane, plane + out1 * d), Math.max(plane, plane + out1 * d), t0, t1, y0, y1, trim)
    }
  }
  bays('-z', -hz, -hx, hx, cornice)
  bays('+z', hz, -hx, hx, cornice)
  bays('-x', -hx, -hz, hz, cornice)
  bays('+x', hx, -hz, hz, cornice)

  // the pavilions: standing 2 m forward and 3 m up, each under its own tall truncated pyramid with a gilt crest
  const pav = (x0: number, x1: number, z0: number, z1: number, top: number, roofTop: number): void => {
    block(out, x0, x1, z0, z1, 0, top, stone)
    bays('-z', z0, x0, x1, top)
    bays('+z', z1, x0, x1, top)
    bays('-x', x0, z0, z1, top)
    bays('+x', x1, z0, z1, top)
    const inset = Math.min(x1 - x0, z1 - z0) * 0.32
    roof(out, x0 - 0.4, x1 + 0.4, z0 - 0.4, z1 + 0.4, top + 1.1, roofTop - top - 1.1, inset, inset, slate)
    // the crest: a gilt railing round the flat top, not a slab
    const [a0, a1, b0, b1] = [x0 + inset, x1 - inset, z0 + inset, z1 - inset]
    block(out, a0, a1, b0 - 0.08, b0 + 0.08, roofTop, roofTop + 0.7, gold)
    block(out, a0, a1, b1 - 0.08, b1 + 0.08, roofTop, roofTop + 0.7, gold)
    block(out, a0 - 0.08, a0 + 0.08, b0, b1, roofTop, roofTop + 0.7, gold)
    block(out, a1 - 0.08, a1 + 0.08, b0, b1, roofTop, roofTop + 0.7, gold)
    // a tall chimney stack at each end of the crest
    for (const s of [-1, 1]) block(out, (x0 + x1) / 2 + s * ((x1 - x0) / 2 - inset) - 0.6, (x0 + x1) / 2 + s * ((x1 - x0) / 2 - inset) + 0.6,
      (z0 + z1) / 2 - 1.5, (z0 + z1) / 2 + 1.5, roofTop - 3, roofTop + 2.5, stone)
  }
  const p = 20
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x0 = sx < 0 ? -hx - 2 : hx - p
    const z0 = sz < 0 ? -hz - 2 : hz - p
    pav(x0, x0 + p + 2, z0, z0 + p + 2, 25, 36)
  }
  pav(-13, 13, hz - 16, hz + 2, 25, 35)                       // the back's centre pavilion
  pav(-14, 14, -hz - 2.5, -hz + 18, 26, 37)                   // the front's, carrying the campanile

  // the campanile: a square clock stage out of the roof, the lantern on columns, a dome, a spire
  const cz = -hz + 6
  block(out, -4.2, 4.2, cz - 4.2, cz + 4.2, 30, 42, stone)
  block(out, -4.6, 4.6, cz - 4.6, cz + 4.6, 41.4, 42.2, trim)
  // the campanile's clock, telling the real time (render/clocks.ts)
  clockFace(out, 0, 38, cz - 4.22, 0, -1, 1.9, { dial: hex('#f4f0e6'), hands: hex('#222222') })
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    column(out, Math.sin(a) * 2.8, cz + Math.cos(a) * 2.8, 42.2, 47, 0.28, stone)
  }
  prism(out, 0, cz, 42.2, 47, 2.1, 8, glass)
  prism(out, 0, cz, 47, 47.6, 3.4, 8, trim)
  dome(out, 0, cz, 47.6, 3, 3.2, slate, 12)
  prism(out, 0, cz, 50.6, 55, 0.5, 8, slate, FIXED, 0.05)
  prism(out, 0, cz, 55, 55.6, 0.25, 6, gold)
  // the dormers along the ranges, between the pavilions, front and back
  for (const sz of [-1, 1]) {
    for (let x = -hx + p + 6; x < hx - p - 4; x += 9) {
      if (Math.abs(x) < 18) continue
      const z = sz < 0 ? -hz + 1.8 : hz - 4.3
      block(out, x - 1.2, x + 1.2, z, z + 2.5, cornice, cornice + 3.5, stone)
      pediment(out, x - 1.4, x + 1.4, sz < 0 ? z : z + 2.5, cornice + 3.5, 1.3, sz < 0 ? 2.5 : -2.5, trim)
      pane(out, sz < 0 ? '-z' : '+z', sz < 0 ? z : z + 2.5, x, cornice + 0.6, 1.1, 2.3, glass)
    }
  }
}
