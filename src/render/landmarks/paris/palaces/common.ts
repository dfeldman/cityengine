/**
 * The palace kit: what the palaces and ministries of this folder are made of, so each builder says only its own plan.
 *
 * A French palace of the 17th–19th centuries is, for a rider going by, a small number of things: long stone RANGES of
 * two or three storeys with a regular rhythm of tall windows, a cornice, a slate roof (hipped, a steep pavilion roof or
 * a mansard) with dormers in it; PAVILIONS standing a little proud at the ends and the middle, with roofs of their
 * own; a frontispiece; a balustrade. These are those, on the axis-aligned blocks of a builder's local frame (front
 * −z, as everywhere in render/landmarks/kit.ts).
 *
 * Every builder here is drawn in its own design metres — the size of the entry's footprint — and handed through
 * `fitted()`, which scales the drawing to whatever footprint the loader actually gives (the city gives the design
 * size; the tests give 25 × 35 m), so plans can be written in the plain numbers measured off OSM.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import { capPolygonWithHoles } from '../../../buildings.ts'
import { boxAlong, edgeAt, offsetRing } from '../../parts.ts'
import type { Fit } from '../../fit.ts'

const FIXED = 0

export type F = '-z' | '+z' | '-x' | '+x'
export const ALL: F[] = ['-z', '+z', '-x', '+x']

export interface Pal { stone: Rgb; trim: Rgb; deep: Rgb; glass: Rgb; slate: Rgb; lead: Rgb; gold: Rgb; dark: Rgb; bronze: Rgb }

/** A palette: pale limestone, Paris slate, dark glazing, gilding. */
export function palette(stone = '#e4d9c2', slate = '#4f565b'): Pal {
  const s = hex(stone)
  return {
    stone: s, trim: shade(s, 1.05), deep: shade(s, 0.86), glass: [0.17, 0.19, 0.21], slate: hex(slate),
    lead: [0.3, 0.33, 0.34], gold: [0.86, 0.68, 0.27], dark: [0.12, 0.12, 0.13], bronze: [0.25, 0.33, 0.29],
  }
}

/**
 * The drawing `draw` makes at its design size (hx × hz), fitted into `out` at the footprint the loader gave: x and z
 * scaled to it, heights kept (a palace in a smaller footprint is not a shorter palace). At the design size it is a copy.
 */
export function fitted(out: MeshBuilder, fit: Fit, hx: number, hz: number, draw: (q: MeshBuilder) => void): void {
  const q = new MeshBuilder()
  draw(q)
  const sx = fit.hx > 0 ? fit.hx / hx : 1
  const sz = fit.hz > 0 ? fit.hz / hz : 1
  const base = out.positions.length / 3
  for (let i = 0; i < q.positions.length; i += 3) {
    out.positions.push(q.positions[i] * sx, q.positions[i + 1], q.positions[i + 2] * sz)
    let nx = q.normals[i] / sx
    const ny = q.normals[i + 1]
    let nz = q.normals[i + 2] / sz
    const l = Math.hypot(nx, ny, nz) || 1
    nx /= l
    nz /= l
    out.normals.push(nx, ny / l, nz)
  }
  // (element by element: a palace's arrays are far past what a spread can pass as arguments)
  for (const u of q.uvs) out.uvs.push(u)
  for (const c of q.colors) out.colors.push(c)
  for (const i of q.indices) out.indices.push(base + i)
}

/** The point at `t` along a face, `y` up, `d` out from its plane; and the face's outward normal. */
function at(f: F, plane: number, t: number, y: number, d: number): [number, number, number] {
  switch (f) {
    case '-z': return [t, y, plane - d]
    case '+z': return [t, y, plane + d]
    case '-x': return [plane - d, y, t]
    default: return [plane + d, y, t]
  }
}
const NORMAL: Record<F, [number, number, number]> = { '-z': [0, 0, -1], '+z': [0, 0, 1], '-x': [-1, 0, 0], '+x': [1, 0, 0] }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A flat rectangle on a face, t0..t1 along it, y0..y1, `d` proud of it. */
export function rectOn(out: MeshBuilder, f: F, plane: number, t0: number, t1: number, y0: number, y1: number, c: Rgb, d = 0.06): void {
  out.quad([at(f, plane, t0, y0, d), at(f, plane, t1, y0, d), at(f, plane, t1, y1, d), at(f, plane, t0, y1, d)], NORMAL[f], UV, c, FIXED)
}

