/**
 * THE TEMPLE GATE of the Japanese Tea Garden (the red two-storey gate on the path up from the pagoda; OSM
 * way/136888944). Evidence pack: docs/sf-batches/MODEL-TEA-GARDEN-TEMPLE-GATE.md — the owner's four photographs,
 * 2026-10-27, read part by part ("a high detail builder in the same style … smaller but more complex, especially
 * with the complex roof curves"). Was `gate()` in tea-garden.ts (four posts under a gabled roof), then an AI GLB.
 *
 * A four-legged gate (yotsuashi-mon): two round MAIN POSTS on the passage line, each flanked front and back by a
 * slimmer SECONDARY POST, tied to it by two rails; all on granite plinth blocks with dark iron shoes. Over them a
 * deep LINTEL with gilt ends and a gilt-and-cream bracket capital on every post; a cream FRIEZE with red cloud panels;
 * a band of red BRACKET ARMS with slate-grey ends; the BALCONY — a white-striped deck under a light red rail of
 * posts and three rails ("fewer supports", as the pagoda's). The UPPER STOREY: cream walls in a red frame, gilt
 * capitals, a cusped-arch lattice window at the centre of the front and back, a teal louvred panel each side. The
 * EAVE as the pagoda's: two tiers of rafters, a fascia that follows the curve, white bosses. The ROOF is slate-blue
 * copper, hip-and-gable (irimoya): a skirt whose corners curl up and whose front and back eaves rise in a cusped
 * KARAHAFU wave over the middle, then the hips, the vertical gables with a bargeboard and gilt roundels, a ridge with
 * gilt end ornaments and a crest. Gilt cloud ornaments under the karahafu and on the gable faces.
 *
 * Local frame: y up; the PASSAGE runs along z (the front face along x, the ridge along x), the main posts at ±x on
 * the z = 0 line. Built in metres from the photographs (a 1.7 m visitor under the lintel: ridge about 10 m) and
 * scaled to HEIGHT at the end.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { prism, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { B, Q, type P3, fan, loft, ring, curl, wave } from './tea-garden-kit.ts'

const HEIGHT = 9.6
const RED: Rgb = [0.72, 0.16, 0.08]
const CREAM: Rgb = [0.93, 0.90, 0.80]
const WHITE: Rgb = [0.94, 0.94, 0.92]
const GILT: Rgb = [0.85, 0.62, 0.22]
const TEAL: Rgb = [0.10, 0.42, 0.38]
const ROOF: Rgb = [0.33, 0.38, 0.42]   // weathered copper, slate-blue
const SLATE: Rgb = [0.30, 0.33, 0.36]
const DARK: Rgb = [0.12, 0.09, 0.08]
const GRANITE: Rgb = [0.60, 0.60, 0.58]

/** the balcony rail: corner and third posts with caps, a top rail and two slim lower rails */
function rail(out: MeshBuilder, y: number, hx: number, hz: number, h: number): void {
  for (const x of [-hx, -hx / 3, hx / 3, hx]) for (const z of [-hz, hz]) { B(out, x, y, z, 0.1, 0.1, h, RED); B(out, x, y + h, z, 0.15, 0.15, 0.05, RED) }
  for (const x of [-hx, hx]) { B(out, x, y, 0, 0.1, 0.1, h, RED); B(out, x, y + h, 0, 0.15, 0.15, 0.05, RED) }
  for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const cx = sx * hx, cz = sz * hz
    const lx = sx ? 0.07 : 2 * hx, lz = sz ? 0.07 : 2 * hz
    B(out, cx, y + h - 0.1, cz, lx, lz, 0.08, RED)
    B(out, cx, y + h - 0.16, cz, lx * 0.99, lz * 0.99, 0.025, WHITE)
    B(out, cx, y + h * 0.55, cz, lx * 0.9, lz * 0.9, 0.045, RED)
    B(out, cx, y + h * 0.3, cz, lx * 0.9, lz * 0.9, 0.045, RED)
  }
}

