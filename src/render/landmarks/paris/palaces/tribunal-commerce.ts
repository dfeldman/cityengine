import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, classicalColumn, dome, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, palette, pedimentOn, pts, rectOn, slab, slabOn, statue, type F, type Pal } from './common.ts'

const FIXED = 0
/** the design footprint: OSM way 53601032's box turned 22.3° to the court's axes (local +z faces bearing 22.3, the quai) */
const HX = 29.4
const HZ = 36.1

/** OSM's outline and its glazed central court in this frame (way 53601032, osmium 2026-10-29), simplified */
const PLAN = [
  pts([-29.1, -31.6, 4.4, -34.6, 26.8, -35.8, 29.2, -34.3, 29.1, 35.1, 1.1, 35.0, -29.4, 35.1]),
  pts([2.2, -10.3, 19.1, -9.8, 18.3, 13.9, 1.3, 13.4]),
]
/** the dome's centre (ways 248434984…991): off the plan's middle, on the axis of the Boulevard de Sébastopol */
const DOME = { x: -9.5, z: 0.2 }

/**
 * The Tribunal de commerce on the Île de la Cité (Antoine-Nicolas Bailly, 1860–65), after the Loggia of Brescia: a
 * stone block of one tall storey and an attic round a glazed court, under a slate mansard, and its DOME — put off the
 * building's middle because Haussmann wanted it on the axis of the Boulevard de Sébastopol, so that it closes the view
 * south from the Gare de l'Est across the Seine. That is how a rider meets it: the dome over the river at the end of the
 * boulevard. What is drawn:
 *
 * - the DOME: the square base standing out of the roof, the octagonal drum with its arched windows between paired
 *   columns, the eight-sided slate dome with its gilded ribs, the lantern — 45 m, as OSM maps it;
 * - the BOULEVARD DU PALAIS front (local −x): the central five arches, the corner pavilions a little proud;
 * - the QUAI DE LA CORSE front (+z): three arches on composite columns, the attic pediment with its figures;
 * - the plan (OSM's outline and court) extruded under its mansard, the glass roof over the court.
 */
export function tribunalCommerce(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e2d8c3', '#4b5358')
  const eaves = 17.2
  extrude(out, PLAN, p, { eaves, bay: 3.9, win: 1.7, rise: 5.2, inset: 2.4,
    storeys: [{ y: 0, h: 4.6, sill: 1.0 }, { y: 7.8, h: 4.4, sill: 0.8 }, { y: 13.8, h: 1.4, sill: 0.4 }] })
  // the court's glass roof
  slab(out, PLAN[1], 18.8, 19.0, [0.5, 0.6, 0.64], [0.3, 0.34, 0.36])
  // ---- the Boulevard du Palais front: corner pavilions, and the five arches of its middle
  front(out, p, '-x', -29.2, -31.6, 35.1, 5)
  // ---- the quai front: three arches on composite columns, the pediment over the attic with its figures
  front(out, p, '+z', 35.1, -29.4, 29.1, 3)
  // ---- the dome
  const { x, z } = DOME
  block(out, x - 7.6, x + 7.6, z - 7.6, z + 7.6, eaves, 26.0, p.stone)                              // the square base
  for (const [f, plane, t] of [['-z', z - 7.6, x], ['+z', z + 7.6, x], ['-x', x - 7.6, z], ['+x', x + 7.6, z]] as [F, number, number][]) {
    archOn(out, f, plane, t, 20.4, 2.2, 3.8, p.glass, 0.06)
    pedimentOn(out, f, plane, t - 3.4, t + 3.4, 26.0, 1.4, 0.4, p.trim)
    for (const s of [-1, 1]) rectOn(out, f, plane, t + s * 5.6 - 0.5, t + s * 5.6 + 0.5, eaves + 0.6, 25.4, p.trim, 0.12)
  }
  block(out, x - 7.9, x + 7.9, z - 7.9, z + 7.9, 25.6, 26.2, p.trim)
  // the drum: eight faces, an arched window in each between paired columns
  const R = 6.2
  prism(out, x, z, 26.2, 32.4, R, 8, p.stone, FIXED)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8
    const c = { x: x + Math.sin(a) * R * 0.93, z: z + Math.cos(a) * R * 0.93 }
    block(out, c.x - 0.75, c.x + 0.75, c.z - 0.75, c.z + 0.75, 27.4, 31.0, p.glass)
    const b = a + Math.PI / 8
    for (const d of [-0.12, 0.12]) {
      classicalColumn(out, x + Math.sin(b + d) * (R + 0.35), z + Math.cos(b + d) * (R + 0.35), 26.2, 31.8, 0.24, p.trim, { order: 'corinthian', tier: 'mid', tag: FIXED, trim: p.trim })
    }
  }
  prism(out, x, z, 31.8, 32.6, R + 0.7, 8, p.trim, FIXED)
  // the eight-sided dome and its gilded ribs, the lantern, the finial
  dome(out, x, z, 32.6, R + 0.2, 7.4, p.slate, 8, p.gold)
  prism(out, x, z, 39.6, 42.6, 1.3, 8, p.stone, FIXED)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    block(out, x + Math.sin(a) * 1.25 - 0.22, x + Math.sin(a) * 1.25 + 0.22, z + Math.cos(a) * 1.25 - 0.22, z + Math.cos(a) * 1.25 + 0.22, 40.2, 42.0, p.glass)
  }
  dome(out, x, z, 42.6, 1.5, 1.4, p.lead, 8)
  prism(out, x, z, 43.9, 45.4, 0.14, 6, p.gold, FIXED, 0.02)
}

