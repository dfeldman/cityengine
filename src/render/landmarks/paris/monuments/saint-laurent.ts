import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { rectOn, type Pal } from '../palaces/common.ts'
import { pal, pinnacle, pointedOn, roseOn } from './churches.ts'
import { apseWall, band, FIXED, graded, ring, walls } from './common.ts'

/*
 * SAINT-LAURENT, on the Boulevard de Strasbourg at the Gare de l'Est: dark weathered Gothic, 15th-century in the body, with a west front
 * Simon-Claude Constant-Dufeux made flamboyant in 1862–66 — a deep pointed portal under a tympanum, a wheel of a rose,
 * a steep pierced gable between two pinnacled buttresses, a rail across — and on the south side of the front its one TOWER, plain stone with
 * tall lights up to its balustrade and on it a slender dark spire, the church's mark from down the boulevard. Along the flanks
 * buttresses and pinnacles and big pointed windows under a steep slate roof.
 *
 * In the city the outline (way 63200612, five levels) came out as a flat block. The model replaces it and the three small parts inside it
 * (1463939173/4/6). Its walls are the ring, clean in this frame; the front and the tower from one Commons photograph, taken from the
 * south-west. That the tower stands on the south side is read from that one view and the ring's width, and its heights are
 * estimated. Frame: −z the portal toward the boulevard at bearing 270 (osmium, 2026-10-30); the axis is x = −7.7, not the box's.
 */
const HX = 24
const HZ = 35.3
const P: Pal = pal('#9a9480', '#474d52')
const GLASS: Rgb = hex('#20242c')
const LEAD: Rgb = hex('#34393d')

const AX = -7.75
const FZ = -31.5
/** The nave's walls either side of the axis, its eaves, its ridge. */
const NW = 7.6
const EAVES = 21
const RIDGE = 29

const PLAN = ring([24.0, 21.8, 17.2, 24.8, 16.6, 23.4, 13.3, 23.5, 10.9, 27.6, 7.1, 27.4, 4.6, 23.6, 1.4, 23.6, -2.3, 27.5, -1.2, 31.0, -3.2, 34.1, -7.4, 35.3, -11.6, 33.8, -13.6, 30.6, -12.2, 27.1, -15.9, 23.5, -17.0, 19.5, -22.7, 19.6,
  -23.7, -31.5, 8.2, -31.4, 8.2, -8.3, 21.5, -8.4, 21.6, -0.7, 16.0, -0.6, 18.6, 12.1, 21.8, 11.4])

export function saintLaurent(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => laurent(q))
}

