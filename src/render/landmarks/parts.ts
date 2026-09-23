/**
 * The parts a modelled building is made of, shared (user, 2026-09-22: "try to keep it nearly all to shared
 * functions, so the output will be shorter… of course some wild buildings won't work with shared functions, and
 * that's ok"). The district batches kept writing these by hand: a theatre's marquee and its blade, a colonnade, a
 * cupola on a corner, an arcade, quoins, a roof over a long strip, a facade applied to ONE wall.
 *
 * Everything here works in the fit's local frame, on a ring from `towerRing(fit)` — so it sits on top of the tower
 * grammar (render/landmarks/tower.ts) rather than beside it — and takes a surface from the landmark library
 * (render/cartoon-material.ts) so nothing is flat.
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, strut, EMIT, type Rgb } from '../models.ts'
import { surfaceTag, type Surface } from '../cartoon-material.ts'
import { faceBand, insetRing, simplifyRing, type Face } from './tower.ts'

export { simplifyRing, insetRing }

type P2 = { x: number; z: number }

/**
 * One edge of a ring, with everything a part needs to sit on it: its ends, its direction and outward normal, its
 * length and its heading. This is the coordinate arithmetic every builder was writing by hand.
 */
export function edgeAt(ring: P2[], i: number): { a: P2; b: P2; tx: number; tz: number; nx: number; nz: number; L: number; heading: number; mid: P2 } {
  const a = ring[i % ring.length]
  const b = ring[(i + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  /*
   * `heading` is the direction the wall FACES — the same convention boxAlong, turned, signText, marquee and
   * bladeSign all use, where 0 faces +z. It used to be atan2(tx, tz), the direction the wall RUNS, which is a
   * quarter turn from what every one of those helpers expects. Everything that took an edge's heading was
   * therefore rotated 90 degrees: protruding signs came out backwards, a marquee collapsed to an invisible
   * sliver, a parapet shot off across its terrace, a submarine's conning tower sat athwart the hull. Use `tx`
   * and `tz` to move ALONG the wall; use `heading` to turn something onto it.
   */
  return { a, b, tx, tz, nx: tz, nz: -tx, L, heading: Math.atan2(tz, -tx), mid: { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 } }
}

/** The ring's longest edge: usually the front of a slab, the side a colonnade or a marquee belongs on. */
export function longestEdge(ring: P2[]): number {
  let best = 0
  let L = 0
  for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); if (e.L > L) { L = e.L; best = i } }
  return best
}

/**
 * A ring with its corners rounded (a prow, a drum, a 1960s tower's rounded ends): each corner replaced by an arc
 * of `n` points at radius `r`. A radius bigger than half the shorter edge simply rounds as far as it can.
 */
export function roundRing(ring: P2[], r: number, n = 4): P2[] {
  const out: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const prev = ring[(i - 1 + ring.length) % ring.length]
    const next = ring[(i + 1) % ring.length]
    const d0 = Math.hypot(p.x - prev.x, p.z - prev.z) || 1
    const d1 = Math.hypot(next.x - p.x, next.z - p.z) || 1
    const rr = Math.min(r, d0 / 2, d1 / 2)
    const a = { x: p.x + ((prev.x - p.x) / d0) * rr, z: p.z + ((prev.z - p.z) / d0) * rr }
    const b = { x: p.x + ((next.x - p.x) / d1) * rr, z: p.z + ((next.z - p.z) / d1) * rr }
    for (let k = 0; k <= n; k++) {
      const t = k / n
      // a quadratic through the corner: a → p → b
      const u = 1 - t
      out.push({ x: u * u * a.x + 2 * u * t * p.x + t * t * b.x, z: u * u * a.z + 2 * u * t * p.z + t * t * b.z })
    }
  }
  return out
}

