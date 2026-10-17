/**
 * The sky, and the things in it.
 *
 * A flat clear colour above the rooftops is the single cheapest thing that makes a city look like a model.
 * Half the screen on a street is sky, so it gets: a gradient dome with the sun actually in it, clouds that
 * drift, birds that wheel about, and now and then an airliner going over.
 *
 * The birds and the planes are not decoration for their own sake — they are what tells you the world is
 * running. A city where the only moving things are at street level feels staged; one with something crossing
 * the sky does not, and it costs almost nothing because both are a handful of triangles seen from far away.
 *
 * Everything here ignores the depth buffer's usual rules: the dome is drawn first with depth writing off, so
 * it is always behind everything, and the clouds and aircraft are far enough away that they never intersect
 * a building.
 */
import { Effect } from '@babylonjs/core/Materials/effect'
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import type { Scene } from '@babylonjs/core/scene'
import { DAYLIGHT } from './facade-material.ts'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { birdWing, box, plane as planeModel } from './models.ts'

const DOME_VERTEX = `
precision highp float;
attribute vec3 position;
uniform mat4 worldViewProjection;
varying vec3 vDir;
void main(void) {
  vDir = normalize(position);
  gl_Position = worldViewProjection * vec4(position, 1.0);
}
`

const DOME_FRAGMENT = `
precision highp float;
varying vec3 vDir;
uniform vec3 zenith;
uniform vec3 horizon;
uniform vec3 sunDir;
uniform vec3 sunColour;
uniform float night;
void main(void) {
  vec3 d = normalize(vDir);
  float up = clamp(d.y, 0.0, 1.0);
  vec3 sky = mix(horizon, zenith, pow(up, 0.62));

  vec3 toSun = -normalize(sunDir);
  float cosA = dot(d, toSun);

  // the sun's own disc, about half a degree across, with a soft edge so it does not alias into a hexagon
  float disc = smoothstep(0.99955, 0.99985, cosA);
  // and the glow around it, which is most of what you actually see
  float glow = pow(max(cosA, 0.0), 220.0) * 0.55 + pow(max(cosA, 0.0), 12.0) * 0.16;

  vec3 col = sky + sunColour * glow;

  // stars, once it is dark enough for them. A night sky with nothing in it reads as a bug.
  if (night > 0.5) {
    // (a small soft dot somewhere in its cell: lit across the whole cell, each star was a pale grey parallelogram ~0.7°
    //  across, which read as bits of flat geometry in the sky — 2026-10-17)
    vec2 cell = d.xz / max(0.012, abs(d.y) * 0.04 + 0.012);
    vec2 g = floor(cell);
    float r = fract(sin(dot(g, vec2(12.9898, 78.233))) * 43758.5453);
    vec2 at = fract(cell) - 0.5 - (vec2(fract(r * 13.0), fract(r * 29.0)) - 0.5) * 0.6;
    float dot1 = smoothstep(0.16, 0.04, length(at));
    col += vec3(step(0.9965, r) * dot1 * max(0.0, d.y) * (0.7 + 0.6 * fract(r * 91.0)));
  }
  col = mix(col, sunColour * 1.45, disc);
  gl_FragColor = vec4(col, 1.0);
}
`

let domeRegistered = false

export interface SkyOptions { clouds: number; birds: number; planes: number }

/** How far out the sky furniture lives. Clouds are high and far; birds are close enough to see flapping. */
export const SKY_RADIUS = 520
// Clouds were at 340 m and up to 150 m across, which from a narrow street filled half the screen with a grey
// slab — they read as a collapsing ceiling rather than as weather. Real cumulus sits a kilometre up; these
// sit high enough to look like sky and small enough to look far away.
const CLOUD_Y = 760
const CLOUD_SPREAD = 3400
const BIRD_Y = 110
const PLANE_Y = 1150

interface Cloud { x: number; z: number; scale: number; drift: number }
interface Bird { cx: number; cz: number; r: number; a: number; speed: number; y: number; flap: number }
interface Plane { x: number; z: number; heading: number; speed: number; y: number }

