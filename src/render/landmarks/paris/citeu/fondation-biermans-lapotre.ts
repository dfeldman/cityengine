/**
 * THE FONDATION BIERMANS-LAPÔTRE (Armand Guéritte, 1927), the Belgian house: Flemish neo-Renaissance in red brick dressed
 * with pale stone. A dumbbell plan: a long bar between two broad end pavilions, all on a stone ground storey with round-
 * headed windows, four brick storeys in stone surrounds, a top storey behind a stone balcony, steep slate hipped roofs.
 * The bar's Boulevard Jourdan flank, recessed between the pavilions, carries the frontispiece: a stone portal, a stone loggia storey between two corbelled turrets with
 * pointed spires, and a stepped brick gable with stone copings and a clock. Stepped-gable dormers on the pavilions.
 * Refs: Commons (docs/landmarks/refs/citeu/biermans/, 2026-11-04). Plan from OSM way/28840944 rotated to its axes.
 * Local frame: x along bearing 18.5, −z toward bearing 108.5 (the far end's stair bay); the frontispiece faces +x, bearing 18.5, the boulevard, origin the OSM outline's vertex mean.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, placed, roof, turret, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const BRICK: Rgb = hex('#a4523b'), STONE: Rgb = hex('#e3d8bf'), SLATE: Rgb = hex('#4b5058'), GLASS: Rgb = hex('#2c3238')
const CLOCK: Rgb = hex('#f2eee4')
const brick = surfaceTag('brick'), ashlar = surfaceTag('ashlar')

type Face = '-z' | '+z' | '-x' | '+x'
type Box = [number, number, number, number]   // x0, x1, z0, z1

// storeys: stone ground floor, brick floors, the top storey behind its balcony
const GROUND = 4.6, FL = 3.2, BRICK_FLOORS = 4, TOP = 3.0
const EAVES = GROUND + BRICK_FLOORS * FL + TOP
const BAY = 3.4, WIN_W = 1.4, WIN_H = 1.9, QUOIN = 0.9, CORNICE = 0.35
// plan (OSM)
const BAR: Box = [-6.7, 6.7, -14.6, 24.3]
const FRONT: Box = [-16.9, 16.9, -27.8, -14.6]
const BACK: Box = [-17.0, 16.8, 24.3, 37.6]
const NECK: Box = [-9.7, 9.5, 21.3, 24.3]
const STAIR: Box = [-4.8, 5.0, -29.4, -27.8]   // the OSM outline's bump on the far end
// the frontispiece on the bar's +x (Boulevard Jourdan) flank: centre z, width, projection, gable depth into the roof
const FRONTIS_Z = (-14.6 + 21.3) / 2, FRONTIS_W = 10, FRONTIS_D = 1.6, FRONTIS_DEEP = 3.5, FRONTIS_ANGLE = -Math.PI / 2
const ARCH_SEGS = 6
// roofs: height, ridge inset along the ridge
const PAV_ROOF = 9.5, PAV_INSET = 5, BAR_ROOF = 7.5, ROOF_OVER = 0.5
// frontispiece: loggia storey, stepped gable, turrets
const STEPS = 5, STEP_H = 1.9, STEP_IN = 0.85, TURRET_R = 1.25, TURRET_SPIRE = 5.5, TURRET_UP = 2.2
// stepped dormer gables: where (face, centre along it), width, steps
const DORMER_W = 6.5, DORMER_STEPS = 3, DORMER_STEP_H = 1.6
const DORMERS: [Face, number, Box][] = [
  ['-x', -21.2, FRONT], ['+x', -21.2, FRONT], ['-x', 31, BACK], ['+x', 31, BACK],
  ['-z', -11.5, FRONT], ['-z', 11.5, FRONT], ['+z', -11.5, BACK], ['+z', 11.5, BACK], ['+z', 0, BACK],
]
const BAR_DORMER_STEP = 6.5, CHIMNEYS: [number, number][] = [[-3.5, -8], [3.5, 4], [-3.5, 16], [8, 31], [-8, -21]]

function faces([x0, x1, z0, z1]: Box): [Face, number, number, number][] {
  return [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]]
}
const outward = (f: Face): number => (f === '-z' || f === '-x' ? -1 : 1)

/** a wing: the stone base, the brick body, string courses, quoins, windows in bays (skipping covered spans) */
function wing(out: MeshBuilder, b: Box, g: number, skip: (f: Face, t: number) => boolean): void {
  const [x0, x1, z0, z1] = b, yb = g + GROUND, ye = g + EAVES
  block(out, x0, x1, z0, z1, g, yb, STONE, ashlar)
  block(out, x0, x1, z0, z1, yb, ye, BRICK, brick)
  const c = 0.12
  block(out, x0 - c, x1 + c, z0 - c, z1 + c, yb - 0.4, yb, STONE, ashlar)                      // string course
  block(out, x0 - 0.6, x1 + 0.6, z0 - 0.6, z1 + 0.6, ye - TOP - 0.25, ye - TOP, STONE, ashlar)  // the balcony
  block(out, x0 - CORNICE, x1 + CORNICE, z0 - CORNICE, z1 + CORNICE, ye - 0.4, ye, STONE, ashlar)
  for (const x of [x0, x1]) for (const z of [z0, z1]) {                                       // stone quoins
    block(out, x - c, x + c, z - c, z + c, yb, ye, STONE, ashlar)
    block(out, Math.min(x, x + (x === x0 ? QUOIN : -QUOIN)), Math.max(x, x + (x === x0 ? QUOIN : -QUOIN)),
      Math.min(z, z + (z === z0 ? QUOIN : -QUOIN)), Math.max(z, z + (z === z0 ? QUOIN : -QUOIN)), yb, ye, STONE, ashlar)
  }
  for (const [f, plane, t0, t1] of faces(b)) {
    const n = Math.max(1, Math.floor((t1 - t0 - 1.5) / BAY)), step = (t1 - t0) / n
    for (let i = 0; i < n; i++) {
      const t = t0 + step * (i + 0.5)
      if (skip(f, t)) continue
      // the ground floor: tall round-headed openings
      arch(out, f, plane, t, g + 0.9, WIN_W + 0.3, 3.2, GLASS, 0.06)
      for (let s = 0; s <= BRICK_FLOORS; s++) {
        const y = yb + s * FL + 0.7, h = s === BRICK_FLOORS ? TOP - 0.9 : WIN_H
        rectOn(out, f, plane, t - WIN_W / 2 - 0.25, t + WIN_W / 2 + 0.25, y - 0.25, y + h + 0.3, STONE, 0.04)
        rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + h, GLASS, 0.07)
      }
    }
  }
}

