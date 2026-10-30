import { MeshBuilder } from '../../../buildings.ts'
import { prism, strut, type Rgb } from '../../../models.ts'
import { block, hex, placed, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, palette, pts, rectOn, slab, type Pal } from './common.ts'
import { bandRound, EMIT, lettersOn, litOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM way 54901181's box turned to the boulevard (local −z faces bearing 13.7, the Boulevard Poissonnière) */
const HX = 28.45
const HZ = 21.05
const WHITE = hex('#efe9da')
const RED = hex('#b3262a')
const BLACK = hex('#202024')
const GOLD = hex('#c8a155')
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** Way 54901181 in the model's frame: the boulevard along −z, the Rue Poissonnière on −x (its slight bend straightened), the corner cut between them. */
const PLAN = pts([22.3, 21, -28.4, 13.1, -21.9, -18.6, -19.1, -21, 28.45, -21])

/**
 * Le Grand Rex (Auguste Bluysen and John Eberson, 1932), 1 Boulevard Poissonnière: the great Art Deco cinema of the
 * boulevards, white, on the corner of the Rue Poissonnière. What a rider coming down the boulevard sees is:
 *
 * - the CORNER TOWER, facing the crossing: three tall fluted window bays framed in red between piers, black poster panels
 *   each side, a stepped cap and on it the tiered round lantern, each tier with its buttresses, gold in its slots, the
 *   letters REX standing on top, in gold bulbs;
 * - to the right along the boulevard, the blank white wall with the huge red frame and the red letters R E X, and at
 *   its far end the vertical red blade and the Rex Club's box;
 * - to the left along the Rue Poissonnière, the wall stepping back with its short grid of windows;
 * - round the foot of all of it, the red-edged canopy, the black curved marquee in front of the tower with its lit bills.
 *
 * Plan is OSM's (way 54901181: there is no OSM height). Everything above the street from photographs from the crossing
 * (Commons, 2019–2026), scaled on the doors and against the neighbours: canopy 4–5 m, boulevard wall 21, tower cap 26,
 * lantern to 40, letters to 44. The ~44 m top is a reading of perspective, not a survey. Local −z the boulevard.
 */
export function grandRex(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#efe9da', '#60666a')
  const groundZ = -21
  // ---- the walls: PLAN to 21 m, flat roofs and the rear block with its windows
  walls(out, PLAN, 21, WHITE)
  slab(out, PLAN, 20.9, 21, hex('#a5a49d'))
  block(out, -24, 21, -4, 13.4, 21, 30, shade(WHITE, 0.98))
  for (let x = -22; x < 21; x += 3.2) {
    for (const y of [23.0, 26.4]) {
      rectOn(out, '-z', -4, x - 0.7, x + 0.7, y, y + 1.9, p.glass, 0.06)
    }
  }
  for (let z = -2; z < 12.5; z += 3.2) {
    for (const y of [23.0, 26.4]) rectOn(out, '+x', 21, z - 0.7, z + 0.7, y, y + 1.9, p.glass, 0.06)
  }
  block(out, -24.2, 21.2, -4.2, 13.6, 29.7, 30.3, p.trim)
  // the step along the boulevard's wall head
  block(out, -14, 26, -19, -4, 21, 23, shade(WHITE, 0.97))
  // ---- the boulevard wall: the frame and the great letters, the blade at the far end
  const wz = groundZ
  const fx0 = -5.5
  const fx1 = 21
  const fy0 = 6.4
  const fy1 = 18.8
  for (const [a, b, c, e] of [[fx0, fx1, fy0, fy0 + 0.35], [fx0, fx1, fy1 - 0.35, fy1], [fx0, fx0 + 0.35, fy0, fy1], [fx1 - 0.35, fx1, fy0, fy1]]) {
    litOn(out, '-z', wz, a, b, c, e, RED, 0.08)
  }
  lettersOn(out, '-z', wz, (fx0 + fx1) / 2, 8.2, 'REX', { h: 8.2, c: RED, wide: 0.72, th: 1.0, gap: 1.5, tag: EMIT, d: 0.1 })
  // the pale pier at the far end, the blade on it
  block(out, 23, 28.45, wz, -15, 0, 25, shade(WHITE, 0.97))
  block(out, 25.5, 26.4, wz - 1.5, wz, 9, 21, RED)
  for (const [ch, y] of [['R', 17.5], ['E', 14], ['X', 10.5]] as const) {
    lettersOn(out, '-z', wz - 1.5, 25.95, y, ch, { h: 2.6, c: WHITE, wide: 0.28, th: 0.2, tag: EMIT, d: 0.02 })
    lettersOn(out, '+x', 26.4, wz - 0.75, y, ch, { h: 2.6, c: WHITE, wide: 0.5, th: 0.28, tag: EMIT, d: 0.02 })
    lettersOn(out, '-x', 25.5, wz - 0.75, y, ch, { h: 2.6, c: WHITE, wide: 0.5, th: 0.28, tag: EMIT, d: 0.02 })
  }
  // ---- the Rue Poissonnière side: the wall's short grid of windows, the step back above
  sideWindows(out, p)
  // ---- the street storey and the canopy round everything
  streetFoot(out, p)
  // ---- the tower, drawn in its own frame facing the crossing
  const part = new MeshBuilder()
  tower(part, p)
  placed(out, part, TOWER_TURN, TOWER_X, TOWER_Z)
}

/** The tower faces the crossing: its local −z turned to the corner cut's outward normal. */
const TOWER_TURN = 0.707
const TOWER_X = -14.6
const TOWER_Z = -12.9

function walls(out: MeshBuilder, ring: { x: number; z: number }[], y: number, c: Rgb): void {
  let area = 0
  const n = ring.length
  for (let i = 0; i < n; i++) area += ring[i].x * ring[(i + 1) % n].z - ring[(i + 1) % n].x * ring[i].z
  const s = area > 0 ? 1 : -1
  for (let i = 0; i < n; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % n]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    out.quad([[a.x, 0, a.z], [b.x, 0, b.z], [b.x, y, b.z], [a.x, y, a.z]], [(b.z - a.z) / L * s, 0, -(b.x - a.x) / L * s], UV, c, FIXED)
  }
}

