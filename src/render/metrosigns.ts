/**
 * The lettering on the Guimard métro entrances: "MÉTROPOLITAIN" in dark Art Nouveau capitals on the amber
 * enamel panel between the two lamp stems. The model (models.ts `guimardEntrance`) draws the panel; this puts
 * the word on it, both faces, in one texture and one mesh for the whole city. Placed exactly as the entrances
 * are (the furniture's position, turned along the nearest street — city.ts `streetBearing`).
 */
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import type { Terrain } from '../city/terrain.ts'
import type { TileLayer } from './city.ts'

/**
 * The lettering as a per-tile layer (render/city.ts `TileLayer`): the entrances in the tile, turned to their
 * street by `bearing` (the city's own streets, which are there for any tile being built).
 */
export function metroSignsLayer(scene: Scene, terrain: Terrain, bearing: (x: number, z: number) => number): TileLayer {
  let mat: StandardMaterial | null = null
  return {
    name: 'metrosigns',
    build(near) {
      const at = near.tile.furniture.filter((f) => f.kind === 'metro').map((f) => ({ x: f.x, z: f.z, heading: bearing(f.x, f.z) }))
      if (at.length === 0) return []
      mat ??= signMaterial(scene)
      return [buildMetroSigns(scene, at, terrain, mat, `metrosigns:${near.key}`)]
    },
  }
}

function signMaterial(scene: Scene): StandardMaterial {
  const W = 512
  const H = 72
  const tex = new DynamicTexture('metrosign', { width: W, height: H }, scene, true)
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D
  ctx.fillStyle = '#dcb64c'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#3a2f1a'
  ctx.lineWidth = 4
  ctx.strokeRect(4, 4, W - 8, H - 8)
  ctx.fillStyle = '#2a2416'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // Guimard's lettering is a soft, swelling capital; a condensed serif at weight is the nearest system face
  ctx.font = `700 46px "Didot", "Bodoni 72", Georgia, serif`
  let size = 46
  while (ctx.measureText('METROPOLITAIN').width > W - 30 && size > 20) ctx.font = `700 ${--size}px "Didot", "Bodoni 72", Georgia, serif`
  ctx.fillText('METROPOLITAIN', W / 2, H / 2 + 2)
  tex.update(false)
  const mat = new StandardMaterial('metrosign', scene)
  mat.diffuseTexture = tex
  mat.emissiveColor = new Color3(0.35, 0.33, 0.3)
  mat.specularColor = new Color3(0, 0, 0)
  // both faces drawn; the nearer of the two quads (9 cm apart) is always the one facing the viewer
  mat.backFaceCulling = false
  return mat
}

function buildMetroSigns(scene: Scene, at: { x: number; z: number; heading: number }[], terrain: Terrain,
  mat: StandardMaterial, name: string): Mesh {
  const out = new MeshBuilder()
  for (const m of at) {
    const s = Math.sin(m.heading)
    const c = Math.cos(m.heading)
    // the model's local frame: +z along the heading (the open end), +x to its side
    const p = (lx: number, ly: number, lz: number): [number, number, number] =>
      [m.x + lx * c + lz * s, ly, m.z - lx * s + lz * c]
    const y = terrain.heightAt(m.x, m.z) + 0.15 + 2.2
    const w = 0.52
    const h = 0.115
    // front (+z) face, and the back face read the right way round from behind
    out.quad([p(-w, y - h, 2.095), p(w, y - h, 2.095), p(w, y + h, 2.095), p(-w, y + h, 2.095)].reverse() as [number, number, number][],
      [s, 0, c], [[1, 0], [0, 0], [0, 1], [1, 1]], [1, 1, 1], 1)
    out.quad([p(w, y - h, 2.005), p(-w, y - h, 2.005), p(-w, y + h, 2.005), p(w, y + h, 2.005)].reverse() as [number, number, number][],
      [-s, 0, -c], [[1, 0], [0, 0], [0, 1], [1, 1]], [1, 1, 1], 1)
  }
  const mesh = new Mesh(name, scene)
  out.toVertexData().applyToMesh(mesh)
  mesh.material = mat
  mesh.renderingGroupId = 3
  mesh.isPickable = false
  return mesh
}
