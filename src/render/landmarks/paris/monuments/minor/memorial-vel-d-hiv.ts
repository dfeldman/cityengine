import { MeshBuilder, capPolygonWithHoles } from '../../../../buildings.ts'
import { block, hex, shade } from '../../../kit.ts'
import { boxAlong, edgeAt } from '../../../parts.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { ccw, walls, type P2 } from '../common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * THE VÉL' D'HIV' MEMORIALS (Paris 15e, by the Bir-Hakeim viaduct), two builders in this file:
 *  - jardinMemorialVelDHiv: the Jardin mémorial des enfants du Vél' d'Hiv' (Q39075133; 7 rue Nélaton; Mutabilis Paysage,
 *    opened 16 July 2017; 120 m2). A pentagonal gravel court off the rue Nélaton, closed along the street by a dark
 *    perforated steel screen with an entry gap; a concave limestone wall (the names and ages of the 4,115 deported
 *    children) on the south-west side; a trellis with white climbers and ~20 photographs of children on the other two;
 *    rough pale stone blocks (the pebbles laid on Jewish graves) in a row and scattered; grey bands in the gravel
 *    concentric with the wall. Plan from OSM (park way 767547602, wall way 767547603); wall height, the screen and
 *    the block sizes are scaled by eye off Commons photos. Frame: the wall's front faces −z, x along the wall, origin
 *    at the plan's bounding-box centre.
 *  - monumentVelDHiv: Walter Spitzer's monument of 1994 (architect Mario Azagury; inaugurated 17 July 1994), in the
 *    place des Martyrs-Juifs-du-Vélodrome-d'Hiver on the quai de Grenelle ~100 m west: three granite steps, a tapering
 *    walkway, an inscribed granite pedestal and a concave stone slab (the velodrome's banked curve) bearing the bronze
 *    group (Modly `vel-dhiv-spitzer-groupe`, attached in paris-statues.json at SPITZER_GROUP_AT). Front −z.
 */
export const GARDEN_HX = 9.8
export const GARDEN_HZ = 9.1
export const SPITZER_HX = 4.3
export const SPITZER_HZ = 6.0

// ---- garden tunables (metres) ----
const ORG = { x: -1.015, z: -5.94 }                       // plan bbox centre in the wall frame
const PLAN: [number, number][] = [[8.75, 1.88], [7.66, -7.97], [6.88, -15.0], [-10.78, -13.75], [-8.91, 3.12]]
const WALL_R = 15.3, WALL_HALF = 6.4, WALL_T = 0.4, WALL_H = 2.3, WALL_SEGS = 10   // arc radius, half chord, thickness, height
const NAME_ROWS: [number, number] = [0.45, 2.05], NAME_PITCH = 0.1                  // engraved rows y-range and spacing
const BAND_R = [6.4, 9.4, 12.4], BAND_PHI = 0.55, BAND_W = 0.3                      // gravel bands: radii (from the wall), half-angle, width
const SCREEN_H = 1.9, GATE_AT = 0.5, GATE_W = 1.6                                   // street screen: height; gate along edge 1 (fraction), width
const TRELLIS_H = 2.5, POST_PITCH = 2.0, BED_H = 0.25, PHOTOS = 20
const STONES = 7

const LIME = hex('#d9cfba'), LIME_DARK = hex('#c4b9a1'), GRAVEL = hex('#cdbd9c'), BAND = hex('#8a8780')
const STEEL = hex('#2b2d2e'), LEAF_A = hex('#5d7a45'), LEAF_B = hex('#7a9658'), LEAF_C = hex('#4a6a3a'), BED = hex('#6f5f4a')

const rnd = (i: number): number => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
const sh = (p: P2): P2 => ({ x: p.x - ORG.x, z: p.z - ORG.z })

function drawGarden(q: MeshBuilder): void {
  const plan = ccw(PLAN.map(([x, z]) => sh({ x, z })))
  capPolygonWithHoles(q, [plan], G + 0.03, GRAVEL, 0)
  walls(q, plan, G, G + 0.03, shade(GRAVEL, 0.85))
  // kerb along the plan
  for (let i = 0; i < plan.length; i++) {
    const e = edgeAt(plan, i)
    boxAlong(q, e.mid.x - e.nx * 0.08, G + 0.07, e.mid.z - e.nz * 0.08, e.L / 2, 0.07, 0.08, e.heading, shade(LIME, 0.8))
  }

  // the wall: a concave arc (centre of curvature in front, at z = −R), names in rows
  const cz = -WALL_R - ORG.z, cx = -ORG.x
  const phi0 = Math.asin(WALL_HALF / WALL_R)
  for (let s = 0; s < WALL_SEGS; s++) {
    const f = (s + 0.5) / WALL_SEGS
    const ph = -phi0 + 2 * phi0 * f
    const segL = (2 * phi0 * WALL_R) / WALL_SEGS
    const rm = WALL_R + WALL_T / 2
    const x = cx + rm * Math.sin(ph), z = cz + rm * Math.cos(ph)
    const heading = Math.atan2(-Math.sin(ph), -Math.cos(ph))
    boxAlong(q, x, G + WALL_H / 2, z, segL / 2 + 0.01, WALL_H / 2, WALL_T / 2, heading, s % 2 ? LIME : shade(LIME, 0.97))
    boxAlong(q, x, G + WALL_H + 0.04, z, segL / 2 + 0.03, 0.04, WALL_T / 2 + 0.04, heading, LIME_DARK)       // coping
    // engraved rows on the front face (the face is at radius WALL_R, look 0.01 proud)
    const rf = WALL_R - 0.012
    const xf = cx + rf * Math.sin(ph), zf = cz + rf * Math.cos(ph)
    for (let y = NAME_ROWS[0], k = 0; y < NAME_ROWS[1]; y += NAME_PITCH, k++) {
      const len = segL * (0.8 - 0.1 * rnd(s * 41 + k))
      boxAlong(q, xf, G + y, zf, len / 2, 0.012, 0.012, heading, shade(LIME, 0.55))
    }
    // joint at the segment's start
    const pj = -phi0 + 2 * phi0 * (s / WALL_SEGS)
    boxAlong(q, cx + rf * Math.sin(pj), G + WALL_H / 2, cz + rf * Math.cos(pj), 0.012, WALL_H / 2, 0.012, heading, shade(LIME, 0.7))
  }
  // the title line along the top (a band of lettering)
  for (let s = 0; s < WALL_SEGS; s++) {
    const ph = -phi0 + 2 * phi0 * ((s + 0.5) / WALL_SEGS)
    const rf = WALL_R - 0.015
    boxAlong(q, cx + rf * Math.sin(ph), G + WALL_H - 0.15, cz + rf * Math.cos(ph), (2 * phi0 * WALL_R) / WALL_SEGS * 0.4, 0.04, 0.012,
      Math.atan2(-Math.sin(ph), -Math.cos(ph)), shade(LIME, 0.45))
  }

  // grey bands in the gravel, concentric with the wall
  BAND_R.forEach((r, bi) => {
    const n = 14
    for (let i = 0; i < n; i++) {
      if (rnd(bi * 31 + i) < 0.18) continue
      const ph = -BAND_PHI + (2 * BAND_PHI * (i + 0.5)) / n
      const rr = WALL_R - r
      boxAlong(q, cx + rr * Math.sin(ph), G + 0.045, cz + rr * Math.cos(ph), (BAND_PHI * rr) / n, 0.02, BAND_W / 2,
        Math.atan2(-Math.sin(ph), -Math.cos(ph)), shade(BAND, 0.9 + 0.2 * rnd(bi * 7 + i)))
    }
  })

  // the street screen (edge v0→v1→v2 of PLAN, the rue Nélaton side) with the entry gap
  const street = [sh({ x: PLAN[0][0], z: PLAN[0][1] }), sh({ x: PLAN[1][0], z: PLAN[1][1] }), sh({ x: PLAN[2][0], z: PLAN[2][1] })]
  for (let i = 0; i < 2; i++) {
    const a = street[i], b = street[i + 1]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
    const hd = Math.atan2(tz, -tx)
    const gap = i === 1 ? [L * GATE_AT - GATE_W / 2, L * GATE_AT + GATE_W / 2] : [L + 1, L + 1]
    for (const [t0, t1] of [[0, Math.min(gap[0], L)], [Math.min(gap[1], L), L]]) {
      if (t1 - t0 < 0.05) continue
      const m = (t0 + t1) / 2
      boxAlong(q, a.x + tx * m, G + SCREEN_H / 2, a.z + tz * m, (t1 - t0) / 2, SCREEN_H / 2, 0.03, hd, STEEL)
    }
    // gate posts
    if (i === 1) for (const t of gap) boxAlong(q, a.x + tx * t, G + SCREEN_H / 2 + 0.1, a.z + tz * t, 0.07, SCREEN_H / 2 + 0.1, 0.07, hd, shade(STEEL, 1.2))
  }

  // trellis with climbers along the far edge (v2→v3) and the south-east edge (v3→v4)
  const tr = [sh({ x: PLAN[2][0], z: PLAN[2][1] }), sh({ x: PLAN[3][0], z: PLAN[3][1] }), sh({ x: PLAN[4][0], z: PLAN[4][1] })]
  let pc = 0
  for (let i = 0; i < 2; i++) {
    const a = tr[i], b = tr[i + 1]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
    const nx = -tz, nz = tx                                  // either side: used only to push the photos in
    const inward = ((-ORG.x - a.x) * nx + (-ORG.z - a.z) * nz) > 0 ? 1 : -1
    const hd = Math.atan2(tz, -tx)
    boxAlong(q, a.x + tx * L / 2, G + BED_H / 2, a.z + tz * L / 2, L / 2, BED_H / 2, 0.35, hd, BED)
    boxAlong(q, a.x + tx * L / 2, G + TRELLIS_H, a.z + tz * L / 2, L / 2, 0.03, 0.04, hd, STEEL)
    boxAlong(q, a.x + tx * L / 2, G + TRELLIS_H * 0.55, a.z + tz * L / 2, L / 2, 0.015, 0.03, hd, STEEL)
    for (let t = 0; t <= L + 0.01; t += POST_PITCH) boxAlong(q, a.x + tx * t, G + TRELLIS_H / 2, a.z + tz * t, 0.04, TRELLIS_H / 2, 0.04, hd, STEEL)
    for (let t = 0.5, k = 0; t < L - 0.4; t += 0.75 + 0.5 * rnd(i * 9 + k), k++) {
      const w = 0.7 + 0.5 * rnd(k + i * 17), hgt = 1.1 + 1.1 * rnd(k * 3 + i)
      const c = [LEAF_A, LEAF_B, LEAF_C][Math.floor(rnd(k * 5 + i) * 3)]
      boxAlong(q, a.x + tx * t, G + BED_H + hgt / 2, a.z + tz * t, w / 2, hgt / 2, 0.22, hd, c)
      if (rnd(k * 11 + i) > 0.55) boxAlong(q, a.x + tx * t + 0.1, G + BED_H + hgt + 0.1, a.z + tz * t, w * 0.28, 0.14, 0.12, hd, [0.93, 0.94, 0.9])  // white blossom
    }
    for (let k = 0; k < PHOTOS / 2 && pc < PHOTOS; k++, pc++) {
      const t = 0.8 + (L - 1.6) * ((k + 0.5 * rnd(k)) / (PHOTOS / 2)), hy = 1.2 + 0.9 * rnd(k * 13 + i)
      const tone = 0.62 + 0.3 * rnd(k * 19 + i)
      boxAlong(q, a.x + tx * t - nx * inward * 0.2, G + hy, a.z + tz * t - nz * inward * 0.2, 0.15, 0.2, 0.012, hd, [tone, tone * 0.97, tone * 0.9])
    }
  }

  // the pale stone blocks: a row down the south-east side, a few scattered
  for (let i = 0; i < STONES; i++) {
    const x = -7.6 - ORG.x + 0.12 * (rnd(i) - 0.5), z = -3.0 - 1.45 * i - ORG.z
    const w = 0.5 + 0.2 * rnd(i + 3), h = 0.32 + 0.22 * rnd(i + 9)
    boxAlong(q, x, G + h / 2, z, w / 2, h / 2, w / 2 * 0.9, 0.3 * (rnd(i + 5) - 0.5), shade(LIME, 1.04 - 0.06 * rnd(i + 2)))
  }
  const scat: [number, number, number][] = [[1.0, -9.5, 0.26], [3.5, -11.0, 0.2], [-2.0, -12.2, 0.24], [-5.0, -9.0, 0.18], [4.5, -5.0, 0.22], [-3.0, -6.0, 0.2]]
  scat.forEach(([x, z, r], i) => boxAlong(q, x - ORG.x, G + r * 0.55, z - ORG.z, r, r * 0.55, r * 0.8, rnd(i) * 3, shade(LIME, 0.95)))
}

export function jardinMemorialVelDHiv(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, GARDEN_HX, GARDEN_HZ, drawGarden)
}

