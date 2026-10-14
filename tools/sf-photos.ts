/**
 * Fetch the reference photographs for a batch, before any model is asked to look at them.
 *
 * Searching and judging were one job, and it went wrong: a refacing pass reported buildings "confirmed" against
 * Commons files that do not exist (2026-09-22). Finding a picture is mechanical, so it belongs in a tool; the
 * only thing a model should be asked to do is look at an image on disk and answer a question about it. That
 * also makes the hit rate a measured fact rather than something reported.
 *
 *   node --experimental-strip-types tools/sf-photos.ts --stage=haiku --limit=20 --out=<dir>
 *   node --experimental-strip-types tools/sf-photos.ts --osm=way/123 --out=<dir>
 *
 * Writes <dir>/<osm>.jpg (up to `--each` candidates as <osm>-2.jpg …) and <dir>/photos.csv listing what was
 * found for each building, including the ones with nothing — which are as much a result as the hits.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { photosFor, fetchPhoto, mapillaryToken, type Photo, type Blocker } from './photo.ts'
import { resolveOsm } from './osm-shape.ts'
import { readPackage } from './bake-files.ts'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')

const cells = (line: string): string[] => {
  const out: string[] = []
  let cur = ''
  let q = false
  for (const ch of line) {
    if (ch === '"') q = !q
    else if (ch === ',' && !q) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

const dir = arg('out', resolve(ROOT, 'docs', 'shots', 'refs'))
mkdirSync(dir, { recursive: true })
/*
 * Eight to twelve, not two. The owner found ten usable shots of a building this tool called unphotographable
 * (2026-09-22): one bad pick sinks a building, and a modelling agent can discard eight pictures in a moment
 * but cannot recover a good one our scoring silently dropped.
 */
const each = Number(arg('each', '10'))

/*
 * The footprints, from the baked package: aiming at a block's centroid from the pavement opposite points at
 * the middle of the block, which is often behind the facade or down a side street.
 */
const rings = new Map<number, [number, number][]>()
/** what the bake or OSM knows about a building the queue has never heard of: name and height */
const meta = new Map<number, { name: string; height: number }>()

/*
 * EVERY OTHER BUILDING IN THE CITY, indexed so a neighbour can be found without walking a hundred thousand
 * footprints. This is what the occlusion test needs and never had: `photo.ts` has carried a `blockers`
 * argument since it was written and nothing ever passed one, so every occlusion term in it was dead code and
 * "the building we want is hidden behind another building" went uncaught. The grid is 100 m cells in the
 * package's own metre space, and `fringe[]` counts as much as `buildings[]` — a fringe block opposite is just
 * as solid as a modelled one.
 */
const CELL = 100
const grid = new Map<string, { ring: [number, number][]; xy: [number, number][]; height: number; id: number }[]>()
const cellKey = (x: number, y: number): string => `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`
/** the package's own metre frame, so a lat/lon can be placed in the grid above */
let pkgOrigin: { la: number; lo: number; mLat: number; mLon: number } | null = null
try {
  // the bake-private package (tools/bake-files.ts), checked fresh: a stale one is refused, not used
  const pkg = readPackage('san-francisco') as unknown as
    { origin: { lat: number; lon: number }
      buildings: { id: number; ring: number[]; height?: number; name?: string }[]
      fringe?: { id: number; ring: number[]; height?: number }[] }
  const { lat: la0, lon: lo0 } = pkg.origin
  const mLat = 111320
  const mLon = 111320 * Math.cos((la0 * Math.PI) / 180)
  pkgOrigin = { la: la0, lo: lo0, mLat, mLon }
  const index = (b: { id: number; ring: number[]; height?: number }, named: boolean, name?: string): void => {
    const out: [number, number][] = []
    const xy: [number, number][] = []
    for (let i = 0; i < b.ring.length; i += 2) {
      out.push([la0 + b.ring[i + 1] / mLat, lo0 + b.ring[i] / mLon])
      xy.push([b.ring[i], b.ring[i + 1]])
    }
    if (out.length < 3) return
    if (named) { rings.set(b.id, out); meta.set(b.id, { name: name ?? '', height: b.height ?? 0 }) }
    const e = { ring: out, xy, height: b.height ?? 0, id: b.id }
    const cells = new Set<string>()
    for (const p of xy) cells.add(cellKey(p[0], p[1]))
    for (const k of cells) (grid.get(k) ?? grid.set(k, []).get(k)!).push(e)
  }
  for (const b of pkg.buildings) index(b, true, b.name)
  for (const b of pkg.fringe ?? []) index(b, false)
} catch (e) {
  // no package yet, or a stale one: fall back to the centroid, and to no occlusion test — but say so
  console.warn(`no occlusion test: ${(e as Error).message}`)
}