export class Sky {
  private readonly scene: Scene
  private readonly dome: Mesh
  private readonly cloudMesh: Mesh
  private readonly birdMesh: Mesh
  private readonly planeMesh: Mesh
  private readonly clouds: Cloud[] = []
  private readonly birds: Bird[] = []
  private readonly planes: Plane[] = []
  private readonly cloudBuf: Float32Array
  private readonly cloudCol: Float32Array
  private readonly birdBuf: Float32Array
  private readonly birdCol: Float32Array
  private readonly planeBuf: Float32Array
  private readonly planeCol: Float32Array
  private t = 0

  constructor(scene: Scene, opts: Partial<SkyOptions> = {}) {
    this.scene = scene
    /*
     * CLOUDS ARE OFF (owner, 2026-09-23: "the clouds are really bad. we should delete those and figure out
     * atmosphere later"). They drew as flat pale ellipses pasted on the dome — visible in every render taken
     * today, and worse than an empty sky.
     *
     * The machinery is LEFT IN PLACE, not deleted: the instanced mesh, the drift and the per-cloud colour all
     * work, and the fault is what a cloud LOOKS like, not how it is placed. Atmosphere wants doing properly
     * one day — haze with distance, a sun that colours the sky it sits in, cloud shadow on the ground — and
     * that will reuse this. `new Sky(scene, { clouds: 34 })` brings them back for anyone experimenting.
     */
    const o: SkyOptions = { clouds: 0, birds: 7, planes: 2, ...opts }

    if (!domeRegistered) {
      Effect.ShadersStore['skyDomeVertexShader'] = DOME_VERTEX
      Effect.ShadersStore['skyDomeFragmentShader'] = DOME_FRAGMENT
      domeRegistered = true
    }
    const domeMat = new ShaderMaterial('skyDome', scene, 'skyDome', {
      attributes: ['position'],
      uniforms: ['worldViewProjection', 'zenith', 'horizon', 'sunDir', 'sunColour', 'night'],
    })
    domeMat.setFloat('night', DAYLIGHT.fogDensity > 0.004 ? 1 : 0)
    domeMat.setColor3('zenith', DAYLIGHT.zenith)
    domeMat.setColor3('horizon', DAYLIGHT.horizon)
    domeMat.setVector3('sunDir', DAYLIGHT.sun)
    domeMat.setColor3('sunColour', DAYLIGHT.sunColour)
    domeMat.backFaceCulling = false
    domeMat.disableDepthWrite = true

    // a big box rather than a sphere: the gradient is computed per pixel from the direction, so the shape
    // only has to enclose the camera
    const db = new MeshBuilder()
    box(db, 0, 0, 0, 1, 1, 1, [1, 1, 1], 0)
    this.dome = new Mesh('sky', scene)
    db.toVertexData().applyToMesh(this.dome)
    this.dome.material = domeMat
    // Sized to sit INSIDE the camera's far plane. At 4000 with the far plane at 900 the box was clipped by
    // the frustum, and the slices of it that survived were drawn across the middle of the screen as enormous
    // grey and tan polygons. It does not need to be far away: it writes no depth, and everything solid is in
    // a later rendering group that clears depth and therefore draws over it regardless.
    this.dome.scaling.setAll(SKY_RADIUS)
    this.dome.infiniteDistance = true
    this.dome.renderingGroupId = 0
    this.dome.isPickable = false
    /*
     * FIRST in its group. The ground beyond the box is drawn in this group too (render/city.ts `distantGround`, the
     * base), and the dome, writing no depth but still testing it, painted over every piece of ground drawn before it
     * that lay further off than its own faces — about 540 m. From Twin Peaks the far back yards came out as white
     * sky between the rows of houses, which are in a later group and so stood clear of it (2026-10-05).
     */
    scene.setRenderingOrder(0, (a, b) => (a.getMesh() === this.dome ? 0 : 1) - (b.getMesh() === this.dome ? 0 : 1))

    /**
     * Sky furniture gets its own material and its own rendering group.
     *
     * Group 0, with the dome: Babylon clears depth between groups, so anything solid — a building, a lamp
     * post — is drawn afterwards and correctly covers it, while sky shows through wherever there is no
     * building. And almost no fog, because the distance fog is tuned for a street two hundred metres long
     * and would turn a cloud a kilometre up into the same grey as everything else.
     */
    const mat = cartoonMaterial(scene, 'cartoonSky')
    mat.setFloat('fogDensity', 0.00006)
    mat.disableDepthWrite = true

    this.cloudMesh = this.instanced('clouds', cloudModel(), mat, o.clouds)
    this.birdMesh = this.instanced('birds', birdModel(), mat, o.birds * 9)
    this.planeMesh = this.instanced('planes', planeModelMesh(), mat, o.planes)
    this.cloudBuf = new Float32Array(o.clouds * 16)
    this.cloudCol = new Float32Array(o.clouds * 4)
    this.birdBuf = new Float32Array(o.birds * 9 * 16)
    this.birdCol = new Float32Array(o.birds * 9 * 4)
    this.planeBuf = new Float32Array(o.planes * 16)
    this.planeCol = new Float32Array(o.planes * 4)

    const r = mulberry(20260920)
    for (let i = 0; i < o.clouds; i++) {
      this.clouds.push({
        x: (r() - 0.5) * CLOUD_SPREAD, z: (r() - 0.5) * CLOUD_SPREAD,
        scale: 14 + r() * 26, drift: 1.6 + r() * 2.2,
      })
    }
    for (let i = 0; i < o.birds; i++) {
      this.birds.push({
        cx: (r() - 0.5) * 700, cz: (r() - 0.5) * 700, r: 28 + r() * 60,
        a: r() * Math.PI * 2, speed: 0.22 + r() * 0.2, y: BIRD_Y + r() * 70, flap: r() * 6,
      })
    }
    for (let i = 0; i < o.planes; i++) {
      this.planes.push({
        x: (r() - 0.5) * 5000, z: (r() - 0.5) * 5000, heading: r() * Math.PI * 2,
        speed: 62 + r() * 30, y: PLANE_Y + r() * 500,
      })
    }
  }

