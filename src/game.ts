/**
 * The ride itself: a city, a rider on it, a camera behind them and a HUD.
 *
 * Standalone the controls are the keyboard; on Dandyhorse the same `Controls` interface is backed by the
 * platform session and nothing else here changes. See INTEGRATION.md.
 */
import { CourtPlayers } from './sim/players.ts'
import { Color4 } from '@babylonjs/core/Maths/math.color'
import { Engine } from '@babylonjs/core/Engines/engine'
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera'
import { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Ray } from '@babylonjs/core/Culling/ray'
import '@babylonjs/core/Materials/standardMaterial'
import { setTimeOfDay, setWeather, type TimeOfDay, type Weather } from './render/facade-material.ts'
import { Rain } from './render/rain.ts'
import { DebugPanel, LookPad, OrbitLook, copyText } from './ui/debug.ts'
import { Projection } from './city/geo.ts'
import { parseLatLon } from './ui/goto.ts'
import { asMassing, fringeLayer, massing, midRoads } from './render/fringe.ts'
import { terracesLayer } from './render/terraces.ts'
import { MID, VIEW, setGroundStride, setRings } from './render/city.ts'
import { keyed, touchScreen } from './ui/touch.ts'
import { Inspector } from './ui/inspector.ts'
import { flagPoles, flagsLayer } from './render/flags.ts'
import { cliffsLayer } from './render/cliffs.ts'
import { MemoryTiles, TILE, tileKey, type CityIndex, type TileData } from './city/tiles.ts'
import { nearLevel, Terrain } from './city/terrain.ts'
import { tilePreparer } from './render/prepare.ts'
import { ParkMap } from './city/park-area.ts'
import { plog } from './profile.ts'
import { quaysLayer } from './render/quays.ts'
import { LoadingScreen, closeWelcome, welcomeOpen, welcomeScreen } from './ui/loading.ts'
import { TravelCard } from './ui/travel.ts'
import { SF_STATIONS, fareFrom, destinations, type Station } from './game/stations.ts'
import { LandmarkCard } from './ui/landmark-card.ts'
import { Plants } from './render/plants.ts'
import { quickMarksLayer } from './render/quickmarks.ts'
import { postersLayer } from './render/posters.ts'
import { Fountains, fountainManifest, wallaceLayer } from './render/fountains.ts'
import { bridgeStructuresLayer, PARIS_BRIDGES, STEEL_OVER_WATER } from './render/bridge-structures.ts'
import { passagesLayer } from './render/passages.ts'
import { boatsLayer } from './render/boats.ts'
import { RiverTraffic, riverLine } from './render/river-traffic.ts'
import { regionKit } from './render/region-kits.ts'
import { metroSignsLayer } from './render/metrosigns.ts'
import { PathMap } from './render/pathmap.ts'
import { region } from './city/region.ts'
import { ambientOcclusion } from './render/depth.ts'
import { colourGrade, GRADE, GRADE_NO_AO } from './render/grade.ts'
import { City, setupGroundLayers } from './render/city.ts'
import { Crowd } from './sim/crowd.ts'
import { Life } from './render/life.ts'
import { OverheadLines } from './render/overhead.ts'
import { streetRailsLayer } from './render/street-rails.ts'
import { stairsLayer } from './render/stairs.ts'
import { SF_STAIRWAYS } from './render/landmarks/sf/stairways.ts'
import { SF_TUNNELS } from './render/landmarks/sf/tunnels.ts'
import { SF_BRIDGE_DECKS, BAY_CROSSINGS, GONDOLA_NAME, GONDOLA_TRACK, LIFT_NAME } from './city/sf/bridges.ts'
/** seconds a ride in one of Salesforce Park's lifts takes */
const LIFT_SECONDS = 6
import { BridgeDecks, placement, toWorld } from './city/bridge-decks.ts'
import { Sky } from './render/sky.ts'
import { Landmarks, landmarkManifest, packedIds, setKeepGeometry } from './render/landmarks.ts'
import { Statues, statueManifest } from './render/statues.ts'
import { Traffic, laneOf, onEdge, type RiderNow, type Vehicle } from './sim/traffic.ts'
import { Signals } from './sim/signals.ts'
import { SignalLamps } from './render/lamps.ts'
import { ATE_LINES, DEFAULTS as DELIVERY_DEFAULTS, Delivery, rate, type DeliveryEvent, type Source, type Stop } from './game/delivery.ts'
import { DeliveryCard } from './ui/delivery-card.ts'
import { Tunnels } from './render/tunnels.ts'
import { Beacon } from './render/beacon.ts'
import { SIZE, boxOf, overlap } from './sim/collide.ts'
import { inRing } from './map/zones.ts'
import { BakedCrowd, cityClothes, peopleLights } from './render/crowd-baked.ts'
import { randomSpec } from '@dandyhorse/avatarkit'
import { Rider } from './render/rider.ts'
import { Signs, setTextScale, type SignedJunction } from './render/signs.ts'
import { GPU_PER_TILE_MB, HEAP_PER_TILE_MB, TIERS, type Tier } from './tier.ts'
import { MODES, type GameMode } from './modes.ts'
import SF_KITCHENS from './city/sf/restaurants.json'
import { Energy } from './sim/energy.ts'
import { capTextures } from './render/texture-cap.ts'
import { Vegetation, foliageLights } from './render/vegetation.ts'
import { updateCartoonEye } from './render/cartoon-material.ts'
import { DAYLIGHT, updateEye } from './render/facade-material.ts'
import { obscuraView } from './render/obscura.ts'
import { bouldersLayer } from './render/boulders.ts'
import { beachRuns, beachSurfLayer, inBeachZone, shoreFrame, shoreRamp } from './render/beach-surf.ts'
import { BeachCrowd } from './render/beach-crowd.ts'
import { updateWater } from './render/water-material.ts'
import { Hud } from './ui/hud.ts'
import { PBR_FOG, photoMode, setRegionFog } from './render/photo.ts'
import { gpuMB, showMemory, watchHeap } from './render/heap.ts'
import { Minimap } from './ui/minimap.ts'
import { LocalControls, type Controls } from './controls.ts'
import type { Platform } from './platform.ts'
import { Tools } from '@babylonjs/core/Misc/tools'
import { Navigator, pointAlong } from './sim/navigate.ts'
import { Transit, type Placer, type TransitKind, type VehicleView } from './sim/transit.ts'
import { Ride, cornerRadius } from './sim/ride.ts'
import { addEdges, departureBearing, exits, resolve, type CityGraph, type Edge } from './city/graph.ts'
import { locate, rideExits, type RideGraph } from './city/ridegraph.ts'
import { nearestOnGraph, planRoute, type Route } from './sim/route.ts'
import { SCENIC } from './city/scenic.ts'
import { unpackPoints, wholeWater, type CityPackage, type PackedArea, type PackedRail } from './city/package.ts'
import { loadRide, openCity } from './city/tilestore.ts'
import { PlantZones } from './city/zone-planting.ts'
import { mapEdges } from './city/ridefile.ts'
import type { AtlasManifest } from './render/buildings.ts'
import { SpeedLines, fovFor } from './ui/speedlines.ts'
import * as sfx from './ui/sfx.ts'
import { Cemetery, inCemetery } from './render/sf/cemetery.ts'
import { inGolfCourse } from './render/sf/golf.ts'

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
  /** road traffic (cars and buses): on unless `?cars=0` (2026-09-29) */
  cars?: boolean
  /**
   * `?input=fast` (the default on a keyboard) or `?input=slow` (src/sim/navigate.ts): fast, a held arrow steers and
   * the turn is taken at the corner; slow, a press declares the turn well before it, for trainers and the phone
   * bridge's second-late presses. Fast needs controls that can say what is held (`steerAxis`), or it falls back.
   */
  input?: 'fast' | 'slow'
  /**
   * `?route=auto` (the default) or `?route=manual`: auto, an accepted delivery is routed — to the pickup, then the
   * drop-off — and the game takes each turn of it, so a rider can just pedal (owner, 2026-09-30: "MOST users will
   * use auto-routing"); manual, finding the way is the game, as it was.
   */
  route?: 'auto' | 'manual'
  /** how much the device can hold (src/tier.ts); desktop when not said */
  tier?: Tier
  /** couch, trainer or trainer debug (src/modes.ts); trainer debug when not said (the tools' and tests' game) */
  mode?: GameMode
  /** world metres per physical metre, overriding the mode's (sim/ride.ts `speedup`) */
  speedup?: number
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
   * THE OPENING VIEW (2026-10-01, for the demo): with no `?at=`, no `?start=` and nothing to resume, the ride begins
   * where the city looks its best and facing the right way — not on the bake's arbitrary start edge (a side street,
   * facing a tree). `?start=` still gives the bake's own start.
   */
  const showcase = !opts.at && opts.startEdge === undefined ? SHOWCASE_START[opts.city] : undefined
  if (showcase) opts = { ...opts, at: { lat: showcase.lat, lon: showcase.lon } }
  // what this device can hold (src/tier.ts, BUGS.md #242): set before anything is built
  const tier = TIERS[opts.tier ?? 'desktop']
  // `?rings=2,5` tries other rings on a device without a code change (src/tier.ts has the defaults)
  const rings = new URLSearchParams(location.search).get('rings')?.split(',').map(Number)
  setRings(rings?.[0] ?? tier.view, rings?.[1] ?? tier.mid)
  setTextScale(tier.textScale)
  setGroundStride(tier.groundStride)
  setKeepGeometry(tier.keepGeometry)
  if (!tier.ao) off.add('ao')
  for (const w of tier.without) off.add(w)
  plog('tier', opts.tier ?? 'desktop')
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
  /*
   * THE BRIDGE DECKS (src/city/bridge-decks.ts): every bridge model the region knows the decks of, placed as its
   * manifest entry places it. The ways over it — the ride graph now, each tile's edges as they arrive — take its
   * deck's heights, so the rider, the cars and the GPS line are on the steel.
   */
  const bridgeDecks = new BridgeDecks()
  {
    const decls: Record<string, import('./city/bridge-decks.ts').DeckDecl[]> = src.index.region === 'san-francisco' ? SF_BRIDGE_DECKS : {}
    const pr = new Projection(src.index.origin)
    for (const e of landmarkList) {
      const d = e.procedural ? decls[e.procedural] : undefined
      if (d && e.lat !== undefined && e.lon !== undefined) bridgeDecks.add(placement({ ...e, lat: e.lat, lon: e.lon }, pr), d)
    }
  }
  // no tree on a bridge deck (the bake planted a row down the Golden Gate; src/city/plantings.ts no longer does,
  // and this keeps a package baked before that honest). The WAYS over a deck carry its heights from the bake
  // (src/city/bridge-decks.ts conformGraph, tools/bake.ts) — nothing is regraded here.
  // …nor a wood over the National Cemetery (render/sf/cemetery.ts, BUGS.md #246): the Presidio's forest planting covers
  // it, and the real one is open lawn between the rows with a few old trees — one tree in twelve is kept
  const cemeteryAt = src.index.region === 'san-francisco' ? inCemetery(new Projection(src.index.origin)) : null
  // …nor on the Presidio golf course's fairways, greens, tees and bunkers (render/sf/golf.ts): the woods between the
  // holes stay, but nothing grows on a grass or sand area inside its outline
  const golfAt = src.index.region === 'san-francisco' ? inGolfCourse(new Projection(src.index.origin)) : null
  const conformTile = (t: TileData): void => {
    if (bridgeDecks.size === 0 && !cemeteryAt && !golfAt) return
    const p = t.plantings
    if (p?.length) {
      const keep: number[] = []
      const keepY: number[] = []
      // the tile's mown and sandy ground, where it is on the course
      const open = golfAt ? t.areas.filter((a) => (a.kind === 'grass' || a.kind === 'sand') && a.ring.length >= 6 && golfAt(a.ring[0], a.ring[1])) : []
      const onOpen = (x: number, z: number): boolean => open.some((a) => {
        const r = a.ring
        let hit = false
        for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
          if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) hit = !hit
        }
        return hit
      })
      for (let i = 0; i + 4 < p.length; i += 5) {
        if (open.length && golfAt!(p[i], p[i + 1]) && onOpen(p[i], p[i + 1])) continue
        if (bridgeDecks.size > 0 && bridgeDecks.covers(p[i], p[i + 1])) continue
        if (cemeteryAt?.(p[i], p[i + 1]) && (Math.floor(p[i] * 7.3 + p[i + 1] * 3.1) & 0xff) % 12 !== 0) continue
        keep.push(p[i], p[i + 1], p[i + 2], p[i + 3], p[i + 4])
        if (t.plantingY) keepY.push(t.plantingY[i / 5])
      }
      if (keep.length !== p.length) { t.plantings = keep; if (t.plantingY) t.plantingY = keepY }
    }
  }
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
  // (`limitDeviceRatio`: an iPhone's 3x is nine times the pixels — the framebuffer and every full-screen target)
  const engine = new Engine(canvas, true, { antialias: true, limitDeviceRatio: tier.maxDpr === Infinity ? undefined : tier.maxDpr,
    doNotHandleContextLost: !tier.recoverContext }, true)
  capTextures(engine, tier.textureCaps)
  if (!tier.recoverContext) {
    // nothing kept to rebuild from, so a lost context (iOS can take it from a backgrounded tab) starts again
    canvas.addEventListener('webglcontextlost', () => location.reload())
  }
  plog('engine', Math.round(performance.now() - __t0))
  const __t1 = performance.now()
  const scene = new Scene(engine)
  // the Babylon lights, always (render/crowd-baked.ts, vegetation.ts): the rider's avatar is lit by them, and with
  // the crowd and the trees left out (iOS's ultra tier) nothing made any light — the rider rode as a black silhouette
  peopleLights(scene)
  /*
   * BABYLON'S VERTEX CACHE (BUGS.md #243): `refreshBoundingInfo` — ours, and Babylon's own for thin instances — keeps
   * every vertex of the mesh as a Vector3 object (`_positions`), for picking and collisions, which nothing here uses
   * but the debug probes. On iOS's ultra tier that was ~60 MB of a 250 MB heap: 860 000 Vector3s and their 2.6
   * million boxed numbers. Dropped every five seconds; Babylon rebuilds it if a pick ever asks.
   */
  setInterval(() => {
    for (const m of scene.meshes) {
      const info = (m as unknown as { _internalAbstractMeshDataInfo?: { _positions: unknown } })._internalAbstractMeshDataInfo
      if (info?._positions) info._positions = null
    }
  }, 5000)
  foliageLights(scene)
  if (!tier.recoverContext) {
    // and a texture's own copy of its source bytes (a glTF image's PNG, ~2 MB a leaf atlas) once it is on the GPU
    // (swept, not hooked: a texture whose image is already cached never fires its load observable)
    setInterval(() => {
      for (const t of scene.textures) {
        const tex = t as unknown as { _buffer?: unknown }
        if (tex._buffer && t.isReady()) tex._buffer = null
      }
    }, 3000)
  }
  scene.clearColor = new Color4(DAYLIGHT.fogColour.r, DAYLIGHT.fogColour.g, DAYLIGHT.fogColour.b, 1)
  /*
   * Babylon's OWN fog, for the one family of materials that is not a hand-written shader: the trees' and the
   * avatars' PBR (appearance audit, 2026-10-02 — the city faded into the haze and its trees did not, so every
   * distant hill wore a crop of dark trees floating over pale roofs). The same exponential law as the shaders'
   * `1 - exp(-depth * fogDensity)`, the same colour object (the hour's look mutates it in place), a quarter of
   * the density (`PBR_FOG`: PBR mixes in linear light); photo mode and the parks' air move it with the shaders' (render/photo.ts).
   */
  scene.fogMode = Scene.FOGMODE_EXP
  scene.fogColor = DAYLIGHT.fogColour
  scene.fogDensity = DAYLIGHT.fogDensity * PBR_FOG
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
  const city = new City(scene, { name: pkg.name, ground: pkg.ground, region: pkg.region, terrain: pkg.terrain, sea: index.sea,
    water: pkg.water, box: index.box, walls: index.walls, contentBox }, atlas, ASSETS).omit(off)
  /*
   * The sandy beaches' coastline (render/beach-surf.ts), and the beach face it gives the ground: the elevation data has
   * the sand 3 m over the sea at the waterline. Set before any tile drapes its ground.
   */
  const seaRings = index.sea !== undefined && index.sea !== null
    ? wholeWater(pkg).filter((a) => a.sea).map((a) => ({ ring: unpackPoints(a.ring), holes: (a.holes ?? []).map(unpackPoints) }))
    : []
  const beachShore = seaRings.length ? beachRuns(index.zones ?? [], seaRings, index.box ?? undefined) : []
  // and the rocky shores' (`water: 'waves'`), which get the same rollers breaking close in, and spray, but no beach face
  const rockShore = seaRings.length ? beachRuns(index.zones ?? [], seaRings, index.box ?? undefined, 'waves') : []
  if (index.sea !== undefined && index.sea !== null) city.terrain.shore = shoreRamp(beachShore, index.sea)
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
  // (the zones whose grass is dry: the Marin Headlands' summer-gold scrub, not a lawn)
  city.dryZones = (index.zones ?? []).filter((z) => z.props.dry)
  city.rainbowSpots = (region(pkg.region).rainbowCrossings ?? []).map((r) => ({ ...new Projection(pkg.origin).toLocal({ lat: r.lat, lon: r.lon }), radius: r.radius }))
  city.lanternStretches = (region(pkg.region).lanternStreets ?? []).map((l) => ({ street: l.street, colour: l.colour ?? [0.78, 0.1, 0.08],
    a: new Projection(pkg.origin).toLocal({ lat: l.from[0], lon: l.from[1] }), b: new Projection(pkg.origin).toLocal({ lat: l.to[0], lon: l.to[1] }) }))
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
    conformTile(ready)
    const t2 = performance.now()
    // the landmarks from every tile, near or far: an icon is seen from a kilometre and more
    for (const f of anyTile) f(raw)
    if (!full) {
      // what the mid ring's massing needs, and nothing else
      // (and a slim copy of the streets, for the road ribbons that run on ahead of the full ring: render/fringe.ts midRoads
      // — on the phone tiers only, whose full ring is the rider's own tile: on a desktop the full ring already reaches
      // 600 m, and ribbons over the whole mid ring were a hundred-odd more draw calls and a pale wash over the distance
      // in the fog — owner, 2026-10-03: "the game suddenly got much slower … everything look washed out")
      const slim = VIEW > 1 ? [] : ready.edges.filter((e) => !e.bridge && !e.tunnel && (e.layer ?? 0) <= 0)
        .map((e) => ({ id: e.id, a: e.a, b: e.b, points: e.points, heights: e.heights, width: e.width, walk: e.walk, foot: e.foot, kind: e.kind, layer: e.layer }) as typeof e)
      // (beside `edges`, not in them: a full tile at the ring's edge reads its neighbours' edges, and these are partial)
      if (tileLevel.get(k) === 'mid') prepared.tiles.set(k, { ...ready, edges: [], midEdges: slim, areas: [], trees: [], pois: [], furniture: [], landmarks: [], rails: [], plantings: [] } as typeof ready)
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
  // (`?edit=1`: the inspector, ui/inspector.ts, which needs the buildings' ids on their meshes)
  const editing = new URLSearchParams(location.search).get('edit') === '1'
  city.pickable = editing || new URLSearchParams(location.search).get('pick') === '1'
  // and the city beyond the box, as plain massing, so it does not stop at a field (render/fringe.ts)
  // (the bake leaves out of the fringe every building the city itself has)
  city.addLayer(fringeLayer(scene, region(pkg.region), city.terrain, ASSETS, new Set<number>()))
  mark('fringe')
  // the bare rock of the cliffs, in zones with `cliffs: true` (render/cliffs.ts)
  if (!off.has('cliffs')) {
    const cl = cliffsLayer(scene, index.zones ?? [], city.terrain, index.sea)
    if (cl) city.addLayer(cl)
  }
  // and Trail Trainer's boulders on them (render/boulders.ts), once their models have loaded
  if (!off.has('boulders')) {
    void bouldersLayer(scene, index.zones ?? [], city.terrain, index.sea, new URL('./', document.baseURI).href).then((l) => { if (l) city.addLayer(l) })
  }
  // the surf: on the sandy beaches rollers and swash, on the rocks (`water: 'waves'`) rollers and spray (render/beach-surf.ts)
  let beachCrowd: BeachCrowd | null = null
  if (index.sea !== undefined && index.sea !== null && !off.has('surf')) {
    const beach = beachSurfLayer(scene, city.terrain, index.sea, [...beachShore, ...rockShore])
    if (beach) city.addLayer(beach)
    // and the people on the sand, on towels, under umbrellas (render/beach-crowd.ts)
    if (beachShore.length && !off.has('beachcrowd')) {
      beachCrowd = new BeachCrowd(scene)
      city.addLayer(beachCrowd.layer(city.terrain, shoreFrame(beachShore), inBeachZone(index.zones ?? [])))
      const bc = beachCrowd
      ;(window as unknown as Record<string, unknown>).__beachLineup = (x: number, z: number) => bc.lineup(x, z, (a, b) => city.terrain.rawHeightAt(a, b))
    }
  }
  // café terraces on the pavement, where the region sets them out (render/terraces.ts)
  // the mid ring (PARIS_EXPAND §2): every building of a far tile as plain massing, so the city has a horizon
  if (!off.has('fringe')) {
    city.midBuild = (t) => [...massing(scene, [...t.buildings.map(asMassing), ...t.fringe],
      region(pkg.region), city.terrain, ASSETS, `mid:${t.key}`), ...(VIEW <= 1 ? midRoads(scene, (t as { midEdges?: typeof t.edges }).midEdges ?? t.edges, city.terrain, t.key) : [])]
  }
  if (region(pkg.region).furniture.terraces) city.addLayer(terracesLayer(scene, city.terrain))
  mark('terraces')
  // the river's parapets and the bouquinistes on the quays (render/quays.ts)
  city.addLayer(quaysLayer(scene, pkg, city.terrain, region(pkg.region).riverDrop ?? 0))
  // the bridges, each built once from its outline in its own design (render/bridge-structures.ts, BUGS.md #37)
  city.addLayer(bridgeStructuresLayer(scene, pkg, city.terrain, region(pkg.region).riverDrop ?? 0,
    pkg.region === 'paris' ? PARIS_BRIDGES : {}, (id) => city.coversOutline(id), pkg.region === 'paris' ? undefined : STEEL_OVER_WATER))
  mark('quays')
  // the arches and covered ways that take streets through buildings (render/passages.ts)
  city.addLayer(passagesLayer(scene, city.terrain))
  // the buildings people steer by, marked by their kind: flags on the civic ones, towers on the churches (BUGS.md #41)
  city.addLayer(quickMarksLayer(scene, city.terrain, pkg.region))
  // OSM's flagpoles and what they fly (render/flags.ts, tools/flags.ts)
  if (!off.has('flags')) {
    const fp = new Projection(pkg.origin)
    void flagPoles(document.baseURI, opts.city).then((poles) => {
      if (poles.length) city.addLayer(flagsLayer(scene, poles, (lat, lon) => fp.toLocal({ lat, lon }), city.terrain))
    })
  }
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
  // …and on open water, the region's routes: San Francisco's ferries and sailboats (render/sf/boats.ts)
  const bay: RiverTraffic[] = []
  if (!off.has('life')) {
    const p = new Projection(pkg.origin)
    for (const r of regionKit(pkg.region).routes ?? []) {
      bay.push(new RiverTraffic(scene, r.points.flatMap(([lat, lon]) => { const q = p.toLocal({ lat, lon }); return [q.x, q.z] }),
        (x, z) => city.waterLevelAt(x, z), r.fleet))
    }
  }
  mark('passages')
  // the MÉTROPOLITAIN lettering on the Guimard entrances (render/metrosigns.ts)
  if (region(pkg.region).pointFurniture.metro === 'guimard') {
    city.addLayer(metroSignsLayer(scene, city.terrain, (x, z) => city.streetBearing(x, z)))
  }
  const sky = off.has('sky') ? null : new Sky(scene)
  // ground landmarks pave, as trees clearings (render/vegetation.ts `clear`)
  const clearingsEarly: { x: number; z: number }[][] = []
  let treesReady = false
  let plantsClear: ((ring: { x: number; z: number }[]) => void) | null = null
  const landmarks = off.has('landmarks') ? null
    // (the sea's level, from the index: `deckAbove` — the piers — places by it; without it every pier fell through to
    //  the drape on the sea bed and stood 3-10 m under the water, BUGS.md #258)
    : new Landmarks(scene, { ...pkg, seaLevel: index.sea ?? null }, landmarkList, city.terrain, new URL(`landmarks/${pkg.region ?? opts.city}/`, document.baseURI).href)
  // each fitted to its own building as the tile with it arrives — the building as baked, before prepare took it out
  // the statues from the user's models, at most three in memory (render/statues.ts)
  const statues = off.has('landmarks') ? null : new Statues(scene, await statueManifest(document.baseURI, opts.city, pkg.region),
    pkg.origin, city.terrain, new URL('./', document.baseURI).href, () => landmarks?.placed ?? [])
  ;(window as unknown as { __statues?: unknown }).__statues = statues
  if (landmarks) {
    // a landmark that hand-builds a bridge or canopy suppresses the OSM way under it, the moment it is
    // placed and before any tile is handed over — see Landmarks.covers / City.coverRaised (BUGS.md #136)
    landmarks.onCover = (c) => city.coverRaised(c)
    // (the trees are made further down: a paving that arrives first is queued for them)
    landmarks.onGround = (ring) => { city.paveGround(ring); clearingsEarly.push(ring); if (treesReady) trees.clear(ring); plantsClear?.(ring) }
    landmarks.onFootprint = (ring) => { clearingsEarly.push(ring); if (treesReady) trees.clear(ring); plantsClear?.(ring) }
    landmarks.dryAt = (x, z) => city.dryAt(x, z)
    if (bridgeDecks.size > 0) city.modelDeck = (x, z) => bridgeDecks.drawn(x, z)
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
   * CARS ARE BACK, and dense (owner, 2026-09-29), reversing 2026-09-21's "this is a fantasy with no cars": the
   * delivery game is a spoof of gridlock. Dense traffic that turns at junctions under lights and stop signs, the
   * rider held behind cars on narrow streets, and collisions in junctions (sim/traffic.ts, sim/signals.ts; the
   * rules are in memory streetrunner-traffic-rules). `?cars=0` turns road traffic off; trains, trams and cable
   * cars run either way (they are drawn by Life from the rails, not by Traffic).
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
  // who may go at each junction: the renderer's lit junctions are the timed ones (sim/signals.ts)
  const signals = new Signals(graph, (id) => city.lit.has(id), (id) => city.litDecided(id))
  // how thick the traffic is, by zone (ZoneProps.traffic, a multiplier): Chinatown gridlocked, the Presidio quiet
  // (and how thick the CROWD is, ZoneProps.crowd, the same way: the parks full of walkers, the headlands empty)
  const zoneProp = (key: 'traffic' | 'crowd') => {
    const zs = (index.zones ?? []).filter((z) => typeof z.props[key] === 'number').sort((a, b) => b.priority - a.priority)
    return (p: { x: number; z: number }): number => {
      for (const z of zs) {
        const [x0, z0, x1, z1] = z.bbox
        if (p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1 && inRing(z.ring, p.x, p.z)) return z.props[key]!
      }
      return 1
    }
  }
  const zoneFactor = zoneProp('traffic')
  const crowdZone = zoneProp('crowd')
  const trafficLevel = trafficN !== null
    ? { density: trafficN, range: Math.max(220, 40 * Math.sqrt(trafficN)) }
    : !opts.cars ? 'none' as const
    : (opts.traffic && opts.traffic !== 'some' ? opts.traffic : 'dense' as const)
  /*
   * MARKET STREET IS CAR-FREE (owner, 2026-10-03: "buses and taxis only … and streetcars … and delivery bikes"): from
   * 10th Street to the Embarcadero since 2020. 10th meets Market at about x = −490 in San Francisco's frame.
   */
  const carFreeX = new Map<number, boolean>()
  const carFree = index.region === 'san-francisco' ? (e: { id: number; name?: string; points: { x: number; z: number }[] }): boolean => {
    if (e.name !== 'Market Street') return false
    let v = carFreeX.get(e.id)
    if (v === undefined) { v = e.points[Math.floor(e.points.length / 2)].x > -490; carFreeX.set(e.id, v) }
    return v
  } : undefined
  /*
   * …and NO VEHICLE on a service way mapped THROUGH a building (a passage): a private parking aisle under the Muni
   * yard at Mariposa and York (owner, 2026-10-07: "a tunnel with cars coming out of it … it stores streetcars"), a
   * garage's ramps, a hotel's loading bay — 273 of them in San Francisco. Cars spawned in them and drove out of the
   * walls. Streets through a building (an arcade, a covered lane) are still driven.
   */
  /*
   * …and none on SUNSET DUNES, the Upper Great Highway from Lincoln Way to Sloat Boulevard, closed to cars and made a park
   * in 2025 (owner, 2026-10-07: "famous bikeways … streets for bikes only"). The bake still has it as the primary road it
   * was; the rider rides it as before. (JFK Promenade and the closed loop of Twin Peaks Boulevard are already a
   * cycleway and pedestrian ways in OSM, which no car drives.)
   */
  const dunes = index.region === 'san-francisco'
    ? ((p: Projection) => ({ zN: p.toLocal({ lat: 37.7655, lon: -122.509 }).z, zS: p.toLocal({ lat: 37.7354, lon: -122.507 }).z }))(new Projection(pkg.origin))
    : null
  const closed = (e: { kind?: string; passage?: boolean; name?: string; points?: { x: number; z: number }[] }): boolean => {
    if (e.passage && e.kind === 'service') return true
    if (dunes && e.name === 'Great Highway' && e.points?.length) {
      const z = e.points[Math.floor(e.points.length / 2)].z
      return z > dunes.zS && z < dunes.zN
    }
    return false
  }
  const traffic = new Traffic(graph, trafficLevel, { signals, zoneFactor, carFree, closed })
  const courtPlayers = new CourtPlayers()
  // the never-stuck squeeze THROUGH a standing car: only on a trainer, which cannot back up (sim/traffic.ts `squeeze`)
  // …and in the trainer modes (slow input: a rider who may have no controls at all, owner 2026-10-03) the squeeze comes
  // sooner — the hands-off soak (tools/trainer-soak.ts) stood 5–8 s at junctions behind buses standing in the box
  const handsOff = !!opts.platform || opts.input === 'slow'
  traffic.squeeze = handsOff
  if (handsOff) traffic.squeezeAfter = 2.5
  traffic.rechooseOn = true
  let lastRider: RiderNow | null = null
  /*
   * WEAVING (sim/traffic.ts `weave`, owner 2026-09-29: "that's the whole advantage of a bike in a gridlocked city"):
   * each frame, the free strip past stopped traffic nearest where the rider is; the navigator steers across to it.
   */
  let weaveShift: number | null = 0
  /** the offset the weave last chose (metres right of the line), for its hold against dithering */
  let weaveAt: number | null = null
  /*
   * The crowd's CYCLISTS are solid too (owner, 2026-10-02: "you can pass right through npc cyclists, unlike npc
   * walkers"). Catching one up is no crash — that was a crash every 50 s, so they were left out altogether — the rider is
   * held behind one in their strip, at its pace, until they steer or weave past; and a step into one is undone (below).
   */
  const cyclistAhead = (r: RiderNow, shift: number): { gap: number; speed: number } | null => {
    const fx = Math.sin(r.heading), fz = Math.cos(r.heading)
    const rx = Math.cos(r.heading), rz = -Math.sin(r.heading)
    let best: { gap: number; speed: number } | null = null
    for (const w of crowd.all) {
      if (w.kind !== 'cycle') continue
      const dx = w.at.x - r.at.x, dz = w.at.z - r.at.z
      const along = dx * fx + dz * fz
      if (along <= 0 || along > 25 || Math.abs(dx * rx + dz * rz - shift) > 0.9) continue
      if (w.y !== undefined && r.y !== undefined && Math.abs(w.y - r.y) > 3.5) continue
      const gap = Math.max(0, along - 1.9)
      if (!best || gap < best.gap) best = { gap, speed: Math.max(0, w.speed * Math.cos(w.heading - r.heading)) }
    }
    return best
  }
  const cyclistInside = (box: ReturnType<typeof boxOf>, was: ReturnType<typeof boxOf>): boolean => {
    for (const w of crowd.all) {
      if (w.kind !== 'cycle' || Math.abs(w.at.x - box.x) > 4 || Math.abs(w.at.z - box.z) > 4) continue
      const b = boxOf(w.at.x, w.at.z, w.heading, SIZE.bike)
      if (overlap(box, b) && !overlap(was, b)) return true
    }
    return false
  }
  const heldBy = (r: RiderNow): { gap: number; speed: number } | null => {
    const car = carHeldBy(r)
    const bike = cyclistAhead(r, weaveShift ?? 0)
    return !bike ? car : !car || bike.gap < car.gap ? bike : car
  }
  const carHeldBy = (r: RiderNow): { gap: number; speed: number } | null => {
    const shift = weaveShift ?? 0
    const lead = traffic.leaderFor(r, shift)
    if (shift === 0 || Math.abs(shift) < 0.2) return lead
    // swinging out takes |shift| / 1.5 s (the navigator's sideways speed): no faster than covers the gap in that time
    const inWay = traffic.leaderFor(r, 0, true)
    if (!inWay) return lead
    /*
     * No faster than covers the gap left in the time it takes to swing clear — and with no 2 m/s floor any more (owner,
     * 2026-10-01: riding through cars). That floor rolled the bike into the bumper of a car standing in a junction faster
     * than it moved across. The sideways rate does not depend on the forward speed (Navigator: 1.5 m/s as long as the
     * bike is rolling at all), so a 0.12 m/s creep still swings out at full rate.
     */
    const cap = Math.max(0.12, (1.5 * Math.max(0, inWay.gap - 0.4)) / Math.abs(shift))
    const swing = { gap: 0, speed: cap }
    return !lead || swing.speed < lead.speed ? swing : lead
  }
  // the lights' live lamps, on the SAME clock the traffic obeys (with the traffic off, the lights still cycle)
  const lamps = off.has('furniture') ? null : new SignalLamps(scene)
  // San Francisco National Cemetery's headstones, as items (render/sf/cemetery.ts, BUGS.md #246)
  const cemetery = off.has('furniture') || index.region !== 'san-francisco' ? null : new Cemetery(scene, {
    proj: new Projection(pkg.origin),
    ground: (x, z) => city.terrain.heightAt(x, z),
    // the drives and paths across it (the street graph streamed in so far: it is built when the rider is near) and its
    // paved areas (the drives round the sections are mapped as areas as much as ways)
    ways: () => [...graph.edges.values()].map((e) => ({ points: e.points, half: e.width / 2 + (e.foot ? 0 : Math.max(0, e.walk ?? 0)) })),
    paved: () => pkg.areas.filter((a) => a.kind === 'paved').map((a) => unpackPoints(a.ring)),
    version: () => graph.edges.size,
  })
  let lightClock = 0
  let collisions = 0
  // a few seconds' grace after a collision: knocked down twice in a row while getting up is not fun
  let graceUntil = 0
  let heldStill = 0
  /** when the rider last stopped against a standing car (cars are solid, below): the hint comes sooner then */
  let solidAt = -1e9
  /** seconds stalled while asking to move, whatever is in the way: past STALL_LIMIT the rider is let through it */
  let stalled = 0
  let stallFrom: { x: number; z: number } | null = null
  // (a trainer cannot back up: sooner)
  const STALL_LIMIT = handsOff ? 3 : 8
  /*
   * THE BIKE'S STEERING (owner, 2026-09-29: "no animation when the bike is nudging… it should tilt a bit, with a
   * smooth fade in and out, and the front wheel should turn… at intersections it just flops to an angle and flops
   * back. We need a turning model"). One model for corners, nudges and weaving alike, from the motion as DRAWN:
   *
   *   * heading: the direction the drawn point actually moves — so a sideways nudge turns the bike a little
   *     towards where it is going, instead of sliding it crabwise;
   *   * lean: into the turn by its lateral acceleration, tan φ = v·ω/g (ω the rate that heading turns), eased in
   *     and out over a fraction of a second rather than switched on at the arc's first metre;
   *   * steer: the bars, by the kinematic bicycle, tan δ = L·ω/v (L ≈ 1 m of wheelbase), eased the same way —
   *     at walking pace a small turn is a big angle of bar, at speed a big turn is a small one.
   */
  let pAt: { x: number; z: number } | null = null
  let pHeading = 0
  let pYaw = 0
  let pLean = 0
  let pSteer = 0
  const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a))
  const bikePose = (dt: number, p: { x: number; z: number }, path: number, speed: number): { heading: number; lean: number; steer: number } => {
    const step = pAt ? Math.hypot(p.x - pAt.x, p.z - pAt.z) : Infinity
    // a jump, a teleport, a first frame, or getting off a cable car: start again, upright
    if (!pAt || dt <= 0 || step > speed * dt * 3 + 2) {
      pAt = { ...p }; pHeading = path; pYaw = 0; pLean = 0; pSteer = 0
      return { heading: path, lean: 0, steer: 0 }
    }
    let target = path
    // moving: the heading of the motion, never more than ~17° off the street's (a nudge is a gentle swerve: at 25°
    // it leaned 13°, measured, which read as a lurch)
    if (speed > 0.5 && step > 0.004) target = path + Math.max(-0.3, Math.min(0.3, wrap(Math.atan2(p.x - pAt.x, p.z - pAt.z) - path)))
    pAt = { ...p }
    const before = pHeading
    pHeading = wrap(pHeading + wrap(target - pHeading) * Math.min(1, dt * 6))
    const yaw = wrap(pHeading - before) / dt
    pYaw += (yaw - pYaw) * Math.min(1, dt * 5)
    // clockwise (a right turn) leans right, which the rider draws as a negative roll
    const lean = -Math.max(-0.35, Math.min(0.35, Math.atan((speed * pYaw) / 9.81)))
    pLean += (lean - pLean) * Math.min(1, dt * 5)
    // ×2.5: the true angle at riding speed is 1–4°, which nobody can see — a cartoon bike shows its steering
    const steer = speed > 0.3 ? Math.max(-0.5, Math.min(0.5, 2.5 * Math.atan((1.0 * pYaw) / Math.max(speed, 1.5)))) : pSteer * 0.9
    pSteer += (steer - pSteer) * Math.min(1, dt * 6)
    return { heading: pHeading, lean: pLean, steer: pSteer }
  }
  // the vehicle that last hit the rider: they stay put until it has cleared their way, so they never ride off
  // THROUGH it (owner, 2026-09-29: "you start moving BEFORE the car")
  let hitBy: Vehicle | null = null
  let hitUntil = 0
  const stillInWay = (r: RiderNow | null, now: number): boolean => {
    if (!hitBy || !r || now > hitUntil) { hitBy = null; return false }
    const hb = boxOf(hitBy.at.x, hitBy.at.z, hitBy.heading, hitBy.kind === 'bus' ? SIZE.bus : SIZE.car)
    const fx = Math.sin(r.heading)
    const fz = Math.cos(r.heading)
    for (let d = 0; d <= 3; d += 0.5) if (overlap({ ...r.box, x: r.box.x + fx * d, z: r.box.z + fz * d }, hb)) return true
    hitBy = null
    return false
  }
  // the crowd's own density: `?crowd=crowded` for a Saturday; the traffic level otherwise
  const crowdN = numArg('crowd')
  // (`without=crowd`, iOS's ultra tier: nobody on the pavements; the cars still drive)
  const crowdLevel = off.has('crowd') ? 'none' : (new URLSearchParams(location.search).get('crowd') as 'none' | 'some' | 'busy' | 'crowded' | null) ?? level
  const crowd = new Crowd(graph, crowdN !== null
    ? { perKm: crowdN, range: Math.max(260, 26 * Math.sqrt(crowdN)) }
    : crowdLevel, crowdZone)
  mark('crowd')
  crowd.setWater(wholeWater(pkg).map((a) => ({ ring: unpackPoints(a.ring), holes: (a.holes ?? []).map(unpackPoints) })))
  /*
   * The pools follow the density asked for (see `numArg` above), with the shipped defaults when nothing is.
   * Generous multiples of the density, because the count is over the whole populated RANGE, not per km.
   */
  /*
   * Dense traffic needs pools to match: the default 90 cars silently capped it (a pool that is full just stops
   * drawing). A few kilometres of street are in range at once, and a zone can triple the density.
   */
  const dense = trafficN === null && opts.cars && trafficLevel !== 'none'
  const budget = (trafficN !== null || crowdN !== null)
    ? {
        cars: Math.min(20000, Math.max(90, Math.round((trafficN ?? 11) * 120))),
        buses: Math.min(2000, Math.max(16, Math.round((trafficN ?? 11) * 8))),
        people: Math.min(40000, Math.max(3000, Math.round((crowdN ?? 95) * 60))),
      }
    : dense ? { cars: 900, buses: 80, people: 3000 } : undefined
  if (budget) console.log('[density] pools', budget, 'traffic', trafficN, 'crowd', crowdN)
  // the cars and buses by carkit (render/street-fleet.ts); `?without=carkit` for the old stand-ins
  const life = new Life(scene, pkg as unknown as CityPackage, budget, regionKit(pkg.region).stock, city.viaductStations, !off.has('carkit'))
  /*
   * SALESFORCE PARK'S GONDOLA (docs/SALESFORCE-PARK.md; the owner, 2026-10-02: "the gondola should be like a cable car
   * or streetcar"): a transit line of one cabin, shuttling between Salesforce Plaza and the park, boarded like the
   * cable cars. Not in OSM's railways, so its track is laid here, where the Transit Center model is placed.
   */
  {
    const e = landmarkList.find((x) => x.procedural === 'salesforceTransitCenter')
    if (e && e.lat !== undefined && e.lon !== undefined && pkg.region === 'san-francisco') {
      const pl = placement({ ...e, lat: e.lat, lon: e.lon }, new Projection(pkg.origin))
      const ends = [GONDOLA_TRACK.lower, GONDOLA_TRACK.upper]
      const pts = Array.from({ length: 6 }, (_, i) => {
        const f = i / 5
        const m = { x: ends[0].x + f * (ends[1].x - ends[0].x), z: ends[0].z + f * (ends[1].z - ends[0].z) }
        const w = toWorld(pl, m)
        return { x: w.x, z: w.z, y: pl.baseY + ends[0].y + f * (ends[1].y - ends[0].y) }
      })
      life.addRails([{ id: -573719373, kind: 'tram', gondola: true, points: pts.flatMap((p) => [p.x, p.z]), heights: pts.map((p) => p.y) } as PackedRail])
    }
  }
  /*
   * Which way each street track runs (render/life.ts `trackDirection`): the street nearest the middle of the track, and
   * which side of it the track lies on — on the right of the way it runs, as the traffic keeps right. A track within
   * half a metre of the street's centre line is a single track, run both ways. Asked once per train, once its street
   * is in.
   */
  life.trackDirection = (pts) => {
    let n = 0
    for (let i = 1; i < pts.length; i++) n += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
    let acc = 0, mid = pts[0], dir = { x: 0, z: 1 }
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
      if (acc + l >= n / 2) { const t = (n / 2 - acc) / (l || 1); mid = { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, z: pts[i - 1].z + (pts[i].z - pts[i - 1].z) * t }; dir = { x: (pts[i].x - pts[i - 1].x) / (l || 1), z: (pts[i].z - pts[i - 1].z) / (l || 1) }; break }
      acc += l
    }
    let best: { d: number; q: { x: number; z: number }; e?: Edge } | null = null
    for (const id of city.edgesNear(mid.x, mid.z)) {
      const e = graph.edges.get(id)
      if (!e || e.foot) continue
      for (let i = 1; i < e.points.length; i++) {
        const a = e.points[i - 1], b = e.points[i]
        const dx = b.x - a.x, dz = b.z - a.z
        const t = Math.max(0, Math.min(1, ((mid.x - a.x) * dx + (mid.z - a.z) * dz) / (dx * dx + dz * dz || 1e-9)))
        const q = { x: a.x + dx * t, z: a.z + dz * t }
        const d = Math.hypot(mid.x - q.x, mid.z - q.z)
        if (d < 12 && (!best || d < best.d)) best = { d, q, e }
      }
    }
    if (!best) return undefined
    // a single track down the middle, run both ways: still on the lane line to the right of whichever way it goes
    if (best.d < 0.5) return { dir: null, d: best.d, lane: best.e ? laneOf(best.e) : 0 }
    // the right of the direction a→b is (dz, −dx): the track to the right of the street's line, it runs a→b
    const side = (mid.x - best.q.x) * dir.z - (mid.z - best.q.z) * dir.x
    // and onto the traffic's lane line for that street: `laneOf` to the right of its way, from `best.d` now
    return { dir: side > 0 ? 1 : -1, d: best.d, lane: best.e ? laneOf(best.e) : 0 }
  }
  // street tunnels (render/tunnels.ts): the inside drawn only with the camera in it, the mouths otherwise
  const tunnels = new Tunnels(scene, city.terrain, pkg.region === 'san-francisco' ? SF_TUNNELS : {})
  onTile((a) => tunnels.add(a.ready.edges))
  ;(window as unknown as Record<string, unknown>).__tunnels = tunnels
  // the tram track in the street, and the wires over the electric track (render/street-rails.ts, overhead.ts)
  city.addLayer(streetRailsLayer(scene, city.terrain))
  // the public stairways as stairs (render/stairs.ts)
  city.addLayer(stairsLayer(scene, city.terrain, pkg.region === 'san-francisco' ? SF_STAIRWAYS : {}, (x, z) => city.inCover(x, z),
    (region(pkg.region).rainbowStairs ?? []).map((r) => ({ ...new Projection(pkg.origin).toLocal({ lat: r.lat, lon: r.lon }), radius: r.radius }))))
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
  /*
   * A DIFFERENT RIDER EVERY LOAD (owner, 2026-10-03: "we had decided to make the avatar random (with random clothes)
   * on each load. That's a fun little gimmick"): an avatar-kit body from a random seed, dressed for the city — trousers
   * on a bike (a skirt hangs through the saddle), sports kit on foot. Frozen shots keep the preset, so they repeat;
   * `?rider=<n>` picks a seed.
   */
  const riderSeed = new URLSearchParams(location.search).get('rider')
  const riderSpec = opts.freeze && riderSeed === null ? undefined
    : (() => { const seed = riderSeed !== null ? Number(riderSeed) : Math.floor(Math.random() * 1e9); return cityClothes(randomSpec(seed), seed, opts.device === 'bike' ? -1 : 0) })()
  const rider = off.has('rider') ? null : Rider.create(scene, opts.device, riderSpec ? { spec: riderSpec } : {})
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
    const c = new BakedCrowd(scene, opts.bodies ?? tier.bodies)
    void c.ready.then(() => {
      strangers = c
      ;(window as unknown as { crowdReady?: boolean }).crowdReady = true
    })
  })
  const floraOf = regionKit(pkg.region).flora
  const trees: Vegetation = new Vegetation(scene, city.terrain, new URL('trees/', document.baseURI).href,
    floraOf?.((x, z) => new Projection(pkg.origin).toLatLon({ x, z })), opts.veg ?? CANOPY, opts.vegMerge !== false)
  if (!off.has('trees')) city.addLayer(trees.layer())
  treesReady = true
  for (const r of clearingsEarly) trees.clear(r)
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
  // (the clearings the landmarks have asked for so far, and every one from now on)
  for (const r of clearingsEarly) plants.clearings.push(r)
  plantsClear = (ring) => plants.clear(ring)
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
  // the showcase start faces its view: turned round if the street was found running the other way
  if (showcase && Math.cos(nav.heading() - showcase.heading) < 0) nav.turnAround()
  nav.fast = opts.input !== 'slow' && !!controls.steerAxis
  // slow input: ↑ cancels a signalled turn that has not latched yet, rather than adding power (src/controls.ts)
  if (controls instanceof LocalControls) controls.turnPending = () => !nav.fast && !nav.isCommitted && nav.requested !== 'straight'
  // fast input: the direction held last frame, so a fresh press is also a tap (a turn just ahead, however brief)
  let lastAxis: -1 | 0 | 1 = 0
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
  const play = MODES[opts.mode ?? 'debug']
  ride.speedup = opts.speedup && opts.speedup > 0 ? opts.speedup : play.speedup
  /*
   * COUCH MODE's energy bar (sim/energy.ts): the watts typed with ↑/↓ are paid for out of it, and an empty bar caps
   * them until it has refilled a little. Shown under the speed.
   */
  const energy = play.energy ? new Energy() : null
  const energyBar = energy && !opts.freeze ? (() => {
    const el = document.createElement('div')
    el.className = 'sr-energy'
    el.innerHTML = '<span class="label">energy</span><span class="track"><span class="fill"></span></span>'
    document.body.appendChild(el)
    return { el, fill: el.querySelector('.fill') as HTMLElement }
  })() : null
  const hud = new Hud(document.getElementById('hud')!, () => (controls.press ? controls.press('back') : nav.turnAround()))
  hud.setUnits(region(pkg.region).units)

  /*
   * THE DELIVERY GAME (src/game/delivery.ts, 2026-09-29): a job offer pops up — pick up at one building, deliver to
   * another, both within a kilometre — and the rider takes it (Y) or not (X, or just ignore it: then it is a free
   * ride and nothing at all happens). The logic is its own module; what it asks of the city is answered here.
   */
  const shorten = (n: string): string => n.replace(/\bStreet\b/, 'St').replace(/\bAvenue\b/, 'Ave')
    .replace(/\bBoulevard\b/, 'Blvd').replace(/\bDrive\b/, 'Dr').replace(/\bPlace\b/, 'Pl').replace(/\bTerrace\b/, 'Ter')
  // the named intersections, gridded, rebuilt when the street graph has grown (tiles stream in)
  let junctionGrid = new Map<string, { x: number; z: number; name: string }[]>()
  let gridFor = -1
  const namedJunctions = (): Map<string, { x: number; z: number; name: string }[]> => {
    if (gridFor === graph.nodes.size) return junctionGrid
    gridFor = graph.nodes.size
    junctionGrid = new Map()
    for (const n of graph.nodes.values()) {
      const named: { name: string; w: number }[] = []
      for (const id of n.edges) {
        const e = graph.edges.get(id)
        if (!e || e.foot || !e.name) continue
        const nm = shorten(e.name)
        if (!named.some((q) => q.name === nm)) named.push({ name: nm, w: e.width })
      }
      if (named.length < 2) continue
      named.sort((a, b) => b.w - a.w)
      const k = `${Math.floor(n.at.x / 100)},${Math.floor(n.at.z / 100)}`
      const l = junctionGrid.get(k) ?? junctionGrid.set(k, []).get(k)!
      l.push({ x: n.at.x, z: n.at.z, name: `${named[0].name} & ${named[1].name}` })
    }
    return junctionGrid
  }
  // the nearest point of a street the rider can ride (not a tunnel, not a raised deck) to any wall of a footprint:
  // how far a building is from the street, and where its "door" is for the beacon's marker on the street
  const streetPoint = (ring: number[]): { d: number; x: number; z: number } => {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < ring.length; i += 2) { x0 = Math.min(x0, ring[i]); x1 = Math.max(x1, ring[i]); z0 = Math.min(z0, ring[i + 1]); z1 = Math.max(z1, ring[i + 1]) }
    const best = { d: Infinity, x: ring[0], z: ring[1] }
    for (const e of graph.edges.values()) {
      if (e.raised || e.tunnel) continue
      const p = e.points
      for (let k = 1; k < p.length; k++) {
        const a = p[k - 1]
        const b = p[k]
        // a cheap reject: the segment is nowhere near the footprint's box
        if (Math.min(a.x, b.x) > x1 + 40 || Math.max(a.x, b.x) < x0 - 40 || Math.min(a.z, b.z) > z1 + 40 || Math.max(a.z, b.z) < z0 - 40) continue
        for (let i = 0; i < ring.length; i += 2) {
          const dx = b.x - a.x
          const dz = b.z - a.z
          const l2 = dx * dx + dz * dz || 1e-9
          const t = Math.max(0, Math.min(1, ((ring[i] - a.x) * dx + (ring[i + 1] - a.z) * dz) / l2))
          const d = Math.hypot(a.x + dx * t - ring[i], a.z + dz * t - ring[i + 1])
          if (d < best.d) { best.d = d; best.x = a.x + dx * t; best.z = a.z + dz * t }
        }
      }
    }
    return best
  }
  // the long jobs over the Bay Bridge (src/city/sf/bridges.ts), in this city's metres
  const crossings = (src.index.region === 'san-francisco' ? BAY_CROSSINGS : []).map((c) => {
    const pr = new Projection(src.index.origin)
    const f = pr.toLocal({ lat: c.from.lat, lon: c.from.lon })
    return { name: c.name, chance: c.chance, from: { x: f.x, z: f.z, r: c.from.r },
      places: c.places.map((p) => ({ name: p.name, ...pr.toLocal({ lat: p.lat, lon: p.lon }) })) }
  })
  /*
   * THE KITCHENS (game/delivery.ts `Source`; owner, 2026-10-01): invented restaurants at fixed places, where jobs
   * start. San Francisco's are in src/city/sf/restaurants.json; a city without any keeps the old building-to-building
   * jobs. The LEVEL sets how far a drop-off may be (500 m at level 1): it rises every three deliveries in this city
   * (kept in the browser), or `?level=` sets it.
   */
  const kitchens: Source[] = src.index.region === 'san-francisco' ? (() => {
    const pr = new Projection(pkg.origin)
    return SF_KITCHENS.restaurants.map((k) => ({ ...k, ...pr.toLocal({ lat: k.lat, lon: k.lon }) }))
  })() : []
  const builtTiles = new Set((index.tiles ?? []).filter((t) => t.buildings > 0).map((t) => tileKey(t.tx, t.tz)))
  const DELIVERED_KEY = `sr-delivered:${opts.city}`
  // what the deliveries have earned, kept like the count (the receipt adds to it; shown by the energy bar)
  const EARNED_KEY = `sr-earned:${opts.city}`
  let earned = 0
  try { earned = Number(localStorage.getItem(EARNED_KEY)) || 0 } catch { /* private mode */ }
  let delivered = 0
  try { delivered = Number(localStorage.getItem(DELIVERED_KEY)) || 0 } catch { /* private mode: start at 0 */ }
  const askedLevel = Number(new URLSearchParams(location.search).get('level'))
  const levelFor = (n: number): number => askedLevel > 0 ? askedLevel : Math.min(DELIVERY_DEFAULTS.levels.length, 1 + Math.floor(n / 3))
  const delivery = new Delivery({
    builtAt: (x, z) => builtTiles.has(tileKey(Math.floor(x / TILE), Math.floor(z / TILE))),
    nameAt: (x, z) => {
      // the nearest named street on the ride graph (a far drop-off, before its tiles are in to find a crossing)
      let best: { name: string; d: number } | null = null
      for (const e of rides.edges.values()) {
        if (!e.name) continue
        const d = Math.hypot(e.points[0].x - x, e.points[0].z - z)
        if (d < 250 && (!best || d < best.d)) best = { name: e.name, d }
      }
      return best ? `${best.name}` : null
    },
    buildingsNear: (x, z, r) => {
      const out: { id: number; ring: number[]; height: number; baseY: number }[] = []
      for (const t of prepared.tiles.values()) {
        for (const b of t.buildings) {
          if ((b.minHeight ?? 0) > 1 || b.ring.length < 6) continue
          if (Math.hypot(b.ring[0] - x, b.ring[1] - z) > r + 60) continue
          // the height and the foot, for lighting it up: the baked foot where the map has one (map format v3)
          const height = b.height ?? (b.levels ? b.levels * 3.2 : 10)
          const baseY = b.baseY ?? city.terrain.heightAt(b.ring[0], b.ring[1])
          out.push({ id: b.id, ring: b.ring, height, baseY })
        }
      }
      return out
    },
    streetDistance: (ring) => streetPoint(ring).d,
    junctionNear: (x, z, reach) => {
      const grid = namedJunctions()
      let best: { name: string; d: number } | null = null
      const cells = Math.ceil(reach / 100)
      const cx = Math.floor(x / 100)
      const cz = Math.floor(z / 100)
      for (let i = -cells; i <= cells; i++) for (let j = -cells; j <= cells; j++) {
        for (const q of grid.get(`${cx + i},${cz + j}`) ?? []) {
          const d = Math.hypot(q.x - x, q.z - z)
          if (d <= reach && (!best || d < best.d)) best = { name: q.name, d }
        }
      }
      return best
    },
  }, { crossings, autoAccept: play.autoAccept, sources: kitchens })
  delivery.level = levelFor(delivered)
  const deliveryCard = new DeliveryCard()
  if (!opts.freeze) deliveryCard.cash(earned)
  /*
   * FERRIES AND MUNI METRO (game/stations.ts, ui/travel.ts): ride up to a terminal or a stop, pick where to go, pay the
   * fare from what the deliveries earned (it may go below zero: travel is never refused), fade to black, and arrive.
   */
  const travel = opts.freeze ? null : new TravelCard()
  const stations: (Station & { x: number; z: number })[] = index.region === 'san-francisco'
    ? SF_STATIONS.map((st) => ({ ...st, ...new Projection(pkg.origin).toLocal({ lat: st.lat, lon: st.lon }) })) : []
  if (travel) travel.onGo = (to, fare) => {
    const jump = (window as unknown as { __jump?: (lat: number, lon: number) => boolean }).__jump
    if (!jump?.(to.lat, to.lon)) return
    earned -= fare
    try { localStorage.setItem(EARNED_KEY, earned.toFixed(2)) } catch { /* fine */ }
    deliveryCard.cash(earned, true)
    hud.banner(to.line === 'ferry' ? `Ferry to ${to.name}` : `Muni Metro to ${to.name}`, `fare $${fare.toFixed(2)}`)
  }
  // the target building, lit up (render/beacon.ts)
  const beacon = new Beacon(scene)
  const light = (s: Stop | null, kind: 'pickup' | 'dropoff'): void =>
    beacon.show(s ? { ring: s.ring, baseY: s.baseY ?? 0, height: s.height ?? 10, kind, door: doorOf(s) } : null)
  const doorOf = (s: Stop): { x: number; y: number; z: number } => {
    const p = streetPoint(s.ring)
    return { x: p.x, z: p.z, y: city.terrain.heightAt(p.x, p.z) }
  }
  /*
   * AUTO-ROUTING (`?route=auto`, the default): the job's stop is the destination — its door on the street — and
   * the navigator follows the planned route turn by turn, as it does for a pinned destination (the GPS). The plan is
   * on the ride network, which is what keeps it off the freeways nobody rides (src/city/ridegraph.ts).
   */
  let deliveryRouted = false
  const routeTo = (s: Stop | null): void => {
    if (opts.route === 'manual') return
    if (!s) { deliveryRouted = false; clearRoute(); return }
    const p = streetPoint(s.ring)
    destination = { x: p.x, z: p.z }
    tour = null
    deliveryRouted = true
    replan()
  }
  const onDelivery = (events: DeliveryEvent[]): void => {
    for (const ev of events) {
      if (ev.kind === 'offer') {
        const take = (): void => onDelivery(delivery.accept())
        const skip = (): void => onDelivery(delivery.decline())
        deliveryCard.offer(ev.job, play.autoAccept ?? DELIVERY_DEFAULTS.offerLasts, take, skip, opts.route !== 'manual', play.autoAccept !== null)
        // trainer mode: on the phone too, beside the d-pad (src/platform.ts `offer`)
        opts.platform?.offer(`${ev.job.item?.emoji ?? '📦'} ${ev.job.item?.name ?? 'a parcel'}: ${ev.job.pickup.label} → ${ev.job.dropoff.label}`, play.autoAccept ?? DELIVERY_DEFAULTS.offerLasts, take, skip)
      } else if (ev.kind === 'offerExpired' || ev.kind === 'declined') {
        deliveryCard.hideOffer()
        opts.platform?.endOffer()
      } else if (ev.kind === 'accepted') {
        deliveryCard.hideOffer()
        opts.platform?.endOffer()
        const what = ev.job.item ? `${ev.job.item.emoji} ` : ''
        deliveryCard.going(`1 · Pick up ${what}${ev.job.source ? 'at' : 'near'} ${ev.job.pickup.label}`)
        light(ev.job.pickup, 'pickup')
        routeTo(ev.job.pickup)
        hud.banner('Go!', `pick up ${ev.job.item ? `the ${ev.job.item.name} ` : ''}${ev.job.source ? 'at' : 'near'} ${ev.job.pickup.label}`, 3000)
      } else if (ev.kind === 'pickedUp') {
        const what = ev.job.item ? `${ev.job.item.emoji} ` : ''
        deliveryCard.going(`2 · Deliver ${what}near ${ev.job.dropoff.label}`)
        light(ev.job.dropoff, 'dropoff')
        routeTo(ev.job.dropoff)
        sfx.pickup()
        hud.banner('Picked up!', `${ev.job.item?.fragile ? 'FRAGILE — no crashes! ' : ''}now deliver near ${ev.job.dropoff.label}`, 3000)
      } else if (ev.kind === 'stopMoved') {
        // (a far stop pinned to its building once its tiles came in: light that, and route to its door — if it is
        // the leg being ridden; a pickup pinned while still on offer just waits)
        if (ev.stop === 'dropoff' || delivery.phase === 'toPickup') {
          light(ev.job[ev.stop], ev.stop)
          routeTo(ev.job[ev.stop])
        }
      } else if (ev.kind === 'forfeit') {
        // a jump on the map: the job is off, unpaid (no teleporting to the door). And an offer still on the card goes
        // with it (owner, 2026-10-05: a jump with the offer open left it stuck — the job was gone, so its buttons did
        // nothing and it never timed out)
        deliveryCard.hideOffer()
        opts.platform?.endOffer()
        deliveryCard.going(null)
        light(null, 'pickup')
        routeTo(null)
        hud.banner('Delivery forfeit', `jumped away from the ${ev.job.item?.name ?? 'order'} · job cancelled, no pay`, 4500)
      } else if (ev.kind === 'spoiled') {
        // a fragile item and a collision: the job is off
        deliveryCard.going(null)
        light(null, 'pickup')
        routeTo(null)
        sfx.spoiled()
        hud.banner(`${ev.job.item?.emoji ?? ''} Splat!`, `the ${ev.job.item?.name ?? 'delivery'} did not survive · job cancelled`, 4500)
      } else if (ev.kind === 'eaten') {
        // the pass: full energy, no pay, one star, and the customer has something to say
        deliveryCard.going(null)
        light(null, 'pickup')
        routeTo(null)
        eatHint = 0
        if (energy) { energy.level = 1; energy.bonked = false }
        const line = ATE_LINES[Math.floor(Math.random() * ATE_LINES.length)]
        deliveryCard.receipt(ev.job, { stars: 1, fee: 0, tip: 0, line }, ev.seconds, null, `Ate the ${ev.job.item?.name ?? 'order'}`)
        hud.banner(`${ev.job.item?.emoji ?? '🍽'} Mmm.`, 'full energy · no pay for this one', 3500)
      } else if (ev.kind === 'delivered') {
        deliveryCard.going(null)
        light(null, 'pickup')
        routeTo(null)
        delivered++
        try { localStorage.setItem(DELIVERED_KEY, String(delivered)) } catch { /* fine */ }
        const was = delivery.level
        delivery.level = levelFor(delivered)
        // the customer's stars and the pay (game/delivery.ts `rate`): judged at a steady rider's pace in this mode
        const r = rate(ev.job, ev.seconds, ev.bumps, was, 6.5 * play.speedup)
        earned += r.fee + r.tip
        try { localStorage.setItem(EARNED_KEY, earned.toFixed(2)) } catch { /* fine */ }
        deliveryCard.receipt(ev.job, r, ev.seconds, delivery.level > was ? delivery.level : null)
        deliveryCard.cash(earned, true)
      }
    }
  }
  addEventListener('keydown', (e) => { if (deliveryCard.key(e.code)) e.preventDefault() })
  // E eats the order you are carrying (the pass); the hint comes up, for a few seconds a minute, once you are very late
  let eatHint = 0
  addEventListener('keydown', (e) => {
    if (e.code !== 'KeyE' || frozen || (e.target instanceof HTMLElement && e.target.closest('input, textarea, select'))) return
    onDelivery(delivery.eat())
  })
  ;(window as unknown as Record<string, unknown>).__delivery = delivery
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
    // hidden for now (owner, 2026-10-01: "remove the routes menu … but keep underlying functionality"): `?routes=1`
    if (new URLSearchParams(location.search).get('routes') === '1') document.body.appendChild(menu)
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
  // the navigator's steering state, for probes of the two input modes (read-only)
  ;(window as unknown as Record<string, unknown>).__nav = () => {
    const j = nav.next()
    return { fast: nav.fast, requested: nav.requested, committed: nav.isCommitted, heading: nav.heading(), edge: nav.edge.id,
      across: nav.nudged, next: j ? { ahead: j.ahead, turns: [...j.turns], passThrough: j.passThrough, deadEnd: j.deadEnd } : null }
  }
  ;(window as unknown as Record<string, unknown>).__routeLeft = () => (route ? Math.round(route.length) : null)
  ;(window as unknown as Record<string, unknown>).__travelled = () => nav.travelled
  // where the rider is, for the bike/run switch to carry over (main.ts)
  ;(window as unknown as Record<string, unknown>).__here = () => { const ll = proj.toLatLon(lastAt); return `${ll.lat.toFixed(6)},${ll.lon.toFixed(6)}` }
  ;(window as unknown as Record<string, unknown>).__route = (lat: number, lon: number) => {
    destination = new Projection(pkg.origin).toLocal({ lat, lon })
    replan()
    return route ? { length: Math.round(route.length), junctions: route.nodes.length, turnRound: route.turnRound } : null
  }
  // the same in the code frame, for probes that ride a delivery (the game itself never draws the job's route)
  ;(window as unknown as Record<string, unknown>).__routeXZ = (x: number, z: number) => {
    destination = { x, z }
    replan()
    return route ? { length: Math.round(route.length), junctions: route.nodes.length } : null
  }
  // everyone has subscribed: the tiles need not be kept for replaying any more
  keepArrived = false
  arrived.length = 0
  seenRaw.length = 0
  mark('minimap')
  minimap.landmarks = (pkg.landmarks ?? []).map((l) => ({ x: l.x, z: l.z, name: l.name, tier: l.tier }))
  const tier1 = (pkg.landmarks ?? []).filter((l) => l.tier === 1)

  addEventListener('keydown', (e) => {
    // Escape leaves the big map from anywhere — the landmark search has the focus while it is open, and M typed there is
    // a letter (owner, 2026-10-03: "hard to get out of map mode … you should just be able to press escape")
    const leaving = e.code === 'Escape' && minimap.isLarge
    if (!leaving && (e.code !== 'KeyM' || (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')))) return
    if (leaving) e.preventDefault()
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
  /** where the gondola's cabin was when the rider boarded it: they get off at the other station */
  let gondolaFrom: { x: number; z: number } | null = null
  /** the lift being ridden: seconds in it, and the one just ridden (not held in again on the way out of it) */
  let liftTime = 0
  let liftUsed = -1
  /** why the rider is held this frame, for the probes (`__ride().hold`) */
  let holdWhy = ''
  let welcomeFor = 0
  let welcomePedal = 0
  /** what the rider was held behind last frame, for the probes (tools/trainer-soak.ts) */
  let lastLead: { gap: number; speed: number } | null = null
  const BOARDABLE = new Map<number, TransitKind>([[2, 'streetcar'], [3, 'cable'], [5, 'gondola']])
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
    // (never onto the gondola's way: getting off the gondola there would put the rider straight back aboard)
    const got = nearestOnGraph(rides, p, (e) => e.name === GONDOLA_NAME || e.name === LIFT_NAME)
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
    transitAction()
  })
  /** B, or a tap on the transit line: off if aboard, on if something is boardable (owner, 2026-10-03: no way to board on mobile) */
  function transitAction(): void {
    if (transit.aboard) {
      const r = transit.alight(placeOnGraph)
      if (r.status === 'ok') { backOnStreet(r.pos); hud.banner('Off you get', placeName(nav.at())) }
      else if (transit.prompt()?.includes('Esc')) {
        // (lost: the escape hatch, which on a phone is the same tap)
        const pos = transit.abandon(placeOnGraph)
        if (pos) backOnStreet(pos)
        hud.banner('Off the transit', 'put back on the nearest street')
      } else hud.note('no street to get off onto here')
      return
    }
    const v = transit.boardable
    if (!v) return
    if (transit.board(nav.position)) {
      destination = null
      tour = null
      clearRoute()
      if (v.kind === 'gondola') {
        // boarded with B rather than by waiting at the station: it still puts the rider off at the other end
        const a = transit.aboard!
        gondolaFrom = { x: a.x, z: a.z }
        hud.banner('Aboard the gondola', a.y - city.terrain.heightAt(a.x, a.z) > 8 ? 'down to Salesforce Plaza' : 'up to Salesforce Park')
      } else hud.banner(`Aboard the ${v.name ?? (v.kind === 'cable' ? 'cable car' : 'streetcar')}`, `${keyed('B', 'get off')} anywhere there is a street`)
    }
  }
  hud.onTransitTap = transitAction

  // debugging: freeze and look around, and copy where you are (see ui/debug.ts)
  const orbit = new OrbitLook(canvas)
  const proj = new Projection(pkg.origin)
  let frozen = false
  // A and D nudge across the street at any time while riding (the arrows nudge only when the next junction is far,
  // and are turn requests near one); not while frozen, where WASD flies the camera
  addEventListener('keydown', (e) => {
    // (fast input: A and D are held steering like the arrows — src/controls.ts `steerAxis`)
    if (frozen || nav.fast || (e.code !== 'KeyA' && e.code !== 'KeyD')) return
    nav.nudge(e.code === 'KeyA' ? -1 : 1)
    hud.note(e.code === 'KeyA' ? '← nudge' : 'nudge →')
  })
  let lastAt = { x: 0, z: 0 }
  let lastY = 0
  /**
   * A camera held exactly somewhere (tools/views.ts, `window.__view`): the view files store the best place to
   * see each landmark from, and the city streams round what is looked at, as it does for the orbit look.
   */
  let held: { from: Vector3; to: Vector3 } | null = null
  let lastWant = 0
  // the inspector, for editing (`?edit=1`, I): what a building or a model is, and where its data came from
  if (editing) {
    const pr = new Projection(pkg.origin)
    new Inspector({
      scene,
      latLon: (x, z) => pr.toLatLon({ x, z }),
      building: (id) => {
        for (const [k, t] of prepared.tiles) {
          const b = t.buildings.find((q) => q.id === id) ?? t.fringe?.find((q) => (q as { id?: number }).id === id)
          if (b) return { tile: k, b: b as unknown as Record<string, unknown> }
        }
        return null
      },
      entriesFor: (id, partOf) => landmarkList.filter((e) => { const ids = packedIds(e); return ids.includes(id) || (partOf !== undefined && ids.includes(partOf)) }) as unknown as Record<string, unknown>[],
      model: (name) => ({
        entry: (landmarkList.find((e) => e.name === name) ?? null) as unknown as Record<string, unknown> | null,
        placed: (landmarks?.placed.find((p) => p.name === name) ?? null) as unknown as Record<string, unknown> | null,
      }),
    }, canvas)
  }
  // the paused camera's arrows on a touch screen (ui/debug.ts LookPad)
  const lookPad = touchScreen() ? new LookPad(orbit) : null
  const debug = new DebugPanel(() => {
    held = null
    frozen = !frozen
    orbit.active = frozen
    // (⏸ out of an observation: the Camera Obscura's table goes with it — on a phone it is the only way out)
    if (!frozen && observing) { observing = null; leaveTable() }
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
    lookPad?.show(frozen)
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
   * OBSERVE FROM THE TOP (owner, 2026-10-03: "a toast that allows you to press o to Observe from the top of major high up
   * landmarks, like Sutro, Salesforce Tower, Coit Tower, de Young Tower"). Near one, a pill offers it (tappable on a
   * phone); O lifts the paused camera to its top to look round, O or P comes back down. Heights are the viewing level,
   * metres over the ground at its foot.
   */
  const OBSERVE = pkg.region === 'san-francisco' ? [
    { name: 'Sutro Tower', lat: 37.75523, lon: -122.45277, top: 235 },
    { name: 'Salesforce Tower', lat: 37.78977, lon: -122.39687, top: 300 },
    { name: 'Coit Tower', lat: 37.80239, lon: -122.40582, top: 62 },
    // (the tower itself, at the museum's north-east corner, from the model's own top: the museum's centre put the eye
    //  over its roof, 65 m from the tower — owner, 2026-10-06)
    { name: 'the de Young\'s Hamon Tower', lat: 37.772015, lon: -122.468316, top: 47 },
    { name: 'the Transamerica Pyramid', lat: 37.79519, lon: -122.40279, top: 230 },
    /*
     * Not a top but a dark room (owner, 2026-10-06: "push O to observe in the camera obscura"): the eye at the Giant
     * Camera's lens, turning slowly round as its mirror does, and the picture thrown onto the round table inside
     * (render/obscura.ts). Offered only close to it.
     */
    { name: 'the Camera Obscura', lat: 37.778257, lon: -122.514234, top: 6, obscura: 'Camera Obscura', reach: 45 },
  ].map((o) => ({ obscura: undefined as string | undefined, reach: 150, ...o, ...proj.toLocal({ lat: o.lat, lon: o.lon }) })) : []
  let observing: string | null = null
  const nearTop = (at: { x: number; z: number }): (typeof OBSERVE)[number] | null =>
    OBSERVE.find((o) => Math.hypot(o.x - at.x, o.z - at.z) < o.reach) ?? null
  let table: { dispose(): void } | null = null
  let turning: (() => void) | null = null
  /** off the Camera Obscura's table, by whatever way the view ended (O, ⏸, the map) */
  const leaveTable = (): void => {
    table?.dispose(); table = null
    if (turning) { scene.onBeforeRenderObservable.removeCallback(turning); turning = null }
  }
  const comeDown = (): void => {
    observing = null
    leaveTable()
    frozen = false
    orbit.active = false
    debug.frozen(false)
    lookPad?.show(false)
  }
  const goUp = (o: (typeof OBSERVE)[number]): void => {
    held = null
    frozen = true
    orbit.active = true
    const l = orbit.look
    l.x = o.x
    l.z = o.z
    l.yaw = Math.atan2(-Math.sin(camHeading), -Math.cos(camHeading))
    l.pitch = 0.12
    l.dist = 3
    // the eye just over the MODEL's own top where one is placed there (the guessed heights put it inside Coit Tower)
    let topY = city.terrain.heightAt(o.x, o.z) + o.top
    for (const p of landmarks?.placed ?? []) {
      if (o.obscura) {
        // the lens: just over the camera's own roof, wherever the model stands (not over the Cliff House beside it)
        if (p.name === o.obscura && p.y !== undefined && p.height !== undefined) { l.x = p.x; l.z = p.z; topY = p.y + p.height + 0.6 }
        continue
      }
      if (Math.hypot(p.x - o.x, p.z - o.z) < 40 && p.y !== undefined && p.height !== undefined) topY = Math.max(topY, p.y + p.height + 2)
    }
    orbit.lift = topY - city.terrain.heightAt(o.x, o.z) - 1.5
    observing = o.name
    debug.frozen(true)
    lookPad?.show(true)
    if (o.obscura) {
      // looking out a little down over the sea, the mirror turning once in three minutes
      l.pitch = -0.22
      l.dist = 0.5
      orbit.lift = topY - city.terrain.heightAt(l.x, l.z)
      table = obscuraView(camera)
      let last = performance.now()
      turning = () => { const now = performance.now(); l.yaw += ((now - last) / 1000) * (Math.PI * 2 / 180); last = now }
      scene.onBeforeRenderObservable.add(turning)
      hud.banner('Inside the Camera Obscura', touchScreen() ? 'the lens turns slowly · drag to look · ⏸ to come out' : 'the lens turns slowly · drag to look · O to come out', 4500)
      return
    }
    hud.banner(`The top of ${o.name}`, touchScreen() ? 'drag to look round · ⏸ to come down' : 'drag to look round · O to come down', 4500)
  }
  addEventListener('keydown', (e) => {
    if (e.code !== 'KeyO' || e.ctrlKey || e.metaKey || (e.target instanceof HTMLElement && e.target.closest('input, textarea, select'))) return
    if (observing && frozen) { comeDown(); return }
    const o = !frozen ? nearTop(lastAt) : null
    if (o) goUp(o)
  })
  /** once a frame, from the ride loop: the pill by a tall landmark */
  const observeTick = (at: { x: number; z: number }): void => {
    // (unpaused some other way — ⏸ on a phone, a jump on the map: the table and its turning go too)
    if (observing && !frozen) { observing = null; leaveTable() }
    const o = frozen ? null : nearTop(at)
    const what = o?.obscura ? `look in ${o.name}` : `observe from the top of ${o?.name}`
    hud.observe(o ? (touchScreen() ? `🔭 ${what[0].toUpperCase()}${what.slice(1)}` : `🔭 Press O to ${what}`) : null, o ? () => goUp(o) : undefined)
  }
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
  // speed, felt (ui/speedlines.ts): the view opens and streaks rush past the edges on a fast descent
  const speedLines = off.has('speedlines') || opts.freeze ? null : new SpeedLines()

  /*
   * Photo mode (src/render/photo.ts): P toggles fog off for clean aerial screenshots, [ and ] pull the draw
   * distance in and push it out. `?fog=off&far=6000` does the same from the URL for an unattended run.
   */
  photoMode(scene, camera, (s) => hud.banner(s))
  // Chrome's ~3 GB ceiling is fatal and silent (BUGS.md #121): say so while there is still a tab to say it in
  watchHeap((m) => hud.banner('memory', m))
  if (new URLSearchParams(location.search).get('mem') === '1') showMemory(scene, opts.tier ?? 'desktop')
  /*
   * THE MEMORY GOVERNOR (phones: src/tier.ts `memoryBudget`; owner, 2026-10-01: a Safari tab is killed at ~1 GB "with
   * no available instrumentation"). Every five seconds the footprint is ESTIMATED — the JS heap from a measured
   * model (a base plus a cost per tile held), the GPU from Babylon's own record of every buffer and texture — and
   * the massing ring pulled in by one when it is over budget (the tiles beyond it are dropped by the next
   * `wantTiles`), or grown back by one when the bigger ring would still fit with 5% to spare. `?budget=` sets the
   * MB; `window.__governor()` says what it decided.
   */
  const memBudget = Number(new URLSearchParams(location.search).get('budget')) || tier.memoryBudget
  if (memBudget) {
    const last = { estimate: 0, mid: MID, changes: 0 }
    ;(window as unknown as Record<string, unknown>).__governor = () => ({ ...last, memBudget, held: tileLevel.size })
    setInterval(() => {
      const g = gpuMB(scene)
      const estimate = Math.round(tier.heapBase + HEAP_PER_TILE_MB * tileLevel.size + g.buffers + g.textures)
      last.estimate = estimate
      const grow = (8 * MID + 24) * (HEAP_PER_TILE_MB + GPU_PER_TILE_MB)
      if (estimate > memBudget && MID > tier.minMid) {
        setRings(VIEW, MID - 1)
        last.changes++
        console.info(`[memory] ~${estimate} MB of ${memBudget}: massing ring in to ${MID}`)
      } else if (estimate + grow < memBudget * 0.95 && MID < (rings?.[1] ?? tier.mid)) {
        setRings(VIEW, MID + 1)
        last.changes++
        console.info(`[memory] ~${estimate} MB of ${memBudget}: massing ring out to ${MID}`)
      }
      last.mid = MID
    }, 5000)
  }

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
  // brighter, more saturated, and anti-aliased: after the AO, the last passes (render/grade.ts)
  if (!off.has('grade')) {
    const g = new URLSearchParams(location.search).get('grade')?.split(',').map(Number)
    colourGrade(scene, camera, g && g.length === 3 && g.every((v) => v > 0) ? { exposure: g[0], saturation: g[1], contrast: g[2] } : off.has('ao') ? GRADE_NO_AO : GRADE)
  }

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
    /*
     * Nothing to draw into: a hidden or collapsed pane leaves the canvas a pixel or so tall, render targets scaled
     * from it round to zero, and WebGL logs "Framebuffer is incomplete: Attachment has zero size" every frame (the
     * owner saw it, 2026-09-29). Skip the frame, and move the clock on so the first real one is not a huge step.
     */
    if (engine.getRenderWidth() < 4 || engine.getRenderHeight() < 4) { last = performance.now(); return }
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
      /*
       * THE GONDOLA (docs/SALESFORCE-PARK.md): its way joins the park to the streets, but nobody rides a bike up a 24°
       * track. A rider who reaches it waits at the station (held, below) and is put aboard the cabin when it is there;
       * aboard, they are put off when it stands at the OTHER station — onto the park's loop at the top, onto the
       * street at the foot — and never back onto its way (`placeOnGraph`).
       */
      const atGondola = !transit.aboard && nav.edge.name === GONDOLA_NAME
      if (atGondola) {
        // …the cabin at THIS station: the two stand ~30 m apart on the ground, inside the boarding reach, and a rider
        // at the top was put into the cabin waiting at the foot, 13 m below (probed 2026-10-02)
        const cabin = transit.boardable
        if (cabin?.kind === 'gondola' && cabin.dwelling && Math.abs(cabin.y - lastY) < 5 && transit.board(nav.position)) {
          const v = transit.aboard!
          gondolaFrom = { x: v.x, z: v.z }
          destination = null; tour = null; clearRoute()
          hud.banner('Aboard the gondola', lastY - city.terrain.heightAt(lastAt.x, lastAt.z) > 8 ? 'down to Salesforce Plaza' : 'up to Salesforce Park')
        } else if (frames % 120 === 0) hud.note('waiting for the gondola')
      }
      /*
       * THE LIFTS (src/city/sf/bridges.ts `SALESFORCE_LIFTS`): a few seconds standing in the car, then out at the
       * other end — the deck, or the concourse at street level.
       */
      if (!transit.aboard && nav.edge.name === LIFT_NAME && liftUsed !== nav.position.edgeId) {
        if (liftTime === 0) hud.note(lastY - city.terrain.heightAt(lastAt.x, lastAt.z) > 8 ? 'the lift down…' : 'the lift up to the park…')
        liftTime += dt
        if (liftTime >= LIFT_SECONDS) {
          const pos = nav.position
          const len = nav.edge.length
          liftUsed = pos.edgeId
          liftTime = 0
          // off onto the way beyond, not the lift's own end: the lift edge climbs 18 m in 3, and a rider left on it
          // never rolls the last few centimetres off (probed 2026-10-02)
          const far = pos.reversed ? nav.edge.a : nav.edge.b
          const next = rides.nodes.get(far)?.edges.map((id) => rides.edges.get(id)).find((e) => e && e.id !== pos.edgeId && e.name !== LIFT_NAME)
          if (next) {
            const out = next.a === far
            backOnStreet({ edgeId: next.id, s: out ? Math.min(0.5, next.length / 2) : Math.max(next.length / 2, next.length - 0.5), reversed: !out })
          } else backOnStreet({ edgeId: pos.edgeId, s: pos.reversed ? 0.05 : len - 0.05, reversed: pos.reversed })
          hud.banner(lastY - city.terrain.heightAt(lastAt.x, lastAt.z) > 8 ? 'Street level' : 'Salesforce Park', '')
        }
      } else if (nav.edge.name !== LIFT_NAME) { liftUsed = -1; liftTime = 0 }
      const onCabin = transit.aboard?.kind === 'gondola' ? transit.aboard : null
      if (onCabin && gondolaFrom && onCabin.dwelling && Math.hypot(onCabin.x - gondolaFrom.x, onCabin.z - gondolaFrom.z) > 25) {
        const r = transit.alight(placeOnGraph)
        if (r.status === 'ok') { backOnStreet(r.pos); hud.banner(onCabin.y - city.terrain.heightAt(onCabin.x, onCabin.z) > 8 ? 'Salesforce Park' : 'Salesforce Plaza', touchScreen() ? 'the transit line takes you off any transit; here it is automatic' : 'B gets you off any transit; here it is automatic') }
        gondolaFrom = null
      }
      const prompt = transit.prompt()
      // (on a touch screen the line is the button: it says so instead of naming a key)
      if (prompt) hud.transit(touchScreen() ? prompt.replace(/^B · board/, 'Tap · board').replace(/ · (B|Esc) to get off$/, ' · tap to get off') : prompt)
      else hud.transit(null)

      // Always drained, even aboard the transit: `steering()` empties a queue, and presses kept while the
      // rider was on a cable car would all fire the frame they stepped off — including a U-turn.
      const steers = controls.steering()
      /*
       * FAST INPUT (src/sim/navigate.ts): what is held steers, every frame, and a fresh press is a tap. The arrows'
       * queued presses are the slow model's and are not used — only U-turn and S (back to the middle) are.
       */
      if (nav.fast) {
        const axis = frozen || transit.aboard ? 0 : controls.steerAxis?.() ?? 0
        if (axis !== 0 && axis !== lastAxis) nav.tap(axis)
        nav.hold(axis)
        lastAxis = axis
        // the rider's own hand at the junction ahead wins over the GPS's exit
        if (axis !== 0) ownChoiceAt = nav.next()?.nodeId ?? ownChoiceAt
      }
      for (const t of transit.aboard ? [] : steers) {
        if (t === 'back') { nav.turnAround(); continue }
        if (nav.fast) { if (t === 'straight') nav.nudge(0); continue }
        /*
         * Item H: a press with the next junction more than six seconds away is a NUDGE across the
         * carriageway (straight comes back to the middle); inside six seconds it is a turn request, as
         * always. The HUD says which it was, so the rider is never unsure what a press did.
         */
        const ahead = nav.next()
        const far = !ahead || ahead.passThrough || ahead.ahead / Math.max(2, lastState?.speed ?? 0) > 6
        // straight on (↑, S, the d-pad's up) CANCELS a signalled turn wherever the rider is — before, far from
        // the junction it only re-centred them, and a turn once asked for could not be taken back
        if (t === 'straight' && !nav.isCommitted && nav.requested !== 'straight') {
          nav.request('straight')
          ownChoiceAt = ahead?.nodeId ?? null
          hud.note('↑ straight on')
          continue
        }
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
        // (a delivery's own stop is the delivery's to announce: it says "picked up" and routes on)
        if (route && route.length < 20 && !deliveryRouted) {
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
        // (the route's exit even where the junction's offer folded it into a neighbour: `Navigator` takes it by edge)
        const exit = want === undefined ? undefined
          : junction.exits.find((x) => x.edgeId === want) ?? exits(rides, junction.nodeId, nav.edge.id).find((x) => x.edgeId === want)
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
      /*
       * HANDS OFF (owner, 2026-10-03: in trainer mode "the user never has to touch the controls at all (they may not
       * have any controls)"). The welcome card holds the ride until a key or a click — which a rider on a trainer with
       * no keyboard can never give, and the trainer soak stood still behind it for six minutes. With slow input (the
       * trainer modes) it goes on its own: after two seconds of pedalling, or twenty seconds up.
       */
      if (welcomeOpen() && !nav.fast) {
        welcomeFor += dt
        welcomePedal = (controls.measured().power ?? 0) > 30 ? welcomePedal + dt : 0
        if (welcomePedal > 2 || welcomeFor > 20) closeWelcome()
      }
      // …and while the rider is picking themselves up after a collision (render/rider.ts `tumble`)
      const hold = frozen || controls.paused() || riding || !!rider?.tumbling || stillInWay(lastRider, now) || welcomeOpen()
        // (waiting at the gondola's station: the cabin is boarded, the track is not ridden; and in a lift)
        || (!riding && nav.edge.name === GONDOLA_NAME)
        || (!riding && nav.edge.name === LIFT_NAME && liftUsed !== nav.position.edgeId)
      if (hold) holdWhy = frozen ? 'frozen' : controls.paused() ? 'paused' : riding ? 'riding' : rider?.tumbling ? 'tumbling'
        : welcomeOpen() ? 'welcome' : nav.edge.name === GONDOLA_NAME ? 'gondola' : nav.edge.name === LIFT_NAME ? 'lift' : 'in the way'
      else holdWhy = ''
      // the watts the rider gets: what was measured (or typed), less what an empty energy bar will not pay for
      const measured = controls.measured()
      const given = energy && measured.power !== null ? { ...measured, power: energy.allowed(measured.power) } : measured
      // aboard a streetcar or cable car the legs rest: the bar refills as fast as it can (owner, 2026-10-01)
      if (energy && riding) energy.spend(0, dt)
      else if (energy && !hold) energy.spend(Math.max(0, given.power ?? 0), dt)
      if (energyBar && energy) {
        energyBar.fill.style.width = `${Math.round(energy.level * 100)}%`
        energyBar.el.classList.toggle('low', energy.level < 0.25)
        energyBar.el.classList.toggle('bonk', energy.bonked)
      }
      const state = hold && lastState ? { ...lastState, speed: 0, power: riding ? 0 : lastState.power, grade: riding ? 0 : lastState.grade }
        : ride.step(dt, given, opts.device, surface, ground.grade, radius, junction?.ahead ?? Infinity,
          // held behind the car ahead in the rider's lane (none on a descent: the traffic makes way instead) —
          // judged along the strip the rider is WEAVING to, and slowed to swing out in time when that is far across
          (lastLead = lastRider && !hold ? heldBy(lastRider) : null))
      lastState = state
      // held still behind traffic for a while: say how to get out (owner, 2026-09-29: stuck face to face with a car
      // on a narrow street) — a U-turn works from a standstill
      // (after 8 s: behind a STANDING car the squeeze-past comes at 5 s, so the hint only shows for a real standoff)
      const againstCar = performance.now() / 1000 - solidAt < 0.5
      /*
       * NEVER DEADLOCKED (owner, 2026-10-02: "sometimes i get in situations that seem to deadlock still … The only thing
       * I can do is u-turn"). The per-vehicle valve (traffic `leaderFor`) restarts its clock whenever the vehicle holding
       * the rider changes — a truck face on, a car beside, each in turn — so it never ran out. This clock is the rider's:
       * stalled for STALL_LIMIT seconds asking to go (pedalling, or reversing), the standing vehicles round them let them
       * through, at a creep (below).
       */
      const asking = (controls.measured().power ?? 0) > 10 || (controls.measured().power ?? 0) < 0
      // (stalled = not a metre further along, forward or back. SIDEWAYS does not count: standing, the navigator's
      // sidestep edges the rider across the lane looking for a way round, and when that drift reset this clock the
      // valve never opened — the hands-off soak stood 9.6 s face to face with a car in the box, 2026-10-03)
      const along = lastRider && stallFrom
        ? Math.abs((lastRider.at.x - stallFrom.x) * Math.sin(lastRider.heading) + (lastRider.at.z - stallFrom.z) * Math.cos(lastRider.heading))
        : Infinity
      if (hold || !lastRider || !asking || !stallFrom || along > 1) {
        stalled = 0
        stallFrom = lastRider ? { ...lastRider.at } : null
      } else stalled += dt
      if (stalled > STALL_LIMIT && lastRider) {
        if (traffic.squeezeAround(lastRider) > 0) hud.note('squeezing through…')
        stalled = 0
      }
      heldStill = !hold && state.speed < 0.3 && (controls.measured().power ?? 0) > 10 && lastRider && (againstCar || traffic.leaderFor(lastRider, weaveShift ?? 0, true)) ? heldStill + dt : 0
      // (face to face with a car against it, there is no waiting it out: say so at once)
      const hintAt = againstCar ? 3 : 8
      if (heldStill > hintAt && heldStill - dt <= hintAt) hud.note(energy ? 'stuck? ↓ below 0 W backs up · U turns you round' : 'stuck? U turns you round')
      /*
       * CARS ARE SOLID (owner, 2026-10-02: "i still can go right through cars if i approach from the front (or often,
       * side), when not at an intersection"). A moving car the rider meets is a crash (traffic.update); one standing or
       * crawling is not, and nothing else stopped the rider riding into it — head on, drifting sideways, downhill. So a
       * step along a street that would put the rider INSIDE such a car is undone, and they stop against it.
       */
      const before = !opts.freeze && !hold && lastRider && !off.has('solid') ? nav.snapshot() : null
      let crossed: number[] = []
      if (!opts.freeze && !hold) { crossed = nav.advance(state.speed * dt, state.speed); simSeconds += dt }
      if (!opts.freeze && !hold && state.reverse) nav.backUp(state.reverse * dt)
      // stopped (held behind a car, or against one): edge sideways round it, slowly (Navigator.sidestep)
      if (!opts.freeze && !hold && lastRider && state.speed < 0.3) nav.sidestep(dt)
      // inside a vehicle the rider was let through: very slowly (the last resort above)
      if (lastRider && traffic.creeping(lastRider.box)) ride.cap(1.5)
      if (before && lastRider && crossed.length === 0) {
        const riderBox = (): ReturnType<typeof boxOf> => {
          const p = nav.smoothed()
          return boxOf(p.point.x, p.point.z, p.heading, opts.device === 'treadmill' ? SIZE.runner : SIZE.bike)
        }
        const blocked = (): ReturnType<typeof traffic.solidAt> | 'cyclist' | null => {
          const b = riderBox()
          return traffic.solidAt(lastRider!, b) ?? (cyclistInside(b, lastRider!.box) ? 'cyclist' : null)
        }
        const wall = blocked()
        // into a car: keep the move ACROSS the street and undo only the one along it — the rider slides round it
        if (wall) {
          const moved = nav.snapshot()
          nav.restore({ ...before, offset: moved.offset, offsetTarget: moved.offsetTarget, shown: moved.shown })
          if (blocked()) nav.restore(before)
        }
        if (wall) {
          ride.halt()
          solidAt = performance.now() / 1000
          lastState = { ...state, speed: 0, reverse: 0 }
          // (for the probes: what stopped the rider, and how often)
          const w = ((window as unknown as Record<string, unknown>).__solid ??= { n: 0 }) as Record<string, unknown>
          w.n = (w.n as number) + 1
          w.last = wall === 'cyclist' ? { kind: 'cyclist' } : { kind: wall.transit ?? wall.kind, speed: +wall.speed.toFixed(1), why: wall.why, rel: +Math.cos(wall.heading - nav.heading()).toFixed(2), inBox: !!wall.inBox }
        }
      }
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
      /*
       * …and never UNDER the drawn ground (owner, 2026-10-02, Crossover Drive by Fulton: "here, the rider actually goes
       * underground"). The bake grades a street smooth through a rise, and the ground is only ever levelled UP to the
       * streets, so the road is drawn on the ground there — 0.4 m over the profile, measured. Ground within 1.5 m of
       * the street wins; a tunnel's cut, a bored tunnel and a bridge deck are further off and keep their profile.
       */
      {
        const g = city.terrain.heightAt(at.x, at.z)
        if (!riding && g > groundY && g - groundY < 1.5) groundY = g
      }
      // …and on a park's trail, on the park's own ground, where the trail and its walkers are drawn (#539): the profile is
      // the streets' levelled ground, up to 1.5 m off it over a hill in Golden Gate Park
      if (!riding && nav.edge.foot && nav.edge.kind !== 'steps' && !nav.edge.raised && parkMap.contains(at.x, at.z, TILE)) {
        const raw = city.terrain.rawHeightAt(at.x, at.z)
        if (Math.abs(raw - groundY) < 3) groundY = raw
      }
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
      // at a station? (not aboard anything)
      if (travel && !transit.aboard) {
        let here: (typeof stations)[number] | null = null
        // (a ferry terminal is a big building out over the water; the street in front of it is 100 m off its centre)
        for (const st of stations) if (Math.hypot(st.x - at.x, st.z - at.z) < (st.line === 'ferry' ? 140 : 70)) { here = st; break }
        travel.at(here, here ? destinations(here, stations) : [], here ? fareFrom(here) : 0)
      }
      // and the tiles to build them from, round wherever is being looked at, a few times a second
      if (now - lastWant > 250) {
        lastWant = now
        const f = frozen ? (held ? held.to : orbit.look) : at
        void wantTiles(f.x, f.z)
        // (the headstones are built when the city's focus comes near the cemetery — the rider, or a held view)
        cemetery?.update(f, performance.now())
      }

      // Everything alive. The traffic and the crowd are told which streets are near so they populate what
      // the rider can see and retire what they cannot, which is what bounds the cost.
      const near: Edge[] = []
      for (const id of city.edgesNear(at.x, at.z)) {
        const e = graph.edges.get(id)
        if (e) near.push(e)
      }
      if (!off.has('life')) {
        // the rider, placed on their STREET (the traffic's graph, not the navigator's ride graph)
        const mapId = nav.mapEdgeId()
        const street = graph.edges.get(mapId)
        const onIt = street ? onEdge(street, at, heading) : null
        const riderNow: RiderNow | null = street && onIt ? {
          at, heading, speed: lastState?.speed ?? 0, edgeId: mapId, s: onIt.s, dir: onIt.dir, grade: nav.elevation().grade, y: nav.elevation().y,
          box: boxOf(at.x, at.z, heading, opts.device === 'treadmill' ? SIZE.runner : SIZE.bike),
        } : null
        lastRider = riderNow
        if (riderNow && !frozen) {
          const room = nav.room
          // the cars BESIDE the rider (`alongside`): the weave may only choose a strip reachable without going through
          // one — it chose one on the far side of a car standing beside the rider, the fence would not let them across,
          // and the rider sat in the junction for the rest of the ride (measured, 2026-10-01)
          const side = off.has('fence') ? { left: -Infinity, right: Infinity } : traffic.alongside(riderNow)
          const reach = { left: Math.max(room.left, side.left), right: Math.min(room.right, side.right) }
          // aiming for the rider's own line — the right-hand side (Navigator `preferShift`) — round whatever stands
          // (last frame's choice, where it is now: the weave holds it rather than dither between two — `weave`)
          weaveShift = traffic.weave(riderNow, reach.left, reach.right, nav.preferShift, weaveAt === null || off.has('weavehold') ? null : weaveAt - nav.nudged)
          // steering by hand (fast input): the rider goes where they steer, and is held judged from there
          if (nav.fast && lastAxis !== 0) weaveShift = 0
          weaveAt = weaveShift === null || Math.abs(weaveShift) < 0.05 ? null : nav.nudged + weaveShift
          nav.weaveTo(weaveAt)
          // and never across into the side of a car beside them, however they steer
          if (off.has('fence')) nav.fence(null, null)
          else nav.fence(Number.isFinite(side.left) ? nav.nudged + side.left : null, Number.isFinite(side.right) ? nav.nudged + side.right : null)
        }
        // the streetcars and cable cars where Life last drew them (render/life.ts `transitBodies`): obstacles to the
        // traffic and the rider; and none of them stops for a rider who is aboard one
        traffic.setTransit(off.has('tramobstacles') ? [] : life.transitBodies)
        life.riderAboard = transit.aboard !== null
        const hits = traffic.update(dt, riderNow ?? at, near)
        // the delivery game: its clock runs with the ride (not while frozen or paused), and it watches the rider
        if (!hold) onDelivery(delivery.update(dt, at))
        // very late with the order on board (past the one-star mark): offer the pass, for a few seconds every minute
        const veryLate = !hold && delivery.phase === 'toDropoff' && delivery.job && (delivery.elapsed ?? 0) > Delivery.expected(delivery.job, 6.5 * play.speedup) * 1.7
        // the pass, as a button too: a phone has no E (owner, 2026-10-03)
        hud.action(veryLate ? `${delivery.job?.item?.emoji ?? '🍽'} Eat the ${delivery.job?.item?.name ?? 'order'}` : null, () => onDelivery(delivery.eat()))
        observeTick(at)
        if (veryLate && delivery.job) {
          eatHint -= dt
          if (eatHint <= 0) { hud.banner(`${delivery.job.item?.emoji ?? '🍽'} Running very late…`, `${touchScreen() ? 'tap 🍽 below' : 'press E'} to eat the ${delivery.job.item?.name ?? 'order'} — full energy, no pay`, 5000); eatHint = 60 }
        }
        deliveryCard.navigate(delivery.target, { x: at.x, z: at.z, heading }, delivery.elapsed)
        // the two stops on the maps, no route between them
        const job = delivery.phase === 'toPickup' || delivery.phase === 'toDropoff' ? delivery.job : null
        // only the stop to ride to NOW has colour (owner: "show the beacon to where you have to go next"); the pickup,
        // once made, is gone, and the drop-off waits as a small grey 2 until then
        if (minimap) minimap.jobPins = !job ? [] : delivery.phase === 'toPickup'
          ? [{ at: job.pickup, n: 1, next: true }, { at: job.dropoff, n: 2 }]
          : [{ at: job.dropoff, n: 2, next: true }]
        deliveryCard.colour(delivery.phase === 'toDropoff' ? 'dropoff' : 'pickup')
        beacon.update(dt)
        ;(window as unknown as Record<string, unknown>).__traffic = { traffic, rider: riderNow, state: lastState, hold, speedNow: ride.speed }
        lightClock = trafficLevel === 'none' ? lightClock + dt : traffic.time
        lamps?.update(now, city.heads.values(), (node, edge) => signals.aspect(node, edge, lightClock))
        /*
         * A COLLISION, in a junction (owner, 2026-09-29): not animated. The bike stops dead, the car stops too
         * (sim/traffic.ts), a message says so, and both carry on. In the game proper it costs points.
         */
        // (not while aboard a streetcar or cable car: a car running into it is the tram's collision, not the rider's —
        // owner, 2026-10-01)
        if (hits.length > 0 && now >= graceUntil && transit.aboard === null) {
          graceUntil = now + 4000
          collisions += 1
          ride.halt()
          // topple away from the car: onto the side it is not on
          const hv = hits[0].vehicle
          hitBy = hv
          hitUntil = now + 12000
          const side = Math.sin(heading) * (hv.at.z - at.z) - Math.cos(heading) * (hv.at.x - at.x) > 0 ? 1 : -1
          rider?.tumble(side)
          const lines = ['Oops!', 'Whoa there!', 'Bonk!', 'Oof!']
          hud.banner(lines[collisions % lines.length], `bumped a ${hv.transit ?? hv.kind}${hits[0].nodeId >= 0 ? ' in the junction' : ''} · ${collisions} this ride`, 2600)
          sfx.bump()
          onDelivery(delivery.collided())
          ;(window as unknown as Record<string, unknown>).__collisions = collisions
          // what happened, for tuning (read by the shot tools): who was going where, under which light
          const log = ((window as unknown as Record<string, unknown>).__collisionLog ??= []) as unknown[]
          for (const h of hits) {
            const v = h.vehicle
            log.push({
              kind: v.kind, turn: v.inBox?.turn, vFrom: v.inBox?.from, vEdge: v.edgeId, vSpeed: +v.speed.toFixed(1),
              riderEdge: riderNow?.edgeId, riderSpeed: +(riderNow?.speed ?? 0).toFixed(1),
              sameArm: v.inBox?.from === riderNow?.edgeId,
              vLight: v.inBox ? signals.aspect(h.nodeId, v.inBox.from, traffic.time) : null,
              riderLight: riderNow && h.nodeId >= 0 ? signals.aspect(h.nodeId, riderNow.edgeId, traffic.time) : null,
              kindAt: h.nodeId >= 0 ? signals.control(h.nodeId).kind : 'street',
              at: [Math.round(h.at.x), Math.round(h.at.z)], vehicleEdge: v.edgeId, riderAt: [Math.round(at.x), Math.round(at.z)],
            })
          }
        }
        crowd.update(dt, at, near)
        /*
         * …and a PEDESTRIAN (owner, 2026-09-29: "colliding with an NPC is somewhat rare, since they don't cross the
         * street much, but it can happen"): the same tumble and a word of apology. Only riding at some speed — a
         * walker brushing a standing bike is no crash — and the walker simply walks on.
         */
        if (riderNow && !hold && ride.speed > 2 && now >= graceUntil && transit.aboard === null) {
          for (const w of crowd.all) {
            // not the crowd's cyclists: they share the road the rider's way, and catching one up from behind was two
            // crashes in 100 s (measured) — a nuisance, not a hazard
            if (w.kind === 'cycle' || Math.abs(w.at.x - at.x) > 2.5 || Math.abs(w.at.z - at.z) > 2.5) continue
            // (a walker on another level — the street over a tunnel — is not in the way)
            if (Math.abs((w.y ?? nearLevel(city.terrain.heightAt(w.at.x, w.at.z), w.level)) - nav.elevation().y) > 3.5) continue
            if (!overlap(riderNow.box, boxOf(w.at.x, w.at.z, w.heading, SIZE.runner))) continue
            graceUntil = now + 4000
            collisions += 1
            ride.halt()
            rider?.tumble(Math.sin(heading) * (w.at.z - at.z) - Math.cos(heading) * (w.at.x - at.x) > 0 ? 1 : -1)
            const lines = ['Sorry!', 'Watch it!', 'Excuse me!']
            hud.banner(lines[collisions % lines.length], `clipped a ${w.kind === 'run' ? 'runner' : 'pedestrian'} · ${collisions} this ride`, 2600)
            sfx.bump()
            onDelivery(delivery.collided())
            ;(window as unknown as Record<string, unknown>).__collisions = collisions
            ;(((window as unknown as Record<string, unknown>).__collisionLog ??= []) as unknown[]).push({ kind: w.kind, riderSpeed: +riderNow.speed.toFixed(1), riderEdge: riderNow.edgeId, walkerEdge: w.edgeId })
            break
          }
        }
        // nothing inside a tunnel is drawn while the camera is outside it: it would show through the hill
        // (and the players on the sports courts near the rider: sim/players.ts)
        const walkers = [...crowd.all.filter((w) => !tunnels.hides(w.edgeId)), ...courtPlayers.update(dt, at, city.courtsNear(at.x, at.z, 160))]
        strangers?.update(dt, walkers, at, city.terrain)
        const focus = frozen ? (held ? held.to : orbit.look) : at
        life.update(dt, traffic.all.filter((v) => !tunnels.hides(v.edgeId)), walkers, at, strangers?.drawn, city.terrain, focus)
        river?.update(dt, focus)
        for (const b of bay) b.update(dt, focus)
      }
      sky?.update(dt, at)
      beachCrowd?.update(dt)
      // the raised decks (docs/SKYPARKS.md), drained before both layers update: a deck arrives when its
      // landmark's tile streams in, so a one-time hookup at startup would miss every one of them. Trees and
      // shrubs read the same `landmarks.decks` entries.
      if (landmarks && decksPlanted < landmarks.decks.length) {
        for (; decksPlanted < landmarks.decks.length; decksPlanted++) {
          const d = landmarks.decks[decksPlanted]
          // (a bed — a deck whose trees stand close to its edge — is planted edge to edge: render/plants.ts `bedPlanting`)
          if (d.shrubs !== false) plants.addDeck(d.ring, d.y, d.keepOff !== undefined)
          if (d.trees !== false) trees.addDeck(d.ring, d.y, d.keepOff, d.spacing)
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
      // (and in a street tunnel, under its vault: the Broadway Tunnel's bores are 4.6 m high, and a camera 3.5 m up
      // cut the vault with its near plane — render/tunnels.ts `headroom`)
      const vault = high ? null : city.passageAt(at.x - fx * camBack, at.z - fz * camBack) ?? city.passageAt(at.x, at.z)
        ?? tunnels.headroom(at.x - fx * camBack, at.z - fz * camBack, camBack) ?? tunnels.headroom(at.x, at.z, 0)
      const lift = high ? 34 : riding ? 6.5 : vault === null ? 3.5 : Math.max(1.9, Math.min(3.5, vault - 1.0))
      camHeight += (lift + groundY - camHeight) * Math.min(1, dt * (vault === null ? 4 : 8))
      // (only on the ground, the rider's own speed: not aboard, not from above)
      const felt = high || riding || speedLines === null ? 0 : (lastState?.speed ?? 0)
      camera.fov += (fovFor(felt) - camera.fov) * Math.min(1, dt * 2)
      speedLines?.update(dt, felt)
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
      tunnels.update(camera.position)
      updateEye(scene, camera.position)
      updateCartoonEye(scene, camera.position)
      updateWater(scene, now / 1000, camera.position)
      rain?.update(dt, camera.position)

      // The bike points where it is GOING and leans and steers by how fast that turns (bikePose, below)
      const pose = bikePose(dt, at, heading, onBoard ? 0 : state.speed)
      rider?.update(dt, at, pose.heading, state.speed, state.crank, pose.lean, state.working, groundY, pose.steer)
      ;(window as unknown as Record<string, unknown>).__pose = { ...pose, navLean: sm.lean, speed: state.speed }
      life.riderShadow(at, pose.heading, groundY)

      opts.platform?.frame()
      minimap.draw(at, heading, junction && !junction.passThrough ? rides.nodes.get(junction.nodeId)?.at ?? null : null)

      // a running count of what is actually on screen, which is the only way to tell an empty street from a
      // broken instance buffer
      frames++
      if (label && frames % 30 === 0 && !document.documentElement.classList.contains('sr-compact')) {
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
      if (!opts.freeze) welcomeScreen(src.index?.name ?? opts.city, !nav.fast)
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
  // (debug: the street grade and the raw ground under a point, for the wall and island probes)
  // (debug: the city object itself, for tile and edge inspection from the console)
  ;(window as unknown as { __city?: unknown }).__city = city
  ;(window as unknown as { __groundProbe?: unknown }).__groundProbe = (x: number, z: number) => ({ grade: city.gradeAt(x, z), raw: city.terrain.rawHeightAt(x, z), drape: city.terrain.heightAt(x, z) })
  // the elevation data alone, without the streets' levelling (what a patch lowering a street would have under it)
  ;(window as unknown as { __rawHeightAt?: unknown }).__rawHeightAt = (x: number, z: number) => city.terrain.rawHeightAt(x, z)
  /* how much fine ground is resident, against how many tiles are held: the per-tile terrain's heap report */
  // one point's ground every way it is known: the fine block's step, the elevation, the coarse grid alone (what the
  // depth occluder and the distant ground are built from), and what is drawn (streets levelled) — BUGS.md #240
  let coarseOnly: Terrain | null = null
  ;(window as unknown as Record<string, unknown>).__terrainAt = (x: number, z: number) => {
    coarseOnly ??= new Terrain(city.terrain.coarse)
    return { step: city.terrain.stepIn(tileKey(Math.floor(x / TILE), Math.floor(z / TILE))), raw: city.terrain.rawHeightAt(x, z),
      coarse: coarseOnly.rawHeightAt(x, z), drawn: city.terrain.heightAt(x, z) }
  }
  // the rider's sideways offset, metres right of the line (probes: how often the weave changes its mind)
  ;(window as unknown as Record<string, unknown>).__navOffset = () => nav.nudged
  // the streetcars' and cable cars' boxes this frame (probes: what runs into them)
  ;(window as unknown as Record<string, unknown>).__transitBodies = () => life.transitBodies
  ;(window as unknown as Record<string, unknown>).__terrainStats = () => ({
    blocks: city.terrain.blockCount, tilesHeld: tileLevel.size, coarse: !!city.terrain.coarse,
  })
  // the ride's own clock: seconds the ride model was actually stepped, metres covered, and the speed now
  // (tools/route-movie.ts — the time-lapse keys its frames and its captions off these seconds)
  ;(window as unknown as Record<string, unknown>).__clock = () => ({
    seconds: simSeconds, travelled: nav.travelled, speed: lastState?.speed ?? 0,
  })
  ;(window as unknown as { __ride?: unknown }).__ride = () => ({
    hold: holdWhy, speed: lastState?.speed ?? 0, lead: lastLead, stalled,
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
    // off whatever was carrying the rider first: a jump made aboard the gondola or a streetcar left the rider on the
    // vehicle, which then held them where it was for good — the "freeze" on a shift-click on the map (2026-10-02)
    if (transit.aboard) transit.abandon(() => null)
    // and any delivery under way is forfeit, else a jump to the door would complete it
    const forfeit = delivery.forfeit()
    onDelivery(forfeit)
    gondolaFrom = null
    liftUsed = -1
    liftTime = 0
    nav.placeAt(where)
    destination = null
    tour = null
    clearRoute()
    const at = nav.at()
    city.update(at.x, at.z)
    trees.update(new Vector3(at.x, 0, at.z))
    hud.banner(forfeit.length ? 'Jumped — delivery forfeit' : 'Jumped', `${lat.toFixed(5)}, ${lon.toFixed(5)} · ${placeName(at)}`)
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
  // the ride graph, for probes (tools/: which ways are rideable where, and at what heights)
  w.__rides = rides
  w.__landmarks = landmarks
  w.__boats = () => [...(river?.positions() ?? []), ...bay.flatMap((b) => b.positions())]
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
      // the PHYSICAL speed (the server integrates the session's distance from it): the speedup is the game's
      speed: () => (lastState?.speed ?? 0) / ride.speedup,
      travelled: () => nav.travelled,
      // Babylon's own screenshot, not the canvas: a raw toDataURL comes back blank under WebGPU (INTEGRATION.md §8)
      screenshot: () => Tools.CreateScreenshotAsync(engine, camera, { width: 640, height: 360 }, 'image/jpeg', 0.82).catch(() => null),
    })
  }
}

/**
 * Each city's OPENING VIEW (`game` above): a point on a street and the way to face (radians, 0 north, clockwise).
 * San Francisco: the top of California Street on Nob Hill, by Grace Cathedral, facing east — the cable-car tracks
 * falling away down the hill to the Financial District's towers and the Bay Bridge.
 */
const SHOWCASE_START: Record<string, { lat: number; lon: number; heading: number }> = {
  'san-francisco': { lat: 37.79195, lon: -122.41250, heading: Math.PI / 2 },
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
