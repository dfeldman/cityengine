import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { block, classicalColumn, dome, shade } from '../../kit.ts'
import { colonnade } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, extrude, fitted, palette, pedimentOn, pts, statue } from './common.ts'

const FIXED = 0
/** the design footprint: OSM relation 1002192's box turned 26° to the hôtel's axes (local −z faces bearing 26, the Seine) */
const HX = 35.1
const HZ = 42

/** OSM's outline and its court in this frame (osmium, 2026-10-29), simplified to 0.6 m */
const PLAN = [
  pts([35.0, 34.6, 21.8, 34.6, 21.2, 41.9, 11.8, 41.7, 11.9, 36.6, -20.2, 36.6, -20.2, 40.6, -29.5, 40.3, -29.9, 36.0, -30.6, 36.1, -34.7, -6.5, -31.3, -7.1, -31.4, -14.9, -18.2, -14.9, -18.3, -26.5, -23.4, -26.5, -23.5, -36.4, -10.4, -36.5, -7.5, -40.9, -1.2, -41.5, 2.2, -38.1, 2.7, -36.5, 15.4, -36.5, 15.4, -26.6, 8.6, -26.6, 8.5, -15.0, 23.2, -15.0, 23.2, -7.0, 35.1, -7.1]),
  pts([23.0, 22.3, 23.2, 5.2, 11.7, 5.0, 11.7, 22.7]),
  pts([9.5, 33.2, 9.4, -5.8, 2.3, -5.8, 2.4, -0.8, -10.3, -0.7, -10.1, -5.7, -17.3, -5.6, -17.5, 33.4]),
]

/**
 * The Palais de la Légion d'Honneur, the Hôtel de Salm (Pierre Rousseau, 1782–87), across the Seine from the
 * Tuileries beside the Musée d'Orsay. What a rider sees:
 *
 * - from the QUAI ANATOLE-FRANCE (local −z): the long low garden front, one tall storey under a balustrade, and in
 *   its middle the ROTUNDA — a half-round pavilion of Corinthian columns with statues on its balustrade and a low dome;
 * - from the RUE DE LILLE (+z): the triumphal-arch GATE in its Ionic colonnade screen, and through it the court of
 *   honour lined with Ionic colonnades to the portico of the corps de logis.
 *
 * The plan is OSM's (relation 1002192 and its court), extruded; the rotunda, gate and colonnades drawn over it.
 */
