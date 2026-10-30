import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, fitted, rectOn } from './common.ts'
import { lettersOn } from './showfront.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
/** the design footprint: OSM way 540442288's box along its length (local −z faces bearing 239, the Rue Eugène Freyssinet) */
const HX = 153.8
const HZ = 36
/** the bay along the hall, metres */
const BAY = 8.1
/** the two great shells either side of the middle, each 24 m across */
const SPRING = 7.8
const CROWN = 13.6
/** the side shells, one little vault to a bay, their axes running out across the hall */
const SIDE_SPRING = 6.5
const SIDE_CROWN = 8.2

/**
 * La Halle Freyssinet (Eugène Freyssinet, 1927–29), the freight hall of the Gare d'Austerlitz, Station F since 2017: a
 * 300 m shed of thin concrete shells, its roof the whole of its architecture. What a rider sees, along the Rue Eugène
 * Freyssinet:
 *
 * - the SCALLOPED EAVES: one shallow vault after another down both long sides, each cantilevered out over the walk;
 * - the two great BARREL SHELLS behind them, running the length of the hall, ribbed every bay, their ends two wide arcs
 *   (with a small arc each side of them) filled with glass;
 * - under the eaves the long dark GLASS WALL, set back on its posts.
 *
 * Section read from Commons "Halle Freyssinet, Paris 13e" and "Halle Freyssinet - Station F - Outside": from the end, small
 * arc, great arc, great arc, small arc, across OSM's 72 m. Heights and the bay scaled off those; no survey behind them. The
 * −z side's taper at the south-east end is OSM's.
 */
