import { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, fitted, pedimentOn, rectOn } from '../palaces/common.ts'
import {
  archesOn, band, domeOf, drumArches, egg, figure, FIXED, horseman, ring, roundBalustrade, walls, type P2,
} from './common.ts'

/** the design footprint: OSM way 23762981's box turned to the basilica's axis (local −z faces bearing 175.6, the city) */
const HX = 25.2
const HZ = 48.1

/**
 * The plan at the ground, OSM way 23762981 in this frame (osmium, 2026-10-29), simplified to 35 cm: the porch and its
 * two statue piers at the front, the aisles, the transept, the chevet's radiating chapels round the back, the
 * campanile's square at +z.
 */
const PLAN = ring([
  -24.7, 19.9, -24.3, 17.3, -21.9, 14.5, -22.3, 8.1, -21.8, 8.0, -21.8, 6.7, -25.1, 6.9, -25.1, -34.0, -21.6, -34.2,
  -21.6, -34.7, -19.9, -35.7, -20.0, -39.5, -10.6, -39.2, -10.5, -44.0, -9.3, -44.0, -9.3, -47.7, -8.3, -47.7, -8.2, -47.2,
  2.8, -47.3, 8.1, -47.4, 8.0, -48.0, 9.2, -48.0, 9.1, -44.0, 10.5, -44.0, 10.4, -39.2, 19.8, -39.3, 19.9, -35.8, 21.0, -35.2,
  21.0, -34.7, 25.0, -34.4, 25.0, 6.7, 21.6, 6.7, 22.1, 8.7, 21.5, 14.6, 22.7, 15.3, 24.1, 20.2, 22.8, 23.0, 20.6, 24.4,
  20.2, 29.3, 18.1, 31.7, 14.6, 32.2, 14.5, 32.9, 13.6, 33.0, 12.8, 35.6, 10.8, 37.5, 6.9, 37.7, 7.1, 48.0, -7.4, 48.0,
  -7.2, 37.3, -8.8, 37.7, -10.9, 37.3, -12.5, 36.2, -14.0, 33.0, -14.9, 32.9, -15.0, 32.2, -17.2, 32.1, -19.2, 31.0,
  -20.7, 28.7, -20.5, 25.4, -21.1, 25.1, -20.7, 24.3, -23.4, 22.8,
])

/**
 * The Basilique du Sacré-Cœur on the summit of Montmartre (Paul Abadie, 1875–1914; consecrated 1919): the white
 * Romano-Byzantine church every view north from Paris ends on. Built of Château-Landon travertine, which whitens in
 * the rain — so it is drawn white, domes and all. What a rider sees, from the terraces below and from across the city:
 *
 * - the GREAT DOME over the crossing: a tall round drum ringed with arched windows and colonnettes and a gallery,
 *   the egg-shaped dome drawn up to a blunt point, its ribs, and the colonnaded lantern on top, 83 m up;
 * - the FOUR SMALL DOMES at the corners of the crossing, each the great one in little on its own arcaded drum;
 * - the PORCH of three arches at the head of the steps, with the two bronze horsemen on its piers — Joan of Arc and
 *   Saint Louis (Hippolyte Lefebvre, 1927) — and over it the front's great arched window, the gable, Christ in his
 *   niche, and a small domed turret either side;
 * - the long body: aisles, the transept with its gabled ends and turrets, the chevet's ring of round chapels;
 * - behind, the square CAMPANILE (84 m) with its belfry and its own domed top.
 *
 * Heights and the parts' positions are OSM's 3D parts of the basilica (226727320…226727369, measured in this frame
 * with osmium, 2026-10-29): the walls 16 m, aisles 24, nave and transept ridges 33, the small domes 46 and their
 * lanterns 53, the great dome 73 and its lantern 83, the campanile 84; the porch 12 m with its piers at x ±2.6.
 */
