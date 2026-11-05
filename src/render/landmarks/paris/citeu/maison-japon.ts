/**
 * THE MAISON DU JAPON (Pierre Sardou, 1929): a concrete house dressed as a Japanese castle keep. Cream rendered walls
 * ruled by brown timber-look bands at every floor, stacked in setback tiers, each ringed by a flared grey pent roof; a
 * gabled hafu on the front of the middle tier, a steep gabled crown on top, and a gabled entrance porch on brown posts.
 * Refs: Commons (docs/landmarks/refs/citeu/japon/, 2026-11-04). Plan from OSM way/28879170 rotated to its axes.
 * Local frame: x along bearing 151, −z toward bearing 241 (the porch front), origin the OSM outline's vertex mean.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, roof, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const WALL: Rgb = hex('#e6d9b4'), TIMBER: Rgb = hex('#6b5440'), TILE: Rgb = hex('#5f646b'), GLASS: Rgb = hex('#2f363d')
const GABLE_C: Rgb = hex('#efe8d6')
const stucco = surfaceTag('stucco')

type Face = '-z' | '+z' | '-x' | '+x'
type Box = [number, number, number, number]   // x0, x1, z0, z1

// tiers: box, floor count, pent-roof overhang
const FL = 3.1, BAND = 0.35, WIN_W = 1.3, WIN_H = 1.6, BAY = 3.4
const BASE: Box = [-10.4, 13.6, -7.5, 19.5]
const NOTCH: Box = [-10.4, -8.5, -7.5, 6.9]   // the outline's cut-back corner (left empty)
const TIERS: { b: Box; floors: number; over: number; pent: number }[] = [
  { b: BASE, floors: 4, over: 1.6, pent: 1.4 },
  { b: [-6.5, 9.5, -4.5, 15.5], floors: 1, over: 1.4, pent: 1.2 },
  { b: [-3.5, 6.5, -2.0, 11.5], floors: 1, over: 1.2, pent: 1.0 },
]
const CROWN_H = 5.5, CROWN_OVER = 1.2
const HAFU_W = 9, HAFU_H = 3.2                // the gable on the front of the first pent roof
const PORCH: Box = [0.2, 5.3, -11.2, -7.5], PORCH_H = 3.6, PORCH_ROOF = 2.2, POST = 0.35

function faces([x0, x1, z0, z1]: Box): [Face, number, number, number][] {
  return [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]]
}

/** a rendered box of storeys with a timber band at each floor and windows in bays */
function storeys(out: MeshBuilder, b: Box, y0: number, floors: number, skip?: (f: Face, t: number) => boolean): number {
  const [x0, x1, z0, z1] = b, y1 = y0 + floors * FL
  block(out, x0, x1, z0, z1, y0, y1, WALL, stucco)
  for (let s = 0; s <= floors; s++) {
    const y = y0 + s * FL
    block(out, x0 - 0.05, x1 + 0.05, z0 - 0.05, z1 + 0.05, Math.max(y0, y - BAND), Math.max(y0 + BAND, y), TIMBER)
  }
  for (const [f, plane, t0, t1] of faces(b)) {
    const n = Math.max(1, Math.floor((t1 - t0 - 1) / BAY)), step = (t1 - t0) / n
    for (let i = 0; i < n; i++) {
      const t = t0 + step * (i + 0.5)
      if (skip?.(f, t)) continue
      for (let s = 0; s < floors; s++) {
        const y = y0 + s * FL + 0.9
        rectOn(out, f, plane, t - WIN_W / 2 - 0.12, t + WIN_W / 2 + 0.12, y - 0.12, y + WIN_H + 0.12, TIMBER, 0.04)
        rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + WIN_H, GLASS, 0.07)
      }
    }
  }
  return y1
}

