import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { arc, cap, centroid, fitted, hex, hull, loft, panel, pts, ribbons, shade, sign, stripSlope, stripWall, wallOn, wound, type P2, type Rgb, type V3 } from './common.ts'

/** the design footprint: OSM way 78271385's box, x east, z north */
const HX = 28.4
const HZ = 35.9
/** OSM's outline, thinned: the straight Rue de Bercy side (north-east), the straight park side (south-east), the broken west */
const PLAN = pts([28.4, -2.8, -3.8, 35.9, -17.5, 24.5, -15.0, 21.5, -20.4, 23.1, -20.3, 21.5, -28.0, 15.7, -26.2, 13.7, -28.3, 11.9, -25.9, 9.0, -28.4, -4.4, -25.8, -16.2, -24.2, -20.0, -11.0, -35.9])
/** the regular block on the two straight sides: an L inside the plan */
const OFFICES = pts([28.4, -2.8, -3.8, 35.9, -13.6, 27.7, 10.2, -0.8, -5.8, -14.2, -11, -35.9])

const STONE = hex('#d3c6a6')
const STONE_DEEP = hex('#bfb190')
const ZINC = hex('#8f9aa0')
const GLASS = hex('#26333a')
const MULLION = hex('#3f6a63')

/** A limestone block turned and leaning: a rectangle `w`×`d` at the foot, moved and scaled at the head. */
function tumbled(out: MeshBuilder, x: number, z: number, y0: number, y1: number, w: number, d: number, turn: number, leanX: number, leanZ: number, scale: number, c: Rgb, windows = 0): void {
  const rect = (cx: number, cz: number, k: number): P2[] => {
    const cs = Math.cos(turn), sn = Math.sin(turn)
    return [[-w, -d], [w, -d], [w, d], [-w, d]].map(([a, b]) => ({ x: cx + (a * cs - b * sn) * k, z: cz + (a * sn + b * cs) * k }))
  }
  const a = rect(x, z, 1), b = rect(x + leanX, z + leanZ, scale)
  loft(out, a, y0, b, y1, c)
  cap(out, b, y1, shade(c, 0.86))
  if (!windows) return
  // a few square windows set anyhow, out on the wall: the leaning planes' only scale
  const m = centroid(a)
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    for (let k = 0; k < windows; k++) {
      const u = (k + 0.5) / windows, v = 0.55
      const pa: P2 = { x: a[i].x + (b[i].x - a[i].x) * v, z: a[i].z + (b[i].z - a[i].z) * v }
      const pb: P2 = { x: a[j].x + (b[j].x - a[j].x) * v, z: a[j].z + (b[j].z - a[j].z) * v }
      const cx = pa.x + (pb.x - pa.x) * u, cz = pa.z + (pb.z - pa.z) * u
      const dx = (pb.x - pa.x) / (Math.hypot(pb.x - pa.x, pb.z - pa.z) || 1), dz = (pb.z - pa.z) / (Math.hypot(pb.x - pa.x, pb.z - pa.z) || 1)
      const nx = cx - m.x, nz = cz - m.z, nl = Math.hypot(nx, nz) || 1
      const yc = y0 + (y1 - y0) * v
      const o = 0.12
      const q = (s: number, t: number): V3 => [cx + dx * s + (nx / nl) * o, yc + t, cz + dz * s + (nz / nl) * o]
      panel(out, [q(-0.8, -1), q(0.8, -1), q(0.8, 1), q(-0.8, 1)], [m.x, yc, m.z], GLASS)
    }
  }
}

/**
 * The Cinémathèque française, Frank Gehry's American Center of 1994, 51 rue de Bercy, on the corner of the Parc de Bercy. From
 * Commons "Gehrys American Center 2011" and "L'extérieur de la Cinémathèque Française", and from memory of the building:
 *
 * - the plain side: on the Rue de Bercy and along the park a regular limestone block with a strict grid of windows, which is what
 *   Gehry gave the street;
 * - the broken side: at the west, toward the park, limestone volumes leaning and tumbling out of each other, a tall one over a
 *   wedge of glass;
 * - the ZINC SKIRT: a grey metal roof swept up in a curve over the entrance, on a glass wall in green-framed panes, with
 *   CINÉMATHÈQUE over the door in big pale capitals on the concrete fascia.
 *
 * The plan is OSM's, the heights (28 m at the top, as baked) and the placing of each tumbled block are from the photographs and
 * memory, not a survey: this is its character and not its elevation.
 */
