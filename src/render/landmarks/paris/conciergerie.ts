import type { MeshBuilder } from '../../buildings.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam, block, hex, roof, shade } from '../kit.ts'
import { clockFace } from '../parts.ts'
import { archOn, rectOn, slabOn } from './palaces/common.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * THE CONCIERGERIE's front on the Quai de l'Horloge (top-25 audit, 2026-10-30): the walk along the Seine's best-known medieval skyline, which
 * was six rows of flats between two flat-topped drums. Read off "Paris Conciergerie 265.jpg" (Commons), an elevation from the far bank, at
 * 0.0963 m to its pixel (IGN's aerial has the Horloge's middle and the Bonbec's 103 m apart), x from the picture's middle, y from the pavement:
 *
 * - TOUR DE L'HORLOGE at the corner of the Boulevard du Palais: square, 12 m, 30 m to its cornice, a hipped roof, the open lantern with its
 *   chevroned cap to 43 m; on its east face (the viewer's left, as the bridge sees it) the great clock of 1370 in its blue and gold;
 * - TOUR DE CÉSAR and TOUR D'ARGENT: the twin drums, r ≈ 5, 21 m, under their tall slate cones to 33 m, a gabled bay with a Gothic window and
 *   the little door between them;
 * - TOUR BONBEC to the west, the oldest, its crenellated head and a narrower cone;
 * - the two ranges between, stone of the 1850s: tiers of windows, the tall Gothic lucarnes in a steep slate roof, chimneys and the iron crest.
 *
 * Local frame: the front looks −z (entry: front 22.8, across the river), viewer's right +x (the west). Drawn in real metres; it does not fit
 * itself to a footprint. The Palais de Justice behind is OSM's own parts; those of them along the quay this replaces.
 */
const STONE: Rgb = hex('#cfc6af')
const TRIM: Rgb = shade(STONE, 1.07)
const BAND: Rgb = shade(STONE, 0.9)
const DRUM: Rgb = hex('#d4ccb9')
const SLATE: Rgb = hex('#3f4650')
const CAP: Rgb = hex('#353b45')
const LEAD: Rgb = hex('#4a4f53')
const GLASS: Rgb = [0.13, 0.15, 0.18]
const DOOR: Rgb = [0.14, 0.13, 0.13]
const BLUE: Rgb = hex('#1d3a78')
const GOLD: Rgb = [0.83, 0.65, 0.25]
const plain = surfaceTag('stucco')

const D = 13.5
const X = (px: number): number => (px - 640) * 0.0963
const Y = (py: number): number => (505 - py) * 0.0963

/** A stone cross-window: its surround, the pane, the cross of its mullion and transom. */
function cross(q: MeshBuilder, x: number, y0: number, y1: number, w: number, arched = false): void {
  rectOn(q, '-z', 0, x - w / 2 - 0.22, x + w / 2 + 0.22, y0 - 0.2, y1 + 0.2, TRIM, 0.04)
  if (arched) {
    rectOn(q, '-z', 0, x - w / 2, x + w / 2, y0, y1 - w / 2, GLASS, 0.07)
    archOn(q, '-z', 0, x, y1 - w, w, w, GLASS, 0.07)
  } else rectOn(q, '-z', 0, x - w / 2, x + w / 2, y0, y1, GLASS, 0.07)
  rectOn(q, '-z', 0, x - 0.05, x + 0.05, y0, y1, TRIM, 0.09)
  rectOn(q, '-z', 0, x - w / 2, x + w / 2, y0 + (y1 - y0) * 0.62, y0 + (y1 - y0) * 0.62 + 0.1, TRIM, 0.09)
}

/** One of the range's Gothic lucarnes: stone cheeks, a window, a steep gable and its pinnacles. */
function lucarne(q: MeshBuilder, x: number, y: number): void {
  const z = 1.3
  block(q, x - 1.05, x + 1.05, z, z + 2, y, y + 2.6, TRIM)
  q.quad([[x - 0.62, y + 0.4, z - 0.03], [x + 0.62, y + 0.4, z - 0.03], [x + 0.62, y + 2.3, z - 0.03], [x - 0.62, y + 2.3, z - 0.03]], [0, 0, -1], UV, GLASS, FIXED)
  q.quad([[x - 1.2, y + 2.6, z], [x + 1.2, y + 2.6, z], [x, y + 4.6, z], [x, y + 4.6, z]], [0, 0, -1], UV, TRIM, FIXED)
  for (const s of [-1, 1]) {
    q.quad([[x + s * 1.2, y + 2.6, z], [x, y + 4.6, z], [x, y + 4.6, z + 2], [x + s * 1.2, y + 2.6, z + 2]], [s * 0.85, 0.5, 0], UV, SLATE, FIXED)
    prism(q, x + s * 1.2, z + 0.05, y + 2.4, y + 3.9, 0.17, 4, TRIM, FIXED, 0.03)
  }
  prism(q, x, z + 0.05, y + 4.5, y + 5.3, 0.13, 4, TRIM, FIXED, 0.02)
}

/** A range between x0 and x1: its stone wall, its tiers (`rows` of [y0, y1] per window), the roof and its lucarnes, chimneys and crest. */
function ranges(q: MeshBuilder, x0: number, x1: number, eaves: number, ridge: number, bays: number[], rows: [number, number, number, boolean][], chim: number[], luc: number[]): void {
  block(q, x0, x1, 0, D, 0, eaves, STONE)
  for (const x of bays) for (const [y0, y1, w, arched] of rows) cross(q, x, y0, y1, w, arched)
  // string courses and the cornice
  for (const y of [rows[0][1] + 0.6, rows[rows.length - 1][0] - 0.5]) slabOn(q, '-z', 0, x0, x1, y, y + 0.28, 0.2, TRIM)
  slabOn(q, '-z', 0, x0, x1, eaves - 0.6, eaves, 0.6, TRIM)
  // the plinth
  slabOn(q, '-z', 0, x0, x1, 0, 1.05, 0.15, BAND)
  // the roof, its ridge along the range
  const run = D / 2 + 0.15
  roof(q, x0, x1, -0.15, D + 0.15, eaves, ridge - eaves, 0.01, run - 0.8, SLATE)
  block(q, x0 + 0.5, x1 - 0.5, D / 2 - 0.65, D / 2 + 0.65, ridge - 0.05, ridge + 0.05, LEAD)
  // the crest along the ridge
  const n = Math.round((x1 - x0) / 1.2)
  block(q, x0 + 0.5, x1 - 0.5, D / 2 - 0.03, D / 2 + 0.03, ridge + 0.72, ridge + 0.8, LEAD)
  for (let i = 0; i <= n; i++) { const x = x0 + 0.5 + ((x1 - x0 - 1) * i) / n; block(q, x - 0.03, x + 0.03, D / 2 - 0.03, D / 2 + 0.03, ridge, ridge + 0.75, LEAD) }
  for (const x of luc) lucarne(q, x, eaves + 0.05)
  for (const x of chim) {
    block(q, x - 0.55, x + 0.55, 3.2, 4.4, eaves + 1, ridge + 2.2, TRIM)
    block(q, x - 0.66, x + 0.66, 3.1, 4.5, ridge + 2, ridge + 2.3, BAND)
  }
}

/** A drum with its cone: `top` the wall, `apex` the point; string courses, slit windows. */
function drum(q: MeshBuilder, x: number, z: number, r: number, top: number, apex: number, windows: [number, number, number][], chim: number, crenel = false): void {
  prism(q, x, z, 0, top, r, 24, DRUM, plain)
  for (const y of [Y(465), Y(375)]) prism(q, x, z, y, y + 0.28, r + 0.14, 24, TRIM, plain)
  // the battered foot
  prism(q, x, z, 0, 1.6, r + 0.4, 24, BAND, plain, r)
  for (const [a, y, h] of windows) {
    const nx = Math.sin(a), nz = -Math.cos(a)
    const tx = -nz, tz = nx
    const w = 0.46
    const c = [x + nx * (r + 0.03), z + nz * (r + 0.03)]
    q.quad([[c[0] - tx * w, y, c[1] - tz * w], [c[0] + tx * w, y, c[1] + tz * w], [c[0] + tx * w, y + h, c[1] + tz * w], [c[0] - tx * w, y + h, c[1] - tz * w]], [nx, 0, nz], UV, GLASS, FIXED)
  }
  let coneR = r + 0.12
  let y0 = top
  if (crenel) {
    // the machicolated head: a corbel ring, merlons, and the cone standing back in it
    prism(q, x, z, top - 2.1, top - 1.1, r, 24, TRIM, plain, r + 0.55)
    prism(q, x, z, top - 1.1, top, r + 0.55, 24, DRUM, plain)
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      box(q, x + Math.sin(a) * (r + 0.45), top + 0.42, z + Math.cos(a) * (r + 0.45), 0.5, 0.42, 0.5, DRUM, plain)
    }
    coneR = r - 1.4
    y0 = top - 0.2
  }
  prism(q, x, z, y0, apex, coneR, 20, CAP, FIXED, 0.1)
  prism(q, x, z, apex - 0.2, apex + 2.6, 0.08, 4, LEAD, FIXED, 0.03)
  box(q, x, apex + 1.4, z, 0.26, 0.04, 0.04, LEAD, FIXED)
  if (chim >= 0) {
    const a = chim
    const nx = Math.sin(a) * coneR * 0.5, nz = -Math.cos(a) * coneR * 0.5
    box(q, x + nx, top + 3.2, z + nz, 0.6, 3.2, 0.6, TRIM, FIXED)
    box(q, x + nx, top + 6.5, z + nz, 0.72, 0.15, 0.72, BAND, FIXED)
  }
}

export function conciergerie(out: MeshBuilder): void {
  const q = out
  // ---- the east range: x from the Horloge to César
  const eastBays = [182, 225, 268, 310, 352, 392, 433, 475, 518, 560, 602].map(X)
  ranges(q, X(155), X(626), Y(322), Y(245), eastBays, [[Y(445), Y(402), 1.5, false], [Y(380), Y(340), 1.35, false]], [215, 345, 458, 545].map(X), [182, 225, 268, 310, 350, 392, 435, 477, 520, 562, 605].map(X))
  // the ground floor's little square windows and arched gate
  for (const x of [190, 230, 348, 382, 402, 470, 548, 572, 600].map(X)) rectOn(q, '-z', 0, x - 0.55, x + 0.55, Y(495), Y(465), GLASS, 0.06)
  for (const x of [222, 266].map(X)) {
    archOn(q, '-z', 0, x, 0.9, 1.5, 3.1, GLASS, 0.07)
  }
  archOn(q, '-z', 0, X(517), 0, 2.9, 4.2, DOOR, 0.07)
  // ---- the bay between the drums, its gable and its Gothic window, the little door
  block(q, X(712), X(772), 0, 2.5, 0, Y(298), STONE)
  q.quad([[X(712), Y(298), 0], [X(772), Y(298), 0], [X(742), Y(250), 0], [X(742), Y(250), 0]], [0, 0, -1], UV, STONE, FIXED)
  roof(q, X(712), X(772), 0, 8, Y(298), Y(250) - Y(298), X(742) - X(712), 0.01, SLATE)
  archOn(q, '-z', 0, X(740), Y(428), 3.4, 3.8, GLASS, 0.07)
  for (const s of [-1, 0, 1]) rectOn(q, '-z', 0, X(740) + s * 0.65 - 0.06, X(740) + s * 0.65 + 0.06, Y(428), Y(392), TRIM, 0.09)
  archOn(q, '-z', 0, X(740), 0.2, 2.1, 3.6, DOOR, 0.07)
  rectOn(q, '-z', 0, X(725) - 0.3, X(725) + 0.3, Y(358), Y(345), GLASS, 0.06)
  rectOn(q, '-z', 0, X(752) - 0.3, X(752) + 0.3, Y(358), Y(345), GLASS, 0.06)
  // ---- the drums: César, Argent; Bonbec
  const front: [number, number, number][] = (() => {
    const w: [number, number, number][] = []
    for (const a of [-0.35, 0.35]) {
      w.push([a, Y(498), 2], [a, Y(422), 2.2], [a, Y(388), 1.6])
    }
    return w
  })()
  drum(q, X(668), -1.5, 5.1, Y(288), Y(170), front, 0.9)
  drum(q, X(815), -1.5, 5.1, Y(288), Y(165), front, -0.1)
  drum(q, X(1178), -1.5, 5.8, Y(265), Y(148), [[-0.5, Y(450), 2], [0.5, Y(450), 2], [-0.5, Y(395), 2], [0.5, Y(395), 2], [0, Y(330), 2]], 0.7, true)
  // ---- the west range
  const westBays = [883, 925, 965, 1007, 1047, 1087, 1128].map(X)
  ranges(q, X(862), X(1130), Y(340), Y(272), westBays, [[Y(445), Y(405), 1.45, true], [Y(388), Y(360), 1.2, false]], [975, 1053, 1118].map(X), westBays)
  for (const x of westBays) rectOn(q, '-z', 0, x - 0.5, x + 0.5, Y(495), Y(470), GLASS, 0.06)
  // and what carries it on to the Palais past the Bonbec
  block(q, X(1234), X(1234) + 7, 0, D, 0, Y(340), STONE)
  roof(q, X(1234), X(1234) + 7, -0.15, D, Y(340), 5.4, 0.01, D / 2, SLATE)
  // ---- the Tour de l'Horloge: 12 m square, 30 m to the cornice
  const hx = X(105)
  const H = Y(195)
  block(q, hx - 6, hx + 6, -2, 10, 0, H, STONE)
  for (const y of [Y(460), Y(388), Y(270)]) block(q, hx - 6.15, hx + 6.15, -2.15, 10.15, y, y + 0.22, TRIM)
  // its windows, front and flank, and the buttressing band at the corner
  for (const [px, py, ph] of [[75, 435, 35], [105, 430, 28], [75, 380, 22], [115, 358, 22], [115, 270, 32], [75, 505, 25], [105, 500, 22]] as const) {
    const x = hx + (px - 105) * 0.0963
    const f = (y0: number, y1: number, c: Rgb, dd: number): void => {
      q.quad([[x - 0.5, y0, -2 - dd], [x + 0.5, y0, -2 - dd], [x + 0.5, y1, -2 - dd], [x - 0.5, y1, -2 - dd]], [0, 0, -1], UV, c, FIXED)
    }
    f(Y(py), Y(py - ph), GLASS, 0.05)
  }
  // the east face and the great clock of 1370: Germain Pilon's blue and gold, in its carved frame, a working clock as every clock in the city is
  const fe = hx - 6
  const cy = 15.6
  block(q, fe - 0.5, fe, 1.2, 8.8, 11.6, 20.6, TRIM)
  block(q, fe - 0.55, fe - 0.5, 2.2, 7.8, 12.4, 19.8, BLUE)
  clockFace(q, fe - 0.58, cy, 5, -1, 0, 2.2, { dial: BLUE, rim: GOLD, marks: GOLD, hands: GOLD })
  for (const z of [2.5, 7.5]) box(q, fe - 0.7, 16, z, 0.1, 2.8, 0.45, shade(STONE, 1.05), FIXED)
  block(q, fe - 0.75, fe, 1, 9, 20.6, 21.2, GOLD)
  q.quad([[fe - 0.76, 21.2, 1], [fe - 0.76, 21.2, 9], [fe - 0.76, 24, 5], [fe - 0.76, 24, 5]], [-1, 0, 0], UV, TRIM, FIXED)
  block(q, fe - 0.45, fe, 1, 9, 0.2, 7, BAND)
  rectOn(q, '-x', fe - 0.45, 3.4, 6.6, 0.3, 4.6, DOOR, 0.05)
  // the roof, the chimney, the lantern with its chevrons
  block(q, hx - 6.5, hx + 6.5, -2.5, 10.5, H - 0.6, H, TRIM)
  roof(q, hx - 6.5, hx + 6.5, -2.5, 10.5, H, Y(155) - H, 3, 3, SLATE)
  const lz = 4
  prism(q, hx, lz, Y(155), Y(138), 2.6, 12, LEAD, FIXED, 2.3)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    beam(q, [hx + Math.sin(a) * 1.95, Y(138), lz + Math.cos(a) * 1.95], [hx + Math.sin(a) * 1.95, Y(112), lz + Math.cos(a) * 1.95], 0.14, LEAD)
  }
  prism(q, hx, lz, Y(138), Y(112), 1.45, 8, GLASS, FIXED)
  prism(q, hx, lz, Y(112), Y(108), 2.2, 12, GOLD, FIXED, 2)
  // the cap, slate and lead in chevrons: alternate bands
  const yc0 = Y(108), yc1 = Y(68)
  for (let i = 0; i < 6; i++) {
    const t0 = i / 6, t1 = (i + 1) / 6
    prism(q, hx, lz, yc0 + (yc1 - yc0) * t0, yc0 + (yc1 - yc0) * t1, 1.95 * (1 - t0) + 0.05, 8, i % 2 ? GOLD : CAP, FIXED, 1.95 * (1 - t1) + 0.05)
  }
  prism(q, hx, lz, yc1, yc1 + 3, 0.07, 4, LEAD, FIXED, 0.03)
  box(q, hx + 3.6, Y(200) + 3.2, 1.8, 0.65, 4.8, 0.65, TRIM, FIXED)
  // the wall that joins the tower and the range, and the ends' returns
  block(q, X(170), X(190), 0, D, 0, Y(322), STONE)
}
