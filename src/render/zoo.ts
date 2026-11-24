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
 * Paris also has its swans on four lakes, Canada geese on the banks of eight more, and rabbits at the Invalides and
 * in the woods (PARIS_BIRDS); a swan keeps to the water and a rabbit to dry land (`habitat`).
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
/** a big cat's or a bear's fence ('mesh'): steel posts this far apart and this tall, a top rail, a see-through mesh */
const MESH_EVERY = 3
const MESH_H = 3.6
const STEEL = new Color3(0.2, 0.22, 0.2)
const MESH_ALPHA = 0.28
/** an enclosure's dressing (`Herd.dress`): the rock library's boulders this tall (m), the plant library's shrubs
 *  this tall; none nearer the fence than EDGE, nor each other than GAP. A boulder's footprint is FOOT × its height */
const ROCK_H: [number, number] = [1.3, 3.0]
const SHRUB_H: [number, number] = [0.9, 2.2]
const ROCK_FOOT = 0.85
/** a boulder is bedded this much of its height into the ground (on the paddock's raw ground, as the fence is) */
const ROCK_BED = 0.2
const DRESS_EDGE = 1.5
const DRESS_GAP = 0.6
/** an animal keeps this far out of a rock's footprint (m) */
const ROCK_CLEAR = 0.5
/** Babylon's glTF loader keys every clip at 60 frames a second, whatever rate it was authored at */
const CLIP_FPS = 60
/** a walk turns on the spot until it is within this of its heading (rad), then sets off */
const SET_OFF = 0.5
/** how fast a wading animal settles into the water or rises out of it (m/s): the ground under a lake is up to a metre
 *  off its drawn surface, so a goose stepping off the bank drops that too */
const WADE = 0.8

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
  /** where in the pen it may stand: only in drawn water (a swan) or only out of it (a rabbit); else anywhere */
  habitat?: 'water' | 'land'
}

const roamOf = (sp: Species) => sp.roam ?? { margin: MARGIN, spacing: SPACING, walk: [WALK_MIN, WALK_MAX] as [number, number] }

