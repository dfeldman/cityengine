/**
 * THE BOIS DE VINCENNES GARDENS (docs/landmarks/MODEL-VINCENNES.md, roster #10): what OSM's grass, water and flowerbeds don't say.
 * OSM already maps the Parc Floral's 65 flowerbeds, its lawns, the Miroir d'eau and the Jardin aquatique's water, and the château's
 * lawns (80 grass ways round the enceinte): the bake draws those as they are. These plans add the planting on OSM's outlines
 * (vincennes-outlines.ts): the Vallée des fleurs' gardens laid out in strips of beds, the water garden's shrub margins, the tropical
 * garden's alleys and lawns, the Arboretum's specimen trees and glades, and the École Du Breuil's nursery rows.
 * Each garden is laid out on its own axis (`bearing`), its shapes kept to those whose corners fall inside the outline.
 */
import { frame, rect, type Frame, type GardenPlan, type LL } from './plan.ts'
import { OUTLINES } from './vincennes-outlines.ts'

// ---- tunables
/** the Vallée des fleurs' gardens (Iris, Tulipes, Dahlias): parallel beds along the garden's axis, a grass walk between */
const VALLEE = { bed: 1.8, walk: 1.6, margin: 1, minLen: 3 }
/** the bearings the gardens were planted on (deg), read off OSM's long edges */
const BEARING: Record<string, number> = {
  w278043499: 0, w278043500: 0, w278043501: 30, w985142447: 30, w193110124: 0, w108487692: 75, w91280888: 0, w50071721: 0,
}
/** the water garden: unclipped shrubs round the outline, every `step` m */
const AQUATIQUE = { step: 7, h: 1.8 }
/** the Jardin tropical: the main alley down its axis and the cross alley, gravel `w` wide, lined with trees; lawns either side */
const TROPICAL = { alley: 6, cross: 5, treeStep: 9, treeH: 15, lawnInset: 8, shrubStep: 12, shrubH: 2 }
/** the Arboretum: specimen trees on a loose grid (jittered), glades of open lawn where the hash leaves gaps */
const ARBORETUM = { grid: 16, jitter: 5, keep: 0.65, hMin: 10, hMax: 24, margin: 8 }
/** the École Du Breuil: nursery rows of young trees, beds between */
const BREUIL = { rowGap: 6, step: 4, h: 5, margin: 6, bedEvery: 3 }

type EN = [number, number]
const M_LAT = 111320
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

/** a garden's outline, its own frame (centred on the outline, along its bearing), and the outline in that frame's [u, v] */
function garden(id: string): { ll: LL[]; f: Frame; uv: EN[]; box: [number, number, number, number]; inside: (u: number, v: number) => boolean } {
  const ll = OUTLINES[id] as LL[]
  const lat = ll.reduce((s, p) => s + p[0], 0) / ll.length, lon = ll.reduce((s, p) => s + p[1], 0) / ll.length
  const bd = BEARING[id] ?? 0, b = (bd * Math.PI) / 180, mLon = M_LAT * Math.cos((lat * Math.PI) / 180)
  const f = frame(lat, lon, bd)
  const uv: EN[] = ll.map(([a, o]) => {
    const n = (a - lat) * M_LAT, e = (o - lon) * mLon
    return [n * Math.cos(b) + e * Math.sin(b), -n * Math.sin(b) + e * Math.cos(b)]
  })
  const inside = (u: number, v: number): boolean => {
    let r = false
    for (let i = 0, j = uv.length - 1; i < uv.length; j = i++) {
      const [ui, vi] = uv[i], [uj, vj] = uv[j]
      if ((vi > v) !== (vj > v) && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) r = !r
    }
    return r
  }
  const us = uv.map((p) => p[0]), vs = uv.map((p) => p[1])
  return { ll, f, uv, box: [Math.min(...us), Math.max(...us), Math.min(...vs), Math.max(...vs)], inside }
}
const steps = (a: number, b: number, d: number): number[] => {
  const n = Math.max(1, Math.round((b - a) / d))
  return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n)
}
/** the longest run of a line v = const that stays inside, sampled every metre */
function runs(g: ReturnType<typeof garden>, v: number, m: number): [number, number][] {
  const [u0, u1] = g.box, out: [number, number][] = []
  let a: number | null = null
  for (let u = u0; u <= u1 + 1; u += 1) {
    const ok = u <= u1 && g.inside(u, v) && g.inside(u - m, v) && g.inside(u + m, v)
    if (ok && a === null) a = u
    if (!ok && a !== null) { out.push([a, u - 1]); a = null }
  }
  return out
}

/** a Vallée des fleurs garden: strips of bed down its axis, grass walks between, on OSM's outline */
function vallee(id: string, name: string): GardenPlan {
  const g = garden(id), V = VALLEE, beds: NonNullable<GardenPlan['beds']> = []
  for (let v = g.box[2] + V.margin; v + V.bed < g.box[3] - V.margin; v += V.bed + V.walk) {
    for (const [a, b] of runs(g, v + V.bed / 2, V.margin)) {
      if (b - a >= V.minLen && g.inside(a, v) && g.inside(a, v + V.bed) && g.inside(b, v) && g.inside(b, v + V.bed)) beds.push({ ring: rect(g.f, a, v, b, v + V.bed) })
    }
  }
  return { name: `Parc Floral: ${name}`, ring: g.ll, lawn: [g.ll], beds }
}

