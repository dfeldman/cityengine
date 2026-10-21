/**
 * One photograph of one building, found from its position rather than its name.
 *
 * This is the thing the refacing ladder stands on: no photograph, no reface (docs/sf-batches/BRIEF-REFACE.md).
 * Commons alone is not enough — "dozens of these buildings have no picture, or a poor picture, on Commons"
 * (user, 2026-09-22) — because Commons holds what somebody thought worth photographing, and the anonymous
 * 1970s apartment tower nobody loves is exactly the building we need to see.
 *
 * Three sources, tried in order, first usable hit wins:
 *
 *   1. MAPILLARY — street-level imagery, continuous along every street, and the only source with real coverage
 *      of ordinary buildings. Needs a free token in MAPILLARY_TOKEN (mapillary.com → Developers → register an
 *      application). Crucially each image carries `compass_angle`, so we can ask for the ones actually POINTING
 *      at the building instead of driving past it; a facade photographed from across the street is worth more
 *      than a Commons skyline shot with the building somewhere in it.
 *   2. Commons GEOSEARCH — no key, no name needed, but it returns whatever is geotagged nearby, which is often
 *      a street scene, a restaurant meal or somebody's dog. Always look before trusting it.
 *   3. Commons NAME SEARCH — only when OSM carries a name, and only as a last resort: many notable buildings
 *      have no name in OSM at all, so a pipeline that depends on names misses precisely the interesting ones.
 *
 *   node --experimental-strip-types tools/photo.ts 37.7986 -122.4131 [--name="…"] [--radius=60] [--out=/tmp/x.jpg]
 *
 * Prints the candidates it found, best first, and downloads the first one when --out is given.
 */
import { writeFileSync, readFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

const UA = 'streetrunner-ref/0.1 (reference lookup for a city-building generator; low volume, serial)'

/*
 * Wikimedia's API answers a burst with "You are making too many requests" and nothing else — and a silently
 * empty result looks exactly like a building nobody has photographed. A first batch scored 10 of 20 that way,
 * with the misses being well-photographed landmarks. So: one request at a time, a pause between them, and a
 * real error when one fails.
 */
let queue: Promise<unknown> = Promise.resolve()
const GAP = Number(process.env.WIKI_GAP ?? 900)
async function api(url: string): Promise<unknown | null> {
  const run = async (): Promise<unknown | null> => {
    for (let try_ = 0; try_ < 4; try_++) {
      const r = await fetch(url, { headers: { 'User-Agent': UA } })
      const text = await r.text()
      if (r.ok && text.startsWith('{')) {
        await new Promise((ok) => setTimeout(ok, GAP))
        return JSON.parse(text) as unknown
      }
      if (r.status !== 429 && r.ok) { console.error(`  commons: unexpected reply (${text.slice(0, 60)})`); return null }
      // backing off: 2 s, 6 s, 18 s
      const wait = 2000 * 3 ** try_
      console.error(`  commons: rate limited, waiting ${wait / 1000} s`)
      await new Promise((ok) => setTimeout(ok, wait))
    }
    console.error('  commons: still rate limited after four tries')
    return null
  }
  const mine = queue.then(run, run)
  queue = mine.catch(() => undefined)
  return mine
}

export interface Photo {
  source: 'mapillary' | 'commons-geo' | 'commons-name'
  /** what to fetch the image bytes from */
  url: string
  /** a human reference to record in the manifest entry and the queue log */
  ref: string
  /** metres from the building, where the source says */
  distance?: number
  /** how far the camera was from pointing at the building, degrees — Mapillary only */
  off?: number
  /** the ranking, lower is better: off-angle, distance from an ideal ~28 m, and a penalty for a 360 frame */
  score?: number
  /** a 360 frame only: degrees from the middle of the equirectangular strip round to the building */
  yaw?: number
  /** how tall the building is, where we know — it decides how much sky the crop has to keep */
  height?: number
  /** a FLAT frame: degrees from the middle of the picture to the building, signed (right is positive) */
  dev?: number
  /** the Mapillary frame id, so an image can be cached and cited by it */
  id?: string
  /** where the camera stood */
  camLat?: number
  camLon?: number
  /** the camera's altitude in metres, where Mapillary computed one — the eye height the projection needs */
  camAlt?: number
  /** the camera's TRUE heading (computed_compass_angle), degrees — absolute, unlike `yaw` which is relative */
  heading?: number
  /** the bearing from the camera to the point we aimed at, degrees */
  want?: number
  /*
   * The pose the flat image was rendered with, filled in by fetchPhoto. Everything a footprint projection
   * needs is here: camera position and altitude above, and the virtual camera's yaw/pitch/fov/size below.
   */
  pitch?: number
  fov?: number
  outW?: number
  outH?: number
  /** the fraction of the building's HEIGHT that clears whatever stands between it and the camera, 0..1 */
  vis?: number
  /** the fraction of the building's silhouette the chosen cut actually holds, 0..1 */
  framed?: number
  /** how much of the frame the building fills, 0..1 — too small is a speck, too large is a wall */
  fill?: number
  /** did the camera position come from Mapillary's SfM correction, or only from the vector tile? */
  fixed?: boolean
}

/** A neighbouring building, as a footprint and a height: what can stand between a camera and the target. */
export interface Blocker { ring: [number, number][]; height: number }

/*
 * Mapillary is somebody else's service and we are going over thousands of buildings, so: every reply is kept on
 * disk and a query is only ever asked once, requests go out one at a time with a gap between them, and a 429 or
 * a 5xx backs off rather than retrying hard (user, 2026-09-22: "PLEASE - cache any output from mapillary, and
 * throttle downloads. i don't want to get rate limited or blocked"). The cache key leaves the token out, so a
 * new token still hits the same cache.
 */
const CACHE = resolve(import.meta.dirname, 'cache', 'mapillary')
let mlyQueue: Promise<unknown> = Promise.resolve()
const MLY_GAP = Number(process.env.MAPILLARY_GAP ?? 350)

async function mapillaryApi(url: string): Promise<unknown | null> {
  const auth = { 'User-Agent': UA, Authorization: `OAuth ${mapillaryToken()}` }
  mkdirSync(CACHE, { recursive: true })
  const key = createHash('sha1').update(url).digest('hex')
  const file = resolve(CACHE, `${key}.json`)
  if (existsSync(file)) {
    try { return JSON.parse(readFileSync(file, 'utf8')) as unknown } catch { /* refetch a half-written file */ }
  }
  const run = async (): Promise<unknown | null> => {
    for (let n = 0; n < 4; n++) {
      const r = await fetch(url, { headers: auth })
      const text = await r.text()
      if (r.ok && text.startsWith('{')) {
        writeFileSync(file, text)
        await new Promise((ok) => setTimeout(ok, MLY_GAP))
        return JSON.parse(text) as unknown
      }
      if (r.status !== 429 && r.status < 500) {
        console.error(`  mapillary ${r.status}: ${text.slice(0, 200)}`)
        return null                                // a bad token or a bad query: retrying cannot help
      }
      const wait = 3000 * 3 ** n                   // 3 s, 9 s, 27 s, 81 s
      console.error(`  mapillary ${r.status}, waiting ${wait / 1000} s`)
      await new Promise((ok) => setTimeout(ok, wait))
    }
    return null
  }
  const mine = mlyQueue.then(run, run)
  mlyQueue = mine.catch(() => undefined)
  return mine
}

/*
 * The token, from the environment or from a file the user keeps themselves. The file means the token never has
 * to be pasted into a conversation or committed: put it in .env as MAPILLARY_TOKEN (gitignored) and every tool here
 * picks it up.
 */
export const mapillaryToken = (): string => {
  // MAPILLARY_TOKEN, from the environment or the project's .env (the standard since 2026-10-19; names in .env.example)
  if (!process.env.MAPILLARY_TOKEN) {
    const f = resolve(import.meta.dirname, '..', '.env')
    if (existsSync(f)) process.loadEnvFile(f)
  }
  return process.env.MAPILLARY_TOKEN ?? ''
}

const metres = (a: [number, number], b: [number, number]): number =>
  Math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 111320 * Math.cos((a[0] * Math.PI) / 180))

