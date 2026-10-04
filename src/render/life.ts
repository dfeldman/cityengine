/**
 * Drawing everything that moves at street level: cars, buses, trains, and people.
 *
 * One mesh per kind, thin instances for the copies, and the matrices rewritten every frame. Forty cars and
 * two hundred people are six draw calls, which is the only reason a street can be this busy.
 *
 * The people are the fiddly part. A walker is three meshes — body, legs, arms — because the limbs have to
 * swing, and they swing by being separate instances whose matrices rotate about a pivot at the hip and the
 * shoulder. It is the cheapest articulation there is and at the distance a rider sees a pavement it is
 * indistinguishable from a skeleton: what reads as walking is the gait, not the joint count.
 */
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { box as boxModel, bus, car, personArm, personBody, personHair, personHead, personLeg } from './models.ts'
import { DEFAULT_STOCK, type RegionStock, type TrainKind } from './rolling-stock.ts'
import type { Rgb } from './models.ts'
import { DAYLIGHT } from './facade-material.ts'
import { blobMaterial, blobQuad, shadowOffset } from './shadows.ts'
import type { Vehicle } from '../sim/traffic.ts'
import type { Walker } from '../sim/crowd.ts'
import type { CityPackage } from '../city/package.ts'
import type { Terrain } from '../city/terrain.ts'
import { unpackPoints } from '../city/package.ts'
import { nearLevel, profileAt } from '../city/terrain.ts'
import { StreetFleet } from './street-fleet.ts'

class Pool {
  readonly mesh: Mesh
  private matrices: Float32Array
  private colours: Float32Array
  private used = 0

  constructor(scene: Scene, name: string, data: MeshBuilder, capacity: number) {
    this.mesh = new Mesh(name, scene)
    data.toVertexData().applyToMesh(this.mesh)
    this.mesh.material = cartoonMaterial(scene)
    this.mesh.isPickable = false
    // the mesh sits at the origin and its copies are spread over the city, so Babylon's frustum test on the
    // source mesh is meaningless and would cull the lot
    this.mesh.alwaysSelectAsActiveMesh = true
    this.mesh.setEnabled(false)     // nothing to draw until the first frame fills it; see `end`
    // The same group the buildings are in. Rendering groups 1–3 clear the depth buffer, so anything left in
    // group 0 is drawn and then buried by the streets: cars and people were being simulated correctly and
    // then painted over by the road they were standing on.
    this.mesh.renderingGroupId = 3
    this.matrices = new Float32Array(capacity * 16)
    this.colours = new Float32Array(capacity * 4)
  }

  begin(): void { this.used = 0 }

  /** False when the pool is full and the copy was dropped — the caller must then drop its shadow too. */
  push(m: Matrix, r: number, g: number, b: number, mix = 1): boolean {
    if ((this.used + 1) * 16 > this.matrices.length) return false
    m.copyToArray(this.matrices, this.used * 16)
    this.colours.set([r, g, b, mix], this.used * 4)
    this.used++
    return true
  }

  end(): void {
    // A thin-instanced mesh with no instances is still DRAWN, once, as an ordinary mesh — and the instanced
    // shader's `world0..world3` attributes are undefined for that draw, so every vertex is transformed by
    // garbage and the screen fills with huge triangles. An empty pool has to be switched off, not just
    // emptied. This was the flickering in front of the camera.
    this.mesh.setEnabled(this.used > 0)
    if (this.used === 0) {
      this.mesh.thinInstanceCount = 0
      return
    }
    // Exactly `used` entries, not the whole capacity. `thinInstanceSetBuffer` takes the instance count from
    // the buffer's own length, overriding anything set beforehand — so handing it the full array draws the
    // unused tail as well. Those matrices are all zeros, and a zero matrix sends every vertex to w = 0,
    // which projects to infinity: the screen fills with huge triangles radiating from a point.
    this.mesh.thinInstanceSetBuffer('matrix', this.matrices.subarray(0, this.used * 16), 16)
    this.mesh.thinInstanceSetBuffer('instColor', this.colours.subarray(0, this.used * 4), 4)
  }

  get count(): number { return this.used }
}

