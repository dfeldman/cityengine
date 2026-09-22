/**
 * The material everything ALIVE is drawn with: cars, buses, trains, people, birds, planes, street furniture.
 *
 * It is deliberately a different look from the buildings. The facades are painted with real materials and
 * real shading because a street has to be believable; the things moving through it are flat-shaded, saturated
 * and simple, because a city that is busy enough to feel alive cannot afford a detailed model per car, and
 * because a slightly cartoon car reads instantly at forty metres where a realistic one at the same triangle
 * budget reads as a grey smudge.
 *
 * Everything is drawn with **thin instances**: one mesh per kind, one matrix and one colour per copy, one
 * draw call for all of them. Two hundred people and forty cars cost two draw calls, which is what makes the
 * streets affordable at all.
 *
 * Shading is three terms and no texture: a flat sun, a sky/ground hemisphere, and a rim light that lifts the
 * silhouette off the background. The rim is the one that does the cartoon work — without it a dark car in
 * shadow against a dark road disappears.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Constants } from '@babylonjs/core/Engines/constants'
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import type { Scene } from '@babylonjs/core/scene'
import { DAYLIGHT, NIGHT, type SkyLook } from './facade-material.ts'

/**
 * Two vertex shaders, because a mesh either IS thin-instanced or is not, and the difference is not optional.
 *
 * The instanced one reads the per-copy matrix from `world0..world3`, which Babylon supplies only for thin
 * instances. Used on an ordinary mesh those attributes are undefined, every vertex is multiplied by garbage,
 * and the result is a fan of enormous triangles radiating from the middle of the screen — which is exactly
 * what the street furniture did when it borrowed the instanced material.
 */
const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
// thin instancing: Babylon feeds the per-copy matrix in as four vec4 attributes
attribute vec4 world0;
attribute vec4 world1;
attribute vec4 world2;
attribute vec4 world3;
attribute vec4 instColor;
uniform mat4 viewProjection;
uniform vec3 eye;
varying vec3 vNormal;
varying vec4 vColour;
varying float vDepth;
varying vec3 vView;


void main(void) {
  mat4 W = mat4(world0, world1, world2, world3);
  vec4 wp = W * vec4(position, 1.0);
  gl_Position = viewProjection * wp;
  vNormal = normalize(mat3(W) * normal);
  // instColor.a says how much of the instance colour replaces the mesh's own: 1 for a car's body panels,
  // 0 for its windows and wheels, which must stay dark whatever colour the car is painted
  // color.a of 0.5 marks a light source — see EMIT in models.ts. Only a full 1.0 means "recolour me".
  float body = step(0.9, color.a);
  vColour = vec4(mix(color.rgb, instColor.rgb, instColor.a * body), step(0.4, color.a) * (1.0 - body));
  vView = normalize(wp.xyz - eye);
  vDepth = gl_Position.w;
}
`

const FRAGMENT = `
precision highp float;
varying vec3 vNormal;
varying vec4 vColour;
varying float vDepth;
varying vec3 vView;
uniform vec3 sunDir;
uniform vec3 sunColour;
uniform vec3 skyColour;
uniform vec3 groundColour;
uniform vec3 fogColour;
uniform float fogDensity;
uniform float night;
void main(void) {
  vec3 n = normalize(vNormal);
  float sun = max(dot(n, -normalize(sunDir)), 0.0);
  // banded rather than smooth: the step is what makes it read as drawn rather than rendered
  sun = smoothstep(0.0, 0.02, sun - 0.5) * 0.55 + sun * 0.45;
  float up = n.y * 0.5 + 0.5;
  vec3 lit = vColour.rgb * (mix(groundColour, skyColour, up) + sunColour * sun);
  // a rim light, so a dark shape never disappears into a dark background
  float rim = pow(1.0 - max(dot(n, -vView), 0.0), 3.0);
  // but mostly in the object's own brightness: added flat, it turned every thin dark thing (a bollard, a
  // lamp post, all glancing faces) pale sky-blue
  float lum = dot(vColour.rgb, vec3(0.3, 0.59, 0.11));
  lit += skyColour * rim * (0.18 + 0.47 * lum);
  // a lamp head, a headlight, a traffic signal: bright by day, and the only thing lit after dark
  lit = mix(lit, vColour.rgb * (1.0 + 1.4 * night), vColour.a * (0.35 + 0.65 * night));

  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(lit, fogColour, clamp(fog, 0.0, 1.0)), 1.0);
}
`

/** The same shading, for a mesh that is placed by its own world matrix rather than by instancing. */
const STATIC_VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
uniform mat4 world;
uniform mat4 viewProjection;
uniform vec3 eye;
varying vec3 vNormal;
varying vec4 vColour;
varying float vDepth;
varying vec3 vView;
void main(void) {
  vec4 wp = world * vec4(position, 1.0);
  gl_Position = viewProjection * wp;
  vNormal = normalize(mat3(world) * normal);
  vColour = vec4(color.rgb, step(0.4, color.a) * (1.0 - step(0.9, color.a)));
  vView = normalize(wp.xyz - eye);
  vDepth = gl_Position.w;
}
`

let registered = false

/**
 * `instanced: false` gives the variant for a mesh drawn once, in place — street furniture baked into a tile,
 * for example. Everything else is thin-instanced.
 */
export function cartoonMaterial(scene: Scene, name = 'cartoon', instanced = true): ShaderMaterial {
  const existing = scene.materials.find((m) => m.name === name)
  if (existing) return existing as ShaderMaterial
  if (!registered) {
    Effect.ShadersStore['cartoonVertexShader'] = VERTEX
    Effect.ShadersStore['cartoonFragmentShader'] = FRAGMENT
    Effect.ShadersStore['cartoonStaticVertexShader'] = STATIC_VERTEX
    Effect.ShadersStore['cartoonStaticFragmentShader'] = FRAGMENT
    registered = true
  }
  const mat = new ShaderMaterial(name, scene, instanced ? 'cartoon' : 'cartoonStatic', {
    attributes: instanced
      ? ['position', 'normal', 'color', 'world0', 'world1', 'world2', 'world3', 'instColor']
      : ['position', 'normal', 'color'],
    uniforms: ['world', 'viewProjection', 'eye', 'sunDir', 'sunColour', 'skyColour', 'groundColour',
      'fogColour', 'fogDensity', 'night'],
  })
  applyCartoonLook(mat, DAYLIGHT)
  mat.backFaceCulling = true
  /**
   * An explicit depth function, so nothing inherits one.
   *
   * The ground layers deliberately draw with ALWAYS — within a painted layer the last quad wins — and
   * Babylon only sets `depthFunction` for materials that specify one, leaving the previous material's state
   * bound for every material that does not. Whatever happened to be drawn after a road then had no depth
   * test either, which is invisible until something new joins the scene and changes the order things are
   * drawn in, and then the whole city goes wrong at once.
   */
  mat.depthFunction = Constants.LEQUAL
  return mat
}

export function applyCartoonLook(mat: ShaderMaterial, look: SkyLook): void {
  mat.setVector3('sunDir', look.sun)
  mat.setColor3('sunColour', look.sunColour)
  mat.setColor3('skyColour', look.skyColour)
  mat.setColor3('groundColour', look.groundColour)
  mat.setColor3('fogColour', look.fogColour)
  mat.setFloat('fogDensity', look.fogDensity)
  mat.setFloat('night', NIGHT)
}

export function updateCartoonEye(scene: Scene, eye: Vector3): void {
  for (const m of scene.materials) {
    if (m.name.startsWith('cartoon')) (m as ShaderMaterial).setVector3('eye', eye)
  }
}

