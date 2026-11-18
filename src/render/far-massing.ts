/**
 * FAR MASSING: the whole city as a coarse height grid (tools/far-massing.ts), drawn only when the eye is high enough
 * to see past the streamed tiles — the top of the Grande Arche, the Ballon Generali, Sutro Tower.
 *
 * - It is drawn in group 0 with the distant ground, at its TRUE position. Babylon clears depth before the later groups,
 *   so the streamed city always draws over it; the shader discards it inside the square of tiles the city has loaded
 *   (`MID` around the rider's tile), so it never pokes above the real roofs there.
 * - While it shows, the far plane goes out to FAR_Z. That costs the near ground nothing: perspective depth resolution
 *   is set by minZ (Δz ≈ z²/(minZ·2²⁴)), not by maxZ once maxZ ≫ minZ. Out here it is ~3 m at 7 km, which plain
 *   blocks with no stacked façade layers do not mind.
 * - It hazes by its own, thinner density (FAR_FOG): the street's fog would have it gone by 2 km, and from 100 m up a
 *   clear day shows the far side of the city.
 *
 * Binary format (little-endian): 'FMS2', u32 chunks; per chunk i32 ci, i32 cj, f32 yMin, u32 quads, u32 level (0 near, 1 far); per quad u8 kind
 * (0 top, 1 +x wall, 2 −x, 3 +z, 4 −z), u8 r g b, i16 x0 z0 x1 z1 (Q_XZ from the chunk's corner), u16 y0 y1 (Q_Y above yMin).
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Effect } from '@babylonjs/core/Materials/effect'
import { Constants } from '@babylonjs/core/Engines/constants'
import type { Scene } from '@babylonjs/core/scene'
import type { Camera } from '@babylonjs/core/Cameras/camera'
import { DAYLIGHT } from './facade-material.ts'
import { GROUND_STENCIL } from './city.ts'
import { fogIsOff } from './photo.ts'

import { CHUNK, Q_XZ, Q_Y } from '../city/farmass-format.ts'

/** the eye must stand this far above the coarse ground for the layer to show, metres */
export const SHOW_AGL = 30
/** the far plane while it shows, metres */
export const FAR_Z = 16000
/** its haze: 1 − exp(−d·FAR_FOG), never past FAR_HAZE_MAX */
export const FAR_FOG = 0.00022
export const FAR_HAZE_MAX = 0.85
/** chunks whose centre is nearer the eye than this draw the near (fine) grid, the rest the coarse one, metres */
export const LOD_M = 3500
/** ground occluder chunks are kept this many tiles past the loaded square while the layer shows (`trimOccluders`) */
export const OCCLUDER_KEEP = 2
/** how far past the loaded square (in tiles) the discard reaches; 0 = exactly the mid ring */
export const RING_SLACK = 0
/** how much of the sun a far wall takes; the rest is sky light. Kept low: the city's own walls are flattish at range */
const SUN = 0.55, SKY = 0.75

const VERTEX = `precision highp float;
attribute vec3 position; attribute vec3 normal; attribute vec4 color;
uniform mat4 viewProjection; uniform vec3 eye;
varying vec3 vW; varying vec3 vN; varying vec3 vC;
void main() { vW = position; vN = normal; vC = color.rgb; gl_Position = viewProjection * vec4(position, 1.0); }`

const FRAGMENT = `precision highp float;
varying vec3 vW; varying vec3 vN; varying vec3 vC;
uniform vec3 eye; uniform vec3 sunDir; uniform vec3 sunColour; uniform vec3 skyColour; uniform vec3 fogColour;
uniform float fogDensity; uniform float hazeMax; uniform float debug; uniform vec2 ringCentre; uniform float ringHalf; uniform float tile;
void main() {
  vec2 t = floor(vW.xz / tile) - ringCentre;
  if (max(abs(t.x), abs(t.y)) <= ringHalf) discard;
  vec3 n = normalize(vN);
  float sun = max(0.0, dot(n, -sunDir));
  float up = 0.5 + 0.5 * n.y;
  vec3 c = vC * (sunColour * sun * ${SUN.toFixed(2)} + skyColour * (${SKY.toFixed(2)} + 0.35 * up));
  float d = distance(vW, eye);
  float f = min(hazeMax, 1.0 - exp(-d * fogDensity));
  gl_FragColor = debug > 0.5 ? vec4(1.0, 0.1 + 0.5 * f, 0.1, 1.0) : vec4(mix(c, fogColour, f), 1.0);
}`

/** ?farmass=red paints the layer red (haze as a lighter red), to see exactly what it adds */
const DEBUG_RED = typeof location !== 'undefined' && new URLSearchParams(location.search).get('farmass') === 'red'

