import { MeshBuilder } from '../../../buildings.ts'
import { box } from '../../../models.ts'
import { beam, block, classicalColumn, placed, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import {
  archOn, balustrade, dormers, extrude, fitted, hipRoof, palette, pedimentOn, pts, range, rectOn, statue, type Pal,
} from './common.ts'

const FIXED = 0
/** the design footprint: OSM relation 1060803's box turned 26° to the palace's axes (local −z faces bearing 26) */
const HX = 53.3
const HZ = 60.7

/** OSM's outline and courts in this frame (relation 1060803, osmium 2026-10-29), simplified to 0.6 m */
const PLAN = [
  pts([49.4, 59.0, 48.4, 60.2, 29.0, 60.7, 27.3, 59.1, 26.6, 26.8, 22.6, 26.9, 22.5, 27.7, 7.3, 28.2, 7.3, 28.8, -17.1, 28.7, -17.6, 12.5, -42.6, 13.2, -41.9, 31.7, -47.0, 31.8, -47.9, 32.5, -47.9, 31.8, -52.8, 31.9, -52.9, 23.4, -51.2, 23.4, -51.7, 6.7, -53.1, 6.7, -53.3, -1.9, -48.5, -2.0, -49.1, -34.7, -15.7, -43.5, -13.9, -41.8, 50.9, -60.7, 53.1, -58.1, 52.7, 17.3, 48.9, 17.5, 48.3, 26.4]),
  pts([38.4, 10.0, 38.2, -1.6, 31.2, -1.5, 31.3, 10.2]),
  pts([42.5, -11.5, 41.7, -43.3, 26.6, -43.0, 27.2, -11.2]),
  pts([18.9, 9.8, 17.9, -31.6, 15.4, -31.5, 11.7, -38.8, 8.1, -39.8, -11.7, -35.9, -12.7, -30.9, -15.5, -30.9, -14.7, 10.6]),
  pts([-24.2, -2.7, -24.8, -30.4, -40.1, -30.1, -39.6, -2.3]),
]

/**
 * The Palais de l'Élysée (Armand-Claude Mollet for the Comte d'Évreux, 1718–22), the President's house. What a rider on
 * the Rue du Faubourg-Saint-Honoré (local −z) sees, and what is seen from the gardens and the Avenue Gabriel (+z):
 *
 * - the street GATE: the triumphal portal in the screen wall — the great round-headed carriage arch between paired
 *   Ionic columns, the attic with the arms over it, the low wings either side — and through it the gravelled cour
 *   d'honneur;
 * - at the far end of the court the CORPS DE LOGIS: two storeys of tall windows, the central avant-corps with its
 *   columns and pediment, the glass MARQUISE over the steps where the President receives, the tricolour over the roof;
 * - the GARDEN FRONT on the park: the same palace seen long, its central pavilion standing forward to the lawn;
 * - the wings round the courts east and west, a storey lower under their mansards.
 *
 * The plan is OSM's relation 1060803 with its courts (`PLAN`), extruded; the corps de logis is drawn over it.
 */
export function elysee(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e6decb', '#4b5257')
  // ---- the wings round the courts and along the street, under their mansards
  extrude(out, PLAN, p, { eaves: 9.6, bay: 3.4, win: 1.5, rise: 3.0, storeys: [{ y: 0, h: 3.4, sill: 0.7 }, { y: 5.0, h: 2.9, sill: 0.7 }] })
  // ---- the corps de logis between the court and the garden, a little taller, hipped
  const x0 = -17.3
  const x1 = 26.8
  const z0 = 10.4
  const z1 = 28.9
  range(out, x0, x1, z0, z1, p, {
    eaves: 12.6, bay: 3.9, win: 1.8, quoins: true, faces: ['-z', '+z'], pediments: true,
    storeys: [{ y: 0, h: 4.0, arched: true, sill: 0.5 }, { y: 6.6, h: 3.8, sill: 0.7 }],
  })
  hipRoof(out, x0, x1, z0, z1, 12.6, 4.6, p.slate, 0.3)
  dormers(out, '-z', z0, x0 + 2, x1 - 2, 12.6, 3.9, p, { set: 0.9, every: 2, round: true })
  dormers(out, '+z', z1, x0 + 2, x1 - 2, 12.6, 3.9, p, { set: 0.9, every: 2, round: true })
  const xm = (x0 + x1) / 2
  // the avant-corps on the court: columns on both storeys, the pediment, the balustrade
  for (const [f, z] of [['-z', z0], ['+z', z1]] as const) {
    const d = f === '-z' ? -1 : 1
    block(out, xm - 6.2, xm + 6.2, Math.min(z, z + d * 1.2), Math.max(z, z + d * 1.2), 0, 13.3, p.stone)
    const fz = z + d * 1.2
    for (const t of [xm - 5.4, xm - 1.8, xm + 1.8, xm + 5.4]) {
      classicalColumn(out, t, fz + d * 0.5, 0.4, 6.2, 0.36, p.trim, { order: 'ionic', tier: 'mid', tag: FIXED, trim: p.trim })
      classicalColumn(out, t, fz + d * 0.5, 6.6, 12.4, 0.32, p.trim, { order: 'corinthian', tier: 'mid', tag: FIXED, trim: p.trim })
    }
    for (const t of [xm - 3.6, xm, xm + 3.6]) {
      archOn(out, f, fz, t, 0.4, 2.0, 4.4, p.glass, 0.06)
      rectOn(out, f, fz, t - 0.85, t + 0.85, 7.4, 11.0, p.glass, 0.06)
    }
    pedimentOn(out, f, fz, xm - 6.6, xm + 6.6, 13.3, 2.6, 0.5, p.trim)
  }
  balustrade(out, x0, xm - 6.2, z0, z1, 12.6, p, { sides: ['-z', '+z'], h: 0.8 })
  balustrade(out, xm + 6.2, x1, z0, z1, 12.6, p, { sides: ['-z', '+z'], h: 0.8 })
  marquise(out, xm, z0 - 1.2, p)
  // the garden front's terrace and steps down to the lawn
  block(out, xm - 12, xm + 12, z1 + 1.2, z1 + 4.5, 0, 0.8, p.trim)
  for (let i = 0; i < 3; i++) block(out, xm - 4 + i * 0.3, xm + 4 - i * 0.3, z1 + 4.5 + i * 0.5, z1 + 5.0 + i * 0.5, 0, 0.8 - (i + 1) * 0.25, p.trim)
  // the tricolour on the roof
  box(out, xm, 20.5, (z0 + z1) / 2, 0.06, 3.2, 0.06, p.lead, FIXED)
  for (const [k, c] of [[0, [0.12, 0.22, 0.55]], [1, [0.95, 0.95, 0.95]], [2, [0.78, 0.13, 0.16]]] as const) {
    box(out, xm + 0.35 + k * 0.6, 22.8, (z0 + z1) / 2, 0.3, 0.5, 0.02, c as [number, number, number], FIXED)
  }
  // ---- the gate on the Faubourg-Saint-Honoré, set square to the street (16° off the palace's axis)
  const g = new MeshBuilder()
  gate(g, p)
  placed(out, g, 0.284, 0.2, -46.2)
}

/** The glass and iron marquise over the steps of the court front. */
function marquise(out: MeshBuilder, x: number, z: number, p: Pal): void {
  const glass: [number, number, number] = [0.55, 0.66, 0.7]
  const iron = shade(p.dark, 1.4)
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 0.5
    const a1 = ((i + 1) / 6) * Math.PI * 0.5
    const zz0 = z - Math.sin(a0) * 4.2
    const zz1 = z - Math.sin(a1) * 4.2
    const y0 = 5.6 - (1 - Math.cos(a0)) * 1.2
    const y1 = 5.6 - (1 - Math.cos(a1)) * 1.2
    out.quad([[x - 4.5, y0, zz0], [x + 4.5, y0, zz0], [x + 4.5, y1, zz1], [x - 4.5, y1, zz1]], [0, 0.85, -0.5], [[0, 0], [1, 0], [1, 1], [0, 1]], glass, FIXED)
  }
  for (const s of [-1, 1]) beam(out, [x + s * 4.5, 5.6, z], [x + s * 4.5, 4.4, z - 4.2], 0.06, iron)
  block(out, x - 4.6, x + 4.6, z - 4.35, z - 4.1, 4.2, 4.5, iron)
  // the steps under it
  for (let i = 0; i < 3; i++) block(out, x - 4.8, x + 4.8, z - 3.6 + i * 0.5, z, 0, (i + 1) * 0.18, p.trim)
}

