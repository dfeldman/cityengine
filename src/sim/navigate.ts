/**
 * Where the rider is, and how steering works.
 *
 * **Steering is a declared intention, not a twitch input**, and that is forced by the platform rather than
 * chosen for taste. On Dandyhorse a game posts its state and polls roughly once a second, and a phone bridge's
 * button press arrives on that same poll. A rider at 25 km/h covers seven metres in the time it takes a press
 * to arrive. Anything that asked you to press LEFT *at* the corner would be unplayable — and on a trainer,
 * where your hands are on the bars and your eyes are on the screen, it would be unpleasant even if it worked.
 *
 * So the model is the one a real cyclist uses: you decide well before the junction.
 *
 *      approaching ──────────────────────── commit ──────── junction
 *      ↑                                    ↑               ↑
 *      the next junction is announced       the choice      the turn is taken;
 *      and its turns light up; pressing     latches; late   the next junction is
 *      left/right latches an intent you     presses apply   announced at once
 *      can change as often as you like      to the NEXT one
 *
 * The intent defaults to straight, so a rider who never touches a button rolls down the street they are on.
 * That matters: a game where inattention means stopping at every corner is a game you cannot ride while out
 * of breath.
 *
 * The commit distance is in seconds rather than metres — two seconds of travel at the current speed — because
 * the point is to be beyond the rider's reaction time, and a fixed twenty metres is an age at walking pace
 * and no warning at all at forty kilometres an hour.
 *
 * **FAST INPUT** (`fast = true`; owner, 2026-09-29: "this feels odd and unnatural for keyboard players, who are
 * used to real-time inputs — you press left, you go left immediately"). The slow model above stays for trainers
 * and the phone bridge, where a press can be a second late. On a keyboard:
 *
 *   * HOLDING a direction (`hold`) steers across the carriageway, 3 m/s sideways, and letting go leaves the rider
 *     where they are — no nudges in steps, no drifting back;
 *   * the TURN is decided at the corner, not before it: whatever is held — or was tapped a moment ago (`tap`) —
 *     when the rider reaches the start of the corner (`FAST_COMMIT_SECONDS`, never more than a 90° corner's own
 *     run-in) is the way they go; nothing held is straight on (or the GPS's exit);
 *   * a hold that has just taken a corner does not take the next one too until it is let go — the Haight's
 *     blocks are a few metres apart at some junctions;
 *   * still a path game: the rider never leaves the street, and a U-turn is still its own button.
 */
import { distance, type Point } from '../city/geo.ts'
import { profileAt } from '../city/terrain.ts'
import { available, exits, resolve, type CityGraph, type Exit, type Turn } from '../city/graph.ts'
import { mapEdgeAt } from '../city/ridegraph.ts'
import { cornerRadius } from './ride.ts'

/** What the rider may do at a node: `exits` on a map graph, `rideExits` on a ride graph. */
export type ExitsOf = (g: CityGraph, nodeId: number, arrivedOn: number | null) => Exit[]

/** How far past pass-through nodes `next()` looks for the real junction. */
const LOOK_PAST = 400
/** One exit this close to straight on is not a question, it is the street going on under another name. */
const PASS_THROUGH = (25 * Math.PI) / 180
const isPassThrough = (xs: Exit[]): boolean => xs.length === 1 && Math.abs(xs[0].angle) < PASS_THROUGH

export interface Position {
  /** the edge being travelled */
  edgeId: number
  /** metres from the edge's start node, always measured a→b */
  s: number
  /** true when travelling b→a, i.e. against the stored direction */
  reversed: boolean
}

export interface Junction {
  nodeId: number
  /** metres from the rider to it */
  ahead: number
  turns: Set<Turn>
  exits: Exit[]
  /** street names of the exits, for the HUD's "left onto Rue de Rivoli" */
  names: Partial<Record<Turn, string>>
  /**
   * Nowhere to go but back. A city is full of these — service yards, courtyards, streets cut off by a later
   * building — and a rider needs to be told before they arrive, not spun round at speed when they do.
   */
  deadEnd: boolean
  /**
   * One exit, nearly straight on: not a decision. Only reported when even LOOK_PAST metres of looking found
   * nothing else; the HUD does not announce it and the choice does not latch at it.
   */
  passThrough: boolean
}

/**
 * A corner, rounded: a quadratic Bézier from the point `t` metres before the node on the way in (p0), with
 * the node as its control point (p1), to the point `t` metres after it on the way out (p2). Computed once,
 * when the choice latches, and frozen until the rider is off it, so braking for the corner cannot reshape it
 * under them.
 */
interface Arc {
  nodeId: number
  /** the edge it leads onto */
  out: number
  p0: Point
  p1: Point
  p2: Point
  t: number
  /** the radius actually ridden, after t was clamped */
  r: number
  /** +1 a right turn, −1 a left */
  sign: number
}

