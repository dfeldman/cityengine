/**
 * A street of one building per style, built with the real pipeline and nothing else, so that the facades can
 * be judged on their own before there is a city to put them in.
 *
 *     ?showcase=1                 one of each style, along a street
 *     ?showcase=1&style=haussmann eight buildings of one style, to see whether they vary enough
 *
 * This exists because the facade generator is the part of the game most likely to be wrong in a way no test
 * catches, and looking at it is the only way to find out. It is also what the Playwright shot tool points at.
 */
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import '@babylonjs/core/Materials/standardMaterial'
import { STYLES, chooseStyle, planFacade, type StyleId } from './city/facade.ts'
import { MeshBuilder, buildBuilding, rectangle, type AtlasManifest } from './render/buildings.ts'
import { facadeMaterial, updateEye } from './render/facade-material.ts'

const ASSETS = new URL('facades/', document.baseURI).href

export async function showcase(canvas: HTMLCanvasElement, only?: string): Promise<void> {
  const atlas = (await (await fetch(`${ASSETS}atlas.json`)).json()) as AtlasManifest
  const engine = new Engine(canvas, true, { antialias: true }, true)
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.72, 0.76, 0.82, 1)

  const street = new URLSearchParams(location.search).get('street') === '1'
  const ids: StyleId[] = only && STYLES.some((s) => s.id === only)
    ? (Array(8).fill(only) as StyleId[])
    : STYLES.map((s) => s.id)

  // One merged mesh per style, which is how the city will do it too.
  const byStyle = new Map<StyleId, MeshBuilder>()
  let x = 0
  const widths: number[] = []
  ids.forEach((id, i) => {
    const seed = 1000 + i * 37
    const plan = planFacade(id, seed, {})
    const w = 8 + (seed % 5) * 2.4
    const depth = 11 + (seed % 3) * 3
    widths.push(w)
    const out = byStyle.get(id) ?? new MeshBuilder()
    byStyle.set(id, out)
    // (`&street=1`: every wall a street front, so a dressed style's street ornament and the shop awnings show — a bench for
    //  the Haussmann fronts, ParisDress)
    // (the fronts on one line, as a street's are — owner, 2026-10-29: "the faces are mostly even against the sidewalk")
    buildBuilding(out, rectangle(w, depth, x + w / 2, depth / 2), plan, atlas, seed, 0, undefined, undefined,
      street ? () => ({ rate: 0.9, main: true, rise: 0, pavement: 4 }) : undefined)
    x += w + 0.6
  })

  let tris = 0
  for (const [id, out] of byStyle) {
    const mesh = new Mesh(`buildings:${id}`, scene)
    out.toVertexData().applyToMesh(mesh)
    mesh.material = facadeMaterial(scene, id, ASSETS)
    tris += out.triangles
  }

  // A road to stand them on, so they are not floating in fog.
  const ground = new Mesh('ground', scene)
  const g = new MeshBuilder()
  g.quad([[-40, -0.02, -60], [x + 40, -0.02, -60], [x + 40, -0.02, 40], [-40, -0.02, 40]],
    [0, 1, 0], [[0, 0], [60, 0], [60, 60], [0, 60]], [0.34, 0.34, 0.35], 0)
  g.toVertexData().applyToMesh(ground)
  ground.material = facadeMaterial(scene, 'brutalist', ASSETS)

  const camera = new ArcRotateCamera('cam', -Math.PI / 2.35, Math.PI / 2.55, Math.max(52, x * 0.85),
    new Vector3(x / 2, 9, 0), scene)
  camera.attachControl(canvas, true)
  camera.lowerRadiusLimit = 12
  camera.upperRadiusLimit = 400
  camera.wheelDeltaPercentage = 0.02

  engine.runRenderLoop(() => {
    updateEye(scene, camera.position)   // the glass needs to know where it is being looked at from
    scene.render()
  })
  addEventListener('resize', () => engine.resize())

  const label = document.getElementById('label')
  if (label) {
    label.textContent = only
      ? `${only} × ${ids.length} — ${tris.toLocaleString()} triangles`
      : `${ids.join('  ·  ')} — ${tris.toLocaleString()} triangles`
  }
  // the shot tool waits on this
  ;(window as unknown as { showcaseReady?: boolean; __showcaseScene?: Scene }).__showcaseScene = scene
  ;(window as unknown as { showcaseReady?: boolean }).showcaseReady = true
  void chooseStyle
  void Color3
}
