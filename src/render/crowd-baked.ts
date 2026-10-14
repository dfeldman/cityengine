/**
 * Every stranger a real avatar-kit body, at every distance.
 *
 * The box stand-ins were the most jarring thing on the pavement, and handing a dozen real bodies round the
 * nearest walkers made it worse, not better: people changed from blocks into humans as the rider came
 * close. The only way to have NO stand-ins is to make a real body cheap enough to draw two hundred times.
 *
 * **Baked vertex animation** does that. A handful of low-quality kit bodies are built once, off to one side,
 * and walked through exactly one stride by the kit's own animator. The skinning matrices of every frame of
 * that stride are written into a texture. After that a body never needs its skeleton again: the vertex
 * shader reads its bones for the current frame straight out of the texture, so each variant — body,
 * clothes, hair — is drawn as thin instances, one draw call per part for the whole crowd, and each instance
 * carries its own place in the cycle, its own pace and its own colours.
 *
 * Colours. The variants are built dressed in white, with neutral hair and a mid skin tone, and each
 * instance multiplies its own in: top, bottoms, skin and hair are the walker's `look`, the same colours the
 * walker has always had. The kit's garments are authored white or grey precisely so they can take a
 * colour, so a multiply is what the kit itself does.
 */
import {
  Avatar,
  Bike,
  GeometryService,
  cloneSpec,
  normalizeSpec,
  randomSpec,
  type AvatarSpec,
} from 'avatarkit'
import { BakedVertexAnimationManager } from '@babylonjs/core/BakedVertexAnimation/bakedVertexAnimationManager'
import { VertexAnimationBaker } from '@babylonjs/core/BakedVertexAnimation/vertexAnimationBaker'
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { DAYLIGHT, OVERCAST } from './facade-material.ts'
import { PEOPLE } from './layers.ts'
import type { Scene } from '@babylonjs/core/scene'
import type { Walker } from '../sim/crowd.ts'
import { distance, type Point } from '../city/geo.ts'
import { nearLevel, type Terrain } from '../city/terrain.ts'
import { initAssets } from '../assets.ts'

/** The pace the stride is baked at; each walker's playback is scaled to their own speed from it. */
const BAKE_SPEED = 1.35
/** Frames in one baked stride. The last repeats the first, which is what makes the loop seamless. */
const FRAMES = 32
/** How far away strangers are drawn at all; they grow in over the last stretch rather than popping. */
const RANGE = 115
const GROW = 15
/** Inside this, the small parts that only show close up — eyes, brows — are drawn too. */
const NEAR = 22
/** Inside this, shoes: beyond it the feet are the skin's colour, a few pixels nobody can tell apart. */
const SHOES = 40
/** The cyclists' baked pedalling: this cadence at this speed; playback scales with each cyclist's speed. */
const CYCLE_CADENCE = 70
const CYCLE_SPEED = 4.2
/** How many of the variants are cyclists, built early so the first cyclist in the road is not a box. */
const CYCLISTS = 2
/** The skin tone the variants are built with; each walker's own is multiplied in relative to it. */
export const BASE_SKIN = [0xdc / 255, 0x9c / 255, 0x70 / 255] as const

export type Part = 'skin' | 'top' | 'bottom' | 'hair' | 'plain' | 'frame'

interface Variant {
  /** `near`: the distance a part is drawn out to (metres; Infinity for the whole crowd) */
  meshes: { mesh: Mesh; part: Part; near: number }[]
  /** one stride's worth of frames per second, at the baked pace */
  fps: number
  manager: BakedVertexAnimationManager
  /** the gait baked: walkers get walk variants, runners run variants, cyclists pedal on a kit bike */
  gait: 'walk' | 'run' | 'cycle'
  /** the pace it was baked at */
  pace: number
}

export class BakedCrowd {
  private readonly scene: Scene
  private readonly variants: Variant[] = []
  /** the walkers drawn this frame, by id, so the box renderer skips them */
  readonly drawn = new Set<number>()
  private time = 0
  ready: Promise<void>

  constructor(scene: Scene, count = 10) {
    this.scene = scene
    this.ready = this.build(count)
  }

