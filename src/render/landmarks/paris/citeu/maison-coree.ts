/**
 * THE MAISON DE LA CORÉE — PIERRE BOUDON (2017/18): a nine-storey wedge whose long curved face is wrapped in
 * horizontal brushed-steel tubes (a continuous louvre screen, rounded at the corners, the rooms' glazing dark behind),
 * standing on a recessed glazed ground floor behind round columns. On the east a lower board-marked concrete block
 * carries the entrance and the name MAISON DE LA CORÉE, a glass balustrade along its terrace and a deep canopy slab.
 * Refs: Commons "Maison de la Corée.jpg" (docs/landmarks/refs/citeu/coree/c1.jpg, 2026-11-04). Plan from OSM way
 * 665266830 (9 levels). Front bearing 18: the entrance and the curved face look onto the campus service road along
 * the périphérique side (OSM), which runs past the north-east of the house; the RER B tunnel runs under it.
 * Local frame: −z toward bearing 18 (the front), x toward bearing 108; origin the bbox centre.
 */
import { MeshBuilder, capPolygon } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { FIXED, type Rgb } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { offsetRing } from '../../parts.ts'

const CONCRETE: Rgb = hex('#b3b5b0'), STEEL: Rgb = hex('#dfe2e0'), GLASS: Rgb = hex('#2f3a42'), SLAB: Rgb = hex('#9ea19d')
const BALUSTRADE: Rgb = hex('#9fb8bd'), ROOF: Rgb = hex('#8d8f8b'), SIGN: Rgb = hex('#3b3e40')
const conc = surfaceTag('concrete'), glass = surfaceTag('glass'), metal = surfaceTag('metal')

const BEARING = 18
const H = 29.5, GF = 4.4, FLOOR = 2.8, GF_IN = 1.6, COL_R = 0.3, COL_PITCH = 6.5
const LOUVRE_OUT = 0.7, LOUVRE_PITCH = 0.55, LOUVRE_H = 0.22, POST_PITCH = 3.6, PARAPET = 1.1
const ANNEX_H = 14, ANNEX_CANOPY = 2.2, BAL_H = 1.1

// OSM outline, east/north metres about the way's vertex mean; the main wedge and the east concrete block
const MAIN_EN: [number, number][] = [[-28.9, 21.4], [-8.2, -28.8], [4.0, -23.9], [3.6, -11.3], [-1.8, -10.9], [-3.0, -10.4],
  [-4.0, -9.8], [-4.7, -9.0], [-5.3, -8.0], [-8.2, 5.2], [-8.8, 7.7], [-9.5, 9.8], [-11.2, 12.8], [-13.5, 15.3], [-17.2, 17.6]]
const ANNEX_EN: [number, number][] = [[4.0, -23.9], [15.0, -19.4], [15.8, -9.4], [14.9, -9.4], [16.2, -4.6], [16.3, -2.6],
  [15.4, -2.5], [16.7, 2.2], [17.0, 6.1], [8.7, 6.8], [8.6, 4.7], [4.9, 5.0], [3.6, -11.3]]
const CENTRE: [number, number] = [-9.5, -6.6]   // the bbox centre in this frame, east/north

type P2 = { x: number; z: number }
const b = BEARING * Math.PI / 180, F = [Math.sin(b), Math.cos(b)], R = [Math.cos(b), -Math.sin(b)]
function local(en: [number, number][]): P2[] {
  const r = en.map(([e, n]) => ({ x: e * R[0] + n * R[1], z: -(e * F[0] + n * F[1]) }))
  const cx = CENTRE[0] * R[0] + CENTRE[1] * R[1], cz = -(CENTRE[0] * F[0] + CENTRE[1] * F[1])
  const out = r.map(p => ({ x: p.x - cx, z: p.z - cz }))
  let a = 0
  for (let i = 0; i < out.length; i++) { const p = out[i], q = out[(i + 1) % out.length]; a += p.x * q.z - q.x * p.z }
  return a < 0 ? out.reverse() : out          // wound so (tz, −tx) is outward
}

/** a vertical band round the ring (or along `edges`), its normal outward */
function band(out: MeshBuilder, ring: P2[], y0: number, y1: number, c: Rgb, tag: number, edges?: number[]): void {
  for (const i of edges ?? ring.map((_, k) => k)) {
    const a = ring[i], q = ring[(i + 1) % ring.length], L = Math.hypot(q.x - a.x, q.z - a.z)
    if (L < 0.05) continue
    const tx = (q.x - a.x) / L, tz = (q.z - a.z) / L
    out.quad([[a.x, y0, a.z], [q.x, y0, q.z], [q.x, y1, q.z], [a.x, y1, a.z]], [tz, 0, -tx],
      [[0, 0], [L / 3, 0], [L / 3, (y1 - y0) / 3], [0, (y1 - y0) / 3]], c, tag)
  }
}

