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
import { box, prism, strut, wedge, wheel, EMIT, FIXED, type Rgb } from '../models.ts'
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

/**
 * The California Street car: double-ended — an open grip section at each end, the enclosed saloon between them —
 * and longer, 9.2 m; the line runs level-ish east to west along California Street over Nob Hill, so the car never
 * turns round (there is no turntable: the gripman changes ends).
 */
function californiaCar(out: MeshBuilder): void {
  const floor = 0.78
  const half = 1.22
  const end = 4.6
  const inner = 1.7
  const roofY = 2.98
  box(out, 0, 0.4, 0, 0.85, 0.25, end - 0.8, DARK, FIXED)
  box(out, 0, floor - 0.06, 0, half, 0.08, end - 0.1, WOOD, FIXED)
  let k = 11
  for (const e of [-1, 1]) {
    // the dash and its lamp, the running boards, the outward benches, the poles, the riders standing and sitting
    box(out, 0, floor + 0.55, e * (end - 0.05), half, 0.55, 0.06, CREAM, FIXED)
    box(out, 0, floor + 0.2, e * (end - 0.02), half, 0.2, 0.04, [1, 1, 1])
    box(out, 0, floor + 0.75, e * (end + 0.02), 0.5, 0.2, 0.01, [0.2, 0.3, 0.55], FIXED)
    box(out, 0, floor + 0.4, e * (end + 0.04), 0.12, 0.12, 0.02, LAMP, EMIT)
    for (const s of [-1, 1]) {
      box(out, s * (half + 0.18), floor - 0.25, e * (end + inner) / 2, 0.2, 0.04, (end - inner) / 2, WOOD, FIXED)
      box(out, s * 0.45, floor + 0.42, e * (end + inner) / 2, 0.32, 0.05, (end - inner) / 2 - 0.2, WOOD, FIXED)
      for (const z of [end - 0.15, inner + 0.15]) box(out, s * (half - 0.05), (floor + roofY) / 2, e * z, 0.04, (roofY - floor) / 2, 0.04, [0.9, 0.9, 0.86], FIXED)
      for (const z of [end - 0.6, inner + 0.6]) rider(out, s * (half + 0.22), floor - 0.22, e * z, k++, true)
      rider(out, s * 0.62, floor + 0.47, e * (end + inner) / 2, k++, false)
    }
    box(out, 0, floor + 0.45, e * (end + inner) / 2, 0.12, 0.45, (end - inner) / 2 - 0.15, WOOD, FIXED)
    box(out, 0.15, floor + 0.7, e * (end - 0.8), 0.04, 0.7, 0.04, BRASS, FIXED)
    box(out, 0, floor + 1.35, e * inner, half, 0.55, 0.05, CREAM, FIXED)
    box(out, 0, floor + 1.4, e * (inner + 0.01), 0.9, 0.36, 0.02, GLASS, FIXED)
  }
  // the saloon between the two open ends
  box(out, 0, floor + 0.45, 0, half, 0.45, inner, [1, 1, 1])
  for (const s of [-1, 1]) {
    box(out, s * half, floor + 1.35, 0, 0.03, 0.5, inner, CREAM, FIXED)
    for (let w = 0; w < 4; w++) box(out, s * (half + 0.045), floor + 1.38, -inner + 0.45 + w * 0.8, 0.01, 0.36, 0.3, GLASS, FIXED)
    for (const z of [-0.8, 0.8]) rider(out, s * 0.7, floor + 0.45, z, k++, false)
  }
  // the roof, the clerestory, the lamps at both ends, the route boards
  box(out, 0, roofY, 0, half + 0.12, 0.08, end + 0.05, WOOD, FIXED)
  wedge(out, 0, roofY + 0.18, 0, half + 0.05, 0.1, end - 0.05, 0.4, [0.35, 0.22, 0.14], FIXED)
  box(out, 0, roofY + 0.4, 0, 0.62, 0.18, inner + 0.3, WOOD, FIXED)
  for (const s of [-1, 1]) box(out, s * 0.63, roofY + 0.42, 0, 0.01, 0.13, inner, CREAM, FIXED)
  for (const e of [-1, 1]) prism(out, 0, e * (end - 1.2), roofY + 0.28, roofY + 0.5, 0.14, 8, LAMP, EMIT)
}

/**
 * Whether a cable-car track is the California line: it runs along California Street (the local grid's z ≈ −90 m,
 * the street's latitude, from Drumm to Van Ness) east–west, where the Powell lines only cross it.
 */
