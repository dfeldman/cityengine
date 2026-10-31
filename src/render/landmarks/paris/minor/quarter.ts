/**
 * The smaller things of the owner's round of 2026-10-30 (docs/PARIS_MINOR_BUGS.md), where a restyle in public/landmarks/paris/minor.json would
 * not do. Each says its number, and what it was read off.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { strut } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { beam, block, dome, hex, prism, shade, type Rgb } from '../../kit.ts'
import { balustrade, dormers, hipRoof, palette, pavilionRoof, range } from '../palaces/common.ts'
import { FIXED, UV, hull, offsetRing, surfaceTag, wound, type P2, type V3 } from '../rivegauche/common.ts'

/** a ring for a builder fitted to OSM, or the fit's box in a test */
const ringOf = (fit: Fit): P2[] => fit.ring && fit.ring.length >= 3 ? fit.ring : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]

/**
 * #11 ("another small train station that could use a custom model"). OSM has no station here: way/864712745 is `building=bridge wall=no`, 48 × 22 m,
 * across the Petite Ceinture at the north end of the Parc Martin-Luther-King, and what stood there was a 12 m brown box. Mapillary at the spot has a
 * glazed front under a sweeping pale metal soffit, on a deck; IGN's aerial has the hall's three dark ridges at the north-east end and a planted
 * terrace at the other. So that, a pavilion on a bridge, whatever it is for. −z bearing 145, +x bearing 55. Its deck height is a guess.
 */
