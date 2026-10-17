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
import { box, prism, strut, wheel, EMIT, FIXED, type Rgb } from '../models.ts'
import { DEFAULT_STOCK, turned, type RegionStock } from '../rolling-stock.ts'

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

/**
 * A cable car's ARCHED ROOF: cambered across, a thin board at its eaves, and at each end turned down over the open
 * platform like a hood (the Powell and California cars' silhouette; the flat slab that stood for it read as a box
 * lid). From `z0` to `z1`, `half` wide, its eaves at `y0`, `rise` higher at the crown; `droop` metres at each end
 * fall to a quarter of the rise.
 */
function archedRoof(out: MeshBuilder, z0: number, z1: number, half: number, y0: number, rise: number, droop: number, colour: Rgb): void {
  const N = 8
  const xs = Array.from({ length: N + 1 }, (_, i) => -half + (2 * half * i) / N)
  const stations: [number, number][] = [[z0, 0.25], [z0 + droop * 0.5, 0.75], [z0 + droop, 1], [z1 - droop, 1], [z1 - droop * 0.5, 0.75], [z1, 0.25]]
  const y = (x: number, f: number): number => y0 + rise * f * (1 - (x / half) ** 2)
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const normal = (p: [number, number, number][]): [number, number, number] => {
    const a = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]]
    const b = [p[3][0] - p[0][0], p[3][1] - p[0][1], p[3][2] - p[0][2]]
    let n: [number, number, number] = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
    const l = Math.hypot(...n) || 1
    n = [n[0] / l, n[1] / l, n[2] / l]
    return n[1] < 0 ? [-n[0], -n[1], -n[2]] : n
  }
  for (let k = 1; k < stations.length; k++) {
    const [za, fa] = stations[k - 1]
    const [zb, fb] = stations[k]
    for (let i = 0; i < N; i++) {
      const p: [number, number, number][] = [[xs[i], y(xs[i], fa), za], [xs[i + 1], y(xs[i + 1], fa), za], [xs[i + 1], y(xs[i + 1], fb), zb], [xs[i], y(xs[i], fb), zb]]
      out.quad(p, normal(p), UV, colour, FIXED)
    }
  }
  // the underside, and the ends closed down to the eaves
  out.quad([[-half, y0, z0], [half, y0, z0], [half, y0, z1], [-half, y0, z1]], [0, -1, 0], UV, colour, FIXED)
  for (const [z, f, nz] of [[z0, 0.25, -1], [z1, 0.25, 1]] as const) {
    for (let i = 0; i < N; i++) {
      out.quad([[xs[i], y0, z], [xs[i + 1], y0, z], [xs[i + 1], y(xs[i + 1], f), z], [xs[i], y(xs[i], f), z]], [0, 0, nz], UV, colour, FIXED)
    }
  }
  // the eaves: a thin dark board down each side
  for (const sd of [-1, 1]) box(out, sd * half, y0 - 0.05, (z0 + z1) / 2, 0.03, 0.06, (z1 - z0) / 2, [0.28, 0.17, 0.1], FIXED)
}

/**
 * A saloon's lower body, HOLLOW: the livery panels down each side to the sill and the benches along them inside, the
 * passengers sitting on those (render/cable-riders.ts). It was one solid block, and the seated riders sat buried in it
 * to the chest — "in a hot tub" (owner, 2026-10-16).
 */
function saloonShell(out: MeshBuilder, floor: number, half: number, z0: number, z1: number): void {
  const zm = (z0 + z1) / 2, hz = (z1 - z0) / 2
  for (const s of [-1, 1]) {
    box(out, s * (half - 0.03), floor + 0.45, zm, 0.03, 0.45, hz, [1, 1, 1])                     // the panel (livery)
    box(out, s * (half - 0.28), floor + 0.44, zm, 0.22, 0.04, hz - 0.1, WOOD, FIXED)              // the bench seat
    box(out, s * (half - 0.28), floor + 0.2, zm, 0.2, 0.2, hz - 0.1, [0.3, 0.2, 0.13], FIXED)     // its front
  }
  box(out, 0, floor + 0.01, zm, half - 0.06, 0.01, hz, [0.36, 0.24, 0.15], FIXED)                 // the saloon floor
}

/** a cable car's two trucks: dark frames under the floor and four wheels each */
function cableTrucks(out: MeshBuilder, zs: number[]): void {
  for (const z of zs) {
    box(out, 0, 0.36, z, 0.8, 0.12, 0.7, DARK, FIXED)
    for (const dz of [-0.45, 0.45]) for (const x of [-0.72, 0.72]) wheel(out, x, 0.28, z + dz, 0.28, 0.05, [0.2, 0.2, 0.21], 12)
  }
}

/** an upright disc facing +z (or −z with `back`): a headlamp, a number roundel */
function discZ(out: MeshBuilder, cx: number, cy: number, z: number, r: number, c: Rgb, tag: number, back = false, n = 14): void {
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2
    const p = (a: number): [number, number, number] => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]
    const q: [number, number, number][] = back ? [[cx, cy, z], p(a1), p(a0), p(a0)] : [[cx, cy, z], p(a0), p(a1), p(a1)]
    out.quad(q, [0, 0, back ? -1 : 1], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
}

/**
 * An ARCH-TOPPED window in a car's side (x = `sx`, facing out along ±x): the glass, its wood frame and the rounded head
 * (a fan of glass under a frame band), centred `z` along the car, sill at `y0`, `h` to the spring of the arch, `w` wide.
 */
function archWindow(out: MeshBuilder, sx: number, z: number, y0: number, h: number, w: number, frame: Rgb): void {
  const s = Math.sign(sx), x = sx + s * 0.01
  const nrm: [number, number, number] = [s, 0, 0]
  const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const q = (pts: [number, number, number][], c: Rgb, tag: number): void => out.quad(s > 0 ? pts : [pts[1], pts[0], pts[3], pts[2]], nrm, UVQ, c, tag)
  // the frame round it, then the glass over the frame a hair further out
  q([[x, y0 - 0.06, z - w / 2 - 0.06], [x, y0 - 0.06, z + w / 2 + 0.06], [x, y0 + h, z + w / 2 + 0.06], [x, y0 + h, z - w / 2 - 0.06]], frame, FIXED)
  const xg = sx + s * 0.02
  out.quad(s > 0 ? [[xg, y0, z - w / 2], [xg, y0, z + w / 2], [xg, y0 + h, z + w / 2], [xg, y0 + h, z - w / 2]] : [[xg, y0, z + w / 2], [xg, y0, z - w / 2], [xg, y0 + h, z - w / 2], [xg, y0 + h, z + w / 2]], nrm, UVQ, GLASS, FIXED)
  // the arched head: a half-disc of glass in a frame band
  const n = 8, r = w / 2
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI, a1 = ((k + 1) / n) * Math.PI
    const p = (a: number, rr: number, xx: number): [number, number, number] => [xx, y0 + h + Math.sin(a) * rr, z + Math.cos(a) * rr]
    q([p(a0, r + 0.06, x), p(a1, r + 0.06, x), [x, y0 + h, z], [x, y0 + h, z]], frame, FIXED)
    q([p(a0, r, xg), p(a1, r, xg), [xg, y0 + h, z], [xg, y0 + h, z]], GLASS, FIXED)
  }
}

