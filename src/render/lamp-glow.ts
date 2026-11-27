/**
 * THE STREET LAMPS' LIGHT after dark (owner, 2026-11-26: street lamps are "a major, distinctive, repeating visual
 * element … make them look amazing and realistic while still being very fast"). The lamp heads already glow (EMIT in
 * render/models.ts); what a night street is really made of is the light they throw — a warm pool on the pavement under
 * each lamp, receding down the road in a row — and the soft halo round each lantern.
 *
 * Built ONCE per tile, beside the tile's street furniture (render/city.ts), from the light centres the lamp models register
 * in LAMP_LIGHTS: one mesh, one additive draw, no per-frame work at all. By day (NIGHT = 0, fixed before the city is built)
 * nothing is built.
 *
 *   pool  a fan of two rings draped on the terrain, bright at the centre and nothing at the rim
 *   halo  a camera-facing quad round the lamp head (the corner in `uv`, turned to the camera in the vertex shader)
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Effect } from '@babylonjs/core/Materials/effect'
import { Constants } from '@babylonjs/core/Engines/constants'
import type { Scene } from '@babylonjs/core/scene'
import { DAYLIGHT, NIGHT } from './facade-material.ts'

/** a light in the world: its head (x, z and height above the ground under it), the pool's radius, how warm (0 white … 1 sodium) */
export interface LampLight { x: number; z: number; h: number; r?: number; warm?: number }

// tunables
const POOL_PER_HEIGHT = 0.72   // the pool's radius as a share of the head's height
const POOL_MIN = 2.6, POOL_MAX = 7.5
const POOL_LIFT = 0.2          // above the terrain (the furniture's foot is at +0.15; roads and pavements sit on it)
const POOL_SIDES = 14
const POOL_CENTRE = 0.5       // additive brightness at the pool's centre at full night
const POOL_MID = 0.26          // … at half the radius
const HALO_R = 0.85            // the halo quad's half-size, metres
const HALO_GAIN = 0.55
const WARM_WHITE: [number, number, number] = [1.0, 0.84, 0.62]   // ~3000 K LED
const SODIUM: [number, number, number] = [1.0, 0.62, 0.28]

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec4 color;
attribute vec2 uv;
uniform mat4 world;
uniform mat4 view;
uniform mat4 viewProjection;
varying vec4 vColour;
varying vec2 vUV;
varying float vDepth;
void main(void) {
  vec4 wp = world * vec4(position, 1.0);
  // a halo vertex (colour alpha > 0) is the lamp's centre: push it out along the camera's own right and up
  if (color.a > 0.0) {
    vec3 right = vec3(view[0][0], view[1][0], view[2][0]);
    vec3 up = vec3(view[0][1], view[1][1], view[2][1]);
    wp.xyz += (right * uv.x + up * uv.y) * color.a;
  }
  gl_Position = viewProjection * wp;
  vColour = color;
  vUV = color.a > 0.0 ? uv : vec2(0.0);
  vDepth = gl_Position.w;
}
`
const FRAGMENT = `
precision highp float;
varying vec4 vColour;
varying vec2 vUV;
varying float vDepth;
uniform float night;
uniform float fogDensity;
void main(void) {
  float k = 1.0;
  if (vColour.a > 0.0) { float d = length(vUV); k = pow(max(0.0, 1.0 - d), 2.2); }
  float fog = exp(-vDepth * fogDensity);
  gl_FragColor = vec4(vColour.rgb * k * night * fog, 1.0);
}
`

let registered = false
function material(scene: Scene): ShaderMaterial {
  const have = scene.getMaterialByName('lampGlow') as ShaderMaterial | null
  if (have) return have
  if (!registered) {
    Effect.ShadersStore['lampGlowVertexShader'] = VERTEX
    Effect.ShadersStore['lampGlowFragmentShader'] = FRAGMENT
    registered = true
  }
  const m = new ShaderMaterial('lampGlow', scene, { vertex: 'lampGlow', fragment: 'lampGlow' }, {
    attributes: ['position', 'color', 'uv'],
    uniforms: ['world', 'view', 'viewProjection', 'night', 'fogDensity'],
    needAlphaBlending: true,
  })
  m.alphaMode = Constants.ALPHA_ONEONE
  m.disableDepthWrite = true
  m.backFaceCulling = false
  m.depthFunction = Constants.LEQUAL
  m.setFloat('night', NIGHT)
  m.setFloat('fogDensity', DAYLIGHT.fogDensity)
  return m
}

/** whether lights are worth collecting at all: only after dark */
export const glowWanted = (): boolean => NIGHT > 0

/**
 * The tile's glow mesh, or null (by day, or with no lamps). `heightAt` is the terrain the furniture stands on.
 */
export function lampGlowMesh(name: string, scene: Scene, lights: LampLight[], heightAt: (x: number, z: number) => number,
                             renderingGroupId: number): Mesh | null {
  if (!glowWanted() || lights.length === 0) return null
  const pos: number[] = [], col: number[] = [], uv: number[] = [], idx: number[] = []
  const v = (x: number, y: number, z: number, c: [number, number, number], a: number, u = 0, w = 0): number => {
    pos.push(x, y, z); col.push(c[0], c[1], c[2], a); uv.push(u, w)
    return pos.length / 3 - 1
  }
  for (const L of lights) {
    const warm = L.warm ?? 0
    const tint: [number, number, number] = [0, 1, 2].map((i) => WARM_WHITE[i] + (SODIUM[i] - WARM_WHITE[i]) * warm) as [number, number, number]
    const scale = (s: number): [number, number, number] => [tint[0] * s, tint[1] * s, tint[2] * s]
    const g0 = heightAt(L.x, L.z)
    // the pool: centre, a mid ring, the rim — draped vertex by vertex
    const R = L.r ?? Math.min(POOL_MAX, Math.max(POOL_MIN, L.h * POOL_PER_HEIGHT))
    const c = v(L.x, g0 + POOL_LIFT, L.z, scale(POOL_CENTRE), 0)
    const mid: number[] = [], rim: number[] = []
    for (let j = 0; j < POOL_SIDES; j++) {
      const a = (j / POOL_SIDES) * Math.PI * 2
      const s = Math.sin(a), co = Math.cos(a)
      const mx = L.x + s * R * 0.5, mz = L.z + co * R * 0.5
      const rx = L.x + s * R, rz = L.z + co * R
      mid.push(v(mx, heightAt(mx, mz) + POOL_LIFT, mz, scale(POOL_MID), 0))
      rim.push(v(rx, heightAt(rx, rz) + POOL_LIFT, rz, [0, 0, 0], 0))
    }
    for (let j = 0; j < POOL_SIDES; j++) {
      const j1 = (j + 1) % POOL_SIDES
      idx.push(c, mid[j], mid[j1], mid[j], rim[j], rim[j1], mid[j], rim[j1], mid[j1])
    }
    // the halo: four vertices all at the head, spread by the shader
    const hy = g0 + L.h
    const hc = scale(HALO_GAIN)
    const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, w]) => v(L.x, hy, L.z, hc, HALO_R, u, w))
    idx.push(q[0], q[1], q[2], q[0], q[2], q[3])
  }
  const vd = new VertexData()
  vd.positions = new Float32Array(pos)
  vd.colors = new Float32Array(col)
  vd.uvs = new Float32Array(uv)
  vd.indices = pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx)
  const m = new Mesh(name, scene)
  vd.applyToMesh(m)
  m.material = material(scene)
  m.renderingGroupId = renderingGroupId
  m.isPickable = false
  return m
}
