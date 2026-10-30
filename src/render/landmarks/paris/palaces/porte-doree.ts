import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import { stair } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { fitted, pts, rectOn, slab, type F } from './common.ts'
import { lettersOn } from './showfront.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
/** the design footprint: OSM way 62819702's box turned to the Avenue Daumesnil (local −z faces bearing 208) */
const HX = 44.3
const HZ = 33.4

/** the podium, the top of the piers, the roof */
const POD = 2.6
const HEAD = 16.6
const TOP = 19

/**
 * Le Palais de la Porte Dorée (Albert Laprade, with Léon Jaussely, for the Colonial Exhibition of 1931; the Musée national de
 * l'histoire de l'immigration and the tropical aquarium): the one thing in Paris that looks like it, an Art Deco temple
 * whose whole front wall is a carving. What a rider on the Avenue Daumesnil (−z) sees:
 *
 * - the PERISTYLE: tall slim square piers on a podium, carried round the front and down both returns, under a deep flat roof;
 * - behind them the great BAS-RELIEF (Alfred Janniot's) covering the wall from the podium to the roof, drawn here as its
 *   texture, carved shapes crowded on the stone, rather than its figures;
 * - the middle: the broad flight of steps between stone cheeks and the tall door under its lattice, the name over it.
 *
 * The masses follow OSM's plan, its front wings, its entrance bay standing forward, the rear wings. Relief, piers, windows and steps from Commons "Palais Porte Doree Facade droite", with heights scaled off the
 * people on its steps; the rear and the sides beyond the peristyle are plain masses with tall windows, unchecked.
 */
export function porteDoree(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const stone = hex('#d0c4a6')
  const pier = hex('#c4baa2')
  const relief = hex('#b3a78f')
  const roofC = hex('#b4aa95')
  const dark: Rgb = [0.13, 0.13, 0.13]
  // ---- the body: everything inside the peristyle
  const WX = 37.5
  const WZ = -27.4
  block(out, -WX, WX, WZ, 28, 0, HEAD + 0.6, stone)
  block(out, -30.8, 40.2, 28, 33, 0, 10, stone)
  block(out, -41, -30.8, -14.7, 32.2, 0, 13, stone)
  block(out, 29.7, 40.2, -13.8, 33.2, 0, 13, stone)
  // the sides and the back, past the peristyle: tall windows, unchecked
  for (const [f, x, z0, z1] of [['-x', -41, -12, 32], ['+x', 40.2, -12, 33]] as const) {
    for (let z = z0 + 2; z < z1 - 1; z += 5.3) rectOn(out, f, x, z - 0.9, z + 0.9, 3.2, 10.6, dark, 0.05)
  }
  for (let x = -28; x < 39; x += 5.3) rectOn(out, '+z', 33, x - 0.9, x + 0.9, 2.6, 8.4, dark, 0.05)
  // the podium, the whole width, its courses, and the balustrade between the piers
  block(out, -44.2, 44.2, -32, -14.2, 0, POD, shade(stone, 0.93))
  for (let y = 0.65; y < POD; y += 0.65) rectOn(out, '-z', -32, -44.2, 44.2, y - 0.03, y + 0.03, shade(stone, 0.74), 0.03)
  // ---- the wall behind the piers, carved
  reliefOn(out, '-z', WZ, -WX, -7.2, POD, HEAD, relief, 1)
  reliefOn(out, '-z', WZ, 7.2, WX, POD, HEAD, relief, 2)
  reliefOn(out, '-x', -WX, WZ, -14.5, POD, HEAD, relief, 3)
  reliefOn(out, '+x', WX, WZ, -14.5, POD, HEAD, relief, 4)
  // the tall dark windows let into it, low down, one to every other bay
  const bay = 5.3
  for (const s of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const x = s * (11 + k * bay)
      if (k % 2 === 1) continue
      rectOn(out, '-z', WZ, x - 0.8, x + 0.8, POD + 0.3, POD + 6.2, dark, 0.13)
      rectOn(out, '-z', WZ, x - 0.04, x + 0.04, POD + 0.3, POD + 6.2, shade(stone, 0.7), 0.15)
    }
  }
  // ---- the piers, with the balustrade between them
  const piersAlong = (f: F, plane: number, t0: number, t1: number, n: number): void => {
    for (let i = 0; i <= n; i++) {
      const t = t0 + ((t1 - t0) * i) / n
      const along = f === '-z' || f === '+z'
      const hw = 0.52
      const hd = 0.34
      const [x0, x1, z0, z1] = along ? [t - hw, t + hw, plane - hd, plane + hd] : [plane - hd, plane + hd, t - hw, t + hw]
      block(out, x0, x1, z0, z1, POD, HEAD, pier)
      block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, POD, POD + 0.5, shade(pier, 0.92))
    }
  }
  const PZ = -31.3
  piersAlong('-z', PZ, -43.6, -9, 7)
  piersAlong('-z', PZ, 9, 43.6, 7)
  piersAlong('-x', -43.6, PZ + 5, -14.8, 3)
  piersAlong('+x', 43.6, PZ + 5, -14.8, 3)
  for (const [a, b] of [[-43.6, -9], [9, 43.6]] as const) {
    block(out, a, b, PZ - 0.14, PZ + 0.14, POD, POD + 0.14, shade(pier, 0.95))
    block(out, a, b, PZ - 0.16, PZ + 0.16, POD + 0.98, POD + 1.12, pier)
    for (let x = a; x < b; x += 0.5) block(out, x - 0.06, x + 0.06, PZ - 0.06, PZ + 0.06, POD + 0.14, POD + 0.98, shade(pier, 0.9))
  }
  // ---- the head and the deep flat roof, over the plan (a little proud of it, as a cornice)
  block(out, -44.6, 44.6, -32, WZ, HEAD, HEAD + 0.9, shade(pier, 1.03))
  block(out, -44.6, -WX, WZ, -14, HEAD, HEAD + 0.9, shade(pier, 1.03))
  block(out, WX, 44.6, WZ, -14, HEAD, HEAD + 0.9, shade(pier, 1.03))
  block(out, -8, 8, -33.5, WZ, HEAD, TOP - 0.6, shade(pier, 1.03))
  slab(out, pts([-45.3, -32.8, 45.3, -32.8, 45.3, -13.4, 41, -13.4, 41, 28.5, -41, 28.5, -41, -13.4, -45.3, -13.4]), HEAD + 0.9, HEAD + 1.4, roofC, shade(roofC, 0.5))
  block(out, -32, 32, -24, 26, HEAD + 1.4, TOP, roofC)
  // the soffit over the walk, in coffers
  for (let x = -40; x <= 40; x += 5.3) rectOn(out, '-z', -32.85, x - 0.15, x + 0.15, HEAD + 0.92, HEAD + 1.38, shade(roofC, 0.8), 0.01)
  // ---- the middle: the door, its lattice, the name, the steps
  const cz = -33.4
  block(out, -7, 7, cz, WZ, POD, HEAD, stone)
  for (const s of [-1, 1]) block(out, s * 7 - 1.5, s * 7 + 1.5, cz - 0.2, cz + 3, POD, HEAD, shade(pier, 1.02))
  rectOn(out, '-z', cz, -5.5, 5.5, POD, 13, dark, 0.05)
  // the lattice over the door: gold on dark, in lozenges
  const gold = hex('#b58f4f')
  const dx = 0.92
  const dy = 1.2
  for (let row = 0; row < 5; row++) {
    for (let col = -5; col <= 5; col++) {
      if ((row + col) % 2 !== 0) continue
      const x = col * dx * 0.92
      const y = 7.2 + row * dy
      lozenge(out, x, y, cz - 0.08, dx * 0.9, dy * 0.9, gold)
      lozenge(out, x, y, cz - 0.1, dx * 0.56, dy * 0.56, dark)
    }
  }
  rectOn(out, '-z', cz, -5.5, 5.5, POD, 6.9, shade(dark, 1.8), 0.07)
  for (const x of [-3.67, -1.83, 0, 1.83, 3.67]) rectOn(out, '-z', cz, x - 0.09, x + 0.09, POD, 6.9, gold, 0.1)
  rectOn(out, '-z', cz, -6.2, 6.2, 13.1, 14.7, shade(stone, 0.92), 0.05)
  lettersOn(out, '-z', cz, 0, 13.5, 'PALAIS DE LA PORTE DOREE', { h: 0.62, c: shade(stone, 0.42), wide: 0.42, th: 0.09, gap: 0.08, d: 0.08 })
  // the broad flight, its stone cheeks, standing out on the pavement
  const fx = 12.2
  stair(out, { x: -fx, z: -32 }, { x: fx, z: -32 }, 0, POD, { anchor: 'top', riser: 0.16, splay: 0.14, colour: shade(stone, 0.96), material: 'ashlar', from: 0, to: 1 })
  for (const s of [-1, 1]) {
    block(out, s * (fx + 0.3) - 0.8, s * (fx + 0.3) + 0.8, -35.2, -32, 0, POD + 0.2, shade(stone, 0.9))
  }

}