/** A flat panel on a wall (a sign board, a mural, a spandrel, a shopfront), laid on an edge of the ring. */
export function panelOn(out: MeshBuilder, ring: P2[], edge: number, along: number, y: number, w: number, h: number,
                        c: Rgb, opts: { out?: number; tag?: number } = {}): void {
  const e = edgeAt(ring, edge)
  const u = along * e.L
  const o = opts.out ?? 0.06
  boxAlong(out, e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o, w / 2, h / 2, 0.04, e.heading, c, opts.tag ?? 0)
}

/** A 3 × 5 block font: enough for a sign read from across the street. */
const GLYPHS: Record<string, string> = {
  A: '111101111101101', B: '110101110101110', C: '111100100100111', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '111100101101111', H: '101101111101101', I: '111010010010111', J: '001001001101111',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '111101101101111',
  P: '111101111100100', Q: '111101101111011', R: '111101110101101', S: '111100111001111', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001011001111',
  '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111',
  '9': '111101111001111', '½': '101011111110101', ' ': '000000000000000', '&': '110101110101111', '.': '000000000000010',
  "'": '010010000000000', '-': '000000111000000',
}

/**
 * Text painted or applied on a wall at (cx, cy), facing +z, each letter `h` tall.
 *
 * Laid out right to left in local +x: a wall that faces +z has local +x on the reader's LEFT, and text laid along
 * +x reads mirrored (BUGS.md #50). `lit` makes it a neon or bulb sign, bright after dark.
 */
export function signText(out: MeshBuilder, text: string, cx: number, cy: number, z: number, h: number, c: Rgb,
                         opts: { lit?: boolean; tag?: number; vertical?: boolean; heading?: number } = {}): void {
  const cell = h / 5
  const w = cell * 3
  const gap = cell * 0.9
  const tag = opts.lit ? EMIT : opts.tag ?? 0
  const chars = text.toUpperCase().split('')
  const cz0 = z
  const total = opts.vertical ? chars.length * (h + gap) : chars.length * (w + gap) - gap
  chars.forEach((ch, i) => {
    const g = GLYPHS[ch]
    if (!g) return
    const x0 = opts.vertical ? cx - w / 2 : cx + total / 2 - i * (w + gap) - w
    const y0 = opts.vertical ? cy + total / 2 - i * (h + gap) - h : cy - h / 2
    for (let r = 0; r < 5; r++) {
      for (let k = 0; k < 3; k++) {
        if (g[r * 3 + k] !== '1') continue
        // `heading` turns the whole sign onto any wall (0 faces +z, as a box does)
        if (opts.heading) {
          const [tx, tz] = turned(cx, cz0, x0 + (2.5 - k) * cell, z, opts.heading)
          boxAlong(out, tx, y0 + (4.5 - r) * cell, tz, cell / 2, cell / 2, 0.03, opts.heading, c, tag)
        }
        else box(out, x0 + (2.5 - k) * cell, y0 + (4.5 - r) * cell, z, cell / 2, cell / 2, 0.03, c, tag)
      }
    }
  })
}

/**
 * The same block letters, but spelled out in LIGHT BULBS on a frame — which is what a sign like Ghirardelli's
 * actually is, and why painted letters never look right for it: at a distance you read a constellation of
 * points, and after dark the points are the whole sign.
 *
 * Each glyph cell becomes a bulb on its own short stalk, with a slim frame behind. `spacing` is the bulb
 * pitch in metres, so the letter height follows from it (a glyph is five cells tall). `lit` makes the bulbs
 * emit, which is what they do at night; by day they are off-white glass on a steel frame.
 *
 * Shared because San Francisco is full of them: Ghirardelli, the theatre marquees on Market Street, the blade
 * signs, the crab wheel at the Wharf.
 */
