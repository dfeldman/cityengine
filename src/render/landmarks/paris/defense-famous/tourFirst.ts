/**
 * TOUR FIRST (Pierre Dufau's 1974 Tour UAP, rebuilt 2007–11 by Kohn Pedersen Fox with SRA): 231 m, France's tallest office
 * tower. A Y plan — three wings round a central core — each wing a different height, each topped by a glass screen that
 * slopes up toward the core, the core's crown and mast over all. Pale silvery glass, white mullions in a tight vertical
 * rhythm, a tall glass atrium at the foot.
 *
 * Plan and heights from OSM (osmium on the local pbf, 2026-11-15): way/82466977 outline, parts 226254482 (east wing,
 * 190 m incl. a 25 m screen), 226254483 (south wing, 170 m), 226254484 (north-west wing, 231 m), core crown 226254481 /
 * 227324159 / 227353363 (mast to 259 m), blades 227324158 / 227324160 / 227353364 / 227353365. Rings below are metres
 * EAST/NORTH of 48.8888 N, 2.2516 E, registered onto the fit by museums/enframe.ts. Look from the Commons inauguration
 * photograph (Tour First - La Defense - Inauguration 6 mai 2011.jpg). Lidar not measured (OSM part heights used).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { faceBand, type Face } from '../../tower.ts'
import { registerRing, tools, type P2 } from '../museums/enframe.ts'

// ---- tunables ----
const GLASS: Rgb = hex('#a9bfcb') // pale silvery glass, sky in it
const MULLION: Rgb = hex('#e4e9ec') // white aluminium
const SCREEN: Rgb = hex('#cfdde4') // the crown screens, lighter (sky through)
const ATRIUM_GLASS: Rgb = hex('#a9bcc6')
const ROOF: Rgb = hex('#c4c9cb')
const ATRIUM_H = 16 // the glass hall at the foot
const SCREEN_H = 25 // OSM roof:height: each wing's sloped crown screen
const PITCH = 1.35 // mullion spacing
const FLOOR = 4.2
const FACE: Face = { kind: 'curtain', wall: MULLION, glass: GLASS, floor: FLOOR, pitch: PITCH, solid: 0.1, depth: 0.12, material: 'metal' }

// (x east, z SOUTH as read off osmium) → east/north
const en = (a: number[]): P2[] => Array.from({ length: a.length / 2 }, (_, i) => [a[2 * i], -a[2 * i + 1]] as P2)

const OUTLINE = en([30.2, -21.0, -11.8, -41.3, -25.6, -30.0, -30.6, -25.4, -33.6, -17.6, -34.5, -14.4, -32.1, -6.9, -29.2, -1.7, -26.3, 2.4, -24.1, 11.1, -22.0, 18.3, -19.3, 24.5, -13.6, 30.6, -5.7, 34.3, 1.6, 37.8, 10.1, 41.8, 13.4, 34.9, 28.5, 3.3, 29.1, -0.7, 40.5, -1.6, 41.8, -3.4, 41.6, -11.1, 40.5, -19.5, 39.0, -20.8])
const CORE: P2 = [7, -1.5]
interface Wing { ring: P2[]; top: number }
const WINGS: Wing[] = [
  // north-west, the tallest
  { top: 231, ring: en([-25.5, -20.0, -2.7, 13.5, 1.4, 18.3, 2.8, 17.6, 11.2, -0.3, 9.2, -3.0, -0.8, -17.8, -9.5, -30.6, -11.1, -30.9, -18.4, -26.6, -25.0, -21.4]) },
  // east
  { top: 190, ring: en([-0.8, -17.8, 9.2, -3.0, 11.2, -0.3, 10.9, 0.8, 40.5, -1.6, 41.6, -3.0, 41.6, -11.1, 41.0, -16.0, 40.3, -20.0, 39.0, -20.8, 14.1, -18.9]) },
  // south
  { top: 170, ring: en([-2.7, 13.5, 1.4, 18.3, 2.8, 17.6, 10.9, 0.8, 25.3, -0.4, 8.0, 35.6, 6.5, 36.4, 5.6, 36.2, -1.4, 33.3, -8.7, 29.2, -9.4, 27.5]) },
]
// thin glass blades standing proud of the wing ends and the core (lo, hi)
const BLADES: [P2[], number, number][] = [
  [en([0.3, 17.8, -25.2, -19.5, -25.5, -20.0, -2.7, 13.5]), 180, 234],
  [en([0.3, 17.8, 2.7, 17.6, 11.1, 0.1, 9.4, -2.9, 9.8, -2.6, 11.2, 0.1, 2.8, 17.9]), 225, 244],
  [en([14.1, -18.9, 39.0, -20.8, 40.5, -19.5, 41.8, -3.4, 40.5, -1.6, 25.3, -0.4, 25.3, -0.7, 41.4, -3.0, 40.3, -19.6, 14.1, -18.7]), 165, 183],
  [en([24.4, 1.4, 8.0, 35.6, 6.5, 36.4, -1.4, 33.3, -9.4, 27.5, -3.0, 14.1, -2.8, 14.2, -9.2, 27.6, -1.3, 33.0, 6.5, 36.1, 7.9, 35.4, 24.1, 1.3]), 145, 173],
]
const CROWN = en([7.5, -2.1, 5.1, 3.3, 5.0, 4.7, 6.0, 6.2, 7.5, 6.2, 8.8, 5.1, 10.9, 0.8, 11.2, -0.3, 9.8, -2.7])

export function tourFirst(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(OUTLINE, fit)
  const T = tools(out, F)
  const y0 = F.y0
  /** an east/north ring → local, anticlockwise for faceBand (outward normals) */
  const local = (r: P2[]): { x: number; z: number }[] => {
    const l = r.map(([e, n]) => F.xz(e, n))
    let A = 0
    for (let i = 0; i < l.length; i++) { const p = l[i], q = l[(i + 1) % l.length]; A += p.x * q.z - q.x * p.z }
    return A > 0 ? l : l.reverse()
  }

  // the atrium base: the whole outline in glass, a tall hall, a pale lid
  faceBand(out, local(OUTLINE), y0, y0 + ATRIUM_H, { kind: 'fins', wall: MULLION, glass: ATRIUM_GLASS, floor: ATRIUM_H / 2, pitch: 2.4, solid: 0.1, depth: 0.25, continuous: true, material: 'metal' })
  T.cap(OUTLINE, ATRIUM_H, ROOF)

  for (const w of WINGS) {
    const body = w.top - SCREEN_H
    faceBand(out, local(w.ring), y0 + ATRIUM_H, y0 + body, FACE)
    // the crown screen, sloping up from the wing tip to the core
    let far = 0
    for (const [e, n] of w.ring) far = Math.max(far, Math.hypot(e - CORE[0], n - CORE[1]))
    const hi = (e: number, n: number): number => body + SCREEN_H * (1 - 0.85 * Math.min(1, Math.hypot(e - CORE[0], n - CORE[1]) / far))
    T.prism(w.ring, body, hi, SCREEN, null)
    // its upper rim's white edge and a darker plant floor at the body's top
    T.cap(w.ring, body + 0.5, ROOF)
    faceBand(out, local(w.ring), y0 + body - 1.2, y0 + body, { kind: 'blank', wall: MULLION, material: 'metal' })
  }
  for (const [r, lo, hi] of BLADES) T.prism(r, lo, hi, GLASS, ROOF)
  // the core crown and the mast
  T.prism(CROWN, 206, 240, SCREEN, ROOF)
  T.prism(CROWN.map(([e, n]) => [CORE[0] + (e - CORE[0]) * 0.55, CORE[1] + (n - CORE[1]) * 0.55] as P2), 240, 250, MULLION, ROOF)
  T.beam([CORE[0], CORE[1], 250], [CORE[0], CORE[1], 259], 0.35, MULLION)
}
