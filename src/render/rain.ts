/**
 * Rain.
 *
 * Built the same way as everything else that moves here: one mesh, one hand-written shader, no particle
 * engine. A particle system would want to update several thousand transforms on the CPU every frame and
 * sort them; rain does not need either, because every drop does exactly the same thing — it falls at the
 * same speed, forever. So the streaks are baked into a single mesh once and the shader slides each one down
 * its own column and wraps it back to the top, which costs one uniform per frame.
 *
 * The mesh is parked on the camera rather than on the world, so the rider always stands in the middle of a
 * box of rain. That is a lie that only shows up if you look for it: you cannot see far enough through rain
 * to notice that the far side of the storm is following you.
 *
 * Each streak is two quads crossed in an X. A single quad is invisible edge-on, and a streak that vanishes
 * when the rider turns is worse than no rain at all; billboarding each one properly would mean rebuilding
 * the vertex buffer every frame for a detail nobody will look at directly.
 */
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Constants } from '@babylonjs/core/Engines/constants'
import type { Scene } from '@babylonjs/core/scene'
import { DAYLIGHT, NIGHT } from './facade-material.ts'

const COUNT = 3600
const BOX = 38      // metres across
const HEIGHT = 26   // metres tall; a drop wraps back to the top after this far
const FALL = 17     // metres per second
const LENGTH = 0.42 // how long one streak is drawn
const WIDTH = 0.014

const VERTEX = `
precision highp float;
attribute vec3 position;   // xz = the column this streak falls down, y unused
attribute vec2 uv;         // x = where the streak starts in the column, y = offset along the streak
attribute vec4 color;      // rgb unused, a = per-streak alpha
uniform mat4 worldViewProjection;
uniform float time;
uniform float height;
uniform float fall;
attribute float taper;     // 0 at the head of the streak, 1 at the tail
varying float vAlpha;
varying float vEdge;
varying float vTaper;

void main(void) {
  // each streak slides down its own column and wraps, and the whole streak moves together because the wrap is
  // computed from the column's own origin, not from the vertex
  float y = mod(uv.x - time * fall, height);
  // wind: the further a drop still has to fall, the further it has been blown sideways
  /*
   * Offset so the box sits ABOVE the rider, not centred on them. Centred, half the streaks were below the
   * pavement — and because the rain shares a rendering group whose depth buffer is cleared before it, that
   * underground half drew straight over the road surface.
   */
  vec3 p = vec3(position.x + (height - y) * 0.055, y - 2.0 + uv.y, position.z);
  gl_Position = worldViewProjection * vec4(p, 1.0);
  vAlpha = color.a;
  vTaper = taper;
  /*
   * Two fades, both about the box being a box. Sideways, so its wall is never a visible edge, and close in,
   * because a streak a metre from the eye covers a quarter of the screen and reads as a scratch on the
   * lens rather than as rain. Real rain that close is out of focus and invisible.
   */
  float side = 1.0 - clamp(length(position.xz) / (BOX_HALF), 0.0, 1.0);
  vEdge = smoothstep(0.0, 0.45, side) * smoothstep(1.5, 5.0, length(p));
}
`.replace('BOX_HALF', (BOX / 2).toFixed(1))

const FRAGMENT = `
precision highp float;
uniform vec3 tint;
varying float vAlpha;
varying float vEdge;
varying float vTaper;

void main(void) {
  // soft at both ends: a streak with square ends is a white bar, which is what a scratch looks like
  float along = sin(vTaper * 3.14159);
  gl_FragColor = vec4(tint, vAlpha * vEdge * along);
}
`

let registered = false

export class Rain {
  private readonly mesh: Mesh
  private readonly mat: ShaderMaterial
  private t = 0

  constructor(scene: Scene) {
    if (!registered) {
      Effect.ShadersStore['rainVertexShader'] = VERTEX
      Effect.ShadersStore['rainFragmentShader'] = FRAGMENT
      registered = true
    }

    const positions: number[] = []
    const uvs: number[] = []
    const colors: number[] = []
    const tapers: number[] = []
    const indices: number[] = []
    let seed = 20260921
    const r = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }

    for (let i = 0; i < COUNT; i++) {
      const x = (r() - 0.5) * BOX
      const z = (r() - 0.5) * BOX
      const start = r() * HEIGHT
      const len = LENGTH * (0.7 + r() * 0.7)
      const a = 0.10 + r() * 0.17
      // two quads, crossed, so the streak reads from any direction
      for (const [dx, dz] of [[WIDTH, 0], [0, WIDTH]] as const) {
        const base = positions.length / 3
        positions.push(x - dx, 0, z - dz, x + dx, 0, z + dz, x + dx, 0, z + dz, x - dx, 0, z - dz)
        uvs.push(start, 0, start, 0, start, -len, start, -len)
        tapers.push(0, 0, 1, 1)
        for (let k = 0; k < 4; k++) colors.push(1, 1, 1, a)
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
      }
    }

    const data = new VertexData()
    data.positions = positions
    data.uvs = uvs
    data.colors = colors
    data.indices = indices

    this.mesh = new Mesh('rain', scene)
    data.applyToMesh(this.mesh)
    this.mesh.setVerticesData('taper', tapers, false, 1)
    this.mesh.isPickable = false
    // it is always around the camera, so frustum culling it by its own box is both wrong and pointless
    this.mesh.alwaysSelectAsActiveMesh = true
    // over the city, under nothing: the buildings are in group 3 too, so rain in front of a wall draws and
    // rain behind it does not
    this.mesh.renderingGroupId = 3

    this.mat = new ShaderMaterial('rain', scene, 'rain', {
      attributes: ['position', 'uv', 'color', 'taper'],
      uniforms: ['worldViewProjection', 'time', 'height', 'fall', 'tint'],
      needAlphaBlending: true,
    })
    this.mat.setFloat('height', HEIGHT)
    this.mat.setFloat('fall', FALL)
    /*
     * Rain is not white. It has no colour of its own at all — a streak is a lens, and what it shows is
     * whatever is lighting the sky. Taking the tint from the horizon keeps it grey by day and keeps it from
     * glowing at night, which a white streak in a black city very much does.
     */
    const sky = DAYLIGHT.horizon
    this.mat.setColor3('tint', Color3.Lerp(sky, new Color3(1, 1, 1), 0.35).scale(NIGHT > 0.5 ? 0.55 : 1))
    this.mat.backFaceCulling = false
    // depth-tested against the city, but never written: a thousand overlapping streaks must not occlude
    // each other, and there is nothing behind them that needs their depth
    this.mat.disableDepthWrite = true
    this.mat.depthFunction = Constants.LESS
    this.mat.alphaMode = Constants.ALPHA_COMBINE
    this.mesh.material = this.mat
  }

  /** Keep the box on the camera and slide the drops down it. */
  update(dt: number, eye: Vector3): void {
    this.t += dt
    this.mat.setFloat('time', this.t)
    /*
     * Followed exactly, NOT snapped. Snapping to the metre teleports the whole storm a metre sideways
     * several times a second, which is a visible stutter across the entire screen; following the camera
     * continuously is what is actually smooth, because a column of rain looks the same wherever it is.
     */
    this.mesh.position.copyFrom(eye)
  }

  dispose(): void {
    this.mesh.dispose()
    this.mat.dispose()
  }
}