/** a cusped-arch lattice window on the face z = sz·d, centred at x = u */
function latticeWindow(out: MeshBuilder, sz: number, u: number, y: number, w: number, h: number, d: number): void {
  const pz = sz * (d + 0.02)
  B(out, u, y, pz, w, 0.06, h, WHITE)
  const prof: [number, number][] = [[-w / 2, h], [w / 2, h], [w / 2, h + 0.14], [w * 0.2, h + 0.24], [0, h + 0.42], [-w * 0.2, h + 0.24], [-w / 2, h + 0.14]]
  for (const off of [-0.035, 0.035]) {
    const pts = prof.map(([a, yy]): P3 => [u + a, y + yy, pz + off])
    fan(out, pts, WHITE, 0, [0, 0, sz * Math.sign(off)])
  }
  for (const a of [-w / 2, w / 2]) B(out, u + a, y, pz, 0.06, 0.09, h + 0.14, RED)
  B(out, u, y - 0.03, pz, w + 0.06, 0.09, 0.06, RED)
  for (let k = -3; k <= 3; k++) B(out, u + k * w / 7.5, y + 0.04, pz + sz * 0.02, 0.025, 0.05, h - 0.08, DARK)
  for (let k = 1; k < 4; k++) B(out, u, y + h * k / 4, pz + sz * 0.02, w - 0.04, 0.05, 0.025, DARK)
}

/** a teal louvred panel in a red frame on the face z = sz·d */
function louvre(out: MeshBuilder, sz: number, u: number, y: number, w: number, h: number, d: number): void {
  const pz = sz * (d + 0.02)
  B(out, u, y, pz, w, 0.05, h, TEAL)
  for (let k = 0; k < 7; k++) B(out, u, y + 0.06 + k * (h - 0.12) / 7, pz + sz * 0.02, w - 0.04, 0.04, 0.03, [0.06, 0.3, 0.27])
  for (const a of [-w / 2, w / 2]) B(out, u + a, y, pz, 0.06, 0.08, h, RED)
  B(out, u, y + h - 0.03, pz, w + 0.06, 0.08, 0.06, RED)
}

/** a gilt-and-cream bracket capital (a kumimono cluster) on a post top at (x, z): a cream block with gilt arms */
function capital(out: MeshBuilder, x: number, y: number, z: number, s: number): void {
  B(out, x, y, z, s, s, s * 0.45, GILT)
  B(out, x, y + s * 0.45, z, s * 1.5, s * 0.6, s * 0.3, CREAM)
  B(out, x, y + s * 0.45, z, s * 0.6, s * 1.5, s * 0.3, CREAM)
  B(out, x, y + s * 0.75, z, s * 1.9, s * 0.5, s * 0.25, GILT)
  B(out, x, y + s * 0.75, z, s * 0.5, s * 1.9, s * 0.25, GILT)
}

/** a gilt cloud ornament on a face z = sz·d */
function cloud(out: MeshBuilder, sz: number, u: number, y: number, s: number, d: number, c: Rgb = GILT): void {
  const pz = sz * (d + 0.03)
  B(out, u, y, pz, s, 0.04, s * 0.4, c)
  B(out, u, y + s * 0.4, pz, s * 0.55, 0.04, s * 0.25, c)
}