/** a gable roof with its ridge along x, a pale gable triangle on each end face */
function gableRoof(out: MeshBuilder, b: Box, y: number, h: number, over: number, alongX: boolean): void {
  const [x0, x1, z0, z1] = b
  if (alongX) roof(out, x0 - over, x1 + over, z0 - over, z1 + over, y, h, 0, (z1 - z0) / 2 + over, TILE)
  else roof(out, x0 - over, x1 + over, z0 - over, z1 + over, y, h, (x1 - x0) / 2 + over, 0, TILE)
}

export function maisonJapon(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  let y = g
  for (let i = 0; i < TIERS.length; i++) {
    const { b, floors, over, pent } = TIERS[i]
    const top = i === 0
      ? storeys(out, [NOTCH[1], b[1], b[2], b[3]], y, floors, (f, t) => f === '-z' && t > PORCH[0] - 1 && t < PORCH[1] + 1)
      : storeys(out, b, y, floors)
    if (i === 0) storeys(out, [b[0], NOTCH[1], NOTCH[3], b[3]], y, floors)
    // the flared pent roof ringing the tier, its top tucked under the next tier
    const [x0, x1, z0, z1] = b, n = TIERS[i + 1]?.b
    const ix = n ? Math.min(n[0] - x0, x1 - n[1]) + over : (x1 - x0) / 2 + over
    const iz = n ? Math.min(n[2] - z0, z1 - n[3]) + over : (z1 - z0) / 2 + over
    if (n) roof(out, x0 - over, x1 + over, z0 - over, z1 + over, top - 0.1, pent, Math.max(0.5, ix * 0.5), Math.max(0.5, iz * 0.5), TILE)
    y = top + (n ? pent * 0.6 : 0)
  }
  // the crown: a steep gable with its end to the front, a pale gable face with windows
  const c = TIERS[TIERS.length - 1].b
  gableRoof(out, c, y, CROWN_H, CROWN_OVER, false)
  const cx = (c[0] + c[1]) / 2, hw = (c[1] - c[0]) / 2
  for (const z of [c[2], c[3]]) {
    const s = z === c[2] ? -1 : 1
    const p = (dx: number, dy: number): [number, number, number] => [cx + dx, y + dy, z + s * 0.05]
    const tri = [p(-hw, 0), p(0, CROWN_H * hw / (hw + CROWN_OVER)), p(hw, 0)]
    out.quad([tri[0], tri[2], tri[1], tri[1]], [0, 0, s], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], GABLE_C, 0)
    rectOn(out, s < 0 ? '-z' : '+z', z, cx - 2.2, cx + 2.2, y + 0.6, y + 1.9, GLASS, 0.1)
  }
  // the hafu: a gable on the front of the first pent roof, centred on the second tier's front
  const t1 = TIERS[1].b, top0 = g + TIERS[0].floors * FL
  const hx = (t1[0] + t1[1]) / 2, hz = BASE[2] - TIERS[0].over * 0.3
  block(out, hx - HAFU_W / 2 + 0.6, hx + HAFU_W / 2 - 0.6, hz, t1[2], top0, top0 + 1.4, GABLE_C, stucco)
  roof(out, hx - HAFU_W / 2, hx + HAFU_W / 2, hz - 0.6, t1[2], top0 + 0.4, HAFU_H, HAFU_W / 2, 0, TILE)
  // the entrance porch: brown posts, a timber lintel and a gabled roof facing front
  const [px0, px1, pz0, pz1] = PORCH, yg = g + PORCH_H
  for (const x of [px0 + POST, px1 - POST]) block(out, x - POST, x + POST, pz0, pz0 + POST * 2, g, yg, TIMBER)
  block(out, px0, px1, pz0, pz1, yg - 0.5, yg, TIMBER)
  block(out, px0 - 0.6, px1 + 0.6, pz0 - 1.4, pz0, g, g + 0.45, WALL)   // the front steps
  roof(out, px0 - 0.7, px1 + 0.7, pz0 - 0.8, pz1, yg, PORCH_ROOF, (px1 - px0) / 2 + 0.7, 0, TILE)
  rectOn(out, '-z', BASE[2], px0 + 1, px1 - 1, g, g + 2.6, GLASS, 0.08)
}