export function bulbText(out: MeshBuilder, text: string, cx: number, cy: number, cz: number, spacing: number,
                         opts: { heading?: number; bulb?: Rgb; frame?: Rgb; lit?: boolean; gap?: number } = {}): void {
  const a = opts.heading ?? 0
  const bulb = opts.bulb ?? [1, 0.96, 0.86]
  const frame = opts.frame ?? [0.3, 0.31, 0.33]
  const gapCells = opts.gap ?? 1.2
  const chars = text.toUpperCase().split('')
  const cols = chars.length * (3 + gapCells) - gapCells
  const r = spacing * 0.34
  chars.forEach((ch, i) => {
    const g = GLYPHS[ch]
    if (!g) return
    const u0 = (cols / 2 - i * (3 + gapCells)) * spacing
    for (let row = 0; row < 5; row++) {
      for (let k = 0; k < 3; k++) {
        if (g[row * 3 + k] !== '1') continue
        const u = u0 - k * spacing
        const y = cy + (4 - row) * spacing - 2 * spacing
        const [bx, bz] = turned(cx, cz, cx + u, cz, a)
        // the stalk holding the bulb off the frame, then the bulb itself
        boxAlong(out, bx, y, bz, r * 0.25, r * 0.25, spacing * 0.22, a, frame, 0)
        boxAlong(out, bx, y, bz, r, r, r, a, bulb, opts.lit === false ? 0 : EMIT)
      }
    }
  })
  // the frame the bulbs are mounted on: an upright each side and a rail top and bottom
  const halfW = (cols / 2) * spacing + spacing
  const halfH = 2.5 * spacing + spacing * 0.6
  for (const sgn of [-1, 1]) {
    const [px, pz] = turned(cx, cz, cx + sgn * halfW, cz, a)
    boxAlong(out, px, cy, pz, spacing * 0.12, halfH, spacing * 0.12, a, frame, 0)
  }
  for (const sgn of [-1, 1]) {
    boxAlong(out, cx, cy + sgn * halfH, cz, halfW, spacing * 0.1, spacing * 0.1, a, frame, 0)
  }
}

/**
 * A point on a wall that faces `heading`: the local (x, z) offsets from the anchor, turned. `heading` is the
 * direction the wall's front faces, 0 being +z — the same convention `boxAlong` uses.
 */
function turned(ax: number, az: number, x: number, z: number, heading: number): [number, number] {
  const s = Math.sin(heading)
  const c = Math.cos(heading)
  const dx = x - ax
  const dz = z - az
  return [ax + dx * c + dz * s, az - dx * s + dz * c]
}

/**
 * A theatre's marquee: the box out over the pavement with its lit soffit, a band of changeable letters on both
 * faces and the return, and the chaser bulbs round its edge. `w` is its half-width, `out_` how far it projects.
 * `heading` puts it on any wall (0 faces +z; `edgeAt(ring, i).heading` for an edge of the footprint).
 */
export function marquee(out: MeshBuilder, cx: number, y: number, z: number, w: number, out_: number, name: string,
                        opts: { body?: Rgb; band?: Rgb; letters?: Rgb; bulbs?: Rgb; height?: number; heading?: number } = {}): void {
  const body = opts.body ?? [0.72, 0.16, 0.14]
  const band = opts.band ?? [0.96, 0.95, 0.9]
  const letters = opts.letters ?? [0.1, 0.1, 0.12]
  const bulbs = opts.bulbs ?? [1, 0.92, 0.7]
  const h = opts.height ?? 2.2
  const a = opts.heading ?? 0
  const metal = surfaceTag('metal')
  /** a box in the marquee's own frame: u along the wall, v up, o out from it */
  const put = (u: number, v: number, o: number, hu: number, hv: number, ho: number, c: Rgb, tag = 0): void => {
    const [x, zz] = turned(cx, z, cx + u, z + o, a)
    boxAlong(out, x, v, zz, hu, hv, ho, a, c, tag)
  }
  // the box, and the soffit under it, lit
  put(0, y, out_ / 2, w, h / 2, out_ / 2, body, metal)
  put(0, y - h / 2 - 0.02, out_ / 2, w * 0.95, 0.03, out_ * 0.45, [1, 0.94, 0.78], EMIT)
  // the readerboard on the front and both returns, with the name on the front
  put(0, y, out_ + 0.02, w * 0.98, h * 0.34, 0.03, band)
  const [sx, sz] = turned(cx, z, cx, z + out_ + 0.06, a)
  signText(out, name, sx, y, sz, h * 0.26, letters, { heading: a })
  for (const sgn of [-1, 1]) put(sgn * (w + 0.02), y, out_ / 2, 0.03, h * 0.34, out_ * 0.45, band)
  // the bulbs round the front edge
  const n = Math.max(6, Math.round((w * 2) / 0.6))
  for (let i = 0; i <= n; i++) {
    const u = -w + (i * 2 * w) / n
    put(u, y + h / 2 - 0.12, out_ + 0.04, 0.07, 0.07, 0.07, bulbs, EMIT)
    put(u, y - h / 2 + 0.12, out_ + 0.04, 0.07, 0.07, 0.07, bulbs, EMIT)
  }
}

