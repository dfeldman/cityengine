/**
 * The Wallace fountains from the owner's model (2026-11-03: "a decent wallace glb… use that as our wallace model"):
 * ONE GLB (`models/paris/wallace.glb`, packed by tools/glb/pack.ts with KTX2 textures, in the shared bucket through
 * the streetrunner asset index), loaded once and thin-instanced at every fountain OSM tags as a Wallace — 119 in
 * the paris-centre bake; its other 1,100-odd drinking fountains are other kinds and keep the tap — rather than one
 * statue-pool slot each (render/statues.ts keeps at most 24 models in memory,
 * and they are all the same model).
 *
 * Until the model arrives, and if it never does (no bucket, a failed load), the procedural stand-in
 * (render/paris/furniture.ts wallaceFountain) stands in the same instances: a fountain is never missing.
 *
 * A tile hands over its fountains as it is built (`add`) and takes them back as it is dropped (`release`); the
 * instance buffer is rebuilt on each change, which for a hundred-odd matrices costs nothing.
 *
 * ONE IS RED: the fountain on the Avenue d'Ivry (13e; OSM node 1306563646, colour=red; the owner, 2026-11-03), the
 * same casting painted red. It goes in a second instance group, the same geometry under a red finish.
 */
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import '@babylonjs/loaders/glTF/2.0'
import type { Scene } from '@babylonjs/core/scene'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { MeshBuilder } from '../buildings.ts'
import { cartoonMaterial } from '../cartoon-material.ts'
import { assetRootAndFile } from '../../assets.ts'
import { wallaceFountain } from './furniture.ts'

/** the real one: 2.71 m to the top of its finial */
export const WALLACE_HEIGHT = 2.71
export const WALLACE_MODEL = 'paris/wallace.glb'

interface Placement { x: number; y: number; z: number; heading: number; red?: boolean }

/** the red one (OSM node 1306563646) */
export const RED_WALLACE: [number, number] = [48.8242965, 2.3639241]
const RED: [number, number, number] = [0.62, 0.07, 0.06]

export class WallaceFountains {
  private readonly byTile = new Map<string, Placement[]>()
  /** the stand-in, instanced; dropped when the model is in */
  private standIn: Mesh | null
  /** the model's mesh, with the matrix that takes its own frame (as loaded, upright, foot near y 0) to a placement */
  private model: { mesh: Mesh; frame: Matrix; inverse: Matrix; minY: number; scale: number } | null = null
  /** the red group: a clone of whichever mesh is live, red */
  private redMesh: Mesh | null = null

  /** (`base` is the page's root, where `models/` is asked for — not the city's facades folder, which is what City.assets is) */
  constructor(private readonly scene: Scene, base = typeof document === 'undefined' ? '/' : new URL('./', document.baseURI).href) {
    const b = new MeshBuilder()
    wallaceFountain(b)
    const m = new Mesh('wallace:stand-in', scene)
    b.toVertexData().applyToMesh(m)
    m.material = cartoonMaterial(scene, 'cartoon')
    m.renderingGroupId = 3
    m.isPickable = false
    m.setEnabled(false)
    this.standIn = m
    void this.load(base)
  }

  add(tile: string, x: number, y: number, z: number, heading: number, red = false): void {
    const list = this.byTile.get(tile) ?? []
    list.push({ x, y, z, heading, red })
    this.byTile.set(tile, list)
    this.refresh()
  }

  release(tile: string): void {
    if (this.byTile.delete(tile)) this.refresh()
  }

