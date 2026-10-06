/**
 * BARE ROCK (owner, 2026-10-06: "anything we can do to improve the realism of the cliffs", with photographs of Lands
 * End's jointed grey greywacke). The cliffs were flat-shaded 2 m cells in one grey, a patchwork. This is a rock
 * SURFACE: photographed rock (Poly Haven via Trail Trainer, public/rocks/textures) projected from the three world
 * axes and blended by the face's normal — triplanar — so a cliff of any size and angle, or a sea stack, takes the
 * texture at a constant scale with nothing to unwrap and nothing stretched. Two rocks are mixed in patches tens of
 * metres across, a third darkens the hollows; the vertex colour is the builder's own tint (weathering, guano,
 * wet rock at the waterline).
 *
 * Lit as the city is (facade-material.ts DAYLIGHT): the sun on the face, the sky above and the ground below, fog.
 */
import type { Scene } from '@babylonjs/core/scene'
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { DAYLIGHT } from './facade-material.ts'

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
uniform mat4 world;
uniform mat4 viewProjection;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vColour;
varying float vDepth;
void main(void) {
  vec4 w = world * vec4(position, 1.0);
  vPos = w.xyz;
  vNormal = normalize(mat3(world) * normal);
  vColour = color.rgb;
  gl_Position = viewProjection * w;
  vDepth = gl_Position.w;
}
`

const FRAGMENT = `
precision highp float;
uniform sampler2D greyTex;
uniform sampler2D crackedTex;
uniform sampler2D darkTex;
uniform vec3 sunDir;
uniform vec3 sunColour;
uniform vec3 skyColour;
uniform vec3 groundColour;
uniform vec3 fogColour;
uniform float fogDensity;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vColour;
varying float vDepth;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec3 tri(sampler2D t, vec3 p, vec3 w, float scale) {
  return texture2D(t, p.zy * scale).rgb * w.x + texture2D(t, p.xz * scale).rgb * w.y + texture2D(t, p.xy * scale).rgb * w.z;
}

void main(void) {
  vec3 n = normalize(vNormal);
  vec3 w = pow(abs(n), vec3(4.0));
  w /= (w.x + w.y + w.z);
  // the rock, a texture every 3.5 m, and the same rock again at a third of the scale so it does not tile
  float s = 1.0 / 3.5;
  vec3 grey = tri(greyTex, vPos, w, s) * 0.6 + tri(greyTex, vPos + 17.0, w, s * 0.31) * 0.4;
  vec3 cracked = tri(crackedTex, vPos, w, s * 0.8);
  vec3 dark = tri(darkTex, vPos, w, s * 1.3);
  // greywacke grey with browner, cracked patches tens of metres across, darker in its seams
  float m = smoothstep(0.35, 0.75, noise(vPos.xz * 0.035) * 0.7 + noise(vPos.xz * 0.11 + 3.0) * 0.3);
  // (the photographs are of sunlit boulders, warm and pale: taken down to greywacke's cool mid grey)
  float gl = dot(grey, vec3(0.333));
  grey = mix(vec3(gl), grey, 0.35) * vec3(0.97, 0.99, 1.02);
  vec3 rock = mix(grey, mix(cracked, vec3(dot(cracked, vec3(0.33))), 0.7), m * 0.35);
  rock = mix(rock, dark, 0.35 + 0.3 * noise(vPos.xy * 0.08 + vPos.zz * 0.05));
  rock *= vColour * 1.05;
  // lit: the sun, and the sky over the ground by how much the face looks up
  float sun = max(dot(n, -normalize(sunDir)), 0.0);
  vec3 amb = mix(groundColour, skyColour, n.y * 0.5 + 0.5);
  vec3 c = rock * (amb * 1.25 + sunColour * sun * 0.9);
  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(c, fogColour, clamp(fog, 0.0, 1.0)), 1.0);
}
`

const made = new WeakMap<Scene, ShaderMaterial>()

/** The one rock material for a scene (the textures are shared). `base`: where public/ is served from. */
export function rockMaterial(scene: Scene, base = new URL('./', document.baseURI).href): ShaderMaterial {
  const have = made.get(scene)
  if (have) return have
  Effect.ShadersStore['rockFaceVertexShader'] = VERTEX
  Effect.ShadersStore['rockFaceFragmentShader'] = FRAGMENT
  const m = new ShaderMaterial('rockFace', scene, 'rockFace', {
    attributes: ['position', 'normal', 'color'],
    uniforms: ['world', 'viewProjection', 'sunDir', 'sunColour', 'skyColour', 'groundColour', 'fogColour', 'fogDensity'],
    samplers: ['greyTex', 'crackedTex', 'darkTex'],
  })
  for (const [k, f] of [['greyTex', 'rock_grey_diff'], ['crackedTex', 'rock_cracked_diff'], ['darkTex', 'rock_dark_diff']]) {
    const t = new Texture(`${base}rocks/textures/${f}.jpg`, scene)
    t.wrapU = t.wrapV = Texture.WRAP_ADDRESSMODE
    m.setTexture(k, t)
  }
  m.onBindObservable.add(() => {
    const e = m.getEffect()
    if (!e) return
    e.setVector3('sunDir', DAYLIGHT.sun)
    e.setColor3('sunColour', DAYLIGHT.sunColour)
    e.setColor3('skyColour', DAYLIGHT.skyColour)
    e.setColor3('groundColour', DAYLIGHT.groundColour)
    e.setColor3('fogColour', DAYLIGHT.fogColour)
    e.setFloat('fogDensity', DAYLIGHT.fogDensity)
  })
  made.set(scene, m)
  return m
}