export function sacreCoeurFull(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

const WHITE: Rgb = [0.95, 0.935, 0.9]
/** the domes a touch brighter than the walls: they are what catches the sun over Paris */
const DOME: Rgb = [0.99, 0.98, 0.955]
const SHADOW: Rgb = shade(WHITE, 0.9)
const TRIM: Rgb = [0.985, 0.975, 0.95]
const DARK: Rgb = [0.2, 0.2, 0.22]
const GLASS: Rgb = [0.24, 0.26, 0.3]
const BRONZE: Rgb = [0.32, 0.43, 0.37]
const GOLD: Rgb = [0.8, 0.66, 0.32]

function draw(out: MeshBuilder): void {
  // ---- the walls round the whole plan, 16 m: the aisles, the chapels of the chevet, the porch's back
  walls(out, PLAN, 0, 16, WHITE, SHADOW)
  band(out, PLAN, 15.2, 0.8, 0.35, TRIM)
  band(out, PLAN, 5.0, 0.35, 0.15, TRIM)
  archesOn(out, PLAN, 7.0, 1.5, 5.2, 4.2, GLASS, 3.2)
  archesOn(out, PLAN, 1.2, 1.0, 2.2, 4.2, DARK, 3.2)                                        // the crypt's windows

  // ---- the nave, x ±10.7, its roof ridged at 33 from the front to the apse
  const n0 = -41.8
  block(out, -10.7, 10.7, n0, 18.3, 16, 24, WHITE)
  roof(out, -11.1, 11.1, n0, 18.3, 24, 9, 11.1, 0, SHADOW)
  for (const f of ['-x', '+x'] as const) {
    const plane = f === '-x' ? -10.7 : 10.7
    for (const z of [-38, -34]) archOn(out, f, plane, z, 17.5, 1.5, 4.5, GLASS)
    for (let z = 9; z < 18; z += 4) archOn(out, f, plane, z, 17.5, 1.5, 4.5, GLASS)
  }
  // the apse: the nave's end turned round in a half-circle, its half-cone roof up to the ridge
  apse(out, 0, 18.3, 10.6, 16, 24, 33)
  // the ambulatory round it, 24 m, and its roof
  block(out, -17.9, 17.9, -2.3, 16.6, 16, 24, WHITE)
  apse(out, 0, 16.6, 17.9, 16, 24, 26)
  roof(out, -18.2, 18.2, -2.6, 16.6, 24, 2, 6, 6, SHADOW)

  // ---- the transept, x ±24.9, z −24.4…−2.9, gabled to 33 at each end, a great arched window in each gable
  const t0 = -24.4
  const t1 = -2.9
  block(out, -24.9, 24.9, t0, t1, 16, 24, WHITE)
  roofX(out, -25.3, 25.3, t0 - 0.4, t1 + 0.4, 24, 9)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    const plane = s * 24.9
    gableX(out, plane, t0, t1, 24, 9, s)
    archOn(out, f, plane, (t0 + t1) / 2, 8, 6.0, 12.5, GLASS, 0.1)
    archOn(out, f, plane, (t0 + t1) / 2, 7.4, 7.2, 13.5, TRIM, 0.06)
    // the two gabled turrets at the corners of each end
    for (const z of [-22.9, -4.5]) {
      block(out, s * 23.4 - 1.7, s * 23.4 + 1.7, z - 1.5, z + 1.5, 16, 28, WHITE)
      roof(out, s * 23.4 - 1.9, s * 23.4 + 1.9, z - 1.7, z + 1.7, 28, 2.4, 1.9, 1.9, WHITE)
    }
    for (const z of [-34.0, 5.5]) {
      // the round corner turrets with their little domes
      const x = s * (z < 0 ? 19.8 : 20.5)
      prism(out, x, z, 16, 25, 1.25, 12, WHITE, FIXED)
      prism(out, x, z, 24.6, 25.2, 1.45, 12, TRIM, FIXED)
      domeOf(out, x, z, 25.2, 1.3, 4.2, WHITE, egg, { sides: 12, steps: 6 })
    }
  }

  // ---- the four small domes, each on its octagon and its arcaded drum
  for (const [x, z] of [[-14.0, -27.7], [13.3, -28.0], [-14.7, -0.2], [14.2, -0.3]]) smallDome(out, x, z)

  // ---- the great dome over the crossing
  greatDome(out, -0.1, -14.0)

  // ---- the front
  front(out)

  // ---- the campanile behind the chevet
  campanile(out, -0.1, 40.9)
}

