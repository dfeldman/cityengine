import { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, placed, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { walls, type P2 } from '../common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE MONUMENT A ADOLPHE ALPHAND (avenue Foch, Paris 16e, north lawn; Jules Dalou 1899, white marble): a shallow concave
 * wall (an exedra open to the avenue) between two tall end piers with scrolled feet, carved with workmen in low relief,
 * and in its middle a stepped pedestal bearing the standing figure of Alphand; two groups of his collaborators lean on
 * the pedestal's ledge. Procedural here: the steps, wall, piers, pedestal, inscription, arms and the relief panels (as
 * recessed fields). The figure and the two groups are Modly pieces (alphand-figure, alphand-left, alphand-right), attached
 * in paris-statues.json at FIGURE_AT / LEFT_AT / RIGHT_AT. Frame: −z the open front (toward the avenue), x across, y up
 * from the ground (G). Dimensions are scaled off Commons photos (Monument Alphand (2).jpg), not surveyed.
 */
export const HX = 6.0
export const HZ = 3.6

// tunables (metres)
const R_IN = 8.0, WALL_T = 0.5, WALL_H = 2.1, HALF_CHORD = 4.35, WALL_Z = 0.9   // wall's concave face radius, thickness, height, pier centre offset, face z behind the pedestal axis
const PLINTH_H = 0.5, PANEL_Y0 = 0.7, COPE_H = 0.25
const PIER_W = 0.72, PIER_H = 2.55, PIER_FOOT = 1.15, PIER_FOOT_H = 0.55
const STEP1_H = 0.17, STEP2_H = 0.17
const PED_Z = 0.8                                          // pedestal half-depth
export const FIGURE_AT: [number, number, number] = [0.08, G + STEP1_H + STEP2_H + 2.55, 0]
export const LEFT_AT: [number, number, number] = [-0.95, G + STEP1_H + STEP2_H + 0.95, -0.05]
export const RIGHT_AT: [number, number, number] = [0.98, G + STEP1_H + STEP2_H + 0.95, -0.05]

const STONE: Rgb = hex('#d9d6cb')
const DARK: Rgb = shade(STONE, 0.8)
const FIELD: Rgb = shade(STONE, 0.9)
const FIG: Rgb = shade(STONE, 1.03)

const thetaM = Math.asin(HALF_CHORD / (R_IN + WALL_T / 2))
const arcZ = (r: number, th: number): number => WALL_Z - R_IN + r * Math.cos(th)
const arcX = (r: number, th: number): number => r * Math.sin(th)

