/**
 * THE MAISON HEINRICH HEINE — JOHANNES KRAHN & PAUL MAITRE (1956): a five-storey slab plus a set-back attic. The
 * narrow end toward the campus walk is clad in pale stone with one off-centre column of windows. The long sides are
 * a grey concrete grid with salmon-red spandrels and small white balconies, and each side has three shallow
 * projecting bays. A single-storey glazed lobby with two glazed wings spreads across the front, its name band on
 * the slab end.
 * Refs: Commons "Maison-heinrich-heine.jpg", "Fondation de l'Allemagne - Maison Heinrich Heine.jpg", "… Heine 098/100.jpg",
 * "Paris 14 Maison Heinrich Heine 205 …" (docs/landmarks/refs/citeu/heine/).
 * Plan from OSM way 260185584 (cadastre). Local frame: −z toward bearing 18.8 (the entrance), x toward 108.8; origin the bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const STONE: Rgb = hex('#d6cbb2'), FRAME: Rgb = hex('#9a9c9c'), RED: Rgb = hex('#d4644c'), WIN: Rgb = hex('#3c4650')
const GLASS: Rgb = hex('#4d5a62'), WHITE: Rgb = hex('#e8e8e4'), BASE: Rgb = hex('#b8b4aa'), ROOF: Rgb = hex('#8a8a86')
const SOFFIT: Rgb = hex('#c9c6be'), LETTER: Rgb = hex('#ebe6d8')

export const W = 36.3, D = 76.6
const GF = 3.8, FLOOR = 2.9, UPPER = 5             // glazed ground storey, room storeys
const TOP = GF + UPPER * FLOOR                       // ≈18.3
const ATTIC = 2.6, ATTIC_IN = 1.4                    // set-back attic
const SX0 = -5.1, SX1 = 5.5, SZ0 = -21.5, SZ1 = 38.3 // slab
const BAYS: number[][] = [[2.4, 10.5], [15.0, 23.2], [27.8, 36.0]]   // projecting bays along z
const BAY_OUT = 2.4
const COLW = 3.0                                     // grid module along the long sides
const LOBBY_H = 4.0
// low glazed pieces [x0, x1, z0, z1]
const LOBBY: number[] = [-5.1, 5.4, -25.5, -15.6]
const WINGS: number[][] = [[-18.1, -6.7, -35.2, -15.2], [6.8, 18.1, -35.4, -15.5]]

/** a long side: grey grid, red spandrels, windows and balconies; f is ±x, plane its x, z0..z1 its extent */
function gridFace(out: MeshBuilder, f: '-x' | '+x', plane: number, z0: number, z1: number, g: number): void {
  const n = Math.max(1, Math.round((z1 - z0) / COLW)), step = (z1 - z0) / n, s = f === '+x' ? 1 : -1
  for (let k = 0; k < n; k++) {
    const a = z0 + k * step, b = a + step
    for (let j = 0; j < UPPER; j++) {
      const y = g + GF + j * FLOOR
      rectOn(out, f, plane, a + 0.25, b - 0.25, y + 0.1, y + 0.95, RED, 0.04)
      rectOn(out, f, plane, a + 0.35, b - 0.35, y + 0.95, y + FLOOR - 0.2, WIN, 0.05)
      if ((k + j) % 2 === 0) {   // a small white balcony box on alternate windows
        const m = (a + b) / 2, x = plane + s * 0.45
        block(out, Math.min(plane, x), Math.max(plane, x), m - 0.7, m + 0.7, y + 0.9, y + 1.0, WHITE)
        block(out, Math.min(x, x + s * 0.05), Math.max(x, x + s * 0.05), m - 0.7, m + 0.7, y + 1.0, y + 1.8, WHITE)
      }
    }
    rectOn(out, f, plane, a - 0.15, a + 0.15, g + GF, g + TOP, FRAME, 0.08)   // pilaster
  }
  rectOn(out, f, plane, z0, z1, g, g + GF, GLASS, 0.03)
  rectOn(out, f, plane, z0, z1, g + TOP - 0.35, g + TOP, FRAME, 0.1)
}