/** A town bike for the cyclists among the strangers: two wheels, a frame, bars and a saddle. Facing +z. */
function strangerBike(out: MeshBuilder): void {
  const tyre: [number, number, number] = [0.08, 0.08, 0.09]
  for (const z of [-0.52, 0.52]) {
    // a wheel as a thin ring of eight bars in the y–z plane
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      const b = ((k + 1) / 8) * Math.PI * 2
      const cy = 0.34
      const y0 = cy + Math.sin(a) * 0.33, z0 = z + Math.cos(a) * 0.33
      const y1 = cy + Math.sin(b) * 0.33, z1 = z + Math.cos(b) * 0.33
      boxModel(out, 0, (y0 + y1) / 2, (z0 + z1) / 2, 0.02, Math.abs(y1 - y0) / 2 + 0.02, Math.abs(z1 - z0) / 2 + 0.02, tyre, 0)
    }
  }
  boxModel(out, 0, 0.6, 0, 0.025, 0.025, 0.46, [1, 1, 1], 1)             // top tube (tinted)
  boxModel(out, 0, 0.47, -0.2, 0.025, 0.16, 0.025, [1, 1, 1], 1)         // seat tube
  boxModel(out, 0, 0.8, -0.24, 0.08, 0.025, 0.12, tyre, 0)               // saddle
  boxModel(out, 0, 0.85, 0.46, 0.25, 0.02, 0.02, tyre, 0)                // bars
  boxModel(out, 0, 0.62, 0.48, 0.025, 0.22, 0.025, [1, 1, 1], 1)         // fork
}

const build = (fn: (out: MeshBuilder) => void): MeshBuilder => {
  const out = new MeshBuilder()
  fn(out)
  return out
}

export class Life {
  private readonly cars: Pool
  private readonly buses: Pool
  /** the street's cars and buses as carkit draws them (render/street-fleet.ts); null: the old models above */
  private readonly fleet: StreetFleet | null
  /** the trains' cars, by kind and variant: middle, head and tail pools */
  private readonly stockPools: { kind: TrainKind; variants: { mid: Pool; head: Pool | null; tail: Pool | null; liveries?: Rgb[]; pitch: number; shadow: [number, number, number] }[] }[] = []
  private readonly stock: RegionStock
  private readonly bodies: Pool
  private readonly legs: Pool
  private readonly arms: Pool
  private readonly heads: Pool
  private readonly hairs: Pool
  /** a stranger's bicycle, frame and wheels, facing +z */
  private readonly bikes: Pool
  private readonly blobs: Pool
  private readonly rails: { points: { x: number; z: number }[]; length: number; kind: 0 | 1 | 2 | 3 | 4 | 5; heights?: number[]; stops: number[] }[] = []
  /** a train: where its head is along the rail, which way, its running speed and speed now, its dwell */
  private readonly trains: { rail: number; s: number; dir: 1 | -1; speed: number; v: number; wait: number; last: number; variant: number; held?: number; fixed?: 1 | -1 | null; shift?: number; spin?: number }[] = []
  /**
   * The street-running cars this frame — cable cars, streetcars, light rail (rail kinds 2–4; not the main line nor the
   * métro on its viaduct): where each car is, its size, its speed. The traffic, the rider and the crowd treat them as
   * the obstacles they are (sim/traffic.ts `transit`; owner, 2026-10-01: "they have no collision so people, cars, and
   * the player go right through"). `id` is train and car, stable while the train runs.
   */
  /**
   * Which way a STREET track runs, from where it lies in its street (game.ts gives it the street graph): +1 a→b, −1
   * b→a, null a single track down the middle that is run both ways (owner, 2026-10-01: half the streetcars ran on the
   * wrong side of the street, head-on into the cars — every track was run both ways, turning round at each end).
   */
  trackDirection: ((points: { x: number; z: number }[]) => { dir: 1 | -1 | null; d: number; lane: number } | undefined) | null = null
  /** the rider is aboard a train (game.ts): no train stops for them then — they are standing in it */
  riderAboard = false
  readonly transitBodies: { id: string; x: number; z: number; y: number; heading: number; speed: number; len: number; wid: number; kind: number }[] = []
  /** the stations trains stop at (the métro viaduct's), in local metres */
  private readonly stations: { x: number; z: number }[]
  /** the streetcar and cable-car stops (OSM railway=tram_stop), as the tiles bring them */
  private readonly tramStops: { x: number; z: number }[] = []
  private readonly m = Matrix.Identity()

