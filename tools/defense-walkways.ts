/**
 * La Défense's walkways, listed ahead of the bake (owner, 2026-11-17: "we may need to mark walkways as overpasses ahead of time,
 * since there are many of them and they are all a bit unique"). Draws data/defense-walkways.json from OSM and the lidar:
 *
 *   npx tsx tools/defense-walkways.ts [--keep]     (--keep: entries marked "checked": true are left as they are)
 *
 * One entry per walkway: OSM footways tagged bridge=*, grouped where they share a node. Each way's profile is the IGN LiDAR HD
 * surface model (MNS, the deck top) at its nodes, NGF metres; the bare-earth MNT beside it says what it stands over. A node where
 * the MNS is not over the MNT by WALK_MIN_CLEAR (a tree's shadow, a gap in the survey, the deck meeting the dalle) takes the
 * way's median instead. `review` lists what looks doubtful. The bake (tools/bake.ts, applyWalkways in tools/defense-decks.ts)
 * lays the listed ways at these heights, in its own datum, and marks them bridges; the renderer draws each in its `style`.
 * Hand edits: set `style`, fix `deck`, add `"checked": true` so a re-run keeps the entry.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ignLidar, MNS_LAYER } from './ign-lidar.ts'

// tunables
const BOX = { south: 48.884, north: 48.898, west: 2.225, east: 2.256 }
const LIDAR_PX = 1024            // a 0.01° tile at ≈0.7–1.1 m
const WALK_MIN_CLEAR = 2.5       // a deck node the MNS puts less than this over the MNT is not trusted
const WALK_SPREAD = 6            // a way whose trusted nodes spread more than this is reviewed (a ramp may rise a few m)
const WALK_MAX_CLEAR = 16       // …or more than this: the MNS saw a roof over the walkway (a tower above it), not its deck
const WALK_LOW = 3               // a walkway whose deck is under this over the ground is reviewed (is it a bridge at all?)
const FOOT = /^(footway|path|pedestrian|steps|cycleway|corridor)$/

const ROOT = resolve(import.meta.dirname, '..')
const PBF = resolve(ROOT, 'tools/cache/osm/ile-de-france-latest.osm.pbf')
const OUT = resolve(ROOT, 'data/defense-walkways.json')
const TMP = resolve(ROOT, 'tools/cache/defense-walkways')

export type WalkStyle = 'slab' | 'steel' | 'glazed' | 'timber'
export interface WalkWay { id: number; name?: string; layer?: number; nodes: [number, number, number][] } // [lat, lon, NGF deck top]
export interface Walkway { name: string; style: WalkStyle; checked?: boolean; review?: string[]; ways: WalkWay[] }

function styleOf(t: Record<string, string>): WalkStyle {
  if (t.covered === 'yes' || t.indoor === 'yes' || t.highway === 'corridor') return 'glazed'
  if (/steel|metal|iron/.test(`${t['bridge:structure'] ?? ''} ${t.material ?? ''} ${t['bridge:material'] ?? ''}`)) return 'steel'
  if (t.surface === 'wood' || t.material === 'wood') return 'timber'
  return 'slab'
}

const median = (v: number[]): number => { const s = [...v].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2 }

async function main(): Promise<void> {
  mkdirSync(TMP, { recursive: true })
  const cut = resolve(TMP, 'box.osm.pbf'), seq = resolve(TMP, 'foot.geojsonseq')
  execFileSync('osmium', ['extract', '-b', `${BOX.west},${BOX.south},${BOX.east},${BOX.north}`, PBF, '-o', cut, '--overwrite'], { stdio: 'ignore' })
  const flt = resolve(TMP, 'bridges.osm.pbf')
  execFileSync('osmium', ['tags-filter', cut, 'w/bridge', '-o', flt, '--overwrite'], { stdio: 'ignore' })
  execFileSync('osmium', ['export', flt, '-f', 'geojsonseq', '-a', 'id', '-o', seq, '--overwrite', '--geometry-types=linestring'], { stdio: 'ignore' })
  const ways: { id: number; tags: Record<string, string>; coords: [number, number][] }[] = []
  for (const line of readFileSync(seq, 'utf8').split('\n')) {
    const s = line.replace(/^\x1e/, '').trim()
    if (!s) continue
    const f = JSON.parse(s)
    const tags = f.properties as Record<string, string>
    if (!FOOT.test(tags.highway ?? '') || tags.bridge === 'no') continue
    ways.push({ id: Number(String(f.properties['@id'] ?? f.id).replace(/\D/g, '')), tags, coords: f.geometry.coordinates })
  }
  console.log(`${ways.length} foot bridge ways in the box`)

  const mns = await ignLidar(BOX, LIDAR_PX, MNS_LAYER)
  const mnt = await ignLidar(BOX, LIDAR_PX)

  // group by shared end coordinates (a node's lon,lat to 1e-7)
  const k = (c: [number, number]): string => `${c[0].toFixed(7)},${c[1].toFixed(7)}`
  const parent = ways.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const byNode = new Map<string, number>()
  ways.forEach((w, i) => { for (const c of w.coords) { const j = byNode.get(k(c)); if (j === undefined) byNode.set(k(c), i); else parent[find(i)] = find(j) } })
  const groups = new Map<number, number[]>()
  ways.forEach((_, i) => { const r = find(i); (groups.get(r) ?? groups.set(r, []).get(r)!).push(i) })

  const old: Walkway[] = existsSync(OUT) && process.argv.includes('--keep') ? JSON.parse(readFileSync(OUT, 'utf8')).walkways : []
  const kept = new Map<number, Walkway>()
  for (const w of old) if (w.checked) for (const x of w.ways) kept.set(x.id, w)

  const out: Walkway[] = [...new Set(kept.values())]
  for (const idx of groups.values()) {
    if (idx.some((i) => kept.has(ways[i].id))) continue
    const review: string[] = []
    const wws: WalkWay[] = idx.map((i) => {
      const w = ways[i]
      const raw = w.coords.map(([lon, lat]) => ({ lat, lon, top: mns.at(lat, lon), g: mnt.at(lat, lon) }))
      const good = raw.filter((r) => r.top !== null && r.g !== null && r.top - r.g >= WALK_MIN_CLEAR && r.top - r.g <= WALK_MAX_CLEAR).map((r) => r.top!)
      const fill = good.length ? median(good) : NaN
      if (!good.length) review.push(`w${w.id}: no lidar node over the ground; deck unknown`)
      else if (Math.max(...good) - Math.min(...good) > WALK_SPREAD) review.push(`w${w.id}: deck spreads ${(Math.max(...good) - Math.min(...good)).toFixed(1)} m`)
      const clear = median(raw.filter((r) => r.g !== null).map((r) => (r.top !== null && r.top - r.g! >= WALK_MIN_CLEAR && r.top - r.g! <= WALK_MAX_CLEAR ? r.top : fill) - r.g!))
      if (Number.isFinite(clear) && clear < WALK_LOW) review.push(`w${w.id}: only ${clear.toFixed(1)} m over the ground`)
      return {
        id: w.id, ...(w.tags.name ? { name: w.tags.name } : {}), ...(w.tags.layer ? { layer: Number(w.tags.layer) } : {}),
        nodes: raw.map((r) => [+r.lat.toFixed(7), +r.lon.toFixed(7), +((r.top !== null && r.g !== null && r.top - r.g >= WALK_MIN_CLEAR && r.top - r.g <= WALK_MAX_CLEAR ? r.top : fill)).toFixed(2)] as [number, number, number]),
      }
    })
    const styles = idx.map((i) => styleOf(ways[i].tags))
    const named = idx.map((i) => ways[i].tags.name).find(Boolean)
    const [lon, lat] = ways[idx[0]].coords[0]
    out.push({ name: named ?? `walkway @${lat.toFixed(5)},${lon.toFixed(5)}`, style: styles.includes('glazed') ? 'glazed' : styles.includes('steel') ? 'steel' : styles[0], ...(review.length ? { review } : {}), ways: wws })
  }
  writeFileSync(OUT, JSON.stringify({ about: 'tools/defense-walkways.ts; heights NGF (IGN69) deck tops', walkways: out }, null, 1) + '\n')
  console.log(`${out.length} walkways (${out.filter((w) => w.review).length} to review) → data/defense-walkways.json`)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
