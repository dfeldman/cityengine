/**
 * Zoo animals: the user's rigged Tripo models with their own textures and Blender-scripted clips (packed by
 * tools/animals/pack.ts; the giraffe's motion is tools/animals/giraffe-clips.py), roaming hand-drawn paddocks.
 *
 * A herd is a paddock outline and a head count. The paddock is OSM's own shape where it has one — the Parc
 * zoologique de Paris's giraffe plain is a `natural=sand` polygon west of the Maison des girafes, wrapped round a
 * wooded island (IGN aerial, 2026-11-20) — and a fence is built along it. Each animal idles, browses, or walks
 * to a spot elsewhere in the paddock, turning as it goes, its clip cross-faded from one to the next and the walk
 * played at the pace it actually moves, so its hooves do not slide.
 *
 * Loaded only when the rider comes within `LOAD` of a paddock, drawn and moved only within `DRAW`. Each animal is
 * its own copy of the model (AssetContainer.instantiateModelsToScene): a herd is a handful, not a crowd.
 */
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import type { AssetContainer } from '@babylonjs/core/assetContainer'
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Scene } from '@babylonjs/core/scene'
import { Projection, distance, type Point } from '../city/geo.ts'
import type { Terrain } from '../city/terrain.ts'
import { assetRootAndFile } from '../assets.ts'

/** the rider comes this close to a paddock's centre: its animals are loaded */
const LOAD = 1200
/** and this close: they are drawn and move */
const DRAW = 700
/** seconds to cross-fade from one clip to the next */
const FADE = 0.7
/** an animal keeps this far inside its paddock's edge (m) */
const MARGIN = 3.5
/** and this far from the others when it picks where to go */
const SPACING = 6
/** a walk goes this far, at least and at most (m) */
const WALK_MIN = 10
const WALK_MAX = 45
/** fence: post spacing and height, the rails' heights, the wood's colour */
const POST_EVERY = 3
const FENCE_H = 1.9
const RAILS = [0.55, 1.15, 1.8]
const WOOD = new Color3(0.42, 0.31, 0.2)
/** the clips' frame rate (tools/animals/giraffe-clips.py FPS) */
const CLIP_FPS = 24

interface Species {
  file: string
  /** the model's height (it is normalised to 1) in metres: a giraffe to the top of its ossicones */
  size: number
  /**
   * the yaw that makes the model face +z (heading 0) once the glTF loader's own handedness flip is applied.
   * Tripo's giraffe faces +x in glTF, which is −x after the flip: a quarter turn (checked by eye, 2026-11-20).
   */
  yaw: number
  /** the ground speed its walk clip was baked at, at full size (the clip script's WALK_SPEED) */
  walk: number
  /** how fast it turns while walking (rad/s) */
  turn: number
  /** how long it stays put (s), and how likely each next thing is: walk, idle (else browse) */
  rest: [number, number]
  odds: { walk: number; idle: number }
}

export const SPECIES: Record<string, Species> = {
  giraffe: { file: 'common/giraffe.glb', size: 4.8, yaw: Math.PI / 2, walk: 1.1, turn: 0.45, rest: [6, 18], odds: { walk: 0.5, idle: 0.3 } },
  // Tripo's bison is normalised to 1 unit LONG (3 m, ~2 m at the hump) and already faces +z after the flip
  // (checked from straight ahead of its heading, 2026-11-20); its "browse" clip is grazing, head to the grass
  // (tools/animals/bison-clips.py)
  bison: { file: 'common/bison.glb', size: 3.0, yaw: 0, walk: 1.0, turn: 0.4, rest: [8, 20], odds: { walk: 0.35, idle: 0.25 } },
}

export interface Herd {
  name: string
  species: keyof typeof SPECIES
  /** the paddock, [lat, lon] round its edge */
  paddock: [number, number][]
  /** each animal's size relative to the species' (a young one is smaller) */
  sizes: number[]
  fence?: boolean
}

