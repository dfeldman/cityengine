/**
 * WHERE THE GRASS IS, AND WHICH GRASS (docs/GRASS-PLAN.md, owner 2026-11-26: grass that "needs to look GREAT").
 *
 * Near-field grass (shells or blades) must stand only on a lawn: never on a park's path, a paved square mapped
 * inside a park, a pond, or a sports court. The ground shader knows this for free (it is drawn on the polygon).
 * Geometry that follows the rider does not, so this rasterises each tile once, at GM.cell metres, into one
 * byte per cell:
 *
 *   0 none   1 manicured (pitches, garden lawns)   2 lawn (an ordinary park)   3 unkempt   4 meadow
 *
 * in the same painter's order the areas mesh draws in (city.ts `rank`): paved squares under the parks,
 * lawns over the parks, bare ground and pitches over the lawns. Then every cell on a way, footways included,
 * is cleared with the same `Carriageways.onPaving` test that keeps plants off the trails.
 *
 * `near()` copies the cells round the rider into one R8 texture that the grass's vertex shader reads, so no
 * per-blade CPU work is ever done. It is redone only when the rider has moved GM.recentre metres.
 */
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Constants } from '@babylonjs/core/Engines/constants'
import type { Scene } from '@babylonjs/core/scene'
import { Carriageways } from '../city/carriageways.ts'
import type { TileArea } from '../city/tiles.ts'
import type { PackedEdge } from '../city/package.ts'

export const GM = {
  /** raster cell (m) */
  cell: 1,
  /** a PARK whose whole polygon is bigger than this (m²) is meadow, when the caller can say (`fullArea`); mapped grass stays lawn */
  meadowArea: 1000000,
  /** paths cleared this far beyond their edge (m) */
  pathClear: 0.25,
  /** the rider's window: cells across, and how far the rider moves (m) before it is redrawn */
  window: 128, recentre: 8,
  /** the height window's cells across (it spans the same metres as the type window) and the lift (m) over the drape */
  heightCells: 65, lift: 0.02, liftSlope: 0.8, liftMax: 0.8, shellLiftKeep: 0.15,
}

export const GRASS_NONE = 0, GRASS_MANICURED = 1, GRASS_LAWN = 2, GRASS_UNKEMPT = 3, GRASS_MEADOW = 4

type Rect = { x0: number; z0: number; x1: number; z1: number }

/** the painter's rank (render/city.ts) and what each kind leaves in the cell */
function rankOf(a: TileArea): number {
  return a.kind === 'paved' || a.kind === 'lot' ? 0 : a.kind === 'sand' || a.kind === 'dirt' ? 2 : a.beds ? 1.5
    : a.kind === 'grass' ? 1.6 : a.kind === 'pitch' ? 1.7 : 1
}

export interface GrassMaskOptions {
  /** the whole polygon's area (m²) for a tile piece (`TileArea.of`); tile pieces are clipped, so the piece alone undercounts */
  fullArea?: (of: number) => number
  /** inside a dry zone (Marin): any grass there is meadow */
  dry?: (x: number, z: number) => boolean
  /** the ground under a park (Terrain.grassHeightAt, what the areas mesh is draped on): fills the height window */
  heightAt?: (x: number, z: number) => number
  /** shapes painted over the areas, in order (a formal garden's lawns, manicured, and its gravel and beds, none) */
  extra?: (rect: Rect) => { ring: number[]; type: number }[]
}

/** Even-odd scanline fill of a ring and its holes into the tile raster. */
function fill(out: Uint8Array, n: number, rect: Rect, rings: number[][], value: number | ((x: number, z: number) => number)): void {
  const c = GM.cell
  const xs: number[] = []
  for (let row = 0; row < n; row++) {
    const z = rect.z0 + (row + 0.5) * c
    xs.length = 0
    for (const r of rings) {
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        const za = r[j + 1], zb = r[i + 1]
        if ((za > z) === (zb > z)) continue
        xs.push(r[j] + (z - za) / (zb - za) * (r[i] - r[j]))
      }
    }
    if (xs.length < 2) continue
    xs.sort((p, q) => p - q)
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const c0 = Math.max(0, Math.ceil((xs[k] - rect.x0) / c - 0.5)), c1 = Math.min(n - 1, Math.floor((xs[k + 1] - rect.x0) / c - 0.5))
      for (let col = c0; col <= c1; col++) {
        out[row * n + col] = typeof value === 'number' ? value : value(rect.x0 + (col + 0.5) * c, z)
      }
    }
  }
}