/**
 * Street-level images near a point whose camera was looking at it.
 *
 * `off` — the angle between where the camera pointed and where the building was — is the whole value of this
 * source: a car drives down a street taking a picture every few metres, and only some of them face the
 * building. Under about 50° the facade is in shot; over that it is at the edge or behind.
 */
/*
 * Mapillary's `images?bbox=` endpoint is unusable in a real city: San Francisco's streets hold so many frames
 * that it answers "please reduce the amount of data" for a box only twenty metres across, and `limit` does not
 * help because the cap is on what it scans, not what it returns. The documented way to search an area is the
 * VECTOR TILES, and they suit us better anyway — one z14 tile is about 2.4 km of city and ~150k frames, so a
 * single ten-megabyte download, cached once, serves every building in a district.
 */
const Z = 14
const tileOf = (lat: number, lon: number): [number, number] => [
  Math.floor(((lon + 180) / 360) * 2 ** Z),
  Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** Z),
]
const tileLonLat = (x: number, y: number, px: number, py: number, extent: number): [number, number] => {
  const n = 2 ** Z
  const lon = ((x + px / extent) / n) * 360 - 180
  const t = Math.PI * (1 - (2 * (y + py / extent)) / n)
  return [(Math.atan(Math.sinh(t)) * 180) / Math.PI, lon]
}

interface Frame { id: string; lat: number; lon: number; angle?: number; pano: boolean; quality: number }

/** One tile's image points, fetched at most once ever and kept on disk. */
async function tileFrames(tx: number, ty: number): Promise<Frame[]> {
  mkdirSync(CACHE, { recursive: true })
  const file = resolve(CACHE, `${Z}-${tx}-${ty}.mvt`)
  if (!existsSync(file)) {
    const token = mapillaryToken()
    if (!token) return []
    const url = `https://tiles.mapillary.com/maps/vtp/mly1_public/2/${Z}/${tx}/${ty}?access_token=${token}`
    const run = async (): Promise<Buffer | null> => {
      for (let n = 0; n < 4; n++) {
        const r = await fetch(url, { headers: { 'User-Agent': UA } })
        if (r.ok) {
          const buf = Buffer.from(await r.arrayBuffer())
          await new Promise((ok) => setTimeout(ok, MLY_GAP))
          return buf
        }
        if (r.status !== 429 && r.status < 500) { console.error(`  mapillary tile ${r.status}`); return null }
        const wait = 3000 * 3 ** n
        console.error(`  mapillary tile ${r.status}, waiting ${wait / 1000} s`)
        await new Promise((ok) => setTimeout(ok, wait))
      }
      return null
    }
    const mine = mlyQueue.then(run, run) as Promise<Buffer | null>
    mlyQueue = mine.catch(() => undefined)
    const buf = await mine
    if (!buf) return []
    writeFileSync(file, buf)
  }
  const { VectorTile } = await import('@mapbox/vector-tile')
  const { PbfReader } = await import('pbf')
  const layer = new VectorTile(new PbfReader(readFileSync(file))).layers.image
  if (!layer) return []
  const out: Frame[] = []
  for (let i = 0; i < layer.length; i++) {
    const f = layer.feature(i)
    const g = f.loadGeometry()[0]?.[0]
    if (!g) continue
    const p = f.properties as { id?: string | number; compass_angle?: number; is_pano?: boolean; quality_score?: number }
    const [la, lo] = tileLonLat(tx, ty, g.x, g.y, layer.extent)
    out.push({ id: String(p.id ?? ''), lat: la, lon: lo, angle: p.compass_angle, pano: p.is_pano === true, quality: p.quality_score ?? 0.5 })
  }
  return out
}

/**
 * The thumbnail and the TRUE heading for one frame, asked for only once the frame has been chosen.
 *
 * The vector tile carries `compass_angle` — the phone's magnetometer, which among steel buildings can be tens
 * of degrees out — and that is not good enough to cut a 360 frame down to one facade. `computed_compass_angle`
 * is Mapillary's own estimate, reconstructed from the imagery, and only the per-image endpoint has it. It is a
 * tiny reply and it is cached, so it costs little.
 */
