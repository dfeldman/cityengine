import { MeshBuilder } from '../../../buildings.ts'
import { type Rgb } from '../../../models.ts'
import { block, hex, placed, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { rectOn, type Pal } from '../palaces/common.ts'
import { pal, pinnacle, pointedOn } from './churches.ts'
import { apseWall, band, graded, ring, walls } from './common.ts'

/*
 * SAINT-NICOLAS-DES-CHAMPS, on the Rue Saint-Martin: long, low and very wide, five aisles under a great steep slate roof, flamboyant Gothic
 * of the 15th century at this end and Renaissance at the choir. Its west front on the street is three gables, the middle one
 * tall with its pointed door and big window, and on the front's right the square TOWER, plain ochre stone,
 * double tall louvred lights in its top two stages, a parapet with pinnacles at the corners and no spire. Down the south
 * flank along the Rue Réaumur, stout buttresses each with a pinnacle over the chapel windows.
 *
 * In the city the outline (way 56290843, one level) came out as a low gabled shed. The model replaces it and the two parts inside it (1078317819/20): the walls are its ring, the front,
 * tower and south flank from a Commons photograph from the south-west (`Paris st nicolas des champs.jpg`), heights read off it.
 * The north side and the choir are the ring and plausible windows, not checked. Frame: −z the door toward the street at
 * bearing 291; the front stands 6.6° off square in OSM and in this frame, and is drawn so (osmium, 2026-10-30).
 */
const HX = 20.65
const HZ = 46.3
const P: Pal = pal('#c6b793', '#4a5054')
const GLASS: Rgb = hex('#22262c')
const DARK: Rgb = hex('#2d2823')

const PLAN = ring([20.7, -18.9, 15.3, -18.5, 15.3, -26.4, 18.4, -26.4, 18.7, -30.5, 15.4, -30.5, 15.4, -34.4, 19.0, -34.4, 19.2, -38.9, 11.5, -39.2, 11.5, -42.6, -20.3, -46.3, -20.0, 23.9, -17.6, 31.8, -11.0, 38.1,
  -12.4, 40.0, -14.5, 39.2, -14.8, 40.8, -10.7, 44.2, -7.2, 39.6, -5.6, 40.2, -6.2, 43.2, -4.8, 46.1, -1.1, 46.1, 0.5, 43.2, -0.1, 40.3, 9.7, 36.4, 14.0, 31.3, 15.5, 24.3, 15.4, -12.2, 20.5, -13.0])

/** The nave's axis, half-width, eaves, ridge. */
const AX = -2.5
const NW = 7.2
const EAVES = 19
const RIDGE = 27.5

export function saintNicolasDesChamps(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => nicolas(q))
}

