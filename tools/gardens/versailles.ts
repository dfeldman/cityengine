/**
 * THE GARDENS OF VERSAILLES (Le Nôtre, 1661–1700), as planting: the ground and what grows on it, for the plant library to draw.
 * The fountains and sculpture are not here (GLBs, owner 2026-11-04); OSM draws the water. Laid out on the château's axis:
 * u metres down the garden from the château's centre (bearing 292.75), v to its right (bearing 22.75, north): the builder frame's
 * z and x (docs/landmarks/MODEL-VERSAILLES.md). Bosquets and parterres stand on OSM's outlines (versailles-outlines.ts).
 */
import { frame, rect, type Frame, type GardenPlan, type LL } from './plan.ts'
import { OUTLINES } from './versailles-outlines.ts'
import { ROOMS } from './versailles-rooms.ts'

const F: Frame = frame(48.804578, 2.121154, 292.75)
/** the axis's offset from the château's centre, v (measured on the Parterre d'Eau and Apollon) */
const AXIS = -5

// ---- tunables
/** the bosquets' hornbeam walls (charmilles): height and width */
const CHARMILLE = { h: 5.5, w: 1.4 }
/** the trees massed inside a bosquet, behind its walls */
const BOSQUET_TREES = { spacing: 9, h: 18, margin: 6 }
/** the parterres' box-edged beds: the gap between panels (the walks), the yew cones at the corners */
const PARTERRE = { walk: 4, rim: 1.2, cone: 2.6, ball: 1.4, border: 1.6, box: { h: 0.55, w: 0.4 } }
/** the Orangerie's orange trees in their tubs, along the panels */
const ORANGES = { step: 6, h: 2.6 }
/** the Tapis Vert: the lawn's half-width, the walks either side, and the row of trees along each */
const TAPIS = { u0: 420, u1: 780, lawn: 20, walk: 9, treeStep: 8, treeH: 16 }

/** the Grand Canal's allées: OSM's water (main arm u 945…2615 on the axis, half-width; the cross arm u 1611…1709,
 * v −621…448), double rows of trees set back from the banks along both arms */
const CANAL = { u0: 945, u1: 2615, half: 31, cu0: 1611, cu1: 1709, cv0: -621, cv1: 448, set: [14, 24], step: 8, h: 20 }
/** the Pièce d'eau des Suisses (OSM: u −40…196, v −1169…−486): the double rows of limes round its banks */
const SUISSES = { u0: -40, u1: 196, v0: -1169, v1: -486, set: [12, 22], step: 8, h: 17 }

type Yew = NonNullable<GardenPlan['topiary']>[number]
type Row = NonNullable<GardenPlan['rows']>[number]
const ring = (id: string): LL[] => OUTLINES[id].map(([u, v]) => F(u, v))
const box = (id: string): [number, number, number, number] => {
  const o = OUTLINES[id]
  return [Math.min(...o.map((p) => p[0])), Math.max(...o.map((p) => p[0])), Math.min(...o.map((p) => p[1])), Math.max(...o.map((p) => p[1]))]
}
const steps = (a: number, b: number, d: number): number[] => {
  const n = Math.max(1, Math.round((b - a) / d))
  return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n)
}

