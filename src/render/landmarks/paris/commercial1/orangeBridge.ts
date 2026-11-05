/**
 * Bridge — Orange headquarters (Arte Charpentier, 2021), 111 quai du Président-Roosevelt, Issy-les-Moulineaux. OSM way/934641564
 * (11 levels) with nested building:parts of 8/9/10 levels and an 11-level part from level 9 on the south-east face; the brief's
 * "~37 m" is the levels' guess. The IGN lidar MNS (flown while Keiko next door was still rising, cranes at 80–96 m ignored)
 * reads two true plateaus instead: a 55 m west block and a 60 m east block along the railway, a ~63 m plant crown on the east,
 * and nothing over OSM's north-west tip (the oblique ortho leans the roof there), so the plan is traced from the lidar, with
 * OSM's south-east edges. Photos (bridge1/2 from the plaza): dark glass curtain walls with bronze floor bands, the upper boxes
 * stacked proud of each other and cantilevered over the plaza — here the west block's lower storeys step back under its
 * south-west edge (CANT_D, CANT_LO). The ortho's roof: green terraces and white skylight boxes. Plan in metres east/north of
 * 48.83016, 2.26245. Tunable in BRIDGE.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { ccwEN, registerRing, tools, type P2 } from '../museums/enframe.ts'

// OSM's outline: the frame the fit registers on
const RING: P2[] = [[-61.5, -4.2], [-28.9, -18.8], [-6.6, -28.8], [7.5, -35.1], [3.1, -43.6], [21.3, -52.0], [25.9, -43.4], [32.1, -32.2], [43.2, -10.7], [63.9, 13.9], [46.6, 24.7], [10.7, 47.3], [-10.8, 60.7], [-35.3, 76.1], [-49.3, 48.8]]
// lidar plateaus
const WEST: P2[] = [[-62, -2], [-16, -18], [-2, -24], [14, 20], [12, 40], [-12, 42], [-36, 30], [-52, 14]]
const EAST: P2[] = [[-2, -24], [4, -44], [22, -52], [26, -43], [32, -32], [43, -11], [64, 14], [60, 22], [14, 20]]

export const BRIDGE = {
  WEST_H: 55, EAST_H: 60, FLOOR: 4.2, GROUND: 6, BAND: 0.9, BAND_OUT: 0.35, PARAPET: 1.1,
  CANT_D: 9, CANT_LO: 14, // the west block's south-west edge overhangs the plaza this far, from this height up
  STEP: 1.6, STEP_EVERY: 3, // the stacked boxes: every STEP_EVERY floors the band juts STEP further, like a box laid on a box
  CROWN: { c: [30, 2] as P2, w: 22, d: 14, h: 3.5 },
}
// white skylight boxes on the green roofs (ortho)
const SKY: { c: P2, w: number, d: number }[] = [{ c: [-30, 12], w: 10, d: 22 }, { c: [-6, 20], w: 8, d: 18 }, { c: [40, 2], w: 9, d: 16 }]

export const orangeBridge = (out: MeshBuilder, fit: Fit): void => {
  const K = BRIDGE, F = registerRing(RING, fit), T = tools(out, F)
  const glass = hex('#3c4a55'), glassLo = hex('#2c353c'), bronze = hex('#5a5048'), green = hex('#6f8458'), white = hex('#e6e6e2'), plant = hex('#9a9b98')
  const block = (ring0: P2[], H: number, cantEdge: number): void => {
    const r = ccwEN(ring0)
    // the overhung edge: the first edge of the given ring (start/end points), moved in for the lower storeys
    const a0 = ring0[cantEdge], b0 = ring0[(cantEdge + 1) % ring0.length]
    const isCant = (a: P2, b: P2): boolean => cantEdge >= 0 && ((a === a0 && b === b0) || (a === b0 && b === a0))
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (l < 0.05) continue
      const nx = (b[1] - a[1]) / l, ny = -(b[0] - a[0]) / l
      const off = (d: number): [P2, P2] => [[a[0] + nx * d, a[1] + ny * d], [b[0] + nx * d, b[1] + ny * d]]
      const cant = isCant(a, b), lo = cant ? K.CANT_LO : 0
      if (cant) {
        const [ia, ib] = off(-K.CANT_D)
        T.wall(ia, ib, 0, K.CANT_LO, glassLo)
        // the soffit: a downward face between the recessed and the outer line
        T.poly([F.p(a[0], a[1], K.CANT_LO), F.p(ia[0], ia[1], K.CANT_LO), F.p(ib[0], ib[1], K.CANT_LO), F.p(b[0], b[1], K.CANT_LO)], bronze, [0, -1, 0])
      } else T.wall(a, b, 0, K.GROUND, glassLo)
      const top = H - 0.3
      for (let y = cant ? K.CANT_LO : K.GROUND, f = 0; y < top - 0.3; y += K.FLOOR, f++) {
        const y1 = Math.min(y + K.FLOOR, top), jut = K.BAND_OUT + (Math.floor(f / K.STEP_EVERY) % 2) * K.STEP
        T.wall(a, b, y, y1 - K.BAND, glass)
        T.wall(...off(jut), y1 - K.BAND, y1, bronze)
      }
      T.wall(a, b, Math.max(lo, top - 0.3), H + K.PARAPET, bronze)
    }
    // cut the end walls between the recessed lower storeys and the outer line: covered by the side walls' lower run
    T.cap(r, H, green)
  }
  block(WEST, K.WEST_H, 0)
  block(EAST, K.EAST_H, -1)
  const box = (c: P2, w: number, d: number): P2[] => [[c[0] - w / 2, c[1] - d / 2], [c[0] + w / 2, c[1] - d / 2], [c[0] + w / 2, c[1] + d / 2], [c[0] - w / 2, c[1] + d / 2]]
  for (const s of SKY) T.prism(box(s.c, s.w, s.d), s.c[0] < 10 ? K.WEST_H : K.EAST_H, (s.c[0] < 10 ? K.WEST_H : K.EAST_H) + 1.8, white, white)
  T.prism(box(K.CROWN.c, K.CROWN.w, K.CROWN.d), K.EAST_H, K.EAST_H + K.CROWN.h, plant, plant)
}