/** Parc zoologique de Paris, Plaine Sahel-Soudan: OSM's sand polygon on the giraffe plain, simplified to 1.5 m. */
const GIRAFFE_PLAIN: [number, number][] = [
  [48.832785, 2.417795], [48.832702, 2.417825], [48.832666, 2.417802], [48.832523, 2.417935], [48.832485, 2.418003],
  [48.8325, 2.41813], [48.832474, 2.418351], [48.832399, 2.418412], [48.832381, 2.418478], [48.832372, 2.418837],
  [48.832235, 2.419138], [48.83225, 2.419198], [48.83223, 2.419251], [48.832183, 2.419281], [48.832211, 2.419278],
  [48.832265, 2.419357], [48.83225, 2.419422], [48.832203, 2.419405], [48.832267, 2.419487], [48.832253, 2.419604],
  [48.83237, 2.419582], [48.832381, 2.4195], [48.832413, 2.419471], [48.832376, 2.419204], [48.832402, 2.419177],
  [48.832401, 2.419033], [48.832493, 2.418899], [48.832548, 2.418733], [48.832631, 2.418727], [48.832647, 2.418684],
  [48.832714, 2.418705], [48.83274, 2.418595], [48.832773, 2.418579], [48.832856, 2.418604], [48.832859, 2.418733],
  [48.832808, 2.418988], [48.832717, 2.419128], [48.832736, 2.419202], [48.832854, 2.419054], [48.833013, 2.418734],
  [48.833066, 2.418731], [48.833093, 2.418612], [48.833088, 2.418535], [48.832966, 2.41833], [48.832933, 2.418123],
  [48.832773, 2.418044], [48.832785, 2.417923], [48.832834, 2.41787],
]

/**
 * Ménagerie du Jardin des Plantes: its largest fenced paddock (OSM barrier=fence ring, 2 830 m², east side, among
 * the trees). The Ménagerie has no giraffes in life — the owner asked for giraffes in every zoo (2026-11-20).
 */
const MENAGERIE_PADDOCK: [number, number][] = [
  [48.845696, 2.361343], [48.845388, 2.361389], [48.845342, 2.361434], [48.845328, 2.361537], [48.845328, 2.361748],
  [48.84556, 2.362494], [48.84577, 2.362176], [48.845763, 2.36211], [48.845771, 2.361858], [48.845689, 2.361901],
  [48.845672, 2.361786], [48.845708, 2.361684], [48.845763, 2.361462], [48.845744, 2.361402], [48.845722, 2.361367],
]

/**
 * Every zoo inside a city bake has giraffes (owner, 2026-11-20). OSM's tourism=zoo inside the bakes: these two, plus
 * two petting farms left out — the Bergerie des Malassis is a 36 × 25 m sheepfold, La ferme ouverte is at the box's
 * far west edge. The San Francisco Zoo is outside the SF bake.
 */
/** Golden Gate Park's Bison Paddock (OSM attraction=animal, 50 700 m², along JFK Drive by Spreckels Lake). */
const GGP_BISON_PADDOCK: [number, number][] = [
  [37.770121, -122.500191], [37.770029, -122.500183], [37.770003, -122.50018], [37.769514, -122.500057],
  [37.76948, -122.500052], [37.769329, -122.500073], [37.768986, -122.49997], [37.768645, -122.499596],
  [37.768738, -122.499237], [37.76879, -122.499219], [37.768796, -122.499186], [37.7688, -122.499161],
  [37.768786, -122.499098], [37.768899, -122.498638], [37.769086, -122.498142], [37.769578, -122.496043],
  [37.770138, -122.496249], [37.770138, -122.496443], [37.770119, -122.496912], [37.770241, -122.497215],
  [37.770675, -122.497593], [37.770773, -122.498158], [37.770551, -122.498758], [37.770279, -122.499479],
  [37.770264, -122.499518], [37.770325, -122.49964],
]

export const HERDS: Herd[] = [
  { name: 'vincennes-giraffes', species: 'giraffe', paddock: GIRAFFE_PLAIN, sizes: [1, 1.04, 0.96, 1, 0.7], fence: true },
  { name: 'menagerie-giraffes', species: 'giraffe', paddock: MENAGERIE_PADDOCK, sizes: [1, 0.95, 0.72], fence: true },
  // the real herd is about ten; two calves
  { name: 'ggp-bison', species: 'bison', paddock: GGP_BISON_PADDOCK, sizes: [1, 1.06, 0.95, 1, 1.1, 0.92, 1.02, 0.62, 0.58], fence: true },
]

type Clip = 'idle' | 'browse' | 'walk'

interface Beast {
  node: TransformNode
  clips: Partial<Record<Clip, AnimationGroup>>
  clip: Clip
  /** the clip being faded out, and how far the fade has got (0..1) */
  from?: Clip
  fade: number
  until: number
  target?: Point
  at: Point
  heading: number
  size: number
}

interface Pen {
  herd: Herd
  poly: Point[]
  centre: Point
  beasts: Beast[]
  state: 'far' | 'loading' | 'ready'
  rand: () => number
}

/** a small seeded generator, so a herd starts the same way every ride */
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

function inside(p: Point, poly: Point[]): boolean {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if ((a.z > p.z) !== (b.z > p.z) && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) c = !c
  }
  return c
}

function edgeDist(p: Point, poly: Point[]): number {
  let best = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j]
    const b = poly[i]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)))
    best = Math.min(best, Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t))
  }
  return best
}

