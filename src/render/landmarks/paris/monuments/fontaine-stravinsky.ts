import { MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { beam, hex, shade } from '../../kit.ts'
import { offsetRing } from '../../parts.ts'
import { ccw, FIXED, ring, UV, walls } from './common.ts'

/*
 * THE FONTAINE STRAVINSKY (Jean Tinguely and Niki de Saint Phalle, 1983), on the place between the Centre Pompidou, the
 * IRCAM and Saint-Merri: a long shallow basin in a stepped kerb of bright steel, and in the water sixteen works after the
 * Rite of Spring and the Firebird that a rider takes in at a glance as two families — Tinguely's BLACK machines, wheels,
 * spirals and the great treble clef, and Saint Phalle's COLOURED creatures in striped polyester, chief among them the tall
 * Firebird with its crown and the great RED LIPS on their stalk — all of them spitting thin arcs of water at one another.
 *
 * OSM has the basin (way 88301107, `natural=water`, height 0.75): the ring below is it. The water is drawn here at its real
 * level, near the top of the kerb, over the city's own at the ground. The places of the works and most of their shapes are
 * from two Commons photographs and memory, not a survey: the lips, the firebird, the spiral and the clef where the
 * photographs put them, the rest to fill the basin as it is filled. They stand still; the machines turn in life.
 * Frame: −z toward bearing 208, so +z runs up the basin toward the IRCAM (osmium, 2026-10-30).
 */
const BLACK: Rgb = hex('#17171a')
const RED: Rgb = hex('#d81c27')
const BLUE: Rgb = hex('#1c6fcb')
const YEL: Rgb = hex('#f7cb1d')
const GRN: Rgb = hex('#27a24f')
const MAG: Rgb = hex('#d93484')
const ORG: Rgb = hex('#ef7c20')
const WHT: Rgb = hex('#f3efe6')
const STEEL: Rgb = hex('#9aa2a6')
const SPRAY: Rgb = hex('#e4eff3')
const WATER: Rgb = hex('#4a6e60')

/** The basin, OSM's ring round its rounded corners, simplified. */
const BASIN = ring([9.0, 16.7, 9.1, -16.5, 8.6, -17.5, 7.4, -18.1, -7.6, -18.1, -8.4, -17.7, -9.1, -16.4, -9.1, 16.9, -8.4, 17.9, -7.3, 18.1, 7.7, 18.0, 8.8, 17.4])
/** The water's level over the model's base (the loader sinks every model half a metre: the kerb's top is at 1.25). */
const W = 1.05

/** A ball drawn out to (rx, ry, rz), its courses cycling through `cs`: Saint Phalle's stripes. */
function blob(out: MeshBuilder, x: number, y: number, z: number, rx: number, ry: number, rz: number, cs: Rgb[], sides = 10, rows = 7): void {
  for (let k = 0; k < rows; k++) {
    const p0 = -Math.PI / 2 + (k / rows) * Math.PI
    const p1 = -Math.PI / 2 + ((k + 1) / rows) * Math.PI
    const c = cs[k % cs.length]
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2
      const a1 = ((i + 1) / sides) * Math.PI * 2
      const am = (a0 + a1) / 2
      const pm = (p0 + p1) / 2
      const P = (a: number, p: number): [number, number, number] => [x + Math.sin(a) * Math.cos(p) * rx, y + Math.sin(p) * ry, z + Math.cos(a) * Math.cos(p) * rz]
      out.quad([P(a0, p0), P(a1, p0), P(a1, p1), P(a0, p1)], [Math.sin(am) * Math.cos(pm) / rx, Math.sin(pm) / ry, Math.cos(am) * Math.cos(pm) / rz], UV, c, FIXED)
    }
  }
}

/** A tube down a list of points, each length a bar, its colours cycling. `rv` makes it a ribbon on edge. */
function tube(out: MeshBuilder, pts: [number, number, number][], r: number, cs: Rgb[], rv = r): void {
  for (let i = 0; i + 1 < pts.length; i++) beam(out, pts[i], pts[i + 1], r, cs[i % cs.length], rv)
}

/** A drawn figure in the (x, y) plane at (x, z), scaled, on a post from the water: the clef, a spiral. */
function curve(x: number, y: number, z: number, s: number, uv: [number, number][], turn = 0): [number, number, number][] {
  const c = Math.cos(turn)
  const si = Math.sin(turn)
  return uv.map(([u, v]) => [x + u * s * c, y + v * s, z + u * s * si])
}

