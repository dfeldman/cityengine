import type { MeshBuilder } from '../../../buildings.ts'
import { type Rgb } from '../../../models.ts'
import { block, hex, lathe, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { FIXED, UV } from './common.ts'
import { circle, G, spout } from './plaza-common.ts'
import { jetRing, roundBasin, steppedBase } from './monument-kit.ts'

/*
 * LA FONTAINE AUX LIONS DE NUBIE (fontaine du Château d'eau, Pierre-Simon Girard, 1811, moved 1860s to the Place de la
 * Fontaine-aux-Lions facing the Grande Halle de la Villette; Wikidata Q3076267, OSM way 81752247, ~26 m across): a wide low
 * round pool of warm yellow stone, two broad round steps the water pours down, four square piers on the diagonals, a reclining
 * pair of cast-iron lions on each (Modly's, attached from paris-statues.json at LION_AT), and a stem carrying two tazzas and a plume
 * in the middle. Radii and heights are by eye from Commons photographs (Fontaine Château Eau Pierre Simon Girard Paris 1-4,
 * Cast iron lion statues and fountain), not measured; the 26 m is the OSM outline. Every number below is a tunable.
 */
const STONE: Rgb = hex('#c9a566')
const PALE: Rgb = hex('#d6b878')
const WATER: Rgb = hex('#6f98a2')
const SPRAY: Rgb = hex('#e3eef0')

const R = 13            // the pool's outer radius
const POOL_H = 0.6      // its wall above the pavement (OSM height=0.6)
const STEP: [number, number][] = [[9.2, 0.9], [7.6, 0.9]]   // radius, height of the two round steps
const PIER_R = 5.9      // piers' distance from the centre (on the diagonals)
const PIER_W = 2.4      // pier width
const PIER_TOP = 3.9    // pier top above the pavement (before G)
const CORE_R = 3.4      // the round core between the piers
const CORE_TOP = 3.1
const LION_SPREAD = 0.62  // each lion's offset along the pier from its centre
const LION_TURN = 38      // how far each is turned off the diagonal

/** The eight lions' plinth tops in the landmark frame: [x, y, z, bearing°] — two on each diagonal pier, side by side and turned LION_TURN° either way off the pier's outward diagonal (bearing: the way each looks, 0 = +z) */
export const LION_AT: [number, number, number, number][] = [0, 1, 2, 3].flatMap((k) => {
  const a = Math.PI / 4 + (k * Math.PI) / 2
  return [-1, 1].map((s) => {
    const x = Math.sin(a) * PIER_R + Math.cos(a) * s * LION_SPREAD
    const z = Math.cos(a) * PIER_R - Math.sin(a) * s * LION_SPREAD
    return [+x.toFixed(2), G + PIER_TOP, +z.toFixed(2), +((a * 180) / Math.PI + s * LION_TURN).toFixed(1)] as [number, number, number, number]
  })
})

function draw(q: MeshBuilder): void {
  roundBasin(q, 0, 0, 0, R, { rim: 0.7, depth: G + POOL_H, lip: 0.12, stone: STONE, water: WATER, sides: 44 })
  // the two broad round steps, the water pouring down them
  const top = steppedBase(q, 0, 0, 0, STEP.map(([r, h], i) => [r, i === 0 ? G + h : h] as [number, number]), PALE, true)
  jetRing(q, 0, 0, 16, STEP[1][0] - 0.2, top + 0.05, STEP[0][0] - 0.3, G + STEP[0][1] + 0.02, { rise: 0.08, r: 0.05, c: SPRAY })
  jetRing(q, 0, 0, 20, STEP[0][0] - 0.2, G + STEP[0][1] + 0.05, R - 1.5, G + POOL_H - 0.05, { rise: 0.1, r: 0.05, c: SPRAY, phase: 0.1 })
  // the round core and the four piers on the diagonals
  lathe(q, 0, 0, [[CORE_R, top], [CORE_R, G + CORE_TOP], [0.01, G + CORE_TOP]], 24, shade(STONE, 0.94))
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2
    const cx = Math.sin(a) * PIER_R
    const cz = Math.cos(a) * PIER_R
    const h = PIER_W / 2
    // a square pier turned to the diagonal, a coping on top
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    const P = (u: number, v: number): [number, number] => [cx + u * ca + v * sa, cz - u * sa + v * ca]
    const sq = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([u, v]) => P(u, v))
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = sq[i]
      const [x1, z1] = sq[(i + 1) % 4]
      const nx = (z1 - z0)
      const nz = -(x1 - x0)
      const l = Math.hypot(nx, nz)
      q.quad([[x0, top, z0], [x1, top, z1], [x1, G + PIER_TOP, z1], [x0, G + PIER_TOP, z0]], [nx / l, 0, nz / l], UV, STONE, FIXED)
    }
    const co = [[-h - 0.15, -h - 0.15], [h + 0.15, -h - 0.15], [h + 0.15, h + 0.15], [-h - 0.15, h + 0.15]].map(([u, v]) => P(u, v))
    const xs = co.map((p) => p[0])
    const zs = co.map((p) => p[1])
    block(q, Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs), G + PIER_TOP - 0.01, G + PIER_TOP + 0.01, PALE)
  }
  // the stem, two tazzas and a plume
  const y0 = G + CORE_TOP
  lathe(q, 0, 0, [[1.2, y0], [0.55, y0 + 0.5], [0.45, y0 + 1.4], [0.8, y0 + 1.7]], 16, PALE)
  const y1 = y0 + 1.7
  lathe(q, 0, 0, [[0.4, y1], [2.3, y1 + 0.05], [2.55, y1 + 0.45], [2.55, y1 + 0.6]], 28, PALE)
  lathe(q, 0, 0, [[2.35, y1 + 0.55], [0.01, y1 + 0.55]], 24, WATER)
  lathe(q, 0, 0, [[0.5, y1 + 0.55], [0.3, y1 + 1.0], [0.4, y1 + 1.4], [0.22, y1 + 1.7]], 12, STONE)
  const y2 = y1 + 1.7
  lathe(q, 0, 0, [[0.3, y2], [1.2, y2 + 0.05], [1.4, y2 + 0.4], [1.4, y2 + 0.5]], 20, PALE)
  lathe(q, 0, 0, [[1.2, y2 + 0.45], [0.01, y2 + 0.45]], 16, WATER)
  jetRing(q, 0, 0, 12, 1.3, y2 + 0.5, 2.4, y1 + 0.62, { rise: 0.15, r: 0.04, c: SPRAY })
  lathe(q, 0, 0, [[0.05, y2 + 0.45], [0.2, y2 + 1.1], [0.14, y2 + 2.1], [0.02, y2 + 2.6]], 8, SPRAY)
  void circle; void spout
}

export function fontaineLionsNubie(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, R, R, draw)
}
