/**
 * THE MAIN GATE of the Japanese Tea Garden — the two-storey entrance gate on the Music Concourse side, in natural
 * weathered wood under a grey tiled roof (OSM way/136888948, which OSM names "South Gate"; the garden's real South
 * Gate is a smaller single-storey wall gate, not modelled yet). Evidence pack: docs/sf-batches/MODEL-TEA-GARDEN-MAIN-GATE.md
 * — the owner's three photographs, 2026-10-27: "many similar elements [to the Temple Gate] but brown instead of
 * red"; "note the walls on each side of the main gate". Was `gate()` in tea-garden.ts (posts under two stacked
 * roofs), then for a day an AI GLB.
 *
 * A two-storey gate (nijūmon) on the Temple Gate's bones: two round MAIN POSTS on the passage line with a SECONDARY
 * POST before and behind each, all on stone plinths; the heavy LINTEL; stepped dark bracket clusters on every post;
 * a band of bracket arms; the BALCONY — a wooden deck under a kōran rail of posts, a top and a mid rail and close
 * balusters below the mid rail; the UPPER STOREY in cream plaster framed in wood, THREE round-arched barred windows
 * at the centre of the front and back, and the GILT NAME TABLET hung over the middle one under the eave. The EAVE:
 * two tiers of rafters, fans at the corners, a fascia that follows the curve with a row of round grey tile-end caps.
 * The ROOF is grey tile, hip-and-gable, its corners curling up; cream gables with a dark bargeboard and pendant;
 * a dark ridge with onigawara end blocks. The DOORS stand open against the inner secondary posts. The FLANKING
 * WALLS run out each side on the posts' line: a stone plinth, cream plaster, a wooden lattice band and a tiled coping.
 *
 * Local frame: y up; the PASSAGE runs along z (the street at −z), the front face, the ridge and the walls along x —
 * the footprint's long axis (10.9 × 5.1 m). Built in metres (a 1.7 m visitor in the passage: the ridge about 10.5 m)
 * and scaled to HEIGHT at the end.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { prism, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { B, Q, type P3, fan, loft, ring, curl } from './tea-garden-kit.ts'

const HEIGHT = 10.5
const WOOD: Rgb = [0.48, 0.40, 0.31]      // weathered hinoki, silver-brown
const DARKWOOD: Rgb = [0.30, 0.25, 0.20]  // the brackets, rafters and bargeboards
const PLASTER: Rgb = [0.90, 0.87, 0.80]
const TILE: Rgb = [0.36, 0.40, 0.44]
const SLATE: Rgb = [0.26, 0.28, 0.31]
const GILT: Rgb = [0.85, 0.64, 0.24]
const GRANITE: Rgb = [0.62, 0.62, 0.60]
const DARK: Rgb = [0.12, 0.10, 0.09]

/** a stepped bracket cluster (dark wood) on a post top at (x, z) */
function bracket(out: MeshBuilder, x: number, y: number, z: number, s: number): void {
  B(out, x, y, z, s * 0.8, s * 0.8, s * 0.3, DARKWOOD)
  B(out, x, y + s * 0.3, z, s * 1.6, s * 0.5, s * 0.25, DARKWOOD)
  B(out, x, y + s * 0.3, z, s * 0.5, s * 1.6, s * 0.25, DARKWOOD)
  B(out, x, y + s * 0.55, z, s * 2.2, s * 0.45, s * 0.25, DARKWOOD)
  B(out, x, y + s * 0.55, z, s * 0.45, s * 2.2, s * 0.25, DARKWOOD)
}

/** a round-arched barred window on the face z = sz·d, centred at x = u */
function archWindow(out: MeshBuilder, sz: number, u: number, y: number, w: number, h: number, d: number): void {
  const pz = sz * (d + 0.02)
  B(out, u, y, pz, w, 0.06, h, DARK)
  const n = 6, pts: P3[] = [[u, y + h, pz]]
  for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; pts.push([u + Math.cos(a) * w / 2, y + h + Math.sin(a) * w / 2, pz]) }
  for (const off of [-0.03, 0.03]) fan(out, pts.map((p): P3 => [p[0], p[1], p[2] + off]), DARK, 0, [0, 0, sz * Math.sign(off)])
  for (let k = -2; k <= 2; k++) B(out, u + k * w / 5.5, y + 0.03, pz + sz * 0.025, 0.03, 0.04, h + w * 0.42, WOOD)
  for (const a of [-w / 2 - 0.04, w / 2 + 0.04]) B(out, u + a, y - 0.05, pz, 0.08, 0.1, h + 0.05, WOOD)
  B(out, u, y - 0.08, pz, w + 0.16, 0.1, 0.08, WOOD)
}

