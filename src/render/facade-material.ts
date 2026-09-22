/**
 * The material every building is drawn with, and the reason the facade generator works at all.
 *
 * Two pages are bound at once because they are sampled differently and cannot share a texture:
 *
 *   `wall`   a seamless material page for this style, sampled with REPEATING uvs in metres, so a twelve-metre
 *            wall gets five courses of brick rather than one brick stretched twelve metres.
 *   `atlas`  the painted elements, sampled with CLAMPED uvs inside one cell, so a window stays in its cell.
 *
 * A per-vertex `kind` attribute picks between them, which keeps a whole style down to one draw call.
 *
 * Then the tint. Both pages store **alpha as a mask, not as transparency**:
 *
 *     colour = albedo.rgb * mix(vec3(1.0), tint, albedo.a)
 *
 * The brick page is painted pale, so `tint` makes it red on one street and yellow-buff on the next; the
 * mortar is painted with a low mask and stays pale in both; glass is painted with a zero mask and keeps the
 * colour it was given, because a red building does not have red windows. That one line is what lets seven
 * styles and four palettes each cover a city without a single repeated-looking building.
 *
 * Lighting is deliberately simple — a sun term and a sky/ground hemisphere — because the facades carry their
 * own painted shading (the reveal shadow in every opening is doing the work a real light could not do at this
 * cost), and because the platform runs on whatever GPU the rider's machine has.
 */
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Constants } from '@babylonjs/core/Engines/constants'
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import type { Scene } from '@babylonjs/core/scene'

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec4 color;      // rgb = the building's palette tint, a = which page to sample
uniform mat4 worldViewProjection;
uniform mat4 world;
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vTint;
varying float vKind;
varying float vDepth;
varying vec3 vWorld;


void main(void) {
  vec4 wp = world * vec4(position, 1.0);
  gl_Position = worldViewProjection * vec4(position, 1.0);
  vUV = uv;
  vNormal = normalize(mat3(world) * normal);
  vTint = color.rgb;
  vKind = color.a;
  vWorld = wp.xyz;
  vDepth = gl_Position.w;
}
`

const FRAGMENT = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vTint;
varying float vKind;
varying float vDepth;
varying vec3 vWorld;
uniform sampler2D wallTex;
uniform sampler2D atlasTex;
uniform vec3 sunDir;
uniform vec3 sunColour;
uniform vec3 skyColour;
uniform vec3 groundColour;
uniform vec3 fogColour;
uniform float fogDensity;
uniform vec3 eye;
uniform vec3 zenith;
uniform vec3 horizon;
uniform float night;
uniform float flatGround;  // 1 for the ground variant: parks and pavements, drawn without culling

// The sky, as a function of direction. There is no environment map — a city of this size cannot afford one
// per material and would not gain much — so the sky is the same two-colour gradient the ambient term uses,
// which means a reflection always agrees with the light in the scene.
vec3 skyAt(vec3 dir) {
  float up = clamp(dir.y, -1.0, 1.0);
  vec3 above = mix(horizon, zenith, pow(max(up, 0.0), 0.55));
  // below the horizon a window reflects the street, not the sky, which is what stops ground-floor glass from
  // glowing brighter than the sky above it
  vec3 below = mix(horizon * 0.55, groundColour * 1.4, pow(max(-up, 0.0), 0.6));
  return up > 0.0 ? above : below;
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

void main(void) {
  // The ground variant is drawn with culling off, so it must refuse its own underside, or a lawn standing
  // above the eye becomes a green ceiling.
  if (flatGround > 0.5 && underside(vWorld, eye)) discard;
  // vKind: 0 = the seamless wall page (uv in metres, wrapped), 1 = the element atlas (uv already a cell)
  vec4 w = texture2D(wallTex, vUV);
  vec4 a = texture2D(atlasTex, vUV);
  vec4 albedo = mix(w, a, step(0.5, vKind));

  vec3 n = normalize(vNormal);
  vec3 view = normalize(vWorld - eye);
  vec3 lit;

  // A reserved alpha band marks GLASS. Everything else uses alpha as a tint mask.
  float isGlass = step(0.004, albedo.a) * step(albedo.a, 0.035);

  if (isGlass > 0.5) {
    // Schlick fresnel: glass seen square on is a window, glass seen at a grazing angle is a mirror. This one
    // term is most of why real glass reads as glass — a flat gradient never does, however well painted.
    float cosine = clamp(dot(-view, n), 0.0, 1.0);
    float fresnel = 0.05 + 0.95 * pow(1.0 - cosine, 5.0);

    vec3 reflected = reflect(view, n);
    vec3 sky = skyAt(reflected);

    // the sun, caught in the pane
    float spec = pow(max(dot(reflected, -normalize(sunDir)), 0.0), 220.0);

    // the painted pixel becomes the room behind the glass: darkened, and tinted slightly by the sky so an
    // unlit interior is cold rather than black
    vec3 interior = albedo.rgb * 0.34 + skyColour * 0.06;

    lit = mix(interior, sky, clamp(fresnel * 1.35, 0.0, 0.94)) + sunColour * spec * 1.6;

    /*
     * After dark, some of the windows are on.
     *
     * A city at night is not a dark city, it is a black city with thousands of lit windows in it, and that
     * is the entire difference between the picture at midnight and the picture at noon. Which windows are
     * lit comes from the cell the pixel is in, so a window is lit or not as a whole and stays that way —
     * flickering per pixel would look like static.
     */
    if (night > 0.01) {
      /*
       * One random per WINDOW, keyed to where the window is in the world rather than to the texel.
       *
       * Hashing the texture coordinate gave a different answer for every pixel of every pane, so each
       * window came out as a mosaic of lit and unlit speckle — static, not a city. Quantising the world
       * position to roughly a bay and a storey gives one answer per window that holds still, and gives
       * neighbouring windows different answers, which is what a lit building looks like.
       */
      vec3 cell = floor(vec3(vWorld.x, vWorld.y, vWorld.z) / vec3(2.7, 3.1, 2.7));
      float r = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      float on = step(0.58, r) * night;
      vec3 warm = vec3(1.0, 0.85, 0.60) * (0.5 + 0.5 * fract(r * 7.3));
      lit = mix(lit, warm, on * 0.9);
    }
  } else {
    // The tint mask: alpha says how much of the building's palette colour multiplies this pixel.
    //
    // Scaled down, because the pages are painted NEAR WHITE on purpose — that is what makes one brick page
    // serve every palette — and a near-white page lit by a strong sun lands on 1.0 and stays there. The
    // whole city came out high-key and flat: pale stone, pale render, pale concrete, no material reading as
    // darker than any other. This is the exposure the painted pages are actually meant to be seen at.
    vec3 base = albedo.rgb * mix(vec3(1.0), vTint, albedo.a) * 0.80;
    float sun = max(dot(n, -normalize(sunDir)), 0.0);
    // a hemisphere term so north-facing walls are sky-lit rather than black
    float up = n.y * 0.5 + 0.5;
    lit = base * (mix(groundColour, skyColour, up) + sunColour * sun);
    // the glow a lit street throws back onto the walls above it
    if (night > 0.01) lit += base * vec3(0.16, 0.13, 0.09) * night;
  }

  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(lit, fogColour, clamp(fog, 0.0, 1.0)), 1.0);
}
`