function californiaLine(points: { x: number; z: number }[]): number | null {
  if (points.length < 2) return null
  let near = 0
  for (const p of points) if (Math.abs(p.z + 90) < 70) near++
  const dx = Math.abs(points[points.length - 1].x - points[0].x)
  const dz = Math.abs(points[points.length - 1].z - points[0].z)
  return near / points.length > 0.8 && dx > 2 * dz ? 1 : 0
}

/** A PCC livery: the lower body, the belt, the window band and roof — each F-line car wears a city's */
interface Livery { lower: Rgb; belt: Rgb; upper: Rgb; roof: Rgb; name: string }

const PCC_LIVERIES: Livery[] = [
  { name: 'Birmingham', lower: [0.14, 0.32, 0.22], belt: [0.84, 0.3, 0.14], upper: [0.9, 0.86, 0.72], roof: [0.88, 0.88, 0.84] },
  { name: 'Muni "wings"', lower: [0.22, 0.4, 0.3], belt: [0.72, 0.15, 0.14], upper: [0.9, 0.87, 0.74], roof: [0.62, 0.64, 0.6] },
  { name: 'Los Angeles', lower: [0.9, 0.72, 0.18], belt: [0.2, 0.35, 0.22], upper: [0.9, 0.72, 0.18], roof: [0.3, 0.34, 0.3] },
  { name: 'Philadelphia', lower: [0.2, 0.36, 0.3], belt: [0.9, 0.86, 0.74], upper: [0.9, 0.86, 0.74], roof: [0.72, 0.72, 0.68] },
  { name: 'Kansas City', lower: [0.66, 0.16, 0.14], belt: [0.9, 0.84, 0.66], upper: [0.9, 0.84, 0.66], roof: [0.56, 0.3, 0.26] },
  { name: 'Chicago', lower: [0.3, 0.44, 0.3], belt: [0.94, 0.6, 0.2], upper: [0.92, 0.9, 0.8], roof: [0.62, 0.64, 0.6] },
]

/**
 * A PCC streetcar (1946–52), the F-line's workhorse: 14.2 m. From the photographs (car 1077 in Birmingham's
 * green, orange and cream; 1050, 1058, 1010):
 * - rounded at both ends in plan, the front's three windscreen panes leaning back, the destination board over them;
 * - the long window band with the small standee windows above it; the belt rail; the skirt over the trucks;
 * - folding doors at the front and the middle on the right; the headlamp low on the nose, the anti-climber under it;
 * - the roof with its ventilator hatch, the trolley pole trailing back to the wire, and its retriever.
 */
