/**
 * TOUR MAJUNGA (Jean-Paul Viguier, 2014; 194 m incl. mast, roof ~192 m by lidar). Three slices side by side,
 * each with its own sloping crown, splitting apart as they rise; the long faces folded down the middle, and
 * up that fold a zigzag of cantilevered two-storey loggias "exploding" out of the glass. Pale silvery-blue
 * glass, white horizontal bands at every floor.
 *
 * Heights: IGN LiDAR HD MNS (tools/ign-mns.ts, 2026-11-16), 2 m grid over the roof, PCA'd onto the tower's
 * axes (long axis 30° south of east, 56 × 34 m at the top): north slice 180 → 176 m falling ESE, middle
 * 185 → 192 m rising ESE, south slice 177 → 186 m rising ESE. Outline: OSM way/158760559 (no parts; its
 * SE half is podium/dalle, ≤12 m in the lidar). Look: fr.wikipedia photos "Tour Majunga Février 2020.jpeg"
 * (long face, loggia zigzag) and "Tour Majunga Octobre 2022.jpeg" (end view, slices). Frame: metres
 * EAST/NORTH of 48.8888 N, 2.2436 E, registered by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { faceBand, type Face } from '../../tower.ts'
import { registerRing, tools, type P2 } from '../museums/enframe.ts'

// ---- tunables ----
const GLASS: Rgb = hex('#c3d5df') // pale silvery-blue, sky in it
const BAND: Rgb = hex('#fbfcfc') // white floor bands
const LOBBY_GLASS: Rgb = hex('#8fa4af')
const SEAM: Rgb = hex('#5d6d76') // the recess between slices
const LOGGIA: Rgb = hex('#3b4950') // the shadowed open terraces
const SLAB: Rgb = hex('#f2f4f4')
const ROOF: Rgb = hex('#c9cecf')
const FLOOR = 3.9
const LOBBY_H = 10
const SEGMENTS = 6 // stacked stages, each stepping the outer slices outward
const LEAN = 1.6 // how far the outer slices have moved out by the top
const SEAM_GAP = 0.6 // half-width of the seam between slices
const CREST = 9 // the sloping crown's depth below the slice's lowest top
const FOLD = 1.2 // the long faces bulge out at their middle fold
const LOGGIA_EVERY = 3 // floors
const LOGGIA_W = 9, LOGGIA_FLOORS = 2, LOGGIA_OUT = 2.0
const FACE: Face = { kind: 'bands', wall: BAND, glass: GLASS, floor: FLOOR, solid: 0.3, material: 'metal' }

// tower axes from the lidar roof (E/N metres)
const C: P2 = [-3.0, 10.5]
const TH = (-29.9 * Math.PI) / 180, UX = Math.cos(TH), UZ = Math.sin(TH)
const uw = (u: number, w: number): P2 => [C[0] + u * UX - w * UZ, C[1] + u * UZ + w * UX]

const OUTLINE: P2[] = [[27.4, -31.4], [28.1, -29.8], [41.8, -0.3], [27.7, 9.5], [25.9, 10.7], [-13.5, 38.0], [-16.5, 31.8], [-18.8, 33.4], [-27.2, 21.0], [-28.0, 19.8], [-27.4, 19.4], [-31.2, 11.4], [12.6, -20.6]]

/** a slice: its plan in (u, w), its side (+1 north, -1 south, 0 middle), crown heights at u0 and u1 */
interface Slice { w0: number; w1: number; u0: number; u1: number; side: number; hA: number; hB: number }
const SLICES: Slice[] = [
  { w0: 12.5, w1: 17.5, u0: -16, u1: 22, side: 1, hA: 180, hB: 176 },
  { w0: -7, w1: 12.5, u0: -30, u1: 28, side: 0, hA: 185, hB: 192 },
  { w0: -17.5, w1: -7, u0: -26, u1: 27, side: -1, hA: 177, hB: 186 },
]

