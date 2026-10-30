/**
 * The PLENITUDE ARENA, built as the U Arena and long the Paris La Défense Arena (Christian de Portzamparc, 2013–17; 592
 * giant aluminium-and-glass scales on its facade, lit by 3,000 LED strips; a fixed roof; about 33,000 m² of offices attached:
 * Wikipedia fr). OSM: relation/14479234, height 49, roof:height 14, 7 levels, with the Conseil départemental's 11-level
 * wing (way/443073294) drawn as a part of it; the wing is OSM's plan, the rest its outline in this frame.
 *
 * What a rider sees from the Jardins de l'Arche and the Boulevard Aimé Césaire (Commons "Entrée 4 Paris Défense Arena",
 * "Enseignes Naming Plenitude Arena", and the view from the Grande Arche's roof): a great rounded block, sheathed in pale
 * pointed SCALES in overlapping rows, over a glazed ground floor; a deep white cornice; the huge dark SCREEN in its white frame
 * tilted out from the wall, and the green name over the doors; the dark roof with a white ring, rising 14 m. The wing is a
 * plain white slab of bands of glass across the north end.
 *
 * Placed by point and size (the outline's box, not its parts' hull): `front` 116, local −z east-south-east to the gardens,
 * +x north-north-east to the wing. The scale's outline is from the photographs; the screen's place on the wall is approximate.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { signText } from '../../parts.ts'
import { ccw, plan, rounded } from '../museums/shapes.ts'
import { groundMid, quadN, type V3 } from './bowl.ts'
import { edgesOf, onEdge, row, sheet, skirt, walls, type P2 } from './shell.ts'

const HX = 100.7
const HZ = 82.5
const WHITE: Rgb = [0.9, 0.9, 0.88]
const WHITE_DK: Rgb = [0.72, 0.73, 0.72]
const SCALE: Rgb = [0.78, 0.83, 0.87]
const SCALE2: Rgb = [0.68, 0.75, 0.82]
const BACK: Rgb = [0.2, 0.26, 0.32]
const GLASS: Rgb = [0.15, 0.2, 0.25]
const ROOF: Rgb = [0.2, 0.22, 0.25]
const ROOF2: Rgb = [0.25, 0.27, 0.3]

/** the wing in the frame of bearing 116: OSM's way/443073294 */
const WING: [number, number][] = [[41, 79], [57, -82], [95, -78], [99, -77], [101, -72], [81, 7], [66, 54], [58, 68], [48, 77]]

/** One scale on the wall: a tall pointed leaf, bulged out at its belly, leaning out at its foot over the row below. */
function scale(out: MeshBuilder, c: P2, tx: number, tz: number, nx: number, nz: number, y0: number, y1: number, w: number, col: Rgb, tag: number): void {
  const P = (s: number, h: number, o: number): V3 => [c.x + tx * s * w / 2 + nx * o, y0 + (y1 - y0) * h, c.z + tz * s * w / 2 + nz * o]
  const n: V3 = [nx, 0.1, nz]
  // the foot's point, the belly, the shoulders, the top's point: both halves, in three bands
  quadN(out, [P(0, 0, 2.1), P(1, 0.3, 2), P(0, 0.3, 2.6), P(0, 0.3, 2.6)], n, col, tag)
  quadN(out, [P(0, 0, 2.1), P(0, 0.3, 2.6), P(-1, 0.3, 2), P(-1, 0.3, 2)], n, col, tag)
  quadN(out, [P(-1, 0.3, 2), P(0, 0.3, 2.6), P(0, 0.75, 1.9), P(-1, 0.75, 1.2)], n, col, tag)
  quadN(out, [P(0, 0.3, 2.6), P(1, 0.3, 2), P(1, 0.75, 1.2), P(0, 0.75, 1.9)], n, [col[0] * 0.93, col[1] * 0.93, col[2] * 0.93], tag)
  quadN(out, [P(-1, 0.75, 1.2), P(0, 0.75, 1.9), P(0, 1, 0.5), P(0, 1, 0.5)], n, col, tag)
  quadN(out, [P(0, 0.75, 1.9), P(1, 0.75, 1.2), P(0, 1, 0.5), P(0, 1, 0.5)], n, [col[0] * 0.93, col[1] * 0.93, col[2] * 0.93], tag)
}

