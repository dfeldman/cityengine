/**
 * Dogs on leads: some of the strangers walk one.
 *
 * There is no MakeHuman for dogs, so this is a small one. One body — the user's Tripo golden retriever, packed by
 * tools/animals/pack.ts with its coat neutral grey — is rigged HERE, by hand, from a layout of where its joints
 * are (`LAYOUT`, measured off the mesh's own profile). Every vertex is weighted to the two nearest bones of its
 * region: legs claim only what is inside their own column and under the belly, the neck and head only what is
 * forward of the chest, the tail only what is behind the rump. Nothing comes from Tripo's rigging or animation.
 *
 * A BREED is a row of numbers (`BREEDS`): overall size, leg length, body length, girth, head size, tail length
 * and a coat colour. Each bone stretches along itself and across itself by its region's numbers, children carried
 * on with their parent, and every vertex follows its bones — so a dachshund is the retriever with 45 % legs and a
 * long back, a terrier a small one, and the coat is multiplied in per instance. The body is then set back on the
 * ground, so shorter legs bring the body down rather than leaving it floating.
 *
 * The walk is generated, not keyframed: a four-beat lateral-sequence walk (left hind, left fore, right hind,
 * right fore a quarter of a cycle apart), each leg swept back during its stance and swung forward with the knee
 * lifted, the body bobbing twice a stride, the head nodding and the tail wagging. Its cadence comes from the leg
 * length — a dachshund scurries — and its sweep is exactly what keeps a planted paw still while the body passes
 * over it. One stride per breed is baked into a texture the way the crowd's is (render/crowd-baked.ts), and the
 * dogs are thin instances, one draw call per breed.
 */
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { BakedVertexAnimationManager } from '@babylonjs/core/BakedVertexAnimation/bakedVertexAnimationManager'
import { VertexAnimationBaker } from '@babylonjs/core/BakedVertexAnimation/vertexAnimationBaker'
import { Bone } from '@babylonjs/core/Bones/bone'
import { Skeleton } from '@babylonjs/core/Bones/skeleton'
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer'
import type { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import type { Scene } from '@babylonjs/core/scene'
import type { Walker } from '../sim/crowd.ts'
import { distance, type Point } from '../city/geo.ts'
import { nearLevel, type Terrain } from '../city/terrain.ts'
import { assetRootAndFile } from '../assets.ts'
import { PEOPLE } from './layers.ts'

type V3 = [number, number, number]
type Rgb = [number, number, number]

/** the packed body, under `models/` */
const MODEL = 'common/dog-retriever.glb'
/** One in this many walkers (by id) has a dog; `?dogs=1` gives everyone one. */
const SHARE = 11
/** Where the dog walks: to the walker's right and a little ahead, in metres. */
const SIDE = 0.6
const AHEAD = 0.5
/** How far away dogs are drawn; they grow in over the last stretch, like the strangers. */
const RANGE = 70
const GROW = 10
/** Frames in one baked stride (the last repeats the first). */
const FRAMES = 32
/** The pace a stride is baked at; playback scales with the walker's speed, as the crowd's does. */
const PACE = 1.35
/** Gait: the share of a stride a paw is planted, the hip/shoulder sweep it aims for, the knee lift in swing. */
const DUTY = 0.62
const SWEEP = 0.45
const KNEE = 0.75
/** body bob (m), head nod and tail wag (radians), all relative to the retriever */
const BOB = 0.010
const NOD = 0.06
const WAG = 0.45

/**
 * The retriever's joints, in its own frame (+z forward, y up, metres; feet at y 0), read off the decimated mesh's
 * profile: head and snout forward to z 0.49, front feet at z 0.23 and x ±0.075, hind at z −0.25 and x ±0.11, the
 * belly at 0.21–0.26 m, the tail raised behind to z −0.49.
 */
const LAYOUT = {
  hip: [0, 0.40, -0.25] as V3,
  mid: [0, 0.42, -0.02] as V3,
  withers: [0, 0.45, 0.21] as V3,
  neck: [0, 0.48, 0.23] as V3,
  poll: [0, 0.62, 0.31] as V3,
  snout: [0, 0.57, 0.49] as V3,
  tail: [[0, 0.47, -0.34], [0, 0.56, -0.42], [0, 0.63, -0.50]] as V3[],
  front: { x: 0.075, z: 0.23, y: 0.40 },
  back: { x: 0.11, z: -0.25, y: 0.40 },
  knee: 0.20,
  /** legs claim vertices below this (blending over ±LEG_BAND) and within LEG_R of their column in z */
  legTop: 0.29,
  legBand: 0.05,
  legR: 0.11,
  /** the neck and head claim vertices forward of this and above HEAD_Y; the tail behind TAIL_Z and above TAIL_Y */
  headZ: 0.18,
  headY: 0.30,
  tailZ: -0.31,
  tailY: 0.36,
}

export interface Breed {
  name: string
  /** how often it turns up, relative to the others */
  weight: number
  /** whole-body scale, then the regions' own: legs, back (length), girth, head, tail */
  size: number
  leg: number
  body: number
  girth: number
  head: number
  tail: number
  /** coat colours (one picked per dog), multiplied into the neutral coat */
  coats: Rgb[]
}

export const BREEDS: Breed[] = [
  { name: 'golden retriever', weight: 3, size: 1, leg: 1, body: 1, girth: 1, head: 1, tail: 1, coats: [[0.98, 0.74, 0.44], [0.92, 0.64, 0.34]] },
  { name: 'labrador', weight: 3, size: 1.0, leg: 0.95, body: 0.97, girth: 1.12, head: 1.04, tail: 0.8, coats: [[0.17, 0.15, 0.14], [0.98, 0.84, 0.6], [0.42, 0.26, 0.16]] },
  { name: 'dachshund', weight: 1.5, size: 0.72, leg: 0.42, body: 1.3, girth: 1.0, head: 1.1, tail: 0.9, coats: [[0.62, 0.32, 0.16], [0.2, 0.15, 0.12]] },
  { name: 'terrier', weight: 2, size: 0.55, leg: 0.95, body: 0.85, girth: 1.05, head: 1.2, tail: 0.6, coats: [[1.08, 1.06, 1.0], [0.85, 0.7, 0.5]] },
  { name: 'greyhound', weight: 1, size: 1.05, leg: 1.25, body: 1.05, girth: 0.78, head: 0.95, tail: 1.2, coats: [[0.55, 0.55, 0.58], [0.82, 0.72, 0.6]] },
]

type Region = 'root' | 'body' | 'head' | 'tail' | 'leg'
interface BoneDef { name: string; parent: number; head: V3; tail: V3; region: Region; leg?: { front: boolean; side: number; upper: boolean; phase: number } }

function bonesOf(L: typeof LAYOUT): BoneDef[] {
  const b: BoneDef[] = [
    { name: 'root', parent: -1, head: [0, 0, 0], tail: [0, 0.01, 0], region: 'root' },
    { name: 'pelvis', parent: 0, head: L.hip, tail: L.mid, region: 'body' },
    { name: 'chest', parent: 1, head: L.mid, tail: L.withers, region: 'body' },
    { name: 'neck', parent: 2, head: L.neck, tail: L.poll, region: 'head' },
    { name: 'head', parent: 3, head: L.poll, tail: L.snout, region: 'head' },
    { name: 'tail1', parent: 1, head: L.tail[0], tail: L.tail[1], region: 'tail' },
    { name: 'tail2', parent: 5, head: L.tail[1], tail: L.tail[2], region: 'tail' },
  ]
  // lateral sequence: left hind 0, left fore ¼, right hind ½, right fore ¾
  for (const front of [true, false]) for (const side of [1, -1]) {
    const c = front ? L.front : L.back
    const phase = (side === 1 ? 0 : 0.5) + (front ? 0.25 : 0)
    const up = b.length
    b.push({ name: `${front ? 'f' : 'h'}${side > 0 ? 'l' : 'r'}.upper`, parent: front ? 2 : 1, head: [side * c.x, c.y, c.z], tail: [side * c.x, L.knee, c.z], region: 'leg', leg: { front, side, upper: true, phase } })
    b.push({ name: `${front ? 'f' : 'h'}${side > 0 ? 'l' : 'r'}.lower`, parent: up, head: [side * c.x, L.knee, c.z], tail: [side * c.x, 0, c.z], region: 'leg', leg: { front, side, upper: false, phase } })
  }
  return b
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const smooth = (e0: number, e1: number, x: number): number => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t) }