export const SPECIES: Record<string, Species> = {
  giraffe: { file: 'common/giraffe.glb', size: 4.8, yaw: Math.PI / 2, walk: 1.1, turn: 0.45, rest: [6, 18], odds: { walk: 0.5, idle: 0.3 } },
  // Tripo's bison is normalised to 1 unit LONG (3 m, ~2 m at the hump) and already faces +z after the flip
  // (checked from straight ahead of its heading, 2026-11-20); its "browse" clip is grazing, head to the grass
  // (tools/animals/bison-clips.py)
  bison: { file: 'common/bison.glb', size: 3.0, yaw: 0, walk: 1.0, turn: 0.4, rest: [8, 20], odds: { walk: 0.35, idle: 0.25 } },
  // Tripo's elephant, 0.659 units to the shoulder, 4.75 m to the unit: ~3.1 m at the shoulder, 4.7 m nose to tail. Faces
  // −y in Blender like the bison, so yaw 0. A slow walk; "browse" is the trunk reaching for the grass and curling to
  // the mouth (tools/animals/elephant-clips.py)
  elephant: {
    file: 'common/elephant.glb', size: 4.75, yaw: 0, walk: 0.4, turn: 0.35, rest: [8, 22], odds: { walk: 0.35, idle: 0.3 },
    roam: { margin: 3.5, spacing: 7, walk: [6, 22] },
  },
  // big cats and bears (PLACEHOLDER numbers for the lion, tools/animals/lion-clips.py sets the real ones): Tripo models,
  // their own rigs thrown away. Lions lie about most of the day
  // Tripo's lion, 0.45 to the shoulder (0.58 to the top of the mane), 0.98 nose to rump: 2.75 m to the unit makes a male
  // 1.25 m at the shoulder and 2.7 m long. Faces −y like the elephant, so yaw 0; the walk is an unhurried 0.72 m/s. Idle
  // is standing and looking round (a lie-down would tear the mesh), browse is nose to the ground (tools/animals/lion-clips.py)
  lion: {
    file: 'common/lion.glb', size: 2.75, yaw: 0, walk: 0.72, turn: 0.6, rest: [12, 40], odds: { walk: 0.25, idle: 0.35 },
    roam: { margin: 3, spacing: 4, walk: [6, 25] },
  },
  // Tripo's grizzly, 1.0 unit nose to tail and 0.53 to the hump, 2.1 m to the unit: ~2.1 m long, 1.1 m at the shoulder.
  // Faces −y in Blender like the bison, so yaw 0. A rolling, pigeon-toed amble; "browse" is nosing and scraping the dirt
  // (tools/animals/bear-clips.py)
  // Tripo's red deer stag, 0.55 to the withers and 0.98 nose to rump (0.98 to the antler tips): 2.25 m to the unit makes
  // ~1.25 m at the shoulder and 2.2 m long. Faces −y like the lion, so yaw 0; a deliberate four-beat walk at 0.7 m/s,
  // stride matched in tools/animals/deer-clips.py (idle: alert, looking round; browse: grazing). Wild in the woods west
  // of Paris, a few together, free-roaming (no fence)
  deer: {
    file: 'common/deer.glb', size: 2.25, yaw: 0, walk: 0.7, turn: 0.6, rest: [8, 25], odds: { walk: 0.3, idle: 0.3 },
    roam: { margin: 3, spacing: 4, walk: [6, 25] }, habitat: 'land',
  },
  // Tripo's doe, rigged by tools/animals/doe-clips.py: ~1.1 m at the shoulder (0.47 units), ~2.0 m long; faces −y like the stag
  doe: {
    file: 'common/doe.glb', size: 2.2, yaw: 0, walk: 0.7, turn: 0.6, rest: [8, 25], odds: { walk: 0.3, idle: 0.3 },
    roam: { margin: 3, spacing: 4, walk: [6, 25] }, habitat: 'land',
  },
  // Tripo's fawn (tools/animals/fawn-clips.py): ~0.7 m at the shoulder, ~1.1 m long, skittish; walks at the doe's speed
  // with quicker steps so it keeps up
  fawn: {
    file: 'common/fawn.glb', size: 1.05, yaw: 0, walk: 0.7, turn: 1.0, rest: [4, 14], odds: { walk: 0.35, idle: 0.3 },
    roam: { margin: 2, spacing: 3, walk: [6, 25] }, habitat: 'land',
  },
  bear: {
    file: 'common/bear.glb', size: 2.1, yaw: 0, walk: 0.65, turn: 0.6, rest: [8, 25], odds: { walk: 0.35, idle: 0.25 },
    roam: { margin: 2.5, spacing: 4, walk: [5, 20] },
  },
  // Tripo's peacock, fan up in display, 0.887 units tall: 1.5 m to the fan's top, the head at ~0.75 m. Faces −y in
  // Blender like the bison, so yaw 0. "browse" is pecking at the grass
  peacock: {
    file: 'common/peacock.glb', size: 1.7, yaw: 0, walk: 0.45, turn: 1.2, rest: [4, 12], odds: { walk: 0.45, idle: 0.3 },
    roam: { margin: 1.5, spacing: 2.5, walk: [4, 18] },
  },
  // Tripo's flamingo, 0.979 units tall (1.27 m), one leg cut off so it stands on the other, the way flamingos do
  // (tools/animals/flamingo-clips.py). Faces +x like the giraffe. It never walks; "browse" is a shallow feeding dip
  flamingo: {
    file: 'common/flamingo.glb', size: 1.3, yaw: Math.PI / 2, walk: 0.3, turn: 0.5, rest: [10, 30], odds: { walk: 0, idle: 0.65 },
    roam: { margin: 0.4, spacing: 1.1, walk: [2, 6] },
  },
  // Paris's park birds and rabbits: Tripo models with no rig, rigged and animated by tools/animals/{swan,goose,
  // rabbit}-clips.py. All face −y in Blender like the peacock, so yaw 0. The mute swan's legs are cut off: it only
  // swims, "walk" is a glide and "browse" a head-dip into the water
  swan: {
    file: 'common/swan.glb', size: 1.4, yaw: 0, walk: 0.35, turn: 0.35, rest: [8, 25], odds: { walk: 0.5, idle: 0.3 },
    roam: { margin: 3, spacing: 3, walk: [5, 25] }, habitat: 'water',
  },
  // Canada goose: waddles on the bank, grazes, and swims when its walk takes it into the water (its herd's `sink`)
  goose: {
    file: 'common/goose.glb', size: 0.95, yaw: 0, walk: 0.4, turn: 1.0, rest: [5, 15], odds: { walk: 0.35, idle: 0.25 },
    roam: { margin: 1.5, spacing: 1.6, walk: [3, 12] },
  },
  // European rabbit: sits, nibbles, hops a few metres; "walk" is one hop, played at its pace
  rabbit: {
    file: 'common/rabbit.glb', size: 0.42, walk: 0.8, yaw: 0, turn: 3, rest: [4, 14], odds: { walk: 0.3, idle: 0.4 },
    roam: { margin: 1, spacing: 1.5, walk: [1.5, 6] }, habitat: 'land',
  },
}

export interface Herd {
  name: string
  species: keyof typeof SPECIES
  /** the paddock, [lat, lon] round its edge */
  paddock: [number, number][]
  /** each animal's size relative to the species' (a young one is smaller) */
  sizes: number[]
  /** true: post-and-rail; 'mesh': a big cat's tall steel mesh */
  fence?: boolean | 'mesh'
  /** boulders and shrubs scattered in the paddock, drawn by render/plants.ts (`rock:<species>` from the rock library,
   *  the rest from the plant library), picked in turn from the kinds given; the animals walk round the boulders */
  dress?: { rocks: number; shrubs: number; rockKinds: string[]; shrubKinds: string[] }
  /** how far the animals stand below the ground (m): waders in a pond, the water up their shins */
  sink?: number
  /** this herd's own `habitat`, over the species' (flamingos in a pond keep to its water) */
  habitat?: 'water' | 'land'
}

