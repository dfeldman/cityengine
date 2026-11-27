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
import { Vector4, type Vector3 } from '@babylonjs/core/Maths/math.vector'
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
  /**
   * The depth union only holds where every shadow lies at one height. On a deck (La Défense's dalle, stairs,
   * slabs at ground + something) shadows sit at different heights, the depth test passes them all, and five
   * towers' shadows multiplied the ground to black. SHADOW_STENCIL makes it a true union: a pixel is darkened
   * by the first shadow to reach it, and every later one is rejected.
   */
  const st = mat.stencil
  st.enabled = true
  st.func = Constants.NOTEQUAL
  st.funcRef = SHADOW_STENCIL
  st.funcMask = SHADOW_STENCIL
  st.mask = SHADOW_STENCIL
  st.opStencilFail = Constants.KEEP
  st.opDepthFail = Constants.KEEP
  st.opStencilDepthPass = Constants.REPLACE
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
  mat.setColor3('shade', softened(HARD_SHADE))
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

const SOFT_FRAGMENT = `
precision highp float;
varying float vDepth;
varying float vSoft;
varying float vEdge;
uniform float fogDensity;
uniform vec3 shade;
void main(void) {
  // the penumbra skirt: vEdge runs 1 at the hard core to 0 at the rim, eased so the core meets it without a crease
  float fade = exp(-vDepth * fogDensity * 1.6);
  float e = smoothstep(0.0, 1.0, vEdge);
  vec3 k = mix(vec3(1.0), shade, vSoft * e * fade);
  gl_FragColor = vec4(k, 1.0);
}
`

const SOFT_VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec4 color;
uniform mat4 worldViewProjection;
varying float vDepth;
varying float vSoft;
varying float vEdge;
void main(void) {
  gl_Position = worldViewProjection * vec4(position, 1.0);
  vDepth = gl_Position.w;
  vSoft = color.r;
  vEdge = color.g;
}
`

const LEAF_VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec4 color;
uniform mat4 world;
uniform mat4 worldViewProjection;
varying float vDepth;
varying float vSoft;
varying float vEdge;
varying float vSolid;
varying float vSeed;
varying vec2 vWorld;
void main(void) {
  gl_Position = worldViewProjection * vec4(position, 1.0);
  vDepth = gl_Position.w;
  vSoft = color.r;
  vEdge = color.g;
  vSolid = color.b;
  vSeed = color.a;
  vWorld = (world * vec4(position, 1.0)).xz;
}
`

const LEAF_FRAGMENT = `
precision highp float;
varying float vDepth;
varying float vSoft;
varying float vEdge;
varying float vSolid;
varying float vSeed;
varying vec2 vWorld;
uniform float fogDensity;
uniform vec3 shade;
uniform vec4 leafA;
uniform vec4 leafB;
uniform float time;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 f = fract(p);
  // wrapped before hashing, or far from the origin the hash runs out of float precision and bands
  vec2 i = mod(floor(p), 512.0);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(mod(i + vec2(1.0, 0.0), 512.0));
  float c = hash(mod(i + vec2(0.0, 1.0), 512.0));
  float d = hash(mod(i + vec2(1.0, 1.0), 512.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
void main(void) {
  // Dappled shade under a crown. A pixel is either in the leaves' shade or in a sunfleck, and a fleck is DISCARDED,
  // not drawn light: the shade writes the shadow stencil like a building's does, so two crowns overlapping make a
  // union (fewer flecks, the same darkness) instead of multiplying to mud, and a building's shadow still fills a
  // fleck. leafA = clump, gap, cover, coreEdge. leafB = near, far, farDim, sway.
  float fade = exp(-vDepth * fogDensity * 1.6);
  float mottle = 1.0 - smoothstep(leafB.x, leafB.y, vDepth);
  vec2 o = vec2(vSeed * 71.3, vSeed * 37.9);
  vec2 sway = vec2(sin(time * 0.9 + vWorld.y * 0.13), cos(time * 0.7 + vWorld.x * 0.11)) * leafB.w;
  float big = vnoise((vWorld + o) / leafA.x);
  float fine = vnoise((vWorld + o * 1.7 + sway) / leafA.y);
  float n = big * 0.55 + fine * 0.45;
  n = mix(0.5, n, mottle);
  float e = smoothstep(0.0, leafA.w, vEdge);
  // the threshold falls toward the rim, so the crown's edge breaks up into scattered shade rather than ending
  float cover = leafA.z * e;
  float thr = 0.5 + (cover - 0.5) * 0.9;
  if (vSolid < 0.5 && n > thr + 0.02 * (1.0 - mottle)) discard;
  // a little deeper where the leaves are thickest
  float depth = mix(0.82, 1.0, smoothstep(thr, thr - 0.18, n));
  float k = vSoft * fade * mix(leafB.z, depth, mottle);
  // the trunk strip goes with the flecks, or a thin line shimmers at 150 m
  if (vSolid > 0.5) {
    if (mottle < 0.01) discard;
    k = vSoft * fade * mix(0.5, 1.0, mottle);
  }
  gl_FragColor = vec4(mix(vec3(1.0), shade, k), 1.0);
}
`