/**
 * A vertical blade sign on a facade: the tall board out from the wall on its frame, the name down it in lit
 * letters on both faces, and a crown of bulbs. (The Warfield, the Orpheum, the hotels.) `heading` puts it on any
 * wall (0 faces +z; `edgeAt(ring, i).heading` for an edge of the footprint).
 */
export function bladeSign(out: MeshBuilder, cx: number, yTop: number, z: number, h: number, name: string,
                          opts: { body?: Rgb; letters?: Rgb; width?: number; out?: number; heading?: number } = {}): void {
  const body = opts.body ?? [0.1, 0.12, 0.16]
  const letters = opts.letters ?? [1, 0.86, 0.4]
  const w = opts.width ?? 1.5
  const o = opts.out ?? 1.2
  const a = opts.heading ?? 0
  const metal = surfaceTag('metal')
  const put = (u: number, v: number, oo: number, hu: number, hv: number, ho: number, c: Rgb, tag = 0): void => {
    const [x, zz] = turned(cx, z, cx + u, z + oo, a)
    boxAlong(out, x, v, zz, hu, hv, ho, a, c, tag)
  }
  put(0, yTop - h / 2, o, w / 2, h / 2, 0.12, body, metal)
  for (const sgn of [-1, 1]) {
    const [tx, tz] = turned(cx, z, cx, z + o + sgn * 0.14, a)
    signText(out, name, tx, yTop - h / 2, tz, Math.min(w * 0.62, h / (name.length * 1.25)), letters, { lit: true, vertical: true, heading: a })
  }
  // the bracket back to the wall, and the bulbs down both edges
  for (const v of [yTop - 0.4, yTop - h + 0.4]) {
    const [ax, az] = turned(cx, z, cx, z, a)
    const [bx, bz] = turned(cx, z, cx, z + o, a)
    strut(out, [ax, v, az], [bx, v, bz], 0.06, 0.06, body, 0, false)
  }
  const n = Math.max(4, Math.round(h / 0.8))
  for (let i = 0; i <= n; i++) {
    for (const sgn of [-1, 1]) put(sgn * (w / 2 + 0.03), yTop - (i * h) / n, o, 0.05, 0.05, 0.12, [1, 0.9, 0.6], EMIT)
  }
}

/**
 * A colonnade along one side of the ring: `n` columns between `from` and `to` along that edge, standing `out_`
 * proud, under an entablature. (The Opera House, the Asian Art Museum, a bank's portico.)
 */
export function colonnade(out: MeshBuilder, a: P2, b: P2, y0: number, height: number, n: number,
                          opts: { radius?: number; out?: number; colour?: Rgb; material?: Surface; entablature?: number } = {}): void {
  const r = opts.radius ?? 0.55
  const o = opts.out ?? 1.2
  const c = opts.colour ?? [0.86, 0.84, 0.78]
  const tag = surfaceTag(opts.material ?? 'ashlar')
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const ent = opts.entablature ?? 1.4
  for (let i = 0; i < n; i++) {
    const u = ((i + 0.5) / n) * L
    const x = a.x + tx * u + nx * o
    const z = a.z + tz * u + nz * o
    box(out, x, y0 + height / 2, z, r, height / 2, r, c, tag)
    box(out, x, y0 + height + 0.12, z, r * 1.25, 0.12, r * 1.25, c, tag)      // the capital
    box(out, x, y0 + 0.15, z, r * 1.25, 0.15, r * 1.25, c, tag)               // the base
  }
  // the entablature over them
  const mx = a.x + tx * (L / 2) + nx * o
  const mz = a.z + tz * (L / 2) + nz * o
  // boxAlong wants the direction the entablature FACES, not the direction it runs: atan2(tx, tz) turned it a
  // quarter step and it came out as a bar jutting sideways out of the portico (seen on two civic buildings)
  const ang = Math.atan2(nx, nz)
  boxAlong(out, mx, y0 + height + ent / 2 + 0.2, mz, L / 2, ent / 2, o * 0.8, ang, c, tag)
}

