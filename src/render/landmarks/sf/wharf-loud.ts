/**
 * THE LOUD KIT for Jefferson Street's "hoodie blocks" (owner, 2026-10-17, sending Street View: "just note the crazy
 * variety of buildings and many huge signs (HOODIES $10)", "so many hoodie stores!", "it's only about 4 blocks of this
 * level of craziness, but it's the whole character of the area"). The pieces every one of those fronts is made of —
 * rooftop billboards on steel frames, vertical blade signs, sale placards, A-frame boards, rolling racks of hoodies,
 * postcard spinners, pole flags, chevron ENTER arrows — shared by wharf-landside.ts and wharf-shops.ts (which import
 * each other's builders, so the kit lives here, importing neither).
 *
 * Everything is placed on an edge `e` (parts.ts `edgeAt`): `u` along it, `y` up, `o` out from the wall.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { prism, EMIT, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign, type SignSpec } from '../signage.ts'
import { edgeAt, boxAlong } from '../parts.ts'
import { tube, ellipse, type V3 } from './wharf-carnival.ts'

type Edge = ReturnType<typeof edgeAt>
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const MT = surfaceTag('metal'), WT = surfaceTag('clapboard')
const WARM: Rgb = [1.0, 0.86, 0.55], WHITE: Rgb = [0.96, 0.96, 0.94], STEEL: Rgb = [0.32, 0.33, 0.35], IRON: Rgb = [0.1, 0.1, 0.11]

/** the colours hoodies come in on a Jefferson Street rack: the city's name on all of them */
export const HOODIE: Rgb[] = [
  [0.75, 0.1, 0.12], [0.1, 0.1, 0.12], [0.12, 0.22, 0.5], [0.55, 0.57, 0.6], [0.95, 0.45, 0.1], [0.1, 0.45, 0.3],
  [0.95, 0.55, 0.7], [0.45, 0.2, 0.55], [0.96, 0.96, 0.94], [0.95, 0.78, 0.15],
]

/** a point `u` along edge `e`, `y` up, `o` out from the wall (negative: inside) */
export const on = (e: Edge, u: number, y: number, o = 0): V3 => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]

/** a box squared to edge `e`: centred `u` along it and `o` out, from `y0` up `h`, `w` along the wall and `d` across it */
export function slab(out: MeshBuilder, e: Edge, u: number, o: number, y0: number, w: number, h: number, d: number, c: Rgb, tag: number): void {
  const p = on(e, u, y0 + h / 2, o)
  boxAlong(out, p[0], p[1], p[2], w / 2, h / 2, d / 2, e.heading, c, tag)
}

/** one quad facing out of edge `e` */
export function panel(out: MeshBuilder, e: Edge, u: number, o: number, y0: number, w: number, h: number, c: Rgb, tag: number): void {
  out.quad([on(e, u - w / 2, y0, o), on(e, u + w / 2, y0, o), on(e, u + w / 2, y0 + h, o), on(e, u - w / 2, y0 + h, o)], [e.nx, 0, e.nz], UVQ, c, tag)
}

/** a flat sign on edge `e`, its centre `u` along it, `y` up, `o` out */
export function signAt(out: MeshBuilder, e: Edge, u: number, y: number, o: number, spec: SignSpec): void {
  const p = on(e, u, y, o)
  sign(out, spec, { x: p[0], y, z: p[2], heading: e.heading })
}

/** a row of lit bulbs from p0 to p1, each two crossed quads (four triangles, where a box is twelve) */
export function bulbLine(out: MeshBuilder, p0: V3, p1: V3, step: number, s = 0.06, c: Rgb = WARM): void {
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2])
  const n = Math.max(1, Math.round(L / step))
  for (let k = 0; k <= n; k++) {
    const t = k / n
    const x = p0[0] + (p1[0] - p0[0]) * t, y = p0[1] + (p1[1] - p0[1]) * t, z = p0[2] + (p1[2] - p0[2]) * t
    out.quad([[x - s, y - s, z], [x + s, y - s, z], [x + s, y + s, z], [x - s, y + s, z]], [0, 0, 1], UVQ, c, EMIT)
    out.quad([[x, y - s, z - s], [x, y - s, z + s], [x, y + s, z + s], [x, y + s, z - s]], [1, 0, 0], UVQ, c, EMIT)
  }
}

