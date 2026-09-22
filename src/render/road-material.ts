/**
 * The road, which is most of what a rider looks at for the whole session.
 *
 * Two decisions are worth explaining.
 *
 * **Markings are drawn in the shader, not painted into the texture.** A texture of a centre line would have
 * to be stretched to whatever width the street happens to be, and OSM streets change width constantly — so
 * the line would drift off centre at every junction and go fat on a boulevard. Instead every road vertex
 * carries *how far across the carriageway it is, in metres*, and the shader draws the line where that value
 * is near zero. The line is then exactly 12 cm wide on a 4 m alley and on a 20 m avenue, which is what paint
 * on a real road does.
 *
 * **Wheel polish.** Traffic burnishes two bands where the tyres run and leaves the crown between them and the
 * gutters either side darker and rougher. It costs two `smoothstep`s and it is the mark that makes a road
 * look used rather than laid this morning — worth more than any amount of extra texture resolution.
 *
 *      gutter   wheel track   crown   wheel track   gutter
 *      ──────┬──────────────┬───────┬──────────────┬──────
 *       dark │    polished  │ line  │   polished   │ dark
 */
import { Constants } from '@babylonjs/core/Engines/constants'
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Scene } from '@babylonjs/core/scene'
import { DAYLIGHT, NIGHT, WETNESS, type SkyLook } from './facade-material.ts'

/** How many metres of road one tile of a surface page covers. Matches tools/roadgen/paint.py. */
export const ROAD_PAGE_METRES = 6.0

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;        // x = signed metres across the carriageway, y = metres along it
attribute vec4 color;     // rgb = tint, a = half the carriageway width in metres
uniform mat4 worldViewProjection;
uniform mat4 world;
varying vec2 vAcross;
varying vec3 vNormal;
varying vec3 vTint;
varying float vHalf;
varying float vDepth;
varying vec3 vWorld;


