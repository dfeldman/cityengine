/**
 * Dogs on leads: the strangers who walk one (sim/crowd.ts gives the walker a `dog` and the pavement spot beside them).
 *
 * The dogs are dogkit's (assetkit/dogkit): parametric, skinned, procedurally meshed, with a foot-planted IK walk and
 * trot. A ROSTER of breeds (and a few mongrels) is meshed once, in a worker, as the crowd comes up; each dog drawn is
 * a pooled `Dog` built from its breed's geometry, so the cost is a skeleton and three meshes per dog on screen, at
 * most MAX_DOGS of them, the nearest first.
 *
 * The walker and the dog are one unit, wider than a person: the dog's spot is beside its walker on the side holding
 * the lead (in front of them on a narrow pavement). The dog itself wanders round that spot — drifting ahead and
 * across, now and then stopping to sniff until the lead pulls it on — eased so it moves like an animal, never further
 * from the hand than the lead allows. The gait is driven by its actual speed (`DogAnimator.matchSpeed`): a big dog
 * walks beside a person, a small one trots.
 *
 * The lead runs from the walker's hand to the dog's collar and hangs in a curve: its sag is what the slack in a
 * lead of LEASH metres leaves at that distance, so it goes taut when the dog pulls ahead and droops when it comes
 * back to heel. The crowd's bodies are baked vertex animation with no bones to ask, so the hand is a fixed point off
 * the walker (HAND).
 */
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import type { Scene } from '@babylonjs/core/scene'
import { Dog, DogAnimator, PRESETS, PARAMS, mixSpecs, normalizeSpec, rng, type BreedName, type DogGeometry, type DogSpec, type Quality } from 'dogkit'
import type { Walker } from '../sim/crowd.ts'
import type { Point } from '../city/geo.ts'
import { nearLevel, type Terrain } from '../city/terrain.ts'
import { PEOPLE } from './layers.ts'

/** the breeds, and how common each is in Paris and in San Francisco (relative weights) */
const ROSTER: [BreedName, number, number][] = [
  ['labrador', 2, 4], ['golden', 1.5, 3], ['jackRussell', 3, 1.5], ['dachshund', 2.5, 1.5], ['beagle', 2, 1.5],
  ['borderCollie', 1.5, 2], ['aussie', 0.8, 2.5], ['corgi', 1.5, 2], ['germanShepherd', 1.2, 1.5], ['husky', 0.5, 1.5],
  ['dalmatian', 0.6, 0.6], ['greyhound', 0.8, 0.6], ['rottweiler', 0.5, 0.6], ['newfoundland', 0.3, 0.4],
]
/** mongrels: blends of two breeds, nudged (dogkit's designer's "random"), each as common as this weight in both cities */
const MUTTS = 4
const MUTT_WEIGHT = 1.5
/** dogkit mesh quality: 'low' is geometry only (no fur shells), ~10k vertices */
const QUALITY: Quality = 'low'
/** at most this many dogs drawn, the nearest first, out to this far (metres) */
const MAX_DOGS = 20
const RANGE = 70
/** the last stretch of RANGE over which a dog grows in, rather than appearing whole */
const GROW = 8
/** the lead's length (metres), its radius, and the colours leads come in */
const LEASH = 1.3
const LEASH_R = 0.01
/** segments along the drawn lead */
const LEASH_N = 12
/** the hung curve's least horizontal span (a dog right under the hand still gets a loop) and steepest bend */
const LEASH_MIN_SPAN = 0.12
const LEASH_A_MAX = 60
const LEASH_COLOURS = ['#c0262d', '#1b1b1b', '#1d4fa0', '#2f7d3a', '#d97a1a', '#6b3a1e', '#7a2a8a']
/** where the collar sits, from the top of the neck (0) to the head bone (1) */
const COLLAR = 0.35
/** the hand holding it, off the walker's feet in metres (× their size): up, out to the dog's side, forward */
const HAND = { up: 0.8, out: 0.24, fwd: 0.12 }
/** where the dog likes to be, ahead of its spot beside the walker (metres; its nose is ~half a body further on) */
const AHEAD = 0.25
/** the wander round that spot: how far ahead/behind and across, and how fast (radians a second) */
const WANDER_ALONG = 0.35
const WANDER_ACROSS = 0.12
const WANDER_RATE = 0.45
/** a sniff now and then: how far it drops back (the lead then pulls it on), and how often (radians a second) */
const SNIFF_BACK = 0.9
const SNIFF_RATE = 0.09
/** where the strangers' feet are above the ground the crowd stands on (crowd-baked.ts, life.ts: on the pavement) */
const FEET = 0.155
/** how quickly the dog closes on where it wants to be (1/s), and turns (rad/s) */
const FOLLOW = 3.2
const TURN = 5


