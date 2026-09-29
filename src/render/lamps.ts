/**
 * The traffic lights' LIVE lamps (2026-09-29). The signal models used to have every lens lit at once — red, amber
 * and green together — which was scenery; now the lights are timed (sim/signals.ts) and the rider has to read
 * them, so the models' lenses are dark and this lights the one that is on, for every head the renderer drew.
 *
 * Three instanced emissive discs (red, amber, green), each placed over the lens that should be lit, rebuilt a few
 * times a second — a few hundred heads at most, so the cost is nothing.
 */
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { CreateDisc } from '@babylonjs/core/Meshes/Builders/discBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import type { Aspect } from '../sim/signals.ts'

type V3 = [number, number, number]

/** One signal head: the approach it controls, and where its red, amber and green lenses are (world). */
export interface SignalHead {
  nodeId: number
  edgeId: number
  /** the way the head faces (the model's +z), radians */
  facing: number
  scale: number
  /** red, amber, green */
  at: [V3, V3, V3]
}

/**
 * The lenses of each region's signal model, in the model's own frame (render/models.ts: it faces +z), red first.
 * Must match `trafficLight`, `trafficLightParis`, `trafficLightMast` and `signalHead` there.
 */
export function signalLamps(style: string | undefined, reach: number): { scale: number; at: [V3, V3, V3] }[] {
  const head = (x: number, y: number, z: number, s: number): { scale: number; at: [V3, V3, V3] } => ({
    scale: s, at: [0.29, 0, -0.29].map((dy) => [x, y + dy * s, z + 0.121 * s + 0.006]) as [V3, V3, V3],
  })
  if (style === 'mastArm') {
    const arm = Math.max(2, reach)
    const xs = arm > 5 ? [arm * 0.55, arm * 0.95] : [arm * 0.9]
    return xs.map((hx) => head(-hx, 5.12, 0.02, 1))
  }
  if (style === 'paris') return [head(0, 2.6, 0.1, 0.8), head(0.14, 1.55, 0.05, 0.35)]
  // the plain post: lamp boxes at 3.66 / 3.35 / 3.04, fronts at z 0.15
  return [{ scale: 0.95, at: [[0, 3.66, 0.156], [0, 3.35, 0.156], [0, 3.04, 0.156]] }]
}

const COLOURS: [Aspect, Color3][] = [
  ['red', new Color3(1, 0.12, 0.08)], ['amber', new Color3(1, 0.62, 0.05)], ['green', new Color3(0.2, 1, 0.45)],
]

export class SignalLamps {
  private readonly meshes: Mesh[]
  private next = 0

  constructor(scene: Scene) {
    this.meshes = COLOURS.map(([name, c]) => {
      const m = CreateDisc(`lamp:${name}`, { radius: 0.105, tessellation: 12, sideOrientation: 2 }, scene)
      const mat = new StandardMaterial(`lamp:${name}`, scene)
      mat.emissiveColor = c
      mat.diffuseColor = Color3.Black()
      mat.specularColor = Color3.Black()
      mat.disableLighting = true
      mat.backFaceCulling = false
      m.material = mat
      m.isPickable = false
      m.renderingGroupId = 3
      m.alwaysSelectAsActiveMesh = true
      m.setEnabled(false)
      return m
    })
  }

  /**
   * Relight every head: `heads` are all the drawn ones (City.heads), `aspect` what each approach shows now. Cheap,
   * but only a few times a second — a light changes every few seconds.
   */
  update(now: number, heads: Iterable<SignalHead[]>, aspect: (nodeId: number, edgeId: number) => Aspect | null): void {
    if (now < this.next) return
    this.next = now + 100
    const lists: number[][] = [[], [], []]
    const m = new Matrix()
    for (const list of heads) {
      for (const h of list) {
        const a = aspect(h.nodeId, h.edgeId)
        if (!a) continue
        const k = a === 'red' ? 0 : a === 'amber' ? 1 : 2
        const [x, y, z] = h.at[k]
        // the disc faces −z in its own frame; turned to face the way the head does
        Matrix.ComposeToRef(new Vector3(h.scale, h.scale, h.scale), Quaternion.RotationAxis(Vector3.Up(), h.facing + Math.PI),
          new Vector3(x, y, z), m)
        for (let i = 0; i < 16; i++) lists[k].push(m.m[i])
      }
    }
    this.meshes.forEach((mesh, k) => {
      if (lists[k].length === 0) { mesh.thinInstanceCount = 0; mesh.setEnabled(false); return }
      mesh.thinInstanceSetBuffer('matrix', new Float32Array(lists[k]), 16)
      mesh.thinInstanceRefreshBoundingInfo(false)
      mesh.setEnabled(true)
    })
  }
}