void main(void) {
  gl_Position = worldViewProjection * vec4(position, 1.0);
  vWorld = (world * vec4(position, 1.0)).xyz;
  vAcross = uv;
  vNormal = normalize(mat3(world) * normal);
  vTint = color.rgb;
  vHalf = color.a;
  vDepth = gl_Position.w;
}
`

const FRAGMENT = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec2 vAcross;
varying vec3 vNormal;
varying vec3 vTint;
varying float vHalf;
varying float vDepth;
varying vec3 vWorld;
uniform sampler2D surfaceTex;
uniform vec3 sunDir;
uniform vec3 sunColour;
uniform vec3 skyColour;
uniform vec3 groundColour;
uniform vec3 fogColour;
uniform float fogDensity;
uniform float pageMetres;
uniform float marked;      // 1 for a carriageway that carries paint, 0 for setts, gravel, a footway
uniform float night;
uniform float wetness;     // 0 dry, 1 standing water
uniform vec3 zenith;
uniform vec3 horizon;
uniform vec3 eye;

// A band of the given width centred on 'at', softened by however much of it one pixel covers. Without the
// derivative term a centre line shimmers horribly as it recedes.
float hash21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

/* Smooth value noise in world metres, for where the water stands. */
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}

/*
 * Is the eye looking at this surface from underneath? The TRUE slope, from screen-space derivatives — not
 * the vertex normal, which on draped ground is always straight up. Testing "is the eye below this point"
 * made every hillside that rose above the eye transparent. The derivative normal is flipped to face the
 * eye, and if that eye-facing normal points down, the eye is under the ground.
 */
bool underside(vec3 p, vec3 e) {
  vec3 n = cross(dFdx(p), dFdy(p));
  float len = length(n);
  if (len < 1e-10) return false;
  n /= len;
  if (dot(n, e - p) < 0.0) n = -n;
  return n.y < -0.05;
}

float band(float x, float at, float width) {
  float d = abs(x - at) - width * 0.5;
  return 1.0 - smoothstep(0.0, fwidth(x) + 0.004, d);
}

void main(void) {
  /*
   * Never the underside. The ground is drawn without back-face culling because the clipper's winding is
   * not dependable, which meant that ground standing above the eye was drawn from beneath — a green
   * ceiling across the whole sky. The winding cannot say which side the eye is on, but the slope can.
   */
  if (underside(vWorld, eye)) discard;
  float across = vAcross.x;
  float along  = vAcross.y;
  vec3 tex = texture2D(surfaceTex, vec2(across, along) / pageMetres).rgb;
  // 2.0 was chosen when the tints were brighter and at this exposure it washed every street out
  vec3 base = tex * vTint * 1.25;

  // Wheel polish, but only on a carriageway STRIP, where 'across' means distance from the centre line. The
  // unioned road surface has no centre line to measure from — its uvs are just world metres — so it carries
  // a half-width of zero and is left alone.
  if (vHalf > 0.5) {
    float track = abs(across) / vHalf;
    float polish = smoothstep(0.18, 0.42, track) * (1.0 - smoothstep(0.58, 0.86, track));
    float gutter = smoothstep(0.72, 1.0, track);
    base *= 1.0 + polish * 0.14 - gutter * 0.18;
  }

  // paint. Only on a carriageway wide enough to have two directions on it.
  if (marked > 0.5 && vHalf > 2.6) {
    vec3 paint = vec3(0.86, 0.85, 0.80);
    // a dashed centre line, 3 m on in every 9 m
    float dash = step(fract(along / 9.0), 0.34);
    float centre = band(across, 0.0, 0.12) * dash;
    // solid edge lines, set in from the kerb
    float edges = band(abs(across), vHalf - 0.45, 0.10);
    float wear = 0.72 + 0.28 * step(0.35, fract(along * 0.7 + across));  // paint is never perfect
    base = mix(base, paint * wear, clamp(centre + edges, 0.0, 1.0) * 0.92);
  }

  /*
   * Where the water stands. Puddles are low-frequency noise in WORLD metres, so they stay put as the rider
   * moves and are the same size on a boulevard as on an alley, plus a bias towards the gutter: a road is
   * cambered, and water on it ends up at the edges, which is also where it is most visible from a bike.
   */
  float puddle = 0.0;
  if (wetness > 0.01) {
    float gutter = smoothstep(0.55, 1.0, abs(across) / max(vHalf, 0.5)) * marked;
    puddle = smoothstep(0.48, 0.74, vnoise(vWorld.xz * 0.22) + gutter * 0.24);
    // wet asphalt is darker than dry asphalt everywhere, and darkest where it is deepest
    base *= mix(1.0, mix(0.60, 0.38, puddle), wetness);
  }

  vec3 n = normalize(vNormal);
  float sun = max(dot(n, -normalize(sunDir)), 0.0);
  float up = n.y * 0.5 + 0.5;
  vec3 lit = base * (mix(groundColour, skyColour, up) + sunColour * sun);
  /*
   * The pool of light a street lamp throws — not modelled per lamp, just the fact that a lit street is lit.
   * It backs off on a WET night, because there it is the wrong mechanism: spread evenly over the road it
   * washes the whole surface one warm brown and leaves the puddles with nothing to be brighter than. On wet
   * tarmac the lamplight belongs in the reflection, where it pools.
   */
  if (night > 0.01) lit += base * vec3(0.26, 0.21, 0.14) * night * (1.0 - wetness * 0.75);

  /*
   * And the mirror. A dry road scatters, a wet one reflects, hardest at a grazing angle — which is exactly
   * the angle a rider sees the road ahead at, so the street turns to glass towards the horizon and stays
   * merely dark underneath. At night the thing it reflects is not the sky, which is black, but the street
   * lighting, and a puddle carrying lamplight is the whole reason to render rain at all.
   */
  if (wetness > 0.01) {
    vec3 view = normalize(vWorld - eye);
    float grazing = clamp(-view.y, 0.0, 1.0);
    float fresnel = 0.06 + 0.94 * pow(1.0 - grazing, 3.6);
    vec3 refl = mix(horizon, zenith, smoothstep(0.0, 0.45, grazing));
    /*
     * Only where the water STANDS. A constant term here put the lamplight into every fragment of the road
     * at once and turned a night street into a flat sheet of orange — the ground stopped having a texture
     * at all. What makes a wet street at night worth looking at is the contrast: black tarmac, and the
     * lights picked out in the puddles between.
     */
    refl += vec3(1.00, 0.78, 0.44) * night * puddle * 1.15;
    // a footway or grass sheens, and only a carriageway becomes a proper mirror
    float mirror = mix(0.45, 1.0, marked) * mix(0.58, 1.0, puddle) * wetness;
    lit = mix(lit, refl, clamp(fresnel * mirror, 0.0, 0.92));
    // and the sun's own glint on the water, which is what says "wet" rather than "dark"
    vec3 h = normalize(-normalize(sunDir) - view);
    lit += sunColour * pow(max(dot(n, h), 0.0), 190.0) * wetness * (0.35 + 0.65 * puddle) * 1.5;
  }

  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(lit, fogColour, clamp(fog, 0.0, 1.0)), 1.0);
}
`

