/**
 * LOMBARD STREET's crooked block: eight switchbacks between Hyde and Leavenworth, a one-car brick lane (4.0 m,
 * regions.json streetWidths) between the beds that fill the inside of every bend. Redone 2026-10-16 from the
 * owner's reference (the classic telephoto from the east, docs/shots/refs/lombard) and OSM's own mapping of the
 * block, which is detailed: twelve beds (leisure=garden, ways 471737901-916) each ringed by a clipped hedge
 * (barrier=hedge 1214023231-242), and three short hedge runs by the driveways.
 *
 *  - every BED is a mass of mophead HYDRANGEAS — pink, rose, blush — from the plant library (assetkit plantgen
 *    `hydrangea`, placed through MeshBuilder.plants), on a dark mulch floor so the gaps between them read as soil;
 *  - every bed is edged by one continuous, CLIPPED dark-green hedge with a rounded top following its outline, the
 *    line that draws the famous zigzag (it was a row of boxes);
 *  - the stairs both sides are the city's (sidewalk steps, 1.5 m: tools/bake.ts widthOf), the trees OSM's.
 *
 * Frame: centred at 37.80215, −122.4187, rotateDeg 0, so local x is east and z north (OSM projected the same way).
 * Placed with `drape: true`: every vertex lifted onto the slope under it; the plants stand on the terrain themselves.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const BEDS: [number, number][][] = [
  /* way/471737901 */ [[3.9,-9.2],[3.6,-3.9],[4.5,-3.8],[2.8,-1.6],[2.4,-1.1],[2.0,-0.6],[1.5,-0.2],[1.1,0.2],[0.5,0.5],[-0.0,0.8],[-0.5,1.1],[-1.1,1.2],[-1.7,1.1],[-2.1,1.0],[-2.6,0.8],[-3.1,0.6],[-3.5,0.3],[-3.8,0.1],[-4.1,-0.3],[-4.2,-0.7],[-6.9,-8.1],[-7.4,-9.2],[-7.9,-10.2],[-8.5,-11.2],[-9.2,-12.2],[-7.2,-11.6],[-5.2,-11.0],[-3.3,-10.3],[-1.5,-9.9],[0.1,-9.6],[1.3,-9.4],[2.6,-9.3]],
  /* way/471737903 */ [[31.4,10.2],[32.3,9.7],[33.1,9.0],[33.8,8.4],[34.5,7.6],[40.3,0.5],[40.5,0.3],[40.9,0.2],[41.2,0.0],[41.7,-0.1],[42.0,-0.1],[42.5,-0.1],[42.9,-0.1],[43.4,0.0],[43.7,0.2],[44.1,0.3],[44.4,0.5],[44.7,0.8],[44.9,1.1],[45.1,1.4],[45.4,1.7],[45.6,2.0],[51.1,12.4],[38.1,10.3],[37.2,10.2],[36.2,10.2]],
  /* way/471737904 */ [[2.8,5.8],[2.6,5.6],[2.6,5.4],[2.6,5.2],[2.7,5.0],[3.2,4.8],[3.6,4.4],[4.3,3.9],[4.9,3.3],[5.9,2.1],[10.9,-3.7],[11.2,-3.9],[11.7,-4.1],[12.1,-4.3],[12.5,-4.4],[12.9,-4.4],[13.4,-4.5],[13.9,-4.5],[14.3,-4.3],[14.7,-4.2],[14.9,-3.9],[15.1,-3.6],[15.3,-3.2],[15.4,-2.9],[15.4,-2.5],[15.5,-2.1],[15.5,-1.8],[15.3,-1.4],[15.1,-1.1],[10.8,6.4],[8.5,5.9],[7.2,5.8],[5.9,5.8],[3.3,6.0],[3.1,5.9]],
  /* way/471737905 */ [[-57.5,-3.1],[-56.6,-3.4],[-55.7,-3.8],[-54.8,-4.2],[-54.0,-4.7],[-53.2,-5.3],[-52.5,-6.0],[-52.0,-6.8],[-51.4,-7.6],[-47.2,-12.8],[-46.8,-13.1],[-46.4,-13.4],[-45.9,-13.7],[-45.5,-13.8],[-45.0,-14.0],[-44.5,-14.0],[-44.0,-14.0],[-43.5,-14.0],[-43.0,-13.9],[-42.6,-13.7],[-42.2,-13.5],[-41.9,-13.3],[-41.5,-13.0],[-41.4,-12.6],[-41.1,-12.3],[-40.9,-11.9],[-38.4,-5.2],[-37.6,-3.4],[-37.0,-2.5],[-36.5,-1.7],[-35.9,-1.0],[-35.1,-0.4],[-34.4,0.3],[-33.5,0.8]],
  /* way/471737907 */ [[-23.4,-1.3],[-17.4,-8.6],[-16.9,-9.0],[-16.2,-9.3],[-15.5,-9.5],[-14.7,-9.5],[-14.0,-9.2],[-13.4,-8.8],[-12.8,-8.4],[-12.3,-7.9],[-11.9,-7.1],[-9.6,-0.8],[-9.3,-0.0],[-9.0,0.7],[-8.6,1.4],[-8.3,2.1],[-7.8,2.8],[-7.3,3.4],[-6.2,4.5],[-9.9,3.0],[-10.9,2.6],[-11.9,2.3],[-12.8,2.0],[-13.9,1.9],[-17.7,1.9],[-19.3,0.1],[-19.9,-0.3],[-20.7,-0.7],[-21.6,-0.9]],
  /* way/471737908 */ [[52.3,3.0],[51.9,2.4],[51.5,1.9],[51.0,1.1],[50.5,0.2],[50.0,-0.7],[49.4,-1.5],[48.6,-2.4],[47.7,-3.3],[46.8,-4.2],[45.8,-5.1],[53.6,-3.6]],
  /* way/471737910 */ [[-71.9,-5.5],[-71.2,-10.6],[-70.8,-10.4],[-70.6,-10.2],[-70.2,-10.0],[-70.0,-9.8],[-63.6,-4.4],[-63.6,-4.0]],
  /* way/471737911 */ [[-52.5,-19.1],[-52.4,-18.7],[-52.4,-18.4],[-52.4,-18.0],[-52.4,-17.8],[-52.4,-17.5],[-55.1,-15.2],[-55.7,-14.6],[-56.3,-13.9],[-56.8,-13.2],[-57.3,-12.4],[-59.3,-8.8],[-59.5,-8.6],[-59.6,-8.5],[-59.8,-8.3],[-60.1,-8.3],[-60.4,-8.3],[-60.6,-8.4],[-60.9,-8.6],[-61.1,-8.7],[-61.2,-8.9],[-68.7,-19.6],[-68.9,-19.9],[-68.9,-20.3],[-68.7,-20.7],[-68.5,-21.0],[-68.1,-21.2]],
  /* way/471737912 */ [[14.7,7.0],[15.2,5.5],[15.3,5.1],[15.5,4.7],[15.7,4.3],[15.9,4.0],[16.2,3.6],[16.4,3.3],[16.6,2.9],[17.0,2.6],[17.3,2.3],[17.7,2.1],[18.0,1.8],[18.4,1.6],[18.7,2.6],[19.1,3.5],[19.4,4.5],[19.8,5.4],[20.2,6.3],[20.7,7.2],[21.1,8.1],[21.5,8.9]],
  /* way/471737913 */ [[-32.2,-14.9],[-31.2,-9.5],[-31.1,-8.1],[-31.1,-7.3],[-31.1,-6.6],[-31.1,-5.9],[-31.2,-5.3],[-31.4,-4.6],[-31.7,-4.0],[-32.0,-4.2],[-32.4,-4.6],[-32.6,-4.9],[-32.8,-5.3],[-37.2,-16.5]],
  /* way/471737915 */ [[33.1,1.7],[32.9,1.9],[32.6,2.1],[32.3,2.2],[32.0,2.2],[31.0,1.6],[30.7,1.4],[30.4,1.2],[30.2,0.8],[30.1,0.3],[29.6,-5.7],[33.2,-5.2],[34.4,-5.1],[35.6,-5.2],[40.0,-5.8],[41.6,-5.6],[40.6,-5.4],[39.8,-5.1],[38.9,-4.8],[38.0,-4.4],[37.3,-3.9],[36.8,-3.4],[36.1,-2.9],[35.6,-2.4]],
  /* way/471737916 */ [[26.2,-6.4],[27.5,3.6],[27.5,4.1],[27.4,4.4],[27.3,4.7],[27.0,5.0],[26.6,5.2],[26.0,5.2],[25.6,5.0],[25.1,4.7],[24.8,4.2],[24.5,3.6],[24.3,3.0],[22.6,-2.4],[22.2,-3.2],[21.8,-4.0],[21.4,-4.9],[20.9,-5.7],[20.3,-6.6],[19.7,-7.4],[19.1,-8.2],[18.4,-8.9]],
]
const HEDGE_RUNS: [number, number][][] = [
  /* way/1011562132 */ [[-28.1,-9.0],[-28.4,-14.0],[-26.8,-14.1]],
  /* way/1011562133 */ [[-23.4,-12.1],[-23.1,-14.3],[-21.5,-14.2]],
  /* way/1011562136 */ [[2.7,-8.5],[8.1,-8.4]],
]