  constructor(scene: Scene, pkg: CityPackage, budget = { cars: 90, buses: 16, people: 3000 },
              stock: RegionStock = DEFAULT_STOCK, stations: { x: number; z: number }[] = [], carkit = true) {
    this.fleet = carkit ? new StreetFleet(scene) : null
    this.cars = new Pool(scene, 'cars', build(car), carkit ? 1 : budget.cars)
    this.buses = new Pool(scene, 'buses', build(bus), carkit ? 1 : budget.buses)
    // the region's own rolling stock (render/rolling-stock.ts; Paris's RER, métro and Citadis, SF's cable cars)
    this.stock = stock
    this.stations = stations
    for (const [i, kind] of [stock.rail, stock.metro, stock.tram, stock.cable ?? null, stock.light ?? null, stock.gondola ?? null].entries()) {
      if (!kind) { this.stockPools.push(null as never); continue }
      const name = ['carriages', 'metro', 'trams', 'cablecars', 'lightrail', 'gondola'][i]
      const models = [{ mid: kind.mid, head: kind.head, tail: kind.tail, liveries: kind.liveries, pitch: kind.pitch, shadow: kind.shadow }, ...(kind.variants ?? [])]
      this.stockPools.push({
        kind,
        variants: models.map((v, j) => ({
          mid: new Pool(scene, `${name}:${j}`, build(v.mid), kind.capacity),
          head: v.head ? new Pool(scene, `${name}:${j}:head`, build(v.head), Math.ceil(kind.capacity / 2)) : null,
          tail: v.tail ? new Pool(scene, `${name}:${j}:tail`, build(v.tail), Math.ceil(kind.capacity / 2)) : null,
          liveries: v.liveries ?? kind.liveries,
          pitch: v.pitch ?? kind.pitch,
          shadow: v.shadow ?? kind.shadow,
        })),
      })
    }
    this.bodies = new Pool(scene, 'people', build(personBody), budget.people)
    this.legs = new Pool(scene, 'legs', build(personLeg), budget.people * 2)
    this.arms = new Pool(scene, 'arms', build(personArm), budget.people * 2)
    this.heads = new Pool(scene, 'heads', build(personHead), budget.people)
    this.hairs = new Pool(scene, 'hairs', build(personHair), budget.people)
    this.bikes = new Pool(scene, 'bikes', build(strangerBike), Math.max(40, Math.round(budget.people / 6)))

    /**
     * A shadow for everything that moves.
     *
     * The buildings and the trees have theirs baked into the tile, but a car and a walker cannot — they are
     * somewhere else next frame. Theirs is a soft blob carried along, offset along the sun and stretched
     * the way a low sun stretches everything. Without one a car sits on the road like a sticker, which is
     * the single clearest way an object can fail to look part of a scene.
     */
    // every carriage in every stock pool can want a shadow at once (a rail yard stands them all in one place)
    const trainCap = this.stockPools.reduce((n, p) => n + (p ? p.variants.length * p.kind.capacity : 0), 0)
    this.blobs = new Pool(scene, 'blobs', build(blobQuad), budget.cars + budget.buses + budget.people + trainCap + 48)
    this.blobs.mesh.material = blobMaterial(scene)

    this.addRails(pkg.rails)
  }

  private readonly railIds = new Set<number>()

  /**
   * Tram stops arriving with a tile's furniture: kept for the lines still to come, and matched to the lines already
   * running (a stop and its line are often in different tiles).
   */
  addStops(points: { x: number; z: number }[]): void {
    for (const p of points) {
      if (this.tramStops.some((q) => Math.abs(q.x - p.x) < 0.5 && Math.abs(q.z - p.z) < 0.5)) continue
      this.tramStops.push(p)
      for (const r of this.rails) {
        if (r.kind === 1 || r.kind === 0 || !this.stockPools[r.kind]?.kind.stops) continue
        const s = stopAlong(r.points, p, 12)
        if (s !== null) { r.stops.push(s); r.stops.sort((a, b) => a - b) }
      }
    }
  }

  /** Join `points` onto the one existing rail of `kind` it meets end to end; true if it did (`addRails`). */
  private joinRail(points: { x: number; z: number }[], length: number, kind: number): boolean {
    const near = (a: { x: number; z: number }, b: { x: number; z: number }): boolean => Math.hypot(a.x - b.x, a.z - b.z) < 1
    const a0 = points[0], a1 = points[points.length - 1]
    const hits: { i: number; at: 'start' | 'end'; mine: 'start' | 'end' }[] = []
    this.rails.forEach((r, i) => {
      if (r.kind !== kind || r.heights) return
      const r0 = r.points[0], r1 = r.points[r.points.length - 1]
      for (const [mine, p] of [['start', a0], ['end', a1]] as const) {
        if (near(p, r0)) hits.push({ i, at: 'start', mine })
        if (near(p, r1)) hits.push({ i, at: 'end', mine })
      }
    })
    // only a plain continuation: one rail, at one of this piece's ends (a branch or a crossing stays separate)
    if (hits.length !== 1) return false
    const h = hits[0]
    const rail = this.rails[h.i]
    const piece = h.at === 'end' ? (h.mine === 'start' ? points : [...points].reverse()) : (h.mine === 'end' ? points : [...points].reverse())
    if (h.at === 'end') {
      rail.points = [...rail.points, ...piece.slice(1)]
    } else {
      rail.points = [...piece.slice(0, -1), ...rail.points]
      rail.stops = rail.stops.map((st) => st + length)
      for (const t of this.trains) if (t.rail === h.i) { t.s += length; if (t.last >= 0) t.last += length }
    }
    rail.length += length
    // the stops on the joined piece
    if (this.stockPools[rail.kind]?.kind.stops) {
      rail.stops = []
      for (const st of this.tramStops) { const sa = stopAlong(rail.points, st, 12); if (sa !== null) rail.stops.push(sa) }
      rail.stops.sort((p, q) => p - q)
    }
    return true
  }

