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
import { capPolygon, capPolygonWithHoles } from '../buildings.ts'
import { classicalColumn, type ColumnOrder, type ColumnTier } from './column.ts'

export { simplifyRing, insetRing }

/**
 * `sign()` is re-exported here because this is where a builder looks for signage, but it lives in
 * render/landmarks/signage.ts. It is the call to reach for FIRST for any name on a building: a real typeface
 * on one quad, instead of `signText`'s 3 x 5 block font (still right for a small painted name) or a word
 * spelled out of boxes (never right for anything).
 */
export { sign, FACES, type SignSpec, type SignPlace, type SignLighting, type Face as SignFace } from './signage.ts'

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
                          opts: { radius?: number; out?: number; colour?: Rgb; material?: Surface; entablature?: number;
                                  order?: ColumnOrder; tier?: ColumnTier; flutes?: boolean; trim?: Rgb
                                  frieze?: Frieze } = {}): void {
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
  // boxAlong wants the direction the entablature FACES, not the direction it runs: atan2(tx, tz) turned it a
  // quarter step and it came out as a bar jutting sideways out of the portico (seen on two civic buildings)
  const ang = Math.atan2(nx, nz)
  /*
   * The columns themselves are the shared primitive (render/landmarks/column.ts) — round, with entasis and a
   * capital of its order — where this used to draw three SQUARE BOXES per column. The far tier costs FEWER
   * triangles than those boxes did, so a street of bank fronts got cheaper as well as better; the tier follows
   * the column's height unless the caller names one.
   */
  for (let i = 0; i < n; i++) {
    const u = ((i + 0.5) / n) * L
    const x = a.x + tx * u + nx * o
    const z = a.z + tz * u + nz * o
    // + 0.2 so the abacus meets the entablature, whose underside is at y0 + height + 0.2 (the old square
    // capital poked 0.04 into it; a column stopping at y0 + height leaves the entablature floating)
    classicalColumn(out, x, z, y0, y0 + height + 0.24, r, c, {
      order: opts.order, tier: opts.tier, tag, heading: ang, flutes: opts.flutes, trim: opts.trim,
    })
  }
  // the entablature over them, articulated by its order
  const mx = a.x + tx * (L / 2) + nx * o
  const mz = a.z + tz * (L / 2) + nz * o
  boxAlong(out, mx, y0 + height + ent / 2 + 0.2, mz, L / 2, ent / 2, o * 0.8, ang, c, tag)
  /*
   * The frieze follows the ORDER unless the caller names one — so an existing call that already said
   * `order: 'doric'` gets its triglyphs for nothing. It is gated on the cost tier: `tier: 'far'` is the
   * explicit cheap path (a tuscan slab, 28 triangles a column, a whole street of bank fronts) and must not
   * silently acquire 2n+1 triglyphs. That is the same bargain column.ts makes in #97.
   */
  const frieze = opts.frieze ?? (opts.tier === 'far' ? 'plain' : friezeFor(opts.order))
  entablature(out, a, b, y0 + height + 0.2, ent, o * 1.8, n, { colour: c, tag, frieze })
}

/** The courses an entablature is articulated with: what a rider actually tells the orders apart by. */
export type Frieze = 'plain' | 'dentil' | 'triglyph' | 'modillion'

/** The frieze an order wears when the caller does not say: the canonical pairing. */
export const friezeFor = (order?: ColumnOrder): Frieze =>
  order === 'doric' ? 'triglyph' : order === 'ionic' ? 'dentil' : order === 'corinthian' ? 'modillion' : 'plain'

/**
 * The ORNAMENT on an entablature already drawn as a plain band from `a` to `b`: the little blocks under its
 * cornice that are what distinguishes the orders from across a street. Draws FACING +z (`heading` is the
 * direction the front faces, the `boxAlong`/`edgeAt` convention), so no rotation correction applies.
 *
 *   `dentil`     a close row of small square teeth — Ionic, and most 1900s cornices
 *   `triglyph`   grooved blocks over each column and each gap, with plain metopes between — Doric
 *   `modillion`  fewer, deeper scrolled brackets standing well proud — Corinthian, and a bracketed cornice
 *
 * `bays` is the number of columns beneath, which is what a triglyph rhythm is set out from; pass 0 when
 * there are none (a cornice on a plain wall) and the rhythm follows the length instead.
 */
export function entablature(out: MeshBuilder, a: P2, b: P2, y0: number, height: number, front: number, bays: number,
                            opts: { colour?: Rgb; tag?: number; frieze?: Frieze } = {}): void {
  const f = opts.frieze ?? 'plain'
  if (f === 'plain') return
  const c = opts.colour ?? [0.86, 0.84, 0.78]
  const tag = opts.tag ?? 0
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  if (L < 0.5 || height < 0.35) return
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const ang = Math.atan2(nx, nz)
  /** a block straddling the entablature's front face, standing `hz` proud of it */
  const put = (u: number, y: number, hx: number, hy: number, hz: number): void =>
    boxAlong(out, a.x + tx * u + nx * front, y, a.z + tz * u + nz * front, hx, hy, hz, ang, c, tag)
  if (f === 'dentil') {
    // teeth just under the cornice, at about half their own width apart
    const w = Math.min(0.26, height * 0.22)
    const n = Math.max(2, Math.round(L / (w * 3)))
    const y = y0 + height * 0.74
    for (let k = 0; k < n; k++) put(((k + 0.5) / n) * L, y, w / 2, height * 0.1, w * 0.55)
    return
  }
  if (f === 'modillion') {
    // brackets: fewer, deeper, and carrying the cornice rather than decorating it
    const n = Math.max(2, Math.round(L / Math.max(1.1, height * 1.5)))
    const y = y0 + height * 0.7
    for (let k = 0; k < n; k++) put(((k + 0.5) / n) * L, y, Math.min(0.22, height * 0.2), height * 0.18, Math.min(0.45, height * 0.35))
    return
  }
  // triglyphs: one over every column and one over every gap, so 2 × bays of them along the run
  const n = Math.max(2, bays > 0 ? bays * 2 : Math.round(L / Math.max(1, height * 1.1)))
  const w = Math.min(height * 0.2, (L / n) * 0.34)
  const y = y0 + height * 0.52
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * L
    put(u, y, w, height * 0.26, 0.1)
    // the three grooves, as two raised fillets standing on the block
    for (const s of [-1, 1]) put(u + s * w * 0.42, y, w * 0.13, height * 0.26, 0.17)
  }
}

/**
 * A DENTIL (or modillion) course round a whole ring, for a cornice that has no colonnade under it — the line
 * of little blocks beneath the Curb Exchange's cornice, and under most pre-war ones. Faces +z per edge.
 */
