import type { MeshBuilder } from '../../../buildings.ts'
import { beam, hex, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { ccw, jitter, slab, type V3 } from './shapes.ts'

const FIXED = 0
const COLS = 72 // the outline's samples round the building
const FACETS = 16 // the shell's flat facets round it, each a run of tiles
const LEVELS = 4 // and up it
const ROWS = 16 // courses of tiles, foot to summit

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const smooth = (a: number, b: number, t: number): number => {
  const k = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return k * k * (3 - 2 * k)
}

/** A quad in the slab's order (foot along the ring, then the head back), its flat normal outward for an anticlockwise ring. */
function face(out: MeshBuilder, a: V3, b: V3, c: V3, d: V3, colour: Rgb): void {
  const e1 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const e2 = [d[0] - b[0], d[1] - b[1], d[2] - b[2]]
  const n: V3 = [e2[1] * e1[2] - e2[2] * e1[1], e2[2] * e1[0] - e2[0] * e1[2], e2[0] * e1[1] - e2[1] * e1[0]]
  const l = Math.hypot(n[0], n[1], n[2]) || 1
  out.quad([a, b, c, d], [n[0] / l, n[1] / l, n[2] / l], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
}

/**
 * The Philharmonie de Paris (Jean Nouvel, 2015), from the owner's aerial view (PARIS_BUGS.md 16): a faceted, tilted shell
 * of pale grey tiles in a mottled pattern, far wider than tall, under a nearly flat polygonal summit; stepped pale terraces
 * wrapping its park side with ramps climbing the shell from them; dark curving ribbons of glass between shell and
 * terraces; and one tall leaning blade, tile-clad, solar panels on its sloped top, standing past the roof on the east.
 * Everything is lofted from OSM's outline (way 21502894, 163 × 104 m, no height). Local frame: −z to the park (bearing
 * 260), so +z is the east side.
 */
export function philharmonie(out: MeshBuilder, fit: Fit): void {
  const hx = Math.min(Math.max(fit.hx, 60), 90)
  const hz = Math.min(Math.max(fit.hz, 38), 58)
  const ring = ccw(fit.ring && fit.ring.length >= 3 ? fit.ring : [{ x: -hx, z: -hz }, { x: hx, z: -hz }, { x: hx, z: hz }, { x: -hx, z: hz }])
  const tiles: Rgb[] = [hex('#5f6467'), hex('#73787a'), hex('#85898b'), hex('#94989a'), hex('#a3a6a7'), hex('#b2b4b4')]
  const tile = (k: number): Rgb => {
    const r = jitter(k, 7)
    return tiles[Math.min(5, Math.floor(r * r * 2 + jitter(k, 3) * 4.4))]
  }
  const pale = hex('#ddd9cf')
  const paleShade = hex('#c4c0b6')
  const glass: Rgb = hex('#1d272d')

  // the outline, walked evenly: the foot of everything above it
  const lens = ring.map((p, i) => Math.hypot(ring[(i + 1) % ring.length].x - p.x, ring[(i + 1) % ring.length].z - p.z))
  const perimeter = lens.reduce((a, b) => a + b, 0)
  const outline: { x: number; z: number }[] = []
  for (let k = 0, i = 0, run = 0; k < COLS; k++) {
    const want = (k / COLS) * perimeter
    while (i < ring.length - 1 && run + lens[i] < want) run += lens[i++]
    const t = lens[i] > 0 ? (want - run) / lens[i] : 0
    const b = ring[(i + 1) % ring.length]
    outline.push({ x: lerp(ring[i].x, b.x, t), z: lerp(ring[i].z, b.z, t) })
  }
  const cx = outline.reduce((a, p) => a + p.x, 0) / COLS
  const cz = outline.reduce((a, p) => a + p.z, 0) / COLS
  // a point of the outline at (fractional) column u, scaled about the centre and slid
  const at = (u: number, scale: number, y: number, ox = 0, oz = 0): V3 => {
    const k = ((u % COLS) + COLS) % COLS
    const i = Math.floor(k)
    const f = k - i
    const a = outline[i]
    const b = outline[(i + 1) % COLS]
    return [cx + ox + (lerp(a.x, b.x, f) - cx) * scale, y, cz + oz + (lerp(a.z, b.z, f) - cz) * scale]
  }
  const dirAt = (u: number): number => {
    const p = at(u, 1, 0)
    const l = Math.hypot(p[0] - cx, p[2] - cz) || 1
    return ((p[0] - cx) / l) * -0.5 + ((p[2] - cz) / l) * -0.87 // toward the park, a little south
  }

  // ---- the plinth on the exact outline
  slab(out, ring, 0, 4, paleShade, pale)

  // ---- the terraces and the glass: by side, read off at the facets' columns so that the shell's foot lands on their top
  const STEPS = 4
  const facetU = (c: number): number => (c / FACETS) * COLS
  const terraceW = (u: number): number => {
    const c0 = Math.floor(u / (COLS / FACETS))
    const f = u / (COLS / FACETS) - c0
    return lerp(smooth(-0.35, 0.45, dirAt(facetU(c0))), smooth(-0.35, 0.45, dirAt(facetU(c0 + 1))), f)
  }
  // one column's stations from the plinth's top to the shell's foot: [scale, y]
  const stations = (u: number): [number, number][] => {
    const w = terraceW(u)
    const s: [number, number][] = [[0.985, 4]]
    for (let k = 1; k <= STEPS; k++) {
      const y = 4 + w * k * 3.6
      const inner = 0.985 - w * k * 0.05
      s.push([0.985 - w * (k - 1) * 0.05, y], [inner, y])
    }
    // the glass: its head wandering up and down round the building
    const top = s[s.length - 1]
    const a = (u / COLS) * Math.PI * 2
    s.push([top[0] - 0.015, top[1] + 3.2 + 2.4 * Math.sin(a * 2 + 0.9) + 1.1 * Math.sin(a * 5)])
    return s
  }
  const COLUMNS = Array.from({ length: COLS + 1 }, (_, u) => stations(u))
  const lastStation = 2 + 2 * STEPS - 1 // (the index of the glass's head)
  for (let u = 0; u < COLS; u++) {
    const A = COLUMNS[u]
    const B = COLUMNS[u + 1]
    for (let j = 0; j < lastStation; j++) {
      const riser = j % 2 === 0
      const colour = j === lastStation - 1 ? glass : riser ? paleShade : pale
      face(out, at(u, A[j][0], A[j][1]), at(u + 1, B[j][0], B[j][1]), at(u + 1, B[j + 1][0], B[j + 1][1]), at(u, A[j + 1][0], A[j + 1][1]), colour)
    }
  }

  // ---- the shell. Coarse control points give the flat facets; the tiles are just its courses, tossed between greys
  const summit = 0.3
  const peakX = -0.1 * hx
  const peakZ = 0.06 * hz
  const footAt = (c: number): [number, number] => {
    const s = COLUMNS[Math.round(facetU(((c % FACETS) + FACETS) % FACETS))][lastStation]
    return [s[0], s[1]]
  }
  const control = (c: number, l: number): [number, number, number] => {
    const [s0, y0] = footAt(c)
    const v = l / LEVELS
    const k = ((c % FACETS) + FACETS) % FACETS
    const tilt = 34 + 3.2 * (at(facetU(k), 1, 0)[0] - cx) / hx - 2.2 * (at(facetU(k), 1, 0)[2] - cz) / hz
    const wob = l === 0 || l === LEVELS ? 0 : 1
    const scale = lerp(s0, summit, Math.pow(v, 0.85)) + wob * (jitter(k * 7 + l, 11) - 0.5) * 0.11
    const y = lerp(y0, tilt, 1 - Math.pow(1 - v, 1.55)) + wob * (jitter(k * 7 + l, 13) - 0.5) * 6
    return [scale, y, Math.pow(v, 1.2)]
  }
  const shell = (u: number, r: number): V3 => {
    const fc = (u / COLS) * FACETS
    const c = Math.floor(fc)
    const f = fc - c
    const fl = (r / ROWS) * LEVELS
    const l = Math.min(LEVELS - 1, Math.floor(fl))
    const g = fl - l
    const mix = (i: number): number => lerp(lerp(control(c, l)[i], control(c + 1, l)[i], f), lerp(control(c, l + 1)[i], control(c + 1, l + 1)[i], f), g)
    const slide = mix(2)
    return at(u, mix(0), mix(1), peakX * slide, peakZ * slide)
  }
  for (let u = 0; u < COLS; u++) {
    for (let r = 0; r < ROWS; r++) {
      face(out, shell(u, r), shell(u + 1, r), shell(u + 1, r + 1), shell(u, r + 1), tile(u * 37 + r * 101))
    }
    // the summit, nearly flat, its own polygon of the same tiles
    const a = shell(u, ROWS)
    const b = shell(u + 1, ROWS)
    const mid: V3 = [cx + peakX, 34.6, cz + peakZ]
    face(out, a, b, mid, mid, tile(u * 41 + 977))
  }

  // ---- the ramps: pale bands climbing the shell from the terraces, and a short flight onto each from the top step
  const ramp = (u0: number, sweep: number, r0: number, r1: number): void => {
    const N = 14
    let prev: V3 | null = null
    for (let k = 0; k <= N; k++) {
      const t = k / N
      const p = shell(u0 + sweep * t, lerp(r0, r1, t))
      const q: V3 = [p[0], p[1] + 0.7, p[2]]
      if (prev) beam(out, prev, q, 2.6, pale, 0.3)
      prev = q
    }
  }
  let parkU = 0
  for (let u = 0; u < COLS; u++) if (dirAt(u) > dirAt(parkU)) parkU = u
  ramp(parkU - 11, 15, 0.4, 10.5)
  ramp(parkU + 12, -13, 0.4, 7.5)

  // ---- the blade: past the roof on the east, leaning out, with its sloped top
  let eastU = 0
  for (let u = 0; u < COLS; u++) if (at(u, 1, 0)[2] > at(eastU, 1, 0)[2]) eastU = u
  const base = at(eastU, 0.5, 8)
  const halfW = Math.min(23, hx * 0.3)
  const thick = 3
  const lean = 15
  // the slab's plane: s along it (local x), up its lean; +z out over the east side
  const blade = (s: number, up: number, side: number): V3 => {
    const headY = lerp(46, 54, (s + 1) / 2)
    const y = lerp(8, headY, up)
    const taper = lerp(1, 0.82, up)
    return [base[0] + s * halfW * taper, y, base[2] + lean * up + side * lerp(thick * 0.6, thick, up)]
  }
  const BU = 8
  const BV = 10
  for (let i = 0; i < BU; i++) {
    for (let j = 0; j < BV; j++) {
      const s0 = -1 + (2 * i) / BU
      const s1 = -1 + (2 * (i + 1)) / BU
      const v0 = j / BV
      const v1 = (j + 1) / BV
      // the east face runs −x→+x seen from outside's left, the west the other way
      face(out, blade(s1, v0, 1), blade(s0, v0, 1), blade(s0, v1, 1), blade(s1, v1, 1), tile(i * 53 + j * 211))
      face(out, blade(s0, v0, -1), blade(s1, v0, -1), blade(s1, v1, -1), blade(s0, v1, -1), tile(i * 59 + j * 223 + 5))
    }
  }
  // its ends and the sloped top, the panels laid along it
  face(out, blade(-1, 0, 1), blade(-1, 0, -1), blade(-1, 1, -1), blade(-1, 1, 1), tiles[1])
  face(out, blade(1, 0, -1), blade(1, 0, 1), blade(1, 1, 1), blade(1, 1, -1), tiles[1])
  const panels = 6
  for (let i = 0; i < panels; i++) {
    const s0 = -1 + (2 * i) / panels
    const s1 = -1 + (2 * (i + 1)) / panels
    const lift = (p: V3): V3 => [p[0], p[1] + 0.02, p[2]]
    face(out, lift(blade(s0, 1, -1)), lift(blade(s1, 1, -1)), lift(blade(s1, 1, 1)), lift(blade(s0, 1, 1)), i % 2 ? hex('#1c2733') : hex('#243240'))
  }
}