  /** Railways arriving with streamed tiles, each once, with its trains. */
  addRails(rails: CityPackage['rails']): void {
    // Only the railways a rider can actually see. A subway is underground: putting a train on it would mean
    // a train sliding through the road surface, which is worse than no train at all.
    const from = this.rails.length
    for (const r of rails) {
      // …except where it comes up on a viaduct (the Paris métro's Lines 2, 5 and 6), which is the one place a
      // rider sees a métro train
      if ((r.kind === 'subway' && !r.heights) || this.railIds.has(r.id)) continue
      // (a cable-car or light-rail track takes its own stock where the region has one, else the tram's)
      // (and a GONDOLA — Salesforce Park's, docs/SALESFORCE-PARK.md — on its own inclined track, kind 5)
      const kind: 0 | 1 | 2 | 3 | 4 | 5 = r.gondola ? 5 : r.kind === 'tram'
        ? (r.cable && this.stockPools[3] ? 3 : r.light && this.stockPools[4] ? 4 : 2)
        : r.kind === 'subway' ? 1 : 0
      if (!this.stockPools[kind]) continue
      this.railIds.add(r.id)
      const points = unpackPoints(r.points)
      let length = 0
      for (let i = 1; i < points.length; i++) {
        length += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
      }
      if (length < this.stock.minLine && kind !== 5) continue
      // the stations on this line: where along it each comes within 40 m
      // the stations on this line: the métro viaduct's for the métro, the tram stops for everything on tram track
      const stops: number[] = []
      // a gondola stops at both its stations, its two ends
      if (kind === 5) stops.push(0.5, length - 0.5)
      else if (this.stockPools[kind].kind.stops) {
        for (const st of kind === 1 ? this.stations : this.tramStops) {
          const s = stopAlong(points, st, kind === 1 ? 40 : 12)
          if (s !== null) stops.push(s)
        }
        stops.sort((p, q) => p - q)
      }
      /*
       * JOINED END TO END (owner, 2026-10-03, 9th Ave & Irving: trains "get stuck 100% of the time in the turn"). OSM maps a
       * line as many ways, each a rail here with its own train shuttling to its ends — and a street track's end in sight
       * holds its train there (below), so every train reaching the piece's end in the junction stood in the turn for good.
       * A piece whose end meets exactly one existing rail's end (same stock, at grade) is joined onto that rail instead:
       * the line runs through, and the trains already on it keep their place (shifted when the piece goes on the front).
       */
      if (!r.heights && kind >= 2 && kind <= 4 && this.joinRail(points, length, kind)) continue
      this.rails.push({ points, length, kind, heights: r.heights, stops })
    }
    this.rails.forEach((r, i) => {
      if (i < from) return
      const k = this.stockPools[r.kind].kind
      const speed = r.kind === 0 ? k.speed * (0.8 + (i % 3) * 0.2) : k.speed
      const kp = this.stockPools[r.kind]
      const n = kp.variants.length
      const chosen = k.variantFor?.(r.points)
      const variant = chosen !== null && chosen !== undefined ? Math.max(0, Math.min(n - 1, chosen)) : i % n
      this.trains.push({ rail: i, s: (i * 137) % r.length, dir: i % 2 ? 1 : -1, speed, v: speed, wait: 0, last: -1, variant })
    })
  }

  /**
   * The player's own shadow, which they see more than any other and would notice the absence of first.
   *
   * Recorded here rather than drawn by the rider, because it belongs in the same instanced pool as every
   * other moving shadow — one more matrix costs nothing, a seventh draw call would not.
   */
  private riderBlob: { at: { x: number; z: number }; heading: number } | null = null
  riderShadow(at: { x: number; z: number }, heading: number, groundY = 0): void {
    this.riderBlob = { at, heading }
    void groundY
  }

  /** the terrain the last `update` was given, so `trainInfo` can say how high a train's track is */
  private terrain: Terrain | undefined

  /**
   * Where the trains are (tools/: the probes aim at them; sim/transit.ts: the rider gets on one): head
   * position and deck height, kind, speed now, dwell left.
   *
   * `id` is the train's index, which is stable for the life of the session — `this.trains` is only ever
   * appended to, as tiles bring their rails in. A rider aboard one holds that id.
   */
  trainInfo(): { id: number; kind: number; x: number; z: number; y: number; heading: number; v: number; wait: number; stops: number }[] {
    return this.trains.map((t, i) => ({ ...this.train(i)!, id: i, kind: this.rails[t.rail].kind }))
  }