/** well inside the paddock: inside it and MARGIN from every edge */
const roomy = (p: Point, poly: Point[]): boolean => inside(p, poly) && edgeDist(p, poly) > MARGIN

export class Zoo {
  private readonly scene: Scene
  private readonly terrain: Terrain
  private readonly base: string
  private readonly pens: Pen[]
  private readonly containers = new Map<string, Promise<AssetContainer>>()
  private time = 0

  constructor(scene: Scene, origin: { lat: number; lon: number }, terrain: Terrain, base: string, herds: Herd[] = HERDS) {
    this.scene = scene
    this.terrain = terrain
    this.base = base
    const proj = new Projection(origin)
    this.pens = herds.map((herd, i) => {
      const poly = herd.paddock.map(([lat, lon]) => proj.toLocal({ lat, lon }))
      const centre = { x: poly.reduce((s, p) => s + p.x, 0) / poly.length, z: poly.reduce((s, p) => s + p.z, 0) / poly.length }
      return { herd, poly, centre, beasts: [], state: 'far' as const, rand: mulberry(0x9e3779b9 ^ (i * 7919)) }
    })
    ;(window as unknown as { __zoo?: Zoo }).__zoo = this
  }

  /** where each animal is and what it is doing (dev: the shot tools look at them) */
  get animals(): { herd: string; at: Point; heading: number; clip: Clip }[] {
    return this.pens.flatMap((p) => p.beasts.map((b) => ({ herd: p.herd.name, at: b.at, heading: b.heading, clip: b.clip })))
  }

  private container(species: string): Promise<AssetContainer> {
    let p = this.containers.get(species)
    if (!p) {
      p = SceneLoader.LoadAssetContainerAsync(...assetRootAndFile(this.base, SPECIES[species].file), this.scene)
      this.containers.set(species, p)
    }
    return p
  }

