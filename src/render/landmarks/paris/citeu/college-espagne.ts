/**
 * THE COLLÈGE D'ESPAGNE (Modesto López Otero, 1935): a Herrerian H in pale limestone, after El Escorial. Two long ranges
 * of a tall arched ground storey and five upper storeys of plain windows under grey slate, joined by a centre range; each
 * of the four range ends is a square tower one storey higher with a balustrade and spires tipped with balls at its corners
 * and on its parapet. The entrance ("COLEGIO DE ESPAÑA" over an arched door) is in the court that opens WNW onto the
 * footway and steps from the Cité's service road. Refs: Commons (docs/landmarks/refs/citeu/espagne/, 2026-11-04).
 * Plan from OSM way 52090417 rotated to its axes.
 * Local frame: x along bearing 215, −z toward bearing 305 (the entrance court, confirmed by the OSM footway and steps
 * running into it and the court view in the photos), origin the OSM outline's vertex mean.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { archedPane, dome, hex, pinnacle, roof, windows, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const STONE: Rgb = hex('#ddd3bd'), TRIM: Rgb = hex('#eae3d2'), SLATE: Rgb = hex('#59606a')
const GLASS: Rgb = hex('#2e343a'), FRAME: Rgb = hex('#efece4')
const ashlar = surfaceTag('ashlar')

type Box = [number, number, number, number]   // x0, x1, z0, z1

// storeys
const PLINTH = 0.8, GROUND = 4.6, FL = 3.0, UPPER = 5, EAVES = GROUND + UPPER * FL, TOWER_EXTRA = 3.4
const BAY = 3.0, WIN_W = 1.1, WIN_H = 1.65, ARCH_W = 1.8, ARCH_H = 3.0, CORNICE = 0.45
// roofs
const ROOF_H = 3.6, TOWER_ROOF_H = 2.2, BALUS_H = 1.0
// spires on the towers: corner spires and one at each parapet's middle
const SPIRE_H = 3.6, SPIRE_W = 0.7, BALL_R = 0.35
// plan (OSM, rotated)
const WEST: Box = [7.7, 15.9, -19.4, 18.8]    // range at +x
const EAST: Box = [-15.9, -7.7, -19.3, 18.9]  // range at −x
const SPINE: Box = [-7.7, 7.7, -3.6, 5.4]
const TOWER_D = 9.7
const TOWERS: Box[] = [
  [WEST[0], WEST[1], WEST[2], WEST[2] + TOWER_D], [WEST[0], WEST[1], WEST[3] - TOWER_D, WEST[3]],
  [EAST[0], EAST[1], EAST[2], EAST[2] + TOWER_D], [EAST[0], EAST[1], EAST[3] - TOWER_D, EAST[3]],
]
// the entrance: an arched door in the spine's court face
const DOOR_W = 2.6, DOOR_H = 4.0, LETTER_W = 7, LETTER_H = 0.5

/** a range or tower body: plinth, ashlar walls, string course, cornice, windows on the faces not abutting */
function body(out: MeshBuilder, b: Box, g: number, top: number, open: Record<'-z' | '+z' | '-x' | '+x', boolean>): void {
  const [x0, x1, z0, z1] = b, c = 0.12
  block(out, x0 - c, x1 + c, z0 - c, z1 + c, g, g + PLINTH, STONE, ashlar)
  block(out, x0, x1, z0, z1, g + PLINTH, g + top, STONE, ashlar)
  block(out, x0 - c, x1 + c, z0 - c, z1 + c, g + GROUND - 0.3, g + GROUND, TRIM, ashlar)
  block(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, g + top - CORNICE, g + top, TRIM, ashlar)
  const rows = Math.round((top - GROUND) / FL)
  const faces: ['-z' | '+z' | '-x' | '+x', number, number, number][] =
    [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]]
  for (const [f, plane, t0, t1] of faces) {
    if (!open[f]) continue
    for (let s = 0; s < rows; s++)
      windows(out, f, plane, t0 + 0.6, t1 - 0.6, g + GROUND + s * FL + 0.7, WIN_W, WIN_H, BAY, GLASS, FRAME)
    // ground storey: tall arched windows, as rect panes on the sides the arch helper can't face
    const n = Math.max(1, Math.floor((t1 - t0 - 1.2) / (BAY * 1.3))), step = (t1 - t0) / n
    for (let i = 0; i < n; i++) {
      const t = t0 + step * (i + 0.5)
      if (f === '-z') archedPane(out, plane - 0.05, t, g + PLINTH + 0.4, ARCH_W, ARCH_H, GLASS)
      else rectOn(out, f, plane, t - ARCH_W / 2, t + ARCH_W / 2, g + PLINTH + 0.4, g + PLINTH + 0.4 + ARCH_H - 0.4, GLASS, 0.07)
    }
  }
}