// ---- Spitzer monument tunables ----
const GRANITE = hex('#9b8d84'), RED = hex('#7b5f55'), SLAB = hex('#b0a38d')
const STEP_A = { hx: 4.2, z0: -6.0, z1: -4.9, h: 0.15 }
const STEP_B = { hx: 3.7, z0: -4.9, z1: -3.9, h: 0.15 }
const WALK = { hx0: 2.7, hx1: 1.5, z0: -3.9, z1: -0.9, h: 0.14 }              // tapering walkway
const PED = { hx: 1.15, hz: 0.55, h: 1.15 }                                     // inscribed pedestal
const BOWL = { hx: 2.15, hz: 0.8, t: 0.17, wing: 0.95, mid: 0.4 }              // slab under the group; rear sheet's height at the ends and the middle
export const SPITZER_GROUP_AT: [number, number, number] = [0, G + STEP_A.h + STEP_B.h + WALK.h + PED.h + BOWL.t, -0.05]

function drawSpitzer(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  let h = 0
  block(q, -STEP_A.hx, STEP_A.hx, STEP_A.z0, STEP_A.z1, y(h), y(h + STEP_A.h), shade(GRANITE, 0.94)); h += STEP_A.h
  block(q, -STEP_B.hx, STEP_B.hx, STEP_B.z0, STEP_B.z1, y(h - 0.0), y(h + STEP_B.h), GRANITE); h += STEP_B.h
  walls(q, [{ x: -WALK.hx0, z: WALK.z0 }, { x: WALK.hx0, z: WALK.z0 }, { x: WALK.hx1, z: WALK.z1 }, { x: -WALK.hx1, z: WALK.z1 }], y(h - 0.1), y(h + WALK.h), shade(GRANITE, 1.04), shade(GRANITE, 1.08))
  h += WALK.h
  // slab joints on the walkway
  for (let z = WALK.z0 + 0.6; z < WALK.z1 - 0.1; z += 0.6) {
    const t = (z - WALK.z0) / (WALK.z1 - WALK.z0), hx = WALK.hx0 + (WALK.hx1 - WALK.hx0) * t
    block(q, -hx, hx, z - 0.012, z + 0.012, y(h), y(h + 0.004), shade(GRANITE, 0.7))
  }
  // pedestal with the inscription on its front
  block(q, -PED.hx, PED.hx, -PED.hz, PED.hz, y(h), y(h + PED.h), RED)
  plaque(q, { x: 0, z: -PED.hz - 0.001, y0: y(h + 0.28), w: 1.7, h: 0.72, panel: shade(RED, 1.1), letters: shade(RED, 0.5), lines: [0.8, 0.9, 0.7, 0.9, 0.6, 0.8] })
  h += PED.h
  // the slab: a flat bed with the rear sheet curving up at both ends (the banked track)
  block(q, -BOWL.hx, BOWL.hx, -BOWL.hz, BOWL.hz, y(h), y(h + BOWL.t), SLAB)
  block(q, -BOWL.hx - 0.05, BOWL.hx + 0.05, -BOWL.hz - 0.06, -BOWL.hz, y(h), y(h + BOWL.t), shade(SLAB, 0.9))
  const n = 12
  for (let i = 0; i < n; i++) {
    const x0 = -BOWL.hx + (2 * BOWL.hx * i) / n, x1 = x0 + (2 * BOWL.hx) / n
    const xm = (x0 + x1) / 2, u = xm / BOWL.hx
    const hh = BOWL.mid + (BOWL.wing - BOWL.mid) * u * u
    block(q, x0, x1, BOWL.hz - 0.2, BOWL.hz - 0.2 + 0.2, y(h + BOWL.t), y(h + BOWL.t + hh), shade(SLAB, 0.96 + 0.06 * Math.abs(u)))
  }
}

export function monumentVelDHiv(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, SPITZER_HX, SPITZER_HZ, drawSpitzer)
}
