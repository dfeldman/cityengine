/**
 * Batch 4's parks' structures (2026-10-31; the planting is tools/gardens/paris-batch4.ts; owner, 2026-10-30: "A special focus should be park gardens, since in a cycling game they are very obvious"). The Bois are Alphand's, 1855–60: artificial
 * rock, rustic chalets and small temples. Rock is Batch 3's `crag`, which holds up at rider height. Each says what it was read from; each look is from the aerial, OSM and memory, and street view could say more (see the batch report).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { strut } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { dome, hex, prism, roof, shade, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { crag } from '../batch3/parks.ts'
import { archOn, palette, rectOn, slabOn } from '../palaces/common.ts'

const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
/** Fontainebleau's sandstone as Alphand's men set it: warm and pale for a rock, in dark beds */
const SAND = hex('#665e50'), DARK = hex('#2a2722')
type Rock = [number, number, number, number, number, number]
const pile = (out: MeshBuilder, y: number, rocks: Rock[], c: Rgb = SAND): void => rocks.forEach(([x, h, z, rx, ry, rz], i) => crag(out, x, y + h, z, rx, ry, rz, i * 1.37 + 0.4, shade(c, 0.9 + hash(i, 4) * 0.2)))

/* -------------------------------------------------------------------------------------------- Bois de Boulogne */

/**
 * LA GRANDE CASCADE (Alphand, 1856): a cliff of Fontainebleau sandstone 10 m high with the fall through its middle (OSM's node, `height` 10; "about 7.50 m" of falling water, fr.wikipedia), the Lac du Réservoir behind it, and a grotto you can walk through behind the water. The pool below it is OSM's
 * (48.86352 2.24086, 52 × 50 m). −z faces west over the pool. The rock runs 34 m along its shore, its wings dropping away; the two black mouths either side of the water are the grotto's.
 */
export function grandeCascade(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  const rocks: Rock[] = []
  // courses of upright stones, wide at the foot, each overlapping the one under it: taller than wide, or a crag reads as a hat
  for (let c = 0; c < 6; c++) {
    const span = 17.5 - c * 1.7, n = Math.round(span / 1.1)
    for (let i = 0; i <= n; i++) {
      const x = -span + (i + (c % 2) * 0.5) * ((2 * span) / n), u = Math.abs(x) / 17.5
      // the rock stands tallest round the fall, in the middle, and low at the wings
      const drop = Math.pow(u, 1.5) * 4.5
      if (Math.abs(x) < 2.1 && c < 5) continue
      if (c < 2 && Math.abs(Math.abs(x) - 6) < 1.9) continue
      rocks.push([x, Math.max(-0.6, -0.4 + c * 1.5 - drop), 1 + c * 0.75 + hash(i, c) * 0.6, 1.9 + hash(i, c + 3) * 0.7, 2.6 + hash(c, i) * 0.8, 1.7 + hash(i + 2, c) * 0.5])
    }
  }
  // the crown over the lip, and the great boulders standing out in the water at the foot
  rocks.push([-3.4, 7.4, 7.2, 2.2, 2.2, 2.2], [3.4, 7.6, 7.2, 2.2, 2.2, 2.2], [-7, 6, 8.2, 2.6, 2.2, 2.2], [7, 5.8, 8.2, 2.6, 2.2, 2.2], [-3.4, -0.2, -0.8, 1.5, 1.6, 1.4], [3.2, -0.2, -0.6, 1.4, 1.4, 1.3], [-6.8, -0.3, 0, 1.2, 1.1, 1.1], [6.6, -0.3, -0.2, 1.1, 1.1, 1])
  // the rock's dark mass behind, and the grotto's mouths, set first, so the stones frame them
  block(out, -11, 11, 5, 10, y - 1, y + 6.4, shade(SAND, 0.5), surfaceTag('rock'))
  for (const s of [-1, 1]) archOn(out, '-z', 4.98, s * 6, y - 0.5, 3.2, 4.2, hex('#0d0c0a'), 0.02)
  block(out, -2.1, 2.1, 2.2, 5, y - 0.6, y + 8, DARK)
  pile(out, y, rocks)
  // the lip, and the fall, a broad sheet and two thin ones either side of the boulder in its way
  block(out, -2.3, 2.3, 2.1, 7, y + 8.2, y + 8.5, shade(SAND, 0.6))
  out.water.push({ kind: 'sheet', a: [-2, y + 8.5, 2.1], b: [2, y + 8.5, 2.1], out: 0.35, drop: 9.5 })
  out.water.push({ kind: 'sheet', a: [-3.2, y + 4.2, 0.6], b: [-2.4, y + 4.2, 0.6], out: 0.2, drop: 5 })
  out.water.push({ kind: 'sheet', a: [2.4, y + 4.6, 0.6], b: [3.2, y + 4.6, 0.6], out: 0.2, drop: 5.4 })
  out.water.push({ kind: 'splash', at: [0, y - 0.4, 0.8], r: 2.2 })
}

