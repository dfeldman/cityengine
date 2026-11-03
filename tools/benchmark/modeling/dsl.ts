/**
 * The benchmark's modelling language: a JSON list of primitives, checked and turned into triangles.
 *
 * A small model cannot be asked to compile TypeScript against MeshBuilder and Fit, so the benchmark gives it the
 * game's kit restated as data (PRIMITIVES.md is the same list, written for the model). The names follow the kit
 * where the kit has a name — colonnade, arcade, pediment, vault, dome, a gable/hip/mansard roof — and the
 * arcade/colonnade distinction is kept because it was the one the cheap runs got wrong
 * (MODELING_IMPROVEMENT_1.md, "The kit HAS the parts").
 *
 * The frame is the landmark kit's: metres, origin at the footprint's centre on the ground, y up, the FRONT on
 * local −z. Standing in front of the building and facing it, +x is on your right and +z goes away from you.
 * Seen from above with the front at the bottom of the page, the plan reads like a map.
 *
 * Only macros.ts is imported (v3's larger parts, which expand to these): this runs under node (run.ts, score.ts)
 * and in the browser through vite (viewer.html).
 *
 * `compile(model, { lenient: true })` — v3's mode, and always the mode for drawing and scoring an answer already
 * accepted — clamps numbers into range, reads "64" as 64, maps near-miss materials ("slate", "marble"), and drops a
 * broken part with a warning instead of failing the answer. An answer valid strictly compiles identically leniently.
 */
import { expandMacro, MACRO_FIELDS, MACRO_TYPES, type MacroType } from './macros.ts'

export type XZ = [number, number]
export type XYZ = [number, number, number]

export const MATERIALS = ['stone', 'brick', 'concrete', 'glass', 'metal', 'stucco', 'copper', 'tile', 'terracotta', 'grass'] as const
export type Material = (typeof MATERIALS)[number]
/** the game's own surface for each — what a translation into a real builder would pass as `material` */
export const GAME_SURFACE: Record<Material, string> = {
  stone: 'ashlar', brick: 'brick', concrete: 'concrete', glass: 'glass', metal: 'metal', stucco: 'stucco',
  copper: 'copper', tile: 'tile', terracotta: 'terracotta', grass: 'foliage',
}
const DEFAULT_COLOUR: Record<Material, string> = {
  stone: '#d8d2c4', brick: '#9a5a44', concrete: '#b8b6b0', glass: '#5d7f8f', metal: '#8a9096', stucco: '#e6dfd0',
  copper: '#5f9a84', tile: '#5a5e66', terracotta: '#c47a52', grass: '#5f8a4a',
}

export const PART_TYPES = ['box', 'prism', 'cylinder', 'dome', 'roof', 'vault', 'colonnade', 'arcade', 'pediment', 'beam', 'bowl', 'ring', 'disc', 'twist', 'repeat', ...MACRO_TYPES] as const
export type PartType = (typeof PART_TYPES)[number]

export interface Windows { kind: 'punched' | 'arched' | 'rusticated' | 'bands' | 'curtain'; floor?: number; pitch?: number; solid?: number; glass?: string }

/** what the scorer knows about each part once it is placed (repeat expanded) */
export interface PartInfo {
  type: Exclude<PartType, 'repeat' | MacroType>
  /** index in the model's own list, so a finding can point at it */
  index: number
  min: XYZ
  max: XYZ
  /** cylinders and domes; a colonnade's column radius */
  radius?: number
  /** free-standing columns this part contributes: a colonnade's count, a slender cylinder's 1 */
  columns: number
  /** arcade openings */
  arches: number
  material: Material
}

export interface Mesh { positions: number[]; normals: number[]; colors: number[]; indices: number[] }

export interface Compiled {
  ok: boolean
  bail?: string
  notes?: string
  errors: string[]
  warnings: string[]
  mesh: Mesh
  parts: PartInfo[]
  triangles: number
}

/** limits: generous for a building, tight enough that a runaway repeat cannot hang the scorer */
export const LIMITS = { parts: 300, expanded: 3000, triangles: 120_000, count: 200, sides: 64, points: 200, repeatDepth: 2 }

// ———————————————————————————————————————————————— mesh writing

class Out {
  m: Mesh = { positions: [], normals: [], colors: [], indices: [] }
  get vertexCount(): number { return this.m.positions.length / 3 }
  /** one flat polygon, fanned: `pts` in order round its edge; `hint` is any vector on its outward side */
  poly(pts: XYZ[], rgb: XYZ, hint?: XYZ): void {
    if (pts.length < 3) return
    let n = newell(pts)
    if (hint && dot(n, hint) < 0) { pts = [...pts].reverse(); n = [-n[0], -n[1], -n[2]] }
    const base = this.vertexCount
    for (const p of pts) { this.m.positions.push(...p); this.m.normals.push(...n); this.m.colors.push(...rgb) }
    for (let i = 1; i < pts.length - 1; i++) this.m.indices.push(base, base + i, base + i + 1)
  }
  /** a possibly concave flat polygon, ear-clipped; `toPlane` gives each point's 2D coordinates in its own plane */
  concave(pts: XYZ[], plane: (p: XYZ) => XZ, rgb: XYZ, hint: XYZ): void {
    const tris = earClip(pts.map(plane))
    let n = newell(pts)
    const flip = dot(n, hint) < 0
    if (flip) n = [-n[0], -n[1], -n[2]]
    const base = this.vertexCount
    for (const p of pts) { this.m.positions.push(...p); this.m.normals.push(...n); this.m.colors.push(...rgb) }
    for (const [a, b, c] of tris) this.m.indices.push(base + a, ...(flip ? [base + c, base + b] : [base + b, base + c]))
  }
  append(o: Out, f: (p: XYZ) => XYZ, fn: (n: XYZ) => XYZ): void {
    const base = this.vertexCount
    for (let i = 0; i < o.m.positions.length; i += 3) {
      this.m.positions.push(...f([o.m.positions[i], o.m.positions[i + 1], o.m.positions[i + 2]]))
      this.m.normals.push(...fn([o.m.normals[i], o.m.normals[i + 1], o.m.normals[i + 2]]))
      this.m.colors.push(o.m.colors[i], o.m.colors[i + 1], o.m.colors[i + 2])
    }
    for (const i of o.m.indices) this.m.indices.push(base + i)
  }
}

const dot = (a: XYZ, b: XYZ): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const sub = (a: XYZ, b: XYZ): XYZ => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function newell(p: XYZ[]): XYZ {
  let x = 0, y = 0, z = 0
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length]
    x += (a[1] - b[1]) * (a[2] + b[2]); y += (a[2] - b[2]) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1])
  }
  const L = Math.hypot(x, y, z) || 1
  return [x / L, y / L, z / L]
}
const signedArea = (p: XZ[]): number => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1] }, 0) / 2