/** A round-headed opening on a face: a rectangle under a half-disc, `h` to the crown. */
export function archOn(out: MeshBuilder, f: F, plane: number, t: number, y0: number, w: number, h: number, c: Rgb, d = 0.07): void {
  const r = w / 2
  const spring = y0 + Math.max(0, h - r)
  rectOn(out, f, plane, t - r, t + r, y0, spring, c, d)
  const n = 6
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI
    const a1 = ((i + 1) / n) * Math.PI
    out.quad([at(f, plane, t, spring, d), at(f, plane, t + Math.cos(a0) * r, spring + Math.sin(a0) * r, d),
      at(f, plane, t + Math.cos(a1) * r, spring + Math.sin(a1) * r, d), at(f, plane, t, spring, d)], NORMAL[f], UV, c, FIXED)
  }
}

/** A segmental pediment on a face: a shallow arc `rise` high over t ± w/2 from y0, as a flat fan, `d` proud. */
export function segmentOn(out: MeshBuilder, f: F, plane: number, t: number, y0: number, w: number, rise: number, c: Rgb, d = 0.2): void {
  const n = 8
  for (let i = 0; i < n; i++) {
    const u0 = (i / n) * 2 - 1
    const u1 = ((i + 1) / n) * 2 - 1
    out.quad([at(f, plane, t, y0, d), at(f, plane, t + u0 * w / 2, y0 + rise * (1 - u0 * u0), d),
      at(f, plane, t + u1 * w / 2, y0 + rise * (1 - u1 * u1), d), at(f, plane, t, y0, d)], NORMAL[f], UV, c, FIXED)
  }
}

/** A box standing out of a face: `t0..t1` along it, `y0..y1`, from the plane out to `d`. */
export function slabOn(out: MeshBuilder, f: F, plane: number, t0: number, t1: number, y0: number, y1: number, d: number, c: Rgb, back = 0): void {
  const [ax, , az] = at(f, plane, t0, 0, -back)
  const [bx, , bz] = at(f, plane, t1, 0, d)
  block(out, Math.min(ax, bx), Math.max(ax, bx), Math.min(az, bz), Math.max(az, bz), y0, y1, c)
}

/** A triangular pediment standing on a face's plane, t0..t1 wide, rising `h` from y0, `d` deep out of it. */
export function pedimentOn(out: MeshBuilder, f: F, plane: number, t0: number, t1: number, y0: number, h: number, d: number, c: Rgb): void {
  const tm = (t0 + t1) / 2
  const n = NORMAL[f]
  out.quad([at(f, plane, t0, y0, d), at(f, plane, t1, y0, d), at(f, plane, tm, y0 + h, d), at(f, plane, tm, y0 + h, d)], n, UV, c, FIXED)
  // the two raking tops, from the face back to the plane
  const run = Math.hypot((t1 - t0) / 2, h) || 1
  for (const [ta, tb] of [[t0, tm], [t1, tm]] as const) {
    const ya = y0
    const yb = y0 + h
    const dir = Math.sign(tb - ta)
    // the slope's outward normal: up, and away from the middle along the face
    const along = at(f, 0, -dir * h / run, 0, 0)
    const nn: [number, number, number] = [along[0], ((t1 - t0) / 2) / run, along[2]]
    out.quad([at(f, plane, ta, ya, d), at(f, plane, tb, yb, d), at(f, plane, tb, yb, 0), at(f, plane, ta, ya, 0)], nn, UV, shade(c, 1.04), FIXED)
  }
}

export interface Storey { /** floor level */ y: number; /** window height */ h: number; /** round-headed */ arched?: boolean; /** sill offset over the floor */ sill?: number }

