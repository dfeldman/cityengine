import { type MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import { type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import { edgeAt, offsetRing, signText } from '../../parts.ts'
import { rectOn } from '../palaces/common.ts'
import { ccw, FIXED, ring, UV, type P2, walls } from './common.ts'

/*
 * THE MÉMORIAL DES MARTYRS DE LA DÉPORTATION (Georges-Henri Pingusson, 1962), at the downstream tip of the Île de la Cité
 * behind Notre-Dame, in the Square de l'Île-de-France. A rider going by on the Quai de l'Archevêché sees almost
 * nothing, and that is the point: on the lawn a low wedge of pale, rough, bush-hammered concrete, its point toward the river,
 * the dates cut in its flanks with a strip of flagstones at their foot; on top a bare paved terrace round a sharp TRIANGLE
 * of a court, entered by two very narrow stairs in the thickness of the wall, and in the court's far point the barred
 * iron window on the water, and opposite it the slit of the crypt's door.
 *
 * The rings are OSM's (relation 9396191: outer, and the court as its hole; the stairs from memory of the photographs, not
 * mapped). In life the court is 3–4 m below the garden; the game's ground cannot be dug, so the terrace is raised 1.35 m above
 * the lawn and the court's floor lies at the ground, and what is drawn is the wedge that the rider sees. `drape`: the game's ground falls away
 * toward the island's tip and every vertex follows it, y here is over the ground. Frame: −z the point of the prow, toward bearing 122 (osmium, 2026-10-30).
 */
const WALL: Rgb = hex('#9c9788')
const TERRACE: Rgb = hex('#99948a')
const FLAG: Rgb = hex('#8a867b')
const COURT: Rgb = hex('#6f6c64')
const IRON: Rgb = hex('#17181a')
const CUT: Rgb = hex('#7a6230')

const G = 0
const TOP = 1.35

const OUTER = ring([-14.2, 11.7, -8.3, -12.6, -6.6, -14.7, -4.9, -15.3, -3.5, -15.4, -2.0, -15.2, 0.0, -13.6, 14.2, 6.3, 9.6, 9.4, 1.2, 15.4, -8.5, 13.0, -13.1, 11.9])
/** The court, OSM's hole, with the two narrow stairs let into its back corners. */
const COURT_RING = ring([-9.7, 4.1, -7.6, 4.6, -7.4, 9.8, -6.3, 10.0, -6.5, 4.9, -0.8, 6.5, 2.2, 4.3, 5.9, 8.5, 6.8, 7.7, 3.1, 3.6, 4.3, 2.7, 6.3, 1.2, -2.8, -11.5, -3.6, -11.9, -4.5, -11.9, -5.3, -11.3, -5.8, -10.6])

export function memorialDeportation(out: MeshBuilder): void {
  const outer = ccw(OUTER)
  const hole = [...ccw(COURT_RING)].reverse()
  // the strip of flagstones on the lawn at the walls' foot
  capPolygonWithHoles(out, [ccw(offsetRing(outer, 1.5)), [...outer].reverse()], G + 0.06, FLAG, FIXED)
  // the wedge's rough walls, the terrace on it, the court in it
  walls(out, outer, 0, TOP, WALL)
  capPolygonWithHoles(out, [outer, hole], TOP, TERRACE, FIXED)
  capPolygonWithHoles(out, [ccw(COURT_RING)], G + 0.1, COURT, FIXED)
  // the court's walls, looking inward: `walls` looks out, so the ring is walked the other way
  for (let i = 0; i < hole.length; i++) {
    const a = hole[i]
    const b = hole[(i + 1) % hole.length]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const L = Math.hypot(dx, dz) || 1
    out.quad([[a.x, G, a.z], [b.x, G, b.z], [b.x, TOP, b.z], [a.x, TOP, a.z]], [dz / L, 0, -dx / L], UV, shade(WALL, 0.78), FIXED)
  }
  // the two stairs down: treads across each slot, falling toward the court
  stair(out, { x: -6.95, z: 9.9 }, { x: -7.05, z: 4.9 }, 1.1)
  stair(out, { x: 6.35, z: 8.1 }, { x: 2.65, z: 3.95 }, 1.05)

  // the barred window in the court's point, and the same bars on the prow's outer face where it stands over the quay
  for (const [plane, s] of [[-11.86, 1], [-15.4, -1]] as const) {
    const f = s > 0 ? '+z' : '-z'
    rectOn(out, f, plane, -5.2, -2.9, G + 0.05, TOP - 0.1, IRON, 0.05)
    for (let i = 1; i < 4; i++) rectOn(out, f, plane, -5.2 + i * 0.58 - 0.04, -5.2 + i * 0.58 + 0.04, G + 0.05, TOP - 0.1, shade(WALL, 0.8), 0.08)
    for (let i = 1; i < 3; i++) rectOn(out, f, plane, -5.2, -2.9, G + i * 0.4 - 0.03, G + i * 0.4 + 0.03, shade(WALL, 0.8), 0.08)
  }
  // the crypt's door, the slit between its two blocks, in the court's long back wall
  block(out, 0.5, 1.25, 4.68, 5.6, G + 0.1, TOP - 0.25, IRON)

  // the dates cut in the two long flanks
  const edges = outer.map((_, i) => edgeAt(outer, i)).sort((a, b) => b.L - a.L)
  signText(out, '1940', edges[0].mid.x + edges[0].nx * 0.05, G + 0.72, edges[0].mid.z + edges[0].nz * 0.05, 0.55, CUT, { heading: edges[0].heading })
  signText(out, '1945', edges[1].mid.x + edges[1].nx * 0.05, G + 0.72, edges[1].mid.z + edges[1].nz * 0.05, 0.55, CUT, { heading: edges[1].heading })
}

/** The treads of a narrow stair from the terrace at `top` to the court at `foot`, across `w`. */
function stair(out: MeshBuilder, top: P2, foot: P2, w: number): void {
  const n = 7
  const dx = foot.x - top.x
  const dz = foot.z - top.z
  const L = Math.hypot(dx, dz)
  const tx = dx / L
  const tz = dz / L
  const nx = -tz
  const nz = tx
  for (let k = 0; k < n; k++) {
    const u0 = (k / n) * L
    const u1 = ((k + 1) / n) * L
    const y = TOP - 0.02 - ((k + 1) * (TOP - G - 0.12)) / n
    const P = (u: number, s: number, yy: number): [number, number, number] => [top.x + tx * u + nx * s * w / 2, yy, top.z + tz * u + nz * s * w / 2]
    out.quad([P(u0, -1, y), P(u0, 1, y), P(u1, 1, y), P(u1, -1, y)], [0, 1, 0], UV, k % 2 ? shade(TERRACE, 0.9) : shade(TERRACE, 0.82), FIXED)
    out.quad([P(u1, -1, y), P(u1, 1, y), P(u1, 1, y - (TOP - G - 0.12) / n), P(u1, -1, y - (TOP - G - 0.12) / n)], [tx, 0, tz], UV, shade(TERRACE, 0.62), FIXED)
  }
}
