/**
 * WALLS BEFORE THE DEPTH CLEAR (owner, 2026-11-11: a trench's face and the river's sheet drew through the ground and the quay walls).
 * The ground's layers clear depth before each group (render/city.ts setupGroundLayers), so a wall drawn in the building group could
 * be hidden only by the coarse ground occluder, and nothing later was hidden by a wall. A wall mesh now draws in the BASE group with
 * the real ground — each hides the other by depth — and goes again, depth only, first in each later group (its name starts
 * `ground:occluder`, which render/city.ts ranks first), so the water, the areas, the roads and the buildings behind it stay hidden.
 */
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'

/** on; the groups the depth copies go in (render/city.ts GROUP: areas, road, building) */
export const WALLS_FIRST = true
const LATER = [1, 2, 3]

export function depthOnly(scene: Scene): StandardMaterial {
  const had = scene.getMaterialByName('occluder') as StandardMaterial | null
  if (had) return had
  const m = new StandardMaterial('occluder', scene)
  m.disableColorWrite = true
  m.disableLighting = true
  m.backFaceCulling = false
  return m
}

/** draw `m` in the base group and add its depth copies to the later groups; returns the copies (the caller disposes them with it) */
export function wallsFirst(scene: Scene, m: Mesh, tag: string): Mesh[] {
  if (!WALLS_FIRST) return []
  m.renderingGroupId = 0
  const out: Mesh[] = []
  for (const g of LATER) {
    const c = m.clone(`ground:occluder:${tag}:${g}`, null, true)
    if (!c) continue
    c.material = depthOnly(scene)
    c.renderingGroupId = g
    c.isPickable = false
    out.push(c)
  }
  return out
}