interface Breed { name: string; spec: DogSpec; weights: [number, number]; geometry: DogGeometry | null; free: Dog[] }
interface Walking {
  dog: Dog
  anim: DogAnimator
  breed: Breed
  leash: Mesh
  pos: Vector3
  heading: number
  /** wander phases, from the dog's seed */
  ph: [number, number, number]
  t: number
  /** the hand holding the lead, last frame (x, z): the rider's bump check (game.ts) */
  hand: [number, number]
  /** dev: the hand–collar distance and the lead's sag last frame */
  lead?: [number, number]
}

export class DogWalks {
  private readonly breeds: Breed[]
  private readonly walking = new Map<number, Walking>()
  private readonly leashMats: StandardMaterial[]
  private readonly worker: Worker | null = null
  private readonly paris: boolean
  /** dev: how many dogs are drawn now */
  drawnCount = 0

  /** Where walker `id`'s dog and the hand on its lead are now, if the dog is drawn — for the rider's bump check. */
  where(id: number): { x: number; z: number; heading: number; hand: [number, number] } | null {
    const k = this.walking.get(id)
    return k && !Number.isNaN(k.pos.x) ? { x: k.pos.x, z: k.pos.z, heading: k.heading, hand: k.hand } : null
  }

  constructor(private readonly scene: Scene, region?: string) {
    this.paris = region === 'paris'
    this.breeds = ROSTER.map(([name, p, s]) => ({ name, spec: PRESETS[name], weights: [p, s] as [number, number], geometry: null, free: [] }))
    const r = rng(20261120)
    const names = Object.keys(PRESETS) as BreedName[]
    for (let i = 0; i < MUTTS; i++) {
      const m = mixSpecs(PRESETS[names[(r() * names.length) | 0]], PRESETS[names[(r() * names.length) | 0]], 0.3 + r() * 0.4)
      const rec = m as unknown as Record<string, number>
      for (const q of PARAMS) if (typeof rec[q.key] === 'number') rec[q.key] += (r() - 0.5) * (q.max - q.min) * 0.12
      m.seed = (r() * 200) | 0
      this.breeds.push({ name: `mutt${i}`, spec: normalizeSpec(m), weights: [MUTT_WEIGHT, MUTT_WEIGHT], geometry: null, free: [] })
    }
    this.leashMats = LEASH_COLOURS.map((c, i) => {
      const m = new StandardMaterial(`leash${i}`, scene)
      m.diffuseColor = Color3.FromHexString(c)
      m.specularColor = new Color3(0.08, 0.08, 0.08)
      return m
    })
    // mesh the breeds one after another in a worker, the commonest here first
    const order = this.breeds.map((_, i) => i).sort((a, b) => this.weight(this.breeds[b]) - this.weight(this.breeds[a]))
    try {
      this.worker = new Worker(new URL('./dog-geometry.worker.ts', import.meta.url), { type: 'module' })
      let next = 0
      const ask = (): void => { if (next < order.length) this.worker!.postMessage({ id: order[next], spec: this.breeds[order[next++]].spec, quality: QUALITY }) }
      this.worker.onmessage = (e: MessageEvent<{ id: number; geometry: DogGeometry }>) => {
        this.breeds[e.data.id].geometry = e.data.geometry
        if (next < order.length) ask()
        else { this.worker?.terminate() }
      }
      ask()
    } catch (err) {
      console.warn('dog-walks: no worker, no dogs', err)
    }
  }

  private weight(b: Breed): number { return b.weights[this.paris ? 0 : 1] }

  /** which breed a dog's seed makes it, among those meshed so far (null: none yet) */
  private breedOf(seed: number): Breed | null {
    let total = 0
    for (const b of this.breeds) total += this.weight(b)
    let x = ((seed * 9301 + 49297) % 233280) / 233280 * total
    let pick = this.breeds[0]
    for (const b of this.breeds) { x -= this.weight(b); if (x <= 0) { pick = b; break } }
    return pick.geometry ? pick : null
  }