/** LA PETITE CASCADE: the Lac Supérieur's overflow, dropping into the south tip of the Lac Inférieur over a low bank of Alphand's rock (aerial g-lacinf, (325, 625); the place is read, the look is the name's). −z faces the lower lake, north. */
export function petiteCascade(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  pile(out, y, [
    [-7, -0.4, 1, 2, 1.1, 1.5], [-4.4, -0.2, 1.3, 2, 1.5, 1.7], [-2.2, 0.4, 1.6, 1.6, 1.8, 1.5], [2.2, 0.4, 1.6, 1.7, 1.9, 1.5], [4.5, -0.2, 1.3, 2, 1.5, 1.7], [7.2, -0.4, 0.9, 2.1, 1.1, 1.5],
    [-1.7, 2, 2.9, 1.3, 1.1, 1.2], [1.7, 2.1, 2.9, 1.3, 1.1, 1.2], [-2.8, -0.4, -0.8, 1.1, 0.7, 1], [2.6, -0.4, -1, 1, 0.6, 0.9],
  ])
  block(out, -0.85, 0.85, 1.4, 3.4, y + 2.1, y + 2.3, shade(SAND, 0.6))
  out.water.push({ kind: 'sheet', a: [-0.8, y + 2.3, 1.4], b: [0.8, y + 2.3, 1.4], out: 0.25, drop: 3.5 })
  out.water.push({ kind: 'splash', at: [0, y - 0.5, 0.6], r: 1.2 })
}

/**
 * LE CHALET DES ÎLES (a Swiss chalet from the Exposition of 1867, brought to the northern island; OSM way/83115467, 23 × 21 m, and its terrace way/83115455): on the water, a stone ground floor and a timber first floor under broad gables, galleries round it and a shingle roof with its eaves
 * far out. Aerial g-chalet: two long roofs, the taller along the lake at bearing 40, with a glazed front on the terrace at the south-west. −z to the landing, south-east.
 */
