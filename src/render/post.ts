/**
 * THE PICTURE'S FINISH (owner, 2026-11-18: "figure out shaders, effects, or postprocessing that can make the game look
 * more realistic and vibrant… allow them to be toggled in the graphics mode. current appearance is good, but seems
 * pretty basic with sharp lines and flat colors").
 *
 * The chain on the game camera, in order — every pass optional (Menu → Settings → Graphics, `?without=<name>`):
 *
 *   ao        ambient occlusion (render/depth.ts)
 *   shadows   sun shadows from a shadow map: an orthographic camera looks down the sun at ~220 m round the rider
 *             and keeps the depth of what it sees; each pixel's world position, rebuilt from the geometry buffer, is
 *             compared with it (soft Poisson PCF, slope-scaled bias), and what is behind a caster goes a cool shade.
 *             Buildings off screen and behind the camera cast too. Redrawn only every few metres (casters are static).
 *   bloom     the brightest parts (sky, sunlit stone, paint) bleed softly into what is round them: it is what takes
 *             the cut-out edge off a roofline against the sky
 *   grade     render/grade.ts, now with a film look (tone curve, vibrance, cool shade / warm light), vignette, grain
 *   fxaa      last, as before
 *
 * THE DEPTH. Babylon's SSAO2 defaults to the pre-pass renderer, which writes depth only for materials that declare
 * pre-pass support — and every material in this city is a hand-written ShaderMaterial, which does not. So the AO had
 * almost no depth to read (contacts on Babylon's own materials only). A GeometryBufferRenderer draws every mesh with its
 * own shader into view-space depth and normals, whatever the mesh's material; when any effect here wants depth, one is
 * made and shared by the AO and the shadows (one extra geometry pass, desktop tiers only).
 *
 * `window.__fx` (dev): `__fx.set('shadows', 0)` zeroes one effect's strength without a reload, for A/B shots
 * (tools/fx-shots.ts).
 */
import { BlurPostProcess, Camera, Constants, DepthRenderer, Effect, GeometryBufferRenderer, Matrix, PassPostProcess,
  PostProcess, RenderTargetTexture, TargetCamera, Vector2, Vector3, type AbstractMesh, type Mesh, type Scene } from '@babylonjs/core'
import { ambientOcclusion } from './depth.ts'
import { colourGrade, type Grade } from './grade.ts'
import { DAYLIGHT } from './facade-material.ts'

export interface FxChoice { ao: boolean; shadows: boolean; bloom: boolean; grade: boolean; film: boolean; vignette: boolean; grain: boolean; aoGeometry: boolean }

/** Every tunable number, in one place. */
export const FX = {
  shadow: {
    strength: 0.62,        // 1: the sun's whole share taken away in shade; less leaves some, as the sky's bounce would
    extent: 110,           // metres from the map's centre to its edge (the map is 2 × this square, seen along the sun)
    size: 2048,            // map texels a side: 2 × 110 m / 2048 ≈ 11 cm a texel
    ahead: 25,             // metres the map's centre sits ahead of the camera, where the picture is
    refresh: 6,            // metres the centre may wander before the map is redrawn (every caster is static)
    sunTurn: 0.25,         // degrees the sun may turn before it is redrawn
    streamMs: 2000,        // while tiles stream in, redrawn at most this often (a new mesh changes the list)
    distance: 600,         // metres from the centre back to the sun camera (and as far again past it)
    pcf: 1.6,              // Poisson kernel radius, in map texels: the soft edge
    biasBase: 0.04,        // metres
    biasSlope: 0.12,       // metres per unit of tan(angle to the sun): a grazed face needs more
    biasMax: 0.6,
    normalOffset: 0.12,    // metres the lookup moves off the surface first
    edgeFade: 0.18,        // share of the extent over which the shadow fades out at the map's edge
    maxZ: 220,             // metres from the camera: past this no shadow (fog has it)
    tint: [0.62, 0.70, 0.88] as [number, number, number], // shade is lit by the sky: cooler, not just darker
    // meshes that move (they would leave a ghost where they were when the map was drawn), besides the ones caught by
    // their skeleton, baked animation, dynamic thin-instance buffer or a world matrix that changed between refreshes
    movers: /^(rider|sky)|crowd|walker|traffic|vehicle|boat|ferry|ship|train|tram|bus\b|rotor|flag|cable/i,
  },
  bloom: {
    strength: 0.32,
    threshold: 0.72,       // luminance above which a pixel blooms (the picture is 0..1, every material writes LDR)
    knee: 0.18,            // soft start of the threshold
    ratio: 0.25,           // resolution of the blur
    kernel: 48,            // blur width in its own pixels
  },
}