export function teaGardenTempleGate(out: MeshBuilder, _fit: Fit): void {
  const start = out.positions.length
  const tile = surfaceTag('tile'), granite = surfaceTag('granite')
  const PX = 2.1          // the main posts' x
  const SZ = 1.35         // the secondary posts' z
  const LINTEL = 4.2      // the lintel's underside
  // the plinth blocks, the shoes, the posts and their ties
  for (const x of [-PX, PX]) {
    for (const z of [-SZ, 0, SZ]) {
      const main = z === 0
      B(out, x, 0, z, main ? 0.7 : 0.55, main ? 0.7 : 0.55, 0.45, GRANITE, granite)
      prism(out, x, z, 0.45, 0.78, main ? 0.2 : 0.16, 8, DARK, 0)
      prism(out, x, z, 0.78, LINTEL, main ? 0.19 : 0.145, 8, RED, 0)
    }
    for (const yTie of [1.05, 3.25]) B(out, x, yTie, 0, 0.16, 2 * SZ + 0.3, 0.16, RED)        // the ties through the main post
    B(out, x, 3.25, 0, 0.14, 2 * SZ + 0.6, 0.12, RED)
  }
  // the lintel across the passage, gilt ends; the cross beams along z over each post line
  B(out, 0, LINTEL, 0, 2 * PX + 1.6, 0.42, 0.5, RED)
  for (const x of [-PX - 0.8, PX + 0.8]) B(out, x, LINTEL + 0.02, 0, 0.3, 0.46, 0.46, GILT)
  for (const x of [-PX, PX]) B(out, x, LINTEL, 0, 0.32, 2 * SZ + 1.0, 0.5, RED)
  for (const x of [-PX, PX]) for (const z of [-SZ, 0, SZ]) capital(out, x, LINTEL + 0.5, z, 0.44)
  // the frieze: cream between red beams, red cloud panels at its centre on the front and back
  const F0 = LINTEL + 0.5, FH = 0.9
  B(out, 0, F0, 0, 2 * PX + 1.0, 2 * SZ + 0.3, FH, CREAM, surfaceTag('stucco'))
  B(out, 0, F0, 0, 2 * PX + 1.1, 2 * SZ + 0.4, 0.14, RED)
  B(out, 0, F0 + FH - 0.14, 0, 2 * PX + 1.1, 2 * SZ + 0.4, 0.14, RED)
  for (const x of [-PX, PX]) B(out, x, F0, 0, 0.3, 2 * SZ + 0.45, FH, RED)
  for (const sz of [-1, 1]) { cloud(out, sz, 0, F0 + 0.25, 0.9, SZ + 0.15, RED); cloud(out, sz, 0, F0 + 0.3, 0.55, SZ + 0.18, GILT) }
  // the bracket band: a red plate and rows of bracket arms with slate ends, then the deck
  const BK = F0 + FH, DECK = BK + 0.5
  B(out, 0, BK, 0, 2 * PX + 1.4, 2 * SZ + 0.7, 0.16, RED)
  for (const sz of [-1, 1]) for (let i = 0; i < 9; i++) {
    const x = -PX - 0.4 + (2 * PX + 0.8) * i / 8
    B(out, x, BK + 0.16, sz * (SZ + 0.55), 0.14, 0.9, 0.16, RED)
    B(out, x, BK + 0.16, sz * (SZ + 0.95), 0.16, 0.12, 0.18, SLATE)
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) {
    const z = -SZ - 0.2 + (2 * SZ + 0.4) * i / 4
    B(out, sx * (PX + 0.75), BK + 0.16, z, 0.9, 0.14, 0.16, RED)
    B(out, sx * (PX + 1.15), BK + 0.16, z, 0.12, 0.16, 0.18, SLATE)
  }
  const DX = PX + 1.3, DZ = SZ + 1.05
  B(out, 0, DECK - 0.14, 0, 2 * DX, 2 * DZ, 0.2, RED)
  B(out, 0, DECK - 0.07, 0, 2 * DX + 0.02, 2 * DZ + 0.02, 0.04, WHITE)
  rail(out, DECK + 0.06, DX - 0.1, DZ - 0.1, 0.8)
  // the upper storey
  const UX = PX + 0.35, UZ = SZ + 0.1, U0 = DECK + 0.06, UH = 1.55
  B(out, 0, U0, 0, 2 * UX, 2 * UZ, UH, CREAM, surfaceTag('stucco'))
  B(out, 0, U0, 0, 2 * UX + 0.1, 2 * UZ + 0.1, 0.14, RED)
  B(out, 0, U0 + UH - 0.16, 0, 2 * UX + 0.1, 2 * UZ + 0.1, 0.16, RED)
  for (const x of [-UX, UX]) for (const z of [-UZ, UZ]) { B(out, x, U0, z, 0.22, 0.22, UH, RED); capital(out, x, U0 + UH, z, 0.36) }
  for (const x of [-UX, UX]) { B(out, x, U0, 0, 0.18, 0.18, UH, RED); capital(out, x, U0 + UH, 0, 0.3) }
  for (const sz of [-1, 1]) {
    latticeWindow(out, sz, 0, U0 + 0.3, 0.9, 0.9, UZ)
    for (const u of [-1.35, 1.35]) { louvre(out, sz, u, U0 + 0.3, 0.7, 0.95, UZ); B(out, u, U0, sz * (UZ + 0.02), 0.95, 0.08, 0.3, RED) }
    for (const u of [-0.75, 0.75]) B(out, u, U0, sz * (UZ + 0.03), 0.14, 0.1, UH, RED)
    B(out, 0, U0 + UH - 0.5, sz * (UZ + 0.03), 0.6, 0.04, 0.3, GILT)
  }
  // the eave: bracket plate, two tiers of rafters, fascia with bosses, bells
  const EB = U0 + UH + 0.36
  B(out, 0, EB, 0, 2 * UX + 0.9, 2 * UZ + 0.9, 0.2, RED)
  const HX = 5.0, HZ = 3.3                        // the eave's half-sizes
  const lift = 0.5, bump = 0.55
  for (const [yt, inset, depth] of [[EB + 0.2, 0.12, 0.09], [EB + 0.42, 0.42, 0.08]] as [number, number, number][]) {
    for (let i = 0; i <= 12; i++) {
      const x = -UX + 2 * UX * i / 12
      for (const sz of [-1, 1]) { const ln = HZ - inset - UZ * 0.9; B(out, x, yt, sz * (UZ * 0.9 + ln / 2), depth, ln, depth, RED) }
    }
    for (let i = 0; i <= 8; i++) {
      const z = -UZ + 2 * UZ * i / 8
      for (const sx of [-1, 1]) { const ln = HX - inset - UX * 0.9; B(out, sx * (UX * 0.9 + ln / 2), yt, z, ln, depth, depth, RED) }
    }
    for (const [cx, cz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) for (let j = 1; j < 4; j++) {
      const a = Math.atan2(cz * HZ, cx * HX) + (j - 2) * 0.2, ln = Math.hypot(HX - UX, HZ - UZ) * 1.05
      const ax = cx * UX * 0.92, az = cz * UZ * 0.92, yy = yt + depth / 2
      strut(out, [ax, yy, az], [ax + Math.cos(a) * ln, yy, az + Math.sin(a) * ln], depth, depth, RED, 0, false)
    }
  }
  const YF = EB + 0.56
  const NX = 16, NZ = 8
  const lo = ring(HX - 0.04, HZ - 0.04, YF, lift, NX, NZ, bump), hi = ring(HX - 0.04, HZ - 0.04, YF + 0.22, lift, NX, NZ, bump)
  const li = ring(HX - 0.12, HZ - 0.12, YF, lift, NX, NZ, bump), hi2 = ring(HX - 0.12, HZ - 0.12, YF + 0.22, lift, NX, NZ, bump)
  loft(out, lo, hi, RED); loft(out, hi2, li, RED); loft(out, hi, hi2, RED); loft(out, li, lo, RED)
  for (const sz of [-1, 1]) for (let i = 0; i <= 18; i++) {
    const t = -HX + 0.3 + (2 * HX - 0.6) * i / 18, u = t / HX
    B(out, t, YF + 0.07 + lift * curl(Math.abs(u)) + bump * wave(u, 0.4), sz * (HZ + 0.01), 0.07, 0.07, 0.07, WHITE)
  }
  for (const sx of [-1, 1]) for (let i = 0; i <= 9; i++) {
    const t = -HZ + 0.3 + (2 * HZ - 0.6) * i / 9
    B(out, sx * (HX + 0.01), YF + 0.07 + lift * curl(Math.abs(t / HZ)), t, 0.07, 0.07, 0.07, WHITE)
  }
  for (const [cx, cz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
    const a = Math.atan2(cz * (HZ - UZ), cx * (HX - UX)), ln = Math.hypot(HX - UX, HZ - UZ) * 1.1
    strut(out, [cx * UX, YF + 0.3, cz * UZ], [cx * UX + Math.cos(a) * ln, YF + 0.3 + lift * 1.1, cz * UZ + Math.sin(a) * ln], 0.16, 0.16, RED)
    B(out, cx * (HX - 0.35), YF - 0.3, cz * (HZ - 0.35), 0.02, 0.02, 0.3, DARK)
    prism(out, cx * (HX - 0.35), cz * (HZ - 0.35), YF - 0.48, YF - 0.3, 0.11, 6, DARK, 0, 0.05)
  }
  // the gilt cloud under the karahafu's crest, front and back
  for (const sz of [-1, 1]) cloud(out, sz, 0, YF + 0.24, 0.7, HZ - 0.3)
  // THE ROOF: the skirt (curling corners, the karahafu wave), the hips, the gables, the ridge
  const YR = YF + 0.22, RISE = 0.85
  const eave = ring(HX, HZ, YR, lift, NX, NZ, bump)
  const MX = HX * 0.62, MZ = HZ * 0.6, YM = YR + RISE
  const mid = ring(MX, MZ, YM, 0.05, NX, NZ, bump * 0.25, 0.3)
  loft(out, eave, mid, ROOF, tile)
  const under = ring(HX, HZ, YR - 0.14, lift, NX, NZ, bump)
  loft(out, under, eave, ROOF, tile)
  fan(out, under, ROOF, tile, [0, -1, 0])
  // the hips rise from the mid ring to the gable base; the long sides go on to the ridge
  const GX = MX * 0.8, GZ = MZ * 0.85, YG = YM + 0.4, RIDGE = YG + 1.05
  const gable = ring(GX, GZ, YG, 0, NX, NZ)
  loft(out, mid, gable, ROOF, tile)
  const ridge: P3[] = ring(GX, 0, RIDGE, 0, NX, NZ).map(p => [p[0], RIDGE, 0])
  loft(out, gable, ridge, ROOF, tile)
  // the vertical gable faces (cream, with a slate bargeboard and gilt roundels)
  for (const sx of [-1, 1]) {
    const gz = GZ
    const face: P3[] = [[sx * GX, YG, -gz], [sx * GX, RIDGE, 0], [sx * GX, YG, gz]]
    Q(out, [face[0], face[1], face[2], face[2]], CREAM, surfaceTag('stucco'))
    for (const s of [-1, 1]) strut(out, [sx * (GX + 0.04), YG - 0.05, s * (gz + 0.1)], [sx * (GX + 0.04), RIDGE + 0.1, 0], 0.08, 0.2, SLATE)
    for (const z of [-gz * 0.45, gz * 0.45]) prism(out, sx * (GX + 0.06), z, YG + 0.25, YG + 0.3, 0.14, 8, GILT, 0)
    B(out, sx * (GX + 0.06), YG + 0.45, 0, 0.04, 0.5, 0.2, GILT)   // the gable's gilt ornament
  }
  B(out, 0, RIDGE - 0.08, 0, 2 * GX + 0.2, 0.26, 0.16, SLATE)
  for (const sx of [-1, 1]) { B(out, sx * (GX + 0.05), RIDGE, 0, 0.3, 0.3, 0.45, GILT); B(out, sx * (GX + 0.05), RIDGE + 0.45, 0, 0.18, 0.4, 0.2, GILT) }
  B(out, 0, RIDGE + 0.08, 0, 0.5, 0.3, 0.3, SLATE)
  // scale the whole to HEIGHT
  const K = HEIGHT / (RIDGE + 0.65)
  for (let i = start; i < out.positions.length; i++) out.positions[i] *= K
}