export function cinematheque(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const plan = wound([PLAN])[0]
  // the lower storeys over the whole plan
  hull(out, [plan], 0, 7.5, STONE, STONE_DEEP)
  ribbons(out, [plan], [[1, 5.8]], GLASS, 0.05, 0.5, 3)
  ribbons(out, [plan], [[7, 7.5]], shade(STONE, 1.05), 0.14, 0, 1)
  // ---- the regular block: its windows on a strict grid, stone between them, on the two long straight walls only
  const block = wound([OFFICES])[0]
  hull(out, [block], 7.5, 22, STONE, STONE_DEEP)
  for (let i = 0; i < block.length; i++) {
    const w = wallOn(out, block[i], block[(i + 1) % block.length])
    if (w.L < 8) continue
    const n = Math.round(w.L / 3.3)
    for (let j = 0; j < n; j++) {
      const u = (w.L * (j + 0.5)) / n
      for (const y of [8.6, 12.2, 15.8, 19.4]) w.rect(u - 0.8, u + 0.8, y, y + 2.1, GLASS, 0.07)
    }
    w.rect(0, w.L, 21.7, 22, shade(STONE, 1.05), 0.12)
  }
  // ---- the broken side: blocks leaning out of each other, from the corner by the zinc to the north-west end
  tumbled(out, -18, 12, 7.5, 21, 7, 5.5, 0.35, -1.2, 0.6, 1.12, STONE, 2)
  tumbled(out, -11, 2, 7.5, 28, 8, 7, -0.2, 1.4, -0.8, 0.92, shade(STONE, 1.03), 2)
  tumbled(out, -17, -8, 7.5, 18, 6, 7, 0.55, -1.8, -1.2, 1.1, STONE_DEEP, 1)
  tumbled(out, -8, -19, 7.5, 16, 7, 5, 0.86, 0.4, -1.6, 1.06, STONE, 1)
  tumbled(out, 0, 18, 22, 28, 8.5, 6, 0.87, 0, 0, 0.84, STONE, 0)
  tumbled(out, 8, 8, 22, 26, 7, 5.5, 0.87, 0, 0, 0.86, STONE_DEEP, 0)
  // a wedge of dark glass between the tumbled blocks
  loft(out, pts([-23, 2, -20, -4, -14, 0, -17, 7]), 7.5, pts([-24.5, 3, -21, -5.5, -14, 0, -17, 8]), 17, hex('#34454e'))
  // ---- the zinc skirt over the entrance: a curve on the south-west side, rising from a low eave to the wall behind it
  const C: P2 = { x: 6, z: -4 }
  const a0 = Math.PI * 0.98, a1 = Math.PI * 1.47
  const eave = arc(C.x, C.z, 38, a0, a1, 12)
  const head = arc(C.x, C.z, 28, a0, a1, 12)
  const crest = arc(C.x, C.z, 22, a0, a1, 12)
  stripSlope(out, eave, 7, head, 13, [C.x, 2, C.z], ZINC)
  stripSlope(out, head, 13, crest, 15.2, [C.x, 6, C.z], shade(ZINC, 1.1))
  // the standing seams of the zinc
  for (let i = 0; i <= 12; i++) {
    const p = eave[i], q = head[i]
    const dx = (q.x - p.x) / 10, dz = (q.z - p.z) / 10
    panel(out, [[p.x - dz * 0.12, 7.06, p.z + dx * 0.12], [p.x + dz * 0.12, 7.06, p.z - dx * 0.12], [q.x + dz * 0.12, 13.06, q.z - dx * 0.12], [q.x - dz * 0.12, 13.06, q.z + dx * 0.12]], [C.x, 2, C.z], shade(ZINC, 0.78))
  }
  // the eave's fascia and the glass wall under it, its panes in green frames
  stripWall(out, eave, 6.4, 7, C, shade(STONE, 1.02))
  const wall = arc(C.x, C.z, 35, a0, a1, 12)
  stripWall(out, wall, 0, 6.4, C, GLASS)
  for (let i = 0; i <= 12; i++) {
    const p = wall[i]
    panel(out, [[p.x - 0.1, 0, p.z], [p.x + 0.1, 0, p.z], [p.x + 0.1, 6.4, p.z], [p.x - 0.1, 6.4, p.z]], [C.x, 3, C.z], MULLION)
    panel(out, [[p.x, 0, p.z - 0.1], [p.x, 0, p.z + 0.1], [p.x, 6.4, p.z + 0.1], [p.x, 6.4, p.z - 0.1]], [C.x, 3, C.z], MULLION)
  }
  stripWall(out, wall, 2.9, 3.05, C, MULLION)
  stripWall(out, wall, 0, 0.14, C, shade(STONE, 0.8))
  // a few posts carrying the eave out over the walk
  for (let i = 2; i <= 10; i += 4) {
    const p = eave[i]
    loft(out, [{ x: p.x - 0.2, z: p.z - 0.2 }, { x: p.x + 0.2, z: p.z - 0.2 }, { x: p.x + 0.2, z: p.z + 0.2 }, { x: p.x - 0.2, z: p.z + 0.2 }], 0, [{ x: p.x - 0.2, z: p.z - 0.2 }, { x: p.x + 0.2, z: p.z - 0.2 }, { x: p.x + 0.2, z: p.z + 0.2 }, { x: p.x - 0.2, z: p.z + 0.2 }], 6.5, shade(STONE, 0.9))
  }
  // the name on the fascia, facing the park (the wall's normal at the skirt's middle)
  const m = eave[6]
  const heading = Math.atan2(m.x - C.x, m.z - C.z)
  sign(out, { type: 'flat', text: 'CINÉMATHÈQUE', h: 1.15, face: 'grotesque', weight: 'bold', colour: hex('#ece6d6'), lit: 'none', w: 20 }, { x: m.x + Math.sin(heading) * 0.15, y: 8.4, z: m.z + Math.cos(heading) * 0.15, heading })
}