  private async build(count: number): Promise<void> {
    // one at a time: the kit builds bodies on a worker, and eight at once would stall the ride
    // the cyclists go in third and fifth: a walker and a runner first, so the pavements fill before the road
    const plan: { i: number; cycle: boolean }[] = []
    for (let i = 0; i < count; i++) {
      plan.push({ i, cycle: false })
      if (i === 1 || i === 3) plan.push({ i: 100 + i, cycle: true })
    }
    for (const { i, cycle } of plan.slice(0, count + CYCLISTS)) {
      try {
        const seed = 0x6a09e667 ^ (i * 0x9e3779b9)
        const v = await this.variant(cityClothes(randomSpec(seed), seed, cycle ? -1 : i), i, cycle)
        if (v) this.variants.push(v)
      } catch (e) {
        console.warn('crowd variant', i, e instanceof Error ? e.message : String(e))
      }
    }
  }

  private async variant(seedSpec: AvatarSpec, index: number, cycle = false): Promise<Variant | null> {
    // the athletic variants (cityClothes gives the first two kit) are baked running
    const gait: 'walk' | 'run' | 'cycle' = cycle ? 'cycle' : index % 10 < 2 ? 'run' : 'walk'
    const pace = gait === 'cycle' ? CYCLE_SPEED : gait === 'run' ? 3.0 : BAKE_SPEED
    // dressed to be tinted: white clothes, neutral hair, a mid skin tone
    const spec = cloneSpec(normalizeSpec(seedSpec))
    spec.skin.color = '#dc9c70'
    spec.hair.color = '#ffffff'
    for (const c of spec.clothes) c.color = '#ffffff'
    // one plain shoe for everyone: the wardrobe's range from 2 000 to 8 000 triangles a pair is invisible
    // at crowd distance and multiplied by two hundred pairs of feet
    if (spec.clothes.length >= 3) spec.clothes[spec.clothes.length - 1].id = 'shoes06'
    await initAssets()
    const geometry = await new GeometryService().request(spec, 'low')
    if (!geometry) return null
    const avatar = new Avatar(this.scene, spec, { geometry, quality: 'low', name: `crowd${index}` })
    avatar.root.setEnabled(false)
    await avatar.whenReady()

    /*
     * A cyclist's "stride" is one turn of the cranks, and the crank angle is set outright for every frame
     * rather than integrated from a cadence, so frame 0 and frame FRAMES are exactly the same pose and the
     * loop has no seam.
     */
    const stride = cycle ? 60 / CYCLE_CADENCE : await strideOf(avatar, pace)
    if (!(stride > 0.2 && stride < 3)) return null
    const pose = (f: number): void => {
      if (cycle) avatar.setMotion({ mode: 'cycle', speed: pace, cadence: CYCLE_CADENCE, crank: (f / FRAMES) * Math.PI * 2, effort: 0.3 })
    }
    if (cycle) {
      pose(0)
      avatar.animator.snap()
      for (let i = 0; i < 90; i++) { pose(i % FRAMES); avatar.update(1 / 60) }
      pose(0)
      avatar.update(1 / 600)
    }

    const meshes = avatar.getMeshes()
    const body = meshes.find((m) => m.name.endsWith('.body')) ?? meshes[0]
    const skeleton = body.skeleton
    if (!skeleton) return null
    const floatsPerFrame = (skeleton.bones.length + 1) * 16
    const data = new Float32Array(floatsPerFrame * (FRAMES + 1))
    const dt = stride / FRAMES
    const nodes = avatar.root.getChildTransformNodes(false)
    for (let f = 0; f <= FRAMES; f++) {
      if (f > 0) { pose(f); avatar.update(dt) }
      avatar.root.computeWorldMatrix(true)
      for (const n of nodes) n.computeWorldMatrix(true)
      for (const m of meshes) m.computeWorldMatrix(true)
      skeleton.prepare(true)
      data.set(skeleton.getTransformMatrices(body), f * floatsPerFrame)
    }

    const baker = new VertexAnimationBaker(this.scene, body)
    const manager = new BakedVertexAnimationManager(this.scene)
    manager.texture = baker.textureFromBakedVertexData(data)

    const parts = instancedParts(this.scene, meshes, spec, manager)
    /*
     * The kit's own bike, fitted to this body so the feet meet the pedals, frozen with its cranks level and
     * merged by material into a few meshes, instanced with the rider. The legs pedal; the cranks do not turn
     * with them, which nobody sees at crowd distance. The frame takes the cyclist's colour.
     */
    if (cycle) {
      const bike = new Bike(this.scene, avatar.animator.fit, { name: `crowdBike${index}`, color: '#ffffff', accent: '#e8e4da' })
      bike.update(Math.PI / 2, 0)
      bike.root.computeWorldMatrix(true)
      const byMaterial = new Map<unknown, Mesh[]>()
      for (const m of bike.getMeshes()) {
        m.computeWorldMatrix(true)
        const list = byMaterial.get(m.material) ?? []
        list.push(m)
        byMaterial.set(m.material, list)
      }
      for (const [material, list] of byMaterial) {
        const merged = Mesh.MergeMeshes(list, false, true)
        if (!merged) continue
        merged.parent = null
        merged.name = `crowdBike${index}.${parts.length}`
        const std = material as StandardMaterial
        const isFrame = std.name.endsWith('.frame')
        merged.material = std
        merged.thinInstanceRegisterAttribute('color', 4)
        merged.thinInstanceCount = 0
        merged.alwaysSelectAsActiveMesh = true
        merged.isPickable = false
        merged.renderingGroupId = 3
        merged.layerMask = 0x0fffffff | PEOPLE
        parts.push({ mesh: merged, part: isFrame ? 'frame' : 'plain', near: Infinity })
      }
      bike.root.dispose()
    }
    peopleLights(this.scene)
    // the meshes stay parented to the kit's root, which stays at the origin; the instances place them
    avatar.root.position.setAll(0)
    avatar.root.rotationQuaternion = Quaternion.Identity()
    avatar.root.setEnabled(true)
    for (const { mesh } of parts) mesh.setEnabled(false)
    return { meshes: parts, fps: FRAMES / stride, manager, gait, pace }
  }

