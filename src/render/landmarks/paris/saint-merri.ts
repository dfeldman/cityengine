import { MeshBuilder, capPolygonWithHoles } from '../../buildings.ts'
import { prism } from '../../models.ts'
import { beam, block, hex, pane, pediment, pinnacle, placed, pointedPane, roof, rotated, shade } from '../kit.ts'
import { ccw, FIXED, walls } from './monuments/common.ts'
import type { P2 } from '../stairway.ts'
import type { Fit } from '../fit.ts'

/**
 * Saint-Merri (1500–1550), the parish church of the Pompidou's quarter: Flamboyant Gothic throughout — a tall
 * nave under a steep roof between aisles, the west front on the Rue Saint-Martin with its three pointed
 * portals under gables and pinnacles, the rose-mullioned window above, and the square bell tower at the
 * north-west corner with its little turret. Replaces its building in the outer ring.
 */
export function saintMerri(out: MeshBuilder, fit: Fit): void {
  const ring = fit.ring && fit.ring.length >= 3 ? fit.ring : null
  // the city frames it with the long axis along z (front 270, the west front at −z); a frame along the long edge
  // (tools/model-shots.ts without --front) is turned into that one and back
  if (fit.hx > fit.hz) {
    const q = new MeshBuilder()
    church(q, fit.hz, fit.hx, ring?.map((p) => ({ x: -p.z, z: p.x })) ?? null)
    rotated(out, q, Math.PI / 2)
    return
  }
  church(out, fit.hx, fit.hz, ring)
}

/** Where the line z = z0 crosses the ring: the outermost crossings, or null. */
function across(ring: P2[], z0: number): [number, number] | null {
  const xs: number[] = []
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length]
    if ((p.z > z0) !== (q.z > z0)) xs.push(p.x + ((z0 - p.z) / (q.z - p.z)) * (q.x - p.x))
  }
  return xs.length >= 2 ? [Math.min(...xs), Math.max(...xs)] : null
}

function inRing(ring: P2[], x: number, z: number): boolean {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) c = !c
  }
  return c
}

/*
 * THE CHURCH ON ITS OWN OUTLINE (owner, 2026-11-03: "a church near pompidou center that overlaps a generic building"):
 * the aisles and chapels are OSM's footprint itself, extruded to the aisle roof — the outline is lopsided, straight on
 * the north at ~19 m from the axis and ~9 m on most of the south, where the Rue de la Verrerie's houses stand against
 * it, so a rectangle centred on the box ran 7 m into them. The nave runs down the middle of the outline as measured
 * across it, not down the box's middle.
 */
function church(out: MeshBuilder, hx: number, hz: number, ring: P2[] | null): void {
  const stone = hex('#b9ad95')
  const trim = shade(stone, 1.05)
  const slate = hex('#4b525a')
  const lead = hex('#6a6e70')
  const dark = hex('#2d2c2a')
  const plan = ring ? ccw(ring) : ccw([{ x: -Math.min(hx, 16), z: -hz }, { x: Math.min(hx, 16), z: -hz }, { x: Math.min(hx, 16), z: hz }, { x: -Math.min(hx, 16), z: hz }])
  const [a, b] = across(plan, 0) ?? [-Math.min(hx, 16), Math.min(hx, 16)]
  const c = (a + b) / 2
  const zf = -hz
  const zb = hz
  // the aisles and chapels: the outline itself, to the aisle roofs, a lead flat behind a low parapet
  walls(out, plan, 0, 13, stone)
  capPolygonWithHoles(out, [plan], 13, lead, FIXED)
  walls(out, plan, 13, 13.8, trim)

  // the nave, its steep roof, the polygonal apse at the east, drawn about the outline's own middle
  const nave = new MeshBuilder()
  block(nave, -6.5, 6.5, zf, zb - 8, 0, 25, stone)
  roof(nave, -6.8, 6.8, zf, zb - 8, 25, 9, 6.8, 0, slate)
  prism(nave, 0, zb - 8, 0, 25, 6.5, 7, stone)
  prism(nave, 0, zb - 8, 25, 31, 6.8, 7, slate, 0, 0.3)
  // clerestory lancets down the nave, both sides
  for (const sx of [-1, 1]) {
    const side = new MeshBuilder()
    for (let z = zf + 7; z < zb - 12; z += 6) pointedPane(side, -6.56, sx < 0 ? -(z + 3) : z + 3, 15, 2.2, 7.5, dark)
    rotated(nave, side, sx < 0 ? Math.PI / 2 : -Math.PI / 2)
  }
  // the west front: three portals under crocketed gables, the great window, the gable, pinnacles
  for (const [x, w, h] of [[-4.2, 2.4, 6.5], [0, 3.4, 8], [4.2, 2.4, 6.5]] as const) {
    pointedPane(nave, zf - 0.02, x, 0.5, w + 0.8, h + 0.8, trim)
    pointedPane(nave, zf - 0.04, x, 0.5, w, h, dark)
    pediment(nave, x - w / 2 - 0.5, x + w / 2 + 0.5, zf - 0.3, h + 1.1, 2.8, 0.4, trim)
  }
  pointedPane(nave, zf - 0.02, 0, 11, 5.4, 10, dark)
  for (let k = -2; k <= 2; k++) pane(nave, '-z', zf - 0.05, k * 0.9, 11, 0.12, 7, trim, 0.04)
  pediment(nave, -6.5, 6.5, zf - 0.1, 25, 8, 1, stone)
  for (const x of [-6.5, 6.5]) pinnacle(nave, x, zf + 0.3, 23, 7, 0.9, trim)
  placed(out, nave, 0, c, 0)

  // flying buttresses from the nave over the aisle roofs, each to a pinnacled pier that stands inside the outline
  for (let z = zf + 7; z < zb - 10; z += 6) {
    for (const sx of [-1, 1]) {
      const px = c + sx * 11.5
      if (!inRing(plan, px, z)) continue
      block(out, px - 0.5, px + 0.5, z - 0.5, z + 0.5, 13, 16, stone)
      pinnacle(out, px, z, 16, 4, 0.7, trim)
      beam(out, [px, 15, z], [c + sx * 6.6, 21.5, z], 0.3, stone, 0.5)
    }
  }
  // the bell tower at the north-west corner (local −x is north) and its stair turret, kept inside the outline
  const tx = a + 3.5
  const tz = zf + 3.5
  if (inRing(plan, tx, tz) || !ring) {
    block(out, tx - 3.5, tx + 3.5, tz - 3.5, tz + 3.5, 0, 34, stone)
    block(out, tx - 3.8, tx + 3.8, tz - 3.8, tz + 3.8, 33, 34.6, trim)
    for (const y of [18, 26]) pointedPane(out, tz - 3.52, tx, y, 1.6, 5.2, dark)
    prism(out, tx + 3, tz - 3, 20, 38, 1.1, 8, stone)
    prism(out, tx + 3, tz - 3, 38, 41, 1.3, 8, slate, 0, 0.1)
  }
}