export function ceinturePavilion(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0.5
  const hx = Math.max(fit.hx, 10), hz = Math.max(fit.hz, 5)
  const yD = g + 3.4, yE = g + 9.6, yR = g + 11.6
  const CONC: Rgb = hex('#a5a29a'), PALE: Rgb = hex('#c9bfa6'), SLATE: Rgb = hex('#3a3f46'), GLASS: Rgb = hex('#47606e'), STEEL: Rgb = hex('#9aa0a2'), DECK: Rgb = hex('#a39783')
  const gl = surfaceTag('glass'), met = surfaceTag('metal')
  const q = (p: V3[], n: V3, c: Rgb, tag = FIXED): void => out.quad(p, n, UV, c, tag)
  // the deck on its piers, the whole length
  block(out, -hx, hx, -hz, hz, yD - 0.8, yD, CONC)
  for (const x of [-hx + 2, -hx * 0.35, hx * 0.3, hx - 2]) for (const z of [-hz + 1.5, hz - 1.5]) block(out, x - 0.5, x + 0.5, z - 0.5, z + 0.5, 0, yD - 0.8, shade(CONC, 0.85))
  q([[-hx, yD + 0.05, -hz], [hx, yD + 0.05, -hz], [hx, yD + 0.05, hz], [-hx, yD + 0.05, hz]], [0, 1, 0], DECK)
  // the terrace's rail, along the three open sides
  const xS = -hx * 0.05
  for (const [a, b] of [[[-hx, -hz], [xS, -hz]], [[-hx, hz], [xS, hz]], [[-hx, -hz], [-hx, hz]]] as [number, number][][]) {
    beam(out, [a[0], yD + 1.1, a[1]], [b[0], yD + 1.1, b[1]], 0.04, STEEL)
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 2)
    for (let i = 0; i <= n; i++) { const x = a[0] + ((b[0] - a[0]) * i) / n, z = a[1] + ((b[1] - a[1]) * i) / n; block(out, x - 0.03, x + 0.03, z - 0.03, z + 0.03, yD, yD + 1.1, STEEL) }
  }
  // the hall: glass on every side between slim frames, a band of pale panel over it
  const x0 = xS, x1 = hx - 0.6, z0 = -hz + 1.8, z1 = hz - 1.8
  for (const [z, s] of [[z0, -1], [z1, 1]] as const) {
    q([[x0, yD, z], [x1, yD, z], [x1, yE - 1.5, z], [x0, yE - 1.5, z]], [0, 0, s], GLASS, gl)
    q([[x0, yE - 1.5, z], [x1, yE - 1.5, z], [x1, yE, z], [x0, yE, z]], [0, 0, s], PALE, met)
    for (let x = x0; x <= x1 + 0.01; x += 3) block(out, x - 0.05, x + 0.05, z - 0.05, z + 0.05, yD, yE - 1.5, STEEL)
  }
  for (const [x, s] of [[x0, -1], [x1, 1]] as const) {
    q([[x, yD, z0], [x, yD, z1], [x, yE - 1.5, z1], [x, yE - 1.5, z0]], [s, 0, 0], GLASS, gl)
    q([[x, yE - 1.5, z0], [x, yE - 1.5, z1], [x, yE, z1], [x, yE, z0]], [s, 0, 0], PALE, met)
  }
  // the three dark gabled roofs, their ridges across the hall, on a soffit that sweeps out over the glass on the long sides
  const n = 3
  const w = (x1 - x0) / n
  for (let i = 0; i < n; i++) {
    const a = x0 + i * w, b = a + w, m = a + w / 2
    q([[a, yE, -hz], [m, yR, -hz], [m, yR, hz], [a, yE, hz]], [-0.5, 0.85, 0], SLATE, met)
    q([[m, yR, -hz], [b, yE, -hz], [b, yE, hz], [m, yR, hz]], [0.5, 0.85, 0], shade(SLATE, 0.9), met)
    for (const [z, s] of [[-hz, -1], [hz, 1]] as const) q([[a, yE, z], [b, yE, z], [m, yR, z], [m, yR, z]], [0, 0, s], PALE, met)
  }
  for (const [z0s, s] of [[z0, -1], [z1, 1]] as const) {
    // the curved soffit, in three leaning planes from the glass's head out to the eave
    const prof: [number, number][] = [[0, yE - 2.6], [0.5, yE - 1.4], [1.1, yE - 0.5], [1.8, yE]]
    for (let k = 0; k + 1 < prof.length; k++) {
      const [d0, y0] = prof[k], [d1, y1] = prof[k + 1]
      q([[x0, y0, z0s + s * d0], [x1, y0, z0s + s * d0], [x1, y1, z0s + s * d1], [x0, y1, z0s + s * d1]], [0, -0.8, s * 0.5], hex('#b3a78d'), met)
    }
  }
  // the terrace's planters, from the aerial
  for (const [x, z, a, b] of [[-hx * 0.7, 0, 3.6, 2.4], [-hx * 0.35, -3, 2.6, 1.6], [-hx * 0.35, 3.5, 2.2, 2]]) {
    block(out, x - a, x + a, z - b, z + b, yD, yD + 0.45, hex('#8a7a60'))
    q([[x - a + 0.2, yD + 0.5, z - b + 0.2], [x + a - 0.2, yD + 0.5, z - b + 0.2], [x + a - 0.2, yD + 0.5, z + b - 0.2], [x - a + 0.2, yD + 0.5, z + b - 0.2]], [0, 1, 0], hex('#57713f'), surfaceTag('foliage'))
  }
}

/**
 * #14 ("this corporate office is actually cream with red round towers on each side"). The block itself, relation/568722, is restyled cream in
 * minor.json; these are its drums, which a restyle cannot say: where IGN's aerial has them, the half-moon glazed lights in their tops, the third with
 * the lattice ring it shows. The red is the owner's word; no photograph of it was found (Mapillary at the street sees only pale grey cladding
 * over a hedge). Their height is a little over the block's 20 m, a guess. x east, z north (front 180).
 */