function segDist(p: V3, a: V3, b: V3): number {
  const ab = sub(b, a)
  const t = Math.min(1, Math.max(0, dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab))))
  const d = sub(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t])
  return Math.sqrt(dot(d, d))
}

/** Up to four (bone, weight) pairs per vertex: the two nearest body-side bones and the two nearest leg bones, mixed by height. */
function weigh(pos: ArrayLike<number>, bones: BoneDef[], L: typeof LAYOUT): { idx: Float32Array; w: Float32Array } {
  const n = pos.length / 3
  const idx = new Float32Array(n * 4)
  const w = new Float32Array(n * 4)
  const nearest2 = (p: V3, ok: (b: BoneDef) => boolean): [number, number][] => {
    const d = bones.map((b, i) => [i, ok(b) ? segDist(p, b.head, b.tail) : Infinity] as [number, number]).filter((q) => q[1] < Infinity).sort((a, b) => a[1] - b[1]).slice(0, 2)
    const inv = d.map(([i, dd]) => [i, 1 / (dd + 0.02) ** 2] as [number, number])
    const sum = inv.reduce((s, q) => s + q[1], 0)
    return inv.map(([i, q]) => [i, q / sum])
  }
  for (let v = 0; v < n; v++) {
    const p: V3 = [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]]
    const body = nearest2(p, (b) => b.region === 'body'
      || (b.region === 'head' && p[2] > L.headZ && p[1] > L.headY)
      || (b.region === 'tail' && p[2] < L.tailZ && p[1] > L.tailY))
    const inColumn = (b: BoneDef): boolean => b.region === 'leg' && Math.abs(p[2] - b.head[2]) < L.legR && p[0] * b.leg!.side > -0.03
    const legs = nearest2(p, inColumn)
    const g = legs.length ? 1 - smooth(L.legTop - L.legBand, L.legTop + L.legBand, p[1]) : 0
    const all = [...body.map(([i, q]) => [i, q * (1 - g)]), ...legs.map(([i, q]) => [i, q * g])]
    all.forEach(([i, q], k) => { idx[v * 4 + k] = i; w[v * 4 + k] = q })
  }
  return { idx, w }
}

