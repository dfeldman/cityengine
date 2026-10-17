/**
 * Fisherman's Wharf (SF_PLAN.md §4): what a rider knows it by.
 *
 * - (the crab sign at Jefferson and Taylor: wharf-carnival.ts, 2026-10-16;)
 * - **the Ghirardelli sign**: the tall white letters on their frame over the square's clock-tower block, red lit at
 *   night — a standalone model set on the roof.
 *
 * Local frames: the sign's face toward −z, its foot at the origin.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'
import { beam } from './golden-gate.ts'
import type { Fit } from '../fit.ts'
import { signText } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'




export function ghirardelliSign(out: MeshBuilder, _fit?: Fit): void {
  /*
   * The sign on the roof of Ghirardelli Square, rebuilt from a photograph 2026-09-22.
   *
   * Two things about it that the first version got wrong, and that anyone would guess wrong:
   *
   * 1. The letters are SOLID metal panels — pale grey by day — not bulbs. (It is outlined in bulbs at night,
   *    but the shapes you read are the letters themselves.) The old version drew each letter as two uprights
   *    and a bar, which reads as a fence.
   * 2. Half of what you see is the SCAFFOLD. The letters stand on a deep open lattice of criss-crossed steel
   *    braces, as tall again as the letters and quite transparent against the sky. That lattice is as much the
   *    landmark as the word is; without it the sign looks painted onto the roof.
   *
   * The real sign is in mixed case — a capital G and lowercase after it. The shared glyph font is capitals
   * only, so this spells it in capitals; at the distance you see it from the bay, the silhouette and the
   * lattice carry the recognition.
   */
  const LETTER = 5.0
  const span = 46
  const deck = 9.5
  const STEEL_D: Rgb = [0.42, 0.43, 0.45]
  // the lattice: uprights, top and bottom rails, and the diagonals that make it read as a truss
  const bays = 12
  for (let i = 0; i <= bays; i++) {
    const x = -span / 2 + (i * span) / bays
    box(out, x, deck / 2, 0, 0.1, deck / 2, 0.1, STEEL_D, 0)
    if (i === bays) continue
    const x2 = -span / 2 + ((i + 1) * span) / bays
    // real crossed diagonals: `beam` runs a strut between two points in 3D, which `boxAlong` cannot do — it
    // only turns in plan, so a brace built from it comes out as a ladder of horizontal rungs
    for (const [y0, y1] of [[0.4, deck - 0.4], [deck - 0.4, 0.4]] as const) {
      beam(out, [x, y0, 0], [x2, y1, 0], 0.07, 0.07, STEEL_D, false)
    }
  }
  for (const y of [0.35, deck - 0.35]) box(out, 0, y, 0, span / 2, 0.1, 0.12, STEEL_D, 0)
  // and the letters standing on top of it, solid panels on their own short posts
  for (let i = 0; i <= bays; i += 2) {
    const x = -span / 2 + (i * span) / bays
    box(out, x, deck + LETTER / 2, 0.25, 0.07, LETTER / 2, 0.07, STEEL_D, 0)
  }
  signText(out, 'GHIRARDELLI', 0, deck + LETTER / 2 + 0.4, 0.1, LETTER, [0.78, 0.79, 0.8], { tag: surfaceTag('metal') })
}