/** Corners gentler than this are not rounded — the polyline is already smooth enough there. */
const ARC_MIN = (12 * Math.PI) / 180
/** The most a rider leans, however fast they take a corner. */
const MAX_LEAN = (20 * Math.PI) / 180

/** How many seconds before a junction the choice stops being changeable. */
export const COMMIT_SECONDS = 1.6
/** …but never less than this, or a stopped rider could never commit at all. */
export const COMMIT_MIN_METRES = 6
/** Fast input: the choice is made at the corner itself — this long before it, between these distances. */
export const FAST_COMMIT_SECONDS = 0.9
export const FAST_COMMIT_MIN = 4
/** a 90° corner's run-in (`cornerRadius(π/2)` · tan 45°): the arc starts no further back than this */
export const FAST_COMMIT_MAX = 7
/** Fast input: sideways speed while a direction is held, m/s (slow input's nudges ease at 1.5). */
export const FAST_LATERAL = 3
/** m/s across the street at a standstill, edging round a stopped car (`Navigator.sidestep`) */
export const EDGE_SPEED = 0.6
/** Fast input: a tap counts for this long before the corner, seconds of travel. */
export const FAST_TAP_SECONDS = 0.6

export class Navigator {
  private readonly g: CityGraph
  private pos: Position
  private intent: Turn = 'straight'
  private committed: Turn | null = null
  /** fast input (see the top of the file); slow — the trainer's declared intentions — otherwise */
  fast = false
  /** fast input: the direction held now, −1 left, +1 right */
  private held: -1 | 0 | 1 = 0
  /** …spent: it has taken a corner, and counts again only once let go */
  private heldSpent = false
  /** fast input: the last tap, and how far the rider had travelled when it came */
  private tapped: { dir: -1 | 1; at: number } | null = null
  /**
   * A specific exit asked for by its edge (BUGS.md #40): at a star junction left/straight/right cannot name
   * the street, so the HUD offers each exit by name and the GPS asks for its own edge. It wins over the turn
   * when the junction reached offers it, and is spent there.
   */
  private wantEdge: number | null = null
  /** ask for this exit (an edge leaving the junction ahead) */
  requestEdge(edgeId: number | null): void { this.wantEdge = edgeId }
  get requestedEdge(): number | null { return this.wantEdge }
  private lastNode: number | null = null
  /** the node where the rider last had to turn round, so the HUD can say so */
  turnedAroundAt: number | null = null
  /** metres travelled this session, which is what the platform integrates for distance */
  travelled = 0

  private readonly exitsOf: ExitsOf

  constructor(graph: CityGraph, start: Position, exitsOf: ExitsOf = exits) {
    this.g = graph
    this.pos = start
    this.exitsOf = exitsOf
  }

  /**
   * Put the rider somewhere else on the graph, mid-ride: the landmark menu and a click on the map move them in
   * place rather than reloading the page (BUGS.md #61). The trip's distance is kept — a jump is a change of
   * scene, not a new session — and whatever turn was asked for is dropped.
   */
  placeAt(pos: Position): void {
    this.pos = { ...pos }
    this.wantEdge = null
    this.committed = null
  }

  /** The map edge under the rider — the ride edge's own id on a map graph. */
  mapEdgeId(): number {
    return mapEdgeAt(this.edge, this.pos.s)
  }

  /** 1 straight after a U-turn, easing to 0 as the rider crosses to the other side of the road */
  private swap = 0
  /** metres right of the line the rider has been nudged to (item H), and where they are heading for */
  private offset = 0
  private offsetTarget = 0
  /**
   * The sideways offset actually DRAWN, eased toward `lateral()` as the rider travels — 0.3 m across per metre
   * along. A merged boulevard's carriageway offset (`lane`, often several metres) used to change in one frame
   * where the merged edge met an ordinary one, and the rider "jumped back onto the path near the next
   * intersection" (user report). Eased, a 5 m change takes about 17 m of riding.
   */
  private shown: number | null = null
  /** the corner coming up, once latched, and the one just taken while the rider is still on it */
  private arcAhead: Arc | null = null
  private arcBehind: Arc | null = null
  private speed = 0

  get position(): Position { return this.pos }
  /** how far right of its carriageway's centre the rider is riding (the steered/woven offset, without a merged boulevard's `lane`) */
  get sideOffset(): number { return this.offset }

