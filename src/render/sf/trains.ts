/**
 * San Francisco's rolling stock (render/rolling-stock.ts for the shared engine; SF_PLAN.md §7), from photographs
 * (Wikimedia Commons: "Cable car 17 Hyde Street San Francisco 2019", the Ferry Building's F-line PCC):
 *
 * - **the cable car** on the unpowered track (PackedRail.cable): the Powell car, 8.4 m — an open grip section in
 *   front, its cream dash carrying the number, the destination board and the round headlamp, benches facing out
 *   over the running boards where people ride standing, holding the poles; the enclosed saloon behind with its
 *   cream-framed windows over a maroon body; the clerestory roof with its lamp, the route boards along it;
 * - **the F-line streetcar** on the powered tram track: a 1940s PCC car, 14.2 m, rounded at both ends, its trolley
 *   pole up to the wire, in one of a dozen cities' liveries;
 * - **the Muni Metro light-rail car** (PackedRail.light): the Siemens LRV, silver and red, two cars coupled.
 *
 * All face +z; the body panels take the livery per copy (the tag BODY), everything else keeps its colour.
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, prism, wedge, EMIT, FIXED, type Rgb } from '../models.ts'
import { DEFAULT_STOCK, type RegionStock } from '../rolling-stock.ts'

const CREAM: Rgb = [0.9, 0.86, 0.72]
const WOOD: Rgb = [0.48, 0.3, 0.18]
const DARK: Rgb = [0.12, 0.12, 0.13]
const GLASS: Rgb = [0.28, 0.33, 0.37]
const BRASS: Rgb = [0.78, 0.7, 0.44]
const LAMP: Rgb = [1, 0.95, 0.78]
const SHIRTS: Rgb[] = [[0.8, 0.2, 0.2], [0.2, 0.35, 0.7], [0.95, 0.85, 0.3], [0.92, 0.92, 0.92], [0.15, 0.15, 0.18], [0.3, 0.6, 0.35], [0.85, 0.5, 0.6], [0.55, 0.4, 0.3]]
const SKIN: Rgb[] = [[0.87, 0.7, 0.58], [0.65, 0.47, 0.35], [0.45, 0.32, 0.23], [0.93, 0.78, 0.66]]

/** a rider: standing on the running board holding a pole, or sitting on a bench (just the top of them) */
function rider(out: MeshBuilder, x: number, y: number, z: number, k: number, standing: boolean): void {
  const shirt = SHIRTS[k % SHIRTS.length]
  const skin = SKIN[(k * 7) % SKIN.length]
  if (standing) {
    box(out, x, y + 0.45, z, 0.13, 0.45, 0.12, [0.2, 0.22, 0.3], FIXED)         // the legs
    box(out, x, y + 1.2, z, 0.2, 0.32, 0.14, shirt, FIXED)                     // the body
    box(out, x - Math.sign(x) * 0.18, y + 1.55, z, 0.06, 0.22, 0.06, shirt, FIXED)   // the arm up to the pole
    box(out, x, y + 1.67, z, 0.1, 0.12, 0.1, skin, FIXED)
  } else {
    box(out, x, y + 0.35, z, 0.19, 0.3, 0.14, shirt, FIXED)
    box(out, x, y + 0.8, z, 0.1, 0.12, 0.1, skin, FIXED)
  }
}

