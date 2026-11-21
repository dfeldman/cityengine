/**
 * FLOWER GARDENS (owner, 2026-11-20: "do as many rose gardens as you know of. then do any other unique famous flower gardens,
 * eg dahlias, tulips"). Roses are render/roses.ts; here are the other show flowers, drawn the same cheap way (a leafy foot under
 * a cap of `blossom`), the list of gardens whose BAKED beds are planted with them, and a builder that lays out a garden of beds
 * inside an outline for the gardens whose beds OSM does not map.
 *
 *  - FLOWER_GARDENS: lat/lon rings; render/garden.ts plants every baked bed inside one with its flower at runtime (no rebake).
 *  - flowerBed / flowerBorder: one bed, or a border round a lawn, of any flower — the landmarks' way in.
 *  - layoutGarden: parallel beds along an outline's long axis with walks between, for a landmark fitted to the garden's outline.
 *
 * Heights off the ground. Every number a look depends on is in FLOWER (and ROSE).
 */
import type { MeshBuilder } from './buildings.ts'
import { surfaceTag } from './cartoon-material.ts'
import { capPolygonWithHoles } from './buildings.ts'
import { insideRing, lump, roseBed, roseBedShape, roseBorder, roseNoise, ROSE_LEAF, type RoseBedShape } from './roses.ts'

type Rgb = [number, number, number]
type Point = { x: number; z: number }
export type Flower = 'rose' | 'dahlia' | 'tulip' | 'iris'

export const FLOWER = {
  /** dahlias: pitch, height from..to, a staked plant's spread */
  DAHLIA_STEP: 0.9,
  DAHLIA_H: [0.95, 1.45] as [number, number],
  DAHLIA_R: 0.42,
  /** tulips: pitch (they are massed: each cell's cushion touches the next), height, the length of one colour's band along a bed */
  TULIP_STEP: 0.5,
  TULIP_H: 0.42,
  TULIP_BAND: 2.4,
  /** bearded iris: pitch, height from..to, a clump's spread */
  IRIS_STEP: 0.62,
  IRIS_H: [0.6, 0.9] as [number, number],
  IRIS_R: 0.3,
  /** never more than this many plants to a bed */
  BED_MAX: 1400,
  /** layoutGarden's defaults: bed width, walk width, margin inside the outline, a cross walk every so many metres (and its width) */
  BED: 1.8,
  WALK: 1.4,
  MARGIN: 1.5,
  CROSS: 14,
  CROSS_W: 2,
}

// (linear colours)
const DAHLIAS: Rgb[] = [[0.45, 0.02, 0.05], [0.55, 0.05, 0.25], [0.72, 0.28, 0.04], [0.72, 0.56, 0.08], [0.74, 0.71, 0.62],
  [0.66, 0.3, 0.42], [0.3, 0.06, 0.32], [0.7, 0.2, 0.14], [0.6, 0.1, 0.4], [0.74, 0.5, 0.3]]
const TULIPS: Rgb[] = [[0.6, 0.02, 0.03], [0.74, 0.6, 0.04], [0.68, 0.22, 0.36], [0.76, 0.74, 0.66], [0.74, 0.3, 0.03],
  [0.3, 0.07, 0.38], [0.24, 0.01, 0.05], [0.72, 0.42, 0.5]]
const IRISES: Rgb[] = [[0.2, 0.1, 0.48], [0.12, 0.13, 0.5], [0.46, 0.38, 0.62], [0.68, 0.6, 0.12], [0.72, 0.7, 0.66],
  [0.42, 0.2, 0.08], [0.32, 0.08, 0.3]]
const IRIS_LEAF: Rgb = [0.07, 0.12, 0.07]
const FOLIAGE = surfaceTag('foliage')
const BLOSSOM = surfaceTag('blossom')
const pick = (list: Rgb[], a: number, b: number): Rgb => list[Math.floor(roseNoise(a, b) * list.length) % list.length]
const toned = (c: Rgb, f: number): Rgb => [c[0] * f, c[1] * f, c[2] * f]

/** A staked dahlia: a leafy column and a crown of big heads. */
export function dahlia(out: MeshBuilder, x: number, y: number, z: number, h: number, bloom: Rgb, seed: number): void {
  const R = FLOWER.DAHLIA_R
  lump(out, x, y, z, [[0, R * 0.4], [h * 0.45, R * 0.95], [h * 0.78, R], [h, R * 0.55]],
    [{ c: ROSE_LEAF, tag: FOLIAGE }, { c: ROSE_LEAF, tag: FOLIAGE }, { c: bloom, tag: BLOSSOM }], 6, seed * 0.7, seed)
}