  /**
   * Turn round, here, now.
   *
   * Without this, a rider who took a wrong turn — into a service road, a cul-de-sac, a street that leads
   * nowhere — had to ride it to the end before the dead-end logic would turn them. Flipping the direction
   * on the current edge is all a U-turn is to the graph. The one thing that must not be instant is which
   * side of the road they are on: keeping right means the new right is the old left, three metres away, so
   * the crossing is eased over the next few metres instead of teleported.
   */
  turnAround(): void {
    // a U-turn has its own easing (`swap`); no corner is rounded through it
    this.arcAhead = null
    this.arcBehind = null
    this.pos = { ...this.pos, reversed: !this.pos.reversed }
    this.intent = 'straight'
    this.committed = null
    this.tapped = null
    this.swap = 1
  }
  /**
   * EDGING ROUND A STOPPED CAR (owner, 2026-10-02: "it should be possible to go to the left or the right of a stopped
   * car. just not through … maybe very slowly"). Sideways movement otherwise comes only with travel along the street
   * (`advance`), so a rider stopped dead behind a car could neither steer nor be woven round it. At a standstill the
   * held direction — or the weave's strip — moves them across at a walking shuffle, never into a car beside them
   * (the fences), and never off the street.
   */
  sidestep(dt: number): void {
    if (dt <= 0) return
    const steering = this.fast && this.held !== 0
    let target = steering ? this.offset + this.held : this.weaveTarget
    if (target === null) return
    target = Math.max(-this.maxOffset, Math.min(this.maxOffset, target))
    if (this.fenceLo !== null) target = Math.max(target, Math.min(this.offset, this.fenceLo))
    if (this.fenceHi !== null) target = Math.min(target, Math.max(this.offset, this.fenceHi))
    const step = Math.max(-EDGE_SPEED * dt, Math.min(EDGE_SPEED * dt, target - this.offset))
    if (Math.abs(step) < 1e-5) return
    this.offset += step
    this.offsetTarget = this.offset
    if (steering) this.manualUntil = this.clock + Navigator.MANUAL_SECONDS
    const t = this.lateral()
    if (this.shown !== null) this.shown += Math.max(-EDGE_SPEED * dt, Math.min(EDGE_SPEED * dt, t - this.shown))
  }

  /**
   * Where the rider is, to put back (game.ts: a step that would take them INTO a standing car is undone — cars are
   * solid). Only within one street: a step that crossed a junction is not undone.
   */
  snapshot(): { pos: Position; offset: number; offsetTarget: number; shown: number | null; travelled: number } {
    return { pos: { ...this.pos }, offset: this.offset, offsetTarget: this.offsetTarget, shown: this.shown, travelled: this.travelled }
  }

  restore(s: ReturnType<Navigator['snapshot']>): void {
    this.pos = { ...s.pos }
    this.offset = s.offset
    this.offsetTarget = s.offsetTarget
    this.shown = s.shown
    this.travelled = s.travelled
  }

  /**
   * REVERSE (sim/ride.ts): back `metres` along the street the rider is on, and on round the corner into the one behind.
   */
  backUp(metres: number): void {
    const e = this.edge
    const room = this.pos.reversed ? e.length - this.pos.s : this.pos.s
    if (metres <= room) {
      const s = this.pos.reversed ? this.pos.s + metres : this.pos.s - metres
      this.pos = { ...this.pos, s }
    } else {
      /*
       * …and on BACK ROUND THE CORNER (owner, 2026-10-02, stuck just past a junction between a truck and a car: "I
       * can't back up, i can't move forward"): at the street's start the rider backs on into the street behind — the
       * one straight back, else the nearest — still facing the way they were going.
       */
      const node = this.pos.reversed ? e.b : e.a
      const xs = this.exitsOf(this.g, node, e.id)
      const back = xs.find((x) => x.turn === 'straight') ?? xs[0]
      const ne = back ? this.g.edges.get(back.edgeId) : undefined
      if (!ne) {
        this.pos = { ...this.pos, s: this.pos.reversed ? e.length : 0 }
      } else {
        const d = Math.min(ne.length, metres - room)
        // facing the node it came from: along `ne` toward `node`
        this.pos = ne.a === node ? { edgeId: ne.id, s: d, reversed: true } : { edgeId: ne.id, s: ne.length - d, reversed: false }
        this.arcAhead = null
        this.arcBehind = null
        this.committed = null
      }
    }
    // a held direction steers while backing, at half the forward rate, so the rider can pull out round the car
    if (this.fast && this.held !== 0) {
      let o = this.offset + this.held * metres * 0.8
      if (this.fenceLo !== null) o = Math.max(o, Math.min(this.offset, this.fenceLo))
      if (this.fenceHi !== null) o = Math.min(o, Math.max(this.offset, this.fenceHi))
      this.offset = Math.max(-this.maxOffset, Math.min(this.maxOffset, o))
      this.offsetTarget = this.offset
      this.manualUntil = this.clock + 1.5
    }
    const t = this.lateral()
    if (this.shown !== null) this.shown += Math.max(-metres, Math.min(metres, t - this.shown))
  }
  get edge() { return this.g.edges.get(this.pos.edgeId)! }
  /** the turn the rider has asked for, or has been locked into */
  get requested(): Turn { return this.committed ?? this.choice() }

  /** what the rider is asking for now: slow, the intent; fast, the hold, else a fresh tap, else the intent */
  private choice(): Turn {
    if (!this.fast) return this.intent
    if (this.held !== 0 && !this.heldSpent) return this.held < 0 ? 'left' : 'right'
    if (this.tapped && this.travelled - this.tapped.at <= Math.max(3, this.speed * FAST_TAP_SECONDS)) return this.tapped.dir < 0 ? 'left' : 'right'
    return this.intent
  }

