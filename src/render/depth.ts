/**
 * Ambient occlusion, and why it is screen-space here.
 *
 * Everything in this city is drawn by hand-written shaders, so a shadow map would mean teaching each of them
 * to sample one — real work, and a lot of it. Screen-space ambient occlusion needs none of that: it reads
 * the depth buffer after the fact and darkens the creases, so it applies equally to a facade, a kerb, a car
 * and a tree without any of them knowing about it.
 *
 * It is not a substitute for real shadows — nothing here casts one across the street — but it is most of
 * what makes geometry look connected to the ground rather than pasted on it: the dark line where a wall
 * meets the pavement, under a parked car, beneath a tree, in a doorway. Those contacts are what the eye uses
 * to judge that a scene is solid.
 *
 * Kept deliberately subtle. AO strong enough to notice as an effect reads as dirt.
 */
import { SSAO2RenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline'
import type { Camera } from '@babylonjs/core/Cameras/camera'
import type { Scene } from '@babylonjs/core/scene'

export function ambientOcclusion(scene: Scene, camera: Camera): SSAO2RenderingPipeline | null {
  if (!SSAO2RenderingPipeline.IsSupported) return null

  // Half-resolution: AO is a low-frequency signal and nobody can tell, and it is the difference between
  // affordable and not on the machines this runs on.
  const ssao = new SSAO2RenderingPipeline('ssao', scene, { ssaoRatio: 0.5, blurRatio: 1 }, [camera])
  /*
   * Tuned down hard from the first attempt. At full strength a large flat facade a few metres from the
   * camera reads as occluded along its whole length — a whole building goes nearly black — which is not
   * ambient occlusion, it is a dirty lens. The radius is the scale of the things that genuinely occlude:
   * a kerb, a doorway reveal, the gap under a parked car, the base of a tree.
   */
  ssao.radius = 0.9
  ssao.totalStrength = 0.55
  ssao.base = 0.42            // how much light survives in a fully occluded crease
  ssao.samples = 16
  ssao.maxZ = 90              // only the near street; further off it is fogged and nobody can tell
  ssao.minZAspect = 0.25
  ssao.expensiveBlur = false
  return ssao
}
