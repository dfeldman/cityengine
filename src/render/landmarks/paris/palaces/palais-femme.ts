import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts } from './common.ts'
import { lettersAlong } from './showfront.ts'
import { baysOf, wallOn, type Wall } from './wall.ts'

/** the design footprint: OSM way 63638302's box turned to the Rue de Charonne (local −z faces bearing 340) */
const HX = 36.95
const HZ = 26.6
const EAVES = 22.6

/** Way 63638302 in the model's frame. */
const PLAN = pts([
  36.9, -13.8, 35.8, 25.3, 23.9, 25.5, 23.6, 21.1, 20.2, 21.3, 20.4, 25.6, -15, 26.3, -15.1, 18.8, -21.3, 19.8, -21.3, 26.4, -30.3, 26.6,
  -31.4, 10.9, -30.4, 9.8, -30.6, -11.8, -31.6, -13, -36.9, -12.8, -36.9, -21.8, -31.5, -21.8, -30.7, -26.2, 24.6, -26.6,
])

/** the two street walls and the cut corner between them, in ring order */
const CHARONNE = [{ x: -30.7, z: -26.4 }, { x: 24.6, z: -26.6 }] as const
const CORNER = [{ x: 24.6, z: -26.6 }, { x: 36.9, z: -13.8 }] as const
const FAIDHERBE = [{ x: 36.9, z: -13.8 }, { x: 35.8, z: 25.3 }] as const

interface Tones { brick: Rgb; red: Rgb; stone: Rgb; rubble: Rgb; iron: Rgb; glass: Rgb }

/**
 * Le Palais de la Femme (Auguste Labussière and Charles Longerey, 1910: a workers' hostel, the Salvation Army's women's
 * residence since 1926), on the corner of the Rue de Charonne and the Rue Faidherbe. An enormous yellow-brick block, Rationalist
 * and proud of it. What a rider sees:
 *
 * - the rough MEULIÈRE ground floor, cut by great round arches with dark iron and glass in them, stone at the springings;
 * - four storeys of plain windows in yellow brick, red-brick heads and bands, and the arcaded top storey under the wide eaves;
 * - the PAVILIONS standing proud on the corner and the ends, each with its stack of arched windows and iron balconies and a
 *   wide bracketed roof of its own; on the cut corner, three arches, the name and the balcony over them.
 *
 * Plan is OSM's. Commons "Palais de la Femme, vu depuis la Rue de Charonne" and the old postcard "Rue Charonne-Palais de la
 * Femme 5": heights scaled off the arches: meulière to 6.2 m, eaves 22.6, pavilions 24, their ridges 27.
 */
export function palaisFemme(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#ccb07a', '#5f5c5b')
  const t: Tones = { brick: p.stone, red: hex('#a4604a'), stone: hex('#ded3bb'), rubble: hex('#8f7c63'), iron: [0.13, 0.13, 0.13], glass: p.glass }
  extrude(out, [PLAN], p, { eaves: EAVES, storeys: [], bay: 4, rise: 2.4, inset: 3, dormers: false })
  // ---- the two long walls
  const ch = wallOn(out, CHARONNE[0], CHARONNE[1])
  // Charonne: its far-end pavilion on the left, then the long wing; the corner pavilion is on the cut corner
  dress(ch, 0, 11.5, t, true)
  dress(ch, 11.5, ch.L, t, false)
  const fa = wallOn(out, FAIDHERBE[0], FAIDHERBE[1])
  dress(fa, 0, fa.L - 11, t, false)
  dress(fa, fa.L - 11, fa.L, t, true)
  // ---- the corner pavilion
  const co = wallOn(out, CORNER[0], CORNER[1])
  corner(out, co, t, p.slate)
  // the far pavilions' roofs: broad and low, hanging out over the walls
  pavilionCap(out, -30.7, -19, -26.4, -15, t, p.slate)
  pavilionCap(out, 25, 36.3, 14, 25.3, t, p.slate)
  // the eaves' overhang along the two wings
  ch.slab(11.5, ch.L, EAVES - 0.5, EAVES, 1.1, shade(t.stone, 0.92))
  fa.slab(0, fa.L - 11, EAVES - 0.5, EAVES, 1.1, shade(t.stone, 0.92))
}