  /** where the choice latches, metres before the junction */
  private commitDistance(speed: number): number {
    return this.fast
      ? Math.min(FAST_COMMIT_MAX, Math.max(FAST_COMMIT_MIN, speed * FAST_COMMIT_SECONDS))
      : Math.max(COMMIT_MIN_METRES, speed * COMMIT_SECONDS)
  }

  /**
   * Fast input: the direction held now (−1 left, 0 none, +1 right), every frame. Steers across the street while
   * held (see `advance`) and is the turn taken at the corner. Letting go stops the rider where they are.
   */
  hold(dir: -1 | 0 | 1): void {
    if (dir === 0) {
      // let go: stay put a moment, then ease back to the right (`home`)
      if (this.held !== 0) { this.offsetTarget = this.offset; this.manualUntil = this.clock + Navigator.MANUAL_SECONDS }
      this.heldSpent = false
    } else {
      // the rider's own hand beats the GPS's exit at the junction ahead
      this.wantEdge = null
    }
    this.held = dir
  }

  /** Fast input: a quick press — a turn at a corner just ahead, however briefly it was held. */
  tap(dir: -1 | 1): void {
    this.tapped = { dir, at: this.travelled }
    this.wantEdge = null
  }
  get isCommitted(): boolean { return this.committed !== null }

  /**
   * How far right of the centre line the rider rides: `offset` (steered, woven, or resting at `home`, the right-hand
   * side since 2026-09-29) plus the carriageway's own offset from the drawn line (`lane`, a boulevard drawn twice).
   *
   * History: keeping right was tried once and went wrong in play — the rider came out of turns on the wrong side,
   * close to the buildings, on streets whose OSM centre line is off-centre — so from 2026-09-21 the rider rode
   * the middle. Now back, 1.2 m in from the kerb rather than at the 0.8 m limit, for that off-centre slack.
   */
  private lateral(): number {
    return this.offset + (this.edge.lane ?? 0)
  }

  /** How far a nudge may take the rider: inside the carriageway, 0.8 m clear of its kerb. */
  private get maxOffset(): number {
    return Math.max(0, this.edge.width / 2 - 0.8)
  }

  /**
   * KEEP RIGHT (owner, 2026-09-29: "the bike should stay to the right of the road, not the center… we need to
   * avoid the sidewalk though"): where the rider rides when nothing else decides — 1.2 m in from the right kerb,
   * a little inside the 0.8 m limit, because some streets' OSM centre line is not quite mid-carriageway (the
   * reason riding down the middle was chosen once, `lateral`). The weaving aims for it too (`preferShift`).
   */
  private get home(): number {
    return Math.max(0, Math.min(this.maxOffset, this.edge.width / 2 - 1.2))
  }

  /** after steering by hand (a hold, a nudge), this many seconds before the rider eases back to `home` */
  private static readonly MANUAL_SECONDS = 2
  /** riding seconds (only moving counts), and until when the rider's own steering stands */
  private clock = 0
  private manualUntil = 0

  /**
   * Where the rider would like to be, as a shift from where they are (for `Traffic.weave`): their own steering while
   * it stands, the middle before a left turn, and otherwise `home`, the right-hand side.
   */
  get preferShift(): number {
    if (this.clock < this.manualUntil || (this.fast && this.held !== 0)) return 0
    return this.restingTarget() - this.offset
  }

  /** where the rider rests with no hand on the bars and no traffic in the way */
  private restingTarget(): number {
    const j = this.next()
    const commit = this.commitDistance(this.speed)
    const turning = !!j && !j.passThrough && (this.fast ? this.isCommitted : j.ahead < 2 * commit + 4)
    // a left turn is made from the middle of the road, as a cyclist does; a right one from the right
    return turning && this.requested === 'left' ? 0 : this.home
  }

  /**
   * Drift across the carriageway (item H): 1.5 m a press, eased over about a second, never nearer the kerb
   * than 0.8 m. It is free steering only where free steering is harmless — the game sends a press here only
   * when the next junction is well away — and it re-centres on the approach to a junction, so a corner
   * always starts from the line. `0` asks to come back to the middle.
   */
  nudge(dir: -1 | 0 | 1): void {
    // `0`: back to the rider's own line (keep right), at once
    if (dir === 0) { this.manualUntil = 0; this.offsetTarget = this.home; return }
    this.offsetTarget = Math.max(-this.maxOffset, Math.min(this.maxOffset, this.offsetTarget + 1.5 * dir))
    this.manualUntil = this.clock + Navigator.MANUAL_SECONDS
  }

  /** Where the rider has been nudged to, in metres right of the line. */
  get nudged(): number { return this.offset }

  /** How far the rider may move across from where they are now: `left` ≤ 0, `right` ≥ 0, metres (for weaving). */
  get room(): { left: number; right: number } {
    return { left: -this.maxOffset - this.offset, right: this.maxOffset - this.offset }
  }

