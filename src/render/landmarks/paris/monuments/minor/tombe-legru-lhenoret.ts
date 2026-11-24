import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { sweptTube } from './monument-kit.ts'

/*
 * MONUMENT FUNERAIRE DE LEGRU ET LHENORET (Pere-Lachaise, division 1, beside the south entrance; Wikidata Q3323384,
 * 48.86010, 2.38933; Commons "Division 1 - Legru et Lhenoret 01..06", "Tombe Legru-Lhenoret 01..03"): a wide low
 * two-step plinth of grey stone, two round drums at its ends, a tall pale stele between them (scrolled top, oval
 * medallion, curved lower niche) and a sloped slab in front; a bronze woman sits on each drum, reaching to the stele,
 * joined by a bronze chain. The two women are Modly pieces (legru-femme-gauche / legru-femme-droite, attached in
 * public/landmarks/paris-statues.json); everything here is structural. Frame: -z the front, x across, y up from G.
 * Sizes are estimated by eye from the photographs (stele ~1.0 m wide), not surveyed.
 */
export const HX = 1.65
export const HZ = 0.72

// tunables (metres)
export const PLINTH_HW = 1.65, PLINTH_HD = 0.72, PLINTH_H = 0.26   // lower step
export const PLINTH2_HW = 1.5, PLINTH2_HD = 0.62, PLINTH2_H = 0.12 // upper step
export const DRUM_X = 0.98, DRUM_Z = 0.0, DRUM_R = 0.4, DRUM_H = 0.5 // end drums
export const STELE_HW = 0.5, STELE_HD = 0.17, STELE_H = 1.9        // central stele
export const SLAB_HW = 0.46, SLAB_HD = 0.36, SLAB_H = 0.28         // sloped slab in front
export const CHAIN_R = 0.018                                       // chain link thickness

const STONE: Rgb = hex('#bdb8aa')
const PLINTH: Rgb = hex('#8f8c84')
const BRONZE: Rgb = hex('#4f6a5c')

/** Height at which the figures sit (top of the drums), in the frame's y. */
export const SEAT_Y = G + PLINTH_H + PLINTH2_H + DRUM_H

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -PLINTH_HW, PLINTH_HW, -PLINTH_HD, PLINTH_HD, y(0), y(PLINTH_H), PLINTH)
  block(q, -PLINTH2_HW, PLINTH2_HW, -PLINTH2_HD, PLINTH2_HD, y(PLINTH_H), y(PLINTH_H + PLINTH2_H), shade(PLINTH, 1.06))
  const y1 = PLINTH_H + PLINTH2_H
  for (const s of [-1, 1]) {
    prism(q, s * DRUM_X, DRUM_Z, y(y1), y(y1 + DRUM_H), DRUM_R, 20, shade(STONE, 0.95))
    prism(q, s * DRUM_X, DRUM_Z, y(y1 + DRUM_H), y(y1 + DRUM_H + 0.05), DRUM_R + 0.03, 20, shade(STONE, 1.05))
  }
  // stele: body, curved scrolled head, medallion, lower niche
  const sy = y1
  block(q, -STELE_HW, STELE_HW, -STELE_HD, STELE_HD, y(sy), y(sy + STELE_H * 0.82), STONE)
  block(q, -STELE_HW - 0.06, STELE_HW + 0.06, -STELE_HD - 0.03, STELE_HD + 0.03, y(sy + STELE_H * 0.82), y(sy + STELE_H), shade(STONE, 1.04))
  for (const s of [-1, 1]) {   // volutes
    prism(q, s * (STELE_HW - 0.02), -STELE_HD - 0.04, y(sy + STELE_H * 0.86), y(sy + STELE_H * 0.86 + 0.06), 0.13, 12, shade(STONE, 0.9))
  }
  block(q, -0.17, 0.17, -STELE_HD - 0.045, -STELE_HD, y(sy + STELE_H * 0.5), y(sy + STELE_H * 0.78), shade(STONE, 0.86))  // oval medallion
  block(q, -0.3, 0.3, -STELE_HD - 0.02, -STELE_HD, y(sy + 0.05), y(sy + STELE_H * 0.3), shade(STONE, 0.8))   // lower niche
  // sloped slab in front
  block(q, -SLAB_HW, SLAB_HW, -PLINTH2_HD + 0.04, -PLINTH2_HD + 0.04 + SLAB_HD, y(sy), y(sy + SLAB_H * 0.6), shade(STONE, 0.92))
  block(q, -SLAB_HW + 0.04, SLAB_HW - 0.04, -PLINTH2_HD + 0.1, -PLINTH2_HD + SLAB_HD, y(sy + SLAB_H * 0.6), y(sy + SLAB_H), shade(STONE, 0.98))
  // bronze chain: a sag between the two drums, in front of the slab
  const path: [number, number, number][] = []
  const N = 14, cz = -DRUM_R - 0.05
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = -DRUM_X + 2 * DRUM_X * t
    path.push([x, y(y1 + DRUM_H * 0.55 - 0.22 * Math.sin(Math.PI * t)), cz + 0.05 * Math.sin(Math.PI * t) * -1])
  }
  sweptTube(q, path, { r: CHAIN_R * 1.6, sides: 6, c: BRONZE })
}

export function tombeLegruLhenoret(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