export interface Billboard {
  /** the board's face colour (the picture's ground) */
  bg: Rgb
  /** the big words */
  text: string
  ink: Rgb
  face?: SignSpec['face']
  /** a second line under it */
  sub?: string
  subInk?: Rgb
  /** a coloured block on one side of the picture (a photograph's worth of colour) */
  block?: Rgb
  /** draw a cartoon face in the block (THE PHILHARMONIK's poster) */
  portrait?: boolean
}

/**
 * A ROOFTOP BILLBOARD on a steel frame: two lattice legs standing on the roof `y` (stayed back to the roof), a catwalk
 * along the foot with a rail, four gooseneck floodlights reaching over the face, and the board — a dark frame round the
 * picture, `w`×`h`, its foot `lift` over the roof. It faces out of edge `e`, centred `u`, set `o` from the wall (negative:
 * back over the roof). Around 600 triangles.
 */
export function billboard(out: MeshBuilder, e: Edge, u: number, o: number, y: number, w: number, h: number, lift: number, b: Billboard): void {
  const y0 = y + lift
  // the legs (I-beams, read as narrow boxes) and their back stays
  for (const s of [-0.32, 0.32]) {
    slab(out, e, u + s * w, o - 0.25, y, 0.25, lift + h * 0.9, 0.25, STEEL, MT)
    tube(out, on(e, u + s * w, y0 + h * 0.6, o - 0.3), on(e, u + s * w, y + 0.05, o - 0.3 - lift - 1.2), 0.06, 4, STEEL, MT)
    slab(out, e, u + s * w, o - 0.3 - (lift + 1.2) / 2, y, 0.4, 0.15, lift + 1.4, STEEL, MT)
  }
  for (let k = 0; k < 3; k++) slab(out, e, u, o - 0.3, y0 + 0.4 + k * (h - 0.8) / 2, w * 0.9, 0.12, 0.12, STEEL, MT)
  // the board: a frame, the picture
  slab(out, e, u, o, y0, w + 0.3, h + 0.3, 0.3, [0.07, 0.07, 0.08], MT)
  panel(out, e, u, o + 0.22, y0 + 0.15, w, h, b.bg, MT)
  if (b.block) {
    const bw = b.portrait ? Math.min(w * 0.32, h * 0.9) : w * 0.12
    panel(out, e, u + w / 2 - bw / 2, o + 0.26, y0 + 0.15, bw, h, b.block, MT)
    if (b.portrait) {
      // a cartoon face, three-quarters to us: skin oval, dark hair over it, eyes, a mouth
      const c = on(e, u + w / 2 - bw / 2, y0 + 0.15 + h * 0.5, o + 0.29)
      const T: V3 = [e.tx, 0, e.tz], Y: V3 = [0, 1, 0], N: V3 = [e.nx, 0, e.nz]
      ellipse(out, [c[0], c[1] + h * 0.12, c[2]], T, Y, N, bw * 0.34, h * 0.36, 12, [0.15, 0.1, 0.08], MT)
      ellipse(out, [c[0] + e.nx * 0.03, c[1] - h * 0.02, c[2] + e.nz * 0.03], T, Y, N, bw * 0.27, h * 0.32, 12, [0.93, 0.72, 0.58], MT)
      for (const s of [-1, 1]) ellipse(out, [c[0] + e.tx * s * bw * 0.11 + e.nx * 0.06, c[1] + h * 0.04, c[2] + e.tz * s * bw * 0.11 + e.nz * 0.06], T, Y, N, bw * 0.045, h * 0.035, 6, [0.08, 0.08, 0.1], MT)
      ellipse(out, [c[0] + e.nx * 0.06, c[1] - h * 0.17, c[2] + e.nz * 0.06], T, Y, N, bw * 0.09, h * 0.035, 6, [0.75, 0.2, 0.25], MT)
    }
  }
  const tw = b.portrait ? w * 0.62 : w - 0.8, tu = b.portrait ? u - w * 0.17 : u
  signAt(out, e, tu, y0 + 0.15 + h * (b.sub ? 0.62 : 0.5), o + 0.3, { type: 'flat', text: b.text, h: h * (b.sub ? 0.32 : 0.45), w: tw, face: b.face ?? 'block', weight: 'bold', colour: b.ink, lit: 'front' })
  if (b.sub) signAt(out, e, tu, y0 + 0.15 + h * 0.22, o + 0.3, { type: 'flat', text: b.sub, h: h * 0.11, w: tw, face: 'grotesque', weight: 'bold', colour: b.subInk ?? b.ink, lit: 'front' })
  // the catwalk and its rail, and the floodlights on their arms over the face
  slab(out, e, u, o + 0.55, y0 - 0.1, w + 0.2, 0.08, 0.9, [0.25, 0.26, 0.28], MT)
  slab(out, e, u, o + 0.95, y0 + 0.75, w + 0.2, 0.05, 0.05, STEEL, MT)
  for (let k = 0; k < 4; k++) {
    const lu = u - w / 2 + (k + 0.5) * (w / 4)
    tube(out, on(e, lu, y0 - 0.05, o + 0.9), on(e, lu, y0 + 0.5, o + 1.8), 0.03, 3, IRON, MT)
    const p = on(e, lu, y0 + 0.55, o + 1.85)
    boxAlong(out, p[0], p[1], p[2], 0.22, 0.08, 0.14, e.heading, IRON, MT)
    panel(out, e, lu, o + 1.95, y0 + 0.5, 0.36, 0.08, WARM, EMIT)
  }
}

