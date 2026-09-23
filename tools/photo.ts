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
}

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
 * to be pasted into a conversation or committed: write it to .mapillary-token in the project root (gitignored)
 * and every tool here picks it up.
 */
export const mapillaryToken = (): string => {
  if (process.env.MAPILLARY_TOKEN) return process.env.MAPILLARY_TOKEN
  // either spelling, because both are the obvious one to somebody writing the file by hand
  for (const n of ['.mapillary-token', '.mapillary_token']) {
    const f = resolve(import.meta.dirname, '..', n)
    if (existsSync(f)) return readFileSync(f, 'utf8').trim()
  }
  return ''
}

const bearing = (from: [number, number], to: [number, number]): number => {
  const dLon = ((to[1] - from[1]) * Math.PI) / 180
  const la0 = (from[0] * Math.PI) / 180
  const la1 = (to[0] * Math.PI) / 180
  const y = Math.sin(dLon) * Math.cos(la1)
  const x = Math.cos(la0) * Math.sin(la1) - Math.sin(la0) * Math.cos(la1) * Math.cos(dLon)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/**
 * The point on a footprint's BOUNDARY nearest the camera — projected onto the edges, not snapped to a corner.
 *
 * This is the wall the camera can actually see, and it is what to point at. The two obvious alternatives are
 * both wrong: a corner is the building's END, so aiming there swings the view along the facade and off it,
 * and the centroid is inside the block, so from a pavement beside a big building you aim THROUGH it at
 * whatever stands on the far side. Projecting onto the edge gives the piece of wall directly in front of the
 * camera, which is the only part of the building it can photograph.
 */
const nearestOf = (ring: [number, number][], la: number, lo: number): { at: [number, number]; facing: number } | null => {
  if (ring.length === 0) return null
  const K = 0.79                                    // longitude's share of a degree of latitude, hereabouts
  let best: { at: [number, number]; facing: number } | null = null
  let bd = Infinity
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const ax = (a[1] - lo) * K
    const az = a[0] - la
    const bx = (b[1] - a[1]) * K
    const bz = b[0] - a[0]
    const t = Math.max(0, Math.min(1, -(ax * bx + az * bz) / (bx * bx + bz * bz || 1e-18)))
    const px = ax + bx * t
    const pz = az + bz * t
    const d = px * px + pz * pz
    if (d < bd) {
      bd = d
      /*
       * How squarely the camera faces this piece of wall. A frame taken from along the street looks at the
       * facade edge-on and shows almost nothing of it — the picture is the row of buildings beyond. `facing`
       * is |cos| between the wall's normal and the line to the camera: 1 is straight on, 0 is edge-on.
       */
      const len = Math.hypot(bx, bz) || 1e-9
      const nxw = bz / len
      const nzw = -bx / len
      const dl = Math.hypot(px, pz) || 1e-9
      best = { at: [a[0] + bz * t, a[1] + (b[1] - a[1]) * t], facing: Math.abs((-px / dl) * nxw + (-pz / dl) * nzw) }
    }
  }
  return best
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
async function frameInfo(id: string): Promise<{ thumb: string; angle?: number }> {
  const body = await mapillaryApi(`https://graph.mapillary.com/${id}?fields=thumb_1024_url,computed_compass_angle`) as { thumb_1024_url?: string; computed_compass_angle?: number } | null
  return { thumb: body?.thumb_1024_url ?? '', angle: body?.computed_compass_angle }
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
const blocked = (from: [number, number], to: [number, number], blockers: [number, number][][]): boolean => {
  const K = 0.79
  const cross = (ax: number, az: number, bx: number, bz: number): number => ax * bz - az * bx
  const x0 = (from[1]) * K
  const z0 = from[0]
  const x1 = (to[1]) * K
  const z1 = to[0]
  for (const r of blockers) {
    for (let i = 0; i < r.length; i++) {
      const a = r[i]
      const b = r[(i + 1) % r.length]
      const ax = a[1] * K
      const az = a[0]
      const bx = b[1] * K
      const bz = b[0]
      const d1 = cross(x1 - x0, z1 - z0, ax - x0, az - z0)
      const d2 = cross(x1 - x0, z1 - z0, bx - x0, bz - z0)
      const d3 = cross(bx - ax, bz - az, x0 - ax, z0 - az)
      const d4 = cross(bx - ax, bz - az, x1 - ax, z1 - az)
      if (((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))) return true
    }
  }
  return false
}

export async function mapillary(lat: number, lon: number, radius = 60, height = 0, ring: [number, number][] = [],
                                blockers: [number, number][][] = []): Promise<Photo[]> {
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
  const scored: (Photo & { id: string; pano: boolean; want: number; lat?: number; lon?: number })[] = []
  for (const f of frames) {
    /*
     * Point at the CENTROID, but measure to the nearest WALL.
     *
     * Aiming at the nearest corner seemed the obvious improvement and was badly wrong: for a long building the
     * nearest corner is its END, so the view swings along the facade and off the building altogether. The
     * centroid is what centres a building in frame. The distance is a different question — it decides how far
     * up to tilt and which frames are a good stand-off — and there the nearest wall is right, because that is
     * the surface we can actually see.
     */
    /*
     * 360 frames ONLY. A flat frame cannot be re-aimed: we get whatever the camera happened to point at, which
     * in practice is a street with half a dozen buildings in it and no way to say which one is meant (user,
     * 2026-09-22: "we should just ban flat images"). A panorama contains every direction, so it can always be
     * turned to face the building and projected flat. Coverage costs a little; the alternative is handing a
     * model a picture and hoping.
     */
    if (!f.pano) continue
    const near = nearestOf(ring, f.lat, f.lon)
    // edge-on frames show the street, not the building
    if (near && near.facing < 0.5) continue
    const dist = metres([f.lat, f.lon], near?.at ?? [lat, lon])
    const aim = near?.at ?? [lat, lon] as [number, number]
    // nothing else may stand in the way (the wall we aim at is pulled a metre towards the camera so the
    // target's own footprint does not count as its own blocker)
    if (blockers.length > 0) {
      const back: [number, number] = [aim[0] + (f.lat - aim[0]) * 0.02, aim[1] + (f.lon - aim[1]) * 0.02]
      if (blocked([f.lat, f.lon], back, blockers)) continue
    }
    /*
     * Far enough back to actually SEE it. A ninety-metre tower photographed from twenty metres is a picture of
     * whatever low building you are standing beside — the ray to the tower's nearest corner is clear, so no
     * occlusion test catches it, but the tower is behind the loft in front of you. You need roughly half the
     * building's height of distance before it is in the frame at all.
     */
    if (dist < Math.max(8, height * 0.5) || dist > radius) continue
    const want = bearing([f.lat, f.lon], aim)
    const off = f.pano ? 0 : f.angle === undefined ? 90 : Math.abs(((f.angle - want + 540) % 360) - 180)
    if (off > 40) continue
    /*
     * How far away the best view is depends on how tall the building is: a 90 m tower photographed from twelve
     * metres is a picture of its doorway. Roughly the building's own height, within what a street allows.
     */
    const ideal = Math.max(20, Math.min(70, height > 0 ? height * 0.9 : 28))
    const score = off + Math.abs(dist - ideal) * 0.6 + (f.pano ? 6 : 0) + (1 - f.quality) * 20
    /*
     * An equirectangular frame runs a full turn across its width, with the camera's own heading in the middle.
     * So the building sits at a known fraction of the way round, and the strip can be cut down to it — which
     * turns "the building is somewhere in this fisheye" into an ordinary photograph of a facade.
     */
    scored.push({ source: 'mapillary', url: '', ref: `mapillary:${f.id}${f.pano ? ' (360)' : ''}`, distance: Math.round(dist), off: Math.round(off), score: Math.round(score), id: f.id, pano: f.pano, want, lat: f.lat, lon: f.lon })
  }
  scored.sort((a, b) => a.score! - b.score!)
  /*
   * Spread the candidates out. The best-scoring frames are nearly always consecutive shots from one car going
   * past, metres apart — so if a street tree hides the building in the first, it hides it in all of them, and
   * we hand over four pictures of a tree (user, 2026-09-22: "it didn't work at all since a tree is in the
   * way"). Taking the best frame from each of several SEPARATE viewpoints gives a real second chance: an
   * obstruction belongs to where the camera stood, not to the building.
   */
  const apart: typeof scored = []
  for (const c of scored) {
    if (apart.length === 0) { apart.push(c); continue }
    /*
     * Far enough apart to see past a tree, but looking from the SAME SIDE. Two cameras on opposite sides of a
     * block both have a perfectly good bearing to its centroid, and each sees whatever building stands in
     * front of it from where it is — so a pair chosen on distance alone came back as two different buildings
     * (user, 2026-09-22: "we're sending in two images, but they are completely different directions"). The
     * bearing to the target is what says which side you are on: within 50 degrees is a second look at the
     * same facade, beyond that is a different elevation or a different building altogether.
     */
    const first = apart[0]
    const turned = Math.abs(((c.want - first.want + 540) % 360) - 180)
    if (turned > 50) continue
    if (apart.every((k) => metres([k.lat!, k.lon!], [c.lat!, c.lon!]) > 18)) apart.push(c)
    if (apart.length >= 4) break
  }
  const out: Photo[] = []
  for (const p of apart) {
    const info = await frameInfo(p.id)
    if (!info.thumb) continue
    // the corrected heading decides where in the strip the building is; without one a pano cannot be cut
    /*
     * x/W maps to azimuth = heading + (x/W - 1/2) * 360, so the building sits at (want - heading) degrees from
     * the middle of the strip. Getting this sign wrong points the crop at the far side of the street, which is
     * how a church came back as the multi-storey car park opposite it.
     */
    const turn = info.angle !== undefined ? ((p.want - info.angle + 540) % 360) - 180 : undefined
    if (p.pano && turn === undefined) continue
    // a flat frame cannot be re-aimed, but we can still say where in it the building is
    out.push({ ...p, url: info.thumb, yaw: p.pano ? turn : undefined, dev: p.pano ? undefined : turn, height })
  }
  return out
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
export async function fetchPhoto(p: Photo, file: string): Promise<boolean> {
  const r = await fetch(p.url, { headers: { 'User-Agent': UA } })
  if (!r.ok) return false
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length < 4000) return false                 // an error page, not a photograph
  if (p.yaw === undefined) {
    // a flat frame keeps its own framing; all we add is the corridor, placed by the camera's field of view
    const sharp = (await import('sharp')).default
    const meta = await sharp(buf).metadata()
    writeFileSync(file, await mark(buf, meta.width ?? 0, meta.height ?? 0, p.dev))
    return true
  }
  // tilt up by about half the angle to the building's top, so a tall facade fits without pointing at sky
  const up = p.height && p.distance ? (Math.atan(p.height / p.distance) * 180) / Math.PI : 12
  const view = 768
  const flat = await rectilinear(buf, p.yaw, Math.min(40, up * 0.55), 85, view)
  const h = Math.round(view * 0.85)
  writeFileSync(file, await mark(flat, view, h))
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
async function rectilinear(pano: Buffer, yaw: number, pitch: number, fov: number, out = 768): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  const { data, info } = await sharp(pano).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width
  const H = info.height
  const ch = info.channels
  const outH = Math.round(out * 0.85)
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
                                blockers: [number, number][][] = []): Promise<Photo[]> {
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
  return mapillary(lat, lon, Math.max(radius, Math.min(90, height)), height, ring, blockers)
}

if (process.argv[1]?.endsWith('photo.ts')) {
  const [lat, lon] = [Number(process.argv[2]), Number(process.argv[3])]
  const arg = (k: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `=${f}`).split('=').slice(1).join('=')
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    console.error('usage: tools/photo.ts <lat> <lon> [--name="…"] [--height=30] [--radius=60] [--out=file.jpg]')
    process.exit(1)
  }
  if (!mapillaryToken()) console.error('(no Mapillary token — put one in .mapillary-token or MAPILLARY_TOKEN; street-level imagery is skipped)')
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
  if (out && list[0]) {
    await fetchPhoto(list[0], out)
    console.log(`\n${list[0].ref} → ${out}`)
  }
}
