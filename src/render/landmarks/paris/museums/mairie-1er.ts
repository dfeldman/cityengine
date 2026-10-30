import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { beam, block, hex, pinnacle, pointedPane, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, hipRoof, palette, pedimentOn, pts, slabOn } from '../palaces/common.ts'

const FIXED = 0
/** the design footprint: OSM relation 538908 and way 53770906 in one box (local −z faces bearing 262, the Place du Louvre) */
const HX = 33.2
const HZ = 21.65

/** OSM's outline of the mairie in this frame (osmium, 2026-10-30), the jogs ironed flat */
const MAIRIE = pts([-9.7, -21.6, 10.3, -6.4, 4.8, 6.9, -1.9, 12.9, 2.1, 19.2, -5.8, 15.8, -13.2, 20.1, -21.1, 21.6, -33.2, 18.1, -31.0, 1.3, -24.6, -4.8, -28.2, -9.0])

/**
 * L'ancienne Mairie du 1er (Jacques-Ignace Hittorff, 1855–60) on the Place du Louvre, and the belfry (Théodore Ballu,
 * 1858–62) that ties it to Saint-Germain-l'Auxerrois. Haussmann wanted the square symmetrical before the Louvre's
 * Colonnade, so Hittorff copied the church's Gothic porch and rose beside it in the same stone, and Ballu put a tower
 * between. Now Quartier Jeunes. From the Place du Louvre (local −z):
 *
 * - the mairie (to the rider's left, −x): the wide porch of pointed arches, the great rose over it, a steep gable and
 *   pinnacles, a slate roof behind;
 * - the BELFRY (to the right, +x): a slim flamboyant tower, buttressed, its louvres and clock, a spire, the tallest
 *   thing on the square;
 * - the church itself is its own entry, and carries on beyond.
 *
 * Plan from OSM's relation 538908 and way 53770906, which is the tower and its base. Heights, rose and porch are from
 * memory of them. No photograph was checked. The tower's position inside its way is an estimate.
 */
