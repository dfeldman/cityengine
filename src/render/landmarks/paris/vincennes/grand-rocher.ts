/**
 * LE GRAND ROCHER DE VINCENNES (Charles Letrosne, 1934; restored 2014; OSM way/262416016): 65 m of sprayed concrete on a
 * reinforced-concrete frame, the zoo's mountain — two tall slab-sided peaks over a broad apron of lower rock, pale
 * lilac-grey with dark rain streaks, grass on its ledges.
 * The shape is measured, not drawn: IGN's LiDAR HD surface model (tools/ign-mns.ts at 48.833805, 2.419719, radius 56)
 * on a 2 m grid, masked to OSM's outline, with the cells the 0.2 m orthophoto shows under tree canopy cut to the
 * apron floor (canopy over the cliffs, above 22 m, is kept as rock). Main peak 64 m at (−7, −3) east/north, the
 * south-east peak 49 m at (−4, −16), a 32 m pyramid to the west, a 20–28 m shelf to the east.
 * The grid (HF, rows north → south, one character a cell, its height in metres in the alphabet A) came out of the
 * session's scratchpad gen.cjs; to re-measure, re-run ign-mns and re-emit. `registerRing` puts east/north onto the fit.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { hash, mix, registerRing, tone, type Frame, type P2, type V3 } from '../museums/enframe.ts'
import { quadN } from '../venues/bowl.ts'

/** OSM's outline, metres east/north of the lidar centre (48.833805, 2.419719) */
const RING: P2[] = [[-49, 7], [-29, 14], [-14, 28], [-4, 38], [0, 26], [6, 20], [12, 23], [14, 29], [16, 28], [19, 25], [21, 18], [24, 11], [28, -3], [22, -17], [23, -21], [22, -25], [17, -49], [-7, -51], [-9, -39], [-20, -27], [-38, -23], [-40, -22]]
const A = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-='
// the grid's west edge, north edge, spacing (m); the sink of the outline's edge below grade (no summit box: the owner read it as a stray cube, 2026-11-18)
const E0 = -50, N0 = 38, STEP = 2, SINK = 3, EDGE_K = 0.45
// colours: the sprayed concrete, its rain streaks, the rust, the moss low down, the grass on its ledges
const ROCK: Rgb = hex('#999ba3'), STREAK: Rgb = hex('#6f6b6c'), RUST: Rgb = hex('#8a6f5c'), MOSS: Rgb = hex('#6f7262'), LEDGE: Rgb = hex('#6c7556')
// how many columns carry a dark streak / a rust streak; flatness above which a ledge greens; the moss line (m)
const STREAK_F = 0.22, RUST_F = 0.06, LEDGE_NY = 0.8, MOSS_H = 7
const HF = [
  '0000000000000000000000000000000000000000',
  '00000000000000000000003d0000000000000000',
  '0000000000000000000003330000000000000000',
  '0000000000000000000033330000000000000000',
  '0000000000000000000333334000000000000000',
  '0000000000000000003333333000000030000000',
  '0000000000000000033333333000000093000000',
  '00000000000000003333333333000000b8000000',
  '000000000000000333333333333000cca9800000',
  '00000000000000333333333333333cdcb9830000',
  '0000000000000333333333333333ddee97420000',
  '00000000000033333oqro33333333dda94320000',
  '0000000000033333pAECAxvsr33iida985202000',
  '000000003333333mvEEGHEBtrpnkjea895330000',
  '000003333333333uAHGHIFDxrpokjf9776320000',
  '000383333333333ACHHIKMEzxrokjga777222000',
  '0bba9333333i33pAKONNSSSIBuplhed377320000',
  '0ccb33b3333i3szGPQQSSSSOCsqlhgfd87700000',
  '00dd333333hiuBHPSSSX+-SMBrqljihea7630000',
  '00ffhi3333ijuGINSSY+--ZMAqpnmjfc87633000',
  '00gghih3333lnEKQSXX+-=+Nvrqpoie887752000',
  '000hii3333lllwJQTYXZ-=WGusqqoc9887750000',
  '000hiilnopnmlrHNSXXZ-+TDAxuuqca557760000',
  '000hikpsutqmmmsGNTXYZVLFDCAyqca367763000',
  '0000knrswvqmmmksGPVUSMGGGEBzqb9267630000',
  '0000jmrtvvqmkk3dvIMMIFGKJHBzsb7367600000',
  '0000loruuuokjhfdcqtlrEJMKJAvqh9566500000',
  '00000lpponkhffdcbbcclwINLJHvkhd777630000',
  '00000dilkhfecccbbbbbgrCLKIGykhfa87a30000',
  '0000029dfcbba99aaaabcnvHIGxpjhfc87b3b000',
  '000007035787668899abbelvwpmkjhffd7333000',
  '0000000003402058889aabeijjjjjigfea333000',
  '000000000000000567889dfhiiiiihgfda830000',
  '00000000000000003567aeghhihhhggfdb970000',
  '00000000000000000557af3gggggggffdc960000',
  '00000000000000000057aefggggffffeda970000',
  '000000000000000000068eefeeeeeeeeca970000',
  '000000000000000000007dededdddddcba900000',
  '000000000000000000000bccccccbbbaa9900000',
  '0000000000000000000009aaa33999a9a9800000',
  '000000000000000000000389a333888898700000',
  '0000000000000000000003789877876665500000',
  '0000000000000000000000668666776655000000',
  '0000000000000000000000554336333345000000',
  '0000000000000000000000533333000000000000',
  '0000000000000000000000000000000000000000',
]