/** A point `t` metres along the Rue Poissonnière wall from the corner, `d` out from it, and the wall's outward normal. */
const SIDE_A = { x: -21.9, z: -18.6 }
const SIDE_B = { x: -28.4, z: 13.1 }
const SIDE_L = Math.hypot(SIDE_B.x - SIDE_A.x, SIDE_B.z - SIDE_A.z)
const SIDE_T: [number, number] = [(SIDE_B.x - SIDE_A.x) / SIDE_L, (SIDE_B.z - SIDE_A.z) / SIDE_L]
const SIDE_N: [number, number, number] = [-SIDE_T[1], 0, SIDE_T[0]]
function sideRect(out: MeshBuilder, t0: number, t1: number, y0: number, y1: number, c: Rgb, d = 0.06, tag = FIXED): void {
  const P = (t: number, y: number): [number, number, number] => [SIDE_A.x + SIDE_T[0] * t + SIDE_N[0] * d, y, SIDE_A.z + SIDE_T[1] * t + SIDE_N[2] * d]
  out.quad([P(t0, y0), P(t1, y0), P(t1, y1), P(t0, y1)], SIDE_N, UV, c, tag)
}

function sideWindows(out: MeshBuilder, p: Pal): void {
  for (let t = 11; t < SIDE_L - 1.5; t += 3.2) {
    for (const y of [12.5, 15.6, 18.4]) sideRect(out, t - 0.75, t + 0.75, y, y + 1.9, p.glass)
  }
  // the band between them and the street
  sideRect(out, 9, SIDE_L, 10.8, 11.2, shade(WHITE, 0.82), 0.04)
  // the pylon at the tower's side
  sideRect(out, 8.3, 9.3, 6, 20.8, shade(WHITE, 0.86), 0.08)
}

