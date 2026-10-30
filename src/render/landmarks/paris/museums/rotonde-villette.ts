import type { MeshBuilder } from '../../../buildings.ts'
import { MeshBuilder as Mesh } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, classicalColumn, fourSides, pediment, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, fitted, palette, rectOn, slabOn } from '../palaces/common.ts'

const FIXED = 0
/** the design footprint: OSM way 63971487's box turned to its walls (local −z faces bearing 234, the Place de Stalingrad) */
const H = 17.8

/**
 * La Rotonde de la Villette (Claude-Nicolas Ledoux, 1784–88): the grandest of the customs barriers of the Fermiers
 * généraux' wall, and with three others all that is left of them, on the Place de Stalingrad between the Boulevard
 * de la Villette and the head of the Bassin. A drum on a cube, geometry for its own sake, and it stands free so a rider
 * goes round it:
 *
 * - on all four sides the same PORTICO: square piers banded in Ledoux's rustication, an entablature, a plain pediment;
 * - the square block behind, its walls rusticated, the low attic;
 * - above that the DRUM: twenty arches on paired columns right round it, a plain cornice and a low cap.
 *
 * Plan from OSM's way 63971487 (porticos to ±17.8, the block ±14.5, the porticos' width ±8.6). OSM has no height; the 24 m
 * total, the drum's 10.2 m radius and the column count are from memory of it. No photograph was checked.
 */