export function grandRocher(out: MeshBuilder, fit: Fit): void {
  rockField(out, registerRing(RING, fit), HF, E0, N0)
}

/**
 * A faux-rock mass from a lidar height grid: HF rows run north → south, one character a cell (its height in metres in
 * alphabet A, '0' = no rock), STEP m apart from (e0, n0) at the north-west corner; F is the east/north frame. Shared
 * with the zoo's Belvédère (zoo.ts), which is the same 1934 sprayed concrete.
 */
export function rockField(out: MeshBuilder, F: Frame, HF: string[], E0: number, N0: number): void {
  const tag = surfaceTag('rock')
  const rows = HF.length, cols = HF[0].length
  const raw = (i: number, j: number): number => (j < 0 || j >= rows || i < 0 || i >= cols ? 0 : A.indexOf(HF[j][i]))
  // a cell on the outline's edge comes down halfway, so the apron slopes off instead of ending in a wall
  const H = (i: number, j: number): number => { const h = raw(i, j); if (h <= 0) return -SINK; return raw(i - 1, j) && raw(i + 1, j) && raw(i, j - 1) && raw(i, j + 1) ? h : h * EDGE_K }
  const P = (i: number, j: number): V3 => F.p(E0 + i * STEP, N0 - j * STEP, H(i, j))
  const colour = (a: V3, b: V3, c: V3, i: number, ha: number): Rgb => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const ny = Math.abs(n[1]) / (Math.hypot(n[0], n[1], n[2]) || 1)
    if (ny > LEDGE_NY && ha < 40) return tone(LEDGE, 0.85 + hash(i, ha) * 0.3)
    // rain runs down the cliffs in vertical stripes: a column's own streak, fading where the face lies back
    const s = hash(i * 3.1, 7), steep = 1 - ny
    let c0 = tone(ROCK, 0.92 + hash(i, Math.floor(ha / 6)) * 0.14)
    if (s < STREAK_F) c0 = mix(c0, STREAK, steep * (0.35 + hash(i, 2) * 0.4))
    else if (s > 1 - RUST_F) c0 = mix(c0, RUST, steep * 0.5)
    return ha < MOSS_H ? mix(MOSS, c0, ha / MOSS_H) : c0
  }
  const tri = (a: V3, b: V3, c: V3, i: number, ha: number): void => quadN(out, [a, b, c, c], [0, 1, 0], colour(a, b, c, i, ha), tag)
  for (let j = 0; j + 1 < rows; j++) {
    for (let i = 0; i + 1 < cols; i++) {
      const h00 = H(i, j), h10 = H(i + 1, j), h01 = H(i, j + 1), h11 = H(i + 1, j + 1)
      if (Math.max(h00, h10, h01, h11) <= 0) continue
      const p00 = P(i, j), p10 = P(i + 1, j), p01 = P(i, j + 1), p11 = P(i + 1, j + 1)
      const ha = (h00 + h10 + h01 + h11) / 4
      // split along the diagonal that keeps a ridge a ridge
      if (Math.abs(h00 - h11) < Math.abs(h10 - h01)) { tri(p00, p10, p11, i, ha); tri(p00, p11, p01, i, ha) }
      else { tri(p00, p10, p01, i, ha); tri(p10, p11, p01, i, ha) }
    }
  }
}