/**
 * The Powell Street cable car (owner, 2026-10-16: "we could use a detailed model of the cable car. our streetcar model is
 * quite detailed"; Commons "Powell-Mason cable car 17 at Powell and Ellis 20250606", "Cable car 58 at Powell and
 * California", "Cable Car No. 15, Powell Market turntable" — docs/shots/refs/cablecar): 8.4 m over the bumpers, the open
 * GRIP SECTION forward (+z) and the enclosed SALOON behind.
 *
 *  - the grip section: its cream DASH at the front (number board, the round headlamp, the destination board over it),
 *    open sides, two outward-facing benches back to back under a centre backrest, white and brass grab poles at the
 *    bench ends and middles, the running boards outside, and the gripman's brass lever and the brake handles;
 *  - the saloon: the cream lower body (hollow: its benches inside, render/cable-riders.ts) under a dark belt rail, tall
 *    ARCH-TOPPED windows in wood frames down each side, the bulkhead with its door and windows to the grip section;
 *  - the open back platform with its railing; the arched roof over all, its eaves boards and the ROUTE BOARDS along
 *    them, the clerestory along the crown over the saloon with its little windows; the number roundels on the sides.
 *
 * Panels in [1,1,1] take the line's livery; the rest is fixed colour.
 */
function cableCar(out: MeshBuilder): void {
  const floor = 0.78
  const front = 4.1
  const split = 0.6                      // where the open section meets the saloon
  const back = -3.7
  const half = 1.2
  const roofY = 2.95
  const WOODD: Rgb = [0.36, 0.22, 0.13], BELT: Rgb = [0.32, 0.12, 0.1], POLE: Rgb = [0.92, 0.92, 0.88], GOLD: Rgb = [0.82, 0.68, 0.32]
  // the running gear, dark under the floor, and the floor itself
  box(out, 0, 0.4, 0.2, 0.85, 0.25, 3.4, DARK, FIXED)
  box(out, 0, floor - 0.06, 0.2, half, 0.08, 3.9, WOOD, FIXED)
  // the skirts below the floor's edge, in the livery, the length of the car
  for (const s of [-1, 1]) box(out, s * (half - 0.01), floor - 0.2, 0.2, 0.02, 0.14, 3.85, [1, 1, 1])
  // the running boards the length of the open section, on their brackets
  for (const s of [-1, 1]) {
    box(out, s * (half + 0.18), floor - 0.25, (front + split) / 2, 0.2, 0.035, (front - split) / 2, WOOD, FIXED)
    for (const z of [split + 0.3, (front + split) / 2, front - 0.3]) box(out, s * (half + 0.08), floor - 0.18, z, 0.1, 0.05, 0.04, DARK, FIXED)
  }
  // ---- the grip section
  // the dash at the front: cream, its gold-lined number board, the headlamp, the destination board over it
  box(out, 0, floor + 0.55, front - 0.05, half, 0.55, 0.06, CREAM, FIXED)
  // (each layer a couple of centimetres proud of the one under it: the lower dash's face sat ON the dash's, and the
  // destination board's on its backing — z-fighting across the front, owner 2026-10-16, BUGS.md #299)
  box(out, 0, floor + 0.2, front, half, 0.2, 0.02, [1, 1, 1])                                 // the lower dash: the livery
  box(out, 0, floor + 0.98, front + 0.035, 0.22, 0.1, 0.01, GOLD, FIXED)
  box(out, 0, floor + 0.98, front + 0.055, 0.18, 0.07, 0.01, DARK, FIXED)                     // the number
  discZ(out, 0, floor + 0.62, front + 0.03, 0.17, BRASS, FIXED)
  discZ(out, 0, floor + 0.62, front + 0.04, 0.13, LAMP, EMIT)                                 // the headlamp
  box(out, -0.62, floor + 0.7, front + 0.035, 0.3, 0.18, 0.01, [0.45, 0.22, 0.18], FIXED)      // the ad panels either side
  box(out, 0.62, floor + 0.7, front + 0.035, 0.3, 0.18, 0.01, [0.2, 0.45, 0.35], FIXED)
  box(out, 0, roofY - 0.2, front + 0.12, 0.85, 0.13, 0.02, DARK, FIXED)                       // the destination board
  box(out, 0, roofY - 0.2, front + 0.155, 0.7, 0.07, 0.01, [0.95, 0.9, 0.7], FIXED)
  // the benches: outward-facing seats back to back, the backrest between, the end arm posts
  const gz = (front + split) / 2, gl = (front - split) / 2 - 0.25
  box(out, 0, floor + 0.62, gz, 0.07, 0.42, gl, WOODD, FIXED)                                 // the backrest
  for (const s of [-1, 1]) {
    box(out, s * 0.42, floor + 0.43, gz, 0.33, 0.04, gl, WOOD, FIXED)                          // the seat
    box(out, s * 0.62, floor + 0.2, gz, 0.12, 0.2, gl - 0.05, WOODD, FIXED)                    // its front
    for (const z of [gz - gl, gz + gl]) box(out, s * 0.4, floor + 0.62, z, 0.36, 0.2, 0.03, WOODD, FIXED)
  }
  // the grab poles at the corners and the middle of the open sides, and the rail over the running boards
  for (const z of [front - 0.15, gz, split + 0.15]) {
    for (const s of [-1, 1]) {
      box(out, s * (half - 0.04), (floor + roofY) / 2, z, 0.035, (roofY - floor) / 2, 0.035, POLE, FIXED)
      box(out, s * (half - 0.04), floor + 1.1, z, 0.045, 0.05, 0.045, BRASS, FIXED)
    }
  }
  for (const s of [-1, 1]) box(out, s * (half - 0.04), roofY - 0.35, gz, 0.025, 0.025, gl + 0.25, BRASS, FIXED)
  // the grip lever standing up in the middle of the floor, the brake handles beside it
  box(out, 0.15, floor + 0.7, front - 0.8, 0.04, 0.7, 0.04, BRASS, FIXED)
  box(out, 0.15, floor + 1.42, front - 0.8, 0.08, 0.04, 0.04, DARK, FIXED)
  for (const s of [-1, 1]) box(out, s * 0.45, floor + 0.55, front - 0.55, 0.03, 0.55, 0.03, DARK, FIXED)
  // ---- the saloon
  saloonShell(out, floor, half, back + 0.6, split)
  for (const s of [-1, 1]) {
    // the belt rail at the sill, the posts between the windows, the arched windows, the frieze over them
    box(out, s * half, floor + 0.93, (split + back + 0.6) / 2, 0.035, 0.05, (split - back - 0.6) / 2, BELT, FIXED)
    const z0 = back + 0.6, z1 = split, n = 5, pitch = (z1 - z0) / n
    for (let k = 0; k <= n; k++) box(out, s * half, (floor + 0.98 + roofY - 0.1) / 2, z0 + k * pitch, 0.04, (roofY - 0.1 - floor - 0.98) / 2, 0.06, CREAM, FIXED)
    for (let k = 0; k < n; k++) archWindow(out, s * half, z0 + (k + 0.5) * pitch, floor + 1.0, 0.95, pitch - 0.16, WOODD)
    box(out, s * half, roofY - 0.22, (z0 + z1) / 2, 0.03, 0.12, (z1 - z0) / 2, CREAM, FIXED)
    // the number roundel on the panel
    for (const z of [-1.6]) {
      const x = s * (half + 0.01)
      for (let k = 0; k < 12; k++) {
        const a0 = (k / 12) * Math.PI * 2, a1 = ((k + 1) / 12) * Math.PI * 2
        const p = (a: number, r: number): [number, number, number] => [x, floor + 0.5 + Math.sin(a) * r, z + Math.cos(a) * r]
        const pts: [number, number, number][] = [[x, floor + 0.5, z], p(a0, 0.2), p(a1, 0.2), p(a1, 0.2)]
        out.quad(s > 0 ? pts : [pts[0], pts[2], pts[1], pts[1]], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], GOLD, FIXED)
      }
    }
  }
  // the bulkhead between the sections: cream, its door and the windows either side
  box(out, 0, (floor + roofY) / 2, split, half, (roofY - floor) / 2, 0.05, CREAM, FIXED)
  box(out, 0, floor + 0.95, split + 0.06, 0.32, 0.95, 0.01, WOODD, FIXED)
  box(out, 0, floor + 1.45, split + 0.07, 0.24, 0.35, 0.01, GLASS, FIXED)
  for (const s of [-1, 1]) box(out, s * 0.75, floor + 1.45, split + 0.06, 0.28, 0.38, 0.01, GLASS, FIXED)
  // ---- the back: the saloon's end wall, the open platform behind it with its railing
  box(out, 0, (floor + roofY) / 2, back + 0.6, half, (roofY - floor) / 2, 0.05, CREAM, FIXED)
  box(out, 0, floor + 1.45, back + 0.54, 0.75, 0.38, 0.01, GLASS, FIXED)
  box(out, 0, floor + 0.95, back + 0.02, half, 0.04, 0.03, BRASS, FIXED)
  for (const x of [-half + 0.05, -0.4, 0.4, half - 0.05]) box(out, x, floor + 0.48, back + 0.02, 0.025, 0.48, 0.025, BRASS, FIXED)
  for (const s of [-1, 1]) box(out, s * (half - 0.04), (floor + roofY) / 2, back + 0.05, 0.035, (roofY - floor) / 2, 0.035, POLE, FIXED)
  // ---- the roof: an arch the length of the car, the eaves boards and the route boards on them, the clerestory
  archedRoof(out, back - 0.25, front + 0.3, half + 0.14, roofY - 0.04, 0.34, 0.75, WOOD)
  for (const s of [-1, 1]) {
    box(out, s * (half + 0.16), roofY - 0.1, (back + front) / 2, 0.02, 0.1, (front - back) / 2, [1, 1, 1])
    box(out, s * (half + 0.18), roofY - 0.1, (back + front) / 2 - 0.5, 0.01, 0.06, 2.0, [0.95, 0.9, 0.7], FIXED)   // the route board
  }
  box(out, 0, roofY + 0.42, -1.2, 0.5, 0.12, 2.0, [0.62, 0.12, 0.1], FIXED)
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) box(out, s * 0.51, roofY + 0.42, -2.8 + k * 0.8, 0.01, 0.07, 0.25, GLASS, FIXED)
  archedRoof(out, -3.2, 0.8, 0.56, roofY + 0.54, 0.1, 0.3, WOOD)
  prism(out, 0, front - 0.25, roofY + 0.18, roofY + 0.36, 0.13, 10, LAMP, EMIT)
  cableTrucks(out, [front - 1.3, back + 1.2])
  // (the riders are real avatar-kit bodies placed on the car each frame: render/cable-riders.ts, from CABLE_SEATS)
}