interface FarChunk { level: number; x: number; z: number; mesh: Mesh; on: boolean }

export function readFarMassing(buf: ArrayBuffer): { ci: number; cj: number; level: number; pos: Float32Array; nrm: Float32Array; col: Float32Array; idx: Uint32Array }[] {
  const v = new DataView(buf)
  if (String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3)) !== 'FMS2') throw new Error('farmass.bin: not format FMS2 (re-run tools/far-massing.ts)')
  const n = v.getUint32(4, true)
  let o = 8
  const out = []
  // a wall's outward normal by kind; tops face up
  const NRM = [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]
  for (let c = 0; c < n; c++) {
    const ci = v.getInt32(o, true), cj = v.getInt32(o + 4, true), yMin = v.getFloat32(o + 8, true), q = v.getUint32(o + 12, true)
    const level = v.getUint32(o + 16, true)
    o += 20
    const ox = ci * CHUNK, oz = cj * CHUNK
    const pos = new Float32Array(q * 12), nrm = new Float32Array(q * 12), col = new Float32Array(q * 16), idx = new Uint32Array(q * 6)
    for (let k = 0; k < q; k++, o += 16) {
      const kind = v.getUint8(o)
      const r = v.getUint8(o + 1) / 255, g = v.getUint8(o + 2) / 255, b = v.getUint8(o + 3) / 255
      const x0 = ox + v.getInt16(o + 4, true) * Q_XZ, z0 = oz + v.getInt16(o + 6, true) * Q_XZ
      const x1 = ox + v.getInt16(o + 8, true) * Q_XZ, z1 = oz + v.getInt16(o + 10, true) * Q_XZ
      const y0 = yMin + v.getUint16(o + 12, true) * Q_Y, y1 = yMin + v.getUint16(o + 14, true) * Q_Y
      // corners anticlockwise seen from the side the normal points to (Babylon: left-handed, front = clockwise in
      // view, so the index order below is chosen per kind; culling is off anyway, see the material)
      const p = kind === 0
        ? [x0, y1, z0, x0, y1, z1, x1, y1, z1, x1, y1, z0]
        : [x0, y0, z0, x1, y0, z1, x1, y1, z1, x0, y1, z0]
      pos.set(p, k * 12)
      const nn = NRM[kind]
      for (let s = 0; s < 4; s++) { nrm.set(nn, k * 12 + s * 3); col.set([r, g, b, 1], k * 16 + s * 4) }
      const b4 = k * 4
      idx.set([b4, b4 + 1, b4 + 2, b4, b4 + 2, b4 + 3], k * 6)
    }
    out.push({ ci, cj, level, pos, nrm, col, idx })
  }
  return out
}

export class FarMassing {
  private readonly chunks: FarChunk[] = []
  private readonly mat: ShaderMaterial
  private shown = false
  private baseFar = 0
  private ringCentre = { x: 0, z: 0 }

  private constructor(private readonly scene: Scene, private readonly tile: number, private readonly ringHalf: () => number,
                      private readonly groundAt: (x: number, z: number) => number) {
    Effect.ShadersStore['farMassingVertexShader'] = VERTEX
    Effect.ShadersStore['farMassingFragmentShader'] = FRAGMENT
    const mat = new ShaderMaterial('farMassing', scene, 'farMassing', {
      attributes: ['position', 'normal', 'color'],
      uniforms: ['viewProjection', 'eye', 'sunDir', 'sunColour', 'skyColour', 'fogColour', 'fogDensity', 'hazeMax', 'ringCentre', 'ringHalf', 'tile', 'debug'],
    })
    mat.backFaceCulling = false
    // the ground's stencil bit, so the skyline stand-ins (drawn over sky only) do not show through a far block
    const st = mat.stencil
    st.enabled = true
    st.func = Constants.ALWAYS
    st.funcRef = GROUND_STENCIL
    st.funcMask = 0xff
    st.mask = 0xff
    st.opStencilFail = Constants.KEEP
    st.opDepthFail = Constants.KEEP
    st.opStencilDepthPass = Constants.REPLACE
    mat.onBindObservable.add(() => {
      const cam = scene.activeCamera
      if (!cam) return
      const e = cam.globalPosition
      mat.setVector3('eye', e)
      mat.setVector3('sunDir', DAYLIGHT.sun)
      mat.setColor3('sunColour', DAYLIGHT.sunColour)
      mat.setColor3('skyColour', DAYLIGHT.skyColour)
      mat.setColor3('fogColour', DAYLIGHT.fogColour)
      mat.setFloat('fogDensity', fogIsOff() ? 0 : FAR_FOG)
      mat.setFloat('hazeMax', FAR_HAZE_MAX)
      mat.setVector2('ringCentre', { x: this.ringCentre.x, y: this.ringCentre.z } as never)
      mat.setFloat('ringHalf', this.ringHalf() + RING_SLACK)
      mat.setFloat('tile', this.tile)
      mat.setFloat('debug', DEBUG_RED ? 1 : 0)
    })
    this.mat = mat
  }