/**
 * Ménagerie du Jardin des Plantes, the flamingo enclosure: OSM has only the flock's point (48.845133, 2.358579) and
 * a 24 m² basin 15 m east; the pink patch on the IGN aerial (2026-11-20) lies between, under the trees. Drawn round both.
 */
const MENAGERIE_FLAMINGOS: [number, number][] = [
  [48.84518, 2.35856], [48.845185, 2.3588], [48.84511, 2.35883], [48.84505, 2.35881], [48.84505, 2.3587], [48.8451, 2.35856],
]
/**
 * Parc zoologique de Paris: OSM's greater flamingos (48.833504, 2.418741) are inside the Grande Volière, which the
 * rider cannot enter; they stand instead in the open pond 33 m south of it (OSM natural=water, 1740 m², 6 m from a
 * walkway). Kept to its water, so a patch a little over the pond is fine.
 */
/** the pond is some 45 m by 40 */
const FLAMINGO_R = 20
const VINCENNES_FLAMINGO_POND = patch(48.833203, 2.418643, FLAMINGO_R)
/** how deep the flamingos stand in the ponds (m) */
const FLAMINGO_SINK = 0.15

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

/** a round patch of radius `r` metres as a paddock: a free-roaming herd's ground in a park or a wood */
function patch(lat: number, lon: number, r: number, sides = 12): [number, number][] {
  const dlat = r / 111_320
  const dlon = r / (111_320 * Math.cos((lat * Math.PI) / 180))
  return Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2
    return [lat + dlat * Math.sin(a), lon + dlon * Math.cos(a)] as [number, number]
  })
}
/** `n` animals, each a little bigger or smaller than the species' size */
const flock = (n: number, spread = 0.06): number[] => Array.from({ length: n }, (_, i) => 1 + spread * Math.sin(i * 2.4 + 0.7))

/** how deep a swimming bird sits (m): the swan's waterline on its breast, the goose's halfway up its flank */
const SWAN_SINK = 0.28
const GOOSE_SINK = 0.24
/** the patches' radii (m): a swan's stretch of lake, a goose flock's bank, a rabbit warren in the grass */
const SWAN_R = 45
const GOOSE_R = 30
const RABBIT_R = 15
/** a peacock cluster's patch of park (m) */
const PEACOCK_R = 18
/** the Esplanade's lawn strips are some 22 m across */
const INVALIDES_R = 10
/** a deer group's ground (m): wide, a few together under the trees */
const DEER_R = 30

/**
 * Paris's swans, geese and rabbits. Each patch is centred on a point picked from the baked package (2026-11-20):
 * a lake's edge within 12 m of a footpath or cycleway (swans and geese), or 8 m off a path in a wood, 60 m and more
 * from any road (rabbits). The swans keep to the patch's water, the rabbits to its land, the geese go where they like.
 */
