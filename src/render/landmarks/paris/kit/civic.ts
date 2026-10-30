/**
 * The Paris kit: a civic building in a few lines (owner, 2026-10-30: "for Haussmann buildings it isn't really necessary
 * anyway, so what we need to look at are the exceptions and what they have in common with each other").
 *
 * APUR marks 11,044 of its 128,206 footprints as public facilities, and OSM tags about 3,400 buildings in the box. What
 * they have in common, against the apartment block next door (measured from APUR, 2026-10-30, and what a rider sees):
 *
 * - LOW: 11 m at the median, half the block beside it, on storeys of 4 m and more;
 * - no shops, and a plinth or a rusticated storey where the shops would be;
 * - WIDE BAYS and tall windows, no balconies, no shutters;
 * - an AXIS: one door in the middle of the front, framed, often with a frontispiece, the words of what it is over it, and
 *   the tricolour on a bracket above;
 * - three materials by date, the same whatever the building is for: stone before 1850 and in the grand ones; brick banded
 *   and quoined in stone for the Third Republic's schools and hospitals; brick alone between the wars; after 1945 concrete
 *   and render, then glass and bright panels.
 *
 * So a building is said by what it is and its date, and the differences are small: `recipes.ts` is the list. It stands on
 * `facade()` (render/landmarks/facade.ts), which draws the walls and the roof on any footprint; this file adds the axis.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { box, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { facade, type FacadeSpec, type Material, type Windows } from '../../facade.ts'
import { placed } from '../../kit.ts'
import { boxAlong, edgeAt } from '../../parts.ts'
import { sign } from '../../signage.ts'
import { towerRing } from '../../tower.ts'

export type Wall = 'stone' | 'brickStone' | 'brick' | 'render' | 'concrete' | 'glass'
export type Roof = 'slate' | 'mansard' | 'terrace'
export type Centre = 'door' | 'frontispiece' | 'pediment' | 'portico' | 'pavilions'

export interface CivicSpec {
  wall: Wall
  windows: Windows
  roof: Roof
  centre: Centre
  /** what it is, over the door: ÉCOLE, MAIRIE, HÔPITAL (or its own name) */
  word?: string
  /** the tricolour over the door; `2` adds the European flag beside it (a mairie) */
  flag?: 0 | 1 | 2
  /** the storey's height, metres: 4.2 unless it says otherwise */
  storey?: number
  /** a tint on the whole building, so that no two of a kind come out the same */
  seed?: number
}

const STONE: Rgb = [0.84, 0.81, 0.73]
const DOOR: Rgb = [0.1, 0.17, 0.16]
const DEEP: Rgb = [0.13, 0.13, 0.14]
const SLATE: Rgb = [0.3, 0.33, 0.37]
const WALL: Record<Wall, { shaft: Material; base: Material; trim: Rgb }> = {
  stone: { shaft: 'limestone', base: 'limestone', trim: STONE },
  brickStone: { shaft: 'brick', base: 'limestone', trim: STONE },
  brick: { shaft: 'dark-brick', base: 'dark-stone', trim: [0.62, 0.58, 0.5] },
  render: { shaft: 'stucco', base: 'stucco', trim: [0.72, 0.7, 0.65] },
  concrete: { shaft: 'precast', base: 'concrete', trim: [0.6, 0.6, 0.58] },
  glass: { shaft: 'glass', base: 'concrete', trim: [0.55, 0.57, 0.58] },
}

/** The edge the front is on: the longest of those facing +z, where the manifest's `front` turned the building. */
export function frontEdge(ring: { x: number; z: number }[]): number {
  let best = -1, bestL = 0, any = 0, anyL = 0
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L > anyL) { anyL = e.L; any = i }
    if (e.nz > 0.6 && e.L > bestL) { bestL = e.L; best = i }
  }
  return best >= 0 && bestL > 5 ? best : any
}

/** the tricolour on its bracket, from the wall out and up, in the frame of a part facing +z */
function flag(q: MeshBuilder, x: number, y: number, eu: boolean): void {
  const pole: Rgb = [0.1, 0.1, 0.11]
  const tip: [number, number, number] = [x, y + 2.6, 1.7]
  strut(q, [x, y, 0.02], tip, 0.06, 0.06, pole)
  const h = 1.05
  const band = (a: number, b: number, c: Rgb): void => {
    // the cloth hangs from the pole's top half, along the wall
    box(q, x + (a + b) / 2, y + 2.2 - h / 2, 1.2, (b - a) / 2, h / 2, 0.012, c)
  }
  if (eu) { band(0.05, 1.65, [0.1, 0.2, 0.55]) } else {
    band(0.05, 0.58, [0.05, 0.18, 0.5])
    band(0.58, 1.12, [0.95, 0.95, 0.93])
    band(1.12, 1.65, [0.82, 0.12, 0.14])
  }
}

