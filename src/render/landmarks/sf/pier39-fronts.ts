/**
 * PIER 39's BEST-KNOWN FRONTAGES (owner, 2026-10-17: "the pier 39 amusement park stuff needs a lot more work"). The
 * pier's shops are all drawn by one builder (`pier39Shop`, pier39.ts): weathered timber, awnings, galleries. The faces a
 * visitor remembers are built here instead, each from a photograph named in its doc comment, as POINT MODELS laid against
 * the building's wall (the `hardRockFront` method, wharf-shops.ts): the manifest gives lat/lon on the wall line and
 * `rotateDeg` = the bearing the face looks along; the model is in local metres, facing local +z, its +x to the viewer's
 * LEFT. Walls were measured from the baked package (the ring's edges, lat/lon). A front laid on a wall keeps the placer's
 * origin as its floor (y 0), as `hardRockFront` does: the building behind it is sunk by the same rule (lowest ground − 0.5),
 * so its gallery and fascia line up; the free-standing viewing rail is lifted by `fit.grade` to the boardwalk instead.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, EMIT, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign, type SignSpec } from '../signage.ts'
import { tube, lozenge, type V3 } from './wharf-carnival.ts'

const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const BT = surfaceTag('brick'), MT = surfaceTag('metal'), GT = surfaceTag('glass'), WT = surfaceTag('clapboard')
const WARM: Rgb = [1.0, 0.86, 0.55], WHITE: Rgb = [0.96, 0.96, 0.94], DARKGL: Rgb = [0.16, 0.19, 0.22]
const TIMBER: Rgb = [0.45, 0.37, 0.28], TIMBERD: Rgb = [0.34, 0.28, 0.21]

/** the drawing calls with every y lifted by `g` (the boardwalk over the placed origin) */
function kit(out: MeshBuilder, g: number) {
  return {
    b: (x: number, y: number, z: number, hx: number, hy: number, hz: number, c: Rgb, t: number): void => box(out, x, y + g, z, hx, hy, hz, c, t),
    s: (spec: SignSpec, x: number, y: number, z: number, heading = 0): void => sign(out, spec, { x, y: y + g, z, heading }),
    q: (p: V3[], n: V3, c: Rgb, t: number): void => out.quad(p.map(([x, y, z]) => [x, y + g, z] as V3), n, UVQ, c, t),
    t: (p0: V3, p1: V3, r: number, c: Rgb, t: number, sides = 6): void => tube(out, [p0[0], p0[1] + g, p0[2]], [p1[0], p1[1] + g, p1[2]], r, sides, c, t),
    lz: (c0: V3, u: V3, v: V3, n: V3, ru: number, rv: number, th: number, c: Rgb, t: number): void => lozenge(out, [c0[0], c0[1] + g, c0[2]], u, v, n, ru, rv, th, c, t),
  }
}
type Kit = ReturnType<typeof kit>

/** a wooden railing along local x from x0 to x1 at depth z, its deck at y: posts, a top and a mid rail, close balusters */
function rail(k: Kit, x0: number, x1: number, z: number, y: number, c: Rgb = TIMBER, h = 1.05, step = 0.16): void {
  const L = Math.abs(x1 - x0), xm = (x0 + x1) / 2
  k.b(xm, y + h, z, L / 2, 0.05, 0.06, c, WT)
  k.b(xm, y + 0.12, z, L / 2, 0.04, 0.05, c, WT)
  const n = Math.max(1, Math.round(L / step))
  for (let i = 0; i <= n; i++) {
    const x = Math.min(x0, x1) + (L * i) / n
    const post = i % Math.max(1, Math.round(1.8 / step)) === 0
    k.b(x, y + h / 2, z, post ? 0.06 : 0.022, h / 2, post ? 0.06 : 0.022, post ? TIMBERD : c, WT)
  }
}
/** the same along local z (a side rail), at x */
function railZ(k: Kit, z0: number, z1: number, x: number, y: number, c: Rgb = TIMBER, h = 1.05, step = 0.16): void {
  const L = Math.abs(z1 - z0), zm = (z0 + z1) / 2
  k.b(x, y + h, zm, 0.06, 0.05, L / 2, c, WT)
  k.b(x, y + 0.12, zm, 0.05, 0.04, L / 2, c, WT)
  const n = Math.max(1, Math.round(L / step))
  for (let i = 0; i <= n; i++) k.b(x, y + h / 2, Math.min(z0, z1) + (L * i) / n, 0.022, h / 2, 0.022, c, WT)
}

/** a filled 2-D outline (star-shaped about its first point) in the plane z = `z`, facing `nz` (±1), both faces */
function silhouette(k: Kit, pts: [number, number][], ox: number, oy: number, z: number, sx: number, sy: number, c: Rgb, t: number): void {
  const [cx, cy] = pts[0]
  const P = (p: [number, number], dz: number): V3 => [ox + p[0] * sx, oy + p[1] * sy, z + dz]
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i], b = pts[i + 1 < pts.length ? i + 1 : 1]
    k.q([P([cx, cy], 0.012), P(a, 0.012), P(b, 0.012), P(b, 0.012)], [0, 0, 1], c, t)
    k.q([P([cx, cy], -0.012), P(b, -0.012), P(a, -0.012), P(a, -0.012)], [0, 0, -1], c, t)
  }
}

/** an upright sea lion in profile, facing +x, about 1 high: the first point is the fan's centre */
const SEA_LION: [number, number][] = [
  [0.0, 0.3], [-0.42, 0.0], [0.2, 0.0], [0.34, 0.03], [0.22, 0.13], [0.16, 0.35], [0.13, 0.58], [0.2, 0.7], [0.3, 0.78],
  [0.27, 0.86], [0.12, 0.92], [0.02, 0.86], [-0.03, 0.66], [-0.14, 0.4], [-0.3, 0.2], [-0.46, 0.06],
]