/** A half-circle apse at (cx, cz), opening toward −z: walls from y0 to the eaves, a half-cone roof up to `ridge`. */
function apse(out: MeshBuilder, cx: number, cz: number, r: number, y0: number, eaves: number, ridge: number): void {
  const n = 10
  const P = (i: number, rr: number): P2 => {
    const a = -Math.PI / 2 + (i / n) * Math.PI
    return { x: cx + Math.sin(a) * rr, z: cz + Math.cos(a) * rr }
  }
  for (let i = 0; i < n; i++) {
    const a = P(i, r)
    const b = P(i + 1, r)
    const mx = (a.x + b.x) / 2 - cx
    const mz = (a.z + b.z) / 2 - cz
    const l = Math.hypot(mx, mz) || 1
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, eaves, b.z], [a.x, eaves, a.z]], [mx / l, 0, mz / l], [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE, FIXED)
    // the roof: a fan up to the ridge's end
    const a2 = P(i, r + 0.4)
    const b2 = P(i + 1, r + 0.4)
    out.quad([[a2.x, eaves, a2.z], [b2.x, eaves, b2.z], [cx, ridge, cz], [cx, ridge, cz]], [mx / l, 0.8, mz / l], [[0, 0], [1, 0], [1, 1], [0, 1]], SHADOW, FIXED)
    // a window in every other bay
    if (i % 2 === 1 && eaves - y0 > 5) {
      const m = P(i + 0.5, r + 0.06)
      const ang = -Math.PI / 2 + ((i + 0.5) / n) * Math.PI
      const nx = Math.sin(ang)
      const nz = Math.cos(ang)
      box(out, m.x, y0 + (eaves - y0) * 0.5, m.z, Math.abs(nz) * 0.7 + 0.06, (eaves - y0) * 0.28, Math.abs(nx) * 0.7 + 0.06, GLASS, FIXED)
    }
  }
}

/** A roof ridged along x (the transept's) over [x0,x1]×[z0,z1], rising h from y. */
function roofX(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, h: number): void {
  roof(out, x0, x1, z0, z1, y, h, 0.01, (z1 - z0) / 2, SHADOW)
}

/** The gable wall at the end of the transept: a triangle on the plane x = plane, facing ±x. */
function gableX(out: MeshBuilder, plane: number, z0: number, z1: number, y: number, h: number, s: number): void {
  const zm = (z0 + z1) / 2
  const x = plane + s * 0.02
  out.quad([[x, y, z0], [x, y, z1], [x, y + h, zm], [x, y + h, zm]], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE, FIXED)
  // the coping along its two rakes
  for (const za of [z0, z1]) beam(out, [plane + s * 0.15, y + 0.2, za], [plane + s * 0.15, y + h + 0.2, zm], 0.35, TRIM)
}

/** A small dome at (x, z): an octagon from the aisle roofs up to 24, the arcaded drum to 33, the egg to 46, the lantern to 53. */
function smallDome(out: MeshBuilder, x: number, z: number): void {
  prism(out, x, z, 16, 24, 5.9, 8, WHITE, FIXED)
  prism(out, x, z, 23.6, 24.4, 6.2, 8, TRIM, FIXED)
  prism(out, x, z, 24.4, 33, 5.4, 16, WHITE, FIXED)
  drumArches(out, x, z, 5.4, 25.6, 8, 1.3, 5.2, GLASS, TRIM)
  prism(out, x, z, 32.4, 33.2, 5.75, 16, TRIM, FIXED)
  domeOf(out, x, z, 33.2, 5.5, 12.8, DOME, egg, { sides: 20, steps: 10, ribs: 8, rib: TRIM })
  // the lantern: colonnettes round a core, a cap, a finial
  prism(out, x, z, 45.6, 49.6, 0.55, 8, SHADOW, FIXED)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    prism(out, x + Math.sin(a) * 0.95, z + Math.cos(a) * 0.95, 45.6, 49.4, 0.11, 5, WHITE, FIXED)
  }
  prism(out, x, z, 49.4, 49.9, 1.15, 8, TRIM, FIXED)
  domeOf(out, x, z, 49.9, 1.05, 2.4, WHITE, egg, { sides: 10, steps: 5 })
  prism(out, x, z, 52.2, 53.2, 0.07, 4, GOLD, FIXED)
}