  /** somewhere roomy in the pen, away from the others; a walk's length from `from` if given */
  private spot(pen: Pen, from?: Point): Point | null {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (const p of pen.poly) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z) }
    for (let k = 0; k < 300; k++) {
      const p = { x: minX + pen.rand() * (maxX - minX), z: minZ + pen.rand() * (maxZ - minZ) }
      if (!roomy(p, pen.poly)) continue
      if (from) { const d = distance(p, from); if (d < WALK_MIN || d > WALK_MAX) continue }
      if (pen.beasts.some((b) => distance(b.target ?? b.at, p) < SPACING)) continue
      return p
    }
    return null
  }

  private async load(pen: Pen): Promise<void> {
    const sp = SPECIES[pen.herd.species]
    const c = await this.container(pen.herd.species)
    if (pen.herd.fence) this.fence(pen)
    pen.herd.sizes.forEach((size, i) => {
      const at = this.spot(pen) ?? pen.centre
      const node = new TransformNode(`zoo.${pen.herd.name}.${i}`, this.scene)
      const inst = c.instantiateModelsToScene((n) => `zoo.${pen.herd.name}.${i}.${n}`, false)
      for (const r of inst.rootNodes) r.parent = node
      for (const m of node.getChildMeshes()) { m.isPickable = false; m.renderingGroupId = 3 }
      node.scaling.setAll(sp.size * size)
      const clips: Beast['clips'] = {}
      for (const g of inst.animationGroups) {
        const name = g.name.split('.').pop() as Clip
        clips[name] = g
        g.start(true, 1)
        // somewhere different in each clip, so the herd does not move as one
        g.goToFrame(g.from + (g.to - g.from) * pen.rand())
        g.setWeightForAllAnimatables(name === 'idle' ? 1 : 0)
      }
      pen.beasts.push({ node, clips, clip: 'idle', fade: 1, until: this.time + sp.rest[0] * pen.rand() * 2, at, heading: pen.rand() * Math.PI * 2, size })
    })
    pen.state = 'ready'
  }

  /** a post-and-rail fence along the paddock's edge: one box, thin-instanced */
  private fence(pen: Pen): void {
    const box = MeshBuilder.CreateBox(`zoo.${pen.herd.name}.fence`, { size: 1 }, this.scene)
    const mat = new StandardMaterial(`zoo.${pen.herd.name}.fence`, this.scene)
    mat.diffuseColor = WOOD
    mat.specularColor.set(0.04, 0.04, 0.04)
    box.material = mat
    box.isPickable = false
    box.renderingGroupId = 3
    const mats: number[] = []
    const m = new Matrix()
    const posts: Vector3[] = []
    for (let i = 0; i < pen.poly.length; i++) {
      const a = pen.poly[i]
      const b = pen.poly[(i + 1) % pen.poly.length]
      const n = Math.max(1, Math.round(distance(a, b) / POST_EVERY))
      for (let k = 0; k < n; k++) {
        const x = a.x + ((b.x - a.x) * k) / n
        const z = a.z + ((b.z - a.z) * k) / n
        posts.push(new Vector3(x, this.terrain.rawHeightAt(x, z), z))
      }
    }
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i]
      Matrix.ComposeToRef(new Vector3(0.14, FENCE_H, 0.14), Quaternion.Identity(), new Vector3(p.x, p.y + FENCE_H / 2, p.z), m)
      mats.push(...m.asArray())
      const q = posts[(i + 1) % posts.length]
      const dx = q.x - p.x
      const dz = q.z - p.z
      const h = Math.hypot(dx, dz)
      const rot = Quaternion.RotationYawPitchRoll(Math.atan2(dx, dz), -Math.atan2(q.y - p.y, h), 0)
      for (const r of RAILS) {
        Matrix.ComposeToRef(new Vector3(0.06, 0.12, Math.hypot(h, q.y - p.y)), rot, new Vector3((p.x + q.x) / 2, (p.y + q.y) / 2 + r, (p.z + q.z) / 2), m)
        mats.push(...m.asArray())
      }
    }
    box.thinInstanceSetBuffer('matrix', new Float32Array(mats), 16, true)
  }

  private play(b: Beast, clip: Clip): void {
    if (b.clip === clip) return
    b.from = b.clip
    b.clip = clip
    b.fade = 0
  }

  private next(pen: Pen, b: Beast): void {
    const sp = SPECIES[pen.herd.species]
    const r = pen.rand()
    const { walk, idle } = sp.odds
    if (r < walk) {
      const t = this.spot(pen, b.at)
      if (t) { b.target = t; this.play(b, 'walk'); return }
    }
    b.target = undefined
    this.play(b, r < walk + idle ? 'idle' : 'browse')
    // a browse is one reach, up and back down: its clip's own length
    const g = b.clips.browse
    b.until = this.time + (b.clip === 'browse' && g ? (g.to - g.from) / CLIP_FPS : sp.rest[0] + pen.rand() * (sp.rest[1] - sp.rest[0]))
    if (b.clip === 'browse' && g) g.goToFrame(g.from)
  }

  private step(pen: Pen, b: Beast, dt: number): void {
    const sp = SPECIES[pen.herd.species]
    const pace = sp.walk * b.size
    if (b.clip === 'walk' && b.target) {
      const dx = b.target.x - b.at.x
      const dz = b.target.z - b.at.z
      let turn = Math.atan2(dx, dz) - b.heading
      turn = Math.atan2(Math.sin(turn), Math.cos(turn))
      b.heading += Math.max(-sp.turn * dt, Math.min(sp.turn * dt, turn))
      // slow while turning hard; stop if another animal is just ahead
      let speed = pace * Math.max(0.25, Math.cos(turn))
      const ahead = { x: b.at.x + Math.sin(b.heading) * 4, z: b.at.z + Math.cos(b.heading) * 4 }
      if (pen.beasts.some((o) => o !== b && distance(o.at, ahead) < 3)) speed = 0
      const nx = b.at.x + Math.sin(b.heading) * speed * dt
      const nz = b.at.z + Math.cos(b.heading) * speed * dt
      if (speed === 0 || !inside({ x: nx, z: nz }, pen.poly) || Math.hypot(dx, dz) < 1.5) {
        b.target = undefined
        this.play(b, 'idle')
        b.until = this.time + 2 + pen.rand() * 4
      } else {
        b.at = { x: nx, z: nz }
      }
      const g = b.clips.walk
      if (g) g.speedRatio = Math.max(0.2, speed / pace)
    } else if (this.time > b.until) {
      this.next(pen, b)
    }
    b.fade = Math.min(1, b.fade + dt / FADE)
    for (const [name, g] of Object.entries(b.clips) as [Clip, AnimationGroup][]) {
      g.setWeightForAllAnimatables(name === b.clip ? b.fade : name === b.from ? 1 - b.fade : 0)
    }
    b.node.position.set(b.at.x, this.terrain.rawHeightAt(b.at.x, b.at.z), b.at.z)
    b.node.rotation.y = b.heading + sp.yaw
  }

  update(dt: number, rider: Point): void {
    this.time += dt
    for (const pen of this.pens) {
      const d = distance(pen.centre, rider)
      if (pen.state === 'far') {
        if (d < LOAD) {
          pen.state = 'loading'
          void this.load(pen).catch((e) => { console.warn('zoo', pen.herd.name, e instanceof Error ? e.message : String(e)); pen.state = 'far' })
        }
        continue
      }
      if (pen.state !== 'ready') continue
      const near = d < DRAW
      for (const b of pen.beasts) {
        b.node.setEnabled(near)
        if (near) this.step(pen, b, Math.min(dt, 0.1))
      }
    }
  }
}
