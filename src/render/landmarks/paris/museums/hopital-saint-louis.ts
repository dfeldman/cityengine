import type { MeshBuilder } from '../../../buildings.ts'
import { block, hex, placed, roof, shade, type Rgb } from '../../kit.ts'
import { MeshBuilder as Mesh } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { archOn, dormers, fitted, palette, rectOn, slabOn, type Pal } from '../palaces/common.ts'
import { stack } from './civic.ts'

/** the design footprint: OSM relation 10714749's outer box, the walls square to the frame (local −z faces bearing 221.7, the Rue Bichat side) */
const HX = 60.35
const HZ = 64.4

/**
 * L'Hôpital Saint-Louis (Claude Vellefaux for Henri IV, 1607–12): a square quadrangle of brick and stone under steep
 * slate, the same hand and the same year as the Place des Vosges, and built for the plague, a hundred and twenty metres on
 * a side with no door to the world but one. It stands inside its hospital grounds behind the Rue Bichat:
 *
 * - from anywhere: the long two-storey ranges of red brick, their windows framed in stone chains, under slate roofs half
 *   again as tall as the walls with stone dormers in them;
 * - at each corner and the middle of each side a PAVILION, a step proud and a storey taller, with its own very steep
 *   hipped roof and tall brick chimneys: the signature, a skyline of eight sharp slate caps;
 * - at the middle of the −z side the arched gate; inside, the court's own walls with their buttress-like bays.
 *
 * From OSM's relation 10714749 (121 × 129 m over its corner pavilions, the ranges 9 m deep)
 * and from memory of the buildings: no close photograph was checked for the brick's colour or the dormer count.
 */
export function hopitalSaintLouis(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#dcd2bd', '#454b51')
  const brick = hex('#a65c45')
  const E = 10
  // ---- the four ranges, each drawn on its own axis and placed: OSM's walls at z −54.5 and +62.4, x ±58.3, the court x ±48.9, z −45.3…+53.3
  const range = (hx: number, angle: number, tx: number, tz: number): void => {
    const q = new Mesh()
    rangeSide(q, p, brick, -hx, hx, -4.6, 4.6, E)
    placed(out, q, angle, tx, tz)
  }
  range(49, 0, 0, -49.9)
  range(49, Math.PI, 0, 57.85)
  range(49.2, Math.PI / 2, -53.6, 4)
  range(49.2, -Math.PI / 2, 53.6, 4)
  // ---- the eight pavilions: the corners stand a step out of their ranges, the −x −z one out to the corner of the outline
  for (const [a, b] of [[-60.2, -48.8], [48.8, 60.2]] as const) {
    pavilion(out, p, brick, a, b, a < 0 ? -64.4 : -56.4, -45.2, 13.5, 10)
    pavilion(out, p, brick, a, b, 53.3, 64.4, 13.5, 10)
  }
  pavilion(out, p, brick, -4.8, 4.8, -56.3, -40.5, 13.5, 10)
  pavilion(out, p, brick, -4.8, 4.8, 51.3, 64.3, 13.5, 10)
  pavilion(out, p, brick, -60.2, -47, -0.5, 8.7, 13.5, 10)
  pavilion(out, p, brick, 47, 60.2, -0.5, 8.7, 13.5, 10)
  // ---- the gate through the middle of the −z pavilion, to the Rue Bichat
  rectOn(out, '-z', -56.3, -2.7, 2.7, 0.2, 7.2, p.stone, 0.1)
  archOn(out, '-z', -56.3, 0, 0, 3.8, 6.2, p.dark, 0.14)
  archOn(out, '+z', -40.5, 0, 0, 3.8, 6.2, p.dark, 0.1)
}