export function dentilCourse(out: MeshBuilder, ring: P2[], y: number, height: number, front: number,
                             colour: Rgb, material: Surface = 'ashlar', frieze: Frieze = 'dentil'): void {
  const tag = surfaceTag(material)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    entablature(out, e.a, e.b, y, height, front, 0, { colour, tag, frieze })
  }
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
                       opts: { depth?: number; colour?: Rgb; material?: Surface; shade?: Rgb;
                               piers?: boolean; order?: ColumnOrder; tier?: ColumnTier; trim?: Rgb } = {}): void {
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
  /*
   * The piers. An arcade of this kind — the Ferry Building's, the Palace of Fine Arts', a park loggia — stands
   * on COLUMNS with the arches springing off their capitals, so that is the default now: the shared primitive
   * (column.ts) up to the springing, then a short impost block carrying the arch. `piers: true` keeps the old
   * rectangular piers for an arcade that really is a wall pierced by arches.
   */
  const spring = y0 + height * 0.72
  for (let i = 0; i <= n; i++) {
    const u = i * bay
    const px = a.x + tx * u + nx * d / 2
    const pz = a.z + tz * u + nz * d / 2
    if (opts.piers) {
      boxAlong(out, px, y0 + height / 2, pz, bay * 0.14, height / 2, d / 2, ang, c, tag)
      continue
    }
    classicalColumn(out, px, pz, y0, spring, bay * 0.13, c,
      { order: opts.order, tier: opts.tier, tag, heading: ang, trim: opts.trim })
    boxAlong(out, px, (spring + y0 + height) / 2, pz, bay * 0.14, (y0 + height - spring) / 2, d / 2, ang, c, tag)
  }
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * bay
    const x = a.x + tx * u
    const z = a.z + tz * u
    /*
     * The opening up to the springing, and then the ARCH HEAD FILLED (BUGS.md #96). This used to be five little
     * chord boxes floating over a rectangular hole: the tympanum above the springing was never filled, so at
     * every scale and with every argument the part rendered as a picket fence over black slots — which is why
     * E9's three correctly-identified arcades all came out wrong. The head is now a fan of quads in the shade
     * colour, in the plane of the opening, with an archivolt of voussoirs round its rim in the wall's stone.
     */
    const halfW = bay * 0.35
    boxAlong(out, x + nx * d * 0.2, y0 + (spring - y0) / 2, z + nz * d * 0.2, halfW, (spring - y0) / 2, d * 0.2, ang, shade, 0)
    // a wide low arcade goes segmental rather than poking through the entablature above it
    const rise = Math.min(halfW, (y0 + height - spring) * 0.92)
    const seg = 8
    const P = (u: number, y: number, o: number): [number, number, number] => [x + tx * u + nx * o, y, z + tz * u + nz * o]
    const o0 = d * 0.2
    for (let k = 0; k < seg; k++) {
      const a0 = Math.PI * (k / seg)
      const a1 = Math.PI * ((k + 1) / seg)
      // a fan from the springing line up over the head: two triangles' worth as one quad per segment
      out.quad([P(-halfW * Math.cos(a0), spring, o0), P(-halfW * Math.cos(a1), spring, o0),
        P(-halfW * Math.cos(a1), spring + rise * Math.sin(a1), o0), P(-halfW * Math.cos(a0), spring + rise * Math.sin(a0), o0)],
      [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], shade, 0)
    }
    // the archivolt: short voussoir blocks following the rim, in the wall's stone, standing in the wall plane
    for (let k = 0; k < seg; k++) {
      const am = Math.PI * ((k + 0.5) / seg)
      const u = -halfW * Math.cos(am)
      const yv = spring + rise * Math.sin(am)
      boxAlong(out, x + tx * u + nx * d * 0.5, yv, z + tz * u + nz * d * 0.5,
        Math.max(0.12, (Math.PI * halfW) / (seg * 2.1)), Math.max(0.12, rise * 0.1), d / 2, ang, c, tag)
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

/* ------------------------------------------------------------------ the four shape operations (2026-09-23)
 *
 * `notch`, `vault`, `rake` and `deckCut` — asked for after the ICA and YBCA runs, where the missing thing was
 * a SHAPE the grammar had no word for and every builder hand-wrote the ring. All four derive their sizes from
 * `towerRing(fit)` and the edge they are given: nothing here is a baked dimension, so a rebake with a
 * corrected footprint or a corrected height simply follows. All four DRAW FACING +z in the `edgeAt`/`boxAlong`
 * convention (0 faces +z, heading is the direction a wall FACES) — none of them takes the −z convention that
 * `pediment`, `pane`, `archedPane` and `courtFacade` use, so no caller needs a `+ Math.PI` correction.
 */

/** Where a `notch` bites: a corner of the ring, or a point along one of its edges. */
export type NotchAt = { corner: number } | { edge: number; along?: number }

const signedArea = (ring: P2[]): number => {
  let a = 0
  for (let i = 0; i < ring.length; i++) { const p = ring[i]; const q = ring[(i + 1) % ring.length]; a += p.x * q.z - q.x * p.z }
  return a / 2
}

/**
 * A BITE OUT OF THE FOOTPRINT: a rectangular piece removed from `ring`, at a corner or in the middle of an
 * edge, so the building is built round the void. A polygon operation — not a 3D boolean — and its result is
 * an ordinary ring, so `faceBand`, `facade()`, `tower()`, `dentilCourse` and every other part consume it
 * unchanged. That is what makes it worth having.
 *
 * The YBCA galleries' patio cut out of one corner; the Metreon's and a hundred podium blocks' set-back
 * corners; a light court opening off the street.
 *
 * `wide` and `deep` are FRACTIONS of the edges the bite is taken out of, never metres, so the cut scales with
 * the real footprint:
 *  - `{ corner: i }` takes `deep` of the edge ARRIVING at that corner and `wide` of the edge LEAVING it;
 *  - `{ edge: i, along }` takes `wide` of that edge's length, centred at `along` (0..1) along it, and goes
 *    `deep` of the same length inward.
 *
 * Returns the notched ring AND the polygon removed (`cut`, wound like the ring). The cut is what makes partial
 * height work — build `faceBand(notched, 0, y)` then `faceBand(full, y, H)` and cap `cut` at `y` for the
 * patio's floor — and it is exactly the hole `deckCut` wants for a court cut through a deck.
 *
 * It DRAWS NOTHING — it returns a ring — so it has no facing convention of its own; what you build on the
 * result follows that part's own convention (`faceBand` and `tower` face outward per edge).
 *
 * Corner and edge INDICES shift if OSM's outline is retraced from a different start vertex; `edgeFacing(ring,
 * bearing)` is the durable way to name the street side.
 *
 * Limits, plainly: the bite is a rectangle in the ring's own directions, it is not clipped against the rest of
 * the ring (a `deep` of 1 on a thin block cuts past the far wall), and the result is CONCAVE. `capPolygon` is
 * earcut-based and copes; `insetRing` is centroid-radial and does not — see the note in docs/KIT.md.
 */
export function notch(ring: P2[], at: NotchAt, opts: { wide?: number; deep?: number } = {}): { ring: P2[]; cut: P2[] } {
  const wide = Math.max(0.02, Math.min(0.9, opts.wide ?? 0.35))
  const deep = Math.max(0.02, Math.min(0.9, opts.deep ?? 0.35))
  const n = ring.length
  const out: P2[] = []
  let cut: P2[] = []
  if ('corner' in at) {
    const i = ((at.corner % n) + n) % n
    const p = ring[i]
    const prev = ring[(i - 1 + n) % n]
    const next = ring[(i + 1) % n]
    const d0 = Math.hypot(p.x - prev.x, p.z - prev.z) || 1
    const d1 = Math.hypot(next.x - p.x, next.z - p.z) || 1
    const u = { x: (prev.x - p.x) / d0, z: (prev.z - p.z) / d0 }      // back along the arriving edge
    const v = { x: (next.x - p.x) / d1, z: (next.z - p.z) / d1 }      // on along the leaving edge
    const a = d0 * deep
    const b = d1 * wide
    const p1 = { x: p.x + u.x * a, z: p.z + u.z * a }
    const p2 = { x: p.x + u.x * a + v.x * b, z: p.z + u.z * a + v.z * b }
    const p3 = { x: p.x + v.x * b, z: p.z + v.z * b }
    for (let k = 0; k < n; k++) {
      if (k === i) out.push(p1, p2, p3)
      else out.push(ring[k])
    }
    cut = [p, p3, p2, p1]
  } else {
    const i = ((at.edge % n) + n) % n
    const e = edgeAt(ring, i)
    const along = at.along ?? 0.5
    const u0 = Math.max(0, (along - wide / 2)) * e.L
    const u1 = Math.min(1, (along + wide / 2)) * e.L
    const d = deep * e.L
    const P = (u: number, o: number): P2 => ({ x: e.a.x + e.tx * u - e.nx * o, z: e.a.z + e.tz * u - e.nz * o })
    const q0 = P(u0, 0)
    const q1 = P(u0, d)
    const q2 = P(u1, d)
    const q3 = P(u1, 0)
    for (let k = 0; k < n; k++) {
      out.push(ring[k])
      if (k === i) out.push(q0, q1, q2, q3)
    }
    cut = [q0, q3, q2, q1]
  }
  if (signedArea(cut) * signedArea(ring) < 0) cut.reverse()
  return { ring: out, cut }
}

/**
 * A TRUE PARALLEL OFFSET of the ring: every edge moved `d` metres along its own outward normal (negative moves
 * it inward) and each vertex put back where its two moved edges cross. Unlike `insetRing`, which pulls every
 * point toward the centroid, this is correct on a CONCAVE ring — which is what `notch` produces. Use it for a
 * cornice, a parapet line or a setback on a notched footprint; `insetRing` inverts at the reflex corner (a
 * cornice there projects into the building and an inset pushes out into the void).
 *
 * `insetRing` is unchanged and still what ~400 builders call: this is the opt-in correct one.
 */
export function offsetRing(ring: P2[], d: number): P2[] {
  const n = ring.length
  const lines = ring.map((_, i) => {
    const e = edgeAt(ring, i)
    return { px: e.a.x + e.nx * d, pz: e.a.z + e.nz * d, tx: e.tx, tz: e.tz }
  })
  return ring.map((p, i) => {
    const l0 = lines[(i - 1 + n) % n]
    const l1 = lines[i]
    const det = l0.tx * l1.tz - l0.tz * l1.tx
    if (Math.abs(det) < 1e-6) return { x: l1.px, z: l1.pz }
    const s = ((l1.px - l0.px) * l1.tz - (l1.pz - l0.pz) * l1.tx) / det
    const q = { x: l0.px + l0.tx * s, z: l0.pz + l0.tz * s }
    // a very sharp corner sends the intersection to infinity; fall back rather than fly off
    return Math.hypot(q.x - p.x, q.z - p.z) > Math.abs(d) * 6 + 1 ? p : q
  })
}

/**
 * A ZIGGURAT: `count` boxes stacked on `ring`, each drawn in from the one below by its own `inset` (via
 * `offsetRing`, so it survives a notched footprint) and raised through its own `height`, with a callback to
 * dress each tier's walls however the caller likes (`faceBand`, hand-drawn slits, anything). This is the loop
 * a setback table wants instead of one hand-placed box per step — added for the Marriott Marquis
 * (`sf/marquis.ts`) and written generically because the Hyatt Regency (`market-east.ts`) is the other
 * Portman-era ziggurat in this city and may want the same loop later.
 *
 * Each tier's inset and y-range are DERIVED from the one below (cumulative offset, running height), so a
 * rebake with a corrected footprint or height follows by itself. Returns the final tier's ring and the total
 * height reached, for capping or crowning.
 */
export function setbackTiers(ring: P2[], y0: number, tiers: { height: number; inset?: number }[],
  face: (ring: P2[], y0: number, y1: number, i: number) => void): { ring: P2[]; y: number } {
  let cur = ring
  let y = y0
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i]
    if (t.inset) cur = offsetRing(cur, -t.inset)
    const y1 = y + t.height
    face(cur, y, y1, i)
    y = y1
  }
  return { ring: cur, y }
}