export function majunga(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(OUTLINE, fit)
  const T = tools(out, F)
  const y0 = F.y0
  const local = (r: P2[]): { x: number; z: number }[] => {
    const l = r.map(([e, n]) => F.xz(e, n))
    let A = 0
    for (let i = 0; i < l.length; i++) { const p = l[i], q = l[(i + 1) % l.length]; A += p.x * q.z - q.x * p.z }
    return A > 0 ? l : l.reverse()
  }
  /** a slice's plan at stage k: outer slices pushed out, long faces folded out at u=0 */
  const plan = (s: Slice, k: number, inset = 0): P2[] => {
    const shift = s.side * LEAN * (k / (SEGMENTS - 1))
    const a = s.w0 + SEAM_GAP + shift + inset, b = s.w1 - SEAM_GAP + shift - inset
    const fa = s.side < 0 ? FOLD : 0, fb = s.side > 0 ? FOLD : 0
    const u0 = s.u0 + inset, u1 = s.u1 - inset
    return [uw(u0, a), uw(0, a - fa), uw(u1, a), uw(u1, b), uw(0, b + fb), uw(u0, b)]
  }

  // the dark seam core between slices, full height
  T.prism([uw(-26, -8), uw(27, -8), uw(27, 13.5), uw(-26, 13.5)], LOBBY_H, 174, SEAM, ROOF)

  for (const s of SLICES) {
    const lo = Math.min(s.hA, s.hB) - CREST
    faceBand(out, local(plan(s, 0, 1.2)), y0, y0 + LOBBY_H, { kind: 'fins', wall: BAND, glass: LOBBY_GLASS, floor: LOBBY_H / 2, pitch: 2.4, solid: 0.12, depth: 0.25, continuous: true, material: 'metal' })
    const stage = (lo - LOBBY_H) / SEGMENTS
    for (let k = 0; k < SEGMENTS; k++) {
      const ya = LOBBY_H + k * stage, yb = ya + stage
      faceBand(out, local(plan(s, k)), y0 + ya, y0 + yb, FACE)
      T.cap(plan(s, k), yb, ROOF) // the little ledges where a stage steps out
    }
    // the sloping crown: glass rising (or falling) along the slice, a white rim
    const top = plan(s, SEGMENTS - 1)
    const hi = (e: number, n: number): number => {
      const u = (e - C[0]) * UX + (n - C[1]) * UZ
      return s.hA + ((u - s.u0) / (s.u1 - s.u0)) * (s.hB - s.hA)
    }
    T.prism(top, lo, hi, GLASS, ROOF)
    faceBand(out, local(top), y0 + lo - 1, y0 + lo, { kind: 'blank', wall: BAND, material: 'metal' })
  }

  // the loggias: two-storey open boxes cantilevered out of each long outer face, zigzagging up the fold
  for (const s of SLICES) {
    if (!s.side) continue
    let i = 0
    for (let y = LOBBY_H + 2 * FLOOR; y + LOGGIA_FLOORS * FLOOR < Math.min(s.hA, s.hB) - CREST - 4; y += LOGGIA_EVERY * FLOOR, i++) {
      const k = Math.min(SEGMENTS - 1, Math.floor((y - LOBBY_H) / ((Math.min(s.hA, s.hB) - CREST - LOBBY_H) / SEGMENTS)))
      const wf = (s.side > 0 ? s.w1 - SEAM_GAP : s.w0 + SEAM_GAP) + s.side * (LEAN * (k / (SEGMENTS - 1)) + FOLD * 0.7)
      const uc = (i % 2 ? 1 : -1) * (LOGGIA_W * 0.55) + (i % 3 === 2 ? 3 : 0)
      const box = (out_: number, back: number): P2[] => {
        const r = [uw(uc - LOGGIA_W / 2, wf + s.side * back), uw(uc + LOGGIA_W / 2, wf + s.side * back), uw(uc + LOGGIA_W / 2, wf + s.side * out_), uw(uc - LOGGIA_W / 2, wf + s.side * out_)]
        return s.side > 0 ? r : r.reverse()
      }
      const h = LOGGIA_FLOORS * FLOOR
      T.prism(box(LOGGIA_OUT + 0.3, -0.6), y, y + 0.6, SLAB, SLAB) // floor slab, cantilevered
      T.prism(box(LOGGIA_OUT * 0.15, -0.6), y + 0.6, y + h - 0.5, LOGGIA, LOGGIA) // the shadowed recess
      T.prism(box(LOGGIA_OUT, -0.6), y + h - 0.5, y + h, SLAB, SLAB) // its lid
    }
  }
  // a mast on the middle slice's high end
  const m = uw(20, 3)
  T.beam([m[0], m[1], 192], [m[0], m[1], 200], 0.3, BAND)
}