/**
 * The great dome at (cx, cz): the square crossing tower up from the roofs, the round drum with its sixteen arched
 * windows and colonnettes, the gallery round its head, the egg-shaped dome with its ribs, the colonnaded lantern.
 */
function greatDome(out: MeshBuilder, cx: number, cz: number): void {
  const r = 10.4
  // the crossing's square, with a small gable on each face, from the roofs to the drum
  block(out, cx - 11.3, cx + 11.3, cz - 11.3, cz + 11.3, 24, 34.5, WHITE)
  block(out, cx - 11.6, cx + 11.6, cz - 11.6, cz + 11.6, 34.0, 34.8, TRIM)
  for (const f of ['-z', '+z', '-x', '+x'] as const) {
    const plane = f === '-z' ? cz - 11.3 : f === '+z' ? cz + 11.3 : f === '-x' ? cx - 11.3 : cx + 11.3
    const t = f === '-z' || f === '+z' ? cx : cz
    for (const d of [-6, 0, 6]) archOn(out, f, plane, t + d, 27.5, 1.6, 4.8, GLASS)
  }
  // the drum: a plinth, the arcade of windows and colonnettes, the gallery and cornice
  prism(out, cx, cz, 34.8, 37.2, r + 0.5, 32, WHITE, FIXED)
  prism(out, cx, cz, 37.2, 49.0, r, 32, WHITE, FIXED)
  drumArches(out, cx, cz, r, 38.6, 16, 1.6, 7.0, GLASS, TRIM)
  prism(out, cx, cz, 46.6, 47.3, r + 0.35, 32, TRIM, FIXED)
  roundBalustrade(out, cx, cz, r + 0.25, 47.3, TRIM, 1.0, 24)
  prism(out, cx, cz, 48.3, 49.0, r + 0.15, 32, WHITE, FIXED)
  prism(out, cx, cz, 49.0, 50.0, r + 0.55, 32, TRIM, FIXED)
  // the dome, with sixteen ribs
  domeOf(out, cx, cz, 50.0, r, 20.5, DOME, egg, { sides: 28, steps: 12, ribs: 16, rib: TRIM })
  // the lantern: a little round temple of eight colonnettes on a ring, its own egg cap, the cross
  prism(out, cx, cz, 69.6, 70.6, 2.7, 16, TRIM, FIXED)
  prism(out, cx, cz, 70.6, 76.0, 1.55, 12, SHADOW, FIXED)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    prism(out, cx + Math.sin(a) * 2.25, cz + Math.cos(a) * 2.25, 70.6, 75.8, 0.2, 6, WHITE, FIXED)
  }
  prism(out, cx, cz, 75.8, 76.6, 2.6, 16, TRIM, FIXED)
  domeOf(out, cx, cz, 76.6, 2.35, 4.3, WHITE, egg, { sides: 16, steps: 7, ribs: 8, rib: TRIM })
  prism(out, cx, cz, 80.7, 81.4, 0.35, 8, WHITE, FIXED)
  box(out, cx, 82.2, cz, 0.09, 0.85, 0.09, GOLD, FIXED)
  box(out, cx, 82.5, cz, 0.45, 0.08, 0.09, GOLD, FIXED)
}

/**
 * The front: the porch of three arches at the head of the steps (x ±8.2, z −47.4…−42.8, 12 m), the horsemen on their
 * piers either side, the front wall over it (x ±10.5 at z −41.7) up to its gable, the great window, Christ in the
 * niche at the top, a domed turret either side.
 */
