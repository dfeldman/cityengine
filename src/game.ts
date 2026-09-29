/**
 * The ride itself: a city, a rider on it, a camera behind them and a HUD.
 *
 * Standalone the controls are the keyboard; on Dandyhorse the same `Controls` interface is backed by the
 * platform session and nothing else here changes. See INTEGRATION.md.
 */
import { Color4 } from '@babylonjs/core/Maths/math.color'
import { Engine } from '@babylonjs/core/Engines/engine'
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera'
import { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Ray } from '@babylonjs/core/Culling/ray'
import '@babylonjs/core/Materials/standardMaterial'
import { setTimeOfDay, setWeather, type TimeOfDay, type Weather } from './render/facade-material.ts'
import { Rain } from './render/rain.ts'
import { DebugPanel, OrbitLook, copyText } from './ui/debug.ts'
import { Projection } from './city/geo.ts'
import { parseLatLon } from './ui/goto.ts'
import { asMassing, fringeLayer, massing } from './render/fringe.ts'
import { terracesLayer } from './render/terraces.ts'
import { MID, VIEW } from './render/city.ts'
import { MemoryTiles, TILE, tileKey, type CityIndex, type TileData } from './city/tiles.ts'
import { tilePreparer } from './render/prepare.ts'
import { ParkMap } from './city/park-area.ts'
import { plog } from './profile.ts'
import { quaysLayer } from './render/quays.ts'
import { LoadingScreen, welcomeScreen } from './ui/loading.ts'
import { LandmarkCard } from './ui/landmark-card.ts'
import { Plants } from './render/plants.ts'
import { quickMarksLayer } from './render/quickmarks.ts'
import { postersLayer } from './render/posters.ts'
import { Fountains, fountainManifest, wallaceLayer } from './render/fountains.ts'
import { bridgeStructuresLayer, PARIS_BRIDGES } from './render/bridge-structures.ts'
import { passagesLayer } from './render/passages.ts'
import { boatsLayer } from './render/boats.ts'
import { RiverTraffic, riverLine } from './render/river-traffic.ts'
import { regionKit } from './render/region-kits.ts'
import { metroSignsLayer } from './render/metrosigns.ts'
import { PathMap } from './render/pathmap.ts'
import { region } from './city/region.ts'
import { ambientOcclusion } from './render/depth.ts'
import { City, setupGroundLayers } from './render/city.ts'
import { Crowd } from './sim/crowd.ts'
import { Life } from './render/life.ts'
import { OverheadLines } from './render/overhead.ts'
import { streetRailsLayer } from './render/street-rails.ts'
import { stairsLayer } from './render/stairs.ts'
import { SF_STAIRWAYS } from './render/landmarks/sf/stairways.ts'
import { Sky } from './render/sky.ts'
import { Landmarks, landmarkManifest, packedIds } from './render/landmarks.ts'
import { Statues, statueManifest } from './render/statues.ts'
import { Traffic } from './sim/traffic.ts'
import { BakedCrowd } from './render/crowd-baked.ts'
import { Rider } from './render/rider.ts'
import { Signs, type SignedJunction } from './render/signs.ts'
import { Vegetation } from './render/vegetation.ts'
import { updateCartoonEye } from './render/cartoon-material.ts'
import { DAYLIGHT, updateEye } from './render/facade-material.ts'
import { updateWater } from './render/water-material.ts'
import { Hud } from './ui/hud.ts'
import { photoMode, setRegionFog } from './render/photo.ts'
import { watchHeap } from './render/heap.ts'
import { Minimap } from './ui/minimap.ts'
import { LocalControls, type Controls } from './controls.ts'
import type { Platform } from './platform.ts'
import { Tools } from '@babylonjs/core/Misc/tools'
import { Navigator, pointAlong } from './sim/navigate.ts'
import { Transit, type Placer, type TransitKind, type VehicleView } from './sim/transit.ts'
import { Ride, cornerRadius } from './sim/ride.ts'
import { addEdges, departureBearing, resolve, type CityGraph, type Edge } from './city/graph.ts'
import { locate, rideExits, type RideGraph } from './city/ridegraph.ts'
import { nearestOnGraph, planRoute, type Route } from './sim/route.ts'
import { SCENIC } from './city/scenic.ts'
import { unpackPoints, wholeWater, type CityPackage, type PackedArea, type PackedRail } from './city/package.ts'
import { loadRide, openCity } from './city/tilestore.ts'
import { PlantZones } from './city/zone-planting.ts'
import { mapEdges } from './city/ridefile.ts'
import type { AtlasManifest } from './render/buildings.ts'

const ASSETS = new URL('facades/', document.baseURI).href

/**
 * How thick a closed wood is drawn, against what the bake put there (`?veg=`, render/infill.ts).
 *
 * The bake's ceiling is `TILE_TREES = 380` a 200 m tile, set when the vegetation was thought to be what the
 * frame was spent on. BUGS.md #205 decomposed that and found ~7 ms of it was per-mesh overhead paid whether
 * a plant was drawn or not, and only ~0.12 ms per thousand plants — so the density the bake was capped at is
 * several times below what can be afforded. Until a bake raises the cap, the canopy is closed here.
 */
const CANOPY = 3

