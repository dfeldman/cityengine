import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, rectOn } from '../palaces/common.ts'
import { pointedOn, roseOn } from './churches.ts'
import { archesOn, band, drumArches, FIXED, graded, ring, walls } from './common.ts'

/*
 * SAINT-JEAN DE MONTMARTRE (Anatole de Baudot, 1894–1904), the "Saint-Jean-des-Briques" on the Place des Abbesses, the first
 * church in France in reinforced cement, and Art Nouveau from top to bottom. It is RED-ORANGE BRICK threaded with beads of
 * pale TURQUOISE stoneware: between two octagonal turrets with dark flat hats and open belfries, a tall bay filled by a
 * great Gothic window in deep blue, ringed with ceramic medallions, the arched struts of the concrete frame showing over
 * it; on top a lacy CROWN, an ogee of grey-green cement tracery open to the sky; at the foot the deep ogee porch.
 * Either side the low aisles with their double-arched windows, little hooded doors and, along the top, their
 * balustrades of interlaced ceramic arcs.
 *
 * In the city the outline (way 77807770, five levels) came out as a flat brick lump. The model replaces it: the walls are
 * OSM's ring, the rest is the Commons elevation (`File:St Jean de Montmartre.jpg`) scaled to OSM's turrets; the sides and
 * the back are the ring with plausible windows, not checked against a photograph. Heights are read off that one photograph.
 * Frame: −z the portal, toward bearing 42 (osmium, 2026-10-30); the facade's axis is x = −3.4, not the box's.
 */
const HX = 14.35
const HZ = 27.1

const BRICK: Rgb = hex('#b5634a')
const CERAM: Rgb = hex('#9cc4bd')
const CEMENT: Rgb = hex('#8f9896')
const PALE: Rgb = hex('#c8cfc8')
const BLUE: Rgb = hex('#27406f')
const DARK: Rgb = hex('#1c1d20')
const ZINC: Rgb = hex('#3d4347')
const ROOF: Rgb = hex('#5b5f60')

const AX = -3.4
const FZ = -21.0
const AISLE = 11.2

/** OSM's outline with its smallest jogs left out: the nave's aisles and buttresses, the transept, the choir. */
const OUTLINE = ring([7.3, -18.4, 7.7, -14.5, 9.6, -13.2, 9.9, -9.5, 8.8, -7.5, 9.0, -3.5, 9.4, 0.5, 12.5, 0.4, 13.7, 7.6, 14.3, 12.6, 12.1, 18.4, 13.4, 19.1,
  11.7, 23.8, 10.4, 23.2, 9.2, 26.2, 6.9, 27.1, 3.9, 26.0, 5.1, 22.3, -1.9, 22.9, -4.4, 21.3, -5.0, 20.8, -5.5, 14.9, -5.8, 14.5, -11.9, 14.7, -12.5, 14.9, -13.7, 13.2, -14.0, 12.7, -13.0, 11.1, -13.6, 10.4,
  -14.2, 3.8, -13.9, 3.2, -13.8, 3.4, -10.8, 3.0, -11.2, -0.6, -11.5, -1.2, -11.7, -5.2, -13.3, -6.5, -13.8, -9.9, -14.1, -10.5, -13.6, -10.6, -12.7, -11.9, -12.5, -12.3, -13.5, -19.1, -8.4, -19.8, -8.4, -20.7,
  -7.8, -21.6, -6.0, -21.7, -5.1, -21.0, -1.7, -20.8, -0.7, -22.3, 0.8, -22.6, 2.1, -21.8, 2.2, -20.9, 6.8, -21.5])
/** The low block on the street at its south corner, the same way's, standing forward of the front. */
const LOW = ring([14.0, -27.1, 12.8, -20.2, 11.1, -17.6, 8.6, -17.3, 7.3, -18.4, 6.8, -21.5, 6.2, -26.2])