  /**
   * WEAVING (sim/traffic.ts `weave`): steer across to this offset, metres right of the line — past stopped traffic —
   * overriding the nudge and the re-centring before a junction while it is set; null lets go and the rider stays
   * wherever they are across the street.
   */
  /**
   * THE CARS ALONGSIDE (owner, 2026-10-01: "i can go through cars from the side"): this frame the rider may not move
   * across past these offsets, metres right of the line (sim/traffic.ts `alongside`). Steering by hand, weaving, the
   * re-centring — all of it stops at the side of the car next to the rider. Null: no limit.
   */
  fence(lo: number | null, hi: number | null): void { this.fenceLo = lo; this.fenceHi = hi }
  /** the direction the rider last moved across (−1, 0, 1), and for how long they have been asked to go the other way */
  private lastSide = 0
  private reverseFor = 0
  private fenceLo: number | null = null
  private fenceHi: number | null = null

  weaveTo(offset: number | null): void {
    this.weaveTarget = offset === null ? null : Math.max(-this.maxOffset, Math.min(this.maxOffset, offset))
  }
  private weaveTarget: number | null = null

  /**
   * Where the rider is, in local metres — on the centre line.
   *
   * This is the graph position, which is what the navigator reasons about and what the tests pin. Where the
   * rider actually SITS is `ridePoint`, a little to the right of it.
   *
   * `s` is ALWAYS measured from the edge's `a` end, whichever way the rider is going — `reversed` says which
   * way they travel, not which way `s` counts. Mirroring it here as `length - s` put a rider entering a
   * reversed edge at the far end of it, so every other turn teleported them past the junction and sent them
   * back down the street they had just left. That is the bug that made turning feel broken.
   */
  at(): Point {
    return pointAlong(this.edge.points, this.pos.s)
  }

  /**
   * How high the ground is here and how steep it is, from the street's own profile.
   *
   * From the profile rather than from the terrain grid: the grid is sampled every twenty metres, and a grade
   * taken by differencing it steps at every cell boundary — which the trainer would faithfully reproduce as
   * a resistance that chatters. The street's own heights are smooth along the street, which is the only
   * direction the rider travels.
   */
  elevation(): { y: number; grade: number } {
    const e = this.edge
    const p = profileAt(e.points, e.heights, this.pos.s)
    // a rider going the other way up the same hill is going DOWN it
    return { y: p.y, grade: this.pos.reversed ? -p.grade : p.grade }
  }

  /**
   * How high the ROAD is `ahead` metres along, on the rider's own side of the junction — the height the
   * camera should be looking at, and the only honest answer on a bridge (BUGS.md #207).
   *
   * The chase camera used to take this from the terrain grid, which under the Golden Gate Bridge is the SEA
   * BED: measured mid-span, the eye sat at -29 m and the aim at -85 m, a pitch of -73°, so the camera stared
   * through the deck and into the bridge's own structure for the whole crossing. The deck's height lives in
   * the ride edge's profile, exactly like the grade the trainer is given, so it is taken from there.
   *
   * Clamped to this edge rather than followed round the corner: at a junction the two edges agree at the
   * node, so the error is the grade over a few metres, and the caller eases it anyway.
   */
  elevationAhead(ahead: number): number {
    const e = this.edge
    const s = this.pos.reversed ? this.pos.s - ahead : this.pos.s + ahead
    return profileAt(e.points, e.heights, Math.max(0, Math.min(e.length, s))).y
  }

  /** Where the rider actually is: their side of the road, which is the right one. */
  ridePoint(): Point {
    const p = this.at()
    const h = this.heading()
    // mid-U-turn, still on the old side of the road and drifting across: +1 the new right, −1 the old one
    const t = this.swap * this.swap * (3 - 2 * this.swap)
    const off = (this.shown ?? this.lateral()) * (1 - 2 * t)
    // right of the direction of travel: forward is (sin h, cos h), so right is (cos h, −sin h)
    return { x: p.x + Math.cos(h) * off, z: p.z - Math.sin(h) * off }
  }

  /** The direction of travel here, as a bearing. */
  heading(): number {
    const e = this.edge
    const back = pointAlong(e.points, Math.max(0, this.pos.s - 2))
    const fwd = pointAlong(e.points, Math.min(e.length, this.pos.s + 2))
    // the polyline always runs a→b; a reversed rider is going the other way along it
    return this.pos.reversed
      ? Math.atan2(back.x - fwd.x, back.z - fwd.z)
      : Math.atan2(fwd.x - back.x, fwd.z - back.z)
  }