/** ear clipping, either winding; a degenerate polygon falls back to a fan rather than throwing */
export function earClip(p: XZ[]): [number, number, number][] {
  const ccw = signedArea(p) > 0
  const idx = p.map((_, i) => i)
  const out: [number, number, number][] = []
  const cross = (a: XZ, b: XZ, c: XZ): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  const inside = (q: XZ, a: XZ, b: XZ, c: XZ): boolean => {
    const d1 = cross(a, b, q), d2 = cross(b, c, q), d3 = cross(c, a, q)
    return ccw ? d1 > 1e-9 && d2 > 1e-9 && d3 > 1e-9 : d1 < -1e-9 && d2 < -1e-9 && d3 < -1e-9
  }
  let guard = 0
  while (idx.length > 3 && guard++ < 10_000) {
    let cut = false
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length]
      const c = cross(p[i0], p[i1], p[i2])
      if (ccw ? c <= 1e-12 : c >= -1e-12) continue
      if (idx.some((j) => j !== i0 && j !== i1 && j !== i2 && inside(p[j], p[i0], p[i1], p[i2]))) continue
      out.push([i0, i1, i2]); idx.splice(k, 1); cut = true; break
    }
    if (!cut) break
  }
  if (idx.length === 3) out.push([idx[0], idx[1], idx[2]])
  else for (let k = 1; k < idx.length - 1; k++) out.push([idx[0], idx[k], idx[k + 1]])
  return out
}

// ———————————————————————————————————————————————— checking fields

class Checker {
  errors: string[] = []
  warnings: string[] = []
  at: string
  lenient: boolean
  constructor(at: string, lenient = false) { this.at = at; this.lenient = lenient }
  private v(o: Record<string, unknown>, k: string): unknown {
    const x = o[k]
    // lenient: a number written as a string is a number
    if (this.lenient && typeof x === 'string' && x.trim() !== '' && Number.isFinite(Number(x))) return Number(x)
    if (this.lenient && Array.isArray(x)) return x.map((e) => (typeof e === 'string' && e.trim() !== '' && Number.isFinite(Number(e)) ? Number(e) : e))
    return x
  }
  num(o: Record<string, unknown>, k: string, opt?: { min?: number; max?: number; def?: number }): number {
    const x = this.v(o, k)
    if (x === undefined || x === null) {
      if (opt?.def !== undefined) return opt.def
      this.errors.push(`${this.at}.${k}: required number is missing`); return NaN
    }
    if (typeof x !== 'number' || !Number.isFinite(x)) { this.errors.push(`${this.at}.${k}: must be a number, got ${JSON.stringify(x)}`); return NaN }
    if (opt?.min !== undefined && x < opt.min) {
      if (this.lenient) { this.warnings.push(`${this.at}.${k}: ${x} raised to the minimum ${opt.min}`); return opt.min }
      this.errors.push(`${this.at}.${k}: ${x} is below the minimum ${opt.min}`); return NaN
    }
    if (opt?.max !== undefined && x > opt.max) {
      if (this.lenient) { this.warnings.push(`${this.at}.${k}: ${x} lowered to the maximum ${opt.max}`); return opt.max }
      this.errors.push(`${this.at}.${k}: ${x} is above the maximum ${opt.max}`); return NaN
    }
    return x
  }
  xz(o: Record<string, unknown>, k: string, def?: XZ): XZ {
    const x = this.v(o, k)
    if (x === undefined && def) return def
    if (!Array.isArray(x) || x.length !== 2 || !x.every((n) => typeof n === 'number' && Number.isFinite(n))) {
      this.errors.push(`${this.at}.${k}: must be [x, z], two numbers, got ${JSON.stringify(x)}`); return [NaN, NaN]
    }
    return [x[0], x[1]]
  }
  xyz(o: Record<string, unknown>, k: string): XYZ {
    const x = this.v(o, k)
    if (!Array.isArray(x) || x.length !== 3 || !x.every((n) => typeof n === 'number' && Number.isFinite(n))) {
      this.errors.push(`${this.at}.${k}: must be [x, y, z], three numbers, got ${JSON.stringify(x)}`); return [NaN, NaN, NaN]
    }
    return [x[0], x[1], x[2]]
  }
  size(o: Record<string, unknown>, k: string): XZ {
    const s = this.xz(o, k)
    if (Number.isFinite(s[0]) && (s[0] <= 0 || s[1] <= 0)) { this.errors.push(`${this.at}.${k}: both sizes must be above 0`); return [NaN, NaN] }
    return s
  }
  oneOf<T extends string>(o: Record<string, unknown>, k: string, allowed: readonly T[], def?: T): T {
    const x = this.v(o, k)
    if (x === undefined && def !== undefined) return def
    if (typeof x !== 'string' || !allowed.includes(x as T)) {
      this.errors.push(`${this.at}.${k}: must be one of ${allowed.map((a) => `"${a}"`).join(', ')}, got ${JSON.stringify(x)}`)
      return allowed[0]
    }
    return x as T
  }
  span(y0: number, y1: number): void {
    if (Number.isFinite(y0) && Number.isFinite(y1) && y1 <= y0) this.errors.push(`${this.at}: y1 (${y1}) must be above y0 (${y0})`)
  }
}

const KNOWN: Record<PartType, string[]> = {
  box: ['center', 'size', 'y0', 'y1', 'rotate', 'windows'],
  prism: ['points', 'y0', 'y1', 'windows'],
  cylinder: ['center', 'radius', 'radiusTop', 'y0', 'y1', 'sides', 'windows'],
  dome: ['center', 'radius', 'y0', 'height'],
  roof: ['kind', 'center', 'size', 'rotate', 'y0', 'rise', 'ridge'],
  vault: ['center', 'size', 'rotate', 'y0', 'rise', 'axis', 'ends'],
  colonnade: ['from', 'to', 'y0', 'height', 'count', 'radius', 'entablature'],
  arcade: ['from', 'to', 'y0', 'height', 'count', 'thickness'],
  pediment: ['from', 'to', 'y0', 'height', 'depth'],
  beam: ['from', 'to', 'width'],
  bowl: ['center', 'size', 'inner', 'y0', 'y1', 'innerHeight', 'shape', 'rotate', 'arc'],
  ring: ['center', 'radius', 'inner', 'y0', 'y1', 'sides'],
  disc: ['center', 'facing', 'rotate', 'radius'],
  twist: ['center', 'size', 'y0', 'y1', 'turn', 'steps', 'topScale', 'windows'],
  repeat: ['count', 'offset', 'around', 'part'],
  ...MACRO_FIELDS,
}

/** lenient: the materials a model reaches for that the list does not have, mapped to the nearest that it does */
const MATERIAL_ALIASES: Record<string, Material> = {
  slate: 'tile', lead: 'metal', zinc: 'metal', steel: 'metal', iron: 'metal', aluminium: 'metal', aluminum: 'metal', bronze: 'copper', gold: 'copper', gilt: 'copper',
  marble: 'stone', limestone: 'stone', granite: 'stone', sandstone: 'stone', ashlar: 'stone', masonry: 'stone', plaster: 'stucco', render: 'stucco', paint: 'stucco',
  wood: 'terracotta', timber: 'terracotta', clay: 'terracotta', lawn: 'grass', turf: 'grass', foliage: 'grass', asphalt: 'concrete', cement: 'concrete',
}
const COMMON = ['type', 'colour', 'color', 'material', 'note', 'name', 'label']