/** A breed's stretch of one bone: along itself by `len`, across by `girth`, its head moved to `head2`. */
interface Stretch { head: V3; head2: V3; u: V3; len: number; girth: number }
const stretch = (s: Stretch, p: V3): V3 => {
  const r = sub(p, s.head)
  const a = dot(r, s.u)
  const q = [r[0] - s.u[0] * a, r[1] - s.u[1] * a, r[2] - s.u[2] * a]
  return [s.head2[0] + s.u[0] * a * s.len + q[0] * s.girth, s.head2[1] + s.u[1] * a * s.len + q[1] * s.girth, s.head2[2] + s.u[2] * a * s.len + q[2] * s.girth]
}

/** The breed's bones (heads and tails) and its vertices, set on the ground and scaled to size. */
function shape(bones: BoneDef[], pos: Float32Array, wt: { idx: Float32Array; w: Float32Array }, br: Breed): { bones: BoneDef[]; pos: Float32Array } {
  const s: Stretch[] = []
  for (let i = 0; i < bones.length; i++) {
    const b = bones[i]
    const ab = sub(b.tail, b.head)
    const l = Math.sqrt(dot(ab, ab))
    const u: V3 = [ab[0] / l, ab[1] / l, ab[2] / l]
    const [len, girth] = b.region === 'leg' ? [br.leg, 1] : b.region === 'body' ? [br.body, br.girth] : b.region === 'head' ? [br.head, br.head] : b.region === 'tail' ? [br.tail, 1] : [1, 1]
    // a child rides on its parent's stretch; the pelvis stays put (the body is grounded afterwards)
    const head2 = b.parent < 0 || b.name === 'pelvis' ? b.head : stretch(s[b.parent], b.head)
    s.push({ head: b.head, head2, u, len, girth })
  }
  const out = new Float32Array(pos.length)
  for (let v = 0; v < pos.length / 3; v++) {
    const p: V3 = [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]]
    for (let k = 0; k < 4; k++) {
      const q = wt.w[v * 4 + k]
      if (q === 0) continue
      const m = stretch(s[wt.idx[v * 4 + k]], p)
      out[v * 3] += m[0] * q; out[v * 3 + 1] += m[1] * q; out[v * 3 + 2] += m[2] * q
    }
  }
  let minY = Infinity
  for (let v = 1; v < out.length; v += 3) minY = Math.min(minY, out[v])
  const place = (p: V3): V3 => [p[0] * br.size, (p[1] - minY) * br.size, p[2] * br.size]
  for (let v = 0; v < out.length; v += 3) { const p = place([out[v], out[v + 1], out[v + 2]]); out[v] = p[0]; out[v + 1] = p[1]; out[v + 2] = p[2] }
  const shaped = bones.map((b, i) => ({ ...b, head: i === 0 ? b.head : place(s[i].head2), tail: place(stretch(s[i], b.tail)) }))
  return { bones: shaped, pos: out }
}