/**
 * FOG HARBOR FISH HOUSE and WIPEOUT BAR & GRILL, on the east face of the building at Pier 39's entrance plaza (OSM
 * way/128240149; nodes 11423731476 Fog Harbor, 4259746692 Wipeout). Commons "Pier 39 at Night, SF, CA, jjron 25.03.2012"
 * (looking north up the plaza) and "Wipeout Bar & Grill exterior at San Francisco Pier 39, October 2016":
 *  - WIPEOUT at the boardwalk: a sky-blue clapboard shopfront with white trim, orange-framed glazed doors, spotlights
 *    under the timber deck above it, surfboards hung under the deck, and over the door the sign — a blue SURFBOARD with
 *    WIPEOUT in fat yellow letters outlined red and "Bar & Grill" in yellow script, two boards standing up behind it.
 *  - over it the upper DECK, plank on posts with a timber railing, and beside it FOG HARBOR's entrance: a white gabled
 *    porch on square columns, lit from inside, the navy arched board FOG HARBOR in white-lit serif capitals over
 *    FISH HOUSE; and the wide timber STAIR down to the plaza, south past the kiosk.
 *  - further north, the curved-topped pale blue gable end with FOG HARBOR FISH HOUSE painted big across it (seen in the
 *    background of the night photo; which face it is on is a guess — drawn on this east face, at the north end).
 * Origin on the main east wall line's midpoint (37.8090174, −122.4101683), rotateDeg 98.8: +x runs SOUTH along it. The
 * wall's southern 8 m is set back 2.7 m (the ring's jog), and the porch and the stair head stand in that recess.
 */
