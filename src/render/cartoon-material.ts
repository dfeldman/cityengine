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
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
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
varying vec3 vWorld;
varying float vSurface;
varying vec2 vUV;
void main(void) {
  mat4 W = mat4(world0, world1, world2, world3);
  vec4 wp = W * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = viewProjection * wp;
  vNormal = normalize(mat3(W) * normal);
  // instColor.a says how much of the instance colour replaces the mesh's own: 1 for a car's body panels,
  // 0 for its windows and wheels, which must stay dark whatever colour the car is painted
  // color.a of 0.5 marks a light source — see EMIT in models.ts. Only a full 1.0 means "recolour me".
  float body = step(0.9, color.a);
  vColour = vec4(mix(color.rgb, instColor.rgb, instColor.a * body), step(0.4, color.a) * (1.0 - body));
  vView = normalize(wp.xyz - eye);
  vDepth = gl_Position.w;
  vSurface = 0.0;
  vUV = vec2(0.0);
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
uniform float stone;
uniform float flood;
uniform sampler2D rockTex;
varying vec3 vWorld;
varying float vSurface;
varying vec2 vUV;
// a hash that stays uniform at world coordinates in the thousands (sin-based ones do not, on a GPU)
float hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
}
// dressed limestone for the pale surfaces of a monument (BUGS 8): courses, staggered joints, a tone per block
// and faint veins, all in world metres so every landmark is cut from the same stone
vec3 dressed(vec3 c, vec3 n) {
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
  float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  float pale = smoothstep(0.55, 0.75, lum) * (1.0 - smoothstep(0.1, 0.22, sat));
  if (pale <= 0.0) return c;
  vec3 an = abs(n);
  float along = an.x > an.z ? vWorld.z : vWorld.x;
  float y = vWorld.y;
  vec2 pl = vWorld.xz;
  float tone = 1.0;
  float joint = 0.0;
  if (an.y < 0.7) {
    float row = floor(y / 0.55);
    float u = along / 1.1 + 0.5 * mod(row, 2.0);
    // how far from the middle of its block, up and along: a joint is the last 1.5 cm of a block's edge
    float dy = abs(fract(y / 0.55) - 0.5) * 0.55;
    float du = abs(fract(u) - 0.5) * 1.1;
    float edge = max(smoothstep(0.255, 0.268, dy), smoothstep(0.535, 0.548, du));
    // gone by 70 m, where a joint would only shimmer
    joint = edge * (1.0 - smoothstep(35.0, 70.0, vDepth));
    tone = 0.97 + 0.06 * hash2(vec2(row, floor(u)));
    pl = vec2(along, y);
  }
  float vein = vnoise(pl * 1.7) * 0.6 + vnoise(pl * 6.0) * 0.4;
  // white still, but stone: a touch warm (Paris is built of a cream limestone), with the texture in the tone
  vec3 lime = c * vec3(1.0, 0.985, 0.955) * tone * (0.975 + 0.05 * vein);
  lime *= 1.0 - 0.16 * joint;
  return mix(c, lime, pale);
}

