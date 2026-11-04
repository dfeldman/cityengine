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
import { drawGuimardWord } from './paris/guimard-lettering.ts'

/**
 * The lettering as a per-tile layer (render/city.ts `TileLayer`): the entrances in the tile, turned to their
 * street by `bearing` (the city's own streets, which are there for any tile being built).
 */
export function metroSignsLayer(scene: Scene, terrain: Terrain, bearing: (x: number, z: number) => number,
  isGuimard: (x: number, z: number) => boolean = () => true): TileLayer {
  let mat: StandardMaterial | null = null
  return {
    name: 'metrosigns',
    build(near) {
      const at = near.tile.furniture.filter((f) => f.kind === 'metro' && isGuimard(f.x, f.z)).map((f) => ({ x: f.x, z: f.z, heading: bearing(f.x, f.z) }))
      if (at.length === 0) return []
      mat ??= signMaterial(scene)
      return [buildMetroSigns(scene, at, terrain, mat, `metrosigns:${near.key}`)]
    },
  }
}

/**
 * The lettering: drawn letter by letter as paths in Guimard's manner (render/paris/guimard-lettering.ts) — no font file.
 * Dark green on pale amber, in a pill with transparent corners so the oval rim of the model shows round it.
 */
function drawSign(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  ctx.clearRect(0, 0, W, H)
  const r = H / 2 - 3
  ctx.beginPath()
  ctx.moveTo(r + 3, 3); ctx.lineTo(W - r - 3, 3); ctx.arc(W - r - 3, H / 2, r, -Math.PI / 2, Math.PI / 2)
  ctx.lineTo(r + 3, H - 3); ctx.arc(r + 3, H / 2, r, Math.PI / 2, Math.PI * 1.5); ctx.closePath()
  ctx.fillStyle = '#e6d48a'
  ctx.fill()
  drawGuimardWord(ctx, 'METROPOLITAIN', r * 0.7, H * 0.12, W - r * 1.4, H * 0.76, '#1f4a3a')
}

function signMaterial(scene: Scene): StandardMaterial {
  const W = 1024
  const H = 200
  const tex = new DynamicTexture('metrosign', { width: W, height: H }, scene, true)
  tex.hasAlpha = true
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D
  drawSign(ctx, W, H)
  tex.update(false)
  const mat = new StandardMaterial('metrosign', scene)
  mat.diffuseTexture = tex
  mat.useAlphaFromDiffuseTexture = true
  mat.emissiveColor = new Color3(0.35, 0.33, 0.3)
  mat.specularColor = new Color3(0, 0, 0)
  // both faces drawn; the nearer of the two quads is always the one facing the viewer
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
    const y = terrain.heightAt(m.x, m.z) + 0.15 + 2.32
    const w = 0.72
    const h = 0.158
    // front (+z) face, and the back face read the right way round from behind
    out.quad([p(-w, y - h, 2.08), p(w, y - h, 2.08), p(w, y + h, 2.08), p(-w, y + h, 2.08)].reverse() as [number, number, number][],
      [s, 0, c], [[1, 0], [0, 0], [0, 1], [1, 1]], [1, 1, 1], 1)
    out.quad([p(w, y - h, 2.02), p(-w, y - h, 2.02), p(-w, y + h, 2.02), p(w, y + h, 2.02)].reverse() as [number, number, number][],
      [-s, 0, -c], [[1, 0], [0, 0], [0, 1], [1, 1]], [1, 1, 1], 1)
  }
  const mesh = new Mesh(name, scene)
  out.toVertexData().applyToMesh(mesh)
  mesh.material = mat
  mesh.renderingGroupId = 3
  mesh.isPickable = false
  return mesh
}
