/**
 * Batch 6's parks' small structures (2026-10-31; the planting is tools/gardens/paris-batch6.ts). Each says what it was read from: places are OSM's or the aerial's pixels; the looks are from memory of the places and the photographs named, and say so where they are a guess. Local frames: front −z. An entry with `front: 180` has local x east and z north, so a park's plan can be written in metres off the aerial.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { block, dome, hex, roof, shade, type Rgb } from '../../kit.ts'
import { crag } from '../batch3/parks.ts'
import { archOn, rectOn } from '../palaces/common.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const groundOf = (fit: Fit) => (x: number, z: number): number => fit.groundAt?.(x, z) ?? fit.grade ?? 0
const STONE = hex('#b6ab94'), STONE_DK = shade(STONE, 0.78), IRON = hex('#1f2527'), TILE = hex('#6a3526'), SLATE = hex('#4a5155')
const GILT: Rgb = [0.72, 0.56, 0.2], WATER: Rgb = [0.13, 0.2, 0.21], FOAM: Rgb = [0.66, 0.7, 0.68]
const ash = surfaceTag('ashlar'), metal = surfaceTag('metal')

/** A flat ring of `n` wedges at y, from r0 to r1 round (x, z), a0..a1 in radians from +x. */
function flatRing(out: MeshBuilder, x: number, z: number, y: number, r0: number, r1: number, a0: number, a1: number, n: number, c: Rgb, rz = 1): void {
  for (let i = 0; i < n; i++) {
    const p = a0 + ((a1 - a0) * i) / n, q = a0 + ((a1 - a0) * (i + 1)) / n
    out.quad([[x + Math.cos(p) * r0, y, z + Math.sin(p) * r0 * rz], [x + Math.cos(q) * r0, y, z + Math.sin(q) * r0 * rz], [x + Math.cos(q) * r1, y, z + Math.sin(q) * r1 * rz], [x + Math.cos(p) * r1, y, z + Math.sin(p) * r1 * rz]], [0, 1, 0], UV, c, 0)
  }
}

/** A round basin: a low stone kerb, its coping and the water. `grass` a ring of lawn round it first. */
function basin(out: MeshBuilder, x: number, z: number, y: number, r: number, rz = 1): void {
  const n = 32, h = 0.45
  for (let i = 0; i < n; i++) {
    const p = (i / n) * Math.PI * 2, q = ((i + 1) / n) * Math.PI * 2, m = (p + q) / 2
    out.quad([[x + Math.cos(p) * (r + 0.7), y - 1, z + Math.sin(p) * (r + 0.7) * rz], [x + Math.cos(q) * (r + 0.7), y - 1, z + Math.sin(q) * (r + 0.7) * rz], [x + Math.cos(q) * (r + 0.7), y + h, z + Math.sin(q) * (r + 0.7) * rz], [x + Math.cos(p) * (r + 0.7), y + h, z + Math.sin(p) * (r + 0.7) * rz]], [Math.cos(m), 0, Math.sin(m)], UV, STONE_DK, 0)
  }
  flatRing(out, x, z, y + h, r, r + 0.7, 0, Math.PI * 2, n, STONE, rz)
  flatRing(out, x, z, y + 0.2, 0, r, 0, Math.PI * 2, n, WATER, rz)
}

/* ---------------------------------------------------------------------------------------- Parc Georges-Brassens */

const HALL_BAY = 11