// 16-tap Poisson disk, fixed (no per-pixel rotation: the kernel is tied to the map's texels, so it cannot crawl)
const POISSON = [[-0.94, -0.40], [0.95, -0.77], [-0.09, -0.93], [0.34, 0.29], [-0.92, 0.46], [-0.82, -0.88], [-0.38, 0.28],
  [0.97, 0.21], [0.44, -0.86], [0.54, -0.04], [-0.26, -0.43], [-0.53, 0.77], [0.79, 0.63], [0.19, 0.95], [-0.17, 0.67], [0.06, -0.2]]

const SHADOW_FRAGMENT = `
precision highp float;
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D depthSampler;   // the private geometry buffer's view-space depth
uniform sampler2D sunDepth;       // the sun camera's own camera-space z (metres along the sun), 0 where nothing was drawn
uniform mat4 camToSun;            // game camera view space -> sun camera view space, as of the map's last refresh
uniform vec3 sunView;             // towards the sun, game camera view space
uniform vec2 tanHalf;             // tan of half the fov, x and y
uniform vec2 texel;
uniform float strength;
uniform float extent, mapTexel, pcf, biasBase, biasSlope, biasMax, normalOffset, edgeFade, maxZ;
uniform vec3 tint;
uniform float debug;   // ?fxdebug=1 shadow mask, 2 depth, 3 normals, 4 facing, 5 map coverage, 6 sun depth, 7 compare

vec3 viewAt(vec2 uv, float z) { return vec3((uv * 2.0 - 1.0) * tanHalf * z, z); }

void main(void) {
  vec4 col = texture2D(textureSampler, vUV);
  float z = texture2D(depthSampler, vUV).r;
  if (debug == 2.0) { gl_FragColor = vec4(vec3(fract(z / 20.0)), 1.0); return; }
  if (debug == 1.0) col = vec4(1.0);
  if ((strength <= 0.0 && debug == 0.0) || z <= 0.0 || z > maxZ) { gl_FragColor = debug == 4.0 ? vec4(1.0, 0.0, 1.0, 1.0) : col; return; }
  // the normal from the depth itself (the city's meshes carry no normal attribute, so the buffer's own are zero):
  // of the two neighbours each way, the nearer in depth, so an edge does not bend the face it bounds
  vec3 pc = viewAt(vUV, z);
  vec2 dx = vec2(texel.x, 0.0), dy = vec2(0.0, texel.y);
  float zr = texture2D(depthSampler, vUV + dx).r, zl = texture2D(depthSampler, vUV - dx).r;
  float zu = texture2D(depthSampler, vUV + dy).r, zd = texture2D(depthSampler, vUV - dy).r;
  vec3 ddx = abs(zr - z) < abs(zl - z) ? viewAt(vUV + dx, zr) - pc : pc - viewAt(vUV - dx, zl);
  vec3 ddy = abs(zu - z) < abs(zd - z) ? viewAt(vUV + dy, zu) - pc : pc - viewAt(vUV - dy, zd);
  vec3 n = normalize(cross(ddy, ddx));
  if (dot(n, pc) > 0.0) n = -n;   // towards the camera
  float facing = dot(n, sunView);
  // a face turned away from the sun is already shaded by its own material's lighting
  if (debug == 4.0) { gl_FragColor = vec4(max(facing, 0.0), strength, max(-facing, 0.0), 1.0); return; }
  if (facing <= 0.02 && debug != 3.0 && debug < 5.0) { gl_FragColor = col; return; }
  if (debug == 3.0) { gl_FragColor = vec4(n * 0.5 + 0.5, 1.0); return; }
  // normal offset (grows a little with distance, where one screen pixel covers several map texels), then into the sun's view
  vec3 p = pc + n * (normalOffset + z * 0.0015);
  vec3 lp = (camToSun * vec4(p, 1.0)).xyz;
  vec2 uv = lp.xy / (2.0 * extent) + 0.5;
  float edge = max(abs(lp.x), abs(lp.y)) / extent;
  float cover = 1.0 - smoothstep(1.0 - edgeFade, 1.0, edge);
  if (debug == 5.0) { gl_FragColor = vec4(1.0 - cover, cover, 0.0, 1.0); return; }
  float d0 = texture2D(sunDepth, uv).r;
  if (debug == 6.0) { gl_FragColor = vec4(vec3(fract(d0 / 20.0)), 1.0); return; }
  // slope-scaled: a face grazed by the sun needs more, or it shadows itself in stripes
  float f = max(facing, 0.05);
  float bias = min(biasBase + biasSlope * sqrt(1.0 - f * f) / f, biasMax);
  if (debug == 7.0) {
    float e = lp.z - d0;
    gl_FragColor = vec4(d0 <= 0.0 ? vec3(0.3) : e < -bias ? vec3(1.0, 0.0, 0.0) : e <= bias ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0), 1.0);
    return;
  }
  float occ = 0.0;
  if (cover > 0.0) {
    float r = pcf * mapTexel / (2.0 * extent);
    float lz = lp.z - bias, d;
${POISSON.map(([x, y]) => `    d = texture2D(sunDepth, uv + vec2(${x}, ${y}) * r).r; occ += (d > 0.0 && lz > d) ? 1.0 : 0.0;`).join('\n')}
    occ /= ${POISSON.length}.0;
  }
  occ *= cover * smoothstep(0.02, 0.18, facing) * (1.0 - smoothstep(maxZ * 0.8, maxZ, z));
  vec3 shade = col.rgb * mix(vec3(1.0), tint, strength);
  if (debug == 1.0) { gl_FragColor = vec4(vec3(1.0 - occ), 1.0); return; }
  gl_FragColor = vec4(mix(col.rgb, shade, occ), col.a);
}
`