function front(out: MeshBuilder): void {
  const zf = -47.4
  const zb = -41.7
  // the porch: three arches on four piers, a frieze, a balustrade along its top
  block(out, -8.2, 8.2, zf, zb, 0, 9.2, WHITE)
  block(out, -8.5, 8.5, zf - 0.3, zb, 9.2, 12.0, WHITE)
  block(out, -8.7, 8.7, zf - 0.45, zb, 11.6, 12.1, TRIM)
  for (const x of [-5.4, 0, 5.4]) {
    archOn(out, '-z', zf, x, 0, 4.2, 8.4, DARK, 0.08)
    archOn(out, '-z', zf, x, 0, 4.9, 8.9, TRIM, 0.05)
    // the doors deep under the arches, in bronze
    rectOn(out, '-z', zf, x - 1.3, x + 1.3, 0, 4.8, [0.17, 0.2, 0.18], 0.1)
  }
  for (const x of [-8.2, -2.6, 2.6, 8.2]) {
    // the piers, each with a colonnette on its face
    prism(out, x, zf - 0.35, 0, 7.4, 0.28, 8, TRIM, FIXED)
  }
  rectOn(out, '-z', zf - 0.3, -8.4, 8.4, 9.9, 10.9, shade(WHITE, 0.94), 0.05)          // the inscription band
  balustrade(out, -8.5, 8.5, zf - 0.3, zb, 12.1, { stone: WHITE, trim: TRIM, deep: SHADOW, glass: GLASS, slate: SHADOW, lead: SHADOW, gold: GOLD, dark: DARK, bronze: BRONZE }, { sides: ['-z'], h: 0.9 })
  // the statue piers at the porch's ends, and the two horsemen on them looking out over Paris
  for (const s of [-1, 1]) {
    block(out, s * 8.6 - 0.75, s * 8.6 + 0.75, -48.0, -44.0, 0, 13.0, WHITE)
    block(out, s * 8.6 - 0.95, s * 8.6 + 0.95, -48.2, -43.8, 12.6, 13.2, TRIM)
    block(out, s * 8.6 - 0.6, s * 8.6 + 0.6, -47.4, -44.6, 13.2, 13.9, SHADOW)
    horseman(out, s * 8.6, 13.9, -46.0, Math.PI, BRONZE, 1.45)
  }

  // the front wall over the porch, up to the eaves and its gable
  block(out, -10.5, 10.5, zb - 0.6, zb + 1.2, 0, 24.5, WHITE)
  pedimentOn(out, '-z', zb - 0.6, -10.5, 10.5, 24.5, 9.0, 0.4, WHITE)
  block(out, -10.9, 10.9, zb - 1.0, zb + 0.6, 23.9, 24.6, TRIM)
  // the great arched window over the porch, two lesser ones beside it, an arcade of small arches under the gable
  archOn(out, '-z', zb - 0.6, 0, 13.4, 5.6, 8.6, GLASS, 0.1)
  archOn(out, '-z', zb - 0.6, 0, 12.9, 6.8, 9.6, TRIM, 0.06)
  for (const x of [-6.6, 6.6]) archOn(out, '-z', zb - 0.6, x, 14.5, 1.8, 6.0, GLASS, 0.1)
  for (let i = -3; i <= 3; i++) archOn(out, '-z', zb - 0.6, i * 1.3, 25.4, 0.8, 1.9 - Math.abs(i) * 0.2, SHADOW, 0.1)
  // Christ in his niche at the head of the gable
  archOn(out, '-z', zb - 0.6, 0, 29.4, 2.2, 4.4, SHADOW, 0.14)
  block(out, -1.6, 1.6, zb - 1.0, zb + 0.4, 33.0, 35.5, WHITE)
  figure(out, 0, 29.6, zb - 1.05, 3.4, TRIM)
  // the two domed turrets either side of the gable
  for (const s of [-1, 1]) {
    const x = s * 9.3
    const z = -42.9
    prism(out, x, z, 16, 28.4, 1.15, 12, WHITE, FIXED)
    prism(out, x, z, 28.4, 29.0, 1.35, 12, TRIM, FIXED)
    domeOf(out, x, z, 29.0, 1.2, 4.0, WHITE, egg, { sides: 12, steps: 6 })
  }
}

