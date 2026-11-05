/**
 * THE MAISON DES PROVINCES DE FRANCE (Armand Guéritte, 1933): a big U of six brick storeys under a two-row slate mansard.
 * Buff brick panels framed by red brick (a red ground storey, red pilasters at the corners and round the gable bays, a red
 * top storey), white-framed windows; tall round-topped stone-edged gables with medallions breaking the eaves at every
 * wing end and along the flanks. The court opens SSW onto the lawn: a stone two-storey portico on the centre block, red
 * brick ground-floor arcades between it and the wings. Refs: Commons (docs/landmarks/refs/citeu/provinces/, 2026-11-04).
 * Plan from OSM way (Maison des Provinces de France) rotated to its axes.
 * Local frame: x along bearing 108.5, −z toward bearing 198.5 (the court and portico front, confirmed by the photos'
 * park side and sunlit south front), origin the OSM outline's vertex mean.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { archedPane, hex, placed, roof, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { mansard, rectOn } from '../palaces/common.ts'
import { discFront } from '../palaces/showfront.ts'

const BUFF: Rgb = hex('#c8b38b'), RED: Rgb = hex('#ad5238'), STONE: Rgb = hex('#e4dccb'), SLATE: Rgb = hex('#4a4f58')
const GLASS: Rgb = hex('#2c3238'), FRAME: Rgb = hex('#e9e5dc'), GOLD: Rgb = hex('#c9a54a')
const brick = surfaceTag('brick'), ashlar = surfaceTag('ashlar')

type Face = '-z' | '+z' | '-x' | '+x'
type Box = [number, number, number, number]   // x0, x1, z0, z1

// storeys
const PLINTH = 0.9, GROUND = 4.2, FL = 3.0, UPPER = 5, EAVES = GROUND + UPPER * FL, TOP_RED = 2.4
const BAY = 3.1, WIN_W = 1.15, WIN_H = 1.7, PIL = 1.1, CORNICE = 0.4
// the mansard: lower slope, top, inset; dormers along it
const MAN_H1 = 4.6, MAN_H2 = 1.8, MAN_IN = 1.8, DORMER_STEP = 6.2, DORMER_W = 1.6, DORMER_H = 1.9
// plan (OSM, rotated)
const WING_L: Box = [-31.7, -18.6, -21.2, 24.9]
const WING_R: Box = [17.3, 30.3, -21.4, 24.9]
const BAR: Box = [-18.6, 17.3, 11.0, 23.9]
const CENTRE: Box = [-8.3, 7.0, -3.8, 11.0]
const BOXES = [WING_L, WING_R, BAR, CENTRE]
// gables: face, centre along it, plane
const GABLE_W = 4.6, GABLE_H = 7.8, GABLE_DEEP = 5.5, MEDAL_R = 1.0
const GABLES: [Face, number, number][] = [
  ['-z', -25.15, -21.2], ['-z', 23.85, -21.4], ['+z', -25.05, 24.9], ['+z', 23.85, 24.9],
  ['-x', -15.35, -31.7], ['+x', -15.6, 30.3], ['+x', -15.4, -18.6], ['-x', -15.45, 17.3],
  ['+x', 3.5, -18.6], ['-x', 5.8, 17.3],
]
// the portico (stone, two storeys) and the arcades between the centre and the wings
const PORT: Box = [-5.2, 3.9, -7.0, -3.8], PORT_H = 7.4, PORT_POST = 0.45
const ARCADE_Z = -1.2, ARCADE_D = 0.7, ARCADE_H = 4.4, ARCADE_ARCH = 2.8
const ARCADES: [number, number][] = [[-18.6, -8.3], [7.0, 17.3]]

function faces([x0, x1, z0, z1]: Box): [Face, number, number, number][] {
  return [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]]
}
const outward = (f: Face): number => (f === '-z' || f === '-x' ? -1 : 1)
const inside = (x: number, z: number, skip: Box): boolean =>
  BOXES.some(b => b !== skip && x > b[0] && x < b[1] && z > b[2] && z < b[3])
const covered = (f: Face, plane: number, t: number, b: Box): boolean => {
  const o = plane + outward(f) * 0.3
  return f === '-z' || f === '+z' ? inside(t, o, b) : inside(o, t, b)
}
const nearGable = (f: Face, plane: number, t: number): boolean =>
  GABLES.some(([gf, gt, gp]) => gf === f && Math.abs(gp - plane) < 0.5 && Math.abs(gt - t) < GABLE_W / 2 + PIL + 0.4)

/** a range: red ground storey, buff upper storeys, red top storey and cornice, red corner pilasters, windows in bays */
function range(out: MeshBuilder, b: Box, g: number): void {
  const [x0, x1, z0, z1] = b, c = 0.12
  block(out, x0 - c, x1 + c, z0 - c, z1 + c, g, g + PLINTH, STONE, ashlar)
  block(out, x0, x1, z0, z1, g + PLINTH, g + GROUND, RED, brick)
  block(out, x0, x1, z0, z1, g + GROUND, g + EAVES - TOP_RED, BUFF, brick)
  block(out, x0, x1, z0, z1, g + EAVES - TOP_RED, g + EAVES, RED, brick)
  block(out, x0 - c, x1 + c, z0 - c, z1 + c, g + GROUND - 0.3, g + GROUND, STONE, ashlar)          // string course
  block(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, g + EAVES - CORNICE, g + EAVES, STONE, ashlar)  // cornice
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
    if (inside(x + Math.sign((x0 + x1) / 2 - x) * -0.3, z + Math.sign((z0 + z1) / 2 - z) * -0.3, b)) continue
    block(out, x - PIL / 2, x + PIL / 2, z - PIL / 2, z + PIL / 2, g + GROUND, g + EAVES - TOP_RED, RED, brick)
  }
  for (const [f, plane, t0, t1] of faces(b)) {
    const n = Math.max(1, Math.round((t1 - t0 - 2 * PIL) / BAY)), step = (t1 - t0 - 2 * PIL) / n
    for (let i = 0; i < n; i++) {
      const t = t0 + PIL + step * (i + 0.5)
      if (covered(f, plane, t, b) || nearGable(f, plane, t)) continue
      for (let s = 0; s <= UPPER; s++) {
        const y = g + (s === 0 ? PLINTH + 1.0 : GROUND + (s - 1) * FL + 0.7)
        rectOn(out, f, plane, t - WIN_W / 2 - 0.1, t + WIN_W / 2 + 0.1, y - 0.1, y + WIN_H + 0.1, FRAME, 0.04)
        rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + WIN_H, GLASS, 0.07)
      }
    }
    // dormers in the mansard's lower slope
    const nd = Math.floor((t1 - t0 - 3) / DORMER_STEP)
    for (let i = 0; i < nd; i++) {
      const t = t0 + (t1 - t0) * (i + 0.5) / nd, o = outward(f), d = plane - o * (MAN_IN * 0.45)
      if (covered(f, plane, t, b) || nearGable(f, plane, t)) continue
      const yb = g + EAVES + 0.5, along = f === '-z' || f === '+z'
      const [bx0, bx1, bz0, bz1] = along
        ? [t - DORMER_W / 2, t + DORMER_W / 2, Math.min(d, d + o * -1.4), Math.max(d, d + o * -1.4)]
        : [Math.min(d, d + o * -1.4), Math.max(d, d + o * -1.4), t - DORMER_W / 2, t + DORMER_W / 2]
      block(out, bx0, bx1, bz0, bz1, yb, yb + DORMER_H, FRAME)
      rectOn(out, f, d, t - DORMER_W / 2 + 0.25, t + DORMER_W / 2 - 0.25, yb + 0.2, yb + DORMER_H - 0.15, GLASS, 0.03)
      roof(out, bx0 - 0.15, bx1 + 0.15, bz0 - 0.15, bz1 + 0.15, yb + DORMER_H, 0.9,
        along ? DORMER_W / 2 + 0.15 : 0, along ? 0 : DORMER_W / 2 + 0.15, SLATE)
    }
  }
  mansard(out, x0, x1, z0, z1, g + EAVES, MAN_H1, MAN_H2, SLATE, MAN_IN)
}

