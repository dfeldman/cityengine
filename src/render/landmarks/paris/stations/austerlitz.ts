import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { archedPane, block, hex, pediment, shade } from '../../kit.ts'
import { clockFace } from '../../parts.ts'
import { faceBand, type Face } from '../../tower.ts'
import { archBand, clipBox, engraved, frontOr, range, statue } from './front.ts'
import { mansard } from './gare-de-lyon.ts'
import { trainShed } from './shed.ts'
import { AUSTERLITZ_PARTS, AUSTERLITZ_SHED } from './data.ts'

type P2 = { x: number; z: number }
const toP = (r: [number, number][]): P2[] => r.map(([x, z]) => ({ x, z }))

/**
 * The Gare d'Austerlitz (Renaud, 1862–67), the Paris-Orléans company's terminus by the Seine (references: Wikimedia
 * Commons "1-3 Place Valhubert, 75013 Paris, 26 September 2019", "Grande halle métallique - Gare d'Austerlitz"). The
 * gist:
 *
 * - the GRANDE HALLE: one great iron arch 51 m across and nearly 280 long, its glazed crown between solid bands, the
 *   biggest single span of the Paris termini, standing high over its side ranges;
 * - the head on the Place Valhubert toward the Seine: the Orléans company's stone front with the clock in its
 *   central dormer, CHEMIN DE FER D'ORLÉANS over the arched gateway, and the slate mansard;
 * - the long side ranges either side of the hall — the departures front on the Boulevard de l'Hôpital — and the
 *   lower sheds over the platforms beyond.
 *
 * One model at its own point: OSM's outline (way 62380197) and the platforms, in this entry's frame
 * (stations/data.ts), front −z to the Place Valhubert (bearing 330°).
 */
export function gareDAusterlitz(out: MeshBuilder): void {
  const stone = hex('#ddd2bb')
  const deep = shade(stone, 0.85)
  const pale = shade(stone, 1.04)
  const slate = hex('#4c5562')
  const glass: Rgb = [0.2, 0.24, 0.27]
  const face: Face = { kind: 'punched', wall: stone, glass, floor: 5, pitch: 4.4, solid: 0.55, arched: true, material: 'ashlar' }
  const ring = toP(AUSTERLITZ_PARTS.outline[0].ring)
  const zHead = -118, zHall = 30.8
  const hallA = -26, hallB = 26
  // ---- the head on the place: three storeys, the mansard, the company's clock and gateway in the middle
  const head = clipBox(ring, -200, 200, -200, zHead)
  const frontEdges = head.map((_, i) => i).filter((i) => {
    const a = head[i], b = head[(i + 1) % head.length], L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return (b.x - a.x) / L > 0.9 && a.z < zHead - 8
  })
  mansard(out, head, 17.5, 24, face, slate, 2.8, frontEdges)
  const zAt = frontOr(head, -140)
  const hx0 = Math.min(...head.map((p) => p.x)), hx1 = Math.max(...head.map((p) => p.x))
  range(out, hx0 + 1, -9, zAt, { stone, glass, eaves: 17.5, arcade: 6.5, pitch: 6.4, paired: false, dormers: true })
  range(out, 9, hx1 - 1, zAt, { stone, glass, eaves: 17.5, arcade: 6.5, pitch: 6.4, paired: false, dormers: true })
  {
    const z = zAt(0) - 0.8
    block(out, -9, 9, z, zHead, 0, 18.5, stone)
    archedPane(out, z - 0.05, 0, 0.3, 5.4, 8, [0.22, 0.27, 0.25])
    archBand(out, z - 0.08, 0, 5.6, 2.7, 3.5, pale, 12)
    engraved(out, "CHEMIN DE FER D'ORLÉANS", 0, 10.2, z - 0.1, 0.75, 15)
    for (const f of [-0.33, 0.33]) archedPane(out, z - 0.05, f * 18, 11.5, 1.8, 4, glass)
    block(out, -9.4, 9.4, z - 0.8, zHead, 17.2, 18.5, deep)
    // the clock in its sculpted dormer, a pediment over it
    block(out, -3.4, 3.4, z + 0.4, z + 3, 18.5, 24.2, stone)
    clockFace(out, 0, 21.4, z + 0.38, 0, -1, 1.6)
    pediment(out, -3.8, 3.8, z + 0.3, 24.2, 2.6, 2.8, stone)
    statue(out, -2.6, 18.5, z + 0.1, 2.6, pale, false)
    statue(out, 2.6, 18.5, z + 0.1, 2.6, pale, false)
  }
  // ---- the side ranges, the length of the hall
  // (in two pieces either side of the Métro: Line 5's viaduct crosses the station 13–14 m up at z ≈ −74..−89, through
  // the side ranges and under the hall's arch, as the real one does through its opening)
  for (const [a, b, z0, z1] of [[-200, hallA, zHead, -90], [-200, hallA, -72, zHall], [hallB, 200, zHead, -90], [hallB, 200, -72, zHall]]) {
    const side = clipBox(ring, a, b, z0, z1)
    if (side.length < 3) continue
    faceBand(out, side, 0, 16, { ...face, floor: 5.3 })
    faceBand(out, side, 16, 17.2, { kind: 'blank', wall: deep, material: 'ashlar' })
    capPolygon(out, side, 17.2, hex('#666b6e'), surfaceTag('metal'))
  }
  // ---- the Grande Halle, and the lower sheds over the platforms beyond it
  const tx = clipBox(ring, -200, 200, zHall, 200).map((p) => p.x)
  const ta = Math.min(...tx), tb = Math.max(...tx), tm = (ta + tb) / 2
  trainShed(out, AUSTERLITZ_SHED, {
    spans: [
      { a: hallA, b: hallB, kind: 'arch', eaves: 16, rise: 18, z0: zHead, z1: zHall },
      { a: ta, b: tm, kind: 'gable', eaves: 8.5, rise: 3.5, z0: zHall },
      { a: tm, b: tb, kind: 'gable', eaves: 8.5, rise: 3.5, z0: zHall },
    ],
    roof: hex('#5c6064'),
    glass: [0.52, 0.6, 0.63],
    iron: [0.24, 0.26, 0.27],
    bay: 10,
    glazed: 0.42,
    ends: { head: true, throat: true },
    snap: 0,
  })
}