/** A Tinguely wheel on edge: a rim, spokes and a hub, black, turned `turn` about the vertical. */
function wheel(out: MeshBuilder, x: number, y: number, z: number, r: number, turn = 0, spokes = 5): void {
  const n = 12
  const rim: [number, number][] = []
  for (let i = 0; i <= n; i++) rim.push([Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r])
  tube(out, curve(x, y, z, 1, rim, turn), 0.07, [BLACK], 0.09)
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2
    tube(out, curve(x, y, z, 1, [[0, 0], [Math.cos(a) * r, Math.sin(a) * r]], turn), 0.045, [BLACK])
  }
}

/** The post a work stands on, from the water, with the darker ring of disturbed water round its foot. */
function foot(out: MeshBuilder, x: number, z: number, y1: number, r = 0.14): void {
  prism(out, x, z, W, W + 0.03, 0.8, 10, shade(WATER, 1.14), FIXED, 0.8, true)
  prism(out, x, z, W, y1, r, 6, BLACK, FIXED, r * 0.85, false)
}

/** A thin arc of water from (x, y, z) out by (dx, dz), rising h over the start and falling to the basin. */
function jet(out: MeshBuilder, x: number, y: number, z: number, dx: number, dz: number, h: number): void {
  const n = 7
  const pts: [number, number, number][] = []
  const fall = y + h - W
  for (let i = 0; i <= n; i++) {
    const t = i / n
    // up to the top at t = 0.4, down to the water at t = 1
    const v = t < 0.4 ? y + h * (1 - ((0.4 - t) / 0.4) ** 2) : y + h - fall * ((t - 0.4) / 0.6) ** 2
    pts.push([x + dx * t, v, z + dz * t])
  }
  tube(out, pts, 0.035, [SPRAY])
}

/** The great red LIPS (L'Amour) on their black stalk and a whirl of black wire behind them. */
function lips(out: MeshBuilder, x: number, z: number): void {
  foot(out, x, z, 2.5, 0.12)
  const y = 2.85
  blob(out, x - 0.58, y + 0.27, z, 0.95, 0.38, 0.34, [RED], 12, 7)
  blob(out, x + 0.58, y + 0.27, z, 0.95, 0.38, 0.34, [RED], 12, 7)
  blob(out, x, y - 0.24, z, 1.4, 0.44, 0.38, [RED], 12, 7)
  blob(out, x, y + 0.02, z - 0.34, 1.2, 0.05, 0.05, [hex('#6c0c13')], 8, 3)
  tube(out, curve(x + 1.3, 1.3, z + 0.1, 1, spiral(0.8, 1.6, 12)), 0.05, [BLACK], 0.12)
}

const spiral = (r: number, turns: number, n: number): [number, number][] => {
  const o: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = t * turns * Math.PI * 2
    o.push([Math.cos(a) * r * (0.12 + 0.88 * t), Math.sin(a) * r * (0.12 + 0.88 * t)])
  }
  return o
}