  private async load(base: string): Promise<void> {
    try {
      // the KTX2 transcoder, served by the game itself (render/ktx2.ts); loaded here, not at import, as it reads
      // `document` when it is first run and this module is reached from render/city.ts by the node tests
      await import('../ktx2.ts')
      const r = await SceneLoader.ImportMeshAsync('', ...assetRootAndFile(`${base}models/`, WALLACE_MODEL), this.scene)
      const root = r.meshes.find((m) => m.name === '__root__') ?? r.meshes[0]
      const mesh = r.meshes.find((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0)
      if (!mesh) throw new Error('no mesh in it')
      // the model as the loader stands it (its root converts glTF's handedness): its height, and the foot's level
      const { min, max } = (root as AbstractMesh).getHierarchyBoundingVectors(true)
      const scale = WALLACE_HEIGHT / Math.max(0.01, max.y - min.y)
      mesh.computeWorldMatrix(true)
      const frame = mesh.getWorldMatrix().clone()
      for (const m of r.meshes) { m.renderingGroupId = 3; m.isPickable = false }
      mesh.alwaysSelectAsActiveMesh = false
      this.model = { mesh, frame, inverse: frame.clone().invert(), minY: min.y, scale }
      this.standIn?.dispose()
      this.standIn = null
      this.redMesh?.dispose()
      this.redMesh = null
      this.refresh()
    } catch (err) {
      console.warn(`wallace fountain: ${WALLACE_MODEL} did not load; the stand-in stays`, err)
    }
  }

  /** the red twin of the live mesh, made the first time a red fountain is placed */
  private red(): Mesh | null {
    if (this.redMesh) return this.redMesh
    if (this.model) {
      const m = this.model.mesh.clone('wallace:red', null, true, false) as Mesh
      const mat = this.model.mesh.material?.clone('wallace:red') as unknown as { albedoTexture?: unknown; albedoColor?: { set(r: number, g: number, b: number): void }; diffuseTexture?: unknown; diffuseColor?: { set(r: number, g: number, b: number): void } } | null
      if (mat) {
        // the casting's own texture is its green paint: dropped, so the colour is the paint; normals and occlusion stay
        if ('albedoColor' in mat) { mat.albedoTexture = null; mat.albedoColor?.set(...RED) }
        else if ('diffuseColor' in mat) { mat.diffuseTexture = null; mat.diffuseColor?.set(...RED) }
        m.material = mat as unknown as Mesh['material']
      }
      m.renderingGroupId = 3
      m.isPickable = false
      this.redMesh = m
    } else {
      const b = new MeshBuilder()
      wallaceFountain(b)
      for (let i = 0; i < b.colors.length; i += 4) { b.colors[i] = RED[0]; b.colors[i + 1] = RED[1]; b.colors[i + 2] = RED[2] }
      const m = new Mesh('wallace:red', this.scene)
      b.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(this.scene, 'cartoon')
      m.renderingGroupId = 3
      m.isPickable = false
      this.redMesh = m
    }
    return this.redMesh
  }

  /** every placement into the live meshes' instance buffers: the green ones, and the red one */
  private refresh(): void {
    const all = [...this.byTile.values()].flat()
    const live = this.model?.mesh ?? this.standIn
    if (!live) return
    this.fill(live, all.filter((p) => !p.red))
    const reds = all.filter((p) => p.red)
    if (reds.length || this.redMesh) { const r = this.red(); if (r) this.fill(r, reds) }
  }

  private fill(mesh: Mesh, all: Placement[]): void {
    if (all.length === 0) { mesh.thinInstanceCount = 0; mesh.setEnabled(false); return }
    const buf = new Float32Array(all.length * 16)
    const m = new Matrix()
    all.forEach((p, i) => {
      if (this.model) {
        // thin matrices apply in the mesh's own space, before its world matrix: T = W · D · W⁻¹ puts the model, as
        // loaded, at the placement D (scaled to its height, its foot at the pavement, turned to the street)
        const d = Matrix.Compose(new Vector3(this.model.scale, this.model.scale, this.model.scale), Quaternion.RotationAxis(Vector3.Up(), p.heading),
          new Vector3(p.x, p.y - this.model.minY * this.model.scale, p.z))
        this.model.frame.multiplyToRef(d, m)
        m.multiplyToRef(this.model.inverse, m)
      } else {
        Matrix.ComposeToRef(Vector3.One(), Quaternion.RotationAxis(Vector3.Up(), p.heading), new Vector3(p.x, p.y, p.z), m)
      }
      for (let k = 0; k < 16; k++) buf[i * 16 + k] = m.m[k]
    })
    mesh.thinInstanceSetBuffer('matrix', buf, 16)
    mesh.thinInstanceRefreshBoundingInfo(false)
    mesh.setEnabled(true)
  }

  dispose(): void {
    this.standIn?.dispose()
    this.model?.mesh.dispose(false, true)
    this.redMesh?.dispose()
    this.byTile.clear()
  }
}
