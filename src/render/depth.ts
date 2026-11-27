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
import type { GeometryBufferRenderer } from '@babylonjs/core/Rendering/geometryBufferRenderer'

/**
 * Every AO number in one place. `?aoratio=`, `?aoblur=`, `?aosamples=`, `?aobase=`, `?aostr=`, `?aoradius=` override
 * them for A/B tests (2026-11-26, owner: "test SSAO2 in terms of performance and quality").
 *
 * READ `base` CAREFULLY. Babylon's shader is `clamp(1 - totalStrength * occlusion + base, 0, 1)`: base is ADDED, it is
 * not the light that survives. The darkest a crease can get is `1 - totalStrength + base`, and any occlusion below
 * `base / totalStrength` clips to no AO at all. With the old 0.42 / 0.55 that was 76 %: almost nothing showed
 * (AO-only buffer min 241/255 at Hôtel de Ville and the Louvre), while desktop paid 3–5 ms of GPU at 5 MP for it.
 * The old "a whole facade goes black" problem came from the pre-pass depth (no depth on ShaderMaterials); the
 * geometry buffer (render/post.ts) fixed the input, so the clamp is no longer needed to hide it. Retuned 2026-11-27 (owner:
 * "keep AO in high graphics mode only"): the High tier only (src/tier.ts `ao`), always on the geometry buffer.
 */
export const AO = {
  ssaoRatio: 0.5,    // AO resolution share: a low-frequency signal
  blurRatio: 0.5,    // blur resolution share: two bilateral passes (were at full canvas size, 1)
  samples: 8,        // was 16; the blur hides the difference
  radius: 1.5,       // metres: kerb, doorway reveal, arcade, wall foot (was 0.9)
  totalStrength: 1.0, // the darkest crease is 1 - totalStrength + base (was 0.55)
  base: 0,           // ADDED to the result, see above; 0 lets the full range through (was 0.42)
  maxZ: 120,         // only the near street; further off it is fogged (was 90)
  minZAspect: 0.25,
}

/**
 * `gbuf`: depth from a GeometryBufferRenderer, which draws every mesh whatever its material (render/post.ts says why the
 * default pre-pass depth misses this city's ShaderMaterials). Without one, the pre-pass, as before.
 */
export function ambientOcclusion(scene: Scene, camera: Camera, gbuf: GeometryBufferRenderer | null = null): SSAO2RenderingPipeline | null {
  if (!SSAO2RenderingPipeline.IsSupported) return null
  const q = new URLSearchParams(location.search)
  const n = (k: string, f: number): number => { const v = q.get(k); return v !== null && Number.isFinite(Number(v)) ? Number(v) : f }
  const ssao = new SSAO2RenderingPipeline('ssao', scene, { ssaoRatio: n('aoratio', AO.ssaoRatio), blurRatio: n('aoblur', AO.blurRatio) }, [camera], gbuf ?? false)
  ssao.radius = n('aoradius', AO.radius)
  ssao.totalStrength = n('aostr', AO.totalStrength)
  ssao.base = n('aobase', AO.base)
  ssao.samples = n('aosamples', AO.samples)
  ssao.maxZ = AO.maxZ
  ssao.minZAspect = AO.minZAspect
  ssao.expensiveBlur = false
  return ssao
}