function glassBox(out: MeshBuilder, b: number[], g: number, h: number): void {
  const [x0, x1, z0, z1] = b
  block(out, x0, x1, z0, z1, g, g + 0.7, BASE)
  block(out, x0 + 0.1, x1 - 0.1, z0 + 0.1, z1 - 0.1, g + 0.7, g + h - 0.4, GLASS)
  block(out, x0 - 0.5, x1 + 0.5, z0 - 0.5, z1 + 0.5, g + h - 0.4, g + h, WHITE)   // thin flat roof slab
  for (let x = x0 + 1.5; x < x1 - 0.5; x += 2.5) {
    rectOn(out, '-z', z0 + 0.1, x - 0.06, x + 0.06, g + 0.7, g + h - 0.4, WHITE, 0.03)
  }
}

export function maisonHeine(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  // slab body: glazed recessed ground floor, rooms above
  block(out, SX0 + 0.6, SX1 - 0.6, SZ0 + 0.6, SZ1 - 0.6, g - 0.3, g + GF, GLASS)
  block(out, SX0, SX1, SZ0, SZ1, g + GF, g + TOP, FRAME)
  gridFace(out, '-x', SX0, SZ0, SZ1, g)
  gridFace(out, '+x', SX1, SZ0, SZ1, g)
  for (const [a, b] of BAYS) {
    block(out, SX0 - BAY_OUT, SX0, a, b, g + GF, g + TOP, FRAME)
    block(out, SX1, SX1 + BAY_OUT, a, b, g + GF, g + TOP, FRAME)
    gridFace(out, '-x', SX0 - BAY_OUT, a, b, g)
    gridFace(out, '+x', SX1 + BAY_OUT, a, b, g)
  }
  // ground-floor pilotis along the long sides
  for (let z = SZ0 + 1; z < SZ1; z += 6) for (const x of [SX0 + 0.3, SX1 - 0.3]) block(out, x - 0.2, x + 0.2, z - 0.2, z + 0.2, g, g + GF, WHITE)
  // the stone ends, with the off-centre window column and the name band
  for (const [f, z] of [['-z', SZ0], ['+z', SZ1]] as const) {
    rectOn(out, f, z, SX0, SX1, g + GF, g + TOP, STONE, 0.06)
    for (let j = 0; j < UPPER; j++) {
      const y = g + GF + j * FLOOR + 0.5
      rectOn(out, f, z, 1.1, 2.7, y, y + 1.9, WIN, 0.09)
    }
  }
  rectOn(out, '-z', SZ0, SX0, SX1, g + GF - 0.1, g + GF + 0.6, FRAME, 0.1)
  for (let x = -3.9; x < 4.4; x += 0.75) rectOn(out, '-z', SZ0, x, x + 0.45, g + GF + 0.12, g + GF + 0.45, LETTER, 0.12)
  // set-back attic and roof
  block(out, SX0 - 0.1, SX1 + 0.1, SZ0 - 0.1, SZ1 + 0.1, g + TOP, g + TOP + 0.15, ROOF)
  block(out, SX0 + ATTIC_IN, SX1 - ATTIC_IN, SZ0 + ATTIC_IN, SZ1 - ATTIC_IN, g + TOP, g + TOP + ATTIC, SOFFIT)
  for (const f of ['-x', '+x'] as const) {
    rectOn(out, f, f === '-x' ? SX0 + ATTIC_IN : SX1 - ATTIC_IN, SZ0 + ATTIC_IN, SZ1 - ATTIC_IN, g + TOP + 0.4, g + TOP + ATTIC - 0.4, WIN, 0.04)
  }
  // the glazed lobby and its wings, columns under the front canopy
  glassBox(out, LOBBY, g, LOBBY_H)
  for (const w of WINGS) glassBox(out, w, g, LOBBY_H)
  block(out, -6.7, 6.8, -21.6, -15.2, g, g + 0.7, BASE)
  block(out, -6.7, 6.8, -21.6, -15.2, g + 0.7, g + LOBBY_H - 0.4, GLASS)
  block(out, -6.7, 6.8, -21.6, -15.2, g + LOBBY_H - 0.4, g + LOBBY_H, WHITE)
  for (const x of [-4.5, 4.9]) block(out, x - 0.25, x + 0.25, LOBBY[2] - 0.25, LOBBY[2] + 0.25, g, g + LOBBY_H, WHITE)
}