/** A run of the market's transverse roofs, x0..x1, over open cast-iron bays: tile on the lower slopes, the glazed lantern along each ridge (aerial 48.8315 2.3010: orange and grey in turn). */
function marketRun(out: MeshBuilder, x0: number, x1: number, hz: number, y: number): void {
  const bays = Math.max(1, Math.round((x1 - x0) / HALL_BAY)), w = (x1 - x0) / bays, E = y + 5.4, R = y + 9.2, LAN = hex('#6f797a'), PAINT = hex('#3a4a45')
  for (let k = 0; k < bays; k++) {
    const a = x0 + k * w, b = a + w, m = (a + b) / 2, lw = 1.5
    const slope = (s: 1 | -1, f0: number, f1: number, c: Rgb): void => {
      const e = s < 0 ? a : b, n = Math.hypot(R - E, w / 2)
      const P = (f: number, z: number): [number, number, number] => [e + (m - e) * f, E + (R - E) * f, z]
      out.quad([P(f0, -hz), P(f1, -hz), P(f1, hz), P(f0, hz)], [(s * (R - E)) / n, (w / 2) / n, 0], UV, c, 0)
    }
    for (const s of [-1, 1] as const) { slope(s, 0, 0.68, shade(TILE, s < 0 ? 1 : 0.92)); slope(s, 0.68, 1, LAN) }
    // the lantern's raised ridge
    block(out, m - lw, m + lw, -hz, hz, R, R + 0.55, shade(LAN, 1.05))
    block(out, m - lw - 0.15, m + lw + 0.15, -hz - 0.1, hz + 0.1, R + 0.55, R + 0.7, SLATE)
    // the gable ends: a dark iron and glass fan under the eaves, both fronts
    for (const z of [-hz, hz]) {
      const nz = Math.sign(z)
      out.quad([[a, E, z], [b, E, z], [m, R, z], [m, R, z]], [0, 0, nz], UV, hex('#6c7472'), 0)
      for (const t of [0.25, 0.5, 0.75]) strut(out, [a + (b - a) * t, E, z], [m, E + (R - E) * (1 - Math.abs(t - 0.5) * 2) + 0.02, z], 0.1, 0.1, PAINT, 0, false)
      block(out, a, b, z - 0.18, z + 0.18, E - 0.5, E, PAINT)
    }
    // the posts
    for (const z of [-hz, -hz / 3, hz / 3, hz]) {
      block(out, a - 0.14, a + 0.14, z - 0.14, z + 0.14, y, E, PAINT)
      if (k === bays - 1) block(out, b - 0.14, b + 0.14, z - 0.14, z + 0.14, y, E, PAINT)
    }
    block(out, a - 0.1, a + 0.1, -hz, hz, E - 0.35, E, PAINT)
    // the booksellers' stalls under it
    for (const z of [-hz * 0.55, hz * 0.55]) block(out, m - w * 0.36, m + w * 0.36, z - 0.65, z + 0.65, y, y + 0.95, hex('#4c5a47'))
  }
  block(out, x0, x1, -hz, hz, y - 0.3, y + 0.04, hex('#6e695f'))
}

/**
 * THE MARKET HALLS of the Vaugirard horse market (Ernest Moreau, 1894–1907, the Marché du Livre ancien since 1987; OSM way/80146216, building=roof; aerial 48.8315 2.3010, 0.26 m/px): the long iron hall on the Rue Brancion, its rank of transverse tiled roofs each with a glass lantern, broken about three-quarters of the way along by the paved court; open on all sides, the bookstalls under it at the weekend. Local −z to the Rue Brancion side, x along the hall.
 */
export function brassensHalls(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, L = fit.hx, H = Math.min(fit.hz, 13)
  marketRun(out, -L, L * 0.4, H, y)
  marketRun(out, L * 0.59, L, H, y)
}

/** The vignerons' hut at the head of the Clos des Morillons (aerial 48.8313 2.2985, 0.12 m/px, a red roof 5 × 6 m). */
export function closHut(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, W = hex('#b9ab90')
  block(out, -2.5, 2.5, -3, 3, y, y + 2.8, W)
  rectOn(out, '-z', -3, -0.6, 0.6, y, y + 2.1, hex('#3f3127'))
  rectOn(out, '-x', -2.5, -1, 1, y + 1, y + 2, hex('#2a2b2b'))
  roof(out, -3, 3, -3.5, 3.5, y + 2.8, 1.9, 3, 1.2, TILE)
}