export function mairie1er(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d4c9ad', '#4c5358')
  const E = 15
  extrude(out, [MAIRIE], p, { eaves: E, bay: 3.8, win: 1.3, rise: 4, inset: 1.5, dormers: true,
    storeys: [{ y: 0, h: 2.9, sill: 1.2 }, { y: 5.6, h: 3.4, sill: 0.8 }, { y: 10.6, h: 2.6, sill: 0.7 }] })
  // ---- the front: a wide slab on the outline's −z corner, porch, rose, gable
  const c = -14
  const hw = 12.6
  const f = -22.4
  block(out, c - hw, c + hw, f, f + 9, 0, E + 1.4, p.stone)
  // the five-arched porch, as at Saint-Germain, a little proud
  block(out, c - hw - 0.4, c + hw + 0.4, f - 3, f, 0, 7.6, p.stone)
  block(out, c - hw - 0.6, c + hw + 0.6, f - 3.2, f, 7.6, 8.2, p.trim)
  const n = 5
  const bay = (2 * hw) / n
  for (let i = 0; i < n; i++) {
    const x = c - hw + (i + 0.5) * bay
    pointedPane(out, f - 3.02, x, 0.4, bay - 1.1, 6.4, p.dark)
    if (i < n - 1) {
      const px = c - hw + (i + 1) * bay
      block(out, px - 0.34, px + 0.34, f - 3.3, f - 2.8, 0, 7.6, p.trim)
      pinnacle(out, px, f - 3, 8.2, 2.6, 0.5, p.trim)
    }
  }
  for (const x of [c - hw - 0.2, c + hw + 0.2]) pinnacle(out, x, f - 3, 8.2, 2.8, 0.55, p.trim)
  // the balustrade over the porch, the rose above it
  slabOn(out, '-z', f, c - hw, c + hw, 8.2, 9, 0.2, p.trim)
  const R = 3.8
  const ry = 12.7
  const rim: [number, number, number] = shade(p.trim, 0.98)
  rose(out, c, ry, f - 0.06, R + 0.7, rim, 24)
  rose(out, c, ry, f - 0.12, R, p.glass, 24)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI
    beam(out, [c - Math.cos(a) * R, ry - Math.sin(a) * R, f - 0.18], [c + Math.cos(a) * R, ry + Math.sin(a) * R, f - 0.18], 0.07, rim)
  }
  rose(out, c, ry, f - 0.22, 1.1, rim, 12)
  for (const s of [-1, 1]) {
    pointedPane(out, f - 0.06, c + s * 8.8, 9.6, 2.4, 4.6, p.glass)
    block(out, c + s * 6 - 0.36, c + s * 6 + 0.36, f - 0.3, f, 8.8, E + 1.4, p.trim)
  }
  // the gable and its roof
  pedimentOn(out, '-z', f, c - hw + 2.4, c + hw - 2.4, E + 1.4, 6.8, 0.3, p.stone)
  hipRoof(out, c - hw + 2.4, c + hw - 2.4, f + 0.2, f + 10, E + 1.4, 6.6, p.slate, 0)
  for (const x of [c - hw, c + hw]) {
    block(out, x - 0.7, x + 0.7, f - 0.5, f + 0.8, 0, E + 2, p.trim)
    pinnacle(out, x, f + 0.15, E + 2, 3.6, 0.7, p.trim)
  }
  pinnacle(out, c, f + 0.1, E + 8.1, 1.8, 0.4, p.trim)

  // ---- the belfry, on the other half of the box
  const tx = 21.5
  const tz = -2
  const w = 4.2
  block(out, tx - w - 1.5, tx + w + 1.5, tz - w - 1.5, tz + w + 1.5, 0, 12, p.stone)
  block(out, tx - w, tx + w, tz - w, tz + w, 0, 28, p.stone)
  for (const y of [12, 18.6, 24.6]) block(out, tx - w - 0.3, tx + w + 0.3, tz - w - 0.3, tz + w + 0.3, y, y + 0.34, p.trim)
  // buttresses at the corners, stepped and pinnacled
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      block(out, tx + sx * w - 0.55, tx + sx * w + 0.55, tz + sz * w - 0.55, tz + sz * w + 0.55, 0, 28, p.trim)
      pinnacle(out, tx + sx * w, tz + sz * w, 28, 4.4, 0.5, p.trim)
    }
  }
  pointedPane(out, tz - w - 1.52, tx, 0.4, 3.4, 7, p.dark)
  for (const [y, h] of [[13.4, 4.5], [19.8, 4.3]] as const) {
    pointedPane(out, tz - w - 0.02, tx, y, 3.2, h, y < 15 ? p.glass : shade(p.dark, 1.3))
    pointedPane(out, tz + w + 0.02, tx, y, 3.2, h, y < 15 ? p.glass : shade(p.dark, 1.3))
  }
  // the clock on the belfry's west face
  rose(out, tx, 26.3, tz - w - 0.06, 1.2, hex('#22303a'), 16)
  rose(out, tx, 26.3, tz - w - 0.1, 0.1, p.gold, 6)
  // the parapet and the spire
  block(out, tx - w - 0.2, tx + w + 0.2, tz - w - 0.2, tz + w + 0.2, 28, 29.3, p.stone)
  prism(out, tx, tz, 29.3, 44, w * 0.88, 8, p.slate, FIXED, 0.12)
  prism(out, tx, tz, 44, 45.6, 0.14, 6, p.gold, FIXED, 0.03)
  // the short screen between the mairie and the tower, as on the plan
  block(out, 10, tx - w, -9, 2, 0, 11, p.stone)
  block(out, 9.8, tx - w, -9.2, 2.2, 11, 11.6, p.trim)
  for (const x of [13.3, 17.2]) pointedPane(out, -9.02, x, 3, 2.4, 5, p.glass)
  hipRoof(out, 10, tx - w, -9, 2, 11.6, 2.4, p.slate, 0)
}

/** A flat round pane facing −z. */
function rose(out: MeshBuilder, x: number, y: number, z: number, r: number, c: [number, number, number], n: number): void {
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2
    const a1 = ((k + 1) / n) * Math.PI * 2
    out.quad([[x, y, z], [x + Math.cos(a1) * r, y + Math.sin(a1) * r, z], [x + Math.cos(a0) * r, y + Math.sin(a0) * r, z], [x, y, z]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
}