interface Kind { breed: Breed; mesh: Mesh; manager: BakedVertexAnimationManager; fps: number; buf?: { cap: number; matrices: Float32Array; settings: Float32Array; colours: Float32Array } }

export class Dogs {
  private readonly scene: Scene
  private readonly kinds: Kind[] = []
  private readonly share: number
  private time = 0
  ready: Promise<void>
  /**
   * A test line (dev: `window.__dogs.test = […]`): when set, these are drawn instead of the strangers' dogs — breed
   * i at entry i (mod the breeds), standing exactly at `at`, walking on the spot at `speed`. For judging the gait.
   */
  test: { at: Point; y: number; heading: number; speed: number }[] | null = null

  constructor(scene: Scene, base: string, opts: { share?: number } = {}) {
    this.scene = scene
    this.share = opts.share ?? SHARE
    this.ready = this.build(base).catch((e) => console.warn('dogs', e instanceof Error ? e.message : String(e)))
  }

  private async build(base: string): Promise<void> {
    const r = await SceneLoader.ImportMeshAsync('', ...assetRootAndFile(base, MODEL), this.scene)
    const src = r.meshes.find((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0)
    if (!src) throw new Error('no dog mesh')
    src.setParent(null)
    src.bakeCurrentTransformIntoVertices()
    for (const m of r.meshes) if (m !== src) m.dispose()
    const pos0 = Float32Array.from(src.getVerticesData(VertexBuffer.PositionKind)!)
    const bones0 = bonesOf(LAYOUT)
    const wt = weigh(pos0, bones0, LAYOUT)
    const pbr = src.material as PBRMaterial | null
    const mat = new StandardMaterial('dog', this.scene)
    mat.diffuseTexture = pbr?.albedoTexture ?? null
    mat.specularColor.set(0.06, 0.06, 0.06)
    mat.emissiveColor.set(0.08, 0.075, 0.07)
    // which way a positive turn about x sends a hanging paw: the gait wants "forward" to be +z
    const probe = Vector3.TransformCoordinates(new Vector3(0, -1, 0), Matrix.RotationX(0.3))
    const fwd = probe.z > 0 ? 1 : -1
    for (const breed of BREEDS) {
      const { bones, pos } = shape(bones0, pos0, wt, breed)
      const mesh = src.clone(`dog.${breed.name}`, null)!
      mesh.makeGeometryUnique()
      mesh.setVerticesData(VertexBuffer.PositionKind, pos, false)
      mesh.setVerticesData(VertexBuffer.MatricesIndicesKind, wt.idx, false, 4)
      mesh.setVerticesData(VertexBuffer.MatricesWeightsKind, wt.w, false, 4)
      mesh.refreshBoundingInfo()
      const skeleton = new Skeleton(`dog.${breed.name}`, `dog.${breed.name}`, this.scene)
      const bb: Bone[] = []
      bones.forEach((b, i) => {
        const at = b.parent < 0 ? b.head : sub(b.head, bones[b.parent].head)
        bb.push(new Bone(b.name, skeleton, b.parent < 0 ? null : bb[b.parent], Matrix.Translation(at[0], at[1], at[2])))
        void i
      })
      mesh.skeleton = skeleton
      mesh.numBoneInfluencers = 4
      // cadence from leg length: the sweep a planted paw needs to stay put while the body passes is SWEEP
      const legLen = bones.filter((b) => b.leg?.front).reduce((s, b) => s + segDist(b.head, b.head, b.tail), 0) / 2
      const hz = (PACE * DUTY) / (2 * legLen * Math.sin(SWEEP))
      const amp = SWEEP
      const rest = bb.map((b) => b.getLocalMatrix().getTranslation())
      const floats = (bb.length + 1) * 16
      const data = new Float32Array(floats * (FRAMES + 1))
      const sz = breed.size
      for (let f = 0; f <= FRAMES; f++) {
        const t = f / FRAMES
        bones.forEach((b, i) => {
          let q = Quaternion.Identity()
          const p = rest[i].clone()
          if (b.leg) {
            const ph = (((t + b.leg.phase) % 1) + 1) % 1
            let thigh: number
            let knee = 0
            if (ph < DUTY) thigh = amp - 2 * amp * (ph / DUTY)
            else { const s = (ph - DUTY) / (1 - DUTY); thigh = -amp + 2 * amp * (0.5 - 0.5 * Math.cos(Math.PI * s)); knee = KNEE * Math.sin(Math.PI * s) }
            q = Quaternion.RotationAxis(Vector3.Right(), fwd * (b.leg.upper ? thigh : -knee))
          } else if (b.name === 'pelvis') {
            p.y += BOB * sz * Math.cos(4 * Math.PI * t)
          } else if (b.name === 'neck') {
            q = Quaternion.RotationAxis(Vector3.Right(), fwd * NOD * Math.sin(4 * Math.PI * t))
          } else if (b.region === 'tail') {
            q = Quaternion.RotationAxis(Vector3.Up(), WAG * Math.sin(4 * Math.PI * t - (b.name === 'tail2' ? 0.8 : 0)))
          }
          bb[i].setRotationQuaternion(q)
          bb[i].setPosition(p)
        })
        skeleton.prepare(true)
        data.set(skeleton.getTransformMatrices(mesh), f * floats)
      }
      const manager = new BakedVertexAnimationManager(this.scene)
      manager.texture = new VertexAnimationBaker(this.scene, mesh).textureFromBakedVertexData(data)
      mesh.material = mat
      mesh.bakedVertexAnimationManager = manager
      mesh.thinInstanceRegisterAttribute('bakedVertexAnimationSettingsInstanced', 4)
      mesh.thinInstanceRegisterAttribute('color', 4)
      mesh.thinInstanceCount = 0
      mesh.alwaysSelectAsActiveMesh = true
      mesh.isPickable = false
      mesh.renderingGroupId = 3
      mesh.layerMask = 0x0fffffff | PEOPLE
      mesh.setEnabled(false)
      this.kinds.push({ breed, mesh, manager, fps: FRAMES * hz })
    }
    src.dispose()
  }

  /** a walker's dog, if they have one: the breed's index and the coat */
  private dogOf(w: Walker): { k: number; coat: Rgb } | null {
    if (w.kind !== 'walk') return null
    let h = Math.imul(w.id ^ 0x27d4eb2f, 0x165667b1) >>> 0
    h = (h ^ (h >>> 15)) >>> 0
    if (h % this.share !== 0) return null
    const total = this.kinds.reduce((s, k) => s + k.breed.weight, 0)
    let pick = ((h >>> 8) % 1000) / 1000 * total
    let k = 0
    while (k < this.kinds.length - 1 && pick >= this.kinds[k].breed.weight) { pick -= this.kinds[k].breed.weight; k++ }
    const coats = this.kinds[k].breed.coats
    return { k, coat: coats[(h >>> 20) % coats.length] }
  }

  update(dt: number, walkers: readonly Walker[], rider: Point, terrain?: Terrain, drawn?: ReadonlySet<number>): void {
    if (this.kinds.length === 0) return
    this.time += dt
    const groups: { w: Walker; d: number; coat: Rgb; test?: boolean }[][] = this.kinds.map(() => [])
    if (this.test) {
      this.test.forEach((t, i) => groups[i % this.kinds.length].push({
        w: { id: i, at: t.at, y: t.y, heading: t.heading, speed: t.speed, kind: 'walk' } as Walker, d: 0, coat: this.kinds[i % this.kinds.length].breed.coats[0], test: true,
      }))
      walkers = []
    }
    for (const w of walkers) {
      if (drawn && !drawn.has(w.id)) continue
      const d = distance(w.at, rider)
      if (d > RANGE) continue
      const dog = this.dogOf(w)
      if (dog) groups[dog.k].push({ w, d, coat: dog.coat })
    }
    const m = new Matrix()
    const one = new Vector3()
    const at = new Vector3()
    this.kinds.forEach((kind, ki) => {
      kind.manager.time = this.time
      const list = groups[ki]
      const n = list.length
      if (n === 0) { kind.mesh.thinInstanceCount = 0; kind.mesh.setEnabled(false); return }
      if (!kind.buf || kind.buf.cap < n) {
        let cap = 8
        while (cap < n) cap *= 2
        kind.buf = { cap, matrices: new Float32Array(cap * 16), settings: new Float32Array(cap * 4), colours: new Float32Array(cap * 4) }
        kind.mesh.thinInstanceSetBuffer('matrix', kind.buf.matrices, 16, false)
        kind.mesh.thinInstanceSetBuffer('bakedVertexAnimationSettingsInstanced', kind.buf.settings, 4, false)
        kind.mesh.thinInstanceSetBuffer('color', kind.buf.colours, 4, false)
      }
      const { matrices, settings, colours } = kind.buf
      list.forEach(({ w, d, coat, test }, i) => {
        const sin = Math.sin(w.heading)
        const cos = Math.cos(w.heading)
        const side = test ? 0 : SIDE
        const ahead = test ? 0 : AHEAD
        const x = w.at.x + cos * side + sin * ahead
        const z = w.at.z - sin * side + cos * ahead
        const y = w.y ?? (w.park ? (terrain?.rawHeightAt(x, z) ?? 0) : nearLevel(terrain?.heightAt(x, z) ?? 0, w.level))
        const s = Math.min(1, Math.max(0, (RANGE - d) / GROW))
        one.set(s, s, s)
        at.set(x, y, z)
        Matrix.ComposeToRef(one, Quaternion.RotationYawPitchRoll(w.heading, 0, 0), at, m)
        m.copyToArray(matrices, i * 16)
        settings.set([0, FRAMES, (w.id * 5.17) % FRAMES, kind.fps * (w.speed / PACE)], i * 4)
        colours.set([coat[0], coat[1], coat[2], 1], i * 4)
      })
      kind.mesh.thinInstanceCount = n
      kind.mesh.thinInstancePartialBufferUpdate('matrix', n, 0)
      kind.mesh.thinInstancePartialBufferUpdate('bakedVertexAnimationSettingsInstanced', n, 0)
      kind.mesh.thinInstancePartialBufferUpdate('color', n, 0)
      kind.mesh.setEnabled(true)
    })
  }
}