  /** One train, without building the whole list — what the game asks for every frame while a rider is aboard. */
  train(id: number): { id: number; kind: number; x: number; z: number; y: number; heading: number; v: number; wait: number; stops: number } | null {
    const t = this.trains[id]
    if (!t) return null
    const r = this.rails[t.rail]
    const p = along(r.points, t.s)
    const q = along(r.points, Math.max(0, Math.min(r.length, t.s - t.dir * 5)))
    const s = Math.max(0, Math.min(r.length, t.s))
    const y = r.heights ? profileAt(r.points, r.heights, s).y : (this.terrain?.heightAt(p.x, p.z) ?? 0)
    // the FLOOR, not the axle: a rider carried by this vehicle stands on its deck (render/rolling-stock.ts
    // `deck`), which on a cable car is most of a metre above the rail
    return { id, kind: r.kind, x: p.x, z: p.z, y: y + 0.25 + (this.stockPools[r.kind]?.kind.deck ?? 0.9), heading: Math.atan2(p.x - q.x, p.z - q.z),
      v: t.v, wait: t.wait, stops: r.stops.length }
  }

  private pools(): Pool[] {
    const out = [this.cars, this.buses, this.bodies, this.legs, this.arms, this.heads, this.hairs, this.bikes, this.blobs]
    for (const k of this.stockPools) if (k) for (const v of k.variants) out.push(v.mid, ...(v.head ? [v.head] : []), ...(v.tail ? [v.tail] : []))
    return out
  }

  get stats(): { vehicles: number; people: number } {
    return { vehicles: this.fleet ? this.fleet.count : this.cars.count + this.buses.count, people: this.bodies.count }
  }