function nicolas(out: MeshBuilder): void {
  // the aisles' and chapels' walls on the ring, their long low slates, the nave and its great roof
  walls(out, PLAN, 0, 11, P.stone, P.slate)
  band(out, PLAN, 10.7, 0.3, 0.2, P.trim)
  roof(out, -20.3, AX - NW, -44, 30, 11, 5, 0.01, 0.01, P.slate)
  roof(out, AX + NW, 15.5, -36, 30, 11, 5, 0.01, 0.01, P.slate)
  block(out, AX - NW, AX + NW, -43, 34, 11, EAVES, P.stone)
  block(out, AX - NW - 0.25, AX + NW + 0.25, -43, 34.2, EAVES, EAVES + 0.45, P.trim)
  roof(out, AX - NW - 0.25, AX + NW + 0.25, -43, 34.2, EAVES + 0.45, RIDGE - EAVES - 0.45, NW + 0.25, 0.01, P.slate)
  apseWall(out, AX, 34, 7.2, 11, 18.5, 24, P.stone, P.slate, GLASS, 8)

  // the flanks: the bays of big pointed windows, each buttress and its pinnacle
  for (let z = -30; z < 26; z += 6.4) {
    pointedOn(out, '-x', -20.2, z + 3.2, 3.0, 3.6, 6.8, GLASS)
    block(out, -21.1, -20.2, z - 0.5, z + 0.5, 0, 10.2, P.trim)
    pinnacle(out, -20.65, z, 10.2, 3.0, 0.8, P.trim)
    pointedOn(out, '-x', AX - NW, z + 3.2, 12.8, 3.0, 5.4, GLASS)
    pointedOn(out, '+x', AX + NW, z + 3.2, 12.8, 3.0, 5.4, GLASS)
    pinnacle(out, AX - NW - 1.1, z, 15.6, 4.0, 0.7, P.trim)
    pinnacle(out, AX + NW + 1.1, z, 15.6, 4.0, 0.7, P.trim)
    if (z > -13 && z < 22) {
      pointedOn(out, '+x', 15.4, z + 3.2, 3.0, 3.6, 6.8, GLASS)
      block(out, 15.4, 16.3, z - 0.5, z + 0.5, 0, 10.2, P.trim)
      pinnacle(out, 15.85, z, 10.2, 3.0, 0.8, P.trim)
    }
  }
  // the south portal, Renaissance, in the flank's return
  rectOn(out, '-z', -18.75, 16.2, 19.8, 0, 6.5, P.trim, 0.06)
  rectOn(out, '-z', -18.75, 17.0, 19.0, 0, 4.6, DARK, 0.1)
  pointedOn(out, '-z', -39.0, 15.3, 3.0, 2.6, 5.4, GLASS)

  // THE WEST FRONT, drawn square and turned onto the ring's slanted line through (−4.4, −44.45)
  const q = new MeshBuilder()
  front(q)
  placed(out, q, -0.1158, -4.4, -44.45)

  // THE TOWER at the front's south end, square and plain to its parapet, the double tall lights in the top stages
  const tx = 6.9
  const tz = -38.5
  const h = 4.6
  block(out, tx - h, tx + h, tz - h, tz + h, 0, 36.2, P.stone)
  for (const y of [11.2, 22, 29.2]) block(out, tx - h - 0.15, tx + h + 0.15, tz - h - 0.15, tz + h + 0.15, y, y + 0.35, P.trim)
  block(out, tx - h - 0.3, tx + h + 0.3, tz - h - 0.3, tz + h + 0.3, 36.2, 36.8, P.trim)
  block(out, tx - h - 0.15, tx + h + 0.15, tz - h - 0.15, tz + h + 0.15, 36.8, 37.8, shade(P.stone, 1.03))
  block(out, tx - h + 0.25, tx + h - 0.25, tz - h + 0.25, tz + h - 0.25, 37.7, 37.85, P.lead)
  for (const [f, pl, t] of [['-z', tz - h, tx], ['+z', tz + h, tx], ['+x', tx + h, tz], ['-x', tx - h, tz]] as const) {
    for (const u of [-1.3, 1.3]) {
      pointedOn(out, f, pl, t + u, 22.9, 1.35, 5.7, GLASS)
      pointedOn(out, f, pl, t + u, 30.0, 1.35, 5.7, GLASS)
    }
    pointedOn(out, f, pl, t, 13.0, 1.8, 6.0, GLASS)
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) pinnacle(out, tx + sx * (h - 0.1), tz + sz * (h - 0.1), 37.8, 3.2, 1.0, P.trim)
}

/** The three gables, in a square frame centred on the front: the door and window under the tall middle one. */
function front(q: MeshBuilder): void {
  const hw = 16
  block(q, -hw, hw, 0, 2, 0, 11, P.stone)
  const gable = (x0: number, x1: number, y: number, r: number): void => {
    const m = (x0 + x1) / 2
    q.quad([[x1, y, -0.04], [x0, y, -0.04], [m, y + r, -0.04], [m, y + r, -0.04]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], P.stone, 0)
    block(q, m - 0.1, m + 0.1, -0.12, 0.08, y + r - 0.2, y + r + 1.5, P.trim)
  }
  // the middle wall up to the nave's eaves
  block(q, -NW - 0.3, NW + 0.3, 0, 1.6, 11, EAVES, P.stone)
  gable(-NW - 0.3, NW + 0.3, EAVES, RIDGE - EAVES + 1)
  gable(-hw, -NW - 0.3, 11, 5.2)
  gable(NW + 0.3, hw - 8, 11, 4.2)
  // the door under its gablet, the great window, side doors and windows
  pointedOn(q, '-z', 0, 0, 0, 5.0, 7.6, shade(P.stone, 0.62), 0.05)
  pointedOn(q, '-z', 0, 0, 0, 3.8, 6.8, DARK, 0.09)
  pointedOn(q, '-z', 0, 0, 9.6, 5.4, 10.6, GLASS)
  for (const x of [-11.5, 7.0]) {
    pointedOn(q, '-z', 0, x, 0, 2.2, 4.2, DARK)
    pointedOn(q, '-z', 0, x, 5.4, 3.2, 6.2, GLASS)
  }
  for (const x of [-NW - 0.5, NW + 0.5, -hw + 0.5]) {
    block(q, x - 0.5, x + 0.5, -0.7, 0.3, 0, 12.5, P.trim)
    pinnacle(q, x, -0.2, 12.5, 3.2, 0.9, P.trim)
  }
}