  /** a walker's body: a running variant for a runner, a pedalling one for a cyclist, a walking one otherwise */
  private variantFor(w: Walker): number {
    const want = w.kind
    const pool = this.variants.map((v, i) => (v.gait === want ? i : -1)).filter((i) => i >= 0)
    // no variant of that gait built yet: the box renderer keeps them (a walker falls back to any body)
    if (pool.length === 0) return want === 'walk' ? 0 : -1
    let h = Math.imul(w.id ^ 0x85ebca6b, 0xc2b2ae35) >>> 0
    h = (h ^ (h >>> 16)) >>> 0
    return pool[h % pool.length]
  }

  update(dt: number, walkers: readonly Walker[], rider: Point, terrain?: Terrain): void {
    this.drawn.clear()
    if (this.variants.length === 0) return
    this.time += dt

    const groups: { w: Walker; d: number }[][] = this.variants.map(() => [])
    for (const w of walkers) {
      const d = distance(w.at, rider)
      if (d > RANGE) continue
      const vi = this.variantFor(w)
      if (vi < 0) continue            // no body of that gait yet: the box renderer draws them
      groups[vi].push({ w, d })
      this.drawn.add(w.id)
    }

    const m = new Matrix()
    const one = new Vector3()
    this.variants.forEach((v, vi) => {
      v.manager.time = this.time
      // near first, so the close-up parts can take a prefix of the same buffers
      const list = groups[vi].sort((a, b) => a.d - b.d)
      const n = list.length
      // how many walkers are inside a part's range: a prefix of the sorted list
      const within = (r: number): number => {
        if (r === Infinity) return n
        let k = 0
        while (k < n && list[k].d < r) k++
        return k
      }
      const matrices = new Float32Array(n * 16)
      const settings = new Float32Array(n * 4)
      const colours: Record<Part, Float32Array> = {
        skin: new Float32Array(n * 4), top: new Float32Array(n * 4), bottom: new Float32Array(n * 4),
        hair: new Float32Array(n * 4), plain: new Float32Array(n * 4).fill(1), frame: new Float32Array(n * 4),
      }
      list.forEach(({ w, d }, i) => {
        // a walker's feet are 0.155 m under the kit's root; a bike's wheels stand on it
        const y = (w.y ?? (w.park ? (terrain?.rawHeightAt(w.at.x, w.at.z) ?? 0) : nearLevel(terrain?.heightAt(w.at.x, w.at.z) ?? 0, w.level))) + (v.gait === 'cycle' ? 0 : 0.155)
        // the kit's bodies are life-size already; the walker's height varies them a little around it, and
        // at the edge of the drawn range they grow in from nothing instead of appearing whole
        const grow = Math.min(1, Math.max(0, (RANGE - d) / GROW))
        const s = (0.94 + (w.height - 0.9) * 0.5) * grow
        one.set(s, s, s)
        Matrix.ComposeToRef(one, Quaternion.RotationYawPitchRoll(w.heading, 0, 0), new Vector3(w.at.x, y, w.at.z), m)
        m.copyToArray(matrices, i * 16)
        // each walker somewhere different in the stride, at a pace that matches their speed, so feet
        // do not slide and nobody marches in step
        const offset = (w.id * 7.31) % FRAMES
        settings.set([0, FRAMES, offset, v.fps * (w.speed / v.pace)], i * 4)
        colours.skin.set([w.skin[0] / BASE_SKIN[0], w.skin[1] / BASE_SKIN[1], w.skin[2] / BASE_SKIN[2], 1], i * 4)
        colours.top.set([w.shirt[0], w.shirt[1], w.shirt[2], 1], i * 4)
        colours.bottom.set([w.trousers[0], w.trousers[1], w.trousers[2], 1], i * 4)
        colours.hair.set([w.hair[0], w.hair[1], w.hair[2], 1], i * 4)
        // the bike's frame: the box renderer's colour for it, a darker take on the shirt
        colours.frame.set([w.shirt[0] * 0.5 + 0.1, w.shirt[1] * 0.5 + 0.1, w.shirt[2] * 0.5 + 0.1, 1], i * 4)
      })
      for (const { mesh, part, near: range } of v.meshes) {
        const count = within(range)
        if (count === 0) { mesh.setEnabled(false); continue }
        mesh.thinInstanceSetBuffer('matrix', matrices.subarray(0, count * 16), 16, false)
        if (mesh.bakedVertexAnimationManager) mesh.thinInstanceSetBuffer('bakedVertexAnimationSettingsInstanced', settings.subarray(0, count * 4), 4, false)
        mesh.thinInstanceSetBuffer('color', colours[part].subarray(0, count * 4), 4, false)
        mesh.setEnabled(true)
      }
    })
  }
}