/*
 * 2048, not 1024. An equirectangular frame spreads a whole turn across its width, so a 1024-wide pano is
 * 2.8 pixels per degree — an 85-degree cut is about 240 source pixels stretched up to a 768-wide picture, and
 * that softness on its own makes frames unreadable. 2048 doubles it. `thumb_original_url` would be better
 * still (often 5760 wide) but runs to several megabytes a frame, and at a dozen frames a building that is a
 * download budget we have been asked not to spend.
 */
/*
 * `computed_geometry`, not the vector tile's point. The tile carries the RAW GPS, and in a street of steel
 * towers it drifts fifteen metres and more: Fugazi Bank's top-ranked frame was recorded at 23 m from the
 * building and is a wall from about five. `computed_geometry` is Mapillary's SfM-corrected position — the
 * match to the `computed_compass_angle` we already take — and every distance, bearing and projection here
 * stands on it. It is GeoJSON, so its coordinates are [lon, lat], in that order.
 */
async function frameInfo(id: string): Promise<{ thumb: string; angle?: number; alt?: number; lat?: number; lon?: number; fixed?: boolean }> {
  const body = await mapillaryApi(`https://graph.mapillary.com/${id}?fields=thumb_2048_url,thumb_1024_url,computed_compass_angle,computed_altitude,altitude,computed_geometry,geometry`) as
    { thumb_2048_url?: string; thumb_1024_url?: string; computed_compass_angle?: number; computed_altitude?: number; altitude?: number
      computed_geometry?: { coordinates?: [number, number] }; geometry?: { coordinates?: [number, number] } } | null
  const c = body?.computed_geometry?.coordinates
  const g = c ?? body?.geometry?.coordinates
  return {
    thumb: body?.thumb_2048_url ?? body?.thumb_1024_url ?? '',
    angle: body?.computed_compass_angle,
    alt: body?.computed_altitude ?? body?.altitude,
    lat: g?.[1], lon: g?.[0], fixed: c !== undefined,
  }
}

/**
 * Street-level frames that were looking AT this point.
 *
 * `compass_angle` is the phone's magnetometer, which in a street of steel buildings can be tens of degrees
 * out — one reason the top-ranked picture so often faces the wrong way. A 360 frame has no direction at all:
 * the building is in it wherever it stands, so panos are never rejected for heading, only ranked below a flat
 * photo that faces the facade. And a frame nine metres away shows one bay of brickwork, so the ranking wants
 * roughly the width of a street between camera and building.
 */
/**
 * Is anything standing between the camera and the wall we want to photograph?
 *
 * Aiming correctly is not enough: a ninety-metre tower can be completely hidden by the five-storey loft in
 * front of it, and the picture comes back showing the loft. We know where every building in the city is, so
 * this walks the line from the camera to the target wall and asks whether it crosses any other footprint.
 * `blockers` is every other building nearby, as rings.
 */
/*
 * IN 3D, NOT IN PLAN. The old test asked "does the line from the camera to the wall cross another footprint",
 * and answered yes for almost every good photograph of a tall building: a 121 m tower behind a 30 m neighbour
 * is VISIBLE — its top two thirds are — and in plan it is completely blocked. The question worth asking is how
 * much of the HEIGHT clears, which is ordinary similar triangles: a blocker `hb` tall at `d` metres hides
 * everything on the target below `eye + (hb - eye) * D / d`. A frame that sees the top 80% is excellent; one
 * that sees the bottom 20% is the wall-from-five-metres case.
 */
type P2 = [number, number]

/** How high up the target the sightline from `eye` first clears everything in the way. Metres, local frame. */
const clearsAbove = (cam: P2, eye: number, to: P2, blockers: { ring: P2[]; height: number }[]): number => {
  const D = Math.hypot(to[0] - cam[0], to[1] - cam[1])
  if (D < 1e-6) return 0
  const cross = (ax: number, ay: number, bx: number, by: number): number => ax * by - ay * bx
  let hid = 0
  for (const bl of blockers) {
    if (bl.height <= eye) continue                     // lower than the camera: it cannot hide anything above it
    let near = Infinity
    const r = bl.ring
    for (let i = 0; i < r.length; i++) {
      const a = r[i]
      const b = r[(i + 1) % r.length]
      const d1 = cross(to[0] - cam[0], to[1] - cam[1], a[0] - cam[0], a[1] - cam[1])
      const d2 = cross(to[0] - cam[0], to[1] - cam[1], b[0] - cam[0], b[1] - cam[1])
      const d3 = cross(b[0] - a[0], b[1] - a[1], cam[0] - a[0], cam[1] - a[1])
      const d4 = cross(b[0] - a[0], b[1] - a[1], to[0] - a[0], to[1] - a[1])
      if ((d1 > 0) === (d2 > 0) || (d3 > 0) === (d4 > 0)) continue
      const t = d3 / (d3 - d4)                         // where along camera→target the edge is crossed
      const d = t * D
      if (d > 1.5 && d < D - 1.5 && d < near) near = d
    }
    if (near === Infinity) continue
    hid = Math.max(hid, eye + (bl.height - eye) * (D / near))
  }
  return hid
}

/**
 * Where a world point lands in a hypothetical cut of the panorama — the exact inverse of `rectilinear`.
 *
 * This is what makes the whole search possible: a 360 frame can be cut ANY way, so the question is never "is
 * this frame good" but "is there a cut of this panorama that frames the building well", and that is arithmetic
 * over metadata, answerable before a single image is downloaded. A point BEHIND the camera (z <= 0 once the
 * rotations are undone) must be clipped rather than drawn — getting that sign wrong is how a church once came
 * back as the car park opposite.
 */
const project = (lonDeg: number, latDeg: number, yaw: number, pitch: number, f: number, aspect: number):
  { i: number; j: number } | null => {
  const R = Math.PI / 180
  const cl = Math.cos(latDeg * R)
  const v: [number, number, number] = [cl * Math.sin(lonDeg * R), Math.sin(latDeg * R), cl * Math.cos(lonDeg * R)]
  const cz = Math.cos(yaw * R)
  const sz = Math.sin(yaw * R)
  const x = v[0] * cz - v[2] * sz                      // undo the yaw rotation
  const zy = v[0] * sz + v[2] * cz
  const cy = Math.cos(-pitch * R)
  const sy = Math.sin(-pitch * R)
  const y = v[1] * cy + zy * sy                        // undo the pitch rotation
  const z = -v[1] * sy + zy * cy
  if (z <= 1e-6) return null                           // behind the camera
  return { i: ((x / z) / f + 1) / 2, j: ((-y / z) / (f * aspect) + 1) / 2 }   // both in 0..1 of the frame
}

