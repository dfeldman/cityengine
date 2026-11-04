import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { block, column, hex, roof, shade } from '../kit.ts'
import { archOn, balustrade, dormers, mansard, palette, range, rectOn, slabOn, squareDome, type Pal } from './palaces/common.ts'

/**
 * THE PALAIS DE JUSTICE on the Île de la Cité: the two fronts a rider knows it by, fitted round the Conciergerie's quay front and the
 * Sainte-Chapelle (their own builders) and OSM's restyled ranges round the inner courts (manifest "Palais de Justice — the tall parts").
 *
 * Measured from IGN's LiDAR HD surface model (tools/ign-mns.ts, 2026-11-03), resampled into each front's frame:
 *
 * COUR DE MAI (`palaisJusticeMai`), on the Boulevard du Palais. Origin on OSM's railing (fence 53574159, its gates at u −6.5…+3.8), the
 * front looking −z at bearing 115.5, +x the viewer's right (north-north-east, toward the Conciergerie), +z into the court.
 * - the court is 35 m across (x −21…+14) and 48 m deep;
 * - the north wing's court face at x 14, its cornice 17 m, its roof to 23 (OSM part 248858304, drawn 13);
 * - the low south gallery x −30…−21, a flat 14.5 m (248858308), the way through to the Sainte-Chapelle's court past its end;
 * - Desmaisons and Antoine's front at z 48: the flight of steps z 36…46 rising 4 m, x −12…+4; the four Doric columns at z 46;
 *   the avant-corps 29 m, the square dome to 38 over x −8…0; the ranges either side 27, the bodies behind 24;
 * - Bigonnet's railing (1785) across the whole mouth, black iron with gilded spears, rails and vases, the great gate on the axis
 *   crowned with its gilded arms, the two lesser gates either side.
 *
 * HARLAY (`palaisJusticeHarlay`), Duc's west front on the Rue de Harlay (1857–68). Origin on OSM's colonnade (columns 248983482…92,
 * x ±27.5 at z 0), the front looking −z at bearing 297, +x the viewer's right (south-south-west), +z into the palace.
 * - the range 16 m deep, its cornice at 24.5, its high hipped roof to its ridge at 30.5;
 * - the stair in front rising 5–6 m to the podium the colossal Doric order stands on (OSM: columns to 18 m over a 6 m podium).
 */
const P: Pal = palette('#c4baa2', '#454c55')
const IRON: Rgb = [0.09, 0.1, 0.11]
const GOLD: Rgb = [0.88, 0.69, 0.25]
const STEP: Rgb = shade(P.stone, 0.93)

/** A railing run along z = z0 from x0 to x1: plinth, bars with gilded spear heads, top and bottom rails. */
function railing(q: MeshBuilder, x0: number, x1: number, z0: number, h: number, gilt = false): void {
  block(q, x0, x1, z0 - 0.35, z0 + 0.35, 0, 0.6, P.deep)
  const bar = gilt ? GOLD : IRON
  block(q, x0, x1, z0 - 0.04, z0 + 0.04, 0.85, 0.95, bar)
  block(q, x0, x1, z0 - 0.05, z0 + 0.05, h - 0.45, h - 0.35, GOLD)
  const n = Math.max(2, Math.round((x1 - x0) / 0.22))
  for (let i = 1; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    block(q, x - 0.025, x + 0.025, z0 - 0.025, z0 + 0.025, 0.6, h, bar)
    if (i % 2 === 0) prism(q, x, z0, h, h + 0.28, 0.06, 4, GOLD, 0, 0.005)
  }
}

/** A stone pier of the railing with its gilded vase. */
function pier(q: MeshBuilder, x: number, z: number, w: number, h: number, vase = true): void {
  block(q, x - w / 2, x + w / 2, z - w / 2, z + w / 2, 0, h, P.stone)
  block(q, x - w / 2 - 0.12, x + w / 2 + 0.12, z - w / 2 - 0.12, z + w / 2 + 0.12, h, h + 0.3, P.trim)
  if (vase) {
    prism(q, x, z, h + 0.3, h + 0.75, w * 0.22, 8, GOLD, 0, w * 0.34)
    prism(q, x, z, h + 0.75, h + 1.3, w * 0.34, 8, GOLD, 0, w * 0.18)
    prism(q, x, z, h + 1.3, h + 1.7, w * 0.08, 6, GOLD, 0, 0.02)
  }
}

