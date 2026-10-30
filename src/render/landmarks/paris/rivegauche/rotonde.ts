import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { cap, centroid, fitted, hex, hipFan, hull, loft, offsetRing, pts, shade, wallOn, wound, type P2, type Rgb, type Wall } from './common.ts'
import { slab } from '../palaces/common.ts'

/** the design footprint: OSM way 42332625's box, x east, z north */
const HX = 17.05
const HZ = 16.4
/** the central drum, OSM part 437606946, and the five pavilions round it, parts 437606947…51 */
const DRUM = pts([8.7, 1.2, 6.7, 6.2, 2.4, 9.1, -3.3, 8.8, -7.1, 5.8, -8.8, 0.0, -7.0, -4.5, -2.4, -7.7, 3.2, -7.4, 5.2, -5.7, 7.2, -4.1])
const PAVILIONS = [
  pts([11.3, 13.7, 11.3, 8.7, 6.7, 6.2, 2.4, 9.1, 2.3, 14.2, 7.0, 16.4]),
  pts([-3.3, 8.8, -7.1, 5.8, -12.0, 7.3, -13.0, 12.4, -8.9, 15.8, -4.1, 13.9]),
  pts([5.6, -11.6, 3.2, -7.4, -2.4, -7.7, -4.6, -12.1, -1.8, -16.4, 3.4, -16.1]),
  pts([-7.0, -4.5, -8.8, 0.0, -13.7, 1.4, -17.1, -2.8, -15.1, -7.8, -10.1, -8.6]),
  pts([17.1, -1.1, 15.7, -6.2, 10.9, -7.6, 7.2, -4.1, 8.7, 1.2, 13.5, 2.4]),
]
/** a pavilion's eaves, and the drum's: the drum's wall rises clear of the pavilions' roofs, and the tile skirt starts there */
const EAVES = 7.6
const DRUM_EAVES = 11.4

/**
 * The Grande Rotonde of the Ménagerie (begun 1804, for the elephants), a rosette: five low pavilions round a tall central drum, the
 * plan OSM's. Owner, 2026-10-30, at 48.844673 2.360015: "this one has no roof" (OSM's parts say pyramidal, and the bake's flat
 * drum had nothing on it). What a rider sees, from the Commons series "Rotonde Menagerie du Jardin des plantes" and
 * "Ménagerie (Zoo) @ Jardin des Plantes":
 *
 * - each face of a pavilion a RED BRICK panel between pale stone piers, a plinth under it, a round-headed window in a ring of
 *   alternating stone and brick voussoirs;
 * - the wide bracketed EAVES and the low TERRACOTTA hip over each pavilion;
 * - the DRUM above them, brick panels in stone frames with a round window in each, its own tile skirt, and on that the low pale
 *   LANTERN with its small windows and a grey lead cap.
 *
 * Heights from the photographs and OSM's levels (2 and 2.5, tile), no survey. The drum's faces between the pavilions take the
 * tall glazed doors. The drum and lantern have as many sides as OSM's part, eleven.
 */
export function grandeRotonde(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

const BRICK: Rgb = hex('#a8503c')
const STONE: Rgb = hex('#d8cba8')
const STONE_DEEP: Rgb = shade(STONE, 0.86)
const TILE: Rgb = hex('#8c5240')
const LEAD: Rgb = hex('#6e7477')
const GLASS: Rgb = hex('#27323a')
const FRAME: Rgb = hex('#3f4a48')

/** A face of the building: plinth, brick panel, stone piers at its ends, frieze under the eaves. */
function face(w: Wall, y0: number, y1: number, plinth: boolean): void {
  const pier = Math.min(0.75, w.L * 0.13)
  if (plinth) w.rect(0, w.L, y0, y0 + 0.75, STONE_DEEP, 0.09)
  w.slab(0, pier, y0, y1, 0.14, STONE)
  w.slab(w.L - pier, w.L, y0, y1, 0.14, STONE)
  w.rect(pier, w.L - pier, y1 - 0.75, y1, STONE, 0.1)
  // the brick: a panel of the wall, a hand's breadth back from the stone
  w.rect(pier, w.L - pier, y0 + (plinth ? 0.75 : 0), y1 - 0.75, BRICK, 0.06)
}

/** The round-headed window in its ring of alternating stone and brick. */
function window(w: Wall, u: number, y0: number, width: number, h: number): void {
  const r = width / 2
  const spring = y0 + h - r
  // the ring: voussoirs by turns, the keystone in stone
  const n = 9
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * (i / n), a1 = Math.PI * ((i + 1) / n)
    const R = r + 0.42
    const c = i % 2 === 0 ? STONE : BRICK
    ringStone(w, u, spring, r, R, a0, a1, c)
  }
  // the jambs in the same turns
  for (let k = 0; k < 3; k++) {
    const ya = y0 + (k * (spring - y0)) / 3, yb = y0 + ((k + 1) * (spring - y0)) / 3
    const c = k % 2 === 0 ? STONE : shade(STONE, 0.92)
    w.rect(u - r - 0.26, u - r, ya, yb, c, 0.1)
    w.rect(u + r, u + r + 0.26, ya, yb, c, 0.1)
  }
  w.arch(u, y0, width, h, GLASS, 0.11)
  // the glazing bars, the sill
  w.rect(u - 0.03, u + 0.03, y0, y0 + h - 0.02, FRAME, 0.13)
  w.rect(u - r, u + r, spring - 0.03, spring + 0.03, FRAME, 0.13)
  w.rect(u - r - 0.3, u + r + 0.3, y0 - 0.14, y0, STONE, 0.14)
}