export interface RangeOpts {
  eaves: number
  /** the storeys whose windows it has */
  storeys: Storey[]
  /** window spacing along the faces, and window width */
  bay: number
  win?: number
  /** which faces have windows (all four by default) */
  faces?: F[]
  /** horizontal rustication: a band every `rustic` metres up to `rusticTo` */
  rustic?: number
  rusticTo?: number
  /** a string course at each storey's floor */
  courses?: boolean
  /** corner quoins / pilasters */
  quoins?: boolean
  /** cornice depth */
  cornice?: number
  /** a pediment over every other first-floor window */
  pediments?: boolean
  /** trim colour for window surrounds */
  frames?: boolean
}

/**
 * A RANGE: a stone block x0..x1 × z0..z1 up to its eaves, with windows in each storey on its faces, string courses, a
 * cornice, and if asked rusticated banding and corner quoins. No roof: the caller says which (`hipRoof`, `pavilionRoof`,
 * `mansard`, `terrace`).
 */
export function range(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, p: Pal, o: RangeOpts): void {
  block(out, x0, x1, z0, z1, 0, o.eaves, p.stone)
  const faces = o.faces ?? ALL
  const win = o.win ?? Math.min(1.7, o.bay * 0.45)
  for (const f of faces) {
    const plane = f === '-z' ? z0 : f === '+z' ? z1 : f === '-x' ? x0 : x1
    const t0 = f === '-z' || f === '+z' ? x0 : z0
    const t1 = f === '-z' || f === '+z' ? x1 : z1
    const len = t1 - t0
    if (len < 2) continue
    const n = Math.max(1, Math.round((len - 1.2) / o.bay))
    const step = (len - 1.2) / n
    for (const s of o.storeys) {
      const sill = s.y + (s.sill ?? 0.9)
      for (let i = 0; i < n; i++) {
        const t = t0 + 0.6 + step * (i + 0.5)
        if (o.frames !== false) rectOn(out, f, plane, t - win / 2 - 0.22, t + win / 2 + 0.22, sill - 0.2, sill + s.h + 0.18, p.trim, 0.05)
        if (s.arched) archOn(out, f, plane, t, sill, win, s.h, p.glass, 0.09)
        else rectOn(out, f, plane, t - win / 2, t + win / 2, sill, sill + s.h, p.glass, 0.09)
        if (o.pediments && s === o.storeys[1] && i % 2 === 0) pedimentOn(out, f, plane, t - win / 2 - 0.4, t + win / 2 + 0.4, sill + s.h + 0.25, 0.7, 0.3, p.trim)
      }
    }
    if (o.courses !== false) {
      for (const s of o.storeys) if (s.y > 0.5) slabOn(out, f, plane, t0 - 0.12, t1 + 0.12, s.y - 0.12, s.y + 0.12, 0.12, p.trim)
    }
    if (o.rustic) {
      for (let y = o.rustic; y < (o.rusticTo ?? o.eaves) - 0.3; y += o.rustic) rectOn(out, f, plane, t0, t1, y - 0.07, y + 0.07, p.deep, 0.035)
    }
  }
  if (o.quoins) {
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
      block(out, x - 0.25, x + 0.25, z - 0.25, z + 0.25, 0, o.eaves - 0.4, p.trim)
    }
  }
  const c = o.cornice ?? 0.6
  block(out, x0 - c, x1 + c, z0 - c, z1 + c, o.eaves - 0.75, o.eaves, p.trim)
}

/** A hipped slate roof over a rectangle: the ridge along its longer side, `pitch` its rise over half its depth. */
export function hipRoof(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, h: number, slate: Rgb, eave = 0.4): void {
  const w = x1 - x0 + 2 * eave
  const d = z1 - z0 + 2 * eave
  const i = Math.min(w, d) / 2
  roof(out, x0 - eave, x1 + eave, z0 - eave, z1 + eave, y, h, w >= d ? i : i - 0.001, w >= d ? i - 0.001 : i, slate)
}

/**
 * A steep French pavilion roof: four steep slopes to a small flat top `top` across, crested; `cap` a small pyramid on it
 * (the Luxembourg's) and a finial.
 */
