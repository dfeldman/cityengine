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
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { photosFor, fetchPhoto, mapillaryToken, type Photo } from './photo.ts'

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
const each = Number(arg('each', '2'))

/*
 * The footprints, from the baked package: aiming at a block's centroid from the pavement opposite points at
 * the middle of the block, which is often behind the facade or down a side street.
 */
const rings = new Map<number, [number, number][]>()
try {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'public', 'cities', 'san-francisco.json'), 'utf8')) as
    { origin: { lat: number; lon: number }; buildings: { id: number; ring: number[] }[] }
  const { lat: la0, lon: lo0 } = pkg.origin
  const mLat = 111320
  const mLon = 111320 * Math.cos((la0 * Math.PI) / 180)
  for (const b of pkg.buildings) {
    const out: [number, number][] = []
    for (let i = 0; i < b.ring.length; i += 2) out.push([la0 + b.ring[i + 1] / mLat, lo0 + b.ring[i] / mLon])
    rings.set(b.id, out)
  }
  /*
   * NOT DONE: an occlusion test. `rings` holds every footprint in the city, which is what a line-of-sight
   * check from the camera to the facade would need — a tower hidden behind a loft is not a photograph of the
   * tower. The aiming fixes (nearest edge rather than centroid or vertex) cut the wrong-image rate to 0-1 in
   * 20 on their own, so this was never built; `wrong-image` in the queue is the fallback. Start here.
   */
} catch { /* no package yet: fall back to the centroid */ }

/**
 * Footprints the package does not have — the bake replaces a building's outline with its parts, so the id on
 * the list is often gone from it. Overpass has them all, one request for the whole batch, kept on disk.
 */