  update(dt: number, walkers: readonly Walker[], rider: Point, terrain?: Terrain, drawn?: ReadonlySet<number>): void {
    // the nearest dog walkers whose walker is drawn as a body
    const near: { w: Walker; d: number }[] = []
    for (const w of walkers) {
      if (!w.dog || !w.dogAt || (drawn && !drawn.has(w.id))) continue
      const d = Math.hypot(w.at.x - rider.x, w.at.z - rider.z)
      if (d < RANGE) near.push({ w, d })
    }
    near.sort((a, b) => a.d - b.d)
    if (near.length > MAX_DOGS) near.length = MAX_DOGS
    const keep = new Set(near.map((n) => n.w.id))
    for (const [id, k] of this.walking) if (!keep.has(id)) this.release(id, k)

    for (const { w, d } of near) {
      let k = this.walking.get(w.id)
      if (!k) {
        const b = this.breedOf(w.dog!.seed)
        if (!b) continue
        k = this.acquire(w, b)
        this.walking.set(w.id, k)
      }
      this.step(k, w, dt, d, terrain)
    }
    this.drawnCount = this.walking.size
  }

  private acquire(w: Walker, b: Breed): Walking {
    const seed = w.dog!.seed
    let dog = b.free.pop()
    if (!dog) {
      dog = Dog.create(this.scene, b.geometry!, { name: `dog.${b.name}`, quality: QUALITY })
      for (const m of dog.meshes) { m.isPickable = false; m.layerMask = 0x0fffffff | PEOPLE; m.renderingGroupId = 3 }
    }
    dog.setEnabled(true)
    const anim = new DogAnimator(dog)
    anim.wag = 0.4 + ((seed >> 3) % 5) * 0.12
    const leash = MeshBuilder.CreateTube(`leash.${w.id}`, { path: Array.from({ length: LEASH_N + 1 }, (_, i) => new Vector3(0, 0, i / LEASH_N)), radius: LEASH_R, tessellation: 5, updatable: true }, this.scene)
    leash.material = this.leashMats[seed % this.leashMats.length]
    leash.isPickable = false
    leash.layerMask = 0x0fffffff | PEOPLE
    leash.renderingGroupId = 3
    const ph: [number, number, number] = [(seed % 628) / 100, ((seed >> 4) % 628) / 100, ((seed >> 8) % 628) / 100]
    return { dog, anim, breed: b, leash, pos: new Vector3(NaN, 0, 0), heading: w.heading, ph, t: 0, hand: [w.at.x, w.at.z] }
  }

  private release(id: number, k: Walking): void {
    k.dog.setEnabled(false)
    k.breed.free.push(k.dog)
    k.leash.dispose()
    this.walking.delete(id)
  }

  private ground(w: Walker, x: number, z: number, terrain?: Terrain): number {
    return (w.y ?? (w.park ? (terrain?.rawHeightAt(x, z) ?? 0) : nearLevel(terrain?.heightAt(x, z) ?? 0, w.level))) + FEET
  }