const PARIS_BIRDS: Herd[] = [
  // mute swans on four of the lakes that have them: the Bois de Boulogne's Lac Inférieur, the Bois de Vincennes's Lac
  // Daumesnil, Versailles's Grand Canal, the Buttes-Chaumont
  { name: 'lac-inferieur-swans-s', species: 'swan', paddock: patch(48.86207, 2.260829, SWAN_R), sizes: flock(3), sink: SWAN_SINK },
  { name: 'lac-inferieur-swans-n', species: 'swan', paddock: patch(48.864694, 2.259314, SWAN_R), sizes: flock(2), sink: SWAN_SINK },
  { name: 'daumesnil-swans-s', species: 'swan', paddock: patch(48.828708, 2.416609, SWAN_R), sizes: flock(3), sink: SWAN_SINK },
  { name: 'daumesnil-swans-n', species: 'swan', paddock: patch(48.831742, 2.414509, SWAN_R), sizes: flock(2), sink: SWAN_SINK },
  { name: 'grand-canal-swans', species: 'swan', paddock: patch(48.814104, 2.102504, SWAN_R), sizes: flock(4), sink: SWAN_SINK },
  { name: 'buttes-chaumont-swans', species: 'swan', paddock: patch(48.88029, 2.383014, SWAN_R), sizes: flock(2), sink: SWAN_SINK },
  // Canada geese on the banks (and in the water) of the smaller lakes and ponds
  { name: 'lac-superieur-geese', species: 'goose', paddock: patch(48.85821, 2.258153, GOOSE_R), sizes: flock(6), sink: GOOSE_SINK },
  { name: 'minimes-geese-s', species: 'goose', paddock: patch(48.835721, 2.456056, GOOSE_R), sizes: flock(5), sink: GOOSE_SINK },
  { name: 'minimes-geese-n', species: 'goose', paddock: patch(48.838623, 2.459651, GOOSE_R), sizes: flock(4), sink: GOOSE_SINK },
  { name: 'montsouris-geese', species: 'goose', paddock: patch(48.823278, 2.33863, GOOSE_R), sizes: flock(5), sink: GOOSE_SINK },
  { name: 'saint-mande-geese', species: 'goose', paddock: patch(48.842164, 2.423239, GOOSE_R), sizes: flock(4), sink: GOOSE_SINK },
  { name: 'corot-geese', species: 'goose', paddock: patch(48.820042, 2.181233, GOOSE_R), sizes: flock(5), sink: GOOSE_SINK },
  { name: 'suisses-geese', species: 'goose', paddock: patch(48.795088, 2.114334, GOOSE_R), sizes: flock(6), sink: GOOSE_SINK },
  { name: 'mare-saint-james-geese', species: 'goose', paddock: patch(48.876362, 2.2604, GOOSE_R), sizes: flock(4), sink: GOOSE_SINK },
  // rabbits: the famous warren on the Esplanade des Invalides' lawns (centred on the lawns as drawn, which are wider
  // than the package's grass; the gardens by the Hôtel draw as gravel), and a few in each of the woods
  { name: 'invalides-rabbits-w', species: 'rabbit', paddock: patch(48.8605, 2.3126, INVALIDES_R), sizes: flock(5, 0.1) },
  { name: 'invalides-rabbits-e', species: 'rabbit', paddock: patch(48.86048, 2.31351, INVALIDES_R), sizes: flock(5, 0.1) },
  { name: 'invalides-rabbits-s', species: 'rabbit', paddock: patch(48.8595, 2.3127, INVALIDES_R), sizes: flock(4, 0.1) },
  { name: 'boulogne-rabbits-1', species: 'rabbit', paddock: patch(48.867346, 2.245028, RABBIT_R), sizes: flock(4, 0.1) },
  { name: 'boulogne-rabbits-2', species: 'rabbit', paddock: patch(48.860977, 2.250094, RABBIT_R), sizes: flock(4, 0.1) },
  { name: 'boulogne-rabbits-3', species: 'rabbit', paddock: patch(48.854585, 2.239468, RABBIT_R), sizes: flock(4, 0.1) },
  { name: 'vincennes-rabbits-1', species: 'rabbit', paddock: patch(48.828089, 2.427662, RABBIT_R), sizes: flock(4, 0.1) },
  { name: 'vincennes-rabbits-2', species: 'rabbit', paddock: patch(48.825054, 2.437932, RABBIT_R), sizes: flock(4, 0.1) },
  { name: 'vincennes-rabbits-3', species: 'rabbit', paddock: patch(48.828878, 2.446872, RABBIT_R), sizes: flock(4, 0.1) },
  { name: 'saint-cloud-rabbits-1', species: 'rabbit', paddock: patch(48.83313, 2.203878, RABBIT_R), sizes: flock(4, 0.1) },
  { name: 'saint-cloud-rabbits-2', species: 'rabbit', paddock: patch(48.832405, 2.212258, RABBIT_R), sizes: flock(4, 0.1) },
  { name: 'meudon-rabbits', species: 'rabbit', paddock: patch(48.80428, 2.21342, RABBIT_R), sizes: flock(4, 0.1) },
  // red deer in the woods west of Paris where they live wild (not the Bois de Boulogne or Vincennes, which have none):
  // spots from tools/animals/pick-sites.ts forest (2026-11-20: off a path, 60 m and more from a road). One stag model,
  // so every one has antlers
  { name: 'meudon-deer', species: 'deer', paddock: patch(48.802856, 2.214149, DEER_R), sizes: flock(3, 0.08) },
  { name: 'saint-cloud-deer', species: 'deer', paddock: patch(48.831657, 2.189005, DEER_R), sizes: flock(2, 0.08) },
  { name: 'fausses-reposes-deer-1', species: 'deer', paddock: patch(48.823199, 2.173146, DEER_R), sizes: flock(3, 0.08) },
  { name: 'fausses-reposes-deer-2', species: 'deer', paddock: patch(48.826766, 2.166269, DEER_R), sizes: flock(2, 0.08) },
  // …and with them hinds and their fawns, on the same ground (a fawn keeps near: same spot, its own herd)
  { name: 'meudon-does', species: 'doe', paddock: patch(48.802856, 2.214149, DEER_R), sizes: flock(3, 0.06) },
  { name: 'meudon-fawns', species: 'fawn', paddock: patch(48.802856, 2.214149, DEER_R), sizes: [1] },
  { name: 'saint-cloud-does', species: 'doe', paddock: patch(48.831657, 2.189005, DEER_R), sizes: flock(2, 0.06) },
  { name: 'saint-cloud-fawns', species: 'fawn', paddock: patch(48.831657, 2.189005, DEER_R), sizes: [1] },
  { name: 'fausses-reposes-does-1', species: 'doe', paddock: patch(48.823199, 2.173146, DEER_R), sizes: flock(3, 0.06) },
  { name: 'fausses-reposes-fawns-1', species: 'fawn', paddock: patch(48.823199, 2.173146, DEER_R), sizes: [1, 0.9] },
  { name: 'fausses-reposes-does-2', species: 'doe', paddock: patch(48.826766, 2.166269, DEER_R), sizes: flock(2, 0.06) },
  { name: 'fausses-reposes-fawns-2', species: 'fawn', paddock: patch(48.826766, 2.166269, DEER_R), sizes: [1] },
]