export async function mapillary(lat: number, lon: number, radius = 60, height = 0, ring: [number, number][] = [],
                                blockers: Blocker[] = []): Promise<Photo[]> {
  if (!mapillaryToken()) return []
  const d = radius / 111320
  const dl = d / Math.cos((lat * Math.PI) / 180)
  const tiles = new Set<string>()
  for (const [a, b] of [[lat - d, lon - dl], [lat - d, lon + dl], [lat + d, lon - dl], [lat + d, lon + dl]]) tiles.add(tileOf(a, b).join(','))
  const frames: Frame[] = []
  for (const t of tiles) {
    const [tx, ty] = t.split(',').map(Number)
    for (const f of await tileFrames(tx, ty)) frames.push(f)
  }

  /*
   * One local metre frame for everything that follows — x east, y north, z up, origin at the building. Degrees
   * are hopeless for this: a sightline, a silhouette and an eye height have to be in the same units before any
   * of the arithmetic below means anything.
   */
  const mLat = 111320
  const mLon = 111320 * Math.cos((lat * Math.PI) / 180)
  const toM = (p: [number, number]): P2 => [(p[1] - lon) * mLon, (p[0] - lat) * mLat]
  const ringM = ring.length >= 3 ? ring.map(toM)
    // no footprint (photo.ts run by hand on a bare lat/lon): stand in a nominal 16 m box so the simulation still runs
    : ([[-8, -8], [8, -8], [8, 8], [-8, 8]] as P2[])
  const blockM = blockers.map((b) => ({ ring: b.ring.map(toM), height: b.height }))
  const H = height > 0 ? height : 12
  const EYE = 2.5                                      // a car roof: `computed_altitude` is above the ELLIPSOID, not the pavement
  const PANO_W = 2048                                  // what `frameInfo` asks for — it bounds how sharp a narrow cut can be

  /*
   * A camera can be INSIDE a building — under an arcade, in a porte-cochere, beneath a podium soffit — and that
   * is invisible to any sightline test, because nothing crosses the line: the obstruction is directly overhead.
   * One Maritime Plaza's own colonnade produced exactly this, a frame whose upper half is a concrete ceiling
   * with the tower glimpsed underneath it. The footprints say where those places are, so ask.
   */
  const indoors = (c: P2): boolean => blockM.some((b) => {
    let hit = false
    const r = b.ring
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if ((r[i][1] > c[1]) !== (r[j][1] > c[1]) &&
          c[0] < ((r[j][0] - r[i][0]) * (c[1] - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) hit = !hit
    }
    return hit
  })

  /** The nearest point on the footprint's boundary, and how squarely the camera faces that wall. */
  const nearM = (c: P2): { at: P2; facing: number; wall: [P2, P2] } | null => {
    if (ringM.length < 2) return null
    let best: { at: P2; facing: number; wall: [P2, P2] } | null = null
    let bd = Infinity
    for (let i = 0; i < ringM.length; i++) {
      const a = ringM[i]
      const b = ringM[(i + 1) % ringM.length]
      const bx = b[0] - a[0]
      const by = b[1] - a[1]
      const t = Math.max(0, Math.min(1, ((c[0] - a[0]) * bx + (c[1] - a[1]) * by) / (bx * bx + by * by || 1e-12)))
      const at: P2 = [a[0] + bx * t, a[1] + by * t]
      const dd = (at[0] - c[0]) ** 2 + (at[1] - c[1]) ** 2
      if (dd >= bd) continue
      bd = dd
      const len = Math.hypot(bx, by) || 1e-9
      const dl2 = Math.sqrt(dd) || 1e-9
      best = { at, facing: Math.abs(((c[0] - at[0]) / dl2) * (by / len) + ((c[1] - at[1]) / dl2) * (-bx / len)), wall: [a, b] }
    }
    return best
  }

  /**
   * THE SIMULATION. Given where a camera stood and which way it looked, work out the best cut of its panorama
   * for this building, and how good that cut is — silhouette inside the frame, filling a sensible share of it,
   * centred, and with as much of the height as possible clear of whatever stands in front.
   */
  const simulate = (cam: P2, heading: number): {
    score: number; yaw: number; pitch: number; hfov: number; aspect: number
    vis: number; framed: number; fill: number; dist: number; want: number
  } | null => {
    const near = nearM(cam)
    if (!near) return null
    const dist = Math.hypot(near.at[0] - cam[0], near.at[1] - cam[1])
    const want = (Math.atan2(near.at[0] - cam[0], near.at[1] - cam[1]) * 180) / Math.PI
    /*
     * THREE RAYS, not one. A single sightline to the nearest point is fragile: a neighbour can clip it at an
     * oblique angle while four fifths of the facade is in plain view. The aim point and a quarter of the wall
     * either side of it average that out.
     */
    const w = near.wall
    const wl = Math.hypot(w[1][0] - w[0][0], w[1][1] - w[0][1]) || 1
    const ux = (w[1][0] - w[0][0]) / wl
    const uy = (w[1][1] - w[0][1]) / wl
    const step = Math.min(wl * 0.25, 15)
    let hid = 0
    for (const s of [-step, 0, step]) {
      hid += clearsAbove(cam, EYE, [near.at[0] + ux * s, near.at[1] + uy * s], blockM) / 3
    }
    const vis = Math.max(0, Math.min(1, (H - hid) / H))

    /*
     * The silhouette's angular extent, from the footprint's corners at ground and at roof level. The BOTTOM of
     * the cut starts at whatever is hidden rather than at the pavement — which is exactly the owner's point
     * about looking up over a podium: if the lower thirty metres are behind a neighbour there is no reason to
     * spend frame on them.
     */
    let loMin = Infinity
    let loMax = -Infinity
    let laMin = Infinity
    let laMax = -Infinity
    for (const v of ringM) {
      const dx = v[0] - cam[0]
      const dy = v[1] - cam[1]
      const b = (Math.atan2(dx, dy) * 180) / Math.PI
      const rel = ((b - want + 540) % 360) - 180       // unwrapped about the aim, so a wide building does not wrap
      loMin = Math.min(loMin, rel)
      loMax = Math.max(loMax, rel)
      const flat = Math.max(1, Math.hypot(dx, dy))
      laMin = Math.min(laMin, (Math.atan2(Math.max(0, hid) - EYE, flat) * 180) / Math.PI)
      laMax = Math.max(laMax, (Math.atan2(H - EYE, flat) * 180) / Math.PI)
    }
    if (!Number.isFinite(loMin) || !Number.isFinite(laMax)) return null
    const spanW = Math.max(1, loMax - loMin)
    const spanH = Math.max(1, laMax - laMin)

    /*
     * Choose the LENS, do not accept one. The cut is aimed at the middle of the silhouette and opened just wide
     * enough to hold it with room to spare — which is what a static-imagery service does and what the old fixed
     * 85-degree, fixed-tilt cut could never do. Beyond about 100 degrees a perspective view stretches
     * unusably at its edges, so that is the real ceiling; below 45 the 2048-wide panorama has too few pixels in
     * the cut to survive being blown up.
     */
    const FILL = 0.62                                   // the share of the frame the silhouette should occupy
    const vfov = Math.max(40, Math.min(100, spanH / FILL))
    /*
     * The frame may be tall, but not a letterbox on end. A narrow cut under a very tall one — 45 degrees across
     * and 100 up — is a 1:3 picture in which the perspective leans hard at the top and bottom, and it reads as
     * a building falling over. Widening the lens to keep the sides within about 1.9:1 costs a little size in
     * frame and buys a photograph somebody can look at.
     */
    const hfov = Math.max(45, vfov / 1.9, Math.min(100, spanW / FILL))
    const yaw = ((loMin + loMax) / 2 + want - heading + 540) % 360 - 180
    const pitch = Math.max(-20, Math.min(60, (laMin + laMax) / 2))
    const aspect = Math.tan((vfov * Math.PI) / 360) / Math.tan((hfov * Math.PI) / 360)
    const f = Math.tan((hfov * Math.PI) / 360)

    /*
     * Now MEASURE the cut we just chose, rather than trusting it. Projecting the corners is the same arithmetic
     * the silhouette overlay will use, and it is the only thing that can say "the tower is clipped off the top
     * of this frame" — the failure that put four podium shots at the head of One Maritime Plaza's list.
     */
    let inside = 0
    let total = 0
    let iMin = Infinity
    let iMax = -Infinity
    let jMin = Infinity
    let jMax = -Infinity
    for (const v of ringM) {
      const dx = v[0] - cam[0]
      const dy = v[1] - cam[1]
      const b = (Math.atan2(dx, dy) * 180) / Math.PI
      const rel = ((b - heading + 540) % 360) - 180
      const flat = Math.max(1, Math.hypot(dx, dy))
      for (const z of [Math.max(0, hid), H]) {
        const e = (Math.atan2(z - EYE, flat) * 180) / Math.PI
        const q = project(rel, e, yaw, pitch, f, aspect)
        total++
        if (!q) continue
        if (q.i >= 0 && q.i <= 1 && q.j >= 0 && q.j <= 1) inside++
        iMin = Math.min(iMin, q.i); iMax = Math.max(iMax, q.i)
        jMin = Math.min(jMin, q.j); jMax = Math.max(jMax, q.j)
      }
    }
    if (total === 0 || !Number.isFinite(iMin)) return null
    const framed = inside / total
    const fill = Math.max(0, Math.min(1, iMax - iMin)) * Math.max(0, Math.min(1, jMax - jMin))
    const centre = Math.hypot((iMin + iMax) / 2 - 0.5, (jMin + jMax) / 2 - 0.5)

    /*
     * The ranking. Visibility first, because a picture of the building in front of the one we want is worthless
     * however well it is composed; then whether the cut holds the whole silhouette; then how big it is in
     * frame. Distance barely appears, and that is the point: being far away is rarely the problem and being
     * close almost always is. A 150 m frame that sees the whole tower must beat a 70 m one that sees a third of
     * it, and here it does by roughly seventy points.
     */
    const px = (PANO_W * spanW) / 360                  // source pixels across the building, before any blow-up
    const score =
      (1 - vis) * 110                                  // hidden behind a neighbour
      + (1 - framed) * 55                              // clipped by the edge of the frame
      + (fill < 0.10 ? (0.10 - fill) * 220 : 0)        // a speck in the middle of a street
      + (fill > 0.80 ? (fill - 0.80) * 160 : 0)        // a wall: too close to read anything
      + Math.max(0, 150 - px) * 0.22                   // too few panorama pixels to blow up
      + centre * 30
      + (1 - near.facing) * 16                         // edge-on: ranked down, never thrown away
      + (indoors(cam) ? 45 : 0)                        // shot from under somebody's arcade, looking at its ceiling
      + Math.max(0, dist - radius) * 0.5
    return { score, yaw, pitch, hfov, aspect, vis, framed, fill, dist, want: (want + 360) % 360 }
  }

  /*
   * PASS ONE, on the vector tile's own coordinates: cheap, no requests, and only there to cut thousands of
   * frames down to a shortlist worth asking about. The tile's GPS drifts badly in a canyon, so nothing is
   * REJECTED here on a threshold that correction could move — the near rule waits for pass two.
   */
  const coarse: { f: Frame; s: number }[] = []
  for (const f of frames) {
    if (!f.pano) continue                              // a flat frame cannot be re-aimed; only a 360 can be cut
    const cam = toM([f.lat, f.lon])
    const dd = Math.hypot(cam[0], cam[1])
    if (dd > radius + 40) continue
    const sim = simulate(cam, f.angle ?? 0)
    if (!sim) continue
    if (sim.dist < Math.max(4, height * 0.25)) continue
    coarse.push({ f, s: sim.score + (1 - f.quality) * 12 })
  }
  coarse.sort((a, b) => a.s - b.s)
  const SPREAD = Number(process.env.PHOTO_SPREAD ?? 12)
  const SHORT = Number(process.env.PHOTO_SHORTLIST ?? 36)
  /*
   * Spread BEFORE the shortlist, not after. The best-scoring frames are consecutive shots from one car metres
   * apart, so an unspread shortlist is thirty-six photographs of the same tree; and since every one of them
   * costs a metadata request, spreading afterwards would spend the whole budget on one kerb.
   */
  const short: Frame[] = []
  for (const c of coarse) {
    if (short.length >= SHORT) break
    const cm = toM([c.f.lat, c.f.lon])
    if (short.every((k) => Math.hypot(...toM([k.lat, k.lon]).map((v, i) => v - cm[i]) as [number, number]) > 15)) short.push(c.f)
  }

  /*
   * PASS TWO. Now, and only now, we ask Mapillary about each shortlisted frame — which buys the SfM-corrected
   * position and heading, and those move a camera far enough to change every answer above. So the simulation is
   * run again on the corrected pose, and the hard near rejection is applied HERE: Fugazi's frame recorded at
   * 23 m and actually five metres from the wall has to die after correction, not before it.
   */
  const scored: (Photo & { id: string; want: number; lat: number; lon: number })[] = []
  for (const f of short) {
    const info = await frameInfo(f.id)
    if (!info.thumb || info.angle === undefined) continue      // without a corrected heading a pano cannot be cut
    const la = info.lat ?? f.lat
    const lo = info.lon ?? f.lon
    const cam = toM([la, lo])
    const sim = simulate(cam, info.angle)
    if (!sim) continue
    // the one hard rejection worth keeping: a photograph from ten metres genuinely cannot contain a tall building
    if (sim.dist < Math.max(8, height * 0.5)) continue
    /*
     * A frame Mapillary has NOT reconstructed keeps its raw GPS, and across this city's cached metadata the
     * correction moves a camera by up to 65 m — which is the difference between the building opposite and the
     * one we asked for. Every simulation above is only as good as the position it stands on, so an uncorrected
     * frame is ranked below a corrected one rather than trusted equally.
     */
    const score = sim.score + (1 - f.quality) * 12 + (info.fixed ? 0 : 10)
    scored.push({
      source: 'mapillary', url: info.thumb, ref: `mapillary:${f.id} (360)`, id: f.id,
      distance: Math.round(sim.dist), off: 0, score: Math.round(score), want: sim.want,
      lat: la, lon: lo, camLat: la, camLon: lo, camAlt: info.alt, heading: info.angle, fixed: info.fixed,
      yaw: sim.yaw, pitch: sim.pitch, fov: sim.hfov, height,
      vis: Math.round(sim.vis * 100) / 100, framed: Math.round(sim.framed * 100) / 100,
      fill: Math.round(sim.fill * 100) / 100,
      outW: 1024, outH: Math.round(1024 * sim.aspect),
    })
  }
  scored.sort((a, b) => a.score! - b.score!)
  if (scored.length === 0) return []

  /*
   * TWO TIERS, not one cut. A pair chosen on score alone once came back as two different elevations and read as
   * two different buildings, so the same-side frames come FIRST and a reader who looks at only two or three
   * sees them. But a hard cut also threw away the other face of a corner building, so the far-side frames are
   * kept after them rather than dropped.
   */
  const anchor = scored[0]
  const turnedFrom = (c: typeof scored[number]): number => Math.abs(((c.want - anchor.want + 540) % 360) - 180)
  const apart: typeof scored = []
  const room = (c: typeof scored[number]): boolean =>
    apart.every((k) => metres([k.lat, k.lon], [c.lat, c.lon]) > 15)
  for (const c of scored) {
    if (apart.length >= Math.ceil(SPREAD * 0.6)) break
    if (turnedFrom(c) <= 50 && room(c)) apart.push(c)
  }
  for (const c of scored) {
    if (apart.length >= SPREAD) break
    if (turnedFrom(c) > 50 && room(c)) apart.push(c)
  }
  /*
   * The tiers decide which SIDE of the building a reader sees first; they must not put a frame the simulation
   * knows is junk above one it knows is good. A frame with nothing of the building visible, or a quarter of the
   * silhouette in shot, goes to the back of the queue whichever elevation it came from — kept, because some
   * junk among the good ones is the agreed bargain, but never in the first three, which is what a modeller
   * actually reads.
   */
  const good = (p: Photo): boolean => (p.vis ?? 1) >= 0.35 && (p.framed ?? 1) >= 0.6
  return [...apart.filter(good), ...apart.filter((p) => !good(p))].map((p) => ({ ...p }))
}

/** Files geotagged near a point. No key and no name — but no promise the photo is OF the building. */
export async function commonsGeo(lat: number, lon: number, radius = 90): Promise<Photo[]> {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gsnamespace=6&gscoord=${lat}%7C${lon}&gsradius=${radius}&gslimit=10&format=json`
  const body = await api(u) as { query?: { geosearch?: { title: string; dist: number }[] } } | null
  if (!body) return []
  return (body.query?.geosearch ?? []).map((g) => ({
    source: 'commons-geo' as const,
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(g.title.replace(/^File:/, ''))}?width=900`,
    ref: g.title, distance: Math.round(g.dist),
  }))
}

