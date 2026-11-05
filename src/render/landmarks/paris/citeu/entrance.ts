/**
 * THE CITÉ UNIVERSITAIRE'S MAIN ENTRANCE, 17 boulevard Jourdan (Lucien Bechmann, 1925): a single-storey pale stone
 * arcade of round arches on square piers, a frieze lettered CITÉ INTERNATIONALE UNIVERSITAIRE DE PARIS, a flat top
 * with three flagpoles, a broad flight of low steps and a wrought-iron railing with gates at its foot. It spans the
 * gap between the Pavillon Appell (west) and the Pavillon Pierre et Marie Curie (east) of the Fondation Deutsch de la
 * Meurthe. OSM: the arcade is way/260177837 (building=roof, 15 × 3 m); before it had a builder it drew as a thin
 * cadastre roof slab, and Appell (way/260177830) as a generic flat box, so from the boulevard only the two narrow
 * gable ends of Appell and Curie read, with nothing between (owner, 2026-11-05).
 * Ref: owner's Street View photo (2026-11-05).
 * Local frame as the other Deutsch houses: x along bearing 108, −z toward bearing 198 (the boulevard), origin the
 * OSM outline's vertex mean.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import type { Rgb } from '../../kit.ts'
import { hex, roof } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { railing } from '../../parts.ts'
import { sign } from '../../signage.ts'
import { BRICK, SLATE, STONE, EAVES, range, windowAt, type Box, type Face } from './fondation-deutsch.ts'

// ── the arcade (way/260177837) ──
const A_X = 7.4, A_Z = 1.5                  // half-length, half-depth
const N_ARCH = 7, PIER = 0.9, PIER_D = 0.9   // arches across; square piers, front and back rows
const SPRING = 2.6, FRIEZE = 3.9, FRIEZE_H = 0.85, CORNICE = 0.3, PARAPET = 0.35
const ARCH_SEG = 12                         // slices per arch head
const VOLT = 0.13, VOLT_D = 0.05, KEY_W = 0.22, KEY_H = 0.22   // archivolt band, keystone
const STEPS = 5, RISE = 0.14, TREAD = 0.42, STEP_OVER = 0.6
const RAIL_H = 1.6, POST_W = 0.55, POST_H = 1.9, GATE_W = 3.2
const POLE_H = 6.5, POLE_W = 0.09, POLES = [-4.6, 0, 4.6]
const FLAG_W = 1.3, FLAG_H = 0.85
const FLAGS: Rgb[][] = [[hex('#20409a'), hex('#f2f2f2'), hex('#d8262f')], [hex('#1f5fbf'), hex('#f2f2f2'), hex('#1f5fbf')], [hex('#20409a'), hex('#f2f2f2'), hex('#d8262f')]]
const LETTERS = 'CITÉ INTERNATIONALE UNIVERSITAIRE DE PARIS', LETTER_H = 0.36
const IRON: Rgb = hex('#24262a'), CEIL: Rgb = hex('#bdb39e'), VOLT_C: Rgb = hex('#efe8d6')

export function citeUEntrance(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0, y = g + STEPS * RISE          // arcade floor, on the top step
  const top = y + FRIEZE + FRIEZE_H
  block(out, -A_X, A_X, -A_Z, A_Z, g, y, STONE)          // podium
  for (let i = 0; i < STEPS; i++) {                       // the flight, wider than the arcade
    const z0 = -A_Z - (STEPS - i) * TREAD
    block(out, -A_X - STEP_OVER, A_X + STEP_OVER, z0, -A_Z, g, g + (i + 1) * RISE, STONE)
  }
  const bay = (2 * A_X - PIER) / N_ARCH, open = bay - PIER, r = open / 2, crown = y + SPRING + r
  const rows: [number, number][] = [[-A_Z, -A_Z + PIER_D], [A_Z - PIER_D, A_Z]]   // front and back arcades
  for (const [z0, z1] of rows) {
    for (let i = 0; i <= N_ARCH; i++) {                   // square piers
      const x = -A_X + i * bay
      block(out, x, x + PIER, z0, z1, y, crown, STONE)
    }
    for (let i = 0; i < N_ARCH; i++) {                    // semicircular heads: thin slices down to the intrados
      const x0 = -A_X + PIER + i * bay, cx = x0 + r
      for (let k = 0; k < ARCH_SEG; k++) {
        const xa = x0 + (k / ARCH_SEG) * open, xb = x0 + ((k + 1) / ARCH_SEG) * open
        const edge = Math.max(Math.abs(xa - cx), Math.abs(xb - cx))
        block(out, xa, xb, z0, z1, y + SPRING + Math.sqrt(Math.max(0, r * r - edge * edge)), crown, STONE)
      }
      const zf = z0 < 0 ? z0 - VOLT_D : z1, zb = z0 < 0 ? z0 : z1 + VOLT_D
      for (let k = 0; k <= ARCH_SEG; k++) {               // a thin archivolt round the head, and its keystone
        const t = Math.PI * (k / ARCH_SEG), px = cx - Math.cos(t) * (r + VOLT / 2), py = y + SPRING + Math.sin(t) * (r + VOLT / 2)
        block(out, px - VOLT / 2, px + VOLT / 2, zf, zb, py - VOLT / 2, py + VOLT / 2, VOLT_C)
      }
      block(out, cx - KEY_W / 2, cx + KEY_W / 2, zf - 0.03, zb + 0.03, crown - 0.1, crown + KEY_H, VOLT_C)
    }
  }
  block(out, -A_X, A_X, -A_Z, A_Z, crown, y + FRIEZE, STONE)
  block(out, -A_X, A_X, -A_Z + 0.1, A_Z - 0.1, crown - 0.02, crown, CEIL)
  block(out, -A_X - 0.05, A_X + 0.05, -A_Z - 0.05, A_Z + 0.05, y + FRIEZE, top, STONE)          // frieze
  block(out, -A_X - 0.25, A_X + 0.25, -A_Z - 0.25, A_Z + 0.25, top, top + CORNICE, STONE)       // cornice
  block(out, -A_X, A_X, -A_Z, A_Z, top + CORNICE, top + CORNICE + PARAPET, STONE)               // flat top
  sign(out, { type: 'flat', text: LETTERS, h: LETTER_H, w: 2 * A_X - 0.6, face: 'engraved', colour: [0.2, 0.19, 0.18], lit: 'none', standoff: 0.1 },
    { x: 0, y: y + FRIEZE + FRIEZE_H / 2, z: -A_Z - 0.05, heading: Math.PI })
  const yt = top + CORNICE + PARAPET
  POLES.forEach((px, i) => {                              // three flagpoles, a flag on each
    block(out, px - POLE_W, px + POLE_W, -POLE_W, POLE_W, yt, yt + POLE_H, hex('#d9d9d9'))
    const c = FLAGS[i % FLAGS.length], fy = yt + POLE_H - 0.1 - FLAG_H
    for (let s = 0; s < 3; s++) block(out, px + POLE_W + s * FLAG_W / 3, px + POLE_W + (s + 1) * FLAG_W / 3, -0.02, 0.02, fy, fy + FLAG_H, c[s])
  })
  // the railing at the foot of the steps: stone posts, iron between, a pair of gates in the middle
  const zr = -A_Z - STEPS * TREAD - 0.4, xe = A_X + STEP_OVER
  for (const px of [-xe, -GATE_W / 2 - POST_W, GATE_W / 2, xe - POST_W]) block(out, px, px + POST_W, zr - POST_W / 2, zr + POST_W / 2, g, g + POST_H, STONE)
  railing(out, [{ x: -xe + POST_W, z: zr }, { x: -GATE_W / 2 - POST_W, z: zr }], g, { height: RAIL_H, colour: IRON })
  railing(out, [{ x: GATE_W / 2 + POST_W, z: zr }, { x: xe - POST_W, z: zr }], g, { height: RAIL_H, colour: IRON })
  railing(out, [{ x: -GATE_W / 2, z: zr }, { x: GATE_W / 2, z: zr }], g, { height: RAIL_H + 0.3, colour: IRON })
}

// ── the Pavillon Appell (way/260177830): an L, the main range N–S with its end on the boulevard, a wing east to the arcade ──
const AP_MAIN: Box = [-8.1, 2.8, -16.6, 9.1]               // ridge along z
const AP_WING: Box = [2.8, 9.3, 1.0, 9.0]                  // ridge along x, meets the arcade
const AP_DORMERS: [number, number][] = [[-8.1, -13], [-8.1, -2], [2.8, -12], [2.8, -5]]
const AP_CHIMNEYS: [number, number][] = [[-2.6, -12], [-2.6, 6], [7.5, 5]]
const CHIMNEY_H = 8.6, DORMER_W = 1.7, DORMER_H = 1.8
const AP_STONE: Rgb = hex('#e6dcc6'), RED: Rgb = hex('#7a3529'), SURROUND = 0.16, QUOIN = 0.55, QUOIN_H = 0.45
const MANSARD_H = 4.2, MANSARD_IN = 1.6, MANSARD_TOP = 2.2   // steep lower slope, then a low hip

export function pavillonAppell(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  for (const [b, rx, skip] of [[AP_MAIN, false, []], [AP_WING, true, ['-x']]] as [Box, boolean, Face[]][]) {
    range(out, y, b, rx, skip, EAVES, 0.01, AP_STONE, RED, SURROUND)
    mansard(out, y + EAVES, b)
    quoins(out, y, b)
  }
  for (const [x, z] of AP_DORMERS) {
    const s = x < 0 ? -1 : 1, n0 = x - s * 1.6, n1 = x - s * 0.5
    const lo = Math.min(n0, n1), hi = Math.max(n0, n1), yd = y + EAVES + 0.3, hw = DORMER_W / 2
    block(out, lo, hi, z - hw, z + hw, yd, yd + DORMER_H, SLATE)
    roof(out, lo - 0.1, hi + 0.1, z - hw - 0.15, z + hw + 0.15, yd + DORMER_H, 1.2, 0, hw + 0.15, SLATE)
    windowAt(out, s < 0 ? '-x' : '+x', n1, z, yd + 0.3, 1.0, 1.1)
  }
  for (const [cx, cz] of AP_CHIMNEYS) block(out, cx - 0.6, cx + 0.6, cz - 0.4, cz + 0.4, y + EAVES, y + EAVES + CHIMNEY_H, BRICK)
}

/** red-brick quoins up every corner, alternating long and short */
function quoins(out: MeshBuilder, y: number, [x0, x1, z0, z1]: Box): void {
  for (const [cx, cz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
    for (let k = 0, yy = y + 0.8; yy + QUOIN_H < y + EAVES - 0.3; k++, yy += QUOIN_H * 2) {
      const lx = k % 2 ? QUOIN : QUOIN * 0.6, lz = k % 2 ? QUOIN * 0.6 : QUOIN
      const sx = cx === x0 ? 1 : -1, sz = cz === z0 ? 1 : -1
      block(out, Math.min(cx - sx * 0.04, cx + sx * lx), Math.max(cx - sx * 0.04, cx + sx * lx),
        Math.min(cz - sz * 0.04, cz + sz * lz), Math.max(cz - sz * 0.04, cz + sz * lz), yy, yy + QUOIN_H, RED)
    }
  }
}

/** a slate mansard: a steep truncated hip, then a low hipped top */
function mansard(out: MeshBuilder, y0: number, [x0, x1, z0, z1]: Box): void {
  const i = MANSARD_IN, o = 0.3
  roof(out, x0 - o, x1 + o, z0 - o, z1 + o, y0, MANSARD_H, i, i, SLATE)       // steep lower slope, flat-topped
  const yt = y0 + MANSARD_H, hx = (x1 - x0) / 2 - i, hz = (z1 - z0) / 2 - i
  roof(out, x0 + i, x1 - i, z0 + i, z1 - i, yt, MANSARD_TOP, hx > hz ? hz : 0, hx > hz ? 0 : hx, SLATE)
}