function hex(s: unknown, fallback: string, ck: Checker, k: string): XYZ {
  let h = typeof s === 'string' ? s.trim() : undefined
  if (s !== undefined && (h === undefined || !/^#?[0-9a-fA-F]{6}$/.test(h))) { ck.warnings.push(`${ck.at}.${k}: ${JSON.stringify(s)} is not "#rrggbb"; using the material's colour`); h = undefined }
  const v = (h ?? fallback).replace('#', '')
  return [parseInt(v.slice(0, 2), 16) / 255, parseInt(v.slice(2, 4), 16) / 255, parseInt(v.slice(4, 6), 16) / 255]
}

// ———————————————————————————————————————————————— the primitives

const rot = (p: XZ, c: XZ, deg: number): XZ => {
  const a = (deg * Math.PI) / 180, s = Math.sin(a), co = Math.cos(a)
  const x = p[0] - c[0], z = p[1] - c[1]
  return [c[0] + x * co - z * s, c[1] + x * s + z * co]
}

/** the four walls' windows: drawn as dark panels a hair proud of the wall, so they never fight it for depth */
function windowsOn(out: Out, a: XZ, b: XZ, y0: number, y1: number, outward: XZ, w: Windows, wall: XYZ): void {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1])
  if (L < 1.5 || y1 - y0 < 2) return
  const glass = hex(w.glass, '#2a3238', new Checker(''), 'glass')
  const floor = Math.max(2.4, w.floor ?? 4)
  const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L
  const off = 0.06
  const P = (u: number, y: number): XYZ => [a[0] + tx * u + outward[0] * off, y, a[1] + tz * u + outward[1] * off]
  const hint: XYZ = [outward[0], 0, outward[1]]
  const storeys = Math.max(1, Math.floor((y1 - y0) / floor))
  const fh = (y1 - y0) / storeys
  if (w.kind === 'curtain') {
    out.poly([P(0, y0), P(L, y0), P(L, y1), P(0, y1)], glass, hint)
    const line: XYZ = [wall[0] * 0.8, wall[1] * 0.8, wall[2] * 0.8]
    for (let s = 1; s < storeys; s++) { const y = y0 + s * fh; out.poly([P(0, y - 0.12), P(L, y - 0.12), P(L, y + 0.12), P(0, y + 0.12)], line, [hint[0] * 2, 0, hint[2] * 2]) }
    return
  }
  const solid = Math.min(0.9, Math.max(0.1, w.solid ?? 0.5))
  if (w.kind === 'bands') {
    for (let s = 0; s < storeys; s++) {
      const yb = y0 + s * fh + fh * solid * 0.6, yt = y0 + (s + 1) * fh - fh * solid * 0.4
      out.poly([P(0.3, yb), P(L - 0.3, yb), P(L - 0.3, yt), P(0.3, yt)], glass, hint)
    }
    return
  }
  if (w.kind === 'rusticated') {
    // channelled masonry: a dark joint every ~0.7 m, then the storey's punched windows over it
    const joint: XYZ = [wall[0] * 0.7, wall[1] * 0.7, wall[2] * 0.7]
    const n = Math.min(60, Math.floor((y1 - y0) / 0.7))
    for (let k = 1; k <= n; k++) { const y = y0 + ((y1 - y0) * k) / (n + 1); out.poly([P(0, y - 0.05), P(L, y - 0.05), P(L, y + 0.05), P(0, y + 0.05)], joint, hint) }
  }
  // punched, arched or rusticated: at most ~300 openings a wall, by widening the bay
  let pitch = Math.max(1.5, w.pitch ?? 3.5)
  if ((L / pitch) * storeys > 300) pitch = (L * storeys) / 300
  const bays = Math.max(1, Math.floor(L / pitch))
  const bw = L / bays
  const ww = bw * (1 - solid), wh = fh * 0.55
  for (let s = 0; s < storeys; s++) {
    const yb = y0 + s * fh + fh * 0.22
    for (let k = 0; k < bays; k++) {
      const u0 = k * bw + (bw - ww) / 2, u1 = u0 + ww
      if (w.kind === 'arched') {
        const r = ww / 2, yc = yb + wh - r
        const pts: XYZ[] = [P(u0, yb), P(u1, yb)]
        for (let i = 0; i <= 6; i++) { const t = (i / 6) * Math.PI; pts.push(P(u0 + r + r * Math.cos(t), yc + r * Math.sin(t))) }
        out.poly(pts, glass, hint)
      } else out.poly([P(u0, yb), P(u1, yb), P(u1, yb + wh), P(u0, yb + wh)], glass, hint)
    }
  }
}

/** an upright extrusion of a ring (any winding) between y0 and y1, capped top and bottom */
function extrude(out: Out, ring: XZ[], y0: number, y1: number, rgb: XYZ, win?: Windows, capBottom = true): void {
  const ccw = signedArea(ring) > 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez) || 1
    // outward normal in plan: for a ring counter-clockwise in (x,z), outward is (ez, −ex)
    const o: XZ = ccw ? [ez / L, -ex / L] : [-ez / L, ex / L]
    out.poly([[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], rgb, [o[0], 0, o[1]])
    if (win) windowsOn(out, a, b, y0, y1, o, win, rgb)
  }
  out.concave(ring.map((p) => [p[0], y1, p[1]] as XYZ), (p) => [p[0], p[2]], rgb, [0, 1, 0])
  if (capBottom) out.concave(ring.map((p) => [p[0], y0, p[1]] as XYZ), (p) => [p[0], p[2]], rgb, [0, -1, 0])
}

const rectRing = (c: XZ, s: XZ, deg = 0): XZ[] =>
  ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as XZ[]).map(([sx, sz]) => rot([c[0] + (sx * s[0]) / 2, c[1] + (sz * s[1]) / 2], c, deg))

/** a slab standing in a vertical plane: `poly` in (u along a→b, y), `t` thick, centred on the line */
function wallSlab(out: Out, a: XZ, b: XZ, poly: XZ[], t: number, rgb: XYZ): void {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L
  const nx = tz, nz = -tx
  const P = (u: number, y: number, s: number): XYZ => [a[0] + tx * u + nx * s, y, a[1] + tz * u + nz * s]
  const front = poly.map(([u, y]) => P(u, y, t / 2)), back = poly.map(([u, y]) => P(u, y, -t / 2))
  const plane = (p: XYZ): XZ => [(p[0] - a[0]) * tx + (p[2] - a[1]) * tz, p[1]]
  out.concave(front, plane, rgb, [nx, 0, nz])
  out.concave(back, plane, rgb, [-nx, 0, -nz])
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length
    const mid: XYZ = [(front[i][0] + front[j][0]) / 2, (front[i][1] + front[j][1]) / 2, (front[i][2] + front[j][2]) / 2]
    const cu = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length
    const c = P(cu, cy, 0)
    out.poly([front[i], front[j], back[j], back[i]], rgb, sub(mid, c))
  }
}