/** A gate between piers at x0..x1: two leaves of bars under a gilded overthrow `crown` high. */
function gate(q: MeshBuilder, x0: number, x1: number, h: number, crown: number): void {
  const xm = (x0 + x1) / 2
  railing(q, x0, x1, 0, h, false)
  // the leaves' gilded frames and the middle stile
  for (const x of [x0 + 0.1, xm, x1 - 0.1]) block(q, x - 0.08, x + 0.08, -0.08, 0.08, 0.6, h + 0.2, GOLD)
  for (const y of [1.6, h * 0.55]) block(q, x0, x1, -0.07, 0.07, y, y + 0.14, GOLD)
  // the overthrow: a gilded arch of scrolls rising to the crown, the arms and a crown on top
  const w = (x1 - x0) / 2
  const n = 10
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI
    const p0 = [xm - Math.cos(a0) * w, h + Math.sin(a0) * crown * 0.55], p1 = [xm - Math.cos(a1) * w, h + Math.sin(a1) * crown * 0.55]
    q.quad([[p0[0], p0[1], -0.06], [p1[0], p1[1], -0.06], [p1[0], p1[1] + 0.22, -0.06], [p0[0], p0[1] + 0.22, -0.06]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], GOLD, 0)
    q.quad([[p1[0], p1[1], 0.06], [p0[0], p0[1], 0.06], [p0[0], p0[1] + 0.22, 0.06], [p1[0], p1[1] + 0.22, 0.06]], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], GOLD, 0)
  }
  // scroll bars inside the arch
  for (let i = 1; i < 8; i++) {
    const x = x0 + ((x1 - x0) * i) / 8
    const t = (x - xm) / w
    block(q, x - 0.04, x + 0.04, -0.04, 0.04, h, h + Math.sqrt(Math.max(0, 1 - t * t)) * crown * 0.55, GOLD)
  }
  // the cartouche of arms and the crown over it
  box(q, xm, h + crown * 0.62, 0, 0.9, 0.85, 0.1, GOLD, 0)
  box(q, xm, h + crown * 0.62, -0.12, 0.55, 0.55, 0.04, hex('#2a3f7a'), 0)
  prism(q, xm, 0, h + crown * 0.62 + 0.85, h + crown, 0.6, 8, GOLD, 0, 0.25)
  prism(q, xm, 0, h + crown, h + crown + 0.5, 0.08, 4, GOLD, 0, 0.02)
}

/** An arcade of round-headed openings on a face along z (x = plane, facing `f`), every `bay` from z0 to z1. */
function arcadeZ(q: MeshBuilder, f: '-x' | '+x', plane: number, z0: number, z1: number, bay: number, w: number, h: number): void {
  const n = Math.max(1, Math.round((z1 - z0) / bay))
  const s = (z1 - z0) / n
  for (let i = 0; i < n; i++) archOn(q, f, plane, z0 + s * (i + 0.5), 0.3, w, h, P.dark, 0.08)
}

/** A flight of `n` steps from z0 (bottom) to z1 (top, at height h) across x0..x1. */
function flight(q: MeshBuilder, x0: number, x1: number, z0: number, z1: number, h: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const za = z0 + ((z1 - z0) * i) / n
    block(q, x0, x1, za, z1 + 0.01, (h * i) / n, (h * (i + 1)) / n, i % 2 ? STEP : shade(STEP, 0.96))
  }
}