/** One tile's raster: n×n bytes, row-major from (x0, z0). */
export function rasterTile(areas: TileArea[], edges: PackedEdge[] | undefined, rect: Rect, opt: GrassMaskOptions = {}): Uint8Array {
  const n = Math.round((rect.x1 - rect.x0) / GM.cell)
  const out = new Uint8Array(n * n)
  for (const a of [...areas].sort((p, q) => rankOf(p) - rankOf(q))) {
    let type = GRASS_NONE
    if (a.kind === 'pitch' || (a.kind === 'park' && a.garden)) type = GRASS_MANICURED
    else if ((a.kind === 'park' && !a.beds) || a.kind === 'grass') {
      // (a mapped lawn and a park's own ground are mown lawn; meadow only where `fullArea` is known and over
      //  GM.meadowArea, or in a dry zone. city.ts grassKind keeps the same rules)
      const area = opt.fullArea ? opt.fullArea(a.of) : 0
      type = (a.kind === 'park' && a.meadow) || area > GM.meadowArea ? GRASS_MEADOW : GRASS_LAWN
    }
    // (wood is forest floor, beds are mulch: no grass, but they still paint over what is under them)
    const dry = opt.dry
    fill(out, n, rect, [a.ring, ...(a.holes ?? [])], type !== GRASS_NONE && dry ? (x, z) => dry(x, z) ? GRASS_MEADOW : type : type)
  }
  for (const e of opt.extra?.(rect) ?? []) fill(out, n, rect, [e.ring], e.type)
  if (edges && edges.length) {
    const ways = new Carriageways(edges, true)
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const i = row * n + col
        if (out[i] && ways.onPaving(rect.x0 + (col + 0.5) * GM.cell, rect.z0 + (row + 0.5) * GM.cell, GM.pathClear)) out[i] = GRASS_NONE
      }
    }
  }
  return out
}

/** Every built tile's raster, and the window round the rider as a texture for the grass shaders. */
export class GrassMask {
  private readonly tiles = new Map<string, { rect: Rect; cells: Uint8Array }>()
  private readonly bytes = new Uint8Array(GM.window * GM.window)
  private cx = Infinity
  private cz = Infinity
  private stale = true
  readonly texture: RawTexture
  /** the ground height over the same window, R32F, sampled with a hand bilinear (see GRASS_HEIGHT_GLSL) */
  readonly heightTexture: RawTexture | null = null
  private readonly heights: Float32Array
  /** the window's world corner (x0, z0) and its size (m): what a shader needs to look a point up */
  readonly origin = { x: 0, z: 0, size: GM.window * GM.cell }

  constructor(scene: Scene, private readonly opt: GrassMaskOptions = {}) {
    this.texture = new RawTexture(this.bytes, GM.window, GM.window, Constants.TEXTUREFORMAT_RED, scene, false, false,
      Texture.NEAREST_SAMPLINGMODE, Constants.TEXTURETYPE_UNSIGNED_BYTE)
    this.texture.wrapU = this.texture.wrapV = Texture.CLAMP_ADDRESSMODE
    const h = GM.heightCells
    this.heights = new Float32Array(h * h)
    if (opt.heightAt) {
      this.heightTexture = new RawTexture(this.heights, h, h, Constants.TEXTUREFORMAT_RED, scene, false, false,
        Texture.NEAREST_SAMPLINGMODE, Constants.TEXTURETYPE_FLOAT)
      this.heightTexture.wrapU = this.heightTexture.wrapV = Texture.CLAMP_ADDRESSMODE
    }
  }

  /** for city.ts's tile layers: rasterise as a tile is built near the rider, forget it when dropped */
  layer(range = 1): { name: string; range: number; build: (near: { key: string; tile: { areas: TileArea[]; edges: PackedEdge[] } }, rect: Rect) => never[]; release: (k: string) => void } {
    return {
      name: 'grass-mask',
      range,
      build: (near, rect) => { this.tiles.set(near.key, { rect, cells: rasterTile(near.tile.areas, near.tile.edges, rect, this.opt) }); this.stale = true; return [] },
      release: (k) => { if (this.tiles.delete(k)) this.stale = true },
    }
  }

  /** the type at a world point (CPU side: tests, placing a flower) */
  typeAt(x: number, z: number): number {
    for (const t of this.tiles.values()) {
      if (x < t.rect.x0 || x >= t.rect.x1 || z < t.rect.z0 || z >= t.rect.z1) continue
      const n = Math.round((t.rect.x1 - t.rect.x0) / GM.cell)
      return t.cells[Math.floor((z - t.rect.z0) / GM.cell) * n + Math.floor((x - t.rect.x0) / GM.cell)]
    }
    return GRASS_NONE
  }