export function saintJeanMontmartre(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  // the outline in brick to the aisles' eaves, its ceramic band, its flat roof; its round-headed windows
  walls(out, OUTLINE, 0, AISLE, BRICK, ROOF)
  band(out, OUTLINE, AISLE - 0.3, 0.3, 0.12, CERAM)
  band(out, OUTLINE, 3.0, 0.14, 0.05, shade(BRICK, 0.82))
  archesOn(out, OUTLINE, 4.8, 1.5, 3.8, 4.8, shade(BLUE, 0.8), 4.0)

  // the nave and the transept over it, the choir; their clerestory
  block(out, -10.8, 4.0, -19.0, 15.0, AISLE, 19.5, BRICK)
  block(out, -11.0, 4.2, -19.2, 15.2, 19.5, 19.9, CERAM)
  block(out, -13.2, 12.5, 3.8, 13.2, AISLE, 17.2, BRICK)
  block(out, -13.4, 12.7, 3.6, 13.4, 17.2, 17.6, CERAM)
  block(out, -4.4, 8.6, 13.0, 22.0, AISLE, 16.0, BRICK)
  block(out, -4.6, 8.8, 12.8, 22.2, 16.0, 16.35, CERAM)
  for (const [x0, x1, z0, z1, y] of [[-10.8, 4.0, -19, 15, 19.9], [-13.2, 12.5, 3.8, 13.2, 17.6], [-4.4, 8.6, 13, 22, 16.35]]) block(out, x0 + 0.2, x1 - 0.2, z0 + 0.2, z1 - 0.2, y, y + 0.1, ROOF)
  for (let z = -16; z < 3; z += 4.4) {
    pointedOn(out, '-x', -10.8, z, 12.6, 2.2, 5.6, BLUE)
    pointedOn(out, '+x', 4.0, z, 12.6, 2.2, 5.6, BLUE)
  }
  pointedOn(out, '-x', -13.2, 8.5, 11.9, 3.8, 4.6, BLUE)
  pointedOn(out, '+x', 12.5, 8.5, 11.9, 3.8, 4.6, BLUE)
  pointedOn(out, '+z', 22.0, 2.1, 11.4, 3.2, 4.2, BLUE)

  // THE FRONT: the bay between the turrets, standing forward of the nave
  block(out, AX - 3.4, AX + 3.4, FZ, -16.0, 0, 21.8, BRICK)
  block(out, AX - 3.2, AX + 3.2, FZ + 0.2, -16.2, 21.8, 21.9, ROOF)
  for (const s of [-1, 1]) turret(out, AX + s * 3.6, FZ - 0.1)
  // the great window, its mullions and tracery, the medallions up each side, the panel of lozenges under it
  pointedOn(out, '-z', FZ, AX, 7.6, 5.2, 9.8, BLUE)
  for (const t of [-1.3, 0, 1.3]) rectOn(out, '-z', FZ, AX + t - 0.05, AX + t + 0.05, 7.6, 15.0, PALE, 0.11)
  for (const y of [10.4, 13.0]) rectOn(out, '-z', FZ, AX - 2.6, AX + 2.6, y, y + 0.1, PALE, 0.11)
  beam(out, [AX - 2.6, 13.0, FZ - 0.13], [AX, 17.2, FZ - 0.13], 0.09, PALE)
  beam(out, [AX + 2.6, 13.0, FZ - 0.13], [AX, 17.2, FZ - 0.13], 0.09, PALE)
  for (const s of [-1, 1]) {
    rectOn(out, '-z', FZ, AX + s * 2.95 - 0.26, AX + s * 2.95 + 0.26, 7.2, 17.0, CERAM, 0.04)
    for (let y = 8.0; y < 16.6; y += 1.7) roseOn(out, '-z', FZ, AX + s * 2.95, y, 0.16, PALE, CEMENT)
  }
  // the porch: its ceramic frame and ogee hood, the door, the panel of lozenges over it
  rectOn(out, '-z', FZ, AX - 2.9, AX + 2.9, 0, 7.0, CERAM, 0.03)
  block(out, AX - 2.65, AX - 1.9, FZ - 0.5, FZ, 0, 5.4, CEMENT)
  block(out, AX + 1.9, AX + 2.65, FZ - 0.5, FZ, 0, 5.4, CEMENT)
  archOn(out, '-z', FZ, AX, 0, 3.6, 4.4, CEMENT, 0.07)
  archOn(out, '-z', FZ, AX, 0, 3.0, 3.9, DARK, 0.12)
  const ogee = (w: number, y: number, h: number, r: number, c: Rgb, z: number): void => {
    beam(out, [AX - w, y, z], [AX - w * 0.75, y + h * 0.5, z], r, c)
    beam(out, [AX - w * 0.75, y + h * 0.5, z], [AX - w * 0.15, y + h * 0.82, z], r, c)
    beam(out, [AX - w * 0.15, y + h * 0.82, z], [AX, y + h, z], r, c)
    beam(out, [AX + w, y, z], [AX + w * 0.75, y + h * 0.5, z], r, c)
    beam(out, [AX + w * 0.75, y + h * 0.5, z], [AX + w * 0.15, y + h * 0.82, z], r, c)
    beam(out, [AX + w * 0.15, y + h * 0.82, z], [AX, y + h, z], r, c)
  }
  ogee(2.9, 4.2, 3.2, 0.22, PALE, FZ - 0.5)
  ogee(2.3, 4.2, 2.5, 0.09, CEMENT, FZ - 0.28)
  lozenges(out, AX - 1.4, AX + 1.4, 4.8, 5.9, FZ - 0.14, 3, CEMENT)

  // over the window, the concrete struts arching across and the row of belfry openings
  ogee(3.3, 16.7, 2.7, 0.14, PALE, FZ - 0.12)
  for (const t of [-2.2, 0, 2.2]) pointedOn(out, '-z', FZ, AX + t, 19.2, 1.7, 2.4, DARK)

  crown(out)

  // THE AISLES' FRONTS: door, lozenge window, the double-arched window, the balustrade
  aisle(out, -10.95, -19.55, 2.55)
  aisle(out, 4.5, -21.2, 2.3)
  // the low block on the street at the south corner
  walls(out, LOW, 0, 5.6, BRICK, ROOF)
  band(out, LOW, 5.4, 0.3, 0.1, CERAM)
  archesOn(out, LOW, 2.2, 1.4, 2.4, 3.0, shade(BLUE, 0.8), 3.0)
}