/**
 * The neighbours that could stand between a camera and this building.
 *
 * Two of them are not neighbours at all and have to go, or a building occludes ITSELF: the bake replaces an
 * outline with its PARTS under different ids, so One Maritime Plaza's podium is in the package as a separate
 * footprint inside the target's own ring, and would otherwise be found hiding the tower that stands on it.
 * Containment either way is the test, because the split can go in either direction.
 */
const inside = (p: [number, number], ring: [number, number][]): boolean => {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    if ((ring[i][0] > p[0]) !== (ring[j][0] > p[0]) &&
        p[1] < ((ring[j][1] - ring[i][1]) * (p[0] - ring[i][0])) / (ring[j][0] - ring[i][0]) + ring[i][1]) hit = !hit
  }
  return hit
}

const blockersNear = (id: number, target: [number, number][], la: number, lo: number, reach: number): Blocker[] => {
  if (grid.size === 0 || target.length < 3 || !pkgOrigin) return []
  const mid: [number, number] = [target.reduce((s, p) => s + p[0], 0) / target.length,
                                 target.reduce((s, p) => s + p[1], 0) / target.length]
  const x0 = (lo - pkgOrigin.lo) * pkgOrigin.mLon
  const y0 = (la - pkgOrigin.la) * pkgOrigin.mLat
  const out: Blocker[] = []
  const seen = new Set<number>()
  const r = Math.ceil((reach + CELL) / CELL)
  const cx = Math.floor(x0 / CELL)
  const cy = Math.floor(y0 / CELL)
  for (let i = -r; i <= r; i++) {
    for (let j = -r; j <= r; j++) {
      for (const e of grid.get(`${cx + i},${cy + j}`) ?? []) {
        if (e.id === id || seen.has(e.id)) continue
        seen.add(e.id)
        if (e.height <= 3) continue
        const c: [number, number] = [e.ring.reduce((s, p) => s + p[0], 0) / e.ring.length,
                                     e.ring.reduce((s, p) => s + p[1], 0) / e.ring.length]
        if (inside(c, target) || inside(mid, e.ring)) continue      // a part of the target itself, not a neighbour
        out.push({ ring: e.ring, height: e.height })
      }
    }
  }
  return out
}

/**
 * Footprints the package does not have — the bake replaces a building's outline with its parts, so the id on
 * the list is often gone from it. The lookup itself (Overpass for the batch, the OSM API when it answers 429,
 * both cached) now lives in `tools/osm-shape.ts`, because `tools/commons.ts` needs exactly the same thing and
 * cannot import this file: it reads the queue and starts fetching the moment it loads.
 */
async function ringsFromOsm(ids: string[]): Promise<void> {
  const want = ids.filter((i) => !rings.has(Number(i.split('/')[1])))
  if (want.length === 0) return
  for (const [id, shape] of await resolveOsm(want)) {
    const n = Number(id.split('/')[1])
    /*
     * The tags come back with the geometry, and for a building the queue has never heard of they are the only
     * source of a name and a height. `height` where surveyed, otherwise storeys at 3.2 m — the same fallback
     * the bake uses. Without a height the tilt cannot know how far up the roofline is.
     */
    const t = shape.tags
    const lv = Number(t['building:levels'])
    meta.set(n, {
      name: t.name ?? '',
      height: Number(t.height) || Number(t['building:height']) || (Number.isFinite(lv) && lv > 0 ? lv * 3.2 : 0) || meta.get(n)?.height || 0,
    })
    if (shape.ring.length >= 3) rings.set(n, shape.ring)
  }
}

