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
import { quaysLayer } from './render/quays.ts'
import { quickMarksLayer } from './render/quickmarks.ts'
import { bridgeStructuresLayer, PARIS_BRIDGES } from './render/bridge-structures.ts'
import { passagesLayer } from './render/passages.ts'
import { boatsLayer } from './render/boats.ts'
import { metroSignsLayer } from './render/metrosigns.ts'
import { PathMap } from './render/pathmap.ts'
import { region } from './city/region.ts'
import { ambientOcclusion } from './render/depth.ts'
import { City, setupGroundLayers } from './render/city.ts'
import { Crowd } from './sim/crowd.ts'
import { Life } from './render/life.ts'
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
import { Minimap } from './ui/minimap.ts'
import { LocalControls, type Controls } from './controls.ts'
import { Navigator } from './sim/navigate.ts'
import { Ride, cornerRadius } from './sim/ride.ts'
import { addEdges, departureBearing, resolve, type CityGraph, type Edge } from './city/graph.ts'
import { locate, rideExits, type RideGraph } from './city/ridegraph.ts'
import { nearestOnGraph, planRoute, type Route } from './sim/route.ts'
import { SCENIC } from './city/scenic.ts'
import { unpackPoints, wholeWater, type CityPackage, type PackedArea, type PackedRail } from './city/package.ts'
import { loadRide, openCity } from './city/tilestore.ts'
import { mapEdges } from './city/ridefile.ts'
import type { AtlasManifest } from './render/buildings.ts'

