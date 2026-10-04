/**
 * The last word on the picture: brightness, saturation and a little contrast, then FXAA (owner, 2026-10-01: "all
 * our postprocessing seems to make the resulting frames kind of dark and muddy… increase brightness and
 * saturation, and apply FXAA if necessary").
 *
 * Every material here writes its final colour itself (no Babylon image processing anywhere), and the one pass after
 * them, the ambient occlusion (render/depth.ts), can only darken. So the picture came out exactly as dark as the
 * sum of the shaders' lighting and the AO's creases, and nothing lifted it. This grade runs after the AO.
 *
 * FXAA because the AO renders the scene into a texture, and that texture has no MSAA: with AO on, the canvas's
 * `antialias` does nothing and every edge in the city was jagged.
 *
 * `?grade=exposure,saturation,contrast` tries other numbers (1,1,1 is the picture as the shaders made it);
 * `?without=grade` leaves both passes out.
 *
 * (From the `@babylonjs/core` barrel, which Vite pre-bundles whole: a deep import Street Runner has not used before
 * would make a live dev server re-bundle its dependencies under any open page.)
 */
import { Effect, FxaaPostProcess, PostProcess, type Camera, type Scene } from '@babylonjs/core'

export interface Grade { exposure: number; saturation: number; contrast: number }

export const GRADE: Grade = { exposure: 1.14, saturation: 1.28, contrast: 1.06 }
/**
 * The grade WITHOUT ambient occlusion (the phone tiers, src/tier.ts `ao: false`). GRADE's 1.14 exposure was set to lift
 * a picture the AO had darkened; with no AO to darken it, the same lift washed the phone's picture out (owner,
 * 2026-10-04: "something with the brightness and it is very light-colored graphics"). No lift, a little more contrast.
 */
export const GRADE_NO_AO: Grade = { exposure: 1.0, saturation: 1.24, contrast: 1.12 }

const FRAGMENT = `
precision highp float;
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float exposure;
uniform float saturation;
uniform float contrast;
void main(void) {
  vec3 c = texture2D(textureSampler, vUV).rgb * exposure;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, saturation);
  c = (c - 0.5) * contrast + 0.5;
  // a soft shoulder: what the lift pushes past 0.85 is rolled off, not clipped flat (the sky, lit walls, paint)
  vec3 over = max(c - 0.85, 0.0);
  c = min(c, 0.85) + over / (1.0 + over * 4.0);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`

export function colourGrade(scene: Scene, camera: Camera, grade: Grade = GRADE): { grade: PostProcess; fxaa: FxaaPostProcess } {
  Effect.ShadersStore['streetGradeFragmentShader'] = FRAGMENT
  const engine = scene.getEngine()
  const pp = new PostProcess('grade', 'streetGrade', ['exposure', 'saturation', 'contrast'], null, 1, camera, undefined, engine)
  pp.onApply = (e) => {
    e.setFloat('exposure', grade.exposure)
    e.setFloat('saturation', grade.saturation)
    e.setFloat('contrast', grade.contrast)
  }
  const fxaa = new FxaaPostProcess('fxaa', 1, camera, undefined, engine)
  return { grade: pp, fxaa }
}
