import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { shade } from '../../kit.ts'
import { boxAlong, edgeAt } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts } from './common.ts'

const FIXED = 0
/** the design footprint: OSM way 79657345's box turned to the rotunda's axis (local −z faces bearing 34.4, the place) */
const HX = 42.2
const HZ = 56.8

type P2 = { x: number; z: number }

/**
 * The street faces of way 79657345 in this frame (osmium, 2026-10-29), simplified: from the back on the Rue de Magdebourg
 * round the Avenue d'Iéna side, the ROTUNDA on the Place d'Iéna, and up the Avenue du Président-Wilson to the court's
 * passage. Then the court's own faces back to the start (`COURT`) — OSM draws the whole as one outline, the court
 * opening to the street through the passage at its north corner.
 */
const STREET = pts([42.2, 40.7, 32.3, 46.0, 17.1, 52.0, 7.9, 54.3, 0.3, 55.6, -6.5, 56.3, -16.8, 56.8, -16.8, 55.9, -29.1, 55.9, -29.0, 50.7,
  -42.1, 50.1, -42.1, -16.7, -41.6, -29.7, -42.0, -34.6, -42.1, -39.1, -41.2, -43.2, -39.7, -46.6, -37.2, -50.0, -34.0, -52.9, -30.4, -55.1,
  -26.8, -56.3, -22.6, -56.8, -18.4, -56.5, -14.7, -55.5, -10.9, -53.4, -8.1, -51.1, -6.2, -48.9, -4.2, -45.9, -2.1, -39.9, 0.3, -37.6, 2.8, -32.1,
  4.9, -31.0, 9.3, -25.6, 7.6, -24.5, 34.5, 15.7, 41.2, 25.6])
const COURT = pts([30.5, 32.7, 25.5, 25.3, 20.5, 28.6, -2.4, -5.8, 1.0, -8.2, 0.7, -11.7, -4.3, -8.7, -5.7, -9.4, -7.3, -7.9, -9.9, -6.2, -12.8, -5.1,
  -14.4, -4.7, -17.5, -4.5, -21.9, -4.9, -21.9, 37.3, -16.3, 37.2, -16.3, 39.7, -6.4, 38.5, 2.5, 36.7, 10.0, 34.6, 16.2, 31.9, 21.4, 35.5,
  29.8, 38.2, 31.9, 38.8, 38.9, 40.3])

/**
 * The Palais d'Iéna (Auguste Perret, 1937–46; the back wing 1960s), now the Conseil économique, social et
 * environnemental: Perret's manifesto in reinforced concrete, on its triangle of streets above the Trocadéro gardens.
 * What a rider sees from the Place d'Iéna and the two avenues:
 *
 * - the ROTUNDA on the place: the half-round end of the building wrapped in a COLONNADE of Perret's tall columns —
 *   fluted, swelling toward the top, no capitals — under a deep flat cornice;
 * - the same COLONNADE marching down both avenues, the tall glazing between the columns, the attic over the cornice;
 * - the concrete's warm bush-hammered grey-beige; flat roofs.
 *
 * The plan is OSM's (`STREET` + `COURT`) extruded; the colonnade stands along every street face, columns every 4.4 m.
 */
export function iena(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

const area = (r: P2[]): number => {
  let a = 0
  for (let i = 0; i < r.length; i++) { const p = r[i]; const q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
  return a / 2
}

function draw(out: MeshBuilder): void {
  const p = palette('#cfc5b0', '#77746c')
  const concrete = p.stone
  const ring = [...STREET, ...COURT]
  extrude(out, [ring], { ...p, slate: shade(concrete, 0.82) }, { eaves: 20.4, bay: 4.4, win: 2.2, rise: 0.4, inset: 0.4, dormers: false,
    storeys: [{ y: 0, h: 6.4, sill: 0.8 }, { y: 8.6, h: 6.6, sill: 0.4 }, { y: 17.8, h: 1.4, sill: 0.3 }] })
  // ---- the colonnade along every street face: the ring's outward side, columns at even steps along the run
  const s = area(ring) > 0 ? 1 : -1
  const run: P2[] = STREET
  const total = run.slice(1).reduce((a, q, i) => a + Math.hypot(q.x - run[i].x, q.z - run[i].z), 0)
  const n = Math.round(total / 4.4)
  const step = total / n
  let i = 0
  let done = 0
  const col = (q: P2, nx: number, nz: number): void => {
    const x = q.x + nx * 1.5
    const z = q.z + nz * 1.5
    prism(out, x, z, 0.6, 16.6, 0.42, 12, shade(concrete, 1.04), FIXED, 0.58)
    prism(out, x, z, 0, 0.6, 0.6, 12, shade(concrete, 0.95), FIXED)
  }
  for (let k = 0; k <= n; k++) {
    const want = k * step
    while (i < run.length - 2 && done + Math.hypot(run[i + 1].x - run[i].x, run[i + 1].z - run[i].z) < want) {
      done += Math.hypot(run[i + 1].x - run[i].x, run[i + 1].z - run[i].z)
      i++
    }
    const e = edgeAt(run, i)
    const u = Math.min(e.L, want - done)
    col({ x: e.a.x + e.tx * u, z: e.a.z + e.tz * u }, e.nx * s, e.nz * s)
  }
  // the deep cornice over the columns, edge by edge, the plinth they stand on
  for (let k = 0; k < run.length - 1; k++) {
    const e = edgeAt(run, k)
    const h = s > 0 ? e.heading : e.heading + Math.PI
    boxAlong(out, e.mid.x + e.nx * s * 1.3, 17.05, e.mid.z + e.nz * s * 1.3, e.L / 2 + 0.6, 0.45, 1.45, h, shade(concrete, 1.06))
    boxAlong(out, e.mid.x + e.nx * s * 1.3, 0.15, e.mid.z + e.nz * s * 1.3, e.L / 2 + 0.6, 0.15, 1.5, h, shade(concrete, 0.9))
  }
}