/*
 * Each bed vertex's LIFT off the raw ground to the road's own grade beside it (the ride edges' height at the nearest point
 * of road, the loop that edge borders; scratch lombard/dy.ts, from the 2026-10-16 bake). The crooked lane is graded down its hairpins, the raw
 * slope is not: set on the raw slope, a bed's hedge stood a metre or two off the road beside it, a dark wall. Lifted,
 * each bed banks from the loop below it to the loop above, as the real ones do.
 */
const BED_LIFT: number[][] = [
  [-0.52,0.25,0.42,0.38,0.30,0.19,0.09,0.20,0.46,0.68,0.81,0.59,0.43,0.30,0.23,0.32,0.29,0.30,0.41,0.58,2.17,2.28,2.46,2.59,2.57,2.88,3.29,3.54,3.80,-1.29,-1.01,-0.71],
  [0.54,0.68,0.83,0.93,1.00,0.73,0.55,0.41,0.47,0.37,0.27,0.17,0.08,-0.04,-0.02,-0.04,-0.10,-0.19,-0.15,-0.16,-0.17,-0.19,-0.06,1.56,1.45,1.32],
  [1.38,1.33,1.11,1.11,1.14,1.05,0.99,1.00,1.08,1.41,1.46,1.44,1.39,1.41,1.37,1.23,1.06,0.82,0.24,0.05,-0.19,-0.24,-0.27,-0.31,-0.35,-0.33,-0.36,-0.40,-0.44,2.78,2.17,1.77,1.48,1.32,1.25],
  [0.15,0.17,0.18,0.18,0.20,0.21,0.21,0.20,0.20,0.90,0.98,1.06,1.11,1.13,1.13,1.11,1.06,0.95,0.65,0.56,0.44,0.32,0.19,0.05,-0.09,-0.16,-0.20,-0.43,-0.46,-0.49,-0.41,-0.37,-0.32,-0.19],
  [2.01,0.96,0.91,0.87,1.10,1.39,1.33,1.30,1.11,1.11,0.70,-0.25,-0.30,-0.55,-0.65,-0.64,-0.61,-0.66,-0.52,-1.03,-1.35,-1.49,-1.85,-1.89,4.17,3.29,3.05,2.90,2.70],
  [0.19,0.21,0.27,0.29,0.39,0.40,0.51,0.42,0.44,0.33,0.23,0.61],
  [0.02,0.13,0.11,0.12,0.11,0.09,0.01,-0.00],
  [-0.12,-0.09,-0.07,-0.06,-0.06,-0.06,-0.09,-0.10,-0.10,-0.10,-0.10,0.01,0.01,0.00,0.02,0.01,0.01,0.02,0.03,0.04,0.05,0.17,0.16,0.13,0.11,0.09,0.09],
  [-0.89,-0.62,-0.60,-0.55,-0.49,-0.43,-0.36,-0.32,-0.24,-0.17,-0.09,0.00,0.08,0.15,0.19,0.23,0.27,0.20,0.17,0.08,-0.06,-0.12],
  [1.78,1.52,1.43,1.24,0.66,0.35,0.23,0.21,0.16,0.19,0.24,0.34,0.37,1.20],
  [0.47,0.44,0.45,0.44,0.39,0.23,0.19,0.14,0.12,0.04,-0.43,-0.14,-0.11,-0.03,-0.02,0.06,-0.00,0.03,-0.02,0.01,0.13,0.16,0.17,0.40],
  [1.95,-0.06,-0.06,-0.08,0.02,-0.04,0.08,0.23,0.43,0.65,0.85,1.16,1.24,1.15,1.08,1.00,0.93,0.88,0.80,0.70,0.65,0.60],
]
const RUN_LIFT: number[][] = [
  [-0.63,-1.99,-1.69],
  [-0.47,-1.13,-0.83],
  [-0.58,0.64],
]

