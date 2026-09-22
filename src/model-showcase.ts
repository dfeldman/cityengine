/**
 * One procedural landmark on its own (render/landmarks/procedural.ts), to be judged against its reference
 * photographs before it goes into a city:
 *
 *     ?model=goldenGateBridge          the model on water, in daylight
 *
 * `window.__modelView(alpha, beta, radius, tx, ty, tz)` moves the camera for tools/model-shots.ts, and
 * `window.__rebuild(fit)` builds the model again to a given fit — a real footprint (a tower-grammar building is
 * its own outline raised), which the tool reads from the Overpass cache — and returns its bounds.
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
import { PROCEDURAL } from './render/landmarks/procedural.ts'
import { SF_VEHICLES } from './render/sf/trains.ts'

export async function modelShowcase(canvas: HTMLCanvasElement, name: string, size: number): Promise<void> {
  const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true }, true)
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.6, 0.73, 0.88, 1)
  const sky = new HemisphericLight('sky', new Vector3(0, 1, 0), scene)
  sky.intensity = 0.7
  sky.groundColor = new Color3(0.3, 0.32, 0.34)
  const sun = new DirectionalLight('sun', new Vector3(-0.45, -0.75, 0.5), scene)
  sun.intensity = 1.3
  sun.diffuse = new Color3(1, 0.96, 0.9)
  // a landmark builder, or a vehicle (the rolling stock's models, which take no fit)
  const vehicle = (SF_VEHICLES as Record<string, ((o: MeshBuilder) => void) | undefined>)[name]
  const build = PROCEDURAL[name] ?? (vehicle ? (o: MeshBuilder) => vehicle(o) : undefined)
  let mb = new MeshBuilder()
  if (build) build(mb, { hx: size / 2, hz: size / 2, height: size })
  const m = new Mesh(name, scene)
  mb.toVertexData().applyToMesh(m, true)
  // vertex colours, the tag in alpha ignored
  // (a BODY-tagged panel — alpha 1 — takes a copy's livery in the game; here a maroon stands in for it)
  const cols = m.getVerticesData('color')
  if (cols) {
    for (let i = 0; i < cols.length; i += 4) {
      if (vehicle && cols[i + 3] > 0.9) { cols[i] *= 0.52; cols[i + 1] *= 0.14; cols[i + 2] *= 0.14 }
      cols[i + 3] = 1
    }
    m.setVerticesData('color', cols)
  }
  const mat = new StandardMaterial('model', scene)
  mat.specularColor = new Color3(0.08, 0.08, 0.08)
  m.material = mat
  m.useVertexColors = true
  const g = new MeshBuilder()
  box(g, 0, -0.5, 0, 6000, 0.5, 6000, [0.2, 0.32, 0.4], 0)
  const gm = new Mesh('water', scene)
  g.toVertexData().applyToMesh(gm)
  const gmat = new StandardMaterial('water', scene)
  gmat.specularColor = new Color3(0.2, 0.2, 0.2)
  gm.material = gmat
  gm.useVertexColors = true
  const camera = new ArcRotateCamera('cam', -2.2, 1.3, size * 3, new Vector3(0, size * 0.3, 0), scene)
  camera.attachControl(canvas, true)
  camera.minZ = 0.5
  camera.maxZ = 20000
  ;(window as unknown as Record<string, unknown>).__modelView = (alpha: number, beta: number, radius: number, tx = 0, ty = 0, tz = 0) => {
    camera.target = new Vector3(tx, ty, tz); camera.alpha = alpha; camera.beta = beta; camera.radius = radius
  }
  ;(window as unknown as Record<string, unknown>).__modelTris = mb.triangles
  ;(window as unknown as Record<string, unknown>).__rebuild = (fit: { hx: number; hz: number; height: number; ring?: { x: number; z: number }[] }) => {
    mb = new MeshBuilder()
    if (build) build(mb, fit)
    mb.toVertexData().applyToMesh(m, true)
    const c = m.getVerticesData('color')
    if (c) { for (let i = 3; i < c.length; i += 4) c[i] = 1; m.setVerticesData('color', c) }
    m.refreshBoundingInfo()
    const b = m.getBoundingInfo().boundingBox
    ;(window as unknown as Record<string, unknown>).__modelTris = mb.triangles
    return { min: b.minimumWorld.asArray(), max: b.maximumWorld.asArray(), triangles: mb.triangles }
  }
  engine.runRenderLoop(() => scene.render())
  addEventListener('resize', () => engine.resize())
  await scene.whenReadyAsync()
  ;(window as unknown as { modelReady?: boolean }).modelReady = true
}