/** How far the ring reaches inward from one of its edges: a vault's or a well's depth, derived not typed. */
export function edgeDepth(ring: P2[], edge: number): number {
  const e = edgeAt(ring, edge)
  let d = 0
  for (const p of ring) d = Math.max(d, -((p.x - e.a.x) * e.nx + (p.z - e.a.z) * e.nz))
  return d || e.L * 0.5
}

/**
 * A BARREL VAULT on an edge: `count` half-cylinders sitting on or above the wall, optionally glazed on the
 * end faces. A strip of quads swept along the axis and a fan at each end — not a lathe — so three of them
 * cost about 200 triangles.
 *
 * The YBCA galleries' three glazed barrel vaults clustered at one end of the frontage, which are that
 * building's whole silhouette; Crocker Galleria's barrel-vaulted glass arcade (one vault, `run: 'along'`).
 *
 * Everything is derived from the edge: the span is `from`..`to` as fractions of its length, the depth defaults
 * to how far the ring reaches inward from it (`edgeDepth`), each vault's width is the span divided by
 * `count`, and the radius is half that width. `rise` is a FRACTION of the radius — 1 is semicircular, less is
 * segmental. Drawn facing +z per quad (radial normals outward), no rotation convention to correct.
 *
 *  - `run: 'across'` (the default) — axes perpendicular to the edge, running inward, so the glazed ends face
 *    the street and the vaults stand side by side along the frontage. This is YBCA.
 *  - `run: 'along'`  — axes along the edge; `count` then divides the depth, giving parallel vaults one behind
 *    the other. This is Crocker with `count: 1`.
 */
export function vault(out: MeshBuilder, ring: P2[], edge: number, y: number, opts: {
  count?: number; run?: 'across' | 'along'; from?: number; to?: number; depth?: number; rise?: number;
  colour?: Rgb; material?: Surface; glass?: Rgb; ends?: 'glazed' | 'solid'; segments?: number
} = {}): void {
  const e = edgeAt(ring, edge)
  const count = Math.max(1, Math.round(opts.count ?? 1))
  const run = opts.run ?? 'across'
  const from = Math.max(0, Math.min(1, opts.from ?? 0))
  const to = Math.max(from + 0.02, Math.min(1, opts.to ?? 1))
  const depth = opts.depth ?? edgeDepth(ring, edge)
  const colour = opts.colour ?? [0.72, 0.72, 0.74]
  const glass = opts.glass ?? [0.55, 0.68, 0.72]
  const glazed = (opts.ends ?? 'glazed') === 'glazed'
  const tag = surfaceTag(opts.material ?? 'metal')
  const gtag = surfaceTag('glass')
  const seg = Math.max(4, Math.round(opts.segments ?? 8))
  /** a point in the edge's frame: `u` metres along it from `a`, `w` metres INWARD, at height `h` */
  const P = (u: number, w: number, h: number): [number, number, number] =>
    [e.a.x + e.tx * u - e.nx * w, h, e.a.z + e.tz * u - e.nz * w]
  const spanU: [number, number] = [from * e.L, to * e.L]
  for (let k = 0; k < count; k++) {
    // the vault's own box in the edge frame: [u0,u1] along the wall, [w0,w1] inward
    let u0: number, u1: number, w0: number, w1: number
    if (run === 'across') {
      const wid = (spanU[1] - spanU[0]) / count
      u0 = spanU[0] + k * wid
      u1 = u0 + wid
      w0 = 0
      w1 = depth
    } else {
      u0 = spanU[0]
      u1 = spanU[1]
      const wid = depth / count
      w0 = k * wid
      w1 = w0 + wid
    }
    // the section is a half circle across the SHORT direction; the axis runs along the other
    const acrossIsU = run === 'across'
    const half = (acrossIsU ? u1 - u0 : w1 - w0) / 2
    const rise = half * (opts.rise ?? 1)
    const cAcross = acrossIsU ? (u0 + u1) / 2 : (w0 + w1) / 2
    const axis: [number, number] = acrossIsU ? [w0, w1] : [u0, u1]
    /** a point on the section at angle `t` (0..π), on the axis at `s` */
    const S = (t: number, s: number): [number, number, number] => {
      const off = cAcross - half * Math.cos(t)
      const h = y + rise * Math.sin(t)
      return acrossIsU ? P(off, s, h) : P(s, off, h)
    }
    // the barrel: one quad per segment, its normal radial and outward
    for (let i = 0; i < seg; i++) {
      const t0 = (Math.PI * i) / seg
      const t1 = (Math.PI * (i + 1)) / seg
      const tm = (t0 + t1) / 2
      const rx = -Math.cos(tm)
      const ry = Math.sin(tm)
      const nrm: [number, number, number] = acrossIsU
        ? [e.tx * rx, ry, e.tz * rx]
        : [-e.nx * rx, ry, -e.nz * rx]
      out.quad([S(t0, axis[0]), S(t1, axis[0]), S(t1, axis[1]), S(t0, axis[1])], nrm,
        [[i / seg, 0], [(i + 1) / seg, 0], [(i + 1) / seg, 1], [i / seg, 1]], colour, tag)
    }
    // the two end faces: a fan of quads off the springing line, glazed or solid
    const endC = glazed ? glass : colour
    const endTag = glazed ? gtag : tag
    for (const [s, sgn] of [[axis[0], -1], [axis[1], 1]] as const) {
      const nrm: [number, number, number] = acrossIsU
        ? [e.nx * -sgn, 0, e.nz * -sgn]
        : [e.tx * sgn, 0, e.tz * sgn]
      for (let i = 0; i < seg; i++) {
        const t0 = (Math.PI * i) / seg
        const t1 = (Math.PI * (i + 1)) / seg
        const b0 = S(t0, s)
        const b1 = S(t1, s)
        out.quad([[b0[0], y, b0[2]], [b1[0], y, b1[2]], b1, b0], nrm,
          [[i / seg, 0], [(i + 1) / seg, 0], [(i + 1) / seg, 1], [i / seg, 1]], endC, endTag)
      }
    }
  }
}

/**
 * A LEANING WALL WITH A FLAT TOP — not a sloping roof. One or more edges of the building are battered inward
 * or outward from base to parapet while the roof stays horizontal: the YBCA theatre ("a rectangle with one
 * side sloped steeply down"), and the same shape in a hundred modern auditoria and civic halls.
 *
 * Built as a LOFT, which is what makes the mitres right: the top ring is the base ring with the chosen edges'
 * supporting lines offset along their outward normals, and every top vertex is the intersection of its two
 * neighbouring lines. So an upright wall next to a leaning one comes out as the correct trapezoid, two
 * adjoining raked edges meet on a proper hip, and nothing has to be special-cased. Every wall is one quad
 * with its normal from the cross product, drawn facing outward (+z convention).
 *
 * `angle` is degrees from vertical — positive leans OUT, negative batters IN — so the lean is derived from the
 * wall's own height (`lean = tan(angle) · (y1 − y0)`) and nothing is typed in metres. `lean` in metres is
 * there for the case where a photograph gives you the top offset directly.
 *
 * Returns the TOP RING: cap it, crown it, or `faceBand` a parapet on it. Pass `roof` and it caps it for you.
 *
 * Limits, plainly: the walls are flat colour + surface, not a `Face` — no windows are cut into a raked wall
 * (draw them with `faceOn` at a small proud offset if you need them, accepting that they stay vertical), and
 * a lean steep enough to turn an edge inside out (past its neighbours' intersection) is not detected.
 */
