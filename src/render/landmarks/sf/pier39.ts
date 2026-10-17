/**
 * PIER 39 (1978): the shopping pier's buildings — A to Q, Fog Harbor, the kiosks — built of timber salvaged from old
 * piers and left to weather: dark brown boards, a ground floor of shopfronts in heavy frames, an upper storey of small
 * windows and balconies, low hipped roofs of grey shingle. The bake drew them as a jumble of Victorians, brick lofts
 * and stucco flats (waterfront sweep, 2026-10-03). Mapillary 137588811859150.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing } from '../tower.ts'
import { edgeAt, railing } from '../parts.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign } from '../signage.ts'

const hash = (a: number, b: number): number => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h) }
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
/** the pier's shops and cafés as OSM names them (2026-10-17): a shopfront's board takes one, by where it is */
const SHOPS = ['Alcatraz Gift Shop', 'Alpaca Fashion', 'Biscoff Coffee Corner', 'Bubba Gump Shrimp Co.', 'Build-A-Bear Workshop', 'Candy Baron',
  'Carmel Honey Company', 'Charms By The Bay', 'Chowders', 'Christmas In San Francisco', 'Crepe Cafe', 'Eagle Cafe', 'Fog Harbor Fish House',
  'Fun Food Factory', 'Gelato', 'Hot Licks', 'Houdini’s Magic Shop', 'Krazy Kaps', 'Lappert’s Ice Cream', 'Lefty’s', 'Lids', 'Lorenzo’s Pizzeria',
  'Magnetron', 'Mrs. Fields', 'Na Hoku', 'Old Tyme Treats', 'Only in San Francisco', 'Pearl Factory', 'Pier Market', 'Rock Shop',
  'SF City Wear', 'San Francisco Sock Market', 'Scentchips', 'Shirtique', 'Solve-It', 'Swiss Louis', 'Taco Cantina', 'The Cable Car Store',
  'The Dog House', 'The Hook', 'The Shell Cellar', 'The Spice & Tea Exchange', 'Trish’s Mini Donuts', 'Under The Golden Gate', 'We Be Knives',
  'Wilder West', 'Wipeout Bar & Grill', 'Player’s Sports Grill & Arcade']

/*
 * The timber, weathered as it is (owner, 2026-10-17: "the pier 39 amusement park stuff needs a lot more work"; Commons
 * "Pier 39 (San Francisco) July 2022 (2)", "Pier 39 - San Francisco, CA - DSC03487"): silvered grey-brown boards on most,
 * a few painted pale butter-yellow or white with white trim. Chosen per building by its own outline, so it is stable.
 */
const SIDINGS: { wall: Rgb; upper: Rgb; trim: Rgb }[] = [
  { wall: [0.46, 0.41, 0.34], upper: [0.56, 0.51, 0.43], trim: [0.86, 0.84, 0.78] },
  { wall: [0.40, 0.36, 0.31], upper: [0.50, 0.46, 0.40], trim: [0.82, 0.80, 0.74] },
  { wall: [0.52, 0.47, 0.39], upper: [0.62, 0.57, 0.48], trim: [0.90, 0.88, 0.82] },
  { wall: [0.80, 0.74, 0.55], upper: [0.86, 0.80, 0.60], trim: [0.96, 0.95, 0.90] },
]
/** awning canvases: solid and the stripe's second colour */
const AWNINGS: [Rgb, Rgb][] = [
  [[0.16, 0.34, 0.62], [0.95, 0.95, 0.93]], [[0.74, 0.14, 0.14], [0.95, 0.95, 0.93]], [[0.12, 0.42, 0.30], [0.93, 0.88, 0.70]],
  [[0.88, 0.62, 0.14], [0.36, 0.20, 0.10]], [[0.16, 0.50, 0.66], [0.95, 0.95, 0.93]],
]

/**
 * PIER 39's shops: two storeys of weathered timber over a ground floor of glazed shopfronts; a deep, overhanging roof of
 * grey shingle with dormers; on the long sides an upper GALLERY — a plank deck on posts with a wooden railing, the walk
 * the second-floor shops open onto; and over the shopfronts a run of bright scalloped awnings. One storey for the kiosks.
 */
