/**
 * The Opéra Bastille (Carlos Ott, 1989) on the Place de la Bastille: the colossal curved front of the foyers — a
 * colonnade at the street, a wall of square pale panels, then a tall band of square-paned glass — under a set-back
 * crown with glass boxes on it; the white fly tower behind with its stepped shoulder; the terraces stepping down to
 * the Rue de Lyon on the west and the Rue de Charenton on the north-east; the dark granite arch standing proud of
 * the front on its broad stair; and the halls and the long annex behind, plain.
 *
 * Measured, not guessed (the restyle of OSM's parts "doesn't look much like the real thing", owner 2026-11-03):
 *   - IGN's LiDAR HD surface model (MNS, 0.5 m) over the building, less the Place's own level: the drum's glazed rim
 *     at 32 m with the 38 m crown 7–8 m inside it, the fly tower at 48 m over E −24…+20, N 20…62 with 41–45 m steps on
 *     its west side, the north-east terraces at 29/25/21/17 m in bands ~4.5 m wide along the edge, the west terraces at
 *     25/29/33/37 m, the glass boxes at 35 m over E −44…−26, N 84…99, the arch at 19 m, the stair rising 3–4 m to it;
 *   - OSM's outline (way/78149064, 217 nodes) for the plan: the front is a circular arc of radius 41.1 m centred at
 *     (−16.2, 62.1), from due west (bearing 269°) round the north to 37°, carried on south as the straight Rue de Lyon
 *     edge (bearing 164°); the arch's parts at E −45…−34, N 98…111;
 *   - the owner's photograph from the Place for what the lidar cannot see: the colonnade's square pillars and the
 *     recessed glazing behind them, the panel grid, the glass band's mullions, the arch's dark frame and screen.
 * Everything is in METRES EAST and NORTH of the outline's centroid (48.851812 N, 2.370529 E) and metres above the
 * Place; `registerRing` puts that onto whatever footprint the loader hands the builder. Heights are the lidar's less
 * the 1 m the Place stands above the tile's median ground.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import type { Rgb } from '../../../models.ts'
import { arc, offsetPath, registerRing, tone, tools, type P2 } from './enframe.ts'

/** OSM's outline at 1.5 m, anticlockwise — only its hull matters to the registration */
const RING: P2[] = [[11.4, 87.5], [13.5, 89.3], [8.0, 94.6], [-6.6, 101.8], [-20.5, 102.9], [-31.8, 100.2], [-35.5, 113.2],
  [-36.5, 111.6], [-40.2, 120.4], [-50.4, 105.3], [-45.7, 99.1], [-47.2, 97.3], [-45.0, 98.1], [-42.0, 94.1], [-53.9, 78.7],
  [-57.4, 61.5], [-27.6, -43.1], [-24.8, -42.4], [-28.2, -30.3], [-15.1, -25.2], [-12.9, -29.2], [-19.2, -32.7], [-15.9, -38.7],
  [-22.4, -49.6], [-23.0, -59.8], [-20.4, -69.2], [-19.0, -68.5], [-13.9, -78.7], [-6.4, -84.0], [3.2, -86.9], [10.6, -85.4],
  [14.1, -91.4], [20.3, -87.9], [21.6, -90.1], [9.1, -97.6], [9.7, -99.8], [-1.6, -103.6], [0.2, -105.8], [-8.9, -108.4],
  [-5.8, -108.1], [14.2, -178.4], [35.7, -172.1], [24.3, -130.1], [29.8, -124.5], [40.0, -103.0], [35.2, -85.8], [74.3, -8.3],
  [72.3, -4.6], [75.7, 4.8], [71.6, 14.7], [59.6, 18.3], [55.7, 25.6], [60.5, 28.3], [57.5, 27.5], [56.7, 31.6], [30.8, 63.6],
  [18.9, 82.5], [16.3, 80.9]]

// the pale cladding (the photograph: a light grey, ~200 in the sun — the city's sun takes 0.74 to pure white), the glass, the granite, the rest
const PALE: Rgb = [0.60, 0.60, 0.59]
const PALE_DARK: Rgb = [0.50, 0.50, 0.49]
/** the drum's front panels, which face the afternoon sun over the Place: the city's sun gains ~2.3× there, so 0.6 is pure white */
const PANEL: Rgb = [0.66, 0.67, 0.67]
/** the panel grid (the photograph: ~1.8 m squares with dark joints) and the joints' width */
const PANEL_CELL = 1.8, JOINT = 0.09
const JOINT_COL: Rgb = [0.38, 0.39, 0.40]
const ROOF: Rgb = [0.55, 0.55, 0.53]
const GLASS: Rgb = [0.38, 0.44, 0.50]          // the band and the boxes: sky in a square grid, pane by pane
const GLASS_DARK: Rgb = [0.14, 0.17, 0.21]     // the colonnade's recess, the lobby, the arch's screen
const MULLION: Rgb = [0.30, 0.33, 0.37]
const GRANITE: Rgb = [0.36, 0.38, 0.41]        // Lanhélin: dark blue-grey, short of black (owner, 2026-10-31)
const STEP: Rgb = [0.46, 0.46, 0.45]

