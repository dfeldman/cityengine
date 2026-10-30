import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts, squareDome, type Pal } from './common.ts'
import { lettersAlong } from './showfront.ts'
import { baysOf, wallOn, type Wall } from './wall.ts'

/** the design footprint: OSM relation 973246's box turned to the Esplanade Pierre-Vidal-Naquet (local −z faces bearing 147) */
const HX = 57.7
const HZ = 31
const EAVES = 25

/** The relation's building ring and the Cour des Grands Moulins inside it, in the model's frame. */
const OUTER = pts([
  -44.6, 10.3, -53.2, -11.1, -57.6, -11, -57.7, -24.8, -51.1, -24.8, -51.1, -29.9, 26.5, -29.7, 26.5, -23.9, 34.8, -23.8, 34.8, -31, 57.7, -30.4, 57.6, -26, 52.2, -26,
  51.7, 29.4, 34.3, 29.3, 34.4, 23.7, 23.9, 23.6, 23.9, 27.4, -26.4, 27.6, -26.5, 31, -29.7, 31,
])
const COUR = pts([-25.5, 10.7, 23.9, 11.2, 23.8, 15, 34.4, 15.1, 34.7, -15.5, 26.4, -15.5, 26.4, -9.1, -25.3, -9.2])

/** the square tower on the west corner */
const TX0 = -57.7
const TX1 = -51.1
const TZ0 = -24.8
const TZ1 = -11

/**
 * Les Grands Moulins de Paris (Georges Wybo, 1921; the mill closed in 1996, the Université Paris Cité's since 2006, converted by
 * Rudy Ricciotti), by the Seine in the 13th. What a rider sees: the pale rendered mill itself, as tall as the new quarter round it.
 *
 * - six storeys of wide gridded mill windows in a strict frame of piers, on every wall;
 * - the deep cornice and the band over it, the mill's name in big letters round the Rue Marguerite-Duras corner;
 * - the square TOWER on its corner, with single windows up it, a set-back top storey and a slate dome with a bull's-eye.
 *
 * Plan is OSM's, with its court. From ONE photograph, a Mapillary view (1098224344799431) from the Rue Marguerite-Duras looking down the
 * west wall to the tower: that wall, the tower and the letters are off it. No photograph of the Esplanade or the Rue Thomas-Mann side was
 * found, and they are drawn as that wall's rhythm; heights are scaled off its storeys, not a survey.
 */
export function grandsMoulins(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#c9c6bc', '#4b5054')
  const frame: Rgb = [0.15, 0.13, 0.12]
  extrude(out, [OUTER, COUR], p, { eaves: EAVES, storeys: [], bay: 5, rise: 2.8, inset: 2.4, dormers: false })
  // ---- every outer wall of any length, its grid; the ring is anticlockwise so each faces out
  for (let i = 0; i < OUTER.length; i++) {
    const a = OUTER[i]
    const b = OUTER[(i + 1) % OUTER.length]
    if (Math.hypot(b.x - a.x, b.z - a.z) < 8) continue
    if (a.x < -51 && b.x < -51) continue           // the tower's own walls
    grid(wallOn(out, a, b), p, frame)
  }
  // the mill's name round the corner, in the band
  lettersAlong(out, OUTER[0], OUTER[1], 11.6, EAVES - 2.05, 'GRANDS MOULINS', { h: 1.5, c: shade(p.stone, 0.62), wide: 0.62, th: 0.19, gap: 0.2, d: 0.5 })
  tower(out, p, frame)
}