  update(dt: number, vehicles: readonly Vehicle[], walkers: readonly Walker[], at: { x: number; z: number },
         skip?: ReadonlySet<number>, terrain?: Terrain, focus = at): void {
    this.terrain = terrain
    const groundAt = (p: { x: number; z: number }): number => terrain?.heightAt(p.x, p.z) ?? 0
    for (const p of this.pools()) p.begin()
    const sun = shadowOffset(DAYLIGHT.sun)

    /** Lay a blob under something `height` tall, `long` by `wide` on the ground, facing `heading`. */
    const blob = (at: { x: number; z: number }, heading: number, long: number, wide: number,
                  height: number): void => {
      const cx = at.x + sun.x * height * 0.5
      const cz = at.z + sun.z * height * 0.5
      // stretched along the sun, because that is what a shadow does
      const stretch = 1 + Math.hypot(sun.x, sun.z) * 0.55
      Matrix.ComposeToRef(
        new Vector3(wide, 1, long * stretch),
        Quaternion.RotationYawPitchRoll(heading, 0, 0),
        new Vector3(cx, 0.185 + groundAt({ x: cx, z: cz }), cz), this.m)
      this.blobs.push(this.m, 1, 1, 1, 0)
    }

    if (this.fleet) this.fleet.update(dt, vehicles, (x, z) => groundAt({ x, z }), blob)
    else for (const v of vehicles) {
      Matrix.ComposeToRef(
        Vector3.OneReadOnly,
        Quaternion.RotationYawPitchRoll(v.heading, 0, 0),
        new Vector3(v.at.x, 0.06 + (v.y ?? nearLevel(groundAt(v.at), v.level)), v.at.z), this.m)
      const pool = v.kind === 'bus' ? this.buses : this.cars
      pool.push(this.m, v.colour[0], v.colour[1], v.colour[2])
      blob(v.at, v.heading, v.kind === 'bus' ? 12 : 4.6, v.kind === 'bus' ? 3 : 2.1,
        v.kind === 'bus' ? 3.2 : 1.4)
    }

    walkers.forEach((w) => {
      // Everyone gets a shadow, including the ones wearing a real avatar-kit body — those are the people
      // NEAREST the camera, so they are exactly the ones whose feet are examined. Skipping the shadow along
      // with the box left the most visible people in the city hovering.
      blob(w.at, w.heading, 1.0, 0.8, 1.7 * w.height)

      // somebody who has been given a real body is not also drawn as a box
      if (skip?.has(w.id)) return
      const swing = Math.sin(w.phase) * (w.kind === 'run' ? 0.95 : 0.62)
      const rot = Quaternion.RotationYawPitchRoll(w.heading, w.kind === 'run' ? 0.12 : w.kind === 'cycle' ? 0.35 : 0, 0)
      const scale = new Vector3(1, w.height, 1)
      const wy = w.y ?? nearLevel(groundAt(w.at), w.level)
      if (w.kind === 'cycle') {
        // the bicycle under them, and the rider seated: lifted onto the saddle and leaning to the bars
        Matrix.ComposeToRef(new Vector3(1, 1, 1), Quaternion.RotationYawPitchRoll(w.heading, 0, 0),
          new Vector3(w.at.x, 0.02 + wy, w.at.z), this.m)
        this.bikes.push(this.m, w.shirt[0] * 0.5 + 0.1, w.shirt[1] * 0.5 + 0.1, w.shirt[2] * 0.5 + 0.1)
      }
      const lift = w.kind === 'cycle' ? 0.12 : 0
      const pos = new Vector3(w.at.x, 0.155 + wy + lift, w.at.z)   // standing on the pavement, not the road

      Matrix.ComposeToRef(scale, rot, pos, this.m)
      this.bodies.push(this.m, w.shirt[0], w.shirt[1], w.shirt[2])
      this.heads.push(this.m, w.skin[0], w.skin[1], w.skin[2])
      this.hairs.push(this.m, w.hair[0], w.hair[1], w.hair[2])

      // legs and arms pivot at the top of their box, which is why they swing from the hip and shoulder
      for (const [side, phase] of [[-1, swing], [1, -swing]] as const) {
        const hip = new Vector3(w.at.x, 0.155 + wy + lift + 0.92 * w.height, w.at.z)
        const hipOff = new Vector3(Math.cos(w.heading) * 0.09 * side, 0, -Math.sin(w.heading) * 0.09 * side)
        Matrix.ComposeToRef(scale,
          Quaternion.RotationYawPitchRoll(w.heading, phase, 0), hip.add(hipOff), this.m)
        this.legs.push(this.m, w.trousers[0], w.trousers[1], w.trousers[2])

        const shoulder = new Vector3(w.at.x, 0.155 + wy + lift + 1.52 * w.height, w.at.z)
        const shOff = new Vector3(Math.cos(w.heading) * 0.235 * side, 0, -Math.sin(w.heading) * 0.235 * side)
        Matrix.ComposeToRef(scale,
          Quaternion.RotationYawPitchRoll(w.heading, -phase * 0.7, 0), shoulder.add(shOff), this.m)
        this.arms.push(this.m, w.shirt[0], w.shirt[1], w.shirt[2])
      }
    })

    // trains: they run their line end to end and turn round, which is what a terminus looks like; the métro
    // on its viaduct slows into each station, stands there with its doors open, and pulls away
    // the cars as they stood last frame: what each tram looks out for of the OTHERS (owner, 2026-10-01: "streetcars go
    // right through each other" — lines share track on Market Street, and tracks cross)
    const others = this.transitBodies.slice()
    this.transitBodies.length = 0
    for (const [ti, t] of this.trains.entries()) {
      const rail = this.rails[t.rail]
      const kp = this.stockPools[rail.kind]
      const k = kp.kind
      const vp = kp.variants[t.variant]
      const trainLen = (k.cars - 1) * vp.pitch
      const street = rail.kind >= 2 && rail.kind <= 4
      if (t.wait > 0) {
        t.wait -= dt
      } else {
        // the next stop ahead: the head stops half a train past the station, so the train stands along it
        let brake = Infinity
        for (const st of rail.stops) {
          const at = st + t.dir * (trainLen / 2)
          const ahead = (at - t.s) * t.dir
          if (ahead >= -0.5 && ahead < brake && Math.abs(at - t.last) > 1) brake = ahead
        }
        const A = 0.9
        let target = Math.min(t.speed, Math.sqrt(2 * A * Math.max(0, brake)))
        /*
         * WHAT IS ON THE TRACK AHEAD (owner, 2026-10-01): a streetcar or a cable car brakes for the rider, a car or a
         * walker in its path, as a driver would, and stops a metre and a half short. Looked for along its heading from
         * the head car, within its own width; held more than 20 s, it moves on for 4 (the traffic's cars give way first:
         * theirs is 2 s).
         */
        if (street && (t.held ?? 0) < 20) {
          const head0 = along(rail.points, t.s)
          const h0 = along(rail.points, Math.max(0, Math.min(rail.length, t.s + t.dir * 3)))
          const fx = h0.x - head0.x, fz = h0.z - head0.z
          const fl = Math.hypot(fx, fz) || 1
          const ux = fx / fl, uz = fz / fl
          // (on its lane line, as it is drawn)
          if (t.shift) { head0.x += uz * t.shift; head0.z -= ux * t.shift }
          const halfLen = vp.shadow[0] / 2
          const halfWid = vp.shadow[1] / 2
          const look = halfLen + 4 + (t.v * t.v) / (2 * A)
          let gap = Infinity
          /*
           * ALONG ITS RAILS, not along a straight line (owner, 2026-10-03, 9th Ave & Irving: "since our trains can't bend,
           * they get stuck 100% of the time in the turn"). Looked for straight ahead, a train entering a 90° street turn
           * saw the cars queued in the cross street — and the other train round the corner — as on its track, and stood
           * 20 s, crept 4, stood again. Now the path ahead is sampled every metre along the rail (on its lane line), and
           * an obstacle is in the way only near that path.
           */
          const path: { x: number; z: number; d: number }[] = []
          for (let d = 0; d <= look + 6; d += 1) {
            const sd = Math.max(0, Math.min(rail.length, t.s + t.dir * d))
            const p = along(rail.points, sd)
            const q = along(rail.points, Math.max(0, Math.min(rail.length, sd + t.dir * 1)))
            const qx = q.x - p.x, qz = q.z - p.z, ql = Math.hypot(qx, qz) || 1
            if (t.shift) { p.x += (qz / ql) * t.shift; p.z -= (qx / ql) * t.shift }
            path.push({ x: p.x, z: p.z, d })
          }
          const consider = (x: number, z: number, hl: number, hw: number): void => {
            for (const p of path) {
              if (p.d < halfLen * 0.5) continue
              if (Math.hypot(x - p.x, z - p.z) < halfWid + Math.min(hw, hl) + 0.3) { gap = Math.min(gap, p.d - halfLen - hl * 0.5); return }
            }
          }
          if (!this.riderAboard) consider(at.x, at.z, 0.9, 0.3)
          for (const v of vehicles) if (Math.abs(v.at.x - head0.x) < 40 && Math.abs(v.at.z - head0.z) < 40) consider(v.at.x, v.at.z, (v.size?.len ?? 4.4) / 2, (v.size?.wid ?? 1.9) / 2)
          for (const w of walkers) if (Math.abs(w.at.x - head0.x) < 30 && Math.abs(w.at.z - head0.z) < 30) consider(w.at.x, w.at.z, 0.3, 0.3)
          for (const o of others) {
            if (o.id.startsWith(`${ti}:`) || Math.abs(o.x - head0.x) > 60 || Math.abs(o.z - head0.z) > 60) continue
            consider(o.x, o.z, o.len / 2, o.wid / 2)
          }
          if (gap < Infinity) target = Math.min(target, Math.sqrt(2 * A * Math.max(0, gap - 1.5)))
          t.held = target < 0.2 && gap < Infinity ? (t.held ?? 0) + dt : 0
        } else if ((t.held ?? 0) >= 20) {
          t.held = (t.held ?? 0) + dt
          if (t.held > 24) t.held = 0
        }
        t.v = t.v < target ? Math.min(target, t.v + A * dt) : target
        if (brake < 0.4 && t.v < 0.5) {
          // a métro train stands twenty seconds or so; a streetcar or a cable car at its stop, a dozen
          t.wait = rail.kind === 1 ? 18 + (t.rail % 4) * 3 : 8 + (t.rail % 3) * 3
          t.last = t.s + t.dir * brake
          t.v = 0
        }
        t.s += t.dir * Math.max(t.v, brake < Infinity ? 0.3 : 0) * dt
      }
      // a street track runs one way (`trackDirection`, decided once per train): set it going that way
      if (street && t.fixed === undefined && this.trackDirection) {
        // (undefined: its street is not in yet — asked again next frame)
        // (`shift`: metres to its right that put the car on the traffic's own lane line, not OSM's track — a tram
        // drawn on the track stood half a metre into the oncoming cars, and they stopped against its side)
        const d = this.trackDirection(rail.points)
        if (d !== undefined) {
          t.fixed = d.dir
          if (d.dir) t.dir = d.dir
          /*
           * At least half its own width and a bit off the centre line (owner, 2026-10-01: "the tracks should be far
           * enough apart that cars in opposite directions have no chance of collision. otherwise they'd deadlock"): two
           * trams passing each other clear by 0.4 m, and neither sees the other as in its way (`consider`).
           */
          const off = Math.max(d.lane, vp.shadow[1] / 2 + 0.2)
          t.shift = off - d.d
        }
      }
      if (t.s < 0 || t.s > rail.length) {
        if (t.fixed) {
          /*
           * A one-way track's end: the car leaves the line here and the next one starts at the far end — never turning
           * round on the same rails into the oncoming traffic. Not while the rider is looking: then it stands at the end.
           */
          const start = t.fixed > 0 ? 0 : rail.length
          const end = along(rail.points, Math.max(0, Math.min(rail.length, t.s)))
          const begin = along(rail.points, start)
          if (Math.hypot(end.x - focus.x, end.z - focus.z) > 160 && Math.hypot(begin.x - focus.x, begin.z - focus.z) > 160) { t.s = start; t.last = -1; t.spin = 0 }
          else {
            t.s = Math.max(0, Math.min(rail.length, t.s)); t.wait = 2
            /*
             * THE TURNTABLE (owner, 2026-10-03: "we should make the turntables function!"): a cable car standing at the
             * end of its line, in sight, is pushed round on the turntable there — half a turn in eight seconds — and
             * stands turned, as at Powell & Market, Hyde & Beach and Taylor & Bay.
             */
            if (rail.kind === 3) t.spin = Math.min(Math.PI, (t.spin ?? 0) + dt * Math.PI / 8)
          }
        } else {
          t.dir = (-t.dir) as 1 | -1; t.s = Math.max(0, Math.min(rail.length, t.s)); t.last = -1
          // a cable car going back the way it came is turned on the turntable first: it starts the turn facing the way
          // it arrived (−π) and is pushed round to its new heading while it stands (below)
          if (rail.kind === 3) { t.spin = -Math.PI; t.wait = Math.max(t.wait, 9) }
        }
      }
      // the turn on the turntable: half a turn in eight seconds
      if (t.spin !== undefined && t.spin < 0) t.spin = Math.min(0, t.spin + dt * Math.PI / 8)
      const head = along(rail.points, t.s)
      // near where is being looked at: the rider, or a frozen view's focus
      if (Math.hypot(head.x - focus.x, head.z - focus.z) > 420) continue
      for (let c = 0; c < k.cars; c++) {
        const s = t.s - t.dir * c * vp.pitch
        if (s < 0 || s > rail.length) continue
        const p = along(rail.points, s)
        // the rail's own direction from a chord that stays on it, then turned to the way of travel — the
        // old version reversed a train running b→a twice over, just as the walkers once did
        const s0 = Math.max(0, Math.min(rail.length - 4, s - 2))
        const a = along(rail.points, s0)
        const b = along(rail.points, s0 + 4)
        const heading = (t.dir > 0 ? Math.atan2(b.x - a.x, b.z - a.z) : Math.atan2(a.x - b.x, a.z - b.z)) + (t.spin ?? 0)
        if (t.shift) { p.x += Math.cos(heading) * t.shift; p.z -= Math.sin(heading) * t.shift }
        /*
         * On the grade. A cable car on Hyde Street's 21% has its ends two metres apart in height: set level at its
         * middle's height it buried its downhill end and hung its uphill end in the air. It takes the ground at its
         * two ends, and is pitched between them (Babylon's positive pitch drops the nose, so uphill is negative).
         */
        const railY = (q: number): number => {
          const qq = Math.max(0, Math.min(rail.length, q))
          return rail.heights ? profileAt(rail.points, rail.heights, qq).y : groundAt(along(rail.points, qq))
        }
        const half = vp.shadow[0] / 2
        const yF = railY(s + t.dir * half)
        const yB = railY(s - t.dir * half)
        // …except the GONDOLA's cabin, which hangs level as an inclined lift's does: a box tilted to the 24° track looks
        // the same climbing as descending, and the owner saw it "always going UP, even when you go down" (2026-10-02)
        const pitch = rail.kind === 5 ? 0 : -Math.atan2(yF - yB, 2 * half)
        Matrix.ComposeToRef(Vector3.OneReadOnly,
          Quaternion.RotationYawPitchRoll(heading, pitch, 0),
          new Vector3(p.x, 0.25 + (yF + yB) / 2, p.z), this.m)
        const pool = c === 0 && vp.head ? vp.head : c === k.cars - 1 && vp.tail ? vp.tail : vp.mid
        const liv = vp.liveries ? vp.liveries[t.rail % vp.liveries.length] : k.colour
        // a full pool drops the carriage; its shadow has to go with it, or a rail yard is full of trains that
        // are not there (user, 2026-09-22: "trains that randomly disappear - but leave their shadow")
        if (street) this.transitBodies.push({ id: `${ti}:${c}`, x: p.x, z: p.z, y: (yF + yB) / 2, heading, speed: t.wait > 0 ? 0 : t.v, len: vp.shadow[0], wid: vp.shadow[1], kind: rail.kind })
        if (!pool.push(this.m, liv[0], liv[1], liv[2])) continue
        blob(p, heading, vp.shadow[0], vp.shadow[1], vp.shadow[2])
      }
    }

    if (this.riderBlob) blob(this.riderBlob.at, this.riderBlob.heading, 2.0, 0.7, 1.6)

    for (const p of this.pools()) p.end()
  }
}