export function fogHarborFront(out: MeshBuilder, fit: Fit): void {
  const k = kit(out, 0)
  const GR = fit.grade ?? 0.5 // the boardwalk, where the stair lands
  const SKY: Rgb = [0.22, 0.58, 0.82], ORANGE: Rgb = [0.86, 0.55, 0.16], YEL: Rgb = [1.0, 0.85, 0.15], RED: Rgb = [0.85, 0.15, 0.1]
  const NAVY: Rgb = [0.07, 0.11, 0.24], PALE: Rgb = [0.66, 0.72, 0.78]
  const G = 4.2

  // ---- WIPEOUT, x 6.8 … 11.8 on the main wall
  const W0 = 6.8, W1 = 11.8, WM = (W0 + W1) / 2
  k.b(WM, 1.85, 0.08, (W1 - W0) / 2, 1.85, 0.08, SKY, WT)
  for (const x of [W0 + 0.05, W1 - 0.05]) k.b(x, 1.85, 0.18, 0.08, 1.85, 0.04, WHITE, WT)
  k.b(WM, 2.55, 0.2, (W1 - W0) / 2, 0.07, 0.05, WHITE, WT)
  // the window (left) with its white muntins, and the double doors in orange frames (right)
  k.b(W1 - 1.3, 1.35, 0.18, 0.95, 1.05, 0.02, DARKGL, GT)
  for (let i = 0; i <= 3; i++) k.b(W1 - 2.25 + i * 0.63, 1.35, 0.2, 0.025, 1.05, 0.02, WHITE, WT)
  for (let j = 0; j <= 5; j++) k.b(W1 - 1.3, 0.3 + j * 0.42, 0.2, 0.95, 0.025, 0.02, WHITE, WT)
  for (const dx of [-0.65, 0.65]) {
    const x = W0 + 1.9 + dx
    k.b(x, 1.2, 0.18, 0.6, 1.2, 0.02, [0.3, 0.24, 0.16], GT)
    k.b(x, 1.2, 0.2, 0.6, 1.2, 0.03, ORANGE, WT)
    k.b(x, 1.25, 0.24, 0.48, 1.05, 0.02, DARKGL, GT)
    for (let j = 1; j < 6; j++) k.b(x, 0.2 + j * 0.35, 0.26, 0.48, 0.02, 0.02, ORANGE, WT)
  }
  // a blue fascia, its spotlights, the bulbs along it
  k.b(WM, 3.0, 0.25, (W1 - W0) / 2 + 0.2, 0.35, 0.1, SKY, WT)
  for (let x = W0 + 0.4; x < W1; x += 0.9) { k.b(x, 3.38, 0.42, 0.06, 0.05, 0.12, [0.2, 0.2, 0.2], MT); k.b(x, 3.33, 0.52, 0.05, 0.04, 0.05, WARM, EMIT) }
  // surfboards hung under the deck, nose out, tilted
  const boards: [number, Rgb][] = [[W0 + 0.6, YEL], [W0 + 1.7, RED], [W1 - 1.6, [0.95, 0.55, 0.1]], [W1 - 0.5, [0.25, 0.7, 0.75]]]
  for (const [x, c] of boards) {
    k.lz([x, 3.75, 1.4], [0, 0.35, 0.94], [1, 0, 0], [0, 0.94, -0.35], 1.1, 0.25, 0.06, c, MT)
  }
  // THE SIGN: a blue surfboard out from the fascia, two boards standing up behind it, the name on it
  const SX = WM - 0.2, SY = 3.2, SZ = 2.0
  for (const [dx, c, lean] of [[-1.3, RED, -0.35], [-0.75, ORANGE, -0.2]] as [number, Rgb, number][]) {
    k.lz([SX + dx, SY + 0.45, SZ - 0.12], [Math.sin(lean), Math.cos(lean), 0], [Math.cos(lean), -Math.sin(lean), 0], [0, 0, 1], 0.6, 0.15, 0.05, c, MT)
  }
  k.lz([SX, SY, SZ], [1, 0.08, 0], [-0.08, 1, 0], [0, 0, 1], 2.3, 0.55, 0.14, [0.96, 0.96, 0.92], MT)
  k.lz([SX, SY, SZ + 0.02], [1, 0.08, 0], [-0.08, 1, 0], [0, 0, 1], 2.18, 0.47, 0.14, [0.16, 0.5, 0.86], MT)
  k.s({ type: 'flat', text: 'WIPEOUT', h: 0.42, face: 'block', weight: 'bold', colour: YEL, halo: RED, lit: 'self' }, SX, SY + 0.18, SZ + 0.1)
  k.s({ type: 'flat', text: 'Bar & Grill', h: 0.15, face: 'script', colour: YEL, lit: 'self' }, SX + 0.1, SY - 0.28, SZ + 0.1)
  for (const dx of [-1.2, 1.2]) k.t([SX + dx, 3.95, SZ - 0.1], [SX + dx, SY + 0.3, SZ - 0.1], 0.025, [0.25, 0.25, 0.25], MT, 4)

  // ---- the DECK over Wipeout, x 3 … 12.2, out 2.8, its posts and railing
  const D = 2.8, X0 = 3.0, X1 = 12.2
  k.b((X0 + X1) / 2, G - 0.12, D / 2, (X1 - X0) / 2, 0.12, D / 2, [0.5, 0.42, 0.33], WT)
  k.b((X0 + X1) / 2, G - 0.4, D - 0.1, (X1 - X0) / 2, 0.18, 0.1, TIMBERD, WT)
  for (const x of [X0 + 0.15, (X0 + X1) / 2, X1 - 0.15]) k.b(x, (G - 0.4) / 2, D - 0.15, 0.13, (G - 0.4) / 2, 0.13, TIMBERD, WT)
  rail(k, X0, X1, D - 0.08, G)
  railZ(k, 0, D, X0, G)

  // ---- FOG HARBOR's porch in the recess: landing deck x 12.2 … 19.6 from the recessed wall (z −2.7) out to D
  const P0 = 12.2, P1 = 19.6, PM = 15.4, RZ = -2.7
  k.b((P0 + P1) / 2, G - 0.12, (RZ + D) / 2, (P1 - P0) / 2, 0.12, (D - RZ) / 2, [0.5, 0.42, 0.33], WT)
  k.b(P1 - 0.2, (G - 0.24) / 2, D - 0.15, 0.13, (G - 0.24) / 2, 0.13, TIMBERD, WT)
  k.b(P1 - 0.2, (G - 0.24) / 2, RZ + 0.3, 0.13, (G - 0.24) / 2, 0.13, TIMBERD, WT)
  // the lit room behind the porch (warm glass), its door
  k.b(PM, G + 1.5, RZ + 0.06, 2.6, 1.5, 0.04, [0.55, 0.42, 0.28], EMIT)
  for (const x of [PM - 2.6, PM - 1.3, PM, PM + 1.3, PM + 2.6]) k.b(x, G + 1.5, RZ + 0.12, 0.05, 1.5, 0.04, WHITE, WT)
  // the porch: four white columns, the beam, the white gable and its roof back to the wall
  const FZ = 0.6, PW = 2.9
  for (const x of [PM - PW + 0.15, PM + PW - 0.15]) for (const z of [FZ, RZ + 0.5]) k.b(x, G + 1.5, z, 0.14, 1.5, 0.14, WHITE, WT)
  k.b(PM, G + 3.15, FZ, PW, 0.18, 0.16, WHITE, WT)
  for (const x of [PM - PW, PM + PW]) k.b(x, G + 3.15, (FZ + RZ) / 2, 0.1, 0.18, (FZ - RZ) / 2, WHITE, WT)
  const ridge = G + 5.0, eave = G + 3.3
  k.q([[PM - PW - 0.2, eave, FZ + 0.1], [PM + PW + 0.2, eave, FZ + 0.1], [PM, ridge, FZ + 0.1], [PM, ridge, FZ + 0.1]], [0, 0, 1], [0.93, 0.94, 0.92], WT)
  k.q([[PM - PW - 0.3, eave - 0.05, FZ + 0.12], [PM - PW - 0.1, eave - 0.05, FZ + 0.12], [PM, ridge - 0.12, FZ + 0.12], [PM, ridge + 0.1, FZ + 0.12]], [0, 0, 1], WHITE, WT)
  k.q([[PM + PW + 0.1, eave - 0.05, FZ + 0.12], [PM + PW + 0.3, eave - 0.05, FZ + 0.12], [PM, ridge + 0.1, FZ + 0.12], [PM, ridge - 0.12, FZ + 0.12]], [0, 0, 1], WHITE, WT)
  const ROOF: Rgb = [0.3, 0.32, 0.36]
  const sl = Math.hypot(PW + 0.3, ridge - eave)
  k.q([[PM - PW - 0.3, eave - 0.05, FZ + 0.4], [PM, ridge + 0.1, FZ + 0.4], [PM, ridge + 0.1, RZ], [PM - PW - 0.3, eave - 0.05, RZ]], [-(ridge - eave) / sl, (PW + 0.3) / sl, 0], ROOF, surfaceTag('tile'))
  k.q([[PM, ridge + 0.1, FZ + 0.4], [PM + PW + 0.3, eave - 0.05, FZ + 0.4], [PM + PW + 0.3, eave - 0.05, RZ], [PM, ridge + 0.1, RZ]], [(ridge - eave) / sl, (PW + 0.3) / sl, 0], ROOF, surfaceTag('tile'))
  // the downlights under the beam
  for (let x = PM - 2.2; x <= PM + 2.21; x += 1.1) k.b(x, G + 2.93, FZ - 0.05, 0.07, 0.03, 0.07, WARM, EMIT)
  // THE BOARD: navy, arched, FOG HARBOR over FISH HOUSE, in the gable
  k.b(PM, G + 3.75, FZ + 0.2, 2.15, 0.36, 0.05, NAVY, WT)
  k.lz([PM, G + 4.05, FZ + 0.2], [1, 0, 0], [0, 1, 0], [0, 0, 1], 2.15, 0.3, 0.1, NAVY, WT)
  k.b(PM, G + 3.37, FZ + 0.2, 1.3, 0.13, 0.05, NAVY, WT)
  k.s({ type: 'flat', text: 'FOG HARBOR', h: 0.38, w: 3.9, face: 'roman', weight: 'bold', colour: [0.99, 0.98, 0.94], lit: 'self' }, PM, G + 3.88, FZ + 0.27)
  k.s({ type: 'flat', text: 'FISH HOUSE', h: 0.13, face: 'grotesque', weight: 'bold', colour: [0.99, 0.98, 0.94], lit: 'self', tracking: 0.15 }, PM, G + 3.37, FZ + 0.27)
  // the railing round the landing's open sides (the stair leaves it at its south end)
  rail(k, P0, PM - PW - 0.2, D - 0.08, G)
  rail(k, PM + PW + 0.2, P1 - 0.1, D - 0.08, G)

  // ---- THE STAIR, down to the plaza from the landing's south end: x 19.6 → 26.6, z 0.6 … 2.6
  const S0 = P1, RUN = 7.0, N = 21, Z0 = 0.6, Z1 = 2.6
  for (let i = 0; i < N; i++) {
    const y = G - ((i + 1) * (G - GR)) / (N + 1), x = S0 + ((i + 0.5) * RUN) / N
    k.b(x, y, (Z0 + Z1) / 2, RUN / N / 2 + 0.02, 0.04, (Z1 - Z0) / 2, [0.5, 0.42, 0.33], WT)
  }
  for (const z of [Z0, Z1]) {
    // the stringer, the handrail on posts
    k.t([S0, G - 0.15, z], [S0 + RUN, GR - 0.05, z], 0.12, TIMBERD, WT, 4)
    k.t([S0, G + 1.0, z], [S0 + RUN, GR + 1.0, z], 0.045, TIMBER, WT, 4)
    for (let i = 0; i <= 4; i++) { const x = S0 + (RUN * i) / 4, y = G - ((G - GR) * i) / 4; k.b(x, y + 0.45, z, 0.06, 0.55, 0.06, TIMBERD, WT) }
  }

  // ---- the curved gable end at the north, FOG HARBOR FISH HOUSE painted across it
  const C0 = -12.0, C1 = -4.0, CM = (C0 + C1) / 2, CW = (C1 - C0) / 2, CY = 7.4, CR = 2.6, CZ = 0.12
  k.b(CM, (G + CY) / 2, CZ, CW, (CY - G) / 2, 0.06, PALE, WT)
  const arcN = 14
  for (let i = 0; i < arcN; i++) {
    const a0 = Math.PI * (i / arcN), a1 = Math.PI * ((i + 1) / arcN)
    const x0 = CM + Math.cos(a0) * CW, y0 = CY + Math.sin(a0) * CR, x1 = CM + Math.cos(a1) * CW, y1 = CY + Math.sin(a1) * CR
    k.q([[x0, CY, CZ + 0.06], [x0, y0, CZ + 0.06], [x1, y1, CZ + 0.06], [x1, CY, CZ + 0.06]], [0, 0, 1], PALE, WT)
    // the curved roof behind it, back to the building
    const nx = (Math.cos((a0 + a1) / 2)), ny = Math.sin((a0 + a1) / 2)
    k.q([[x0, y0, CZ + 0.1], [x1, y1, CZ + 0.1], [x1, y1, -6], [x0, y0, -6]], [nx, ny, 0], [0.36, 0.38, 0.42], MT)
    // the white trim along the curve
    k.t([x0, y0, CZ + 0.12], [x1, y1, CZ + 0.12], 0.06, WHITE, WT, 4)
  }
  k.s({ type: 'flat', text: 'FOG HARBOR FISH HOUSE', h: 0.42, w: 7.0, face: 'roman', weight: 'bold', colour: NAVY, lit: 'front' }, CM, CY + 0.7, CZ + 0.1)
  // the painted fish under the name
  silhouette(k, [[0, 0], [-0.9, 0.0], [-0.6, 0.22], [0, 0.3], [0.7, 0.18], [1.0, 0.0], [0.7, -0.18], [0, -0.28], [-0.6, -0.2], [-0.9, 0.0]], CM, CY - 0.4, CZ + 0.1, 1.2, 1.2, [0.3, 0.38, 0.5], WT)
  silhouette(k, [[0, 0], [0, 0.3], [-0.5, 0.0], [0, -0.3]], CM - 1.05, CY - 0.4, CZ + 0.1, 1.0, 1.0, [0.3, 0.38, 0.5], WT)
  for (const x of [C0 + 0.05, C1 - 0.05]) k.b(x, (G + CY) / 2, CZ + 0.1, 0.08, (CY - G) / 2, 0.04, WHITE, WT)
}

