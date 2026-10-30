import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygonWithHoles } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { edgeAt } from '../../parts.ts'
import { block, roof, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, pts } from '../palaces/common.ts'
import { ribbons, wound } from './modern.ts'

const FIXED = 0
/** the design footprint: OSM way 79804222's box (local −z faces bearing 172, the Avenue Reille) */
const HX = 152.4
const HZ = 82.6

/** OSM's outline in this frame, its smaller jogs ironed flat (osmium, 2026-10-30) */
const WALL = pts([-143.5, 54.5, -146.9, 24.3, -145, -25.1, -144.5, -39.7, -152.4, -43.5, -151.7, -71, -143.4, -74.8, -130.7, -82.6, 136.4, -77.9, 140, -51.4, 148, -50.5, 145.7, -25.8, 142.8, -26, 140.7, -5,
  145.5, -4.6, 146.9, -20.4, 152.4, -19.6, 150.3, 0, 140.1, -0.2, 139.6, 4.6, 149.7, 5.7, 149.1, 11.7, 140.4, 10.7, 138.4, 29.6, 133.1, 34.6, 146.6, 36, 143.6, 62.9, 138, 68.6, 115.3, 73.9, 108, 76.2, 80.9, 75.6, 61.2, 72.6, 56.9, 68,
  44.1, 71, -81.3, 68.1, -77.4, 77.5, -99.4, 82.6, -98.9, 77.2, -103.6, 63.5, -112.4, 63.2, -138.5, 67.2])
/** the bank's crest: a plain line inside the wall, because a bank does not follow a wall's jogs */
const CREST = pts([-128, 44, -132, -60, -118, -66, 124, -62, 128, 54, 104, 60, -126, 54])
/** the three keepers' pavilions on the wall, as OSM has them (ways 339801804–806, building=service): their middle and half-size */
const PAVILIONS: [number, number, number, number][] = [[-34.5, -75.7, 4.7, 2.9], [21.4, -73.9, 4.6, 3], [-144.2, -56.6, 3, 7.6]]

const GRASS: Rgb = [0.33, 0.47, 0.2]
const BANK: Rgb = [0.29, 0.43, 0.18]
const MEULIERE: Rgb = [0.56, 0.48, 0.38]
const BRICK: Rgb = [0.56, 0.28, 0.21]

/**
 * Le Réservoir de Montsouris (Eugène Belgrand, 1868–74), Paris's drinking water, 300 m by 165 m of it under grass in the
 * south of the 14e. It is not a building to a rider: it is a hill with a wall round it.
 *
 * - from the AVENUE REILLE (local −z), the Rue de la Tombe-Issoire and the rest: a retaining wall of rough millstone, red
 *   brick along its top, an iron railing, and over it a steep bank of mown grass going up out of sight;
 * - at the wall, here and there, the keepers' pavilions, the one thing that stands up: a stone storey with cut-stone
 *   corners, an iron balcony round it, and on that a light glazed lantern under a shallow slate roof;
 * - from up in a high building, the meadow on top.
 *
 * The wall is OSM's way 79804222, the three pavilions its building=service ways inside the outline. The wall, bank and
 * pavilions are from the Commons photograph "Réservoirs de Montsouris - avenue Reille", the meadow from "Champ au dessus du
 * Réservoir de Montsouris". OSM has no heights: the 3.8 m wall and the 10 m crest are read off the first. That those three
 * ways are those pavilions is my inference from their places along the avenue; the third, on the west side, I did not see.
 */