  /** The junction the rider is heading for, or null at a dead end with nowhere to go. */
  next(): Junction | null {
    const e = this.edge
    let nodeId = this.pos.reversed ? e.a : e.b
    let ahead = this.pos.reversed ? this.pos.s : e.length - this.pos.s
    let edgeId = this.pos.edgeId
    let xs = this.exitsOf(this.g, nodeId, edgeId)
    // past the nodes that are not questions, to the first one that is
    for (let guard = 0; guard < 50 && isPassThrough(xs) && ahead < LOOK_PAST; guard++) {
      const on = this.g.edges.get(xs[0].edgeId)!
      ahead += on.length
      edgeId = on.id
      nodeId = xs[0].to
      xs = this.exitsOf(this.g, nodeId, edgeId)
    }
    const names: Partial<Record<Turn, string>> = {}
    for (const x of xs) if (!names[x.turn]) names[x.turn] = this.g.edges.get(x.edgeId)?.name
    return { nodeId, ahead, turns: available(xs), exits: xs, names, deadEnd: xs.length === 0,
      passThrough: isPassThrough(xs) }
  }

  /**
   * The rider asking to turn. Accepted until the choice commits, and a press after that applies to the NEXT
   * junction rather than being dropped — a rider who presses a moment too late meant to turn, and silently
   * discarding it feels broken in a way that taking the next left does not.
   */
  request(turn: Turn): void {
    this.intent = turn
    this.wantEdge = null
  }

  /** Press-to-cycle, for a single-button bridge or a d-pad with only two keys wired. */
  cycle(direction: -1 | 1): void {
    const order: Turn[] = ['left', 'straight', 'right']
    const i = order.indexOf(this.intent)
    this.intent = order[Math.min(order.length - 1, Math.max(0, i + direction))]
  }

  /**
   * Advance by `metres`, crossing as many junctions as that takes. Returns the junctions crossed, so the HUD
   * can announce a turn as it happens.
   */
  advance(metres: number, speed: number): number[] {
    const crossed = this.step(metres, speed)
    this.speed = speed
    // the nudge: toward its target at 1.5 m/s of travel-time, back to the middle near a junction, and never
    // wider than this street allows (a new street may be narrower than the last)
    const j = this.next()
    const commit = this.commitDistance(speed)
    /*
     * Back to the middle before a junction only when TURNING there: a corner starts from the line. Going straight
     * on keeps the rider where they chose to be — re-centring before every junction undid nearly every nudge on
     * short blocks (owner, 2026-09-29: "nudging also doesn't actually work a lot of the time").
     */
    // fast input: a held direction pulls the target along ahead of the rider, so the drift is steady and stops
    // the moment it is let go (`hold`); the rider's hand wins over the automatic weave
    const steering = this.fast && this.held !== 0
    if (speed > 0.1) this.clock += metres / speed
    if (steering) this.offsetTarget = this.offset + this.held * 1.5
    else if (this.weaveTarget !== null) this.offsetTarget = this.weaveTarget
    // the rider's own steering stands a moment; after that, back to the right (or the middle, for a left turn)
    else if (this.clock >= this.manualUntil) this.offsetTarget = this.restingTarget()
    void j; void commit
    this.offsetTarget = Math.max(-this.maxOffset, Math.min(this.maxOffset, this.offsetTarget))
    // never across into the side of a car (`fence`): a limit that the rider is already past only stops them going further
    if (this.fenceLo !== null) this.offsetTarget = Math.max(this.offsetTarget, Math.min(this.offset, this.fenceLo))
    if (this.fenceHi !== null) this.offsetTarget = Math.min(this.offsetTarget, Math.max(this.offset, this.fenceHi))
    // sideways at 1.5 m/s (3 m/s under a held key); the step's duration is recovered from how far it went at
    // what speed — so there is no steering at a standstill
    const stepMax = speed > 0.1 ? (steering ? FAST_LATERAL : 1.5) * (metres / speed) : 0
    /*
     * HYSTERESIS on the way across (owner, 2026-10-01: squeezed between the kerb and the cars, the rider "flip[s] back
     * and forth on each frame between leaning slightly left and leaning slightly right"; measured, the offset alternating
     * 0.476 / 0.448 / 0.475 / 0.447 m frame after frame). The fence, the weave and the rest each ask from where the rider
     * is THIS frame, and two of them a few centimetres apart traded the target from side to side. Now the rider only
     * turns back the other way once it has been asked to for a quarter of a second; until then they hold still across.
     */
    let step = Math.max(-stepMax, Math.min(stepMax, this.offsetTarget - this.offset))
    const dir = Math.abs(step) < 1e-4 ? 0 : Math.sign(step)
    const dt = speed > 0.1 ? metres / speed : 0
    // (only for the automatic ones: the rider's own steering and nudges turn back at once)
    const byHand = steering || this.clock < this.manualUntil
    if (!byHand && dir !== 0 && this.lastSide !== 0 && dir !== this.lastSide) {
      this.reverseFor += dt
      if (this.reverseFor < 0.25) step = 0
      else { this.lastSide = dir; this.reverseFor = 0 }
    } else {
      this.reverseFor = 0
      if (dir !== 0) this.lastSide = dir
    }
    this.offset += step
    this.offset = Math.max(-this.maxOffset, Math.min(this.maxOffset, this.offset))
    const target = this.lateral()
    if (this.shown === null) this.shown = target
    else this.shown += Math.max(-0.6 * metres, Math.min(0.6 * metres, target - this.shown))
    this.prepareArc(speed)
    // off the corner just taken: forget it
    if (this.arcBehind) {
      const e = this.edge
      const from = this.pos.reversed ? e.length - this.pos.s : this.pos.s
      if (this.pos.edgeId !== this.arcBehind.out || from >= this.arcBehind.t) this.arcBehind = null
    }
    return crossed
  }

