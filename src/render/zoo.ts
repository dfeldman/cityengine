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
 * Not only zoos: a herd without a fence is free-roaming birds on a park's lawns — the peacocks of the Parc de
 * Bagatelle, which wander the château lawns and the Roseraie (tools/animals/peacock-clips.py rigs Tripo's unrigged
 * bird). Such a species walks shorter, closer together and nearer the edge (`roam`).
 *
 * Loaded only when the rider comes within `LOAD` of a paddock, drawn and moved only within `DRAW`. Each animal is
 * its own copy of the model (AssetContainer.instantiateModelsToScene): a herd is a handful, not a crowd.
 */
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import type { AssetContainer } from '@babylonjs/core/assetContainer'
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup'
// the side effect that makes animations ADVANCE: Babylon 9 keeps scene._animate in this module, and nothing else
// in the game imports it (the crowd's motion is baked) — without it the clips start but never move (2026-11-20)
import '@babylonjs/core/Animations/animatable'
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
/** Babylon's glTF loader keys every clip at 60 frames a second, whatever rate it was authored at */
const CLIP_FPS = 60
/** a walk turns on the spot until it is within this of its heading (rad), then sets off */
const SET_OFF = 0.5

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
  /** a small free-roaming animal's own distances in place of MARGIN, SPACING and WALK_MIN/MAX (m) */
  roam?: { margin: number; spacing: number; walk: [number, number] }
}

const roamOf = (sp: Species) => sp.roam ?? { margin: MARGIN, spacing: SPACING, walk: [WALK_MIN, WALK_MAX] as [number, number] }