let registered = false

/** How a vertex says which page it wants; written into the alpha of the colour attribute. */
export const KIND_WALL = 0
export const KIND_ATLAS = 1

export interface SkyLook {
  sun: Vector3
  sunColour: Color3
  skyColour: Color3
  groundColour: Color3
  fogColour: Color3
  fogDensity: number
  /** what a window reflects looking up, and at the horizon */
  zenith: Color3
  horizon: Color3
}

/**
 * A brighter sun and a darker sky, which is what gives a street its shape.
 *
 * The first values had a strong ambient and a modest sun, so every surface came out at roughly the same
 * brightness whichever way it faced — a city with no light direction in it, which reads as washed out and
 * flat however good the textures are. A sun that clearly beats the ambient puts one side of every street in
 * light and the other in shade, and that contrast is most of what makes a photograph of a city look like
 * one.
 */
/**
 * The four times of day, and why they are a LAUNCH setting rather than a clock.
 *
 * Every static shadow in the city is baked into its tile as geometry, which is what makes shadows
 * affordable without teaching a dozen hand-written shaders to sample a shadow map. The price of that is
 * that the sun cannot move during a ride: moving it would mean rebuilding every tile. Choosing the hour at
 * the start costs nothing, changes the whole look of the city, and is honest about the limitation instead
 * of pretending to a day/night cycle that the renderer cannot actually do.
 *
 * Night is the one that earns its place. A city at night is not a dark city — it is a black city with
 * thousands of lit windows in it, and that is a completely different picture from the same streets at noon.
 */
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