/** Parc zoologique de Paris: the OSM sand polygon south of the giraffe plain (natural=sand, 2 980 m², simplified to 1.5 m) */
const ELEPHANT_SAND: [number, number][] = [
  [48.831710, 2.417996], [48.831597, 2.418147], [48.831270, 2.418456], [48.831180, 2.418640],
  [48.831207, 2.418830], [48.831192, 2.418964], [48.831296, 2.419280], [48.831373, 2.419249],
  [48.831381, 2.419165], [48.831361, 2.419133], [48.831447, 2.418984], [48.831500, 2.419010],
  [48.831514, 2.418974], [48.831586, 2.418941], [48.831613, 2.418874], [48.831605, 2.418717],
  [48.831658, 2.418671], [48.831694, 2.418404], [48.831722, 2.418347], [48.831696, 2.418281],
  [48.831734, 2.418190],
]

/** Ménagerie du Jardin des Plantes: the fenced paddock (OSM barrier=fence, 1 955 m²) south of the giraffes' one */
const MENAGERIE_ELEPHANT_PADDOCK: [number, number][] = [
  [48.845253, 2.361479], [48.845206, 2.361495], [48.845094, 2.361635], [48.845073, 2.361682],
  [48.845080, 2.361771], [48.845145, 2.362154], [48.845215, 2.362188], [48.845240, 2.362256],
  [48.845259, 2.362460], [48.845372, 2.362805], [48.845514, 2.362570], [48.845285, 2.361778],
  [48.845275, 2.361554],
]

/** Parc zoologique de Paris, the lions (OSM attraction=animal node 2845192380): OSM has no enclosure, only its rock
 *  outcrops and scrub; drawn along the visitors' fence (OSM barrier=fence, west and north) to the lion house's wall */
const VINCENNES_LION_YARD: [number, number][] = [
  [48.831307, 2.419846], [48.831307, 2.419764], [48.831307, 2.419696], [48.831271, 2.419668], [48.831271, 2.4196],
  [48.831208, 2.41945], [48.831154, 2.4193], [48.831064, 2.419218], [48.83101, 2.419232], [48.830974, 2.419313],
  [48.830929, 2.419436], [48.830947, 2.419491], [48.830831, 2.419682], [48.830831, 2.419832],
]
/** San Francisco Zoo: "Lions & Tiger Yards" (OSM natural=grassland, 2 670 m²) beside the Lion House */
const SFZOO_LION_YARDS: [number, number][] = [
  [37.732189, -122.501945], [37.732009, -122.50188], [37.73204, -122.501744], [37.73208, -122.501565],
  [37.732137, -122.501317], [37.732089, -122.501298], [37.732015, -122.50125], [37.731967, -122.501175],
  [37.731907, -122.501153], [37.731838, -122.501456], [37.731773, -122.50174], [37.731747, -122.501875],
  [37.731755, -122.501959], [37.731788, -122.502037], [37.731846, -122.502101], [37.731882, -122.502123],
  [37.732127, -122.502212],
]
/** San Francisco Zoo: Grizzly Gulch (OSM natural=grassland, 2 510 m², a pool in it), home of two grizzly sisters */
const SFZOO_GRIZZLY_GULCH: [number, number][] = [
  [37.732637, -122.498875], [37.732574, -122.498814], [37.732499, -122.498813], [37.732433, -122.498718],
  [37.732521, -122.498575], [37.732536, -122.498485], [37.732829, -122.49839], [37.732971, -122.498517],
  [37.733052, -122.498601], [37.73304, -122.498635], [37.733111, -122.498708], [37.733315, -122.498871],
  [37.733188, -122.499073], [37.73307, -122.498964], [37.733035, -122.498892], [37.733044, -122.498808],
  [37.732976, -122.498747], [37.732924, -122.498779], [37.732914, -122.498807], [37.732734, -122.49881],
  [37.732684, -122.498839],
]