function pcc(liv: Livery): (out: MeshBuilder) => void {
  return (out) => {
    const L = 7.1
    const W = 1.32
    const F = FIXED
    // body sections: skirt (lower colour, down over the trucks), lower panel, belt, window band — each carried round
    // the rounded ends: the nose is a superellipse in plan, drawn as six slices narrowing toward the tip
    const NOSE = 1.4
    const STEPS = 6
    const noseHalf = (k: number, inset: number): number => {
      const t = (k + 1) / STEPS
      return Math.max(0.2, (W - inset) * Math.pow(1 - Math.pow(t, 2.6), 1 / 2.6))
    }
    const section = (y: number, h: number, c: Rgb, inset = 0): void => {
      box(out, 0, y, 0, W - inset, h, L - NOSE, c, F)
      for (const e of [-1, 1]) {
        for (let k = 0; k < STEPS; k++) {
          const z = L - NOSE + (NOSE * (k + 0.5)) / STEPS
          box(out, 0, y, e * z, noseHalf(k, inset), h, NOSE / STEPS / 2, c, F)
        }
      }
    }
    section(0.62, 0.2, liv.lower)                 // the skirt
    section(1.12, 0.3, liv.lower)                 // the lower panel
    section(1.5, 0.08, liv.belt)                  // the belt
    section(1.66, 0.08, liv.upper)                // the sill
    section(2.08, 0.34, liv.upper)                // the window band
    section(2.5, 0.08, liv.upper)                 // over the windows, the standee strip
    // the side windows: the long ones, the standee windows over them; the doors (right side, +x)
    for (const s of [-1, 1]) {
      for (let k = 0; k < 8; k++) {
        const z = -L + 1.7 + k * 1.55
        if (s > 0 && (k === 7 || k === 3)) continue       // the doors take these bays on the right
        box(out, s * (W + 0.01), 2.06, z, 0.01, 0.28, 0.6, GLASS, F)
        box(out, s * (W + 0.01), 2.52, z, 0.01, 0.05, 0.45, GLASS, F)
      }
    }
    for (const z of [-L + 1.7 + 7 * 1.55, -L + 1.7 + 3 * 1.55]) {
      box(out, W + 0.015, 1.5, z, 0.01, 0.95, 0.6, [0.2, 0.22, 0.24], F)
      box(out, W + 0.02, 1.8, z - 0.3, 0.01, 0.55, 0.26, GLASS, F)
      box(out, W + 0.02, 1.8, z + 0.3, 0.01, 0.55, 0.26, GLASS, F)
    }
    // the ends: the windscreen following the nose round — each slice's front glazed across the window band — and the
    // destination board over it, the headlamp, the anti-climber
    for (const e of [-1, 1]) {
      for (let k = 2; k < STEPS; k++) {
        const zf = L - NOSE + (NOSE * (k + 1)) / STEPS
        const hw = noseHalf(k, 0)
        const inner = k < STEPS - 1 ? noseHalf(k + 1, 0) : 0
        // the glazed strip on this slice's front: from the next slice's edge out to this one's (the whole of the tip)
        for (const s of k < STEPS - 1 ? [-1, 1] : [0]) {
          const x0 = s === 0 ? -hw + 0.05 : s * inner
          const x1 = s === 0 ? hw - 0.05 : s * (hw - 0.04)
          box(out, (x0 + x1) / 2, 2.06, e * (zf + 0.005), Math.abs(x1 - x0) / 2, 0.3, 0.005, GLASS, F)
        }
      }
      box(out, 0, 2.6, e * (L - 0.1), 0.42, 0.08, 0.03, [0.12, 0.12, 0.12], F)
      box(out, 0, 2.6, e * (L - 0.07), 0.36, 0.05, 0.01, [0.98, 0.94, 0.8], EMIT)       // the destination, lit
      box(out, 0, 0.95, e * (L + 0.01), 0.12, 0.12, 0.02, e > 0 ? LAMP : [0.9, 0.12, 0.08], EMIT)
      box(out, 0, 0.5, e * (L + 0.06), 0.5, 0.06, 0.08, [0.55, 0.56, 0.58], F)          // the anti-climber
    }
    // the roof: domed, its ventilator hatch, the trolley pole and its base, the retriever on the back
    // (the roof follows the nose round like the body, and domes only over the straight part)
    section(2.63, 0.06, liv.roof)
    wedge(out, 0, 2.75, 0, W - 0.1, 0.06, L - NOSE, 0.35, liv.roof, F)
    box(out, 0, 2.86, -1.8, 0.55, 0.1, 1.6, liv.roof, F)
    box(out, 0, 2.82, -L + 1.3, 0.22, 0.08, 0.3, DARK, F)
    // the pole: up from its base at about 20°, trailing back behind the car to the wire, the wheel at its end
    strut(out, [0, 2.9, -L + 1.3], [0, 5.55, -L - 5.8], 0.05, 0.05, DARK, F)
    box(out, 0, 5.6, -L - 5.8, 0.03, 0.08, 0.08, [0.4, 0.4, 0.42], F)
    box(out, 0, 1.3, -L - 0.12, 0.14, 0.14, 0.08, DARK, F)                              // the retriever
    // the trucks under the skirt: dark, and the wheels
    for (const e of [-1, 1]) {
      box(out, 0, 0.35, e * (L - 2.3), 1.0, 0.22, 1.1, DARK, F)
      for (const w of [-0.9, 0.9]) for (const x of [-0.72, 0.72]) wheel(out, x, 0.33, e * (L - 2.3) + w, 0.33, 0.06, [0.18, 0.18, 0.19])
    }
    // the riders at the windows
    for (let k = 0; k < 10; k++) box(out, (k % 2 ? 1 : -1) * 0.8, 2.02, -L + 1.6 + k * 1.25, 0.1, 0.12, 0.1, SKIN[k % SKIN.length], F)
  }
}

/**
 * A Milan Peter Witt tram (the "Ventotto", 1928), the F-line's other workhorse: 14 m, square-ended, orange with a
 * cream line, the windows in pairs with transom lights over them, a dark monitor roof along its length, the trolley
 * pole up; the trucks in plain view.
 */