export function plenitudeArena(out: MeshBuilder, fit: Fit): void {
  const metal = surfaceTag('metal')
  const glass = surfaceTag('glass')
  const conc = surfaceTag('concrete')
  const g = groundMid(fit)
  const sx = fit.hx / HX
  const sz = fit.hz / HZ
  const H = g + Math.min(fit.height || 49, 49)
  const cornice = H - 14                  // OSM: 49 m, with a roof of 14
  const body = ccw(rounded(-HX * sx, 50 * sx, -HZ * sz, HZ * sz, 26 * Math.min(sx, sz), 5))

  // ---- the ground floor: glass behind pale piers
  walls(out, body, g - 0.5, g + 7, GLASS, glass)
  const es = edgesOf(body)
  for (const e of es) if (e.L > 6) row(out, e, g - 0.5, 7.5, 7.5, 1.1, 0.5, WHITE, conc, 0)

  // ---- the wall of scales: dark behind, three rows staggered by half a scale, round everything but the wing's side
  walls(out, body, g + 7, cornice, BACK, glass)
  const w = 4.6
  const rowsY = [g + 6.2, g + 14.2, g + 22.2, g + 30]
  let col = 0
  for (const e of es) {
    if (e.nx > 0.7) continue            // behind the wing
    const n = Math.max(1, Math.round(e.L / w))
    for (let r = 0; r < 3; r++) {
      const shift = r % 2 ? 0.5 : 0
      for (let i = 0; i < n; i++) {
        const t = ((i + shift + 0.0) * e.L) / n + (0.5 * e.L) / n
        if (t > e.L) continue
        const c = onEdge(e, t, 0)
        scale(out, c, e.tx, e.tz, e.nx, e.nz, rowsY[r], rowsY[r + 1] + 2.6, (e.L / n) * 1.04, (col++ % 3 === 1) ? SCALE2 : SCALE, metal)
      }
    }
  }

  // ---- the cornice: a white soffit swept out, a thick band, the dark roof rising to its white ring, the flat top
  const ringAt = (d: number): P2[] => ccw(rounded((-HX - d) * sx, (50 + d) * sx, (-HZ - d) * sz, (HZ + d) * sz, Math.max(4, (26 + d)) * Math.min(sx, sz), 5))
  const lip = ringAt(3)
  skirt(out, ringAt(-0.2), cornice - 3, lip, cornice - 0.6, 'down', WHITE_DK, conc)
  walls(out, lip, cornice - 0.6, cornice + 1.8, WHITE, conc)
  skirt(out, lip, cornice + 1.8, ringAt(-3), cornice + 2.2, 'up', WHITE, conc)
  skirt(out, ringAt(-3), cornice + 2.2, ringAt(-18), H - 4.2, 'up', (i) => (i % 2 ? ROOF : ROOF2), metal)
  skirt(out, ringAt(-18), H - 4.2, ringAt(-21), H - 3.6, 'up', WHITE, conc)
  skirt(out, ringAt(-21), H - 3.6, ringAt(-45), H, 'up', (i) => (i % 2 ? ROOF2 : ROOF), metal)
  capPolygon(out, ringAt(-45), H, ROOF, metal)

  // ---- the wing: OSM's plan, a white slab of 11 levels with its bands of glass
  const wing = ccw(plan(WING, sx, sz))
  const wingTop = g + 44
  walls(out, wing, g - 0.5, wingTop, WHITE, conc)
  capPolygon(out, wing, wingTop, WHITE_DK, conc)
  for (const e of edgesOf(wing)) {
    if (e.L < 6) continue
    for (let f = 1; f < 11; f++) sheet(out, e, 0.8, e.L - 0.8, g + f * 4 - 0.4, g + f * 4 + 2, 0.05, GLASS, glass)
  }
  // the link between the wing and the arena, up to the cornice
  box(out, 48 * sx, (g + cornice) / 2, -10 * sz, 8 * sx, (cornice - g) / 2 + 0.2, 62 * sz, WHITE_DK, conc)

  // ---- the screen and the name, on the gardens' side: a dark panel tilted out in a thick white frame
  const zf = -HZ * sz
  const x0 = 2 * sx
  const P = (x: number, y: number, o: number): V3 => [x0 + x, y, zf - o]
  const hw = 15
  const y0 = g + 10
  const y1 = g + 28
  // the frame's face, sides and top, then the screen on it
  quadN(out, [P(-hw - 1.2, y0 - 1.2, 5.6), P(hw + 1.2, y0 - 1.2, 5.6), P(hw + 1.2, y1 + 1.2, 3.6), P(-hw - 1.2, y1 + 1.2, 3.6)], [0, 0.1, -1], WHITE, conc)
  quadN(out, [P(-hw, y0, 5.75), P(hw, y0, 5.75), P(hw, y1, 3.75), P(-hw, y1, 3.75)], [0, 0.1, -1], [0.05, 0.06, 0.08], glass)
  for (const s of [-1, 1]) quadN(out, [P(s * (hw + 1.2), y0 - 1.2, 5.6), P(s * (hw + 1.2), y0 - 1.2, 0), P(s * (hw + 1.2), y1 + 1.2, 0), P(s * (hw + 1.2), y1 + 1.2, 3.6)], [s, 0, 0], WHITE_DK, conc)
  quadN(out, [P(-hw - 1.2, y0 - 1.2, 5.6), P(hw + 1.2, y0 - 1.2, 5.6), P(hw + 1.2, y0 - 1.2, 0), P(-hw - 1.2, y0 - 1.2, 0)], [0, -1, 0], WHITE_DK, conc)
  quadN(out, [P(-hw - 1.2, y1 + 1.2, 3.6), P(hw + 1.2, y1 + 1.2, 3.6), P(hw + 1.2, y1 + 1.2, 0), P(-hw - 1.2, y1 + 1.2, 0)], [0, 1, 0], WHITE, conc)
  // the canopy with the green name, to the screen's south
  const xs = x0 - 42 * sx
  box(out, xs, g + 7.6, zf - 3, 13, 0.9, 3.4, WHITE, conc)
  signText(out, 'plenitude arena', xs, g + 10, zf - 5.4, 2.6, [0.1, 0.62, 0.34], { heading: Math.PI, lit: true })
  for (const s of [-1, 1]) pierFoot(out, xs + s * 10, zf - 5.6, g, conc)
}

const pierFoot = (out: MeshBuilder, x: number, z: number, g: number, tag: number): void => box(out, x, g + 3.4, z, 0.35, 3.6, 0.35, WHITE, tag)
