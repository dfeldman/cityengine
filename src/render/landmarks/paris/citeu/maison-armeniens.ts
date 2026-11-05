/**
 * THE MAISON DES ÉTUDIANTS ARMÉNIENS (FONDATION MARIE NUBAR) — LÉON NAFILYAN (1930): a five-storey pale ashlar block
 * in an Armenian-revival dress, its long wing running back from the boulevard Jourdan under a slate gabled roof.
 * The boulevard end is a stone gable, three bays wide, its top storey under round arches on colonnettes with iron
 * balconies, a carved interlace band along the cornice and up the gable rakes, small paired windows in the gable;
 * a low single-storey porch with a carved frieze stands before it. Tall square windows with dark shutters elsewhere,
 * a pilastered bay on the west side, a polygonal stair tower at the back, a low two-storey annex to the east.
 * Entrance under a small gabled porch with an interlace arch and the name carved round it.
 * Refs: Commons "Paris - Maison des Etudiants Arméniens (17910008038)", "MEA Printemps 2009",
 * "Maison des etudiants armeniens.jpg" (docs/landmarks/refs/citeu/armeniens/).
 * Plan from OSM way 260196624. Local frame: −z toward bearing 18.7 (the boulevard Jourdan end), x toward 108.7;
 * origin the bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, roof, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { archOn, rectOn } from '../palaces/common.ts'

const STONE: Rgb = hex('#d8ccb2'), CARVE: Rgb = hex('#b9ab8e'), SLATE: Rgb = hex('#5d6168'), WIN: Rgb = hex('#3a3f45')
const SHUTTER: Rgb = hex('#6a5444'), IRON: Rgb = hex('#2a2a2a'), FLAT: Rgb = hex('#8e8b84')

export const W = 28.4, D = 43.4
const GF = 3.6, FLOOR = 3.1, LEVELS = 5
const EAVE = GF + (LEVELS - 1) * FLOOR            // ≈16.0
const RIDGE_H = 5.2
const MAIN: number[] = [-12.7, 0.0, -20.1, 17.5]  // the long wing [x0,x1,z0,z1]
const PORCH: number[] = [-11.6, -1.1, -23.2, -20.1], PORCH_H = 4.0   // low porch before the boulevard gable
const ANNEX: number[] = [0.0, 14.2, -12.8, -9.2], ANNEX_H = 7.0
const TOWER: number[] = [-10.8, -2.5, 17.5, 21.7], TOWER_H = EAVE + 1.5
const WBAY: number[] = [-13.4, -12.7, -16.5, -5.0] // pilastered bay on the west side
const SIDE_BAY = 3.1                               // window module along the long sides

function window(out: MeshBuilder, f: '-x' | '+x' | '-z' | '+z', plane: number, t: number, y: number, top: boolean): void {
  if (top) {
    archOn(out, f, plane, t, y + 0.4, 1.4, 2.4, WIN, 0.05)
    archOn(out, f, plane, t, y + 0.2, 1.9, 2.9, CARVE, 0.03)                // interlace archivolt
  } else {
    rectOn(out, f, plane, t - 0.65, t + 0.65, y + 0.5, y + 2.5, WIN, 0.05)
    rectOn(out, f, plane, t - 0.65, t + 0.65, y + 1.6, y + 2.5, SHUTTER, 0.07)
  }
  rectOn(out, f, plane, t - 0.75, t + 0.75, y + 0.5, y + 1.05, IRON, 0.12)   // balcony rail
}

function face(out: MeshBuilder, f: '-x' | '+x' | '-z' | '+z', plane: number, t0: number, t1: number, g: number, n: number): void {
  const step = (t1 - t0) / n
  for (let k = 0; k < n; k++) {
    const t = t0 + (k + 0.5) * step
    for (let j = 0; j < LEVELS; j++) window(out, f, plane, t, g + (j === 0 ? 0.2 : GF + (j - 1) * FLOOR), j === LEVELS - 1)
  }
  rectOn(out, f, plane, t0, t1, g + EAVE - 0.7, g + EAVE - 0.2, CARVE, 0.1)   // carved cornice band
  rectOn(out, f, plane, t0, t1, g + GF - 0.25, g + GF, CARVE, 0.08)           // string course
}

/** a stone gable triangle on a ±z end, a carved band up its rakes, paired small windows in it */
function gable(out: MeshBuilder, f: '-z' | '+z', z: number, g: number): void {
  const [x0, x1] = MAIN, y0 = g + EAVE, y1 = y0 + RIDGE_H, cx = (x0 + x1) / 2, s = f === '-z' ? -1 : 1
  const zz = z + s * 0.02
  const n: [number, number, number] = [0, 0, s]
  const tri = (a: number, b: number, c: Rgb, dz: number, inset: number): void => {
    const p: [number, number, number][] = [[a + inset, y0, zz + s * dz], [b - inset, y0, zz + s * dz], [cx, y1 - inset * 0.8, zz + s * dz], [cx, y1 - inset * 0.8, zz + s * dz]]
    out.quad(s > 0 ? p : [p[1], p[0], p[3], p[2]], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
  }
  tri(x0 - 0.3, x1 + 0.3, CARVE, 0.26, 0)
  tri(x0, x1, STONE, 0.3, 0.6)
  for (const dx of [-3.2, 0, 3.2]) {
    const h = dx === 0 ? 2.2 : 1.2
    for (const p of [-0.4, 0.4]) rectOn(out, f, z + s * 0.3, cx + dx + p - 0.3, cx + dx + p + 0.3, y0 + 0.5, y0 + 0.5 + h, WIN, 0.03)
  }
}

export function maisonArmeniens(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  const [x0, x1, z0, z1] = MAIN
  block(out, x0, x1, z0, z1, g - 0.3, g + EAVE, STONE)
  roof(out, x0 - 0.35, x1 + 0.35, z0 - 0.2, z1 + 0.2, g + EAVE, RIDGE_H, (x1 - x0) / 2 + 0.35, 0, SLATE)
  gable(out, '-z', z0, g)
  gable(out, '+z', z1, g)
  face(out, '-z', z0, x0 + 0.8, x1 - 0.8, g, 3)
  const n = Math.round((z1 - z0 - 2) / SIDE_BAY)
  face(out, '+x', x1, z0 + 1, z1 - 1, g, n)
  face(out, '-x', WBAY[0], z0 + 1, WBAY[2] - 0.3, g, 1)
  face(out, '-x', x0, WBAY[3] + 0.3, z1 - 1, g, n - 5)
  // the west pilastered bay
  block(out, WBAY[0], x0, WBAY[2], WBAY[3], g - 0.3, g + EAVE, STONE)
  face(out, '-x', WBAY[0], WBAY[2], WBAY[3], g, 3)
  for (const z of [WBAY[2], WBAY[3]]) block(out, WBAY[0] - 0.3, WBAY[0] + 0.2, z - 0.3, z + 0.3, g, g + EAVE, CARVE)
  // the stair tower at the back, slate cap
  const [tx0, tx1, tz0, tz1] = TOWER
  block(out, tx0, tx1, tz0, tz1, g - 0.3, g + TOWER_H, STONE)
  roof(out, tx0 - 0.2, tx1 + 0.2, tz0, tz1 + 0.2, g + TOWER_H, 2.4, (tx1 - tx0) / 2 + 0.2, 1.5, SLATE)
  for (let j = 0; j < LEVELS; j++) rectOn(out, '+z', tz1, -7.1, -6.2, g + 1.2 + j * FLOOR, g + 2.6 + j * FLOOR, WIN, 0.05)
  // the low porch before the boulevard gable: carved frieze, flat terrace in roof colour inset behind its coping
  const [px0, px1, pz0, pz1] = PORCH
  block(out, px0, px1, pz0, pz1, g - 0.3, g + PORCH_H - 0.8, STONE)
  for (const f of ['-z', '-x', '+x'] as const) {
    const plane = f === '-z' ? pz0 : f === '-x' ? px0 : px1
    const [a, b] = f === '-z' ? [px0, px1] : [pz0, pz1]
    rectOn(out, f, plane, a, b, g + PORCH_H - 1.5, g + PORCH_H - 0.9, CARVE, 0.08)
  }
  for (const x of [px0 + 2.2, (px0 + px1) / 2, px1 - 2.2]) archOn(out, '-z', pz0, x, g + 0.2, 1.6, 2.4, WIN, 0.05)
  block(out, px0 - 0.15, px1 + 0.15, pz0 - 0.15, pz1, g + PORCH_H - 0.8, g + PORCH_H - 0.5, CARVE)
  for (const [a, b, c, d] of [[px0 - 0.15, px1 + 0.15, pz0 - 0.15, pz0 + 0.15], [px0 - 0.15, px0 + 0.15, pz0, pz1], [px1 - 0.15, px1 + 0.15, pz0, pz1]])
    block(out, a, b, c, d, g + PORCH_H - 0.5, g + PORCH_H, STONE)
  block(out, px0 + 0.15, px1 - 0.15, pz0 + 0.15, pz1, g + PORCH_H - 0.5, g + PORCH_H - 0.45, FLAT)
  // the east annex, two storeys, flat roof behind a coping; entrance porch with gabled hood on its front
  const [ax0, ax1, az0, az1] = ANNEX
  block(out, ax0, ax1, az0, az1, g - 0.3, g + ANNEX_H, STONE)
  block(out, ax0, ax1 + 0.1, az0 - 0.1, az1 + 0.1, g + ANNEX_H, g + ANNEX_H + 0.4, CARVE)
  block(out, ax0, ax1 - 0.3, az0 + 0.3, az1 - 0.3, g + ANNEX_H + 0.4, g + ANNEX_H + 0.45, FLAT)
  for (let x = ax0 + 4; x < ax1 - 1; x += 2.6) {
    rectOn(out, '-z', az0, x - 0.6, x + 0.6, g + 0.8, g + 2.8, WIN, 0.05)
    rectOn(out, '-z', az0, x - 0.6, x + 0.6, g + 4.0, g + 6.0, WIN, 0.05)
  }
  const ex = ax0 + 1.8
  block(out, ex - 1.4, ex + 1.4, az0 - 0.9, az0, g - 0.3, g + 3.6, STONE)
  roof(out, ex - 1.6, ex + 1.6, az0 - 1.0, az0, g + 3.6, 1.2, 1.6, 0, SLATE)
  archOn(out, '-z', az0 - 0.9, ex, g, 1.8, 2.9, CARVE, 0.04)
  archOn(out, '-z', az0 - 0.9, ex, g, 1.2, 2.5, WIN, 0.07)
}
