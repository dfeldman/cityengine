/**
 * The palms on their own (render/palms.ts), to be judged before there is a city round them:
 *
 *     ?palms=1                a row of each species — Canary date palms and Mexican fan palms — on grass,
 *                             beside a 1.8 m figure and a three-storey wall for scale
 *     ?palms=1&lod=1          at a given level of detail
 *     ?palms=1&view=close     the camera in under the crowns, looking up, as a rider sees them
 *
 * `window.__palmView(alpha, beta, radius, targetY)` moves the camera for the shot tool (tools/palm-shots.ts).
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
import { MeshBuilder } from './render/buildings.ts'
import { box } from './render/models.ts'
import { palmModel } from './render/palms.ts'

export async function palmShowcase(canvas: HTMLCanvasElement, lod: 0 | 1 | 2, close: boolean): Promise<void> {
  const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true }, true)
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.62, 0.74, 0.88, 1)
  const sky = new HemisphericLight('sky', new Vector3(0, 1, 0), scene)
  sky.intensity = 0.75
  sky.groundColor = new Color3(0.35, 0.33, 0.3)
  const sun = new DirectionalLight('sun', new Vector3(-0.5, -0.8, 0.35), scene)
  sun.intensity = 1.4
  sun.diffuse = new Color3(1, 0.96, 0.88)

  const base = new URL('palms/', document.baseURI).href
  let x = -24
  for (const [kind, n] of [['canary', 4], ['fan', 4]] as const) {
    for (let i = 0; i < n; i++) {
      const m = palmModel(scene, base, kind, 1000 * (kind === 'canary' ? 1 : 2) + i * 7919)
      const keep = lod === 0 ? m.parts : lod === 1 ? m.far : m.farther
      for (const part of [...m.parts, ...m.far, ...m.farther]) {
        part.renderingGroupId = 0
        if (!keep.includes(part)) part.setEnabled(false)
        else part.position.set(x, 0, kind === 'canary' ? 0 : 9)
      }
      x += kind === 'canary' ? 12 : 8
    }
    x = -18
  }

  // the ground, a figure and a wall for scale
  const g = new MeshBuilder()
  box(g, 0, -0.05, 4, 60, 0.05, 30, [0.36, 0.46, 0.26], 0)
  box(g, -30, 0.9, -4, 0.22, 0.9, 0.15, [0.2, 0.3, 0.6], 0)
  box(g, 40, 5, 4, 5, 5, 8, [0.85, 0.8, 0.72], 0)          // a three-storey block, off to the side
  const gm = new Mesh('ground', scene)
  g.toVertexData().applyToMesh(gm)
  const mat = new StandardMaterial('ground', scene)
  mat.specularColor = new Color3(0, 0, 0)
  gm.material = mat
  gm.useVertexColors = true

  const camera = new ArcRotateCamera('cam', -Math.PI / 2, close ? 1.75 : 1.28, close ? 12 : 60, new Vector3(0, close ? 7 : 7, 4), scene)
  camera.attachControl(canvas, true)
  camera.lowerRadiusLimit = 2
  camera.minZ = 0.1
  ;(window as unknown as Record<string, unknown>).__palmView = (alpha: number, beta: number, radius: number, ty: number, tx = 0, tz = 4) => {
    // the target first: ArcRotateCamera's target setter recomputes alpha, beta and radius from where it stands
    camera.target = new Vector3(tx, ty, tz); camera.alpha = alpha; camera.beta = beta; camera.radius = radius
  }
  engine.runRenderLoop(() => scene.render())
  addEventListener('resize', () => engine.resize())
  await scene.whenReadyAsync()
  ;(window as unknown as { palmsReady?: boolean }).palmsReady = true
}