/** A stretch of street wall: the meulière and its arches, the brick storeys, the top arcade. `pav`: a pavilion, standing proud. */
function dress(w: Wall, u0: number, u1: number, t: Tones, pav: boolean): void {
  const d = pav ? 0.7 : 0.1
  const top = pav ? 24 : EAVES
  if (pav) {
    w.slab(u0, u1, 0, top, d, t.brick)
  } else {
    w.rect(u0, u1, 0, top, t.brick, d)
  }
  // ---- the ground floor
  w.rect(u0, u1, 0, 6.2, t.rubble, d + 0.02)
  // its rough stones, a seeded scatter
  let r = Math.round(u0 * 37 + w.L * 11 + 5)
  const rnd = (): number => { r = (r * 16807 + 11) % 2147483647; return r / 2147483647 }
  for (let i = 0; i < (u1 - u0) * 4; i++) {
    const x = u0 + rnd() * (u1 - u0 - 0.6)
    const y = 0.1 + rnd() * 5.5
    w.rect(x, x + 0.25 + rnd() * 0.4, y, y + 0.16 + rnd() * 0.22, shade(t.rubble, 0.72 + rnd() * 0.5), d + 0.03)
  }
  const { mids, step } = baysOf(u1 - u0, pav ? 5.6 : 5.2, 0.9)
  for (const m of mids) {
    const c = u0 + m
    const aw = step * 0.74
    w.arch(c, 0, aw + 0.5, 5.35, t.red, d + 0.04)
    w.arch(c, 0, aw, 5.1, t.iron, d + 0.05)
    w.rect(c - 0.05, c + 0.05, 0, 4.9, shade(t.iron, 2), d + 0.07)
    w.rect(c - aw / 2, c + aw / 2, 2.8, 2.92, shade(t.iron, 2), d + 0.07)
  }
  w.slab(u0, u1, 6.1, 6.55, d + 0.3, t.stone)
  // ---- the windows, narrower than the arches, in their brick
  const win = baysOf(u1 - u0, pav ? 2.9 : 2.75, 0.8)
  const rows = [7.3, 10.3, 13.3, 16.3]
  for (const m of win.mids) {
    const c = u0 + m
    for (const y of rows) {
      w.rect(c - 0.74, c + 0.74, y - 0.1, y + 2.1, t.stone, d + 0.03)
      w.rect(c - 0.58, c + 0.58, y, y + 1.96, t.glass, d + 0.05)
    }
    // the top storey's round-headed lights, each with its red-brick head
    w.arch(c, 19.4, 1.56, 2.4, t.red, d + 0.03)
    w.arch(c, 19.4, 1.16, 2.1, t.glass, d + 0.05)
  }
  for (const y of [9.75, 12.75, 15.75, 18.75]) w.rect(u0, u1, y - 0.1, y + 0.1, t.red, d + 0.02)
  if (pav) {
    // the stack of balconies up the pavilion's middle
    const c = (u0 + u1) / 2
    for (const y of [7.1, 10.1, 13.1, 16.1]) balcony(w, c, y, 3.3, d, t)
    w.arch(c, 19.4, 3.6, 3.4, t.red, d + 0.04)
    w.arch(c, 19.4, 3.1, 3.1, t.glass, d + 0.06)
  }
}

function balcony(w: Wall, c: number, y: number, wide: number, d: number, t: Tones): void {
  w.slab(c - wide / 2, c + wide / 2, y - 0.12, y + 0.02, d + 0.7, t.stone)
  w.rect(c - wide / 2, c + wide / 2, y + 0.02, y + 0.95, t.iron, d + 0.68)
  for (let u = -wide / 2 + 0.16; u < wide / 2; u += 0.32) w.rect(c + u - 0.1, c + u + 0.1, y + 0.1, y + 0.87, shade(t.brick, 0.8), d + 0.7)
}