/** A box turned to a heading (for a part that runs along an edge of a ring rather than along x or z). */
export function boxAlong(out: MeshBuilder, cx: number, cy: number, cz: number, hx: number, hy: number, hz: number,
                         heading: number, c: Rgb, tag = 0): void {
  const s = Math.sin(heading)
  const co = Math.cos(heading)
  const P = (dx: number, dy: number, dz: number): [number, number, number] => [cx + dx * co + dz * s, cy + dy, cz - dx * s + dz * co]
  const corners: [number, number, number][][] = [
    [P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)],
    [P(hx, -hy, -hz), P(-hx, -hy, -hz), P(-hx, hy, -hz), P(hx, hy, -hz)],
    [P(hx, -hy, hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz)],
    [P(-hx, -hy, -hz), P(-hx, -hy, hz), P(-hx, hy, hz), P(-hx, hy, -hz)],
    [P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), P(-hx, hy, -hz)],
    [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz)],
  ]
  const normals: [number, number, number][] = [[s, 0, co], [-s, 0, -co], [co, 0, -s], [-co, 0, s], [0, 1, 0], [0, -1, 0]]
  corners.forEach((q, i) => out.quad(q as [[number, number, number], [number, number, number], [number, number, number], [number, number, number]],
    normals[i], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag))
}

/** An arcade of round arches along an edge: the piers, and the arch heads drawn as short chords. */
export function arcade(out: MeshBuilder, a: P2, b: P2, y0: number, height: number, n: number,
                       opts: { depth?: number; colour?: Rgb; material?: Surface; shade?: Rgb } = {}): void {
  const c = opts.colour ?? [0.85, 0.83, 0.77]
  const tag = surfaceTag(opts.material ?? 'ashlar')
  const shade = opts.shade ?? [0.12, 0.12, 0.13]
  const d = opts.depth ?? 0.4
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  // the direction it FACES, not the direction it runs — see colonnade above
  const ang = Math.atan2(nx, nz)
  const bay = L / n
  for (let i = 0; i <= n; i++) {
    const u = i * bay
    boxAlong(out, a.x + tx * u + nx * d / 2, y0 + height / 2, a.z + tz * u + nz * d / 2, bay * 0.14, height / 2, d / 2, ang, c, tag)
  }
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * bay
    const x = a.x + tx * u
    const z = a.z + tz * u
    // the opening, and the arch over it as a few chords
    boxAlong(out, x + nx * d * 0.2, y0 + height * 0.36, z + nz * d * 0.2, bay * 0.35, height * 0.36, d * 0.2, ang, shade, 0)
    const R = bay * 0.36
    for (let k = 0; k < 5; k++) {
      const t0 = (Math.PI * (k + 0.5)) / 5
      boxAlong(out, x + Math.cos(t0) * R * tx + nx * d / 2, y0 + height * 0.72 + Math.sin(t0) * R * 0.8,
        z + Math.cos(t0) * R * tz + nz * d / 2, bay * 0.07, bay * 0.07, d / 2, ang, c, tag)
    }
  }
}