/** THE LITTLE AMPHITHEATRE by the book market (aerial (650, 600)): two half-rounds of low stone steps either side of a walk on bearing 50, a place for puppet shows and schoolchildren's picnics. */
export function brassensAmphi(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit)
  const axis = ((90 - 50) * Math.PI) / 180
  for (const [s, cx, cz] of [[1, -2.5, 1.5], [-1, 3, -2.5]] as const) {
    const y = G(cx, cz)
    for (let i = 0; i < 4; i++) {
      const r0 = 3 + i * 1.5, r1 = r0 + 1.5, top = y + 0.1 + (3 - i) * 0.0 + i * 0.32, a0 = axis + (s > 0 ? 0 : Math.PI), a1 = a0 + Math.PI
      flatRing(out, cx, cz, top, r0, r1, a0, a1, 10, shade(STONE, 0.66 + i * 0.03))
      for (let k = 0; k < 10; k++) {
        const p = a0 + (Math.PI * k) / 10, q = a0 + (Math.PI * (k + 1)) / 10, m = (p + q) / 2
        out.quad([[cx + Math.cos(p) * r0, top - 0.34, cz + Math.sin(p) * r0], [cx + Math.cos(q) * r0, top - 0.34, cz + Math.sin(q) * r0], [cx + Math.cos(q) * r0, top, cz + Math.sin(q) * r0], [cx + Math.cos(p) * r0, top, cz + Math.sin(p) * r0]], [-Math.cos(m), 0, -Math.sin(m)], UV, STONE_DK, 0)
      }
    }
  }
}

/* ---------------------------------------------------------------------------------------------------- Bagatelle */

/**
 * LE GRAND ROCHER and the KIOSQUE DE L'IMPÉRATRICE (Bélanger's rockwork of the 1770s, OSM's "Grotte des quatre vents" way/577580949 and the pond relation/8188977 south of it): a heap of artificial rock with the grotto's dark mouth at the water, a thread of cascade down it, and the little octagonal kiosk on top that Eugénie took tea in, with a view over the lawns. Kiosk from photographs in memory; −z to the pond.
 */
export function bagatelleRocher(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, R = hex('#5c5547')
  crag(out, 0, y - 0.5, 0.5, 7.5, 7.6, 6.5, 3.1, R)
  crag(out, -4.6, y - 0.5, -0.8, 4.2, 4.5, 4, 7.3, R)
  crag(out, 4.8, y - 0.5, -1, 3.8, 3.8, 4.2, 11.7, shade(R, 0.92))
  // the grotto's mouth and its lip of rock; the cascade
  archOn(out, '-z', -5.6, -1.4, y, 3.2, 3.2, hex('#14130f'), 0.12)
  block(out, -3.3, 0.5, -6, -5.2, y + 3.1, y + 3.7, shade(R, 0.84))
  for (let i = 0; i < 3; i++) strut(out, [2.2 + i * 0.5, y + 5.6 - i * 0.2, -3.8 - i * 0.2], [2.5 + i * 0.5, y + 0.1, -6 - i * 0.25], 0.42, 0.12, FOAM, 0, false)
  // the steps up its west flank
  for (let i = 0; i < 7; i++) block(out, -7.6 + i * 0.6, -6.1 + i * 0.6, -1 + i * 0.55, 0.6 + i * 0.55, y, y + 0.5 + i * 0.62, shade(R, 0.8))
  // the kiosk: a stone floor on the rock's head, eight painted posts, the lattice rail, the flared lead roof and its gilt finial
  const K = y + 6.7, r = 2.5, G = hex('#3a5046'), PALE = hex('#c6bc9f')
  prism(out, 0, 0.3, K - 0.8, K, r + 0.55, 8, shade(STONE, 0.86), ash)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2, x = Math.cos(a) * r, z = 0.3 + Math.sin(a) * r
    const b = ((i + 1.5) / 8) * Math.PI * 2, xb = Math.cos(b) * r, zb = 0.3 + Math.sin(b) * r
    block(out, x - 0.1, x + 0.1, z - 0.1, z + 0.1, K, K + 2.9, G)
    strut(out, [x, K + 0.85, z], [xb, K + 0.85, zb], 0.07, 0.07, PALE, 0, false)
    strut(out, [x, K + 2.55, z], [xb, K + 2.55, zb], 0.09, 0.3, PALE, 0, false)
  }
  prism(out, 0, 0.3, K + 2.85, K + 3, r + 0.95, 8, shade(SLATE, 1.05), metal)
  prism(out, 0, 0.3, K + 3, K + 3.95, r + 0.95, 8, SLATE, metal, 1.05)
  prism(out, 0, 0.3, K + 3.95, K + 4.7, 1.05, 8, SLATE, metal, 0.12)
  box(out, 0, K + 4.82, 0.3, 0.13, 0.13, 0.13, GILT, metal)
  prism(out, 0, 0.3, K + 4.9, K + 5.25, 0.05, 5, GILT, metal)
}