/** One octagonal turret: brick, pale edges, slits; the open belfry and its dark flat hat. */
function turret(out: MeshBuilder, x: number, z: number): void {
  const r = 1.72
  prism(out, x, z, 0, 22.0, r, 8, BRICK, FIXED, r, false)
  for (const y of [7.4, 14.0, 21.8]) prism(out, x, z, y, y + 0.28, r + 0.1, 8, CERAM, FIXED, r + 0.1, false)
  for (const y of [3.2, 9.6, 16.2]) {
    box(out, x, y + 1.0, z - r * 0.92, 0.17, 1.0, 0.04, DARK, FIXED)
  }
  prism(out, x, z, 22.0, 25.0, r - 0.05, 8, CERAM, FIXED, r - 0.05, false)
  drumArches(out, x, z, r - 0.05, 22.3, 8, 0.85, 2.3, DARK)
  prism(out, x, z, 25.0, 25.3, r + 0.42, 8, ZINC, FIXED, r + 0.42, false)
  prism(out, x, z, 25.3, 26.1, r + 0.42, 8, ZINC, FIXED, 0.5, true)
}

/** The crown over the bay: an ogee of grey-green cement, open tracery against the sky, three tiers of lancets. */
function crown(out: MeshBuilder): void {
  const z = FZ + 0.25
  const y0 = 21.8
  const rail = (a: [number, number], b: [number, number], r: number): void => { beam(out, [AX + a[0], y0 + a[1], z], [AX + b[0], y0 + b[1], z], r, CEMENT) }
  // the sill, the outline up to its blunt top
  block(out, AX - 3.6, AX + 3.6, z - 0.2, z + 0.2, y0 - 0.1, y0 + 0.25, CEMENT)
  const prof: [number, number][] = [[3.45, 0], [3.5, 1.6], [3.2, 3.2], [2.3, 4.7], [1.25, 5.65], [0.55, 6.15], [0, 6.45]]
  for (const s of [-1, 1]) {
    for (let i = 0; i + 1 < prof.length; i++) rail([s * prof[i][0], prof[i][1]], [s * prof[i + 1][0], prof[i + 1][1]], 0.2)
  }
  prism(out, AX, z, y0 + 6.35, y0 + 6.9, 0.28, 8, CEMENT, FIXED, 0.12, true)
  // the lancets, bottom row of three, then two, then one
  const lancet = (cx: number, y: number, w: number, h: number): void => {
    rail([cx - w, y], [cx - w, y + h * 0.55], 0.09)
    rail([cx + w, y], [cx + w, y + h * 0.55], 0.09)
    rail([cx - w, y + h * 0.55], [cx - w * 0.45, y + h * 0.86], 0.09)
    rail([cx + w, y + h * 0.55], [cx + w * 0.45, y + h * 0.86], 0.09)
    rail([cx - w * 0.45, y + h * 0.86], [cx, y + h], 0.09)
    rail([cx + w * 0.45, y + h * 0.86], [cx, y + h], 0.09)
  }
  for (const c of [-2.15, 0, 2.15]) lancet(c, 0.25, 0.95, 2.4)
  rail([-3.3, 2.65], [3.3, 2.65], 0.1)
  for (const c of [-1.15, 1.15]) lancet(c, 2.65, 0.95, 2.1)
  rail([-2.3, 4.72], [2.3, 4.72], 0.08)
  lancet(0, 4.72, 0.6, 1.5)
}