let softRegistered = false
let leafRegistered = false

/** shared stencil set-up: test SHADOW_STENCIL, and either mark it (hard shadows, leaf shade) or not (soft skirts) */
function shadowStencil(mat: ShaderMaterial, write: boolean): void {
  const st = mat.stencil
  st.enabled = true
  st.func = Constants.NOTEQUAL
  st.funcRef = SHADOW_STENCIL
  st.funcMask = SHADOW_STENCIL
  st.mask = write ? SHADOW_STENCIL : 0x00
  st.opStencilFail = Constants.KEEP
  st.opDepthFail = Constants.KEEP
  st.opStencilDepthPass = write ? Constants.REPLACE : Constants.KEEP
}

/**
 * The penumbra skirts round the hard shadows (addShadow with `soft`).
 *
 * They test the shadow stencil and write neither it nor depth, and are drawn after every hard shadow and leaf shade
 * (city.ts ranks them): a skirt reaching over another building's shadow is rejected there, which is right — the
 * pixel is already in full shade — and it can never cut a lighter patch out of a shadow drawn after it, which a
 * skirt that marked the stencil would. Two skirts crossing darken twice, faintly, as two penumbras do.
 */
export function softShadowMaterial(scene: Scene): ShaderMaterial {
  const found = scene.materials.find((m) => m.name === 'shadowSoft')
  if (found) return found as ShaderMaterial
  if (!softRegistered) {
    Effect.ShadersStore['shadowSoftVertexShader'] = SOFT_VERTEX
    Effect.ShadersStore['shadowSoftFragmentShader'] = SOFT_FRAGMENT
    softRegistered = true
  }
  const mat = new ShaderMaterial('shadowSoft', scene, 'shadowSoft', {
    attributes: ['position', 'color'],
    uniforms: ['worldViewProjection', 'fogDensity', 'shade'],
  })
  mat.alphaMode = Constants.ALPHA_MULTIPLY
  mat.needAlphaBlending = () => true
  mat.backFaceCulling = false
  mat.disableDepthWrite = true
  mat.depthFunction = Constants.LEQUAL
  shadowStencil(mat, false)
  mat.setFloat('fogDensity', 0.0016)
  mat.setColor3('shade', softened(HARD_SHADE))
  return mat
}

/** Dappled tree shade (addLeafShade). A union like the hard shadows: see LEAF_FRAGMENT. */
export function leafMaterial(scene: Scene): ShaderMaterial {
  const found = scene.materials.find((m) => m.name === 'shadowLeaf')
  if (found) return found as ShaderMaterial
  if (!leafRegistered) {
    Effect.ShadersStore['shadowLeafVertexShader'] = LEAF_VERTEX
    Effect.ShadersStore['shadowLeafFragmentShader'] = LEAF_FRAGMENT
    leafRegistered = true
  }
  const mat = new ShaderMaterial('shadowLeaf', scene, 'shadowLeaf', {
    attributes: ['position', 'color'],
    uniforms: ['world', 'worldViewProjection', 'fogDensity', 'shade', 'leafA', 'leafB', 'time'],
  })
  mat.alphaMode = Constants.ALPHA_MULTIPLY
  mat.needAlphaBlending = () => true
  mat.backFaceCulling = false
  mat.disableDepthWrite = false
  mat.depthFunction = Constants.LESS
  shadowStencil(mat, true)
  mat.setFloat('fogDensity', 0.0016)
  mat.setColor3('shade', softened(LEAF_SHADE))
  const t = LEAF_TUNE
  mat.setVector4('leafA', new Vector4(t.clump, t.gap, t.cover, t.coreEdge))
  mat.setVector4('leafB', new Vector4(t.near, t.far, t.farDim, t.sway))
  mat.setFloat('time', 0)
  scene.onBeforeRenderObservable.add(() => mat.setFloat('time', performance.now() / 1000))
  return mat
}