/** Quoins up a corner of the ring: alternating long and short blocks, as a stone building's corners are. */
export function quoins(out: MeshBuilder, at: P2, heading: number, y0: number, y1: number, colour: Rgb, material: Surface = 'ashlar'): void {
  const tag = surfaceTag(material)
  for (let y = y0, i = 0; y < y1; y += 0.65, i++) {
    const w = i % 2 === 0 ? 0.85 : 0.5
    boxAlong(out, at.x, y + 0.3, at.z, w, 0.3, 0.55, heading, colour, tag)
  }
}

/**
 * A cupola or dome on a point (a corner tower, a bank's rotunda): an octagonal drum with its windows, and a dome
 * or a spire on top. (Hibernia Bank, the Golden Gate Theatre, the Humboldt.)
 */
export function cupola(out: MeshBuilder, at: P2, y0: number, r: number, opts: { drum?: number; dome?: number; colour?: Rgb;
  domeColour?: Rgb; material?: Surface; domeMaterial?: Surface; lantern?: boolean } = {}): void {
  const c = opts.colour ?? [0.86, 0.84, 0.78]
  const dc = opts.domeColour ?? [0.35, 0.55, 0.48]
  const dtag = surfaceTag(opts.domeMaterial ?? 'copper')
  const drum = opts.drum ?? r * 1.6
  const dome = opts.dome ?? r * 1.1
  const sides = 8
  const ring = (rr: number): P2[] => Array.from({ length: sides }, (_, k) => ({ x: at.x + Math.cos((k / sides) * Math.PI * 2) * rr, z: at.z + Math.sin((k / sides) * Math.PI * 2) * rr }))
  faceBand(out, ring(r), y0, y0 + drum, { kind: 'punched', wall: c, glass: [0.2, 0.22, 0.24], pitch: r * 0.8, floor: drum, solid: 0.55, material: opts.material ?? 'ashlar' })
  // the dome: courses of a quarter circle
  const courses = 5
  for (let k = 0; k < courses; k++) {
    const a0 = (k / courses) * (Math.PI / 2)
    const a1 = ((k + 1) / courses) * (Math.PI / 2)
    const r0 = ring(r * Math.cos(a0) + 0.01)
    const r1 = ring(r * Math.cos(a1) + 0.01)
    const y0d = y0 + drum + dome * Math.sin(a0)
    const y1d = y0 + drum + dome * Math.sin(a1)
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides
      out.quad([[r0[i].x, y0d, r0[i].z], [r0[j].x, y0d, r0[j].z], [r1[j].x, y1d, r1[j].z], [r1[i].x, y1d, r1[i].z]],
        [Math.cos(((i + 0.5) / sides) * Math.PI * 2), 0.4, Math.sin(((i + 0.5) / sides) * Math.PI * 2)], [[0, 0], [1, 0], [1, 1], [0, 1]], dc, dtag)
    }
  }
  if (opts.lantern !== false) {
    faceBand(out, ring(r * 0.28), y0 + drum + dome, y0 + drum + dome + r * 0.5, { kind: 'blank', wall: c, material: opts.material ?? 'ashlar' })
    box(out, at.x, y0 + drum + dome + r * 0.72, at.z, r * 0.06, r * 0.22, r * 0.06, dc, dtag)
  }
}

/**
 * A tower or spire standing on ONE point of the building — a church's corner bell tower, a campanile, a clock
 * tower — rather than over the whole footprint, which is all a `spire` crown can do. The shaft is square or
 * octagonal, with its belfry openings, and the spire tapers to a point with a finial.
 */