/**
 * PLAYERS SPORTS GRILL & ARCADE with BUBBA GUMP SHRIMP CO. upstairs, the corrugated-iron front on the plaza by the stage
 * and the carousel (OSM way/128240131, its west face; nodes 2365845685 Player's, 378743791 Bubba Gump). Commons "Pier 39 -
 * July 2025 - Sarah Stierch" (from the north end, looking south over the stage): two storeys under a ragged parapet of
 * rusty corrugated iron; upstairs two big windows under royal-blue awnings — SHRIMP • FRESH FISH • FUN and ★ OPEN LATE ★
 * — the left one with the red BUBBA GUMP neon in a white oval; downstairs brick piers and dark glass under one long red
 * awning, SPORTSGRILL · ARCADE in white with FAMILY DINING & GAMES · LIVE SPORTS on the valance, and in front a patio
 * fenced in green-framed glass with PLAYERS' menu board on a blue post. The round painted Bubba Gump badge (Commons "Sign
 * of Bubba Gump Shrimp Company (TK)") is hung on the parapet.
 * `pier39Shop` gives this wall an upper gallery 1.7 m deep; the upper front stands at its outer edge (z 1.75), hiding it,
 * as the photo has no gallery here. Origin on the wall's midpoint (37.8109263, −122.4106620), rotateDeg 246.1: +x is NNW.
 */