function cylinderMesh(out: Out, c: XZ, r0: number, r1: number, y0: number, y1: number, sides: number, rgb: XYZ, win?: Windows): void {
  const ring = (r: number, y: number): XYZ[] => Array.from({ length: sides }, (_, k) => {
    const a = (k / sides) * Math.PI * 2
    return [c[0] + Math.cos(a) * r, y, c[1] + Math.sin(a) * r] as XYZ
  })
  const lo = ring(r0, y0), hi = ring(Math.max(r1, 0.0001), y1)
  for (let k = 0; k < sides; k++) {
    const j = (k + 1) % sides
    const am = ((k + 0.5) / sides) * Math.PI * 2
    out.poly(r1 > 0.001 ? [lo[k], lo[j], hi[j], hi[k]] : [lo[k], lo[j], hi[k]], rgb, [Math.cos(am), 0.2, Math.sin(am)])
    if (win && r0 > 3 && Math.abs(r0 - r1) < 0.2 * r0) windowsOn(out, [lo[k][0], lo[k][2]], [lo[j][0], lo[j][2]], y0, y1, [Math.cos(am), Math.sin(am)], win, rgb)
  }
  if (r1 > 0.001) out.poly(hi, rgb, [0, 1, 0])
  out.poly(lo, rgb, [0, -1, 0])
}

function boxBetween(out: Out, from: XYZ, to: XYZ, w: number, rgb: XYZ): void {
  const d = sub(to, from), L = Math.hypot(...d) || 1
  const t: XYZ = [d[0] / L, d[1] / L, d[2] / L]
  const up: XYZ = Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]
  const cr = (a: XYZ, b: XYZ): XYZ => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  let u = cr(t, up); const ul = Math.hypot(...u); u = [u[0] / ul, u[1] / ul, u[2] / ul]
  const v = cr(u, t)
  const h = w / 2
  const corner = (p: XYZ, su: number, sv: number): XYZ => [p[0] + (u[0] * su + v[0] * sv) * h, p[1] + (u[1] * su + v[1] * sv) * h, p[2] + (u[2] * su + v[2] * sv) * h]
  const sq: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  const A = sq.map(([a, b]) => corner(from, a, b)), B = sq.map(([a, b]) => corner(to, a, b))
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    const m: XYZ = [u[0] * (sq[i][0] + sq[j][0]) + v[0] * (sq[i][1] + sq[j][1]), u[1] * (sq[i][0] + sq[j][0]) + v[1] * (sq[i][1] + sq[j][1]), u[2] * (sq[i][0] + sq[j][0]) + v[2] * (sq[i][1] + sq[j][1])]
    out.poly([A[i], A[j], B[j], B[i]], rgb, m)
  }
  out.poly(A, rgb, [-t[0], -t[1], -t[2]]); out.poly(B, rgb, t)
}

/** a superellipse point: n = 2 is an ellipse, larger n squarer — the bowl's 'oval' and 'rect' */
const superPt = (a: number, b: number, th: number, n: number): XZ => {
  const c = Math.cos(th), s = Math.sin(th)
  return [a * Math.sign(c) * Math.abs(c) ** (2 / n), b * Math.sign(s) * Math.abs(s) ** (2 / n)]
}

// ———————————————————————————————————————————————— compile

type Raw = Record<string, unknown>

interface Sink { errors: string[]; warnings: string[]; lenient: boolean; dropped: number }

