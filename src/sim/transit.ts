/**
 * Taking the cable car.
 *
 * A rider who has just dragged a bike up Hyde Street should be able to put it on the next car and ride down,
 * and that has to feel like catching a cable car rather than like a teleport: **the vehicle keeps its own
 * timetable and the rider waits for it.** Nothing here moves a vehicle, speeds one up, or summons one. The
 * whole module is a state machine over vehicles somebody else is already simulating (`src/render/life.ts`
 * runs the trains along the baked rails, stops them at their stops and stands them there) plus two verbs the
 * rider presses: board, and get off.
 *
 *     off ──(a boardable vehicle within BOARD_NEAR — moving or standing, at any speed — and B)──▶ aboard
 *     aboard ──(B, anywhere there is a street within MAX_DROP)──▶ off, placed back on the ride graph
 *
 * Two things this is careful about, because both are the kind of fault that hides:
 *
 * 1. **Nothing may strand the rider off the graph.** Alighting asks a placer for the nearest ride-graph
 *    position; if the nearest is further than `MAX_DROP` the rider STAYS ABOARD and is told so, rather than
 *    being dropped into a rail yard with no street under them. `abandon()` is the escape hatch — it takes the
 *    best place it can get, and failing that the position the rider boarded from, which is by construction a
 *    real graph position.
 * 2. **A vehicle can vanish.** The line it runs on is streamed; a view can be rebuilt. If the vehicle the
 *    rider is on is not in the list any more, they are put off at its last known point on the next `alight`
 *    or `abandon`, never left following a ghost.
 *
 * The contract with the world is `VehicleView[]`, deliberately: the trains come from `Life.trainInfo()`, but
 * the Salesforce Park gondola is not a train on a rail and will be modelled elsewhere. Anything that can
 * report where it is and whether its doors are open can be ridden.
 */

/** What a rider may get on. Buses and the underground metro are not here, on purpose. */
export type TransitKind = 'cable' | 'streetcar' | 'gondola' | 'wheel'

/** A vehicle as the boarding logic sees it. `id` must be stable for as long as the vehicle exists. */
export interface VehicleView {
  id: string
  kind: TransitKind
  x: number
  z: number
  /** the deck height, in metres — a cable car on Hyde Street is metres above the rider who let it pass */
  y: number
  heading: number
  /** m/s now */
  speed: number
  /** standing at a stop with its doors open: the only moment boarding or alighting is offered */
  dwelling: boolean
  /** what to call it on the HUD: "Powell–Hyde cable car" */
  name?: string
}

/** A position on the ride graph, as `sim/navigate.ts` means it. */
export interface GraphPosition { edgeId: number; s: number; reversed: boolean }

/** Where the rider can be put back on the graph near `p`, and how far away that is. */
export type Placer = (p: { x: number; z: number }, heading: number) => { pos: GraphPosition; d: number } | null

/**
 * Close enough to swing aboard. Generous on purpose: the rider has no brakes, so at 14 m/s a ten-metre
 * window went past between one search and the next (the search runs every sixth frame while on foot).
 */
export const BOARD_NEAR = 20
/** Near enough to be told it is there and worth waiting for. */
export const SEE_NEAR = 70
/** how near the gondola's cabin is near enough (`update`) */
export const GONDOLA_NEAR = 35
/**
 * No longer a boarding condition — kept because the HUD and the tests still talk about a rider being "nearly
 * stopped", and because it is the threshold below which the rider counts as standing. Boarding stopped
 * requiring it on 2026-09-22; see `update`.
 */
export const BOARD_SPEED = 1.2
/** The furthest a rider may be put from where they got off. Beyond this they stay aboard. */
export const MAX_DROP = 30

const NAMES: Record<TransitKind, string> = { cable: 'cable car', streetcar: 'streetcar', gondola: 'gondola', wheel: 'ferris wheel' }

export type AlightResult =
  | { status: 'ok'; pos: GraphPosition }
  /** nowhere to put the rider: they stay aboard. The only refusal left — see `alight` */
  | { status: 'no-street' }

export class Transit {
  /** the vehicle the rider is on, as it was last seen */
  private on: VehicleView | null = null
  /** the graph position the rider boarded from — the last-resort place to put them back */
  private from: GraphPosition | null = null
  /** the best candidate to board, this frame */
  private candidate: VehicleView | null = null
  /** near enough to be worth mentioning, this frame */
  private seen: VehicleView | null = null
  /** true once the vehicle being ridden stopped being reported */
  private lost = false

  get aboard(): VehicleView | null { return this.on }
  get boardable(): VehicleView | null { return this.candidate }
  get vehicleLost(): boolean { return this.lost }
  /** where the rider is, when aboard: the vehicle's own place */
  get at(): { x: number; z: number; y: number; heading: number } | null {
    return this.on ? { x: this.on.x, z: this.on.z, y: this.on.y, heading: this.on.heading } : null
  }