export function chaletDesIles(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, HX = Math.min(11, fit.hx), HZ = Math.min(9, fit.hz)
  const STONE = hex('#9d9078'), WOOD = hex('#5e4029'), DEEP = hex('#3b2819'), ROOF = hex('#6b6459'), CREAM = hex('#b8ab8c'), GLASS: Rgb = [0.13, 0.15, 0.16]
  const wood = surfaceTag('planks'), stone = surfaceTag('rock')
  block(out, -HX, HX, -HZ, HZ, y, y + 3.4, STONE, stone)
  block(out, -HX, HX, -HZ, HZ, y + 3.4, y + 6.6, WOOD, wood)
  for (const s of [-1, 1]) {
    const z = s * HZ, f = s < 0 ? '-z' : '+z'
    for (let x = -HX + 1.6; x < HX - 1; x += 3.2) {
      rectOn(out, f, z, x - 0.8, x + 0.8, y + 0.7, y + 2.8, GLASS, 0.05)
      rectOn(out, f, z, x - 1, x + 1, y + 2.8, y + 3.05, CREAM, 0.08)
      rectOn(out, f, z, x - 0.6, x + 0.6, y + 4, y + 6, GLASS, 0.05)
      rectOn(out, f, z, x - 1.05, x - 0.6, y + 4, y + 6, hex('#7f8b63'), 0.07)
      rectOn(out, f, z, x + 0.6, x + 1.05, y + 4, y + 6, hex('#7f8b63'), 0.07)
    }
    // the gallery on its brackets, posts and rail
    block(out, -HX - 1.2, HX + 1.2, Math.min(z, z + s * 1.3), Math.max(z, z + s * 1.3), y + 3.4, y + 3.6, DEEP, wood)
    for (let x = -HX - 1; x <= HX + 1; x += 1.05) block(out, x - 0.05, x + 0.05, z + s * 1.2 - 0.05, z + s * 1.2 + 0.05, y + 3.6, y + 4.5, CREAM, wood)
    block(out, -HX - 1.2, HX + 1.2, z + s * 1.2 - 0.07, z + s * 1.2 + 0.07, y + 4.45, y + 4.6, WOOD, wood)
    for (let x = -HX - 1; x <= HX + 1; x += 4.2) block(out, x - 0.1, x + 0.1, z + s * 1.2 - 0.1, z + s * 1.2 + 0.1, y + 3.6, y + 6.7, DEEP, wood)
  }
  // the long roof, ridge along x, eaves far out, its gables in timber, and a cross-gable to the landing
  roof(out, -HX - 1.8, HX + 1.8, -HZ - 2.2, HZ + 2.2, y + 6.6, 5, 0, HZ + 2.2, ROOF)
  for (const s of [-1, 1]) {
    const x = s * (HX + 1.4), f: '-x' | '+x' = s < 0 ? '-x' : '+x', dz = HZ + 1.5
    for (let k = 0; k < 6; k++) {
      const t0 = k / 6, t1 = (k + 1) / 6
      slabOn(out, f, x, -dz * (1 - t0), dz * (1 - t0), y + 6.6 + t0 * 4.6, y + 6.6 + t1 * 4.6, 0.04, k % 2 ? WOOD : shade(WOOD, 0.8))
    }
    rectOn(out, f, x, -1.2, 1.2, y + 7.2, y + 9, GLASS, 0.1)
    block(out, Math.min(x, s * HX), Math.max(x, s * HX), -HZ, HZ, y + 3.4, y + 6.6, WOOD, wood)
  }
  roof(out, -3.4, 3.4, -HZ - 1.6, 0, y + 6.6, 4, 3.4, 0, shade(ROOF, 0.95))
  rectOn(out, '-z', -HZ - 1.45, -1.7, 1.7, y + 6.8, y + 8.2, GLASS, 0.03)
}

/**
 * LE KIOSQUE DE L'EMPEREUR (Davioud, on the southern island; fr.wikipedia): the Emperor's little pavilion, rustic and open, eight posts under a bell of a roof. Aerial g-chalet: a clearing at (190, 830). Small, but it's what the island's for.
 */
export function kiosqueEmpereur(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, r = 3.2, W = hex('#4f3a28'), ROOF = hex('#5d6668'), S = hex('#9c9280')
  prism(out, 0, 0, y - 0.3, y + 0.5, r + 0.5, 8, S, surfaceTag('rock'))
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r
    prism(out, x, z, y + 0.5, y + 3.3, 0.13, 6, W, surfaceTag('planks'))
    const b = ((i + 1) / 8) * Math.PI * 2, x1 = Math.cos(b) * r, z1 = Math.sin(b) * r
    strut(out, [x, y + 3.3, z], [x1, y + 3.3, z1], 0.16, 0.22, W, surfaceTag('planks'), false)
    strut(out, [x, y + 1.3, z], [x1, y + 1.3, z1], 0.05, 0.05, W, surfaceTag('planks'), false)
    strut(out, [x, y + 2.7, z], [(x + x1) / 2, y + 3.25, (z + z1) / 2], 0.05, 0.05, W, surfaceTag('planks'), false)
    strut(out, [x1, y + 2.7, z1], [(x + x1) / 2, y + 3.25, (z + z1) / 2], 0.05, 0.05, W, surfaceTag('planks'), false)
  }
  prism(out, 0, 0, y + 3.45, y + 4.5, r + 0.7, 8, ROOF, surfaceTag('metal'), 1.8)
  prism(out, 0, 0, y + 4.5, y + 5.4, 1.8, 8, shade(ROOF, 0.94), surfaceTag('metal'), 0.5)
  prism(out, 0, 0, y + 5.4, y + 6.2, 0.1, 5, hex('#a98b3a'), surfaceTag('metal'), 0.03)
}