export async function game(canvas: HTMLCanvasElement, opts: {
  city: string; device: 'bike' | 'treadmill'; traffic?: 'none' | 'some' | 'busy'
  /** subsystems to leave out, for isolating a visual fault: sky, life, trees */
  without?: Set<string>
  /** when the ride happens; the sun, the sky and the lit windows all follow from it */
  time?: TimeOfDay
  weather?: Weather
  /** how many walkers near the rider get a real avatar-kit body */
  bodies?: number
  /** start on this edge instead of the city's own start */
  startEdge?: number
  /** `?at=lat,lon`: start on the rideable street nearest this point (the go-to, G or a paste) */
  at?: { lat: number; lon: number }
  /** go to a pasted "lat, lon" (ui/goto.ts); returns why not, or null as the page reloads */
  goTo?: (text: string, here?: boolean) => string | null
  /**
   * Hold the rider still. The shot harness needs the same frame every time: left running, the rider covers a
   * different distance depending on how long the avatar took to build and how fast the machine is, and two
   * screenshots meant to differ by one change end up differing by fifty metres of street as well.
   */
  freeze?: boolean
  /** on Dandyhorse: the session's controls, and what the game tells it (src/platform.ts) */
  platform?: Platform
  /** `?paths=1`: start with the ride-graph overlay on (J toggles it; render/pathmap.ts) */
  paths?: boolean
  /**
   * A raised camera, for judging the city rather than riding it. Rooflines, block shapes and the road
   * network are invisible from the saddle and obvious from thirty metres up, and most of what makes a city
   * look built rather than generated lives up there.
   */
  view?: 'ride' | 'high'
  /** road traffic (cars and buses): off unless asked for */
  cars?: boolean
  /**
   * How many times the baked tree count a CLOSED wood grows to at render time (render/infill.ts). The park
   * is thickened by default — *"parts of the real park feel like a forest"* — and `?veg=1` is the package
   * exactly as it was baked, which is what the before-and-after measurement wants.
   */
  veg?: number
  /** the merging of BUGS.md #205 (`?vegmerge=0` to measure without it) */
  vegMerge?: boolean
  /** debugging: ride this many metres from the start (at 15 km/h, asking for `turn`) before anything draws */
  advance?: number
  turn?: 'left' | 'straight' | 'right'
}): Promise<void> {
  const off = opts.without ?? new Set<string>()
  /*
   * Load-stage timings (tools/measure-load.ts): each mark is the milliseconds the stage since the previous one
   * took, so a slow stage is obvious as the city grows.
   */
  const marks: Record<string, number> = {}
  let lastMark = performance.now()
  const heapMB = (): number => Math.round(((performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0) / 1e6)
  // the loading screen (ui/loading.ts) follows the stages; `?freeze=1` shots and probes skip it
  let loading: LoadingScreen | null = opts.freeze ? null : new LoadingScreen(opts.city, opts.device)
  const mark = (name: string): void => {
    loading?.stage(name)
    const t = performance.now()
    marks[name] = Math.round(t - lastMark)
    marks[`${name}MB`] = heapMB()
    lastMark = t
  }
  ;(window as unknown as { __marks?: unknown }).__marks = marks
  let firstFrameAt = 0
  const [src, atlas] = await Promise.all([
    // the index now, the tiles as the rider needs them (city/tilestore.ts); a single-package city is cut up
    openCity(document.baseURI, opts.city),
    fetch(`${ASSETS}atlas.json`).then((r) => r.json()) as Promise<AtlasManifest>,
  ])
  loading?.city(src.index?.name ?? opts.city)
  // the city's landmarks, or its region's (the Marais and central Paris share Paris's)
  const landmarkList = await landmarkManifest(document.baseURI, opts.city, src.index.region)
  mark('fetched')
  const index = src.index
  // what the rest of the game reads of the city as a whole: the index's global part
  const pkg = {
    id: index.id, name: index.name, origin: index.origin, region: index.region, ground: index.ground,
    terrain: index.terrain, start: index.start, landmarks: index.landmarks, water: index.water, skyline: index.skyline,
    areas: [] as PackedArea[], rails: [] as PackedRail[],
  }
  /*
   * Where the open country is (city/park-area.ts), filled as tiles arrive and asked of the rider each frame:
   * a park is a place with its own air and its own rules, selected by AREA rather than by city so the same
   * seam serves the Presidio, Central Park and the Bois de Boulogne.
   */
  const parkStyle = region(index.region).park
  const parkMap = new ParkMap(parkStyle.minPieceM2)
  /** the rider's side of the park's edge, so the fog is rewritten on the crossing and not every frame */
  let inPark = false
  /*
   * And caught up every couple of seconds while the rider is IN the park: materials are created lazily as
   * tiles stream in, so one built after the crossing would otherwise keep the city's thin air and its tile
   * would be the one clear patch in a fogged wood. `photo.ts` solves the identical problem the identical
   * way, and the walk is a few dozen materials.
   */
  setInterval(() => { if (inPark) setRegionFog(scene, parkStyle.fogDensity) }, 2000)
  const prepare = tilePreparer(landmarkList, index, parkMap)
  /*
   * The ride graph first: it is global and baked (city/ridefile.ts) — the rider is steered through it, its
   * junctions carry the corner plaques — and it says where the ride starts, so the right tiles come first.
   */
  const mode = opts.device === 'treadmill' ? 'run' : 'bike'
  const baked = await loadRide(document.baseURI, opts.city, mode)
  if (!baked) throw new Error(`${opts.city} has no baked ride graph — npm run bake -- ${opts.city}`)
  const rides: RideGraph = baked
  mark('rideGraph')

  /*
   * Before anything is built. The materials read the look when they are created and the shadows are baked
   * with this sun, so choosing the hour later would leave a city lit at noon under a midnight sky.
   */
  setTimeOfDay(opts.time ?? 'day')
  // and then the weather on top of it, for the same reason and in this order: it modifies the hour it is
  setWeather(opts.weather ?? 'clear')

  const __t0 = performance.now()
  const engine = new Engine(canvas, true, { antialias: true }, true)
  plog('engine', Math.round(performance.now() - __t0))
  const __t1 = performance.now()
  const scene = new Scene(engine)
  scene.clearColor = new Color4(DAYLIGHT.fogColour.r, DAYLIGHT.fogColour.g, DAYLIGHT.fogColour.b, 1)
  setupGroundLayers(scene)
  plog('scene+ground', Math.round(performance.now() - __t1))
  const __t2 = performance.now()
  /*
   * WHERE THE CONTENT IS, for the ground and the depth occluder (BUGS.md #225, #230).
   *
   * Not from geometry: `City` has none at construction — its `pkg` is this meta with `edges: []`, and
   * buildings arrive per tile. The index's own tile list answers it instead, and better: every tile that
   * holds a building or an edge, at 200 m granularity, which is far finer than an occluder needs and costs
   * one pass over a list already in memory. In San Francisco the content reaches ~1.3 km past the box's
   * north edge, because Overpass returns whole ways — see #225, where Sausalito's buildings sat 265 m
   * outside the ground that was being drawn and showed straight through the hill in front of them.
   */
  const contentBox = ((): { x0: number; x1: number; z0: number; z1: number } | undefined => {
    let x0 = Infinity; let x1 = -Infinity; let z0 = Infinity; let z1 = -Infinity
    for (const t of index.tiles ?? []) {
      if (t.buildings === 0 && t.edges === 0) continue
      if (t.tx * TILE < x0) x0 = t.tx * TILE
      if ((t.tx + 1) * TILE > x1) x1 = (t.tx + 1) * TILE
      if (t.tz * TILE < z0) z0 = t.tz * TILE
      if ((t.tz + 1) * TILE > z1) z1 = (t.tz + 1) * TILE
    }
    return Number.isFinite(x0) ? { x0, x1, z0, z1 } : undefined
  })()
  const city = new City(scene, { name: pkg.name, ground: pkg.ground, region: pkg.region, terrain: pkg.terrain,
    water: pkg.water, box: index.box, walls: index.walls, contentBox }, atlas, ASSETS).omit(off)
  plog('City ctor', Math.round(performance.now() - __t2))
  /*
   * Streaming (PARIS_EXPAND §2): each tile, when it arrives, is prepared (landmarks' buildings out, restyles
   * in, render/prepare.ts), taken in by the City and its per-tile layers, added to the map graph the crowd
   * walks, and handed to whatever else wants it (the landmarks, the trains, the minimap). The tiles within
   * the mid ring of the start are in before the first frame; the rest follow the rider.
   */
  const prepared = new MemoryTiles(new Map())
  city.source = prepared
  city.viaductStations = (region(pkg.region).viaductStations ?? []).map((q) => new Projection(pkg.origin).toLocal(q))
  city.exists = (k) => src.has(k)
  const graph: CityGraph = { nodes: new Map(), edges: new Map() }
  const arrived: { raw: TileData; ready: TileData; edges: Edge[] }[] = []
  const listeners: ((a: { raw: TileData; ready: TileData; edges: Edge[] }) => void)[] = []
  /** be told of every tile, the ones already in first */
  const onTile = (f: (a: { raw: TileData; ready: TileData; edges: Edge[] }) => void): void => {
    listeners.push(f)
    for (const a of arrived) f(a)
  }
  /*
   * Two levels of a tile: FULL (streets, buildings, furniture, trees — taken in by the City) within VIEW + 2 of
   * the focus, which is every tile a built tile or its neighbourhood reads, and MASSING (its buildings only,
   * for the mid ring) out to MID + 1. Central Paris held a gigabyte with every tile full (PARIS_EXPAND §2).
   */
  const tileLevel = new Map<string, 'mid' | 'full'>()
  let keepArrived = true
  /** told of every tile's raw data, mid or full (the landmarks); the raw tiles seen before they subscribe */
  const anyTile: ((raw: TileData) => void)[] = []
  const seenRaw: TileData[] = []
  anyTile.push((raw) => { if (keepArrived) seenRaw.push(raw) })
  /*
   * The tile's own ground, for EVERY tile fetched — mid ring as well as full (BUGS.md #206k).
   *
   * `bringNow` returns before `city.ingest` for a mid tile, so registering the block there would have left
   * the fine ground stopping at the full ring: the mid ring's massing would stand on the coarse grid and
   * then jump when the tile was promoted, and the fine/coarse seam would sit a couple of hundred metres
   * from the rider rather than out at the edge of what is loaded. A block is 5 kB as `Int16`, so all 225
   * of them are about 1.2 MB — nothing against the 3 GB ceiling (#177), and `wantTiles` drops them with
   * the tile.
   */
  anyTile.push((raw) => {
    const [tx, tz] = raw.key.split(',').map(Number)
    city.terrain.addTile(tx, tz, raw.terrain)
  })
  // BUGS.md #164/#169/#179: per-tile timing, to find where `bring()` spends the load. Cheap (a handful of
  // performance.now() calls per tile) and left in — `window.__bringStats()` prints the summary on demand.
  const bringStats = { count: 0, loadMs: 0, prepareMs: 0, ingestMs: 0, mapEdgesMs: 0, addEdgesMs: 0,
    tailMs: 0, deferred: 0, worst: { key: '', ms: 0 } }
  ;(window as unknown as { __bringStats?: unknown }).__bringStats = () => ({ ...bringStats })
  /*
   * HOW MANY TILES MAY BE IN THE AIR, AND HOW MUCH OF A FRAME THEY MAY HAVE (BUGS.md #179).
   *
   * `wantTiles` used to fire `bring()` at every tile of the ring at once through one `Promise.all` — 225 at
   * the start, and about 30 every time a riding focus crosses a tile boundary. Nothing bounded them, so
   * every one of those tiles finished its fetch within a few milliseconds of the others and ran its
   * synchronous tail — prepare, ingest, mapEdges, addEdges, and then every listener (the landmarks, the
   * minimap, the vegetation, the crowd) — inside a single frame. That burst is the stutter: jumping across
   * the city measured p50 52 ms / p95 223 ms / max 1067 ms, a full one-second stall.
   *
   * Two bounds, and no change to WHAT is fetched:
   *   - at most `INFLIGHT` tiles between the request and the finished tail, so the tails are spread out;
   *   - at most `BUDGET` ms of tile work per animation frame, after which a tile waits for the next frame.
   * A tile is never dropped, only deferred, so the ring still fills — it fills over several frames instead
   * of inside one. The budget is off during the initial load, where there is no frame to protect yet and
   * waiting on rAF would only lengthen the loading screen.
   */
  // `?burst=1` restores the old unbounded behaviour, which is how the two are measured against each other
  const unbounded = new URLSearchParams(location.search).get('burst') === '1'
  /*
   * Twelve, not four. Bounding the in-flight count bounds the FETCH as well as the tail, and a tile's fetch
   * is a second or more of waiting on the server while costing the main thread nothing (measured: 2.9 s of
   * `loadMs` per tile against 5.9 ms of actual work). At four, the ring filled so slowly that the city took
   * 229 s to be ready against 37 s unbounded. Twelve — `TileStore.loadMany`'s own figure — keeps the fetches
   * saturated; it is the frame budget below, not this number, that protects the frame.
   */
  const INFLIGHT = unbounded ? Infinity : 12
  const BUDGET = unbounded ? Infinity : 6
  let inflight = 0
  const waiting: (() => void)[] = []
  const slot = (): Promise<void> => {
    if (inflight < INFLIGHT) { inflight++; return Promise.resolve() }
    return new Promise<void>((res) => waiting.push(res))
  }
  /** hand the slot straight to the next waiter, so the count never dips and lets a burst through */
  const freeSlot = (): void => { const n = waiting.shift(); if (n) n(); else inflight-- }
  let streaming = false
  let spent = 0
  const tick = (): void => { spent = 0; requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  const nextFrame = (): Promise<void> => new Promise<void>((res) => requestAnimationFrame(() => res()))

  const bring = async (k: string, full: boolean): Promise<void> => {
    const have = tileLevel.get(k)
    if (have === 'full' || (have === 'mid' && !full) || !src.has(k)) return
    tileLevel.set(k, full ? 'full' : 'mid')
    await slot()
    try {
      await bringNow(k, full)
    } finally {
      freeSlot()
    }
  }
  const bringNow = async (k: string, full: boolean): Promise<void> => {
    const t0 = performance.now()
    const raw = await src.load(k)
    let t1 = performance.now()
    if (!raw) return
    // the tile is here; the work it costs waits for a frame that can afford it
    if (streaming && spent > BUDGET) { bringStats.deferred++; await nextFrame(); t1 = performance.now() }
    const ready = prepare(raw)
    const t2 = performance.now()
    // the landmarks from every tile, near or far: an icon is seen from a kilometre and more
    for (const f of anyTile) f(raw)
    if (!full) {
      // what the mid ring's massing needs, and nothing else
      if (tileLevel.get(k) === 'mid') prepared.tiles.set(k, { ...ready, edges: [], areas: [], trees: [], pois: [], furniture: [], landmarks: [], rails: [], plantings: [] })
      spent += performance.now() - t1
      return
    }
    prepared.tiles.set(k, ready)
    city.ingest(ready)
    const t3 = performance.now()
    const fresh = mapEdges(ready.edges.filter((e) => !graph.edges.has(e.id)), city.terrain)
    const t4 = performance.now()
    addEdges(graph, fresh)
    const t5 = performance.now()
    bringStats.count++
    bringStats.loadMs += t1 - t0
    bringStats.prepareMs += t2 - t1
    bringStats.ingestMs += t3 - t2
    bringStats.mapEdgesMs += t4 - t3
    bringStats.addEdgesMs += t5 - t4
    const total = t5 - t0
    if (total > bringStats.worst.ms) bringStats.worst = { key: k, ms: Math.round(total) }
    const a = { raw, ready, edges: fresh }
    if (keepArrived) arrived.push(a)
    for (const f of listeners) f(a)
    /*
     * What this tile actually cost the frame — INCLUDING the listeners. `bringStats` stops at `addEdges`,
     * which is why the chain looked cheap (~215 ms over a 77-tile jump) while the frame stalled for a
     * second: the landmarks, the minimap, the vegetation and the crowd all run here, untimed. The budget
     * above counts the whole tail, so it throttles the real cost rather than the measured part of it.
     */
    const cost = performance.now() - t1
    spent += cost
    bringStats.tailMs += cost
  }
  /** the tiles round (x, z) asked for, nearest first, full near and massing further; resolves when all are in */
  let wasAt: { x: number; z: number } | null = null
  const wantTiles = (x: number, z: number, radius = MID + 1): Promise<void> => {
    const [cx, cz] = [Math.floor(x / TILE), Math.floor(z / TILE)]
    /*
     * ASK FOR WHAT IS AHEAD FIRST (BUGS.md #179). The ring is the same ring — extending it forward would
     * fetch tiles that the `keep` sweep below then drops again — but with the number of tiles in flight now
     * bounded, the ORDER decides what is ready when the rider gets there. Sorted by distance to the focus,
     * a tile entering the ring behind the rider competes with the one they are about to ride onto, and on a
     * fast descent (docs/DEMO.md corridor 1, California Street downhill) that is the tile that is late.
     *
     * The direction comes from where the focus has moved since the last call, a quarter of a second ago —
     * no heading convention to get wrong, and it is right for the orbit camera and the transit too. Half a
     * ring ahead: enough to win the tie, not so far that the tiles behind never come.
     */
    let lx = x, lz = z
    if (wasAt) {
      const dx = x - wasAt.x
      const dz = z - wasAt.z
      const d = Math.hypot(dx, dz)
      if (d > 1) { lx = x + (dx / d) * TILE * 2; lz = z + (dz / d) * TILE * 2 }
    }
    wasAt = { x, z }
    const jobs: [string, boolean, number][] = []
    for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dz))
      // the ring's membership and its level are the focus's; only the order is the direction of travel's
      const tx = (cx + dx) * TILE + TILE / 2
      const tz = (cz + dz) * TILE + TILE / 2
      jobs.push([tileKey(cx + dx, cz + dz), d <= VIEW + 2, Math.hypot(tx - lx, tz - lz)])
    }
    jobs.sort((p, q) => p[2] - q[2])
    /*
     * DROP WHAT IS OUT OF RANGE (BUGS.md #121). `TileStore.got` keeps the parsed JSON of every tile it has
     * ever fetched — buildings with their rings, streets, areas, the lot — and `forget()` existed but was
     * called from NOWHERE, so the raw data of every tile ever visited was retained for the session. Riding
     * hides it, because a rider crosses tiles slowly; JUMPING exposes it, because `__jump` and `?at=` sweep
     * in tiles from all over the city in seconds. Chrome's heap is a hard ~3 GB with no flag to raise it, so
     * the tab simply dies (owner, 2026-09-23: "it is crashing the game right now").
     *
     * Dropped one ring beyond the furthest thing that reads a tile (MID + 1), so a rider oscillating across a
     * boundary does not thrash: `bring()` refetches from the network cache if it comes back.
     */
    const keep = MID + 2
    for (const k of [...tileLevel.keys()]) {
      const [kx, kz] = k.split(',').map(Number)
      if (Math.max(Math.abs(kx - cx), Math.abs(kz - cz)) > keep) {
        tileLevel.delete(k)
        src.forget(k)
        prepared.tiles.delete(k)
        const [dx, dz] = k.split(',').map(Number)
        city.terrain.dropTile(dx, dz)
      }
    }
    return Promise.all(jobs.map(([k, full]) => bring(k, full))).then(() => undefined)
  }
  const first = startPoint(rides, index, opts)
  /*
   * START ON THE TILES YOU ARE STANDING ON, NOT ON ALL OF THEM (BUGS.md #164).
   *
   * This used to `await wantTiles(first.x, first.z)` at the default radius of MID + 1 = 7, which is a 15 x 15
   * block — 225 tiles fetched, parsed and ingested before the first frame could be drawn. The owner: "Loading
   * takes so long Chrome shows a dialog asking if you want to kill the process."
   *
   * Nine tiles is enough to stand on and to see the street you start on. The remaining 216 are exactly the
   * same call, unawaited: `bring()` already ingests each tile as it lands and notifies its listeners, because
   * tiles were always meant to stream — that is what the ring-dropping logic above exists for. So the rest of
   * the city fills in behind the player instead of in front of the loading screen.
   */
  const __t3 = performance.now()
  await wantTiles(first.x, first.z, 1)
  plog('wantTiles(radius1)', Math.round(performance.now() - __t3))
  void wantTiles(first.x, first.z)
  // from here on there is a frame to protect, so the tile work takes its slice of each one rather than all of it
  streaming = true
  mark('city')
  city.pickable = new URLSearchParams(location.search).get('pick') === '1'
  // and the city beyond the box, as plain massing, so it does not stop at a field (render/fringe.ts)
  // (the bake leaves out of the fringe every building the city itself has)
  city.addLayer(fringeLayer(scene, region(pkg.region), city.terrain, ASSETS, new Set<number>()))
  mark('fringe')
  // café terraces on the pavement, where the region sets them out (render/terraces.ts)
  // the mid ring (PARIS_EXPAND §2): every building of a far tile as plain massing, so the city has a horizon
  if (!off.has('fringe')) {
    city.midBuild = (t) => massing(scene, [...t.buildings.map(asMassing), ...t.fringe],
      region(pkg.region), city.terrain, ASSETS, `mid:${t.key}`)
  }
  if (region(pkg.region).furniture.terraces) city.addLayer(terracesLayer(scene, city.terrain))
  mark('terraces')
  // the river's parapets and the bouquinistes on the quays (render/quays.ts)
  city.addLayer(quaysLayer(scene, pkg, city.terrain, region(pkg.region).riverDrop ?? 0))
  // the bridges, each built once from its outline in its own design (render/bridge-structures.ts, BUGS.md #37)
  city.addLayer(bridgeStructuresLayer(scene, pkg, city.terrain, region(pkg.region).riverDrop ?? 0,
    pkg.region === 'paris' ? PARIS_BRIDGES : {}, (id) => city.coversOutline(id)))
  mark('quays')
  // the arches and covered ways that take streets through buildings (render/passages.ts)
  city.addLayer(passagesLayer(scene, city.terrain))
  // the buildings people steer by, marked by their kind: flags on the civic ones, towers on the churches (BUGS.md #41)
  city.addLayer(quickMarksLayer(scene, city.terrain, pkg.region))
  // moving water: the region's fountains, and a trickle from every Wallace fountain (render/fountains.ts)
  if (!off.has('fountains')) city.addLayer(wallaceLayer(scene, city.terrain))
  let fountains: Fountains | null = null
  if (!off.has('fountains')) {
    void fountainManifest(document.baseURI, pkg.region ? [opts.city, pkg.region] : [opts.city]).then((specs) => {
      const pr = new Projection(pkg.origin)
      fountains = new Fountains(scene, specs, (lat, lon) => pr.toLocal({ lat, lon }), city.terrain,
        (x, z) => city.waterLevelAt(x, z), () => landmarks?.placed ?? [])
    })
  }
  // the posters on the Morris columns, from the region's poster library (PARIS_EXPAND §6 item 9)
  if (!off.has('furniture')) city.addLayer(postersLayer(scene, city.terrain, pkg.region))
  // the péniches moored along the river (render/boats.ts)
  city.addLayer(boatsLayer(scene))
  // …and the boats under way on it (render/river-traffic.ts)
  let river: RiverTraffic | null = null
  if (!off.has('life')) void riverLine(document.baseURI, opts.city).then((pts) => { if (pts) river = new RiverTraffic(scene, pts, (x, z) => city.waterLevelAt(x, z),
    regionKit(pkg.region).fleet) })
  mark('passages')
  // the MÉTROPOLITAIN lettering on the Guimard entrances (render/metrosigns.ts)
  if (region(pkg.region).pointFurniture.metro === 'guimard') {
    city.addLayer(metroSignsLayer(scene, city.terrain, (x, z) => city.streetBearing(x, z)))
  }
  const sky = off.has('sky') ? null : new Sky(scene)
  const landmarks = off.has('landmarks') ? null
    : new Landmarks(scene, pkg, landmarkList, city.terrain, new URL(`landmarks/${pkg.region ?? opts.city}/`, document.baseURI).href)
  // each fitted to its own building as the tile with it arrives — the building as baked, before prepare took it out
  // the statues from the user's models, at most three in memory (render/statues.ts)
  const statues = off.has('landmarks') ? null : new Statues(scene, await statueManifest(document.baseURI, opts.city, pkg.region),
    pkg.origin, city.terrain, new URL('./', document.baseURI).href, () => landmarks?.placed ?? [])
  ;(window as unknown as { __statues?: unknown }).__statues = statues
  if (landmarks) {
    // a landmark that hand-builds a bridge or canopy suppresses the OSM way under it, the moment it is
    // placed and before any tile is handed over — see Landmarks.covers / City.coverRaised (BUGS.md #136)
    landmarks.onCover = (c) => city.coverRaised(c)
    for (const raw of seenRaw) landmarks.addTile(raw)
    anyTile.push((raw) => landmarks.addTile(raw))
  }
  mark('landmarks')
  const rain = opts.weather === 'rain' && !off.has('rain') ? new Rain(scene) : null
  /*
   * The rider is steered through the RIDE graph (city/ridegraph.ts): the streets, with the footways, the
   * driveways and the junctions drawn as four nodes taken out. Everything else — the ground, the crowd,
   * the traffic, the signs — keeps the map graph. Built here, before the signs, because the corner plaques
   * go at the junctions the rider is actually asked about.
   */
  /*
   * The ride graph, with the city's hand-made corrections: the Place de la Bastille is a tangle of lanes and
   * islands that no rule untangles, so inside it the graph is a circle and spokes (city/overrides.ts).
   */
  const junctions: SignedJunction[] = []
  for (const [id, node] of rides.nodes) {
    if (!node.edges.some((arr) => rideExits(rides, id, arr).length >= 2)) continue
    const arms = node.edges.map((eid) => rides.edges.get(eid)!).filter((e) => e.name)
      .map((e) => ({ name: e.name!, bearing: departureBearing(rides, e.id, id), width: e.width, walk: e.walk }))
    if (arms.length > 0) junctions.push({ at: node.at, arms })
  }
  // the names of real places, on boards above the shopfronts, and the streets' own names at the corners
  const noSign = new Set(landmarkList.filter((e) => e.sign === false).flatMap(packedIds))
  const signs = off.has('signs') ? null : new Signs(scene, pkg.id, region(pkg.region), city.terrain, junctions, noSign,
    (x, z) => parkMap.contains(x, z, TILE))
  if (signs) city.addLayer(signs)
  mark('signs')
  const level = opts.traffic ?? 'some'
  /*
   * No cars, by the user's decision (2026-09-21): "this is a fantasy with no cars" — the boxy models and
   * their straight-line driving looked wrong, and a city without them is a better ride. Trains, trams and
   * cable cars still run (they are drawn by Life from the rails, not by Traffic). `?cars=1` brings the road
   * traffic back for anyone working on it.
   */
  /*
   * `?traffic=<n>` and `?crowd=<n>` take a NUMBER — a density, beyond the named levels — for measuring what
   * this renderer can carry (owner, 2026-09-26: "can we up traffic to much larger numbers of people and cars?
   * Just for a quick test"). `busy` is density 11 and `crowded` is 95 per km; a number replaces those and the
   * range is widened with it, because packing more into the same 220 m only fills the near band.
   *
   * The RENDER POOLS are sized from the same numbers below. Left at their defaults (90 cars, 3000 people) a
   * raised density silently caps at the pool and nothing says so, which would make the measurement a lie.
   */
  const numArg = (name: string): number | null => {
    const v = new URLSearchParams(location.search).get(name)
    const n = v === null ? NaN : Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  const trafficN = numArg('traffic')
  const traffic = new Traffic(graph, trafficN !== null
    ? { density: trafficN, range: Math.max(220, 40 * Math.sqrt(trafficN)), clearance: 7 }
    : opts.cars ? level : 'none')
  // the crowd's own density: `?crowd=crowded` for a Saturday; the traffic level otherwise
  const crowdN = numArg('crowd')
  const crowdLevel = (new URLSearchParams(location.search).get('crowd') as 'none' | 'some' | 'busy' | 'crowded' | null) ?? level
  const crowd = new Crowd(graph, crowdN !== null
    ? { perKm: crowdN, range: Math.max(260, 26 * Math.sqrt(crowdN)) }
    : crowdLevel)
  mark('crowd')
  crowd.setWater(wholeWater(pkg).map((a) => ({ ring: unpackPoints(a.ring), holes: (a.holes ?? []).map(unpackPoints) })))
  /*
   * The pools follow the density asked for (see `numArg` above), with the shipped defaults when nothing is.
   * Generous multiples of the density, because the count is over the whole populated RANGE, not per km.
   */
  const budget = (trafficN !== null || crowdN !== null)
    ? {
        cars: Math.min(20000, Math.max(90, Math.round((trafficN ?? 11) * 120))),
        buses: Math.min(2000, Math.max(16, Math.round((trafficN ?? 11) * 8))),
        people: Math.min(40000, Math.max(3000, Math.round((crowdN ?? 95) * 60))),
      }
    : undefined
  if (budget) console.log('[density] pools', budget, 'traffic', trafficN, 'crowd', crowdN)
  const life = new Life(scene, pkg as unknown as CityPackage, budget, regionKit(pkg.region).stock, city.viaductStations)
  // the tram track in the street, and the wires over the electric track (render/street-rails.ts, overhead.ts)
  city.addLayer(streetRailsLayer(scene, city.terrain))
  // the public stairways as stairs (render/stairs.ts)
  city.addLayer(stairsLayer(scene, city.terrain, pkg.region === 'san-francisco' ? SF_STAIRWAYS : {}))
  const overhead = off.has('life') ? null : new OverheadLines(scene, city.terrain)
  onTile((a) => {
    // the tram stops first, so the tile's own lines find them
    life.addStops((a.ready.furniture ?? []).filter((f) => f.kind === 'tramstop'))
    life.addRails(a.ready.rails)
    overhead?.addRails(a.ready.rails)
  })
  mark('life')
  // `?without=rider` is how the city is compared with and without the avatar kit, which brings its own
  // lighting and image-processing opinions along with the body
  const rider = off.has('rider') ? null : Rider.create(scene, opts.device)
  /*
   * Every stranger is a real avatar-kit body, drawn by baked vertex animation (render/crowd-baked.ts).
   * The variants are built only once the rider's own body is on screen: the kit builds one body at a
   * time, and strangers queued ahead of the player meant the player rode the first seconds of every
   * session as a shadow with no one above it. Until they exist, the crowd is drawn as boxes.
   */
  let strangers: BakedCrowd | null = null
  void (rider?.ready ?? Promise.resolve()).then(() => {
    ;(window as unknown as { riderReady?: boolean }).riderReady = true
    if (off.has('life')) return
    const c = new BakedCrowd(scene, opts.bodies ?? 10)
    void c.ready.then(() => {
      strangers = c
      ;(window as unknown as { crowdReady?: boolean }).crowdReady = true
    })
  })
  const floraOf = regionKit(pkg.region).flora
  const trees = new Vegetation(scene, city.terrain, new URL('trees/', document.baseURI).href,
    floraOf?.((x, z) => new Projection(pkg.origin).toLatLon({ x, z })), opts.veg ?? CANOPY, opts.vegMerge !== false)
  if (!off.has('trees')) city.addLayer(trees.layer())
  mark('vegetation')
  // the models are a few megabytes, so the ride starts without them and they appear when they arrive
  // (`treesReady`: the shot tools wait for it — SF's forms are forty-odd models and take a while)
  if (!off.has('trees')) {
    void trees.load().catch((e) => console.warn('vegetation did not load:', e))
      .finally(() => { (window as unknown as Record<string, unknown>).treesReady = true })
  } else (window as unknown as Record<string, unknown>).treesReady = true
  // the shrubs and flower beds in the parks (render/plants.ts, PARIS_EXPAND §6 item 8)
  const plants = new Plants(scene, city.terrain, new URL('plants/', document.baseURI).href)
  // which shrubs grow where, by zone (map format v3; a v2 city has none and gets the defaults everywhere)
  if (index.zones?.length) plants.zones = new PlantZones(index.zones)
  if (!off.has('trees') && !off.has('plants')) {
    city.addLayer(plants.layer())
    void plants.load().catch((e) => console.warn('plants did not load:', e))
    ;(window as unknown as Record<string, unknown>).__plants = plants
  }
  // skyparks (docs/SKYPARKS.md): a landmark builder can plant a raised deck on itself (Salesforce Park, on
  // the Transit Center's roof); its ring only exists once the landmark's own tile has arrived, so this is
  // drained a few at a time below rather than read once here
  let decksPlanted = 0

  const controls: Controls = opts.platform ?? new LocalControls(() => opts.device)
  // ?start=<edgeId> drops the rider onto a particular street, which is how the shot harness samples the
  // city: road rendering goes wrong at junctions, and the start point is on a quiet straight.
  /*
   * Places are still named by MAP edge ids (the package's start, ?start=, the shot harness), and `locate`
   * finds them on the ride graph; a map edge the ride graph does not cover (a footway on a bike) falls back
   * to the city's own start.
   */
  const wanted = opts.at ? nearestStart(opts.at)
    : opts.startEdge && graph.edges.has(opts.startEdge)
      ? locate(rides, graph, opts.startEdge, graph.edges.get(opts.startEdge)!.length * 0.35) : null
  /** The rideable street nearest a lat/lon, and how far along it, for `?at=`. */
  /*
   * THE WHOLE CITY, NOT THE TILES YOU HAVE ALREADY LOADED (BUGS.md #178).
   *
   * This searched `graph.edges` — the STREAMED city graph, which holds only the tiles fetched so far — so a
   * jump could only ever land somewhere already loaded. The large map draws the whole city from the baked
   * ride graph (`minimap.setRide`), so the Embarcadero and Chase Center are plainly visible on it and simply
   * would not accept a jump. The owner: "the map window seems to show the much older box... I can't jump to
   * Embarcadero or Chase Center on the map as they are outside the OLD box." There was no old box; there was
   * the edge of what had streamed, which looks just like one.
   *
   * `rides` is global and baked, and carries every edge's points, so the nearest rideable point can be found
   * anywhere in the city without a tile being present. `locate()` cannot help here — it resolves a STREAMED
   * map edge back to its ride edge and returns null when the tile is absent — so the ride edge is used
   * directly, which is what `placeAt` wants anyway. Tiles for the destination stream in straight after, from
   * the `city.update` that follows the jump.
   */
  function nearestStart(ll: { lat: number; lon: number }): ReturnType<typeof locate> {
    const p = new Projection(pkg.origin).toLocal(ll)
    let onRide: { id: number; s: number; d: number } | null = null
    for (const e of rides.edges.values()) {
      let run = 0
      for (let i = 1; i < e.points.length; i++) {
        const a = e.points[i - 1]
        const b = e.points[i]
        const dx = b.x - a.x
        const dz = b.z - a.z
        const len = Math.hypot(dx, dz) || 1e-6
        const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (len * len)))
        const d = Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t)
        if (!onRide || d < onRide.d) onRide = { id: e.id, s: run + len * t, d }
        run += len
      }
    }
    return onRide ? { edgeId: onRide.id, s: onRide.s, reversed: false } : null
  }


  const start = wanted ?? locate(rides, graph, pkg.start.edgeId, pkg.start.s)
    ?? { edgeId: rides.edges.keys().next().value!, s: 0, reversed: false }
  const nav = new Navigator(rides, start, rideExits)
  // the ride graph drawn on the ground, for seeing how a junction really works (J; render/pathmap.ts)
  const paths = new PathMap(scene, rides, city.terrain, rideExits)
  mark('pathmap')
  // the quiet overlay is on by default (BUGS.md #30); ?paths=1 starts with the full one
  paths.setMode(opts.paths ? 'full' : 'subtle')
  // `?advance=40&turn=right&freeze=1` photographs the rider part-way round a corner: frozen, nothing moves,
  // so the corner has to be ridden up to before the first frame
  if (opts.advance) {
    nav.request(opts.turn ?? 'straight')
    for (let m = 0; m < opts.advance; m += 0.25) nav.advance(Math.min(0.25, opts.advance - m), 4.2)
  }
  const ride = new Ride()
  const hud = new Hud(document.getElementById('hud')!, () => (controls.press ? controls.press('back') : nav.turnAround()))
  // the landmark card (ui/landmark-card.ts): notes on the major landmark nearby, toggled with I
  const staticPlaces: { name: string; x: number; z: number }[] = []
  {
    const pr = new Projection(pkg.origin)
    for (const e of landmarkList) {
      if (!e.within) continue
      const pts = e.within.map(([lat, lon]) => pr.toLocal({ lat, lon }))
      staticPlaces.push({ name: e.name, x: pts.reduce((a, q) => a + q.x, 0) / pts.length, z: pts.reduce((a, q) => a + q.z, 0) / pts.length })
    }
    for (const l of pkg.landmarks ?? []) staticPlaces.push({ name: l.name, x: l.x, z: l.z })
  }
  const card = opts.freeze ? null : new LandmarkCard(function* () {
    yield* landmarks?.placed ?? []
    yield* staticPlaces
  })
  void card?.load(document.baseURI, pkg.region ? [opts.city, pkg.region] : [opts.city])
  hud.onExit = (edgeId) => {
    nav.requestEdge(edgeId)
    ownChoiceAt = nav.next()?.nodeId ?? null
  }
  const rideable = new Set([...rides.edges.values()].flatMap((e) => e.over.map((o) => o.id)))
  const minimap = new Minimap(document.getElementById('minimap') as HTMLCanvasElement, graph, {}, rideable)
  onTile((a) => minimap.addEdges(a.edges))
  // the whole city for the zoomed-out large map, and a click on it goes there (user: jump anywhere, for debugging)
  minimap.setRide([...rides.edges.values()].map((e) => e.points))
  // the baked box, so the map shows where the world actually ends (BUGS.md #163)
  minimap.box = index.box ?? null
  /*
   * The GPS (PARIS_EXPAND §6 item 11): a click on the large map sets the destination, shift-click goes there.
   * The route is re-planned from the rider every second (so a wrong turn is simply a new route), shown on the
   * minimap, and at each junction it asks for its own exit — unless the rider has pressed a turn themselves
   * for that junction, which always wins. Esc (or N) clears it.
   */
  let destination: { x: number; z: number } | null = null
  let route: Route | null = null
  let routedAt = 0
  let ownChoiceAt: number | null = null
  const replan = (): void => {
    if (!destination) { route = null; minimap.route = null; minimap.destination = null; paths.setRoute(null); return }
    route = planRoute(rides, nav.position, destination)
    minimap.route = route?.line ?? null
    minimap.destination = destination
    paths.setRoute(route ? [nav.position.edgeId, ...route.nodes.map((n) => route!.leave.get(n)!).filter((x) => x !== undefined)] : null)
  }
  // a preplanned route: its waypoints still to reach, and its name for the HUD
  let tour: { name: string; left: { x: number; z: number }[]; of: number } | null = null
  const clearRoute = (): void => { destination = null; tour = null; replan(); hud.gps(null) }
  /** what a destination is called: the nearest landmark within 150 m, else the street it ends on */
  const placeName = (p: { x: number; z: number }): string => {
    let best: { name: string; d: number } | null = null
    for (const l of [...(landmarks?.placed ?? []), ...(pkg.landmarks ?? [])]) {
      const d = Math.hypot(l.x - p.x, l.z - p.z)
      if (d < 150 && (!best || d < best.d)) best = { name: l.name, d }
    }
    if (best) return best.name.replace(/ — .*$/, '')
    const street = route ? rides.edges.get(route.target.edgeId)?.name : undefined
    return street ?? 'the pin'
  }
  const minutes = (m: number): string => `${Math.max(1, Math.round(m / (4.5 * 60)))} min at 16 km/h`
  const nextWaypoint = (): boolean => {
    if (!tour || tour.left.length === 0) return false
    destination = tour.left.shift()!
    replan()
    return true
  }
  const scenic = SCENIC[pkg.region ?? ''] ?? []
  if (scenic.length) {
    const menu = document.createElement('select')
    menu.className = 'sr-city sr-routes'
    menu.title = 'ride a preplanned route'
    menu.add(new Option('routes…', ''))
    // each route's length, leg by leg along the ride graph from its first stop
    const pr0 = new Projection(pkg.origin)
    for (const r of scenic) {
      const pts = r.waypoints.map(([lat, lon]) => pr0.toLocal({ lat, lon }))
      let km = 0
      for (let i = 1; i < pts.length; i++) {
        const s0 = nearestOnGraph(rides, pts[i - 1])
        const leg = s0 ? planRoute(rides, { edgeId: s0.edgeId, s: s0.s, reversed: false }, pts[i]) : null
        km += (leg?.length ?? Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z) * 1.3) / 1000
      }
      menu.add(new Option(`${r.name} — ${km.toFixed(1)} km`, r.name))
    }
    menu.addEventListener('keydown', (e) => e.stopPropagation())
    menu.addEventListener('change', () => {
      const r = scenic.find((q) => q.name === menu.value)
      menu.value = ''
      menu.blur()
      if (!r) return
      const pr = new Projection(pkg.origin)
      tour = { name: r.name, left: r.waypoints.map(([lat, lon]) => pr.toLocal({ lat, lon })), of: r.waypoints.length }
      nextWaypoint()
      hud.banner(r.name, `${tour.of} stops · first: ${placeName(destination!)}, ${((route?.length ?? 0) / 1000).toFixed(1)} km away`)
    })
    document.body.appendChild(menu)
  }
  minimap.onPick = (p, jump) => {
    if (jump) {
      if (!opts.goTo) return
      const ll = new Projection(pkg.origin).toLatLon(p)
      const why = opts.goTo(`${ll.lat}, ${ll.lon}`, true)
      if (why) debug.toast(why)
      return
    }
    destination = p
    tour = null
    replan()
    if (!route) { hud.banner('No route there', 'the pin is off the streets that can be ridden'); clearRoute(); return }
    hud.banner(`Destination: ${placeName(p)}`, `${(route.length / 1000).toFixed(1)} km · ${minutes(route.length)} · Esc clears`)
  }
  addEventListener('keydown', (e) => { if (e.code === 'Escape' || e.code === 'KeyN') clearRoute() })
  ;(window as unknown as Record<string, unknown>).__routeLeft = () => (route ? Math.round(route.length) : null)
  ;(window as unknown as Record<string, unknown>).__travelled = () => nav.travelled
  // where the rider is, for the bike/run switch to carry over (main.ts)
  ;(window as unknown as Record<string, unknown>).__here = () => { const ll = proj.toLatLon(lastAt); return `${ll.lat.toFixed(6)},${ll.lon.toFixed(6)}` }
  ;(window as unknown as Record<string, unknown>).__route = (lat: number, lon: number) => {
    destination = new Projection(pkg.origin).toLocal({ lat, lon })
    replan()
    return route ? { length: Math.round(route.length), junctions: route.nodes.length, turnRound: route.turnRound } : null
  }
  // everyone has subscribed: the tiles need not be kept for replaying any more
  keepArrived = false
  arrived.length = 0
  seenRaw.length = 0
  mark('minimap')
  minimap.landmarks = (pkg.landmarks ?? []).map((l) => ({ x: l.x, z: l.z, name: l.name, tier: l.tier }))
  const tier1 = (pkg.landmarks ?? []).filter((l) => l.tier === 1)

  addEventListener('keydown', (e) => {
    if (e.code !== 'KeyM' || (e.target instanceof HTMLElement && e.target.closest('input, textarea, select'))) return
    minimap.toggle()
    // the landmark search belongs to the large map: it arrives with it and leaves with it
    if (mapSearch) {
      mapSearch.classList.toggle('on', minimap.isLarge)
      // focused on the NEXT tick: focusing inside the keydown puts the M itself into the field
      if (minimap.isLarge) { const f = mapSearch; setTimeout(() => f.focus(), 0) }
      else { mapSearch.value = ''; mapSearch.blur() }
    }
  })

  /*
   * Public transport (src/sim/transit.ts). The vehicles are the ones `Life` is already running along the
   * baked rails; all that happens here is that the rider is allowed onto one of them, and their position
   * comes from the vehicle instead of from the graph until they get off.
   *
   * Only the surface streetcar and cable-car track — kinds 2 and 3 in `Life` (tram track, and tram track
   * with no power). Kind 0 is the main line, kind 1 the métro, kind 4 Muni Metro's light rail: none of
   * those is something a rider wheels a bike onto.
   */
  const transit = new Transit()
  const BOARDABLE = new Map<number, TransitKind>([[2, 'streetcar'], [3, 'cable']])
  const vehicleView = (t: { id: number; kind: number; x: number; z: number; y: number; heading: number; v: number; wait: number }): VehicleView => ({
    id: String(t.id), kind: BOARDABLE.get(t.kind) ?? 'streetcar', x: t.x, z: t.z, y: t.y,
    heading: t.heading, speed: t.v, dwelling: t.wait > 0,
  })
  /** every vehicle worth offering — or, while aboard, just the one being ridden */
  function transitViews(): VehicleView[] {
    const on = transit.aboard
    if (on) {
      const t = life.train(Number(on.id))
      return t ? [vehicleView(t)] : []
    }
    /*
     * Every boardable vehicle, stops or no stops. It used to require `t.stops > 0`, on the reasoning that a
     * line which never dwells can never be boarded — true while boarding meant "standing beside it at a
     * stop", and wrong since boarding became "near enough" (sim/transit.ts `update`). It was also a second
     * silent way to be offered nothing at all, on top of the dwelling test.
     */
    return life.trainInfo().filter((t) => BOARDABLE.has(t.kind)).map(vehicleView)
  }
  /**
   * Back onto the ride graph, facing the way the vehicle was going. `reversed` is chosen by comparing the
   * edge's own direction with the vehicle's heading, so a rider put down on Hyde Street is not facing back
   * up the hill they just came down.
   */
  const placeOnGraph: Placer = (p, heading) => {
    const got = nearestOnGraph(rides, p)
    if (!got) return null
    const e = rides.edges.get(got.edgeId)!
    const a = pointAlong(e.points, Math.max(0, got.s - 2))
    const b = pointAlong(e.points, Math.min(e.length, got.s + 2))
    const along = Math.atan2(b.x - a.x, b.z - a.z)
    let d = heading - along
    while (d > Math.PI) d -= 2 * Math.PI
    while (d < -Math.PI) d += 2 * Math.PI
    return { pos: { edgeId: got.edgeId, s: got.s, reversed: Math.abs(d) > Math.PI / 2 }, d: got.d }
  }
  /** Put the rider back on the street at `pos`, and let the city stream round where they now are. */
  function backOnStreet(pos: { edgeId: number; s: number; reversed: boolean }): void {
    nav.placeAt(pos)
    const p = nav.at()
    city.update(p.x, p.z)
    camHeading = nav.heading()
  }
  addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return
    if (e.code === 'Escape' && transit.aboard) {
      // the escape hatch: off, here, whatever it takes (sim/transit.ts `abandon`)
      const pos = transit.abandon(placeOnGraph)
      if (pos) backOnStreet(pos)
      hud.banner('Off the transit', 'put back on the nearest street')
      return
    }
    if (e.code !== 'KeyB') return
    if (transit.aboard) {
      const r = transit.alight(placeOnGraph)
      if (r.status === 'ok') { backOnStreet(r.pos); hud.banner('Off you get', placeName(nav.at())) }
      else hud.note('no street to get off onto here')
      return
    }
    const v = transit.boardable
    if (!v) return
    if (transit.board(nav.position)) {
      destination = null
      tour = null
      clearRoute()
      hud.banner(`Aboard the ${v.name ?? (v.kind === 'cable' ? 'cable car' : 'streetcar')}`, 'B to get off anywhere there is a street')
    }
  })

  // debugging: freeze and look around, and copy where you are (see ui/debug.ts)
  const orbit = new OrbitLook(canvas)
  const proj = new Projection(pkg.origin)
  let frozen = false
  let lastAt = { x: 0, z: 0 }
  let lastY = 0
  /**
   * A camera held exactly somewhere (tools/views.ts, `window.__view`): the view files store the best place to
   * see each landmark from, and the city streams round what is looked at, as it does for the orbit look.
   */
  let held: { from: Vector3; to: Vector3 } | null = null
  let lastWant = 0
  const debug = new DebugPanel(() => {
    held = null
    frozen = !frozen
    orbit.active = frozen
    if (frozen) {
      // start the look exactly where the chase camera already is, so freezing does not jump the view
      const l = orbit.look
      l.x = lastAt.x
      l.z = lastAt.z
      l.y = lastY + 1.5
      l.yaw = Math.atan2(-Math.sin(camHeading), -Math.cos(camHeading))
      l.pitch = 0.3
      l.dist = Math.max(4, camBack)
      orbit.lift = 0
    }
    debug.frozen(frozen)
  }, () => {
    const at = frozen ? { x: orbit.look.x, z: orbit.look.z } : lastAt
    const ll = proj.toLatLon(at)
    const text = `${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}`
    void copyText(text).then((ok) => debug.toast(
      `${ok ? 'copied' : 'could not copy'}  ${text}\nedge ${nav.mapEdgeId()}${nav.edge.name ? ` · ${nav.edge.name}` : ''}`
      + `   ?city=${opts.city}&start=${nav.mapEdgeId()}`))
  }, opts.goTo && (() => {
    const text = prompt('Go to — paste "lat, lon" (from Street View or Google Maps):')
    if (text) { const why = opts.goTo!(text); if (why) debug.toast(why) }
  }), () => {
    const mode = paths.cycle()
    debug.toast(mode === 'full'
      ? 'paths (full): blue streets, green paths, chevrons one-way; yellow = a junction with a choice, red = dead end;\n'
        + 'white = the edge you are on; the next junction\'s exits violet left, white straight, orange right'
      : mode === 'subtle' ? 'paths: quiet (J again for the full view)' : 'paths hidden')
  })
  // and pasting coordinates anywhere on the page goes there too
  addEventListener('paste', (e) => {
    if (!opts.goTo || (e.target instanceof HTMLElement && e.target.closest('input, textarea, select'))) return
    const text = e.clipboardData?.getData('text') ?? ''
    if (!parseLatLon(text)) return
    e.preventDefault()
    const why = opts.goTo(text)
    if (why) debug.toast(why)
  })
  /*
   * Jump to a landmark: a menu beside the city menu of every modelled landmark, restyled place and named
   * building, which goes there by the same road as a pasted "lat, lon" (ui/goto.ts).
   */
  /** the landmark search, shown with the large map (M) */
  let mapSearch: HTMLInputElement | null = null
  if (opts.goTo) {
    const where = new Map<string, { x: number; z: number }>()
    for (const l of landmarks?.placed ?? []) where.set(l.name, l)
    for (const e of landmarkList) {
      if (!e.restyle || !e.within || where.has(e.name)) continue
      const pts = e.within.map(([lat, lon]) => proj.toLocal({ lat, lon }))
      where.set(e.name, { x: pts.reduce((a, q) => a + q.x, 0) / pts.length, z: pts.reduce((a, q) => a + q.z, 0) / pts.length })
    }
    // every named landmark, not only tier 1: a search copes with hundreds of names where a menu could not
    for (const l of pkg.landmarks ?? []) if (!where.has(l.name)) where.set(l.name, l)
    /*
     * A SEARCH, not a dropdown (BUGS.md #168). Several hundred names in a `<select>` is a scroll nobody
     * finishes; typing "chase" and pressing Enter is the whole interaction. A `<datalist>` gives the
     * browser's own prefix/substring matching for free, so this stays a dozen lines.
     */
    const pick = document.createElement('input')
    pick.type = 'search'
    /*
     * ON THE MAP, not over the city (owner, 2026-09-24: "we do not need the landmarks dropdown to always be
     * visible, it can be on the map"). It appears with the large map (M) and goes with it.
     */
    pick.className = 'sr-mapsearch'
    pick.title = 'search the landmarks and go there'
    pick.placeholder = `search ${where.size} landmarks…`
    pick.autocomplete = 'off'
    const list = document.createElement('datalist')
    list.id = 'sr-landmark-list'
    for (const name of [...where.keys()].sort((a, b) => a.localeCompare(b, 'fr'))) list.appendChild(new Option(name, name))
    pick.setAttribute('list', list.id)
    const goToName = (): void => {
      const typed = pick.value.trim()
      if (!typed) return
      // exact match first, else the first name that contains what was typed — Enter should just work
      const key = where.has(typed) ? typed
        : [...where.keys()].find((n) => n.toLowerCase().includes(typed.toLowerCase()))
      if (!key) { debug.toast(`no landmark matching "${typed}"`); return }
      const ll = proj.toLatLon(where.get(key)!)
      pick.value = ''
      pick.blur()
      const why = opts.goTo!(`${ll.lat}, ${ll.lon}`, true)
      if (why) { debug.toast(why); return }
      // and the map gets out of the way: you asked to go there in order to LOOK at it
      if (minimap.isLarge) { minimap.toggle(); pick.classList.remove('on') }
      hud.banner(key, 'M for the map')
    }
    // the ride's keys (M, F, G, N, Escape…) must not fire while a name is being typed
    pick.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Enter') goToName()
      if (e.key === 'Escape') { pick.value = ''; pick.blur() }
    })
    // picking from the datalist fires `change` without an Enter
    pick.addEventListener('change', () => { if (where.has(pick.value.trim())) goToName() })
    document.body.appendChild(list)
    document.body.appendChild(pick)
    mapSearch = pick
  }

  const label = document.getElementById('label')
  // ODbL: the attribution has to travel with the data and be visible, not just sit in the package. The
  // short form is the one OSM asks for on a screen; the full notice Overpass returned is in the package.
  if (label) label.textContent = `${pkg.name} · © OpenStreetMap contributors (ODbL)`

  const camera = new FreeCamera('chase', new Vector3(0, 2, 0), scene)
  // a tighter near plane wastes depth precision, and the ground layers are only centimetres apart
  camera.minZ = 0.9
  camera.maxZ = 1400   // comfortably outside the sky dome (SKY_RADIUS)
  camera.fov = 1.02
  scene.activeCamera = camera

  /*
   * Photo mode (src/render/photo.ts): P toggles fog off for clean aerial screenshots, [ and ] pull the draw
   * distance in and push it out. `?fog=off&far=6000` does the same from the URL for an unattended run.
   */
  photoMode(scene, camera, (s) => hud.banner(s))
  // Chrome's ~3 GB ceiling is fatal and silent (BUGS.md #121): say so while there is still a tab to say it in
  watchHeap((m) => hud.banner('memory', m))

  let last = performance.now()
  let frames = 0
  // The camera lags the rider in HEADING only, never in distance. Easing its position toward a moving target
  // meant that through a corner — where the rider turns faster than the camera does — the gap between them
  // opened and closed, and the camera appeared to zoom in and out on every turn. Smoothing the angle and
  // then placing the camera at a fixed distance along it keeps the framing rock steady.
  let camHeading = nav.heading()
  let camHeight = 3.6
  let camBack = 7.5
  // where the camera is LOOKING, in height: the road's own profile ahead, eased (BUGS.md #207)
  let aimY = nav.elevationAhead(12)

  // Contact shadows for everything, without teaching a single shader about them. `?without=ao` turns it off.
  if (!off.has('ao')) ambientOcclusion(scene, camera)

  let lastState: ReturnType<typeof ride.step> | null = null
  /*
   * The SIMULATED clock (`window.__clock`, tools/route-movie.ts). Not `performance.now()`: dt is clamped to
   * 0.1 s, so any frame slower than that is time the rider never gets — on a machine drawing 8 fps a minute of
   * wall clock would be forty seconds of riding. A tool that photographs the ride every two seconds of IN-GAME
   * time, or reports how long a route took a rider, has to read the same seconds the ride model was stepped
   * with, whatever the frame rate happened to be. Advanced only where the rider actually moves, so a freeze, a pause and a cable-car
   * ride cost the rider no time at all.
   */
  let simSeconds = 0
  engine.runRenderLoop(() => {
    const now = performance.now()
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now

    if (!controls.paused()) {
      /*
       * The transit (sim/transit.ts): which vehicle is near enough to get on, or where the one being ridden
       * has got to. Every frame while aboard — the rider's position comes from it — and a few times a second
       * otherwise, because the search is over every train in the city.
       */
      if (transit.aboard || frames % 6 === 0) {
        transit.update({ x: lastAt.x, z: lastAt.z, speed: lastState?.speed ?? 0 }, transitViews())
        // the vehicle stopped being reported (its line was rebuilt): put the rider down rather than let
        // them follow a ghost
        if (transit.vehicleLost) {
          const pos = transit.abandon(placeOnGraph)
          if (pos) backOnStreet(pos)
          hud.banner('Off the transit', 'the vehicle is no longer running')
        }
      }
      const prompt = transit.prompt()
      if (prompt) hud.transit(prompt)
      else hud.transit(null)

      // Always drained, even aboard the transit: `steering()` empties a queue, and presses kept while the
      // rider was on a cable car would all fire the frame they stepped off — including a U-turn.
      const steers = controls.steering()
      for (const t of transit.aboard ? [] : steers) {
        if (t === 'back') { nav.turnAround(); continue }
        /*
         * Item H: a press with the next junction more than six seconds away is a NUDGE across the
         * carriageway (straight comes back to the middle); inside six seconds it is a turn request, as
         * always. The HUD says which it was, so the rider is never unsure what a press did.
         */
        const ahead = nav.next()
        const far = !ahead || ahead.passThrough || ahead.ahead / Math.max(2, lastState?.speed ?? 0) > 6
        if (far) {
          nav.nudge(t === 'left' ? -1 : t === 'right' ? 1 : 0)
          hud.note(t === 'left' ? '← nudge' : t === 'right' ? 'nudge →' : 'back to the middle')
        } else {
          nav.request(t)
          // the rider's own choice for this junction wins over the GPS's
          ownChoiceAt = ahead?.nodeId ?? null
        }
      }

      const junction = transit.aboard ? null : nav.next()
      // a star junction's exits by name (BUGS.md #40): the one the rider (or the GPS) picked, else the turn's
      if (junction && !junction.passThrough) {
        const picked = nav.requestedEdge ?? resolve(junction.exits, nav.requested)?.edgeId ?? null
        hud.exits(junction.exits.map((x) => ({ edgeId: x.edgeId, angle: x.angle, name: rides.edges.get(x.edgeId)?.name })), picked)
      } else hud.exits(null, null)
      // the GPS: keep the route current, and ask for its exit at the junction ahead
      if (destination && now - routedAt > 1000) {
        routedAt = now
        replan()
        if (route && route.length < 20) {
          const here = destination!
          const reached = placeName(here)
          if (tour && nextWaypoint()) {
            const n = tour.of - tour.left.length
            hud.banner(`${reached}`, `stop ${n - 1} of ${tour.of} · next: ${placeName(destination!)}, ${((route?.length ?? 0) / 1000).toFixed(1)} km`)
          } else {
            const name = tour?.name
            hud.banner(name ? `${name} — complete` : `You have arrived: ${reached}`, name ? `the last stop: ${reached}` : '', 6000)
            clearRoute()
          }
        }
      }
      if (route && junction && !junction.passThrough && ownChoiceAt !== junction.nodeId && !nav.isCommitted) {
        const want = route.leave.get(junction.nodeId)
        const exit = want === undefined ? undefined : junction.exits.find((x) => x.edgeId === want)
        if (exit && nav.requestedEdge !== exit.edgeId) { nav.request(exit.turn); nav.requestEdge(exit.edgeId) }
      }
      if (route) {
        const want = junction ? route.leave.get(junction.nodeId) : undefined
        const exit = want === undefined || !junction ? undefined : junction.exits.find((x) => x.edgeId === want)
        const km = route.length >= 1000 ? `${(route.length / 1000).toFixed(1)} km` : `${Math.round(route.length / 10) * 10} m`
        const street = exit ? rides.edges.get(exit.edgeId)?.name : undefined
        const next = route.turnRound ? 'turn round' : exit && junction
          ? `${exit.turn === 'straight' ? 'straight on' : exit.turn}${street ? ` onto ${street}` : ''} in ${Math.round(junction.ahead / 10) * 10} m`
          : 'ahead'
        hud.gps(`⌖ ${tour ? `${tour.of - tour.left.length}/${tour.of} · ` : ''}${km} · ${next}`)
      }
      paths.follow(nav.at())
      paths.update(nav.edge.id, junction, nav.requested)
      const edge = nav.edge
      // the corner the rider is approaching, if they are about to turn into one
      let radius = Infinity
      if (junction) {
        // A dead end is the tightest corner there is: the rider has to stop and turn the bike round. Feeding
        // it through the same corner model brakes them to walking pace on the approach instead of reversing
        // their direction at 25 km/h, which is what it did before and felt like hitting a wall.
        const chosen = resolve(junction.exits, nav.requested)
        radius = junction.deadEnd ? 2.2 : chosen ? cornerRadius(chosen.angle) : Infinity
      }
      /*
       * The real grade of the street, at last. This is the number the whole game exists to produce: the
       * platform scales it by the rider's difficulty setting, clamps it to what the machine can do, and the
       * trainer makes the hill the rider can see. A city baked flat asked for 0% from one end of a session
       * to the other.
       */
      const ground = nav.elevation()
      // the surface of the actual street under the wheels, not of the longest piece of the ride edge
      const surface = graph.edges.get(nav.mapEdgeId())?.surface ?? edge.surface
      // frozen for debugging: the ride model is not stepped at all, so the rider is exactly where they were
      // and paused on the platform: frozen too, the gap not integrated (docs/GAME_AUTHORING.md "Paused")
      /*
       * Aboard a cable car or a streetcar, the rider is not riding: the ride model is not stepped, the
       * navigator is not advanced, and the trainer is asked for no resistance at all. The vehicle carries
       * them, at its own speed, and the distance it covers is the vehicle's, not theirs.
       */
      const riding = transit.aboard !== null
      const hold = frozen || controls.paused() || riding
      const state = hold && lastState ? { ...lastState, speed: 0, power: riding ? 0 : lastState.power, grade: riding ? 0 : lastState.grade }
        : ride.step(dt, controls.measured(), opts.device, surface, ground.grade, radius, junction?.ahead ?? Infinity)
      lastState = state
      if (!opts.freeze && !hold) { nav.advance(state.speed * dt, state.speed); simSeconds += dt }
      controls.request(riding ? 0 : state.grade * 100)

      /*
       * Where the rider is DRAWN: round the corner on an arc (Navigator.smoothed), not snapping 90° at the
       * node. The grade and the junction logic stay on the graph position. The height follows the street's
       * own profile, corrected by how much the ground differs between the arc and the centre line — on Nob
       * Hill's cross slopes the arc is metres off the line, and the line's height would float or sink the bike.
       */
      const sm = nav.smoothed()
      const centre = nav.at()
      /*
       * The park's air, on crossing in or out of it (render/photo.ts `setRegionFog`, docs/PARKS.md). Asked
       * of the rider's own position, which is in a loaded tile by definition, and acted on only when the
       * answer CHANGES — the material walk is a few dozen materials and has no business in every frame.
       */
      const nowInPark = parkMap.contains(centre.x, centre.z, TILE)
      if (nowInPark !== inPark) {
        inPark = nowInPark
        setRegionFog(scene, inPark ? parkStyle.fogDensity : null)
      }
      let at = sm.point
      let heading = sm.heading
      let groundY = sm.lean === 0 ? ground.y
        : ground.y + city.terrain.heightAt(at.x, at.z) - city.terrain.heightAt(centre.x, centre.z)
      // …unless they are on the transit, in which case they are wherever the vehicle is, on its deck
      const onBoard = transit.at
      if (onBoard) {
        at = { x: onBoard.x, z: onBoard.z }
        heading = onBoard.heading
        groundY = onBoard.y
      }
      lastAt = at
      lastY = groundY
      if (!frozen) city.update(at.x, at.z)
      // and the tiles to build them from, round wherever is being looked at, a few times a second
      if (now - lastWant > 250) {
        lastWant = now
        const f = frozen ? (held ? held.to : orbit.look) : at
        void wantTiles(f.x, f.z)
      }

      // Everything alive. The traffic and the crowd are told which streets are near so they populate what
      // the rider can see and retire what they cannot, which is what bounds the cost.
      const near: Edge[] = []
      for (const id of city.edgesNear(at.x, at.z)) {
        const e = graph.edges.get(id)
        if (e) near.push(e)
      }
      if (!off.has('life')) {
        traffic.update(dt, at, near)
        crowd.update(dt, at, near)
        strangers?.update(dt, crowd.all, at, city.terrain)
        const focus = frozen ? (held ? held.to : orbit.look) : at
        life.update(dt, traffic.all, crowd.all, at, strangers?.drawn, city.terrain, focus)
        river?.update(dt, focus)
      }
      sky?.update(dt, at)
      // the raised decks (docs/SKYPARKS.md), drained before both layers update: a deck arrives when its
      // landmark's tile streams in, so a one-time hookup at startup would miss every one of them. Trees and
      // shrubs read the same `landmarks.decks` entries.
      if (landmarks && decksPlanted < landmarks.decks.length) {
        for (; decksPlanted < landmarks.decks.length; decksPlanted++) {
          const d = landmarks.decks[decksPlanted]
          plants.addDeck(d.ring, d.y)
          trees.addDeck(d.ring, d.y)
        }
      }
      trees.update(camera.position)
      plants.update()

      // Chase camera. Both the position and the look-at come from the SAME smoothed heading, so the rider
      // stays put in the frame and the camera swings round behind them through a turn. Deriving the two from
      // different headings — behind on the old one, looking along the new one — swung the rider across the
      // screen and read as the camera zooming in and out at every corner.
      let d = heading - camHeading
      while (d > Math.PI) d -= 2 * Math.PI
      while (d < -Math.PI) d += 2 * Math.PI
      camHeading += d * Math.min(1, dt * 4.5)
      const fx = Math.sin(camHeading)
      const fz = Math.cos(camHeading)
      const high = opts.view === 'high'
      // How far back the camera would like to be, and how far it may actually go before it is inside the
      // building behind the rider. Eased rather than snapped, or every doorway the camera passes makes it
      // jump; eased faster on the way IN than on the way out, because being inside a wall for a moment is
      // worse than a slightly slow recovery.
      if (frozen && held) {
        camera.position.copyFrom(held.from)
        camera.setTarget(held.to)
        city.update(held.to.x, held.to.z)
      } else if (frozen) {
        orbit.tick(dt)
        const l = orbit.look
        l.y = city.terrain.heightAt(l.x, l.z) + 1.5 + orbit.lift
        const e = orbit.eye()
        // never below the ground: under it, everything is the wrong way round and nothing is diagnosable
        e.y = Math.max(e.y, city.terrain.heightAt(e.x, e.z) + 0.6)
        camera.position.set(e.x, e.y, e.z)
        camera.setTarget(new Vector3(l.x, l.y, l.z))
        // the city streams around the focus, so walking the view away does not walk off the built area
        city.update(l.x, l.z)
      }
      /*
       * Aboard, the camera has to clear the vehicle it is riding on. A PCC is fourteen metres long and the
       * chase camera's usual 7.5 m puts the eye inside the saloon, looking at the roof; standing it back
       * behind the car and a little higher makes the ride what it is meant to be — the view from the
       * running board.
       */
      const want = high ? 46 : riding ? 22 : 7.5
      const room = high || riding ? want : city.clearBehind(at.x, at.z, -fx, -fz, want)
      camBack += (room - camBack) * Math.min(1, dt * (room < camBack ? 12 : 3))
      /*
       * The camera rides the hill with the rider, looking at where the ROAD actually goes — from the road's
       * own profile (`nav.elevationAhead`), not from the terrain grid.
       *
       * BUGS.md #207: on a bridge the terrain under the rider is the SEA BED. Measured mid-span on the
       * Golden Gate with `tools/cam-probe.ts`, the eye was at -29 m and the aim at -85 m, a steady pitch of
       * -73° for the whole crossing — the camera staring down through the deck into the bridge's own
       * structure, which is exactly what the owner reported. The deck's height is in the ride edge's
       * profile, where the rider's own height and the trainer's grade already come from.
       *
       * Aboard a streetcar there is no ride edge under the rider, so the terrain is still the best answer
       * there; and the aim is eased, because crossing a junction changes which edge the profile comes from
       * and the step at the node would otherwise flick the view.
       */
      // …and the terrain where there is no profile to read: aboard a streetcar there is no ride edge under
      // the rider at all, and an edge whose heights did not survive the chain would otherwise read as y=0,
      // which in San Francisco's datum is 82 m in the air
      const onProfile = !riding && nav.edge.heights !== undefined
      aimY += ((onProfile ? nav.elevationAhead(12) : city.terrain.heightAt(at.x + fx * 12, at.z + fz * 12)) - aimY)
        * Math.min(1, dt * 6)
      const aheadY = aimY
      // under a passage's vault, and behind the rider along it, the camera drops below the arch
      const vault = high ? null : city.passageAt(at.x - fx * camBack, at.z - fz * camBack) ?? city.passageAt(at.x, at.z)
      const lift = high ? 34 : riding ? 6.5 : vault === null ? 3.5 : Math.max(1.9, Math.min(3.5, vault - 1.0))
      camHeight += (lift + groundY - camHeight) * Math.min(1, dt * (vault === null ? 4 : 8))
      if (!frozen) {
        camera.position.set(at.x - fx * camBack, camHeight, at.z - fz * camBack)
        camera.setTarget(new Vector3(at.x + fx * (high ? 26 : 9), (high ? 6 : 1.9) + aheadY,
          at.z + fz * (high ? 26 : 9)))
      }

      // glass and water are view-dependent, so they need the eye every frame; the chase camera is driven by
      // hand, so Babylon has no automatic for it
      landmarks?.update(camera.position)
      statues?.update(camera.position)
      fountains?.update()
      updateEye(scene, camera.position)
      updateCartoonEye(scene, camera.position)
      updateWater(scene, now / 1000, camera.position)
      rain?.update(dt, camera.position)

      // The rider leans into the corner by its lateral acceleration, v²/R on the arc being ridden.
      rider?.update(dt, at, heading, state.speed, state.crank, sm.lean, state.working, groundY)
      life.riderShadow(at, heading, groundY)

      opts.platform?.frame()
      minimap.draw(at, heading, junction && !junction.passThrough ? rides.nodes.get(junction.nodeId)?.at ?? null : null)

      // a running count of what is actually on screen, which is the only way to tell an empty street from a
      // broken instance buffer
      frames++
      if (label && frames % 30 === 0) {
        const s = life.stats
        label.textContent = `${pkg.name} · © OpenStreetMap contributors (ODbL)`
          + `  —  ${s.vehicles} vehicles, ${s.people} people, ${trees.count} trees`
          + `, ${signs?.count ?? 0} signs, ${signs?.plaques ?? 0} plaques, ${signs?.named ?? 0} named`
          + `  ·  ${(ground.grade * 100).toFixed(1)}%`
      }

      /*
       * The nearest top-tier landmark whose frontage is within 40 m and AHEAD, named on the HUD with the side
       * it is on: "Église Saint-Paul-Saint-Louis →". Checked a few times a second, not every frame.
       */
      if (frames % 10 === 0) {
        const fx = Math.sin(heading)
        const fz = Math.cos(heading)
        let best: { name: string; d: number; side: 'left' | 'right' } | null = null
        for (const l of tier1) {
          const dx = l.frontage.x - at.x
          const dz = l.frontage.z - at.z
          const d = Math.hypot(dx, dz)
          if (d > 40 || dx * fx + dz * fz < 0) continue
          // right of the direction of travel is (cos h, −sin h)
          const side = dx * fz - dz * fx > 0 ? 'right' : 'left'
          if (!best || d < best.d) best = { name: l.name, d, side }
        }
        hud.landmarkNear(best?.name ?? null, best?.side)
      }
      card?.update(at, heading)
      hud.update(riding ? null : junction, nav.requested, nav.isCommitted, {
        speed: state.speed, power: state.power, distance: nav.travelled,
        street: edge.name, device: opts.device,
      })
    }
    scene.render()
    // the first frame builds every tile in view at once: its cost is the stutter a new area would bring
    if (marks.firstFrame === undefined) { mark('firstFrame'); firstFrameAt = performance.now() }
    // the loading screen stays until the streets round the rider are built, or four seconds at most
    if (loading && marks.firstFrame !== undefined && (city.idle || performance.now() - firstFrameAt > 4000)) {
      loading.hide()
      loading = null
      // and the welcome screen over the city, gone at the first key (BUGS.md #165)
      if (!opts.freeze) welcomeScreen(src.index?.name ?? opts.city)
    }
  })

  addEventListener('resize', () => engine.resize())
  // a handle for the Playwright probe in tools/; harmless in production and worth its weight when
  // something is drawing geometry nobody can account for
  ;(window as unknown as { gameReady?: boolean; __scene?: unknown }).__scene = scene
  ;(window as unknown as { __crowd?: unknown; __pkg?: unknown }).__crowd = crowd
  ;(window as unknown as { __pkg?: unknown }).__pkg = pkg
  ;(window as unknown as { __signs?: unknown }).__signs = signs
  // where the rider is drawn and what is under them, for tools/probe-eval.ts
  // `?pick=1`: which building is drawn at a screen point (x, y in CSS pixels) — for tracking down a stray face
  ;(window as unknown as { __pickBuilding?: unknown }).__pickBuilding = (x: number, y: number) => {
    const hit = scene.pick(x, y, (m) => m.isEnabled() && m.isVisible && (m.name.startsWith('b:') || m.name.startsWith('fringe')))
    if (!hit?.hit || !hit.pickedMesh) return null
    const spans = (hit.pickedMesh.metadata?.buildingSpans ?? []) as [number, number][]
    let id = null
    for (const [start, bid] of spans) if (start <= hit.faceId) id = bid
    return { mesh: hit.pickedMesh.name, face: hit.faceId, building: id, at: hit.pickedPoint?.asArray().map((v) => Math.round(v * 10) / 10) }
  }
  ;(window as unknown as { __heightAt?: unknown }).__heightAt = (x: number, z: number) => city.terrain.heightAt(x, z)
  /* how much fine ground is resident, against how many tiles are held: the per-tile terrain's heap report */
  ;(window as unknown as Record<string, unknown>).__terrainStats = () => ({
    blocks: city.terrain.blockCount, tilesHeld: tileLevel.size, coarse: !!city.terrain.coarse,
  })
  // the ride's own clock: seconds the ride model was actually stepped, metres covered, and the speed now
  // (tools/route-movie.ts — the time-lapse keys its frames and its captions off these seconds)
  ;(window as unknown as Record<string, unknown>).__clock = () => ({
    seconds: simSeconds, travelled: nav.travelled, speed: lastState?.speed ?? 0,
  })
  ;(window as unknown as { __ride?: unknown }).__ride = () => ({
    x: lastAt.x, z: lastAt.z, y: lastY, terrain: city.terrain.heightAt(lastAt.x, lastAt.z), edge: nav.mapEdgeId(),
    elevation: nav.elevation().y,
  })
  /*
   * Views (tools/views.ts, views/<city>.json): `__view(from, to)` holds the camera at [lat, lon, metres above
   * the ground there] looking at the same; `__viewHere()` is the current camera as a view entry (V copies it);
   * `__placed()` lists the modelled landmarks with their size, for seeding default views.
   */
  const toLL = (p: { x: number; y: number; z: number }): [number, number, number] => {
    const ll = proj.toLatLon(p)
    const r = (v: number, k: number): number => Math.round(v * k) / k
    return [r(ll.lat, 1e6), r(ll.lon, 1e6), r(p.y - city.terrain.heightAt(p.x, p.z), 10)]
  }
  const fromLL = (v: [number, number, number]): Vector3 => {
    const p = proj.toLocal({ lat: v[0], lon: v[1] })
    return new Vector3(p.x, city.terrain.heightAt(p.x, p.z) + v[2], p.z)
  }
  const w = window as unknown as Record<string, unknown>
  /*
   * STREAM WHERE THE CAMERA IS LOOKING, not only where the rider stands (BUGS.md #220).
   *
   * Holding the camera used to do nothing else, and tile streaming follows the RIDER — so a view a kilometre
   * from the rider photographed the terrain, the landmarks and the skyline, all of which are always drawn,
   * and almost none of the per-tile city: no roads, no kerbs, no furniture, no bridge structures. Worse,
   * `tools/views.ts` waits for `__cityIdle()` first, which was true immediately because nothing near the
   * camera had been requested — the wait CONFIRMED the empty frame instead of catching it. The Golden Gate
   * renders came out cleaner than the owner's own ride for exactly this reason.
   *
   * The rider is deliberately left where they are: streaming round the LOOK POINT is what the picture needs,
   * and moving the rider would drop the route and the tour (see `__jump`).
   */
  const streamAt = (p: Vector3): void => {
    city.update(p.x, p.z)
    trees.update(new Vector3(p.x, 0, p.z))
  }
  w.__view = (from: [number, number, number], to: [number, number, number]) => {
    held = { from: fromLL(from), to: fromLL(to) }
    if (!frozen) { frozen = true; orbit.active = true; debug.frozen(true) }
    streamAt(held.to)
  }
  // the same in local metres, heights above the ground (probes of things the city placed: tools/)
  w.__viewLocal = (from: [number, number, number], to: [number, number, number]) => {
    const v = (q: [number, number, number]): Vector3 => new Vector3(q[0], city.terrain.heightAt(q[0], q[2]) + q[1], q[2])
    held = { from: v(from), to: v(to) }
    if (!frozen) { frozen = true; orbit.active = true; debug.frozen(true) }
    streamAt(held.to)
  }
  // what is drawn at a pixel (tools: finding the mesh behind a visual bug): name, and where it was hit
  /**
   * Go somewhere in this city without reloading (BUGS.md #61): the rider is put on the rideable street nearest
   * the point, the route and the tour are dropped, and the city streams round the new place. Returns false when
   * there is no rideable street near enough, so the caller can fall back to a reload.
   */
  w.__jump = (lat: number, lon: number): boolean => {
    const where = nearestStart({ lat, lon })
    if (!where) return false
    nav.placeAt(where)
    destination = null
    tour = null
    clearRoute()
    const at = nav.at()
    city.update(at.x, at.z)
    trees.update(new Vector3(at.x, 0, at.z))
    hud.banner('Jumped', `${lat.toFixed(5)}, ${lon.toFixed(5)} · ${placeName(at)}`)
    return true
  }
  w.__pick = (x: number, y: number) => {
    const hit = scene.pick(x, y, (m) => m.isEnabled() && m.isVisible, false, camera)
    return hit?.hit ? { mesh: hit.pickedMesh?.name, at: hit.pickedPoint?.asArray().map((v) => Math.round(v * 10) / 10) } : null
  }
  w.__viewHere = () => {
    const f = camera.position
    const t = camera.getTarget()
    // the target a sensible distance ahead: the orbit's own focus when frozen, else 30 m along the view
    const to = frozen && !held ? { x: orbit.look.x, y: orbit.look.y, z: orbit.look.z }
      : held ? held.to : t
    return { name: '', group: '', from: toLL(f), to: toLL(to) }
  }
  w.__placed = () => landmarks?.placed ?? []
  w.__landmarks = landmarks
  w.__boats = () => river?.positions() ?? []
  w.__trains = () => life.trainInfo()
  // the transit (sim/transit.ts): the vehicle simulation and the boarding state, for probing the wiring
  // without a bake — `__life.addStops([{x, z}])` puts a stop on a line that has none
  w.__life = life
  w.__transit = transit
  w.__board = () => (transit.boardable ? transit.board(nav.position) : false)
  // the prepared tiles, for probing what reached the city (tools/, debugging)
  w.__tiles = prepared.tiles
  // nothing left to stream round the camera's focus (render/city.ts `idle`)
  w.__cityIdle = () => city.idle
  w.__cityObj = city
  w.__Ray = Ray
  addEventListener('keydown', (e) => {
    if (e.code !== 'KeyV' || (e.target instanceof HTMLElement && e.target.closest('input, textarea, select'))) return
    const text = JSON.stringify((w.__viewHere as () => unknown)())
    void copyText(text).then((ok) => debug.toast(`${ok ? 'view copied' : 'could not copy'} — paste it into views/${opts.city}.json\n${text}`))
  })
  ;(window as unknown as { gameReady?: boolean }).gameReady = true

  // on Dandyhorse: the session starts ticking now the rider is on the street (src/platform.ts)
  if (opts.platform) {
    const streets = new Set([...rides.edges.values()].flatMap((e) => e.over.map((o) => o.id))).size
    opts.platform.attach({
      city: opts.city,
      streets,
      where: () => {
        const ll = proj.toLatLon(lastAt)
        return { x: lastAt.x, y: nav.elevation().y, z: lastAt.z, lat: ll.lat, lon: ll.lon, edge: nav.mapEdgeId(), street: nav.edge.name }
      },
      grade: () => lastState?.grade ?? 0,
      speed: () => lastState?.speed ?? 0,
      travelled: () => nav.travelled,
      // Babylon's own screenshot, not the canvas: a raw toDataURL comes back blank under WebGPU (INTEGRATION.md §8)
      screenshot: () => Tools.CreateScreenshotAsync(engine, camera, { width: 640, height: 360 }, 'image/jpeg', 0.82).catch(() => null),
    })
  }
}

/**
 * Where the ride starts, before any tile is in: from `?at=`, from `?start=` or the city's own start edge (found
 * on the ride graph through the map edges each ride edge was built from), or the first ride edge.
 */
function startPoint(rides: RideGraph, index: CityIndex, opts: { at?: { lat: number; lon: number }; startEdge?: number }): { x: number; z: number } {
  if (opts.at) return new Projection(index.origin).toLocal(opts.at)
  const onRide = (id: number): { x: number; z: number } | null => {
    for (const e of rides.edges.values()) {
      if (e.over.some((o) => o.id === id)) return e.points[Math.floor(e.points.length / 2)]
    }
    return null
  }
  return (opts.startEdge !== undefined ? onRide(opts.startEdge) : null) ?? onRide(index.start.edgeId)
    ?? rides.edges.values().next().value!.points[0]
}
