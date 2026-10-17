/**
 * Flat signs: a building's name as ONE QUAD with a texture and an alpha channel.
 *
 * The letters are rendered by the browser's own text engine into a canvas at load — the same trick
 * render/signs.ts uses for the shop fascias, which is the proof it works — so a flat sign needs **no Blender
 * and no build step at all**: the recipe is in the builder, and the picture is made on the machine that is
 * drawing it. That matters beyond convenience. The extruded path (tools/signgen) needs Blender on the PATH
 * and bakes an asset per word; this one is portable to any machine and any city, which is why it is the
 * default and the extruded one is the exception.
 *
 * ## Alpha, depth and z-fighting — read this before moving a sign
 *
 * A sign sits directly on a wall, which is the situation this codebase has been bitten by over and over
 * (BUGS.md #15 and #110, and the four near-coplanar ground layers documented in city.ts). Three things are
 * done about it, deliberately:
 *
 *  1. **A real standoff.** The quad is pushed 6 cm out along the wall's normal (`SignSpec.standoff`). That
 *     is more than any facade reveal and is what actually separates the surfaces.
 *  2. **A polygon offset on top of it** (`zOffset = -2`, `zOffsetUnits = -4`), copied from signs.ts, because
 *     6 cm is below what the depth buffer resolves at a hundred metres seen at a grazing angle. It moves the
 *     depth test only, never where the sign is drawn.
 *  3. **Alpha BLENDING, not the ground layers' rendering-ORDER trick.** The order trick (depth ALWAYS, one
 *     layer over another) is right for the ground, where layers are exactly coplanar and cover each other
 *     completely. It is wrong here: a sign must be occluded by a lamp post in front of it. So the sign keeps
 *     a normal LEQUAL depth test, writes depth, blends its edges — and discards anything under 2% alpha so
 *     the empty part of the quad never writes depth over what is behind it. Blending rather than a hard
 *     alpha cut-off is what keeps the letterforms smooth at riding speed; a discard-only sign crawls with
 *     stair-steps exactly when the rider is moving past it.
 *
 * Signs never overlap each other, so nothing here depends on transparent sort order.
 *
 * ## Murals
 *
 * A mural is this, bigger. `SignSource` is a union whose second member is an image, `w`/`h` are both
 * askable-for, and everything below — the quad, the standoff, the blending, the LOD gate — is indifferent to
 * what the picture is of. Adding murals should be a new `source` branch in `paint()` and a size, not a
 * rewrite. It is deliberately not built.
 */
import { Constants } from '@babylonjs/core/Engines/constants'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Effect } from '@babylonjs/core/Materials/effect'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { DAYLIGHT, NIGHT } from './facade-material.ts'
import { FACES, signCorners, type PlacedSign, type SignSpec } from './landmarks/signage.ts'

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
uniform mat4 world;
uniform mat4 viewProjection;
varying vec2 vUV;
varying vec3 vNormal;
varying float vDepth;
void main(void) {
  vec4 wp = world * vec4(position, 1.0);
  gl_Position = viewProjection * wp;
  vUV = uv;
  vNormal = normalize(mat3(world) * normal);
  vDepth = gl_Position.w;
}
`

/*
 * The day picture is `plate`; `glow` is what the sign does after dark and is sampled only when `night` is
 * above zero, which is the same gate facade-material.ts puts on its lit windows. By day this is one texture
 * fetch and a blend.
 */
const FRAGMENT = `
precision highp float;
varying vec2 vUV;
varying vec3 vNormal;
varying float vDepth;
uniform sampler2D plate;
uniform sampler2D glow;
uniform vec3 sunDir;
uniform vec3 sunColour;
uniform vec3 skyColour;
uniform vec3 groundColour;
uniform vec3 fogColour;
uniform float fogDensity;
uniform float night;
uniform float hasGlow;
void main(void) {
  vec4 t = texture2D(plate, vUV);
  // the empty part of the quad is not drawn at all, so it never writes depth over what is behind the sign
  if (t.a < 0.02) discard;
  vec3 n = normalize(vNormal);
  float sun = max(dot(n, -normalize(sunDir)), 0.0);
  float up = n.y * 0.5 + 0.5;
  vec3 lit = t.rgb * (mix(groundColour, skyColour, up) + sunColour * sun);
  // RIGGED, NOT TUNED: no night view exists yet to judge this in (2026-09-23)
  if (night > 0.01 && hasGlow > 0.5) {
    vec4 g = texture2D(glow, vUV);
    lit = mix(lit, g.rgb * 1.25, clamp(g.a * night, 0.0, 1.0));
  }
  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(lit, fogColour, clamp(fog, 0.0, 1.0)), t.a);
}
`

let registered = false

const hex = (c: [number, number, number] | undefined, fallback: string): string => {
  if (!c) return fallback
  const b = (v: number): string => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')
  return `#${b(c[0])}${b(c[1])}${b(c[2])}`
}