/**
 * A baked kit body's meshes made ready to thin-instance: the tiny transparent layers dropped, each part named for
 * the colour it takes (skin, top, bottom, hair, or plain), the baked animation and per-instance colour attributes
 * registered, and a plain lit material in place of the kit's PBR one. Shared with the beach (render/beach-crowd.ts).
 */
export function instancedParts(scene: Scene, meshes: Mesh[], spec: AvatarSpec, manager: BakedVertexAnimationManager): { mesh: Mesh; part: Part; near: number }[] {
  const parts: { mesh: Mesh; part: Part; near: number }[] = []
  const topId = spec.clothes[0]?.id
  const bottomId = spec.clothes[1]?.id
  for (const m of meshes) {
    const n = m.name
    // the tiny transparent layers are not worth a draw call each at crowd distance
    if (n.endsWith('.cornea') || n.includes('.eyelashes.') || n.includes('.tongue.') || n.includes('.teeth.')) {
      m.dispose()
      continue
    }
    const part: Part = n.endsWith('.body') ? 'skin'
      : n.includes('.hair.') || n.includes('.eyebrows.') ? 'hair'
      : topId && n.endsWith(`.clothes.${topId}`) ? 'top'
      : bottomId && n.endsWith(`.clothes.${bottomId}`) ? 'bottom'
      : 'plain'
    // no expressions on a stranger: the morph targets cost per vertex, per instance, for nothing
    m.morphTargetManager = null
    m.bakedVertexAnimationManager = manager
    m.thinInstanceRegisterAttribute('bakedVertexAnimationSettingsInstanced', 4)
    m.thinInstanceRegisterAttribute('color', 4)
    m.thinInstanceCount = 0
    m.alwaysSelectAsActiveMesh = true
    m.isPickable = false
    // with the buildings: the ground layers clear depth, and group 0 would be painted over
    m.renderingGroupId = 3
    /*
     * A plain lit material in place of the kit's physically based one. The kit's skin takes part in a
     * scene-wide subsurface-scattering pass at its high quality tier, and eight crowd bodies' worth of
     * those materials — each with baked animation and instancing on top — was enough shader variants to
     * take the whole tab down on a machine that picks the high tier. A stranger at twenty metres needs
     * their texture and their colour, not film skin; this keeps both and costs far less to draw.
     *
     * Cut-outs, not blending, for the same reason as the trees: a thin-instanced mesh is sorted once as a
     * single object, and blended hair on two hundred heads sorted as one would draw over everything.
     */
    const kit = m.material as PBRMaterial | null
    const mat = new StandardMaterial(`${n}.crowd`, scene)
    if (kit) {
      mat.diffuseTexture = kit.albedoTexture
      mat.diffuseColor = kit.albedoColor.clone()
      if (kit.albedoTexture && kit.albedoTexture.hasAlpha) {
        mat.transparencyMode = 1
        mat.alphaCutOff = 0.5
        mat.useAlphaFromDiffuseTexture = true
      }
      mat.backFaceCulling = kit.backFaceCulling
    }
    mat.specularColor.set(0.08, 0.08, 0.08)
    mat.emissiveColor.set(0.08, 0.075, 0.07)   // a little lift, so the shaded side is not a silhouette
    m.material = mat
    m.layerMask = 0x0fffffff | PEOPLE
    kit?.dispose(false, false)
    // eyes and brows only close up; shoes only to SHOES (past it a foot is a few pixels, and the plainest pair is
    // 2 000 triangles: 358 k of the park crowd's 2.1 M, perf audit 2026-10-05)
    parts.push({ mesh: m, part, near: n.endsWith('.eyes') || n.includes('.eyebrows.') ? NEAR : n.includes('.clothes.shoes') ? SHOES : Infinity })
  }
  return parts
}