/* ------------------------------------------------------------------------------------------------- Albert-Kahn */

/** A low Japanese house: raised on stone, dark posts and white paper screens, the deep hipped tile roof with lifted corners, the engawa along its front. −z its front. */
function nihonHouse(out: MeshBuilder, x: number, z: number, y: number, w: number, d: number, roofH = 2.4): void {
  const WOOD = hex('#3b2c20'), PAPER = hex('#c9c3ae'), TL = hex('#3c4242')
  block(out, x - w / 2 - 0.1, x + w / 2 + 0.1, z - d / 2 - 0.1, z + d / 2 + 0.1, y, y + 0.45, STONE_DK)
  // the engawa, the veranda boards
  block(out, x - w / 2 - 0.2, x + w / 2 + 0.2, z - d / 2 - 1.05, z - d / 2 + 0.1, y + 0.38, y + 0.5, hex('#60442d'))
  block(out, x - w / 2, x + w / 2, z - d / 2, z + d / 2, y + 0.45, y + 2.75, PAPER)
  const bays = Math.round(w / 1.6), step = w / bays
  for (let i = 0; i <= bays; i++) {
    const t = x - w / 2 + i * step
    for (const f of [z - d / 2, z + d / 2]) block(out, t - 0.07, t + 0.07, f - 0.09, f + 0.09, y + 0.45, y + 2.75, WOOD)
    if (i < bays) {
      block(out, t + 0.02, t + step - 0.02, z - d / 2 - 0.04, z - d / 2 + 0.01, y + 2.05, y + 2.14, WOOD)
      block(out, t + 0.02, t + step - 0.02, z - d / 2 - 0.04, z - d / 2 + 0.01, y + 1, y + 1.08, WOOD)
    }
  }
  for (let i = 0; i <= Math.round(d / 1.6); i++) {
    const t = z - d / 2 + (i * d) / Math.round(d / 1.6)
    for (const f of [x - w / 2, x + w / 2]) block(out, f - 0.09, f + 0.09, t - 0.07, t + 0.07, y + 0.45, y + 2.75, WOOD)
  }
  block(out, x - w / 2, x + w / 2, z - d / 2 - 0.06, z + d / 2 + 0.06, y + 2.75, y + 3, WOOD)
  // the veranda posts
  for (const t of [-0.5, 0, 0.5]) block(out, x + t * w - 0.07, x + t * w + 0.07, z - d / 2 - 1.05, z - d / 2 - 0.93, y + 0.5, y + 2.7, WOOD)
  // the roof: a shallow skirt out over the veranda, then the steep hip
  const E = y + 3, o = 1.25
  roof(out, x - w / 2 - o, x + w / 2 + o, z - d / 2 - o - 0.4, z + d / 2 + o, E - 0.3, 0.7, o * 0.9, o * 0.9, shade(TL, 0.92))
  roof(out, x - w / 2 - 0.1, x + w / 2 + 0.1, z - d / 2 - 0.3, z + d / 2 + 0.1, E + 0.4, roofH, Math.min(w, d) * 0.3, (d + 0.4) / 2, TL)
  block(out, x - w * 0.22, x + w * 0.22, z - 0.15, z + 0.15, E + 0.4 + roofH - 0.05, E + 0.4 + roofH + 0.18, hex('#2a2d2d'))
}

/** A stone lantern, the tōrō. */
function lantern(out: MeshBuilder, x: number, z: number, y: number, h = 1.5): void {
  const S = hex('#5e5c52')
  prism(out, x, z, y, y + 0.14, 0.32, 6, S)
  prism(out, x, z, y + 0.14, y + h * 0.52, 0.1, 6, S)
  prism(out, x, z, y + h * 0.52, y + h * 0.62, 0.28, 6, S)
  prism(out, x, z, y + h * 0.62, y + h * 0.8, 0.2, 6, hex('#2d2c28'))
  prism(out, x, z, y + h * 0.8, y + h * 0.92, 0.42, 6, S, 0, 0.14)
  prism(out, x, z, y + h * 0.92, y + h, 0.08, 5, S, 0, 0.02)
}