  private instanced(name: string, data: MeshBuilder, mat: ShaderMaterial, count: number): Mesh {
    const m = new Mesh(name, this.scene)
    data.toVertexData().applyToMesh(m)
    m.material = mat
    m.isPickable = false
    m.alwaysSelectAsActiveMesh = true
    m.renderingGroupId = 0          // behind everything solid; see the note where the material is made
    // An instance count with no matrix buffer behind it draws `count` copies from undefined attributes,
    // which is a screenful of garbage triangles on the first frame. Start at zero; `update` fills it in.
    m.thinInstanceCount = 0
    m.setEnabled(false)   // same trap as the life pools: an empty instanced mesh is still drawn once
    return m
  }

  /**
   * Hand a filled matrix buffer to an instanced mesh and show it — or, when there is NOTHING to draw,
   * leave it disabled.
   *
   * The zero case is not hypothetical: clouds have been off since 2026-09-23 (`clouds: 0` above), so
   * `cloudBuf` is a `Float32Array(0)`. Setting an empty thin-instance buffer leaves `thinInstanceCount`
   * at 0, and Babylon then draws the mesh as an ORDINARY, non-instanced mesh — but the vertex array still
   * carries `world0..world3` and `instColor` as instanced attributes bound to zero-length GPU buffers.
   * Every vertex of that draw reads past the end of them, which is
   * `GL_INVALID_OPERATION: glDrawElements: attempt to access out of range vertices in attribute N`,
   * once per frame for the whole session (BUGS.md #169). A mesh with no instances must not be drawn at all.
   */
  private show(m: Mesh, matrix: Float32Array, color: Float32Array): void {
    if (matrix.length === 0) { m.setEnabled(false); return }
    m.thinInstanceSetBuffer('matrix', matrix, 16)
    m.thinInstanceSetBuffer('instColor', color, 4)
    m.setEnabled(true)
  }

