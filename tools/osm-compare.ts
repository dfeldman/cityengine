/**
 * Is the local extract telling the truth? Ask Overpass and the local cut the same question, compare answers.
 *
 *   node --experimental-strip-types tools/osm-compare.ts [south west north east]
 *
 * Both sides bypass `tools/cache/` entirely, so this is a real comparison and not two readings of the same
 * file. Mismatches are classified: an id only one side has is usually the two sources' different vintage (the
 * extract is a snapshot, Overpass is live), while the SAME id with different content is the thing to worry
 * about — that would mean the local pipeline drops or mangles data.
 */
import { bridgesQuery, cityQuery, furnitureQuery, squaresQuery, stepsQuery, wideQuery, type Bbox } from './overpass.ts'
import { localAnswer } from './osm-local.ts'

const UA = 'streetrunner/0.1 (Dandyhorse exergame city baker; https://openstreetmap.org/copyright)'

interface Member { type: string; ref: number; role: string; geometry?: unknown[] }
interface El { type: string; id: number; tags?: Record<string, string>; nodes?: number[]; geometry?: unknown[]; members?: Member[] }

const ENDPOINTS = process.env.OVERPASS_URL ? [process.env.OVERPASS_URL] : [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

async function live(query: string): Promise<El[]> {
  let last = ''
  for (let round = 0; round < 3; round++) {
    for (const url of ENDPOINTS) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
          body: new URLSearchParams({ data: query }),
        })
        const body = await res.text()
        if (res.ok && body.trimStart().startsWith('{')) return (JSON.parse(body) as { elements: El[] }).elements
        last = `${new URL(url).host} ${res.status}`
      } catch (e) { last = `${new URL(url).host}: ${(e as Error).message}` }
      process.stderr.write(`  (overpass ${last}, trying the next)\n`)
    }
    await new Promise((r) => setTimeout(r, 20_000))
  }
  throw new Error(`overpass: every endpoint failed; last ${last}`)
}

const index = (els: El[]): Map<string, El> => new Map(els.map((e) => [`${e.type}/${e.id}`, e]))
const tagsEqual = (a: Record<string, string> = {}, b: Record<string, string> = {}): boolean => {
  const ka = Object.keys(a).sort()
  const kb = Object.keys(b).sort()
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k])
}

async function compare(name: string, query: (b: Bbox) => string, box: Bbox): Promise<void> {
  const q = query(box)
  const localText = localAnswer(q, null)
  if (localText === null) { process.stdout.write(`\n${name}: NOT answerable locally (falls back to Overpass)\n`); return }
  const loc = index((JSON.parse(localText) as { elements: El[] }).elements)
  const net = index(await live(q))
  process.stdout.write(`\n${name}: local ${loc.size} elements, overpass ${net.size}\n`)

  const onlyLocal = [...loc.keys()].filter((k) => !net.has(k))
  const onlyNet = [...net.keys()].filter((k) => !loc.has(k))
  const diffTags: string[] = []
  const diffNodes: string[] = []
  const diffGeom: string[] = []
  const diffMembers: string[] = []
  const diffMemberGeom: string[] = []
  for (const [k, a] of loc) {
    const b = net.get(k)
    if (!b) continue
    if (!tagsEqual(a.tags, b.tags)) diffTags.push(k)
    if ((a.nodes?.length ?? 0) !== (b.nodes?.length ?? 0)) diffNodes.push(k)
    if ((a.geometry?.length ?? 0) !== (b.geometry?.length ?? 0)) diffGeom.push(k)
    if ((a.members?.length ?? 0) !== (b.members?.length ?? 0)) diffMembers.push(k)
    // the member geometry is what outerRings() stitches a park or the Bay out of: a member that arrived
    // without its points, or with fewer of them, is the failure that would matter most and show up least
    else if ((a.members ?? []).some((m, i) => {
      const n = b.members![i]
      return m.type !== n.type || m.ref !== n.ref || m.role !== n.role || (m.geometry?.length ?? 0) !== (n.geometry?.length ?? 0)
    })) diffMemberGeom.push(k)
  }
  const byType = (ks: string[]): string => {
    const c: Record<string, number> = {}
    for (const k of ks) c[k.split('/')[0]] = (c[k.split('/')[0]] ?? 0) + 1
    return Object.entries(c).map(([t, n]) => `${n} ${t}`).join(', ') || 'none'
  }
  process.stdout.write(`  shared ${loc.size - onlyLocal.length}\n`)
  process.stdout.write(`  only local: ${byType(onlyLocal)}${onlyLocal.length ? ` e.g. ${onlyLocal.slice(0, 5).join(' ')}` : ''}\n`)
  process.stdout.write(`  only overpass: ${byType(onlyNet)}${onlyNet.length ? ` e.g. ${onlyNet.slice(0, 5).join(' ')}` : ''}\n`)
  process.stdout.write(`  same id, different tags: ${diffTags.length}${diffTags.length ? ` e.g. ${diffTags.slice(0, 5).join(' ')}` : ''}\n`)
  process.stdout.write(`  same id, different node count: ${diffNodes.length}${diffNodes.length ? ` e.g. ${diffNodes.slice(0, 5).join(' ')}` : ''}\n`)
  process.stdout.write(`  same id, different geometry length: ${diffGeom.length}${diffGeom.length ? ` e.g. ${diffGeom.slice(0, 5).join(' ')}` : ''}\n`)
  process.stdout.write(`  same id, different member count: ${diffMembers.length}${diffMembers.length ? ` e.g. ${diffMembers.slice(0, 5).join(' ')}` : ''}\n`)
  process.stdout.write(`  same id, different member geometry: ${diffMemberGeom.length}${diffMemberGeom.length ? ` e.g. ${diffMemberGeom.slice(0, 5).join(' ')}` : ''}\n`)
}

// a few blocks of Russian Hill / North Beach by default: small enough for one Overpass request
const a = process.argv.slice(2).map(Number)
const box: Bbox = a.length === 4
  ? { south: a[0], west: a[1], north: a[2], east: a[3] }
  : { south: 37.7975, west: -122.4180, north: 37.8025, east: -122.4110 }
process.stdout.write(`box ${box.south},${box.west},${box.north},${box.east}\n`)
for (const [name, q] of [['cityQuery', cityQuery], ['wideQuery', wideQuery], ['furnitureQuery', furnitureQuery],
  ['stepsQuery', stepsQuery], ['squaresQuery', squaresQuery], ['bridgesQuery', bridgesQuery]] as const) {
  await compare(name, q, box)
}