/** The CSS font string for a spec, at `px` pixels. */
function cssFont(spec: SignSpec, px: number): string {
  const stack = FACES[spec.face ?? 'grotesque']
  return `${spec.italic ? 'italic ' : ''}${spec.weight ?? 'normal'} ${px}px ${stack}`
}

/**
 * How many pixels tall a CAPITAL is at a given font size, in the face asked for. Measured rather than
 * assumed: a script's em box is mostly flourish and a condensed grotesque's is mostly cap, so the same
 * `font-size` gives letters that differ by a factor of two between faces. `h` is a CAP height in metres
 * because that is what a builder can read off a photograph.
 */
function capPixels(ctx: CanvasRenderingContext2D, spec: SignSpec, px: number): number {
  ctx.font = cssFont(spec, px)
  const m = ctx.measureText('H')
  return m.actualBoundingBoxAscent > 1 ? m.actualBoundingBoxAscent : px * 0.7
}

/** The layout of a flat sign in TEXTURE pixels, before anything is drawn. */
interface Layout {
  fontPx: number
  capPx: number
  padX: number
  padY: number
  width: number
  height: number
  /** the baseline (horizontal) or the centre of each glyph (vertical) */
  glyphs: { ch: string; x: number; y: number; rot?: number }[]
  /** a ring sign's disc and its inner line, in pixels */
  disc?: { r: number; line: number }
  /** cap heights across the whole picture, so the quad's metres follow from `h` */
  wOverCap: number
  hOverCap: number
}

/**
 * Lay the words out. One line horizontally, or one glyph per line down a blade. `tracking` is letterspacing
 * in cap heights, which is how an engraved capital on stone is specified (SAKS FIFTH AVENUE is mostly
 * tracking); it is applied glyph by glyph rather than through `ctx.letterSpacing`, which not every engine has.
 */
export function layout(ctx: CanvasRenderingContext2D, spec: SignSpec): Layout {
  const fontPx = 160
  const capPx = capPixels(ctx, spec, fontPx)
  ctx.font = cssFont(spec, fontPx)
  const chars = [...spec.text]
  const track = (spec.tracking ?? 0) * capPx
  const padded = spec.panel !== undefined
  const padX = padded ? capPx * 0.55 : capPx * 0.18
  const padY = padded ? capPx * 0.45 : capPx * 0.3
  const glyphs: Layout["glyphs"] = []
  let width: number
  let height: number
  if (spec.ring) {
    // round a disc: the words over the top read left to right with their tops OUT, those under the bottom read left
    // to right with their tops IN; each word spans at most 0.85 of a half turn, which sets the radius
    const top = [...spec.text], low = [...(spec.ring.below ?? '')]
    const run = (cs: string[]): number => cs.reduce((a, c) => a + ctx.measureText(c).width, 0) + track * Math.max(0, cs.length - 1)
    const span = Math.PI * 0.85
    const rb = Math.max(run(top), run(low)) / span + capPx * 0.2          // the top words' baseline radius
    const R = rb + capPx * 1.45
    width = height = Math.ceil(R * 2)
    const c = R
    const lay = (cs: string[], r: number, over: boolean): void => {
      let a = -run(cs) / r / 2
      for (const ch of cs) {
        const w = ctx.measureText(ch).width
        const m = a + w / 2 / r
        if (over) glyphs.push({ ch, x: c + Math.sin(m) * r, y: c - Math.cos(m) * r, rot: m })
        else glyphs.push({ ch, x: c + Math.sin(m) * r, y: c + Math.cos(m) * r, rot: -m })
        a += (w + track) / r
      }
    }
    lay(top, rb, true)
    lay(low, rb + capPx, false)
    return { fontPx, capPx, padX: 0, padY: 0, width, height, glyphs, disc: { r: R, line: rb - capPx * 0.35 },
      wOverCap: width / capPx, hOverCap: height / capPx }
  }
  if (spec.vertical) {
    const line = capPx * 1.34
    const wide = Math.max(...chars.map((c) => ctx.measureText(c).width), 1)
    width = wide + padX * 2
    height = chars.length * line + padY * 2
    chars.forEach((ch, i) => glyphs.push({ ch, x: width / 2, y: padY + i * line + capPx }))
  } else {
    const w = chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + track * Math.max(0, chars.length - 1)
    width = w + padX * 2
    // room under the baseline for descenders and a script's tails, which are not part of the cap height
    height = capPx * 1.42 + padY * 2
    let x = padX
    chars.forEach((ch) => { glyphs.push({ ch, x, y: padY + capPx }); x += ctx.measureText(ch).width + track })
  }
  return { fontPx, capPx, padX, padY, width: Math.ceil(width), height: Math.ceil(height), glyphs,
    wOverCap: width / capPx, hOverCap: height / capPx }
}

