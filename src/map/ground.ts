/**
 * The TERRAIN MODEL a bake ships (docs/MAP-FORMAT.md §5.7): coarse ground everywhere, fine ground only in tiles
 * that touch a fine-terrain zone — the big parks, the coast. The owner's rule (2026-09-28): fine detail is worth
 * having only where the ground itself is the scenery; under a street or a building it is noise, and shows as
 * bumpy roads and uneven feet.
 *
 * Zones decide the model; nothing downstream knows zones exist. Every baked height — a street's level, a
 * building's foot, a tree — samples `heightAt`, and `heightAt` is the RENDERER'S OWN arithmetic
 * (`Terrain.rawHeightAt`, city/terrain.ts) over exactly the blocks the tiles ship, rounded to decimetres exactly
 * as they ship. So what the bake measures and what the game draws are the same surface by construction — not
 * two samplings of one source that agree to within their noise (BUGS.md #38).
 *
 * Seams: a fine block next to a coarse tile is blended into the coarse surface over its outer `BLEND` metres,
 * reaching it exactly on the shared border, so the ground cannot crack or step between them.
 *
 * Code frame: x east, z north, metres, v2 datum frame.
 */
import { Terrain, type PackedTerrain, type TileTerrain } from '../city/terrain.ts'

/** A regular height grid, metres, row-major from (x0, z0). */
export interface Grid { x0: number; z0: number; step: number; cols: number; rows: number; h: ArrayLike<number> }

export const COARSE_STEP = 20
/** metres over which a fine block eases into a coarse neighbour */
export const BLEND = 24

const bilinear = (g: Grid, x: number, z: number): number => {
  const fx = (x - g.x0) / g.step
  const fz = (z - g.z0) / g.step
  const ix = Math.floor(fx)
  const iz = Math.floor(fz)
  const tx = fx - ix
  const tz = fz - iz
  const at = (c: number, r: number): number => g.h[Math.max(0, Math.min(g.rows - 1, r)) * g.cols + Math.max(0, Math.min(g.cols - 1, c))]
  const a = at(ix, iz) * (1 - tx) + at(ix + 1, iz) * tx
  const b = at(ix, iz + 1) * (1 - tx) + at(ix + 1, iz + 1) * tx
  return a * (1 - tz) + b * tz
}

export interface GroundModelInput {
  /** the whole city's coarse grid — what the index ships (as decimetres) */
  coarse: Grid
  /** the fine grid, where it was sampled; null for a city with none */
  fine: Grid | null
  /** "tx,tz" keys of the tiles that ship fine ground (they must lie inside the fine grid) */
  fineTiles: Set<string>
  /** every tile that ships a ground block at all, fine or coarse */
  tiles: Iterable<[number, number]>
  fineStep: number
  tile?: number
}

export class GroundModel {
  readonly tile: number
  readonly fineStep: number
  readonly fineTiles: Set<string>
  /** the blocks as they ship, by key */
  readonly blocks = new Map<string, TileTerrain>()
  /** the coarse grid as it ships (decimetres → metres, exactly what the client expands terrain.bin to) */
  readonly coarse: PackedTerrain
  /** the renderer's own sampler over all of the above */
  private readonly terrain: Terrain

  constructor(inp: GroundModelInput) {
    this.tile = inp.tile ?? 200
    this.fineStep = inp.fineStep
    this.fineTiles = inp.fineTiles
    const c = inp.coarse
    const q = new Float32Array(c.cols * c.rows)
    for (let i = 0; i < q.length; i++) q[i] = Math.max(-32768, Math.min(32767, Math.round(c.h[i] * 10))) / 10
    this.coarse = { x0: c.x0, z0: c.z0, step: c.step, cols: c.cols, rows: c.rows, heights: q }
    const coarseGrid: Grid = { ...c, h: q }
    this.terrain = new Terrain(this.coarse, this.tile)
    const T = this.tile
    for (const [tx, tz] of inp.tiles) {
      const fine = inp.fine !== null && this.fineTiles.has(`${tx},${tz}`)
      const step = fine ? this.fineStep : COARSE_STEP
      const cols = Math.round(T / step) + 1
      // how far a point is from the nearest neighbouring tile that ships coarse ground (the 8 around this one)
      const coarseNear: [number, number, number, number][] = []
      if (fine) {
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
          if ((dx || dz) && !this.fineTiles.has(`${tx + dx},${tz + dz}`)) {
            coarseNear.push([(tx + dx) * T, (tz + dz) * T, (tx + dx + 1) * T, (tz + dz + 1) * T])
          }
        }
      }
      const dm: number[] = []
      for (let r = 0; r < cols; r++) {
        for (let k = 0; k < cols; k++) {
          const x = tx * T + k * step
          const z = tz * T + r * step
          const base = bilinear(coarseGrid, x, z)
          let h = base
          if (fine) {
            let d = Infinity
            for (const [x0, z0, x1, z1] of coarseNear) {
              const ex = Math.max(x0 - x, 0, x - x1)
              const ez = Math.max(z0 - z, 0, z - z1)
              d = Math.min(d, Math.hypot(ex, ez))
            }
            const w = Math.min(1, d / BLEND)
            h = base + (bilinear(inp.fine!, x, z) - base) * w
          }
          dm.push(Math.max(-32768, Math.min(32767, Math.round(h * 10))))
        }
      }
      const b: TileTerrain = { step, cols, dm }
      this.blocks.set(`${tx},${tz}`, b)
      this.terrain.addTile(tx, tz, b)
    }
  }

  isFine(tx: number, tz: number): boolean { return this.fineTiles.has(`${tx},${tz}`) }

  /** The ground as the game will draw it (before the streets' levelling), metres. */
  heightAt(x: number, z: number): number { return this.terrain.rawHeightAt(x, z) }

  block(tx: number, tz: number): TileTerrain | undefined { return this.blocks.get(`${tx},${tz}`) }
}