/** a parterre: its box split into nu × nv panels by walks, each a lawn with a box-edged bed in it, cones at the corners */
function parterre(name: string, ringLL: LL[], [u0, u1, v0, v1]: [number, number, number, number], nu: number, nv: number,
  o: { oranges?: boolean } = {}): GardenPlan {
  const w = PARTERRE.walk
  const lawn: LL[][] = [], beds: NonNullable<GardenPlan['beds']> = [], topiary: Yew[] = [], hedges: NonNullable<GardenPlan['hedges']> = []
  const du = (u1 - u0 - w * (nu + 1)) / nu, dv = (v1 - v0 - w * (nv + 1)) / nv
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = u0 + w + i * (du + w), b = v0 + w + j * (dv + w)
    lawn.push(rect(F, a, b, a + du, b + dv))
    // the plates-bandes: narrow flower borders round the panel; inside, the green: box edging and a diamond of box
    const e = PARTERRE.rim, bw = PARTERRE.border
    beds.push(...[rect(F, a + e, b + e, a + du - e, b + e + bw), rect(F, a + e, b + dv - e - bw, a + du - e, b + dv - e),
      rect(F, a + e, b + e + bw, a + e + bw, b + dv - e - bw), rect(F, a + du - e - bw, b + e + bw, a + du - e, b + dv - e - bw)].map((q) => ({ ring: q, rim: true })))
    const i0 = e + bw + 1.2, mu = a + du / 2, mv = b + dv / 2
    const edge = rect(F, a + i0, b + i0, a + du - i0, b + dv - i0)
    hedges.push({ line: [...edge, edge[0]], ...PARTERRE.box })
    const dia = [F(mu, b + i0 + 2), F(a + du - i0 - 2, mv), F(mu, b + dv - i0 - 2), F(a + i0 + 2, mv)]
    hedges.push({ line: [...dia, dia[0]], ...PARTERRE.box })
    for (const [cu, cv] of [[a, b], [a + du, b], [a, b + dv], [a + du, b + dv]]) topiary.push({ at: F(cu, cv), shape: 'cone', h: PARTERRE.cone })
    if (o.oranges) for (const u of steps(a, a + du, ORANGES.step)) for (const v of [b - 1.5, b + dv + 1.5]) topiary.push({ at: F(u, v), shape: 'ball', h: ORANGES.h })
  }
  return { name, ring: ringLL, clearMapped: true, gravel: [ringLL], lawn, beds, hedges, topiary }
}

/** the charmilles along the walks OSM maps inside a bosquet: lower than the bosquet's own walls; where the plan's trees keep off
 * (the walks, and OSM's lawns, water and paving: the bosquets' rooms) */
const WALK = { wall: { h: 3.2, w: 1 }, gap: 0.6, treeClear: 3 }
/** the Bains d'Apollon: Hubert Robert's English garden (1778) — a lawn round the lake and the grotto, trees in loose clumps */
const ANGLAIS = { spacing: 11, keep: 0.55, jitter: 4, h: [14, 22] as [number, number] }

const hash2 = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

/**
 * A bosquet: a charmille round OSM's outline (unless OSM maps it), charmilles along the walks OSM maps inside it, trees massed
 * everywhere else — off the walks and off what OSM draws open (its rooms' lawns, basins and paving). The walks and rooms are OSM's,
 * not ours: invented spokes put walls across the paths the rider takes (owner, 2026-11-15). `anglais`: loose clumps, not rows.
 */
function bosquet(id: string, name: string, o: { anglais?: boolean; rooms?: string[] } = {}): GardenPlan {
  const [u0, u1, v0, v1] = box(id), m = BOSQUET_TREES.margin
  const rows: Row[] = []
  if (o.anglais) {
    const A = ANGLAIS
    for (const u of steps(u0 + m, u1 - m, A.spacing)) for (const v of steps(v0 + m, v1 - m, A.spacing)) {
      if (hash2(u, v) > A.keep) continue
      const pu = u + (hash2(v, u) - 0.5) * 2 * A.jitter, pv = v + (hash2(u + 1, v) - 0.5) * 2 * A.jitter
      rows.push({ line: [F(pu, pv), F(pu + 0.1, pv)], spacing: 1, h: A.h[0] + hash2(pu, pv) * (A.h[1] - A.h[0]) })
    }
  } else {
    for (const u of steps(u0 + m, u1 - m, BOSQUET_TREES.spacing)) rows.push({ line: [F(u, v0 + m), F(u, v1 - m)], spacing: BOSQUET_TREES.spacing, h: BOSQUET_TREES.h })
  }
  return {
    name: `Versailles: ${name}`, ring: ring(id), clearMapped: true,
    outlineHedge: { h: CHARMILLE.h, w: CHARMILLE.w }, osmHedge: { h: CHARMILLE.h, w: CHARMILLE.w },
    pathWalls: o.anglais ? undefined : { ...WALK.wall, gap: WALK.gap },
    rowClear: { path: WALK.treeClear, open: true },
    rooms: (o.rooms ?? []).map((k) => ROOMS[k]),
    rows,
  }
}