function compilePart(raw: unknown, at: string, index: number, depth: number, out: Out, infos: PartInfo[], ck: Sink): void {
  const c = new Checker(at, ck.lenient)
  // lenient: a broken part is dropped and the answer carries on; strict: the answer fails
  const flush = (): void => {
    if (ck.lenient && c.errors.length) { ck.warnings.push(...c.errors.map((e) => `${e} — part dropped`)); ck.dropped++ } else ck.errors.push(...c.errors)
    ck.warnings.push(...c.warnings)
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { c.errors.push(`${at}: each part must be an object`); return flush() }
  const o = raw as Raw
  const type = o.type as PartType
  if (!PART_TYPES.includes(type)) { c.errors.push(`${at}.type: unknown type ${JSON.stringify(o.type)}; use one of ${PART_TYPES.join(', ')}`); return flush() }
  for (const k of Object.keys(o)) if (!KNOWN[type].includes(k) && !COMMON.includes(k)) c.warnings.push(`${at}.${k}: "${type}" has no field "${k}"; ignored`)
  if ((MACRO_TYPES as readonly string[]).includes(type)) {
    // a larger part: written out as ordinary parts, each compiled (and reported) under this part's index
    if (depth > LIMITS.repeatDepth) { c.errors.push(`${at}: nested too deep`); return flush() }
    const expanded = expandMacro(type as MacroType, o, (w) => c.warnings.push(w), at)
    flush()
    expanded.forEach((p, k) => compilePart(p, `${at}>${(p as Raw).type}${k}`, index, depth, out, infos, ck))
    return
  }
  if (ck.lenient && typeof o.material === 'string' && !MATERIALS.includes(o.material as Material)) {
    const alias = MATERIAL_ALIASES[o.material.toLowerCase()] ?? (MATERIALS.includes(o.material.toLowerCase() as Material) ? o.material.toLowerCase() as Material : 'stone')
    c.warnings.push(`${at}.material: "${o.material}" read as "${alias}"`)
    o.material = alias
  }
  const material = o.material === undefined ? 'stone' : c.oneOf(o, 'material', MATERIALS)
  const rgb = hex(o.colour ?? o.color, DEFAULT_COLOUR[material], c, 'colour')
  const win = (): Windows | undefined => {
    if (o.windows === undefined || o.windows === null) return undefined
    const w = o.windows as Raw
    if (typeof w !== 'object') { c.errors.push(`${at}.windows: must be an object like {"kind": "punched"}`); return undefined }
    const wc = new Checker(`${at}.windows`, ck.lenient)
    const r: Windows = {
      kind: wc.oneOf(w, 'kind', ['punched', 'arched', 'rusticated', 'bands', 'curtain'] as const, ck.lenient ? 'punched' : undefined),
      floor: wc.num(w, 'floor', { min: 2, max: 20, def: 4 }), pitch: wc.num(w, 'pitch', { min: 1, max: 40, def: 3.5 }),
      solid: wc.num(w, 'solid', { min: 0, max: 1, def: 0.5 }), glass: typeof w.glass === 'string' ? w.glass : undefined,
    }
    c.errors.push(...wc.errors); c.warnings.push(...wc.warnings)
    return r
  }
  const before = out.vertexCount
  const local = new Out()
  let info: Omit<PartInfo, 'min' | 'max' | 'index' | 'material'> | null = null

  switch (type) {
    case 'box': {
      const center = c.xz(o, 'center'), size = c.size(o, 'size'), y0 = c.num(o, 'y0', { def: 0 }), y1 = c.num(o, 'y1'), r = c.num(o, 'rotate', { def: 0 })
      c.span(y0, y1)
      if (!c.errors.length) extrude(local, rectRing(center, size, r), y0, y1, rgb, win())
      info = { type, columns: 0, arches: 0 }
      break
    }
    case 'prism': {
      const pts = o.points
      const y0 = c.num(o, 'y0', { def: 0 }), y1 = c.num(o, 'y1')
      c.span(y0, y1)
      if (!Array.isArray(pts) || pts.length < 3 || pts.length > LIMITS.points || !pts.every((p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && Number.isFinite(n)))) {
        c.errors.push(`${at}.points: must be a list of 3–${LIMITS.points} [x, z] pairs`)
      } else if (Math.abs(signedArea(pts as XZ[])) < 0.5) c.errors.push(`${at}.points: the outline has no area`)
      if (!c.errors.length) extrude(local, pts as XZ[], y0, y1, rgb, win())
      info = { type, columns: 0, arches: 0 }
      break
    }
    case 'cylinder': {
      const center = c.xz(o, 'center'), r0 = c.num(o, 'radius', { min: 0.05 }), y0 = c.num(o, 'y0', { def: 0 }), y1 = c.num(o, 'y1')
      const r1 = c.num(o, 'radiusTop', { min: 0, def: r0 }), sides = Math.round(c.num(o, 'sides', { min: 3, max: LIMITS.sides, def: r0 < 1.5 ? 12 : 24 }))
      c.span(y0, y1)
      if (!c.errors.length) cylinderMesh(local, center, r0, r1, y0, y1, sides, rgb, win())
      // a slender upright cylinder reads as a column; a colonnade written as a repeat of cylinders still counts
      info = { type, radius: r0, columns: r0 <= 2.5 && y1 - y0 > 4 * r0 ? 1 : 0, arches: 0 }
      break
    }
    case 'dome': {
      const center = c.xz(o, 'center'), r = c.num(o, 'radius', { min: 0.2 }), y0 = c.num(o, 'y0', { def: 0 }), h = c.num(o, 'height', { min: 0.1, def: r })
      if (!c.errors.length) {
        const sides = 24, rings = 8
        const P = (i: number, k: number): XYZ => {
          const t = (i / rings) * (Math.PI / 2), a = (k / sides) * Math.PI * 2
          return [center[0] + Math.cos(a) * r * Math.cos(t), y0 + h * Math.sin(t), center[1] + Math.sin(a) * r * Math.cos(t)]
        }
        for (let i = 0; i < rings; i++) for (let k = 0; k < sides; k++) {
          const am = ((k + 0.5) / sides) * Math.PI * 2, tm = ((i + 0.5) / rings) * (Math.PI / 2)
          const hint: XYZ = [Math.cos(am) * Math.cos(tm), Math.sin(tm), Math.sin(am) * Math.cos(tm)]
          if (i === rings - 1) local.poly([P(i, k), P(i, k + 1), P(rings, 0)], rgb, hint)
          else local.poly([P(i, k), P(i, k + 1), P(i + 1, k + 1), P(i + 1, k)], rgb, hint)
        }
      }
      info = { type, radius: r, columns: 0, arches: 0 }
      break
    }
    case 'roof': {
      const kind = c.oneOf(o, 'kind', ['gable', 'hip', 'pyramid', 'mansard', 'pavilion', 'shed', 'flat'] as const)
      const center = c.xz(o, 'center'), size = c.size(o, 'size'), y0 = c.num(o, 'y0'), rise = c.num(o, 'rise', { min: 0.1 }), r = c.num(o, 'rotate', { def: 0 })
      const ridge = c.oneOf(o, 'ridge', ['x', 'z'] as const, size[0] >= size[1] ? 'x' : 'z')
      if (!c.errors.length) roofMesh(local, kind, center, size, y0, rise, r, ridge, rgb)
      info = { type, columns: 0, arches: 0 }
      break
    }
    case 'vault': {
      const center = c.xz(o, 'center'), size = c.size(o, 'size'), y0 = c.num(o, 'y0'), rise = c.num(o, 'rise', { min: 0.1 }), r = c.num(o, 'rotate', { def: 0 })
      const axis = c.oneOf(o, 'axis', ['x', 'z'] as const, size[0] >= size[1] ? 'x' : 'z')
      const ends = c.oneOf(o, 'ends', ['closed', 'glass', 'open'] as const, 'closed')
      if (!c.errors.length) {
        const along = axis === 'x' ? size[0] : size[1], across = axis === 'x' ? size[1] : size[0]
        // in the vault's own frame: u along the axis, v across it; mapped to x/z then rotated
        const M = (u: number, v: number, y: number): XYZ => {
          const p = rot(axis === 'x' ? [center[0] + u, center[1] + v] : [center[0] + v, center[1] + u], center, r)
          return [p[0], y, p[1]]
        }
        const seg = 12
        const prof = Array.from({ length: seg + 1 }, (_, i) => { const t = (i / seg) * Math.PI; return [(-Math.cos(t) * across) / 2, y0 + Math.sin(t) * rise] as XZ })
        for (let i = 0; i < seg; i++) {
          const [v0, h0] = prof[i], [v1, h1] = prof[i + 1]
          const tm = ((i + 0.5) / seg) * Math.PI
          const hv = M(0, -Math.cos(tm), 0), hc = M(0, 0, 0)
          local.poly([M(-along / 2, v0, h0), M(along / 2, v0, h0), M(along / 2, v1, h1), M(-along / 2, v1, h1)], rgb, [hv[0] - hc[0], Math.sin(tm), hv[2] - hc[2]])
        }
        if (ends !== 'open') {
          const endRgb = ends === 'glass' ? hex(undefined, DEFAULT_COLOUR.glass, c, '') : rgb
          for (const s of [-1, 1]) {
            const hu = M(s, 0, 0), hc = M(0, 0, 0)
            local.poly(prof.map(([v, h]) => M((s * along) / 2, v, h)), endRgb, [hu[0] - hc[0], 0, hu[2] - hc[2]])
          }
        }
      }
      info = { type, columns: 0, arches: 0 }
      break
    }
    case 'colonnade': {
      const a = c.xz(o, 'from'), b = c.xz(o, 'to'), y0 = c.num(o, 'y0', { def: 0 }), h = c.num(o, 'height', { min: 1 })
      const n = Math.round(c.num(o, 'count', { min: 1, max: LIMITS.count }))
      const r = c.num(o, 'radius', { min: 0.1, max: 5, def: Number.isFinite(h) ? Math.max(0.25, h / 20) : 1 })
      const ent = c.num(o, 'entablature', { min: 0, def: Number.isFinite(h) ? h * 0.12 : 1 })
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (Number.isFinite(L) && L < 2 * r) c.errors.push(`${at}: "from" and "to" are only ${L.toFixed(1)} m apart`)
      if (!c.errors.length) {
        const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L
        for (let k = 0; k < n; k++) {
          const u = n === 1 ? L / 2 : r + (k * (L - 2 * r)) / (n - 1)
          const p: XZ = [a[0] + tx * u, a[1] + tz * u]
          cylinderMesh(local, p, r * 1.25, r * 1.25, y0, y0 + Math.min(r, 0.6), 12, rgb)
          cylinderMesh(local, p, r, r * 0.88, y0, y0 + h - ent, 12, rgb)
        }
        if (ent > 0) extrude(local, [[a[0] - tz * r * 1.3, a[1] + tx * r * 1.3], [b[0] - tz * r * 1.3, b[1] + tx * r * 1.3], [b[0] + tz * r * 1.3, b[1] - tx * r * 1.3], [a[0] + tz * r * 1.3, a[1] - tx * r * 1.3]], y0 + h - ent, y0 + h, rgb)
      }
      info = { type, radius: r, columns: Number.isFinite(n) ? n : 0, arches: 0 }
      break
    }
    case 'arcade': {
      const a = c.xz(o, 'from'), b = c.xz(o, 'to'), y0 = c.num(o, 'y0', { def: 0 }), h = c.num(o, 'height', { min: 1.5 })
      const n = Math.round(c.num(o, 'count', { min: 1, max: LIMITS.count })), t = c.num(o, 'thickness', { min: 0.1, max: 20, def: 1.2 })
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (Number.isFinite(L) && L < 1) c.errors.push(`${at}: "from" and "to" are only ${L.toFixed(1)} m apart`)
      if (!c.errors.length) {
        const bay = L / n, pier = bay * 0.28, rx = (bay - pier) / 2
        const band = Math.max(0.5, h * 0.15), ry = Math.min(rx, h * 0.4), spring = h - band - ry
        // the piers, the band over them, and one spandrel per bay: the wall left above each round head
        for (let k = 0; k <= n; k++) {
          const u0 = Math.max(0, k * bay - pier / 2), u1 = Math.min(L, k * bay + pier / 2)
          wallSlab(local, a, b, [[u0, y0], [u1, y0], [u1, y0 + h - band], [u0, y0 + h - band]], t, rgb)
        }
        wallSlab(local, a, b, [[0, y0 + h - band], [L, y0 + h - band], [L, y0 + h], [0, y0 + h]], t, rgb)
        for (let k = 0; k < n; k++) {
          const uc = (k + 0.5) * bay
          const poly: XZ[] = [[uc - rx, y0 + h - band], [uc + rx, y0 + h - band]]
          for (let i = 0; i <= 8; i++) { const th = (i / 8) * Math.PI; poly.push([uc + rx * Math.cos(th), y0 + spring + ry * Math.sin(th)]) }
          wallSlab(local, a, b, poly, t, rgb)
        }
      }
      info = { type, columns: 0, arches: Number.isFinite(n) ? n : 0 }
      break
    }
    case 'pediment': {
      const a = c.xz(o, 'from'), b = c.xz(o, 'to'), y0 = c.num(o, 'y0'), h = c.num(o, 'height', { min: 0.2 }), d = c.num(o, 'depth', { min: 0.1, def: 2 })
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (Number.isFinite(L) && L < 1) c.errors.push(`${at}: "from" and "to" are only ${L.toFixed(1)} m apart`)
      if (!c.errors.length) wallSlab(local, a, b, [[0, y0], [L, y0], [L / 2, y0 + h]], d, rgb)
      info = { type, columns: 0, arches: 0 }
      break
    }
    case 'beam': {
      const a = c.xyz(o, 'from'), b = c.xyz(o, 'to'), w = c.num(o, 'width', { min: 0.05, max: 20, def: 0.6 })
      if (!c.errors.length && Math.hypot(...sub(b, a)) < 0.1) c.errors.push(`${at}: "from" and "to" are the same point`)
      if (!c.errors.length) boxBetween(local, a, b, w, rgb)
      info = { type, columns: 0, arches: 0 }
      break
    }
    case 'bowl': {
      const center = c.xz(o, 'center'), size = c.size(o, 'size'), inner = c.size(o, 'inner')
      const y0 = c.num(o, 'y0', { def: 0 }), y1 = c.num(o, 'y1'), r = c.num(o, 'rotate', { def: 0 })
      const yi = c.num(o, 'innerHeight', { def: Number.isFinite(y0) && Number.isFinite(y1) ? y0 + (y1 - y0) * 0.15 : 0 })
      const shape = c.oneOf(o, 'shape', ['oval', 'rect'] as const, 'oval')
      let arc: XZ = [0, 360]
      if (o.arc !== undefined) arc = c.xz(o, 'arc')
      c.span(y0, y1)
      if (Number.isFinite(inner[0]) && Number.isFinite(size[0]) && (inner[0] >= size[0] || inner[1] >= size[1])) c.errors.push(`${at}.inner: must be smaller than size in both directions`)
      if (Number.isFinite(yi) && Number.isFinite(y1) && (yi < y0 || yi > y1)) c.errors.push(`${at}.innerHeight: must lie between y0 and y1`)
      if (!c.errors.length) {
        const n = shape === 'oval' ? 2 : 8
        const full = Math.abs(arc[1] - arc[0]) >= 359.9
        const N = 64
        const span = full ? 360 : ((arc[1] - arc[0]) % 360 + 360) % 360 || 360
        const steps = full ? N : Math.max(2, Math.round((N * span) / 360))
        const at3 = (th: number, a: number, b: number, y: number): XYZ => { const p = superPt(a, b, th, n); const q = rot([center[0] + p[0], center[1] + p[1]], center, r); return [q[0], y, q[1]] }
        // angles measured like `rotate`: 0° is +x, 90° is +z (the back), counter-clockwise seen from above
        const th = (i: number): number => ((arc[0] + (span * i) / steps) * Math.PI) / 180
        for (let i = 0; i < steps; i++) {
          const t0 = th(i), t1 = th(full ? (i + 1) % steps : i + 1)
          const oB0 = at3(t0, size[0] / 2, size[1] / 2, y0), oB1 = at3(t1, size[0] / 2, size[1] / 2, y0)
          const oT0 = at3(t0, size[0] / 2, size[1] / 2, y1), oT1 = at3(t1, size[0] / 2, size[1] / 2, y1)
          const iT0 = at3(t0, inner[0] / 2, inner[1] / 2, yi), iT1 = at3(t1, inner[0] / 2, inner[1] / 2, yi)
          const iB0 = at3(t0, inner[0] / 2, inner[1] / 2, y0), iB1 = at3(t1, inner[0] / 2, inner[1] / 2, y0)
          const out3: XYZ = [(oB0[0] + oB1[0]) / 2 - center[0], 0, (oB0[2] + oB1[2]) / 2 - center[1]]
          local.poly([oB0, oB1, oT1, oT0], rgb, out3)
          local.poly([oT0, oT1, iT1, iT0], rgb, [0, 1, 0])
          if (yi > y0 + 0.05) local.poly([iB0, iB1, iT1, iT0], rgb, [-out3[0], 0, -out3[2]])
        }
        if (!full) for (const [i, s] of [[0, -1], [steps, 1]] as const) {
          const t = th(i)
          const pts = [at3(t, size[0] / 2, size[1] / 2, y0), at3(t, size[0] / 2, size[1] / 2, y1), at3(t, inner[0] / 2, inner[1] / 2, yi), at3(t, inner[0] / 2, inner[1] / 2, y0)]
          const tang: XYZ = [-Math.sin(t) * s, 0, Math.cos(t) * s]
          local.poly(pts, rgb, tang)
        }
      }
      info = { type, columns: 0, arches: 0 }
      break
    }
    case 'ring': {
      // a hollow drum: an open entablature, a stadium's roof ring, a cooling tower
      const center = c.xz(o, 'center'), r0 = c.num(o, 'radius', { min: 0.1 }), ri = c.num(o, 'inner', { min: 0, def: Number.isFinite(r0) ? r0 * 0.8 : 0 })
      const y0 = c.num(o, 'y0', { def: 0 }), y1 = c.num(o, 'y1'), sides = Math.round(c.num(o, 'sides', { min: 3, max: LIMITS.sides, def: 32 }))
      c.span(y0, y1)
      if (Number.isFinite(ri) && Number.isFinite(r0) && ri >= r0) c.errors.push(`${at}.inner: must be smaller than radius`)
      if (!c.errors.length) {
        if (ri < 0.05) cylinderMesh(local, center, r0, r0, y0, y1, sides, rgb)
        else {
          const P = (r: number, k: number, y: number): XYZ => { const a = (k / sides) * Math.PI * 2; return [center[0] + Math.cos(a) * r, y, center[1] + Math.sin(a) * r] }
          for (let k = 0; k < sides; k++) {
            const am = ((k + 0.5) / sides) * Math.PI * 2, h: XYZ = [Math.cos(am), 0, Math.sin(am)]
            local.poly([P(r0, k, y0), P(r0, k + 1, y0), P(r0, k + 1, y1), P(r0, k, y1)], rgb, h)
            local.poly([P(ri, k, y0), P(ri, k + 1, y0), P(ri, k + 1, y1), P(ri, k, y1)], rgb, [-h[0], 0, -h[2]])
            local.poly([P(ri, k, y1), P(r0, k, y1), P(r0, k + 1, y1), P(ri, k + 1, y1)], rgb, [0, 1, 0])
            local.poly([P(ri, k, y0), P(r0, k, y0), P(r0, k + 1, y0), P(ri, k + 1, y0)], rgb, [0, -1, 0])
          }
        }
      }
      info = { type, radius: r0, columns: 0, arches: 0 }
      break
    }
    case 'disc': {
      // a flat round face standing upright: a clock, a rose window, a medallion
      const p = c.xyz(o, 'center'), r = c.num(o, 'radius', { min: 0.1, max: 40 }), deg = c.num(o, 'rotate', { def: 0 })
      const facing = c.oneOf(o, 'facing', ['front', 'back', 'left', 'right'] as const, ck.lenient ? 'front' : undefined)
      if (!c.errors.length) {
        const base: XZ = facing === 'front' ? [0, -1] : facing === 'back' ? [0, 1] : facing === 'left' ? [-1, 0] : [1, 0]
        const nrm = rot(base, [0, 0], deg)
        const t: XZ = [-nrm[1], nrm[0]]
        const pts: XYZ[] = Array.from({ length: 24 }, (_, k) => { const a = (k / 24) * Math.PI * 2; return [p[0] + t[0] * Math.cos(a) * r, p[1] + Math.sin(a) * r, p[2] + t[1] * Math.cos(a) * r] })
        local.poly(pts, rgb, [nrm[0], 0, nrm[1]])
      }
      info = { type, radius: r, columns: 0, arches: 0 }
      break
    }
    case 'twist': {
      // a block whose floors turn as it rises (and may taper): a twisting tower
      const center = c.xz(o, 'center'), size = c.size(o, 'size'), y0 = c.num(o, 'y0', { def: 0 }), y1 = c.num(o, 'y1')
      const turn = c.num(o, 'turn', { min: -720, max: 720, def: 45 }), steps = Math.round(c.num(o, 'steps', { min: 2, max: 64, def: 16 }))
      const top = c.num(o, 'topScale', { min: 0.05, max: 4, def: 1 })
      c.span(y0, y1)
      if (!c.errors.length) {
        const ring = (k: number): XYZ[] => {
          const f = k / steps, sc = 1 + (top - 1) * f
          return rectRing(center, [size[0] * sc, size[1] * sc], turn * f).map(([x, z]) => [x, y0 + (y1 - y0) * f, z] as XYZ)
        }
        let prev = ring(0)
        for (let k = 1; k <= steps; k++) {
          const cur = ring(k)
          for (let i = 0; i < 4; i++) {
            const j = (i + 1) % 4
            const mid: XYZ = [(prev[i][0] + prev[j][0]) / 2 - center[0], 0, (prev[i][2] + prev[j][2]) / 2 - center[1]]
            local.poly([prev[i], prev[j], cur[j]], rgb, mid)
            local.poly([prev[i], cur[j], cur[i]], rgb, mid)
          }
          prev = cur
        }
        local.poly(ring(0), rgb, [0, -1, 0])
        local.poly(prev, rgb, [0, 1, 0])
      }
      info = { type, columns: 0, arches: 0 }
      break
    }
    case 'repeat': {
      const n = Math.round(c.num(o, 'count', { min: 1, max: LIMITS.count }))
      if (depth >= LIMITS.repeatDepth) c.errors.push(`${at}: repeats may nest only ${LIMITS.repeatDepth} deep`)
      let offset: XYZ = [0, 0, 0]
      let around: { center: XZ; step: number } | null = null
      if (o.around !== undefined) {
        const ar = o.around as Raw
        const ac = new Checker(`${at}.around`)
        if (!ar || typeof ar !== 'object') c.errors.push(`${at}.around: must be {"center": [x, z], "step": degrees}`)
        else around = { center: ac.xz(ar, 'center'), step: ac.num(ar, 'step', { def: Number.isFinite(n) ? 360 / n : 0 }) }
        c.errors.push(...ac.errors)
      } else if (o.offset !== undefined) offset = c.xyz(o, 'offset')
      else c.errors.push(`${at}: a repeat needs "offset": [dx, dy, dz] or "around": {"center": [x, z]}`)
      if (o.part === undefined) c.errors.push(`${at}.part: a repeat needs the one part to repeat`)
      flush()
      if (c.errors.length) return
      const child = new Out(), childInfos: PartInfo[] = []
      const errs: Sink = { errors: [], warnings: [], lenient: ck.lenient, dropped: 0 }
      compilePart(o.part, `${at}.part`, index, depth + 1, child, childInfos, errs)
      ck.errors.push(...errs.errors); ck.warnings.push(...errs.warnings); ck.dropped += errs.dropped
      if (errs.errors.length) return
      for (let k = 0; k < n; k++) {
        const f = around
          ? (p: XYZ): XYZ => { const q = rot([p[0], p[2]], around!.center, k * around!.step); return [q[0], p[1], q[1]] }
          : (p: XYZ): XYZ => [p[0] + offset[0] * k, p[1] + offset[1] * k, p[2] + offset[2] * k]
        const fn = around ? (q: XYZ): XYZ => { const r2 = rot([q[0], q[2]], [0, 0], k * around!.step); return [r2[0], q[1], r2[1]] } : (q: XYZ): XYZ => q
        out.append(child, f, fn)
        for (const ci of childInfos) {
          const corners: XYZ[] = []
          for (const x of [ci.min[0], ci.max[0]]) for (const y of [ci.min[1], ci.max[1]]) for (const z of [ci.min[2], ci.max[2]]) corners.push(f([x, y, z]))
          infos.push({ ...ci, min: [Math.min(...corners.map((p) => p[0])), Math.min(...corners.map((p) => p[1])), Math.min(...corners.map((p) => p[2]))], max: [Math.max(...corners.map((p) => p[0])), Math.max(...corners.map((p) => p[1])), Math.max(...corners.map((p) => p[2]))] })
        }
      }
      return
    }
  }
  flush()
  if (c.errors.length || !info) return
  out.append(local, (p) => p, (n) => n)
  const pos = out.m.positions
  const min: XYZ = [Infinity, Infinity, Infinity], max: XYZ = [-Infinity, -Infinity, -Infinity]
  for (let i = before * 3; i < pos.length; i += 3) for (let d = 0; d < 3; d++) { min[d] = Math.min(min[d], pos[i + d]); max[d] = Math.max(max[d], pos[i + d]) }
  if (out.vertexCount > before) infos.push({ ...info, index, min, max, material })
}

function roofMesh(out: Out, kind: string, c: XZ, size: XZ, y0: number, rise: number, deg: number, ridge: 'x' | 'z', rgb: XYZ): void {
  // in the roof's own frame: u along the ridge, v across it
  const along = ridge === 'x' ? size[0] : size[1], across = ridge === 'x' ? size[1] : size[0]
  const M = (u: number, v: number, y: number): XYZ => { const p = rot(ridge === 'x' ? [c[0] + u, c[1] + v] : [c[0] + v, c[1] + u], c, deg); return [p[0], y, p[1]] }
  const hintUV = (u: number, v: number, y: number): XYZ => { const p = M(u, v, 0), q = M(0, 0, 0); return [p[0] - q[0], y, p[2] - q[2]] }
  const A = along / 2, V = across / 2, top = y0 + rise
  const base = [M(-A, -V, y0), M(A, -V, y0), M(A, V, y0), M(-A, V, y0)]
  out.poly(base, rgb, [0, -1, 0])
  if (kind === 'flat') { extrude(out, base.map((p) => [p[0], p[2]] as XZ), y0, y0 + rise, rgb, undefined, false); return }
  if (kind === 'gable') {
    out.poly([M(-A, -V, y0), M(A, -V, y0), M(A, 0, top), M(-A, 0, top)], rgb, hintUV(0, -1, 1))
    out.poly([M(-A, V, y0), M(A, V, y0), M(A, 0, top), M(-A, 0, top)], rgb, hintUV(0, 1, 1))
    out.poly([M(-A, -V, y0), M(-A, V, y0), M(-A, 0, top)], rgb, hintUV(-1, 0, 0))
    out.poly([M(A, -V, y0), M(A, V, y0), M(A, 0, top)], rgb, hintUV(1, 0, 0))
    return
  }
  if (kind === 'shed') {
    out.poly([M(-A, -V, y0), M(A, -V, y0), M(A, V, top), M(-A, V, top)], rgb, hintUV(0, -1, 1))
    out.poly([M(-A, V, y0), M(A, V, y0), M(A, V, top), M(-A, V, top)], rgb, hintUV(0, 1, 0))
    out.poly([M(-A, -V, y0), M(-A, V, y0), M(-A, V, top)], rgb, hintUV(-1, 0, 0))
    out.poly([M(A, -V, y0), M(A, V, y0), M(A, V, top)], rgb, hintUV(1, 0, 0))
    return
  }
  // hip, pyramid, mansard: slopes from the eaves to an inner outline
  // mansard: steep sides to a flat top inset a quarter; pavilion: a tall, steep, truncated pyramid (French roofs)
  const d = Math.min(A, V) * (kind === 'pavilion' ? 0.6 : 0.25)
  const inA = kind === 'pyramid' ? 0 : kind === 'hip' ? Math.max(0, A - V) : A - d
  const iv = kind === 'mansard' || kind === 'pavilion' ? V - d : 0
  const up = [M(-inA, -iv, top), M(inA, -iv, top), M(inA, iv, top), M(-inA, iv, top)]
  const sides: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0]]
  const hints = [hintUV(0, -1, 1), hintUV(1, 0, 1), hintUV(0, 1, 1), hintUV(-1, 0, 1)]
  sides.forEach(([i, j], s) => out.poly([base[i], base[j], up[j], up[i]], rgb, hints[s]))
  if (kind === 'mansard' || kind === 'pavilion') out.poly(up, rgb, [0, 1, 0])
}