// ---- the landmark surface library (SURFACES in cartoon-material.ts): each a procedural pattern in world metres
// along the face, so every building is cut from the same brick and stone. Detail fades with distance, where it
// would only shimmer. NOTE no semicolons in comments here.
float nearFade(float a, float b) { return 1.0 - smoothstep(a, b, vDepth); }
// how much of this fragment is a lit room after dark (set by surfaceLook, applied after the lighting, which a
// lamp does not obey)
float gEmit = 0.0;
vec2 faceCoords(vec3 n) {
  if (abs(n.y) > 0.7) return vWorld.xz;
  vec2 t = normalize(vec2(-n.z, n.x));
  return vec2(dot(vWorld.xz, t), vWorld.y);
}
vec3 skyReflect(vec3 n) {
  vec3 r = reflect(normalize(vView), n);
  // the sky above the horizon, the city below it: a dark band of buildings, then the street
  vec3 skyTop = skyColour * 1.15;
  vec3 skyLow = mix(skyColour, fogColour, 0.6) * 1.1;
  vec3 sky = mix(skyLow, skyTop, clamp(r.y * 1.6, 0.0, 1.0));
  float city = smoothstep(0.12, -0.02, r.y);
  vec3 townband = mix(vec3(0.34, 0.35, 0.37), vec3(0.2, 0.21, 0.23), clamp(-r.y * 3.0, 0.0, 1.0));
  vec3 col = mix(sky, townband, city);
  // the sun's glint
  float g = pow(max(dot(r, -normalize(sunDir)), 0.0), 60.0);
  return col + sunColour * g * 1.4;
}
vec3 surfaceLook(vec3 c, vec3 n, float sid) {
  vec2 p = faceCoords(n);
  float vert = abs(n.y) < 0.7 ? 1.0 : 0.0;
  if (sid < 1.5) {
    // 1 ASHLAR: dressed stone blocks, 1.1 x 0.55 m
    float row = floor(p.y / 0.55);
    float u = p.x / 1.1 + 0.5 * mod(row, 2.0);
    float edge = max(smoothstep(0.455, 0.49, abs(fract(p.y / 0.55) - 0.5)), smoothstep(0.475, 0.498, abs(fract(u) - 0.5))) * vert;
    float tone = 0.95 + 0.1 * hash2(vec2(row, floor(u)));
    float vein = vnoise(p * 1.7) * 0.6 + vnoise(p * 6.0) * 0.4;
    return c * tone * (0.97 + 0.06 * vein) * (1.0 - 0.18 * edge * nearFade(35.0, 70.0));
  }
  if (sid < 2.5) {
    // 2 BRICK: running bond, 0.24 x 0.086 m courses, each brick its own tone
    float row = floor(p.y / 0.086);
    float u = p.x / 0.24 + 0.5 * mod(row, 2.0);
    float mortar = max(step(0.4, abs(fract(p.y / 0.086) - 0.5)), step(0.455, abs(fract(u) - 0.5))) * vert;
    float tone = 0.84 + 0.28 * hash2(vec2(row, floor(u)));
    float near = nearFade(18.0, 40.0);
    vec3 b = c * mix(0.97, tone, near);
    // farther off, the courses as a faint banding, then nothing
    b *= 1.0 - 0.05 * (1.0 - near) * nearFade(40.0, 90.0) * step(0.3, abs(fract(p.y / 0.35) - 0.5));
    return mix(b, vec3(0.7, 0.68, 0.63), mortar * 0.8 * near);
  }
  if (sid < 3.5) {
    // 3 GRANITE: polished panels 1.5 x 0.9 m, speckled, a little of the sky in them
    float edge = max(step(0.485, abs(fract(p.y / 0.9) - 0.5)), step(0.49, abs(fract(p.x / 1.5) - 0.5))) * vert * nearFade(30.0, 60.0);
    float speck = (hash2(floor(p * 40.0)) - 0.5) * 0.16 * nearFade(8.0, 20.0);
    float tone = 0.94 + 0.1 * hash2(floor(vec2(p.x / 1.5, p.y / 0.9)));
    vec3 g = c * (tone + speck) * (1.0 - 0.25 * edge);
    float fres = pow(1.0 - max(dot(n, -normalize(vView)), 0.0), 3.0) * 0.35;
    return mix(g, skyReflect(n) * 0.8, fres);
  }
  if (sid < 4.5) {
    // 4 TERRACOTTA: glazed blocks 0.6 x 0.45 m, fine joints, a glaze sheen
    float edge = max(step(0.47, abs(fract(p.y / 0.45) - 0.5)), step(0.475, abs(fract(p.x / 0.6 + 0.5 * mod(floor(p.y / 0.45), 2.0)) - 0.5))) * vert * nearFade(20.0, 45.0);
    float tone = 0.96 + 0.07 * hash2(floor(vec2(p.x / 0.6, p.y / 0.45)));
    vec3 t = c * tone * (1.0 - 0.12 * edge);
    float fres = pow(1.0 - max(dot(n, -normalize(vView)), 0.0), 4.0) * 0.22;
    return mix(t, skyReflect(n), fres);
  }
  if (sid < 5.5) {
    // 5 CONCRETE: precast panels 3 x 1.8 m, weathering streaks run down from the joints
    float edge = max(step(0.49, abs(fract(p.y / 1.8) - 0.5)), step(0.492, abs(fract(p.x / 3.0) - 0.5))) * vert * nearFade(40.0, 80.0);
    float streak = vnoise(vec2(p.x * 2.5, p.y * 0.15)) * vert;
    float blot = vnoise(p * 0.6);
    return c * (0.9 + 0.08 * blot) * (1.0 - 0.1 * streak) * (1.0 - 0.2 * edge);
  }
  if (sid < 6.5) {
    // 6 GLASS: the sky and the city in it, more at a glancing angle, and lit rooms after dark
    float facing = max(dot(n, -normalize(vView)), 0.0);
    float fres = 0.3 + 0.6 * pow(1.0 - facing, 3.0);
    vec3 refl = skyReflect(n);
    // each pane a slightly different tilt: a checker of brightness breaks the mirror up
    vec2 cell = floor(vec2(p.x / 1.5, p.y / 3.6));
    float tilt = 0.9 + 0.2 * hash2(cell);
    vec3 g = mix(c, refl * tilt, fres);
    // after dark about a third of the rooms are lit, each its own warmth, a few cool office white. The room is
    // the builder's cell: its uv counts bays along and floors up (tower.ts), so a pane lights whole
    vec2 room = floor(vUV + 0.001) + floor(n.xz * 7.0) * 13.0;
    gEmit = step(0.64, hash2(room + 17.0)) * night * vert * 0.9;
    return g;
  }
  if (sid < 7.5) {
    // 7 METAL: standing-seam panels 0.6 m wide, a sheen that moves with the eye
    float seam = step(0.46, abs(fract(p.x / 0.6) - 0.5)) * vert * nearFade(20.0, 45.0);
    float facing = max(dot(n, -normalize(vView)), 0.0);
    vec3 m = c * (0.92 + 0.12 * facing) * (1.0 - 0.2 * seam);
    return mix(m, skyReflect(n), 0.18 * pow(1.0 - facing, 2.0));
  }
  if (sid < 8.5) {
    // 8 STUCCO: a fine trowelled noise and broader patches of repair and weather
    float grain = (vnoise(p * 9.0) - 0.5) * 0.08 * nearFade(15.0, 35.0) + (vnoise(p * 1.3) - 0.5) * 0.06;
    return c * (1.0 + grain);
  }
  if (sid < 9.5) {
    // 9 COPPER: verdigris with dark streaks run down it
    float streak = vnoise(vec2(p.x * 4.0, p.y * 0.3));
    float blotch = vnoise(p * 2.0);
    return mix(c, c * vec3(0.55, 0.62, 0.6), 0.35 * streak) * (0.92 + 0.12 * blotch);
  }
  if (sid < 10.5) {
    // 10 ROOF TILE: rows of scalloped tiles, 0.3 m, a tone per tile
    float row = floor(p.y / 0.3);
    float u = p.x / 0.25 + 0.5 * mod(row, 2.0);
    float shade = smoothstep(0.0, 0.3, fract(p.y / 0.3)) * 0.2 + 0.8;
    return c * shade * (0.9 + 0.2 * hash2(vec2(row, floor(u)))) * mix(1.0, 0.95, nearFade(20.0, 50.0));
  }
  if (sid > 13.5) {
    // 14 PLANKS: a timber deck — boards 0.22 m wide with a dark gap between, each its own tone of weathered wood, butt
    // joints staggered every 2.4 m (owner, 2026-10-18: "the planks should be visibly wood planks not uniform")
    float row = floor(p.y / 0.22);
    float along = p.x + hash2(vec2(row, 3.1)) * 2.4;
    float seg = floor(along / 2.4);
    float tone = 0.78 + 0.34 * hash2(vec2(row, seg));
    float gap = smoothstep(0.0, 0.06, fract(p.y / 0.22)) * smoothstep(0.0, 0.015, fract(along / 2.4));
    float grain = 0.94 + 0.06 * sin(along * 9.0 + row * 2.3);
    return c * mix(1.0, tone * grain * (0.55 + 0.45 * gap), nearFade(30.0, 90.0));
  }
  if (sid > 12.5) {
    // 13 FOLIAGE: ivy and creepers (render/landmarks/ivy.ts) — overlapping leaves about 0.12 m, dark gaps between them,
    // a lighter, yellower face to each leaf, broad clumps of tone; the leaves fade to the clumps with distance
    vec2 q = p + vec2(vnoise(p * 1.1), vnoise(p * 1.1 + 7.3)) * 0.5;
    float leaf = vnoise(q * 9.0);
    float sheen = vnoise(q * 21.0 + 3.1);
    float clump = vnoise(p * 0.8 + 2.7);
    float near = nearFade(12.0, 32.0);
    float gap = smoothstep(0.34, 0.12, leaf) * near;
    vec3 tint = mix(c * vec3(0.84, 1.0, 0.86), c * vec3(1.14, 1.1, 0.82), clump);
    return tint * (0.86 + (0.3 * sheen + 0.16 * leaf - 0.23) * near) * (1.0 - 0.5 * gap);
  }
  if (sid > 11.5) {
    // 12 ROCK: the photographed rock (render/rock-material.ts), from the three axes by the normal, a texture every 4 m
    // and again at a third of the scale, cooled to greywacke grey and tinted by the colour given
    vec3 w = pow(abs(n), vec3(4.0));
    w /= (w.x + w.y + w.z);
    vec3 q = vWorld / 4.0;
    vec3 r = texture2D(rockTex, q.zy).rgb * w.x + texture2D(rockTex, q.xz).rgb * w.y + texture2D(rockTex, q.xy).rgb * w.z;
    vec3 q2 = vWorld / 13.0 + 0.37;
    vec3 r2 = texture2D(rockTex, q2.zy).rgb * w.x + texture2D(rockTex, q2.xz).rgb * w.y + texture2D(rockTex, q2.xy).rgb * w.z;
    vec3 rock = mix(r, r2, 0.4);
    rock = mix(vec3(dot(rock, vec3(0.333))), rock, 0.3);
    return c * rock * 1.8;
  }
  // 11 CLAPBOARD: horizontal boards 0.15 m, each with its shadow line
  float board = fract(p.y / 0.15);
  return c * (0.93 + 0.07 * smoothstep(0.0, 0.25, board)) * mix(1.0, 0.95 + 0.1 * hash2(vec2(floor(p.y / 0.15), floor(p.x / 4.0))), nearFade(15.0, 40.0));
}
void main(void) {
  vec3 n = normalize(vNormal);
  float sun = max(dot(n, -normalize(sunDir)), 0.0);
  // banded rather than smooth: the step is what makes it read as drawn rather than rendered
  sun = smoothstep(0.0, 0.02, sun - 0.5) * 0.55 + sun * 0.45;
  float up = n.y * 0.5 + 0.5;
  // a surface a builder asked for, in any static material; the automatic pale-stone look only on the monuments
  vec3 base = vSurface > 0.5 ? surfaceLook(vColour.rgb, n, vSurface) : stone > 0.5 ? dressed(vColour.rgb, n) : vColour.rgb;
  vec3 lit = base * (mix(groundColour, skyColour, up) + sunColour * sun);
  // a rim light, so a dark shape never disappears into a dark background
  float rim = pow(1.0 - max(dot(n, -vView), 0.0), 3.0);
  // but mostly in the object's own brightness: added flat, it turned every thin dark thing (a bollard, a
  // lamp post, all glancing faces) pale sky-blue
  float lum = dot(vColour.rgb, vec3(0.3, 0.59, 0.11));
  lit += skyColour * rim * (0.18 + 0.47 * lum);
  /*
   * FLOODLIGHTS on the monuments after dark (night views 2026-10-05: City Hall, the Ferry Building and both bridges
   * were near-black shapes against the night sky — the real ones are floodlit). On the landmark and bridge materials
   * (the flood flag), a warm wash on the walls — vertical faces, brightest towards the eye so the lit side faces the rider —
   * scaled by the night. Roofs and the ground are left dark, as a floodlight leaves them.
   */
  if (flood > 0.5 && night > 0.0) {
    float wall = 1.0 - abs(n.y);
    float facing = 0.45 + 0.55 * max(dot(n, -vView), 0.0);
    lit += base * vec3(1.0, 0.86, 0.66) * (0.55 * wall * facing * night);
  }
  // a lamp head, a headlight, a traffic signal: bright by day, and the only thing lit after dark
  lit = mix(lit, vColour.rgb * (1.0 + 1.4 * night), vColour.a * (0.35 + 0.65 * night));
  // a lit window of the surface library, bright whatever the light outside
  if (gEmit > 0.0) {
    float k = hash2(floor(vUV + 0.001) + floor(n.xz * 7.0) * 13.0 + 5.0);
    vec3 room = k < 0.2 ? vec3(0.85, 0.92, 1.0) : mix(vec3(1.0, 0.78, 0.46), vec3(1.0, 0.9, 0.68), k);
    lit = mix(lit, room * 1.1, gEmit);
  }

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
attribute vec2 uv;
uniform mat4 world;
uniform mat4 viewProjection;
uniform vec3 eye;
varying vec3 vNormal;
varying vec4 vColour;
varying float vDepth;
varying vec3 vView;
varying vec3 vWorld;
varying float vSurface;
varying vec2 vUV;
void main(void) {
  vec4 wp = world * vec4(position, 1.0);
  vUV = uv;
  vWorld = wp.xyz;
  gl_Position = viewProjection * wp;
  vNormal = normalize(mat3(world) * normal);
  vColour = vec4(color.rgb, step(0.4, color.a) * (1.0 - step(0.9, color.a)));
  vView = normalize(wp.xyz - eye);
  vDepth = gl_Position.w;
  // a surface from the landmark library (SURFACES below), carried as a small alpha: id / 64
  vSurface = color.a < 0.3 ? floor(color.a * 64.0 + 0.5) : 0.0;
}
`

let registered = false

/**
 * The landmark surface library: what a face of a modelled building is made of, drawn procedurally by the
 * landmark material (in world metres, so every building shares the same brick and stone). A builder passes
 * `surfaceTag(SURFACES.brick)` as the quad's tag. Tag 0 is the old default, pale dressed stone by colour.
 */
export const SURFACES = { ashlar: 1, brick: 2, granite: 3, terracotta: 4, concrete: 5, glass: 6, metal: 7, stucco: 8, copper: 9, tile: 10, clapboard: 11, rock: 12, foliage: 13, planks: 14 } as const
export type Surface = keyof typeof SURFACES
export const surfaceTag = (s: Surface): number => SURFACES[s] / 64

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
      : ['position', 'normal', 'color', 'uv'],
    uniforms: ['world', 'viewProjection', 'eye', 'sunDir', 'sunColour', 'skyColour', 'groundColour',
      'fogColour', 'fogDensity', 'night', 'stone', 'flood'],
    samplers: ['rockTex'],
  })
  // the photographed rock for the `rock` surface (Poly Haven via Trail Trainer: public/rocks/textures)
  const rockTex = new Texture(typeof document === 'undefined' ? 'rocks/textures/rock_grey_diff.jpg' : new URL('rocks/textures/rock_grey_diff.jpg', document.baseURI).href, scene)
  rockTex.wrapU = rockTex.wrapV = Texture.WRAP_ADDRESSMODE
  mat.setTexture('rockTex', rockTex)
  applyCartoonLook(mat, DAYLIGHT)
  // the monuments' pale surfaces as dressed stone (BUGS.md #8); everything else stays flat
  mat.setFloat('stone', name === 'cartoonLandmark' || name === 'cartoonBridge' ? 1 : 0)
  // floodlit after dark: the monuments, the bridge structures, and the skyline's far landmarks and bridges
  mat.setFloat('flood', name === 'cartoonLandmark' || name === 'cartoonBridge' || name === 'cartoonSkyline' ? 1 : 0)
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