/** One stride of the kit's walk (or run) at this pace, found by watching its gait phase wrap: 0..1 per stride. */
async function strideOf(avatar: Avatar, pace: number): Promise<number> {
  // walk, and settle into it before recording: the animator eases its speed and its gait blend
  // the kit's walk becomes a run of its own accord above about 2.6 m/s
  avatar.setMotion({ mode: 'walk', speed: pace })
  avatar.animator.snap()
  for (let i = 0; i < 90; i++) avatar.update(1 / 60)
  const step = 1 / 600
  let t = 0
  let wraps = 0
  let start = 0
  let last = avatar.animator.gaitPhase
  while (wraps < 2 && t < 5) {
    avatar.update(step)
    t += step
    const p = avatar.animator.gaitPhase
    if (p < last) {
      wraps++
      if (wraps === 1) start = t
    }
    last = p
  }
  return t - start
}

/**
 * The strangers' own light: the same sun as everything else, but a sky term washed toward white and a warm
 * bounce from the street below, instead of the trees' saturated blue sky — which, in shade, turned light
 * skin green (see layers.ts). Created once per scene; lights only meshes carrying the PEOPLE bit.
 */
export function peopleLights(scene: Scene): void {
  if (scene.lights.some((l) => l.name === 'people')) return
  const sky = new HemisphericLight('people', new Vector3(0, 1, 0), scene)
  const s = DAYLIGHT.skyColour
  sky.diffuse = new Color3(0.55 + s.r * 0.35, 0.55 + s.g * 0.3, 0.55 + s.b * 0.22)
  sky.groundColor = new Color3(0.42, 0.37, 0.33)
  sky.specular = new Color3(0, 0, 0)
  // balanced so a light skin in full sun peaks just under white: over-lit, red AND green clip and it reads yellow
  sky.intensity = 0.5 * (1 - 0.3 * OVERCAST)
  sky.includeOnlyWithLayerMask = PEOPLE
  const sun = new DirectionalLight('people-sun', DAYLIGHT.sun.clone(), scene)
  sun.diffuse = new Color3(DAYLIGHT.sunColour.r, DAYLIGHT.sunColour.g, DAYLIGHT.sunColour.b)
  sun.intensity = 0.62 * (0.2 + 0.8 * Math.min(1, DAYLIGHT.sunColour.r))
  sun.specular = new Color3(0.04, 0.04, 0.04)
  sun.includeOnlyWithLayerMask = PEOPLE
}

/**
 * What people wear in a city street. The kit's random wardrobe is a beach's — swimming trunks, short denim
 * shorts, crop tops — and a crowd of strangers in what read, at twenty metres, as bikini bottoms is not a
 * Paris street (user report, 2026-09-21). So the top and the bottoms are replaced — mostly from everyday
 * clothes, two variants in ten from athletic kit (someone out for a run), and one woman in three in a dress over
 * tights. The body, face and hair stay the kit's.
 */