/** How far along a line its nearest point to `st` is, if that is within `within` metres of it. */
function stopAlong(points: { x: number; z: number }[], st: { x: number; z: number }, within: number): number | null {
  let best = { d: within, s: -1 }
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const l = Math.hypot(b.x - a.x, b.z - a.z)
    const t = l > 0 ? Math.max(0, Math.min(1, ((st.x - a.x) * (b.x - a.x) + (st.z - a.z) * (b.z - a.z)) / (l * l))) : 0
    const d = Math.hypot(a.x + (b.x - a.x) * t - st.x, a.z + (b.z - a.z) * t - st.z)
    if (d < best.d) best = { d, s: acc + t * l }
    acc += l
  }
  return best.s >= 0 ? best.s : null
}

function along(points: { x: number; z: number }[], s: number): { x: number; z: number } {
  // (copies, never the rail's own points: a caller moves what it gets — a tram onto its lane line)
  if (s <= 0) return { ...points[0] }
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dz = points[i].z - points[i - 1].z
    const d = Math.hypot(dx, dz)
    if (acc + d >= s) {
      const t = d === 0 ? 0 : (s - acc) / d
      return { x: points[i - 1].x + dx * t, z: points[i - 1].z + dz * t }
    }
    acc += d
  }
  return { ...points[points.length - 1] }
}