/* ------------------------------------------------------------------------------------------------ Lac Daumesnil */

/**
 * THE TEMPLE AND THE GROTTO OF THE ÎLE DE REUILLY (Davioud, 1860s; "rotonde romantique", fr.wikipedia; OSM's Temple Grec, way/439501438, and Grotte de la Gloriette, node/11928201569): a round temple of eight Doric columns under a low dome, on a crag at the island's south tip, the grotto and its fall in the rock below it, looking down the
 * lake. Past the box's east edge and on the fringe, where the rider sees it across the water from the south shore. −z toward the lake, south-east.
 */
export function daumesnilTemple(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, top = y + 6.4, S = hex('#b6ad98'), T = shade(S, 1.05), LEAD = hex('#5e686c')
  const rocks: Rock[] = []
  for (let c = 0; c < 4; c++) {
    const R = 8.4 - c * 1.7, n = 11 - c * 2
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + c * 0.4, x = Math.cos(a) * R, z = Math.sin(a) * R
      // (a gap for the grotto's mouth, on −z)
      if (c < 2 && z < -R * 0.7 && Math.abs(x) < 2.8) continue
      rocks.push([x, -0.4 + c * 1.7, z, 2.3 - c * 0.15, 1.8, 2.1 - c * 0.15])
    }
  }
  block(out, -3.2, 3.2, -6.6, 0, y - 0.6, y + 3.6, DARK)
  archOn(out, '-z', -6.65, 0, y - 0.6, 4, 4, hex('#0b0a09'), 0.02)
  pile(out, y, rocks, hex('#847a68'))
  prism(out, 0, 0, y + 2, top, 4.4, 14, shade(SAND, 0.82), surfaceTag('rock'), 3.9)
  // the steps, round the back, are hidden; the temple
  const r = 3.1
  prism(out, 0, 0, top, top + 0.3, r + 0.8, 16, shade(S, 0.92), surfaceTag('ashlar'))
  prism(out, 0, 0, top + 0.3, top + 0.6, r + 0.5, 16, S, surfaceTag('ashlar'))
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r
    prism(out, x, z, top + 0.6, top + 4.3, 0.3, 8, S, surfaceTag('ashlar'), 0.24)
    prism(out, x, z, top + 4.3, top + 4.5, 0.38, 8, T, surfaceTag('ashlar'))
  }
  prism(out, 0, 0, top + 4.5, top + 5.3, r + 0.5, 16, T, surfaceTag('ashlar'))
  prism(out, 0, 0, top + 5.3, top + 5.5, r + 0.7, 16, shade(T, 1.03), surfaceTag('ashlar'))
  dome(out, 0, 0, top + 5.5, r + 0.3, 2, LEAD, 12, shade(LEAD, 0.85))
  prism(out, 0, 0, top + 7.4, top + 8, 0.4, 8, S, surfaceTag('ashlar'), 0.1)
  // the water out of the grotto, and down over the rock from a lip under the temple
  out.water.push({ kind: 'sheet', a: [-1.4, y + 3.6, -6.6], b: [1.4, y + 3.6, -6.6], out: 0.2, drop: 4.6 })
  out.water.push({ kind: 'splash', at: [0, y - 0.8, -7.6], r: 1.6 })
}