let registered = false

/** The surfaces that carry painted markings; the rest are setts, gravel, dirt or a footway. */
const MARKED = new Set(['asphalt', 'concrete'])

export function roadMaterial(scene: Scene, surface: string, assetBase: string,
                             variant = ''): ShaderMaterial {
  const name = `road:${surface}${variant ? `:${variant}` : ''}`
  const existing = scene.materials.find((m) => m.name === name)
  if (existing) return existing as ShaderMaterial

  if (!registered) {
    Effect.ShadersStore['roadVertexShader'] = VERTEX
    Effect.ShadersStore['roadFragmentShader'] = FRAGMENT
    registered = true
  }

  const mat = new ShaderMaterial(name, scene, 'road', {
    attributes: ['position', 'normal', 'uv', 'color'],
    uniforms: ['world', 'worldViewProjection', 'sunDir', 'sunColour', 'skyColour', 'groundColour',
      'fogColour', 'fogDensity', 'pageMetres', 'marked', 'night', 'wetness', 'zenith', 'horizon', 'eye'],
    samplers: ['surfaceTex'],
  })
  const tex = new Texture(`${assetBase}${surface}.png`, scene, false, false)
  tex.wrapU = Texture.WRAP_ADDRESSMODE
  tex.wrapV = Texture.WRAP_ADDRESSMODE
  mat.setTexture('surfaceTex', tex)
  mat.setFloat('pageMetres', ROAD_PAGE_METRES)
  mat.setFloat('marked', MARKED.has(surface) ? 1 : 0)
  applyRoadLook(mat, DAYLIGHT)
  // The ground is flat and only ever seen from above, and the polygons that make it come from a clipper
  // whose ring winding is not something worth depending on. Culling buys nothing here and costs an entire
  // invisible road network when the winding goes the other way.
  mat.backFaceCulling = false
  // explicit, so a layer that overrides it to ALWAYS cannot leak into anything drawn afterwards
  mat.depthFunction = Constants.LEQUAL
  return mat
}

/**
 * A ground layer that PAINTS rather than depth-tests within itself.
 *
 * The corridor and the carriageway are each made of overlapping quads — every street laps over its
 * neighbours at a bend and at a junction — and coplanar overlap z-fights horribly. Each layer lives in its
 * own rendering group, Babylon clears depth between groups, and nothing else shares the group, so the depth
 * test inside a layer buys nothing and costs a shimmering road. `ALWAYS` makes the last quad drawn win,
 * which is what a painter would do and what the layering already assumes.
 */
export function groundLayerMaterial(scene: Scene, assetBase: string, surface: string,
                                    name: string): ShaderMaterial {
  const mat = roadMaterial(scene, surface, assetBase, `layer:${name}`)
  /*
   * LEQUAL, not ALWAYS — with no depth write, overlapping quads in the layer still resolve by the order they
   * are drawn (nothing in the layer writes depth to test against), but the terrain occluder drawn first in
   * the group now hides the parts of the layer behind a hill. Under ALWAYS the roads beyond a crest showed
   * through it.
   */
  mat.depthFunction = Constants.LEQUAL
  // and writes none: a painted layer hides nothing by depth, and the pavement round a bridge lapping over
  // the river hid the river once the water began to depth-test
  mat.disableDepthWrite = true
  return mat
}

export function applyRoadLook(mat: ShaderMaterial, look: SkyLook): void {
  mat.setVector3('sunDir', look.sun)
  mat.setColor3('sunColour', look.sunColour)
  mat.setColor3('skyColour', look.skyColour)
  mat.setColor3('groundColour', look.groundColour)
  mat.setColor3('fogColour', look.fogColour)
  mat.setFloat('fogDensity', look.fogDensity)
  mat.setFloat('night', NIGHT)
  mat.setFloat('wetness', WETNESS)
  mat.setColor3('zenith', look.zenith)
  mat.setColor3('horizon', look.horizon)
  // far overhead until the first frame supplies the real eye, so nothing is discarded before then
  mat.setVector3('eye', new Vector3(0, 1e5, 0))
}