export function pier39Shop(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const seed = hash(fit.hx, fit.hz)
  const sd = SIDINGS[Math.floor(seed * SIDINGS.length) % SIDINGS.length]
  const two = (fit.height || 9) >= 7 && Math.min(fit.hx, fit.hz) > 3
  const G = 4.2, U = two ? 3.4 : 0, H = G + U
  const WT = surfaceTag('clapboard')
  tower(out, { ...fit, height: H }, {
    height: H,
    base: two ? { height: G, face: { kind: 'curtain', wall: sd.trim, glass: [0.66, 0.58, 0.44], pitch: 3.0, floor: G, material: 'glass' } } : undefined,
    tiers: [{ to: 1, face: two
      ? { kind: 'punched', wall: sd.upper, glass: [0.22, 0.24, 0.25], pitch: 2.4, floor: U, solid: 0.62, material: 'clapboard' }
      : { kind: 'curtain', wall: sd.trim, glass: [0.66, 0.58, 0.44], pitch: 3.0, floor: H, material: 'glass' } }],
    crown: { kind: 'hip', height: two ? 2.4 : 1.6, inset: -0.7, colour: [0.42, 0.39, 0.35], material: 'tile', dormers: two ? 2 : 0 },
  })
  // the timber between the shopfronts: a sill board and a fascia band round the whole ground floor
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 1) continue
    const ux = e.tx, uz = e.tz, nx = e.nx, nz = e.nz
    const at = (u: number, y: number, o: number): [number, number, number] => [e.a.x + ux * u + nx * o, y, e.a.z + uz * u + nz * o]
    for (const [y0, y1, c] of [[0, 0.5, sd.wall], [G - 0.55, G, sd.wall]] as [number, number, Rgb][]) {
      out.quad([at(0, y0, 0.06), at(e.L, y0, 0.06), at(e.L, y1, 0.06), at(0, y1, 0.06)], [nx, 0, nz], UVQ, c, WT)
    }
    // AWNINGS over the shopfronts, a bay at a time, on every wall long enough for a shop
    if (e.L >= 4) {
      const [solid, second] = AWNINGS[Math.floor(hash(e.mid.x, e.mid.z) * AWNINGS.length)]
      const striped = hash(e.mid.z, e.mid.x) > 0.45
      const n = Math.max(1, Math.round(e.L / 3.2)), bw = e.L / n
      for (let k = 0; k < n; k++) {
        if (hash(e.mid.x + k, e.mid.z - k) < 0.25) continue
        const u0 = k * bw + 0.2, u1 = (k + 1) * bw - 0.2
        const top = G - 1.15, low = G - 1.85, outw = 1.2
        const stripes = striped ? 6 : 1
        for (let s2 = 0; s2 < stripes; s2++) {
          const a0 = u0 + ((u1 - u0) * s2) / stripes, a1 = u0 + ((u1 - u0) * (s2 + 1)) / stripes
          const c = striped && s2 % 2 ? second : solid
          out.quad([at(a0, top, 0.05), at(a1, top, 0.05), at(a1, low, outw), at(a0, low, outw)], [nx * 0.6, 0.8, nz * 0.6], UVQ, c, WT)
          // the scalloped valance
          out.quad([at(a0, low, outw), at(a1, low, outw), at(a1, low - 0.28, outw), at(a0, low - 0.28, outw)], [nx, 0, nz], UVQ, c, WT)
        }
        // its two side cheeks
        for (const u of [u0, u1]) out.quad([at(u, top, 0.05), at(u, low, outw), at(u, low - 0.28, outw), at(u, low - 0.28, 0.05)], [ux, 0, uz], UVQ, solid, WT)
        // the shop's name on the fascia over its awning: a board in the awning's colour, cream letters
        if (k % 2 === 0) {
          const name = SHOPS[Math.floor(hash(e.mid.x * 3 + k, e.mid.z * 3 - k) * SHOPS.length)]
          const c = at((u0 + u1) / 2 + (k + 1 < n ? bw / 2 : 0), G - 0.68, 0.1)
          sign(out, { type: 'flat', text: name, h: 0.34, w: Math.min(bw * (k + 1 < n ? 1.8 : 0.9), name.length * 0.27), face: 'slab', weight: 'bold',
            colour: [0.97, 0.95, 0.88], panel: solid, lit: 'front' }, { x: c[0], y: c[1], z: c[2], heading: e.heading })
        }
      }
    }
  }
  // the GALLERY on the long sides of a two-storey building: plank deck, posts to the boardwalk, wooden railing
  if (!two) return
  const order = ring.map((_, i) => i).filter((i) => edgeAt(ring, i).L >= 10).sort((p, q) => edgeAt(ring, q).L - edgeAt(ring, p).L).slice(0, 2)
  for (const i of order) {
    const e = edgeAt(ring, i)
    const D = 1.7
    const nx = e.nx, nz = e.nz, ux = e.tx, uz = e.tz
    const P = (u: number, o: number): { x: number; z: number } => ({ x: e.a.x + ux * u + nx * o, z: e.a.z + uz * u + nz * o })
    const q = (u: number, o: number, y: number): [number, number, number] => { const p = P(u, o); return [p.x, y, p.z] }
    out.quad([q(0.3, 0, G), q(e.L - 0.3, 0, G), q(e.L - 0.3, D, G), q(0.3, D, G)], [0, 1, 0], UVQ, [0.48, 0.42, 0.34], WT)
    out.quad([q(0.3, D, G - 0.25), q(e.L - 0.3, D, G - 0.25), q(e.L - 0.3, D, G), q(0.3, D, G)], [nx, 0, nz], UVQ, sd.wall, WT)
    out.quad([q(0.3, 0, G - 0.25), q(e.L - 0.3, 0, G - 0.25), q(e.L - 0.3, D, G - 0.25), q(0.3, D, G - 0.25)], [0, -1, 0], UVQ, [0.3, 0.27, 0.23], WT)
    railing(out, [P(0.3, D - 0.08), P(e.L - 0.3, D - 0.08)], G, { kind: 'posts', colour: [0.4, 0.34, 0.27], material: 'clapboard' })
    const posts = Math.max(2, Math.round(e.L / 3.5))
    for (let k = 0; k <= posts; k++) {
      const p = P(0.4 + ((e.L - 0.8) * k) / posts, D - 0.15)
      box(out, p.x, (G - 0.25) / 2, p.z, 0.11, (G - 0.25) / 2, 0.11, [0.38, 0.33, 0.27], WT)
    }
  }
}