const LOOKS: Record<TimeOfDay, SkyLook & { night: number }> = {
  dawn: {
    sun: new Vector3(-0.80, -0.30, 0.52),
    sunColour: new Color3(1.32, 0.88, 0.62),
    skyColour: new Color3(0.40, 0.40, 0.52),
    groundColour: new Color3(0.20, 0.18, 0.19),
    fogColour: new Color3(0.82, 0.72, 0.68),
    fogDensity: 0.0026,
    zenith: new Color3(0.34, 0.44, 0.74),
    horizon: new Color3(0.95, 0.76, 0.62),
    night: 0.25,
  },
  day: {
    sun: new Vector3(-0.42, -0.72, 0.55),
    sunColour: new Color3(1.16, 1.05, 0.87),
    skyColour: new Color3(0.42, 0.47, 0.58),
    groundColour: new Color3(0.22, 0.21, 0.19),
    fogColour: new Color3(0.72, 0.76, 0.82),
    fogDensity: 0.0016,
    zenith: new Color3(0.40, 0.55, 0.82),
    horizon: new Color3(0.80, 0.85, 0.92),
    night: 0,
  },
  dusk: {
    sun: new Vector3(0.84, -0.22, -0.48),
    sunColour: new Color3(1.40, 0.74, 0.44),
    skyColour: new Color3(0.36, 0.34, 0.46),
    groundColour: new Color3(0.17, 0.15, 0.17),
    fogColour: new Color3(0.72, 0.58, 0.58),
    fogDensity: 0.0030,
    zenith: new Color3(0.24, 0.30, 0.60),
    horizon: new Color3(0.96, 0.62, 0.42),
    night: 0.55,
  },
  night: {
    // the "sun" is the moon: weak, cold, and high enough to give the streets some shape
    sun: new Vector3(-0.35, -0.80, 0.48),
    sunColour: new Color3(0.20, 0.23, 0.34),
    skyColour: new Color3(0.10, 0.12, 0.19),
    groundColour: new Color3(0.05, 0.05, 0.07),
    fogColour: new Color3(0.10, 0.11, 0.17),
    fogDensity: 0.0042,
    zenith: new Color3(0.03, 0.04, 0.09),
    horizon: new Color3(0.13, 0.14, 0.22),
    night: 1,
  },
}

/** How lit the windows are: 0 by day, 1 at night. Read by the facade and cartoon shaders. */
export let NIGHT = 0

/**
 * Choose the hour. Must be called BEFORE anything is built, because the materials read these values when
 * they are created and the shadows are baked with this sun.
 */
export function setTimeOfDay(when: TimeOfDay): void {
  const l = LOOKS[when]
  DAYLIGHT.sun.copyFrom(l.sun)
  DAYLIGHT.sunColour.copyFrom(l.sunColour)
  DAYLIGHT.skyColour.copyFrom(l.skyColour)
  DAYLIGHT.groundColour.copyFrom(l.groundColour)
  DAYLIGHT.fogColour.copyFrom(l.fogColour)
  DAYLIGHT.zenith.copyFrom(l.zenith)
  DAYLIGHT.horizon.copyFrom(l.horizon)
  DAYLIGHT.fogDensity = l.fogDensity
  NIGHT = l.night
}

/**
 * Weather, layered ON TOP of the hour rather than multiplied into it.
 *
 * Four times of day and three weathers is twelve looks to hand-tune and keep consistent, which is a table
 * nobody maintains. A weather is instead a MODIFIER applied after `setTimeOfDay`: overcast does the same
 * thing to dusk that it does to noon, because what overcast physically is does not depend on the hour — the
 * sun stops being a point and becomes the whole sky. So direct light goes down hard, ambient goes up, every
 * colour loses its saturation, and the fog thickens.
 *
 * Rain is overcast plus water on the ground, and the water is the part that matters. A dry street is a
 * diffuse surface and lighting it well is a matter of texture; a wet one is a MIRROR, and suddenly the road
 * carries the sky, the lamps and the headlights in it. That is the single biggest change to how a street
 * looks that this renderer can make, which is why it is worth more than another facade style.
 *
 * Like the hour, this must be set BEFORE anything is built.
 */
export type Weather = 'clear' | 'overcast' | 'rain'

/** How wet the ground is: 0 dry, 1 standing water. Read by the road shader. */
export let WETNESS = 0
/** How flat the light is: 0 direct sun, 1 a sky-wide softbox. Read by the shadows. */
export let OVERCAST = 0

/** Pull a colour towards its own luminance, then scale it. */
function flatten(c: Color3, desaturate: number, gain: number): void {
  const l = c.r * 0.30 + c.g * 0.59 + c.b * 0.11
  c.r = (c.r + (l - c.r) * desaturate) * gain
  c.g = (c.g + (l - c.g) * desaturate) * gain
  c.b = (c.b + (l - c.b) * desaturate) * gain
}