/** Files whose page matches a name. Only useful where OSM gave one. */
export async function commonsName(name: string): Promise<Photo[]> {
  if (!name) return []
  const u = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(name + ' San Francisco')}&srlimit=5&format=json`
  const body = await api(u) as { query?: { search?: { title: string }[] } } | null
  if (!body) return []
  return (body.query?.search ?? []).map((g) => ({
    source: 'commons-name' as const,
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(g.title.replace(/^File:/, ''))}?width=900`,
    ref: g.title,
  }))
}

/**
 * Fetch one candidate to a file, cutting a 360 frame down to the part that faces the building. Returns false
 * when there was nothing usable at the other end.
 */
/*
 * The panorama's BYTES, cached by frame id. Metadata and tiles were already kept on disk but the image itself
 * was fetched afresh every time — so re-running the tool over the same buildings, or changing how the flat
 * view is cut, re-downloaded every panorama. Now a frame is pulled once, ever.
 */
async function panoBytes(p: Photo): Promise<Buffer | null> {
  mkdirSync(CACHE, { recursive: true })
  const key = p.id ? `pano-${p.id}` : `pano-${createHash('sha1').update(p.url).digest('hex')}`
  const cached = resolve(CACHE, `${key}.jpg`)
  if (existsSync(cached)) {
    const buf = readFileSync(cached)
    if (buf.length >= 4000) return buf
  }
  const r = await fetch(p.url, { headers: { 'User-Agent': UA } })
  if (!r.ok) return null
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length < 4000) return null                  // an error page, not a photograph
  writeFileSync(cached, buf)
  return buf
}