function gable(q: MeshBuilder, w: number, y: number, h: number, d: number, c: Rgb): void {
  const a: [number, number, number] = [-w, y, d], b: [number, number, number] = [w, y, d], t: [number, number, number] = [0, y + h, d]
  const nx = h, ny = w, l = Math.hypot(nx, ny)
  q.quad([a, b, t, t], [0, 0, 1], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], c, 0)
  q.quad([b, [w, y, 0], [0, y + h, 0], t], [nx / l, ny / l, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], SLATE, 0)
  q.quad([[-w, y, 0], a, t, [0, y + h, 0]], [-nx / l, ny / l, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], SLATE, 0)
  box(q, 0, y - 0.2, d / 2 + 0.05, w + 0.2, 0.2, d / 2 + 0.1, c)
}

/** The axis, in the frame of a part facing +z with its foot at the middle of the wall. */
function axis(q: MeshBuilder, s: CivicSpec, L: number, H: number, groundH: number, trim: Rgb, grade: number): void {
  const doorW = Math.min(2.6, L / 5), doorH = Math.min(3.4, groundH - 0.5)
  const proud = s.centre === 'door' ? 0.14 : 0.6
  // a frontispiece stands proud, the middle three bays to the cornice
  if (s.centre === 'frontispiece' || s.centre === 'pediment' || s.centre === 'portico') {
    const w = Math.min(L * 0.2, 6)
    box(q, 0, H / 2, proud / 2, w, H / 2, proud / 2, trim)
    box(q, 0, H + 0.25, proud / 2 + 0.1, w + 0.25, 0.25, proud / 2 + 0.2, trim)
    for (let f = 1; f * 4.2 < H - 2; f++) {
      for (const x of [-w * 0.55, 0, w * 0.55]) box(q, x, f * 4.2 + 1.5, proud + 0.015, 0.62, 1.3, 0.015, DEEP)
    }
    if (s.centre !== 'frontispiece') gable(q, w + 0.2, H + 0.5, Math.min(2.6, w * 0.45), proud + 0.3, trim)
    if (s.centre === 'portico') {
      for (let k = 0; k < 4; k++) {
        const x = -w * 0.85 + (k * w * 1.7) / 3
        box(q, x, grade + (groundH * 1.6) / 2, proud + 1.4, 0.32, (groundH * 1.6) / 2, 0.32, trim)
      }
      box(q, 0, grade + groundH * 1.6 + 0.3, proud + 0.7, w, 0.3, 1.1, trim)
    }
  }
  // the end pavilions: each end of the front a storey above the rest, under its own hip
  if (s.centre === 'pavilions') {
    const w = Math.min(L * 0.12, 5)
    for (const sgn of [-1, 1]) {
      const x = sgn * (L / 2 - w)
      box(q, x, (H + 2) / 2, 0.3, w, (H + 2) / 2, 0.3, trim)
      for (let f = 1; f * 4.2 < H - 1; f++) for (const dx of [-w * 0.45, w * 0.45]) box(q, x + dx, f * 4.2 + 1.5, 0.615, 0.6, 1.3, 0.015, DEEP)
      box(q, x, H + 2.2, 0.3, w + 0.2, 0.2, 0.5, trim)
    }
  }
  // the door: a frame of dressed stone, a dark leaf, a lintel with its words, the step
  const y = grade
  const frameW = doorW / 2 + Math.min(1.6, L * 0.05)
  box(q, 0, y + (doorH + 1.4) / 2, proud + 0.08, frameW, (doorH + 1.4) / 2, 0.08, trim)
  box(q, 0, y + doorH / 2, proud + 0.17, doorW / 2, doorH / 2, 0.02, DOOR)
  box(q, 0, y + doorH + 1.5, proud + 0.2, frameW + 0.3, 0.13, 0.22, trim)
  box(q, 0, y + 0.1, proud + 0.6, doorW / 2 + 0.7, 0.1, 0.6, trim)
  // the flags over it
  const flagY = y + doorH + 1.65
  if (s.flag) flag(q, s.flag === 2 ? -1.9 : -0.85, flagY, false)
  if (s.flag === 2) flag(q, 0.25, flagY, true)
}