/** A carved wall: a crowd of little shapes at all angles on the stone, seeded, standing a few centimetres proud. */
function reliefOn(out: MeshBuilder, f: F, plane: number, t0: number, t1: number, y0: number, y1: number, c: Rgb, seed: number): void {
  rectOn(out, f, plane, t0, t1, y0, y1, c, 0.04)
  const along = f === '-z' || f === '+z'
  const sign = f === '-z' || f === '-x' ? -1 : 1
  const n: [number, number, number] = along ? [0, 0, sign] : [sign, 0, 0]
  let r = seed * 7919 + 13
  const rnd = (): number => { r = (r * 16807) % 2147483647; return r / 2147483647 }
  const area = (t1 - t0) * (y1 - y0)
  const count = Math.round(area / 0.42)
  const P = (t: number, y: number, d: number): [number, number, number] => (along ? [t, y, plane + sign * d] : [plane + sign * d, y, t])
  for (let i = 0; i < count; i++) {
    const t = t0 + rnd() * (t1 - t0)
    const y = y0 + rnd() * (y1 - y0)
    // upright for the most part, like the figures and the palms that fill the carving
    const a = (rnd() < 0.65 ? Math.PI / 2 : 0) + (rnd() - 0.5) * 1.3
    const l = 0.28 + rnd() * 0.8
    const w = 0.07 + rnd() * 0.17
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    const tone = shade(c, 0.82 + rnd() * 0.3)
    const d = 0.05 + (i % 5) * 0.012
    const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
    const q: [number, number][] = [[-l * ca - w * sa, -l * sa + w * ca], [l * ca - w * sa, l * sa + w * ca], [l * ca + w * sa, l * sa - w * ca], [-l * ca + w * sa, -l * sa - w * ca]]
    out.quad(q.map(([dt, dy]) => P(clamp(t + dt, t0, t1), clamp(y + dy, y0, y1), d)) as [[number, number, number], [number, number, number], [number, number, number], [number, number, number]], n, UV, tone, FIXED)
  }
}

function lozenge(out: MeshBuilder, x: number, y: number, z: number, w: number, h: number, c: Rgb): void {
  out.quad([[x, y - h / 2, z], [x + w / 2, y, z], [x, y + h / 2, z], [x - w / 2, y, z]], [0, 0, -1], UV, c, FIXED)
}