/** one gable bay built facing −z at the origin (the building at +z): red pilasters, a buff bay rising through the
 *  eaves to a round top edged in stone, a medallion, windows, and a short roof behind it */
function gable(g: number): MeshBuilder {
  const p = new MeshBuilder(), hw = GABLE_W / 2, y0 = g + GROUND, ye = g + EAVES, yt = ye + GABLE_H
  for (const s of [-1, 1]) block(p, s * hw + (s < 0 ? -PIL : 0), s * hw + (s < 0 ? 0 : PIL), -0.25, 0.3, y0, ye, RED, brick)
  block(p, -hw, hw, -0.25, 0.6, ye - 0.2, yt - hw, BUFF, brick)
  // the round top: stepped slabs following a semicircle, a stone coping over each
  const n = 5
  for (let i = 0; i < n; i++) {
    const a = ((i + 1) / n) * (Math.PI / 2), w = Math.cos(a - Math.PI / (2 * n)) * hw
    const ya = yt - hw + Math.sin((i / n) * (Math.PI / 2)) * hw, yb = yt - hw + Math.sin(a) * hw
    block(p, -w, w, -0.25, 0.6, ya, yb, BUFF, brick)
    block(p, -w - 0.15, w + 0.15, -0.35, 0.7, yb - 0.2, yb + 0.05, STONE, ashlar)
  }
  for (const s of [-1, 1]) block(p, s * hw - 0.15, s * hw + 0.15, -0.35, 0.7, ye - 0.2, yt - hw, STONE, ashlar)
  discFront(p, 0, yt - hw + 0.4, -0.3, MEDAL_R + 0.15, STONE)
  discFront(p, 0, yt - hw + 0.4, -0.32, MEDAL_R, GOLD)
  for (let s = 0; s <= UPPER + 1; s++) {
    const y = g + (s === 0 ? PLINTH + 1.0 : GROUND + (s - 1) * FL + 0.7)
    if (y + WIN_H > yt - hw - 0.5) break
    rectOn(p, '-z', -0.25, -WIN_W / 2 - 0.1, WIN_W / 2 + 0.1, y - 0.1, y + WIN_H + 0.1, STONE, 0.04)
    rectOn(p, '-z', -0.25, -WIN_W / 2, WIN_W / 2, y, y + WIN_H, GLASS, 0.07)
  }
  roof(p, -hw - 0.2, hw + 0.2, 0.4, GABLE_DEEP, yt - hw - 0.6, hw, hw + 0.2, 0, SLATE)
  block(p, -hw, hw, 0.4, GABLE_DEEP, ye, yt - hw - 0.6, BUFF, brick)
  return p
}

