import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * LES BANCS ET LA PYRAMIDE NOIRE (Émile Aillaud, 1985; Wikidata Q3230943; the only part built of his "Tête Défense" scheme,
 * which the Grande Arche replaced), on the esplanade by the bus-station exit. Read off Panoramax 360° photos (2017): a low
 * truncated pyramid of black stone climbing in about five wide steps to a flat top where long benches stand. Frame: z along
 * the lawn axis (bearing 27°), y up from the ground (G). Sizes are scaled by eye (the nearest camera was ~25 m away), not surveyed.
 */
export const HX = 9
export const HZ = 7

// tunables (metres)
const STEPS = 5, RISE = 0.27, TREAD = 0.55           // the black steps
const BENCH_L = 6.5, BENCH_W = 0.5, BENCH_H = 0.42    // a top bench, its seat height
const BENCH_ROWS = [-2.2, 1.6]                        // z of each bench on the top
const BLACK: Rgb = hex('#2b2c2e')
const SEAT: Rgb = hex('#4a4540')

function draw(q: MeshBuilder): void {
  for (let i = 0; i < STEPS; i++) {
    const o = i * TREAD
    block(q, -HX + o, HX - o, -HZ + o, HZ - o, G + i * RISE, G + (i + 1) * RISE, shade(BLACK, 1 + i * 0.05))
  }
  const top = G + STEPS * RISE
  for (const z of BENCH_ROWS) {
    block(q, -BENCH_L / 2, BENCH_L / 2, z - BENCH_W / 2, z + BENCH_W / 2, top + BENCH_H - 0.08, top + BENCH_H, SEAT)
    for (const x of [-BENCH_L / 2 + 0.3, BENCH_L / 2 - 0.3]) block(q, x - 0.1, x + 0.1, z - BENCH_W / 2 + 0.05, z + BENCH_W / 2 - 0.05, top, top + BENCH_H - 0.08, BLACK)
  }
}

export function monumentBancsPyramideNoire(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