export function palaisJusticeMai(q: MeshBuilder): void {
  // ---- the railing and its gates across the court's mouth (z 0), between the wing's end and the gallery's
  const AX = -4
  railing(q, -30, -18.5, 0, 3.4)
  railing(q, -14.5, AX - 4.2, 0, 3.4)
  railing(q, AX + 4.2, 6.5, 0, 3.4)
  railing(q, 10.5, 14, 0, 3.4)
  for (const x of [-30, -24]) pier(q, x, 0, 1.0, 3.6)
  for (const x of [-18.5, -14.5, 6.5, 10.5]) pier(q, x, 0, 1.2, 4.6)
  for (const x of [AX - 4.2, AX + 4.2]) pier(q, x, 0, 1.6, 6.2)
  gate(q, -18, -15, 3.6, 2.4)
  gate(q, 7, 10, 3.6, 2.4)
  gate(q, AX - 3.4, AX + 3.4, 5.2, 4.6)

  // ---- the north wing (Antoine): its court face at x 14, its end pavilion on the boulevard
  const NE = 17
  range(q, 14, 24, 1, 48, P, { eaves: NE, storeys: [{ y: 6, h: 3.3 }, { y: 10.8, h: 2.9 }], bay: 3.9, win: 1.5, faces: ['-x', '-z'], rustic: 0.55, rusticTo: 6, quoins: true })
  arcadeZ(q, '-x', 14, 6, 48, 3.9, 2.4, 4.8)
  mansard(q, 14, 24, 1, 48, NE, 4.2, 1.8, P.slate)
  dormers(q, '-x', 14, 6, 48, NE + 0.2, 3.9, P, { round: true })
  // the end pavilion's front on the boulevard: a pediment over the middle bays
  slabOn(q, '-z', 1, 15.5, 22.5, NE - 1.2, NE - 0.6, 0.3, P.trim)
  // ---- the south gallery: a flat 14.5 m behind its balustrade, an arcade on the court
  const GE = 14.5
  range(q, -30, -21, 2, 48, P, { eaves: GE, storeys: [{ y: 6.5, h: 3.2 }, { y: 10.6, h: 2.2 }], bay: 3.9, win: 1.5, faces: ['+x', '-z'], rustic: 0.55, rusticTo: 6.5 })
  arcadeZ(q, '+x', -21, 2, 48, 3.9, 2.4, 5)
  block(q, -30, -21, 2, 48, GE - 0.05, GE, P.lead)
  balustrade(q, -30, -21, 2, 48, GE, P, { sides: ['+x', '-z'] })

  // ---- the bodies behind the front, joining the wing and the gallery (24 m, mansards)
  range(q, -30, 24, 48, 70, P, { eaves: 24, storeys: [{ y: 6, h: 3.4 }, { y: 11, h: 3.2 }, { y: 16, h: 2.8 }], bay: 3.9, win: 1.6, faces: ['-z'], rustic: 0.55, rusticTo: 6 })
  mansard(q, -30, 24, 48, 70, 24, 3.4, 1.6, P.slate)
  // the front's ranges either side of the avant-corps, 27 m
  range(q, -21, 14, 47, 60, P, { eaves: 27, storeys: [{ y: 6, h: 3.6, arched: true }, { y: 12, h: 3.6 }, { y: 18, h: 3.2 }], bay: 3.9, win: 1.7, faces: ['-z'], rustic: 0.55, rusticTo: 6, cornice: 0.8 })
  balustrade(q, -21, 14, 47, 60, 27, P, { sides: ['-z'] })
  mansard(q, -20, 13, 48, 59, 27, 2.6, 1.2, P.slate)

  // ---- the avant-corps: the portico of four Doric columns on its podium, the attic, the square dome
  const X0 = AX - 11, X1 = AX + 11
  const POD = 4
  block(q, X0, X1, 44.5, 47, 0, POD, P.deep)
  for (let y = 0.6; y < POD - 0.2; y += 0.6) rectOn(q, '-z', 44.5, X0, X1, y - 0.06, y + 0.06, shade(P.deep, 0.85), 0.03)
  flight(q, AX - 8, AX + 8, 36, 44.5, POD, 16)
  for (const s of [-1, 1]) block(q, AX + s * 8.6 - 0.6, AX + s * 8.6 + 0.6, 36, 44.5, 0, 1.6, P.stone)
  block(q, X0, X1, 47, 48, 0, 29, P.stone)
  // the doors behind the columns
  for (const x of [AX - 4.6, AX, AX + 4.6]) archOn(q, '-z', 47, x, POD, 2.6, 6.2, P.dark, 0.06)
  for (const x of [AX - 4.6, AX, AX + 4.6]) rectOn(q, '-z', 47, x - 0.9, x + 0.9, 12.5, 15, P.glass, 0.06)
  const colX = [AX - 7, AX - 2.4, AX + 2.4, AX + 7]
  for (const x of colX) column(q, x, 45.6, POD, 16, 0.72, P.stone, { order: 'doric' })
  // the entablature with its triglyphs, the attic and its balustrade (the four statues are the statues' session's)
  block(q, X0 - 0.3, X1 + 0.3, 44.6, 47.2, 16, 18.2, P.trim)
  for (let x = X0 + 0.6; x < X1 - 0.4; x += 1.3) rectOn(q, '-z', 44.6, x - 0.25, x + 0.25, 16.7, 17.6, P.deep, 0.04)
  block(q, X0 - 0.5, X1 + 0.5, 44.4, 47.4, 18.2, 18.7, P.trim)
  balustrade(q, X0, X1, 44.8, 47.2, 18.7, P, { sides: ['-z'] })
  for (const x of colX) box(q, x, 19.8, 45.4, 0.55, 1.1, 0.55, P.trim, 0)
  // the avant-corps above the portico: its windows, its cornice at 29
  for (const x of [AX - 4.6, AX, AX + 4.6]) { archOn(q, '-z', 47, x, 21, 1.8, 4.2, P.glass, 0.06); rectOn(q, '-z', 47, x - 1.15, x + 1.15, 20.7, 21, P.trim, 0.08) }
  block(q, X0 - 0.6, X1 + 0.6, 46.4, 60.6, 28.2, 29, P.trim)
  block(q, X0, X1, 47.5, 60, 0, 28.2, P.stone)
  // the square dome, slate with lead ribs, a lantern
  squareDome(q, AX, 54, 29, 7.2, 7.4, P.slate, 6, 5.8)
  for (const s of [-1, 1]) {
    block(q, AX + s * 7.2 - 0.1, AX + s * 7.2 + 0.1, 48.2, 59.8, 29, 29.6, P.lead)
  }
  block(q, AX - 1.2, AX + 1.2, 52.8, 55.2, 36.2, 37.6, P.lead)
  prism(q, AX, 54, 37.6, 39.4, 0.25, 6, GOLD, 0, 0.04)
  // a clock in the attic's middle over the portico (the court front's own)
  box(q, AX, 25, 46.9, 1.2, 1.2, 0.08, hex('#efe9da'), 0)
  box(q, AX, 25, 46.82, 1.32, 1.32, 0.02, GOLD, 0)
}