  /** `at` is the rider, so the sky furniture follows them and never runs out. */
  update(dt: number, at: { x: number; z: number }): void {
    this.t += dt
    const m = Matrix.Identity()

    // clouds: drift downwind and wrap round the rider, so the sky is never empty wherever they ride to
    this.clouds.forEach((c, i) => {
      c.x += c.drift * dt
      const rx = wrap(c.x - at.x, CLOUD_SPREAD)
      const rz = wrap(c.z - at.z, CLOUD_SPREAD)
      Matrix.ComposeToRef(
        new Vector3(c.scale, c.scale * 0.55, c.scale),
        Quaternion.RotationAxis(Vector3.Up(), i * 1.7),
        new Vector3(at.x + rx, CLOUD_Y + (i % 5) * 52, at.z + rz), m)
      m.copyToArray(this.cloudBuf, i * 16)
      this.cloudCol.set([1, 1, 1, 0], i * 4)
    })
    // every entry of these buffers is rewritten above, so the whole array is always valid; see the note in
    // life.ts about what happens when it is not
    this.show(this.cloudMesh, this.cloudBuf, this.cloudCol)

    // birds: each flock circles a drifting centre, every bird on its own phase round the ring
    let b = 0
    for (const f of this.birds) {
      f.a += f.speed * dt
      f.flap += dt * 9
      const fx = at.x + wrap(f.cx - at.x, 900)
      const fz = at.z + wrap(f.cz - at.z, 900)
      for (let k = 0; k < 9; k++) {
        const a = f.a + k * 0.42
        const x = fx + Math.cos(a) * (f.r + k * 1.6)
        const z = fz + Math.sin(a) * (f.r + k * 1.6)
        const y = f.y + Math.sin(a * 2 + k) * 3
        // the flap is a roll about the direction of travel, which at this size reads as wings beating
        const flap = Math.sin(f.flap + k * 0.7) * 0.75
        Matrix.ComposeToRef(
          new Vector3(2.1, 2.1, 2.1),
          Quaternion.RotationYawPitchRoll(-a + Math.PI / 2, 0, flap),
          new Vector3(x, y, z), m)
        m.copyToArray(this.birdBuf, b * 16)
        this.birdCol.set([0.1, 0.1, 0.12, 0], b * 4)
        b++
      }
    }
    this.show(this.birdMesh, this.birdBuf, this.birdCol)

    this.planes.forEach((p, i) => {
      p.x += Math.sin(p.heading) * p.speed * dt
      p.z += Math.cos(p.heading) * p.speed * dt
      const rx = wrap(p.x - at.x, 9000)
      const rz = wrap(p.z - at.z, 9000)
      Matrix.ComposeToRef(
        new Vector3(1, 1, 1),
        Quaternion.RotationYawPitchRoll(p.heading, 0, 0),
        new Vector3(at.x + rx, p.y, at.z + rz), m)
      m.copyToArray(this.planeBuf, i * 16)
      this.planeCol.set([1, 1, 1, 0], i * 4)
    })
    this.show(this.planeMesh, this.planeBuf, this.planeCol)
  }
}

/** A cloud: overlapping flattened boxes, which at this distance is exactly as convincing as anything else. */
function cloudModel(): MeshBuilder {
  const out = new MeshBuilder()
  const white: [number, number, number] = [1.06, 1.07, 1.1]
  const puffs: [number, number, number, number][] = [
    [0, 0, 0, 1.0], [0.9, 0.12, 0.15, 0.72], [-0.85, 0.05, -0.1, 0.66],
    [0.35, 0.34, -0.3, 0.6], [-0.4, 0.28, 0.28, 0.55], [1.5, -0.05, -0.05, 0.44],
    [-1.45, -0.02, 0.06, 0.4],
  ]
  for (const [x, y, z, s] of puffs) box(out, x, y, z, s, s * 0.62, s * 0.8, white, 0)
  return out
}

function birdModel(): MeshBuilder {
  const out = new MeshBuilder()
  birdWing(out)     // builds both wings, double sided
  return out
}

function planeModelMesh(): MeshBuilder {
  const out = new MeshBuilder()
  planeModel(out)
  return out
}

const wrap = (v: number, span: number): number => {
  let x = v
  while (x > span / 2) x -= span
  while (x < -span / 2) x += span
  return x
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