/**
 * WHERE PEOPLE RIDE a cable car, in the car's own frame (x across, + to the right of the way it faces; z along, + to the
 * front; y up in the model's frame): standing on the running boards facing out, holding the poles; sitting on the outward
 * benches of the open grip section, facing out; sitting along the saloon's sides, facing in. `yaw` is the way the
 * body faces, relative to the car. Read by render/cable-riders.ts (owner, 2026-10-16: "the other passengers in the
 * cable cars should get real avatars too"). `PLAYER_SPOT` is where a rider who boards stands — inside the open
 * section, on the right, clear of the seated passengers there (none are seated on that side).
 */
export interface CableSeat { x: number; y: number; z: number; yaw: number; standing: boolean }
// (the model's own heights: the car is placed 0.25 m over the rail, render/life.ts)
const FLOOR = 0.78
const BOARD = 0.78 - 0.21
const powellSeats = (): CableSeat[] => {
  const out: CableSeat[] = []
  for (const sd of [-1, 1]) {
    for (const z of [3.5, 2.75, 1.1]) out.push({ x: sd * 1.42, y: BOARD, z, yaw: sd * Math.PI / 2, standing: true })
    if (sd < 0) for (const z of [2.9, 1.8]) out.push({ x: sd * 0.62, y: FLOOR, z, yaw: sd * Math.PI / 2, standing: false })
    for (const z of [-2.5, -1.3]) out.push({ x: sd * 0.7, y: FLOOR, z, yaw: -sd * Math.PI / 2, standing: false })
  }
  return out
}
const californiaSeats = (): CableSeat[] => {
  const out: CableSeat[] = []
  for (const e of [-1, 1]) for (const sd of [-1, 1]) {
    for (const z of [4.0, 2.3]) out.push({ x: sd * 1.44, y: BOARD, z: e * z, yaw: sd * Math.PI / 2, standing: true })
    if (!(e > 0 && sd > 0)) out.push({ x: sd * 0.62, y: FLOOR, z: e * 3.15, yaw: sd * Math.PI / 2, standing: false })
  }
  for (const sd of [-1, 1]) for (const z of [-0.8, 0.8]) out.push({ x: sd * 0.7, y: FLOOR, z, yaw: -sd * Math.PI / 2, standing: false })
  return out
}
export const CABLE_SEATS = { powell: powellSeats(), california: californiaSeats() }
/** where a boarding rider stands, by car (`ahead`, `side` for Life.carPoint) */
export const PLAYER_SPOT = { powell: { ahead: 2.35, side: 0.92 }, california: { ahead: 3.15, side: 0.92 } }

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
    }
    box(out, 0, floor + 0.45, e * (end + inner) / 2, 0.12, 0.45, (end - inner) / 2 - 0.15, WOOD, FIXED)
    box(out, 0.15, floor + 0.7, e * (end - 0.8), 0.04, 0.7, 0.04, BRASS, FIXED)
    box(out, 0, floor + 1.35, e * inner, half, 0.55, 0.05, CREAM, FIXED)
    box(out, 0, floor + 1.4, e * (inner + 0.01), 0.9, 0.36, 0.02, GLASS, FIXED)
  }
  // the saloon between the two open ends
  saloonShell(out, floor, half, -inner, inner)
  for (const s of [-1, 1]) {
    box(out, s * half, floor + 0.93, 0, 0.035, 0.05, inner, [0.32, 0.12, 0.1], FIXED)               // the belt rail
    const pitch = (2 * inner) / 4
    for (let w = 0; w <= 4; w++) box(out, s * half, (floor + 0.98 + roofY - 0.1) / 2, -inner + w * pitch, 0.04, (roofY - 0.1 - floor - 0.98) / 2, 0.06, CREAM, FIXED)
    for (let w = 0; w < 4; w++) archWindow(out, s * half, -inner + (w + 0.5) * pitch, floor + 1.0, 0.95, pitch - 0.16, [0.36, 0.22, 0.13])
    box(out, s * half, roofY - 0.22, 0, 0.03, 0.12, inner, CREAM, FIXED)
  }
  // the roof, the clerestory, the lamps at both ends, the route boards
  archedRoof(out, -end - 0.25, end + 0.25, half + 0.14, roofY - 0.04, 0.34, 0.75, WOOD)
  box(out, 0, roofY + 0.42, 0, 0.5, 0.12, inner + 0.2, [0.62, 0.12, 0.1], FIXED)
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) box(out, s * 0.51, roofY + 0.42, -inner + 0.4 + k * ((2 * inner - 0.8) / 3), 0.01, 0.07, 0.22, GLASS, FIXED)
  archedRoof(out, -inner - 0.3, inner + 0.3, 0.56, roofY + 0.54, 0.1, 0.3, WOOD)
  for (const e of [-1, 1]) prism(out, 0, e * (end - 0.25), roofY + 0.18, roofY + 0.36, 0.13, 10, LAMP, EMIT)
  cableTrucks(out, [end - 1.3, -end + 1.3])
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
/*
 * LOFTED BODIES. A streetcar or a train is a tube with rounded ends, its sides a little tumbled in, its windscreen
 * raked back, its roof domed down over the ends; boxes stacked into a nose read as a staircase (the PCC's did). So
 * the body is drawn as horizontal BANDS round a PLAN — the car's outline seen from above — each band joining the
 * plan at its foot to the (slightly smaller, slightly shorter) plan at its head; a band's paint can change along
 * the outline, so the windows, doors, posts and windscreen are its colours, not boxes stuck on.
 */