/** the kōran rail: posts, a top and a mid rail, close balusters under the mid rail */
function rail(out: MeshBuilder, y: number, hx: number, hz: number, h: number): void {
  for (const x of [-hx, -hx / 2, 0, hx / 2, hx]) for (const z of [-hz, hz]) { B(out, x, y, z, 0.11, 0.11, h, WOOD); B(out, x, y + h, z, 0.17, 0.17, 0.06, WOOD) }
  for (const x of [-hx, hx]) { B(out, x, y, 0, 0.11, 0.11, h, WOOD); B(out, x, y + h, 0, 0.17, 0.17, 0.06, WOOD) }
  for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const cx = sx * hx, cz = sz * hz
    const lx = sx ? 0.08 : 2 * hx, lz = sz ? 0.08 : 2 * hz
    B(out, cx, y + h - 0.1, cz, lx, lz, 0.09, WOOD)
    B(out, cx, y + h * 0.5, cz, lx * 0.95, lz * 0.95, 0.06, WOOD)
    B(out, cx, y + 0.03, cz, lx * 0.95, lz * 0.95, 0.05, WOOD)
    const len = sx ? 2 * hz : 2 * hx, m = Math.round(len / 0.2)
    for (let j = 1; j < m; j++) {
      const t = -len / 2 + len * j / m
      B(out, sx ? cx : t, y + 0.08, sz ? cz : t, 0.04, 0.04, h * 0.5 - 0.1, WOOD)
    }
  }
}

/** a flanking wall from x0 to x1 on the z = 0 line: plinth, plaster, lattice band, posts and a tiled coping */
function wall(out: MeshBuilder, x0: number, x1: number): void {
  const cx = (x0 + x1) / 2, len = Math.abs(x1 - x0)
  B(out, cx, 0, 0, len, 0.5, 0.35, GRANITE, surfaceTag('granite'))
  B(out, cx, 0.35, 0, len, 0.26, 1.25, PLASTER, surfaceTag('stucco'))
  B(out, cx, 1.6, 0, len, 0.2, 0.08, WOOD)
  B(out, cx, 2.3, 0, len, 0.2, 0.08, WOOD)
  for (const sz of [-1, 1]) {
    B(out, cx, 1.95, sz * 0.09, len, 0.03, 0.04, WOOD)
    for (let x = Math.min(x0, x1) + 0.08; x < Math.max(x0, x1); x += 0.16) B(out, x, 1.68, sz * 0.1, 0.035, 0.03, 0.62, DARKWOOD)
  }
  const posts = Math.max(1, Math.round(len / 2.2))
  for (let i = 0; i <= posts; i++) B(out, Math.min(x0, x1) + len * i / posts, 0.5, 0, 0.16, 0.32, 1.95, WOOD)
  // the coping: a little gabled tile roof along the wall
  const y = 2.42, hw = 0.42, rise = 0.28
  const a = Math.min(x0, x1) - 0.1, b = Math.max(x0, x1) + 0.1
  Q(out, [[a, y, hw], [b, y, hw], [b, y + rise, 0], [a, y + rise, 0]], TILE, surfaceTag('tile'), [0, rise, hw])
  Q(out, [[a, y, -hw], [a, y + rise, 0], [b, y + rise, 0], [b, y, -hw]], TILE, surfaceTag('tile'), [0, rise, -hw])
  B(out, cx, y - 0.1, 0, len + 0.2, 2 * hw, 0.1, DARKWOOD)
  B(out, cx, y + rise - 0.04, 0, len + 0.2, 0.14, 0.1, SLATE)
}