/** A red hump bridge across z (its deck along local z at x, half-span s), the rails on posts. */
function redBridge(out: MeshBuilder, x: number, z: number, y: number, s: number, w: number, along: 'x' | 'z'): void {
  const RED = hex('#a12b1f'), DECK = hex('#5e3b26'), n = 8
  const P = (t: number, side: number, up: number): [number, number, number] => {
    const u = -s + (2 * s * t) / n, h = y + 0.55 + (1 - (u / s) ** 2) * (s * 0.24) + up
    return along === 'z' ? [x + side, h, z + u] : [x + u, h, z + side]
  }
  for (let t = 0; t < n; t++) {
    strut(out, P(t, 0, 0), P(t + 1, 0, 0), along === 'z' ? w : 0.2, 0.18, along === 'z' ? DECK : DECK, 0)
    if (along === 'x') strut(out, P(t, 0, 0), P(t + 1, 0, 0), w, 0.18, DECK, 0)
    for (const side of [-w / 2, w / 2]) {
      strut(out, P(t, side, 0.95), P(t + 1, side, 0.95), 0.09, 0.09, RED, 0, false)
      strut(out, P(t, side, 0.5), P(t + 1, side, 0.5), 0.06, 0.06, RED, 0, false)
    }
  }
  for (let t = 0; t <= n; t += 2) {
    for (const side of [-w / 2, w / 2]) {
      const a = P(t, side, 0.02), b = P(t, side, 1.1)
      strut(out, a, b, 0.11, 0.11, RED, 0)
      box(out, b[0], b[1] + 0.06, b[2], 0.08, 0.08, 0.08, GILT, metal)
    }
  }
  // the legs in the water
  for (const t of [2, 4, 6]) {
    for (const side of [-w / 2, w / 2]) {
      const a = P(t, side, 0)
      strut(out, a, [a[0], y - 0.2, a[2]], 0.13, 0.13, RED, 0)
    }
  }
}

/**
 * THE JAPANESE VILLAGE (Albert Kahn's, 1898; the Takano garden over it, 1990). OSM's pond way/113610865, the rest under its trees is the museum's plan and photographs in memory: the red bridge over the western stream and the second one at the neck between the south and north-east pools (OSM's own outline narrows there), the two old houses brought over from Japan on the north bank and the tea pavilion across the water, stone lanterns on the banks. front 180, centre the pond's: x east, z north.
 */
export function kahnVillage(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit)
  redBridge(out, -20, -1, G(-20, -1), 5.5, 1.7, 'z')
  redBridge(out, 20.5, 5.6, G(20.5, 5.6), 4.5, 1.5, 'x')
  nihonHouse(out, -11, 27, G(-11, 27), 8.5, 5.6)
  nihonHouse(out, 4, 31, G(4, 31), 7, 5)
  nihonHouse(out, 30, -9, G(30, -9), 4.6, 4.2, 1.9)
  for (const [x, z] of [[-24, 5], [-16, -7], [-5, 14], [9, 21], [26, 11], [14, 0], [27, -2], [-1, -8]] as const) lantern(out, x, z, G(x, z), z % 2 ? 1.5 : 1.9)
}

/**
 * LA SERRE (OSM way/72677028, 36 × 14 m; aerial 48.8415 2.2265): Kahn's palm house at the head of the French garden, its octagonal lantern in the middle of two long wings. The glass is drawn pale with its white bars on it: the `glass` surface renders opaque and dark.
 */