/** The FIREBIRD, the tall one in the middle of the basin: a striped body on a black pivot, wings, a tail of tubes, the yellow crown. */
function firebird(out: MeshBuilder, x: number, z: number): void {
  foot(out, x, z, 2.5, 0.24)
  wheel(out, x + 0.2, 1.75, z - 0.2, 0.7, 0.4, 4)
  blob(out, x, 3.5, z, 1.05, 1.45, 0.85, [BLUE, YEL, RED, GRN, MAG, YEL, BLUE], 12, 7)
  blob(out, x - 1.5, 4.0, z + 0.05, 1.15, 0.7, 0.2, [GRN, RED, WHT, BLUE], 10, 5)
  blob(out, x + 1.45, 3.75, z + 0.05, 1.05, 0.62, 0.2, [YEL, BLUE, RED, GRN], 10, 5)
  // the long neck, the head, the beak, the crown
  tube(out, [[x, 4.7, z], [x + 0.18, 5.3, z], [x + 0.12, 5.9, z], [x - 0.05, 6.35, z]], 0.26, [YEL, RED, BLUE])
  blob(out, x - 0.08, 6.6, z, 0.42, 0.4, 0.38, [WHT, WHT, MAG])
  beam(out, [x - 0.08, 6.6, z - 0.3], [x - 0.15, 6.5, z - 0.95], 0.08, ORG)
  for (let i = 0; i < 5; i++) {
    const u = (i - 2) * 0.24
    const tip: [number, number, number] = [x - 0.08 + u * 1.6, 7.6 - Math.abs(i - 2) * 0.1, z]
    beam(out, [x - 0.08 + u * 0.7, 6.95, z], tip, 0.055, YEL)
    blob(out, tip[0], tip[1], tip[2], 0.12, 0.12, 0.12, [i % 2 ? RED : YEL], 6, 4)
  }
  // the tail, an arc of tubes behind it
  tube(out, curve(x, 2.2, z + 0.75, 1, [[0, 0], [0.9, -0.05], [1.8, 0.25], [2.4, 0.9], [2.55, 1.7]]), 0.13, [MAG, YEL, GRN, RED])
  tube(out, curve(x, 2.3, z + 0.8, 1, [[0, 0], [-0.9, -0.1], [-1.9, 0.15], [-2.5, 0.8], [-2.7, 1.5]]), 0.13, [BLUE, RED, YEL, GRN])
}

/** LA CLEF DE SOL: a black treble clef, 4.6 m on a post, on edge to the long sides of the basin. */
function clef(out: MeshBuilder, x: number, z: number): void {
  foot(out, x, z, 1.7, 0.1)
  const uv: [number, number][] = [[-0.3, 0.45], [-0.45, 0.25], [-0.3, 0.05], [0, 0], [0.2, 0.25], [0.15, 1], [0.05, 2], [0, 3], [0.1, 3.8], [0.3, 4.4], [0.3, 4.9],
    [0.05, 4.7], [-0.15, 4], [-0.15, 3.3], [-0.6, 2.6], [-0.85, 1.9], [-0.7, 1.35], [-0.2, 1.05], [0.35, 1.15], [0.6, 1.6], [0.45, 2.05], [0, 2.2], [-0.35, 1.95], [-0.3, 1.6]]
  tube(out, curve(x, 1.25, z, 0.95, uv, 0.5), 0.05, [BLACK], 0.1)
}

/** LA SPIRALE: a coil of black band on a wheel, 3 m across, low in the water. */
function spirale(out: MeshBuilder, x: number, z: number): void {
  foot(out, x, z, 1.5, 0.15)
  tube(out, curve(x, 2.4, z, 1, spiral(1.45, 2.6, 30), -0.35), 0.06, [BLACK], 0.11)
  beam(out, [x - 1.0, W, z + 0.5], [x + 1.4, 2.0, z - 0.3], 0.06, BLACK)
}

/** LE CŒUR: a red heart on a black arm. */
function coeur(out: MeshBuilder, x: number, z: number): void {
  foot(out, x, z, 2.2)
  blob(out, x - 0.42, 3.25, z, 0.55, 0.52, 0.3, [RED])
  blob(out, x + 0.42, 3.25, z, 0.55, 0.52, 0.3, [RED])
  prism(out, x, z, 2.05, 3.05, 0.03, 8, RED, FIXED, 0.82, false)
}

/** L'ÉLÉPHANT: Saint Phalle's, blue and yellow, its trunk spouting. */
function elephant(out: MeshBuilder, x: number, z: number): void {
  foot(out, x, z, 1.6, 0.25)
  blob(out, x, 2.45, z, 1.3, 1.05, 0.85, [BLUE, YEL, RED, BLUE, GRN], 10, 6)
  blob(out, x + 1.1, 3.1, z, 0.72, 0.68, 0.6, [YEL, MAG, BLUE])
  blob(out, x + 0.95, 3.25, z + 0.72, 0.5, 0.58, 0.1, [RED, YEL], 8, 5)
  blob(out, x + 0.95, 3.25, z - 0.72, 0.5, 0.58, 0.1, [RED, YEL], 8, 5)
  const t: [number, number, number][] = [[x + 1.65, 3.0, z], [x + 2.05, 2.4, z], [x + 2.2, 1.85, z], [x + 2.6, 1.75, z], [x + 2.85, 2.1, z]]
  tube(out, t, 0.14, [MAG, YEL, BLUE, RED])
  jet(out, x + 2.85, 2.1, z, 1.4, 0.6, 0.7)
}