/** One voussoir: four corners on the wall's plane, flat. */
function ringStone(w: Wall, u: number, spring: number, r: number, R: number, a0: number, a1: number, c: Rgb): void {
  // (a Wall has rectangles and discs; a voussoir is a thin wedge, near enough a rectangle at this size, laid out by its centre)
  const m = (a0 + a1) / 2
  const cu = u + Math.cos(m) * (r + R) / 2
  const cy = spring + Math.sin(m) * (r + R) / 2
  const half = Math.max(0.16, ((a1 - a0) * (r + R)) / 4)
  w.rect(cu - half, cu + half, cy - half, cy + half, c, 0.09)
}

function draw(out: MeshBuilder): void {
  // ---- the drum: its walls first, full height, so the pavilions' roofs meet something
  const drum = wound([DRUM])[0]
  hull(out, [drum], 0, DRUM_EAVES, BRICK, STONE_DEEP)
  const drumM = centroid(drum)
  const touching = (e: { a: P2; b: P2 }): boolean => {
    const mx = (e.a.x + e.b.x) / 2, mz = (e.a.z + e.b.z) / 2
    return PAVILIONS.some((p) => p.some((v, i) => {
      const w = p[(i + 1) % p.length]
      return Math.hypot((v.x + w.x) / 2 - mx, (v.z + w.z) / 2 - mz) < 1
    }))
  }
  for (let i = 0; i < drum.length; i++) {
    const a = drum[i], b = drum[(i + 1) % drum.length]
    const w = wallOn(out, a, b)
    if (w.L < 1.4) continue
    const low = !touching({ a, b })
    // above the pavilions: a brick panel in a stone frame, a round window in it
    face(w, EAVES + 2, DRUM_EAVES, false)
    w.rect(0, w.L, EAVES + 1.8, EAVES + 2.05, STONE, 0.12)
    if (w.L > 3) {
      w.disc(w.L / 2, EAVES + 2 + (DRUM_EAVES - EAVES - 2.75) / 2, 0.72, STONE, 0.1)
      w.disc(w.L / 2, EAVES + 2 + (DRUM_EAVES - EAVES - 2.75) / 2, 0.5, GLASS, 0.12)
    }
    if (low) {
      // a face open to the garden between two pavilions: the tall glazed door under a lunette
      face(w, 0, EAVES + 1.8, true)
      if (w.L > 3.2) {
        w.rect(w.L / 2 - 1.4, w.L / 2 + 1.4, 0, 4.3, STONE, 0.11)
        w.rect(w.L / 2 - 1.1, w.L / 2 + 1.1, 0, 4.1, GLASS, 0.13)
        w.rect(w.L / 2 - 0.04, w.L / 2 + 0.04, 0, 4.1, FRAME, 0.14)
        window(w, w.L / 2, 4.6, Math.min(2.6, w.L * 0.45), 1.5)
      }
    }
  }
  // the cornice, the tile skirt and the lantern on it
  const eave = offsetRing(drum, 0.75)
  slab(out, eave, DRUM_EAVES - 0.32, DRUM_EAVES, STONE, shade(STONE, 0.66))
  const lantern = drum.map((p) => ({ x: drumM.x + (p.x - drumM.x) * 0.5, z: drumM.z + (p.z - drumM.z) * 0.5 }))
  const skirtTop = DRUM_EAVES + 1.9
  loft(out, eave, DRUM_EAVES, lantern, skirtTop, TILE)
  const LANTERN_TOP = skirtTop + 1.7
  hull(out, [lantern], skirtTop, LANTERN_TOP, STONE, STONE)
  for (let i = 0; i < lantern.length; i++) {
    const w = wallOn(out, lantern[i], lantern[(i + 1) % lantern.length])
    if (w.L < 1) continue
    w.rect(w.L * 0.22, w.L * 0.78, skirtTop + 0.4, LANTERN_TOP - 0.4, GLASS, 0.07)
    w.rect(w.L / 2 - 0.03, w.L / 2 + 0.03, skirtTop + 0.4, LANTERN_TOP - 0.4, FRAME, 0.09)
  }
  const capEave = offsetRing(lantern, 0.4)
  slab(out, capEave, LANTERN_TOP - 0.18, LANTERN_TOP, STONE, shade(STONE, 0.66))
  const capTop = lantern.map((p) => ({ x: drumM.x + (p.x - drumM.x) * 0.45, z: drumM.z + (p.z - drumM.z) * 0.45 }))
  loft(out, capEave, LANTERN_TOP, capTop, LANTERN_TOP + 0.7, LEAD)
  cap(out, capTop, LANTERN_TOP + 0.7, shade(LEAD, 1.08))

  // ---- the pavilions: a wall on each face that is not the drum's, then the eaves and the hip
  for (const p of PAVILIONS) {
    const r = wound([p])[0]
    hull(out, [r], 0, EAVES, BRICK, STONE_DEEP)
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length]
      const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2
      // (the face it shares with the drum, whose midpoint lies on the drum's outline)
      const inner = DRUM.some((v, k) => {
        const w = DRUM[(k + 1) % DRUM.length]
        return Math.hypot((v.x + w.x) / 2 - mx, (v.z + w.z) / 2 - mz) < 1
      })
      if (inner) continue
      const w = wallOn(out, a, b)
      face(w, 0, EAVES, true)
      window(w, w.L / 2, 1.5, Math.min(2.2, w.L * 0.42), Math.min(4.1, EAVES - 2.8))
    }
    slab(out, offsetRing(r, 0.85), EAVES - 0.3, EAVES, STONE, shade(STONE, 0.62))
    hipFan(out, r, EAVES, 2.3, TILE, 0.85)
  }
}
