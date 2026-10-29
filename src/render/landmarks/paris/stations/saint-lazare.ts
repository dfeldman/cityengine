import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { archedPane, block, hex, pediment, prism, shade } from '../../kit.ts'
import { clockFace } from '../../parts.ts'
import type { Face } from '../../tower.ts'
import { clipBox, engraved, frontOr, frustum, range } from './front.ts'
import { mansard } from './gare-de-lyon.ts'
import { trainShed } from './shed.ts'
import { LAZARE_PARTS, LAZARE_SHED } from './data.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const toP = (r: [number, number][]): P2[] => r.map(([x, z]) => ({ x, z }))

/**
 * The Gare Saint-Lazare (Lisch, 1885–89), its front on the Rue Saint-Lazare between the Cour de Rome (west) and the
 * Cour du Havre (east) (reference: Wikimedia Commons "Paris, Gare Saint Lazare, 3 June 2019"). The gist:
 *
 * - the long stone front: the ground floor's great round arches, two storeys of arched windows paired over it, the
 *   cornice, and the steep slate mansard with its oculi;
 * - the tall square domes of the two end pavilions, each with its oculus, over the two courts;
 * - the clock in the stone pediment of the dormer over the middle;
 * - behind, the sheds over the fan of tracks Monet painted: a row of gabled iron-and-glass halls.
 *
 * One model at its own point: OSM's outline (way 727994377) and the platforms, in this entry's frame
 * (stations/data.ts), front −z to the Rue Saint-Lazare (bearing 169°).
 */
export function gareSaintLazare(out: MeshBuilder): void {
  const stone = hex('#d8ccb4')
  const deep = shade(stone, 0.85)
  const slate = hex('#4e5560')
  const glass: Rgb = [0.2, 0.24, 0.27]
  const face: Face = { kind: 'punched', wall: stone, glass, floor: 5.2, pitch: 4.4, solid: 0.55, arched: true, material: 'ashlar' }
  const ring = toP(LAZARE_PARTS.outline[0].ring)
  const zBack = -92
  const head = clipBox(ring, -200, 200, -200, zBack)
  const frontEdges = head.map((_, i) => i).filter((i) => {
    const a = head[i], b = head[(i + 1) % head.length], L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return (b.x - a.x) / L > 0.9 && a.z < zBack - 8
  })
  mansard(out, head, 22, 30.5, face, slate, 3.4, frontEdges)
  const zAt = frontOr(head, -120)
  const xs = head.map((p) => p.x)
  const x0 = Math.min(...xs) + 6, x1 = Math.max(...xs) - 6
  const pav = 22
  range(out, x0 + pav, x1 - pav, zAt, { stone, glass, eaves: 22, arcade: 9, dormers: true, pitch: 9.4 })
  engraved(out, 'GARE  SAINT-LAZARE', (x0 + x1) / 2, 9.5, zAt(0) - 0.96, 1.0, 40)
  // ---- the clock: a stone dormer-pediment over the middle of the range
  {
    const z = zAt(0) + 0.6
    block(out, -5, 5, z - 0.6, z + 3, 22, 28.5, stone)
    pediment(out, -5.6, 5.6, z - 0.7, 28.5, 3.4, 3.6, stone)
    clockFace(out, 0, 25.6, z - 0.62, 0, -1, 2.2)
  }
  // ---- the end pavilions over the two courts: a little proud, their tall square domes and oculi
  for (const [a, b] of [[x0, x0 + pav], [x1 - pav, x1]]) {
    const cx = (a + b) / 2
    const z = zAt(cx) - 1
    block(out, a, b, z, zBack, 0, 23.5, stone)
    range(out, a, b, () => z, { stone, glass, eaves: 23.5, arcade: 9, pitch: 11, paired: false })
    block(out, a - 0.5, b + 0.5, z - 1, zBack + 0.5, 22.2, 23.5, deep)
    const hw = (b - a) / 2 - 0.6, hd = Math.min(hw, (zBack - z) / 2 - 0.6)
    const cz = (z + zBack) / 2
    for (let k = 0; k < 4; k++) {
      const t0 = k / 4, t1 = (k + 1) / 4
      const s0 = 1 - 0.5 * t0 ** 1.5, s1 = 1 - 0.5 * t1 ** 1.5
      frustum(out, cx, cz, 23.5 + 13 * t0, 23.5 + 13 * t1, hw * s0, hw * s1, slate, surfaceTag('metal'), hd * s0, hd * s1)
    }
    // the oculus in the dome's front, in its stone frame, and the crest
    block(out, cx - 2.6, cx + 2.6, cz - hd * 0.86 - 0.8, cz - hd * 0.8, 27, 31.6, stone)
    archedPane(out, cz - hd * 0.86 - 0.83, cx, 28, 2.4, 2.6, glass)
    frustum(out, cx, cz, 36.5, 37.2, hw * 0.52, hw * 0.5, deep, FIXED, hd * 0.52, hd * 0.5)
    prism(out, cx, cz, 37.2, 40.5, 0.12, 4, [0.2, 0.2, 0.2], FIXED, 0.04)
  }
  // ---- the sheds: five gabled halls over the tracks, from the concourse to the throat
  const sx = LAZARE_SHED.sheds.flat().map(([x]) => x)
  const sa = Math.min(...sx), sb = Math.max(...sx)
  const w = (sb - sa) / 5
  trainShed(out, LAZARE_SHED, {
    spans: Array.from({ length: 5 }, (_, i) => ({ a: sa + w * i, b: sa + w * (i + 1), kind: 'gable' as const, eaves: i === 2 ? 16 : 14, rise: i === 2 ? 9 : 7, z0: zBack })),
    roof: hex('#555b5f'),
    glass: [0.5, 0.58, 0.62],
    iron: [0.24, 0.27, 0.27],
    bay: 11,
    ends: { head: true, throat: true },
  })
}