/**
 * LE GRAND ROCHER DE VINCENNES (Charles Letrosne, 1934; the zoo's, OSM's way/262416016): 65 m of artificial rock on a concrete frame, standing over the trees east of the lake: far and away the oddest thing on Paris's eastern skyline, seen from the Périphérique and the Porte Dorée.
 * In for the Parc Floral (owner: "highly visible and unusual"). Sits on the fringe, 700 m past the box, and only as a silhouette: a stepped mass of huge crags, the pale crust going grey, the viewing platform on top. Tripo could do it better; this has the outline.
 */
export function grandRocher(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, H = 65, ROCK = hex('#6e6a60')
  const rocks: Rock[] = []
  const tiers = 13
  for (let c = 0; c < tiers; c++) {
    const t = c / (tiers - 1)
    // a broad foot, a waist, the head: the crust pushed out in shoulders
    const R = Math.pow(1 - t, 1.25) * 34 + 4.5 + Math.sin(t * Math.PI * 3) * 2.2
    const n = Math.max(5, Math.round(R * 0.55))
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + c * 0.7, m = 0.85 + hash(i, c) * 0.3
      const off = t < 0.5 ? 0 : Math.sin(c) * 2.5
      rocks.push([Math.cos(a) * R * m + off, c * (H - 6) / tiers + hash(c, i) * 1.5, Math.sin(a) * R * m, 6.2 - t * 2.6 + hash(i + 3, c) * 2, 4.4 + hash(c + 1, i) * 1.6, 6 - t * 2.6 + hash(i, c + 2) * 2])
    }
  }
  // the core behind the crags, so there's no daylight through it
  for (let k = 0; k < 6; k++) {
    const t0 = k / 6, t1 = (k + 1) / 6
    prism(out, 0, 0, y + t0 * (H - 3), y + t1 * (H - 3), Math.pow(1 - t0, 1.25) * 30 + 3, 10, shade(ROCK, 0.68), surfaceTag('rock'), Math.pow(1 - t1, 1.25) * 30 + 3)
  }
  pile(out, y, rocks, ROCK)
  // the top's platform and its rail
  prism(out, 0, 0, y + H - 3, y + H - 2, 4.5, 10, hex('#6c6a64'), surfaceTag('concrete'))
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; prism(out, Math.cos(a) * 4.3, Math.sin(a) * 4.3, y + H - 2, y + H - 0.9, 0.04, 4, hex('#272a2c'), 0) }
  prism(out, 0, 0, y + H - 1, y + H - 0.9, 4.4, 10, hex('#272a2c'), 0)
}

/* ------------------------------------------------------------------------------------------- Île Saint-Germain */

/** Dubuffet's Hourloupe: which colour a patch of skin is. White cells with blue or red hatching, in black outlines. */
function hourloupe(u: number, v: number, seed: number): Rgb {
  const WHITE = hex('#c8c6bd'), BLACK = hex('#17181a'), BLUE = hex('#1e4d8f'), RED = hex('#a12e2a')
  const cu = Math.floor(u / 3), cv = Math.floor(v / 3)
  const f = hash(cu + seed, cv)
  const fu = u / 3 - cu, fv = v / 3 - cv
  // each cell's edge, the black line, wandering a bit
  if (fu < 0.14 + hash(cv, cu) * 0.1 || fv < 0.14 + hash(cu, cv) * 0.1) return BLACK
  if (f > 0.72) return Math.floor((u + v) * 1.7) % 2 ? BLUE : WHITE
  if (f > 0.6) return Math.floor((u - v) * 1.7) % 2 ? RED : WHITE
  return WHITE
}

/**
 * LA TOUR AUX FIGURES (Jean Dubuffet, 1967–88, built 1988; OSM way/105152323, `height` 24, a 9 m disc; Parc de l'Île Saint-Germain): a lump of a tower 24 m high, a stack of bulging shapes in sprayed epoxy, in the Hourloupe's white, black and blue. Lobes round a core; each patch of skin is painted by `hourloupe`.
 * The stand-in's job is the shape and the painted cells; it's listed for Tripo for the real curves.
 */