/** A cell of massed tulips: a short leafy foot under a level of cups that runs into the next cell's. */
export function tulips(out: MeshBuilder, x: number, y: number, z: number, h: number, bloom: Rgb, seed: number): void {
  const r = FLOWER.TULIP_STEP * 0.62
  lump(out, x, y, z, [[0, r * 0.8], [h * 0.55, r * 0.9], [h, r * 0.85]], [{ c: ROSE_LEAF, tag: FOLIAGE }, { c: bloom, tag: BLOSSOM }], 4, seed * 0.3 + Math.PI / 4, seed)
}

/** A clump of bearded iris: a fan of grey-green straps and the flags on top. */
export function iris(out: MeshBuilder, x: number, y: number, z: number, h: number, bloom: Rgb, seed: number): void {
  const R = FLOWER.IRIS_R
  lump(out, x, y, z, [[0, R * 0.55], [h * 0.68, R], [h, R * 0.7]], [{ c: IRIS_LEAF, tag: FOLIAGE }, { c: bloom, tag: BLOSSOM }], 5, seed, seed)
}

/** one plant of `flower` at a point; `bed` is the bed's seed (a bed's variety), `u` how far along the bed (a tulip band's) */
function plant(out: MeshBuilder, flower: Flower, x: number, y: number, z: number, bed: number, u: number): void {
  const s = Math.floor(x * 7 + z * 13)
  if (flower === 'dahlia') {
    const [a, b] = FLOWER.DAHLIA_H
    // (a dahlia garden is a collection: the variety changes every plant or two)
    dahlia(out, x, y, z, a + roseNoise(z, x) * (b - a), pick(DAHLIAS, Math.round(x * 0.7), Math.round(z * 0.7) + bed), s)
  } else if (flower === 'tulip') {
    tulips(out, x, y, z, FLOWER.TULIP_H * (0.9 + roseNoise(x, z) * 0.2), toned(pick(TULIPS, bed, Math.floor(u / FLOWER.TULIP_BAND)), 0.92 + roseNoise(z, x) * 0.16), s)
  } else {
    const [a, b] = FLOWER.IRIS_H
    iris(out, x, y, z, a + roseNoise(z, x) * (b - a), pick(IRISES, bed, roseNoise(x, z) < 0.8 ? 0 : 1), s)
  }
}
const stepOf = (flower: Flower): number => (flower === 'dahlia' ? FLOWER.DAHLIA_STEP : flower === 'tulip' ? FLOWER.TULIP_STEP : FLOWER.IRIS_STEP)

/** A bed of `flower`, its part inside x0..x1, z0..z1. `y(x, z)` the bed top's height (0 for a draped tile). */
export function flowerBed(out: MeshBuilder, flower: Flower, ring: Point[], shape: RoseBedShape, seed: number, x0: number, z0: number, x1: number, z1: number, y: (x: number, z: number) => number = () => 0): void {
  if (flower === 'rose') return roseBed(out, ring, shape, seed, x0, z0, x1, z1, y)
  const step = Math.max(stepOf(flower), Math.sqrt(shape.area / FLOWER.BED_MAX))
  const [a, b] = shape.spine
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
  for (let zi = Math.ceil(z0 / step); zi * step < z1; zi++) {
    const z = zi * step
    for (let x = (Math.ceil(x0 / step - (zi & 1) * 0.5) + (zi & 1) * 0.5) * step; x < x1; x += step) {
      const px = x + (roseNoise(x, z + 3) - 0.5) * step * 0.25, pz = z + (roseNoise(x + 3, z) - 0.5) * step * 0.25
      if (!insideRing(ring, px, pz)) continue
      plant(out, flower, px, y(px, pz), pz, seed, (px - a.x) * ux + (pz - a.z) * uz)
    }
  }
}

/** A row of `flower` just inside a lawn's edge, its part in x0..x1, z0..z1. */
export function flowerBorder(out: MeshBuilder, flower: Flower, ring: Point[], seed: number, x0: number, z0: number, x1: number, z1: number, y: (x: number, z: number) => number = () => 0): void {
  if (flower === 'rose') return roseBorder(out, ring, seed, x0, z0, x1, z1, y)
  const N = ring.length, step = stepOf(flower)
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= N; cz /= N
  const inner = ring.map((p) => { const d = Math.hypot(p.x - cx, p.z - cz) || 1, k = Math.max(0, d - 0.6) / d; return { x: cx + (p.x - cx) * k, z: cz + (p.z - cz) * k } })
  let run = 0
  for (let i = 0; i < N; i++) {
    const p = inner[i], q = inner[(i + 1) % N]
    const L = Math.hypot(q.x - p.x, q.z - p.z), n = Math.floor(L / step)
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, px = p.x + (q.x - p.x) * t, pz = p.z + (q.z - p.z) * t
      run += step
      if (px < x0 || px >= x1 || pz < z0 || pz >= z1 || !insideRing(ring, px, pz)) continue
      plant(out, flower, px, y(px, pz), pz, seed, run)
    }
  }
}