function corner(out: MeshBuilder, w: Wall, t: Tones, slate: Rgb): void {
  const d = 1.1
  const L = w.L
  const c = L / 2
  w.slab(-1, L + 1, 0, 24, d, t.brick)
  // the stone arcade of three, on piers, and the rubble between
  w.rect(-1, L + 1, 0, 6.2, t.rubble, d + 0.02)
  for (const u of [-5.2, 0, 5.2]) {
    const a = c + u
    w.arch(a, 0, 4.7, 5.5, t.stone, d + 0.04)
    w.arch(a, 0, 3.9, 5.1, t.iron, d + 0.05)
    w.rect(a - 0.05, a + 0.05, 0, 4.9, shade(t.iron, 2), d + 0.07)
  }
  w.slab(-1.2, L + 1.2, 6.1, 6.6, d + 0.5, t.stone)
  // the balcony across the first floor, and the name in its band
  balcony(w, c, 6.75, L * 0.7, d, t)
  w.rect(c - 5.4, c + 5.4, 8, 9.1, t.stone, d + 0.05)
  lettersAlong(out, w.at(0, d + 0.06), w.at(L, d + 0.06), L / 2, 8.2, 'LE PALAIS DE LA FEMME', { h: 0.66, c: shade(t.red, 0.7), wide: 0.5, th: 0.1, gap: 0.09, d: 0.02 })
  for (const u of [-3.5, 3.5]) for (const y of [9.6, 12.6, 15.6]) {
    w.rect(c + u - 0.84, c + u + 0.84, y - 0.1, y + 2.1, t.stone, d + 0.03)
    w.rect(c + u - 0.66, c + u + 0.66, y, y + 1.96, t.glass, d + 0.05)
  }
  for (const y of [9.6, 12.6, 15.6]) balcony(w, c, y, 3, d, t)
  w.arch(c, 18.6, 4.6, 4.3, t.red, d + 0.04)
  w.arch(c, 18.6, 4, 4, t.glass, d + 0.06)
  for (const y of [11.75, 14.75, 17.75]) w.rect(-1, L + 1, y, y + 0.2, t.red, d + 0.02)
  // its broad roof
  const a = w.at(-1.5, d + 1)
  const b = w.at(L + 1.5, d + 1)
  const e = w.at(L + 1.5, -9)
  const f = w.at(-1.5, -9)
  const cx = (a.x + b.x + e.x + f.x) / 4
  const cz = (a.z + b.z + e.z + f.z) / 4
  for (const [q, s] of [[a, b], [b, e], [e, f], [f, a]] as const) {
    const nx = (q.x + s.x) / 2 - cx
    const nz = (q.z + s.z) / 2 - cz
    const l = Math.hypot(nx, 6, nz)
    out.quad([[q.x, 24, q.z], [s.x, 24, s.z], [cx + (s.x - cx) * 0.35, 27, cz + (s.z - cz) * 0.35], [cx + (q.x - cx) * 0.35, 27, cz + (q.z - cz) * 0.35]],
      [nx / l, 6 / l, nz / l], [[0, 0], [1, 0], [1, 1], [0, 1]], slate, 0)
  }
  block(out, cx - 2, cx + 2, cz - 2, cz + 2, 26.9, 27.1, shade(slate, 0.8))
  // the eaves' stone band
  w.slab(-1.5, L + 1.5, 23.6, 24, d + 1, t.stone)
}

/** A far pavilion's broad low roof, overhanging its walls. */
function pavilionCap(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, t: Tones, slate: Rgb): void {
  block(out, x0 - 1, x1 + 1, z0 - 1, z1 + 1, 23.6, 24, t.stone)
  roof(out, x0 - 1, x1 + 1, z0 - 1, z1 + 1, 24, 2.6, 3.5, 3.5, slate)
}
