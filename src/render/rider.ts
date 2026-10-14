/**
 * The player, as the avatar kit's body on the avatar kit's bike.
 *
 * Not a hand-built one. `avatarkit` is the platform's own human — MakeHuman geometry, proper
 * skin and clothes, a cycling and a running gait — and it is what Trail Trainer and the rest of the platform
 * put on screen. A city game inventing its own box person would be both worse and inconsistent with every
 * other game the rider has played. The strangers on the pavement stay cheap (there are two hundred of them);
 * the player is one body and worth the cost.
 *
 * The body is built off the main thread and takes a moment, so `create` returns immediately and the rider
 * appears when it is ready. The ride runs either way — a city that is still streaming in should not also be
 * waiting on a face.
 *
 * The crank angle comes from the ride model rather than from a cadence invented here, which is what makes
 * coasting read: stop pedalling and the legs stop while the wheels keep turning.
 */
import { Quaternion, TransformNode, Vector3 } from '@babylonjs/core/Legacy/legacy'
import type { AbstractMesh, Scene } from '@babylonjs/core'
import {
  Avatar,
  Bike,
  GeometryService,
  PRESETS,
  suggestQuality,
  normalizeSpec,
  cloneSpec,
  type AvatarSpec,
  type Preset,
} from 'avatarkit'
import { initAssets } from '../assets.ts'

/**
 * Standalone the kit's assets sit next to the page (`public/mh` and `public/env` are symlinks into the kit);
 * on Dandyhorse the platform serves them at `/avatars/`, and this is the one place that changes.
 *
 * The base has to be an ABSOLUTE url. The kit builds bodies in a worker, and a relative `./mh/` there
 * resolves against the worker's own script rather than the page, which quietly fetches index.html and fails
 * with a JSON parse error.
 */
// (where the kit's assets come from, bucket or public/, is set up by initAssets: src/assets.ts)

export interface RiderOptions {
  preset?: Preset
  spec?: AvatarSpec
  bikeColour?: string
  /** 'walk' is the gait for someone on the pavement; a runner uses the treadmill device */
  gait?: 'walk' | 'run'
  /** the kit's level of detail; the crowd uses 'low', the player whatever the machine can afford */
  quality?: 'low' | 'medium' | 'high'
}

export class Rider {
  private readonly scene: Scene
  private readonly root: TransformNode
  private readonly body: TransformNode
  private avatar?: Avatar
  private bike?: Bike
  private readonly riding: boolean
  private travelled = 0
  private claimed = 0
  private gait: 'walk' | 'run' = 'run'

  private constructor(scene: Scene, mode: 'bike' | 'foot') {
    this.scene = scene
    this.riding = mode === 'bike'
    this.root = new TransformNode('rider', scene)
    this.body = new TransformNode('riderBody', scene)
    this.body.parent = this.root
  }

  /** Returns at once; the body turns up when it has been built. */
  static create(scene: Scene, device: 'bike' | 'treadmill' | 'foot', opts: RiderOptions = {}): Rider {
    const rider = new Rider(scene, device === 'bike' ? 'bike' : 'foot')
    rider.gait = opts.gait ?? 'run'
    rider.ready = rider.build(opts).catch((e: unknown) =>
      console.warn('rider:', e instanceof Error ? e.message : String(e)))
    return rider
  }

  /** Settles when the body is on screen (or has failed to build, which is logged). */
  ready: Promise<void> = Promise.resolve()

