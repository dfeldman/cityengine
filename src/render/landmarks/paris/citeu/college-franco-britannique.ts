/**
 * THE COLLÈGE FRANCO-BRITANNIQUE of the Cité Universitaire (Pierre Martin & Maurice Vieu, 1936): a collegiate neo-Tudor U of red
 * brick, five storeys of white-framed sash windows under steep grey slate roofs, the long faces broken by tall pointed cross
 * gables with stone coping, and a square brick tower capped by a small domed lantern near the east end of the range. Plan from
 * OSM way/52090391, rotated to its axes. Refs: Commons (docs/landmarks/refs/citeu/franco-britannique/, 2026-11-04).
 * Local frame: x along the range (west → east, bearing 108), −z the court front (bearing 198), origin the OSM outline's vertex mean.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { dome, hex, roof, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const BRICK: Rgb = hex('#8e3f2e'), STONE: Rgb = hex('#ddd4c0'), SLATE: Rgb = hex('#4a4d55'), GLASS: Rgb = hex('#323a42'), WHITE: Rgb = hex('#eeeae0')
const LEAD: Rgb = hex('#6f7a74')
const brick = surfaceTag('brick')

const G = 3.6, FL = 3.0, LEVELS = 5, EAVES = G + (LEVELS - 1) * FL
const WIN_W = 1.2, WIN_H = 1.8, BAY = 2.9, FRAME = 0.12, PLINTH = 0.9
const ROOF_H = 7.5                       // steep slate roofs
const GABLE_W = 8, GABLE_H = 7, GABLE_PROUD = 0.7, COPING = 0.35
const TOWER: [number, number, number] = [11, 14, 4.2]   // x, z, half-width
const TOWER_H = EAVES + 9, LANTERN_R = 2.2, LANTERN_H = 3, DOME_H = 2.6

type Box = [number, number, number, number]   // x0, x1, z0, z1
const RANGE: Box = [-26, 13.5, 5, 23]
const EAST: Box = [13.5, 35.6, 5, 16.4]
const WINGS: Box[] = [[-26, -12.4, -29.4, 5], [13.5, 26.8, -29.8, 5]]
/** cross gables: [face, centre along face] */
const GABLES: ['-z' | '+z' | '-x' | '+x', number][] = [
  ['-z', -5], ['-z', 5], ['-z', 30.5], ['+z', -18], ['+z', -6], ['+z', 6],
  ['-x', -24], ['-x', -12], ['+x', -24], ['-z', -19.2], ['-z', 20.1],
]

type Face = '-z' | '+z' | '-x' | '+x'
function faces([x0, x1, z0, z1]: Box): [Face, number, number, number][] {
  return [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]]
}

function walls(out: MeshBuilder, y: number, b: Box, skip: Face[] = []): void {
  const [x0, x1, z0, z1] = b
  block(out, x0, x1, z0, z1, y, y + EAVES, BRICK, brick)
  block(out, x0 - 0.08, x1 + 0.08, z0 - 0.08, z1 + 0.08, y, y + PLINTH, STONE)
  block(out, x0 - 0.06, x1 + 0.06, z0 - 0.06, z1 + 0.06, y + G - 0.25, y + G, STONE)            // string course
  for (const [f, plane, t0, t1] of faces(b)) {
    if (skip.includes(f)) continue
    const n = Math.max(1, Math.floor((t1 - t0 - 1) / BAY)), step = (t1 - t0) / n
    for (let i = 0; i < n; i++) {
      const t = t0 + step * (i + 0.5)
      for (let s = 0; s < LEVELS; s++) {
        const ys = y + (s === 0 ? 1.2 : G + (s - 1) * FL + 0.6)
        rectOn(out, f, plane, t - WIN_W / 2 - FRAME, t + WIN_W / 2 + FRAME, ys - FRAME, ys + WIN_H + FRAME, WHITE, 0.04)
        rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, ys, ys + WIN_H, GLASS, 0.07)
      }
    }
  }
}