export function teaGardenMainGate(out: MeshBuilder, _fit: Fit): void {
  const start = out.positions.length
  const tile = surfaceTag('tile'), granite = surfaceTag('granite')
  const PX = 1.95, SZ = 1.5, LINTEL = 4.6
  // the plinths, shoes, posts and ties (the terrace under it all, and the steps, come at the end)
  for (const x of [-PX, PX]) {
    for (const z of [-SZ, 0, SZ]) {
      const main = z === 0
      B(out, x, 0, z, main ? 0.8 : 0.6, main ? 0.8 : 0.6, 0.4, GRANITE, granite)
      prism(out, x, z, 0.4, 0.62, main ? 0.23 : 0.18, 8, DARK, 0)
      prism(out, x, z, 0.62, LINTEL, main ? 0.21 : 0.165, 8, WOOD, 0)
    }
    for (const yTie of [1.25, 3.5]) B(out, x, yTie, 0, 0.18, 2 * SZ + 0.34, 0.18, WOOD)
    B(out, x, LINTEL - 0.5, 0, 0.3, 2 * SZ + 0.9, 0.5, WOOD)                                  // the beam along z over the post line
    // a door leaf standing open against the inner secondary post
    const dx = x - Math.sign(x) * 0.26
    B(out, dx, 0.45, SZ * 0.55, 0.08, 1.65, 3.4, WOOD)
    for (let k = 0; k < 3; k++) B(out, dx + Math.sign(x) * 0.045, 0.6 + k * 1.05, SZ * 0.55, 0.03, 1.5, 0.08, DARKWOOD)
    B(out, dx + Math.sign(x) * 0.045, 0.6, SZ * 0.55, 0.03, 0.08, 3.2, DARKWOOD)
  }
  // the lintel and the brackets
  B(out, 0, LINTEL, 0, 2 * PX + 2.4, 0.5, 0.55, WOOD)
  for (const x of [-PX, PX]) for (const z of [-SZ, 0, SZ]) bracket(out, x, LINTEL + 0.55, z, 0.42)
  // the bracket band under the deck: a plate and arms with dark ends
  const BK = LINTEL + 0.55 + 0.35, DECK = BK + 0.75
  B(out, 0, BK, 0, 2 * PX + 2.0, 2 * SZ + 0.6, 0.16, WOOD)
  for (const sz of [-1, 1]) for (let i = 0; i < 11; i++) {
    const x = -PX - 0.8 + (2 * PX + 1.6) * i / 10
    B(out, x, BK + 0.16, sz * (SZ + 0.6), 0.14, 1.2, 0.16, DARKWOOD)
    B(out, x, BK + 0.16, sz * (SZ + 1.15), 0.18, 0.14, 0.2, SLATE)
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) {
    const z = -SZ - 0.1 + (2 * SZ + 0.2) * i / 4
    B(out, sx * (PX + 1.0), BK + 0.16, z, 1.2, 0.14, 0.16, DARKWOOD)
    B(out, sx * (PX + 1.55), BK + 0.16, z, 0.14, 0.18, 0.2, SLATE)
  }
  const DX = PX + 1.75, DZ = SZ + 1.25
  B(out, 0, DECK - 0.22, 0, 2 * DX, 2 * DZ, 0.22, WOOD, surfaceTag('planks'))
  B(out, 0, DECK - 0.3, 0, 2 * DX + 0.05, 2 * DZ + 0.05, 0.1, DARKWOOD)
  rail(out, DECK, DX - 0.12, DZ - 0.12, 0.85)
  // the upper storey: plaster in a wood frame, three bays a face, arched windows in the middle, the tablet
  const UX = PX + 0.9, UZ = SZ + 0.3, U0 = DECK, UH = 1.9
  B(out, 0, U0, 0, 2 * UX, 2 * UZ, UH, PLASTER, surfaceTag('stucco'))
  B(out, 0, U0, 0, 2 * UX + 0.1, 2 * UZ + 0.1, 0.16, WOOD)
  B(out, 0, U0 + UH - 0.2, 0, 2 * UX + 0.12, 2 * UZ + 0.12, 0.2, WOOD)
  for (const x of [-UX, UX]) for (const z of [-UZ, UZ]) { B(out, x, U0, z, 0.24, 0.24, UH, WOOD); bracket(out, x, U0 + UH, z, 0.34) }
  for (const x of [-UX, UX]) { B(out, x, U0, 0, 0.2, 0.2, UH, WOOD); bracket(out, x, U0 + UH, 0, 0.3) }
  for (const sz of [-1, 1]) {
    for (const u of [-1.5, 1.5]) B(out, u, U0, sz * (UZ + 0.03), 0.18, 0.1, UH, WOOD)
    for (const u of [-0.9, 0, 0.9]) archWindow(out, sz, u, U0 + 0.45, 0.6, 0.75, UZ)
    B(out, 0, U0 + 0.35, sz * (UZ + 0.03), 2.6, 0.08, 0.1, WOOD)
    // the gilt name tablet, hung over the middle window up into the eave
    B(out, 0, U0 + UH - 0.25, sz * (UZ + 0.1), 0.75, 0.1, 1.15, GILT)
    B(out, 0, U0 + UH - 0.15, sz * (UZ + 0.16), 0.55, 0.02, 0.95, SLATE)
  }
  // the eave: bracket plate, two tiers of rafters, fascia with tile-end caps, corner beams
  const EB = U0 + UH + 0.34
  B(out, 0, EB, 0, 2 * UX + 1.0, 2 * UZ + 1.0, 0.2, WOOD)
  const HX = 5.4, HZ = 3.6
  const lift = 0.5
  for (const [yt, inset, depth] of [[EB + 0.2, 0.12, 0.1], [EB + 0.44, 0.45, 0.09]] as [number, number, number][]) {
    for (let i = 0; i <= 14; i++) {
      const x = -UX + 2 * UX * i / 14
      for (const sz of [-1, 1]) { const ln = HZ - inset - UZ * 0.9; B(out, x, yt, sz * (UZ * 0.9 + ln / 2), depth, ln, depth, DARKWOOD) }
    }
    for (let i = 0; i <= 8; i++) {
      const z = -UZ + 2 * UZ * i / 8
      for (const sx of [-1, 1]) { const ln = HX - inset - UX * 0.9; B(out, sx * (UX * 0.9 + ln / 2), yt, z, ln, depth, depth, DARKWOOD) }
    }
    for (const [cx, cz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) for (let j = 1; j < 4; j++) {
      const a = Math.atan2(cz * HZ, cx * HX) + (j - 2) * 0.2, ln = Math.hypot(HX - UX, HZ - UZ) * 1.05
      const ax = cx * UX * 0.92, az = cz * UZ * 0.92, yy = yt + depth / 2
      strut(out, [ax, yy, az], [ax + Math.cos(a) * ln, yy, az + Math.sin(a) * ln], depth, depth, DARKWOOD, 0, false)
    }
  }
  const YF = EB + 0.58
  const NX = 16, NZ = 10
  const lo = ring(HX - 0.04, HZ - 0.04, YF, lift, NX, NZ), hi = ring(HX - 0.04, HZ - 0.04, YF + 0.24, lift, NX, NZ)
  const li = ring(HX - 0.14, HZ - 0.14, YF, lift, NX, NZ), hi2 = ring(HX - 0.14, HZ - 0.14, YF + 0.24, lift, NX, NZ)
  loft(out, lo, hi, DARKWOOD); loft(out, hi2, li, DARKWOOD); loft(out, hi, hi2, DARKWOOD); loft(out, li, lo, DARKWOOD)
  for (const sz of [-1, 1]) for (let i = 0; i <= 20; i++) {
    const t = -HX + 0.3 + (2 * HX - 0.6) * i / 20
    B(out, t, YF + 0.26 + lift * curl(Math.abs(t / HX)), sz * (HZ + 0.02), 0.11, 0.06, 0.11, SLATE)
  }
  for (const sx of [-1, 1]) for (let i = 0; i <= 12; i++) {
    const t = -HZ + 0.3 + (2 * HZ - 0.6) * i / 12
    B(out, sx * (HX + 0.02), YF + 0.26 + lift * curl(Math.abs(t / HZ)), t, 0.06, 0.11, 0.11, SLATE)
  }
  for (const [cx, cz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
    const a = Math.atan2(cz * (HZ - UZ), cx * (HX - UX)), ln = Math.hypot(HX - UX, HZ - UZ) * 1.1
    strut(out, [cx * UX, YF + 0.32, cz * UZ], [cx * UX + Math.cos(a) * ln, YF + 0.32 + lift * 1.1, cz * UZ + Math.sin(a) * ln], 0.18, 0.18, DARKWOOD)
  }
  // THE ROOF: the tiled skirt with curling corners, the hips, the cream gables, the ridge
  const YR = YF + 0.24, RISE = 0.95
  const eave = ring(HX, HZ, YR, lift, NX, NZ)
  const MX = HX * 0.62, MZ = HZ * 0.6, YM = YR + RISE
  const mid = ring(MX, MZ, YM, 0.05, NX, NZ)
  loft(out, eave, mid, TILE, tile)
  const under = ring(HX, HZ, YR - 0.14, lift, NX, NZ)
  loft(out, under, eave, TILE, tile)
  fan(out, under, TILE, tile, [0, -1, 0])
  const GX = MX * 0.78, GZ = MZ * 0.85, YG = YM + 0.45, RIDGE = YG + 1.15
  const gable = ring(GX, GZ, YG, 0, NX, NZ)
  loft(out, mid, gable, TILE, tile)
  const ridge: P3[] = ring(GX, 0, RIDGE, 0, NX, NZ).map(p => [p[0], RIDGE, 0])
  loft(out, gable, ridge, TILE, tile)
  for (const sx of [-1, 1]) {
    const face: P3[] = [[sx * GX, YG, -GZ], [sx * GX, RIDGE, 0], [sx * GX, YG, GZ]]
    Q(out, [face[0], face[1], face[2], face[2]], PLASTER, surfaceTag('stucco'))
    for (const s of [-1, 1]) strut(out, [sx * (GX + 0.05), YG - 0.05, s * (GZ + 0.12)], [sx * (GX + 0.05), RIDGE + 0.12, 0], 0.1, 0.22, DARKWOOD)
    B(out, sx * (GX + 0.08), YG + 0.15, 0, 0.06, 0.3, 0.5, DARKWOOD)                             // the gegyo pendant
    for (const z of [-GZ * 0.5, GZ * 0.5]) B(out, sx * (GX + 0.02), YG + 0.1, z, 0.08, 0.5, 0.8, WOOD)   // gable struts
  }
  B(out, 0, RIDGE - 0.1, 0, 2 * GX + 0.3, 0.3, 0.2, SLATE)
  for (const sx of [-1, 1]) { B(out, sx * (GX + 0.1), RIDGE, 0, 0.35, 0.36, 0.55, SLATE); B(out, sx * (GX + 0.1), RIDGE + 0.55, 0, 0.2, 0.44, 0.18, SLATE) }
  for (const [cx, cz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) B(out, cx * MX, YM - 0.05, cz * MZ, 0.25, 0.25, 0.3, SLATE)   // the hip-end ornaments
  // the flanking walls, on the posts' line, out past the eaves each side
  for (const sx of [-1, 1]) wall(out, sx * (PX + 0.35), sx * 9.0)
  // the TERRACE: the gate and its walls stand on a level granite platform, with steps down to the street at −z — the
  // ground across the front rises about 1.5 m (the drape sets the base at the lowest ground under the footprint, and
  // without the terrace the uphill wall and posts were buried, city check 2026-10-27); the uphill side vanishes into
  // the slope as the real one does
  const TH = 1.3
  for (let i = start + 1; i < out.positions.length; i += 3) out.positions[i] += TH
  B(out, 0, 0, 0, 19.2, 6.6, TH, GRANITE, granite)
  const steps = 6, s = TH / steps
  for (let i = 0; i < steps; i++) B(out, 0, TH - (i + 1) * s, -3.3 - (i + 1) * 0.17, 9.0, (i + 1) * 0.34, s, GRANITE, granite)
  // scale the whole to HEIGHT (the gate's own height, terrace excluded)
  const K = HEIGHT / (RIDGE + 0.73)
  for (let i = start; i < out.positions.length; i++) out.positions[i] *= K
}