export function extensionDrums(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0.5
  const RED: Rgb = hex('#a63f2c'), CAP: Rgb = hex('#e2d8bf'), GLASS: Rgb = hex('#7d98a4')
  const brick = surfaceTag('terracotta'), gl = surfaceTag('glass')
  for (const [x, z, r, h, lattice] of [[20.3, 4.9, 9.4, 21.5, 0], [-36.8, -45.4, 10, 21.5, 0], [38.8, 45.5, 8, 26, 1]] as const) {
    prism(out, x, z, 0, g + h, r, 24, RED, brick, r, false)
    for (const y of [5, 10, 15, 20]) prism(out, x, z, g + y - 0.18, g + y + 0.18, r + 0.12, 24, shade(CAP, 0.95), FIXED, r + 0.12, false)
    prism(out, x, z, g + h, g + h + 0.7, r + 0.35, 24, CAP, FIXED, r + 0.35, true)
    if (lattice) {
      // the open lattice of its top
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        beam(out, [x + Math.cos(a) * r, g + h + 0.7, z + Math.sin(a) * r], [x + Math.cos(a + 0.5) * r, g + h + 4, z + Math.sin(a + 0.5) * r], 0.08, RED)
      }
      prism(out, x, z, g + h + 3.9, g + h + 4.3, r + 0.1, 24, RED, brick, r + 0.1, false)
    } else {
      // the half-moon glazed light
      const n = 8
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI
        const P = (a: number, rr: number, y: number): V3 => [x + Math.cos(a + 0.7) * rr, y, z + Math.sin(a + 0.7) * rr]
        out.quad([P(a0, r * 0.25, g + h + 2.2), P(a0, r * 0.8, g + h + 0.75), P(a1, r * 0.8, g + h + 0.75), P(a1, r * 0.25, g + h + 2.2)], [Math.cos((a0 + a1) / 2 + 0.7) * 0.6, 0.8, Math.sin((a0 + a1) / 2 + 0.7) * 0.6], UV, GLASS, gl)
      }
    }
  }
}

/**
 * #17 ("an extremely interesting fake calssical building"): the quarter's own dress is the restyle in minor.json. These are what it stands up in
 * on IGN's aerial: the two gilded cupolas at the south end of the crescent's corner block (way/1361408422, 8 levels) and the green copper pavilion
 * on the north point of Le Sublime (way/1155621126, 15). Their shapes are from the air only; their heights follow OSM's levels at 4 m. x east, z north.
 */
export function bergeresCupolas(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0.5
  const GOLD: Rgb = hex('#c79a3f'), STONE: Rgb = hex('#e4dac4'), COPPER: Rgb = hex('#6f9a8a')
  const y = g + 32
  for (const x of [-11, 11]) {
    prism(out, x, 0, y, y + 3.2, 3.1, 12, STONE, FIXED, 3.1, false)
    dome(out, x, 0, y + 3.2, 3.1, 3.2, GOLD, 12)
    prism(out, x, 0, y + 6.3, y + 8, 0.34, 6, GOLD, FIXED, 0.08)
  }
  // Le Sublime's point, 88 m to the north-west of them (from the aerial): a square copper pavilion
  const X = -106, Z = 92, Y = g + 64
  block(out, X - 7, X + 7, Z - 7, Z + 7, Y - 4, Y + 0.6, STONE)
  dome(out, X, Z, Y + 0.6, 7.6, 5.5, COPPER, 8)
  prism(out, X, Z, Y + 6, Y + 9, 1.1, 8, STONE, FIXED, 0.9)
  dome(out, X, Z, Y + 9, 1.15, 1.2, COPPER, 8)
}

/**
 * #31 ("a distnctive white apartment complex with balconies on every apartment (surrounding the floor) on a black base"): the Tour Boucry, 30 floors and
 * 99 m on OSM (way/245497335), the black base its commercial podium (way/195265659, restyled in minor.json). Commons "Tour Boucry 2019 2a.jpg":
 * every floor a white balcony slab running right round, dark behind, the balconies' divisions in white on a beat of about 3.5 m.
 */