function laurent(out: MeshBuilder): void {
  // the aisles and chapels on the ring, their lean-to slates, the nave over them, the transept, the apse
  walls(out, PLAN, 0, 11.5, P.stone, P.slate)
  band(out, PLAN, 11.2, 0.35, 0.2, P.trim)
  block(out, AX - NW, AX + NW, FZ, 22, 11.5, EAVES, P.stone)
  block(out, AX - NW - 0.3, AX + NW + 0.3, FZ, 22.2, EAVES, EAVES + 0.5, P.trim)
  roof(out, AX - NW - 0.3, AX + NW + 0.3, FZ, 22.2, EAVES + 0.5, RIDGE - EAVES - 0.5, NW + 0.3, 0.01, P.slate)
  roof(out, -23.7, AX - NW, FZ + 8, 19.6, 11.5, 3.2, 0.01, 0.01, P.slate)
  block(out, AX + NW, 21.4, -8.3, 11.0, 11.5, 18.5, P.stone)
  roof(out, AX + NW, 21.6, -8.5, 11.2, 18.5, 5.5, 0.01, 9.8, P.slate)
  pointedOn(out, '+x', 21.4, 1.3, 8.4, 5.0, 8.4, GLASS)
  apseWall(out, AX, 22, 8.0, 11.5, 19.5, 24, P.stone, P.slate, GLASS, 8)
  // the flanks: a buttress with its pinnacle and a big window to each bay
  for (let z = -25; z < 16; z += 6.6) {
    pointedOn(out, '-x', -23.7, z + 3.3, 3.2, 3.6, 7.2, GLASS)
    block(out, -24.7, -23.7, z - 0.55, z + 0.55, 0, 10.4, P.trim)
    pinnacle(out, -24.2, z, 10.4, 3.0, 0.8, P.trim)
    pointedOn(out, '-x', AX - NW, z + 3.3, 13.4, 3.4, 6.4, GLASS)
    pointedOn(out, '+x', AX + NW, z + 3.3, 13.4, 3.4, 6.4, GLASS)
    if (z < -9) {
      pointedOn(out, '+x', 8.2, z + 3.3, 3.2, 3.6, 7.2, GLASS)
      block(out, 8.2, 9.2, z - 0.55, z + 0.55, 0, 10.4, P.trim)
      pinnacle(out, 8.7, z, 10.4, 3.0, 0.8, P.trim)
    }
  }

  // THE WEST FRONT: the portal and its forward buttresses, the rail, the rose, the gable and its pinnacles
  block(out, AX - 5.4, AX + 5.4, FZ - 1.9, FZ, 0, 11.2, P.stone)
  pointedOn(out, '-z', FZ - 1.9, AX, 0, 6.4, 9.7, shade(P.stone, 0.62), 0.05)
  pointedOn(out, '-z', FZ - 1.9, AX, 0, 5.2, 8.7, hex('#2b2a2c'), 0.09)
  rectOn(out, '-z', FZ - 1.9, AX - 2.5, AX + 2.5, 4.6, 6.2, hex('#7a6a4c'), 0.12)
  block(out, AX - 5.9, AX + 5.9, FZ - 2.1, FZ, 11.2, 11.65, P.trim)
  roseOn(out, '-z', FZ, AX, 16.0, 3.6, GLASS, P.trim)
  block(out, AX - NW, AX + NW, FZ - 0.25, FZ, 20.0, 20.6, P.trim)
  // the steep gable, its lights, its cross
  const W = NW + 0.1
  const xa = AX - W
  const xb = AX + W
  const q: [number, number, number][] = [[xb, EAVES - 0.3, FZ - 0.06], [xa, EAVES - 0.3, FZ - 0.06], [AX, RIDGE + 0.8, FZ - 0.06], [AX, RIDGE + 0.8, FZ - 0.06]]
  out.quad(q, [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], P.stone, FIXED)
  for (const [x, h] of [[AX - 2.4, 3.6], [AX, 5.0], [AX + 2.4, 3.6]] as const) pointedOn(out, '-z', FZ, x, EAVES + 0.4, 1.5, h, GLASS, 0.1)
  block(out, AX - 0.1, AX + 0.1, FZ - 0.1, FZ + 0.1, RIDGE + 0.6, RIDGE + 2.8, P.trim)
  block(out, AX - 0.6, AX + 0.6, FZ - 0.1, FZ + 0.1, RIDGE + 1.9, RIDGE + 2.15, P.trim)
  for (const x of [AX - 8.3, AX + 8.3]) {
    block(out, x - 0.85, x + 0.85, FZ - 1.2, FZ + 0.4, 0, 24, P.trim)
    pinnacle(out, x, FZ - 0.4, 24, 6.5, 1.4, P.trim)
  }
  // the aisle's own gable to the north
  pointedOn(out, '-z', FZ, -19.8, 3.6, 3.6, 6.8, GLASS)

  // THE TOWER, on the south side of the front: four stages, tall lights, the balustrade, the slender dark spire
  const tx = 3.6
  const tz = -26.6
  const h = 4.6
  block(out, tx - h, tx + h, tz - h, tz + h, 0, 30, P.stone)
  for (const y of [11.5, 20.5, 29.8]) block(out, tx - h - 0.2, tx + h + 0.2, tz - h - 0.2, tz + h + 0.2, y, y + 0.5, P.trim)
  for (const [f, pl, t] of [['-z', tz - h, tx], ['+z', tz + h, tx], ['+x', tx + h, tz], ['-x', tx - h, tz]] as const) {
    for (const u of [-1.3, 1.3]) pointedOn(out, f, pl, t + u, 22.0, 1.7, 6.8, GLASS)
    pointedOn(out, f, pl, t, 13.0, 2.2, 6.4, GLASS)
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) pinnacle(out, tx + sx * (h - 0.3), tz + sz * (h - 0.3), 30.2, 5, 0.9, P.trim)
  prism(out, tx, tz, 30.2, 37.5, 3.2, 8, LEAD, FIXED, 1.75, true)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    block(out, tx + Math.sin(a) * 2.35 - 0.25, tx + Math.sin(a) * 2.35 + 0.25, tz + Math.cos(a) * 2.35 - 0.25, tz + Math.cos(a) * 2.35 + 0.25, 33.0, 35.0, shade(P.trim, 0.85))
  }
  prism(out, tx, tz, 37.5, 51, 1.75, 8, LEAD, FIXED, 0.08, true)
  block(out, tx - 0.05, tx + 0.05, tz - 0.05, tz + 0.05, 50.6, 53.0, P.dark)
}