export function rotondeVillette(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, H, H, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#dccfae', '#50575b')
  const W = 14.5
  const E = 11.6
  const f = new Mesh()
  {
    // ---- one side, on −z: the block's wall, the portico; turned to all four
    for (let y = 1.3; y < E - 1.2; y += 0.7) rectOn(f, '-z', -W, -W, W, y - 0.05, y + 0.04, p.deep, 0.03)
    for (const x of [-11.8, 11.8]) {
      archOn(f, '-z', -W, x, 3.2, 2.6, 3.6, p.glass, 0.06)
      rectOn(f, '-z', -W, x - 1.7, x + 1.7, 3.05, 3.2, p.trim, 0.09)
    }
    const d = -17.8
    // the steps
    for (let i = 0; i < 3; i++) block(f, -9.4 + i * 0.25, 9.4 - i * 0.25, d - 0.7 + i * 0.35, -W, 0, 0.3 * (i + 1), shade(p.stone, 0.88 + (i % 2) * 0.05))
    // six banded square piers, two deep, the shadow of the portico behind them
    const y0 = 0.9
    const y1 = 8.8
    rectOn(f, '-z', -W, -8, 8, y0, y1, shade(p.stone, 0.74), 0.02)
    rectOn(f, '-z', -W, -2.2, 2.2, y0, 6.1, p.dark, 0.05)
    for (const x of [-7.6, -3.8, 0, 3.8, 7.6]) {
      if (x === 0) continue
      for (const z of [d + 0.8, d + 2.7]) {
        // Ledoux's bands: square drums, alternately proud
        for (let k = 0; k < 8; k++) {
          const a = y0 + (k / 8) * (y1 - y0 - 0.3)
          const b = y0 + ((k + 1) / 8) * (y1 - y0 - 0.3)
          const w = k % 2 === 0 ? 0.62 : 0.5
          block(f, x - w, x + w, z - w, z + w, a, b, k % 2 === 0 ? p.stone : shade(p.stone, 0.9))
        }
        block(f, x - 0.72, x + 0.72, z - 0.72, z + 0.72, y1 - 0.3, y1, p.trim)
      }
    }
    block(f, -8.6, 8.6, d, -W, y1, y1 + 1.2, p.trim)
    block(f, -8.9, 8.9, d - 0.3, -W, y1 + 1.2, y1 + 1.55, shade(p.trim, 1.03))
    block(f, -8.6, 8.6, d, -W, y1 - 0.04, y1, shade(p.stone, 0.68))
    pediment(f, -9.1, 9.1, d - 0.32, y1 + 1.55, 2.9, 3.6, p.stone)
    // the portico's slope back into the block
    const yp = y1 + 1.55
    f.quad([[-9.1, yp + 0.08, d - 0.3], [0, yp + 2.98, d - 0.3], [0, yp + 2.98, -W + 0.2], [-9.1, yp + 0.08, -W + 0.2]], [-0.3, 0.95, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
    f.quad([[0, yp + 2.98, d - 0.3], [9.1, yp + 0.08, d - 0.3], [9.1, yp + 0.08, -W + 0.2], [0, yp + 2.98, -W + 0.2]], [0.3, 0.95, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
    slabOn(f, '-z', -W, -W, W, 0, 0.9, 0.18, shade(p.stone, 0.82))
    slabOn(f, '-z', -W, -W - 0.2, W + 0.2, E, E + 0.8, 0.4, p.trim)
  }
  block(out, -W, W, -W, W, 0, E + 2, p.stone)
  fourSides(out, f)
  block(out, -W + 0.3, W - 0.3, -W + 0.3, W - 0.3, E + 0.8, E + 2.4, p.stone)
  // ---- the drum
  const R = 10.2
  const y0 = E + 2.4
  const y1 = y0 + 6.2
  prism(out, 0, 0, y0 - 0.4, y1 + 0.1, R - 1, 24, shade(p.stone, 0.72), FIXED, R - 1)
  prism(out, 0, 0, y0 - 0.1, y0 + 0.25, R + 0.5, 24, p.trim, FIXED, R + 0.5)
  const n = 20
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const sx = Math.sin(a)
    const cz = Math.cos(a)
    const tx = cz
    const tz = -sx
    for (const s of [-1, 1]) {
      const cx = sx * (R - 0.1) + tx * s * 0.42
      const cy = cz * (R - 0.1) + tz * s * 0.42
      classicalColumn(out, cx, cy, y0 + 0.25, y1 - 0.2, 0.2, p.stone, { order: 'tuscan', tier: 'far', tag: FIXED, trim: p.trim })
    }
    // the arch over the bay, a dark lunette behind it, and the piers' short entablature
    const b = a + Math.PI / n
    const mx = Math.sin(b) * (R - 0.85)
    const mz = Math.cos(b) * (R - 0.85)
    const nn: [number, number, number] = [Math.sin(b), 0, Math.cos(b)]
    const tt: [number, number] = [Math.cos(b), -Math.sin(b)]
    const Q = (u: number, y: number): [number, number, number] => [mx + tt[0] * u + nn[0] * 0.02, y, mz + tt[1] * u + nn[2] * 0.02]
    out.quad([Q(-1.0, y0 + 0.2), Q(1.0, y0 + 0.2), Q(1.0, y1 - 1.0), Q(-1.0, y1 - 1.0)], nn, [[0, 0], [1, 0], [1, 1], [0, 1]], p.dark, FIXED)
    for (let k = 0; k < 4; k++) {
      const a0 = (k / 4) * Math.PI
      const a1 = ((k + 1) / 4) * Math.PI
      out.quad([Q(0, y1 - 1.0), Q(Math.cos(a0) * 1.0, y1 - 1.0 + Math.sin(a0) * 0.9), Q(Math.cos(a1) * 1.0, y1 - 1.0 + Math.sin(a1) * 0.9), Q(0, y1 - 1.0)], nn, [[0, 0], [1, 0], [1, 1], [0, 1]], p.dark, FIXED)
    }
  }
  prism(out, 0, 0, y1 - 0.2, y1 + 0.75, R + 0.35, 24, p.trim, FIXED, R + 0.35)
  prism(out, 0, 0, y1 + 0.75, y1 + 1.5, R + 0.1, 24, p.stone, FIXED, R + 0.1, true)
  prism(out, 0, 0, y1 + 1.52, y1 + 3.4, R - 0.1, 24, p.slate, FIXED, R * 0.28)
  prism(out, 0, 0, y1 + 3.4, y1 + 3.75, R * 0.28, 12, p.lead, FIXED, R * 0.26, true)
}