export function playersBubbaFront(out: MeshBuilder, fit: Fit): void {
  const k = kit(out, 0)
  // (what stands on the boardwalk in front — the patio, the menu board — stands on the boardwalk)
  const kg = kit(out, fit.grade ?? 0.5)
  const W = 6.55, G = 3.95, UZ = 1.78
  const IRON: Rgb = [0.55, 0.55, 0.52], RUST: Rgb = [0.52, 0.38, 0.28], BRICK: Rgb = [0.55, 0.26, 0.2], RED: Rgb = [0.78, 0.13, 0.13]
  const BLUE: Rgb = [0.1, 0.3, 0.75], GREEN: Rgb = [0.1, 0.36, 0.26], CREAM: Rgb = [0.97, 0.95, 0.9]
  // ---- downstairs: brick piers, dark glass, a brick sill
  k.b(0, G / 2, 0.06, W, G / 2, 0.06, BRICK, BT)
  for (const [x0, x1] of [[-6.0, -2.4], [-1.8, 1.8], [2.4, 5.2]]) k.b((x0 + x1) / 2, 1.7, 0.14, (x1 - x0) / 2, 1.2, 0.03, DARKGL, GT)
  k.b(0, 0.25, 0.15, W, 0.25, 0.05, [0.48, 0.22, 0.17], BT)
  // the red awning: from the wall under the gallery out to z 1.7, the valance with the words
  const AY0 = 3.85, AY1 = 2.55, AZ = 1.72, AX0 = -6.4, AX1 = 4.6
  const sl = Math.hypot(AZ, AY0 - AY1)
  k.q([[AX0, AY0, 0.12], [AX1, AY0, 0.12], [AX1, AY1, AZ], [AX0, AY1, AZ]], [0, AZ / sl, (AY0 - AY1) / sl], RED, WT)
  k.q([[AX0, AY0, 0.12], [AX0, AY1, AZ], [AX0, AY1 - 0.6, AZ], [AX0, AY1 - 0.6, 0.12]], [-1, 0, 0], RED, WT)
  k.q([[AX1, AY0, 0.12], [AX1, AY0 - 0.6, 0.12], [AX1, AY1 - 0.6, AZ], [AX1, AY1, AZ]], [1, 0, 0], RED, WT)
  k.b((AX0 + AX1) / 2, AY1 - 0.3, AZ, (AX1 - AX0) / 2, 0.3, 0.02, RED, WT)
  k.b((AX0 + AX1) / 2, AY1 - 0.55, AZ + 0.02, (AX1 - AX0) / 2, 0.04, 0.02, CREAM, WT)
  k.s({ type: 'flat', text: 'SPORTSGRILL · ARCADE', h: 0.28, w: 7.8, face: 'slab', weight: 'bold', colour: CREAM, lit: 'front' }, (AX0 + AX1) / 2, AY1 - 0.2, AZ + 0.04)
  k.s({ type: 'flat', text: 'FAMILY DINING & GAMES  ·  LIVE SPORTS  ·  WATERFRONT DINING', h: 0.07, w: 7.0, face: 'roman', weight: 'bold', colour: CREAM, lit: 'none' }, (AX0 + AX1) / 2, AY1 - 0.46, AZ + 0.04)
  // ---- upstairs, at the gallery's outer edge: corrugated iron, rust panels, ragged parapet steps
  const top = (x: number): number => (x > 2.6 ? 8.3 : x > -1.2 ? 9.4 : 8.9)
  for (const [x0, x1] of [[-W, -1.2], [-1.2, 2.6], [2.6, W]]) {
    const h = top((x0 + x1) / 2)
    k.b((x0 + x1) / 2, (G + h) / 2, UZ, (x1 - x0) / 2, (h - G) / 2, 0.05, IRON, MT)
    for (let x = x0 + 0.1; x < x1; x += 0.18) k.b(x, (G + h) / 2, UZ + 0.06, 0.03, (h - G) / 2, 0.015, [0.48, 0.48, 0.46], MT)
    k.b((x0 + x1) / 2, h - 0.75, UZ + 0.08, (x1 - x0) / 2 - 0.2, 0.6, 0.012, RUST, MT)
    k.b((x0 + x1) / 2, h + 0.06, UZ, (x1 - x0) / 2 + 0.03, 0.06, 0.09, [0.4, 0.4, 0.38], MT)
  }
  // the returns from the wall out to the front, each end
  for (const x of [-W, W]) k.b(x, (G + 8.3) / 2, UZ / 2, 0.05, (8.3 - G) / 2, UZ / 2, IRON, MT)
  // the two big windows: white frames, dark glass
  const win = (cx: number): void => {
    k.b(cx, 5.85, UZ + 0.08, 1.85, 1.1, 0.04, WHITE, WT)
    k.b(cx, 5.85, UZ + 0.12, 1.7, 0.98, 0.02, [0.12, 0.13, 0.16], GT)
  }
  win(2.9); win(-1.3)
  // the BUBBA GUMP neon in the left window: a white oval and the red script
  const OX = 2.9, OY = 5.95, OZ = UZ + 0.16
  for (let i = 0; i < 28; i++) {
    const a0 = (i / 28) * Math.PI * 2, a1 = ((i + 1) / 28) * Math.PI * 2
    k.t([OX + Math.cos(a0) * 1.15, OY + Math.sin(a0) * 0.62, OZ], [OX + Math.cos(a1) * 1.15, OY + Math.sin(a1) * 0.62, OZ], 0.022, [0.95, 0.95, 1], EMIT, 4)
  }
  k.s({ type: 'flat', text: 'Bubba Gump', h: 0.42, face: 'script', colour: [1, 0.25, 0.22], halo: [0.6, 0.05, 0.05], lit: 'self' }, OX, OY + 0.02, OZ + 0.01)
  k.s({ type: 'flat', text: 'SHRIMP CO.', h: 0.08, face: 'grotesque', weight: 'bold', colour: [0.95, 0.95, 1], lit: 'self' }, OX, OY - 0.35, OZ + 0.01)
  k.s({ type: 'flat', text: 'SHRIMP', h: 0.16, face: 'grotesque', colour: [0.85, 0.9, 1], lit: 'self' }, -1.3, 6.4, OZ + 0.01)
  // the blue awnings over the windows, their words
  for (const [cx, words] of [[2.9, 'SHRIMP • FRESH FISH • FUN'], [-1.3, '• • •  OPEN LATE  • • •']] as [number, string][]) {
    const y0 = 7.75, y1 = 7.1, z1 = UZ + 0.9, x0 = cx - 1.95, x1 = cx + 1.95
    const s2 = Math.hypot(z1 - UZ, y0 - y1)
    k.q([[x0, y0, UZ + 0.05], [x1, y0, UZ + 0.05], [x1, y1, z1], [x0, y1, z1]], [0, (z1 - UZ) / s2, (y0 - y1) / s2], BLUE, WT)
    k.b(cx, y1 - 0.2, z1, 1.95, 0.2, 0.02, BLUE, WT)
    for (const x of [x0, x1]) k.q([[x, y0, UZ + 0.05], [x, y1, z1], [x, y1 - 0.4, z1], [x, y1 - 0.4, UZ + 0.05]], [x === x0 ? -1 : 1, 0, 0], BLUE, WT)
    k.s({ type: 'flat', text: words, h: 0.15, w: 3.6, face: 'slab', weight: 'bold', colour: CREAM, lit: 'front' }, cx, y1 - 0.2, z1 + 0.03)
  }
  // the round painted BUBBA GUMP badge on the parapet: white ring, navy disc, the red-on-white band
  const BX = 0.7, BY = 8.35, BZ = UZ + 0.12
  k.lz([BX, BY, BZ], [1, 0, 0], [0, 1, 0], [0, 0, 1], 0.98, 0.98, 0.06, [0.75, 0.12, 0.12], WT)
  k.lz([BX, BY, BZ + 0.01], [1, 0, 0], [0, 1, 0], [0, 0, 1], 0.93, 0.93, 0.06, [0.96, 0.94, 0.9], WT)
  k.lz([BX, BY - 0.05, BZ + 0.025], [1, 0, 0], [0, 1, 0], [0, 0, 1], 0.72, 0.68, 0.06, [0.1, 0.12, 0.3], WT)
  k.b(BX, BY + 0.05, BZ + 0.07, 1.16, 0.24, 0.02, [0.75, 0.12, 0.12], WT)
  k.b(BX, BY + 0.05, BZ + 0.075, 1.11, 0.2, 0.02, [0.96, 0.94, 0.9], WT)
  k.s({ type: 'flat', text: 'BUBBA GUMP', h: 0.26, w: 2.1, face: 'roman', weight: 'bold', colour: [0.75, 0.12, 0.12], lit: 'front', standoff: 0.03 }, BX, BY + 0.05, BZ + 0.1)
  k.s({ type: 'flat', text: 'SHRIMP CO.', h: 0.13, face: 'grotesque', colour: WHITE, lit: 'front' }, BX, BY - 0.4, BZ + 0.09)
  // ---- the PATIO in front: green-framed glass, x −6.4 … 3.4, out to z 3.6
  const PZ = 3.6, Q0 = -6.4, Q1 = 3.4, FH = 1.15
  const fence = (a: V3, b: V3): void => {
    const L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.round(L / 1.6))
    kg.t([a[0], FH, a[2]], [b[0], FH, b[2]], 0.05, GREEN, MT, 4)
    kg.t([a[0], 0.15, a[2]], [b[0], 0.15, b[2]], 0.04, GREEN, MT, 4)
    for (let i = 0; i <= n; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / n, z = a[2] + ((b[2] - a[2]) * i) / n
      kg.b(x, FH / 2, z, 0.05, FH / 2, 0.05, GREEN, MT)
    }
    const nx = (b[2] - a[2]) / L, nz = -(b[0] - a[0]) / L
    kg.q([[a[0], 0.17, a[2]], [b[0], 0.17, b[2]], [b[0], FH - 0.02, b[2]], [a[0], FH - 0.02, a[2]]], [-nx, 0, -nz], [0.62, 0.72, 0.72], GT)
    kg.q([[b[0], 0.17, b[2]], [a[0], 0.17, a[2]], [a[0], FH - 0.02, a[2]], [b[0], FH - 0.02, b[2]]], [nx, 0, nz], [0.62, 0.72, 0.72], GT)
  }
  fence([Q0, 0, 0.2], [Q0, 0, PZ - 0.6]); fence([Q0, 0, PZ - 0.6], [Q0 + 0.6, 0, PZ]); fence([Q0 + 0.6, 0, PZ], [Q1 - 0.6, 0, PZ])
  fence([Q1 - 0.6, 0, PZ], [Q1, 0, PZ - 0.6]); fence([Q1, 0, PZ - 0.6], [Q1, 0, 1.6])
  // tables inside
  for (const [x, z] of [[-4.6, 2.4], [-2.0, 2.4], [0.6, 2.4]]) {
    kg.t([x, 0, z], [x, 0.72, z], 0.04, [0.2, 0.2, 0.2], MT, 5)
    kg.b(x, 0.74, z, 0.45, 0.025, 0.45, [0.3, 0.26, 0.22], WT)
  }
  // PLAYERS' menu board on its blue post, out by the patio's corner
  kg.t([4.1, 0, PZ + 0.4], [4.1, 2.1, PZ + 0.4], 0.05, BLUE, MT, 6)
  kg.t([5.1, 0, PZ + 0.4], [5.1, 2.1, PZ + 0.4], 0.05, BLUE, MT, 6)
  kg.b(4.6, 1.45, PZ + 0.4, 0.5, 0.45, 0.04, [0.95, 0.93, 0.88], WT)
  kg.b(4.6, 2.0, PZ + 0.42, 0.55, 0.13, 0.05, [0.72, 0.12, 0.14], WT)
  kg.s({ type: 'flat', text: 'PLAYERS', h: 0.12, face: 'slab', weight: 'bold', colour: [1, 0.85, 0.3], lit: 'front' }, 4.6, 2.0, PZ + 0.48)
  kg.s({ type: 'flat', text: 'ARCADE & SPORTSGRILL', h: 0.05, face: 'grotesque', weight: 'bold', colour: [0.1, 0.2, 0.5], lit: 'none' }, 4.6, 1.75, PZ + 0.45)
}