/** The street storey, its canopy, the Rex Club, the black marquee and its bills. */
function streetFoot(out: MeshBuilder, p: Pal): void {
  const wz = -21
  rectOn(out, '-z', wz, -18.8, 22.8, 0, 3.5, p.dark, 0.06)
  for (let x = -14; x < 22; x += 3.6) rectOn(out, '-z', wz, x - 0.14, x + 0.14, 0, 3.5, shade(WHITE, 0.72), 0.09)
  // the Rex Club
  block(out, 22.8, 28.45, wz - 0.5, wz, 2.7, 4.4, RED)
  lettersOn(out, '-z', wz - 0.5, 25.6, 3.15, 'REX CLUB', { h: 0.72, c: WHITE, wide: 0.6, th: 0.12, gap: 0.09, tag: EMIT, d: 0.02 })
  rectOn(out, '-z', wz, 23, 28.3, 0, 2.7, shade(p.dark, 1.2), 0.06)
  sideRect(out, 0, SIDE_L, 0, 3.5, p.dark, 0.06)
  for (let t = 10; t < SIDE_L; t += 3.6) sideRect(out, t - 0.14, t + 0.14, 0, 3.5, shade(WHITE, 0.72), 0.09)
  // the canopy along the boulevard: red-edged, its black soffit; along the Rue Poissonnière the same
  const yA = 3.8
  const yB = 4.75
  block(out, -14, 22.8, wz - 1.8, wz, yA, yB, BLACK)
  litOn(out, '-z', wz - 1.8, -14, 22.8, yB - 0.42, yB, RED, 0.03)
  block(out, -14, 22.8, wz - 1.82, wz, yB, yB + 0.1, RED)
  // along the side
  const S = (t: number, d: number, y: number): [number, number, number] => [SIDE_A.x + SIDE_T[0] * t + SIDE_N[0] * d, y, SIDE_A.z + SIDE_T[1] * t + SIDE_N[2] * d]
  out.quad([S(8, 1.8, yA), S(SIDE_L, 1.8, yA), S(SIDE_L, 1.8, yB), S(8, 1.8, yB)], SIDE_N, UV, BLACK, FIXED)
  out.quad([S(8, 1.85, yB - 0.42), S(SIDE_L, 1.85, yB - 0.42), S(SIDE_L, 1.85, yB), S(8, 1.85, yB)], SIDE_N, UV, RED, EMIT)
  out.quad([S(8, 0, yB), S(SIDE_L, 0, yB), S(SIDE_L, 1.85, yB), S(8, 1.85, yB)], [0, 1, 0], UV, RED, FIXED)
  out.quad([S(8, 0, yA), S(SIDE_L, 0, yA), S(SIDE_L, 1.85, yA), S(8, 1.85, yA)], [0, -1, 0], UV, shade(BLACK, 0.8), FIXED)
}

/**
 * The tower around its own origin, its front at z = −8 toward the crossing: the fluted bays between piers, the black poster
 * panels, the stepped cap; the tiered lantern on it; the letters.
 */