/** the Tapis Vert: the long lawn down the axis from Latone to Apollon, a gravel walk and a row of trees either side */
function tapisVert(): GardenPlan {
  const t = TAPIS, a = AXIS
  const outer = t.lawn + t.walk
  const r = rect(F, t.u0, a - outer, t.u1, a + outer)
  return {
    name: 'Versailles: the Tapis Vert', ring: r, clearMapped: true,
    gravel: [r], lawn: [rect(F, t.u0, a - t.lawn, t.u1, a + t.lawn)],
    rows: [-1, 1].map((s) => ({ line: [F(t.u0, a + s * (outer + 2)), F(t.u1, a + s * (outer + 2))], spacing: t.treeStep, h: t.treeH })),
  }
}

/** the Parterre d'Eau: the terrace before the Galerie des Glaces, all gravel round its two mirrors (OSM's water) */
function parterreEau(): GardenPlan {
  const r = ring('r12446402')
  return { name: "Versailles: the Parterre d'Eau", ring: r, clearMapped: true, gravel: [r] }
}

/** Latone's parterre: the horseshoe of ramps round the basin, open toward the Tapis Vert; two lawns either side of the middle walk,
 * their château-side edge the horseshoe's arc, cones along the arc and balls along the outer walks */
const LATONE = { u0: 230, u1: 400, half: 58, cu: 336, R: 66, walk: 16, outer: 6, step: 10, arcN: 10 }
function latone(): GardenPlan {
  const L = LATONE
  const r = rect(F, L.u0, AXIS - L.half, L.u1, AXIS + L.half)
  const arcU = (v: number): number => L.cu - Math.sqrt(Math.max(0, L.R * L.R - v * v))
  const lawn: LL[][] = [], topiary: Yew[] = []
  for (const s of [-1, 1]) {
    const va = L.walk, vb = L.half - L.outer
    const arc = steps(va, vb, (vb - va) / L.arcN).map((v) => F(arcU(v), AXIS + s * v))
    lawn.push([...arc, F(L.u1 - 6, AXIS + s * vb), F(L.u1 - 6, AXIS + s * va)])
    for (const v of steps(va, vb, (vb - va) / 4)) topiary.push({ at: F(arcU(v) - 2, AXIS + s * v), shape: 'cone', h: PARTERRE.cone })
    for (const u of steps(arcU(vb), L.u1 - 6, L.step)) topiary.push({ at: F(u, AXIS + s * va), shape: 'cone', h: PARTERRE.cone }, { at: F(u, AXIS + s * vb), shape: 'ball', h: PARTERRE.ball })
  }
  return { name: 'Versailles: the Parterre de Latone', ring: r, clearMapped: true, gravel: [r], lawn, topiary }
}

/** the Grand Canal's walls: the trees along its allées are clipped flat into walls (taille en rideau; owner, 2026-11-15: "the pond
 * is generally lined with groomed walls, the interior is mostly forest") — a pleached crown low on its trunks */
const CANAL_WALL = { y0: 2.2, h: 13, w: 5, spacing: 5 }

/**
 * The Grand Canal: clipped walls along both banks of both arms, broken where the arms cross. Its ring is the cross of the canal and
 * its allées only, so the forest blocks beyond them are planted as forest (a rectangle round the whole canal kept the scatter off
 * 190 ha of wood) and OSM's tree rows along the banks give way to the walls.
 */