/**
 * The PIER 39 SIGN AT THE SEA LIONS, on its own float out on K-Dock (OSM node 1417635914 "Pier 39 Sea Lions"; Commons
 * "San Francisco (CA, USA), Fisherman's Wharf, Pier 39, Sea Lion Viewing Area -- 2022 -- 185143" and "Leoni marini -
 * panoramio"): an open square box of royal-blue boards on four timber legs, each board arched up in the middle with PIER
 * over a big 39 in white serif, and a golden sea lion sitting up either side of the arch; by it the navy board PLEASE
 * DON'T FEED OR HARASS OUR SEA LION FRIENDS on two posts. Faces ENE, to the viewing rail (rotateDeg 65.6); placed at the
 * sea (`deckAbove: 0`). The sea lions on the floats are TRIPO.md #6's (`seaLionFloats`), not modelled here.
 */
export function seaLionSign(out: MeshBuilder, _fit: Fit): void {
  const k = kit(out, 0)
  const BLUE: Rgb = [0.1, 0.3, 0.72], GOLD: Rgb = [0.9, 0.68, 0.28], DECK: Rgb = [0.42, 0.38, 0.33]
  // the float: a plank deck on a black pontoon; and K-Dock's other floats round it, empty (OSM draws them, the bake
  // does not, and `seaLionFloats` with its sea lions stands at J-Dock — see the manifest note)
  const float = (cx: number, cz: number, hx: number, hz: number): void => {
    k.b(cx, 0.1, cz, hx - 0.1, 0.2, hz - 0.1, [0.12, 0.12, 0.12], MT)
    k.b(cx, 0.4, cz, hx, 0.06, hz, DECK, WT)
    for (let x = cx - hx + 0.2; x <= cx + hx - 0.2; x += 0.6) k.b(x, 0.49, cz, 0.012, 0.005, hz - 0.05, [0.38, 0.33, 0.27], WT)
  }
  float(0, 0, 3.5, 2.7)
  for (const [cx, cz] of [[-7.6, 0], [7.6, 0], [-7.6, -6.2], [0, -6.2], [7.6, -6.2], [-3.8, 6.0], [3.8, 6.0]]) float(cx, cz, 3.5, 2.7)
  // the four legs and the box of boards
  const R = 1.3, Y0 = 2.0, BH = 0.8
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.b(sx * (R - 0.06), 1.2, sz * (R - 0.06), 0.06, 0.8, 0.06, TIMBER, WT)
  for (let f = 0; f < 4; f++) {
    const hd = (f * Math.PI) / 2
    const s = Math.sin(hd), c = Math.cos(hd)
    // a board in the face's own frame: across a (local), up y, out d
    const P = (a: number, y: number, d: number): V3 => [c * a + s * (R + d), y, -s * a + c * (R + d)]
    const n: V3 = [s, 0, c]
    k.q([P(-R, Y0, 0.02), P(R, Y0, 0.02), P(R, Y0 + BH, 0.02), P(-R, Y0 + BH, 0.02)], n, BLUE, WT)
    k.q([P(R, Y0, -0.02), P(-R, Y0, -0.02), P(-R, Y0 + BH, -0.02), P(R, Y0 + BH, -0.02)], [-s, 0, -c], [0.08, 0.22, 0.55], WT)
    // the arch over the middle
    for (let i = 0; i < 10; i++) {
      const a0 = Math.PI * (i / 10), a1 = Math.PI * ((i + 1) / 10)
      k.q([P(Math.cos(a0) * 0.62, Y0 + BH, 0.02), P(Math.cos(a0) * 0.62, Y0 + BH + Math.sin(a0) * 0.42, 0.02), P(Math.cos(a1) * 0.62, Y0 + BH + Math.sin(a1) * 0.42, 0.02), P(Math.cos(a1) * 0.62, Y0 + BH, 0.02)], n, BLUE, WT)
      k.q([P(Math.cos(a1) * 0.62, Y0 + BH, -0.02), P(Math.cos(a1) * 0.62, Y0 + BH + Math.sin(a1) * 0.42, -0.02), P(Math.cos(a0) * 0.62, Y0 + BH + Math.sin(a0) * 0.42, -0.02), P(Math.cos(a0) * 0.62, Y0 + BH, -0.02)], [-s, 0, -c], [0.08, 0.22, 0.55], WT)
    }
    // the thin white line inside the edge
    const L1 = P(-R + 0.08, Y0 + 0.08, 0.03), L2 = P(R - 0.08, Y0 + 0.08, 0.03)
    k.t(L1, L2, 0.012, WHITE, WT, 4)
    const ptxt = P(0, Y0 + BH + 0.12, 0.04), ntxt = P(0, Y0 + 0.4, 0.04)
    k.s({ type: 'flat', text: 'PIER', h: 0.16, face: 'didone', weight: 'bold', colour: WHITE, lit: 'none' }, ptxt[0], ptxt[1], ptxt[2], hd)
    k.s({ type: 'flat', text: '39', h: 0.48, face: 'didone', weight: 'bold', colour: WHITE, lit: 'none' }, ntxt[0], ntxt[1], ntxt[2], hd)
    // the golden sea lions either side, facing in to the arch
    for (const side of [-1, 1]) {
      // (in the face's own frame, so laid out point by point rather than with `silhouette`, which is fixed to z)
      const pts = SEA_LION.map(([px, py]) => [-side * px * 0.62, py * 0.72] as [number, number])
      const Q = (p: [number, number], d: number): V3 => P(side * 0.95 + p[0], Y0 + 0.06 + p[1], 0.04 + d)
      const [cx, cy] = pts[0]
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i], b = pts[i + 1 < pts.length ? i + 1 : 1]
        k.q([Q([cx, cy], 0), Q(a, 0), Q(b, 0), Q(b, 0)], n, GOLD, WT)
      }
    }
  }
  // PLEASE DON'T FEED, on two posts at the float's corner
  const NX = 2.4, NZ = 1.6
  for (const dx of [-0.45, 0.45]) k.b(NX + dx, 1.4, NZ, 0.05, 1.0, 0.05, TIMBER, WT)
  k.b(NX, 2.0, NZ + 0.07, 0.55, 0.62, 0.025, [0.12, 0.16, 0.42], WT)
  silhouette(k, SEA_LION.map(([x, y]) => [x * 0.3, y * 0.3] as [number, number]), NX, 2.32, NZ + 0.1, 1, 1, GOLD, WT)
  for (const [t, y] of [["PLEASE DON'T FEED", 1.98], ['OR HARASS OUR', 1.84], ['SEA LION FRIENDS', 1.7]] as [string, number][]) {
    k.s({ type: 'flat', text: t, h: 0.07, w: 0.95, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'none' }, NX, y, NZ + 0.11)
  }
  k.s({ type: 'flat', text: 'PIER 39', h: 0.07, face: 'didone', weight: 'bold', colour: WHITE, lit: 'none' }, NX, 1.52, NZ + 0.11)
}