/** LA SIRÈNE: the mermaid leaning back, her tail up, in stripes. */
function sirene(out: MeshBuilder, x: number, z: number): void {
  foot(out, x, z, 1.6, 0.2)
  blob(out, x, 2.6, z, 0.75, 1.05, 0.6, [MAG, YEL, GRN, RED], 10, 6)
  blob(out, x - 0.15, 4.0, z, 0.42, 0.45, 0.4, [hex('#6a3b2a'), YEL, YEL])
  tube(out, [[x + 0.3, 2.0, z], [x + 1.2, 1.7, z], [x + 2, 2, z], [x + 2.4, 2.7, z]], 0.26, [BLUE, GRN, YEL])
  blob(out, x + 2.55, 3.05, z, 0.42, 0.45, 0.14, [RED, YEL], 8, 4)
  tube(out, [[x - 0.6, 3.1, z], [x - 1.25, 3.5, z], [x - 1.15, 4.1, z]], 0.1, [YEL])
}

/** LE SERPENT: a striped snake rearing in two coils. */
function serpent(out: MeshBuilder, x: number, z: number): void {
  const pts: [number, number, number][] = []
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    pts.push([x + Math.sin(t * 7) * 0.85 * (1 - t * 0.5), W + t * 3.0, z + Math.cos(t * 7) * 0.5])
  }
  prism(out, x, z, W, W + 0.03, 1.1, 10, shade(WATER, 1.14), FIXED, 1.1, true)
  tube(out, pts, 0.2, [GRN, YEL, RED, BLUE])
  const h = pts[pts.length - 1]
  blob(out, h[0], h[1] + 0.1, h[2], 0.36, 0.26, 0.5, [YEL, RED])
}

/** LA GRENOUILLE: the frog, low and green. */
function grenouille(out: MeshBuilder, x: number, z: number): void {
  foot(out, x, z, 1.5, 0.2)
  blob(out, x, 1.9, z, 0.85, 0.5, 0.65, [GRN, YEL, GRN, BLUE])
  for (const s of [-1, 1]) blob(out, x + s * 0.32, 2.42, z - 0.25, 0.2, 0.2, 0.2, [WHT, BLACK])
  jet(out, x, 2.2, z - 0.6, 0.7, -2.0, 0.7)
}

/** LE ROSSIGNOL: the nightingale, a fat coloured bird on a stalk. */
function rossignol(out: MeshBuilder, x: number, z: number): void {
  foot(out, x, z, 2.0, 0.1)
  blob(out, x, 2.8, z, 0.75, 0.65, 0.6, [ORG, BLUE, YEL, RED], 10, 5)
  blob(out, x + 0.55, 3.45, z, 0.32, 0.32, 0.3, [YEL, RED])
  beam(out, [x + 0.8, 3.45, z], [x + 1.2, 3.5, z], 0.06, RED)
  tube(out, [[x - 0.6, 2.9, z], [x - 1.2, 3.3, z], [x - 1.4, 3.95, z]], 0.13, [BLUE, GRN])
}

/** LE RENARD: the fox, orange, its brush up. */
function renard(out: MeshBuilder, x: number, z: number): void {
  foot(out, x, z, 1.5, 0.18)
  blob(out, x, 2.2, z, 1.0, 0.55, 0.5, [ORG, YEL, ORG])
  blob(out, x + 0.95, 2.75, z, 0.38, 0.38, 0.33, [ORG, WHT])
  beam(out, [x + 1.2, 2.72, z], [x + 1.75, 2.55, z], 0.1, WHT)
  tube(out, [[x - 0.85, 2.2, z], [x - 1.45, 2.5, z], [x - 1.6, 3.2, z]], 0.2, [ORG, WHT])
}