/** An aisle's front at (x, z), `hw` either side: its little hooded door, the lozenge window, the double arch, the ceramic balustrade. */
function aisle(out: MeshBuilder, x: number, z: number, hw: number): void {
  const w = hw - 0.5
  rectOn(out, '-z', z, x - 1.2, x + 1.2, 0, 3.4, CEMENT, 0.05)
  archOn(out, '-z', z, x, 0, 1.6, 2.9, DARK, 0.09)
  beam(out, [x - 1.25, 3.0, z - 0.25], [x, 3.75, z - 0.25], 0.09, PALE)
  beam(out, [x + 1.25, 3.0, z - 0.25], [x, 3.75, z - 0.25], 0.09, PALE)
  rectOn(out, '-z', z, x - 1.05, x + 1.05, 4.4, 6.2, PALE, 0.05)
  lozenges(out, x - 0.9, x + 0.9, 4.55, 6.05, z - 0.09, 2, BLUE)
  rectOn(out, '-z', z, x - w - 0.2, x + w + 0.2, 7.0, 9.8, PALE, 0.05)
  for (const s of [-1, 1]) archOn(out, '-z', z, x + s * w / 2, 7.15, w * 0.88, 2.5, BLUE, 0.09)
  beam(out, [x - w - 0.2, 7.1, z - 0.11], [x + w + 0.2, 7.1, z - 0.11], 0.05, CEMENT)
  // the balustrade: a row of interlaced ceramic arcs along the eaves
  const n = Math.round((hw * 2) / 1.2)
  const u = (hw * 2) / n
  const y = AISLE + 0.02
  beam(out, [x - hw, y, z + 0.15], [x + hw, y, z + 0.15], 0.1, CERAM)
  beam(out, [x - hw, y + 1.35, z + 0.15], [x + hw, y + 1.35, z + 0.15], 0.07, CERAM)
  for (let i = -1; i < n; i++) {
    const c = x - hw + u * (i + 1)
    const d = (a: number): [number, number, number] => [Math.max(x - hw, Math.min(x + hw, c + Math.cos(a) * u)), y + Math.sin(a) * 1.3, z + 0.15]
    for (let k = 0; k < 4; k++) beam(out, d((k / 4) * Math.PI), d(((k + 1) / 4) * Math.PI), 0.05, CERAM)
  }
}

/** A band of lozenges from x0 to x1, y0 to y1, on a plane just off a −z face, `n` across: thin diagonals. */
function lozenges(out: MeshBuilder, x0: number, x1: number, y0: number, y1: number, z: number, n: number, c: Rgb): void {
  const w = (x1 - x0) / n
  const ym = (y0 + y1) / 2
  for (let i = 0; i < n; i++) {
    const a = x0 + i * w
    const m = a + w / 2
    const b = a + w
    beam(out, [a, ym, z], [m, y1, z], 0.05, c)
    beam(out, [m, y1, z], [b, ym, z], 0.05, c)
    beam(out, [b, ym, z], [m, y0, z], 0.05, c)
    beam(out, [m, y0, z], [a, ym, z], 0.05, c)
  }
}
