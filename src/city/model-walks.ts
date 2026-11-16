/**
 * Region `modelWalks` (city/region.ts): a model that draws its own paved levels, the Trocadéro's parvis. The bake sets OSM's
 * walks on it to the model's level (tools/bake.ts); here the renderer asks which walks those are, so it leaves their
 * surface to the model's paving: with the ground sunk under the parvis (regions.json `terrainTweaks`), a walk at the
 * paving's height stood clear of the ground and was drawn as a grey flat ribbon down the axis (owner, 2026-11-16).
 */
import type { Projection } from './geo.ts'

export interface ModelWalkSpec { at: [number, number]; rotateDeg: number; levels: [number, number, number, number, number, number][] }

/** A test for local points: is (x, z) on one of the models' levels? The same frame and rects as tools/bake.ts. */
export function modelLevelTest(specs: ModelWalkSpec[] | undefined, proj: Projection): ((x: number, z: number) => boolean) | null {
  if (!specs?.length) return null
  const ms = specs.map((m) => ({ c: proj.toLocal({ lat: m.at[0], lon: m.at[1] }), cos: Math.cos((m.rotateDeg * Math.PI) / 180), sin: Math.sin((m.rotateDeg * Math.PI) / 180), levels: m.levels }))
  return (x, z) => ms.some(({ c, cos, sin, levels }) => {
    const dx = x - c.x, dz = z - c.z, lx = dx * cos - dz * sin, lz = dx * sin + dz * cos
    return levels.some(([x0, x1, z0, z1]) => lx >= x0 && lx <= x1 && lz >= z0 && lz <= z1)
  })
}