export function tourBoucry(out: MeshBuilder, fit: Fit): void {
  const ring = wound([ringOf(fit)])[0]
  const H = 99, F = 30, s = (H - 3.4) / F
  const WHITE: Rgb = hex('#e4e2da'), DARK: Rgb = hex('#3a4148'), PALE: Rgb = hex('#cfccc2')
  const gl = surfaceTag('glass')
  const edge = offsetRing(ring, 0.05)
  const core = offsetRing(ring, -1.2)
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const a = edge[i], b = edge[(i + 1) % n], c0 = core[i], c1 = core[(i + 1) % n]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
    // the dark wall, set back behind the balconies: one sheet, floor to roof
    out.quad([[c0.x, 3.4, c0.z], [c1.x, 3.4, c1.z], [c1.x, H, c1.z], [c0.x, H, c0.z]], [nx, 0, nz], UV, DARK, gl)
    const fins = Math.max(1, Math.round(L / 3.5))
    for (let f = 0; f <= F; f++) {
      const y = 3.4 + f * s
      // the slab: its white lip, with a parapet's height, and its top seen from above
      out.quad([[a.x, y - 0.25, a.z], [b.x, y - 0.25, b.z], [b.x, y + 0.85, b.z], [a.x, y + 0.85, a.z]], [nx, 0, nz], UV, WHITE, FIXED)
      out.quad([[a.x, y - 0.25, a.z], [b.x, y - 0.25, b.z], [c1.x, y - 0.25, c1.z], [c0.x, y - 0.25, c0.z]], [0, -1, 0], UV, shade(PALE, 0.8), FIXED)
      if (f < F) for (let k = 1; k < fins; k += 1) {
        const t = k / fins
        const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }, q = { x: c0.x + (c1.x - c0.x) * t, z: c0.z + (c1.z - c0.z) * t }
        out.quad([[p.x, y + 0.85, p.z], [q.x, y + 0.85, q.z], [q.x, y + s - 0.25, q.z], [p.x, y + s - 0.25, p.z]], [(b.x - a.x) / L, 0, (b.z - a.z) / L], UV, PALE, FIXED)
      }
    }
  }
  // the roof and its plant
  hull(out, [core], H, H + 0.4, WHITE, hex('#8c8a84'))
  const cx = ring.reduce((t, p) => t + p.x, 0) / n, cz = ring.reduce((t, p) => t + p.z, 0) / n
  block(out, cx - 4, cx + 4, cz - 10, cz + 10, H + 0.4, H + 3.2, PALE)
  // the open ground floor under it, dark, on the podium's level
  hull(out, [offsetRing(ring, -2.2)], 0, 3.4, hex('#25282b'), hex('#25282b'))
}

/**
 * #29 ("this is a distinctive industrial building"): the long railway warehouses on the Rue d'Aubervilliers beside the Cent Quatre. From IGN's aerial only,
 * no street photograph was found: way/242860533, three flat dark roofs side by side with white parapets between and rows of pale skylights; way/765711909 beside
 * it, the long shed, its roof one tooth after another in pale and dark for 450 m. Walls and heights are not verified. −z bearing 105, +x bearing 15, on OSM's rings.
 */
export function aubervilliersWarehouse(out: MeshBuilder, fit: Fit): void {
  const ring = ringOf(fit)
  const g = fit.grade ?? 0.5
  const h = g + 9
  const WALL: Rgb = hex('#9d9f9b'), ROOF: Rgb = hex('#34373a'), SKY: Rgb = hex('#c7ccc9'), WHITE: Rgb = hex('#dcdcd8'), DOOR: Rgb = hex('#3f464b')
  hull(out, [ring], 0, h, WALL, ROOF)
  const xs = ring.map((p) => p.x), zs = ring.map((p) => p.z)
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs)
  // the parapets between the three roofs
  for (const f of [1 / 3, 2 / 3]) {
    const x = x0 + (x1 - x0) * f
    block(out, x - 0.25, x + 0.25, z0 + 1, z1 - 1, h, h + 0.5, WHITE)
  }
  // two rows of three skylights a roof
  const met = surfaceTag('metal'), gl = surfaceTag('glass')
  for (let s = 0; s < 3; s++) {
    for (let i = 0; i < 3; i++) for (const k of [0.3, 0.7]) {
      const x = x0 + ((x1 - x0) * (s + (i + 0.5 + (k > 0.5 ? 0.35 : 0)) / 3.35)) / 3
      const z = z0 + (z1 - z0) * k
      block(out, x - 4.6, x + 4.6, z - 1.7, z + 1.7, h, h + 0.5, shade(SKY, 0.8))
      out.quad([[x - 4.5, h + 0.9, z - 1.1], [x + 4.5, h + 0.9, z - 1.1], [x + 4.5, h + 0.9, z + 1.1], [x - 4.5, h + 0.9, z + 1.1]], [0, 1, 0], UV, SKY, gl)
    }
  }
  // loading doors and a band along the long walls
  for (const [z, s] of [[z0, -1], [z1, 1]] as const) {
    const n = Math.round((x1 - x0) / 9)
    for (let i = 0; i < n; i++) {
      const x = x0 + ((x1 - x0) * (i + 0.5)) / n
      out.quad([[x - 2, g, z + s * 0.06], [x + 2, g, z + s * 0.06], [x + 2, g + 4.2, z + s * 0.06], [x - 2, g + 4.2, z + s * 0.06]], [0, 0, s], UV, DOOR, met)
    }
  }
}