/** points every `pitch` metres round the ring */
function along(ring: P2[], pitch: number, edges: number[]): P2[] {
  const pts: P2[] = []
  for (const i of edges) {
    const a = ring[i], q = ring[(i + 1) % ring.length], L = Math.hypot(q.x - a.x, q.z - a.z), n = Math.max(1, Math.round(L / pitch))
    for (let k = 0; k < n; k++) pts.push({ x: a.x + (q.x - a.x) * k / n, z: a.z + (q.z - a.z) * k / n })
  }
  return pts
}

function post(out: MeshBuilder, p: P2, y0: number, y1: number, r: number, c: Rgb, tag: number): void {
  const sq = [{ x: p.x - r, z: p.z - r }, { x: p.x + r, z: p.z - r }, { x: p.x + r, z: p.z + r }, { x: p.x - r, z: p.z + r }]
  band(out, sq, y0, y1, c, tag)
}

export function maisonCoree(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  const main = local(MAIN_EN), annex = local(ANNEX_EN)
  const n = main.length, all = main.map((_, i) => i)
  // the edge shared with the annex (its two points are MAIN_EN[2], [3]) carries no facade
  const shared = main.findIndex((p, i) => {
    const q = main[(i + 1) % n], s = local([[4.0, -23.9]])[0], t = local([[3.6, -11.3]])[0]
    return (Math.hypot(p.x - s.x, p.z - s.z) < 0.1 && Math.hypot(q.x - t.x, q.z - t.z) < 0.1)
      || (Math.hypot(p.x - t.x, p.z - t.z) < 0.1 && Math.hypot(q.x - s.x, q.z - s.z) < 0.1)
  })
  const faces = all.filter(i => i !== shared)

  // the glazed ground floor, set back behind its columns, and the soffit over it
  const gf = offsetRing(main, -GF_IN)
  band(out, gf, g - 0.3, g + GF, GLASS, glass)
  for (const p of along(main, COL_PITCH, faces)) post(out, p, g, g + GF, COL_R, CONCRETE, conc)
  capPolygon(out, gf, g + GF - 0.01, SLAB, conc)
  // the rooms: dark glazing behind thin floor-edge slabs, then the roof and its parapet
  band(out, main, g + GF, g + H, GLASS, glass, faces)
  band(out, main, g + GF, g + H, CONCRETE, conc, [shared])
  for (let y = g + GF; y < g + H; y += FLOOR) band(out, main, y, y + 0.25, SLAB, conc, faces)
  capPolygon(out, main, g + GF - 0.02, SLAB, FIXED)
  capPolygon(out, main, g + H, ROOF, conc)
  // the steel tube screen: horizontal runs on a rounded outer line, vertical posts holding them
  const screen = offsetRing(main, LOUVRE_OUT)
  for (let y = g + GF + 0.3; y < g + H + PARAPET; y += LOUVRE_PITCH) band(out, screen, y, y + LOUVRE_H, STEEL, metal, faces)
  for (const p of along(screen, POST_PITCH, faces)) post(out, p, g + GF, g + H + PARAPET, 0.05, STEEL, metal)
  band(out, screen, g + GF - 0.4, g + GF, STEEL, metal, faces)       // the screen's sill fascia

  // the east block: board-marked concrete, a terrace with a glass balustrade, the canopy slab over the door
  band(out, annex, g - 0.3, g + ANNEX_H, CONCRETE, conc)
  capPolygon(out, annex, g + ANNEX_H, ROOF, conc)
  band(out, offsetRing(annex, -0.1), g + ANNEX_H, g + ANNEX_H + BAL_H, BALUSTRADE, glass)
  // its front toward the road (the edge facing −z most squarely): the doors and the name
  let fi = 0, best = 0
  for (let i = 0; i < annex.length; i++) {
    const a = annex[i], q = annex[(i + 1) % annex.length], L = Math.hypot(q.x - a.x, q.z - a.z)
    const s = q.x - a.x                              // outward normal z = −tx: facing −z means tx > 0, longest wins
    void L
    if (s > best) { best = s; fi = i }
  }
  const a = annex[fi], q = annex[(fi + 1) % annex.length]
  const L = Math.hypot(q.x - a.x, q.z - a.z), tx = (q.x - a.x) / L, tz = (q.z - a.z) / L
  const at = (t: number, d: number): P2 => ({ x: a.x + tx * t + tz * d, z: a.z + tz * t - tx * d })
  band(out, [at(0.8, 0.05), at(L - 0.8, 0.05)], g, g + 3.6, GLASS, glass)
  band(out, [at(L * 0.2, 0.06), at(L * 0.8, 0.06)], g + 7.2, g + 7.8, SIGN, FIXED)
  const c0 = at(-0.5, ANNEX_CANOPY), c1 = at(L + 0.5, ANNEX_CANOPY), c2 = at(L + 0.5, 0), c3 = at(-0.5, 0)
  capPolygon(out, [c0, c1, c2, c3], g + 4.4, SLAB, conc)
  band(out, [c0, c1, c2, c3], g + 4.0, g + 4.4, CONCRETE, conc)
}