  /** Each frame: cheap unless the rider has moved GM.recentre metres or a tile arrived. Returns true when redrawn. */
  near(x: number, z: number): boolean {
    if (!this.stale && Math.abs(x - this.cx) < GM.recentre && Math.abs(z - this.cz) < GM.recentre) return false
    this.cx = x; this.cz = z; this.stale = false
    const c = GM.cell, w = GM.window
    const x0 = Math.floor(x / c - w / 2) * c, z0 = Math.floor(z / c - w / 2) * c
    this.origin.x = x0; this.origin.z = z0
    this.bytes.fill(0)
    for (const t of this.tiles.values()) {
      if (t.rect.x1 <= x0 || t.rect.x0 >= x0 + w * c || t.rect.z1 <= z0 || t.rect.z0 >= z0 + w * c) continue
      const n = Math.round((t.rect.x1 - t.rect.x0) / c)
      const ox = Math.round((t.rect.x0 - x0) / c), oz = Math.round((t.rect.z0 - z0) / c)
      const r0 = Math.max(0, -oz), r1 = Math.min(n, w - oz), q0 = Math.max(0, -ox), q1 = Math.min(n, w - ox)
      for (let r = r0; r < r1; r++) {
        // (scaled by 50 so the shader reads type = round(texel * 255 / 50); NEAREST, so no blending between types)
        const src = t.cells.subarray(r * n + q0, r * n + q1)
        const dst = (oz + r) * w + ox + q0
        for (let q = 0; q < src.length; q++) this.bytes[dst + q] = src[q] * 50
      }
    }
    this.texture.update(this.bytes)
    const hAt = this.opt.heightAt
    if (hAt && this.heightTexture) {
      // (corner to corner: texel i sits at x0 + i * size / (cells - 1), so the hand bilinear meets the window's edges exactly)
      const h = GM.heightCells, step = (w * c) / (h - 1)
      for (let r = 0; r < h; r++) for (let q = 0; q < h; q++) this.heights[r * h + q] = hAt(x0 + q * step, z0 + r * step)
      // (the drawn ground is a coarser triangulation than these posts and the occluder sits just under it: on a slope the posts' own
      //  height runs below the surface by up to a post's rise, so lift by the local grade, or the blades stand in the hill)
      const hs = this.heights.slice()
      for (let r = 0; r < h; r++) for (let q = 0; q < h; q++) {
        const i = r * h + q, gx = (hs[r * h + Math.min(h - 1, q + 1)] - hs[r * h + Math.max(0, q - 1)]) / (2 * step)
        const gz = (hs[Math.min(h - 1, r + 1) * h + q] - hs[Math.max(0, r - 1) * h + q]) / (2 * step)
        this.heights[i] = hs[i] + Math.min(GM.liftMax, GM.lift + GM.liftSlope * Math.hypot(gx, gz))
      }
      this.heightTexture.update(this.heights)
    }
    return true
  }
}

/**
 * GLSL for a grass shader that has `uniform sampler2D uHeight` and `uniform vec3 uMaskO` (window x0, z0, size):
 * the ground height under a world point, bilinear by hand (R32F is not filterable everywhere).
 */
export const GRASS_HEIGHT_GLSL = `
uniform sampler2D uHeight;
float groundY(vec2 p) {
  float n = ${GM.heightCells.toFixed(1)};
  vec2 g = clamp((p - uMaskO.xy) / uMaskO.z, 0.0, 1.0) * (n - 1.0);
  vec2 i = min(floor(g), vec2(n - 2.0));
  vec2 f = g - i;
  vec2 t = (i + 0.5) / n;
  float d = 1.0 / n;
  float a = texture2D(uHeight, t).r, b = texture2D(uHeight, t + vec2(d, 0.0)).r;
  float c = texture2D(uHeight, t + vec2(0.0, d)).r, e = texture2D(uHeight, t + vec2(d, d)).r;
  return mix(mix(a, b, f.x), mix(c, e, f.x), f.y);
}
// the slope part of the lift groundY carries (shells, a few cm tall, give most of it back; cards, half a metre, keep it)
float groundLift(vec2 p) {
  float gx = groundY(p + vec2(1.0, 0.0)) - groundY(p - vec2(1.0, 0.0));
  float gz = groundY(p + vec2(0.0, 1.0)) - groundY(p - vec2(0.0, 1.0));
  return min(${GM.liftMax.toFixed(2)}, ${GM.liftSlope.toFixed(2)} * 0.5 * length(vec2(gx, gz)));
}
`