/** a pointed brick gable with stone coping, standing proud of a face, its own slate roof running back into the main one */
function gable(out: MeshBuilder, y: number, f: Face, plane: number, t: number): void {
  const w = GABLE_W / 2, back = 5, yr = y + EAVES, s = f[0] === '-' ? -1 : 1
  const n0 = plane + s * GABLE_PROUD, n1 = plane - s * back
  const lo = Math.min(n0, n1), hi = Math.max(n0, n1)
  const along = f[1] === 'z'   // the face runs along x
  const bx = (a: number, b: number, c: number, d: number): Box => along ? [a, b, c, d] : [c, d, a, b]
  const [ax0, ax1, az0, az1] = bx(t - w, t + w, lo, hi)
  block(out, ax0, ax1, az0, az1, y, yr, BRICK, brick)                                             // the projecting bay
  const [rx0, rx1, rz0, rz1] = bx(t - w - 0.3, t + w + 0.3, lo - (s < 0 ? 0.2 : 0), hi + (s > 0 ? 0.2 : 0))
  roof(out, rx0, rx1, rz0, rz1, yr, GABLE_H, along ? w + 0.3 : 0, along ? 0 : w + 0.3, SLATE)
  // the gable wall: a stone coping triangle, the brick one just in front
  const face = n0 + s * 0.05
  const [cx0, cx1, cz0, cz1] = bx(t - w - COPING, t + w + COPING, Math.min(face, face + s * 0.15), Math.max(face, face + s * 0.15))
  roof(out, cx0, cx1, cz0, cz1, yr - 0.2, GABLE_H + 0.4, along ? w + COPING : 0, along ? 0 : w + COPING, STONE)
  const f2 = face + s * 0.15
  const [gx0, gx1, gz0, gz1] = bx(t - w, t + w, Math.min(f2, f2 + s * 0.1), Math.max(f2, f2 + s * 0.1))
  roof(out, gx0, gx1, gz0, gz1, yr - 0.2, GABLE_H, along ? w : 0, along ? 0 : w, BRICK)
  // windows on the bay front, three storeys up into the gable
  for (let s2 = 0; s2 < LEVELS + 1; s2++) {
    const ys = y + (s2 === 0 ? 1.2 : G + (s2 - 1) * FL + 0.6)
    const ww = s2 === LEVELS ? 1.0 : 1.6
    rectOn(out, f, n0, t - ww / 2 - FRAME, t + ww / 2 + FRAME, ys - FRAME, ys + WIN_H + FRAME, WHITE, 0.04)
    rectOn(out, f, n0, t - ww / 2, t + ww / 2, ys, ys + WIN_H, GLASS, 0.07)
  }
}

export function collegeFrancoBritannique(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, yr = y + EAVES
  const [rx0, rx1, rz0, rz1] = RANGE
  walls(out, y, RANGE)
  roof(out, rx0 - 0.4, rx1 + 0.4, rz0 - 0.4, rz1 + 0.4, yr, ROOF_H, 0, (rz1 - rz0) / 2 + 0.4, SLATE)
  const [ex0, ex1, ez0, ez1] = EAST
  walls(out, y, EAST, ['-x'])
  roof(out, ex0 - 2, ex1 + 0.4, ez0 - 0.4, ez1 + 0.4, yr, ROOF_H * 0.75, 0, (ez1 - ez0) / 2 + 0.4, SLATE)
  for (const b of WINGS) {
    const [x0, x1, z0] = b
    walls(out, y, [x0, x1, z0, rz0], ['+z'])
    roof(out, x0 - 0.4, x1 + 0.4, z0 - 0.4, rz0 + 4, yr, ROOF_H, (x1 - x0) / 2 + 0.4, 0, SLATE)
  }
  const planes: Record<Face, (t: number) => number | null> = {
    '-z': t => (t < -12.4 && t > -26) || (t > 13.5 && t < 26.8) ? WINGS[t < 0 ? 0 : 1][2] : t > 26.8 ? ez0 : rz0,
    '+z': t => (t < rx1 ? rz1 : ez1),
    '-x': t => (t < rz0 ? WINGS[0][0] : rx0),
    '+x': t => (t < rz0 ? WINGS[1][1] : t < ez1 ? ex1 : null),
  }
  for (const [f, t] of GABLES) {
    const p = planes[f](t)
    if (p === null) continue
    gable(out, y, f, p, t)
  }
  // the tower and its lantern
  const [tx, tz, th] = TOWER
  block(out, tx - th, tx + th, tz - th, tz + th, y, y + TOWER_H, BRICK, brick)
  block(out, tx - th - 0.2, tx + th + 0.2, tz - th - 0.2, tz + th + 0.2, y + TOWER_H - 0.5, y + TOWER_H, STONE)
  for (const [f, plane] of faces([tx - th, tx + th, tz - th, tz + th])) {
    const c = f[1] === 'z' ? tx : tz
    rectOn(out, f, plane, c - 0.6, c + 0.6, y + TOWER_H - 4, y + TOWER_H - 1.5, GLASS, 0.07)
  }
  block(out, tx - LANTERN_R, tx + LANTERN_R, tz - LANTERN_R, tz + LANTERN_R, y + TOWER_H, y + TOWER_H + LANTERN_H, WHITE)
  dome(out, tx, tz, y + TOWER_H + LANTERN_H, LANTERN_R + 0.3, DOME_H, LEAD, 8)
  block(out, tx - 0.12, tx + 0.12, tz - 0.12, tz + 0.12, y + TOWER_H + LANTERN_H + DOME_H, y + TOWER_H + LANTERN_H + DOME_H + 1.8, LEAD)
}