/**
 * MAGOWAN'S INFINITE MIRROR MAZE's sign on Building O (OSM node 2365845678; Commons "Magowan's Infinite Mirror Maze sign"):
 * a collage of tilted colour panels — yellow, green, sky blue, navy, raspberry — behind a white bow-tie banner, MIRROR in
 * fat rainbow capitals on it, MAZE in white below, MAGOWAN'S INFINITE small across the top. Placed on the wall facing the
 * pier's main street, rotateDeg 0; the board faces bearing 245°.
 */
export function mirrorMazeSign(out: MeshBuilder, _fit: Fit): void {
  const H = (-115 * Math.PI) / 180
  const n: [number, number, number] = [Math.sin(H), 0, Math.cos(H)], u: [number, number, number] = [Math.cos(H), 0, -Math.sin(H)]
  const CT = surfaceTag('concrete')
  // (above the gallery's rail, a little proud of the wall; +u runs to the reader's LEFT, so the letters step along −u)
  const P = (a: number, b: number, d: number): [number, number, number] => [-u[0] * a + n[0] * (d + 0.25), 6.15 + b, -u[2] * a + n[2] * (d + 0.25)]
  const panel = (pts: [number, number][], d: number, c: Rgb): void => {
    const q = pts.map(([a, b]) => P(a, b, d))
    out.quad([q[0], q[1], q[2], q[3]], n, UVQ, c, CT)
    out.quad([q[1], q[0], q[3], q[2]], [-n[0], 0, -n[2]], UVQ, [0.3, 0.3, 0.32], CT)
  }
  panel([[-2.0, -1.3], [1.4, -1.6], [1.6, 1.2], [-1.8, 1.0]], 0.05, [0.86, 0.72, 0.12])     // yellow
  panel([[-0.6, 0.6], [1.5, 0.6], [1.6, 1.55], [0.4, 1.3]], 0.08, [0.45, 0.72, 0.22])      // green
  panel([[-1.9, -1.6], [-0.2, -1.6], [-0.4, -0.6], [-1.8, -0.7]], 0.08, [0.3, 0.6, 0.86])  // sky
  panel([[-1.6, -1.3], [0.4, -1.3], [0.2, 1.0], [-1.6, 0.95]], 0.11, [0.74, 0.16, 0.36])   // raspberry
  panel([[0.0, -1.35], [1.3, -1.25], [1.2, 1.0], [0.0, 0.95]], 0.12, [0.12, 0.16, 0.36])   // navy
  // the bow-tie banner, white, across the middle
  panel([[-2.3, -0.35], [2.3, -0.5], [2.4, 0.55], [-2.4, 0.4]], 0.16, [0.97, 0.97, 0.95])
  const at = (b: number, d: number): [number, number, number] => P(0, b, d)
  const word = (text: string, h: number, b: number, c: Rgb, face: 'grotesque' | 'slab'): void => {
    const p = at(b, 0.2)
    sign(out, { type: 'flat', text, h, face, weight: 'bold', colour: c, lit: 'front' }, { x: p[0], y: p[1], z: p[2], heading: H })
  }
  word("MAGOWAN'S INFINITE", 0.22, 0.75, [0.97, 0.97, 0.95], 'grotesque')
  // MIRROR in rainbow: one letter at a time across the banner
  const cols: Rgb[] = [[0.86, 0.22, 0.14], [0.92, 0.48, 0.12], [0.86, 0.66, 0.1], [0.48, 0.68, 0.18], [0.16, 0.56, 0.3], [0.1, 0.46, 0.3]]
  'MIRROR'.split('').forEach((ch, i) => {
    const p = P(-1.75 + i * 0.7, 0.03, 0.21)
    sign(out, { type: 'flat', text: ch, h: 0.62, face: 'grotesque', weight: 'bold', colour: cols[i], lit: 'front' }, { x: p[0], y: p[1], z: p[2], heading: H })
  })
  word('MAZE', 0.52, -0.95, [0.97, 0.97, 0.95], 'grotesque')
}