/**
 * THE SEA LION VIEWING RAIL along Pier 39's west edge at K-Dock (OSM fence way/555946325, the stretch beside Building K):
 * a heavy timber railing with wire panels the length of the walk, a platform out over the water on piles at the middle
 * where people crowd to look (Commons "Tourists observing sea lions at Pier 39"), coin-op viewers on it, and the
 * interpretive boards on the rail (navy, PIER 39 · SEA LIONS — the boards' wording is a guess). Origin on the fence
 * line's midpoint (37.8107817, −122.4112674), rotateDeg 245.6: faces out to the water; +x runs NNW along the edge.
 */
export function seaLionViewing(out: MeshBuilder, fit: Fit): void {
  const k = kit(out, fit.grade ?? 0.5)
  const L = 20, NAVY: Rgb = [0.12, 0.16, 0.42], WIRE: Rgb = [0.55, 0.57, 0.58]
  const PX0 = -4.5, PX1 = 4.5, PD = 4.0
  // the rail along the edge, but for the platform's mouth
  for (const [x0, x1] of [[-L, PX0], [PX1, L]]) {
    rail(k, x0, x1, 0.1, 0, TIMBER, 1.1, 2.2)
    k.q([[x0, 0.2, 0.12], [x1, 0.2, 0.12], [x1, 1.0, 0.12], [x0, 1.0, 0.12]], [0, 0, 1], WIRE, MT)
    k.q([[x1, 0.2, 0.08], [x0, 0.2, 0.08], [x0, 1.0, 0.08], [x1, 1.0, 0.08]], [0, 0, -1], WIRE, MT)
  }
  // the platform: plank deck on a frame and piles, its rail round three sides
  k.b(0, -0.12, PD / 2 + 0.1, (PX1 - PX0) / 2, 0.12, PD / 2, [0.5, 0.43, 0.35], WT)
  k.b(0, -0.4, PD, (PX1 - PX0) / 2, 0.16, 0.12, TIMBERD, WT)
  for (const x of [PX0 + 0.2, 0, PX1 - 0.2]) k.t([x, -0.3, PD - 0.1], [x, -1.45, PD - 0.1], 0.18, [0.28, 0.24, 0.2], WT, 8)
  for (const x of [PX0 + 0.2, PX1 - 0.2]) k.t([x, -0.3, 1.2], [x, -1.45, 1.2], 0.18, [0.28, 0.24, 0.2], WT, 8)
  rail(k, PX0, PX1, PD + 0.05, 0, TIMBER, 1.1, 0.14)
  railZ(k, 0.1, PD + 0.05, PX0, 0, TIMBER, 1.1, 0.14)
  railZ(k, 0.1, PD + 0.05, PX1, 0, TIMBER, 1.1, 0.14)
  // the coin-op viewers on the platform's rail
  for (const x of [-2.6, 0, 2.6]) {
    k.t([x, 0, PD - 0.45], [x, 1.15, PD - 0.45], 0.06, [0.25, 0.3, 0.32], MT, 6)
    k.b(x, 1.3, PD - 0.45, 0.13, 0.15, 0.22, [0.2, 0.36, 0.52], MT)
    k.b(x, 1.33, PD - 0.18, 0.06, 0.06, 0.06, [0.15, 0.15, 0.15], MT)
  }
  // interpretive boards, on the rail looking back at the walk
  for (const x of [-12, 12]) {
    k.b(x, 1.6, 0.0, 0.9, 0.45, 0.03, NAVY, WT)
    for (const dx of [-0.85, 0.85]) k.b(x + dx, 0.9, 0.0, 0.04, 0.9, 0.04, TIMBERD, WT)
    k.s({ type: 'flat', text: 'SEA LIONS', h: 0.16, face: 'didone', weight: 'bold', colour: WHITE, lit: 'front' }, x, 1.78, -0.04, Math.PI)
    k.s({ type: 'flat', text: 'PIER 39 · K-DOCK · SINCE 1990', h: 0.06, face: 'grotesque', weight: 'bold', colour: [0.9, 0.8, 0.5], lit: 'none' }, x, 1.5, -0.04, Math.PI)
  }
}

export const PIER39_FRONTS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  fogHarborFront, playersBubbaFront, seaLionSign, seaLionViewing,
}