export function tourAuxFigures(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, tag = 0
  const lobe = (cx: number, cz: number, y0: number, y1: number, r: number, seed: number): void => {
    const lon = 14, lat = 10
    const P = (i: number, j: number): [number, number, number] => {
      const a = ((i % lon) / lon) * Math.PI * 2, t = j / lat
      // a bulging shape, flattened at its foot, pinched at its waist
      const prof = Math.pow(Math.sin(Math.min(0.97, t * 0.94 + 0.03) * Math.PI), 0.55)
      const m = prof * (1 + (hash(i % lon, j + seed) - 0.5) * 0.14)
      return [cx + Math.cos(a) * r * m, y0 + t * (y1 - y0), cz + Math.sin(a) * r * m]
    }
    for (let j = 0; j < lat; j++) {
      for (let i = 0; i < lon; i++) {
        const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1)
        const ang = ((i + 0.5) / lon) * Math.PI * 2
        const ny = (r * (Math.hypot(a[0] - cx, a[2] - cz) - Math.hypot(d[0] - cx, d[2] - cz))) / Math.max(1, (y1 - y0) / lat * r)
        const u = ((i + 0.5) / lon) * Math.PI * 2 * r, v = y0 + (j + 0.5) / lat * (y1 - y0)
        out.quad([a, d, c, b], [Math.cos(ang), Math.max(-0.5, Math.min(1, ny * 0.4)), Math.sin(ang)], UV, hourloupe(u, v, seed), tag)
      }
    }
  }
  lobe(0, 0, y, y + 15, 7, 1)
  lobe(3.6, 2.6, y + 3, y + 13, 4.8, 2)
  lobe(-3.8, 1.8, y + 1, y + 12, 4.6, 3)
  lobe(-1, -3.8, y + 2, y + 14, 4.8, 4)
  lobe(0.6, 0.2, y + 12, y + 21, 4.6, 5)
  lobe(-1.8, -0.8, y + 15, y + 24, 2.8, 6)
  lobe(2.2, 1, y + 16, y + 22.5, 2.5, 7)
}

/* --------------------------------------------------------------------------------- Parc Edmond-de-Rothschild */

/**
 * LE CHÂTEAU ROTHSCHILD (Armand, 1855–61, for Baron James; Boulogne; OSM way/72055923, 57 × 26 m, turned 12° from the meridian, four square pavilions at its corners): Louis XVI in pale stone, ground floor and tall first floor under a balustrade, the pavilions a step forward. Wrecked in the war, empty since 1980 and being made good; IGN's aerial has it under a
 * long pale roof, as drawn here, its windows open and dark. OSM's 28 m is wrong: 15 m to the cornice, on its low terrace. Local x along the long side; −z to the west, the old park.
 */