export const HERDS: Herd[] = [
  { name: 'vincennes-giraffes', species: 'giraffe', paddock: GIRAFFE_PLAIN, sizes: [1, 1.04, 0.96, 1, 0.7], fence: true },
  { name: 'menagerie-giraffes', species: 'giraffe', paddock: MENAGERIE_PADDOCK, sizes: [1, 0.95, 0.72], fence: true },
  { name: 'vincennes-elephants', species: 'elephant', paddock: ELEPHANT_SAND, sizes: [1, 1.05, 0.95, 0.55], fence: true },
  { name: 'menagerie-elephants', species: 'elephant', paddock: MENAGERIE_ELEPHANT_PADDOCK, sizes: [1, 0.96, 0.55], fence: true },
  // a pride each: the male and his lionesses (the model has a mane; the lionesses are only smaller); the two grizzlies
  { name: 'vincennes-lions', species: 'lion', paddock: VINCENNES_LION_YARD, sizes: [1, 0.88, 0.86, 0.9], fence: 'mesh',
    dress: { rocks: 8, shrubs: 10, rockKinds: ['rock:cracked', 'rock:grey-group', 'rock:lichen'], shrubKinds: ['bush_green', 'deer_grass', 'hazel', 'bush_green'] } },
  { name: 'sfzoo-lions', species: 'lion', paddock: SFZOO_LION_YARDS, sizes: [1, 0.87, 0.9], fence: 'mesh',
    dress: { rocks: 9, shrubs: 14, rockKinds: ['rock:grey', 'rock:cracked', 'rock:grey-group'], shrubKinds: ['bush_green', 'deer_grass', 'hazel', 'bush_green'] } },
  { name: 'sfzoo-grizzlies', species: 'bear', paddock: SFZOO_GRIZZLY_GULCH, sizes: [1, 0.95], fence: 'mesh',
    dress: { rocks: 10, shrubs: 14, rockKinds: ['rock:mossy', 'rock:grey', 'rock:mossy-group'], shrubKinds: ['hazel', 'fern', 'rhododendron', 'bush_green'] } },
  // the real herd is about ten; two calves
  { name: 'ggp-bison', species: 'bison', paddock: GGP_BISON_PADDOCK, sizes: [1, 1.06, 0.95, 1, 1.1, 0.92, 1.02, 0.62, 0.58], fence: true },
  // free-roaming, no fence
  { name: 'bagatelle-chateau-peacocks', species: 'peacock', paddock: BAGATELLE_CHATEAU_LAWN, sizes: [1, 0.96, 1.04] },
  { name: 'bagatelle-east-peacocks', species: 'peacock', paddock: BAGATELLE_EAST_LAWN, sizes: [1, 0.95] },
  { name: 'bagatelle-roseraie-peacocks', species: 'peacock', paddock: BAGATELLE_ROSERAIE, sizes: [1.02, 0.97, 1, 0.94] },
  // and where else Paris's peacocks roam free, a cluster or two in each park (spots from tools/animals/pick-sites.ts park,
  // 2026-11-20: off a path, away from roads), so a rider through the park has a fair chance of passing one
  { name: 'acclimatation-peacocks-1', species: 'peacock', paddock: patch(48.877796, 2.264172, PEACOCK_R), sizes: flock(7) },
  { name: 'acclimatation-peacocks-2', species: 'peacock', paddock: patch(48.877773, 2.265269, PEACOCK_R), sizes: flock(5) },
  { name: 'parc-floral-peacocks-1', species: 'peacock', paddock: patch(48.839336, 2.445215, PEACOCK_R), sizes: flock(8) },
  { name: 'parc-floral-peacocks-2', species: 'peacock', paddock: patch(48.839851, 2.440947, PEACOCK_R), sizes: flock(6) },
  { name: 'jardin-des-plantes-peacocks', species: 'peacock', paddock: patch(48.843869, 2.359289, PEACOCK_R), sizes: flock(6) },
  // flamingos (OSM attraction=animal): the Caribbean flamingos of the Ménagerie, the greater flamingos of Vincennes
  { name: 'menagerie-flamingos', species: 'flamingo', paddock: MENAGERIE_FLAMINGOS, sizes: [1, 0.95, 1.04, 0.97, 1, 0.92, 1.02] },
  {
    name: 'vincennes-flamingos', species: 'flamingo', paddock: VINCENNES_FLAMINGO_POND,
    sizes: [1, 0.96, 1.03, 0.94, 1, 0.98, 1.05, 0.95, 1.02, 0.97, 1, 0.93], sink: FLAMINGO_SINK, habitat: 'water',
  },
  ...PARIS_BIRDS,
]

type Clip = 'idle' | 'browse' | 'walk'

/** one boulder or shrub, as render/plants.ts `addPlants` takes it */
type Planted = { x: number; z: number; species: string; h: number; spin: number; dy?: number; raw?: boolean }

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
  /** how far under the ground it stands now (m): in water, down to the drawn surface less the herd's `sink`; eased
   *  as a goose wades in, so it does not drop in a frame */
  sink: number
}

interface Pen {
  herd: Herd
  poly: Point[]
  centre: Point
  beasts: Beast[]
  state: 'far' | 'loading' | 'ready'
  rand: () => number
  /** the dressing's rocks: centre and footprint radius (m) */
  rocks: { x: number; z: number; r: number }[]
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
  /** is this point in water the game draws: a herd's `sink` applies only there (a pond too small to draw is lawn) */
  private readonly wet: (x: number, z: number) => boolean
  /** the drawn water's surface at a point (render/city.ts waterLevelAt), or null where its tile is not in */
  private readonly surface: (x: number, z: number) => number | null
  private readonly pens: Pen[]
  private readonly containers = new Map<string, Promise<AssetContainer>>()
  private time = 0
  /** where the dressing's boulders and shrubs go: game.ts sets it to the plants' `addPlants` once it has them */
  private plantSink: ((list: Planted[]) => void) | null = null
  private planting: Planted[] = []
  set plant(f: (list: Planted[]) => void) { this.plantSink = f; if (this.planting.length) f(this.planting.splice(0)) }