export function kahnSerre(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, HX = fit.hx, HZ = Math.max(4, fit.hz - 2.4), GL = hex('#8fa39e'), BAR = hex('#d4d6cf'), BASE = hex('#a89d88'), E = y + 4.2, R = y + 6.2
  block(out, -HX, HX, -HZ, HZ, y, y + 0.7, BASE)
  block(out, -HX, HX, -HZ + 0.03, HZ - 0.03, y + 0.7, E, GL)
  // the wings' pitched glass roofs and their bars
  for (const s of [-1, 1]) {
    const n = Math.hypot(R - E, HZ)
    out.quad([[-HX, E, s * HZ], [HX, E, s * HZ], [HX, R, 0], [-HX, R, 0]], [0, HZ / n, (s * (R - E)) / n], UV, shade(GL, 1.08), 0)
    for (let x = -HX; x <= HX + 0.01; x += 2) {
      strut(out, [x, E, s * (HZ + 0.03)], [x, R, 0], 0.09, 0.09, BAR, 0, false)
      block(out, x - 0.05, x + 0.05, s * HZ - 0.06, s * HZ + 0.06, y + 0.7, E, BAR)
    }
  }
  for (const x of [-HX, HX]) {
    for (let z = -HZ; z <= HZ + 0.01; z += 2) block(out, x - 0.06, x + 0.06, z - 0.05, z + 0.05, y + 0.7, E + (R - E) * (1 - Math.abs(z) / HZ), BAR)
    out.quad([[x, E, -HZ], [x, E, HZ], [x, R, 0], [x, R, 0]], [Math.sign(x), 0, 0], UV, GL, 0)
  }
  block(out, -HX, HX, -HZ - 0.05, HZ + 0.05, E - 0.1, E + 0.05, BAR)
  block(out, -HX, HX, -0.1, 0.1, R - 0.05, R + 0.15, BAR)
  // the lantern: octagon standing proud of the south face, its dome of glass and ribs
  const Z = -2, r = 6.4
  prism(out, 0, Z, y, y + 0.8, r + 0.25, 8, BASE)
  prism(out, 0, Z, y + 0.8, y + 6.4, r, 8, GL)
  prism(out, 0, Z, y + 6.4, y + 6.65, r + 0.15, 8, BAR)
  prism(out, 0, Z, y + 6.65, y + 9.6, r, 8, shade(GL, 1.1), 0, 1.5)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a)
    strut(out, [cx * (r + 0.03), y + 0.8, Z + cz * (r + 0.03)], [cx * (r + 0.03), y + 6.4, Z + cz * (r + 0.03)], 0.12, 0.12, BAR, 0, false)
    strut(out, [cx * (r + 0.03), y + 6.65, Z + cz * (r + 0.03)], [cx * 1.5, y + 9.6, Z + cz * 1.5], 0.12, 0.12, BAR, 0, false)
  }
  prism(out, 0, Z, y + 9.6, y + 10.4, 1.5, 8, GL, 0, 1.3)
  prism(out, 0, Z, y + 10.4, y + 10.7, 1.45, 8, BAR, 0, 0.1)
  // the steps down to the French garden
  block(out, -2.6, 2.6, Z - r - 1.2, Z - r + 0.4, y, y + 0.3, BASE)
}

/* ---------------------------------------------------------------------------------------------- Parc de Billancourt */

/** THE PARASOLS on the round place at the park's south-east corner (aerial 48.82612 2.23611, (750, 660)): five white shade discs on thin poles, as the photograph shows them, with benches. */
export function billancourtParasols(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit), W = hex('#a4a49c')
  for (const [x, z, r] of [[0, 0, 3], [-5, 2.4, 2.2], [4.8, -2.6, 2.4], [-1.8, -4.8, 1.9], [3.6, 3.8, 1.8]] as const) {
    const y = G(x, z), h = 3 + r * 0.25
    prism(out, x, z, y, y + h, 0.07, 6, IRON)
    prism(out, x, z, y + h, y + h + 0.5, r, 12, W, 0, 0.15)
    prism(out, x, z, y + h - 0.1, y + h, r, 12, shade(W, 0.8))
    block(out, x + r * 0.55, x + r * 0.55 + 1.5, z - 0.22, z + 0.22, y + 0.38, y + 0.46, hex('#6c5a44'))
    block(out, x + r * 0.55 + 0.1, x + r * 0.55 + 1.4, z - 0.15, z + 0.15, y, y + 0.38, IRON)
  }
}

/* --------------------------------------------------------------------------------------------------- Saint-Cloud */