  private async build(opts: RiderOptions): Promise<void> {
    const spec = normalizeSpec(opts.spec ?? (opts.preset ?? PRESETS[0]).spec)
    const quality = opts.quality ?? suggestQuality(this.scene.getEngine())
    await initAssets()
    const geometry = await new GeometryService().request(spec, quality)
    if (!geometry) return
    const avatar = new Avatar(this.scene, spec, { geometry, quality, name: 'player' })
    /**
     * Straight after the avatar is constructed, not after it is ready.
     *
     * The kit turns on ACES tone mapping for its own PBR skin, and that is right for a body lit by an HDRI
     * and wrong for everything else here: the buildings, the road and the sky are drawn by hand-written
     * shaders that already output display-ready colour, and running them through a film curve a second time
     * washes the whole city out. Doing this only once the body was ready left several seconds of washed-out
     * city at the start of every session — long enough to be the first thing a rider sees.
     */
    const ip = this.scene.imageProcessingConfiguration
    ip.toneMappingEnabled = false
    ip.exposure = 1
    /**
     * And, crucially, NOT as a post-process.
     *
     * The kit switches image processing to a full-screen pass so its PBR skin is graded consistently. That
     * pass then also runs over the buildings, the road and the sky — which are drawn by hand-written shaders
     * that already output display-ready colour — and puts them through a linear-to-sRGB conversion a second
     * time. The whole city came out about a third brighter and visibly flatter, with no setting anywhere
     * obviously wrong: tone mapping was off, exposure was 1, there were no post-processes on the camera, and
     * every shader uniform was identical. `applyByPostProcess` was the one bit of state that differed.
     *
     * Left off, Babylon applies image processing per material instead, which is what the avatar's own
     * materials want and what everything else here is indifferent to.
     */
    ip.applyByPostProcess = false
    this.scene.environmentIntensity = 0.85
    avatar.root.parent = this.body
    if (this.riding) {
      // the kit builds the bike around this rider's own measurements, so the feet reach the pedals
      this.bike = new Bike(this.scene, avatar.animator.fit, {
        name: 'riderBike', color: opts.bikeColour ?? '#c8482f', accent: '#f6f3ea',
      })
      this.bike.root.parent = this.body
    }
    avatar.setMotion(this.riding ? { mode: 'cycle', cadence: 0, speed: 0 } : { mode: 'idle', speed: 0 })
    avatar.animator.snap()
    // held back until the skin and clothes are on, so it never appears half-painted
    avatar.root.setEnabled(false)
    await avatar.whenReady()
    avatar.root.setEnabled(true)
    this.avatar = avatar
    this.claimRenderingGroup()
    if (this.look) this.dress(this.look)
  }

  /**
   * Put the rider in the same rendering group as the buildings.
   *
   * The city's ground is drawn as ordered layers and Babylon CLEARS THE DEPTH BUFFER between rendering
   * groups, so anything left in the default group 0 is drawn and then painted over by the road on top of it.
   * The kit's meshes arrive in group 0, so the rider was being buried by the street they were riding on —
   * only the limbs that happened to be drawn in the transparent pass survived, which is why a pair of arms
   * and legs floated down the road with no body between them.
   */
  private claimRenderingGroup(): void {
    for (const m of this.meshes()) m.renderingGroupId = 3
  }

  /**
   * And drawn AFTER the city, within that group: last in the scene's mesh list, which is the order opaque meshes are
   * drawn in. The skin's subsurface scattering is a screen-space pass over the pixels the pre-pass marked as skin, and
   * the city's own shaders do not write that mark — so a building drawn after the body, in front of it, left the
   * body's mark under the wall, and the skin was painted over the wall: a pale, bare rider showing through a building
   * the rider had clipped into, clothes and all gone (owner, 2026-10-14; reproduced on the iPhone tier). Drawn last,
   * the body behind a wall fails the depth test and marks nothing. Tiles stream in all the time and are appended
   * after the rider, so this is checked every frame and costs nothing while the rider is already last.
   */
  private drawLast(): void {
    const list = this.scene.meshes
    const mine = this.meshes()
    if (!mine.length || mine.includes(list[list.length - 1] as AbstractMesh)) return
    const own = new Set<unknown>(mine)
    const rest = list.filter((m) => !own.has(m))
    const ours = list.filter((m) => own.has(m))
    if (!ours.length) return
    list.length = 0
    list.push(...rest, ...ours)
  }

  private look: { skin: string; hair: string; top: string; bottom: string } | null = null

  /**
   * Wear somebody's colours: skin, hair, top and bottoms. A recolour, not a rebuild — the kit keeps the
   * meshes and only repaints them — so a pooled body can take on each walker it is handed to at no cost,
   * and the walker who was a box a moment ago is recognisably the same person now. Before the body has
   * finished building, the look is held and applied when it arrives.
   */
  dress(look: { skin: string; hair: string; top: string; bottom: string }): void {
    this.look = look
    const a = this.avatar
    if (!a) return
    const spec = cloneSpec(a.spec)
    spec.skin.color = look.skin
    spec.hair.color = look.hair
    if (spec.clothes[0]) spec.clothes[0].color = look.top
    if (spec.clothes[1]) spec.clothes[1].color = look.bottom
    a.setLook(spec)
  }

