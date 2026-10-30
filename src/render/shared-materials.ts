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