/** A statue block: a heap of plinth and a figure's mass, a stand-in. */
function figure(out: MeshBuilder, x: number, z: number, y: number, h: number, c: Rgb): void {
  block(out, x - 0.5, x + 0.5, z - 0.5, z + 0.5, y, y + 0.5, STONE)
  prism(out, x, z, y + 0.5, y + 0.5 + h * 0.65, h * 0.2, 7, c, 0, h * 0.14)
  prism(out, x, z, y + 0.5 + h * 0.65, y + 0.5 + h, h * 0.11, 6, c, 0, 0.03)
}

/**
 * LA GRANDE CASCADE DE SAINT-CLOUD (Lepautre, 1665; Hardouin-Mansart's lower court, 1698; the OSM node, and the aerial 48.8372 2.2190, 0.30 m/px: 39 m across and 51 m down the hill, axis on bearing 100): the great stepped stone water-stairs that come down to the round basin, the rock of the two river gods (the Seine and the Marne, a stand-in for Tripo) on its head, urns and grottoed walls either side, the water falling sheet by sheet down the middle. It stands at the end of the world's detail; a rider sees it from the Pont de Saint-Cloud's end of the Allée du Bord de l'Eau. −z down the hill.
 */
export function cloudCascade(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, HX = fit.hx, HZ = fit.hz, ST = hex('#a59983'), DK = shade(ST, 0.72), W = 7.5
  const tiers = 8, rise = 1.25, run = (2 * HZ - 10) / tiers
  for (let i = 0; i < tiers; i++) {
    const z0 = -HZ + i * run, z1 = z0 + run, top = y + (i + 1) * rise
    // the walks either side of the water, and the retaining walls under them
    for (const s of [-1, 1]) {
      const [a, b] = s < 0 ? [-HX, -W - 1] : [W + 1, HX]
      block(out, a, b, z0, HZ, y, top - 0.02, i % 2 ? ST : shade(ST, 0.94))
      // the arched grottoes in the walk's front
      for (const t of [-0.28, 0.28]) archOn(out, '-z', z0, (a + b) / 2 + t * (b - a), top - rise, 1.5, 1.1, hex('#22221e'), 0.04)
      // the urns along the edge
      for (const u of [W + 1.6, HX - 1.2]) {
        prism(out, s * u, z0 + 0.8, top, top + 0.4, 0.34, 6, DK)
        prism(out, s * u, z0 + 0.8, top + 0.4, top + 1.1, 0.42, 6, ST, 0, 0.24)
      }
      block(out, Math.min(s * (W + 1), s * HX), Math.max(s * (W + 1), s * HX), z0 - 0.02, z0 + 0.18, top, top + 0.55, shade(ST, 1.05))
    }
    // the sheet of water falling off this step, its basin, and the kerbs
    block(out, -W - 1, -W, z0, HZ, y, top + 0.3, DK)
    block(out, W, W + 1, z0, HZ, y, top + 0.3, DK)
    out.quad([[-W, top - rise, z0 - 0.02], [W, top - rise, z0 - 0.02], [W, top, z0 - 0.02], [-W, top, z0 - 0.02]], [0, 0, -1], UV, FOAM, 0)
    out.quad([[-W, top - 0.06, z0], [W, top - 0.06, z0], [W, top - 0.06, z1], [-W, top - 0.06, z1]], [0, 1, 0], UV, WATER, 0)
    block(out, -W, W, z0 + 0.02, z1, y, top - 0.08, DK)
  }
  // the head of it: the terrace wall and the river gods' rock
  const T = y + tiers * rise, Z = HZ - 10
  block(out, -HX, HX, Z, HZ, y, T + 0.5, ST)
  block(out, -HX - 0.1, HX + 0.1, Z - 0.1, Z + 0.3, T + 0.5, T + 1.1, shade(ST, 1.05))
  for (const x of [-4.2, 4.2]) figure(out, x, Z + 2.4, T + 0.5, 3.4, hex('#7e7a68'))
  crag(out, 0, T + 0.2, Z + 3.6, 3.5, 3.4, 2.4, 5.5, hex('#8c8370'))
  // the top's water spilling, and the jets on each step's middle
  for (let i = 1; i < tiers; i += 2) {
    const z = -HZ + (i + 0.5) * run, top = y + (i + 1) * rise
    prism(out, 0, z, top, top + 2.6, 0.18, 5, FOAM, 0, 0.04)
    prism(out, 0, z, top, top + 0.25, 0.5, 8, FOAM, 0, 0.3)
  }
}