export const SPECIES: Record<string, Species> = {
  giraffe: { file: 'common/giraffe.glb', size: 4.8, yaw: Math.PI / 2, walk: 1.1, turn: 0.45, rest: [6, 18], odds: { walk: 0.5, idle: 0.3 } },
  // Tripo's bison is normalised to 1 unit LONG (3 m, ~2 m at the hump) and already faces +z after the flip
  // (checked from straight ahead of its heading, 2026-11-20); its "browse" clip is grazing, head to the grass
  // (tools/animals/bison-clips.py)
  bison: { file: 'common/bison.glb', size: 3.0, yaw: 0, walk: 1.0, turn: 0.4, rest: [8, 20], odds: { walk: 0.35, idle: 0.25 } },
  // Tripo's peacock, fan up in display, 0.887 units tall: 1.5 m to the fan's top, the head at ~0.75 m. Faces −y in
  // Blender like the bison, so yaw 0. "browse" is pecking at the grass
  peacock: {
    file: 'common/peacock.glb', size: 1.7, yaw: 0, walk: 0.45, turn: 1.2, rest: [4, 12], odds: { walk: 0.45, idle: 0.3 },
    roam: { margin: 1.5, spacing: 2.5, walk: [4, 18] },
  },
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

/** Parc de Bagatelle: the open lawn east of the château (OSM landuse=grass, 10 800 m², simplified to 1.5 m) */
const BAGATELLE_CHATEAU_LAWN: [number, number][] = [
  [48.871682, 2.247532], [48.871455, 2.24764], [48.871334, 2.24773], [48.871306, 2.2478], [48.871451, 2.248472],
  [48.871451, 2.248815], [48.871653, 2.248663], [48.871792, 2.248949], [48.871761, 2.249213], [48.871667, 2.249328],
  [48.871658, 2.24945], [48.87186, 2.249438], [48.872024, 2.249372], [48.87215, 2.249278], [48.872299, 2.249115],
  [48.87239, 2.248949], [48.872463, 2.248699], [48.872416, 2.248701], [48.872358, 2.248643], [48.872381, 2.248469],
  [48.872425, 2.248393], [48.872392, 2.248265], [48.872328, 2.248273], [48.872265, 2.248131], [48.872125, 2.248126],
  [48.87218, 2.247933], [48.872173, 2.247892], [48.872123, 2.247882], [48.872077, 2.24797], [48.872026, 2.247954],
  [48.872005, 2.247833], [48.872024, 2.247719], [48.871778, 2.247559],
]
/** Parc de Bagatelle: the lawn beyond it to the east (OSM landuse=grass, 7 400 m²) */
const BAGATELLE_EAST_LAWN: [number, number][] = [
  [48.872308, 2.249155], [48.872271, 2.249185], [48.872295, 2.24926], [48.872268, 2.249382], [48.872232, 2.24938],
  [48.872221, 2.249252], [48.871962, 2.249429], [48.871842, 2.249471], [48.871583, 2.249476], [48.871604, 2.24989],
  [48.871782, 2.250464], [48.871896, 2.250387], [48.872007, 2.25066], [48.872116, 2.250717], [48.872158, 2.250548],
  [48.872354, 2.250414], [48.872358, 2.250271], [48.872427, 2.250014], [48.872413, 2.249748], [48.872428, 2.249708],
  [48.87253, 2.249728], [48.872578, 2.249456], [48.872501, 2.249394], [48.872464, 2.249448], [48.872418, 2.249349],
  [48.872457, 2.249217], [48.872425, 2.249173], [48.872365, 2.249209],
]
/** Parc de Bagatelle: the Roseraie (OSM leisure=garden "Roseraie de Bagatelle", 10 700 m²), where the peacocks
 * are best known */
const BAGATELLE_ROSERAIE: [number, number][] = [
  [48.867146, 2.243211], [48.867121, 2.243378], [48.867038, 2.243404], [48.866729, 2.24395], [48.866752, 2.244143],
  [48.866857, 2.244285], [48.867091, 2.244818], [48.867392, 2.244975], [48.867503, 2.245095], [48.867671, 2.244902],
  [48.867838, 2.244617], [48.867842, 2.244562], [48.86786, 2.244563], [48.867824, 2.244293], [48.867785, 2.244177],
  [48.867604, 2.243829], [48.867693, 2.243756], [48.867815, 2.243724], [48.867437, 2.243379],
]

export const HERDS: Herd[] = [
  { name: 'vincennes-giraffes', species: 'giraffe', paddock: GIRAFFE_PLAIN, sizes: [1, 1.04, 0.96, 1, 0.7], fence: true },
  { name: 'menagerie-giraffes', species: 'giraffe', paddock: MENAGERIE_PADDOCK, sizes: [1, 0.95, 0.72], fence: true },
  // the real herd is about ten; two calves
  { name: 'ggp-bison', species: 'bison', paddock: GGP_BISON_PADDOCK, sizes: [1, 1.06, 0.95, 1, 1.1, 0.92, 1.02, 0.62, 0.58], fence: true },
  // free-roaming, no fence
  { name: 'bagatelle-chateau-peacocks', species: 'peacock', paddock: BAGATELLE_CHATEAU_LAWN, sizes: [1, 0.96, 1.04] },
  { name: 'bagatelle-east-peacocks', species: 'peacock', paddock: BAGATELLE_EAST_LAWN, sizes: [1, 0.95] },
  { name: 'bagatelle-roseraie-peacocks', species: 'peacock', paddock: BAGATELLE_ROSERAIE, sizes: [1.02, 0.97, 1, 0.94] },
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

/** well inside the paddock: inside it and `margin` from every edge */
const roomy = (p: Point, poly: Point[], margin = MARGIN): boolean => inside(p, poly) && edgeDist(p, poly) > margin

/**
 * The whole straight walk from `a` to `b` stays well inside: a paddock can be concave (the giraffe plain wraps
 * round a wood), and a target that is roomy itself can still lie across a corner — the animal walked its head
 * through the fence before it noticed (owner, 2026-11-20).
 */
function clearPath(a: Point, b: Point, poly: Point[], margin = MARGIN): boolean {
  const n = Math.ceil(distance(a, b))
  for (let i = 1; i <= n; i++) {
    const p = { x: a.x + ((b.x - a.x) * i) / n, z: a.z + ((b.z - a.z) * i) / n }
    if (!inside(p, poly) || edgeDist(p, poly) < margin - 0.5) return false
  }
  return true
}

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
    const { margin, spacing, walk } = roamOf(SPECIES[pen.herd.species])
    for (let k = 0; k < 300; k++) {
      const p = { x: minX + pen.rand() * (maxX - minX), z: minZ + pen.rand() * (maxZ - minZ) }
      if (!roomy(p, pen.poly, margin)) continue
      if (from) { const d = distance(p, from); if (d < walk[0] || d > walk[1] || !clearPath(from, p, pen.poly, margin)) continue }
      if (pen.beasts.some((b) => distance(b.target ?? b.at, p) < spacing)) continue
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
      // turn on the spot (stepping round slowly) until nearly facing the target, then walk, easing off in turns
      let speed = Math.abs(turn) > SET_OFF ? 0 : pace * Math.cos(turn)
      // another animal just ahead: wait for it rather than walk into it
      const { margin, spacing } = roamOf(sp)
      const reach = (spacing * 2) / 3
      const ahead = { x: b.at.x + Math.sin(b.heading) * reach, z: b.at.z + Math.cos(b.heading) * reach }
      if (pen.beasts.some((o) => o !== b && distance(o.at, ahead) < spacing / 2)) speed = 0
      const nx = b.at.x + Math.sin(b.heading) * speed * dt
      const nz = b.at.z + Math.cos(b.heading) * speed * dt
      if (Math.hypot(dx, dz) < 1.5 || !roomy({ x: nx, z: nz }, pen.poly, margin) && speed > 0) {
        b.target = undefined
        this.play(b, 'idle')
        b.until = this.time + 2 + pen.rand() * 4
      } else {
        b.at = { x: nx, z: nz }
      }
      const g = b.clips.walk
      if (g) g.speedRatio = speed > 0 ? Math.max(0.3, speed / pace) : 0.35
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
    /*
     * Babylon's animation clock does not start while the scene has pending data (scene._animate waits for
     * _pendingData to empty before setting _animationTimeLast), and a streaming city always has something pending:
     * every clip started but none ever advanced (2026-11-20). Give the clock its start.
     */
    const sc = this.scene as unknown as { _animationTimeLast?: number }
    if (!sc._animationTimeLast) sc._animationTimeLast = performance.now()
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