function tower(out: MeshBuilder, p: Pal): void {
  const W = 6.5
  const zF = -9.4
  const capY = 26
  // the front mass, standing proud of the walls behind, and its flanks
  block(out, -W, W, zF, 7, 0, capY, WHITE)
  block(out, -W - 0.5, W + 0.5, zF - 0.5, 7, capY - 1, capY, p.trim)
  block(out, -W + 1, W - 1, -6.5, 6, capY, capY + 1.4, shade(WHITE, 0.98))
  // the three tall bays: a red frame, a pale fluted screen with its gold fans, standing in the wall
  for (const x of [-3.3, 0, 3.3]) {
    litOn(out, '-z', zF, x - 1.25, x + 1.25, 6.2, 23.4, RED, 0.04)
    rectOn(out, '-z', zF, x - 1.0, x + 1.0, 6.5, 23.1, hex('#b6ab8f'), 0.07)
    for (let y = 7; y < 23; y += 0.75) {
      // a fan: bright and dark ribs alternately, gold after dark
      litOn(out, '-z', zF, x - 1.0, x + 1.0, y, y + 0.22, GOLD, 0.09)
    }
    for (const t of [-0.5, 0, 0.5]) rectOn(out, '-z', zF, x + t - 0.03, x + t + 0.03, 6.5, 23.1, shade(p.dark, 2), 0.11)
  }
  // the piers between them, standing out
  for (const x of [-4.95, -1.65, 1.65, 4.95]) block(out, x - 0.32, x + 0.32, zF - 0.45, zF, 5.4, 24.5, WHITE)
  // the black poster panels on the tower's flanks
  for (const s of [-1, 1]) {
    block(out, s * W - 0.85, s * W + 0.85, zF - 0.25, zF + 1.6, 6, 21, BLACK)
  }
  lettersOn(out, '-z', zF - 0.5, 0, 24.7, 'REX', { h: 0.95, c: shade(WHITE, 0.72), wide: 0.8, th: 0.15, gap: 0.35, d: 0.02 })
  // ---- the black curved marquee and its bills, in front of the bays
  const mz = zF
  const rx = 8.6
  const rz = 2.2
  const end = Math.PI / 2
  bandRound(out, 0, mz, rx, rz, -end, end, 3.5, 4.75, BLACK, { segs: 14 })
  bandRound(out, 0, mz, rx + 0.04, rz + 0.04, -end, end, 3.6, 4.1, hex('#d6e2ef'), { segs: 14, tag: EMIT })
  bandRound(out, 0, mz, rx + 0.08, rz + 0.08, -end, end, 4.4, 4.75, RED, { segs: 14, tag: EMIT })
  for (let i = 0; i < 12; i++) {
    const a0 = -end + ((i / 12) * Math.PI)
    const a1 = -end + (((i + 1) / 12) * Math.PI)
    const P = (a: number, y: number, rr: number): [number, number, number] => [Math.sin(a) * rx * rr, y, mz - Math.cos(a) * rz * rr]
    out.quad([P(a0, 4.75, 0), P(a0, 4.75, 1), P(a1, 4.75, 1), P(a1, 4.75, 0)], [0, 1, 0], UV, RED, FIXED)
    out.quad([P(a0, 3.5, 0), P(a0, 3.5, 1), P(a1, 3.5, 1), P(a1, 3.5, 0)], [0, -1, 0], UV, shade(BLACK, 0.8), FIXED)
  }
  rectOn(out, '-z', zF, -6.5, 6.5, 0, 3.4, p.dark, 0.05)
  for (const x of [-6, -3.5, -1.2, 1.2, 3.5, 6]) rectOn(out, '-z', zF, x - 0.18, x + 0.18, 0, 3.4, shade(WHITE, 0.72), 0.08)
  // ---- the lantern: three tiers on the cap, buttressed; rim; letters
  const y0 = capY + 1.4
  const tier = (y: number, h: number, r: number, r1: number, fins: number, finR: number): void => {
    prism(out, 0, 0, y, y + h, r, 16, WHITE, FIXED, r1, false)
    for (let k = 0; k < fins; k++) {
      const a = (k / fins) * Math.PI * 2
      const fx = Math.sin(a) * finR
      const fz = Math.cos(a) * finR
      prism(out, fx, fz, y, y + h - 0.3, 0.42, 6, WHITE, FIXED, 0.42)
      if (k % 2) {
        const gx = Math.sin(a + Math.PI / fins) * (r - 0.05)
        const gz = Math.cos(a + Math.PI / fins) * (r - 0.05)
        const tx = Math.cos(a + Math.PI / fins)
        const tz = -Math.sin(a + Math.PI / fins)
        const nx = Math.sin(a + Math.PI / fins)
        const nz = Math.cos(a + Math.PI / fins)
        out.quad([[gx - tx * 0.42 + nx * 0.03, y + 0.5, gz - tz * 0.42 + nz * 0.03], [gx + tx * 0.42 + nx * 0.03, y + 0.5, gz + tz * 0.42 + nz * 0.03],
          [gx + tx * 0.42 + nx * 0.03, y + h - 0.7, gz + tz * 0.42 + nz * 0.03], [gx - tx * 0.42 + nx * 0.03, y + h - 0.7, gz - tz * 0.42 + nz * 0.03]], [nx, 0, nz], UV, GOLD, EMIT)
      }
    }
    prism(out, 0, 0, y + h - 0.15, y + h + 0.15, r + 0.45, 16, shade(WHITE, 1.02), FIXED, r1 + 0.45)
  }
  tier(y0, 3.6, 5.2, 5.0, 12, 5.05)
  tier(y0 + 3.75, 3.6, 3.9, 3.7, 10, 3.75)
  tier(y0 + 7.5, 2.6, 2.9, 2.7, 8, 2.75)
  prism(out, 0, 0, y0 + 10.25, y0 + 10.9, 2.95, 16, shade(WHITE, 0.96), FIXED, 2.3)
  // the letters on their iron frame: gold, lit, on the front and back to the boulevard
  const yL = y0 + 11
  for (const x of [-2.3, -0.8, 0.8, 2.3]) strut(out, [x, yL, -0.6], [x, yL + 3.2, -0.6], 0.07, 0.07, p.dark, FIXED, false)
  strut(out, [-2.6, yL + 0.2, -0.6], [2.6, yL + 0.2, -0.6], 0.07, 0.07, p.dark, FIXED, false)
  lettersOn(out, '-z', -0.6, 0, yL + 0.1, 'REX', { h: 3.3, c: GOLD, wide: 0.72, th: 0.46, gap: 0.42, tag: EMIT, d: 0.08, both: true })
}