export function spireOn(out: MeshBuilder, at: P2, y0: number, r: number, shaft: number, spire: number,
                        opts: { colour?: Rgb; spireColour?: Rgb; material?: Surface; spireMaterial?: Surface; sides?: number; belfry?: boolean } = {}): void {
  const c = opts.colour ?? [0.86, 0.84, 0.78]
  const sc = opts.spireColour ?? [0.35, 0.4, 0.42]
  const stag = surfaceTag(opts.spireMaterial ?? 'tile')
  const sides = opts.sides ?? 4
  const ring = (rr: number): P2[] => Array.from({ length: sides }, (_, k) => {
    const a = ((k + 0.5) / sides) * Math.PI * 2
    return { x: at.x + Math.cos(a) * rr, z: at.z + Math.sin(a) * rr }
  })
  const shaftRing = ring(r)
  faceBand(out, shaftRing, y0, y0 + shaft, { kind: 'blank', wall: c, material: opts.material ?? 'ashlar' })
  if (opts.belfry !== false) {
    // the belfry: a tall opening on each face, just under the top of the shaft
    for (let i = 0; i < shaftRing.length; i++) {
      const e = edgeAt(shaftRing, i)
      boxAlong(out, e.mid.x + e.nx * 0.06, y0 + shaft - r * 1.1, e.mid.z + e.nz * 0.06, e.L * 0.28, r * 0.75, 0.06, e.heading, [0.12, 0.12, 0.14], 0)
    }
  }
  // the spire: the shaft's ring tapering to a point, and a finial on it
  const top = { x: at.x, z: at.z }
  for (let i = 0; i < shaftRing.length; i++) {
    const j = (i + 1) % shaftRing.length
    const a = shaftRing[i]
    const b = shaftRing[j]
    out.quad([[a.x, y0 + shaft, a.z], [b.x, y0 + shaft, b.z], [top.x, y0 + shaft + spire, top.z], [top.x, y0 + shaft + spire, top.z]],
      [(a.x + b.x) / 2 - at.x, spire / Math.max(1, r) * 0.2, (a.z + b.z) / 2 - at.z], [[0, 0], [1, 0], [1, 1], [0, 1]], sc, stag)
  }
  box(out, at.x, y0 + shaft + spire + r * 0.18, at.z, r * 0.05, r * 0.18, r * 0.05, sc, stag)
}

/** A pitched or hipped roof over a long strip (a shed, a theatre's auditorium), where an inset ring would collapse. */
export function stripRoof(out: MeshBuilder, ring: P2[], y: number, rise: number, colour: Rgb, material: Surface = 'tile'): void {
  const inner = insetRing(ring, Math.max(0.5, Math.min(6, rise)))
  const tag = surfaceTag(material)
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    out.quad([[ring[i].x, y, ring[i].z], [ring[j].x, y, ring[j].z], [inner[j].x, y + rise, inner[j].z], [inner[i].x, y + rise, inner[i].z]],
      [0, 0.8, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  }
  for (let i = 1; i < inner.length - 1; i++) {
    out.quad([[inner[0].x, y + rise, inner[0].z], [inner[i].x, y + rise, inner[i].z], [inner[i + 1].x, y + rise, inner[i + 1].z], [inner[0].x, y + rise, inner[0].z]],
      [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  }
}

/** A facade applied to ONE wall of the ring (the edge nearest a bearing), at an offset: a front of its own. */
export function faceOn(out: MeshBuilder, ring: P2[], edge: number, y0: number, y1: number, f: Face, offset = 0): void {
  const a = ring[edge % ring.length]
  const b = ring[(edge + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const nx = (b.z - a.z) / L
  const nz = -(b.x - a.x) / L
  faceBand(out, [{ x: a.x + nx * offset, z: a.z + nz * offset }, { x: b.x + nx * offset, z: b.z + nz * offset },
    { x: b.x + nx * (offset - 0.01), z: b.z + nz * (offset - 0.01) }, { x: a.x + nx * (offset - 0.01), z: a.z + nz * (offset - 0.01) }], y0, y1, f)
}

/** Which edge of the ring faces a bearing most squarely (0 = north, 90 = east): for `faceOn`. */
export function edgeFacing(ring: P2[], bearing = 180): number {
  const bx = Math.sin((bearing * Math.PI) / 180)
  const bz = Math.cos((bearing * Math.PI) / 180)
  let best = 0
  let score = -Infinity
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const s = ((b.z - a.z) / L) * bx + (-(b.x - a.x) / L) * bz + L * 0.02
    if (s > score) { score = s; best = i }
  }
  return best
}