/**
 * The campanile at (cx, cz), x ±6.6 × z ±6.3: the square shaft with its corner buttresses to 45, the belfry of three
 * tall arches a side to 57, the arcaded octagon to 65, the domed top to 79 and the cross at 84.
 */
function campanile(out: MeshBuilder, cx: number, cz: number): void {
  const hx = 6.6
  const hz = 6.3
  block(out, cx - hx, cx + hx, cz - hz, cz + hz, 0, 57, WHITE)
  // the corner buttresses, standing a little proud of both faces
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = cx + sx * (hx - 0.6)
    const z = cz + sz * (hz - 0.6)
    block(out, x - 1.0, x + 1.0, z - 1.0, z + 1.0, 0, 55, TRIM)
  }
  for (const y of [24, 33, 44.5]) block(out, cx - hx - 0.3, cx + hx + 0.3, cz - hz - 0.3, cz + hz + 0.3, y, y + 0.6, TRIM)
  for (const f of ['-z', '+z', '-x', '+x'] as const) {
    const plane = f === '-z' ? cz - hz : f === '+z' ? cz + hz : f === '-x' ? cx - hx : cx + hx
    const t = f === '-z' || f === '+z' ? cx : cz
    archOn(out, f, plane, t, 26, 1.4, 5.0, GLASS)
    archOn(out, f, plane, t, 35.5, 1.6, 6.0, GLASS)
    // the belfry: three tall open arches
    for (const d of [-3.4, 0, 3.4]) archOn(out, f, plane, t + d, 46.0, 2.3, 9.0, DARK, 0.1)
  }
  block(out, cx - hx - 0.6, cx + hx + 0.6, cz - hz - 0.6, cz + hz + 0.6, 56.3, 57.3, TRIM)
  // the parapet round the belfry's head, and its corner posts
  for (const [x0, x1, z0, z1] of [[-hx, hx, -hz, -hz + 0.4], [-hx, hx, hz - 0.4, hz], [-hx, -hx + 0.4, -hz, hz], [hx - 0.4, hx, -hz, hz]]) {
    block(out, cx + x0 - 0.3, cx + x1 + 0.3, cz + z0 - 0.3, cz + z1 + 0.3, 57.3, 58.3, TRIM)
  }
  // the octagon and its arches, little domed turrets on the four corners of the square
  prism(out, cx, cz, 57.3, 65, 5.4, 8, WHITE, FIXED)
  drumArches(out, cx, cz, 5.0, 58.3, 8, 1.4, 4.8, DARK)
  prism(out, cx, cz, 64.6, 65.4, 5.75, 8, TRIM, FIXED)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = cx + sx * (hx - 0.5)
    const z = cz + sz * (hz - 0.5)
    prism(out, x, z, 57.3, 61.0, 0.7, 8, WHITE, FIXED)
    domeOf(out, x, z, 61.0, 0.75, 2.2, WHITE, egg, { sides: 8, steps: 5 })
  }
  // the domed top, its lantern and the cross
  domeOf(out, cx, cz, 65.4, 5.2, 12.0, DOME, egg, { sides: 16, steps: 10, ribs: 8, rib: TRIM })
  prism(out, cx, cz, 77.0, 79.6, 0.9, 8, WHITE, FIXED)
  domeOf(out, cx, cz, 79.6, 1.0, 1.9, WHITE, egg, { sides: 8, steps: 5 })
  box(out, cx, 82.7, cz, 0.1, 1.3, 0.1, GOLD, FIXED)
  box(out, cx, 83.2, cz, 0.55, 0.09, 0.1, GOLD, FIXED)
}