/** The long shed: its ring walled, its roof a saw of pale and dark across its width, each tooth clipped to the ring's width there. See `aubervilliersWarehouse`. */
export function aubervilliersShed(out: MeshBuilder, fit: Fit): void {
  const ring = ringOf(fit)
  const g = fit.grade ?? 0.5
  const WALL: Rgb = hex('#8f8f8a'), PALE: Rgb = hex('#d3d2cb'), DARK: Rgb = hex('#3b3e42'), EAVE = g + 8.2, RIDGE = g + 10.7
  hull(out, [ring], 0, EAVE, WALL, shade(DARK, 0.8))
  const xs = ring.map((p) => p.x)
  const x0 = Math.min(...xs), x1 = Math.max(...xs)
  const span = (x: number): [number, number] | null => {
    let lo = Infinity, hi = -Infinity
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]
      if ((a.x <= x) !== (b.x <= x)) { const z = a.z + ((b.z - a.z) * (x - a.x)) / (b.x - a.x); lo = Math.min(lo, z); hi = Math.max(hi, z) }
    }
    return lo < hi ? [lo, hi] : null
  }
  const pitch = 7.4
  const n = Math.floor((x1 - x0) / pitch)
  const met = surfaceTag('metal'), gl = surfaceTag('glass')
  for (let i = 0; i < n; i++) {
    const a = x0 + i * pitch, b = a + pitch, m = a + pitch * 0.6
    const s = span(m)
    if (!s) continue
    const [lo, hi] = s
    if (hi - lo < 3) continue
    out.quad([[a, EAVE, lo], [m, RIDGE, lo], [m, RIDGE, hi], [a, EAVE, hi]], [-0.45, 0.9, 0], UV, DARK, met)
    out.quad([[m, RIDGE, lo], [b, EAVE, lo], [b, EAVE, hi], [m, RIDGE, hi]], [0.5, 0.86, 0], UV, PALE, gl)
    for (const [z, sg] of [[lo, -1], [hi, 1]] as const) out.quad([[a, EAVE, z], [b, EAVE, z], [m, RIDGE, z], [m, RIDGE, z]], [0, 0, sg], UV, WALL, FIXED)
  }
}

