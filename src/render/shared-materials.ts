/**
 * ONE COPY OF EACH LIBRARY MATERIAL, AND OF ITS TEXTURES (owner, 2026-10-29: "memory is hitting 3800mb").
 *
 * Every tree and plant GLB embeds its own bark and leaf: forty oak files arrive as forty `bark_oak`s, each with its
 * own four 512² maps, and every leaf card's 1024² atlas the same way. They are the same images under the same names
 * — checked in Paris: one size and one byte length per texture name, 39 names behind 365 textures in the Bois — but
 * nothing folded them, so riding round Paris loaded ~1,460 textures where 39 are different, a gigabyte and more of
 * GPU memory. (vegetation.ts `mergeMaterials` already meant to fold them, but keyed on the texture's url, which an
 * embedded image makes unique to its file, and it left the copies alive.)
 *
 * Called on each file's meshes as it is imported: a material whose name and base-colour texture name are already
 * known gives way to the first one, and is disposed with whichever of its textures nothing else uses.
 */
import type { Material } from '@babylonjs/core/Materials/material'
import type { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import type { Scene } from '@babylonjs/core/scene'
import { Constants } from '@babylonjs/core/Engines/constants'

const known = new WeakMap<Scene, Map<string, Material>>()

const keyOf = (mat: Material): string => {
  const t = mat as unknown as { albedoTexture?: { name?: string } | null; diffuseTexture?: { name?: string } | null }
  return `${mat.name}|${t.albedoTexture?.name ?? t.diffuseTexture?.name ?? ''}`
}

export function shareMaterials(scene: Scene, meshes: AbstractMesh[]): void {
  let by = known.get(scene)
  if (!by) known.set(scene, by = new Map())
  const dropped = new Set<Material>()
  for (const m of meshes) {
    const mat = m.material
    if (!mat) continue
    const k = keyOf(mat)
    const first = by.get(k)
    // (a first that has since been disposed is no first: this one takes its place)
    if (!first || first.getScene() !== scene || !scene.materials.includes(first)) { by.set(k, mat); continue }
    if (first === mat) continue
    m.material = first
    dropped.add(mat)
  }
  for (const mat of dropped) {
    if (scene.meshes.some((x) => x.material === mat)) continue
    const textures: BaseTexture[] = mat.getActiveTextures()
    mat.dispose(false, false)
    for (const t of textures) if (!scene.materials.some((q) => q.hasTexture(t))) t.dispose()
  }
}

/**
 * A glTF import with the dirty marking of ITS materials held off while they are set up (2026-11-16, the performance
 * audit). Babylon marks a material's submeshes dirty on every texture or mode it is given — `_markAllSubMeshesAsDirty`,
 * a walk over all of the scene's meshes, ~7,000 in Paris — and the glTF loader gives each material its maps one by one,
 * and the plants then set three modes more: ~20 ms a frame while tiles brought plants, most of it on materials
 * `shareMaterials` then threw away. `held.options` goes to the import (the loader names each material it makes);
 * `release` marks each one still alive once, whole. Only this import's materials: nothing another module makes is held.
 */
export function heldMaterials(): { options: { pluginOptions: { gltf: { onMaterialLoaded: (m: Material) => void } } }; release: (scene: Scene) => void } {
  const made: Material[] = []
  return {
    options: { pluginOptions: { gltf: { onMaterialLoaded: (m) => { m.blockDirtyMechanism = true; made.push(m) } } } },
    release(scene) {
      const alive = new Set(scene.materials)
      for (const m of made) {
        if (!m.blockDirtyMechanism) continue
        // (the setter's own markDirty only resets readiness, not the defines; markAsDirty walks the meshes once)
        ;(m as unknown as { _blockDirtyMechanism: boolean })._blockDirtyMechanism = false
        if (alive.has(m)) m.markAsDirty(Constants.MATERIAL_AllDirtyFlag)
      }
      made.length = 0
    },
  }
}