/**
 * A VERTICAL BLADE SIGN square off the wall at `u`: a lit box `bh` tall and `bw` deep standing `o0` out on two iron arms,
 * the letters stacked down both faces, a bulb chaser along its edge if `bulbs`.
 */
export function blade(out: MeshBuilder, e: Edge, u: number, y: number, bh: number, c: Rgb, text: string, ink: Rgb, bulbs = false, bw = 0.95, face: SignSpec['face'] = 'block'): void {
  const o = 0.35 + bw / 2
  const p = on(e, u, y + bh / 2, o), hd = e.heading + Math.PI / 2
  boxAlong(out, p[0], p[1], p[2], bw / 2, bh / 2, 0.14, hd, c, MT)
  for (const k of [0.15, 0.85]) tube(out, on(e, u, y + bh * k, 0.02), on(e, u, y + bh * k, 0.4), 0.035, 4, IRON, MT)
  for (const sd of [1, -1]) {
    const h2 = hd + (sd > 0 ? 0 : Math.PI)
    sign(out, { type: 'flat', text, h: Math.min(bw * 0.62, (bh * 0.85) / Math.max(1, text.length) * 0.78), w: bw * 0.8, face, weight: 'bold', colour: ink, lit: 'self', vertical: true },
      { x: p[0] + Math.sin(h2) * 0.15, y: p[1], z: p[2] + Math.cos(h2) * 0.15, heading: h2 })
  }
  if (bulbs) bulbLine(out, on(e, u, y + 0.1, o + bw / 2 + 0.03), on(e, u, y + bh - 0.1, o + bw / 2 + 0.03), 0.3, 0.05)
}

/** a SALE PLACARD flat on a pier or window: a coloured card with its words, `w`×`h`, centred `u`, foot at `y` */
export function placard(out: MeshBuilder, e: Edge, u: number, y: number, o: number, w: number, h: number, c: Rgb, text: string, ink: Rgb, sub?: string): void {
  panel(out, e, u, o, y, w, h, c, MT)
  signAt(out, e, u, y + h * (sub ? 0.6 : 0.5), o + 0.02, { type: 'flat', text, h: h * (sub ? 0.34 : 0.48), w: w * 0.88, face: 'block', colour: ink, lit: 'none' })
  if (sub) signAt(out, e, u, y + h * 0.2, o + 0.02, { type: 'flat', text: sub, h: h * 0.15, w: w * 0.85, face: 'grotesque', weight: 'bold', colour: ink, lit: 'none' })
}