export function rake(out: MeshBuilder, ring: P2[], edge: number | number[], y0: number, y1: number, opts: {
  angle?: number; lean?: number; colour?: Rgb; material?: Surface; roof?: Rgb
} = {}): P2[] {
  const edges = new Set((Array.isArray(edge) ? edge : [edge]).map((i) => ((i % ring.length) + ring.length) % ring.length))
  const colour = opts.colour ?? [0.8, 0.78, 0.74]
  const tag = surfaceTag(opts.material ?? 'concrete')
  const d = opts.lean ?? Math.tan(((opts.angle ?? 12) * Math.PI) / 180) * (y1 - y0)
  const n = ring.length
  // each edge's supporting line, offset outward by the lean where it is raked
  const lines = ring.map((_, i) => {
    const e = edgeAt(ring, i)
    const o = edges.has(i) ? d : 0
    return { px: e.a.x + e.nx * o, pz: e.a.z + e.nz * o, tx: e.tx, tz: e.tz }
  })
  const top: P2[] = ring.map((p, i) => {
    const l0 = lines[(i - 1 + n) % n]
    const l1 = lines[i]
    const det = l0.tx * l1.tz - l0.tz * l1.tx
    if (Math.abs(det) < 1e-6) return { x: p.x + (edges.has(i) ? l1.px - ring[i].x : 0), z: p.z }
    const s = ((l1.px - l0.px) * l1.tz - (l1.pz - l0.pz) * l1.tx) / det
    return { x: l0.px + l0.tx * s, z: l0.pz + l0.tz * s }
  })
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const a = ring[i]
    const b = ring[j]
    const A = top[i]
    const B = top[j]
    // the wall's outward normal from the cross product of its own two edges, so a leaning wall is lit as one
    const e1 = [b.x - a.x, 0, b.z - a.z]
    const e2 = [A.x - a.x, y1 - y0, A.z - a.z]
    const nx = e1[1] * e2[2] - e1[2] * e2[1]
    const ny = e1[2] * e2[0] - e1[0] * e2[2]
    const nz = e1[0] * e2[1] - e1[1] * e2[0]
    const l = Math.hypot(nx, ny, nz) || 1
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [B.x, y1, B.z], [A.x, y1, A.z]],
      [-nx / l, -ny / l, -nz / l], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  }
  if (opts.roof) capPolygon(out, top, y1, opts.roof, tag)
  return top
}

/**
 * A CUT-OUT AT DECK LEVEL: a void through a raised surface — a light well, a stair opening, a court cut down
 * through a deck to the level below. Call it INSTEAD OF `capPolygon` for that deck: it draws the deck with the
 * hole in it (earcut with a hole, so a concave deck is fine), the well's walls, and a floor at the bottom.
 *
 * Drawn FACING +z in the `edgeAt`/`boxAlong` convention — the well's walls face into the void, the deck and
 * the floor face up, the kerb faces both ways — so no caller needs a `+ Math.PI` correction.
 *
 * The skyparks (docs/SKYPARKS.md): the Moscone decks and Salesforce Park. YBCA's patio, whose "large boat
 * pitched down glass structure letting light in to the lower level" is this plus `rooflight`.
 *
 * The hole is any ring, and the two natural sources are both derived rather than typed: `insetRing(ring, d)`
 * for a light well in the middle of the deck, and the `cut` polygon `notch` returns for a court in a corner —
 * the same polygon that shaped the building gives the hole through its deck.
 *
 * `depth` defaults to one storey (3.6 m). `kerb` puts a low parapet round the lip, which is what stops a rider
 * riding into it. `rooflight` covers the hole in glass: `'vault'` reuses `vault()` over the hole's longest
 * edge, `'pitched'` is a ridged glass roof (`stripRoof`) — the boat pitched down over YBCA's patio.
 *
 * Limits, plainly: one hole per call (call it again for a second one and the deck is drawn twice — pass
 * `deck: null` on the later calls), the hole is not clipped to the deck, and the well's walls are flat colour
 * rather than a `Face`.
 */
export function deckCut(out: MeshBuilder, ring: P2[], y: number, hole: P2[], opts: {
  depth?: number; deck?: Rgb | null; wall?: Rgb; floor?: Rgb; material?: Surface; kerb?: number;
  rooflight?: 'vault' | 'pitched' | null; glass?: Rgb; rise?: number
} = {}): void {
  if (hole.length < 3) return
  const depth = opts.depth ?? 3.6
  const wall = opts.wall ?? [0.5, 0.5, 0.52]
  const tag = surfaceTag(opts.material ?? 'concrete')
  // the hole wound AGAINST the deck, both so earcut reads it as a hole and so faceBand's (tz, −tx) normals
  // face INTO the well rather than out through the deck's own slab
  const inner = signedArea(hole) * signedArea(ring) > 0 ? [...hole].reverse() : [...hole]
  if (opts.deck !== null) capPolygonWithHoles(out, [ring, inner], y, opts.deck ?? [0.62, 0.6, 0.58], tag)
  faceBand(out, inner, y - depth, y, { kind: 'blank', wall, material: opts.material ?? 'concrete' })
  capPolygon(out, inner, y - depth, opts.floor ?? [0.55, 0.54, 0.52], tag)
  if (opts.kerb) {
    // the kerb round the lip, BOTH faces and a top: `inner` alone gives one face pointing into the well, and
    // the city's meshes cull back faces, so the near lip simply would not be there from the deck side (#23)
    const outer = signedArea(inner) * signedArea(ring) > 0 ? [...inner].reverse() : inner
    const lip = offsetRing(outer, -Math.min(0.35, (opts.kerb ?? 0.9) * 0.4))
    faceBand(out, outer, y, y + opts.kerb, { kind: 'blank', wall, material: opts.material ?? 'concrete' })
    faceBand(out, inner, y, y + opts.kerb, { kind: 'blank', wall, material: opts.material ?? 'concrete' })
    for (let i = 0; i < outer.length; i++) {
      const a = outer[i]
      const b = outer[(i + 1) % outer.length]
      const A = lip[i]
      const B = lip[(i + 1) % lip.length]
      out.quad([[a.x, y + opts.kerb, a.z], [b.x, y + opts.kerb, b.z], [B.x, y + opts.kerb, B.z], [A.x, y + opts.kerb, A.z]],
        [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], wall, tag)
    }
  }
  const glass = opts.glass ?? [0.55, 0.68, 0.72]
  if (opts.rooflight === 'vault') {
    const h = signedArea(hole) > 0 ? hole : [...hole].reverse()
    vault(out, h, longestEdge(h), y + (opts.kerb ?? 0), { run: 'along', count: 1, glass, colour: glass, material: 'glass', rise: opts.rise ?? 0.6 })
  } else if (opts.rooflight === 'pitched') {
    const h = signedArea(hole) > 0 ? hole : [...hole].reverse()
    const L = edgeAt(h, longestEdge(h)).L
    stripRoof(out, h, y + (opts.kerb ?? 0), L * (opts.rise ?? 0.12), glass, 'glass')
  }
}

/* ------------------------------------------------------------- stairs and railings (2026-09-23)
 *
 * The kit's first BETWEEN-LEVELS parts. Every other part takes one `y`; `stair` takes `y0 → y1` and DERIVES
 * the step count from a RISER HEIGHT, because a caller who types a step count or a tread in metres gets
 * plates: that is exactly how the YBCA theatre's frontage came out as floating louvres, and how Yerba Buena's
 * terrace planters and its esplanade were hand-built three separate times.
 *
 * Owner, 2026-09-23: *"probably MOST buildings older than 50 years have a stairway entrance of some kind"* —
 * so this is a universal element, not a Yerba Buena special case.
 *
 * Both DRAW FACING +z in the `edgeAt`/`boxAlong` convention (0 faces +z, heading is the direction a surface
 * FACES): the flight is built in its own baseline frame from `edgeAt`-style tangent and normal, risers face
 * along the normal AWAY from the climb, treads face up, and no caller needs a `+ Math.PI` correction.
 */

/**
 * What a flight gives back. `bottom` and `top` are its foot and head edges as polylines, so it CHAINS — a
 * walkway off `top`, a `railing` on either, another flight off one — and so a later routing pass can find
 * level connectors. The DERIVED numbers come back with them because the caller cannot type them in: `run` is
 * what a plain `ramp` beside the flight must match to arrive at the same place, which is the stair-and-walk
 * pair the Folsom monumental stair is (docs/MOSCONE-SOUTH.md).
 */
export interface StairResult { bottom: P2[]; top: P2[]; run: number; steps: number; riser: number; tread: number }

/** What the treads are made of. `'alternate'` — a grass strip, then a paved strip — IS the Yerba Buena esplanade. */
export type TreadKind = 'paving' | 'grass' | 'planted' | 'alternate'

/** Which side of the flight carries a rail, named by the baseline's ends: `'left'` is the `a` end, `'right'` the `b` end. */
export type StairRail = 'none' | 'left' | 'right' | 'both'