const queue = readFileSync(resolve(ROOT, 'docs', 'sf-queue.csv'), 'utf8').split('\n').slice(1).filter(Boolean).map(cells)
const one = arg('osm')
const stage = arg('stage', 'haiku')
// `--skip` cuts later slices of the same stage: the queue does not change until a batch has been logged, so
// several batches have to be carved out of one snapshot
const skip = Number(arg('skip', '0'))
/*
 * `--osm=` USED TO BE A QUEUE FILTER, which was exactly backwards: it looked the id up in docs/sf-queue.csv
 * and silently printed "0 of 0 buildings" for anything not already queued — that is, for every building we
 * are ADDING and most want a reference for. Now a queued id still uses its queue row (which carries the
 * stage and the surveyed height), and an unqueued one is looked up from the bake or from Overpass. The batch
 * modes (--stage=, --limit=) read the queue as before.
 */
let want = one ? queue.filter((r) => r[0] === one)
  : queue.filter((r) => r[8] === stage).slice(skip, skip + Number(arg('limit', '20')))

if (!mapillaryToken()) console.log('(no Mapillary token — Commons only, which has poor coverage of ordinary buildings)\n')

await ringsFromOsm(one && want.length === 0 ? [one] : want.map((r) => r[0]))

if (one && want.length === 0) {
  const id = Number(one.split('/')[1])
  const ring = rings.get(id)
  if (!ring || ring.length < 3) {
    console.error(`${one}: no footprint — not in the bake, and Overpass returned nothing for it`)
    process.exit(1)
  }
  // the centroid of the vertices: good enough to seed the search, and every frame then aims at the nearest wall
  const la = ring.reduce((s, p) => s + p[0], 0) / ring.length
  const lo = ring.reduce((s, p) => s + p[1], 0) / ring.length
  const m = meta.get(id) ?? { name: '', height: 0 }
  // the same eleven columns a queue row has, so everything downstream is unchanged
  want = [[one, m.name, '', String(la), String(lo), String(Math.round(m.height)), '', '', stage, '', '']]
  console.log(`${one}: not in the queue — ${m.name || '(unnamed)'}, ${Math.round(m.height)} m, from ${ring.length} OSM vertices\n`)
}

/*
 * ONE ROW PER IMAGE. With a dozen frames a building, "which of these is which" is the whole question, and a
 * single packed cell could not answer it. `rank` is the order (01 is the best-scoring), `bearing` says which
 * side of the building the camera stood on — frames sharing a bearing share an elevation, and share a tree —
 * and `score` is kept because some frames ARE junk and saying so beats dropping them (user, 2026-09-22:
 * "some images won't work… but I bet we can get a few good shots of any building (along with some junk)").
 */
/*
 * `visible`, `framed` and `fill` are the simulation's own verdict on each frame, recorded so a reader can see
 * WHY a frame was ranked where it was: how much of the building's height clears its neighbours, how much of
 * the silhouette the chosen cut holds, and how much of the picture the building occupies.
 */
const rows = ['osm,name,lat,lon,height,rank,file,distance,bearing,score,visible,framed,fill,sfm,ref']
const byBuilding = new Map<string, { name: string; height: string; files: string[] }>()
let hits = 0
for (const r of want) {
  const [osm, name, , lat, lon, height] = [r[0], r[1].replace(/^"|"$/g, ''), r[2], Number(r[3]), Number(r[4]), r[5]]
  let list: Photo[] = []
  const id = Number(osm.split('/')[1])
  const ring = rings.get(id) ?? []
  const h = Number(height) || 0
  const blockers = blockersNear(id, ring, lat, lon, Math.max(120, Math.min(260, h * 1.8)))
  try { list = await photosFor(lat, lon, name, Number(arg('radius', '60')), h, ring, blockers) } catch (e) { console.log(`  ${osm}: ${String(e)}`) }
  const saved: string[] = []
  for (const p of list.slice(0, each)) {
    // zero-padded and in rank order, so a directory listing IS the ranking
    const file = `${osm.replace('/', '-')}-${String(saved.length + 1).padStart(2, '0')}.jpg`
    /*
     * ALWAYS re-render, never skip an existing file. Skipping used to save a download; now that the panorama
     * bytes are cached by frame id it saves only a second of reprojection, and it was quietly poisonous: the
     * ranking changes between runs, so `-03.jpg` left over from a previous run would be kept while the CSV
     * row beside it described a DIFFERENT frame's distance, bearing and reference. That is precisely the
     * "reference written from memory rather than from a result" failure the rest of this pipeline is built to
     * prevent, and the default output directory is reused by every batch.
     */
    let ok = false
    try {
      await new Promise((go) => setTimeout(go, Number(process.env.PHOTO_GAP ?? 400)))
      ok = await fetchPhoto(p, resolve(dir, file))
    } catch { /* the next candidate */ }
    if (!ok) continue
    saved.push(file)
    rows.push([osm, `"${name}"`, lat, lon, height, String(saved.length).padStart(2, '0'), file,
      String(p.distance ?? ''), String(Math.round(p.want ?? 0)), String(p.score ?? ''),
      String(p.vis ?? ''), String(p.framed ?? ''), String(p.fill ?? ''), p.fixed ? 'sfm' : 'raw', `"${p.ref}"`].join(','))
  }
  if (saved.length > 0) hits++
  else rows.push([osm, `"${name}"`, lat, lon, height, '', '', '', '', '', '', '', '', '', '"(nothing)"'].join(','))
  byBuilding.set(osm, { name, height, files: saved })
  console.log(`${saved.length > 0 ? '✓' : '·'} ${osm.padEnd(17)} ${String(height).padStart(4)} m  ${saved.length} frames  ${name}`)
}
writeFileSync(resolve(dir, 'photos.csv'), rows.join('\n') + '\n')

