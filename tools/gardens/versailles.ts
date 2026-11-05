/**
 * THE GARDENS OF VERSAILLES (Le Nôtre, 1661–1700), as planting: the ground and what grows on it, for the plant library to draw.
 * The fountains and sculpture are not here (GLBs, owner 2026-11-04); OSM draws the water. Laid out on the château's axis:
 * u metres down the garden from the château's centre (bearing 292.75), v to its right (bearing 22.75, north): the builder frame's
 * z and x (docs/landmarks/MODEL-VERSAILLES.md). Bosquets and parterres stand on OSM's outlines (versailles-outlines.ts).
 */
import { frame, rect, type Frame, type GardenPlan, type LL } from './plan.ts'
import { OUTLINES } from './versailles-outlines.ts'

const F: Frame = frame(48.804578, 2.121154, 292.75)
/** the axis's offset from the château's centre, v (measured on the Parterre d'Eau and Apollon) */
const AXIS = -5

// ---- tunables
/** the bosquets' hornbeam walls (charmilles): height and width */
const CHARMILLE = { h: 5.5, w: 1.4 }
/** the trees massed inside a bosquet, behind its walls */
const BOSQUET_TREES = { spacing: 9, h: 18, margin: 6, room: 0.45 }
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

/** a bosquet: the charmille round OSM's outline, the trees massed inside it, a clearing (its room, where a GLB fountain goes) */
function bosquet(id: string, name: string): GardenPlan {
  const [u0, u1, v0, v1] = box(id), m = BOSQUET_TREES.margin
  const ru = (u1 - u0) * BOSQUET_TREES.room / 2, rv = (v1 - v0) * BOSQUET_TREES.room / 2
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2
  const rows: Row[] = []
  for (const u of steps(u0 + m, u1 - m, BOSQUET_TREES.spacing)) {
    const segs = Math.abs(u - cu) < ru ? [[v0 + m, cv - rv], [cv + rv, v1 - m]] : [[v0 + m, v1 - m]]
    for (const [a, b] of segs) if (b - a > 2) rows.push({ line: [F(u, a), F(u, b)], spacing: BOSQUET_TREES.spacing, h: BOSQUET_TREES.h })
  }
  const r = ring(id)
  return {
    name: `Versailles: ${name}`, ring: r, clearMapped: true,
    gravel: [rect(F, cu - ru, cv - rv, cu + ru, cv + rv)],
    hedges: [{ line: [...r, r[0]], h: CHARMILLE.h, w: CHARMILLE.w }],
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

/** Latone's parterre, below the terrace: two lawns either side of the walk down to the basin, cones and balls round them */
function latone(): GardenPlan {
  const u0 = 230, u1 = 400, half = 58
  const r = rect(F, u0, AXIS - half, u1, AXIS + half)
  const lawn: LL[][] = [], topiary: Yew[] = []
  for (const s of [-1, 1]) {
    const v0 = AXIS + s * 16, v1 = AXIS + s * (half - 6)
    lawn.push(rect(F, u0 + 40, Math.min(v0, v1), u1 - 6, Math.max(v0, v1)))
    for (const u of steps(u0 + 40, u1 - 6, 10)) topiary.push({ at: F(u, v0), shape: 'cone', h: PARTERRE.cone }, { at: F(u, v1), shape: 'ball', h: PARTERRE.ball })
  }
  return { name: 'Versailles: the Parterre de Latone', ring: r, clearMapped: true, gravel: [r], lawn, topiary }
}

/** the Grand Canal: double rows of trees along both banks of both arms, broken where the arms cross */
function canalAllees(): GardenPlan {
  const c = CANAL, a = AXIS, rows: Row[] = []
  const row = (p: LL, q: LL): void => { rows.push({ line: [p, q], spacing: c.step, h: c.h }) }
  for (const d of c.set) for (const s of [-1, 1]) {
    const v = a + s * (c.half + d)
    row(F(c.u0 + 40, v), F(c.cu0 - d, v)); row(F(c.cu1 + d, v), F(c.u1, v))
    for (const u of [c.cu0 - d, c.cu1 + d]) {
      row(F(u, c.cv0), F(u, a - c.half - d)); row(F(u, a + c.half + d), F(u, c.cv1))
    }
  }
  return { name: 'Versailles: the Grand Canal allées', ring: rect(F, c.u0, c.cv0 - 30, c.u1, c.cv1 + 30), rows }
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

const BOSQUETS: [string, string][] = [
  ['r11724445', 'Bosquet de la Girandole'], ['r11724450', 'Jardin de la Reine'], ['r11724456', 'Bosquet des Rocailles'],
  ['r11724463', 'Bosquet de la Colonnade'], ['r11724485', 'Bosquet des Dômes'], ['r11724487', "Bosquet de l'Encelade"],
  ['r11724493', 'Bosquet du Dauphin'], ['r11724503', "Bosquet de l'Étoile"], ['r11724511', 'Bosquet des Trois Fontaines'],
  ['r11724515', "Bosquet du Théâtre d'Eau"], ['r11724521', "Bosquet des Bains d'Apollon"], ['r11724524', "Bosquet de l'Obélisque"],
  ['r12446404', "Bosquet de l'Arc de Triomphe"],
]

export const VERSAILLES_GARDENS: GardenPlan[] = [
  parterreEau(),
  parterre('Versailles: the Parterre du Nord', ring('r12446401'), box('r12446401'), 3, 2),
  // the Parterre du Midi over the Orangerie: no OSM outline; the terrace between the south wing's front and the Orangerie's wall
  parterre('Versailles: the Parterre du Midi', rect(F, 0, -205, 92, -64), [0, 92, -205, -64], 2, 2),
  parterre("Versailles: the Parterre de l'Orangerie", ring('r11724461'), box('r11724461'), 2, 2, { oranges: true }),
  latone(),
  tapisVert(),
  canalAllees(),
  suisses(),
  ...BOSQUETS.map(([id, n]) => bosquet(id, n)),
]
