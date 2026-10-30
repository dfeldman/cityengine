import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { areaOf, bed, centroid, FIXED, hex, noise, offsetRing, shade, UV, wound, type P2, type Rgb } from './common.ts'
import { ALPIN_BEDS, IRIS_ROWS, PERSPECTIVE_BEDS, PLANE_ROWS, ROSERAIE_BEDS } from './jardin-layout.ts'

const LAWN = hex('#4f7a35')
const LAWN_DEEP = hex('#44702f')
const BOTANIC = [hex('#3d6a2c'), hex('#4c7a33'), hex('#38622e'), hex('#567f38')]
/**
 * The summer's colours by the length of the perspective, one run after another: the Carrés are planted in turn, not as one bed.
 * Half of each list is leaf: a border seen from a path is flowers in their foliage, and solid colour reads as paint.
 */
const LEAF = [hex('#3f6a2e'), hex('#4a7534')]
const BORDERS: Rgb[][] = [
  [hex('#a23a30'), hex('#b8702f'), hex('#b89a3c'), ...LEAF],
  [hex('#a84a70'), hex('#b98aa0'), hex('#c4bfae'), ...LEAF],
  [hex('#6b5392'), hex('#9d97b8'), hex('#b9b4a4'), ...LEAF],
  [hex('#b89a3c'), hex('#b8702f'), hex('#a23a30'), ...LEAF],
  [hex('#a8527a'), hex('#c4bfae'), hex('#79588f'), ...LEAF],
]

const pointsOf = (a: number[], from = 0): P2[] => {
  const r: P2[] = []
  for (let i = from; i + 1 < a.length; i += 2) r.push({ x: a[i], z: a[i + 1] })
  return r
}
const perimeter = (r: P2[]): number => r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + Math.hypot(q.x - p.x, q.z - p.z) }, 0)

/** A flower border along a ring: short flat patches in turn, on the bed's top, so it reads as planted and not as painted. */
function border(out: MeshBuilder, ring: P2[], y: number, wide: number, colours: Rgb[], seed: number): void {
  const inner = offsetRing(ring, -wide)
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    const a = ring[i], b = ring[j], c = inner[j], d = inner[i]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const n = Math.max(1, Math.min(14, Math.round(L / 1.9)))
    for (let k = 0; k < n; k++) {
      const u0 = k / n, u1 = (k + 1) / n
      const P = (p: P2, q: P2, u: number): [number, number, number] => [p.x + (q.x - p.x) * u, y, p.z + (q.z - p.z) * u]
      const tone = colours[Math.floor(noise(seed + i, k) * colours.length) % colours.length]
      out.quad([P(a, b, u0), P(a, b, u1), P(d, c, u1), P(d, c, u0)], [0, 1, 0], UV, shade(tone, 0.92 + noise(k, seed) * 0.16), FIXED)
    }
  }
}

/** The inset ring, if it is still a sound ring: a thin or crooked bed's turns itself inside out. */
function inset(ring: P2[], d: number): P2[] | null {
  if (ring.length > 12) return null
  const r = offsetRing(ring, -d)
  const a0 = areaOf(ring), a1 = areaOf(r)
  return Math.sign(a0) === Math.sign(a1) && Math.abs(a1) > Math.abs(a0) * 0.35 ? r : null
}

/** A plant, spun and sized by its place. */
function plant(out: MeshBuilder, p: P2, species: string, h: number, seed: number): void {
  out.plants.push({ x: p.x, z: p.z, species, h: h * (0.85 + noise(seed, 3) * 0.3), spin: noise(seed, 4) * 6.28 })
}

/** Plants evenly round a ring. */
function plantAlong(out: MeshBuilder, ring: P2[], n: number, species: string, h: number, seed: number): void {
  const L = perimeter(ring)
  let at = noise(seed, 1) * (L / n)
  let run = 0
  for (let i = 0; i < ring.length && n > 0; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const e = Math.hypot(b.x - a.x, b.z - a.z)
    while (at <= run + e) {
      const u = (at - run) / e
      plant(out, { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u }, species, h, seed + at)
      at += L / n
    }
    run += e
  }
}

/**
 * The Jardin des Plantes' central perspective (owner, 2026-10-30: "we have the conservatory, but no gardens (but paths between the
 * gardens)"): from the Place Valhubert to the Grande Galerie between two long allées of plane trees, the long rectangular parterres
 * of the Carrés down the middle, the École de botanique's hundreds of small beds beside them. Every bed is OSM's own outline
 * (jardin-layout.ts), raised a hand's breadth on the ground, so the footways between them stay what they are:
 *
 * - the CARRÉS (Lamarck, Mirbel, Thouin, des Rosiers, Descaisne, Mangin): lawn inside a border of flowers, a run of colours in
 *   turn, with dahlias and lavender from the plant library standing in it;
 * - the ÉCOLE DE BOTANIQUE (OSM's way 231579893 and its beds): its beds in four dark greens, small labelled plots of low plants;
 * - the PLANE ROWS: four, either side of each allée, 8.5 m apart. Real trees through the deck path (`form: 'plane'`), which gives
 *   them the city's tree models and level of detail: `out.plants` draws every copy at full cost whatever its distance.
 *
 * The rows' offset of 9 m from OSM's allée lines is an estimate from memory of the place; OSM has no width. The colours are the
 * summer's and invented: the gardeners change them by the season. Not fitted: this draws at its own size, and the manifest's
 * rectangle only clears the city's scattered trees from between the allées. Local x along the allées, toward the Seine.
 */