const BRIGHT_FRAGMENT = `
precision highp float;
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform float threshold, knee;
void main(void) {
  vec3 c = texture2D(textureSampler, vUV).rgb;
  float l = max(c.r, max(c.g, c.b));
  float w = smoothstep(threshold - knee, threshold + knee, l);
  gl_FragColor = vec4(c * w, 1.0);
}
`

const MERGE_FRAGMENT = `
precision highp float;
varying vec2 vUV;
uniform sampler2D textureSampler;   // the blurred bright parts
uniform sampler2D sceneSampler;
uniform float strength;
void main(void) {
  vec3 s = texture2D(sceneSampler, vUV).rgb;
  vec3 b = texture2D(textureSampler, vUV).rgb;
  // screen, not add: a bright pixel next to the sky cannot clip past white
  gl_FragColor = vec4(1.0 - (1.0 - s) * (1.0 - b * strength), 1.0);
}
`

/** Current strengths, changeable at run time (dev A/B). */
const live = { shadows: FX.shadow.strength, bloom: FX.bloom.strength }

export function postStack(scene: Scene, camera: Camera, choice: FxChoice, grade: Grade): void {
  const engine = scene.getEngine()
  const wantDepth = choice.shadows || (choice.ao && choice.aoGeometry)
  /*
   * A private GeometryBufferRenderer, not the scene's (`scene.enableGeometryBufferRenderer`): the rider's skin is a
   * subsurface PBR material, which turns on the pre-pass renderer, and the pre-pass disables the scene's geometry
   * buffer — or links it to the pre-pass, whose depth misses every ShaderMaterial. This one is rendered as a custom
   * render target each frame and nothing else knows about it.
   */
  let gbuf: GeometryBufferRenderer | null = null
  if (wantDepth) {
    const g = new GeometryBufferRenderer(scene, 1)
    if (g.isSupported) {
      // (position and velocity are off by default: their setters would dispose and remake the render targets)
      // The CAMERA's custom targets, not the scene's: the scene's are drawn before the frame's active meshes are
      // chosen, so a target with no render list of its own draws whatever list was left over — often empty, and then
      // the depth is blank for that frame and every shadow and contact on it blinks off
      camera.customRenderTargets.push(g.getGBuffer())
      decalsOutOfDepth(g)
      if (new URLSearchParams(location.search).has('dev')) (window as unknown as { __gbuf?: unknown }).__gbuf = g.getGBuffer()
      gbuf = g
    } else g.dispose()
  }
  if (choice.ao) ambientOcclusion(scene, camera, choice.aoGeometry ? gbuf : null)

  if (choice.shadows && gbuf) sunShadows(scene, camera, gbuf)

  if (choice.bloom) {
    Effect.ShadersStore['streetBrightFragmentShader'] = BRIGHT_FRAGMENT
    Effect.ShadersStore['streetBloomMergeFragmentShader'] = MERGE_FRAGMENT
    const b = FX.bloom
    const copy = new PassPostProcess('bloomCopy', 1, camera, undefined, engine)
    const bright = new PostProcess('bloomBright', 'streetBright', ['threshold', 'knee'], null, b.ratio, camera, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, engine)
    bright.onApply = (e) => { e.setFloat('threshold', b.threshold); e.setFloat('knee', b.knee) }
    new BlurPostProcess('bloomH', new Vector2(1, 0), b.kernel, b.ratio, camera, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, engine)
    new BlurPostProcess('bloomV', new Vector2(0, 1), b.kernel, b.ratio, camera, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, engine)
    const merge = new PostProcess('bloomMerge', 'streetBloomMerge', ['strength'], ['sceneSampler'], 1, camera, undefined, engine)
    merge.onApply = (e) => { e.setTextureFromPostProcess('sceneSampler', copy); e.setFloat('strength', live.bloom) }
  }

  if (choice.grade) colourGrade(scene, camera, grade, { film: choice.film, vignette: choice.vignette, grain: choice.grain })

  if (new URLSearchParams(location.search).has('dev')) {
    ;(window as unknown as { __fx?: unknown }).__fx = {
      set(name: string, v: number) {
        if (name === 'shadows' || name === 'bloom') live[name] = v
        else (window as unknown as { __gradeFx?: Record<string, number> }).__gradeFx![name] = v
      },
    }
  }
}