type Pt = [number, number]
type Paint = Rgb | ((x: number, y: number, z: number) => Rgb | [Rgb, number])

const spow = (v: number, p: number): number => Math.sign(v) * Math.abs(v) ** p

/**
 * A car's PLAN, closed, anticlockwise from above: straight sides `half` out from the centreline, a superellipse end
 * (exponent `e`: 2 a half-ellipse, higher squarer) `noseB` long reaching `zB` at the back and `noseF` reaching `zF`
 * at the front. `breaks` are extra points along the sides — the window and door edges a band's paint changes at.
 * Plans meant to be joined by a band must keep the ends' inner edges (zF − noseF, zB + noseB) and the breaks.
 */
function plan(zB: number, zF: number, half: number, noseB: number, noseF: number, e: number, breaks: number[] = [], n = 12): Pt[] {
  const cF = zF - noseF
  const cB = zB + noseB
  const side = [...new Set(breaks)].filter((z) => z > cB + 1e-3 && z < cF - 1e-3).sort((a, b) => a - b)
  const out: Pt[] = [[half, cB]]
  for (const z of side) out.push([half, z])
  for (let i = 0; i <= n; i++) {
    const t = (Math.PI * i) / n
    out.push([half * spow(Math.cos(t), 2 / e), cF + noseF * spow(Math.sin(t), 2 / e)])
  }
  for (const z of side.slice().reverse()) out.push([-half, z])
  for (let i = 0; i <= n; i++) {
    const t = Math.PI + (Math.PI * i) / n
    out.push([half * spow(Math.cos(t), 2 / e), cB + noseB * spow(Math.sin(t), 2 / e)])
  }
  return out
}

/** where a plan's front end is, `x` across: the superellipse's z */
function tipAt(x: number, zF: number, half: number, noseF: number, e: number): number {
  return zF - noseF + noseF * Math.pow(Math.max(0, 1 - Math.abs(x / half) ** e), 1 / e)
}