export function pavilionRoof(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, h: number, p: Pal,
  o: { top?: number; cap?: number; crest?: boolean } = {}): void {
  const w = x1 - x0
  const d = z1 - z0
  const top = o.top ?? Math.min(w, d) * 0.3
  roof(out, x0 - 0.35, x1 + 0.35, z0 - 0.35, z1 + 0.35, y, h, (w - top) / 2 + 0.35, (d - top) / 2 + 0.35, p.slate)
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  if (o.crest !== false) {
    // the lead crest round the flat
    for (const s of [-1, 1]) {
      box(out, cx, y + h + 0.3, cz + s * top / 2, top / 2, 0.3, 0.06, p.lead, FIXED)
      box(out, cx + s * top / 2, y + h + 0.3, cz, 0.06, 0.3, top / 2, p.lead, FIXED)
    }
  }
  if (o.cap) {
    roof(out, cx - top / 2, cx + top / 2, cz - top / 2, cz + top / 2, y + h, o.cap, top / 2, top / 2, p.slate)
    prism(out, cx, cz, y + h + o.cap - 0.2, y + h + o.cap + 1.6, 0.12, 6, p.gold, FIXED, 0.03)
  }
}

/** A mansard: a steep lower slope `h1` up to a break, a low hipped top `h2` over it. */
export function mansard(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, h1: number, h2: number, slate: Rgb, inset = 1.6): void {
  roof(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, y, h1, inset + 0.3, inset + 0.3, slate)
  hipRoof(out, x0 + inset, x1 - inset, z0 + inset, z1 - inset, y + h1, h2, shade(slate, 0.92), 0)
}

/** A flat roof behind a balustrade: the leads, the balustrade's plinth, posts and rail round the edge. */
export function terrace(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, p: Pal, o: { sides?: F[]; h?: number } = {}): void {
  block(out, x0, x1, z0, z1, y - 0.05, y, p.lead)
  balustrade(out, x0, x1, z0, z1, y, p, o)
}

/** A balustrade round a rectangle (or along the sides named): a plinth, a rail, and pedestals every few metres. */
export function balustrade(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, p: Pal, o: { sides?: F[]; h?: number } = {}): void {
  const h = o.h ?? 1.1
  const sides = o.sides ?? ALL
  for (const f of sides) {
    const along = f === '-z' || f === '+z'
    const t0 = along ? x0 : z0
    const t1 = along ? x1 : z1
    const plane = f === '-z' ? z0 : f === '+z' ? z1 : f === '-x' ? x0 : x1
    const seg = (a: number, b: number, ya: number, yb: number, d: number): void => {
      if (along) block(out, a, b, plane - d, plane + d, ya, yb, p.trim)
      else block(out, plane - d, plane + d, a, b, ya, yb, p.trim)
    }
    seg(t0, t1, y, y + 0.22, 0.28)
    seg(t0, t1, y + h - 0.18, y + h, 0.3)
    // the balusters as a row of thin shafts, close enough to read as a balustrade from the street
    const n = Math.max(2, Math.round((t1 - t0) / 0.55))
    for (let i = 0; i <= n; i++) {
      const t = t0 + ((t1 - t0) * i) / n
      if (i % 6 === 0) seg(t - 0.25, t + 0.25, y + 0.22, y + h - 0.18, 0.27)
      else seg(t - 0.08, t + 0.08, y + 0.22, y + h - 0.18, 0.1)
    }
  }
}

/** Dormers along a roof's face: stone lucarnes (a window with a pediment, or round-headed) standing on the eaves. */
export function dormers(out: MeshBuilder, f: F, plane: number, t0: number, t1: number, y: number, bay: number, p: Pal,
  o: { w?: number; h?: number; round?: boolean; every?: number; set?: number } = {}): void {
  const w = o.w ?? 1.5
  const h = o.h ?? 2.3
  const set = o.set ?? 0.5
  const len = t1 - t0
  const n = Math.max(1, Math.round((len - 1.2) / bay))
  const step = (len - 1.2) / n
  for (let i = 0; i < n; i += o.every ?? 1) {
    const t = t0 + 0.6 + step * (i + 0.5)
    // the dormer's face, set back `set` into the roof from the wall below, and its cheeks back into the slope
    const pl = plane + (f === '-z' || f === '-x' ? set : -set)
    slabOn(out, f, pl, t - w / 2 - 0.25, t + w / 2 + 0.25, y, y + h, 0, p.trim, 1.8)
    rectOn(out, f, pl, t - w / 2, t + w / 2, y + 0.3, y + h - 0.3, p.glass, 0.04)
    if (o.round) archOn(out, f, pl, t, y + h - 0.6, w + 0.5, 0.9, p.trim, 0.05)
    else pedimentOn(out, f, pl, t - w / 2 - 0.35, t + w / 2 + 0.35, y + h, 0.75, 0.05, p.trim)
  }
}