export function legionHonneur(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e8e0cc', '#50575b')
  extrude(out, PLAN, p, { eaves: 10.2, bay: 3.6, win: 1.7, rise: 1.6, inset: 0.8, dormers: false,
    storeys: [{ y: 0, h: 4.4, sill: 0.8 }, { y: 7.0, h: 1.6, sill: 0.4 }] })
  // the garden front's balustrade and its statues
  balustrade(out, -23.5, 15.4, -36.5, -26.5, 10.2, p, { sides: ['-z'], h: 1.0 })
  // ---- the rotunda: a half-drum of columns before the wall, the balustrade, statues, the low dome
  const c = { x: -3.85, z: -36.5 }
  const R = 5.3
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI + (i / 6) * Math.PI
    const x = c.x + Math.cos(a) * (R + 1.3)
    const z = c.z + Math.sin(a) * (R + 1.3)
    classicalColumn(out, x, z, 0.6, 9.2, 0.38, p.stone, { order: 'corinthian', tier: 'mid', tag: FIXED, trim: p.trim })
    statue(out, x, z, 10.4, 2.2, p.trim)
  }
  for (let i = 0; i < 8; i++) {
    const a0 = Math.PI + (i / 8) * Math.PI
    const a1 = Math.PI + ((i + 1) / 8) * Math.PI
    const am = (a0 + a1) / 2
    const r = R + 1.3
    // the entablature and balustrade round the columns, as short chords
    const mx = c.x + Math.cos(am) * r
    const mz = c.z + Math.sin(am) * r
    const L = 2 * r * Math.sin((a1 - a0) / 2) + 0.2
    const h = Math.atan2(Math.cos(am), Math.sin(am))
    chord(out, mx, mz, h, L, 9.2, 10.4, p.trim)
  }
  block(out, c.x - 0.5, c.x + 0.5, c.z, c.z + 0.6, 0, 0.6, p.trim)
  dome(out, c.x, c.z - 1, 10.2, R + 0.6, 3.4, shade(p.slate, 1.1), 16)
  prism(out, c.x, c.z - 1, 13.5, 14.3, 0.9, 8, p.trim, FIXED, 0.5)
  // ---- the gate on the Rue de Lille: the triumphal arch between paired Ionic columns, the colonnade screens either side
  const gx = -4.2
  const gz = 41.7
  block(out, gx - 6, gx + 6, 36.6, gz + 0.8, 0, 12.5, p.stone)
  archOn(out, '+z', gz + 0.8, gx, 0, 5.0, 8.6, p.dark, 0.06)
  for (const s of [-1, 1]) for (const d of [-0.8, 0.8]) {
    classicalColumn(out, gx + s * 4.2 + d, gz + 1.6, 0, 9.4, 0.42, p.trim, { order: 'ionic', tier: 'near', tag: FIXED, trim: p.trim })
  }
  block(out, gx - 6.4, gx + 6.4, 36.6, gz + 2.3, 9.4, 10.6, p.trim)
  pedimentOn(out, '+z', gz + 2.3, gx - 3.0, gx + 3.0, 12.5, 1.2, 0.3, p.trim)
  box(out, gx, 11.6, gz + 0.9, 1.6, 0.6, 0.05, shade(p.stone, 0.82), FIXED)                      // the inscription band
  colonnade(out, { x: -20.2, z: 40.8 }, { x: gx - 6, z: 40.8 }, 0, 6.6, 4, { radius: 0.32, out: -0.6, colour: p.stone, order: 'ionic', tier: 'mid', trim: p.trim })
  colonnade(out, { x: gx + 6, z: 40.8 }, { x: 11.8, z: 40.8 }, 0, 6.6, 4, { radius: 0.32, out: -0.6, colour: p.stone, order: 'ionic', tier: 'mid', trim: p.trim })
  // ---- the court's Ionic colonnades down both sides, to the corps de logis's portico
  colonnade(out, { x: -17.5, z: 33.4 }, { x: -17.3, z: -0.5 }, 0, 6.8, 9, { radius: 0.34, out: -1.4, colour: p.stone, order: 'ionic', tier: 'mid', trim: p.trim })
  colonnade(out, { x: 9.4, z: -0.5 }, { x: 9.5, z: 33.2 }, 0, 6.8, 9, { radius: 0.34, out: -1.4, colour: p.stone, order: 'ionic', tier: 'mid', trim: p.trim })
  for (let i = 0; i < 6; i++) classicalColumn(out, -9.2 + i * 2.2, 0.7, 0.4, 9.6, 0.4, p.stone, { order: 'corinthian', tier: 'mid', tag: FIXED, trim: p.trim })
  block(out, -10.2, 2.2, -0.7, 1.6, 9.6, 10.6, p.trim)
  pedimentOn(out, '+z', 1.6, -10.6, 2.6, 10.6, 2.2, 0.6, p.trim)
}

/** A short straight piece of a curved entablature: `L` long, facing `h`, from y0 to y1. */
function chord(out: MeshBuilder, x: number, z: number, h: number, L: number, y0: number, y1: number, c: [number, number, number]): void {
  const s = Math.sin(h)
  const co = Math.cos(h)
  const P = (dx: number, y: number, dz: number): [number, number, number] => [x + dx * co + dz * s, y, z - dx * s + dz * co]
  const hx = L / 2
  const hz = 0.45
  const quads: [[number, number, number][], [number, number, number]][] = [
    [[P(-hx, y0, hz), P(hx, y0, hz), P(hx, y1, hz), P(-hx, y1, hz)], [s, 0, co]],
    [[P(hx, y0, -hz), P(-hx, y0, -hz), P(-hx, y1, -hz), P(hx, y1, -hz)], [-s, 0, -co]],
    [[P(-hx, y1, hz), P(hx, y1, hz), P(hx, y1, -hz), P(-hx, y1, -hz)], [0, 1, 0]],
  ]
  for (const [q, n] of quads) out.quad(q, n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
}