export function rothschildChateau(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, HX = Math.min(28.5, fit.hx), HZ = Math.min(13, fit.hz), p = palette('#b8ae98', '#a8a69e'), S = p.stone, T = p.trim, tag = surfaceTag('ashlar')
  const VOID: Rgb = [0.07, 0.07, 0.08]
  const E = y + 14.5, P = 7
  block(out, -HX - 2, HX + 2, -HZ - 2, HZ + 2, y - 1, y + 0.5, shade(S, 0.82), tag)
  block(out, -HX + P, HX - P, -HZ + 1, HZ - 1, y, E - 1, S, tag)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x0 = sx < 0 ? -HX : HX - P, z0 = sz < 0 ? -HZ : HZ - 8
    block(out, x0, x0 + P, z0, z0 + 8, y, E + 1, S, tag)
    block(out, x0 - 0.3, x0 + P + 0.3, z0 - 0.3, z0 + 8.3, E + 0.2, E + 1, T, tag)
    roof(out, x0, x0 + P, z0, z0 + 8, E + 1, 3, 2.2, 2.2, p.slate)
  }
  for (const f of ['-z', '+z'] as const) {
    const z = f === '-z' ? -HZ + 1 : HZ - 1
    const zp = f === '-z' ? -HZ : HZ
    // the long fronts: bays of tall French windows, arched on the ground floor
    for (let x = -HX + P + 2; x < HX - P - 1; x += 3.8) {
      archOn(out, f, z, x, y + 1, 1.9, 5.4, VOID, 0.06)
      rectOn(out, f, z, x - 1, x + 1, y + 7.6, y + 12, T, 0.04)
      rectOn(out, f, z, x - 0.8, x + 0.8, y + 7.8, y + 11.8, VOID, 0.07)
    }
    slabOn(out, f, z, -HX + P, HX - P, y + 6.7, y + 7.1, 0.2, T)
    slabOn(out, f, z, -HX + P, HX - P, E - 1, E - 0.3, 0.45, T)
    // and the pavilions'
    for (const cx of [-HX + P / 2, HX - P / 2]) {
      for (const dx of [-1.7, 1.7]) {
        archOn(out, f, zp, cx + dx, y + 1, 1.7, 5, VOID, 0.06)
        rectOn(out, f, zp, cx + dx - 0.75, cx + dx + 0.75, y + 7.8, y + 11.8, VOID, 0.06)
      }
      slabOn(out, f, zp, cx - P / 2, cx + P / 2, y + 6.7, y + 7.1, 0.2, T)
      for (const dx of [-3.2, 3.2]) slabOn(out, f, zp, cx + dx - 0.3, cx + dx + 0.3, y + 0.5, E, 0.14, T)
    }
  }
  for (const s of [-1, 1]) for (let z = -HZ + 1.5; z < HZ - 1; z += 3.6) {
    const f = s < 0 ? '-x' : '+x'
    archOn(out, f, s * HX, z, y + 1, 1.7, 5, VOID, 0.06)
    rectOn(out, f, s * HX, z - 0.75, z + 0.75, y + 7.8, y + 11.8, VOID, 0.06)
  }
  // the balustrade along the long fronts, and the protective roof
  for (const z of [-HZ + 1, HZ - 1]) {
    block(out, -HX + P, HX - P, z - 0.2, z + 0.2, E - 0.3, E + 0.6, T, tag)
    for (let x = -HX + P + 0.4; x < HX - P; x += 0.9) block(out, x - 0.08, x + 0.08, z - 0.08, z + 0.08, E + 0.6, E + 1.2, T, tag)
    block(out, -HX + P, HX - P, z - 0.22, z + 0.22, E + 1.2, E + 1.4, T, tag)
  }
  roof(out, -HX + P - 0.4, HX - P + 0.4, -HZ + 1, HZ - 1, E - 0.2, 3.6, 0, HZ - 1, hex('#a6a59e'))
}

/**
 * THE ROCKS AT THE HEAD OF THE ROTHSCHILD LAKE (the Baron's rockwork, 1860, the cascade dry now; aerial g-rothschild, the lake's north-east arm at (590, 500)). Boulders and a low dry fall among the trees. Point entry; −z faces the water.
 */
export function rothschildRocks(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  pile(out, y, [
    [-6, -0.3, 0.4, 2, 1.2, 1.6], [-3.4, 0, 1, 2.2, 1.6, 1.8], [-0.8, 0.5, 1.6, 2, 2, 1.8], [2, 0.5, 1.5, 2, 2.1, 1.7], [4.6, 0, 0.9, 2.2, 1.5, 1.7], [7, -0.3, 0.3, 1.8, 1, 1.5],
    [-1.8, 2.6, 2.8, 1.5, 1.2, 1.4], [1.4, 2.7, 2.8, 1.6, 1.3, 1.4], [-4.6, -0.4, -1.1, 1.2, 0.7, 1], [4, -0.4, -1.1, 1.3, 0.7, 1],
  ], hex('#6e6a5e'))
}