function tower(out: MeshBuilder, b: Box, g: number, abuts: '-z' | '+z'): void {
  const [x0, x1, z0, z1] = b, top = EAVES + TOWER_EXTRA
  body(out, b, g, top, { '-z': abuts !== '-z', '+z': abuts !== '+z', '-x': true, '+x': true })
  // a balustrade on the parapet, a low hipped roof behind it
  const y = g + top
  for (const [a0, a1, b0, b1] of [[x0, x1, z0, z0 + 0.35], [x0, x1, z1 - 0.35, z1], [x0, x0 + 0.35, z0, z1], [x1 - 0.35, x1, z0, z1]])
    block(out, a0, a1, b0, b1, y, y + BALUS_H, TRIM, ashlar)
  roof(out, x0 + 0.4, x1 - 0.4, z0 + 0.4, z1 - 0.4, y, TOWER_ROOF_H, (x1 - x0) / 2 - 1, (z1 - z0) / 2 - 1, SLATE)
  const spires: [number, number][] = [[x0, z0], [x1, z0], [x0, z1], [x1, z1],
    [(x0 + x1) / 2, z0], [(x0 + x1) / 2, z1], [x0, (z0 + z1) / 2], [x1, (z0 + z1) / 2]]
  for (const [sx, sz] of spires) {
    const ix = sx + Math.sign((x0 + x1) / 2 - sx) * 0.3, iz = sz + Math.sign((z0 + z1) / 2 - sz) * 0.3
    pinnacle(out, ix, iz, y + BALUS_H, SPIRE_H, SPIRE_W, TRIM)
    dome(out, ix, iz, y + BALUS_H + SPIRE_H - 0.1, BALL_R, BALL_R * 2, TRIM, 6)
  }
}

export function collegeEspagne(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  // the two long ranges between their towers, the centre range between them
  for (const r of [WEST, EAST]) {
    const mid: Box = [r[0], r[1], r[2] + TOWER_D, r[3] - TOWER_D]
    body(out, mid, g, EAVES, { '-z': false, '+z': false, '-x': true, '+x': true })
    roof(out, mid[0] - 0.3, mid[1] + 0.3, mid[2], mid[3], g + EAVES, ROOF_H, (mid[1] - mid[0]) / 2 + 0.3, 0, SLATE)
  }
  body(out, SPINE, g, EAVES, { '-z': true, '+z': true, '-x': false, '+x': false })
  roof(out, SPINE[0], SPINE[1], SPINE[2] - 0.3, SPINE[3] + 0.3, g + EAVES, ROOF_H, 0, (SPINE[3] - SPINE[2]) / 2 + 0.3, SLATE)
  for (const t of TOWERS) tower(out, t, g, t[2] < 0 ? '+z' : '-z')
  // the entrance in the court face of the centre range: a stone surround, the arched door, the lettering band, steps
  const z = SPINE[2]
  rectOn(out, '-z', z, -DOOR_W / 2 - 0.6, DOOR_W / 2 + 0.6, g, g + DOOR_H + 0.9, TRIM, 0.12)
  archedPane(out, z - 0.16, 0, g + 0.3, DOOR_W, DOOR_H, GLASS)
  rectOn(out, '-z', z, -LETTER_W / 2, LETTER_W / 2, g + GROUND - 0.9, g + GROUND - 0.9 + LETTER_H, hex('#9c907a'), 0.1)
  block(out, -DOOR_W, DOOR_W, z - 1.8, z, g, g + 0.3, TRIM, ashlar)
}