export function jardinPerspective(out: MeshBuilder, fit: Fit): void {
  const g = (x: number, z: number): number => fit.groundAt?.(x, z) ?? 0
  PERSPECTIVE_BEDS.forEach((row, k) => {
    const ring = wound([pointsOf(row, 1)])[0]
    const area = Math.abs(areaOf(ring))
    const m = centroid(ring)
    const seed = k * 17 + 3
    if (row[0] === 2) {
      // a plot of the École de botanique: low, dark, one of a great many
      const c = BOTANIC[Math.floor(noise(seed, 2) * BOTANIC.length) % BOTANIC.length]
      bed(out, ring, 0.12 + (k % 4) * 0.03, c, hex('#6d6450'))
      if (k % 3 === 0) plant(out, m, k % 6 === 0 ? 'lavender' : 'heather', 0.7, seed)
      return
    }
    const colours = BORDERS[Math.floor((m.x + 260) / 105) % BORDERS.length] ?? BORDERS[0]
    const wide = Math.min(1.1, 0.3 * (2 * area / perimeter(ring)))
    const inner = inset(ring, wide)
    if (row[0] === 1 || !inner || area < 30) {
      // a border or a flower bed: flowers all over
      bed(out, ring, 0.26, LAWN_DEEP, hex('#5f5a48'))
      if (area >= 14 && ring.length <= 12) border(out, ring, 0.3, Math.min(1.1, wide * 2), colours, seed)
      const n = Math.min(3, Math.round(area / 22))
      if (n > 0) plantAlong(out, ring, n, k % 2 ? 'dahlia' : 'lavender', k % 2 ? 1.0 : 0.7, seed)
      return
    }
    bed(out, ring, 0.14, LAWN, hex('#5f5a48'))
    border(out, ring, 0.18, wide, colours, seed)
    bed(out, inner, 0.22, k % 2 ? LAWN : LAWN_DEEP)
    const n = Math.min(4, Math.round(area / 90))
    if (n > 0) plantAlong(out, offsetRing(ring, -wide / 2), n, k % 2 ? 'dahlia' : 'lavender', k % 2 ? 1.1 : 0.75, seed)
  })
  for (const [x0, x1, z] of PLANE_ROWS) {
    // (a run of k trees at 8.5 m: half a pitch beyond each end, so `deckRow`'s count of length over pitch is k)
    const a = x0 - 4.2, b = x1 + 4.2
    const y = g((x0 + x1) / 2, z)
    out.decks.push({ ring: [{ x: a, z: z - 0.6 }, { x: b, z: z - 0.6 }, { x: b, z: z + 0.6 }, { x: a, z: z + 0.6 }], y, trees: true, shrubs: false, spacing: 8.5, keepOff: 0, form: { form: 'plane', h: [15, 20] } })
  }
}

/**
 * The gardens either side of the perspective: the ROSERAIE (way/83913794 and the fenced lawns beside it, way/97183033 and its
 * neighbours; its rose rows are `bush_flowering`, since the library has no rose), the JARDIN ALPIN (way/28911106: its beds as OSM
 * has them, heather and the rock library's stones) and the IRIS GARDEN (way/83976107, whose beds OSM does not draw: long strips
 * across its outline at 3.6 m, an assumption, with lavender in them, since the library's iris is the Japanese Tea Garden's and
 * costs twenty times as much). The Jardin écologique (way/28894002) is a wood under a fence, as the city draws it. Local x east,
 * z north, not fitted.
 */
export function jardinAnnexes(out: MeshBuilder): void {
  ROSERAIE_BEDS.forEach((row, k) => {
    const ring = wound([pointsOf(row)])[0]
    const area = Math.abs(areaOf(ring))
    bed(out, ring, 0.1, LAWN, hex('#6a6450'))
    const inner = inset(ring, 1.2)
    if (inner) border(out, ring, 0.14, 1.2, [hex('#a83a52'), hex('#bd8096'), hex('#c8bfae'), hex('#8e3044'), ...LEAF], k + 40)
    plantAlong(out, inner ?? ring, Math.min(26, Math.round(area / 50)), 'bush_flowering', 1.2, k + 41)
  })
  ALPIN_BEDS.forEach((row, k) => {
    const ring = wound([pointsOf(row)])[0]
    const area = Math.abs(areaOf(ring))
    bed(out, ring, 0.22, hex('#566a44'), hex('#70695a'))
    plantAlong(out, ring, Math.min(9, Math.round(area / 22)), 'heather', 0.6, k + 60)
    if (area > 60) out.plants.push({ ...centroid(ring), species: 'rock:grey', h: 0.9, spin: noise(k, 9) * 6.28 })
  })
  const IRIS = [hex('#5a4e92'), hex('#a597bc'), hex('#b89a3c'), hex('#6c4580')]
  IRIS_ROWS.forEach(([x0, z0, x1, z1], k) => {
    const L = Math.hypot(x1 - x0, z1 - z0) || 1
    const nx = -(z1 - z0) / L * 0.9, nz = (x1 - x0) / L * 0.9
    const ring: P2[] = [{ x: x0 - nx, z: z0 - nz }, { x: x1 - nx, z: z1 - nz }, { x: x1 + nx, z: z1 + nz }, { x: x0 + nx, z: z0 + nz }]
    bed(out, ring, 0.14, LAWN_DEEP, hex('#6a6450'))
    border(out, ring, 0.18, 0.5, [IRIS[k % 4], IRIS[(k + 1) % 4], ...LEAF], k + 80)
    plantAlong(out, ring, Math.min(7, Math.round(L / 6)), 'lavender', 0.75, k + 81)
  })
}