  private step(k: Walking, w: Walker, dt: number, dist: number, terrain?: Terrain): void {
    const h = w.heading
    const fx = Math.sin(h), fz = Math.cos(h)      // forward
    const rx = Math.cos(h), rz = -Math.sin(h)     // the walker's right
    const side = w.dog!.side
    const size = 0.94 + (w.height - 0.9) * 0.5     // crowd-baked.ts's body scale
    k.t += dt
    const [p0, p1, p2] = k.ph
    // the sniff: most of the time nothing, now and then a drop back of up to SNIFF_BACK
    const sniff = Math.pow(Math.max(0, Math.sin(k.t * SNIFF_RATE + p2)), 8) * SNIFF_BACK
    const along = AHEAD + (w.dogLead ?? 0) + Math.sin(k.t * WANDER_RATE + p0) * WANDER_ALONG - sniff
    const across = Math.sin(k.t * WANDER_RATE * 0.63 + p1) * WANDER_ACROSS
    let tx = w.dogAt!.x + fx * along + rx * across
    let tz = w.dogAt!.z + fz * along + rz * across
    // the hand, and the lead: never further from it than the lead (less the collar's height) allows
    const handX = w.at.x + rx * side * HAND.out * size + fx * HAND.fwd * size
    const handZ = w.at.z + rz * side * HAND.out * size + fz * HAND.fwd * size
    const reach = LEASH * 0.9
    const clamp = (x: number, z: number): [number, number] => {
      const dx = x - handX, dz = z - handZ, l = Math.hypot(dx, dz)
      return l > reach ? [handX + dx / l * reach, handZ + dz / l * reach] : [x, z]
    }
    ;[tx, tz] = clamp(tx, tz)
    k.hand[0] = handX; k.hand[1] = handZ
    const p = k.pos
    let vx = 0, vz = 0
    if (Number.isNaN(p.x) || dt <= 0) { p.x = tx; p.z = tz }
    else {
      const a = 1 - Math.exp(-dt * FOLLOW)
      const [nx, nz] = clamp(p.x + (tx - p.x) * a, p.z + (tz - p.z) * a)
      vx = (nx - p.x) / dt; vz = (nz - p.z) / dt
      p.x = nx; p.z = nz
    }
    const speed = Math.hypot(vx, vz)
    // facing where it goes, and the walker's way when it stands
    const want = speed > 0.2 ? Math.atan2(vx, vz) : h
    let dh = want - k.heading
    dh = Math.atan2(Math.sin(dh), Math.cos(dh))
    k.heading += Math.max(-TURN * dt, Math.min(TURN * dt, dh))
    // only the forward part of its motion is walking; a sidestep is shuffled at the same cadence
    k.anim.matchSpeed(speed)
    k.anim.look = Math.max(-0.5, Math.min(0.5, -side * 0.25 + Math.sin(k.t * 0.3 + p1) * 0.3))
    k.anim.update(dt)
    p.y = this.ground(w, p.x, p.z, terrain)
    const grow = Math.min(1, Math.max(0, (RANGE - dist) / GROW))
    const root = k.dog.root
    root.position.copyFrom(p)
    root.rotation.y = k.heading
    root.scaling.setAll(grow)

    // the lead: hand to collar, hanging by its slack
    root.computeWorldMatrix(true)
    k.dog.skeleton.computeAbsoluteMatrices(true)
    k.dog.body.computeWorldMatrix(true)
    // the collar: round the neck, a little behind the head
    const collar = Vector3.Lerp(k.dog.bones.neck2.getAbsolutePosition(k.dog.body), k.dog.bones.head.getAbsolutePosition(k.dog.body), COLLAR)
    const hand = new Vector3(handX, this.ground(w, w.at.x, w.at.z, terrain) + HAND.up * size, handZ)
    /*
     * Hung, not bent: a parabola in the upright plane through hand and collar, y = chord + a·x(x−h), with `a` found
     * (bisection) so the curve is the lead's own length. Pushing the middle straight down by a sag folded a slack lead
     * onto itself whenever the dog was at heel, under the hand, where a real one hangs in a loop. Never through the
     * pavement: a long slack lead trails along it.
     */
    const ux = collar.x - hand.x, uz = collar.z - hand.z
    const hl = Math.hypot(ux, uz)
    const span = Math.max(LEASH_MIN_SPAN, hl)
    const dirX = hl > 1e-4 ? ux / hl : Math.sin(k.heading), dirZ = hl > 1e-4 ? uz / hl : Math.cos(k.heading)
    const dy = collar.y - hand.y
    const floor = p.y + LEASH_R
    const pts = (a: number, out?: Vector3[]): number => {
      let len = 0, px = 0, py = 0
      for (let i = 0; i <= LEASH_N; i++) {
        const s = i / LEASH_N, x = span * s
        const y = Math.max(floor - hand.y, dy * s + a * x * (x - span) * grow)
        if (i > 0) len += Math.hypot(x - px, y - py)
        px = x; py = y
        // (ends exactly on hand and collar; the extra span of a short chord bows the loop outward in its middle)
        const xw = hl * s + (span - hl) * 2 * s * (1 - s)
        out?.push(new Vector3(hand.x + dirX * xw, hand.y + y, hand.z + dirZ * xw))
      }
      return len
    }
    let lo = 0, hi = LEASH_A_MAX
    if (pts(0) < LEASH) {
      for (let it = 0; it < 18; it++) { const mid = (lo + hi) / 2; if (pts(mid) < LEASH) lo = mid; else hi = mid }
    }
    k.lead = [Math.hypot(hl, dy), lo]
    const path: Vector3[] = []
    pts(lo, path)
    MeshBuilder.CreateTube('', { path, radius: LEASH_R, tessellation: 5, instance: k.leash })
    k.leash.setEnabled(grow > 0.05)
  }
}