/** The Powell Street cable car: open grip section forward (+z), the saloon behind, 8.4 m over the bumpers. */
function cableCar(out: MeshBuilder): void {
  const floor = 0.78
  const front = 4.1
  const split = 0.6                      // where the open section meets the saloon
  const back = -3.7
  const half = 1.2
  const roofY = 2.95
  // the running gear, dark under the floor, and the floor itself
  box(out, 0, 0.4, 0.2, 0.85, 0.25, 3.4, DARK, FIXED)
  box(out, 0, floor - 0.06, 0.2, half, 0.08, 3.9, WOOD, FIXED)
  // the running boards the length of the open section, and the step at the back
  for (const s of [-1, 1]) box(out, s * (half + 0.18), floor - 0.25, (front + split) / 2, 0.2, 0.04, (front - split) / 2, WOOD, FIXED)
  // the grip section: the cream dash at the front with its number board, destination and lamp
  box(out, 0, floor + 0.55, front - 0.05, half, 0.55, 0.06, CREAM, FIXED)
  box(out, 0, floor + 0.2, front - 0.02, half, 0.2, 0.04, [1, 1, 1])          // the lower dash: the livery
  box(out, -0.55, floor + 0.75, front + 0.02, 0.32, 0.25, 0.01, [0.45, 0.22, 0.18], FIXED)   // the destination board
  box(out, 0.55, floor + 0.75, front + 0.02, 0.3, 0.22, 0.01, [0.2, 0.45, 0.35], FIXED)      // the ad panel
  box(out, 0, floor + 1.02, front + 0.02, 0.16, 0.08, 0.01, DARK, FIXED)       // the number
  prism(out, 0, front + 0.03, floor + 0.35, floor + 0.36, 0.14, 10, LAMP, EMIT)   // the headlamp (a disc, in fact)
  box(out, 0, floor + 0.4, front + 0.04, 0.12, 0.12, 0.02, LAMP, EMIT)
  // the outward benches down the middle of the open section, back to back, and the poles at their ends
  box(out, 0, floor + 0.45, (front + split) / 2, 0.12, 0.45, (front - split) / 2 - 0.2, WOOD, FIXED)
  for (const s of [-1, 1]) box(out, s * 0.45, floor + 0.42, (front + split) / 2, 0.32, 0.05, (front - split) / 2 - 0.25, WOOD, FIXED)
  for (const z of [front - 0.15, (front + split) / 2, split + 0.15]) {
    for (const s of [-1, 1]) box(out, s * (half - 0.05), (floor + roofY) / 2, z, 0.04, (roofY - floor) / 2, 0.04, [0.9, 0.9, 0.86], FIXED)
  }
  // the grip itself: the lever standing up in the middle, the gripman's post
  box(out, 0.15, floor + 0.7, front - 0.8, 0.04, 0.7, 0.04, BRASS, FIXED)
  // the saloon: maroon below, cream-framed windows, the end windows
  box(out, 0, floor + 0.45, (split + back) / 2 + 0.3, half, 0.45, (split - back) / 2 - 0.3, [1, 1, 1])
  for (const s of [-1, 1]) {
    box(out, s * half, floor + 1.35, (split + back) / 2 + 0.3, 0.03, 0.5, (split - back) / 2 - 0.3, CREAM, FIXED)
    for (let k = 0; k < 4; k++) {
      const z = back + 0.9 + k * 0.85
      box(out, s * (half + 0.045), floor + 1.38, z, 0.01, 0.36, 0.3, GLASS, FIXED)    // clear of the cream band: no z-fighting
    }
  }
  box(out, 0, floor + 1.35, split, half, 0.55, 0.05, CREAM, FIXED)
  box(out, 0, floor + 1.4, split + 0.01, 0.9, 0.36, 0.02, GLASS, FIXED)
  // the back platform, open, with its rail
  box(out, 0, floor + 0.55, back + 0.02, half, 0.55, 0.05, CREAM, FIXED)
  // the roof: an arch the length of the car, the clerestory over the saloon, its lamp and the route boards
  box(out, 0, roofY, 0.2, half + 0.12, 0.08, 4.05, WOOD, FIXED)
  wedge(out, 0, roofY + 0.18, 0.2, half + 0.05, 0.1, 3.95, 0.4, [0.35, 0.22, 0.14], FIXED)
  box(out, 0, roofY + 0.4, -1.2, 0.62, 0.18, 2.3, WOOD, FIXED)
  for (const s of [-1, 1]) box(out, s * 0.63, roofY + 0.42, -1.2, 0.01, 0.13, 1.9, CREAM, FIXED)
  prism(out, 0, 2.6, roofY + 0.28, roofY + 0.5, 0.14, 8, LAMP, EMIT)
  // the riders: standing on the running boards holding on, and the seated ones on the benches and in the saloon
  let k = 3
  for (const s of [-1, 1]) {
    for (const z of [front - 0.6, (front + split) / 2 + 0.3, split + 0.5]) rider(out, s * (half + 0.22), floor - 0.22, z, k++, true)
    for (const z of [front - 1.2, split + 1.2]) rider(out, s * 0.62, floor + 0.47, z, k++, false)
    for (const z of [back + 1.2, back + 2.4]) rider(out, s * 0.7, floor + 0.45, z, k++, false)
  }
}

