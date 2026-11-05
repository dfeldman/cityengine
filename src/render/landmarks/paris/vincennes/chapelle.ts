/**
 * THE SAINTE-CHAPELLE DE VINCENNES (1379–1552): a single tall Flamboyant nave of five bays with a three-sided apse to the
 * east, its walls almost all glass between deep buttresses that rise to crocketed pinnacles, a balustrade at the eaves and
 * a steep slate roof. The west front carries a great Flamboyant rose under a tall gable, between two pinnacled corner
 * turrets; a low two-storey oratory/sacristy range clings to the north side of the choir.
 * Plan: OSM w83819785 (osmium on the local pbf). Heights: IGN lidar MNS (2026-11-04) — eaves 25–26 m, ridge 39 m,
 * west pinnacles ~33 m, north range ~22 m. Refs: Commons, façade and south-west view (docs/landmarks/refs/vincennes/chapelle/).
 * Local frame: x east, +z north (entry front 180), origin on the ridge line at the middle of the footprint.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, pinnacle, prism, type Rgb } from '../../kit.ts'
import { archOn, rectOn } from '../palaces/common.ts'
import { quadN } from '../venues/bowl.ts'

const STONE: Rgb = hex('#d8cfbb'), STONE_D: Rgb = hex('#c4baa4'), SLATE: Rgb = hex('#4a5058'), DARK: Rgb = hex('#2e2c2a'),
  GLASS: Rgb = hex('#3a4250')

// the nave: west face, east end of the straight bays (apse centre), half width, eaves and ridge
const X_W = -20.5, X_E = 12.5, HW = 7, EAVES = 25.5, RIDGE = 39
const APSE_SIDES = 3                     // half of a hexagon: three faces round the east end
const BAYS = 5, BUTT_D = 2.2, BUTT_W = 1.4, PIN_H = 4.5
const WIN_W = 4.2, WIN_Y0 = 4.5, WIN_H = 18
const BAL_H = 1.1
// the west front: gable, rose, corner turrets
const ROSE_Y = 15, ROSE_W = 10, ROSE_H = 13
const TUR_R = 1.6, TUR_TOP = 29, TUR_SPIRE = 5
const DOOR_W = 4.5, DOOR_H = 7.5
// the north range by the choir
const N_RANGE: [number, number, number, number] = [0, 15.5, HW, 17.5]
const N_H = 21, N_ROOF = 3.5

function nave(out: MeshBuilder, y: number): void {
  block(out, X_W, X_E, -HW, HW, y, y + EAVES, STONE)
  block(out, X_W - 0.3, X_E, -HW - 0.3, HW + 0.3, y, y + 1.2, STONE_D)                 // plinth
  block(out, X_W, X_E, -HW - 0.4, HW + 0.4, y + EAVES - 0.6, y + EAVES, STONE_D)       // cornice
  block(out, X_W, X_E, HW + 0.1, HW + 0.4, y + EAVES, y + EAVES + BAL_H, STONE_D)      // balustrades
  block(out, X_W, X_E, -HW - 0.4, -HW - 0.1, y + EAVES, y + EAVES + BAL_H, STONE_D)
  const bay = (X_E - X_W) / BAYS
  for (let i = 0; i <= BAYS; i++) {
    const x = X_W + i * bay
    for (const s of [-1, 1]) {
      const z0 = s < 0 ? -HW - BUTT_D : HW, z1 = s < 0 ? -HW : HW + BUTT_D
      block(out, x - BUTT_W / 2, x + BUTT_W / 2, z0, z1, y, y + EAVES - 1, STONE)
      pinnacle(out, x, s * (HW + BUTT_D / 2), y + EAVES - 1, PIN_H + 2, BUTT_W, STONE_D)
    }
    if (i === BAYS) continue
    const t = x + bay / 2
    if (t > N_RANGE[0]) {                                                                 // north range hides the lower half
      archOn(out, '+z', HW, t, y + N_H + 0.5, WIN_W * 0.9, EAVES - N_H - 2.5, GLASS)
    } else archOn(out, '+z', HW, t, y + WIN_Y0, WIN_W, WIN_H, GLASS)
    archOn(out, '-z', -HW, t, y + WIN_Y0, WIN_W, WIN_H, GLASS)
  }
  // the gable roof
  const yE = y + EAVES, yR = y + RIDGE
  for (const s of [-1, 1]) {
    quadN(out, [[X_W, yE, s * (HW + 0.4)], [X_E, yE, s * (HW + 0.4)], [X_E, yR, 0], [X_W, yR, 0]], [0, 1, s], SLATE)
  }
  quadN(out, [[X_W, yE, -HW], [X_W, yE, HW], [X_W, yR, 0], [X_W, yR, 0]], [-1, 0, 0], STONE)  // west gable
}

function apse(out: MeshBuilder, y: number): void {
  const pts: [number, number][] = []
  for (let i = 0; i <= APSE_SIDES; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / APSE_SIDES
    pts.push([X_E + Math.cos(a) * HW, Math.sin(a) * HW])
  }
  const yE = y + EAVES, yR = y + RIDGE
  for (let i = 0; i < APSE_SIDES; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1]
    const mx = (ax + bx) / 2 - X_E, mz = (az + bz) / 2, l = Math.hypot(mx, mz), nx = mx / l, nz = mz / l
    quadN(out, [[ax, y, az], [bx, y, bz], [bx, yE, bz], [ax, yE, az]], [nx, 0, nz], STONE)
    // the window, inset a little in front of the face
    const cx = X_E + mx + nx * 0.08, cz = mz + nz * 0.08, tx = -nz, tz = nx, w = WIN_W * 0.9
    const sp = y + WIN_Y0 + WIN_H - w * 0.6
    quadN(out, [[cx - tx * w / 2, y + WIN_Y0, cz - tz * w / 2], [cx + tx * w / 2, y + WIN_Y0, cz + tz * w / 2],
      [cx + tx * w / 2, sp, cz + tz * w / 2], [cx - tx * w / 2, sp, cz - tz * w / 2]], [nx, 0, nz], GLASS)
    quadN(out, [[cx - tx * w / 2, sp, cz - tz * w / 2], [cx + tx * w / 2, sp, cz + tz * w / 2],
      [cx, sp + w * 0.6, cz], [cx, sp + w * 0.6, cz]], [nx, 0, nz], GLASS)
    // the hipped roof facet down to this face
    quadN(out, [[ax + (ax - X_E) * 0.05, yE, az * 1.05], [bx + (bx - X_E) * 0.05, yE, bz * 1.05], [X_E, yR, 0], [X_E, yR, 0]],
      [nx, 1, nz], SLATE)
    // buttress and pinnacle at each apse angle
    if (i > 0) {
      const ux = (ax - X_E) / HW, uz = az / HW
      block(out, ax + ux * BUTT_D / 2 - 0.7, ax + ux * BUTT_D / 2 + 0.7, az + uz * BUTT_D / 2 - 0.7, az + uz * BUTT_D / 2 + 0.7,
        y, y + EAVES - 1, STONE)
      pinnacle(out, ax + ux * BUTT_D / 2, az + uz * BUTT_D / 2, y + EAVES - 1, PIN_H + 2, BUTT_W, STONE_D)
    }
  }
  prism(out, X_E - 2, 0, y + RIDGE - 0.5, y + RIDGE + 6, 0.5, 6, SLATE, undefined, 0.05)     // the flèche stub
}

function westFront(out: MeshBuilder, y: number): void {
  archOn(out, '-x', X_W, 0, y + ROSE_Y, ROSE_W, ROSE_H, GLASS, 0.1)
  archOn(out, '-x', X_W, 0, y + ROSE_Y - 0.6, ROSE_W + 1.6, ROSE_H + 1.4, STONE_D, 0.05)
  block(out, X_W - 2.2, X_W, -4, 4, y, y + 11, STONE)                                    // the porch with its gablet
  quadN(out, [[X_W - 2.2, y + 11, -4], [X_W - 2.2, y + 11, 4], [X_W - 2.2, y + 15.5, 0], [X_W - 2.2, y + 15.5, 0]],
    [-1, 0, 0], STONE)
  archOn(out, '-x', X_W - 2.2, 0, y + 0.3, DOOR_W, DOOR_H, DARK, 0.06)
  rectOn(out, '-x', X_W, -HW + 0.5, HW - 0.5, y + EAVES, y + EAVES + BAL_H, STONE_D, 0.3)
  for (const s of [-1, 1]) {                                                             // the corner stair turrets
    const z = s * (HW + 0.6), x = X_W + 0.4
    prism(out, x, z, y, y + TUR_TOP, TUR_R, 8, STONE)
    prism(out, x, z, y + TUR_TOP - 0.6, y + TUR_TOP, TUR_R + 0.35, 8, STONE_D)
    prism(out, x, z, y + TUR_TOP, y + TUR_TOP + TUR_SPIRE, TUR_R * 0.8, 8, STONE_D, undefined, 0.05)
  }
}

function northRange(out: MeshBuilder, y: number): void {
  const [x0, x1, z0, z1] = N_RANGE
  block(out, x0, x1, z0, z1, y, y + N_H, STONE)
  block(out, x0 - 0.3, x1 + 0.3, z0, z1 + 0.3, y + N_H - 0.5, y + N_H, STONE_D)
  const yE = y + N_H, yR = yE + N_ROOF, zm = (z0 + z1) / 2
  quadN(out, [[x0, yE, z1 + 0.3], [x1, yE, z1 + 0.3], [x1, yR, zm], [x0, yR, zm]], [0, 1, 1], SLATE)
  quadN(out, [[x0, yE, z0], [x1, yE, z0], [x1, yR, zm], [x0, yR, zm]], [0, 1, -1], SLATE)
  for (const sx of [x0, x1]) quadN(out, [[sx, yE, z0], [sx, yE, z1], [sx, yR, zm], [sx, yR, zm]], [sx === x0 ? -1 : 1, 0, 0], STONE)
  for (let i = 0; i < 4; i++) {
    const t = x0 + 2 + i * ((x1 - x0 - 4) / 3)
    archOn(out, '+z', z1, t, y + 3, 1.8, 4.5, GLASS)
    archOn(out, '+z', z1, t, y + 12, 1.8, 5, GLASS)
  }
}

export function chapelleVincennes(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  nave(out, y)
  apse(out, y)
  westFront(out, y)
  northRange(out, y)
}