/* The rows of graves: [row, from, to] on a lattice of 3.1 × 4.2 m along the paths' axis (bearing 61.5, read off OSM's), inside OSM's way/15239108, inside what IGN's aerial has as plots, and more than 5.5 m from any of OSM's paths, which the city draws as streets. Written once from osmium's output. */
const ROWS: number[] = [-28,4,6,-28,11,12,-27,3,6,-27,11,15,-27,20,20,-26,3,6,-26,11,15,-26,20,22,-25,2,6,-25,11,15,-25,20,23,-24,2,6,-24,11,15,-24,20,23,-23,2,6,-23,11,15,-23,20,23,-23,28,30,-22,14,15,-22,20,23,-22,28,30,-21,35,35,-20,35,35,-19,-3,-2,-19,2,6,-19,11,15,-19,19,23,-19,28,30,-19,35,35,-18,-3,-2,-18,2,6,-18,11,15,-18,19,23,-18,28,30,-17,-4,-2,-17,2,6,-17,11,15,-17,19,23,-17,28,30,-16,-5,-2,-16,2,6,-16,11,15,-16,19,23,-16,28,30,-15,-5,-2,-15,2,6,-15,11,15,-15,19,23,-15,28,30,-11,-6,-2,-11,2,6,-11,10,15,-11,19,23,-11,28,30,-10,-6,-2,-10,2,6,-10,10,15,-10,19,23,-10,28,30,-9,-6,-2,-9,2,6,-9,10,15,-9,19,23,-9,28,30,-8,-6,-2,-8,2,6,-8,11,15,-8,19,23,-8,28,30,-7,-6,-2,-7,2,6,-7,11,15,-7,19,23,-7,28,30,-4,-6,-2,-4,2,6,-4,11,15,-4,19,23,-4,28,30,-3,-6,-2,-3,2,6,-3,11,15,-3,19,23,-3,28,30,-2,-6,-2,-2,2,6,-2,11,15,-2,19,23,-2,28,30,-1,-6,-2,-1,2,6,-1,11,15,-1,19,23,-1,28,30,0,-6,-3,0,2,6,0,11,15,0,19,23,0,28,30,3,19,23,3,28,30,4,-7,-3,4,2,6,4,10,14,4,19,23,4,28,30,5,-7,-3,5,2,6,5,10,14,5,19,23,5,28,30,6,-7,-3,6,2,6,6,10,14,6,19,23,6,28,30,7,-7,-3,7,2,6,7,10,14,7,19,23,7,28,30,11,-7,-3,11,2,6,11,10,14,11,19,23,11,28,30,12,-7,-3,12,2,6,12,10,14,12,19,23,12,28,30,13,-7,-3,13,2,6,13,10,14,13,19,23,13,28,30,14,-4,-3,14,2,6,14,10,14,14,19,23,14,28,30,15,2,6,15,10,14,15,19,23,15,28,30,16,19,23,16,28,30]

/**
 * #20 ("this is actually mounemt aux morts cemetery"): the Cimetière Nouveau de Puteaux, which the city has as lawns between its paths. Rows of grey
 * slabs and headstones where the aerial has plots, and the war memorial at OSM's node 14158921338 (its form is not known: a stele on steps, from no
 * photograph). Draped. x east, z north (front 180) from 48.89278, 2.228812.
 */
export function puteauxCemetery(out: MeshBuilder, fit: Fit): void {
  void fit
  const b = (61.5 * Math.PI) / 180
  const ux = Math.sin(b), uz = Math.cos(b), vx = uz, vz = -ux
  const SLABS: Rgb[] = [hex('#8f8d88'), hex('#a3a19b'), hex('#77767a'), hex('#b1aea6'), hex('#6d6a66')]
  const noise = (a: number, c: number): number => { const v = Math.sin(a * 127.1 + c * 311.7) * 43758.5453; return v - Math.floor(v) }
  for (let r = 0; r < ROWS.length; r += 3) {
    const j = ROWS[r]
    for (let i = ROWS[r + 1]; i <= ROWS[r + 2]; i++) {
      const u = i * 3.1 + (noise(i, j) - 0.5) * 0.3, v = j * 4.2
      const cx = ux * u + vx * v, cz = uz * u + vz * v
      const c = SLABS[Math.floor(noise(j, i) * SLABS.length)]
      const P = (du: number, dv: number, y: number): V3 => [cx + ux * du + vx * dv, y, cz + uz * du + vz * dv]
      // the slab, lying across the row, and its headstone at the head
      out.quad([P(-0.55, -1.15, 0.45), P(0.55, -1.15, 0.45), P(0.55, 1.15, 0.45), P(-0.55, 1.15, 0.45)], [0, 1, 0], UV, c, FIXED)
      out.quad([P(-0.55, 1.15, 0), P(0.55, 1.15, 0), P(0.55, 1.15, 0.45), P(-0.55, 1.15, 0.45)], [vx, 0, vz], UV, shade(c, 0.8), FIXED)
      const h = 0.9 + noise(i, j + 3) * 0.7
      out.quad([P(-0.5, -1.15, 0.45), P(0.5, -1.15, 0.45), P(0.5, -1.15, 0.45 + h), P(-0.5, -1.15, 0.45 + h)], [-vx, 0, -vz], UV, shade(c, 0.92), FIXED)
    }
  }
  // the memorial
  const X = -4.1, Z = 60.1
  const STONE: Rgb = hex('#c5bfb0')
  block(out, X - 3.6, X + 3.6, Z - 3.6, Z + 3.6, -0.2, 0.4, STONE)
  block(out, X - 2.6, X + 2.6, Z - 2.6, Z + 2.6, 0.4, 0.9, shade(STONE, 0.94))
  block(out, X - 1.3, X + 1.3, Z - 1.3, Z + 1.3, 0.9, 2.6, STONE)
  prism(out, X, Z, 2.6, 8.4, 0.95, 4, STONE, FIXED, 0.42)
  prism(out, X, Z, 8.4, 9.1, 0.42, 4, shade(STONE, 0.9), FIXED, 0.02)
}