export function setWeather(w: Weather): void {
  WETNESS = w === 'rain' ? 1 : 0
  OVERCAST = w === 'clear' ? 0 : 1
  if (w === 'clear') return
  const d = DAYLIGHT
  // the sun loses; the sky wins. Both halves matter — cutting the sun alone just makes a dark city.
  flatten(d.sunColour, 0.88, 0.30)
  flatten(d.skyColour, 0.72, 1.38)
  flatten(d.groundColour, 0.65, 1.18)
  flatten(d.fogColour, 0.78, 0.94)
  flatten(d.zenith, 0.70, 0.86)
  flatten(d.horizon, 0.78, 0.90)
  d.fogDensity *= w === 'rain' ? 3.2 : 2.1
}

export const DAYLIGHT: SkyLook = {
  sun: new Vector3(-0.42, -0.72, 0.55),
  // Warm sun, cool sky: the two together are what give stone its colour. A neutral sun and a grey ambient
  // average out to grey, which is what "washed out" actually looks like.
  /*
   * Warm sun, cool sky — the two together are what give stone its colour, where a neutral sun against a grey
   * ambient averages out to grey. But the ambient has to stay high enough to READ: cut too far, the shaded
   * side of a street goes almost black, and a city where one side of every road is unreadable is not
   * dramatic, it is broken. This is the balance: a sun that clearly wins, over an ambient you can still see
   * a facade in.
   */
  sunColour: new Color3(1.16, 1.05, 0.87),
  skyColour: new Color3(0.42, 0.47, 0.58),
  groundColour: new Color3(0.22, 0.21, 0.19),
  fogColour: new Color3(0.72, 0.76, 0.82),
  fogDensity: 0.0016,
  zenith: new Color3(0.40, 0.55, 0.82),
  horizon: new Color3(0.80, 0.85, 0.92),
}

/**
 * One material per style, because each style has its own wall page. Cached, since a city has seven of them
 * and several thousand buildings.
 */
export function facadeMaterial(scene: Scene, styleId: string, assetBase: string,
                               variant = ''): ShaderMaterial {
  const name = `facade:${styleId}${variant ? `:${variant}` : ''}`
  const existing = scene.materials.find((m) => m.name === name)
  if (existing) return existing as ShaderMaterial

  if (!registered) {
    Effect.ShadersStore['facadeVertexShader'] = VERTEX
    Effect.ShadersStore['facadeFragmentShader'] = FRAGMENT
    registered = true
  }

  const mat = new ShaderMaterial(name, scene, 'facade', {
    attributes: ['position', 'normal', 'uv', 'color'],
    uniforms: ['world', 'worldViewProjection', 'sunDir', 'sunColour', 'skyColour', 'groundColour',
      'fogColour', 'fogDensity', 'eye', 'zenith', 'horizon', 'night', 'flatGround'],
    samplers: ['wallTex', 'atlasTex'],
  })

  const wall = new Texture(`${assetBase}walls/${styleId}.png`, scene, false, false)
  wall.wrapU = Texture.WRAP_ADDRESSMODE
  wall.wrapV = Texture.WRAP_ADDRESSMODE
  const atlas = new Texture(`${assetBase}atlas.png`, scene, false, false)
  // clamped, so a cell cannot sample its neighbour even before the 8 px bleed margin is reached
  atlas.wrapU = Texture.CLAMP_ADDRESSMODE
  atlas.wrapV = Texture.CLAMP_ADDRESSMODE

  mat.setTexture('wallTex', wall)
  mat.setTexture('atlasTex', atlas)
  applyLook(mat, DAYLIGHT)
  mat.setFloat('flatGround', variant === 'ground' ? 1 : 0)
  // far overhead until the first frame supplies the real eye, so nothing is discarded before then
  mat.setVector3('eye', new Vector3(0, 1e5, 0))
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

export function applyLook(mat: ShaderMaterial, look: SkyLook): void {
  mat.setVector3('sunDir', look.sun)
  mat.setColor3('sunColour', look.sunColour)
  mat.setColor3('skyColour', look.skyColour)
  mat.setColor3('groundColour', look.groundColour)
  mat.setColor3('fogColour', look.fogColour)
  mat.setFloat('fogDensity', look.fogDensity)
  mat.setColor3('zenith', look.zenith)
  mat.setColor3('horizon', look.horizon)
  mat.setFloat('night', NIGHT)
}

/**
 * Glass needs to know where the eye is, so this has to be fed every frame rather than set once. Babylon's
 * `ShaderMaterial` has no automatic for it when the camera is driven by hand, as the chase camera is.
 *
 * Wet road needs it for the same reason: a reflection is a function of the angle you look at it from, and
 * an eye that never moves gives a mirror painted onto the tarmac.
 */
export function updateEye(scene: Scene, eye: Vector3): void {
  for (const m of scene.materials) {
    // road materials use it too: for the wet mirror, and to refuse to draw the ground from underneath
    if (m.name.startsWith('facade:') || m.name.startsWith('road:')) (m as ShaderMaterial).setVector3('eye', eye)
  }
}
