/**
 * Water. The Seine runs through the Marais bake and a flat blue polygon on it would undo a street's worth of
 * care, so it gets a shader of its own.
 *
 * No reflection buffer and no normal map: two crossed, scrolling wave fields computed in the fragment shader,
 * differentiated to give a normal, and then the same fresnel-and-sky model the glass uses. That is enough,
 * because what says "water" from a bike on a bridge is (a) that the surface moves, (b) that it is a mirror at
 * a grazing angle and dark looking straight down, and (c) that the sun glitters off it. A planar reflection
 * would cost a second render of the city for a view the rider glances at.
 */
import { Constants } from '@babylonjs/core/Engines/constants'
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import type { Scene } from '@babylonjs/core/scene'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import type { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { DAYLIGHT, type SkyLook } from './facade-material.ts'

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 worldViewProjection;
uniform mat4 world;
varying vec3 vWorld;
varying float vDepth;
void main(void) {
  vec4 wp = world * vec4(position, 1.0);
  gl_Position = worldViewProjection * vec4(position, 1.0);
  vWorld = wp.xyz;
  vDepth = gl_Position.w;
}
`

const FRAGMENT = `
precision highp float;
varying vec3 vWorld;
varying float vDepth;
uniform vec3 sunDir;
uniform vec3 sunColour;
uniform vec3 skyColour;
uniform vec3 groundColour;
uniform vec3 fogColour;
uniform vec3 zenith;
uniform vec3 horizon;
uniform float fogDensity;
uniform float time;
uniform vec3 eye;
uniform vec3 deep;

// Two crossed wave trains at different scales and speeds. Summing two is the cheapest thing that stops the
// surface reading as one repeating ripple.
float waves(vec2 p) {
  return sin(p.x * 0.7 + time * 0.9) * 0.5
       + sin(p.y * 0.53 - time * 0.7) * 0.35
       + sin((p.x + p.y) * 1.7 + time * 1.6) * 0.15;
}

vec3 skyAt(vec3 dir) {
  float up = clamp(dir.y, -1.0, 1.0);
  return up > 0.0
    ? mix(horizon, zenith, pow(max(up, 0.0), 0.55))
    : mix(horizon * 0.55, groundColour * 1.4, pow(max(-up, 0.0), 0.6));
}

void main(void) {
  vec2 p = vWorld.xz * 0.35;
  // the normal, from the slope of the wave field either side
  float e = 0.35;
  float h = waves(p);
  vec3 n = normalize(vec3(waves(p + vec2(e, 0.0)) - h, 6.0, waves(p + vec2(0.0, e)) - h));

  vec3 view = normalize(vWorld - eye);
  float cosine = clamp(dot(-view, n), 0.0, 1.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - cosine, 5.0);

  vec3 reflected = reflect(view, n);
  vec3 sky = skyAt(reflected);
  float glitter = pow(max(dot(reflected, -normalize(sunDir)), 0.0), 400.0);

  vec3 lit = mix(deep, sky, clamp(fresnel * 1.2, 0.0, 0.96)) + sunColour * glitter * 2.2;

  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(lit, fogColour, clamp(fog, 0.0, 1.0)), 1.0);
}
`

let registered = false

export function waterMaterial(scene: Scene): ShaderMaterial {
  const existing = scene.materials.find((m) => m.name === 'water')
  if (existing) return existing as ShaderMaterial

  if (!registered) {
    Effect.ShadersStore['waterVertexShader'] = VERTEX
    Effect.ShadersStore['waterFragmentShader'] = FRAGMENT
    registered = true
  }
  const mat = new ShaderMaterial('water', scene, 'water', {
    attributes: ['position', 'normal'],
    uniforms: ['world', 'worldViewProjection', 'sunDir', 'sunColour', 'skyColour', 'groundColour',
      'fogColour', 'fogDensity', 'zenith', 'horizon', 'time', 'eye', 'deep'],
    // Not for transparency — the output is opaque. The blended pass is drawn AFTER every opaque mesh in the
    // rendering group, which is the only ordering Babylon guarantees within a group, and water has to come
    // after the grass: it lies flat at its lowest bank, and a park polygon lapping over the river is higher.
    needAlphaBlending: true,
  })
  const look: SkyLook = DAYLIGHT
  mat.setVector3('sunDir', look.sun)
  mat.setColor3('sunColour', look.sunColour)
  mat.setColor3('skyColour', look.skyColour)
  mat.setColor3('groundColour', look.groundColour)
  mat.setColor3('fogColour', look.fogColour)
  mat.setColor3('zenith', look.zenith)
  mat.setColor3('horizon', look.horizon)
  mat.setFloat('fogDensity', look.fogDensity)
  // a river is not blue; it is the colour of what is suspended in it, seen through a mirror
  mat.setColor3('deep', new Color3(0.07, 0.11, 0.12))
  mat.backFaceCulling = false
  /**
   * An explicit depth function, so nothing inherits one.
   *
   * The ground layers deliberately draw with ALWAYS — within a painted layer the last quad wins — and
   * Babylon only sets `depthFunction` for materials that specify one, leaving the previous material's state
   * bound for every material that does not. Whatever happened to be drawn after a road then had no depth
   * test either, which is invisible until something new joins the scene and changes the order things are
   * drawn in, and then the whole city goes wrong at once.
   */
  /*
   * Depth-TESTED, against the terrain occluder drawn first in this group, so land between the eye and the
   * river hides it — painted with ALWAYS, the Seine showed through every rise in front of it. Grass lapping
   * over the river does not hide it: the occluder is sunk well below the water wherever water is near.
   * Roads, bridges and quays are in later groups and still draw on top.
   */
  mat.depthFunction = Constants.LEQUAL
  mat.disableDepthWrite = true
  return mat
}

/** Water moves, so it needs the clock and the eye every frame. */
export function updateWater(scene: Scene, seconds: number, eye: Vector3): void {
  const m = scene.materials.find((x) => x.name === 'water') as ShaderMaterial | undefined
  if (!m) return
  m.setFloat('time', seconds)
  m.setVector3('eye', eye)
}