/** The portal: a round-headed carriage arch between paired Ionic columns, the attic with the arms, the screen walls. */
function gate(out: MeshBuilder, p: Pal): void {
  block(out, -7.5, 7.5, -1.6, 2.2, 0, 11.0, p.stone)
  archOn(out, '-z', -1.6, 0, 0, 5.2, 8.2, p.dark, 0.05)
  for (const s of [-1, 1]) {
    for (const d of [-0.7, 0.7]) classicalColumn(out, s * 5.0 + d, -2.3, 0, 8.6, 0.42, p.trim, { order: 'ionic', tier: 'near', tag: FIXED, trim: p.trim })
    statue(out, s * 5.0, -2.3, 11.6, 2.4, p.trim)
  }
  block(out, -7.8, 7.8, -2.9, 2.4, 8.6, 9.6, p.trim)                                             // the entablature
  block(out, -4.2, 4.2, -1.9, 2.0, 11.0, 13.2, p.stone)                                           // the attic
  box(out, 0, 12.1, -1.95, 1.2, 0.9, 0.05, shade(p.stone, 0.8), FIXED)                            // the arms
  pedimentOn(out, '-z', -1.9, -4.6, 4.6, 13.2, 1.4, 0.4, p.trim)
  // the screen walls either side with their blind arches, to where the street wings take over
  for (const s of [-1, 1]) {
    const a = s * 7.5
    const b = s * 18
    block(out, Math.min(a, b), Math.max(a, b), -1.0, 1.0, 0, 7.0, p.stone)
    block(out, Math.min(a, b) - 0.1, Math.max(a, b) + 0.1, -1.2, 1.2, 7.0, 7.6, p.trim)
    for (let k = 0; k < 3; k++) archOn(out, '-z', -1.0, s * (9.6 + k * 3.3), 1.0, 1.8, 4.6, shade(p.stone, 0.78), 0.04)
  }
}
