/**
 * THE JARDIN ATLANTIQUE's top (Brun and Pena, 1994; fr.wikipedia, "Jardin Atlantique"; aerial 48.8399 2.3190, 0.26 m/px): the roof of the Gare Montparnasse, 3.5 ha, 19 m over the platforms, in the well of the Maine-Montparnasse slabs. It was one flat foliage cap under a scatter of trees: bright green, with its trees anywhere.
 * Said here as it is, read off the photograph: the great square lawn on the diagonal and the central alley crossing it to L'ÎLE DES HESPÉRIDES, a hexagon of pale paving and its portico with a mast and mirror; the five blue tennis courts in a row along the north-west, under a tilted pergola; the white sails of the two tents;
 * the ventilation hoppers (the park's "130 trémies") as low grey boxes in the grass; the pale curved walks and the park's teak; and only where the photograph has a wood, its trees (the pines and oaks of the deck rings: MeshBuilder.decks). Drawn in east/north metres about the photograph's middle and placed by gareMontparnasse (it has to share that model's base).
 */
import { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { strut } from '../../../models.ts'
import { hex, prism, shade, type Rgb } from '../../kit.ts'
import { block } from './tag.ts'

type EN = [number, number]
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const LAWN: Rgb = hex('#3f5a2a'), LAWN_DK: Rgb = hex('#37502a'), PAVE: Rgb = hex('#928c7c'), WALK: Rgb = hex('#8a8270'), TEAK: Rgb = hex('#4e3d2c'), COURT: Rgb = hex('#233f70'), LINE: Rgb = hex('#c8ccd0'), VENT: Rgb = hex('#5f6464'), STEEL: Rgb = hex('#7f8588')
const BLOSSOM: Rgb[] = [hex('#6f4c86'), hex('#c8c6c0'), hex('#4c5f9a')]

/** the rectangle centred (e, n), half-sizes along and across the given bearing */
const oblong = (e: number, n: number, u: number, v: number, b: number): EN[] => {
  const t = (b * Math.PI) / 180, ux = Math.sin(t), uz = Math.cos(t), vx = uz, vz = -ux
  return [[e - ux * u - vx * v, n - uz * u - vz * v], [e + ux * u - vx * v, n + uz * u - vz * v], [e + ux * u + vx * v, n + uz * u + vz * v], [e - ux * u + vx * v, n - uz * u + vz * v]]
}
const P = (r: EN[]): { x: number; z: number }[] => r.map(([x, z]) => ({ x, z }))

/** the garden in E/N metres at height y; returns the rings the trees stand on */
export function jardinAtlantiqueTop(y: number): { mesh: MeshBuilder; woods: EN[][] } {
  const out = new MeshBuilder()
  const flat = (r: EN[], h: number, c: Rgb, tag = 0): void => capPolygon(out, P(r), y + h, c, tag)
  // the alley's axis runs bearing 37 across the square lawn; the courts run bearing 37 too
  const lawnA: EN[] = [[-60, -12], [-14, 51], [0, 42], [-1, 17], [-16, 5], [-26, -4], [-39, -5]]
  const lawnB: EN[] = [[0, -47], [-16, -42], [-10, -10], [12, -5], [23, 21], [43, 8], [18, -36]]
  flat(lawnA, 0.04, LAWN)
  flat(lawnB, 0.04, LAWN_DK)
  // the walks: the alley, the curved ones, the paved sweep to the north-east, the sandy play walks in the south
  for (const r of [oblong(0, 0, 66, 2.2, 37), oblong(45, 42, 22, 5, 37), oblong(-40, -56, 18, 3.5, 37), oblong(-5, -68, 12, 3.5, 100), oblong(15, -60, 10, 3, 55)]) flat(r, 0.07, WALK)
  // (the raised teak walk along the courts' south-east, under its slats)
  flat(oblong(-40, 12, 62, 3, 37), 0.09, TEAK, surfaceTag('planks'))
  // the five courts
  const cs: [number, number][] = [[-91, -29], [-79, -1], [-58, 21], [-38, 56], [-5, 77]]
  for (const [e, n] of cs) {
    flat(oblong(e, n, 14, 8, 127), 0.06, COURT)
    flat(oblong(e, n, 11, 5.5, 127), 0.08, shade(COURT, 1.2))
    flat(oblong(e, n, 0.08, 5.5, 127), 0.1, LINE)
    for (const s of [-5.5, 5.5]) {
      const t = (37 * Math.PI) / 180
      flat(oblong(e + Math.sin(t) * s, n + Math.cos(t) * s, 11, 0.06, 127), 0.1, LINE)
    }
    // its wire cage's posts and head rail
    const q = oblong(e, n, 14, 8, 127)
    for (let k = 0; k < 4; k++) {
      const [ax, az] = q[k], [bx, bz] = q[(k + 1) % 4], m = 5
      for (let i = 0; i < m; i++) { const x = ax + ((bx - ax) * i) / m, z = az + ((bz - az) * i) / m; block(out, x - 0.05, x + 0.05, z - 0.05, z + 0.05, y, y + 4, shade(COURT, 0.5)) }
      strut(out, [ax, y + 4, az], [bx, y + 4, bz], 0.05, 0.05, shade(COURT, 0.5))
    }
  }
  // the mauves, whites and blues the article names, in long waving beds on the lawns' edges, and the clipped evergreens along the courts
  for (const [k, [e, n, u]] of ([[-48, -10, 8], [-30, 26, 10], [-14, 44, 6], [8, -24, 9], [30, 4, 8], [14, 10, 5], [40, 30, 7], [-8, -58, 6]] as [number, number, number][]).entries()) {
    const q = oblong(e, n, u, 0.9, 37 + (k % 2 ? 6 : -6)).map(([x, z]) => ({ x, z }))
    capPolygon(out, q, y + 0.45, BLOSSOM[k % 3], surfaceTag('blossom'))
    for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; out.quad([[a.x, y, a.z], [b.x, y, b.z], [b.x, y + 0.45, b.z], [a.x, y + 0.45, a.z]], [b.z - a.z, 0, a.x - b.x], UVQ, shade(BLOSSOM[k % 3], 0.7), surfaceTag('foliage')) }
  }
  {
    const t = (37 * Math.PI) / 180, E = Math.sin(t), N = Math.cos(t)
    for (let i = 0; i < 9; i++) block(out, -80 + E * i * 13 - 1.1, -80 + E * i * 13 + 1.1, -14 + N * i * 13 - 1.1, -14 + N * i * 13 + 1.1, y, y + 1.4, hex('#2c3e22'), surfaceTag('clipped'))
  }
  // L'ÎLE DES HESPÉRIDES: pale paving, hexagonal, the fountain's dry basin, the portico on its legs with an instrument on each, the mirror
  const hex6: EN[] = Array.from({ length: 6 }, (_, k): EN => [Math.cos((k / 6) * Math.PI * 2) * 15, Math.sin((k / 6) * Math.PI * 2) * 15])
  capPolygon(out, P(hex6), y + 0.11, PAVE, surfaceTag('granite'))
  for (let k = 0; k < 6; k++) {
    const [ax, az] = hex6[k], [bx, bz] = hex6[(k + 1) % 6]
    out.quad([[ax, y, az], [bx, y, bz], [bx, y + 0.11, bz], [ax, y + 0.11, az]], [bz - az, 0, ax - bx], UVQ, shade(PAVE, 0.8), 0)
  }
  prism(out, 0, 0, y + 0.11, y + 0.5, 6.4, 18, shade(PAVE, 1.05), surfaceTag('granite'))
  prism(out, 0, 0, y + 0.5, y + 0.52, 5.8, 18, hex('#7f8f92'))
  for (const [x, z] of [[-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2]] as const) {
    block(out, x - 0.16, x + 0.16, z - 0.16, z + 0.16, y + 0.1, y + 7.4, STEEL, surfaceTag('metal'))
    prism(out, x, z, y + 7.4, y + 8.4, 0.3, 8, shade(STEEL, 0.8), surfaceTag('metal'), 0.12)
  }
  for (const s of [-1, 1]) { strut(out, [-4.2, y + 7.2, s * 4.2], [4.2, y + 7.2, s * 4.2], 0.14, 0.22, STEEL); strut(out, [s * 4.2, y + 7.2, -4.2], [s * 4.2, y + 7.2, 4.2], 0.14, 0.22, STEEL) }
  out.quad([[-2.4, y + 5.4, -1.2], [2.4, y + 5.4, -1.2], [2.4, y + 7, 1.2], [-2.4, y + 7, 1.2]], [0, 0.83, -0.56], UVQ, hex('#dbe6ea'), surfaceTag('metal'))
  // the ventilation hoppers (the aerial's grey squares), low boxes with a grille
  for (const [e, n, u, v] of [[-22, 28, 3.5, 3], [-40, 5, 3, 2.5], [14, -15, 8, 6], [6, -22, 2.5, 2], [38, 45, 8, 6], [50, 25, 3, 3], [-68, -60, 3, 3], [-24, -90, 2.5, 2.5], [20, 40, 2.5, 2.5]] as const) {
    const m = oblong(e, n, u, v, 37).map(([x, z]) => ({ x, z }))
    capPolygon(out, m, y + 0.9, VENT, surfaceTag('metal'))
    for (let k = 0; k < 4; k++) { const a = m[k], b = m[(k + 1) % 4]; out.quad([[a.x, y, a.z], [b.x, y, b.z], [b.x, y + 0.9, b.z], [a.x, y + 0.9, a.z]], [b.z - a.z, 0, a.x - b.x], UVQ, shade(VENT, 0.8), surfaceTag('metal')) }
  }
  // the two white tents' sails (the aerial's at (−95, −42) and (−25, −95)): each a row of three peaks
  const sail = (e: number, n: number): void => {
    const t = (127 * Math.PI) / 180, ux = Math.sin(t), uz = Math.cos(t), vx = uz, vz = -ux, W = hex('#f1efe8')
    for (const u of [-16, 0, 16]) {
      const cx = e + ux * u, cz = n + uz * u, tip: [number, number, number] = [cx, y + 9, cz]
      const c = ([[-8, -7], [8, -7], [8, 7], [-8, 7]] as const).map(([a, b]): [number, number, number] => [cx + ux * a + vx * b, y + 3.6, cz + uz * a + vz * b])
      for (let k = 0; k < 4; k++) {
        const a = c[k], b = c[(k + 1) % 4], mx = (a[0] + b[0]) / 2 - cx, mz = (a[2] + b[2]) / 2 - cz
        out.quad([a, b, tip, tip], [mx, 8, mz], UVQ, W, 0)
      }
      for (const p of c) block(out, p[0] - 0.08, p[0] + 0.08, p[2] - 0.08, p[2] + 0.08, y, y + 3.6, STEEL)
    }
  }
  sail(-95, -42)
  sail(-22, -95)
  // the woods' rings, as the photograph has them
  const woods: EN[][] = [
    [[50, -15], [50, 42], [96, 42], [96, -15]], // the east
    [[-31, -47], [23, -47], [23, -78], [-31, -78]], // the south
    [[-55, -31], [-26, -31], [-26, -5], [-55, -5]], // the alley's west
    [[0, 57], [31, 57], [31, 96], [0, 96]], // the north
  ]
  return { mesh: out, woods }
}