const ASSETS = new URL('facades/', document.baseURI).href

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
  const mark = (name: string): void => {
    const t = performance.now()
    marks[name] = Math.round(t - lastMark)
    marks[`${name}MB`] = heapMB()
    lastMark = t
  }
  ;(window as unknown as { __marks?: unknown }).__marks = marks
  const [src, atlas] = await Promise.all([
    // the index now, the tiles as the rider needs them (city/tilestore.ts); a single-package city is cut up
    openCity(document.baseURI, opts.city),
    fetch(`${ASSETS}atlas.json`).then((r) => r.json()) as Promise<AtlasManifest>,
  ])
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
  const prepare = tilePreparer(landmarkList, index)
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

  const engine = new Engine(canvas, true, { antialias: true }, true)
  const scene = new Scene(engine)
  scene.clearColor = new Color4(DAYLIGHT.fogColour.r, DAYLIGHT.fogColour.g, DAYLIGHT.fogColour.b, 1)
  setupGroundLayers(scene)
  const city = new City(scene, { name: pkg.name, ground: pkg.ground, region: pkg.region, terrain: pkg.terrain,
    water: pkg.water }, atlas, ASSETS).omit(off)
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
  const bring = async (k: string, full: boolean): Promise<void> => {
    const have = tileLevel.get(k)
    if (have === 'full' || (have === 'mid' && !full) || !src.has(k)) return
    tileLevel.set(k, full ? 'full' : 'mid')
    const raw = await src.load(k)
    if (!raw) return
    const ready = prepare(raw)
    // the landmarks from every tile, near or far: an icon is seen from a kilometre and more
    for (const f of anyTile) f(raw)
    if (!full) {
      // what the mid ring's massing needs, and nothing else
      if (tileLevel.get(k) === 'mid') prepared.tiles.set(k, { ...ready, edges: [], areas: [], trees: [], pois: [], furniture: [], landmarks: [], rails: [], plantings: [] })
      return
    }
    prepared.tiles.set(k, ready)
    city.ingest(ready)
    const fresh = mapEdges(ready.edges.filter((e) => !graph.edges.has(e.id)), city.terrain)
    addEdges(graph, fresh)
    const a = { raw, ready, edges: fresh }
    if (keepArrived) arrived.push(a)
    for (const f of listeners) f(a)
  }
  /** the tiles round (x, z) asked for, nearest first, full near and massing further; resolves when all are in */
  const wantTiles = (x: number, z: number): Promise<void> => {
    const [cx, cz] = [Math.floor(x / TILE), Math.floor(z / TILE)]
    const jobs: [string, boolean, number][] = []
    for (let dz = -(MID + 1); dz <= MID + 1; dz++) for (let dx = -(MID + 1); dx <= MID + 1; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dz))
      jobs.push([tileKey(cx + dx, cz + dz), d <= VIEW + 2, d])
    }
    jobs.sort((p, q) => p[2] - q[2])
    return Promise.all(jobs.map(([k, full]) => bring(k, full))).then(() => undefined)
  }
  const first = startPoint(rides, index, opts)
  await wantTiles(first.x, first.z)
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
    pkg.region === 'paris' ? PARIS_BRIDGES : {}))
  mark('quays')
  // the arches and covered ways that take streets through buildings (render/passages.ts)
  city.addLayer(passagesLayer(scene, city.terrain))
  // the buildings people steer by, marked by their kind: flags on the civic ones, towers on the churches (BUGS.md #41)
  city.addLayer(quickMarksLayer(scene, city.terrain, pkg.region))
  // the péniches moored along the river (render/boats.ts)
  city.addLayer(boatsLayer(scene))
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
  const signs = off.has('signs') ? null : new Signs(scene, pkg.id, region(pkg.region), city.terrain, junctions, noSign)
  if (signs) city.addLayer(signs)
  mark('signs')
  const level = opts.traffic ?? 'some'
  /*
   * No cars, by the user's decision (2026-09-21): "this is a fantasy with no cars" — the boxy models and
   * their straight-line driving looked wrong, and a city without them is a better ride. Trains, trams and
   * cable cars still run (they are drawn by Life from the rails, not by Traffic). `?cars=1` brings the road
   * traffic back for anyone working on it.
   */
  const traffic = new Traffic(graph, opts.cars ? level : 'none')
  // the crowd's own density: `?crowd=crowded` for a Saturday; the traffic level otherwise
  const crowdLevel = (new URLSearchParams(location.search).get('crowd') as 'none' | 'some' | 'busy' | 'crowded' | null) ?? level
  const crowd = new Crowd(graph, crowdLevel)
  mark('crowd')
  crowd.setWater(wholeWater(pkg).map((a) => ({ ring: unpackPoints(a.ring), holes: (a.holes ?? []).map(unpackPoints) })))
  const life = new Life(scene, pkg as unknown as CityPackage)
  onTile((a) => life.addRails(a.ready.rails))
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
  const trees = new Vegetation(scene, city.terrain, new URL('trees/', document.baseURI).href)
  if (!off.has('trees')) city.addLayer(trees.layer())
  mark('vegetation')
  // the models are a few megabytes, so the ride starts without them and they appear when they arrive
  if (!off.has('trees')) void trees.load().catch((e) => console.warn('vegetation did not load:', e))

  const controls: Controls = new LocalControls(() => opts.device)
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
  function nearestStart(ll: { lat: number; lon: number }): ReturnType<typeof locate> {
    const p = new Projection(pkg.origin).toLocal(ll)
    const onRide = new Set([...rides.edges.values()].flatMap((e) => e.over.map((o) => o.id)))
    let best: { id: number; s: number; d: number } | null = null
    for (const e of graph.edges.values()) {
      if (!onRide.has(e.id)) continue
      let run = 0
      for (let i = 1; i < e.points.length; i++) {
        const a = e.points[i - 1]
        const b = e.points[i]
        const dx = b.x - a.x
        const dz = b.z - a.z
        const len = Math.hypot(dx, dz) || 1e-6
        const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (len * len)))
        const d = Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t)
        if (!best || d < best.d) best = { id: e.id, s: run + len * t, d }
        run += len
      }
    }
    return best ? locate(rides, graph, best.id, best.s) : null
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
  const hud = new Hud(document.getElementById('hud')!, () => nav.turnAround())
  hud.onExit = (edgeId) => {
    nav.requestEdge(edgeId)
    ownChoiceAt = nav.next()?.nodeId ?? null
  }
  const rideable = new Set([...rides.edges.values()].flatMap((e) => e.over.map((o) => o.id)))
  const minimap = new Minimap(document.getElementById('minimap') as HTMLCanvasElement, graph, {}, rideable)
  onTile((a) => minimap.addEdges(a.edges))
  // the whole city for the zoomed-out large map, and a click on it goes there (user: jump anywhere, for debugging)
  minimap.setRide([...rides.edges.values()].map((e) => e.points))
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
    menu.className = 'sr-city sr-landmarks sr-routes'
    menu.style.top = '88px'
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

  addEventListener('keydown', (e) => { if (e.code === 'KeyM') minimap.toggle() })

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
  if (opts.goTo) {
    const where = new Map<string, { x: number; z: number }>()
    for (const l of landmarks?.placed ?? []) where.set(l.name, l)
    for (const e of landmarkList) {
      if (!e.restyle || !e.within || where.has(e.name)) continue
      const pts = e.within.map(([lat, lon]) => proj.toLocal({ lat, lon }))
      where.set(e.name, { x: pts.reduce((a, q) => a + q.x, 0) / pts.length, z: pts.reduce((a, q) => a + q.z, 0) / pts.length })
    }
    for (const l of (pkg.landmarks ?? []).filter((q) => q.tier === 1)) if (!where.has(l.name)) where.set(l.name, l)
    const pick = document.createElement('select')
    pick.className = 'sr-city sr-landmarks'
    pick.title = 'go to a landmark'
    pick.add(new Option('landmarks…', ''))
    for (const name of [...where.keys()].sort((a, b) => a.localeCompare(b, 'fr'))) pick.add(new Option(name, name))
    pick.addEventListener('keydown', (e) => e.stopPropagation())
    pick.addEventListener('change', () => {
      const p = where.get(pick.value)
      if (!p) return
      const ll = proj.toLatLon(p)
      const why = opts.goTo!(`${ll.lat}, ${ll.lon}`, true)
      if (why) debug.toast(why)
    })
    document.body.appendChild(pick)
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

  let last = performance.now()
  let frames = 0
  // The camera lags the rider in HEADING only, never in distance. Easing its position toward a moving target
  // meant that through a corner — where the rider turns faster than the camera does — the gap between them
  // opened and closed, and the camera appeared to zoom in and out on every turn. Smoothing the angle and
  // then placing the camera at a fixed distance along it keeps the framing rock steady.
  let camHeading = nav.heading()
  let camHeight = 3.6
  let camBack = 7.5

  // Contact shadows for everything, without teaching a single shader about them. `?without=ao` turns it off.
  if (!off.has('ao')) ambientOcclusion(scene, camera)

  let lastState: ReturnType<typeof ride.step> | null = null
  engine.runRenderLoop(() => {
    const now = performance.now()
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now

    if (!controls.paused()) {
      for (const t of controls.steering()) {
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

      const junction = nav.next()
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
      const state = frozen && lastState ? { ...lastState, speed: 0 } : ride.step(dt, controls.measured(),
        opts.device, surface, ground.grade, radius, junction?.ahead ?? Infinity)
      lastState = state
      if (!opts.freeze && !frozen) nav.advance(state.speed * dt, state.speed)
      controls.request(state.grade * 100)

      /*
       * Where the rider is DRAWN: round the corner on an arc (Navigator.smoothed), not snapping 90° at the
       * node. The grade and the junction logic stay on the graph position. The height follows the street's
       * own profile, corrected by how much the ground differs between the arc and the centre line — on Nob
       * Hill's cross slopes the arc is metres off the line, and the line's height would float or sink the bike.
       */
      const sm = nav.smoothed()
      const centre = nav.at()
      const at = sm.point
      const heading = sm.heading
      const groundY = sm.lean === 0 ? ground.y
        : ground.y + city.terrain.heightAt(at.x, at.z) - city.terrain.heightAt(centre.x, centre.z)
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
        life.update(dt, traffic.all, crowd.all, at, strangers?.drawn, city.terrain)
      }
      sky?.update(dt, at)
      trees.update()

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
      const want = high ? 46 : 7.5
      const room = high ? want : city.clearBehind(at.x, at.z, -fx, -fz, want)
      camBack += (room - camBack) * Math.min(1, dt * (room < camBack ? 12 : 3))
      // the camera rides the hill with the rider, looking at where the road actually goes
      const aheadY = city.terrain.heightAt(at.x + fx * 12, at.z + fz * 12)
      // under a passage's vault, and behind the rider along it, the camera drops below the arch
      const vault = high ? null : city.passageAt(at.x - fx * camBack, at.z - fz * camBack) ?? city.passageAt(at.x, at.z)
      const lift = high ? 34 : vault === null ? 3.5 : Math.max(1.9, Math.min(3.5, vault - 1.0))
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
      updateEye(scene, camera.position)
      updateCartoonEye(scene, camera.position)
      updateWater(scene, now / 1000, camera.position)
      rain?.update(dt, camera.position)

      // The rider leans into the corner by its lateral acceleration, v²/R on the arc being ridden.
      rider?.update(dt, at, heading, state.speed, state.crank, sm.lean, state.working, groundY)
      life.riderShadow(at, heading, groundY)

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
      hud.update(junction, nav.requested, nav.isCommitted, {
        speed: state.speed, power: state.power, distance: nav.travelled,
        street: edge.name, device: opts.device,
      })
    }
    scene.render()
    // the first frame builds every tile in view at once: its cost is the stutter a new area would bring
    if (marks.firstFrame === undefined) mark('firstFrame')
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
  w.__view = (from: [number, number, number], to: [number, number, number]) => {
    held = { from: fromLL(from), to: fromLL(to) }
    if (!frozen) { frozen = true; orbit.active = true; debug.frozen(true) }
  }
  // the same in local metres, heights above the ground (probes of things the city placed: tools/)
  w.__viewLocal = (from: [number, number, number], to: [number, number, number]) => {
    const v = (q: [number, number, number]): Vector3 => new Vector3(q[0], city.terrain.heightAt(q[0], q[2]) + q[1], q[2])
    held = { from: v(from), to: v(to) }
    if (!frozen) { frozen = true; orbit.active = true; debug.frozen(true) }
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