/** The black machines: LA MORT (a hoop and a skull), LE CHAPEAU DE CLOWN, LA VIE, RAGTIME and LA DIAGONALE, in rods and wheels. */
function machine(out: MeshBuilder, x: number, z: number, kind: 'mort' | 'chapeau' | 'vie' | 'ragtime' | 'diagonale'): void {
  foot(out, x, z, 1.5, 0.13)
  switch (kind) {
    case 'mort':
      wheel(out, x, 2.7, z, 1.2, 0.8)
      blob(out, x, 2.7, z, 0.34, 0.38, 0.32, [WHT], 8, 5)
      jet(out, x, 3.6, z, -1.2, 1.5, 0.8)
      break
    case 'chapeau':
      prism(out, x, z, 1.5, 3.1, 0.7, 8, BLACK, FIXED, 0.14, true)
      wheel(out, x + 0.75, 2.3, z, 0.55, 0.2, 3)
      wheel(out, x - 0.75, 2.05, z, 0.42, -0.3, 3)
      break
    case 'vie':
      wheel(out, x - 0.5, 2.15, z, 0.72, 0.1, 4)
      wheel(out, x + 0.75, 2.75, z, 0.5, 0.1, 4)
      beam(out, [x - 0.5, 2.15, z], [x + 0.75, 2.75, z], 0.05, BLACK)
      jet(out, x + 0.75, 3.3, z, 1.3, -0.8, 0.8)
      break
    case 'ragtime':
      beam(out, [x - 1.2, W, z], [x, 3.7, z], 0.07, BLACK)
      beam(out, [x + 1.2, W, z], [x, 3.7, z], 0.07, BLACK)
      for (const y of [1.8, 2.5, 3.1]) beam(out, [x - (3.7 - y) * 0.45, y, z], [x + (3.7 - y) * 0.45, y, z], 0.04, BLACK)
      wheel(out, x, 3.7, z, 0.58, 0.9, 4)
      break
    default:
      beam(out, [x - 1.9, 1.4, z + 0.5], [x + 1.9, 4.2, z - 0.5], 0.08, BLACK)
      wheel(out, x - 0.3, 2.15, z, 0.62, 0.3, 4)
      jet(out, x + 1.9, 4.2, z - 0.5, 1.2, 0.4, 0.3)
  }
}

export function fontaineStravinsky(out: MeshBuilder): void {
  const inner = ccw(BASIN)
  const middle = offsetRing(inner, 0.35)
  const outer = offsetRing(inner, 0.8)
  // the kerb of bright steel: a lower step, the higher rim (0.75 m over the place), and the water inside it
  walls(out, outer, 0, 0.82, shade(STEEL, 0.9))
  capPolygonWithHoles(out, [outer, middle], 0.82, STEEL, FIXED)
  walls(out, middle, 0.82, 1.25, shade(STEEL, 0.96))
  capPolygonWithHoles(out, [middle, inner], 1.25, shade(STEEL, 1.1), FIXED)
  walls(out, inner, W - 0.02, 1.25, shade(STEEL, 0.7))
  capPolygonWithHoles(out, [inner], W, WATER, FIXED)

  // Saint Phalle's and Tinguely's sixteen, the lips, the firebird, the spiral and the clef where the photographs show them
  lips(out, -3.0, -9.2)
  spirale(out, 4.6, -8.4)
  firebird(out, 3.6, -1.6)
  clef(out, -2.6, -1.8)
  machine(out, -5.6, 5.2, 'mort')
  elephant(out, 4.2, 6.4)
  coeur(out, 0.2, 8.2)
  sirene(out, -5.6, 12.0)
  renard(out, 4.4, 12.6)
  machine(out, 0.4, 13.6, 'chapeau')
  serpent(out, 1.2, 3.2)
  machine(out, -2.2, 3.6, 'vie')
  grenouille(out, -6.2, -4.4)
  machine(out, 0.8, -13.2, 'diagonale')
  rossignol(out, -6.0, -13.6)
  machine(out, 6.2, -13.8, 'ragtime')

  // the arcs of water they throw at one another
  jet(out, -3.0, 3.0, -9.2, 2.4, 1.8, 1.2)
  jet(out, 4.6, 3.0, -8.4, -1.6, 3.0, 1.0)
  jet(out, 0.2, 3.8, 8.2, -1.4, -2.2, 0.7)
  jet(out, -2.6, 5.8, -1.8, -1.8, 2.0, 0.5)
  jet(out, 1.2, 4.2, 3.2, 1.6, -2.4, 0.7)
  jet(out, -5.6, 3.0, 12.0, 2.4, -1.6, 0.8)
  jet(out, 4.4, 2.9, 12.6, -1.6, -2.0, 0.8)
}