// the drum: OSM's arc
const C: P2 = [-16.2, 62.1]
const R = 41.1
const B0 = 269, B1 = 356                       // the glazed rim's bearings; the terraces beyond 356°
const TAIL: P2 = [-51.6, 41.5]                 // where the straight Rue de Lyon tail of the rim ends and the terraces begin
// heights (lidar less 1 m)
/** the panel wall's top by bearing on the arc, the stairstep across the front (the photograph): [from bearing, top] high
 *  to low — by the arch it runs to the rim, then steps down bay by bay toward the Rue de Lyon. Tune here. */
const PANEL_STEPS: [number, number][] = [[322, 31], [312, 27], [302, 23], [292, 19], [282, 15.5], [0, 12.5]]
const panelTop = (b: number): number => PANEL_STEPS.find(([b0]) => b >= b0)![1]
/** how far the panel wall stands proud of the glass, so the steps read */
const PROUD = 0.6
/** the Rue de Lyon side's skin: arcade height, bay, the panelled parapet over the glass, the skin's offset off the prism */
const SIDE_ARCADE = 8.5, SIDE_BAY = 6.5, SIDE_PARAPET = 2.5, SKIN = 0.05
/** the side's floor bands across the glass (Street View: pale strips every storey), the roof pergola's beams, the white tower */
const SIDE_FLOOR = 3.3, PERGOLA_STEP = 3.2, PERGOLA_IN = 7, PERGOLA_OUT = 1.2, TOWER_W = 9, TOWER_D = 7, TOWER_H = 42
/** the round south-west corner: circle fitted to OSM's ring (0.1 m), bearings, heights */
const ROUND_C: P2 = [7.5, -56.5], ROUND_R = 30.7, ROUND_B0 = 188, ROUND_B1 = 283
const ROUND_TOP = 27.5, ROUND_CAP = 3.5, ROUND_GROUND = 6
const COLONNADE = 9, PANEL_TOP = 19, RIM = 31, CROWN = 37.5, TOWER = 47, BOX = 34.5, ARCH = 19