/*
 * THE SUN'S SHADOW MAP. An orthographic camera looks down the sun's direction at a square round the rider and a
 * DepthRenderer writes what it sees as camera-space z: metres along the sun, linear, so the post-process compares it
 * with the pixel's own distance along the sun directly, whatever the engine's NDC depth range. It is drawn only when
 * the centre has wandered a few metres (or the sun turned, or new tiles streamed in); in between, the map, the
 * matrix it was drawn with and so every shadow edge stay exactly where they were. The centre is snapped to whole map
 * texels in the sun's view, so a redraw moves the map by whole texels and an edge comes back where it was.
 *
 * The render list is explicit: a render target with none draws the main camera's active meshes, which are only what
 * is on screen — the very thing the shadow map is for getting past.
 */
/**
 * Shadow decals are paint on the ground, not geometry, so they stay out of the depth the post passes read.
 *
 * Babylon's G-buffer draws transparent meshes too (renderTransparentMeshes defaults to true), and a person's or car's
 * shadow blob is a quad lifted 0.185 m above the road. In the depth it was a raised plate: ambient occlusion
 * darkened a ring round its edge and the sun-shadow pass tested the plate instead of the road, so every walker
 * stood on a dark rectangle with a light middle (owner, 2026-11-20). Only these materials are dropped; glass and
 * water keep their depth.
 */
const DEPTHLESS_MATERIALS = new Set(['shadow', 'shadowBlob'])
function decalsOutOfDepth(g: GeometryBufferRenderer): void {
  const rt = g.getGBuffer()
  const draw = rt.customRenderFunction
  if (!draw) return
  rt.customRenderFunction = (opaque, alphaTest, transparent, depthOnly) => {
    let k = 0
    for (let i = 0; i < transparent.length; i++) {
      const sm = transparent.data[i]
      if (!DEPTHLESS_MATERIALS.has(sm.getMaterial()?.name ?? '')) transparent.data[k++] = sm
    }
    transparent.length = k
    draw(opaque, alphaTest, transparent, depthOnly)
  }
}

