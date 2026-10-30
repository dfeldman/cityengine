import type { MeshBuilder } from '../../../buildings.ts'
import { block, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, palette, pts, rectOn, slabOn } from '../palaces/common.ts'
import { bands, rustic } from './civic.ts'

/** the design footprint: OSM relation 969872's box (local −z faces bearing 20, the Quai Malaquais and the Seine) */
const HX = 58
const HZ = 63.45

/** OSM's outline and courts in this frame (osmium, 2026-10-30): the gate court on the quai at x 30…51, the Chapelle's apse ironed off the Rue Bonaparte side */
const OUTER = pts([57.7, -13.7, 11.1, -14.5, 11.0, 8.6, -2.4, 7.9, -2.4, -3.5, -18.0, -3.5, -18.2, 12.2, -3.3, 11.7, -2.9, 22.7, 4.3, 22.4, 5.4, 48.9, -1.9, 54.0, -4.7, 61.4, -47.3, 63.2,
  -47.9, 8.5, -35.8, 8.0, -35.8, 12.9, -28.2, 12.6, -28.2, 4.4, -45.6, 3.8, -44.9, -62.5, 29.9, -63.3, 29.0, -29.9, 51.2, -29.5, 51.5, -63.5, 58.0, -63.5])
const COURTS = [
  pts([-6.6, 44.4, -7.3, 23.3, -32.0, 24.3, -31.3, 45.2]),
  pts([18.8, -37.2, 19.1, -50.2, 2.8, -50.2, 2.4, -37.3]),
]

/**
 * L'École nationale supérieure des Beaux-Arts on the Quai Malaquais: Félix Duban's exhibition building (1858–62), with
 * the Hôtel de Chimay beside it, across the river from the Louvre. It is the one long palazzo front on a quai of tall
 * narrow houses, and everyone who crosses the Pont des Arts sees it end-on:
 *
 * - from the QUAI (local −z): a rusticated ground floor of big round arches and over it tall round-arched windows in
 *   the same bays, a heavy cornice, an attic of small square lights, and its low roof; a slightly proud pavilion each end;
 * - beside it to the west (+x) the gate court, stone piers and iron railing to the quai, the Hôtel de Chimay's plain
 *   front at its back with its mansard;
 * - from the RUE BONAPARTE (−x): the school's long side wall, the plainest of the lot.
 *
 * The plan is OSM's relation 969872. The arches are confirmed in a distant Mapillary frame across the quai (2026-10-30);
 * the bay count and the attic are from memory. The Palais des Études, at the far end of the Rue Bonaparte's court, is its
 * own OSM relation (3856419) and is not this model. Its octagonal apse is ironed off the outline here.
 */
export function beauxArts(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d8d1bf', '#4d5459')
  const E = 18
  extrude(out, [OUTER, ...COURTS], p, { eaves: E, bay: 3.8, win: 1.6, rise: 3.6, inset: 1.4, dormers: true,
    storeys: [{ y: 0, h: 3.2, sill: 1.6 }, { y: 6.8, h: 3.4, sill: 1 }, { y: 13, h: 2, sill: 0.6 }] })
  rustic(out, OUTER, 0.2, 6.4, 0.7, p.deep, 6)
  bands(out, OUTER, [6.4], 0.34, 0.18, p.trim, 6)

  // ---- the quai front, a block proud of the outline, x −45…+30
  const f = -63.4
  const a = -45
  const b = 30
  const pf = f - 0.5
  block(out, a, b, pf, f + 12, 0, E + 0.8, p.stone)
  for (let y = 0.9; y < 7; y += 0.7) rectOn(out, '-z', pf, a, b, y - 0.05, y + 0.04, p.deep, 0.03)
  slabOn(out, '-z', pf, a - 0.2, b + 0.2, 7, 7.6, 0.35, p.trim)
  const n = 15
  const bay = (b - a) / n
  for (let i = 0; i < n; i++) {
    const t = a + (i + 0.5) * bay
    // the great arch below, sunk in its reveal; the tall arched window above in its frame
    rectOn(out, '-z', pf, t - 1.95, t + 1.95, 0.4, 6.8, shade(p.stone, 0.9), 0.02)
    archOn(out, '-z', pf, t, 0.7, 3.2, 5.9, p.glass, 0.06)
    rectOn(out, '-z', pf, t - 1.45, t + 1.45, 8.3, 13.8, p.trim, 0.05)
    archOn(out, '-z', pf, t, 8.5, 2.4, 5.2, p.glass, 0.08)
    rectOn(out, '-z', pf, t - 1.5, t + 1.5, 8.05, 8.3, p.trim, 0.1)
    rectOn(out, '-z', pf, t - 0.8, t + 0.8, 15.2, 16.5, p.glass, 0.08)
  }
  for (let i = 0; i <= n; i++) {
    const t = a + i * bay
    const w = i === 0 || i === n ? 1.0 : 0.42
    slabOn(out, '-z', pf, t - w, t + w, 7.6, E - 2.8, 0.22, p.trim)
    slabOn(out, '-z', pf, t - w - 0.1, t + w + 0.1, E - 3.4, E - 2.8, 0.3, shade(p.trim, 1.03))
  }
  slabOn(out, '-z', pf, a - 0.2, b + 0.2, E - 2.8, E - 2.3, 0.3, p.trim)
  slabOn(out, '-z', pf, a - 0.7, b + 0.7, E - 0.3, E + 0.8, 0.8, p.trim)

  // ---- the gate court on the quai: stone piers and a railing, the arch of the court's entry
  const gz = -63.4
  const iron: [number, number, number] = [0.14, 0.16, 0.16]
  block(out, 30, 31.6, gz - 0.2, gz + 1.4, 0, 5, p.stone)
  block(out, 50, 51.6, gz - 0.2, gz + 1.4, 0, 5, p.stone)
  for (const x of [37.6, 43.6]) block(out, x - 0.7, x + 0.7, gz - 0.1, gz + 1.3, 0, 5.2, p.stone)
  for (const x of [30.8, 37.6, 43.6, 50.8]) block(out, x - 0.9, x + 0.9, gz - 0.25, gz + 1.5, 5, 5.4, p.trim)
  for (let x = 31.8; x < 50; x += 0.42) {
    if (Math.abs(x - 37.6) < 0.8 || Math.abs(x - 43.6) < 0.8) continue
    block(out, x - 0.03, x + 0.03, gz + 0.5, gz + 0.56, 0.9, 3.2, iron)
  }
  block(out, 31.6, 50, gz + 0.3, gz + 0.8, 0, 0.9, p.stone)
  block(out, 31.6, 50, gz + 0.48, gz + 0.58, 3.1, 3.2, iron)
}
