import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * LE MONUMENT AUX MORTS PARISIENS DE LA PREMIERE GUERRE MONDIALE (Wikidata Q95124483; atelier Phileas architecture, Ville de
 * Paris, inaugurated 11 Nov 2018): a low continuous wall of dark blue steel plates, 280 m long and 1.30 m high (Wikidata /
 * fr.wikipedia), standing on the boulevard de Ménilmontant pavement against the outer wall of the Père-Lachaise cemetery,
 * and lettered with the 94,415 names of Parisians killed in the war (by year of death, then alphabetical). Frame: x along
 * the wall (−HX..HX), −z the lettered street face, y up from the ground (G). The plate pitch, the lettering rows and the
 * foot are guessed from photographs, not surveyed; the length and height are the written figures.
 */
export const HX = 140
export const HZ = 0.6

// tunables (metres)
const WALL_H = 1.3, WALL_T = 0.14          // the written height; plate thickness guessed
const PITCH = 2.8, GAP = 0.02              // one plate wide, the joint between plates
const FOOT_H = 0.08, FOOT_OUT = 0.06       // dark plinth rail under the plates
const NAME_ROWS = 6, ROW0 = 0.16, ROW_STEP = 0.17, ROW_H = 0.045   // lettering rows from the foot up
const TITLE_W = 4.2                         // the "Aux Morts de la Grande Guerre" panel at the south end

// ground rise above the model's base (the lowest ground under the footprint, the south end) at distance S metres north of
// the south end, read from the baked terrain at the wall (tools/at-point.ts): the wall climbs ~4 m over its 280 m
const RISE: [number, number][] = [[0, 0], [72, 2.27], [133, 2.84], [192, 2.97], [268, 3.87], [280, 3.9]]
const SKIRT = 0.5                           // plates reach this far below their own ground so the steps leave no gap

const STEEL: Rgb = hex('#23344f')
const LETTERS: Rgb = hex('#9aa6b8')

/** Cheap repeatable pseudo-random 0..1 for lettering dropout. */
const rise = (x: number): number => {
  const s = Math.max(0, Math.min(2 * HX, HX - x))   // local +x runs south
  for (let i = 1; i < RISE.length; i++) if (s <= RISE[i][0]) return RISE[i - 1][1] + (RISE[i][1] - RISE[i - 1][1]) * (s - RISE[i - 1][0]) / (RISE[i][0] - RISE[i - 1][0])
  return RISE[RISE.length - 1][1]
}
const rnd = (i: number): number => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s) }

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const h = WALL_T / 2
  const n = Math.round((2 * HX) / PITCH)
  const w = (2 * HX) / n
  for (let i = 0; i < n; i++) {
    const x0 = -HX + i * w + GAP / 2, x1 = -HX + (i + 1) * w - GAP / 2
    const g = rise((x0 + x1) / 2)
    block(q, x0 - 0.2, x1 + 0.2, -h - FOOT_OUT, h + FOOT_OUT, y(g - SKIRT), y(g + FOOT_H), shade(STEEL, 0.6))
    block(q, x0, x1, -h, h, y(g + FOOT_H), y(g + WALL_H), shade(STEEL, 0.94 + 0.12 * rnd(i * 3.1)))
    block(q, x0 - 0.01, x1 + 0.01, -h - 0.02, h + 0.02, y(g + WALL_H), y(g + WALL_H + 0.03), shade(STEEL, 0.7))
    // names: each row a run or two of lettering, with a margin and a gap
    for (let r = 0; r < NAME_ROWS; r++) {
      const yy = y(g + FOOT_H + ROW0 + r * ROW_STEP)
      const cut = x0 + (x1 - x0) * (0.42 + 0.3 * rnd(i * 17 + r))
      const a = x0 + 0.12, b = x1 - 0.12
      block(q, a, cut - 0.05, -h - 0.012, -h, yy, yy + ROW_H, LETTERS)
      if (rnd(i * 5 + r * 11) > 0.15) block(q, cut + 0.05, b, -h - 0.012, -h, yy, yy + ROW_H, shade(LETTERS, 0.92))
    }
    // coping line along the top edge
  }
  // the dedication panel at the −x end: a brighter band of three big lines
  for (let r = 0; r < 3; r++) {
    const yy = y(rise(-HX + 0.4) + FOOT_H + 0.8 + r * 0.14)
    block(q, -HX + 0.4, -HX + 0.4 + TITLE_W * (1 - 0.2 * r), -h - 0.02, -h - 0.008, yy, yy + 0.07, shade(LETTERS, 1.2))
  }
}

export function monumentMortsParisiensWw1(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