/** a stepped brick gable on a face, stone copings on each step; returns its top */
function steppedGable(out: MeshBuilder, f: Face, plane: number, t: number, w: number, y0: number, steps: number,
                      stepH: number, stepIn: number, depth: number): number {
  const s = outward(f)
  let y = y0, hw = w / 2
  for (let i = 0; i < steps; i++, y += stepH, hw -= stepIn) {
    const a = plane + s * 0.15, d = plane - s * depth
    const [p0, p1] = [Math.min(a, d), Math.max(a, d)]
    if (f === '-z' || f === '+z') {
      block(out, t - hw, t + hw, p0, p1, y, y + stepH, BRICK, brick)
      block(out, t - hw - 0.1, t + hw + 0.1, p0 - 0.08, p1 + 0.08, y + stepH - 0.18, y + stepH, STONE, ashlar)
    } else {
      block(out, p0, p1, t - hw, t + hw, y, y + stepH, BRICK, brick)
      block(out, p0 - 0.08, p1 + 0.08, t - hw - 0.1, t + hw + 0.1, y + stepH - 0.18, y + stepH, STONE, ashlar)
    }
  }
  return y
}

function pavilionRoof(out: MeshBuilder, b: Box, y: number): void {
  const [x0, x1, z0, z1] = b, o = ROOF_OVER
  roof(out, x0 - o, x1 + o, z0 - o, z1 + o, y, PAV_ROOF, PAV_INSET, (z1 - z0) / 2 + o, SLATE)
}