export function operaBastille(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit)
  const T = tools(out, F)
  const { poly, prism, wall, beam } = T
  const at = (b: number, r = R): P2 => [C[0] + r * Math.sin((b * Math.PI) / 180), C[1] + r * Math.cos((b * Math.PI) / 180)]
  // thin dark joints a few cm proud of a panelled face, on the panel grid
  const joints = (a: P2, b: P2, nrm: P2, l: number, h0: number, h1: number): void => {
    const o = 0.04, u: P2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
    const q = (e: number, n: number, h: number): [number, number, number] => [e + nrm[0] * o, n + nrm[1] * o, h]
    for (let h = h0 + PANEL_CELL; h < h1 - 0.2; h += PANEL_CELL) poly([q(a[0], a[1], h), q(b[0], b[1], h), q(b[0], b[1], h + JOINT), q(a[0], a[1], h + JOINT)], JOINT_COL, [nrm[0], nrm[1], 0])
    for (let s = PANEL_CELL / 2; s < l; s += PANEL_CELL) {
      const e = a[0] + u[0] * s, n = a[1] + u[1] * s, w = JOINT / 2
      poly([q(e - u[0] * w, n - u[1] * w, h0), q(e + u[0] * w, n + u[1] * w, h0), q(e + u[0] * w, n + u[1] * w, h1), q(e - u[0] * w, n - u[1] * w, h1)], JOINT_COL, [nrm[0], nrm[1], 0])
    }
  }
  const bearingOf = (p: P2): number => ((Math.atan2(p[0] - C[0], p[1] - C[1]) * 180) / Math.PI + 360) % 360

  // ================================================================ the drum's rim: colonnade, panels, glass band
  // the outer face: the straight tail then the arc in 3° steps, as a run of edges
  const OUTER: P2[] = [TAIL, at(B0), ...arc(C, R, B0, B1, 29).slice(1)]
  const INNER: P2[] = [[TAIL[0] + 8, TAIL[1]], at(B0, R - 8), ...arc(C, R - 8, B0, B1, 29).slice(1)]
  // the body of the rim from the colonnade's ceiling to its top, plain, and its roof terrace — drawn as a band whose
  // "outer" path is the INNER arc, so that the outer face is left to the skin below and does not fight it
  T.band(INNER, OUTER, COLONNADE, RIM, PALE, ROOF)
  // the colonnade: the recessed glazing 2.5 m behind the face, the soffit over it, and the pillars on the face
  const RECESS = 2.5
  for (let i = 0; i + 1 < OUTER.length; i++) {
    const a = OUTER[i], b = OUTER[i + 1]
    const l = Math.hypot(b[0] - a[0], b[1] - a[1])
    // outward: the run goes CLOCKWISE round the building (bearings rising from 269° to 356°), so outward is LEFT of travel
    const nrm: P2 = [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]
    const a2: P2 = [a[0] - nrm[0] * RECESS, a[1] - nrm[1] * RECESS], b2: P2 = [b[0] - nrm[0] * RECESS, b[1] - nrm[1] * RECESS]
    // the entrance lobby right of the arch (the photograph: a tall dark glazed bay on two great pillars, under the
    // band): the recess runs up to the band there, the panel wall left out
    const bA = bearingOf(a)
    const lobby = a[1] > 60 && bA > 303 && bA < 318
    const recessTop = lobby ? PANEL_TOP : COLONNADE
    wall(b2, a2, 0, recessTop, GLASS_DARK)     // reversed: `wall` takes outward as right of travel
    poly([[a[0], a[1], recessTop], [b[0], b[1], recessTop], [b2[0], b2[1], recessTop], [a2[0], a2[1], recessTop]], PALE_DARK, [0, 0, -1])
    // the mezzanine's pale band across the glazing
    poly([[a2[0], a2[1], 4.4], [b2[0], b2[1], 4.4], [b2[0], b2[1], 5.0], [a2[0], a2[1], 5.0]], PALE, [nrm[0], nrm[1], 0])
    // the panel wall and the glass band above. The photograph's key line: the panel wall's top STEPS DOWN across the
    // front, full height by the arch, lower bay by bay toward the Rue de Lyon, the glass filling in above each step.
    // The panels stand PROUD of the glass, so every step shows its edge.
    const pt = a[1] < 60 ? PANEL_STEPS[PANEL_STEPS.length - 1][1] : panelTop(bA)
    const p0 = lobby ? PANEL_TOP : COLONNADE
    const pa: P2 = [a[0] + nrm[0] * PROUD, a[1] + nrm[1] * PROUD], pb: P2 = [b[0] + nrm[0] * PROUD, b[1] + nrm[1] * PROUD]
    if (pt > p0) {
      T.mottled([[pa[0], pa[1], p0], [pb[0], pb[1], p0], [pb[0], pb[1], pt], [pa[0], pa[1], pt]], PANEL, [nrm[0], nrm[1], 0], PANEL_CELL, 0.03)
      joints(pa, pb, nrm, l, p0, pt)
      poly([[a[0], a[1], pt], [b[0], b[1], pt], [pb[0], pb[1], pt], [pa[0], pa[1], pt]], PALE, [0, 0, 1])          // the step's top
      poly([[a[0], a[1], p0], [b[0], b[1], p0], [pb[0], pb[1], p0], [pa[0], pa[1], p0]], PALE_DARK, [0, 0, -1])   // its soffit
      // the step's ends, where the next bay's panel top differs
      for (const [c, cp, o] of [[a, pa, i > 0 ? (OUTER[i - 1][1] < 60 ? PANEL_STEPS[PANEL_STEPS.length - 1][1] : panelTop(bearingOf(OUTER[i - 1]))) : p0], [b, pb, i + 2 < OUTER.length ? (b[1] < 60 ? PANEL_STEPS[PANEL_STEPS.length - 1][1] : panelTop(bearingOf(b))) : p0]] as const) {
        if (o < pt - 0.1) poly([[c[0], c[1], Math.max(o, p0)], [cp[0], cp[1], Math.max(o, p0)], [cp[0], cp[1], pt], [c[0], c[1], pt]], PANEL, [-(b[0] - a[0]), -(b[1] - a[1]), 0].map((v) => (c === a ? v : -v)) as [number, number, number])
      }
    }
    if (pt < RIM - 0.1) {
      const g0 = pt
      T.mottled([[a[0], a[1], g0], [b[0], b[1], g0], [b[0], b[1], RIM], [a[0], a[1], RIM]], GLASS, [nrm[0], nrm[1], 0], 1.6, 0.06)
      for (let h = g0; h < RIM - 0.1; h += 1.6) {
        const o = 0.22
        poly([[a[0] + nrm[0] * o, a[1] + nrm[1] * o, h], [b[0] + nrm[0] * o, b[1] + nrm[1] * o, h], [b[0] + nrm[0] * o, b[1] + nrm[1] * o, h + 0.15], [a[0] + nrm[0] * o, a[1] + nrm[1] * o, h + 0.15]], MULLION, [nrm[0], nrm[1], 0])
      }
      for (let s = 0.8; s < l; s += 1.6) {
        const t = s / l, e = a[0] + (b[0] - a[0]) * t, n = a[1] + (b[1] - a[1]) * t
        const u: P2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
        poly([[e - u[0] * 0.08 + nrm[0] * 0.22, n - u[1] * 0.08 + nrm[1] * 0.22, g0], [e + u[0] * 0.08 + nrm[0] * 0.22, n + u[1] * 0.08 + nrm[1] * 0.22, g0],
          [e + u[0] * 0.08 + nrm[0] * 0.22, n + u[1] * 0.08 + nrm[1] * 0.22, RIM], [e - u[0] * 0.08 + nrm[0] * 0.22, n - u[1] * 0.08 + nrm[1] * 0.22, RIM]], MULLION, [nrm[0], nrm[1], 0])
      }
    }
    // the pillars: square, 1.4 m, at every third vertex of the run (6.5 m), from the street to the colonnade's ceiling
    const u: P2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
    const pillar = (c: P2, h: number, w = 0.7): void => prism([[c[0] - u[0] * w, c[1] - u[1] * w], [c[0] + u[0] * w, c[1] + u[1] * w],
      [c[0] + u[0] * w - nrm[0] * 2 * w, c[1] + u[1] * w - nrm[1] * 2 * w], [c[0] - u[0] * w - nrm[0] * 2 * w, c[1] - u[1] * w - nrm[1] * 2 * w]], 0, h, PALE, null)
    // the lobby's two great pillars at its ends, the colonnade's at every third vertex elsewhere
    const bB = bearingOf(b)
    if (lobby && (i === 0 || bearingOf(OUTER[i - 1]) <= 303)) pillar(a, PANEL_TOP, 1.2)
    else if (lobby && (bB >= 318 || OUTER[i + 1][1] <= 60)) pillar(b, PANEL_TOP, 1.2)
    else if (i % 3 === 0 && !lobby) pillar(a, COLONNADE)
    if (i + 2 === OUTER.length) pillar(b, COLONNADE)
  }
  // the parapet along the rim's top, and the crown set back behind it
  const CROWN_RING: P2[] = [...arc(C, R - 8.5, B0, B1, 29), [-12, 94], [-4, 86], [2, 74], [8, 64], [16, 54], [22, 40], [26, 24], [26, -8],
    [26, -26], [-22, -26], [-36, -8], [-38, 20], [-40, 40], [-43.5, 52]]
  prism(CROWN_RING, RIM - 0.5, CROWN, PALE, ROOF, 3, 0.015)
  // the glass boxes on the rim's north end, behind and above the arch (the photograph's stacked greenhouses)
  for (const [x0, x1, n0, n1] of [[-46, -37, 82, 91], [-39, -29, 88, 98], [-30, -22, 93, 101]] as const) {
    prism([[x0, n0], [x1, n0], [x1, n1], [x0, n1]], RIM, BOX, GLASS, tone(GLASS, 1.08), 1.6, 0.06)
    for (const h of [RIM + 1.2, RIM + 2.4]) {
      beam([x0 - 0.1, n0 - 0.1, h], [x1 + 0.1, n0 - 0.1, h], 0.08, MULLION)
      beam([x0 - 0.1, n1 + 0.1, h], [x1 + 0.1, n1 + 0.1, h], 0.08, MULLION)
      beam([x0 - 0.1, n0 - 0.1, h], [x0 - 0.1, n1 + 0.1, h], 0.08, MULLION)
      beam([x1 + 0.1, n0 - 0.1, h], [x1 + 0.1, n1 + 0.1, h], 0.08, MULLION)
    }
  }

  // ================================================================ the fly tower and its stepped shoulder
  prism([[-24, 20], [18, 20], [18, 50], [8, 50], [8, 62], [-24, 62]], CROWN - 0.5, TOWER, PALE, ROOF, 3, 0.015)
  // the steps down its west side (the photograph's staircase silhouette right of the tower)
  prism([[-30, 36], [-24, 36], [-24, 60], [-30, 60]], CROWN - 0.5, 44.5, PALE, ROOF, 3, 0.015)
  prism([[-36, 40], [-30, 40], [-30, 60], [-36, 60]], CROWN - 0.5, 41.5, PALE, ROOF, 3, 0.015)
  prism([[-42, 42], [-36, 42], [-36, 58], [-42, 58]], CROWN - 0.5, 39.5, PALE, ROOF, 3, 0.015)
  // the 41–45 m block north of the tower's foot
  prism([[-12, 62], [8, 62], [8, 68], [-12, 68]], CROWN - 0.5, 41, PALE, ROOF, 3, 0.015)

  // ================================================================ the terraces
  // north-east: bands parallel to the edge from the rim's end round to the Rue de Charenton, stepping down to it
  const NE_PATH: P2[] = [...arc(C, R, B1, 397, 8), [18.9, 82.5], [30.8, 63.6]]   // 356° on round to 37°
  // the path runs clockwise round the building (east along the north side), so inward is to its RIGHT: offset negative
  const NE: [number, number, number][] = [[0, 4.5, 17], [4.5, 9, 21], [9, 13.5, 25], [13.5, 18, 29]]
  for (const [d0, d1, h] of NE) T.band(offsetPath(NE_PATH, -d0), offsetPath(NE_PATH, -d1), 0, h, PALE, ROOF, 3, 0.015)
  // west, along the Rue de Lyon: the edge from the rim's tail to the jog at N −30, bands stepping up into the crown
  const W0: P2 = [-51.3, 40], W1: P2 = [-31.4, -30]
  const wl = Math.hypot(W1[0] - W0[0], W1[1] - W0[1])
  const wn: P2 = [(W1[1] - W0[1]) / wl, -(W1[0] - W0[0]) / wl]       // right of travel southward: outward (west)
  const W: [number, number, number][] = [[0, 7, 25], [7, 10, 29], [10, 14, 33], [14, 21, 37]]
  for (const [d0, d1, h] of W) {
    T.band([[W0[0] - wn[0] * d0, W0[1] - wn[1] * d0], [W1[0] - wn[0] * d0, W1[1] - wn[1] * d0]], [[W0[0] - wn[0] * d1, W0[1] - wn[1] * d1], [W1[0] - wn[0] * d1, W1[1] - wn[1] * d1]], 0, h, PALE, ROOF, 3, 0.015)
  }
  // the end wall closing the rim's tail over the first terrace
  wall([TAIL[0] + 8, TAIL[1]], TAIL, COLONNADE, RIM, PALE)

  // ================================================================ the arch and its stair
  // the frame stands proud of the drum at bearing 331° from its centre, facing 302° to the Place; its own frame:
  // u along the front (bearing 32°), v out toward the Place, h up
  const A: P2 = [-39, 103]
  const U: P2 = [Math.sin((32 * Math.PI) / 180), Math.cos((32 * Math.PI) / 180)]
  const Vv: P2 = [Math.sin((302 * Math.PI) / 180), Math.cos((302 * Math.PI) / 180)]
  const ap = (u: number, v: number): P2 => [A[0] + U[0] * u + Vv[0] * v, A[1] + U[1] * u + Vv[1] * v]
  const abox = (u0: number, u1: number, v0: number, v1: number, h0: number, h1: number, colour: Rgb, top: Rgb | null = colour): void =>
    prism([ap(u0, v0), ap(u1, v0), ap(u1, v1), ap(u0, v1)], h0, h1, colour, top)
  const FLOOR = 3.4                                    // the stair's top: the lidar's ground steps up 3–4 m to the arch
  const W2 = 10, D = 2.2
  // the platform the frame stands on, back to the drum
  abox(-12, 12, -9, 1.2, 0, FLOOR, GRANITE)
  // the posts and the lintel
  abox(-W2, -W2 + D, -D / 2, D / 2, FLOOR, FLOOR + ARCH, GRANITE)
  abox(W2 - D, W2, -D / 2, D / 2, FLOOR, FLOOR + ARCH, GRANITE)
  abox(-W2, W2, -D / 2, D / 2, FLOOR + ARCH - D, FLOOR + ARCH, GRANITE)
  // the dark screen inside the frame, set back half a metre, with its grid of thin granite mullions
  abox(-W2 + D, W2 - D, -D / 2 - 0.6, -D / 2 - 0.4, FLOOR, FLOOR + ARCH - D, GLASS_DARK)
  for (let k = 1; k < 6; k++) abox(-W2 + D + ((2 * W2 - 2 * D) * k) / 6 - 0.1, -W2 + D + ((2 * W2 - 2 * D) * k) / 6 + 0.1, -D / 2 - 0.4, -D / 2 - 0.2, FLOOR, FLOOR + ARCH - D, GRANITE)
  for (let k = 1; k < 7; k++) abox(-W2 + D, W2 - D, -D / 2 - 0.4, -D / 2 - 0.2, FLOOR + ((ARCH - D) * k) / 7 - 0.1, FLOOR + ((ARCH - D) * k) / 7 + 0.1, GRANITE)
  // the glazed hall between the frame and the drum's wall
  abox(-W2 + 0.5, W2 - 0.5, -9, -D / 2 - 0.7, FLOOR, FLOOR + ARCH - 1.5, GLASS_DARK, tone(GLASS_DARK, 1.2))
  // the stair: seventeen risers of 0.2 m over 13.6 m, the full width of the frame and a little more
  for (let k = 0; k < 17; k++) abox(-12, 12, 1.2 + k * 0.8, 1.2 + (k + 1) * 0.8, 0, FLOOR - 0.2 * (k + 1) + 0.2, STEP, tone(STEP, 1.03))
  // the stair's side walls, granite
  for (const s of [-1, 1]) abox(s * 12, s * 12.6, 1.2, 14.8, 0, FLOOR + 0.6, GRANITE)

  // ================================================================ the halls behind, and the annex: plain prisms
  const rear: [P2[], number][] = [
    [[[12, 36], [36, 36], [48, 0], [44, -10], [12, -10]], 37.5],                   // the east halls
    [[[30.8, 63.6], [56.7, 31.6], [48, 24], [24, 52]], 21.5],                        // along the Rue de Charenton
    [[[56.7, 31.6], [71.6, 14.7], [75.7, 4.8], [74.3, -8.3], [60, -6], [46, 22]], 18.5],
    [[[60, -6], [74.3, -8.3], [35.2, -85.8], [28, -68], [44, -36]], 18.5],
    [[[28, -34], [44, -36], [40, -66], [28, -68]], 17.5],
    [[[-2, -30], [28, -34], [28, -68], [14, -72], [0, -68]], 41.5],                 // the rear stage
    [[[-13, -29], [-4, -44], [12, -73], [20, -88], [14, -91], [5, -76], [-10, -49], [-19, -33]], 36],
    [[[-21, -44], [-10, -49], [5, -76], [8, -82], [-6, -84], [-14, -78], [-23, -60]], 27],
    [[[29, -63], [35, -86], [33, -104], [15, -71]], 26.5],
    [[[16, -86], [24, -88], [26, -108], [18, -106]], 32.5],
    [[[-6, -108], [14, -178], [36, -172], [24, -130], [30, -124], [22, -100], [10, -100]], 28.5],   // the annex down the Rue de Lyon
  ]
  for (const [ring, h] of rear) prism(ring, 0, h, PALE, ROOF)

  // ================================================================ the Rue de Lyon side (the photograph, right of the drum)
  // a straight face skinned like the front: an arcade of square pillars at the street over dark glazing, a glass
  // curtain wall in the 1.6 m grid above, and a panelled parapet with the joints. Outward is RIGHT of travel.
  const side = (a: P2, b: P2, top: number, arcade = true): void => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]), u: P2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
    const nrm: P2 = [u[1], -u[0]]
    const at = (p: P2, o: number): P2 => [p[0] + nrm[0] * o, p[1] + nrm[1] * o]
    const A = at(a, SKIN), B = at(b, SKIN)
    const q = (h0: number, h1: number, c: Rgb, cell = 0, sp = 0.03): void => {
      const pts: [[number, number, number], [number, number, number], [number, number, number], [number, number, number]] = [[A[0], A[1], h0], [B[0], B[1], h0], [B[0], B[1], h1], [A[0], A[1], h1]]
      if (cell) T.mottled(pts, c, [nrm[0], nrm[1], 0], cell, sp); else poly(pts, c, [nrm[0], nrm[1], 0])
    }
    const g0 = arcade ? SIDE_ARCADE : 0, g1 = top - SIDE_PARAPET
    if (arcade) {
      q(0, SIDE_ARCADE, GLASS_DARK)
      for (let s = SIDE_BAY / 2; s < l; s += SIDE_BAY) {
        const c: P2 = [a[0] + u[0] * s, a[1] + u[1] * s], w = 0.6
        prism([[c[0] - u[0] * w, c[1] - u[1] * w], [c[0] + u[0] * w, c[1] + u[1] * w], at([c[0] + u[0] * w, c[1] + u[1] * w], 1.8), at([c[0] - u[0] * w, c[1] - u[1] * w], 1.8)], 0, SIDE_ARCADE, PALE, null)
      }
      // the canopy over the arcade
      poly([[A[0], A[1], SIDE_ARCADE], [B[0], B[1], SIDE_ARCADE], [...at(b, 2), SIDE_ARCADE], [...at(a, 2), SIDE_ARCADE]] as [number, number, number][], PALE_DARK, [0, 0, -1])
      poly([[...at(a, 2), SIDE_ARCADE], [...at(b, 2), SIDE_ARCADE], [...at(b, 2), SIDE_ARCADE + 0.8], [...at(a, 2), SIDE_ARCADE + 0.8]] as [number, number, number][], PALE, [nrm[0], nrm[1], 0])
    }
    if (g1 > g0 + 1) {
      q(g0, g1, GLASS, 1.6, 0.06)
      for (let h = g0 + SIDE_FLOOR; h < g1 - 0.5; h += SIDE_FLOOR) poly([[...at(a, SKIN + 0.25), h], [...at(b, SKIN + 0.25), h], [...at(b, SKIN + 0.25), h + 0.7], [...at(a, SKIN + 0.25), h + 0.7]] as [number, number, number][], PALE, [nrm[0], nrm[1], 0])
      for (let h = g0; h < g1; h += 1.6) poly([[...at(a, SKIN + 0.15), h], [...at(b, SKIN + 0.15), h], [...at(b, SKIN + 0.15), h + 0.15], [...at(a, SKIN + 0.15), h + 0.15]] as [number, number, number][], MULLION, [nrm[0], nrm[1], 0])
      for (let s = 0.8; s < l; s += 1.6) {
        const e = a[0] + u[0] * s, n = a[1] + u[1] * s
        poly([[...at([e - u[0] * 0.08, n - u[1] * 0.08], SKIN + 0.15), g0], [...at([e + u[0] * 0.08, n + u[1] * 0.08], SKIN + 0.15), g0], [...at([e + u[0] * 0.08, n + u[1] * 0.08], SKIN + 0.15), g1], [...at([e - u[0] * 0.08, n - u[1] * 0.08], SKIN + 0.15), g1]] as [number, number, number][], MULLION, [nrm[0], nrm[1], 0])
      }
    }
    q(Math.max(g1, g0), top, PANEL, PANEL_CELL, 0.03)
    joints(A, B, nrm, l, Math.max(g1, g0), top)
  }
  // the west terraces' street face, then the halls and the annex down the Rue de Lyon (travel southward: outward west)
  side(W0, W1, 25)
  // the pergola on the wing's roof: beams across the terrace every few metres, cantilevered over the street, on a rail
  for (let s = 2; s < wl - 1; s += PERGOLA_STEP) {
    const e = W0[0] + ((W1[0] - W0[0]) * s) / wl, n = W0[1] + ((W1[1] - W0[1]) * s) / wl
    beam([e + wn[0] * PERGOLA_OUT, n + wn[1] * PERGOLA_OUT, 26.4], [e - wn[0] * PERGOLA_IN, n - wn[1] * PERGOLA_IN, 26.4], 0.35, PALE)
    beam([e - wn[0] * (PERGOLA_IN - 0.5), n - wn[1] * (PERGOLA_IN - 0.5), 25], [e - wn[0] * (PERGOLA_IN - 0.5), n - wn[1] * (PERGOLA_IN - 0.5), 26.4], 0.3, PALE)
  }
  {
    const e0 = W0[0] + ((W1[0] - W0[0]) * 2) / wl, n0 = W0[1] + ((W1[1] - W0[1]) * 2) / wl
    const e1 = W1[0] - ((W1[0] - W0[0]) * 1) / wl, n1 = W1[1] - ((W1[1] - W0[1]) * 1) / wl
    beam([e0 - wn[0] * 1, n0 - wn[1] * 1, 26.9], [e1 - wn[0] * 1, n1 - wn[1] * 1, 26.9], 0.3, PALE)
  }
  // the tall white tower where the wing meets the drum (Street View: a sheer panelled slab with a glazed slot beside it)
  {
    const t0 = 3, ux = (W1[0] - W0[0]) / wl, uy = (W1[1] - W0[1]) / wl
    const p = (s: number, d: number): P2 => [W0[0] + ux * s - wn[0] * d, W0[1] + uy * s - wn[1] * d]
    prism([p(t0, -0.5), p(t0 + TOWER_W, -0.5), p(t0 + TOWER_W, TOWER_D), p(t0, TOWER_D)], 0, TOWER_H, PALE, ROOF, 3, 0.02)
    prism([p(t0 + TOWER_W, 0.5), p(t0 + TOWER_W + 3, 0.5), p(t0 + TOWER_W + 3, TOWER_D), p(t0 + TOWER_W, TOWER_D)], 0, TOWER_H - 4, GLASS, ROOF, 1.6, 0.06)
  }
  // the round bit: the south-west corner is a true arc (OSM's ring and its columns fit a circle to 0.1 m), a glazed drum
  // with pale floor bands under a panelled top band, the columns standing free at its foot
  {
    const at2 = (b: number, r: number): P2 => [ROUND_C[0] + r * Math.sin((b * Math.PI) / 180), ROUND_C[1] + r * Math.cos((b * Math.PI) / 180)]
    const n = Math.ceil((ROUND_B1 - ROUND_B0) / 3)
    for (let k = 0; k < n; k++) {
      const b0 = ROUND_B0 + ((ROUND_B1 - ROUND_B0) * k) / n, b1 = ROUND_B0 + ((ROUND_B1 - ROUND_B0) * (k + 1)) / n
      const bm = ((b0 + b1) / 2) * Math.PI / 180, nrm: [number, number, number] = [Math.sin(bm), Math.cos(bm), 0]
      const q = (r: number, h0: number, h1: number): [[number, number, number], [number, number, number], [number, number, number], [number, number, number]] => {
        const A = at2(b0, r), B = at2(b1, r)
        return [[A[0], A[1], h0], [B[0], B[1], h0], [B[0], B[1], h1], [A[0], A[1], h1]]
      }
      const R0 = ROUND_R + 0.05
      poly(q(R0 - 0.5, 0, ROUND_GROUND), GLASS_DARK, nrm)                       // the ground floor, recessed behind the columns
      poly(q(R0, ROUND_GROUND - 0.6, ROUND_GROUND), PALE_DARK, nrm)
      T.mottled(q(R0, ROUND_GROUND, ROUND_TOP - ROUND_CAP), GLASS, nrm, 1.6, 0.06)
      for (let h = ROUND_GROUND + SIDE_FLOOR; h < ROUND_TOP - ROUND_CAP - 0.5; h += SIDE_FLOOR) poly(q(R0 + 0.25, h, h + 0.6), PALE, nrm)
      for (let h = ROUND_GROUND; h < ROUND_TOP - ROUND_CAP; h += 1.6) poly(q(R0 + 0.12, h, h + 0.12), MULLION, nrm)
      // one vertical mullion per 3° segment: 1.6 m at this radius, the building's grid
      { const t = (b0 * Math.PI) / 180, u: P2 = [Math.cos(t), -Math.sin(t)], c = at2(b0, R0 + 0.12), w = 0.08
        poly([[c[0] - u[0] * w, c[1] - u[1] * w, ROUND_GROUND], [c[0] + u[0] * w, c[1] + u[1] * w, ROUND_GROUND], [c[0] + u[0] * w, c[1] + u[1] * w, ROUND_TOP - ROUND_CAP], [c[0] - u[0] * w, c[1] - u[1] * w, ROUND_TOP - ROUND_CAP]], MULLION, nrm) }

      T.mottled(q(R0, ROUND_TOP - ROUND_CAP, ROUND_TOP), PANEL, nrm, PANEL_CELL, 0.03)
      // the soffit under the ground floor's overhang
      { const A0 = at2(b0, R0 - 0.5), B0 = at2(b1, R0 - 0.5), A1 = at2(b0, R0), B1 = at2(b1, R0)
        poly([[A0[0], A0[1], ROUND_GROUND - 0.6], [B0[0], B0[1], ROUND_GROUND - 0.6], [B1[0], B1[1], ROUND_GROUND - 0.6], [A1[0], A1[1], ROUND_GROUND - 0.6]], PALE_DARK, [0, 0, -1]) }
    }
    // the roof's lip and the columns (OSM: 0.6 m round, 6/12/18 m — the 18 m ones rising to the top band's floor)
    for (let k = 0; k <= 32; k++) {
      const b = ROUND_B0 + ((ROUND_B1 - ROUND_B0) * k) / 32
      if (k % 4 === 0) { const c = at2(b, ROUND_R + 1.2); prism([[c[0] - 0.5, c[1] - 0.5], [c[0] + 0.5, c[1] - 0.5], [c[0] + 0.5, c[1] + 0.5], [c[0] - 0.5, c[1] + 0.5]], 0, ROUND_GROUND - 0.6, PALE, null) }
    }
  }
  side([-5.8, -108.1], [14.2, -178.4], 28.5)
  // the stepped white blocks above: panel grid on each step's street face, no glass (the photograph's tall white shoulders)
  for (const [d0, , h] of W.slice(1)) {
    const a: P2 = [W0[0] - wn[0] * d0, W0[1] - wn[1] * d0], b: P2 = [W1[0] - wn[0] * d0, W1[1] - wn[1] * d0]
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]), nrm: P2 = [(b[1] - a[1]) / l, -(b[0] - a[0]) / l]
    const prev = W[W.findIndex((w) => w[0] === d0) - 1][2]
    joints([a[0] + nrm[0] * SKIN, a[1] + nrm[1] * SKIN], [b[0] + nrm[0] * SKIN, b[1] + nrm[1] * SKIN], nrm, l, prev, h)
  }
}