const CITY_WARDROBE = {
  // Mostly a plain t-shirt in a colour (the top is tinted with the walker's colour), by repetition: a pick is
  // uniform. The striped "shirt" is a long-sleeved CROP top and the peasant blouses sit above the waist: a street
  // where one woman in three — and some men — showed a midriff read as a beach (BUGS.md #51). One blouse in the
  // list, for a little variety; no crop tops at all.
  topsF: ['joepal_crude_t-shirt_female', 'joepal_crude_t-shirt_female', 'joepal_crude_t-shirt_female', 'joepal_crude_t-shirt_female',
    'joepal_crude_t-shirt_female', 'mindfront_knitted_sweater_01', 'mindfront_knitted_sweater_02', 'elvs_hooded_sweat_jacket1',
    'janexx_old_female_sweater', 'punkduck_lace_up_blouse'],
  topsM: ['elvs_crude_t-shirt_male', 'elvs_crude_t-shirt_male', 'elvs_crude_t-shirt_male', 'toigo_basic_tucked_t-shirt',
    'toigo_basic_tucked_t-shirt', 'namuhekam_male_polo_shirt', 'mindfront_knitted_sweater_01', 'elvs_hooded_sweat_jacket1'],
  bottomsF: ['mindfront_female_trousers_1', 'punkduck_female_tight_jeans', 'elvs_gored_midi_skirt', 'elvs_pencil_skirt',
    'punkduck_jeans_skirt', 'elvs_asymmetrical_skirt'],
  bottomsM: ['mindfront_male_trousers_1', 'mindfront_male_trousers_2', 'punkduck_male_classic_jeans', 'cortu_cargo_pants'],
  athleticTops: ['mindfront_tank_top_01', 'elvs_male_logo_tshirt1', 'elvs_lara_tank1'],
  athleticBottoms: ['elvs_male_swim_shorts1'],
  // everyday dresses to the knee: the fluted halter was a floor-length gown and the "midi" nearly one, and
  // with so few variants baked one gown was a large share of the street (BUGS.md #13)
  dresses: ['toigo_shift_dress', 'mindfront_f_dress_11', 'mindfront_f_dress_02', 'elvs_halter_dress_knee_length',
    'toigo_camisole_dress_with_full_skirt', 'aethelraed_flapper_dress', 'toigo_halter_dress_knee_length'],
}

/** women dressed so far, so one in three gets a dress — a fixed share, not a dice roll that can come up none */
let women = 0

export function cityClothes(spec: AvatarSpec, seed: number, index: number): AvatarSpec {
  let h = seed >>> 0
  const next = (): number => { h = (Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0; return h / 4294967296 }
  const pick = <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)]
  const fem = (spec.macros.Gender ?? 0.5) < 0.5
  const clothes = spec.clothes.slice()
  const kind = index % 10
  if (index < 0) {
    // a cyclist: everyday top, and trousers — a skirt's cloth hangs through the saddle
    clothes[0] = { ...clothes[0], id: pick(fem ? CITY_WARDROBE.topsF : CITY_WARDROBE.topsM) }
    clothes[1] = { ...clothes[1], id: pick(fem ? CITY_WARDROBE.bottomsF.filter((b) => !b.includes('skirt')) : CITY_WARDROBE.bottomsM) }
  } else if (kind < 2) {
    clothes[0] = { ...clothes[0], id: pick(CITY_WARDROBE.athleticTops.filter((t) => fem || t !== 'elvs_lara_tank1')) }
    clothes[1] = { ...clothes[1], id: pick(CITY_WARDROBE.athleticBottoms) }
  } else if (fem && women++ % 3 === 0) {
    // one woman in three in a dress
    // the dress is the "top" (tinted with the walker's top colour) and tights the "bottoms"
    clothes[0] = { ...clothes[0], id: pick(CITY_WARDROBE.dresses) }
    clothes[1] = { ...clothes[1], id: 'kwnet_at_pantyhose01' }
  } else {
    clothes[0] = { ...clothes[0], id: pick(fem ? CITY_WARDROBE.topsF : CITY_WARDROBE.topsM) }
    clothes[1] = { ...clothes[1], id: pick(fem ? CITY_WARDROBE.bottomsF : CITY_WARDROBE.bottomsM) }
  }
  return { ...spec, clothes }
}