  private step(metres: number, speed: number): number[] {
    const crossed: number[] = []
    this.swap = Math.max(0, this.swap - metres / 10)
    let remaining = metres
    this.travelled += metres

    // guard against a pathological graph sending the rider round a zero-length loop forever
    for (let guard = 0; guard < 64 && remaining > 0; guard++) {
      const e = this.edge
      const toEnd = this.pos.reversed ? this.pos.s : e.length - this.pos.s

      this.latch(speed)

      if (remaining < toEnd) {
        this.pos.s += this.pos.reversed ? -remaining : remaining
        // Latch again AFTER moving: a step that ends inside the commit distance has committed the rider,
        // and checking only on the way in meant the choice never latched at all on a short step.
        this.latch(speed)
        return crossed
      }

      // reached the junction
      remaining -= toEnd
      const nodeId = this.pos.reversed ? e.a : e.b
      const xs = this.exitsOf(this.g, nodeId, this.pos.edgeId)
      if (isPassThrough(xs)) {
        // not a junction: roll on, and keep whatever the rider asked for the real one ahead
        this.handOver(nodeId, xs[0].edgeId)
        const ne = this.g.edges.get(xs[0].edgeId)!
        const rev = ne.b === nodeId
        this.pos = { edgeId: ne.id, s: rev ? ne.length : 0, reversed: rev }
        continue
      }
      /*
       * The edge asked for (the planned route's) — among the exits offered, or, if the offer folded it into a
       * neighbour (two streets leaving within 20° are one choice, `rideExits`), among all of them. Yerba Buena's
       * Macalla Road and Old Macalla Road leave one junction side by side; only Old Macalla was offered, it is a
       * dead end, and an auto-routed rider went down it, turned round and went down it again (2026-09-30).
       */
      const byEdge = this.wantEdge === null ? undefined
        : xs.find((x) => x.edgeId === this.wantEdge) ?? exits(this.g, nodeId, this.pos.edgeId).find((x) => x.edgeId === this.wantEdge)
      const chosen = byEdge ?? resolve(xs, this.committed ?? this.choice())
      // fast input: the hold that took this corner is spent until let go, and a tap is used up
      if (this.fast && (this.committed ?? this.choice()) !== 'straight') {
        if (this.held !== 0) this.heldSpent = true
        this.tapped = null
      }
      this.wantEdge = null
      crossed.push(nodeId)
      this.lastNode = nodeId
      // A turn is spent when it is taken, so the default returns to straight — UNLESS the rider pressed
      // after the choice had already latched. That press was meant, it just arrived inside the last second
      // and a half, and carrying it to the next junction is what a rider on a real street would do.
      const late = !this.fast && this.committed !== null && this.intent !== this.committed
      this.committed = null
      this.intent = late ? this.intent : 'straight'

      if (!chosen) {
        // A dead end: turn round, which is the only thing a real rider could do. `s` does not move — the
        // rider is still at the same end of the same street — only the direction of travel flips. The game
        // slows them almost to a stop on the approach (see `game.ts`), so this is a rider turning their bike
        // round at walking pace rather than a direction that snaps at speed.
        this.pos = { edgeId: this.pos.edgeId, s: this.pos.reversed ? 0 : e.length, reversed: !this.pos.reversed }
        this.turnedAroundAt = nodeId
        this.arcAhead = null
        this.arcBehind = null
        return crossed
      }

      this.handOver(nodeId, chosen.edgeId)
      const ne = this.g.edges.get(chosen.edgeId)!
      // if the junction is this edge's `b` end, the rider enters at s = length and counts down
      const reversed = ne.b === nodeId
      this.pos = { edgeId: chosen.edgeId, s: reversed ? ne.length : 0, reversed }
    }
    return crossed
  }

  /** Latch the choice once the rider is inside the commit distance, so the turn cannot flip under them. */
  private latch(speed: number): void {
    if (this.committed !== null) return
    const commit = this.commitDistance(speed)
    // measured to the next REAL junction: a pass-through node on the way is not where the choice is made
    const e = this.edge
    const toEnd = this.pos.reversed ? this.pos.s : e.length - this.pos.s
    if (toEnd > commit) return
    const j = this.next()
    if (j && !j.passThrough && j.ahead <= commit) this.committed = this.choice()
  }

  get lastJunction(): number | null { return this.lastNode }