function peterWitt(out: MeshBuilder): void {
  const L = 6.9
  const W = 1.2
  const F = FIXED
  const ORANGE: Rgb = [0.9, 0.5, 0.12]
  box(out, 0, 1.25, 0, W, 0.55, L, ORANGE, F)
  box(out, 0, 1.82, 0, W + 0.01, 0.03, L, [0.92, 0.88, 0.76], F)
  box(out, 0, 2.2, 0, W, 0.38, L, ORANGE, F)
  // the windows: eleven a side, big and close, narrow posts between them, the transom lights over them
  for (const s of [-1, 1]) {
    for (let k = 0; k < 11; k++) {
      const z = -L + 0.75 + k * 1.24
      box(out, s * (W + 0.01), 2.18, z, 0.01, 0.34, 0.52, GLASS, F)
      box(out, s * (W + 0.01), 2.6, z, 0.01, 0.045, 0.52, GLASS, F)
    }
  }
  // the ends: three windows across, the destination and the big headlamp
  for (const e of [-1, 1]) {
    for (const x of [-0.72, 0, 0.72]) box(out, x, 2.2, e * (L + 0.01), 0.3, 0.32, 0.01, GLASS, F)
    box(out, 0, 2.7, e * (L + 0.01), 0.4, 0.07, 0.01, [0.95, 0.92, 0.8], EMIT)
    box(out, 0, 1.3, e * (L + 0.03), 0.16, 0.16, 0.02, e > 0 ? LAMP : [0.9, 0.12, 0.08], EMIT)
    box(out, 0, 0.72, e * (L + 0.08), 0.7, 0.07, 0.08, DARK, F)
  }
  // the roof: its eaves, the monitor down the middle with its little windows, the pole
  box(out, 0, 2.66, 0, W + 0.06, 0.07, L + 0.06, [0.36, 0.26, 0.2], F)
  box(out, 0, 2.85, 0, 0.62, 0.14, L - 0.8, [0.36, 0.26, 0.2], F)
  for (const s of [-1, 1]) box(out, s * 0.63, 2.85, 0, 0.01, 0.07, L - 1.2, GLASS, F)
  strut(out, [0, 2.95, -L + 2.4], [0, 5.55, -L - 4.6], 0.05, 0.05, DARK, F)
  // the trucks, open to view
  for (const e of [-1, 1]) {
    box(out, 0, 0.45, e * (L - 2), 0.95, 0.2, 1.0, DARK, F)
    for (const w of [-0.8, 0.8]) for (const x of [-0.7, 0.7]) wheel(out, x, 0.38, e * (L - 2) + w, 0.36, 0.06, [0.18, 0.18, 0.19])
  }
  box(out, 0, 0.72, 0, 1.0, 0.1, L - 0.2, DARK, F)
  for (let k = 0; k < 10; k++) box(out, (k % 2 ? 1 : -1) * 0.75, 2.12, -L + 1 + k * 1.3, 0.1, 0.12, 0.1, SKIN[(k + 1) % SKIN.length], F)
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
  // (each livery is its own model: a PCC's three tones will not come out of one tint)
  tram: {
    mid: pcc(PCC_LIVERIES[0]), cars: 1, pitch: 15, speed: 6.5, deck: 0.95, colour: [1, 1, 1], shadow: [14.2, 2.7, 3.2], capacity: 12, stops: true,
    variants: [
      ...PCC_LIVERIES.slice(1).map((l) => ({ mid: pcc(l) })),
      { mid: peterWitt, shadow: [13.8, 2.5, 3.3] as [number, number, number] },
    ],
  },
  cable: {
    mid: cableCar, cars: 1, pitch: 9.5, speed: 4.2, deck: 0.78, colour: [0.5, 0.12, 0.12], shadow: [8.4, 2.5, 3.3], capacity: 24, stops: true,
    // Powell cars in maroon, a few in the 1950s Muni blue-and-cream or the old green
    liveries: [[0.5, 0.12, 0.12], [0.5, 0.12, 0.12], [0.2, 0.3, 0.5], [0.5, 0.12, 0.12], [0.24, 0.38, 0.3]],
    // the California line's double-ended cars, maroon
    variants: [{ mid: californiaCar, pitch: 10, shadow: [9.2, 2.5, 3.3], liveries: [[0.48, 0.12, 0.12]] }],
    variantFor: californiaLine,
  },
  light: { mid: muniLRV, cars: 2, pitch: 23.2, speed: 11, deck: 0.95, colour: [0.82, 0.83, 0.85], shadow: [23, 2.7, 3.4], capacity: 24, stops: true },
}

/** the models on their own, for the model viewer (src/model-showcase.ts: ?model=cableCar) */
export const SF_VEHICLES = { cableCar, californiaCar, pccStreetcar: pcc(PCC_LIVERIES[0]), peterWitt, muniLRV }