/** parse (tolerantly: code fences and chatter around the JSON are a small model's habit, not an error) */
export function extractJson(text: string): { value?: unknown; error?: string } {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fence ? fence[1] : text
  const start = body.indexOf('{'), end = body.lastIndexOf('}')
  if (start < 0 || end <= start) return { error: 'no JSON object found in the reply' }
  try { return { value: JSON.parse(body.slice(start, end + 1)) } } catch (e) { return { error: `the JSON does not parse: ${(e as Error).message}` } }
}

export function compile(model: unknown, opts: { lenient?: boolean } = {}): Compiled {
  const out = new Out(), parts: PartInfo[] = []
  const ck: Sink = { errors: [], warnings: [], lenient: opts.lenient === true, dropped: 0 }
  const done = (extra: Partial<Compiled> = {}): Compiled => ({ ok: ck.errors.length === 0, errors: ck.errors, warnings: ck.warnings, mesh: out.m, parts, triangles: out.m.indices.length / 3, ...extra })
  // lenient: a bare list of parts, or one bare part, is read as the answer it obviously is (added after the first v3 run)
  if (ck.lenient && Array.isArray(model)) model = { parts: model }
  else if (ck.lenient && model && typeof model === 'object' && !('parts' in model) && !('bail' in model) && 'type' in model) model = { parts: [model] }
  if (!model || typeof model !== 'object' || Array.isArray(model)) { ck.errors.push('the reply must be one JSON object'); return done() }
  const m = model as Raw
  if (typeof m.bail === 'string' && m.bail.trim()) return { ...done(), ok: true, bail: m.bail.trim() }
  const notes = typeof m.notes === 'string' ? m.notes : undefined
  if (!Array.isArray(m.parts)) { ck.errors.push('"parts" must be a list of parts (or give "bail": "<reason>" instead)'); return done({ notes }) }
  if (m.parts.length === 0) { ck.errors.push('"parts" is empty'); return done({ notes }) }
  if (m.parts.length > LIMITS.parts) { ck.errors.push(`"parts" has ${m.parts.length} entries; at most ${LIMITS.parts} (use "repeat" for rows of the same thing)`); return done({ notes }) }
  m.parts.forEach((p, i) => compilePart(p, `parts[${i}]`, i, 0, out, parts, ck))
  if (ck.lenient && parts.length === 0) ck.errors.push('none of the parts could be built')
  if (parts.length > LIMITS.expanded) ck.errors.push(`the repeats expand to ${parts.length} parts; at most ${LIMITS.expanded}`)
  if (out.m.indices.length / 3 > LIMITS.triangles) ck.errors.push(`${out.m.indices.length / 3} triangles; at most ${LIMITS.triangles}`)
  return done({ notes })
}