export async function fetchPhoto(p: Photo, file: string): Promise<boolean> {
  const buf = await panoBytes(p)
  if (!buf) return false
  if (p.yaw === undefined) {
    // a flat frame keeps its own framing; all we add is the corridor, placed by the camera's field of view
    const sharp = (await import('sharp')).default
    const meta = await sharp(buf).metadata()
    writeFileSync(file, await mark(buf, meta.width ?? 0, meta.height ?? 0, p.dev))
    return true
  }
  /*
   * THE CUT WAS ALREADY CHOSEN, by simulation, before this panorama was downloaded — `mapillary()` tried the
   * building in many hypothetical views of this frame and kept the one that framed it best. So render exactly
   * that: re-deriving a pose here would throw away the reason this frame was picked over the two hundred
   * others.
   */
  if (p.fov !== undefined && p.pitch !== undefined && p.outW && p.outH) {
    const flat = await rectilinear(buf, p.yaw, p.pitch, p.fov, p.outW, p.outH)
    writeFileSync(file, await mark(flat, p.outW, p.outH))
    return true
  }
  /*
   * LOOK UP, AND KEEP THE SKY. The fallback, for a Photo with no simulated cut on it — `photo.ts` run by hand
   * on a bare lat/lon has no footprint, so there is no silhouette to frame and the roofline's elevation is the
   * only thing to aim by.
   *
   * This used to tilt `min(40, up * 0.55)` and then hand `mark()` a height of `view * 0.85` while
   * `rectilinear` ALSO cut its output to 0.85 — between them a tall building was guaranteed to be
   * decapitated: under-tilted, then cropped where the roof was. The owner's observation is the fix: a
   * skyscraper is perfectly visible in a 360 frame if you look up.
   *
   * So compute it rather than guessing. `up` is the elevation of the roofline; `DOWN` is how much pavement
   * to keep below the horizon so the building has a base and a sense of scale. The view is then pointed at
   * the middle of that span and made TALL ENOUGH to hold all of it, instead of a fixed 4:3.4 letterbox.
   * The near-side rejection (dist >= height/2) bounds `up` at atan(2) = 63 degrees, so the vertical field
   * never gets wide enough to stretch badly at the edges.
   */
  const up = p.height && p.distance ? (Math.atan(p.height / p.distance) * 180) / Math.PI : 20
  const DOWN = 10                                     // degrees of pavement below the horizon
  const TOP = 7                                       // a little sky above the roofline, so the roof reads as a roof
  const pitch = Math.max(0, Math.min(55, (up + TOP - DOWN) / 2))
  const vfov = Math.max(58, Math.min(105, up + TOP + DOWN))
  const hfov = 85
  const view = 1024
  // the output's aspect IS the ratio of the two fields of view; anything else is a lie about what is in frame
  const outH = Math.round((view * Math.tan((vfov * Math.PI) / 360)) / Math.tan((hfov * Math.PI) / 360))
  const flat = await rectilinear(buf, p.yaw, pitch, hfov, view, outH)
  p.pitch = pitch
  p.fov = hfov
  p.outW = view
  p.outH = outH
  writeFileSync(file, await mark(flat, view, outH))
  return true
}