/** an A-FRAME pavement board `o` out from the wall: two leaning boards, the face lettered */
export function aFrame(out: MeshBuilder, e: Edge, u: number, o: number, y: number, c: Rgb, text: string, ink: Rgb): void {
  const top = on(e, u, y + 1.05, o), N: V3 = [e.nx, 0, e.nz]
  for (const s of [1, -1]) {
    const a = on(e, u - 0.32, y, o + s * 0.28), b = on(e, u + 0.32, y, o + s * 0.28)
    const c2: V3 = [top[0] + e.tx * 0.32, top[1], top[2] + e.tz * 0.32], d2: V3 = [top[0] - e.tx * 0.32, top[1], top[2] - e.tz * 0.32]
    out.quad(s > 0 ? [a, b, c2, d2] : [b, a, d2, c2], [N[0] * s, 0.25, N[2] * s], UVQ, c, WT)
  }
  const m = on(e, u, y + 0.58, o + 0.15)
  sign(out, { type: 'flat', text, h: 0.13, w: 0.52, face: 'block', colour: ink, lit: 'none' }, { x: m[0], y: m[1], z: m[2], heading: e.heading })
}

/**
 * A ROLLING RACK OF HOODIES on the pavement, `o` out from the wall, square to it: chrome frame, a row of hoodies hung
 * side-on (body and hood), a price card on top. About 250 triangles.
 */
export function hoodieRack(out: MeshBuilder, e: Edge, u: number, o: number, y: number, seed: number, price = '$10', n = 8): void {
  const L = n * 0.2 + 0.3
  const chrome: Rgb = [0.72, 0.73, 0.75]
  for (const k of [-0.5, 0.5]) slab(out, e, u + k * L, o, y, 0.05, 1.65, 0.05, chrome, MT)
  slab(out, e, u, o, y + 1.62, L + 0.05, 0.04, 0.04, chrome, MT)
  for (const k of [-0.5, 0.5]) slab(out, e, u + k * L, o, y, 0.06, 0.04, 0.55, chrome, MT)
  for (let k = 0; k < n; k++) {
    const c = HOODIE[(seed * 3 + k) % HOODIE.length], uu = u - L / 2 + 0.25 + k * 0.2
    slab(out, e, uu, o, y + 0.85, 0.16, 0.72, 0.62, c, WT)
    slab(out, e, uu, o + 0.18, y + 1.45, 0.14, 0.18, 0.24, c, WT)
  }
  slab(out, e, u, o, y + 1.66, 0.7, 0.32, 0.03, [0.98, 0.85, 0.15], MT)
  signAt(out, e, u, y + 1.82, o + 0.02, { type: 'flat', text: price, h: 0.18, w: 0.6, face: 'block', colour: [0.8, 0.08, 0.1], lit: 'none' })
}

/** a POSTCARD SPINNER: a tall rack of four faces of bright cards on a post */
export function postcardSpinner(out: MeshBuilder, e: Edge, u: number, o: number, y: number, seed: number): void {
  const p = on(e, u, y, o)
  prism(out, p[0], p[2], y, y + 0.3, 0.25, 6, [0.2, 0.2, 0.22], MT)
  for (let r = 0; r < 4; r++) prism(out, p[0], p[2], y + 0.35 + r * 0.33, y + 0.64 + r * 0.33, 0.22, 4, HOODIE[(seed + r * 3) % HOODIE.length], MT)
  prism(out, p[0], p[2], y + 1.7, y + 1.78, 0.25, 6, [0.2, 0.2, 0.22], MT)
}

