import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { archedPane, block, hex, pane, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * THE REGARD DES MAUSSINS (boulevard Sérurier / avenue de la Porte-des-Lilas, Paris 19e, beside the Porte des Lilas metro;
 * Wikidata Q3423359, monument historique classé 1899, PA00086776): a medieval stone inspection house of the Eaux du Pré-
 * Saint-Gervais, moved here in 1963 from 350 m further north. A low rectangular ashlar box with a plinth and a moulded
 * eave band; a stepped stone pavilion roof of overlapping slabs (hipped, with a small flat top and a rounded gablet over the
 * door); a narrow plank door with a grille in a projecting ashlar surround. Frame: −z the front (it faces SSE, onto the
 * garden / footway), x across, y up, ground at G. Footprint from OSM way 63224543 (building, claimed): 6.9 m by 5.6 m
 * including the roof overhang. Heights scaled off Commons "Regard Maussins - Paris XIX (FR75) - 2021-06-02 - 2.jpg" against
 * the door (~1.85 m): wall ~2.4 m, roof top ~5.0 m. Estimates, not surveyed. No sculpture.
 */
export const HX = 3.45
export const HZ = 2.8

// tunables
const OVER = 0.25            // roof overhang past the walls
const WALL_H = 2.4
const PLINTH_H = 0.3
const PLINTH_OUT = 0.05
const BAND_H = 0.22          // moulded eave band under the roof
const BAND_OUT = 0.1
const COURSES = 9            // roof slab courses
const COURSE_H = 0.28
const TOP_HX = 1.4           // half-length of the flat top
const TOP_HZ = 0.35          // half-depth of the flat top
const SLAB_LIP = 0.05        // each course overhangs the one above by a little extra
const BLOCK_H = 0.42         // wall ashlar course height
const DOOR_W = 0.85
const DOOR_H = 1.85
const SURROUND = 0.28        // ashlar jamb width
const SURR_OUT = 0.1
const GABLET_W = 1.7
const GABLET_H = 0.6

const STONE: Rgb = hex('#c9bc98')
const PALE: Rgb = hex('#d3c8a8')
const DARKER: Rgb = hex('#a69a78')
const ROOFSTONE: Rgb = hex('#9a9272')
const MOSS: Rgb = hex('#85865f')
const WOOD: Rgb = hex('#5a3a28')
const IRON: Rgb = hex('#2f2f2d')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const bx = HX - OVER
  const bz = HZ - OVER
  // plinth and walls
  block(q, -bx - PLINTH_OUT, bx + PLINTH_OUT, -bz - PLINTH_OUT, bz + PLINTH_OUT, y(0), y(PLINTH_H), DARKER)
  block(q, -bx, bx, -bz, bz, y(PLINTH_H), y(WALL_H), STONE)
  // ashlar course lines
  for (let h = PLINTH_H + BLOCK_H; h < WALL_H - 0.1; h += BLOCK_H) {
    block(q, -bx - 0.015, bx + 0.015, -bz - 0.015, bz + 0.015, y(h), y(h) + 0.03, shade(STONE, 0.88))
  }
  // eave band
  block(q, -bx - BAND_OUT, bx + BAND_OUT, -bz - BAND_OUT, bz + BAND_OUT, y(WALL_H), y(WALL_H + BAND_H), shade(PALE, 1.03))
  // door surround, plank door, grille
  const dz = -bz
  block(q, -DOOR_W / 2 - SURROUND, DOOR_W / 2 + SURROUND, dz - SURR_OUT, dz, y(PLINTH_H), y(PLINTH_H + DOOR_H + 0.2), PALE)
  pane(q, '-z', dz - SURR_OUT - 0.005, 0, y(PLINTH_H), DOOR_W, DOOR_H, WOOD, 0)
  block(q, -0.1, 0.1, dz - SURR_OUT - 0.03, dz - SURR_OUT, y(PLINTH_H + DOOR_H * 0.75), y(PLINTH_H + DOOR_H * 0.75) + 0.1, IRON)
  // stepped roof: overlapping slab courses, lowest the widest
  const r0x = HX, r0z = HZ
  for (let i = 0; i < COURSES; i++) {
    const f = i / (COURSES - 1)
    const hx = r0x + SLAB_LIP - (r0x - TOP_HX) * f
    const hz = r0z + SLAB_LIP - (r0z - TOP_HZ) * f
    const y0 = y(WALL_H + BAND_H + i * COURSE_H)
    block(q, -hx, hx, -hz, hz, y0, y0 + COURSE_H, i % 2 ? ROOFSTONE : shade(ROOFSTONE, 1.06))
    if (i === 3) block(q, -hx, hx, -hz, hz, y0 + COURSE_H - 0.03, y0 + COURSE_H, MOSS)
  }
  // the rounded gablet over the door: a low arched mass on the lowest roof courses
  const gz = -r0z - SLAB_LIP
  archedPane(q, gz - 0.01, 0, y(WALL_H + BAND_H), GABLET_W, GABLET_H, shade(ROOFSTONE, 1.1))
}

export function regardMaussins(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