/**
 * Paint a sign into a context. `mode` picks what is being painted:
 *   `day`   the picture as it is seen in daylight — the panel, the halo, the letters.
 *   `glow`  what EMITS after dark, and nothing else: for `self` the letters, for `back` the panel with the
 *           letters punched out of it (so they read as silhouettes), for `front` the whole face, dimly.
 */
function paint(ctx: CanvasRenderingContext2D, spec: SignSpec, L: Layout, mode: 'day' | 'glow'): void {
  ctx.clearRect(0, 0, L.width, L.height)
  ctx.font = cssFont(spec, L.fontPx)
  ctx.textAlign = spec.vertical ? 'center' : 'left'
  ctx.textBaseline = 'alphabetic'
  const ink = hex(spec.colour, '#f2f0ea')
  const panel = spec.panel ? hex(spec.panel, '#101010') : null
  // (a ring sign's glyphs each turned about their own baseline centre)
  const each = (draw: (ch: string, x: number, y: number) => void): void => {
    for (const g of L.glyphs) {
      if (g.rot === undefined) { draw(g.ch, g.x, g.y); continue }
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.rot); draw(g.ch, 0, 0); ctx.restore()
    }
  }
  if (L.disc) ctx.textAlign = 'center'
  const letters = (style: string): void => {
    ctx.fillStyle = style
    each((ch, x, y) => ctx.fillText(ch, x, y))
  }
  // a ring sign's ground is a disc, with a thin line inside the words
  const ground = (style: string): void => {
    ctx.fillStyle = style
    if (!L.disc) { ctx.fillRect(0, 0, L.width, L.height); return }
    ctx.beginPath(); ctx.arc(L.width / 2, L.height / 2, L.disc.r, 0, Math.PI * 2); ctx.fill()
  }
  if (mode === 'glow') {
    if (spec.lit === 'self') { letters(ink); return }
    if (spec.lit === 'back') {
      // the panel lights and the letters are cut OUT of it: dark figures on a bright ground
      ground(panel ?? '#fff6e0')
      ctx.globalCompositeOperation = 'destination-out'
      letters('#000')
      ctx.globalCompositeOperation = 'source-over'
      return
    }
    // `front`: floodlit from outside — the whole face pale, the letters no brighter than the board
    if (panel) ground(panel)
    letters(ink)
    return
  }
  if (panel) ground(panel)
  if (L.disc) {
    ctx.strokeStyle = ink
    ctx.lineWidth = Math.max(2, L.capPx * 0.06)
    ctx.beginPath(); ctx.arc(L.width / 2, L.height / 2, L.disc.line, 0, Math.PI * 2); ctx.stroke()
  }
  if (spec.halo) {
    // the outline that makes pale letters read against a pale wall, and a dark one against the sky
    ctx.strokeStyle = hex(spec.halo, '#000')
    ctx.lineWidth = Math.max(2, L.capPx * 0.07)
    ctx.lineJoin = 'round'
    each((ch, x, y) => ctx.strokeText(ch, x, y))
  }
  letters(ink)
}

/** A flat sign's picture and the shape of its quad, cached across the scene by its recipe. */
export interface Plate {
  mat: ShaderMaterial
  /** the width of the quad, as a multiple of the cap height the builder asked for */
  wOverCap: number
  hOverCap: number
}

const plates = new Map<string, Plate>()

/** Everything about a sign that changes its PICTURE (not where it stands): the cache key. */
const recipe = (s: SignSpec): string => JSON.stringify([s.text, s.face, s.weight, s.italic, s.colour, s.panel,
  s.halo, s.tracking, s.vertical, s.lit, s.twoSided, s.ring])