  /** Out of sight, for a recycled body with nobody to be. */
  /**
   * A collision (owner, 2026-09-29): "maybe the bike and avatar tip over… we don't want the player to think they've
   * been seriously injured — it's a fun game, not GTA." A slapstick topple onto one side, a beat on the ground, and
   * back up. `side` is +1 or −1, which way to fall (away from the car). No ragdoll, nothing dramatic.
   */
  tumble(side: 1 | -1): void {
    if (this.tumbleT >= 0) return
    this.tumbleT = 0
    this.tumbleSide = side
  }
  /** still going over, lying there, or getting up: the game holds the ride until this is false */
  get tumbling(): boolean { return this.tumbleT >= 0 }
  private tumbleT = -1
  private tumbleSide: 1 | -1 = 1
  private static readonly FALL = 0.35
  private static readonly DOWN = 0.9
  private static readonly RISE = 0.6
  /** the roll this frame while tumbling, radians; null when not */
  private tumbleRoll(dt: number): number | null {
    if (this.tumbleT < 0) return null
    this.tumbleT += dt
    const t = this.tumbleT
    const over = 1.35 * this.tumbleSide
    const { FALL, DOWN, RISE } = Rider
    let k: number
    if (t < FALL) k = (t / FALL) ** 2                                     // gravity: slow, then all at once
    else if (t < FALL + DOWN) k = 1 - 0.04 * Math.sin((t - FALL) * 18) * Math.exp(-(t - FALL) * 6)  // a little bounce
    else if (t < FALL + DOWN + RISE) { const u = (t - FALL - DOWN) / RISE; k = 1 - u * u * (3 - 2 * u) }
    else { this.tumbleT = -1; return null }
    return over * k
  }

  hide(): void { this.root.setEnabled(false) }
  show(): void { this.root.setEnabled(true) }

  /** Every mesh the rider is made of, for a shadow generator to cast from. */
  meshes(): AbstractMesh[] {
    const out: AbstractMesh[] = this.avatar ? this.avatar.getMeshes() : []
    return this.bike ? out.concat(this.bike.getMeshes()) : out
  }

  /**
   * `at` is already the rider's own side of the road — `Navigator.ridePoint()` puts them there — so nothing
   * here offsets anything. `lean` is how hard they are cornering (negative to the right), `steer` the bars' angle
   * (positive to the right) — both from the game's steering model (game.ts `bikePose`).
   */
  update(dt: number, at: { x: number; z: number }, heading: number, speed: number, crank: number,
         lean: number, working: boolean, groundY = 0, steer = 0): void {
    this.root.position.set(at.x, 0.05 + groundY, at.z)
    this.root.rotationQuaternion = Quaternion.RotationYawPitchRoll(heading, 0, 0)
    // a tip-over, after a collision, is the cornering lean carried all the way: the bike and the rider roll onto
    // their side about the tyres' contact with the road, stay down a moment, and get up
    const roll = this.tumbleRoll(dt)
    this.body.rotationQuaternion = Quaternion.RotationAxis(
      Vector3.Forward(), roll ?? Math.max(-0.35, Math.min(0.35, lean)))

    // Enforced every frame, not once at build. The kit re-asserts it as materials are created — clothes and
    // hair arrive over several seconds — so setting it once left the city washed out again a moment later.
    // Two property writes a frame is nothing; a city that is a third too bright is not.
    // The skin's subsurface pre-pass would otherwise turn it back on before every camera pass (its composition
    // step), and each flip re-dirties every material in the scene: 360 ms a frame with AO off (2026-10-14).
    const ip = this.scene.imageProcessingConfiguration
    if (this.scene.prePassRenderer) this.scene.prePassRenderer.disableGammaTransform = true
    if (ip.applyByPostProcess || ip.toneMappingEnabled) {
      ip.applyByPostProcess = false
      ip.toneMappingEnabled = false
    }

    const avatar = this.avatar
    if (!avatar) return
    this.travelled += speed * dt
    // the kit swaps meshes in as clothes and hair finish loading, so the claim has to be renewed until the
    // count stops changing
    if (this.meshes().length !== this.claimed) {
      this.claimed = this.meshes().length
      this.claimRenderingGroup()
    }
    this.drawLast()

    if (this.riding) {
      // `crank` rather than a cadence: the animator follows the angle the ride model integrated, so the legs
      // stop when the rider stops pedalling while the bike keeps rolling. That is the visual half of coasting.
      const cadence = working ? Math.max(40, Math.min(110, speed * 9)) : 0
      avatar.setMotion({ mode: 'cycle', speed, crank, cadence, effort: working ? 0.45 : 0.15 })
      // the kit's own wheels and cranks, driven by the same angle the legs follow
      // (the distance since the last frame: it was handed the running total, so the wheels spun ever faster)
      this.bike?.update(avatar.animator.crank, speed * dt)
      this.bike?.steer(steer)
    } else {
      // 'walk' becomes a run of its own accord above about 2.6 m/s, which is what someone on a pavement
      // should do and what someone on a treadmill should not
      const mode = speed < 0.25 ? 'idle' : this.gait
      avatar.setMotion({ mode, speed, effort: this.gait === 'walk' ? 0.3 : 0.5 })
    }
    // `avatar.update`, not `animator.update`: the former drives the whole body — skinning, breathing and
    // the gait. Calling the animator alone left the rider posed and perfectly still.
    avatar.update(dt)
  }
}