/** a CHEVRON ARROW painted flat on a wall, pointing down (`dir` -1) or along the wall (+1 → +u, -2 → -u) */
export function chevron(out: MeshBuilder, e: Edge, u: number, y: number, o: number, s: number, c: Rgb, dir: number): void {
  const N: V3 = [e.nx, 0, e.nz]
  const P = (du: number, dy: number): V3 => on(e, u + du, y + dy, o)
  let pts: [number, number][][]
  if (dir === -1) pts = [[[-s, s], [0, 0], [0, -s * 0.6], [-s, s * 0.4]], [[0, 0], [s, s], [s, s * 0.4], [0, -s * 0.6]]]
  else {
    const g = dir > 0 ? 1 : -1
    pts = [[[-s * g, s], [0, 0], [s * 0.6 * g, 0], [-s * 0.4 * g, s]], [[0, 0], [-s * g, -s], [-s * 0.4 * g, -s], [s * 0.6 * g, 0]]]
  }
  for (const q of pts) {
    const v = q.map(([a, b]) => P(a, b))
    // wind each so it faces out of the wall
    const ax = v[1][0] - v[0][0], az = v[1][2] - v[0][2], ay = v[1][1] - v[0][1], bx = v[2][0] - v[0][0], bz = v[2][2] - v[0][2], by = v[2][1] - v[0][1]
    const nx = ay * bz - az * by, nz = ax * by - ay * bx
    out.quad(nx * N[0] + nz * N[2] >= 0 ? [v[0], v[1], v[2], v[3]] : [v[3], v[2], v[1], v[0]], N, UVQ, c, MT)
  }
}

/** an AMERICAN FLAG on a pole standing on a roof at `p`, the fly along edge `e`'s tangent */
export function flagPole(out: MeshBuilder, e: Edge, p: V3, H: number): void {
  tube(out, p, [p[0], p[1] + H, p[2]], 0.05, 5, [0.85, 0.85, 0.86], MT)
  const top = p[1] + H - 0.15, fw = 2.4, fh = 1.3
  const Q = (du: number, dy: number, dn: number): V3 => [p[0] + e.tx * du + e.nx * dn, top - dy, p[2] + e.tz * du + e.nz * dn]
  const N: V3 = [e.nx, 0, e.nz], RED: Rgb = [0.75, 0.1, 0.14], BLUE: Rgb = [0.12, 0.17, 0.42]
  const ripple = (du: number): number => 0.12 * Math.sin(du * 2.4)
  for (let s = 0; s < 7; s++) {
    for (let k = 0; k < 3; k++) {
      const a = 0.05 + (fw * k) / 3, b = 0.05 + (fw * (k + 1)) / 3
      const c = s === 0 || s % 2 === 0 ? RED : WHITE
      const y0 = (s * fh) / 7, y1 = ((s + 1) * fh) / 7
      const quad: V3[] = [Q(a, y1, ripple(a)), Q(b, y1, ripple(b)), Q(b, y0, ripple(b)), Q(a, y0, ripple(a))]
      out.quad(quad, N, UVQ, k === 0 && s < 4 ? BLUE : c, WT)
      out.quad([quad[1], quad[0], quad[3], quad[2]], [-N[0], 0, -N[2]], UVQ, k === 0 && s < 4 ? BLUE : c, WT)
    }
  }
}

/** a vertical BANNER hung flat on a wall (a cloth with a pole across its head), lettered down it */
export function wallBanner(out: MeshBuilder, e: Edge, u: number, y: number, o: number, w: number, h: number, c: Rgb, text: string, ink: Rgb, face: SignSpec['face'] = 'block'): void {
  panel(out, e, u, o, y, w, h, c, WT)
  slab(out, e, u, o + 0.03, y + h - 0.04, w + 0.2, 0.06, 0.06, IRON, MT)
  signAt(out, e, u, y + h / 2, o + 0.02, { type: 'flat', text, h: Math.min(w * 0.6, (h * 0.85) / Math.max(1, text.length) * 0.8), w: w * 0.85, face, weight: 'bold', colour: ink, lit: 'none', vertical: true })
}
