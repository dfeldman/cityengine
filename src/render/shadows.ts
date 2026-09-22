/**
 * Buildings casting shadows across the street.
 *
 * This is the other half of what makes a sunny city look sunny. Ambient occlusion darkens where things
 * touch; a shadow is the long dark shape a six-storey building throws over the road opposite, and it is most
 * of what tells you which way the sun is and what time of day it is. Without one, every street is lit as if
 * the buildings were not there.
 *
 * It is **not** a shadow map. Everything here is drawn by hand-written shaders, and a shadow map would mean
 * teaching every one of them to sample it — the facades, the road, the cartoon material, the sky. Instead
 * the shadow is computed as geometry, which the sun's being fixed makes possible:
 *
 *      footprint ──► projected along the sun by the building's height ──► hull of the two ──► a dark polygon
 *
 * That is exactly the shape a flat-roofed extrusion throws onto flat ground, and it is baked into the tile
 * with everything else, so it costs nothing per frame.
 *
 * Drawn with MULTIPLY blending, which matters more than it sounds: multiply is order-independent, so a
 * hundred overlapping shadow polygons can be drawn in any order without sorting and without the seams that
 * ordinary transparency would leave between them. Two shadows crossing darken a little more than one, which
 * is also what happens outside.
 */
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Constants } from '@babylonjs/core/Engines/constants'
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import type { Scene } from '@babylonjs/core/scene'
import type { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { MeshBuilder, capPolygon } from './buildings.ts'
import { OVERCAST } from './facade-material.ts'

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec4 color;
uniform mat4 worldViewProjection;
varying float vDepth;
varying float vSoft;
void main(void) {
  gl_Position = worldViewProjection * vec4(position, 1.0);
  vDepth = gl_Position.w;
  vSoft = color.r;     // how dark this part of the shadow is
}
`

const FRAGMENT = `
precision highp float;
varying float vDepth;
varying float vSoft;
uniform float fogDensity;
uniform vec3 shade;
void main(void) {
  // Multiply blending. This is the factor the ground underneath is multiplied by, so 1.0 is no shadow at
  // all. Fading with distance matters, because at two hundred metres the fog has already washed the ground
  // pale and a hard dark shadow on pale fog reads as a hole in the road.
  //
  // NOTE: no semicolons in these comments. Babylon's shader processor splits lines on them and parses
  // whatever follows as code, which fails to compile with an error pointing at an English word.
  float fade = exp(-vDepth * fogDensity * 1.6);
  vec3 k = mix(vec3(1.0), shade, vSoft * fade);
  gl_FragColor = vec4(k, 1.0);
}
`

/**
 * The same shadow, for things that move.
 *
 * A parked car and a walking person cannot have their shadow baked into a tile, so theirs is a soft blob
 * carried along with them — thin-instanced, one matrix each, offset along the sun and stretched the way a
 * low sun stretches everything. It is not the silhouette of the object and does not need to be: what a
 * contact shadow does is stop something looking as if it is hovering, and at the size a car is on screen a
 * correctly-placed smudge does that completely.
 */
const BLOB_VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec4 world0;
attribute vec4 world1;
attribute vec4 world2;
attribute vec4 world3;
uniform mat4 viewProjection;
varying float vDepth;
varying float vSoft;
varying vec2 vLocal;
void main(void) {
  mat4 W = mat4(world0, world1, world2, world3);
  vec4 wp = W * vec4(position, 1.0);
  gl_Position = viewProjection * wp;
  vDepth = gl_Position.w;
  vSoft = 1.0;
  vLocal = position.xz;
}
`

const BLOB_FRAGMENT = `
precision highp float;
varying float vDepth;
varying float vSoft;
varying vec2 vLocal;
uniform float fogDensity;
uniform vec3 shade;
void main(void) {
  // soft at the edges, so a blob does not read as a painted disc
  float r = clamp(1.0 - length(vLocal) * 2.0, 0.0, 1.0);
  float a = smoothstep(0.0, 0.75, r);
  float fade = exp(-vDepth * fogDensity * 1.6);
  vec3 k = mix(vec3(1.0), shade, a * vSoft * fade);
  gl_FragColor = vec4(k, 1.0);
}
`

let registered = false
let blobRegistered = false

/** The material shadows are drawn with. One per scene. */
export function shadowMaterial(scene: Scene): ShaderMaterial {
  const found = scene.materials.find((m) => m.name === 'shadow')
  if (found) return found as ShaderMaterial
  if (!registered) {
    Effect.ShadersStore['shadowVertexShader'] = VERTEX
    Effect.ShadersStore['shadowFragmentShader'] = FRAGMENT
    registered = true
  }
  const mat = new ShaderMaterial('shadow', scene, 'shadow', {
    attributes: ['position', 'color'],
    uniforms: ['worldViewProjection', 'fogDensity', 'shade'],
  })
  mat.alphaMode = Constants.ALPHA_MULTIPLY
  mat.needAlphaBlending = () => true
  mat.backFaceCulling = false
  /**
   * Depth WRITE on, and a strict LESS test — which is what stops overlapping shadows stacking.
   *
   * Multiply blending is order-independent, which is why a thousand shadow polygons need no sorting. It is
   * not idempotent: two shadows crossing multiply twice, three cross three times, and on a square where a
   * row of trees stands in front of a building the ground went to mud. Every static shadow is laid at
   * exactly the same height, so the first one to cover a pixel writes its depth and the rest are rejected —
   * a union, for free, from hardware that is already running.
   */
  mat.disableDepthWrite = false
  mat.depthFunction = Constants.LESS
  mat.setFloat('fogDensity', 0.0016)
  /**
   * How dark a shadow is. Not black: an outdoor shadow is lit by the whole sky, and a black one reads as a
   * hole in the road. Slightly blue, because the sky is what lights it.
   *
   * Lighter than a single shadow "should" be, deliberately. Multiply blending is order-independent, which is
   * what lets a hundred of these be drawn without sorting — but it also means two shadows crossing multiply
   * twice, and a building's shadow falling across a tree's came out nearly black. Erring light keeps the
   * overlap plausible and costs a little contrast on a lone shadow, which is the cheaper mistake.
   */
  mat.setColor3('shade', softened(new Color3(0.62, 0.645, 0.72)))
  return mat
}

/**
 * Under cloud there is no shadow to speak of.
 *
 * A cast shadow is the shape of whatever is blocking the sun, and if the light is coming from the whole sky
 * instead of one point, nothing blocks enough of it to leave an edge. Drawing crisp midday shadows under an
 * overcast sky is the single clearest way to make weather look painted on, so the shade is lifted most of
 * the way to white instead — still a little darkening where something sits on the ground, no hard edge.
 */
function softened(shade: Color3): Color3 {
  if (OVERCAST < 0.01) return shade
  return Color3.Lerp(shade, new Color3(1, 1, 1), 0.78 * OVERCAST)
}

/** The material a moving thing's shadow is drawn with. */
export function blobMaterial(scene: Scene): ShaderMaterial {
  const found = scene.materials.find((m) => m.name === 'shadowBlob')
  if (found) return found as ShaderMaterial
  if (!blobRegistered) {
    Effect.ShadersStore['shadowBlobVertexShader'] = BLOB_VERTEX
    Effect.ShadersStore['shadowBlobFragmentShader'] = BLOB_FRAGMENT
    blobRegistered = true
  }
  const mat = new ShaderMaterial('shadowBlob', scene, 'shadowBlob', {
    attributes: ['position', 'world0', 'world1', 'world2', 'world3'],
    uniforms: ['viewProjection', 'fogDensity', 'shade'],
  })
  mat.alphaMode = Constants.ALPHA_MULTIPLY
  mat.needAlphaBlending = () => true
  mat.backFaceCulling = false
  /**
   * Depth WRITE on, and a strict LESS test — which is what stops overlapping shadows stacking.
   *
   * Multiply blending is order-independent, which is why a thousand shadow polygons need no sorting. It is
   * not idempotent: two shadows crossing multiply twice, three cross three times, and on a square where a
   * row of trees stands in front of a building the ground went to mud. Every static shadow is laid at
   * exactly the same height, so the first one to cover a pixel writes its depth and the rest are rejected —
   * a union, for free, from hardware that is already running.
   */
  mat.disableDepthWrite = false
  mat.depthFunction = Constants.LESS
  mat.setFloat('fogDensity', 0.0016)
  mat.setColor3('shade', softened(new Color3(0.74, 0.76, 0.81)))
  return mat
}

/** A unit quad in the xz plane, centred on the origin: one blob, scaled and placed per instance. */
export function blobQuad(out: MeshBuilder): void {
  out.quad(
    [[-0.5, 0, -0.5], [0.5, 0, -0.5], [0.5, 0, 0.5], [-0.5, 0, 0.5]],
    [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 1, 1], 0,
  )
}

/**
 * How far and in which direction a shadow runs, per metre of height.
 *
 * The sun points down and along; a point `h` above the ground lands `h * (sun.xz / -sun.y)` away from where
 * it stands. A low sun gives long shadows, which is why the sun's elevation is the single most expressive
 * number in the scene.
 */
/**
 * The one height every static shadow is drawn at.
 *
 * They must share it exactly, or the depth test that de-duplicates them layers them by height instead and
 * the overlaps come back.
 */
export const SHADOW_Y = 0.172

export function shadowOffset(sun: Vector3): { x: number; z: number } {
  const down = Math.max(0.15, -sun.y)
  return { x: sun.x / down, z: sun.z / down }
}

/**
 * The ground shadow of one building: the convex hull of its footprint and that footprint slid along the sun.
 *
 * A hull rather than the exact silhouette. For a convex footprint they are the same thing; for an L-shaped
 * one the hull fills in the notch, which at the contrast a shadow is drawn with is not something anyone
 * picks out, and it avoids a polygon boolean per building.
 */
export function shadowHull(ring: { x: number; z: number }[], height: number,
                           off: { x: number; z: number }): { x: number; z: number }[] {
  const pts: { x: number; z: number }[] = []
  for (const p of ring) {
    pts.push(p)
    pts.push({ x: p.x + off.x * height, z: p.z + off.z * height })
  }
  return hull(pts)
}

function hull(pts: { x: number; z: number }[]): { x: number; z: number }[] {
  const p = [...pts].sort((a, b) => (a.x - b.x) || (a.z - b.z))
  const cross = (o: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x)
  const half = (src: { x: number; z: number }[]): { x: number; z: number }[] => {
    const out: { x: number; z: number }[] = []
    for (const q of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop()
      out.push(q)
    }
    out.pop()
    return out
  }
  return [...half(p), ...half([...p].reverse())]
}

/** Add one building's shadow to a tile's shadow mesh. */
export function addShadow(out: MeshBuilder, ring: { x: number; z: number }[], height: number,
                          off: { x: number; z: number }, y: number): void {
  if (ring.length < 3 || height < 1) return
  // the red channel carries how dark this vertex is; shadows are darkest at the building's own foot
  capPolygon(out, shadowHull(ring, height, off), y, [0.85, 0, 0], 0, 1)
}