/**
 * #33 ("this musee de service could use a custom model"). The old abbey's cloister at the Val-de-Grâce, the Musée and the Bibliothèque du Service de
 * Santé des Armées (relation/931378), which OSM has as a solid 85 × 82 m with its parts and the city drew as a lid. IGN's aerial is unusually
 * clear: a square of four wings 64 × 56 m, 14 deep, round a court of 35 × 30, a pavilion at each corner under its own roof, the long slopes in two
 * tones of slate with a line of dormers, the court's embroidered parterre in four quarters round a round bed. The arcade round the court from memory of the
 * Mansart cloister; three storeys and 13 m to the eaves from OSM's 20 m with its roof. −z bearing 204, to the Boulevard side; +x bearing 114.
 */
export function valDeGraceCloitre(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0.5
  const q = new MeshBuilder()
  const p = palette('#dfd5bd', '#566067')
  const HX = 31.8, HZ = 28, CX = 17.5, CZ = 15
  const E = 13.2
  const st = [{ y: 0, h: 3.4, arched: true, sill: 0.5 }, { y: 4.6, h: 2.8 }, { y: 9, h: 2.5 }]
  const O = { eaves: E, storeys: st, bay: 3.9, win: 1.6, courses: true, cornice: 0.5 }
  range(q, -HX, HX, -HZ, -CZ, p, { ...O, faces: ['-z', '+z'] })
  range(q, -HX, HX, CZ, HZ, p, { ...O, faces: ['-z', '+z'] })
  range(q, -HX, -CX, -CZ, CZ, p, { ...O, faces: ['-x', '+x'] })
  range(q, CX, HX, -CZ, CZ, p, { ...O, faces: ['-x', '+x'] })
  // the roofs: each wing's own ridge, with a shade of lead on its upper slope; the dormers along the outer slopes and in the court
  const R = 6.8
  hipRoof(q, -HX, HX, -HZ, -CZ, E, R, p.slate)
  hipRoof(q, -HX, HX, CZ, HZ, E, R, p.slate)
  hipRoof(q, -HX, -CX, -HZ + 6, HZ - 6, E, R, p.slate)
  hipRoof(q, CX, HX, -HZ + 6, HZ - 6, E, R, p.slate)
  dormers(q, '-z', -HZ, -HX + 5, HX - 5, E + 0.2, 3.9, p, { every: 2, set: 1.2 })
  dormers(q, '+z', HZ, -HX + 5, HX - 5, E + 0.2, 3.9, p, { every: 2, set: 1.2 })
  dormers(q, '-x', -HX, -HZ + 5, HZ - 5, E + 0.2, 3.9, p, { every: 2, set: 1.2 })
  dormers(q, '+x', HX, -HZ + 5, HZ - 5, E + 0.2, 3.9, p, { every: 2, set: 1.2 })
  dormers(q, '+z', -CZ, -CX + 2, CX - 2, E + 0.2, 3.9, p, { every: 2, set: 1.2, w: 1.1 })
  dormers(q, '-z', CZ, -CX + 2, CX - 2, E + 0.2, 3.9, p, { every: 2, set: 1.2, w: 1.1 })
  // the corner pavilions: a storey higher, standing out from the corners, each under a steep roof
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    const x0 = sx > 0 ? HX - 5 : -HX - 6, x1 = sx > 0 ? HX + 6 : -HX + 5
    const z0 = sz > 0 ? HZ - 5 : -HZ - 6, z1 = sz > 0 ? HZ + 6 : -HZ + 5
    range(q, x0, x1, z0, z1, p, { eaves: E + 3, storeys: [...st, { y: 12.9, h: 2 }], bay: 3.3, win: 1.5, cornice: 0.5, quoins: true })
    pavilionRoof(q, x0, x1, z0, z1, E + 3, 6.2, p, { top: 2.4 })
  }
  // ---- the court: raked pink gravel, the four embroidered quarters and the round bed
  const G: Rgb = hex('#b09880'), BOX: Rgb = hex('#3f5f34'), SAND: Rgb = hex('#d8cfae')
  const fl = 0.08
  q.quad([[-CX, fl, -CZ], [CX, fl, -CZ], [CX, fl, CZ], [-CX, fl, CZ]], [0, 1, 0], UV, G, FIXED)
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    const cx = sx * 8.6, cz = sz * 7.4, hx = 6.6, hz = 5.3
    q.quad([[cx - hx, fl + 0.03, cz - hz], [cx + hx, fl + 0.03, cz - hz], [cx + hx, fl + 0.03, cz + hz], [cx - hx, fl + 0.03, cz + hz]], [0, 1, 0], UV, SAND, FIXED)
    // the hedge round it and its scrolls: two spirals of box, in short raised lengths
    const seg = (x0: number, z0: number, x1: number, z1: number, w = 0.28): void => strut(q, [x0, fl + 0.22, z0], [x1, fl + 0.22, z1], w, 0.4, BOX, surfaceTag('foliage'), false)
    seg(cx - hx, cz - hz, cx + hx, cz - hz); seg(cx + hx, cz - hz, cx + hx, cz + hz); seg(cx + hx, cz + hz, cx - hx, cz + hz); seg(cx - hx, cz + hz, cx - hx, cz - hz)
    for (const dir of [-1, 1]) {
      const ox = cx + dir * hx * 0.42
      let px = ox, pz = cz
      for (let i = 1; i <= 16; i++) {
        const a = i * 0.72, r = 0.28 * i * 0.3 + 0.12 * i
        const nx = ox + Math.cos(a) * r * dir * 1.25, nz = cz + Math.sin(a) * r * sx * sz
        seg(px, pz, nx, nz, 0.22)
        px = nx; pz = nz
      }
    }
  }
  prism(q, 0, 0, fl, fl + 0.5, 3, 16, BOX, surfaceTag('foliage'), 2.8, true)
  prism(q, 0, 0, fl, fl + 0.1, 4.1, 16, SAND, FIXED, 4.1, true)
  // the low balustrade over the south front's middle
  balustrade(q, -14, 14, -HZ - 0.6, -HZ, E - 0.2, p, { sides: ['-z'], h: 0.8 })
  // all of it sits at the grade: the base is the lowest ground under it, and the abbey's ground slopes a little
  for (let i = 1; i < q.positions.length; i += 3) q.positions[i] += g
  const base = out.positions.length / 3
  for (const v of q.positions) out.positions.push(v)
  for (const v of q.normals) out.normals.push(v)
  for (const v of q.uvs) out.uvs.push(v)
  for (const v of q.colors) out.colors.push(v)
  for (const i of q.indices) out.indices.push(base + i)
  // and the walls go down to the base
  block(out, -HX, HX, -HZ, -CZ, 0, g, p.deep)
  block(out, -HX, HX, CZ, HZ, 0, g, p.deep)
  block(out, -HX, -CX, -CZ, CZ, 0, g, p.deep)
  block(out, CX, HX, -CZ, CZ, 0, g, p.deep)
}