/**
 * THE BASINS below the Cascade (aerial, as the Cascade; OSM has them only as fountains' nodes): the round Bassin de la Cascade in its stone crown at the foot of the water-stairs, the long Basse Cascade's canal running east from it, and the round pool it ends in. front 180, x east, z north, the centre at the aerial's (640, 730).
 */
export function cloudBasins(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit)
  const px = (x: number, y: number): [number, number] => [(x - 640) * 0.3, (730 - y) * 0.3]
  const [a, b] = px(485, 690), [c, d] = px(820, 755)
  basin(out, a, b, G(a, b), 12.4)
  flatRing(out, a, b, G(a, b) + 0.06, 13.1, 15.6, 0, Math.PI * 2, 32, hex('#7f7a66'))
  basin(out, c, d, G(c, d), 14.6)
  const Q = [px(562, 680), px(780, 720), px(770, 775), px(545, 735)]
  const y = Math.min(G(Q[0][0], Q[0][1]), G(Q[2][0], Q[2][1])) + 0.2
  out.quad([[Q[0][0], y, Q[0][1]], [Q[1][0], y, Q[1][1]], [Q[2][0], y, Q[2][1]], [Q[3][0], y, Q[3][1]]], [0, 1, 0], UV, WATER, 0)
  for (let i = 0; i < 4; i++) strut(out, [Q[i][0], y + 0.05, Q[i][1]], [Q[(i + 1) % 4][0], y + 0.05, Q[(i + 1) % 4][1]], 0.8, 0.7, STONE, ash)
  // the canal's little jets
  for (let k = 1; k < 8; k++) {
    const t = k / 8, x = Q[3][0] + (Q[2][0] - Q[3][0]) * t + (Q[0][0] - Q[3][0]) * 0.5, z = Q[3][1] + (Q[2][1] - Q[3][1]) * t + (Q[0][1] - Q[3][1]) * 0.5
    prism(out, x, z, y, y + 1.9, 0.09, 5, FOAM, 0, 0.03)
  }
}

/** LE GRAND JET (OSM node 9277494894): the tall jet of Saint-Cloud, 30-odd metres on the days it plays, in its great square pool with chamfered corners. front 180. */
export function cloudGrandJet(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, W = 19
  const R: [number, number][] = [[-W, -W + 3], [-W + 3, -W], [W - 3, -W], [W, -W + 3], [W, W - 3], [W - 3, W], [-W + 3, W], [-W, W - 3]]
  out.quad([[R[0][0], y + 0.2, R[0][1]], [R[3][0], y + 0.2, R[3][1]], [R[4][0], y + 0.2, R[4][1]], [R[7][0], y + 0.2, R[7][1]]], [0, 1, 0], UV, WATER, 0)
  out.quad([[R[1][0], y + 0.2, R[1][1]], [R[2][0], y + 0.2, R[2][1]], [R[3][0], y + 0.2, R[3][1]], [R[0][0], y + 0.2, R[0][1]]], [0, 1, 0], UV, WATER, 0)
  out.quad([[R[7][0], y + 0.2, R[7][1]], [R[4][0], y + 0.2, R[4][1]], [R[5][0], y + 0.2, R[5][1]], [R[6][0], y + 0.2, R[6][1]]], [0, 1, 0], UV, WATER, 0)
  for (let i = 0; i < 8; i++) strut(out, [R[i][0], y + 0.1, R[i][1]], [R[(i + 1) % 8][0], y + 0.1, R[(i + 1) % 8][1]], 0.8, 0.8, STONE, ash)
  prism(out, 0, 0, y + 0.2, y + 0.9, 1.1, 8, FOAM, 0, 0.5)
  prism(out, 0, 0, y + 0.9, y + 16, 0.5, 7, FOAM, 0, 0.32)
  prism(out, 0, 0, y + 16, y + 29, 0.32, 7, FOAM, 0, 0.12)
  dome(out, 0, 0, y + 28.6, 0.5, 1.2, FOAM, 7)
}
