/**
 * THE CAMERA OBSCURA'S TABLE (owner, 2026-10-06: "we could even have a special feature where you push O to observe in
 * the camera obscura"). Inside the Giant Camera the view through the turning lens on its roof is thrown down onto a
 * round white dish in a dark room: an oval of soft, slightly cold daylight, the horizon bowed up at its sides by the
 * dish, the picture fading to grey at its rim, everything round it black.
 *
 * A post-process on the game camera, which game.ts puts at the lens and turns slowly: the whole frame is squeezed
 * onto the table, so whatever the camera sees is what the table shows. Created on entering, disposed on leaving.
 */
import { Effect } from '@babylonjs/core/Materials/effect'
import { PostProcess } from '@babylonjs/core/PostProcesses/postProcess'
import type { Camera } from '@babylonjs/core/Cameras/camera'

const FRAGMENT = `
precision highp float;
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float aspect;
uniform float time;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main(void) {
  // the table, an oval seen from beside it, a little below the middle of the view
  vec2 p = vUV - vec2(0.5, 0.48);
  // (an oval about 2.4 times as wide as it is deep, whatever the screen's shape)
  vec2 e = vec2(p.x / 0.46, p.y / clamp(0.46 * aspect / 2.4, 0.2, 0.42));
  float r = length(e);
  if (r > 1.0) {
    // the dark room, the table's black rim catching a little light
    float rim = smoothstep(1.0, 1.015, r) * (1.0 - smoothstep(1.035, 1.06, r));
    float room = 0.012 + 0.02 * (1.0 - smoothstep(1.0, 1.9, r));
    gl_FragColor = vec4(vec3(room + 0.05 * rim), 1.0);
    return;
  }
  // the picture: the frame squeezed onto the oval, swelled a little at the middle, and bowed up at the sides by the dish
  vec2 s = 0.5 + e * 0.5 * (1.0 - 0.07 * r * r);
  s.y += 0.055 * e.x * e.x;
  vec2 d = vec2(0.0016, 0.0016 * aspect);
  vec3 c = texture2D(textureSampler, s).rgb * 0.4
         + (texture2D(textureSampler, s + vec2(d.x, 0.0)).rgb + texture2D(textureSampler, s - vec2(d.x, 0.0)).rgb
          + texture2D(textureSampler, s + vec2(0.0, d.y)).rgb + texture2D(textureSampler, s - vec2(0.0, d.y)).rgb) * 0.15;
  // a lens image on paper: less saturated, a touch cold, softer in contrast
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, 0.75);
  c = clamp((c - 0.5) * 1.12 + 0.47, 0.0, 1.0) * vec3(0.94, 0.97, 1.02);
  // brightest at the middle, the light falling off to the rim, and the dish's own grain
  c *= mix(0.9, 0.32, smoothstep(0.3, 1.0, r));
  c += (hash(vUV * 731.0 + floor(time * 24.0)) - 0.5) * 0.025;
  gl_FragColor = vec4(c, 1.0);
}
`

let registered = false

export function obscuraView(camera: Camera): { dispose(): void } {
  if (!registered) {
    Effect.ShadersStore['obscuraFragmentShader'] = FRAGMENT
    registered = true
  }
  const pp = new PostProcess('obscura', 'obscura', ['aspect', 'time'], null, 1.0, camera)
  pp.onApply = (effect) => {
    effect.setFloat('aspect', pp.width / Math.max(1, pp.height))
    effect.setFloat('time', performance.now() / 1000)
  }
  return { dispose: () => pp.dispose(camera) }
}