function canalAllees(): GardenPlan {
  const c = CANAL, a = AXIS, pleached: NonNullable<GardenPlan['pleached']> = []
  const wall = (p: LL, q: LL): void => { pleached.push({ line: [p, q], ...CANAL_WALL }) }
  for (const d of c.set) for (const s of [-1, 1]) {
    const v = a + s * (c.half + d)
    wall(F(c.u0 + 40, v), F(c.cu0 - d, v)); wall(F(c.cu1 + d, v), F(c.u1, v))
    for (const u of [c.cu0 - d, c.cu1 + d]) {
      wall(F(u, c.cv0), F(u, a - c.half - d)); wall(F(u, a + c.half + d), F(u, c.cv1))
    }
  }
  const o = c.half + Math.max(...c.set) + 6, x0 = c.cu0 - o + c.half, x1 = c.cu1 + o - c.half
  const cross: LL[] = [F(c.u0, a - o), F(x0, a - o), F(x0, c.cv0), F(x1, c.cv0), F(x1, a - o), F(c.u1, a - o),
    F(c.u1, a + o), F(x1, a + o), F(x1, c.cv1), F(x0, c.cv1), F(x0, a + o), F(c.u0, a + o)]
  return { name: 'Versailles: the Grand Canal allées', ring: cross, clearMapped: true, pleached }
}

/** the Pièce d'eau des Suisses: double rows round its banks */
function suisses(): GardenPlan {
  const p = SUISSES, rows: Row[] = []
  for (const d of p.set) {
    const r = rect(F, p.u0 - d, p.v0 - d, p.u1 + d, p.v1 + d)
    rows.push({ line: [...r, r[0]], spacing: p.step, h: p.h })
  }
  const o = Math.max(...p.set) + 4
  return { name: "Versailles: the Pièce d'eau des Suisses", ring: rect(F, p.u0 - o, p.v0 - o, p.u1 + o, p.v1 + o), rows }
}

/** the bosquets: their rooms and walks are OSM's; the Reine and the Bains d'Apollon are the English gardens of 1775–78 */
const BOSQUETS: [string, string, { anglais?: boolean; rooms?: string[] }?][] = [
  ['r11724445', 'Bosquet de la Girandole'],
  ['r11724450', 'Jardin de la Reine', { anglais: true }],
  ['r11724456', 'Bosquet des Rocailles', { rooms: ['salleDeBal'] }],
  ['r11724463', 'Bosquet de la Colonnade', { rooms: ['colonnade'] }],
  ['r11724485', 'Bosquet des Dômes'],
  ['r11724487', "Bosquet de l'Encelade"],
  ['r11724493', 'Bosquet du Dauphin'],
  ['r11724503', "Bosquet de l'Étoile"],
  ['r11724511', 'Bosquet des Trois Fontaines'],
  ['r11724515', "Bosquet du Théâtre d'Eau"],
  ['r11724521', "Bosquet des Bains d'Apollon", { anglais: true }],
  ['r11724524', "Bosquet de l'Obélisque"],
  ['r12446404', "Bosquet de l'Arc de Triomphe"],
]

export const VERSAILLES_GARDENS: GardenPlan[] = [
  parterreEau(),
  parterre('Versailles: the Parterre du Nord', ring('r12446401'), box('r12446401'), 3, 2),
  // the Parterre du Midi over the Orangerie: no OSM outline; the terrace between the south wing's front and the Orangerie's wall
  parterre('Versailles: the Parterre du Midi', rect(F, 0, -205, 92, -64), [0, 92, -205, -64], 2, 2),
  // the Parterre de l'Orangerie: OSM maps its broderie lawns, and versaillesOrangerieParterre (palaces.json) draws the box and the tubbed
  // orange trees; the plan only keeps the scatter off it
  { name: "Versailles: the Parterre de l'Orangerie", ring: ring('r11724461') },
  latone(),
  tapisVert(),
  canalAllees(),
  suisses(),
  ...BOSQUETS.map(([id, n, o]) => bosquet(id, n, o)),
]
