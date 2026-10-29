import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { beam, box, hex, prism, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { boxAlong } from '../../parts.ts'
import { faceBand } from '../../tower.ts'
import { ccw, ellipse, plan, slab, type P2 } from './shapes.ts'

const FIXED = 0

/**
 * The Musée du quai Branly – Jacques-Chirac (Jean Nouvel, 2006), as the quai sees it (fr.wikipedia):
 *
 * - the PONT-MUSÉE: a 200 m gallery in a steel bridge "soutenu à 10 m de hauteur" on two pillars and 26 thin
 *   steel stilts, so Gilles Clément's garden runs on under it; its north face glass printed with foliage, and out
 *   of it the run of coloured BOXES cantilevered over the garden (31 cells, earth reds, ochres, browns); its
 *   south face behind red-brown louvres; the roof restaurant's glass at the east pillar;
 * - the BÂTIMENT BRANLY, five storeys at the west corner, its face to the quai the MUR VÉGÉTAL (Patrick Blanc,
 *   800 m², 15,000 plants); the Auvent and the Université building behind, backing on the Haussmann houses;
 * - the 12 m GLASS PALISADE along the quai that keeps the traffic's noise off the garden.
 *
 * Plans from OSM: the outline way 69045431 and its nine building:parts 1556506842–850 (pont 842, the low curved
 * hall 843, the roof oval 844, Université 845/850, Auvent 847, Branly 848), and the site way 17954721 for the
 * quai's edge, all turned into this frame — local x along the quai (+x to the WSW), −z to the quai and the Seine
 * (bearing 330) — at the outline's 209 × 85 m and stretched to the fit. Placed by point and size.
 */
const REF = { hx: 104.6, hz: 42.6 }

// the bridge: its north (quai) edge from the east end (−x) to the west (+x), then the south edge back
const BRIDGE_N: [number, number][] = [[-104.6, -4.4], [-99.7, -6.4], [-74.7, -14.7], [-57, -18.8], [-40.9, -22], [-28.9, -23.6], [-8.9, -26.3],
  [1, -26.7], [23.2, -26.8], [37.1, -26.6], [44, -26.2]]
const BRIDGE_S: [number, number][] = [[44, 6], [30.7, 7.2], [12.1, 4.5], [-3, 2.3], [-27.7, -1.2], [-36, 0.5], [-42.9, 8.6], [-56.4, 12],
  [-100.1, 23], [-104.1, -1.2]]
// the museum's west end on the ground, and the Auvent's fingers between the Haussmann courts
const WEST: [number, number][] = [[38.9, 2.9], [44.8, -20.3], [45.5, -22.8], [66.6, -20.5], [67.7, -23.7], [78.4, -23.3], [77.9, -21.6],
  [91, -18.7], [98.9, -17], [97.3, -11.4], [80.3, -16.2], [79, -11.4], [96, -6.6], [94.3, -1], [77.5, -5.6], [75.5, 1.4], [92.3, 6.1],
  [91.4, 9.4], [72.9, 4.2], [71.9, 7.8], [87.1, 12.1], [86, 15.6], [68.2, 10.6]]
const BRANLY: [number, number][] = [[72.9, -42.6], [85.3, -39.9], [85.8, -41.8], [104.6, -37.4], [103.2, -32.3], [99.6, -33.3], [98.4, -29],
  [102, -28], [100.1, -21.4], [92.6, -24.1], [91, -18.7], [87.4, -19.4], [89.2, -25.4], [81.9, -28], [82.5, -30], [70.6, -34.1]]
const UNIVERSITE: [number, number][] = [[25.5, 42.6], [25, 34.7], [67.1, 26], [76.1, 24], [83.8, 26.1], [81.9, 32.8], [80.2, 32.3],
  [79.2, 35.9], [80.7, 36], [79.8, 39.1], [77.7, 39.3], [55.3, 40.7], [39.4, 41.7]]
const HALL: [number, number][] = [[61.2, 11.2], [58.6, 16.5], [54.1, 22], [50, 24.4], [45.3, 25.6], [40, 25.6], [35.4, 24.6], [27.9, 20.8],
  [22.1, 16.6], [17, 11.2], [12.1, 4.5], [30.7, 7.2], [48.9, 9.4]]
// the site's edge along the quai, east to the Branly building, where the palisade stands
const QUAI: [number, number][] = [[-134, -58.9], [-122.3, -60.8], [-104.9, -63.3], [-85.8, -65.6], [-72.1, -67.3], [-52.3, -69], [-25.7, -69.9],
  [3.2, -69.5], [18.7, -68.7], [33.2, -67], [46.1, -65.5], [57.5, -64.2], [68, -62.6]]

/** a fixed scatter, so the boxes and stilts are the same every build */
const jitter = (i: number, k: number): number => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** the point `s` metres along a polyline, and its outward normal (to the right of travel) */
function along(line: P2[], s: number): { p: P2; nx: number; nz: number } {
  let left = s
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i]
    const b = line[i + 1]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (left <= L || i === line.length - 2) {
      const t = Math.min(1, left / L)
      const tx = (b.x - a.x) / L
      const tz = (b.z - a.z) / L
      return { p: { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }, nx: tz, nz: -tx }
    }
    left -= L
  }
  return { p: line[0], nx: 0, nz: -1 }
}
/** where a plan's edges cross the line x = const: its nearest and farthest z */
function spanAt(ring: P2[], x: number): [number, number] {
  const zs: number[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    if ((a.x - x) * (b.x - x) <= 0 && a.x !== b.x) zs.push(a.z + ((b.z - a.z) * (x - a.x)) / (b.x - a.x))
  }
  return zs.length ? [Math.min(...zs), Math.max(...zs)] : [0, 0]
}
const length = (line: P2[]): number => line.slice(1).reduce((t, b, i) => t + Math.hypot(b.x - line[i].x, b.z - line[i].z), 0)