/** under leaves the light is a little greener than under a wall */
const HARD_SHADE = new Color3(0.62, 0.645, 0.72)
const LEAF_SHADE = new Color3(0.63, 0.67, 0.7)

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
   * Blobs TEST the shadow stencil but write neither it nor depth, and are drawn after every static shadow (city.ts
   * sorts them last in their group).
   *
   * They used to write both, as the static shadows do — over the WHOLE quad, faint corners included. Wherever the
   * blobs happened to be drawn before a building's or tree's shadow (the group's transparent queue sorts by distance,
   * and the blob pool's bounds sit at the world origin, so anywhere away from it they went first), that shadow was
   * rejected under every blob's square: a walker in the shade of a building stood on a sunlit rectangle with a soft
   * dark smudge in it (owner, 2026-11-24, "rectangles with a light centre"). Testing without writing means a person
   * already in shade casts no second shadow, and one blob's corners cannot cut a square out of its neighbour's.
   * Two blobs overlapping darken twice, which at their strength reads as a crowd, not as mud.
   */
  mat.disableDepthWrite = true
  mat.depthFunction = Constants.LEQUAL
  const st = mat.stencil
  st.enabled = true
  st.func = Constants.NOTEQUAL
  st.funcRef = SHADOW_STENCIL
  st.funcMask = SHADOW_STENCIL
  st.mask = 0x00
  st.opStencilFail = Constants.KEEP
  st.opDepthFail = Constants.KEEP
  st.opStencilDepthPass = Constants.KEEP
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
/** stencil bit the static shadows mark (bit 1 is city.ts GROUND_STENCIL) */
export const SHADOW_STENCIL = 2

export const SHADOW_Y = 0.172

// ── soft shadows: tunables ─────────────────────────────────────────────────────────────────────────────────────────
/** off: every shadow is the hard polygon it was (`?softshadows=0` turns it off for one load, to compare) */
export const SOFT_SHADOWS = typeof location === 'undefined' || !/[?&]softshadows=0\b/.test(location.search)
/** how dark the hard core of a static shadow is (red channel × shade) */
export const SHADOW_DARK = 0.85
/** penumbra width, metres, at the caster's foot, and per metre the edge lies from its caster, and the most */
export const PENUMBRA_MIN = 0.35
export const PENUMBRA_PER_M = 0.05
export const PENUMBRA_MAX = 4.5
/** segments in each rounded penumbra corner */
const PENUMBRA_CORNER = 3
/** at most this fraction of the shadow's narrowest width goes to penumbra */
const PENUMBRA_NARROW = 0.7
/** cap on the inset at a sharp corner, × half the width */
const PENUMBRA_MITER = 2.2
/** tree shade: how dark (red channel), the crown's centre as a fraction of the tree's height, its rim × the crown */
const LEAF_DARK = 0.8
const LEAF_CROWN_Y = 0.62
const LEAF_RIM = 1.25
const LEAF_SEGS = 10
/** the trunk's shade runs to this fraction of the height, and is this fraction of the height wide */
const LEAF_TRUNK_TOP = 0.42
const LEAF_TRUNK_W = 0.03
/** the dapple: foliage clumps and leaf gaps in metres, how much of the middle is shaded, how far the flecks show */
export const LEAF_TUNE = {
  clump: 1.7, // metres across a clump of foliage
  gap: 0.42, // metres across the small holes between leaves
  cover: 0.66, // fraction of the crown's middle in shade
  coreEdge: 0.55, // edge coverage (0 rim .. 1 middle) beyond which the cover is full
  near: 45, // metres: flecks fully drawn closer than this
  far: 110, // metres: none past this (they would shimmer), a plain lighter ellipse instead
  farDim: 0.72, // how dark the plain far ellipse is, × LEAF_DARK
  sway: 0.06, // metres the leaf gaps drift in the wind
}

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

function hull<T extends { x: number; z: number }>(pts: T[]): T[] {
  const p = [...pts].sort((a, b) => (a.x - b.x) || (a.z - b.z))
  const cross = (o: T, a: T, b: T): number =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x)
  const half = (src: T[]): T[] => {
    const out: T[] = []
    for (const q of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop()
      out.push(q)
    }
    out.pop()
    return out
  }
  return [...half(p), ...half([...p].reverse())]
}

