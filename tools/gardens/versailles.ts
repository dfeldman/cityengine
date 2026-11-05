/**
 * THE GARDENS OF VERSAILLES (Le Nôtre, 1661–1700), as planting: the ground and what grows on it, for the plant library to draw.
 * The fountains and sculpture are not here (GLBs, owner 2026-11-04); OSM draws the water. Laid out on the château's axis:
 * u metres down the garden from the château's centre (bearing 292.75), v to its right (bearing 22.75, north): the builder frame's
 * z and x (docs/landmarks/MODEL-VERSAILLES.md). Bosquets and parterres stand on OSM's outlines (versailles-outlines.ts).
 */
import { circle, frame, rect, type Frame, type GardenPlan, type LL } from './plan.ts'
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

/** a bosquet's room: its shape (round, octagon, or square), its size as a fraction of the bosquet's box, a lawn in it or all gravel,
 * and its walks out to the charmille (4 to the mid-sides, 8 adds the diagonals: the star bosquets) */
interface Room { shape?: 'round' | 'oct' | 'square'; frac?: number; lawn?: boolean; spokes?: 0 | 4 | 8 }
/** the walks: width, the charmille walls along them (lower than the bosquet's own), the gravel ring round a room's lawn */
const WALK = { w: 5, wall: { h: 3.2, w: 1 }, ring: 6, treeClear: 3 }

/** a bosquet: the charmille round OSM's outline, walks in from it to a room in the middle (where a GLB fountain goes), trees
 * massed between the walks */
function bosquet(id: string, name: string, room: Room = {}): GardenPlan {
  const [u0, u1, v0, v1] = box(id), m = BOSQUET_TREES.margin
  const frac = room.frac ?? BOSQUET_TREES.room, shape = room.shape ?? 'round', ns = room.spokes ?? 4
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2
  const R = (Math.min(u1 - u0, v1 - v0) * frac) / 2
  const roomRing = shape === 'square' ? rect(F, cu - R, cv - R, cu + R, cv + R)
    : circle(F, cu, cv, R, shape === 'oct' ? 8 : 32)
  // the walks: from the room's edge to the box's side (or corner), as [du, dv] unit directions
  const dirs: [number, number][] = ns === 0 ? [] : [[1, 0], [-1, 0], [0, 1], [0, -1]]
  if (ns === 8) for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const du = (a * (u1 - u0)) / 2, dv = (b * (v1 - v0)) / 2, l = Math.hypot(du, dv)
    dirs.push([du / l, dv / l])
  }
  const reach = (d: [number, number]): number => Math.min(d[0] ? ((d[0] > 0 ? u1 : u0) - cu) / d[0] : 1e9, d[1] ? ((d[1] > 0 ? v1 : v0) - cv) / d[1] : 1e9)
  const gravel: LL[][] = [roomRing], hedges: NonNullable<GardenPlan['hedges']> = [], h = WALK.w / 2
  for (const d of dirs) {
    const L = reach(d), [pu, pv] = [-d[1], d[0]]
    const at = (t: number, s: number): LL => F(cu + d[0] * t + pu * s, cv + d[1] * t + pv * s)
    gravel.push([at(R * 0.8, -h), at(L, -h), at(L, h), at(R * 0.8, h)])
    for (const s of [-1, 1]) hedges.push({ line: [at(R + 2, s * (h + 0.6)), at(L - 1, s * (h + 0.6))], ...WALK.wall })
  }
  const lawn = room.lawn ? [shape === 'square' ? rect(F, cu - R + WALK.ring, cv - R + WALK.ring, cu + R - WALK.ring, cv + R - WALK.ring)
    : circle(F, cu, cv, R - WALK.ring, shape === 'oct' ? 8 : 32)] : undefined
  // the trees: rows across the box, each broken where it would stand in the room or on a walk
  const clear = (u: number, v: number): boolean => {
    const du = u - cu, dv = v - cv, c = WALK.treeClear
    if ((shape === 'square' ? Math.max(Math.abs(du), Math.abs(dv)) : Math.hypot(du, dv)) < R + c) return false
    for (const d of dirs) { const t = du * d[0] + dv * d[1]; if (t > 0 && Math.abs(-du * d[1] + dv * d[0]) < h + c) return false }
    return true
  }
  const rows: Row[] = []
  for (const u of steps(u0 + m, u1 - m, BOSQUET_TREES.spacing)) {
    let start: number | null = null
    for (let v = v0 + m; v <= v1 - m + 0.01; v += 1) {
      const ok = clear(u, v) && v < v1 - m + 0.01
      if (ok && start === null) start = v
      const end = !ok || v + 1 > v1 - m + 0.01
      if (end && start !== null) { const e = ok ? v : v - 1; if (e - start > 2) rows.push({ line: [F(u, start), F(u, e)], spacing: BOSQUET_TREES.spacing, h: BOSQUET_TREES.h }); start = null }
    }
  }
  const r = ring(id)
  return {
    name: `Versailles: ${name}`, ring: r, clearMapped: true, gravel, lawn,
    hedges: [{ line: [...r, r[0]], h: CHARMILLE.h, w: CHARMILLE.w }, ...hedges],
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

/** the bosquets and their rooms, after the plans of the gardens: the Colonnade's ring of arches, the Dômes' octagon, the stars of
 * the Girandole, the Dauphin and the Étoile, the Encelade's round basin, the Reine's open lawn */
const BOSQUETS: [string, string, Room][] = [
  ['r11724445', 'Bosquet de la Girandole', { spokes: 8, frac: 0.3, lawn: true }],
  ['r11724450', 'Jardin de la Reine', { shape: 'square', frac: 0.6, lawn: true }],
  ['r11724456', 'Bosquet des Rocailles', { frac: 0.55, spokes: 0 }],
  ['r11724463', 'Bosquet de la Colonnade', { frac: 0.5 }],
  ['r11724485', 'Bosquet des Dômes', { shape: 'oct', frac: 0.45 }],
  ['r11724487', "Bosquet de l'Encelade", { frac: 0.45 }],
  ['r11724493', 'Bosquet du Dauphin', { spokes: 8, frac: 0.3, lawn: true }],
  ['r11724503', "Bosquet de l'Étoile", { spokes: 8, frac: 0.25, lawn: true }],
  ['r11724511', 'Bosquet des Trois Fontaines', { shape: 'square', frac: 0.4, spokes: 0 }],
  ['r11724515', "Bosquet du Théâtre d'Eau", { frac: 0.45, lawn: true }],
  ['r11724521', "Bosquet des Bains d'Apollon", { frac: 0.4, lawn: true, spokes: 0 }],
  ['r11724524', "Bosquet de l'Obélisque", { frac: 0.45 }],
  ['r12446404', "Bosquet de l'Arc de Triomphe", { shape: 'square', frac: 0.4 }],
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
  ...BOSQUETS.map(([id, n, r]) => bosquet(id, n, r)),
]