async function ringsFromOsm(ids: string[]): Promise<void> {
  const want = ids.filter((i) => !rings.has(Number(i.split('/')[1])))
  if (want.length === 0) return
  const key = createHash('sha1').update(want.join(',')).digest('hex')
  const cacheDir = resolve(ROOT, 'tools', 'cache')
  mkdirSync(cacheDir, { recursive: true })
  const file = resolve(cacheDir, `rings-${key}.json`)
  let body: { elements?: { id: number; geometry?: { lat: number; lon: number }[]; members?: { role?: string; geometry?: { lat: number; lon: number }[] }[] }[] }
  if (existsSync(file)) body = JSON.parse(readFileSync(file, 'utf8'))
  else {
    /*
     * Ways AND relations. A relation is OSM's multipolygon — a building with a courtyard, or a complex mapped
     * in several pieces — and City Hall, the Marriott Marquis and the State of California Building are all
     * relations. Asking only for ways left them with no footprint at all, so they fell back to centroid
     * aiming: the exact failure that made a photograph show the building opposite.
     */
    const ways = want.filter((i) => i.startsWith('way/')).map((i) => i.split('/')[1])
    const rels = want.filter((i) => i.startsWith('relation/')).map((i) => i.split('/')[1])
    const parts = [ways.length ? `way(id:${ways.join(',')});` : '', rels.length ? `relation(id:${rels.join(',')});` : ''].join('')
    const q = `[out:json][timeout:90];(${parts});out geom;`
    const r = await fetch('https://overpass.kumi.systems/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(q)}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    if (!r.ok) { console.log(`  (overpass ${r.status}: aiming at centroids)`); return }
    const text = await r.text()
    if (!text.startsWith('{')) { console.log('  (overpass busy: aiming at centroids)'); return }
    writeFileSync(file, text)
    body = JSON.parse(text)
  }
  for (const e of body.elements ?? []) {
    if (e.geometry) { rings.set(e.id, e.geometry.map((g) => [g.lat, g.lon] as [number, number])); continue }
    // a relation carries its shape on its members; the OUTER ones are the building's own walls
    const outer = (e.members ?? []).filter((m) => m.role !== 'inner' && m.geometry)
    if (outer.length === 0) continue
    const ring: [number, number][] = []
    for (const m of outer) for (const g of m.geometry ?? []) ring.push([g.lat, g.lon])
    if (ring.length >= 3) rings.set(e.id, ring)
  }
}

const queue = readFileSync(resolve(ROOT, 'docs', 'sf-queue.csv'), 'utf8').split('\n').slice(1).filter(Boolean).map(cells)
const one = arg('osm')
const stage = arg('stage', 'haiku')
// `--skip` cuts later slices of the same stage: the queue does not change until a batch has been logged, so
// several batches have to be carved out of one snapshot
const skip = Number(arg('skip', '0'))
const want = one ? queue.filter((r) => r[0] === one)
  : queue.filter((r) => r[8] === stage).slice(skip, skip + Number(arg('limit', '20')))

if (!mapillaryToken()) console.log('(no Mapillary token — Commons only, which has poor coverage of ordinary buildings)\n')

await ringsFromOsm(want.map((r) => r[0]))

const rows = ['osm,name,lat,lon,height,files,sources']
let hits = 0
for (const r of want) {
  const [osm, name, , lat, lon, height] = [r[0], r[1].replace(/^"|"$/g, ''), r[2], Number(r[3]), Number(r[4]), r[5]]
  let list: Photo[] = []
  try { list = await photosFor(lat, lon, name, Number(arg('radius', '60')), Number(height) || 0, rings.get(Number(osm.split('/')[1])) ?? []) } catch (e) { console.log(`  ${osm}: ${String(e)}`) }
  const saved: string[] = []
  for (const p of list.slice(0, each)) {
    const file = `${osm.replace('/', '-')}${saved.length === 0 ? '' : `-${saved.length + 1}`}.jpg`
    // an image already on disk is never fetched again, and there is a pause between the ones that are
    if (existsSync(resolve(dir, file))) { saved.push(file); continue }
    try {
      await new Promise((ok) => setTimeout(ok, Number(process.env.PHOTO_GAP ?? 400)))
      if (await fetchPhoto(p, resolve(dir, file))) saved.push(file)
    } catch { /* the next candidate */ }
  }
  if (saved.length > 0) hits++
  rows.push([osm, `"${name}"`, lat, lon, height, `"${saved.join(' ')}"`, `"${list.slice(0, each).map((p) => `${p.source}:${p.ref}`).join(' | ')}"`].join(','))
  console.log(`${saved.length > 0 ? '✓' : '·'} ${osm.padEnd(17)} ${String(height).padStart(4)} m  ${saved.join(' ') || '(nothing)'}  ${name}`)
}
writeFileSync(resolve(dir, 'photos.csv'), rows.join('\n') + '\n')

/*
 * The batch list the model works from, written here so it can never drift from the photographs that were
 * actually fetched. The size column says UNKNOWN where OSM surveyed neither a height nor a storey count — for
 * those, and only those, the model is asked to count the floors in the picture.
 */
const list = arg('list')
if (list) {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'public', 'cities', 'san-francisco.json'), 'utf8')) as
    { buildings: { id: number; style?: string; archetype?: string }[] }
  const byId = new Map(pkg.buildings.map((b) => [b.id, b]))
  const md = [`# ${list}: ${want.length} buildings, ${each} photographs each\n`,
    'Follow docs/sf-batches/BRIEF-REFACE.md exactly. The photographs are in the directory named below; open',
    'ALL of each row\'s files. They are taken from viewpoints at least 18 m apart on the same side of the',
    'building, so where one is spoiled by a tree or a lorry the other usually is not.\n',
    `Photographs: \`${dir.replace(ROOT + '/', '')}\`\n`,
    '| # | osm | name | size | archetype | style now | photos |', '|---|---|---|---|---|---|---|']
  rows.slice(1).forEach((r, i) => {
    const c = r.split(',')
    const b = byId.get(Number(c[0].split('/')[1]))
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
