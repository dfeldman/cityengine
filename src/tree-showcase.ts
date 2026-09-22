/**
 * San Francisco's street trees on their own (tools/sftrees, render/palms.ts), to be judged side by side before
 * there is a city round them — every species of the SF library in a row, two of each, then the four palms, on a
 * pavement with a 1.8 m figure and a three-storey wall for scale:
 *
 *     ?trees=sf               the rows
 *     ?trees=sf&lod=1         at a given level of detail
 *
 * `window.__treeView(alpha, beta, radius, tx, ty, tz)` moves the camera for tools/tree-shots.ts; the species'
 * x positions are in `window.__treeRow` so the tool can frame each one.
 */
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import '@babylonjs/loaders/glTF'
import { MeshBuilder } from './render/buildings.ts'
import { box } from './render/models.ts'
import { palmModel, type PalmKind } from './render/palms.ts'

interface Entry { species: string; file: string; bounds: { top: number } }

export async function treeShowcase(canvas: HTMLCanvasElement, lod: 0 | 1 | 2): Promise<void> {
  const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true }, true)
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.62, 0.74, 0.88, 1)
  const sky = new HemisphericLight('sky', new Vector3(0, 1, 0), scene)
  sky.intensity = 0.8
  sky.groundColor = new Color3(0.35, 0.33, 0.3)
  const sun = new DirectionalLight('sun', new Vector3(-0.5, -0.8, 0.35), scene)
  sun.intensity = 1.5
  sun.diffuse = new Color3(1, 0.96, 0.88)

  const base = new URL('sftrees/', document.baseURI).href
  const index = (await (await fetch(`${base}index.json`)).json()) as { trees: Entry[] }
  const species = [...new Set(index.trees.map((t) => t.species))]
  const row: Record<string, number> = {}
  let x = 0
  const lodName = `LOD${lod}`
  for (const sp of species) {
    const of = index.trees.filter((t) => t.species === sp)
    row[sp] = x + 4
    for (const t of [of[Math.floor(of.length / 3)], of[of.length - 1]]) {
      const r = await SceneLoader.ImportMeshAsync('', base, t.file, scene)
      const root = r.meshes[0]
      root.position.x = x
      for (const m of r.meshes) if (m instanceof Mesh && m.getTotalVertices() > 0 && !m.name.startsWith(lodName)) m.setEnabled(false)
      for (const m of r.transformNodes) if (/^LOD\d$/.test(m.name) && m.name !== lodName) m.setEnabled(false)
      x += 8
    }
    x += 4
  }
  const palms = new URL('palms/', document.baseURI).href
  for (const [kind, seed] of [['canary', 1], ['fan', 2], ['queen', 3], ['spiky', 4]] as [PalmKind, number][]) {
    row[`palm:${kind}`] = x + 4
    for (let i = 0; i < 2; i++) {
      const m = palmModel(scene, palms, kind, 1000 * seed + i * 7919)
      const keep = lod === 0 ? m.parts : lod === 1 ? m.far : m.farther
      for (const part of [...m.parts, ...m.far, ...m.farther]) {
        part.renderingGroupId = 0
        if (!keep.includes(part)) part.setEnabled(false)
        else part.position.set(x, 0, 0)
      }
      x += 8
    }
    x += 4
  }

  // the pavement, a figure and a wall for scale
  const g = new MeshBuilder()
  box(g, x / 2, -0.05, 0, x / 2 + 20, 0.05, 20, [0.6, 0.6, 0.58], 0)
  box(g, -6, 0.9, -3, 0.22, 0.9, 0.15, [0.2, 0.3, 0.6], 0)
  box(g, x / 2, 5, 14, x / 2 + 10, 5, 2, [0.85, 0.8, 0.72], 0)           // a three-storey frontage behind
  const gm = new Mesh('ground', scene)
  g.toVertexData().applyToMesh(gm)
  const mat = new StandardMaterial('ground', scene)
  mat.specularColor = new Color3(0, 0, 0)
  gm.material = mat
  gm.useVertexColors = true

  const camera = new ArcRotateCamera('cam', -Math.PI / 2, 1.35, 40, new Vector3(20, 6, 0), scene)
  camera.attachControl(canvas, true)
  camera.minZ = 0.1
  const w = window as unknown as Record<string, unknown>
  w.__treeRow = row
  w.__treeView = (alpha: number, beta: number, radius: number, tx: number, ty: number, tz = 0) => {
    // the target first: ArcRotateCamera's target setter recomputes alpha, beta and radius from where it stands
    camera.target = new Vector3(tx, ty, tz); camera.alpha = alpha; camera.beta = beta; camera.radius = radius
  }
  engine.runRenderLoop(() => scene.render())
  addEventListener('resize', () => engine.resize())
  await scene.whenReadyAsync()
  w.treesReady = true
}