  /** Load `farmass.bin` from the city's v3 folder; null when the city has none (the layer is optional). */
  static async load(scene: Scene, url: string, tile: number, ringHalf: () => number,
                    groundAt: (x: number, z: number) => number): Promise<FarMassing | null> {
    const r = await fetch(url).catch(() => null)
    if (!r || !r.ok) return null
    const buf = await r.arrayBuffer()
    const fm = new FarMassing(scene, tile, ringHalf, groundAt)
    let quads = 0
    for (const c of readFarMassing(buf)) {
      const vd = new VertexData()
      vd.positions = c.pos
      vd.normals = c.nrm
      vd.colors = c.col
      vd.indices = c.idx
      const m = new Mesh(`farmass:${c.level}:${c.ci},${c.cj}`, scene)
      vd.applyToMesh(m)
      m.material = fm.mat
      m.renderingGroupId = 0
      m.isPickable = false
      m.doNotSyncBoundingInfo = true
      m.freezeWorldMatrix()
      m.setEnabled(false)
      fm.chunks.push({ level: c.level, x: (c.ci + 0.5) * CHUNK, z: (c.cj + 0.5) * CHUNK, mesh: m, on: false })
      quads += c.idx.length / 6
    }
    console.info(`far massing: ${fm.chunks.length} chunks, ${quads} quads`)
    return fm
  }

  /** called as the layer comes and goes, so the city's own fog can thin to FAR_FOG with it (game.ts) */
  onShow: ((on: boolean) => void) | null = null
  /** the graphics setting (Settings → Far city): off, the layer never shows */
  enabled = true

  /**
   * Every frame: shown when the eye is high (or `force`), with the far plane out; the rider's tile centres the hole.
   * Each chunk draws at one level: the near grid within LOD_M of the eye, the coarse one past it.
   */

  update(camera: Camera, riderX: number, riderZ: number, force = false): void {
    this.ringCentre = { x: Math.floor(riderX / this.tile), z: Math.floor(riderZ / this.tile) }
    const e = camera.globalPosition
    const show = this.enabled && (force || e.y - this.groundAt(e.x, e.z) > SHOW_AGL)
    for (const c of this.chunks) {
      const on = show && (c.level === 0) === (Math.hypot(c.x - e.x, c.z - e.z) < LOD_M)
      if (on !== c.on) { c.on = on; c.mesh.setEnabled(on) }
    }
    this.trimOccluders(show, e.x, e.z)
    if (show !== this.shown) {
      this.shown = show
      if (show) { this.baseFar = camera.maxZ; camera.maxZ = Math.max(camera.maxZ, FAR_Z) }
      else if (this.baseFar) camera.maxZ = this.baseFar
      this.onShow?.(show)
    }
  }

  /**
   * THE GROUND OCCLUDER PAST THE RINGS. The coarse ground goes again, depth only, first in each later group
   * (`ground:occluder:…`, render/city.ts and depth-copies.ts) so nothing in the streamed city shows through a hill. With the far
   * plane at 1400 m most of it was clipped; at FAR_Z every chunk of it draws three times — 7 M triangles over Paris from the
   * Grande Arche, against the layer's own 0.3 M. Past the loaded square nothing draws in those groups, so while the layer shows,
   * chunks further than OCCLUDER_KEEP tiles beyond it are hidden (and given back as it goes).
   */
  private readonly hidden = new Set<Mesh>()
  private occluders: Mesh[] | null = null
  private trimOccluders(show: boolean, ex: number, ez: number): void {
    if (!show) {
      for (const m of this.hidden) m.isVisible = true
      this.hidden.clear()
      this.occluders = null
      return
    }
    this.occluders ??= this.scene.meshes.filter((m): m is Mesh => m.name.startsWith('ground:occluder:') && m.renderingGroupId > 0 && m instanceof Mesh)
    const keep = (this.ringHalf() + OCCLUDER_KEEP) * this.tile * Math.SQRT2
    const still: Mesh[] = []
    for (const m of this.occluders) {
      if (m.isDisposed()) continue
      const c = m.getBoundingInfo().boundingSphere.centerWorld
      const far = Math.hypot(c.x - ex, c.z - ez) - m.getBoundingInfo().boundingSphere.radiusWorld > keep
      if (far && m.isVisible) { m.isVisible = false; this.hidden.add(m) }
      else if (!far && this.hidden.delete(m)) m.isVisible = true
      still.push(m)
    }
    this.occluders = still
  }

  get visible(): boolean { return this.shown }
}