/** The range on −z: brick walls, stone-framed windows, the stone string course and steep slate. */
function rangeSide(out: MeshBuilder, p: Pal, brick: Rgb, x0: number, x1: number, zo: number, zq: number, E: number): void {
  block(out, x0, x1, zo, zq, 0, E, brick)
  block(out, x0, x1, zo - 0.08, zq + 0.08, 0, 0.8, shade(p.stone, 0.86))         // the plinth
  block(out, x0, x1, zo - 0.2, zq + 0.2, E - 0.55, E, p.trim)                     // the cornice
  block(out, x0, x1, zo - 0.08, zq + 0.08, 4.7, 5.0, p.trim)                      // the floor band
  const bay = 4.7
  const n = Math.round((x1 - x0) / bay)
  const step = (x1 - x0) / n
  for (const [f, z] of [['-z', zo], ['+z', zq]] as const) {
    for (let i = 0; i < n; i++) {
      const t = x0 + (i + 0.5) * step
      if (Math.abs(t) < 6.5) continue
      for (const [y0, y1] of [[1.5, 4.1], [5.6, 8.8]] as const) {
        // the window in its stone frame, its chain of stone running up the wall
        rectOn(out, f, z, t - 1.15, t + 1.15, y0 - 0.2, y1 + 0.3, p.stone, 0.05)
        rectOn(out, f, z, t - 0.85, t + 0.85, y0, y1, p.glass, 0.09)
        rectOn(out, f, z, t - 0.05, t + 0.05, y0, y1, p.stone, 0.11)
      }
      rectOn(out, f, z, t - 1.3, t + 1.3, 5.6 - 0.32, 5.6 - 0.2, p.trim, 0.09)
    }
  }
  // the steep slate, its ridge along the range
  const rise = 8.5
  const d = (zq - zo) / 2
  roof(out, x0 - 0.3, x1 + 0.3, zo - 0.3, zq + 0.3, E, rise, 0.01, d + 0.29, p.slate)
  for (const [f, pl] of [['-z', zo], ['+z', zq]] as const) {
    dormers(out, f, pl, x0 + 1, -6, E + 0.3, 9.4, p, { w: 1.3, h: 2.4, set: 0.15 })
    dormers(out, f, pl, 6, x1 - 1, E + 0.3, 9.4, p, { w: 1.3, h: 2.4, set: 0.15 })
  }
  const m = (zo + zq) / 2
  for (const x of [-32, -14, 14, 32]) stack(out, x, m, E + rise - 2, E + rise + 1.4, 0.55, 1.1, brick, shade(p.dark, 1.5))
}

/** A pavilion: a block in brick with stone chains at its corners, a very steep hipped roof, chimneys. */
function pavilion(out: MeshBuilder, p: Pal, brick: Rgb, x0: number, x1: number, z0: number, z1: number, E: number, rise: number): void {
  block(out, x0, x1, z0, z1, 0, E, brick)
  block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, 0, 0.8, shade(p.stone, 0.86))
  block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, 4.7, 5.0, p.trim)
  block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, 9.2, 9.5, p.trim)
  block(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, E - 0.55, E, p.trim)
  // the corner chains of stone, long and short
  for (const x of [x0, x1]) {
    for (const z of [z0, z1]) {
      for (let y = 0.9; y < E - 0.8; y += 1.3) block(out, x - 0.75, x + 0.75, z - 0.75, z + 0.75, y, y + 0.65, p.stone)
    }
  }
  // two windows a storey on each wall, the middle axis left to the gate
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const hw = (x1 - x0) * 0.26
  for (const [f, pl, ct] of [['-z', z0, cx], ['+z', z1, cx], ['-x', x0, cz], ['+x', x1, cz]] as const) {
    for (const s of [-1, 1]) {
      for (const [y0, y1] of [[1.5, 4.1], [5.6, 8.6], [10, 12.4]] as const) {
        rectOn(out, f, pl, ct + s * hw - 1.05, ct + s * hw + 1.05, y0 - 0.18, y1 + 0.25, p.stone, 0.05)
        rectOn(out, f, pl, ct + s * hw - 0.75, ct + s * hw + 0.75, y0, y1, p.glass, 0.09)
      }
    }
    slabOn(out, f, pl, ct - 2.6, ct + 2.6, E - 0.55, E, 0.02, p.trim)
  }
  // the roof, far taller than wide looks right here: a truncated hip and its lead crest
  const w = Math.min(x1 - x0, z1 - z0)
  roof(out, x0 - 0.35, x1 + 0.35, z0 - 0.35, z1 + 0.35, E, rise, (x1 - x0) / 2 - w * 0.09 + 0.35, (z1 - z0) / 2 - w * 0.09 + 0.35, p.slate)
  block(out, cx - w * 0.09 - 0.04, cx + w * 0.09 + 0.04, cz - w * 0.09 - 0.04, cz + w * 0.09 + 0.04, E + rise, E + rise + 0.3, p.lead)
  block(out, cx - 0.06, cx + 0.06, cz - 0.06, cz + 0.06, E + rise + 0.3, E + rise + 1.5, p.lead)
  for (const s of [-1, 1]) stack(out, cx + s * (x1 - x0) * 0.22, cz, E + 3, E + rise - 0.9, 0.55, 1.2, brick, shade(p.dark, 1.5))
}