export function fondationBiermansLapotre(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0, ye = g + EAVES
  const inX = (t: number, a: number, b: number): boolean => t > a && t < b
  // the wings; no windows where another volume covers the face
  wing(out, FRONT, g, (f, t) => (f === '+z' && inX(t, BAR[0] - 1, BAR[1] + 1)) || (f === '-z' && inX(t, STAIR[0] - 0.5, STAIR[1] + 0.5)))
  wing(out, BACK, g, (f, t) => f === '-z' && inX(t, NECK[0] - 1, NECK[1] + 1))
  wing(out, [BAR[0], BAR[1], BAR[2], NECK[2]], g, (f, t) => f === '-z' || f === '+z' || (f === '+x' && inX(t, FRONTIS_Z - FRONTIS_W / 2 - 1, FRONTIS_Z + FRONTIS_W / 2 + 1)))
  wing(out, NECK, g, (f) => f === '-z' || f === '+z')
  pavilionRoof(out, FRONT, ye)
  pavilionRoof(out, BACK, ye)
  roof(out, BAR[0] - ROOF_OVER, BAR[1] + ROOF_OVER, FRONT[3] - 2, BACK[2] + 2, ye, BAR_ROOF, (BAR[1] - BAR[0]) / 2 + ROOF_OVER, 0, SLATE)
  // roof dormers along the bar
  for (let z = BAR[2] + 4; z < NECK[2] - 3; z += BAR_DORMER_STEP) for (const f of ['-x', '+x'] as Face[]) {
    const x = f === '-x' ? BAR[0] + 0.8 : BAR[1] - 0.8, s = outward(f)
    block(out, Math.min(x, x - s * 1.6), Math.max(x, x - s * 1.6), z - 0.9, z + 0.9, ye, ye + 2.2, STONE, ashlar)
    rectOn(out, f, x, z - 0.55, z + 0.55, ye + 0.3, ye + 1.8, GLASS, 0.05)
    roof(out, Math.min(x, x - s * 1.6) - 0.1, Math.max(x, x - s * 1.6) + 0.1, z - 1.1, z + 1.1, ye + 2.2, 1.0, 0, 1.1, SLATE)
  }
  // stepped dormer gables on the pavilions
  for (const [f, t, b] of DORMERS) {
    const plane = f === '-z' ? b[2] : f === '+z' ? b[3] : f === '-x' ? b[0] : b[1]
    steppedGable(out, f, plane, t, DORMER_W, ye - 0.4, DORMER_STEPS, DORMER_STEP_H, 1.0, 1.6)
    rectOn(out, f, plane + outward(f) * 0.15, t - 0.8, t + 0.8, ye + 0.3, ye + 2.4, GLASS, 0.05)
  }
  for (const [x, z] of CHIMNEYS) block(out, x - 0.6, x + 0.6, z - 0.9, z + 0.9, ye + 3, ye + PAV_ROOF - 1, BRICK, brick)
  // the stair bay the OSM outline pushes out of the far pavilion's end: plain brick on stone
  wing(out, STAIR, g, (f) => f === '+z')
  // the frontispiece, centred on the bar's Boulevard Jourdan flank between the pavilions (+x)
  const part = new MeshBuilder()
  frontispiece(part, g, ye)
  placed(out, part, FRONTIS_ANGLE, BAR[1], FRONTIS_Z)
}