/**
 * A STEPPED FLIGHT BETWEEN TWO LEVELS, drawn as ONE SOLID.
 *
 * `a`→`b` is a baseline segment in plan; the flight occupies the **+normal** side of it (`nx, nz` in the
 * `edgeAt` sense, `(tz, −tx)`), reaching `run` metres out. With the default `anchor: 'bottom'` the baseline is
 * the flight's FOOT at `y0` and it climbs to `y1` at `+n·run`, its risers facing `−n` — the way the climber
 * sees them. With `anchor: 'top'` the baseline is the flight's HEAD at `y1` and it descends to `y0` at
 * `+n·run`, risers facing `+n`: that is the form a building entrance wants, where what you know is the wall
 * edge (whose normal points at the street) and the steps come down off it.
 *
 * **The step count is DERIVED, never typed.** `riser` is the comfortable rise (0.15 m typical; lower and
 * deeper for an esplanade), `count = round((y1 − y0) / riser)` and the real riser is the remainder shared out,
 * so a rebake at a corrected height simply follows. The tread depth is `run / count`, and `run` itself derives
 * from the riser by the going rule `2R + T ≈ 0.63`, never shallower than 2.5 times the riser — which is what
 * keeps a terrace TIER a tier rather than a step — unless a photograph gives you the projection directly.
 * (On Yerba Buena's esplanade that rule gives 1.67 m from its 0.67 m rise, against the 1.7 m that file
 * measured off the photograph — within 2%, and derived rather than typed.)
 * A caller cannot ask for a step count or a tread in metres: that derivation is the part.
 *
 * **It is SOLID.** The stepped profile is extruded as one strip (riser + tread = 4 triangles a step) and then
 * CLOSED: a vertical quad per step on each end, a base at `y0` underneath, and a back face at the head. The
 * reported failure was daylight passing under and between the treads, which is what a run of separate boxes or
 * an unclosed strip looks like from a rider's eye. 8 triangles a step plus 4 closures — no boxes per step.
 *
 * `from`/`to` are FRACTIONS along `a`→`b`, the same convention as `vault`, because the theatre's steps wrongly
 * spanned the whole frontage: a flight's extent has to be derivable from the edge it sits on.
 *
 * `splay` is a FRACTION of the flight's width added at the FOOT and tapering to nothing at the head — the
 * standard civic/institutional entrance flight, wider where it meets the pavement. A CORNER stair (a landing
 * that turns) is deliberately not here; see docs/KIT.md for what it would need. A FAN is not a splayed
 * straight flight — it is `arcStair`, below.
 *
 * `preset` sets the defaults and is how the two Yerba Buena shapes are asked for rather than by new functions:
 *  - `'esplanade'` — low risers, very deep `'alternate'` treads: a grass strip, then a paved strip.
 *  - `'terrace'`   — deep `'planted'` treads with concrete riser faces, a planter tier rather than a step.
 * Planted treads deeper than 1.2 m are pushed to `out.decks` (`MeshBuilder.decks`, docs/SKYPARKS.md) so the
 * deck-planting path plants them; a shallower tread is coloured and not planted, because a shrub on a 0.4 m
 * tread reads wrong.
 *
 * Returns the flight's FOOT and HEAD edges as two-point polylines, so it CHAINS — `railing(out, s.top, y1)`,
 * a walkway off `s.top`, another flight off it — and so a later routing pass can find level connectors.
 */
