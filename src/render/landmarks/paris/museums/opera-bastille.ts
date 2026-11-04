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
const PANEL: Rgb = [0.40, 0.40, 0.40]
const ROOF: Rgb = [0.55, 0.55, 0.53]
const GLASS: Rgb = [0.25, 0.29, 0.34]          // the band and the boxes: sky in a square grid, pane by pane
const GLASS_DARK: Rgb = [0.14, 0.17, 0.21]     // the colonnade's recess, the lobby, the arch's screen
const MULLION: Rgb = [0.22, 0.25, 0.29]
const GRANITE: Rgb = [0.36, 0.38, 0.41]        // Lanhélin: dark blue-grey, short of black (owner, 2026-10-31)
const STEP: Rgb = [0.58, 0.58, 0.57]

// the drum: OSM's arc
const C: P2 = [-16.2, 62.1]
const R = 41.1
const B0 = 269, B1 = 356                       // the glazed rim's bearings; the terraces beyond 356°
const TAIL: P2 = [-51.6, 41.5]                 // where the straight Rue de Lyon tail of the rim ends and the terraces begin
// heights (lidar less 1 m)
const COLONNADE = 9, PANEL_TOP = 19, RIM = 31, CROWN = 37.5, TOWER = 47, BOX = 34.5, ARCH = 19

export function operaBastille(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit)
  const T = tools(out, F)
  const { poly, prism, wall, beam } = T
  const at = (b: number, r = R): P2 => [C[0] + r * Math.sin((b * Math.PI) / 180), C[1] + r * Math.cos((b * Math.PI) / 180)]
  const bearingOf = (p: P2): number => (Math.atan2(p[0] - C[0], p[1] - C[1]) * 180) / Math.PI

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
    const nrm: P2 = [(b[1] - a[1]) / l, -(b[0] - a[0]) / l]     // outward (the run is anticlockwise round the building)
    const a2: P2 = [a[0] - nrm[0] * RECESS, a[1] - nrm[1] * RECESS], b2: P2 = [b[0] - nrm[0] * RECESS, b[1] - nrm[1] * RECESS]
    // the entrance lobby right of the arch (the photograph: a tall dark glazed bay on two great pillars, under the
    // band): the recess runs up to the band there, the panel wall left out
    const bA = bearingOf(a)
    const lobby = a[1] > 60 && bA > 303 && bA < 318
    const recessTop = lobby ? PANEL_TOP : COLONNADE
    wall(a2, b2, 0, recessTop, GLASS_DARK)
    poly([[a[0], a[1], recessTop], [b[0], b[1], recessTop], [b2[0], b2[1], recessTop], [a2[0], a2[1], recessTop]], PALE_DARK, [0, 0, -1])
    // the mezzanine's pale band across the glazing
    poly([[a2[0], a2[1], 4.4], [b2[0], b2[1], 4.4], [b2[0], b2[1], 5.0], [a2[0], a2[1], 5.0]], PALE, [nrm[0], nrm[1], 0])
    // the panel wall and the glass band above, on the face, in the building's 1.6 m square grid
    if (!lobby) T.mottled([[a[0], a[1], COLONNADE], [b[0], b[1], COLONNADE], [b[0], b[1], PANEL_TOP], [a[0], a[1], PANEL_TOP]], PANEL, [nrm[0], nrm[1], 0], 1.6, 0.04)
    const glassBand = bA < 318 || a[1] < 60
    if (glassBand) {
      T.mottled([[a[0], a[1], PANEL_TOP], [b[0], b[1], PANEL_TOP], [b[0], b[1], RIM], [a[0], a[1], RIM]], GLASS, [nrm[0], nrm[1], 0], 1.6, 0.06)
      // the horizontal mullions, a thin strip proud of the glass at every row
      for (let h = PANEL_TOP; h < RIM - 0.1; h += (RIM - PANEL_TOP) / 7) {
        const o = 0.22
        poly([[a[0] + nrm[0] * o, a[1] + nrm[1] * o, h], [b[0] + nrm[0] * o, b[1] + nrm[1] * o, h], [b[0] + nrm[0] * o, b[1] + nrm[1] * o, h + 0.2], [a[0] + nrm[0] * o, a[1] + nrm[1] * o, h + 0.2]], MULLION, [nrm[0], nrm[1], 0])
      }
      // the vertical ones
      for (let s = 0.8; s < l; s += 1.6) {
        const t = s / l, e = a[0] + (b[0] - a[0]) * t, n = a[1] + (b[1] - a[1]) * t
        const u: P2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
        poly([[e - u[0] * 0.1 + nrm[0] * 0.22, n - u[1] * 0.1 + nrm[1] * 0.22, PANEL_TOP], [e + u[0] * 0.1 + nrm[0] * 0.22, n + u[1] * 0.1 + nrm[1] * 0.22, PANEL_TOP],
          [e + u[0] * 0.1 + nrm[0] * 0.22, n + u[1] * 0.1 + nrm[1] * 0.22, RIM], [e - u[0] * 0.1 + nrm[0] * 0.22, n - u[1] * 0.1 + nrm[1] * 0.22, RIM]], MULLION, [nrm[0], nrm[1], 0])
      }
    } else {
      // behind and left of the arch the band is panelled too, with a few square windows
      T.mottled([[a[0], a[1], PANEL_TOP], [b[0], b[1], PANEL_TOP], [b[0], b[1], RIM], [a[0], a[1], RIM]], PANEL, [nrm[0], nrm[1], 0], 1.6, 0.04)
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
}