/** One band of a lofted body: plan `a` at height `ya` up to plan `b` at `yb` (the same number of points). */
function band(out: MeshBuilder, a: Pt[], ya: number, b: Pt[], yb: number, paint: Paint, tag = FIXED): void {
  if (a.length !== b.length) throw new Error(`band: plans of ${a.length} and ${b.length} points`)
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let i = 0; i + 1 < a.length; i++) {
    const [p0, p1, q0, q1] = [a[i], a[i + 1], b[i], b[i + 1]]
    if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 1e-4 && Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) < 1e-4) continue
    const P: [number, number, number][] = [[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [q1[0], yb, q1[1]], [q0[0], yb, q0[1]]]
    // the normal from the diagonals (sound when one edge has shrunk to a point), turned outward
    const d1 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]]
    const d2 = [P[3][0] - P[1][0], P[3][1] - P[1][1], P[3][2] - P[1][2]]
    let n: [number, number, number] = [d1[1] * d2[2] - d1[2] * d2[1], d1[2] * d2[0] - d1[0] * d2[2], d1[0] * d2[1] - d1[1] * d2[0]]
    const l = Math.hypot(...n) || 1
    n = [n[0] / l, n[1] / l, n[2] / l]
    const mx = (P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4
    const mz = (P[0][2] + P[1][2] + P[2][2] + P[3][2]) / 4
    const out_ = n[0] * mx + n[2] * mz
    if (out_ < -1e-4 || (Math.abs(out_) <= 1e-4 && n[1] < 0)) n = [-n[0], -n[1], -n[2]]
    let colour: Rgb
    let t = tag
    if (typeof paint === 'function') {
      const r = paint(mx, (ya + yb) / 2, mz)
      if (Array.isArray(r[0])) { colour = r[0] as Rgb; t = r[1] as number } else colour = r as Rgb
    } else colour = paint
    out.quad(P, n, UV, colour, t)
  }
}