/** A PCC streetcar (1940s), the F-line's: 14.2 m, rounded at both ends, the trolley pole up. */
function pccStreetcar(out: MeshBuilder): void {
  const L = 7.1
  const W = 1.3
  // the body, lower (in its livery) and upper (the window band, cream), each rounded at the ends in three steps
  const body = (y: number, h: number, c: Rgb, tag?: number): void => {
    box(out, 0, y, 0, W, h, L - 1, c, tag)
    for (const e of [-1, 1]) for (let k = 0; k < 3; k++) box(out, 0, y, e * (L - 1 + k * 0.33 + 0.17), W - k * 0.3, h, 0.17, c, tag)
  }
  body(1.05, 0.55, [1, 1, 1])
  body(2.0, 0.4, CREAM, FIXED)
  box(out, 0, 1.62, 0, W + 0.02, 0.07, L - 0.9, [0.3, 0.3, 0.3], FIXED)      // the belt rail
  // the side windows, set into the cream band, and the windscreens in the rounded ends
  for (const s of [-1, 1]) {
    for (let k = 0; k < 7; k++) box(out, s * (W + 0.01), 2.02, -L + 1.6 + k * 1.75, 0.01, 0.3, 0.62, GLASS, FIXED)
  }
  for (const e of [-1, 1]) {
    box(out, 0, 2.02, e * (L + 0.01), 0.62, 0.3, 0.01, GLASS, FIXED)
    for (const s of [-1, 1]) box(out, s * 0.95, 2.02, e * (L - 0.35), 0.01, 0.28, 0.25, GLASS, FIXED)
    box(out, 0, 0.9, e * (L + 0.02), 0.14, 0.1, 0.02, LAMP, EMIT)
    box(out, 0, 2.5, e * (L - 0.1), 0.35, 0.08, 0.02, [0.95, 0.9, 0.7], EMIT)      // the destination sign
  }
  // the roof, domed
  wedge(out, 0, 2.52, 0, W - 0.05, 0.12, L - 0.2, 0.35, [0.72, 0.72, 0.7], FIXED)
  // the trolley pole: from the rear of the roof up and forward to the wire
  box(out, 0, 3.3, -L + 3.2, 0.03, 0.03, 2.4, DARK, FIXED)
  box(out, 0, 2.7, -L + 1.2, 0.2, 0.08, 0.3, DARK, FIXED)
  box(out, 0, 0.35, 0, 1.0, 0.25, L - 1.5, DARK, FIXED)
  // a few riders at the windows
  for (let k = 0; k < 8; k++) box(out, (k % 2 ? 1 : -1) * 0.8, 1.95, -L + 1.8 + k * 1.5, 0.1, 0.12, 0.1, SKIN[k % SKIN.length], FIXED)
}

/** A Muni Metro light-rail car (Siemens S200SF): silver, a red band, its raked cab. 23 m. */
function muniLRV(out: MeshBuilder): void {
  const L = 11.5
  const W = 1.33
  box(out, 0, 1.6, 0, W, 1.2, L - 0.6, [0.82, 0.83, 0.85], FIXED)
  box(out, 0, 0.9, 0, W + 0.01, 0.12, L - 0.6, [0.78, 0.12, 0.14], FIXED)
  for (const s of [-1, 1]) {
    for (let k = 0; k < 8; k++) box(out, s * (W + 0.01), 1.95, -L + 1.8 + k * 2.6, 0.01, 0.45, 0.95, GLASS, FIXED)
  }
  wedge(out, 0, 1.6, L - 0.3, W - 0.05, 1.2, 0.3, 0.3, [0.82, 0.83, 0.85], FIXED)
  box(out, 0, 2.0, L - 0.02, W - 0.2, 0.5, 0.02, GLASS, FIXED)
  box(out, 0, 2.95, 0, 0.5, 0.12, 1.2, DARK, FIXED)                         // the pantograph's base
  box(out, 0, 3.4, 0, 0.8, 0.03, 0.08, DARK, FIXED)
  box(out, 0, 0.9, L + 0.01, 0.15, 0.1, 0.02, LAMP, EMIT)
  box(out, 0, 0.35, 0, 1.0, 0.3, L - 1.5, DARK, FIXED)
}

export const SF_STOCK: RegionStock = {
  ...DEFAULT_STOCK,
  // the F-line's historic streetcars, in the liveries of the cities they came from
  tram: {
    mid: pccStreetcar, cars: 1, pitch: 15, speed: 6.5, colour: [0.2, 0.45, 0.35], shadow: [14, 2.7, 3.2], capacity: 24,
    liveries: [[0.2, 0.45, 0.35], [0.85, 0.72, 0.2], [0.72, 0.16, 0.14], [0.18, 0.3, 0.6], [0.9, 0.5, 0.2], [0.35, 0.55, 0.3], [0.82, 0.82, 0.78]],
  },
  cable: {
    mid: cableCar, cars: 1, pitch: 9.5, speed: 4.2, colour: [0.5, 0.12, 0.12], shadow: [8.4, 2.5, 3.3], capacity: 24,
    // Powell cars are maroon; the California line's blue; a few in the old green
    liveries: [[0.5, 0.12, 0.12], [0.5, 0.12, 0.12], [0.18, 0.28, 0.5], [0.5, 0.12, 0.12], [0.24, 0.38, 0.3]],
  },
  light: { mid: muniLRV, cars: 2, pitch: 23.2, speed: 11, colour: [0.82, 0.83, 0.85], shadow: [23, 2.7, 3.4], capacity: 24 },
}

/** the models on their own, for the model viewer (src/model-showcase.ts: ?model=cableCar) */
export const SF_VEHICLES = { cableCar, pccStreetcar, muniLRV }
