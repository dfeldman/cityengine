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
  /** a tint on the whole building, and the choice of its `style`, so that no two of a kind come out the same */
  seed?: number
  /** the variations a date allows, each drawn from the seed unless pinned here (a hand-corrected entry's `kit.style`) */
  style?: Partial<Style>
}

/**
 * What varies between two schools of one date: the axes a rider tells them apart by. `pickStyle` draws each from the seed,
 * within what the wall and the date allow (no balustrade on a 1960s school, no canopy on a 1700s hôtel).
 */
export interface Style {
  /** the ground storey: plain, banded stone (`rusticated`), or round arches (`arcade`, a market hall's or a hospital court's) */
  ground: 'plain' | 'rusticated' | 'arcade'
  /** the cornice under the roof */
  cornice: 'cornice' | 'dentil' | 'modillion' | 'bracketed' | 'none'
  /** stone chains up the outer corners */
  quoins: boolean
  /** a short top storey of small windows over the cornice */
  attic: boolean
  /** a terrace's edge: a solid parapet or turned balusters */
  edge: 'parapet' | 'balustrade'
  /** the windows, overriding the date's */
  windows: Windows | null
  /** the colour of the wall, an index into PALETTES[wall] (0 is the material's own) */
  hue: number
  /** a flat concrete canopy over the door, on a post-war front */
  canopy: boolean
  /** the side and back elevations' windows, when they are not the front's (a school's stair towers, a hospital's wards) */
  sides: Windows | null
  /** a post-war front's one bright colour: index into ACCENTS, or -1 for none (the door's surround, a fascia, a strip of panels) */
  accent: number
  /** a clock face in the frontispiece or the pediment (a mairie, a caserne, a school of the Third Republic) */
  clock: boolean
}

/** knobs: how often each variation comes up, 0–1 */
export const ODDS = { accent: 0.55, sides: 0.45, rusticated: 0.45, arcade: 0.18, quoins: 0.5, attic: 0.3, balustrade: 0.5, canopy: 0.6, clock: 0.35, windowSwap: 0.4 }

/** the colours a post-war civic front allows itself, once: Paris's school oranges, hospital greens, the 1970s' blues */
export const ACCENTS: Rgb[] = [[0.85, 0.42, 0.18], [0.25, 0.55, 0.42], [0.2, 0.4, 0.65], [0.9, 0.72, 0.2], [0.72, 0.2, 0.22], [0.55, 0.7, 0.75]]

/** wall tints by material, multiplied in: render's ochres and pinks, brick's reds and buffs, concrete's warm and cool greys */
export const PALETTES: Record<Wall, Rgb[]> = {
  stone: [[1, 1, 1], [1.02, 0.99, 0.93], [0.97, 0.97, 0.98], [1.03, 1, 0.9]],
  brickStone: [[1, 1, 1], [1.12, 0.92, 0.84], [0.88, 0.86, 0.9], [1.2, 1.05, 0.85]],
  brick: [[1, 1, 1], [1.25, 1.1, 0.9], [0.85, 0.8, 0.85], [1.1, 0.85, 0.75]],
  render: [[1, 1, 1], [1.05, 0.95, 0.78], [1.04, 0.9, 0.86], [0.92, 0.97, 0.97], [1.02, 1, 0.85], [1.06, 0.88, 0.72], [0.9, 0.95, 1.04]],
  concrete: [[1, 1, 1], [1.03, 1, 0.94], [0.95, 0.98, 1.02], [1.06, 0.95, 0.85], [1.04, 0.96, 0.9]],
  glass: [[1, 1, 1], [0.9, 1, 1.05], [1.05, 1.02, 0.95]],
}

/** a deterministic stream of numbers in [0,1) from the seed, one per call */
export function stream(seed: number): () => number {
  let h = (seed * 2654435761 + 0x9e3779b9) >>> 0
  return () => { h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h ^= h + Math.imul(h ^ (h >>> 7), 0x297a2d39); return ((h ^ (h >>> 14)) >>> 0) / 4294967296 }
}