export function maisonProvincesFrance(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  for (const b of BOXES) range(out, b, g)
  const part = gable(g)
  for (const [f, t, plane] of GABLES) {
    if (f === '-z') placed(out, part, 0, t, plane)
    else if (f === '+z') placed(out, part, Math.PI, t, plane)
    else if (f === '-x') placed(out, part, Math.PI / 2, plane, t)
    else placed(out, part, -Math.PI / 2, plane, t)
  }
  // the portico: stone posts, an entablature, a flat top, the glazed doorway and steps
  const [px0, px1, pz0, pz1] = PORT, yp = g + PORT_H
  for (let i = 0; i < 4; i++) {
    const x = px0 + PORT_POST + (px1 - px0 - 2 * PORT_POST) * i / 3
    block(out, x - PORT_POST, x + PORT_POST, pz0, pz0 + PORT_POST * 2, g + PLINTH, yp - 1.2, STONE, ashlar)
  }
  for (const x of [px0, px1 - 0.5]) block(out, x, x + 0.5, pz0, pz1, g + PLINTH, yp - 1.2, STONE, ashlar)
  block(out, px0 - 0.3, px1 + 0.3, pz0 - 0.3, pz1, yp - 1.2, yp, STONE, ashlar)
  block(out, px0, px1, pz0, pz1, g, g + PLINTH, STONE, ashlar)
  block(out, px0 + 1.5, px1 - 1.5, pz0 - 2.4, pz0, g, g + PLINTH * 0.5, STONE, ashlar)
  rectOn(out, '-z', pz1, (px0 + px1) / 2 - 1.4, (px0 + px1) / 2 + 1.4, g + PLINTH, g + PLINTH + 4.6, GLASS, 0.06)
  // the arcades: red brick, round arches, a stone coping
  for (const [a0, a1] of ARCADES) {
    block(out, a0, a1, ARCADE_Z, ARCADE_Z + ARCADE_D, g, g + ARCADE_H, RED, brick)
    block(out, a0, a1, ARCADE_Z - 0.1, ARCADE_Z + ARCADE_D + 0.1, g + ARCADE_H, g + ARCADE_H + 0.3, STONE, ashlar)
    const n = Math.max(1, Math.round((a1 - a0) / 4.5))
    for (let i = 0; i < n; i++) archedPane(out, ARCADE_Z, a0 + (a1 - a0) * (i + 0.5) / n, g, ARCADE_ARCH, ARCADE_H - 0.6, GLASS)
  }
}