export function halleFreyssinet(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

/** The −z edge of the plan: straight, then drawn in over the last 52 m (OSM). */
const edge = (x: number): number => (x < 101.5 ? -36 : -36 + ((x - 101.5) / 52.3) * 9.4)

function draw(out: MeshBuilder): void {
  const concrete = hex('#8f8d84')
  const under = shade(concrete, 0.62)
  const glass: Rgb = [0.2, 0.24, 0.27]
  const frame = hex('#2c2f31')
  const X0 = -153.7
  const X1 = 153.7
  const n = Math.round((X1 - X0) / BAY)
  const bay = (X1 - X0) / n
  // ---- the hall's body under the shells, set back from the eaves
  const wz = 30.5
  block(out, X0 + 0.6, X1 - 0.6, -24, wz - 0.3, 0, SIDE_SPRING, shade(glass, 0.7))
  block(out, X0 + 0.6, X1 - 0.6, -24, 24, SIDE_SPRING, SPRING, shade(glass, 0.7))
  // ---- the two great shells and their ribs
  for (const zc of [-12, 12]) barrel(out, X0, X1, zc, 12, SPRING, CROWN - SPRING, concrete, 10, n, frame)
  // the valley between them
  block(out, X0, X1, -0.5, 0.5, SPRING - 0.2, SPRING + 0.35, shade(concrete, 0.8))
  // the high glass ribbon along each shell's outer foot, which is what catches the light from the street
  for (const s of [-1, 1]) block(out, X0 + 0.4, X1 - 0.4, s * 24 - 0.35, s * 24 + 0.35, SIDE_CROWN - 1.2, SPRING + 0.4, glass)
  // ---- the eaves: one little vault to a bay, both sides, each running out from the great shell's foot
  for (let i = 0; i < n; i++) {
    const x0 = X0 + bay * i
    const x1 = x0 + bay
    side(out, x0, x1, -24, edge((x0 + x1) / 2), concrete, under)
    side(out, x0, x1, 24, 36, concrete, under)
  }
  // ---- the glass wall under them: posts every bay, the dark panes, a lit one here and there (a seed, not a survey)
  for (const [z, f] of [[-wz, '-z'], [wz, '+z']] as const) {
    for (let i = 0; i < n; i++) {
      const x = X0 + bay * (i + 0.5)
      const zz = f === '-z' ? Math.max(-wz, edge(x) + 3) : z
      // the body out to this bay's glass, drawn bay by bay on the −z side, which tapers (OSM)
      if (f === '-z' && zz < -24) block(out, x - bay / 2, x + bay / 2, zz + 0.3, -24, 0, SIDE_SPRING, shade(glass, 0.7))
      rectOn(out, f, zz, x - bay / 2, x + bay / 2, 0, SIDE_SPRING, glass, 0.06)
      for (const k of [-1, 0, 1]) rectOn(out, f, zz, x + (k * bay) / 3 - 0.05, x + (k * bay) / 3 + 0.05, 0, SIDE_SPRING, frame, 0.09)
      rectOn(out, f, zz, x - bay / 2, x + bay / 2, 2.9, 3.05, frame, 0.09)
      if ((i * 7) % 11 < 3) rectOn(out, f, zz, x - bay * 0.32, x + bay * 0.32, 0.3, 2.8, hex('#7f7464'), 0.075)
      block(out, x - bay / 2 - 0.22, x - bay / 2 + 0.22, zz - (f === '-z' ? 2.6 : 0), zz + (f === '-z' ? 0 : 2.6), 0, SIDE_SPRING, shade(concrete, 0.86))
    }
  }
  // ---- the ends: the two great arcs and the small one each side, glazed in a frame; the name on the north-west end
  for (const [x, f] of [[X0, '-x'], [X1, '+x']] as const) {
    const z0 = f === '+x' ? edge(X1) + 3 : -wz
    rectOn(out, f, x, z0, wz, 0, SPRING, glass, 0.02)
    for (const zc of [-12, 12]) {
      archFan(out, x, f, zc, 11.6, SPRING, CROWN - SPRING - 0.25, glass)
      for (const k of [-8, -4, 0, 4, 8]) rectOn(out, f, x, zc + k - 0.07, zc + k + 0.07, SPRING, SPRING + (CROWN - SPRING) * Math.sqrt(1 - (k / 12) ** 2) - 0.2, shade(concrete, 0.8), 0.05)
    }
    const mullion = shade(concrete, 0.8)
    for (let z = -28; z <= 28; z += 4) if (z > z0) rectOn(out, f, x, z - 0.06, z + 0.06, 0, SPRING, mullion, 0.04)
    rectOn(out, f, x, z0, wz, 4.2, 4.36, mullion, 0.04)
    rectOn(out, f, x, z0, wz, SPRING - 0.3, SPRING + 0.1, concrete, 0.05)
    archOn(out, f, x, 0, 0, 3.2, 3, shade(glass, 0.5), 0.06)
  }
  lettersOn(out, '-x', X0, 0, 5, 'STATION F', { h: 1.9, c: hex('#ece6d6'), wide: 0.6, th: 0.24, gap: 0.5, d: 0.08 })
}

/** A barrel shell along x, its section a segmental arc over zc ± hw, ribs at every bay. */
function barrel(out: MeshBuilder, x0: number, x1: number, zc: number, hw: number, y0: number, rise: number, c: Rgb, segs: number, bays: number, rib: Rgb): void {
  const P = (t: number): [number, number] => {
    const a = Math.PI * t
    return [zc - Math.cos(a) * hw, y0 + Math.sin(a) * rise]
  }
  for (let k = 0; k < segs; k++) {
    const [za, ya] = P(k / segs)
    const [zb, yb] = P((k + 1) / segs)
    const ny = zb - za
    const nz = -(yb - ya)
    const l = Math.hypot(ny, nz) || 1
    const tone = shade(c, 0.96 + 0.05 * Math.sin((Math.PI * (k + 0.5)) / segs))
    out.quad([[x0, ya, za], [x1, ya, za], [x1, yb, zb], [x0, yb, zb]], [0, ny / l, nz / l], UV, tone, FIXED)
    for (let i = 0; i <= bays; i++) {
      const x = x0 + ((x1 - x0) * i) / bays
      out.quad([[x - 0.14, ya + 0.04, za], [x + 0.14, ya + 0.04, za], [x + 0.14, yb + 0.04, zb], [x - 0.14, yb + 0.04, zb]], [0, ny / l, nz / l], UV, shade(rib, 2.6), FIXED)
    }
  }
}

/** One little vault of the eaves: over x0..x1, running from z0 at the shell's foot out to the edge z1. */
function side(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, c: Rgb, under: Rgb): void {
  const segs = 5
  const hw = (x1 - x0) / 2
  const cx = (x0 + x1) / 2
  const nz = Math.sign(z1 - z0)
  const pt = (t: number): [number, number] => {
    const a = Math.PI * t
    return [cx - Math.cos(a) * hw, SIDE_SPRING + Math.sin(a) * (SIDE_CROWN - SIDE_SPRING)]
  }
  for (let k = 0; k < segs; k++) {
    const [xa, ya] = pt(k / segs)
    const [xb, yb] = pt((k + 1) / segs)
    // the top of the shell, then the same again a little under it in shadow for the soffit
    const l = Math.hypot(ya - yb, xb - xa) || 1
    out.quad([[xa, ya, z0], [xb, yb, z0], [xb, yb, z1], [xa, ya, z1]], [(ya - yb) / l, (xb - xa) / l, 0], UV, c, FIXED)
    out.quad([[xa, ya - 0.22, z0], [xb, yb - 0.22, z0], [xb, yb - 0.22, z1], [xa, ya - 0.22, z1]], [(yb - ya) / l, (xa - xb) / l, 0], UV, under, FIXED)
    // the shell's thin edge, facing the street
    out.quad([[xa, ya - 0.22, z1], [xb, yb - 0.22, z1], [xb, yb, z1], [xa, ya, z1]], [0, 0, nz], UV, shade(c, 1.06), FIXED)
    // the wall of shadow between the edge and the top of the hall: closes the vault at its root
    out.quad([[xa, SIDE_SPRING, z0], [xb, SIDE_SPRING, z0], [xb, yb, z0], [xa, ya, z0]], [0, 0, nz], UV, under, FIXED)
  }
}

/** A filled segmental arc on an end of the hall, as a fan. */
function archFan(out: MeshBuilder, x: number, f: '-x' | '+x', zc: number, hw: number, y0: number, rise: number, c: Rgb): void {
  const n = 10
  const d = f === '-x' ? -0.03 : 0.03
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI
    const a1 = ((i + 1) / n) * Math.PI
    out.quad([[x + d, y0, zc], [x + d, y0 + Math.sin(a0) * rise, zc + Math.cos(a0) * hw], [x + d, y0 + Math.sin(a1) * rise, zc + Math.cos(a1) * hw], [x + d, y0, zc]],
      [f === '-x' ? -1 : 1, 0, 0], UV, c, FIXED)
  }
}
