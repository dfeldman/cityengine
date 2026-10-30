import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, palette, rectOn, slabOn, ALL, type F } from './common.ts'
import { lettersOn } from './showfront.ts'
import { wallOn } from './wall.ts'

/** the design footprint: OSM way 22618451's box turned to the Rue Clément (local −z faces bearing 356) */
const HX = 46.2
const HZ = 37.9

/**
 * Le Marché Saint-Germain (Blondel and Lusson, 1813–18, rebuilt inside in the 1990s), between the Rue Clément and the Rue
 * Lobineau: a low market hall in a neighbourhood of tall houses, and a block of nothing but arches. What a rider sees:
 *
 * - the ARCADE round all four sides, deep round-headed openings between square limestone piers, heavier at the corners;
 * - the second storey STEPPED BACK over the arcade's cornice, its stone piers one to a bay and dark glass between;
 * - the wide-eaved terracotta ROOF, hipped at the corners, and a second slope above a strip of clerestory;
 * - on the Rue Clément, down the Rue de Montfaucon, MARCHE SAINT-GERMAIN cut in the stone over the three middle arches.
 *
 * Heights off two photographs from the street (Commons "P1020096 Paris VI Marché Saint-Germain", "Apple Store @ Marché
 * Saint-Germain"), scaled on a door: cornice 7.6 m, second storey to 11.2, the eaves 11.6, the top of the roof 16.
 */
export function marcheSaintGermain(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d8cdb2', '#8f4b35')
  const tile = p.slate
  const shadow: Rgb = [0.2, 0.2, 0.2]
  const X = 46
  const Z = 37.6
  const COUNTS: Record<F, number> = { '-z': 16, '+z': 16, '-x': 13, '+x': 13 }
  // the hall behind the arches, in shadow
  block(out, -X + 2, X - 2, -Z + 2, Z - 2, 0, 7.4, shadow)
  // ---- the arcade, in ring order so every wall faces out
  const corners = [{ x: -X, z: -Z }, { x: X, z: -Z }, { x: X, z: Z }, { x: -X, z: Z }]
  const faces: F[] = ['-z', '+x', '+z', '-x']
  faces.forEach((f, i) => {
    const w = wallOn(out, corners[i], corners[(i + 1) % 4])
    w.arches(1.2, w.L - 1.2, COUNTS[f], { y0: 0, spring: 3.8, top: 7.1, open: 0.74, front: 0, back: -1.9, stone: p.stone, void: shade(p.glass, 1.15) })
    // the imposts the arches spring from
    for (let k = 0; k <= COUNTS[f]; k++) {
      const u = 1.2 + ((w.L - 2.4) * k) / COUNTS[f]
      w.slab(u - 0.86, u + 0.86, 3.62, 3.86, 0.1, p.trim)
    }
  })
  // the corner piers, heavier and banded
  for (const [x, z] of corners.map((c) => [c.x, c.z])) {
    block(out, x - 1.7, x + 1.7, z - 1.7, z + 1.7, 0, 7.2, shade(p.stone, 1.03))
    for (let y = 0.7; y < 7; y += 0.7) block(out, x - 1.74, x + 1.74, z - 1.74, z + 1.74, y - 0.03, y + 0.03, p.deep)
  }
  // ---- the cornice over the arches, round all four sides
  block(out, -X - 0.35, X + 0.35, -Z - 0.35, Z + 0.35, 7, 7.65, p.trim)
  // ---- the second storey, set back, a stone pier to every bay
  const back = 1.6
  block(out, -X + back, X - back, -Z + back, Z - back, 7.65, 11.2, shade(p.glass, 1.2))
  for (const f of ALL) {
    const along = f === '-z' || f === '+z'
    const t0 = along ? -X + back : -Z + back
    const t1 = along ? X - back : Z - back
    const plane = f === '-z' ? -Z + back : f === '+z' ? Z - back : f === '-x' ? -X + back : X - back
    const n = COUNTS[f]
    for (let i = 0; i <= n; i++) {
      const t = t0 + ((t1 - t0) * i) / n
      slabOn(out, f, plane, t - 0.8, t + 0.8, 7.65, 11.2, 0.5, p.stone)
    }
    // the sill along the glass
    slabOn(out, f, plane, t0, t1, 7.65, 8.3, 0.25, shade(p.stone, 0.97))
  }
  // ---- the name over the three middle arches of the Rue Clément, on a stone panel that rises through the sill
  block(out, -9, 9, -Z + 0.3, -Z + back + 0.6, 7.65, 9.7, p.stone)
  rectOn(out, '-z', -Z + 0.3, -9, 9, 9.45, 9.7, p.trim, 0.05)
  lettersOn(out, '-z', -Z + 0.3, 0, 7.98, 'MARCHE SAINT-GERMAIN', { h: 0.86, c: shade(p.stone, 0.42), wide: 0.62, th: 0.11, gap: 0.2, d: 0.04 })
  // ---- the wide eaves and the roof: the great slope, a strip of clerestory, the upper slope
  const eave = 11.2
  block(out, -X + 0.6, X - 0.6, -Z + 0.6, Z - 0.6, eave, eave + 0.22, shade(p.stone, 0.9))
  roof(out, -X + 0.6, X - 0.6, -Z + 0.6, Z - 0.6, eave + 0.22, 2.9, 4.6, 4.6, tile)
  const u = 5.2
  block(out, -X + u, X - u, -Z + u, Z - u, eave + 3.1, eave + 3.85, shade(p.glass, 1.3))
  for (const [a, b] of [[-X + u, X - u]] as const) {
    for (const z of [-Z + u, Z - u]) for (let x = a; x <= b + 0.01; x += (b - a) / 24) block(out, x - 0.1, x + 0.1, z - 0.06, z + 0.06, eave + 3.1, eave + 3.85, shade(tile, 0.8))
  }
  roof(out, -X + u - 0.3, X - u + 0.3, -Z + u - 0.3, Z - u + 0.3, eave + 3.85, 1.15, 4, 4, shade(tile, 0.94))
}