/** Paired columns (or pilasters) on a face at t, from y0 to y1: two slim shafts with a plinth and capital. */
export function pairOn(out: MeshBuilder, f: F, plane: number, t: number, y0: number, y1: number, r: number, c: Rgb, gap = 1.1): void {
  for (const s of [-1, 1]) {
    const [x, , z] = at(f, plane, t + s * gap / 2, 0, r + 0.05)
    prism(out, x, z, y0 + 0.4, y1 - 0.4, r, 8, c, FIXED)
    box(out, x, y0 + 0.2, z, r + 0.12, 0.2, r + 0.12, c, FIXED)
    box(out, x, y1 - 0.2, z, r + 0.14, 0.2, r + 0.14, c, FIXED)
  }
}

/** A clock face on a face: a gilt-ringed dial. */
export function clockOn(out: MeshBuilder, f: F, plane: number, t: number, y: number, r: number, p: Pal): void {
  const n = 12
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    out.quad([at(f, plane, t, y, 0.12), at(f, plane, t + Math.cos(a0) * r, y + Math.sin(a0) * r, 0.12),
      at(f, plane, t + Math.cos(a1) * r, y + Math.sin(a1) * r, 0.12), at(f, plane, t, y, 0.12)], NORMAL[f], UV, [0.92, 0.9, 0.84], FIXED)
    out.quad([at(f, plane, t + Math.cos(a0) * r, y + Math.sin(a0) * r, 0.13), at(f, plane, t + Math.cos(a0) * (r + 0.25), y + Math.sin(a0) * (r + 0.25), 0.13),
      at(f, plane, t + Math.cos(a1) * (r + 0.25), y + Math.sin(a1) * (r + 0.25), 0.13), at(f, plane, t + Math.cos(a1) * r, y + Math.sin(a1) * r, 0.13)], NORMAL[f], UV, p.gold, FIXED)
  }
  rectOn(out, f, plane, t - 0.05, t + 0.05, y, y + r * 0.8, p.dark, 0.15)
  rectOn(out, f, plane, t - 0.05, t + r * 0.55, y - 0.05, y + 0.05, p.dark, 0.15)
}

/** A statue on a pedestal: a pale figure as a slim mass, for the skyline of a balustrade. */
export function statue(out: MeshBuilder, x: number, z: number, y: number, h: number, c: Rgb): void {
  box(out, x, y + 0.35, z, 0.45, 0.35, 0.45, c, FIXED)
  prism(out, x, z, y + 0.7, y + 0.7 + h * 0.72, 0.32, 6, c, FIXED, 0.24)
  prism(out, x, z, y + 0.7 + h * 0.72, y + 0.7 + h, 0.17, 6, c, FIXED, 0.12)
}

/**
 * A curved dome over a square plan (a dôme à l'impériale, the Luxembourg's): its slopes stepped in a quarter-round,
 * from half-width `hw` at y0 to the top `h` above, each band a truncated hip.
 */
export function squareDome(out: MeshBuilder, cx: number, cz: number, y0: number, hw: number, h: number, c: Rgb, bands = 6, hz = hw): void {
  for (let k = 0; k < bands; k++) {
    const a0 = (k / bands) * Math.PI / 2
    const a1 = ((k + 1) / bands) * Math.PI / 2
    const w0 = Math.cos(a0)
    const w1 = Math.max(0.06, Math.cos(a1))
    const ya = y0 + Math.sin(a0) * h
    const yb = y0 + Math.sin(a1) * h
    roof(out, cx - hw * w0, cx + hw * w0, cz - hz * w0, cz + hz * w0, ya, yb - ya, hw * (w0 - w1), hz * (w0 - w1), c)
  }
}

type P2 = { x: number; z: number }