export function pickStyle(s: CivicSpec): Style {
  const r = stream(s.seed ?? 0)
  const classical = s.wall === 'stone' || s.wall === 'brickStone'
  const modern = s.wall === 'concrete' || s.wall === 'glass' || s.wall === 'render'
  const swaps: Partial<Record<Windows, Windows[]>> = {
    dressed: ['pedimented', 'segmental', 'arched'], segmental: ['arched', 'dressed', 'vertical'], wide: ['vertical', 'balanced', 'arched'],
    horizontal: ['continuous', 'wide', 'small', 'vertical', 'bays', 'balanced'], balanced: ['wide', 'bays', 'vertical', 'horizontal', 'small'],
    arched: ['segmental', 'dressed', 'vertical'], continuous: ['horizontal', 'vertical', 'wide'], vertical: ['wide', 'balanced', 'continuous'],
  }
  const sw = swaps[s.windows]
  const st: Style = {
    ground: classical && r() < ODDS.rusticated ? 'rusticated' : (classical || s.wall === 'brick') && r() < ODDS.arcade ? 'arcade' : 'plain',
    cornice: classical ? (['cornice', 'dentil', 'modillion', 'bracketed'] as const)[Math.floor(r() * 4)] : s.wall === 'brick' ? (r() < 0.5 ? 'cornice' : 'dentil') : 'none',
    quoins: classical && s.wall === 'stone' && r() < ODDS.quoins,
    attic: classical && s.roof !== 'mansard' && r() < ODDS.attic,
    edge: classical && r() < ODDS.balustrade ? 'balustrade' : 'parapet',
    windows: sw && r() < ODDS.windowSwap ? sw[Math.floor(r() * sw.length)] : null,
    hue: Math.floor(r() * PALETTES[s.wall].length),
    canopy: modern && r() < ODDS.canopy,
    sides: r() < ODDS.sides ? (modern ? (['small', 'horizontal', 'vertical', 'balanced'] as const) : (['small', 'wide', 'vertical'] as const))[Math.floor(r() * 4) % (modern ? 4 : 3)] : null,
    accent: modern && r() < ODDS.accent ? Math.floor(r() * ACCENTS.length) : -1,
    clock: classical && s.centre !== 'door' && r() < ODDS.clock,
  }
  return { ...st, ...s.style }
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

/** a flat disc facing +z, a dozen sides */
function cylinderFace(q: MeshBuilder, x: number, y: number, z: number, r: number, c: Rgb): void {
  const N = 12
  for (let k = 0; k < N; k += 2) {
    const p = (j: number): [number, number, number] => [x + r * Math.cos((j / N) * Math.PI * 2), y + r * Math.sin((j / N) * Math.PI * 2), z]
    q.quad([[x, y, z], p(k), p(k + 1), p(k + 2)], [0, 0, 1], [[0.5, 0.5], [1, 0.5], [1, 1], [0.5, 1]], c, 0)
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
function axis(q: MeshBuilder, s: CivicSpec, st: Style, L: number, H: number, groundH: number, trim: Rgb, grade: number): void {
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
  // a clock in the middle of the frontispiece's top storey, or in the pediment's field
  if (st.clock && s.centre !== 'door') {
    const cy = s.centre === 'frontispiece' || s.centre === 'pavilions' ? H - 1.4 : H + 1.3
    const r = Math.min(0.9, L * 0.03)
    if (s.centre === 'pavilions' || cy < H) box(q, 0, cy, (s.centre === 'pavilions' ? 0.14 : proud) + 0.02, r + 0.15, r + 0.15, 0.02, trim)
    cylinderFace(q, 0, cy, (s.centre === 'pavilions' ? 0.14 : proud + (cy > H ? 0.3 : 0)) + 0.05, r, [0.93, 0.92, 0.86])
    box(q, 0, cy + r * 0.3, (s.centre === 'pavilions' ? 0.14 : proud + (cy > H ? 0.3 : 0)) + 0.07, 0.04, r * 0.3, 0.01, DEEP)
    box(q, r * 0.22, cy, (s.centre === 'pavilions' ? 0.14 : proud + (cy > H ? 0.3 : 0)) + 0.07, r * 0.22, 0.035, 0.01, DEEP)
  }
  // a post-war front's flat canopy, cantilevered over the door on two thin steel posts
  if (st.canopy && s.centre === 'door') {
    const cw = Math.min(L * 0.18, 4.5), cd = 2.2, cy = grade + Math.min(3.4, groundH - 0.5) + 0.35
    box(q, 0, cy, cd / 2 + 0.1, cw, 0.14, cd / 2, [0.7, 0.7, 0.68])
    for (const sx of [-1, 1]) box(q, sx * (cw - 0.3), grade + (cy - grade) / 2, cd - 0.2, 0.05, (cy - grade) / 2, 0.05, [0.2, 0.2, 0.22])
  }
  // the one colour: the door's surround, and a strip of panels up one side of it
  if (st.accent >= 0) {
    const c = ACCENTS[st.accent], dh = Math.min(3.4, groundH - 0.5)
    box(q, 0, grade + dh + 0.25, proud + 0.2, Math.min(2.6, L / 5) / 2 + 0.6, 0.25, 0.04, c)
    const sx = Math.min(L * 0.3, 7)
    for (let f = 1; f * groundH < H - 1; f++) box(q, sx, f * groundH + groundH * 0.5, 0.06, 0.9, groundH * 0.32, 0.04, c)
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
  const st = pickStyle(s)
  const want = st.windows ?? s.windows
  const moulded = want === 'segmental' || want === 'dressed' || want === 'pedimented'
  const windows: Windows = moulded && (perimeter / 3.8) * n > 200 ? 'wide' : want
  const groundH = H / n
  const attic = st.attic && n >= 3
  const shaftN = Math.max(1, (n >= 2 ? n - 1 : 1) - (attic ? 1 : 0))
  // (an arcade is the front's alone, its arches the width of the bays)
  const ground: FacadeSpec['ground'] = n < 2 ? null
    : st.ground === 'rusticated' ? { kind: 'rusticated', storeys: 1, material: m.base }
    : st.ground === 'arcade' ? { kind: 'arcade', arches: Math.max(3, Math.round(edgeAt(ring, frontEdge(ring)).L / 4.5)), storeys: 1, material: m.base, on: frontEdge(ring) }
    : { kind: 'plain', storeys: 1, material: m.base }
  const spec: FacadeSpec = {
    ground,
    shaft: { storeys: shaftN, windows: st.sides ? st.sides : windows, material: m.shaft, by: st.sides ? [{ on: frontEdge(ring), windows, material: m.shaft }] : undefined },
    top: attic ? { kind: 'attic', storeys: 1, material: m.base } : null,
    bands: { aboveGround: stoneish ? 'cornice' : 'string', belowTop: attic ? 'cornice' : null, top: st.cornice === 'none' ? null : st.cornice },
    crown: s.roof === 'terrace' ? (st.edge === 'balustrade' ? { kind: 'balustrade', height: 0.9, pier: true } : { kind: 'parapet', height: s.wall === 'glass' ? 0.3 : 0.7 })
      : s.roof === 'mansard' ? { kind: 'mansard', height: 3.2, inset: 1.1, colour: SLATE, dormers: 3 }
      : { kind: 'hip', height: Math.min(4.5, 2 + fit.hz * 0.2), inset: 0.3, colour: SLATE },
    frame: st.quoins ? { verticals: { kind: 'quoins', width: 0.8, at: 'corners' }, horizontals: null, recess: 0, material: m.base } : null,
    entrance: null,
    material: m.shaft,
  }
  facade(out, fit, spec)
  if (s.wall === 'brickStone' || s.wall === 'brick') stoneLines(out, ring, H, groundH, n, m.trim)
  const i = frontEdge(ring)
  const e = edgeAt(ring, i)
  const q = new MeshBuilder()
  axis(q, s, st, e.L, H, groundH, m.trim, fit.grade ?? 0)
  placed(out, q, e.heading, e.mid.x, e.mid.z)
  if (s.word) {
    sign(out, { type: 'flat', text: s.word, h: Math.min(0.6, (Math.min(e.L * 0.2, 4) * 2 + 2) / Math.max(4, s.word.length) / 0.62), face: 'engraved', colour: [0.13, 0.13, 0.14], lit: 'none', standoff: s.centre === 'door' ? 0.2 : 0.8 },
      { ring, edge: i, y: (fit.grade ?? 0) + Math.min(3.4, groundH - 0.5) + 0.72 })
  }
  // no two of a kind quite the same: the whole building's colour moved a little, by its seed
  // and the wall's hue from its palette (the trim and the glass take it too, at a third)
  const t = 0.95 + (((s.seed ?? 0) * 2654435761) >>> 0) / 4294967296 * 0.1
  const hue = PALETTES[s.wall][st.hue % PALETTES[s.wall].length]
  for (let k = from; k < out.colors.length; k += 4) {
    const c = out.colors
    const dark = c[k] + c[k + 1] + c[k + 2] < 0.75 // windows, doors, slate: keep their own
    for (let j = 0; j < 3; j++) c[k + j] = Math.min(1, c[k + j] * t * (dark ? 1 : hue[j]))
  }
}