/** A front on one face: corner pavilions proud at the ends, `n` great arches in the middle, its attic and crown. */
function front(out: MeshBuilder, p: Pal, f: F, plane: number, t0: number, t1: number, n: number): void {
  const out_ = f === '-x' || f === '-z' ? -1 : 1
  const along = f === '-z' || f === '+z'
  const proud = (a: number, b: number, d: number, y0: number, y1: number, c = p.stone): void => {
    if (along) block(out, Math.min(a, b), Math.max(a, b), Math.min(plane, plane + out_ * d), Math.max(plane, plane + out_ * d), y0, y1, c)
    else block(out, Math.min(plane, plane + out_ * d), Math.max(plane, plane + out_ * d), Math.min(a, b), Math.max(a, b), y0, y1, c)
  }
  const len = t1 - t0
  const pw = 8.5
  // the pavilions at the ends: proud, rusticated, crowned by a balustrade
  for (const [a, b] of [[t0, t0 + pw], [t1 - pw, t1]]) {
    proud(a, b, 0.7, 0, 17.8)
    const pl = plane + out_ * 0.7
    for (let y = 0.7; y < 7.4; y += 0.7) rectOn(out, f, pl, a, b, y - 0.05, y + 0.05, p.deep, 0.035)
    archOn(out, f, pl, (a + b) / 2, 1.0, 2.6, 5.4, p.glass, 0.06)
    rectOn(out, f, pl, (a + b) / 2 - 1.1, (a + b) / 2 + 1.1, 8.6, 13.0, p.glass, 0.06)
    pedimentOn(out, f, pl, (a + b) / 2 - 1.8, (a + b) / 2 + 1.8, 13.2, 1.0, 0.3, p.trim)
  }
  // the middle: n great arches on columns, standing proud, an attic over them
  const mw = Math.min(len - 2 * pw - 6, n * 5.6)
  const m0 = t0 + (len - mw) / 2
  proud(m0 - 0.6, m0 + mw + 0.6, 1.4, 0, 18.4)
  const pl = plane + out_ * 1.4
  const bay = mw / n
  for (let k = 0; k < n; k++) {
    const t = m0 + bay * (k + 0.5)
    archOn(out, f, pl, t, 0.6, bay * 0.62, 10.6, shade(p.dark, 1.6), 0.06)
  }
  for (let k = 0; k <= n; k++) {
    const t = m0 + bay * k
    const [cx, cz] = along ? [t, pl + out_ * 0.55] : [pl + out_ * 0.55, t]
    classicalColumn(out, cx, cz, 0.6, 12.2, 0.42, p.trim, { order: 'corinthian', tier: 'mid', tag: FIXED, trim: p.trim })
  }
  slabOn(out, f, pl, m0 - 0.8, m0 + mw + 0.8, 12.2, 13.4, 1.0, p.trim)
  // the attic panel, and the crowning pediment and its four figures
  rectOn(out, f, pl, m0 + 1, m0 + mw - 1, 14.2, 17.2, p.deep, 0.05)
  pedimentOn(out, f, pl, m0 - 0.4, m0 + mw + 0.4, 18.4, 2.6, 0.8, p.trim)
  for (let k = 0; k < 4; k++) {
    const t = m0 + mw * (0.15 + k * 0.233)
    const [sx, sz] = along ? [t, pl + out_ * 0.6] : [pl + out_ * 0.6, t]
    statue(out, sx, sz, 13.4, 3.6, p.trim)
  }
}