/**
 * Turn a slice of a 360 panorama into an ordinary photograph.
 *
 * An equirectangular frame IS a complete sphere — every direction is in it, at a known place — so projecting
 * part of it onto a flat plane is exact, not a guess: for each output pixel we take the ray through it, rotate
 * that ray to face the building, read off its longitude and latitude, and sample the panorama there. Straight
 * lines come out straight, because that is what a perspective projection of a sphere does. This is what makes
 * the picture readable: cropping alone leaves the fisheye bowing, and a bowed facade reads as curved
 * architecture that is not there.
 *
 * `yaw` turns the view round to the building, `pitch` tilts it up so a tall building fits, and `fov` is how
 * much of the world the flat picture covers — beyond about 90 degrees a perspective view stretches horribly at
 * its edges, which is the one real limit of doing this.
 */
async function rectilinear(pano: Buffer, yaw: number, pitch: number, fov: number, out = 768, outH = Math.round(out * 0.85)): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  const { data, info } = await sharp(pano).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width
  const H = info.height
  const ch = info.channels
  const dst = Buffer.alloc(out * outH * 3)
  const f = Math.tan((fov * Math.PI) / 360)
  const cy = Math.cos((-pitch * Math.PI) / 180)
  const sy = Math.sin((-pitch * Math.PI) / 180)
  const cz = Math.cos((yaw * Math.PI) / 180)
  const sz = Math.sin((yaw * Math.PI) / 180)
  for (let j = 0; j < outH; j++) {
    for (let i = 0; i < out; i++) {
      const px = ((i + 0.5) / out * 2 - 1) * f
      const py = ((j + 0.5) / outH * 2 - 1) * f * (outH / out)
      // the ray through this pixel, then tilted up by `pitch` and turned round by `yaw`
      let x = px
      let y = -py
      let z = 1
      const y2 = y * cy - z * sy
      const z2 = y * sy + z * cy
      y = y2
      z = z2
      const x3 = x * cz + z * sz
      const z3 = -x * sz + z * cz
      x = x3
      z = z3
      const len = Math.hypot(x, y, z)
      const lon = Math.atan2(x, z)
      const lat = Math.asin(y / len)
      // the panorama's middle column faces the camera's heading, and its rows run from zenith to nadir
      let u = W * (0.5 + lon / (2 * Math.PI))
      const v = H * (0.5 - lat / Math.PI)
      if (u < 0) u += W
      if (u >= W) u -= W
      const u0 = Math.floor(u)
      const v0 = Math.max(0, Math.min(H - 1, Math.floor(v)))
      const fu = u - u0
      const fv = v - v0
      const u1 = (u0 + 1) % W
      const v1 = Math.min(H - 1, v0 + 1)
      const o = (j * out + i) * 3
      for (let c = 0; c < 3; c++) {
        const a = data[(v0 * W + u0) * ch + c] * (1 - fu) + data[(v0 * W + u1) * ch + c] * fu
        const b = data[(v1 * W + u0) * ch + c] * (1 - fu) + data[(v1 * W + u1) * ch + c] * fu
        dst[o + c] = a * (1 - fv) + b * fv
      }
    }
  }
  return sharp(dst, { raw: { width: out, height: outH, channels: 3 } }).jpeg({ quality: 85 }).toBuffer()
}