/** a plan's flat cap at `y`, facing up or down: a fan from the centreline */
function cap(out: MeshBuilder, a: Pt[], y: number, up: boolean, colour: Rgb, tag = FIXED): void {
  let cz = 0
  for (const p of a) cz += p[1]
  cz /= a.length
  for (let i = 0; i + 1 < a.length; i++) {
    const c: [number, number, number] = [0, y, cz]
    const p: [number, number, number] = [a[i][0], y, a[i][1]]
    const q: [number, number, number] = [a[i + 1][0], y, a[i + 1][1]]
    out.quad([c, p, q, q], [0, up ? 1 : -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  }
}

/** a stack of bands: [height, plan] from the bottom up, each band painted by `paint(x, y, z)` */
function loft(out: MeshBuilder, stack: [number, Pt[]][], paint: Paint): void {
  for (let i = 0; i + 1 < stack.length; i++) band(out, stack[i][1], stack[i][0], stack[i + 1][1], stack[i + 1][0], paint)
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

const DOOR: Rgb = [0.2, 0.22, 0.24]
const SIGN: [Rgb, number] = [[0.98, 0.94, 0.8], EMIT]

/**
 * A PCC streetcar (1946–52), the F-line's workhorse: 14.2 m. From the photographs (car 1077 in Birmingham's
 * green, orange and cream; 1050, 1058, 1010):
 * - rounded at both ends in plan, the sides tumbled in a little to the skirt, the front's three windscreen panes
 *   leaning back, the destination board over them; the roof domed down over both ends;
 * - the long window band with the small standee windows above it; the belt rail; the skirt over the trucks;
 * - folding doors at the front and the middle on the right; the headlamp low on the nose, the anti-climber under it;
 * - the roof with its ventilator hatch, the trolley pole trailing back to the wire, and its retriever.
 */
function pcc(liv: Livery): (out: MeshBuilder) => void {
  return (out) => {
    const L = 7.1
    const W = 1.32
    const NOSE = 1.55
    const E = 2.4
    const F = FIXED
    const bay = (k: number): number => -L + 1.75 + k * 1.52
    const breaks: number[] = []
    for (let k = 0; k < 8; k++) breaks.push(bay(k) - 0.6, bay(k) + 0.6)
    // `rake` pulls both ends in (the windscreen leaning back, the roof domed over the ends), keeping their inner edges
    const P = (half: number, rake = 0): Pt[] => plan(-L + rake, L - rake, half, NOSE - rake, NOSE - rake, E, breaks)
    const inBay = (z: number): number => {
      for (let k = 0; k < 8; k++) if (Math.abs(z - bay(k)) < 0.6) return k
      return -1
    }
    const end = (z: number): boolean => Math.abs(z) > L - NOSE + 0.02
    const door = (x: number, z: number): boolean => x > 0 && !end(z) && (inBay(z) === 7 || inBay(z) === 3)
    const body = (c: Rgb) => (x: number, _y: number, z: number): Rgb => door(x, z) ? DOOR : c
    loft(out, [[0.42, P(W - 0.1)], [0.82, P(W)], [1.42, P(W)]], body(liv.lower))
    loft(out, [[1.42, P(W)], [1.58, P(W)]], body(liv.belt))
    loft(out, [[1.58, P(W)], [1.74, P(W)]], body(liv.upper))
    // the window band: the side windows, and round the ends the windscreen in three panes between two posts
    loft(out, [[1.74, P(W)], [2.4, P(W - 0.05, 0.16)]], (x, _y, z) =>
      end(z) ? (Math.abs(Math.abs(x) - 0.48) < 0.05 ? liv.upper : GLASS) : inBay(z) >= 0 ? GLASS : liv.upper)
    // over it: the standee windows along the sides, the destination board lit over the windscreen
    loft(out, [[2.4, P(W - 0.05, 0.16)], [2.46, P(W - 0.055, 0.18)]], liv.upper)
    loft(out, [[2.46, P(W - 0.055, 0.18)], [2.58, P(W - 0.065, 0.2)]], (x, _y, z) =>
      end(z) ? (Math.abs(x) < 0.42 ? SIGN : liv.upper) : inBay(z) >= 0 && !door(x, z) ? GLASS : liv.upper)
    loft(out, [[2.58, P(W - 0.065, 0.2)], [2.66, P(W - 0.07, 0.22)]], liv.upper)
    // the roof, domed across and down over the ends
    const top = P(W - 0.8, 0.9)
    loft(out, [[2.66, P(W - 0.07, 0.22)], [2.74, P(W - 0.3, 0.4)], [2.82, P(W - 0.55, 0.62)], [2.87, top]], liv.roof)
    cap(out, top, 2.87, true, liv.roof)
    cap(out, P(W - 0.1), 0.42, false, DARK)
    for (const e of [-1, 1]) {
      box(out, 0, 1.0, e * (L - 0.01), 0.13, 0.13, 0.03, e > 0 ? LAMP : [0.9, 0.12, 0.08], EMIT)   // the headlamp, the tail lamp
      box(out, 0, 0.62, e * (L + 0.04), 0.62, 0.06, 0.08, [0.55, 0.56, 0.58], F)                 // the anti-climber
    }
    // the ventilator hatch, the trolley pole up from its base trailing back to the wire, its wheel; the retriever
    box(out, 0, 2.92, -1.8, 0.45, 0.07, 1.4, liv.roof, F)
    box(out, 0, 2.94, -L + 1.6, 0.2, 0.08, 0.28, DARK, F)
    strut(out, [0, 3.0, -L + 1.6], [0, 5.55, -L - 5.6], 0.05, 0.05, DARK, F)
    box(out, 0, 5.6, -L - 5.6, 0.03, 0.08, 0.08, [0.4, 0.4, 0.42], F)
    box(out, 0, 1.3, -L - 0.08, 0.14, 0.14, 0.08, DARK, F)
    // the trucks, mostly under the skirt
    for (const e of [-1, 1]) {
      box(out, 0, 0.35, e * (L - 2.3), 1.0, 0.18, 1.1, DARK, F)
      for (const w of [-0.9, 0.9]) for (const x of [-0.72, 0.72]) wheel(out, x, 0.33, e * (L - 2.3) + w, 0.33, 0.06, [0.18, 0.18, 0.19])
    }
  }
}

/**
 * A Milan Peter Witt tram (the "Ventotto", 1928), the F-line's other workhorse: 14 m, its ends gently bowed and its
 * corners rounded, orange with a cream line under the windows, the windows in pairs of posts with transom lights
 * over them, the dark arched roof with its monitor along the crown, the trolley pole up; the trucks in plain view.
 */
function peterWitt(out: MeshBuilder): void {
  const L = 6.9
  const W = 1.2
  const NOSE = 0.42
  const E = 2.2
  const F = FIXED
  const ORANGE: Rgb = [0.9, 0.5, 0.12]
  const ROOF: Rgb = [0.36, 0.26, 0.2]
  const bay = (k: number): number => -L + 0.95 + k * 1.2
  const breaks: number[] = []
  for (let k = 0; k < 11; k++) breaks.push(bay(k) - 0.5, bay(k) + 0.5)
  const P = (half: number, rake = 0): Pt[] => plan(-L + rake, L - rake, half, NOSE - rake, NOSE - rake, E, breaks)
  const inBay = (z: number): boolean => {
    for (let k = 0; k < 11; k++) if (Math.abs(z - bay(k)) < 0.5) return true
    return false
  }
  const end = (z: number): boolean => Math.abs(z) > L - NOSE + 0.02
  // the centre doors on the right: the middle bay
  const door = (x: number, z: number): boolean => x > 0 && Math.abs(z - bay(5)) < 0.5
  loft(out, [[0.66, P(W - 0.05)], [1.0, P(W)], [1.8, P(W)]], (x, _y, z) => door(x, z) ? DOOR : ORANGE)
  loft(out, [[1.8, P(W)], [1.88, P(W)]], (x, _y, z) => door(x, z) ? DOOR : CREAM)
  // the windows; at each end three, between two posts
  const win = (x: number, z: number): Rgb => end(z) ? (Math.abs(Math.abs(x) - 0.42) < 0.06 ? ORANGE : GLASS) : inBay(z) ? GLASS : ORANGE
  loft(out, [[1.88, P(W)], [2.5, P(W)]], (x, _y, z) => win(x, z))
  loft(out, [[2.5, P(W)], [2.56, P(W)]], ORANGE)
  loft(out, [[2.56, P(W)], [2.68, P(W)]], (x, _y, z) => end(z) ? (Math.abs(x) < 0.45 ? SIGN : ORANGE) : inBay(z) ? GLASS : ORANGE)
  loft(out, [[2.68, P(W)], [2.72, P(W)]], ORANGE)
  // the roof: its eaves standing out a little, arched across, down over the ends
  const top = P(W - 0.55, 0.25)
  loft(out, [[2.72, P(W + 0.05)], [2.77, P(W + 0.05)], [2.86, P(W - 0.25, 0.12)], [2.92, top]], ROOF)
  cap(out, top, 2.92, true, ROOF)
  cap(out, P(W - 0.05), 0.66, false, DARK)
  // the monitor along the crown, its little windows
  box(out, 0, 3.02, 0, 0.5, 0.1, L - 1.0, ROOF, F)
  for (const s of [-1, 1]) for (let k = 0; k < 8; k++) box(out, s * 0.505, 3.02, -L + 1.6 + k * 1.53, 0.01, 0.05, 0.4, GLASS, F)
  for (const e of [-1, 1]) {
    box(out, 0, 1.35, e * (tipAt(0, L, W, NOSE, E) - 0.01), 0.16, 0.16, 0.03, e > 0 ? LAMP : [0.9, 0.12, 0.08], EMIT)
    box(out, 0, 0.74, e * (L + 0.06), 0.72, 0.07, 0.08, DARK, F)
  }
  strut(out, [0, 3.1, -L + 2.4], [0, 5.55, -L - 4.6], 0.05, 0.05, DARK, F)
  // the trucks, open to view
  for (const e of [-1, 1]) {
    box(out, 0, 0.45, e * (L - 2), 0.95, 0.2, 1.0, DARK, F)
    for (const w of [-0.8, 0.8]) for (const x of [-0.7, 0.7]) wheel(out, x, 0.38, e * (L - 2) + w, 0.36, 0.06, [0.18, 0.18, 0.19])
  }
}

/**
 * A Muni Metro light-rail car (Siemens S200SF, "LRV4", from 2017): 23 m, articulated in the middle, silver with
 * the red band low along it, the dark window band right round, the cab's big windscreen raked back under the lit
 * destination sign; four doors a side; the roof's equipment pods and the single-arm pantograph up to the wire.
 * Double-ended: its headlamps lead, its tail lamps show at the other end, so two coupled read as a train.
 */
function muniLRV(out: MeshBuilder): void {
  const L = 11.5
  const W = 1.33
  const NOSE = 1.0
  const E = 3.2
  const F = FIXED
  const SILVER: Rgb = [0.84, 0.85, 0.87]
  const RED: Rgb = [0.78, 0.12, 0.14]
  const BAND: Rgb = [0.1, 0.11, 0.12]
  const DOORS = [-8.2, -3.0, 3.0, 8.2]
  const breaks: number[] = [-0.25, 0.25]
  for (const z of DOORS) breaks.push(z - 0.68, z + 0.68)
  for (let k = 0; k < 18; k++) breaks.push(-L + 1.5 + k * 1.18)
  const P = (half: number, rake = 0): Pt[] => plan(-L + rake, L - rake, half, NOSE - rake, NOSE - rake, E, breaks)
  const door = (z: number): boolean => DOORS.some((d) => Math.abs(z - d) < 0.68)
  const end = (z: number): boolean => Math.abs(z) > L - NOSE + 0.02
  const joint = (z: number): boolean => Math.abs(z) < 0.25
  const paint = (c: Rgb) => (_x: number, _y: number, z: number): Rgb => joint(z) ? BAND : door(z) ? [0.62, 0.64, 0.67] : c
  loft(out, [[0.4, P(W - 0.08)], [0.72, P(W)]], (_x, _y, z) => joint(z) ? BAND : [0.32, 0.33, 0.35])
  loft(out, [[0.72, P(W)], [0.95, P(W)]], paint(RED))
  loft(out, [[0.95, P(W)], [1.42, P(W)]], paint(SILVER))
  // the window band, dark right round: the windows in it, the doors' glass, and the cab's windscreen raked back
  loft(out, [[1.42, P(W)], [2.42, P(W - 0.05, 0.62)]], (x, _y, z) =>
    joint(z) ? BAND : end(z) ? (Math.abs(x) < W - 0.12 ? GLASS : BAND) : door(z) ? GLASS : GLASS)
  loft(out, [[2.42, P(W - 0.05, 0.62)], [2.6, P(W - 0.06, 0.66)]], (x, _y, z) =>
    joint(z) ? BAND : end(z) ? (Math.abs(x) < 0.55 ? [[1, 0.62, 0.18], EMIT] : BAND) : SILVER)
  const top = P(W - 0.75, 0.9)
  loft(out, [[2.6, P(W - 0.06, 0.66)], [2.78, P(W - 0.1, 0.7)], [2.9, P(W - 0.4, 0.8)], [2.96, top]], paint(SILVER))
  cap(out, top, 2.96, true, SILVER)
  cap(out, P(W - 0.08), 0.4, false, DARK)
  // the window posts: the band's glass split into panes
  for (const s of [-1, 1]) for (let k = 0; k < 18; k++) {
    const z = -L + 1.5 + k * 1.18
    if (!door(z) && !joint(z) && !end(z)) box(out, s * (W - 0.01), 1.92, z, 0.02, 0.48, 0.04, BAND, F)
  }
  for (const e of [-1, 1]) {
    const lamp: Rgb = e > 0 ? LAMP : [0.9, 0.12, 0.08]
    for (const x of [-0.85, 0.85]) box(out, x, 1.12, e * (tipAt(x, L, W, NOSE, E) - 0.01), 0.14, 0.07, 0.03, lamp, EMIT)
    box(out, 0, 0.75, e * (L + 0.1), 0.2, 0.12, 0.14, DARK, F)                              // the coupler
  }
  // the roof's equipment pods, and the pantograph: a single arm up from its base, its knee forward, the head bar
  // across under the wire
  for (const z of [-6.5, 6.5]) box(out, 0, 3.06, z, 0.72, 0.1, 2.2, [0.7, 0.71, 0.73], F)
  box(out, 0, 3.02, 2.6, 0.5, 0.06, 0.6, DARK, F)
  strut(out, [0, 3.08, 2.3], [0, 4.35, 4.0], 0.06, 0.06, DARK, F)
  strut(out, [0, 4.35, 4.0], [0, 5.48, 2.6], 0.04, 0.04, DARK, F)
  box(out, 0, 5.5, 2.6, 0.8, 0.03, 0.06, DARK, F)
  // the trucks under the skirt: one under each cab, one under the joint
  for (const z of [-L + 2.6, 0, L - 2.6]) {
    box(out, 0, 0.36, z, 0.95, 0.16, 1.1, DARK, F)
    for (const w of [-0.85, 0.85]) for (const x of [-0.72, 0.72]) wheel(out, x, 0.33, z + w, 0.33, 0.06, [0.18, 0.18, 0.19])
  }
}

/**
 * Caltrain (from 2024): Stadler KISS electric trains, double-deck, white with a red stripe low along them, the
 * upper and lower decks' windows in long dark bands, the doors red. The middle cars square-ended at their gangways;
 * the cab car's nose long and raked, red, its windscreen wide. 26 m a car.
 */
const CT_WHITE: Rgb = [0.9, 0.91, 0.92]
const CT_RED: Rgb = [0.74, 0.1, 0.13]
const CT_GREY: Rgb = [0.36, 0.37, 0.4]

function kiss(cab: boolean): (out: MeshBuilder) => void {
  return (out) => {
    const L = 13
    const W = 1.42
    const NOSE_F = cab ? 3.2 : 0.3
    const NOSE_B = 0.3
    const F = FIXED
    const DOORS = [-9.6, 9.6]
    const breaks: number[] = []
    for (const z of DOORS) breaks.push(z - 0.7, z + 0.7)
    for (let k = 0; k < 9; k++) breaks.push(-7.4 + k * 1.85 - 0.75, -7.4 + k * 1.85 + 0.75)
    const P = (half: number, rakeF = 0, rakeB = 0): Pt[] => plan(-L + rakeB, L - rakeF, half, NOSE_B - rakeB, NOSE_F - rakeF, cab ? 2.4 : 4, breaks)
    const door = (z: number): boolean => DOORS.some((d) => Math.abs(z - d) < 0.7)
    const deck = (z: number): boolean => Math.abs(z) < 8.2 && !door(z) && ((z + 7.4 + 0.925) % 1.85 + 1.85) % 1.85 < 1.5
    const nose = (z: number): boolean => cab && z > L - NOSE_F + 0.02
    const ends = (z: number): boolean => Math.abs(z) > 10.4
    // the nose slopes back as it rises: at each height, how far its tip has come in
    const r = (k: number): number => cab ? k : 0
    const rb = (k: number): number => Math.min(k, 0.25)
    loft(out, [[0.45, P(W - 0.1)], [0.9, P(W)]], (_x, _y, z) => nose(z) ? CT_RED : CT_GREY)
    loft(out, [[0.9, P(W)], [1.2, P(W)]], (_x, _y, z) => door(z) || nose(z) ? CT_RED : CT_RED)
    loft(out, [[1.2, P(W)], [1.35, P(W)]], (_x, _y, z) => door(z) || nose(z) ? CT_RED : CT_WHITE)
    // the lower deck's windows (the low floor between the trucks; over them, the ends' mid-level windows)
    loft(out, [[1.35, P(W)], [2.2, P(W, r(0.15))]], (_x, _y, z) =>
      nose(z) ? CT_RED : door(z) ? GLASS : deck(z) ? GLASS : CT_WHITE)
    loft(out, [[2.2, P(W, r(0.15))], [2.6, P(W - 0.02, r(0.35))]], (_x, _y, z) =>
      nose(z) ? CT_RED : door(z) ? CT_RED : ends(z) ? GLASS : CT_WHITE)
    // the upper deck's windows; on the cab, the windscreen wrapping round the raked nose
    loft(out, [[2.6, P(W - 0.02, r(0.35))], [3.55, P(W - 0.1, r(1.5), rb(0.1))]], (x, _y, z) =>
      nose(z) ? (Math.abs(x) < W - 0.25 ? GLASS : CT_RED) : deck(z) ? GLASS : ends(z) ? CT_WHITE : CT_WHITE)
    loft(out, [[3.55, P(W - 0.1, r(1.5), rb(0.1))], [3.85, P(W - 0.18, r(2.2), rb(0.15))]], (x, _y, z) =>
      nose(z) ? (Math.abs(x) < 0.5 ? [[1, 0.62, 0.18], EMIT] as [Rgb, number] : CT_RED) : CT_WHITE)
    const top = P(W - 0.8, r(2.85), rb(0.25))
    loft(out, [[3.85, P(W - 0.18, r(2.2), rb(0.15))], [4.1, P(W - 0.42, r(2.6), rb(0.2))], [4.25, top]], CT_WHITE)
    cap(out, top, 4.25, true, CT_WHITE)
    cap(out, P(W - 0.1), 0.45, false, DARK)
    if (cab) {
      for (const x of [-0.9, 0.9]) box(out, x, 1.05, tipAt(x, L, W, NOSE_F, 2.4) - 0.01, 0.16, 0.08, 0.03, LAMP, EMIT)
      box(out, 0, 0.6, L + 0.05, 0.6, 0.1, 0.1, DARK, F)
      // the pantograph, on the cab car's roof
      box(out, 0, 4.3, 3.0, 0.5, 0.05, 0.6, DARK, F)
      strut(out, [0, 4.35, 2.7], [0, 5.1, 4.2], 0.06, 0.06, DARK, F)
      strut(out, [0, 5.1, 4.2], [0, 5.85, 3.0], 0.04, 0.04, DARK, F)
      box(out, 0, 5.87, 3.0, 0.8, 0.03, 0.06, DARK, F)
    }
    // the gangway bellows at the square ends
    for (const e of cab ? [-1] : [-1, 1]) box(out, 0, 2.4, e * (L + 0.05), 0.75, 1.3, 0.08, DARK, F)
    for (const z of [-L + 2.4, L - 2.4]) {
      box(out, 0, 0.4, z, 1.0, 0.16, 1.2, DARK, F)
      for (const w of [-0.95, 0.95]) for (const x of [-0.72, 0.72]) wheel(out, x, 0.42, z + w, 0.42, 0.06, [0.18, 0.18, 0.19])
    }
  }
}

/**
 * SALESFORCE PARK'S GONDOLA (the "STC Aerial Tram", OSM way/573719373; docs/SALESFORCE-PARK.md): one glass cabin on
 * an inclined track from Salesforce Plaza at Mission and Fremont up to the park, 21 m. Glazed all round in a slim
 * white frame, the floor kept level on its carriage whatever the slope. Boarded like a cable car (the owner,
 * 2026-10-02: "the gondola should be like a cable car or streetcar"). Its track and stations are the Transit Center
 * model's (render/landmarks/sf/districts/transbay.ts).
 */
function gondolaCabin(out: MeshBuilder): void {
  const F = FIXED
  const WHITE: Rgb = [0.94, 0.94, 0.92]
  const PALE: Rgb = [0.62, 0.74, 0.78]
  box(out, 0, 1.9, 0, 1.9, 1.5, 2.5, PALE, F)
  box(out, 0, 0.32, 0, 2.05, 0.2, 2.65, WHITE, F)
  box(out, 0, 3.5, 0, 2.05, 0.2, 2.65, WHITE, F)
  for (const s of [-1, 1]) for (const u of [-1, 1]) box(out, s * 1.95, 1.9, u * 2.55, 0.12, 1.5, 0.12, WHITE, F)
  // the carriage under it, on the rails
  box(out, 0, 0.0, 0, 1.6, 0.18, 2.2, [0.5, 0.52, 0.54], F)
  // riders inside
  for (const [x, z, k] of [[-0.9, 1.2, 1], [0.8, -0.4, 4], [-0.5, -1.4, 6]] as const) rider(out, x, 0.5, z, k, true)
}

export const SF_STOCK: RegionStock = {
  ...DEFAULT_STOCK,
  // Caltrain's electric double-deckers: a cab car at each end
  rail: { mid: kiss(false), head: kiss(true), tail: turned(kiss(true)), cars: 4, pitch: 26.3, speed: 18, colour: [1, 1, 1], shadow: [26, 3.0, 4.3], capacity: 80 },
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
  // (speed: 43 m of track in about 25 s; deck: where the rider stands, the cabin's floor)
  gondola: { mid: gondolaCabin, cars: 1, pitch: 6, speed: 1.8, deck: 0.5, colour: [1, 1, 1], shadow: [5.4, 4.2, 3.8], capacity: 2, stops: true },
  light: { mid: muniLRV, cars: 2, pitch: 23.2, speed: 11, deck: 0.95, colour: [0.82, 0.83, 0.85], shadow: [23, 2.7, 3.4], capacity: 24, stops: true },
}

/** the models on their own, for the model viewer (src/model-showcase.ts: ?model=cableCar) */
export const SF_VEHICLES = { gondolaCabin, cableCar, californiaCar, pccStreetcar: pcc(PCC_LIVERIES[0]), peterWitt, muniLRV, caltrainCab: kiss(true), caltrainCar: kiss(false) }