export function quaiBranly(out: MeshBuilder, fit: Fit): void {
  const sx = Math.min(Math.max(fit.hx, 85), 125) / REF.hx
  const sz = Math.min(Math.max(fit.hz, 34), 52) / REF.hz
  const P = (pts: [number, number][]): P2[] => plan(pts, sx, sz)
  const body: Rgb = hex('#5a2a1e')            // the bridge's red-brown
  const louvre: Rgb = hex('#7a3a22')
  const printed: Rgb = [0.24, 0.31, 0.27]      // the north glass, printed with leaves
  const glass: Rgb = [0.5, 0.6, 0.64]
  const steel: Rgb = [0.28, 0.28, 0.27]
  const roofC: Rgb = [0.42, 0.44, 0.42]
  const pale: Rgb = hex('#c9c3b6')
  const deck0 = 10
  const deck1 = 24

  // ---- the pont-musée, 10 m up, the garden under it
  const north = P(BRIDGE_N)
  const bridge = [...north, ...P(BRIDGE_S)]
  slab(out, bridge, deck0, deck1, body, roofC)
  // its underside, seen from the garden
  capPolygon(out, ccw(bridge), deck0, shade(body, 0.7), FIXED)
  // the printed glass of the north face, a little proud
  for (let i = 0; i < north.length - 1; i++) {
    const a = north[i]
    const b = north[i + 1]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const nx = (b.z - a.z) / L
    const nz = -(b.x - a.x) / L
    const o = 0.12
    out.quad([[a.x + nx * o, deck0 + 0.6, a.z + nz * o], [b.x + nx * o, deck0 + 0.6, b.z + nz * o], [b.x + nx * o, deck1 - 0.8, b.z + nz * o],
      [a.x + nx * o, deck1 - 0.8, a.z + nz * o]], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], printed, surfaceTag('glass'))
  }
  // the louvres of the south face, red-brown blades at a metre and a half
  const south = P(BRIDGE_S).slice(0, -1)
  const sLen = length(south)
  for (let s = 0.8; s < sLen; s += 1.5) {
    const { p, nx, nz } = along(south, s)
    boxAlong(out, p.x + nx * 0.45, (deck0 + deck1) / 2, p.z + nz * 0.45, 0.08, (deck1 - deck0) / 2 - 0.3, 0.4, Math.atan2(nx, nz), louvre, FIXED)
  }
  // the boxes, cantilevered out of the north face over the garden
  const boxes: Rgb[] = [hex('#9a3b1c'), hex('#c8691f'), hex('#d1a03a'), hex('#5b3a24'), hex('#7d1f18'), hex('#e0b54a'), hex('#5e6b34'),
    hex('#3b3330'), hex('#b4502a'), hex('#8c6a3a')]
  const nLen = length(north)
  let s = 4
  for (let i = 0; s < nLen - 6; i++) {
    const w = 3.5 + jitter(i, 1) * 5
    const h = 4.5 + jitter(i, 2) * 5
    const d = 2 + jitter(i, 3) * 3.2
    const y0 = deck0 + 0.6 + jitter(i, 4) * (deck1 - deck0 - h - 1.6)
    const { p, nx, nz } = along(north, s + w / 2)
    boxAlong(out, p.x + nx * (d / 2), y0 + h / 2, p.z + nz * (d / 2), w / 2, h / 2, d / 2, Math.atan2(nx, nz), boxes[i % boxes.length], FIXED)
    // its window, dark, on the face to the garden
    boxAlong(out, p.x + nx * (d + 0.03), y0 + h * 0.55, p.z + nz * (d + 0.03), w * 0.3, h * 0.25, 0.03, Math.atan2(nx, nz), [0.15, 0.17, 0.18], FIXED)
    s += w + 0.6 + jitter(i, 5) * 1.6
  }
  // the roof restaurant's oval of glass at the east end, over the east pillar
  const oval = ellipse(-74.8 * sx, 1.7 * sz, 20 * sx, 12 * sz, 18)
  slab(out, oval, deck1, deck1 + 4.5, glass, roofC)
  // the east pillar: a drum from the garden to the deck, the stair and lift to the roof
  prism(out, -86 * sx, 4 * sz, 0, deck0, 5.5, 14, shade(body, 0.85), FIXED)
  // the stilts, 26 of them, thin and leaning every way
  for (let i = 0; i < 26; i++) {
    const t = (i % 13 + 0.5) / 13
    const x = (-96 + t * 136) * sx
    const [z0, z1] = spanAt(bridge, x)
    const z = z0 + (z1 - z0) * (i < 13 ? 0.25 : 0.72) + (jitter(i, 6) - 0.5) * 3
    const lx = (jitter(i, 7) - 0.5) * 3
    const lz = (jitter(i, 8) - 0.5) * 3
    beam(out, [x + lx, 0, z + lz], [x - lx * 0.3, deck0, z - lz * 0.3], 0.22, steel)
  }
  // the entrance hall under the bridge's west end, a glass box in the garden
  slab(out, P([[10, -18], [40, -20], [42, 3], [12, 2]]), 0, 6, glass, shade(glass, 0.8))
  // the low curved hall on the south side
  slab(out, P(HALL), 0, 12, shade(body, 0.9), roofC)

  // ---- the west end of the museum on the ground, and the Auvent's fingers behind it
  const west = P(WEST)
  slab(out, west, 0, deck1, body, roofC)
  faceBand(out, west, 0, deck0, { kind: 'curtain', wall: shade(body, 0.8), glass: [0.3, 0.36, 0.38], pitch: 2 })
  // the Auvent's glass canopy, sloping over the fingers
  out.quad([[68 * sx, 25.5, -24 * sz], [99 * sx, 22.5, -17 * sz], [92 * sx, 22.5, 10 * sz], [68 * sx, 25.5, 12 * sz]], [0.1, 1, 0],
    [[0, 0], [1, 0], [1, 1], [0, 1]], glass, surfaceTag('glass'))

  // ---- the Bâtiment Branly and its planted wall to the quai
  const branly = P(BRANLY)
  slab(out, branly, 0, 26, pale, roofC)
  faceBand(out, branly, 0, 26, { kind: 'punched', wall: pale, glass: [0.3, 0.34, 0.36], floor: 4.2, pitch: 2.6, material: 'concrete' })
  const greens: Rgb[] = [[0.22, 0.38, 0.18], [0.3, 0.46, 0.2], [0.18, 0.3, 0.16], [0.36, 0.5, 0.24], [0.26, 0.42, 0.26]]
  const wall = [branly[branly.length - 1], branly[0], branly[1], branly[2], branly[3]]
  for (let i = 0; i < wall.length - 1; i++) {
    const a = wall[i]
    const b = wall[i + 1]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    const nx = tz
    const nz = -tx
    const cols = Math.max(1, Math.round(L / 3))
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < 8; r++) {
        const u0 = (c / cols) * L
        const u1 = ((c + 1) / cols) * L
        const y0 = 0.6 + r * 3.15
        const y1 = y0 + 3.15
        const o = 0.35 + jitter(c + i * 31, r) * 0.25
        const q = (u: number, y: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
        out.quad([q(u0, y0), q(u1, y0), q(u1, y1), q(u0, y1)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]],
          greens[Math.floor(jitter(c + i * 17, r + 3) * greens.length)], surfaceTag('foliage'))
      }
    }
  }

  // ---- the Université building, on the street behind
  const univ = P(UNIVERSITE)
  slab(out, univ, 0, 22, hex('#8a4a32'), roofC)
  faceBand(out, univ, 0, 22, { kind: 'bands', wall: hex('#8a4a32'), glass: [0.3, 0.35, 0.37], floor: 3.7, solid: 0.45, material: 'panel' })

  // ---- the garden's trees inside the model's rectangle: placing it clears the city's own trees there
  // (render/landmarks.ts `onFootprint`), and Clément's garden runs right up to the bridge on both sides
  const kinds = ['tree:oak', 'tree:beech', 'tree:maple', 'tree:elm']
  let k = 0
  for (let x = -92; x <= 40; x += 11) {
    const [zn] = spanAt(bridge, x * sx)
    for (const d of [7, 14]) {
      const z = Math.max(-REF.hz * sz + 1, zn - d - jitter(k, 9) * 3)
      out.plants.push({ x: x * sx + (jitter(k, 10) - 0.5) * 4, z, species: kinds[k % kinds.length], h: 9 + jitter(k, 11) * 4, spin: jitter(k, 12) * 6.28 })
      k++
    }
  }
  for (let x = -88; x <= 4; x += 13) {
    const [, zs] = spanAt(bridge, x * sx)
    const z = Math.min(REF.hz * sz - 6, zs + 7 + jitter(k, 9) * 8)
    out.plants.push({ x: x * sx, z, species: kinds[k % kinds.length], h: 10 + jitter(k, 11) * 5, spin: jitter(k, 12) * 6.28 })
    k++
  }

  // ---- the glass palisade along the quai, 12 m high. Drawn as what shows of it — its posts, its rails and the
  // fritted band along the top — because an opaque sheet in its place hid the garden and the stilts it exists to show
  const quai = P(QUAI).map((p) => ({ x: p.x, z: p.z + 1.5 }))
  const frit: Rgb = [0.66, 0.74, 0.76]
  for (let i = 0; i < quai.length - 1; i++) {
    const a = quai[i]
    const b = quai[i + 1]
    beam(out, [a.x, 11.6, a.z], [b.x, 11.6, b.z], 0.4, frit)
    beam(out, [a.x, 12.05, a.z], [b.x, 12.05, b.z], 0.08, steel)
    beam(out, [a.x, 0.3, a.z], [b.x, 0.3, b.z], 0.12, steel)
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    for (let t = 0; t < L; t += 4) {
      const x = a.x + ((b.x - a.x) * t) / L
      const z = a.z + ((b.z - a.z) * t) / L
      box(out, x, 6, z, 0.07, 6, 0.07, steel, FIXED)
    }
  }
}