/** One wall layer between radii r0..r1 over angles a..b, y0..y1 (a thin arc slab). */
function arcSlab(q: MeshBuilder, r0: number, r1: number, a: number, b: number, y0: number, y1: number, c: Rgb): void {
  const n = Math.max(2, Math.ceil(Math.abs(b - a) / 0.07))
  const plan: P2[] = []
  for (let i = 0; i <= n; i++) { const t = a + ((b - a) * i) / n; plan.push({ x: arcX(r1, t), z: arcZ(r1, t) }) }
  for (let i = n; i >= 0; i--) { const t = a + ((b - a) * i) / n; plan.push({ x: arcX(r0, t), z: arcZ(r0, t) }) }
  walls(q, plan, y0, y1, c, shade(c, 1.05))
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // two steps under everything
  block(q, -5.5, 5.5, -2.2, 2.4, y(0), y(STEP1_H), shade(STONE, 0.88))
  block(q, -5.2, 5.2, -1.6, 2.2, y(STEP1_H), y(STEP1_H + STEP2_H), shade(STONE, 0.92))
  const f = y(STEP1_H + STEP2_H) // the floor the wall and piers stand on
  // the wall: plinth, relief band (recessed field), cornice
  const rm = R_IN + WALL_T / 2, a0 = -thetaM, a1 = thetaM
  arcSlab(q, R_IN, R_IN + WALL_T, a0, a1, f, f + PLINTH_H, STONE)
  arcSlab(q, R_IN + 0.02, R_IN + WALL_T, a0, a1, f + PLINTH_H, f + WALL_H - COPE_H, FIELD)
  arcSlab(q, R_IN - 0.06, R_IN + WALL_T + 0.04, a0, a1, f + WALL_H - COPE_H, f + WALL_H, STONE)
  // the relief figures: rows of low standing workmen on either side of the pedestal, as thin pale blades
  for (const side of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const x = side * (1.55 + k * 0.38)
      const th = Math.asin(x / R_IN) * 1
      const h = 0.7 + 0.22 * ((k * 5) % 3) / 2
      const z = arcZ(R_IN, th)
      block(q, x - 0.09, x + 0.09, z - 0.12, z, f + PANEL_Y0 + 0.1, f + PANEL_Y0 + 0.1 + h, FIG)
    }
  }
  // the end piers: footing, shaft, cap with a carved boss and a drop below it
  for (const side of [-1, 1]) {
    const part = new MeshBuilder()
    const x0 = 0, z0 = 0
    block(part, x0 - PIER_FOOT / 2, x0 + PIER_FOOT / 2, z0 - PIER_FOOT / 2 - 0.05, z0 + PIER_FOOT / 2 + 0.05, 0, PIER_FOOT_H, shade(STONE, 0.94))
    block(part, x0 - PIER_W / 2, x0 + PIER_W / 2, z0 - PIER_W / 2, z0 + PIER_W / 2, PIER_FOOT_H, PIER_H - 0.35, STONE)
    block(part, x0 - PIER_W / 2 - 0.08, x0 + PIER_W / 2 + 0.08, z0 - PIER_W / 2 - 0.08, z0 + PIER_W / 2 + 0.08, PIER_H - 0.35, PIER_H - 0.1, shade(STONE, 1.03))
    block(part, x0 - PIER_W / 2 - 0.02, x0 + PIER_W / 2 + 0.02, z0 - PIER_W / 2 - 0.02, z0 + PIER_W / 2 + 0.02, PIER_H - 0.1, PIER_H, shade(STONE, 0.95))
    // carved boss and drop on the inner face
    block(part, x0 - 0.2, x0 + 0.2, z0 - PIER_W / 2 - 0.13, z0 - PIER_W / 2, PIER_H - 0.78, PIER_H - 0.4, DARK)
    block(part, x0 - 0.05, x0 + 0.05, z0 - PIER_W / 2 - 0.1, z0 - PIER_W / 2, PIER_H - 1.5, PIER_H - 0.78, DARK)
    // the scroll foot on the outer side
    block(part, x0 + side * (PIER_FOOT / 2 + 0.05), x0 + side * (PIER_FOOT / 2 + 0.75), z0 - 0.3, z0 + 0.3, 0, 0.32, shade(STONE, 0.9))
    block(part, x0 + side * (PIER_FOOT / 2 + 0.05), x0 + side * (PIER_FOOT / 2 + 0.3), z0 - 0.3, z0 + 0.3, 0.32, 0.62, shade(STONE, 1.0))
    placed(q, part, -side * thetaM * 0, arcX(rm, side * thetaM), arcZ(rm, side * thetaM))
  }
  // the pedestal: two tiers, die with the inscription, cornice and a top block
  // STAND-IN for the right-hand group (Modly alphand-right failed three times: a cut-out slab): a standing man in a frock coat
  // bending over a spread plan, and a second head behind him. Blocks only, on the tier-two ledge.
  {
    const rx = RIGHT_AT[0], ry = RIGHT_AT[1] - G, rz = RIGHT_AT[2]
    const c = shade(STONE, 0.97)
    block(q, rx - 0.22, rx + 0.02, rz - 0.14, rz + 0.12, y(ry), y(ry + 0.85), shade(c, 0.9))      // legs
    block(q, rx - 0.26, rx + 0.08, rz - 0.18, rz + 0.16, y(ry + 0.85), y(ry + 1.35), c)             // coat
    block(q, rx - 0.2, rx + 0.12, rz - 0.3, rz + 0.1, y(ry + 1.3), y(ry + 1.6), c)                  // shoulders and bent back
    block(q, rx - 0.14, rx + 0.1, rz - 0.4, rz - 0.18, y(ry + 1.45), y(ry + 1.75), c)               // head
    block(q, rx - 0.4, rx - 0.05, rz - 0.55, rz - 0.15, y(ry + 1.12), y(ry + 1.17), shade(c, 1.05)) // the plan
    block(q, rx + 0.2, rx + 0.42, rz + 0.05, rz + 0.3, y(ry), y(ry + 1.45), shade(c, 0.88))         // second figure behind
    block(q, rx + 0.24, rx + 0.4, rz + 0.07, rz + 0.25, y(ry + 1.45), y(ry + 1.72), shade(c, 0.95))
  }
  const px = (hw: number, y0: number, y1: number, c: Rgb, hz = PED_Z): void => block(q, -hw, hw, -hz, hz, f + y0, f + y1, c)
  px(1.25, 0, 0.4, shade(STONE, 0.95), 0.95)
  px(1.1, 0.4, 0.95, STONE, 0.85)
  px(0.72, 0.95, 2.2, STONE)
  px(0.8, 2.2, 2.45, shade(STONE, 1.04), PED_Z + 0.08)
  px(0.55, 2.45, 2.55, STONE, 0.6)
  plaque(q, { x: 0, z: -PED_Z - 0.0, y0: f + 1.35, w: 0.9, h: 0.65, panel: shade(STONE, 1.03), letters: shade(STONE, 0.45), lines: [0.55, 0.45, 0.8, 0.0, 0.65, 0.5] })
  // the city's arms: a shield with a wreath on the lower tier's face
  block(q, -0.2, 0.2, -0.85 - 0.12, -0.85, f + 0.45, f + 0.85, DARK)
  block(q, -0.45, -0.2, -0.85 - 0.07, -0.85, f + 0.5, f + 0.8, shade(STONE, 0.86))
  block(q, 0.2, 0.45, -0.85 - 0.07, -0.85, f + 0.5, f + 0.8, shade(STONE, 0.86))
}

export function monumentAlphand(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