const HEDGE: Rgb = [0.07, 0.15, 0.06]           // dark, as clipped box is; the grade lifts it (BUGS #280)
const MULCH: Rgb = [0.2, 0.15, 0.11]
const KERB: Rgb = [0.66, 0.64, 0.6]
type P2 = [number, number]

const hash = (x: number, z: number, k: number): number => { const s = Math.sin(x * 127.1 + z * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s) }

function inside(r: P2[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i][1] > z) !== (r[j][1] > z) && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) o = !o
  }
  return o
}
function edgeDist(r: P2[], x: number, z: number): number {
  let best = Infinity
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [ax, az] = r[j], [bx, bz] = r[i], dx = bx - ax, dz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
    best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z))
  }
  return best
}

/**
 * A clipped hedge along a polyline (closed or not): a rounded profile — straight sides, a domed top — swept along it,
 * mitred at the corners so it is one smooth band, not a run of boxes. `w` wide, `h` tall.
 */
function hedge(out: MeshBuilder, pts: P2[], closed: boolean, w: number, h: number, c: Rgb, tag: number, lift: number[]): void {
  const n = pts.length
  if (n < 2) return
  // the profile across the hedge, from the outside foot over the top to the inside foot: (offset, height)
  const prof: P2[] = [[-0.5, 0], [-0.5, 0.55], [-0.42, 0.82], [-0.25, 0.96], [0, 1], [0.25, 0.96], [0.42, 0.82], [0.5, 0.55], [0.5, 0]]
  const side = (i: number): P2 => {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[i], c2 = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)]
    let t1x = b[0] - a[0], t1z = b[1] - a[1], t2x = c2[0] - b[0], t2z = c2[1] - b[1]
    const l1 = Math.hypot(t1x, t1z) || 1, l2 = Math.hypot(t2x, t2z) || 1
    t1x /= l1; t1z /= l1; t2x /= l2; t2z /= l2
    if (i === 0 && !closed) { t1x = t2x; t1z = t2z }
    if (i === n - 1 && !closed) { t2x = t1x; t2z = t1z }
    let mx = -(t1z + t2z), mz = t1x + t2x
    const ml = Math.hypot(mx, mz) || 1
    mx /= ml; mz /= ml
    // mitre: lengthen the offset at a corner, capped so a hairpin does not throw a spike
    const cos = Math.max(0.5, mx * -t1z + mz * t1x)
    return [mx / cos, mz / cos]
  }
  const sides = pts.map((_, i) => side(i))
  const at = (i: number, k: number): [number, number, number] => [pts[i][0] + sides[i][0] * prof[k][0] * w, lift[i] + prof[k][1] * h, pts[i][1] + sides[i][1] * prof[k][0] * w]
  const segs = closed ? n : n - 1
  for (let i = 0; i < segs; i++) {
    const j = (i + 1) % n
    for (let k = 0; k + 1 < prof.length; k++) {
      // the strip's normal: the profile's own (offset, height) normal — its tangent turned a quarter anticlockwise —
      // swept round by the side vector; the clipped top a touch lighter than the sides, as it catches the sky
      const no = -(prof[k + 1][1] - prof[k][1]) * h, ny = (prof[k + 1][0] - prof[k][0]) * w
      const sx = (sides[i][0] + sides[j][0]) / 2, sz = (sides[i][1] + sides[j][1]) / 2
      const up = Math.max(0, ny) / (Math.hypot(no, ny) || 1)
      const col: Rgb = [c[0] * (0.85 + 0.3 * up), c[1] * (0.85 + 0.3 * up), c[2] * (0.85 + 0.3 * up)]
      out.quad([at(i, k), at(j, k), at(j, k + 1), at(i, k + 1)], [sx * no, ny, sz * no], [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
    }
  }
  if (!closed) for (const [i, s] of [[0, -1], [n - 1, 1]] as [number, number][]) {
    // the cut ends, a fan over the profile
    for (let k = 1; k + 1 < prof.length; k++) {
      const tx = s * (pts[Math.min(n - 1, i + (s < 0 ? 1 : 0))][0] - pts[Math.max(0, i - (s > 0 ? 1 : 0))][0])
      const tz = s * (pts[Math.min(n - 1, i + (s < 0 ? 1 : 0))][1] - pts[Math.max(0, i - (s > 0 ? 1 : 0))][1])
      out.quad([at(i, 0), at(i, k), at(i, k + 1), at(i, k + 1)], [s * tx, 0, s * tz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
    }
  }
}

/** the beds, their hedges, their hydrangeas (placed with `drape`: each lifted onto the slope) */
export function lombardGardens(out: MeshBuilder, _fit: Fit): void {
  const leaf = surfaceTag('foliage')
  BEDS.forEach((bed, bi) => {
    const lift = BED_LIFT[bi]
    // the mulch floor, a fan from the bed's middle (each bed is near enough convex from its centroid), a hand above the ground
    let cx = 0, cz = 0
    for (const [x, z] of bed) { cx += x; cz += z }
    cx /= bed.length; cz /= bed.length
    // the lift at any point of the bed: inverse-square from its outline's own
    const liftAt = (x: number, z: number): number => {
      let w = 0, t = 0
      bed.forEach(([bx, bz], i) => { const k = 1 / ((bx - x) ** 2 + (bz - z) ** 2 + 0.5); w += k; t += k * lift[i] })
      return t / w
    }
    const lc = liftAt(cx, cz)
    for (let i = 0; i < bed.length; i++) {
      const j = (i + 1) % bed.length, a = bed[i], b = bed[j]
      out.quad([[cx, lc + 0.06, cz], [a[0], lift[i] + 0.06, a[1]], [b[0], lift[j] + 0.06, b[1]], [b[0], lift[j] + 0.06, b[1]]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], MULCH, 0)
    }
    // the bed's sides: a kerb wall from its edge down 5 m, so a bed standing proud of the raw slope (to the lane's grade)
    // is a solid terrace with a retaining kerb, not a sheet in the air; draped with the top, its foot stays buried
    for (let i = 0; i < bed.length; i++) {
      const j = (i + 1) % bed.length, a = bed[i], b = bed[j]
      out.quad([[a[0], lift[i] - 5, a[1]], [b[0], lift[j] - 5, b[1]], [b[0], lift[j] + 0.06, b[1]], [a[0], lift[i] + 0.06, a[1]]],
        [b[1] - a[1], 0, -(b[0] - a[0])], [[0, 0], [1, 0], [1, 1], [0, 1]], KERB, surfaceTag('concrete'))
    }
    // the clipped border hedge, its outer face on the bed's edge
    let area = 0
    for (let i = 0; i < bed.length; i++) { const a = bed[i], b = bed[(i + 1) % bed.length]; area += a[0] * b[1] - b[0] * a[1] }
    const ring = area > 0 ? bed : bed.slice().reverse()
    const ringLift = area > 0 ? lift : lift.slice().reverse()
    const inset: P2[] = ring.map((p, i) => {
      const a = ring[(i - 1 + ring.length) % ring.length], c = ring[(i + 1) % ring.length]
      let nx = (c[1] - a[1]), nz = -(c[0] - a[0])
      const l = Math.hypot(nx, nz) || 1
      nx /= l; nz /= l
      return [p[0] - nx * 0.3, p[1] - nz * 0.3]                       // (anticlockwise: (dz, −dx) points out, so in is minus)
    })
    hedge(out, inset, true, 0.6, 0.62, HEDGE, leaf, ringLift)
    // the hydrangeas, edge to edge: a jittered lattice inside the hedge, each a library plant of about a metre
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const [x, z] of bed) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z) }
    const STEP = 1.05
    for (let x = Math.ceil(x0 / STEP) * STEP; x < x1; x += STEP) {
      for (let z = Math.ceil(z0 / STEP) * STEP; z < z1; z += STEP) {
        const jx = x + (hash(x, z, 1) - 0.5) * 0.5, jz = z + (hash(x, z, 2) - 0.5) * 0.5
        if (!inside(bed, jx, jz) || edgeDist(bed, jx, jz) < 0.75) continue
        out.plants.push({ x: jx, z: jz, species: 'hydrangea', h: 0.95 + hash(x, z, 3) * 0.4, spin: hash(x, z, 4) * Math.PI * 2, dy: liftAt(jx, jz) })
      }
    }
  })
  // the short hedges by the driveways
  HEDGE_RUNS.forEach((run, i) => hedge(out, run, false, 0.6, 0.9, HEDGE, leaf, RUN_LIFT[i]))
}
