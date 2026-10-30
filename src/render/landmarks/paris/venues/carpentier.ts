/**
 * The HALLE GEORGES-CARPENTIER on the Boulevard Masséna, the Palais des sports de la Porte d'Ivry of 1960, renovated and
 * renamed in 1988 (Wikipedia fr). OSM: way/76847587, building=stadium, 101 × 77 m with its long sides at bearing 64.
 *
 * From the Commons photographs "Halle Carpentier - Face avant", "Halle Carpentier - Entrée du public" and F8495: a white
 * base with its bands of windows; over it a wall of pale ribbed panels between dark blue steel posts, its top rising to a
 * shallow gable at the middle of the long front, a broad blue post on the axis; a blue roof edge; and, at the ends, red brick
 * entrance blocks with a run of glass under a blue band. The hall's glazed ends are from the interior photographs (TIPIF 2013).
 * The heights (eaves 12 m, ridge 17 m) are estimated from the photographs: no source gives them.
 *
 * Local −z faces the boulevard (`front` 334), x along the long sides.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { signText } from '../../parts.ts'
import { groundMid, quadN } from './bowl.ts'
import { clamp } from './shell.ts'

const BLUE: Rgb = [0.1, 0.2, 0.46]
const BLUE_LT: Rgb = [0.17, 0.3, 0.55]
const PANEL: Rgb = [0.72, 0.76, 0.8]
const PANEL2: Rgb = [0.62, 0.67, 0.72]
const WHITE: Rgb = [0.85, 0.85, 0.83]
const BRICK: Rgb = [0.62, 0.27, 0.2]
const GLASS: Rgb = [0.2, 0.27, 0.32]
const ROOF: Rgb = [0.36, 0.41, 0.5]

export function halleCarpentier(out: MeshBuilder, fit: Fit): void {
  const metal = surfaceTag('metal')
  const glass = surfaceTag('glass')
  const brick = surfaceTag('brick')
  const conc = surfaceTag('concrete')
  const hx = clamp(fit.hx, 20, 60)
  const hz = clamp(fit.hz, 15, 50)
  const g = groundMid(fit)
  const HX = hx - 6                       // the hall itself: the brick blocks stand at its ends
  const base = g + 5.2
  const eaves = g + 12
  const ridge = g + 17
  const top = (x: number): number => eaves + (ridge - eaves) * (1 - Math.abs(x) / HX)

  // ---- the two long sides, one panel to a bay, the top following the gable
  const bays = 14
  for (const s of [-1, 1]) {
    const z = s * hz
    box(out, 0, (g - 0.5 + base) / 2, z - s * 0.5, HX, (base - g + 0.5) / 2, 0.5, WHITE, conc)
    for (let i = 0; i < bays; i++) {
      const x0 = -HX + (2 * HX * i) / bays
      const x1 = -HX + (2 * HX * (i + 1)) / bays
      quadN(out, [[x0, base, z], [x1, base, z], [x1, top(x1), z], [x0, top(x0), z]], [0, 0, s], i % 2 ? PANEL : PANEL2, metal)
      // the base's strip of windows, a pier between each pair
      const xm = (x0 + x1) / 2
      box(out, xm, g + 3.2, z + s * 0.04, (x1 - x0) / 2 - 0.5, 0.85, 0.04, GLASS, glass)
      strut(out, [x0, base, z + s * 0.25], [x0, top(x0) + 0.2, z + s * 0.25], 0.55, 0.5, BLUE, metal)
    }
    strut(out, [HX, base, z + s * 0.25], [HX, top(HX) + 0.2, z + s * 0.25], 0.55, 0.5, BLUE, metal)
    // the blue roof edge up to the gable and down, and the broad post on the axis
    for (const e of [-1, 1]) strut(out, [0, ridge + 0.2, z + s * 0.3], [e * (HX + 0.4), eaves + 0.2, z + s * 0.3], 0.9, 0.8, BLUE, metal)
    box(out, 0, (base + ridge + 0.6) / 2, z + s * 0.4, 1.8, (ridge + 0.6 - base) / 2, 0.4, BLUE_LT, metal)
  }

  // ---- the roof, two planes falling from the ridge to the hall's ends; the ends' high glazing and their posts
  for (const e of [-1, 1]) {
    quadN(out, [[0, ridge, -hz], [e * HX, eaves, -hz], [e * HX, eaves, hz], [0, ridge, hz]], [e * 0.2, 1, 0], ROOF, metal)
    const x = e * HX
    quadN(out, [[x, g - 0.5, -hz], [x, g - 0.5, hz], [x, eaves, hz], [x, eaves, -hz]], [e, 0, 0], WHITE, conc)
    box(out, x + e * 0.06, g + 9.2, 0, 0.05, 2.2, hz - 1, GLASS, glass)
    for (let i = 0; i <= 10; i++) box(out, x + e * 0.14, g + 9.2, -hz + 1 + ((2 * hz - 2) * i) / 10, 0.1, 2.2, 0.1, BLUE, metal)
    strut(out, [x + e * 0.3, eaves + 0.2, -hz], [x + e * 0.3, eaves + 0.2, hz], 0.8, 0.8, BLUE, metal)

    // ---- the brick entrance block: its run of glass, the blue band over it, the door
    const x1 = e * hx
    const zb = hz * 0.72
    box(out, (x + x1) / 2, g + 3.55, 0, Math.abs(x1 - x) / 2, 4.05, zb, BRICK, brick)
    box(out, (x + x1) / 2, g + 7.8, 0, Math.abs(x1 - x) / 2 + 0.3, 0.45, zb + 0.3, BLUE, metal)
    box(out, x1 + e * 0.06, g + 4.4, 0, 0.05, 1.3, zb - 2, GLASS, glass)
    box(out, x1 + e * 0.12, g + 5.9, 0, 0.1, 0.22, zb - 1.6, BLUE, metal)
    box(out, x1 + e * 0.06, g + 1.4, 0, 0.05, 1.5, 5, GLASS, glass)
  }

  // ---- the name over the middle of the front, white on a blue board (F8495), and the entrance under it
  box(out, 0, g + 5.8, -hz - 0.9, 10, 0.75, 0.15, BLUE_LT, metal)
  signText(out, 'HALLE GEORGES CARPENTIER', 0, g + 5.8, -hz - 1.08, 0.8, [0.95, 0.95, 0.93], { heading: Math.PI })
  box(out, 0, g + 1.5, -hz - 0.06, 4, 1.6, 0.05, GLASS, glass)
}