/**
 * Mark where the building is — and only what we actually know.
 *
 * The view is aimed by azimuth, and that part is solid: the building is in the middle, between two vertical
 * lines. Its HEIGHT in frame is not, because the distance is measured to the footprint's centroid while the
 * facade we see is nearer, and OSM's height is often a guess — a box drawn round the whole building floats
 * above the roofline and quietly misleads. So: a corridor, not a box.
 */
async function mark(piece: Buffer, w: number, h: number, dev?: number): Promise<Buffer> {
  if (w === 0 || h === 0) return piece
  const sharp = (await import('sharp')).default
  // a reprojected view is aimed at the building; a flat frame is not, so shift by where it falls in a ~75 deg lens
  const centre = w * (0.5 + (dev ?? 0) / 75)
  if (centre < -w * 0.2 || centre > w * 1.2) return piece
  const half = Math.round(w * 0.2)
  const x0 = Math.round(centre - half)
  const x1 = Math.round(centre + half)
  const t = Math.max(2, Math.round(w / 240))
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#ff2d2d" stroke-width="${t}" fill="none" stroke-dasharray="${t * 5} ${t * 4}">
      <line x1="${x0}" y1="0" x2="${x0}" y2="${h}"/><line x1="${x1}" y1="0" x2="${x1}" y2="${h}"/>
    </g></svg>`
  return sharp(piece).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 85 }).toBuffer()
}

/** Every candidate, best source first. */
export async function photosFor(lat: number, lon: number, name = '', radius = 60, height = 0, ring: [number, number][] = [],
                                blockers: Blocker[] = []): Promise<Photo[]> {
  /*
   * MAPILLARY ONLY. Commons was the fallback when no street-level frame could be found, and across 36
   * buildings it fired twice and returned rubbish both times: a postcard of San Jose, and the programme of a
   * 1930s exhibition of the San Francisco Society of Women Artists. Geosearch returns what is geotagged
   * nearby, name search returns what shares a word with the name, and neither is a picture of the building.
   * Handing a model a wrong photograph is worse than handing it none: with none it searches the web, which is
   * what it should do anyway for anything a street camera cannot see. `commonsGeo` and `commonsName` are kept
   * for looking something up by hand, and are deliberately not wired into a batch.
   */
  void name
  /*
   * How far to look. This is the outer bound on `dist` in the scoring too, so capping it at 90 m was the
   * other half of the tall-building problem: a 120 m tower is best seen from a block away, and frames a block
   * away were never candidates. A tall building gets a proportionally wider search; a short one is unchanged.
   */
  const far = Math.max(radius, Math.min(220, height * 1.8), height > 0 ? 70 : 0)
  /*
   * NO POSITION, NO PHOTOGRAPH. A queue row with its lat/lon left blank arrived here as 0,0 (`Number('')`),
   * and the search near Null Island came back with the same Hamburg street every time, 14,000 km off and
   * ranked first because it was the only candidate (2026-10-21: three buildings in a row). So a missing
   * position is an error, and a frame farther off than the search could ever have meant is dropped.
   */
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) throw new Error(`no position (${lat}, ${lon})`)
  return (await mapillary(lat, lon, far, height, ring, blockers)).filter((p) => p.distance === undefined || p.distance <= far * 3)
}

if (process.argv[1]?.endsWith('photo.ts')) {
  const [lat, lon] = [Number(process.argv[2]), Number(process.argv[3])]
  const arg = (k: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `=${f}`).split('=').slice(1).join('=')
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    console.error('usage: tools/photo.ts <lat> <lon> [--name="…"] [--height=30] [--radius=60] [--out=file.jpg]')
    process.exit(1)
  }
  if (!mapillaryToken()) console.error('(no Mapillary token — put MAPILLARY_TOKEN in .env; street-level imagery is skipped)')
  const list = await photosFor(lat, lon, arg('name'), Number(arg('radius', '60')), Number(arg('height', '0')))
  for (const p of list) console.log(`${p.source.padEnd(12)} ${String(p.distance ?? '').padStart(4)} m ${p.off !== undefined ? `${String(p.off).padStart(3)}° off` : '        '}  ${p.ref}`)
  /*
   * The tool writes the log row, not the agent. A refacing pass reported five buildings "confirmed" against
   * Commons files that do not exist (2026-09-22) — the references were written from memory rather than from a
   * result. Citing a photograph has to be mechanical: pass --log and --outcome, and the ref recorded is the one
   * this tool actually fetched.
   */
  const logOsm = arg('log')
  if (logOsm) {
    const outcome = arg('outcome')
    if (!['confirm', 'restyle', 'model-worthy', 'wrong-image', 'no-image'].includes(outcome)) {
      console.error('--log needs --outcome=confirm|restyle|model-worthy|wrong-image|no-image')
      process.exit(1)
    }
    const pick = outcome === 'no-image' ? undefined : list[Number(arg('pick', '0'))]   // wrong-image still cites the photo it rejected
    if (outcome !== 'no-image' && !pick) { console.error('no candidate at --pick; only no-image may cite nothing'); process.exit(1) }
    appendFileSync(resolve(import.meta.dirname, '..', 'docs', 'sf-queue-log.csv'),
      `${logOsm},${arg('stage', 'haiku')},${arg('model', 'haiku')},${outcome},"${pick?.ref ?? ''}",${new Date().toISOString().slice(0, 10)}\n`)
    console.log(`logged ${logOsm} ${outcome} ${pick?.ref ?? ''}`)
  }

  const out = arg('out')
  const chosen = list[Number(arg('pick', '0'))]
  if (out && chosen) {
    await fetchPhoto(chosen, out)
    console.log(`\n${chosen.ref} → ${out}`)
  }
}
