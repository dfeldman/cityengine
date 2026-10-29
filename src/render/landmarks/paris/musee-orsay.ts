import type { MeshBuilder } from '../../buildings.ts'
import { disc, prism, type Rgb } from '../../models.ts'
import { archedPane, beam, block, hex, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'
import { clockFace } from '../parts.ts'

const FIXED = 0

/**
 * The Musée d'Orsay, the Gare d'Orsay of 1900 (Laloux) on the Seine (PARIS_EXPAND §5 A). The gist:
 *
 * - the long pale stone front to the river with its row of GREAT ARCHED WINDOWS;
 * - the two end pavilions, taller, each with a GIANT CLOCK in its face, under steep zinc roofs;
 * - the station's glass barrel vault running the length of it, seen over the cornice;
 * - the statues along the balustrade (the six continents), as a row of small figures.
 *
 * Local frame: the river front faces −z; fitted to OSM's footprint (~188 × 75 m).
 */
export function museeOrsay(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#ded4bf')
  const deep = shade(stone, 0.85)
  const zinc = hex('#6e7477')
  const glass: Rgb = [0.52, 0.6, 0.64]
  const dark = hex('#2b2a28')
  const face: Rgb = [0.94, 0.93, 0.88]
  const goldC: Rgb = [0.84, 0.66, 0.26]
  const hx = Math.min(Math.max(fit.hx, 70), 96)
  const hz = Math.min(Math.max(fit.hz, 28), 40)
  const cornice = 24
  const pav = 20                                   // the pavilions' width
  // the main block, and its cornice and balustrade
  block(out, -hx + pav, hx - pav, -hz, hz, 0, cornice, stone)
  block(out, -hx + pav - 0.2, hx - pav + 0.2, -hz - 0.8, hz + 0.8, cornice, cornice + 1.2, deep)
  block(out, -hx + pav, hx - pav, -hz - 0.4, -hz + 0.4, cornice + 1.2, cornice + 2.6, stone)
  // the statues on the balustrade over the front
  for (let i = 0; i < 6; i++) {
    const x = -hx + pav + 12 + ((2 * (hx - pav) - 24) * (i + 0.5)) / 6
    prism(out, x, -hz, cornice + 2.6, cornice + 5.4, 0.55, 6, shade(stone, 0.95), FIXED, 0.35)
  }
  // the great arched windows along the river front, and a ground floor of smaller arches under them
  const bays = 7
  const span = 2 * (hx - pav)
  for (let i = 0; i < bays; i++) {
    const x = -hx + pav + (span * (i + 0.5)) / bays
    archedPane(out, -hz - 0.03, x, 7, span / bays - 4.5, 15, glass)
    archedPane(out, -hz - 0.04, x, 7.2, 0.3, 14.4, deep)                                  // the mullion
    archedPane(out, -hz - 0.03, x, 0.3, span / bays - 6, 5.2, dark)
  }
  block(out, -hx + pav, hx - pav, -hz - 0.3, -hz, 6.2, 6.8, deep)
  // the end pavilions, taller, with their clocks and zinc roofs
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? hx - pav : -hx
    const x1 = sx > 0 ? hx : -hx + pav
    const cx = (x0 + x1) / 2
    block(out, x0, x1, -hz - 1.5, hz, 0, 32, stone)
    block(out, x0 - 0.4, x1 + 0.4, -hz - 2.3, hz + 0.4, 32, 33.4, deep)
    roof(out, x0 - 0.2, x1 + 0.2, -hz - 1.8, hz + 0.2, 33.4, 9, 4, 4, zinc)
    // the clock: a great white face in a stone and gilt frame, its numerals as ticks, its two hands
    const z = -hz - 1.56
    disc(out, cx, 22, z, 6.2, deep, FIXED, 32)
    // (the face itself a working clock: the real time, as every clock in the city — owner, 2026-10-29: "Sf has working clocks")
    clockFace(out, cx, 22, z - 0.03, 0, -1, 5.6, { dial: face, rim: goldC, marks: dark, hands: dark })
    // an arched window under it, and a small one either side
    archedPane(out, -hz - 1.53, cx, 3, 7, 12, glass)
  }
  // the station's glass vault, the length of the hall between the pavilions
  const vr = hz * 0.62
  const n = 12
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI
    const a1 = ((k + 1) / n) * Math.PI
    const z0 = -Math.cos(a0) * vr
    const z1 = -Math.cos(a1) * vr
    const y0 = cornice + 2 + Math.sin(a0) * vr * 0.55
    const y1 = cornice + 2 + Math.sin(a1) * vr * 0.55
    out.quad([[-hx + pav, y0, z0], [hx - pav, y0, z0], [hx - pav, y1, z1], [-hx + pav, y1, z1]],
      [0, Math.sin((a0 + a1) / 2), -Math.cos((a0 + a1) / 2)], [[0, 0], [1, 0], [1, 1], [0, 1]], glass, FIXED)
  }
  // its iron ribs
  for (let x = -hx + pav + 3; x < hx - pav; x += 6) {
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI
      const a1 = ((k + 1) / n) * Math.PI
      beam(out, [x, cornice + 2.1 + Math.sin(a0) * vr * 0.55, -Math.cos(a0) * vr], [x, cornice + 2.1 + Math.sin(a1) * vr * 0.55, -Math.cos(a1) * vr], 0.18, zinc)
    }
  }
}