/*
 * The batch list the model works from, written here so it can never drift from the photographs that were
 * actually fetched. The size column says UNKNOWN where OSM surveyed neither a height nor a storey count — for
 * those, and only those, the model is asked to count the floors in the picture.
 */
const list = arg('list')
if (list) {
  const pkg = readPackage('san-francisco') as unknown as { buildings: { id: number; style?: string; archetype?: string }[] }
  const byId = new Map(pkg.buildings.map((b) => [b.id, b]))
  const md = [`# ${list}: ${want.length} buildings, up to ${each} photographs each\n`,
    'Follow docs/sf-batches/BRIEF-REFACE.md exactly. The photographs are in the directory named below; open',
    'ALL of each row\'s files, in order — `-01` is the best-scoring frame. They are taken from viewpoints at',
    'least 15 m apart, the first ones from the same side of the building and the later ones from other',
    'elevations, so where one is spoiled by a tree or a lorry the others usually are not. **Some frames will',
    'be junk** — the wrong building, or a van in the way. Discard those and use the ones that are good;',
    'photos.csv gives each frame\'s distance, bearing and score, plus `visible` (how much of the',
    'building\'s height clears its neighbours) and `framed` (how much of it the cut holds) — those',
    'two are the columns to read first.\n',
    `Photographs: \`${dir.replace(ROOT + '/', '')}\`\n`,
    '| # | osm | name | size | archetype | style now | photos |', '|---|---|---|---|---|---|---|']
  Array.from(byBuilding.entries()).forEach(([osm, v], i) => {
    const c = [osm, `"${v.name}"`, '', '', v.height, v.files.join(' ')]
    const b = byId.get(Number(osm.split('/')[1]))
    /*
     * The row carries the warning, not just the brief. Street-level imagery photographs a tall building badly
     * — it does not fit in the frame and is usually behind something shorter — so above 60 m the picture is a
     * check on a web search rather than the evidence itself. We still fetch it: it is cheap, and sometimes it
     * is fine. But the caveat has to be in front of whoever reads the row.
     */
    const m = Number(c[4])
    const h = m <= 0 ? '**UNKNOWN — count the floors**'
      : m >= 60 ? `${m} m — **TALL: street views often show the wrong building, search the web first**`
      : `${m} m`
    md.push(`| ${i + 1} | ${c[0]} | ${c[1].replace(/"/g, '') || '(unnamed)'} | ${h} | ${b?.archetype ?? '?'} | ${b?.style ?? '?'} | ${c[5].replace(/"/g, '')} |`)
  })
  writeFileSync(resolve(ROOT, 'docs', 'sf-batches', `${list}.md`), md.join('\n') + '\n')
  console.log(`docs/sf-batches/${list}.md`)
}
console.log(`\n${hits} of ${want.length} buildings have a photograph → ${dir}`)