  constructor(scene: Scene, origin: { lat: number; lon: number }, terrain: Terrain, base: string, herds: Herd[] = HERDS,
    wet: (x: number, z: number) => boolean = () => false, surface: (x: number, z: number) => number | null = () => null) {
    this.wet = wet
    this.surface = surface
    this.scene = scene
    this.terrain = terrain
    this.base = base
    const proj = new Projection(origin)
    this.pens = herds.map((herd, i) => {
      const poly = herd.paddock.map(([lat, lon]) => proj.toLocal({ lat, lon }))
      const centre = { x: poly.reduce((s, p) => s + p.x, 0) / poly.length, z: poly.reduce((s, p) => s + p.z, 0) / poly.length }
      return { herd, poly, centre, beasts: [], rocks: [], state: 'far' as const, rand: mulberry(0x9e3779b9 ^ (i * 7919)) }
    })
    ;(window as unknown as { __zoo?: Zoo }).__zoo = this
  }

  /** where each animal is and what it is doing (dev: the shot tools look at them) */
  get animals(): { herd: string; at: Point; heading: number; clip: Clip; wet: boolean }[] {
    return this.pens.flatMap((p) => p.beasts.map((b) => ({ herd: p.herd.name, at: b.at, heading: b.heading, clip: b.clip, wet: this.wet(b.at.x, b.at.z) })))
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
      if (!roomy(p, pen.poly, margin) || !this.fits(pen, p) || pen.rocks.some((r) => distance(r, p) < r.r + ROCK_CLEAR)) continue
      if (from) { const d = distance(p, from); if (d < walk[0] || d > walk[1] || !clearPath(from, p, pen.poly, margin) || !this.fitsAlong(pen, from, p) || !this.pastRocks(pen, from, p)) continue }
      if (pen.beasts.some((b) => distance(b.target ?? b.at, p) < spacing)) continue
      return p
    }
    return null
  }

  /** how far under the ground an animal of this herd stands at p: in drawn water (a herd with a `sink` only), at the
   *  water's surface less its sink — the ground under a lake is not the surface, it is a metre off either way */
  private sinkAt(pen: Pen, p: Point): number {
    if (!pen.herd.sink || !this.wet(p.x, p.z)) return 0
    const ground = this.terrain.rawHeightAt(p.x, p.z)
    return ground - (this.surface(p.x, p.z) ?? ground) + pen.herd.sink
  }
  /** the species may stand here: in water for a swan, out of it for a rabbit */
  private fits(pen: Pen, p: Point): boolean {
    const h = pen.herd.habitat ?? SPECIES[pen.herd.species].habitat
    return !h || this.wet(p.x, p.z) === (h === 'water')
  }

  /** …and all the way from `a` to `b` (checked every 2 m) */
  private fitsAlong(pen: Pen, a: Point, b: Point): boolean {
    if (!SPECIES[pen.herd.species].habitat) return true
    const n = Math.ceil(distance(a, b) / 2)
    for (let i = 1; i < n; i++) if (!this.fits(pen, { x: a.x + ((b.x - a.x) * i) / n, z: a.z + ((b.z - a.z) * i) / n })) return false
    return true
  }

  /** the straight walk from `a` to `b` keeps out of every rock */
  private pastRocks(pen: Pen, a: Point, b: Point): boolean {
    const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz || 1
    return pen.rocks.every((r) => {
      const t = Math.max(0, Math.min(1, ((r.x - a.x) * dx + (r.z - a.z) * dz) / L))
      return Math.hypot(a.x + dx * t - r.x, a.z + dz * t - r.z) > r.r + ROCK_CLEAR
    })
  }

  private async load(pen: Pen): Promise<void> {
    const sp = SPECIES[pen.herd.species]
    const c = await this.container(pen.herd.species)
    if (pen.herd.fence === 'mesh') this.meshFence(pen)
    else if (pen.herd.fence) this.fence(pen)
    if (pen.herd.dress) this.dress(pen, pen.herd.dress)
    pen.herd.sizes.forEach((size, i) => {
      // the patch's centre is on the bank: a swan (or a rabbit) with nowhere it may stand is left out
      const at = this.spot(pen) ?? (pen.herd.habitat ?? sp.habitat ? null : pen.centre)
      if (!at) return
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
      pen.beasts.push({ node, clips, clip: 'idle', fade: 1, until: this.time + sp.rest[0] * pen.rand() * 2, at, heading: pen.rand() * Math.PI * 2, size, sink: this.sinkAt(pen, at) })
    })
    pen.state = 'ready'
  }

  /** boulders and shrubs, somewhere roomy in the paddock and clear of each other, handed to the plants to draw; their
   *  own seeded generator, so the herd's moves stay as they were */
  private dress(pen: Pen, d: NonNullable<Herd['dress']>): void {
    const rand = mulberry(0x51ed27 ^ (pen.herd.name.length * 104729) ^ Math.round(pen.centre.x * 31))
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (const p of pen.poly) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z) }
    const placed: { x: number; z: number; r: number }[] = []
    const out: Planted[] = []
    const scatter = (n: number, kinds: string[], [h0, h1]: [number, number], foot: number, rock: boolean) => {
      for (let k = 0, got = 0; k < n * 40 && got < n; k++) {
        const h = h0 + (h1 - h0) * rand()
        const r = foot * h
        const p = { x: minX + rand() * (maxX - minX), z: minZ + rand() * (maxZ - minZ) }
        if (!roomy(p, pen.poly, r + DRESS_EDGE) || placed.some((q) => distance(q, p) < q.r + r + DRESS_GAP)) continue
        placed.push({ ...p, r })
        if (rock) pen.rocks.push({ ...p, r })
        out.push({ ...p, species: kinds[got++ % kinds.length], h, spin: rand() * Math.PI * 2, raw: true, dy: rock ? -ROCK_BED * h : 0 })
      }
    }
    // the boulders first: they are the bigger, and the animals walk round them
    scatter(d.rocks, d.rockKinds, ROCK_H, ROCK_FOOT, true)
    scatter(d.shrubs, d.shrubKinds, SHRUB_H, 0.4, false)
    if (this.plantSink) this.plantSink(out)
    else this.planting.push(...out)
  }

  /** a big cat's fence: tall steel posts, a top rail, and between them a see-through mesh (one ribbon, half-alpha) */
  private meshFence(pen: Pen): void {
    const posts: Vector3[] = []
    for (let i = 0; i < pen.poly.length; i++) {
      const a = pen.poly[i]
      const b = pen.poly[(i + 1) % pen.poly.length]
      const n = Math.max(1, Math.round(distance(a, b) / MESH_EVERY))
      for (let k = 0; k < n; k++) {
        const x = a.x + ((b.x - a.x) * k) / n
        const z = a.z + ((b.z - a.z) * k) / n
        posts.push(new Vector3(x, this.terrain.rawHeightAt(x, z), z))
      }
    }
    const steel = new StandardMaterial(`zoo.${pen.herd.name}.steel`, this.scene)
    steel.diffuseColor = STEEL
    steel.specularColor.set(0.1, 0.1, 0.1)
    const box = MeshBuilder.CreateBox(`zoo.${pen.herd.name}.posts`, { size: 1 }, this.scene)
    box.material = steel
    box.isPickable = false
    box.renderingGroupId = 3
    const mats: number[] = []
    const m = new Matrix()
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i], q = posts[(i + 1) % posts.length]
      Matrix.ComposeToRef(new Vector3(0.1, MESH_H, 0.1), Quaternion.Identity(), new Vector3(p.x, p.y + MESH_H / 2, p.z), m)
      mats.push(...m.asArray())
      const dx = q.x - p.x, dz = q.z - p.z, h = Math.hypot(dx, dz)
      const rot = Quaternion.RotationYawPitchRoll(Math.atan2(dx, dz), -Math.atan2(q.y - p.y, h), 0)
      Matrix.ComposeToRef(new Vector3(0.07, 0.07, Math.hypot(h, q.y - p.y)), rot, new Vector3((p.x + q.x) / 2, (p.y + q.y) / 2 + MESH_H, (p.z + q.z) / 2), m)
      mats.push(...m.asArray())
    }
    box.thinInstanceSetBuffer('matrix', new Float32Array(mats), 16, true)
    const ring = [...posts, posts[0]]
    const net = MeshBuilder.CreateRibbon(`zoo.${pen.herd.name}.mesh`, {
      pathArray: [ring.map((p) => p.clone()), ring.map((p) => p.add(new Vector3(0, MESH_H, 0)))],
      sideOrientation: 2,
    }, this.scene)
    const nm = new StandardMaterial(`zoo.${pen.herd.name}.mesh`, this.scene)
    nm.diffuseColor = STEEL
    nm.specularColor.set(0, 0, 0)
    nm.alpha = MESH_ALPHA
    nm.backFaceCulling = false
    net.material = nm
    net.isPickable = false
    net.renderingGroupId = 3
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
      if (Math.hypot(dx, dz) < 1.5 || (!roomy({ x: nx, z: nz }, pen.poly, margin) || !this.fits(pen, { x: nx, z: nz })) && speed > 0) {
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
    const sink = this.sinkAt(pen, b.at)
    b.sink += Math.max(-WADE * dt, Math.min(WADE * dt, sink - b.sink))
    b.node.position.set(b.at.x, this.terrain.rawHeightAt(b.at.x, b.at.z) - b.sink, b.at.z)
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