export function reservoirMontsouris(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const H = 3.8
  const C = 10
  const r = wound([WALL])[0]
  // the wall, its millstone courses, the brick along the top and the rail on it
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    out.quad([[e.a.x, 0, e.a.z], [e.b.x, 0, e.b.z], [e.b.x, H, e.b.z], [e.a.x, H, e.a.z]], [e.nx, 0, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], MEULIERE, FIXED)
  }
  ribbons(out, [WALL], [[0.9, 0.98], [1.8, 1.88], [2.7, 2.78]], shade(MEULIERE, 0.78), 0.03, 0, 3)
  ribbons(out, [WALL], [[0, 0.4]], shade(MEULIERE, 0.72), 0.05, 0, 3)
  ribbons(out, [WALL], [[H - 0.4, H]], BRICK, 0.08, 0, 2)
  ribbons(out, [WALL], [[H + 0.95, H + 1.02]], [0.13, 0.14, 0.15], -0.2, 0, 3)

  // the bank: the wall's head to a shelf, the shelf to the crest, the meadow capped on it
  capPolygonWithHoles(out, wound([r, CREST]), H, BANK, FIXED)
  // (the slope, as a skirt from a line just inside the wall to the crest: faced by hand from the simplified wall)
  const crest = wound([CREST])[0]
  const k = crest.length
  const outerLine = wound([pts([-140, 50, -143, -70, -128, -77, 134, -74, 138, 64, 112, 69, -135, 62])])[0]
  for (let i = 0; i < k; i++) {
    const a = outerLine[i]
    const b = outerLine[(i + 1) % k]
    const c = crest[(i + 1) % k]
    const d = crest[i]
    const e = edgeAt(outerLine, i)
    out.quad([[a.x, H - 0.05, a.z], [b.x, H - 0.05, b.z], [c.x, C, c.z], [d.x, C, d.z]], [e.nx * 0.6, 0.8, e.nz * 0.6], [[0, 0], [1, 0], [1, 1], [0, 1]], BANK, FIXED)
  }
  capPolygonWithHoles(out, [crest], C, GRASS, FIXED)

  for (const [x, z, hx, hz] of PAVILIONS) pavilion(out, x, z, hx, hz)
}

/** One keeper's pavilion: millstone base, a stone storey with cut quoins, an iron balcony, a glazed lantern, a low slate roof. */
function pavilion(out: MeshBuilder, x: number, z: number, hx: number, hz: number): void {
  const stone: Rgb = [0.72, 0.65, 0.52]
  const cut: Rgb = [0.84, 0.8, 0.7]
  const glass: Rgb = [0.3, 0.37, 0.42]
  const iron: Rgb = [0.12, 0.13, 0.14]
  const y0 = 4
  const y1 = 9.6
  const y2 = 13
  block(out, x - hx, x + hx, z - hz, z + hz, 0, y0, MEULIERE)
  block(out, x - hx, x + hx, z - hz, z + hz, y0, y1, stone)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(out, x + sx * hx - 0.3, x + sx * hx + 0.3, z + sz * hz - 0.3, z + sz * hz + 0.3, y0, y1, cut)
  block(out, x - hx - 0.3, x + hx + 0.3, z - hz - 0.3, z + hz + 0.3, y0 - 0.35, y0, cut)
  block(out, x - hx - 0.35, x + hx + 0.35, z - hz - 0.35, z + hz + 0.35, y1 - 0.4, y1, cut)
  // its windows, and the base's single door in the wall
  for (const s of [-1, 1]) {
    for (const t of [-hx * 0.5, hx * 0.5]) block(out, x + t - 0.7, x + t + 0.7, z + s * hz - 0.04, z + s * hz + 0.04, 5.2, 8.4, glass)
    for (const t of [-hz * 0.5, hz * 0.5]) block(out, x + s * hx - 0.04, x + s * hx + 0.04, z + t - 0.7, z + t + 0.7, 5.2, 8.4, glass)
  }
  // the balcony's rail, the lantern a little in from it, its posts, its low roof and finial
  for (const s of [-1, 1]) {
    block(out, x - hx - 0.25, x + hx + 0.25, z + s * (hz + 0.25) - 0.03, z + s * (hz + 0.25) + 0.03, y1, y1 + 1, iron)
    block(out, x + s * (hx + 0.25) - 0.03, x + s * (hx + 0.25) + 0.03, z - hz - 0.25, z + hz + 0.25, y1, y1 + 1, iron)
  }
  const lx = hx - 0.9
  const lz = hz - 0.9
  block(out, x - lx, x + lx, z - lz, z + lz, y1, y2, glass)
  for (const t of [-1, -0.5, 0, 0.5, 1]) {
    for (const s of [-1, 1]) {
      block(out, x + t * lx - 0.09, x + t * lx + 0.09, z + s * lz - 0.1, z + s * lz + 0.1, y1, y2, cut)
      block(out, x + s * lx - 0.1, x + s * lx + 0.1, z + t * lz - 0.09, z + t * lz + 0.09, y1, y2, cut)
    }
  }
  block(out, x - lx - 0.8, x + lx + 0.8, z - lz - 0.8, z + lz + 0.8, y2, y2 + 0.4, cut)
  roof(out, x - lx - 0.8, x + lx + 0.8, z - lz - 0.8, z + lz + 0.8, y2 + 0.4, 1.1, Math.min(lx, lz) + 0.8, Math.min(lx, lz) + 0.8, [0.33, 0.35, 0.37])
  prism(out, x, z, y2 + 1.4, y2 + 2.1, 0.1, 6, cut, FIXED, 0.03)
}