/** [x, z, x, z, …] as points. */
export const pts = (a: number[]): P2[] => Array.from({ length: a.length / 2 }, (_, i) => ({ x: a[2 * i], z: a[2 * i + 1] }))

const signedArea = (r: P2[]): number => {
  let a = 0
  for (let i = 0; i < r.length; i++) { const p = r[i]; const q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
  return a / 2
}

/**
 * A plan EXTRUDED: an outline and its courtyards (OSM's, in the builder's frame), walls up to `eaves` with windows in
 * each storey along every wall of 3 m or more, a cornice, and a mansard — a steep skirt `inset` in and `rise` up from
 * every wall, slate leads over. For the irregular plans a set of rectangles cannot say (the Élysée's, a ministry's
 * round its courts). The outline is wound anticlockwise and the courts clockwise here, so every wall faces away from
 * the building whichever way OSM drew them.
 */
export function extrude(out: MeshBuilder, rings: P2[][], p: Pal, o: { eaves: number; storeys: Storey[]; bay: number; win?: number;
  rise?: number; inset?: number; frames?: boolean; dormers?: boolean }): void {
  const fixed = rings.map((r, i) => ((signedArea(r) > 0) === (i === 0) ? r : [...r].reverse()))
  const rise = o.rise ?? 3.2
  const inset = o.inset ?? 1.3
  const win = o.win ?? 1.5
  const inner = fixed.map((r) => offsetRing(r, -inset))
  for (let k = 0; k < fixed.length; k++) {
    const r = fixed[k]
    for (let i = 0; i < r.length; i++) {
      const e = edgeAt(r, i)
      const P = (u: number, y: number, d: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * d, y, e.a.z + e.tz * u + e.nz * d]
      const n: [number, number, number] = [e.nx, 0, e.nz]
      out.quad([P(0, 0, 0), P(e.L, 0, 0), P(e.L, o.eaves, 0), P(0, o.eaves, 0)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
      // the cornice, and the mansard's skirt from the wall's head to the offset line
      boxAlong(out, e.mid.x + e.nx * 0.15, o.eaves - 0.35, e.mid.z + e.nz * 0.15, e.L / 2 + 0.2, 0.35, 0.45, e.heading, p.trim)
      const ia = inner[k][i]
      const ib = inner[k][(i + 1) % r.length]
      out.quad([[e.a.x, o.eaves, e.a.z], [e.b.x, o.eaves, e.b.z], [ib.x, o.eaves + rise, ib.z], [ia.x, o.eaves + rise, ia.z]],
        [e.nx * 0.9, inset / Math.hypot(inset, rise), e.nz * 0.9], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
      if (e.L < 3) continue
      const nb = Math.max(1, Math.round((e.L - 1.2) / o.bay))
      const step = (e.L - 1.2) / nb
      const q = (u0: number, u1: number, y0: number, y1: number, d: number, c: Rgb): void =>
        out.quad([P(u0, y0, d), P(u1, y0, d), P(u1, y1, d), P(u0, y1, d)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
      for (let j = 0; j < nb; j++) {
        const u = 0.6 + step * (j + 0.5)
        for (const s of o.storeys) {
          const sill = s.y + (s.sill ?? 0.9)
          if (o.frames !== false) q(u - win / 2 - 0.2, u + win / 2 + 0.2, sill - 0.18, sill + s.h + 0.16, 0.05, p.trim)
          q(u - win / 2, u + win / 2, sill, sill + s.h, 0.09, p.glass)
        }
        // a dormer in every other bay
        if (o.dormers !== false && j % 2 === 0 && step > 2.2) {
          const yd = o.eaves + rise * 0.15
          const dz = inset * 0.15
          boxAlong(out, e.a.x + e.tx * u - e.nx * (0.7 - dz), yd + 0.9, e.a.z + e.tz * u - e.nz * (0.7 - dz), 0.65, 0.9, 0.7, e.heading, p.trim)
          q(u - 0.4, u + 0.4, yd + 0.25, yd + 1.5, dz + 0.03, p.glass)
        }
      }
    }
  }
  capPolygonWithHoles(out, inner, o.eaves + rise, shade(p.slate, 0.9), FIXED)
}
