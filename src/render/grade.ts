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

/**
 * THE FILM LOOK (render/post.ts, owner 2026-11-18: "sharp lines and flat colors"). Each is a strength; 0 leaves the
 * picture exactly as the plain grade made it.
 *   vibrance   saturates the dull colours more than the already-bright ones (plain saturation pushes paint to neon
 *              long before grey stone gets any colour)
 *   curve      a gentle S on luminance: deeper mid-shadows, livelier mid-lights, the toe kept so shade stays readable
 *   split      shade a touch cooler, light a touch warmer — what a camera on a sunny day sees
 *   vignette   the corners a little darker, which draws the eye to the rider
 *   grain      a fine moving noise: it breaks up flat fills and the banding in the sky's gradient
 */
export const FILM = { vibrance: 0.32, curve: 0.38, split: 1.0, vignette: 0.26, grain: 0.012 }  // (grain 0.032 changed ±8/255 every frame and shimmered in the shade, owner 2026-11-18: "shadows are flashing a lot")

const FRAGMENT = `
precision highp float;
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float exposure;
uniform float saturation;
uniform float contrast;
uniform float vibrance, curve, split, vignette, grain, time, aspect;
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(void) {
  vec3 c = texture2D(textureSampler, vUV).rgb * exposure;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, saturation);
  c = (c - 0.5) * contrast + 0.5;
  if (vibrance > 0.0) {
    float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
    float lv = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(lv), c, 1.0 + vibrance * (1.0 - clamp((mx - mn) * 2.2, 0.0, 1.0)));
  }
  if (curve > 0.0) {
    float lc = clamp(dot(c, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
    float ls = lc * lc * (3.0 - 2.0 * lc);
    ls = mix(ls, lc, 1.0 - smoothstep(0.0, 0.22, lc));  // keep the toe: shade must stay readable
    c *= mix(1.0, ls / max(lc, 1e-3), curve);
  }
  if (split > 0.0) {
    float ln = clamp(dot(c, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
    vec3 cool = vec3(-0.018, -0.004, 0.030), warm = vec3(0.028, 0.012, -0.022);
    c += split * mix(cool * (1.0 - ln), warm * ln, smoothstep(0.25, 0.75, ln));
  }
  // a soft shoulder: what the lift pushes past 0.85 is rolled off, not clipped flat (the sky, lit walls, paint)
  vec3 over = max(c - 0.85, 0.0);
  c = min(c, 0.85) + over / (1.0 + over * 4.0);
  if (vignette > 0.0) {
    vec2 v = (vUV - 0.5) * vec2(aspect, 1.0) / sqrt(aspect * aspect + 1.0) * 2.0;
    c *= 1.0 - vignette * smoothstep(0.35, 1.05, dot(v, v));
  }
  if (grain > 0.0) {
    float g = hash(gl_FragCoord.xy + fract(time) * 917.0) + hash(gl_FragCoord.yx * 1.37 + fract(time * 1.7) * 571.0) - 1.0;
    c += g * grain * (0.35 + 0.65 * (1.0 - abs(dot(c, vec3(0.333)) * 2.0 - 1.0)));
  }
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`

export function colourGrade(scene: Scene, camera: Camera, grade: Grade = GRADE,
  look: { film: boolean; vignette: boolean; grain: boolean } = { film: false, vignette: false, grain: false }): { grade: PostProcess; fxaa: FxaaPostProcess } {
  Effect.ShadersStore['streetGradeFragmentShader'] = FRAGMENT
  const engine = scene.getEngine()
  const pp = new PostProcess('grade', 'streetGrade', ['exposure', 'saturation', 'contrast', 'vibrance', 'curve', 'split', 'vignette', 'grain', 'time', 'aspect'],
    null, 1, camera, undefined, engine)
  // the strengths in use, shared with render/post.ts's dev hook (`__fx.set('curve', 0)`)
  const fx = {
    vibrance: look.film ? FILM.vibrance : 0, curve: look.film ? FILM.curve : 0, split: look.film ? FILM.split : 0,
    vignette: look.vignette ? FILM.vignette : 0, grain: look.grain ? FILM.grain : 0,
  }
  ;(window as unknown as { __gradeFx?: Record<string, number> }).__gradeFx = fx
  const t0 = performance.now()
  pp.onApply = (e) => {
    e.setFloat('exposure', grade.exposure)
    e.setFloat('saturation', grade.saturation)
    e.setFloat('contrast', grade.contrast)
    for (const k of Object.keys(fx) as (keyof typeof fx)[]) e.setFloat(k, fx[k])
    e.setFloat('time', (performance.now() - t0) / 1000)
    e.setFloat('aspect', pp.width / Math.max(1, pp.height))
  }
  const fxaa = new FxaaPostProcess('fxaa', 1, camera, undefined, engine)
  return { grade: pp, fxaa }
}