/** What brick wears: a band of stone at each floor, a chain of it up each outer corner. */
function stoneLines(out: MeshBuilder, ring: { x: number; z: number }[], H: number, groundH: number, n: number, trim: Rgb): void {
  const tag = surfaceTag('ashlar')
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 3) continue
    const at = (u: number, o: number): { x: number; z: number } => ({ x: e.mid.x + e.tx * u + e.nx * o, z: e.mid.z + e.tz * u + e.nz * o })
    for (let f = 1; f < n; f++) {
      const c = at(0, 0.04)
      boxAlong(out, c.x, groundH * f, c.z, e.L / 2, 0.13, 0.05, e.heading, trim, tag)
    }
    // an end of the wall at an outer corner: the ring is anticlockwise, so a left turn there
    for (const [end, u] of [[0, -1], [1, 1]] as const) {
      const other = edgeAt(ring, (i + (end ? 1 : ring.length - 1)) % ring.length)
      const cross = end ? e.tx * other.tz - e.tz * other.tx : other.tx * e.tz - other.tz * e.tx
      if (cross <= 0.3) continue
      const c = at(u * (e.L / 2 - 0.4), 0.05)
      boxAlong(out, c.x, H / 2, c.z, 0.4, H / 2, 0.06, e.heading, trim, tag)
    }
  }
}

export function civic(out: MeshBuilder, fit: Fit, s: CivicSpec): void {
  const from = out.colors.length
  const ring = towerRing(fit)
  const H = fit.height > 3 ? fit.height : 12
  const storey = s.storey ?? 4.2
  const n = Math.max(1, Math.round(H / storey))
  const m = WALL[s.wall]
  const stoneish = s.wall === 'stone' || s.wall === 'brickStone'
  // (a moulded head is sixty triangles a window: a building of more than two hundred windows has plain ones, and 588 triangles
  //  is what the plain ones cost a small one, about what a generic building does)
  let perimeter = 0
  for (let i = 0; i < ring.length; i++) perimeter += edgeAt(ring, i).L
  const windows: Windows = (s.windows === 'segmental' || s.windows === 'dressed') && (perimeter / 3.8) * n > 200 ? 'wide' : s.windows
  const groundH = H / n
  const spec: FacadeSpec = {
    ground: n >= 2 ? { kind: 'plain', storeys: 1, material: m.base } : null,
    shaft: { storeys: n >= 2 ? n - 1 : 1, windows, material: m.shaft },
    top: null,
    bands: { aboveGround: stoneish ? 'cornice' : 'string', belowTop: null, top: stoneish || s.wall === 'brick' ? 'cornice' : null },
    crown: s.roof === 'terrace' ? { kind: 'parapet', height: s.wall === 'glass' ? 0.3 : 0.7 }
      : s.roof === 'mansard' ? { kind: 'mansard', height: 3.2, inset: 1.1, colour: SLATE, dormers: 3 }
      : { kind: 'hip', height: Math.min(4.5, 2 + fit.hz * 0.2), inset: 0.3, colour: SLATE },
    frame: null,
    entrance: null,
    material: m.shaft,
  }
  facade(out, fit, spec)
  if (s.wall === 'brickStone' || s.wall === 'brick') stoneLines(out, ring, H, groundH, n, m.trim)
  const i = frontEdge(ring)
  const e = edgeAt(ring, i)
  const q = new MeshBuilder()
  axis(q, s, e.L, H, groundH, m.trim, fit.grade ?? 0)
  placed(out, q, e.heading, e.mid.x, e.mid.z)
  if (s.word) {
    sign(out, { type: 'flat', text: s.word, h: Math.min(0.6, (Math.min(e.L * 0.2, 4) * 2 + 2) / Math.max(4, s.word.length) / 0.62), face: 'engraved', colour: [0.13, 0.13, 0.14], lit: 'none', standoff: s.centre === 'door' ? 0.2 : 0.8 },
      { ring, edge: i, y: (fit.grade ?? 0) + Math.min(3.4, groundH - 0.5) + 0.72 })
  }
  // no two of a kind quite the same: the whole building's colour moved a little, by its seed
  const t = 0.95 + (((s.seed ?? 0) * 2654435761) >>> 0) / 4294967296 * 0.1
  for (let k = from; k < out.colors.length; k += 4) { out.colors[k] *= t; out.colors[k + 1] *= t; out.colors[k + 2] *= t }
}