/** a bed's whole extent */
const boxOf = (r: Point[]): [number, number, number, number] =>
  r.reduce<[number, number, number, number]>((b, p) => [Math.min(b[0], p.x), Math.min(b[1], p.z), Math.max(b[2], p.x), Math.max(b[3], p.z)], [Infinity, Infinity, -Infinity, -Infinity])

export interface GardenLayout {
  flower: Flower
  /** bed width, walk width, margin inside the outline, cross walk every / width (FLOWER's when absent) */
  bed?: number
  walk?: number
  margin?: number
  cross?: number
  crossW?: number
  /** the ground between the beds */
  ground?: 'lawn' | 'gravel'
  /** the beds run across the outline's long axis, not along it; `turn` degrees more */
  across?: boolean
  turn?: number
  seed?: number
}
// (a landmark's mesh lights brighter than the city's ground: garden.ts's lawn tint read lime here, 2026-11-20)
const GROUND: Record<'lawn' | 'gravel' | 'soil', Rgb> = { lawn: [0.12, 0.2, 0.075], gravel: [0.72, 0.67, 0.55], soil: [0.2, 0.15, 0.1] }

/**
 * A show garden inside `ring` (a landmark's fitted outline, local x its long axis): its ground, then strips of bed `bed` wide with
 * walks `walk` wide between, cut by cross walks, every bed planted. A bed is kept where its corners are all inside the outline pulled
 * in by the margin. For a draped landmark: heights are off the ground.
 */
export function layoutGarden(out: MeshBuilder, ring: Point[], o: GardenLayout): void {
  const bed = o.bed ?? FLOWER.BED, walk = o.walk ?? FLOWER.WALK, margin = o.margin ?? FLOWER.MARGIN
  const cross = o.cross ?? FLOWER.CROSS, crossW = o.crossW ?? FLOWER.CROSS_W, seed = o.seed ?? 1
  capPolygonWithHoles(out, [ring], 0.03, GROUND[o.ground ?? 'lawn'], 0, 30, 4)
  // (the garden's own frame: a along its long axis, b across; `across` turns the beds a quarter, `turn` by degrees)
  const [s0, s1] = roseBedShape(ring).spine
  const t = Math.atan2(s1.z - s0.z, s1.x - s0.x) + (o.across ? Math.PI / 2 : 0) + ((o.turn ?? 0) * Math.PI) / 180
  const c = Math.cos(t), s = Math.sin(t)
  const toF = (p: Point): Point => ({ x: p.x * c + p.z * s, z: -p.x * s + p.z * c })
  const sw = (a: number, b: number): Point => ({ x: a * c - b * s, z: a * s + b * c })
  const [a0, b0, a1, b1] = boxOf(ring.map(toF))
  const ok = (p: Point): boolean => insideRing(ring, p.x, p.z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => insideRing(ring, p.x + dx * margin, p.z + dz * margin))
  let k = 0
  for (let b = b0 + margin + ((b1 - b0 - 2 * margin) % (bed + walk) + walk) / 2; b + bed <= b1 - margin; b += bed + walk) {
    const segs = Math.max(1, Math.round((a1 - a0) / cross))
    for (let g = 0; g < segs; g++) {
      const sa = a0 + ((a1 - a0) * g) / segs + (g > 0 ? crossW / 2 : 0), ea = a0 + ((a1 - a0) * (g + 1)) / segs - (g < segs - 1 ? crossW / 2 : 0)
      // (shrink the strip's run to where it is inside)
      let p = sa, q = ea
      while (p < q && !(ok(sw(p, b)) && ok(sw(p, b + bed)))) p += 0.4
      while (q > p && !(ok(sw(q, b)) && ok(sw(q, b + bed)))) q -= 0.4
      if (q - p < Math.min(2, bed)) continue
      const r = [sw(p, b), sw(q, b), sw(q, b + bed), sw(p, b + bed)]
      capPolygonWithHoles(out, [r], 0.07, GROUND.soil, 0, 30, 4)
      const [bx0, bz0, bx1, bz1] = boxOf(r)
      flowerBed(out, o.flower, r, roseBedShape(r), seed * 100 + k++, bx0, bz0, bx1 + 0.01, bz1 + 0.01, () => 0.07)
    }
  }
}

/** A builder for a landmark entry at (lat, lon) with `front: 180` (local x east, z north): `layoutGarden` in the lat/lon outline. */
export function gardenBuilder(lat: number, lon: number, ringLL: [number, number][], o: GardenLayout): (out: MeshBuilder) => void {
  const k = 111320 * Math.cos((lat * Math.PI) / 180)
  const ring = ringLL.map(([la, lo]) => ({ x: (lo - lon) * k, z: (la - lat) * 111320 }))
  return (out) => layoutGarden(out, ring, o)
}