export function stair(out: MeshBuilder, a: P2, b: P2, y0: number, y1: number, opts: {
  riser?: number; run?: number; from?: number; to?: number; splay?: number; landing?: number
  tread?: TreadKind; rail?: StairRail; railKind?: 'posts' | 'solid' | 'glass'
  anchor?: 'bottom' | 'top'; preset?: 'esplanade' | 'terrace'
  colour?: Rgb; material?: Surface; treadColour?: Rgb; grass?: Rgb
} = {}): StairResult {
  const pre = opts.preset
  // the presets are DEFAULTS, so an explicit argument still wins
  const riser = Math.max(0.04, opts.riser ?? (pre === 'esplanade' ? 0.2 : pre === 'terrace' ? 0.45 : 0.15))
  const treadKind = opts.tread ?? (pre === 'esplanade' ? 'alternate' : pre === 'terrace' ? 'planted' : 'paving')
  const anchor = opts.anchor ?? 'bottom'
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const from = Math.max(0, Math.min(1, opts.from ?? 0))
  const to = Math.max(from + 0.02, Math.min(1, opts.to ?? 1))
  const u0 = from * L
  const u1 = to * L
  const rise = Math.max(0.05, y1 - y0)
  const count = Math.max(1, Math.round(rise / riser))
  const rA = rise / count
  // the going rule 2R + T ≈ 0.63 m: a deep tread for a low riser, which is what makes an esplanade an
  // esplanade rather than a staircase. A terrace's 0.45 m riser would go negative, so it gets its own floor.
  const deriveTread = pre === 'terrace' ? Math.max(1.8, rA * 4)
    : pre === 'esplanade' ? Math.max(1.2, rA * 2.5)
    : Math.max(0.26, 0.63 - 2 * rA, rA * 2.5)
  const td = opts.run !== undefined ? Math.max(0.1, opts.run / count) : deriveTread
  const runTotal = td * count
  const landing = anchor === 'top' ? 0 : Math.max(0, opts.landing ?? 0)
  const dir = anchor === 'bottom' ? 1 : -1
  const v00 = anchor === 'bottom' ? 0 : runTotal + landing
  const vTop = v00 + dir * runTotal
  const vBack = vTop + dir * landing
  const colour = opts.colour ?? [0.76, 0.75, 0.72]
  const tag = surfaceTag(opts.material ?? 'concrete')
  const paving = opts.treadColour ?? colour
  const grass = opts.grass ?? [0.42, 0.55, 0.3]
  // grass carries NO surface pattern (tag 0), the way every lawn cap in the city does
  const gtag = 0
  const splay = Math.max(0, opts.splay ?? 0)
  const ex = (splay * (u1 - u0)) / 2

  /** a point in the flight's own frame: `u` metres along the baseline from `a`, `v` metres along +n, at `h` */
  const P = (u: number, v: number, h: number): [number, number, number] =>
    [a.x + tx * u + nx * v, h, a.z + tz * u + nz * v]
  /** the flight's half-extents at `f`, the fraction from the FOOT: the splay dies away toward the head */
  const uL = (f: number): number => u0 - ex * (1 - f)
  const uR = (f: number): number => u1 + ex * (1 - f)
  const treadColourAt = (k: number): [Rgb, number] =>
    treadKind === 'grass' || (treadKind === 'alternate' && k % 2 === 0) ? [grass, gtag] : [paving, tag]

  for (let k = 0; k < count; k++) {
    const f0 = k / count
    const f1 = (k + 1) / count
    const vA = v00 + dir * (k * td)
    const vB = vA + dir * td
    const yb = y0 + k * rA
    const yt = y0 + (k + 1) * rA
    // the riser, facing away from the climb
    out.quad([P(uL(f0), vA, yb), P(uR(f0), vA, yb), P(uR(f0), vA, yt), P(uL(f0), vA, yt)],
      [-dir * nx, 0, -dir * nz], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
    // the tread, facing up
    const [tc, ttag] = treadColourAt(k)
    /*
     * THE NOSING: a narrow darker strip along the front lip of every tread (BUGS.md #213d).
     *
     * Seen from the HEAD of a flight — the view a stairway exists for, and the one Lyon Street's axis shot
     * takes — you see tread faces and almost no riser, so a flight whose treads are all one colour reads as
     * a blank RAMP however much the risers contrast. The nosing is what the eye reads as "step" from that
     * angle, and it is a real feature of a stone stair rather than a graphics trick.
     *
     * It is carved OUT of the tread rather than laid on top of it: same plane, no y offset, so the flight
     * still lands exactly on y1 and nothing can z-fight.
     */
    const nose = Math.min(0.07, td * 0.25)
    const vN = vA + dir * nose
    out.quad([P(uL(f0), vA, yt), P(uR(f0), vA, yt), P(uR(f0), vN, yt), P(uL(f0), vN, yt)],
      [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
    out.quad([P(uL(f0), vN, yt), P(uR(f0), vN, yt), P(uR(f1), vB, yt), P(uL(f1), vB, yt)],
      [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], tc, ttag)
    /*
     * A tread deep enough to be a planter is a DECK: recorded in the model's own frame so whoever places the
     * model turns it into planting, exactly as a skypark's roof is (docs/SKYPARKS.md). The Yerba Buena
     * terrace's tiers are this — they were hand-built as planters once already.
     */
    if (treadKind === 'planted' && td > 1.2) {
      const q = [P(uL(f0), vA, yt), P(uR(f0), vA, yt), P(uR(f1), vB, yt), P(uL(f1), vB, yt)]
      out.decks.push({ ring: q.map((p) => ({ x: p[0], z: p[2] })), y: yt })
    }
    // the two ENDS of this step: the quad that stops daylight coming through the flight sideways
    for (const sgn of [-1, 1] as const) {
      const ua = sgn < 0 ? uL(f0) : uR(f0)
      const ub = sgn < 0 ? uL(f1) : uR(f1)
      // in-plane direction along the (possibly splayed) end, crossed with up, then turned outward
      const dx = tx * (ub - ua) + nx * (vB - vA)
      const dz = tz * (ub - ua) + nz * (vB - vA)
      let ex2 = -dz
      let ez2 = dx
      if ((ex2 * tx + ez2 * tz) * sgn < 0) { ex2 = -ex2; ez2 = -ez2 }
      const el = Math.hypot(ex2, ez2) || 1
      out.quad([P(ua, vA, y0), P(ub, vB, y0), P(ub, vB, yt), P(ua, vA, yt)],
        [ex2 / el, 0, ez2 / el], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
    }
  }
  // the landing at the head, if any: one more flat tread, and the base and back below already cover it
  if (landing > 0) {
    out.quad([P(uL(1), vTop, y1), P(uR(1), vTop, y1), P(uR(1), vBack, y1), P(uL(1), vBack, y1)],
      [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], paving, tag)
    for (const sgn of [-1, 1] as const) {
      const u = sgn < 0 ? uL(1) : uR(1)
      out.quad([P(u, vTop, y0), P(u, vBack, y0), P(u, vBack, y1), P(u, vTop, y1)],
        [sgn * tx, 0, sgn * tz], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
    }
  }
  // the UNDERSIDE, at y0 — the unclosed one is the defect that only a camera below the flight shows
  out.quad([P(uL(0), v00, y0), P(uR(0), v00, y0), P(uR(1), vBack, y0), P(uL(1), vBack, y0)],
    [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  // the BACK face at the head, so the flight is not an open shell against whatever it abuts
  out.quad([P(uL(1), vBack, y0), P(uR(1), vBack, y0), P(uR(1), vBack, y1), P(uL(1), vBack, y1)],
    [dir * nx, 0, dir * nz], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)

  const foot: P2[] = [{ x: P(uL(0), v00, y0)[0], z: P(uL(0), v00, y0)[2] }, { x: P(uR(0), v00, y0)[0], z: P(uR(0), v00, y0)[2] }]
  const head: P2[] = [{ x: P(uL(1), vBack, y1)[0], z: P(uL(1), vBack, y1)[2] }, { x: P(uR(1), vBack, y1)[0], z: P(uR(1), vBack, y1)[2] }]

  // the flight's own rails, which SLOPE: `railing()` is level and is the wrong part for them
  const rail = opts.rail ?? 'none'
  if (rail !== 'none') {
    for (const sgn of [-1, 1] as const) {
      if (rail === 'left' && sgn > 0) continue
      if (rail === 'right' && sgn < 0) continue
      // the rail follows the nosings, foot first: one point per step plus the head
      const line: [number, number, number][] = []
      for (let k = 0; k <= count; k++) {
        const f = k / count
        line.push(P(sgn < 0 ? uL(f) : uR(f), v00 + dir * (k * td), y0 + k * rA))
      }
      slopedRail(out, line, opts.railKind ?? 'posts', tx * sgn, tz * sgn)
    }
  }
  return { bottom: foot, top: head, run: runTotal + landing, steps: count, riser: rA, tread: td }
}

/**
 * The sloped handrail up one side of a flight: posts and a swept square section, following `line` — the
 * nosings of every step, foot first. Dark, and in the flight's own end plane, never proud of it: BUGS.md
 * #134a is a pale vertical 0.34 m proud of its wall reading as a palisade. Shared by `stair` and `arcStair`,
 * because a rail that follows a fan stair's radial end is the same object as one up a straight flight.
 */
function slopedRail(out: MeshBuilder, line: [number, number, number][], kind: 'posts' | 'solid' | 'glass',
                    sx: number, sz: number): void {
  if (line.length < 2) return
  const DARKRAIL: Rgb = [0.17, 0.18, 0.21]
  const h = 1.05
  const r = 0.035
  const mtag = surfaceTag('metal')
  let L = 0
  for (let i = 1; i < line.length; i++) L += Math.hypot(line[i][0] - line[i - 1][0], line[i][2] - line[i - 1][2])
  // posts about every 1.6 m of going, DERIVED — and by dividing the run into bays rather than striding by a
  // fixed number of steps, so that a post always lands on BOTH ends. A stride leaves the rail ending in mid
  // air whenever the step count is not a multiple of it, which is the #134a class of fault exactly.
  const n = Math.max(1, Math.round(L / 1.6))
  const heading = Math.atan2(sz, -sx)
  if (kind !== 'solid') {
    for (let j = 0; j <= n; j++) {
      const p = line[Math.round((j * (line.length - 1)) / n)]
      boxAlong(out, p[0], p[1] + h / 2, p[2], 0.035, h / 2, 0.035, heading, DARKRAIL, mtag)
    }
  }
  /** the rail's square section swept from `a` to `b`, offset `du` sideways and `dy` up */
  const off = (p: [number, number, number], du: number, dy: number): [number, number, number] =>
    [p[0] + sx * du, p[1] + dy, p[2] + sz * du]
  for (let i = 1; i < line.length; i++) {
    const A: [number, number, number] = [line[i - 1][0], line[i - 1][1] + h, line[i - 1][2]]
    const B: [number, number, number] = [line[i][0], line[i][1] + h, line[i][2]]
    for (const [d0, d1] of [[[-r, r], [r, r]], [[r, r], [r, -r]], [[r, -r], [-r, -r]], [[-r, -r], [-r, r]]] as [number, number][][]) {
      const q = [off(A, d0[0], d0[1]), off(B, d0[0], d0[1]), off(B, d1[0], d1[1]), off(A, d1[0], d1[1])]
      const e1 = [q[1][0] - q[0][0], q[1][1] - q[0][1], q[1][2] - q[0][2]]
      const e2 = [q[3][0] - q[0][0], q[3][1] - q[0][1], q[3][2] - q[0][2]]
      const nm: [number, number, number] = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
      const l = Math.hypot(nm[0], nm[1], nm[2]) || 1
      out.quad(q as [[number, number, number], [number, number, number], [number, number, number], [number, number, number]],
        [nm[0] / l, nm[1] / l, nm[2] / l], [[0, 0], [1, 0], [1, 1], [0, 1]], DARKRAIL, mtag)
    }
    if (kind === 'solid' || kind === 'glass') {
      // the infill, drawn BOTH WAYS: the city culls back faces (BUGS.md #23) and a rail is seen from both sides
      const c: Rgb = kind === 'glass' ? [0.56, 0.66, 0.7] : [0.74, 0.73, 0.7]
      const itag = surfaceTag(kind === 'glass' ? 'glass' : 'concrete')
      const q: [number, number, number][] = [
        [line[i - 1][0], line[i - 1][1] + 0.05, line[i - 1][2]], [line[i][0], line[i][1] + 0.05, line[i][2]],
        [B[0], B[1] - r, B[2]], [A[0], A[1] - r, A[2]]]
      for (const sg of [-1, 1] as const) {
        out.quad(q as [[number, number, number], [number, number, number], [number, number, number], [number, number, number]],
          [sg * sx, 0, sg * sz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, itag)
      }
    }
  }
}

/**
 * A RAILING ALONG A POLYLINE at one height — standalone, because it appears on every raised edge the project
 * has: the Moscone decks, both Yerba Buena skybridges, the terrace walkway, the theatre ramp, and the head of
 * every `stair()` (pass the `top` it returns).
 *
 * `polyline` is an open run of points in plan (a ring works — pass it and close it yourself by repeating the
 * first point); `y` is the walking surface it stands on. Drawn facing +z per quad in the `edgeAt`/`boxAlong`
 * convention, and every piece is a CLOSED box, so it reads from both sides.
 *
 *  - `'posts'` — balusters and a top rail. **The posts are IN the rail plane and DARK.** BUGS.md #134a is
 *    precisely the other thing: `glazedFront()` drew pale mullions 0.34 m PROUD of the glass and a whole
 *    frontage read as a palisade of white poles. A fine repeated vertical is the easiest thing in the kit to
 *    get wrong, because the error is invisible in code and unmistakable at rider's eye height.
 *  - `'solid'` — a low concrete or stone parapet.
 *  - `'glass'` — a glass balustrade with a dark cap rail and dark posts in the glass plane.
 *
 * Spacing is DERIVED from the run's length (about 1.5 m, divided evenly so a post lands on each end), never a
 * typed count. `height` defaults to 1.05 m, which is what a handrail is.
 */
export function railing(out: MeshBuilder, polyline: P2[], y: number, opts: {
  kind?: 'posts' | 'solid' | 'glass'; height?: number; spacing?: number; colour?: Rgb; glass?: Rgb
  material?: Surface; thickness?: number
} = {}): void {
  if (polyline.length < 2) return
  const kind = opts.kind ?? 'posts'
  const h = Math.max(0.3, opts.height ?? 1.05)
  const DARKRAIL: Rgb = [0.17, 0.18, 0.21]
  const mtag = surfaceTag('metal')
  const cap = 0.05
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i]
    const b = polyline[i + 1]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.05) continue
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    const heading = Math.atan2(tz, -tx)
    const mid = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }
    if (kind === 'solid') {
      const t = opts.thickness ?? 0.22
      boxAlong(out, mid.x, y + h / 2, mid.z, L / 2, h / 2, t / 2, heading,
        opts.colour ?? [0.74, 0.73, 0.7], surfaceTag(opts.material ?? 'concrete'))
      continue
    }
    // the top rail, the whole length
    boxAlong(out, mid.x, y + h - cap / 2, mid.z, L / 2, cap / 2, 0.045, heading, opts.colour ?? DARKRAIL, mtag)
    if (kind === 'glass') {
      const t = opts.thickness ?? 0.03
      boxAlong(out, mid.x, y + (h - cap) / 2 + 0.04, mid.z, L / 2 - 0.02, (h - cap) / 2 - 0.04, t / 2, heading,
        opts.glass ?? [0.56, 0.66, 0.7], surfaceTag('glass'))
    }
    // the posts: spacing derived from the run, a post on each end, IN the plane and DARK
    const n = Math.max(1, Math.round(L / (opts.spacing ?? 1.5)))
    for (let k = 0; k <= n; k++) {
      const u = (k / n) * L
      boxAlong(out, a.x + tx * u, y + (h - cap) / 2, a.z + tz * u, 0.035, (h - cap) / 2, 0.035, heading, DARKRAIL, mtag)
    }
  }
}

/**
 * A CURVED FLIGHT: the same stepped solid swept round a CIRCULAR ARC, its treads radiating from `centre` as
 * concentric annular sectors and its climb RADIAL — outward from the baseline circle by default.
 *
 * Added 2026-09-23 for the Moscone South block (docs/MOSCONE-SOUTH.md), where the level changes are curved
 * rather than straight and are the thing that makes the park legible: *"two curved esplanades descend to the
 * lawn"*, *"a big curved walkway leaves the museum's second level and descends a curved esplanade"*, *"a grand
 * curved fan staircase sweeping up from a sunken circular plaza"*, and the Public Square's *"semicircular
 * amphitheatre of concentric stepped grass terraces"*. All four are this one shape: concentric treads, a
 * radial climb. A flight that spirals — treads radiating but rising AROUND the arc rather than across it — is
 * a different animal and is not here; see docs/KIT.md.
 *
 * It is a SIBLING of `stair()` rather than a mode of it, because every coordinate is different — `u` along a
 * baseline and `v` outward become an angle and a radius — while every DERIVATION is shared and identical:
 * the step count is `round((y1 − y0) / riser)`, the tread is `run / count`, `run` follows from the riser, and
 * the presets, the tread kinds, `anchor`, `landing`, `rail` and the `out.decks` push all behave as they do on
 * a straight flight. Same discipline, same defaults, same failure avoided: it is ONE SOLID, closed at the two
 * radial ends, underneath, and at the back.
 *
 * `radius` is the BASELINE circle — the plaza the fan stair stands round, the curved dividing wall the
 * esplanade descends from. `from` and `to` are fractions of a FULL TURN (the same convention as `vault`'s and
 * `stair()`'s fractions of an edge), so a 200° fan is `from: 0, to: 0.555` and the default is the whole
 * circle. `anchor` says whether that circle is the flight's foot (the default) or its head; `climb` says
 * whether the flight extends outward from it (the default) or inward — inward is the amphitheatre read from
 * its rim, outward is everything else.
 *
 * Returns the foot and head as POLYLINES round the arc, which is exactly what `railing()` takes.
 *
 * There is no `splay`: a fan's width is its arc, and widening it is what the arc already does.
 */
export function arcStair(out: MeshBuilder, centre: P2, radius: number, y0: number, y1: number, opts: {
  riser?: number; run?: number; from?: number; to?: number; landing?: number
  tread?: TreadKind; rail?: StairRail; railKind?: 'posts' | 'solid' | 'glass'
  anchor?: 'bottom' | 'top'; climb?: 'out' | 'in'; preset?: 'esplanade' | 'terrace'
  colour?: Rgb; material?: Surface; treadColour?: Rgb; grass?: Rgb; segments?: number
} = {}): StairResult {
  const pre = opts.preset
  const riser = Math.max(0.04, opts.riser ?? (pre === 'esplanade' ? 0.2 : pre === 'terrace' ? 0.45 : 0.15))
  const treadKind = opts.tread ?? (pre === 'esplanade' ? 'alternate' : pre === 'terrace' ? 'planted' : 'paving')
  const anchor = opts.anchor ?? 'bottom'
  const sgnR = (opts.climb ?? 'out') === 'out' ? 1 : -1
  const rise = Math.max(0.05, y1 - y0)
  const count = Math.max(1, Math.round(rise / riser))
  const rA = rise / count
  const deriveTread = pre === 'terrace' ? Math.max(1.8, rA * 4)
    : pre === 'esplanade' ? Math.max(1.2, rA * 2.5)
    : Math.max(0.26, 0.63 - 2 * rA, rA * 2.5)
  const td = opts.run !== undefined ? Math.max(0.1, opts.run / count) : deriveTread
  const runTotal = td * count
  const landing = Math.max(0, opts.landing ?? 0)
  const dir = anchor === 'bottom' ? 1 : -1
  const v00 = anchor === 'bottom' ? 0 : runTotal + landing
  const vTop = v00 + dir * runTotal
  const vBack = vTop + dir * landing
  const t0 = (opts.from ?? 0) * Math.PI * 2
  const t1 = Math.max(t0 + 0.02, (opts.to ?? 1) * Math.PI * 2)
  const whole = t1 - t0 >= Math.PI * 2 - 1e-6
  const colour = opts.colour ?? [0.76, 0.75, 0.72]
  const tag = surfaceTag(opts.material ?? 'concrete')
  const paving = opts.treadColour ?? colour
  const grass = opts.grass ?? [0.42, 0.55, 0.3]
  // the arc is subdivided by its own LENGTH at the outermost radius, so a big sweep does not go faceted and a
  // small one does not cost what a big one does
  const rMax = Math.max(radius, radius + sgnR * (runTotal + landing))
  const seg = Math.max(6, Math.min(72, Math.round(opts.segments ?? ((t1 - t0) * rMax) / 1.6)))
  /** a point at angle-step `i` of the sweep, `v` metres along the climb from the baseline, at height `h` */
  const P = (i: number, v: number, h: number): [number, number, number] => {
    const th = t0 + ((t1 - t0) * i) / seg
    const r = radius + sgnR * v
    return [centre.x + Math.cos(th) * r, h, centre.z + Math.sin(th) * r]
  }
  /** the outward radial unit at angle-step `i` */
  const rad = (i: number): [number, number] => {
    const th = t0 + ((t1 - t0) * i) / seg
    return [Math.cos(th), Math.sin(th)]
  }

  for (let k = 0; k < count; k++) {
    const vA = v00 + dir * (k * td)
    const vB = vA + dir * td
    const yb = y0 + k * rA
    const yt = y0 + (k + 1) * rA
    const [tc, ttag] = treadKind === 'grass' || (treadKind === 'alternate' && k % 2 === 0)
      ? [grass, 0] as [Rgb, number] : [paving, ttag0(treadKind, tag)] as [Rgb, number]
    for (let i = 0; i < seg; i++) {
      const [cx0, cz0] = rad(i)
      const [cx1, cz1] = rad(i + 1)
      const mx = (cx0 + cx1) / 2
      const mz = (cz0 + cz1) / 2
      const f = -dir * sgnR
      // the riser, a band of the cylinder at this step's radius, facing back down the climb
      out.quad([P(i, vA, yb), P(i + 1, vA, yb), P(i + 1, vA, yt), P(i, vA, yt)],
        [mx * f, 0, mz * f], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
      // the tread, an annular sector, facing up
      out.quad([P(i, vA, yt), P(i + 1, vA, yt), P(i + 1, vB, yt), P(i, vB, yt)],
        [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], tc, ttag)
    }
    if (treadKind === 'planted' && td > 1.2) {
      const ring: P2[] = []
      for (let i = 0; i <= seg; i++) { const p = P(i, vA, yt); ring.push({ x: p[0], z: p[2] }) }
      for (let i = seg; i >= 0; i--) { const p = P(i, vB, yt); ring.push({ x: p[0], z: p[2] }) }
      out.decks.push({ ring, y: yt })
    }
    // the two RADIAL ends of the sweep, unless it closes on itself
    if (!whole) {
      for (const [i, sg] of [[0, -1], [seg, 1]] as const) {
        const [cx, cz] = rad(i)
        // the end plane's normal is tangential: the radial direction turned a quarter, outward from the sweep
        const nrm: [number, number, number] = [cz * sg, 0, -cx * sg]
        out.quad([P(i, vA, y0), P(i, vB, y0), P(i, vB, yt), P(i, vA, yt)],
          nrm, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
      }
    }
  }
  if (landing > 0) {
    for (let i = 0; i < seg; i++) {
      out.quad([P(i, vTop, y1), P(i + 1, vTop, y1), P(i + 1, vBack, y1), P(i, vBack, y1)],
        [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], paving, tag)
    }
    if (!whole) {
      for (const [i, sg] of [[0, -1], [seg, 1]] as const) {
        const [cx, cz] = rad(i)
        out.quad([P(i, vTop, y0), P(i, vBack, y0), P(i, vBack, y1), P(i, vTop, y1)],
          [cz * sg, 0, -cx * sg], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
      }
    }
  }
  for (let i = 0; i < seg; i++) {
    // the UNDERSIDE at y0, and the BACK at the head: the same two closures a straight flight gets
    out.quad([P(i, v00, y0), P(i + 1, v00, y0), P(i + 1, vBack, y0), P(i, vBack, y0)],
      [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
    const [cx0, cz0] = rad(i)
    const [cx1, cz1] = rad(i + 1)
    const f = dir * sgnR
    out.quad([P(i, vBack, y0), P(i + 1, vBack, y0), P(i + 1, vBack, y1), P(i, vBack, y1)],
      [((cx0 + cx1) / 2) * f, 0, ((cz0 + cz1) / 2) * f], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  }

  const poly = (v: number, y: number): P2[] => {
    const l: P2[] = []
    for (let i = 0; i <= seg; i++) { const p = P(i, v, y); l.push({ x: p[0], z: p[2] }) }
    return l
  }
  const rail = opts.rail ?? 'none'
  if (rail !== 'none' && !whole) {
    // a fan stair's rails run up its two RADIAL ends, which is where a person's hand is
    for (const [i, sg] of [[0, -1], [seg, 1]] as const) {
      if (rail === 'left' && sg > 0) continue
      if (rail === 'right' && sg < 0) continue
      const line: [number, number, number][] = []
      for (let k = 0; k <= count; k++) line.push(P(i, v00 + dir * (k * td), y0 + k * rA))
      const [cx, cz] = rad(i)
      slopedRail(out, line, opts.railKind ?? 'posts', cz * sg, -cx * sg)
    }
  }
  return { bottom: poly(v00, y0), top: poly(vBack, y1), run: runTotal + landing, steps: count, riser: rA, tread: td }
}

/** the tread's surface tag: grass carries none, anything else the flight's own */
function ttag0(kind: TreadKind, tag: number): number { return kind === 'grass' ? 0 : tag }

/**
 * A PLAIN INCLINED STRIP — a ramp or a plain paved walk — on the same baseline convention as `stair()`, so
 * that one can be laid BESIDE a flight without hand-rolling it. Solid, with closed ends, a back and an
 * underside, for the same reason the flight is.
 *
 * The Moscone South block is full of these: *"a concrete ramp descends from the curved wall to the
 * mezzanine"*, and the Folsom monumental stair is *"a stair-and-walk pair, not a single object"* — *"a broad
 * plain paved strip runs parallel to it"*. Pass the `run` a flight returned and the walk arrives exactly
 * where the flight does:
 *
 *     const s = stair(out, a, b, 0, 6, { ... })
 *     ramp(out, a2, b2, 0, 6, { run: s.run })   // the same slope, the same head
 *
 * Otherwise the run DERIVES from the rise by a gradient — `1 / 12` by default, which is the gradient a ramp
 * is allowed to be — so nothing here is a typed length either. `kerb` puts a low upstand along both edges,
 * which is what stops a wheel going over the side.
 */
export function ramp(out: MeshBuilder, a: P2, b: P2, y0: number, y1: number, opts: {
  run?: number; gradient?: number; from?: number; to?: number; anchor?: 'bottom' | 'top'
  kerb?: number; rail?: StairRail; railKind?: 'posts' | 'solid' | 'glass'
  colour?: Rgb; material?: Surface
} = {}): StairResult {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const from = Math.max(0, Math.min(1, opts.from ?? 0))
  const to = Math.max(from + 0.02, Math.min(1, opts.to ?? 1))
  const u0 = from * L
  const u1 = to * L
  const rise = Math.max(0.05, y1 - y0)
  const run = Math.max(0.5, opts.run ?? rise / Math.max(0.005, opts.gradient ?? 1 / 12))
  const anchor = opts.anchor ?? 'bottom'
  const dir = anchor === 'bottom' ? 1 : -1
  const v0 = anchor === 'bottom' ? 0 : run
  const v1 = v0 + dir * run
  const colour = opts.colour ?? [0.74, 0.73, 0.7]
  const tag = surfaceTag(opts.material ?? 'concrete')
  const P = (u: number, v: number, h: number): [number, number, number] =>
    [a.x + tx * u + nx * v, h, a.z + tz * u + nz * v]
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  // the running surface, one sloped quad
  out.quad([P(u0, v0, y0), P(u1, v0, y0), P(u1, v1, y1), P(u0, v1, y1)], [0, 1, 0], UV, colour, tag)
  /*
   * The two sides. Each is the wedge's triangle — foot at `y0`, head at `y0` underneath and at `y1` on top —
   * written as a quad with its last corner repeated, since `MeshBuilder` has no `tri`. Without them the ramp
   * is an open shell and you see the sky through its edge, which is the flight's louvre failure again.
   */
  for (const [u, sg] of [[u0, -1], [u1, 1]] as const) {
    out.quad([P(u, v0, y0), P(u, v1, y0), P(u, v1, y1), P(u, v0, y0)], [sg * tx, 0, sg * tz], UV, colour, tag)
  }
  out.quad([P(u0, v0, y0), P(u1, v0, y0), P(u1, v1, y0), P(u0, v1, y0)], [0, -1, 0], UV, colour, tag)
  out.quad([P(u0, v1, y0), P(u1, v1, y0), P(u1, v1, y1), P(u0, v1, y1)], [dir * nx, 0, dir * nz], UV, colour, tag)
  if (opts.kerb) {
    const k = opts.kerb
    for (const [u, sg] of [[u0, -1], [u1, 1]] as const) {
      const w = 0.12 * sg
      out.quad([P(u, v0, y0), P(u, v1, y1), P(u + w, v1, y1 + k), P(u + w, v0, y0 + k)], [sg * tx, 0, sg * tz], UV, colour, tag)
      out.quad([P(u, v0, y0 + k), P(u, v1, y1 + k), P(u + w, v1, y1 + k), P(u + w, v0, y0 + k)], [0, 1, 0], UV, colour, tag)
    }
  }
  const rail = opts.rail ?? 'none'
  if (rail !== 'none') {
    for (const sg of [-1, 1] as const) {
      if (rail === 'left' && sg > 0) continue
      if (rail === 'right' && sg < 0) continue
      const u = sg < 0 ? u0 : u1
      slopedRail(out, [P(u, v0, y0), P(u, v1, y1)], opts.railKind ?? 'posts', tx * sg, tz * sg)
    }
  }
  const at = (v: number, y: number): P2[] => [{ x: P(u0, v, y)[0], z: P(u0, v, y)[2] }, { x: P(u1, v, y)[0], z: P(u1, v, y)[2] }]
  return { bottom: at(v0, y0), top: at(v1, y1), run, steps: 0, riser: 0, tread: run }
}

/**
 * A sunken gun pit for a coastal battery: a circular or elliptical emplacement sunk into the parapet,
 * open to the sea, with walls and a raised lip. Used by coastal batteries (Presidio, etc).
 * The pit floor is below the outer parapet level, and the lip is a raised concrete wall at the seaward rim.
 *
 * `cx, cz` = pit centre in XZ; `rx, rz` = semi-axes (typically rx > rz for seaward orientation);
 * `floorY, lipY` = height of floor and lip edge; `parapeHeight` = height of main parapet (lip is lower);
 * `colour, lipColour` = concrete colours.
 */
export function gunPit(out: MeshBuilder, cx: number, cz: number, rx: number, rz: number, floorY: number,
                       lipY: number, parapetHeight: number, colour: Rgb = [0.65, 0.64, 0.61],
                       lipColour: Rgb = [0.55, 0.54, 0.51], darkColour: Rgb = [0.48, 0.47, 0.44]): void {
  const tag = surfaceTag('concrete')
  const innerTag = 0  // interior shadow
  const n = 24  // circumference points for the pit ring
  const outerRing: P2[] = []
  const innerRing: P2[] = []

  // build outer and inner rings of the pit
  for (let i = 0; i < n; i++) {
    const th = (2 * Math.PI * i) / n
    const ox = Math.cos(th)
    const oz = Math.sin(th)
    outerRing.push({ x: cx + ox * rx, z: cz + oz * rz })
    innerRing.push({ x: cx + ox * (rx * 0.7), z: cz + oz * (rz * 0.7) })
  }

  // outer wall of the pit (outward-facing)
  faceBand(out, outerRing, floorY, lipY, { kind: 'blank', wall: colour, material: 'concrete' })

  // inner wall of the pit (inward-facing, reversed for correct normals)
  faceBand(out, [...innerRing].reverse(), floorY, lipY, { kind: 'blank', wall: darkColour, material: 'concrete' })

  // the floor at floorY with a hole for the interior ring
  capPolygonWithHoles(out, [outerRing, innerRing], floorY, darkColour, innerTag)

  // the lip: raised edge at the seaward rim — a narrow horizontal ring of concrete
  const lipRing: P2[] = []
  for (let i = 0; i < n; i++) {
    const th = (2 * Math.PI * i) / n
    const ox = Math.cos(th)
    const oz = Math.sin(th)
    lipRing.push({ x: cx + ox * (rx * 0.85), z: cz + oz * (rz * 0.85) })
  }
  faceBand(out, lipRing, lipY, parapetHeight * 0.85, { kind: 'blank', wall: lipColour, material: 'concrete' })
  capPolygon(out, lipRing, parapetHeight * 0.85, lipColour, tag)
}