export function palaisJusticeHarlay(q: MeshBuilder): void {
  const POD = 5.5, EAVES = 24.5, RIDGE = 30.5, D = 16, W = 31
  // ---- the range: walls, its cornice, the high roof
  block(q, -W, W, 1.2, D, 0, EAVES - 1.2, P.stone)
  // the podium's rusticated face and its doors
  block(q, -W, W, -0.6, 1.2, 0, POD, P.deep)
  for (let y = 0.6; y < POD - 0.2; y += 0.7) rectOn(q, '-z', -0.6, -W, W, y - 0.07, y + 0.07, shade(P.deep, 0.84), 0.03)
  for (const x of [-24.4, -18.3, 18.3, 24.4]) archOn(q, '-z', -0.6, x, 0, 2.2, 3.8, P.dark, 0.05)
  // the stair up to the podium: the middle flight, its landing, the cheeks
  flight(q, -13, 13, -12, -0.6, POD, 22)
  for (const s of [-1, 1]) {
    block(q, s * 13.6 - 0.8, s * 13.6 + 0.8, -12.4, -0.6, 0, 2, P.stone)
    block(q, s * 13.6 - 0.9, s * 13.6 + 0.9, -1.6, -0.6, 0, POD + 1.4, P.stone)
  }
  // the colossal Doric order: ten engaged columns from the podium to the entablature
  const cols = Array.from({ length: 10 }, (_, i) => -27.5 + (55 * i) / 9)
  for (const x of cols) {
    column(q, x, 0.35, POD, 20.6, 0.95, P.stone, { order: 'doric' })
    block(q, x - 1.25, x + 1.25, -0.9, 1.2, POD, POD + 0.6, P.trim)
  }
  // between them the tall round-headed windows and the oculi over them
  for (let i = 0; i < 9; i++) {
    const x = (cols[i] + cols[i + 1]) / 2
    rectOn(q, '-z', 1.2, x - 1.7, x + 1.7, POD + 1.2, 17.6, P.trim, 0.04)
    archOn(q, '-z', 1.2, x, POD + 1.4, 2.6, 11.4, P.glass, 0.08)
    rectOn(q, '-z', 1.2, x - 1.5, x + 1.5, POD + 1.2, POD + 2.2, P.trim, 0.1)
    prism(q, x, 1.25, 18.4, 18.5, 0.75, 10, P.glass, 0)
  }
  // the end bays past the order, plainer, with pilasters at the corners
  for (const s of [-1, 1]) {
    block(q, s * W - 1.2, s * W + 1.2, 0.6, 1.5, POD, 20.6, P.trim)
    rectOn(q, '-z', 1.2, s * 29.2 - 0.8, s * 29.2 + 0.8, 8, 15, P.glass, 0.08)
  }
  // the entablature: architrave, the frieze of triglyphs, the cornice; the attic over it
  block(q, -W - 0.4, W + 0.4, -0.7, D, 20.6, 21.6, P.trim)
  block(q, -W - 0.4, W + 0.4, -0.5, D, 21.6, 23.1, P.stone)
  for (let x = -W + 0.6; x < W - 0.3; x += 1.53) rectOn(q, '-z', -0.5, x - 0.3, x + 0.3, 21.75, 22.95, P.deep, 0.04)
  block(q, -W - 0.9, W + 0.9, -1.2, D + 0.5, 23.1, 23.7, P.trim)
  block(q, -W, W, -0.4, D, 23.7, EAVES, P.stone)
  // the high hipped roof: slate, a lead crest, the chimneys and the dormers
  roof(q, -W - 0.2, W + 0.2, -0.6, D + 0.2, EAVES, RIDGE - EAVES, (D + 0.8) / 2, (D + 0.8) / 2 - 0.001, P.slate)
  block(q, -W + 8.4, W - 8.4, D / 2 - 0.4, D / 2 - 0.2, RIDGE, RIDGE + 0.6, P.lead)
  for (const x of [-18, -6, 6, 18]) {
    const t = 2.8
    block(q, x - 0.9, x + 0.9, 1.4 + t, 3.2 + t, EAVES, EAVES + 3.2, P.trim)
    roof(q, x - 1.1, x + 1.1, 1.2 + t, 3.4 + t, EAVES + 3.2, 0.9, 1.1, 0.001, P.slate)
    rectOn(q, '-z', 1.4 + t, x - 0.5, x + 0.5, EAVES + 0.5, EAVES + 2.6, P.glass, 0.04)
  }
  for (const x of [-24, 24]) block(q, x - 0.7, x + 0.7, 6.5, 9.5, EAVES + 2, RIDGE + 1.6, P.trim)
  // the side walls' returns, windows on the flanks' visible ends
  for (const s of [-1, 1]) for (const z of [4.5, 9, 13.5]) rectOn(q, s < 0 ? '-x' : '+x', s * W, z - 0.8, z + 0.8, 8, 15, P.glass, 0.06)
}