/**
 * The gardens whose BAKED beds (OSM's, or a plan's in tools/gardens/) take a flower at runtime (render/garden.ts). Only a
 * garden whose beds are in the bake belongs here; the others are landmarks with `layoutGarden`. `lawns`: extra lawns laid over
 * the plan's gravel.
 */
export const FLOWER_GARDENS: { name: string; flower: Flower; ring: [number, number][]; lawns?: [number, number][][]; edgeLawns?: boolean }[] = [
  {
    // the MUSÉE RODIN's rose garden round The Thinker (OSM's artwork, 48.85561 2.31549): the bake has its five small lawns in the
    // gravel, ~80–180 m² each, and no beds; `edgeLawns` puts the roses round them
    name: 'Musée Rodin: la Roseraie', flower: 'rose', edgeLawns: true,
    ring: [[48.85539, 2.315185], [48.85539, 2.315731], [48.85575, 2.315731], [48.85575, 2.315185]],
  },
  {
    // OSM leisure=garden, garden:style=rosarium "Roseraie de Bagatelle", 10 700 m²
    name: 'Roseraie de Bagatelle', flower: 'rose',
    ring: [
      [48.867146, 2.243211], [48.867121, 2.243378], [48.867038, 2.243404], [48.866729, 2.24395], [48.866752, 2.244143],
      [48.866857, 2.244285], [48.867091, 2.244818], [48.867392, 2.244975], [48.867503, 2.245095], [48.867671, 2.244902],
      [48.867838, 2.244617], [48.867842, 2.244562], [48.86786, 2.244563], [48.867824, 2.244293], [48.867785, 2.244177],
      [48.867604, 2.243829], [48.867693, 2.243756], [48.867815, 2.243724], [48.867437, 2.243379],
    ],
    // the south-west long lawn (OSM landuse=grass), which the plan's gravel over the whole grid painted over
    lawns: [[[48.867284, 2.244096], [48.867108, 2.243862], [48.867042, 2.243976], [48.867218, 2.24421]]],
  },
  {
    // OSM way/278043501 (tools/gardens/vincennes-outlines.ts); its beds are vincennes.ts's Vallée des fleurs plan
    name: 'The Parc Floral de Vincennes: the Jardin des Tulipes', flower: 'tulip',
    ring: [[48.838544, 2.446168], [48.838516, 2.44618], [48.838501, 2.446199], [48.838496, 2.446204], [48.838479, 2.446219], [48.838554, 2.446388], [48.838683, 2.446436], [48.8387, 2.446471], [48.838711, 2.44646], [48.838794, 2.446372], [48.838816, 2.446442], [48.838819, 2.446448], [48.838867, 2.446551], [48.838949, 2.446464], [48.839007, 2.446589], [48.839091, 2.446499], [48.8391, 2.446414], [48.839021, 2.446233], [48.838858, 2.446412], [48.838809, 2.446292], [48.838788, 2.446315], [48.838776, 2.446328], [48.83871, 2.446175]],
  },
  {
    // OSM way/985142447 (tools/gardens/vincennes-outlines.ts); its beds are vincennes.ts's Vallée des fleurs plan
    name: 'The Parc Floral de Vincennes: the Jardin des Dahlias', flower: 'dahlia',
    ring: [[48.837841, 2.446022], [48.837775, 2.446255], [48.83781, 2.446279], [48.837803, 2.446305], [48.837865, 2.446347], [48.837994, 2.446323], [48.838134, 2.446349], [48.838136, 2.446327], [48.838339, 2.446329], [48.838338, 2.4462], [48.838419, 2.446201], [48.838418, 2.446191], [48.838418, 2.446168], [48.83827, 2.446171], [48.83827, 2.446147], [48.838162, 2.446152], [48.838162, 2.446104], [48.837994, 2.44607], [48.837988, 2.446045], [48.837972, 2.446057], [48.837936, 2.446026], [48.837919, 2.446023], [48.837908, 2.446066]],
  },
  {
    // OSM leisure=garden "Jardin des Iris", Bagatelle, beside the Roseraie
    name: 'Parc de Bagatelle: le Jardin des Iris', flower: 'iris',
    ring: [[48.867478, 2.243045], [48.867402, 2.243247], [48.867419, 2.243253], [48.867479, 2.243296], [48.867615, 2.243411], [48.86764, 2.243437],
      [48.867657, 2.243437], [48.867964, 2.243699], [48.867988, 2.243721], [48.868063, 2.243541], [48.868048, 2.243529]],
  },
]