/**
 * Add one building's shadow to a tile's shadow mesh.
 *
 * With `soft` (and SOFT_SHADOWS on) the hull's hard core goes into `out` and its penumbra into `soft`, which is drawn
 * with softShadowMaterial. The penumbra is per vertex: a corner of the footprint gets PENUMBRA_MIN, a corner slid out
 * along the sun gets PENUMBRA_PER_M for every metre it was slid — sharp where the wall meets the ground, blurred at
 * the far tip, which is how the sun's disc blurs a real shadow.
 */
export function addShadow(out: MeshBuilder, ring: { x: number; z: number }[], height: number,
                          off: { x: number; z: number }, y: number, soft?: MeshBuilder): void {
  if (ring.length < 3 || height < 1) return
  // the red channel carries how dark this vertex is; shadows are darkest at the building's own foot
  if (!soft || !SOFT_SHADOWS) { capPolygon(out, shadowHull(ring, height, off), y, [SHADOW_DARK, 0, 0], 0, 1); return }
  const reach = height * Math.hypot(off.x, off.z)
  const pts: { x: number; z: number; w: number }[] = []
  for (const p of ring) {
    pts.push({ x: p.x, z: p.z, w: PENUMBRA_MIN })
    pts.push({ x: p.x + off.x * height, z: p.z + off.z * height, w: penumbra(reach) })
  }
  softPolygon(out, soft, hull(pts), y)
}

/** The penumbra width a shadow edge `d` metres from what casts it gets. */
export function penumbra(d: number): number {
  return Math.min(PENUMBRA_MAX, PENUMBRA_MIN + PENUMBRA_PER_M * d)
}

/** A convex hull with one penumbra width for every vertex: the landmarks' model hulls. */
export function softHull(out: MeshBuilder, soft: MeshBuilder, ring: { x: number; z: number }[], w: number, y: number): void {
  if (!SOFT_SHADOWS) { capPolygon(out, ring, y, [SHADOW_DARK, 0, 0], 0, 1); return }
  softPolygon(out, soft, hull(ring.map((p) => ({ x: p.x, z: p.z, w }))), y)
}

/**
 * A convex polygon as a hard core (inset by half each vertex's width, into `core`) and a skirt round it (into `soft`)
 * whose green channel runs 1 at the core to 0 at the outer rim, with the corners rounded by PENUMBRA_CORNER segments.
 * The 50% line falls on the polygon's own edge, so softening a shadow does not grow it.
 */
