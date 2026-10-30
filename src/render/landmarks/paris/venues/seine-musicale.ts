/**
 * LA SEINE MUSICALE on the tip of the Île Seguin (Shigeru Ban and Jean de Gastines, 2014–17; the 1,150-seat auditorium, "a nest
 * or egg of braided wood" under solar sails that follow the sun; the Grande Seine for 4,000; an 800 m² screen on the
 * facade; the 7,410 m² Jardin Bellini on the roof: Wikipedia fr). OSM: way/547024399, 338 × 102 m, with four building:parts;
 * the egg is way/547024392, the Grande Seine's bowl way/1041475775.
 *
 * From the Pont de Sèvres, the quays and the Meudon bank (Commons "La Seine musicale at night", "(64634)", "(84847)", and the
 * Sèvres view downstream): a long low white ship on the island's point, stepped back in white terraces; the great LAWN sloping
 * over the big hall; and at the downstream end the EGG, its timber lattice and glass, the tall triangular SAIL of solar modules on
 * its rail standing in front of it. The sail is drawn where it stands round noon, to the south.
 *
 * Placed by point and size: `front` 50, local −z north-east, +x north-west along the island to the point. The plan is OSM's in
 * this frame. The heights are estimated from the photographs (the plinth 9 m, the white mass 24, the lawn's crest 37, the egg 44,
 * the sail 50), as is the sail's outline.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { ccw, plan } from '../museums/shapes.ts'
import { groundMid, quadN, type Sup, type V3 } from './bowl.ts'
import { edgesOf, row, sheet, walls } from './shell.ts'

const HX = 169
const HZ = 50.9
const OUTLINE: [number, number][] = [[169, 11], [88, 28], [3, 41], [-55, 47], [-120, 51], [-169, 51], [-160, 18], [-135, 24], [-125, -19], [-122, -31], [-157, -40], [-153, -51], [66, -1], [165, -3]]
/** the white mass over the Grande Seine, inside OSM's second part */
const MASS: [number, number][] = [[10, -8], [-5, -18], [-30, -29], [-122, -29], [-122, 22], [-108, 49], [-45, 46], [3, 40], [8, 18]]

const WHITE: Rgb = [0.93, 0.93, 0.91]
const WHITE_DK: Rgb = [0.76, 0.76, 0.74]
const GLASS: Rgb = [0.14, 0.2, 0.25]
const LAWN: Rgb = [0.3, 0.5, 0.2]
const LAWN2: Rgb = [0.34, 0.54, 0.22]
const TIMBER: Rgb = [0.72, 0.53, 0.3]
const EGG: Rgb = [0.25, 0.42, 0.5]
const EGG2: Rgb = [0.2, 0.36, 0.45]
const PV: Rgb = [0.24, 0.5, 0.46]
const PV2: Rgb = [0.33, 0.6, 0.52]
const STEEL: Rgb = [0.74, 0.76, 0.78]
const SCREEN: Rgb = [0.05, 0.06, 0.08]

const clampUnit = (v: number): number => Math.min(Math.max(v, -1), 1)