function grid(w: Wall, p: Pal, frame: Rgb): void {
  const d = 0.15
  const { mids, step } = baysOf(w.L, 4.9, 0.3)
  const rows = [1, 5, 8.6, 12.2, 15.8, 19.2]
  w.rect(0, w.L, 0, EAVES, shade(p.stone, 0.96), d)
  for (const m of mids) {
    rows.forEach((y, i) => {
      const h = i === 0 ? 3.2 : 2.7
      w.rect(m - step * 0.36, m + step * 0.36, y, y + h, frame, d + 0.03)
      for (const u of [-0.24, -0.12, 0, 0.12, 0.24]) w.rect(m + u * step - 0.03, m + u * step + 0.03, y, y + h, shade(p.stone, 0.72), d + 0.05)
      w.rect(m - step * 0.36, m + step * 0.36, y + h * 0.5 - 0.03, y + h * 0.5 + 0.03, shade(p.stone, 0.72), d + 0.05)
    })
  }
  // the piers, standing out, and the floor bands
  for (let i = 0; i <= mids.length; i++) {
    const u = 0.3 + step * i
    w.slab(u - 0.5, u + 0.5, 0, EAVES - 3.8, d + 0.3, p.stone)
  }
  w.slab(0, w.L, EAVES - 3.8, EAVES - 3.4, d + 0.5, p.trim)
  // the band over the top row, and the cornice
  w.rect(0, w.L, EAVES - 3.4, EAVES - 0.6, p.stone, d + 0.28)
  w.slab(-0.1, w.L + 0.1, EAVES - 0.5, EAVES, d + 0.95, p.trim)
}

function tower(out: MeshBuilder, p: Pal, frame: Rgb): void {
  const top = 32.5
  block(out, TX0, TX1, TZ0, TZ1, 0, top, shade(p.stone, 0.98))
  const cx = (TX0 + TX1) / 2
  const cz = (TZ0 + TZ1) / 2
  // the single windows up each face, and the corner piers
  const facing = (a: { x: number; z: number }, b: { x: number; z: number }): void => {
    const w = wallOn(out, a, b)
    const n = Math.max(1, Math.round(w.L / 6.5))
    for (let k = 0; k < n; k++) {
      const u = ((k + 0.5) * w.L) / n
      for (let y = 2; y < 27; y += 4.2) {
        w.rect(u - 1.05, u + 1.05, y, y + 2.9, frame, 0.05)
        w.rect(u - 0.03, u + 0.03, y, y + 2.9, shade(p.stone, 0.72), 0.07)
      }
    }
    w.slab(-0.05, 0.75, 0, top - 2, 0.2, p.stone)
    w.slab(w.L - 0.75, w.L + 0.05, 0, top - 2, 0.2, p.stone)
    w.slab(-0.3, w.L + 0.3, top - 1, top, 1, p.trim)
    w.slab(-0.1, w.L + 0.1, top - 2.2, top - 1, 0.35, p.stone)
  }
  facing({ x: TX0, z: TZ0 }, { x: TX1, z: TZ0 })
  facing({ x: TX1, z: TZ1 }, { x: TX0, z: TZ1 })
  facing({ x: TX0, z: TZ1 }, { x: TX0, z: TZ0 })
  facing({ x: TX1, z: TZ0 }, { x: TX1, z: TZ1 })
  // ---- the set-back top storey, its round-headed window, and the slate dome with its bull's-eye
  const hw = 3.1
  const hz = 5.6
  block(out, cx - hw, cx + hw, cz - hz, cz + hz, top, top + 3.6, p.stone)
  for (const [a, b] of [[{ x: cx - hw, z: cz - hz }, { x: cx + hw, z: cz - hz }], [{ x: cx + hw, z: cz + hz }, { x: cx - hw, z: cz + hz }]] as const) {
    const w = wallOn(out, a, b)
    w.arch(w.L / 2, top + 0.5, 2, 2.6, frame, 0.05)
  }
  block(out, cx - hw - 0.35, cx + hw + 0.35, cz - hz - 0.35, cz + hz + 0.35, top + 3.6, top + 4.05, p.trim)
  squareDome(out, cx, cz, top + 4.05, hw + 0.2, 4.2, p.slate, 5, hz + 0.2)
  for (const [z, s] of [[cz - hz + 1.5, -1], [cz + hz - 1.5, 1]] as const) {
    block(out, cx - 1, cx + 1, z - 0.9, z + 0.9, top + 4.2, top + 6, p.trim)
    wallOn(out, s < 0 ? { x: cx - 1, z: z - 0.9 } : { x: cx + 1, z: z + 0.9 }, s < 0 ? { x: cx + 1, z: z - 0.9 } : { x: cx - 1, z: z + 0.9 }).disc(1, top + 5.1, 0.55, frame, 0.04)
    roof(out, cx - 1.1, cx + 1.1, z - 1, z + 1, top + 6, 0.5, 1.1, 0, p.slate)
  }
}