export function signPlate(scene: Scene, spec: SignSpec): Plate | null {
  const key = recipe(spec)
  const had = plates.get(key)
  // the cache is per recipe and per scene: a scene thrown away takes its materials with it (resetSignPlates)
  if (had && had.mat.getScene() === scene) return had
  if (!registered) {
    Effect.ShadersStore['signPlateVertexShader'] = VERTEX
    Effect.ShadersStore['signPlateFragmentShader'] = FRAGMENT
    registered = true
  }
  // measured on a throwaway context, because the real one cannot be sized until the layout is known
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return null
  const L = layout(probe, spec)
  const tex = new DynamicTexture(`signPlate:${spec.text}`, { width: L.width, height: L.height }, scene, true,
    Texture.TRILINEAR_SAMPLINGMODE)
  tex.hasAlpha = true
  tex.wrapU = Texture.CLAMP_ADDRESSMODE
  tex.wrapV = Texture.CLAMP_ADDRESSMODE
  paint(tex.getContext() as unknown as CanvasRenderingContext2D, spec, L, 'day')
  tex.update(true)
  const mat = new ShaderMaterial(`signPlate:${spec.text}`, scene, 'signPlate', {
    attributes: ['position', 'normal', 'uv'],
    uniforms: ['world', 'viewProjection', 'sunDir', 'sunColour', 'skyColour', 'groundColour', 'fogColour',
      'fogDensity', 'night', 'hasGlow'],
    samplers: ['plate', 'glow'],
    needAlphaBlending: true,
  })
  mat.setTexture('plate', tex)
  mat.setVector3('sunDir', DAYLIGHT.sun)
  mat.setColor3('sunColour', DAYLIGHT.sunColour)
  mat.setColor3('skyColour', DAYLIGHT.skyColour)
  mat.setColor3('groundColour', DAYLIGHT.groundColour)
  mat.setColor3('fogColour', DAYLIGHT.fogColour)
  mat.setFloat('fogDensity', DAYLIGHT.fogDensity)
  mat.setFloat('night', NIGHT)
  // the emissive picture, on the signs that are lit at all: one more texture, no geometry, unused by day
  if (spec.lit !== 'none') {
    const gt = new DynamicTexture(`signGlow:${spec.text}`, { width: L.width, height: L.height }, scene, true,
      Texture.TRILINEAR_SAMPLINGMODE)
    gt.hasAlpha = true
    gt.wrapU = Texture.CLAMP_ADDRESSMODE
    gt.wrapV = Texture.CLAMP_ADDRESSMODE
    paint(gt.getContext() as unknown as CanvasRenderingContext2D, spec, L, 'glow')
    gt.update(true)
    mat.setTexture('glow', gt)
    mat.setFloat('hasGlow', 1)
  } else {
    mat.setTexture('glow', tex)
    mat.setFloat('hasGlow', 0)
  }
  // a free-standing roof sign is seen from behind too, its letters mirrored (the Ferry Building's from the city)
  mat.backFaceCulling = !spec.twoSided
  mat.depthFunction = Constants.LEQUAL
  // see the header: the standoff separates the surfaces, this separates the DEPTH TEST (BUGS.md #15)
  mat.zOffset = -2
  mat.zOffsetUnits = -4
  const plate: Plate = { mat, wOverCap: L.wOverCap, hOverCap: L.hOverCap }
  plates.set(key, plate)
  return plate
}

/** How big a flat sign's quad is, in metres. `w` overrides the width a wall must fit. */
export function plateSize(spec: SignSpec, plate: Plate): { w: number; h: number } {
  const w = spec.w ?? spec.h * plate.wOverCap
  const k = spec.w !== undefined ? spec.w / (spec.h * plate.wOverCap) : 1
  return { w, h: spec.h * plate.hOverCap * k }
}

/**
 * The mesh for one flat sign, in the landmark's LOCAL frame — the caller puts the landmark's own position,
 * rotation and scale on it. Two triangles, whatever the word.
 */
export function flatSignMesh(scene: Scene, p: PlacedSign, name: string): Mesh | null {
  const plate = signPlate(scene, p.spec)
  if (!plate) return null
  const { w, h } = plateSize(p.spec, plate)
  const mb = new MeshBuilder()
  const { corners, uvs, normal } = signCorners(p, w, h, p.spec.standoff ?? 0.06)
  mb.quad(corners as [[number, number, number], [number, number, number], [number, number, number], [number, number, number]],
    normal, uvs, [1, 1, 1], 0)
  const m = new Mesh(name, scene)
  mb.toVertexData().applyToMesh(m)
  m.material = plate.mat
  m.isPickable = false
  return m
}

/** Only for the tests and the shot tool: forget the cached plates (a scene was thrown away). */
export function resetSignPlates(): void { plates.clear() }