export function seineMusicale(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const glass = surfaceTag('glass')
  const metal = surfaceTag('metal')
  const planks = surfaceTag('planks')
  const g = groundMid(fit)
  const sx = fit.hx / HX
  const sz = fit.hz / HZ
  const k = Math.min(sx, sz)

  // ---- the plinth on the whole plan: dark strips of foyer, the white ship on the water
  const ring = ccw(plan(OUTLINE, sx, sz))
  const pH = g + 9
  walls(out, ring, g - 0.5, pH, WHITE, conc)
  capPolygon(out, ring, pH, WHITE_DK, conc)
  for (const e of edgesOf(ring)) {
    if (e.L < 8) continue
    sheet(out, e, 1, e.L - 1, g + 3.2, g + 7.2, 0.06, GLASS, glass)
    row(out, e, g + 3.2, 4, 5.5, 0.35, 0.12, WHITE, conc, 1)
    sheet(out, e, 0, e.L, pH - 0.6, pH + 0.4, 0.2, WHITE, conc)
  }

  // ---- the white mass, stepped back in two terraces with the glass of the upper foyers
  const mass = ccw(plan(MASS, sx, sz))
  const mH = g + 24
  walls(out, mass, pH, mH, WHITE, conc)
  for (const e of edgesOf(mass)) {
    if (e.L < 6) continue
    sheet(out, e, 1, e.L - 1, g + 12, g + 15, 0.06, GLASS, glass)
    sheet(out, e, 0, e.L, mH - 0.8, mH + 0.2, 0.25, WHITE, conc)
  }
  capPolygon(out, mass, mH, WHITE_DK, conc)

  // ---- the lawn over the Grande Seine: a low white drum carrying a green cap that slopes up towards the south-west
  const hx = -67 * sx
  const hz = 11 * sz
  const a0 = 42 * sx
  const b0 = 36 * sz
  const n = 48
  const part = (s: Sup, y: number | ((th: number) => number), s2: Sup, y2: number | ((th: number) => number), c: (i: number) => Rgb, face: 'out' | 'up', tag = 0): void => {
    // `band` works about the origin, so the hall's own pieces are drawn with their own centre
    const Y0 = typeof y === 'number' ? (): number => y : y
    const Y1 = typeof y2 === 'number' ? (): number => y2 : y2
    for (let i = 0; i < n; i++) {
      const t0 = (i / n) * Math.PI * 2
      const t1 = ((i + 1) / n) * Math.PI * 2
      const P = (S: Sup, t: number, yy: number): V3 => [hx + Math.cos(t) * S.a, yy, hz + Math.sin(t) * S.b]
      const m = (t0 + t1) / 2
      quadN(out, [P(s, t0, Y0(t0)), P(s, t1, Y0(t1)), P(s2, t1, Y1(t1)), P(s2, t0, Y1(t0))], face === 'out' ? [Math.cos(m), 0, Math.sin(m)] : [Math.cos(m) * 0.2, 1, Math.sin(m) * 0.2], c(i), tag)
    }
  }
  const tilt = (t: number): number => 3.2 * Math.sin(t) // the slope, up to +z, the river's south-west side
  part({ a: a0 + 2, b: b0 + 2, n: 2 }, mH, { a: a0 + 2, b: b0 + 2, n: 2 }, (t) => mH + 4 + tilt(t) * 0.5, () => WHITE, 'out', conc)
  part({ a: a0 + 2, b: b0 + 2, n: 2 }, (t) => mH + 4 + tilt(t) * 0.5, { a: a0, b: b0, n: 2 }, (t) => mH + 4.1 + tilt(t) * 0.5, () => WHITE, 'up', conc)
  const levels = [[1, 4.1], [0.8, 7], [0.58, 9.6], [0.36, 11.4], [0.14, 12.6]]
  for (let l = 0; l + 1 < levels.length; l++) {
    const [f0, y0] = levels[l]
    const [f1, y1] = levels[l + 1]
    part({ a: a0 * f0, b: b0 * f0, n: 2 }, (t) => mH + y0 + tilt(t) * 0.5 * f0, { a: a0 * f1, b: b0 * f1, n: 2 }, (t) => mH + y1 + tilt(t) * 0.5 * f1, (i) => ((i + l) % 2 ? LAWN : LAWN2), 'up')
  }
  part({ a: a0 * 0.14, b: b0 * 0.14, n: 2 }, (t) => mH + 12.6 + tilt(t) * 0.07, { a: 0.01, b: 0.01, n: 2 }, mH + 13, () => LAWN2, 'up')

  // ---- the screen on the upstream face of the mass
  const sxw = -122.2 * sx
  quadN(out, [[sxw, g + 10, -18 * sz], [sxw, g + 10, 16 * sz], [sxw, g + 22.5, 16 * sz], [sxw, g + 22.5, -18 * sz]], [-1, 0, 0], SCREEN, glass)

  // ---- the egg: OSM's 77 × 53 m plan, a lattice of timber over glass
  const ex = 23.5 * sx
  const ez = 14.5 * sz
  const ea = 36 * sx
  const eb = 25 * sz
  const ec = pH + 12 * Math.max(k, 0.4)
  const eh = 23
  const E = (lat: number, lon: number, d = 0): V3 => [ex + Math.cos(lat) * Math.cos(lon) * (ea + d), ec + Math.sin(lat) * (eh + d), ez + Math.cos(lat) * Math.sin(lon) * (eb + d)]
  const rows = 11
  const cols = 22
  const lat = (i: number): number => -0.55 + ((Math.PI / 2 + 0.55) * i) / rows
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const l0 = (j / cols) * Math.PI * 2
      const l1 = ((j + 1) / cols) * Math.PI * 2
      const m: V3 = [Math.cos(lat(i)) * Math.cos(l0), Math.sin(lat(i)), Math.cos(lat(i)) * Math.sin(l0)]
      quadN(out, [E(lat(i), l0), E(lat(i), l1), E(lat(i + 1), l1), E(lat(i + 1), l0)], m, (i + j) % 2 ? EGG : EGG2, glass)
      // the braid: two diagonals across each cell, thinning to the crown, and a ring every other row
      const w = 0.42
      if (i < rows - 1) {
        strut(out, E(lat(i), l0, 0.25), E(lat(i + 1), l1, 0.25), w, w, TIMBER, planks, false)
        strut(out, E(lat(i), l1, 0.25), E(lat(i + 1), l0, 0.25), w, w, TIMBER, planks, false)
      }
      if (i % 2 === 0) strut(out, E(lat(i), l0, 0.25), E(lat(i), l1, 0.25), w, w, TIMBER, planks, false)
    }
  }

  // ---- the sail of solar modules: a shell standing off the egg's south side on its rail, narrowing to a point above the crown
  const face = Math.PI * 0.72
  const off = 5
  const srows = 16
  const sailFoot = pH + 1.4
  const peak = g + 50
  const S = (f: number, u: number): V3 => {
    const y = sailFoot + (peak - sailFoot) * f
    // how far out the egg is at this height, the shell that far and `off` more; over the crown only the spike goes on up
    const q = clampUnit((y - ec) / eh)
    const rad = Math.sqrt(1 - q * q)
    const half = 0.86 * (1 - f) ** 0.6 + 0.005
    const lo = face + u * half
    return [ex + Math.cos(lo) * (ea * rad + off), y, ez + Math.sin(lo) * (eb * rad + off)]
  }
  for (let r = 0; r < srows; r++) {
    const f0 = r / srows
    const f1 = (r + 1) / srows
    const cells = Math.max(1, Math.round(12 * (1 - f0)))
    for (let c = 0; c < cells; c++) {
      const u0 = -1 + (2 * c) / cells
      const u1 = -1 + (2 * (c + 1)) / cells
      const mid = face + ((u0 + u1) / 2) * 0.86 * (1 - f0) ** 0.6
      const want: V3 = [Math.cos(mid), 0.25, Math.sin(mid)]
      const p = [S(f0, u0), S(f0, u1), S(f1, u1), S(f1, u0)]
      quadN(out, p, want, (r + c) % 2 ? PV : PV2, glass)
      quadN(out, p, [-want[0], -want[1], -want[2]], STEEL, metal)
    }
    strut(out, S(f0, -1), S(f1, -1), 0.34, 0.34, STEEL, metal, false)
    strut(out, S(f0, 1), S(f1, 1), 0.34, 0.34, STEEL, metal, false)
    for (let c = 1; c < cells; c++) strut(out, S(f0, -1 + (2 * c) / cells), S(f1, -1 + (2 * c) / cells), 0.2, 0.2, STEEL, metal, false)
    for (let c = 0; c < cells; c++) strut(out, S(f0, -1 + (2 * c) / cells), S(f0, -1 + (2 * (c + 1)) / cells), 0.2, 0.2, STEEL, metal, false)
  }
  // the rail, a steel ring on the plinth round the egg
  const rail = (t: number): V3 => [ex + Math.cos(t) * (ea + off + 0.5), pH + 1, ez + Math.sin(t) * (eb + off + 0.5)]
  for (let i = 0; i < 40; i++) strut(out, rail((i / 40) * Math.PI * 2), rail(((i + 1) / 40) * Math.PI * 2), 0.5, 0.6, STEEL, metal, false)
}