  /** The arc prepared for this node becomes the one being ridden out of — if it led where the rider went. */
  private handOver(nodeId: number, out: number): void {
    const a = this.arcAhead
    this.arcBehind = a && a.nodeId === nodeId && a.out === out ? a : null
    this.arcAhead = null
  }

  /**
   * Work out the corner ahead once the rider is inside the commit distance of it — which is when the exit is
   * known for certain. `t`, the distance the arc starts before the node, is what `cornerRadius` asks for,
   * clamped to the commit distance (so it never starts before the choice is fixed) and to 45% of either
   * edge; the radius is then recomputed so the arc still meets both straights.
   */
  private prepareArc(speed: number): void {
    const e = this.edge
    const nodeId = this.pos.reversed ? e.a : e.b
    const toEnd = this.pos.reversed ? this.pos.s : e.length - this.pos.s
    if (this.arcAhead && this.arcAhead.nodeId === nodeId) return
    this.arcAhead = null
    const commit = this.commitDistance(speed)
    if (toEnd > commit) return
    const xs = this.exitsOf(this.g, nodeId, e.id)
    if (xs.length === 0) return
    const chosen = isPassThrough(xs) ? xs[0] : resolve(xs, this.committed ?? this.choice())
    if (!chosen) return
    const theta = Math.abs(chosen.angle)
    if (theta < ARC_MIN || theta > Math.PI - 0.05) return
    const out = this.g.edges.get(chosen.edgeId)!
    const half = Math.tan(theta / 2)
    let t = cornerRadius(theta) * half
    t = Math.min(t, 0.45 * Math.min(e.length, out.length), commit)
    if (t < 0.5) return
    const back = this.pos.reversed ? t : e.length - t
    const outS = out.a === nodeId ? t : out.length - t
    const p1 = this.pos.reversed ? e.points[0] : e.points[e.points.length - 1]
    this.arcAhead = {
      nodeId, out: out.id, t, r: t / half, sign: Math.sign(chosen.angle),
      p0: pointAlong(e.points, back), p1, p2: pointAlong(out.points, outS),
    }
  }

  /**
   * Where the rider is DRAWN: on the rounded corner when they are on one, else exactly `at()`. A view on the
   * graph position — `s`, `at()` and everything the tests pin are untouched — so a bike takes a right angle
   * over several metres, leaning into it, instead of snapping 90° in one frame.
   */
  smoothed(): { point: Point; heading: number; lean: number } {
    const e = this.edge
    let arc: Arc | null = null
    let d = 0
    const toEnd = this.pos.reversed ? this.pos.s : e.length - this.pos.s
    const from = this.pos.reversed ? e.length - this.pos.s : this.pos.s
    if (this.arcAhead && toEnd < this.arcAhead.t) { arc = this.arcAhead; d = arc.t - toEnd }
    else if (this.arcBehind && this.arcBehind.out === e.id && from < this.arcBehind.t) {
      arc = this.arcBehind
      d = arc.t + from
    }
    if (!arc) return { point: this.ridePoint(), heading: this.heading(), lean: 0 }
    const u = Math.max(0, Math.min(1, d / (2 * arc.t)))
    const { p0, p1, p2 } = arc
    const a = (1 - u) * (1 - u)
    const b = 2 * u * (1 - u)
    const c = u * u
    const point = { x: a * p0.x + b * p1.x + c * p2.x, z: a * p0.z + b * p1.z + c * p2.z }
    const dx = 2 * (1 - u) * (p1.x - p0.x) + 2 * u * (p2.x - p1.x)
    const dz = 2 * (1 - u) * (p1.z - p0.z) + 2 * u * (p2.z - p1.z)
    // leaning INTO the corner by the lateral acceleration v²/R: negative is a lean to the right
    const lean = -arc.sign * Math.min(MAX_LEAN, Math.atan((this.speed * this.speed) / (arc.r * 9.81)))
    const heading = Math.atan2(dx, dz)
    // a merged boulevard's carriageway offset, blended from the edge in to the edge out through the corner
    // the drawn offset, eased (see `shown`) — it carries the carriageway change through the corner smoothly
    const off = this.shown ?? ((this.edge.lane ?? 0) + this.offset)
    return { point: { x: point.x + Math.cos(heading) * off, z: point.z - Math.sin(heading) * off }, heading, lean }
  }
}

/** A point `s` metres along a polyline, clamped to its ends. */
export function pointAlong(points: Point[], s: number): Point {
  if (s <= 0) return points[0]
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const d = distance(points[i - 1], points[i])
    if (acc + d >= s) {
      const t = d === 0 ? 0 : (s - acc) / d
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
        z: points[i - 1].z + (points[i].z - points[i - 1].z) * t,
      }
    }
    acc += d
  }
  return points[points.length - 1]
}

export function polylineLength(points: Point[]): number {
  let t = 0
  for (let i = 1; i < points.length; i++) t += distance(points[i - 1], points[i])
  return t
}