function softPolygon(core: MeshBuilder, soft: MeshBuilder, poly: { x: number; z: number; w: number }[], y: number): void {
  const n = poly.length
  if (n < 3) return
  let area = 0
  for (let i = 0; i < n; i++) { const p = poly[i], q = poly[(i + 1) % n]; area += p.x * q.z - q.x * p.z }
  const sgn = area > 0 ? 1 : -1
  // outward normal of each edge i → i+1
  const nx: number[] = [], nz: number[] = []
  for (let i = 0; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n]
    const l = Math.hypot(q.x - p.x, q.z - p.z) || 1
    nx.push(sgn * (q.z - p.z) / l); nz.push(-sgn * (q.x - p.x) / l)
  }
  // the narrowest the polygon is across: no inset may meet the one opposite
  let narrow = Infinity
  for (let i = 0; i < n; i++) {
    let far = 0
    for (const v of poly) far = Math.max(far, -((v.x - poly[i].x) * nx[i] + (v.z - poly[i].z) * nz[i]))
    narrow = Math.min(narrow, far)
  }
  const wmax = narrow * PENUMBRA_NARROW
  const inner: { x: number; z: number }[] = []
  const arcs: { x: number; z: number }[][] = []
  for (let i = 0; i < n; i++) {
    const v = poly[i], w = Math.min(v.w, wmax) / 2
    const a = (i + n - 1) % n
    const ax = nx[a], az = nz[a], bx = nx[i], bz = nz[i]
    // inset along the miter, capped so a sharp tip does not shoot inwards
    const d = 1 + ax * bx + az * bz
    const mk = Math.min(PENUMBRA_MITER, 1 / Math.max(0.05, d))
    inner.push({ x: v.x - (ax + bx) * mk * w, z: v.z - (az + bz) * mk * w })
    const arc: { x: number; z: number }[] = []
    for (let k = 0; k <= PENUMBRA_CORNER; k++) {
      const t = k / PENUMBRA_CORNER
      let ux = ax + (bx - ax) * t, uz = az + (bz - az) * t
      const ul = Math.hypot(ux, uz) || 1
      ux /= ul; uz /= ul
      arc.push({ x: v.x + ux * w, z: v.z + uz * w })
    }
    arcs.push(arc)
  }
  capPolygon(core, inner, y, [SHADOW_DARK, 0, 0], 0, 1)
  const put = (p: { x: number; z: number }, g: number): number => {
    soft.positions.push(p.x, y, p.z)
    soft.normals.push(0, 1, 0)
    soft.uvs.push(0, 0)
    soft.colors.push(SHADOW_DARK, g, 0, 0)
    return soft.positions.length / 3 - 1
  }
  const ii = inner.map((p) => put(p, 1))
  const ai = arcs.map((arc) => arc.map((p) => put(p, 0)))
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    for (let k = 0; k < PENUMBRA_CORNER; k++) soft.indices.push(ii[i], ai[i][k], ai[i][k + 1])
    // the edge i → j, from the end of i's corner to the start of j's
    soft.indices.push(ii[i], ai[i][PENUMBRA_CORNER], ai[j][0], ii[i], ai[j][0], ii[j])
  }
}

/**
 * One tree's shade into a leaf-shade mesh (leafMaterial): an ellipse where the crown's sphere lands, and a thin dark
 * strip for the trunk. Green is the edge coverage (1 at the middle, 0 at the rim), blue 1 for the trunk (no
 * sunflecks), alpha a per-tree seed so two crowns overlapping do not leave the same holes.
 */
export function addLeafShade(out: MeshBuilder, x: number, z: number, height: number, crown: number,
                             off: { x: number; z: number }, y: number, seed: number): void {
  const reach = Math.hypot(off.x, off.z)
  const ux = reach > 1e-3 ? off.x / reach : 1, uz = reach > 1e-3 ? off.z / reach : 0
  const cy = height * LEAF_CROWN_Y
  const cx = x + off.x * cy, cz = z + off.z * cy
  const along = crown * Math.sqrt(1 + reach * reach) * LEAF_RIM, across = crown * LEAF_RIM
  const s = (seed % 997) / 997
  const put = (px: number, pz: number, g: number, solid: number): number => {
    out.positions.push(px, y, pz)
    out.normals.push(0, 1, 0)
    out.uvs.push(0, 0)
    out.colors.push(LEAF_DARK, g, solid, s)
    return out.positions.length / 3 - 1
  }
  const c = put(cx, cz, 1, 0)
  const rim: number[] = []
  for (let i = 0; i < LEAF_SEGS; i++) {
    const a = (i / LEAF_SEGS) * Math.PI * 2
    const pa = Math.cos(a) * along, pc = Math.sin(a) * across
    rim.push(put(cx + ux * pa - uz * pc, cz + uz * pa + ux * pc, 0, 0))
  }
  for (let i = 0; i < LEAF_SEGS; i++) out.indices.push(c, rim[i], rim[(i + 1) % LEAF_SEGS])
  // the trunk: from its foot to where the crown's shade begins
  const t1 = height * LEAF_TRUNK_TOP
  const hw = Math.max(0.12, height * LEAF_TRUNK_W) / 2
  const ex = x + off.x * t1, ez = z + off.z * t1
  if (t1 * reach > crown * 0.3) {
    const a = put(x - uz * hw, z + ux * hw, 1, 1), b = put(x + uz * hw, z - ux * hw, 1, 1)
    const d = put(ex - uz * hw, ez + ux * hw, 1, 1), e = put(ex + uz * hw, ez - ux * hw, 1, 1)
    out.indices.push(a, b, e, a, e, d)
  }
}