  /**
   * Take in the world. Called every frame with the rider and every vehicle that could be ridden; vehicles of
   * other kinds simply need not be in the list, but a kind that is not boardable is ignored here too so a
   * caller cannot accidentally offer a BART train.
   */
  update(rider: { x: number; z: number; speed: number }, vehicles: readonly VehicleView[]): void {
    if (this.on) {
      const still = vehicles.find((v) => v.id === this.on!.id)
      if (still) { this.on = still; this.lost = false } else this.lost = true
      this.candidate = null
      this.seen = null
      return
    }
    let best: { v: VehicleView; d: number } | null = null
    let near: { v: VehicleView; d: number } | null = null
    for (const v of vehicles) {
      if (!(v.kind in NAMES)) continue
      const d = Math.hypot(v.x - rider.x, v.z - rider.z)
      if (d > SEE_NEAR) continue
      if (!near || d < near.d) near = { v, d }
      /*
       * NEAR IS ENOUGH. This used to require the vehicle to be DWELLING at a stop and the rider to be nearly
       * stopped beside it, which read well and was unplayable: the rider has no brakes by design (README,
       * "The descent is a headline feature"), and the stops have no paths to them, so meeting a cable car at
       * a stop at under 1.2 m/s was something that essentially never happened. User, 2026-09-22, after
       * riding past several: "I was NOT prompted to board any cable car... just get near a transit vehicle
       * to board it." So: near is the whole test. You can swing aboard a moving cable car, which is both
       * more fun and, as it happens, what people actually used to do.
       */
      // (the gondola's lower station stands back in Salesforce Plaza, 24 m off Mission Street, the nearest street a
      // bike is on: within reach of it, not of the kerb)
      // (and the ferris wheel's deck, set back in its lot off Jefferson Street)
      if (d > (v.kind === 'gondola' || v.kind === 'wheel' ? GONDOLA_NEAR : BOARD_NEAR)) continue
      if (!best || d < best.d) best = { v, d }
    }
    this.candidate = best?.v ?? null
    this.seen = near?.v ?? null
    this.seenAt = near?.d ?? 0
  }

  private seenAt = 0

  /**
   * The one line the HUD shows. Two stages on purpose: a rider who can see a cable car ahead on Hyde Street
   * should be told it is there while they can still get to it, and told which key boards it once they are
   * alongside.
   */
  prompt(): string | null {
    if (this.on) {
      if (this.lost) return `aboard the ${NAMES[this.on.kind]} · Esc to get off`
      // you may step off anywhere, so the key is always worth showing
      return `${this.on.name ?? NAMES[this.on.kind]} · B to get off`
    }
    if (this.candidate) return `B · board the ${this.candidate.name ?? NAMES[this.candidate.kind]}`
    if (this.seen) {
      const what = this.seen.name ?? NAMES[this.seen.kind]
      return this.seen.dwelling
        ? `${what} at the stop · ${Math.round(this.seenAt)} m`
        : `${what} · ${Math.round(this.seenAt)} m`
    }
    return null
  }

  /**
   * Get on. `from` is where the rider is on the graph now, kept for the whole journey so there is always
   * somewhere real to put them back. Refused unless `update` found a vehicle to board this frame.
   */
  board(from: GraphPosition): boolean {
    if (!this.candidate) return false
    this.on = this.candidate
    this.from = { ...from }
    this.candidate = null
    this.seen = null
    this.lost = false
    return true
  }

  /**
   * Get off — ANYWHERE, so long as there is a street to step onto. A refusal leaves the rider exactly where
   * they were, aboard, which is the whole point: there is no path through here that ends with a rider in a
   * field.
   *
   * Waiting for a stop used to be required. It was the mirror of the boarding rule and went the same way,
   * for the same reason (user, 2026-09-22: "I think you should be able to get off a streetcar anywhere you
   * want, it is too restrictive to wait for a stop"). Once you can swing aboard a moving car it is strange
   * not to be able to swing off one, and being carried past where you wanted to go — with no brakes to
   * correct with afterwards — is worse than the small oddity of stepping off between stops.
   *
   * `MAX_DROP` still governs: off a viaduct, over water, or through a yard there is no street within reach
   * and the rider stays aboard and is told so. That is the part that must not be relaxed.
   */
  alight(place: Placer): AlightResult {
    const v = this.on
    if (!v) return { status: 'no-street' }
    const got = place({ x: v.x, z: v.z }, v.heading)
    if (!got || got.d > MAX_DROP) return { status: 'no-street' }
    this.on = null
    this.from = null
    this.lost = false
    return { status: 'ok', pos: got.pos }
  }

  /**
   * The escape hatch: get off wherever, now. The nearest graph position however far it is, and failing even
   * that, the position boarded from. Used when the rider insists (Escape) and when the vehicle has gone.
   */
  abandon(place: Placer): GraphPosition | null {
    const v = this.on
    if (!v) return null
    const got = place({ x: v.x, z: v.z }, v.heading)
    const pos = got?.pos ?? this.from
    this.on = null
    this.from = null
    this.lost = false
    return pos ? { ...pos } : null
  }
}