/**
 * The TIMBER BRIDGE across Pier 39's main street at the upper floor (OSM way/1232081304, layer 1, surface wood; Commons
 * "Pier 39 (San Francisco) July 2022"): a plank deck between the two galleries on heavy timber beams, railings of posts and
 * X-braces, and hung on both faces the pier's round blue "39" signs. Local x along the span (east), rotateDeg follows it.
 */
export function pier39StreetBridge(out: MeshBuilder, _fit: Fit): void {
  const L = 8.6, W = 1.4, Y = 4.2
  const T: Rgb = [0.42, 0.34, 0.26], DT: Rgb = [0.3, 0.24, 0.18], BLUE: Rgb = [0.16, 0.36, 0.7]
  const WT = surfaceTag('clapboard')
  box(out, 0, Y - 0.06, 0, L, 0.06, W, [0.5, 0.42, 0.33], WT)                  // the planks
  for (const z of [-W + 0.1, W - 0.1]) box(out, 0, Y - 0.4, z, L, 0.3, 0.12, DT, WT)   // the beams
  for (const sd of [-1, 1]) {
    const z = sd * (W - 0.05)
    box(out, 0, Y + 1.05, z, L, 0.06, 0.07, T, WT)                                // the top rail
    for (let x = -L; x <= L + 0.01; x += 2.15) box(out, x, Y + 0.52, z, 0.09, 0.52, 0.09, T, WT)
    for (let x = -L; x < L - 0.01; x += 2.15) {
      // the X between each pair of posts
      out.quad([[x, Y, z], [x + 0.12, Y, z], [x + 2.15, Y + 1.0, z], [x + 2.03, Y + 1.0, z]], [0, 0, sd], UVQ, T, WT)
      out.quad([[x + 2.03, Y, z], [x + 2.15, Y, z], [x + 0.12, Y + 1.0, z], [x, Y + 1.0, z]], [0, 0, sd], UVQ, T, WT)
    }
    // the round "39" sign, hung at the middle of each face under the deck
    const zz = sd * (W + 0.2)
    for (let k = 0; k < 16; k += 2) {
      const a0 = (k / 16) * Math.PI * 2, a1 = ((k + 1) / 16) * Math.PI * 2, a2 = ((k + 2) / 16) * Math.PI * 2
      out.quad([[0, Y - 0.95, zz], [Math.cos(a0) * 0.55, Y - 0.95 + Math.sin(a0) * 0.55, zz], [Math.cos(a1) * 0.55, Y - 0.95 + Math.sin(a1) * 0.55, zz], [Math.cos(a2) * 0.55, Y - 0.95 + Math.sin(a2) * 0.55, zz]], [0, 0, sd], UVQ, BLUE, WT)
    }
    sign(out, { type: 'flat', text: '39', h: 0.45, face: 'grotesque', weight: 'bold', colour: [0.97, 0.97, 0.95], lit: 'front' },
      { x: 0, y: Y - 0.95, z: zz + sd * 0.02, heading: sd > 0 ? 0 : Math.PI })
  }
}

/** FISH ALLEY's working sheds behind Jefferson Street (Pier 45 and the inner lagoon): one-storey corrugated metal,
 *  grey-green or rust, a roller door and a low roof — where the bake drew three-metre Victorians. */
export function fishAlleyShed(out: MeshBuilder, fit: Fit): void {
  const H = Math.max(3.5, Math.min(fit.height || 4, 6))
  const rust = (Math.round(fit.hx * 7 + fit.hz * 13) % 3) === 0
  const wall: [number, number, number] = rust ? [0.5, 0.32, 0.24] : [0.46, 0.5, 0.46]
  tower(out, { ...fit, height: H }, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'fins', wall, glass: [0.3, 0.32, 0.32], pitch: 4.5, solid: 0.45, depth: 0.08, floor: H, material: 'metal' } }],
    crown: { kind: 'hip', height: 1.0, inset: -0.4, colour: [0.52, 0.52, 0.5], material: 'metal' },
  })
}

export const PIER_39: Record<string, (out: MeshBuilder, fit: Fit) => void> = { pier39Shop, fishAlleyShed, mirrorMazeSign, pier39StreetBridge }