function sunShadows(scene: Scene, camera: Camera, gbuf: GeometryBufferRenderer): void {
  const engine = scene.getEngine()
  const s = FX.shadow
  const dev = new URLSearchParams(location.search).has('dev')
  const sunCam = new TargetCamera('sunShadowCam', new Vector3(0, s.distance, 0), scene, false)
  sunCam.mode = Camera.ORTHOGRAPHIC_CAMERA
  sunCam.orthoLeft = -s.extent; sunCam.orthoRight = s.extent; sunCam.orthoBottom = -s.extent; sunCam.orthoTop = s.extent
  sunCam.minZ = 1; sunCam.maxZ = s.distance * 2
  const depth = new DepthRenderer(scene, Constants.TEXTURETYPE_FLOAT, sunCam, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE, true, 'sunShadowMap')
  const map = depth.getDepthMap()
  map.resize({ width: s.size, height: s.size })
  map.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE
  map.renderList = []
  scene.customRenderTargets.push(map)   // its own explicit list and camera, so the scene's (early) turn is right

  // the sun's orientation alone (eye at the origin): the frame the centre is snapped in
  const toSun = new Vector3(), sunDir = new Vector3(), lastSun = new Vector3(0, 0, 0)
  const orient = new Matrix(), orientInv = new Matrix(), centre = new Vector3(), want = new Vector3(), tmp = new Vector3()
  const upOf = (d: Vector3): Vector3 => (Math.abs(d.y) > 0.99 ? Vector3.Forward() : Vector3.Up())
  let built = false, meshCount = -1, lastCountCheck = 0
  const moved = new WeakSet<AbstractMesh>(), lastWorld = new WeakMap<AbstractMesh, Float32Array>()
  const stats = { refreshes: 0, casters: 0, lastRefreshMs: 0 }

  const isMover = (m: AbstractMesh): boolean => {
    if (moved.has(m)) return true
    if (m.infiniteDistance || m.skeleton || (m as Mesh).bakedVertexAnimationManager || s.movers.test(m.name)) return true
    const ti = (m as Mesh)._thinInstanceDataStorage
    if (ti?.matrixBuffer?.isUpdatable()) return true
    let p = m.parent
    while (p) { if (s.movers.test(p.name)) return true; p = p.parent }
    return false
  }
  const view = new Matrix()
  const refresh = (): void => {
    const t0 = performance.now()
    sunDir.copyFrom(DAYLIGHT.sun).normalize()
    lastSun.copyFrom(sunDir)
    // the frame the centre is snapped in is the sun camera's OWN rotation (setTarget derives it through Euler angles,
    // which need not match a LookAt to the last bit): aim it first, then take its view matrix without the translation
    sunCam.upVector.copyFrom(upOf(sunDir))
    want.subtractToRef(sunDir.scale(s.distance), sunCam.position)
    sunCam.setTarget(want)
    orient.copyFrom(sunCam.getViewMatrix(true)).setTranslationFromFloats(0, 0, 0)
    orient.invertToRef(orientInv)
    // snap the wanted centre to whole texels in the sun's view (x, y); its depth along the sun does not matter
    Vector3.TransformCoordinatesToRef(want, orient, tmp)
    const tx = (2 * s.extent) / s.size
    tmp.x = Math.round(tmp.x / tx) * tx; tmp.y = Math.round(tmp.y / tx) * tx
    Vector3.TransformCoordinatesToRef(tmp, orientInv, centre)
    centre.subtractToRef(sunDir.scale(s.distance), sunCam.position)
    sunCam.setTarget(centre)
    view.copyFrom(sunCam.getViewMatrix(true))
    // casters: static, and inside the map's square as the sun sees it
    const list: AbstractMesh[] = []
    const r = s.extent * 1.02
    for (const m of scene.meshes) {
      if (!m.isEnabled() || !m.isVisible || !m.subMeshes?.length) continue
      const w = m.computeWorldMatrix().asArray()
      const prev = lastWorld.get(m)
      if (prev) { for (let i = 0; i < 16; i++) if (Math.abs(prev[i] - w[i]) > 1e-4) { moved.add(m); break } } else lastWorld.set(m, new Float32Array(w))
      if (isMover(m)) continue
      // thin instances: the mesh's own bounds may be only the first copy's, so it goes in whole
      if ((m as Mesh).hasThinInstances) { list.push(m); continue }
      const bs = m.getBoundingInfo().boundingSphere
      Vector3.TransformCoordinatesToRef(bs.centerWorld, view, tmp)
      const rad = bs.radiusWorld
      if (Math.abs(tmp.x) > r + rad || Math.abs(tmp.y) > r + rad || tmp.z + rad < 0 || tmp.z - rad > s.distance * 2) continue
      list.push(m)
    }
    map.renderList = list
    map.resetRefreshCounter()
    built = true
    meshCount = scene.meshes.length
    stats.refreshes++; stats.casters = list.length; stats.lastRefreshMs = performance.now() - t0
  }
  // the matrix the map was drawn with, taken when it was drawn, so a redraw never lands between map and lookup
  const drawnView = new Matrix()
  let haveMap = false
  map.onAfterRenderObservable.add(() => { drawnView.copyFrom(sunCam.getViewMatrix()); haveMap = true })

  const fwd = new Vector3(), nudge = new Vector3()   // nudge: dev only, moves the map's centre as a ride would
  scene.onBeforeRenderObservable.add(() => {
    camera.getDirectionToRef(Vector3.Forward(), fwd)
    fwd.y = 0
    if (fwd.lengthSquared() > 1e-6) fwd.normalize()
    camera.globalPosition.addToRef(fwd.scale(s.ahead), want).addInPlace(nudge)
    const now = performance.now()
    const countChanged = now - lastCountCheck > s.streamMs && scene.meshes.length !== meshCount
    if (countChanged) lastCountCheck = now
    toSun.copyFrom(DAYLIGHT.sun).normalize()
    const sunTurned = Vector3.Dot(toSun, lastSun) < Math.cos(s.sunTurn * Math.PI / 180)
    if (!built || sunTurned || countChanged || Vector3.DistanceSquared(want, centre) > s.refresh * s.refresh) refresh()
  })

  Effect.ShadersStore['streetShadowFragmentShader'] = SHADOW_FRAGMENT
  const pp = new PostProcess('sunShadow', 'streetShadow',
    ['sunView', 'tanHalf', 'texel', 'debug', 'strength', 'camToSun', 'extent', 'mapTexel', 'pcf', 'biasBase', 'biasSlope',
      'biasMax', 'normalOffset', 'edgeFade', 'maxZ', 'tint'],
    ['depthSampler', 'sunDepth'], 1, camera, undefined, engine)
  let debug = Number(new URLSearchParams(location.search).get('fxdebug') ?? 0)
  const invView = new Matrix(), camToSun = new Matrix(), sunV = new Vector3()
  pp.onApply = (e) => {
    e.setFloat('debug', debug)
    const g = gbuf.getGBuffer().textures
    e.setTexture('depthSampler', g[gbuf.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE)])
    e.setTexture('sunDepth', map)
    camera.getViewMatrix().invertToRef(invView)
    invView.multiplyToRef(drawnView, camToSun)
    e.setMatrix('camToSun', camToSun)
    DAYLIGHT.sun.scaleToRef(-1, sunV)
    e.setVector3('sunView', Vector3.TransformNormal(sunV, camera.getViewMatrix()).normalize())
    const ty = Math.tan(camera.fov / 2)
    e.setVector2('tanHalf', new Vector2(ty * engine.getAspectRatio(camera), ty))
    e.setVector2('texel', new Vector2(1 / pp.width, 1 / pp.height))
    // no sun, no shadow: night, dusk past the horizon, and the dimmed sun of overcast and rain (render/facade-material.ts)
    const sc = DAYLIGHT.sunColour
    const sunLum = 0.2126 * sc.r + 0.7152 * sc.g + 0.0722 * sc.b
    const lit = Math.min(1, Math.max(0, (sunLum - 0.3) / 0.6)) * Math.min(1, Math.max(0, -DAYLIGHT.sun.y * 4))
    e.setFloat('strength', haveMap ? live.shadows * lit : 0)
    e.setFloat('extent', s.extent); e.setFloat('mapTexel', (2 * s.extent) / s.size); e.setFloat('pcf', s.pcf)
    e.setFloat('biasBase', s.biasBase); e.setFloat('biasSlope', s.biasSlope); e.setFloat('biasMax', s.biasMax)
    e.setFloat('normalOffset', s.normalOffset); e.setFloat('edgeFade', s.edgeFade); e.setFloat('maxZ', s.maxZ)
    e.setFloat3('tint', s.tint[0], s.tint[1], s.tint[2])
  }
  if (dev) (window as unknown as { __sunShadow?: unknown }).__sunShadow = {
    stats, map, nudge, isMover, refresh: () => { built = false }, debug: (n: number) => { debug = n },
  }
}