/** drawn on the −z face of its own frame: the wall at z = 0, the centre at x = 0 */
function frontispiece(out: MeshBuilder, g: number, ye: number): void {
  const fx1 = FRONTIS_W / 2, fx0 = -fx1, fz0 = -FRONTIS_D, fz1 = 0.5
  block(out, fx0 - 1, fx1 + 1, fz0 - 0.3, fz1, g, g + GROUND + 0.6, STONE, ashlar)
  block(out, fx0, fx1, fz0, fz1, g + GROUND, ye, BRICK, brick)
  arch(out, '-z', fz0 - 0.3, 0, g + 0.6, 3.2, 3.6, GLASS, 0.06)                                // the portal
  rectOn(out, '-z', fz0 - 0.3, -4.6, -2.0, g + 0.8, g + 4.6, STONE, 0.12)                    // the carved reliefs
  rectOn(out, '-z', fz0 - 0.3, 2.0, 4.6, g + 0.8, g + 4.6, STONE, 0.12)
  block(out, -3.4, 3.4, fz0 - 2.2, fz0 - 0.3, g, g + 0.6, STONE, ashlar)                     // the steps
  for (let s = 0; s < BRICK_FLOORS - 1; s++) for (const t of [-2.5, 0, 2.5]) {
    const y = g + GROUND + s * FL + 0.7
    rectOn(out, '-z', fz0, t - 0.8, t + 0.8, y - 0.25, y + WIN_H + 0.3, STONE, 0.04)
    rectOn(out, '-z', fz0, t - 0.55, t + 0.55, y, y + WIN_H, GLASS, 0.07)
  }
  const yl = g + GROUND + (BRICK_FLOORS - 1) * FL                                             // the loggia storey
  block(out, fx0, fx1, fz0 - 0.2, fz1, yl, ye + 1.2, STONE, ashlar)
  for (const t of [-3.6, -1.2, 1.2, 3.6]) arch(out, '-z', fz0 - 0.2, t, yl + 0.6, 1.5, FL + 1.0, GLASS, 0.05)
  const top = steppedGable(out, '-z', fz0, 0, fx1 - fx0, ye + 1.2, STEPS, STEP_H, STEP_IN, FRONTIS_DEEP)
  roof(out, fx0 + 0.6, fx1 - 0.6, fz0 + FRONTIS_DEEP, fz0 + FRONTIS_DEEP + 4, ye, STEPS * STEP_H, (fx1 - fx0) / 2 - 0.6, 0, SLATE)
  block(out, -0.4, 0.4, fz0 - 0.1, fz0 + 0.7, top, top + 1.2, STONE, ashlar)                  // the finial
  const yc = ye + 1.2 + STEP_H * 2.3
  disc(out, '-z', fz0 - 0.15, 0, yc, 1.25, STONE, 0.02)                                       // the clock
  disc(out, '-z', fz0 - 0.15, 0, yc, 1.0, CLOCK, 0.06)
  for (const x of [fx0, fx1]) turret(out, x, fz0, yl, ye + TURRET_UP, TURRET_R, TURRET_SPIRE, STONE, SLATE)
}

/** a point on a face: t along it, y up, d proud of it (rectOn's convention) */
function at(f: Face, plane: number, t: number, y: number, d: number): [number, number, number] {
  return f === '-z' ? [t, y, plane - d] : f === '+z' ? [t, y, plane + d] : f === '-x' ? [plane - d, y, t] : [plane + d, y, t]
}
const NORMAL: Record<Face, [number, number, number]> = { '-z': [0, 0, -1], '+z': [0, 0, 1], '-x': [-1, 0, 0], '+x': [1, 0, 0] }

/** a fan of segments from (t, cy) between angles a0..a1, radius r */
function fan(out: MeshBuilder, f: Face, plane: number, t: number, cy: number, r: number, a0: number, a1: number, n: number, c: Rgb, d: number): void {
  for (let i = 0; i < n; i++) {
    const b0 = a0 + (a1 - a0) * i / n, b1 = a0 + (a1 - a0) * (i + 1) / n
    out.quad([at(f, plane, t, cy, d), at(f, plane, t + Math.cos(b0) * r, cy + Math.sin(b0) * r, d),
      at(f, plane, t + Math.cos(b1) * r, cy + Math.sin(b1) * r, d), at(f, plane, t, cy, d)], NORMAL[f],
    [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
  }
}
/** a round-headed opening w wide, h tall overall, sill at y0 */
function arch(out: MeshBuilder, f: Face, plane: number, t: number, y0: number, w: number, h: number, c: Rgb, d: number): void {
  rectOn(out, f, plane, t - w / 2, t + w / 2, y0, y0 + h - w / 2, c, d)
  fan(out, f, plane, t, y0 + h - w / 2, w / 2, 0, Math.PI, ARCH_SEGS, c, d)
}
const disc = (out: MeshBuilder, f: Face, plane: number, t: number, cy: number, r: number, c: Rgb, d: number): void =>
  fan(out, f, plane, t, cy, r, 0, Math.PI * 2, ARCH_SEGS * 2, c, d)