/** the Jardin aquatique: shrubs round the margin of its water (OSM's) */
function aquatique(): GardenPlan {
  const g = garden('w193110124'), topiary: NonNullable<GardenPlan['topiary']> = []
  const r = [...g.uv, g.uv[0]]
  let left = 0
  for (let i = 1; i < r.length; i++) {
    const [au, av] = r[i - 1], [bu, bv] = r[i], L = Math.hypot(bu - au, bv - av)
    for (let d = left; d < L; d += AQUATIQUE.step) topiary.push({ at: g.f(au + ((bu - au) * d) / L, av + ((bv - av) * d) / L), shape: 'shrub', h: AQUATIQUE.h })
    left = (left - L) % AQUATIQUE.step; if (left < 0) left += AQUATIQUE.step
  }
  return { name: 'Parc Floral: the Jardin aquatique', ring: g.ll, topiary }
}

/** the Jardin d'agronomie tropicale: the long alley through the pavilions and the cross alley, trees along them, lawns between */
function tropical(): GardenPlan {
  const g = garden('w108487692'), T = TROPICAL, [u0, u1, v0, v1] = g.box
  const gravel: LL[][] = [], rows: NonNullable<GardenPlan['rows']> = [], lawn: LL[][] = [], topiary: NonNullable<GardenPlan['topiary']> = []
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2
  for (const [a, b] of runs(g, cv, T.alley / 2)) {
    gravel.push(rect(g.f, a, cv - T.alley / 2, b, cv + T.alley / 2))
    for (const s of [-1, 1]) rows.push({ line: [g.f(a, cv + s * (T.alley / 2 + 2)), g.f(b, cv + s * (T.alley / 2 + 2))], spacing: T.treeStep, h: T.treeH })
  }
  // the cross alley: along v at the garden's middle u
  const [va, vb] = [v0, v1].map((v, i) => { let x = v; while (!g.inside(cu, x) && (i ? x > cv : x < cv)) x += i ? -1 : 1; return x })
  if (vb - va > 10) gravel.push(rect(g.f, cu - T.cross / 2, va, cu + T.cross / 2, vb))
  // the four lawns between the alleys, kept where their corners are inside
  for (const [a, b] of [[u0, cu - T.cross / 2], [cu + T.cross / 2, u1]]) for (const [c, d] of [[v0, cv - T.alley / 2], [cv + T.alley / 2, v1]]) {
    const q: [number, number, number, number] = [a + T.lawnInset, c + T.lawnInset, b - T.lawnInset, d - T.lawnInset]
    for (let k = 0; k < 6; k++) {
      if ([[q[0], q[1]], [q[2], q[1]], [q[2], q[3]], [q[0], q[3]]].every(([u, v]) => g.inside(u, v))) { lawn.push(rect(g.f, ...q)); break }
      const su = (q[2] - q[0]) * 0.08, sv = (q[3] - q[1]) * 0.08
      q[0] += su; q[2] -= su; q[1] += sv; q[3] -= sv
    }
  }
  for (const u of steps(u0, u1, T.shrubStep)) for (const v of [v0 + T.lawnInset / 2, v1 - T.lawnInset / 2]) if (g.inside(u, v)) topiary.push({ at: g.f(u, v), shape: 'shrub', h: T.shrubH })
  return { name: "Jardin d'agronomie tropicale", ring: g.ll, gravel, lawn, rows, topiary }
}

/** the Arboretum: specimen trees, one each, on a jittered grid, the gaps its glades */
function arboretum(): GardenPlan {
  const g = garden('w91280888'), A = ARBORETUM, [u0, u1, v0, v1] = g.box, rows: NonNullable<GardenPlan['rows']> = []
  for (let u = u0 + A.margin; u < u1 - A.margin; u += A.grid) for (let v = v0 + A.margin; v < v1 - A.margin; v += A.grid) {
    if (hash(u, v) > A.keep) continue
    const pu = u + (hash(v, u) - 0.5) * 2 * A.jitter, pv = v + (hash(u + 1, v) - 0.5) * 2 * A.jitter
    if (!g.inside(pu, pv) || !g.inside(pu - A.margin, pv) || !g.inside(pu + A.margin, pv)) continue
    const p = g.f(pu, pv)
    rows.push({ line: [p, g.f(pu + 0.5, pv)], spacing: 4, h: A.hMin + hash(pv, pu) * (A.hMax - A.hMin) })
  }
  return { name: 'Arboretum de Paris', ring: g.ll, clearMapped: true, lawn: [g.ll], rows }
}

/** the École Du Breuil: the horticultural school's nursery, rows of young trees, every few rows a bed */
function breuil(): GardenPlan {
  const id = 'w50071721'
  const g = garden(id), B = BREUIL, rows: NonNullable<GardenPlan['rows']> = [], beds: NonNullable<GardenPlan['beds']> = []
  let k = 0
  for (let v = g.box[2] + B.margin; v < g.box[3] - B.margin; v += B.rowGap, k++) {
    for (const [a, b] of runs(g, v, B.margin)) {
      if (b - a < 8) continue
      if (k % B.bedEvery === B.bedEvery - 1) beds.push({ ring: rect(g.f, a, v - 1.5, b, v + 1.5) })
      else rows.push({ line: [g.f(a, v), g.f(b, v)], spacing: B.step, h: B.h })
    }
  }
  return { name: 'École Du Breuil', ring: g.ll, clearMapped: true, rows, beds }
}

export const VINCENNES_GARDENS: GardenPlan[] = [
  vallee('w278043499', 'the Iris garden (north)'),
  vallee('w278043500', 'the Iris garden (south)'),
  vallee('w278043501', 'the Jardin des Tulipes'),
  vallee('w985142447', 'the Jardin des Dahlias'),
  aquatique(),
  tropical(),
  arboretum(),
  breuil(),
]
